import { Params } from '../params'

import { cloverFrame } from './utils'

import { translate } from '@jscad/modeling/src/operations/transforms'

export const waterProofSealCutout = (params: Params) => {
  const { length, width, height, wall, insertThickness, insertHeight,
    sealThickness, insertClearance, cornerRadius, baseLidScrewDiameter, lidScrewDiameter } = params

  let diameterMax = Math.max(baseLidScrewDiameter, lidScrewDiameter)
  return translate(
    [
      wall, 
      wall, 
      height-(insertHeight+sealThickness)
    ],
    cloverFrame(
      width-(wall*2), 
      length-(wall*2), 
      insertHeight+sealThickness+insertClearance, 
      insertThickness+(insertClearance*2), 
      (diameterMax / 2) + (cornerRadius / 4) + (wall / 2)
    )
  )
}

export const waterProofSeal = (params: Params) => {
  const { length, width, wall, baseLidScrewDiameter, sealThickness, insertThickness, insertClearance, cornerRadius, lidScrewDiameter } = params
  let diameterMax = Math.max(baseLidScrewDiameter, lidScrewDiameter)
  return cloverFrame(
    width-(wall*2)-(insertClearance*2), 
    length-(wall*2)-(insertClearance*2), 
    sealThickness, 
    insertThickness, 
    (diameterMax / 2) + (cornerRadius / 4) + (wall / 2)
  )
}