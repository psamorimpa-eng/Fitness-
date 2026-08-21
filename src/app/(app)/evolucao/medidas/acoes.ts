"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";

function numeroOpcional(form: FormData, nome: string) {
  const texto = String(form.get(nome) ?? "").trim().replace(",", ".");
  if (!texto) return null;
  const valor = Number(texto);
  return Number.isFinite(valor) ? valor : Number.NaN;
}

function fora(valor: number | null, minimo: number, maximo: number) {
  return valor !== null && (!Number.isFinite(valor) || valor < minimo || valor > maximo);
}

export async function salvarMedidas(_estado: unknown, form: FormData) {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Sessão expirada. Entre novamente." };

  const data = String(form.get("data") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(`${data}T00:00:00Z`))) {
    return { erro: "Informe uma data válida." };
  }

  const peso_kg = numeroOpcional(form, "peso_kg");
  const gordura_pct = numeroOpcional(form, "gordura_pct");
  const massa_muscular_kg = numeroOpcional(form, "massa_muscular_kg");
  const peitoral_cm = numeroOpcional(form, "peitoral_cm");
  const cintura_cm = numeroOpcional(form, "cintura_cm");
  const abdomen_cm = numeroOpcional(form, "abdomen_cm");
  const quadril_cm = numeroOpcional(form, "quadril_cm");
  const braco_d_cm = numeroOpcional(form, "braco_d_cm");
  const braco_e_cm = numeroOpcional(form, "braco_e_cm");
  const coxa_d_cm = numeroOpcional(form, "coxa_d_cm");
  const coxa_e_cm = numeroOpcional(form, "coxa_e_cm");
  const panturrilha_d_cm = numeroOpcional(form, "panturrilha_d_cm");
  const panturrilha_e_cm = numeroOpcional(form, "panturrilha_e_cm");

  if (fora(peso_kg, 20, 400)) return { erro: "Confira o peso informado." };
  if (fora(gordura_pct, 1, 80)) return { erro: "Confira o percentual de gordura." };
  if (fora(massa_muscular_kg, 5, 250)) return { erro: "Confira a massa muscular informada." };

  const circunferencias = [
    peitoral_cm, cintura_cm, abdomen_cm, quadril_cm, braco_d_cm, braco_e_cm,
    coxa_d_cm, coxa_e_cm, panturrilha_d_cm, panturrilha_e_cm,
  ];
  if (circunferencias.some((valor) => fora(valor, 10, 300))) {
    return { erro: "Confira as medidas em centímetros." };
  }

  const temAlgumaMedida = [peso_kg, gordura_pct, massa_muscular_kg, ...circunferencias]
    .some((valor) => valor !== null);
  if (!temAlgumaMedida) return { erro: "Informe pelo menos uma medida." };

  const supabase = criarClienteServidor();
  const { data: registro, error } = await supabase
    .from("medidas_corporais")
    .upsert({
      aluno_id: usuario.id,
      data,
      peso_kg,
      gordura_pct,
      massa_muscular_kg,
      peitoral_cm,
      cintura_cm,
      abdomen_cm,
      quadril_cm,
      braco_d_cm,
      braco_e_cm,
      coxa_d_cm,
      coxa_e_cm,
      panturrilha_d_cm,
      panturrilha_e_cm,
      registrado_por: usuario.id,
    }, { onConflict: "aluno_id,data" })
    .select("id")
    .single();

  if (error || !registro) return { erro: "Não foi possível salvar as medidas agora." };

  const { data: medidaPesoAtual } = await supabase
    .from("medidas_corporais")
    .select("peso_kg")
    .eq("aluno_id", usuario.id)
    .not("peso_kg", "is", null)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (medidaPesoAtual?.peso_kg != null) {
    await supabase
      .from("perfis_aluno")
      .update({ peso_kg: Number(medidaPesoAtual.peso_kg) })
      .eq("usuario_id", usuario.id);
  }

  await supabase.rpc("registrar_log_atividade", {
    p_entidade: "medidas_corporais",
    p_acao: "medidas_salvas",
    p_entidade_id: registro.id,
    p_dados: { data, peso_kg, gordura_pct, cintura_cm, massa_muscular_kg },
  });

  revalidatePath("/evolucao");
  revalidatePath("/evolucao/medidas");
  revalidatePath("/perfil");
  redirect("/evolucao/medidas?salvo=1");
}
