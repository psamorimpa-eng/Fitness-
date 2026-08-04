-- =====================================================================
-- Row Level Security: aluno vê o próprio dado, personal vê o aluno
-- vinculado, admin vê tudo.
-- =====================================================================

alter table usuarios              enable row level security;
alter table perfis_aluno          enable row level security;
alter table perfis_personal       enable row level security;
alter table fichas                enable row level security;
alter table divisoes_treino       enable row level security;
alter table series_planejadas     enable row level security;
alter table treinos_realizados    enable row level security;
alter table series_realizadas     enable row level security;
alter table medidas_corporais     enable row level security;
alter table avaliacoes_fisicas    enable row level security;
alter table fotos_evolucao        enable row level security;
alter table mensagens             enable row level security;
alter table notificacoes          enable row level security;
alter table exercicios            enable row level security;
alter table logs_atividade        enable row level security;

-- ------------------------------------------------------------- usuarios
create policy usuario_le_a_si on usuarios for select
  using (id = auth.uid() or papel_atual() = 'admin' or e_meu_aluno(id));
create policy usuario_edita_a_si on usuarios for update
  using (id = auth.uid() or papel_atual() = 'admin');

create policy perfil_aluno_leitura on perfis_aluno for select
  using (usuario_id = auth.uid() or personal_id = auth.uid() or papel_atual() = 'admin');
create policy perfil_aluno_escrita on perfis_aluno for update
  using (usuario_id = auth.uid() or personal_id = auth.uid() or papel_atual() = 'admin');

-- --------------------------------------------------------------- fichas
-- Regra 6 e 7: o aluno apenas lê a ficha, quem edita é o personal vinculado
create policy ficha_leitura on fichas for select
  using (aluno_id = auth.uid() or personal_id = auth.uid() or papel_atual() = 'admin');
create policy ficha_escrita on fichas for all
  using (personal_id = auth.uid() or papel_atual() = 'admin')
  with check (personal_id = auth.uid() or papel_atual() = 'admin');

create policy divisao_leitura on divisoes_treino for select
  using (exists (select 1 from fichas f where f.id = ficha_id
                  and (f.aluno_id = auth.uid() or f.personal_id = auth.uid() or papel_atual() = 'admin')));
create policy divisao_escrita on divisoes_treino for all
  using (exists (select 1 from fichas f where f.id = ficha_id
                  and (f.personal_id = auth.uid() or papel_atual() = 'admin')));

create policy serie_plan_leitura on series_planejadas for select
  using (exists (select 1 from divisoes_treino d join fichas f on f.id = d.ficha_id
                  where d.id = divisao_id
                    and (f.aluno_id = auth.uid() or f.personal_id = auth.uid() or papel_atual() = 'admin')));
create policy serie_plan_escrita on series_planejadas for all
  using (exists (select 1 from divisoes_treino d join fichas f on f.id = d.ficha_id
                  where d.id = divisao_id and (f.personal_id = auth.uid() or papel_atual() = 'admin')));

-- ------------------------------------------------------------- execução
create policy treino_do_aluno on treinos_realizados for all
  using (aluno_id = auth.uid())
  with check (aluno_id = auth.uid());
create policy treino_visto_pelo_personal on treinos_realizados for select
  using (e_meu_aluno(aluno_id) or papel_atual() = 'admin');

create policy serie_do_aluno on series_realizadas for all
  using (exists (select 1 from treinos_realizados t where t.id = treino_id and t.aluno_id = auth.uid()))
  with check (exists (select 1 from treinos_realizados t where t.id = treino_id and t.aluno_id = auth.uid()));
create policy serie_vista_pelo_personal on series_realizadas for select
  using (exists (select 1 from treinos_realizados t where t.id = treino_id
                  and (e_meu_aluno(t.aluno_id) or papel_atual() = 'admin')));

-- -------------------------------------------------------- acompanhamento
create policy medidas_acesso on medidas_corporais for all
  using (aluno_id = auth.uid() or e_meu_aluno(aluno_id) or papel_atual() = 'admin')
  with check (aluno_id = auth.uid() or e_meu_aluno(aluno_id) or papel_atual() = 'admin');

create policy avaliacao_acesso on avaliacoes_fisicas for all
  using (aluno_id = auth.uid() or e_meu_aluno(aluno_id) or papel_atual() = 'admin');

-- Fotos são privadas por padrão: o personal só vê o que o aluno liberou
create policy foto_do_aluno on fotos_evolucao for all
  using (aluno_id = auth.uid())
  with check (aluno_id = auth.uid());
create policy foto_liberada_ao_personal on fotos_evolucao for select
  using (visivel_para_personal and e_meu_aluno(aluno_id));

-- --------------------------------------------------------- comunicação
create policy mensagem_acesso on mensagens for select
  using (remetente_id = auth.uid() or destinatario_id = auth.uid() or papel_atual() = 'admin');
create policy mensagem_envio on mensagens for insert
  with check (remetente_id = auth.uid());

create policy notificacao_acesso on notificacoes for all
  using (usuario_id = auth.uid() or papel_atual() = 'admin');

-- ------------------------------------------------------------ catálogo
create policy exercicio_leitura on exercicios for select
  using (publico or criado_por = auth.uid() or papel_atual() = 'admin'
         or academia_id = (select academia_id from usuarios where id = auth.uid()));
create policy exercicio_escrita on exercicios for all
  using (papel_atual() in ('personal','admin'))
  with check (papel_atual() in ('personal','admin'));

create policy log_somente_admin on logs_atividade for select using (papel_atual() = 'admin');

-- --------------------------------------------------------------- storage
-- bucket privado das fotos de evolução: caminho começa com o id do aluno
insert into storage.buckets (id, name, public) values ('evolucao', 'evolucao', false)
on conflict do nothing;

create policy "foto propria upload" on storage.objects for insert
  with check (bucket_id = 'evolucao' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "foto propria leitura" on storage.objects for select
  using (bucket_id = 'evolucao' and (storage.foldername(name))[1] = auth.uid()::text);
