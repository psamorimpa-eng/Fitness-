/**
 * Tipagem do banco. Em produção, gerar automaticamente com:
 *   npx supabase gen types typescript --linked > src/lib/tipos.gerado.ts
 * Este arquivo mantém apenas os tipos usados pela Fase 1.
 */

export type Papel = "aluno" | "personal" | "admin";
export type StatusFicha = "rascunho" | "ativa" | "arquivada" | "vencida";
export type StatusTreino = "em_andamento" | "concluido" | "abandonado";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  nascimento: string | null;
  sexo: string | null;
  papel: Papel;
  academia_id: string | null;
  foto_url: string | null;
  ativo: boolean;
  perfis_aluno?: PerfilAluno | null;
  perfis_personal?: { cref: string | null; especialidade: string | null } | null;
}

export interface PerfilAluno {
  usuario_id: string;
  altura_cm: number | null;
  peso_kg: number | null;
  objetivo: string | null;
  nivel: string | null;
  restricoes: string | null;
  lesoes: string | null;
  personal_id: string | null;
  data_inicio: string | null;
  meta_semanal: number;
  observacoes: string | null;
}

export interface Exercicio {
  id: string;
  nome: string;
  nivel: string | null;
  tipo: string | null;
  instrucoes: string | null;
  erros_comuns: string | null;
  imagem_url: string | null;
  video_url: string | null;
  categorias_musculares?: { nome: string } | null;
  equipamentos?: { nome: string } | null;
}

export interface SeriePlanejada {
  id: string;
  divisao_id: string;
  exercicio_id: string;
  ordem: number;
  series: number;
  rep_min: number | null;
  rep_max: number | null;
  carga_sugerida: number | null;
  descanso_seg: number | null;
  cadencia: string | null;
  tecnica: string | null;
  rir: number | null;
  series_aquecimento: number | null;
  observacoes: string | null;
  exercicios?: Exercicio;
}

export interface Divisao {
  id: string;
  ficha_id: string;
  codigo: string;
  nome: string;
  ordem: number;
  series_planejadas?: SeriePlanejada[];
}

export interface Ficha {
  id: string;
  aluno_id: string;
  personal_id: string | null;
  nome: string;
  objetivo: string | null;
  data_inicio: string;
  data_validade: string | null;
  dias_semana: number;
  nivel: string | null;
  status: StatusFicha;
  observacoes: string | null;
  divisoes_treino?: Divisao[];
}

export interface SerieRealizada {
  id: string;
  treino_id: string;
  exercicio_id: string;
  numero_serie: number;
  carga_kg: number;
  repeticoes: number;
  pse: number | null;
  aquecimento: boolean;
  registrada_em: string;
}

export interface TreinoComSeries {
  id: string;
  aluno_id: string;
  ficha_id: string | null;
  divisao_id: string | null;
  data: string;
  duracao_min: number | null;
  volume_total: number | null;
  status: StatusTreino;
  observacoes: string | null;
  series_realizadas: SerieRealizada[];
  divisoes_treino?: { codigo: string; nome: string } | null;
}

export interface Medida {
  id: string;
  aluno_id: string;
  data: string;
  peso_kg: number | null;
  cintura_cm: number | null;
  peitoral_cm: number | null;
  braco_d_cm: number | null;
  coxa_d_cm: number | null;
  gordura_pct: number | null;
  massa_muscular_kg: number | null;
}

/** Assinatura mínima aceita pelos clientes tipados do Supabase. */
export type Database = any;
