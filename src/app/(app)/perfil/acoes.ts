"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";

export async function salvarPerfil(_estado: unknown, form: FormData) {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Sessão expirada. Entre novamente." };

  const nome = String(form.get("nome") ?? "").trim();
  const objetivo = String(form.get("objetivo") ?? "").trim();
  const nivel = String(form.get("nivel") ?? "").trim();
  const altura = Number(String(form.get("altura_cm") ?? "").replace(",", "."));
  const peso = Number(String(form.get("peso_kg") ?? "").replace(",", "."));
  const meta = Number(form.get("meta_semanal") ?? 3);
  const restricoes = String(form.get("restricoes") ?? "").trim();
  const lesoes = String(form.get("lesoes") ?? "").trim();

  if (nome.length < 2) return { erro: "Informe seu nome." };
  if (altura && (altura < 80 || altura > 260)) return { erro: "Confira a altura informada." };
  if (peso && (peso < 20 || peso > 400)) return { erro: "Confira o peso informado." };
  if (!Number.isFinite(meta) || meta < 1 || meta > 7) return { erro: "A meta semanal deve ficar entre 1 e 7 treinos." };

  const supabase = criarClienteServidor();
  const { error: erroUsuario } = await supabase.from("usuarios").update({ nome }).eq("id", usuario.id);
  if (erroUsuario) return { erro: "Não foi possível salvar seu nome." };

  const { error: erroPerfil } = await supabase.from("perfis_aluno").update({
    objetivo: objetivo || null,
    nivel: nivel || null,
    altura_cm: altura || null,
    peso_kg: peso || null,
    meta_semanal: meta,
    restricoes: restricoes || null,
    lesoes: lesoes || null,
  }).eq("usuario_id", usuario.id);
  if (erroPerfil) return { erro: "Não foi possível salvar os dados do perfil." };

  await supabase.rpc("registrar_log_atividade", {
    p_entidade: "perfil",
    p_acao: "cadastro_alterado",
    p_entidade_id: usuario.id,
    p_dados: { objetivo: objetivo || null, nivel: nivel || null, meta_semanal: meta },
  });

  revalidatePath("/perfil");
  redirect("/perfil");
}
