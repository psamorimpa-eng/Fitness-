-- Restringe RPCs de colaboração a usuários autenticados.
-- As funções continuam disponíveis ao papel authenticated conforme definido nas migrations anteriores.

revoke execute on function public.buscar_usuarios_colaboracao(text) from anon;
revoke execute on function public.obter_usuario_colaboracao(uuid) from anon;
revoke execute on function public.listar_conversas() from anon;
revoke execute on function public.marcar_conversa_lida(uuid) from anon;
revoke execute on function public.contar_mensagens_nao_lidas() from anon;
revoke execute on function public.compartilhar_ficha_copia(uuid,text) from anon;
