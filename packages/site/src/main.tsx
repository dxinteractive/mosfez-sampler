import React from "react";
import ReactDOM from "react-dom/client";

import "./css/base.css";
import classes from "./main.module.css";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

function Main() {
  return (
    <>
      <div className={classes.main}>
        <div className={classes.textWrapper}>
          <h1 className={classes.title}>mosfez-sampler</h1>
        </div>
      </div>
    </>
  );
}
