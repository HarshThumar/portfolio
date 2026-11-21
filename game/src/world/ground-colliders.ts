import type RAPIER from '@dimforge/rapier3d-compat';
import {
  SIGHT_SCREEN_HALF_WIDTH,
  SIGHT_SCREEN_HEIGHT,
  SIGHT_SCREEN_OFFSET,
  WALL_OFFSET
} from './ground-stands';
import { PROJECT_FIELD, type FieldShape } from './field-shape';

// The wall hugs the stands so the rope-to-wall strip stays drivable for the SIX moment.
const WALL_SEGMENTS = 72;

interface YawQuat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export function yawQuaternion(yaw: number): YawQuat {
  return { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) };
}

/** Floor slab, perimeter wall ring and sight screen blocks, all on one fixed body. */
export function createFieldColliders(
  world: RAPIER.World,
  rapier: typeof RAPIER,
  hideNorthSightScreen: boolean,
  field: FieldShape = PROJECT_FIELD,
  sightScreens = true
): () => void {
  const wallX = field.rx + WALL_OFFSET;
  const wallZ = field.rz + WALL_OFFSET;
  const body = world.createRigidBody(rapier.RigidBodyDesc.fixed());
  world.createCollider(
    rapier.ColliderDesc.cuboid(field.rx + 18, 0.5, field.rz + 18).setTranslation(0, -0.5, 0),
    body
  );

  for (let i = 0; i < WALL_SEGMENTS; i++) {
    const a0 = (i / WALL_SEGMENTS) * Math.PI * 2;
    const a1 = ((i + 1) / WALL_SEGMENTS) * Math.PI * 2;
    const x0 = Math.cos(a0) * wallX;
    const z0 = Math.sin(a0) * wallZ;
    const dx = Math.cos(a1) * wallX - x0;
    const dz = Math.sin(a1) * wallZ - z0;
    const desc = rapier.ColliderDesc.cuboid(Math.hypot(dx, dz) / 2 + 0.2, 2, 0.25)
      .setTranslation(x0 + dx / 2, 2, z0 + dz / 2)
      .setRotation(yawQuaternion(Math.atan2(-dz, dx)));
    world.createCollider(desc, body);
  }

  const half = SIGHT_SCREEN_HEIGHT / 2;
  const sz = field.rz + SIGHT_SCREEN_OFFSET;
  const screenZs = !sightScreens ? [] : hideNorthSightScreen ? [sz] : [sz, -sz];
  for (const z of screenZs) {
    const desc = rapier.ColliderDesc.cuboid(SIGHT_SCREEN_HALF_WIDTH, half, 0.15).setTranslation(
      0,
      half,
      z
    );
    world.createCollider(desc, body);
  }

  return () => world.removeRigidBody(body);
}
