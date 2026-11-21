import * as THREE from 'three/webgpu';
import RAPIER from '@dimforge/rapier3d-compat';
import type { WebGPURenderer } from 'three/webgpu';
import type { TypedEmitter } from '../events/emitter';
import type { GameEvents, GameState, Stage } from '../types';
import type { SoundManager } from '../audio/audio';
import { createGameLoop, type GameLoop } from './loop';

export type { GameLoop };
import { createStageVehicle } from './stage-vehicle';
import { createStagePhysics } from './stage-physics';
import { createStageInterpolate } from './stage-interpolate';
import { createStageWorld } from './stage-world';
import { createStageCamera } from './stage-camera';
import { createStageAudio } from './stage-audio';
import { createStageRender } from './stage-render';
import { createStageUi } from './stage-ui';

function assembleStages(
  stageInputs: Stage,
  stageInteractions: Stage,
  updateDebugPanel: (state: GameState) => void,
  soundManager: SoundManager
): Stage[] {
  return [
    stageInputs,
    createStageVehicle(),
    createStagePhysics(),
    createStageInterpolate(),
    stageInteractions,
    createStageWorld(),
    createStageCamera(),
    createStageAudio(soundManager),
    createStageRender(),
    createStageUi(updateDebugPanel)
  ];
}

export function startMainLoop(params: {
  state: GameState;
  stageInputs: Stage;
  stageInteractions: { addUpdatable: (fn: (state: GameState) => void) => void } & Stage;
  updateDebugPanel: (state: GameState) => void;
  soundManager: SoundManager;
  extraUpdatables: Array<(state: GameState) => void>;
}): GameLoop {
  const stages = assembleStages(
    params.stageInputs,
    params.stageInteractions,
    params.updateDebugPanel,
    params.soundManager
  );
  params.extraUpdatables.forEach((fn) => params.stageInteractions.addUpdatable(fn));
  const loop = createGameLoop(params.state, stages);
  loop.start();
  return loop;
}

export function createInitialState(params: {
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
    disposables: [],
    cameraLook: new THREE.Vector3(0, 1, 0),
    cameraShot: null
  };
}
