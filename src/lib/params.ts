import { hookstate, useHookstate } from '@hookstate/core';
import { Surface } from './enclosure';

// The following types do not work due to this issue in the Hookstate library - https://github.com/avkonst/hookstate/issues/369
// Once that issue is resolved, we can use the following types instead of the Hole type below.

// interface BaseHole {
//   surface: number,
//   x: number,
//   y: number,
// }

// interface CircleHole extends BaseHole {
//   shape: 'circle',
//   diameter: number,
// }

// interface SquareHole extends BaseHole {
//   shape: 'square',
//   width: number,
// }
// interface RectangleHole extends BaseHole {
//   shape: 'rectangle',
//   length: number,
//   width: number,
// }

// type Hole = CircleHole | SquareHole | RectangleHole

type Hole = {
  shape: 'circle' | 'square' | 'rectangle',
  diameter: number,
  width: number,
  length: number,
  surface: Surface,
  x: number,
  y: number,
}

export type Params = {
  length: number,
  width: number,
  height: number,
  floor: number,
  roof: number,
  wall: number,
  waterProof: boolean,
  sealThickness: number,
  insertThickness: number,
  insertHeight: number,
  insertClearance: number,
  showLid: boolean,
  showBase: boolean,
  cornerRadius: number,
  holes: Hole[],
  pcbMounts: number,
  pcbMountScrewDiameter: number,
  pcbMountXY: [number, number][],
  wallMounts: boolean,
  wallMountScrewDiameter: number,
  screws: boolean,
  screwDiameter: number,
}

const defaults: Params = {
  length: 80,
  width: 100,
  height: 30,
  floor: 2,
  roof: 2,
  wall: 1,
  waterProof: true,
  sealThickness: 2,
  insertThickness: 2,
  insertHeight: 4,
  insertClearance: 0.04,
  showLid: true,
  showBase: true,
  cornerRadius: 3,
  holes: [
    {
      shape: 'circle',
      surface: 'front',
      diameter: 12.5,
      width: 0,
      length: 0,
      x: 6,
      y: 50,
    },
    {
      shape: 'square',
      surface: 'left',
      diameter: 0,
      width: 12,
      length: 0,
      x: 6,
      y: 40,
    },
    {
      shape: 'rectangle',
      surface: 'back',
      width: 40,
      length: 6,
      diameter: 0,
      x: 10,
      y: 50,
    },
    {
      shape: 'square',
      surface: 'right',
      width: 12.5,
      length: 0,
      diameter: 0,
      x: 6,
      y: 40,
    },
    {
      shape: 'square',
      surface: 'top',
      width: 30,
      length: 0,
      diameter: 0,
      x: 35,
      y: 25,
    },
],
  pcbMounts: 4,
  pcbMountScrewDiameter: 1.98,
  pcbMountXY: [[30,24],[-30,24],[-30,-24],[30,-24]],  
  wallMounts: true,
  wallMountScrewDiameter: 3.98,
  screws: true,
  screwDiameter: 2.98,
}

const paramState = hookstate(defaults)

export const useParams = () => {
  return useHookstate(paramState)
}