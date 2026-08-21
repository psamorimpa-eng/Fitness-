-- Completa os exercícios da carga inicial cujos IDs antigos não têm correspondência
-- exata no arquivo de tradução atual. Não altera exercícios criados pelos usuários.

update public.exercicios
set instrucoes = case nome
  when 'Alongamento cobra' then E'1. Deite-se de barriga para baixo com as mãos próximas aos ombros.\n2. Apoie as mãos e eleve lentamente o peito, mantendo o quadril próximo ao chão.\n3. Alongue a região anterior do tronco sem forçar a lombar.\n4. Mantenha a posição de forma confortável e retorne devagar.'
  when 'Avanço andando' then E'1. Fique em pé com o tronco ereto e os pés alinhados.\n2. Dê um passo à frente e flexione os dois joelhos de forma controlada.\n3. Mantenha o joelho da frente alinhado com o pé e o tronco estável.\n4. Empurre o chão com a perna da frente, avance com a outra perna e repita alternando os lados.'
  when 'Bicicleta ergométrica' then E'1. Ajuste o banco para pedalar sem estender completamente os joelhos.\n2. Apoie os pés nos pedais e mantenha o tronco estável.\n3. Comece em ritmo leve e aumente a resistência gradualmente.\n4. Mantenha uma cadência confortável pelo tempo planejado e reduza o ritmo antes de encerrar.'
  when 'Caminhada do fazendeiro' then E'1. Segure uma carga em cada mão ao lado do corpo.\n2. Mantenha peito aberto, abdômen firme e ombros estáveis.\n3. Caminhe com passos curtos e controlados, sem inclinar o tronco.\n4. Complete a distância ou o tempo planejado e apoie as cargas com segurança.'
  when 'Caminhada na esteira' then E'1. Suba na esteira com velocidade baixa e postura ereta.\n2. Caminhe naturalmente, olhando à frente e mantendo os braços relaxados.\n3. Ajuste velocidade e inclinação conforme o objetivo do treino.\n4. Ao terminar, reduza gradualmente a velocidade antes de parar.'
  when 'Corrida na esteira' then E'1. Faça um aquecimento em caminhada ou trote leve.\n2. Aumente a velocidade gradualmente e corra com passada confortável.\n3. Mantenha o tronco estável e evite segurar nas barras durante a corrida.\n4. Reduza a velocidade progressivamente antes de finalizar.'
  when 'Desenvolvimento militar' then E'1. Posicione a barra na altura dos ombros com pegada um pouco maior que a largura deles.\n2. Mantenha abdômen e glúteos firmes e a coluna neutra.\n3. Empurre a barra acima da cabeça até estender os braços sem perder o alinhamento.\n4. Desça a barra de forma controlada até a posição inicial.'
  when 'Encolhimento no Smith' then E'1. Posicione-se em pé diante da barra do Smith e segure-a com os braços estendidos.\n2. Mantenha o tronco ereto e os cotovelos sem flexionar.\n3. Eleve os ombros verticalmente em direção às orelhas, contraindo o trapézio.\n4. Faça uma breve pausa e desça os ombros de forma controlada.'
  when 'Extensão lombar na bola' then E'1. Apoie o abdômen e o quadril sobre a bola suíça, mantendo os pés firmes no chão.\n2. Comece com o tronco levemente flexionado e a coluna neutra.\n3. Eleve o tronco até alinhar o corpo, sem hiperestender a lombar.\n4. Retorne lentamente à posição inicial e repita.'
  when 'Flexão pliométrica' then E'1. Comece em posição de flexão com mãos firmes no chão e corpo alinhado.\n2. Desça o peito de forma controlada.\n3. Empurre o chão de maneira explosiva até as mãos perderem contato com o solo.\n4. Amorteça a aterrissagem com os cotovelos levemente flexionados e inicie a próxima repetição.'
  when 'Hiperextensão lombar' then E'1. Ajuste o banco para que o quadril fique apoiado e os pés bem presos.\n2. Incline o tronco à frente mantendo a coluna controlada.\n3. Contraia glúteos e musculatura posterior para elevar o tronco até alinhar o corpo.\n4. Evite ultrapassar o alinhamento neutro da coluna e desça lentamente.'
  when 'Panturrilha unilateral' then E'1. Apoie a parte da frente de um pé em uma superfície estável e use apoio para equilíbrio se necessário.\n2. Desça o calcanhar de forma controlada até sentir alongamento na panturrilha.\n3. Empurre a ponta do pé e eleve o calcanhar o máximo possível.\n4. Faça as repetições planejadas e troque de lado.'
  when 'Ponte de glúteos' then E'1. Deite-se de costas com joelhos flexionados e pés apoiados no chão.\n2. Contraia o abdômen e pressione os pés contra o solo.\n3. Eleve o quadril até alinhar joelhos, quadril e ombros, contraindo os glúteos.\n4. Desça o quadril lentamente sem perder o controle.'
  when 'Pular corda' then E'1. Segure as manoplas com os cotovelos próximos ao corpo.\n2. Gire a corda principalmente com os punhos.\n3. Faça saltos baixos e leves, aterrissando sobre a parte da frente dos pés.\n4. Mantenha um ritmo constante pelo tempo ou número de saltos planejado.'
  when 'Remo ergométrico' then E'1. Sente-se no remo, prenda os pés e segure a alça com os braços estendidos.\n2. Inicie o movimento empurrando com as pernas e mantendo o tronco firme.\n3. Quando as pernas estiverem quase estendidas, incline levemente o tronco e puxe a alça em direção ao abdômen.\n4. Retorne na ordem inversa: braços, tronco e depois pernas, mantendo o movimento fluido.'
  when 'Salto na caixa' then E'1. Fique de frente para uma caixa estável com os pés afastados aproximadamente na largura dos ombros.\n2. Flexione quadris e joelhos e use os braços para preparar o salto.\n3. Salte sobre a caixa e aterrisse suavemente com os dois pés e joelhos alinhados.\n4. Estabilize-se completamente antes de descer da caixa de forma controlada.'
  else instrucoes
end,
atualizado_em = now()
where fonte = 'free-exercise-db'
  and coalesce(btrim(instrucoes),'') = ''
  and nome in (
    'Alongamento cobra','Avanço andando','Bicicleta ergométrica','Caminhada do fazendeiro',
    'Caminhada na esteira','Corrida na esteira','Desenvolvimento militar','Encolhimento no Smith',
    'Extensão lombar na bola','Flexão pliométrica','Hiperextensão lombar','Panturrilha unilateral',
    'Ponte de glúteos','Pular corda','Remo ergométrico','Salto na caixa'
  );
