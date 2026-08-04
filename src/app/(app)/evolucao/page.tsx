import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cabecalho, Indicador, Vazio } from "@/components/ui";
import GraficosEvolucao from "@/components/GraficosEvolucao";
import { adesao, volumePorSemana, frequenciaPorSemana } from "@/lib/calculos";
import type { TreinoComSeries } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function Evolucao({ searchParams }: { searchParams: { aluno?: string } }) {
  const usuario = (await usuarioAtual())!;
  const supabase = criarClienteServidor();
  const alunoId = searchParams.aluno ?? usuario.id;

  const [{ data: treinos }, { data: medidas }] = await Promise.all([
    supabase.from("treinos_realizados")
      .select("id, aluno_id, ficha_id, divisao_id, data, duracao_min, volume_total, status, observacoes, series_realizadas(*, exercicios(nome))")
      .eq("aluno_id", alunoId).eq("status", "concluido").order("data"),
    supabase.from("medidas_corporais")
      .select("data, peso_kg, gordura_pct, cintura_cm, braco_d_cm")
      .eq("aluno_id", alunoId).order("data"),
  ]);

  const lista = (treinos ?? []) as unknown as TreinoComSeries[];
  if (!lista.length) {
    return <Vazio titulo="Sem dados de evolução" texto="Os gráficos aparecem depois do primeiro treino registrado." />;
  }

  const meta = usuario.perfis_aluno?.meta_semanal ?? 3;
  const tempoMedio = Math.round(lista.reduce((t, s) => t + (s.duracao_min ?? 0), 0) / lista.length);

  // progressão por exercício, calculada no servidor para o gráfico não receber dados brutos demais
  const progressao = new Map<string, { data: string; carga: number }[]>();
  lista.forEach((t) => {
    const melhorPorExercicio = new Map<string, number>();
    t.series_realizadas.forEach((s: any) => {
      const nome = s.exercicios?.nome ?? s.exercicio_id;
      melhorPorExercicio.set(nome, Math.max(melhorPorExercicio.get(nome) ?? 0, Number(s.carga_kg)));
    });
    melhorPorExercicio.forEach((carga, nome) => {
      progressao.set(nome, [...(progressao.get(nome) ?? []), { data: t.data, carga }]);
    });
  });

  return (
    <>
      <Cabecalho titulo="Evolução" sub={`${lista.length} treinos concluídos`} />
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        <Indicador rotulo="Treinos" valor={lista.length} />
        <Indicador rotulo="Adesão à ficha" valor={adesao(lista, meta)} unidade="%" />
        <Indicador rotulo="Tempo médio" valor={tempoMedio} unidade="min" />
        <Indicador rotulo="Peso atual" valor={medidas?.at(-1)?.peso_kg ?? "-"} unidade="kg" />
      </div>

      <GraficosEvolucao
        volume={volumePorSemana(lista)}
        frequencia={frequenciaPorSemana(lista)}
        medidas={(medidas ?? []).map((m: any) => ({ data: m.data, peso: m.peso_kg, gordura: m.gordura_pct }))}
        progressao={Object.fromEntries(progressao)}
      />
    </>
  );
}
