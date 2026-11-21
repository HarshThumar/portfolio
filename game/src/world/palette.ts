import * as THREE from 'three';

export const PALETTE = {
  cream: 0xf3ead3,
  ink: 0x1e1b16,
  outfield: 0x4e7a3a,
  outfield2: 0x5c8a45,
  pitch: 0xc9b27c,
  willow: 0xd8b87a,
  timber: 0x6b4a2b,
  leather: 0xa3271f,
  night: 0x0e1a24,
  flood: 0xfff6da
} as const;

export interface SharedMaterials {
  cream: THREE.MeshLambertMaterial;
  ink: THREE.MeshLambertMaterial;
  outfield: THREE.MeshLambertMaterial;
  outfield2: THREE.MeshLambertMaterial;
  pitch: THREE.MeshLambertMaterial;
  willow: THREE.MeshLambertMaterial;
  timber: THREE.MeshLambertMaterial;
  leather: THREE.MeshLambertMaterial;
  dispose: () => void;
}

export function createSharedMaterials(): SharedMaterials {
  const cream = new THREE.MeshLambertMaterial({ color: PALETTE.cream });
  const ink = new THREE.MeshLambertMaterial({ color: PALETTE.ink });
  const outfield = new THREE.MeshLambertMaterial({ color: PALETTE.outfield });
  const outfield2 = new THREE.MeshLambertMaterial({ color: PALETTE.outfield2 });
  const pitch = new THREE.MeshLambertMaterial({ color: PALETTE.pitch });
  const willow = new THREE.MeshLambertMaterial({ color: PALETTE.willow });
  const timber = new THREE.MeshLambertMaterial({ color: PALETTE.timber });
  const leather = new THREE.MeshLambertMaterial({ color: PALETTE.leather });

  return {
    cream,
    ink,
    outfield,
    outfield2,
    pitch,
    willow,
    timber,
    leather,
    dispose: () => {
      cream.dispose();
      ink.dispose();
      outfield.dispose();
      outfield2.dispose();
      pitch.dispose();
      willow.dispose();
      timber.dispose();
      leather.dispose();
    }
  };
}
