import * as THREE from 'three/webgpu';
import type { KitPiece } from './kit-models';
import { easeInOutCubic, pieceProgress } from './opening-timeline';

// The kit drifting in from every side of the view and gathering into a tumbling cluster at the
// centre (docs/03: "all the things coming in"). Positions are local to `cluster`, which sits at
// the ball's centre.

// Kit is drawn about twice life size so each piece reads at a glance.
const PIECE_SCALE = 2.2;
const ORBIT_SPEED = 0.35;

export interface ActivePiece {
  piece: KitPiece;
  start: THREE.Vector3;
  target: THREE.Vector3;
  bend: THREE.Vector3;
  startRot: THREE.Euler;
  spinAxis: THREE.Vector3;
  spinRate: number;
  delay: number;
  duration: number;
}

const UP = new THREE.Vector3(0, 1, 0);

function randomDir(out: THREE.Vector3): THREE.Vector3 {
  const u = Math.random() * 2 - 1;
  const a = Math.random() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return out.set(Math.cos(a) * s, u * 0.7, Math.sin(a) * s).normalize();
}

/** A start point 16–30 m out, never behind or right beside the camera. */
function pickStart(camLocal: THREE.Vector3): THREE.Vector3 {
  const camDir = camLocal.clone().normalize();
  const dir = new THREE.Vector3();
  const start = new THREE.Vector3();
  for (let tries = 0; tries < 30; tries++) {
    randomDir(dir);
    if (dir.dot(camDir) > 0.35) continue;
    start.copy(dir).multiplyScalar(16 + Math.random() * 14);
    if (start.distanceTo(camLocal) > 12) break;
  }
  return start;
}

export function setupActivePieces(
  cluster: THREE.Object3D,
  pieces: KitPiece[],
  camLocal: THREE.Vector3
): ActivePiece[] {
  const total = pieces.length;
  return pieces.map((piece, i) => {
    const start = pickStart(camLocal);
    const target = randomDir(new THREE.Vector3()).multiplyScalar(1.2 + Math.random() * 2.3);
    const bend = new THREE.Vector3()
      .crossVectors(start, UP)
      .normalize()
      .multiplyScalar((Math.random() - 0.5) * 12);
    bend.y += (Math.random() - 0.5) * 6;
    piece.object.position.copy(start);
    piece.object.scale.setScalar(PIECE_SCALE);
    cluster.add(piece.object);
    return {
      piece,
      start,
      target,
      bend,
      startRot: new THREE.Euler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28),
      spinAxis: randomDir(new THREE.Vector3()),
      spinRate: 0.6 + Math.random() * 0.8,
      delay: 0.3 + (i / total) * 1.2 + Math.random() * 0.15,
      duration: 0.9 + Math.random() * 0.35
    };
  });
}

const goal = new THREE.Vector3();

/** Flies the kit in and keeps the cluster tumbling; `panels` (0→1) shrinks it into the ball. */
export function updateActivePieces(active: ActivePiece[], t: number, panels: number): void {
  const shrink = easeInOutCubic(Math.min(1, panels / 0.7));
  for (const item of active) {
    const obj = item.piece.object;
    const p = pieceProgress(t, item.delay, item.duration);
    // Once gathered, the cluster slowly turns round its centre.
    goal.copy(item.target).applyAxisAngle(UP, t * ORBIT_SPEED);
    obj.position.lerpVectors(item.start, goal, p).addScaledVector(item.bend, 4 * p * (1 - p));
    // Before its flight a piece is already drifting slowly inward, so nothing waits still.
    if (p <= 0) obj.position.multiplyScalar(1 + 0.3 * (1 - t / item.delay));
    obj.position.multiplyScalar(1 - shrink);
    obj.rotation.copy(item.startRot);
    obj.rotateOnAxis(item.spinAxis, t * item.spinRate + p * Math.PI * 2);
    const scale = PIECE_SCALE * (1 - shrink);
    obj.scale.setScalar(scale);
    obj.visible = scale > 0.01;
  }
}

/** Hides the kit at once (skips and returning visitors). */
export function collapseActivePieces(active: ActivePiece[]): void {
  for (const item of active) item.piece.object.visible = false;
}
