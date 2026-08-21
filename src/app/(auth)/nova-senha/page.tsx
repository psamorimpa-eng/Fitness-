"use client";
import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { redefinirSenha } from "../acoes";
import { Rotulo, Titulo } from "@/components/ui";

const campo = { background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" };

function Botao() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="w-full rounded-xl py-4 font-semibold text-white disabled:opacity-50" style={{ background: "var(--marca)" }}>{pending ? "Salvando" : "Salvar nova senha"}</button>;
}

export default function NovaSenha() {
  const [estado, acao] = useFormState(redefinirSenha, null as { erro?: string } | null);
  return (
    <main className="mx-auto w-full max-w-md px-5 py-8">
      <Titulo tamanho={28}>Criar nova senha</Titulo>
      <p className="mb-6 mt-1 text-sm" style={{ color: "var(--dim)" }}>Escolha uma nova senha com pelo menos 6 caracteres.</p>
      <form action={acao} className="space-y-4">
        <label className="block"><Rotulo>Nova senha</Rotulo><input name="senha" type="password" required minLength={6} autoComplete="new-password" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
        <label className="block"><Rotulo>Confirmar nova senha</Rotulo><input name="senha2" type="password" required minLength={6} autoComplete="new-password" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
        <Botao />
      </form>
      {estado?.erro && <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}><AlertTriangle size={16} className="mt-0.5 shrink-0" />{estado.erro}</div>}
    </main>
  );
}
