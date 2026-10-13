import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEvent, parseCatalog, getEventState, registrationInfo, eventOccupiesDate, eventDateKey, monthCells, projectInterest, isRegistrationUrl } from '../src/shared/events/domain/institutionalEvent.ts';
const event = (overrides = {}) => parseEvent({
  id: '00000000-0000-0000-0000-000000000009', title: 'Taller', description: '', location: 'Patio',
  startsAt: '2026-10-12T15:00:00Z', endsAt: '2026-10-12T16:30:00Z', status: 'published', publishedAt: '2026-10-01T00:00:00Z', revision: 1,
  requiresRegistration: true, registrationUrl: 'https://example.com/form', registrationDeadline: '2026-10-12T14:00:00Z', registrationClosed: false, ...overrides,
});
test('cierra en el plazo exacto y distingue inicio, término y cancelación', () => {
  const e = event();
  assert.equal(registrationInfo(e, new Date('2026-10-12T13:59:59Z')).state, 'open');
  assert.equal(registrationInfo(e, new Date(e.registrationDeadline)).state, 'closed');
  assert.equal(getEventState(e, new Date(e.startsAt)), 'in-progress');
  assert.equal(getEventState(e, new Date(e.endsAt)), 'ended');
  assert.equal(getEventState(event({ status: 'cancelled' }), new Date(e.startsAt)), 'cancelled');
  assert.match(registrationInfo(event({ registrationClosed: true }), new Date('2026-10-11T12:00:00Z')).reason, /organización/);
});
test('valida configuración y rechaza borradores, duplicados y enlaces peligrosos', () => {
  for (const url of ['http://example.com', 'https://user:pass@example.com', 'javascript:alert(1)', 'https://example.com\n', 'https://example.com\\path']) assert.equal(isRegistrationUrl(url), false);
  assert.throws(() => event({ requiresRegistration: false }));
  assert.throws(() => event({ status: 'draft' }));
  assert.throws(() => event({ startsAt: '2026-02-30T15:00:00Z' }));
  assert.throws(() => parseCatalog({ serverTime: '2026-10-11T00:00:00Z', events: [event(), event()] }));
});
test('representa intervalos reales y no agrega el día que empieza al terminar a medianoche', () => {
  const e = event({ startsAt: '2026-10-12T03:00:00Z', endsAt: '2026-10-14T03:00:00Z', registrationDeadline: '2026-10-11T00:00:00Z' });
  assert.equal(eventOccupiesDate(e, '2026-10-12'), true);
  assert.equal(eventOccupiesDate(e, '2026-10-13'), true);
  assert.equal(eventOccupiesDate(e, '2026-10-14'), false);
  assert.equal(eventDateKey('2026-10-12T01:00:00Z'), '2026-10-11');
  assert.equal(eventOccupiesDate(event({ endsAt: '2026-10-12T15:00:00Z' }), '2026-10-12'), true);
  const dst = event({ startsAt: '2026-09-06T04:00:00Z', endsAt: '2026-09-07T03:00:00Z', registrationDeadline: '2026-09-05T00:00:00Z' });
  assert.equal(eventOccupiesDate(dst, '2026-09-06'), true);
  assert.equal(eventOccupiesDate(dst, '2026-09-07'), false);
});
test('conserva el intervalo aceptado si el evento cambia y distingue ausencia del catálogo', () => {
  const saved = { event: event(), version: 1, savedAt: '2026-10-11T00:00:00Z' };
  const current = event({ location: 'Sala 2', revision: 2 });
  const result = projectInterest(saved, { events: [current], serverTime: saved.savedAt });
  assert.equal(result.changed, true); assert.equal(result.event.location, 'Patio');
  assert.equal(projectInterest(saved, { events: [], serverTime: saved.savedAt }).unavailable, true);
  assert.equal(projectInterest(saved, null).unavailable, false);
});
test('calendario mensual comienza el lunes y permite febrero de año bisiesto', () => {
  assert.equal(monthCells('2024-02').filter(Boolean).length, 29);
  assert.equal(monthCells('2026-10')[3], '2026-10-01');
});
