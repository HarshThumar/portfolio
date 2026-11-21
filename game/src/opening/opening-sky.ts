import * as THREE from 'three/webgpu';

// Test-match weather for the opening: a flat overcast sky, warmed to the site's cream paper
// so the loader fades straight into it, close fog that hides the
// stadium far below, and soft shadowless light. The hub's own sky, fog and lights are put
// back as the ball falls through the cloud deck (setClear), or at once on dispose.

const OVERCAST_FOG = new THREE.Color(0xd6cfbf);
const FOG_NEAR = 60;
const FOG_FAR = 290;
const HEMI = 2.1;
const KEY = 1.1;

export interface OpeningSky {
  /** Hold the overcast look (call every frame; the hub's sky button could change it). */
  update: (camera: THREE.Camera) => void;
  /** 0 = overcast, 1 = the hub's own sky and light. */
  setClear: (k: number) => void;
  dispose: () => void;
}

function drawOvercast(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#f1ead9');
    g.addColorStop(0.45, '#e3dccb');
    g.addColorStop(0.62, '#d6cfbf');
    g.addColorStop(1, '#b9b2a3');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type HubLight = THREE.DirectionalLight | THREE.AmbientLight | THREE.HemisphereLight;

function isHubLight(o: THREE.Object3D): o is HubLight {
  return (
    o instanceof THREE.DirectionalLight ||
    o instanceof THREE.AmbientLight ||
    o instanceof THREE.HemisphereLight
  );
}

export function createOpeningSky(scene: THREE.Scene): OpeningSky {
  const overcast = drawOvercast();
  let hubBackground = scene.background;
  const fog = scene.fog instanceof THREE.Fog ? scene.fog : null;
  const hubFog = fog
    ? { color: fog.color.clone(), near: fog.near, far: fog.far }
    : { color: OVERCAST_FOG.clone(), near: FOG_NEAR, far: FOG_FAR };

  // The hub's lights, remembered at their own intensity and faded out while we're up here.
  const hubLights: Array<{ light: HubLight; intensity: number }> = [];
  scene.traverse((o) => {
    if (isHubLight(o)) hubLights.push({ light: o, intensity: o.intensity });
  });

  const hemi = new THREE.HemisphereLight(0xfbf5e8, 0x9b9385, HEMI);
  const key = new THREE.DirectionalLight(0xfff6e6, KEY);
  scene.add(hemi, key, key.target);

  let clear = 0;
  let restored = false;

  const apply = (): void => {
    const useHub = clear >= 0.5;
    if (!useHub && scene.background !== overcast) {
      hubBackground = scene.background;
      scene.background = overcast;
    } else if (useHub && scene.background === overcast) {
      scene.background = hubBackground;
    }
    if (fog) {
      fog.color.copy(OVERCAST_FOG).lerp(hubFog.color, clear);
      fog.near = FOG_NEAR + (hubFog.near - FOG_NEAR) * clear;
      fog.far = FOG_FAR + (hubFog.far - FOG_FAR) * clear;
    }
    for (const h of hubLights) h.light.intensity = h.intensity * clear;
    hemi.intensity = HEMI * (1 - clear);
    key.intensity = KEY * (1 - clear);
  };
  apply();

  const restore = (): void => {
    if (restored) return;
    restored = true;
    clear = 1;
    apply();
    scene.remove(hemi, key, key.target);
    hemi.dispose();
    key.dispose();
    overcast.dispose();
  };

  return {
    update: (camera) => {
      if (restored) return;
      // The key light comes from over the viewer's shoulder, so the ball is lit softly face on.
      key.position.copy(camera.position);
      key.position.y += 14;
      key.target.position.set(0, camera.position.y - 20, 0);
      apply();
    },
    setClear: (k) => {
      if (restored) return;
      clear = Math.max(0, Math.min(1, k));
      if (clear >= 1) restore();
      else apply();
    },
    dispose: restore
  };
}
