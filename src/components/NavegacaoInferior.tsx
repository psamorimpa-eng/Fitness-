"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Dumbbell, History, TrendingUp, User, MessageCircle } from "lucide-react";

const ITENS = [
  { href: "/inicio", rotulo: "Início", Icone: Home },
  { href: "/fichas", rotulo: "Fichas", Icone: ClipboardList },
  { href: "/treino", rotulo: "Treino", Icone: Dumbbell },
  { href: "/historico", rotulo: "Histórico", Icone: History },
  { href: "/evolucao", rotulo: "Evolução", Icone: TrendingUp },
  { href: "/chat", rotulo: "Chat", Icone: MessageCircle },
  { href: "/perfil", rotulo: "Perfil", Icone: User },
];

export default function NavegacaoInferior() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-md -translate-x-1/2 grid-cols-7 px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-2"
      style={{ background: "var(--superficie)", borderTop: "1px solid var(--linha)" }}>
      {ITENS.map(({ href, rotulo, Icone }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href}
            className="flex min-w-0 flex-col items-center gap-1 py-1 text-[10px]"
            style={{ color: ativo ? "var(--marca)" : "var(--dim)" }}>
            <Icone size={19} strokeWidth={ativo ? 2.5 : 2} />
            <span className="truncate">{rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
