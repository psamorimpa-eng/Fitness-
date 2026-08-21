import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/inicio";
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/inicio";

  if (code) {
    const supabase = criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destino, url.origin));
  }

  return NextResponse.redirect(new URL("/recuperar-senha?erro=link-invalido", url.origin));
}
