"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";

export type EstadoExercicio = { erro?: string } | null;

function texto(form: FormData, nome: string) {
  const valor = String(form.get(nome) ?? "").trim();
  return valor || null;
}

function inteiro(form: FormData, nome: string) {
  const valor = Number(form.get(nome));
  return Number.isInteger(valor) && valor > 0 ? valor : null;
}

function urlSegura(valor: string | null) {
  if (!valor) return null;
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:" ? valor : null;
  } catch {
    return null;
  }
}

export async function salvarExercicio(_estado: EstadoExercicio, form: FormData): Promise<EstadoExercicio> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Sua sessão expirou. Entre novamente." };

  const id = texto(form, "id");
  const nome = texto(form, "nome");
  const categoriaId = inteiro(form, "categoria_id");
  const equipamentoId = inteiro(form, "equipamento_id");

  if (!nome || nome.length < 2) return { erro: "Informe o nome do exercício." };
  if (!categoriaId) return { erro: "Escolha o grupo muscular principal." };
  if (!equipamentoId) return { erro: "Escolha o equipamento." };

  const imagemDigitada = texto(form, "imagem_url");
  const videoDigitado = texto(form, "video_url");
  const imagemUrl = urlSegura(imagemDigitada);
  const videoUrl = urlSegura(videoDigitado);
  if (imagemDigitada && !imagemUrl) return { erro: "A URL da imagem precisa começar com http ou https." };
  if (videoDigitado && !videoUrl) return { erro: "A URL do vídeo precisa começar com http ou https." };

  const supabase = criarClienteServidor();

  let duplicado = supabase
    .from("exercicios")
    .select("id, nome")
    .eq("ativo", true)
    .ilike("nome", nome)
    .limit(1);
  if (id) duplicado = duplicado.neq("id", id);
  const { data: iguais } = await duplicado;
  if (iguais?.length) return { erro: `Já existe um exercício chamado “${iguais[0].nome}”.` };

  const dados = {
    nome,
    categoria_id: categoriaId,
    equipamento_id: equipamentoId,
    nivel: texto(form, "nivel") ?? "Intermediário",
    tipo: texto(form, "tipo") ?? "Musculação",
    descricao: texto(form, "descricao"),
    instrucoes: texto(form, "instrucoes"),
    erros_comuns: texto(form, "erros_comuns"),
    imagem_url: imagemUrl,
    video_url: videoUrl,
    observacoes: texto(form, "observacoes"),
    criado_por: usuario.id,
    publico: false,
    ativo: true,
    fonte: null,
    fonte_id: null,
    atualizado_em: new Date().toISOString(),
  };

  let exercicioId = id;
  if (id) {
    const { data, error } = await supabase
      .from("exercicios")
      .update(dados)
      .eq("id", id)
      .eq("criado_por", usuario.id)
      .eq("publico", false)
      .select("id")
      .maybeSingle();
    if (error) return { erro: error.message };
    if (!data) return { erro: "Exercício não encontrado ou sem permissão para editar." };
  } else {
    const { data, error } = await supabase
      .from("exercicios")
      .insert(dados)
      .select("id")
      .single();
    if (error) return { erro: error.message };
    exercicioId = data.id;
  }

  if (!exercicioId) return { erro: "Não foi possível identificar o exercício salvo." };

  const secundarios = [...new Set(
    form.getAll("secundarios")
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v > 0 && v !== categoriaId)
  )];

  const { error: erroDelete } = await supabase
    .from("exercicio_secundarios")
    .delete()
    .eq("exercicio_id", exercicioId);
  if (erroDelete) return { erro: "O exercício foi salvo, mas houve erro ao atualizar músculos secundários." };

  if (secundarios.length) {
    const { error: erroSecundarios } = await supabase.from("exercicio_secundarios").insert(
      secundarios.map((categoria_id) => ({ exercicio_id: exercicioId, categoria_id }))
    );
    if (erroSecundarios) return { erro: "O exercício foi salvo, mas houve erro ao registrar músculos secundários." };
  }

  await supabase.rpc("registrar_log_atividade", {
    p_entidade: "exercicio",
    p_acao: id ? "alteracao_exercicio" : "criacao_exercicio",
    p_entidade_id: exercicioId,
    p_dados: { nome, privado: true },
  });

  revalidatePath("/exercicios");
  revalidatePath("/fichas/nova");
  revalidatePath("/fichas");
  redirect("/exercicios?salvo=1");
}

export async function arquivarExercicio(id: string) {
  const usuario = await usuarioAtual();
  if (!usuario) return;
  const supabase = criarClienteServidor();

  const { data } = await supabase
    .from("exercicios")
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("criado_por", usuario.id)
    .eq("publico", false)
    .select("id, nome")
    .maybeSingle();

  if (data) {
    await supabase.rpc("registrar_log_atividade", {
      p_entidade: "exercicio",
      p_acao: "arquivamento_exercicio",
      p_entidade_id: data.id,
      p_dados: { nome: data.nome },
    });
  }

  revalidatePath("/exercicios");
  revalidatePath("/fichas/nova");
}

export async function reativarExercicio(id: string) {
  const usuario = await usuarioAtual();
  if (!usuario) return;
  const supabase = criarClienteServidor();

  await supabase
    .from("exercicios")
    .update({ ativo: true, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("criado_por", usuario.id)
    .eq("publico", false);

  revalidatePath("/exercicios");
  revalidatePath("/fichas/nova");
}
