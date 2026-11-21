import type RAPIER from '@dimforge/rapier3d-compat';

// Tuning for a heavy groundsman's roller. Everything is an acceleration or a rate, then
// multiplied by the body's own mass, so the feel doesn't change if the collider changes.
export const ROLLER_TUNING = {
  maxSpeed: 7.5, // m/s forward
  maxReverse: 3.0, // m/s backward
  accel: 3.2, // m/s² under throttle: slow to get going, that's the weight
  coastDecel: 1.4, // m/s² rolling resistance with no throttle
  brakeDecel: 9.0, // m/s²
  lateralGrip: 9.0, // 1/s: how fast sideways slide is killed; < ∞ leaves a little drift
  maxYawRate: 1.15, // rad/s at speed
  minYawShare: 0.3, // share of maxYawRate available when standing still (it can pivot slowly)
  yawResponse: 5.0 // 1/s: how quickly the yaw rate follows the stick
} as const;

export interface DriveIntent {
  forward: number; // -1..1
  steer: number; // -1..1, positive = right
  brake: boolean;
}

function moveToward(value: number, target: number, maxDelta: number): number {
  if (Math.abs(target - value) <= maxDelta) return target;
  return value + Math.sign(target - value) * maxDelta;
}

/** Pure: next forward speed along the roller's heading. Unit-tested. */
export function nextForwardSpeed(speed: number, intent: DriveIntent, dt: number): number {
  const t = ROLLER_TUNING;
  if (intent.brake) return moveToward(speed, 0, t.brakeDecel * dt);
  if (intent.forward > 0) return moveToward(speed, t.maxSpeed * intent.forward, t.accel * dt);
  if (intent.forward < 0) return moveToward(speed, -t.maxReverse, t.accel * dt * 0.7);
  return moveToward(speed, 0, t.coastDecel * dt);
}

/** Pure: target yaw rate. Steering reverses when reversing, like a real vehicle. */
function targetYawRate(speed: number, steer: number): number {
  const t = ROLLER_TUNING;
  const share = Math.min(1, Math.max(t.minYawShare, Math.abs(speed) / 2.5));
  const direction = speed < -0.1 ? -1 : 1;
  return -steer * t.maxYawRate * share * direction;
}

/** Applies one fixed physics step of driving to the body. Call before world.step(). */
export function applyDriveStep(body: RAPIER.RigidBody, intent: DriveIntent, dt: number): number {
  const rot = body.rotation();
  // Heading of local +Z rotated by the body's yaw-only quaternion.
  const fx = 2 * (rot.x * rot.z + rot.w * rot.y);
  const fz = 1 - 2 * (rot.x * rot.x + rot.y * rot.y);
  const len = Math.hypot(fx, fz) || 1;
  const hx = fx / len;
  const hz = fz / len;

  const vel = body.linvel();
  const forwardSpeed = vel.x * hx + vel.z * hz;
  const lateralSpeed = vel.x * hz - vel.z * hx;

  const newForward = nextForwardSpeed(forwardSpeed, intent, dt);
  const newLateral = lateralSpeed * Math.exp(-ROLLER_TUNING.lateralGrip * dt);
  body.setLinvel(
    { x: hx * newForward + hz * newLateral, y: vel.y, z: hz * newForward - hx * newLateral },
    true
  );

  const yaw = body.angvel().y;
  const blend = 1 - Math.exp(-ROLLER_TUNING.yawResponse * dt);
  const nextYaw = yaw + (targetYawRate(newForward, intent.steer) - yaw) * blend;
  body.setAngvel({ x: 0, y: nextYaw, z: 0 }, true);
  return newForward;
}
