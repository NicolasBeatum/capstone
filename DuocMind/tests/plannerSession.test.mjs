import test from 'node:test';
import assert from 'node:assert/strict';
import {
  persistedPlannerOwner,
  PlannerSessionCoordinator,
} from '../src/shared/planner/application/plannerSession.ts';
const a = '00000000-0000-4000-8000-000000000001', b = '00000000-0000-4000-8000-000000000002';
test('cambiar cuenta, volver a ella o bloquear invalida operaciones capturadas', () => {
  const c = new PlannerSessionCoordinator();
  c.setUser(a);
  const old = c.capture();
  c.setUser(b);
  assert(!c.matches(old));
  c.setUser(a);
  assert(!c.matches(old));
  const current = c.capture();
  c.block(a);
  assert.equal(c.capture(), null);
  assert(!c.matches(current));
  c.setUser(null);
  assert.equal(c.capture(), null);
});
test('sesión persistida identifica propietario offline y rechaza datos corruptos', () => {
  assert.equal(
    persistedPlannerOwner(
      JSON.stringify({
        user: { id: a },
        access_token: 'sintético',
        refresh_token: 'sintético',
        expires_at: 1,
      }),
    ),
    a,
  );
  assert.equal(persistedPlannerOwner(null), null);
  assert.throws(() => persistedPlannerOwner('{'));
  assert.throws(() => persistedPlannerOwner(JSON.stringify({ user: { id: a } })));
});
test('bloqueo repetido no genera eventos ni ciclos de carga adicionales', () => {
  const c = new PlannerSessionCoordinator();
  let events = 0;
  c.setUser(a);
  c.subscribe(() => events++);
  c.block(a);
  c.block(a);
  assert.equal(events, 1);
});
test('bloquear una cuenta anterior no invalida la sesión de la cuenta actual', () => {
  const c = new PlannerSessionCoordinator();
  c.setUser(b);
  const session = c.capture();
  c.block(a);
  assert(c.matches(session));
});
