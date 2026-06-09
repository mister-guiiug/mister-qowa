/**
 * Retour sensoriel de jeu — 100 % client, zéro asset : sons synthétisés via la
 * Web Audio API + vibration tactile (Android ; no-op silencieux sur iOS Safari).
 * Tout est gouverné par le réglage `soundOn` (settingsStore).
 */
import { useAiSettings } from "../store/settingsStore";

let ctx: AudioContext | undefined;

function audio(): AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return undefined;
  ctx ??= new Ctor();
  // Débloque le contexte après le 1er geste utilisateur (politique navigateur).
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function enabled(): boolean {
  return useAiSettings.getState().soundOn;
}

/** Bip simple (oscillateur + enveloppe douce pour éviter les clics). */
function tone(
  freq: number,
  durationMs: number,
  type: OscillatorType = "sine",
  gain = 0.08,
  startOffset = 0,
): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.02);
}

function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non supporté : on ignore */
  }
}

export const feedback = {
  /** Bonne réponse : arpège ascendant + courte vibration. */
  correct(): void {
    if (!enabled()) return;
    tone(660, 110, "triangle");
    tone(880, 160, "triangle", 0.08, 0.1);
    vibrate(40);
  },
  /** Mauvaise réponse : descente grave + double vibration. */
  wrong(): void {
    if (!enabled()) return;
    tone(220, 200, "sawtooth", 0.06);
    tone(160, 240, "sawtooth", 0.06, 0.12);
    vibrate([30, 50, 30]);
  },
  /** Tic des dernières secondes du compte à rebours. */
  tick(): void {
    if (!enabled()) return;
    tone(880, 45, "square", 0.04);
  },
  /** Fanfare de podium. */
  finish(): void {
    if (!enabled()) return;
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 220, "triangle", 0.07, i * 0.12),
    );
    vibrate([60, 40, 60, 40, 120]);
  },
};
