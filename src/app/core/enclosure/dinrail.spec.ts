import measureBoundingBox from '@jscad/modeling/src/measurements/measureBoundingBox';
import measureVolume from '@jscad/modeling/src/measurements/measureVolume';
import { intersect } from '@jscad/modeling/src/operations/booleans';
import { cuboid } from '@jscad/modeling/src/primitives';

import { DEFAULT_PARAMS, cloneParams } from '../params';
import { base } from './base';
import { dinRailChannel, dinRailMount } from './dinrail';

describe('dinRailMount', () => {
  it('is disabled by default with TH35 defaults', () => {
    expect(DEFAULT_PARAMS.dinRailMount).toBe(false);
    expect(DEFAULT_PARAMS.dinRailSurface).toBe('bottom');
    expect(DEFAULT_PARAMS.dinRailWidth).toBe(35);
    expect(DEFAULT_PARAMS.dinRailCrownWidth).toBe(27);
    expect(DEFAULT_PARAMS.dinRailDepth).toBe(8.5);
    expect(DEFAULT_PARAMS.dinRailLength).toBe(60);
  });

  it('protrudes below the floor only when enabled (default behaviour unchanged)', () => {
    const off = measureBoundingBox(base(DEFAULT_PARAMS));
    const onParams = cloneParams(DEFAULT_PARAMS);
    onParams.dinRailMount = true;
    const on = measureBoundingBox(base(onParams));

    expect(off[0][2]).toBeGreaterThanOrEqual(-0.001); // nothing below the floor by default
    expect(on[0][2]).toBeLessThan(-5); // DIN boss sticks out below the floor
    expect(on[0][2]).toBeLessThan(off[0][2]);
  });

  it('places the bottom mount flush on the floor and within the footprint', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.dinRailMount = true;
    params.dinRailSurface = 'bottom';
    const [[xMin, yMin, zMin], [xMax, yMax, zMax]] = measureBoundingBox(dinRailMount(params));

    expect(zMin).toBeLessThan(0);
    expect(zMax).toBeCloseTo(0, 5);
    expect(xMin).toBeGreaterThanOrEqual(0);
    expect(xMax).toBeLessThanOrEqual(params.width);
    expect(yMin).toBeGreaterThanOrEqual(0);
    expect(yMax).toBeLessThanOrEqual(params.length);
  });

  it('places the back mount behind the back wall', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.dinRailMount = true;
    params.dinRailSurface = 'back';
    params.height = 50; // must exceed dinRailWidth + 2 * MARGIN (39) to avoid overhang
    const [[, yMin]] = measureBoundingBox(dinRailMount(params));

    expect(yMin).toBeLessThan(0);
  });

  it('cuts a real top-hat slot out of the boss', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.dinRailMount = true;
    const slotted = dinRailMount(params);

    const MARGIN = 2;
    const bossAcrossRail = params.dinRailWidth + 2 * MARGIN;
    const bossThickness = params.dinRailDepth + MARGIN;
    const solid = cuboid({
      center: [0, 0, -bossThickness / 2],
      size: [params.dinRailLength, bossAcrossRail, bossThickness],
    });

    expect(measureVolume(slotted)).toBeLessThan(measureVolume(solid));
    expect(measureVolume(solid) - measureVolume(slotted)).toBeGreaterThan(1000);
  });

  it('can coexist with wall mounts on the same enclosure', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.wallMounts = true;
    params.dinRailMount = true;
    params.dinRailSurface = 'bottom';
    const [[xMin, , zMin], [xMax]] = measureBoundingBox(base(params));

    // wall flanges protrude beyond the left/right walls...
    expect(xMin).toBeLessThan(0);
    expect(xMax).toBeGreaterThan(params.width);
    // ...while the DIN boss protrudes below the floor
    expect(zMin).toBeLessThan(0);
  });

  it('forms an undercut that retains the rail (mouth narrower than the brim chamber)', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.dinRailMount = true;
    const channel = dinRailChannel(params);

    const MARGIN = 2; // mirrors the module constant
    const SLOT_DEPTH_CLEARANCE = 0.4; // mirrors the module constant
    const bossThickness = params.dinRailDepth + MARGIN;
    const slotDepth = params.dinRailDepth + SLOT_DEPTH_CLEARANCE;

    const widthAt = (z: number) => {
      const slice = intersect(
        channel,
        cuboid({ center: [0, 0, z], size: [params.dinRailLength + 20, 200, 0.05] }),
      );
      const [[, yMin], [, yMax]] = measureBoundingBox(slice);
      return yMax - yMin;
    };

    const mouthWidth = widthAt(-bossThickness + 0.15); // just inside the outer face
    const chamberWidth = widthAt(-bossThickness + slotDepth - 0.15); // just inside the deep chamber

    expect(mouthWidth).toBeLessThan(params.dinRailWidth); // brim (35) cannot pass back out
    expect(chamberWidth - mouthWidth).toBeGreaterThan(4); // meaningful undercut → rail retained
  });
});
