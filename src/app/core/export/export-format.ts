import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import { serialize as serializeStl } from '@jscad/stl-serializer';

import { serialize as serializeStep } from './step-serializer';

export type ExportFormatId = 'stl' | 'step' | (string & {});

export interface ExportFormatOptions {
  readonly name?: string;
}

export type SerializerOutput = Blob | BlobPart | readonly BlobPart[];

export interface ExportFormatDefinition {
  readonly id: ExportFormatId;
  readonly label: string;
  readonly extension: string;
  readonly mimeType: string;
  readonly description?: string;
  serialize(geometry: Geom3, options?: ExportFormatOptions): SerializerOutput;
}

export const STL_FORMAT: ExportFormatDefinition = {
  id: 'stl',
  label: 'STL (Mesh)',
  extension: 'stl',
  mimeType: 'model/stl',
  description: 'Triangulated mesh for 3D printing slicers',
  serialize(geometry: Geom3): SerializerOutput {
    return serializeStl({ binary: false }, geometry);
  },
};

export const STEP_FORMAT: ExportFormatDefinition = {
  id: 'step',
  label: 'STEP (Solid CAD)',
  extension: 'step',
  mimeType: 'model/step',
  description: 'Faceted STEP (ISO-10303-21) for CAD modeling (FreeCAD, Fusion 360, SolidWorks)',
  serialize(geometry: Geom3, options?: ExportFormatOptions): SerializerOutput {
    return serializeStep({ name: options?.name ?? 'enclosure' }, geometry);
  },
};

export const DEFAULT_EXPORT_FORMATS: readonly ExportFormatDefinition[] = [STL_FORMAT, STEP_FORMAT];
