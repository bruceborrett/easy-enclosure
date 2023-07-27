const { booleans, colors, primitives, transforms } = jscadModeling

const { intersect, subtract, union } = booleans
const { colorize } = colors
const { translate } = transforms
const { cube, cuboid, line, sphere, star } = primitives

const enclosure = (params) => {
  const outer = cuboid({ 
    size: [
      params.length, 
      params.width, 
      params.height
    ] 
  });

  const inner = cuboid({ 
    size: [
      params.length - params.wall, 
      params.width - params.wall, 
      params.height
    ] 
  });

  const lid = cuboid({
    size: [
      params.length,
      params.width,
      params.wall
    ]
  });

  const base = subtract(outer, translate([0, 0, params.wall], inner));

  const lidPos = [(params.width / 2) + 5, 0, -(params.height/2)]
  const basePos = [-((params.width / 2) + 5), 0, 0]

  let result = []
  if (params.showLid) {
    result.push(translate(lidPos, lid))
  }
  if (params.showBase) {
    result.push(translate(basePos, base))
  }
  
  return result
}