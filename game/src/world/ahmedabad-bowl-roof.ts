import * as THREE from 'three/webgpu';
import type { MergeBatch } from './merge-batch';
import { roofTopY, tierTopY, type BowlLayout } from './ahmedabad-bowl-layout';
import { RING_SEGMENTS, lathePart, type BowlMaterials } from './ahmedabad-bowl-parts';

const TWO_PI = Math.PI * 2;
const RIB_COUNT = 96;
const COLUMN_COUNT = 48;
const CROWN_COUNT = 96;
const LAMPS_PER_ROW = 360;
const LAMP_ROWS = 2;

type Vec3 = [number, number, number];

function polar(r: number, a: number, y: number): Vec3 {
  return [Math.sin(a) * r, y, Math.cos(a) * r];
}

/** A thin square-section bar between two points, baked into the batch. */
function strut(
  batch: MergeBatch,
  material: THREE.Material,
  p0: Vec3,
  p1: Vec3,
  w: number,
  h = w
): void {
  const dir = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  const len = dir.length();
  const geo = new THREE.BoxGeometry(w, h, len);
  geo.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize())
  );
  batch.add(material, geo, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2);
}

/** Height of the canopy's underside at radius r. */
function underY(layout: BowlLayout, r: number): number {
  return roofTopY(layout.roof, r) - layout.roof.thick;
}

/** The white fabric canopy (four faces, each revolved separately) with radial ribs below. */
function addCanopy(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const { rOuter, yOuter, rInner, yInner, thick } = layout.roof;
  lathePart(batch, m.white, [
    [rOuter, yOuter],
    [rInner, yInner]
  ]);
  lathePart(batch, m.white, [
    [rInner, yInner],
    [rInner, yInner - thick]
  ]);
  lathePart(batch, m.under, [
    [rInner, yInner - thick],
    [rOuter, yOuter - thick]
  ]);
  lathePart(batch, m.white, [
    [rOuter, yOuter - thick],
    [rOuter, yOuter]
  ]);
  for (let k = 0; k < RIB_COUNT; k++) {
    const a = (k / RIB_COUNT) * TWO_PI;
    strut(
      batch,
      m.rib,
      polar(rInner + 0.3, a, underY(layout, rInner + 0.3) - 0.1),
      polar(rOuter - 0.3, a, underY(layout, rOuter - 0.3) - 0.1),
      0.28,
      0.2
    );
  }
}

/** Back wall of the upper tier, glazed outer shell, podium and the ring of white V columns. */
function addFacade(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const { backWallR, outerWallR, upper } = layout;
  lathePart(batch, m.under, [
    [backWallR, underY(layout, backWallR)],
    [backWallR, tierTopY(upper)]
  ]);
  const height = underY(layout, outerWallR);
  const shell = new THREE.CylinderGeometry(outerWallR, outerWallR, height, RING_SEGMENTS, 1, true);
  batch.add(m.glass, shell, 0, height / 2, 0);

  const podiumR = outerWallR + 9;
  const podiumY = 2.6;
  const podium = new THREE.CylinderGeometry(podiumR, podiumR, podiumY, RING_SEGMENTS, 1, true);
  batch.add(m.apron, podium, 0, podiumY / 2, 0);
  lathePart(batch, m.apron, [
    [podiumR, podiumY],
    [outerWallR, podiumY]
  ]);

  const rCol = outerWallR + 1.4;
  const yTop = underY(layout, rCol) - 0.2;
  const step = TWO_PI / COLUMN_COUNT;
  for (let k = 0; k < COLUMN_COUNT; k++) {
    const a = k * step;
    const tip = polar(rCol, a, podiumY);
    strut(batch, m.white, tip, polar(rCol, a - step / 2, yTop), 0.9, 0.9);
    strut(batch, m.white, tip, polar(rCol, a + step / 2, yTop), 0.9, 0.9);
  }
}

/** The tension-ring "crown": two chords and a zig-zag of diagonals standing on the roof's rim. */
function addCrown(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const r = layout.roof.rOuter - 1.6;
  const yLow = roofTopY(layout.roof, r) + 0.2;
  const yHigh = yLow + 4.6;
  const step = TWO_PI / CROWN_COUNT;
  for (let k = 0; k < CROWN_COUNT; k++) {
    const a = k * step;
    const lowA = polar(r, a, yLow);
    const lowB = polar(r, a + step, yLow);
    const highA = polar(r, a + step / 2, yHigh);
    const highB = polar(r, a + step * 1.5, yHigh);
    strut(batch, m.white, lowA, lowB, 0.4);
    strut(batch, m.white, highA, highB, 0.4);
    strut(batch, m.white, lowA, highA, 0.3);
    strut(batch, m.white, highA, lowB, 0.3);
  }
}

/** Two big dark video screens high on the back wall, north and south. */
function addVideoScreens(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const r = layout.backWallR - 0.5;
  for (const a of [0, Math.PI]) {
    const [x, , z] = polar(r, a, 0);
    batch.box(m.glass, 19, 6.6, 0.5, x, 29.4, z, a);
    const [fx, , fz] = polar(r - 0.3, a, 0);
    batch.box(m.dark, 17.6, 5.4, 0.5, fx, 29.4, fz, a);
  }
}

export function addRoof(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  addCanopy(batch, m, layout);
  addFacade(batch, m, layout);
  addCrown(batch, m, layout);
  addVideoScreens(batch, m, layout);
}

/** Two dense rows of bright LED panels along the canopy's inner edge, as one instanced draw. */
export function createFloodlights(
  layout: BowlLayout,
  material: THREE.Material
): { mesh: THREE.InstancedMesh; dispose: () => void } {
  const { rInner, yInner, thick } = layout.roof;
  const geo = new THREE.BoxGeometry(1.2, 0.3, 0.16);
  const mesh = new THREE.InstancedMesh(geo, material, LAMPS_PER_ROW * LAMP_ROWS);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let row = 0; row < LAMP_ROWS; row++) {
    const y = yInner - thick / 2 + (row === 0 ? 0.17 : -0.17);
    for (let k = 0; k < LAMPS_PER_ROW; k++) {
      const a = ((k + row * 0.5) / LAMPS_PER_ROW) * TWO_PI;
      const [x, , z] = polar(rInner - 0.08, a, 0);
      dummy.position.set(x, y, z);
      // Local +z faces the field centre.
      dummy.rotation.set(0, a + Math.PI, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(n++, dummy.matrix);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.name = 'ahmedabad-floodlight-panels';
  return { mesh, dispose: () => geo.dispose() };
}
