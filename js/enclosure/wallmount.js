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
    translate([-4, params.cornerRadius*2, -10], flange()),
    translate([-4, params.width-params.cornerRadius, -10], flange()),
    translate([params.length+4, params.cornerRadius*2, -10], mirrorX(flange())),
    translate([params.length+4, params.width-params.cornerRadius, -10], mirrorX(flange()))
  )
}