import * as THREE from 'three/webgpu';
import type { CameraShot } from '../types';

export interface Framing {
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeIn = (t: number): number => t * t * t;

/**
 * Moves the camera from where it is now to `to` over `seconds`. `to` is read every frame, so it
 * can follow a moving target (the roller). The promise resolves when the move ends.
 */
export function moveCamera(
  to: (out: Framing) => void,
  seconds: number,
  curve: 'in' | 'inOut' = 'inOut'
): { shot: CameraShot; done: Promise<void> } {
  const ease = curve === 'in' ? easeIn : easeInOut;
  const from: Framing = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  const target: Framing = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  let started = false;
  let t = 0;
  let resolve: () => void = () => undefined;
  const done = new Promise<void>((r) => {
    resolve = r;
  });

  const shot: CameraShot = (camera, look, dt) => {
    if (!started) {
      from.pos.copy(camera.position);
      from.look.copy(look);
      started = true;
    }
    t = Math.min(1, t + dt / seconds);
    to(target);
    const k = ease(t);
    camera.position.lerpVectors(from.pos, target.pos, k);
    look.lerpVectors(from.look, target.look, k);
    if (t >= 1) resolve();
    return t >= 1;
  };
  return { shot, done };
}

/** Puts the camera exactly at a framing (used right after a scene swap, behind the veil). */
export function placeCamera(
  camera: THREE.PerspectiveCamera,
  look: THREE.Vector3,
  f: Framing
): void {
  camera.position.copy(f.pos);
  look.copy(f.look);
  camera.lookAt(look);
}

/** Looking down into a ground model on its plinth, close enough that it fills the view. */
export function intoModel(model: { x: number; y: number; z: number }, size: number): Framing {
  // Approach from the stadium centre side so the dive reads as "into" the model.
  const len = Math.hypot(model.x, model.z) || 1;
  const dirX = -model.x / len;
  const dirZ = -model.z / len;
  return {
    pos: new THREE.Vector3(
      model.x + dirX * size * 0.35,
      model.y + size * 0.9,
      model.z + dirZ * size * 0.35
    ),
    look: new THREE.Vector3(model.x, model.y, model.z)
  };
}

/** High above a full-size ground, looking down at the square: where the swoop-in starts. */
export function overGround(height: number): Framing {
  return {
    pos: new THREE.Vector3(0, height, height * 0.35),
    look: new THREE.Vector3(0, 0, 0)
  };
}
