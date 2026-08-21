-- O catálogo público mantém nomes únicos globalmente.
-- Exercícios privados são únicos apenas dentro da própria conta.

drop index if exists public.ux_exercicio_nome;

create unique index if not exists ux_exercicio_nome_publico
  on public.exercicios(lower(btrim(nome)), coalesce(academia_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where publico = true and ativo = true;

create unique index if not exists ux_exercicio_nome_usuario
  on public.exercicios(criado_por, lower(btrim(nome)))
  where publico = false and criado_por is not null and ativo = true;
