import { booleans, transforms } from '@jscad/modeling'
import { cloverFrame, roundedCube, roundedFrame } from './utils'

import { Params } from '../params'
import { screws } from './screws'
import { subtract } from '@jscad/modeling/src/operations/booleans'

const { union } = booleans
const { translate } = transforms

const CLEARANCE = 0.04

export const lid = (params: Params) => {
  const { length, width, wall, roof, cornerRadius, insertThickness, insertHeight } = params

  const entities = []
  const subtracts = []

  entities.push(roundedCube(width, length, roof, cornerRadius))

  if (params.screws) {
    entities.push(translate([wall, wall, (roof/2)+(insertHeight/2)], cloverFrame((width-(wall*2))-CLEARANCE, (length-(wall*2))-CLEARANCE, insertHeight, insertThickness, cornerRadius)))
    subtracts.push(screws(params))
  } else {
    entities.push(translate([wall, wall, (roof/2)+(insertHeight/2)], roundedFrame((width-(wall*2))-CLEARANCE, (length-(wall*2))-CLEARANCE, insertHeight, insertThickness, cornerRadius)))
  }

  if (subtracts.length > 0) {
    return subtract(union(entities), union(subtracts))
  } else {
    return union(entities)
  }
}