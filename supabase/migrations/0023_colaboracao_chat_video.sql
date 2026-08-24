-- Colaboração segura entre usuários, chat em tempo real e mídia embutida.
-- Esta migration é aditiva: não remove fichas, treinos, exercícios ou mensagens existentes.

alter table public.exercicios add column if not exists video_embutido_url text;
alter table public.exercicios add column if not exists video_embutido_licenca text;
alter table public.exercicios add column if not exists video_embutido_autor text;

-- O catálogo passa a expor também o vídeo interno, preservando video_url como fallback.
drop function if exists public.catalogo_exercicios_v2();
create function public.catalogo_exercicios_v2()
returns table(
  id uuid,
  nome text,
  nivel text,
  tipo text,
  descricao text,
  instrucoes text,
  erros_comuns text,
  imagem_url text,
  video_url text,
  video_embutido_url text,
  video_embutido_licenca text,
  video_embutido_autor text,
  grupo text,
  equipamento text,
  grupos_secundarios text[]
)
language sql
stable
set search_path = public
as $$
  select
    e.id,
    e.nome,
    e.nivel,
    e.tipo,
    e.descricao,
    e.instrucoes,
    e.erros_comuns,
    e.imagem_url,
    e.video_url,
    e.video_embutido_url,
    e.video_embutido_licenca,
    e.video_embutido_autor,
    coalesce(cm.nome, 'Outros') as grupo,
    coalesce(eq.nome, 'Outros') as equipamento,
    coalesce((
      select array_agg(cms.nome order by cms.nome)
      from public.exercicio_secundarios es
      join public.categorias_musculares cms on cms.id = es.categoria_id
      where es.exercicio_id = e.id
    ), array[]::text[]) as grupos_secundarios
  from public.exercicios e
  left join public.categorias_musculares cm on cm.id = e.categoria_id
  left join public.equipamentos eq on eq.id = e.equipamento_id
  where e.ativo = true and (e.publico = true or e.criado_por = auth.uid())
  order by e.nome;
$$;
grant execute on function public.catalogo_exercicios_v2() to authenticated;

create table if not exists public.fichas_compartilhamentos (
  id uuid primary key default gen_random_uuid(),
  ficha_origem_id uuid references public.fichas(id) on delete set null,
  ficha_copia_id uuid references public.fichas(id) on delete set null,
  remetente_id uuid not null references public.usuarios(id) on delete cascade,
  destinatario_id uuid not null references public.usuarios(id) on delete cascade,
  nome_original text not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_fichas_compartilhamentos_remetente
  on public.fichas_compartilhamentos(remetente_id, criado_em desc);
create index if not exists idx_fichas_compartilhamentos_destinatario
  on public.fichas_compartilhamentos(destinatario_id, criado_em desc);

alter table public.fichas_compartilhamentos enable row level security;
drop policy if exists compartilhamento_le_participante on public.fichas_compartilhamentos;
create policy compartilhamento_le_participante
on public.fichas_compartilhamentos for select to authenticated
using (remetente_id = (select auth.uid()) or destinatario_id = (select auth.uid()));

-- Busca somente dados básicos necessários para iniciar chat/compartilhamento.
create or replace function public.buscar_usuarios_colaboracao(p_busca text)
returns table(id uuid, nome text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.nome, u.email
  from public.usuarios u
  where auth.uid() is not null
    and u.ativo = true
    and u.id <> auth.uid()
    and length(btrim(coalesce(p_busca,''))) >= 3
    and (
      lower(u.email) = lower(btrim(p_busca))
      or lower(u.nome) like '%' || lower(btrim(p_busca)) || '%'
    )
  order by case when lower(u.email) = lower(btrim(p_busca)) then 0 else 1 end, u.nome
  limit 20;
$$;
revoke all on function public.buscar_usuarios_colaboracao(text) from public;
grant execute on function public.buscar_usuarios_colaboracao(text) to authenticated;

create or replace function public.obter_usuario_colaboracao(p_usuario_id uuid)
returns table(id uuid, nome text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.nome, u.email
  from public.usuarios u
  where auth.uid() is not null
    and u.ativo = true
    and u.id = p_usuario_id
    and u.id <> auth.uid()
  limit 1;
$$;
revoke all on function public.obter_usuario_colaboracao(uuid) from public;
grant execute on function public.obter_usuario_colaboracao(uuid) to authenticated;

-- Conversas existentes, sempre limitadas ao usuário autenticado.
create or replace function public.listar_conversas()
returns table(
  usuario_id uuid,
  nome text,
  email text,
  ultima_mensagem text,
  ultima_em timestamptz,
  nao_lidas bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with participantes as (
    select distinct case
      when m.remetente_id = auth.uid() then m.destinatario_id
      else m.remetente_id
    end as outro_id
    from public.mensagens m
    where m.remetente_id = auth.uid() or m.destinatario_id = auth.uid()
  )
  select
    u.id,
    u.nome,
    u.email,
    ultima.texto,
    ultima.criado_em,
    coalesce(nl.qtd,0)::bigint
  from participantes p
  join public.usuarios u on u.id = p.outro_id and u.ativo = true
  left join lateral (
    select m.texto, m.criado_em
    from public.mensagens m
    where (m.remetente_id = auth.uid() and m.destinatario_id = u.id)
       or (m.remetente_id = u.id and m.destinatario_id = auth.uid())
    order by m.criado_em desc
    limit 1
  ) ultima on true
  left join lateral (
    select count(*) qtd
    from public.mensagens m
    where m.remetente_id = u.id
      and m.destinatario_id = auth.uid()
      and m.lida_em is null
  ) nl on true
  where auth.uid() is not null
  order by ultima.criado_em desc nulls last;
$$;
revoke all on function public.listar_conversas() from public;
grant execute on function public.listar_conversas() to authenticated;

create or replace function public.marcar_conversa_lida(p_usuario_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_qtd integer := 0;
begin
  if v_uid is null then
    raise exception 'Usuario nao autenticado';
  end if;

  update public.mensagens
  set lida_em = coalesce(lida_em, now())
  where remetente_id = p_usuario_id
    and destinatario_id = v_uid
    and lida_em is null;

  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;
revoke all on function public.marcar_conversa_lida(uuid) from public;
grant execute on function public.marcar_conversa_lida(uuid) to authenticated;

create or replace function public.contar_mensagens_nao_lidas()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.mensagens
  where destinatario_id = auth.uid() and lida_em is null;
$$;
revoke all on function public.contar_mensagens_nao_lidas() from public;
grant execute on function public.contar_mensagens_nao_lidas() to authenticated;

-- Mensagens continuam privadas entre remetente e destinatário.
drop policy if exists mensagem_envio on public.mensagens;
create policy mensagem_envio
on public.mensagens for insert to authenticated
with check (
  remetente_id = (select auth.uid())
  and destinatario_id <> (select auth.uid())
  and exists (
    select 1 from public.usuarios u
    where u.id = destinatario_id and u.ativo = true
  )
);

-- Leitura é feita por RPC para impedir que um destinatário edite texto/remetente.
revoke update on table public.mensagens from authenticated;

create index if not exists idx_mensagens_conversa_remetente
  on public.mensagens(remetente_id, destinatario_id, criado_em desc);
create index if not exists idx_mensagens_conversa_destinatario
  on public.mensagens(destinatario_id, remetente_id, criado_em desc);

-- Realtime para novas mensagens. É idempotente.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'mensagens'
     ) then
    alter publication supabase_realtime add table public.mensagens;
  end if;
end $$;

-- Helper interno: exercícios privados usados em uma ficha compartilhada são clonados
-- para o destinatário. Exercícios públicos continuam referenciando o mesmo catálogo.
create or replace function public.clonar_exercicio_para_usuario(
  p_exercicio_id uuid,
  p_destinatario_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ex public.exercicios%rowtype;
  v_novo_id uuid;
begin
  select * into v_ex from public.exercicios where id = p_exercicio_id;
  if not found then
    raise exception 'Exercicio nao encontrado';
  end if;

  if coalesce(v_ex.publico,true) then
    return v_ex.id;
  end if;

  select e.id into v_novo_id
  from public.exercicios e
  where e.criado_por = p_destinatario_id
    and e.publico = false
    and lower(btrim(e.nome)) = lower(btrim(v_ex.nome))
  limit 1;

  if v_novo_id is not null then
    return v_novo_id;
  end if;

  insert into public.exercicios(
    nome, categoria_id, equipamento_id, nivel, tipo, descricao, instrucoes,
    erros_comuns, imagem_url, video_url, observacoes, criado_por, academia_id,
    publico, ativo, fonte, fonte_id, atualizado_em,
    video_embutido_url, video_embutido_licenca, video_embutido_autor
  ) values (
    v_ex.nome, v_ex.categoria_id, v_ex.equipamento_id, v_ex.nivel, v_ex.tipo,
    v_ex.descricao, v_ex.instrucoes, v_ex.erros_comuns, v_ex.imagem_url,
    v_ex.video_url, v_ex.observacoes, p_destinatario_id, null,
    false, true, null, null, now(),
    v_ex.video_embutido_url, v_ex.video_embutido_licenca, v_ex.video_embutido_autor
  ) returning id into v_novo_id;

  insert into public.exercicio_secundarios(exercicio_id, categoria_id)
  select v_novo_id, es.categoria_id
  from public.exercicio_secundarios es
  where es.exercicio_id = v_ex.id
  on conflict do nothing;

  return v_novo_id;
end;
$$;
revoke all on function public.clonar_exercicio_para_usuario(uuid,uuid) from public, anon, authenticated;

-- Compartilhamento sempre cria uma cópia rascunho. A ficha original nunca é alterada.
create or replace function public.compartilhar_ficha_copia(
  p_ficha_id uuid,
  p_destinatario_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_destino uuid;
  v_origem public.fichas%rowtype;
  v_nova_ficha uuid;
  v_div record;
  v_nova_div uuid;
  v_serie record;
  v_exercicio uuid;
  v_substituto uuid;
begin
  if v_uid is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select * into v_origem
  from public.fichas
  where id = p_ficha_id and aluno_id = v_uid;

  if not found then
    raise exception 'Ficha nao encontrada ou sem permissao';
  end if;

  select u.id into v_destino
  from public.usuarios u
  where lower(u.email) = lower(btrim(p_destinatario_email))
    and u.ativo = true
  limit 1;

  if v_destino is null then
    raise exception 'Usuario nao encontrado';
  end if;
  if v_destino = v_uid then
    raise exception 'Escolha outro usuario para compartilhar';
  end if;

  insert into public.fichas(
    aluno_id, personal_id, nome, objetivo, data_inicio, data_validade,
    dias_semana, nivel, status, observacoes, atualizado_por
  ) values (
    v_destino, null, v_origem.nome, v_origem.objetivo, v_origem.data_inicio,
    v_origem.data_validade, v_origem.dias_semana, v_origem.nivel,
    'rascunho', v_origem.observacoes, v_uid
  ) returning id into v_nova_ficha;

  for v_div in
    select * from public.divisoes_treino
    where ficha_id = v_origem.id
    order by ordem
  loop
    insert into public.divisoes_treino(ficha_id,codigo,nome,ordem)
    values(v_nova_ficha,v_div.codigo,v_div.nome,v_div.ordem)
    returning id into v_nova_div;

    for v_serie in
      select * from public.series_planejadas
      where divisao_id = v_div.id
      order by ordem
    loop
      v_exercicio := public.clonar_exercicio_para_usuario(v_serie.exercicio_id, v_destino);
      v_substituto := case when v_serie.substituto_id is null then null
        else public.clonar_exercicio_para_usuario(v_serie.substituto_id, v_destino) end;

      insert into public.series_planejadas(
        divisao_id, exercicio_id, ordem, series, rep_min, rep_max,
        carga_sugerida, descanso_seg, cadencia, tecnica, rir, pse_alvo,
        tempo_exec_seg, series_aquecimento, substituto_id, observacoes
      ) values (
        v_nova_div, v_exercicio, v_serie.ordem, v_serie.series,
        v_serie.rep_min, v_serie.rep_max, v_serie.carga_sugerida,
        v_serie.descanso_seg, v_serie.cadencia, v_serie.tecnica,
        v_serie.rir, v_serie.pse_alvo, v_serie.tempo_exec_seg,
        v_serie.series_aquecimento, v_substituto, v_serie.observacoes
      );
    end loop;
  end loop;

  insert into public.fichas_compartilhamentos(
    ficha_origem_id, ficha_copia_id, remetente_id, destinatario_id, nome_original
  ) values (v_origem.id, v_nova_ficha, v_uid, v_destino, v_origem.nome);

  insert into public.mensagens(remetente_id,destinatario_id,ficha_id,texto)
  values(v_uid,v_destino,v_nova_ficha,'Compartilhei a ficha "' || v_origem.nome || '" com voce.');

  return v_nova_ficha;
end;
$$;
revoke all on function public.compartilhar_ficha_copia(uuid,text) from public;
grant execute on function public.compartilhar_ficha_copia(uuid,text) to authenticated;
