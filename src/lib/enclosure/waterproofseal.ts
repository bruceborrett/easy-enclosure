import { Params } from '../params'

import { cloverFrame } from './utils'

import { translate } from '@jscad/modeling/src/operations/transforms'

const CLEARANCE = 0.04

export const waterProofSealCutout = (params: Params) => {
  const { length, width, height, wall, cornerRadius, insertThickness, insertHeight, sealThickness } = params
  return translate(
    [wall,wall,height-(insertHeight+sealThickness)],
    cloverFrame(width-(wall*2), length-(wall*2), insertHeight+sealThickness, insertThickness, cornerRadius)
  )
}

export const waterProofSeal = (params: Params) => {
  const { length, width, wall, cornerRadius, sealThickness, insertThickness } = params
  return cloverFrame((width-(wall*2))-CLEARANCE, (length-(wall*2))-CLEARANCE, sealThickness, insertThickness-CLEARANCE, cornerRadius)
}