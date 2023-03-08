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

type PlaybackSample = {
  buffer: AudioBuffer;
  time: number;
  offset?: number;
  duration?: number;
};

export type SchedulerConfig = {
  audioContext: AudioContext;
  destinationNode: AudioNode;
  schedulerRate: number;
  lookAhead: number;
  chunkLength: number;
};

class Scheduler {
  private _audioContext: AudioContext;
  private _destinationNode: AudioNode;
  private _lookAhead: number;
  private _chunkLength: number;
  private _ticker: Ticker;
  private _queue: PlaybackSample[] = [];

  constructor(config: SchedulerConfig) {
    const {
      audioContext,
      destinationNode,
      schedulerRate,
      lookAhead,
      chunkLength,
    } = config;

    this._audioContext = audioContext;
    this._destinationNode = destinationNode;
    this._lookAhead = lookAhead;
    this._chunkLength = chunkLength;
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
      if (item.time > audioContext.currentTime + this._lookAhead) {
        break;
      }
      this._queue.shift();
      if (item.time < audioContext.currentTime) {
        throw new Error("skipped!");
      }

      const source = audioContext.createBufferSource();
      source.buffer = item.buffer;
      source.connect(this._destinationNode);
      source.addEventListener("ended", () => {
        source.disconnect(this._destinationNode);
      });
      source.start(item.time, item.offset, item.duration);
      // todo - mute tails (batch everyone together to a single gain node until clear(), then make a new one)
      // todo - render with pitch curves
      // source.playbackRate.setValueCurveAtTime([1, 2, 1, 2], item.time, 0.1);
    }
  };

  public schedule(playbackSamples: PlaybackSample[]) {
    for (let i = 0; i < playbackSamples.length; i++) {
      const sample = playbackSamples[i];
      const sampleOffset = sample.offset ?? 0;
      let sampleLength =
        sample.buffer.length / this._audioContext.sampleRate - sampleOffset;

      if (sample.duration !== undefined && sample.duration < sampleLength) {
        sampleLength = sample.duration;
      }

      const chunks = Math.ceil(sampleLength / this._chunkLength);
      if (chunks === 1) {
        this._queue.push(sample);
      } else if (chunks > 1) {
        for (let c = 0; c < chunks; c++) {
          const offset = this._chunkLength * c - sampleOffset;
          this._queue.push({
            buffer: sample.buffer,
            time: sample.time + offset,
            offset,
            duration: this._chunkLength,
          });
        }
      }
    }

    this._queue.sort((a, b) => {
      if (a.time > b.time) return 1;
      if (b.time > a.time) return -1;
      return 0;
    });
  }

  public clear() {
    this._queue.length = 0;
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
  chunkLength?: number;
};

export class Sampler {
  private _audioContext: AudioContext;
  private _scheduler: Scheduler;
  private _mixer: GainNode;
  private _sampleMap = new Map<string, AudioBuffer>();
  private _instrumentMap = new Map<string, InstrumentDefinition>();
  private _sequenceMap = new Map<string, TimedEvent[]>();

  constructor(config: SamplerConfig) {
    const {
      audioContext,
      schedulerRate = 0.025,
      lookAhead = 0.1,
      chunkLength = 1,
    } = config;

    this._audioContext = audioContext;
    this._mixer = new GainNode(audioContext);
    this._mixer.connect(audioContext.destination);
    this._scheduler = new Scheduler({
      audioContext,
      destinationNode: this._mixer,
      schedulerRate,
      lookAhead,
      chunkLength,
    });
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
    // clone and sort array
    this._sequenceMap.set(name, sequence);
  }

  public deleteSequence(name: string) {
    this._sequenceMap.delete(name);
  }

  public get time(): number {
    // - return time of playhead
    return 0;
  }

  public get length(): number {
    // - return time of last event plus more
    return 0;
  }

  public play() {
    const startTime = this._audioContext.currentTime;

    this._sequenceMap.forEach((sequence, name) => {
      const instrument = this._instrumentMap.get(name);
      if (!instrument) return;
      const { sample } = instrument;
      const buffer = this._sampleMap.get(sample);
      if (!buffer) return;

      const playbackSamples = sequence.map((event) => {
        const time = startTime + event.time;
        return {
          buffer,
          time,
        };
      });

      this._scheduler.schedule(playbackSamples);
    });
  }

  public stop() {
    this._scheduler.clear();
  }

  public goto(/*time: number*/) {
    // - add a playhead
    // - set the playhead from
  }

  public async export() {
    // - make this render the whole thing
    // - make this accept an optional time range
  }

  public dispose() {
    this._scheduler.dispose();
  }
}

// later
// - custom sample rates
