# Colocar o Minha Ficha Fitness no ar

Guia prático, do zero até o app rodando no celular do seu primeiro personal cliente. Cerca de duas horas de trabalho na primeira vez.

Valores conferidos em agosto de 2026. Preços de nuvem mudam, confirme nos sites antes de assinar.

---

## 1. A escolha de hospedagem

O aplicativo tem duas partes que precisam de casa: o frontend Next.js e o banco com autenticação.

| Camada | Recomendado | Custo | Por quê |
|---|---|---|---|
| Frontend | Vercel | Grátis para testar, US$ 20 por mês quando faturar | Feita pelos criadores do Next.js, deploy por git push, sem configuração |
| Banco, auth e arquivos | Supabase | Grátis para testar, US$ 25 por mês em produção | PostgreSQL puro com RLS, que é exatamente o que o projeto usa |
| E-mail transacional | Resend ou Brevo | Grátis até alguns milhares por mês | Sem isso o convite de aluno não chega, veja o item 5 |
| Domínio | Registro.br | Cerca de R$ 40 por ano | Domínio .com.br exige CPF ou CNPJ brasileiro |

Custo total para começar a testar: zero. Custo quando entrar o primeiro cliente pagante: cerca de US$ 45 por mês, algo em torno de R$ 250. Com uma assinatura de personal a R$ 79,90, a operação se paga a partir do quarto cliente.

### Duas armadilhas que valem dinheiro

**O plano gratuito da Vercel proíbe uso comercial.** Enquanto você testa sozinho, sem cobrar ninguém, o Hobby serve. No dia em que o app gerar receita, o uso passa a exigir o Pro, a US$ 20 por mês por assento de desenvolvedor. Não é uma zona cinzenta, está escrito nos termos.

**O plano gratuito do Supabase pausa o projeto após 7 dias sem tráfego.** Para teste isso não incomoda. Para um cliente pagante é inaceitável: ele abre o app na academia e o banco está dormindo. O Pro, a US$ 25 por mês, resolve e ainda traz backup diário, que você vai querer no dia em que alguém apagar a ficha errada.

### Alternativas, se o custo apertar

- **Cloudflare Pages ou Netlify** no lugar da Vercel. Funciona, mas exige ajuste no build do Next.js e você perde a integração automática.
- **VPS na Hetzner ou DigitalOcean**, de US$ 4 a US$ 8 por mês, rodando Next.js e Postgres por conta própria. Fica mais barato e mais trabalhoso: você assume atualização de sistema, certificado, backup e monitoramento. Só vale a pena se você gosta de administrar servidor ou se o volume crescer muito.
- **Supabase self hosted** no mesmo VPS. Mesma lógica: economiza dólares, gasta suas noites.

Para um produto que ainda está buscando o primeiro cliente, pagar US$ 45 por mês e gastar o tempo com o produto é o melhor negócio.

---

## 2. Subir o banco

1. Crie a conta em supabase.com e um projeto novo. Região: São Paulo, para reduzir latência.
2. Guarde a senha do banco em lugar seguro, ela não é exibida de novo.
3. Em Project Settings, API, copie `Project URL`, `anon public` e `service_role`.
4. No seu computador:

```bash
npm i -g supabase
supabase login
supabase link --project-ref <ref-do-projeto>
supabase db push                       # aplica as 4 migrations
node scripts/criar-usuarios.mjs        # contas de demonstração no Auth
supabase db execute --file supabase/seed.sql
```

5. Confira no painel, em Table Editor, se `exercicios` tem 78 linhas. Se tiver, o banco está pronto.

---

## 3. Subir o aplicativo

1. Suba o código para um repositório privado no GitHub.
2. Em vercel.com, Add New, Project, importe o repositório. A Vercel detecta Next.js sozinha.
3. Em Environment Variables, cadastre:

```
NEXT_PUBLIC_SUPABASE_URL       = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = chave anon
SUPABASE_SERVICE_ROLE_KEY      = chave service_role
NEXT_PUBLIC_APP_URL            = https://seu-projeto.vercel.app
```

A chave `service_role` ignora todas as políticas de segurança do banco. Ela nunca pode aparecer em variável com prefixo `NEXT_PUBLIC_`, porque tudo com esse prefixo vai para o navegador do usuário.

4. Deploy. Em poucos minutos o app responde em `seu-projeto.vercel.app`.
5. Volte ao Supabase, em Authentication, URL Configuration, e cadastre o endereço da Vercel em Site URL e em Redirect URLs. Sem isso o login redireciona para localhost e falha.

A partir daqui, todo `git push` na branch principal publica sozinho.

---

## 4. Domínio próprio

1. Registre o domínio no Registro.br, algo como `minhafichafitness.com.br`.
2. Na Vercel, Settings, Domains, adicione o domínio. Ela mostra os registros DNS.
3. No Registro.br, aponte o DNS conforme indicado. A propagação leva de minutos a algumas horas.
4. Atualize `NEXT_PUBLIC_APP_URL` e as URLs de autenticação do Supabase para o domínio novo.

O certificado HTTPS é emitido automaticamente. Não precisa comprar nada.

---

## 5. E-mail: o detalhe que quebra o cadastro

O Supabase envia e-mails de confirmação e recuperação de senha por um serviço compartilhado com limite baixo, algo em torno de poucos envios por hora. Em teste passa despercebido. No dia em que um personal cadastrar oito alunos seguidos, metade não recebe o convite e ele conclui que o app não funciona.

Configure um SMTP próprio antes de ter cliente:

1. Crie conta no Resend ou no Brevo, ambos com faixa gratuita suficiente para começar.
2. Verifique seu domínio no serviço escolhido, incluindo os registros SPF e DKIM.
3. No Supabase, Project Settings, Authentication, SMTP Settings, preencha servidor, porta, usuário e senha.
4. Personalize os modelos de e-mail em Authentication, Email Templates, trocando o texto padrão em inglês.

---

## 6. Instalar no celular

Não precisa de loja para começar.

- **Android:** abrir o site no Chrome, tocar no menu e escolher Instalar aplicativo. O ícone vai para a tela inicial e o app abre sem barra de navegador.
- **iPhone:** abrir no Safari, tocar em Compartilhar e depois Adicionar à Tela de Início. O Safari é obrigatório, os outros navegadores do iOS não instalam PWA.

Vale gravar um vídeo de trinta segundos mostrando isso. É a primeira dúvida de todo usuário e evita a maior parte do suporte inicial.

---

## 7. Antes de entregar para o primeiro cliente

- [ ] Backup automático ativo, o que acontece ao assinar o Supabase Pro
- [ ] SMTP próprio configurado e testado com um cadastro real
- [ ] Um treino completo feito por você, no celular, dentro da academia
- [ ] Teste em modo avião: iniciar treino, registrar séries, sair do avião e conferir se subiu
- [ ] Termos de uso e política de privacidade publicados, exigência da LGPD
- [ ] Contas de demonstração removidas ou com senha trocada
- [ ] Monitoramento de erro ligado, o Sentry tem plano gratuito que serve
- [ ] Um canal de suporte, mesmo que seja seu WhatsApp

---

## 8. Custos conforme cresce

| Momento | Infraestrutura | Custo mensal aproximado |
|---|---|---|
| Você testando sozinho | Vercel Hobby, Supabase Free | US$ 0 |
| Primeiros clientes pagantes | Vercel Pro, Supabase Pro | US$ 45, cerca de R$ 250 |
| 30 personais, 900 alunos | Igual, com pequeno excedente de tráfego | US$ 50 a US$ 70 |
| Acima disso | Compute maior no Supabase, avaliar VPS | avaliar caso a caso |

Um ponto tranquilizador: o volume de dados aqui é baixo. Série de treino é texto e número, ocupa quase nada. O que faz a conta subir em produto desse tipo é vídeo e foto. Se um dia você hospedar vídeo de execução dos exercícios, use YouTube não listado ou um CDN de vídeo em vez do Storage do Supabase, senão o custo de tráfego sobe rápido.
