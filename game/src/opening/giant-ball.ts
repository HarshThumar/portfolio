import * as THREE from 'three/webgpu';
import { PALETTE } from '../world/palette';

const RADIUS = 4.0;
const STITCH_COUNT = 180;
const STITCHES_PER_ROW = 90;

function computeOvershootScale(p: number): number {
  const c = Math.max(0, Math.min(1, p));
  if (c <= 0) return 0;
  if (c < 0.85) {
    return (c / 0.85) * 1.05;
  }
  return 1.05 - ((c - 0.85) / 0.15) * 0.05;
}

function setupStitchMatrices(mesh: THREE.InstancedMesh): void {
  const dummy = new THREE.Object3D();
  for (let i = 0; i < STITCHES_PER_ROW; i++) {
    const theta = (i / STITCHES_PER_ROW) * Math.PI * 2;
    // Row 1 (upper stitch row)
    const x1 = Math.cos(theta) * (RADIUS + 0.015);
    const z1 = Math.sin(theta) * (RADIUS + 0.015);
    dummy.position.set(x1, 0.07, z1);
    dummy.rotation.set(0, -theta, Math.PI / 4);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    // Row 2 (lower stitch row, interleaved)
    const theta2 = theta + Math.PI / STITCHES_PER_ROW;
    const x2 = Math.cos(theta2) * (RADIUS + 0.015);
    const z2 = Math.sin(theta2) * (RADIUS + 0.015);
    dummy.position.set(x2, -0.07, z2);
    dummy.rotation.set(0, -theta2, -Math.PI / 4);
    dummy.updateMatrix();
    mesh.setMatrixAt(STITCHES_PER_ROW + i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export interface GiantBall {
  group: THREE.Group;
  setAssembled: (p: number) => void;
  setSeam: (p: number) => void;
  dispose: () => void;
}

/** Giant red leather cricket ball assembled high above the Ahmedabad hub. */
export function createGiantBall(): GiantBall {
  const group = new THREE.Group();
  group.name = 'giant-ball';
  group.visible = false;
  group.scale.setScalar(0);

  const ballGeo = new THREE.SphereGeometry(RADIUS, 32, 24);
  const ballMat = new THREE.MeshStandardMaterial({
    color: PALETTE.leather,
    roughness: 0.45,
    metalness: 0.05
  });
  const sphereMesh = new THREE.Mesh(ballGeo, ballMat);
  group.add(sphereMesh);

  const creamMat = new THREE.MeshStandardMaterial({
    color: PALETTE.cream,
    roughness: 0.45,
    metalness: 0.05
  });

  const seamBandGeo = new THREE.TorusGeometry(RADIUS + 0.01, 0.04, 8, 90);
  const seamBand = new THREE.Mesh(seamBandGeo, creamMat);
  seamBand.rotation.x = Math.PI / 2;
  group.add(seamBand);

  const stitchGeo = new THREE.CapsuleGeometry(0.02, 0.08, 4, 8);
  const stitchMesh = new THREE.InstancedMesh(stitchGeo, creamMat, STITCH_COUNT);
  setupStitchMatrices(stitchMesh);
  stitchMesh.count = 0;
  group.add(stitchMesh);

  return {
    group,
    setAssembled: (p: number) => {
      const scale = computeOvershootScale(p);
      group.scale.setScalar(scale);
      group.visible = scale > 0;
    },
    setSeam: (p: number) => {
      const c = Math.max(0, Math.min(1, p));
      stitchMesh.count = Math.floor(c * STITCH_COUNT);
      stitchMesh.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      ballGeo.dispose();
      ballMat.dispose();
      creamMat.dispose();
      seamBandGeo.dispose();
      stitchGeo.dispose();
    }
  };
}
