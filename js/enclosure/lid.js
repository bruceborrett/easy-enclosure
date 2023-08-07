const lid = union(
  roundedCube(length, width, wall),
  translate([wall, wall, wall*2], roundedFrame(length-(wall*2), width-(wall*2), wall+5))
)