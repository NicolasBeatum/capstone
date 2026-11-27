import test from 'node:test';
import assert from 'node:assert/strict';
import { BREATH_CYCLES, breathMomentAt } from '../src/features/wellness/domain/breathing478.ts';
import { LATE_CUE_TOLERANCE_SECONDS, soundForMoment } from '../src/features/wellness/domain/breathingSounds.ts';
import { createBreathSoundController } from '../src/features/wellness/application/breathingSoundController.ts';

// Atajo: el momento de la respiración a los t segundos de una sesión.
const at = (seconds) => breathMomentAt(seconds);

test('sin momento no suena nada, ni al terminar la sesión', () => {
  assert.equal(soundForMoment({ previous: null, current: null }), null);
  assert.equal(soundForMoment({ previous: at(3), current: null }), null);
  // Fin natural: el último momento atendido era la exhalación y ahora no hay momento. No hay sonido de cierre.
  assert.equal(soundForMoment({ previous: at(75.9), current: null }), null);
});

test('en la misma fase y el mismo ciclo no vuelve a sonar', () => {
  assert.equal(soundForMoment({ previous: at(1), current: at(1.05) }), null);
  assert.equal(soundForMoment({ previous: at(5), current: at(6) }), null);
});

test('si el cambio se detecta tarde, no suena; el límite es inclusivo', () => {
  // Pausa del ciclo 1: empieza en 4 s.
  assert.equal(LATE_CUE_TOLERANCE_SECONDS, 0.5);
  assert.equal(soundForMoment({ previous: at(3.9), current: at(4.2) }), 'hold');
  assert.equal(soundForMoment({ previous: at(3.9), current: at(4.5) }), 'hold');
  assert.equal(soundForMoment({ previous: at(3.9), current: at(4.6) }), null);
});

test('la primera inhalación de la sesión suena sola, sin sonido de inicio', () => {
  assert.equal(soundForMoment({ previous: null, current: at(0) }), 'inhale');
});

test('al volver con la fase ya avanzada (sin momento previo), no suena nada', () => {
  assert.equal(soundForMoment({ previous: null, current: at(0.8) }), null);
  assert.equal(soundForMoment({ previous: null, current: at(9) }), null);
});

test('la inhalación de los ciclos 2, 3 y 4 suena sola, sin sonido de cambio de ciclo', () => {
  for (const cycleStart of [19, 38, 57]) {
    assert.equal(
      soundForMoment({ previous: at(cycleStart - 0.05), current: at(cycleStart) }),
      'inhale',
      `ciclo que empieza en ${cycleStart} s`,
    );
  }
});

test('una inhalación de otro ciclo suena aunque el momento anterior fuera también una inhalación', () => {
  // Pasa si la pantalla no actualizó durante un ciclo entero (p. ej., al volver de segundo plano).
  assert.equal(soundForMoment({ previous: at(1), current: at(19.2) }), 'inhale');
  assert.equal(soundForMoment({ previous: at(1), current: at(19.8) }), null); // ya es tarde
});

test('la pausa y la exhalación suenan al empezar su fase', () => {
  assert.equal(soundForMoment({ previous: at(3.95), current: at(4) }), 'hold');
  assert.equal(soundForMoment({ previous: at(10.95), current: at(11) }), 'exhale');
});

test('una sesión completa produce exactamente 12 sonidos de fase y ningún otro, una sola vez cada uno', () => {
  const events = [];
  let previous = null;
  // La pantalla actualiza cada 50 ms: 20 tics por segundo; se sigue 4 s más allá del final para ver que no suena nada.
  for (let i = 0; i <= 80 * 20; i++) {
    const seconds = i / 20;
    const current = at(seconds);
    const sound = soundForMoment({ previous, current });
    if (sound !== null) events.push([Math.round(seconds * 100) / 100, sound]);
    if (current !== null) previous = current;
  }
  assert.deepEqual(events, [
    [0, 'inhale'],
    [4, 'hold'],
    [11, 'exhale'],
    [19, 'inhale'],
    [23, 'hold'],
    [30, 'exhale'],
    [38, 'inhale'],
    [42, 'hold'],
    [49, 'exhale'],
    [57, 'inhale'],
    [61, 'hold'],
    [68, 'exhale'],
  ]);
  assert.equal(events.length, 3 * BREATH_CYCLES);
  assert.deepEqual([...new Set(events.map(([, id]) => id))].sort(), ['exhale', 'hold', 'inhale']);
});

/* ───────────── Controlador ───────────── */

// Reproductor falso: anota cada orden con el tiempo simulado.
function fakePlayer(options = {}) {
  const log = { now: 0, plays: [], stopAll: 0, release: 0, preload: 0 };
  const fail = (name) => {
    if (options.failing) throw new Error(`falla ${name}`);
  };
  return {
    log,
    player: {
      preload: async () => {
        log.preload += 1;
        fail('preload');
      },
      play: (id) => {
        fail('play');
        log.plays.push([log.now, id]);
      },
      stopAll: () => {
        log.stopAll += 1;
        fail('stopAll');
      },
      release: () => {
        log.release += 1;
        fail('release');
      },
    },
  };
}

// Simula lo que hace la pantalla: un tic cada 50 ms; al terminar la sesión el momento pasa a null.
function runSession(controller, log, { from = 0, until = 80, onTick } = {}) {
  for (let i = from * 20; i <= until * 20; i++) {
    const seconds = i / 20;
    log.now = seconds;
    onTick?.(seconds);
    const moment = at(seconds);
    controller.update(moment);
    if (moment === null) break;
  }
}

const EXPECTED_SESSION = [
  [0, 'inhale'],
  [4, 'hold'],
  [11, 'exhale'],
  [19, 'inhale'],
  [23, 'hold'],
  [30, 'exhale'],
  [38, 'inhale'],
  [42, 'hold'],
  [49, 'exhale'],
  [57, 'inhale'],
  [61, 'hold'],
  [68, 'exhale'],
];

test('el controlador reproduce la secuencia exacta de una sesión completa', () => {
  const { player, log } = fakePlayer();
  const controller = createBreathSoundController(player, () => true);
  controller.begin();
  runSession(controller, log);
  assert.deepEqual(log.plays, EXPECTED_SESSION);
});

test('sin begin() no suena nada, aunque la pantalla actualice', () => {
  const { player, log } = fakePlayer();
  const controller = createBreathSoundController(player, () => true);
  runSession(controller, log);
  assert.deepEqual(log.plays, []);
});

test('con el sonido apagado no hay ninguna llamada a play en toda la sesión', () => {
  const { player, log } = fakePlayer();
  const controller = createBreathSoundController(player, () => false);
  controller.begin();
  runSession(controller, log);
  assert.deepEqual(log.plays, []);
});

test('encender el sonido a mitad de sesión no hace sonar lo que ya pasó', () => {
  const { player, log } = fakePlayer();
  let enabled = false;
  const controller = createBreathSoundController(player, () => enabled);
  controller.begin();
  runSession(controller, log, {
    onTick: (seconds) => {
      if (seconds === 30.5) enabled = true; // la exhalación de 30 s ya empezó
    },
  });
  assert.deepEqual(
    log.plays,
    EXPECTED_SESSION.filter(([seconds]) => seconds >= 38),
  );
});

test('apagar el sonido a mitad de sesión corta lo que falta, sin repetir nada al volver a encenderlo', () => {
  const { player, log } = fakePlayer();
  let enabled = true;
  const controller = createBreathSoundController(player, () => enabled);
  controller.begin();
  runSession(controller, log, {
    onTick: (seconds) => {
      if (seconds === 40) enabled = false;
      if (seconds === 60) enabled = true; // la pausa de 61 s sí debe sonar
    },
  });
  const expected = EXPECTED_SESSION.filter(([seconds]) => seconds < 40 || seconds >= 61);
  assert.deepEqual(log.plays, expected);
});

test('begin() y stop() silencian; begin() empieza limpio aunque la sesión anterior siga a medias', () => {
  const { player, log } = fakePlayer();
  const controller = createBreathSoundController(player, () => true);
  controller.begin();
  assert.equal(log.stopAll, 1);
  controller.stop();
  assert.equal(log.stopAll, 2);

  // Segunda sesión: vuelve a sonar desde el inicio.
  log.plays.length = 0;
  controller.begin();
  runSession(controller, log, { until: 5 });
  assert.deepEqual(log.plays, EXPECTED_SESSION.filter(([seconds]) => seconds <= 4));
  assert.equal(log.stopAll, 3);
});

test('un reproductor que falla en todos sus métodos no rompe la sesión', () => {
  const { player, log } = fakePlayer({ failing: true });
  const controller = createBreathSoundController(player, () => true);
  assert.doesNotThrow(() => {
    controller.begin();
    runSession(controller, log);
    controller.stop();
    controller.dispose();
  });
  assert.deepEqual(log.plays, []); // ningún sonido llegó a registrarse porque play lanzaba
});

test('si el audio falla en un sonido, los siguientes se intentan igual', () => {
  const played = [];
  let calls = 0;
  const player = {
    preload: async () => undefined,
    play: (id) => {
      calls += 1;
      if (calls === 1) throw new Error('falla solo la primera vez');
      played.push(id);
    },
    stopAll: () => undefined,
    release: () => undefined,
  };
  const controller = createBreathSoundController(player, () => true);
  controller.begin();
  controller.update(at(0)); // la inhalación falla; la pausa y la exhalación sí suenan
  controller.update(at(4));
  controller.update(at(11));
  assert.deepEqual(played, ['hold', 'exhale']);
});

test('tras stop() a mitad de fase no suena un sonido tardío; en el siguiente cambio vuelve a sonar', () => {
  const { player, log } = fakePlayer();
  const controller = createBreathSoundController(player, () => true);
  controller.begin();
  runSession(controller, log, { until: 5 }); // suena hasta la pausa de 4 s
  controller.stop(); // por ejemplo, la app pasó a segundo plano
  log.plays.length = 0;

  runSession(controller, log, { from: 8, until: 12 }); // vuelve a mitad de la pausa
  assert.deepEqual(log.plays, [[11, 'exhale']]);
});

test('al terminar no suena nada más, no se corta la última exhalación y el controlador queda quieto', () => {
  const { player, log } = fakePlayer();
  const controller = createBreathSoundController(player, () => true);
  controller.begin();
  const stopsBefore = log.stopAll;
  runSession(controller, log); // termina cuando el momento pasa a null (76 s)
  assert.equal(log.stopAll, stopsBefore, 'el fin natural no llama a stopAll: la exhalación termina sola');
  assert.deepEqual(log.plays, EXPECTED_SESSION);

  controller.update(null); // un segundo aviso de fin no hace sonar nada
  controller.update(at(0)); // ni una actualización suelta, sin un nuevo begin()
  assert.deepEqual(log.plays, EXPECTED_SESSION);

  // «Repetir»: un begin() nuevo vuelve a dejarlo sonar desde el principio.
  log.plays.length = 0;
  controller.begin();
  runSession(controller, log, { until: 5 });
  assert.deepEqual(log.plays, EXPECTED_SESSION.filter(([seconds]) => seconds <= 4));
});

test('«Detener»: stop() silencia y, al pasar el momento a null, no suena nada hasta el siguiente begin()', () => {
  const { player, log } = fakePlayer();
  const controller = createBreathSoundController(player, () => true);
  controller.begin();
  runSession(controller, log, { until: 5 });
  controller.stop();
  controller.update(null); // la pantalla pasa a «idle»
  log.plays.length = 0;
  controller.update(at(11)); // una actualización suelta no suena sin begin()
  assert.deepEqual(log.plays, []);
});

test('dispose() silencia, libera el reproductor y deja de sonar', () => {
  const { player, log } = fakePlayer();
  const controller = createBreathSoundController(player, () => true);
  controller.begin();
  controller.dispose();
  assert.equal(log.release, 1);
  assert.ok(log.stopAll >= 2);
  controller.update(at(0));
  assert.deepEqual(log.plays, []);
});
