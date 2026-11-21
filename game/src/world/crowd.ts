import * as THREE from 'three/webgpu';
import { attribute, instancedBufferAttribute, mix, positionLocal, vec3 } from 'three/tsl';
import type { GameState } from '../types';
import { PROJECT_FIELD, type FieldShape } from './field-shape';
import { createPersonGeometry, hashIndex, pickShirt, pickSkin } from './crowd-people';
import { createWaveUniforms, waveLiftNode } from './crowd-wave';

interface CrowdTier {
  /** Metres outside the rope. */
  offset: number;
  /** Height of the seat the person stands on. */
  y: number;
  count: number;
}

export interface CrowdOptions {
  tiers?: CrowdTier[];
  /** Leave the gap at the pavilion end of the stands. Defaults to true. */
  opening?: boolean;
}

export interface CrowdInstance {
  mesh: THREE.InstancedMesh;
  update: (state: GameState) => void;
  dispose: () => void;
}

interface Seat {
  x: number;
  y: number;
  z: number;
  /** Ellipse angle atan2(z / rz, x / rx), the same one used for the roller. */
  theta: number;
}

const TWO_PI = Math.PI * 2;
const LORDS_TIERS: CrowdTier[] = [
  { offset: 4.5, y: 1.2, count: 220 },
  { offset: 8.5, y: 2.4, count: 260 },
  { offset: 12.5, y: 3.6, count: 300 }
];

function generateSeats(field: FieldShape, tiers: CrowdTier[], opening: boolean): Seat[] {
  const seats: Seat[] = [];
  for (const tier of tiers) {
    for (let i = 0; i < tier.count; i++) {
      const param = (i / tier.count) * TWO_PI;
      const x = Math.cos(param) * (field.rx + tier.offset);
      const z = Math.sin(param) * (field.rz + tier.offset);
      if (opening && z < -(field.rz - 5) && Math.abs(x) < 14) continue;
      seats.push({ x, y: tier.y, z, theta: Math.atan2(z / field.rz, x / field.rx) });
    }
  }
  return seats;
}

function createCrowdMaterial(
  shirts: THREE.InstancedBufferAttribute,
  skins: THREE.InstancedBufferAttribute,
  seat: THREE.InstancedBufferAttribute,
  uniforms: ReturnType<typeof createWaveUniforms>
): THREE.MeshLambertNodeMaterial {
  const material = new THREE.MeshLambertNodeMaterial();
  material.colorNode = mix(
    instancedBufferAttribute(shirts),
    instancedBufferAttribute(skins),
    attribute('part', 'float')
  );
  const rise = waveLiftNode(instancedBufferAttribute(seat), attribute('lift', 'float'), uniforms);
  material.positionNode = positionLocal.add(vec3(0, rise, 0));
  return material;
}

/**
 * Little spectators on every seat ring. Idle bob, the Mexican wave and the reaction to the
 * roller all run in the vertex shader, so the CPU only feeds a handful of uniforms per frame.
 */
export function createCrowd(
  scene: THREE.Scene,
  field: FieldShape = PROJECT_FIELD,
  opts: CrowdOptions = {}
): CrowdInstance {
  const seats = generateSeats(field, opts.tiers ?? LORDS_TIERS, opts.opening ?? true);
  const geo = createPersonGeometry();
  const makeAttr = (): THREE.InstancedBufferAttribute =>
    new THREE.InstancedBufferAttribute(new Float32Array(seats.length * 3), 3);
  const shirts = makeAttr();
  const skins = makeAttr();
  const seatData = makeAttr();
  const uniforms = createWaveUniforms();
  const mat = createCrowdMaterial(shirts, skins, seatData, uniforms);
  const mesh = new THREE.InstancedMesh(geo, mat, seats.length);
  mesh.name = 'crowd-mesh';
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  seats.forEach((seat, i) => {
    const h = hashIndex(i);
    // A few body shapes: width and height vary a little per person.
    const height = 0.9 + (((h >>> 4) % 100) / 100) * 0.25;
    const width = 0.9 + (((h >>> 12) % 100) / 100) * 0.25;
    dummy.position.set(seat.x, seat.y, seat.z);
    dummy.rotation.y = Math.atan2(-seat.x, -seat.z);
    dummy.scale.set(width, height, width);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    color.setHex(pickShirt(i));
    shirts.setXYZ(i, color.r, color.g, color.b);
    color.setHex(pickSkin(i));
    skins.setXYZ(i, color.r, color.g, color.b);
    seatData.setXYZ(i, seat.theta, (((h >>> 20) % 1000) / 1000) * TWO_PI, 0);
  });
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  let rollerTheta = 0;
  let react = 0;
  let honk = 0;

  function update(state: GameState): void {
    const dt = state.time.dt || 0.016;
    uniforms.time.value += dt;
    let reactTarget = 0;
    const vehicle = state.vehicle;
    if (vehicle) {
      const pos = vehicle.currentPosition;
      const nx = pos.x / field.rx;
      const nz = pos.z / field.rz;
      const distSq = nx * nx + nz * nz;
      rollerTheta = Math.atan2(nz, nx);
      const nearBoundary = distSq > 0.58 && distSq < 1.3;
      if (nearBoundary && Math.abs(vehicle.speed) > 1.2) reactTarget = 1;
    }
    const ease = Math.min(1, dt * 6);
    react += (reactTarget - react) * ease;
    honk += ((state.inputs.horn ? 1 : 0) - honk) * ease;
    uniforms.rollerTheta.value = rollerTheta;
    uniforms.react.value = react;
    uniforms.honk.value = honk;
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
