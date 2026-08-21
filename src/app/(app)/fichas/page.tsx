import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Plus, Users } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Titulo, Etiqueta, Cabecalho, Vazio } from "@/components/ui";
import AcoesFicha from "@/components/AcoesFicha";
import { fmtData } from "@/lib/formato";
import { avisoValidade } from "@/lib/validade";

export const dynamic = "force-dynamic";

export default async function Fichas() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();
  const personal = usuario.papel === "personal";

  if (!personal) await supabase.rpc("vencer_minhas_fichas");

  const { data: fichas } = await supabase
    .from("fichas")
    .select("id, nome, objetivo, data_inicio, data_validade, status, aluno_id, divisoes_treino(id), usuarios!fichas_aluno_id_fkey(nome)")
    .order("data_inicio", { ascending: false });

  const botoes = (
    <div className="flex items-center gap-2">
      {personal && (
        <Link href="/alunos" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}>
          <Users size={15} /> Alunos
        </Link>
      )}
      <Link href="/fichas/nova" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: "var(--marca)" }}>
        <Plus size={15} /> Nova
      </Link>
    </div>
  );

  if (!fichas?.length) {
    return (
      <>
        <Cabecalho titulo="Fichas" direita={botoes} />
        <Vazio
          titulo={personal ? "Nenhuma ficha dos seus alunos" : "Nenhuma ficha criada"}
          texto={personal ? "Abra Meus alunos para escolher quem receberá a primeira ficha." : "Monte sua primeira ficha de treino."}
          acao={
            <Link href={personal ? "/alunos" : "/fichas/nova"} className="rounded-xl px-4 py-3 font-semibold text-white" style={{ background: "var(--marca)" }}>
              {personal ? "Ver meus alunos" : "Criar ficha"}
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo="Fichas" sub={`${fichas.length} cadastradas`} direita={botoes} />
      <div className="space-y-2 px-4 pt-3">
        {fichas.map((f: any) => {
          const aviso = avisoValidade(f.data_validade);
          const destacar = aviso && aviso.tipo !== "ok";
          return (
            <Cartao key={f.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Titulo tamanho={16}>{f.nome}</Titulo>
                  {personal && <div className="text-xs font-medium" style={{ color: "var(--marca)" }}>{f.usuarios?.nome ?? "Aluno"}</div>}
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
                <AcoesFicha fichaId={f.id} status={f.status} />
                {!personal && <Link href="/historico" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}>Treinos</Link>}
              </div>
            </Cartao>
          );
        })}
      </div>
    </>
  );
}
