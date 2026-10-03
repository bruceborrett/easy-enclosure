import { measureBoundingBox, measureVolume } from '@jscad/modeling/src/measurements';

import {
  cloneParams,
  DEFAULT_CABLE_CLAMP,
  DEFAULT_PARAMS,
  type CableClamp,
  type Params,
} from '../params';
import {
  cableClampBase,
  cableClampTop,
  cableClampTops,
  cableClamps,
  cableClampsOnBase,
  cableClampsOnLid,
  cableClampTopsOnBase,
} from './clamp';

describe('clamp', () => {
  const sampleClamp: CableClamp = {
    ...DEFAULT_CABLE_CLAMP,
    x: 10,
    y: 15,
    length: 16,
    wallHeight: 6,
    wallThickness: 4,
    mountHeight: 10,
    mountOuterDiameter: 6,
    mountScrewDiameter: 2,
    topHeight: 3,
    topScrewDiameter: 2.8,
    rotation: 0,
    ridges: true,
  };

  describe('cableClampBase', () => {
    it('creates a valid 3D solid with positive volume', () => {
      const geom = cableClampBase(sampleClamp);
      const volume = measureVolume(geom);
      expect(volume).toBeGreaterThan(0);
    });

    it('starts exactly at Z = 0 and reaches mountHeight', () => {
      const geom = cableClampBase(sampleClamp);
      const [min, max] = measureBoundingBox(geom);

      expect(min[2]).toBeCloseTo(0, 1);
      expect(max[2]).toBeCloseTo(sampleClamp.mountHeight, 1);
    });

    it('centers Y symmetrically across span and post radii', () => {
      const geom = cableClampBase(sampleClamp);
      const [min, max] = measureBoundingBox(geom);
      const expectedSpan = sampleClamp.length / 2 + sampleClamp.mountOuterDiameter / 2;

      expect(min[1]).toBeCloseTo(-expectedSpan, 1);
      expect(max[1]).toBeCloseTo(expectedSpan, 1);
    });

    it('generates geometry when ridges are disabled', () => {
      const smoothClamp = { ...sampleClamp, ridges: false };
      const geomSmooth = cableClampBase(smoothClamp);
      const geomRidged = cableClampBase(sampleClamp);

      const volSmooth = measureVolume(geomSmooth);
      const volRidged = measureVolume(geomRidged);

      expect(volSmooth).toBeGreaterThan(0);
      expect(volRidged).toBeGreaterThan(volSmooth);
    });
  });

  describe('cableClampTop', () => {
    it('creates a valid 3D strap with positive volume', () => {
      const geom = cableClampTop(sampleClamp);
      const volume = measureVolume(geom);
      expect(volume).toBeGreaterThan(0);
    });

    it('starts at Z = 0 and has correct height', () => {
      const geom = cableClampTop({ ...sampleClamp, ridges: false });
      const [min, max] = measureBoundingBox(geom);

      expect(min[2]).toBeCloseTo(0, 1);
      expect(max[2]).toBeCloseTo(sampleClamp.topHeight, 1);
    });
  });

  describe('cableClampTops', () => {
    it('returns null when cableClamps is empty', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [];
      expect(cableClampTops(params)).toBeNull();
    });

    it('returns single geometry when one clamp is defined', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [sampleClamp];
      const tops = cableClampTops(params);

      expect(tops).not.toBeNull();
      expect(measureVolume(tops!)).toBeGreaterThan(0);
    });

    it('spaces multiple clamp tops along the X axis', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [sampleClamp, { ...sampleClamp, length: 20 }];
      const tops = cableClampTops(params, 25);

      expect(tops).not.toBeNull();
      const [min, max] = measureBoundingBox(tops!);
      expect(max[0] - min[0]).toBeGreaterThan(20);
    });
  });

  describe('cableClampsOnBase and cableClampTopsOnBase', () => {
    it('returns null when no clamps exist', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [];
      expect(cableClampsOnBase(params)).toBeNull();
      expect(cableClampTopsOnBase(params)).toBeNull();
    });

    it('positions base clamp at floor level inside enclosure', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [sampleClamp];
      const baseGeom = cableClampsOnBase(params);

      expect(baseGeom).not.toBeNull();
      const [min, max] = measureBoundingBox(baseGeom!);
      expect(min[2]).toBeCloseTo(params.floor, 1);
      expect(max[2]).toBeCloseTo(params.floor + sampleClamp.mountHeight, 1);
    });

    it('positions top strap resting on base clamp posts', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [sampleClamp];
      const topGeom = cableClampTopsOnBase(params);

      expect(topGeom).not.toBeNull();
      const [min] = measureBoundingBox(topGeom!);
      expect(min[2]).toBeCloseTo(params.floor + sampleClamp.mountHeight, 1);
    });

    it('respects rotation parameter', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      const clamp0 = { ...sampleClamp, x: 0, y: 0, rotation: 0 };
      const clamp90 = { ...sampleClamp, x: 0, y: 0, rotation: 90 };

      params.cableClamps = [clamp0];
      const bbox0 = measureBoundingBox(cableClampsOnBase(params)!);

      params.cableClamps = [clamp90];
      const bbox90 = measureBoundingBox(cableClampsOnBase(params)!);

      const spanY0 = bbox0[1][1] - bbox0[0][1];
      const spanX90 = bbox90[1][0] - bbox90[0][0];
      expect(spanY0).toBeCloseTo(spanX90, 0.5);
    });
  });

  describe('cableClampsOnLid', () => {
    it('returns null when no lid clamps exist', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [sampleClamp];
      expect(cableClampsOnLid(params)).toBeNull();
    });

    it('mounts downward from lid roof when surface is top', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [{ ...sampleClamp, surface: 'top' }];
      const lidGeom = cableClampsOnLid(params);

      expect(lidGeom).not.toBeNull();
      const [min, max] = measureBoundingBox(lidGeom!);
      const lidZ = params.roof + params.insertHeight;
      expect(max[2]).toBeCloseTo(lidZ, 1);
      expect(min[2]).toBeCloseTo(lidZ - sampleClamp.mountHeight, 1);
    });
  });

  describe('cableClamps', () => {
    it('returns null when no clamps are configured', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [];
      expect(cableClamps(params)).toBeNull();
    });

    it('returns combined assembly containing base and top strap', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.cableClamps = [sampleClamp];
      const combined = cableClamps(params);

      expect(combined).not.toBeNull();
      const volCombined = measureVolume(combined!);
      const volBase = measureVolume(cableClampsOnBase(params)!);
      const volTop = measureVolume(cableClampTopsOnBase(params)!);

      expect(volCombined).toBeGreaterThan(volBase);
      expect(volCombined).toBeCloseTo(volBase + volTop, 0.5);
    });
  });
});
