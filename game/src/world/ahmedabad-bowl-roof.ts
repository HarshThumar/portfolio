import * as THREE from 'three/webgpu';
import type { MergeBatch } from './merge-batch';
import { roofTopY, tierTopY, type BowlLayout } from './ahmedabad-bowl-layout';
import { RING_SEGMENTS, lathePart, type BowlMaterials } from './ahmedabad-bowl-parts';

const TRUSS_COUNT = 48;
const LAMPS_PER_ROW = 120;
const LAMP_ROWS = 2;

/** The cantilevered canopy: four faces (each revolved separately so edges stay crisp). */
function addCanopy(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const { rOuter, yOuter, rInner, yInner, thick } = layout.roof;
  lathePart(batch, m.roofTop, [
    [rOuter, yOuter],
    [rInner, yInner]
  ]);
  lathePart(batch, m.roofLip, [
    [rInner, yInner],
    [rInner, yInner - thick]
  ]);
  lathePart(batch, m.roofUnder, [
    [rInner, yInner - thick],
    [rOuter, yOuter - thick]
  ]);
  lathePart(batch, m.roofLip, [
    [rOuter, yOuter - thick],
    [rOuter, yOuter]
  ]);
}

/** Back wall of the upper tier (inside face), outer shell and buttresses. */
function addShell(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const { roof, backWallR, outerWallR } = layout;
  const topInside = roofTopY(roof, backWallR) - roof.thick;
  lathePart(batch, m.trim, [
    [backWallR, topInside],
    [backWallR, tierTopY(layout.upper)]
  ]);
  const height = roofTopY(roof, outerWallR) - roof.thick;
  const shell = new THREE.CylinderGeometry(outerWallR, outerWallR, height, RING_SEGMENTS, 1, true);
  batch.add(m.concrete, shell, 0, height / 2, 0);
  for (let k = 0; k < TRUSS_COUNT; k++) {
    const a = (k / TRUSS_COUNT) * Math.PI * 2;
    const r = outerWallR + 0.45;
    batch.box(
      m.trim,
      1.3,
      height - 0.2,
      1.0,
      Math.sin(a) * r,
      (height - 0.2) / 2,
      Math.cos(a) * r,
      a
    );
  }
}

/** Raked trusses from the back wall up under the canopy, over the crowd's heads. */
function addTrusses(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const { roof, backWallR, upper } = layout;
  const rFar = backWallR - 0.1;
  const yFar = tierTopY(upper);
  const rNear = rFar - 10.3;
  const yNear = roofTopY(roof, rNear) - roof.thick;
  const len = Math.hypot(rFar - rNear, yNear - yFar);
  const pitch = Math.atan2(yNear - yFar, rFar - rNear);
  const rm = (rFar + rNear) / 2;
  const ym = (yFar + yNear) / 2;
  for (let k = 0; k < TRUSS_COUNT; k++) {
    const a = ((k + 0.5) / TRUSS_COUNT) * Math.PI * 2;
    const geo = new THREE.BoxGeometry(0.5, 0.5, len);
    geo.rotateX(pitch);
    batch.add(m.frame, geo, Math.sin(a) * rm, ym, Math.cos(a) * rm, a);
  }
}

export function addRoof(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  addCanopy(batch, m, layout);
  addShell(batch, m, layout);
  addTrusses(batch, m, layout);
}

/** Two rows of bright lamp panels along the roof's inner edge, as one instanced draw. */
export function createFloodlights(
  layout: BowlLayout,
  material: THREE.Material
): { mesh: THREE.InstancedMesh; dispose: () => void } {
  const { rInner, yInner, thick } = layout.roof;
  const geo = new THREE.BoxGeometry(2.8, 0.26, 0.14);
  const mesh = new THREE.InstancedMesh(geo, material, LAMPS_PER_ROW * LAMP_ROWS);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let row = 0; row < LAMP_ROWS; row++) {
    const y = yInner - thick / 2 + (row === 0 ? 0.17 : -0.17);
    for (let k = 0; k < LAMPS_PER_ROW; k++) {
      const a = ((k + row * 0.5) / LAMPS_PER_ROW) * Math.PI * 2;
      const r = rInner - 0.08;
      dummy.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
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
