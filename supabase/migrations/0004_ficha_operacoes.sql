-- =====================================================================
-- Operações de ficha em uma única transação.
-- O editor do personal envia a ficha inteira de uma vez, então salvar
-- precisa ser atômico: ou entra tudo, ou nada muda.
-- security invoker de propósito, para as políticas RLS continuarem valendo.
-- =====================================================================

create or replace function salvar_ficha_completa(p_ficha jsonb)
returns uuid
language plpgsql
as $$
declare
  v_ficha_id uuid := nullif(p_ficha->>'id', '')::uuid;
  v_aluno_id uuid := (p_ficha->>'aluno_id')::uuid;
  v_status   status_ficha := coalesce((p_ficha->>'status')::status_ficha, 'rascunho');
  v_divisao  jsonb;
  v_item     jsonb;
  v_divisao_id uuid;
begin
  -- Regra 2: apenas uma ficha ativa por aluno. Arquiva a anterior antes de gravar.
  if v_status = 'ativa' then
    update fichas set status = 'arquivada'
     where aluno_id = v_aluno_id
       and status = 'ativa'
       and (v_ficha_id is null or id <> v_ficha_id);
  end if;

  if v_ficha_id is null then
    insert into fichas (aluno_id, personal_id, nome, objetivo, data_inicio, data_validade,
                        dias_semana, nivel, status, observacoes)
    values (v_aluno_id, auth.uid(), p_ficha->>'nome', p_ficha->>'objetivo',
            coalesce((p_ficha->>'data_inicio')::date, current_date),
            nullif(p_ficha->>'data_validade', '')::date,
            coalesce((p_ficha->>'dias_semana')::smallint, 3),
            p_ficha->>'nivel', v_status, p_ficha->>'observacoes')
    returning id into v_ficha_id;
  else
    update fichas
       set aluno_id      = v_aluno_id,
           nome          = p_ficha->>'nome',
           objetivo      = p_ficha->>'objetivo',
           data_inicio   = coalesce((p_ficha->>'data_inicio')::date, data_inicio),
           data_validade = nullif(p_ficha->>'data_validade', '')::date,
           dias_semana   = coalesce((p_ficha->>'dias_semana')::smallint, dias_semana),
           nivel         = p_ficha->>'nivel',
           status        = v_status,
           observacoes   = p_ficha->>'observacoes'
     where id = v_ficha_id;
  end if;

  -- As divisões são regravadas por inteiro. O histórico de treinos aponta para
  -- divisao_id com on delete set null, então nada do passado se perde.
  delete from divisoes_treino where ficha_id = v_ficha_id;

  for v_divisao in select * from jsonb_array_elements(p_ficha->'divisoes') loop
    insert into divisoes_treino (ficha_id, codigo, nome, ordem)
    values (v_ficha_id, v_divisao->>'codigo', v_divisao->>'nome',
            coalesce((v_divisao->>'ordem')::smallint, 1))
    returning id into v_divisao_id;

    for v_item in select * from jsonb_array_elements(coalesce(v_divisao->'itens', '[]'::jsonb)) loop
      insert into series_planejadas (
        divisao_id, exercicio_id, ordem, series, rep_min, rep_max, carga_sugerida,
        descanso_seg, cadencia, tecnica, rir, series_aquecimento, observacoes)
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
        v_item->>'observacoes');
    end loop;
  end loop;

  return v_ficha_id;
end $$;

-- Copiar ficha de um aluno para outro, requisito central de quem atende
-- vários alunos com o mesmo protocolo.
create or replace function duplicar_ficha(p_ficha uuid, p_aluno uuid, p_nome text default null)
returns uuid
language plpgsql
as $$
declare v_nova uuid; v_divisao record; v_nova_divisao uuid;
begin
  insert into fichas (aluno_id, personal_id, nome, objetivo, data_inicio, data_validade,
                      dias_semana, nivel, status, observacoes)
  select p_aluno, auth.uid(),
         coalesce(p_nome, f.nome || ' (cópia)'),
         f.objetivo, current_date,
         case when f.data_validade is null then null
              else current_date + (f.data_validade - f.data_inicio) end,
         f.dias_semana, f.nivel, 'rascunho', f.observacoes
    from fichas f where f.id = p_ficha
  returning id into v_nova;

  for v_divisao in select * from divisoes_treino where ficha_id = p_ficha order by ordem loop
    insert into divisoes_treino (ficha_id, codigo, nome, ordem)
    values (v_nova, v_divisao.codigo, v_divisao.nome, v_divisao.ordem)
    returning id into v_nova_divisao;

    insert into series_planejadas (divisao_id, exercicio_id, ordem, series, rep_min, rep_max,
                                   carga_sugerida, descanso_seg, cadencia, tecnica, rir,
                                   series_aquecimento, substituto_id, observacoes)
    select v_nova_divisao, exercicio_id, ordem, series, rep_min, rep_max,
           carga_sugerida, descanso_seg, cadencia, tecnica, rir,
           series_aquecimento, substituto_id, observacoes
      from series_planejadas where divisao_id = v_divisao.id;
  end loop;

  return v_nova;
end $$;

-- Exercícios que o personal mais usa, para o editor abrir já com o que interessa.
create or replace function exercicios_frequentes(p_limite int default 12)
returns table (exercicio_id uuid, nome text, usos bigint)
language sql stable
as $$
  select e.id, e.nome, count(*) as usos
    from series_planejadas sp
    join divisoes_treino d on d.id = sp.divisao_id
    join fichas f on f.id = d.ficha_id
    join exercicios e on e.id = sp.exercicio_id
   where f.personal_id = auth.uid()
   group by e.id, e.nome
   order by usos desc
   limit p_limite;
$$;
