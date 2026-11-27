/*
 * Genera los sonidos de la respiración 4-7-8 (spec 024, v0.2.0) con síntesis propia; no usa material de terceros.
 * Salida: WAV mono, PCM de 16 bits, 22 050 Hz, en assets/sounds/breathing/ (o en la carpeta del primer argumento).
 *
 *   node tools/scripts/generate-breathing-sounds.mjs [carpeta-de-salida]
 *
 * Son tres archivos, uno por fase (inhale 4 s, hold 7 s, exhale 8 s). Cada uno lleva dentro un latido con eco por
 * segundo, así que no hace falta un temporizador por segundo en la app. Inhale y exhale suman un soplo de aire suave;
 * hold solo tiene latidos. El carácter es el de la muestra «05 — latido con eco más grave, con respiro liso» que el
 * equipo aprobó escuchando (tools/.local/generate-sound-samples-3.mjs, no versionado).
 *
 * Es determinista: el ruido sale de un generador con semilla fija, así que ejecutarlo dos veces produce los mismos
 * bytes. Los valores de partida (frecuencias, duraciones, niveles) están en las constantes de abajo; se ajustan
 * escuchando el resultado y se regenera.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SAMPLE_RATE = 22_050;
const SR = SAMPLE_RATE;
const TWO_PI = 2 * Math.PI;

/** Nombres de los archivos, en el orden en que se generan (sin la extensión .wav). */
export const SOUND_NAMES = ['inhale', 'hold', 'exhale'];

// ── Valores de partida ────────────────────────────────────────────────────
const PHASE_SECONDS = { inhale: 4, hold: 7, exhale: 8 };

/*
 * Latido. Si en un teléfono real el latido no se distingue (los altavoces pequeños casi no reproducen graves),
 * la decisión 14 de la spec manda usar 88 → 62 Hz: basta cambiar estas dos frecuencias y regenerar.
 */
const BEAT_START_HZ = 72;
const BEAT_END_HZ = 52;
const BEAT_PEAK = 0.3;
const BEAT_ACCENT = { inhale: 1.4, hold: 1.2, exhale: 1.4 }; // el primer latido de cada fase suena algo más marcado
const BREATH_PEAK = 0.15; // el soplo queda unos 8 dB por debajo del latido

const FIRST_BEAT_ATTACK_SECONDS = 0.05; // RF-004.4: entrada gradual de al menos 50 ms; los demás latidos atacan en 24 ms
const BEAT_ATTACK_SECONDS = 0.024;
const FADE_OUT_SECONDS = 0.15; // apaga la cola del último latido, que no cabe entera en el archivo
const MAX_PEAK = 0.5; // −6 dBFS; un mismo factor para los tres archivos conserva el equilibrio entre ellos

// ── Utilidades ────────────────────────────────────────────────────────────
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, x) => a + (b - a) * x;
const dB = (decibels) => 10 ** (decibels / 20);
const buffer = (seconds) => new Float64Array(Math.round(seconds * SR));
const onePole = (hz) => 1 - Math.exp((-TWO_PI * hz) / SR);

function peakOf(samples) {
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  return peak;
}

function scaleTo(samples, target) {
  const peak = peakOf(samples);
  if (peak > 0) for (let i = 0; i < samples.length; i++) samples[i] *= target / peak;
  return samples;
}

/** Suma `source` dentro de `target` desde `startSeconds`; lo que se pase del final se descarta. */
function addAt(target, source, startSeconds, gain = 1) {
  const offset = Math.round(startSeconds * SR);
  for (let i = 0; i < source.length && offset + i < target.length; i++) target[offset + i] += source[i] * gain;
}

// ── Soplo de aire ─────────────────────────────────────────────────────────
/** Filtro pasa-banda (biquad) con coeficientes recalculados por muestra, para que la frecuencia pueda moverse. */
function createBandpass() {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, centerHz, q) => {
    const w = (TWO_PI * centerHz) / SR;
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w);
    const a2 = 1 - alpha;
    const y = (alpha * x - alpha * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

/**
 * Respiro liso: ruido oscurecido (cuatro polos a 1 500 Hz, casi sin siseo agudo) que pasa por dos resonancias anchas,
 * como garganta y boca, más un poco de cuerpo grave. Sin vaivenes lentos ni crepitación: eso sonaba a brisa o a estática.
 */
function breath({ seconds, seed, firstHzAt, secondHzAt, gainAt }) {
  const random = createRandom(seed);
  const out = buffer(seconds);
  const bandA = createBandpass();
  const bandB = createBandpass();
  const kDark = onePole(1500);
  const kBody = onePole(200);
  const dark = [0, 0, 0, 0];
  const body = [0, 0, 0];
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const noise = random() * 2 - 1;
    random(); // se descarta un número por muestra para conservar la misma secuencia de ruido de la muestra aprobada
    dark[0] += kDark * (noise - dark[0]);
    dark[1] += kDark * (dark[0] - dark[1]);
    dark[2] += kDark * (dark[1] - dark[2]);
    dark[3] += kDark * (dark[2] - dark[3]);
    body[0] += kBody * (noise - body[0]);
    body[1] += kBody * (body[0] - body[1]);
    body[2] += kBody * (body[1] - body[2]);
    const first = bandA(dark[3], firstHzAt(t), 1.3);
    const second = bandB(dark[3], secondHzAt(t), 1.6);
    out[i] = (first + 0.4 * second + body[2]) * gainAt(t);
  }
  return out;
}

// Inhalar: entra suave, crece hasta casi el final y se corta con una salida corta, como cuando se toma aire.
const inhaleBreath = () =>
  scaleTo(
    breath({
      seconds: 4,
      seed: 478,
      firstHzAt: (t) => lerp(240, 380, smooth(t / 4)),
      secondHzAt: (t) => lerp(520, 820, smooth(t / 4)),
      gainAt: (t) => smooth(t / 0.55) * (0.35 + 0.65 * smooth(t / 3.6)) * smooth((4 - t) / 0.25),
    }),
    BREATH_PEAK,
  );

// Exhalar: arranca pronto, cae y deja una cola larga y muy baja, como cuando se suelta el aire.
const exhaleBreath = () =>
  scaleTo(
    breath({
      seconds: 8,
      seed: 874,
      firstHzAt: (t) => lerp(380, 230, smooth(t / 8)),
      secondHzAt: (t) => lerp(760, 480, smooth(t / 8)),
      gainAt: (t) => smooth(t / 0.4) * (0.12 + 0.88 * Math.exp(-t / 1.9)) * smooth((8 - t) / 0.8),
    }),
    BREATH_PEAK,
  );

// ── Latido con eco ────────────────────────────────────────────────────────
/** Golpe grave y redondo: un seno que baja de tono más un armónico (×2) para que se oiga en altavoces pequeños. */
function thump(attackSeconds) {
  const out = buffer(0.7);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const hz = lerp(BEAT_START_HZ, BEAT_END_HZ, smooth(t / 0.2));
    const envelope = smooth(t / attackSeconds) * Math.exp(-t / 0.14);
    out[i] =
      envelope * (Math.sin(TWO_PI * hz * t) + 1.0 * Math.sin(TWO_PI * 2 * hz * t) * Math.exp(-t / 0.09));
  }
  return scaleTo(out, BEAT_PEAK);
}

/** El golpe con dos repeticiones lejanas y borrosas: el eco. */
function echoBeat(attackSeconds) {
  const out = buffer(1.3);
  const main = thump(attackSeconds);
  addAt(out, main, 0);
  addAt(out, main, 0.23, dB(-11));
  addAt(out, main, 0.47, dB(-19));
  return out;
}

/**
 * Pone un latido por segundo entero. El primero es más marcado y ataca más lento (50 ms): así el archivo entra de
 * forma gradual sin apagar su énfasis. Lo que pase del final lo apaga la salida del archivo.
 */
function withBeats(base, phase) {
  const out = Float64Array.from(base);
  const first = echoBeat(FIRST_BEAT_ATTACK_SECONDS);
  const beat = echoBeat(BEAT_ATTACK_SECONDS);
  const seconds = PHASE_SECONDS[phase];
  for (let k = 0; k < seconds; k++) addAt(out, k === 0 ? first : beat, k, k === 0 ? BEAT_ACCENT[phase] : 1);
  return out;
}

/** Salida gradual, para que ningún archivo termine con un chasquido (la cola del último latido no cabe entera). */
function fadeOut(samples) {
  const out = Float64Array.from(samples);
  for (let i = 0; i < out.length; i++) out[i] *= smooth((out.length - 1 - i) / SR / FADE_OUT_SECONDS);
  return out;
}

const RENDERERS = {
  inhale: () => fadeOut(withBeats(inhaleBreath(), 'inhale')),
  hold: () => fadeOut(withBeats(buffer(PHASE_SECONDS.hold), 'hold')),
  exhale: () => fadeOut(withBeats(exhaleBreath(), 'exhale')),
};

/** Muestras de los tres sonidos, por nombre. Pura: no escribe nada en disco. */
export function renderSounds() {
  const floats = Object.fromEntries(SOUND_NAMES.map((name) => [name, RENDERERS[name]()]));
  // Un solo factor para los tres: el pico mayor queda en −6 dBFS como máximo y se conserva el equilibrio entre archivos.
  const loudest = Math.max(...SOUND_NAMES.map((name) => peakOf(floats[name])));
  const gain = loudest > MAX_PEAK ? MAX_PEAK / loudest : 1;
  return Object.fromEntries(
    SOUND_NAMES.map((name) => [name, Int16Array.from(floats[name], (value) => Math.round(value * gain * 32_767))]),
  );
}

/** WAV mono de 16 bits con cabecera estándar de 44 bytes. */
export function encodeWav(samples, sampleRate = SAMPLE_RATE) {
  const dataBytes = samples.length * 2;
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write('RIFF', 0, 'ascii');
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVE', 8, 'ascii');
  wav.write('fmt ', 12, 'ascii');
  wav.writeUInt32LE(16, 16); // tamaño del bloque fmt
  wav.writeUInt16LE(1, 20); // PCM
  wav.writeUInt16LE(1, 22); // mono
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28); // bytes por segundo
  wav.writeUInt16LE(2, 32); // bytes por muestra
  wav.writeUInt16LE(16, 34); // bits por muestra
  wav.write('data', 36, 'ascii');
  wav.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) wav.writeInt16LE(samples[i], 44 + i * 2);
  return wav;
}

/** Duración, pico y nivel RMS de un sonido, para revisarlo sin escucharlo. */
export function describeSound(samples, sampleRate = SAMPLE_RATE) {
  let peak = 0;
  let sumSquares = 0;
  for (const value of samples) {
    peak = Math.max(peak, Math.abs(value));
    sumSquares += value * value;
  }
  const rms = Math.sqrt(sumSquares / samples.length);
  return {
    seconds: samples.length / sampleRate,
    peak: peak / 32_767,
    rms: rms / 32_767,
    peakDbfs: 20 * Math.log10(peak / 32_767),
    rmsDbfs: 20 * Math.log10(rms / 32_767),
  };
}

function writeAll(outputDir) {
  mkdirSync(outputDir, { recursive: true });
  const sounds = renderSounds();
  for (const name of SOUND_NAMES) {
    writeFileSync(path.join(outputDir, `${name}.wav`), encodeWav(sounds[name]));
    const info = describeSound(sounds[name]);
    console.log(
      `${name.padEnd(8)} ${info.seconds.toFixed(2).padStart(5)} s  pico ${info.peakDbfs.toFixed(1).padStart(6)} dBFS  RMS ${info.rmsDbfs.toFixed(1).padStart(6)} dBFS`,
    );
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const defaultDir = path.resolve(here, '../../assets/sounds/breathing');
  writeAll(process.argv[2] ? path.resolve(process.argv[2]) : defaultDir);
}
