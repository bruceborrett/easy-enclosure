import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { rotateX, rotateZ, translate } from '@jscad/modeling/src/operations/transforms';
import { cuboid, cylinder } from '@jscad/modeling/src/primitives';
import type { Geom3 } from '@jscad/modeling/src/geometries/types';

import { Params } from '../params';

const SCREWCLEARANCE = 2;
const RIDGEWIDTH = 2;

// Standard 35mm DIN rail (TH35/IEC 60715) dimensions
const DIN_RAIL_WIDTH = 35.0; // 35mm overall rail width
const DIN_RAIL_DEPTH = 7.5;  // 7.5mm rail depth
const DIN_LIP_WIDTH = 5.0;   // 5mm lip on each side
const DIN_LIP_THICKNESS = 1.0;

/**
 * Calculates the exact hole spacing and positions for the DIN rail mount
 * so that they line up perfectly with the enclosure's wall mounts.
 */
export const calculateDinRailHoles = (params: Params): {
  spacing: number;
  positions: number[];
  outerWidth: number;
  totalLength: number;
} => {
  const {
    length,
    width,
    cornerRadius,
    wallMountScrewDiameter,
    wallMountCount,
    dinRailOrientation,
  } = params;

  const outerWidth = wallMountScrewDiameter + SCREWCLEARANCE * 2 + RIDGEWIDTH * 2;
  const cornerSpacing = cornerRadius + outerWidth / 2;

  if (dinRailOrientation === 'vertical') {
    // DIN rail is vertical, clips run horizontally across width
    const spacing = width + 2 * RIDGEWIDTH + outerWidth;
    const totalLength = Math.max(50, spacing + outerWidth * 2);
    return {
      spacing,
      positions: [-spacing / 2, spacing / 2],
      outerWidth,
      totalLength,
    };
  }

  // Horizontal DIN rail (default): clips run vertically along enclosure length
  if (wallMountCount === 2) {
    const totalLength = Math.max(50, 40 + outerWidth * 2);
    return {
      spacing: 0,
      positions: [0],
      outerWidth,
      totalLength,
    };
  }

  // 4 wall mounts: outer holes spaced at length - 2 * cornerSpacing
  const spacing = Math.max(0, length - cornerSpacing * 2);
  const totalLength = Math.max(50, spacing + outerWidth * 2);
  return {
    spacing,
    positions: [-spacing / 2, 0, spacing / 2],
    outerWidth,
    totalLength,
  };
};

/**
 * Generates a single DIN rail mounting clip for standard 35mm DIN rail (TH35).
 * Features:
 * - Fixed hook on one side of the 35mm channel
 * - Flexible cantilever snap latch on the opposite side with lead-in chamfer
 * - Screwdriver release notch
 * - Top mounting plate with holes spaced to align with enclosure wall mounts
 * - Stiffening truss cutouts matching the reference design
 */
export const dinRailMount = (params: Params): Geom3 => {
  const {
    dinRailMountWidth = 15,
    dinRailScrewDiameter = 3.98,
    wallMountScrewDiameter = 3.98,
  } = params;

  const screwDiameter = dinRailScrewDiameter || wallMountScrewDiameter || 3.98;
  const { positions, totalLength } = calculateDinRailHoles(params);

  const mountWidth = Math.max(10, dinRailMountWidth);
  const clipLength = Math.max(totalLength, 52);
  const totalHeight = 16;
  const topPlateThickness = 4;
  const railChannelDepth = DIN_RAIL_DEPTH + 0.3; // 7.8mm recess

  // 1. Base solid block forming the mount body
  const bodyBlock = cuboid({
    size: [mountWidth, clipLength, totalHeight],
    center: [0, 0, totalHeight / 2],
  });

  const cuts: Geom3[] = [];

  // 2. DIN Rail 35mm central channel cutout (Y from -17.6 to +17.6)
  const halfRail = DIN_RAIL_WIDTH / 2 + 0.2; // 17.7mm
  cuts.push(
    cuboid({
      size: [mountWidth + 4, halfRail * 2, railChannelDepth],
      center: [0, 0, railChannelDepth / 2],
    }),
  );

  // 3. Cantilever Snap Latch Flex Slot (Side B: y around +17.5)
  // A vertical slot behind the latch arm to allow it to deflect outward
  const flexSlotThickness = 1.8;
  const flexSlotHeight = totalHeight - topPlateThickness + 1;
  cuts.push(
    cuboid({
      size: [mountWidth + 4, flexSlotThickness, flexSlotHeight],
      center: [0, halfRail + 3.2, flexSlotHeight / 2],
    }),
  );

  // 4. Screwdriver release notch at the bottom of the latch
  cuts.push(
    cuboid({
      size: [mountWidth - 4, 3, 4],
      center: [0, halfRail + 4.5, 2],
    }),
  );

  // 5. Lead-in chamfer for snap latch (angled cut so it pushes onto rail easily)
  cuts.push(
    translate(
      [0, halfRail, 0],
      rotateX(Math.PI / 4, cuboid({ size: [mountWidth + 4, 3, 3] })),
    ),
  );

  // 6. Undercuts beyond the 35mm rail channel towards the ends (lattice / rib pockets)
  const outerSpan = (clipLength - DIN_RAIL_WIDTH) / 2;
  if (outerSpan > 12) {
    const pocketLength = outerSpan - 8;
    const pocketHeight = totalHeight - topPlateThickness - 2;

    // Negative Y pocket
    cuts.push(
      cuboid({
        size: [mountWidth - 4, pocketLength, pocketHeight],
        center: [0, -halfRail - 4 - pocketLength / 2, pocketHeight / 2 + 1],
      }),
    );

    // Positive Y pocket
    cuts.push(
      cuboid({
        size: [mountWidth - 4, pocketLength, pocketHeight],
        center: [0, halfRail + 6 + pocketLength / 2, pocketHeight / 2 + 1],
      }),
    );
  }

  // 7. Mounting screw holes through the top plate
  for (const y of positions) {
    cuts.push(
      cylinder({
        height: totalHeight + 4,
        radius: screwDiameter / 2,
        center: [0, y, totalHeight / 2],
        segments: 32,
      }),
    );

    // Nut/head recess on bottom of top plate
    const nutRadius = (screwDiameter * 1.8) / 2;
    cuts.push(
      cylinder({
        height: totalHeight - topPlateThickness,
        radius: nutRadius,
        center: [0, y, (totalHeight - topPlateThickness) / 2],
        segments: 6,
      }),
    );
  }

  // 8. Fixed hook tooth addition: a lip overhang on Side A
  const hookTooth = cuboid({
    size: [mountWidth, 2.4, 2.0],
    center: [0, -halfRail + 1.2, railChannelDepth - 1.0],
  });

  // 9. Snap catch tooth addition: a ramp tooth on Side B
  const latchTooth = cuboid({
    size: [mountWidth, 1.8, 1.8],
    center: [0, halfRail - 0.9, railChannelDepth - 0.9],
  });

  const mainSolid = union(bodyBlock, hookTooth, latchTooth);
  return subtract(mainSolid, cuts);
};

/**
 * Generates a pair of DIN rail mounts placed next to each other for 3D printing.
 */
export const dinRailMountsPair = (params: Params): Geom3 => {
  const {
    dinRailMountWidth = 15,
    dinRailOrientation,
  } = params;
  const mountWidth = Math.max(10, dinRailMountWidth);
  const PAIR_GAP = 8;

  if (dinRailOrientation === 'vertical') {
    const singleMount = rotateZ(Math.PI / 2, dinRailMount(params));
    const yOffset = (mountWidth + PAIR_GAP) / 2;
    const topMount = translate([0, yOffset, 0], singleMount);
    const bottomMount = translate([0, -yOffset, 0], singleMount);
    return union(topMount, bottomMount);
  }

  const singleMount = dinRailMount(params);
  const xOffset = (mountWidth + PAIR_GAP) / 2;
  const leftMount = translate([-xOffset, 0, 0], singleMount);
  const rightMount = translate([xOffset, 0, 0], singleMount);

  return union(leftMount, rightMount);
};

/**
 * Returns a single DIN rail mount (used for STL export).
 */
export const dinRailMountGeometry = (params: Params): Geom3 => {
  return dinRailMount(params);
};
