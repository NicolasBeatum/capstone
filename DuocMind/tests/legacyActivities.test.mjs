import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  importLegacyActivities,
  legacyCatalog,
} from '../src/shared/planner/application/legacyActivities.ts';
import { emptyPlanner } from '../src/shared/planner/application/plannerStore.ts';
test('recuperación explícita valida, conserva origen y no reimporta', async () => {
  const original = [{
      id: 'vieja-1',
      date: '2026-10-19',
      time: '09:00',
      title: 'Antes',
      subject: '',
    }, { id: 'invalida' }],
    before = structuredClone(original);
  const catalog = await legacyCatalog(
    original,
    async (v) => createHash('sha256').update(v).digest('hex'),
  );
  assert.equal(catalog.invalidCount, 1);
  const selected = [{ entry: catalog.entries[0], newId: '00000000-0000-4000-8000-000000000001' }];
  const doc = importLegacyActivities(emptyPlanner(), selected);
  assert.equal(doc.activities[0].semesterId, null);
  assert.equal(doc.activities[0].kind, 'personal');
  assert.equal(importLegacyActivities(doc, selected).activities.length, 1);
  assert.deepEqual(original, before);
  assert.equal(importLegacyActivities(emptyPlanner(), []).activities.length, 0);
});
