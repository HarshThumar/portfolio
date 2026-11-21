import * as THREE from 'three/webgpu';
import { PALETTE, type SharedMaterials } from './palette';

export interface StandMat {
  group: THREE.Group;
  glow: THREE.MeshLambertMaterial;
  dispose: () => void;
}

/** Leather-red rim round a cream disc, 2 cm off the grass. Origin at the disc centre. */
export function createStandMat(materials: SharedMaterials, radius: number): StandMat {
  const rimGeo = new THREE.CylinderGeometry(radius, radius, 0.02, 48);
  const discGeo = new THREE.CylinderGeometry(radius - 0.35, radius - 0.35, 0.03, 48);
  const glow = new THREE.MeshLambertMaterial({
    color: PALETTE.cream,
    emissive: PALETTE.leather,
    emissiveIntensity: 0
  });
  const rim = new THREE.Mesh(rimGeo, materials.leather);
  rim.position.y = 0.01;
  const disc = new THREE.Mesh(discGeo, glow);
  disc.position.y = 0.015;
  const group = new THREE.Group();
  group.add(rim, disc);
  return {
    group,
    glow,
    dispose: () => {
      rimGeo.dispose();
      discGeo.dispose();
      glow.dispose();
    }
  };
}

/** A gentle pulse while the roller is within range, off otherwise. */
export function updateStandMat(mat: StandMat, near: boolean, seconds: number): void {
  mat.glow.emissiveIntensity = near ? 0.18 + 0.14 * Math.sin(seconds * 3) : 0;
}
