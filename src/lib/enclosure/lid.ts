import { booleans, transforms } from '@jscad/modeling'
import { roundedCube, roundedFrame } from './utils'

import { Params } from '../params'

const { union } = booleans
const { translate } = transforms

export const lid = (params: Params) => {
  return union(
    roundedCube(params.length, params.width, params.wall, params.cornerRadius),
    translate([
      params.wall, 
      params.wall, 
      params.wall*2
    ], 
    roundedFrame(params.length-(params.wall*2), params.width-(params.wall*2), params.wall+5, params.wall, params.cornerRadius))
  )
}