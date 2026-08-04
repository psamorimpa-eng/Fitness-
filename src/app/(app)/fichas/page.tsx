import Link from "next/link";
import { Plus } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Titulo, Etiqueta, Cabecalho, Vazio } from "@/components/ui";
import AcoesFicha from "@/components/AcoesFicha";
import { fmtData } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Fichas() {
  const usuario = (await usuarioAtual())!;
  const supabase = criarClienteServidor();

  const consulta = supabase
    .from("fichas")
    .select("id, nome, objetivo, data_inicio, data_validade, status, aluno_id, divisoes_treino(id), usuarios!fichas_aluno_id_fkey(nome)")
    .order("data_inicio", { ascending: false });

  const [{ data: fichas }, { data: vinculados }] = await Promise.all([
    usuario.papel === "admin" ? consulta : consulta.eq("personal_id", usuario.id),
    supabase.from("perfis_aluno")
      .select("usuario_id, usuarios!perfis_aluno_usuario_id_fkey(nome)")
      .eq("personal_id", usuario.id),
  ]);

  const alunos = (vinculados ?? []).map((a: any) => ({ id: a.usuario_id, nome: a.usuarios?.nome ?? "Sem nome" }));

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
        <Vazio titulo="Nenhuma ficha criada" texto="Monte a primeira ficha para um dos seus alunos."
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
                  {f.usuarios?.nome} · {f.divisoes_treino?.length ?? 0} divisões
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
              <AcoesFicha fichaId={f.id} status={f.status} alunos={alunos} />
              <Link href={`/historico?aluno=${f.aluno_id}`} className="rounded-xl px-3 py-2 text-sm"
                style={{ border: "1px solid var(--linha)" }}>Treinos</Link>
            </div>
          </Cartao>
        ))}
      </div>
    </>
  );
}
