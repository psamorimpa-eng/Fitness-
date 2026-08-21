import { notFound, redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import EditorFicha from "@/components/EditorFicha";

export const dynamic = "force-dynamic";

export default async function EditarFicha({ params }: { params: { fichaId: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const supabase = criarClienteServidor();

  const [{ data: ficha }, { data: perfil }, { data: exercicios }, { data: frequentes }] = await Promise.all([
    supabase.from("fichas")
      .select("*, divisoes_treino(*, series_planejadas(*))")
      .eq("id", params.fichaId)
      .eq("aluno_id", usuario.id)
      .maybeSingle(),
    supabase.from("perfis_aluno")
      .select("objetivo, nivel")
      .eq("usuario_id", usuario.id)
      .maybeSingle(),
    supabase.rpc("catalogo_exercicios_v2"),
    supabase.rpc("exercicios_frequentes", { p_limite: 12 }),
  ]);

  if (!ficha) notFound();

  const divisoes = [...(ficha.divisoes_treino ?? [])]
    .sort((a: any, b: any) => a.ordem - b.ordem)
    .map((d: any) => ({
      id: d.id,
      codigo: d.codigo,
      nome: d.nome,
      ordem: d.ordem,
      itens: [...(d.series_planejadas ?? [])]
        .sort((a: any, b: any) => a.ordem - b.ordem)
        .map((s: any) => ({
          id: s.id,
          exercicio_id: s.exercicio_id, ordem: s.ordem, series: s.series,
          rep_min: s.rep_min ?? 8, rep_max: s.rep_max ?? 12,
          carga_sugerida: Number(s.carga_sugerida ?? 0), descanso_seg: s.descanso_seg ?? 60,
          cadencia: s.cadencia ?? "2-0-1-0", tecnica: s.tecnica ?? "Nenhuma",
          rir: s.rir, series_aquecimento: s.series_aquecimento ?? 1,
          observacoes: s.observacoes ?? "",
        })),
    }));

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
        grupo: e.grupo ?? "Outros",
        equipamento: e.equipamento ?? "Outros",
      }))}
      frequentes={(frequentes ?? []).map((f: any) => f.exercicio_id)}
      fichaExistente={{
        id: ficha.id, aluno_id: usuario.id, nome: ficha.nome,
        objetivo: ficha.objetivo ?? "Hipertrofia", data_inicio: ficha.data_inicio,
        data_validade: ficha.data_validade, dias_semana: ficha.dias_semana,
        nivel: ficha.nivel ?? "Intermediário", status: ficha.status,
        observacoes: ficha.observacoes ?? "", divisoes,
      }}
    />
  );
}
