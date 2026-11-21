import type { GameState, Stage } from '../types';

export interface GameLoop {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

export function createGameLoop(state: GameState, stages: Stage[]): GameLoop {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  let animationFrameId = 0;
  let running = false;

  function tick(): void {
    if (!running) return;

    for (const stage of sortedStages) {
      stage.update(state, state.time.dt);
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  return {
    start: () => {
      if (running) return;
      running = true;
      animationFrameId = requestAnimationFrame(tick);
    },
    stop: () => {
      running = false;
      if (animationFrameId !== 0) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    },
    isRunning: () => running
  };
}
