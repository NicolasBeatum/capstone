import assert from 'node:assert/strict';
import test from 'node:test';

import {
  daysSinceApplication,
  formatDaysAgo,
  isStressTestDue,
} from '../src/features/emotional-checkin/domain/stressTestRecency.ts';

test('the stress test is due only after more than 30 days or when never answered', () => {
  const now = new Date(2026, 9, 31, 9, 0);
  assert.equal(isStressTestDue(null, now), true);
  assert.equal(isStressTestDue(new Date(2026, 9, 1, 9, 0), now), false);
  assert.equal(isStressTestDue(new Date(2026, 8, 30, 9, 0), now), true);
});

test('counts calendar days, not 24-hour blocks', () => {
  const now = new Date(2026, 9, 5, 0, 30);
  assert.equal(daysSinceApplication(new Date(2026, 9, 4, 23, 50), now), 1);
  assert.equal(daysSinceApplication(new Date(2026, 9, 5, 0, 10), now), 0);
  assert.equal(daysSinceApplication(new Date(2026, 8, 28, 12, 0), now), 7);
});

test('never returns negative days for a future timestamp', () => {
  const now = new Date(2026, 9, 5, 10, 0);
  assert.equal(daysSinceApplication(new Date(2026, 9, 6, 10, 0), now), 0);
});

test('accepts ISO strings from Supabase', () => {
  const applied = new Date(2026, 9, 2, 15, 0);
  assert.equal(daysSinceApplication(applied.toISOString(), new Date(2026, 9, 5, 9, 0)), 3);
});

test('formats the elapsed days in Spanish', () => {
  assert.equal(formatDaysAgo(0), 'hoy');
  assert.equal(formatDaysAgo(1), 'hace 1 día');
  assert.equal(formatDaysAgo(5), 'hace 5 días');
});
