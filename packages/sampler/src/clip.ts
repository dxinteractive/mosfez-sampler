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
        time: 0, // todo - add option to schedule at next chunk for stronger timing guarantees - what value does tone.js use?
        buffer,
        cutoffId: this._getCutoffId(),
      },
    ]);

    return id;
  }

  stopSample(id: string) {
    if (id.startsWith(this.id)) {
      this.sampler._scheduler.clear(id);
    }
  }

  stopAllSamples() {
    this.sampler._scheduler.clear(this.id);
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

  renderSequence() {
    // todo - use elementary to render this offline
  }

  setSequence(events: ClipEvent[]) {
    this._sequence = events;
  }
}
