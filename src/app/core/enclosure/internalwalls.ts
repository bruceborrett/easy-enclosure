import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { union } from '@jscad/modeling/src/operations/booleans';
import { rotateZ, translate } from '@jscad/modeling/src/operations/transforms';
import { cuboid } from '@jscad/modeling/src/primitives';

import { InternalWall, Params } from '../params';

export const internalWall = (wallParams: InternalWall) => {
  const wall = cuboid({
    size: [wallParams.thickness, wallParams.length, wallParams.height],
  });

  return rotateZ((wallParams.rotation * Math.PI) / 180, wall);
};

export const internalWalls = (params: Params) => {
  const { internalWalls, width, length, floor } = params;

  const walls: Geom3[] = [];

  internalWalls.forEach((wall) => {
    const z = floor + wall.height / 2;
    walls.push(translate([width / 2 - wall.x, length / 2 - wall.y, z], internalWall(wall)));
  });

  return union(walls);
};
