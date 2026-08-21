import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { usuarioAtual } from "@/lib/supabase/server";
import FormularioPerfil from "@/components/FormularioPerfil";
import { Titulo } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditarPerfil() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const perfil = usuario.perfis_aluno;

  return (
    <main className="px-4 pt-5">
      <Link href="/perfil" className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: "var(--dim)" }}>
        <ChevronLeft size={16} /> Perfil
      </Link>
      <Titulo tamanho={25}>Editar perfil</Titulo>
      <p className="mb-5 mt-1 text-sm" style={{ color: "var(--dim)" }}>
        Atualize seus dados. As alterações ficam salvas na sua conta.
      </p>
      <FormularioPerfil
        dados={{
          nome: usuario.nome,
          altura_cm: perfil?.altura_cm ?? null,
          peso_kg: perfil?.peso_kg ?? null,
          objetivo: perfil?.objetivo ?? null,
          nivel: perfil?.nivel ?? null,
          meta_semanal: perfil?.meta_semanal ?? 3,
          restricoes: perfil?.restricoes ?? null,
          lesoes: perfil?.lesoes ?? null,
        }}
      />
    </main>
  );
}
