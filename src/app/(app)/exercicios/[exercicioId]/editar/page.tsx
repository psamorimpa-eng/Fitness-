import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cabecalho, Cartao } from "@/components/ui";
import FormularioExercicio from "@/components/FormularioExercicio";

export const dynamic = "force-dynamic";

export default async function EditarExercicioPage({ params }: { params: { exercicioId: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  const [{ data: exercicio }, { data: secundarios }, { data: categorias }, { data: equipamentos }] = await Promise.all([
    supabase
      .from("exercicios")
      .select("id, nome, categoria_id, equipamento_id, nivel, tipo, descricao, instrucoes, erros_comuns, imagem_url, video_url, observacoes, ativo")
      .eq("id", params.exercicioId)
      .eq("criado_por", usuario.id)
      .eq("publico", false)
      .maybeSingle(),
    supabase.from("exercicio_secundarios").select("categoria_id").eq("exercicio_id", params.exercicioId),
    supabase.from("categorias_musculares").select("id, nome").order("nome"),
    supabase.from("equipamentos").select("id, nome").order("nome"),
  ]);

  if (!exercicio) notFound();

  return (
    <>
      <Cabecalho
        titulo="Editar exercício"
        sub={exercicio.nome}
        direita={<Link href="/exercicios" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}><ChevronLeft size={15} /> Voltar</Link>}
      />
      <div className="px-4 py-4">
        <Cartao>
          <FormularioExercicio
            categorias={(categorias ?? []) as any}
            equipamentos={(equipamentos ?? []) as any}
            dados={exercicio as any}
            secundariosAtuais={(secundarios ?? []).map((s: any) => Number(s.categoria_id))}
          />
        </Cartao>
      </div>
    </>
  );
}
