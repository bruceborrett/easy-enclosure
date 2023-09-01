import { rotateX, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';
import { cylinder } from '@jscad/modeling/src/primitives';
import { union } from '@jscad/modeling/src/operations/booleans';

import { Params } from '../params';

const cableGland = (r: number, h: number) => {
  return rotateX(degToRad(90), cylinder({radius: r, height: h}))
}

export const cableGlandHoles = (params: Params) => {
  const { length, width, wall, cableGlands, cableGlandWidth } = params
  const spacing = length / (cableGlands + 1)
  let result = []
  for (let i = 0; i < cableGlands; i++) {
    result.push(translate([spacing * (i + 1), -(wall*2), 0], cableGland(cableGlandWidth/2, wall*4)))
  }
  return translate([0,width+10,0], union(result))
}