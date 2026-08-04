-- =====================================================================
-- Dados de demonstração
-- Usuários de teste precisam existir antes em auth.users. Use:
--   npx supabase db reset          (roda migrations + este seed)
--   node scripts/criar-usuarios.mjs  (cria as contas no Auth)
-- Senha de todas as contas de demonstração: 123456
-- =====================================================================

-- --------------------------------------------------------------- catálogos
insert into categorias_musculares (nome, tipo) values
  ('Peitoral','muscular'), ('Costas','muscular'), ('Ombros','muscular'), ('Bíceps','muscular'),
  ('Tríceps','muscular'), ('Antebraços','muscular'), ('Abdômen','muscular'), ('Lombar','muscular'),
  ('Quadríceps','muscular'), ('Posterior de coxa','muscular'), ('Glúteos','muscular'),
  ('Panturrilhas','muscular'), ('Adutores','muscular'), ('Abdutores','muscular'),
  ('Trapézio','muscular'), ('Corpo inteiro','funcional'), ('Cardio','funcional'),
  ('Mobilidade','funcional'), ('Alongamento','funcional')
on conflict (nome) do nothing;

insert into equipamentos (nome) values
  ('Barra'), ('Halteres'), ('Máquina'), ('Polia'), ('Peso corporal'), ('Elástico'),
  ('Kettlebell'), ('Banco'), ('Smith'), ('Leg press'), ('Esteira'), ('Bicicleta'),
  ('Elíptico'), ('Escada'), ('Outros')
on conflict (nome) do nothing;

insert into planos (id, nome, preco_mensal, limite_alunos, limite_fichas, dias_gratuitos, recursos) values
  ('free','Gratuito', 0, 0, 1, 0, '{"historico_dias":30}'),
  ('premium','Aluno premium', 19.90, 0, null, 7, '{"fotos":true,"relatorios":true}'),
  ('personal','Personal individual', 79.90, 40, null, 14, '{"avaliacoes":true,"relatorios":true}'),
  ('academia','Academia', 349.90, 600, null, 14, '{"personais":10,"identidade_visual":true}'),
  ('empresarial','Empresarial', 0, null, null, 0, '{"api":true,"multiunidade":true}')
on conflict (id) do nothing;

insert into permissoes (papel, recurso, acao) values
  ('aluno','ficha','ler'), ('aluno','treino','criar'), ('aluno','treino','ler'),
  ('aluno','medidas','criar'), ('aluno','medidas','ler'), ('aluno','perfil','editar'),
  ('personal','aluno','criar'), ('personal','ficha','criar'), ('personal','ficha','editar'),
  ('personal','exercicio','criar'), ('personal','avaliacao','criar'), ('personal','relatorio','ler'),
  ('admin','usuario','editar'), ('admin','plano','editar'), ('admin','academia','criar'),
  ('admin','log','ler'), ('admin','permissao','editar')
on conflict do nothing;

-- --------------------------------------------------------------- academias
insert into academias (id, nome, unidade, cidade, uf) values
  ('a0000001-0000-4000-8000-000000000000','Iron House Lapa','Matriz','São Paulo','SP'),
  ('a0000002-0000-4000-8000-000000000000','Iron House Vila Anastácio','Filial 01','São Paulo','SP')
on conflict do nothing;

-- exercícios do banco inicial (78 itens)
insert into exercicios (id, nome, categoria_id, equipamento_id, nivel, tipo, instrucoes, erros_comuns, publico) values
  ('00000001-0000-4000-8000-000000000000', 'Supino reto com barra', (select id from categorias_musculares where nome = 'Peitoral'), (select id from equipamentos where nome = 'Barra'), 'Intermediário', 'Força', 'Escápulas retraídas, pés firmes, barra desce na linha do mamilo e sobe sem travar o cotovelo.', 'Quicar a barra no peito e afastar demais os cotovelos do tronco.', true),
  ('00000002-0000-4000-8000-000000000000', 'Supino inclinado com halteres', (select id from categorias_musculares where nome = 'Peitoral'), (select id from equipamentos where nome = 'Halteres'), 'Intermediário', 'Hipertrofia', 'Banco a 30 graus, halteres descem até a altura do peito, punhos alinhados aos cotovelos.', 'Inclinar o banco acima de 45 graus e transferir o esforço para o ombro.', true),
  ('00000003-0000-4000-8000-000000000000', 'Supino declinado com barra', (select id from categorias_musculares where nome = 'Peitoral'), (select id from equipamentos where nome = 'Barra'), 'Intermediário', 'Hipertrofia', 'Banco declinado, barra desce na parte baixa do peitoral com controle.', 'Perder a estabilidade dos pés e descer a barra muito próximo do pescoço.', true),
  ('00000004-0000-4000-8000-000000000000', 'Voador na máquina', (select id from categorias_musculares where nome = 'Peitoral'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Cotovelos levemente flexionados, junte os braços sentindo o encurtamento do peitoral.', 'Estender demais o cotovelo e forçar o ombro na abertura máxima.', true),
  ('00000005-0000-4000-8000-000000000000', 'Crossover na polia', (select id from categorias_musculares where nome = 'Peitoral'), (select id from equipamentos where nome = 'Polia'), 'Intermediário', 'Hipertrofia', 'Tronco levemente à frente, cruze as mãos na linha do abdômen e retorne controlando.', 'Usar o tronco para dar impulso e reduzir a amplitude.', true),
  ('00000006-0000-4000-8000-000000000000', 'Flexão de braço', (select id from categorias_musculares where nome = 'Peitoral'), (select id from equipamentos where nome = 'Peso corporal'), 'Iniciante', 'Resistência', 'Corpo em prancha, desce até o peito quase encostar no solo, cotovelos a 45 graus.', 'Quadril caído e amplitude parcial.', true),
  ('00000007-0000-4000-8000-000000000000', 'Supino na máquina', (select id from categorias_musculares where nome = 'Peitoral'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Ajuste o banco para as pegadas ficarem na linha do peito e empurre sem travar o cotovelo.', 'Sentar muito baixo e empurrar acima da linha do ombro.', true),
  ('00000008-0000-4000-8000-000000000000', 'Pullover com halter', (select id from categorias_musculares where nome = 'Peitoral'), (select id from equipamentos where nome = 'Halteres'), 'Intermediário', 'Hipertrofia', 'Deitado no banco, leve o halter atrás da cabeça com cotovelos semiflexionados.', 'Hiperestender a lombar e usar carga excessiva.', true),
  ('00000009-0000-4000-8000-000000000000', 'Puxada frente na polia', (select id from categorias_musculares where nome = 'Costas'), (select id from equipamentos where nome = 'Polia'), 'Iniciante', 'Hipertrofia', 'Peito aberto, puxe a barra até a clavícula conduzindo os cotovelos para baixo.', 'Jogar o tronco para trás e puxar a barra atrás da nuca.', true),
  ('00000010-0000-4000-8000-000000000000', 'Puxada supinada', (select id from categorias_musculares where nome = 'Costas'), (select id from equipamentos where nome = 'Polia'), 'Iniciante', 'Hipertrofia', 'Pegada supinada na largura dos ombros, puxe até o peito mantendo escápulas deprimidas.', 'Encurtar a amplitude e puxar apenas com o bíceps.', true),
  ('00000011-0000-4000-8000-000000000000', 'Remada curvada com barra', (select id from categorias_musculares where nome = 'Costas'), (select id from equipamentos where nome = 'Barra'), 'Avançado', 'Força', 'Tronco a 45 graus, coluna neutra, puxe a barra em direção ao umbigo.', 'Arredondar a lombar e usar impulso do quadril.', true),
  ('00000012-0000-4000-8000-000000000000', 'Remada unilateral com halter', (select id from categorias_musculares where nome = 'Costas'), (select id from equipamentos where nome = 'Halteres'), 'Iniciante', 'Hipertrofia', 'Apoio no banco, puxe o halter rente ao tronco levando o cotovelo para trás.', 'Rotacionar o tronco para completar o movimento.', true),
  ('00000013-0000-4000-8000-000000000000', 'Remada baixa na polia', (select id from categorias_musculares where nome = 'Costas'), (select id from equipamentos where nome = 'Polia'), 'Iniciante', 'Hipertrofia', 'Coluna neutra, puxe o triângulo até o abdômen e retorne alongando as escápulas.', 'Balançar o tronco para frente e para trás.', true),
  ('00000014-0000-4000-8000-000000000000', 'Barra fixa', (select id from categorias_musculares where nome = 'Costas'), (select id from equipamentos where nome = 'Peso corporal'), 'Avançado', 'Força', 'Pegada pronada, suba até o queixo passar a barra sem balançar as pernas.', 'Usar impulso de quadril e descer sem controle.', true),
  ('00000015-0000-4000-8000-000000000000', 'Remada na máquina', (select id from categorias_musculares where nome = 'Costas'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Peito apoiado, puxe as alavancas até a linha do abdômen.', 'Descolar o peito do apoio para ganhar amplitude.', true),
  ('00000016-0000-4000-8000-000000000000', 'Pulldown com braço estendido', (select id from categorias_musculares where nome = 'Costas'), (select id from equipamentos where nome = 'Polia'), 'Intermediário', 'Hipertrofia', 'Braços estendidos, empurre a barra até a coxa mantendo o cotovelo fixo.', 'Flexionar o cotovelo e transformar em tríceps.', true),
  ('00000017-0000-4000-8000-000000000000', 'Desenvolvimento com halteres', (select id from categorias_musculares where nome = 'Ombros'), (select id from equipamentos where nome = 'Halteres'), 'Intermediário', 'Hipertrofia', 'Sentado com apoio, empurre os halteres até quase a extensão total.', 'Hiperestender a lombar e bater os halteres no topo.', true),
  ('00000018-0000-4000-8000-000000000000', 'Desenvolvimento na máquina', (select id from categorias_musculares where nome = 'Ombros'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Ajuste o banco com as pegadas na linha do ombro e empurre para cima.', 'Elevar os ombros junto com a carga.', true),
  ('00000019-0000-4000-8000-000000000000', 'Elevação lateral', (select id from categorias_musculares where nome = 'Ombros'), (select id from equipamentos where nome = 'Halteres'), 'Iniciante', 'Hipertrofia', 'Eleve até a linha dos ombros com cotovelo levemente flexionado e polegar neutro.', 'Usar impulso e subir acima da linha do ombro.', true),
  ('00000020-0000-4000-8000-000000000000', 'Elevação frontal', (select id from categorias_musculares where nome = 'Ombros'), (select id from equipamentos where nome = 'Halteres'), 'Iniciante', 'Hipertrofia', 'Eleve o halter à frente até a altura dos olhos com o tronco firme.', 'Balançar o tronco para lançar o peso.', true),
  ('00000021-0000-4000-8000-000000000000', 'Crucifixo inverso', (select id from categorias_musculares where nome = 'Ombros'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Abra os braços na linha dos ombros levando os cotovelos para trás.', 'Encolher os ombros durante a abertura.', true),
  ('00000022-0000-4000-8000-000000000000', 'Remada alta', (select id from categorias_musculares where nome = 'Ombros'), (select id from equipamentos where nome = 'Barra'), 'Intermediário', 'Hipertrofia', 'Puxe a barra rente ao corpo até a linha do peito com cotovelos acima das mãos.', 'Subir acima do peito e forçar a rotação interna do ombro.', true),
  ('00000023-0000-4000-8000-000000000000', 'Encolhimento com halteres', (select id from categorias_musculares where nome = 'Ombros'), (select id from equipamentos where nome = 'Halteres'), 'Iniciante', 'Hipertrofia', 'Eleve os ombros na vertical e segure meio segundo no topo.', 'Rodar os ombros durante o movimento.', true),
  ('00000024-0000-4000-8000-000000000000', 'Rosca direta com barra', (select id from categorias_musculares where nome = 'Bíceps'), (select id from equipamentos where nome = 'Barra'), 'Iniciante', 'Hipertrofia', 'Cotovelos junto ao tronco, suba a barra até a contração máxima.', 'Balançar o tronco e afastar o cotovelo do corpo.', true),
  ('00000025-0000-4000-8000-000000000000', 'Rosca alternada', (select id from categorias_musculares where nome = 'Bíceps'), (select id from equipamentos where nome = 'Halteres'), 'Iniciante', 'Hipertrofia', 'Supine o punho durante a subida e desça controlando.', 'Subir os dois braços juntos perdendo o controle excêntrico.', true),
  ('00000026-0000-4000-8000-000000000000', 'Rosca martelo', (select id from categorias_musculares where nome = 'Bíceps'), (select id from equipamentos where nome = 'Halteres'), 'Iniciante', 'Hipertrofia', 'Pegada neutra, cotovelo fixo, suba até a altura do ombro.', 'Usar o ombro para iniciar o movimento.', true),
  ('00000027-0000-4000-8000-000000000000', 'Rosca scott', (select id from categorias_musculares where nome = 'Bíceps'), (select id from equipamentos where nome = 'Banco'), 'Intermediário', 'Hipertrofia', 'Braços apoiados no banco inclinado, desça até quase estender o cotovelo.', 'Estender totalmente com carga alta e estressar o tendão.', true),
  ('00000028-0000-4000-8000-000000000000', 'Rosca concentrada', (select id from categorias_musculares where nome = 'Bíceps'), (select id from equipamentos where nome = 'Halteres'), 'Iniciante', 'Hipertrofia', 'Cotovelo apoiado na coxa, suba concentrando a contração.', 'Empurrar a coxa contra o braço para ajudar.', true),
  ('00000029-0000-4000-8000-000000000000', 'Rosca na polia', (select id from categorias_musculares where nome = 'Bíceps'), (select id from equipamentos where nome = 'Polia'), 'Iniciante', 'Hipertrofia', 'Tensão contínua, cotovelo fixo, retorno controlado.', 'Recuar o corpo para vencer a carga.', true),
  ('00000030-0000-4000-8000-000000000000', 'Tríceps na polia com barra', (select id from categorias_musculares where nome = 'Tríceps'), (select id from equipamentos where nome = 'Polia'), 'Iniciante', 'Hipertrofia', 'Cotovelos colados ao tronco, estenda até travar sem mover o ombro.', 'Abrir os cotovelos e inclinar o tronco.', true),
  ('00000031-0000-4000-8000-000000000000', 'Tríceps corda', (select id from categorias_musculares where nome = 'Tríceps'), (select id from equipamentos where nome = 'Polia'), 'Iniciante', 'Hipertrofia', 'Estenda e abra a corda no final do movimento.', 'Puxar com o dorso em vez de estender o cotovelo.', true),
  ('00000032-0000-4000-8000-000000000000', 'Tríceps testa', (select id from categorias_musculares where nome = 'Tríceps'), (select id from equipamentos where nome = 'Barra'), 'Intermediário', 'Hipertrofia', 'Deitado, desça a barra até a testa mantendo o braço perpendicular.', 'Mover o ombro e transformar em pullover.', true),
  ('00000033-0000-4000-8000-000000000000', 'Tríceps francês', (select id from categorias_musculares where nome = 'Tríceps'), (select id from equipamentos where nome = 'Halteres'), 'Intermediário', 'Hipertrofia', 'Halter acima da cabeça, desça atrás da nuca com cotovelos apontados para cima.', 'Abrir os cotovelos e perder a estabilidade do ombro.', true),
  ('00000034-0000-4000-8000-000000000000', 'Mergulho no banco', (select id from categorias_musculares where nome = 'Tríceps'), (select id from equipamentos where nome = 'Banco'), 'Iniciante', 'Resistência', 'Mãos no banco atrás do corpo, desça até 90 graus de cotovelo.', 'Descer demais e sobrecarregar o ombro.', true),
  ('00000035-0000-4000-8000-000000000000', 'Paralelas', (select id from categorias_musculares where nome = 'Tríceps'), (select id from equipamentos where nome = 'Peso corporal'), 'Avançado', 'Força', 'Tronco levemente inclinado, desça até 90 graus e suba estendendo.', 'Descer sem controle e projetar os ombros à frente.', true),
  ('00000036-0000-4000-8000-000000000000', 'Rosca de punho', (select id from categorias_musculares where nome = 'Antebraços'), (select id from equipamentos where nome = 'Barra'), 'Iniciante', 'Hipertrofia', 'Antebraços apoiados, flexione apenas os punhos com amplitude total.', 'Mover o cotovelo e usar carga excessiva.', true),
  ('00000037-0000-4000-8000-000000000000', 'Rosca inversa', (select id from categorias_musculares where nome = 'Antebraços'), (select id from equipamentos where nome = 'Barra'), 'Iniciante', 'Hipertrofia', 'Pegada pronada, suba a barra até a altura do peito.', 'Compensar com o tronco.', true),
  ('00000038-0000-4000-8000-000000000000', 'Caminhada do fazendeiro', (select id from categorias_musculares where nome = 'Antebraços'), (select id from equipamentos where nome = 'Halteres'), 'Intermediário', 'Resistência', 'Caminhe com halteres pesados, ombros para trás e abdômen firme.', 'Inclinar o tronco para um lado.', true),
  ('00000039-0000-4000-8000-000000000000', 'Abdominal supra no solo', (select id from categorias_musculares where nome = 'Abdômen'), (select id from equipamentos where nome = 'Peso corporal'), 'Iniciante', 'Resistência', 'Eleve o tronco pela contração abdominal sem puxar o pescoço.', 'Tracionar a cabeça com as mãos.', true),
  ('00000040-0000-4000-8000-000000000000', 'Prancha isométrica', (select id from categorias_musculares where nome = 'Abdômen'), (select id from equipamentos where nome = 'Peso corporal'), 'Iniciante', 'Resistência', 'Cotovelos abaixo dos ombros, corpo alinhado, glúteo contraído.', 'Quadril alto ou lombar afundada.', true),
  ('00000041-0000-4000-8000-000000000000', 'Prancha lateral', (select id from categorias_musculares where nome = 'Abdômen'), (select id from equipamentos where nome = 'Peso corporal'), 'Intermediário', 'Resistência', 'Apoio no cotovelo, quadril elevado e alinhado ao tronco.', 'Deixar o quadril cair durante a série.', true),
  ('00000042-0000-4000-8000-000000000000', 'Elevação de pernas suspenso', (select id from categorias_musculares where nome = 'Abdômen'), (select id from equipamentos where nome = 'Peso corporal'), 'Avançado', 'Resistência', 'Suba as pernas até a linha do quadril sem balançar o corpo.', 'Usar impulso pendular.', true),
  ('00000043-0000-4000-8000-000000000000', 'Abdominal na polia alta', (select id from categorias_musculares where nome = 'Abdômen'), (select id from equipamentos where nome = 'Polia'), 'Intermediário', 'Hipertrofia', 'Ajoelhado, flexione o tronco levando os cotovelos aos joelhos.', 'Puxar com os braços em vez do abdômen.', true),
  ('00000044-0000-4000-8000-000000000000', 'Hiperextensão no banco romano', (select id from categorias_musculares where nome = 'Lombar'), (select id from equipamentos where nome = 'Banco'), 'Iniciante', 'Resistência', 'Coluna neutra, suba até o alinhamento do tronco com as pernas.', 'Hiperestender a coluna no topo.', true),
  ('00000045-0000-4000-8000-000000000000', 'Stiff com barra', (select id from categorias_musculares where nome = 'Lombar'), (select id from equipamentos where nome = 'Barra'), 'Intermediário', 'Hipertrofia', 'Joelhos semiflexionados, empurre o quadril para trás mantendo a barra rente à perna.', 'Arredondar a lombar e flexionar demais o joelho.', true),
  ('00000046-0000-4000-8000-000000000000', 'Good morning', (select id from categorias_musculares where nome = 'Lombar'), (select id from equipamentos where nome = 'Barra'), 'Avançado', 'Força', 'Barra nas costas, flexione o quadril mantendo coluna neutra.', 'Usar carga alta com técnica instável.', true),
  ('00000047-0000-4000-8000-000000000000', 'Agachamento livre', (select id from categorias_musculares where nome = 'Quadríceps'), (select id from equipamentos where nome = 'Barra'), 'Avançado', 'Força', 'Pés na largura dos ombros, desça até a coxa paralela mantendo o tronco firme.', 'Joelho colapsando para dentro e calcanhar saindo do chão.', true),
  ('00000048-0000-4000-8000-000000000000', 'Leg press 45', (select id from categorias_musculares where nome = 'Quadríceps'), (select id from equipamentos where nome = 'Leg press'), 'Iniciante', 'Hipertrofia', 'Pés na plataforma, desça até 90 graus sem descolar o quadril do apoio.', 'Descer demais e arredondar a lombar.', true),
  ('00000049-0000-4000-8000-000000000000', 'Cadeira extensora', (select id from categorias_musculares where nome = 'Quadríceps'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Ajuste o encosto, estenda o joelho e segure a contração por um segundo.', 'Bater a carga no retorno.', true),
  ('00000050-0000-4000-8000-000000000000', 'Agachamento hack', (select id from categorias_musculares where nome = 'Quadríceps'), (select id from equipamentos where nome = 'Máquina'), 'Intermediário', 'Hipertrofia', 'Costas apoiadas, desça controlando até a coxa paralela.', 'Descolar a lombar do apoio.', true),
  ('00000051-0000-4000-8000-000000000000', 'Afundo com halteres', (select id from categorias_musculares where nome = 'Quadríceps'), (select id from equipamentos where nome = 'Halteres'), 'Intermediário', 'Hipertrofia', 'Passo à frente, desça o joelho de trás até quase o solo.', 'Passo curto que joga o joelho muito à frente.', true),
  ('00000052-0000-4000-8000-000000000000', 'Agachamento no smith', (select id from categorias_musculares where nome = 'Quadríceps'), (select id from equipamentos where nome = 'Smith'), 'Iniciante', 'Hipertrofia', 'Pés levemente à frente da barra, desça em trajetória controlada.', 'Deixar os pés alinhados ao quadril e sobrecarregar o joelho.', true),
  ('00000053-0000-4000-8000-000000000000', 'Mesa flexora', (select id from categorias_musculares where nome = 'Posterior de coxa'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Quadril apoiado, flexione o joelho até o limite sem tirar o quadril da mesa.', 'Elevar o quadril para completar o movimento.', true),
  ('00000054-0000-4000-8000-000000000000', 'Cadeira flexora', (select id from categorias_musculares where nome = 'Posterior de coxa'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Sentado, flexione os joelhos com controle e retorne sem estender totalmente.', 'Deslizar no banco durante a série.', true),
  ('00000055-0000-4000-8000-000000000000', 'Stiff com halteres', (select id from categorias_musculares where nome = 'Posterior de coxa'), (select id from equipamentos where nome = 'Halteres'), 'Intermediário', 'Hipertrofia', 'Quadril para trás, halteres rente às pernas, sinta o alongamento posterior.', 'Transformar em agachamento flexionando muito o joelho.', true),
  ('00000056-0000-4000-8000-000000000000', 'Elevação pélvica com barra', (select id from categorias_musculares where nome = 'Glúteos'), (select id from equipamentos where nome = 'Barra'), 'Intermediário', 'Hipertrofia', 'Escápulas no banco, suba o quadril até o alinhamento tronco-coxa e contraia.', 'Hiperestender a lombar no topo.', true),
  ('00000057-0000-4000-8000-000000000000', 'Coice na polia', (select id from categorias_musculares where nome = 'Glúteos'), (select id from equipamentos where nome = 'Polia'), 'Iniciante', 'Hipertrofia', 'Estenda o quadril para trás mantendo o tronco estável.', 'Rodar o quadril e arquear a lombar.', true),
  ('00000058-0000-4000-8000-000000000000', 'Avanço búlgaro', (select id from categorias_musculares where nome = 'Glúteos'), (select id from equipamentos where nome = 'Halteres'), 'Avançado', 'Hipertrofia', 'Pé de trás no banco, desça vertical até 90 graus no joelho da frente.', 'Apoiar peso demais na perna de trás.', true),
  ('00000059-0000-4000-8000-000000000000', 'Panturrilha em pé', (select id from categorias_musculares where nome = 'Panturrilhas'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Amplitude completa, segure um segundo no topo e alongue embaixo.', 'Usar impulso e amplitude curta.', true),
  ('00000060-0000-4000-8000-000000000000', 'Panturrilha sentado', (select id from categorias_musculares where nome = 'Panturrilhas'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Joelhos a 90 graus, eleve os calcanhares o máximo possível.', 'Movimento rápido sem pausa.', true),
  ('00000061-0000-4000-8000-000000000000', 'Panturrilha no leg press', (select id from categorias_musculares where nome = 'Panturrilhas'), (select id from equipamentos where nome = 'Leg press'), 'Iniciante', 'Hipertrofia', 'Ponta dos pés na plataforma, empurre com o tornozelo.', 'Flexionar o joelho para ajudar.', true),
  ('00000062-0000-4000-8000-000000000000', 'Cadeira adutora', (select id from categorias_musculares where nome = 'Adutores'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Feche as pernas com controle e segure a contração.', 'Abrir demais no retorno e forçar a virilha.', true),
  ('00000063-0000-4000-8000-000000000000', 'Cadeira abdutora', (select id from categorias_musculares where nome = 'Abdutores'), (select id from equipamentos where nome = 'Máquina'), 'Iniciante', 'Hipertrofia', 'Abra as pernas com o tronco firme e retorne sem bater a carga.', 'Inclinar o tronco para frente para ganhar amplitude.', true),
  ('00000064-0000-4000-8000-000000000000', 'Abdução em pé na polia', (select id from categorias_musculares where nome = 'Abdutores'), (select id from equipamentos where nome = 'Polia'), 'Iniciante', 'Hipertrofia', 'Afaste a perna lateralmente mantendo o quadril alinhado.', 'Inclinar o tronco para o lado oposto.', true),
  ('00000065-0000-4000-8000-000000000000', 'Levantamento terra', (select id from categorias_musculares where nome = 'Corpo inteiro'), (select id from equipamentos where nome = 'Barra'), 'Avançado', 'Força', 'Barra rente à canela, coluna neutra, empurre o chão e estenda quadril e joelho juntos.', 'Arredondar a lombar e puxar com os braços.', true),
  ('00000066-0000-4000-8000-000000000000', 'Swing com kettlebell', (select id from categorias_musculares where nome = 'Corpo inteiro'), (select id from equipamentos where nome = 'Kettlebell'), 'Intermediário', 'Condicionamento', 'Movimento de quadril, não de braço, kettlebell até a altura do peito.', 'Agachar em vez de flexionar o quadril.', true),
  ('00000067-0000-4000-8000-000000000000', 'Burpee', (select id from categorias_musculares where nome = 'Corpo inteiro'), (select id from equipamentos where nome = 'Peso corporal'), 'Intermediário', 'Condicionamento', 'Agache, avance as pernas, faça a flexão e salte.', 'Perder o alinhamento da coluna na prancha.', true),
  ('00000068-0000-4000-8000-000000000000', 'Thruster com halteres', (select id from categorias_musculares where nome = 'Corpo inteiro'), (select id from equipamentos where nome = 'Halteres'), 'Avançado', 'Condicionamento', 'Agachamento frontal seguido de desenvolvimento em um movimento contínuo.', 'Separar os dois movimentos e perder o ritmo.', true),
  ('00000069-0000-4000-8000-000000000000', 'Caminhada inclinada na esteira', (select id from categorias_musculares where nome = 'Cardio'), (select id from equipamentos where nome = 'Esteira'), 'Iniciante', 'Cardio', 'Inclinação de 8 a 12 por cento, ritmo constante, sem se apoiar no corrimão.', 'Segurar no apoio e reduzir o gasto real.', true),
  ('00000070-0000-4000-8000-000000000000', 'Bicicleta ergométrica', (select id from categorias_musculares where nome = 'Cardio'), (select id from equipamentos where nome = 'Bicicleta'), 'Iniciante', 'Cardio', 'Ajuste o selim na altura do quadril e mantenha cadência constante.', 'Selim baixo demais sobrecarregando o joelho.', true),
  ('00000071-0000-4000-8000-000000000000', 'Elíptico', (select id from categorias_musculares where nome = 'Cardio'), (select id from equipamentos where nome = 'Elíptico'), 'Iniciante', 'Cardio', 'Postura ereta, use braços e pernas de forma coordenada.', 'Apoiar o peso nos braços.', true),
  ('00000072-0000-4000-8000-000000000000', 'Escada ergométrica', (select id from categorias_musculares where nome = 'Cardio'), (select id from equipamentos where nome = 'Escada'), 'Intermediário', 'Cardio', 'Passada completa, tronco ereto, sem apoiar o peso nas mãos.', 'Pisar apenas na ponta do pé.', true),
  ('00000073-0000-4000-8000-000000000000', 'HIIT na esteira', (select id from categorias_musculares where nome = 'Cardio'), (select id from equipamentos where nome = 'Esteira'), 'Avançado', 'Cardio', 'Alterne 30 segundos rápidos com 90 segundos de recuperação.', 'Iniciar sem aquecimento prévio.', true),
  ('00000074-0000-4000-8000-000000000000', 'Mobilidade de quadril 90/90', (select id from categorias_musculares where nome = 'Mobilidade'), (select id from equipamentos where nome = 'Peso corporal'), 'Iniciante', 'Mobilidade', 'Sentado com joelhos a 90 graus, alterne os lados controlando o giro do quadril.', 'Compensar com a lombar.', true),
  ('00000075-0000-4000-8000-000000000000', 'Mobilidade torácica deitado', (select id from categorias_musculares where nome = 'Mobilidade'), (select id from equipamentos where nome = 'Peso corporal'), 'Iniciante', 'Mobilidade', 'Deitado de lado, abra o braço superior acompanhando com o olhar.', 'Deixar o joelho subir do apoio.', true),
  ('00000076-0000-4000-8000-000000000000', 'Gato e camelo', (select id from categorias_musculares where nome = 'Mobilidade'), (select id from equipamentos where nome = 'Peso corporal'), 'Iniciante', 'Mobilidade', 'Alterne flexão e extensão da coluna em quatro apoios, respirando junto.', 'Fazer rápido demais sem controle segmentar.', true),
  ('00000077-0000-4000-8000-000000000000', 'Alongamento de isquiotibiais', (select id from categorias_musculares where nome = 'Alongamento'), (select id from equipamentos where nome = 'Peso corporal'), 'Iniciante', 'Alongamento', 'Perna estendida à frente, incline o tronco pelo quadril e segure 30 segundos.', 'Arredondar a coluna para alcançar o pé.', true),
  ('00000078-0000-4000-8000-000000000000', 'Alongamento de peitoral na porta', (select id from categorias_musculares where nome = 'Alongamento'), (select id from equipamentos where nome = 'Peso corporal'), 'Iniciante', 'Alongamento', 'Antebraço apoiado no batente, gire o tronco para o lado oposto.', 'Forçar além do limite confortável.', true);

insert into exercicio_secundarios (exercicio_id, categoria_id)
select * from (values
  ('00000001-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Tríceps')),
  ('00000001-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Ombros')),
  ('00000002-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Ombros')),
  ('00000002-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Tríceps')),
  ('00000003-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Tríceps')),
  ('00000005-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Ombros')),
  ('00000006-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Tríceps')),
  ('00000006-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Abdômen')),
  ('00000007-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Tríceps')),
  ('00000008-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Costas')),
  ('00000008-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Abdômen')),
  ('00000009-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Bíceps')),
  ('00000010-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Bíceps')),
  ('00000011-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Bíceps')),
  ('00000011-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Lombar')),
  ('00000012-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Bíceps')),
  ('00000013-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Bíceps')),
  ('00000014-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Bíceps')),
  ('00000014-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Abdômen')),
  ('00000015-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Bíceps')),
  ('00000017-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Tríceps')),
  ('00000018-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Tríceps')),
  ('00000021-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Costas')),
  ('00000022-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Trapézio')),
  ('00000023-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Trapézio')),
  ('00000024-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Antebraços')),
  ('00000025-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Antebraços')),
  ('00000026-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Antebraços')),
  ('00000029-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Antebraços')),
  ('00000034-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Peitoral')),
  ('00000035-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Peitoral')),
  ('00000037-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Bíceps')),
  ('00000038-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Corpo inteiro')),
  ('00000040-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Lombar')),
  ('00000041-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000044-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000044-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Posterior de coxa')),
  ('00000045-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Posterior de coxa')),
  ('00000045-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000046-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Posterior de coxa')),
  ('00000047-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000047-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Lombar')),
  ('00000048-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000050-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000051-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000052-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000053-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Panturrilhas')),
  ('00000055-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000055-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Lombar')),
  ('00000056-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Posterior de coxa')),
  ('00000057-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Posterior de coxa')),
  ('00000058-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Quadríceps')),
  ('00000063-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000064-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000065-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Lombar')),
  ('00000065-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000066-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Glúteos')),
  ('00000066-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Lombar')),
  ('00000067-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Cardio')),
  ('00000068-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Ombros')),
  ('00000068-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Quadríceps')),
  ('00000076-0000-4000-8000-000000000000', (select id from categorias_musculares where nome = 'Lombar'))
) v(e, c) where c is not null on conflict do nothing;

insert into exercicio_substitutos (exercicio_id, substituto_id) values
  ('00000001-0000-4000-8000-000000000000'::uuid, '00000007-0000-4000-8000-000000000000'::uuid),
  ('00000001-0000-4000-8000-000000000000'::uuid, '00000002-0000-4000-8000-000000000000'::uuid),
  ('00000002-0000-4000-8000-000000000000'::uuid, '00000001-0000-4000-8000-000000000000'::uuid),
  ('00000002-0000-4000-8000-000000000000'::uuid, '00000007-0000-4000-8000-000000000000'::uuid),
  ('00000003-0000-4000-8000-000000000000'::uuid, '00000001-0000-4000-8000-000000000000'::uuid),
  ('00000004-0000-4000-8000-000000000000'::uuid, '00000005-0000-4000-8000-000000000000'::uuid),
  ('00000005-0000-4000-8000-000000000000'::uuid, '00000004-0000-4000-8000-000000000000'::uuid),
  ('00000006-0000-4000-8000-000000000000'::uuid, '00000001-0000-4000-8000-000000000000'::uuid),
  ('00000006-0000-4000-8000-000000000000'::uuid, '00000007-0000-4000-8000-000000000000'::uuid),
  ('00000007-0000-4000-8000-000000000000'::uuid, '00000001-0000-4000-8000-000000000000'::uuid),
  ('00000007-0000-4000-8000-000000000000'::uuid, '00000004-0000-4000-8000-000000000000'::uuid),
  ('00000008-0000-4000-8000-000000000000'::uuid, '00000016-0000-4000-8000-000000000000'::uuid),
  ('00000009-0000-4000-8000-000000000000'::uuid, '00000014-0000-4000-8000-000000000000'::uuid),
  ('00000009-0000-4000-8000-000000000000'::uuid, '00000010-0000-4000-8000-000000000000'::uuid),
  ('00000010-0000-4000-8000-000000000000'::uuid, '00000009-0000-4000-8000-000000000000'::uuid),
  ('00000010-0000-4000-8000-000000000000'::uuid, '00000014-0000-4000-8000-000000000000'::uuid),
  ('00000011-0000-4000-8000-000000000000'::uuid, '00000012-0000-4000-8000-000000000000'::uuid),
  ('00000011-0000-4000-8000-000000000000'::uuid, '00000013-0000-4000-8000-000000000000'::uuid),
  ('00000012-0000-4000-8000-000000000000'::uuid, '00000011-0000-4000-8000-000000000000'::uuid),
  ('00000012-0000-4000-8000-000000000000'::uuid, '00000013-0000-4000-8000-000000000000'::uuid),
  ('00000013-0000-4000-8000-000000000000'::uuid, '00000011-0000-4000-8000-000000000000'::uuid),
  ('00000013-0000-4000-8000-000000000000'::uuid, '00000012-0000-4000-8000-000000000000'::uuid),
  ('00000014-0000-4000-8000-000000000000'::uuid, '00000009-0000-4000-8000-000000000000'::uuid),
  ('00000014-0000-4000-8000-000000000000'::uuid, '00000010-0000-4000-8000-000000000000'::uuid),
  ('00000015-0000-4000-8000-000000000000'::uuid, '00000013-0000-4000-8000-000000000000'::uuid),
  ('00000016-0000-4000-8000-000000000000'::uuid, '00000008-0000-4000-8000-000000000000'::uuid),
  ('00000017-0000-4000-8000-000000000000'::uuid, '00000018-0000-4000-8000-000000000000'::uuid),
  ('00000018-0000-4000-8000-000000000000'::uuid, '00000017-0000-4000-8000-000000000000'::uuid),
  ('00000019-0000-4000-8000-000000000000'::uuid, '00000022-0000-4000-8000-000000000000'::uuid),
  ('00000020-0000-4000-8000-000000000000'::uuid, '00000019-0000-4000-8000-000000000000'::uuid),
  ('00000021-0000-4000-8000-000000000000'::uuid, '00000019-0000-4000-8000-000000000000'::uuid),
  ('00000022-0000-4000-8000-000000000000'::uuid, '00000019-0000-4000-8000-000000000000'::uuid),
  ('00000023-0000-4000-8000-000000000000'::uuid, '00000022-0000-4000-8000-000000000000'::uuid),
  ('00000024-0000-4000-8000-000000000000'::uuid, '00000025-0000-4000-8000-000000000000'::uuid),
  ('00000024-0000-4000-8000-000000000000'::uuid, '00000029-0000-4000-8000-000000000000'::uuid),
  ('00000025-0000-4000-8000-000000000000'::uuid, '00000024-0000-4000-8000-000000000000'::uuid),
  ('00000025-0000-4000-8000-000000000000'::uuid, '00000026-0000-4000-8000-000000000000'::uuid),
  ('00000026-0000-4000-8000-000000000000'::uuid, '00000025-0000-4000-8000-000000000000'::uuid),
  ('00000027-0000-4000-8000-000000000000'::uuid, '00000024-0000-4000-8000-000000000000'::uuid),
  ('00000028-0000-4000-8000-000000000000'::uuid, '00000026-0000-4000-8000-000000000000'::uuid),
  ('00000029-0000-4000-8000-000000000000'::uuid, '00000024-0000-4000-8000-000000000000'::uuid),
  ('00000030-0000-4000-8000-000000000000'::uuid, '00000031-0000-4000-8000-000000000000'::uuid),
  ('00000030-0000-4000-8000-000000000000'::uuid, '00000032-0000-4000-8000-000000000000'::uuid),
  ('00000031-0000-4000-8000-000000000000'::uuid, '00000030-0000-4000-8000-000000000000'::uuid),
  ('00000032-0000-4000-8000-000000000000'::uuid, '00000030-0000-4000-8000-000000000000'::uuid),
  ('00000032-0000-4000-8000-000000000000'::uuid, '00000033-0000-4000-8000-000000000000'::uuid),
  ('00000033-0000-4000-8000-000000000000'::uuid, '00000032-0000-4000-8000-000000000000'::uuid),
  ('00000034-0000-4000-8000-000000000000'::uuid, '00000035-0000-4000-8000-000000000000'::uuid),
  ('00000035-0000-4000-8000-000000000000'::uuid, '00000034-0000-4000-8000-000000000000'::uuid),
  ('00000036-0000-4000-8000-000000000000'::uuid, '00000037-0000-4000-8000-000000000000'::uuid),
  ('00000037-0000-4000-8000-000000000000'::uuid, '00000036-0000-4000-8000-000000000000'::uuid),
  ('00000038-0000-4000-8000-000000000000'::uuid, '00000036-0000-4000-8000-000000000000'::uuid),
  ('00000039-0000-4000-8000-000000000000'::uuid, '00000042-0000-4000-8000-000000000000'::uuid),
  ('00000040-0000-4000-8000-000000000000'::uuid, '00000041-0000-4000-8000-000000000000'::uuid),
  ('00000041-0000-4000-8000-000000000000'::uuid, '00000040-0000-4000-8000-000000000000'::uuid),
  ('00000042-0000-4000-8000-000000000000'::uuid, '00000039-0000-4000-8000-000000000000'::uuid),
  ('00000043-0000-4000-8000-000000000000'::uuid, '00000039-0000-4000-8000-000000000000'::uuid),
  ('00000044-0000-4000-8000-000000000000'::uuid, '00000045-0000-4000-8000-000000000000'::uuid),
  ('00000045-0000-4000-8000-000000000000'::uuid, '00000051-0000-4000-8000-000000000000'::uuid),
  ('00000045-0000-4000-8000-000000000000'::uuid, '00000044-0000-4000-8000-000000000000'::uuid),
  ('00000046-0000-4000-8000-000000000000'::uuid, '00000045-0000-4000-8000-000000000000'::uuid),
  ('00000047-0000-4000-8000-000000000000'::uuid, '00000048-0000-4000-8000-000000000000'::uuid),
  ('00000047-0000-4000-8000-000000000000'::uuid, '00000050-0000-4000-8000-000000000000'::uuid),
  ('00000048-0000-4000-8000-000000000000'::uuid, '00000047-0000-4000-8000-000000000000'::uuid),
  ('00000048-0000-4000-8000-000000000000'::uuid, '00000049-0000-4000-8000-000000000000'::uuid),
  ('00000049-0000-4000-8000-000000000000'::uuid, '00000048-0000-4000-8000-000000000000'::uuid),
  ('00000050-0000-4000-8000-000000000000'::uuid, '00000047-0000-4000-8000-000000000000'::uuid),
  ('00000050-0000-4000-8000-000000000000'::uuid, '00000048-0000-4000-8000-000000000000'::uuid),
  ('00000051-0000-4000-8000-000000000000'::uuid, '00000055-0000-4000-8000-000000000000'::uuid),
  ('00000052-0000-4000-8000-000000000000'::uuid, '00000047-0000-4000-8000-000000000000'::uuid),
  ('00000053-0000-4000-8000-000000000000'::uuid, '00000054-0000-4000-8000-000000000000'::uuid),
  ('00000054-0000-4000-8000-000000000000'::uuid, '00000053-0000-4000-8000-000000000000'::uuid),
  ('00000055-0000-4000-8000-000000000000'::uuid, '00000045-0000-4000-8000-000000000000'::uuid),
  ('00000056-0000-4000-8000-000000000000'::uuid, '00000057-0000-4000-8000-000000000000'::uuid),
  ('00000057-0000-4000-8000-000000000000'::uuid, '00000056-0000-4000-8000-000000000000'::uuid),
  ('00000058-0000-4000-8000-000000000000'::uuid, '00000051-0000-4000-8000-000000000000'::uuid),
  ('00000059-0000-4000-8000-000000000000'::uuid, '00000060-0000-4000-8000-000000000000'::uuid),
  ('00000060-0000-4000-8000-000000000000'::uuid, '00000059-0000-4000-8000-000000000000'::uuid),
  ('00000061-0000-4000-8000-000000000000'::uuid, '00000059-0000-4000-8000-000000000000'::uuid),
  ('00000063-0000-4000-8000-000000000000'::uuid, '00000064-0000-4000-8000-000000000000'::uuid),
  ('00000064-0000-4000-8000-000000000000'::uuid, '00000063-0000-4000-8000-000000000000'::uuid),
  ('00000065-0000-4000-8000-000000000000'::uuid, '00000045-0000-4000-8000-000000000000'::uuid),
  ('00000066-0000-4000-8000-000000000000'::uuid, '00000065-0000-4000-8000-000000000000'::uuid),
  ('00000067-0000-4000-8000-000000000000'::uuid, '00000068-0000-4000-8000-000000000000'::uuid),
  ('00000068-0000-4000-8000-000000000000'::uuid, '00000067-0000-4000-8000-000000000000'::uuid),
  ('00000069-0000-4000-8000-000000000000'::uuid, '00000070-0000-4000-8000-000000000000'::uuid),
  ('00000069-0000-4000-8000-000000000000'::uuid, '00000071-0000-4000-8000-000000000000'::uuid),
  ('00000070-0000-4000-8000-000000000000'::uuid, '00000069-0000-4000-8000-000000000000'::uuid),
  ('00000071-0000-4000-8000-000000000000'::uuid, '00000069-0000-4000-8000-000000000000'::uuid),
  ('00000072-0000-4000-8000-000000000000'::uuid, '00000069-0000-4000-8000-000000000000'::uuid),
  ('00000073-0000-4000-8000-000000000000'::uuid, '00000069-0000-4000-8000-000000000000'::uuid)
on conflict do nothing;
-- =====================================================================
-- Vínculos e ficha de demonstração.
-- Executar depois de criar as contas no Auth (scripts/criar-usuarios.mjs),
-- que já preenche usuarios e perfis_aluno pelo gatilho tg_novo_usuario.
-- =====================================================================
do $$
declare
  v_personal uuid; v_aluno uuid; v_ficha uuid; v_div uuid;
begin
  select id into v_personal from usuarios where email = 'marina@fichafitness.app';
  select id into v_aluno    from usuarios where email = 'aluno@fichafitness.app';
  if v_personal is null or v_aluno is null then
    raise notice 'Contas de demonstração ainda não criadas no Auth. Ficha de exemplo ignorada.';
    return;
  end if;

  update usuarios set academia_id = 'a0000001-0000-4000-8000-000000000000'
   where email in ('marina@fichafitness.app','aluno@fichafitness.app');
  update perfis_aluno set personal_id = v_personal, objetivo = 'Hipertrofia',
         nivel = 'Intermediário', meta_semanal = 4, altura_cm = 178, peso_kg = 84.2
   where usuario_id = v_aluno;

  insert into fichas (aluno_id, personal_id, nome, objetivo, data_inicio, data_validade,
                      dias_semana, nivel, status, observacoes)
  values (v_aluno, v_personal, 'Hipertrofia ABC - Ciclo 3', 'Hipertrofia',
          current_date - 56, current_date + 36, 4, 'Intermediário', 'ativa',
          'Progredir carga quando atingir o topo da faixa de repetições em todas as séries.')
  returning id into v_ficha;

  insert into divisoes_treino (ficha_id, codigo, nome, ordem)
  values (v_ficha, 'A', 'Treino A - Peito, ombro e tríceps', 1) returning id into v_div;

  insert into series_planejadas (divisao_id, exercicio_id, ordem, series, rep_min, rep_max,
                                 carga_sugerida, descanso_seg, rir)
  values
    (v_div, '00000001-0000-4000-8000-000000000000', 1, 4,  6,  8,  70, 120, 2),
    (v_div, '00000002-0000-4000-8000-000000000000', 2, 3,  8, 12,  24,  90, 2),
    (v_div, '00000004-0000-4000-8000-000000000000', 3, 3, 10, 15,  45,  60, 1),
    (v_div, '00000017-0000-4000-8000-000000000000', 4, 3,  8, 12,  18,  90, 2),
    (v_div, '00000019-0000-4000-8000-000000000000', 5, 4, 12, 15,  10,  45, 1),
    (v_div, '00000030-0000-4000-8000-000000000000', 6, 3, 10, 12,  30,  60, 1);

  insert into divisoes_treino (ficha_id, codigo, nome, ordem)
  values (v_ficha, 'B', 'Treino B - Costas e bíceps', 2) returning id into v_div;

  insert into series_planejadas (divisao_id, exercicio_id, ordem, series, rep_min, rep_max,
                                 carga_sugerida, descanso_seg, rir)
  values
    (v_div, '00000009-0000-4000-8000-000000000000', 1, 4,  8, 12, 60,  90, 2),
    (v_div, '00000011-0000-4000-8000-000000000000', 2, 4,  6, 10, 50, 120, 2),
    (v_div, '00000013-0000-4000-8000-000000000000', 3, 3, 10, 12, 55,  75, 2),
    (v_div, '00000024-0000-4000-8000-000000000000', 4, 3,  8, 12, 25,  60, 1),
    (v_div, '00000026-0000-4000-8000-000000000000', 5, 3, 10, 12, 14,  45, 1);

  insert into divisoes_treino (ficha_id, codigo, nome, ordem)
  values (v_ficha, 'C', 'Treino C - Pernas completo', 3) returning id into v_div;

  insert into series_planejadas (divisao_id, exercicio_id, ordem, series, rep_min, rep_max,
                                 carga_sugerida, descanso_seg, rir)
  values
    (v_div, '00000047-0000-4000-8000-000000000000', 1, 4,  6, 10,  80, 150, 2),
    (v_div, '00000048-0000-4000-8000-000000000000', 2, 4, 10, 12, 180, 120, 2),
    (v_div, '00000049-0000-4000-8000-000000000000', 3, 3, 12, 15,  45,  60, 1),
    (v_div, '00000053-0000-4000-8000-000000000000', 4, 4, 10, 12,  40,  75, 2),
    (v_div, '00000059-0000-4000-8000-000000000000', 5, 4, 12, 20,  70,  45, 1);

  -- histórico curto para os gráficos não nascerem vazios
  for i in 1..12 loop
    declare v_treino uuid; v_data date := current_date - (i * 3);
    begin
      insert into treinos_realizados (aluno_id, ficha_id, divisao_id, data, inicio_em, fim_em,
                                      duracao_min, status, local_id)
      select v_aluno, v_ficha, d.id, v_data, v_data + time '19:00', v_data + time '20:02',
             62, 'concluido', 'seed-' || i
        from divisoes_treino d where d.ficha_id = v_ficha order by d.ordem
       offset (i % 3) limit 1
      returning id into v_treino;

      insert into series_realizadas (treino_id, exercicio_id, numero_serie, carga_kg, repeticoes, pse)
      select v_treino, sp.exercicio_id, s.n,
             round((sp.carga_sugerida * (1 - (i * 0.012)))::numeric, 1),
             sp.rep_max - (s.n / 3), 7 + (s.n % 3)
        from series_planejadas sp
        join treinos_realizados t on t.id = v_treino
        join divisoes_treino d on d.id = t.divisao_id and d.id = sp.divisao_id
        cross join generate_series(1, sp.series) as s(n);
    end;
  end loop;

  insert into medidas_corporais (aluno_id, data, peso_kg, cintura_cm, peitoral_cm,
                                 braco_d_cm, braco_e_cm, coxa_d_cm, gordura_pct, massa_muscular_kg)
  select v_aluno, current_date - (m * 30), 88.4 - m * 0.72, 92 - m * 0.9, 104 + m * 0.4,
         36.5 + m * 0.28, 36.2 + m * 0.25, 58 + m * 0.35, 22.4 - m * 0.85, 38.2 + m * 0.3
    from generate_series(5, 0, -1) as m;

  insert into mensagens (remetente_id, destinatario_id, ficha_id, texto)
  values (v_personal, v_aluno, v_ficha,
          'Subi a carga do supino na ficha nova. Faça a primeira semana com RIR 2.');

  insert into notificacoes (usuario_id, tipo, titulo, texto)
  values (v_aluno, 'ficha', 'Ficha atualizada', 'Sua ficha Hipertrofia ABC - Ciclo 3 foi publicada.');
end $$;
