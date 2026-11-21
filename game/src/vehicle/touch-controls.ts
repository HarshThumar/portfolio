import * as THREE from 'three/webgpu';
import type { GameState } from '../types';

export interface TouchControls {
  destroy: () => void;
}

const JOYSTICK_RADIUS = 35;

function createJoystickElements(): { container: HTMLElement; knob: HTMLElement } {
  const container = document.createElement('div');
  container.id = 'touch-joystick';
  // Circles are deliberate here: a joystick base and knob are round by function, not decoration.
  Object.assign(container.style, {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    border: '2px solid var(--ink)',
    backgroundColor: 'var(--cream)',
    opacity: '0.85',
    touchAction: 'none',
    zIndex: '500'
  });

  const knob = document.createElement('div');
  Object.assign(knob.style, {
    position: 'absolute',
    top: '25px',
    left: '25px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--ink)',
    pointerEvents: 'none'
  });
  container.appendChild(knob);
  document.body.appendChild(container);
  return { container, knob };
}

function createJoystick(state: GameState): () => void {
  const { container, knob } = createJoystickElements();
  let activeId: number | null = null;

  const reset = (): void => {
    activeId = null;
    knob.style.transform = 'translate(0px, 0px)';
    state.inputs.steer = 0;
    state.inputs.forward = 0;
  };

  const apply = (e: PointerEvent): void => {
    const rect = container.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_RADIUS) {
      dx = (dx / dist) * JOYSTICK_RADIUS;
      dy = (dy / dist) * JOYSTICK_RADIUS;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    state.inputs.steer = dx / JOYSTICK_RADIUS;
    state.inputs.forward = -dy / JOYSTICK_RADIUS;
  };

  const onDown = (e: PointerEvent): void => {
    if (activeId !== null) return;
    activeId = e.pointerId;
    container.setPointerCapture(e.pointerId);
    apply(e);
  };
  const onMove = (e: PointerEvent): void => {
    if (e.pointerId === activeId) apply(e);
  };
  const onEnd = (e: PointerEvent): void => {
    if (e.pointerId === activeId) reset();
  };

  container.addEventListener('pointerdown', onDown);
  container.addEventListener('pointermove', onMove);
  container.addEventListener('pointerup', onEnd);
  container.addEventListener('pointercancel', onEnd);
  container.addEventListener('lostpointercapture', onEnd);

  return () => {
    container.removeEventListener('pointerdown', onDown);
    container.removeEventListener('pointermove', onMove);
    container.removeEventListener('pointerup', onEnd);
    container.removeEventListener('pointercancel', onEnd);
    container.removeEventListener('lostpointercapture', onEnd);
    container.remove();
  };
}

function createHonkButton(state: GameState): () => void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'touch-honk';
  btn.textContent = 'Horn';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    minWidth: '72px',
    minHeight: '48px',
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    border: '2px solid var(--ink)',
    backgroundColor: 'var(--cream)',
    color: 'var(--ink)',
    boxShadow: '2px 2px 0 var(--ink)',
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    zIndex: '500',
    touchAction: 'none'
  });
  document.body.appendChild(btn);

  const onDown = (e: PointerEvent): void => {
    btn.setPointerCapture(e.pointerId);
    state.inputs.horn = true;
  };
  const onEnd = (): void => {
    state.inputs.horn = false;
  };

  btn.addEventListener('pointerdown', onDown);
  btn.addEventListener('pointerup', onEnd);
  btn.addEventListener('pointercancel', onEnd);
  btn.addEventListener('lostpointercapture', onEnd);

  return () => {
    btn.removeEventListener('pointerdown', onDown);
    btn.removeEventListener('pointerup', onEnd);
    btn.removeEventListener('pointercancel', onEnd);
    btn.removeEventListener('lostpointercapture', onEnd);
    btn.remove();
  };
}

/** Listens on the canvas only, so HUD buttons, dialogs and links never set a target. */
function setupClickToDrive(state: GameState): () => void {
  const canvas = state.canvas;
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersectPoint = new THREE.Vector3();
  const ndc = new THREE.Vector2();

  const onPointerDown = (e: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, state.camera);
    if (raycaster.ray.intersectPlane(groundPlane, intersectPoint) && state.vehicle) {
      state.vehicle.driveTarget = { x: intersectPoint.x, z: intersectPoint.z };
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  return () => canvas.removeEventListener('pointerdown', onPointerDown);
}

export function setupTouchAndClickControls(state: GameState): TouchControls {
  const disposables: Array<() => void> = [setupClickToDrive(state)];

  if (window.matchMedia('(pointer: coarse)').matches) {
    disposables.push(createJoystick(state), createHonkButton(state));
  }

  return {
    destroy: () => {
      for (const fn of disposables) fn();
      state.inputs.forward = 0;
      state.inputs.steer = 0;
      state.inputs.horn = false;
    }
  };
}
