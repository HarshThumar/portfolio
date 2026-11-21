import type { GameState, Stage } from '../types';

export function createStageRender(): Stage {
  return {
    name: 'render',
    order: 80,
    update: (state: GameState) => {
      state.renderer.render(state.scene, state.camera);

      // Record render statistics
      state.perf.drawCalls = state.renderer.info.render.drawCalls;
      state.perf.triangles = state.renderer.info.render.triangles;
    }
  };
}
