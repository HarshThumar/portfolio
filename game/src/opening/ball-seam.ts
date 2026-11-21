import * as THREE from 'three/webgpu';

// The seams of a Test ball (docs/03): a raised main seam round the equator with six rows of
// stitching, and two quarter seams, one across each hemisphere, at right angles to each other.

// Three rows each side of the ridge, packed close so each side reads as one strip of stitching
// with the dark ridge clearly between the two strips.
const ROW_HEIGHTS = [-0.34, -0.26, -0.18, 0.18, 0.26, 0.34];
const PER_ROW = 130;
const MAIN_COUNT = ROW_HEIGHTS.length * PER_ROW;

export interface BallSeams {
  group: THREE.Group;
  /** 0→1: the ridge rises, the six rows stitch round (to 0.75), then the faint quarter seams. */
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
  // Quarter seams on a real Test ball are stitched from the inside: all that shows is a faint
  // line in the leather, so no thread and only a shade darker than the leather.
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x861b14, roughness: 0.55 });

  const ridgeGeo = new THREE.TorusGeometry(radius - 0.01, 0.1, 10, 160);
  ridgeGeo.rotateX(Math.PI / 2);
  const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);

  const stitchGeo = new THREE.CapsuleGeometry(0.024, 0.06, 3, 6);
  const main = new THREE.InstancedMesh(stitchGeo, threadMat, MAIN_COUNT);
  placeMainStitches(main, radius);
  main.count = 0;

  const upperGeo = new THREE.TorusGeometry(radius - 0.003, 0.012, 5, 96, Math.PI);
  const lowerGeo = upperGeo.clone();
  lowerGeo.rotateX(Math.PI);
  lowerGeo.rotateY(Math.PI / 2);
  const upperLine = new THREE.Mesh(upperGeo, lineMat);
  const lowerLine = new THREE.Mesh(lowerGeo, lineMat);

  group.add(ridge, main, upperLine, lowerLine);

  const setSeam = (p: number): void => {
    const c = Math.max(0, Math.min(1, p));
    ridge.visible = c > 0;
    // The ridge swells up out of the leather in the first moment.
    const rise = Math.min(1, c / 0.12);
    ridge.scale.set(1, 0.3 + 0.7 * rise, 1);
    main.count = Math.floor(Math.min(1, c / 0.75) * MAIN_COUNT);
    upperLine.visible = lowerLine.visible = c > 0.75;
  };
  setSeam(0);

  return {
    group,
    setSeam,
    dispose: () => {
      for (const g of [ridgeGeo, stitchGeo, upperGeo, lowerGeo]) g.dispose();
      for (const m of [ridgeMat, threadMat, lineMat]) m.dispose();
      main.dispose();
    }
  };
}
