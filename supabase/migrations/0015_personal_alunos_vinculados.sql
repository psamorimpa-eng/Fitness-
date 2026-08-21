-- Ativa o papel Personal usando vínculo explícito perfis_aluno.personal_id.
-- O aluno continua dono dos próprios dados. O Personal só acessa alunos vinculados a ele.

alter policy usuario_le_a_si on public.usuarios
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.perfis_aluno pa
      where pa.usuario_id = usuarios.id
        and pa.personal_id = (select auth.uid())
    )
  );

alter policy perfil_aluno_leitura on public.perfis_aluno
  to authenticated
  using (
    usuario_id = (select auth.uid())
    or personal_id = (select auth.uid())
  );

alter policy ficha_escrita_propria on public.fichas
  to authenticated
  using (
    aluno_id = (select auth.uid())
    or exists (
      select 1 from public.perfis_aluno pa
      where pa.usuario_id = fichas.aluno_id
        and pa.personal_id = (select auth.uid())
    )
  )
  with check (
    aluno_id = (select auth.uid())
    or exists (
      select 1 from public.perfis_aluno pa
      where pa.usuario_id = fichas.aluno_id
        and pa.personal_id = (select auth.uid())
    )
  );

alter policy divisao_escrita_propria on public.divisoes_treino
  to authenticated
  using (
    exists (
      select 1
      from public.fichas f
      left join public.perfis_aluno pa on pa.usuario_id = f.aluno_id
      where f.id = divisoes_treino.ficha_id
        and (f.aluno_id = (select auth.uid()) or pa.personal_id = (select auth.uid()))
    )
  )
  with check (
    exists (
      select 1
      from public.fichas f
      left join public.perfis_aluno pa on pa.usuario_id = f.aluno_id
      where f.id = divisoes_treino.ficha_id
        and (f.aluno_id = (select auth.uid()) or pa.personal_id = (select auth.uid()))
    )
  );

alter policy serie_plan_escrita_propria on public.series_planejadas
  to authenticated
  using (
    exists (
      select 1
      from public.divisoes_treino d
      join public.fichas f on f.id = d.ficha_id
      left join public.perfis_aluno pa on pa.usuario_id = f.aluno_id
      where d.id = series_planejadas.divisao_id
        and (f.aluno_id = (select auth.uid()) or pa.personal_id = (select auth.uid()))
    )
  )
  with check (
    exists (
      select 1
      from public.divisoes_treino d
      join public.fichas f on f.id = d.ficha_id
      left join public.perfis_aluno pa on pa.usuario_id = f.aluno_id
      where d.id = series_planejadas.divisao_id
        and (f.aluno_id = (select auth.uid()) or pa.personal_id = (select auth.uid()))
    )
  );

create or replace function public.salvar_ficha_completa(p_ficha jsonb)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_ficha_id uuid := nullif(p_ficha->>'id','')::uuid;
  v_solicitante uuid := auth.uid();
  v_aluno_id uuid := coalesce(nullif(p_ficha->>'aluno_id','')::uuid, auth.uid());
  v_status public.status_ficha := coalesce((p_ficha->>'status')::public.status_ficha,'rascunho');
  v_vinculado boolean := false;
  v_divisao jsonb;
  v_item jsonb;
  v_divisao_id uuid;
  v_codigos text[] := array[]::text[];
begin
  if v_solicitante is null then raise exception 'Usuario nao autenticado'; end if;

  if v_aluno_id <> v_solicitante then
    select exists (
      select 1 from public.perfis_aluno pa
      where pa.usuario_id = v_aluno_id
        and pa.personal_id = v_solicitante
    ) into v_vinculado;
    if not v_vinculado then raise exception 'Aluno nao vinculado a este Personal'; end if;
  end if;

  if v_status = 'ativa' then
    update public.fichas
      set status = 'arquivada', atualizado_em = now(), atualizado_por = v_solicitante
      where aluno_id = v_aluno_id
        and status = 'ativa'
        and (v_ficha_id is null or id <> v_ficha_id);
  end if;

  if v_ficha_id is null then
    insert into public.fichas(
      aluno_id, personal_id, nome, objetivo, data_inicio, data_validade,
      dias_semana, nivel, status, observacoes, atualizado_por
    ) values (
      v_aluno_id,
      case when v_aluno_id <> v_solicitante then v_solicitante else null end,
      p_ficha->>'nome', p_ficha->>'objetivo',
      coalesce((p_ficha->>'data_inicio')::date,current_date),
      nullif(p_ficha->>'data_validade','')::date,
      coalesce((p_ficha->>'dias_semana')::smallint,3),
      p_ficha->>'nivel', v_status, p_ficha->>'observacoes', v_solicitante
    ) returning id into v_ficha_id;
  else
    update public.fichas set
      nome = p_ficha->>'nome',
      objetivo = p_ficha->>'objetivo',
      data_inicio = coalesce((p_ficha->>'data_inicio')::date,data_inicio),
      data_validade = nullif(p_ficha->>'data_validade','')::date,
      dias_semana = coalesce((p_ficha->>'dias_semana')::smallint,dias_semana),
      nivel = p_ficha->>'nivel',
      status = v_status,
      observacoes = p_ficha->>'observacoes',
      personal_id = case when v_aluno_id <> v_solicitante then v_solicitante else personal_id end,
      atualizado_em = now(),
      atualizado_por = v_solicitante
    where id = v_ficha_id and aluno_id = v_aluno_id;
    if not found then raise exception 'Ficha nao encontrada ou sem permissao'; end if;
  end if;

  for v_divisao in
    select * from jsonb_array_elements(coalesce(p_ficha->'divisoes','[]'::jsonb))
  loop
    v_codigos := array_append(v_codigos,v_divisao->>'codigo');
    select id into v_divisao_id
      from public.divisoes_treino
      where ficha_id = v_ficha_id and codigo = v_divisao->>'codigo';

    if v_divisao_id is null then
      insert into public.divisoes_treino(ficha_id,codigo,nome,ordem)
      values(v_ficha_id,v_divisao->>'codigo',v_divisao->>'nome',coalesce((v_divisao->>'ordem')::smallint,1))
      returning id into v_divisao_id;
    else
      update public.divisoes_treino
        set nome = v_divisao->>'nome', ordem = coalesce((v_divisao->>'ordem')::smallint,ordem)
        where id = v_divisao_id;
    end if;

    delete from public.series_planejadas where divisao_id = v_divisao_id;

    for v_item in
      select * from jsonb_array_elements(coalesce(v_divisao->'itens','[]'::jsonb))
    loop
      insert into public.series_planejadas(
        divisao_id,exercicio_id,ordem,series,rep_min,rep_max,carga_sugerida,
        descanso_seg,cadencia,tecnica,rir,series_aquecimento,observacoes
      ) values (
        v_divisao_id,(v_item->>'exercicio_id')::uuid,(v_item->>'ordem')::smallint,
        coalesce((v_item->>'series')::smallint,3),(v_item->>'rep_min')::smallint,
        (v_item->>'rep_max')::smallint,coalesce((v_item->>'carga_sugerida')::numeric,0),
        coalesce((v_item->>'descanso_seg')::smallint,60),coalesce(v_item->>'cadencia','2-0-1-0'),
        coalesce(v_item->>'tecnica','Nenhuma'),(v_item->>'rir')::smallint,
        coalesce((v_item->>'series_aquecimento')::smallint,1),v_item->>'observacoes'
      );
    end loop;
  end loop;

  delete from public.divisoes_treino
    where ficha_id = v_ficha_id and not (codigo = any(v_codigos));

  return v_ficha_id;
end;
$$;

-- Restaura os perfis de demonstração esperados sem alterar contas reais.
update public.usuarios set papel = 'personal'::public.papel_usuario
where email = 'marina@fichafitness.app';

insert into public.perfis_personal(usuario_id)
select id from public.usuarios where email = 'marina@fichafitness.app'
on conflict(usuario_id) do nothing;

update public.usuarios set papel = 'admin'::public.papel_usuario
where email = 'admin@fichafitness.app';

update public.perfis_aluno pa
set personal_id = personal.id
from public.usuarios aluno, public.usuarios personal
where aluno.email = 'aluno@fichafitness.app'
  and personal.email = 'marina@fichafitness.app'
  and pa.usuario_id = aluno.id;
