import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { rotateX, rotateZ, translate } from '@jscad/modeling/src/operations/transforms';
import { cuboid, cylinder } from '@jscad/modeling/src/primitives';
import { degToRad } from '@jscad/modeling/src/utils';

import type { CableClamp, Params } from '../params';

export const cableClampBase = (clamp: CableClamp): Geom3 => {
  const span = Math.max(clamp.length, clamp.mountOuterDiameter);
  const outerRadius = Math.max(clamp.mountOuterDiameter / 2, 1);
  const screwRadius = Math.min(Math.max(clamp.mountScrewDiameter / 2, 0.4), outerRadius - 0.4);
  const postHeight = Math.max(clamp.mountHeight, 1);
  const saddleHeight = Math.min(Math.max(clamp.wallHeight, 0.5), postHeight);
  const thickness = Math.max(clamp.wallThickness, 1);

  const leftPost = cylinder({
    center: [0, -span / 2, postHeight / 2],
    height: postHeight,
    radius: outerRadius,
    segments: 32,
  });

  const rightPost = cylinder({
    center: [0, span / 2, postHeight / 2],
    height: postHeight,
    radius: outerRadius,
    segments: 32,
  });

  const saddle = cuboid({
    center: [0, 0, saddleHeight / 2],
    size: [thickness, span, saddleHeight],
  });

  const baseBodies: Geom3[] = [leftPost, saddle, rightPost];

  const hasRidges = clamp.ridges !== false && postHeight > saddleHeight;
  if (hasRidges) {
    const numRidges = Math.max(1, Math.min(clamp.ridgeCount ?? 2, 4));
    const innerSpan = Math.max(1, span - outerRadius * 2);
    const ridgeHeight = Math.min(0.6, (postHeight - saddleHeight) * 0.4);
    const ridgeWidth = Math.min(0.8, thickness / (numRidges * 2));

    for (let i = 0; i < numRidges; i++) {
      const xPos = numRidges === 1 ? 0 : -thickness / 2 + (thickness * (i + 0.5)) / numRidges;
      const zPos = saddleHeight + ridgeHeight / 2;
      baseBodies.push(
        cuboid({
          center: [xPos, 0, zPos],
          size: [ridgeWidth, innerSpan, ridgeHeight],
        }),
      );
    }
  }

  const leftHole = cylinder({
    center: [0, -span / 2, postHeight / 2],
    height: postHeight + 0.2,
    radius: screwRadius,
    segments: 24,
  });

  const rightHole = cylinder({
    center: [0, span / 2, postHeight / 2],
    height: postHeight + 0.2,
    radius: screwRadius,
    segments: 24,
  });

  return subtract(union(baseBodies), union(leftHole, rightHole));
};

export const cableClampTop = (clamp: CableClamp): Geom3 => {
  const span = Math.max(clamp.length, clamp.mountOuterDiameter);
  const outerRadius = Math.max(clamp.mountOuterDiameter / 2, 1);
  const clearanceRadius = Math.min(Math.max(clamp.topScrewDiameter / 2, 0.5), outerRadius - 0.4);
  const topHeight = Math.max(clamp.topHeight, 0.8);
  const thickness = Math.max(clamp.wallThickness, 1);

  const leftLobe = cylinder({
    center: [0, -span / 2, topHeight / 2],
    height: topHeight,
    radius: outerRadius,
    segments: 32,
  });

  const rightLobe = cylinder({
    center: [0, span / 2, topHeight / 2],
    height: topHeight,
    radius: outerRadius,
    segments: 32,
  });

  const bridge = cuboid({
    center: [0, 0, topHeight / 2],
    size: [thickness, span, topHeight],
  });

  const topBodies: Geom3[] = [leftLobe, bridge, rightLobe];

  if (clamp.ridges !== false) {
    const numRidges = Math.max(1, Math.min(clamp.ridgeCount ?? 2, 4));
    const innerSpan = Math.max(1, span - outerRadius * 2);
    const ridgeHeight = 0.5;
    const ridgeWidth = Math.min(0.8, thickness / (numRidges * 2));

    for (let i = 0; i < numRidges; i++) {
      const xPos = numRidges === 1 ? 0 : -thickness / 2 + (thickness * (i + 0.5)) / numRidges;
      topBodies.push(
        cuboid({
          center: [xPos, 0, topHeight + ridgeHeight / 2],
          size: [ridgeWidth, innerSpan, ridgeHeight],
        }),
      );
    }
  }

  const leftHole = cylinder({
    center: [0, -span / 2, topHeight / 2],
    height: topHeight + 2,
    radius: clearanceRadius,
    segments: 24,
  });

  const rightHole = cylinder({
    center: [0, span / 2, topHeight / 2],
    height: topHeight + 2,
    radius: clearanceRadius,
    segments: 24,
  });

  return subtract(union(topBodies), union(leftHole, rightHole));
};

export const cableClampTops = (params: Params, spacing?: number): Geom3 | null => {
  const clamps = params.cableClamps ?? [];
  if (clamps.length === 0) {
    return null;
  }
  if (clamps.length === 1) {
    return cableClampTop(clamps[0]);
  }

  const maxThickness = Math.max(
    ...clamps.map((c) => Math.max(c.wallThickness, c.mountOuterDiameter)),
  );
  const step = spacing ?? Math.max(12, maxThickness + 6);
  const count = clamps.length;
  const parts: Geom3[] = clamps.map((c, i) =>
    translate([(i - (count - 1) / 2) * step, 0, 0], cableClampTop(c)),
  );

  return union(parts);
};

export const cableClampsOnBase = (params: Params): Geom3 | null => {
  const clamps = (params.cableClamps ?? []).filter((c) => (c.surface ?? 'bottom') === 'bottom');
  if (clamps.length === 0) {
    return null;
  }

  const { width, length, floor, wall, waterProof, insertThickness, insertClearance, lidScrews } =
    params;
  const innerWall = waterProof ? wall * 2 + insertClearance * 2 + insertThickness : wall;
  const baseFloor = lidScrews ? floor : innerWall;

  const geometries: Geom3[] = clamps.map((c) => {
    const raw = cableClampBase(c);
    const rotated = c.rotation ? rotateZ(degToRad(c.rotation), raw) : raw;
    return translate([width / 2 - c.x, length / 2 - c.y, baseFloor], rotated);
  });

  return geometries.length === 1 ? geometries[0] : union(geometries);
};

export const cableClampTopsOnBase = (params: Params): Geom3 | null => {
  const clamps = (params.cableClamps ?? []).filter((c) => (c.surface ?? 'bottom') === 'bottom');
  if (clamps.length === 0) {
    return null;
  }

  const { width, length, floor, wall, waterProof, insertThickness, insertClearance, lidScrews } =
    params;
  const innerWall = waterProof ? wall * 2 + insertClearance * 2 + insertThickness : wall;
  const baseFloor = lidScrews ? floor : innerWall;

  const geometries: Geom3[] = clamps.map((c) => {
    const rawTop = cableClampTop(c);
    const placed = translate([0, 0, c.mountHeight], rawTop);
    const rotated = c.rotation ? rotateZ(degToRad(c.rotation), placed) : placed;
    return translate([width / 2 - c.x, length / 2 - c.y, baseFloor], rotated);
  });

  return geometries.length === 1 ? geometries[0] : union(geometries);
};

export const cableClampsOnLid = (params: Params): Geom3 | null => {
  const clamps = (params.cableClamps ?? []).filter((c) => c.surface === 'top');
  if (clamps.length === 0) {
    return null;
  }

  const { width, length, roof, insertHeight } = params;
  const lidZ = roof + insertHeight;

  const geometries: Geom3[] = clamps.map((c) => {
    const raw = cableClampBase(c);
    const inverted = rotateX(degToRad(180), raw);
    const rotated = c.rotation ? rotateZ(degToRad(c.rotation), inverted) : inverted;
    return translate([width / 2 - c.x, length / 2 - c.y, lidZ], rotated);
  });

  return geometries.length === 1 ? geometries[0] : union(geometries);
};

export const cableClamps = (params: Params): Geom3 | null => {
  const baseClamps = cableClampsOnBase(params);
  const baseTops = cableClampTopsOnBase(params);
  const lidClamps = cableClampsOnLid(params);

  const parts: Geom3[] = [];
  if (baseClamps) parts.push(baseClamps);
  if (baseTops) parts.push(baseTops);
  if (lidClamps) parts.push(lidClamps);

  if (parts.length === 0) {
    return null;
  }
  return parts.length === 1 ? parts[0] : union(parts);
};
