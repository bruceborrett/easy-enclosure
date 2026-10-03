import measureBoundingBox from '@jscad/modeling/src/measurements/measureBoundingBox';
import measureVolume from '@jscad/modeling/src/measurements/measureVolume';
import { intersect } from '@jscad/modeling/src/operations/booleans';
import { translate } from '@jscad/modeling/src/operations/transforms';
import { DEFAULT_PARAMS, cloneParams } from '../params';
import { clover, roundedCube } from './utils';
import { getSealReliefRadius, waterProofSeal, waterProofSealCutout } from './waterproofseal';

describe('waterproof seal enclosure', () => {
  it('clamps seal relief radius to prevent breaching the inner cavity wall', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.lidScrews = true;
    params.lidScrewHoleType = 'nut-pocket';
    params.lidScrewNutWidth = 6.0;

    const relief = getSealReliefRadius(params);
    const maxAllowedRelief = params.insertThickness + params.insertClearance * 2 + params.wall;

    expect(relief).toBeLessThanOrEqual(maxAllowedRelief);
  });

  it('generates seal ring and cutout geometry matching the enclosure perimeter', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.waterProof = true;
    params.lidScrews = true;

    const sealRing = waterProofSeal(params);
    const cutout = waterProofSealCutout(params);

    expect(sealRing).toBeDefined();
    expect(cutout).toBeDefined();

    const [[ringMinX, ringMinY], [ringMaxX, ringMaxY]] = measureBoundingBox(sealRing);
    expect(ringMinX).toBeCloseTo(0, 1);
    expect(ringMinY).toBeCloseTo(0, 1);
    expect(ringMaxX).toBeLessThanOrEqual(params.width);
    expect(ringMaxY).toBeLessThanOrEqual(params.length);
  });

  it('does not breach the inner cavity wall under captive nut pocket mode', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.waterProof = true;
    params.lidScrews = true;
    params.lidScrewHoleType = 'nut-pocket';
    params.lidScrewNutWidth = 5.7;

    const cutout = waterProofSealCutout(params);

    const _wall = params.wall * 2 + params.insertClearance * 2 + params.insertThickness;
    const cavity = translate(
      [_wall, _wall, params.floor],
      clover(
        params.width - _wall * 2,
        params.length - _wall * 2,
        params.height,
        getSealReliefRadius(params),
      ),
    );

    const overlap = intersect(cutout, cavity);
    expect(measureVolume(overlap)).toBeLessThan(0.01);
  });
});
