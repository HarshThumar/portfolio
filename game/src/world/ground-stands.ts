import * as THREE from 'three/webgpu';
import type { SharedMaterials } from './palette';
import { createMergeBatch, type MergeBatch, type MergedGroup } from './merge-batch';

const BOUNDARY_RADIUS_X = 42;
const BOUNDARY_RADIUS_Z = 50;

const TIERS = [
  { innerX: 45, innerZ: 53, outerX: 49, outerZ: 57, y: 0.6, height: 1.2 },
  { innerX: 49, innerZ: 57, outerX: 53, outerZ: 61, y: 1.8, height: 1.2 },
  { innerX: 53, innerZ: 61, outerX: 57, outerZ: 65, y: 3.0, height: 1.2 }
];

function ellipsePath<T extends THREE.Path>(path: T, rx: number, rz: number, reverse: boolean): T {
  const segments = 48;
  for (let n = 0; n <= segments; n++) {
    const i = reverse ? segments - n : n;
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * rx;
    const y = Math.sin(theta) * rz;
    if (n === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  return path;
}

/** Three stepped rings of seating around the rope, baked into the shared batch. */
function addStands(batch: MergeBatch, materials: SharedMaterials): void {
  for (const tier of TIERS) {
    const shape = ellipsePath(new THREE.Shape(), tier.outerX, tier.outerZ, false);
    shape.holes.push(ellipsePath(new THREE.Path(), tier.innerX, tier.innerZ, true));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: tier.height, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    batch.add(materials.cream, geo, 0, tier.y - tier.height / 2, 0);
  }
}

function createSightScreen(batch: MergeBatch, materials: SharedMaterials, zPos: number): void {
  batch.box(materials.timber, 0.2, 3.5, 0.2, -2.8, 1.75, zPos);
  batch.box(materials.timber, 0.2, 3.5, 0.2, 2.8, 1.75, zPos);
  batch.box(materials.cream, 5.4, 3.0, 0.1, 0, 1.8, zPos);
}

/** Sight screens sit between the rope and the wall so they never touch the stands. */
export const SIGHT_SCREEN_Z = 51.2;
export const SIGHT_SCREEN_HEIGHT = 3.5;
export const SIGHT_SCREEN_HALF_WIDTH = 2.9;

function addRope(batch: MergeBatch, materials: SharedMaterials): void {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 80; i++) {
    const theta = (i / 80) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(theta) * BOUNDARY_RADIUS_X,
        0.08,
        Math.sin(theta) * BOUNDARY_RADIUS_Z
      )
    );
  }
  const curve = new THREE.CatmullRomCurve3(points, true);
  batch.add(materials.cream, new THREE.TubeGeometry(curve, 96, 0.08, 6, true), 0, 0, 0);

  for (let i = 0; i < 18; i++) {
    const theta = (i / 18) * Math.PI * 2;
    const marker = new THREE.ConeGeometry(0.2, 0.3, 4);
    marker.rotateX(Math.PI / 2);
    batch.add(
      i % 2 === 0 ? materials.cream : materials.leather,
      marker,
      Math.cos(theta) * (BOUNDARY_RADIUS_X + 0.3),
      0.1,
      Math.sin(theta) * (BOUNDARY_RADIUS_Z + 0.3),
      -theta
    );
  }
}

function addPitch(batch: MergeBatch, materials: SharedMaterials): void {
  const pitch = new THREE.PlaneGeometry(3.2, 20.12);
  pitch.rotateX(-Math.PI / 2);
  batch.add(materials.pitch, pitch, 0, 0.015, 0);

  for (const z of [-8.8, 8.8]) {
    const bowl = new THREE.PlaneGeometry(2.64, 0.08);
    bowl.rotateX(-Math.PI / 2);
    batch.add(materials.cream, bowl, 0, 0.02, z);
    const pop = new THREE.PlaneGeometry(3.66, 0.08);
    pop.rotateX(-Math.PI / 2);
    batch.add(materials.cream, pop, 0, 0.02, z > 0 ? z - 1.22 : z + 1.22);
  }
}

export function createStaticField(
  materials: SharedMaterials,
  hideNorthSightScreen: boolean
): MergedGroup {
  const batch = createMergeBatch();
  addPitch(batch, materials);
  addRope(batch, materials);
  addStands(batch, materials);
  createSightScreen(batch, materials, SIGHT_SCREEN_Z);
  if (!hideNorthSightScreen) createSightScreen(batch, materials, -SIGHT_SCREEN_Z);
  return batch.build();
}
