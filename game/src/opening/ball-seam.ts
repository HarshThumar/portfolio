import * as THREE from 'three/webgpu';

// The seams of a Test ball (docs/03): a raised main seam round the equator with six rows of
// stitching, and two quarter seams, one across each hemisphere, at right angles to each other.

const ROW_HEIGHTS = [-0.36, -0.24, -0.12, 0.12, 0.24, 0.36];
const PER_ROW = 130;
const MAIN_COUNT = ROW_HEIGHTS.length * PER_ROW;
const QUARTER_PER_ARC = 56;
const QUARTER_COUNT = QUARTER_PER_ARC * 2;

export interface BallSeams {
  group: THREE.Group;
  /** 0→1: the ridge rises, the six rows stitch round (to 0.75), then the quarter seams. */
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

function placeQuarterStitches(mesh: THREE.InstancedMesh, radius: number): void {
  const r = radius + 0.008;
  for (let i = 0; i < QUARTER_PER_ARC; i++) {
    const t = ((i + 0.5) / QUARTER_PER_ARC) * Math.PI;
    // Upper hemisphere: the seam runs in the XY plane, over the top; stitches cross it along Z.
    dummy.position.set(Math.cos(t) * r, Math.sin(t) * r, 0);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i * 2, dummy.matrix);
    // Lower hemisphere: in the YZ plane, underneath; stitches cross it along X.
    dummy.position.set(0, -Math.sin(t) * r, Math.cos(t) * r);
    dummy.rotation.set(0, 0, Math.PI / 2);
    dummy.updateMatrix();
    mesh.setMatrixAt(i * 2 + 1, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function createBallSeams(radius: number): BallSeams {
  const group = new THREE.Group();
  const ridgeMat = new THREE.MeshPhysicalMaterial({
    color: 0x6e1410,
    roughness: 0.5,
    clearcoat: 0.4
  });
  const threadMat = new THREE.MeshStandardMaterial({ color: 0xf1e6cf, roughness: 0.75 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x4a0d0a, roughness: 0.6 });

  const ridgeGeo = new THREE.TorusGeometry(radius - 0.02, 0.1, 10, 160);
  ridgeGeo.rotateX(Math.PI / 2);
  const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);

  const stitchGeo = new THREE.CapsuleGeometry(0.024, 0.06, 3, 6);
  const main = new THREE.InstancedMesh(stitchGeo, threadMat, MAIN_COUNT);
  placeMainStitches(main, radius);
  main.count = 0;

  const upperGeo = new THREE.TorusGeometry(radius + 0.002, 0.022, 6, 80, Math.PI);
  const lowerGeo = upperGeo.clone();
  lowerGeo.rotateX(Math.PI);
  lowerGeo.rotateY(Math.PI / 2);
  const upperLine = new THREE.Mesh(upperGeo, lineMat);
  const lowerLine = new THREE.Mesh(lowerGeo, lineMat);

  const fineGeo = new THREE.CapsuleGeometry(0.012, 0.05, 2, 4);
  const quarter = new THREE.InstancedMesh(fineGeo, threadMat, QUARTER_COUNT);
  placeQuarterStitches(quarter, radius);
  quarter.count = 0;

  group.add(ridge, main, upperLine, lowerLine, quarter);

  const setSeam = (p: number): void => {
    const c = Math.max(0, Math.min(1, p));
    ridge.visible = c > 0;
    // The ridge swells up out of the leather in the first moment.
    const rise = Math.min(1, c / 0.12);
    ridge.scale.set(1, 0.3 + 0.7 * rise, 1);
    main.count = Math.floor(Math.min(1, c / 0.75) * MAIN_COUNT);
    const q = Math.max(0, (c - 0.75) / 0.25);
    upperLine.visible = lowerLine.visible = c > 0.7;
    quarter.count = Math.floor(q * QUARTER_COUNT);
  };
  setSeam(0);

  return {
    group,
    setSeam,
    dispose: () => {
      for (const g of [ridgeGeo, stitchGeo, upperGeo, lowerGeo, fineGeo]) g.dispose();
      for (const m of [ridgeMat, threadMat, lineMat]) m.dispose();
      main.dispose();
      quarter.dispose();
    }
  };
}
