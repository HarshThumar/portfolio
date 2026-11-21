import * as THREE from 'three/webgpu';
import { PALETTE } from './palette';
import type { GameState } from '../types';

export interface CrowdInstance {
  mesh: THREE.InstancedMesh;
  update: (state: GameState) => void;
  dispose: () => void;
}

interface SpectatorData {
  x: number;
  baseY: number;
  z: number;
  /** Ellipse angle atan2(z / 50, x / 42), the same one used for the roller. */
  theta: number;
}

const FIELD_X = 42;
const FIELD_Z = 50;
const TWO_PI = Math.PI * 2;

// Leather is the accent, so it is kept rare (about 1 in 13).
const BODY_COLORS = [PALETTE.cream, PALETTE.willow, PALETTE.ink, PALETTE.timber];

function createSpectatorGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.18, 0.22, 0.7, 5);
  geo.translate(0, 0.35, 0);
  return geo;
}

function generateSpectatorPositions(): SpectatorData[] {
  const positions: SpectatorData[] = [];
  const tiers = [
    { radiusX: 46.5, radiusZ: 54.5, y: 1.2, count: 220 },
    { radiusX: 50.5, radiusZ: 58.5, y: 2.4, count: 260 },
    { radiusX: 54.5, radiusZ: 62.5, y: 3.6, count: 300 }
  ];

  for (const tier of tiers) {
    for (let i = 0; i < tier.count; i++) {
      const param = (i / tier.count) * TWO_PI;
      const x = Math.cos(param) * tier.radiusX;
      const z = Math.sin(param) * tier.radiusZ;
      // Leave the opening at the pavilion end.
      if (z < -45 && Math.abs(x) < 14) continue;
      positions.push({ x, baseY: tier.y, z, theta: Math.atan2(z / FIELD_Z, x / FIELD_X) });
    }
  }
  return positions;
}

function pickColor(index: number): number {
  const h = Math.imul(index + 1, 2654435761) >>> 0;
  if (h % 13 === 0) return PALETTE.leather;
  return BODY_COLORS[(h >>> 8) % BODY_COLORS.length] ?? PALETTE.cream;
}

function wrapAngle(a: number): number {
  let d = a;
  while (d > Math.PI) d -= TWO_PI;
  while (d < -Math.PI) d += TWO_PI;
  return d;
}

interface WaveInput {
  rollerTheta: number;
  rollerSpeed: number;
  nearBoundary: boolean;
  honking: boolean;
  waveTime: number;
}

function waveOffset(spec: SpectatorData, w: WaveInput): number {
  let offset = 0;

  // Background idle wave circulating every few seconds.
  const ripple = Math.sin(spec.theta * 2 - w.waveTime * 1.6);
  if (ripple > 0.75) offset = (ripple - 0.75) * 1.2;

  if ((w.nearBoundary && w.rollerSpeed > 1.2) || w.honking) {
    const dist = Math.abs(wrapAngle(spec.theta - w.rollerTheta));
    if (w.nearBoundary && w.rollerSpeed > 1.2 && dist < 0.6) {
      offset = Math.max(offset, (1 - dist / 0.6) * 0.55);
    }
    if (w.honking && dist < 1.2) offset = Math.max(offset, 0.6);
  }
  // Quantised so tiny drifts do not force a matrix rewrite.
  return Math.round(offset * 100) / 100;
}

export function createCrowd(scene: THREE.Scene): CrowdInstance {
  const geo = createSpectatorGeometry();
  const mat = new THREE.MeshLambertMaterial();
  const spectators = generateSpectatorPositions();
  const mesh = new THREE.InstancedMesh(geo, mat, spectators.length);
  mesh.name = 'crowd-mesh';
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const lastOffset = new Float64Array(spectators.length);
  const wave: WaveInput = {
    rollerTheta: 0,
    rollerSpeed: 0,
    nearBoundary: false,
    honking: false,
    waveTime: 0
  };

  function writeInstance(i: number, spec: SpectatorData, yOffset: number): void {
    dummy.position.set(spec.x, spec.baseY + yOffset, spec.z);
    dummy.rotation.y = -spec.theta - Math.PI / 2;
    dummy.scale.set(1, 1 + yOffset * 0.4, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  spectators.forEach((spec, i) => {
    writeInstance(i, spec, 0);
    mesh.setColorAt(i, color.setHex(pickColor(i)));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);

  function update(state: GameState): void {
    wave.waveTime += state.time.dt || 0.016;
    wave.honking = state.inputs.horn;
    const vehicle = state.vehicle;
    wave.rollerSpeed = 0;
    wave.nearBoundary = false;
    if (vehicle) {
      const pos = vehicle.currentPosition;
      const nx = pos.x / FIELD_X;
      const nz = pos.z / FIELD_Z;
      const distSq = nx * nx + nz * nz;
      wave.rollerTheta = Math.atan2(nz, nx);
      wave.rollerSpeed = Math.abs(vehicle.speed);
      wave.nearBoundary = distSq > 0.58 && distSq < 1.3;
    }

    let dirty = false;
    for (let i = 0; i < spectators.length; i++) {
      const spec = spectators[i];
      if (!spec) continue;
      const yOffset = waveOffset(spec, wave);
      if (yOffset === lastOffset[i]) continue;
      lastOffset[i] = yOffset;
      writeInstance(i, spec, yOffset);
      dirty = true;
    }
    if (dirty) mesh.instanceMatrix.needsUpdate = true;
  }

  return {
    mesh,
    update,
    dispose: () => {
      scene.remove(mesh);
      mesh.dispose();
      geo.dispose();
      mat.dispose();
    }
  };
}
