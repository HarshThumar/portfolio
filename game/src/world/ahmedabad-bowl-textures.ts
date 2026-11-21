import * as THREE from 'three/webgpu';

// Flat painted canvases (no photo textures): orange lower seats, blue upper seats with the
// orange and yellow flame chevrons, and the white box band with its two strips of dark glass.
const ORANGE = '#f08a1f';
const ORANGE_DEEP = '#d2441b';
const YELLOW = '#f6c52b';
const BLUE = '#27419c';
const BLUE_LIGHT = '#3556b8';

function makeTexture(
  w: number,
  h: number,
  repeat: number,
  paint: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Profiles run top to bottom, so canvas row 0 is v = 0: no flip.
  texture.flipY = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(repeat, 1);
  texture.anisotropy = 8;
  return texture;
}

/** Canvas y = 0 is the top of the tier (v = 1), so "rows from the bottom" are drawn upside down. */
function rowLines(ctx: CanvasRenderingContext2D, w: number, h: number, rows: number): void {
  const rh = h / rows;
  for (let i = 0; i < rows; i++) {
    ctx.fillStyle = 'rgba(30, 20, 10, 0.28)';
    ctx.fillRect(0, i * rh, w, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(0, i * rh + 2, w, rh * 0.35);
  }
}

export function createLowerSeatTexture(rows: number, repeat: number): THREE.CanvasTexture {
  const w = 32;
  const h = rows * 16;
  return makeTexture(w, h, repeat, (ctx) => {
    const g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, ORANGE_DEEP);
    g.addColorStop(0.55, '#e6641c');
    g.addColorStop(1, ORANGE);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    rowLines(ctx, w, h, rows);
    ctx.fillStyle = 'rgba(30, 20, 10, 0.22)';
    ctx.fillRect(0, 0, 2, h);
  });
}

function triangle(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

export function createUpperSeatTexture(rows: number, repeat: number): THREE.CanvasTexture {
  const w = 512;
  const h = rows * 16;
  return makeTexture(w, h, repeat, (ctx) => {
    ctx.fillStyle = BLUE;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = BLUE_LIGHT;
    for (let i = 0; i < rows; i += 2) ctx.fillRect(0, i * 16, w, 16);
    // Tall flame chevrons: big orange peak, yellow peak inside, a low orange peak between.
    triangle(
      ctx,
      [
        [-60, h],
        [w * 0.5, h * 0.06],
        [w + 60, h]
      ],
      ORANGE
    );
    triangle(
      ctx,
      [
        [w * 0.08, h],
        [w * 0.5, h * 0.3],
        [w * 0.92, h]
      ],
      YELLOW
    );
    triangle(
      ctx,
      [
        [w * 0.2, h],
        [w * 0.5, h * 0.52],
        [w * 0.8, h]
      ],
      ORANGE_DEEP
    );
    triangle(
      ctx,
      [
        [-20, h * 0.5],
        [0, h * 0.42],
        [w * 0.2, h * 0.5]
      ],
      ORANGE
    );
    rowLines(ctx, w, h, rows);
  });
}

export function createBandTexture(repeat: number): THREE.CanvasTexture {
  const w = 512;
  const h = 320;
  return makeTexture(w, h, repeat, (ctx) => {
    ctx.fillStyle = '#f4f0e4';
    ctx.fillRect(0, 0, w, h);
    // Canvas y grows downward: top of the wall first, ad strip at the bottom.
    ctx.fillStyle = '#243746';
    ctx.fillRect(0, h * 0.2, w, h * 0.2);
    ctx.fillRect(0, h * 0.46, w, h * 0.2);
    ctx.fillStyle = '#f4f0e4';
    for (let x = 0; x < w; x += 64) ctx.fillRect(x, h * 0.2, 4, h * 0.46);
    const ads = [
      '#24409a',
      '#a3271f',
      '#f6c52b',
      '#f4f0e4',
      '#4e7a3a',
      '#24409a',
      '#d8b87a',
      '#a3271f'
    ];
    ads.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * 64, h * 0.8, 64, h * 0.14);
    });
    ctx.fillStyle = 'rgba(30, 27, 22, 0.3)';
    ctx.fillRect(0, h * 0.7, w, 3);
  });
}
