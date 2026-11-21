import * as THREE from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import RAPIER from '@dimforge/rapier3d-compat';
import { TypedEmitter } from './events/emitter';
import { createDebugPanel } from './debug/debug-panel';
import { createPhysicsWorld, createRenderer } from './loop/engine-setup';
import { createStageInputs } from './loop/stage-inputs';
import { createStageInteractions } from './loop/stage-interactions';
import { createSharedMaterials } from './world/palette';
import { createGroundBase } from './world/ground-base';
import { createLordsPavilion } from './world/lords-pavilion';
import { createHonoursBoard, type HonoursBoardController } from './world/honours-board';
import { createScoreboard } from './world/scoreboard';
import { createCrowd } from './world/crowd';
import { createSkySystem } from './world/sky';
import { createInitialState, startMainLoop, type GameLoop } from './loop/game-state';
import { createRoller } from './vehicle/roller';
import { setupTouchAndClickControls } from './vehicle/touch-controls';
import { createStumps } from './interactions/stumps';
import { createBoundaryDetector } from './interactions/boundary';
import { createInfoPost } from './interactions/info-post';
import { createSoundManager, type SoundManager } from './audio/audio';
import { createStampBanner, type StampBanner } from './ui/stamp-banner';
import { createProjectPanel, type ProjectPanelController } from './ui/project-panel';
import type { GameEvents, GameInstance, GameOptions, GameState, VehicleState } from './types';

export type { GameEvents, GameInstance, GameOptions, GameState, VehicleState };

function setupLighting(scene: THREE.Scene): {
  sun: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
} {
  scene.background = new THREE.Color(0xf3ead3); // --cream
  const ambient = new THREE.AmbientLight(0xfff6da, 1.4);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(15, 30, 20);
  sun.castShadow = true;
  scene.add(sun);
  return { sun, ambient };
}

function setupInteractions(
  scene: THREE.Scene,
  world: RAPIER.World,
  materials: ReturnType<typeof createSharedMaterials>,
  stageInteractions: ReturnType<typeof createStageInteractions>,
  soundManager: SoundManager,
  stampBanner: StampBanner
): {
  honoursBoard: HonoursBoardController;
  projectPanel: ProjectPanelController;
  dispose: () => void;
} {
  const stumps = createStumps(scene, world, RAPIER, materials, () => {
    soundManager.playStumpClatter();
    soundManager.playHowzat();
    stampBanner.show('HOWZAT!');
  });

  const boundary = createBoundaryDetector(() => {
    soundManager.playSixRoar();
    stampBanner.show('SIX!');
  });

  const projectPanel = createProjectPanel();

  const infoPost = createInfoPost(scene, world, RAPIER, materials, { x: 22, y: 0, z: 0 }, () => {
    soundManager.playBell();
    stampBanner.show('INFO POST');
    projectPanel.open();
  });

  const honoursBoard = createHonoursBoard({ x: 0, z: -46 });

  stageInteractions.addUpdatable(stumps.update);
  stageInteractions.addUpdatable(boundary.update);
  stageInteractions.addUpdatable(infoPost.update);
  stageInteractions.addUpdatable(honoursBoard.update);

  return {
    honoursBoard,
    projectPanel,
    dispose: () => {
      stumps.dispose();
      infoPost.dispose();
      honoursBoard.destroy();
      projectPanel.destroy();
      stageInteractions.clear();
    }
  };
}

function setupResizeHandler(
  camera: THREE.PerspectiveCamera,
  renderer: WebGPURenderer,
  events: TypedEmitter<GameEvents>
): () => void {
  const onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    events.emit('resize', { width, height });
  };
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}

function createGameDisposer(params: {
  loop: GameLoop;
  cleanupResize: () => void;
  cleanupInputs: () => void;
  touchControls: { destroy: () => void };
  debugController: { destroy: () => void };
  stampBanner: StampBanner;
  soundManager: SoundManager;
  interactionCleanup: { dispose: () => void };
  groundBase: { dispose: () => void };
  pavilion: { dispose: () => void };
  scoreboard: { dispose: () => void };
  crowd: { dispose: () => void };
  sky: { dispose: () => void };
  vehicle: VehicleState;
  materials: { dispose: () => void };
  renderer: WebGPURenderer;
  world: RAPIER.World;
  disposables: Array<() => void>;
}): () => void {
  return () => {
    params.loop.stop();
    params.cleanupResize();
    params.cleanupInputs();
    params.touchControls.destroy();
    params.debugController.destroy();
    params.stampBanner.destroy();
    params.soundManager.destroy();
    params.interactionCleanup.dispose();
    params.groundBase.dispose();
    params.pavilion.dispose();
    params.scoreboard.dispose();
    params.crowd.dispose();
    params.sky.dispose();
    params.vehicle.model.dispose();
    params.materials.dispose();
    params.renderer.dispose();
    params.world.free();
    for (const fn of params.disposables) fn();
  };
}

function createWorldEntities(
  scene: THREE.Scene,
  world: RAPIER.World,
  materials: ReturnType<typeof createSharedMaterials>
) {
  const groundBase = createGroundBase(scene, world, RAPIER, materials, {
    hideNorthSightScreen: true
  });
  const pavilion = createLordsPavilion(scene, world, RAPIER, materials, { x: 0, y: 0, z: -54 }, 0);
  const scoreboard = createScoreboard(
    scene,
    world,
    RAPIER,
    materials,
    { x: -34, y: 0, z: -10 },
    Math.PI / 4
  );
  const vehicle = createRoller(scene, world, RAPIER, materials, { x: 0, y: 0.6, z: 6 }, Math.PI);
  const crowd = createCrowd(scene);
  return { groundBase, pavilion, scoreboard, vehicle, crowd };
}

function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);
  return camera;
}

function resolveDebug(optionsDebug?: boolean): boolean {
  const isDebugUrl =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
  return optionsDebug ?? isDebugUrl;
}

export async function initGame(options: GameOptions): Promise<GameInstance> {
  const { canvas } = options;

  await RAPIER.init();
  const { world, bodies } = createPhysicsWorld(RAPIER);
  const scene = new THREE.Scene();
  const { sun, ambient } = setupLighting(scene);
  const sky = createSkySystem(scene, sun, ambient);

  const materials = createSharedMaterials();
  const { groundBase, pavilion, scoreboard, vehicle, crowd } = createWorldEntities(
    scene,
    world,
    materials
  );
  bodies.set('roller', vehicle.body);

  const camera = createCamera();
  const { renderer, backend } = await createRenderer(canvas);
  const shouldDebug = resolveDebug(options.debug);
  const debugController = createDebugPanel(shouldDebug);
  const soundManager = createSoundManager();
  const stampBanner = createStampBanner();
  const events = new TypedEmitter<GameEvents>();

  const state = createInitialState({
    canvas,
    scene,
    camera,
    renderer,
    world,
    bodies,
    backend,
    shouldDebug,
    debugPanel: debugController.panel,
    events
  });
  state.vehicle = vehicle;

  const stageInputs = createStageInputs();
  const cleanupInputs = stageInputs.setup(state);
  const touchControls = setupTouchAndClickControls(state);
  const stageInteractions = createStageInteractions();
  const interactionCleanup = setupInteractions(
    scene,
    world,
    materials,
    stageInteractions,
    soundManager,
    stampBanner
  );

  const loop = startMainLoop({
    state,
    stageInputs,
    stageInteractions,
    updateDebugPanel: debugController.update,
    soundManager,
    extraUpdatables: [scoreboard.update, crowd.update, sky.update]
  });
  const cleanupResize = setupResizeHandler(camera, renderer, events);

  const dispose = createGameDisposer({
    loop,
    cleanupResize,
    cleanupInputs,
    touchControls,
    debugController,
    stampBanner,
    soundManager,
    interactionCleanup,
    groundBase,
    pavilion,
    scoreboard,
    crowd,
    sky,
    vehicle,
    materials,
    renderer,
    world,
    disposables: state.disposables
  });

  return {
    getState: () => state,
    dispose
  };
}
