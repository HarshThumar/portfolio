import * as THREE from 'three/webgpu';
import { createBallSeams } from './ball-seam';
import { createBallStamp } from './ball-stamp';
import { easeOutBack } from './opening-timeline';

// The giant Test ball the kit becomes (docs/03): four red leather quarters, a raised main seam
// with six rows of stitching, two quarter seams, and a gold maker's stamp on one quarter.

export const BALL_RADIUS = 4;

/** Ball-local direction of the stamp's centre: the middle of the upper, +Z quarter. */
export const STAMP_DIR = new THREE.Vector3(0, 1, 1).normalize();
/** Ball-local "up" of the stamp's lettering, so it can be turned upright to the camera. */
export const STAMP_UP = new THREE.Vector3(0, 1, -1).normalize();

// Each quarter: [phiStart, thetaStart]. The upper hemisphere splits along the XY plane and the
// lower along the YZ plane, so the two quarter seams cross at right angles like a real ball.
const QUARTERS: Array<[number, number]> = [
  [0, 0],
  [Math.PI, 0],
  [Math.PI / 2, Math.PI / 2],
  [(3 * Math.PI) / 2, Math.PI / 2]
];

export interface GiantBall {
  group: THREE.Group;
  setPanels: (p: number) => void;
  setSeam: (p: number) => void;
  setStamp: (p: number) => void;
  dispose: () => void;
}

/** A soft grain so the leather catches the light unevenly, like a polished new ball. */
function createGrainTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = 218 + Math.floor(Math.random() * 37);
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 3);
  return tex;
}

interface Quarter {
  mesh: THREE.Mesh;
  out: THREE.Vector3;
  spin: THREE.Vector3;
}

function createQuarters(mat: THREE.Material, geos: THREE.BufferGeometry[]): Quarter[] {
  return QUARTERS.map(([phi, theta]) => {
    const geo = new THREE.SphereGeometry(BALL_RADIUS, 48, 24, phi, Math.PI, theta, Math.PI / 2);
    geos.push(geo);
    const mesh = new THREE.Mesh(geo, mat);
    // Where the quarter's middle points: it flies in along this line.
    const mid = phi + Math.PI / 2;
    const th = theta + Math.PI / 4;
    const out = new THREE.Vector3(
      -Math.cos(mid) * Math.sin(th),
      Math.cos(th),
      Math.sin(mid) * Math.sin(th)
    ).normalize();
    const spin = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0.3, 1, 0.2)).normalize();
    return { mesh, out, spin };
  });
}

export function createGiantBall(): GiantBall {
  const group = new THREE.Group();
  group.name = 'giant-ball';
  const geos: THREE.BufferGeometry[] = [];
  const grain = createGrainTexture();
  const leather = new THREE.MeshPhysicalMaterial({
    color: 0x9a1f17,
    map: grain,
    roughnessMap: grain,
    roughness: 0.5,
    clearcoat: 0.55,
    clearcoatRoughness: 0.35,
    side: THREE.DoubleSide
  });
  const quarters = createQuarters(leather, geos);
  for (const q of quarters) group.add(q.mesh);

  const seams = createBallSeams(BALL_RADIUS);
  group.add(seams.group);

  const stamp = createBallStamp(BALL_RADIUS);
  stamp.group.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(
      new THREE.Vector3().crossVectors(STAMP_UP, STAMP_DIR),
      STAMP_UP,
      STAMP_DIR
    )
  );
  group.add(stamp.group);

  const setPanels = (p: number): void => {
    const c = Math.max(0, Math.min(1, p));
    const e = easeOutBack(c);
    for (const q of quarters) {
      q.mesh.visible = c > 0;
      q.mesh.position.copy(q.out).multiplyScalar(3.2 * (1 - e));
      q.mesh.quaternion.setFromAxisAngle(q.spin, 1.4 * (1 - e));
      q.mesh.scale.setScalar(0.55 + 0.45 * Math.min(1, e));
    }
  };
  setPanels(0);

  return {
    group,
    setPanels,
    setSeam: seams.setSeam,
    setStamp: stamp.setStamp,
    dispose: () => {
      for (const g of geos) g.dispose();
      leather.dispose();
      grain.dispose();
      seams.dispose();
      stamp.dispose();
    }
  };
}
