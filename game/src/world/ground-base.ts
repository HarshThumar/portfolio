import * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import { PALETTE, cssColor, type SharedMaterials } from './palette';
import { createFieldColliders } from './ground-colliders';
import { createStaticField } from './ground-stands';

export interface GroundBaseInstance {
  group: THREE.Group;
  dispose: () => void;
}

export interface GroundBaseOptions {
  hideNorthSightScreen?: boolean;
}

// One band pair repeats every 10 m, so each stripe is 5 m wide.
const STRIPE_PERIOD = 10;

function createMowingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = cssColor(PALETTE.outfield);
    ctx.fillRect(0, 0, 8, 32);
    ctx.fillStyle = cssColor(PALETTE.outfield2);
    ctx.fillRect(0, 32, 8, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  return texture;
}

function createOutfieldMesh(texture: THREE.CanvasTexture): {
  mesh: THREE.Mesh;
  dispose: () => void;
} {
  const shape = new THREE.Shape();
  const segments = 96;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * 44;
    const y = Math.sin(theta) * 52;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const geometry = new THREE.ShapeGeometry(shape);

  // ShapeGeometry UVs are world metres; rewrite them so one texture period spans 10 m of z.
  const pos = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, 0, pos.getY(i) / STRIPE_PERIOD);
  }
  uv.needsUpdate = true;

  const material = new THREE.MeshLambertMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return {
    mesh,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    }
  };
}

export function createGroundBase(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  options: GroundBaseOptions = {}
): GroundBaseInstance {
  const hideNorth = options.hideNorthSightScreen ?? false;
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ground-base';

  const mowingTexture = createMowingTexture();
  const outfield = createOutfieldMesh(mowingTexture);
  const field = createStaticField(materials, hideNorth);
  rootGroup.add(outfield.mesh, field.group);
  scene.add(rootGroup);

  const removeColliders = createFieldColliders(world, rapier, hideNorth);

  return {
    group: rootGroup,
    dispose: () => {
      scene.remove(rootGroup);
      mowingTexture.dispose();
      outfield.dispose();
      field.dispose();
      removeColliders();
    }
  };
}
