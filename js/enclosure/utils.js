const roundedCube = (l, w, h, r=8, s=100) => {
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

const roundedFrame = (l, w, h, r=8, s=100) => {
  const outer = roundedCube(l, w, h, r, s)
  const inner = roundedCube(l-(params.wall*2), w-(params.wall*2), h, r, s)
  return subtract(outer, translate([params.wall, params.wall, 0], inner))
}

const hollowRoundCube = (l, w, h, r=8, s=100) => {
  const outer = roundedCube(l, w, h, r, s)
  const inner = roundedCube(l-(params.wall*2), w-(params.wall*2), h, r, s)
  return subtract(outer, translate([params.wall, params.wall, params.wall], inner))
}