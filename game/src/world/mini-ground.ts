import * as THREE from 'three/webgpu';
import type { SharedMaterials } from './palette';
import type { MergeBatch } from './merge-batch';

/** Model radius (the oval's long half-axis plus the ring of stand blocks). */
export const MODEL_SIZE = 2.75;
const RX = 1.85;
const RZ = 2.1;
const BLOCKS = 18;

function ellipseChord(x: number): number {
  const t = 1 - (x / RX) * (x / RX);
  return t > 0 ? RZ * Math.sqrt(t) : 0;
}

/** Oval of grass with mown stripes, a pitch strip and a rope ring. Local origin = oval centre. */
function addTurf(batch: MergeBatch, m: SharedMaterials): void {
  const oval = new THREE.CylinderGeometry(1, 1, 0.1, 48);
  oval.scale(RX, 1, RZ);
  batch.add(m.outfield, oval, 0, 0.05, 0);
  for (let x = -RX + 0.3; x < RX - 0.2; x += 0.6) {
    const chord = ellipseChord(x + 0.15) * 2 - 0.1;
    if (chord > 0.2) batch.box(m.outfield2, 0.3, 0.012, chord, x, 0.106, 0);
  }
  batch.box(m.pitch, 0.34, 0.016, 1.15, 0, 0.112, 0);
  const rope = new THREE.TorusGeometry(1, 0.025, 6, 48);
  rope.rotateX(Math.PI / 2);
  rope.scale(RX - 0.02, 1, RZ - 0.02);
  batch.add(m.cream, rope, 0, 0.12, 0);
}

/** A ring of stand blocks with a stripe of crowd colour; `skipBack` leaves room for a pavilion. */
function addStandRing(
  batch: MergeBatch,
  m: SharedMaterials,
  tint: THREE.Material,
  skipBack: boolean
): void {
  const crowd = [m.leather, m.cream, m.willow, m.timber];
  for (let k = 0; k < BLOCKS; k++) {
    const a = ((k + 0.5) / BLOCKS) * Math.PI * 2;
    // a = 0 points along +z; the back (-z) is a = PI.
    if (skipBack && Math.abs(Math.abs(a - Math.PI)) < 0.75) continue;
    const x = Math.sin(a) * (RX + 0.3);
    const z = Math.cos(a) * (RZ + 0.3);
    const w = ((Math.PI * 2 * (RX + RZ)) / 2 / BLOCKS) * 0.95;
    batch.box(tint, w, 0.3, 0.42, x, 0.15, z, a);
    batch.box(tint, w, 0.18, 0.3, x * 1.07, 0.39, z * 1.07, a);
    const mat = crowd[k % crowd.length] ?? m.cream;
    batch.box(mat, w * 0.8, 0.05, 0.2, x * 1.02, 0.32, z * 1.02, a);
    batch.box(mat, w * 0.8, 0.05, 0.14, x * 1.08, 0.5, z * 1.08, a);
  }
}

export function addMiniGround(
  batch: MergeBatch,
  m: SharedMaterials,
  tint: THREE.Material,
  skipBack: boolean
): void {
  addTurf(batch, m);
  addStandRing(batch, m, tint, skipBack);
}
