import { LogOut, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/supabase/server";
import { sair } from "../../(auth)/acoes";
import { Cartao, Rotulo, Titulo, Indicador, Etiqueta, Cabecalho } from "@/components/ui";
import { fmtData, iniciais, diasEntre } from "@/lib/formato";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ATALHOS = [
  ["Medidas corporais", "/medidas"], ["Avaliação física", "/avaliacao"], ["Agenda", "/agenda"],
  ["Mensagens", "/mensagens"], ["Notificações", "/notificacoes"], ["Plano e assinatura", "/planos"],
  ["Configurações", "/configuracoes"],
];

export default async function Perfil() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const perfil = usuario.perfis_aluno;
  const idade = usuario.nascimento
    ? Math.floor(diasEntre(usuario.nascimento, new Date().toISOString().slice(0, 10)) / 365.25)
    : "-";

  return (
    <>
      <Cabecalho titulo="Perfil" />
      <div className="space-y-3 px-4 pt-3">
        <Cartao>
          <div className="flex items-center gap-4">
            <div className="display flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl text-white"
              style={{ background: "var(--marca)" }}>
              {iniciais(usuario.nome)}
            </div>
            <div className="min-w-0">
              <Titulo tamanho={20}>{usuario.nome}</Titulo>
              <div className="truncate text-sm" style={{ color: "var(--dim)" }}>{usuario.email}</div>
              <div className="mt-1"><Etiqueta cor="#1D4ED8">{usuario.papel}</Etiqueta></div>
            </div>
          </div>
        </Cartao>

        {perfil && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Indicador rotulo="Idade" valor={idade} unidade="anos" />
              <Indicador rotulo="Altura" valor={perfil.altura_cm ?? "-"} unidade="cm" />
              <Indicador rotulo="Peso" valor={perfil.peso_kg ?? "-"} unidade="kg" />
            </div>
            <Cartao>
              <Rotulo>Dados do treino</Rotulo>
              <dl className="mt-2 space-y-2 text-sm">
                {[["Objetivo", perfil.objetivo], ["Nível", perfil.nivel],
                  ["Início", fmtData(perfil.data_inicio)], ["Meta semanal", `${perfil.meta_semanal} treinos`],
                  ["Restrições", perfil.restricoes ?? "Nenhuma"], ["Lesões", perfil.lesoes ?? "Nenhuma"]].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-3">
                    <dt style={{ color: "var(--dim)" }}>{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </Cartao>
          </>
        )}

        <div className="cartao overflow-hidden">
          {ATALHOS.map(([rotulo, href], i) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3 text-sm"
              style={{ borderTop: i ? "1px solid var(--linha)" : undefined }}>
              <span className="flex-1">{rotulo}</span>
              <ChevronRight size={16} style={{ color: "var(--fraco)" }} />
            </Link>
          ))}
        </div>

        <form action={sair}>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold"
            style={{ border: "1px solid var(--marca)", color: "var(--marca)" }}>
            <LogOut size={16} /> Sair da conta
          </button>
        </form>
      </div>
    </>
  );
}
