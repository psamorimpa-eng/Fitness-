"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";

const URL_APP = "https://minha-ficha-fitness.vercel.app";

async function registrarAcesso(supabase: ReturnType<typeof criarClienteServidor>, usuarioId: string) {
  await supabase.from("usuarios")
    .update({ ultimo_acesso_em: new Date().toISOString() })
    .eq("id", usuarioId);
  await supabase.rpc("registrar_log_atividade", {
    p_entidade: "autenticacao",
    p_acao: "login",
    p_entidade_id: usuarioId,
    p_dados: null,
  });
}

export async function entrar(_estado: unknown, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return { erro: "Informe seu e mail e sua senha." };

  const supabase = criarClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return { erro: "Seu cadastro ainda está aguardando confirmação. Verifique seu e mail e tente novamente." };
    }
    return { erro: "E mail ou senha não conferem." };
  }

  await registrarAcesso(supabase, data.user.id);
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
      data: { nome, papel: "aluno" },
      emailRedirectTo: `${URL_APP}/auth/callback?next=/inicio`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) return { erro: "Já existe uma conta com este e mail. Faça o login ou recupere sua senha." };
    return { erro: "Não foi possível criar a conta. Tente novamente." };
  }

  let usuario = data.user;
  if (!data.session) {
    const { data: login, error: erroLogin } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (erroLogin || !login.user) {
      return { ok: "Conta criada. Verifique seu e mail para confirmar o cadastro e depois entre com sua senha." };
    }
    usuario = login.user;
  }

  if (usuario) await registrarAcesso(supabase, usuario.id);
  revalidatePath("/", "layout");
  redirect("/inicio");
}

export async function recuperarSenha(_estado: unknown, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) return { erro: "Informe seu e mail." };

  const supabase = criarClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${URL_APP}/auth/callback?next=/nova-senha`,
  });

  if (error) return { erro: "Não foi possível enviar o link agora. Tente novamente em alguns minutos." };
  return { ok: "Se houver uma conta com esse e mail, você receberá um link para criar uma nova senha." };
}

export async function redefinirSenha(_estado: unknown, form: FormData) {
  const senha = String(form.get("senha") ?? "");
  const senha2 = String(form.get("senha2") ?? "");
  if (senha.length < 6) return { erro: "A nova senha precisa de pelo menos 6 caracteres." };
  if (senha !== senha2) return { erro: "As senhas não são iguais." };

  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "O link expirou ou não é mais válido. Solicite uma nova recuperação de senha." };

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: "Não foi possível atualizar a senha. Solicite um novo link e tente novamente." };

  await supabase.rpc("registrar_log_atividade", {
    p_entidade: "autenticacao",
    p_acao: "senha_redefinida",
    p_entidade_id: user.id,
    p_dados: null,
  });
  revalidatePath("/", "layout");
  redirect("/inicio");
}

export async function sair() {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.rpc("registrar_log_atividade", {
      p_entidade: "autenticacao",
      p_acao: "logout",
      p_entidade_id: user.id,
      p_dados: null,
    });
  }
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
