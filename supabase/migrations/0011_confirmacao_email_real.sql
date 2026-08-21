create or replace function public.fn_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios(
    id,nome,email,telefone,nascimento,sexo,papel,aceite_termos_em,aceite_privacidade_em
  )
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'telefone',
    (new.raw_user_meta_data->>'nascimento')::date,
    new.raw_user_meta_data->>'sexo',
    'aluno'::public.papel_usuario,
    now(),
    now()
  )
  on conflict(id) do nothing;

  insert into public.perfis_aluno(usuario_id,altura_cm,peso_kg,objetivo)
  values(
    new.id,
    (new.raw_user_meta_data->>'altura')::numeric,
    (new.raw_user_meta_data->>'peso')::numeric,
    new.raw_user_meta_data->>'objetivo'
  )
  on conflict(usuario_id) do nothing;

  insert into public.preferencias_notificacao(usuario_id)
  values(new.id)
  on conflict(usuario_id) do nothing;

  insert into public.logs_atividade(usuario_id,entidade,entidade_id,acao,dados_depois)
  values(
    new.id,
    'usuarios',
    new.id,
    'conta_criada',
    jsonb_build_object('email',new.email)
  );

  -- A confirmação do e-mail é responsabilidade exclusiva do Supabase Auth.
  -- Não preencher email_confirmed_at aqui: o usuário deve comprovar acesso ao e-mail.
  return new;
end;
$$;

revoke all on function public.fn_novo_usuario() from public, anon, authenticated;
