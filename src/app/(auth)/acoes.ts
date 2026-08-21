"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";

const EMAIL_PADRAO = "aluno@fichafitness.app";
const SENHA_PADRAO = "123456";

export async function entrarPadrao(_estado: unknown) {
  const supabase = criarClienteServidor();

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: EMAIL_PADRAO,
    password: SENHA_PADRAO,
  });

  if (loginError) {
    const { error: cadastroError } = await supabase.auth.signUp({
      email: EMAIL_PADRAO,
      password: SENHA_PADRAO,
      options: {
        data: {
          nome: "Usuário Padrão",
          papel: "aluno",
          objetivo: "Condicionamento físico",
        },
      },
    });

    if (cadastroError) {
      console.error("Falha ao criar acesso padrão:", cadastroError.message);
      return { erro: "Não foi possível preparar o acesso padrão." };
    }

    const { error: novoLoginError } = await supabase.auth.signInWithPassword({
      email: EMAIL_PADRAO,
      password: SENHA_PADRAO,
    });

    if (novoLoginError) {
      console.error("Falha no acesso padrão:", novoLoginError.message);
      return { erro: "A conta padrão existe, mas o acesso ainda não foi liberado no Supabase." };
    }
  }

  revalidatePath("/", "layout");
  redirect("/inicio");
}

export async function entrar(_estado: unknown, form: FormData) {
  const supabase = criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    password: String(form.get("senha") ?? ""),
  });
  if (error) return { erro: "E-mail ou senha não conferem." };
  revalidatePath("/", "layout");
  redirect("/inicio");
}

export async function cadastrar(_estado: unknown, form: FormData) {
  const senha = String(form.get("senha") ?? "");
  if (senha.length < 6) return { erro: "A senha precisa de pelo menos 6 caracteres." };
  if (senha !== String(form.get("senha2") ?? "")) return { erro: "As senhas não são iguais." };
  if (form.get("termos") !== "on") return { erro: "Aceite os termos de uso e a política de privacidade." };

  const supabase = criarClienteServidor();
  const { error } = await supabase.auth.signUp({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    password: senha,
    options: {
      data: {
        nome: form.get("nome"),
        telefone: form.get("telefone"),
        nascimento: form.get("nascimento"),
        sexo: form.get("sexo"),
        altura: form.get("altura"),
        peso: form.get("peso"),
        objetivo: form.get("objetivo"),
        papel: "aluno",
      },
    },
  });
  if (error) return { erro: error.message };
  revalidatePath("/", "layout");
  redirect("/inicio");
}

export async function recuperarSenha(_estado: unknown, form: FormData) {
  const supabase = criarClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(
    String(form.get("email") ?? "").trim().toLowerCase(),
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/nova-senha` }
  );
  return error ? { erro: error.message } : { ok: "Link de redefinição enviado para o e-mail informado." };
}

export async function sair() {
  const supabase = criarClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
