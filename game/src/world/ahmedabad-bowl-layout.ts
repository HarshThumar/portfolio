// Every radius of the Ahmedabad bowl, relative to the rope, so the whole stadium scales with it.
export interface TierSpec {
  r0: number;
  y0: number;
  rows: number;
  run: number;
  rise: number;
}

export interface RoofSpec {
  rOuter: number;
  yOuter: number;
  rInner: number;
  yInner: number;
  thick: number;
}

export interface BowlLayout {
  rope: number;
  boardR: number;
  wallR: number;
  lower: TierSpec;
  upper: TierSpec;
  /** Inner face of the upper tier's fascia (also where the concourse deck ends). */
  fasciaR: number;
  fasciaTopY: number;
  backWallR: number;
  outerWallR: number;
  roof: RoofSpec;
  /** Angle of the players' gate, measured like the lathe phi: x = r sin(a), z = r cos(a). */
  gateAngle: number;
  gateHalf: number;
}

/** South-west, as seen from the drive camera (south is +z, west is -x). */
const GATE_ANGLE = -Math.PI / 4;

export function tierTopY(t: TierSpec): number {
  return t.y0 + t.rows * t.rise;
}

export function tierOuterR(t: TierSpec): number {
  return t.r0 + t.rows * t.run;
}

export function createLayout(rope: number): BowlLayout {
  const lower: TierSpec = { r0: rope + 5, y0: 0, rows: 12, run: 1.0, rise: 0.6 };
  const fasciaR = tierOuterR(lower) + 0.3;
  const upper: TierSpec = { r0: fasciaR + 3.7, y0: 12.2, rows: 20, run: 0.8, rise: 0.8 };
  const backWallR = tierOuterR(upper) + 0.2;
  return {
    rope,
    boardR: rope + 3.2,
    wallR: rope + 3.7,
    lower,
    upper,
    fasciaR,
    fasciaTopY: upper.y0,
    backWallR,
    outerWallR: backWallR + 1.5,
    roof: {
      rOuter: backWallR + 4.6,
      yOuter: 34,
      rInner: rope + 26,
      yInner: 31.8,
      thick: 0.8
    },
    gateAngle: GATE_ANGLE,
    gateHalf: 0.15
  };
}

/** Height of the roof's top surface at radius r. */
export function roofTopY(roof: RoofSpec, r: number): number {
  const t = (r - roof.rInner) / (roof.rOuter - roof.rInner);
  return roof.yInner + t * (roof.yOuter - roof.yInner);
}

/** Shortest signed difference between two angles. */
export function angleDiff(a: number, b: number): number {
  const d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) return d - Math.PI * 2;
  if (d < -Math.PI) return d + Math.PI * 2;
  return d;
}
