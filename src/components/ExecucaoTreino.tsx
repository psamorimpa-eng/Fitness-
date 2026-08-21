"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X, Bell, Check, Plus, Minus, Play, Pause, Timer, SkipForward, Repeat, Trophy, Save, CloudOff,
  Video, ExternalLink, ImageOff,
} from "lucide-react";
import { Cartao, Rotulo, Titulo, Etiqueta, Barra, Indicador } from "@/components/ui";
import { fmtHora } from "@/lib/formato";
import { sugereProgressao } from "@/lib/calculos";
import {
  iniciarTreinoLocal, registrarSerie, finalizarTreinoLocal, guardarFicha,
} from "@/lib/offline";
import type { SeriePlanejada } from "@/lib/tipos";

type Registro = { exercicio_id: string; numero_serie: number; carga_kg: number; repeticoes: number; pse: number };

export default function ExecucaoTreino({
  alunoId, fichaId, divisao, itens, ultimasCargas,
}: {
  alunoId: string;
  fichaId: string | null;
  divisao: { id: string; codigo: string; nome: string };
  itens: (SeriePlanejada & { exercicios: any })[];
  ultimasCargas: Record<string, { carga: number; reps: number }>;
}) {
  const router = useRouter();
  const localId = useRef(`${alunoId}-${divisao.id}-${Date.now()}`);
  const inicio = useRef(Date.now());

  const [indice, setIndice] = useState(0);
  const [feitas, setFeitas] = useState<Record<string, Registro>>({});
  const [decorrido, setDecorrido] = useState(0);
  const [descanso, setDescanso] = useState<number | null>(null);
  const [pausado, setPausado] = useState(false);
  const [alerta, setAlerta] = useState(true);
  const [observacoes, setObservacoes] = useState("");
  const [pendentes, setPendentes] = useState(0);
  const [fechando, setFechando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const item = itens[indice];
  const exercicio = item?.exercicios;
  const ultima = ultimasCargas[item?.exercicio_id ?? ""];

  const [carga, setCarga] = useState(0);
  const [reps, setReps] = useState(0);
  const [pse, setPse] = useState(8);

  useEffect(() => {
    void iniciarTreinoLocal({
      local_id: localId.current, aluno_id: alunoId, ficha_id: fichaId, divisao_id: divisao.id,
      data: new Date().toISOString().slice(0, 10), inicio_em: new Date().toISOString(),
      fim_em: null, duracao_min: null, observacoes: "",
    });
    void guardarFicha(divisao.id, { divisao, itens });
  }, [alunoId, fichaId, divisao, itens]);

  useEffect(() => {
    setCarga(Number(ultima?.carga ?? item?.carga_sugerida ?? 0));
    setReps(item?.rep_max ?? 10);
  }, [indice, item, ultima]);

  useEffect(() => {
    const t = setInterval(() => setDecorrido(Math.floor((Date.now() - inicio.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (descanso === null || pausado) return;
    if (descanso <= 0) {
      if (alerta) { navigator.vibrate?.([200, 80, 200]); tocarAviso(); }
      setDescanso(null);
      return;
    }
    const t = setTimeout(() => setDescanso((v) => (v ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [descanso, pausado, alerta]);

  const totalSeries = itens.reduce((t, i) => t + i.series, 0);
  const registradas = Object.keys(feitas).length;

  const serieAtual = useMemo(() => {
    for (let s = 1; s <= (item?.series ?? 0); s++) {
      if (!feitas[`${item.exercicio_id}-${s}`]) return s;
    }
    return (item?.series ?? 0) + 1;
  }, [feitas, item]);

  const concluirSerie = async () => {
    const chave = `${item.exercicio_id}-${serieAtual}`;
    const registro: Registro = {
      exercicio_id: item.exercicio_id, numero_serie: serieAtual,
      carga_kg: carga, repeticoes: reps, pse,
    };
    setFeitas((f) => ({ ...f, [chave]: registro }));

    await registrarSerie({
      treino_local_id: localId.current,
      exercicio_id: item.exercicio_id,
      numero_serie: serieAtual,
      carga_kg: carga,
      repeticoes: reps,
      pse,
      aquecimento: serieAtual <= (item.series_aquecimento ?? 0),
      registrada_em: new Date().toISOString(),
    });

    if (item.descanso_seg) { setDescanso(item.descanso_seg); setPausado(false); }
    if (serieAtual >= item.series && indice < itens.length - 1) {
      setTimeout(() => setIndice(indice + 1), 400);
    }
  };

  const finalizar = async () => {
    setSalvando(true);
    const resultado = await finalizarTreinoLocal(localId.current, Math.max(1, Math.round(decorrido / 60)), observacoes);
    setPendentes(resultado.pendentes);
    router.push("/historico");
    router.refresh();
  };

  const seriesDoExercicio = Object.values(feitas).filter((f) => f.exercicio_id === item?.exercicio_id);
  const progressao = sugereProgressao(
    seriesDoExercicio.map((s) => ({ repeticoes: s.repeticoes, carga_kg: s.carga_kg })),
    item?.rep_max ?? 99
  );
  const superaAnterior = ultima && carga > ultima.carga;

  if (!item) return null;

  return (
    <div className="pb-40">
      <header className="sticky top-0 z-30 px-4 pb-3 pt-3" style={{ background: "var(--bg)", borderBottom: "1px solid var(--linha)" }}>
        <div className="flex items-center justify-between">
          <button onClick={() => setFechando(true)} aria-label="Sair do treino"><X size={20} /></button>
          <div className="text-center"><Rotulo>Treino {divisao.codigo}</Rotulo><div className="numero text-sm">{fmtHora(decorrido)}</div></div>
          <button onClick={() => setAlerta(!alerta)} aria-label="Alerta sonoro" style={{ color: alerta ? "var(--marca)" : "var(--fraco)" }}><Bell size={18} /></button>
        </div>
        <div className="mt-3"><Barra valor={(registradas / totalSeries) * 100} /></div>
        <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--fraco)" }}><span>{registradas} de {totalSeries} séries</span><span>{indice + 1}/{itens.length} exercícios</span></div>
      </header>

      <div className="px-4 pt-4">
        <div className="sem-barra flex gap-2 overflow-x-auto pb-2">
          {itens.map((i, n) => {
            const pronto = Array.from({ length: i.series }).every((_, s) => feitas[`${i.exercicio_id}-${s + 1}`]);
            return (
              <button key={i.id} onClick={() => setIndice(n)} className="numero shrink-0 rounded-lg px-3 py-2 text-xs" style={{ background: n === indice ? "var(--marca)" : pronto ? "var(--ok)" : "var(--superficie-2)", color: n === indice || pronto ? "#fff" : "var(--dim)", border: "1px solid var(--linha)" }}>
                {pronto ? <Check size={13} /> : String(n + 1).padStart(2, "0")}
              </button>
            );
          })}
        </div>

        <Cartao className="mt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><Rotulo>{exercicio?.categorias_musculares?.nome} · {exercicio?.equipamentos?.nome}</Rotulo><Titulo tamanho={22}>{exercicio?.nome}</Titulo></div>
            <div className="shrink-0 text-right"><Rotulo>Série</Rotulo><span className="numero text-xl">{Math.min(serieAtual, item.series)}/{item.series}</span></div>
          </div>

          <div className="relative mt-3 h-52 overflow-hidden rounded-2xl" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)" }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: "var(--fraco)" }}><ImageOff size={28} /><span className="text-xs">Imagem não disponível</span></div>
            {exercicio?.imagem_url && <img src={exercicio.imagem_url} alt={`Demonstração de ${exercicio.nome}`} className="relative h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {exercicio?.descricao && <p className="flex-1 text-xs" style={{ color: "var(--dim)" }}>{exercicio.descricao}</p>}
            {exercicio?.video_url && (
              <a href={exercicio.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
                <Video size={14} /> Ver vídeo <ExternalLink size={11} />
              </a>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Etiqueta>{item.rep_min}-{item.rep_max} reps</Etiqueta><Etiqueta>Cadência {item.cadencia}</Etiqueta>
            {item.rir !== null && <Etiqueta>RIR {item.rir}</Etiqueta>}
            {item.tecnica && item.tecnica !== "Nenhuma" && <Etiqueta cor="#F4C20D">{item.tecnica}</Etiqueta>}
            {ultima && <Etiqueta cor="#1D4ED8">Anterior {ultima.carga} kg × {ultima.reps}</Etiqueta>}
          </div>
          {item.observacoes && <p className="mt-3 rounded-xl p-3 text-xs" style={{ background: "var(--superficie-2)", color: "var(--dim)" }}>{item.observacoes}</p>}
        </Cartao>

        <Cartao className="mt-3">
          <div className="grid grid-cols-2 gap-3"><ContadorNumerico rotulo="Carga (kg)" valor={carga} passo={2.5} aoMudar={setCarga} /><ContadorNumerico rotulo="Repetições" valor={reps} passo={1} aoMudar={setReps} /></div>
          <div className="mt-3">
            <div className="flex justify-between"><Rotulo>Percepção de esforço</Rotulo><span className="numero text-xs">{pse}/10</span></div>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => <button key={i} onClick={() => setPse(i + 1)} aria-label={`Esforço ${i + 1}`} className="h-7 flex-1 rounded" style={{ background: i < pse ? (i >= 8 ? "#D62828" : i >= 6 ? "#F4C20D" : "#16A34A") : "var(--superficie-2)", border: "1px solid var(--linha)" }} />)}
            </div>
          </div>

          {superaAnterior && <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: "#F4C20D22", color: "#F4C20D" }}><Trophy size={14} /> Acima da sua melhor carga registrada ({ultima.carga} kg)</div>}
          {progressao && <div className="mt-2 rounded-xl px-3 py-2 text-xs" style={{ background: "var(--superficie-2)", color: "var(--dim)" }}>{progressao.motivo}. Sugestão para o próximo treino: {progressao.cargaSugerida} kg.</div>}

          <button onClick={concluirSerie} disabled={serieAtual > item.series} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold text-white disabled:opacity-40" style={{ background: "var(--marca)" }}>
            {serieAtual > item.series ? "Exercício concluído" : `Concluir série ${serieAtual}`} <Check size={17} />
          </button>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <BotaoSecundario onClick={() => setIndice(Math.min(itens.length - 1, indice + 1))}><SkipForward size={14} /> Pular</BotaoSecundario>
            <BotaoSecundario onClick={() => alert("A troca por exercícios similares será adicionada na próxima etapa do catálogo.")}><Repeat size={14} /> Trocar</BotaoSecundario>
            <BotaoSecundario onClick={() => setDescanso(item.descanso_seg ?? 60)}><Timer size={14} /> Descanso</BotaoSecundario>
          </div>
        </Cartao>

        <Cartao className="mt-3">
          <Rotulo>Séries registradas</Rotulo>
          <div className="mt-2 space-y-1">
            {Array.from({ length: item.series }).map((_, i) => {
              const f = feitas[`${item.exercicio_id}-${i + 1}`];
              return <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: f ? "var(--superficie-2)" : "transparent", border: f ? "1px solid transparent" : "1px solid var(--linha)" }}><span className="display text-sm" style={{ color: "var(--dim)", letterSpacing: "0.08em" }}>Série {i + 1}{i < (item.series_aquecimento ?? 0) ? " · aquecimento" : ""}</span><span className="numero text-xs">{f ? `${f.carga_kg} kg × ${f.repeticoes} · PSE ${f.pse}` : "pendente"}</span></div>;
            })}
          </div>
        </Cartao>

        <Cartao className="mt-3"><Rotulo>Observação do treino</Rotulo><textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} placeholder="Como foi o treino hoje?" className="mt-1 w-full rounded-xl px-3 py-3 text-sm outline-none" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" }} /></Cartao>

        <button onClick={() => setFechando(true)} className="mt-3 w-full rounded-xl py-4 font-semibold text-white" style={{ background: "var(--ok)" }}>Finalizar treino</button>
        <p className="mt-2 text-center text-xs" style={{ color: "var(--fraco)" }}><Save size={11} className="mr-1 inline" />Cada série é gravada no aparelho antes de subir para a nuvem</p>
      </div>

      {descanso !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "var(--bg)", opacity: 0.98 }}>
          <Rotulo>Descanso</Rotulo><div className="numero" style={{ fontSize: 76, color: descanso <= 5 ? "var(--marca)" : "var(--texto)" }}>{fmtHora(descanso)}</div>
          <div className="mt-4 w-full max-w-xs"><Barra valor={100 - (descanso / (item.descanso_seg || 60)) * 100} altura={6} /></div>
          <div className="mt-6 flex gap-2"><BotaoSecundario onClick={() => setDescanso(Math.max(0, descanso - 15))}><Minus size={15} /> 15s</BotaoSecundario><BotaoSecundario onClick={() => setPausado(!pausado)}>{pausado ? <Play size={15} /> : <Pause size={15} />} {pausado ? "Retomar" : "Pausar"}</BotaoSecundario><BotaoSecundario onClick={() => setDescanso(descanso + 15)}><Plus size={15} /> 15s</BotaoSecundario></div>
          <button onClick={() => setDescanso(null)} className="mt-6 w-full max-w-xs rounded-xl py-3 font-semibold text-white" style={{ background: "var(--marca)" }}>Pular descanso</button>
        </div>
      )}

      {fechando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,.55)" }} onClick={() => setFechando(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl p-4" style={{ background: "var(--superficie)" }}>
            <Titulo tamanho={18}>Finalizar treino</Titulo>
            <div className="mt-3 grid grid-cols-3 gap-3"><Indicador rotulo="Duração" valor={Math.round(decorrido / 60)} unidade="min" /><Indicador rotulo="Séries" valor={registradas} /><Indicador rotulo="Volume" valor={Math.round(Object.values(feitas).reduce((t, f) => t + f.carga_kg * f.repeticoes, 0))} unidade="kg" /></div>
            {pendentes > 0 && <p className="mt-3 flex items-center gap-2 text-xs" style={{ color: "var(--alerta)" }}><CloudOff size={14} /> {pendentes} séries aguardando internet. Elas sobem sozinhas assim que a rede voltar.</p>}
            <button onClick={finalizar} disabled={registradas === 0 || salvando} className="mt-4 w-full rounded-xl py-4 font-semibold text-white disabled:opacity-40" style={{ background: "var(--ok)" }}>{salvando ? "Salvando" : "Salvar treino"}</button>
            <button onClick={() => setFechando(false)} className="mt-2 w-full rounded-xl py-3 text-sm" style={{ border: "1px solid var(--linha)" }}>Continuar treinando</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContadorNumerico({ rotulo, valor, passo, aoMudar }: { rotulo: string; valor: number; passo: number; aoMudar: (v: number) => void }) {
  return <div><Rotulo>{rotulo}</Rotulo><div className="mt-1 flex items-center gap-2"><button onClick={() => aoMudar(Math.max(0, valor - passo))} aria-label={`Diminuir ${rotulo}`} className="rounded-lg p-2" style={{ background: "var(--superficie-2)" }}><Minus size={16} /></button><input value={valor} inputMode="decimal" onChange={(e) => aoMudar(Number(e.target.value.replace(",", ".")) || 0)} className="numero w-full rounded-lg py-2 text-center text-xl outline-none" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" }} /><button onClick={() => aoMudar(valor + passo)} aria-label={`Aumentar ${rotulo}`} className="rounded-lg p-2" style={{ background: "var(--superficie-2)" }}><Plus size={16} /></button></div></div>;
}

function BotaoSecundario({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold" style={{ border: "1px solid var(--linha)", color: "var(--texto)" }}>{children}</button>;
}

function tocarAviso() {
  try {
    const Contexto = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Contexto) return;
    const ctx = new Contexto();
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.connect(ganho); ganho.connect(ctx.destination);
    osc.frequency.value = 880;
    ganho.gain.setValueAtTime(0.001, ctx.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.55);
  } catch {
    // Navegadores podem bloquear áudio sem interação prévia.
  }
}
