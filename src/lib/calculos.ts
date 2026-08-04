import type { SerieRealizada, TreinoComSeries } from "@/lib/tipos";
import { semanaDe } from "@/lib/formato";

/** Regra 14: volume é carga multiplicada pelas repetições. */
export const volumeSerie = (s: Pick<SerieRealizada, "carga_kg" | "repeticoes">) =>
  Number(s.carga_kg) * s.repeticoes;

export const volumeTreino = (t: TreinoComSeries) =>
  t.series_realizadas.reduce((total, s) => total + volumeSerie(s), 0);

/** Regra 15: compara o desempenho com o último treino do mesmo exercício. */
export function comparaComAnterior(
  treinos: TreinoComSeries[],
  exercicioId: string,
  cargaAtual: number
) {
  const anteriores = treinos
    .flatMap((t) => t.series_realizadas.filter((s) => s.exercicio_id === exercicioId))
    .map((s) => Number(s.carga_kg));
  if (!anteriores.length) return { referencia: null, delta: 0 };
  const referencia = Math.max(...anteriores);
  return { referencia, delta: cargaAtual - referencia };
}

/** Estimativa de 1RM pela fórmula de Epley, usada nos relatórios de força. */
export const rmEstimado = (carga: number, reps: number) =>
  reps <= 1 ? carga : Math.round(carga * (1 + reps / 30) * 10) / 10;

export function volumePorSemana(treinos: TreinoComSeries[]) {
  const mapa = new Map<string, number>();
  treinos.forEach((t) => {
    const k = semanaDe(t.data);
    mapa.set(k, (mapa.get(k) ?? 0) + volumeTreino(t));
  });
  return [...mapa.entries()].sort().map(([semana, volume]) => ({ semana, volume }));
}

export function frequenciaPorSemana(treinos: TreinoComSeries[]) {
  const mapa = new Map<string, number>();
  treinos.forEach((t) => {
    const k = semanaDe(t.data);
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  });
  return [...mapa.entries()].sort().map(([semana, treinos]) => ({ semana, treinos }));
}

/** Percentual de adesão à ficha considerando a meta semanal do aluno. */
export function adesao(treinos: TreinoComSeries[], metaSemanal: number, semanas = 8) {
  const alvo = metaSemanal * semanas;
  const limite = new Date();
  limite.setDate(limite.getDate() - semanas * 7);
  const feitos = treinos.filter((t) => new Date(t.data) >= limite).length;
  return alvo ? Math.min(100, Math.round((feitos / alvo) * 100)) : 0;
}

/** Sugestão de progressão: subir carga quando o topo da faixa foi atingido em todas as séries. */
export function sugereProgressao(
  series: { repeticoes: number; carga_kg: number }[],
  repMax: number
) {
  if (!series.length) return null;
  const bateuTopo = series.every((s) => s.repeticoes >= repMax);
  if (!bateuTopo) return null;
  const carga = Math.max(...series.map((s) => Number(s.carga_kg)));
  const incremento = carga >= 60 ? 5 : 2.5;
  return { cargaSugerida: carga + incremento, motivo: "Topo da faixa atingido em todas as séries" };
}
