import { hookstate, useHookstate } from '@hookstate/core';

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
  showLid: boolean,
  showBase: boolean,
  cornerRadius: number,
  cableGlands: number,
  cableGlandWidth: number,
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
  sealThickness: 1,
  insertThickness: 2,
  insertHeight: 4,
  showLid: true,
  showBase: true,
  cornerRadius: 3,
  cableGlands: 3,
  cableGlandWidth: 12.5,
  pcbMounts: 4,
  pcbMountScrewDiameter: 2.98,
  pcbMountXY: [[30,24],[-30,24],[-30,-24],[30,-24]],  
  wallMounts: true,
  wallMountScrewDiameter: 2.98,
  screws: true,
  screwDiameter: 2.98,
}

const paramState = hookstate(defaults)

export const useParams = () => {
  return useHookstate(paramState)
}