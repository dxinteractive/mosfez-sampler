import { PlaybackSample } from "./scheduler";
import { Instrument } from "./instrument";

export type ClipEvent = {
  time: number;
};

export type ClipMode = "overlap" | "cutoff";

export class Clip extends Instrument {
  private _sequence: ClipEvent[] = [];

  public sample = "";
  public mode: ClipMode = "overlap";

  private _getCutoffId() {
    return this.mode === "overlap" ? undefined : this.id;
  }

  get sampleBuffer() {
    return this.sampler.getSample(this.sample);
  }

  playSample() {
    const buffer = this.sampleBuffer;
    if (!buffer) return;

    const id = this._newEventId();

    this.sampler._scheduler.schedule([
      {
        id,
        time: 0,
        buffer,
        cutoffId: this._getCutoffId(),
      },
    ]);
  }

  playSequence() {
    const sequence = this._sequence;
    const buffer = this.sampleBuffer;
    if (sequence.length === 0 || !buffer) return;

    const startTime = this.sampler.currentTime;
    const playbackSamples = sequence.map((event): PlaybackSample => {
      const time = startTime + event.time;
      return {
        id: this._newEventId(),
        buffer,
        time,
        cutoffId: this._getCutoffId(),
      };
    });

    this.sampler._scheduler.schedule(playbackSamples);
  }

  setSequence(events: ClipEvent[]) {
    this._sequence = events;
  }
}
