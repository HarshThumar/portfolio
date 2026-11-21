import * as THREE from 'three/webgpu';
import type { WebGPURenderer } from 'three/webgpu';
import RAPIER from '@dimforge/rapier3d-compat';
import { TypedEmitter } from './events/emitter';
import { createDebugPanel } from './debug/debug-panel';
import { createPhysicsWorld, createRenderer } from './loop/engine-setup';
import { createStageInputs } from './loop/stage-inputs';
import { createStageInteractions } from './loop/stage-interactions';
import { createSharedMaterials } from './world/palette';
import { createInitialState, startMainLoop } from './loop/game-state';
import { setupTouchAndClickControls } from './vehicle/touch-controls';
import { createSoundManager } from './audio/audio';
import { createStampBanner } from './ui/stamp-banner';
import { createSceneManager } from './scenes/scene-manager';
import { HUB } from './scenes/scene-types';
import type { GameEvents, GameInstance, GameOptions, GameState, VehicleState } from './types';

export type { GameEvents, GameInstance, GameOptions, GameState, VehicleState };

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

function resolveDebug(optionsDebug?: boolean): boolean {
  const isDebugUrl =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
  return optionsDebug ?? isDebugUrl;
}

/**
 * One visit. The renderer, camera, sound, HUD, inputs and loop live for the whole visit;
 * scenes (the Ahmedabad hub, each ground) are built and freed by the scene manager.
 */
export async function initGame(options: GameOptions): Promise<GameInstance> {
  const { canvas } = options;

  // Renderer first: if WebGPU/WebGL2 setup fails, nothing else (DOM HUD, listeners) exists yet.
  const { renderer, backend } = await createRenderer(canvas);
  await RAPIER.init();

  // A stand-in scene and world until the scene manager loads the first real one.
  const firstWorld = createPhysicsWorld(RAPIER);
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  const materials = createSharedMaterials();
  const shouldDebug = resolveDebug(options.debug);
  const debugController = createDebugPanel(shouldDebug);
  const sound = createSoundManager();
  const banner = createStampBanner();
  const events = new TypedEmitter<GameEvents>();

  const state = createInitialState({
    canvas,
    scene: new THREE.Scene(),
    camera,
    renderer,
    world: firstWorld.world,
    bodies: firstWorld.bodies,
    backend,
    shouldDebug,
    debugPanel: debugController.panel,
    events
  });

  const stageInputs = createStageInputs();
  const cleanupInputs = stageInputs.setup(state);
  const touchControls = setupTouchAndClickControls(state);
  const interactions = createStageInteractions();

  const scenes = createSceneManager({
    state,
    interactions,
    base: options.base,
    ctx: { sound, banner, materials, grounds: options.grounds, built: new Set(options.built) }
  });
  scenes.start(
    options.start === HUB || options.built.includes(options.start) ? options.start : HUB
  );
  firstWorld.world.free();

  const loop = startMainLoop({
    state,
    stageInputs,
    stageInteractions: interactions,
    updateDebugPanel: debugController.update,
    soundManager: sound,
    extraUpdatables: []
  });
  const cleanupResize = setupResizeHandler(camera, renderer, events);

  const instance: GameInstance = {
    travel: scenes.travel,
    getState: () => state,
    dispose: () => {
      loop.stop();
      cleanupResize();
      cleanupInputs();
      touchControls.destroy();
      debugController.destroy();
      scenes.destroy();
      banner.destroy();
      sound.destroy();
      materials.dispose();
      renderer.dispose();
      for (const fn of state.disposables) fn();
    }
  };
  // ?debug only: lets device tests and probes drive the tour without a keyboard.
  if (shouldDebug) (window as unknown as { tour?: GameInstance }).tour = instance;
  return instance;
}
