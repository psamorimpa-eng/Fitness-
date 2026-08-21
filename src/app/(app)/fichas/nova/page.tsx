import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import EditorFicha from "@/components/EditorFicha";
import { Cabecalho, Vazio } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NovaFicha({ searchParams }: { searchParams?: { aluno?: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const supabase = criarClienteServidor();
  const [{ data: exercicios }, { data: frequentes }] = await Promise.all([
    supabase.rpc("catalogo_exercicios_v2"),
    supabase.rpc("exercicios_frequentes", { p_limite: 12 }),
  ]);

  let alunos: Array<{ id: string; nome: string; objetivo: string | null; nivel: string | null }> = [];

  if (usuario.papel === "personal") {
    const { data: vinculados } = await supabase
      .from("perfis_aluno")
      .select("usuario_id, objetivo, nivel, usuarios!perfis_aluno_usuario_id_fkey(nome)")
      .eq("personal_id", usuario.id)
      .order("usuario_id");

    alunos = (vinculados ?? []).map((p: any) => ({
      id: p.usuario_id,
      nome: p.usuarios?.nome ?? "Aluno",
      objetivo: p.objetivo ?? null,
      nivel: p.nivel ?? "Intermediário",
    }));
  } else {
    const { data: perfil } = await supabase.from("perfis_aluno")
      .select("objetivo, nivel")
      .eq("usuario_id", usuario.id)
      .maybeSingle();

    alunos = [{
      id: usuario.id,
      nome: usuario.nome,
      objetivo: perfil?.objetivo ?? null,
      nivel: perfil?.nivel ?? "Intermediário",
    }];
  }

  if (!alunos.length) {
    return (
      <>
        <Cabecalho titulo="Nova ficha" />
        <Vazio
          titulo="Nenhum aluno disponível"
          texto="Vincule um aluno ao seu perfil de Personal antes de montar uma ficha para ele."
          acao={<Link href="/alunos" className="rounded-xl px-4 py-3 font-semibold text-white" style={{ background: "var(--marca)" }}>Ver meus alunos</Link>}
        />
      </>
    );
  }

  const solicitado = searchParams?.aluno;
  const alunoInicial = solicitado && alunos.some((a) => a.id === solicitado) ? solicitado : alunos[0].id;

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
        grupo: e.grupo ?? "Outros",
        equipamento: e.equipamento ?? "Outros",
      }))}
      frequentes={(frequentes ?? []).map((f: any) => f.exercicio_id)}
      alunoInicial={alunoInicial}
    />
  );
}
