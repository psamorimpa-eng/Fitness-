import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Rotulo, Titulo, Cabecalho, Vazio, Etiqueta } from "@/components/ui";
import { fmtData } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Historico() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  const { data: treinos } = await supabase
    .from("treinos_realizados")
    .select("id, data, inicio_em, duracao_min, volume_total, observacoes, status, ficha_nome_snapshot, divisao_codigo_snapshot, divisao_nome_snapshot, series_realizadas(id)")
    .eq("aluno_id", usuario.id)
    .order("inicio_em", { ascending: false })
    .limit(100);

  if (!treinos?.length) {
    return <Vazio titulo="Nenhum treino ainda" texto="Quando você iniciar um treino, ele ficará salvo aqui mesmo antes de ser finalizado." />;
  }

  return (
    <>
      <Cabecalho titulo="Histórico" sub={`${treinos.length} sessões registradas`} />
      <div className="space-y-3 px-4 pt-3">
        {treinos.map((t: any) => (
          <Cartao key={t.id} href={`/historico/${t.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="display rounded-lg px-2 py-0.5 text-sm" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>{t.divisao_codigo_snapshot ?? "-"}</span>
                  <Titulo tamanho={16}>{fmtData(t.data)}</Titulo>
                </div>
                <div className="mt-1 truncate text-xs" style={{ color: "var(--dim)" }}>{t.ficha_nome_snapshot ?? t.divisao_nome_snapshot ?? "Treino"}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--fraco)" }}>{t.series_realizadas?.length ?? 0} séries · {t.duracao_min ? `${t.duracao_min} min` : "duração em andamento"}</div>
                <div className="mt-2"><Etiqueta cor={t.status === "concluido" ? "#16A34A" : t.status === "em_andamento" ? "#F4C20D" : undefined}>{t.status === "concluido" ? "Concluído" : t.status === "em_andamento" ? "Em andamento" : "Incompleto"}</Etiqueta></div>
              </div>
              <div className="shrink-0 text-right">
                <Rotulo>Volume</Rotulo>
                <span className="numero text-base">{Number(t.volume_total ?? 0).toLocaleString("pt-BR")}</span>
                <span className="text-xs" style={{ color: "var(--dim)" }}> kg</span>
              </div>
            </div>
          </Cartao>
        ))}
      </div>
    </>
  );
}
