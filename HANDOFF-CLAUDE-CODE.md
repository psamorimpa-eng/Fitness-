# Migrar para o Claude Code e publicar

Documento de passagem de bastão. Objetivo: sair daqui com o aplicativo publicado, rodando 24 horas por dia em endereço próprio, e com o Claude Code continuando o desenvolvimento no seu terminal.

---

## 1. Antes de tudo, o que o Claude Code faz e o que não faz

Ele roda no seu computador, com acesso ao terminal e aos arquivos. Executa comando, edita código, roda build, aplica migration, faz commit e dispara deploy. Isso cobre a maior parte do trabalho.

Ele não cria conta em seu nome, não digita cartão de crédito, não conclui login por navegador com senha e segundo fator, e não altera DNS no Registro.br. Essas quatro coisas são suas, levam cerca de vinte minutos no total, e valem ser feitas antes de abrir o Claude Code para a sessão não travar no meio.

Faça agora, nesta ordem:

1. Conta no GitHub e um repositório privado vazio chamado `minha-ficha-fitness`
2. Conta no Supabase, projeto novo, região São Paulo, senha do banco guardada
3. Conta na Vercel, entrando com o GitHub
4. Conta no Resend, para o e-mail de convite

Guarde em um bloco de notas: URL do projeto Supabase, chave `anon`, chave `service_role`, senha do banco.

Um ponto importante: publicar não é deixar o terminal aberto. O aplicativo passa a rodar nos servidores da Vercel e do Supabase. Você pode desligar o computador que ele continua no ar.

---

## 2. Preparar a pasta

Descompacte o projeto e abra o terminal dentro dela:

```bash
cd ~/projetos/minha-ficha-fitness
npm install
cp .env.example .env.local
```

Preencha o `.env.local` com as chaves do Supabase. Depois inicie o Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
claude
```

O arquivo `CLAUDE.md` na raiz é lido automaticamente. Ele já contém stack, convenções, identidade visual, estrutura de pastas, estado atual e a fila de tarefas, então você não precisa reexplicar o projeto a cada sessão.

---

## 3. Prompt de abertura

Cole isto na primeira mensagem do Claude Code:

```
Estou assumindo este projeto agora. Leia o CLAUDE.md, o README.md e o GUIA-DEPLOY.md
antes de qualquer coisa.

Contexto: o aplicativo está com a Fase 1 completa em código, mas nunca foi publicado.
O cliente que paga é o personal trainer autônomo.

Sua primeira tarefa é me deixar com o aplicativo no ar. Trabalhe em etapas e me
peça o que você não pode fazer sozinho, como login em serviço externo e chave de API.

Etapa 1: rode npm run build e corrija o que quebrar. Não avance com build falhando.
Etapa 2: aplique as migrations no Supabase, crie as contas de demonstração e rode o seed.
Etapa 3: inicialize o git, faça o primeiro commit e envie para o repositório do GitHub.
Etapa 4: conecte à Vercel, configure as variáveis de ambiente e publique em produção.
Etapa 5: ajuste as URLs de autenticação no Supabase para o endereço publicado.

Ao final, me diga o endereço e liste o que ficou pendente de configuração manual.
```

---

## 4. Comandos que ele vai usar

Serve como referência para você acompanhar o que está acontecendo.

```bash
# etapa 1
npm run build

# etapa 2
npm i -g supabase
supabase login
supabase link --project-ref <ref>
supabase db push
node scripts/criar-usuarios.mjs
supabase db execute --file supabase/seed.sql

# etapa 3
git init && git add . && git commit -m "Fase 1 completa"
git remote add origin git@github.com:<voce>/minha-ficha-fitness.git
git push -u origin main

# etapa 4
npm i -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel --prod
```

Depois disso, todo `git push` na branch principal publica sozinho. Não precisa rodar `vercel --prod` de novo.

---

## 5. O que só você resolve, e quando

| Momento | Ação sua | Tempo |
|---|---|---|
| Antes da etapa 2 | `supabase login` abre o navegador, você autoriza | 1 min |
| Antes da etapa 4 | `vercel login` abre o navegador, você autoriza | 1 min |
| Depois de publicar | Cadastrar Site URL e Redirect URLs no Supabase, em Authentication | 3 min |
| Antes do primeiro cliente | SMTP do Resend em Project Settings, Authentication | 15 min |
| Antes do primeiro cliente | Assinar Supabase Pro e Vercel Pro | 5 min |
| Quando quiser domínio | Registrar no Registro.br e apontar o DNS | 30 min mais propagação |

Os dois planos pagos não são opcionais quando entrar cliente. O gratuito da Vercel proíbe uso comercial e o do Supabase pausa o projeto após sete dias sem tráfego. Detalhes no `GUIA-DEPLOY.md`.

---

## 6. Depois de publicado, a fila de trabalho

Prompts prontos, um por sessão. Rodar na ordem.

**Sessão 1, teste real antes de codar mais**

```
Antes de qualquer recurso novo, quero validar o que existe. Crie um roteiro de teste
manual em TESTE-CAMPO.md cobrindo: cadastro de aluno, publicação de ficha pelo personal,
execução completa de um treino no celular, comportamento em modo avião e sincronização
ao voltar a rede. Para cada passo, diga o que observar e o que caracteriza falha.
```

**Sessão 2, cadastro de aluno pelo personal**

```
Implemente /alunos/novo: formulário do personal para cadastrar aluno e enviar convite
por e-mail. Use a service_role apenas em route handler no servidor, com
supabase.auth.admin.inviteUserByEmail, e preencha perfis_aluno com personal_id do
usuário logado. Siga as convenções do CLAUDE.md e rode npm run build ao final.
```

**Sessão 3, cronômetro sobrevivendo à tela apagada**

```
O cronômetro de descanso para quando a tela do celular apaga, o que inviabiliza o uso
real. Implemente Screen Wake Lock API com fallback, e notificação local quando o descanso
termina com a aba em segundo plano. Documente as limitações que restarem no iOS.
```

**Sessão 4, medidas corporais**

```
Implemente /medidas: listagem por data e registro de nova medição, usando a tabela
medidas_corporais que já existe no esquema. Ligue os dados ao gráfico de peso e gordura
que já está em /evolucao.
```

Da quinta sessão em diante, as prioridades estão listadas no `CLAUDE.md`, seção Estado atual.

---

## 7. Como trabalhar bem com ele

- Uma tarefa por sessão. Pedido grande demais gera código que você não consegue revisar.
- Exija `npm run build` verde ao final de cada tarefa. É o critério objetivo de pronto.
- Peça commit a cada etapa concluída, com mensagem descritiva. Assim dá para voltar atrás.
- Quando algo quebrar em produção, cole o erro inteiro da Vercel, não o resumo.
- Antes de mexer no banco, peça o SQL para você ler antes de aplicar. Migration errada em produção com dado de cliente é o único erro caro aqui.
- Se ele sugerir criar tabela nova, desconfie. O esquema já cobre 24 entidades.

---

## 8. Critério de pronto

O aplicativo está no ar quando você conseguir, do seu celular, sem o computador ligado:

1. Abrir o endereço e instalar como aplicativo na tela inicial
2. Entrar como personal, criar uma ficha do zero pelo editor
3. Sair, entrar como aluno e ver essa ficha
4. Executar o treino inteiro, com o cronômetro rodando
5. Ativar o modo avião no meio do treino, terminar as séries, desligar o modo avião
6. Ver o treino no histórico, com volume e comparação, e o gráfico de carga atualizado

Se os seis passos funcionarem, você tem produto para colocar na mão do primeiro personal.
