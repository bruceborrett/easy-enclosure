import { translate } from "@jscad/modeling/src/operations/transforms";
import { Params, PCBMount } from "../params";
import { cylinder } from "@jscad/modeling/src/primitives";
import { subtract, union } from "@jscad/modeling/src/operations/booleans";
import { Geom3 } from "@jscad/modeling/src/geometries/types";

export const pcbMount = (mountParams: PCBMount) => {
  return subtract(
    cylinder({
      height: mountParams.height, radius: mountParams.outerDiameter / 2, segments: 20
    }),
    cylinder({
      height: mountParams.height, radius: mountParams.screwDiameter / 2, segments: 20
    })
  )
}

export const pcbMounts = (params: Params) => {
  const { pcbMounts, length, width, floor } = params
  
  const mounts: Geom3[] = []

  pcbMounts.forEach((mount) => {
    const z = (mount.height/2) + floor
    mounts.push(translate([(width/2)-mount.x, (length/2)-mount.y, z], pcbMount(mount)))
  })

  return union(mounts)
}