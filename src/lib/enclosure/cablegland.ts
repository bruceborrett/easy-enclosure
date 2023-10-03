import { rotate, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';
import { cube, cylinder } from '@jscad/modeling/src/primitives';
import { union } from '@jscad/modeling/src/operations/booleans';

import { Params } from '../params';
import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { Vec3 } from '@jscad/modeling/src/maths/types';

export const cableGlandHoles = (params: Params) => {
  const { length, width, wall, floor, insertThickness, insertClearance, cableGlands } = params

  let result: Geom3[] = []
  for (let wallNum = 0; wallNum <= 5; wallNum++) {
    const holes = cableGlands.filter((spec) => {
      if (spec.surface === wallNum) {
        return cylinder({radius: spec.diameter/2, height: wall*6})
      } else {
        return false
      }
    })

    holes.forEach((hole, i) => {
      let x: number
      let y: number
      let z: number
      let rot: Vec3
      let spacing: number


      const totalWallThickness = insertThickness  + (insertClearance*2) + (wall*2)

      if (wallNum === 0) {
        // spacing = width / (holes.length + 1)
        y = length - (totalWallThickness/2)
        // x = spacing * (i + 1)
        x = hole.y
        z = (hole.diameter/2) + floor + hole.x
        rot = [degToRad(90),0,0]
      } else if (wallNum === 1) {
        // spacing = length / (holes.length + 1)
        x = totalWallThickness / 2
        // y = spacing * (i + 1)
        y = hole.y
        z = (hole.diameter/2) + floor + hole.x
        rot = [0,degToRad(90),0]
      } else if (wallNum === 2) {
        // spacing = width / (holes.length + 1)
        y = totalWallThickness / 2
        // x = spacing * (i + 1)
        x = hole.y
        z = (hole.diameter/2) + floor + hole.x
        rot = [degToRad(90),0,0]
      } else if (wallNum === 3) {
        // spacing = length / (holes.length + 1)
        x = width - (totalWallThickness/2)
        // y = spacing * (i + 1)
        y = hole.y
        z = (hole.diameter/2) + floor + hole.x
        rot = [0,degToRad(90),0]
      } else if (wallNum === 4) {
        spacing = width / (holes.length + 1)
        y = hole.y
        x = hole.x
        z = 0
        rot = [0,0,0]
      } else {
        spacing = length / (holes.length + 1)
        x = width - (totalWallThickness/2)
        y = spacing * (i + 1)
        z = (hole.diameter/2) + floor + hole.x
        rot = [0,0,0]
      }

      if (hole.shape === 'square') {
        result.push(translate([x, y, z], cube({size: hole.diameter})))
      } else if (hole.shape === 'circle') {
        result.push(translate([x, y, z], rotate(rot, cylinder({radius: hole.diameter/2, height: totalWallThickness}))))
      }
    })
  }

  return union(result)
}