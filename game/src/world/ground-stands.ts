import * as THREE from 'three/webgpu';
import type { SharedMaterials } from './palette';
import { createMergeBatch, type MergeBatch, type MergedGroup } from './merge-batch';
import { PROJECT_FIELD, type FieldShape } from './field-shape';

/** Each tier is 4 m deep; the first starts 3 m outside the rope. Offsets are metres from the rope. */
const TIERS = [
  { inner: 3, outer: 7, y: 0.6, height: 1.2 },
  { inner: 7, outer: 11, y: 1.8, height: 1.2 },
  { inner: 11, outer: 15, y: 3.0, height: 1.2 }
];

/** Perimeter wall hugs the first tier so the rope-to-wall strip stays drivable for the SIX. */
export const WALL_OFFSET = 2.75;
/** Sight screens sit between the rope and the wall so they never touch the stands. */
export const SIGHT_SCREEN_OFFSET = 1.2;

function ellipsePath<T extends THREE.Path>(path: T, rx: number, rz: number, reverse: boolean): T {
  const segments = 48;
  for (let n = 0; n <= segments; n++) {
    const i = reverse ? segments - n : n;
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * rx;
    const y = Math.sin(theta) * rz;
    if (n === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  return path;
}

/** Three stepped rings of seating around the rope, baked into the shared batch. */
function addStands(batch: MergeBatch, materials: SharedMaterials, field: FieldShape): void {
  for (const tier of TIERS) {
    const shape = ellipsePath(
      new THREE.Shape(),
      field.rx + tier.outer,
      field.rz + tier.outer,
      false
    );
    shape.holes.push(
      ellipsePath(new THREE.Path(), field.rx + tier.inner, field.rz + tier.inner, true)
    );
    const geo = new THREE.ExtrudeGeometry(shape, { depth: tier.height, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    batch.add(materials.cream, geo, 0, tier.y - tier.height / 2, 0);
  }
}

function createSightScreen(batch: MergeBatch, materials: SharedMaterials, zPos: number): void {
  batch.box(materials.timber, 0.2, 3.5, 0.2, -2.8, 1.75, zPos);
  batch.box(materials.timber, 0.2, 3.5, 0.2, 2.8, 1.75, zPos);
  batch.box(materials.cream, 5.4, 3.0, 0.1, 0, 1.8, zPos);
}

export const SIGHT_SCREEN_HEIGHT = 3.5;
export const SIGHT_SCREEN_HALF_WIDTH = 2.9;

function addRope(batch: MergeBatch, materials: SharedMaterials, field: FieldShape): void {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 80; i++) {
    const theta = (i / 80) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * field.rx, 0.08, Math.sin(theta) * field.rz));
  }
  const curve = new THREE.CatmullRomCurve3(points, true);
  batch.add(materials.cream, new THREE.TubeGeometry(curve, 96, 0.08, 6, true), 0, 0, 0);

  for (let i = 0; i < 18; i++) {
    const theta = (i / 18) * Math.PI * 2;
    const marker = new THREE.ConeGeometry(0.2, 0.3, 4);
    marker.rotateX(Math.PI / 2);
    batch.add(
      i % 2 === 0 ? materials.cream : materials.leather,
      marker,
      Math.cos(theta) * (field.rx + 0.3),
      0.1,
      Math.sin(theta) * (field.rz + 0.3),
      -theta
    );
  }
}

/** Rope, rope markers, optional stands and sight screens. The pitch is a textured mesh in ground-base. */
export function createStaticField(
  materials: SharedMaterials,
  hideNorthSightScreen: boolean,
  field: FieldShape = PROJECT_FIELD,
  stands = true
): MergedGroup {
  const batch = createMergeBatch();
  addRope(batch, materials, field);
  if (stands) {
    addStands(batch, materials, field);
    const z = field.rz + SIGHT_SCREEN_OFFSET;
    createSightScreen(batch, materials, z);
    if (!hideNorthSightScreen) createSightScreen(batch, materials, -z);
  }
  const built = batch.build();
  // Cheap casters: the stands' shadow camera only ever covers a 40 m patch around the roller.
  built.group.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = stands;
  });
  return built;
}
