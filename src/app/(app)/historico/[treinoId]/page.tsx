import { notFound } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { Cartao, Rotulo, Titulo, Indicador, Cabecalho } from "@/components/ui";
import { fmtData } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function DetalheTreino({ params }: { params: { treinoId: string } }) {
  const supabase = criarClienteServidor();

  const { data: treino } = await supabase
    .from("treinos_realizados")
    .select("*, divisoes_treino(codigo, nome), series_realizadas(*, exercicios(nome))")
    .eq("id", params.treinoId)
    .maybeSingle();

  if (!treino) notFound();

  const porExercicio = new Map<string, any[]>();
  (treino.series_realizadas ?? []).forEach((s: any) => {
    const chave = s.exercicios?.nome ?? s.exercicio_id;
    porExercicio.set(chave, [...(porExercicio.get(chave) ?? []), s]);
  });

  return (
    <>
      <Cabecalho titulo={`Treino ${treino.divisoes_treino?.codigo ?? ""}`} sub={fmtData(treino.data)} />
      <div className="space-y-3 px-4 pt-3">
        <div className="grid grid-cols-3 gap-3">
          <Indicador rotulo="Duração" valor={treino.duracao_min ?? "-"} unidade="min" />
          <Indicador rotulo="Séries" valor={treino.series_realizadas?.length ?? 0} />
          <Indicador rotulo="Volume" valor={Math.round(Number(treino.volume_total ?? 0))} unidade="kg" />
        </div>

        {[...porExercicio.entries()].map(([nome, series]) => (
          <Cartao key={nome}>
            <Titulo tamanho={16}>{nome}</Titulo>
            <div className="mt-2 space-y-1">
              {series.sort((a, b) => a.numero_serie - b.numero_serie).map((s) => (
                <div key={s.id} className="flex justify-between rounded-lg px-3 py-1.5"
                  style={{ background: "var(--superficie-2)" }}>
                  <span className="display text-sm" style={{ color: "var(--dim)", letterSpacing: "0.08em" }}>
                    Série {s.numero_serie}
                  </span>
                  <span className="numero text-xs">{s.carga_kg} kg × {s.repeticoes} · PSE {s.pse ?? "-"}</span>
                </div>
              ))}
            </div>
          </Cartao>
        ))}

        {treino.observacoes && (
          <Cartao><Rotulo>Observações</Rotulo><p className="mt-1 text-sm">{treino.observacoes}</p></Cartao>
        )}
      </div>
    </>
  );
}
