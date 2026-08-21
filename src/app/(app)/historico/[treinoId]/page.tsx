import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Rotulo, Titulo, Indicador, Cabecalho, Etiqueta } from "@/components/ui";
import { fmtData } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function DetalheTreino({ params }: { params: { treinoId: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  const { data: treino } = await supabase
    .from("treinos_realizados")
    .select("*, series_realizadas(*)")
    .eq("id", params.treinoId)
    .eq("aluno_id", usuario.id)
    .maybeSingle();

  if (!treino) notFound();

  const porExercicio = new Map<string, any[]>();
  (treino.series_realizadas ?? []).forEach((s: any) => {
    const chave = s.exercicio_nome_snapshot ?? s.exercicio_id;
    porExercicio.set(chave, [...(porExercicio.get(chave) ?? []), s]);
  });

  return (
    <>
      <Cabecalho titulo={`Treino ${treino.divisao_codigo_snapshot ?? ""}`} sub={`${fmtData(treino.data)} · ${treino.ficha_nome_snapshot ?? treino.divisao_nome_snapshot ?? "Treino"}`} />
      <div className="space-y-3 px-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <Etiqueta cor={treino.status === "concluido" ? "#16A34A" : treino.status === "em_andamento" ? "#F4C20D" : undefined}>
            {treino.status === "concluido" ? "Concluído" : treino.status === "em_andamento" ? "Em andamento" : "Incompleto"}
          </Etiqueta>
          {treino.status === "em_andamento" && treino.divisao_id && (
            <Link href={`/treino/${treino.divisao_id}`} className="rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: "var(--marca)" }}>Continuar treino</Link>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Indicador rotulo="Duração" valor={treino.duracao_min ?? "-"} unidade={treino.duracao_min ? "min" : ""} />
          <Indicador rotulo="Séries" valor={treino.series_realizadas?.length ?? 0} />
          <Indicador rotulo="Volume" valor={Math.round(Number(treino.volume_total ?? 0))} unidade="kg" />
        </div>

        {[...porExercicio.entries()].map(([nome, series]) => {
          const primeira: any = series[0];
          return (
            <Cartao key={nome}>
              <Titulo tamanho={16}>{nome}</Titulo>
              <div className="mt-1 text-xs" style={{ color: "var(--fraco)" }}>
                Planejado: {primeira.series_planejadas ?? "-"} séries · {primeira.rep_min_planejada ?? "-"}–{primeira.rep_max_planejada ?? "-"} reps
                {primeira.carga_planejada != null ? ` · ${Number(primeira.carga_planejada)} kg` : ""}
                {primeira.descanso_planejado ? ` · ${primeira.descanso_planejado}s descanso` : ""}
              </div>
              <div className="mt-2 space-y-1">
                {series.sort((a, b) => a.numero_serie - b.numero_serie).map((s) => (
                  <div key={s.id} className="flex justify-between rounded-lg px-3 py-1.5" style={{ background: "var(--superficie-2)" }}>
                    <span className="display text-sm" style={{ color: "var(--dim)", letterSpacing: "0.08em" }}>Série {s.numero_serie}</span>
                    <span className="numero text-xs">{Number(s.carga_kg)} kg × {s.repeticoes} · PSE {s.pse ?? "-"}</span>
                  </div>
                ))}
              </div>
              {primeira.observacoes && <p className="mt-2 text-xs" style={{ color: "var(--dim)" }}>{primeira.observacoes}</p>}
            </Cartao>
          );
        })}

        {treino.observacoes && <Cartao><Rotulo>Observações</Rotulo><p className="mt-1 text-sm">{treino.observacoes}</p></Cartao>}
      </div>
    </>
  );
}
