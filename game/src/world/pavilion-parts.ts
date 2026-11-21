import * as THREE from 'three/webgpu';
import type { SharedMaterials } from './palette';
import { createGableGeometry, type MergeBatch } from './merge-batch';

/** Footprint shared by the visuals and the collider (local space, front faces +z). */
export const PAVILION_BLOCK = { halfWidth: 14, backZ: -3.5, frontZ: 3.0, height: 7 };
export const PAVILION_STEPS = { halfWidth: 2.5, frontZ: 3.9, height: 0.3 };

const TOWER_X = 12.2;
const WINDOW_XS = [-9.6, -7.2, -4.8, -2.4, 0, 2.4, 4.8, 7.2, 9.6];

function addBlocks(b: MergeBatch, m: SharedMaterials): void {
  b.box(m.cream, 26.6, 0.4, 5.6, 0, 0.2, -0.2);
  b.box(m.timber, 26, 3.4, 5, 0, 2.1, -1);
  b.box(m.cream, 26.4, 0.25, 5.4, 0, 3.8, -0.9);
  b.box(m.timber, 26, 3.1, 5, 0, 5.45, -1);
  b.box(m.cream, 26.4, 0.2, 5.4, 0, 7.05, -0.9);
  // Raised central section
  b.box(m.timber, 11, 2.6, 4.6, 0, 8.4, -1.2);
  b.box(m.cream, 11.4, 0.2, 5, 0, 9.7, -1.2);
  for (const sx of [-1, 1]) {
    b.box(m.timber, 3.6, 9.2, 4.4, sx * TOWER_X, 4.6, 0.3);
    b.box(m.cream, 3.9, 0.3, 4.7, sx * TOWER_X, 9.3, 0.3);
    b.box(m.cream, 3.8, 0.2, 4.6, sx * TOWER_X, 3.8, 0.3);
  }
}

function addRoofs(b: MergeBatch, m: SharedMaterials): void {
  b.add(m.ink, createGableGeometry(26.8, 6.2, 2.0), 0, 7.15, -1);
  b.add(m.ink, createGableGeometry(5.4, 11.4, 2.2), 0, 9.8, -1.2, Math.PI / 2);
  for (const sx of [-1, 1]) {
    const roof = new THREE.ConeGeometry(3.0, 2.8, 4);
    roof.rotateY(Math.PI / 4);
    b.add(m.ink, roof, sx * TOWER_X, 10.9, 0.3);
    b.add(m.cream, new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), sx * TOWER_X, 12.9, 0.3);
    b.box(m.leather, 0.7, 0.4, 0.04, sx * TOWER_X + 0.35, 13.2, 0.3);
  }
  b.add(m.ink, new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), 0, 12.6, -1.2);
}

function addWindows(b: MergeBatch, m: SharedMaterials): void {
  const frontZ = -1 + 2.5;
  for (const x of WINDOW_XS) {
    b.box(m.cream, 1.3, 2.7, 0.08, x, 5.45, frontZ + 0.02);
    b.box(m.ink, 1.0, 2.4, 0.1, x, 5.45, frontZ + 0.04);
    b.box(m.ink, 0.9, 1.7, 0.1, x, 1.9, frontZ + 0.04);
    b.box(m.cream, 0.1, 2.4, 0.12, x, 5.45, frontZ + 0.06);
  }
  b.box(m.leather, 1.3, 2.3, 0.1, 0, 1.15, frontZ + 0.05);
  for (const sx of [-1, 1]) {
    b.box(m.ink, 1.1, 2.2, 0.1, sx * TOWER_X, 6.3, 2.55);
    b.box(m.ink, 1.1, 1.8, 0.1, sx * TOWER_X, 1.9, 2.55);
  }
}

function addBalcony(b: MergeBatch, m: SharedMaterials): void {
  b.box(m.cream, 20.8, 0.2, 1.7, 0, 3.75, 2.2);
  b.box(m.cream, 20.8, 0.08, 0.1, 0, 4.7, 2.95);
  for (let x = -10.2; x <= 10.3; x += 0.6) b.box(m.cream, 0.06, 0.9, 0.06, x, 4.2, 2.95);
  for (let x = -9.1; x <= 9.2; x += 2.6) b.box(m.timber, 0.3, 3.6, 0.3, x, 1.8, 2.8);
  b.box(m.cream, 5, 0.3, 0.9, 0, 0.15, 3.45);
}

export function addPavilionParts(batch: MergeBatch, materials: SharedMaterials): void {
  addBlocks(batch, materials);
  addRoofs(batch, materials);
  addWindows(batch, materials);
  addBalcony(batch, materials);
}
