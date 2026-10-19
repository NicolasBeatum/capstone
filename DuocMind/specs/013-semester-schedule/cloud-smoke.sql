-- Verificación manual con datos sintéticos. Ejecutar completa: termina en ROLLBACK.
-- No usa cuentas reales ni deja datos persistidos.
begin;
do $test$
declare
  owner_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  semester_id uuid := gen_random_uuid();
  subject_id uuid := gen_random_uuid();
  request_id uuid := gen_random_uuid();
  document jsonb;
  result jsonb;
  repeated jsonb;
  loaded jsonb;
begin
  insert into auth.users(id,email) values
    (owner_a,'schedule-smoke-'||owner_a||'@example.test'),
    (owner_b,'schedule-smoke-'||owner_b||'@example.test');
  insert into public.estudiante(auth_user_id,rut,primer_nombre,primer_apellido) values
    (owner_a,'PLANNER-SMOKE-'||owner_a,'Prueba','Horario'),
    (owner_b,'PLANNER-SMOKE-'||owner_b,'Prueba','Horario');
  document := jsonb_build_object('schema',1,'activeSemesterId',semester_id,
    'semesters',jsonb_build_array(jsonb_build_object('id',semester_id,'name','Semestre sintético','startsOn',null,'endsOn',null)),
    'subjects',jsonb_build_array(jsonb_build_object('id',subject_id,'semesterId',semester_id,'name','Ramo sintético','code',null,'section',null)),
    'blocks',jsonb_build_array(
      jsonb_build_object('id',gen_random_uuid(),'subjectId',subject_id,'weekday',1,'startsAt','08:30','endsAt','10:00','room','301','teacher',null),
      jsonb_build_object('id',gen_random_uuid(),'subjectId',subject_id,'weekday',3,'startsAt','11:00','endsAt','12:30','room','402','teacher',null)));
  perform set_config('request.jwt.claim.sub',owner_a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_a,'role','authenticated')::text,true);
  set local role authenticated;
  result := public.save_personal_schedule(0,request_id,document);
  if result->>'status' <> 'applied' or result->>'revision' <> '1' then
    raise exception 'No se confirmó el guardado';
  end if;
  set constraints all immediate;
  repeated := public.save_personal_schedule(0,request_id,document);
  if repeated is distinct from result then raise exception 'Reintento no idempotente'; end if;
  loaded := public.load_personal_schedule();
  if loaded->>'revision' <> '1' or jsonb_array_length(loaded->'document'->'blocks') <> 2
    or not exists (select 1 from jsonb_array_elements(loaded->'document'->'blocks') b where b->>'room'='301')
    or not exists (select 1 from jsonb_array_elements(loaded->'document'->'blocks') b where b->>'room'='402') then
    raise exception 'No se recuperaron ambos bloques y salas';
  end if;
  result := public.save_personal_schedule(0,gen_random_uuid(),document);
  if result->>'status' <> 'conflict' then raise exception 'Conflicto no detectado'; end if;
  begin
    update public.personal_schedule set revision=99 where user_id=owner_a;
    raise exception 'Escritura directa permitida';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from schedule_private.schedule_request;
    raise exception 'Recibos privados accesibles';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub',owner_b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_b,'role','authenticated')::text,true);
  if exists(select 1 from public.schedule_block) then raise exception 'RLS no aísla cuentas'; end if;
  loaded := public.load_personal_schedule();
  if loaded->>'revision' <> '0' or jsonb_array_length(loaded->'document'->'blocks') <> 0 then
    raise exception 'RPC no aísla cuentas';
  end if;
  set local role anon;
  begin
    perform public.load_personal_schedule();
    raise exception 'Acceso anónimo permitido';
  exception when insufficient_privilege then null;
  end;
  set local role postgres;
end;
$test$;
rollback;
select 'Guardado, lectura, salas, idempotencia, conflicto, RLS y permisos correctos; transacción revertida.' as verification;
