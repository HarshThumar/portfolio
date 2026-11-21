import type { Stage } from '../types';

export function createStageWorld(): Stage {
  return {
    name: 'world',
    order: 50,
    update: () => {
      // Stage 50: updates crowd shader uniforms, scoreboard animations, and sky lighting
    }
  };
}
