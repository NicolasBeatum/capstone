import test from 'node:test';
import assert from 'node:assert/strict';
import { startPlannerPolling } from '../src/shared/planner/application/plannerPolling.ts';
test('el reloj se actualiza y se detiene sin listeners residuales', () => {
  let callback, ticks = 0, cleared = 0;
  const stop = startPlannerPolling(() => ticks++, {
    set: (fn) => {
      callback = fn;
      return 1;
    },
    clear: () => cleared++,
  });
  callback();
  assert.equal(ticks, 1);
  stop();
  stop();
  callback();
  assert.equal(ticks, 1);
  assert.equal(cleared, 1);
});
