-- Remove excecoes antigas de Personal/Admin. O aplicativo agora e estritamente conta pessoal.

drop policy if exists exercicio_escrita on public.exercicios;
drop policy if exists exercicio_leitura on public.exercicios;
create policy exercicio_leitura on public.exercicios
for select to authenticated
using (publico = true or criado_por = auth.uid());

drop policy if exists log_somente_admin on public.logs_atividade;
create policy log_proprio_leitura on public.logs_atividade
for select to authenticated using (usuario_id = auth.uid());

drop policy if exists mensagem_acesso on public.mensagens;
create policy mensagem_acesso on public.mensagens
for select to authenticated
using (remetente_id = auth.uid() or destinatario_id = auth.uid());

drop policy if exists perfil_personal_leitura on public.perfis_personal;
drop policy if exists perfil_personal_escrita on public.perfis_personal;
create policy perfil_personal_proprio_leitura on public.perfis_personal
for select to authenticated using (usuario_id = auth.uid());
create policy perfil_personal_proprio_escrita on public.perfis_personal
for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Funcoes legadas deixam de ser expostas como RPC.
revoke all on function public.e_meu_aluno(uuid) from public, anon, authenticated;
revoke all on function public.papel_atual() from public, anon, authenticated;
