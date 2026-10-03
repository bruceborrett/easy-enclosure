import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import { measureBoundingBox } from '@jscad/modeling/src/measurements';

import { DEFAULT_PARAMS, cloneParams, type Params } from '../params';
import { baseSnapPockets, computePlacements, lidSnapBumps } from './snapfit';

type Placement = ReturnType<typeof computePlacements>[number];

const withSnap = (preset: 4 | 6 | 8, endPercent: number, over: Partial<Params> = {}): Params => {
  const params = cloneParams(DEFAULT_PARAMS);
  params.snapFit = { ...params.snapFit, enabled: true, preset, endPercent };
  return { ...params, ...over };
};

const totalBumps = (placements: Placement[]): number =>
  placements.reduce((acc, placement) => acc + placement.positions.length, 0);

const wallsOf = (placements: Placement[]): string[] =>
  placements.map((placement) => placement.wall).sort();

const marginOf = (params: Params): number =>
  params.wall + params.insertClearance + params.cornerRadius + params.snapFit.width / 2 + 1;

describe('snapfit', () => {
  describe('computePlacements', () => {
    it('puts four bumps on the two long walls only for preset 4', () => {
      const params = withSnap(4, 10);
      const placements = computePlacements(params);

      expect(totalBumps(placements)).toBe(4);
      expect(wallsOf(placements)).toEqual(['back', 'front']);
    });

    it('adds one centred bump per short wall for the six bump preset', () => {
      const params = withSnap(6, 20);
      const placements = computePlacements(params);

      expect(totalBumps(placements)).toBe(6);
      expect(wallsOf(placements)).toEqual(['back', 'front', 'left', 'right']);

      placements
        .filter((placement) => placement.wall === 'left' || placement.wall === 'right')
        .forEach((placement) => {
          expect(placement.positions.length).toBe(1);
        });
    });

    it('adds two end bumps per short wall for the eight bump preset', () => {
      const params = withSnap(8, 20);
      const placements = computePlacements(params);

      expect(totalBumps(placements)).toBe(8);
      expect(wallsOf(placements)).toEqual(['back', 'front', 'left', 'right']);

      placements
        .filter((placement) => placement.wall === 'left' || placement.wall === 'right')
        .forEach((placement) => {
          expect(placement.positions.length).toBe(2);
        });
    });

    it('swaps long and short walls when width is less than length', () => {
      const params = withSnap(4, 10, { width: 60, length: 100 });
      const placements = computePlacements(params);

      expect(totalBumps(placements)).toBe(4);
      expect(wallsOf(placements)).toEqual(['left', 'right']);
    });

    it('clamps the end percentage so bumps never leave the flat wall', () => {
      const params = withSnap(4, 0);
      const margin = marginOf(params);
      const placements = computePlacements(params);

      expect(placements.length).toBeGreaterThan(0);
      placements.forEach((placement) => {
        const span =
          placement.wall === 'front' || placement.wall === 'back' ? params.width : params.length;

        placement.positions.forEach((position) => {
          expect(position).toBeGreaterThanOrEqual(margin);
          expect(position).toBeLessThanOrEqual(span - margin);
        });
      });
    });

    it('keeps the two end bumps symmetric about the wall centre', () => {
      const params = withSnap(4, 15, { width: 120, length: 80 });
      const placements = computePlacements(params);

      placements.forEach((placement) => {
        expect(placement.positions.length).toBe(2);
        const [lo, hi] = placement.positions;
        expect(lo + hi).toBeCloseTo(params.width, 6);
      });
    });
  });

  describe('geometry', () => {
    it('produces nothing while snap fit is disabled', () => {
      const params = cloneParams(DEFAULT_PARAMS);
      params.snapFit = { ...params.snapFit, enabled: false };

      expect(lidSnapBumps(params)).toBeNull();
      expect(baseSnapPockets(params)).toBeNull();
    });

    it('builds lid bumps and base pockets when enabled', () => {
      const params = withSnap(4, 10);

      const bumps = lidSnapBumps(params);
      const pockets = baseSnapPockets(params);

      expect(bumps).not.toBeNull();
      expect(pockets).not.toBeNull();

      const [[minX, minY, minZ], [maxX, maxY, maxZ]] = measureBoundingBox(bumps as Geom3);
      expect(maxX - minX).toBeGreaterThan(0);
      expect(maxY - minY).toBeGreaterThan(0);
      expect(maxZ - minZ).toBeGreaterThan(0);
    });

    it('keeps the engagement zone inside the enclosure height', () => {
      const params = withSnap(4, 10);
      params.height = 30;
      params.roof = 2;
      params.insertHeight = 4;

      const [, [, , maxZ]] = measureBoundingBox(lidSnapBumps(params) as Geom3);
      const [, [, , pocketMaxZ]] = measureBoundingBox(baseSnapPockets(params) as Geom3);

      expect(maxZ).toBeLessThanOrEqual(params.height);
      expect(pocketMaxZ).toBeLessThanOrEqual(params.height);
    });
  });
});
