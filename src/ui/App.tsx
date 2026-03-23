import { Funding } from "./Funding";
import { LoadingIndicator } from "./LoadingIndicator";
import { ParamsForm } from "./ParamForm";
import { Renderer } from "./Renderer";
import { Tools } from "./Tools";

import "../ui/css/funding.css";
import "../ui/css/loading.css";
import "../ui/css/main.css";
import "../ui/css/modal.css";
import "../ui/css/param-form.css";
import "../ui/css/tools.css";

function App() {
  const appVersion = process.env.REACT_APP_VERSION;

  return (
    <>
      <Renderer />
      <ParamsForm />
      <Tools />
      <Funding />
      <LoadingIndicator />
      {appVersion && <div className="ui-version">v{appVersion}</div>}
    </>
  );
}

export default App;
