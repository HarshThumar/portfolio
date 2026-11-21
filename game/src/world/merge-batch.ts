import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface MergedGroup {
  group: THREE.Group;
  dispose: () => void;
}

export interface MergeBatch {
  /** Takes ownership of `geo`; it is baked into the batch and disposed on build. */
  add: (
    material: THREE.Material,
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    rotY?: number
  ) => void;
  box: (
    material: THREE.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    rotY?: number
  ) => void;
  build: () => MergedGroup;
}

/** Collects static parts and bakes one mesh per material so the scene stays cheap to draw. */
export function createMergeBatch(): MergeBatch {
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();

  function add(
    material: THREE.Material,
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    rotY = 0
  ): void {
    if (rotY !== 0) geo.rotateY(rotY);
    geo.translate(x, y, z);
    const list = buckets.get(material) ?? [];
    list.push(geo);
    buckets.set(material, list);
  }

  function box(
    material: THREE.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    rotY = 0
  ): void {
    add(material, new THREE.BoxGeometry(w, h, d), x, y, z, rotY);
  }

  function build(): MergedGroup {
    const group = new THREE.Group();
    const merged: THREE.BufferGeometry[] = [];
    for (const [material, list] of buckets) {
      // mergeGeometries refuses a mix of indexed and non-indexed inputs.
      const mixed = list.some((g) => g.index === null) && list.some((g) => g.index !== null);
      const parts = mixed ? list.map((g) => (g.index ? g.toNonIndexed() : g)) : list;
      const geo = mergeGeometries(parts, false);
      for (const g of list) g.dispose();
      if (mixed) for (const g of parts) g.dispose();
      if (!geo) continue;
      merged.push(geo);
      group.add(new THREE.Mesh(geo, material));
    }
    buckets.clear();
    return {
      group,
      dispose: () => {
        for (const g of merged) g.dispose();
      }
    };
  }

  return { add, box, build };
}

/** Triangular prism with its ridge along x, base on y = 0. */
export function createGableGeometry(
  length: number,
  span: number,
  height: number
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 3, 1);
  geo.rotateZ(Math.PI / 2);
  geo.rotateX(-Math.PI / 2);
  geo.scale(length, height / 1.5, span / Math.sqrt(3));
  geo.translate(0, height / 3, 0);
  return geo;
}
