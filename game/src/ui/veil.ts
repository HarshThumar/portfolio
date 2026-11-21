// A cream sheet over the canvas that hides the moment one scene is swapped for another.
export interface Veil {
  /** Fades to fully covered; resolves when the screen is hidden. */
  cover: (seconds: number) => Promise<void>;
  /** Fades away; resolves when the scene is fully visible. */
  lift: (seconds: number) => Promise<void>;
  destroy: () => void;
}

export function createVeil(): Veil {
  const el = document.createElement('div');
  el.className = 'veil';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  const fade = (opacity: number, seconds: number): Promise<void> =>
    new Promise((resolve) => {
      el.style.transitionDuration = `${seconds}s`;
      // Force a style flush so the transition starts from the current opacity.
      void el.offsetWidth;
      el.style.opacity = String(opacity);
      window.setTimeout(resolve, seconds * 1000 + 30);
    });

  return {
    cover: (seconds) => fade(1, seconds),
    lift: (seconds) => fade(0, seconds),
    destroy: () => el.remove()
  };
}
