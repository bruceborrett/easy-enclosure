import { booleans, transforms } from '@jscad/modeling';
import { cloverFrame, roundedCube, roundedFrame } from './utils';
import {
  bottomChamferTool,
  cloverOutline,
  lidTopChamferSize,
  roundedOutline,
  topChamferTool,
} from './chamfer';

import { Params } from '../params';
import { getScrewOffset, lidScrewRecesses, screws } from './screws';
import { subtract } from '@jscad/modeling/src/operations/booleans';
import { holes } from './holes';
import { lidSnapBumps } from './snapfit';

const { union } = booleans;
const { translate } = transforms;

export const lid = (params: Params) => {
  const {
    length,
    width,
    wall,
    roof,
    cornerRadius,
    insertThickness,
    insertHeight,
    insertClearance,
    lidScrewDiameter,
    lidScrewRecessType,
  } = params;

  const entities = [];
  const subtracts = [];

  entities.push(roundedCube(width, length, roof, cornerRadius));

  if (params.lidScrews) {
    const screwOffset = getScrewOffset(params);

    entities.push(
      translate(
        [wall + insertClearance, wall + insertClearance, roof],
        cloverFrame(
          width - wall * 2 - insertClearance * 2,
          length - wall * 2 - insertClearance * 2,
          insertHeight,
          insertThickness,
          screwOffset,
        ),
      ),
    );

    subtracts.push(screws(length, width, roof + insertHeight, screwOffset, lidScrewDiameter));

    if (lidScrewRecessType && lidScrewRecessType !== 'none') {
      const recessCutters = lidScrewRecesses(params);
      if (recessCutters) {
        subtracts.push(recessCutters);
      }
    }
  } else {
    entities.push(
      translate(
        [wall + insertClearance, wall + insertClearance, roof],
        roundedFrame(
          width - wall * 2 - insertClearance * 2,
          length - wall * 2 - insertClearance * 2,
          insertHeight,
          insertThickness,
          cornerRadius,
        ),
      ),
    );
  }

  const holeCount = params.holes.filter((v, i) => {
    return v.surface === 'top';
  }).length;

  if (holeCount > 0) {
    subtracts.push(holes(params, ['top']));
  }

  const bumps = lidSnapBumps(params);
  if (bumps) {
    entities.push(bumps);
  }

  let result = subtracts.length > 0 ? subtract(union(entities), union(subtracts)) : union(entities);

  if (params.lidBedChamfer > 0) {
    result = subtract(result, bottomChamferTool(width, length, params.lidBedChamfer, cornerRadius));
  }

  const rimChamfer = lidTopChamferSize(params);
  if (rimChamfer > 0) {
    const rimInset = wall + insertClearance;
    const rimTopZ = roof + insertHeight;
    const rimRadius = params.lidScrews ? getScrewOffset(params) : cornerRadius;
    const outline = params.lidScrews ? cloverOutline(rimRadius) : roundedOutline(cornerRadius);
    result = subtract(
      result,
      translate(
        [rimInset, rimInset, 0],
        topChamferTool(width - rimInset * 2, length - rimInset * 2, rimChamfer, rimTopZ, outline),
      ),
    );
  }

  return result;
};

