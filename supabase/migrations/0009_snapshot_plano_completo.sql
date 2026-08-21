create or replace function public.fn_snapshot_treino()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.aluno_id is distinct from auth.uid() and auth.uid() is not null then
    raise exception 'Treino pertence a outro usuario';
  end if;

  if new.ficha_nome_snapshot is null and new.ficha_id is not null then
    select f.nome into new.ficha_nome_snapshot
      from public.fichas f where f.id=new.ficha_id and f.aluno_id=new.aluno_id;
  end if;

  if new.divisao_id is not null then
    if new.divisao_codigo_snapshot is null or new.divisao_nome_snapshot is null then
      select d.codigo,d.nome into new.divisao_codigo_snapshot,new.divisao_nome_snapshot
      from public.divisoes_treino d
      join public.fichas f on f.id=d.ficha_id
      where d.id=new.divisao_id and f.aluno_id=new.aluno_id;
    end if;

    if coalesce(jsonb_array_length(new.plano_snapshot),0)=0 then
      select coalesce(jsonb_agg(jsonb_build_object(
        'exercicio_id',e.id,
        'nome',e.nome,
        'ordem',sp.ordem,
        'series',sp.series,
        'rep_min',sp.rep_min,
        'rep_max',sp.rep_max,
        'carga_sugerida',sp.carga_sugerida,
        'descanso_seg',sp.descanso_seg,
        'cadencia',sp.cadencia,
        'tecnica',sp.tecnica,
        'rir',sp.rir,
        'series_aquecimento',sp.series_aquecimento,
        'observacoes',sp.observacoes
      ) order by sp.ordem),'[]'::jsonb)
      into new.plano_snapshot
      from public.series_planejadas sp
      join public.exercicios e on e.id=sp.exercicio_id
      where sp.divisao_id=new.divisao_id;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.fn_snapshot_treino() from public, anon, authenticated;
