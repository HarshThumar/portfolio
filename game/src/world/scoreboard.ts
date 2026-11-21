import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SharedMaterials } from './palette';
import type { GameState } from '../types';

export interface ScoreboardInstance {
  group: THREE.Group;
  triggerFlip: () => void;
  update: (state: GameState) => void;
  dispose: () => void;
}

interface ScoreboardData {
  title: string;
  items: Array<{ label: string; value: string }>;
}

const DEFAULT_LORDS_SCORE: ScoreboardData = {
  title: "LORD'S CRICKET GROUND",
  items: [
    { label: 'CHECKS', value: '376' },
    { label: 'MODELS', value: '9' },
    { label: 'REDISCOVERED', value: '3' }
  ]
};

function drawTileCanvas(label: string, value: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1e1b16';
    ctx.fillRect(0, 0, 256, 320);

    ctx.fillStyle = '#f3ead3';
    ctx.fillRect(8, 8, 240, 304);

    ctx.fillStyle = '#1e1b16';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 128, 48);

    ctx.fillStyle = '#1e1b16';
    ctx.fillRect(16, 64, 224, 3);

    ctx.fillStyle = '#a3271f';
    ctx.font = 'bold 100px sans-serif';
    ctx.fillText(value, 128, 200);

    ctx.fillStyle = 'rgba(30, 27, 22, 0.2)';
    ctx.fillRect(8, 158, 240, 4);
  }
  return canvas;
}

function createScoreTiles(
  data: ScoreboardData,
  disposables: Array<() => void>
): { tilesGroup: THREE.Group; flipTiles: THREE.Mesh[] } {
  const tilesGroup = new THREE.Group();
  const flipTiles: THREE.Mesh[] = [];

  const tileGeo = new THREE.BoxGeometry(2.0, 2.5, 0.08);
  disposables.push(() => tileGeo.dispose());

  const positionsX = [-2.6, 0, 2.6];

  data.items.forEach((item, idx) => {
    const canvas = drawTileCanvas(item.label, item.value);
    const texture = new THREE.CanvasTexture(canvas);
    disposables.push(() => texture.dispose());

    const mat = new THREE.MeshLambertMaterial({ map: texture });
    disposables.push(() => mat.dispose());

    const mesh = new THREE.Mesh(tileGeo, mat);
    mesh.position.set(positionsX[idx] ?? 0, 3.2, 0.1);
    mesh.castShadow = true;

    flipTiles.push(mesh);
    tilesGroup.add(mesh);
  });

  return { tilesGroup, flipTiles };
}

function createFrame(materials: SharedMaterials): THREE.Group {
  const frame = new THREE.Group();

  const postGeo = new THREE.BoxGeometry(0.35, 6.0, 0.35);
  const leftPost = new THREE.Mesh(postGeo, materials.timber);
  leftPost.position.set(-4.2, 3.0, 0);
  const rightPost = new THREE.Mesh(postGeo, materials.timber);
  rightPost.position.set(4.2, 3.0, 0);
  frame.add(leftPost, rightPost);

  const backboardGeo = new THREE.BoxGeometry(8.2, 4.2, 0.15);
  const backboard = new THREE.Mesh(backboardGeo, materials.ink);
  backboard.position.set(0, 3.4, -0.05);
  frame.add(backboard);

  const headerGeo = new THREE.BoxGeometry(8.6, 0.6, 0.3);
  const header = new THREE.Mesh(headerGeo, materials.timber);
  header.position.set(0, 5.6, 0);
  frame.add(header);

  return frame;
}

export function createScoreboard(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  position = { x: -34, y: 0, z: -10 },
  rotationY = Math.PI / 4,
  data = DEFAULT_LORDS_SCORE
): ScoreboardInstance {
  const group = new THREE.Group();
  group.name = 'manual-scoreboard';
  group.position.set(position.x, position.y, position.z);
  group.rotation.y = rotationY;

  const disposables: Array<() => void> = [];
  const frame = createFrame(materials);
  const { tilesGroup, flipTiles } = createScoreTiles(data, disposables);

  group.add(frame, tilesGroup);
  scene.add(group);

  const bodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(position.x, 2.5, position.z);
  const body = world.createRigidBody(bodyDesc);
  const colDesc = rapier.ColliderDesc.cuboid(4.2, 2.5, 0.6);
  world.createCollider(colDesc, body);

  let flipAngle = 0;
  let isFlipping = false;

  function triggerFlip(): void {
    isFlipping = true;
    flipAngle = 0;
  }

  let hasFlippedOnApproach = false;

  function update(state: GameState): void {
    const vehicle = state.vehicle;
    if (vehicle && !hasFlippedOnApproach) {
      const vPos = vehicle.currentPosition;
      const dist = Math.hypot(vPos.x - position.x, vPos.z - position.z);
      if (dist < 18.0) {
        hasFlippedOnApproach = true;
        triggerFlip();
      }
    }

    if (isFlipping) {
      flipAngle += 0.18;
      flipTiles.forEach((tile, i) => {
        const offset = i * 0.15;
        const currentTileAngle = Math.max(0, Math.min(Math.PI * 2, flipAngle - offset));
        tile.rotation.x = Math.sin(currentTileAngle) * 0.4;
      });
      if (flipAngle > Math.PI * 2 + 0.5) {
        isFlipping = false;
        flipTiles.forEach((tile) => (tile.rotation.x = 0));
      }
    }
  }

  return {
    group,
    triggerFlip,
    update,
    dispose: () => {
      scene.remove(group);
      world.removeRigidBody(body);
      for (const fn of disposables) fn();
    }
  };
}
