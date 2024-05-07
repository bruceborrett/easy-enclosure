import { union } from "@jscad/modeling/src/operations/booleans";

import { cylinder } from '@jscad/modeling/src/primitives';
import { translate } from "@jscad/modeling/src/operations/transforms";

export const screws = (length: number, width: number, height: number, offset: number, diameter: number) => {
  return union(
    translate([offset, offset, height/2], cylinder({radius: diameter/2, height: height})),
    translate([width-offset, offset, height/2], cylinder({radius: diameter/2, height: height})),
    translate([offset, length-offset, height/2], cylinder({radius: diameter/2, height: height})),
    translate([width-offset, length-offset, height/2], cylinder({radius: diameter/2, height: height})),
  )
}