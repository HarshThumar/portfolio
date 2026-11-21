import * as THREE from 'three/webgpu';
import type { FieldShape } from './field-shape';
import { createPuffPool } from './roller-trail-puffs';
import type { GameState } from '../types';

export interface RollerTrail {
  update: (state: GameState) => void;
  dispose: () => void;
}

const DRUM_WIDTH = 1.5;
const MOVE_THRESHOLD = 0.15;
const OVERLAY_Y = 0.016;
const TRAIL_COLOR = 0xd8ecc0;
const STAMP_SIZE = 64;

/** Maps world coordinates (x, z) to canvas mask pixel coordinates (u, v). */
export function worldToMask(
  x: number,
  z: number,
  field: FieldShape,
  size: number
): { u: number; v: number } {
  const minX = -(field.rx + 3);
  const spanX = 2 * (field.rx + 3);
  const minZ = -(field.rz + 3);
  const spanZ = 2 * (field.rz + 3);
  return {
    u: ((x - minX) / spanX) * size,
    v: ((z - minZ) / spanZ) * size
  };
}

// 1024 px over a ~126 m hub is ~12 cm per pixel: plenty for a 1.5 m stripe. Each upload
// re-sends the whole mask, so it stays small and is sent about ten times a second at most.
const MASK_SIZE = 1024;
const UPLOAD_EVERY_FRAMES = 6;

function createSoftStamp(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = STAMP_SIZE;
  canvas.height = STAMP_SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradY = ctx.createLinearGradient(0, 0, 0, STAMP_SIZE);
    gradY.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradY.addColorStop(0.12, 'rgba(255, 255, 255, 0.85)');
    gradY.addColorStop(0.88, 'rgba(255, 255, 255, 0.85)');
    gradY.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradY;
    ctx.fillRect(0, 0, STAMP_SIZE, STAMP_SIZE);

    ctx.globalCompositeOperation = 'destination-in';
    const gradX = ctx.createLinearGradient(0, 0, STAMP_SIZE, 0);
    gradX.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradX.addColorStop(0.08, 'rgba(0, 0, 0, 1)');
    gradX.addColorStop(0.92, 'rgba(0, 0, 0, 1)');
    gradX.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradX;
    ctx.fillRect(0, 0, STAMP_SIZE, STAMP_SIZE);
    ctx.globalCompositeOperation = 'source-over';
  }
  return canvas;
}

function createOverlay(
  scene: THREE.Scene,
  field: FieldShape,
  maskTexture: THREE.CanvasTexture
): { mesh: THREE.Mesh; dispose: () => void } {
  const spanX = 2 * (field.rx + 3);
  const spanZ = 2 * (field.rz + 3);
  const geometry = new THREE.PlaneGeometry(spanX, spanZ);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshLambertMaterial({
    color: TRAIL_COLOR,
    transparent: true,
    opacity: 0.22,
    alphaMap: maskTexture,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = OVERLAY_Y;
  mesh.receiveShadow = true;
  scene.add(mesh);

  return {
    mesh,
    dispose: () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    }
  };
}

interface StampContext {
  ctx: CanvasRenderingContext2D | null;
  stampCanvas: HTMLCanvasElement;
  field: FieldShape;
  size: number;
  pxPerMx: number;
  pxPerMz: number;
}

function stampSegment(
  sc: StampContext,
  midX: number,
  midZ: number,
  dist: number,
  yaw: number
): void {
  if (!sc.ctx) return;
  const center = worldToMask(midX, midZ, sc.field, sc.size);
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const fu = fx * sc.pxPerMx;
  const fv = fz * sc.pxPerMz;
  const angle = Math.atan2(fv, fu);
  const lenPixels = dist * Math.hypot(fu, fv);
  const drumWidthPixels = DRUM_WIDTH * Math.hypot(-fz * sc.pxPerMx, fx * sc.pxPerMz);

  sc.ctx.save();
  sc.ctx.translate(center.u, center.v);
  sc.ctx.rotate(angle);
  sc.ctx.drawImage(
    sc.stampCanvas,
    -lenPixels * 0.5 - 1,
    -drumWidthPixels * 0.5,
    lenPixels + 2,
    drumWidthPixels
  );
  sc.ctx.restore();
}

export function createRollerTrail(scene: THREE.Scene, field: FieldShape): RollerTrail {
  const size = MASK_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const stampCanvas = createSoftStamp();

  const maskTexture = new THREE.CanvasTexture(canvas);
  maskTexture.minFilter = THREE.LinearFilter;
  maskTexture.magFilter = THREE.LinearFilter;
  maskTexture.generateMipmaps = false;

  const overlay = createOverlay(scene, field, maskTexture);
  const puffs = createPuffPool(scene);

  const spanX = 2 * (field.rx + 3);
  const spanZ = 2 * (field.rz + 3);
  const sc: StampContext = {
    ctx: canvas.getContext('2d'),
    stampCanvas,
    field,
    size,
    pxPerMx: size / spanX,
    pxPerMz: size / spanZ
  };

  let lastX = 0;
  let lastZ = 0;
  let initialized = false;
  let dirty = false;
  let framesSinceUpload = 0;

  return {
    update: (state: GameState): void => {
      const dt = Math.min(state.time.dt, 0.1);
      puffs.update(state, dt);

      if (!state.vehicle) return;
      const currX = state.vehicle.currentPosition.x;
      const currZ = state.vehicle.currentPosition.z;

      if (!initialized) {
        lastX = currX;
        lastZ = currZ;
        initialized = true;
        return;
      }

      const dist = Math.hypot(currX - lastX, currZ - lastZ);
      if (dist >= MOVE_THRESHOLD) {
        const q = state.vehicle.currentRotation;
        const yaw = 2 * Math.atan2(q.y, q.w);
        stampSegment(sc, (lastX + currX) * 0.5, (lastZ + currZ) * 0.5, dist, yaw);
        lastX = currX;
        lastZ = currZ;
        dirty = true;
      }

      framesSinceUpload++;
      if (dirty && framesSinceUpload >= UPLOAD_EVERY_FRAMES) {
        maskTexture.needsUpdate = true;
        dirty = false;
        framesSinceUpload = 0;
      }
    },
    dispose: () => {
      puffs.dispose();
      overlay.dispose();
      maskTexture.dispose();
    }
  };
}
