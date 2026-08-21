"use client";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { salvarPerfil } from "../acoes";
import { Rotulo, Titulo } from "@/components/ui";

const campo = { background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" };

function Botao() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="w-full rounded-xl py-4 font-semibold text-white disabled:opacity-50" style={{ background: "var(--marca)" }}>{pending ? "Salvando" : "Salvar alterações"}</button>;
}

export default function EditarPerfil() {
  const [estado, acao] = useFormState(salvarPerfil, null as { erro?: string } | null);
  return (
    <main className="px-4 pt-5">
      <Link href="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: "var(--dim)" }}><ChevronLeft size={16} /> Perfil</Link>
      <Titulo tamanho={25}>Editar perfil</Titulo>
      <p className="mb-5 mt-1 text-sm" style={{ color: "var(--dim)" }}>Atualize seus dados. As alterações ficam salvas na sua conta.</p>
      <form action={acao} className="space-y-3">
        <label className="block"><Rotulo>Nome</Rotulo><input name="nome" required autoComplete="name" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><Rotulo>Altura (cm)</Rotulo><input name="altura_cm" inputMode="decimal" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
          <label className="block"><Rotulo>Peso (kg)</Rotulo><input name="peso_kg" inputMode="decimal" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
        </div>
        <label className="block"><Rotulo>Objetivo</Rotulo><input name="objetivo" placeholder="Ex: Hipertrofia" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
        <label className="block"><Rotulo>Nível</Rotulo><select name="nivel" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}><option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option></select></label>
        <label className="block"><Rotulo>Meta semanal</Rotulo><input name="meta_semanal" type="number" min={1} max={7} defaultValue={3} className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
        <label className="block"><Rotulo>Restrições</Rotulo><textarea name="restricoes" rows={2} className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
        <label className="block"><Rotulo>Lesões</Rotulo><textarea name="lesoes" rows={2} className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo} /></label>
        <Botao />
      </form>
      {estado?.erro && <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}><AlertTriangle size={16} className="mt-0.5 shrink-0" />{estado.erro}</div>}
    </main>
  );
}
