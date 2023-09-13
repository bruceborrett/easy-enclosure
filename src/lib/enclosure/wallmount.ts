import { translate } from "@jscad/modeling/src/operations/transforms"
import { subtract, union } from "@jscad/modeling/src/operations/booleans"
import { hull } from "@jscad/modeling/src/operations/hulls"
import { cube, cuboid, cylinder } from "@jscad/modeling/src/primitives"
import { rotateY, mirrorX } from "@jscad/modeling/src/operations/transforms"

import { Params } from "../params"

export const flange = () => {
  const outer = hull(
    cube({size: 10}),
    translate([-5,0,0], cylinder({height: 10, radius: 5}))
  )

  const inner = hull(
    cuboid({size: [6,6,8]}),
    translate([-5,0,0], cylinder({height: 8, radius: 3}))
  )

  return subtract(
    outer,
    translate([0,0,2], inner),
    translate([-8,0,10], rotateY(45, cube({size: 20}))),
    translate([-5,0,0], cylinder({height: 10, radius: 2}))
  )
}

export const flanges = (params: Params) => {
  const { length, width, height, cornerRadius } = params
  return union(
    translate([-(cornerRadius), cornerRadius*2.5, -((height/2)-5)], flange()),
    translate([-cornerRadius, length-(cornerRadius*2.5), -((height/2)-5)], flange()),
    translate([width+cornerRadius, cornerRadius*2.5, -((height/2)-5)], mirrorX(flange())),
    translate([width+cornerRadius, length-(cornerRadius*2.5), -((height/2)-5)], mirrorX(flange()))
  )
}