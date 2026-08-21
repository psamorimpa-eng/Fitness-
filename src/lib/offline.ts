"use client";
import Dexie, { type Table } from "dexie";
import { criarClienteNavegador } from "@/lib/supabase/client";

/**
 * Fila offline do treino.
 * Cada alteração é gravada primeiro no aparelho e depois sincronizada com o Supabase.
 * A chave lógica (treino_local_id, exercicio_id, numero_serie) torna o envio idempotente.
 */
export interface SerieLocal {
  id?: number;
  treino_local_id: string;
  exercicio_id: string;
  numero_serie: number;
  carga_kg: number;
  repeticoes: number;
  pse: number | null;
  aquecimento: boolean;
  registrada_em: string;
  exercicio_nome_snapshot?: string | null;
  ordem_exercicio?: number | null;
  series_planejadas?: number | null;
  rep_min_planejada?: number | null;
  rep_max_planejada?: number | null;
  carga_planejada?: number | null;
  descanso_planejado?: number | null;
  observacoes?: string | null;
  status_serie?: "pendente" | "concluida" | "pulada";
  enviada: 0 | 1;
}

export interface TreinoLocal {
  local_id: string;
  aluno_id: string;
  ficha_id: string | null;
  divisao_id: string | null;
  data: string;
  inicio_em: string;
  fim_em: string | null;
  duracao_min: number | null;
  observacoes: string;
  ficha_nome_snapshot?: string | null;
  divisao_codigo_snapshot?: string | null;
  divisao_nome_snapshot?: string | null;
  plano_snapshot?: unknown[];
  finalizado: 0 | 1;
  enviado: 0 | 1;
}

class BancoLocal extends Dexie {
  treinos!: Table<TreinoLocal, string>;
  series!: Table<SerieLocal, number>;
  fichas!: Table<{ id: string; conteudo: unknown; salvo_em: string }, string>;

  constructor() {
    super("minha-ficha-fitness");
    this.version(1).stores({
      treinos: "local_id, enviado, finalizado",
      series: "++id, treino_local_id, enviada, [treino_local_id+exercicio_id+numero_serie]",
      fichas: "id",
    });
    this.version(2).stores({
      treinos: "local_id, enviado, finalizado, aluno_id, divisao_id",
      series: "++id, treino_local_id, enviada, [treino_local_id+exercicio_id+numero_serie]",
      fichas: "id",
    });
  }
}

export const bancoLocal = typeof window !== "undefined" ? new BancoLocal() : (null as unknown as BancoLocal);

export async function guardarFicha(id: string, conteudo: unknown) {
  await bancoLocal.fichas.put({ id, conteudo, salvo_em: new Date().toISOString() });
}

export async function lerFichaLocal(id: string) {
  return (await bancoLocal.fichas.get(id))?.conteudo ?? null;
}

/** Retorna o treino não finalizado mais recente daquela divisão no aparelho. */
export async function carregarTreinoLocalEmAndamento(alunoId: string, divisaoId: string) {
  const candidatos = (await bancoLocal.treinos.where("finalizado").equals(0).toArray())
    .filter((t) => t.aluno_id === alunoId && t.divisao_id === divisaoId)
    .sort((a, b) => b.inicio_em.localeCompare(a.inicio_em));
  const treino = candidatos[0];
  if (!treino) return null;
  const series = await bancoLocal.series.where("treino_local_id").equals(treino.local_id).toArray();
  return { treino, series };
}

/** Salva/atualiza a mesma série local sem criar duplicatas. */
export async function registrarSerie(serie: Omit<SerieLocal, "id" | "enviada">) {
  const chave: [string, string, number] = [serie.treino_local_id, serie.exercicio_id, serie.numero_serie];
  const existente = await bancoLocal.series
    .where("[treino_local_id+exercicio_id+numero_serie]").equals(chave).first();

  if (existente?.id !== undefined) {
    await bancoLocal.series.put({ ...serie, id: existente.id, enviada: 0 });
  } else {
    await bancoLocal.series.add({ ...serie, enviada: 0 });
  }
  await bancoLocal.treinos.update(serie.treino_local_id, { enviado: 0 });
  void sincronizar();
}

/** Cria a sessão local e tenta persistir imediatamente no servidor como em andamento. */
export async function iniciarTreinoLocal(t: Omit<TreinoLocal, "finalizado" | "enviado">) {
  const atual = await bancoLocal.treinos.get(t.local_id);
  await bancoLocal.treinos.put({
    ...t,
    finalizado: atual?.finalizado ?? 0,
    enviado: 0,
  });
  void sincronizar();
}

export async function finalizarTreinoLocal(local_id: string, duracao_min: number, observacoes: string) {
  await bancoLocal.treinos.update(local_id, {
    finalizado: 1,
    enviado: 0,
    duracao_min,
    observacoes,
    fim_em: new Date().toISOString(),
  });
  return sincronizar();
}

/** Envia treinos em andamento e concluídos, além das séries pendentes. */
export async function sincronizar(): Promise<{ enviados: number; pendentes: number; erro?: string }> {
  const pendentesAntes = await bancoLocal.series.where("enviada").equals(0).count();
  const treinosPendentesAntes = await bancoLocal.treinos.where("enviado").equals(0).count();
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { enviados: 0, pendentes: pendentesAntes + treinosPendentesAntes };
  }

  const supabase = criarClienteNavegador();
  const seriesPendentes = await bancoLocal.series.where("enviada").equals(0).toArray();
  const ids = new Set((await bancoLocal.treinos.where("enviado").equals(0).primaryKeys()) as string[]);
  seriesPendentes.forEach((s) => ids.add(s.treino_local_id));

  let enviados = 0;
  let ultimoErro: string | undefined;

  for (const localId of ids) {
    const t = await bancoLocal.treinos.get(localId);
    if (!t) continue;

    const { data: treino, error } = await supabase
      .from("treinos_realizados")
      .upsert({
        aluno_id: t.aluno_id,
        ficha_id: t.ficha_id,
        divisao_id: t.divisao_id,
        data: t.data,
        inicio_em: t.inicio_em,
        fim_em: t.fim_em,
        duracao_min: t.duracao_min,
        observacoes: t.observacoes,
        status: t.finalizado ? "concluido" : "em_andamento",
        local_id: t.local_id,
        ficha_nome_snapshot: t.ficha_nome_snapshot ?? undefined,
        divisao_codigo_snapshot: t.divisao_codigo_snapshot ?? undefined,
        divisao_nome_snapshot: t.divisao_nome_snapshot ?? undefined,
        plano_snapshot: t.plano_snapshot ?? undefined,
      }, { onConflict: "local_id" })
      .select("id")
      .single();

    if (error || !treino) {
      ultimoErro = error?.message ?? "Não foi possível salvar o treino";
      continue;
    }

    const series = await bancoLocal.series
      .where("treino_local_id").equals(t.local_id)
      .and((s) => s.enviada === 0).toArray();

    if (series.length) {
      const { error: erroSeries } = await supabase.from("series_realizadas").upsert(
        series.map((s) => ({
          treino_id: treino.id,
          exercicio_id: s.exercicio_id,
          numero_serie: s.numero_serie,
          carga_kg: s.carga_kg,
          repeticoes: s.repeticoes,
          pse: s.pse,
          aquecimento: s.aquecimento,
          registrada_em: s.registrada_em,
          exercicio_nome_snapshot: s.exercicio_nome_snapshot ?? undefined,
          ordem_exercicio: s.ordem_exercicio ?? undefined,
          series_planejadas: s.series_planejadas ?? undefined,
          rep_min_planejada: s.rep_min_planejada ?? undefined,
          rep_max_planejada: s.rep_max_planejada ?? undefined,
          carga_planejada: s.carga_planejada ?? undefined,
          descanso_planejado: s.descanso_planejado ?? undefined,
          observacoes: s.observacoes ?? undefined,
          status_serie: s.status_serie ?? "concluida",
        })),
        { onConflict: "treino_id,exercicio_id,numero_serie" }
      );
      if (erroSeries) {
        ultimoErro = erroSeries.message;
        continue;
      }
      await bancoLocal.series.bulkPut(series.map((s) => ({ ...s, enviada: 1 })));
    }

    await bancoLocal.treinos.update(t.local_id, { enviado: 1 });
    enviados += 1;
  }

  const pendSeries = await bancoLocal.series.where("enviada").equals(0).count();
  const pendTreinos = await bancoLocal.treinos.where("enviado").equals(0).count();
  return { enviados, pendentes: pendSeries + pendTreinos, erro: ultimoErro };
}

export function ligarSincronizacaoAutomatica() {
  if (typeof window === "undefined") return () => {};
  const tempo = setInterval(() => void sincronizar(), 15_000);
  const aoVoltar = () => void sincronizar();
  window.addEventListener("online", aoVoltar);
  return () => {
    clearInterval(tempo);
    window.removeEventListener("online", aoVoltar);
  };
}
