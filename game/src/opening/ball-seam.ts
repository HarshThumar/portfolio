import * as THREE from 'three/webgpu';

// The seam of a Test ball (docs/03): a raised ridge round the equator with three rows of
// stitching either side. Quarter seams are left off: on a real ball they barely show.

// Three rows each side of the ridge, packed close so each side reads as one strip of stitching
// with the dark ridge clearly between the two strips.
const ROW_HEIGHTS = [-0.46, -0.36, -0.26, 0.26, 0.36, 0.46];
const PER_ROW = 130;
const MAIN_COUNT = ROW_HEIGHTS.length * PER_ROW;

export interface BallSeams {
  group: THREE.Group;
  /** 0→1: the ridge rises and the six rows stitch round the ball. */
  setSeam: (p: number) => void;
  dispose: () => void;
}

const dummy = new THREE.Object3D();
const radial = new THREE.Vector3();
const tiltQ = new THREE.Quaternion();

function placeMainStitches(mesh: THREE.InstancedMesh, radius: number): void {
  // Ordered round the ball (all six rows at each step) so a growing count sweeps round it.
  for (let i = 0; i < PER_ROW; i++) {
    const a = (i / PER_ROW) * Math.PI * 2;
    ROW_HEIGHTS.forEach((y, row) => {
      const a2 = a + (row % 2) * (Math.PI / PER_ROW);
      const ring = Math.sqrt(radius * radius - y * y) + 0.012;
      dummy.position.set(Math.cos(a2) * ring, y, Math.sin(a2) * ring);
      radial.set(Math.cos(a2), 0, Math.sin(a2));
      // Hand stitches lean: rows above the ridge lean one way, rows below the other.
      tiltQ.setFromAxisAngle(radial, y > 0 ? 0.32 : -0.32);
      dummy.quaternion.copy(tiltQ);
      dummy.updateMatrix();
      mesh.setMatrixAt(i * ROW_HEIGHTS.length + row, dummy.matrix);
    });
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function createBallSeams(radius: number): BallSeams {
  const group = new THREE.Group();
  const ridgeMat = new THREE.MeshPhysicalMaterial({
    color: 0x58100c,
    roughness: 0.5,
    clearcoat: 0.4
  });
  const threadMat = new THREE.MeshStandardMaterial({ color: 0xf1e6cf, roughness: 0.75 });

  // A broad, flattish ridge: stretched up and down so the seam reads wide from a distance.
  const ridgeGeo = new THREE.TorusGeometry(radius - 0.01, 0.11, 10, 160);
  ridgeGeo.rotateX(Math.PI / 2);
  ridgeGeo.scale(1, 1.7, 1);
  const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);

  const stitchGeo = new THREE.CapsuleGeometry(0.03, 0.08, 3, 6);
  const main = new THREE.InstancedMesh(stitchGeo, threadMat, MAIN_COUNT);
  placeMainStitches(main, radius);
  main.count = 0;

  group.add(ridge, main);

  const setSeam = (p: number): void => {
    const c = Math.max(0, Math.min(1, p));
    ridge.visible = c > 0;
    // The ridge swells up out of the leather in the first moment.
    const rise = Math.min(1, c / 0.12);
    ridge.scale.set(1, 0.3 + 0.7 * rise, 1);
    main.count = Math.floor(c * MAIN_COUNT);
  };
  setSeam(0);

  return {
    group,
    setSeam,
    dispose: () => {
      for (const g of [ridgeGeo, stitchGeo]) g.dispose();
      for (const m of [ridgeMat, threadMat]) m.dispose();
      main.dispose();
    }
  };
}
