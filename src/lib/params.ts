import { hookstate, useHookstate } from '@hookstate/core';

export type Params = {
  length: number,
  width: number,
  height: number,
  wall: number,
  waterProof: boolean,
  showLid: boolean,
  showBase: boolean,
  cornerRadius: number,
  cableGlands: number,
  cableGlandWidth: number,
  pcbMounts: number,
  pcbMountXY: [number, number][],
  wallMounts: boolean,
  screws: boolean
}

const defaults: Params = {
  length: 80,
  width: 100,
  height: 30,
  wall: 1,
  waterProof: true,
  showLid: true,
  showBase: true,
  cornerRadius: 4,
  cableGlands: 3,
  cableGlandWidth: 12.5,
  pcbMounts: 4,
  pcbMountXY: [[30,24],[-30,24],[-30,-24],[30,-24]],  
  wallMounts: true,
  screws: true,
}

const paramState = hookstate(defaults)

export const useParams = () => {
  return useHookstate(paramState)
}