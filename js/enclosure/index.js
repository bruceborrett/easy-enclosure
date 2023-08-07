const { booleans, colors, primitives, transforms, hulls, utils } = jscadModeling

const { hull } = hulls
const { degToRad } = utils
const { intersect, subtract, union } = booleans
const { translate, rotate, rotateY, rotateX, mirrorX } = transforms
const { cube, cuboid, line, sphere, star, cylinder } = primitives

const enclosure = (params) => {
  const { length, width, height, wall } = params
  console.log('params', params)

  const lidPos = [10, -width/2, 0]
  const basePos = [-length-10, -width/2, (height/2)]

  const lid = union(
    roundedCube(length, width, wall),
    translate([wall, wall, wall*2], roundedFrame(length-(wall*2), width-(wall*2), wall+5))
  )
  
  const base = union(
    hollowRoundCube(length, width, height),
    flanges()
  )
    
  let result = []
  if (params.showLid) {
    result.push(translate(lidPos, lid))
  }
  if (params.showBase) {
    result.push(translate(basePos, base))
  }

  return union(result)
}