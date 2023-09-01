import { booleans } from '@jscad/modeling'
import { Params } from '../params'

import { cableGlandHoles } from './cablegland'
import { flanges } from './wallmount'
import { hollowRoundCube } from './utils'
import { waterProofSealCutout } from './waterproofseal'

const { subtract, union } = booleans

export const base = (params: Params) => {
  const { length, width, height, wall, cornerRadius } = params

  let _wall = wall
  if (params.waterProof) {
    _wall = wall * 3
  }

  const body = [
    hollowRoundCube(length, width, height, _wall, cornerRadius)
  ]

  const subtracts = []

  if (params.wallMounts) {
    body.push(flanges(params))
  }

  if (params.waterProof) {
    subtracts.push(waterProofSealCutout(params))
  }

  if (params.cableGlands > 0) {
    subtracts.push(cableGlandHoles(params))
  }
  // body.push(cableGlandHoles(params))

  if (subtracts.length > 0) {
    return subtract(union(body), union(subtracts))
  } else {
    return union(body)
  }
}