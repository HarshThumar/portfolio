import * as THREE from 'three';
import type { GameState } from '../types';

export interface TouchControls {
  destroy: () => void;
}

function createJoystickElements(): { container: HTMLElement; knob: HTMLElement } {
  const container = document.createElement('div');
  container.id = 'touch-joystick';
  Object.assign(container.style, {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    border: '2px solid var(--ink, #1e1b16)',
    backgroundColor: 'var(--cream, #f3ead3)',
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
    backgroundColor: 'var(--ink, #1e1b16)',
    pointerEvents: 'none'
  });
  container.appendChild(knob);
  document.body.appendChild(container);
  return { container, knob };
}

function bindJoystickEvents(
  container: HTMLElement,
  knob: HTMLElement,
  state: GameState
): () => void {
  let activeTouchId: number | null = null;
  const maxRadius = 35;

  const onTouchMove = (e: TouchEvent): void => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch && touch.identifier === activeTouchId) {
        const rect = container.getBoundingClientRect();
        let dx = touch.clientX - (rect.left + rect.width / 2);
        let dy = touch.clientY - (rect.top + rect.height / 2);
        const dist = Math.hypot(dx, dy);

        if (dist > maxRadius) {
          dx = (dx / dist) * maxRadius;
          dy = (dy / dist) * maxRadius;
        }

        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        state.inputs.steer = dx / maxRadius;
        state.inputs.forward = -dy / maxRadius;
      }
    }
  };

  const onTouchStart = (e: TouchEvent): void => {
    if (activeTouchId === null && e.changedTouches[0]) {
      activeTouchId = e.changedTouches[0].identifier;
    }
  };

  const onTouchEnd = (e: TouchEvent): void => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch && touch.identifier === activeTouchId) {
        activeTouchId = null;
        knob.style.transform = 'translate(0px, 0px)';
        state.inputs.steer = 0;
        state.inputs.forward = 0;
      }
    }
  };

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });

  return () => {
    container.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
  };
}

function createJoystick(state: GameState): {
  container: HTMLElement;
  destroy: () => void;
} {
  const { container, knob } = createJoystickElements();
  const unbind = bindJoystickEvents(container, knob, state);

  return {
    container,
    destroy: () => {
      unbind();
      if (container.parentNode) container.parentNode.removeChild(container);
    }
  };
}

function createHonkButton(state: GameState): {
  btn: HTMLElement;
  destroy: () => void;
} {
  const btn = document.createElement('button');
  btn.id = 'touch-honk';
  btn.textContent = 'HORN';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: '2px solid var(--ink, #1e1b16)',
    backgroundColor: 'var(--cream, #f3ead3)',
    color: 'var(--ink, #1e1b16)',
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    zIndex: '500',
    touchAction: 'none'
  });
  document.body.appendChild(btn);

  const onStart = (): void => {
    state.inputs.horn = true;
  };
  const onEnd = (): void => {
    state.inputs.horn = false;
  };

  btn.addEventListener('touchstart', onStart, { passive: true });
  btn.addEventListener('touchend', onEnd, { passive: true });
  btn.addEventListener('mousedown', onStart);
  btn.addEventListener('mouseup', onEnd);

  return {
    btn,
    destroy: () => {
      btn.removeEventListener('touchstart', onStart);
      btn.removeEventListener('touchend', onEnd);
      btn.removeEventListener('mousedown', onStart);
      btn.removeEventListener('mouseup', onEnd);
      if (btn.parentNode) btn.parentNode.removeChild(btn);
    }
  };
}

function setupClickToDrive(state: GameState): () => void {
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersectPoint = new THREE.Vector3();

  const onPointerDown = (e: PointerEvent): void => {
    const target = e.target as HTMLElement;
    if (
      target.id === 'touch-joystick' ||
      target.id === 'touch-honk' ||
      target.closest('#perf-debug-panel')
    ) {
      return;
    }

    const mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, state.camera);
    if (raycaster.ray.intersectPlane(groundPlane, intersectPoint)) {
      if (state.vehicle) {
        state.vehicle.driveTarget = { x: intersectPoint.x, z: intersectPoint.z };
      }
    }
  };

  window.addEventListener('pointerdown', onPointerDown);
  return () => window.removeEventListener('pointerdown', onPointerDown);
}

export function setupTouchAndClickControls(state: GameState): TouchControls {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const disposables: Array<() => void> = [];

  if (isTouchDevice) {
    const { destroy: destroyJoy } = createJoystick(state);
    const { destroy: destroyHonk } = createHonkButton(state);
    disposables.push(destroyJoy, destroyHonk);
  }

  const cleanupClick = setupClickToDrive(state);
  disposables.push(cleanupClick);

  return {
    destroy: () => {
      for (const fn of disposables) fn();
    }
  };
}
