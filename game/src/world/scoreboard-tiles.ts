import * as THREE from 'three/webgpu';
import { PALETTE, cssColor, type SharedMaterials } from './palette';

interface ScoreItem {
  label: string;
  value: string;
}

const TILE_WIDTH = 2.0;
const TILE_HEIGHT = 2.5;
const TILE_Z = 1.1;
const TILE_Y = 3.2;
const TILE_SPACING = 2.6;
const FONT = '"Alfa Slab One", Georgia, serif';

/** The board's string ("CHECKS 376 · MODELS 9") is the source of truth for tiles. */
export function parseScoreboard(text: string): ScoreItem[] {
  const items: ScoreItem[] = [];
  for (const chunk of text.split('·')) {
    const parts = chunk.trim().split(/\s+/);
    const value = parts.pop();
    if (value && parts.length > 0) items.push({ label: parts.join(' '), value });
  }
  return items;
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number
): void {
  ctx.font = `${size}px ${FONT}`;
  const width = ctx.measureText(text).width;
  if (width > maxWidth) ctx.font = `${Math.floor((size * maxWidth) / width)}px ${FONT}`;
}

function drawTile(canvas: HTMLCanvasElement, item: ScoreItem): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const ink = cssColor(PALETTE.ink);
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = cssColor(PALETTE.cream);
  ctx.fillRect(8, 8, 240, 304);

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  fitFont(ctx, item.label, 216, 26);
  ctx.fillText(item.label, 128, 52);
  ctx.fillRect(16, 68, 224, 3);

  ctx.fillStyle = cssColor(PALETTE.leather);
  fitFont(ctx, item.value, 216, 110);
  ctx.fillText(item.value, 128, 200);

  ctx.fillStyle = 'rgba(30, 27, 22, 0.2)';
  ctx.fillRect(8, 158, 240, 4);
}

export interface ScoreTiles {
  group: THREE.Group;
  tiles: THREE.Mesh[];
  redraw: () => void;
  dispose: () => void;
}

export function createScoreTiles(items: ScoreItem[], materials: SharedMaterials): ScoreTiles {
  const group = new THREE.Group();
  const tiles: THREE.Mesh[] = [];
  const geo = new THREE.BoxGeometry(TILE_WIDTH, TILE_HEIGHT, 0.08);
  const faces: Array<{
    canvas: HTMLCanvasElement;
    texture: THREE.CanvasTexture;
    mat: THREE.Material;
  }> = [];

  items.forEach((item, idx) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    drawTile(canvas, item);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshLambertMaterial({ map: texture });
    faces.push({ canvas, texture, mat });

    // Box face order is +x, -x, +y, -y, +z, -z: only +z carries the printed face.
    const edge = materials.ink;
    const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, mat, edge]);
    mesh.position.set((idx - (items.length - 1) / 2) * TILE_SPACING, TILE_Y, TILE_Z);
    tiles.push(mesh);
    group.add(mesh);
  });

  return {
    group,
    tiles,
    redraw: () => {
      faces.forEach((f, i) => {
        const item = items[i];
        if (!item) return;
        drawTile(f.canvas, item);
        f.texture.needsUpdate = true;
      });
    },
    dispose: () => {
      geo.dispose();
      for (const f of faces) {
        f.texture.dispose();
        f.mat.dispose();
      }
    }
  };
}
