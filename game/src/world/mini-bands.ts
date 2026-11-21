import * as THREE from 'three/webgpu';
import type { ColorBatch } from './mini-batch';

export type BandFace = 'top' | 'in' | 'out' | 'bottom' | 'cap';

/** A sloped or flat elliptical ring (terrace, roof, rope) over an arc. a = 0 points along +x. */
export interface BandOpts {
  /** Start and end angle in radians; the band runs from +x toward +z. */
  a0: number;
  a1: number;
  rxIn: number;
  rzIn: number;
  rxOut: number;
  rzOut: number;
  /** Top surface height at the inner and outer edge. */
  yIn: number;
  yOut: number;
  /** How far the slab reaches below its top surface. */
  thick: number;
  segs: number;
  /** Radial strips on the top face (crowd rows). */
  rows?: number;
  /** Skip the underside (terraces sit on the plinth). */
  solid?: boolean;
  /** Height added at angle a (waves, dips). */
  wave?: (a: number) => number;
  color: (k: number, row: number, face: BandFace) => number;
}

type V3 = [number, number, number];

function faceNormal(a: V3, b: V3, c: V3): V3 {
  const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
}

/** Collects triangles facing a hint direction and emits one coloured geometry per colour. */
class TriSink {
  private readonly byColor = new Map<number, number[]>();

  quad(a: V3, b: V3, c: V3, d: V3, hint: V3, color: number): void {
    const n = faceNormal(a, b, c);
    const flip = n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0;
    const list = this.byColor.get(color) ?? [];
    const tris: V3[][] = flip
      ? [
          [a, c, b],
          [a, d, c]
        ]
      : [
          [a, b, c],
          [a, c, d]
        ];
    for (const t of tris) for (const p of t) list.push(p[0], p[1], p[2]);
    this.byColor.set(color, list);
  }

  flush(batch: ColorBatch, y: number, x: number, z: number): void {
    for (const [color, verts] of this.byColor) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      g.computeVertexNormals();
      batch.add(color, g, { x, y, z });
    }
  }
}

function pt(rx: number, rz: number, a: number, y: number): V3 {
  return [Math.cos(a) * rx, y, Math.sin(a) * rz];
}

function addTopRows(sink: TriSink, o: BandOpts, k: number, aa: number, ab: number): void {
  const rows = o.rows ?? 1;
  const wa = o.wave?.(aa) ?? 0;
  const wb = o.wave?.(ab) ?? 0;
  const at = (t: number, a: number, w: number): V3 =>
    pt(
      o.rxIn + (o.rxOut - o.rxIn) * t,
      o.rzIn + (o.rzOut - o.rzIn) * t,
      a,
      o.yIn + (o.yOut - o.yIn) * t + w
    );
  for (let r = 0; r < rows; r++) {
    const t0 = r / rows;
    const t1 = (r + 1) / rows;
    const quad: [V3, V3, V3, V3] = [at(t0, aa, wa), at(t1, aa, wa), at(t1, ab, wb), at(t0, ab, wb)];
    sink.quad(...quad, [0, 1, 0], o.color(k, r, 'top'));
  }
}

function addSides(sink: TriSink, o: BandOpts, k: number, aa: number, ab: number): void {
  const wa = o.wave?.(aa) ?? 0;
  const wb = o.wave?.(ab) ?? 0;
  const mid = (aa + ab) / 2;
  const out: V3 = [Math.cos(mid), 0, Math.sin(mid)];
  const inn: V3 = [-out[0], 0, -out[2]];
  const ia = pt(o.rxIn, o.rzIn, aa, o.yIn + wa);
  const ib = pt(o.rxIn, o.rzIn, ab, o.yIn + wb);
  const oa = pt(o.rxOut, o.rzOut, aa, o.yOut + wa);
  const ob = pt(o.rxOut, o.rzOut, ab, o.yOut + wb);
  const dn = (p: V3): V3 => [p[0], p[1] - o.thick, p[2]];
  sink.quad(oa, ob, dn(ob), dn(oa), out, o.color(k, 0, 'out'));
  sink.quad(ia, ib, dn(ib), dn(ia), inn, o.color(k, 0, 'in'));
  if (!o.solid) sink.quad(dn(ia), dn(ib), dn(ob), dn(oa), [0, -1, 0], o.color(k, 0, 'bottom'));
}

function addCap(sink: TriSink, o: BandOpts, first: boolean): void {
  const ang = first ? o.a0 : o.a1;
  const w = o.wave?.(ang) ?? 0;
  const i = pt(o.rxIn, o.rzIn, ang, o.yIn + w);
  const p = pt(o.rxOut, o.rzOut, ang, o.yOut + w);
  const dn = (v: V3): V3 => [v[0], v[1] - o.thick, v[2]];
  const s = first ? -1 : 1;
  const dir = o.a1 >= o.a0 ? 1 : -1;
  const hint: V3 = [-Math.sin(ang) * s * dir, 0, Math.cos(ang) * s * dir];
  sink.quad(i, p, dn(p), dn(i), hint, o.color(first ? 0 : o.segs - 1, 0, 'cap'));
}

/** Adds a ring band to `batch`; `baseY` lifts the whole thing. */
export function addBand(batch: ColorBatch, o: BandOpts, baseY = 0, cx = 0, cz = 0): void {
  const sink = new TriSink();
  const full = Math.abs(o.a1 - o.a0) >= Math.PI * 2 - 1e-6;
  for (let k = 0; k < o.segs; k++) {
    const aa = o.a0 + ((o.a1 - o.a0) * k) / o.segs;
    const ab = o.a0 + ((o.a1 - o.a0) * (k + 1)) / o.segs;
    addTopRows(sink, o, k, aa, ab);
    addSides(sink, o, k, aa, ab);
  }
  if (!full) {
    addCap(sink, o, true);
    addCap(sink, o, false);
  }
  sink.flush(batch, baseY, cx, cz);
}

/** An elliptical disc (grass, water) whose top is at height y. */
export function addDisc(
  batch: ColorBatch,
  color: number,
  rx: number,
  rz: number,
  y: number,
  thick: number,
  segs: number,
  cx = 0,
  cz = 0
): void {
  const g = new THREE.CylinderGeometry(1, 1, thick, segs);
  g.translate(0, y - thick / 2, 0);
  batch.add(color, g, { x: cx, z: cz, sx: rx, sz: rz });
}

export function flatColor(c: number): BandOpts['color'] {
  return () => c;
}

/** Cheap repeatable noise in 0..1 from two integers. */
export function hash2(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
