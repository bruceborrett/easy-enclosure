import { Params } from '../params';

import { cloverFrame } from './utils';
import { getScrewOffset } from './screws';

import { translate } from '@jscad/modeling/src/operations/transforms';

export const getSealReliefRadius = (params: Params): number => {
  const { wall, insertThickness, insertClearance } = params;
  const screwOffset = getScrewOffset(params);
  // Ensure the seal channel corner cutout does not cut through into the inner cavity.
  // The cavity begins at `_wall = wall * 2 + insertClearance * 2 + insertThickness`.
  // To ensure the cutout (which starts at `wall`) never breaches the cavity wall,
  // the relief radius is clamped to never exceed `_wall - wall`.
  const maxAllowedRelief = insertThickness + insertClearance * 2 + wall;
  return Math.min(screwOffset, maxAllowedRelief);
};

export const waterProofSealCutout = (params: Params) => {
  const {
    length,
    width,
    height,
    wall,
    insertThickness,
    insertHeight,
    sealThickness,
    insertClearance,
  } = params;

  const relief = getSealReliefRadius(params);
  return translate(
    [wall, wall, height - (insertHeight + sealThickness)],
    cloverFrame(
      width - wall * 2,
      length - wall * 2,
      insertHeight + sealThickness + insertClearance,
      insertThickness + insertClearance * 2,
      relief,
    ),
  );
};

export const waterProofSeal = (params: Params) => {
  const { length, width, wall, sealThickness, insertThickness, insertClearance } = params;
  const relief = getSealReliefRadius(params);
  return cloverFrame(
    width - wall * 2 - insertClearance * 2,
    length - wall * 2 - insertClearance * 2,
    sealThickness,
    insertThickness,
    relief,
  );
};
