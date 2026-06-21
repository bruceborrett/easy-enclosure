import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { subtract } from '@jscad/modeling/src/operations/booleans';
import { hull } from '@jscad/modeling/src/operations/hulls';
import { rotateX, translate } from '@jscad/modeling/src/operations/transforms';
import { cuboid } from '@jscad/modeling/src/primitives';
import { degToRad } from '@jscad/modeling/src/utils';

import { Params } from '../params';

const MARGIN = 2; // boss material around/behind the slot (also keeps the interior intact)
const SLOT_DEPTH_CLEARANCE = 0.4; // vertical play so the rail slides/snaps
const SLOT_WIDTH_CLEARANCE = 0.5; // horizontal play on brim & crown
const HULL_EPSILON = 0.1; // thin slab thickness; over-extends ends so the slot breaks through

/**
 * The top-hat slot cutter (a trapezoidal prism along the rail axis X), built in
 * canonical orientation where the slot mouth faces -Z (outward) and the closed
 * chamber sits deeper (toward +Z / the enclosure wall).
 *
 * It is an UNDERCUT: the mouth is narrow (= dinRailCrownWidth, so the rail's
 * crown passes through) and it widens inward to a chamber (= dinRailWidth,
 * which holds the rail's wider base/brim). The brim cannot pass back through
 * the narrower mouth, so the rail is retained (snap-in fit).
 */
export const dinRailChannel = (params: Params): Geom3 => {
  const { dinRailWidth, dinRailCrownWidth, dinRailDepth, dinRailLength } = params;

  const slotDepth = dinRailDepth + SLOT_DEPTH_CLEARANCE;
  const bossThickness = dinRailDepth + MARGIN;
  const mouthZ = -bossThickness; // outer face — narrow throat
  const chamberZ = mouthZ + slotDepth; // deep — wide brim chamber
  const len = dinRailLength + 2 * HULL_EPSILON; // over-extend so both ends cut open

  return hull(
    cuboid({
      center: [0, 0, mouthZ],
      size: [len, dinRailCrownWidth + SLOT_WIDTH_CLEARANCE, HULL_EPSILON],
    }),
    cuboid({
      center: [0, 0, chamberZ],
      size: [len, dinRailWidth + SLOT_WIDTH_CLEARANCE, HULL_EPSILON],
    }),
  );
};

/**
 * Boss with the top-hat slot carved through it, built in canonical orientation:
 * the slot mouth faces -Z (outward), the flush face sits at z = 0, the channel
 * runs along X (rail axis) and the rail width spans Y.
 */
const dinBoss = (params: Params): Geom3 => {
  const { dinRailWidth, dinRailDepth, dinRailLength } = params;

  const bossAcrossRail = dinRailWidth + 2 * MARGIN; // Y — fits the brim chamber + walls
  const bossThickness = dinRailDepth + MARGIN; // Z (material behind the chamber >= MARGIN)

  const boss = cuboid({
    center: [0, 0, -bossThickness / 2],
    size: [dinRailLength, bossAcrossRail, bossThickness],
  });

  return subtract(boss, dinRailChannel(params));
};

/**
 * DIN rail (TH35) mount: a slotted boss placed on the chosen face so a standard
 * 35 mm top-hat rail snaps in and is retained by the undercut mouth. `bottom`
 * protrudes below the floor; `back` protrudes behind the back wall (needs
 * height >= dinRailWidth + 2 * MARGIN).
 */
export const dinRailMount = (params: Params): Geom3 => {
  const { width, length, height } = params;
  const boss = dinBoss(params);

  if (params.dinRailSurface === 'back') {
    // rotateX(-90) maps the canonical outward (-Z) onto the back wall's outward (-Y).
    return translate([width / 2, 0, height / 2], rotateX(degToRad(-90), boss));
  }

  // 'bottom' (default): canonical outward (-Z) is already the floor's outward direction.
  return translate([width / 2, length / 2, 0], boss);
};
