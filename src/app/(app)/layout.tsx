import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/supabase/server";
import NavegacaoInferior from "@/components/NavegacaoInferior";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import ManterSessao from "@/components/ManterSessao";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  return (
    <div className="relative mx-auto min-h-screen max-w-md pb-24">
      <ManterSessao />
      <RegistrarServiceWorker />
      {children}
      <NavegacaoInferior papel={usuario.papel} />
    </div>
  );
}
