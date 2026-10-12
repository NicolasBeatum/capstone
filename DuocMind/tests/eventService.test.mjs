import test from 'node:test'; import assert from 'node:assert/strict';
import { EventService } from '../src/shared/events/application/eventService.ts';
import { EventStore, emptyEventDocument } from '../src/shared/events/application/eventStore.ts';
const id='00000000-0000-0000-0000-000000000009', at='2026-10-11T12:00:00Z';
const event={id,title:'Taller',description:'',location:'Patio',startsAt:'2030-10-12T15:00:00Z',endsAt:'2030-10-12T16:00:00Z',status:'published',publishedAt:at,revision:1,requiresRegistration:true,registrationUrl:'https://example.com/form',registrationDeadline:'2030-10-12T14:00:00Z',registrationClosed:false};
function setup() {
 let doc=emptyEventDocument(), current={userId:id,generation:1}, catalog={events:[event],serverTime:at}, opened=[];
 const store=new EventStore({read:async()=>structuredClone(doc),write:async d=>{doc=structuredClone(d);},remove:async()=>{doc=emptyEventDocument();}});
 const services={store:async()=>store,session:{current:async()=>current,isCurrent:async s=>s===current,subscribe:()=>()=>{}},clock:{now:()=>new Date(at)},link:{open:async url=>{opened.push(url);}},catalog:{load:async()=>catalog}};
 return { service:new EventService(services), services, store, opened, session:current, setCatalog:v=>{catalog=v;}, changeAccount:()=>{current={userId:'other',generation:2};} };
}
test('una descarga fallida conserva catálogo/intereses y no afirma actualización',async()=>{
 const f=setup(); await f.service.load(); await f.service.add(event,f.session);
 f.services.catalog.load=async()=>{throw Error('offline');};
 const snapshot=await f.service.load(); assert.equal(snapshot.offline,true); assert.equal(snapshot.document.interests.length,1); assert.equal(snapshot.document.catalog.events.length,1);
});
test('revalida inscripción usando servidor, rechaza cierre y no abre tras cambiar cuenta',async()=>{
 const f=setup(); f.setCatalog({serverTime:at,events:[{...event,registrationClosed:true}]});
 await assert.rejects(f.service.register(event,f.session)); assert.equal(f.opened.length,0);
 f.services.catalog.load=async()=>{f.changeAccount();return {events:[event],serverTime:at};};
 await assert.rejects(f.service.register(event,f.session)); assert.equal(f.opened.length,0);
});
test('aceptar una versión obsoleta conserva interés y exige revisar el nuevo cambio',async()=>{
 const f=setup(); await f.service.load(); await f.service.add(event,f.session);
 f.setCatalog({serverTime:at,events:[{...event,revision:3,location:'Sala nueva'}]});
 await assert.rejects(f.service.accept({...event,revision:2},1,f.session));
 assert.equal((await f.store.read()).interests[0].event.location,'Patio');
 await f.service.remove(id,f.session); assert.equal((await f.store.read()).interests.length,0);
});
test('una descarga diferida no aparece ni se guarda si cambió la cuenta',async()=>{
 const f=setup();let release;f.services.catalog.load=()=>new Promise(r=>{release=r;});
 const loading=f.service.load();while(!release)await Promise.resolve();f.changeAccount();release({events:[event],serverTime:at});
 await assert.rejects(loading);assert.equal((await f.store.read()).catalog,null);
});
test('revalidar un evento para inscripción no reemplaza catálogo completo y un fallo de enlace no confirma apertura',async()=>{
 const f=setup();await f.service.load();const before=await f.store.read();
 f.services.link.open=async()=>{throw Error('No se pudo abrir el enlace');};await assert.rejects(f.service.register(event,f.session));
 assert.deepEqual(await f.store.read(),before);
 f.services.catalog.load=async()=>({events:[{...event,registrationDeadline:at}],serverTime:at});
 await assert.rejects(f.service.register(event,f.session));assert.equal(f.opened.length,0);
});
