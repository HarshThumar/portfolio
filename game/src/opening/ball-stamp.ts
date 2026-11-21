import * as THREE from 'three/webgpu';
import { float, smoothstep, texture, uniform, uv, vec3 } from 'three/tsl';

// The maker's stamp (docs/03): gold foil pressed into one quarter of the ball, the way a Test
// ball carries its maker's mark. Our own design: an "HT" monogram in a double ring with
// "HARSH THUMAR" round the top, "TEST" round the bottom and a star either side.

const SIZE = 1024;
const CAP_ANGLE = 0.56;
const DISPLAY_FONT = "'Alfa Slab One', Georgia, serif";

export interface BallStamp {
  group: THREE.Group;
  /** 0→1: the foil presses in, then a light sweep runs across it. */
  setStamp: (p: number) => void;
  dispose: () => void;
}

function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  radius: number,
  onTop: boolean,
  spacing: number
): void {
  const widths = [...text].map((ch) => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  // Canvas angles run clockwise from +x. Top text reads clockwise, bottom text anticlockwise,
  // so both read left to right the right way up.
  const dir = onTop ? 1 : -1;
  let angle = (onTop ? -Math.PI / 2 : Math.PI / 2) - (dir * total) / (2 * radius);
  [...text].forEach((ch, i) => {
    const w = widths[i]!;
    const a = angle + (dir * (w - spacing)) / (2 * radius);
    ctx.save();
    ctx.translate(SIZE / 2 + Math.cos(a) * radius, SIZE / 2 + Math.sin(a) * radius);
    ctx.rotate(a + (dir * Math.PI) / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += (dir * w) / radius;
  });
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function ring(ctx: CanvasRenderingContext2D, r: number, width: number): void {
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, r, 0, Math.PI * 2);
  ctx.stroke();
}

/** White = foil, black = bare leather; used as the foil's alpha. */
function drawStamp(ctx: CanvasRenderingContext2D): void {
  const c = SIZE / 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ring(ctx, 470, 16);
  ring(ctx, 440, 5);
  ring(ctx, 318, 7);
  ring(ctx, 300, 3);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `68px ${DISPLAY_FONT}`;
  drawArcText(ctx, 'HARSH THUMAR', 378, true, 10);
  drawArcText(ctx, 'TEST', 378, false, 22);
  drawStar(ctx, c - 378, c, 26);
  drawStar(ctx, c + 378, c, 26);

  ctx.font = `300px ${DISPLAY_FONT}`;
  ctx.fillText('HT', c, c + 18);
}

/** A spherical cap facing +Z, with UVs laid flat across it so the canvas sits undistorted. */
function createCapGeometry(radius: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, 64, 20, 0, Math.PI * 2, 0, CAP_ANGLE);
  geo.rotateX(Math.PI / 2);
  const pos = geo.getAttribute('position');
  const uvs = geo.getAttribute('uv');
  const half = radius * Math.sin(CAP_ANGLE);
  for (let i = 0; i < pos.count; i++) {
    uvs.setXY(i, 0.5 + pos.getX(i) / (2 * half), 0.5 + pos.getY(i) / (2 * half));
  }
  uvs.needsUpdate = true;
  return geo;
}

export function createBallStamp(radius: number): BallStamp {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  if (ctx) {
    drawStamp(ctx);
    // Draw again once the display face has arrived, if it was still loading.
    void document.fonts
      ?.load(`300px ${DISPLAY_FONT}`)
      .then(() => {
        drawStamp(ctx);
        tex.needsUpdate = true;
      })
      .catch(() => undefined);
  }

  const group = new THREE.Group();
  const foilGeo = createCapGeometry(radius + 0.012);
  const foilMat = new THREE.MeshStandardMaterial({
    color: 0xd8aa48,
    metalness: 0.45,
    roughness: 0.32,
    emissive: 0x6b4a12,
    emissiveIntensity: 0.6,
    alphaMap: tex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2
  });
  const foil = new THREE.Mesh(foilGeo, foilMat);
  foil.renderOrder = 2;

  // The shine: a soft diagonal band of light that slides across the foil once.
  const sweep = uniform(-0.6);
  const shineGeo = createCapGeometry(radius + 0.02);
  const shineMat = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const diag = uv().x.add(uv().y).mul(0.5).sub(sweep).abs();
  const band = float(1).sub(smoothstep(float(0), float(0.12), diag));
  shineMat.colorNode = vec3(1.0, 0.93, 0.7);
  shineMat.opacityNode = texture(tex).g.mul(band).mul(0.85);
  const shine = new THREE.Mesh(shineGeo, shineMat);
  shine.renderOrder = 3;

  group.add(foil, shine);

  const setStamp = (p: number): void => {
    const c = Math.max(0, Math.min(1, p));
    group.visible = c > 0;
    // Pressed in: the foil arrives a touch proud and settles into the leather.
    const press = Math.min(1, c / 0.35);
    foilMat.opacity = press;
    group.scale.setScalar(1 + 0.05 * (1 - press));
    sweep.value = -0.3 + 1.6 * Math.max(0, (c - 0.35) / 0.65);
    shine.visible = c > 0.35 && c < 1;
  };
  setStamp(0);

  return {
    group,
    setStamp,
    dispose: () => {
      foilGeo.dispose();
      shineGeo.dispose();
      foilMat.dispose();
      shineMat.dispose();
      tex.dispose();
    }
  };
}
