import React from 'react';

import { Renderer } from './Renderer';
import { ParamsForm } from './ParamForm';
import { Tools } from './Tools';
import { Funding } from './Funding';
import { LoadingIndicator } from './LoadingIndicator';

import '../ui/css/main.css';
import '../ui/css/modal.css'
import '../ui/css/tools.css'
import '../ui/css/funding.css'
import '../ui/css/param-form.css'
import '../ui/css/loading.css'

function App() {
  return (
    <>
      <Renderer />
      <ParamsForm />
      <Tools />
      <Funding />
      <LoadingIndicator />
    </>
  )
}

export default App;
