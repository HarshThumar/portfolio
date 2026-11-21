import * as THREE from 'three/webgpu';
import { OPENING_CENTRE } from './opening-pose';

// Soft warm-grey cloud billboards for the overcast opening: a loose shell around the ball and a
// thick deck below it that the ball is bowled down through.

/** The cloud deck the ball is bowled down through (world heights). */
export const DECK_TOP = OPENING_CENTRE.y - 60;
export const DECK_BOTTOM = OPENING_CENTRE.y - 120;

export interface OpeningClouds {
  group: THREE.Group;
  update: (dt: number) => void;
  dispose: () => void;
}

interface Cloud {
  sprite: THREE.Sprite;
  drift: number;
}

/** A few overlapping soft blobs, lighter on top and greyer underneath, like a rain cloud. */
function drawCloud(seed: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const blobs = 7 + seed * 2;
    for (let i = 0; i < blobs; i++) {
      // Kept well inside the canvas, so no blob is ever cut off in a straight line.
      const r = size * (0.12 + 0.1 * Math.random());
      const x = size * (0.3 + 0.4 * Math.random());
      const y = size * (0.42 + 0.16 * Math.random());
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      // One shade per blob, fading out smoothly: lighter blobs on top, greyer underneath.
      const shade = Math.round(240 - (y / size) * 55);
      const rgb = `${shade + 4},${shade},${shade - 9}`;
      g.addColorStop(0, `rgba(${rgb},0.8)`);
      g.addColorStop(0.5, `rgba(${rgb},0.45)`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addCloud(
  group: THREE.Group,
  clouds: Cloud[],
  material: THREE.SpriteNodeMaterial,
  pos: THREE.Vector3,
  size: number
): void {
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(pos);
  sprite.scale.set(size, size * 0.6, 1);
  group.add(sprite);
  clouds.push({ sprite, drift: 0.6 + Math.random() * 1.2 });
}

/** `centre` is the ball; the deck sits 60–120 m below it. */
export function createOpeningClouds(centre: THREE.Vector3): OpeningClouds {
  const group = new THREE.Group();
  group.name = 'opening-clouds';
  const textures = [0, 1, 2].map(drawCloud);
  const materials = textures.map(
    (map, i) =>
      new THREE.SpriteNodeMaterial({
        map,
        transparent: true,
        depthWrite: false,
        opacity: i === 2 ? 0.95 : 0.8
      })
  );
  const clouds: Cloud[] = [];
  const pos = new THREE.Vector3();

  // The shell: far enough out (28 m+) that nothing ever sits between the camera and the ball.
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 30 + Math.random() * 65;
    const y = -22 + Math.random() * 40;
    pos.set(centre.x + Math.cos(a) * dist, centre.y + y, centre.z + Math.sin(a) * dist);
    addCloud(group, clouds, materials[i % 2]!, pos, Math.min(2 * (dist - 22), 26 + dist * 0.4));
  }
  // The deck: thick and wide, centred under the ball so the camera falls straight through it.
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * 90;
    pos.set(
      centre.x + Math.cos(a) * dist,
      DECK_BOTTOM + Math.random() * (DECK_TOP - DECK_BOTTOM),
      centre.z + Math.sin(a) * dist
    );
    addCloud(group, clouds, materials[2]!, pos, 60 + Math.random() * 50);
  }

  return {
    group,
    update: (dt) => {
      for (const c of clouds) c.sprite.position.x += c.drift * dt;
    },
    dispose: () => {
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
    }
  };
}
