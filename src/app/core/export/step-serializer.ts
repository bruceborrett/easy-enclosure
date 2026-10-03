import { toPolygons } from '@jscad/modeling/src/geometries/geom3';
import type { Geom3 } from '@jscad/modeling/src/geometries/types';

/**
 * Minimal, dependency-free STEP (ISO-10303-21, AP214) serializer for JSCAD Geom3 geometry.
 *
 * The JSCAD geometry pipeline produces triangulated/faceted polygon meshes (no parametric
 * curved surfaces), so this serializer encodes the mesh honestly as a faceted
 * MANIFOLD_SOLID_BREP (FACETED_BREP): one planar FACE_SURFACE per mesh polygon, bounded by a
 * POLY_LOOP over shared CARTESIAN_POINTs, collected into a CLOSED_SHELL. Curved features are
 * therefore faceted exactly as they are in the existing STL export.
 *
 * Units are millimetres, matching the rest of the app.
 */

export interface StepSerializerOptions {
  /** Part/product name embedded in the STEP file. */
  name?: string;
}

type Vec3 = [number, number, number];

/** Coordinates are rounded to this many decimals to merge float noise between shared vertices. */
const COORD_DECIMALS = 8;

const round = (value: number): number => {
  const factor = 10 ** COORD_DECIMALS;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};

/** Format a number as a STEP `REAL` literal (must contain a decimal point). */
const formatReal = (value: number): string => {
  const safe = Number.isFinite(value) ? round(value) : 0;
  const [mantissa, exponent] = String(safe).toUpperCase().split('E');
  const withDot = mantissa.includes('.') ? mantissa : `${mantissa}.`;
  return exponent === undefined ? withDot : `${withDot}E${exponent}`;
};

/** Escape a string for embedding in a STEP string literal (ASCII only, '' for apostrophes). */
const formatString = (value: string): string =>
  // eslint-disable-next-line no-control-regex
  value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/[^\x20-\x7e]/g, '?');

const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const length = (v: Vec3): number => Math.hypot(v[0], v[1], v[2]);

const normalize = (v: Vec3): Vec3 => {
  const len = length(v);
  return [v[0] / len, v[1] / len, v[2] / len];
};

/** Robust polygon normal via Newell's method. Returns the unnormalized normal. */
const newellNormal = (vertices: Vec3[]): Vec3 => {
  const normal: Vec3 = [0, 0, 0];
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    normal[0] += (current[1] - next[1]) * (current[2] + next[2]);
    normal[1] += (current[2] - next[2]) * (current[0] + next[0]);
    normal[2] += (current[0] - next[0]) * (current[1] + next[1]);
  }
  return normal;
};

type Loop = Vec3[];

const vertexKey = (v: Vec3): string => `${v[0]},${v[1]},${v[2]}`;

/** Extract polygon loops with rounded coordinates, dropping degenerate polygons. */
const buildLoops = (geometry: Geom3): Loop[] => {
  const loops: Loop[] = [];
  for (const polygon of toPolygons(geometry)) {
    const vertices: Loop = [];
    for (const raw of polygon.vertices) {
      const vertex: Vec3 = [round(raw[0]), round(raw[1]), round(raw[2])];
      const previous = vertices[vertices.length - 1];
      if (!previous || vertexKey(vertex) !== vertexKey(previous)) {
        vertices.push(vertex);
      }
    }
    while (
      vertices.length > 1 &&
      vertexKey(vertices[0]) === vertexKey(vertices[vertices.length - 1])
    ) {
      vertices.pop();
    }
    if (vertices.length >= 3 && length(newellNormal(vertices)) > 1e-12) {
      loops.push(vertices);
    }
  }
  return loops;
};

/**
 * Heal T-junctions so the shell is combinatorially watertight.
 *
 * JSCAD boolean results are geometrically watertight but contain T-junctions: an edge of one
 * polygon may be subdivided into several shorter edges on the adjacent polygons. STEP
 * CLOSED_SHELLs are matched edge-to-edge, so we insert the existing subdivision vertices into
 * the longer edges they lie on. Only unmatched (boundary) edges need checking, and the only
 * candidate split points are endpoints of other unmatched edges.
 */
const healTJunctions = (loops: Loop[]): void => {
  for (let pass = 0; pass < 3; pass++) {
    const directed = new Set<string>();
    for (const loop of loops) {
      for (let i = 0; i < loop.length; i++) {
        directed.add(`${vertexKey(loop[i])}|${vertexKey(loop[(i + 1) % loop.length])}`);
      }
    }
    const isUnmatched = (a: Vec3, b: Vec3): boolean =>
      !directed.has(`${vertexKey(b)}|${vertexKey(a)}`);

    const candidates = new Map<string, Vec3>();
    for (const loop of loops) {
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % loop.length];
        if (isUnmatched(a, b)) {
          candidates.set(vertexKey(a), a);
          candidates.set(vertexKey(b), b);
        }
      }
    }
    if (candidates.size === 0) {
      return;
    }

    let changed = false;
    for (const loop of loops) {
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % loop.length];
        if (!isUnmatched(a, b)) {
          continue;
        }
        const edge = subtract(b, a);
        const edgeLengthSq = edge[0] ** 2 + edge[1] ** 2 + edge[2] ** 2;
        const onEdge: { t: number; vertex: Vec3 }[] = [];
        for (const candidate of candidates.values()) {
          const key = vertexKey(candidate);
          if (key === vertexKey(a) || key === vertexKey(b)) {
            continue;
          }
          const toCandidate = subtract(candidate, a);
          const t =
            (toCandidate[0] * edge[0] + toCandidate[1] * edge[1] + toCandidate[2] * edge[2]) /
            edgeLengthSq;
          if (t <= 1e-9 || t >= 1 - 1e-9) {
            continue;
          }
          const offLine: Vec3 = [
            toCandidate[0] - t * edge[0],
            toCandidate[1] - t * edge[1],
            toCandidate[2] - t * edge[2],
          ];
          if (length(offLine) < 1e-6) {
            onEdge.push({ t, vertex: candidate });
          }
        }
        if (onEdge.length > 0) {
          onEdge.sort((p, q) => p.t - q.t);
          loop.splice(i + 1, 0, ...onEdge.map((p) => p.vertex));
          i += onEdge.length;
          changed = true;
        }
      }
    }
    if (!changed) {
      return;
    }
  }
};

/** Group loops into connected components (via shared vertices) — one closed shell each. */
const splitComponents = (loops: Loop[]): Loop[][] => {
  const parent = loops.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const vertexOwner = new Map<string, number>();
  loops.forEach((loop, i) => {
    for (const vertex of loop) {
      const key = vertexKey(vertex);
      const owner = vertexOwner.get(key);
      if (owner === undefined) {
        vertexOwner.set(key, i);
      } else {
        parent[find(i)] = find(owner);
      }
    }
  });
  const components = new Map<number, Loop[]>();
  loops.forEach((loop, i) => {
    const root = find(i);
    const group = components.get(root);
    if (group) {
      group.push(loop);
    } else {
      components.set(root, [loop]);
    }
  });
  return [...components.values()];
};

/**
 * Serialize a JSCAD Geom3 to STEP part-21 text.
 * Emits a faceted BREP (AP214) STEP file.
 */
export const serialize = (options: StepSerializerOptions, geometry: Geom3): string => {
  const name = formatString(options.name ?? 'jscad-geometry');
  const lines: string[] = [];
  let nextId = 1;

  const add = (body: string): number => {
    const id = nextId++;
    lines.push(`#${id}=${body};`);
    return id;
  };

  // --- Geometry: shared vertices -> planar faces -> closed shell -> faceted brep ---
  const pointIds = new Map<string, number>();
  const pointId = (vertex: Vec3): number => {
    const coords = vertex.map(formatReal);
    const key = coords.join(',');
    let id = pointIds.get(key);
    if (id === undefined) {
      id = add(`CARTESIAN_POINT('',(${coords.join(',')}))`);
      pointIds.set(key, id);
    }
    return id;
  };

  const loops = buildLoops(geometry);
  healTJunctions(loops);

  const emitFace = (vertices: Loop): number | undefined => {
    const normal = newellNormal(vertices);
    const unitNormal = normalize(normal);

    // Reference direction: first edge with usable length (edges lie in the face plane).
    let refDirection: Vec3 | undefined;
    for (let i = 1; i < vertices.length; i++) {
      const edge = subtract(vertices[i], vertices[0]);
      if (length(edge) > 1e-9) {
        refDirection = normalize(edge);
        break;
      }
    }
    if (!refDirection) {
      return undefined;
    }

    const loopId = add(`POLY_LOOP('',(${vertices.map((v) => `#${pointId(v)}`).join(',')}))`);
    const boundId = add(`FACE_OUTER_BOUND('',#${loopId},.T.)`);
    const normalId = add(`DIRECTION('',(${unitNormal.map(formatReal).join(',')}))`);
    const refId = add(`DIRECTION('',(${refDirection.map(formatReal).join(',')}))`);
    const axisId = add(`AXIS2_PLACEMENT_3D('',#${pointId(vertices[0])},#${normalId},#${refId})`);
    const planeId = add(`PLANE('',#${axisId})`);
    return add(`FACE_SURFACE('',(#${boundId}),#${planeId},.T.)`);
  };

  // One FACETED_BREP per connected component so disjoint parts (e.g. separate PCB mounts)
  // each form their own closed shell.
  const brepIds: number[] = [];
  for (const component of splitComponents(loops)) {
    const faceIds: number[] = [];
    for (const vertices of component) {
      const faceId = emitFace(vertices);
      if (faceId !== undefined) {
        faceIds.push(faceId);
      }
    }
    if (faceIds.length === 0) {
      continue;
    }
    const shellId = add(`CLOSED_SHELL('',(${faceIds.map((id) => `#${id}`).join(',')}))`);
    brepIds.push(add(`FACETED_BREP('${name}',#${shellId})`));
  }

  // --- Representation context: millimetres, radians, steradians ---
  const lengthUnitId = add(`(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))`);
  const angleUnitId = add(`(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))`);
  const solidAngleUnitId = add(`(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())`);
  const uncertaintyId = add(
    `UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-6),#${lengthUnitId},` +
      `'distance_accuracy_value','confusion accuracy')`,
  );
  const contextId = add(
    `(GEOMETRIC_REPRESENTATION_CONTEXT(3)` +
      `GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${uncertaintyId}))` +
      `GLOBAL_UNIT_ASSIGNED_CONTEXT((#${lengthUnitId},#${angleUnitId},#${solidAngleUnitId}))` +
      `REPRESENTATION_CONTEXT('Context #1','3D Context'))`,
  );

  const originId = add(`CARTESIAN_POINT('',(0.,0.,0.))`);
  const zDirId = add(`DIRECTION('',(0.,0.,1.))`);
  const xDirId = add(`DIRECTION('',(1.,0.,0.))`);
  const placementId = add(`AXIS2_PLACEMENT_3D('',#${originId},#${zDirId},#${xDirId})`);
  const items = [placementId, ...brepIds].map((id) => `#${id}`).join(',');
  const representationId = add(
    `FACETED_BREP_SHAPE_REPRESENTATION('${name}',(${items}),#${contextId})`,
  );

  // --- Product structure ---
  const applicationContextId = add(
    `APPLICATION_CONTEXT('core data for automotive mechanical design processes')`,
  );
  add(
    `APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2010,` +
      `#${applicationContextId})`,
  );
  const productContextId = add(`PRODUCT_CONTEXT('',#${applicationContextId},'mechanical')`);
  const productId = add(`PRODUCT('${name}','${name}','',(#${productContextId}))`);
  add(`PRODUCT_RELATED_PRODUCT_CATEGORY('part',$,(#${productId}))`);
  const formationId = add(`PRODUCT_DEFINITION_FORMATION('','',#${productId})`);
  const definitionContextId = add(
    `PRODUCT_DEFINITION_CONTEXT('part definition',#${applicationContextId},'design')`,
  );
  const definitionId = add(
    `PRODUCT_DEFINITION('design','',#${formationId},#${definitionContextId})`,
  );
  const definitionShapeId = add(`PRODUCT_DEFINITION_SHAPE('','',#${definitionId})`);
  add(`SHAPE_DEFINITION_REPRESENTATION(#${definitionShapeId},#${representationId})`);

  const timestamp = new Date().toISOString().slice(0, 19);
  return [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION(('Faceted BREP geometry exported from easy-enclosure'),'2;1');",
    `FILE_NAME('${name}.step','${timestamp}',(''),(''),'easy-enclosure step-serializer',` +
      "'easy-enclosure','');",
    "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));",
    'ENDSEC;',
    'DATA;',
    ...lines,
    'ENDSEC;',
    'END-ISO-10303-21;',
    '',
  ].join('\n');
};
