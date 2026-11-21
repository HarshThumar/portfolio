import { describe, it, expect } from 'vitest';
import { worldToMask } from '../../game/src/world/roller-trail';
import { PROJECT_FIELD, HUB_FIELD } from '../../game/src/world/field-shape';

describe('roller-trail worldToMask', () => {
  it('maps ground center (0, 0) to mask texture center', () => {
    const size = 1024;
    const { u, v } = worldToMask(0, 0, PROJECT_FIELD, size);
    expect(u).toBe(512);
    expect(v).toBe(512);
  });

  it('maps bounding box corners correctly for PROJECT_FIELD', () => {
    const size = 1024;
    const minX = -(PROJECT_FIELD.rx + 3);
    const maxX = PROJECT_FIELD.rx + 3;
    const minZ = -(PROJECT_FIELD.rz + 3);
    const maxZ = PROJECT_FIELD.rz + 3;

    const minCorner = worldToMask(minX, minZ, PROJECT_FIELD, size);
    expect(minCorner.u).toBe(0);
    expect(minCorner.v).toBe(0);

    const maxCorner = worldToMask(maxX, maxZ, PROJECT_FIELD, size);
    expect(maxCorner.u).toBe(1024);
    expect(maxCorner.v).toBe(1024);

    const topRight = worldToMask(maxX, minZ, PROJECT_FIELD, size);
    expect(topRight.u).toBe(1024);
    expect(topRight.v).toBe(0);

    const bottomLeft = worldToMask(minX, maxZ, PROJECT_FIELD, size);
    expect(bottomLeft.u).toBe(0);
    expect(bottomLeft.v).toBe(1024);
  });

  it('maps correctly for HUB_FIELD with fine pointer size (2048)', () => {
    const size = 2048;
    const minX = -(HUB_FIELD.rx + 3);
    const maxX = HUB_FIELD.rx + 3;
    const minZ = -(HUB_FIELD.rz + 3);
    const maxZ = HUB_FIELD.rz + 3;

    const center = worldToMask(0, 0, HUB_FIELD, size);
    expect(center.u).toBe(1024);
    expect(center.v).toBe(1024);

    const minCorner = worldToMask(minX, minZ, HUB_FIELD, size);
    expect(minCorner.u).toBe(0);
    expect(minCorner.v).toBe(0);

    const maxCorner = worldToMask(maxX, maxZ, HUB_FIELD, size);
    expect(maxCorner.u).toBe(2048);
    expect(maxCorner.v).toBe(2048);
  });

  it('maps coordinates linearly across the bounding box', () => {
    const size = 1024;
    const spanX = 2 * (PROJECT_FIELD.rx + 3);
    const quarterX = -(PROJECT_FIELD.rx + 3) + spanX * 0.25;

    const result = worldToMask(quarterX, 0, PROJECT_FIELD, size);
    expect(result.u).toBeCloseTo(256, 5);
    expect(result.v).toBe(512);
  });
});
