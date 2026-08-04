import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/tipos";

/** Cliente do Supabase para Server Components, Route Handlers e Server Actions. */
export function criarClienteServidor() {
  const jar = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            // chamada a partir de Server Component: o middleware já renova a sessão
          }
        },
      },
    }
  );
}

/** Usuário autenticado com papel e perfil. Retorna null quando não há sessão. */
export async function usuarioAtual() {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("*, perfis_aluno(*), perfis_personal(*)")
    .eq("id", user.id)
    .single();

  return data;
}
