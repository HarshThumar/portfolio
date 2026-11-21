import * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SharedMaterials } from './palette';
import { PROJECT_FIELD, type FieldShape } from './field-shape';
import {
  STRIPE_PERIOD,
  createMowingTexture,
  createPitchTexture,
  createSquareGlowTexture
} from './ground-textures';
import { createFieldColliders } from './ground-colliders';
import { createStaticField } from './ground-stands';

export interface GroundBaseInstance {
  group: THREE.Group;
  dispose: () => void;
}

export interface GroundBaseOptions {
  hideNorthSightScreen?: boolean;
  /** Rope shape the whole ground is built around. Defaults to Lord's. */
  field?: FieldShape;
  /** Lord's tiers and sight screens. Off when the ground's own bowl is built elsewhere. */
  stands?: boolean;
}

function createOutfieldMesh(
  texture: THREE.CanvasTexture,
  field: FieldShape
): {
  mesh: THREE.Mesh;
  dispose: () => void;
} {
  const shape = new THREE.Shape();
  const segments = 96;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * (field.rx + 2);
    const y = Math.sin(theta) * (field.rz + 2);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const geometry = new THREE.ShapeGeometry(shape);

  // ShapeGeometry UVs are world metres; rewrite them so one texture period spans 10 m of z.
  const pos = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, pos.getX(i) / STRIPE_PERIOD, pos.getY(i) / STRIPE_PERIOD);
  }
  uv.needsUpdate = true;

  const material = new THREE.MeshLambertMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return {
    mesh,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    }
  };
}

interface DecalMesh {
  mesh: THREE.Mesh;
  dispose: () => void;
}

/** A flat textured quad lying on the grass. */
function createFlatQuad(
  texture: THREE.Texture,
  w: number,
  d: number,
  y: number,
  transparent: boolean
): DecalMesh {
  const geometry = new THREE.PlaneGeometry(w, d);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshLambertMaterial({
    map: texture,
    transparent,
    depthWrite: !transparent
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = y;
  mesh.receiveShadow = true;
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
  const field = options.field ?? PROJECT_FIELD;
  const stands = options.stands ?? true;
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ground-base';

  const mowingTexture = createMowingTexture();
  const glowTexture = createSquareGlowTexture();
  const pitchTexture = createPitchTexture();
  const outfield = createOutfieldMesh(mowingTexture, field);
  const glow = createFlatQuad(glowTexture, 46, 46, 0.006, true);
  const pitch = createFlatQuad(pitchTexture, 3.2, 20.12, 0.015, false);
  const statics = createStaticField(materials, hideNorth, field, stands);
  rootGroup.add(outfield.mesh, glow.mesh, pitch.mesh, statics.group);
  scene.add(rootGroup);

  const removeColliders = createFieldColliders(world, rapier, hideNorth, field, stands);

  return {
    group: rootGroup,
    dispose: () => {
      scene.remove(rootGroup);
      for (const t of [mowingTexture, glowTexture, pitchTexture]) t.dispose();
      outfield.dispose();
      glow.dispose();
      pitch.dispose();
      statics.dispose();
      removeColliders();
    }
  };
}
