"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Dumbbell, ArrowRight, AlertTriangle } from "lucide-react";
import { entrar } from "../acoes";
import { FaixaAnilhas, Rotulo } from "@/components/ui";

const DEMO = [
  { rotulo: "Aluno", email: "aluno@fichafitness.app", cor: "#D62828" },
  { rotulo: "Personal", email: "marina@fichafitness.app", cor: "#1D4ED8" },
  { rotulo: "Admin", email: "admin@fichafitness.app", cor: "#F4C20D" },
];

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold text-white disabled:opacity-50"
      style={{ background: "var(--marca)" }}>
      {pending ? "Entrando" : "Entrar"} <ArrowRight size={16} />
    </button>
  );
}

export default function Login() {
  const [estado, acao] = useFormState(entrar, null as { erro?: string } | null);

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
          Ficha, carga, descanso e evolução no mesmo lugar. Do personal para o aluno, sem papel.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-10 pt-6">
        <form action={acao} className="space-y-3">
          <label className="block">
            <Rotulo>E-mail</Rotulo>
            <input name="email" type="email" required defaultValue="aluno@fichafitness.app"
              className="mt-1 w-full rounded-xl px-3 py-3 outline-none"
              style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" }} />
          </label>
          <label className="block">
            <Rotulo>Senha</Rotulo>
            <input name="senha" type="password" required defaultValue="123456"
              className="mt-1 w-full rounded-xl px-3 py-3 outline-none"
              style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" }} />
          </label>
          <BotaoEntrar />
        </form>

        {estado?.erro && (
          <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm"
            style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {estado.erro}
          </div>
        )}

        <div className="mt-4 flex justify-between text-sm" style={{ color: "var(--dim)" }}>
          <Link href="/recuperar-senha">Esqueci minha senha</Link>
          <Link href="/cadastro" className="font-semibold" style={{ color: "var(--marca)" }}>Criar conta</Link>
        </div>

        <div className="mt-8">
          <Rotulo>Contas de demonstração</Rotulo>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DEMO.map((d) => (
              <button key={d.email} type="button"
                onClick={() => {
                  const campo = document.querySelector<HTMLInputElement>('input[name="email"]');
                  if (campo) campo.value = d.email;
                }}
                className="cartao py-3">
                <span className="mx-auto mb-2 block h-1 w-7 rounded" style={{ background: d.cor }} />
                <span className="display text-sm">{d.rotulo}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: "var(--fraco)" }}>Senha 123456 em todas elas</p>
        </div>
      </div>
    </main>
  );
}
