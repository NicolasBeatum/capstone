import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentWeekRange,
  summarizeWeek,
  weekDayIndex,
} from '../src/features/emotional-checkin/domain/weekMood.ts';

// Fechas en hora local para que las pruebas no dependan de la zona horaria del equipo.
const at = (day, hour = 12, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString();
// Jueves 8 de octubre de 2026; la semana va del lunes 5 al domingo 11.
const NOW = new Date(2026, 9, 8, 18, 30);

test('la semana va del lunes 00:00 al lunes siguiente', () => {
  const { from, to } = currentWeekRange(NOW);
  assert.deepEqual(from, new Date(2026, 9, 5));
  assert.deepEqual(to, new Date(2026, 9, 12));
});

test('el domingo pertenece a la semana que empezó el lunes anterior', () => {
  const { from } = currentWeekRange(new Date(2026, 9, 11, 23, 59));
  assert.deepEqual(from, new Date(2026, 9, 5));
  assert.equal(weekDayIndex(new Date(2026, 9, 11)), 6);
});

test('sin check-ins todos los días quedan vacíos', () => {
  const days = summarizeWeek([], NOW);
  assert.equal(days.length, 7);
  assert.deepEqual(days.map((day) => day.label), ['L', 'M', 'X', 'J', 'V', 'S', 'D']);
  for (const day of days) {
    assert.equal(day.mood, null);
    assert.equal(day.level, null);
    assert.equal(day.count, 0);
  }
});

test('un check-in se ubica en su día con su ánimo', () => {
  const days = summarizeWeek([{ mood: 'Bien', createdAt: at(6) }], NOW);
  assert.equal(days[1].mood, 'Bien');
  assert.equal(days[1].level, 4 / 5);
  assert.equal(days[1].count, 1);
  assert.equal(days[0].mood, null);
});

test('varios check-ins del mismo día se promedian y el color sigue al más cercano', () => {
  const days = summarizeWeek(
    [
      { mood: 'Muy mal', createdAt: at(7, 8) },
      { mood: 'Bien', createdAt: at(7, 21) },
    ],
    NOW,
  );
  // (1 + 4) / 2 = 2.5, que redondea a Neutro.
  assert.equal(days[2].level, 2.5 / 5);
  assert.equal(days[2].mood, 'Neutro');
  assert.equal(days[2].count, 2);
});

test('se ignoran check-ins fuera de la semana y datos inválidos', () => {
  const days = summarizeWeek(
    [
      { mood: 'Muy bien', createdAt: at(4, 23, 59) },
      { mood: 'Muy bien', createdAt: at(12, 0, 0) },
      { mood: 'Muy bien', createdAt: 'no es fecha' },
      { mood: 'Otro', createdAt: at(8) },
      { mood: 'Mal', createdAt: at(5, 0, 0) },
    ],
    NOW,
  );
  assert.equal(days[0].mood, 'Mal');
  assert.equal(days.reduce((total, day) => total + day.count, 0), 1);
});
