-- Catálogo ampliado e cadastro seguro de exercícios próprios.
-- Fontes de dados:
--   Free Exercise DB (Unlicense): https://github.com/yuhonas/free-exercise-db
--   Tradução PT-BR: https://github.com/joao-gugel/exercicios-bd-ptbr

create extension if not exists http with schema extensions;

alter table public.exercicios add column if not exists fonte text;
alter table public.exercicios add column if not exists fonte_id text;
alter table public.exercicios add column if not exists atualizado_em timestamptz not null default now();

create unique index if not exists ux_exercicios_fonte_id
  on public.exercicios(fonte, fonte_id)
  where fonte is not null and fonte_id is not null;
create index if not exists idx_exercicios_criado_por_ativo
  on public.exercicios(criado_por, ativo)
  where criado_por is not null;

insert into public.categorias_musculares(nome)
values ('Pescoço')
on conflict (nome) do nothing;

insert into public.equipamentos(nome)
values ('Bola medicinal')
on conflict (nome) do nothing;

-- Os 121 exercícios iniciais já vieram da mesma base. Registra a origem canônica.
update public.exercicios
set fonte = 'free-exercise-db',
    fonte_id = replace(regexp_replace(imagem_url, '^.*/exercises/([^/]+)/.*$', '\1'), '%27', ''''),
    atualizado_em = now()
where imagem_url like 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/%'
  and (fonte is null or fonte_id is null);

-- Enriquece os exercícios existentes com o passo a passo PT-BR, quando disponível.
with traducao as (
  select value as j
  from jsonb_array_elements(
    ((select (extensions.http_get(
      'https://raw.githubusercontent.com/joao-gugel/exercicios-bd-ptbr/main/exercises/exercises-ptbr-minimal.json'
    )).content))::jsonb
  )
), dados as (
  select
    j->>'id' as fonte_id,
    (select string_agg(ord::text || '. ' || passo, E'\n' order by ord)
     from jsonb_array_elements_text(j->'instructions') with ordinality as s(passo, ord)) as instrucoes
  from traducao
)
update public.exercicios e
set instrucoes = d.instrucoes,
    atualizado_em = now()
from dados d
where e.fonte = 'free-exercise-db'
  and e.fonte_id = d.fonte_id
  and coalesce(btrim(e.instrucoes),'') = ''
  and coalesce(btrim(d.instrucoes),'') <> '';

-- Fallback: se a tradução não contiver um exercício antigo, preserva as instruções originais.
with original as (
  select value as j
  from jsonb_array_elements(
    ((select (extensions.http_get(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
    )).content))::jsonb
  )
), dados as (
  select
    j->>'id' as fonte_id,
    (select string_agg(ord::text || '. ' || passo, E'\n' order by ord)
     from jsonb_array_elements_text(j->'instructions') with ordinality as s(passo, ord)) as instrucoes
  from original
)
update public.exercicios e
set instrucoes = d.instrucoes,
    atualizado_em = now()
from dados d
where e.fonte = 'free-exercise-db'
  and e.fonte_id = d.fonte_id
  and coalesce(btrim(e.instrucoes),'') = ''
  and coalesce(btrim(d.instrucoes),'') <> '';

-- Completa o catálogo até 500 exercícios ativos.
-- A seleção é distribuída entre tipos e músculos para evitar um catálogo enviesado.
with original as (
  select value as j
  from jsonb_array_elements(
    ((select (extensions.http_get(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
    )).content))::jsonb
  )
),
traducao as (
  select value as j
  from jsonb_array_elements(
    ((select (extensions.http_get(
      'https://raw.githubusercontent.com/joao-gugel/exercicios-bd-ptbr/main/exercises/exercises-ptbr-minimal.json'
    )).content))::jsonb
  )
),
base0 as (
  select
    o.j,
    t.j as pt,
    o.j->>'id' as fonte_id,
    o.j->>'name' as nome_original,
    t.j->>'name' as nome_pt,
    o.j->>'category' as categoria_fonte,
    coalesce(o.j->'primaryMuscles'->>0,'') as musculo_principal
  from original o
  join traducao t on t.j->>'id' = o.j->>'id'
  where jsonb_array_length(coalesce(t.j->'instructions','[]'::jsonb)) > 0
    and not exists (
      select 1 from public.exercicios e
      where e.fonte='free-exercise-db' and e.fonte_id=o.j->>'id'
    )
    and not exists (
      select 1 from public.exercicios e
      where e.ativo and lower(btrim(e.nome))=lower(btrim(t.j->>'name'))
    )
),
dedup as (
  select *, row_number() over(partition by lower(btrim(nome_pt)) order by fonte_id) as dup_nome
  from base0
),
base as (
  select *,
    case
      when categoria_fonte = 'stretching' then 'Mobilidade e alongamento'
      when categoria_fonte = 'plyometrics' then 'Pliometria'
      when categoria_fonte = 'cardio' then 'Cardio'
      when musculo_principal = 'abdominals' then 'Abdômen e core'
      when musculo_principal in ('adductors','abductors') then 'Adutores e abdutores'
      when musculo_principal = 'forearms' then 'Antebraços'
      when musculo_principal = 'biceps' then 'Bíceps'
      when musculo_principal in ('lats','middle back') then 'Costas'
      when musculo_principal = 'glutes' then 'Glúteos'
      when musculo_principal = 'lower back' then 'Lombar'
      when musculo_principal = 'shoulders' then 'Ombros'
      when musculo_principal = 'calves' then 'Panturrilhas'
      when musculo_principal = 'chest' then 'Peito'
      when musculo_principal = 'hamstrings' then 'Posteriores de coxa'
      when musculo_principal = 'quadriceps' then 'Quadríceps'
      when musculo_principal = 'traps' then 'Trapézio'
      when musculo_principal = 'triceps' then 'Tríceps'
      when musculo_principal = 'neck' then 'Pescoço'
      else 'Corpo inteiro'
    end as grupo_nome,
    case coalesce(j->>'equipment','body only')
      when 'barbell' then 'Barra'
      when 'dumbbell' then 'Halteres'
      when 'body only' then 'Peso corporal'
      when 'cable' then 'Cabo'
      when 'machine' then 'Máquina'
      when 'kettlebells' then 'Kettlebell'
      when 'bands' then 'Elástico'
      when 'medicine ball' then 'Bola medicinal'
      when 'exercise ball' then 'Bola suíça'
      when 'foam roll' then 'Rolo de espuma'
      when 'e-z curl bar' then 'Barra EZ'
      else 'Outros'
    end as equipamento_nome,
    case j->>'level'
      when 'beginner' then 'Iniciante'
      when 'intermediate' then 'Intermediário'
      when 'expert' then 'Avançado'
      else 'Intermediário'
    end as nivel_pt,
    case categoria_fonte
      when 'stretching' then 'Alongamento'
      when 'plyometrics' then 'Pliometria'
      when 'powerlifting' then 'Powerlifting'
      when 'olympic weightlifting' then 'Levantamento olímpico'
      when 'strongman' then 'Strongman'
      when 'cardio' then 'Cardio'
      else 'Musculação'
    end as tipo_pt,
    row_number() over (
      partition by categoria_fonte, musculo_principal
      order by lower(nome_original), fonte_id
    ) as rodada_musculo
  from dedup
  where dup_nome=1
),
ordenada as (
  select *, row_number() over (
    partition by categoria_fonte
    order by rodada_musculo, musculo_principal, lower(nome_original), fonte_id
  ) as rn_categoria
  from base
),
selecionados as (
  select * from ordenada
  where rn_categoria <= case categoria_fonte
    when 'strength' then 250
    when 'stretching' then 50
    when 'plyometrics' then 25
    when 'powerlifting' then 18
    when 'olympic weightlifting' then 18
    when 'strongman' then 11
    when 'cardio' then 7
    else 0 end
)
insert into public.exercicios(
  nome, categoria_id, equipamento_id, nivel, tipo, descricao, instrucoes,
  erros_comuns, imagem_url, video_url, observacoes, criado_por, academia_id,
  publico, ativo, fonte, fonte_id, atualizado_em
)
select
  s.nome_pt,
  cm.id,
  eq.id,
  s.nivel_pt,
  s.tipo_pt,
  s.tipo_pt || ' com foco principal em ' || lower(s.grupo_nome) || '. Nome original: ' || s.nome_original || '.',
  (select string_agg(ord::text || '. ' || passo, E'\n' order by ord)
   from jsonb_array_elements_text(s.pt->'instructions') with ordinality as inst(passo, ord)),
  null,
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/' || s.fonte_id || '/0.jpg',
  'https://www.youtube.com/results?search_query=' || replace(replace(s.nome_original,' ','+'),'/','%2F') || '+exercise+form',
  'Fonte: Free Exercise DB (Unlicense). Tradução PT-BR: joao-gugel/exercicios-bd-ptbr. Nome original: ' || s.nome_original || '.',
  null, null, true, true, 'free-exercise-db', s.fonte_id, now()
from selecionados s
join public.categorias_musculares cm on cm.nome=s.grupo_nome
join public.equipamentos eq on eq.nome=s.equipamento_nome;

-- Liga músculos primários/secundários ao catálogo detalhado.
with original as (
  select value as j
  from jsonb_array_elements(
    ((select (extensions.http_get(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
    )).content))::jsonb
  )
),
musculos as (
  select j->>'id' as fonte_id,
         jsonb_array_elements_text(coalesce(j->'primaryMuscles','[]'::jsonb)) as musculo
  from original
  union all
  select j->>'id',
         jsonb_array_elements_text(coalesce(j->'secondaryMuscles','[]'::jsonb))
  from original
),
mapeados as (
  select distinct fonte_id,
    case musculo
      when 'abdominals' then 'Abdômen e core'
      when 'adductors' then 'Adutores e abdutores'
      when 'abductors' then 'Adutores e abdutores'
      when 'forearms' then 'Antebraços'
      when 'biceps' then 'Bíceps'
      when 'lats' then 'Costas'
      when 'middle back' then 'Costas'
      when 'glutes' then 'Glúteos'
      when 'lower back' then 'Lombar'
      when 'shoulders' then 'Ombros'
      when 'calves' then 'Panturrilhas'
      when 'chest' then 'Peito'
      when 'hamstrings' then 'Posteriores de coxa'
      when 'quadriceps' then 'Quadríceps'
      when 'traps' then 'Trapézio'
      when 'triceps' then 'Tríceps'
      when 'neck' then 'Pescoço'
      else null end as grupo_nome
  from musculos
)
insert into public.exercicio_secundarios(exercicio_id,categoria_id)
select e.id, cm.id
from mapeados m
join public.exercicios e on e.fonte='free-exercise-db' and e.fonte_id=m.fonte_id
join public.categorias_musculares cm on cm.nome=m.grupo_nome
where m.grupo_nome is not null and cm.id <> e.categoria_id
on conflict do nothing;

-- Usuários podem criar e manter exercícios privados próprios, sem alterar o catálogo público.
drop policy if exists exercicio_cria_proprio on public.exercicios;
create policy exercicio_cria_proprio
on public.exercicios for insert to authenticated
with check (
  criado_por = (select auth.uid())
  and publico = false
);

drop policy if exists exercicio_edita_proprio on public.exercicios;
create policy exercicio_edita_proprio
on public.exercicios for update to authenticated
using (criado_por = (select auth.uid()) and publico = false)
with check (criado_por = (select auth.uid()) and publico = false);

drop policy if exists secundario_cria_em_exercicio_proprio on public.exercicio_secundarios;
create policy secundario_cria_em_exercicio_proprio
on public.exercicio_secundarios for insert to authenticated
with check (exists (
  select 1 from public.exercicios e
  where e.id=exercicio_id
    and e.criado_por=(select auth.uid())
    and e.publico=false
));

drop policy if exists secundario_remove_de_exercicio_proprio on public.exercicio_secundarios;
create policy secundario_remove_de_exercicio_proprio
on public.exercicio_secundarios for delete to authenticated
using (exists (
  select 1 from public.exercicios e
  where e.id=exercicio_id
    and e.criado_por=(select auth.uid())
    and e.publico=false
));
