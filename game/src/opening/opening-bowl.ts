import * as THREE from 'three/webgpu';
import type { GameState, VehicleState } from '../types';
import type { SoundManager } from '../audio/audio';
import { moveCamera, placeCamera, type Framing } from '../scenes/camera-shots';
import { followTarget } from '../loop/stage-camera';
import { createVeil } from '../ui/veil';
import { BALL_RADIUS, type GiantBall } from './giant-ball';
import type { OpeningSky } from './opening-sky';
import { OPENING_CENTRE } from './opening-pose';

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
const ARC = new THREE.Vector3().copy(OPENING_CENTRE).add(new THREE.Vector3(0, 18, -45));
const SIX = new THREE.Vector3(0, 55, -150);

interface BowlParams {
  state: GameState;
  sound: SoundManager;
  ball: GiantBall;
  sky: OpeningSky;
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
  const { state, sound, ball, sky, cleanup, onDone } = params;
  sound.playWhoosh();
  const ballPos = ball.group.position;
  const from = new THREE.Vector3().copy(ballPos);
  const camFrom = new THREE.Vector3();
  const lookFrom = new THREE.Vector3();
  const chase = new THREE.Vector3();
  const landedAt = new THREE.Vector3();
  let t = 0;
  let landedT = -1;
  let launched = false;
  let handover: ReturnType<typeof moveCamera> | null = null;

  const fly = (camera: THREE.PerspectiveCamera, look: THREE.Vector3, dt: number): void => {
    if (t < WIND_UP) {
      // A short wind-up: the ball lifts and draws back before it is let go.
      const k = Math.sin((t / WIND_UP) * Math.PI * 0.5);
      ballPos.copy(from).add(chase.set(0, 1.4 * k, 1.2 * k));
      camFrom.copy(camera.position);
      lookFrom.copy(look);
      return;
    }
    if (!launched) {
      launched = true;
      from.copy(ballPos);
    }
    const f = Math.min(1, (t - WIND_UP) / FLIGHT);
    bezier(from, ARC, PITCH, f * f, ballPos);
    ball.group.rotateX(-9 * dt);
    chase.set(ballPos.x, ballPos.y + CHASE_UP, ballPos.z + CHASE_BACK);
    camera.position.lerpVectors(camFrom, chase, smooth(Math.min(1, f / 0.3)));
    camera.position.y = Math.max(camera.position.y, CAMERA_FLOOR);
    look.lerpVectors(lookFrom, ballPos, smooth(Math.min(1, f / 0.2)));
    // Out of the overcast as the ball falls through the deck: the stadium appears below.
    sky.setClear((240 - ballPos.y) / 100);
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
        handover = moveCamera((out) => rollerFraming(state.vehicle, out), HANDOVER);
      }
      return false;
    }
    // Off the pitch and away over the stand like a six, shrinking out of sight.
    const b = Math.min(1, (t - landedT) / BOUNCE);
    ballPos.lerpVectors(landedAt, SIX, b);
    ballPos.y = BALL_RADIUS + 60 * b * (1 - b) + (SIX.y - BALL_RADIUS) * b * b;
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
