import * as THREE from 'three/webgpu';
import type { KitPiece } from './kit-models';
import { easeInOutCubic } from './opening-timeline';
import flight from './kit-flight.json';

// The kit drifting in from round the view, rushing together and piling up into a tumbling
// cluster (docs/03: "all the things coming in"). The motion is a rigid-body simulation baked in
// Blender (assets-src/opening/kit_flight.py) and played back here, so the pieces really collide.

interface FlightData {
  fps: number;
  scale: number;
  kinds: string[];
  centres: number[][];
  frames: number[][][];
}

const DATA = flight as FlightData;

export interface ActivePiece {
  piece: KitPiece;
  /** Sits at the piece's bounding-box centre, where the simulation tracked it. */
  holder: THREE.Group;
}

export function setupActivePieces(cluster: THREE.Object3D, pieces: KitPiece[]): ActivePiece[] {
  return pieces.map((piece, i) => {
    if (DATA.kinds[i] !== piece.kind) {
      throw new Error(`kit-flight.json is out of date (piece ${i}); run npm run bake:opening`);
    }
    const holder = new THREE.Group();
    const c = DATA.centres[i]!;
    piece.object.scale.setScalar(DATA.scale);
    piece.object.position.set(-c[0]! * DATA.scale, -c[1]! * DATA.scale, -c[2]! * DATA.scale);
    holder.add(piece.object);
    cluster.add(holder);
    return { piece, holder };
  });
}

const qa = new THREE.Quaternion();
const qb = new THREE.Quaternion();

/** Plays the baked flight at `t` seconds; `panels` (0→1) tucks the pile inside the ball. */
export function updateActivePieces(active: ActivePiece[], t: number, panels: number): void {
  const f = Math.max(0, Math.min(DATA.frames.length - 1, t * DATA.fps));
  const i0 = Math.floor(f);
  const i1 = Math.min(DATA.frames.length - 1, i0 + 1);
  const k = f - i0;
  // As the leather closes over it, the pile squeezes a little and is gone once it's shut.
  const tuck = 1 - 0.4 * easeInOutCubic(panels);
  active.forEach((item, i) => {
    const a = DATA.frames[i0]![i]!;
    const b = DATA.frames[i1]![i]!;
    item.holder.position.set(
      (a[0]! + (b[0]! - a[0]!) * k) * tuck,
      (a[1]! + (b[1]! - a[1]!) * k) * tuck,
      (a[2]! + (b[2]! - a[2]!) * k) * tuck
    );
    qa.set(a[3]!, a[4]!, a[5]!, a[6]!);
    qb.set(b[3]!, b[4]!, b[5]!, b[6]!);
    item.holder.quaternion.slerpQuaternions(qa, qb, k);
    item.holder.scale.setScalar(tuck);
    item.holder.visible = panels < 0.97;
  });
}

/** Hides the kit at once (skips and returning visitors). */
export function collapseActivePieces(active: ActivePiece[]): void {
  for (const item of active) item.holder.visible = false;
}
