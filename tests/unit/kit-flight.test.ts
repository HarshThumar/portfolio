import { describe, expect, it } from 'vitest';
import * as THREE from 'three/webgpu';
import { readFileSync, writeFileSync } from 'node:fs';
import { createKitPieces } from '../../game/src/opening/kit-models';
import flight from '../../game/src/opening/kit-flight.json';

// The opening's kit flight is baked in Blender from the kit's bounding boxes
// (assets-src/opening/kit-bounds.json). These checks fail when the models change and the bake
// is out of date: then run UPDATE_KIT_BOUNDS=1 on this test, and npm run bake:opening.

const BOUNDS_FILE = 'assets-src/opening/kit-bounds.json';

function currentBounds(): Array<{ kind: string; centre: number[]; size: number[] }> {
  return createKitPieces().map((p) => {
    const box = new THREE.Box3().setFromObject(p.object);
    const round = (v: THREE.Vector3): number[] => v.toArray().map((n) => +n.toFixed(3));
    return {
      kind: p.kind,
      centre: round(box.getCenter(new THREE.Vector3())),
      size: round(box.getSize(new THREE.Vector3()))
    };
  });
}

describe('baked kit flight', () => {
  it('was baked from the kit as it is now', () => {
    const now = currentBounds();
    if (process.env.UPDATE_KIT_BOUNDS) {
      const note = JSON.parse(readFileSync(BOUNDS_FILE, 'utf-8')).note as string;
      writeFileSync(BOUNDS_FILE, JSON.stringify({ note, pieces: now }, null, 2) + '\n');
    }
    const baked = JSON.parse(readFileSync(BOUNDS_FILE, 'utf-8')).pieces as typeof now;
    // Gloves vary their fingers a little each time, so sizes match to the centimetre.
    const near = (a: number[], b: number[]): void =>
      a.forEach((v, i) => expect(Math.abs(v - b[i]!)).toBeLessThan(0.02));
    expect(baked.map((p) => p.kind)).toEqual(now.map((p) => p.kind));
    expect(flight.kinds).toEqual(now.map((p) => p.kind));
    now.forEach((p, i) => {
      near(baked[i]!.centre, p.centre);
      near(baked[i]!.size, p.size);
      near(flight.centres[i]!, p.centre);
    });
  });

  it('ends with the kit piled up inside the giant ball', () => {
    const last = flight.frames[flight.frames.length - 1]!;
    for (const p of last) expect(Math.hypot(p[0]!, p[1]!, p[2]!)).toBeLessThan(4);
  });
});
