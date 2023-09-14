import React from 'react';

import { Renderer } from './Renderer';
import { ParamsForm } from './ParamForm';
import { Exporter } from './Exporter';

import '../styles.css';
import { Funding } from './Funding';

function App() {
  return (
    <>
      <Renderer />
      <ParamsForm />
      <Exporter />
      <Funding />
    </>
  )
}

export default App;
