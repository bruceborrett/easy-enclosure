import measureBoundingBox from '@jscad/modeling/src/measurements/measureBoundingBox';
import measureVolume from '@jscad/modeling/src/measurements/measureVolume';

import { base } from './enclosure/base';
import { lid } from './enclosure/lid';
import { DEFAULT_PARAMS, cloneParams, type Params } from './params';
import {
  convertDimension,
  convertHole,
  convertParams,
  formatMeasurement,
  inchesToMm,
  mmToInches,
  toMetricParams,
} from './units';

describe('Units & Measurement Conversion', () => {
  it('converts mm to inches and back accurately', () => {
    expect(mmToInches(25.4)).toBe(1);
    expect(inchesToMm(1)).toBe(25.4);

    expect(mmToInches(80)).toBe(3.1496);
    expect(inchesToMm(3.1496)).toBe(80);

    expect(mmToInches(100)).toBe(3.937);
    expect(inchesToMm(3.937)).toBe(100);

    expect(mmToInches(0.04)).toBe(0.0016);
    expect(inchesToMm(0.0016)).toBe(0.04);
  });

  it('converts common imperial fractions to exact mm values', () => {
    expect(inchesToMm(0.125)).toBe(3.175);
    expect(inchesToMm(0.25)).toBe(6.35);
    expect(inchesToMm(0.5)).toBe(12.7);
    expect(inchesToMm(2.0)).toBe(50.8);
  });

  it('returns original value when from and to systems match', () => {
    expect(convertDimension(42, 'metric', 'metric')).toBe(42);
    expect(convertDimension(42, 'imperial', 'imperial')).toBe(42);
  });

  it('formats measurements according to system', () => {
    expect(formatMeasurement(25.4, 'metric')).toBe('25.40 mm');
    expect(formatMeasurement(1, 'imperial')).toBe('1.00 in');
    expect(formatMeasurement(1.234, 'imperial', 3)).toBe('1.234 in');
  });

  it('converts a hole preserving rotation (angular) but scaling coordinates', () => {
    const original = {
      shape: 'circle' as const,
      surface: 'front' as const,
      x: 10,
      y: 20,
      diameter: 12.5,
      width: 10,
      length: 10,
      flatWidth: 11,
      rotation: 45,
    };

    const imperial = convertHole(original, 'metric', 'imperial');
    expect(imperial.rotation).toBe(45);
    expect(imperial.x).toBe(mmToInches(10));
    expect(imperial.y).toBe(mmToInches(20));
    expect(imperial.diameter).toBe(mmToInches(12.5));

    const roundtrip = convertHole(imperial, 'imperial', 'metric');
    expect(roundtrip.rotation).toBe(45);
    expect(roundtrip.x).toBe(10);
    expect(roundtrip.y).toBe(20);
    expect(roundtrip.diameter).toBe(12.5);
  });

  it('converts full params between metric and imperial preserving physical size', () => {
    const metric = cloneParams(DEFAULT_PARAMS);
    const imperial = convertParams(metric, 'imperial');

    expect(imperial.measurementSystem).toBe('imperial');
    expect(imperial.length).toBe(mmToInches(metric.length));
    expect(imperial.width).toBe(mmToInches(metric.width));
    expect(imperial.height).toBe(mmToInches(metric.height));
    expect(imperial.wall).toBe(mmToInches(metric.wall));
    expect(imperial.floor).toBe(mmToInches(metric.floor));
    expect(imperial.roof).toBe(mmToInches(metric.roof));
    expect(imperial.cornerRadius).toBe(mmToInches(metric.cornerRadius));

    // Non-linear dimensions remain unscaled
    expect(imperial.wallMountCount).toBe(metric.wallMountCount);
    expect(imperial.snapFit.preset).toBe(metric.snapFit.preset);
    expect(imperial.snapFit.endPercent).toBe(metric.snapFit.endPercent);
    expect(imperial.waterProof).toBe(metric.waterProof);

    const backToMetric = convertParams(imperial, 'metric');
    expect(backToMetric.measurementSystem).toBe('metric');
    expect(backToMetric.length).toBe(metric.length);
    expect(backToMetric.width).toBe(metric.width);
    expect(backToMetric.height).toBe(metric.height);
    expect(backToMetric.wall).toBe(metric.wall);
    expect(backToMetric.floor).toBe(metric.floor);
    expect(backToMetric.roof).toBe(metric.roof);
    expect(backToMetric.cornerRadius).toBe(metric.cornerRadius);
  });

  it('toMetricParams returns identical params for metric and converts imperial', () => {
    const metric = cloneParams(DEFAULT_PARAMS);
    expect(toMetricParams(metric)).toBe(metric);

    const imperial = convertParams(metric, 'imperial');
    const normalized = toMetricParams(imperial);
    expect(normalized.measurementSystem).toBe('metric');
    expect(normalized.length).toBe(metric.length);
    expect(normalized.width).toBe(metric.width);
    expect(normalized.height).toBe(metric.height);
  });

  it('switching systems preserves generated 3D solid geometry dimensions and volume', () => {
    const metric = cloneParams(DEFAULT_PARAMS);
    const imperial = convertParams(metric, 'imperial');

    const metricBaseSolid = base(toMetricParams(metric));
    const imperialBaseSolid = base(toMetricParams(imperial));

    const metricBox = measureBoundingBox(metricBaseSolid);
    const imperialBox = measureBoundingBox(imperialBaseSolid);

    expect(imperialBox[0][0]).toBeCloseTo(metricBox[0][0], 2);
    expect(imperialBox[0][1]).toBeCloseTo(metricBox[0][1], 2);
    expect(imperialBox[0][2]).toBeCloseTo(metricBox[0][2], 2);
    expect(imperialBox[1][0]).toBeCloseTo(metricBox[1][0], 2);
    expect(imperialBox[1][1]).toBeCloseTo(metricBox[1][1], 2);
    expect(imperialBox[1][2]).toBeCloseTo(metricBox[1][2], 2);

    const metricVolume = measureVolume(metricBaseSolid);
    const imperialVolume = measureVolume(imperialBaseSolid);
    expect(imperialVolume).toBeCloseTo(metricVolume, 0);

    const metricLidSolid = lid(toMetricParams(metric));
    const imperialLidSolid = lid(toMetricParams(imperial));
    expect(measureVolume(imperialLidSolid)).toBeCloseTo(measureVolume(metricLidSolid), 0);
  });
});
