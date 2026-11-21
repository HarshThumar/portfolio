import * as THREE from 'three/webgpu';
import { PALETTE } from './palette';
import { PROJECT_FIELD, type FieldShape } from './field-shape';

export interface Atmosphere {
  sun: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  hemi: THREE.HemisphereLight;
  /** Re-centres the sun's shadow camera on (x, z), normally the roller. */
  follow: (x: number, z: number) => void;
  /** Swaps the sky gradient and fog between day and night. Light intensities stay with sky.ts. */
  setNight: (night: boolean) => void;
  dispose: () => void;
}

interface SkyLook {
  top: number;
  mid: number;
  horizon: number;
}

// Warm haze at the horizon, soft (not saturated) blue overhead; night is a deep blue.
const DAY_SKY: SkyLook = { top: 0x8fb2d2, mid: 0xcbdde6, horizon: 0xf0e0c4 };
const NIGHT_SKY: SkyLook = { top: 0x060c14, mid: 0x0b1620, horizon: PALETTE.night };

const HEMI_SKY = 0xbcd4e8;
const HEMI_GROUND = 0x6e8c4c;
const SUN_WARM = 0xffe9c4;

/** The shadow camera covers a square this wide, centred on the roller. */
const SHADOW_SPAN = 40;
/** Sun direction from the target: low enough for long, soft-looking shadows. */
const SUN_OFFSET = new THREE.Vector3(22, 26, 18);

function createSkyTexture(look: SkyLook): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const css = (hex: number): string => `#${hex.toString(16).padStart(6, '0')}`;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, css(look.top));
    g.addColorStop(0.3, css(look.mid));
    g.addColorStop(0.5, css(look.horizon));
    g.addColorStop(1, css(look.horizon));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function isCoarsePointer(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

export function createAtmosphere(
  scene: THREE.Scene,
  field: FieldShape = PROJECT_FIELD
): Atmosphere {
  const dayTexture = createSkyTexture(DAY_SKY);
  const nightTexture = createSkyTexture(NIGHT_SKY);
  const dayFog = new THREE.Color(DAY_SKY.horizon);
  const nightFog = new THREE.Color(NIGHT_SKY.horizon);

  // Fog starts beyond the outer stands so the bowl itself stays crisp.
  const fogNear = Math.max(field.rx, field.rz) + 40;
  const fog = new THREE.Fog(dayFog.getHex(), fogNear, fogNear + 180);
  scene.background = dayTexture;
  scene.fog = fog;

  const hemi = new THREE.HemisphereLight(HEMI_SKY, HEMI_GROUND, 0.6);
  const ambient = new THREE.AmbientLight(PALETTE.flood, 0.35);
  const sun = new THREE.DirectionalLight(SUN_WARM, 1.6);
  sun.position.copy(SUN_OFFSET);
  sun.castShadow = true;
  const mapSize = isCoarsePointer() ? 1024 : 2048;
  sun.shadow.mapSize.set(mapSize, mapSize);
  const half = SHADOW_SPAN / 2;
  const cam = sun.shadow.camera;
  cam.left = -half;
  cam.right = half;
  cam.top = half;
  cam.bottom = -half;
  cam.near = 1;
  cam.far = SUN_OFFSET.length() + 40;
  cam.updateProjectionMatrix();
  // Tuned against acne on the flat outfield; normalBias does most of the work.
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  sun.shadow.radius = 2;
  scene.add(hemi, ambient, sun, sun.target);

  return {
    sun,
    ambient,
    hemi,
    follow: (x, z) => {
      sun.target.position.set(x, 0, z);
      sun.position.set(x + SUN_OFFSET.x, SUN_OFFSET.y, z + SUN_OFFSET.z);
      sun.target.updateMatrixWorld();
    },
    setNight: (night) => {
      scene.background = night ? nightTexture : dayTexture;
      fog.color.copy(night ? nightFog : dayFog);
      sun.color.setHex(night ? 0x8aa4d0 : SUN_WARM);
    },
    dispose: () => {
      scene.remove(hemi, ambient, sun, sun.target);
      sun.dispose();
      hemi.dispose();
      ambient.dispose();
      scene.background = null;
      scene.fog = null;
      dayTexture.dispose();
      nightTexture.dispose();
    }
  };
}
