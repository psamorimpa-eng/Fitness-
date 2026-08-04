import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import EditorFicha from "@/components/EditorFicha";
import { Vazio } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NovaFicha({ searchParams }: { searchParams: { aluno?: string } }) {
  const usuario = (await usuarioAtual())!;
  if (usuario.papel === "aluno") redirect("/treino");

  const supabase = criarClienteServidor();

  const [{ data: alunos }, { data: exercicios }, { data: frequentes }] = await Promise.all([
    supabase.from("perfis_aluno")
      .select("usuario_id, objetivo, nivel, usuarios!perfis_aluno_usuario_id_fkey(nome)")
      .eq("personal_id", usuario.id),
    supabase.from("exercicios")
      .select("id, nome, nivel, categorias_musculares(nome), equipamentos(nome)")
      .eq("ativo", true).order("nome"),
    supabase.rpc("exercicios_frequentes", { p_limite: 12 }),
  ]);

  if (!alunos?.length) {
    return <Vazio titulo="Nenhum aluno vinculado" texto="Cadastre um aluno antes de montar a primeira ficha." />;
  }

  return (
    <EditorFicha
      alunos={(alunos ?? []).map((a: any) => ({
        id: a.usuario_id, nome: a.usuarios?.nome ?? "Sem nome",
        objetivo: a.objetivo, nivel: a.nivel,
      }))}
      exercicios={(exercicios ?? []).map((e: any) => ({
        id: e.id, nome: e.nome, nivel: e.nivel,
        grupo: e.categorias_musculares?.nome ?? "Outros",
        equipamento: e.equipamentos?.nome ?? "Outros",
      }))}
      frequentes={(frequentes ?? []).map((f: any) => f.exercicio_id)}
      alunoInicial={searchParams.aluno ?? null}
    />
  );
}
