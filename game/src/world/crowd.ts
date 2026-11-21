import * as THREE from 'three';
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
  theta: number;
}

const CROWD_COLORS = [
  PALETTE.cream,
  PALETTE.willow,
  PALETTE.leather,
  PALETTE.ink,
  PALETTE.timber,
  0xffffff
];

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
      const theta = (i / tier.count) * Math.PI * 2;
      const z = Math.sin(theta) * tier.radiusZ;

      // Leave opening at North Pavilion End (z < -45) for Lord's pavilion
      if (z < -45 && Math.abs(Math.cos(theta) * tier.radiusX) < 14) {
        continue;
      }

      const x = Math.cos(theta) * tier.radiusX;
      positions.push({ x, baseY: tier.y, z, theta });
    }
  }

  return positions;
}

function initSpectatorInstances(
  mesh: THREE.InstancedMesh,
  spectators: SpectatorData[],
  dummy: THREE.Object3D
): void {
  const color = new THREE.Color();
  spectators.forEach((spec, i) => {
    dummy.position.set(spec.x, spec.baseY, spec.z);
    dummy.rotation.y = -spec.theta - Math.PI / 2;
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    const hex = CROWD_COLORS[i % CROWD_COLORS.length] ?? PALETTE.cream;
    color.setHex(hex);
    mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function calculateWaveOffset(
  spec: SpectatorData,
  rollerTheta: number,
  rollerSpeed: number,
  isNearBoundary: boolean,
  isHonking: boolean,
  waveTime: number
): number {
  let offset = 0;

  // Background idle Mexican wave circulating every ~8 seconds
  const ripple = Math.sin(spec.theta * 2 - waveTime * 1.6);
  if (ripple > 0.75) {
    offset = (ripple - 0.75) * 1.2;
  }

  // Interactive wave following the roller when driving near the boundary
  if (isNearBoundary && rollerSpeed > 1.2) {
    let diff = spec.theta - rollerTheta;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const dist = Math.abs(diff);
    if (dist < 0.6) {
      offset = Math.max(offset, (1 - dist / 0.6) * 0.55);
    }
  }

  // Reactive crowd cheer when honk button is pressed
  if (isHonking) {
    let diff = spec.theta - rollerTheta;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) < 1.2) {
      offset = Math.max(offset, 0.6);
    }
  }

  return offset;
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
  initSpectatorInstances(mesh, spectators, dummy);
  scene.add(mesh);

  let waveTime = 0;

  function update(state: GameState): void {
    const dt = state.time.dt || 0.016;
    waveTime += dt;

    const vehicle = state.vehicle;
    let rollerTheta = 0;
    let rollerSpeed = 0;
    let isNearBoundary = false;

    if (vehicle) {
      const pos = vehicle.currentPosition;
      rollerTheta = Math.atan2(pos.z, pos.x);
      rollerSpeed = vehicle.speed;
      const radius = Math.hypot(pos.x, pos.z);
      isNearBoundary = radius > 32 && radius < 48;
    }

    const isHonking = state.inputs.horn;

    spectators.forEach((spec, i) => {
      const yOffset = calculateWaveOffset(
        spec,
        rollerTheta,
        rollerSpeed,
        isNearBoundary,
        isHonking,
        waveTime
      );

      dummy.position.set(spec.x, spec.baseY + yOffset, spec.z);
      dummy.rotation.y = -spec.theta - Math.PI / 2;
      const scaleY = 1 + yOffset * 0.4;
      dummy.scale.set(1, scaleY, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }

  return {
    mesh,
    update,
    dispose: () => {
      scene.remove(mesh);
      geo.dispose();
      mat.dispose();
    }
  };
}
