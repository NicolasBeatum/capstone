import assert from 'node:assert/strict';
import test from 'node:test';

import { getQuestionOptions } from '../src/features/emotional-checkin/data/questionOptions.ts';

test('cada pregunta usa sus puntajes propios, incluidos los invertidos', () => {
  const shared = [{ label: 'Nunca', value: 0 }, { label: 'Siempre', value: 4 }];
  const reversed = [{ label: 'Nunca', value: 4 }, { label: 'Siempre', value: 0 }];

  assert.deepEqual(getQuestionOptions({ id: 4, title: 'Pregunta 4', options: reversed }, shared), reversed);
  assert.deepEqual(getQuestionOptions({ id: 1, title: 'Pregunta 1' }, shared), shared);
});
