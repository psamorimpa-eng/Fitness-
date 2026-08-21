-- Auditoria 2026-08: persistencia, historico imutavel, logs e isolamento por usuario

-- 1. Metadados e snapshots historicos
alter table public.usuarios
  add column if not exists atualizado_em timestamptz not null default now();

alter table public.treinos_realizados
  add column if not exists atualizado_em timestamptz not null default now(),
  add column if not exists ficha_nome_snapshot text,
  add column if not exists divisao_codigo_snapshot text,
  add column if not exists divisao_nome_snapshot text,
  add column if not exists plano_snapshot jsonb not null default '[]'::jsonb;

alter table public.series_realizadas
  add column if not exists exercicio_nome_snapshot text,
  add column if not exists ordem_exercicio smallint,
  add column if not exists series_planejadas smallint,
  add column if not exists rep_min_planejada smallint,
  add column if not exists rep_max_planejada smallint,
  add column if not exists carga_planejada numeric,
  add column if not exists descanso_planejado smallint,
  add column if not exists observacoes text,
  add column if not exists status_serie text not null default 'concluida';

alter table public.series_realizadas
  drop constraint if exists series_realizadas_status_serie_check;
alter table public.series_realizadas
  add constraint series_realizadas_status_serie_check
  check (status_serie in ('pendente','concluida','pulada'));

-- 2. Atualizacao automatica de timestamps
create or replace function public.fn_tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

revoke all on function public.fn_tocar_atualizado_em() from public, anon, authenticated;

drop trigger if exists tg_usuario_atualizado on public.usuarios;
create trigger tg_usuario_atualizado
before update on public.usuarios
for each row execute function public.fn_tocar_atualizado_em();

drop trigger if exists tg_treino_atualizado on public.treinos_realizados;
create trigger tg_treino_atualizado
before update on public.treinos_realizados
for each row execute function public.fn_tocar_atualizado_em();

-- 3. Snapshot da ficha no inicio do treino
create or replace function public.fn_snapshot_treino()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.aluno_id is distinct from auth.uid() and auth.uid() is not null then
    raise exception 'Treino pertence a outro usuario';
  end if;

  if new.ficha_nome_snapshot is null and new.ficha_id is not null then
    select f.nome into new.ficha_nome_snapshot
      from public.fichas f
     where f.id = new.ficha_id and f.aluno_id = new.aluno_id;
  end if;

  if new.divisao_id is not null then
    if new.divisao_codigo_snapshot is null or new.divisao_nome_snapshot is null then
      select d.codigo, d.nome
        into new.divisao_codigo_snapshot, new.divisao_nome_snapshot
        from public.divisoes_treino d
        join public.fichas f on f.id = d.ficha_id
       where d.id = new.divisao_id and f.aluno_id = new.aluno_id;
    end if;

    if coalesce(jsonb_array_length(new.plano_snapshot), 0) = 0 then
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'exercicio_id', e.id,
          'nome', e.nome,
          'ordem', sp.ordem,
          'series', sp.series,
          'rep_min', sp.rep_min,
          'rep_max', sp.rep_max,
          'carga_sugerida', sp.carga_sugerida,
          'descanso_seg', sp.descanso_seg,
          'observacoes', sp.observacoes
        ) order by sp.ordem
      ), '[]'::jsonb)
      into new.plano_snapshot
      from public.series_planejadas sp
      join public.exercicios e on e.id = sp.exercicio_id
      where sp.divisao_id = new.divisao_id;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.fn_snapshot_treino() from public, anon, authenticated;

drop trigger if exists tg_snapshot_treino on public.treinos_realizados;
create trigger tg_snapshot_treino
before insert on public.treinos_realizados
for each row execute function public.fn_snapshot_treino();

-- 4. Snapshot e volume da serie realizada
create or replace function public.fn_preparar_serie_realizada()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_item jsonb;
begin
  new.volume := coalesce(new.carga_kg, 0) * coalesce(new.repeticoes, 0);

  select elem into v_item
    from public.treinos_realizados t,
         lateral jsonb_array_elements(coalesce(t.plano_snapshot, '[]'::jsonb)) elem
   where t.id = new.treino_id
     and elem->>'exercicio_id' = new.exercicio_id::text
   limit 1;

  if v_item is not null then
    new.exercicio_nome_snapshot := coalesce(new.exercicio_nome_snapshot, v_item->>'nome');
    new.ordem_exercicio := coalesce(new.ordem_exercicio, (v_item->>'ordem')::smallint);
    new.series_planejadas := coalesce(new.series_planejadas, (v_item->>'series')::smallint);
    new.rep_min_planejada := coalesce(new.rep_min_planejada, (v_item->>'rep_min')::smallint);
    new.rep_max_planejada := coalesce(new.rep_max_planejada, (v_item->>'rep_max')::smallint);
    new.carga_planejada := coalesce(new.carga_planejada, (v_item->>'carga_sugerida')::numeric);
    new.descanso_planejado := coalesce(new.descanso_planejado, (v_item->>'descanso_seg')::smallint);
    new.observacoes := coalesce(new.observacoes, v_item->>'observacoes');
  end if;

  if new.exercicio_nome_snapshot is null then
    select e.nome into new.exercicio_nome_snapshot
      from public.exercicios e where e.id = new.exercicio_id;
  end if;

  return new;
end;
$$;

revoke all on function public.fn_preparar_serie_realizada() from public, anon, authenticated;

drop trigger if exists tg_preparar_serie_realizada on public.series_realizadas;
create trigger tg_preparar_serie_realizada
before insert or update on public.series_realizadas
for each row execute function public.fn_preparar_serie_realizada();

-- 5. Log de atividades. Senhas nunca entram nas tabelas publicas auditadas.
create or replace function public.fn_log_atividade_publica()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_entidade_id uuid;
  v_acao text;
  v_antes jsonb;
  v_depois jsonb;
begin
  if tg_op = 'UPDATE' and to_jsonb(old) = to_jsonb(new) then
    return new;
  end if;

  v_antes := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  v_depois := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;

  if tg_table_name = 'fichas' then
    v_entidade_id := coalesce(new.id, old.id);
    v_usuario := coalesce(v_usuario, new.aluno_id, old.aluno_id);
    v_acao := case
      when tg_op = 'INSERT' then 'ficha_criada'
      when tg_op = 'DELETE' then 'ficha_excluida'
      when new.status = 'arquivada' and old.status is distinct from new.status then 'ficha_arquivada'
      else 'ficha_alterada' end;
  elsif tg_table_name = 'series_planejadas' then
    v_entidade_id := coalesce(new.id, old.id);
    v_acao := case when tg_op='INSERT' then 'exercicio_adicionado'
                   when tg_op='DELETE' then 'exercicio_removido'
                   else 'serie_planejada_alterada' end;
  elsif tg_table_name = 'treinos_realizados' then
    v_entidade_id := coalesce(new.id, old.id);
    v_usuario := coalesce(v_usuario, new.aluno_id, old.aluno_id);
    v_acao := case
      when tg_op='INSERT' then 'treino_iniciado'
      when tg_op='DELETE' then 'treino_excluido'
      when old.status is distinct from new.status and new.status='concluido' then 'treino_finalizado'
      else 'treino_alterado' end;
  elsif tg_table_name = 'series_realizadas' then
    v_entidade_id := coalesce(new.id, old.id);
    if v_usuario is null then
      select t.aluno_id into v_usuario
        from public.treinos_realizados t
       where t.id = coalesce(new.treino_id, old.treino_id);
    end if;
    v_acao := case when tg_op='INSERT' then 'serie_registrada'
                   when tg_op='DELETE' then 'serie_removida'
                   else 'serie_alterada' end;
  elsif tg_table_name = 'usuarios' then
    v_entidade_id := coalesce(new.id, old.id);
    v_usuario := coalesce(v_usuario, new.id, old.id);
    v_acao := case when tg_op='UPDATE' then 'cadastro_alterado' else lower(tg_op) end;
  else
    v_acao := lower(tg_op);
  end if;

  insert into public.logs_atividade(usuario_id, entidade, entidade_id, acao, dados_antes, dados_depois)
  values (v_usuario, tg_table_name, v_entidade_id, v_acao, v_antes, v_depois);

  if tg_table_name = 'series_realizadas' and tg_op = 'UPDATE' then
    if old.carga_kg is distinct from new.carga_kg then
      insert into public.logs_atividade(usuario_id, entidade, entidade_id, acao, dados_antes, dados_depois)
      values (v_usuario, 'series_realizadas', new.id, 'carga_alterada',
              jsonb_build_object('carga_kg', old.carga_kg), jsonb_build_object('carga_kg', new.carga_kg));
    end if;
    if old.repeticoes is distinct from new.repeticoes then
      insert into public.logs_atividade(usuario_id, entidade, entidade_id, acao, dados_antes, dados_depois)
      values (v_usuario, 'series_realizadas', new.id, 'repeticoes_alteradas',
              jsonb_build_object('repeticoes', old.repeticoes), jsonb_build_object('repeticoes', new.repeticoes));
    end if;
  end if;

  return case when tg_op='DELETE' then old else new end;
end;
$$;

revoke all on function public.fn_log_atividade_publica() from public, anon, authenticated;

-- substitui o log antigo da ficha para nao duplicar eventos
drop trigger if exists tg_auditoria_ficha on public.fichas;

drop trigger if exists tg_log_fichas on public.fichas;
create trigger tg_log_fichas after insert or update or delete on public.fichas
for each row execute function public.fn_log_atividade_publica();

drop trigger if exists tg_log_series_planejadas on public.series_planejadas;
create trigger tg_log_series_planejadas after insert or update or delete on public.series_planejadas
for each row execute function public.fn_log_atividade_publica();

drop trigger if exists tg_log_treinos on public.treinos_realizados;
create trigger tg_log_treinos after insert or update or delete on public.treinos_realizados
for each row execute function public.fn_log_atividade_publica();

drop trigger if exists tg_log_series_realizadas on public.series_realizadas;
create trigger tg_log_series_realizadas after insert or update or delete on public.series_realizadas
for each row execute function public.fn_log_atividade_publica();

drop trigger if exists tg_log_usuarios on public.usuarios;
create trigger tg_log_usuarios after update on public.usuarios
for each row execute function public.fn_log_atividade_publica();

-- RPC segura para eventos de autenticacao e eventos de interface
create or replace function public.registrar_log_atividade(
  p_entidade text,
  p_acao text,
  p_entidade_id uuid default null,
  p_dados jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;
  insert into public.logs_atividade(usuario_id, entidade, entidade_id, acao, dados_depois)
  values (auth.uid(), p_entidade, p_entidade_id, p_acao, p_dados);
end;
$$;
revoke all on function public.registrar_log_atividade(text,text,uuid,jsonb) from public, anon;
grant execute on function public.registrar_log_atividade(text,text,uuid,jsonb) to authenticated;

-- 6. Cadastro: garante registro public e log de criacao; mantem confirmacao automatica da fase de testes
create or replace function public.fn_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome, email, telefone, nascimento, sexo, papel, aceite_termos_em, aceite_privacidade_em)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'telefone',
    (new.raw_user_meta_data->>'nascimento')::date,
    new.raw_user_meta_data->>'sexo',
    'aluno'::public.papel_usuario,
    now(), now()
  )
  on conflict (id) do nothing;

  insert into public.perfis_aluno (usuario_id, altura_cm, peso_kg, objetivo)
  values (
    new.id,
    (new.raw_user_meta_data->>'altura')::numeric,
    (new.raw_user_meta_data->>'peso')::numeric,
    new.raw_user_meta_data->>'objetivo'
  ) on conflict (usuario_id) do nothing;

  insert into public.preferencias_notificacao (usuario_id)
  values (new.id) on conflict (usuario_id) do nothing;

  insert into public.logs_atividade(usuario_id, entidade, entidade_id, acao, dados_depois)
  values (new.id, 'usuarios', new.id, 'conta_criada', jsonb_build_object('email', new.email));

  if new.email_confirmed_at is null then
    update auth.users
       set email_confirmed_at = now(), confirmation_token = ''
     where id = new.id and email_confirmed_at is null;
  end if;

  return new;
end;
$$;
revoke all on function public.fn_novo_usuario() from public, anon, authenticated;

-- 7. Salva ficha preservando IDs de divisoes existentes sempre que o codigo nao muda
create or replace function public.salvar_ficha_completa(p_ficha jsonb)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_ficha_id uuid := nullif(p_ficha->>'id', '')::uuid;
  v_aluno_id uuid := auth.uid();
  v_status public.status_ficha := coalesce((p_ficha->>'status')::public.status_ficha, 'rascunho');
  v_divisao jsonb;
  v_item jsonb;
  v_divisao_id uuid;
  v_codigos text[] := array[]::text[];
begin
  if v_aluno_id is null then raise exception 'Usuario nao autenticado'; end if;

  if v_status = 'ativa' then
    update public.fichas set status='arquivada'
     where aluno_id=v_aluno_id and status='ativa'
       and (v_ficha_id is null or id<>v_ficha_id);
  end if;

  if v_ficha_id is null then
    insert into public.fichas(aluno_id, personal_id, nome, objetivo, data_inicio, data_validade, dias_semana, nivel, status, observacoes)
    values (v_aluno_id, null, p_ficha->>'nome', p_ficha->>'objetivo',
            coalesce((p_ficha->>'data_inicio')::date,current_date),
            nullif(p_ficha->>'data_validade','')::date,
            coalesce((p_ficha->>'dias_semana')::smallint,3),
            p_ficha->>'nivel', v_status, p_ficha->>'observacoes')
    returning id into v_ficha_id;
  else
    update public.fichas
       set nome=p_ficha->>'nome', objetivo=p_ficha->>'objetivo',
           data_inicio=coalesce((p_ficha->>'data_inicio')::date,data_inicio),
           data_validade=nullif(p_ficha->>'data_validade','')::date,
           dias_semana=coalesce((p_ficha->>'dias_semana')::smallint,dias_semana),
           nivel=p_ficha->>'nivel', status=v_status, observacoes=p_ficha->>'observacoes',
           atualizado_em=now(), atualizado_por=v_aluno_id
     where id=v_ficha_id and aluno_id=v_aluno_id;
    if not found then raise exception 'Ficha nao encontrada ou sem permissao'; end if;
  end if;

  for v_divisao in select * from jsonb_array_elements(coalesce(p_ficha->'divisoes','[]'::jsonb)) loop
    v_codigos := array_append(v_codigos, v_divisao->>'codigo');
    select id into v_divisao_id from public.divisoes_treino
     where ficha_id=v_ficha_id and codigo=v_divisao->>'codigo';

    if v_divisao_id is null then
      insert into public.divisoes_treino(ficha_id,codigo,nome,ordem)
      values(v_ficha_id,v_divisao->>'codigo',v_divisao->>'nome',coalesce((v_divisao->>'ordem')::smallint,1))
      returning id into v_divisao_id;
    else
      update public.divisoes_treino
         set nome=v_divisao->>'nome', ordem=coalesce((v_divisao->>'ordem')::smallint,ordem)
       where id=v_divisao_id;
    end if;

    delete from public.series_planejadas where divisao_id=v_divisao_id;
    for v_item in select * from jsonb_array_elements(coalesce(v_divisao->'itens','[]'::jsonb)) loop
      insert into public.series_planejadas(
        divisao_id,exercicio_id,ordem,series,rep_min,rep_max,carga_sugerida,descanso_seg,cadencia,tecnica,rir,series_aquecimento,observacoes)
      values(
        v_divisao_id,(v_item->>'exercicio_id')::uuid,(v_item->>'ordem')::smallint,
        coalesce((v_item->>'series')::smallint,3),(v_item->>'rep_min')::smallint,(v_item->>'rep_max')::smallint,
        coalesce((v_item->>'carga_sugerida')::numeric,0),coalesce((v_item->>'descanso_seg')::smallint,60),
        coalesce(v_item->>'cadencia','2-0-1-0'),coalesce(v_item->>'tecnica','Nenhuma'),
        (v_item->>'rir')::smallint,coalesce((v_item->>'series_aquecimento')::smallint,1),v_item->>'observacoes');
    end loop;
  end loop;

  delete from public.divisoes_treino
   where ficha_id=v_ficha_id and not (codigo = any(v_codigos));

  return v_ficha_id;
end;
$$;
revoke all on function public.salvar_ficha_completa(jsonb) from public, anon;
grant execute on function public.salvar_ficha_completa(jsonb) to authenticated;

-- 8. Validade: cada usuario pode atualizar somente as proprias fichas vencidas
create or replace function public.vencer_minhas_fichas()
returns integer
language plpgsql
set search_path = public
as $$
declare v_total integer;
begin
  if auth.uid() is null then return 0; end if;
  update public.fichas set status='vencida'
   where aluno_id=auth.uid() and status='ativa' and data_validade is not null and data_validade < current_date;
  get diagnostics v_total = row_count;
  return v_total;
end;
$$;
revoke all on function public.vencer_minhas_fichas() from public, anon;
grant execute on function public.vencer_minhas_fichas() to authenticated;

-- 9. Remove acessos cruzados legados de Personal/Admin nos dados pessoais
drop policy if exists treino_visto_pelo_personal on public.treinos_realizados;
drop policy if exists serie_vista_pelo_personal on public.series_realizadas;
drop policy if exists foto_liberada_ao_personal on public.fotos_evolucao;

drop policy if exists avaliacao_acesso on public.avaliacoes_fisicas;
create policy avaliacao_propria on public.avaliacoes_fisicas
for all to authenticated using (aluno_id=auth.uid()) with check (aluno_id=auth.uid());

drop policy if exists medidas_acesso on public.medidas_corporais;
create policy medidas_proprias on public.medidas_corporais
for all to authenticated using (aluno_id=auth.uid()) with check (aluno_id=auth.uid());

drop policy if exists notificacao_acesso on public.notificacoes;
create policy notificacao_propria on public.notificacoes
for all to authenticated using (usuario_id=auth.uid()) with check (usuario_id=auth.uid());

drop policy if exists usuario_le_a_si on public.usuarios;
drop policy if exists usuario_edita_a_si on public.usuarios;
create policy usuario_le_a_si on public.usuarios for select to authenticated using (id=auth.uid());
create policy usuario_edita_a_si on public.usuarios for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

drop policy if exists perfil_aluno_leitura on public.perfis_aluno;
drop policy if exists perfil_aluno_escrita on public.perfis_aluno;
create policy perfil_aluno_leitura on public.perfis_aluno for select to authenticated using (usuario_id=auth.uid());
create policy perfil_aluno_escrita on public.perfis_aluno for update to authenticated using (usuario_id=auth.uid()) with check (usuario_id=auth.uid());

-- 10. RLS nas tabelas que estavam expostas sem protecao
alter table public.academias enable row level security;
alter table public.categorias_musculares enable row level security;
alter table public.equipamentos enable row level security;
alter table public.exercicio_secundarios enable row level security;
alter table public.exercicio_substitutos enable row level security;
alter table public.exercicios_nao_realizados enable row level security;
alter table public.recordes_pessoais enable row level security;
alter table public.agenda_treinos enable row level security;
alter table public.preferencias_notificacao enable row level security;
alter table public.assinaturas enable row level security;
alter table public.planos enable row level security;
alter table public.pagamentos enable row level security;
alter table public.permissoes enable row level security;

create policy catalogo_academias_leitura on public.academias for select to authenticated using (true);
create policy catalogo_categorias_leitura on public.categorias_musculares for select to authenticated using (true);
create policy catalogo_equipamentos_leitura on public.equipamentos for select to authenticated using (true);
create policy catalogo_secundarios_leitura on public.exercicio_secundarios for select to authenticated using (true);
create policy catalogo_substitutos_leitura on public.exercicio_substitutos for select to authenticated using (true);
create policy catalogo_planos_leitura on public.planos for select to authenticated using (true);

create policy nao_realizados_proprios on public.exercicios_nao_realizados
for all to authenticated
using (exists(select 1 from public.treinos_realizados t where t.id=treino_id and t.aluno_id=auth.uid()))
with check (exists(select 1 from public.treinos_realizados t where t.id=treino_id and t.aluno_id=auth.uid()));

create policy recordes_proprios_leitura on public.recordes_pessoais
for select to authenticated using (aluno_id=auth.uid());

create policy agenda_propria on public.agenda_treinos
for all to authenticated using (aluno_id=auth.uid()) with check (aluno_id=auth.uid());

create policy preferencias_proprias on public.preferencias_notificacao
for all to authenticated using (usuario_id=auth.uid()) with check (usuario_id=auth.uid());

create policy assinatura_propria_leitura on public.assinaturas
for select to authenticated using (usuario_id=auth.uid());

create policy pagamento_proprio_leitura on public.pagamentos
for select to authenticated
using (exists(select 1 from public.assinaturas a where a.id=assinatura_id and a.usuario_id=auth.uid()));

-- permissoes e tabelas financeiras nao possuem escrita pelo cliente nesta fase.

-- 11. Views respeitam o RLS do usuario que consulta
alter view public.vw_volume_semanal set (security_invoker = true);
alter view public.vw_progressao_carga set (security_invoker = true);
alter view public.vw_adesao set (security_invoker = true);

alter function public.duplicar_ficha(uuid,uuid,text) set search_path = public;

-- Funcoes de trigger/administracao nao devem ser RPC publicas
revoke all on function public.fn_auditoria_ficha() from public, anon, authenticated;
revoke all on function public.fn_atualiza_recorde() from public, anon, authenticated;
revoke all on function public.fn_vencer_fichas() from public, anon, authenticated;

-- Indices para consultas de persistencia/historico
create index if not exists idx_fichas_aluno_status on public.fichas(aluno_id,status);
create index if not exists idx_treinos_aluno_status_data on public.treinos_realizados(aluno_id,status,data desc);
create index if not exists idx_series_treino_exercicio on public.series_realizadas(treino_id,exercicio_id);
create index if not exists idx_logs_usuario_data on public.logs_atividade(usuario_id,criado_em desc);
