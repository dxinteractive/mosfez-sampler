//
// instrument definitions
//

import { Ticker } from "./ticker";

export type InstrumentDefinition = {
  sample: string;
};

export type ClipParams = {
  sample: string;
};

export function clip(params: ClipParams): InstrumentDefinition {
  return {
    sample: params.sample,
  };
}

//
// scheduler
//

export type SchedulerConfig = {
  audioContext: AudioContext;
  schedulerRate: number;
  lookAhead: number;
};

class Scheduler {
  private _audioContext: AudioContext;
  private _lookAhead: number;
  private _ticker: Ticker;
  private _queue: [AudioBuffer, number][] = [];

  constructor(config: SchedulerConfig) {
    const { audioContext, schedulerRate, lookAhead } = config;
    this._audioContext = audioContext;
    this._lookAhead = lookAhead;
    this._ticker = new Ticker(
      this.tick.bind(this),
      "worker",
      schedulerRate,
      audioContext.sampleRate
    );
  }

  tick = () => {
    const audioContext = this._audioContext;
    while (this._queue.length > 0) {
      const item = this._queue[0];
      const time = item[1];
      if (time > audioContext.currentTime + this._lookAhead) {
        break;
      }
      this._queue.shift();
      if (time < audioContext.currentTime) {
        throw new Error("skipped!");
      }

      const source = audioContext.createBufferSource();
      source.buffer = item[0];
      source.connect(audioContext.destination);
      source.addEventListener("ended", () => {
        source.disconnect(audioContext.destination);
      });
      source.start(time);
    }
  };

  public push(buffer: AudioBuffer, time: number) {
    this._queue.push([buffer, time]);
  }

  public dispose() {
    this._ticker.dispose();
  }
}

export type TimedEvent = {
  time: number;
};

//
// sampler
//

export type SamplerConfig = {
  audioContext: AudioContext;
  schedulerRate?: number;
  lookAhead?: number;
};

export class Sampler {
  private _audioContext: AudioContext;
  private _scheduler: Scheduler;
  private _mixer: GainNode;
  private _sampleMap = new Map<string, AudioBuffer>();
  private _instrumentMap = new Map<string, InstrumentDefinition>();
  private _sequenceMap = new Map<string, TimedEvent[]>();

  constructor(config: SamplerConfig) {
    const { audioContext, schedulerRate = 0.025, lookAhead = 0.1 } = config;
    this._audioContext = audioContext;
    this._scheduler = new Scheduler({ audioContext, schedulerRate, lookAhead });
    this._mixer = new GainNode(audioContext);
    this._mixer.connect(audioContext.destination);
  }

  public updateSamples(sampleMap: Record<string, AudioBuffer | undefined>) {
    Object.entries(sampleMap).forEach(([name, buffer]) => {
      if (buffer) {
        this._sampleMap.set(name, buffer);
      } else {
        this._sampleMap.delete(name);
      }
    });
  }

  public setInstrument(name: string, instrument: InstrumentDefinition) {
    this._instrumentMap.set(name, instrument);
  }

  public deleteInstrument(name: string) {
    this._instrumentMap.delete(name);
  }

  public setSequence(name: string, sequence: TimedEvent[]) {
    this._sequenceMap.set(name, sequence);
  }

  public deleteSequence(name: string) {
    this._sequenceMap.delete(name);
  }

  public play() {
    const startTime = this._audioContext.currentTime;

    this._sequenceMap.forEach((sequence, name) => {
      const instrument = this._instrumentMap.get(name);
      if (!instrument) return;
      const { sample } = instrument;
      const buffer = this._sampleMap.get(sample);
      if (!buffer) return;

      // - schedule these using a rolling clock
      // - schedule longer sounds into chunks
      // - push this code inside of clip()
      sequence.forEach((event) => {
        this._scheduler.push(buffer, startTime + event.time);
        // startClip(buffer, this._audioContext, startTime + event.time);
      });
    });
  }

  public stop() {
    // - mute active sounds
    // - stop scheduling more events
  }

  public goto(/*time: number*/) {
    // - add a playhead
    // - set the playhead from
  }

  public get length(): number {
    // - return time of last event plus more
    return 0;
  }

  public async export() {
    // - make this render the whole thing
    // - make this accept an optional time range
  }
}

// later
// - custom sample rates
