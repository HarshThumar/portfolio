import * as THREE from 'three/webgpu';
import type { KitPiece } from './kit-models';
import { pieceProgress } from './opening-timeline';

export interface ActivePiece {
  piece: KitPiece;
  startPos: THREE.Vector3;
  curveOffset: THREE.Vector3;
  startRot: THREE.Euler;
  spinAxis: THREE.Vector3;
  delay: number;
  duration: number;
}

const BALL_Y = 55;
const BALL_Z = -10;

/** Scatters kit pieces 16–28 m around the ball and configures flight paths. */
// Kit is drawn about twice life size so each piece reads at a glance from the camera.
const PIECE_SCALE = 2.2;
export function setupActivePieces(scene: THREE.Scene, pieces: KitPiece[]): ActivePiece[] {
  const active: ActivePiece[] = [];
  const total = pieces.length;

  for (let i = 0; i < total; i++) {
    const piece = pieces[i]!;
    const dist = 16 + Math.random() * 12;
    // Disperse in front of and around camera
    const angle = (i / total) * Math.PI * 1.8 - 0.9 * Math.PI + (Math.random() - 0.5) * 0.3;
    const dy = (Math.random() - 0.5) * 16;

    const startPos = new THREE.Vector3(
      Math.sin(angle) * dist,
      BALL_Y + dy,
      BALL_Z - Math.cos(angle) * dist * 0.65
    );

    const curveOffset = new THREE.Vector3(
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 10
    );

    const startRot = new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    const spinAxis = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();

    piece.object.position.copy(startPos);
    piece.object.rotation.copy(startRot);
    scene.add(piece.object);

    active.push({
      piece,
      startPos,
      curveOffset,
      startRot,
      spinAxis,
      delay: 0.3 + (i / total) * 1.4 + Math.random() * 0.2,
      duration: 1.1 + Math.random() * 0.3
    });
  }

  return active;
}

const currentPos = new THREE.Vector3();

/** Updates piece trajectories towards the ball centre; returns average assembled fraction. */
export function updateActivePieces(
  activePieces: ActivePiece[],
  t: number,
  targetPos: THREE.Vector3
): number {
  let totalProgress = 0;

  for (const item of activePieces) {
    const p = pieceProgress(t, item.delay, item.duration);
    totalProgress += p;

    if (p <= 0) {
      item.piece.object.position.copy(item.startPos);
      item.piece.object.scale.setScalar(PIECE_SCALE);
      item.piece.object.visible = true;
      continue;
    }

    if (p >= 1) {
      item.piece.object.visible = false;
      item.piece.object.scale.setScalar(0);
      continue;
    }

    // Curved flight path using quadratic midpoint
    const arcHeight = 4 * p * (1 - p);
    currentPos.lerpVectors(item.startPos, targetPos, p);
    currentPos.addScaledVector(item.curveOffset, arcHeight);
    item.piece.object.position.copy(currentPos);

    // Spin during flight
    item.piece.object.rotation.copy(item.startRot);
    item.piece.object.rotateOnAxis(item.spinAxis, p * Math.PI * 4);

    // Shrink into ball surface as it arrives
    const scale = p > 0.82 ? Math.max(0, (1 - p) / 0.18) : 1;
    item.piece.object.scale.setScalar(scale * PIECE_SCALE);
    item.piece.object.visible = scale > 0.01;
  }

  return totalProgress / activePieces.length;
}

/** Instantly hides and collapses all kit pieces (for skips / returning visitors). */
export function collapseActivePieces(activePieces: ActivePiece[]): void {
  for (const item of activePieces) {
    item.piece.object.visible = false;
    item.piece.object.scale.setScalar(0);
  }
}
