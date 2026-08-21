-- Uma medição por aluno por dia.
-- Isso permite salvar novamente no mesmo dia sem gerar duplicidade no histórico.

drop index if exists public.ix_medidas_aluno_data;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'medidas_corporais_aluno_data_key'
      and conrelid = 'public.medidas_corporais'::regclass
  ) then
    alter table public.medidas_corporais
      add constraint medidas_corporais_aluno_data_key unique (aluno_id, data);
  end if;
end $$;
