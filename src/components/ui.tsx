import Link from "next/link";
import type { ReactNode } from "react";

export function Cartao({ children, className = "", href }: { children: ReactNode; className?: string; href?: string }) {
  const conteudo = <div className={`cartao p-4 ${className}`}>{children}</div>;
  return href ? <Link href={href} className="block active:opacity-80">{conteudo}</Link> : conteudo;
}

export function Rotulo({ children, cor }: { children: ReactNode; cor?: string }) {
  return <div className="rotulo" style={cor ? { color: cor } : undefined}>{children}</div>;
}

export function Titulo({ children, tamanho = 20 }: { children: ReactNode; tamanho?: number }) {
  return <div className="display" style={{ fontSize: tamanho }}>{children}</div>;
}

export function Numero({ children, tamanho = 24, cor }: { children: ReactNode; tamanho?: number; cor?: string }) {
  return <span className="numero" style={{ fontSize: tamanho, color: cor }}>{children}</span>;
}

export function Indicador({ rotulo, valor, unidade, cor }: { rotulo: string; valor: ReactNode; unidade?: string; cor?: string }) {
  return (
    <div className="cartao p-3">
      <Rotulo>{rotulo}</Rotulo>
      <div className="mt-1 flex items-baseline gap-1">
        <Numero tamanho={22} cor={cor}>{valor}</Numero>
        {unidade && <span className="text-xs" style={{ color: "var(--dim)" }}>{unidade}</span>}
      </div>
    </div>
  );
}

export function Etiqueta({ children, cor, ativo }: { children: ReactNode; cor?: string; ativo?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        background: ativo ? "var(--marca)" : cor ? `${cor}22` : "var(--superficie-2)",
        color: ativo ? "#fff" : cor ?? "var(--dim)",
        border: `1px solid ${ativo ? "var(--marca)" : "var(--linha)"}`,
      }}
    >
      {children}
    </span>
  );
}

export function Barra({ valor, altura = 8, cor = "var(--marca)" }: { valor: number; altura?: number; cor?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ height: altura, background: "var(--superficie-2)" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, valor))}%`, height: "100%", background: cor, transition: "width .4s ease" }} />
    </div>
  );
}

export function FaixaAnilhas() {
  return (
    <div className="anilhas">
      <span style={{ width: 26, background: "#D62828" }} />
      <span style={{ width: 22, background: "#1D4ED8" }} />
      <span style={{ width: 18, background: "#F4C20D" }} />
      <span style={{ width: 14, background: "#16A34A" }} />
    </div>
  );
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <Titulo tamanho={18}>{titulo}</Titulo>
      <p className="mb-4 mt-1 text-sm" style={{ color: "var(--dim)" }}>{texto}</p>
      {acao}
    </div>
  );
}

export function Cabecalho({ titulo, sub, direita }: { titulo: string; sub?: string; direita?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
      style={{ background: "var(--bg)", borderBottom: "1px solid var(--linha)" }}>
      <div className="min-w-0 flex-1">
        <Titulo tamanho={19}>{titulo}</Titulo>
        {sub && <div className="text-xs" style={{ color: "var(--dim)" }}>{sub}</div>}
      </div>
      {direita}
    </header>
  );
}
