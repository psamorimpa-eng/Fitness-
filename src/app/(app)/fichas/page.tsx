import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Titulo, Etiqueta, Cabecalho, Vazio } from "@/components/ui";
import AcoesFicha from "@/components/AcoesFicha";
import { fmtData } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Fichas() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  const { data: fichas } = await supabase
    .from("fichas")
    .select("id, nome, objetivo, data_inicio, data_validade, status, aluno_id, divisoes_treino(id)")
    .eq("aluno_id", usuario.id)
    .order("data_inicio", { ascending: false });

  const botaoNova = (
    <Link href="/fichas/nova"
      className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white"
      style={{ background: "var(--marca)" }}>
      <Plus size={15} /> Nova
    </Link>
  );

  if (!fichas?.length) {
    return (
      <>
        <Cabecalho titulo="Fichas" direita={botaoNova} />
        <Vazio titulo="Nenhuma ficha criada" texto="Monte sua primeira ficha de treino."
          acao={<Link href="/fichas/nova" className="rounded-xl px-4 py-3 font-semibold text-white"
            style={{ background: "var(--marca)" }}>Criar ficha</Link>} />
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo="Fichas" sub={`${fichas.length} cadastradas`} direita={botaoNova} />
      <div className="space-y-2 px-4 pt-3">
        {fichas.map((f: any) => (
          <Cartao key={f.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Titulo tamanho={16}>{f.nome}</Titulo>
                <div className="text-xs" style={{ color: "var(--dim)" }}>
                  {f.objetivo ?? "Treino"} · {f.divisoes_treino?.length ?? 0} divisões
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--fraco)" }}>
                  {fmtData(f.data_inicio)} a {fmtData(f.data_validade)}
                </div>
              </div>
              <Etiqueta cor={f.status === "ativa" ? "#16A34A" : undefined}>{f.status}</Etiqueta>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/fichas/${f.id}/editar`} className="rounded-xl px-3 py-2 text-sm"
                style={{ border: "1px solid var(--linha)" }}>Editar</Link>
              <AcoesFicha fichaId={f.id} status={f.status} />
              <Link href="/historico" className="rounded-xl px-3 py-2 text-sm"
                style={{ border: "1px solid var(--linha)" }}>Treinos</Link>
            </div>
          </Cartao>
        ))}
      </div>
    </>
  );
}
