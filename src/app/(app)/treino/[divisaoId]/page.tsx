import { notFound } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import ExecucaoTreino from "@/components/ExecucaoTreino";

export const dynamic = "force-dynamic";

export default async function ExecucaoPage({ params }: { params: { divisaoId: string } }) {
  const usuario = (await usuarioAtual())!;
  const supabase = criarClienteServidor();

  const { data: divisao } = await supabase
    .from("divisoes_treino")
    .select("*, fichas(id, nome), series_planejadas(*, exercicios(id, nome, instrucoes, erros_comuns, imagem_url, video_url, categorias_musculares(nome), equipamentos(nome)))")
    .eq("id", params.divisaoId)
    .maybeSingle();

  if (!divisao) notFound();

  // Última carga por exercício, para pré-preencher os campos (regra 15)
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

  const itens = [...(divisao.series_planejadas ?? [])].sort((a: any, b: any) => a.ordem - b.ordem);

  return (
    <ExecucaoTreino
      alunoId={usuario.id}
      fichaId={(divisao as any).fichas?.id ?? null}
      divisao={{ id: divisao.id, codigo: divisao.codigo, nome: divisao.nome }}
      itens={itens as any}
      ultimasCargas={ultimas}
    />
  );
}
