import measureBoundingBox from '@jscad/modeling/src/measurements/measureBoundingBox';
import { DEFAULT_PARAMS, cloneParams } from '../params';
import { flange, flanges } from './wallmount';

describe('wallmount enclosure', () => {
  it('generates a mounting flange with correct dimensions and 45-degree chamfer', () => {
    const screwDiameter = 4;
    const model = flange(screwDiameter);
    expect(model).toBeDefined();

    const [[minX, minY, minZ], [maxX, maxY, maxZ]] = measureBoundingBox(model);
    expect(minX).toBeLessThan(0);
    expect(maxX).toBeGreaterThanOrEqual(0);
    expect(maxY - minY).toBeGreaterThan(screwDiameter);
    expect(maxZ - minZ).toBeGreaterThan(screwDiameter);
  });

  it('generates wall mount flanges on left and right sides of the base', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.wallMounts = true;
    params.wallMountCount = 4;

    const mountModel = flanges(params);
    expect(mountModel).toBeDefined();

    const [[minX, minY, minZ], [maxX, maxY, maxZ]] = measureBoundingBox(mountModel);
    expect(minX).toBeLessThan(0);
    expect(maxX).toBeGreaterThan(params.width);
    expect(minY).toBeGreaterThanOrEqual(0);
    expect(maxY).toBeLessThanOrEqual(params.length);
  });
});
