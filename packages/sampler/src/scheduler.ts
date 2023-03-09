import { Ticker } from "./ticker";

export type PlaybackSample = {
  id?: string;
  buffer: AudioBuffer;
  time: number;
  offset?: number;
  duration?: number;
  cutoffId?: string;
  gain?: number;
  // gainStepRate?: number;
};

type ActivePlaybackSample = PlaybackSample & {
  sourceNode: AudioBufferSourceNode;
  gainNode: GainNode;
};

export type SchedulerConfig = {
  audioContext: AudioContext;
  destinationNode: AudioNode;
  schedulerRate: number;
  lookAhead: number;
  chunkLength: number;
  antiPopCrossfade: number;
};

export class Scheduler {
  private _audioContext: AudioContext;
  private _destinationNode: AudioNode;
  private _chunkLength: number;
  private _antiPopCrossfade: number;
  private _ticker: Ticker;
  private _playbackQueue: PlaybackSample[] = [];
  private _activeSampleSet: Set<ActivePlaybackSample> = new Set();
  private _maxActiveSampleCount = 0;

  constructor(config: SchedulerConfig) {
    const {
      audioContext,
      destinationNode,
      schedulerRate,
      lookAhead,
      chunkLength,
      antiPopCrossfade,
    } = config;

    this._audioContext = audioContext;
    this._destinationNode = destinationNode;
    this._chunkLength = chunkLength;
    this._antiPopCrossfade = antiPopCrossfade;

    const tick = () => {
      const { currentTime, state } = this._audioContext;
      if (state === "suspended") return;

      const rangeToSchedule = currentTime + lookAhead;
      while (this._playbackQueue.length > 0) {
        const item = this._playbackQueue[0];
        if (item.time > rangeToSchedule) break;
        this._playbackQueue.shift();
        // if (item.time < currentTime) {
        //   throw new Error("skipped!");
        // }
        this._playSample(item);
      }
    };

    this._ticker = new Ticker(
      tick,
      "worker",
      schedulerRate,
      audioContext.sampleRate
    );
  }

  private _chunk(sample: PlaybackSample) {
    const sampleOffset = sample.offset ?? 0;
    let sampleLength = sample.buffer.duration - sampleOffset;

    if (sample.duration !== undefined && sample.duration < sampleLength) {
      sampleLength = sample.duration;
    }

    const chunks = Math.ceil(sampleLength / this._chunkLength);

    if (chunks === 0) {
      return [];
    }

    if (chunks === 1) {
      return [sample];
    }

    const chunked = [];
    for (let c = 0; c < chunks; c++) {
      const offset = this._chunkLength * c - sampleOffset;
      chunked.push({
        id: sample.id !== undefined ? `${sample.id}.${c}` : undefined,
        buffer: sample.buffer,
        time: sample.time + offset,
        offset,
        duration: this._chunkLength,
      });
    }
    return chunked;
  }

  private _playSample(item: PlaybackSample) {
    if (item.cutoffId) {
      this.stopActive(item.cutoffId, item.time);
    }

    const sourceNode = this._audioContext.createBufferSource();
    sourceNode.buffer = item.buffer;

    const gainNode = new GainNode(this._audioContext);
    sourceNode.connect(gainNode);
    gainNode.connect(this._destinationNode);

    this._setGain(item, gainNode);

    const activePlaybackSample = {
      ...item,
      sourceNode,
      gainNode,
    };

    this._activeSampleSet.add(activePlaybackSample);
    const { activeSampleCount } = this;
    if (activeSampleCount > this._maxActiveSampleCount) {
      this._maxActiveSampleCount = activeSampleCount;
    }

    sourceNode.addEventListener("ended", () => {
      this._activeSampleSet.delete(activePlaybackSample);
      gainNode.disconnect(this._destinationNode);
    });

    sourceNode.start(item.time, item.offset ?? 0, item.duration);
  }

  private _setGain(item: PlaybackSample, gainNode: GainNode) {
    if (typeof item.gain === "number") {
      gainNode.gain.value = item.gain;
      return;
    }

    // if(Array.isArray(item.gain)) {
    //   gainNode.gain.
    //   return;
    // }
  }

  private _muteActiveSample(item: ActivePlaybackSample, time = 0) {
    const { gain } = item.gainNode;
    if (time !== 0) {
      gain.setValueAtTime(gain.value, time);
      gain.linearRampToValueAtTime(0, time + this._antiPopCrossfade);
      return;
    }

    gain.linearRampToValueAtTime(
      0,
      this._audioContext.currentTime + this._antiPopCrossfade
    );
  }

  public get activeSampleCount(): number {
    return this._activeSampleSet.size;
  }

  public get maxActiveSampleCount(): number {
    return this._maxActiveSampleCount;
  }

  public resetMaxActiveSampleCount() {
    this._maxActiveSampleCount = 0;
  }

  public getScheduled(id: string, invert = false) {
    return this._playbackQueue.filter((item) => {
      return item.id?.startsWith(id) !== invert;
    });
  }

  public schedule(playbackSamples: PlaybackSample[]) {
    for (let i = 0; i < playbackSamples.length; i++) {
      this._playbackQueue.push(...this._chunk(playbackSamples[i]));
    }

    this._playbackQueue.sort((a, b) => {
      if (a.time > b.time) return 1;
      if (b.time > a.time) return -1;
      return 0;
    });
  }

  public stopActive(id = "", time?: number) {
    // stop playing any matching active samples immediately
    this._activeSampleSet.forEach((item) => {
      if (id === "" || item.id?.startsWith(id)) {
        this._muteActiveSample(item, time);
      }
    });
  }

  public clearScheduled(id = "") {
    // remove scheduled matching samples
    if (id === "") {
      this._playbackQueue.length = 0;
    } else {
      this._playbackQueue = this.getScheduled(id, true);
    }
  }

  public clear(id = "") {
    this.stopActive(id);
    this.clearScheduled(id);
  }

  public dispose() {
    this._ticker.dispose();
  }
}
