import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cabecalho, Cartao, Indicador, Rotulo, Titulo, Vazio } from "@/components/ui";
import GraficosEvolucao from "@/components/GraficosEvolucao";
import { adesao, volumePorSemana, frequenciaPorSemana } from "@/lib/calculos";
import { fmtData } from "@/lib/formato";
import type { TreinoComSeries } from "@/lib/tipos";

export const dynamic = "force-dynamic";

type SessaoExercicio = {
  treinoId: string;
  data: string;
  series: number;
  repeticoes: number;
  cargaMax: number;
  volume: number;
};

type SerieHistorico = {
  dataTreino: string;
  treinoId: string;
  carga: number;
  reps: number;
  volume: number;
  registrada_em?: string | null;
  [chave: string]: unknown;
};

type ResumoExercicio = {
  nome: string;
  vezes: number;
  totalSeries: number;
  totalRepeticoes: number;
  volumeTotal: number;
  melhorCarga: number;
  melhorSerie: { carga: number; repeticoes: number; volume: number };
  ultimoTreino: string;
  ultimaCarga: number;
  ultimasReps: number;
  sessoes: SessaoExercicio[];
};

export default async function Evolucao() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();
  const alunoId = usuario.id;

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

  const progressao = new Map<string, { data: string; carga: number }[]>();
  const porExercicio = new Map<string, {
    nome: string;
    series: SerieHistorico[];
    sessoes: Map<string, SessaoExercicio>;
  }>();

  lista.forEach((t: any) => {
    const melhorPorExercicio = new Map<string, number>();

    (t.series_realizadas ?? []).forEach((s: any) => {
      const nome = s.exercicio_nome_snapshot ?? s.exercicios?.nome ?? "Exercício";
      const chave = s.exercicio_id;
      const carga = Number(s.carga_kg ?? 0);
      const reps = Number(s.repeticoes ?? 0);
      const volume = Number(s.volume ?? carga * reps);

      melhorPorExercicio.set(nome, Math.max(melhorPorExercicio.get(nome) ?? 0, carga));

      const atual = porExercicio.get(chave) ?? {
        nome,
        series: [] as SerieHistorico[],
        sessoes: new Map<string, SessaoExercicio>(),
      };
      atual.nome = nome;
      atual.series.push({ ...s, dataTreino: t.data, treinoId: t.id, carga, reps, volume });

      const sessao = atual.sessoes.get(t.id) ?? {
        treinoId: t.id,
        data: t.data,
        series: 0,
        repeticoes: 0,
        cargaMax: 0,
        volume: 0,
      };
      sessao.series += 1;
      sessao.repeticoes += reps;
      sessao.cargaMax = Math.max(sessao.cargaMax, carga);
      sessao.volume += volume;
      atual.sessoes.set(t.id, sessao);
      porExercicio.set(chave, atual);
    });

    melhorPorExercicio.forEach((carga, nome) => {
      progressao.set(nome, [...(progressao.get(nome) ?? []), { data: t.data, carga }]);
    });
  });

  const resumos: ResumoExercicio[] = [...porExercicio.values()].map((ex) => {
    const ordenadas = [...ex.series].sort((a, b) => {
      const porData = String(b.dataTreino).localeCompare(String(a.dataTreino));
      if (porData) return porData;
      return String(b.registrada_em ?? "").localeCompare(String(a.registrada_em ?? ""));
    });
    const ultima = ordenadas[0];
    const melhorSerie = ex.series.reduce<SerieHistorico | null>((melhor, s) =>
      Number(s.volume) > Number(melhor?.volume ?? -1) ? s : melhor, null);
    const sessoes = [...ex.sessoes.values()].sort((a, b) => b.data.localeCompare(a.data));

    return {
      nome: ex.nome,
      vezes: sessoes.length,
      totalSeries: ex.series.length,
      totalRepeticoes: ex.series.reduce((total, s) => total + Number(s.reps ?? 0), 0),
      volumeTotal: ex.series.reduce((total, s) => total + Number(s.volume ?? 0), 0),
      melhorCarga: Math.max(...ex.series.map((s) => Number(s.carga ?? 0))),
      melhorSerie: {
        carga: Number(melhorSerie?.carga ?? 0),
        repeticoes: Number(melhorSerie?.reps ?? 0),
        volume: Number(melhorSerie?.volume ?? 0),
      },
      ultimoTreino: ultima?.dataTreino ?? "",
      ultimaCarga: Number(ultima?.carga ?? 0),
      ultimasReps: Number(ultima?.reps ?? 0),
      sessoes,
    };
  }).sort((a, b) => b.ultimoTreino.localeCompare(a.ultimoTreino) || a.nome.localeCompare(b.nome));

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

      <section className="px-4 pb-6 pt-4">
        <div className="mb-3">
          <Titulo tamanho={20}>Histórico por exercício</Titulo>
          <p className="mt-1 text-xs" style={{ color: "var(--dim)" }}>
            Cargas, repetições e volume são preservados por treino e nunca substituem registros anteriores.
          </p>
        </div>

        <div className="space-y-3">
          {resumos.map((ex) => (
            <Cartao key={ex.nome}>
              <Titulo tamanho={16}>{ex.nome}</Titulo>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><Rotulo>Melhor carga</Rotulo><span className="numero">{ex.melhorCarga} kg</span></div>
                <div><Rotulo>Melhor série</Rotulo><span className="numero">{ex.melhorSerie.carga} kg × {ex.melhorSerie.repeticoes}</span></div>
                <div><Rotulo>Último treino</Rotulo><span>{fmtData(ex.ultimoTreino)}</span></div>
                <div><Rotulo>Último resultado</Rotulo><span className="numero">{ex.ultimaCarga} kg × {ex.ultimasReps}</span></div>
                <div><Rotulo>Vezes realizado</Rotulo><span className="numero">{ex.vezes}</span></div>
                <div><Rotulo>Volume acumulado</Rotulo><span className="numero">{Math.round(ex.volumeTotal)} kg</span></div>
              </div>

              <div className="mt-3 overflow-hidden rounded-xl" style={{ border: "1px solid var(--linha)" }}>
                {ex.sessoes.slice(0, 6).map((s, i) => (
                  <div key={s.treinoId} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 text-xs"
                    style={{ borderTop: i ? "1px solid var(--linha)" : undefined }}>
                    <div>
                      <div>{fmtData(s.data)}</div>
                      <div style={{ color: "var(--dim)" }}>{s.series} séries · {s.repeticoes} reps</div>
                    </div>
                    <div className="text-right numero">
                      <div>{s.cargaMax} kg máx.</div>
                      <div style={{ color: "var(--dim)" }}>{Math.round(s.volume)} kg volume</div>
                    </div>
                  </div>
                ))}
              </div>
            </Cartao>
          ))}
        </div>
      </section>
    </>
  );
}
