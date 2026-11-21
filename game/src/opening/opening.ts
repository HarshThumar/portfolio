import * as THREE from 'three/webgpu';
import type { GameState } from '../types';
import type { SoundManager } from '../audio/audio';
import { createGiantBall, type GiantBall } from './giant-ball';
import { createKitPieces } from './kit-models';
import { setupActivePieces, updateActivePieces, collapseActivePieces } from './opening-pieces';
import { createOpeningOverlay } from './opening-overlay';
import { startBowlAnimation, runReducedMotionBowl } from './opening-bowl';

const BALL_POS = new THREE.Vector3(0, 55, -10);
// The camera looks slightly down past the ball, so the ball sits in the upper half (clear of
// the name and button) and the stadium's roof ring and LED lights show below it.
const CAM_POS = new THREE.Vector3(0, 58, 9);
const CAM_LOOK = new THREE.Vector3(0, 50, -10);
const READY_TIME = 3.6;
const SEEN_KEY = 'tour-opening-seen';

function checkSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function checkReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // localStorage blocked
  }
}

function bindSkip(onSkip: () => void): () => void {
  window.addEventListener('keydown', onSkip);
  window.addEventListener('pointerdown', onSkip);
  return () => {
    window.removeEventListener('keydown', onSkip);
    window.removeEventListener('pointerdown', onSkip);
  };
}

export interface OpeningController {
  dispose: () => void;
}

/** Orchestrates the cricket kit flying together into the giant red ball in the hub sky. */
export function playOpening(params: {
  state: GameState;
  sound: SoundManager;
  base: string;
  onDone: () => void;
}): OpeningController {
  const { state, sound, base, onDone } = params;
  document.body.classList.add('opening');

  const ball: GiantBall = createGiantBall();
  ball.group.position.copy(BALL_POS);
  state.scene.add(ball.group);

  const rawPieces = createKitPieces();
  const activePieces = setupActivePieces(state.scene, rawPieces);

  let elapsed = 0;
  let isReady = false;
  let disposed = false;
  let removeSkip = (): void => {};

  const jumpToReady = (): void => {
    elapsed = READY_TIME;
    isReady = true;
    collapseActivePieces(activePieces);
    ball.setAssembled(1);
    ball.setSeam(1);
    overlay.show();
    removeSkip();
  };

  const overlay = createOpeningOverlay({
    base,
    onPlay: () => {
      markSeen();
      removeSkip();
      overlay.hide();
      const bowlParams = { state, sound, ball, cleanup, onDone };
      if (checkReducedMotion()) {
        void runReducedMotionBowl(bowlParams);
      } else {
        startBowlAnimation(bowlParams);
      }
    }
  });

  removeSkip = bindSkip(() => {
    if (!isReady) jumpToReady();
  });

  if (checkSeen() || checkReducedMotion()) jumpToReady();

  state.cameraShot = (camera, look, dt) => {
    camera.position.copy(CAM_POS);
    look.copy(CAM_LOOK);
    if (isReady) {
      ball.group.rotation.y += 0.25 * dt;
      return false;
    }
    elapsed += dt;
    if (elapsed < 3.0) {
      ball.setAssembled(updateActivePieces(activePieces, elapsed, BALL_POS));
    } else if (elapsed < READY_TIME) {
      collapseActivePieces(activePieces);
      ball.setAssembled(1);
      ball.setSeam((elapsed - 3.0) / 0.6);
    } else {
      jumpToReady();
    }
    return false;
  };

  const cleanup = (): void => {
    if (disposed) return;
    disposed = true;
    removeSkip();
    overlay.destroy();
    document.body.classList.remove('opening');
    state.scene.remove(ball.group);
    ball.dispose();
    activePieces.forEach((item) => item.piece.dispose());
  };

  return {
    dispose: () => {
      cleanup();
      state.cameraShot = null;
    }
  };
}
