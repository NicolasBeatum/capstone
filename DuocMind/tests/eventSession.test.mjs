import test from 'node:test'; import assert from 'node:assert/strict';
import { EventSessionCoordinator } from '../src/shared/events/application/eventSession.ts';
test('cambiar cuenta o cerrar/reabrir sesión invalida resultados anteriores',()=>{
 const c=new EventSessionCoordinator(); c.setUser('A'); const first=c.capture();
 c.setUser('B'); assert.equal(c.matches(first),false);
 c.setUser('A'); assert.equal(c.matches(first),false);
 const second=c.capture(); c.setUser(null); c.setUser('A'); assert.equal(c.matches(second),false);
});
test('eliminar bloquea comandos y soltar el bloqueo no rehabilita una operación antigua',()=>{
 const c=new EventSessionCoordinator(); c.setUser('A'); const first=c.capture(); const release=c.block('A');
 assert.equal(c.capture(),null); assert.equal(c.matches(first),false);
 release(); assert.equal(c.matches(first),false); assert.equal(c.capture().userId,'A');
});
