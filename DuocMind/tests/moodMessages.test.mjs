import assert from 'node:assert/strict';
import test from 'node:test';

import { MOOD_SCALE } from '../src/features/emotional-checkin/domain/moodScale.ts';
import { thanksMessage } from '../src/features/emotional-checkin/domain/moodMessages.ts';

test('every mood has its own closing message', () => {
  const messages = MOOD_SCALE.map((mood) => thanksMessage(mood));
  for (const message of messages) assert.ok(message.trim().length > 0);
  assert.equal(new Set(messages).size, MOOD_SCALE.length);
});

test('low moods validate the feeling and point to Bienestar, never blame', () => {
  assert.match(thanksMessage('Muy mal'), /Bienestar/);
  for (const mood of ['Muy mal', 'Mal']) {
    assert.doesNotMatch(thanksMessage(mood), /culpa|error|fracaso|deberías|tienes que mejorar/i);
  }
});
