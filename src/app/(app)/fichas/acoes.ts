"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

export interface ItemFicha {
  exercicio_id: string;
  ordem: number;
  series: number;
  rep_min: number;
  rep_max: number;
  carga_sugerida: number;
  descanso_seg: number;
  cadencia: string;
  tecnica: string;
  rir: number | null;
  series_aquecimento: number;
  observacoes: string;
}

export interface DivisaoFicha {
  codigo: string;
  nome: string;
  ordem: number;
  itens: ItemFicha[];
}

export interface FichaCompleta {
  id?: string | null;
  aluno_id: string;
  nome: string;
  objetivo: string;
  data_inicio: string;
  data_validade: string | null;
  dias_semana: number;
  nivel: string;
  status: "rascunho" | "ativa" | "arquivada";
  observacoes: string;
  divisoes: DivisaoFicha[];
}

/** Salva a ficha inteira em uma transação. Retorna o id ou uma mensagem de erro. */
export async function salvarFicha(ficha: FichaCompleta) {
  if (!ficha.aluno_id) return { erro: "Escolha o aluno antes de salvar." };
  if (!ficha.nome.trim()) return { erro: "A ficha precisa de um nome." };
  if (!ficha.divisoes.length) return { erro: "Crie pelo menos uma divisão de treino." };
  if (ficha.divisoes.every((d) => d.itens.length === 0)) {
    return { erro: "Adicione ao menos um exercício antes de salvar." };
  }

  const supabase = criarClienteServidor();
  const { data, error } = await supabase.rpc("salvar_ficha_completa", { p_ficha: ficha });

  if (error) return { erro: error.message };
  revalidatePath("/fichas");
  revalidatePath("/treino");
  return { id: data as string };
}

/** Copia a ficha para outro aluno, mantendo divisões e parâmetros. */
export async function copiarFicha(fichaId: string, alunoDestino: string) {
  const supabase = criarClienteServidor();
  const { data, error } = await supabase.rpc("duplicar_ficha", {
    p_ficha: fichaId,
    p_aluno: alunoDestino,
  });
  if (error) return { erro: error.message };
  revalidatePath("/fichas");
  redirect(`/fichas/${data}/editar`);
}

export async function arquivarFicha(fichaId: string) {
  const supabase = criarClienteServidor();
  const { error } = await supabase.from("fichas").update({ status: "arquivada" }).eq("id", fichaId);
  if (error) return { erro: error.message };
  revalidatePath("/fichas");
  return { ok: true };
}
