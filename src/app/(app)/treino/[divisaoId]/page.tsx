import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import ExecucaoTreino from "@/components/ExecucaoTreino";
import ManterTelaAcordada from "@/components/ManterTelaAcordada";
import { Vazio } from "@/components/ui";

export const dynamic = "force-dynamic";

function erroCarregamento(texto: string) {
  return (
    <Vazio
      titulo="Não foi possível carregar o treino"
      texto={texto}
      acao={
        <Link href="/treino" className="rounded-xl px-4 py-3 font-semibold text-white" style={{ background: "var(--marca)" }}>
          Voltar aos treinos
        </Link>
      }
    />
  );
}

export default async function ExecucaoPage({ params }: { params: { divisaoId: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  // Evita embeds profundos do PostgREST. O relacionamento de exercícios possui mais de um
  // caminho possível e retornava HTTP 300, que antes era interpretado como divisão inexistente.
  const { data: divisao, error: erroDivisao } = await supabase
    .from("divisoes_treino")
    .select("id, ficha_id, codigo, nome, ordem")
    .eq("id", params.divisaoId)
    .maybeSingle();

  if (erroDivisao) {
    console.error("Falha ao carregar divisão do treino:", erroDivisao.message);
    return erroCarregamento("O servidor não conseguiu ler a divisão. Tente novamente.");
  }
  if (!divisao) notFound();

  const [
    { data: ficha, error: erroFicha },
    { data: seriesPlanejadas, error: erroSeries },
    { data: treinoAberto, error: erroTreinoAberto },
    { data: catalogo, error: erroCatalogo },
  ] = await Promise.all([
    supabase.from("fichas").select("id, nome, aluno_id").eq("id", divisao.ficha_id).maybeSingle(),
    supabase.from("series_planejadas").select("*").eq("divisao_id", divisao.id).order("ordem"),
    supabase
      .from("treinos_realizados")
      .select("id, local_id, inicio_em, observacoes, ficha_nome_snapshot, divisao_codigo_snapshot, divisao_nome_snapshot, plano_snapshot, series_realizadas(id, exercicio_id, numero_serie, carga_kg, repeticoes, pse, aquecimento, registrada_em)")
      .eq("aluno_id", usuario.id)
      .eq("divisao_id", params.divisaoId)
      .eq("status", "em_andamento")
      .order("inicio_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.rpc("catalogo_exercicios_v2"),
  ]);

  if (erroFicha || erroSeries || erroTreinoAberto || erroCatalogo) {
    console.error("Falha ao montar execução do treino:", {
      ficha: erroFicha?.message,
      series: erroSeries?.message,
      treino: erroTreinoAberto?.message,
      catalogo: erroCatalogo?.message,
    });
    return erroCarregamento("Seus dados continuam salvos. Recarregue a página ou volte aos treinos e tente novamente.");
  }
  if (!ficha) notFound();

  const porId = new Map(
    (catalogo ?? []).map((e: any) => [String(e.id), {
      id: e.id,
      nome: e.nome,
      descricao: e.descricao,
      instrucoes: e.instrucoes,
      erros_comuns: e.erros_comuns,
      imagem_url: e.imagem_url,
      video_url: e.video_url,
      categorias_musculares: e.grupo ? { nome: e.grupo } : null,
      equipamentos: e.equipamento ? { nome: e.equipamento } : null,
    }])
  );

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

  let itens: any[] = (seriesPlanejadas ?? []).map((s: any) => ({
    ...s,
    exercicios: porId.get(String(s.exercicio_id)) ?? { id: s.exercicio_id, nome: "Exercício" },
  }));

  const snapshot = Array.isArray((treinoAberto as any)?.plano_snapshot)
    ? (treinoAberto as any).plano_snapshot as any[]
    : [];

  // Um treino já iniciado sempre usa o plano congelado no momento do início.
  if (snapshot.length) {
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
    <>
      <ManterTelaAcordada />
      <ExecucaoTreino
        alunoId={usuario.id}
        fichaId={ficha.id}
        fichaNome={(treinoAberto as any)?.ficha_nome_snapshot ?? ficha.nome ?? null}
        divisao={{
          id: divisao.id,
          codigo: (treinoAberto as any)?.divisao_codigo_snapshot ?? divisao.codigo,
          nome: (treinoAberto as any)?.divisao_nome_snapshot ?? divisao.nome,
        }}
        itens={itens as any}
        ultimasCargas={ultimas}
        treinoEmAndamento={treinoAberto as any}
      />
    </>
  );
}
