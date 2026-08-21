import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Play, RotateCcw } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Rotulo, Titulo, Etiqueta, Vazio } from "@/components/ui";
import { fmtData } from "@/lib/formato";
import { avisoValidade } from "@/lib/validade";

export const dynamic = "force-dynamic";

export default async function Treino() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  await supabase.rpc("vencer_minhas_fichas");
  const [{ data: ficha }, { data: abertos }] = await Promise.all([
    supabase.from("fichas").select("*, divisoes_treino(*, series_planejadas(*, exercicios(nome)))").eq("aluno_id", usuario.id).eq("status", "ativa").maybeSingle(),
    supabase.from("treinos_realizados").select("id, divisao_id, inicio_em").eq("aluno_id", usuario.id).eq("status", "em_andamento").order("inicio_em", { ascending: false }),
  ]);

  if (!ficha) {
    return <Vazio titulo="Nenhuma ficha ativa" texto="Crie uma nova ficha ou consulte suas fichas vencidas/arquivadas." acao={<Link href="/fichas" className="rounded-xl px-4 py-3 font-semibold text-white" style={{ background: "var(--marca)" }}>Ver minhas fichas</Link>} />;
  }

  const divisoes = [...(ficha.divisoes_treino ?? [])].sort((a: any, b: any) => a.ordem - b.ordem);
  const aviso = avisoValidade(ficha.data_validade);
  const abertoPorDivisao = new Map((abertos ?? []).map((t: any) => [t.divisao_id, t]));

  return (
    <>
      <header className="px-4 pb-2 pt-5"><Rotulo>{ficha.objetivo} · {ficha.dias_semana}x por semana</Rotulo><Titulo tamanho={26}>{ficha.nome}</Titulo></header>

      <div className="px-4 pt-2">
        <Cartao>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><Rotulo>Início</Rotulo><span className="numero text-sm">{fmtData(ficha.data_inicio)}</span></div>
            <div><Rotulo>Validade</Rotulo><span className="numero text-sm" style={{ color: aviso && aviso.dias <= 15 ? "var(--marca)" : undefined }}>{fmtData(ficha.data_validade)}</span></div>
            <div><Rotulo>Nível</Rotulo><span className="text-sm">{ficha.nivel}</span></div>
          </div>
          {aviso && aviso.dias <= 15 && <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}><AlertTriangle size={14} /> {aviso.texto}</div>}
          {ficha.observacoes && <p className="mt-3 rounded-xl p-3 text-sm" style={{ background: "var(--superficie-2)", color: "var(--dim)" }}>{ficha.observacoes}</p>}
        </Cartao>
      </div>

      <div className="space-y-3 px-4 pt-4">
        {divisoes.map((d: any) => {
          const itens = [...(d.series_planejadas ?? [])].sort((a: any, b: any) => a.ordem - b.ordem);
          const aberto = abertoPorDivisao.get(d.id);
          return (
            <Cartao key={d.id}>
              <div className="flex items-center gap-2"><span className="rounded-lg px-2 py-1 display" style={{ background: "var(--marca-suave)", color: "var(--marca)", fontSize: 15 }}>{d.codigo}</span><Titulo tamanho={17}>{d.nome.replace(/^Treino [A-E] - /, "")}</Titulo></div>
              <ul className="mt-2 space-y-1">
                {itens.slice(0, 4).map((i: any) => <li key={i.id} className="flex justify-between text-xs" style={{ color: "var(--dim)" }}><span>{i.exercicios?.nome}</span><span className="numero">{i.series}x{i.rep_min}-{i.rep_max}</span></li>)}
                {itens.length > 4 && <li className="text-xs" style={{ color: "var(--fraco)" }}>e mais {itens.length - 4} exercícios</li>}
              </ul>
              <div className="mt-3 flex gap-2">
                <Link href={`/treino/${d.id}`} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: aberto ? "var(--ok)" : "var(--marca)" }}>
                  {aberto ? <RotateCcw size={14} /> : <Play size={14} />} {aberto ? "Continuar" : "Iniciar"}
                </Link>
                <Etiqueta>{itens.length} exercícios</Etiqueta>
              </div>
            </Cartao>
          );
        })}
      </div>
    </>
  );
}
