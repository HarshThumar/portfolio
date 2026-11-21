import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { MergedGroup } from './merge-batch';

/** Optional placement for a part: position, Euler rotation (Y, X, Z order) and scale. */
interface Xf {
  x?: number;
  y?: number;
  z?: number;
  ry?: number;
  rx?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

export interface ColorBatch {
  /** Takes ownership of `geo`. Bakes the colour into vertex colours. */
  add: (color: number, geo: THREE.BufferGeometry, xf?: Xf) => void;
  box: (color: number, w: number, h: number, d: number, xf?: Xf) => void;
  /** Cylinder or frustum standing on y = 0 (before the transform). */
  cyl: (color: number, rBottom: number, rTop: number, h: number, seg: number, xf?: Xf) => void;
  /** Cone standing on y = 0 (before the transform). */
  cone: (color: number, r: number, h: number, seg: number, xf?: Xf) => void;
  /** Lifts every part added from now on by `y`. */
  lift: (y: number) => void;
  /** Triangle count so far. */
  tris: () => number;
  /** One mesh for the whole batch, drawn with `material` (vertexColors on). */
  build: (material: THREE.Material) => MergedGroup;
}

const tmpMat = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();

/** Collects coloured parts and merges them into one vertex-coloured mesh (one draw call). */
export function createColorBatch(): ColorBatch {
  const parts: THREE.BufferGeometry[] = [];
  let triCount = 0;
  let liftY = 0;

  function add(color: number, geo: THREE.BufferGeometry, xf: Xf = {}): void {
    const flat = geo.index ? geo.toNonIndexed() : geo;
    if (flat !== geo) geo.dispose();
    flat.deleteAttribute('uv');
    tmpEuler.set(xf.rx ?? 0, xf.ry ?? 0, xf.rz ?? 0, 'YXZ');
    tmpQuat.setFromEuler(tmpEuler);
    tmpPos.set(xf.x ?? 0, (xf.y ?? 0) + liftY, xf.z ?? 0);
    tmpScale.set(xf.sx ?? 1, xf.sy ?? 1, xf.sz ?? 1);
    flat.applyMatrix4(tmpMat.compose(tmpPos, tmpQuat, tmpScale));
    const n = flat.getAttribute('position').count;
    const c = new THREE.Color(color);
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    flat.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    parts.push(flat);
    triCount += n / 3;
  }

  function box(color: number, w: number, h: number, d: number, xf: Xf = {}): void {
    add(color, new THREE.BoxGeometry(w, h, d), xf);
  }

  function cyl(color: number, rb: number, rt: number, h: number, seg: number, xf: Xf = {}): void {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    g.translate(0, h / 2, 0);
    add(color, g, xf);
  }

  function cone(color: number, r: number, h: number, seg: number, xf: Xf = {}): void {
    const g = new THREE.ConeGeometry(r, h, seg);
    g.translate(0, h / 2, 0);
    add(color, g, xf);
  }

  function build(material: THREE.Material): MergedGroup {
    const group = new THREE.Group();
    const geo = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    parts.length = 0;
    if (geo) group.add(new THREE.Mesh(geo, material));
    return {
      group,
      dispose: () => {
        geo?.dispose();
      }
    };
  }

  return {
    add,
    box,
    cyl,
    cone,
    lift: (y: number) => {
      liftY = y;
    },
    tris: () => triCount,
    build
  };
}
