import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import EditorFicha from "@/components/EditorFicha";

export const dynamic = "force-dynamic";

export default async function NovaFicha() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const supabase = criarClienteServidor();
  const [{ data: perfil }, { data: exercicios }, { data: frequentes }] = await Promise.all([
    supabase.from("perfis_aluno")
      .select("objetivo, nivel")
      .eq("usuario_id", usuario.id)
      .maybeSingle(),
    supabase.rpc("catalogo_exercicios_v2"),
    supabase.rpc("exercicios_frequentes", { p_limite: 12 }),
  ]);

  const alunos = [{
    id: usuario.id,
    nome: usuario.nome,
    objetivo: perfil?.objetivo ?? null,
    nivel: perfil?.nivel ?? "Intermediário",
  }];

  return (
    <EditorFicha
      alunos={alunos}
      exercicios={(exercicios ?? []).map((e: any) => ({
        id: e.id,
        nome: e.nome,
        nivel: e.nivel,
        tipo: e.tipo,
        descricao: e.descricao,
        instrucoes: e.instrucoes,
        erros_comuns: e.erros_comuns,
        grupos_secundarios: e.grupos_secundarios ?? [],
        imagem_url: e.imagem_url,
        video_url: e.video_url,
        video_embutido_url: e.video_embutido_url,
        video_embutido_licenca: e.video_embutido_licenca,
        video_embutido_autor: e.video_embutido_autor,
        grupo: e.grupo ?? "Outros",
        equipamento: e.equipamento ?? "Outros",
      }))}
      frequentes={(frequentes ?? []).map((f: any) => f.exercicio_id)}
      alunoInicial={usuario.id}
    />
  );
}
