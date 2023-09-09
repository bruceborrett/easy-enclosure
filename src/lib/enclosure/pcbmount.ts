import { translate } from "@jscad/modeling/src/operations/transforms";
import { Params } from "../params";
import { cylinder } from "@jscad/modeling/src/primitives";
import { subtract, union } from "@jscad/modeling/src/operations/booleans";

const HEIGHT = 5
const RADIUS = 3

export const pcbMount = () => {
  return subtract(
    cylinder({height: HEIGHT, radius: 5, segments: 20}),
    cylinder({height: HEIGHT, radius: 1.5, segments: 20})
  )
}

export const pcbMounts = (params: Params) => {
  const { pcbMounts, length, width, height, wall } = params;
  
  const mounts = []

  for (let i = 0; i < pcbMounts; i++) {
    const [x, y] = params.pcbMountXY[i]
    const z = -(height/2) + wall + HEIGHT
    mounts.push(
      translate([(length/2)-x, (width/2)-y, z], pcbMount())
    )
  }

  return translate([0,0,wall], union(mounts))
}