import { rotateX, rotate, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';
import { cylinder } from '@jscad/modeling/src/primitives';
import { union } from '@jscad/modeling/src/operations/booleans';

import { Params } from '../params';
import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { Vec3 } from '@jscad/modeling/src/maths/types';

export const cableGlandHoles = (params: Params) => {
  const { length, width, height, wall, floor, insertThickness, cableGlandSpecs } = params

  let result: Geom3[] = []
  for (let wallNum = 0; wallNum <= 3; wallNum++) {
    const holes = cableGlandSpecs.filter((spec) => {
      if (spec[0] === wallNum) {
        return cylinder({radius: spec[1]/2, height: wall*6})
      } else {
        return false
      }
    })

    holes.forEach((hole, i) => {
      let x: number
      let y: number
      let rot: Vec3
      let spacing: number

      const z = -(height/2) + hole[1] + floor

      if (wallNum === 0) {
        spacing = width / (holes.length + 1)
        y = length
        x = spacing * (i + 1)
        rot = [degToRad(90),0,0]
      } else if (wallNum === 1) {
        spacing = length / (holes.length + 1)
        x = insertThickness + (wall*2)
        y = spacing * (i + 1)
        rot = [0,degToRad(90),0]
      } else if (wallNum === 2) {
        spacing = width / (holes.length + 1)
        y = insertThickness + (wall*2)
        x = spacing * (i + 1)
        rot = [degToRad(90),0,0]
      } else {
        spacing = length / (holes.length + 1)
        x = width
        y = spacing * (i + 1)
        rot = [0,degToRad(90),0]
      }

      result.push(translate([x, y, z], rotate(rot, cylinder({radius: hole[1]/2, height: insertThickness + (wall*2) + 5}))))
    })
  }

  return union(result)
}