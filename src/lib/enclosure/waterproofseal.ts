import { Params } from '../params'

import { roundedFrame } from './utils'

import { translate } from '@jscad/modeling/src/operations/transforms'

const CLEARANCE = 0.04
const LIDSEALHEIGHT = 5

export const waterProofSealCutout = (params: Params) => {
  const { length, width, height, wall, cornerRadius } = params
  return translate(
    [wall,wall,(height/2)-wall],
    roundedFrame(length-(wall*2), width-(wall*2), (wall*2)+LIDSEALHEIGHT+CLEARANCE, wall, cornerRadius)
  )
}

export const waterProofSeal = (params: Params) => {
  const { length, width, wall, cornerRadius } = params
  return roundedFrame((length-(wall*2))-CLEARANCE, (width-(wall*2))-CLEARANCE, wall, wall-CLEARANCE, cornerRadius)
}