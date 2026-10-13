import test from 'node:test'; import assert from 'node:assert/strict';
import { createWebEventStore } from '../src/shared/events/infrastructure/eventStorage.web.ts';
const uid='00000000-0000-0000-0000-000000000001', uid2='00000000-0000-0000-0000-000000000002';
const event={id:uid,title:'Taller',description:'',location:'Patio',startsAt:'2030-10-12T15:00:00Z',endsAt:'2030-10-12T16:00:00Z',status:'published',publishedAt:'2026-10-11T00:00:00Z',revision:1,requiresRegistration:false,registrationUrl:null,registrationDeadline:null,registrationClosed:false};
const at='2026-10-11T00:00:00Z';
function storage() { const map=new Map(); return { map, getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k) }; }
test('persiste una sola referencia, conserva cuentas separadas y permite recargar',async()=>{
 const s=storage(), a=createWebEventStore(uid,()=>s), b=createWebEventStore(uid2,()=>s);
 await Promise.all([a.add(event,at),a.add(event,at)]);
 assert.equal((await a.read()).interests.length,1); assert.equal((await b.read()).interests.length,0);
 assert.equal((await createWebEventStore(uid,()=>s).read()).interests.length,1);
 await a.destroy(); assert.equal(s.map.size,0); await assert.rejects(a.add(event,at));
});
test('aceptar cambia la versión; una respuesta tardía no recrea un interés quitado',async()=>{
 const s=storage(), a=createWebEventStore(uid,()=>s), updated={...event,revision:2,location:'Sala'};
 await a.add(event,at); await a.replaceCatalog({events:[updated],serverTime:at},at);
 await a.accept(updated,1); assert.equal((await a.read()).interests[0].version,2);
 await assert.rejects(a.accept(updated,1)); await a.remove(uid); await assert.rejects(a.accept(updated,2));
 assert.equal((await a.read()).interests.length,0);
});
test('fallo de escritura o catálogo malformado conserva lo confirmado',async()=>{
 const s=storage(), a=createWebEventStore(uid,()=>s); await a.add(event,at);
 const original=s.setItem; s.setItem=()=>{throw Error('QuotaExceeded');}; await assert.rejects(a.remove(uid)); s.setItem=original;
 assert.equal((await a.read()).interests.length,1);
 assert.throws(()=>a.replaceCatalog({events:[{...event,title:null}],serverTime:at},at));
 assert.equal((await a.read()).catalog,null);
 s.map.set(`duocmind.events.v1.${uid}`,'malformed'); await assert.rejects(a.read());
});
test('un catálogo nuevo que retiró el evento impide agregar una tarjeta antigua',async()=>{
 const s=storage(), a=createWebEventStore(uid,()=>s);
 await a.replaceCatalog({events:[],serverTime:at},at);
 await assert.rejects(a.add(event,at)); assert.equal((await a.read()).interests.length,0);
});
test('lecturas y escrituras se serializan; eliminar espera la escritura y permite reintentar un fallo parcial',async()=>{
 const {EventStore,emptyEventDocument}=await import('../src/shared/events/application/eventStore.ts');
 let doc=emptyEventDocument(), release, reading=false, removed=0, fail=true;
 const wait=new Promise(r=>{release=r;});
 const store=new EventStore({read:async()=>{reading=true;await wait;reading=false;return structuredClone(doc);},write:async value=>{assert.equal(reading,false);doc=structuredClone(value);},remove:async()=>{removed++;if(fail)throw Error('archivo ocupado');doc=emptyEventDocument();}});
 const mutation=store.add(event,at), load=store.read();
 await Promise.resolve();const deletion=store.destroy();release();await mutation;
 assert.equal((await load).interests.length,1);await assert.rejects(deletion);assert.equal(removed,1);
 fail=false;await store.destroy();assert.equal(removed,2);await assert.rejects(store.read());
});
