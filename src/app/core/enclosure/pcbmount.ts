import { geom2 } from '@jscad/modeling/src/geometries';
import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import measureBoundingBox from '@jscad/modeling/src/measurements/measureBoundingBox';
import { intersect, subtract, union } from '@jscad/modeling/src/operations/booleans';
import { extrudeRotate } from '@jscad/modeling/src/operations/extrusions';
import { rotateX, rotateY, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';

import type { Surface } from '.';
import type { Params, PCBMount } from '../params';
import { bottomChamferTool, roundedCube } from './utils';

type Vec3Tuple = [number, number, number];

export const MIN_MOUNT_FILLET = 0.2;

export const calculateMountFilletSize = (outerDiameter: number, height: number): number => {
  if (outerDiameter <= 0 || height <= 0) {
    return 0;
  }
  const proportionalSize = outerDiameter / 3;
  const maxAllowed = height * 0.45;
  if (maxAllowed < MIN_MOUNT_FILLET || proportionalSize < MIN_MOUNT_FILLET) {
    return 0;
  }
  return Math.min(proportionalSize, maxAllowed);
};

export const pcbMount = (mountParams: PCBMount, _params?: Partial<Params>): Geom3 => {
  const h = Math.max(0.5, mountParams.height);
  const ro = Math.max(mountParams.outerDiameter / 2, 0.5);
  const rawScrew = Math.max(0, mountParams.screwDiameter / 2);
  const ri = Math.min(rawScrew, ro - 0.2);

  const hasChamfer =
    mountParams.chamfer !== false &&
    (mountParams as { filletStyle?: string }).filletStyle !== 'none';
  const fillet = hasChamfer ? calculateMountFilletSize(mountParams.outerDiameter, h) : 0;

  const points: [number, number][] = [];

  points.push([ri, 0]);

  if (fillet > 0) {
    points.push([ro + fillet, 0]);

    const cx = ro + fillet;
    const cy = fillet;
    const steps = 8;
    for (let i = 1; i < steps; i++) {
      const theta = (3 * Math.PI) / 2 - (Math.PI / 2) * (i / steps);
      points.push([cx + fillet * Math.cos(theta), cy + fillet * Math.sin(theta)]);
    }
    points.push([ro, fillet]);
  } else {
    points.push([ro, 0]);
  }

  points.push([ro, h]);
  points.push([ri, h]);

  const profile = geom2.fromPoints(points);
  const revolved = extrudeRotate({ segments: 32 }, profile);

  return translate([0, 0, -h / 2], revolved);
};

const placeBaseMount = (mount: PCBMount, params: Params): Geom3 => {
  const { length, width, height, floor, wall, waterProof, insertThickness, insertClearance } =
    params;
  const surface: Surface = mount.surface ?? 'bottom';
  const mountBody = pcbMount(mount, params);
  const innerWall = waterProof ? wall * 2 + insertClearance * 2 + insertThickness : wall;
  const baseFloor = params.lidScrews ? floor : innerWall;
  const bottomX = width / 2 - mount.x;
  const bottomY = length / 2 - mount.y;
  const wallX = width / 2 - mount.x;
  const wallY = length / 2 - mount.x;
  const wallZ = height / 2 + mount.y;

  if (surface === 'bottom') {
    return translate([bottomX, bottomY, baseFloor + mount.height / 2], mountBody);
  }

  if (surface === 'front') {
    return translate(
      [wallX, length - innerWall - mount.height / 2, wallZ],
      rotateX(degToRad(-90), mountBody),
    );
  }

  if (surface === 'back') {
    return translate(
      [wallX, innerWall + mount.height / 2, wallZ],
      rotateX(degToRad(90), mountBody),
    );
  }

  if (surface === 'right') {
    return translate(
      [innerWall + mount.height / 2, wallY, wallZ],
      rotateY(degToRad(-90), mountBody),
    );
  }

  return translate(
    [width - innerWall - mount.height / 2, wallY, wallZ],
    rotateY(degToRad(90), mountBody),
  );
};

const placeLidMount = (mount: PCBMount, params: Params): Geom3 => {
  const { length, width, roof } = params;
  return translate(
    [width / 2 - mount.x, length / 2 - mount.y, roof + mount.height / 2],
    pcbMount(mount, params),
  );
};

const buildMountUnion = (mounts: Geom3[]): Geom3 | null => {
  if (mounts.length === 0) {
    return null;
  }

  return mounts.length === 1 ? mounts[0] : union(mounts);
};

const isInsideBaseBounds = (bbox: [Vec3Tuple, Vec3Tuple], params: Params): boolean => {
  const [min, max] = bbox;
  const r = params.cornerRadius;
  const bedChamfer = params.baseBedChamfer > 0 ? params.baseBedChamfer : 0;
  return (
    min[0] >= r &&
    max[0] <= params.width - r &&
    min[1] >= r &&
    max[1] <= params.length - r &&
    min[2] >= bedChamfer &&
    max[2] <= params.height
  );
};

const clipBaseMounts = (mounts: Geom3, params: Params): Geom3 | null => {
  const bbox = measureBoundingBox(mounts) as [Vec3Tuple, Vec3Tuple];
  if (isInsideBaseBounds(bbox, params)) {
    return mounts;
  }

  const floorZ = params.lidScrews
    ? params.floor
    : params.waterProof
      ? params.wall * 2 + params.insertClearance * 2 + params.insertThickness
      : params.wall;
  const maxBottomZ = params.pcbMounts
    .filter((m) => (m.surface ?? 'bottom') === 'bottom')
    .reduce((acc, m) => Math.max(acc, floorZ + m.height), params.height);

  let envelope = roundedCube(params.width, params.length, maxBottomZ, params.cornerRadius);
  if (params.baseBedChamfer > 0) {
    envelope = subtract(
      envelope,
      bottomChamferTool(params.width, params.length, params.baseBedChamfer, params.cornerRadius),
    );
  }

  const clipped = intersect(envelope, mounts);
  return clipped.polygons.length > 0 ? clipped : null;
};

const isInsideLidBounds = (bbox: [Vec3Tuple, Vec3Tuple], params: Params): boolean => {
  const [min, max] = bbox;
  const r = params.cornerRadius;
  return min[0] >= r && max[0] <= params.width - r && min[1] >= r && max[1] <= params.length - r;
};

const clipLidMounts = (mounts: Geom3, params: Params): Geom3 | null => {
  const bbox = measureBoundingBox(mounts) as [Vec3Tuple, Vec3Tuple];
  if (isInsideLidBounds(bbox, params)) {
    return mounts;
  }

  const maxZ = Math.max(bbox[1][2] + 1, params.roof + 10);
  const envelope = roundedCube(params.width, params.length, maxZ, params.cornerRadius);
  const clipped = intersect(envelope, mounts);
  return clipped.polygons.length > 0 ? clipped : null;
};

export const pcbMountsOnBase = (params: Params): Geom3 | null => {
  const mounts = params.pcbMounts
    .filter((mount) => (mount.surface ?? 'bottom') !== 'top')
    .map((mount) => placeBaseMount(mount, params));

  const united = buildMountUnion(mounts);
  if (!united) {
    return null;
  }

  return clipBaseMounts(united, params);
};

export const pcbMountsOnLid = (params: Params): Geom3 | null => {
  const mounts = params.pcbMounts
    .filter((mount) => (mount.surface ?? 'bottom') === 'top')
    .map((mount) => placeLidMount(mount, params));

  const united = buildMountUnion(mounts);
  if (!united) {
    return null;
  }

  return clipLidMounts(united, params);
};

export const pcbMounts = (params: Params): Geom3 | null => {
  const baseMounts = pcbMountsOnBase(params);
  const lidMounts = pcbMountsOnLid(params);
  const mounts = [baseMounts, lidMounts].filter((item): item is Geom3 => item !== null);

  if (mounts.length === 0) {
    return null;
  }

  return mounts.length === 1 ? mounts[0] : union(mounts);
};
