begin;

grant insert (fecha_hora) on public.registro_emocional to authenticated;

commit;