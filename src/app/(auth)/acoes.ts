"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function entrar(_estado: unknown, form: FormData) {
  const supabase = criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    password: String(form.get("senha") ?? ""),
  });

  if (error) return { erro: "E mail ou senha não conferem." };

  revalidatePath("/", "layout");
  redirect("/inicio");
}

export async function cadastrar(_estado: unknown, form: FormData) {
  const nome = String(form.get("nome") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const senha2 = String(form.get("senha2") ?? "");

  if (!nome) return { erro: "Informe seu nome." };
  if (!email) return { erro: "Informe seu e mail." };
  if (senha.length < 6) return { erro: "A senha precisa de pelo menos 6 caracteres." };
  if (senha !== senha2) return { erro: "As senhas não são iguais." };
  if (form.get("termos") !== "on") return { erro: "Aceite os termos de uso e a política de privacidade." };

  const supabase = criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        papel: "aluno",
      },
    },
  });

  if (error) return { erro: error.message };

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/inicio");
  }

  return { ok: "Conta criada. Confira seu e mail para confirmar o cadastro e depois faça o login." };
}

export async function recuperarSenha(_estado: unknown, form: FormData) {
  const supabase = criarClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(
    String(form.get("email") ?? "").trim().toLowerCase(),
    { redirectTo: "https://fitness-rust-ten.vercel.app/nova-senha" }
  );
  return error ? { erro: error.message } : { ok: "Link de redefinição enviado para o e mail informado." };
}

export async function sair() {
  const supabase = criarClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
