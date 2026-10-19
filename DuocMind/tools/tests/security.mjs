import assert from 'node:assert/strict';import crypto from 'node:crypto';import {database,fixtures,authClient,runtime} from '../scripts/runtime.mjs';
const db=await database(),f=fixtures(),r=runtime(),client=authClient(),operator=authClient(true);let dualSession;
try{
 const modified=await operator.auth.admin.updateUserById(f.student.id,{user_metadata:{role:'admin',enabled:true}});assert(!modified.error);
 const student=await client.auth.signInWithPassword({email:f.student.email,password:f.student.password});assert(!student.error);const original=student.data.session.access_token;
 const fetchApi=(token,path,init={})=>fetch(r.API_URL+'/functions/v1/admin-api'+path,{...init,headers:{authorization:'Bearer '+token,apikey:r.ANON_KEY,'content-type':'application/json'}});
 assert.equal((await fetchApi(original,'/session')).status,403);
 const parts=original.split('.');const fakeClaims=JSON.parse(Buffer.from(parts[1],'base64url'));fakeClaims.sub=f.staff.id;parts[1]=Buffer.from(JSON.stringify(fakeClaims)).toString('base64url');assert.equal((await fetchApi(parts.join('.'),'/session')).status,401);await client.auth.signOut({scope:'local'});
 await db.query('insert into private.admin_staff(auth_user_id,enabled) values($1,true) on conflict(auth_user_id) do update set enabled=true',[f.dual.id]);
 dualSession=authClient();const dual=await dualSession.auth.signInWithPassword({email:f.dual.email,password:f.dual.password});assert(!dual.error);
 for(const path of ['/emotions','/results','/referrals','/students/'+f.student.studentId+'/results'])assert.equal((await fetchApi(dual.data.session.access_token,path)).status,404);
 const catalog=(await(await fetchApi(dual.data.session.access_token,'/catalogs')).json()).resultLevels[0];
 assert.equal((await fetchApi(dual.data.session.access_token,'/tips',{method:'POST',body:JSON.stringify({requestId:crypto.randomUUID(),title:'FK sintética',content:'Orientación',rules:[{kind:'result',catalogId:catalog.catalogId,versionId:catalog.versionId,version:catalog.version,level:'no_existe_fixture'}]})})).status,422);
 await db.query('begin');
 const mood=(await db.query('select id_emocion from public.emocion_general limit 1')).rows[0].id_emocion;
 for(const name of ['student','dual'])await db.query('insert into public.registro_emocional(emocion_general_id_emocion,estudiante_id_estudiante) values($1,$2)',[mood,f[name].studentId]);
 await db.query('set local role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,true)",[f.dual.id]);assert.equal((await db.query('select * from public.registro_emocional where estudiante_id_estudiante=$1',[f.student.studentId])).rowCount,0);assert((await db.query('select * from public.registro_emocional where estudiante_id_estudiante=$1',[f.dual.studentId])).rowCount>=1);
 await db.query('reset role');assert.equal((await db.query("select count(*)::int n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.proname like 'admin_%' and(has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute') or p.prosecdef)")).rows[0].n,0);
 const columns=(await db.query("select column_name from information_schema.columns where table_schema='private' and table_name in ('admin_requests','password_reset_limits')")).rows.map(r=>r.column_name);assert(!columns.some(c=>/email|token|password|emotion|content/.test(c)));
 await db.query('rollback');console.log('T020: metadatos/firmas manipuladas rechazados, FK inválida, aislamiento emocional dual, ausencia de rutas personales y RPC privadas auditados.');
}finally{await db.query('rollback');await db.query('update private.admin_staff set enabled=false where auth_user_id=$1',[f.dual.id]);await operator.auth.admin.updateUserById(f.student.id,{user_metadata:{}});await dualSession?.auth.signOut({scope:'local'});await db.end();}
