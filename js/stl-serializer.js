/*
JSCAD Geometry to STL Format Serialization

## License

Copyright (c) 2018-2019 JSCAD Organization https://github.com/jscad

All code released under MIT license

Notes:
1) geom2 conversion to:
     none
2) geom3 conversion to:
     STL mesh
3) path2 conversion to:
     none
*/

/**
 * Serializer of JSCAD geometries to STL mesh.
 * @module io/stl-serializer
 * @example
 * const { serializer, mimeType } = require('@jscad/stl-serializer')
 */

const { geometries, modifiers } = jscadModeling

const mimeType = 'application/sla'

/**
 * Flatten the given array into a single array of elements.
 * The given array can be composed of multiple depths of objects and or arrays.
 * @param {Array} array - array to flatten
 * @returns {Array} a flat array with a single list of elements
 * @alias module:array-utils.flatten
 * @example
 * const flat = flatten([[1], [2, 3, [4, 5]], 6]) // returns [1, 2, 3, 4, 5, 6]
 */
const flatten = (arr) => arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), [])


/**
 * Convert the given array to an array if not already an array.
 * @param {*} array - anything
 * @returns {Array} an array
 * @alias module:array-utils.toArray
 * @example
 * const array = toArray(1) // [1]
 */
const toArray = (array) => {
  if (Array.isArray(array)) return array
  if (array === undefined || array === null) return []
  return [array]
}

// objects must be an array of 3D geomertries (with polygons)
const serializeText = (objects, options) => {
  options.statusCallback && options.statusCallback({ progress: 0 })

  const result = `solid JSCAD
${convertToStl(objects, options)}
endsolid JSCAD
`
  options.statusCallback && options.statusCallback({ progress: 100 })
  return [result]
}

const convertToStl = (objects, options) => {
  const result = []
  objects.forEach((object, i) => {
    result.push(convertToFacets(object, options))
    options.statusCallback && options.statusCallback({ progress: 100 * i / objects.length })
  })
  return result.join('\n')
}

const convertToFacets = (object, options) => {
  const result = []
  const polygons = geometries.geom3.toPolygons(object)
  polygons.forEach((polygon, i) => {
    result.push(convertToFacet(polygon))
  })
  return result.join('\n')
}

const vector3DtoStlString = (v) => `${v[0]} ${v[1]} ${v[2]}`

const vertextoStlString = (vertex) => `vertex ${vector3DtoStlString(vertex)}`

const convertToFacet = (polygon) => {
  const result = []
  if (polygon.vertices.length >= 3) {
    // STL requires triangular polygons. If our polygon has more vertices, create multiple triangles:
    const firstVertexStl = vertextoStlString(polygon.vertices[0])
    for (let i = 0; i < polygon.vertices.length - 2; i++) {
      const facet = `facet normal ${vector3DtoStlString(geometries.poly3.plane(polygon))}
outer loop
${firstVertexStl}
${vertextoStlString(polygon.vertices[i + 1])}
${vertextoStlString(polygon.vertices[i + 2])}
endloop
endfacet`
      result.push(facet)
    }
  }
  return result.join('\n')
}

// see http://en.wikipedia.org/wiki/STL_%28file_format%29#Binary_STL

// objects must be an array of 3D geometries
const serializeBinary = (objects, options) => {
  options.statusCallback && options.statusCallback({ progress: 0 })

  // first check if the host is little-endian:
  const buffer = new ArrayBuffer(4)
  const int32buffer = new Int32Array(buffer, 0, 1)
  const int8buffer = new Int8Array(buffer, 0, 4)
  int32buffer[0] = 0x11223344
  if (int8buffer[0] !== 0x44) {
    throw new Error('Binary STL output is currently only supported on little-endian (Intel) processors')
  }

  let numtriangles = 0
  let numpolygons = 0
  objects.forEach((object, i) => {
    const polygons = geometries.geom3.toPolygons(object)
    polygons.forEach((polygon) => {
      const numvertices = polygon.vertices.length
      const thisnumtriangles = (numvertices >= 3) ? numvertices - 2 : 0
      numtriangles += thisnumtriangles
      numpolygons += 1
    })
  })

  const headerarray = new Uint8Array(80)
  for (let i = 0; i < 80; i++) {
    headerarray[i] = 65
  }

  const ar1 = new Uint32Array(1)
  ar1[0] = numtriangles

  // write the triangles to allTrianglesBuffer:
  const allTrianglesBuffer = new ArrayBuffer(50 * numtriangles)
  const allTrianglesBufferAsInt8 = new Int8Array(allTrianglesBuffer)

  // a tricky problem is that a Float32Array must be aligned at 4-byte boundaries (at least in certain browsers)
  // while each triangle takes 50 bytes. Therefore we write each triangle to a temporary buffer, and copy that
  // into allTrianglesBuffer:
  const triangleBuffer = new ArrayBuffer(50)
  const triangleBufferAsInt8 = new Int8Array(triangleBuffer)

  // each triangle consists of 12 floats:
  const triangleFloat32array = new Float32Array(triangleBuffer, 0, 12)
  // and one uint16:
  const triangleUint16array = new Uint16Array(triangleBuffer, 48, 1)

  let byteoffset = 0

  objects.forEach((object) => {
    const polygons = geometries.geom3.toPolygons(object)
    polygons.forEach((polygon, index) => {
      const vertices = polygon.vertices
      const numvertices = vertices.length
      const plane = geometries.poly3.plane(polygon)
      for (let i = 0; i < numvertices - 2; i++) {
        triangleFloat32array[0] = plane[0]
        triangleFloat32array[1] = plane[1]
        triangleFloat32array[2] = plane[2]
        let arindex = 3
        for (let v = 0; v < 3; v++) {
          const vv = v + ((v > 0) ? i : 0)
          const vertex = vertices[vv]
          triangleFloat32array[arindex++] = vertex[0]
          triangleFloat32array[arindex++] = vertex[1]
          triangleFloat32array[arindex++] = vertex[2]
        }
        triangleUint16array[0] = 0
        // copy the triangle into allTrianglesBuffer:
        allTrianglesBufferAsInt8.set(triangleBufferAsInt8, byteoffset)
        byteoffset += 50
      }

      options.statusCallback && options.statusCallback({ progress: 100 * index / numpolygons })
    })
  })
  options.statusCallback && options.statusCallback({ progress: 100 })
  return [headerarray.buffer, ar1.buffer, allTrianglesBuffer] // 'blobable array'
}

/**
 * Serialize the give objects to STL mesh.
 * @param {Object} options - options for serialization
 * @param {String} [options.binary='true'] - target format for data
 * @param {Function} [options.statusCallback] - call back function for progress ({ progress: 0-100 })
 * @param {...Object} objects - objects to serialize as STL
 * @returns {Array} serialized contents with one STL mesh (either string or binary data)
 * @alias module:io/stl-serializer.serialize
 * @example
 * const geometry = primitives.cube()
 * const stlData = serializer({binary: false}, geometry)
 */
const serialize = (options, ...objects) => {
  const defaults = {
    binary: true,
    statusCallback: null
  }
  options = Object.assign({}, defaults, options)

  objects = flatten(objects)
  console.log(objects)

  // convert only 3D geometries
  let objects3d = objects.filter((object) => geometries.geom3.isA(object))
  console.log(objects3d)

  if (objects3d.length === 0) throw new Error('only 3D geometries can be serialized to STL')
  if (objects.length !== objects3d.length) console.warn('some objects could not be serialized to STL')

  // convert to triangles
  objects3d = toArray(modifiers.generalize({ snap: true, triangulate: true }, objects3d))
  console.log(objects3d)
  console.log(serializeBinary(objects3d, options))
  
  return options.binary ? serializeBinary(objects3d, options) : serializeText(objects3d, options)
}
