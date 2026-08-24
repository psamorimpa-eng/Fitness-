"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Search, UserPlus } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Cartao, Rotulo, Titulo } from "@/components/ui";

export type ConversaResumo = {
  usuario_id: string;
  nome: string;
  email: string;
  ultima_mensagem: string | null;
  ultima_em: string | null;
  nao_lidas: number;
};

type UsuarioBusca = { id: string; nome: string; email: string };

function hora(data?: string | null) {
  if (!data) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(data));
}

export default function ChatLista({ usuarioId, conversasIniciais }: { usuarioId: string; conversasIniciais: ConversaResumo[] }) {
  const supabase = useMemo(() => criarClienteNavegador(), []);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<UsuarioBusca[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 3) { setResultados([]); return; }
    let cancelado = false;
    const t = window.setTimeout(async () => {
      setBuscando(true);
      const { data } = await supabase.rpc("buscar_usuarios_colaboracao", { p_busca: termo });
      if (!cancelado) {
        setResultados((data ?? []) as UsuarioBusca[]);
        setBuscando(false);
      }
    }, 350);
    return () => { cancelado = true; window.clearTimeout(t); };
  }, [busca, supabase]);

  useEffect(() => {
    const canal = supabase
      .channel(`lista-chat-${usuarioId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, () => window.location.reload())
      .subscribe();
    return () => { void supabase.removeChannel(canal); };
  }, [supabase, usuarioId]);

  return (
    <div className="space-y-3 px-4 pt-3">
      <Cartao>
        <Rotulo>Nova conversa</Rotulo>
        <div className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--superficie-2)", border: "1px solid var(--linha)" }}>
          <Search size={16} style={{ color: "var(--fraco)" }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou e-mail do usuário" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--texto)" }} />
        </div>
        <p className="mt-1 text-[10px]" style={{ color: "var(--fraco)" }}>Digite pelo menos 3 caracteres.</p>
        {buscando && <p className="mt-2 text-xs" style={{ color: "var(--dim)" }}>Buscando…</p>}
        {!!resultados.length && (
          <div className="mt-2 divide-y" style={{ borderColor: "var(--linha)" }}>
            {resultados.map((u) => (
              <Link key={u.id} href={`/chat/${u.id}`} className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--marca-suave)", color: "var(--marca)" }}><UserPlus size={16} /></div>
                <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{u.nome}</div><div className="truncate text-xs" style={{ color: "var(--dim)" }}>{u.email}</div></div>
              </Link>
            ))}
          </div>
        )}
      </Cartao>

      <div>
        <Rotulo>Conversas</Rotulo>
        <div className="mt-2 space-y-2">
          {!conversasIniciais.length && <div className="py-8 text-center"><MessageCircle size={28} className="mx-auto" style={{ color: "var(--fraco)" }} /><Titulo tamanho={16}>Nenhuma conversa ainda</Titulo><p className="mt-1 text-xs" style={{ color: "var(--dim)" }}>Busque um usuário acima para começar.</p></div>}
          {conversasIniciais.map((c) => (
            <Link key={c.usuario_id} href={`/chat/${c.usuario_id}`} className="block rounded-2xl p-3" style={{ background: "var(--superficie)", border: "1px solid var(--linha)" }}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--superficie-2)", color: "var(--marca)" }}><MessageCircle size={17} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><div className="truncate text-sm font-semibold">{c.nome}</div><span className="shrink-0 text-[10px]" style={{ color: "var(--fraco)" }}>{hora(c.ultima_em)}</span></div>
                  <div className="mt-0.5 flex items-center gap-2"><div className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--dim)" }}>{c.ultima_mensagem ?? c.email}</div>{Number(c.nao_lidas) > 0 && <span className="numero flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] text-white" style={{ background: "var(--marca)" }}>{c.nao_lidas}</span>}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
