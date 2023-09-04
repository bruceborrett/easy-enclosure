import { booleans } from '@jscad/modeling'
import { Params } from '../params'

import { cableGlandHoles } from './cablegland'
import { flanges } from './wallmount'
import { clover, hollowRoundCube, roundedCube } from './utils'
import { waterProofSealCutout } from './waterproofseal'
import { screws } from './screws'
import { translate } from '@jscad/modeling/src/operations/transforms'

const { subtract, union } = booleans

export const base = (params: Params) => {
  const { length, width, height, wall, cornerRadius } = params

  const body = [] 
  const subtracts = []

  let _wall = wall
  if (params.waterProof) {
    _wall = wall * 3
  }

  if (params.screws) {
    body.push(subtract(
      roundedCube(length, width, height, cornerRadius),
      translate([_wall,_wall,_wall], clover(length-(_wall*2), width-(_wall*2), height, _wall, cornerRadius))
    ))
    subtracts.push(screws(params))
  } else {
    body.push(hollowRoundCube(length, width, height, _wall, cornerRadius))
  }
  
  if (params.wallMounts) {
    body.push(flanges(params))
  }

  if (params.waterProof) {
    subtracts.push(waterProofSealCutout(params))
  }

  if (params.cableGlands > 0) {
    subtracts.push(cableGlandHoles(params))
  }

  if (subtracts.length > 0) {
    return subtract(union(body), union(subtracts))
  } else {
    return union(body)
  }
}