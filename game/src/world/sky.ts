import * as THREE from 'three';
import { PALETTE } from './palette';

type SkyMode = 'auto' | 'day' | 'night';

export interface SkyController {
  setMode: (mode: SkyMode) => void;
  getMode: () => SkyMode;
  isNight: () => boolean;
  toggle: () => SkyMode;
  update: () => void;
  dispose: () => void;
}

function getAhmedabadHour(): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return h + m / 60;
  } catch {
    return 14;
  }
}

function createFloodlightTower(pos: { x: number; y: number; z: number }): {
  group: THREE.Group;
  light: THREE.SpotLight;
} {
  const group = new THREE.Group();
  group.position.set(pos.x, pos.y, pos.z);

  const mastGeo = new THREE.CylinderGeometry(0.25, 0.45, 18, 6);
  const mastMat = new THREE.MeshLambertMaterial({ color: PALETTE.ink });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.y = 9;
  group.add(mast);

  const headGeo = new THREE.BoxGeometry(2.4, 1.2, 0.6);
  const headMat = new THREE.MeshLambertMaterial({ color: PALETTE.cream });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 18;
  group.add(head);

  const light = new THREE.SpotLight(PALETTE.flood, 0, 80, Math.PI / 4, 0.4, 1.2);
  light.position.set(pos.x, pos.y + 18, pos.z);
  light.target.position.set(0, 0, 0);

  return { group, light };
}

function createSkyButton(onToggle: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.id = 'hud-sky-btn';
  btn.setAttribute('aria-label', 'Toggle day or night lighting');
  Object.assign(btn.style, {
    position: 'fixed',
    top: '16px',
    left: '140px',
    zIndex: '1200',
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

  btn.addEventListener('click', onToggle);
  document.body.appendChild(btn);
  return btn;
}

function createStadiumFloodlights(scene: THREE.Scene): Array<{
  group: THREE.Group;
  light: THREE.SpotLight;
}> {
  const towers = [
    createFloodlightTower({ x: -44, y: 0, z: -48 }),
    createFloodlightTower({ x: 44, y: 0, z: -48 }),
    createFloodlightTower({ x: -44, y: 0, z: 48 }),
    createFloodlightTower({ x: 44, y: 0, z: 48 })
  ];

  towers.forEach((t) => {
    scene.add(t.group);
    scene.add(t.light);
    scene.add(t.light.target);
  });
  return towers;
}

function loadSkyModePreference(): SkyMode {
  try {
    const saved = localStorage.getItem('tour-sky-mode');
    if (saved === 'day' || saved === 'night' || saved === 'auto') return saved;
  } catch {
    // localStorage unavailable
  }
  return 'auto';
}

export function createSkySystem(
  scene: THREE.Scene,
  sunLight?: THREE.DirectionalLight,
  ambientLight?: THREE.AmbientLight
): SkyController {
  let mode: SkyMode = loadSkyModePreference();
  const towers = createStadiumFloodlights(scene);
  const skyBtn = createSkyButton(() => toggle());

  function checkIsNight(): boolean {
    if (mode === 'night') return true;
    if (mode === 'day') return false;
    const hour = getAhmedabadHour();
    return hour < 6.5 || hour >= 18.5;
  }

  function applyLighting(): void {
    const night = checkIsNight();
    if (night) {
      scene.background = new THREE.Color(PALETTE.night);
      if (sunLight) sunLight.intensity = 0.15;
      if (ambientLight) ambientLight.intensity = 0.35;
      towers.forEach((t) => (t.light.intensity = 2.4));
    } else {
      scene.background = new THREE.Color(PALETTE.cream);
      if (sunLight) sunLight.intensity = 1.0;
      if (ambientLight) ambientLight.intensity = 0.85;
      towers.forEach((t) => (t.light.intensity = 0));
    }

    const label =
      mode === 'auto' ? `AUTO (${night ? 'NIGHT' : 'DAY'}) [N]` : `${mode.toUpperCase()} [N]`;
    skyBtn.textContent = `SKY: ${label}`;
  }

  function setMode(newMode: SkyMode): void {
    mode = newMode;
    try {
      localStorage.setItem('tour-sky-mode', mode);
    } catch {
      // localStorage unavailable
    }
    applyLighting();
  }

  function toggle(): SkyMode {
    const next: SkyMode = mode === 'auto' ? 'day' : mode === 'day' ? 'night' : 'auto';
    setMode(next);
    return next;
  }

  const onKeyDown = (e: KeyboardEvent): void => {
    if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey) {
      toggle();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  applyLighting();

  return {
    setMode,
    getMode: () => mode,
    isNight: checkIsNight,
    toggle,
    update: applyLighting,
    dispose: () => {
      window.removeEventListener('keydown', onKeyDown);
      if (skyBtn.parentNode) skyBtn.parentNode.removeChild(skyBtn);
      towers.forEach((t) => {
        scene.remove(t.group);
        scene.remove(t.light);
        scene.remove(t.light.target);
      });
    }
  };
}
