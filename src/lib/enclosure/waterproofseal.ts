import { Params } from '../params'

import { cloverFrame } from './utils'

import { translate } from '@jscad/modeling/src/operations/transforms'

const CLEARANCE = 0.04
const LIDSEALHEIGHT = 5

export const waterProofSealCutout = (params: Params) => {
  const { length, width, height, wall, cornerRadius } = params
  return translate(
    [wall,wall,(height/2)-wall],
    cloverFrame(width-(wall*2), length-(wall*2), (wall*2)+LIDSEALHEIGHT+CLEARANCE, wall, cornerRadius)
  )
}

export const waterProofSeal = (params: Params) => {
  const { length, width, wall, cornerRadius } = params
  return cloverFrame((width-(wall*2))-CLEARANCE, (length-(wall*2))-CLEARANCE, wall, wall-CLEARANCE, cornerRadius)
}