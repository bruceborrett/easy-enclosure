const { booleans, colors, primitives, transforms, hulls, utils } = jscadModeling

const { hull } = hulls
const { degToRad } = utils
const { intersect, subtract, union } = booleans
const { translate, scale, rotate, rotateY, rotateX } = transforms
const { cube, cuboid, line, sphere, star, cylinder } = primitives

const enclosure = (params) => {

  const { length, width, height, wall } = params

  const roundedCube = (l, w, h, r=8, s=100) => {
    const c = cylinder({
      height: h,
      radius: r,
      segments: s
    })
  
    return hull(
      c,
      translate([l, 0, 0], c),
      translate([0, w, 0], c),
      translate([l, w, 0], c),
    )
  }

  const roundedFrame = (l, w, h, r=8, s=100) => {
    const outer = roundedCube(l, w, h, r, s)
    const inner = roundedCube(l-(wall*2), w-(wall*2), h, r, s)
    return subtract(outer, translate([wall, wall, 0], inner))
  }

  const hollowRoundCube = (l, w, h, r=8, s=100) => {
    const outer = roundedCube(l, w, h, r, s)
    const inner = roundedCube(l-(wall*2), w-(wall*2), h, r, s)
    return subtract(outer, translate([wall, wall, wall], inner))
  }

  const flange = () => {
    const outer = hull(
      cube({size: 10}),
      translate([-5,0,0], cylinder({height: 10, radius: 5}))
    )

    const inner = hull(
      cuboid({size: [6,6,8]}),
      translate([-5,0,0], cylinder({height: 8, radius: 3}))
    )

    return subtract(
      outer,
      translate([0,0,2], inner),
      translate([-8,0,10], rotateY(45, cube({size: 20}))),
      translate([-5,0,0], cylinder({height: 10, radius: 2}))
    )
  }

  const flanges = () => {
    return union(
      translate([-11, 16, -10], flange()),
      translate([-11, length-16, -10], flange()),
      translate([length+11, 16, -10], rotate([degToRad(180),degToRad(180),0], flange())),
      translate([length+11, length-16, -10], rotate([degToRad(180),degToRad(180),0], flange()))
    )
  }

  const lid = union(
    roundedCube(length, width, wall),
    translate([wall, wall, wall*2], roundedFrame(length-(wall*2), width-(wall*2), wall+5))
  )

  const base = union(
    hollowRoundCube(length, width, height),
    flanges()
  )

  const lidPos = [-length-50, -(width/2), -(height/2)]
  const basePos = [0, -(width/2), 0]

  let result = []
  if (params.showLid) {
    result.push(translate(lidPos, lid))
  }
  if (params.showBase) {
    result.push(translate(basePos, base))
  }
  
  return scale([3, 3, 3], union(result))
}