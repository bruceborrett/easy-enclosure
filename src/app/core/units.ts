import {
  cloneParams,
  type CableClamp,
  type Hole,
  type InternalWall,
  type MeasurementSystem,
  type Params,
  type PCBMount,
} from './params';

export type { MeasurementSystem };

export const MM_PER_INCH = 25.4;

export const mmToInches = (mm: number): number => {
  if (typeof mm !== 'number' || Number.isNaN(mm)) return mm;
  return Number((mm / MM_PER_INCH).toFixed(4));
};

export const inchesToMm = (inches: number): number => {
  if (typeof inches !== 'number' || Number.isNaN(inches)) return inches;
  const raw = inches * MM_PER_INCH;
  const rounded2 = Number(raw.toFixed(2));
  if (Math.abs(raw - rounded2) < 0.002) {
    return rounded2;
  }
  const rounded3 = Number(raw.toFixed(3));
  if (Math.abs(raw - rounded3) < 0.002) {
    return rounded3;
  }
  return Number(raw.toFixed(4));
};

export const convertDimension = (
  value: number,
  from: MeasurementSystem,
  to: MeasurementSystem,
): number => {
  if (from === to) return value;
  return to === 'imperial' ? mmToInches(value) : inchesToMm(value);
};

export const formatMeasurement = (
  value: number,
  system: MeasurementSystem = 'metric',
  decimals?: number,
): string => {
  const isImp = system === 'imperial';
  const d = decimals ?? 2;
  return `${value.toFixed(d)} ${isImp ? 'in' : 'mm'}`;
};

export const convertHole = (hole: Hole, from: MeasurementSystem, to: MeasurementSystem): Hole => {
  if (from === to) return { ...hole };
  const conv = (v: number) => convertDimension(v, from, to);
  return {
    ...hole,
    x: conv(hole.x),
    y: conv(hole.y),
    diameter: conv(hole.diameter),
    width: conv(hole.width),
    length: conv(hole.length),
    flatWidth: hole.flatWidth !== undefined ? conv(hole.flatWidth) : undefined,
  };
};

export const convertPCBMount = (
  mount: PCBMount,
  from: MeasurementSystem,
  to: MeasurementSystem,
): PCBMount => {
  if (from === to) return { ...mount };
  const conv = (v: number) => convertDimension(v, from, to);
  return {
    ...mount,
    x: conv(mount.x),
    y: conv(mount.y),
    height: conv(mount.height),
    outerDiameter: conv(mount.outerDiameter),
    screwDiameter: conv(mount.screwDiameter),
  };
};

export const convertInternalWall = (
  wall: InternalWall,
  from: MeasurementSystem,
  to: MeasurementSystem,
): InternalWall => {
  if (from === to) return { ...wall };
  const conv = (v: number) => convertDimension(v, from, to);
  return {
    ...wall,
    x: conv(wall.x),
    y: conv(wall.y),
    height: conv(wall.height),
    length: conv(wall.length),
    thickness: conv(wall.thickness),
  };
};

export const convertCableClamp = (
  clamp: CableClamp,
  from: MeasurementSystem,
  to: MeasurementSystem,
): CableClamp => {
  if (from === to) return { ...clamp };
  const conv = (v: number) => convertDimension(v, from, to);
  return {
    ...clamp,
    x: conv(clamp.x),
    y: conv(clamp.y),
    length: conv(clamp.length),
    wallHeight: conv(clamp.wallHeight),
    wallThickness: conv(clamp.wallThickness),
    mountScrewDiameter: conv(clamp.mountScrewDiameter),
    mountOuterDiameter: conv(clamp.mountOuterDiameter),
    mountHeight: conv(clamp.mountHeight),
    topHeight: conv(clamp.topHeight),
    topScrewDiameter: conv(clamp.topScrewDiameter),
  };
};

export const convertParams = (params: Params, targetSystem: MeasurementSystem): Params => {
  const currentSystem = params.measurementSystem ?? 'metric';
  if (currentSystem === targetSystem) {
    return cloneParams(params);
  }

  const conv = (v: number) => convertDimension(v, currentSystem, targetSystem);

  return {
    ...cloneParams(params),
    measurementSystem: targetSystem,
    length: conv(params.length),
    width: conv(params.width),
    height: conv(params.height),
    floor: conv(params.floor),
    roof: conv(params.roof),
    wall: conv(params.wall),
    sealThickness: conv(params.sealThickness),
    insertThickness: conv(params.insertThickness),
    insertHeight: conv(params.insertHeight),
    insertClearance: conv(params.insertClearance),
    gridSpacing: conv(params.gridSpacing),
    cornerRadius: conv(params.cornerRadius),
    baseBedChamfer: conv(params.baseBedChamfer),
    lidBedChamfer: conv(params.lidBedChamfer),
    lidTopChamfer: conv(params.lidTopChamfer),
    wallMountScrewDiameter: conv(params.wallMountScrewDiameter),
    lidScrewDiameter: conv(params.lidScrewDiameter),
    baseLidScrewDiameter: conv(params.baseLidScrewDiameter),
    lidScrewHoleDepth: conv(params.lidScrewHoleDepth),
    lidScrewNutWidth: conv(params.lidScrewNutWidth),
    lidScrewNutDepth: conv(params.lidScrewNutDepth),
    lidScrewRecessDiameter: conv(params.lidScrewRecessDiameter),
    lidScrewRecessDepth: conv(params.lidScrewRecessDepth),
    dinRailMountWidth: conv(params.dinRailMountWidth),
    dinRailScrewDiameter: conv(params.dinRailScrewDiameter),
    snapFit: {
      ...params.snapFit,
      width: conv(params.snapFit.width),
      depth: conv(params.snapFit.depth),
      height: conv(params.snapFit.height),
      clearance: conv(params.snapFit.clearance),
    },
    pcbPreview: {
      ...params.pcbPreview,
      width: conv(params.pcbPreview.width),
      length: conv(params.pcbPreview.length),
      thickness: conv(params.pcbPreview.thickness),
      componentHeight: conv(params.pcbPreview.componentHeight),
      x: conv(params.pcbPreview.x),
      y: conv(params.pcbPreview.y),
    },
    holes: (params.holes ?? []).map((h) => convertHole(h, currentSystem, targetSystem)),
    pcbMounts: (params.pcbMounts ?? []).map((m) => convertPCBMount(m, currentSystem, targetSystem)),
    internalWalls: (params.internalWalls ?? []).map((w) =>
      convertInternalWall(w, currentSystem, targetSystem),
    ),
    cableClamps: (params.cableClamps ?? []).map((c) =>
      convertCableClamp(c, currentSystem, targetSystem),
    ),
  };
};

export const toMetricParams = (params: Params): Params => {
  if (params.measurementSystem !== 'imperial') {
    return params;
  }
  return convertParams(params, 'metric');
};
