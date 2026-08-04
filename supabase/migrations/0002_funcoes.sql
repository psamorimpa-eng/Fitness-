-- =====================================================================
-- Funções, gatilhos e visões que sustentam as regras de negócio
-- =====================================================================

-- Papel do usuário autenticado, usado nas políticas de acesso
create or replace function papel_atual() returns papel_usuario
language sql stable security definer set search_path = public as $$
  select papel from usuarios where id = auth.uid();
$$;

create or replace function e_meu_aluno(p_aluno uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis_aluno where usuario_id = p_aluno and personal_id = auth.uid());
$$;

-- Cria o registro em usuarios logo após o cadastro no Auth
create or replace function fn_novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into usuarios (id, nome, email, telefone, nascimento, sexo, papel, aceite_termos_em, aceite_privacidade_em)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'telefone',
    (new.raw_user_meta_data->>'nascimento')::date,
    new.raw_user_meta_data->>'sexo',
    coalesce((new.raw_user_meta_data->>'papel')::papel_usuario, 'aluno'),
    now(), now()
  );

  if coalesce(new.raw_user_meta_data->>'papel', 'aluno') = 'aluno' then
    insert into perfis_aluno (usuario_id, altura_cm, peso_kg, objetivo)
    values (new.id,
            (new.raw_user_meta_data->>'altura')::numeric,
            (new.raw_user_meta_data->>'peso')::numeric,
            new.raw_user_meta_data->>'objetivo');
  end if;

  insert into preferencias_notificacao (usuario_id) values (new.id);
  return new;
end $$;

drop trigger if exists tg_novo_usuario on auth.users;
create trigger tg_novo_usuario after insert on auth.users
  for each row execute function fn_novo_usuario();

-- Regra 13: recorde pessoal identificado automaticamente
create or replace function fn_atualiza_recorde() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_aluno uuid; v_data date;
begin
  select aluno_id, data into v_aluno, v_data from treinos_realizados where id = new.treino_id;

  insert into recordes_pessoais (aluno_id, exercicio_id, carga_kg, repeticoes, serie_id, data)
  values (v_aluno, new.exercicio_id, new.carga_kg, new.repeticoes, new.id, v_data)
  on conflict (aluno_id, exercicio_id) do update
    set carga_kg = excluded.carga_kg, repeticoes = excluded.repeticoes,
        serie_id = excluded.serie_id, data = excluded.data
  where excluded.carga_kg > recordes_pessoais.carga_kg
     or (excluded.carga_kg = recordes_pessoais.carga_kg and excluded.repeticoes > recordes_pessoais.repeticoes);

  -- Regra 14: volume acumulado do treino
  update treinos_realizados t
     set volume_total = (select coalesce(sum(volume), 0) from series_realizadas where treino_id = t.id)
   where t.id = new.treino_id;

  return new;
end $$;

create trigger tg_recorde after insert or update on series_realizadas
  for each row execute function fn_atualiza_recorde();

-- Regra 8: toda alteração de ficha registra data e responsável
create or replace function fn_auditoria_ficha() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.atualizado_em := now();
  new.atualizado_por := auth.uid();
  insert into logs_atividade (usuario_id, entidade, entidade_id, acao, dados_antes, dados_depois)
  values (auth.uid(), 'fichas', new.id, tg_op, to_jsonb(old), to_jsonb(new));
  return new;
end $$;

create trigger tg_auditoria_ficha before update on fichas
  for each row execute function fn_auditoria_ficha();

-- Fichas vencidas mudam de status automaticamente (chamar via cron diário)
create or replace function fn_vencer_fichas() returns void
language sql security definer set search_path = public as $$
  update fichas set status = 'vencida'
   where status = 'ativa' and data_validade is not null and data_validade < current_date;
$$;

-- ------------------------------------------------------------------ visões
-- Volume e frequência por semana, base dos gráficos de evolução
create or replace view vw_volume_semanal as
select t.aluno_id,
       date_trunc('week', t.data)::date as semana,
       count(distinct t.id)             as treinos,
       sum(t.volume_total)              as volume_kg,
       round(avg(t.duracao_min))        as duracao_media_min
  from treinos_realizados t
 where t.status = 'concluido'
 group by 1, 2;

-- Progressão de carga por exercício
create or replace view vw_progressao_carga as
select t.aluno_id, s.exercicio_id, t.data, max(s.carga_kg) as carga_max,
       sum(s.volume) as volume_exercicio
  from series_realizadas s
  join treinos_realizados t on t.id = s.treino_id
 where t.status = 'concluido' and s.aquecimento = false
 group by 1, 2, 3;

-- Adesão à ficha nas últimas 8 semanas
create or replace view vw_adesao as
select pa.usuario_id as aluno_id,
       pa.meta_semanal,
       count(t.id) filter (where t.data >= current_date - interval '56 days') as treinos_8_semanas,
       round(100.0 * count(t.id) filter (where t.data >= current_date - interval '56 days')
             / nullif(pa.meta_semanal * 8, 0)) as adesao_pct
  from perfis_aluno pa
  left join treinos_realizados t on t.aluno_id = pa.usuario_id and t.status = 'concluido'
 group by 1, 2;
