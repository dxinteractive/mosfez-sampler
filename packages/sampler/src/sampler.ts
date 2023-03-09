import { Scheduler } from "./scheduler";
import { Instrument } from "./instrument";

export type SamplerConfig = {
  audioContext: AudioContext;
  schedulerRate?: number;
  lookAhead?: number;
  chunkLength?: number;
  antiPopCrossfade?: number;
};

export type SamplerConfigFinal = Required<SamplerConfig>;

export class Sampler {
  private _audioContext: AudioContext;
  /** @internal */
  public _scheduler: Scheduler;
  private _mixer: GainNode;
  private _sampleMap = new Map<string, AudioBuffer>();
  // private _instrumentMap = new Map<string, Instrument>();
  // private _sequenceMap = new Map<string, ClipEvent[]>();
  private _config: SamplerConfigFinal;

  constructor(config: SamplerConfig) {
    const {
      audioContext,
      schedulerRate = 0.025,
      // ^ rate that new samples are scheduled
      lookAhead = 0.1,
      // ^ schedules this far in advance
      // higher = more resilient to code activity on the main thread
      chunkLength = 5,
      // ^ length of chunks
      // chunks break up long samples so that after a stop()
      // and once samples are muted, we don't have to wait
      // for very long samples to complete
      antiPopCrossfade = 0.01,
      // ^ time taken to crossfade or fade to zero
      // so that audible pops are not heard
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
      antiPopCrossfade,
    });

    this._config = Object.freeze({
      audioContext,
      schedulerRate,
      lookAhead,
      chunkLength,
      antiPopCrossfade,
    });
  }

  public get config() {
    return this._config;
  }

  public get currentTime() {
    return this._audioContext.currentTime;
  }

  public get stats() {
    return {
      activeSampleCount: this._scheduler.activeSampleCount,
      maxActiveSampleCount: this._scheduler.maxActiveSampleCount,
    };
  }

  public resetStats() {
    this._scheduler.resetMaxActiveSampleCount();
  }

  public getSample(name: string): AudioBuffer | undefined {
    return this._sampleMap.get(name);
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

  public addInstrument(_name: string, instrument: Instrument) {
    instrument.setSampler(this);
    // this._instrumentMap.set(name, instrument);
  }

  // public removeInstrument(name: string) {
  //   this._instrumentMap.delete(name);
  // }

  // public setSequence(name: string, sequence: ClipEvent[]) {
  //   // clone and sort array
  //   this._sequenceMap.set(name, sequence);
  // }

  // public deleteSequence(name: string) {
  //   this._sequenceMap.delete(name);
  // }

  public get time(): number {
    // - return time of playhead
    return 0;
  }

  public play() {
    // - todo play
  }

  public clear() {
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
