import { createVeil } from '../ui/veil';
import { createHudLink, type HudLink } from '../ui/hud-link';
import { buildHubScene } from './hub-scene';
import { buildLordsScene } from './lords-scene';
import { cameraToRoller, playTransition } from './transition';
import { HUB, type BuiltScene, type Portal, type SceneContext, type SceneId } from './scene-types';
import type { StageInteractions } from '../loop/stage-interactions';
import type { GameState } from '../types';

export interface SceneManager {
  /** Builds the first scene with no transition. */
  start: (id: SceneId) => void;
  travel: (to: SceneId) => void;
  destroy: () => void;
}

export function createSceneManager(params: {
  state: GameState;
  interactions: StageInteractions;
  ctx: Omit<SceneContext, 'travel'>;
  base: string;
}): SceneManager {
  const { state, interactions, base } = params;
  const ctx: SceneContext = { ...params.ctx, travel: (to) => void travel(to, true) };
  const veil = createVeil();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current: BuiltScene | null = null;
  let busy = false;
  let backLink: HudLink | null = null;

  function swapTo(id: SceneId): Portal | undefined {
    const from = current?.id;
    interactions.clear();
    current?.dispose();
    const next = id === HUB ? buildHubScene(ctx, from) : buildLordsScene(ctx);
    current = next;
    state.scene = next.scene;
    state.physics.world = next.world;
    state.physics.bodies = new Map([['roller', next.vehicle.body]]);
    state.vehicle = next.vehicle;
    state.time.accumulator = 0;
    next.updatables.forEach((fn) => interactions.addUpdatable(fn));

    backLink?.destroy();
    backLink = id === HUB ? null : createHudLink('BACK TO AHMEDABAD', () => ctx.travel(HUB));
    // Back at the hub, the model of the ground we left frames the rise out of it.
    return id === HUB ? next.portals?.find((p) => p.slug === from) : undefined;
  }

  async function travel(to: SceneId, push: boolean): Promise<void> {
    if (busy || to === current?.id) return;
    if (to !== HUB && !ctx.built.has(to)) {
      // The model is there but its full-size ground isn't built yet (M3).
      ctx.sound.playBell();
      ctx.banner.show('UNDER COVERS');
      return;
    }
    busy = true;
    try {
      if (push) history.pushState({ scene: to }, '', to === HUB ? base : `${base}ground/${to}/`);
      await playTransition({
        state,
        veil,
        reduceMotion: reduceMotion.matches,
        into: current?.portals?.find((p) => p.slug === to),
        swap: () => swapTo(to)
      });
    } finally {
      busy = false;
    }
  }

  const onPopState = (event: PopStateEvent): void => {
    const to = (event.state as { scene?: SceneId } | null)?.scene ?? HUB;
    void travel(to, false);
  };
  window.addEventListener('popstate', onPopState);

  return {
    start: (id) => {
      history.replaceState({ scene: id }, '', window.location.href);
      swapTo(id);
      cameraToRoller(state);
    },
    travel: ctx.travel,
    destroy: () => {
      window.removeEventListener('popstate', onPopState);
      interactions.clear();
      current?.dispose();
      current = null;
      backLink?.destroy();
      veil.destroy();
    }
  };
}
