import test from 'node:test'; import assert from 'node:assert/strict';
import { composeAgendaItems } from '../src/features/agenda/application/agendaItems.ts';
const event={id:'00000000-0000-0000-0000-000000000002',title:'Taller',description:'',location:'Patio',startsAt:'2030-10-12T12:00:00Z',endsAt:'2030-10-12T14:30:00Z',status:'published',publishedAt:'2026-10-11T00:00:00Z',revision:1,requiresRegistration:false,registrationUrl:null,registrationDeadline:null,registrationClosed:false};
const interest={event,savedAt:'2026-10-11T00:00:00Z',version:1};
const activity={id:'00000000-0000-0000-0000-000000000001',date:'2030-10-12',time:'09:00',title:'Estudiar',subject:null};
const now=new Date('2026-10-11T12:00:00Z');
const catalog={serverTime:now.toISOString(),events:[event]};
test('compone horarios coincidentes sin modificar actividades ni convertir duración del evento',()=>{
 const before=structuredClone(activity), items=composeAgendaItems([activity],[interest],catalog,'2030-10-12',now);
 assert.deepEqual(items.map(i=>i.kind),['activity','event']); assert.equal(items[1].time,'09:00'); assert.match(items[1].interval,/09:00–11:30/); assert.deepEqual(activity,before);
});
test('mantiene la fecha aceptada hasta actualizar, y conserva ausentes y cancelados',()=>{
 const updated={...event,revision:2,startsAt:'2030-10-14T12:00:00Z',endsAt:'2030-10-14T14:30:00Z',location:'Sala nueva'};
 const pending=composeAgendaItems([],[interest],{...catalog,events:[updated]},'2030-10-12',now)[0];
 assert.equal(pending.projection.changed,true); assert.equal(pending.projection.event.location,'Patio');
 assert.equal(composeAgendaItems([],[interest],{...catalog,events:[updated]},'2030-10-14',now).length,0);
 assert.equal(composeAgendaItems([],[{...interest,event:updated}],{...catalog,events:[updated]},'2030-10-14',now).length,1);
 assert.equal(composeAgendaItems([],[interest],{...catalog,events:[]},'2030-10-12',now)[0].projection.unavailable,true);
 assert.equal(composeAgendaItems([],[interest],{...catalog,events:[{...event,status:'cancelled'}]},'2030-10-12',now)[0].state,'cancelled');
});
test('muestra continuaciones y eventos finalizados pero mantiene filtrado personal y medianoche exclusiva',()=>{
 const long={...event,startsAt:'2030-10-12T22:00:00Z',endsAt:'2030-10-15T03:00:00Z'};
 const items=composeAgendaItems([activity],[{...interest,event:long}],null,'2030-10-13',new Date('2030-11-01T12:00:00Z'));
 assert.equal(items.length,1); assert.equal(items[0].continuation,true); assert.equal(items[0].time,'00:00'); assert.equal(items[0].state,'ended');
 assert.equal(composeAgendaItems([],[{...interest,event:long}],null,'2030-10-15',now).length,0);
 assert.throws(()=>composeAgendaItems([],[],null,'2030-02-30',now));
});
