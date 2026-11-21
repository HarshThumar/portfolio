import * as THREE from 'three/webgpu';
import type { ColorBatch } from './mini-batch';
import { addBand, addDisc, flatColor } from './mini-bands';
import { MC, RX, RZ, TAU, TURF_Y, terrace } from './mini-parts';
import { addLords } from './mini-landmarks-lords';
import { addOval } from './mini-landmarks-oval';
import { addGalle } from './mini-landmarks-galle';
import { addNewlands } from './mini-landmarks-newlands';
import { addMcg } from './mini-landmarks-mcg';
import { addDharamsala } from './mini-landmarks-dharamsala';
import { addWankhede } from './mini-landmarks-wankhede';
import { addEden } from './mini-landmarks-eden';
import { addSharjah } from './mini-landmarks-sharjah';

/** Model radius (the oval's long half-axis plus the ring of stands). */
export const MODEL_SIZE = 2.75;
const GRASS = 0x4e7a3a;
const GRASS_STRIPE = 0x5c8a45;
const PITCH = 0xc9b27c;

function ellipseChord(x: number): number {
  const t = 1 - (x / RX) * (x / RX);
  return t > 0 ? RZ * Math.sqrt(t) : 0;
}

/** Oval of grass with mown stripes, a pitch strip and a rope ring. Local origin = oval centre. */
function addTurf(batch: ColorBatch, grass = GRASS, stripe = GRASS_STRIPE): void {
  addDisc(batch, grass, RX, RZ, TURF_Y, 0.1, 40);
  for (let x = -RX + 0.3; x < RX - 0.2; x += 0.6) {
    const chord = ellipseChord(x + 0.15) * 2 - 0.1;
    if (chord > 0.2) batch.box(stripe, 0.3, 0.012, chord, { x, y: TURF_Y + 0.004 });
  }
  batch.box(PITCH, 0.34, 0.016, 1.15, { y: TURF_Y + 0.008 });
  addBand(batch, {
    a0: 0,
    a1: TAU,
    rxIn: RX - 0.05,
    rzIn: RZ - 0.05,
    rxOut: RX,
    rzOut: RZ,
    yIn: TURF_Y + 0.015,
    yOut: TURF_Y + 0.015,
    thick: 0.02,
    segs: 40,
    color: flatColor(MC.cream)
  });
}

/** Fallback for an unknown slug: a plain ring of terraces. */
function addPlain(batch: ColorBatch): void {
  terrace(batch, { a0: 0, a1: TAU, gap: 0.05, width: 0.5, y0: 0.12, y1: 0.4, seat: MC.cream });
}

const BUILDERS: Record<string, (b: ColorBatch) => void> = {
  lords: addLords,
  'the-oval': addOval,
  galle: addGalle,
  newlands: addNewlands,
  mcg: addMcg,
  dharamsala: addDharamsala,
  wankhede: addWankhede,
  'eden-gardens': addEden,
  sharjah: addSharjah
};

/** Adds one ground's miniature (turf plus its stands and landmarks) to `batch`. */
export function addMiniGround(batch: ColorBatch, slug: string): void {
  addTurf(batch);
  (BUILDERS[slug] ?? addPlain)(batch);
}

/** Shared material for every miniature part (colour comes from the vertices). */
export function createMiniMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ vertexColors: true });
}
