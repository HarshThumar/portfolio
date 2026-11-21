import type { Stage } from '../types';

export function createStageVehicle(): Stage {
  return {
    name: 'vehicle',
    order: 10,
    update: () => {
      // Stage 10: M1.3 will apply forces to roller physics body based on state.inputs
    }
  };
}
