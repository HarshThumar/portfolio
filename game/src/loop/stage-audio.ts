import type { GameState, Stage } from '../types';
import type { SoundManager } from '../audio/audio';

export function createStageAudio(soundManager: SoundManager): Stage {
  let wasBraking = false;
  let wasHonking = false;

  return {
    name: 'audio',
    order: 70,
    update: (state: GameState) => {
      const speed = Math.abs(state.vehicle?.speed ?? 0);
      soundManager.updateRollerSpeed(speed);

      if (state.inputs.brake && !wasBraking && speed > 2.0) {
        soundManager.playBrakeSqueak();
      }
      wasBraking = state.inputs.brake;

      if (state.inputs.horn && !wasHonking) {
        soundManager.playHonk();
      }
      wasHonking = state.inputs.horn;
    }
  };
}
