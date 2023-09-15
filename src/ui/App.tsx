import React from 'react';

import { Renderer } from './Renderer';
import { ParamsForm } from './ParamForm';
import { Tools } from './Tools';
import { Funding } from './Funding';

import '../styles.css';

function App() {
  return (
    <>
      <Renderer />
      <ParamsForm />
      <Tools />
      <Funding />
    </>
  )
}

export default App;
