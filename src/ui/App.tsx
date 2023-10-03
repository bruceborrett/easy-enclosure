import React from 'react';

import { Renderer } from './Renderer';
import { ParamsForm } from './ParamForm';
import { Tools } from './Tools';
import { Funding } from './Funding';

import '../ui/css/main.css';
import '../ui/css/modal.css'
import '../ui/css/tools.css'
import '../ui/css/funding.css'
import '../ui/css/param-form.css'

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
