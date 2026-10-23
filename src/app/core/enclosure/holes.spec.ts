import measureBoundingBox from '@jscad/modeling/src/measurements/measureBoundingBox';
import { DEFAULT_PARAMS, cloneParams } from '../params';
import { holes } from './holes';
import { base } from './base';

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

  it('creates bottom hole cutters that cleanly span the entire floor thickness', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    params.floor = 3;
    params.holes = [
      {
        shape: 'circle',
        surface: 'bottom',
        diameter: 10,
        width: 10,
        length: 10,
        x: 0,
        y: 0,
      },
    ];

    const bottomHole = holes(params, ['bottom']);
    const [[, , zMin], [, , zMax]] = measureBoundingBox(bottomHole);

    expect(zMin).toBeLessThan(0);
    expect(zMax).toBeGreaterThan(params.floor);
  });

  it('cuts completely through side walls without leaving coplanar membranes', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    const b = base(params);
    const { toPolygons } = require('@jscad/modeling').geometries.geom3;
    const polys = toPolygons(b);

    const frontMembranes = polys.filter((poly: any) =>
      poly.vertices.every(
        (v: number[]) =>
          Math.abs(v[1] - 75.92) < 0.01 && v[0] >= 44 && v[0] <= 56 && v[2] >= 9 && v[2] <= 21,
      ),
    );
    const leftMembranes = polys.filter((poly: any) =>
      poly.vertices.every(
        (v: number[]) =>
          Math.abs(v[0] - 95.92) < 0.01 && v[1] >= 34 && v[1] <= 46 && v[2] >= 9 && v[2] <= 21,
      ),
    );

    expect(frontMembranes.length).toBe(0);
    expect(leftMembranes.length).toBe(0);
  });
});
