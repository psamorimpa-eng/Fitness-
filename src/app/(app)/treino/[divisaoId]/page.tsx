import { notFound, redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import ExecucaoTreino from "@/components/ExecucaoTreino";

export const dynamic = "force-dynamic";

export default async function ExecucaoPage({ params }: { params: { divisaoId: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  const [{ data: divisao }, { data: treinoAberto }] = await Promise.all([
    supabase
      .from("divisoes_treino")
      .select("*, fichas(id, nome), series_planejadas(*, exercicios(id, nome, descricao, instrucoes, erros_comuns, imagem_url, video_url, categorias_musculares(nome), equipamentos(nome)))")
      .eq("id", params.divisaoId)
      .maybeSingle(),
    supabase
      .from("treinos_realizados")
      .select("id, local_id, inicio_em, observacoes, ficha_nome_snapshot, divisao_codigo_snapshot, divisao_nome_snapshot, plano_snapshot, series_realizadas(id, exercicio_id, numero_serie, carga_kg, repeticoes, pse, aquecimento, registrada_em)")
      .eq("aluno_id", usuario.id)
      .eq("divisao_id", params.divisaoId)
      .eq("status", "em_andamento")
      .order("inicio_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!divisao) notFound();

  const { data: historico } = await supabase
    .from("series_realizadas")
    .select("exercicio_id, carga_kg, repeticoes, treinos_realizados!inner(aluno_id, data, status)")
    .eq("treinos_realizados.aluno_id", usuario.id)
    .eq("treinos_realizados.status", "concluido")
    .order("registrada_em", { ascending: false })
    .limit(400);

  const ultimas: Record<string, { carga: number; reps: number }> = {};
  (historico ?? []).forEach((s: any) => {
    const atual = ultimas[s.exercicio_id];
    if (!atual || Number(s.carga_kg) > atual.carga) {
      ultimas[s.exercicio_id] = { carga: Number(s.carga_kg), reps: s.repeticoes };
    }
  });

  let itens: any[] = [...(divisao.series_planejadas ?? [])].sort((a: any, b: any) => a.ordem - b.ordem);
  const snapshot = Array.isArray((treinoAberto as any)?.plano_snapshot) ? (treinoAberto as any).plano_snapshot as any[] : [];

  // Um treino já iniciado sempre usa o plano congelado no momento do início.
  if (snapshot.length) {
    const ids = snapshot.map((p) => String(p.exercicio_id)).filter(Boolean);
    const { data: exerciciosSnapshot } = await supabase
      .from("exercicios")
      .select("id, nome, descricao, instrucoes, erros_comuns, imagem_url, video_url, categorias_musculares(nome), equipamentos(nome)")
      .in("id", ids);
    const porId = new Map((exerciciosSnapshot ?? []).map((e: any) => [e.id, e]));

    itens = snapshot
      .map((p: any, i: number) => {
        const exAtual: any = porId.get(String(p.exercicio_id));
        return {
          id: `snapshot-${p.exercicio_id}-${p.ordem ?? i + 1}`,
          divisao_id: divisao.id,
          exercicio_id: String(p.exercicio_id),
          ordem: Number(p.ordem ?? i + 1),
          series: Number(p.series ?? 3),
          rep_min: p.rep_min == null ? null : Number(p.rep_min),
          rep_max: p.rep_max == null ? null : Number(p.rep_max),
          carga_sugerida: p.carga_sugerida == null ? null : Number(p.carga_sugerida),
          descanso_seg: p.descanso_seg == null ? 60 : Number(p.descanso_seg),
          cadencia: p.cadencia ?? "2-0-1-0",
          tecnica: p.tecnica ?? "Nenhuma",
          rir: p.rir == null ? null : Number(p.rir),
          series_aquecimento: p.series_aquecimento == null ? 0 : Number(p.series_aquecimento),
          observacoes: p.observacoes ?? "",
          exercicios: exAtual ? { ...exAtual, nome: p.nome ?? exAtual.nome } : { id: p.exercicio_id, nome: p.nome ?? "Exercício" },
        };
      })
      .sort((a, b) => a.ordem - b.ordem);
  }

  return (
    <ExecucaoTreino
      alunoId={usuario.id}
      fichaId={(divisao as any).fichas?.id ?? null}
      fichaNome={(treinoAberto as any)?.ficha_nome_snapshot ?? (divisao as any).fichas?.nome ?? null}
      divisao={{
        id: divisao.id,
        codigo: (treinoAberto as any)?.divisao_codigo_snapshot ?? divisao.codigo,
        nome: (treinoAberto as any)?.divisao_nome_snapshot ?? divisao.nome,
      }}
      itens={itens as any}
      ultimasCargas={ultimas}
      treinoEmAndamento={treinoAberto as any}
    />
  );
}
