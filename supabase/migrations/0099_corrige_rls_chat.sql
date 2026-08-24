-- Corrige o envio direto de mensagens entre usuários autenticados.
-- A validação anterior consultava public.usuarios dentro da policy de INSERT.
-- Como usuarios possui RLS e cada usuário não enxerga os demais diretamente,
-- o destinatário legítimo era interpretado como inexistente e o INSERT era bloqueado.
-- A existência do remetente e destinatário continua garantida pelas FKs da tabela mensagens.

drop policy if exists mensagem_envio on public.mensagens;

create policy mensagem_envio
on public.mensagens
for insert
to authenticated
with check (
  remetente_id = (select auth.uid())
  and destinatario_id <> (select auth.uid())
);
