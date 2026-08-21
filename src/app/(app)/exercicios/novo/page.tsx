import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cabecalho, Cartao, Titulo } from "@/components/ui";
import FormularioExercicio from "@/components/FormularioExercicio";

export const dynamic = "force-dynamic";

export default async function NovoExercicioPage() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  const [{ data: categorias }, { data: equipamentos }] = await Promise.all([
    supabase.from("categorias_musculares").select("id, nome").order("nome"),
    supabase.from("equipamentos").select("id, nome").order("nome"),
  ]);

  return (
    <>
      <Cabecalho
        titulo="Novo exercício"
        sub="Crie uma variação só para sua conta"
        direita={<Link href="/exercicios" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}><ChevronLeft size={15} /> Voltar</Link>}
      />
      <div className="px-4 py-4">
        <Cartao>
          <Titulo tamanho={18}>Dados do exercício</Titulo>
          <p className="mb-5 mt-1 text-xs" style={{ color: "var(--dim)" }}>
            Nome, grupo e equipamento são obrigatórios. Foto e vídeo são opcionais, mas ajudam bastante na hora de montar a ficha.
          </p>
          <FormularioExercicio categorias={(categorias ?? []) as any} equipamentos={(equipamentos ?? []) as any} />
        </Cartao>
      </div>
    </>
  );
}
