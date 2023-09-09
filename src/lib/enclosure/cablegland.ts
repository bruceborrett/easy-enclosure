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
  const { length, width, wall, screws, cornerRadius, cableGlands, cableGlandWidth } = params

  let spacing
  let pos: Vec3

  if (screws) {
    spacing = (length-(cornerRadius*2)) / (cableGlands + 1)
    pos = [cornerRadius, width, 0]
  } else {
    spacing = length / (cableGlands + 1)
    pos = [0, width, 0]
  }

  let result = []
  for (let i = 0; i < cableGlands; i++) {
    result.push(translate([spacing * (i + 1), -wall*3, wall*1.5], cableGland(cableGlandWidth/2, wall*6)))
  }

  return translate(pos, union(result))
}