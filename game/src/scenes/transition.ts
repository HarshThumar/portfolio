import * as THREE from 'three/webgpu';
import { followTarget } from '../loop/stage-camera';
import { intoModel, moveCamera, overGround, placeCamera, type Framing } from './camera-shots';
import type { Veil } from '../ui/veil';
import type { Portal } from './scene-types';
import type { CameraShot, GameState } from '../types';

const DIVE_SECONDS = 1.3;
const SWOOP_SECONDS = 1.8;
const VEIL_SECONDS = 0.35;
const REDUCED_VEIL_SECONDS = 0.25;
const SWOOP_HEIGHT = 70;

// Keeps the camera exactly where it is (behind the veil) until the next move starts.
const hold: CameraShot = () => false;

function behindRoller(state: GameState): (out: Framing) => void {
  return (out) => {
    if (state.vehicle) followTarget(state.vehicle, out.pos, out.look);
  };
}

/** Snaps the camera to its follow position behind the roller (first load, reduced motion). */
export function cameraToRoller(state: GameState): void {
  const f: Framing = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  behindRoller(state)(f);
  placeCamera(state.camera, state.cameraLook, f);
}

async function compile(state: GameState): Promise<void> {
  try {
    await state.renderer.compileAsync(state.scene, state.camera);
  } catch {
    // Compiling ahead only avoids a hitch; rendering compiles anyway.
  }
}

export interface TransitionSteps {
  state: GameState;
  veil: Veil;
  reduceMotion: boolean;
  /** The model being entered, when leaving the hub. */
  into?: Portal;
  /** Swaps scenes; returns the model being left, when arriving back at the hub. */
  swap: () => Portal | undefined;
}

/**
 * Hub → ground: plunge towards the model, veil, swap, swoop down onto the roller.
 * Ground → hub: veil, swap, rise out of the model we came from to the roller.
 * Reduced motion: a plain crossfade through the veil.
 */
export async function playTransition(steps: TransitionSteps): Promise<void> {
  const { state, veil, into } = steps;
  if (steps.reduceMotion) {
    state.cameraShot = hold;
    await veil.cover(REDUCED_VEIL_SECONDS);
    steps.swap();
    cameraToRoller(state);
    await compile(state);
    state.cameraShot = null;
    await veil.lift(REDUCED_VEIL_SECONDS);
    return;
  }

  if (into) {
    const dive = moveCamera(() => intoModel(into.model, into.size), DIVE_SECONDS);
    state.cameraShot = dive.shot;
    await dive.done;
  }
  state.cameraShot = hold;
  await veil.cover(VEIL_SECONDS);

  const left = steps.swap();
  placeCamera(
    state.camera,
    state.cameraLook,
    left ? intoModel(left.model, left.size) : overGround(SWOOP_HEIGHT)
  );
  await compile(state);

  const swoop = moveCamera(behindRoller(state), SWOOP_SECONDS);
  state.cameraShot = swoop.shot;
  await Promise.all([veil.lift(VEIL_SECONDS * 1.5), swoop.done]);
}
