import * as THREE from 'three';

export interface GameOptions {
  canvas: HTMLCanvasElement;
}

export interface GameInstance {
  dispose: () => void;
}

export function initGame(options: GameOptions): GameInstance {
  const { canvas } = options;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3ead3); // --cream palette color

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  let animationFrameId = 0;

  function onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function renderLoop(): void {
    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(renderLoop);
  }

  window.addEventListener('resize', onResize);
  renderLoop();

  return {
    dispose: () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    }
  };
}
