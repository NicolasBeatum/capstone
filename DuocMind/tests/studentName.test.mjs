import assert from 'node:assert/strict';
import test from 'node:test';

import { greetingName, studentInitials } from '../src/features/dashboard/domain/studentName.ts';

test('greets with the first given name only, properly capitalized', () => {
  assert.equal(greetingName('hans'), 'Hans');
  assert.equal(greetingName('  MARÍA JOSÉ '), 'María');
  assert.equal(greetingName('ángel'), 'Ángel');
});

test('returns null when there is no usable name', () => {
  assert.equal(greetingName(null), null);
  assert.equal(greetingName(undefined), null);
  assert.equal(greetingName('   '), null);
});

test('builds avatar initials from first name and last name', () => {
  assert.equal(studentInitials('hans', 'ignacio'), 'HI');
  assert.equal(studentInitials('Camila', null), 'C');
  assert.equal(studentInitials(null, null), '');
});
