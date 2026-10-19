-- DuocMind: estructura consultada en Supabase el 2026-10-19 (America/Santiago).

-- Proyecto ashgvanzjeaeekpygqgy. Solo esquemas public, private y schedule_private.

-- Evidencia estructural; sin filas, secretos, propietarios ni estado de secuencias.

-- Requiere Supabase/PostgreSQL 17 con auth, roles y extensiones existentes.

-- Para reconstruir la aplicación, usar las migraciones versionadas como fuente de verdad.

BEGIN;

SET LOCAL search_path = public, extensions, pg_catalog;

SET LOCAL check_function_bodies = false;

CREATE SCHEMA IF NOT EXISTS "public";

CREATE SCHEMA IF NOT EXISTS "private";

CREATE SCHEMA IF NOT EXISTS "schedule_private";

CREATE TABLE "public"."alerta_bienestar" (
    "id_alerta" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."alerta_bienestar_id_alerta_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "fecha_hora" timestamp with time zone DEFAULT now() NOT NULL,
    "tipo_alerta_id_tipoalerta" bigint NOT NULL,
    "estudiante_id_estudiante" bigint NOT NULL,
    "estudiante_carrera_id" bigint,
    "estado_alerta_id_estado" bigint NOT NULL,
    "aplicacion_test_id_aplicacion" bigint,
    "consentimiento_derivacion" boolean DEFAULT false NOT NULL,
    "consentimiento_fecha" timestamp with time zone,
    "consentimiento_version" text
);

CREATE TABLE "public"."aplicacion_test" (
    "id_aplicacion" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."aplicacion_test_id_aplicacion_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "fecha_hora" timestamp with time zone DEFAULT now() NOT NULL,
    "puntaje_total" integer NOT NULL,
    "test_id" bigint NOT NULL,
    "test_version" integer NOT NULL,
    "nivel_resultado" text NOT NULL,
    "item_critico_detectado" boolean DEFAULT false NOT NULL,
    "estudiante_id_estudiante" bigint NOT NULL,
    "estudiante_carrera_id" bigint
);

CREATE TABLE "public"."asignatura" (
    "id_asignatura" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."asignatura_id_asignatura_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "nombre_asignatura" text NOT NULL,
    "codigo" text NOT NULL
);

CREATE TABLE "public"."carrera" (
    "id_carrera" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."carrera_id_carrera_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "nombre_carrera" text NOT NULL,
    "sede_id_sede" bigint NOT NULL
);

CREATE TABLE "public"."carrera_asignatura" (
    "id_carrera_asignatura" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."carrera_asignatura_id_carrera_asignatura_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "carrera_id_carrera" bigint NOT NULL,
    "asignatura_id_asignatura" bigint NOT NULL
);

CREATE TABLE "public"."emocion_general" (
    "id_emocion" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."emocion_general_id_emocion_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "nombre_emocion" text NOT NULL,
    "valor_escala" smallint NOT NULL
);

CREATE TABLE "public"."estado" (
    "id_estado" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."estado_id_estado_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "nombre_estado" text NOT NULL
);

CREATE TABLE "public"."estado_alerta" (
    "id_estado" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."estado_alerta_id_estado_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "estado_alerta" text NOT NULL
);

CREATE TABLE "public"."estudiante" (
    "id_estudiante" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."estudiante_id_estudiante_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "auth_user_id" uuid DEFAULT auth.uid(),
    "rut" text NOT NULL,
    "primer_nombre" text NOT NULL,
    "segundo_nombre" text,
    "primer_apellido" text NOT NULL,
    "segundo_apellido" text,
    "numero_telefonico" text,
    "correo" text,
    "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."estudiante_asignatura" (
    "id_estudiante_asignatura" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."estudiante_asignatura_id_estudiante_asignatura_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "estudiante_id_estudiante" bigint NOT NULL,
    "estudiante_carrera_id" bigint NOT NULL,
    "carrera_id_carrera" bigint NOT NULL,
    "carrera_asignatura_id" bigint NOT NULL,
    "fecha_inscripcion" date DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE "public"."estudiante_carrera" (
    "id_estudiante_carrera" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."estudiante_carrera_id_estudiante_carrera_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "estudiante_id_estudiante" bigint NOT NULL,
    "carrera_id_carrera" bigint NOT NULL,
    "fecha_inicio" date DEFAULT CURRENT_DATE NOT NULL,
    "fecha_fin" date
);

CREATE TABLE "public"."evento_academico" (
    "id_evento" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."evento_academico_id_evento_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "titulo" text NOT NULL,
    "descripcion" text,
    "fecha_hora" timestamp with time zone NOT NULL,
    "tipo_evento_id" bigint NOT NULL,
    "estado_id" bigint NOT NULL,
    "estudiante_asignatura_id" bigint NOT NULL,
    "estudiante_id_estudiante" bigint NOT NULL
);

CREATE TABLE "public"."evento_institucional" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "description" text DEFAULT ''::text NOT NULL,
    "location" text NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "status" text DEFAULT 'draft'::text NOT NULL,
    "published_at" timestamp with time zone,
    "revision" integer DEFAULT 1 NOT NULL,
    "requires_registration" boolean DEFAULT false NOT NULL,
    "registration_url" text,
    "registration_deadline" timestamp with time zone,
    "registration_closed" boolean DEFAULT false NOT NULL,
    "tipo_id" smallint
);

CREATE TABLE "public"."material_apoyo" (
    "id_material" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."material_apoyo_id_material_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "titulo" text NOT NULL,
    "descripcion" text,
    "is_active" boolean DEFAULT false NOT NULL,
    "publication_status" text DEFAULT 'draft'::text NOT NULL,
    "published_at" timestamp with time zone,
    "revision" integer DEFAULT 1 NOT NULL
);

CREATE TABLE "public"."material_emocion" (
    "id_materialemocion" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."material_emocion_id_materialemocion_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "material_apoyo_id_material" bigint NOT NULL,
    "emocion_general_id_emocion" bigint NOT NULL
);

CREATE TABLE "public"."material_test" (
    "id_materialtest" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."material_test_id_materialtest_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "material_apoyo_id_material" bigint NOT NULL,
    "test_id" bigint NOT NULL,
    "test_version" integer NOT NULL,
    "nivel_resultado" text NOT NULL
);

CREATE TABLE "public"."opcion_respuesta" (
    "id_opcion" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."opcion_respuesta_id_opcion_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "pregunta_test_id_pregunta" bigint NOT NULL,
    "texto_opcion" text NOT NULL,
    "puntaje" integer NOT NULL
);

CREATE TABLE "public"."personal_schedule" (
    "user_id" uuid NOT NULL,
    "revision" integer DEFAULT 0 NOT NULL,
    "active_semester_id" uuid,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."pregunta_test" (
    "id_pregunta" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."pregunta_test_id_pregunta_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "test_id" bigint NOT NULL,
    "test_version" integer NOT NULL,
    "orden" integer NOT NULL,
    "texto_pregunta" text NOT NULL,
    "is_critica" boolean DEFAULT false NOT NULL,
    "helper" text DEFAULT ''::text NOT NULL
);

CREATE TABLE "public"."registro_emocional" (
    "id_registro" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."registro_emocional_id_registro_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "fecha_hora" timestamp with time zone DEFAULT now() NOT NULL,
    "estudiante_id_estudiante" bigint NOT NULL,
    "estudiante_carrera_id" bigint,
    "client_request_id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "emocion_general_id_emocion" bigint NOT NULL
);

CREATE TABLE "public"."schedule_block" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "subject_id" uuid NOT NULL,
    "weekday" smallint NOT NULL,
    "starts_at" time without time zone NOT NULL,
    "ends_at" time without time zone NOT NULL,
    "room" text,
    "teacher" text
);

CREATE TABLE "public"."schedule_semester" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "name" text NOT NULL,
    "starts_on" date,
    "ends_on" date
);

CREATE TABLE "public"."schedule_subject" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "semester_id" uuid NOT NULL,
    "name" text NOT NULL,
    "code" text,
    "section" text
);

CREATE TABLE "public"."sede" (
    "id_sede" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."sede_id_sede_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "nombre_sede" text NOT NULL
);

CREATE TABLE "public"."test_bienestar" (
    "id_test" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."test_bienestar_id_test_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "nombre_test" text NOT NULL,
    "tipo_test" text NOT NULL,
    "version" integer NOT NULL,
    "descripcion" text,
    "puntaje_minimo" integer DEFAULT 0 NOT NULL,
    "puntaje_maximo" integer NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "catalog_id" uuid NOT NULL,
    "publication_status" text DEFAULT 'draft'::text NOT NULL,
    "scoring_kind" text DEFAULT 'sum'::text NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "published_at" timestamp with time zone
);

CREATE TABLE "public"."test_catalogo" (
    "catalog_id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "code" text NOT NULL,
    "kind" text NOT NULL,
    "active_version_id" bigint
);

CREATE TABLE "public"."test_resultado_nivel" (
    "test_id" bigint NOT NULL,
    "test_version" integer NOT NULL,
    "nivel_resultado" text NOT NULL,
    "puntaje_minimo" integer NOT NULL,
    "puntaje_maximo" integer NOT NULL,
    "label" text DEFAULT ''::text NOT NULL,
    "interpretation" text DEFAULT ''::text NOT NULL
);

CREATE TABLE "public"."tipo_alerta" (
    "id_tipoalerta" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."tipo_alerta_id_tipoalerta_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "tipo_alerta" text NOT NULL
);

CREATE TABLE "public"."tipo_evento" (
    "id_tipo_evento" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."tipo_evento_id_tipo_evento_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "nombre_evento" text NOT NULL
);

CREATE TABLE "public"."tipo_evento_institucional" (
    "id" smallint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "public"."tipo_evento_institucional_id_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 CACHE 1 NO CYCLE) NOT NULL,
    "code" text NOT NULL,
    "nombre" text NOT NULL,
    "orden" smallint DEFAULT 0 NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL
);

CREATE TABLE "private"."admin_requests" (
    "request_id" uuid NOT NULL,
    "actor" uuid NOT NULL,
    "action" text NOT NULL,
    "resource" text NOT NULL,
    "payload_hash" text NOT NULL,
    "status" text NOT NULL,
    "result" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL
);

CREATE TABLE "private"."admin_staff" (
    "auth_user_id" uuid NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "private"."password_reset_limits" (
    "id" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME "private"."password_reset_limits_id_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 CACHE 1 NO CYCLE) NOT NULL,
    "actor" uuid NOT NULL,
    "student_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL
);

CREATE TABLE "schedule_private"."schedule_request" (
    "user_id" uuid NOT NULL,
    "request_id" uuid NOT NULL,
    "payload_hash" text NOT NULL,
    "revision" integer NOT NULL
);

CREATE OR REPLACE FUNCTION private.assert_admin(actor uuid, session uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 perform 1 from auth.sessions s where s.id=session and s.user_id=actor and(s.not_after is null or s.not_after>now());
 if not found then raise exception using errcode='P0401',message='Sesión inválida';end if;
 perform 1 from private.admin_staff a where a.auth_user_id=actor and a.enabled;
 if not found then raise exception using errcode='P0403',message='Sin autorización';end if;
end;$function$;

CREATE OR REPLACE FUNCTION private.catalog_json(cid uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select jsonb_build_object('catalogId',c.catalog_id,'code',c.code,'kind',c.kind,'activeVersionId',c.active_version_id::text,'versions',coalesce((select jsonb_agg(jsonb_build_object('versionId',t.id_test::text,'version',t.version,'title',t.nombre_test,'publicationStatus',t.publication_status,'active',t.is_active,'revision',t.revision) order by t.version desc) from public.test_bienestar t where t.catalog_id=c.catalog_id),'[]'::jsonb)) from public.test_catalogo c where catalog_id=cid;
$function$;

CREATE OR REPLACE FUNCTION private.check_event_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if not new.requires_registration then
  if new.registration_url is not null or new.registration_deadline is not null or new.registration_closed then
   raise exception using errcode='P0422',message='Evento sin inscripción no admite condiciones';
  end if;
 else
  if new.registration_url is not null and (
   length(new.registration_url)>2048 or new.registration_url !~* '^https://([a-z0-9.-]+|\[[a-f0-9:]+\])(:[0-9]{1,5})?([/?#].*)?$'
   or new.registration_url ~ '[[:space:][:cntrl:]]' or position(chr(92) in new.registration_url)>0
  ) then raise exception using errcode='P0422',message='Enlace HTTPS inválido';end if;
  if new.registration_deadline>new.starts_at then raise exception using errcode='P0422',message='El plazo debe ser anterior al inicio';end if;
  if new.status<>'draft' and (new.registration_url is null or new.registration_deadline is null) then
   raise exception using errcode='P0422',message='Completa las condiciones antes de publicar';
  end if;
  if TG_OP='UPDATE' and old.registration_closed and not new.registration_closed and new.status='published'
   and (new.registration_deadline<=now() or new.starts_at<=now()) then
   raise exception using errcode='P0422',message='No se puede reabrir una inscripción vencida';
  end if;
 end if;
 return new;
end;$function$;

CREATE OR REPLACE FUNCTION private.check_event_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if old.status='cancelled' and new is distinct from old then raise exception using errcode='P0422',message='Evento cancelado no editable';end if;
 if old.published_at is not null and(new.published_at is distinct from old.published_at or new.status='draft') then raise exception using errcode='P0422',message='Publicación conservada';end if;return new;
end;$function$;

CREATE OR REPLACE FUNCTION private.check_event_type_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if new.code is distinct from old.code then
  raise exception using errcode='P0422',message='El código del tipo no se puede modificar';
 end if;
 return new;
end;$function$;

CREATE OR REPLACE FUNCTION private.check_fields(payload jsonb, allowed text[])
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if jsonb_typeof(payload)<>'object' or exists(select 1 from jsonb_object_keys(payload) k where not(k=any(allowed))) then raise exception using errcode='P0422',message='Campos no permitidos';end if;
end;$function$;

CREATE OR REPLACE FUNCTION private.check_test_parent()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare parent_id bigint; old_id bigint;
begin
 if tg_table_name='opcion_respuesta' then
  if tg_op<>'DELETE' then select test_id into parent_id from public.pregunta_test where id_pregunta=new.pregunta_test_id_pregunta; end if;
  if tg_op<>'INSERT' then select test_id into old_id from public.pregunta_test where id_pregunta=old.pregunta_test_id_pregunta; end if;
 else
  if tg_op<>'DELETE' then parent_id:=new.test_id; end if;
  if tg_op<>'INSERT' then old_id:=old.test_id; end if;
 end if;
 if exists(select 1 from public.test_bienestar where id_test in(parent_id,old_id) and publication_status='published') then raise exception using errcode='P0422',message='Contenido publicado inmutable';end if;
 if tg_op='DELETE' then return old;else return new;end if;
end;$function$;

CREATE OR REPLACE FUNCTION private.check_test_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if tg_op='DELETE' and old.publication_status='published' then raise exception using errcode='P0422',message='Versión publicada inmutable';end if;
 if tg_op='UPDATE' and old.publication_status='published' then
  if (to_jsonb(new)-'is_active'-'revision') is distinct from (to_jsonb(old)-'is_active'-'revision') or new.revision<>old.revision+1 then raise exception using errcode='P0422',message='Versión publicada inmutable';end if;
 end if;
 if tg_op<>'DELETE' then
  if new.publication_status='draft' and (new.is_active or new.published_at is not null) then raise exception using errcode='P0422',message='Borrador no activable';end if;
  if new.publication_status='published' and new.published_at is null then raise exception using errcode='P0422',message='Publicación requiere fecha';end if;
  if exists(select 1 from public.test_catalogo where catalog_id=new.catalog_id and kind='custom') and new.nombre_test in ('WHO-5 · Bienestar','PHQ-9 · Ánimo','GAD-7 · Ansiedad','Sondeo inicial','Escala de Estrés Percibido (PSS-10)') then raise exception using errcode='P0422',message='Nombre reservado';end if;
  return new;
 end if;return old;
end;$function$;

CREATE OR REPLACE FUNCTION private.check_text(value text, maximum integer, optional boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if value is null or length(value)>maximum or(not optional and length(trim(value))=0) then raise exception using errcode='P0422',message='Texto inválido';end if;
end;$function$;

CREATE OR REPLACE FUNCTION private.check_tip_rule()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if not exists(select 1 from public.test_bienestar where id_test=new.test_id and version=new.test_version and publication_status='published') then raise exception using errcode='P0422',message='Regla requiere versión publicada';end if;return new;
end;$function$;

CREATE OR REPLACE FUNCTION private.cleanup_admin_operations()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 delete from private.admin_requests where expires_at<=now();
 delete from private.password_reset_limits where expires_at<=now();
 delete from cron.job_run_details where jobid in(select jobid from cron.job where jobname='duocmind_admin_cleanup') and end_time<now()-interval '7 days';
end;
$function$;

CREATE OR REPLACE FUNCTION private.freeze_catalog_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if (to_jsonb(new)-'active_version_id') is distinct from (to_jsonb(old)-'active_version_id') then raise exception using errcode='P0422',message='Identidad del catálogo inmutable';end if;return new;
end;$function$;

CREATE OR REPLACE FUNCTION private.parse_event_type_id(value jsonb)
 RETURNS smallint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare result smallint;
begin
 if value is null or value='null'::jsonb then return null;end if;
 if jsonb_typeof(value)<>'string' or (value#>>'{}')!~'^[1-9][0-9]{0,4}$' then
  raise exception using errcode='P0422',message='Tipo inválido';
 end if;
 if (value#>>'{}')::integer>32767 then raise exception using errcode='P0422',message='Tipo inválido';end if;
 result:=(value#>>'{}')::smallint;
 if not exists(select 1 from public.tipo_evento_institucional where id=result) then
  raise exception using errcode='P0422',message='Tipo no disponible';
 end if;
 return result;
end;$function$;

CREATE OR REPLACE FUNCTION private.save_test_content(tid bigint, payload jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare q jsonb;o jsonb;l jsonb;ordinal integer:=0;qid bigint;tv integer;min_score integer:=0;max_score integer:=0;lo integer;hi integer;
begin
 perform private.check_text(payload->>'title',160);perform private.check_text(coalesce(payload->>'description',''),5000,true);
 if jsonb_typeof(payload->'questions') is distinct from 'array' or jsonb_array_length(payload->'questions')>100 or jsonb_typeof(payload->'levels') is distinct from 'array' or jsonb_array_length(payload->'levels')>100 then raise exception using errcode='P0422',message='Preguntas o niveles inválidos';end if;
 select version into strict tv from public.test_bienestar where id_test=tid;
 delete from public.opcion_respuesta where pregunta_test_id_pregunta in(select id_pregunta from public.pregunta_test where test_id=tid);
 delete from public.pregunta_test where test_id=tid;delete from public.test_resultado_nivel where test_id=tid;
 for q in select value from jsonb_array_elements(payload->'questions') loop
  perform private.check_fields(q,array['text','helper','options']);perform private.check_text(q->>'text',5000);perform private.check_text(coalesce(q->>'helper',''),5000,true);
  if jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options') not between 2 and 20 then raise exception using errcode='P0422',message='Opciones insuficientes';end if;
  ordinal:=ordinal+1;insert into public.pregunta_test(test_id,test_version,orden,texto_pregunta,helper) values(tid,tv,ordinal,q->>'text',coalesce(q->>'helper','')) returning id_pregunta into qid;
  lo:=null;hi:=null;
  for o in select value from jsonb_array_elements(q->'options') loop
   perform private.check_fields(o,array['text','score']);perform private.check_text(o->>'text',160);
   if jsonb_typeof(o->'score')<>'number' or (o->>'score')!~'^[0-9]+$' or (o->>'score')::numeric>1000 then raise exception using errcode='P0422',message='Puntaje inválido';end if;
   insert into public.opcion_respuesta(pregunta_test_id_pregunta,texto_opcion,puntaje) values(qid,o->>'text',(o->>'score')::int);
   lo:=least(lo,(o->>'score')::int);hi:=greatest(hi,(o->>'score')::int);
  end loop;min_score:=min_score+lo;max_score:=max_score+hi;
 end loop;
 for l in select value from jsonb_array_elements(payload->'levels') loop
  perform private.check_fields(l,array['key','label','content','min','max']);perform private.check_text(l->>'key',80);perform private.check_text(l->>'label',160);perform private.check_text(l->>'content',5000);
  if l->>'key'!~'^[a-z][a-z0-9_]*$' or (l->>'min')!~'^[0-9]+$' or(l->>'max')!~'^[0-9]+$' or(l->>'min')::numeric>100000 or(l->>'max')::numeric>100000 then raise exception using errcode='P0422',message='Nivel inválido';end if;
  insert into public.test_resultado_nivel(test_id,test_version,nivel_resultado,puntaje_minimo,puntaje_maximo,label,interpretation) values(tid,tv,l->>'key',(l->>'min')::int,(l->>'max')::int,l->>'label',l->>'content');
 end loop;
 update public.test_bienestar set nombre_test=payload->>'title',descripcion=coalesce(payload->>'description',''),puntaje_minimo=min_score,puntaje_maximo=max_score where id_test=tid;
end;$function$;

CREATE OR REPLACE FUNCTION private.save_tip_rules(tid bigint, rules jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r jsonb;mid bigint;testrow public.test_bienestar;
begin
 if jsonb_typeof(rules) is distinct from 'array' or jsonb_array_length(rules)>100 then raise exception using errcode='P0422',message='Reglas inválidas';end if;
 delete from public.material_emocion where material_apoyo_id_material=tid;delete from public.material_test where material_apoyo_id_material=tid;
 for r in select value from jsonb_array_elements(rules) loop
  if r->>'kind'='mood' then
   perform private.check_fields(r,array['kind','mood']);select id_emocion into mid from public.emocion_general where nombre_emocion=r->>'mood';if mid is null then raise exception using errcode='P0422',message='Ánimo inválido';end if;
   insert into public.material_emocion(material_apoyo_id_material,emocion_general_id_emocion) values(tid,mid);
  elsif r->>'kind'='result' then
   perform private.check_fields(r,array['kind','catalogId','versionId','version','level']);
   if r->>'versionId'!~'^[1-9][0-9]*$' or r->>'version'!~'^[1-9][0-9]*$' then raise exception using errcode='P0422',message='Versión inválida';end if;
   select * into testrow from public.test_bienestar where id_test=(r->>'versionId')::bigint and catalog_id=(r->>'catalogId')::uuid and version=(r->>'version')::int and publication_status='published';
   if not found then raise exception using errcode='P0422',message='Regla requiere versión publicada';end if;
   insert into public.material_test(material_apoyo_id_material,test_id,test_version,nivel_resultado) values(tid,testrow.id_test,testrow.version,r->>'level');
  else raise exception using errcode='P0422',message='Tipo de regla inválido';end if;
 end loop;
end;$function$;

CREATE OR REPLACE FUNCTION private.test_version_json(tid bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select jsonb_build_object('versionId',t.id_test::text,'catalogId',t.catalog_id,'version',t.version,'title',t.nombre_test,'description',coalesce(t.descripcion,''),'publicationStatus',t.publication_status,'publishedAt',t.published_at,'active',t.is_active,'revision',t.revision,'kind',c.kind,'code',c.code,'scoringKind',t.scoring_kind,
 'questions',coalesce((select jsonb_agg(jsonb_build_object('id',p.id_pregunta::text,'order',p.orden,'text',p.texto_pregunta,'helper',p.helper,'critical',p.is_critica,'options',coalesce((select jsonb_agg(jsonb_build_object('id',o.id_opcion::text,'text',o.texto_opcion,'score',o.puntaje) order by o.id_opcion) from public.opcion_respuesta o where o.pregunta_test_id_pregunta=p.id_pregunta),'[]'::jsonb)) order by p.orden) from public.pregunta_test p where p.test_id=t.id_test),'[]'::jsonb),
 'levels',coalesce((select jsonb_agg(jsonb_build_object('key',n.nivel_resultado,'label',n.label,'content',n.interpretation,'min',n.puntaje_minimo,'max',n.puntaje_maximo) order by n.puntaje_minimo) from public.test_resultado_nivel n where n.test_id=t.id_test),'[]'::jsonb))
 from public.test_bienestar t join public.test_catalogo c using(catalog_id) where t.id_test=tid;
$function$;

CREATE OR REPLACE FUNCTION private.tip_json(tid bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select jsonb_build_object('id',m.id_material::text,'title',m.titulo,'content',coalesce(m.descripcion,''),'publicationStatus',m.publication_status,'publishedAt',m.published_at,'active',m.is_active,'revision',m.revision,'rules',coalesce((select jsonb_agg(rule order by rule::text) from(
  select jsonb_build_object('kind','mood','mood',e.nombre_emocion) rule from public.material_emocion me join public.emocion_general e on e.id_emocion=me.emocion_general_id_emocion where me.material_apoyo_id_material=m.id_material
  union all select jsonb_build_object('kind','result','catalogId',t.catalog_id,'versionId',t.id_test::text,'version',t.version,'level',mt.nivel_resultado) from public.material_test mt join public.test_bienestar t on t.id_test=mt.test_id where mt.material_apoyo_id_material=m.id_material
 ) rules),'[]'::jsonb)) from public.material_apoyo m where id_material=tid;
$function$;

CREATE OR REPLACE FUNCTION private.validate_test_publication(tid bigint)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare expected integer;maximum integer;l record;
begin
 select puntaje_minimo,puntaje_maximo into expected,maximum from public.test_bienestar where id_test=tid;
 if not exists(select 1 from public.pregunta_test where test_id=tid) or exists(select 1 from public.pregunta_test p where p.test_id=tid and(select count(*) from public.opcion_respuesta where pregunta_test_id_pregunta=p.id_pregunta)<2) then raise exception using errcode='P0422',message='Cuestionario incompleto';end if;
 if not exists(select 1 from public.test_resultado_nivel where test_id=tid) then raise exception using errcode='P0422',message='Niveles incompletos';end if;
 for l in select * from public.test_resultado_nivel where test_id=tid order by puntaje_minimo loop
  if l.puntaje_minimo<>expected then raise exception using errcode='P0422',message='Rangos con huecos o solapamientos';end if;expected:=l.puntaje_maximo+1;
 end loop;
 if expected<>maximum+1 then raise exception using errcode='P0422',message='Rangos no cubren los puntajes';end if;
end;$function$;

CREATE OR REPLACE FUNCTION public.admin_access(p_actor uuid, p_session uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin perform private.assert_admin(p_actor,p_session);return jsonb_build_object('allowed',true,'capabilities',array['students','tests','events','tips']);end;$function$;

CREATE OR REPLACE FUNCTION public.admin_mutate(p_actor uuid, p_session uuid, p_method text, p_path text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare request uuid;hash text;cached private.admin_requests;result jsonb;tid bigint;cat uuid;current_test public.test_bienestar;newid bigint;rev integer;op text;idtext text;eid uuid;eventrow public.evento_institucional;tiprow public.material_apoyo;q record;o record;l record;qid bigint;type_row public.tipo_evento_institucional;type_id smallint;type_name text;
begin
 perform private.assert_admin(p_actor,p_session);
 request:=(p_payload->>'requestId')::uuid;
 if request is null then raise exception using errcode='P0422',message='requestId requerido';end if;
 hash:=encode(extensions.digest(convert_to(p_payload::text,'UTF8'),'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended(request::text,0));
 select * into cached from private.admin_requests where request_id=request and expires_at>now();
 if found then
  if cached.actor<>p_actor or cached.action<>p_method or cached.resource<>p_path or cached.payload_hash<>hash then raise exception using errcode='P0409',message='Petición en conflicto';end if;return cached.result;
 end if;
 delete from private.admin_requests where request_id=request and expires_at<=now();
 if p_path='/event-types' or p_path~'^/event-types/[1-9][0-9]{0,4}$' then
  if not ((p_path='/event-types' and p_method='POST') or (p_path<>'/event-types' and p_method='PUT')) then
   raise exception using errcode='P0404',message='Operación no disponible';
  end if;
  if p_path='/event-types' then
   perform private.check_fields(p_payload,array['requestId','code','name','order']);
   if jsonb_typeof(p_payload->'code') is distinct from 'string' or (p_payload->>'code')!~'^[a-z][a-z0-9_]{1,31}$' then
    raise exception using errcode='P0422',message='Código inválido';
   end if;
  else
   perform private.check_fields(p_payload,array['requestId','expectedRevision','name','order']);
   if split_part(p_path,'/',3)::integer>32767 then raise exception using errcode='P0422',message='Tipo inválido';end if;
   type_id:=split_part(p_path,'/',3)::smallint;
   select * into type_row from public.tipo_evento_institucional where id=type_id for update;
   if not found then raise exception using errcode='P0404',message='Tipo no disponible';end if;
   if jsonb_typeof(p_payload->'expectedRevision') is distinct from 'number' or (p_payload->>'expectedRevision')!~'^[1-9][0-9]*$' then
    raise exception using errcode='P0422',message='Revisión inválida';
   end if;
   if (p_payload->>'expectedRevision')::numeric is distinct from type_row.revision::numeric then
    raise exception using errcode='P0409',message='Revisión en conflicto';
   end if;
  end if;
  if jsonb_typeof(p_payload->'name') is distinct from 'string' or jsonb_typeof(p_payload->'order') is distinct from 'number' then
   raise exception using errcode='P0422',message='Tipo inválido';
  end if;
  type_name:=btrim(p_payload->>'name');
  perform private.check_text(type_name,40);
  if (p_payload->>'order')!~'^[0-9]+$' or (p_payload->>'order')::numeric not between 0 and 32767 then
   raise exception using errcode='P0422',message='Orden inválido';
  end if;
  if p_path='/event-types' then
   insert into public.tipo_evento_institucional(code,nombre,orden) values(p_payload->>'code',type_name,(p_payload->>'order')::smallint) returning id,revision into type_id,rev;
  else
   update public.tipo_evento_institucional set nombre=type_name,orden=(p_payload->>'order')::smallint,revision=revision+1 where id=type_id returning revision into rev;
  end if;
  result:=jsonb_build_object('id',type_id::text,'revision',rev);
 elsif p_path='/tests' and p_method='POST' then
  perform private.check_fields(p_payload,array['requestId','title','description','questions','levels']);
  insert into public.test_catalogo(code,kind) values('custom_'||gen_random_uuid()::text,'custom') returning catalog_id into cat;
  insert into public.test_bienestar(nombre_test,tipo_test,version,puntaje_maximo,catalog_id) values(p_payload->>'title','custom',1,0,cat) returning id_test into tid;
  perform private.save_test_content(tid,p_payload);result:=jsonb_build_object('catalogId',cat,'versionId',tid::text,'revision',1);
 elsif p_path~'^/tests/versions/[1-9][0-9]*/(draft|clone|publish|activation)$' then
  tid:=split_part(p_path,'/',4)::bigint;op:=split_part(p_path,'/',5);
  select catalog_id into cat from public.test_bienestar where id_test=tid;
  if cat is null then raise exception using errcode='P0404',message='Versión no disponible';end if;
  perform 1 from public.test_catalogo where catalog_id=cat for update;
  select * into current_test from public.test_bienestar where id_test=tid for update;
  if (p_payload->>'expectedRevision')::int is distinct from current_test.revision then raise exception using errcode='P0409',message='Revisión en conflicto';end if;
  if op<>'activation' and exists(select 1 from public.test_catalogo where catalog_id=cat and kind='protected') then raise exception using errcode='P0403',message='Instrumento protegido';end if;
  if op='draft' and p_method='PUT' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','title','description','questions','levels']);
   if current_test.publication_status<>'draft' then raise exception using errcode='P0422',message='Contenido publicado inmutable';end if;
   perform private.save_test_content(tid,p_payload);update public.test_bienestar set revision=revision+1 where id_test=tid returning revision into rev;
  elsif op='publish' and p_method='POST' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);
   if current_test.publication_status<>'draft' then raise exception using errcode='P0422',message='Ya publicado';end if;
   perform private.validate_test_publication(tid);
   update public.test_bienestar set publication_status='published',published_at=now(),revision=revision+1 where id_test=tid returning revision into rev;
  elsif op='activation' and p_method='POST' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','active']);
   if current_test.publication_status<>'published' or jsonb_typeof(p_payload->'active')<>'boolean' then raise exception using errcode='P0422',message='Activación inválida';end if;
   if(p_payload->>'active')::boolean then update public.test_bienestar set is_active=false,revision=revision+1 where catalog_id=cat and is_active and id_test<>tid;end if;
   update public.test_bienestar set is_active=(p_payload->>'active')::boolean,revision=revision+1 where id_test=tid returning revision into rev;
   update public.test_catalogo set active_version_id=case when(p_payload->>'active')::boolean then tid else null end where catalog_id=cat and((p_payload->>'active')::boolean or active_version_id=tid);
  elsif op='clone' and p_method='POST' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);
   insert into public.test_bienestar(nombre_test,tipo_test,version,descripcion,puntaje_minimo,puntaje_maximo,catalog_id,scoring_kind) select nombre_test,tipo_test,(select max(version)+1 from public.test_bienestar where catalog_id=cat),descripcion,puntaje_minimo,puntaje_maximo,catalog_id,scoring_kind from public.test_bienestar where id_test=tid returning id_test into newid;
   for q in select * from public.pregunta_test where test_id=tid order by orden loop
    insert into public.pregunta_test(test_id,test_version,orden,texto_pregunta,helper,is_critica) select newid,version,q.orden,q.texto_pregunta,q.helper,q.is_critica from public.test_bienestar where id_test=newid returning id_pregunta into qid;
    insert into public.opcion_respuesta(pregunta_test_id_pregunta,texto_opcion,puntaje) select qid,texto_opcion,puntaje from public.opcion_respuesta where pregunta_test_id_pregunta=q.id_pregunta order by id_opcion;
   end loop;
   insert into public.test_resultado_nivel(test_id,test_version,nivel_resultado,puntaje_minimo,puntaje_maximo,label,interpretation) select newid,(select version from public.test_bienestar where id_test=newid),nivel_resultado,puntaje_minimo,puntaje_maximo,label,interpretation from public.test_resultado_nivel where test_id=tid;
   tid:=newid;rev:=1;
  else raise exception using errcode='P0404',message='Operación no disponible';end if;
  result:=jsonb_build_object('catalogId',cat,'versionId',tid::text,'revision',rev);
 elsif p_path='/events' and p_method='POST' or p_path~'^/events/[0-9a-f-]{36}(/(publish|cancel))?$' then
  if p_path='/events' then op:='create';else eid:=split_part(p_path,'/',3)::uuid;op:=coalesce(nullif(split_part(p_path,'/',4),''),'edit');select * into eventrow from public.evento_institucional where id=eid for update;
   if not found then raise exception using errcode='P0404',message='Evento no disponible';end if;
   if(p_payload->>'expectedRevision')::int is distinct from eventrow.revision then raise exception using errcode='P0409',message='Revisión en conflicto';end if;
  end if;
  if(op='create' and p_method='POST') or(op='edit' and p_method='PUT') then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','title','description','location','startsAt','endsAt','requiresRegistration','registrationUrl','registrationDeadline','registrationClosed','typeId']);perform private.check_text(p_payload->>'title',160);perform private.check_text(coalesce(p_payload->>'description',''),5000,true);perform private.check_text(p_payload->>'location',160);
   if p_payload->>'startsAt'!~'(Z|[+-][0-9]{2}:[0-9]{2})$' or p_payload->>'endsAt'!~'(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception using errcode='P0422',message='Instante UTC requerido';end if;
   type_id:=case when p_payload ? 'typeId' then private.parse_event_type_id(p_payload->'typeId') when op='edit' then eventrow.tipo_id else null end;
   if op='create' then insert into public.evento_institucional(title,description,location,starts_at,ends_at,requires_registration,registration_url,registration_deadline,registration_closed,tipo_id) values(p_payload->>'title',coalesce(p_payload->>'description',''),p_payload->>'location',(p_payload->>'startsAt')::timestamptz,(p_payload->>'endsAt')::timestamptz,coalesce((p_payload->>'requiresRegistration')::boolean,false),p_payload->>'registrationUrl',(p_payload->>'registrationDeadline')::timestamptz,coalesce((p_payload->>'registrationClosed')::boolean,false),type_id) returning id,revision into eid,rev;
   else update public.evento_institucional set tipo_id=type_id,title=p_payload->>'title',description=coalesce(p_payload->>'description',''),location=p_payload->>'location',starts_at=(p_payload->>'startsAt')::timestamptz,ends_at=(p_payload->>'endsAt')::timestamptz,requires_registration=case when p_payload ? 'requiresRegistration' then (p_payload->>'requiresRegistration')::boolean else eventrow.requires_registration end,registration_url=case when p_payload ? 'registrationUrl' then p_payload->>'registrationUrl' else eventrow.registration_url end,registration_deadline=case when p_payload ? 'registrationDeadline' then (p_payload->>'registrationDeadline')::timestamptz else eventrow.registration_deadline end,registration_closed=case when p_payload ? 'registrationClosed' then (p_payload->>'registrationClosed')::boolean else eventrow.registration_closed end,revision=revision+1 where id=eid returning revision into rev;end if;
  elsif op='publish' and p_method='POST' and eventrow.status='draft' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);update public.evento_institucional set status='published',published_at=now(),revision=revision+1 where id=eid returning revision into rev;
  elsif op='cancel' and p_method='POST' and eventrow.status='published' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);update public.evento_institucional set status='cancelled',revision=revision+1 where id=eid returning revision into rev;
  else raise exception using errcode='P0422',message='Transición inválida';end if;
  result:=jsonb_build_object('id',eid,'revision',rev);
 elsif p_path='/tips' and p_method='POST' or p_path~'^/tips/[1-9][0-9]*(/(publish|activation))?$' then
  if p_path='/tips' then op:='create';else tid:=split_part(p_path,'/',3)::bigint;op:=coalesce(nullif(split_part(p_path,'/',4),''),'edit');select * into tiprow from public.material_apoyo where id_material=tid for update;
   if not found then raise exception using errcode='P0404',message='Tip no disponible';end if;
   if(p_payload->>'expectedRevision')::int is distinct from tiprow.revision then raise exception using errcode='P0409',message='Revisión en conflicto';end if;
  end if;
  if(op='create' and p_method='POST') or(op='edit' and p_method='PUT') then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','title','content','rules']);perform private.check_text(p_payload->>'title',160);perform private.check_text(p_payload->>'content',5000);
   if op='create' then insert into public.material_apoyo(titulo,descripcion) values(p_payload->>'title',p_payload->>'content') returning id_material,revision into tid,rev;
   else update public.material_apoyo set titulo=p_payload->>'title',descripcion=p_payload->>'content',revision=revision+1 where id_material=tid returning revision into rev;end if;
   perform private.save_tip_rules(tid,p_payload->'rules');
  elsif op='publish' and p_method='POST' and tiprow.publication_status='draft' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);update public.material_apoyo set publication_status='published',published_at=now(),is_active=true,revision=revision+1 where id_material=tid returning revision into rev;
  elsif op='activation' and p_method='POST' and tiprow.publication_status='published' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','active']);if jsonb_typeof(p_payload->'active')<>'boolean' then raise exception using errcode='P0422',message='Activación inválida';end if;
   update public.material_apoyo set is_active=(p_payload->>'active')::boolean,revision=revision+1 where id_material=tid returning revision into rev;
  else raise exception using errcode='P0422',message='Transición inválida';end if;
  result:=jsonb_build_object('id',tid::text,'revision',rev);
 else raise exception using errcode='P0404',message='Operación no disponible';end if;
 insert into private.admin_requests(request_id,actor,action,resource,payload_hash,status,result) values(request,p_actor,p_method,p_path,hash,'completed',result);
 return result;
end;$function$;

CREATE OR REPLACE FUNCTION public.admin_read(p_actor uuid, p_session uuid, p_path text, p_query jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare result jsonb;page_number int;page_size int;search_term text;career bigint;campus bigint;
begin
 perform private.assert_admin(p_actor,p_session);
 if p_path='/students' then
  perform private.check_fields(p_query,array['search','careerId','campusId','page','pageSize']);
  page_number:=coalesce((p_query->>'page')::int,1);page_size:=coalesce((p_query->>'pageSize')::int,25);search_term:=lower(coalesce(p_query->>'search',''));career:=nullif(p_query->>'careerId','')::bigint;campus:=nullif(p_query->>'campusId','')::bigint;
  if page_number not between 1 and 100000 or page_size not between 1 and 100 or length(search_term)>100 then raise exception using errcode='P0422',message='Filtros inválidos';end if;
  with filtered as(
   select e.id_estudiante::text id,concat_ws(' ',e.primer_nombre,e.segundo_nombre,e.primer_apellido,e.segundo_apellido) name,nullif(trim(u.email),'') email,c.nombre_carrera "career",s.nombre_sede "campus"
   from public.estudiante e left join auth.users u on u.id=e.auth_user_id left join public.estudiante_carrera ec on ec.estudiante_id_estudiante=e.id_estudiante and ec.fecha_fin is null left join public.carrera c on c.id_carrera=ec.carrera_id_carrera left join public.sede s on s.id_sede=c.sede_id_sede
   where (career is null or c.id_carrera=career) and(campus is null or s.id_sede=campus) and(search_term='' or position(search_term in lower(concat_ws(' ',e.primer_nombre,e.segundo_nombre,e.primer_apellido,e.segundo_apellido)))>0 or position(search_term in lower(coalesce(u.email,'')))>0)
  ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(rows) order by name,id) from(select * from filtered order by name,id limit page_size offset(page_number-1)*page_size) rows),'[]'::jsonb),'total',(select count(*) from filtered),'page',page_number,'pageSize',page_size) into result;
 elsif p_path='/tests' then
  perform private.check_fields(p_query,array[]::text[]);select coalesce(jsonb_agg(private.catalog_json(catalog_id) order by code),'[]'::jsonb) into result from public.test_catalogo;
 elsif p_path~'^/tests/catalogs/[0-9a-f-]{36}$' then
  perform private.check_fields(p_query,array[]::text[]);result:=private.catalog_json(split_part(p_path,'/',4)::uuid);
 elsif p_path~'^/tests/versions/[1-9][0-9]*$' then
  perform private.check_fields(p_query,array[]::text[]);result:=private.test_version_json(split_part(p_path,'/',4)::bigint);
 elsif p_path='/event-types' then
  perform private.check_fields(p_query,array[]::text[]);
  select coalesce(jsonb_agg(jsonb_build_object('id',id::text,'code',code,'name',nombre,'order',orden,'revision',revision) order by orden,nombre,id),'[]'::jsonb)
  into result from public.tipo_evento_institucional;
 elsif p_path='/events' then
  perform private.check_fields(p_query,array[]::text[]);select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'description',description,'location',location,'startsAt',starts_at,'endsAt',ends_at,'status',status,'publishedAt',published_at,'revision',revision,'requiresRegistration',requires_registration,'registrationUrl',registration_url,'registrationDeadline',registration_deadline,'registrationClosed',registration_closed,'typeId',tipo_id::text) order by starts_at,id),'[]'::jsonb) into result from public.evento_institucional;
 elsif p_path='/tips' then
  perform private.check_fields(p_query,array[]::text[]);select coalesce(jsonb_agg(private.tip_json(id_material) order by titulo,id_material),'[]'::jsonb) into result from public.material_apoyo;
 elsif p_path='/catalogs' then
  perform private.check_fields(p_query,array[]::text[]);
  select jsonb_build_object(
   'careers',coalesce((select jsonb_agg(jsonb_build_object('id',id_carrera::text,'name',nombre_carrera,'campusId',sede_id_sede::text) order by nombre_carrera,id_carrera) from public.carrera),'[]'::jsonb),
   'campuses',coalesce((select jsonb_agg(jsonb_build_object('id',id_sede::text,'name',nombre_sede) order by nombre_sede,id_sede) from public.sede),'[]'::jsonb),
   'moods',coalesce((select jsonb_agg(nombre_emocion order by valor_escala) from public.emocion_general),'[]'::jsonb),
   'resultLevels',coalesce((select jsonb_agg(jsonb_build_object('catalogId',t.catalog_id,'versionId',t.id_test::text,'version',t.version,'title',t.nombre_test,'level',n.nivel_resultado,'label',n.label,'active',t.is_active) order by t.nombre_test,t.version,n.puntaje_minimo) from public.test_resultado_nivel n join public.test_bienestar t on t.id_test=n.test_id where t.publication_status='published'),'[]'::jsonb)) into result;
 else raise exception using errcode='P0404',message='Consulta no disponible';end if;
 if result is null then raise exception using errcode='P0404',message='Recurso no disponible';end if;
 return result;
end;$function$;

CREATE OR REPLACE FUNCTION public.admin_reset_finish(p_actor uuid, p_session uuid, p_request uuid, p_state text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 perform private.assert_admin(p_actor,p_session);
 if p_state not in ('accepted','uncertain') then raise exception using errcode='P0422',message='Estado inválido';end if;
 update private.admin_requests set status=p_state,result=jsonb_build_object('accepted',p_state='accepted') where request_id=p_request and actor=p_actor and status='reserved' and expires_at>now();
 if not found then raise exception using errcode='P0409',message='Solicitud no reservada';end if;
end;$function$;

CREATE OR REPLACE FUNCTION public.admin_reset_recipient(p_actor uuid, p_session uuid, p_student bigint, p_request uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare email text;
begin
 perform private.assert_admin(p_actor,p_session);
 if not exists(select 1 from private.admin_requests where request_id=p_request and actor=p_actor and resource='/students/'||p_student::text||'/password-reset' and status='reserved' and expires_at>now()) then raise exception using errcode='P0409',message='Solicitud no reservada';end if;
 select nullif(trim(u.email),'') into email from public.estudiante e join auth.users u on u.id=e.auth_user_id where e.id_estudiante=p_student;
 if email is null then raise exception using errcode='P0422',message='Cuenta sin correo recuperable';end if;return email;
end;$function$;

CREATE OR REPLACE FUNCTION public.admin_reset_reserve(p_actor uuid, p_session uuid, p_student bigint, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare cached private.admin_requests;resource text:='/students/'||p_student::text||'/password-reset';fingerprint text:=md5(p_student::text);
begin
 perform private.assert_admin(p_actor,p_session);
 perform pg_advisory_xact_lock(702005012);
 select * into cached from private.admin_requests where request_id=p_request and expires_at>now();
 if found then
  if cached.actor<>p_actor or cached.action<>'POST' or cached.resource<>resource or cached.payload_hash<>fingerprint then raise exception using errcode='P0409',message='Petición en conflicto';end if;
  return jsonb_build_object('send',false,'state',cached.status);
 end if;
 if not exists(select 1 from public.estudiante e join auth.users u on u.id=e.auth_user_id where e.id_estudiante=p_student and nullif(trim(u.email),'') is not null) then raise exception using errcode='P0422',message='Cuenta sin correo recuperable';end if;
 if exists(select 1 from private.password_reset_limits where student_id=p_student and expires_at>now() and created_at>now()-interval '1 minute') or(select count(*) from private.password_reset_limits where actor=p_actor and expires_at>now() and created_at>now()-interval '1 hour')>=10 then raise exception using errcode='P0429',message='Límite de solicitudes';end if;
 delete from private.admin_requests where request_id=p_request and expires_at<=now();
 insert into private.password_reset_limits(actor,student_id) values(p_actor,p_student);
 insert into private.admin_requests(request_id,actor,action,resource,payload_hash,status) values(p_request,p_actor,'POST',resource,fingerprint,'reserved');
 return jsonb_build_object('send',true,'state','reserved');
end;$function$;

CREATE OR REPLACE FUNCTION public.erase_student_personal_data(p_auth_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_student_id bigint;
begin
  if p_auth_user_id is null then
    raise exception 'El usuario de Auth es obligatorio';
  end if;

  select e.id_estudiante
    into v_student_id
  from public.estudiante e
  where e.auth_user_id = p_auth_user_id
  for update;

  if not found then
    return;
  end if;

  delete from public.alerta_bienestar
  where estudiante_id_estudiante = v_student_id;

  delete from public.aplicacion_test
  where estudiante_id_estudiante = v_student_id;

  delete from public.registro_emocional
  where estudiante_id_estudiante = v_student_id;

  update public.estudiante
  set auth_user_id = null,
      rut = 'ELIMINADO-' || v_student_id::text,
      primer_nombre = 'Eliminado',
      segundo_nombre = null,
      primer_apellido = 'Eliminado',
      segundo_apellido = null,
      numero_telefonico = null,
      correo = null
  where id_estudiante = v_student_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_student_events(p_event_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select jsonb_build_object('serverTime',statement_timestamp(),'events',coalesce(jsonb_agg(
  jsonb_build_object('id',e.id,'title',e.title,'description',e.description,'location',e.location,
   'startsAt',e.starts_at,'endsAt',e.ends_at,'status',e.status,'publishedAt',e.published_at,
   'revision',e.revision,'requiresRegistration',e.requires_registration,'registrationUrl',e.registration_url,
   'registrationDeadline',e.registration_deadline,'registrationClosed',e.registration_closed,
   'type',case when t.id is null then null else jsonb_build_object('code',t.code,'name',t.nombre) end)
  order by e.starts_at,e.id),'[]'::jsonb))
 from public.evento_institucional e
 left join public.tipo_evento_institucional t on t.id=e.tipo_id
 where e.published_at is not null and (p_event_id is null or e.id=p_event_id);
$function$;

CREATE OR REPLACE FUNCTION public.load_personal_schedule()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
select jsonb_build_object('revision',coalesce(p.revision,0),'document',jsonb_build_object(
  'schema',1,'activeSemesterId',p.active_semester_id,
  'semesters',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'startsOn',s.starts_on,'endsOn',s.ends_on) order by s.id) from public.schedule_semester s where s.user_id=auth.uid()),'[]'::jsonb),
  'subjects',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'semesterId',s.semester_id,'name',s.name,'code',s.code,'section',s.section) order by s.id) from public.schedule_subject s where s.user_id=auth.uid()),'[]'::jsonb),
  'blocks',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'subjectId',b.subject_id,'weekday',b.weekday,'startsAt',to_char(b.starts_at,'HH24:MI'),'endsAt',to_char(b.ends_at,'HH24:MI'),'room',b.room,'teacher',b.teacher) order by b.id) from public.schedule_block b where b.user_id=auth.uid()),'[]'::jsonb)
)) from (select 1) seed left join public.personal_schedule p on p.user_id=auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.save_personal_schedule(p_expected_revision integer, p_request_id uuid, p_document jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select schedule_private.save_schedule(p_expected_revision,p_request_id,p_document);
$function$;

CREATE OR REPLACE FUNCTION public.validar_puntaje_aplicacion_test()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_min integer;
  v_max integer;
begin
  select r.puntaje_minimo, r.puntaje_maximo
    into v_min, v_max
  from public.test_resultado_nivel r
  where r.test_id = new.test_id
    and r.test_version = new.test_version
    and r.nivel_resultado = new.nivel_resultado;

  if not found then
    raise exception 'El nivel no está configurado para ese test y versión';
  end if;

  if new.puntaje_total < v_min or new.puntaje_total > v_max then
    raise exception 'El puntaje total no pertenece al rango del nivel informado';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION schedule_private.fields(v jsonb, keys text[])
 RETURNS void
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
begin
  if jsonb_typeof(v) is distinct from 'object'
    or exists(select 1 from jsonb_object_keys(v) k where not k = any(keys))
    or not v ?& keys then
    raise exception using errcode = 'P0422', message = 'La información del horario no es válida.';
  end if;
end; $function$;

CREATE OR REPLACE FUNCTION schedule_private.save_schedule(p_expected_revision integer, p_request_id uuid, p_document jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare owner_id uuid:=auth.uid(); current_revision integer; receipt schedule_private.schedule_request; hash text; s jsonb; r jsonb; b jsonb;
begin
  if owner_id is null or not exists(select 1 from auth.users u join public.estudiante e on e.auth_user_id=u.id where u.id=owner_id) then
    raise exception using errcode='P0401',message='Inicia sesión con tu cuenta de estudiante.';
  end if;
  if p_request_id is null or p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode='P0422',message='La operación no es válida.';
  end if;
  perform schedule_private.validate_document(p_document);
  hash:=encode(extensions.digest(convert_to(jsonb_build_object('revision',p_expected_revision,'document',p_document)::text,'UTF8'),'sha256'),'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text,13013));
  select * into receipt from schedule_private.schedule_request where user_id=owner_id and request_id=p_request_id;
  if found then
    if receipt.payload_hash <> hash then raise exception using errcode='P0409',message='La operación ya fue usada con otros datos.'; end if;
    return jsonb_build_object('status','applied','revision',receipt.revision,'requestId',p_request_id);
  end if;
  select revision into current_revision from public.personal_schedule where user_id=owner_id for update;
  current_revision:=coalesce(current_revision,0);
  if current_revision <> p_expected_revision then
    return jsonb_build_object('status','conflict','remote',public.load_personal_schedule());
  end if;
  if exists(select 1 from public.schedule_semester old where old.user_id=owner_id and not exists(select 1 from jsonb_array_elements(p_document->'semesters') as sem(value) where (sem.value->>'id')::uuid=old.id)) then
    raise exception using errcode='P0422',message='Los semestres anteriores deben conservarse.';
  end if;
  insert into public.personal_schedule(user_id) values(owner_id) on conflict do nothing;
  for s in select value from jsonb_array_elements(p_document->'semesters') loop
    insert into public.schedule_semester(id,user_id,name,starts_on,ends_on) values((s->>'id')::uuid,owner_id,s->>'name',(s->>'startsOn')::date,(s->>'endsOn')::date)
    on conflict(id,user_id) do update set name=excluded.name,starts_on=excluded.starts_on,ends_on=excluded.ends_on;
  end loop;
  delete from public.schedule_block where user_id=owner_id;
  delete from public.schedule_subject old where old.user_id=owner_id and not exists(select 1 from jsonb_array_elements(p_document->'subjects') as subj(value) where (subj.value->>'id')::uuid=old.id);
  for r in select value from jsonb_array_elements(p_document->'subjects') loop
    insert into public.schedule_subject(id,user_id,semester_id,name,code,section) values((r->>'id')::uuid,owner_id,(r->>'semesterId')::uuid,r->>'name',r->>'code',r->>'section')
    on conflict(id,user_id) do update set semester_id=excluded.semester_id,name=excluded.name,code=excluded.code,section=excluded.section;
  end loop;
  for b in select value from jsonb_array_elements(p_document->'blocks') loop
    insert into public.schedule_block(id,user_id,subject_id,weekday,starts_at,ends_at,room,teacher)
    values((b->>'id')::uuid,owner_id,(b->>'subjectId')::uuid,(b->>'weekday')::smallint,(b->>'startsAt')::time,(b->>'endsAt')::time,b->>'room',b->>'teacher');
  end loop;
  update public.personal_schedule set active_semester_id=(p_document->>'activeSemesterId')::uuid,revision=current_revision+1,updated_at=now() where user_id=owner_id;
  insert into schedule_private.schedule_request(user_id,request_id,payload_hash,revision) values(owner_id,p_request_id,hash,current_revision+1);
  return jsonb_build_object('status','applied','revision',current_revision+1,'requestId',p_request_id);
end; $function$;

CREATE OR REPLACE FUNCTION schedule_private.valid_text(v jsonb, max_length integer, optional boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case when v = 'null'::jsonb then optional else
    jsonb_typeof(v) = 'string' and length(v #>> '{}') between 1 and max_length
    and (v #>> '{}') = btrim(v #>> '{}') and (v #>> '{}') !~ '[[:cntrl:]]' end;
$function$;

CREATE OR REPLACE FUNCTION schedule_private.valid_uuid(v jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select jsonb_typeof(v) = 'string' and (v #>> '{}') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
$function$;

CREATE OR REPLACE FUNCTION schedule_private.validate_document(doc jsonb)
 RETURNS void
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare s jsonb; r jsonb; b jsonb; field text;
begin
  perform schedule_private.fields(doc,array['schema','activeSemesterId','semesters','subjects','blocks']);
  if doc->'schema' <> '1'::jsonb or octet_length(doc::text) > 2097152
    or jsonb_typeof(doc->'semesters') <> 'array' or jsonb_typeof(doc->'subjects') <> 'array' or jsonb_typeof(doc->'blocks') <> 'array' then
    raise exception using errcode='P0422',message='El horario no es válido o supera el límite permitido.';
  end if;
  if jsonb_array_length(doc->'semesters') > 50 or jsonb_array_length(doc->'subjects') > 1000 or jsonb_array_length(doc->'blocks') > 10000 then
    raise exception using errcode='P0422',message='El horario supera el límite permitido.';
  end if;
  for s in select value from jsonb_array_elements(doc->'semesters') loop
    perform schedule_private.fields(s,array['id','name','startsOn','endsOn']);
    if not schedule_private.valid_uuid(s->'id') or not schedule_private.valid_text(s->'name',80) then
      raise exception using errcode='P0422',message='Revisa el nombre e identificador del semestre.';
    end if;
    foreach field in array array['startsOn','endsOn'] loop
      if s->field <> 'null'::jsonb and (jsonb_typeof(s->field) <> 'string' or (s->>field) !~ '^\d{4}-\d{2}-\d{2}$' or to_char((s->>field)::date,'YYYY-MM-DD') <> s->>field) then
        raise exception using errcode='P0422',message='Revisa las fechas del semestre.';
      end if;
    end loop;
    if (s->>'startsOn')::date > (s->>'endsOn')::date then
      raise exception using errcode='P0422',message='El término es anterior al inicio.';
    end if;
  end loop;
  for r in select value from jsonb_array_elements(doc->'subjects') loop
    perform schedule_private.fields(r,array['id','semesterId','name','code','section']);
    if not schedule_private.valid_uuid(r->'id') or not schedule_private.valid_uuid(r->'semesterId')
      or not schedule_private.valid_text(r->'name',120) or not schedule_private.valid_text(r->'code',40,true) or not schedule_private.valid_text(r->'section',40,true)
      or not exists(select 1 from jsonb_array_elements(doc->'semesters') as sem(value) where (sem.value->>'id')::uuid=(r->>'semesterId')::uuid) then
      raise exception using errcode='P0422',message='El ramo o semestre no es válido.';
    end if;
  end loop;
  for b in select value from jsonb_array_elements(doc->'blocks') loop
    perform schedule_private.fields(b,array['id','subjectId','weekday','startsAt','endsAt','room','teacher']);
    if not schedule_private.valid_uuid(b->'id') or not schedule_private.valid_uuid(b->'subjectId')
      or jsonb_typeof(b->'weekday') <> 'number' or (b->>'weekday') !~ '^[1-7]$'
      or jsonb_typeof(b->'startsAt') <> 'string' or (b->>'startsAt') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or jsonb_typeof(b->'endsAt') <> 'string' or (b->>'endsAt') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or (b->>'startsAt') >= (b->>'endsAt')
      or not schedule_private.valid_text(b->'room',120,true) or not schedule_private.valid_text(b->'teacher',160,true)
      or not exists(select 1 from jsonb_array_elements(doc->'subjects') as subj(value) where (subj.value->>'id')::uuid=(b->>'subjectId')::uuid) then
      raise exception using errcode='P0422',message='Revisa el día, intervalo y datos del bloque.';
    end if;
  end loop;
  foreach field in array array['semesters','subjects','blocks'] loop
    if exists(select (x->>'id')::uuid from jsonb_array_elements(doc->field) x group by (x->>'id')::uuid having count(*)>1) then
      raise exception using errcode='P0422',message='Hay identificadores repetidos.';
    end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(doc->'blocks') as blk(value) group by (blk.value->>'subjectId')::uuid,blk.value->>'weekday',blk.value->>'startsAt',blk.value->>'endsAt' having count(*)>1) then
    raise exception using errcode='P0422',message='Ese bloque ya existe en el ramo.';
  end if;
  if jsonb_array_length(doc->'semesters') = 0 then
    if doc->'activeSemesterId' <> 'null'::jsonb then raise exception using errcode='P0422',message='No existe el semestre activo.'; end if;
  elsif not schedule_private.valid_uuid(doc->'activeSemesterId') or not exists(select 1 from jsonb_array_elements(doc->'semesters') as sem(value) where (sem.value->>'id')::uuid=(doc->>'activeSemesterId')::uuid) then
    raise exception using errcode='P0422',message='Selecciona un semestre activo.';
  end if;
exception when invalid_text_representation or datetime_field_overflow or invalid_datetime_format then
  raise exception using errcode='P0422',message='La información del horario no es válida.';
end; $function$;

ALTER TABLE "public"."alerta_bienestar" ADD CONSTRAINT "alerta_bienestar_pkey" PRIMARY KEY (id_alerta);

ALTER TABLE "public"."alerta_bienestar" ADD CONSTRAINT "alerta_consentimiento" CHECK (consentimiento_derivacion AND consentimiento_fecha IS NOT NULL AND consentimiento_version IS NOT NULL OR NOT consentimiento_derivacion AND consentimiento_fecha IS NULL AND consentimiento_version IS NULL);

ALTER TABLE "public"."aplicacion_test" ADD CONSTRAINT "aplicacion_test_id_aplicacion_estudiante_id_estudiante_key" UNIQUE (id_aplicacion, estudiante_id_estudiante);

ALTER TABLE "public"."aplicacion_test" ADD CONSTRAINT "aplicacion_test_pkey" PRIMARY KEY (id_aplicacion);

ALTER TABLE "public"."aplicacion_test" ADD CONSTRAINT "aplicacion_test_puntaje_total_check" CHECK (puntaje_total >= 0);

ALTER TABLE "public"."asignatura" ADD CONSTRAINT "asignatura_codigo_key" UNIQUE (codigo);

ALTER TABLE "public"."asignatura" ADD CONSTRAINT "asignatura_pkey" PRIMARY KEY (id_asignatura);

ALTER TABLE "public"."carrera" ADD CONSTRAINT "carrera_pkey" PRIMARY KEY (id_carrera);

ALTER TABLE "public"."carrera" ADD CONSTRAINT "carrera_sede_id_sede_nombre_carrera_key" UNIQUE (sede_id_sede, nombre_carrera);

ALTER TABLE "public"."carrera_asignatura" ADD CONSTRAINT "carrera_asignatura_carrera_id_carrera_asignatura_id_asignat_key" UNIQUE (carrera_id_carrera, asignatura_id_asignatura);

ALTER TABLE "public"."carrera_asignatura" ADD CONSTRAINT "carrera_asignatura_id_carrera_asignatura_carrera_id_carrera_key" UNIQUE (id_carrera_asignatura, carrera_id_carrera);

ALTER TABLE "public"."carrera_asignatura" ADD CONSTRAINT "carrera_asignatura_pkey" PRIMARY KEY (id_carrera_asignatura);

ALTER TABLE "public"."emocion_general" ADD CONSTRAINT "emocion_general_nombre_emocion_key" UNIQUE (nombre_emocion);

ALTER TABLE "public"."emocion_general" ADD CONSTRAINT "emocion_general_pkey" PRIMARY KEY (id_emocion);

ALTER TABLE "public"."emocion_general" ADD CONSTRAINT "emocion_general_valor_escala_check" CHECK (valor_escala >= 1 AND valor_escala <= 5);

ALTER TABLE "public"."emocion_general" ADD CONSTRAINT "emocion_general_valor_escala_key" UNIQUE (valor_escala);

ALTER TABLE "public"."estado" ADD CONSTRAINT "estado_nombre_estado_key" UNIQUE (nombre_estado);

ALTER TABLE "public"."estado" ADD CONSTRAINT "estado_pkey" PRIMARY KEY (id_estado);

ALTER TABLE "public"."estado_alerta" ADD CONSTRAINT "estado_alerta_estado_alerta_key" UNIQUE (estado_alerta);

ALTER TABLE "public"."estado_alerta" ADD CONSTRAINT "estado_alerta_pkey" PRIMARY KEY (id_estado);

ALTER TABLE "public"."estudiante" ADD CONSTRAINT "estudiante_auth_user_id_key" UNIQUE (auth_user_id);

ALTER TABLE "public"."estudiante" ADD CONSTRAINT "estudiante_pkey" PRIMARY KEY (id_estudiante);

ALTER TABLE "public"."estudiante" ADD CONSTRAINT "estudiante_rut_key" UNIQUE (rut);

ALTER TABLE "public"."estudiante" ADD CONSTRAINT "estudiante_rut_no_vacio" CHECK (length(TRIM(BOTH FROM rut)) > 0);

ALTER TABLE "public"."estudiante_asignatura" ADD CONSTRAINT "estudiante_asignatura_estudiante_carrera_id_carrera_asignat_key" UNIQUE (estudiante_carrera_id, carrera_asignatura_id);

ALTER TABLE "public"."estudiante_asignatura" ADD CONSTRAINT "estudiante_asignatura_id_estudiante_asignatura_estudiante_i_key" UNIQUE (id_estudiante_asignatura, estudiante_id_estudiante);

ALTER TABLE "public"."estudiante_asignatura" ADD CONSTRAINT "estudiante_asignatura_pkey" PRIMARY KEY (id_estudiante_asignatura);

ALTER TABLE "public"."estudiante_carrera" ADD CONSTRAINT "estudiante_carrera_fechas" CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

ALTER TABLE "public"."estudiante_carrera" ADD CONSTRAINT "estudiante_carrera_id_estudiante_carrera_estudiante_id_est_key1" UNIQUE (id_estudiante_carrera, estudiante_id_estudiante, carrera_id_carrera);

ALTER TABLE "public"."estudiante_carrera" ADD CONSTRAINT "estudiante_carrera_id_estudiante_carrera_estudiante_id_estu_key" UNIQUE (id_estudiante_carrera, estudiante_id_estudiante);

ALTER TABLE "public"."estudiante_carrera" ADD CONSTRAINT "estudiante_carrera_pkey" PRIMARY KEY (id_estudiante_carrera);

ALTER TABLE "public"."evento_academico" ADD CONSTRAINT "evento_academico_pkey" PRIMARY KEY (id_evento);

ALTER TABLE "public"."evento_institucional" ADD CONSTRAINT "evento_institucional_check" CHECK (ends_at >= starts_at);

ALTER TABLE "public"."evento_institucional" ADD CONSTRAINT "evento_institucional_check1" CHECK (status = 'draft'::text AND published_at IS NULL OR status <> 'draft'::text AND published_at IS NOT NULL);

ALTER TABLE "public"."evento_institucional" ADD CONSTRAINT "evento_institucional_description_check" CHECK (length(description) <= 5000);

ALTER TABLE "public"."evento_institucional" ADD CONSTRAINT "evento_institucional_location_check" CHECK (length(TRIM(BOTH FROM location)) >= 1 AND length(TRIM(BOTH FROM location)) <= 160);

ALTER TABLE "public"."evento_institucional" ADD CONSTRAINT "evento_institucional_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."evento_institucional" ADD CONSTRAINT "evento_institucional_revision_check" CHECK (revision > 0);

ALTER TABLE "public"."evento_institucional" ADD CONSTRAINT "evento_institucional_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'cancelled'::text]));

ALTER TABLE "public"."evento_institucional" ADD CONSTRAINT "evento_institucional_title_check" CHECK (length(TRIM(BOTH FROM title)) >= 1 AND length(TRIM(BOTH FROM title)) <= 160);

ALTER TABLE "public"."material_apoyo" ADD CONSTRAINT "material_apoyo_pkey" PRIMARY KEY (id_material);

ALTER TABLE "public"."material_apoyo" ADD CONSTRAINT "material_apoyo_publication_status_check" CHECK (publication_status = ANY (ARRAY['draft'::text, 'published'::text]));

ALTER TABLE "public"."material_apoyo" ADD CONSTRAINT "material_apoyo_revision_check" CHECK (revision > 0);

ALTER TABLE "public"."material_apoyo" ADD CONSTRAINT "tip_publication_valid" CHECK (publication_status = 'draft'::text AND published_at IS NULL AND NOT is_active OR publication_status = 'published'::text AND published_at IS NOT NULL);

ALTER TABLE "public"."material_emocion" ADD CONSTRAINT "material_emocion_material_apoyo_id_material_emocion_general_key" UNIQUE (material_apoyo_id_material, emocion_general_id_emocion);

ALTER TABLE "public"."material_emocion" ADD CONSTRAINT "material_emocion_pkey" PRIMARY KEY (id_materialemocion);

ALTER TABLE "public"."material_test" ADD CONSTRAINT "material_test_material_apoyo_id_material_test_id_test_versi_key" UNIQUE (material_apoyo_id_material, test_id, test_version, nivel_resultado);

ALTER TABLE "public"."material_test" ADD CONSTRAINT "material_test_pkey" PRIMARY KEY (id_materialtest);

ALTER TABLE "public"."opcion_respuesta" ADD CONSTRAINT "opcion_respuesta_pkey" PRIMARY KEY (id_opcion);

ALTER TABLE "public"."opcion_respuesta" ADD CONSTRAINT "opcion_respuesta_pregunta_test_id_pregunta_puntaje_key" UNIQUE (pregunta_test_id_pregunta, puntaje);

ALTER TABLE "public"."opcion_respuesta" ADD CONSTRAINT "opcion_respuesta_pregunta_test_id_pregunta_texto_opcion_key" UNIQUE (pregunta_test_id_pregunta, texto_opcion);

ALTER TABLE "public"."opcion_respuesta" ADD CONSTRAINT "opcion_respuesta_puntaje_check" CHECK (puntaje >= 0);

ALTER TABLE "public"."personal_schedule" ADD CONSTRAINT "personal_schedule_pkey" PRIMARY KEY (user_id);

ALTER TABLE "public"."personal_schedule" ADD CONSTRAINT "personal_schedule_revision_check" CHECK (revision >= 0);

ALTER TABLE "public"."pregunta_test" ADD CONSTRAINT "pregunta_test_id_pregunta_test_id_test_version_key" UNIQUE (id_pregunta, test_id, test_version);

ALTER TABLE "public"."pregunta_test" ADD CONSTRAINT "pregunta_test_orden_check" CHECK (orden > 0);

ALTER TABLE "public"."pregunta_test" ADD CONSTRAINT "pregunta_test_pkey" PRIMARY KEY (id_pregunta);

ALTER TABLE "public"."pregunta_test" ADD CONSTRAINT "pregunta_test_test_id_test_version_orden_key" UNIQUE (test_id, test_version, orden);

ALTER TABLE "public"."registro_emocional" ADD CONSTRAINT "registro_emocional_client_request_id_key" UNIQUE (client_request_id);

ALTER TABLE "public"."registro_emocional" ADD CONSTRAINT "registro_emocional_pkey" PRIMARY KEY (id_registro);

ALTER TABLE "public"."schedule_block" ADD CONSTRAINT "schedule_block_check" CHECK (starts_at < ends_at AND ends_at < '24:00:00'::time without time zone AND EXTRACT(second FROM starts_at) = 0::numeric AND EXTRACT(second FROM ends_at) = 0::numeric);

ALTER TABLE "public"."schedule_block" ADD CONSTRAINT "schedule_block_pkey" PRIMARY KEY (id, user_id);

ALTER TABLE "public"."schedule_block" ADD CONSTRAINT "schedule_block_room_check" CHECK (room IS NULL OR length(room) >= 1 AND length(room) <= 120 AND room = btrim(room) AND room !~ '[[:cntrl:]]'::text);

ALTER TABLE "public"."schedule_block" ADD CONSTRAINT "schedule_block_teacher_check" CHECK (teacher IS NULL OR length(teacher) >= 1 AND length(teacher) <= 160 AND teacher = btrim(teacher) AND teacher !~ '[[:cntrl:]]'::text);

ALTER TABLE "public"."schedule_block" ADD CONSTRAINT "schedule_block_user_id_subject_id_weekday_starts_at_ends_at_key" UNIQUE (user_id, subject_id, weekday, starts_at, ends_at);

ALTER TABLE "public"."schedule_block" ADD CONSTRAINT "schedule_block_weekday_check" CHECK (weekday >= 1 AND weekday <= 7);

ALTER TABLE "public"."schedule_semester" ADD CONSTRAINT "schedule_semester_check" CHECK (starts_on IS NULL OR ends_on IS NULL OR starts_on <= ends_on);

ALTER TABLE "public"."schedule_semester" ADD CONSTRAINT "schedule_semester_name_check" CHECK (length(name) >= 1 AND length(name) <= 80 AND name = btrim(name) AND name !~ '[[:cntrl:]]'::text);

ALTER TABLE "public"."schedule_semester" ADD CONSTRAINT "schedule_semester_pkey" PRIMARY KEY (id, user_id);

ALTER TABLE "public"."schedule_subject" ADD CONSTRAINT "schedule_subject_code_check" CHECK (code IS NULL OR length(code) >= 1 AND length(code) <= 40 AND code = btrim(code) AND code !~ '[[:cntrl:]]'::text);

ALTER TABLE "public"."schedule_subject" ADD CONSTRAINT "schedule_subject_name_check" CHECK (length(name) >= 1 AND length(name) <= 120 AND name = btrim(name) AND name !~ '[[:cntrl:]]'::text);

ALTER TABLE "public"."schedule_subject" ADD CONSTRAINT "schedule_subject_pkey" PRIMARY KEY (id, user_id);

ALTER TABLE "public"."schedule_subject" ADD CONSTRAINT "schedule_subject_section_check" CHECK (section IS NULL OR length(section) >= 1 AND length(section) <= 40 AND section = btrim(section) AND section !~ '[[:cntrl:]]'::text);

ALTER TABLE "public"."sede" ADD CONSTRAINT "sede_nombre_sede_key" UNIQUE (nombre_sede);

ALTER TABLE "public"."sede" ADD CONSTRAINT "sede_pkey" PRIMARY KEY (id_sede);

ALTER TABLE "public"."test_bienestar" ADD CONSTRAINT "test_bienestar_id_test_version_key" UNIQUE (id_test, version);

ALTER TABLE "public"."test_bienestar" ADD CONSTRAINT "test_bienestar_nombre_test_version_key" UNIQUE (nombre_test, version);

ALTER TABLE "public"."test_bienestar" ADD CONSTRAINT "test_bienestar_pkey" PRIMARY KEY (id_test);

ALTER TABLE "public"."test_bienestar" ADD CONSTRAINT "test_bienestar_publication_status_check" CHECK (publication_status = ANY (ARRAY['draft'::text, 'published'::text]));

ALTER TABLE "public"."test_bienestar" ADD CONSTRAINT "test_bienestar_revision_check" CHECK (revision > 0);

ALTER TABLE "public"."test_bienestar" ADD CONSTRAINT "test_bienestar_version_check" CHECK (version > 0);

ALTER TABLE "public"."test_bienestar" ADD CONSTRAINT "test_rango_puntaje" CHECK (puntaje_minimo >= 0 AND puntaje_maximo >= puntaje_minimo);

ALTER TABLE "public"."test_catalogo" ADD CONSTRAINT "test_catalogo_code_key" UNIQUE (code);

ALTER TABLE "public"."test_catalogo" ADD CONSTRAINT "test_catalogo_kind_check" CHECK (kind = ANY (ARRAY['protected'::text, 'custom'::text]));

ALTER TABLE "public"."test_catalogo" ADD CONSTRAINT "test_catalogo_pkey" PRIMARY KEY (catalog_id);

ALTER TABLE "public"."test_resultado_nivel" ADD CONSTRAINT "resultado_rango" CHECK (puntaje_minimo >= 0 AND puntaje_maximo >= puntaje_minimo);

ALTER TABLE "public"."test_resultado_nivel" ADD CONSTRAINT "test_resultado_nivel_pkey" PRIMARY KEY (test_id, test_version, nivel_resultado);

ALTER TABLE "public"."tipo_alerta" ADD CONSTRAINT "tipo_alerta_pkey" PRIMARY KEY (id_tipoalerta);

ALTER TABLE "public"."tipo_alerta" ADD CONSTRAINT "tipo_alerta_tipo_alerta_key" UNIQUE (tipo_alerta);

ALTER TABLE "public"."tipo_evento" ADD CONSTRAINT "tipo_evento_nombre_evento_key" UNIQUE (nombre_evento);

ALTER TABLE "public"."tipo_evento" ADD CONSTRAINT "tipo_evento_pkey" PRIMARY KEY (id_tipo_evento);

ALTER TABLE "public"."tipo_evento_institucional" ADD CONSTRAINT "event_type_name_trimmed" CHECK (nombre = btrim(nombre));

ALTER TABLE "public"."tipo_evento_institucional" ADD CONSTRAINT "event_type_order_valid" CHECK (orden >= 0 AND orden <= 32767);

ALTER TABLE "public"."tipo_evento_institucional" ADD CONSTRAINT "tipo_evento_institucional_code_check" CHECK (code ~ '^[a-z][a-z0-9_]{1,31}$'::text);

ALTER TABLE "public"."tipo_evento_institucional" ADD CONSTRAINT "tipo_evento_institucional_code_key" UNIQUE (code);

ALTER TABLE "public"."tipo_evento_institucional" ADD CONSTRAINT "tipo_evento_institucional_nombre_check" CHECK (length(TRIM(BOTH FROM nombre)) >= 1 AND length(TRIM(BOTH FROM nombre)) <= 40);

ALTER TABLE "public"."tipo_evento_institucional" ADD CONSTRAINT "tipo_evento_institucional_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."tipo_evento_institucional" ADD CONSTRAINT "tipo_evento_institucional_revision_check" CHECK (revision > 0);

ALTER TABLE "private"."admin_requests" ADD CONSTRAINT "admin_requests_check" CHECK (expires_at = (created_at + '24:00:00'::interval));

ALTER TABLE "private"."admin_requests" ADD CONSTRAINT "admin_requests_pkey" PRIMARY KEY (request_id);

ALTER TABLE "private"."admin_requests" ADD CONSTRAINT "admin_requests_status_check" CHECK (status = ANY (ARRAY['completed'::text, 'reserved'::text, 'accepted'::text, 'uncertain'::text]));

ALTER TABLE "private"."admin_staff" ADD CONSTRAINT "admin_staff_pkey" PRIMARY KEY (auth_user_id);

ALTER TABLE "private"."password_reset_limits" ADD CONSTRAINT "password_reset_limits_check" CHECK (expires_at = (created_at + '24:00:00'::interval));

ALTER TABLE "private"."password_reset_limits" ADD CONSTRAINT "password_reset_limits_pkey" PRIMARY KEY (id);

ALTER TABLE "schedule_private"."schedule_request" ADD CONSTRAINT "schedule_request_pkey" PRIMARY KEY (user_id, request_id);

ALTER TABLE "schedule_private"."schedule_request" ADD CONSTRAINT "schedule_request_revision_check" CHECK (revision > 0);

ALTER TABLE "public"."alerta_bienestar" ADD CONSTRAINT "alerta_aplicacion_fk" FOREIGN KEY (aplicacion_test_id_aplicacion, estudiante_id_estudiante) REFERENCES aplicacion_test(id_aplicacion, estudiante_id_estudiante);

ALTER TABLE "public"."alerta_bienestar" ADD CONSTRAINT "alerta_bienestar_estado_alerta_id_estado_fkey" FOREIGN KEY (estado_alerta_id_estado) REFERENCES estado_alerta(id_estado);

ALTER TABLE "public"."alerta_bienestar" ADD CONSTRAINT "alerta_bienestar_estudiante_id_estudiante_fkey" FOREIGN KEY (estudiante_id_estudiante) REFERENCES estudiante(id_estudiante);

ALTER TABLE "public"."alerta_bienestar" ADD CONSTRAINT "alerta_bienestar_tipo_alerta_id_tipoalerta_fkey" FOREIGN KEY (tipo_alerta_id_tipoalerta) REFERENCES tipo_alerta(id_tipoalerta);

ALTER TABLE "public"."alerta_bienestar" ADD CONSTRAINT "alerta_carrera_fk" FOREIGN KEY (estudiante_carrera_id, estudiante_id_estudiante) REFERENCES estudiante_carrera(id_estudiante_carrera, estudiante_id_estudiante);

ALTER TABLE "public"."aplicacion_test" ADD CONSTRAINT "aplicacion_carrera_fk" FOREIGN KEY (estudiante_carrera_id, estudiante_id_estudiante) REFERENCES estudiante_carrera(id_estudiante_carrera, estudiante_id_estudiante);

ALTER TABLE "public"."aplicacion_test" ADD CONSTRAINT "aplicacion_nivel_fk" FOREIGN KEY (test_id, test_version, nivel_resultado) REFERENCES test_resultado_nivel(test_id, test_version, nivel_resultado);

ALTER TABLE "public"."aplicacion_test" ADD CONSTRAINT "aplicacion_test_estudiante_id_estudiante_fkey" FOREIGN KEY (estudiante_id_estudiante) REFERENCES estudiante(id_estudiante);

ALTER TABLE "public"."aplicacion_test" ADD CONSTRAINT "aplicacion_test_fk" FOREIGN KEY (test_id, test_version) REFERENCES test_bienestar(id_test, version);

ALTER TABLE "public"."carrera" ADD CONSTRAINT "carrera_sede_id_sede_fkey" FOREIGN KEY (sede_id_sede) REFERENCES sede(id_sede);

ALTER TABLE "public"."carrera_asignatura" ADD CONSTRAINT "carrera_asignatura_asignatura_id_asignatura_fkey" FOREIGN KEY (asignatura_id_asignatura) REFERENCES asignatura(id_asignatura);

ALTER TABLE "public"."carrera_asignatura" ADD CONSTRAINT "carrera_asignatura_carrera_id_carrera_fkey" FOREIGN KEY (carrera_id_carrera) REFERENCES carrera(id_carrera);

ALTER TABLE "public"."estudiante" ADD CONSTRAINT "estudiante_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."estudiante_asignatura" ADD CONSTRAINT "ea_asignatura_fk" FOREIGN KEY (carrera_asignatura_id, carrera_id_carrera) REFERENCES carrera_asignatura(id_carrera_asignatura, carrera_id_carrera);

ALTER TABLE "public"."estudiante_asignatura" ADD CONSTRAINT "ea_carrera_fk" FOREIGN KEY (estudiante_carrera_id, estudiante_id_estudiante, carrera_id_carrera) REFERENCES estudiante_carrera(id_estudiante_carrera, estudiante_id_estudiante, carrera_id_carrera);

ALTER TABLE "public"."estudiante_carrera" ADD CONSTRAINT "estudiante_carrera_carrera_id_carrera_fkey" FOREIGN KEY (carrera_id_carrera) REFERENCES carrera(id_carrera);

ALTER TABLE "public"."estudiante_carrera" ADD CONSTRAINT "estudiante_carrera_estudiante_id_estudiante_fkey" FOREIGN KEY (estudiante_id_estudiante) REFERENCES estudiante(id_estudiante);

ALTER TABLE "public"."evento_academico" ADD CONSTRAINT "evento_academico_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES estado(id_estado);

ALTER TABLE "public"."evento_academico" ADD CONSTRAINT "evento_academico_tipo_evento_id_fkey" FOREIGN KEY (tipo_evento_id) REFERENCES tipo_evento(id_tipo_evento);

ALTER TABLE "public"."evento_academico" ADD CONSTRAINT "evento_inscripcion_fk" FOREIGN KEY (estudiante_asignatura_id, estudiante_id_estudiante) REFERENCES estudiante_asignatura(id_estudiante_asignatura, estudiante_id_estudiante);

ALTER TABLE "public"."evento_institucional" ADD CONSTRAINT "evento_institucional_tipo_id_fkey" FOREIGN KEY (tipo_id) REFERENCES tipo_evento_institucional(id);

ALTER TABLE "public"."material_emocion" ADD CONSTRAINT "material_emocion_emocion_general_id_emocion_fkey" FOREIGN KEY (emocion_general_id_emocion) REFERENCES emocion_general(id_emocion);

ALTER TABLE "public"."material_emocion" ADD CONSTRAINT "material_emocion_material_apoyo_id_material_fkey" FOREIGN KEY (material_apoyo_id_material) REFERENCES material_apoyo(id_material);

ALTER TABLE "public"."material_test" ADD CONSTRAINT "material_test_material_apoyo_id_material_fkey" FOREIGN KEY (material_apoyo_id_material) REFERENCES material_apoyo(id_material);

ALTER TABLE "public"."material_test" ADD CONSTRAINT "material_test_nivel_fk" FOREIGN KEY (test_id, test_version, nivel_resultado) REFERENCES test_resultado_nivel(test_id, test_version, nivel_resultado);

ALTER TABLE "public"."opcion_respuesta" ADD CONSTRAINT "opcion_respuesta_pregunta_test_id_pregunta_fkey" FOREIGN KEY (pregunta_test_id_pregunta) REFERENCES pregunta_test(id_pregunta);

ALTER TABLE "public"."personal_schedule" ADD CONSTRAINT "personal_schedule_active_fk" FOREIGN KEY (active_semester_id, user_id) REFERENCES schedule_semester(id, user_id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "public"."personal_schedule" ADD CONSTRAINT "personal_schedule_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."pregunta_test" ADD CONSTRAINT "pregunta_test_fk" FOREIGN KEY (test_id, test_version) REFERENCES test_bienestar(id_test, version);

ALTER TABLE "public"."registro_emocional" ADD CONSTRAINT "registro_carrera_fk" FOREIGN KEY (estudiante_carrera_id, estudiante_id_estudiante) REFERENCES estudiante_carrera(id_estudiante_carrera, estudiante_id_estudiante);

ALTER TABLE "public"."registro_emocional" ADD CONSTRAINT "registro_emocional_emocion_general_id_emocion_fkey" FOREIGN KEY (emocion_general_id_emocion) REFERENCES emocion_general(id_emocion);

ALTER TABLE "public"."registro_emocional" ADD CONSTRAINT "registro_emocional_estudiante_id_estudiante_fkey" FOREIGN KEY (estudiante_id_estudiante) REFERENCES estudiante(id_estudiante);

ALTER TABLE "public"."schedule_block" ADD CONSTRAINT "schedule_block_subject_id_user_id_fkey" FOREIGN KEY (subject_id, user_id) REFERENCES schedule_subject(id, user_id) ON DELETE CASCADE;

ALTER TABLE "public"."schedule_semester" ADD CONSTRAINT "schedule_semester_user_id_fkey" FOREIGN KEY (user_id) REFERENCES personal_schedule(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."schedule_subject" ADD CONSTRAINT "schedule_subject_semester_id_user_id_fkey" FOREIGN KEY (semester_id, user_id) REFERENCES schedule_semester(id, user_id) ON DELETE CASCADE;

ALTER TABLE "public"."test_bienestar" ADD CONSTRAINT "test_bienestar_catalog_id_fkey" FOREIGN KEY (catalog_id) REFERENCES test_catalogo(catalog_id);

ALTER TABLE "public"."test_catalogo" ADD CONSTRAINT "active_version_fk" FOREIGN KEY (active_version_id) REFERENCES test_bienestar(id_test) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "public"."test_resultado_nivel" ADD CONSTRAINT "resultado_test_fk" FOREIGN KEY (test_id, test_version) REFERENCES test_bienestar(id_test, version);

ALTER TABLE "private"."admin_requests" ADD CONSTRAINT "admin_requests_actor_fkey" FOREIGN KEY (actor) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "private"."admin_staff" ADD CONSTRAINT "admin_staff_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "private"."password_reset_limits" ADD CONSTRAINT "password_reset_limits_actor_fkey" FOREIGN KEY (actor) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "private"."password_reset_limits" ADD CONSTRAINT "password_reset_limits_student_id_fkey" FOREIGN KEY (student_id) REFERENCES estudiante(id_estudiante) ON DELETE CASCADE;

ALTER TABLE "schedule_private"."schedule_request" ADD CONSTRAINT "schedule_request_user_id_fkey" FOREIGN KEY (user_id) REFERENCES personal_schedule(user_id) ON DELETE CASCADE;

CREATE INDEX alerta_aplicacion_estudiante_idx ON public.alerta_bienestar USING btree (aplicacion_test_id_aplicacion, estudiante_id_estudiante);

CREATE INDEX alerta_bienestar_estudiante_fecha_idx ON public.alerta_bienestar USING btree (estudiante_id_estudiante, fecha_hora DESC);

CREATE INDEX alerta_carrera_idx ON public.alerta_bienestar USING btree (estudiante_carrera_id, estudiante_id_estudiante);

CREATE INDEX alerta_estado_idx ON public.alerta_bienestar USING btree (estado_alerta_id_estado);

CREATE INDEX alerta_tipo_idx ON public.alerta_bienestar USING btree (tipo_alerta_id_tipoalerta);

CREATE INDEX aplicacion_carrera_idx ON public.aplicacion_test USING btree (estudiante_carrera_id, estudiante_id_estudiante);

CREATE INDEX aplicacion_nivel_idx ON public.aplicacion_test USING btree (test_id, test_version, nivel_resultado);

CREATE INDEX aplicacion_test_estudiante_fecha_idx ON public.aplicacion_test USING btree (estudiante_id_estudiante, fecha_hora DESC);

CREATE INDEX aplicacion_test_version_idx ON public.aplicacion_test USING btree (test_id, test_version);

CREATE INDEX carrera_asignatura_asignatura_idx ON public.carrera_asignatura USING btree (asignatura_id_asignatura);

CREATE INDEX estudiante_asignatura_carrera_idx ON public.estudiante_asignatura USING btree (carrera_asignatura_id, carrera_id_carrera);

CREATE INDEX estudiante_asignatura_historial_idx ON public.estudiante_asignatura USING btree (estudiante_carrera_id, estudiante_id_estudiante, carrera_id_carrera);

CREATE UNIQUE INDEX estudiante_carrera_actual_unica ON public.estudiante_carrera USING btree (estudiante_id_estudiante) WHERE (fecha_fin IS NULL);

CREATE INDEX estudiante_carrera_carrera_idx ON public.estudiante_carrera USING btree (carrera_id_carrera);

CREATE INDEX evento_academico_inscripcion_idx ON public.evento_academico USING btree (estudiante_asignatura_id);

CREATE INDEX evento_estado_idx ON public.evento_academico USING btree (estado_id);

CREATE INDEX evento_inscripcion_estudiante_idx ON public.evento_academico USING btree (estudiante_asignatura_id, estudiante_id_estudiante);

CREATE INDEX evento_tipo_idx ON public.evento_academico USING btree (tipo_evento_id);

CREATE INDEX institutional_events_start_idx ON public.evento_institucional USING btree (starts_at, id);

CREATE INDEX institutional_events_type_idx ON public.evento_institucional USING btree (tipo_id);

CREATE INDEX material_emocion_emocion_idx ON public.material_emocion USING btree (emocion_general_id_emocion);

CREATE INDEX material_test_nivel_idx ON public.material_test USING btree (test_id, test_version, nivel_resultado);

CREATE INDEX registro_carrera_idx ON public.registro_emocional USING btree (estudiante_carrera_id, estudiante_id_estudiante);

CREATE INDEX registro_emocion_general_idx ON public.registro_emocional USING btree (emocion_general_id_emocion);

CREATE INDEX registro_emocional_estudiante_fecha_idx ON public.registro_emocional USING btree (estudiante_id_estudiante, fecha_hora DESC);

CREATE INDEX schedule_block_parent ON public.schedule_block USING btree (user_id, subject_id);

CREATE INDEX schedule_semester_owner ON public.schedule_semester USING btree (user_id);

CREATE INDEX schedule_subject_parent ON public.schedule_subject USING btree (user_id, semester_id);

CREATE UNIQUE INDEX test_catalog_version_unique ON public.test_bienestar USING btree (catalog_id, version);

CREATE UNIQUE INDEX test_one_active_catalog ON public.test_bienestar USING btree (catalog_id) WHERE is_active;

CREATE INDEX admin_requests_expiry_idx ON private.admin_requests USING btree (expires_at);

CREATE INDEX reset_limits_actor_time_idx ON private.password_reset_limits USING btree (actor, created_at);

CREATE INDEX reset_limits_student_time_idx ON private.password_reset_limits USING btree (student_id, created_at);

CREATE INDEX reset_limits_expiry_idx ON private.password_reset_limits USING btree (expires_at);

CREATE TRIGGER tip_result_published BEFORE INSERT OR UPDATE ON material_test FOR EACH ROW EXECUTE FUNCTION private.check_tip_rule();

CREATE TRIGGER event_transition BEFORE UPDATE ON evento_institucional FOR EACH ROW EXECUTE FUNCTION private.check_event_transition();

CREATE TRIGGER event_type_code_immutable BEFORE UPDATE ON tipo_evento_institucional FOR EACH ROW EXECUTE FUNCTION private.check_event_type_code();

CREATE TRIGGER aplicacion_test_validar_puntaje BEFORE INSERT OR UPDATE OF puntaje_total, test_id, test_version, nivel_resultado ON aplicacion_test FOR EACH ROW EXECUTE FUNCTION validar_puntaje_aplicacion_test();

CREATE TRIGGER freeze_test BEFORE INSERT OR DELETE OR UPDATE ON test_bienestar FOR EACH ROW EXECUTE FUNCTION private.check_test_version();

CREATE TRIGGER freeze_questions BEFORE INSERT OR DELETE OR UPDATE ON pregunta_test FOR EACH ROW EXECUTE FUNCTION private.check_test_parent();

CREATE TRIGGER freeze_options BEFORE INSERT OR DELETE OR UPDATE ON opcion_respuesta FOR EACH ROW EXECUTE FUNCTION private.check_test_parent();

CREATE TRIGGER freeze_catalog BEFORE UPDATE ON test_catalogo FOR EACH ROW EXECUTE FUNCTION private.freeze_catalog_identity();

CREATE TRIGGER freeze_levels BEFORE INSERT OR DELETE OR UPDATE ON test_resultado_nivel FOR EACH ROW EXECUTE FUNCTION private.check_test_parent();

CREATE TRIGGER event_registration BEFORE INSERT OR UPDATE ON evento_institucional FOR EACH ROW EXECUTE FUNCTION private.check_event_registration();

ALTER TABLE "public"."alerta_bienestar" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."aplicacion_test" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."asignatura" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."carrera" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."carrera_asignatura" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."emocion_general" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."estado" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."estado_alerta" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."estudiante" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."estudiante_asignatura" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."estudiante_carrera" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."evento_academico" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."evento_institucional" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."material_apoyo" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."material_emocion" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."material_test" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."opcion_respuesta" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."personal_schedule" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pregunta_test" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."registro_emocional" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."schedule_block" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."schedule_semester" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."schedule_subject" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."sede" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."test_bienestar" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."test_catalogo" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."test_resultado_nivel" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tipo_alerta" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tipo_evento" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tipo_evento_institucional" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."admin_requests" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."admin_staff" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."password_reset_limits" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "schedule_private"."schedule_request" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own referrals" ON "public"."alerta_bienestar" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = alerta_bienestar.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "student requests referral with consent" ON "public"."alerta_bienestar" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((consentimiento_derivacion AND (consentimiento_fecha IS NOT NULL) AND (consentimiento_version IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = alerta_bienestar.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "student creates own test applications" ON "public"."aplicacion_test" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = aplicacion_test.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "student reads own test applications" ON "public"."aplicacion_test" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = aplicacion_test.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "public catalogs are readable" ON "public"."asignatura" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "public catalogs are readable" ON "public"."carrera" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "public catalogs are readable" ON "public"."carrera_asignatura" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "public catalogs are readable" ON "public"."emocion_general" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "public catalogs are readable" ON "public"."estado" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "public catalogs are readable" ON "public"."estado_alerta" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "student reads own profile" ON "public"."estudiante" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((auth_user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "student registers own profile" ON "public"."estudiante" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((auth_user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "student enrolls in own current career course" ON "public"."estudiante_asignatura" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = estudiante_asignatura.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM estudiante_carrera ec
  WHERE ((ec.id_estudiante_carrera = estudiante_asignatura.estudiante_carrera_id) AND (ec.estudiante_id_estudiante = ec.estudiante_id_estudiante) AND (ec.carrera_id_carrera = ec.carrera_id_carrera) AND (ec.fecha_fin IS NULL))))));

CREATE POLICY "student reads own course enrollments" ON "public"."estudiante_asignatura" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = estudiante_asignatura.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "student reads own career history" ON "public"."estudiante_carrera" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = estudiante_carrera.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "student creates own academic events" ON "public"."evento_academico" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = evento_academico.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "student reads own academic events" ON "public"."evento_academico" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = evento_academico.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "event_published" ON "public"."evento_institucional" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((published_at IS NOT NULL));

CREATE POLICY "tip_published" ON "public"."material_apoyo" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (((publication_status = 'published'::text) AND is_active));

CREATE POLICY "tip_mood_published" ON "public"."material_emocion" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM material_apoyo m
  WHERE ((m.id_material = material_emocion.material_apoyo_id_material) AND (m.publication_status = 'published'::text) AND m.is_active))));

CREATE POLICY "tip_result_published" ON "public"."material_test" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM (material_apoyo m
     JOIN test_bienestar t ON ((t.id_test = material_test.test_id)))
  WHERE ((m.id_material = material_test.material_apoyo_id_material) AND (m.publication_status = 'published'::text) AND m.is_active AND (t.publication_status = 'published'::text)))));

CREATE POLICY "option_published" ON "public"."opcion_respuesta" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM (pregunta_test p
     JOIN test_bienestar t ON ((t.id_test = p.test_id)))
  WHERE ((p.id_pregunta = opcion_respuesta.pregunta_test_id_pregunta) AND (t.publication_status = 'published'::text)))));

CREATE POLICY "owner reads schedule" ON "public"."personal_schedule" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "question_published" ON "public"."pregunta_test" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM test_bienestar t
  WHERE ((t.id_test = pregunta_test.test_id) AND (t.publication_status = 'published'::text)))));

CREATE POLICY "student creates own emotional records" ON "public"."registro_emocional" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = registro_emocional.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "student deletes own emotional records" ON "public"."registro_emocional" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = registro_emocional.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "student reads own emotional records" ON "public"."registro_emocional" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM estudiante e
  WHERE ((e.id_estudiante = registro_emocional.estudiante_id_estudiante) AND (e.auth_user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "owner reads weekly blocks" ON "public"."schedule_block" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "owner reads semesters" ON "public"."schedule_semester" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "owner reads personal subjects" ON "public"."schedule_subject" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "public catalogs are readable" ON "public"."sede" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "version_published" ON "public"."test_bienestar" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((publication_status = 'published'::text));

CREATE POLICY "catalog_published" ON "public"."test_catalogo" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM test_bienestar t
  WHERE ((t.catalog_id = test_catalogo.catalog_id) AND (t.publication_status = 'published'::text)))));

CREATE POLICY "level_published" ON "public"."test_resultado_nivel" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((EXISTS ( SELECT 1
   FROM test_bienestar t
  WHERE ((t.id_test = test_resultado_nivel.test_id) AND (t.publication_status = 'published'::text)))));

CREATE POLICY "public catalogs are readable" ON "public"."tipo_alerta" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "public catalogs are readable" ON "public"."tipo_evento" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "event_type_read" ON "public"."tipo_evento_institucional" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

REVOKE ALL ON SCHEMA "public" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON SCHEMA "private" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL TABLES IN SCHEMA "private" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA "private" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "private" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON SCHEMA "schedule_private" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL TABLES IN SCHEMA "schedule_private" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA "schedule_private" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "schedule_private" FROM PUBLIC, anon, authenticated, service_role;

GRANT USAGE ON SCHEMA "public" TO "pg_database_owner";

GRANT CREATE ON SCHEMA "public" TO "pg_database_owner";

GRANT USAGE ON SCHEMA "public" TO PUBLIC;

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT USAGE ON SCHEMA "private" TO "postgres";

GRANT CREATE ON SCHEMA "private" TO "postgres";

GRANT USAGE ON SCHEMA "private" TO "service_role";

GRANT USAGE ON SCHEMA "schedule_private" TO "postgres";

GRANT CREATE ON SCHEMA "schedule_private" TO "postgres";

GRANT USAGE ON SCHEMA "schedule_private" TO "authenticated";

GRANT INSERT ON TABLE "public"."personal_schedule" TO "postgres";

GRANT SELECT ON TABLE "public"."personal_schedule" TO "postgres";

GRANT UPDATE ON TABLE "public"."personal_schedule" TO "postgres";

GRANT DELETE ON TABLE "public"."personal_schedule" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."personal_schedule" TO "postgres";

GRANT REFERENCES ON TABLE "public"."personal_schedule" TO "postgres";

GRANT TRIGGER ON TABLE "public"."personal_schedule" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."personal_schedule" TO "postgres";

GRANT INSERT ON TABLE "public"."personal_schedule" TO "service_role";

GRANT SELECT ON TABLE "public"."personal_schedule" TO "service_role";

GRANT UPDATE ON TABLE "public"."personal_schedule" TO "service_role";

GRANT DELETE ON TABLE "public"."personal_schedule" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."personal_schedule" TO "service_role";

GRANT REFERENCES ON TABLE "public"."personal_schedule" TO "service_role";

GRANT TRIGGER ON TABLE "public"."personal_schedule" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."personal_schedule" TO "service_role";

GRANT SELECT ON TABLE "public"."personal_schedule" TO "authenticated";

GRANT INSERT ON TABLE "public"."schedule_semester" TO "postgres";

GRANT SELECT ON TABLE "public"."schedule_semester" TO "postgres";

GRANT UPDATE ON TABLE "public"."schedule_semester" TO "postgres";

GRANT DELETE ON TABLE "public"."schedule_semester" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."schedule_semester" TO "postgres";

GRANT REFERENCES ON TABLE "public"."schedule_semester" TO "postgres";

GRANT TRIGGER ON TABLE "public"."schedule_semester" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."schedule_semester" TO "postgres";

GRANT INSERT ON TABLE "public"."schedule_semester" TO "service_role";

GRANT SELECT ON TABLE "public"."schedule_semester" TO "service_role";

GRANT UPDATE ON TABLE "public"."schedule_semester" TO "service_role";

GRANT DELETE ON TABLE "public"."schedule_semester" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."schedule_semester" TO "service_role";

GRANT REFERENCES ON TABLE "public"."schedule_semester" TO "service_role";

GRANT TRIGGER ON TABLE "public"."schedule_semester" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."schedule_semester" TO "service_role";

GRANT SELECT ON TABLE "public"."schedule_semester" TO "authenticated";

GRANT INSERT ON TABLE "public"."schedule_subject" TO "postgres";

GRANT SELECT ON TABLE "public"."schedule_subject" TO "postgres";

GRANT UPDATE ON TABLE "public"."schedule_subject" TO "postgres";

GRANT DELETE ON TABLE "public"."schedule_subject" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."schedule_subject" TO "postgres";

GRANT REFERENCES ON TABLE "public"."schedule_subject" TO "postgres";

GRANT TRIGGER ON TABLE "public"."schedule_subject" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."schedule_subject" TO "postgres";

GRANT INSERT ON TABLE "public"."schedule_subject" TO "service_role";

GRANT SELECT ON TABLE "public"."schedule_subject" TO "service_role";

GRANT UPDATE ON TABLE "public"."schedule_subject" TO "service_role";

GRANT DELETE ON TABLE "public"."schedule_subject" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."schedule_subject" TO "service_role";

GRANT REFERENCES ON TABLE "public"."schedule_subject" TO "service_role";

GRANT TRIGGER ON TABLE "public"."schedule_subject" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."schedule_subject" TO "service_role";

GRANT SELECT ON TABLE "public"."schedule_subject" TO "authenticated";

GRANT INSERT ON TABLE "public"."schedule_block" TO "postgres";

GRANT SELECT ON TABLE "public"."schedule_block" TO "postgres";

GRANT UPDATE ON TABLE "public"."schedule_block" TO "postgres";

GRANT DELETE ON TABLE "public"."schedule_block" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."schedule_block" TO "postgres";

GRANT REFERENCES ON TABLE "public"."schedule_block" TO "postgres";

GRANT TRIGGER ON TABLE "public"."schedule_block" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."schedule_block" TO "postgres";

GRANT INSERT ON TABLE "public"."schedule_block" TO "service_role";

GRANT SELECT ON TABLE "public"."schedule_block" TO "service_role";

GRANT UPDATE ON TABLE "public"."schedule_block" TO "service_role";

GRANT DELETE ON TABLE "public"."schedule_block" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."schedule_block" TO "service_role";

GRANT REFERENCES ON TABLE "public"."schedule_block" TO "service_role";

GRANT TRIGGER ON TABLE "public"."schedule_block" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."schedule_block" TO "service_role";

GRANT SELECT ON TABLE "public"."schedule_block" TO "authenticated";

GRANT INSERT ON TABLE "schedule_private"."schedule_request" TO "postgres";

GRANT SELECT ON TABLE "schedule_private"."schedule_request" TO "postgres";

GRANT UPDATE ON TABLE "schedule_private"."schedule_request" TO "postgres";

GRANT DELETE ON TABLE "schedule_private"."schedule_request" TO "postgres";

GRANT TRUNCATE ON TABLE "schedule_private"."schedule_request" TO "postgres";

GRANT REFERENCES ON TABLE "schedule_private"."schedule_request" TO "postgres";

GRANT TRIGGER ON TABLE "schedule_private"."schedule_request" TO "postgres";

GRANT MAINTAIN ON TABLE "schedule_private"."schedule_request" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."registro_emocional_id_registro_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."registro_emocional_id_registro_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."registro_emocional_id_registro_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."registro_emocional_id_registro_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."registro_emocional_id_registro_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."registro_emocional_id_registro_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."sede_id_sede_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."sede_id_sede_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."sede_id_sede_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."sede_id_sede_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."sede_id_sede_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."sede_id_sede_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."carrera_id_carrera_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."carrera_id_carrera_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."carrera_id_carrera_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."carrera_id_carrera_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."carrera_id_carrera_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."carrera_id_carrera_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."asignatura_id_asignatura_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."asignatura_id_asignatura_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."asignatura_id_asignatura_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."asignatura_id_asignatura_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."asignatura_id_asignatura_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."asignatura_id_asignatura_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."carrera_asignatura_id_carrera_asignatura_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."carrera_asignatura_id_carrera_asignatura_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."carrera_asignatura_id_carrera_asignatura_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."carrera_asignatura_id_carrera_asignatura_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."carrera_asignatura_id_carrera_asignatura_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."carrera_asignatura_id_carrera_asignatura_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."estudiante_id_estudiante_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."estudiante_id_estudiante_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."estudiante_id_estudiante_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."estudiante_id_estudiante_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."estudiante_id_estudiante_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."estudiante_id_estudiante_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."estudiante_carrera_id_estudiante_carrera_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."estudiante_carrera_id_estudiante_carrera_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."estudiante_carrera_id_estudiante_carrera_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."estudiante_carrera_id_estudiante_carrera_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."estudiante_carrera_id_estudiante_carrera_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."estudiante_carrera_id_estudiante_carrera_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."estudiante_asignatura_id_estudiante_asignatura_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."estudiante_asignatura_id_estudiante_asignatura_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."estudiante_asignatura_id_estudiante_asignatura_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."estudiante_asignatura_id_estudiante_asignatura_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."estudiante_asignatura_id_estudiante_asignatura_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."estudiante_asignatura_id_estudiante_asignatura_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."estado_id_estado_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."estado_id_estado_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."estado_id_estado_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."estado_id_estado_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."estado_id_estado_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."estado_id_estado_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."tipo_evento_id_tipo_evento_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."tipo_evento_id_tipo_evento_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."tipo_evento_id_tipo_evento_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."tipo_evento_id_tipo_evento_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."tipo_evento_id_tipo_evento_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."tipo_evento_id_tipo_evento_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."evento_academico_id_evento_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."evento_academico_id_evento_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."evento_academico_id_evento_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."evento_academico_id_evento_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."evento_academico_id_evento_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."evento_academico_id_evento_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."emocion_general_id_emocion_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."emocion_general_id_emocion_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."emocion_general_id_emocion_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."emocion_general_id_emocion_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."emocion_general_id_emocion_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."emocion_general_id_emocion_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."aplicacion_test_id_aplicacion_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."aplicacion_test_id_aplicacion_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."aplicacion_test_id_aplicacion_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."aplicacion_test_id_aplicacion_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."aplicacion_test_id_aplicacion_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."aplicacion_test_id_aplicacion_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."tipo_alerta_id_tipoalerta_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."tipo_alerta_id_tipoalerta_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."tipo_alerta_id_tipoalerta_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."tipo_alerta_id_tipoalerta_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."tipo_alerta_id_tipoalerta_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."tipo_alerta_id_tipoalerta_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."estado_alerta_id_estado_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."estado_alerta_id_estado_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."estado_alerta_id_estado_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."estado_alerta_id_estado_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."estado_alerta_id_estado_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."estado_alerta_id_estado_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."alerta_bienestar_id_alerta_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."alerta_bienestar_id_alerta_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."alerta_bienestar_id_alerta_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."alerta_bienestar_id_alerta_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."alerta_bienestar_id_alerta_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."alerta_bienestar_id_alerta_seq" TO "service_role";

GRANT INSERT ON TABLE "public"."asignatura" TO "postgres";

GRANT SELECT ON TABLE "public"."asignatura" TO "postgres";

GRANT UPDATE ON TABLE "public"."asignatura" TO "postgres";

GRANT DELETE ON TABLE "public"."asignatura" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."asignatura" TO "postgres";

GRANT REFERENCES ON TABLE "public"."asignatura" TO "postgres";

GRANT TRIGGER ON TABLE "public"."asignatura" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."asignatura" TO "postgres";

GRANT INSERT ON TABLE "public"."asignatura" TO "service_role";

GRANT SELECT ON TABLE "public"."asignatura" TO "service_role";

GRANT UPDATE ON TABLE "public"."asignatura" TO "service_role";

GRANT DELETE ON TABLE "public"."asignatura" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."asignatura" TO "service_role";

GRANT REFERENCES ON TABLE "public"."asignatura" TO "service_role";

GRANT TRIGGER ON TABLE "public"."asignatura" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."asignatura" TO "service_role";

GRANT SELECT ON TABLE "public"."asignatura" TO "anon";

GRANT SELECT ON TABLE "public"."asignatura" TO "authenticated";

GRANT INSERT ON TABLE "public"."carrera_asignatura" TO "postgres";

GRANT SELECT ON TABLE "public"."carrera_asignatura" TO "postgres";

GRANT UPDATE ON TABLE "public"."carrera_asignatura" TO "postgres";

GRANT DELETE ON TABLE "public"."carrera_asignatura" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."carrera_asignatura" TO "postgres";

GRANT REFERENCES ON TABLE "public"."carrera_asignatura" TO "postgres";

GRANT TRIGGER ON TABLE "public"."carrera_asignatura" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."carrera_asignatura" TO "postgres";

GRANT INSERT ON TABLE "public"."carrera_asignatura" TO "service_role";

GRANT SELECT ON TABLE "public"."carrera_asignatura" TO "service_role";

GRANT UPDATE ON TABLE "public"."carrera_asignatura" TO "service_role";

GRANT DELETE ON TABLE "public"."carrera_asignatura" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."carrera_asignatura" TO "service_role";

GRANT REFERENCES ON TABLE "public"."carrera_asignatura" TO "service_role";

GRANT TRIGGER ON TABLE "public"."carrera_asignatura" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."carrera_asignatura" TO "service_role";

GRANT SELECT ON TABLE "public"."carrera_asignatura" TO "anon";

GRANT SELECT ON TABLE "public"."carrera_asignatura" TO "authenticated";

GRANT INSERT ON TABLE "public"."estado" TO "postgres";

GRANT SELECT ON TABLE "public"."estado" TO "postgres";

GRANT UPDATE ON TABLE "public"."estado" TO "postgres";

GRANT DELETE ON TABLE "public"."estado" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."estado" TO "postgres";

GRANT REFERENCES ON TABLE "public"."estado" TO "postgres";

GRANT TRIGGER ON TABLE "public"."estado" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."estado" TO "postgres";

GRANT INSERT ON TABLE "public"."estado" TO "service_role";

GRANT SELECT ON TABLE "public"."estado" TO "service_role";

GRANT UPDATE ON TABLE "public"."estado" TO "service_role";

GRANT DELETE ON TABLE "public"."estado" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."estado" TO "service_role";

GRANT REFERENCES ON TABLE "public"."estado" TO "service_role";

GRANT TRIGGER ON TABLE "public"."estado" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."estado" TO "service_role";

GRANT SELECT ON TABLE "public"."estado" TO "anon";

GRANT SELECT ON TABLE "public"."estado" TO "authenticated";

GRANT INSERT ON TABLE "public"."tipo_evento" TO "postgres";

GRANT SELECT ON TABLE "public"."tipo_evento" TO "postgres";

GRANT UPDATE ON TABLE "public"."tipo_evento" TO "postgres";

GRANT DELETE ON TABLE "public"."tipo_evento" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."tipo_evento" TO "postgres";

GRANT REFERENCES ON TABLE "public"."tipo_evento" TO "postgres";

GRANT TRIGGER ON TABLE "public"."tipo_evento" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."tipo_evento" TO "postgres";

GRANT INSERT ON TABLE "public"."tipo_evento" TO "service_role";

GRANT SELECT ON TABLE "public"."tipo_evento" TO "service_role";

GRANT UPDATE ON TABLE "public"."tipo_evento" TO "service_role";

GRANT DELETE ON TABLE "public"."tipo_evento" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."tipo_evento" TO "service_role";

GRANT REFERENCES ON TABLE "public"."tipo_evento" TO "service_role";

GRANT TRIGGER ON TABLE "public"."tipo_evento" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."tipo_evento" TO "service_role";

GRANT SELECT ON TABLE "public"."tipo_evento" TO "anon";

GRANT SELECT ON TABLE "public"."tipo_evento" TO "authenticated";

GRANT INSERT ON TABLE "public"."tipo_alerta" TO "postgres";

GRANT SELECT ON TABLE "public"."tipo_alerta" TO "postgres";

GRANT UPDATE ON TABLE "public"."tipo_alerta" TO "postgres";

GRANT DELETE ON TABLE "public"."tipo_alerta" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."tipo_alerta" TO "postgres";

GRANT REFERENCES ON TABLE "public"."tipo_alerta" TO "postgres";

GRANT TRIGGER ON TABLE "public"."tipo_alerta" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."tipo_alerta" TO "postgres";

GRANT INSERT ON TABLE "public"."tipo_alerta" TO "service_role";

GRANT SELECT ON TABLE "public"."tipo_alerta" TO "service_role";

GRANT UPDATE ON TABLE "public"."tipo_alerta" TO "service_role";

GRANT DELETE ON TABLE "public"."tipo_alerta" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."tipo_alerta" TO "service_role";

GRANT REFERENCES ON TABLE "public"."tipo_alerta" TO "service_role";

GRANT TRIGGER ON TABLE "public"."tipo_alerta" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."tipo_alerta" TO "service_role";

GRANT SELECT ON TABLE "public"."tipo_alerta" TO "anon";

GRANT SELECT ON TABLE "public"."tipo_alerta" TO "authenticated";

GRANT INSERT ON TABLE "public"."estado_alerta" TO "postgres";

GRANT SELECT ON TABLE "public"."estado_alerta" TO "postgres";

GRANT UPDATE ON TABLE "public"."estado_alerta" TO "postgres";

GRANT DELETE ON TABLE "public"."estado_alerta" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."estado_alerta" TO "postgres";

GRANT REFERENCES ON TABLE "public"."estado_alerta" TO "postgres";

GRANT TRIGGER ON TABLE "public"."estado_alerta" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."estado_alerta" TO "postgres";

GRANT INSERT ON TABLE "public"."estado_alerta" TO "service_role";

GRANT SELECT ON TABLE "public"."estado_alerta" TO "service_role";

GRANT UPDATE ON TABLE "public"."estado_alerta" TO "service_role";

GRANT DELETE ON TABLE "public"."estado_alerta" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."estado_alerta" TO "service_role";

GRANT REFERENCES ON TABLE "public"."estado_alerta" TO "service_role";

GRANT TRIGGER ON TABLE "public"."estado_alerta" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."estado_alerta" TO "service_role";

GRANT SELECT ON TABLE "public"."estado_alerta" TO "anon";

GRANT SELECT ON TABLE "public"."estado_alerta" TO "authenticated";

GRANT INSERT ON TABLE "public"."estudiante_asignatura" TO "postgres";

GRANT SELECT ON TABLE "public"."estudiante_asignatura" TO "postgres";

GRANT UPDATE ON TABLE "public"."estudiante_asignatura" TO "postgres";

GRANT DELETE ON TABLE "public"."estudiante_asignatura" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."estudiante_asignatura" TO "postgres";

GRANT REFERENCES ON TABLE "public"."estudiante_asignatura" TO "postgres";

GRANT TRIGGER ON TABLE "public"."estudiante_asignatura" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."estudiante_asignatura" TO "postgres";

GRANT INSERT ON TABLE "public"."estudiante_asignatura" TO "service_role";

GRANT SELECT ON TABLE "public"."estudiante_asignatura" TO "service_role";

GRANT UPDATE ON TABLE "public"."estudiante_asignatura" TO "service_role";

GRANT DELETE ON TABLE "public"."estudiante_asignatura" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."estudiante_asignatura" TO "service_role";

GRANT REFERENCES ON TABLE "public"."estudiante_asignatura" TO "service_role";

GRANT TRIGGER ON TABLE "public"."estudiante_asignatura" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."estudiante_asignatura" TO "service_role";

GRANT SELECT ON TABLE "public"."estudiante_asignatura" TO "authenticated";

GRANT INSERT ON TABLE "public"."evento_academico" TO "postgres";

GRANT SELECT ON TABLE "public"."evento_academico" TO "postgres";

GRANT UPDATE ON TABLE "public"."evento_academico" TO "postgres";

GRANT DELETE ON TABLE "public"."evento_academico" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."evento_academico" TO "postgres";

GRANT REFERENCES ON TABLE "public"."evento_academico" TO "postgres";

GRANT TRIGGER ON TABLE "public"."evento_academico" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."evento_academico" TO "postgres";

GRANT INSERT ON TABLE "public"."evento_academico" TO "service_role";

GRANT SELECT ON TABLE "public"."evento_academico" TO "service_role";

GRANT UPDATE ON TABLE "public"."evento_academico" TO "service_role";

GRANT DELETE ON TABLE "public"."evento_academico" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."evento_academico" TO "service_role";

GRANT REFERENCES ON TABLE "public"."evento_academico" TO "service_role";

GRANT TRIGGER ON TABLE "public"."evento_academico" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."evento_academico" TO "service_role";

GRANT SELECT ON TABLE "public"."evento_academico" TO "authenticated";

GRANT INSERT ON TABLE "public"."opcion_respuesta" TO "postgres";

GRANT SELECT ON TABLE "public"."opcion_respuesta" TO "postgres";

GRANT UPDATE ON TABLE "public"."opcion_respuesta" TO "postgres";

GRANT DELETE ON TABLE "public"."opcion_respuesta" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."opcion_respuesta" TO "postgres";

GRANT REFERENCES ON TABLE "public"."opcion_respuesta" TO "postgres";

GRANT TRIGGER ON TABLE "public"."opcion_respuesta" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."opcion_respuesta" TO "postgres";

GRANT INSERT ON TABLE "public"."opcion_respuesta" TO "service_role";

GRANT SELECT ON TABLE "public"."opcion_respuesta" TO "service_role";

GRANT UPDATE ON TABLE "public"."opcion_respuesta" TO "service_role";

GRANT DELETE ON TABLE "public"."opcion_respuesta" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."opcion_respuesta" TO "service_role";

GRANT REFERENCES ON TABLE "public"."opcion_respuesta" TO "service_role";

GRANT TRIGGER ON TABLE "public"."opcion_respuesta" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."opcion_respuesta" TO "service_role";

GRANT SELECT ON TABLE "public"."opcion_respuesta" TO "anon";

GRANT SELECT ON TABLE "public"."opcion_respuesta" TO "authenticated";

GRANT INSERT ON TABLE "public"."material_emocion" TO "postgres";

GRANT SELECT ON TABLE "public"."material_emocion" TO "postgres";

GRANT UPDATE ON TABLE "public"."material_emocion" TO "postgres";

GRANT DELETE ON TABLE "public"."material_emocion" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."material_emocion" TO "postgres";

GRANT REFERENCES ON TABLE "public"."material_emocion" TO "postgres";

GRANT TRIGGER ON TABLE "public"."material_emocion" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."material_emocion" TO "postgres";

GRANT INSERT ON TABLE "public"."material_emocion" TO "service_role";

GRANT SELECT ON TABLE "public"."material_emocion" TO "service_role";

GRANT UPDATE ON TABLE "public"."material_emocion" TO "service_role";

GRANT DELETE ON TABLE "public"."material_emocion" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."material_emocion" TO "service_role";

GRANT REFERENCES ON TABLE "public"."material_emocion" TO "service_role";

GRANT TRIGGER ON TABLE "public"."material_emocion" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."material_emocion" TO "service_role";

GRANT SELECT ON TABLE "public"."material_emocion" TO "anon";

GRANT SELECT ON TABLE "public"."material_emocion" TO "authenticated";

GRANT INSERT ON TABLE "public"."material_test" TO "postgres";

GRANT SELECT ON TABLE "public"."material_test" TO "postgres";

GRANT UPDATE ON TABLE "public"."material_test" TO "postgres";

GRANT DELETE ON TABLE "public"."material_test" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."material_test" TO "postgres";

GRANT REFERENCES ON TABLE "public"."material_test" TO "postgres";

GRANT TRIGGER ON TABLE "public"."material_test" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."material_test" TO "postgres";

GRANT INSERT ON TABLE "public"."material_test" TO "service_role";

GRANT SELECT ON TABLE "public"."material_test" TO "service_role";

GRANT UPDATE ON TABLE "public"."material_test" TO "service_role";

GRANT DELETE ON TABLE "public"."material_test" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."material_test" TO "service_role";

GRANT REFERENCES ON TABLE "public"."material_test" TO "service_role";

GRANT TRIGGER ON TABLE "public"."material_test" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."material_test" TO "service_role";

GRANT SELECT ON TABLE "public"."material_test" TO "anon";

GRANT SELECT ON TABLE "public"."material_test" TO "authenticated";

GRANT SELECT ON SEQUENCE "public"."test_bienestar_id_test_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."test_bienestar_id_test_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."test_bienestar_id_test_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."test_bienestar_id_test_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."test_bienestar_id_test_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."test_bienestar_id_test_seq" TO "service_role";

GRANT INSERT ON TABLE "public"."aplicacion_test" TO "postgres";

GRANT SELECT ON TABLE "public"."aplicacion_test" TO "postgres";

GRANT UPDATE ON TABLE "public"."aplicacion_test" TO "postgres";

GRANT DELETE ON TABLE "public"."aplicacion_test" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."aplicacion_test" TO "postgres";

GRANT REFERENCES ON TABLE "public"."aplicacion_test" TO "postgres";

GRANT TRIGGER ON TABLE "public"."aplicacion_test" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."aplicacion_test" TO "postgres";

GRANT INSERT ON TABLE "public"."aplicacion_test" TO "service_role";

GRANT SELECT ON TABLE "public"."aplicacion_test" TO "service_role";

GRANT UPDATE ON TABLE "public"."aplicacion_test" TO "service_role";

GRANT DELETE ON TABLE "public"."aplicacion_test" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."aplicacion_test" TO "service_role";

GRANT REFERENCES ON TABLE "public"."aplicacion_test" TO "service_role";

GRANT TRIGGER ON TABLE "public"."aplicacion_test" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."aplicacion_test" TO "service_role";

GRANT SELECT ON TABLE "public"."aplicacion_test" TO "authenticated";

GRANT INSERT ON TABLE "public"."alerta_bienestar" TO "postgres";

GRANT SELECT ON TABLE "public"."alerta_bienestar" TO "postgres";

GRANT UPDATE ON TABLE "public"."alerta_bienestar" TO "postgres";

GRANT DELETE ON TABLE "public"."alerta_bienestar" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."alerta_bienestar" TO "postgres";

GRANT REFERENCES ON TABLE "public"."alerta_bienestar" TO "postgres";

GRANT TRIGGER ON TABLE "public"."alerta_bienestar" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."alerta_bienestar" TO "postgres";

GRANT INSERT ON TABLE "public"."alerta_bienestar" TO "service_role";

GRANT SELECT ON TABLE "public"."alerta_bienestar" TO "service_role";

GRANT UPDATE ON TABLE "public"."alerta_bienestar" TO "service_role";

GRANT DELETE ON TABLE "public"."alerta_bienestar" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."alerta_bienestar" TO "service_role";

GRANT REFERENCES ON TABLE "public"."alerta_bienestar" TO "service_role";

GRANT TRIGGER ON TABLE "public"."alerta_bienestar" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."alerta_bienestar" TO "service_role";

GRANT SELECT ON TABLE "public"."alerta_bienestar" TO "authenticated";

GRANT INSERT ON TABLE "public"."registro_emocional" TO "postgres";

GRANT SELECT ON TABLE "public"."registro_emocional" TO "postgres";

GRANT UPDATE ON TABLE "public"."registro_emocional" TO "postgres";

GRANT DELETE ON TABLE "public"."registro_emocional" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."registro_emocional" TO "postgres";

GRANT REFERENCES ON TABLE "public"."registro_emocional" TO "postgres";

GRANT TRIGGER ON TABLE "public"."registro_emocional" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."registro_emocional" TO "postgres";

GRANT INSERT ON TABLE "public"."registro_emocional" TO "service_role";

GRANT SELECT ON TABLE "public"."registro_emocional" TO "service_role";

GRANT UPDATE ON TABLE "public"."registro_emocional" TO "service_role";

GRANT DELETE ON TABLE "public"."registro_emocional" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."registro_emocional" TO "service_role";

GRANT REFERENCES ON TABLE "public"."registro_emocional" TO "service_role";

GRANT TRIGGER ON TABLE "public"."registro_emocional" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."registro_emocional" TO "service_role";

GRANT SELECT ON TABLE "public"."registro_emocional" TO "authenticated";

GRANT DELETE ON TABLE "public"."registro_emocional" TO "authenticated";

GRANT INSERT ON TABLE "public"."tipo_evento_institucional" TO "postgres";

GRANT SELECT ON TABLE "public"."tipo_evento_institucional" TO "postgres";

GRANT UPDATE ON TABLE "public"."tipo_evento_institucional" TO "postgres";

GRANT DELETE ON TABLE "public"."tipo_evento_institucional" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."tipo_evento_institucional" TO "postgres";

GRANT REFERENCES ON TABLE "public"."tipo_evento_institucional" TO "postgres";

GRANT TRIGGER ON TABLE "public"."tipo_evento_institucional" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."tipo_evento_institucional" TO "postgres";

GRANT INSERT ON TABLE "public"."tipo_evento_institucional" TO "service_role";

GRANT SELECT ON TABLE "public"."tipo_evento_institucional" TO "service_role";

GRANT UPDATE ON TABLE "public"."tipo_evento_institucional" TO "service_role";

GRANT DELETE ON TABLE "public"."tipo_evento_institucional" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."tipo_evento_institucional" TO "service_role";

GRANT REFERENCES ON TABLE "public"."tipo_evento_institucional" TO "service_role";

GRANT TRIGGER ON TABLE "public"."tipo_evento_institucional" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."tipo_evento_institucional" TO "service_role";

GRANT SELECT ON TABLE "public"."tipo_evento_institucional" TO "anon";

GRANT SELECT ON TABLE "public"."tipo_evento_institucional" TO "authenticated";

GRANT INSERT ON TABLE "private"."admin_staff" TO "postgres";

GRANT SELECT ON TABLE "private"."admin_staff" TO "postgres";

GRANT UPDATE ON TABLE "private"."admin_staff" TO "postgres";

GRANT DELETE ON TABLE "private"."admin_staff" TO "postgres";

GRANT TRUNCATE ON TABLE "private"."admin_staff" TO "postgres";

GRANT REFERENCES ON TABLE "private"."admin_staff" TO "postgres";

GRANT TRIGGER ON TABLE "private"."admin_staff" TO "postgres";

GRANT MAINTAIN ON TABLE "private"."admin_staff" TO "postgres";

GRANT SELECT ON TABLE "private"."admin_staff" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "anon";

GRANT UPDATE ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "anon";

GRANT USAGE ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "anon";

GRANT SELECT ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "authenticated";

GRANT UPDATE ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "authenticated";

GRANT USAGE ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "authenticated";

GRANT SELECT ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."tipo_evento_institucional_id_seq" TO "service_role";

GRANT INSERT ON TABLE "private"."admin_requests" TO "postgres";

GRANT SELECT ON TABLE "private"."admin_requests" TO "postgres";

GRANT UPDATE ON TABLE "private"."admin_requests" TO "postgres";

GRANT DELETE ON TABLE "private"."admin_requests" TO "postgres";

GRANT TRUNCATE ON TABLE "private"."admin_requests" TO "postgres";

GRANT REFERENCES ON TABLE "private"."admin_requests" TO "postgres";

GRANT TRIGGER ON TABLE "private"."admin_requests" TO "postgres";

GRANT MAINTAIN ON TABLE "private"."admin_requests" TO "postgres";

GRANT INSERT ON TABLE "private"."admin_requests" TO "service_role";

GRANT SELECT ON TABLE "private"."admin_requests" TO "service_role";

GRANT UPDATE ON TABLE "private"."admin_requests" TO "service_role";

GRANT DELETE ON TABLE "private"."admin_requests" TO "service_role";

GRANT INSERT ON TABLE "private"."password_reset_limits" TO "postgres";

GRANT SELECT ON TABLE "private"."password_reset_limits" TO "postgres";

GRANT UPDATE ON TABLE "private"."password_reset_limits" TO "postgres";

GRANT DELETE ON TABLE "private"."password_reset_limits" TO "postgres";

GRANT TRUNCATE ON TABLE "private"."password_reset_limits" TO "postgres";

GRANT REFERENCES ON TABLE "private"."password_reset_limits" TO "postgres";

GRANT TRIGGER ON TABLE "private"."password_reset_limits" TO "postgres";

GRANT MAINTAIN ON TABLE "private"."password_reset_limits" TO "postgres";

GRANT INSERT ON TABLE "private"."password_reset_limits" TO "service_role";

GRANT SELECT ON TABLE "private"."password_reset_limits" TO "service_role";

GRANT UPDATE ON TABLE "private"."password_reset_limits" TO "service_role";

GRANT DELETE ON TABLE "private"."password_reset_limits" TO "service_role";

GRANT SELECT ON SEQUENCE "private"."password_reset_limits_id_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "private"."password_reset_limits_id_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "private"."password_reset_limits_id_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "private"."password_reset_limits_id_seq" TO "service_role";

GRANT INSERT ON TABLE "public"."evento_institucional" TO "postgres";

GRANT SELECT ON TABLE "public"."evento_institucional" TO "postgres";

GRANT UPDATE ON TABLE "public"."evento_institucional" TO "postgres";

GRANT DELETE ON TABLE "public"."evento_institucional" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."evento_institucional" TO "postgres";

GRANT REFERENCES ON TABLE "public"."evento_institucional" TO "postgres";

GRANT TRIGGER ON TABLE "public"."evento_institucional" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."evento_institucional" TO "postgres";

GRANT INSERT ON TABLE "public"."evento_institucional" TO "service_role";

GRANT SELECT ON TABLE "public"."evento_institucional" TO "service_role";

GRANT UPDATE ON TABLE "public"."evento_institucional" TO "service_role";

GRANT DELETE ON TABLE "public"."evento_institucional" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."evento_institucional" TO "service_role";

GRANT REFERENCES ON TABLE "public"."evento_institucional" TO "service_role";

GRANT TRIGGER ON TABLE "public"."evento_institucional" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."evento_institucional" TO "service_role";

GRANT SELECT ON TABLE "public"."evento_institucional" TO "anon";

GRANT SELECT ON TABLE "public"."evento_institucional" TO "authenticated";

GRANT INSERT ON TABLE "public"."test_catalogo" TO "postgres";

GRANT SELECT ON TABLE "public"."test_catalogo" TO "postgres";

GRANT UPDATE ON TABLE "public"."test_catalogo" TO "postgres";

GRANT DELETE ON TABLE "public"."test_catalogo" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."test_catalogo" TO "postgres";

GRANT REFERENCES ON TABLE "public"."test_catalogo" TO "postgres";

GRANT TRIGGER ON TABLE "public"."test_catalogo" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."test_catalogo" TO "postgres";

GRANT INSERT ON TABLE "public"."test_catalogo" TO "service_role";

GRANT SELECT ON TABLE "public"."test_catalogo" TO "service_role";

GRANT UPDATE ON TABLE "public"."test_catalogo" TO "service_role";

GRANT DELETE ON TABLE "public"."test_catalogo" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."test_catalogo" TO "service_role";

GRANT REFERENCES ON TABLE "public"."test_catalogo" TO "service_role";

GRANT TRIGGER ON TABLE "public"."test_catalogo" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."test_catalogo" TO "service_role";

GRANT SELECT ON TABLE "public"."test_catalogo" TO "anon";

GRANT SELECT ON TABLE "public"."test_catalogo" TO "authenticated";

GRANT INSERT ON TABLE "public"."test_bienestar" TO "postgres";

GRANT SELECT ON TABLE "public"."test_bienestar" TO "postgres";

GRANT UPDATE ON TABLE "public"."test_bienestar" TO "postgres";

GRANT DELETE ON TABLE "public"."test_bienestar" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."test_bienestar" TO "postgres";

GRANT REFERENCES ON TABLE "public"."test_bienestar" TO "postgres";

GRANT TRIGGER ON TABLE "public"."test_bienestar" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."test_bienestar" TO "postgres";

GRANT INSERT ON TABLE "public"."test_bienestar" TO "service_role";

GRANT SELECT ON TABLE "public"."test_bienestar" TO "service_role";

GRANT UPDATE ON TABLE "public"."test_bienestar" TO "service_role";

GRANT DELETE ON TABLE "public"."test_bienestar" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."test_bienestar" TO "service_role";

GRANT REFERENCES ON TABLE "public"."test_bienestar" TO "service_role";

GRANT TRIGGER ON TABLE "public"."test_bienestar" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."test_bienestar" TO "service_role";

GRANT SELECT ON TABLE "public"."test_bienestar" TO "anon";

GRANT SELECT ON TABLE "public"."test_bienestar" TO "authenticated";

GRANT INSERT ON TABLE "public"."pregunta_test" TO "postgres";

GRANT SELECT ON TABLE "public"."pregunta_test" TO "postgres";

GRANT UPDATE ON TABLE "public"."pregunta_test" TO "postgres";

GRANT DELETE ON TABLE "public"."pregunta_test" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."pregunta_test" TO "postgres";

GRANT REFERENCES ON TABLE "public"."pregunta_test" TO "postgres";

GRANT TRIGGER ON TABLE "public"."pregunta_test" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."pregunta_test" TO "postgres";

GRANT INSERT ON TABLE "public"."pregunta_test" TO "service_role";

GRANT SELECT ON TABLE "public"."pregunta_test" TO "service_role";

GRANT UPDATE ON TABLE "public"."pregunta_test" TO "service_role";

GRANT DELETE ON TABLE "public"."pregunta_test" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."pregunta_test" TO "service_role";

GRANT REFERENCES ON TABLE "public"."pregunta_test" TO "service_role";

GRANT TRIGGER ON TABLE "public"."pregunta_test" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."pregunta_test" TO "service_role";

GRANT SELECT ON TABLE "public"."pregunta_test" TO "anon";

GRANT SELECT ON TABLE "public"."pregunta_test" TO "authenticated";

GRANT INSERT ON TABLE "public"."test_resultado_nivel" TO "postgres";

GRANT SELECT ON TABLE "public"."test_resultado_nivel" TO "postgres";

GRANT UPDATE ON TABLE "public"."test_resultado_nivel" TO "postgres";

GRANT DELETE ON TABLE "public"."test_resultado_nivel" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."test_resultado_nivel" TO "postgres";

GRANT REFERENCES ON TABLE "public"."test_resultado_nivel" TO "postgres";

GRANT TRIGGER ON TABLE "public"."test_resultado_nivel" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."test_resultado_nivel" TO "postgres";

GRANT INSERT ON TABLE "public"."test_resultado_nivel" TO "service_role";

GRANT SELECT ON TABLE "public"."test_resultado_nivel" TO "service_role";

GRANT UPDATE ON TABLE "public"."test_resultado_nivel" TO "service_role";

GRANT DELETE ON TABLE "public"."test_resultado_nivel" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."test_resultado_nivel" TO "service_role";

GRANT REFERENCES ON TABLE "public"."test_resultado_nivel" TO "service_role";

GRANT TRIGGER ON TABLE "public"."test_resultado_nivel" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."test_resultado_nivel" TO "service_role";

GRANT SELECT ON TABLE "public"."test_resultado_nivel" TO "anon";

GRANT SELECT ON TABLE "public"."test_resultado_nivel" TO "authenticated";

GRANT INSERT ON TABLE "public"."material_apoyo" TO "postgres";

GRANT SELECT ON TABLE "public"."material_apoyo" TO "postgres";

GRANT UPDATE ON TABLE "public"."material_apoyo" TO "postgres";

GRANT DELETE ON TABLE "public"."material_apoyo" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."material_apoyo" TO "postgres";

GRANT REFERENCES ON TABLE "public"."material_apoyo" TO "postgres";

GRANT TRIGGER ON TABLE "public"."material_apoyo" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."material_apoyo" TO "postgres";

GRANT INSERT ON TABLE "public"."material_apoyo" TO "service_role";

GRANT SELECT ON TABLE "public"."material_apoyo" TO "service_role";

GRANT UPDATE ON TABLE "public"."material_apoyo" TO "service_role";

GRANT DELETE ON TABLE "public"."material_apoyo" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."material_apoyo" TO "service_role";

GRANT REFERENCES ON TABLE "public"."material_apoyo" TO "service_role";

GRANT TRIGGER ON TABLE "public"."material_apoyo" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."material_apoyo" TO "service_role";

GRANT SELECT ON TABLE "public"."material_apoyo" TO "anon";

GRANT SELECT ON TABLE "public"."material_apoyo" TO "authenticated";

GRANT SELECT ON SEQUENCE "public"."pregunta_test_id_pregunta_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."pregunta_test_id_pregunta_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."pregunta_test_id_pregunta_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."pregunta_test_id_pregunta_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."pregunta_test_id_pregunta_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."pregunta_test_id_pregunta_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."opcion_respuesta_id_opcion_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."opcion_respuesta_id_opcion_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."opcion_respuesta_id_opcion_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."opcion_respuesta_id_opcion_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."opcion_respuesta_id_opcion_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."opcion_respuesta_id_opcion_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."material_apoyo_id_material_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."material_apoyo_id_material_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."material_apoyo_id_material_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."material_apoyo_id_material_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."material_apoyo_id_material_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."material_apoyo_id_material_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."material_emocion_id_materialemocion_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."material_emocion_id_materialemocion_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."material_emocion_id_materialemocion_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."material_emocion_id_materialemocion_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."material_emocion_id_materialemocion_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."material_emocion_id_materialemocion_seq" TO "service_role";

GRANT SELECT ON SEQUENCE "public"."material_test_id_materialtest_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."material_test_id_materialtest_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."material_test_id_materialtest_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."material_test_id_materialtest_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."material_test_id_materialtest_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."material_test_id_materialtest_seq" TO "service_role";

GRANT INSERT ON TABLE "public"."emocion_general" TO "postgres";

GRANT SELECT ON TABLE "public"."emocion_general" TO "postgres";

GRANT UPDATE ON TABLE "public"."emocion_general" TO "postgres";

GRANT DELETE ON TABLE "public"."emocion_general" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."emocion_general" TO "postgres";

GRANT REFERENCES ON TABLE "public"."emocion_general" TO "postgres";

GRANT TRIGGER ON TABLE "public"."emocion_general" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."emocion_general" TO "postgres";

GRANT INSERT ON TABLE "public"."emocion_general" TO "service_role";

GRANT SELECT ON TABLE "public"."emocion_general" TO "service_role";

GRANT UPDATE ON TABLE "public"."emocion_general" TO "service_role";

GRANT DELETE ON TABLE "public"."emocion_general" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."emocion_general" TO "service_role";

GRANT REFERENCES ON TABLE "public"."emocion_general" TO "service_role";

GRANT TRIGGER ON TABLE "public"."emocion_general" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."emocion_general" TO "service_role";

GRANT SELECT ON TABLE "public"."emocion_general" TO "anon";

GRANT SELECT ON TABLE "public"."emocion_general" TO "authenticated";

GRANT INSERT ON TABLE "public"."carrera" TO "postgres";

GRANT SELECT ON TABLE "public"."carrera" TO "postgres";

GRANT UPDATE ON TABLE "public"."carrera" TO "postgres";

GRANT DELETE ON TABLE "public"."carrera" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."carrera" TO "postgres";

GRANT REFERENCES ON TABLE "public"."carrera" TO "postgres";

GRANT TRIGGER ON TABLE "public"."carrera" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."carrera" TO "postgres";

GRANT INSERT ON TABLE "public"."carrera" TO "service_role";

GRANT SELECT ON TABLE "public"."carrera" TO "service_role";

GRANT UPDATE ON TABLE "public"."carrera" TO "service_role";

GRANT DELETE ON TABLE "public"."carrera" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."carrera" TO "service_role";

GRANT REFERENCES ON TABLE "public"."carrera" TO "service_role";

GRANT TRIGGER ON TABLE "public"."carrera" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."carrera" TO "service_role";

GRANT SELECT ON TABLE "public"."carrera" TO "anon";

GRANT SELECT ON TABLE "public"."carrera" TO "authenticated";

GRANT INSERT ON TABLE "public"."sede" TO "postgres";

GRANT SELECT ON TABLE "public"."sede" TO "postgres";

GRANT UPDATE ON TABLE "public"."sede" TO "postgres";

GRANT DELETE ON TABLE "public"."sede" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."sede" TO "postgres";

GRANT REFERENCES ON TABLE "public"."sede" TO "postgres";

GRANT TRIGGER ON TABLE "public"."sede" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."sede" TO "postgres";

GRANT INSERT ON TABLE "public"."sede" TO "service_role";

GRANT SELECT ON TABLE "public"."sede" TO "service_role";

GRANT UPDATE ON TABLE "public"."sede" TO "service_role";

GRANT DELETE ON TABLE "public"."sede" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."sede" TO "service_role";

GRANT REFERENCES ON TABLE "public"."sede" TO "service_role";

GRANT TRIGGER ON TABLE "public"."sede" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."sede" TO "service_role";

GRANT SELECT ON TABLE "public"."sede" TO "anon";

GRANT SELECT ON TABLE "public"."sede" TO "authenticated";

GRANT INSERT ON TABLE "public"."estudiante_carrera" TO "postgres";

GRANT SELECT ON TABLE "public"."estudiante_carrera" TO "postgres";

GRANT UPDATE ON TABLE "public"."estudiante_carrera" TO "postgres";

GRANT DELETE ON TABLE "public"."estudiante_carrera" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."estudiante_carrera" TO "postgres";

GRANT REFERENCES ON TABLE "public"."estudiante_carrera" TO "postgres";

GRANT TRIGGER ON TABLE "public"."estudiante_carrera" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."estudiante_carrera" TO "postgres";

GRANT INSERT ON TABLE "public"."estudiante_carrera" TO "service_role";

GRANT SELECT ON TABLE "public"."estudiante_carrera" TO "service_role";

GRANT UPDATE ON TABLE "public"."estudiante_carrera" TO "service_role";

GRANT DELETE ON TABLE "public"."estudiante_carrera" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."estudiante_carrera" TO "service_role";

GRANT REFERENCES ON TABLE "public"."estudiante_carrera" TO "service_role";

GRANT TRIGGER ON TABLE "public"."estudiante_carrera" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."estudiante_carrera" TO "service_role";

GRANT SELECT ON TABLE "public"."estudiante_carrera" TO "authenticated";

GRANT INSERT ON TABLE "public"."estudiante" TO "postgres";

GRANT SELECT ON TABLE "public"."estudiante" TO "postgres";

GRANT UPDATE ON TABLE "public"."estudiante" TO "postgres";

GRANT DELETE ON TABLE "public"."estudiante" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."estudiante" TO "postgres";

GRANT REFERENCES ON TABLE "public"."estudiante" TO "postgres";

GRANT TRIGGER ON TABLE "public"."estudiante" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."estudiante" TO "postgres";

GRANT SELECT ON TABLE "public"."estudiante" TO "authenticated";

GRANT INSERT ("nivel_resultado") ON TABLE "public"."aplicacion_test" TO "authenticated";

GRANT INSERT ("item_critico_detectado") ON TABLE "public"."aplicacion_test" TO "authenticated";

GRANT INSERT ("fecha_inscripcion") ON TABLE "public"."estudiante_asignatura" TO "authenticated";

GRANT INSERT ("fecha_hora") ON TABLE "public"."registro_emocional" TO "authenticated";

GRANT INSERT ("fecha_hora") ON TABLE "public"."evento_academico" TO "authenticated";

GRANT INSERT ("estudiante_id_estudiante") ON TABLE "public"."registro_emocional" TO "authenticated";

GRANT INSERT ("estudiante_id_estudiante") ON TABLE "public"."evento_academico" TO "authenticated";

GRANT INSERT ("estudiante_id_estudiante") ON TABLE "public"."estudiante_asignatura" TO "authenticated";

GRANT INSERT ("estudiante_id_estudiante") ON TABLE "public"."aplicacion_test" TO "authenticated";

GRANT INSERT ("estudiante_id_estudiante") ON TABLE "public"."alerta_bienestar" TO "authenticated";

GRANT INSERT ("estudiante_carrera_id") ON TABLE "public"."registro_emocional" TO "authenticated";

GRANT INSERT ("estudiante_carrera_id") ON TABLE "public"."estudiante_asignatura" TO "authenticated";

GRANT INSERT ("estudiante_carrera_id") ON TABLE "public"."aplicacion_test" TO "authenticated";

GRANT INSERT ("estudiante_carrera_id") ON TABLE "public"."alerta_bienestar" TO "authenticated";

GRANT INSERT ("estudiante_asignatura_id") ON TABLE "public"."evento_academico" TO "authenticated";

GRANT INSERT ("estado_id") ON TABLE "public"."evento_academico" TO "authenticated";

GRANT INSERT ("estado_alerta_id_estado") ON TABLE "public"."alerta_bienestar" TO "authenticated";

GRANT INSERT ("emocion_general_id_emocion") ON TABLE "public"."registro_emocional" TO "authenticated";

GRANT INSERT ("descripcion") ON TABLE "public"."evento_academico" TO "authenticated";

GRANT INSERT ("correo") ON TABLE "public"."estudiante" TO "authenticated";

GRANT INSERT ("consentimiento_version") ON TABLE "public"."alerta_bienestar" TO "authenticated";

GRANT INSERT ("consentimiento_fecha") ON TABLE "public"."alerta_bienestar" TO "authenticated";

GRANT INSERT ("consentimiento_derivacion") ON TABLE "public"."alerta_bienestar" TO "authenticated";

GRANT INSERT ("client_request_id") ON TABLE "public"."registro_emocional" TO "authenticated";

GRANT INSERT ("carrera_id_carrera") ON TABLE "public"."estudiante_asignatura" TO "authenticated";

GRANT INSERT ("carrera_asignatura_id") ON TABLE "public"."estudiante_asignatura" TO "authenticated";

GRANT INSERT ("auth_user_id") ON TABLE "public"."estudiante" TO "authenticated";

GRANT INSERT ("aplicacion_test_id_aplicacion") ON TABLE "public"."alerta_bienestar" TO "authenticated";

GRANT INSERT ("titulo") ON TABLE "public"."evento_academico" TO "authenticated";

GRANT INSERT ("tipo_evento_id") ON TABLE "public"."evento_academico" TO "authenticated";

GRANT INSERT ("tipo_alerta_id_tipoalerta") ON TABLE "public"."alerta_bienestar" TO "authenticated";

GRANT INSERT ("test_version") ON TABLE "public"."aplicacion_test" TO "authenticated";

GRANT INSERT ("test_id") ON TABLE "public"."aplicacion_test" TO "authenticated";

GRANT INSERT ("segundo_nombre") ON TABLE "public"."estudiante" TO "authenticated";

GRANT INSERT ("segundo_apellido") ON TABLE "public"."estudiante" TO "authenticated";

GRANT INSERT ("rut") ON TABLE "public"."estudiante" TO "authenticated";

GRANT INSERT ("puntaje_total") ON TABLE "public"."aplicacion_test" TO "authenticated";

GRANT INSERT ("primer_nombre") ON TABLE "public"."estudiante" TO "authenticated";

GRANT INSERT ("primer_apellido") ON TABLE "public"."estudiante" TO "authenticated";

GRANT INSERT ("numero_telefonico") ON TABLE "public"."estudiante" TO "authenticated";

GRANT SELECT ("auth_user_id") ON TABLE "public"."estudiante" TO "service_role";

GRANT SELECT ("id_estudiante") ON TABLE "public"."estudiante" TO "service_role";

GRANT SELECT ("segundo_nombre") ON TABLE "public"."estudiante" TO "service_role";

GRANT SELECT ("segundo_apellido") ON TABLE "public"."estudiante" TO "service_role";

GRANT SELECT ("primer_nombre") ON TABLE "public"."estudiante" TO "service_role";

GRANT SELECT ("primer_apellido") ON TABLE "public"."estudiante" TO "service_role";

GRANT EXECUTE ON FUNCTION private.assert_admin(uuid,uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION private.assert_admin(uuid,uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION private.catalog_json(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION private.catalog_json(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION private.check_event_registration() TO "postgres";

GRANT EXECUTE ON FUNCTION private.check_event_registration() TO "service_role";

GRANT EXECUTE ON FUNCTION private.check_event_transition() TO "postgres";

GRANT EXECUTE ON FUNCTION private.check_event_transition() TO "service_role";

GRANT EXECUTE ON FUNCTION private.check_event_type_code() TO "postgres";

GRANT EXECUTE ON FUNCTION private.check_event_type_code() TO "service_role";

GRANT EXECUTE ON FUNCTION private.check_fields(jsonb,text[]) TO "postgres";

GRANT EXECUTE ON FUNCTION private.check_fields(jsonb,text[]) TO "service_role";

GRANT EXECUTE ON FUNCTION private.check_test_parent() TO "postgres";

GRANT EXECUTE ON FUNCTION private.check_test_parent() TO "service_role";

GRANT EXECUTE ON FUNCTION private.check_test_version() TO "postgres";

GRANT EXECUTE ON FUNCTION private.check_test_version() TO "service_role";

GRANT EXECUTE ON FUNCTION private.check_text(text,integer,boolean) TO "postgres";

GRANT EXECUTE ON FUNCTION private.check_text(text,integer,boolean) TO "service_role";

GRANT EXECUTE ON FUNCTION private.check_tip_rule() TO "postgres";

GRANT EXECUTE ON FUNCTION private.check_tip_rule() TO "service_role";

GRANT EXECUTE ON FUNCTION private.cleanup_admin_operations() TO "postgres";

GRANT EXECUTE ON FUNCTION private.freeze_catalog_identity() TO "postgres";

GRANT EXECUTE ON FUNCTION private.freeze_catalog_identity() TO "service_role";

GRANT EXECUTE ON FUNCTION private.parse_event_type_id(jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION private.parse_event_type_id(jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION private.save_test_content(bigint,jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION private.save_test_content(bigint,jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION private.save_tip_rules(bigint,jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION private.save_tip_rules(bigint,jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION private.test_version_json(bigint) TO "postgres";

GRANT EXECUTE ON FUNCTION private.test_version_json(bigint) TO "service_role";

GRANT EXECUTE ON FUNCTION private.tip_json(bigint) TO "postgres";

GRANT EXECUTE ON FUNCTION private.tip_json(bigint) TO "service_role";

GRANT EXECUTE ON FUNCTION private.validate_test_publication(bigint) TO "postgres";

GRANT EXECUTE ON FUNCTION private.validate_test_publication(bigint) TO "service_role";

GRANT EXECUTE ON FUNCTION admin_access(uuid,uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION admin_access(uuid,uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION admin_mutate(uuid,uuid,text,text,jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION admin_mutate(uuid,uuid,text,text,jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION admin_read(uuid,uuid,text,jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION admin_read(uuid,uuid,text,jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION admin_reset_finish(uuid,uuid,uuid,text) TO "postgres";

GRANT EXECUTE ON FUNCTION admin_reset_finish(uuid,uuid,uuid,text) TO "service_role";

GRANT EXECUTE ON FUNCTION admin_reset_recipient(uuid,uuid,bigint,uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION admin_reset_recipient(uuid,uuid,bigint,uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION admin_reset_reserve(uuid,uuid,bigint,uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION admin_reset_reserve(uuid,uuid,bigint,uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION erase_student_personal_data(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION erase_student_personal_data(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION get_student_events(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION get_student_events(uuid) TO "authenticated";

GRANT EXECUTE ON FUNCTION get_student_events(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION load_personal_schedule() TO "postgres";

GRANT EXECUTE ON FUNCTION load_personal_schedule() TO "service_role";

GRANT EXECUTE ON FUNCTION load_personal_schedule() TO "authenticated";

GRANT EXECUTE ON FUNCTION save_personal_schedule(integer,uuid,jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION save_personal_schedule(integer,uuid,jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION save_personal_schedule(integer,uuid,jsonb) TO "authenticated";

GRANT EXECUTE ON FUNCTION validar_puntaje_aplicacion_test() TO PUBLIC;

GRANT EXECUTE ON FUNCTION validar_puntaje_aplicacion_test() TO "postgres";

GRANT EXECUTE ON FUNCTION validar_puntaje_aplicacion_test() TO "anon";

GRANT EXECUTE ON FUNCTION validar_puntaje_aplicacion_test() TO "authenticated";

GRANT EXECUTE ON FUNCTION validar_puntaje_aplicacion_test() TO "service_role";

GRANT EXECUTE ON FUNCTION schedule_private.fields(jsonb,text[]) TO "postgres";

GRANT EXECUTE ON FUNCTION schedule_private.save_schedule(integer,uuid,jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION schedule_private.save_schedule(integer,uuid,jsonb) TO "authenticated";

GRANT EXECUTE ON FUNCTION schedule_private.valid_text(jsonb,integer,boolean) TO "postgres";

GRANT EXECUTE ON FUNCTION schedule_private.valid_uuid(jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION schedule_private.validate_document(jsonb) TO "postgres";

-- Publicaciones Realtime observadas (configuración, no aplicada por esta evidencia):

COMMIT;
