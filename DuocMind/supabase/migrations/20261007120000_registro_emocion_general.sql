begin;

alter table public.registro_emocional
  add column emocion_general_id_emocion bigint references public.emocion_general(id_emocion);

update public.registro_emocional r
set emocion_general_id_emocion = es.emocion_general_id_emocion
from public.emocion_especifica es
where es.id_emocionesp = r.emocion_especifica_id_emocionesp;

alter table public.registro_emocional
  alter column emocion_general_id_emocion set not null,
  drop column emocion_especifica_id_emocionesp;

create index registro_emocion_general_idx
  on public.registro_emocional(emocion_general_id_emocion);

grant insert (emocion_general_id_emocion) on public.registro_emocional to authenticated;

drop table public.emocion_especifica;

commit;
