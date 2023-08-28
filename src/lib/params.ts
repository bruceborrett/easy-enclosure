import React from 'react';

export type Params = {
  length: number,
  width: number,
  height: number,
  wall: number,
  dustProof: boolean,
  waterProof: boolean,
  showLid: boolean,
  showBase: boolean,
  cornerRadius: number,
  cableGlands: number,
  wallMounts: boolean
}

const defaults: Params = {
  length: 100,
  width: 100,
  height: 30,
  wall: 2,
  dustProof: true,
  waterProof: true,
  showLid: true,
  showBase: true,
  cornerRadius: 8,
  cableGlands: 1,
  wallMounts: true
}

export const useParams = () => {
  const [params, setParams] = React.useState<Params>(defaults);
  return { params, setParams }
}