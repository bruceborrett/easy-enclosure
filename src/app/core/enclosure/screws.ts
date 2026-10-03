import { union } from '@jscad/modeling/src/operations/booleans';
import { cylinder, cylinderElliptic } from '@jscad/modeling/src/primitives';
import { translate } from '@jscad/modeling/src/operations/transforms';
import { Params } from '../params';

export const getScrewDiameterMax = (params: Params): number => {
  const {
    baseLidScrewDiameter,
    lidScrewDiameter,
    lidScrewHoleType,
    lidScrewNutWidth,
    lidScrewRecessType,
    lidScrewRecessDiameter,
  } = params;
  const nutDiameter = lidScrewHoleType === 'nut-pocket' ? (lidScrewNutWidth / Math.sqrt(3)) * 2 : 0;
  const recessDiameter =
    lidScrewRecessType && lidScrewRecessType !== 'none' ? lidScrewRecessDiameter : 0;
  return Math.max(baseLidScrewDiameter, lidScrewDiameter, nutDiameter, recessDiameter);
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
  const isBlindHole = depth !== undefined && depth > 0;
  const effectiveDepth = isBlindHole ? Math.min(depth, height) : undefined;

  const cylinderHeight = isBlindHole ? effectiveDepth! + tolerance : height + tolerance * 2;
  const zCenter = isBlindHole ? height - (effectiveDepth! - tolerance) / 2 : height / 2;

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

export const lidScrewRecesses = (params: Params) => {
  const {
    length,
    width,
    roof,
    lidScrewDiameter,
    lidScrewRecessType,
    lidScrewRecessDiameter,
    lidScrewRecessDepth,
  } = params;
  const tolerance = 0.2;
  const offset = getScrewOffset(params);

  if (lidScrewRecessType === 'counterbore') {
    const effectiveDepth = Math.max(0.2, Math.min(lidScrewRecessDepth, roof - 0.4));
    const height = effectiveDepth + tolerance;
    const zCenter = (effectiveDepth - tolerance) / 2;
    const cb = cylinder({ radius: lidScrewRecessDiameter / 2, height });
    return union(
      translate([offset, offset, zCenter], cb),
      translate([width - offset, offset, zCenter], cb),
      translate([offset, length - offset, zCenter], cb),
      translate([width - offset, length - offset, zCenter], cb),
    );
  }

  if (lidScrewRecessType === 'countersunk') {
    const coneDepth = (lidScrewRecessDiameter - lidScrewDiameter) / 2;
    const totalHeight = coneDepth + tolerance;
    const topRadius = lidScrewRecessDiameter / 2 + tolerance;
    const botRadius = lidScrewDiameter / 2;
    const zCenter = (coneDepth - tolerance) / 2;

    const cs = cylinderElliptic({
      startRadius: [topRadius, topRadius],
      endRadius: [botRadius, botRadius],
      height: totalHeight,
    });
    return union(
      translate([offset, offset, zCenter], cs),
      translate([width - offset, offset, zCenter], cs),
      translate([offset, length - offset, zCenter], cs),
      translate([width - offset, length - offset, zCenter], cs),
    );
  }

  return null;
};
