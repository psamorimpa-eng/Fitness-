create or replace function public.catalogo_exercicios_v2()
returns table(
  id uuid,
  nome text,
  nivel text,
  tipo text,
  descricao text,
  instrucoes text,
  erros_comuns text,
  imagem_url text,
  video_url text,
  grupo text,
  equipamento text,
  grupos_secundarios text[]
)
language sql
stable
set search_path = public
as $$
  select
    e.id,
    e.nome,
    e.nivel,
    e.tipo,
    e.descricao,
    e.instrucoes,
    e.erros_comuns,
    e.imagem_url,
    e.video_url,
    coalesce(cm.nome, 'Outros') as grupo,
    coalesce(eq.nome, 'Outros') as equipamento,
    coalesce((
      select array_agg(cms.nome order by cms.nome)
      from public.exercicio_secundarios es
      join public.categorias_musculares cms on cms.id = es.categoria_id
      where es.exercicio_id = e.id
    ), array[]::text[]) as grupos_secundarios
  from public.exercicios e
  left join public.categorias_musculares cm on cm.id = e.categoria_principal_id
  left join public.equipamentos eq on eq.id = e.equipamento_id
  where e.ativo = true and (e.publico = true or e.criado_por = auth.uid())
  order by e.nome;
$$;

revoke all on function public.catalogo_exercicios_v2() from public, anon;
grant execute on function public.catalogo_exercicios_v2() to authenticated;
