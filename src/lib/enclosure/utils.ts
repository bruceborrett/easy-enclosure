import { cube, cuboid, cylinder } from '@jscad/modeling/src/primitives'
import { rotateX, rotateY, rotateZ, translate } from '@jscad/modeling/src/operations/transforms'
import { hull } from '@jscad/modeling/src/operations/hulls'
import { subtract, union } from '@jscad/modeling/src/operations/booleans'
import { degToRad } from '@jscad/modeling/src/utils'

export const roundedCube = (l: number, w: number, h: number, r=8, s=100) => {
  const c = cylinder({
    height: h,
    radius: r,
    segments: s
  })

  return hull(
    translate([r, r, 0], c),
    translate([l-r, r, 0], c),
    translate([r, w-r, 0], c),
    translate([l-r, w-r, 0], c),
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

const roundedCorner = (r: number, h: number, s=100) => {
  return subtract(
    cuboid({size: [r*2, r*2, h]}),
    translate([r, r, 0], roundedCube(r, r, h, r, s)),
    translate([r*2,0,0], cuboid({size: [r*2, r*2, h]}))
  )
}

export const clover = (l: number, w: number, h: number, t: number, r=8, s=100) => {
  const cornersRemoved = subtract(
    roundedCube(l, w, h, r, s),
    translate([0, 0, 0], roundedCube(r, r, h, r, s)),
    translate([l-r, 0, 0], roundedCube(r, r, h, r, s)),
    translate([0, w-r, 0], roundedCube(r, r, h, r, s)),
    translate([l-r, w-r, 0], roundedCube(r, r, h, r, s)),
  )
  const rounded = subtract(
    cornersRemoved,
    translate([0, r*2, 0], rotateZ(degToRad(0), roundedCorner(r, h, s))),
    translate([r*2, 0, 0], rotateZ(degToRad(0), roundedCorner(r, h, s))),
    translate([l, r*2, 0], rotateZ(degToRad(90), roundedCorner(r, h, s))),
    translate([l-(r*2), 0, 0], rotateZ(degToRad(90), roundedCorner(r, h, s))),
    translate([l, w-(r*2), 0], rotateZ(degToRad(180), roundedCorner(r, h, s))),
    translate([l-(r*2), w, 0], rotateZ(degToRad(180), roundedCorner(r, h, s))),
    translate([0, w-(r*2), 0], rotateZ(degToRad(270), roundedCorner(r, h, s))),
    translate([r*2, w, 0], rotateZ(degToRad(270), roundedCorner(r, h, s))),
  )
  return rounded
}

export const cloverFrame = (l: number, w: number, h: number, t: number, r=8, s=100) => {
  const outer = clover(l, w, h, t, r, s)
  const inner = clover(l-(t*2), w-(t*2), h, t, r, s)
  return subtract(outer, translate([t, t, 0], inner))
}

