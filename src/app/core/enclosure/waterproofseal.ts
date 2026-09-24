import { Params } from '../params';

import { cloverFrame } from './utils';
import { getScrewOffset } from './screws';

import { translate } from '@jscad/modeling/src/operations/transforms';

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

  const screwOffset = getScrewOffset(params);
  return translate(
    [wall, wall, height - (insertHeight + sealThickness)],
    cloverFrame(
      width - wall * 2,
      length - wall * 2,
      insertHeight + sealThickness + insertClearance,
      insertThickness + insertClearance * 2,
      screwOffset,
    ),
  );
};

export const waterProofSeal = (params: Params) => {
  const { length, width, wall, sealThickness, insertThickness, insertClearance } = params;
  const screwOffset = getScrewOffset(params);
  return cloverFrame(
    width - wall * 2 - insertClearance * 2,
    length - wall * 2 - insertClearance * 2,
    sealThickness,
    insertThickness,
    screwOffset,
  );
};
