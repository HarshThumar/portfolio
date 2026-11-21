import * as THREE from 'three/webgpu';
import { PALETTE } from './palette';

export interface BlobShadow {
  update: (x: number, z: number, yaw: number) => void;
  dispose: () => void;
}

function createShadowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    const ink = PALETTE.ink;
    const rgb = `${(ink >> 16) & 255}, ${(ink >> 8) & 255}, ${ink & 255}`;
    grad.addColorStop(0, `rgba(${rgb}, 0.5)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A soft blob under the roller: one transparent quad instead of a real shadow map. */
export function createBlobShadow(scene: THREE.Scene): BlobShadow {
  const texture = createShadowTexture();
  const geometry = new THREE.PlaneGeometry(2.6, 3.8);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'roller-blob-shadow';
  mesh.rotation.order = 'YXZ';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  mesh.renderOrder = 1;
  scene.add(mesh);

  return {
    update: (x, z, yaw) => {
      mesh.position.x = x;
      mesh.position.z = z;
      mesh.rotation.y = yaw;
    },
    dispose: () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    }
  };
}
