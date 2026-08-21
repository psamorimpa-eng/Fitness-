"use client";
import { useTransition } from "react";
import { Archive } from "lucide-react";
import { arquivarFicha } from "@/app/(app)/fichas/acoes";

export default function AcoesFicha({ fichaId, status }: { fichaId: string; status: string }) {
  const [processando, iniciar] = useTransition();

  if (status !== "ativa") return null;

  return (
    <button
      onClick={() => iniciar(() => { void arquivarFicha(fichaId); })}
      disabled={processando}
      className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
      style={{ border: "1px solid var(--linha)" }}>
      <Archive size={13} /> {processando ? "Arquivando" : "Arquivar"}
    </button>
  );
}
