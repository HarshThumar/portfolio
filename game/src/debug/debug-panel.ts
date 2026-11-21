import type { GameState } from '../types';

export interface DebugPanelController {
  panel: HTMLElement;
  update: (state: GameState) => void;
  destroy: () => void;
  toggle: () => void;
}

export function createDebugPanel(initialVisible = false): DebugPanelController {
  const panel = document.createElement('div');
  panel.id = 'perf-debug-panel';
  panel.setAttribute('aria-label', 'Performance debug panel');

  Object.assign(panel.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    backgroundColor: 'var(--cream)',
    color: 'var(--ink)',
    border: '2px solid var(--ink)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    lineHeight: '1.4',
    zIndex: '9999',
    boxShadow: '2px 2px 0 var(--ink)',
    pointerEvents: 'auto',
    userSelect: 'none',
    display: initialVisible ? 'block' : 'none'
  });

  panel.innerHTML = `
    <div style="font-family: var(--font-display); font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid var(--ink); padding-bottom: 4px;">
      PERF MONITOR
    </div>
    <table style="width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums;">
      <tr><td style="padding: 2px 12px 2px 0;">FPS</td><td id="perf-fps" style="text-align: right; font-weight: bold;">0</td></tr>
      <tr><td style="padding: 2px 12px 2px 0;">Draw Calls</td><td id="perf-draw-calls" style="text-align: right; font-weight: bold;">0</td></tr>
      <tr><td style="padding: 2px 12px 2px 0;">Triangles</td><td id="perf-triangles" style="text-align: right; font-weight: bold;">0</td></tr>
      <tr><td style="padding: 2px 12px 2px 0;">Bodies</td><td id="perf-bodies" style="text-align: right; font-weight: bold;">0</td></tr>
      <tr><td style="padding: 2px 12px 2px 0;">Backend</td><td id="perf-backend" style="text-align: right; font-weight: bold;">-</td></tr>
    </table>
  `;

  document.body.appendChild(panel);

  const fpsEl = panel.querySelector('#perf-fps');
  const drawCallsEl = panel.querySelector('#perf-draw-calls');
  const trianglesEl = panel.querySelector('#perf-triangles');
  const bodiesEl = panel.querySelector('#perf-bodies');
  const backendEl = panel.querySelector('#perf-backend');

  function update(state: GameState): void {
    if (panel.style.display === 'none') return;

    if (fpsEl) fpsEl.textContent = String(state.perf.fps);
    if (drawCallsEl) drawCallsEl.textContent = String(state.perf.drawCalls);
    if (trianglesEl) trianglesEl.textContent = String(state.perf.triangles);
    if (bodiesEl) bodiesEl.textContent = String(state.perf.bodies);
    if (backendEl) backendEl.textContent = state.perf.backend;
  }

  function toggle(): void {
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';
  }

  function destroy(): void {
    if (panel.parentNode) {
      panel.parentNode.removeChild(panel);
    }
  }

  return { panel, update, destroy, toggle };
}
