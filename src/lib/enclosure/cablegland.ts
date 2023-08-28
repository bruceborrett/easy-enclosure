import { rotateX, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';
import { cylinder } from '@jscad/modeling/src/primitives';
import { union } from '@jscad/modeling/src/operations/booleans';

import { Params } from '../params';

const b64toBlob = (b64Data: string, contentType='', sliceSize=512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

const cableGland = () => {
  return rotateX(degToRad(90), cylinder({radius: 5, height: 10}))
}

export const cableGlands = (params: Params) => {
  // const stl = require("../../assets/cable-gland.stl")
  // console.log(stl)
  // const gland = deserialize({output: "geometry"}, blob)
  const spacing = params.length / (params.cableGlands + 1)
  let result = []
  for (let i = 0; i < params.cableGlands; i++) {
    result.push(translate([spacing * (i + 1), 0, 0], cableGland()))
  }
  return translate([0,params.length+10,0], union(result))
}

export const cableGlandHoles = (params: Params) => {
  const spacing = params.length / (params.cableGlands + 1)
  let result = []
  for (let i = 0; i < params.cableGlands; i++) {
    result.push(translate([spacing * (i + 1), 0, 0], cableGland()))
  }
  return translate([0,params.length+10,0], union(result))
}