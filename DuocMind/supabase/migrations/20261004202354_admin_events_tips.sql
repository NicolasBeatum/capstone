begin;
create table public.evento_institucional (
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(trim(title)) between 1 and 160),
 description text not null default '' check(length(description)<=5000),
 location text not null check(length(trim(location)) between 1 and 160),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 status text not null default 'draft' check(status in ('draft','published','cancelled')),
 published_at timestamptz,
 revision integer not null default 1 check(revision>0),
 check(ends_at>=starts_at),
 check((status='draft' and published_at is null) or(status<>'draft' and published_at is not null))
);
create index institutional_events_start_idx on public.evento_institucional(starts_at,id);
alter table public.material_apoyo add column publication_status text not null default 'draft' check(publication_status in ('draft','published')),
 add column published_at timestamptz,add column revision integer not null default 1 check(revision>0);
alter table public.material_apoyo alter column is_active set default false;
update public.material_apoyo set publication_status='published',published_at=now();
alter table public.material_apoyo add constraint tip_publication_valid check((publication_status='draft' and published_at is null and not is_active) or(publication_status='published' and published_at is not null));
create function private.check_tip_rule() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.test_bienestar where id_test=new.test_id and version=new.test_version and publication_status='published') then raise exception using errcode='P0422',message='Regla requiere versión publicada';end if;return new;
end;$$;
create trigger tip_result_published before insert or update on public.material_test for each row execute function private.check_tip_rule();
create function private.check_event_transition() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.status='cancelled' and new is distinct from old then raise exception using errcode='P0422',message='Evento cancelado no editable';end if;
 if old.published_at is not null and(new.published_at is distinct from old.published_at or new.status='draft') then raise exception using errcode='P0422',message='Publicación conservada';end if;return new;
end;$$;
create trigger event_transition before update on public.evento_institucional for each row execute function private.check_event_transition();
insert into public.material_apoyo(titulo,descripcion,is_active,publication_status,published_at)
select title,content,true,'published',now() from (values
 ('Técnica Pomodoro 25/5','Para días de alta carga cognitiva. Alterna trabajo concentrado con pausas sin pantallas.'),
 ('Meditación Guiada (3 min)','Reduce la ansiedad pre-examen centrando tu atención en la respiración diafragmática.'),
 ('Higiene del Sueño','Evita trasnochar repasando materia. La consolidación de la memoria ocurre en el sueño profundo.')
) as tips(title,content) where not exists(select 1 from public.material_apoyo where titulo=title);
revoke all on function private.check_tip_rule(),private.check_event_transition() from public,anon,authenticated;
grant execute on function private.check_tip_rule(),private.check_event_transition() to service_role;
commit;
