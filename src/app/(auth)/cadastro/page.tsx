"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronLeft } from "lucide-react";
import { cadastrar } from "../acoes";
import { Rotulo, Titulo } from "@/components/ui";

const campo = {
  background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)",
};

function Campo({ nome, rotulo, tipo = "text", autoComplete }: { nome: string; rotulo: string; tipo?: string; autoComplete?: string }) {
  return (
    <label className="block">
      <Rotulo>{rotulo}</Rotulo>
      <input name={nome} type={tipo} required autoComplete={autoComplete}
        className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} />
    </label>
  );
}

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="w-full rounded-xl py-4 font-semibold text-white disabled:opacity-50"
      style={{ background: "var(--marca)" }}>
      {pending ? "Criando conta" : "Criar conta"}
    </button>
  );
}

export default function Cadastro() {
  const [estado, acao] = useFormState(cadastrar, null as { erro?: string; ok?: string } | null);

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <Link href="/login" className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: "var(--dim)" }}>
        <ChevronLeft size={16} /> Voltar
      </Link>
      <Titulo tamanho={28}>Criar conta</Titulo>
      <p className="mb-6 mt-1 text-sm" style={{ color: "var(--dim)" }}>
        Crie sua conta para montar fichas, registrar treinos e acompanhar sua evolução.
      </p>

      <form action={acao} className="space-y-3">
        <Campo nome="nome" rotulo="Nome" autoComplete="name" />
        <Campo nome="email" rotulo="E mail" tipo="email" autoComplete="email" />
        <Campo nome="senha" rotulo="Senha" tipo="password" autoComplete="new-password" />
        <Campo nome="senha2" rotulo="Confirmar senha" tipo="password" autoComplete="new-password" />

        <label className="flex items-start gap-2 py-2 text-sm" style={{ color: "var(--dim)" }}>
          <input type="checkbox" name="termos" className="mt-1" />
          <span>Li e aceito os termos de uso e a política de privacidade.</span>
        </label>

        <Botao />
      </form>

      {estado?.erro && (
        <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm"
          style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {estado.erro}
        </div>
      )}

      {estado?.ok && (
        <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm"
          style={{ background: "rgba(22,163,74,.12)", color: "var(--ok)" }}>
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <div>
            {estado.ok}
            <div className="mt-2">
              <Link href="/login" className="font-semibold underline">Voltar para o login</Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
