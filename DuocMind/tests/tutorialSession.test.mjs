import test from 'node:test';
import assert from 'node:assert/strict';
import { TutorialSession, describeTutorial } from '../src/shared/tutorial/application/tutorialSession.ts';
import { TUTORIAL_STEPS } from '../src/shared/tutorial/domain/tutorialSteps.ts';

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const LAST = TUTORIAL_STEPS.length - 1;
const CHECKIN = TUTORIAL_STEPS.findIndex((step) => step.kind === 'checkin');

function setup() {
  const completed = [];
  const session = new TutorialSession((owner) => completed.push(owner));
  const state = () => session.getSnapshot();
  const view = () => describeTutorial(state());
  const openAuto = (owner = A) => session.openAuto(owner, session.captureGeneration());
  const goTo = (index) => {
    while (state().index < index) session.next();
  };
  return { session, completed, state, view, openAuto, goTo };
}

test('arranca cerrado y sin vista', () => {
  const { state, view } = setup();
  assert.deepEqual(state(), { phase: 'closed', index: 0, mode: 'auto', ownerId: null, generation: 0 });
  assert.equal(view(), null);
});

test('abre el recorrido automático en el paso 1 con la cuenta normalizada', () => {
  const { session, state, openAuto } = setup();
  assert.equal(openAuto(A.toUpperCase()), true);
  assert.equal(state().phase, 'steps');
  assert.equal(state().mode, 'auto');
  assert.equal(state().index, 0);
  assert.equal(state().ownerId, A);
  assert.equal(session.openAuto(B, session.captureGeneration()), false, 'ya hay uno abierto');
  assert.equal(state().ownerId, A);
});

test('rechaza una cuenta inválida o una generación vencida', () => {
  const { session, state } = setup();
  assert.equal(session.openAuto('no-es-uuid', 0), false);
  assert.equal(session.openAuto(A, 99), false);
  assert.equal(state().phase, 'closed');
});

test('el recorrido manual no tiene cuenta y no se abre sobre otro', () => {
  const { session, state } = setup();
  assert.equal(session.openManual(), true);
  assert.equal(state().mode, 'manual');
  assert.equal(state().ownerId, null);
  assert.equal(session.openManual(), false);
});

test('no se abre un recorrido automático ni manual sobre uno abierto', () => {
  const { session, openAuto } = setup();
  session.openManual();
  assert.equal(openAuto(), false);
});

test('avanza y retrocede dentro de los límites y se detiene en el paso 5 en automático', () => {
  const { session, state, openAuto } = setup();
  openAuto();
  session.back();
  assert.equal(state().index, 0, 'no retrocede del primero');
  for (let i = 0; i < 10; i += 1) session.next();
  assert.equal(state().index, CHECKIN, 'en automático solo «Registrar ahora» pasa del paso 5');
  session.back();
  assert.equal(state().index, CHECKIN - 1);
});

test('en manual se recorre hasta el paso 6 y desde allí no se avanza ni retrocede', () => {
  const { session, state } = setup();
  session.openManual();
  for (let i = 0; i < 10; i += 1) session.next();
  assert.equal(state().index, LAST);
  session.back();
  assert.equal(state().index, LAST);
});

test('describe cada paso del recorrido automático', () => {
  const { session, view, openAuto } = setup();
  openAuto();
  for (let index = 0; index < CHECKIN; index += 1) {
    const current = view();
    assert.equal(current.step.id, TUTORIAL_STEPS[index].id);
    assert.equal(current.position, `Paso ${index + 1} de 6`);
    assert.equal(current.primary.kind, 'next');
    assert.equal(current.primary.label, 'Siguiente');
    assert.equal(current.primary.accessibilityLabel, `Ir al paso ${index + 2}`);
    assert.equal(current.canSkip, true);
    assert.equal(current.canGoBack, index > 0);
    session.next();
  }
  const checkin = view();
  assert.equal(checkin.step.kind, 'checkin');
  assert.equal(checkin.position, 'Paso 5 de 6');
  assert.equal(checkin.primary.kind, 'register');
  assert.equal(checkin.primary.label, 'Registrar ahora');
  assert.equal(checkin.canSkip, true);
  assert.equal(checkin.canGoBack, true);
});

test('en manual el paso del check-in solo informa y el último ofrece «Entendido»', () => {
  const { session, view, goTo } = setup();
  session.openManual();
  goTo(CHECKIN);
  assert.equal(view().primary.kind, 'next');
  assert.equal(view().primary.label, 'Siguiente');
  session.next();
  const closing = view();
  assert.equal(closing.step.kind, 'closing');
  assert.equal(closing.position, 'Paso 6 de 6');
  assert.equal(closing.primary.kind, 'finish');
  assert.equal(closing.primary.label, 'Entendido');
  assert.equal(closing.canSkip, false);
  assert.equal(closing.canGoBack, false);
});

test('mientras se espera el check-in no hay vista', () => {
  const { session, view, openAuto, goTo } = setup();
  openAuto();
  goTo(CHECKIN);
  assert.equal(session.startCheckin(), true);
  assert.equal(view(), null);
});

test('«Registrar ahora» solo existe en automático y en el paso del check-in', () => {
  const manual = setup();
  manual.session.openManual();
  manual.goTo(CHECKIN);
  assert.equal(manual.session.startCheckin(), false);
  assert.equal(manual.state().phase, 'steps');

  const early = setup();
  early.openAuto();
  assert.equal(early.session.startCheckin(), false);
  assert.equal(early.state().phase, 'steps');

  const closed = setup();
  assert.equal(closed.session.startCheckin(), false);
});

test('volver del check-in sin guardar reabre el paso 5 sin marcar nada', () => {
  const { session, state, completed, view, openAuto, goTo } = setup();
  openAuto();
  goTo(CHECKIN);
  session.startCheckin();
  session.returnWithoutSaving();
  assert.equal(state().phase, 'steps');
  assert.equal(state().index, CHECKIN);
  assert.equal(view().primary.kind, 'register');
  assert.deepEqual(completed, []);
  session.returnWithoutSaving();
  assert.equal(state().index, CHECKIN, 'fuera de la espera no hace nada');
});

test('guardar el check-in marca la cuenta una vez y muestra «Todo listo»', () => {
  const { session, state, completed, view, openAuto, goTo } = setup();
  openAuto();
  goTo(CHECKIN);
  session.startCheckin();
  session.checkinSaved(A.toUpperCase());
  assert.deepEqual(completed, [A]);
  assert.equal(state().phase, 'closing');
  assert.equal(state().index, LAST);
  assert.equal(view().step.kind, 'closing');
  session.checkinSaved(A);
  assert.deepEqual(completed, [A], 'un segundo aviso no marca de nuevo');
});

test('un check-in de otra cuenta cierra sin marcar a ninguna', () => {
  const { session, state, completed, openAuto, goTo } = setup();
  openAuto();
  goTo(CHECKIN);
  session.startCheckin();
  session.checkinSaved(B);
  assert.deepEqual(completed, []);
  assert.equal(state().phase, 'closed');
});

test('un check-in guardado fuera de la espera no hace nada', () => {
  const { session, state, completed, openAuto, goTo } = setup();
  session.checkinSaved(A);
  openAuto();
  goTo(CHECKIN);
  session.checkinSaved(A);
  assert.deepEqual(completed, []);
  assert.equal(state().phase, 'steps');
  assert.equal(state().index, CHECKIN);
});

test('un check-in que falla no llega a la sesión y el recorrido sigue esperando', () => {
  const { session, state, completed, openAuto, goTo } = setup();
  openAuto();
  goTo(CHECKIN);
  session.startCheckin();
  assert.equal(state().phase, 'awaitingCheckin');
  assert.deepEqual(completed, []);
});

test('«Todo listo» se cierra con «Entendido» sin marcar de nuevo', () => {
  const { session, state, completed, openAuto, goTo } = setup();
  openAuto();
  goTo(CHECKIN);
  session.startCheckin();
  session.checkinSaved(A);
  session.finish();
  assert.equal(state().phase, 'closed');
  assert.deepEqual(completed, [A]);
});

test('omitir marca la cuenta solo en el recorrido automático y en los pasos', () => {
  const auto = setup();
  auto.openAuto();
  auto.session.skip();
  assert.deepEqual(auto.completed, [A]);
  assert.equal(auto.state().phase, 'closed');

  const atCheckin = setup();
  atCheckin.openAuto();
  atCheckin.goTo(CHECKIN);
  atCheckin.session.skip();
  assert.deepEqual(atCheckin.completed, [A], 'omitir en el paso 5 marca y no abre el check-in');
  assert.equal(atCheckin.state().phase, 'closed');

  const manual = setup();
  manual.session.openManual();
  manual.session.skip();
  assert.deepEqual(manual.completed, []);
  assert.equal(manual.state().phase, 'closed');

  const closing = setup();
  closing.openAuto();
  closing.goTo(CHECKIN);
  closing.session.startCheckin();
  closing.session.checkinSaved(A);
  closing.session.skip();
  assert.deepEqual(closing.completed, [A], 'en «Todo listo» no se marca de nuevo');
});

test('terminar el recorrido manual no marca nada', () => {
  const { session, state, completed, goTo } = setup();
  session.openManual();
  goTo(LAST);
  session.finish();
  assert.deepEqual(completed, []);
  assert.equal(state().phase, 'closed');
});

test('Atrás del sistema retrocede, y en el primer paso o en «Todo listo» cierra', () => {
  const mid = setup();
  mid.openAuto();
  mid.goTo(2);
  mid.session.systemBack();
  assert.equal(mid.state().index, 1);
  assert.deepEqual(mid.completed, []);

  const first = setup();
  first.openAuto();
  first.session.systemBack();
  assert.equal(first.state().phase, 'closed');
  assert.deepEqual(first.completed, [A], 'en el primer paso equivale a omitir');

  const closing = setup();
  closing.openAuto();
  closing.goTo(CHECKIN);
  closing.session.startCheckin();
  closing.session.checkinSaved(A);
  closing.session.systemBack();
  assert.equal(closing.state().phase, 'closed');
  assert.deepEqual(closing.completed, [A]);
});

test('cerrar sesión reinicia el recorrido y sube la generación', () => {
  const { session, state, completed, openAuto, goTo } = setup();
  session.accountChanged(A);
  openAuto();
  goTo(CHECKIN);
  session.startCheckin();
  const before = state().generation;
  session.accountChanged(null);
  assert.equal(state().phase, 'closed');
  assert.equal(state().ownerId, null);
  assert.equal(state().generation, before + 1);
  assert.deepEqual(completed, []);
});

test('otra cuenta reinicia el recorrido y la misma cuenta lo conserva', () => {
  const { session, state, openAuto } = setup();
  session.accountChanged(A);
  openAuto();
  session.accountChanged(A.toUpperCase());
  assert.equal(state().phase, 'steps');
  session.accountChanged(B);
  assert.equal(state().phase, 'closed');
});

test('el recorrido manual solo se reinicia al cerrar sesión', () => {
  const { session, state } = setup();
  session.accountChanged(A);
  session.openManual();
  session.accountChanged(A);
  assert.equal(state().phase, 'steps');
  session.accountChanged(null);
  assert.equal(state().phase, 'closed');
});

test('un cambio de cuenta invalida una oferta que se resolvió tarde', () => {
  const { session, state } = setup();
  session.accountChanged(A);
  const generation = session.captureGeneration();
  session.accountChanged(null);
  session.accountChanged(B);
  assert.equal(session.openAuto(A, generation), false);
  assert.equal(state().phase, 'closed');
  assert.equal(session.openAuto(B, session.captureGeneration()), true);
});

test('el primer aviso de sesión no invalida ofertas en curso', () => {
  const { session } = setup();
  const generation = session.captureGeneration();
  session.accountChanged(A);
  assert.equal(session.openAuto(A, generation), true);
});

test('un fallo al marcar no impide cerrar ni avanzar', () => {
  const session = new TutorialSession(() => {
    throw new Error('almacenamiento no disponible');
  });
  session.openAuto(A, session.captureGeneration());
  session.skip();
  assert.equal(session.getSnapshot().phase, 'closed');

  session.openAuto(A, session.captureGeneration());
  for (let i = 0; i < 10; i += 1) session.next();
  session.startCheckin();
  session.checkinSaved(A);
  assert.equal(session.getSnapshot().phase, 'closing');
});

test('avisa a los suscriptores solo cuando algo cambia y permite darse de baja', () => {
  const { session, openAuto } = setup();
  let calls = 0;
  const unsubscribe = session.subscribe(() => {
    calls += 1;
  });
  session.back();
  session.returnWithoutSaving();
  session.finish();
  assert.equal(calls, 0, 'las operaciones sin efecto no notifican');
  openAuto();
  assert.equal(calls, 1);
  session.next();
  assert.equal(calls, 2);
  unsubscribe();
  session.next();
  assert.equal(calls, 2);
});

test('cada cambio entrega un estado nuevo sin mutar el anterior', () => {
  const { session, state, openAuto } = setup();
  const before = state();
  openAuto();
  const after = state();
  assert.notEqual(before, after);
  assert.equal(before.phase, 'closed');
  assert.equal(after.phase, 'steps');
  assert.equal(state(), after, 'sin cambios devuelve la misma referencia');
  session.back();
  assert.equal(state(), after);
});

test('describeTutorial devuelve null en las fases sin vista', () => {
  assert.equal(describeTutorial({ phase: 'closed', index: 0, mode: 'auto', ownerId: null, generation: 0 }), null);
  assert.equal(describeTutorial({ phase: 'awaitingCheckin', index: CHECKIN, mode: 'auto', ownerId: A, generation: 0 }), null);
  assert.equal(describeTutorial({ phase: 'steps', index: 99, mode: 'auto', ownerId: A, generation: 0 }), null);
});
