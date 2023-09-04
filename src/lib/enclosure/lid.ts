import { booleans, transforms } from '@jscad/modeling'
import { cloverFrame, roundedCube, roundedFrame } from './utils'

import { Params } from '../params'
import { screws } from './screws'
import { subtract } from '@jscad/modeling/src/operations/booleans'

const { union } = booleans
const { translate } = transforms

const CLEARANCE = 0.04
const SEALHEIGHT = 5

export const lid = (params: Params) => {
  const { length, width, wall, cornerRadius } = params

  const entities = []
  const subtracts = []

  entities.push(roundedCube(length, width, wall, cornerRadius))

  if (params.screws) {
    entities.push(translate([wall, wall, (wall/2)+(SEALHEIGHT/2)], cloverFrame((length-(wall*2))-CLEARANCE, (width-(wall*2))-CLEARANCE, SEALHEIGHT, wall, cornerRadius)))
    subtracts.push(screws(params))
  } else {
    entities.push(translate([wall, wall, (wall/2)+(SEALHEIGHT/2)], roundedFrame((length-(wall*2))-CLEARANCE, (width-(wall*2))-CLEARANCE, SEALHEIGHT, wall, cornerRadius)))
  }

  if (subtracts.length > 0) {
    return subtract(union(entities), union(subtracts))
  } else {
    return union(entities)
  }
}