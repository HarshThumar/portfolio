import * as THREE from 'three/webgpu';
import type { GameState } from '../types';
import type { SoundManager } from '../audio/audio';
import { createGiantBall, type GiantBall } from './giant-ball';
import { createKitPieces } from './kit-models';
import { setupActivePieces, updateActivePieces, collapseActivePieces } from './opening-pieces';
import { createOpeningOverlay } from './opening-overlay';
import { startBowlAnimation, runReducedMotionBowl } from './opening-bowl';
import { createOpeningSky } from './opening-sky';
import { createOpeningClouds } from './opening-clouds';
import { createBallDrag } from './opening-drag';
import { OPENING_CENTRE, orbitCamera, seamFacing, stampFacing } from './opening-pose';
import { GATHER_START, STAMP_END, openingPhase } from './opening-timeline';

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

/**
 * While it forms the ball tumbles; once closed it shows the seam to the camera while the
 * stitching runs round, then rolls forward to present the stamp, and holds it there.
 */
function turnBall(
  ball: THREE.Object3D,
  cameraPos: THREE.Vector3,
  t: number,
  facing: THREE.Quaternion,
  dt: number
): void {
  const ph = openingPhase(t);
  if (ph.panels < 1) {
    ball.rotateOnAxis(SPIN_AXIS, dt * 0.7);
    return;
  }
  if (ph.stamp > 0 || ph.seam >= 0.85) stampFacing(cameraPos, facing);
  else seamFacing(cameraPos, facing);
  ball.quaternion.slerp(facing, 1 - Math.exp(-5 * dt));
}

function completeBall(ball: GiantBall): void {
  ball.setPanels(1);
  ball.setSeam(1);
  ball.setStamp(1);
}

export interface OpeningController {
  dispose: () => void;
}

function createStage(state: GameState) {
  const scene = state.scene;
  const sky = createOpeningSky(scene);
  const clouds = createOpeningClouds(OPENING_CENTRE);
  const ball = createGiantBall();
  ball.group.position.copy(OPENING_CENTRE);
  const cluster = new THREE.Group();
  cluster.position.copy(OPENING_CENTRE);
  scene.add(clouds.group, ball.group, cluster);

  const kit = createKitPieces();
  const pieces = setupActivePieces(cluster, kit);
  const drag = createBallDrag();
  // Compile the whole hub now, while it's hidden under the clouds, so it doesn't stall the
  // first frame it comes into view on the way down.
  state.renderer.compileAsync(scene, state.camera).catch(() => undefined);

  const dispose = (): void => {
    drag.dispose();
    scene.remove(clouds.group, ball.group, cluster);
    clouds.dispose();
    ball.dispose();
    for (const k of kit) k.dispose();
    sky.dispose();
  };
  return { sky, clouds, ball, pieces, drag, facing: new THREE.Quaternion(), dispose };
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
  const stage = createStage(state);
  const { sky, clouds, ball, pieces, drag, facing } = stage;

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
      const bowl = { state, sound, ball, sky, clouds, cleanup, onDone };
      if (still) void runReducedMotionBowl(bowl);
      else startBowlAnimation(bowl);
    }
  });

  const jumpToReady = (): void => {
    if (isReady) return;
    isReady = true;
    elapsed = STAMP_END;
    collapseActivePieces(pieces);
    completeBall(ball);
    ball.group.quaternion.copy(stampFacing(state.camera.position, facing));
    overlay.show();
    removeSkip();
    drag.enable();
  };

  state.cameraShot = (camera, look, dt) => {
    if (!still) orbitT += dt;
    orbitCamera(orbitT, camera.aspect, camera.position, look);
    sky.update(camera);
    clouds.update(dt);
    if (!isReady) {
      elapsed += dt;
      const ph = openingPhase(elapsed);
      updateActivePieces(pieces, elapsed - GATHER_START, ph.panels);
      ball.setPanels(ph.panels);
      ball.setSeam(ph.seam);
      ball.setStamp(ph.stamp);
      if (ph.phase === 'ready') jumpToReady();
    }
    if (isReady && drag.update(dt, ball.group, camera)) return false;
    turnBall(ball.group, camera.position, isReady ? STAMP_END : elapsed, facing, dt);
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
