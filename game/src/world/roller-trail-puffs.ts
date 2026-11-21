import * as THREE from 'three/webgpu';
import { PALETTE } from './palette';
import type { GameState } from '../types';

export interface PuffPool {
  update: (state: GameState, dt: number) => void;
  dispose: () => void;
}

const PUFF_COUNT = 120;
const PUFF_LIFETIME = 0.6;
const GRAVITY = 9.81;

interface PuffBuffers {
  posX: Float32Array;
  posY: Float32Array;
  posZ: Float32Array;
  velX: Float32Array;
  velY: Float32Array;
  velZ: Float32Array;
  life: Float32Array;
}

function spawnPuff(
  buf: PuffBuffers,
  idx: number,
  state: GameState,
  yaw: number,
  speed: number
): void {
  if (!state.vehicle) return;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const lx = (Math.random() - 0.5) * 1.3;
  const lz = -0.8 + (Math.random() - 0.5) * 0.1;
  buf.posX[idx] = state.vehicle.currentPosition.x + lx * cosY + lz * sinY;
  buf.posY[idx] = 0.08 + Math.random() * 0.04;
  buf.posZ[idx] = state.vehicle.currentPosition.z - lx * sinY + lz * cosY;

  const backDir = speed > 0 ? -1 : 1;
  const lvelZ = backDir * (Math.abs(speed) * 0.4 + 0.4 + Math.random() * 0.4);
  const lvelX = (Math.random() - 0.5) * 0.6;
  buf.velX[idx] = lvelX * cosY + lvelZ * sinY;
  buf.velY[idx] = 1.0 + Math.random() * 0.8;
  buf.velZ[idx] = -lvelX * sinY + lvelZ * cosY;
  buf.life[idx] = PUFF_LIFETIME;
}

function updateInstances(
  buf: PuffBuffers,
  dt: number,
  mesh: THREE.InstancedMesh,
  dummyMatrix: THREE.Matrix4,
  dummyScale: THREE.Vector3
): boolean {
  let anyActive = false;
  for (let i = 0; i < PUFF_COUNT; i++) {
    const curLife = buf.life[i]!;
    if (curLife <= 0) continue;
    anyActive = true;
    const rem = curLife - dt;
    if (rem <= 0) {
      buf.life[i] = 0;
      dummyMatrix.makeScale(0, 0, 0);
      mesh.setMatrixAt(i, dummyMatrix);
      continue;
    }
    buf.life[i] = rem;

    buf.velY[i]! -= GRAVITY * dt;
    buf.posX[i]! += buf.velX[i]! * dt;
    buf.posY[i]! += buf.velY[i]! * dt;
    buf.posZ[i]! += buf.velZ[i]! * dt;
    if (buf.posY[i]! < 0.02) {
      buf.posY[i] = 0.02;
      buf.velY[i] = 0;
    }

    const s = rem / PUFF_LIFETIME;
    dummyScale.set(s, s, s);
    dummyMatrix.makeTranslation(buf.posX[i]!, buf.posY[i]!, buf.posZ[i]!);
    dummyMatrix.scale(dummyScale);
    mesh.setMatrixAt(i, dummyMatrix);
  }
  return anyActive;
}

export function createPuffPool(scene: THREE.Scene): PuffPool {
  const geo = new THREE.BoxGeometry(0.035, 0.035, 0.035);
  const mat = new THREE.MeshLambertMaterial({ color: PALETTE.outfield2 });
  const mesh = new THREE.InstancedMesh(geo, mat, PUFF_COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;

  const buf: PuffBuffers = {
    posX: new Float32Array(PUFF_COUNT),
    posY: new Float32Array(PUFF_COUNT),
    posZ: new Float32Array(PUFF_COUNT),
    velX: new Float32Array(PUFF_COUNT),
    velY: new Float32Array(PUFF_COUNT),
    velZ: new Float32Array(PUFF_COUNT),
    life: new Float32Array(PUFF_COUNT)
  };

  const dummyMatrix = new THREE.Matrix4();
  const dummyScale = new THREE.Vector3();
  dummyMatrix.makeScale(0, 0, 0);
  for (let i = 0; i < PUFF_COUNT; i++) mesh.setMatrixAt(i, dummyMatrix);
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  let nextPuff = 0;
  let spawnAcc = 0;

  return {
    update: (state: GameState, dt: number) => {
      const speed = state.vehicle?.speed ?? 0;
      const absSpeed = Math.abs(speed);
      if (absSpeed > 1 && state.vehicle) {
        const q = state.vehicle.currentRotation;
        const yaw = 2 * Math.atan2(q.y, q.w);
        spawnAcc += absSpeed * dt * 15;
        while (spawnAcc >= 1) {
          spawnAcc -= 1;
          const idx = nextPuff;
          nextPuff = (nextPuff + 1) % PUFF_COUNT;
          spawnPuff(buf, idx, state, yaw, speed);
        }
      }
      const anyActive = updateInstances(buf, dt, mesh, dummyMatrix, dummyScale);
      if (anyActive || absSpeed > 1) mesh.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      scene.remove(mesh);
      geo.dispose();
      mat.dispose();
    }
  };
}
