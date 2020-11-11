import * as Tone from "tone";
import { IInstrument, ITriggerParams } from "./IInstrument";

export class BassSynth implements IInstrument {
  private synth: Tone.MonoSynth;

  constructor(volume: number) {
    this.synth = new Tone.MonoSynth({ volume, portamento: 0, envelope: { attack: 0.01 }, filterEnvelope: { attack: 0.03 } }).toDestination();
  }
  dispose(): void {
    this.synth.dispose();
  }

  trigger({ note, duration, time }: ITriggerParams): void {
    this.synth.envelope.cancel();
    // console.log(note, time);
    this.synth.triggerAttackRelease(note, duration, time);
  }
}