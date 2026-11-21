import type { GameState, Stage } from '../types';

export function createStageUi(updateDebugPanel?: (state: GameState) => void): Stage {
  let frameCount = 0;
  let lastFpsTime = performance.now();

  return {
    name: 'ui',
    order: 90,
    update: (state: GameState) => {
      frameCount++;
      const now = performance.now();
      const elapsed = (now - lastFpsTime) / 1000;

      if (elapsed >= 0.5) {
        state.perf.fps = Math.round(frameCount / elapsed);
        state.time.fps = state.perf.fps;
        frameCount = 0;
        lastFpsTime = now;
      }

      state.perf.bodies = state.physics.world.bodies.len();

      if (state.debug.enabled && updateDebugPanel) {
        updateDebugPanel(state);
      }
    }
  };
}
