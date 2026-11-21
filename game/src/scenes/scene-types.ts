import type * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SoundManager } from '../audio/audio';
import type { StampBanner } from '../ui/stamp-banner';
import type { SharedMaterials } from '../world/palette';
import type { GameState, GroundData, VehicleState } from '../types';

/** 'hub' is Narendra Modi Stadium; anything else is a ground slug from grounds.json. */
export type SceneId = string;
export const HUB: SceneId = 'hub';

/** What lives for the whole visit (renderer, sound, HUD) and is handed to each scene. */
export interface SceneContext {
  sound: SoundManager;
  banner: StampBanner;
  materials: SharedMaterials;
  /** Every grounds.json entry; [0] is the hub. */
  grounds: GroundData[];
  /** Slugs whose full-size scene exists. */
  built: ReadonlySet<string>;
  /** Ask to travel; the scene manager plays the transition. */
  travel: (to: SceneId) => void;
}

/** Where the camera should plunge towards (hub → ground) or rise out of (ground → hub). */
export interface Portal {
  slug: string;
  /** World position of the miniature model's centre. */
  model: { x: number; y: number; z: number };
  /** Roughly the model's radius, to frame the dive. */
  size: number;
  /** Where the roller is placed and which way it faces when returning to the hub. */
  returnSpawn: { x: number; z: number; yaw: number };
}

/** One loaded scene. Everything in it is created on build and freed by dispose. */
export interface BuiltScene {
  id: SceneId;
  scene: THREE.Scene;
  world: RAPIER.World;
  vehicle: VehicleState;
  updatables: Array<(state: GameState) => void>;
  /** Hub only: the nine ground models. */
  portals?: Portal[];
  dispose: () => void;
}
