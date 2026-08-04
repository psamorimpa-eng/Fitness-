import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Rotulo, Titulo, Cabecalho, Vazio } from "@/components/ui";
import { fmtData } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Historico({ searchParams }: { searchParams: { aluno?: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();
  const alunoId = searchParams.aluno ?? usuario.id;

  const { data: treinos } = await supabase
    .from("treinos_realizados")
    .select("id, data, duracao_min, volume_total, observacoes, divisoes_treino(codigo, nome), series_realizadas(id)")
    .eq("aluno_id", alunoId)
    .eq("status", "concluido")
    .order("data", { ascending: false })
    .limit(60);

  if (!treinos?.length) {
    return <Vazio titulo="Nenhum treino ainda" texto="Assim que você concluir o primeiro treino ele aparece aqui." />;
  }

  return (
    <>
      <Cabecalho titulo="Histórico" sub={`${treinos.length} treinos registrados`} />
      <div className="space-y-3 px-4 pt-3">
        {treinos.map((t: any) => (
          <Cartao key={t.id} href={`/historico/${t.id}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="display rounded-lg px-2 py-0.5 text-sm"
                    style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
                    {t.divisoes_treino?.codigo ?? "-"}
                  </span>
                  <Titulo tamanho={16}>{fmtData(t.data)}</Titulo>
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--dim)" }}>
                  {t.series_realizadas?.length ?? 0} séries · {t.duracao_min} min
                </div>
              </div>
              <div className="text-right">
                <Rotulo>Volume</Rotulo>
                <span className="numero text-base">{(Number(t.volume_total ?? 0) / 1000).toFixed(1)}</span>
                <span className="text-xs" style={{ color: "var(--dim)" }}> t</span>
              </div>
            </div>
          </Cartao>
        ))}
      </div>
    </>
  );
}
