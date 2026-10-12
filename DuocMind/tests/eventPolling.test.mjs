import test from 'node:test'; import assert from 'node:assert/strict';
import { startEventPolling } from '../src/shared/events/application/eventPolling.ts';
test('refresca reloj cada 30 segundos, catálogo cada minuto conectado y libera ambos al desenfocar',()=>{
 const active=new Map(), timers={every:(cb,ms)=>{active.set(ms,cb);return ()=>active.delete(ms);}};
 let clocks=0,refreshes=0,online=true;
 const stop=startEventPolling(()=>clocks++,()=>refreshes++,()=>online,timers);
 assert.equal(active.size,2);active.get(30_000)();active.get(60_000)();assert.equal(clocks,1);assert.equal(refreshes,1);
 online=false;active.get(60_000)();assert.equal(refreshes,1);stop();assert.equal(active.size,0);
 online=true;const next=startEventPolling(()=>clocks++,()=>refreshes++,()=>online,timers);active.get(60_000)();assert.equal(refreshes,2);next();assert.equal(active.size,0);
});
