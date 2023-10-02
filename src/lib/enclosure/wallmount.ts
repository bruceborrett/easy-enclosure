import { translate } from "@jscad/modeling/src/operations/transforms"
import { subtract, union } from "@jscad/modeling/src/operations/booleans"
import { hull } from "@jscad/modeling/src/operations/hulls"
import { cube, cuboid, cylinder } from "@jscad/modeling/src/primitives"
import { rotateY, mirrorX } from "@jscad/modeling/src/operations/transforms"

import { Params } from "../params"

const SCREWCLEARANCE = 2
const RIDGEWIDTH = 2
const FLOOR = 2

export const flange = (screwDiameter: number) => {
  const outerWidth = screwDiameter+(SCREWCLEARANCE*2)+(RIDGEWIDTH*2)
  const innerWidth = screwDiameter+(SCREWCLEARANCE*2)

  const outer = hull(
    cuboid({
      size: [outerWidth/2, outerWidth, outerWidth]
    }),
    translate(
      [
        -(outerWidth/2),0,0
      ], 
      cylinder({
        height: outerWidth, 
        radius: outerWidth/2
      })
    )
  )

  const inner = hull(
    cuboid({
      size: [innerWidth/2, innerWidth, innerWidth]
    }),
    translate(
      [
        -(innerWidth/2)-(SCREWCLEARANCE*2),0,0
      ], 
      cylinder({
        height: innerWidth, 
        radius: innerWidth/2
      })
    )
  )

  return subtract(
    outer,
    translate([RIDGEWIDTH,0,FLOOR], inner),
    translate([-outerWidth,0,outerWidth], rotateY(45, cube({size: outerWidth*2}))),
    translate([-outerWidth/2,0,0], cylinder({height: outerWidth, radius: screwDiameter/2}))
  )
}

export const flanges = (params: Params) => {
  const { length, width, cornerRadius, wallMountScrewDiameter } = params
  const outerWidth = wallMountScrewDiameter+(SCREWCLEARANCE*2)+(RIDGEWIDTH*2)
  const cornerSpacing = cornerRadius+(outerWidth/2)
  const z = outerWidth/2
  return union(
    translate([-RIDGEWIDTH, cornerSpacing, z], flange(wallMountScrewDiameter)),
    translate([-RIDGEWIDTH, length-cornerSpacing, z], flange(wallMountScrewDiameter)),
    translate([width+RIDGEWIDTH, cornerSpacing, z], mirrorX(flange(wallMountScrewDiameter))),
    translate([width+RIDGEWIDTH, length-cornerSpacing, z], mirrorX(flange(wallMountScrewDiameter)))
  )
}