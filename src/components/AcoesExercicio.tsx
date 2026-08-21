"use client";

import { Archive, RotateCcw } from "lucide-react";
import { arquivarExercicio, reativarExercicio } from "@/app/(app)/exercicios/acoes";

export default function AcoesExercicio({ id, ativo }: { id: string; ativo: boolean }) {
  const acao = ativo ? arquivarExercicio.bind(null, id) : reativarExercicio.bind(null, id);
  return (
    <form action={acao}>
      <button
        type="submit"
        onClick={(e) => {
          if (ativo && !window.confirm("Tem certeza de que deseja arquivar este exercício? Ele não será apagado definitivamente.")) {
            e.preventDefault();
          }
        }}
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm"
        style={{ border: "1px solid var(--linha)", color: ativo ? "var(--marca)" : "var(--ok)" }}
      >
        {ativo ? <Archive size={14} /> : <RotateCcw size={14} />}
        {ativo ? "Arquivar" : "Reativar"}
      </button>
    </form>
  );
}
