-- =====================================================================
-- perfis_personal ficou com RLS ligado desde a 0003, mas sem nenhuma
-- política. Sem política, a tabela fica bloqueada por padrão, e o
-- personal não consegue nem ler o próprio registro.
-- =====================================================================

create policy perfil_personal_leitura on perfis_personal for select
  using (usuario_id = auth.uid() or papel_atual() = 'admin');

create policy perfil_personal_escrita on perfis_personal for update
  using (usuario_id = auth.uid() or papel_atual() = 'admin');
