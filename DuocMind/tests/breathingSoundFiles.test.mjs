import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SAMPLE_RATE,
  SOUND_NAMES,
  describeSound,
  encodeWav,
  renderSounds,
} from '../tools/scripts/generate-breathing-sounds.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const soundsDir = path.join(root, 'assets/sounds/breathing');
const script = path.join(root, 'tools/scripts/generate-breathing-sounds.mjs');

const MINUS_6_DBFS = 0.5012;
const SECONDS = { inhale: 4, hold: 7, exhale: 8 };

/** Lee un WAV y devuelve su formato y sus muestras. */
function readWav(file) {
  const buffer = readFileSync(file);
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buffer.toString('ascii', 8, 12), 'WAVE');
  assert.equal(buffer.toString('ascii', 12, 16), 'fmt ');
  const format = {
    audioFormat: buffer.readUInt16LE(20),
    channels: buffer.readUInt16LE(22),
    sampleRate: buffer.readUInt32LE(24),
    bitsPerSample: buffer.readUInt16LE(34),
  };
  assert.equal(buffer.toString('ascii', 36, 40), 'data');
  const dataBytes = buffer.readUInt32LE(40);
  assert.equal(buffer.length, 44 + dataBytes, 'la cabecera describe el tamaño real del archivo');
  const samples = new Int16Array(dataBytes / 2);
  for (let i = 0; i < samples.length; i++) samples[i] = buffer.readInt16LE(44 + i * 2);
  return { format, samples, size: buffer.length };
}

const files = Object.fromEntries(SOUND_NAMES.map((name) => [name, readWav(path.join(soundsDir, `${name}.wav`))]));

/** Pico (de 0 a 1) de las muestras entre dos instantes, en segundos. */
function peakBetween(samples, fromSecond, toSecond) {
  let peak = 0;
  const from = Math.max(0, Math.round(fromSecond * SAMPLE_RATE));
  const to = Math.min(samples.length, Math.round(toSecond * SAMPLE_RATE));
  for (let i = from; i < to; i++) peak = Math.max(peak, Math.abs(samples[i]));
  return peak / 32_767;
}

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

test('existen exactamente los tres archivos esperados y ninguna campanilla', () => {
  assert.deepEqual(SOUND_NAMES, ['inhale', 'hold', 'exhale']);
  assert.deepEqual(readdirSync(soundsDir).sort(), ['exhale.wav', 'hold.wav', 'inhale.wav']);
});

test('todos son WAV PCM, mono, de 16 bits a 22 050 Hz', () => {
  for (const [name, { format }] of Object.entries(files)) {
    assert.deepEqual(format, { audioFormat: 1, channels: 1, sampleRate: 22_050, bitsPerSample: 16 }, name);
  }
  assert.equal(SAMPLE_RATE, 22_050);
});

test('duran 4, 7 y 8 segundos (±50 ms)', () => {
  for (const [name, seconds] of Object.entries(SECONDS)) {
    const actual = files[name].samples.length / SAMPLE_RATE;
    assert.ok(Math.abs(actual - seconds) <= 0.05, `${name} ${actual}`);
  }
});

test('el pico de cada archivo no supera −6 dBFS y ninguno queda demasiado bajo', () => {
  for (const name of SOUND_NAMES) {
    const { peak, peakDbfs } = describeSound(files[name].samples);
    assert.ok(peak <= MINUS_6_DBFS, `${name}: pico ${peakDbfs.toFixed(1)} dBFS`);
    assert.ok(peak >= 0.15, `${name}: pico ${peakDbfs.toFixed(1)} dBFS es demasiado bajo`);
  }
});

test('el nivel (RMS) de cada archivo está a no más de 9 dB del más fuerte', () => {
  // La pausa solo tiene latidos, así que suena algo más baja que los dos con soplo, pero no mucho.
  const levels = SOUND_NAMES.map((name) => describeSound(files[name].samples).rmsDbfs);
  assert.ok(Math.max(...levels) - Math.min(...levels) <= 9, `RMS en dBFS: ${levels.map((v) => v.toFixed(1)).join(', ')}`);
});

test('cada archivo empieza y termina en silencio', () => {
  const NEAR_SILENCE = 20; // de 32 767: menos de −64 dBFS
  for (const name of SOUND_NAMES) {
    const { samples } = files[name];
    assert.ok(Math.abs(samples[0]) <= NEAR_SILENCE, `${name}: primera muestra ${samples[0]}`);
    assert.ok(Math.abs(samples[samples.length - 1]) <= NEAR_SILENCE, `${name}: última muestra ${samples[samples.length - 1]}`);
  }
});

test('no hay saltos bruscos entre muestras vecinas (sin chasquidos)', () => {
  // Con ondas graves y suaves, un salto grande entre muestras sería un clic.
  const MAX_STEP = 5_000; // ≈ 0,15 de la escala completa
  for (const name of SOUND_NAMES) {
    const { samples } = files[name];
    let worst = 0;
    for (let i = 1; i < samples.length; i++) worst = Math.max(worst, Math.abs(samples[i] - samples[i - 1]));
    assert.ok(worst <= MAX_STEP, `${name}: salto máximo ${worst}`);
  }
});

test('la entrada y la salida son graduales (≥ 50 ms): el volumen queda bajo una rampa suave', () => {
  const RAMP = Math.round(0.05 * SAMPLE_RATE);
  for (const name of SOUND_NAMES) {
    const { samples } = files[name];
    const peak = describeSound(samples).peak * 32_767;
    for (let i = 0; i < RAMP; i++) {
      // Una rampa ideal con un margen de 3× (el latido suma un seno y su armónico, y su forma no llega a 1 en la
      // normalización; con el ataque de 50 ms el inicio queda hasta ~1,7× sobre la rampa) y 3 muestras por el
      // redondeo. Un chasquido o un ataque de 24 ms (≈ 7× sobre la rampa) superan este límite de sobra.
      const bound = Math.min(peak, peak * smooth(i / RAMP) * 3) + 3;
      assert.ok(Math.abs(samples[i]) <= bound, `${name}: la entrada salta en la muestra ${i} (${samples[i]})`);
      const j = samples.length - 1 - i;
      assert.ok(Math.abs(samples[j]) <= bound, `${name}: la salida salta en la muestra ${j} (${samples[j]})`);
    }
    // En la práctica, los primeros 10 ms ya están muy por debajo del pico.
    assert.ok(peakBetween(samples, 0, 0.01) < (peak / 32_767) * 0.25, `${name}: arranca demasiado fuerte`);
  }
});

test('hay un latido en cada segundo entero: 4 en inhale, 7 en hold y 8 en exhale', () => {
  for (const [name, seconds] of Object.entries(SECONDS)) {
    const { samples } = files[name];
    for (let k = 0; k < seconds; k++) {
      const onset = peakBetween(samples, k, k + 0.2);
      assert.ok(onset >= 0.15, `${name}: no se oye un latido en el segundo ${k} (pico ${onset.toFixed(3)})`);
      if (k > 0) {
        // Justo antes del latido el golpe anterior ya casi se apagó: el latido es un impulso distinto, no un tono parejo.
        const before = peakBetween(samples, k - 0.08, k);
        assert.ok(onset >= 1.8 * before, `${name}: el latido del segundo ${k} no se distingue (${onset.toFixed(3)} frente a ${before.toFixed(3)})`);
      }
    }
  }
});

test('el primer latido de cada archivo es el más marcado del archivo', () => {
  for (const name of SOUND_NAMES) {
    const { samples } = files[name];
    const first = peakBetween(samples, 0, 0.3);
    assert.equal(first, describeSound(samples).peak, `${name}: el primer latido no es el más fuerte`);
  }
});

test('el soplo suena en inhale y exhale y no en hold, que solo tiene latidos', () => {
  // Entre dos latidos (0,6 a 0,95 s después de cada uno) solo queda el soplo, si lo hay.
  const between = (name, k) => peakBetween(files[name].samples, k + 0.6, k + 0.95);
  assert.ok(between('inhale', 2) > 0.04, `inhale sin soplo: ${between('inhale', 2).toFixed(3)}`);
  assert.ok(between('exhale', 1) > 0.04, `exhale sin soplo: ${between('exhale', 1).toFixed(3)}`);
  for (let k = 1; k < 6; k++) {
    assert.ok(between('hold', k) < 0.03, `hold con soplo en el segundo ${k}: ${between('hold', k).toFixed(3)}`);
  }
});

test('el soplo de la inhalación crece y el de la exhalación se apaga', () => {
  const quiet = (name, from, to) => peakBetween(files[name].samples, from + 0.6, to + 0.95);
  // Entre latidos: al principio de la inhalación el soplo es más bajo que al final, y en la exhalación al revés.
  assert.ok(quiet('inhale', 0, 0) < quiet('inhale', 2, 2), 'la inhalación no crece');
  assert.ok(quiet('exhale', 0, 0) > quiet('exhale', 6, 6) * 2, 'la exhalación no se apaga');
});

test('el conjunto pesa 1,5 MB o menos', () => {
  const total = SOUND_NAMES.reduce((sum, name) => sum + statSync(path.join(soundsDir, `${name}.wav`)).size, 0);
  assert.ok(total <= 1_500_000, `${total} bytes`);
});

test('los archivos versionados coinciden con lo que genera el script (renderSounds)', () => {
  const rendered = renderSounds();
  for (const name of SOUND_NAMES) {
    const expected = encodeWav(rendered[name]);
    const actual = readFileSync(path.join(soundsDir, `${name}.wav`));
    assert.ok(expected.equals(actual), `${name}.wav no coincide con renderSounds()`);
  }
});

test('ejecutar el script dos veces no cambia ni un byte y reproduce los archivos versionados', () => {
  const hashes = (dir) =>
    Object.fromEntries(
      readdirSync(dir)
        .sort()
        .map((file) => [file, createHash('sha256').update(readFileSync(path.join(dir, file))).digest('hex')]),
    );
  const temp = mkdtempSync(path.join(tmpdir(), 'breathing-sounds-'));
  try {
    execFileSync(process.execPath, [script, temp], { stdio: 'ignore' });
    const first = hashes(temp);
    execFileSync(process.execPath, [script, temp], { stdio: 'ignore' });
    const second = hashes(temp);
    assert.deepEqual(second, first, 'dos ejecuciones dan archivos distintos');
    assert.deepEqual(first, hashes(soundsDir), 'el script no reproduce los archivos versionados');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('el script no escribe nada al importarse', () => {
  const sounds = renderSounds();
  assert.deepEqual(Object.keys(sounds), SOUND_NAMES);
  assert.ok(sounds.inhale instanceof Int16Array);
});
