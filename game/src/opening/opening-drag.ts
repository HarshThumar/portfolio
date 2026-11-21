import * as THREE from 'three/webgpu';

// Once the ball is stamped, the visitor can grab it and spin it (mouse or finger). It keeps a
// little spin after letting go, then turns its stamp back to the camera when left alone.

const SPIN_PER_PX = 0.008;
const FRICTION = 4;
const SETTLE_AFTER = 1;

export interface BallDrag {
  enable: () => void;
  /** Spins the ball if the visitor is (or just was) handling it; false = let it settle. */
  update: (dt: number, ball: THREE.Object3D, camera: THREE.Camera) => boolean;
  dispose: () => void;
}

const right = new THREE.Vector3();
const up = new THREE.Vector3();
const turn = new THREE.Quaternion();

export function createBallDrag(): BallDrag {
  let enabled = false;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pendingX = 0;
  let pendingY = 0;
  let velX = 0;
  let velY = 0;
  let idle = SETTLE_AFTER;

  const onDown = (e: PointerEvent): void => {
    // Only grabs on the 3D view, never on the play button or links.
    if (!enabled || !(e.target instanceof HTMLCanvasElement)) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    velX = velY = 0;
    document.body.classList.add('opening-grabbing');
  };
  const onMove = (e: PointerEvent): void => {
    if (!dragging) return;
    pendingX += e.clientX - lastX;
    pendingY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onUp = (): void => {
    dragging = false;
    document.body.classList.remove('opening-grabbing');
  };
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  return {
    enable: () => {
      enabled = true;
      document.body.classList.add('opening-grab');
    },
    update: (dt, ball, camera) => {
      if (dragging && dt > 0) {
        velX = (pendingX * SPIN_PER_PX) / dt;
        velY = (pendingY * SPIN_PER_PX) / dt;
      } else {
        const keep = Math.exp(-FRICTION * dt);
        velX *= keep;
        velY *= keep;
      }
      pendingX = pendingY = 0;
      const moving = Math.abs(velX) + Math.abs(velY) > 0.3;
      idle = dragging || moving ? 0 : idle + dt;
      if (idle >= SETTLE_AFTER) return false;
      // Drag sideways turns it round the screen's up axis, drag up/down round its right axis.
      right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      ball.quaternion.premultiply(turn.setFromAxisAngle(up, velX * dt));
      ball.quaternion.premultiply(turn.setFromAxisAngle(right, velY * dt));
      return true;
    },
    dispose: () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.classList.remove('opening-grab', 'opening-grabbing');
    }
  };
}
