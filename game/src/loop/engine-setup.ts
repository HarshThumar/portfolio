import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
  WebGPURenderer
} from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';

export function createPhysicsWorld(rapier: typeof RAPIER): {
  world: RAPIER.World;
  bodies: Map<string, RAPIER.RigidBody>;
} {
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const world = new rapier.World(gravity);
  const bodies = new Map<string, RAPIER.RigidBody>();
  return { world, bodies };
}

export async function createRenderer(canvas: HTMLCanvasElement): Promise<{
  renderer: WebGPURenderer;
  backend: string;
}> {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = SRGBColorSpace;
  // Gentle filmic curve keeps the warm palette from clipping under the low sun.
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  await renderer.init();

  const isWebGPU = Boolean((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend);
  const backend = isWebGPU ? 'WebGPU' : 'WebGL2';
  return { renderer, backend };
}
