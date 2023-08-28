import React from 'react';

import { JSCad } from './Jscad';
import { ParamsForm } from './ParamForm';
import { useParams } from '../lib/params';

import '../styles.css';

function App() {

  const { params, setParams } = useParams()

  return (
    <>
      <JSCad params={params} />

      <ParamsForm params={params} setParams={setParams} />

      <button id="download">
        <img alt="Download" src="/download.svg" />
      </button>

      <div id="modal">
        <div id="modal-content">
          <span id="close">&times;</span>
          <button id="export">Export STL File</button>
        </div>
      </div>
    </>
  )
}

export default App;
