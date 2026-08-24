"use client";

import { useState, useTransition } from "react";
import { Check, Send, Share2, X } from "lucide-react";
import { compartilharFicha } from "@/app/(app)/fichas/acoes-colaboracao";
import { Rotulo, Titulo } from "@/components/ui";

export default function CompartilharFicha({ fichaId, fichaNome }: { fichaId: string; fichaNome: string }) {
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, iniciar] = useTransition();

  const enviar = () => {
    setErro(null);
    setSucesso(false);
    iniciar(async () => {
      const resultado = await compartilharFicha(fichaId, email);
      if ("erro" in resultado && resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      setSucesso(true);
      setEmail("");
    });
  };

  return (
    <>
      <button type="button" onClick={() => { setAberto(true); setErro(null); setSucesso(false); }} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}>
        <Share2 size={14} /> Compartilhar
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ background: "rgba(0,0,0,.65)" }} onClick={() => setAberto(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-4" style={{ background: "var(--superficie)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div><Rotulo>Compartilhar ficha</Rotulo><Titulo tamanho={18}>{fichaNome}</Titulo></div>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar"><X size={20} /></button>
            </div>
            <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>O outro usuário receberá uma cópia independente como rascunho. Sua ficha original não será alterada.</p>

            <label className="mt-4 block">
              <Rotulo>E-mail do usuário</Rotulo>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amigo@email.com" autoComplete="email" className="mt-1 w-full rounded-xl px-3 py-3 outline-none" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)", color: "var(--texto)" }} />
            </label>

            {erro && <div className="mt-3 rounded-xl px-3 py-2 text-sm" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>{erro}</div>}
            {sucesso && <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(22,163,74,.12)", color: "var(--ok)" }}><Check size={15} /> Cópia enviada. Ela aparecerá nas fichas do destinatário.</div>}

            <button type="button" onClick={enviar} disabled={enviando || !email.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white disabled:opacity-40" style={{ background: "var(--marca)" }}>
              <Send size={15} /> {enviando ? "Compartilhando…" : "Compartilhar ficha"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
