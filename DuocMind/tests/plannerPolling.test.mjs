import test from 'node:test';
import assert from 'node:assert/strict';
import { startPlannerPolling } from '../src/shared/planner/application/plannerPolling.ts';
test('polling respeta conexión, actualiza reloj y se detiene sin listeners residuales', () => {
  let callback, connected = false, ticks = 0, syncs = 0, cleared = 0;
  const stop = startPlannerPolling(() => ticks++, () => syncs++, () => connected, {
    set: (fn) => {
      callback = fn;
      return 1;
    },
    clear: () => cleared++,
  });
  callback();
  assert.equal(ticks, 1);
  assert.equal(syncs, 0);
  connected = true;
  callback();
  assert.equal(syncs, 1);
  stop();
  stop();
  callback();
  assert.equal(ticks, 2);
  assert.equal(cleared, 1);
});
