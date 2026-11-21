import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import RAPIER from '@dimforge/rapier3d-compat';
import { TypedEmitter } from './events/emitter';
import { createDebugPanel } from './debug/debug-panel';
import { createGameLoop } from './loop/loop';
import { createStageInputs } from './loop/stage-inputs';
import { createStageVehicle } from './loop/stage-vehicle';
import { createStagePhysics } from './loop/stage-physics';
import { createStageInterpolate } from './loop/stage-interpolate';
import { createStageInteractions } from './loop/stage-interactions';
import { createStageWorld } from './loop/stage-world';
import { createStageCamera } from './loop/stage-camera';
import { createStageAudio } from './loop/stage-audio';
import { createStageRender } from './loop/stage-render';
import { createStageUi } from './loop/stage-ui';
import type { GameEvents, GameInstance, GameOptions, GameState } from './types';

export type { GameEvents, GameInstance, GameOptions, GameState };

function createTestScene(scene: THREE.Scene): () => void {
  scene.background = new THREE.Color(0xf3ead3); // --cream

  const ambientLight = new THREE.AmbientLight(0xfff6da, 1.2); // --flood
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x4e7a3a }); // --outfield
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  scene.add(groundMesh);

  return () => {
    groundGeo.dispose();
    groundMat.dispose();
  };
}

function createPhysicsWorld(rapier: typeof RAPIER): {
  world: RAPIER.World;
  bodies: Map<string, RAPIER.RigidBody>;
} {
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const world = new rapier.World(gravity);
  const bodies = new Map<string, RAPIER.RigidBody>();

  const groundDesc = rapier.ColliderDesc.cuboid(40, 0.5, 40).setTranslation(0, -0.5, 0);
  world.createCollider(groundDesc);

  const bodyDesc = rapier.RigidBodyDesc.dynamic().setTranslation(0, 2, 0);
  const body = world.createRigidBody(bodyDesc);
  const colliderDesc = rapier.ColliderDesc.ball(0.5);
  world.createCollider(colliderDesc, body);
  bodies.set('test-body', body);

  return { world, bodies };
}

async function createRenderer(canvas: HTMLCanvasElement): Promise<{
  renderer: WebGPURenderer;
  backend: string;
}> {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  await renderer.init();

  const isWebGPU = Boolean((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend);
  const backend = isWebGPU ? 'WebGPU' : 'WebGL2';
  return { renderer, backend };
}

function createInitialState(params: {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: WebGPURenderer;
  world: RAPIER.World;
  bodies: Map<string, RAPIER.RigidBody>;
  backend: string;
  shouldDebug: boolean;
  debugPanel: HTMLElement;
  events: TypedEmitter<GameEvents>;
}): GameState {
  return {
    canvas: params.canvas,
    scene: params.scene,
    camera: params.camera,
    renderer: params.renderer,
    physics: { world: params.world, RAPIER, bodies: params.bodies },
    time: {
      now: performance.now() / 1000,
      dt: 0.016,
      accumulator: 0,
      fixedDelta: 1 / 60,
      alpha: 0,
      fps: 60,
      frameCount: 0
    },
    inputs: {
      forward: 0,
      steer: 0,
      brake: false,
      horn: false,
      pointer: { x: 0, y: 0, isDown: false },
      rawKeys: {}
    },
    perf: {
      fps: 60,
      drawCalls: 0,
      triangles: 0,
      bodies: params.bodies.size,
      backend: params.backend
    },
    debug: {
      enabled: params.shouldDebug,
      panel: params.debugPanel,
      toggle: () => {
        params.debugPanel.style.display =
          params.debugPanel.style.display === 'none' ? 'block' : 'none';
        params.events.emit('debugToggle', params.debugPanel.style.display !== 'none');
      }
    },
    events: params.events,
    disposables: []
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

export async function initGame(options: GameOptions): Promise<GameInstance> {
  const { canvas } = options;

  await RAPIER.init();
  const { world, bodies } = createPhysicsWorld(RAPIER);
  const scene = new THREE.Scene();
  const disposeScene = createTestScene(scene);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 18);
  camera.lookAt(0, 0, 0);

  const { renderer, backend } = await createRenderer(canvas);
  const isDebugUrl =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
  const shouldDebug = options.debug ?? isDebugUrl;
  const debugController = createDebugPanel(shouldDebug);
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

  const stageInputs = createStageInputs();
  const cleanupInputs = stageInputs.setup(state);
  const stages = [
    stageInputs,
    createStageVehicle(),
    createStagePhysics(),
    createStageInterpolate(),
    createStageInteractions(),
    createStageWorld(),
    createStageCamera(),
    createStageAudio(),
    createStageRender(),
    createStageUi(debugController.update)
  ];

  const loop = createGameLoop(state, stages);
  loop.start();
  const cleanupResize = setupResizeHandler(camera, renderer, events);

  return {
    getState: () => state,
    dispose: () => {
      loop.stop();
      cleanupResize();
      cleanupInputs();
      debugController.destroy();
      disposeScene();
      renderer.dispose();
      world.free();
      for (const fn of state.disposables) fn();
    }
  };
}
