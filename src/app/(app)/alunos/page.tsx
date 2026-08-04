import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { Cartao, Titulo, Etiqueta, Cabecalho, Vazio } from "@/components/ui";
import { iniciais, diasEntre } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Alunos() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = criarClienteServidor();

  const consulta = supabase
    .from("perfis_aluno")
    .select("usuario_id, objetivo, nivel, meta_semanal, usuarios!perfis_aluno_usuario_id_fkey(nome, email, ativo)");

  const { data: alunos } = usuario.papel === "admin"
    ? await consulta
    : await consulta.eq("personal_id", usuario.id);

  if (!alunos?.length) {
    return <Vazio titulo="Nenhum aluno vinculado" texto="Cadastre o primeiro aluno para começar a montar fichas." />;
  }

  const { data: ultimos } = await supabase
    .from("treinos_realizados")
    .select("aluno_id, data")
    .in("aluno_id", alunos.map((a: any) => a.usuario_id))
    .eq("status", "concluido")
    .order("data", { ascending: false });

  const ultimoPorAluno = new Map<string, string>();
  (ultimos ?? []).forEach((t: any) => {
    if (!ultimoPorAluno.has(t.aluno_id)) ultimoPorAluno.set(t.aluno_id, t.data);
  });

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Cabecalho titulo="Alunos" sub={`${alunos.length} vinculados`} />
      <div className="space-y-2 px-4 pt-3">
        {alunos.map((a: any) => {
          const ultimo = ultimoPorAluno.get(a.usuario_id);
          const dias = ultimo ? diasEntre(ultimo, hoje) : null;
          const inativo = dias === null || dias > 7;
          return (
            <Link key={a.usuario_id} href={`/evolucao?aluno=${a.usuario_id}`} className="block">
              <Cartao>
                <div className="flex items-center gap-3">
                  <div className="display flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: inativo ? "var(--marca-suave)" : "var(--superficie-2)", color: inativo ? "var(--marca)" : "var(--dim)" }}>
                    {iniciais(a.usuarios?.nome ?? "??")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Titulo tamanho={16}>{a.usuarios?.nome}</Titulo>
                    <div className="text-xs" style={{ color: "var(--dim)" }}>{a.objetivo} · {a.nivel}</div>
                  </div>
                  <Etiqueta cor={inativo ? "#D62828" : "#16A34A"}>
                    {dias === null ? "nunca" : dias === 0 ? "hoje" : `${dias}d`}
                  </Etiqueta>
                </div>
              </Cartao>
            </Link>
          );
        })}
      </div>
    </>
  );
}
