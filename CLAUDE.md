# CLAUDE.md

Contexto permanente deste repositório. O Claude Code lê este arquivo automaticamente em toda sessão.

## O produto

Minha Ficha Fitness. Aplicativo de musculação e acompanhamento de treinos, PWA responsivo, três perfis: aluno, personal e administrador.

**Cliente que paga: o personal trainer autônomo.** Toda decisão de produto se resolve por essa pergunta: isso faz o personal montar ficha mais rápido ou reter mais aluno? Se não faz, entra depois. Recursos de academia com várias unidades ficam para uma fase futura.

Preço alvo da assinatura: R$ 79,90 por mês por personal, até 40 alunos.

## Stack

- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase: PostgreSQL 16, Auth, Storage, RLS
- Dexie (IndexedDB) para o treino offline
- Recharts para gráficos
- Hospedagem: Vercel (frontend) e Supabase (banco)

## Convenções obrigatórias

1. **Não usar travessão em nenhum texto**, nem em código, comentário, documentação ou mensagem de commit. Usar vírgula, dois pontos ou ponto.
2. **Código e interface em português do Brasil.** Nomes de função, variável, tabela e coluna em português (`salvarFicha`, `series_realizadas`, `criarClienteServidor`). Palavras reservadas do framework permanecem em inglês.
3. **Regras de negócio moram no banco**, não no cliente. Volume, recorde pessoal, ficha ativa única e auditoria são resolvidos por coluna gerada, índice único e gatilho. Não duplicar essa lógica em TypeScript.
4. **RLS sempre ligado** em tabela nova. Aluno vê o próprio dado, personal vê o aluno vinculado, admin vê tudo. Usar as funções `papel_atual()` e `e_meu_aluno()`.
5. **A chave `service_role` nunca vai para o cliente.** Nada sensível com prefixo `NEXT_PUBLIC_`.
6. **Mobile first.** O alvo é um celular na mão suada dentro da academia: botão grande, poucos toques, número monoespacado para carga.
7. **Entrega completa.** Preferir código pronto para rodar a esboço com espaço para preencher depois.

## Identidade visual

Anilhas olímpicas: vermelho 25 kg (#D62828), azul 20 kg (#1D4ED8), amarelo 15 kg (#F4C20D), verde 10 kg (#16A34A), sobre grafite de ferro fundido. Cor de marca #E23A2E. Tipografia: Barlow Condensed em caixa alta para títulos (placa de academia), Inter para texto, JetBrains Mono para carga e número.

Tokens em `src/app/globals.css` como variáveis CSS. Sempre usar `var(--marca)`, `var(--superficie)` e afins, nunca cor fixa em componente novo.

## Estrutura

```
src/
├─ app/
│  ├─ (auth)/         login, cadastro, acoes.ts (server actions de autenticação)
│  └─ (app)/          área autenticada com menu inferior por perfil
│     ├─ inicio/      painel do aluno, do personal e do admin
│     ├─ treino/      ficha ativa e execução em [divisaoId]
│     ├─ historico/   lista e detalhe em [treinoId]
│     ├─ evolucao/    indicadores e gráficos
│     ├─ alunos/      carteira do personal
│     ├─ fichas/      lista, nova, [fichaId]/editar, acoes.ts
│     └─ perfil/
├─ components/        ui.tsx, NavegacaoInferior, ExecucaoTreino, EditorFicha, AcoesFicha, GraficosEvolucao
├─ lib/
│  ├─ supabase/       client.ts (navegador) e server.ts (servidor, com usuarioAtual())
│  ├─ calculos.ts     volume, adesão, progressão de carga, 1RM estimado
│  ├─ formato.ts      datas, horas, moeda, iniciais
│  ├─ offline.ts      fila Dexie e sincronização idempotente
│  └─ tipos.ts        tipagem do banco
└─ middleware.ts      renova sessão e protege rotas
```

Migrations em `supabase/migrations`, aplicadas em ordem:

| Arquivo | Conteúdo |
|---|---|
| 0001_schema.sql | 24 tabelas, enums, chaves e índices |
| 0002_funcoes.sql | gatilhos de recorde, volume e auditoria, visões de relatório |
| 0003_rls.sql | políticas de acesso e bucket privado das fotos |
| 0004_ficha_operacoes.sql | salvar ficha em transação, duplicar ficha, exercícios frequentes |

## Comandos

```bash
npm run dev                                   # desenvolvimento
npm run build                                 # build de produção
npx supabase db push                          # aplica migrations
node scripts/criar-usuarios.mjs               # contas de demonstração no Auth
npx supabase db execute --file supabase/seed.sql
npx vercel --prod                             # publica
```

Contas de demonstração, senha `123456`: `aluno@fichafitness.app`, `marina@fichafitness.app` (personal), `admin@fichafitness.app`.

## Estado atual, Fase 1

Pronto: autenticação com server actions, middleware de rota, painel do aluno, ficha ativa, execução de treino com cronômetro e fila offline, histórico com detalhe, evolução com gráficos, carteira de alunos, lista de fichas, editor de ficha completo com modelos, cópia entre alunos e arquivamento.

Falta na Fase 2, em ordem de prioridade para o personal autônomo:

1. Cadastro de aluno pelo personal com convite por e-mail (`/alunos/novo`)
2. Medidas corporais, tela de registro e listagem (`/medidas`)
3. Wake Lock e notificação local para o cronômetro sobreviver à tela apagada
4. Mensagens entre aluno e personal, com Supabase Realtime
5. Agenda e frequência
6. Avaliação física com comparativo

Fase 3: assinatura e cobrança (Stripe e Mercado Pago), limites por plano, funções de inteligência artificial, empacotamento com Capacitor.

## Ao trabalhar aqui

- Antes de criar tabela ou coluna, conferir se já existe em `0001_schema.sql`. O esquema cobre 24 entidades, quase tudo já está previsto.
- Toda migration nova entra como arquivo numerado, nunca editar migration já aplicada.
- Rodar `npm run build` antes de considerar uma tarefa concluída.
- Não inventar dado de demonstração dentro de componente. Dado de teste vive em `supabase/seed.sql`.
- A inteligência artificial, quando entrar, sugere progressão e ajuste de treino. Ela não substitui orientação médica nem a avaliação do profissional responsável, e isso precisa estar visível na interface.
