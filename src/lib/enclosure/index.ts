import { booleans, transforms } from '@jscad/modeling'
import { Geom3 } from '@jscad/modeling/src/geometries/types'

import { Params } from '../params'
import { Vec3 } from '@jscad/modeling/src/maths/vec3'

import { base } from './base'
import { lid } from './lid'

const { union } = booleans
const { translate } = transforms

export const enclosure = (params: Params) => {
  const { length, width, height } = params
  console.log('enclosure params', params)

  const lidPos = [10, -width/2, 0] as Vec3
  const basePos = [-length-10, -width/2, (height/2)] as Vec3
    
  let result: Geom3[] = []
  if (params.showLid) {
    result.push(translate(lidPos, lid(params)))
  }
  if (params.showBase) {
    result.push(translate(basePos, base(params)))
  }

  return union(result)
}