import { booleans, transforms } from '@jscad/modeling'
import { cloverFrame, roundedCube, roundedFrame } from './utils'

import { Params } from '../params'
import { screws } from './screws'
import { subtract } from '@jscad/modeling/src/operations/booleans'
import { holes } from './holes'

const { union } = booleans
const { translate } = transforms

export const lid = (params: Params) => {
  const { length, width, wall, roof, cornerRadius, insertThickness, insertHeight, insertClearance, baseLidScrewDiameter, lidScrewDiameter } = params

  const entities = []
  const subtracts = []

  entities.push(roundedCube(width, length, roof, cornerRadius))

  if (params.lidScrews) {
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
    let screwOffset = (baseLidScrewDiameter/2) + (cornerRadius/4) + (wall/2);
    subtracts.push(screws(length, width, roof*2, screwOffset, lidScrewDiameter))
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

  const holeCount = params.holes.filter((v, i) => {return v.surface === 'top'}).length

  if (holeCount > 0) {
    subtracts.push(holes(params, ['top']))
  }

  if (subtracts.length > 0) {
    return subtract(union(entities), union(subtracts))
  } else {
    return union(entities)
  }
}