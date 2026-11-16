import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPhases,
  clampSetting,
  formatTime,
  lastSessionMessage,
  parseSession,
} from '../src/features/wellness/domain/pomodoro.ts';

test('arma bloques de estudio con descansos entre medio', () => {
  const phases = buildPhases({ studyMinutes: 30, breakMinutes: 20, blocks: 2 });
  assert.deepEqual(phases.map((p) => p.kind), ['study', 'break', 'study']);
});

test('formatea segundos como mm:ss', () => {
  assert.equal(formatTime(1500), '25:00');
  assert.equal(formatTime(61.2), '01:02');
  assert.equal(formatTime(-3), '00:00');
});

test('respeta los límites de cada ajuste', () => {
  assert.equal(clampSetting('blocks', 0), 1);
  assert.equal(clampSetting('studyMinutes', 200), 90);
});

test('lee la última sesión guardada e ignora datos dañados', () => {
  const session = {
    config: { studyMinutes: 30, breakMinutes: 20, blocks: 2 },
    completedBlocks: 2,
    studiedMinutes: 60,
    finishedAt: '2026-11-15T12:00:00.000Z',
  };
  assert.deepEqual(parseSession(JSON.stringify(session)), session);
  assert.equal(parseSession('{roto'), null);
  assert.equal(parseSession(null), null);
  assert.match(lastSessionMessage(session), /2 bloques, 60 min/);
});
