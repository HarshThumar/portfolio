import * as THREE from 'three/webgpu';
import { PALETTE, cssColor, type SharedMaterials } from './palette';

const WIDTH = 5.2;
const HEIGHT = 1.5;
const DEPTH = 0.22;
const TILT = -0.42;
const CANVAS_W = 1024;
const CANVAS_H = 300;
const HEAD_FONT = '"Alfa Slab One", Georgia, serif';
const BODY_FONT = 'Georgia, "Times New Roman", serif';

/** Plaque centre height and the horizontal run its tilted face covers (for collisions). */
export const PLAQUE_Y = 0.95;
export const PLAQUE_HALF_RUN = 0.4;

function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  size: number,
  max: number
) {
  ctx.font = `${size}px ${family}`;
  const w = ctx.measureText(text).width;
  if (w > max) ctx.font = `${Math.floor((size * max) / w)}px ${family}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function draw(canvas: HTMLCanvasElement, name: string, title: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = cssColor(PALETTE.ink);
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = cssColor(PALETTE.cream);
  ctx.fillRect(12, 12, CANVAS_W - 24, CANVAS_H - 24);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = cssColor(PALETTE.ink);
  fit(ctx, name, HEAD_FONT, 96, CANVAS_W - 100);
  ctx.fillText(name, CANVAS_W / 2, 118);

  ctx.fillStyle = cssColor(PALETTE.leather);
  ctx.fillRect(60, 142, CANVAS_W - 120, 5);

  ctx.fillStyle = cssColor(PALETTE.timber);
  ctx.font = `bold 40px ${BODY_FONT}`;
  const lines = wrapLines(ctx, title, CANVAS_W - 120);
  lines.forEach((l, i) => ctx.fillText(l, CANVAS_W / 2, 200 + i * 46));
}

export interface Plaque {
  group: THREE.Group;
  redraw: () => void;
  dispose: () => void;
}

/** A sloped timber board on two legs; local +z is the reading side. Origin at ground level. */
export function createPlaque(name: string, title: string, materials: SharedMaterials): Plaque {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  draw(canvas, name, title);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const face = new THREE.MeshLambertMaterial({ map: texture });
  const edge = materials.timber;

  const group = new THREE.Group();
  const boardGeo = new THREE.BoxGeometry(WIDTH, HEIGHT, DEPTH);
  // Box face order is +x, -x, +y, -y, +z, -z: only +z carries the printed face.
  const board = new THREE.Mesh(boardGeo, [edge, edge, edge, edge, face, edge]);
  board.position.y = PLAQUE_Y;
  board.rotation.x = TILT;
  const legGeo = new THREE.BoxGeometry(0.22, 0.9, 0.22);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, edge);
    leg.position.set(sx * (WIDTH / 2 - 0.4), 0.45, -0.1);
    group.add(leg);
  }
  group.add(board);

  return {
    group,
    redraw: () => {
      draw(canvas, name, title);
      texture.needsUpdate = true;
    },
    dispose: () => {
      boardGeo.dispose();
      legGeo.dispose();
      texture.dispose();
      face.dispose();
    }
  };
}
