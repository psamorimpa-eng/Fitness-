-- Etapa 2: hardening e performance sem alterar regras de negócio.
-- 1) Otimiza chamadas a auth.uid() nas políticas RLS.
-- 2) Remove políticas SELECT redundantes quando uma política ALL já cobre a leitura.
-- 3) Restringe políticas que estavam atribuídas a PUBLIC para authenticated.
-- 4) Explicita bloqueio da tabela permissoes enquanto ela não é usada pela aplicação.
-- 5) Remove índice duplicado e adiciona índices de apoio às chaves estrangeiras.
-- 6) Mantém registrar_log_atividade como SECURITY DEFINER, mas limita EXECUTE a authenticated.

-- RLS: políticas próprias com auth.uid() inicializado uma única vez por consulta.
alter policy agenda_propria on public.agenda_treinos
  to authenticated
  using (aluno_id = (select auth.uid()))
  with check (aluno_id = (select auth.uid()));

alter policy assinatura_propria_leitura on public.assinaturas
  to authenticated
  using (usuario_id = (select auth.uid()));

alter policy avaliacao_propria on public.avaliacoes_fisicas
  to authenticated
  using (aluno_id = (select auth.uid()))
  with check (aluno_id = (select auth.uid()));

alter policy exercicio_leitura on public.exercicios
  to authenticated
  using ((publico = true) or (criado_por = (select auth.uid())));

alter policy nao_realizados_proprios on public.exercicios_nao_realizados
  to authenticated
  using (exists (
    select 1
    from public.treinos_realizados t
    where t.id = exercicios_nao_realizados.treino_id
      and t.aluno_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.treinos_realizados t
    where t.id = exercicios_nao_realizados.treino_id
      and t.aluno_id = (select auth.uid())
  ));

alter policy ficha_escrita_propria on public.fichas
  to authenticated
  using (aluno_id = (select auth.uid()))
  with check (aluno_id = (select auth.uid()));

drop policy if exists ficha_leitura_propria on public.fichas;

alter policy divisao_escrita_propria on public.divisoes_treino
  to authenticated
  using (exists (
    select 1 from public.fichas f
    where f.id = divisoes_treino.ficha_id
      and f.aluno_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.fichas f
    where f.id = divisoes_treino.ficha_id
      and f.aluno_id = (select auth.uid())
  ));

drop policy if exists divisao_leitura_propria on public.divisoes_treino;

alter policy serie_plan_escrita_propria on public.series_planejadas
  to authenticated
  using (exists (
    select 1
    from public.divisoes_treino d
    join public.fichas f on f.id = d.ficha_id
    where d.id = series_planejadas.divisao_id
      and f.aluno_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.divisoes_treino d
    join public.fichas f on f.id = d.ficha_id
    where d.id = series_planejadas.divisao_id
      and f.aluno_id = (select auth.uid())
  ));

drop policy if exists serie_plan_leitura_propria on public.series_planejadas;

alter policy foto_do_aluno on public.fotos_evolucao
  to authenticated
  using (aluno_id = (select auth.uid()))
  with check (aluno_id = (select auth.uid()));

alter policy medidas_proprias on public.medidas_corporais
  to authenticated
  using (aluno_id = (select auth.uid()))
  with check (aluno_id = (select auth.uid()));

alter policy mensagem_acesso on public.mensagens
  to authenticated
  using ((remetente_id = (select auth.uid())) or (destinatario_id = (select auth.uid())));

alter policy mensagem_envio on public.mensagens
  to authenticated
  with check (remetente_id = (select auth.uid()));

alter policy notificacao_propria on public.notificacoes
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy pagamento_proprio_leitura on public.pagamentos
  to authenticated
  using (exists (
    select 1 from public.assinaturas a
    where a.id = pagamentos.assinatura_id
      and a.usuario_id = (select auth.uid())
  ));

alter policy perfil_aluno_escrita on public.perfis_aluno
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy perfil_aluno_leitura on public.perfis_aluno
  to authenticated
  using (usuario_id = (select auth.uid()));

alter policy perfil_personal_proprio_escrita on public.perfis_personal
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy perfil_personal_proprio_leitura on public.perfis_personal
  to authenticated
  using (usuario_id = (select auth.uid()));

alter policy preferencias_proprias on public.preferencias_notificacao
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy recordes_proprios_leitura on public.recordes_pessoais
  to authenticated
  using (aluno_id = (select auth.uid()));

alter policy serie_do_aluno on public.series_realizadas
  to authenticated
  using (exists (
    select 1 from public.treinos_realizados t
    where t.id = series_realizadas.treino_id
      and t.aluno_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.treinos_realizados t
    where t.id = series_realizadas.treino_id
      and t.aluno_id = (select auth.uid())
  ));

alter policy treino_do_aluno on public.treinos_realizados
  to authenticated
  using (aluno_id = (select auth.uid()))
  with check (aluno_id = (select auth.uid()));

alter policy usuario_edita_a_si on public.usuarios
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy usuario_le_a_si on public.usuarios
  to authenticated
  using (id = (select auth.uid()));

alter policy log_proprio_leitura on public.logs_atividade
  to authenticated
  using (usuario_id = (select auth.uid()));

-- A tabela ainda não é consumida pela aplicação. A política falsa documenta e mantém deny-by-default.
drop policy if exists permissoes_bloqueadas on public.permissoes;
create policy permissoes_bloqueadas
  on public.permissoes
  for select
  to authenticated
  using (false);

-- O RPC de auditoria permanece SECURITY DEFINER por desenho para que usuários não tenham INSERT direto
-- em logs_atividade. Restringimos a superfície de execução apenas a sessões autenticadas.
revoke execute on function public.registrar_log_atividade(text, text, uuid, jsonb) from public;
revoke execute on function public.registrar_log_atividade(text, text, uuid, jsonb) from anon;
grant execute on function public.registrar_log_atividade(text, text, uuid, jsonb) to authenticated;

-- Remove um dos dois índices idênticos da tabela fichas.
drop index if exists public.ix_fichas_aluno_status;

-- Índices de apoio às FKs e consultas mais frequentes. Todos usam IF NOT EXISTS para idempotência.
create index if not exists idx_agenda_treinos_divisao on public.agenda_treinos(divisao_id);

create index if not exists idx_assinaturas_academia on public.assinaturas(academia_id);
create index if not exists idx_assinaturas_plano on public.assinaturas(plano_id);
create index if not exists idx_assinaturas_usuario on public.assinaturas(usuario_id);

create index if not exists idx_avaliacoes_aluno_data on public.avaliacoes_fisicas(aluno_id, data desc);
create index if not exists idx_avaliacoes_avaliador on public.avaliacoes_fisicas(avaliador_id);
create index if not exists idx_avaliacoes_medida on public.avaliacoes_fisicas(medida_id);

create index if not exists idx_exercicio_secundarios_categoria on public.exercicio_secundarios(categoria_id);
create index if not exists idx_exercicio_substitutos_substituto on public.exercicio_substitutos(substituto_id);

create index if not exists idx_exercicios_academia on public.exercicios(academia_id);
create index if not exists idx_exercicios_categoria on public.exercicios(categoria_id);
create index if not exists idx_exercicios_criado_por on public.exercicios(criado_por);

create index if not exists idx_exercicios_nao_realizados_exercicio on public.exercicios_nao_realizados(exercicio_id);

create index if not exists idx_fichas_atualizado_por on public.fichas(atualizado_por);
create index if not exists idx_fichas_personal on public.fichas(personal_id);

create index if not exists idx_fotos_evolucao_aluno_data on public.fotos_evolucao(aluno_id, data desc);
create index if not exists idx_medidas_registrado_por on public.medidas_corporais(registrado_por);

create index if not exists idx_mensagens_exercicio on public.mensagens(exercicio_id);
create index if not exists idx_mensagens_ficha on public.mensagens(ficha_id);
create index if not exists idx_mensagens_remetente_criado on public.mensagens(remetente_id, criado_em desc);

create index if not exists idx_notificacoes_usuario_criado on public.notificacoes(usuario_id, criado_em desc);
create index if not exists idx_pagamentos_assinatura on public.pagamentos(assinatura_id);

create index if not exists idx_recordes_exercicio on public.recordes_pessoais(exercicio_id);
create index if not exists idx_recordes_serie on public.recordes_pessoais(serie_id);

create index if not exists idx_series_planejadas_exercicio on public.series_planejadas(exercicio_id);
create index if not exists idx_series_planejadas_substituto on public.series_planejadas(substituto_id);

create index if not exists idx_treinos_divisao on public.treinos_realizados(divisao_id);
create index if not exists idx_treinos_ficha on public.treinos_realizados(ficha_id);

create index if not exists idx_usuarios_academia on public.usuarios(academia_id);
