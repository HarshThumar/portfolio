// A plain HUD button, so everything the roller can do on a mat also works from the keyboard.
export interface HudLink {
  destroy: () => void;
}

export function createHudLink(label: string, onClick: () => void): HudLink {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hud-btn';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  (document.getElementById('hud') ?? document.body).appendChild(btn);
  return { destroy: () => btn.remove() };
}
