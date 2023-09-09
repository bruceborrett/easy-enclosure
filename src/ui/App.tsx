import React from 'react';

import { Renderer } from './Renderer';
import { ParamsForm } from './ParamForm';
import { Exporter } from './Exporter';

import '../styles.css';

function App() {
  return (
    <>
      <Renderer />
      <ParamsForm />
      <Exporter />
    </>
  )
}

export default App;
