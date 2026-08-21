"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Dumbbell, ArrowRight, AlertTriangle } from "lucide-react";
import { entrar } from "../acoes";
import { FaixaAnilhas, Rotulo } from "@/components/ui";

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
      <div className="px-6 pb-8 pt-10" style={{ background: "linear-gradient(160deg, #E23A2E 0%, #7A1710 60%, var(--bg) 100%)" }}>
        <div className="flex items-center gap-2 text-white"><Dumbbell size={22} /><span className="display" style={{ letterSpacing: "0.16em", fontSize: 15 }}>Minha Ficha Fitness</span></div>
        <div className="mb-3 mt-8"><FaixaAnilhas /></div>
        <h1 className="display text-white" style={{ fontSize: 44, lineHeight: 0.95 }}>Sua ficha<br />no bolso.</h1>
        <p className="mt-2 max-w-xs text-sm" style={{ color: "#FFD9D4" }}>Crie sua conta, monte sua ficha e acompanhe seus treinos.</p>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-10 pt-6">
        <form action={acao} className="space-y-3">
          <label className="block"><Rotulo>E mail</Rotulo><input name="email" type="email" autoComplete="email" required placeholder="voce@email.com" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" }} /></label>
          <label className="block"><Rotulo>Senha</Rotulo><input name="senha" type="password" autoComplete="current-password" required className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" }} /></label>
          <div className="text-right"><Link href="/recuperar-senha" className="text-xs font-semibold" style={{ color: "var(--marca)" }}>Esqueci minha senha</Link></div>
          <BotaoEntrar />
        </form>

        {estado?.erro && <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {estado.erro}</div>}

        <div className="mt-6 text-center text-sm" style={{ color: "var(--dim)" }}>
          Ainda não tem conta?{" "}<Link href="/cadastro" className="font-semibold" style={{ color: "var(--marca)" }}>Criar conta</Link>
        </div>
      </div>
    </main>
  );
}
