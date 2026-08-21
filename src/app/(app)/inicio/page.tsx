import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Play, ChevronRight, Plus, ShieldCheck, Users } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Rotulo, Titulo, Indicador, Barra, FaixaAnilhas, Vazio } from "@/components/ui";
import { fmtData, semanaDe } from "@/lib/formato";
import type { TreinoComSeries } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  if (usuario.papel === "personal") {
    const [{ data: perfis }, { data: fichas }] = await Promise.all([
      supabase.from("perfis_aluno")
        .select("usuario_id, usuarios!perfis_aluno_usuario_id_fkey(nome)")
        .eq("personal_id", usuario.id),
      supabase.from("fichas").select("id, aluno_id, status, data_validade"),
    ]);

    const alunos = perfis ?? [];
    const ids = new Set(alunos.map((p: any) => p.usuario_id));
    const fichasAlunos = (fichas ?? []).filter((f: any) => ids.has(f.aluno_id));
    const ativas = fichasAlunos.filter((f: any) => f.status === "ativa").length;
    const semFichaAtiva = alunos.filter((p: any) => !fichasAlunos.some((f: any) => f.aluno_id === p.usuario_id && f.status === "ativa")).length;

    return (
      <>
        <div className="px-4 pb-4 pt-5">
          <Rotulo>Painel do Personal</Rotulo>
          <Titulo tamanho={30}>Olá, {usuario.nome.split(" ")[0]}</Titulo>
          <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>Gerencie somente os alunos vinculados ao seu perfil.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 px-4">
          <Indicador rotulo="Alunos" valor={alunos.length} />
          <Indicador rotulo="Fichas ativas" valor={ativas} />
          <Indicador rotulo="Sem ficha" valor={semFichaAtiva} />
        </div>

        <div className="space-y-3 px-4 pt-4">
          <Cartao href="/alunos">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}><Users size={22} /></div>
              <div className="min-w-0 flex-1"><Titulo tamanho={17}>Meus alunos</Titulo><div className="text-xs" style={{ color: "var(--dim)" }}>Objetivos, nível e situação das fichas</div></div>
              <ChevronRight size={18} style={{ color: "var(--fraco)" }} />
            </div>
          </Cartao>

          <Cartao href="/fichas">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--superficie-2)", color: "var(--marca)" }}><ClipboardList size={22} /></div>
              <div className="min-w-0 flex-1"><Titulo tamanho={17}>Fichas dos alunos</Titulo><div className="text-xs" style={{ color: "var(--dim)" }}>{fichasAlunos.length} fichas cadastradas</div></div>
              <ChevronRight size={18} style={{ color: "var(--fraco)" }} />
            </div>
          </Cartao>

          <Link href="/fichas/nova" className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold text-white" style={{ background: "var(--marca)" }}>
            <Plus size={17} /> Criar nova ficha
          </Link>
        </div>
      </>
    );
  }

  if (usuario.papel === "admin") {
    return (
      <>
        <div className="px-4 pb-4 pt-5">
          <Rotulo>Administração</Rotulo>
          <Titulo tamanho={30}>Olá, {usuario.nome.split(" ")[0]}</Titulo>
        </div>
        <div className="px-4">
          <Cartao>
            <div className="flex items-center gap-3">
              <ShieldCheck size={28} style={{ color: "var(--marca)" }} />
              <div><Titulo tamanho={17}>Conta administrativa</Titulo><p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>O painel administrativo será separado das informações pessoais de treino.</p></div>
            </div>
          </Cartao>
        </div>
      </>
    );
  }

  const [{ data: ficha }, { data: treinos }, { data: medidas }] = await Promise.all([
    supabase.from("fichas")
      .select("*, divisoes_treino(*, series_planejadas(id))")
      .eq("aluno_id", usuario.id).eq("status", "ativa").maybeSingle(),
    supabase.from("treinos_realizados")
      .select("id, data, duracao_min, volume_total, divisao_id, divisoes_treino(codigo, nome)")
      .eq("aluno_id", usuario.id).eq("status", "concluido").order("data", { ascending: false }).limit(40),
    supabase.from("medidas_corporais").select("peso_kg, data")
      .eq("aluno_id", usuario.id).order("data", { ascending: false }).limit(2),
  ]);

  const meta = usuario.perfis_aluno?.meta_semanal ?? 3;
  const hoje = new Date().toISOString().slice(0, 10);
  const listaTreinos = (treinos ?? []) as unknown as TreinoComSeries[];
  const daSemana = listaTreinos.filter((t) => semanaDe(t.data) === semanaDe(hoje));
  const ultimo = listaTreinos[0];

  const divisoes = [...(ficha?.divisoes_treino ?? [])].sort((a, b) => a.ordem - b.ordem);
  const indiceAtual = divisoes.findIndex((d) => d.id === ultimo?.divisao_id);
  const proxima = divisoes.length ? divisoes[(indiceAtual + 1) % divisoes.length] : null;

  return (
    <>
      <div className="px-4 pb-4 pt-5">
        <Rotulo>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</Rotulo>
        <Titulo tamanho={30}>Bom treino, {usuario.nome.split(" ")[0]}</Titulo>
      </div>

      <div className="px-4">
        {proxima ? (
          <div className="rounded-2xl p-4" style={{ background: "var(--marca)" }}>
            <div className="mb-3"><FaixaAnilhas /></div>
            <div className="display text-xs" style={{ color: "#FFC9C3", letterSpacing: "0.16em" }}>Treino de hoje</div>
            <div className="display text-white" style={{ fontSize: 26 }}>{proxima.nome}</div>
            <div className="mt-1 text-sm" style={{ color: "#FFD9D4" }}>
              {proxima.series_planejadas?.length ?? 0} exercícios
            </div>
            <Link href={`/treino/${proxima.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold"
              style={{ color: "var(--marca)" }}>
              <Play size={17} /> Iniciar treino
            </Link>
          </div>
        ) : (
          <Cartao>
            <Vazio
              titulo="Nenhuma ficha ativa"
              texto="Crie sua ficha para começar a registrar seus treinos."
              acao={<Link href="/fichas/nova" className="rounded-xl px-4 py-3 font-semibold text-white"
                style={{ background: "var(--marca)" }}>Criar minha ficha</Link>}
            />
          </Cartao>
        )}
      </div>

      <div className="px-4 pt-4">
        <Cartao>
          <div className="mb-2 flex items-center justify-between">
            <Rotulo>Meta da semana</Rotulo>
            <span className="numero text-sm">{daSemana.length}/{meta}</span>
          </div>
          <Barra valor={(daSemana.length / meta) * 100} cor={daSemana.length >= meta ? "var(--ok)" : "var(--marca)"} />
        </Cartao>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 pt-3">
        <Indicador rotulo="Treinos" valor={treinos?.length ?? 0} />
        <Indicador rotulo="Peso" valor={medidas?.[0]?.peso_kg ?? usuario.perfis_aluno?.peso_kg ?? "-"} unidade="kg" />
        <Indicador rotulo="Volume" valor={ultimo ? Math.round(Number(ultimo.volume_total ?? 0) / 1000) : 0} unidade="t" />
      </div>

      {ultimo && (
        <div className="px-4 pt-3">
          <Cartao href={`/historico/${ultimo.id}`}>
            <Rotulo>Último treino</Rotulo>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <Titulo tamanho={17}>{fmtData(ultimo.data)}</Titulo>
                <div className="text-xs" style={{ color: "var(--dim)" }}>
                  Treino {ultimo.divisoes_treino?.codigo} · {ultimo.duracao_min} min
                </div>
              </div>
              <ChevronRight size={18} style={{ color: "var(--fraco)" }} />
            </div>
          </Cartao>
        </div>
      )}
    </>
  );
}
