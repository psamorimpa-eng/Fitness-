import { notFound, redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import EditorFicha from "@/components/EditorFicha";

export const dynamic = "force-dynamic";

export default async function EditarFicha({ params }: { params: { fichaId: string } }) {
  const usuario = (await usuarioAtual())!;
  if (usuario.papel === "aluno") redirect("/treino");

  const supabase = criarClienteServidor();

  const [{ data: ficha }, { data: alunos }, { data: exercicios }, { data: frequentes }] = await Promise.all([
    supabase.from("fichas")
      .select("*, divisoes_treino(*, series_planejadas(*))")
      .eq("id", params.fichaId).maybeSingle(),
    supabase.from("perfis_aluno")
      .select("usuario_id, objetivo, nivel, usuarios!perfis_aluno_usuario_id_fkey(nome)")
      .eq("personal_id", usuario.id),
    supabase.from("exercicios")
      .select("id, nome, nivel, categorias_musculares(nome), equipamentos(nome)")
      .eq("ativo", true).order("nome"),
    supabase.rpc("exercicios_frequentes", { p_limite: 12 }),
  ]);

  if (!ficha) notFound();

  const divisoes = [...(ficha.divisoes_treino ?? [])]
    .sort((a: any, b: any) => a.ordem - b.ordem)
    .map((d: any) => ({
      codigo: d.codigo,
      nome: d.nome,
      ordem: d.ordem,
      itens: [...(d.series_planejadas ?? [])]
        .sort((a: any, b: any) => a.ordem - b.ordem)
        .map((s: any) => ({
          exercicio_id: s.exercicio_id, ordem: s.ordem, series: s.series,
          rep_min: s.rep_min ?? 8, rep_max: s.rep_max ?? 12,
          carga_sugerida: Number(s.carga_sugerida ?? 0), descanso_seg: s.descanso_seg ?? 60,
          cadencia: s.cadencia ?? "2-0-1-0", tecnica: s.tecnica ?? "Nenhuma",
          rir: s.rir, series_aquecimento: s.series_aquecimento ?? 1,
          observacoes: s.observacoes ?? "",
        })),
    }));

  return (
    <EditorFicha
      alunos={(alunos ?? []).map((a: any) => ({
        id: a.usuario_id, nome: a.usuarios?.nome ?? "Sem nome", objetivo: a.objetivo, nivel: a.nivel,
      }))}
      exercicios={(exercicios ?? []).map((e: any) => ({
        id: e.id, nome: e.nome, nivel: e.nivel,
        grupo: e.categorias_musculares?.nome ?? "Outros",
        equipamento: e.equipamentos?.nome ?? "Outros",
      }))}
      frequentes={(frequentes ?? []).map((f: any) => f.exercicio_id)}
      fichaExistente={{
        id: ficha.id, aluno_id: ficha.aluno_id, nome: ficha.nome,
        objetivo: ficha.objetivo ?? "Hipertrofia", data_inicio: ficha.data_inicio,
        data_validade: ficha.data_validade, dias_semana: ficha.dias_semana,
        nivel: ficha.nivel ?? "Intermediário", status: ficha.status,
        observacoes: ficha.observacoes ?? "", divisoes,
      }}
    />
  );
}
