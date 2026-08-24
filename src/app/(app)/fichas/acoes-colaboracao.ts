"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { FichaCompleta } from "./acoes";

function temExercicio(ficha: FichaCompleta) {
  return ficha.divisoes.some((d) => d.itens.length > 0);
}

/**
 * Auto save seguro: ficha nova é persistida como rascunho. Em ficha existente,
 * o status que já está salvo no banco é preservado. A ativação continua sendo
 * responsabilidade do botão Salvar já existente.
 */
export async function salvarFichaAutomatica(ficha: FichaCompleta) {
  if (!ficha.divisoes.length || !temExercicio(ficha)) return { ignorado: true as const };

  const supabase = criarClienteServidor();
  let statusPersistido: FichaCompleta["status"] = "rascunho";

  if (ficha.id) {
    const { data: atual, error: erroAtual } = await supabase
      .from("fichas")
      .select("status")
      .eq("id", ficha.id)
      .maybeSingle();
    if (erroAtual) return { erro: erroAtual.message };
    if (atual?.status === "ativa" || atual?.status === "arquivada" || atual?.status === "rascunho") {
      statusPersistido = atual.status;
    }
  }

  const payload: FichaCompleta = {
    ...ficha,
    nome: ficha.nome.trim() || "Ficha em edição",
    status: statusPersistido,
  };
  const { data, error } = await supabase.rpc("salvar_ficha_completa", { p_ficha: payload });
  if (error) return { erro: error.message };

  return {
    id: data as string,
    status: statusPersistido,
    salvo_em: new Date().toISOString(),
  };
}

export async function compartilharFicha(fichaId: string, destinatarioEmail: string) {
  const email = destinatarioEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) return { erro: "Informe o e-mail do usuário." };

  const supabase = criarClienteServidor();
  const { data, error } = await supabase.rpc("compartilhar_ficha_copia", {
    p_ficha_id: fichaId,
    p_destinatario_email: email,
  });

  if (error) {
    const mensagem = error.message.includes("Usuario nao encontrado")
      ? "Não encontrei uma conta ativa com esse e-mail."
      : error.message.includes("Escolha outro usuario")
        ? "Escolha outro usuário para compartilhar."
        : "Não foi possível compartilhar a ficha.";
    return { erro: mensagem };
  }

  revalidatePath("/fichas");
  revalidatePath("/chat");
  return { ok: true as const, fichaId: data as string };
}
