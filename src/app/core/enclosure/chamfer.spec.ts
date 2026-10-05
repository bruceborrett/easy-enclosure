import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import measureVolume from '@jscad/modeling/src/measurements/measureVolume';

import { DEFAULT_PARAMS, cloneParams, type Params } from '../params';
import { base } from './base';
import {
  bottomChamferTool,
  chamferSolidBottom,
  cloverOutline,
  lidTopChamferSize,
  roundedOutline,
  topChamferTool,
} from './chamfer';
import { lid } from './lid';
import { getScrewOffset } from './screws';
import { flange, flanges } from './wallmount';

const angleBinsCovered = (solid: Geom3, bins = 360): number => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  solid.polygons.forEach((polygon) => {
    polygon.vertices.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const hit = new Array<boolean>(bins).fill(false);
  solid.polygons.forEach((polygon) => {
    const v = polygon.vertices;
    for (let i = 0; i < v.length; i += 1) {
      const a = v[i];
      const b = v[(i + 1) % v.length];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const steps = Math.max(1, Math.min(4000, Math.ceil(length / 0.2)));
      for (let k = 0; k <= steps; k += 1) {
        const t = k / steps;
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t;
        let angle = Math.atan2(y - cy, x - cx);
        if (angle < 0) angle += Math.PI * 2;
        hit[Math.min(bins - 1, Math.floor((angle / (Math.PI * 2)) * bins))] = true;
      }
    }
  });
  return hit.filter(Boolean).length;
};

const zExtent = (solid: Geom3): number => {
  let min = Infinity;
  let max = -Infinity;
  solid.polygons.forEach((polygon) => {
    polygon.vertices.forEach(([, , z]) => {
      min = Math.min(min, z);
      max = Math.max(max, z);
    });
  });
  return max - min;
};

describe('topChamferTool', () => {
  const params = cloneParams(DEFAULT_PARAMS);
  const rimInset = params.wall + params.insertClearance;
  const l = params.width - rimInset * 2;
  const w = params.length - rimInset * 2;
  const rimTopZ = params.roof + params.insertHeight;

  const build = (c: number, p: Params = params): Geom3 => {
    const radius = p.lidScrews ? getScrewOffset(p) : p.cornerRadius;
    const outline = p.lidScrews ? cloverOutline(radius) : roundedOutline(p.cornerRadius);
    return topChamferTool(l, w, c, rimTopZ, outline);
  };

  it('forms a 360-degree closed ring on clover profiles with screw scallops', () => {
    expect(angleBinsCovered(build(0.4))).toBe(360);
  });

  it('forms a 360-degree closed ring on rounded rectangle profiles when screws are off', () => {
    const off = cloneParams(DEFAULT_PARAMS);
    off.lidScrews = false;
    expect(angleBinsCovered(build(0.4, off))).toBe(360);
  });

  it('maintains closure when chamfer dimension is increased', () => {
    expect(angleBinsCovered(build(1.2))).toBe(360);
  });

  it('matches requested height for a 45-degree slope', () => {
    expect(zExtent(build(0.4))).toBeCloseTo(0.4, 2);
    expect(zExtent(build(1.2))).toBeCloseTo(1.2, 2);
  });

  it('scales volume quadratically with chamfer size', () => {
    const v1 = measureVolume(build(0.4));
    const v2 = measureVolume(build(0.8));
    expect(v1).toBeGreaterThan(0);
    expect(v2 / v1).toBeGreaterThan(3.6);
    expect(v2 / v1).toBeLessThan(4.4);
  });

  it('produces negligible volume when chamfer size is 0', () => {
    expect(measureVolume(build(0))).toBeLessThan(0.01);
  });
});

describe('bottomChamferTool', () => {
  it('creates a wedge ring of height matching c', () => {
    const tool = bottomChamferTool(100, 80, 0.6, 3);
    expect(zExtent(tool)).toBeCloseTo(0.6, 1);
    expect(measureVolume(tool)).toBeGreaterThan(0);
  });

  it('returns negligible geometry when c is 0', () => {
    const tool = bottomChamferTool(100, 80, 0, 3);
    expect(measureVolume(tool)).toBeLessThan(0.01);
  });
});

describe('chamferSolidBottom', () => {
  it('cuts bottom edges of a solid when c > 0', () => {
    const ear = flange(DEFAULT_PARAMS.wallMountScrewDiameter);
    const chamfered = chamferSolidBottom(ear, 0.6);
    expect(measureVolume(chamfered)).toBeLessThan(measureVolume(ear));
  });

  it('returns identical solid when c is 0', () => {
    const ear = flange(DEFAULT_PARAMS.wallMountScrewDiameter);
    const same = chamferSolidBottom(ear, 0);
    expect(measureVolume(same)).toBe(measureVolume(ear));
  });
});

describe('lidTopChamferSize clamping', () => {
  const sizeWith = (over: Partial<Params>): number => {
    const p = cloneParams(DEFAULT_PARAMS);
    Object.assign(p, over);
    return lidTopChamferSize(p);
  };

  it('returns 0 when disabled', () => {
    expect(sizeWith({ lidTopChamfer: 0 })).toBe(0);
  });

  it('clamps to 90% of insertHeight', () => {
    expect(sizeWith({ lidTopChamfer: 99, insertHeight: 4, insertThickness: 99 })).toBeCloseTo(
      3.6,
      6,
    );
  });

  it('clamps to 80% of insertThickness', () => {
    expect(sizeWith({ lidTopChamfer: 99, insertHeight: 99, insertThickness: 2 })).toBeCloseTo(
      1.6,
      6,
    );
  });

  it('preserves valid default 0.4', () => {
    expect(sizeWith({ lidTopChamfer: DEFAULT_PARAMS.lidTopChamfer })).toBe(
      DEFAULT_PARAMS.lidTopChamfer,
    );
  });
});

describe('base and lid enclosure integration', () => {
  it('reduces base volume when baseBedChamfer is applied', () => {
    const paramsNoChamfer = cloneParams(DEFAULT_PARAMS);
    paramsNoChamfer.baseBedChamfer = 0;
    const baseWithout = base(paramsNoChamfer);

    const paramsChamfer = cloneParams(DEFAULT_PARAMS);
    paramsChamfer.baseBedChamfer = 0.6;
    const baseWith = base(paramsChamfer);

    expect(measureVolume(baseWith)).toBeLessThan(measureVolume(baseWithout));
  });

  it('reduces lid volume when lidBedChamfer is applied', () => {
    const paramsNoChamfer = cloneParams(DEFAULT_PARAMS);
    paramsNoChamfer.lidBedChamfer = 0;
    paramsNoChamfer.lidTopChamfer = 0;
    const lidWithout = lid(paramsNoChamfer);

    const paramsChamfer = cloneParams(DEFAULT_PARAMS);
    paramsChamfer.lidBedChamfer = 0.6;
    paramsChamfer.lidTopChamfer = 0;
    const lidWith = lid(paramsChamfer);

    expect(measureVolume(lidWith)).toBeLessThan(measureVolume(lidWithout));
  });

  it('reduces lid volume when lidTopChamfer is applied', () => {
    const paramsNoChamfer = cloneParams(DEFAULT_PARAMS);
    paramsNoChamfer.lidBedChamfer = 0;
    paramsNoChamfer.lidTopChamfer = 0;
    const lidWithout = lid(paramsNoChamfer);

    const paramsChamfer = cloneParams(DEFAULT_PARAMS);
    paramsChamfer.lidBedChamfer = 0;
    paramsChamfer.lidTopChamfer = 0.4;
    const lidWith = lid(paramsChamfer);

    expect(measureVolume(lidWith)).toBeLessThan(measureVolume(lidWithout));
  });

  it('chamfers wall mount flanges continuously when baseBedChamfer is active', () => {
    const pNo = cloneParams(DEFAULT_PARAMS);
    pNo.baseBedChamfer = 0;
    const flangesNo = flanges(pNo);

    const pWith = cloneParams(DEFAULT_PARAMS);
    pWith.baseBedChamfer = 0.6;
    const flangesWith = flanges(pWith);

    expect(measureVolume(flangesWith)).toBeLessThan(measureVolume(flangesNo));
  });
});
