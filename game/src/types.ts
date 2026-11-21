import type * as THREE from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { TypedEmitter } from './events/emitter';

export interface GameEvents {
  resize: { width: number; height: number };
  debugToggle: boolean;
  scoreUpdate: { label: string; value: number };
}

interface GameInputs {
  forward: number;
  steer: number;
  brake: boolean;
  horn: boolean;
  pointer: { x: number; y: number; isDown: boolean };
  rawKeys: Record<string, boolean>;
}

interface GameTime {
  now: number;
  dt: number;
  accumulator: number;
  fixedDelta: number;
  alpha: number;
  fps: number;
  frameCount: number;
}

interface GamePerf {
  fps: number;
  drawCalls: number;
  triangles: number;
  bodies: number;
  backend: string;
}

interface GamePhysics {
  world: RAPIER.World;
  RAPIER: typeof RAPIER;
  bodies: Map<string, RAPIER.RigidBody>;
}

interface GameDebug {
  enabled: boolean;
  panel?: HTMLElement;
  toggle: () => void;
}

export interface VehicleState {
  body: RAPIER.RigidBody;
  model: {
    group: THREE.Group;
    frontDrum: THREE.Mesh;
    rearDrum: THREE.Mesh;
    steeringWheel: THREE.Mesh;
    dispose: () => void;
  };
  speed: number;
  driveTarget?: { x: number; z: number } | null;
  previousPosition: THREE.Vector3;
  previousRotation: THREE.Quaternion;
  currentPosition: THREE.Vector3;
  currentRotation: THREE.Quaternion;
}

export interface GameState {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: WebGPURenderer;
  physics: GamePhysics;
  vehicle?: VehicleState;
  time: GameTime;
  inputs: GameInputs;
  perf: GamePerf;
  debug: GameDebug;
  events: TypedEmitter<GameEvents>;
  disposables: Array<() => void>;
}

export interface Stage {
  name: string;
  order: number;
  update: (state: GameState, dt: number) => void;
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  debug?: boolean;
  groundSlug?: string;
}

export interface GameInstance {
  dispose: () => void;
  getState: () => GameState;
}
