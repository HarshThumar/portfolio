import * as THREE from 'three/webgpu';
import { STAMP_DIR, STAMP_UP } from './giant-ball';

// Where the opening camera sits and how the ball turns its stamp to it.

/** The ball hangs high above the hub, inside the overcast, with the stadium hidden below. */
export const OPENING_CENTRE = new THREE.Vector3(0, 320, 0);

const ORBIT_RADIUS = 17;
const ORBIT_SPEED = 0.1;
const START_ANGLE = 0.4;
// The camera looks a little below the ball so it sits in the upper half, clear of the text.
const LOOK_DROP = 2.2;

/** A slow orbit round the ball, Messenger-style, with a slight bob. */
export function orbitCamera(
  t: number,
  aspect: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3
): void {
  // On a tall phone screen, stand further back so the whole ball still fits across.
  const reach = Math.max(1, 0.72 / Math.max(0.3, aspect));
  const r = ORBIT_RADIUS * reach;
  const a = START_ANGLE + t * ORBIT_SPEED;
  outPos.set(
    OPENING_CENTRE.x + Math.sin(a) * r,
    OPENING_CENTRE.y + 2.5 * reach + Math.sin(t * 0.5) * 0.6,
    OPENING_CENTRE.z + Math.cos(a) * r
  );
  outLook.copy(OPENING_CENTRE);
  outLook.y -= LOOK_DROP * reach;
}

const localBasisT = new THREE.Matrix4()
  .makeBasis(new THREE.Vector3().crossVectors(STAMP_UP, STAMP_DIR), STAMP_UP, STAMP_DIR)
  .transpose();
const worldBasis = new THREE.Matrix4();
const n = new THREE.Vector3();
const up = new THREE.Vector3();
const right = new THREE.Vector3();
const TILT = 0.14;
const TIP = 0.42;

/** The ball's rotation that shows the stamp to the camera, upright with a slight jaunty tilt. */
export function stampFacing(cameraPos: THREE.Vector3, out: THREE.Quaternion): THREE.Quaternion {
  n.subVectors(cameraPos, OPENING_CENTRE).normalize();
  up.set(0, 1, 0).addScaledVector(n, -n.y).normalize();
  // Aim the stamp a little above the camera, so the main seam below it rolls into view.
  n.addScaledVector(up, TIP).normalize();
  up.addScaledVector(n, -up.dot(n)).normalize();
  up.applyAxisAngle(n, TILT);
  right.crossVectors(up, n);
  worldBasis.makeBasis(right, up, n).multiply(localBasisT);
  return out.setFromRotationMatrix(worldBasis);
}
