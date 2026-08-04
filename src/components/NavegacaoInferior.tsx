"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, History, TrendingUp, User, Users, ClipboardList } from "lucide-react";
import type { Papel } from "@/lib/tipos";

const MENUS: Record<Papel, [string, string, typeof Home][]> = {
  aluno: [
    ["/inicio", "Início", Home], ["/treino", "Treino", Dumbbell], ["/historico", "Histórico", History],
    ["/evolucao", "Evolução", TrendingUp], ["/perfil", "Perfil", User],
  ],
  personal: [
    ["/inicio", "Início", Home], ["/alunos", "Alunos", Users], ["/fichas", "Fichas", ClipboardList],
    ["/exercicios", "Exercícios", Dumbbell], ["/perfil", "Perfil", User],
  ],
  admin: [
    ["/inicio", "Início", Home], ["/usuarios", "Usuários", Users], ["/exercicios", "Exercícios", Dumbbell],
    ["/academias", "Unidades", ClipboardList], ["/perfil", "Perfil", User],
  ],
};

export default function NavegacaoInferior({ papel }: { papel: Papel }) {
  const caminho = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto flex max-w-md"
        style={{ background: "var(--superficie)", borderTop: "1px solid var(--linha)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {MENUS[papel].map(([href, rotulo, Icone]) => {
          const ativo = caminho === href || caminho.startsWith(href + "/");
          return (
            <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-1 py-2"
              style={{ color: ativo ? "var(--marca)" : "var(--fraco)" }}>
              <Icone size={20} strokeWidth={ativo ? 2.4 : 1.8} />
              <span className="display" style={{ fontSize: 10, letterSpacing: "0.08em" }}>{rotulo}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
