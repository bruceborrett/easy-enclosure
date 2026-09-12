import measureBoundingBox from '@jscad/modeling/src/measurements/measureBoundingBox';
import { DEFAULT_PARAMS, cloneParams } from '../params';
import {
  calculateDinRailHoles,
  dinRailMount,
  dinRailMountGeometry,
  dinRailMountsPair,
} from './dinrailmount';

describe('dinrailmount', () => {
  it('calculates correct hole positions for 4 wall mounts', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.length = 80;
    params.cornerRadius = 3;
    params.wallMountScrewDiameter = 4;
    params.wallMountCount = 4;
    params.dinRailOrientation = 'horizontal';

    const result = calculateDinRailHoles(params);
    // outerWidth = 4 + 4 + 4 = 12
    // cornerSpacing = 3 + 12 / 2 = 9
    // spacing = 80 - 2 * 9 = 62
    expect(result.outerWidth).toBe(12);
    expect(result.spacing).toBe(62);
    expect(result.positions).toEqual([-31, 0, 31]);
    expect(result.totalLength).toBeGreaterThanOrEqual(62 + 24);
  });

  it('calculates single center hole for 2 wall mounts', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.wallMountCount = 2;
    params.dinRailOrientation = 'horizontal';

    const result = calculateDinRailHoles(params);
    expect(result.spacing).toBe(0);
    expect(result.positions).toEqual([0]);
  });

  it('calculates horizontal hole spacing across width for vertical rail orientation', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.width = 100;
    params.wallMountScrewDiameter = 4;
    params.dinRailOrientation = 'vertical';

    const result = calculateDinRailHoles(params);
    // outerWidth = 12
    // spacing = 100 + 4 + 12 = 116
    expect(result.spacing).toBe(116);
    expect(result.positions).toEqual([-58, 58]);
  });

  it('generates a valid 3D Geom3 object for single din rail mount', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.dinRailMount = true;
    params.dinRailMountWidth = 15;

    const mount = dinRailMount(params);
    expect(mount).toBeDefined();

    const [[minX, minY, minZ], [maxX, maxY, maxZ]] = measureBoundingBox(mount);
    expect(maxX - minX).toBeCloseTo(15, 0);
    expect(maxY - minY).toBeGreaterThan(50);
    expect(maxZ - minZ).toBeCloseTo(16, 0);
    expect(minZ).toBeCloseTo(0, 5);
  });

  it('generates a pair of mounts placed next to each other (horizontal orientation)', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.dinRailMount = true;
    params.dinRailMountWidth = 15;
    params.width = 100;
    params.wallMountScrewDiameter = 4;

    const pair = dinRailMountsPair(params);
    expect(pair).toBeDefined();

    const [[minX, ,], [maxX, ,]] = measureBoundingBox(pair);
    // Two mounts of width 15 placed next to each other with 8mm gap: 15 * 2 + 8 = 38mm total X span
    expect(maxX - minX).toBeCloseTo(38, 0);
  });

  it('generates a pair of mounts placed next to each other (vertical rail orientation)', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.dinRailMount = true;
    params.dinRailMountWidth = 15;
    params.length = 80;
    params.cornerRadius = 3;
    params.wallMountScrewDiameter = 4;
    params.wallMountCount = 4;
    params.dinRailOrientation = 'vertical';

    const pair = dinRailMountsPair(params);
    expect(pair).toBeDefined();

    const [[, minY, ], [, maxY, ]] = measureBoundingBox(pair);
    // In vertical orientation, clips are rotated 90deg, so width 15 is along Y.
    // Two mounts of width 15 placed next to each other with 8mm gap: 15 * 2 + 8 = 38mm total Y span
    expect(maxY - minY).toBeCloseTo(38, 0);
  });


  it('dinRailMountGeometry returns a single mount for export', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.dinRailMount = true;

    const result = dinRailMountGeometry(params);
    expect(result).toBeDefined();
    const [[minX, ,], [maxX, ,]] = measureBoundingBox(result);
    expect(maxX - minX).toBeCloseTo(15, 0);
  });
});

