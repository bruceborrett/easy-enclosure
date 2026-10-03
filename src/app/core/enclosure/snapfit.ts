import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import { union } from '@jscad/modeling/src/operations/booleans';
import { rotateX, rotateY, scale, translate } from '@jscad/modeling/src/operations/transforms';
import { cuboid, cylinder } from '@jscad/modeling/src/primitives';
import { degToRad } from '@jscad/modeling/src/utils';

import type { Params, SnapFitPreset } from '../params';
import { innerWallInset } from './utils';

export const ENGAGE_RATIO = 0.6;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export type WallId = 'front' | 'back' | 'left' | 'right';

export type Placement = {
  wall: WallId;
  along: 'x' | 'y';
  positions: number[];
};

const bead = (depth: number, height: number, barWidth: number, along: 'x' | 'y'): Geom3 => {
  const cyl = cylinder({ radius: depth, height: barWidth, segments: 24 });
  const base = along === 'x' ? rotateY(degToRad(90), cyl) : rotateX(degToRad(90), cyl);
  const kz = height / (2 * depth);
  return scale([1, 1, kz], base);
};

export const computePlacements = (params: Params): Placement[] => {
  const { snapFit, width: W, length: L, wall, insertClearance, cornerRadius } = params;
  const preset: SnapFitPreset = snapFit.preset ?? 4;
  const p = (snapFit.endPercent ?? 20) / 100;
  const a = wall + insertClearance;
  const margin = a + cornerRadius + snapFit.width / 2 + 1;

  type WallDef = { wall: WallId; along: 'x' | 'y'; D: number };
  let longWalls: WallDef[];
  let shortWalls: WallDef[];
  if (W >= L) {
    longWalls = [
      { wall: 'front', along: 'x', D: W },
      { wall: 'back', along: 'x', D: W },
    ];
    shortWalls = [
      { wall: 'left', along: 'y', D: L },
      { wall: 'right', along: 'y', D: L },
    ];
  } else {
    longWalls = [
      { wall: 'left', along: 'y', D: L },
      { wall: 'right', along: 'y', D: L },
    ];
    shortWalls = [
      { wall: 'front', along: 'x', D: W },
      { wall: 'back', along: 'x', D: W },
    ];
  }

  const result: Placement[] = [];
  const add = (w: WallDef, mode: 'ends' | 'middle') => {
    const u0 = margin;
    const u1 = w.D - margin;
    const mid = (u0 + u1) / 2;
    let positions: number[];
    if (mode === 'middle' || u1 <= u0) {
      positions = [mid];
    } else {
      const lo = clamp(p * w.D, u0, u1);
      const hi = clamp(w.D - p * w.D, u0, u1);
      positions = [lo, hi];
    }
    result.push({ wall: w.wall, along: w.along, positions });
  };

  longWalls.forEach((w) => add(w, 'ends'));
  if (preset === 6) {
    shortWalls.forEach((w) => add(w, 'middle'));
  } else if (preset === 8) {
    shortWalls.forEach((w) => add(w, 'ends'));
  }
  return result;
};

export const lidSnapBumps = (params: Params): Geom3 | null => {
  const { snapFit, length, width, wall, roof, insertHeight, insertClearance } = params;
  if (!snapFit?.enabled) {
    return null;
  }
  const a = wall + insertClearance;
  const z = roof + insertHeight * ENGAGE_RATIO;
  const placements = computePlacements(params);

  const effectiveDepth = Math.min(snapFit.depth, Math.max(0.2, wall * 0.8));

  const parts: Geom3[] = [];
  placements.forEach(({ wall: w, along, positions }) => {
    positions.forEach((pos) => {
      const b = bead(effectiveDepth, snapFit.height, snapFit.width, along);
      let center: [number, number, number];
      if (w === 'front') {
        center = [pos, length - a, z];
      } else if (w === 'back') {
        center = [pos, a, z];
      } else if (w === 'left') {
        center = [width - a, pos, z];
      } else {
        center = [a, pos, z];
      }
      parts.push(translate(center, b));
    });
  });

  return parts.length > 0 ? union(parts) : null;
};

export const baseSnapPockets = (params: Params): Geom3 | null => {
  const { snapFit, length, width, height, insertHeight, wall } = params;
  if (!snapFit?.enabled) {
    return null;
  }

  const innerWall = innerWallInset(params);
  const z = height - insertHeight * ENGAGE_RATIO;

  const effectiveDepth = Math.min(snapFit.depth, Math.max(0.2, wall * 0.8));
  const clr = snapFit.clearance;
  const sAlong = snapFit.width + clr * 2;
  const sz = snapFit.height + clr * 2;
  const groove = effectiveDepth + clr;
  const sThru = groove + 0.5;

  const placements = computePlacements(params);
  const parts: Geom3[] = [];
  placements.forEach(({ wall: w, positions }) => {
    positions.forEach((pos) => {
      let center: [number, number, number];
      let size: [number, number, number];
      if (w === 'front') {
        center = [pos, length - innerWall + groove / 2, z];
        size = [sAlong, sThru, sz];
      } else if (w === 'back') {
        center = [pos, innerWall - groove / 2, z];
        size = [sAlong, sThru, sz];
      } else if (w === 'left') {
        center = [width - innerWall + groove / 2, pos, z];
        size = [sThru, sAlong, sz];
      } else {
        center = [innerWall - groove / 2, pos, z];
        size = [sThru, sAlong, sz];
      }
      parts.push(translate(center, cuboid({ size })));
    });
  });

  return parts.length > 0 ? union(parts) : null;
};
