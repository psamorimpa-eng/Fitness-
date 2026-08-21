import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ImageOff, Plus } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cabecalho, Cartao, Etiqueta, Rotulo, Titulo, Vazio } from "@/components/ui";
import AcoesExercicio from "@/components/AcoesExercicio";

export const dynamic = "force-dynamic";

export default async function ExerciciosPage({ searchParams }: { searchParams?: { salvo?: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  const [{ data: meus }, { count: totalPublicos }] = await Promise.all([
    supabase
      .from("exercicios")
      .select("id, nome, nivel, tipo, imagem_url, video_url, ativo, atualizado_em, categorias_musculares(nome), equipamentos(nome)")
      .eq("criado_por", usuario.id)
      .eq("publico", false)
      .order("ativo", { ascending: false })
      .order("nome"),
    supabase
      .from("exercicios")
      .select("id", { count: "exact", head: true })
      .eq("publico", true)
      .eq("ativo", true),
  ]);

  const botaoNovo = (
    <Link href="/exercicios/novo" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: "var(--marca)" }}>
      <Plus size={15} /> Novo
    </Link>
  );

  return (
    <>
      <Cabecalho titulo="Exercícios" sub={`${totalPublicos ?? 0} no catálogo público`} direita={botaoNovo} />

      {searchParams?.salvo === "1" && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl px-3 py-3 text-sm" style={{ background: "#16A34A18", color: "#16A34A", border: "1px solid #16A34A35" }}>
          <CheckCircle2 size={17} /> Exercício salvo e disponível na criação de fichas.
        </div>
      )}

      <div className="px-4 pt-3">
        <Cartao>
          <Rotulo>Como funciona</Rotulo>
          <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>
            O catálogo público é compartilhado para consulta. Os exercícios que você cadastrar aqui são privados e aparecem somente na sua conta ao montar uma ficha.
          </p>
        </Cartao>
      </div>

      <section className="px-4 pb-6 pt-5">
        <Titulo tamanho={18}>Meus exercícios</Titulo>
        {!meus?.length ? (
          <Vazio
            titulo="Nenhum exercício próprio"
            texto="Se não encontrar um movimento no catálogo, cadastre sua própria versão com foto, vídeo e instruções."
            acao={<Link href="/exercicios/novo" className="rounded-xl px-4 py-3 font-semibold text-white" style={{ background: "var(--marca)" }}>Cadastrar exercício</Link>}
          />
        ) : (
          <div className="mt-3 space-y-3">
            {meus.map((e: any) => (
              <Cartao key={e.id}>
                <div className="flex gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)" }}>
                    <div className="absolute inset-0 flex items-center justify-center" style={{ color: "var(--fraco)" }}><ImageOff size={20} /></div>
                    {e.imagem_url && <img src={e.imagem_url} alt={e.nome} className="relative h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Titulo tamanho={16}>{e.nome}</Titulo>
                        <div className="text-xs" style={{ color: "var(--dim)" }}>
                          {e.categorias_musculares?.nome ?? "Outros"} · {e.equipamentos?.nome ?? "Outros"}
                        </div>
                      </div>
                      <Etiqueta cor={e.ativo ? "#16A34A" : undefined}>{e.ativo ? "ativo" : "arquivado"}</Etiqueta>
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "var(--fraco)" }}>{e.tipo ?? "Exercício"} · {e.nivel ?? "Intermediário"}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/exercicios/${e.id}/editar`} className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}>Editar</Link>
                  <AcoesExercicio id={e.id} ativo={Boolean(e.ativo)} />
                  {e.video_url && <a href={e.video_url} target="_blank" rel="noreferrer" className="rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}>Demonstração</a>}
                </div>
              </Cartao>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
