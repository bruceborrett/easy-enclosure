import { booleans, transforms } from '@jscad/modeling'
import { roundedCube, roundedFrame } from './utils'

import { Params } from '../params'

const { union } = booleans
const { translate } = transforms

const CLEARANCE = 0.04
const SEALHEIGHT = 5

export const lid = (params: Params) => {
  const { length, width, wall, cornerRadius } = params

  return union(
    roundedCube(length, width, wall, cornerRadius),
    translate([wall, wall, wall], 
    roundedFrame((length-(wall*2))-CLEARANCE, (width-(wall*2))-CLEARANCE, SEALHEIGHT, wall, cornerRadius))
  )
}