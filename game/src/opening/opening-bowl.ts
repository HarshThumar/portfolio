import * as THREE from 'three/webgpu';
import type { GameState } from '../types';
import type { SoundManager } from '../audio/audio';
import { moveCamera, placeCamera } from '../scenes/camera-shots';
import { followTarget } from '../loop/stage-camera';
import { createVeil } from '../ui/veil';
import type { GiantBall } from './giant-ball';

const DROP_DURATION = 0.9;
const MOVE_DURATION = 1.6;

interface BowlParams {
  state: GameState;
  sound: SoundManager;
  ball: GiantBall;
  cleanup: () => void;
  onDone: () => void;
}

/** Reduced motion alternative: short cream veil crossfade into the hub roller. */
export async function runReducedMotionBowl(params: BowlParams): Promise<void> {
  const veil = createVeil();
  await veil.cover(0.25);
  params.cleanup();
  if (params.state.vehicle) {
    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();
    followTarget(params.state.vehicle, pos, look);
    placeCamera(params.state.camera, params.state.cameraLook, { pos, look });
  }
  params.state.cameraShot = null;
  await veil.lift(0.25);
  veil.destroy();
  params.onDone();
}

function updateDrop(
  t: number,
  ballGroup: THREE.Group,
  camera: THREE.PerspectiveCamera,
  look: THREE.Vector3
): void {
  const p = Math.min(1, t / DROP_DURATION);
  // Accelerated gravity-like drop
  const dropP = p * p;
  const ballY = 55 - (55 - 4) * dropP;
  const ballZ = -10 + 10 * p;
  ballGroup.position.set(0, ballY, ballZ);

  // Camera descends while tracking the falling ball
  const camY = 48 - (48 - 14) * p;
  const camZ = 5 + 15 * p;
  camera.position.set(0, camY, camZ);
  look.set(0, ballY, ballZ);
}

function updateBounce(t: number, ballGroup: THREE.Group): void {
  const p = Math.min(1, (t - DROP_DURATION) / 1.0);
  // Parabolic bounce over the north stand
  const bounceY = 4 + 32 * (4 * p * (1 - p));
  const bounceZ = -105 * p;
  ballGroup.position.set(0, bounceY, bounceZ);
  const scale = Math.max(0, 1 - p * 1.1);
  ballGroup.scale.setScalar(scale);
  ballGroup.visible = scale > 0.01;
}

/** Animates the ball bowling into the Ahmedabad pitch, bouncing out, and returning camera. */
export function startBowlAnimation(params: BowlParams): void {
  const { state, sound, ball, cleanup, onDone } = params;
  sound.playWhoosh();

  let elapsed = 0;
  let landed = false;
  let moveShot: ReturnType<typeof moveCamera> | null = null;

  state.cameraShot = (camera, look, dt) => {
    elapsed += dt;

    if (elapsed < DROP_DURATION) {
      updateDrop(elapsed, ball.group, camera, look);
      return false;
    }

    if (!landed) {
      landed = true;
      ball.group.position.set(0, 4, 0);
      sound.playThud();
      sound.playSixRoar();
      moveShot = moveCamera((out) => {
        if (state.vehicle) {
          followTarget(state.vehicle, out.pos, out.look);
        }
      }, MOVE_DURATION);
    }

    updateBounce(elapsed, ball.group);

    if (moveShot) {
      const finished = moveShot.shot(camera, look, dt);
      if (finished) {
        cleanup();
        onDone();
        return true;
      }
    }

    return false;
  };
}
