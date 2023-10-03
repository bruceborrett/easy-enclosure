import { hookstate, useHookstate } from '@hookstate/core';

type CableGland = {
  shape: 'circle' | 'square',
  surface: number,
  diameter: number,
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
  cableGlands: CableGland[],
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
  cableGlands: [
    {
      shape: 'circle',
      surface: 0,
      diameter: 12.5,
      x: 6,
      y: 50,
    },
    {
      shape: 'circle',
      surface: 1,
      diameter: 12.5,
      x: 6,
      y: 40,
    },
    {
      shape: 'square',
      surface: 2,
      diameter: 12.5,
      x: 6,
      y: 50,
    },
    {
      shape: 'circle',
      surface: 3,
      diameter: 12.5,
      x: 6,
      y: 40,
    }
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