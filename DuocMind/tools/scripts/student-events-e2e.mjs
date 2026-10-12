import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { database, fixtures, projectRoot, requireLocal, runtime } from './runtime.mjs';
const { chromium } = createRequire(path.resolve(projectRoot, '../admin-web/package.json'))('@playwright/test');
const origin = requireLocal(process.env.STUDENT_E2E_URL ?? 'http://localhost:8089');
runtime();
const db = await database(), ids = Array.from({ length: 8 }, () => crypto.randomUUID());
const title = 'Taller sintético 009 ' + ids[0];
const dir = path.resolve(projectRoot, 'tools/.local/student-events');
fs.mkdirSync(dir, { recursive: true });
let browser;
try {
  const entries = [
    [ids[0], title, '2030-10-12T12:00:00Z', '2030-10-12T14:30:00Z', false, null, false, 'published'],
    [ids[1], 'Inscripción abierta 009', '2030-10-12T15:00:00Z', '2030-10-12T16:00:00Z', true, '2030-10-11T15:00:00Z', false, 'published'],
    [ids[2], 'Cierre manual 009', '2030-10-12T15:00:00Z', '2030-10-12T16:00:00Z', true, '2030-10-11T15:00:00Z', true, 'published'],
    [ids[3], 'Plazo vencido 009', '2030-10-12T15:00:00Z', '2030-10-12T16:00:00Z', true, '2020-10-11T15:00:00Z', false, 'published'],
    [ids[4], 'Cancelado 009', '2030-10-12T15:00:00Z', '2030-10-12T16:00:00Z', false, null, false, 'published'],
    [ids[5], 'Varios días 009', '2030-10-12T22:00:00Z', '2030-10-15T03:00:00Z', false, null, false, 'published'],
    [ids[6], 'Anterior 009', '2020-10-12T12:00:00Z', '2020-10-12T14:30:00Z', false, null, false, 'published'],
    [ids[7], 'En curso 009', new Date(Date.now()-3600000).toISOString(), new Date(Date.now()+3600000).toISOString(), false, null, false, 'published'],
  ];
  for (const [id, name, start, end, required, deadline, closed, status] of entries) await db.query(`insert into public.evento_institucional(id,title,description,location,starts_at,ends_at,status,published_at,requires_registration,registration_url,registration_deadline,registration_closed) values($1,$2,'Descripción del evento sintético','Patio sintético',$3,$4,$5,now(),$6,$7,$8,$9)`, [id, name, start, end, status, required, required ? 'https://example.com/registration' : null, deadline, closed]);
  await db.query("update public.evento_institucional set status='cancelled',revision=revision+1 where id=$1", [ids[4]]);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce' });
  const errors=[]; page.on('pageerror', () => errors.push('Error de ejecución en la página'));
  const visible = async text => { await page.getByText(text, { exact: true }).filter({visible:true}).first().waitFor({ state: 'visible', timeout: 60_000 }); };
  await page.goto(origin + '/login');
  await page.getByPlaceholder('ejemplo@universidad.edu').fill(fixtures().student.email);
  await page.getByPlaceholder('••••••••').fill(fixtures().student.password);
  await page.getByRole('button', { name: /Iniciar Sesión/ }).click();
  await page.getByRole('button', { name: 'Ver calendario de eventos' }).waitFor({ state: 'visible', timeout: 60_000 });
  const calendar=await page.getByRole('button', { name: 'Ver calendario de eventos' }).boundingBox();
  assert.ok(calendar.width >=44 && calendar.height>=44);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(dir,'home-360.png') });
  await page.getByRole('button', { name: 'Ver calendario de eventos' }).click();
  await visible(title); console.log('Inicio → Eventos: correcto.');
  await page.getByRole('button', { name: `Ver detalles de ${title}` }).click();
  await visible('Descripción del evento sintético');
  await page.getByRole('button', { name: 'Agregar a mi agenda', exact: true }).click();
  await visible('Evento agregado a tu agenda.');
  await page.getByRole('button', { name: 'Ver en mi agenda', exact: true }).click();
  await visible(title); await visible('Hora de Santiago, Chile · Patio sintético');
  assert.ok(page.url().includes('date=2030-10-12'));
  await page.screenshot({ path: path.join(dir,'agenda.png') });
  await page.evaluate(() => localStorage.setItem('duocmind.agenda.activities.v1', JSON.stringify([{id:'fixture-personal-009',title:'Actividad personal sintética',date:'2030-10-12',time:'09:00',subject:null}])));
  await page.reload(); await visible('Actividad personal sintética'); await visible(title);
  await page.getByRole('button', { name: `Quitar ${title} de mi agenda` }).click();
  await visible('Evento quitado de tu agenda. Una inscripción externa se gestiona por separado.');
  assert.equal(await page.getByText(title, {exact:true}).filter({visible:true}).count(), 0);
  await page.getByRole('button', { name: 'Explorar eventos →', exact: true }).click();
  await page.getByRole('button', { name: `Ver detalles de ${title}` }).click();
  await page.getByRole('button', { name: 'Agregar a mi agenda', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Agregar a mi agenda', exact: true }).click();
  await visible('Evento agregado a tu agenda.');
  await db.query("update public.evento_institucional set starts_at='2030-10-14T12:00:00Z',ends_at='2030-10-14T14:30:00Z',location='Sala nueva',revision=revision+1 where id=$1",[ids[0]]);
  await page.reload(); await visible('Este evento cambió · Cambio pendiente');
  await page.getByRole('button', {name:'Actualizar en mi agenda',exact:true}).click();
  await visible('Evento actualizado en tu agenda.');
  await page.getByRole('button', {name:'Ver en mi agenda',exact:true}).click();
  await visible(title); assert.ok(page.url().includes('date=2030-10-14'));
  const saved = await page.evaluate(() => Object.entries(sessionStorage).filter(([key])=>key.startsWith('duocmind.events.v1.')).map(([,value])=>JSON.parse(value)));
  assert.equal(saved[0].interests.length,1);
  console.log('Agregar → agenda → quitar → reprogramar sin duplicar: correcto.');
  await page.evaluate(() => {
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value) { if(key.startsWith('duocmind.events.v1.')) throw Error('No se pudo guardar la agenda sintética.'); original.call(this,key,value); };
  });
  await page.getByRole('button',{name:`Quitar ${title} de mi agenda`}).click();
  await visible('Eventos: No se pudo guardar la agenda sintética.'); await visible(title);
  await page.reload(); await visible(title);
  await page.goto(origin + '/events?date=2030-10-12'); await visible(title);
  await page.getByRole('button', {name:'Por fecha',exact:true}).click();
  await page.getByRole('button', {name:'2030-10-13, con eventos',exact:true}).click();
  await visible('Varios días 009');
  await page.getByRole('button', {name:'Ver detalles de Varios días 009',exact:true}).click();
  await page.getByRole('button', {name:'Agregar a mi agenda',exact:true}).click();
  await page.getByRole('button', {name:'‹ Volver a eventos',exact:true}).click();
  await visible('Varios días 009');
  await page.getByRole('button', {name:'2030-10-20, sin eventos',exact:true}).click();
  await visible('No hay eventos para esta fecha');
  await page.getByRole('button',{name:'Mes siguiente',exact:true}).click(); await visible('noviembre de 2030');
  await page.getByRole('button',{name:'Mes anterior',exact:true}).click();
  await page.screenshot({path:path.join(dir,'calendar.png')});
  await page.goto(origin+'/events/'+ids[2]);await visible('Cerrada por la organización'); assert.equal(await page.getByRole('button',{name:'Inscribirme, abre un sitio externo'}).count(),0);
  await page.goto(origin+'/events/'+ids[3]);await visible('El plazo de inscripción terminó');
  await page.goto(origin+'/events/'+ids[4]);await visible('Cancelado');assert.equal(await page.getByRole('button',{name:'Agregar a mi agenda',exact:true}).count(),0);
  await page.goto(origin+'/events');await page.getByRole('button',{name:'Anteriores',exact:true}).click();await visible('Anterior 009');
  assert.equal(await page.getByText(title,{exact:true}).filter({visible:true}).count(),0);
  await page.getByRole('button',{name:'Próximos',exact:true}).click();await visible(title);
  await page.goto(origin+'/events/'+ids[7]);await visible('En curso'); await page.getByRole('button',{name:'Agregar a mi agenda',exact:true}).waitFor();
  await page.goto(origin+'/events/'+ids[6]);await visible('Finalizado');assert.equal(await page.getByRole('button',{name:'Agregar a mi agenda',exact:true}).count(),0);
  await page.goto(origin+'/events/'+ids[1]);await visible('Inscripciones abiertas');
  await page.screenshot({path:path.join(dir,'detail.png')});
  await page.context().route('https://example.com/**',route=>route.fulfill({status:200,body:'Formulario sintético'}));
  const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Inscribirme, abre un sitio externo'}).click();
  const external=await popup;assert.equal(external.url(),'https://example.com/registration');await external.close();
  await page.goto(origin+'/events/no-es-uuid');await visible('Evento no disponible');
  await page.goto(origin+'/agenda?date=2030-10-13');await visible('Continúa desde un día anterior');
  await page.evaluate(([endedId,cancelledId]) => {
    const key=Object.keys(sessionStorage).find(key=>key.startsWith('duocmind.events.v1.'));
    const doc=JSON.parse(sessionStorage.getItem(key));
    for(const id of [endedId,cancelledId]) { const event=doc.catalog.events.find(event=>event.id===id);doc.interests.push({event:{...event,status:'published'},version:1,savedAt:'2019-10-11T12:00:00Z'}); }
    sessionStorage.setItem(key,JSON.stringify(doc));
  },[ids[6],ids[4]]);
  await page.goto(origin+'/agenda?date=2020-10-12');await visible('Anterior 009');
  await page.getByRole('button',{name:'Quitar Anterior 009 de mi agenda'}).waitFor();
  await page.goto(origin+'/agenda?date=2030-10-12');await visible('EVENTO INSTITUCIONAL · Cancelado');
  await page.goto(origin+'/wellness');await page.getByRole('button',{name:'Eventos, ver calendario de actividades'}).click(); await visible('Eventos');
  console.log('Calendario, intervalos, estados, enlace verificado y Bienestar: correctos.');
  await page.context().setOffline(true);
  await page.evaluate(()=>{
    const key=Object.keys(sessionStorage).find(key=>/^sb-.*-auth-token$/.test(key));
    if(!key)throw Error('Sesión sintética ausente');
    const session=JSON.parse(sessionStorage.getItem(key));session.expires_at=1;sessionStorage.setItem(key,JSON.stringify(session));
  });
  await page.getByRole('button',{name:'Actualizar',exact:true}).click(); await page.getByText(/^Última copia disponible/).filter({visible:true}).first().waitFor();
  await page.getByRole('button',{name:'Ver detalles de Varios días 009',exact:true}).click();
  await page.getByRole('button',{name:'Quitar Varios días 009 de mi agenda'}).click();
  await visible('Evento quitado de tu agenda. Una inscripción externa se gestiona por separado.');
  await page.context().setOffline(false);
  await page.goto(origin+'/login');
  await page.getByPlaceholder('ejemplo@universidad.edu').fill(fixtures().dual.email);
  await page.getByPlaceholder('••••••••').fill(fixtures().dual.password);
  await page.getByRole('button',{name:/Iniciar Sesión/}).click();
  await page.getByRole('button',{name:'Ver calendario de eventos'}).click();
  await page.getByRole('button',{name:`Ver detalles de ${title}`}).click();
  await page.getByRole('button',{name:'Agregar a mi agenda',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Ver en mi agenda',exact:true}).count(),0);
  await page.goto(origin+'/login');
  await page.getByPlaceholder('ejemplo@universidad.edu').fill(fixtures().student.email);
  await page.getByPlaceholder('••••••••').fill(fixtures().student.password);
  await page.getByRole('button',{name:/Iniciar Sesión/}).click();
  await page.waitForTimeout(4000);
  await page.setViewportSize({width:320,height:800});
  await page.evaluate(()=>{
    for(const node of document.querySelectorAll('div[dir="auto"]')) {
      const style=getComputedStyle(node);node.style.fontSize=(parseFloat(style.fontSize)*1.5)+'px';
      if(style.lineHeight!=='normal')node.style.lineHeight=(parseFloat(style.lineHeight)*1.5)+'px';
    }
  });
  const calendarBox=await page.getByRole('button',{name:'Ver calendario de eventos'}).boundingBox();
  const bellBox=await page.getByRole('button',{name:/Notificaciones/}).boundingBox();
  assert.ok(calendarBox.width>=44 && calendarBox.height>=44 && calendarBox.x+calendarBox.width<=bellBox.x);
  await page.screenshot({path:path.join(dir,'home-320-enlarged.png')});
  await page.getByRole('button',{name:'Ver calendario de eventos'}).click();
  await page.getByRole('button',{name:`Ver detalles de ${title}`}).click();
  await page.getByRole('button',{name:'Ver en mi agenda',exact:true}).waitFor();
  console.log('Cuenta distinta sin intereses ajenos; regreso conserva los propios: correcto.');
  assert.deepEqual(errors,[]);
  console.log('Última copia y retirada sin conexión con token vencido en preview: correctas. Android pendiente.');
} catch (error) {
  for (const page of browser?.contexts().flatMap(context=>context.pages()) ?? []) {
    if (page.url().startsWith(origin)) await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});
  }
  throw error;
} finally {
  await browser?.close();
  await db.query('delete from public.evento_institucional where id=any($1::uuid[])',[ids]);
  await db.end();
}
