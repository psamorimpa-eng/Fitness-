function diaUtc(data: string) {
  const [ano, mes, dia] = data.slice(0, 10).split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

export function diasParaValidade(dataValidade: string | null | undefined, hoje = new Date()) {
  if (!dataValidade) return null;
  const hojeUtc = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.ceil((diaUtc(dataValidade) - hojeUtc) / 86_400_000);
}

export function avisoValidade(dataValidade: string | null | undefined, hoje = new Date()) {
  const dias = diasParaValidade(dataValidade, hoje);
  if (dias === null) return null;
  if (dias < 0) return { dias, tipo: "vencida" as const, texto: `Ficha vencida há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}.` };
  if (dias === 0) return { dias, tipo: "critico" as const, texto: "A ficha vence hoje." };
  if (dias === 1) return { dias, tipo: "critico" as const, texto: "A ficha vence amanhã." };
  if (dias <= 7) return { dias, tipo: "alerta" as const, texto: `A ficha vence em ${dias} dias.` };
  if (dias <= 15) return { dias, tipo: "atencao" as const, texto: `A ficha vence em ${dias} dias.` };
  return { dias, tipo: "ok" as const, texto: `Validade: faltam ${dias} dias.` };
}
