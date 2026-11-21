import { describe, it, expect, beforeAll } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import {
  applyDriveStep,
  nextForwardSpeed,
  ROLLER_TUNING,
  type DriveIntent
} from '../../game/src/vehicle/roller-drive';

const DT = 1 / 60;

// Same body and collider set-up as game/src/vehicle/roller.ts, on a flat ground.
function makeWorld(): { world: RAPIER.World; body: RAPIER.RigidBody } {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.createCollider(RAPIER.ColliderDesc.cuboid(200, 0.1, 200).setTranslation(0, -0.1, 0));
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 0.6, 0)
      .enabledRotations(false, true, false)
      .setCanSleep(false)
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.7, 0.45, 1.1)
      .setDensity(1200)
      .setFriction(0)
      .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min),
    body
  );
  return { world, body };
}

function drive(seconds: number, intent: DriveIntent, setup = makeWorld()) {
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    applyDriveStep(setup.body, intent, DT);
    setup.world.step();
  }
  return setup;
}

beforeAll(async () => {
  await RAPIER.init();
});

describe('roller driving', () => {
  it('moves forward under throttle and stays under top speed', () => {
    const { body } = drive(4, { forward: 1, steer: 0, brake: false });
    const pos = body.translation();
    const speed = Math.hypot(body.linvel().x, body.linvel().z);
    expect(pos.z).toBeGreaterThan(15);
    expect(speed).toBeLessThanOrEqual(ROLLER_TUNING.maxSpeed + 0.01);
  });

  it('feels heavy: takes more than 2 s to reach top speed', () => {
    const { body } = drive(1.5, { forward: 1, steer: 0, brake: false });
    expect(Math.hypot(body.linvel().x, body.linvel().z)).toBeLessThan(ROLLER_TUNING.maxSpeed * 0.8);
  });

  it('turns right when steering right (negative yaw, heading toward -x)', () => {
    const { body } = drive(3, { forward: 1, steer: 1, brake: false });
    expect(body.translation().x).toBeLessThan(-1);
  });

  it('stays upright when turning hard at speed', () => {
    const setup = drive(3, { forward: 1, steer: 0, brake: false });
    drive(2, { forward: 1, steer: 1, brake: false }, setup);
    const rot = setup.body.rotation();
    expect(Math.abs(rot.x) + Math.abs(rot.z)).toBeLessThan(1e-3);
  });

  it('brakes to a stop within 1.5 s from top speed', () => {
    const setup = drive(5, { forward: 1, steer: 0, brake: false });
    drive(1.5, { forward: 0, steer: 0, brake: true }, setup);
    expect(Math.hypot(setup.body.linvel().x, setup.body.linvel().z)).toBeLessThan(0.05);
  });

  it('coasts to a stop with no throttle', () => {
    expect(nextForwardSpeed(1, { forward: 0, steer: 0, brake: false }, 1)).toBe(0);
  });
});
