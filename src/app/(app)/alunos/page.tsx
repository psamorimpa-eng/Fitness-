import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, ClipboardList, Plus, UserRound } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cabecalho, Cartao, Etiqueta, Indicador, Rotulo, Titulo, Vazio } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Alunos() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  if (usuario.papel !== "personal") redirect("/fichas");

  const supabase = criarClienteServidor();
  const { data: perfis } = await supabase
    .from("perfis_aluno")
    .select("usuario_id, objetivo, nivel, meta_semanal, peso_kg, usuarios!perfis_aluno_usuario_id_fkey(id, nome, email, ultimo_acesso_em)")
    .eq("personal_id", usuario.id)
    .order("usuario_id");

  const alunos = (perfis ?? []).map((p: any) => ({
    id: p.usuario_id,
    nome: p.usuarios?.nome ?? "Aluno",
    email: p.usuarios?.email ?? "",
    ultimo_acesso_em: p.usuarios?.ultimo_acesso_em ?? null,
    objetivo: p.objetivo ?? null,
    nivel: p.nivel ?? null,
    meta_semanal: p.meta_semanal ?? null,
    peso_kg: p.peso_kg == null ? null : Number(p.peso_kg),
  }));

  const ids = alunos.map((a) => a.id);
  const { data: fichas } = ids.length
    ? await supabase.from("fichas").select("id, aluno_id, status").in("aluno_id", ids)
    : { data: [] as any[] };

  const fichasPorAluno = new Map<string, { total: number; ativa: boolean }>();
  (fichas ?? []).forEach((f: any) => {
    const atual = fichasPorAluno.get(f.aluno_id) ?? { total: 0, ativa: false };
    atual.total += 1;
    atual.ativa = atual.ativa || f.status === "ativa";
    fichasPorAluno.set(f.aluno_id, atual);
  });

  const comFichaAtiva = alunos.filter((a) => fichasPorAluno.get(a.id)?.ativa).length;

  return (
    <>
      <Cabecalho
        titulo="Meus alunos"
        sub={`${alunos.length} vinculados`}
        direita={
          <Link href="/fichas/nova" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: "var(--marca)" }}>
            <Plus size={15} /> Ficha
          </Link>
        }
      />

      {!!alunos.length && (
        <div className="grid grid-cols-2 gap-3 px-4 pt-3">
          <Indicador rotulo="Alunos" valor={alunos.length} />
          <Indicador rotulo="Com ficha ativa" valor={comFichaAtiva} />
        </div>
      )}

      {!alunos.length ? (
        <Vazio
          titulo="Nenhum aluno vinculado"
          texto="O vínculo é explícito para que um Personal nunca veja dados de usuários que não sejam seus alunos."
        />
      ) : (
        <div className="space-y-3 px-4 pb-6 pt-4">
          {alunos.map((aluno) => {
            const resumo = fichasPorAluno.get(aluno.id) ?? { total: 0, ativa: false };
            return (
              <Cartao key={aluno.id}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--superficie-2)", color: "var(--marca)" }}>
                    <UserRound size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Titulo tamanho={16}>{aluno.nome}</Titulo>
                        <div className="truncate text-xs" style={{ color: "var(--dim)" }}>{aluno.email}</div>
                      </div>
                      <Etiqueta cor={resumo.ativa ? "#16A34A" : undefined}>{resumo.ativa ? "Ficha ativa" : "Sem ficha ativa"}</Etiqueta>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div><Rotulo>Objetivo</Rotulo><span>{aluno.objetivo ?? "Não informado"}</span></div>
                      <div><Rotulo>Nível</Rotulo><span>{aluno.nivel ?? "Não informado"}</span></div>
                      <div><Rotulo>Meta semanal</Rotulo><span className="numero">{aluno.meta_semanal ?? "-"}</span></div>
                      <div><Rotulo>Fichas</Rotulo><span className="numero">{resumo.total}</span></div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Link href={`/fichas/nova?aluno=${aluno.id}`} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: "var(--marca)" }}>
                        <ClipboardList size={15} /> Nova ficha
                      </Link>
                      <Link href="/fichas" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}>
                        Ver fichas <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </Cartao>
            );
          })}
        </div>
      )}
    </>
  );
}
