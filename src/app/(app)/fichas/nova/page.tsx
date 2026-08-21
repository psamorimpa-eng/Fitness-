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
    supabase.rpc("catalogo_exercicios"),
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
        imagem_url: e.imagem_url,
        video_url: e.video_url,
        grupo: e.grupo ?? "Outros",
        equipamento: e.equipamento ?? "Outros",
      }))}
      frequentes={(frequentes ?? []).map((f: any) => f.exercicio_id)}
      alunoInicial={usuario.id}
    />
  );
}
