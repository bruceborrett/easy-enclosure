import { rotateX, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';
import { cylinder } from '@jscad/modeling/src/primitives';
import { union } from '@jscad/modeling/src/operations/booleans';

import { Params } from '../params';
import { Vec3 } from '@jscad/modeling/src/maths/vec3';

const cableGland = (r: number, h: number) => {
  return rotateX(degToRad(90), cylinder({radius: r, height: h}))
}

export const cableGlandHoles = (params: Params) => {
  const { length, width, height, wall, floor, screws, cornerRadius, cableGlands, cableGlandWidth } = params

  let spacing
  let pos: Vec3

  if (screws) {
    spacing = (width-(cornerRadius*2)) / (cableGlands + 1)
    pos = [cornerRadius, length, 0]
  } else {
    spacing = width / (cableGlands + 1)
    pos = [0, length, 0]
  }

  let result = []
  let z = -(height/2) + floor + cableGlandWidth
  for (let i = 0; i < cableGlands; i++) {
    result.push(translate([spacing * (i + 1), -wall*3, z], cableGland(cableGlandWidth/2, wall*6)))
  }

  return translate(pos, union(result))
}