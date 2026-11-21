import type { GameState, Stage } from '../types';
import type { PostEffects } from './post-effects';

export function createStageRender(postEffects?: PostEffects | null): Stage {
  return {
    name: 'render',
    order: 80,
    update: (state: GameState) => {
      if (postEffects) {
        postEffects.render(state.scene, state.camera);
      } else {
        state.renderer.render(state.scene, state.camera);
      }

      // Record render statistics
      state.perf.drawCalls = state.renderer.info.render.drawCalls;
      state.perf.triangles = state.renderer.info.render.triangles;
    }
  };
}
