import { union } from "@jscad/modeling/src/operations/booleans";
import { Params } from "../params";

import { cylinder } from '@jscad/modeling/src/primitives';
import { translate } from "@jscad/modeling/src/operations/transforms";

export const screws = (params: Params) => {
  const { length, width, height, wall, cornerRadius, screwDiameter } = params
  return union(
    translate([cornerRadius+wall, cornerRadius+wall, height/2], cylinder({radius: screwDiameter/2, height: height})),
    translate([width-cornerRadius-wall, cornerRadius+wall, height/2], cylinder({radius: screwDiameter/2, height: height})),
    translate([cornerRadius+wall, length-cornerRadius-wall, height/2], cylinder({radius: screwDiameter/2, height: height})),
    translate([width-cornerRadius-wall, length-cornerRadius-wall, height/2], cylinder({radius: screwDiameter/2, height: height})),
  )
}