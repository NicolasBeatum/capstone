import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  FADE_STEPS,
  FADE_STEP_MS,
  createBreathSoundPlayerWith,
} from '../src/features/wellness/infrastructure/breathSoundPlayerCore.ts';

const SOURCES = { inhale: 1, hold: 2, exhale: 3 };

/** Audio falso: anota cada orden de cada reproductor y deja ver su estado. */
function fakeAudio({ failing = false } = {}) {
  const created = [];
  const state = { configureCalls: 0 };
  const deps = {
    sources: SOURCES,
    createPlayer(source) {
      if (failing) throw new Error('no se pudo crear');
      const player = {
        source,
        volume: 1,
        playing: false,
        position: 5, // simula que quedó a la mitad de una reproducción anterior
        removed: false,
        events: [],
        play() {
          this.events.push('play');
          this.playing = true;
        },
        pause() {
          this.events.push('pause');
          this.playing = false;
        },
        async seekTo(seconds) {
          this.events.push(`seek${seconds}`);
          this.position = seconds;
        },
        remove() {
          this.removed = true;
        },
      };
      created.push(player);
      return player;
    },
    async configureAudio() {
      state.configureCalls += 1;
    },
  };
  return { deps, created, state, byName: (name) => created.find((p) => p.source === SOURCES[name]) };
}

const approx = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} ≠ ${expected}`);

test('preload configura el audio una sola vez y crea un reproductor por sonido, con su archivo', async () => {
  const { deps, created, state } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  await player.preload();
  player.play('inhale');
  assert.equal(state.configureCalls, 1);
  assert.deepEqual(created.map((p) => p.source).sort(), [1, 2, 3]);
});

test('play vuelve a 0 s, restablece el volumen y reproduce solo ese sonido', async () => {
  const { deps, byName } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  byName('hold').volume = 0.3;
  player.play('hold');
  await Promise.resolve();
  const hold = byName('hold');
  assert.equal(hold.volume, 1);
  assert.equal(hold.playing, true);
  assert.equal(hold.position, 0);
  assert.equal(byName('inhale').playing, false);
  assert.equal(byName('exhale').playing, false);
});

test('play da la orden de volver a 0 s ANTES de reproducir (un sonido que terminó queda al final del archivo)', async () => {
  const { deps, byName } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  const hold = byName('hold');
  hold.position = 7; // terminó de sonar en el ciclo anterior
  hold.events.length = 0;
  player.play('hold');
  assert.deepEqual(hold.events, ['seek0', 'play'], 'el rebobinado debe darse antes de play, sin esperar un tick');
  assert.equal(hold.position, 0);
});

test('un sonido nuevo no corta al que ya suena (el eco de una fase sigue al empezar la siguiente)', async () => {
  const { deps, byName } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  player.play('inhale');
  player.play('hold');
  assert.equal(byName('inhale').playing, true, 'la inhalación sigue sonando');
  assert.equal(byName('inhale').events.includes('pause'), false);
  assert.equal(byName('hold').playing, true);
});

test('stopAll baja el volumen en 5 pasos de 30 ms y al final pausa, vuelve a 0 s y restablece el volumen', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const { deps, byName } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  player.play('inhale');
  const inhale = byName('inhale');

  player.stopAll();
  const volumes = [];
  for (let step = 1; step < FADE_STEPS; step++) {
    t.mock.timers.tick(FADE_STEP_MS);
    volumes.push(inhale.volume);
    assert.equal(inhale.playing, true, `sigue sonando en el paso ${step}`);
  }
  [0.8, 0.6, 0.4, 0.2].forEach((expected, i) => approx(volumes[i], expected, `volumen del paso ${i + 1}`));

  t.mock.timers.tick(FADE_STEP_MS);
  await Promise.resolve();
  assert.equal(inhale.playing, false);
  assert.equal(inhale.volume, 1, 'el volumen queda restablecido para la próxima vez');
  assert.equal(inhale.position, 0);
  assert.ok(FADE_STEPS * FADE_STEP_MS <= 200, 'la salida dura 200 ms como máximo (RF-006.1)');
});

test('stopAll silencia a todos los que sonaron, también a los que suenan a la vez', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const { deps, byName } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  player.play('inhale');
  player.play('hold');
  player.stopAll();
  t.mock.timers.tick(FADE_STEPS * FADE_STEP_MS);
  assert.equal(byName('inhale').playing, false);
  assert.equal(byName('hold').playing, false);
});

test('un segundo stopAll durante la salida no reinicia el fundido: el volumen nunca sube', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const { deps, byName } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  player.play('inhale');
  const inhale = byName('inhale');

  player.stopAll();
  t.mock.timers.tick(FADE_STEP_MS * 3); // volumen 0,4
  const before = inhale.volume;
  player.stopAll(); // p. ej., «Detener» y enseguida salir de la pantalla
  t.mock.timers.tick(FADE_STEP_MS);
  assert.ok(inhale.volume <= before, `el volumen subió de ${before} a ${inhale.volume}`);
  t.mock.timers.tick(FADE_STEP_MS);
  assert.equal(inhale.playing, false, 'termina a los 150 ms desde el primer stopAll');
});

test('un play() durante la salida la cancela: lo anterior se cierra y lo nuevo suena completo', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const { deps, byName } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  player.play('exhale');
  player.stopAll();
  t.mock.timers.tick(FADE_STEP_MS * 2); // el volumen de exhale baja a 0,6

  player.play('inhale'); // «Repetir» enseguida
  const exhale = byName('exhale');
  const inhale = byName('inhale');
  assert.equal(exhale.playing, false, 'lo que se estaba apagando queda cerrado');
  assert.equal(exhale.volume, 1);
  assert.equal(inhale.playing, true);
  assert.equal(inhale.volume, 1);

  t.mock.timers.tick(FADE_STEPS * FADE_STEP_MS); // la salida cancelada no debe apagar lo nuevo
  assert.equal(inhale.playing, true, 'la salida cancelada no apaga el sonido nuevo');
  assert.equal(inhale.volume, 1);
});

test('stopAll sin nada sonando no hace nada', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const { deps, created } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  player.stopAll();
  t.mock.timers.tick(1000);
  assert.ok(created.every((p) => p.events.length === 0));
});

test('release silencia, cancela la salida pendiente y libera los tres reproductores', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const { deps, created } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  player.play('hold');
  player.stopAll();
  player.release();
  assert.equal(created.length, 3);
  assert.ok(created.every((p) => p.removed), 'los tres se liberan');
  assert.ok(created.every((p) => !p.playing));
  const eventsAfter = created.map((p) => p.events.length);
  t.mock.timers.tick(1000);
  assert.deepEqual(created.map((p) => p.events.length), eventsAfter, 'no queda ninguna salida pendiente');
});

test('si el audio falla (modo, seekTo o remove), no hay rechazos sin atender ni excepciones al silenciar', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const { deps, byName } = fakeAudio();
  deps.configureAudio = async () => {
    throw new Error('sin modo de audio');
  };
  const player = createBreathSoundPlayerWith(deps);
  await assert.doesNotReject(player.preload());
  for (const name of ['inhale', 'hold', 'exhale']) {
    const p = byName(name);
    p.seekTo = async () => {
      throw new Error('seekTo falla');
    };
    p.remove = () => {
      throw new Error('remove falla');
    };
  }
  const unhandled = [];
  const onUnhandled = (reason) => unhandled.push(reason);
  process.on('unhandledRejection', onUnhandled);
  try {
    player.play('inhale');
    player.stopAll();
    t.mock.timers.tick(FADE_STEPS * FADE_STEP_MS);
    assert.doesNotThrow(() => player.release());
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(unhandled, []);
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
});

test('un play() que lanza no deja al reproductor en un estado roto: el siguiente sonido funciona', async () => {
  const { deps, byName } = fakeAudio();
  const player = createBreathSoundPlayerWith(deps);
  await player.preload();
  const inhale = byName('inhale');
  const original = inhale.play;
  inhale.play = () => {
    throw new Error('falla una vez');
  };
  assert.throws(() => player.play('inhale')); // el controlador lo captura en su try/catch
  inhale.play = original;
  assert.doesNotThrow(() => player.play('hold'));
  assert.equal(byName('hold').playing, true);
});
