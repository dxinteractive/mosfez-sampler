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

function startClip(
  buffer: AudioBuffer,
  audioContext: AudioContext,
  time: number
) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.addEventListener("ended", () => {
    source.disconnect(audioContext.destination);
  });
  source.start(time);
}

export type TimedEvent = {
  time: number;
};

export type SamplerConfig = {
  audioContext: AudioContext;
};

export class Sampler {
  private _audioContext: AudioContext;
  private _mixer: GainNode;
  private _sampleMap = new Map<string, AudioBuffer>();
  private _instrumentMap = new Map<string, InstrumentDefinition>();
  private _sequenceMap = new Map<string, TimedEvent[]>();

  constructor(config: SamplerConfig) {
    const { audioContext } = config;
    this._audioContext = audioContext;
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
        startClip(buffer, this._audioContext, startTime + event.time);
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
