import type RAPIER from '@dimforge/rapier3d-compat';
import type { MergeBatch } from './merge-batch';
import { angleDiff, tierOuterR, type BowlLayout } from './ahmedabad-bowl-layout';
import type { BowlMaterials } from './ahmedabad-bowl-parts';

const BOARD_COUNT = 128;
const WALL_SEGMENTS = 64;
const SCREEN_HALF_WIDTH = 8;
const SCREEN_HEIGHT = 8;

function yawQuat(yaw: number): { x: number; y: number; z: number; w: number } {
  return { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) };
}

/** Plain coloured advertising boards just outside the rope (no marks of any kind). */
export function addBoards(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const width = (Math.PI * 2 * layout.boardR) / BOARD_COUNT;
  for (let k = 0; k < BOARD_COUNT; k++) {
    const a = ((k + 0.5) / BOARD_COUNT) * Math.PI * 2;
    if (Math.abs(angleDiff(a, layout.gateAngle)) < layout.gateHalf + 0.01) continue;
    const mat = m.boards[k % m.boards.length] ?? m.trim;
    batch.box(
      mat,
      width,
      0.9,
      0.3,
      Math.sin(a) * layout.boardR,
      0.45,
      Math.cos(a) * layout.boardR,
      a
    );
  }
}

/** White sight screens on a timber frame, at the north and south ends (z = -/+ rope + 1.8). */
export function addSightScreens(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const z = layout.rope + 1.8;
  for (const sz of [-1, 1]) {
    batch.box(
      m.screen,
      SCREEN_HALF_WIDTH * 2,
      SCREEN_HEIGHT,
      0.3,
      0,
      SCREEN_HEIGHT / 2 + 0.7,
      sz * z
    );
    batch.box(m.frame, SCREEN_HALF_WIDTH * 2 + 0.6, 0.35, 0.6, 0, SCREEN_HEIGHT + 0.9, sz * z);
    for (const px of [-SCREEN_HALF_WIDTH, 0, SCREEN_HALF_WIDTH]) {
      batch.box(m.frame, 0.4, SCREEN_HEIGHT + 0.8, 0.5, px, (SCREEN_HEIGHT + 0.8) / 2, sz * z);
    }
  }
}

/** Players' gate: cream posts and lintel, timber doors, and a dark tunnel behind. */
export function addGate(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const g = layout.gateAngle;
  const at = (r: number, x: number, y: number): [number, number, number] => [
    Math.sin(g) * r + Math.cos(g) * x,
    y,
    Math.cos(g) * r - Math.sin(g) * x
  ];
  const r0 = layout.lower.r0;
  const rEnd = tierOuterR(layout.lower);
  const len = rEnd - r0;
  for (const sx of [-1, 1]) {
    batch.box(m.trim, 0.6, 3.6, len, ...at(r0 + len / 2, sx * 3.7, 1.8), g);
    batch.box(m.trim, 0.6, 4.2, 0.6, ...at(layout.wallR + 0.9, sx * 3.7, 2.1), g);
    batch.box(m.frame, 1.7, 3.2, 0.2, ...at(layout.wallR + 0.9, sx * 1.0, 1.6), g);
  }
  batch.box(m.frame, 8.4, 0.5, len, ...at(r0 + len / 2, 0, 3.85), g);
  batch.box(m.trim, 8.4, 3.45, len, ...at(r0 + len / 2, 0, 5.95), g);
  batch.box(m.trim, 8.4, 0.5, 0.7, ...at(layout.wallR + 0.9, 0, 4.45), g);
  batch.box(m.dark, 7.4, 3.6, 0.2, ...at(rEnd - 0.1, 0, 1.8), g);
}

/** A ring of static blocks just behind the boards, plus the sight screens. */
export function addEdgeColliders(
  world: RAPIER.World,
  rapier: typeof RAPIER,
  layout: BowlLayout
): () => void {
  const body = world.createRigidBody(rapier.RigidBodyDesc.fixed());
  const chord = (Math.PI * layout.wallR) / WALL_SEGMENTS;
  for (let k = 0; k < WALL_SEGMENTS; k++) {
    const a = ((k + 0.5) / WALL_SEGMENTS) * Math.PI * 2;
    const desc = rapier.ColliderDesc.cuboid(chord + 0.1, 1.6, 0.3)
      .setTranslation(Math.sin(a) * layout.wallR, 1.6, Math.cos(a) * layout.wallR)
      .setRotation(yawQuat(a));
    world.createCollider(desc, body);
  }
  const z = layout.rope + 1.8;
  for (const sz of [-1, 1]) {
    const half = SCREEN_HEIGHT / 2 + 0.4;
    world.createCollider(
      rapier.ColliderDesc.cuboid(SCREEN_HALF_WIDTH, half, 0.3).setTranslation(0, half, sz * z),
      body
    );
  }
  return () => world.removeRigidBody(body);
}
