"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle, Save } from "lucide-react";
import { salvarMedidas } from "@/app/(app)/evolucao/medidas/acoes";
import { Rotulo, Titulo } from "@/components/ui";

const campo = {
  background: "var(--superficie-2)",
  border: "1px solid var(--linha)",
  color: "var(--texto)",
};

export type DadosMedidasFormulario = {
  data: string;
  peso_kg: number | null;
  gordura_pct: number | null;
  massa_muscular_kg: number | null;
  peitoral_cm: number | null;
  cintura_cm: number | null;
  abdomen_cm: number | null;
  quadril_cm: number | null;
  braco_d_cm: number | null;
  braco_e_cm: number | null;
  coxa_d_cm: number | null;
  coxa_e_cm: number | null;
  panturrilha_d_cm: number | null;
  panturrilha_e_cm: number | null;
};

function CampoNumero({ nome, rotulo, valor, unidade = "cm" }: {
  nome: keyof DadosMedidasFormulario;
  rotulo: string;
  valor: number | null;
  unidade?: string;
}) {
  return (
    <label className="block">
      <Rotulo>{rotulo}</Rotulo>
      <div className="relative mt-1">
        <input
          name={nome}
          inputMode="decimal"
          defaultValue={valor ?? ""}
          className="w-full rounded-xl px-3 py-3 pr-10 outline-none"
          style={campo}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--dim)" }}>
          {unidade}
        </span>
      </div>
    </label>
  );
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold text-white disabled:opacity-50"
      style={{ background: "var(--marca)" }}
    >
      <Save size={17} /> {pending ? "Salvando" : "Salvar medidas"}
    </button>
  );
}

export default function FormularioMedidas({ dados }: { dados: DadosMedidasFormulario }) {
  const [estado, acao] = useFormState(salvarMedidas, null as { erro?: string } | null);

  return (
    <form action={acao} className="space-y-5">
      <label className="block">
        <Rotulo>Data da medição</Rotulo>
        <input
          name="data"
          type="date"
          required
          defaultValue={dados.data}
          className="mt-1 w-full rounded-xl px-3 py-3 outline-none"
          style={campo}
        />
      </label>

      <section>
        <Titulo tamanho={16}>Composição corporal</Titulo>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <CampoNumero nome="peso_kg" rotulo="Peso" valor={dados.peso_kg} unidade="kg" />
          <CampoNumero nome="gordura_pct" rotulo="Gordura" valor={dados.gordura_pct} unidade="%" />
          <CampoNumero nome="massa_muscular_kg" rotulo="Massa muscular" valor={dados.massa_muscular_kg} unidade="kg" />
          <CampoNumero nome="cintura_cm" rotulo="Cintura" valor={dados.cintura_cm} />
        </div>
      </section>

      <section>
        <Titulo tamanho={16}>Circunferências</Titulo>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <CampoNumero nome="peitoral_cm" rotulo="Peitoral" valor={dados.peitoral_cm} />
          <CampoNumero nome="abdomen_cm" rotulo="Abdômen" valor={dados.abdomen_cm} />
          <CampoNumero nome="quadril_cm" rotulo="Quadril" valor={dados.quadril_cm} />
          <CampoNumero nome="braco_d_cm" rotulo="Braço direito" valor={dados.braco_d_cm} />
          <CampoNumero nome="braco_e_cm" rotulo="Braço esquerdo" valor={dados.braco_e_cm} />
          <CampoNumero nome="coxa_d_cm" rotulo="Coxa direita" valor={dados.coxa_d_cm} />
          <CampoNumero nome="coxa_e_cm" rotulo="Coxa esquerda" valor={dados.coxa_e_cm} />
          <CampoNumero nome="panturrilha_d_cm" rotulo="Panturrilha D" valor={dados.panturrilha_d_cm} />
          <CampoNumero nome="panturrilha_e_cm" rotulo="Panturrilha E" valor={dados.panturrilha_e_cm} />
        </div>
      </section>

      {estado?.erro && (
        <div className="flex gap-2 rounded-xl px-3 py-3 text-sm" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {estado.erro}
        </div>
      )}

      <BotaoSalvar />
    </form>
  );
}
