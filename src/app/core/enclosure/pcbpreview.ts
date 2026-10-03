import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import measureVolume from '@jscad/modeling/src/measurements/measureVolume';
import { intersect, union } from '@jscad/modeling/src/operations/booleans';
import { translate } from '@jscad/modeling/src/operations/transforms';
import { cuboid } from '@jscad/modeling/src/primitives';

import type { Params } from '../params';
import { base } from './base';
import { cableClampsOnBase } from './clamp';
import { internalWalls } from './internalwalls';

export type PCBCollisionResult = {
  collides: boolean;
  hitsWalls: boolean;
  hitsCeiling: boolean;
  overlapVolume: number;
};

export const cavityFloorZ = (params: Params): number => {
  const { wall, waterProof, insertThickness, insertClearance, lidScrews, floor } = params;
  const innerWall = waterProof ? wall * 2 + insertClearance * 2 + insertThickness : wall;
  return lidScrews ? floor : innerWall;
};

export const pcbRestZ = (params: Params): number => {
  const floorZ = cavityFloorZ(params);
  const bottomMounts = params.pcbMounts.filter((m) => (m.surface ?? 'bottom') === 'bottom');
  if (bottomMounts.length === 0) {
    return floorZ;
  }
  const maxHeight = bottomMounts.reduce((acc, m) => Math.max(acc, m.height), 0);
  return floorZ + maxHeight;
};

export const pcbCenterXY = (params: Params): [number, number] => {
  const { width, length, pcbPreview } = params;
  return [width / 2 + pcbPreview.x, length / 2 + pcbPreview.y];
};

export const pcbBoard = (params: Params): Geom3 => {
  const { pcbPreview } = params;
  const [cx, cy] = pcbCenterXY(params);
  const restZ = pcbRestZ(params);
  return translate(
    [cx, cy, restZ + pcbPreview.thickness / 2],
    cuboid({ size: [pcbPreview.width, pcbPreview.length, pcbPreview.thickness] }),
  );
};

export const pcbComponentZone = (params: Params): Geom3 | null => {
  const { pcbPreview } = params;
  if (pcbPreview.componentHeight <= 0) {
    return null;
  }
  const [cx, cy] = pcbCenterXY(params);
  const restZ = pcbRestZ(params);
  return translate(
    [cx, cy, restZ + pcbPreview.thickness + pcbPreview.componentHeight / 2],
    cuboid({ size: [pcbPreview.width, pcbPreview.length, pcbPreview.componentHeight] }),
  );
};

const SHRINK = 0.3;

const erodedOccupied = (params: Params): Geom3 => {
  const { pcbPreview } = params;
  const [cx, cy] = pcbCenterXY(params);
  const restZ = pcbRestZ(params);

  const w = Math.max(pcbPreview.width - SHRINK * 2, 0.1);
  const l = Math.max(pcbPreview.length - SHRINK * 2, 0.1);
  const parts: Geom3[] = [];

  const boardT = Math.max(pcbPreview.thickness - SHRINK * 2, 0.1);
  parts.push(
    translate([cx, cy, restZ + pcbPreview.thickness / 2], cuboid({ size: [w, l, boardT] })),
  );

  if (pcbPreview.componentHeight > SHRINK * 2) {
    const zoneH = pcbPreview.componentHeight - SHRINK * 2;
    parts.push(
      translate(
        [cx, cy, restZ + pcbPreview.thickness + pcbPreview.componentHeight / 2],
        cuboid({ size: [w, l, zoneH] }),
      ),
    );
  }

  return parts.length === 1 ? parts[0] : union(parts);
};

export const pcbCollision = (params: Params, baseSolid?: Geom3): PCBCollisionResult => {
  if (!params.pcbPreview.enabled) {
    return { collides: false, hitsWalls: false, hitsCeiling: false, overlapVolume: 0 };
  }

  const occupied = erodedOccupied(params);

  const obstacles: Geom3[] = [baseSolid ?? base(params)];
  if (params.internalWalls.length > 0) {
    obstacles.push(internalWalls(params));
  }
  if ((params.cableClamps?.length ?? 0) > 0) {
    const clamps = cableClampsOnBase(params);
    if (clamps) {
      obstacles.push(clamps);
    }
  }

  let hitsWalls = false;
  let overlapVolume = 0;
  try {
    const obstacleSolid = obstacles.length === 1 ? obstacles[0] : union(obstacles);
    const overlap = intersect(occupied, obstacleSolid);
    const volume = measureVolume(overlap);
    if (volume > 1) {
      hitsWalls = true;
      overlapVolume = Math.round(volume * 10) / 10;
    }
  } catch {
    hitsWalls = false;
  }

  const restZ = pcbRestZ(params);
  const topZ = restZ + params.pcbPreview.thickness + Math.max(0, params.pcbPreview.componentHeight);
  const hitsCeiling = topZ > params.height + 1e-6;

  return {
    collides: hitsWalls || hitsCeiling,
    hitsWalls,
    hitsCeiling,
    overlapVolume,
  };
};
