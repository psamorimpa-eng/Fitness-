import { NextResponse, type NextRequest } from "next/server";

const PUBLICAS = ["/login", "/cadastro", "/recuperar-senha", "/manifest.json", "/sw.js"];

export function middleware(request: NextRequest) {
  const caminho = request.nextUrl.pathname;
  const publica = PUBLICAS.some((p) => caminho.startsWith(p));

  if (publica) {
    return NextResponse.next();
  }

  // A autenticação é validada nas páginas protegidas.
  // Evitamos chamadas externas ao Supabase no middleware para que uma
  // indisponibilidade temporária não bloqueie toda a aplicação com timeout.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons|favicon.ico).*)"],
};
