import { measureBoundingBox } from '@jscad/modeling/src/measurements';

import { DEFAULT_PARAMS, cloneParams, type PCBMount } from '../params';
import {
  calculateMountFilletSize,
  pcbMount,
  pcbMounts,
  pcbMountsOnBase,
  pcbMountsOnLid,
} from './pcbmount';

describe('pcbmount', () => {
  const baseMountParams: PCBMount = {
    surface: 'bottom',
    x: 0,
    y: 0,
    height: 8,
    outerDiameter: 6,
    screwDiameter: 3,
  };

  describe('calculateMountFilletSize', () => {
    it('sizes fillet proportionally to mount diameter (outerDiameter / 3)', () => {
      expect(calculateMountFilletSize(6, 8)).toBeCloseTo(2.0, 5);
      expect(calculateMountFilletSize(4.5, 8)).toBeCloseTo(1.5, 5);
      expect(calculateMountFilletSize(3.0, 8)).toBeCloseTo(1.0, 5);
    });

    it('returns 0 when outer diameter or height is 0 or negative', () => {
      expect(calculateMountFilletSize(0, 8)).toBe(0);
      expect(calculateMountFilletSize(-6, 8)).toBe(0);
      expect(calculateMountFilletSize(6, 0)).toBe(0);
      expect(calculateMountFilletSize(6, -2)).toBe(0);
    });

    it('clamps size to at most 45% of height', () => {
      // height = 2 => maxAllowed = 2 * 0.45 = 0.9
      expect(calculateMountFilletSize(6, 2.0)).toBeCloseTo(0.9, 5);
    });

    it('returns 0 for microscopic standoffs where maxAllowed < MIN_MOUNT_FILLET or fillet < MIN_MOUNT_FILLET', () => {
      expect(calculateMountFilletSize(6, 0.3)).toBe(0);
      expect(calculateMountFilletSize(0.5, 8)).toBe(0);
    });
  });

  describe('pcbMount', () => {
    it('creates smooth concave fillet sized proportionally (2mm on 6mm mount)', () => {
      const mount = pcbMount(baseMountParams);

      const bbox = measureBoundingBox(mount);
      // Outer radius 3 + fillet 2 = 5 => [-5, 5]
      expect(bbox[0][0]).toBeCloseTo(-5, 1);
      expect(bbox[1][0]).toBeCloseTo(5, 1);
      expect(bbox[0][1]).toBeCloseTo(-5, 1);
      expect(bbox[1][1]).toBeCloseTo(5, 1);
      expect(bbox[0][2]).toBeCloseTo(-4, 1);
      expect(bbox[1][2]).toBeCloseTo(4, 1);
    });

    it('scales fillet with different mount diameters (e.g. 1.5mm on 4.5mm mount)', () => {
      const mount = pcbMount({
        ...baseMountParams,
        outerDiameter: 4.5,
      });

      const bbox = measureBoundingBox(mount);
      // Outer radius 2.25 + fillet 1.5 = 3.75 => [-3.75, 3.75]
      expect(bbox[0][0]).toBeCloseTo(-3.75, 1);
      expect(bbox[1][0]).toBeCloseTo(3.75, 1);
    });

    it('supports solid standoffs with screwDiameter = 0', () => {
      const solidMount: PCBMount = {
        ...baseMountParams,
        screwDiameter: 0,
      };

      const mount = pcbMount(solidMount);

      expect(mount).toBeDefined();
      const bbox = measureBoundingBox(mount);
      expect(bbox[0][0]).toBeCloseTo(-5, 1);
      expect(bbox[1][0]).toBeCloseTo(5, 1);
    });
  });

  describe('mount placement and unioning', () => {
    it('returns null when no mounts are defined', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.pcbMounts = [];

      expect(pcbMountsOnBase(params)).toBeNull();
      expect(pcbMountsOnLid(params)).toBeNull();
      expect(pcbMounts(params)).toBeNull();
    });

    it('places base mounts on the enclosure floor', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.lidScrews = true;
      params.floor = 2;
      params.pcbMounts = [
        {
          surface: 'bottom',
          x: 10,
          y: 15,
          height: 8,
          outerDiameter: 6,
          screwDiameter: 3,
        },
      ];

      const baseMount = pcbMountsOnBase(params);
      expect(baseMount).not.toBeNull();
      const bbox = measureBoundingBox(baseMount!);
      // Base floor is at z = 2, standoff height is 8, so z spans [2, 10]
      expect(bbox[0][2]).toBeCloseTo(2, 1);
      expect(bbox[1][2]).toBeCloseTo(10, 1);
    });

    it('places lid mounts on the lid roof', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.roof = 2.5;
      params.pcbMounts = [
        {
          surface: 'top',
          x: 0,
          y: 0,
          height: 6,
          outerDiameter: 6,
          screwDiameter: 3,
        },
      ];

      const lidMount = pcbMountsOnLid(params);
      expect(lidMount).not.toBeNull();
      const bbox = measureBoundingBox(lidMount!);
      // Roof is 2.5, height is 6, so z spans [2.5, 8.5]
      expect(bbox[0][2]).toBeCloseTo(2.5, 1);
      expect(bbox[1][2]).toBeCloseTo(8.5, 1);
    });

    it('unions both base and lid mounts in pcbMounts()', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.pcbMounts = [
        {
          surface: 'bottom',
          x: 0,
          y: 0,
          height: 8,
          outerDiameter: 6,
          screwDiameter: 3,
        },
        {
          surface: 'top',
          x: 0,
          y: 0,
          height: 6,
          outerDiameter: 6,
          screwDiameter: 3,
        },
      ];

      const combined = pcbMounts(params);
      expect(combined).not.toBeNull();
    });
  });
});
