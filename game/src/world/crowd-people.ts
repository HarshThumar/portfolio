import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PALETTE } from './palette';

/** Height of the shoulders; arm vertices are weighted by how far they hang below it. */
const SHOULDER_Y = 0.5;
const ARM_LENGTH = 0.34;

// Leather is the accent, so it is kept rare (about 1 in 13).
const SHIRT_COLORS = [PALETTE.cream, PALETTE.willow, PALETTE.ink, PALETTE.timber];
const SKIN_TONES = [0xe0b48a, 0xc68c5f, 0x9a6540, 0x6e4529];

/** Stable per-index hash so a seat always gets the same person. */
export function hashIndex(index: number): number {
  return Math.imul(index + 1, 2654435761) >>> 0;
}

export function pickShirt(index: number): number {
  const h = hashIndex(index);
  if (h % 13 === 0) return PALETTE.leather;
  return SHIRT_COLORS[(h >>> 8) % SHIRT_COLORS.length] ?? PALETTE.cream;
}

export function pickSkin(index: number): number {
  return SKIN_TONES[(hashIndex(index) >>> 16) % SKIN_TONES.length] ?? 0xe0b48a;
}

function tagged(geo: THREE.BufferGeometry, part: number, armLift: boolean): THREE.BufferGeometry {
  // Non-indexed everywhere so the merge never mixes indexed and plain geometry.
  const out = geo.index ? geo.toNonIndexed() : geo;
  if (out !== geo) geo.dispose();
  const pos = out.getAttribute('position');
  const parts = new Float32Array(pos.count).fill(part);
  const lifts = new Float32Array(pos.count);
  if (armLift) {
    for (let i = 0; i < pos.count; i++) {
      lifts[i] = THREE.MathUtils.clamp((SHOULDER_Y - pos.getY(i)) / ARM_LENGTH, 0, 1);
    }
  }
  out.setAttribute('part', new THREE.BufferAttribute(parts, 1));
  out.setAttribute('lift', new THREE.BufferAttribute(lifts, 1));
  return out;
}

/**
 * One little person, about 0.8 m tall, facing +z: tapered torso, round head, two arms.
 * Attributes: `part` (1 = skin, 0 = shirt) and `lift` (0 at the shoulder, 1 at the hand).
 */
export function createPersonGeometry(): THREE.BufferGeometry {
  const torso = new THREE.CylinderGeometry(0.15, 0.19, 0.42, 7);
  torso.scale(1.15, 1, 0.8);
  torso.translate(0, 0.3, 0);
  const head = new THREE.IcosahedronGeometry(0.115, 1);
  head.translate(0, 0.65, 0);
  const arms: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.BoxGeometry(0.07, ARM_LENGTH, 0.07);
    arm.translate(0, -ARM_LENGTH / 2, 0);
    arm.rotateZ(side * 0.18);
    arm.translate(side * 0.22, SHOULDER_Y, 0);
    arms.push(tagged(arm, 0, true));
  }
  const parts = [tagged(torso, 0, false), tagged(head, 1, false), ...arms];
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) throw new Error('Could not merge the spectator geometry.');
  return merged;
}
