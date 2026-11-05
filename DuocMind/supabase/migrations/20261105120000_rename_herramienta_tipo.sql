-- Renombra la pivote N:M herramienta -> herramienta_tipoherramienta <- tipo_herramienta.
-- Es idempotente: la base remota ya tiene estos nombres. Las columnas no cambian; RLS,
-- grants y la política "active tool types are readable" siguen a la tabla al renombrarla.

begin;

do $$
begin
  if to_regclass('public.herramienta_tipo') is not null
     and to_regclass('public.herramienta_tipoherramienta') is null then
    alter table public.herramienta_tipo rename to herramienta_tipoherramienta;
  end if;

  if exists (select 1 from pg_constraint
             where conrelid = 'public.herramienta_tipoherramienta'::regclass
               and conname = 'herramienta_tipo_pkey') then
    alter table public.herramienta_tipoherramienta
      rename constraint herramienta_tipo_pkey to herramienta_tipoherramienta_pkey;
  end if;

  if exists (select 1 from pg_constraint
             where conrelid = 'public.herramienta_tipoherramienta'::regclass
               and conname = 'herramienta_tipo_herramienta_id_fkey') then
    alter table public.herramienta_tipoherramienta
      rename constraint herramienta_tipo_herramienta_id_fkey to herramienta_tipoherramienta_herramienta_id_fkey;
  end if;

  if exists (select 1 from pg_constraint
             where conrelid = 'public.herramienta_tipoherramienta'::regclass
               and conname = 'herramienta_tipo_tipo_id_fkey') then
    alter table public.herramienta_tipoherramienta
      rename constraint herramienta_tipo_tipo_id_fkey to herramienta_tipoherramienta_tipo_id_fkey;
  end if;

  if to_regclass('public.herramienta_tipo_tipo_idx') is not null then
    alter index public.herramienta_tipo_tipo_idx rename to herramienta_tipoherramienta_tipo_idx;
  end if;
end $$;

commit;
