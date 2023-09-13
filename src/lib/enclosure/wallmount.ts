import { translate } from "@jscad/modeling/src/operations/transforms"
import { subtract, union } from "@jscad/modeling/src/operations/booleans"
import { hull } from "@jscad/modeling/src/operations/hulls"
import { cube, cuboid, cylinder } from "@jscad/modeling/src/primitives"
import { rotateY, mirrorX } from "@jscad/modeling/src/operations/transforms"

import { Params } from "../params"

export const flange = (diameter: number) => {
  const outer = hull(
    cube({size: diameter+8}),
    translate([-(diameter+8)/2,0,0], cylinder({height: diameter+8, radius: (diameter/2)+4}))
  )

  const inner = hull(
    cuboid({size: [diameter+4,diameter+4,diameter+4]}),
    translate([-(diameter+8)/2,0,0], cylinder({height: diameter+4, radius: (diameter/2)+2}))
  )

  return subtract(
    outer,
    translate([0,0,2], inner),
    translate([-(diameter+4),0,18], rotateY(45, cube({size: diameter+25}))),
    translate([-(diameter+8)/2,0,0], cylinder({height: diameter+8, radius: diameter/2}))
  )
}

export const flanges = (params: Params) => {
  const { length, width, height, cornerRadius, wallMountScrewDiameter } = params
  const z = -(height/2) + ((wallMountScrewDiameter+8)/2)
  const cornerSpacing = cornerRadius + ((wallMountScrewDiameter+8)/2)
  return union(
    translate([-(cornerRadius), cornerSpacing, z], flange(wallMountScrewDiameter)),
    translate([-cornerRadius, length-cornerSpacing, z], flange(wallMountScrewDiameter)),
    translate([width+cornerRadius, cornerSpacing, z], mirrorX(flange(wallMountScrewDiameter))),
    translate([width+cornerRadius, length-cornerSpacing, z], mirrorX(flange(wallMountScrewDiameter)))
  )
}