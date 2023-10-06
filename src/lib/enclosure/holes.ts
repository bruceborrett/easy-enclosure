import { rotate, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';
import { cube, cuboid, cylinder } from '@jscad/modeling/src/primitives';
import { union } from '@jscad/modeling/src/operations/booleans';

import { Params } from '../params';
import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { Vec3 } from '@jscad/modeling/src/maths/types';
import { Surface, SURFACES } from '.';

export const holes = (params: Params, surfacesFilter: Surface[] = ['bottom', 'left', 'right', 'back', 'front']) => {
  const { length, width, wall, floor, insertThickness, insertClearance, holes: holeParams } = params
 
  let result: Geom3[] = []
  SURFACES.forEach((surface) => {
    const surfaceHoles = holeParams.filter((spec) => {
      if (surfacesFilter.includes(surface) && spec.surface === surface) {
        return spec
      } else {
        return false
      }
    })

    surfaceHoles.forEach((hole, i) => {
      let x: number
      let y: number
      let z: number
      let rot: Vec3
      // let spacing: number
      let center: number

      const totalWallThickness = insertThickness  + (insertClearance*2) + (wall*2)

      if (hole.shape === 'circle') {
        center = hole.diameter/2
      } else if (hole.shape === 'square') {
        center = hole.width/2
      } else {
        center = hole.length/2
      }

      if (surface === 'front') {
        // spacing = width / (holes.length + 1)
        y = length - (totalWallThickness/2)
        // x = spacing * (i + 1)
        x = hole.y
        z = center + floor + hole.x
        rot = [degToRad(90),0,0]
      } else if (surface === 'right') {
        // spacing = length / (holes.length + 1)
        x = totalWallThickness / 2
        // y = spacing * (i + 1)
        y = hole.y
        z = center + floor + hole.x
        rot = [0,degToRad(90),0]
      } else if (surface === 'back') {
        // spacing = width / (holes.length + 1)
        y = totalWallThickness / 2
        // x = spacing * (i + 1)
        x = hole.y
        z = center + floor + hole.x
        rot = [degToRad(90),0,0]
      } else if (surface === 'left') {
        // spacing = length / (holes.length + 1)
        x = width - (totalWallThickness/2)
        // y = spacing * (i + 1)
        y = hole.y
        z = center + floor + hole.x
        rot = [0,degToRad(90),0]
      } else if (surface === 'bottom' || surface === 'top') {
        // spacing = width / (holes.length + 1)
        y = center + hole.y
        x = center + hole.x
        z = 0
        rot = [0,0,0]
      } else {
        throw new Error(`Invalid surface: ${surface}`)
      }

      if (hole.shape === 'square') {
        result.push(translate([x, y, z], cube({size: hole.width})))
      } else if (hole.shape === 'rectangle') {
        result.push(translate([x, y, z], cuboid({size: [hole.width, totalWallThickness, hole.length]})))
      } else if (hole.shape === 'circle') {
        result.push(translate([x, y, z], rotate(rot, cylinder({radius: hole.diameter/2, height: totalWallThickness}))))
      }
    })
  })

  return union(result)
}