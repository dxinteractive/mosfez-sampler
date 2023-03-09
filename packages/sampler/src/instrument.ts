import type { Sampler } from "./sampler";

let instrumentId = 0;

export class Instrument {
  private _id: string;
  private _eventId = 0;
  protected _sampler?: Sampler;

  protected _newEventId() {
    return `${this._id}.${this._eventId++}`;
  }

  constructor() {
    this._id = `${instrumentId++}`;
  }

  get id(): string {
    return this._id;
  }

  get sampler(): Sampler {
    if (!this._sampler) {
      throw new Error(
        "instrument must be passed to sampler.addInstrument() first"
      );
    }
    return this._sampler;
  }

  setSampler(sampler: Sampler) {
    this._sampler = sampler;
  }

  dispose() {
    return;
  }
}
