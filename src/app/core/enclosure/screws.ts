import { union } from '@jscad/modeling/src/operations/booleans';
import { cylinder } from '@jscad/modeling/src/primitives';
import { translate } from '@jscad/modeling/src/operations/transforms';
import { Params } from '../params';

export const getScrewDiameterMax = (params: Params): number => {
  const { baseLidScrewDiameter, lidScrewDiameter, lidScrewHoleType, lidScrewNutWidth } = params;
  const nutDiameter = lidScrewHoleType === 'nut-pocket' ? (lidScrewNutWidth / Math.sqrt(3)) * 2 : 0;
  return Math.max(baseLidScrewDiameter, lidScrewDiameter, nutDiameter);
};

export const getScrewOffset = (params: Params): number => {
  const diameterMax = getScrewDiameterMax(params);
  return diameterMax / 2 + params.cornerRadius / 4 + params.wall / 2;
};

export const screws = (
  length: number,
  width: number,
  height: number,
  offset: number,
  diameter: number,
  depth?: number,
) => {
  const tolerance = 0.2;
  const isBlindHole = depth !== undefined && depth > 0 && depth < height;

  const cylinderHeight = isBlindHole ? depth + tolerance : height + tolerance * 2;
  const zCenter = isBlindHole ? height - (depth - tolerance) / 2 : height / 2;

  const screwCylinder = cylinder({ radius: diameter / 2, height: cylinderHeight });
  return union(
    translate([offset, offset, zCenter], screwCylinder),
    translate([width - offset, offset, zCenter], screwCylinder),
    translate([offset, length - offset, zCenter], screwCylinder),
    translate([width - offset, length - offset, zCenter], screwCylinder),
  );
};

export const nutPockets = (
  length: number,
  width: number,
  offset: number,
  nutWidth: number,
  nutDepth: number,
) => {
  const tolerance = 0.2;
  const radius = nutWidth / Math.sqrt(3);
  const cylinderHeight = nutDepth + tolerance;
  const zCenter = (nutDepth - tolerance) / 2;

  const nutCylinder = cylinder({
    radius,
    height: cylinderHeight,
    segments: 6,
  });

  return union(
    translate([offset, offset, zCenter], nutCylinder),
    translate([width - offset, offset, zCenter], nutCylinder),
    translate([offset, length - offset, zCenter], nutCylinder),
    translate([width - offset, length - offset, zCenter], nutCylinder),
  );
};
