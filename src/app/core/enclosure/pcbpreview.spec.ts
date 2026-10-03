import { measureBoundingBox, measureVolume } from '@jscad/modeling/src/measurements';

import { cloneParams, DEFAULT_PARAMS, type Params } from '../params';
import { base } from './base';
import {
  cavityFloorZ,
  pcbBoard,
  pcbCenterXY,
  pcbCollision,
  pcbComponentZone,
  pcbRestZ,
} from './pcbpreview';

describe('pcbpreview', () => {
  let params: Params;

  beforeEach(() => {
    params = cloneParams(DEFAULT_PARAMS);
  });

  describe('cavityFloorZ and pcbRestZ', () => {
    it('computes cavity floor based on lidScrews and waterproofing', () => {
      params.lidScrews = true;
      params.floor = 3;
      expect(cavityFloorZ(params)).toBe(3);

      params.lidScrews = false;
      params.waterProof = false;
      params.wall = 2;
      expect(cavityFloorZ(params)).toBe(2);

      params.waterProof = true;
      params.wall = 2;
      params.insertClearance = 0.1;
      params.insertThickness = 1.8;
      // innerWall = wall * 2 + insertClearance * 2 + insertThickness = 4 + 0.2 + 1.8 = 6.0
      expect(cavityFloorZ(params)).toBeCloseTo(6.0, 2);
    });

    it('rests on cavity floor when there are no bottom pcb mounts', () => {
      params.pcbMounts = [];
      params.floor = 2.5;
      params.lidScrews = true;

      expect(pcbRestZ(params)).toBe(2.5);
    });

    it('rests on top of highest bottom mount', () => {
      params.floor = 2;
      params.lidScrews = true;
      params.pcbMounts = [
        { surface: 'bottom', x: 20, y: 20, height: 6, outerDiameter: 6, screwDiameter: 2 },
        { surface: 'bottom', x: -20, y: -20, height: 8, outerDiameter: 6, screwDiameter: 2 },
        { surface: 'top', x: 0, y: 0, height: 12, outerDiameter: 6, screwDiameter: 2 },
      ];

      // Standoff max height is 8, base floor is 2 -> restZ is 10
      expect(pcbRestZ(params)).toBe(10);
    });
  });

  describe('pcbCenterXY', () => {
    it('centers PCB in enclosure base when offset is zero', () => {
      params.width = 120;
      params.length = 80;
      params.pcbPreview.x = 0;
      params.pcbPreview.y = 0;

      const [cx, cy] = pcbCenterXY(params);
      expect(cx).toBe(60);
      expect(cy).toBe(40);
    });

    it('applies user X and Y offsets', () => {
      params.width = 100;
      params.length = 100;
      params.pcbPreview.x = 15;
      params.pcbPreview.y = -10;

      const [cx, cy] = pcbCenterXY(params);
      expect(cx).toBe(65);
      expect(cy).toBe(40);
    });
  });

  describe('pcbBoard', () => {
    it('creates a solid board with volume matching dimensions', () => {
      params.pcbPreview.width = 50;
      params.pcbPreview.length = 40;
      params.pcbPreview.thickness = 1.6;

      const geom = pcbBoard(params);
      const volume = measureVolume(geom);
      expect(volume).toBeCloseTo(50 * 40 * 1.6, 1);
    });

    it('positions board from Z = restZ to Z = restZ + thickness', () => {
      params.floor = 2;
      params.lidScrews = true;
      params.pcbMounts = [
        { surface: 'bottom', x: 0, y: 0, height: 5, outerDiameter: 6, screwDiameter: 2 },
      ];
      params.pcbPreview.thickness = 2;

      const geom = pcbBoard(params);
      const [min, max] = measureBoundingBox(geom);

      // restZ = 2 + 5 = 7
      expect(min[2]).toBeCloseTo(7, 2);
      expect(max[2]).toBeCloseTo(9, 2);
    });
  });

  describe('pcbComponentZone', () => {
    it('returns null when componentHeight is 0 or negative', () => {
      params.pcbPreview.componentHeight = 0;
      expect(pcbComponentZone(params)).toBeNull();

      params.pcbPreview.componentHeight = -5;
      expect(pcbComponentZone(params)).toBeNull();
    });

    it('positions component zone directly above the board', () => {
      params.floor = 2;
      params.lidScrews = true;
      params.pcbMounts = [
        { surface: 'bottom', x: 0, y: 0, height: 5, outerDiameter: 6, screwDiameter: 2 },
      ];
      params.pcbPreview.thickness = 1.6;
      params.pcbPreview.componentHeight = 10;

      const geom = pcbComponentZone(params);
      expect(geom).not.toBeNull();
      if (!geom) return;

      const [min, max] = measureBoundingBox(geom);
      // restZ = 7, board top = 8.6, component top = 18.6
      expect(min[2]).toBeCloseTo(8.6, 2);
      expect(max[2]).toBeCloseTo(18.6, 2);
      expect(measureVolume(geom)).toBeCloseTo(
        params.pcbPreview.width * params.pcbPreview.length * 10,
        1,
      );
    });
  });

  describe('pcbCollision', () => {
    it('returns no collision when pcbPreview is disabled', () => {
      params.pcbPreview.enabled = false;
      // Intentionally oversized board
      params.pcbPreview.width = 500;
      params.pcbPreview.length = 500;

      const result = pcbCollision(params);
      expect(result.collides).toBeFalse();
      expect(result.hitsWalls).toBeFalse();
      expect(result.hitsCeiling).toBeFalse();
      expect(result.overlapVolume).toBe(0);
    });

    it('returns no collision when PCB comfortably fits within cavity', () => {
      params.pcbPreview.enabled = true;
      params.internalWalls = [];
      params.width = 100;
      params.length = 80;
      params.height = 30;
      // Small PCB centered inside
      params.pcbPreview.width = 30;
      params.pcbPreview.length = 30;
      params.pcbPreview.thickness = 1.6;
      params.pcbPreview.componentHeight = 5;
      params.pcbPreview.x = 0;
      params.pcbPreview.y = 0;

      const result = pcbCollision(params);
      expect(result.collides).toBeFalse();
      expect(result.hitsWalls).toBeFalse();
      expect(result.hitsCeiling).toBeFalse();
      expect(result.overlapVolume).toBe(0);
    });

    it('detects wall collision when board dimensions exceed cavity bounds', () => {
      params.pcbPreview.enabled = true;
      params.width = 100;
      params.length = 80;
      // Make PCB wider than the enclosure outer width
      params.pcbPreview.width = 120;
      params.pcbPreview.length = 60;
      params.pcbPreview.thickness = 1.6;
      params.pcbPreview.componentHeight = 5;

      const result = pcbCollision(params);
      expect(result.collides).toBeTrue();
      expect(result.hitsWalls).toBeTrue();
      expect(result.overlapVolume).toBeGreaterThan(1);
    });

    it('detects wall collision when shifted into side wall or corner boss', () => {
      params.pcbPreview.enabled = true;
      params.width = 100;
      params.length = 80;
      params.pcbPreview.width = 60;
      params.pcbPreview.length = 50;
      // Shift severely to the side
      params.pcbPreview.x = 35;
      params.pcbPreview.y = 0;

      const result = pcbCollision(params);
      expect(result.collides).toBeTrue();
      expect(result.hitsWalls).toBeTrue();
      expect(result.overlapVolume).toBeGreaterThan(1);
    });

    it('detects ceiling collision when component height exceeds enclosure height', () => {
      params.pcbPreview.enabled = true;
      params.internalWalls = [];
      params.height = 20;
      params.floor = 2;
      params.lidScrews = true;
      params.pcbMounts = [
        { surface: 'bottom', x: 0, y: 0, height: 5, outerDiameter: 6, screwDiameter: 2 },
      ];
      // Small footprint so it doesn't hit walls
      params.pcbPreview.width = 25;
      params.pcbPreview.length = 25;
      params.pcbPreview.thickness = 1.6;
      // restZ = 7, topZ = 7 + 1.6 + 15 = 23.6 > height (20)
      params.pcbPreview.componentHeight = 15;

      const result = pcbCollision(params);
      expect(result.collides).toBeTrue();
      expect(result.hitsCeiling).toBeTrue();
    });

    it('detects collision with internal partitions', () => {
      params.pcbPreview.enabled = true;
      params.width = 100;
      params.length = 80;
      params.pcbPreview.width = 40;
      params.pcbPreview.length = 40;
      params.pcbPreview.thickness = 1.6;
      params.pcbPreview.componentHeight = 8;
      params.pcbPreview.x = 0;
      params.pcbPreview.y = 0;

      // Add internal wall slicing through the center
      params.internalWalls = [
        {
          x: 0,
          y: 0,
          length: 50,
          thickness: 3,
          height: 15,
          rotation: 0,
        },
      ];

      const result = pcbCollision(params);
      expect(result.collides).toBeTrue();
      expect(result.hitsWalls).toBeTrue();
      expect(result.overlapVolume).toBeGreaterThan(1);
    });

    it('reuses pre-calculated baseSolid when provided', () => {
      params.pcbPreview.enabled = true;
      params.width = 60;
      params.length = 60;
      params.pcbPreview.width = 75; // hits walls
      params.pcbPreview.length = 40;

      const baseSolid = base(params);
      const result = pcbCollision(params, baseSolid);
      expect(result.collides).toBeTrue();
      expect(result.hitsWalls).toBeTrue();
    });
  });
});
