begin;

-- El dashboard escucha las inserciones de check-ins propios para actualizar su
-- gráfico semanal. Realtime solo entrega cada evento a quien pasa la política RLS
-- de lectura de registro_emocional.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'registro_emocional'
  ) then
    alter publication supabase_realtime add table public.registro_emocional;
  end if;
end $$;

commit;
