import test from 'node:test'; import assert from 'node:assert/strict';
import { persistedEventOwner } from '../src/shared/events/application/persistedEventOwner.ts';
import { supabaseAuthStorageKey } from '../src/shared/backend/infrastructure/supabaseAuthOptions.ts';
test('identifica la sesión local vencida sin tokens adicionales y logout sin sesión no restaura propietario',()=>{
 const id='00000000-0000-0000-0000-000000000001';
 assert.equal(persistedEventOwner(JSON.stringify({user:{id},access_token:'fixture',refresh_token:'fixture',expires_at:1})),id);
 assert.equal(persistedEventOwner(null),null);
 for(const raw of ['{}','bad',JSON.stringify({user:{id:'../other'},access_token:'fixture',refresh_token:'fixture',expires_at:1})]) assert.throws(()=>persistedEventOwner(raw),/sesión guardada/);
 assert.equal(supabaseAuthStorageKey('http://127.0.0.1:55321'),'sb-127-auth-token');
 assert.equal(supabaseAuthStorageKey('https://example.supabase.co'),'sb-example-auth-token');
});
