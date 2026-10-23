import { rotate, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';
import { cuboid, cylinder } from '@jscad/modeling/src/primitives';
import { intersect, union } from '@jscad/modeling/src/operations/booleans';

import { Params } from '../params';
import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { Vec3 } from '@jscad/modeling/src/maths/types';
import { Surface, SURFACES } from '.';

const TOP_HOLE_DEPTH_TOLERANCE = 0.2;
const HOLE_DEPTH_OVERCUT = 1;

export const holes = (
  params: Params,
  surfacesFilter: Surface[] = ['bottom', 'left', 'right', 'back', 'front'],
) => {
  const {
    length,
    width,
    height,
    roof,
    floor,
    wall,
    insertHeight,
    insertThickness,
    insertClearance,
    holes: holeParams,
  } = params;

  let result: Geom3[] = [];
  SURFACES.forEach((surface) => {
    const surfaceHoles = holeParams.filter((spec) => {
      if (surfacesFilter.includes(surface) && spec.surface === surface) {
        return spec;
      } else {
        return false;
      }
    });

    surfaceHoles.forEach((hole, i) => {
      let x: number;
      let y: number;
      let z: number;
      let rot: Vec3;

      const totalWallThickness = insertThickness + insertClearance * 2 + wall * 2;
      let holeDepth = totalWallThickness + HOLE_DEPTH_OVERCUT * 2;

      if (surface === 'front') {
        y = length - totalWallThickness / 2;
        x = width / 2 - hole.y;
        z = height / 2 + hole.x;
        rot = [degToRad(90), 0, 0];
      } else if (surface === 'right') {
        x = totalWallThickness / 2;
        y = length / 2 - hole.y;
        z = height / 2 + hole.x;
        if (hole.shape === 'circle') {
          rot = [0, degToRad(90), 0];
        } else {
          rot = [degToRad(90), 0, degToRad(90)];
        }
      } else if (surface === 'back') {
        y = totalWallThickness / 2;
        x = width / 2 - hole.y;
        z = height / 2 + hole.x;
        rot = [degToRad(90), 0, 0];
      } else if (surface === 'left') {
        x = width - totalWallThickness / 2;
        y = length / 2 - hole.y;
        z = height / 2 + hole.x;
        if (hole.shape === 'circle') {
          rot = [0, degToRad(90), 0];
        } else {
          rot = [degToRad(90), 0, degToRad(90)];
        }
      } else if (surface === 'bottom' || surface === 'top') {
        y = length / 2 - hole.x;
        x = width / 2 - hole.y;
        z = 0;
        if (surface === 'top') {
          holeDepth = roof + insertHeight + TOP_HOLE_DEPTH_TOLERANCE;
          z = holeDepth / 2;
        } else if (surface === 'bottom') {
          holeDepth = floor + HOLE_DEPTH_OVERCUT * 2;
          z = floor / 2;
        }
        rot = [0, 0, 0];
      } else {
        throw new Error(`Invalid surface: ${surface}`);
      }

      if (hole.shape === 'square') {
        result.push(
          translate(
            [x, y, z],
            rotate(
              rot,
              cuboid({
                size: [hole.width, hole.width, holeDepth],
              }),
            ),
          ),
        );
      } else if (hole.shape === 'rectangle') {
        result.push(
          translate(
            [x, y, z],
            rotate(
              rot,
              cuboid({
                size: [hole.width, hole.length, holeDepth],
              }),
            ),
          ),
        );
      } else if (hole.shape === 'circle') {
        result.push(
          translate(
            [x, y, z],
            rotate(
              rot,
              cylinder({
                radius: hole.diameter / 2,
                height: holeDepth,
              }),
            ),
          ),
        );
      } else if (hole.shape === 'double-d') {
        const diameter = Math.max(0.1, hole.diameter);
        const radius = diameter / 2;
        const flatW =
          hole.flatWidth !== undefined && hole.flatWidth > 0
            ? Math.min(hole.flatWidth, diameter)
            : diameter * 0.9;
        let cutter = cylinder({
          radius,
          height: holeDepth,
        });
        if (flatW < diameter) {
          const flatBox = cuboid({
            size: [diameter * 2, flatW, holeDepth + 2],
          });
          cutter = intersect(cutter, flatBox);
        }
        if (hole.rotation) {
          cutter = rotate([0, 0, degToRad(hole.rotation)], cutter);
        }
        result.push(translate([x, y, z], rotate(rot, cutter)));
      }
    });
  });

  return union(result);
};
