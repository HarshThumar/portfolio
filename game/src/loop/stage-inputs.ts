import type { GameState, Stage } from '../types';

export function createStageInputs(): Stage & { setup: (state: GameState) => () => void } {
  let lastTime = 0;

  function updateInputsFromKeys(state: GameState): void {
    const { rawKeys } = state.inputs;
    let forward = 0;
    let steer = 0;

    if (rawKeys['KeyW'] || rawKeys['ArrowUp']) forward += 1;
    if (rawKeys['KeyS'] || rawKeys['ArrowDown']) forward -= 1;
    if (rawKeys['KeyA'] || rawKeys['ArrowLeft']) steer -= 1;
    if (rawKeys['KeyD'] || rawKeys['ArrowRight']) steer += 1;

    state.inputs.forward = forward;
    state.inputs.steer = steer;
    state.inputs.brake = Boolean(rawKeys['Space']);
    state.inputs.horn = Boolean(rawKeys['KeyH']);
  }

  function setup(state: GameState): () => void {
    lastTime = performance.now();

    const onKeyDown = (e: KeyboardEvent): void => {
      state.inputs.rawKeys[e.code] = true;
      if (e.code === 'Backquote' || e.code === 'F3') {
        state.debug.toggle();
      }
      updateInputsFromKeys(state);
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      state.inputs.rawKeys[e.code] = false;
      updateInputsFromKeys(state);
    };

    const onPointerMove = (e: PointerEvent): void => {
      state.inputs.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.inputs.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onPointerDown = (): void => {
      state.inputs.pointer.isDown = true;
    };

    const onPointerUp = (): void => {
      state.inputs.pointer.isDown = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }

  return {
    name: 'inputs',
    order: 0,
    setup,
    update: (state: GameState) => {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      // Clamp dt to max 0.1s to prevent spiral of death after background tab
      state.time.dt = Math.min(Math.max(rawDt, 0), 0.1);
      state.time.now = now / 1000;
      state.time.frameCount++;
    }
  };
}
