import type { GameState, Stage } from '../types';
import { stepAccumulator } from './physics-accumulator';

export function createStagePhysics(): Stage {
  return {
    name: 'physics',
    order: 20,
    update: (state: GameState, dt: number) => {
      const { steps, remainder, alpha } = stepAccumulator(
        state.time.accumulator,
        dt,
        state.time.fixedDelta
      );

      state.time.accumulator = remainder;
      state.time.alpha = alpha;

      for (let i = 0; i < steps; i++) {
        state.physics.world.step();
      }
    }
  };
}
