import * as THREE from 'three/webgpu';
import { PALETTE, cssColor } from './palette';

/** One band pair repeats every 10 m, so each mowing stripe is 5 m wide. */
export const STRIPE_PERIOD = 10;

const GRASS_SIZE = 512;
const PITCH_W = 128;
const PITCH_H = 512;

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext('2d')];
}

function finishTexture(canvas: HTMLCanvasElement, repeat: boolean): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  return texture;
}

/** Tiling mowing stripes with a soft blade-direction sheen and a speckle of colour noise. */
export function createMowingTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(GRASS_SIZE, GRASS_SIZE);
  if (ctx) {
    const half = GRASS_SIZE / 2;
    ctx.fillStyle = cssColor(PALETTE.outfield);
    ctx.fillRect(0, 0, GRASS_SIZE, half);
    ctx.fillStyle = cssColor(PALETTE.outfield2);
    ctx.fillRect(0, half, GRASS_SIZE, half);
    // Stripe edges are slightly darker where the roller turned.
    ctx.fillStyle = 'rgba(20, 40, 15, 0.10)';
    ctx.fillRect(0, 0, GRASS_SIZE, 3);
    ctx.fillRect(0, half, GRASS_SIZE, 3);

    const rand = seededRandom(7);
    for (let i = 0; i < 5200; i++) {
      const light = rand() > 0.5;
      ctx.fillStyle = light ? 'rgba(190, 215, 120, 0.10)' : 'rgba(25, 55, 20, 0.12)';
      const s = 1 + rand() * 2.5;
      ctx.fillRect(rand() * GRASS_SIZE, rand() * GRASS_SIZE, s, s * (1 + rand() * 2));
    }
    // A few broad, faint patches so the lawn is not perfectly even.
    for (let i = 0; i < 40; i++) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
      g.addColorStop(0, rand() > 0.5 ? 'rgba(200, 220, 120, 0.07)' : 'rgba(20, 50, 20, 0.08)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.save();
      ctx.translate(rand() * GRASS_SIZE, rand() * GRASS_SIZE);
      ctx.fillStyle = g;
      ctx.fillRect(-40, -40, 80, 80);
      ctx.restore();
    }
  }
  return finishTexture(canvas, true);
}

/** Radial lighter wash laid over the square, so the centre reads as the well-kept part. */
export function createSquareGlowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(214, 232, 150, 0.30)');
    g.addColorStop(0.6, 'rgba(214, 232, 150, 0.12)');
    g.addColorStop(1, 'rgba(214, 232, 150, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return finishTexture(canvas, false);
}

/** Worn, dusty pitch strip (3.2 m x 20.12 m) with crease lines and scuffed ends. */
export function createPitchTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(PITCH_W, PITCH_H);
  if (ctx) {
    ctx.fillStyle = cssColor(PALETTE.pitch);
    ctx.fillRect(0, 0, PITCH_W, PITCH_H);
    const rand = seededRandom(31);
    // Wear is heaviest at the good-length spots and around the creases.
    for (const v of [0.12, 0.88, 0.3, 0.7]) {
      const g = ctx.createRadialGradient(PITCH_W / 2, v * PITCH_H, 0, PITCH_W / 2, v * PITCH_H, 70);
      g.addColorStop(0, 'rgba(120, 90, 50, 0.28)');
      g.addColorStop(1, 'rgba(120, 90, 50, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, PITCH_W, PITCH_H);
    }
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(245, 230, 190, 0.18)' : 'rgba(90, 65, 35, 0.16)';
      const s = 1 + rand() * 2;
      ctx.fillRect(rand() * PITCH_W, rand() * PITCH_H, s, s);
    }
    // Lengthwise grain, then the painted creases (metres converted to pixels).
    ctx.fillStyle = 'rgba(255, 245, 215, 0.05)';
    for (let x = 6; x < PITCH_W; x += 14) ctx.fillRect(x, 0, 2, PITCH_H);
    const pxPerM = PITCH_H / 20.12;
    ctx.fillStyle = 'rgba(243, 234, 211, 0.9)';
    for (const sign of [-1, 1]) {
      const stumps = PITCH_H / 2 + sign * 8.8 * pxPerM;
      ctx.fillRect((PITCH_W - 2.64 * (PITCH_W / 3.2)) / 2, stumps - 2, 2.64 * (PITCH_W / 3.2), 4);
      const popping = PITCH_H / 2 + sign * (8.8 - 1.22) * pxPerM;
      ctx.fillRect(0, popping - 2, PITCH_W, 4);
    }
  }
  return finishTexture(canvas, false);
}
