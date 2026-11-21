import type { GameState, Stage, VehicleState } from '../types';

// Stage 10 only decides what the driver wants. The forces are applied once per fixed
// physics step in stage 20, so driving feels the same at 30, 60 or 144 fps.
function steerTowardTarget(vehicle: VehicleState): { forward: number; steer: number } | null {
  const target = vehicle.driveTarget;
  if (!target) return null;

  const pos = vehicle.body.translation();
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  if (Math.hypot(dx, dz) < 1.2) {
    vehicle.driveTarget = null;
    return null;
  }

  const rot = vehicle.body.rotation();
  const hx = 2 * (rot.x * rot.z + rot.w * rot.y);
  const hz = 1 - 2 * (rot.x * rot.x + rot.y * rot.y);
  // Signed angle from heading to target; positive means the target is to the left.
  const angle = Math.atan2(hz * dx - hx * dz, hx * dx + hz * dz);
  return {
    steer: Math.max(-1, Math.min(1, -angle * 2)),
    forward: Math.cos(angle) > 0.2 ? 0.85 : 0.2
  };
}

export function createStageVehicle(): Stage {
  return {
    name: 'vehicle',
    order: 10,
    update: (state: GameState) => {
      const vehicle = state.vehicle;
      if (!vehicle) return;
      if (state.cameraShot) {
        // Mid-transition the roller coasts to a stop; nothing the visitor presses applies.
        vehicle.driveTarget = null;
        vehicle.intent.forward = 0;
        vehicle.intent.steer = 0;
        vehicle.intent.brake = true;
        return;
      }
      const { forward, steer, brake } = state.inputs;

      if (forward !== 0 || steer !== 0) vehicle.driveTarget = null;
      const auto = forward === 0 && steer === 0 ? steerTowardTarget(vehicle) : null;

      vehicle.intent.forward = auto ? auto.forward : forward;
      vehicle.intent.steer = auto ? auto.steer : steer;
      vehicle.intent.brake = brake;
    }
  };
}
