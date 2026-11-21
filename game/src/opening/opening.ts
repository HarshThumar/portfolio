import * as THREE from 'three/webgpu';
import type { GameState } from '../types';
import type { SoundManager } from '../audio/audio';
import { createGiantBall } from './giant-ball';
import { createKitPieces } from './kit-models';
import { setupActivePieces, updateActivePieces, collapseActivePieces } from './opening-pieces';
import { createOpeningOverlay } from './opening-overlay';
import { startBowlAnimation, runReducedMotionBowl } from './opening-bowl';
import { createOpeningSky } from './opening-sky';
import { createOpeningClouds } from './opening-clouds';
import { OPENING_CENTRE, orbitCamera, stampFacing } from './opening-pose';
import { STAMP_END, openingPhase } from './opening-timeline';

// docs/03, "Opening": under an overcast Test-match sky the kit gathers into a giant red ball,
// the seam stitches itself, the gold HT stamp turns to the camera, then Play bowls it down
// through the clouds into the Ahmedabad hub.

const SEEN_KEY = 'tour-opening-seen';
const SPIN_AXIS = new THREE.Vector3(0.35, 1, 0.15).normalize();

function checkSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Storage can be blocked; the opening just plays in full next time.
  }
}

function checkReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

function createStage(scene: THREE.Scene, aspect: number) {
  const sky = createOpeningSky(scene);
  const clouds = createOpeningClouds(OPENING_CENTRE);
  const ball = createGiantBall();
  ball.group.position.copy(OPENING_CENTRE);
  const cluster = new THREE.Group();
  cluster.position.copy(OPENING_CENTRE);
  scene.add(clouds.group, ball.group, cluster);

  const camPos = new THREE.Vector3();
  orbitCamera(0, aspect, camPos, new THREE.Vector3());
  const kit = createKitPieces();
  const pieces = setupActivePieces(cluster, kit, camPos.sub(OPENING_CENTRE));

  const dispose = (): void => {
    scene.remove(clouds.group, ball.group, cluster);
    clouds.dispose();
    ball.dispose();
    for (const k of kit) k.dispose();
    sky.dispose();
  };
  return { sky, clouds, ball, pieces, facing: new THREE.Quaternion(), dispose };
}

/** Plays the opening over the hub. The hub is already built underneath, hidden in the fog. */
export function playOpening(params: {
  state: GameState;
  sound: SoundManager;
  base: string;
  onDone: () => void;
}): OpeningController {
  const { state, sound, base, onDone } = params;
  document.body.classList.add('opening');
  const stage = createStage(state.scene, state.camera.aspect);
  const { sky, clouds, ball, pieces, facing } = stage;

  let elapsed = 0;
  let orbitT = 0;
  const still = checkReducedMotion();
  let isReady = false;
  let disposed = false;
  let removeSkip = (): void => undefined;

  const cleanup = (): void => {
    if (disposed) return;
    disposed = true;
    removeSkip();
    overlay.destroy();
    document.body.classList.remove('opening');
    stage.dispose();
  };

  const overlay = createOpeningOverlay({
    base,
    onPlay: () => {
      markSeen();
      removeSkip();
      overlay.hide();
      const bowl = { state, sound, ball, sky, cleanup, onDone };
      if (still) void runReducedMotionBowl(bowl);
      else startBowlAnimation(bowl);
    }
  });

  const jumpToReady = (): void => {
    if (isReady) return;
    isReady = true;
    elapsed = STAMP_END;
    collapseActivePieces(pieces);
    ball.setPanels(1);
    ball.setSeam(1);
    ball.setStamp(1);
    ball.group.quaternion.copy(stampFacing(state.camera.position, facing));
    overlay.show();
    removeSkip();
  };

  state.cameraShot = (camera, look, dt) => {
    if (!still) orbitT += dt;
    orbitCamera(orbitT, camera.aspect, camera.position, look);
    sky.update(camera);
    clouds.update(dt);
    if (!isReady) {
      elapsed += dt;
      const ph = openingPhase(elapsed);
      updateActivePieces(pieces, elapsed, ph.panels);
      ball.setPanels(ph.panels);
      ball.setSeam(ph.seam);
      ball.setStamp(ph.stamp);
      if (ph.seam < 0.4) ball.group.rotateOnAxis(SPIN_AXIS, dt * 0.7);
      if (ph.phase === 'ready') jumpToReady();
    }
    // From late in the stitching, the ball turns its stamp to the camera and holds it there.
    if (isReady || openingPhase(elapsed).seam >= 0.4) {
      stampFacing(camera.position, facing);
      ball.group.quaternion.slerp(facing, 1 - Math.exp(-4 * dt));
    }
    return false;
  };

  removeSkip = bindSkip(jumpToReady);
  if (checkSeen() || still) {
    orbitCamera(0, state.camera.aspect, state.camera.position, state.cameraLook);
    jumpToReady();
  }

  return {
    dispose: () => {
      cleanup();
      state.cameraShot = null;
    }
  };
}
