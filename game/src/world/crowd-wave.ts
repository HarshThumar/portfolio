import { abs, atan, clamp, cos, float, max, sin, smoothstep, step, uniform } from 'three/tsl';
import type { Node } from 'three/webgpu';

export function createWaveUniforms() {
  return {
    time: uniform(0),
    rollerTheta: uniform(0),
    /** 0..1: the roller is pushing along the boundary. */
    react: uniform(0),
    /** 0..1: the horn is held. */
    honk: uniform(0)
  };
}

/**
 * Vertical lift for one vertex, in metres. `seat` is (theta, phase, _); `armLift` is 0 at the
 * shoulder and 1 at the hand, so the hands rise further than the body: arms go up in the wave.
 */
export function waveLiftNode(
  seat: Node<'vec3'>,
  armLift: Node<'float'>,
  u: ReturnType<typeof createWaveUniforms>
): Node<'float'> {
  const theta = seat.x;
  const phase = seat.y;

  // Background Mexican wave circulating the bowl every few seconds.
  const ripple = sin(theta.mul(2).sub(u.time.mul(1.6)));
  const idle = smoothstep(0.75, 1.0, ripple).mul(0.3);

  // Fans nearest the roller cheer while it pushes the boundary; the horn widens the circle.
  const delta = theta.sub(u.rollerTheta);
  const dist = abs(atan(sin(delta), cos(delta)));
  const near = clamp(float(1).sub(dist.div(0.6)), 0, 1)
    .mul(0.55)
    .mul(u.react);
  const horn = step(dist, 1.2).mul(0.6).mul(u.honk);

  const cheer = clamp(max(max(idle, near), horn).mul(2), 0, 1);
  const bob = sin(u.time.mul(2.4).add(phase)).mul(0.012);
  return bob.add(cheer.mul(0.1)).add(armLift.mul(cheer).mul(0.9));
}
