import * as THREE from 'three/webgpu';
import { PALETTE, cssColor } from './palette';
import type { GameState } from '../types';

export interface ExitMat {
  update: (state: GameState) => void;
  dispose: () => void;
}

const RADIUS = 3.2;
const MAX_ENTRY_SPEED = 4;
const NEAR = 12;

function drawLabel(canvas: HTMLCanvasElement, text: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.fillStyle = cssColor(PALETTE.cream);
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = cssColor(PALETTE.leather);
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  ctx.fillStyle = cssColor(PALETTE.ink);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `64px 'Alfa Slab One', Georgia, serif`;
  ctx.fillText(text, width / 2, height / 2);
}

/**
 * A mat on the grass that takes the visitor back to the hub when the roller stops on it.
 * It fires once, then re-arms only after the roller has driven well clear.
 */
export function createExitMat(
  scene: THREE.Scene,
  at: { x: number; z: number; yaw: number },
  label: string,
  onEnter: () => void
): ExitMat {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  drawLabel(canvas, label);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  let alive = true;
  void document.fonts.load(`64px 'Alfa Slab One'`).then(() => {
    if (!alive) return;
    drawLabel(canvas, label);
    texture.needsUpdate = true;
  });

  const geometry = new THREE.PlaneGeometry(RADIUS * 2.4, RADIUS * 0.6);
  const material = new THREE.MeshLambertMaterial({ map: texture, emissive: PALETTE.flood });
  material.emissiveIntensity = 0;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.set(-Math.PI / 2, at.yaw, 0, 'YXZ');
  mesh.position.set(at.x, 0.03, at.z);
  mesh.receiveShadow = true;
  scene.add(mesh);

  let armed = false;
  let pulse = 0;
  return {
    update: (state) => {
      const v = state.vehicle;
      if (!v) return;
      const d = Math.hypot(v.currentPosition.x - at.x, v.currentPosition.z - at.z);
      if (d > RADIUS + 2) armed = true;
      pulse += state.time.dt;
      material.emissiveIntensity = d < NEAR ? 0.25 + 0.2 * Math.sin(pulse * 4) : 0;
      if (armed && d < RADIUS && Math.abs(v.speed) < MAX_ENTRY_SPEED && !state.cameraShot) {
        armed = false;
        onEnter();
      }
    },
    dispose: () => {
      alive = false;
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    }
  };
}
