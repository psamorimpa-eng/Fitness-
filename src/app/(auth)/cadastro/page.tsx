"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { cadastrar } from "../acoes";
import { Rotulo, Titulo } from "@/components/ui";

const OBJETIVOS = ["Emagrecimento", "Hipertrofia", "Ganho de força", "Condicionamento físico",
  "Reabilitação", "Saúde e qualidade de vida", "Definição muscular", "Melhora de desempenho esportivo"];

const campo = {
  background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)",
};

function Campo({ nome, rotulo, tipo = "text", obrigatorio }: { nome: string; rotulo: string; tipo?: string; obrigatorio?: boolean }) {
  return (
    <label className="block">
      <Rotulo>{rotulo}</Rotulo>
      <input name={nome} type={tipo} required={obrigatorio}
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
  const [estado, acao] = useFormState(cadastrar, null as { erro?: string } | null);

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <Link href="/login" className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: "var(--dim)" }}>
        <ChevronLeft size={16} /> Voltar
      </Link>
      <Titulo tamanho={28}>Criar conta</Titulo>
      <p className="mb-6 mt-1 text-sm" style={{ color: "var(--dim)" }}>
        Leva um minuto. Seu personal vincula a ficha depois.
      </p>

      <form action={acao} className="space-y-3">
        <Campo nome="nome" rotulo="Nome completo" obrigatorio />
        <Campo nome="email" rotulo="E-mail" tipo="email" obrigatorio />
        <div className="grid grid-cols-2 gap-3">
          <Campo nome="telefone" rotulo="Telefone" tipo="tel" />
          <Campo nome="nascimento" rotulo="Nascimento" tipo="date" />
          <label className="block">
            <Rotulo>Sexo</Rotulo>
            <select name="sexo" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}>
              <option>Masculino</option><option>Feminino</option><option>Prefiro não informar</option>
            </select>
          </label>
          <label className="block">
            <Rotulo>Objetivo</Rotulo>
            <select name="objetivo" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={campo}>
              {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <Campo nome="altura" rotulo="Altura (cm)" tipo="number" />
          <Campo nome="peso" rotulo="Peso (kg)" tipo="number" />
          <Campo nome="senha" rotulo="Senha" tipo="password" obrigatorio />
          <Campo nome="senha2" rotulo="Confirmar senha" tipo="password" obrigatorio />
        </div>

        <label className="flex items-start gap-2 py-2 text-sm" style={{ color: "var(--dim)" }}>
          <input type="checkbox" name="termos" className="mt-1" />
          <span>Li e aceito os termos de uso e a política de privacidade, incluindo o tratamento dos meus dados conforme a LGPD.</span>
        </label>

        <Botao />
      </form>

      {estado?.erro && (
        <div className="mt-4 flex gap-2 rounded-xl px-3 py-3 text-sm"
          style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {estado.erro}
        </div>
      )}
    </main>
  );
}
