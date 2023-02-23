import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import "./css/base.css";
import "./main.css";
import classes from "./main.module.css";
import { Codebox } from "./codebox/codebox";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

function Main() {
  const [text, setText] = useState("abc\ndef");
  return (
    <div className={classes.main}>
      <ListHeader>
        mosfez-sampler test site -{" "}
        <a
          className={classes.link}
          href="https://github.com/dxinteractive/mosfez-sampler"
        >
          github repo
        </a>
      </ListHeader>
      <Codebox
        value={text}
        onChange={(e) => setText(e.target.value)}
        highlight="  a b a"
        className="codebox"
        padX={10}
        padY={10}
        inputMode="touch"
        onCellClick={console.log}
      />
    </div>
  );
}

type ListHeaderProps = {
  children: React.ReactNode;
};

function ListHeader(props: ListHeaderProps) {
  return (
    <header className={classes.listHeader}>
      <div className={classes.listHeaderTitle}>{props.children}</div>
    </header>
  );
}
