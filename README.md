# Minha Ficha Fitness

Aplicativo de musculação e acompanhamento de treinos. PWA responsivo com aparência de app nativo, três perfis de acesso (aluno, personal e administrador) e execução de treino que funciona sem internet.

Stack: Next.js 14 (App Router) · TypeScript · Supabase (PostgreSQL, Auth, Storage) · Tailwind CSS · Dexie · Recharts.

---

## 1. Rodar o projeto

```bash
git clone <seu-repositorio> minha-ficha-fitness
cd minha-ficha-fitness
npm install
cp .env.example .env.local     # preencha com as chaves do seu projeto Supabase
npm run dev                    # http://localhost:3000
```

## 2. Preparar o banco

```bash
npx supabase link --project-ref <ref-do-projeto>
npx supabase db push                      # aplica as 3 migrations
node scripts/criar-usuarios.mjs           # cria as contas de demonstração no Auth
npx supabase db execute --file supabase/seed.sql   # catálogos, 78 exercícios e ficha exemplo
```

As migrations em `supabase/migrations` criam, nesta ordem:

| Arquivo | Conteúdo |
|---|---|
| `0001_schema.sql` | 24 tabelas, tipos enum, chaves estrangeiras e índices |
| `0002_funcoes.sql` | gatilhos de recorde, volume e auditoria, além das visões de relatório |
| `0003_rls.sql` | políticas de acesso por linha e bucket privado das fotos |
| `0004_ficha_operacoes.sql` | salvar ficha inteira em uma transação, duplicar ficha e ranking de exercícios usados |

Contas de demonstração, todas com senha `123456`:

| Perfil | E-mail |
|---|---|
| Aluno | aluno@fichafitness.app |
| Personal | marina@fichafitness.app |
| Administrador | admin@fichafitness.app |

## 3. Organização do código

```
src/
├─ app/
│  ├─ (auth)/          login, cadastro e server actions de autenticação
│  └─ (app)/           área autenticada, com menu inferior por perfil
│     ├─ inicio/       painel do aluno, do personal e do admin
│     ├─ treino/       ficha ativa e execução ([divisaoId])
│     ├─ historico/    lista e detalhe do treino realizado
│     ├─ evolucao/     indicadores e gráficos
│     ├─ alunos/       carteira do personal
│     ├─ fichas/       lista, nova ficha e editor ([fichaId]/editar)
│     └─ perfil/
├─ components/         ui.tsx, NavegacaoInferior, ExecucaoTreino, EditorFicha, AcoesFicha, GraficosEvolucao
├─ lib/
│  ├─ supabase/        clientes de navegador e de servidor
│  ├─ calculos.ts      volume, adesão, progressão, 1RM estimado
│  ├─ formato.ts       datas, horas, moeda
│  ├─ offline.ts       fila Dexie e sincronização
│  └─ tipos.ts         tipagem do banco
└─ middleware.ts       renovação de sessão e proteção de rotas
```

## 4. Como o modo offline funciona

1. Ao abrir a execução, a divisão inteira é guardada no IndexedDB.
2. Cada série concluída grava primeiro no aparelho, com `enviada = 0`.
3. `sincronizar()` roda a cada 30 segundos e no evento `online`.
4. O envio usa `upsert` com as chaves `local_id` (treino) e `treino_id + exercicio_id + numero_serie` (série), então reenviar a fila nunca duplica registro.
5. Se o aluno fechar o app no meio do treino, a fila continua no aparelho e sobe no próximo acesso.

Consequência prática: dá para treinar no subsolo da academia sem sinal e nada se perde.

## 5. Regras de negócio garantidas pelo banco

| Regra | Onde é garantida |
|---|---|
| Apenas uma ficha ativa por aluno | índice único parcial `ux_ficha_ativa` |
| Volume é carga vezes repetições | coluna gerada `series_realizadas.volume` |
| Recordes identificados automaticamente | gatilho `tg_recorde` |
| Toda alteração de ficha registra data e responsável | gatilho `tg_auditoria_ficha` grava em `logs_atividade` |
| Aluno só altera o que lhe cabe | políticas RLS por tabela |
| Fichas antigas permanecem no histórico | status `arquivada`, sem exclusão física |
| Séries registram horário, carga e repetições | colunas obrigatórias em `series_realizadas` |

## 6. PWA e publicação nas lojas

O `public/manifest.json` e o `public/sw.js` já entregam o app instalável pelo navegador. No Android o convite de instalação aparece sozinho; no iOS o caminho é Compartilhar e depois Adicionar à Tela de Início.

Para as lojas, na Fase 3:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Minha Ficha Fitness" br.com.minhafichafitness
npx cap add android && npx cap add ios
npm run build && npx cap sync
```

A Apple recusa aplicativos que sejam apenas um site empacotado. O que justifica a publicação é o conjunto de recursos nativos previstos: notificações push, treino offline e cronômetro em segundo plano.

## 7. Hospedagem

O passo a passo completo, com custos e as armadilhas de plano gratuito, está em `GUIA-DEPLOY.md`.
Resumo: Vercel para o frontend, Supabase para banco e autenticação, SMTP próprio para os e-mails de convite.

## 8. O que ainda não está nesta fase

Medidas corporais, avaliação física, agenda, mensagens em tempo real e notificações push estão previstos para a Fase 2. Pagamentos, limites por plano e as funções de inteligência artificial ficam para a Fase 3. As rotas dessas telas já aparecem no perfil, apontando para páginas a implementar.

A inteligência artificial, quando entrar, sugere progressão e ajustes de treino. Ela não substitui orientação médica nem a avaliação do profissional responsável.
