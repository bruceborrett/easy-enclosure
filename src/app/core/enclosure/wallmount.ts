import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { hull } from '@jscad/modeling/src/operations/hulls';
import { mirrorX, rotateY, translate } from '@jscad/modeling/src/operations/transforms';
import { cube, cuboid, cylinder } from '@jscad/modeling/src/primitives';

import { Params } from '../params';

const SCREWCLEARANCE = 2;
const RIDGEWIDTH = 2;
const FLOOR = 2;

export const flange = (screwDiameter: number) => {
  const outerWidth = screwDiameter + SCREWCLEARANCE * 2 + RIDGEWIDTH * 2;
  const innerWidth = screwDiameter + SCREWCLEARANCE * 2;

  const outer = hull(
    cuboid({
      size: [outerWidth / 2, outerWidth, outerWidth],
    }),
    translate(
      [-(outerWidth / 2), 0, 0],
      cylinder({
        height: outerWidth,
        radius: outerWidth / 2,
      }),
    ),
  );

  const inner = hull(
    cuboid({
      size: [innerWidth / 2, innerWidth, innerWidth],
    }),
    translate(
      [-(innerWidth / 2) - SCREWCLEARANCE * 2, 0, 0],
      cylinder({
        height: innerWidth,
        radius: innerWidth / 2,
      }),
    ),
  );

  return subtract(
    outer,
    translate([RIDGEWIDTH, 0, FLOOR], inner),
    translate([-outerWidth, 0, outerWidth], rotateY(45, cube({ size: outerWidth * 2 }))),
    translate([-outerWidth / 2, 0, 0], cylinder({ height: outerWidth, radius: screwDiameter / 2 })),
  );
};

export const flanges = (params: Params) => {
  const { length, width, cornerRadius, wallMountScrewDiameter, wallMountCount } = params;
  const outerWidth = wallMountScrewDiameter + SCREWCLEARANCE * 2 + RIDGEWIDTH * 2;
  const cornerSpacing = cornerRadius + outerWidth / 2;
  const z = outerWidth / 2;

  const yPositions = wallMountCount === 2 ? [length / 2] : [cornerSpacing, length - cornerSpacing];

  const left = yPositions.map((y) =>
    translate([-RIDGEWIDTH, y, z], flange(wallMountScrewDiameter)),
  );
  const right = yPositions.map((y) =>
    translate([width + RIDGEWIDTH, y, z], mirrorX(flange(wallMountScrewDiameter))),
  );

  return union(...left, ...right);
};
