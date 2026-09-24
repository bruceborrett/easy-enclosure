import { subtract } from '@jscad/modeling/src/operations/booleans';
import { extrudeLinear } from '@jscad/modeling/src/operations/extrusions';
import { hull } from '@jscad/modeling/src/operations/hulls';
import { rotateZ, translate } from '@jscad/modeling/src/operations/transforms';
import { circle, rectangle } from '@jscad/modeling/src/primitives';
import { degToRad } from '@jscad/modeling/src/utils';

export const roundedCube2d = (l: number, w: number, r = 8, s = 100) => {
  const c = circle({
    radius: r,
    segments: s,
  });

  return hull(
    translate([r, r], c),
    translate([l - r, r], c),
    translate([r, w - r], c),
    translate([l - r, w - r], c),
  );
};

export const roundedCube = (l: number, w: number, h: number, r = 8, s = 100) => {
  return extrudeLinear({ height: h }, roundedCube2d(l, w, r, s));
};

export const roundedFrame2d = (l: number, w: number, t: number, r = 8, s = 100) => {
  const outer = roundedCube2d(l, w, r, s);
  const inner = roundedCube2d(l - t * 2, w - t * 2, r, s);
  return subtract(outer, translate([t, t], inner));
};

export const roundedFrame = (l: number, w: number, h: number, t: number, r = 8, s = 100) => {
  return extrudeLinear({ height: h }, roundedFrame2d(l, w, t, r, s));
};

export const hollowRoundCube = (l: number, w: number, h: number, t: number, r = 8, s = 100) => {
  const outer = roundedCube(l, w, h, r, s);
  const inner = roundedCube(l - t * 2, w - t * 2, h, r, s);
  return subtract(outer, translate([t, t, t], inner));
};

const roundedCorner2d = (r: number, s = 100) => {
  return subtract(
    rectangle({ size: [r * 2, r * 2] }),
    translate([r, r], roundedCube2d(r, r, r, s)),
    translate([r * 2, 0], rectangle({ size: [r * 2, r * 2] })),
  );
};

export const clover2d = (l: number, w: number, r = 8, s = 100) => {
  const cornersRemoved = subtract(
    roundedCube2d(l, w, r, s),
    translate([0, 0], roundedCube2d(r, r, r, s)),
    translate([l - r, 0], roundedCube2d(r, r, r, s)),
    translate([0, w - r], roundedCube2d(r, r, r, s)),
    translate([l - r, w - r], roundedCube2d(r, r, r, s)),
  );
  const rc = roundedCorner2d(r, s);
  const rounded = subtract(
    cornersRemoved,
    translate([0, r * 2], rotateZ(degToRad(0), rc)),
    translate([r * 2, 0], rotateZ(degToRad(0), rc)),
    translate([l, r * 2], rotateZ(degToRad(90), rc)),
    translate([l - r * 2, 0], rotateZ(degToRad(90), rc)),
    translate([l, w - r * 2], rotateZ(degToRad(180), rc)),
    translate([l - r * 2, w], rotateZ(degToRad(180), rc)),
    translate([0, w - r * 2], rotateZ(degToRad(270), rc)),
    translate([r * 2, w], rotateZ(degToRad(270), rc)),
  );
  return rounded;
};

export const clover = (l: number, w: number, h: number, r = 8, s = 100) => {
  return extrudeLinear({ height: h }, clover2d(l, w, r, s));
};

export const cloverFrame2d = (l: number, w: number, t: number, r = 8, s = 100) => {
  const outer = clover2d(l, w, r, s);
  const inner = clover2d(l - t * 2, w - t * 2, r, s);
  return subtract(outer, translate([t, t], inner));
};

export const cloverFrame = (l: number, w: number, h: number, t: number, r = 8, s = 100) => {
  return extrudeLinear({ height: h }, cloverFrame2d(l, w, t, r, s));
};
