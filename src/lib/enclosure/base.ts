import { booleans } from '@jscad/modeling'
import { Params } from '../params'

import { holes } from './holes'
import { flanges } from './wallmount'
import { clover, hollowRoundCube, roundedCube } from './utils'
import { waterProofSealCutout } from './waterproofseal'
import { screws } from './screws'
import { translate } from '@jscad/modeling/src/operations/transforms'

const { subtract, union } = booleans

export const base = (params: Params) => {
  const { length, width, height, wall, floor, cornerRadius, insertThickness, insertClearance, lidScrewDiameter, baseLidScrewDiameter } = params

  const body = [] 
  const subtracts = []

  let _wall = wall
  if (params.waterProof) {
    _wall = (wall * 2) + (insertClearance * 2) + insertThickness
  }

  if (params.lidScrews) {
    let diameterMax = Math.max(baseLidScrewDiameter, lidScrewDiameter)
    body.push(subtract(
      roundedCube(width, length, height, cornerRadius),
      translate([
        _wall,_wall,floor
      ], 
      clover(
        width-(_wall*2), 
        length-(_wall*2), 
        height, 
          (diameterMax / 2) + (cornerRadius / 4) + (wall / 2),
      ))
    ))
    let screwOffset = (diameterMax / 2) + (cornerRadius / 4) + (wall / 2);
    subtracts.push(screws(length, width, height, screwOffset, baseLidScrewDiameter))
  } else {
    body.push(hollowRoundCube(width, length, height, _wall, cornerRadius))
  }
  
  if (params.wallMounts) {
    body.push(flanges(params))
  }

  if (params.waterProof) {
    subtracts.push(waterProofSealCutout(params))
  }

  const holeCount = params.holes.filter((v, i) => {return ['front', 'back', 'left', 'right', 'bottom'].includes(v.surface)}).length

  if (holeCount > 0) {
    subtracts.push(holes(params))
  }

  if (subtracts.length > 0) {
    return subtract(union(body), union(subtracts))
  } else {
    return union(body)
  }
}