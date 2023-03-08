import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import "./css/base.css";
import "./main.css";
import classes from "./main.module.css";
import { Codebox } from "./codebox/codebox";

import { Sampler, clip } from "mosfez-sampler/sampler";
import { touchStart } from "mosfez-sampler/touch-start";
import { toAudioBuffer } from "mosfez-sampler/convert";

(async () => {
  console.log("new sampler");
  const audioContext = new AudioContext();
  touchStart(audioContext);

  const max = audioContext.sampleRate * 2;
  const array: number[][] = [[]];
  let pitch = 200;
  for (let i = 0; i < max; i++) {
    const t = i / max;
    const v = Math.sin(t * Math.PI * 2 * pitch);
    array[0].push(v * 0.2);
    pitch += 0.001;
  }
  const helloBuffer = await toAudioBuffer(array, audioContext);

  const sampler = new Sampler({ audioContext });
  sampler.updateSamples({
    "hello.wav": helloBuffer,
  });
  sampler.setInstrument("hello", clip({ sample: "hello.wav" }));

  const s = [];
  for (let i = 0; i < 5; i++) {
    s.push({ time: 0.1 + i });
  }
  sampler.setSequence("hello", s);
  sampler.play();

  await new Promise((r) => setTimeout(r, 3500));

  sampler.stop();
})();

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
