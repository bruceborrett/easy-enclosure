import { TestBed } from '@angular/core/testing';
import { cuboid } from '@jscad/modeling/src/primitives';

import { ExportFormatService } from './export-format.service';
import type { ExportFormatDefinition } from './export-format';

describe('ExportFormatService', () => {
  let service: ExportFormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExportFormatService],
    });
    service = TestBed.inject(ExportFormatService);
  });

  it('initializes with default formats (STL and STEP)', () => {
    const formats = service.formats();
    expect(formats.length).toBe(2);
    expect(formats.map((f) => f.id)).toEqual(['stl', 'step']);
  });

  it('retrieves registered formats by ID', () => {
    const stl = service.getFormat('stl');
    expect(stl).toBeDefined();
    expect(stl?.extension).toBe('stl');
    expect(stl?.mimeType).toBe('model/stl');

    const step = service.getFormat('step');
    expect(step).toBeDefined();
    expect(step?.extension).toBe('step');
    expect(step?.mimeType).toBe('model/step');

    expect(service.getFormat('unknown')).toBeUndefined();
  });

  it('throws descriptive error on getFormatOrThrow for unknown formats', () => {
    expect(() => service.getFormatOrThrow('unknown-fmt')).toThrowError(
      /Unsupported export format: "unknown-fmt"/,
    );
  });

  it('serializes geometry to STL Blob with model/stl MIME type', async () => {
    const box = cuboid({ size: [10, 10, 10] });
    const blob = service.serialize('stl', box, { name: 'test-box' });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('model/stl');
    const text = await blob.text();
    expect(text).toContain('solid');
  });

  it('serializes geometry to STEP Blob with model/step MIME type', async () => {
    const box = cuboid({ size: [10, 10, 10] });
    const blob = service.serialize('step', box, { name: 'test-box' });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('model/step');
    const text = await blob.text();
    expect(text).toContain('ISO-10303-21;');
    expect(text).toContain('test-box');
  });

  it('allows registering a new format dynamically and updates the formats signal', async () => {
    const customFormat: ExportFormatDefinition = {
      id: 'mock-3mf',
      label: '3MF (Mock)',
      extension: '3mf',
      mimeType: 'model/3mf',
      description: '3D Manufacturing Format',
      serialize: () => 'mock 3mf content',
    };

    service.registerFormat(customFormat);

    expect(service.formats().map((f) => f.id)).toContain('mock-3mf');
    const blob = service.serialize('mock-3mf', cuboid({ size: [1, 1, 1] }));
    expect(blob.type).toBe('model/3mf');
    const content = await blob.text();
    expect(content).toBe('mock 3mf content');
  });

  it('supports formats that return an existing Blob directly from serialize', async () => {
    const customBlobFormat: ExportFormatDefinition = {
      id: 'direct-blob',
      label: 'Direct Blob',
      extension: 'bin',
      mimeType: 'application/octet-stream',
      serialize: () => new Blob(['raw-binary'], { type: 'application/custom' }),
    };

    service.registerFormat(customBlobFormat);
    const blob = service.serialize('direct-blob', cuboid({ size: [1, 1, 1] }));
    expect(blob.type).toBe('application/custom');
    expect(await blob.text()).toBe('raw-binary');
  });

  it('updates an existing format when registering with the same ID', () => {
    const updatedStl: ExportFormatDefinition = {
      id: 'stl',
      label: 'STL (Updated)',
      extension: 'stl',
      mimeType: 'model/stl',
      serialize: () => 'updated',
    };

    service.registerFormat(updatedStl);
    expect(service.getFormat('stl')?.label).toBe('STL (Updated)');
    expect(service.formats().length).toBe(2);
  });

  it('unregisters formats and resets to defaults', () => {
    expect(service.unregisterFormat('step')).toBeTrue();
    expect(service.formats().length).toBe(1);
    expect(service.getFormat('step')).toBeUndefined();

    expect(service.unregisterFormat('nonexistent')).toBeFalse();

    service.resetFormats();
    expect(service.formats().length).toBe(2);
    expect(service.getFormat('step')).toBeDefined();
  });
});
