import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import "./css/base.css";
import "./main.css";
import classes from "./main.module.css";
// import { Codebox } from "./codebox/codebox";

import { Sampler } from "mosfez-sampler/sampler";
import { Clip, ClipEvent } from "mosfez-sampler/clip";
import { touchStart } from "mosfez-sampler/touch-start";
import { toAudioBuffer } from "mosfez-sampler/convert";

import { useAnimationFrame } from "./use-animation-frame";

let sampler: Sampler | undefined;
let clip: Clip | undefined;

(async () => {
  console.log("new sampler");
  const audioContext = new AudioContext();
  touchStart(audioContext);

  const max = audioContext.sampleRate * 3;
  const array: number[][] = [[]];
  let pitch = 800;
  for (let i = 0; i < max; i++) {
    const t = i / max;
    const v = Math.sin(t * Math.PI * 2 * pitch);
    const gain = 1 - i / max;
    array[0].push(v * 0.2 * gain);
    pitch += 0.001;
  }
  const helloBuffer = await toAudioBuffer(array, audioContext);

  sampler = new Sampler({ audioContext });
  sampler.updateSamples({
    "hello.wav": helloBuffer,
  });

  clip = new Clip();
  clip.sample = "hello.wav";
  clip.mode = "cutoff";
  sampler.addInstrument("hello", clip);

  const sequence: ClipEvent[] = [];
  for (let i = 0; i < 5; i++) {
    sequence.push({ time: 0.1 + i });
  }
  // sampler.setSequence("hello", sequence);
  clip.setSequence(sequence);
  clip.playSequence();

  sampler.play();
  await new Promise((r) => setTimeout(r, 3500));
  console.log("stop");
  sampler.clear();
})();

const handlePlay = async () => {
  if (!clip) return;
  clip.playSample();
  // await new Promise((r) => setTimeout(r, 5));
  // clip.playSample();
  // await new Promise((r) => setTimeout(r, 5));
  // clip.playSample();
  // await new Promise((r) => setTimeout(r, 5));
  // clip.playSample();
  // await new Promise((r) => setTimeout(r, 5));
  // clip.playSample();
  // await new Promise((r) => setTimeout(r, 5));
  // clip.playSample();
  // await new Promise((r) => setTimeout(r, 5));
  // clip.playSample();
  // await new Promise((r) => setTimeout(r, 5));
  // clip.playSample();
  // await new Promise((r) => setTimeout(r, 5));
  // clip.playSample();
};
const handleStop = () => {
  if (!clip) return;
  // - todo playback modes (overlap, cut-off etc)
  // - todo stop()
  // clip.clear();
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

function Main() {
  // const [text, setText] = useState("abc\ndef");
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
      <div
        style={{ cursor: "pointer" }}
        onPointerDown={handlePlay}
        onPointerUp={handleStop}
      >
        play
      </div>
      <Stats />
      {/* <Codebox
        value={text}
        onChange={(e) => setText(e.target.value)}
        highlight="  a b a"
        className="codebox"
        padX={10}
        padY={10}
        inputMode="touch"
        onCellClick={console.log}
      /> */}
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

function Stats() {
  const [stats, setStats] = useState("");

  useAnimationFrame(() => {
    setStats(JSON.stringify(sampler?.stats, null, 2));
  }, []);

  return <pre>{stats}</pre>;
}
