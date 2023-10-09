import { rotate, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';
import { cuboid, cylinder } from '@jscad/modeling/src/primitives';
import { union } from '@jscad/modeling/src/operations/booleans';

import { Params } from '../params';
import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { Vec3 } from '@jscad/modeling/src/maths/types';
import { Surface, SURFACES } from '.';

export const holes = (
  params: Params, surfacesFilter: Surface[] = ['bottom', 'left', 'right', 'back', 'front']
) => {
  const { length, width, height, wall,
    insertThickness, insertClearance, holes: holeParams } = params
 
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

      const totalWallThickness = insertThickness  + (insertClearance*2) + (wall*2)

      if (surface === 'front') {
        y = length - (totalWallThickness/2)
        x = (width/2) - hole.y
        z = (height/2) + hole.x
        rot = [degToRad(90),0,0]
      } else if (surface === 'right') {
        x = totalWallThickness / 2
        y = (length/2) - hole.y
        z = (height/2) + hole.x
        if (hole.shape === 'circle') {
          rot = [0, degToRad(90), 0]
        } else {
          rot = [degToRad(90), 0, degToRad(90)]
        }
      } else if (surface === 'back') {
        y = totalWallThickness / 2
        x = (width/2) - hole.y
        z = (height/2) + hole.x
        rot = [degToRad(90),0,0]
      } else if (surface === 'left') {
        x = width - (totalWallThickness/2)
        y = (length/2) - hole.y
        z = (height/2) + hole.x
        if (hole.shape === 'circle') {
          rot = [0, degToRad(90), 0]
        } else {
          rot = [degToRad(90), 0, degToRad(90)]
        }
      } else if (surface === 'bottom' || surface === 'top') {
        y = (length/2) - hole.x
        x = (width/2) - hole.y
        z = 0
        rot = [0,0,0]
      } else {
        throw new Error(`Invalid surface: ${surface}`)
      }

      if (hole.shape === 'square') {
        result.push(translate([x, y, z], rotate(rot, cuboid({
          size: [hole.width, hole.width, totalWallThickness],
        }))))
      } else if (hole.shape === 'rectangle') {
        result.push(translate([x, y, z], rotate(rot, cuboid({
          size: [hole.width, hole.length, totalWallThickness],
        }))))
      } else if (hole.shape === 'circle') {
        result.push(translate([x, y, z], rotate(rot, cylinder({
          radius: hole.diameter / 2,
          height: totalWallThickness
        }))))
      }
    })
  })

  return union(result)
}