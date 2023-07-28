const { booleans, colors, primitives, transforms, hulls } = jscadModeling

const { intersect, subtract, union } = booleans
const { hull } = hulls
const { translate, scale } = transforms
const { cube, cuboid, line, sphere, star, cylinder } = primitives

const enclosure = (params) => {

  const { length, width, height, wall } = params

  const roundedCube = (l, w, h, r=8, s=100) => {
    console.log('roundedCube', l, w, h, r, s)
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


  const lid = union(
    roundedCube(length, width, wall),
    translate([wall, wall, wall*2], roundedFrame(length-(wall*2), width-(wall*2), wall+5))
  )

  const base = hollowRoundCube(length, width, height)

  const lidPos = [-length-30, -(width/2), -(height/2)]
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