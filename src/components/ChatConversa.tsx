"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Loader2, Send } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Titulo } from "@/components/ui";

export type MensagemChat = {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  ficha_id: string | null;
  exercicio_id: string | null;
  texto: string;
  lida_em: string | null;
  criado_em: string;
};

function horario(data: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(data));
}

export default function ChatConversa({
  usuarioId,
  outro,
  mensagensIniciais,
}: {
  usuarioId: string;
  outro: { id: string; nome: string; email: string };
  mensagensIniciais: MensagemChat[];
}) {
  const supabase = useMemo(() => criarClienteNavegador(), []);
  const [mensagens, setMensagens] = useState(mensagensIniciais);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement | null>(null);

  const adicionarSemDuplicar = (nova: MensagemChat) => {
    setMensagens((atuais) => atuais.some((m) => m.id === nova.id) ? atuais : [...atuais, nova].sort((a, b) => a.criado_em.localeCompare(b.criado_em)));
  };

  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens.length]);

  useEffect(() => {
    void supabase.rpc("marcar_conversa_lida", { p_usuario_id: outro.id });
    const canal = supabase
      .channel(`chat-${[usuarioId, outro.id].sort().join("-")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, (payload: any) => {
        const nova = payload.new as MensagemChat;
        const pertence = (nova.remetente_id === usuarioId && nova.destinatario_id === outro.id)
          || (nova.remetente_id === outro.id && nova.destinatario_id === usuarioId);
        if (!pertence) return;
        adicionarSemDuplicar(nova);
        if (nova.destinatario_id === usuarioId) void supabase.rpc("marcar_conversa_lida", { p_usuario_id: outro.id });
      })
      .subscribe();

    return () => { void supabase.removeChannel(canal); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outro.id, supabase, usuarioId]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;
    setEnviando(true);
    setErro(null);
    const { data, error } = await supabase
      .from("mensagens")
      .insert({ remetente_id: usuarioId, destinatario_id: outro.id, texto: mensagem })
      .select("id, remetente_id, destinatario_id, ficha_id, exercicio_id, texto, lida_em, criado_em")
      .single();
    if (error) {
      setErro("Não foi possível enviar. Verifique a internet e tente novamente.");
      setEnviando(false);
      return;
    }
    setTexto("");
    adicionarSemDuplicar(data as MensagemChat);
    setEnviando(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-74px)] flex-col pb-24">
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3" style={{ background: "var(--bg)", borderBottom: "1px solid var(--linha)" }}>
        <Link href="/chat" aria-label="Voltar para conversas"><ArrowLeft size={20} /></Link>
        <div className="min-w-0 flex-1"><Titulo tamanho={17}>{outro.nome}</Titulo><div className="truncate text-xs" style={{ color: "var(--dim)" }}>{outro.email}</div></div>
      </header>

      <div className="flex-1 space-y-2 px-4 py-4">
        {!mensagens.length && <div className="py-10 text-center text-sm" style={{ color: "var(--dim)" }}>Comece a conversa com {outro.nome}.</div>}
        {mensagens.map((m) => {
          const minha = m.remetente_id === usuarioId;
          return (
            <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[84%] rounded-2xl px-3 py-2" style={{ background: minha ? "var(--marca)" : "var(--superficie-2)", color: minha ? "#fff" : "var(--texto)", border: minha ? "none" : "1px solid var(--linha)" }}>
                <div className="whitespace-pre-wrap break-words text-sm">{m.texto}</div>
                {m.ficha_id && !minha && (
                  <Link href={`/fichas/${m.ficha_id}/editar`} className="mt-2 flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold" style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(127,127,127,.25)" }}>
                    <ClipboardList size={13} /> Abrir ficha recebida
                  </Link>
                )}
                <div className="mt-1 text-right text-[9px]" style={{ opacity: 0.7 }}>{horario(m.criado_em)}</div>
              </div>
            </div>
          );
        })}
        <div ref={fim} />
      </div>

      <div className="fixed bottom-[66px] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-3 pb-2" style={{ background: "linear-gradient(transparent,var(--bg) 24%)" }}>
        {erro && <div className="mb-2 rounded-xl px-3 py-2 text-xs" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}>{erro}</div>}
        <form onSubmit={enviar} className="flex items-end gap-2 rounded-2xl p-2" style={{ background: "var(--superficie)", border: "1px solid var(--linha)" }}>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value.slice(0, 2000))} rows={1} placeholder="Escreva uma mensagem" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" style={{ color: "var(--texto)" }} />
          <button type="submit" disabled={enviando || !texto.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40" style={{ background: "var(--marca)" }} aria-label="Enviar mensagem">
            {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
