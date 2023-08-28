import { booleans } from '@jscad/modeling'
import { Params } from '../params'

import { cableGlandHoles, cableGlands } from './cablegland'
import { flanges } from './wallmount'
import { hollowRoundCube } from './utils'

const { subtract, union } = booleans

export const base = (params: Params) => {
  const { length, width, height, wall, cornerRadius } = params

  const body = [
    hollowRoundCube(length, width, height, wall, cornerRadius)
  ]

  if (params.wallMounts) {
    body.push(flanges(params))
  }

  if (params.cableGlands > 0) {
    body.push(cableGlands(params))

    return subtract(
      union(body), 
      cableGlandHoles(params)
    )
  } else {
    return union(body)
  }
}