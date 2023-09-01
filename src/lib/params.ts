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
  wallMounts: boolean
}

const defaults: Params = {
  length: 100,
  width: 100,
  height: 30,
  wall: 2,
  waterProof: false,
  showLid: true,
  showBase: true,
  cornerRadius: 8,
  cableGlands: 1,
  cableGlandWidth: 10,
  wallMounts: false
}

export const useParams = () => {
  const [params, setParams] = React.useState<Params>(defaults);
  return { params, setParams }
}