import type { Stage } from '../types';

export function createStageInterpolate(): Stage {
  return {
    name: 'interpolate',
    order: 30,
    update: () => {
      // Stage 30: interpolates physics bodies transforms with state.time.alpha for smooth rendering
    }
  };
}
