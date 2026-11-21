import type { GameState } from '../types';
import { PROJECT_FIELD, type FieldShape } from '../world/field-shape';

export interface BoundaryDetector {
  update: (state: GameState) => void;
}

// Roller top speed is 7.5 m/s, so 3 m/s is a firm push rather than a nudge.
const SIX_SPEED_THRESHOLD = 3.0;
// Normalised distance squared the roller must fall back inside before it can fire again.
const REARM_DIST_SQ = 0.85;
const COOLDOWN_SECONDS = 4.0;

export function createBoundaryDetector(
  onSix: () => void,
  field: FieldShape = PROJECT_FIELD
): BoundaryDetector {
  let armed = true;
  let wasInside = true;
  let cooldown = 0;

  return {
    update: (state: GameState) => {
      if (cooldown > 0) cooldown -= state.time.dt;

      const vehicle = state.vehicle;
      if (!vehicle) return;

      const pos = vehicle.currentPosition;
      const nx = pos.x / field.rx;
      const nz = pos.z / field.rz;
      const distSq = nx * nx + nz * nz;
      const isInside = distSq < 1.0;

      if (distSq < REARM_DIST_SQ) armed = true;

      if (armed && wasInside && !isInside && cooldown <= 0) {
        if (Math.abs(vehicle.speed) >= SIX_SPEED_THRESHOLD) {
          onSix();
          cooldown = COOLDOWN_SECONDS;
          armed = false;
        }
      }

      wasInside = isInside;
    }
  };
}
