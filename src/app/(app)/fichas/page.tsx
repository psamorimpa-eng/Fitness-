import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Dumbbell, Plus } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Titulo, Etiqueta, Cabecalho, Vazio } from "@/components/ui";
import AcoesFicha from "@/components/AcoesFicha";
import CompartilharFicha from "@/components/CompartilharFicha";
import { fmtData } from "@/lib/formato";
import { avisoValidade } from "@/lib/validade";

export const dynamic = "force-dynamic";

export default async function Fichas() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  await supabase.rpc("vencer_minhas_fichas");
  const { data: fichas } = await supabase
    .from("fichas")
    .select("id, nome, objetivo, data_inicio, data_validade, status, aluno_id, divisoes_treino(id)")
    .eq("aluno_id", usuario.id)
    .order("data_inicio", { ascending: false });

  const acoesTopo = (
    <div className="flex items-center gap-2">
      <Link href="/exercicios" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}><Dumbbell size={15} /> Exercícios</Link>
      <Link href="/fichas/nova" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: "var(--marca)" }}><Plus size={15} /> Nova</Link>
    </div>
  );

  if (!fichas?.length) {
    return <><Cabecalho titulo="Fichas" direita={acoesTopo} /><Vazio titulo="Nenhuma ficha criada" texto="Monte sua primeira ficha de treino." acao={<Link href="/fichas/nova" className="rounded-xl px-4 py-3 font-semibold text-white" style={{ background: "var(--marca)" }}>Criar ficha</Link>} /></>;
  }

  return (
    <>
      <Cabecalho titulo="Fichas" sub={`${fichas.length} cadastradas`} direita={acoesTopo} />
      <div className="space-y-2 px-4 pt-3">
        {fichas.map((f: any) => {
          const aviso = avisoValidade(f.data_validade);
          const destacar = aviso && aviso.tipo !== "ok";
          return (
            <Cartao key={f.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Titulo tamanho={16}>{f.nome}</Titulo>
                  <div className="text-xs" style={{ color: "var(--dim)" }}>{f.objetivo ?? "Treino"} · {f.divisoes_treino?.length ?? 0} divisões</div>
                  <div className="mt-1 text-xs" style={{ color: "var(--fraco)" }}>{fmtData(f.data_inicio)} a {fmtData(f.data_validade)}</div>
                </div>
                <Etiqueta cor={f.status === "ativa" ? "#16A34A" : f.status === "vencida" ? "#D62828" : undefined}>{f.status}</Etiqueta>
              </div>
              {aviso && (
                <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: destacar ? "var(--marca-suave)" : "var(--superficie-2)", color: destacar ? "var(--marca)" : "var(--dim)" }}>
                  {destacar && <AlertTriangle size={14} className="shrink-0" />} {aviso.texto}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/fichas/${f.id}/editar`} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}>Editar</Link>
                <CompartilharFicha fichaId={f.id} fichaNome={f.nome} />
                <AcoesFicha fichaId={f.id} status={f.status} />
                <Link href="/historico" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}>Treinos</Link>
              </div>
            </Cartao>
          );
        })}
      </div>
    </>
  );
}
