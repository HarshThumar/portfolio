import * as THREE from 'three/webgpu';
import type { GameState, VehicleState } from '../types';
import type { SoundManager } from '../audio/audio';
import { moveCamera, placeCamera, type Framing } from '../scenes/camera-shots';
import { followTarget } from '../loop/stage-camera';
import { createVeil } from '../ui/veil';
import { BALL_RADIUS, type GiantBall } from './giant-ball';
import type { OpeningSky } from './opening-sky';
import type { OpeningClouds } from './opening-clouds';
import { OPENING_CENTRE } from './opening-pose';
import { DECK_BOTTOM, DECK_TOP } from './opening-clouds';

// Play: the ball is bowled down through the cloud deck, the stadium appears below, the ball
// pitches on the square and flies off like a six, and the camera settles behind the roller.

const WIND_UP = 0.35;
const FLIGHT = 2.1;
const HANDOVER = 1.6;
const BOUNCE = 1.4;
const CHASE_BACK = 20;
const CHASE_UP = 8;
const CAMERA_FLOOR = 30;

const PITCH = new THREE.Vector3(0, BALL_RADIUS, -2);
const DECK_MID = (DECK_TOP + DECK_BOTTOM) / 2;

/** The way the roller faces, flat: the ball is bowled along it so the hand-over is a push, not a turn. */
function bowlingLine(vehicle: VehicleState | undefined): THREE.Vector3 {
  const fwd = new THREE.Vector3(0, 0, -1);
  if (vehicle) fwd.set(0, 0, 1).applyQuaternion(vehicle.model.group.quaternion);
  fwd.y = 0;
  return fwd.lengthSq() > 1e-6 ? fwd.normalize() : fwd.set(0, 0, -1);
}

interface BowlParams {
  state: GameState;
  sound: SoundManager;
  ball: GiantBall;
  sky: OpeningSky;
  clouds: OpeningClouds;
  cleanup: () => void;
  onDone: () => void;
}

function rollerFraming(vehicle: VehicleState | undefined, out: Framing): void {
  if (vehicle) followTarget(vehicle, out.pos, out.look);
  else {
    out.pos.set(0, 30, 40);
    out.look.set(0, 0, 0);
  }
}

/** Reduced motion: a short cream veil crossfade straight to the roller. */
export async function runReducedMotionBowl(params: BowlParams): Promise<void> {
  const veil = createVeil();
  await veil.cover(0.25);
  params.cleanup();
  const f: Framing = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  rollerFraming(params.state.vehicle, f);
  placeCamera(params.state.camera, params.state.cameraLook, f);
  params.state.cameraShot = null;
  await veil.lift(0.25);
  veil.destroy();
  params.onDone();
}

function bezier(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  t: number,
  out: THREE.Vector3
): void {
  const u = 1 - t;
  out
    .set(0, 0, 0)
    .addScaledVector(a, u * u)
    .addScaledVector(b, 2 * u * t)
    .addScaledVector(c, t * t);
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Bowls the ball down through the clouds onto the square and hands over to the roller. */
export function startBowlAnimation(params: BowlParams): void {
  const { state, sound, ball, sky, clouds, cleanup, onDone } = params;
  sound.playWhoosh();
  const ballPos = ball.group.position;
  const from = new THREE.Vector3().copy(ballPos);
  const camFrom = new THREE.Vector3();
  const lookFrom = new THREE.Vector3();
  const chase = new THREE.Vector3();
  const landedAt = new THREE.Vector3();
  const line = bowlingLine(state.vehicle);
  const arc = OPENING_CENTRE.clone().addScaledVector(line, 45);
  arc.y += 18;
  const six = PITCH.clone().addScaledVector(line, 150);
  six.y = 55;
  let t = 0;
  let landedT = -1;
  let launched = false;
  let handover: ReturnType<typeof moveCamera> | null = null;

  const fly = (camera: THREE.PerspectiveCamera, look: THREE.Vector3, dt: number): void => {
    if (t < WIND_UP) {
      // A short wind-up: the ball lifts and draws back before it is let go.
      const k = Math.sin((t / WIND_UP) * Math.PI * 0.5);
      ballPos.copy(from).addScaledVector(line, -1.2 * k);
      ballPos.y += 1.4 * k;
      camFrom.copy(camera.position);
      lookFrom.copy(look);
      return;
    }
    if (!launched) {
      launched = true;
      from.copy(ballPos);
    }
    const f = Math.min(1, (t - WIND_UP) / FLIGHT);
    bezier(from, arc, PITCH, f * f, ballPos);
    ball.group.rotateX(-9 * dt);
    chase.copy(ballPos).addScaledVector(line, -CHASE_BACK);
    chase.y += CHASE_UP;
    camera.position.lerpVectors(camFrom, chase, smooth(Math.min(1, f / 0.3)));
    camera.position.y = Math.max(camera.position.y, CAMERA_FLOOR);
    look.lerpVectors(lookFrom, ballPos, smooth(Math.min(1, f / 0.2)));
    // Through the cloud deck: the view whites out in cloud, and behind it the overcast gives
    // way to the hub's own sky, so the stadium is there when the camera comes out below.
    // The swap happens in one go at the middle of the deck, under a full white-out: changing
    // the lights recompiles materials, and the white hides that one slow frame.
    const y = camera.position.y;
    const cover = 1 - Math.min(1, Math.abs(y - DECK_MID) / ((DECK_TOP - DECK_BOTTOM) / 2));
    sky.setCloudCover(cover);
    clouds.group.visible = cover < 0.4;
    if (y < DECK_MID) sky.setClear(1);
  };

  state.cameraShot = (camera, look, dt) => {
    t += dt;
    sky.update(camera);
    if (landedT < 0) {
      fly(camera, look, dt);
      if (t >= WIND_UP + FLIGHT) {
        landedT = t;
        landedAt.copy(PITCH);
        sound.playThud();
        sound.playSixRoar();
        sky.setClear(1);
        sky.setCloudCover(0);
        handover = moveCamera((out) => rollerFraming(state.vehicle, out), HANDOVER);
      }
      return false;
    }
    // Off the pitch and away over the stand like a six, shrinking out of sight.
    const b = Math.min(1, (t - landedT) / BOUNCE);
    ballPos.lerpVectors(landedAt, six, b);
    ballPos.y = BALL_RADIUS + 60 * b * (1 - b) + (six.y - BALL_RADIUS) * b * b;
    ball.group.scale.setScalar(Math.max(0, 1 - b));
    ball.group.visible = b < 1;
    if (handover?.shot(camera, look, dt)) {
      cleanup();
      onDone();
      return true;
    }
    return false;
  };
}
