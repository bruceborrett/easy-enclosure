import { translate } from "@jscad/modeling/src/operations/transforms";
import { Params } from "../params";
import { cylinder } from "@jscad/modeling/src/primitives";
import { subtract, union } from "@jscad/modeling/src/operations/booleans";

const HEIGHT = 5
const RADIUS = 3

export const pcbMount = (diameter: number) => {
  return subtract(
    cylinder({height: HEIGHT, radius: (diameter/2)+3, segments: 20}),
    cylinder({height: HEIGHT, radius: diameter/2, segments: 20})
  )
}

export const pcbMounts = (params: Params) => {
  const { pcbMounts, length, width, height, wall, floor, pcbMountScrewDiameter } = params;
  
  const mounts = []

  for (let i = 0; i < pcbMounts; i++) {
    const [x, y] = params.pcbMountXY[i]
    const z = -(height/2) + (HEIGHT/2) + floor
    mounts.push(
      translate([(width/2)-x, (length/2)-y, z], pcbMount(pcbMountScrewDiameter))
    )
  }

  return union(mounts)
}