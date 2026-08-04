export const fmtData = (iso?: string | null) => {
  if (!iso) return "-";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

export const fmtHora = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export const fmtKg = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });

export const fmtMoeda = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const iniciais = (nome: string) =>
  nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();

export const diasEntre = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

/** Segunda-feira da semana da data informada, no formato ISO. */
export const semanaDe = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
