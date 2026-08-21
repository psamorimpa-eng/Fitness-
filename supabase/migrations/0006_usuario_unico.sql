-- =====================================================================
-- Modelo de usuario unico
-- Cada conta administra apenas os proprios dados e a propria ficha.
-- =====================================================================

update public.usuarios set papel = 'aluno' where papel <> 'aluno';

insert into public.perfis_aluno (usuario_id)
select id from public.usuarios
on conflict (usuario_id) do nothing;

update public.perfis_aluno set personal_id = null where personal_id is not null;
update public.fichas set personal_id = null where personal_id is not null;

-- Fichas: cada usuario ve e altera somente as proprias fichas.
drop policy if exists ficha_leitura on public.fichas;
drop policy if exists ficha_escrita on public.fichas;
drop policy if exists ficha_leitura_propria on public.fichas;
drop policy if exists ficha_escrita_propria on public.fichas;

create policy ficha_leitura_propria on public.fichas
for select to authenticated
using ((select auth.uid()) = aluno_id);

create policy ficha_escrita_propria on public.fichas
for all to authenticated
using ((select auth.uid()) = aluno_id)
with check ((select auth.uid()) = aluno_id);

-- Divisoes: acesso apenas quando a ficha pertence ao usuario.
drop policy if exists divisao_leitura on public.divisoes_treino;
drop policy if exists divisao_escrita on public.divisoes_treino;
drop policy if exists divisao_leitura_propria on public.divisoes_treino;
drop policy if exists divisao_escrita_propria on public.divisoes_treino;

create policy divisao_leitura_propria on public.divisoes_treino
for select to authenticated
using (
  exists (
    select 1 from public.fichas f
    where f.id = ficha_id and f.aluno_id = (select auth.uid())
  )
);

create policy divisao_escrita_propria on public.divisoes_treino
for all to authenticated
using (
  exists (
    select 1 from public.fichas f
    where f.id = ficha_id and f.aluno_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.fichas f
    where f.id = ficha_id and f.aluno_id = (select auth.uid())
  )
);

-- Series planejadas: acesso apenas quando a ficha pertence ao usuario.
drop policy if exists serie_plan_leitura on public.series_planejadas;
drop policy if exists serie_plan_escrita on public.series_planejadas;
drop policy if exists serie_plan_leitura_propria on public.series_planejadas;
drop policy if exists serie_plan_escrita_propria on public.series_planejadas;

create policy serie_plan_leitura_propria on public.series_planejadas
for select to authenticated
using (
  exists (
    select 1
      from public.divisoes_treino d
      join public.fichas f on f.id = d.ficha_id
     where d.id = divisao_id
       and f.aluno_id = (select auth.uid())
  )
);

create policy serie_plan_escrita_propria on public.series_planejadas
for all to authenticated
using (
  exists (
    select 1
      from public.divisoes_treino d
      join public.fichas f on f.id = d.ficha_id
     where d.id = divisao_id
       and f.aluno_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
      from public.divisoes_treino d
      join public.fichas f on f.id = d.ficha_id
     where d.id = divisao_id
       and f.aluno_id = (select auth.uid())
  )
);

-- Salva sempre a ficha do proprio usuario, ignorando aluno_id enviado pelo cliente.
create or replace function public.salvar_ficha_completa(p_ficha jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ficha_id uuid := nullif(p_ficha->>'id', '')::uuid;
  v_aluno_id uuid := auth.uid();
  v_status   status_ficha := coalesce((p_ficha->>'status')::status_ficha, 'rascunho');
  v_divisao  jsonb;
  v_item     jsonb;
  v_divisao_id uuid;
begin
  if v_aluno_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if v_status = 'ativa' then
    update public.fichas set status = 'arquivada'
     where aluno_id = v_aluno_id
       and status = 'ativa'
       and (v_ficha_id is null or id <> v_ficha_id);
  end if;

  if v_ficha_id is null then
    insert into public.fichas (
      aluno_id, personal_id, nome, objetivo, data_inicio, data_validade,
      dias_semana, nivel, status, observacoes
    )
    values (
      v_aluno_id, null, p_ficha->>'nome', p_ficha->>'objetivo',
      coalesce((p_ficha->>'data_inicio')::date, current_date),
      nullif(p_ficha->>'data_validade', '')::date,
      coalesce((p_ficha->>'dias_semana')::smallint, 3),
      p_ficha->>'nivel', v_status, p_ficha->>'observacoes'
    )
    returning id into v_ficha_id;
  else
    update public.fichas
       set aluno_id      = v_aluno_id,
           personal_id   = null,
           nome          = p_ficha->>'nome',
           objetivo      = p_ficha->>'objetivo',
           data_inicio   = coalesce((p_ficha->>'data_inicio')::date, data_inicio),
           data_validade = nullif(p_ficha->>'data_validade', '')::date,
           dias_semana   = coalesce((p_ficha->>'dias_semana')::smallint, dias_semana),
           nivel         = p_ficha->>'nivel',
           status        = v_status,
           observacoes   = p_ficha->>'observacoes'
     where id = v_ficha_id
       and aluno_id = v_aluno_id;

    if not found then
      raise exception 'Ficha nao encontrada ou sem permissao';
    end if;
  end if;

  delete from public.divisoes_treino where ficha_id = v_ficha_id;

  for v_divisao in select * from jsonb_array_elements(coalesce(p_ficha->'divisoes', '[]'::jsonb)) loop
    insert into public.divisoes_treino (ficha_id, codigo, nome, ordem)
    values (
      v_ficha_id,
      v_divisao->>'codigo',
      v_divisao->>'nome',
      coalesce((v_divisao->>'ordem')::smallint, 1)
    )
    returning id into v_divisao_id;

    for v_item in select * from jsonb_array_elements(coalesce(v_divisao->'itens', '[]'::jsonb)) loop
      insert into public.series_planejadas (
        divisao_id, exercicio_id, ordem, series, rep_min, rep_max, carga_sugerida,
        descanso_seg, cadencia, tecnica, rir, series_aquecimento, observacoes
      )
      values (
        v_divisao_id,
        (v_item->>'exercicio_id')::uuid,
        (v_item->>'ordem')::smallint,
        coalesce((v_item->>'series')::smallint, 3),
        (v_item->>'rep_min')::smallint,
        (v_item->>'rep_max')::smallint,
        coalesce((v_item->>'carga_sugerida')::numeric, 0),
        coalesce((v_item->>'descanso_seg')::smallint, 60),
        coalesce(v_item->>'cadencia', '2-0-1-0'),
        coalesce(v_item->>'tecnica', 'Nenhuma'),
        (v_item->>'rir')::smallint,
        coalesce((v_item->>'series_aquecimento')::smallint, 1),
        v_item->>'observacoes'
      );
    end loop;
  end loop;

  return v_ficha_id;
end $$;

grant execute on function public.salvar_ficha_completa(jsonb) to authenticated;
revoke execute on function public.salvar_ficha_completa(jsonb) from anon;

create or replace function public.exercicios_frequentes(p_limite int default 12)
returns table (exercicio_id uuid, nome text, usos bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select e.id, e.nome, count(*) as usos
    from public.series_planejadas sp
    join public.divisoes_treino d on d.id = sp.divisao_id
    join public.fichas f on f.id = d.ficha_id
    join public.exercicios e on e.id = sp.exercicio_id
   where f.aluno_id = (select auth.uid())
   group by e.id, e.nome
   order by usos desc
   limit p_limite;
$$;

grant execute on function public.exercicios_frequentes(int) to authenticated;
revoke execute on function public.exercicios_frequentes(int) from anon;