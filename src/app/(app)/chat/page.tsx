import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cabecalho } from "@/components/ui";
import ChatLista, { type ConversaResumo } from "@/components/ChatLista";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();
  const { data, error } = await supabase.rpc("listar_conversas");

  if (error) console.error("Falha ao carregar conversas:", error.message);

  return (
    <>
      <Cabecalho titulo="Chat" sub="Converse com outros usuários" direita={<MessageCircle size={18} style={{ color: "var(--marca)" }} />} />
      <ChatLista usuarioId={usuario.id} conversasIniciais={(data ?? []) as ConversaResumo[]} />
    </>
  );
}
