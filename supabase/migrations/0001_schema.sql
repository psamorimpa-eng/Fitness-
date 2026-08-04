-- =====================================================================
-- Minha Ficha Fitness - esquema base (24 entidades)
-- PostgreSQL 16 / Supabase
-- =====================================================================

create extension if not exists "pgcrypto";

create type papel_usuario as enum ('aluno','personal','admin');
create type status_ficha  as enum ('rascunho','ativa','arquivada','vencida');
create type status_treino as enum ('em_andamento','concluido','abandonado');

-- ------------------------------------------------- identidade e organização
create table academias (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  unidade      text,
  cidade       text,
  uf           char(2),
  logo_url     text,
  cor_primaria text default '#E23A2E',
  ativa        boolean default true,
  criado_em    timestamptz default now()
);

create table usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text unique not null,
  telefone    text,
  nascimento  date,
  sexo        text,
  papel       papel_usuario not null default 'aluno',
  academia_id uuid references academias(id),
  foto_url    text,
  ativo       boolean default true,
  aceite_termos_em      timestamptz,
  aceite_privacidade_em timestamptz,
  ultimo_acesso_em      timestamptz,
  criado_em   timestamptz default now()
);

create table perfis_aluno (
  usuario_id   uuid primary key references usuarios(id) on delete cascade,
  altura_cm    numeric(5,1),
  peso_kg      numeric(5,1),
  objetivo     text,
  nivel        text default 'Iniciante',
  restricoes   text,
  lesoes       text,
  personal_id  uuid references usuarios(id) on delete set null,
  data_inicio  date default current_date,
  meta_semanal smallint default 3 check (meta_semanal between 1 and 7),
  observacoes  text
);

create table perfis_personal (
  usuario_id    uuid primary key references usuarios(id) on delete cascade,
  cref          text,
  especialidade text,
  bio           text
);

-- ------------------------------------------------------------- catálogo
create table categorias_musculares (
  id    smallserial primary key,
  nome  text unique not null,
  tipo  text default 'muscular'
);

create table equipamentos (
  id   smallserial primary key,
  nome text unique not null
);

create table exercicios (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  categoria_id   smallint references categorias_musculares(id),
  equipamento_id smallint references equipamentos(id),
  nivel          text default 'Iniciante',
  tipo           text,
  descricao      text,
  instrucoes     text,
  erros_comuns   text,
  imagem_url     text,
  video_url      text,
  observacoes    text,
  criado_por     uuid references usuarios(id),
  academia_id    uuid references academias(id),
  publico        boolean default true,
  ativo          boolean default true,
  criado_em      timestamptz default now()
);
create unique index ux_exercicio_nome on exercicios (lower(nome), coalesce(academia_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table exercicio_secundarios (
  exercicio_id uuid references exercicios(id) on delete cascade,
  categoria_id smallint references categorias_musculares(id),
  primary key (exercicio_id, categoria_id)
);

create table exercicio_substitutos (
  exercicio_id  uuid references exercicios(id) on delete cascade,
  substituto_id uuid references exercicios(id) on delete cascade,
  primary key (exercicio_id, substituto_id),
  check (exercicio_id <> substituto_id)
);

-- ---------------------------------------------------------------- fichas
create table fichas (
  id             uuid primary key default gen_random_uuid(),
  aluno_id       uuid not null references usuarios(id) on delete cascade,
  personal_id    uuid references usuarios(id) on delete set null,
  nome           text not null,
  objetivo       text,
  data_inicio    date not null default current_date,
  data_validade  date,
  dias_semana    smallint default 3,
  nivel          text,
  status         status_ficha default 'rascunho',
  observacoes    text,
  criado_em      timestamptz default now(),
  atualizado_em  timestamptz default now(),
  atualizado_por uuid references usuarios(id),
  check (data_validade is null or data_validade >= data_inicio)
);
-- regra 2: apenas uma ficha ativa por aluno
create unique index ux_ficha_ativa on fichas (aluno_id) where status = 'ativa';

create table divisoes_treino (
  id       uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references fichas(id) on delete cascade,
  codigo   text not null,
  nome     text not null,
  ordem    smallint not null default 1,
  unique (ficha_id, codigo)
);

create table series_planejadas (
  id                uuid primary key default gen_random_uuid(),
  divisao_id        uuid not null references divisoes_treino(id) on delete cascade,
  exercicio_id      uuid not null references exercicios(id),
  ordem             smallint not null,
  series            smallint not null default 3,
  rep_min           smallint,
  rep_max           smallint,
  carga_sugerida    numeric(6,2) default 0,
  descanso_seg      smallint default 60,
  cadencia          text default '2-0-1-0',
  tecnica           text default 'Nenhuma',
  rir               smallint,
  pse_alvo          smallint,
  tempo_exec_seg    smallint,
  series_aquecimento smallint default 1,
  substituto_id     uuid references exercicios(id),
  observacoes       text,
  unique (divisao_id, ordem)
);

-- ------------------------------------------------------------- execução
create table treinos_realizados (
  id          uuid primary key default gen_random_uuid(),
  aluno_id    uuid not null references usuarios(id) on delete cascade,
  ficha_id    uuid references fichas(id) on delete set null,
  divisao_id  uuid references divisoes_treino(id) on delete set null,
  data        date not null default current_date,
  inicio_em   timestamptz default now(),
  fim_em      timestamptz,
  duracao_min smallint,
  volume_total numeric(12,2) default 0,
  status      status_treino default 'em_andamento',
  observacoes text,
  local_id    text unique,          -- chave idempotente gerada no aparelho
  criado_em   timestamptz default now()
);

create table series_realizadas (
  id            uuid primary key default gen_random_uuid(),
  treino_id     uuid not null references treinos_realizados(id) on delete cascade,
  exercicio_id  uuid not null references exercicios(id),
  numero_serie  smallint not null,
  carga_kg      numeric(6,2) not null default 0,
  repeticoes    smallint not null default 0,
  pse           smallint check (pse between 1 and 10),
  aquecimento   boolean default false,
  registrada_em timestamptz default now(),
  volume        numeric(12,2) generated always as (carga_kg * repeticoes) stored,
  unique (treino_id, exercicio_id, numero_serie)
);

create table exercicios_nao_realizados (
  treino_id    uuid references treinos_realizados(id) on delete cascade,
  exercicio_id uuid references exercicios(id),
  motivo       text,
  primary key (treino_id, exercicio_id)
);

create table recordes_pessoais (
  aluno_id     uuid references usuarios(id) on delete cascade,
  exercicio_id uuid references exercicios(id) on delete cascade,
  carga_kg     numeric(6,2),
  repeticoes   smallint,
  serie_id     uuid references series_realizadas(id) on delete set null,
  data         date,
  primary key (aluno_id, exercicio_id)
);

-- --------------------------------------------------------- acompanhamento
create table medidas_corporais (
  id                uuid primary key default gen_random_uuid(),
  aluno_id          uuid not null references usuarios(id) on delete cascade,
  data              date not null default current_date,
  peso_kg           numeric(5,1),
  peitoral_cm       numeric(5,1),
  cintura_cm        numeric(5,1),
  abdomen_cm        numeric(5,1),
  quadril_cm        numeric(5,1),
  braco_d_cm        numeric(5,1),
  braco_e_cm        numeric(5,1),
  coxa_d_cm         numeric(5,1),
  coxa_e_cm         numeric(5,1),
  panturrilha_d_cm  numeric(5,1),
  panturrilha_e_cm  numeric(5,1),
  gordura_pct       numeric(4,1),
  massa_muscular_kg numeric(5,1),
  registrado_por    uuid references usuarios(id),
  criado_em         timestamptz default now()
);

create table avaliacoes_fisicas (
  id                uuid primary key default gen_random_uuid(),
  aluno_id          uuid not null references usuarios(id) on delete cascade,
  avaliador_id      uuid references usuarios(id),
  data              date not null default current_date,
  peso_kg           numeric(5,1),
  altura_cm         numeric(5,1),
  imc               numeric(4,1),
  gordura_pct       numeric(4,1),
  massa_magra_kg    numeric(5,1),
  massa_muscular_kg numeric(5,1),
  medida_id         uuid references medidas_corporais(id),
  objetivos         text,
  restricoes        text,
  historico_lesoes  text,
  observacoes       text,
  proxima_data      date
);

create table fotos_evolucao (
  id           uuid primary key default gen_random_uuid(),
  aluno_id     uuid not null references usuarios(id) on delete cascade,
  data         date not null default current_date,
  angulo       text,
  storage_path text not null,
  visivel_para_personal boolean default false,
  criado_em    timestamptz default now()
);

create table agenda_treinos (
  id         uuid primary key default gen_random_uuid(),
  aluno_id   uuid not null references usuarios(id) on delete cascade,
  data       date not null,
  divisao_id uuid references divisoes_treino(id),
  situacao   text default 'programado',  -- programado, concluido, falta, reagendado
  lembrete_em timestamptz,
  unique (aluno_id, data)
);

-- ------------------------------------------------------------ comunicação
create table mensagens (
  id              uuid primary key default gen_random_uuid(),
  remetente_id    uuid not null references usuarios(id) on delete cascade,
  destinatario_id uuid not null references usuarios(id) on delete cascade,
  ficha_id        uuid references fichas(id) on delete set null,
  exercicio_id    uuid references exercicios(id) on delete set null,
  texto           text not null,
  lida_em         timestamptz,
  criado_em       timestamptz default now()
);

create table notificacoes (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  tipo       text not null,
  titulo     text,
  texto      text,
  lida       boolean default false,
  criado_em  timestamptz default now()
);

create table preferencias_notificacao (
  usuario_id     uuid primary key references usuarios(id) on delete cascade,
  horario_treino boolean default true,
  ficha_vencendo boolean default true,
  nova_mensagem  boolean default true,
  meta_semanal   boolean default true,
  recorde        boolean default true,
  inatividade    boolean default true
);

-- --------------------------------------------------------------- comercial
create table planos (
  id            text primary key,
  nome          text not null,
  preco_mensal  numeric(8,2) default 0,
  limite_alunos int,
  limite_fichas int,
  dias_gratuitos smallint default 0,
  recursos      jsonb default '{}'::jsonb
);

create table assinaturas (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid references usuarios(id) on delete cascade,
  academia_id uuid references academias(id) on delete cascade,
  plano_id    text references planos(id),
  status      text default 'ativa',
  inicio      date default current_date,
  vencimento  date,
  renovacao_automatica boolean default true
);

create table pagamentos (
  id            uuid primary key default gen_random_uuid(),
  assinatura_id uuid references assinaturas(id) on delete cascade,
  valor         numeric(10,2),
  metodo        text,
  status        text,
  gateway       text,
  gateway_ref   text,
  pago_em       timestamptz,
  criado_em     timestamptz default now()
);

-- -------------------------------------------------------------- governança
create table permissoes (
  papel   papel_usuario,
  recurso text,
  acao    text,
  primary key (papel, recurso, acao)
);

create table logs_atividade (
  id           bigserial primary key,
  usuario_id   uuid references usuarios(id) on delete set null,
  entidade     text not null,
  entidade_id  uuid,
  acao         text not null,
  dados_antes  jsonb,
  dados_depois jsonb,
  ip           inet,
  criado_em    timestamptz default now()
);

-- ----------------------------------------------------------------- índices
create index ix_treinos_aluno_data   on treinos_realizados (aluno_id, data desc);
create index ix_series_treino        on series_realizadas (treino_id);
create index ix_series_exercicio     on series_realizadas (exercicio_id);
create index ix_medidas_aluno_data   on medidas_corporais (aluno_id, data desc);
create index ix_mensagens_dest       on mensagens (destinatario_id, lida_em);
create index ix_fichas_aluno_status  on fichas (aluno_id, status);
create index ix_perfis_aluno_personal on perfis_aluno (personal_id);
