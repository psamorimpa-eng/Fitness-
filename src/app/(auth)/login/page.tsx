"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Dumbbell, ArrowRight, AlertTriangle } from "lucide-react";
import { entrarPadrao } from "../acoes";
import { FaixaAnilhas } from "@/components/ui";

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold text-white disabled:opacity-50"
      style={{ background: "var(--marca)" }}>
      {pending ? "Entrando" : "Entrar no aplicativo"} <ArrowRight size={16} />
    </button>
  );
}

export default function Login() {
  const [estado, acao] = useFormState(entrarPadrao, null as { erro?: string } | null);

  return (
    <main className="flex min-h-screen flex-col">
      <div className="px-6 pb-8 pt-10"
        style={{ background: "linear-gradient(160deg, #E23A2E 0%, #7A1710 60%, var(--bg) 100%)" }}>
        <div className="flex items-center gap-2 text-white">
          <Dumbbell size={22} />
          <span className="display" style={{ letterSpacing: "0.16em", fontSize: 15 }}>Minha Ficha Fitness</span>
        </div>
        <div className="mb-3 mt-8"><FaixaAnilhas /></div>
        <h1 className="display text-white" style={{ fontSize: 44, lineHeight: 0.95 }}>
          Sua ficha<br />no bolso.
        </h1>
        <p className="mt-2 max-w-xs text-sm" style={{ color: "#FFD9D4" }}>
          Acesso simplificado para testar o aplicativo.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-10 pt-8">
        <div className="cartao p-5">
          <div className="display text-lg">Acesso padrão</div>
          <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>
            Não precisa digitar e mail nem senha. Clique abaixo para entrar.
          </p>

          <form action={acao} className="mt-5">
            <BotaoEntrar />
          </form>

          {estado?.erro && (
            <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm"
              style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {estado.erro}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
