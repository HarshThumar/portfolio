import * as THREE from 'three/webgpu';
import { PALETTE } from './palette';
import { createMergeBatch, type MergedGroup } from './merge-batch';
import { createSkyButton, type SkyMode } from './sky-button';

export interface SkyController {
  setMode: (mode: SkyMode) => void;
  getMode: () => SkyMode;
  isNight: () => boolean;
  toggle: () => SkyMode;
  update: () => void;
  dispose: () => void;
}

/** sky.ts owns every light intensity; index.ts only creates the lights. */
const SKY_LIGHT = {
  day: { sun: 1.0, ambient: 0.85, flood: 0 },
  night: { sun: 0.15, ambient: 0.35, flood: 1.6 }
} as const;

const DAY_START = 6.5;
const NIGHT_START = 18.5;
const RECHECK_MS = 60_000;
const STORAGE_KEY = 'tour-sky-mode';
const MAST_HEIGHT = 18;

// Outside the outermost stand tier (57 x 65), on the diagonals.
const TOWER_SPOTS = [
  { x: -47, z: -53, lit: true },
  { x: 47, z: -53, lit: false },
  { x: -47, z: 53, lit: false },
  { x: 47, z: 53, lit: true }
];

function createHourReader(): () => number {
  let formatter: Intl.DateTimeFormat | null = null;
  try {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23'
    });
  } catch {
    formatter = null;
  }
  return () => {
    if (!formatter) return 14;
    let h = 14;
    let m = 0;
    for (const part of formatter.formatToParts(new Date())) {
      if (part.type === 'hour') h = parseInt(part.value, 10);
      else if (part.type === 'minute') m = parseInt(part.value, 10);
    }
    return h + m / 60;
  };
}

function loadSkyModePreference(): SkyMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'day' || saved === 'night' || saved === 'auto') return saved;
  } catch {
    // Storage can be blocked; the default is fine.
  }
  return 'auto';
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

interface Towers {
  built: MergedGroup;
  lights: THREE.SpotLight[];
  headMaterial: THREE.MeshBasicMaterial;
  dispose: () => void;
}

function createTowers(scene: THREE.Scene): Towers {
  const mastMat = new THREE.MeshLambertMaterial({ color: PALETTE.ink });
  const headMat = new THREE.MeshBasicMaterial({ color: PALETTE.cream });
  const batch = createMergeBatch();
  const lights: THREE.SpotLight[] = [];

  for (const spot of TOWER_SPOTS) {
    const mast = new THREE.CylinderGeometry(0.25, 0.45, MAST_HEIGHT, 6);
    batch.add(mastMat, mast, spot.x, MAST_HEIGHT / 2, spot.z);
    const head = new THREE.BoxGeometry(2.4, 1.2, 0.6);
    batch.add(headMat, head, spot.x, MAST_HEIGHT, spot.z, Math.atan2(-spot.x, -spot.z));
    if (!spot.lit) continue;
    // decay 0: a 70 m throw would otherwise need an unwieldy intensity.
    const light = new THREE.SpotLight(PALETTE.flood, 0, 0, Math.PI / 4, 0.5, 0);
    light.position.set(spot.x, MAST_HEIGHT, spot.z);
    light.target.position.set(0, 0, 0);
    scene.add(light, light.target);
    lights.push(light);
  }

  const built = batch.build();
  scene.add(built.group);
  return {
    built,
    lights,
    headMaterial: headMat,
    dispose: () => {
      scene.remove(built.group);
      built.dispose();
      mastMat.dispose();
      headMat.dispose();
      for (const l of lights) {
        scene.remove(l, l.target);
        l.dispose();
      }
    }
  };
}

export function createSkySystem(
  scene: THREE.Scene,
  sunLight?: THREE.DirectionalLight,
  ambientLight?: THREE.AmbientLight
): SkyController {
  let mode = loadSkyModePreference();
  const readHour = createHourReader();
  const towers = createTowers(scene);
  const dayBg = new THREE.Color(PALETTE.cream);
  const nightBg = new THREE.Color(PALETTE.night);
  const dayHead = new THREE.Color(PALETTE.cream);
  const nightHead = new THREE.Color(PALETTE.flood);
  const button = createSkyButton(() => toggle());

  let night = false;
  let lastCheck = 0;
  let applied: boolean | null = null;

  function computeNight(): boolean {
    if (mode !== 'auto') return mode === 'night';
    const hour = readHour();
    return hour < DAY_START || hour >= NIGHT_START;
  }

  function applyLighting(): void {
    button.setState(mode, night);
    if (applied === night) return;
    applied = night;
    const set = night ? SKY_LIGHT.night : SKY_LIGHT.day;
    scene.background = night ? nightBg : dayBg;
    if (sunLight) sunLight.intensity = set.sun;
    if (ambientLight) ambientLight.intensity = set.ambient;
    for (const l of towers.lights) l.intensity = set.flood;
    towers.headMaterial.color.copy(night ? nightHead : dayHead);
  }

  function refresh(): void {
    lastCheck = Date.now();
    night = computeNight();
    applyLighting();
  }

  function setMode(next: SkyMode): void {
    mode = next;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage can be blocked; the choice just won't persist.
    }
    refresh();
  }

  function toggle(): SkyMode {
    const next: SkyMode = mode === 'auto' ? 'day' : mode === 'day' ? 'night' : 'auto';
    setMode(next);
    return next;
  }

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'n' && e.key !== 'N') return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || isTypingTarget(e.target)) return;
    toggle();
  };
  window.addEventListener('keydown', onKeyDown);

  refresh();

  return {
    setMode,
    getMode: () => mode,
    isNight: () => night,
    toggle,
    update: () => {
      if (mode === 'auto' && Date.now() - lastCheck >= RECHECK_MS) refresh();
    },
    dispose: () => {
      window.removeEventListener('keydown', onKeyDown);
      button.dispose();
      towers.dispose();
    }
  };
}
