import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ChevronLeft, TrendingDown, TrendingUp } from "lucide-react";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import FormularioMedidas, { type DadosMedidasFormulario } from "@/components/FormularioMedidas";
import { Cabecalho, Cartao, Indicador, Rotulo, Titulo, Vazio } from "@/components/ui";
import { fmtData } from "@/lib/formato";

export const dynamic = "force-dynamic";

type Medida = Omit<DadosMedidasFormulario, "data"> & {
  id: string;
  data: string;
  criado_em: string | null;
};

function hojeSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function numero(valor: unknown) {
  return valor == null ? null : Number(valor);
}

function diferenca(atual: number | null, anterior: number | null, casas = 1) {
  if (atual == null || anterior == null) return null;
  return Number((atual - anterior).toFixed(casas));
}

function Variacao({ valor, unidade }: { valor: number | null; unidade: string }) {
  if (valor == null || valor === 0) return null;
  const melhorMenor = unidade === "kg" || unidade === "cm";
  const subiu = valor > 0;
  const Icone = subiu ? TrendingUp : TrendingDown;
  const cor = melhorMenor ? (subiu ? "#D97706" : "#16A34A") : "var(--dim)";
  return (
    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: cor }}>
      <Icone size={12} /> {valor > 0 ? "+" : ""}{valor} {unidade}
    </span>
  );
}

export default async function MedidasPage({ searchParams }: { searchParams?: { salvo?: string } }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const supabase = criarClienteServidor();
  const { data } = await supabase
    .from("medidas_corporais")
    .select("id, data, peso_kg, gordura_pct, massa_muscular_kg, peitoral_cm, cintura_cm, abdomen_cm, quadril_cm, braco_d_cm, braco_e_cm, coxa_d_cm, coxa_e_cm, panturrilha_d_cm, panturrilha_e_cm, criado_em")
    .eq("aluno_id", usuario.id)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false })
    .limit(24);

  const medidas: Medida[] = (data ?? []).map((m: any) => ({
    ...m,
    peso_kg: numero(m.peso_kg),
    gordura_pct: numero(m.gordura_pct),
    massa_muscular_kg: numero(m.massa_muscular_kg),
    peitoral_cm: numero(m.peitoral_cm),
    cintura_cm: numero(m.cintura_cm),
    abdomen_cm: numero(m.abdomen_cm),
    quadril_cm: numero(m.quadril_cm),
    braco_d_cm: numero(m.braco_d_cm),
    braco_e_cm: numero(m.braco_e_cm),
    coxa_d_cm: numero(m.coxa_d_cm),
    coxa_e_cm: numero(m.coxa_e_cm),
    panturrilha_d_cm: numero(m.panturrilha_d_cm),
    panturrilha_e_cm: numero(m.panturrilha_e_cm),
  }));

  const atual = medidas[0] ?? null;
  const anterior = medidas[1] ?? null;
  const hoje = hojeSaoPaulo();
  const dadosFormulario: DadosMedidasFormulario = {
    data: hoje,
    peso_kg: atual?.peso_kg ?? null,
    gordura_pct: atual?.gordura_pct ?? null,
    massa_muscular_kg: atual?.massa_muscular_kg ?? null,
    peitoral_cm: atual?.peitoral_cm ?? null,
    cintura_cm: atual?.cintura_cm ?? null,
    abdomen_cm: atual?.abdomen_cm ?? null,
    quadril_cm: atual?.quadril_cm ?? null,
    braco_d_cm: atual?.braco_d_cm ?? null,
    braco_e_cm: atual?.braco_e_cm ?? null,
    coxa_d_cm: atual?.coxa_d_cm ?? null,
    coxa_e_cm: atual?.coxa_e_cm ?? null,
    panturrilha_d_cm: atual?.panturrilha_d_cm ?? null,
    panturrilha_e_cm: atual?.panturrilha_e_cm ?? null,
  };

  return (
    <>
      <Cabecalho
        titulo="Medidas corporais"
        sub={atual ? `Última medição em ${fmtData(atual.data)}` : "Comece seu histórico corporal"}
        direita={
          <Link href="/evolucao" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--linha)" }}>
            <ChevronLeft size={15} /> Evolução
          </Link>
        }
      />

      {searchParams?.salvo === "1" && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl px-3 py-3 text-sm" style={{ background: "#16A34A18", color: "#16A34A", border: "1px solid #16A34A35" }}>
          <CheckCircle2 size={17} /> Medidas salvas no seu histórico.
        </div>
      )}

      {atual && (
        <div className="grid grid-cols-2 gap-3 px-4 pt-3">
          <Indicador rotulo="Peso atual" valor={atual.peso_kg ?? "-"} unidade={atual.peso_kg != null ? "kg" : undefined} />
          <Indicador rotulo="Gordura" valor={atual.gordura_pct ?? "-"} unidade={atual.gordura_pct != null ? "%" : undefined} />
          <Indicador rotulo="Cintura" valor={atual.cintura_cm ?? "-"} unidade={atual.cintura_cm != null ? "cm" : undefined} />
          <Indicador rotulo="Massa muscular" valor={atual.massa_muscular_kg ?? "-"} unidade={atual.massa_muscular_kg != null ? "kg" : undefined} />
        </div>
      )}

      <section className="px-4 pt-4">
        <Cartao>
          <div className="mb-4">
            <Titulo tamanho={18}>{atual?.data === hoje ? "Atualizar medição de hoje" : "Registrar nova medição"}</Titulo>
            <p className="mt-1 text-xs" style={{ color: "var(--dim)" }}>
              Salvar novamente a mesma data atualiza o registro do dia sem duplicar o histórico.
            </p>
          </div>
          <FormularioMedidas dados={dadosFormulario} />
        </Cartao>
      </section>

      <section className="px-4 pb-6 pt-5">
        <Titulo tamanho={18}>Histórico</Titulo>
        <p className="mt-1 text-xs" style={{ color: "var(--dim)" }}>Cada data permanece registrada para acompanhar sua evolução ao longo do tempo.</p>

        {!medidas.length ? (
          <Vazio titulo="Nenhuma medição" texto="Registre peso ou alguma circunferência para começar." />
        ) : (
          <div className="mt-3 space-y-3">
            {medidas.map((m, indice) => {
              const previa = medidas[indice + 1] ?? null;
              return (
                <Cartao key={m.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Titulo tamanho={15}>{fmtData(m.data)}</Titulo>
                      <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
                        <div>
                          <Rotulo>Peso</Rotulo>
                          <div className="numero">{m.peso_kg ?? "-"}{m.peso_kg != null ? " kg" : ""}</div>
                          <Variacao valor={diferenca(m.peso_kg, previa?.peso_kg ?? null)} unidade="kg" />
                        </div>
                        <div>
                          <Rotulo>Gordura</Rotulo>
                          <div className="numero">{m.gordura_pct ?? "-"}{m.gordura_pct != null ? "%" : ""}</div>
                        </div>
                        <div>
                          <Rotulo>Cintura</Rotulo>
                          <div className="numero">{m.cintura_cm ?? "-"}{m.cintura_cm != null ? " cm" : ""}</div>
                          <Variacao valor={diferenca(m.cintura_cm, previa?.cintura_cm ?? null)} unidade="cm" />
                        </div>
                        <div>
                          <Rotulo>Quadril</Rotulo>
                          <div className="numero">{m.quadril_cm ?? "-"}{m.quadril_cm != null ? " cm" : ""}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Cartao>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
