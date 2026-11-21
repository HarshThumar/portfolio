import type { GameState, Stage } from '../types';

export interface StageInteractions extends Stage {
  addUpdatable: (fn: (state: GameState) => void) => void;
  clear: () => void;
}

export function createStageInteractions(): StageInteractions {
  const updatables: Array<(state: GameState) => void> = [];

  return {
    name: 'interactions',
    order: 40,
    addUpdatable: (fn: (state: GameState) => void) => {
      updatables.push(fn);
    },
    clear: () => {
      updatables.length = 0;
    },
    update: (state: GameState) => {
      for (const fn of updatables) {
        fn(state);
      }
    }
  };
}
