-- Complemento da Etapa 2.
-- Fecha o último FK sem índice e remove o privilégio SECURITY DEFINER do RPC de logs.

create index if not exists idx_exercicios_equipamento
  on public.exercicios(equipamento_id);

-- O próprio usuário só pode inserir uma linha de log cujo usuario_id seja o seu auth.uid().
drop policy if exists log_proprio_insercao on public.logs_atividade;
create policy log_proprio_insercao
  on public.logs_atividade
  for insert
  to authenticated
  with check (usuario_id = (select auth.uid()));

-- Minimiza privilégios diretos da tabela de auditoria.
revoke all on public.logs_atividade from anon;
revoke all on public.logs_atividade from authenticated;
grant select, insert on public.logs_atividade to authenticated;

revoke all on sequence public.logs_atividade_id_seq from anon;
revoke all on sequence public.logs_atividade_id_seq from authenticated;
grant usage, select on sequence public.logs_atividade_id_seq to authenticated;

-- A função já valida auth.uid() e grava sempre o usuário da sessão.
-- Com SECURITY INVOKER, o INSERT também passa pela política RLS acima.
alter function public.registrar_log_atividade(text, text, uuid, jsonb) security invoker;
revoke execute on function public.registrar_log_atividade(text, text, uuid, jsonb) from public;
revoke execute on function public.registrar_log_atividade(text, text, uuid, jsonb) from anon;
grant execute on function public.registrar_log_atividade(text, text, uuid, jsonb) to authenticated;
