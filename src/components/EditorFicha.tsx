"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Plus, X, Search, ChevronUp, ChevronDown, Copy, Trash2, Check, AlertTriangle, Zap,
} from "lucide-react";
import { Cartao, Rotulo, Titulo, Etiqueta } from "@/components/ui";
import { salvarFicha, type FichaCompleta, type DivisaoFicha, type ItemFicha } from "@/app/(app)/fichas/acoes";

const OBJETIVOS = ["Emagrecimento", "Hipertrofia", "Ganho de força", "Condicionamento físico",
  "Reabilitação", "Saúde e qualidade de vida", "Definição muscular", "Melhora de desempenho esportivo"];
const NIVEIS = ["Iniciante", "Intermediário", "Avançado"];
const TECNICAS = ["Nenhuma", "Bi set", "Tri set", "Drop set", "Rest pause", "Superset", "Falha muscular"];

/**
 * Parâmetros iniciais por objetivo. O personal ainda ajusta o que quiser,
 * mas não precisa digitar séries e descanso em cada exercício adicionado.
 */
const PADRAO: Record<string, { series: number; rep_min: number; rep_max: number; descanso_seg: number; rir: number }> = {
  "Ganho de força":     { series: 4, rep_min: 4,  rep_max: 6,  descanso_seg: 150, rir: 2 },
  "Hipertrofia":        { series: 4, rep_min: 8,  rep_max: 12, descanso_seg: 75,  rir: 2 },
  "Definição muscular": { series: 3, rep_min: 10, rep_max: 15, descanso_seg: 60,  rir: 1 },
  "Emagrecimento":      { series: 3, rep_min: 12, rep_max: 15, descanso_seg: 45,  rir: 1 },
  "Reabilitação":       { series: 3, rep_min: 12, rep_max: 15, descanso_seg: 60,  rir: 3 },
};
const padraoDe = (objetivo: string) =>
  PADRAO[objetivo] ?? { series: 3, rep_min: 10, rep_max: 12, descanso_seg: 60, rir: 2 };

/** Estruturas prontas de divisão, o que o personal monta 90 por cento das vezes. */
const MODELOS: Record<string, { codigo: string; nome: string }[]> = {
  "Full body": [{ codigo: "A", nome: "Treino A - Corpo inteiro" }, { codigo: "B", nome: "Treino B - Corpo inteiro" }],
  "AB": [{ codigo: "A", nome: "Treino A - Superior" }, { codigo: "B", nome: "Treino B - Inferior" }],
  "ABC": [
    { codigo: "A", nome: "Treino A - Peito, ombro e tríceps" },
    { codigo: "B", nome: "Treino B - Costas e bíceps" },
    { codigo: "C", nome: "Treino C - Pernas" },
  ],
  "Push Pull Legs": [
    { codigo: "A", nome: "Push" }, { codigo: "B", nome: "Pull" }, { codigo: "C", nome: "Legs" },
  ],
};

interface Aluno { id: string; nome: string; objetivo: string | null; nivel: string | null }
interface Ex { id: string; nome: string; nivel: string | null; grupo: string; equipamento: string }

const hoje = () => new Date().toISOString().slice(0, 10);
const emMeses = (n: number) => {
  const d = new Date(); d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};

const campo = { background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" };

export default function EditorFicha({
  alunos, exercicios, frequentes, fichaExistente, alunoInicial,
}: {
  alunos: Aluno[];
  exercicios: Ex[];
  frequentes: string[];
  fichaExistente?: FichaCompleta;
  alunoInicial?: string | null;
}) {
  const router = useRouter();
  const [salvando, iniciarSalvamento] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [ficha, setFicha] = useState<FichaCompleta>(() => fichaExistente ?? {
    id: null,
    aluno_id: alunoInicial ?? alunos[0]?.id ?? "",
    nome: "",
    objetivo: alunos.find((a) => a.id === (alunoInicial ?? alunos[0]?.id))?.objetivo ?? "Hipertrofia",
    data_inicio: hoje(),
    data_validade: emMeses(3),
    dias_semana: 3,
    nivel: alunos[0]?.nivel ?? "Intermediário",
    status: "ativa",
    observacoes: "",
    divisoes: [],
  });

  const [aba, setAba] = useState(0);
  const [bancoAberto, setBancoAberto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState("Todos");
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const divisao: DivisaoFicha | undefined = ficha.divisoes[aba];
  const grupos = useMemo(() => ["Todos", ...Array.from(new Set(exercicios.map((e) => e.grupo)))], [exercicios]);
  const porId = useMemo(() => new Map(exercicios.map((e) => [e.id, e])), [exercicios]);

  const listaBanco = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base = exercicios.filter((e) =>
      (grupo === "Todos" || e.grupo === grupo) &&
      (!termo || e.nome.toLowerCase().includes(termo) || e.grupo.toLowerCase().includes(termo))
    );
    if (termo || grupo !== "Todos") return base;
    // sem filtro, os mais usados pelo personal aparecem primeiro
    const ordem = new Map(frequentes.map((id, i) => [id, i]));
    return [...base].sort((a, b) => (ordem.get(a.id) ?? 999) - (ordem.get(b.id) ?? 999));
  }, [exercicios, busca, grupo, frequentes]);

  const atualizar = (mudanca: Partial<FichaCompleta>) => setFicha((f) => ({ ...f, ...mudanca }));

  const trocarDivisoes = (fn: (d: DivisaoFicha[]) => DivisaoFicha[]) =>
    setFicha((f) => ({ ...f, divisoes: fn(f.divisoes).map((d, i) => ({ ...d, ordem: i + 1 })) }));

  const aplicarModelo = (chave: string) => {
    trocarDivisoes(() => MODELOS[chave].map((m, i) => ({ ...m, ordem: i + 1, itens: [] })));
    setAba(0);
  };

  const novaDivisao = () => {
    const letra = String.fromCharCode(65 + ficha.divisoes.length);
    trocarDivisoes((d) => [...d, { codigo: letra, nome: `Treino ${letra}`, ordem: d.length + 1, itens: [] }]);
    setAba(ficha.divisoes.length);
  };

  const duplicarDivisao = () => {
    if (!divisao) return;
    const letra = String.fromCharCode(65 + ficha.divisoes.length);
    trocarDivisoes((d) => [...d, { ...divisao, codigo: letra, nome: `${divisao.nome} (cópia)`, ordem: d.length + 1, itens: divisao.itens.map((i) => ({ ...i })) }]);
    setAba(ficha.divisoes.length);
  };

  const removerDivisao = () => {
    trocarDivisoes((d) => d.filter((_, i) => i !== aba));
    setAba((a) => Math.max(0, a - 1));
  };

  const trocarItens = (fn: (itens: ItemFicha[]) => ItemFicha[]) =>
    trocarDivisoes((d) => d.map((div, i) =>
      i === aba ? { ...div, itens: fn(div.itens).map((it, n) => ({ ...it, ordem: n + 1 })) } : div
    ));

  const adicionarSelecionados = () => {
    const p = padraoDe(ficha.objetivo);
    trocarItens((itens) => [
      ...itens,
      ...selecionados.map((id, n) => ({
        exercicio_id: id, ordem: itens.length + n + 1,
        series: p.series, rep_min: p.rep_min, rep_max: p.rep_max,
        carga_sugerida: 0, descanso_seg: p.descanso_seg,
        cadencia: "2-0-1-0", tecnica: "Nenhuma", rir: p.rir,
        series_aquecimento: 1, observacoes: "",
      })),
    ]);
    setSelecionados([]); setBusca(""); setBancoAberto(false);
  };

  const mover = (indice: number, direcao: -1 | 1) => {
    const destino = indice + direcao;
    trocarItens((itens) => {
      if (destino < 0 || destino >= itens.length) return itens;
      const copia = [...itens];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  };

  const salvar = () => {
    setErro(null);
    iniciarSalvamento(async () => {
      const resultado = await salvarFicha(ficha);
      if ("erro" in resultado && resultado.erro) { setErro(resultado.erro); return; }
      router.push("/fichas");
      router.refresh();
    });
  };

  const totalExercicios = ficha.divisoes.reduce((t, d) => t + d.itens.length, 0);

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--linha)" }}>
        <div className="min-w-0 flex-1">
          <Titulo tamanho={19}>{ficha.id ? "Editar ficha" : "Nova ficha"}</Titulo>
          <div className="text-xs" style={{ color: "var(--dim)" }}>
            {ficha.divisoes.length} divisões · {totalExercicios} exercícios
          </div>
        </div>
        <button onClick={salvar} disabled={salvando}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--marca)" }}>
          <Save size={15} /> {salvando ? "Salvando" : "Salvar"}
        </button>
      </header>

      {erro && (
        <div className="mx-4 mt-3 flex gap-2 rounded-xl px-3 py-3 text-sm"
          style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {erro}
        </div>
      )}

      <div className="space-y-3 px-4 pt-3">
        <Cartao>
          <div className="space-y-3">
            <label className="block">
              <Rotulo>Aluno</Rotulo>
              <select value={ficha.aluno_id}
                onChange={(e) => {
                  const aluno = alunos.find((a) => a.id === e.target.value);
                  atualizar({
                    aluno_id: e.target.value,
                    objetivo: aluno?.objetivo ?? ficha.objetivo,
                    nivel: aluno?.nivel ?? ficha.nivel,
                  });
                }}
                className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}>
                {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </label>

            <label className="block">
              <Rotulo>Nome da ficha</Rotulo>
              <input value={ficha.nome} onChange={(e) => atualizar({ nome: e.target.value })}
                placeholder="Hipertrofia ABC - Ciclo 1"
                className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <Rotulo>Objetivo</Rotulo>
                <select value={ficha.objetivo} onChange={(e) => atualizar({ objetivo: e.target.value })}
                  className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}>
                  {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label className="block">
                <Rotulo>Nível</Rotulo>
                <select value={ficha.nivel} onChange={(e) => atualizar({ nivel: e.target.value })}
                  className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}>
                  {NIVEIS.map((n) => <option key={n}>{n}</option>)}
                </select>
              </label>
              <label className="block">
                <Rotulo>Início</Rotulo>
                <input type="date" value={ficha.data_inicio}
                  onChange={(e) => atualizar({ data_inicio: e.target.value })}
                  className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
              </label>
              <label className="block">
                <Rotulo>Validade</Rotulo>
                <input type="date" value={ficha.data_validade ?? ""}
                  onChange={(e) => atualizar({ data_validade: e.target.value || null })}
                  className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
              </label>
              <label className="block">
                <Rotulo>Dias por semana</Rotulo>
                <input type="number" min={1} max={7} value={ficha.dias_semana}
                  onChange={(e) => atualizar({ dias_semana: Number(e.target.value) })}
                  className="numero mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
              </label>
              <label className="block">
                <Rotulo>Status</Rotulo>
                <select value={ficha.status}
                  onChange={(e) => atualizar({ status: e.target.value as FichaCompleta["status"] })}
                  className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}>
                  <option value="ativa">Ativa</option>
                  <option value="rascunho">Rascunho</option>
                  <option value="arquivada">Arquivada</option>
                </select>
              </label>
            </div>

            {ficha.status === "ativa" && (
              <p className="text-xs" style={{ color: "var(--fraco)" }}>
                Publicar como ativa arquiva automaticamente a ficha ativa anterior deste aluno. O histórico continua intacto.
              </p>
            )}

            <label className="block">
              <Rotulo>Observações gerais</Rotulo>
              <textarea rows={2} value={ficha.observacoes}
                onChange={(e) => atualizar({ observacoes: e.target.value })}
                placeholder="Orientação que o aluno lê antes de treinar"
                className="mt-1 w-full rounded-xl px-3 py-3 text-sm outline-none" style={campo} />
            </label>
          </div>
        </Cartao>

        {ficha.divisoes.length === 0 ? (
          <Cartao>
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: "var(--marca)" }} />
              <Rotulo cor="var(--marca)">Começar rápido</Rotulo>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>
              Escolha uma estrutura e ajuste depois. Os parâmetros já vêm no padrão do objetivo {ficha.objetivo.toLowerCase()}.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.keys(MODELOS).map((m) => (
                <button key={m} onClick={() => aplicarModelo(m)}
                  className="rounded-xl px-3 py-3 text-sm font-semibold"
                  style={{ border: "1px solid var(--linha)" }}>{m}</button>
              ))}
            </div>
            <button onClick={novaDivisao} className="mt-2 w-full rounded-xl py-3 text-sm"
              style={{ border: "1px solid var(--linha)", color: "var(--dim)" }}>
              Prefiro montar do zero
            </button>
          </Cartao>
        ) : (
          <>
            <div className="sem-barra flex gap-2 overflow-x-auto pb-1">
              {ficha.divisoes.map((d, i) => (
                <button key={i} onClick={() => setAba(i)} className="shrink-0">
                  <Etiqueta ativo={i === aba}>{d.codigo} · {d.itens.length}</Etiqueta>
                </button>
              ))}
              <button onClick={novaDivisao} className="shrink-0"><Etiqueta><Plus size={12} /> Divisão</Etiqueta></button>
            </div>

            {divisao && (
              <Cartao>
                <div className="flex items-end gap-2">
                  <label className="block flex-1">
                    <Rotulo>Nome da divisão</Rotulo>
                    <input value={divisao.nome}
                      onChange={(e) => trocarDivisoes((d) => d.map((x, i) => i === aba ? { ...x, nome: e.target.value } : x))}
                      className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
                  </label>
                  <button onClick={duplicarDivisao} aria-label="Duplicar divisão"
                    className="rounded-xl p-3" style={{ border: "1px solid var(--linha)" }}><Copy size={16} /></button>
                  <button onClick={removerDivisao} aria-label="Remover divisão"
                    className="rounded-xl p-3" style={{ border: "1px solid var(--linha)", color: "var(--marca)" }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {divisao.itens.length === 0 && (
                    <p className="text-sm" style={{ color: "var(--dim)" }}>Nenhum exercício nesta divisão ainda.</p>
                  )}
                  {divisao.itens.map((it, i) => {
                    const ex = porId.get(it.exercicio_id);
                    return (
                      <div key={i} className="rounded-xl p-3"
                        style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)" }}>
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col">
                            <button onClick={() => mover(i, -1)} aria-label="Subir exercício"
                              style={{ color: "var(--fraco)" }}><ChevronUp size={16} /></button>
                            <button onClick={() => mover(i, 1)} aria-label="Descer exercício"
                              style={{ color: "var(--fraco)" }}><ChevronDown size={16} /></button>
                          </div>
                          <button className="min-w-0 flex-1 text-left" onClick={() => setEditando(i)}>
                            <Titulo tamanho={15}>{ex?.nome ?? "Exercício"}</Titulo>
                            <div className="numero text-xs" style={{ color: "var(--dim)" }}>
                              {it.series}x{it.rep_min}-{it.rep_max} · {it.descanso_seg}s
                              {it.carga_sugerida ? ` · ${it.carga_sugerida} kg` : ""}
                              {it.tecnica !== "Nenhuma" ? ` · ${it.tecnica}` : ""}
                            </div>
                          </button>
                          <button onClick={() => trocarItens((itens) => itens.filter((_, n) => n !== i))}
                            aria-label="Remover exercício" style={{ color: "var(--fraco)" }}><X size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => setBancoAberto(true)}
                  className="mt-3 w-full rounded-xl py-3 text-sm font-semibold"
                  style={{ border: "1px solid var(--linha)" }}>
                  <Plus size={15} className="mr-1 inline" /> Adicionar exercícios
                </button>
              </Cartao>
            )}
          </>
        )}
      </div>

      {/* -------------------------------------------------- banco de exercícios */}
      {bancoAberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,.55)" }}
          onClick={() => setBancoAberto(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col rounded-t-3xl"
            style={{ background: "var(--superficie)", maxHeight: "88vh" }}>
            <div className="sticky top-0 px-4 pb-3 pt-4" style={{ background: "var(--superficie)", borderBottom: "1px solid var(--linha)" }}>
              <div className="flex items-center justify-between">
                <Titulo tamanho={18}>Banco de exercícios</Titulo>
                <button onClick={() => setBancoAberto(false)}><X size={20} /></button>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)" }}>
                <Search size={16} style={{ color: "var(--fraco)" }} />
                <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome ou grupo muscular"
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--texto)" }} />
              </div>
              <div className="sem-barra mt-2 flex gap-2 overflow-x-auto pb-1">
                {grupos.map((g) => (
                  <button key={g} onClick={() => setGrupo(g)} className="shrink-0">
                    <Etiqueta ativo={grupo === g}>{g}</Etiqueta>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {!busca && grupo === "Todos" && frequentes.length > 0 && (
                <Rotulo>Os que você mais usa aparecem primeiro</Rotulo>
              )}
              {listaBanco.map((e) => {
                const marcado = selecionados.includes(e.id);
                return (
                  <button key={e.id} onClick={() => setSelecionados((s) =>
                    marcado ? s.filter((x) => x !== e.id) : [...s, e.id])}
                    className="w-full rounded-xl p-3 text-left"
                    style={{ border: `1px solid ${marcado ? "var(--marca)" : "var(--linha)"}`, background: marcado ? "var(--marca-suave)" : "transparent" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Titulo tamanho={15}>{e.nome}</Titulo>
                        <div className="text-xs" style={{ color: "var(--dim)" }}>{e.grupo} · {e.equipamento} · {e.nivel}</div>
                      </div>
                      {marcado ? <Check size={18} style={{ color: "var(--marca)" }} /> : <Plus size={16} style={{ color: "var(--fraco)" }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-0 p-4" style={{ background: "var(--superficie)", borderTop: "1px solid var(--linha)" }}>
              <button onClick={adicionarSelecionados} disabled={!selecionados.length}
                className="w-full rounded-xl py-3 font-semibold text-white disabled:opacity-40"
                style={{ background: "var(--marca)" }}>
                Adicionar {selecionados.length || ""} {selecionados.length === 1 ? "exercício" : "exercícios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ parâmetros do exercício */}
      {editando !== null && divisao?.itens[editando] && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,.55)" }}
          onClick={() => setEditando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-y-auto rounded-t-3xl p-4"
            style={{ background: "var(--superficie)", maxHeight: "88vh" }}>
            <div className="mb-3 flex items-center justify-between">
              <Titulo tamanho={18}>{porId.get(divisao.itens[editando].exercicio_id)?.nome}</Titulo>
              <button onClick={() => setEditando(null)}><X size={20} /></button>
            </div>

            {(() => {
              const it = divisao.itens[editando];
              const set = (chave: keyof ItemFicha, valor: unknown) =>
                trocarItens((itens) => itens.map((x, n) => n === editando ? { ...x, [chave]: valor } : x));
              const numero = (rotulo: string, chave: keyof ItemFicha) => (
                <label className="block">
                  <Rotulo>{rotulo}</Rotulo>
                  <input type="number" value={String(it[chave] ?? "")}
                    onChange={(e) => set(chave, Number(e.target.value))}
                    className="numero mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
                </label>
              );
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {numero("Séries", "series")}
                    {numero("Descanso (s)", "descanso_seg")}
                    {numero("Reps mínimas", "rep_min")}
                    {numero("Reps máximas", "rep_max")}
                    {numero("Carga sugerida (kg)", "carga_sugerida")}
                    {numero("Reps em reserva", "rir")}
                    {numero("Séries de aquecimento", "series_aquecimento")}
                    <label className="block">
                      <Rotulo>Cadência</Rotulo>
                      <input value={it.cadencia} onChange={(e) => set("cadencia", e.target.value)}
                        className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
                    </label>
                  </div>
                  <label className="block">
                    <Rotulo>Técnica de intensidade</Rotulo>
                    <select value={it.tecnica} onChange={(e) => set("tecnica", e.target.value)}
                      className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}>
                      {TECNICAS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <Rotulo>Observação para o aluno</Rotulo>
                    <input value={it.observacoes} onChange={(e) => set("observacoes", e.target.value)}
                      placeholder="Ex: última série até a falha"
                      className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
                  </label>
                  <button onClick={() => setEditando(null)}
                    className="w-full rounded-xl py-3 font-semibold text-white" style={{ background: "var(--marca)" }}>
                    Aplicar
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
