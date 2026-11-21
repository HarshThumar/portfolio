import * as THREE from 'three/webgpu';
import RAPIER from '@dimforge/rapier3d-compat';
import { createPhysicsWorld } from '../loop/engine-setup';
import { createAtmosphere } from '../world/atmosphere';
import { createSkySystem, type RoofLights } from '../world/sky';
import { createBlobShadow } from '../world/blob-shadow';
import { createRoller } from '../vehicle/roller';
import type { FieldShape } from '../world/field-shape';
import type { SharedMaterials } from '../world/palette';
import type { GameState, VehicleState } from '../types';

export interface Spawn {
  x: number;
  z: number;
  yaw: number;
}

/** What every scene has: sky and light, a physics world, and the roller with its shadow. */
export interface SceneBase {
  scene: THREE.Scene;
  world: RAPIER.World;
  vehicle: VehicleState;
  updatables: Array<(state: GameState) => void>;
  /** Frees the base. Call after the scene's own parts are disposed (they may own bodies). */
  dispose: () => void;
}

const ROLLER_Y = 0.6;

/** Yaw that points from `from` towards `to` (the roller's forward is +z). */
export function yawToward(from: { x: number; z: number }, to: { x: number; z: number }): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

export function createSceneBase(
  field: FieldShape,
  materials: SharedMaterials,
  spawn: Spawn,
  roof?: RoofLights
): SceneBase {
  const scene = new THREE.Scene();
  const { world } = createPhysicsWorld(RAPIER);
  const atmosphere = createAtmosphere(scene, field);
  const sky = createSkySystem(scene, atmosphere, field, roof);

  const vehicle = createRoller(
    scene,
    world,
    RAPIER,
    materials,
    { x: spawn.x, y: ROLLER_Y, z: spawn.z },
    spawn.yaw
  );
  vehicle.model.group.traverse((obj) => {
    obj.castShadow = true;
  });
  const shadow = createBlobShadow(scene);

  const follow = (): void => {
    const { position, quaternion } = vehicle.model.group;
    // Yaw straight from the quaternion; Euler .y flips past ±90°.
    shadow.update(position.x, position.z, 2 * Math.atan2(quaternion.y, quaternion.w));
    atmosphere.follow(position.x, position.z);
  };

  return {
    scene,
    world,
    vehicle,
    updatables: [sky.update, follow],
    dispose: () => {
      shadow.dispose();
      sky.dispose();
      atmosphere.dispose();
      vehicle.model.dispose();
      world.free();
    }
  };
}
