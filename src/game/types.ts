export type LevelId = 'facil' | 'medio' | 'avancado';
export type Phase = 'apresentacao' | 'em-andamento' | 'encerrada';
export type EndReason = 'manual' | 'tempo' | 'concluido';
export type BankMode = 'demo' | 'facil' | 'medio' | 'avancado';
export type VerdictReason = 'regular' | 'identidade' | 'visto' | 'biologia' | 'exame' | 'historico';

export interface LevelConfig {
  id: LevelId;
  title: string;
  durationSeconds: number;
  available: boolean;
}
export interface Traveler {
  id: number;
  nome: string;
  especie: string;
  origem: string;
  destino: string;
  historia: string;
}
export interface DocumentRecord { id: number; viajante_id: number; numero: string; nome_registrado: string; validade: string }
export interface Visa { id: number; viajante_id: number; destino: string; validade: string }
export interface BiologicalAnalysis { id: number; viajante_id: number; compativel: 0 | 1; data: string }
export interface Exam { id: number; viajante_id: number; doenca: string; resultado: 'negativo' | 'positivo'; data: string; validade: string }
export interface Journey { id: number; viajante_id: number; destino: string; data: string }
export interface Restriction { id: number; destino: string; tipo: string; descricao: string }
export interface Verdict { id: number; viajante_id: number; aprovado: 0 | 1; motivo: VerdictReason; registrado_em: string; confirmado: 0 | 1 }
export interface Scenario {
  id: string;
  title: string;
  referenceDate: string;
  travelers: readonly Traveler[];
  briefing: string;
}
