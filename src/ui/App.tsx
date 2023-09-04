import React from 'react';

import { JSCad } from './Jscad';
import { ParamsForm } from './ParamForm';
import { useParams } from '../lib/params';
import { enclosure } from '../lib/enclosure';

import { Exporter } from './Exporter';

import '../styles.css';

function App() {

  const { params, setParams } = useParams()

  const model = enclosure(params)

  return (
    <>
      <JSCad params={params} enclosure={model} />

      <ParamsForm params={params} setParams={setParams} />

      <Exporter params={params} />
    </>
  )
}

export default App;
