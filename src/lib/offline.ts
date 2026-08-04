"use client";
import Dexie, { type Table } from "dexie";
import { criarClienteNavegador } from "@/lib/supabase/client";

/**
 * Fila offline do treino.
 * Cada série concluída é gravada no aparelho antes de qualquer chamada de rede.
 * A chave (treino_local_id, exercicio_id, numero_serie) torna o envio idempotente,
 * então reenviar a fila nunca duplica registro.
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
  }
}

export const bancoLocal = typeof window !== "undefined" ? new BancoLocal() : (null as unknown as BancoLocal);

/** Guarda a ficha para abrir o treino sem internet. */
export async function guardarFicha(id: string, conteudo: unknown) {
  await bancoLocal.fichas.put({ id, conteudo, salvo_em: new Date().toISOString() });
}

export async function lerFichaLocal(id: string) {
  return (await bancoLocal.fichas.get(id))?.conteudo ?? null;
}

export async function registrarSerie(serie: Omit<SerieLocal, "id" | "enviada">) {
  await bancoLocal.series.put({ ...serie, enviada: 0 });
  void sincronizar();
}

export async function iniciarTreinoLocal(t: Omit<TreinoLocal, "finalizado" | "enviado">) {
  await bancoLocal.treinos.put({ ...t, finalizado: 0, enviado: 0 });
}

export async function finalizarTreinoLocal(local_id: string, duracao_min: number, observacoes: string) {
  await bancoLocal.treinos.update(local_id, {
    finalizado: 1, duracao_min, observacoes, fim_em: new Date().toISOString(),
  });
  return sincronizar();
}

/** Envia a fila pendente. Seguro para chamar quantas vezes for preciso. */
export async function sincronizar(): Promise<{ enviados: number; pendentes: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const pendentes = await bancoLocal.series.where("enviada").equals(0).count();
    return { enviados: 0, pendentes };
  }

  const supabase = criarClienteNavegador();
  const treinos = await bancoLocal.treinos.where("finalizado").equals(1).toArray();
  let enviados = 0;

  for (const t of treinos.filter((x) => !x.enviado)) {
    const { data: treino, error } = await supabase
      .from("treinos_realizados")
      .upsert({
        aluno_id: t.aluno_id, ficha_id: t.ficha_id, divisao_id: t.divisao_id,
        data: t.data, inicio_em: t.inicio_em, fim_em: t.fim_em,
        duracao_min: t.duracao_min, observacoes: t.observacoes,
        status: "concluido", local_id: t.local_id,
      }, { onConflict: "local_id" })
      .select("id")
      .single();

    if (error || !treino) continue;

    const series = await bancoLocal.series
      .where("treino_local_id").equals(t.local_id)
      .and((s) => s.enviada === 0).toArray();

    if (series.length) {
      const { error: erroSeries } = await supabase.from("series_realizadas").upsert(
        series.map((s) => ({
          treino_id: treino.id, exercicio_id: s.exercicio_id, numero_serie: s.numero_serie,
          carga_kg: s.carga_kg, repeticoes: s.repeticoes, pse: s.pse,
          aquecimento: s.aquecimento, registrada_em: s.registrada_em,
        })),
        { onConflict: "treino_id,exercicio_id,numero_serie" }
      );
      if (erroSeries) continue;
      await bancoLocal.series.bulkPut(series.map((s) => ({ ...s, enviada: 1 })));
    }

    await bancoLocal.treinos.update(t.local_id, { enviado: 1 });
    enviados += 1;
  }

  const pendentes = await bancoLocal.series.where("enviada").equals(0).count();
  return { enviados, pendentes };
}

/** Liga a sincronização automática: a cada 30 segundos e quando a rede volta. */
export function ligarSincronizacaoAutomatica() {
  if (typeof window === "undefined") return () => {};
  const tempo = setInterval(() => void sincronizar(), 30_000);
  const aoVoltar = () => void sincronizar();
  window.addEventListener("online", aoVoltar);
  return () => { clearInterval(tempo); window.removeEventListener("online", aoVoltar); };
}
