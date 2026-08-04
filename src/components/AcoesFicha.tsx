"use client";
import { useState, useTransition } from "react";
import { Copy, Archive, X } from "lucide-react";
import { copiarFicha, arquivarFicha } from "@/app/(app)/fichas/acoes";
import { Titulo, Cartao } from "@/components/ui";

/** Copiar para outro aluno e arquivar, as duas ações que o personal mais repete. */
export default function AcoesFicha({
  fichaId, status, alunos,
}: {
  fichaId: string;
  status: string;
  alunos: { id: string; nome: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [processando, iniciar] = useTransition();

  return (
    <>
      <button onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm"
        style={{ border: "1px solid var(--linha)" }}>
        <Copy size={13} /> Copiar
      </button>

      {status === "ativa" && (
        <button onClick={() => iniciar(() => { void arquivarFicha(fichaId); })} disabled={processando}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
          style={{ border: "1px solid var(--linha)" }}>
          <Archive size={13} /> Arquivar
        </button>
      )}

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,.55)" }}
          onClick={() => setAberto(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-y-auto rounded-t-3xl p-4"
            style={{ background: "var(--superficie)", maxHeight: "80vh" }}>
            <div className="mb-3 flex items-center justify-between">
              <Titulo tamanho={18}>Copiar ficha para</Titulo>
              <button onClick={() => setAberto(false)}><X size={20} /></button>
            </div>
            <div className="space-y-2">
              {alunos.map((a) => (
                <button key={a.id} className="w-full text-left" disabled={processando}
                  onClick={() => iniciar(() => { void copiarFicha(fichaId, a.id); })}>
                  <Cartao><Titulo tamanho={15}>{a.nome}</Titulo></Cartao>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs" style={{ color: "var(--fraco)" }}>
              A cópia entra como rascunho e abre no editor para você ajustar antes de publicar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
