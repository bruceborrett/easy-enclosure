import { cylinder } from '@jscad/modeling/src/primitives'
import { translate } from '@jscad/modeling/src/operations/transforms'
import { hull } from '@jscad/modeling/src/operations/hulls'
import { subtract } from '@jscad/modeling/src/operations/booleans'

export const roundedCube = (l: number, w: number, h: number, r=8, s=100) => {
  const c = cylinder({
    height: h,
    radius: r,
    segments: s
  })

  return hull(
    translate([r, r, 0], c),
    translate([l-r, r, 0], c),
    translate([r, w, 0], c),
    translate([l-r, w, 0], c),
  )
}

export const roundedFrame = (l: number, w: number, h: number, t: number, r=8, s=100) => {
  const outer = roundedCube(l, w, h, r, s)
  const inner = roundedCube(l-(t*2), w-(t*2), h, r, s)
  return subtract(outer, translate([t, t, 0], inner))
}

export const hollowRoundCube = (l: number, w: number, h: number, t: number, r=8, s=100) => {
  const outer = roundedCube(l, w, h, r, s)
  const inner = roundedCube(l-(t*2), w-(t*2), h, r, s)
  return subtract(outer, translate([t, t, t], inner))
}