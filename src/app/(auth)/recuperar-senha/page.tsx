"use client";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2, ChevronLeft } from "lucide-react";
import { recuperarSenha } from "../acoes";
import { Rotulo, Titulo } from "@/components/ui";

const campo = { background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" };

function Botao() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="w-full rounded-xl py-4 font-semibold text-white disabled:opacity-50" style={{ background: "var(--marca)" }}>{pending ? "Enviando" : "Enviar link"}</button>;
}

export default function RecuperarSenha() {
  const [estado, acao] = useFormState(recuperarSenha, null as { erro?: string; ok?: string } | null);
  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <Link href="/login" className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: "var(--dim)" }}><ChevronLeft size={16} /> Voltar</Link>
      <Titulo tamanho={28}>Recuperar senha</Titulo>
      <p className="mb-6 mt-1 text-sm" style={{ color: "var(--dim)" }}>Informe o e mail da sua conta. Enviaremos um link para criar uma nova senha.</p>
      <form action={acao} className="space-y-4">
        <label className="block"><Rotulo>E mail</Rotulo><input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
        <Botao />
      </form>
      {estado?.erro && <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}><AlertTriangle size={16} className="mt-0.5 shrink-0" />{estado.erro}</div>}
      {estado?.ok && <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm" style={{ background: "rgba(22,163,74,.12)", color: "var(--ok)" }}><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{estado.ok}</div>}
    </main>
  );
}
