import React from 'react';

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
  wallMounts: boolean,
  screws: boolean
}

const defaults: Params = {
  length: 100,
  width: 100,
  height: 30,
  wall: 1,
  waterProof: true,
  showLid: true,
  showBase: true,
  cornerRadius: 4,
  cableGlands: 3,
  cableGlandWidth: 12.5,
  wallMounts: true,
  screws: true
}

export const useParams = () => {
  const [params, setParams] = React.useState<Params>(defaults);
  return { params, setParams }
}