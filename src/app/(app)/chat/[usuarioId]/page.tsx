import { notFound, redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import ChatConversa, { type MensagemChat } from "@/components/ChatConversa";

export const dynamic = "force-dynamic";

export default async function ConversaPage({ params }: { params: { usuarioId: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  if (params.usuarioId === usuario.id) redirect("/chat");

  const supabase = criarClienteServidor();
  const { data: outros, error: erroUsuario } = await supabase.rpc("obter_usuario_colaboracao", { p_usuario_id: params.usuarioId });
  const outro = Array.isArray(outros) ? outros[0] : null;
  if (erroUsuario) console.error("Falha ao localizar usuário do chat:", erroUsuario.message);
  if (!outro) notFound();

  await supabase.rpc("marcar_conversa_lida", { p_usuario_id: params.usuarioId });
  const { data: mensagens, error: erroMensagens } = await supabase
    .from("mensagens")
    .select("id, remetente_id, destinatario_id, ficha_id, exercicio_id, texto, lida_em, criado_em")
    .or(`and(remetente_id.eq.${usuario.id},destinatario_id.eq.${params.usuarioId}),and(remetente_id.eq.${params.usuarioId},destinatario_id.eq.${usuario.id})`)
    .order("criado_em", { ascending: true })
    .limit(500);

  if (erroMensagens) console.error("Falha ao carregar mensagens:", erroMensagens.message);

  return (
    <ChatConversa
      usuarioId={usuario.id}
      outro={outro as { id: string; nome: string; email: string }}
      mensagensIniciais={(mensagens ?? []) as MensagemChat[]}
    />
  );
}
