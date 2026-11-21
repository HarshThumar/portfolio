import * as THREE from 'three/webgpu';
import { PALETTE } from '../world/palette';

export interface BatPadMaterials {
  willow: THREE.MeshStandardMaterial;
  cream: THREE.MeshStandardMaterial;
  ink: THREE.MeshStandardMaterial;
  timber: THREE.MeshStandardMaterial;
  dispose: () => void;
}

export function createBatPadMaterials(): BatPadMaterials {
  const willow = new THREE.MeshStandardMaterial({ color: PALETTE.willow, roughness: 0.5 });
  const cream = new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.55 });
  const ink = new THREE.MeshStandardMaterial({ color: PALETTE.ink, roughness: 0.4 });
  const timber = new THREE.MeshStandardMaterial({ color: PALETTE.timber, roughness: 0.6 });

  return {
    willow,
    cream,
    ink,
    timber,
    dispose: () => {
      willow.dispose();
      cream.dispose();
      ink.dispose();
      timber.dispose();
    }
  };
}

export interface BatPadGeometries {
  batBlade: THREE.BufferGeometry;
  batHandle: THREE.CylinderGeometry;
  batGripRing: THREE.TorusGeometry;
  padRib: THREE.CapsuleGeometry;
  padKnee: THREE.CapsuleGeometry;
  padStrap: THREE.CylinderGeometry;
  glovePalm: THREE.CapsuleGeometry;
  gloveRoll: THREE.CapsuleGeometry;
  gloveCuff: THREE.TorusGeometry;
  dispose: () => void;
}

function buildBatBladeGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.16, 0.02);
  shape.lineTo(0.16, 0.02);
  shape.quadraticCurveTo(0.14, -0.06, 0, -0.08);
  shape.quadraticCurveTo(-0.14, -0.06, -0.16, 0.02);

  return new THREE.ExtrudeGeometry(shape, {
    depth: 1.35,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025
  });
}

export function createBatPadGeometries(): BatPadGeometries {
  const batBlade = buildBatBladeGeometry();
  const batHandle = new THREE.CylinderGeometry(0.055, 0.055, 0.65, 12);
  const batGripRing = new THREE.TorusGeometry(0.058, 0.008, 6, 16);
  const padRib = new THREE.CapsuleGeometry(0.05, 1.35, 4, 8);
  const padKnee = new THREE.CapsuleGeometry(0.07, 0.72, 4, 8);
  const padStrap = new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8);
  const glovePalm = new THREE.CapsuleGeometry(0.18, 0.42, 4, 8);
  const gloveRoll = new THREE.CapsuleGeometry(0.045, 0.12, 4, 8);
  const gloveCuff = new THREE.TorusGeometry(0.2, 0.03, 6, 16);

  return {
    batBlade,
    batHandle,
    batGripRing,
    padRib,
    padKnee,
    padStrap,
    glovePalm,
    gloveRoll,
    gloveCuff,
    dispose: () => {
      batBlade.dispose();
      batHandle.dispose();
      batGripRing.dispose();
      padRib.dispose();
      padKnee.dispose();
      padStrap.dispose();
      glovePalm.dispose();
      gloveRoll.dispose();
      gloveCuff.dispose();
    }
  };
}

export function buildBatObject(geo: BatPadGeometries, mat: BatPadMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'kit-bat';

  const blade = new THREE.Mesh(geo.batBlade, mat.willow);
  blade.rotation.x = Math.PI / 2;
  blade.position.set(0, -0.68, 0);
  group.add(blade);

  const handle = new THREE.Mesh(geo.batHandle, mat.cream);
  handle.position.set(0, 0.98, 0);
  group.add(handle);

  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(geo.batGripRing, mat.ink);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.76 + i * 0.14, 0);
    group.add(ring);
  }

  return group;
}

export function buildPadObject(geo: BatPadGeometries, mat: BatPadMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'kit-pad';

  for (let i = 0; i < 7; i++) {
    const rib = new THREE.Mesh(geo.padRib, mat.cream);
    const x = (i - 3) * 0.1;
    const zCurve = -Math.abs(i - 3) * 0.025;
    rib.position.set(x, 0, zCurve);
    group.add(rib);
  }

  const knee = new THREE.Mesh(geo.padKnee, mat.cream);
  knee.rotation.z = Math.PI / 2;
  knee.position.set(0, 0.22, 0.04);
  group.add(knee);

  const topStrap = new THREE.Mesh(geo.padStrap, mat.timber);
  topStrap.rotation.z = Math.PI / 2;
  topStrap.position.set(0, 0.45, -0.06);
  group.add(topStrap);

  const bottomStrap = new THREE.Mesh(geo.padStrap, mat.timber);
  bottomStrap.rotation.z = Math.PI / 2;
  bottomStrap.position.set(0, -0.45, -0.06);
  group.add(bottomStrap);

  return group;
}

export function buildGloveObject(geo: BatPadGeometries, mat: BatPadMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'kit-glove';

  const palm = new THREE.Mesh(geo.glovePalm, mat.cream);
  palm.scale.set(1.15, 1, 0.65);
  group.add(palm);

  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 3; row++) {
      const roll = new THREE.Mesh(geo.gloveRoll, mat.cream);
      roll.position.set((col - 1.5) * 0.09, 0.12 + row * 0.12, 0.12);
      roll.rotation.z = (Math.random() - 0.5) * 0.1;
      group.add(roll);
    }
  }

  const cuff = new THREE.Mesh(geo.gloveCuff, mat.ink);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.set(0, -0.28, 0);
  group.add(cuff);

  return group;
}
