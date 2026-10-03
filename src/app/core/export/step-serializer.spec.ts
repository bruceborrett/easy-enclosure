import { cuboid } from '@jscad/modeling/src/primitives';
import { union } from '@jscad/modeling/src/operations/booleans';
import { translate } from '@jscad/modeling/src/operations/transforms';
import { DEFAULT_PARAMS, cloneParams } from '../params';
import { lid } from '../enclosure/lid';
import { serialize } from './step-serializer';

describe('step-serializer', () => {
  it('serializes simple cuboid to standard ISO-10303-21 STEP text', () => {
    const box = cuboid({ size: [10, 20, 30] });
    const stepOutput = serialize({ name: 'test-box' }, box);

    expect(stepOutput).toBeDefined();
    expect(stepOutput).toContain('ISO-10303-21;');
    expect(stepOutput).toContain("FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));");
    expect(stepOutput).toContain("PRODUCT('test-box','test-box'");
    expect(stepOutput).toContain('CLOSED_SHELL');
    expect(stepOutput).toContain("FACETED_BREP('test-box'");
    expect(stepOutput).toContain('END-ISO-10303-21;');
  });

  it('heals T-junctions on intersecting boolean shapes', () => {
    const box1 = cuboid({ size: [20, 20, 10] });
    const box2 = translate([5, 5, 5], cuboid({ size: [10, 10, 10] }));
    const merged = union(box1, box2);

    const stepOutput = serialize({ name: 'stepped-shape' }, merged);
    expect(stepOutput).toContain('CLOSED_SHELL');
    expect(stepOutput).toContain('END-ISO-10303-21;');
  });

  it('serializes enclosure lid geometry into valid STEP output', () => {
    const params = cloneParams(DEFAULT_PARAMS);
    const lidGeometry = lid(params);
    const stepOutput = serialize({ name: 'enclosure-lid' }, lidGeometry);

    expect(stepOutput.length).toBeGreaterThan(1000);
    expect(stepOutput).toContain("FACETED_BREP('enclosure-lid'");
    expect(stepOutput).toContain('END-ISO-10303-21;');
  });
});
