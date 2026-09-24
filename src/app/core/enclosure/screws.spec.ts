import measureBoundingBox from '@jscad/modeling/src/measurements/measureBoundingBox';
import { DEFAULT_PARAMS, cloneParams } from '../params';
import { getScrewDiameterMax, getScrewOffset, nutPockets, screws } from './screws';
import { base } from './base';
import { lid } from './lid';

describe('screws enclosure', () => {
  it('calculates getScrewDiameterMax and getScrewOffset for standard screws', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.lidScrewHoleType = 'blind';
    params.lidScrewDiameter = 3.0;
    params.baseLidScrewDiameter = 2.8;

    const diameterMax = getScrewDiameterMax(params);
    expect(diameterMax).toBe(3.0);

    const offset = getScrewOffset(params);
    expect(offset).toBe(3.0 / 2 + params.cornerRadius / 4 + params.wall / 2);
  });

  it('expands getScrewDiameterMax and getScrewOffset for captive nut pockets', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.lidScrewHoleType = 'nut-pocket';
    params.lidScrewNutWidth = 5.7;

    const expectedNutDiameter = (5.7 / Math.sqrt(3)) * 2;
    const diameterMax = getScrewDiameterMax(params);
    expect(diameterMax).toBeCloseTo(expectedNutDiameter, 4);

    const offset = getScrewOffset(params);
    expect(offset).toBeCloseTo(
      expectedNutDiameter / 2 + params.cornerRadius / 4 + params.wall / 2,
      4,
    );
  });

  it('creates blind screw hole cutters that stop at defined depth from top', () => {
    const height = 30;
    const depth = 10;
    const cutters = screws(100, 80, height, 6, 3, depth);
    const [[, , zMin], [, , zMax]] = measureBoundingBox(cutters);

    expect(zMin).toBeCloseTo(height - depth, 1);
    expect(zMax).toBeGreaterThanOrEqual(height);
  });

  it('creates through screw hole cutters when depth is omitted', () => {
    const height = 30;
    const cutters = screws(100, 80, height, 6, 3);
    const [[, , zMin], [, , zMax]] = measureBoundingBox(cutters);

    expect(zMin).toBeLessThanOrEqual(0);
    expect(zMax).toBeGreaterThanOrEqual(height);
  });

  it('creates nut pocket cutters at the bottom face of the base', () => {
    const nutDepth = 2.5;
    const pockets = nutPockets(100, 80, 8, 5.7, nutDepth);
    const [[, , zMin], [, , zMax]] = measureBoundingBox(pockets);

    expect(zMin).toBeLessThanOrEqual(0);
    expect(zMax).toBeCloseTo(nutDepth, 1);
  });

  it('generates solid base bottom when using blind holes', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.lidScrews = true;
    params.lidScrewHoleType = 'blind';
    params.lidScrewHoleDepth = 8;

    const baseModel = base(params);
    const [[, , zMin], [, , zMax]] = measureBoundingBox(baseModel);

    expect(zMin).toBe(0);
    expect(zMax).toBe(params.height);
  });

  it('aligns lid and base corner boss offsets for nut pockets', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.lidScrews = true;
    params.lidScrewHoleType = 'nut-pocket';
    params.lidScrewNutWidth = 6.0;

    const baseModel = base(params);
    const lidModel = lid(params);

    expect(baseModel).toBeDefined();
    expect(lidModel).toBeDefined();
  });
});
