export type SkyMode = 'auto' | 'day' | 'night';

export interface SkyButton {
  setState: (mode: SkyMode, night: boolean) => void;
  dispose: () => void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(name: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function createIcon(): { svg: SVGElement; sun: SVGElement; moon: SVGElement } {
  const svg = svgEl('svg', {
    viewBox: '0 0 16 16',
    width: '16',
    height: '16',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.5',
    'stroke-linecap': 'square',
    'aria-hidden': 'true'
  });
  const sun = svgEl('g', {});
  sun.append(
    svgEl('circle', { cx: '8', cy: '8', r: '3' }),
    svgEl('path', {
      d: 'M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3'
    })
  );
  const moon = svgEl('path', { d: 'M12.5 10.5A5.5 5.5 0 0 1 5.5 3.5a5.5 5.5 0 1 0 7 7z' });
  svg.append(sun, moon);
  return { svg, sun, moon };
}

export function createSkyButton(onToggle: () => void): SkyButton {
  const btn = document.createElement('button');
  btn.id = 'hud-sky-btn';
  btn.type = 'button';
  Object.assign(btn.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--cream)',
    color: 'var(--ink)',
    border: '2px solid var(--ink)',
    borderRadius: 'var(--radius)',
    padding: '6px 12px',
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    boxShadow: '2px 2px 0 var(--ink)'
  });

  const icon = createIcon();
  const label = document.createElement('span');
  label.textContent = '[[COPY: sky toggle label]]';
  btn.append(icon.svg, label);
  btn.addEventListener('click', onToggle);
  // The page provides a #hud row so HUD buttons line up instead of overlapping.
  (document.getElementById('hud') ?? document.body).appendChild(btn);

  return {
    setState: (mode, night) => {
      btn.setAttribute('aria-pressed', String(night));
      btn.dataset.mode = mode;
      icon.sun.style.display = night ? 'none' : '';
      icon.moon.style.display = night ? '' : 'none';
    },
    dispose: () => btn.remove()
  };
}
