import { booleans, transforms } from '@jscad/modeling'
import { cloverFrame, roundedCube, roundedFrame } from './utils'

import { Params } from '../params'
import { screws } from './screws'
import { subtract } from '@jscad/modeling/src/operations/booleans'

const { union } = booleans
const { translate } = transforms

export const lid = (params: Params) => {
  const { length, width, wall, roof, cornerRadius, insertThickness, insertHeight, insertClearance } = params

  const entities = []
  const subtracts = []

  entities.push(roundedCube(width, length, roof, cornerRadius))

  if (params.screws) {
    entities.push(
      translate([
        wall+insertClearance, 
        wall+insertClearance, 
        roof
      ], 
      cloverFrame(
        width-(wall*2)-(insertClearance*2), 
        length-(wall*2)-(insertClearance*2), 
        insertHeight, 
        insertThickness, 
        (cornerRadius+wall)/2
      ))
    )
    subtracts.push(screws(params))
  } else {
    entities.push(
      translate([
        wall+insertClearance, 
        wall+insertClearance, 
        roof
      ], 
      roundedFrame(
        width-(wall*2)-(insertClearance*2), 
        length-(wall*2)-(insertClearance*2), 
        insertHeight, 
        insertThickness, 
        cornerRadius
      ))
    )
  }

  if (subtracts.length > 0) {
    return subtract(union(entities), union(subtracts))
  } else {
    return union(entities)
  }
}