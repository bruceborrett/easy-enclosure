import { Injectable, signal } from '@angular/core';
import type { Geom3 } from '@jscad/modeling/src/geometries/types';

import {
  DEFAULT_EXPORT_FORMATS,
  type ExportFormatDefinition,
  type ExportFormatOptions,
} from './export-format';

@Injectable({
  providedIn: 'root',
})
export class ExportFormatService {
  private readonly _formats = signal<readonly ExportFormatDefinition[]>(DEFAULT_EXPORT_FORMATS);
  readonly formats = this._formats.asReadonly();

  getFormat(id: string): ExportFormatDefinition | undefined {
    return this._formats().find((f) => f.id === id);
  }

  getFormatOrThrow(id: string): ExportFormatDefinition {
    const format = this.getFormat(id);
    if (!format) {
      const available = this._formats()
        .map((f) => f.id)
        .join(', ');
      throw new Error(`Unsupported export format: "${id}". Supported formats: ${available}`);
    }
    return format;
  }

  registerFormat(format: ExportFormatDefinition): void {
    const current = this._formats();
    const existingIndex = current.findIndex((f) => f.id === format.id);
    if (existingIndex >= 0) {
      const updated = [...current];
      updated[existingIndex] = format;
      this._formats.set(updated);
    } else {
      this._formats.set([...current, format]);
    }
  }

  unregisterFormat(id: string): boolean {
    const current = this._formats();
    const filtered = current.filter((f) => f.id !== id);
    if (filtered.length !== current.length) {
      this._formats.set(filtered);
      return true;
    }
    return false;
  }

  resetFormats(): void {
    this._formats.set(DEFAULT_EXPORT_FORMATS);
  }

  serialize(formatId: string, geometry: Geom3, options?: ExportFormatOptions): Blob {
    const format = this.getFormatOrThrow(formatId);
    const output = format.serialize(geometry, options);
    if (output instanceof Blob) {
      return output;
    }
    const parts = Array.isArray(output) ? output : [output];
    return new Blob(parts as BlobPart[], { type: format.mimeType });
  }
}
