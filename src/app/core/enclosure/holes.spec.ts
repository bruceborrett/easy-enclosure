import measureBoundingBox from '@jscad/modeling/src/measurements/measureBoundingBox';
import { DEFAULT_PARAMS, cloneParams } from '../params';
import { holes } from './holes';

describe('holes', () => {
  it('creates top hole cutters that span the full lid thickness', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.roof = 6;
    params.insertHeight = 2;
    params.holes = [
      {
        shape: 'circle',
        surface: 'top',
        diameter: 10,
        width: 10,
        length: 10,
        x: 0,
        y: 0,
      },
    ];

    const topHole = holes(params, ['top']);
    const [[, , zMin], [, , zMax]] = measureBoundingBox(topHole);

    expect(zMin).toBe(0);
    expect(zMax).toBeGreaterThan(params.roof + params.insertHeight);
  });

  it('creates a double-d hole with parallel flats and correct dimensions on top surface', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.holes = [
      {
        shape: 'double-d',
        surface: 'top',
        diameter: 13,
        flatWidth: 11.8,
        rotation: 0,
        width: 10,
        length: 10,
        x: 0,
        y: 0,
      },
    ];

    const topHole = holes(params, ['top']);
    const [[xMin, yMin], [xMax, yMax]] = measureBoundingBox(topHole);

    expect(xMax - xMin).toBeCloseTo(13, 1);
    expect(yMax - yMin).toBeCloseTo(11.8, 1);
  });

  it('rotates double-d hole flats with rotation angle', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.holes = [
      {
        shape: 'double-d',
        surface: 'top',
        diameter: 13,
        flatWidth: 11.8,
        rotation: 90,
        width: 10,
        length: 10,
        x: 0,
        y: 0,
      },
    ];

    const topHole = holes(params, ['top']);
    const [[xMin, yMin], [xMax, yMax]] = measureBoundingBox(topHole);

    expect(xMax - xMin).toBeCloseTo(11.8, 1);
    expect(yMax - yMin).toBeCloseTo(13, 1);
  });

  it('creates double-d holes on side walls with flats oriented horizontally at 0 deg', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.holes = [
      {
        shape: 'double-d',
        surface: 'front',
        diameter: 13,
        flatWidth: 11.8,
        rotation: 0,
        width: 10,
        length: 10,
        x: 0,
        y: 0,
      },
    ];

    const frontHole = holes(params, ['front']);
    const [[xMin, , zMin], [xMax, , zMax]] = measureBoundingBox(frontHole);

    // Across the front face: X is horizontal (13mm diameter), Z is vertical (11.8mm across flats)
    expect(xMax - xMin).toBeCloseTo(13, 1);
    expect(zMax - zMin).toBeCloseTo(11.8, 1);
  });

  it('preserves circular shape when flatWidth is greater than or equal to diameter', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.holes = [
      {
        shape: 'double-d',
        surface: 'top',
        diameter: 13,
        flatWidth: 15,
        rotation: 0,
        width: 10,
        length: 10,
        x: 0,
        y: 0,
      },
    ];

    const topHole = holes(params, ['top']);
    const [[xMin, yMin], [xMax, yMax]] = measureBoundingBox(topHole);

    expect(xMax - xMin).toBeCloseTo(13, 1);
    expect(yMax - yMin).toBeCloseTo(13, 1);
  });
});
