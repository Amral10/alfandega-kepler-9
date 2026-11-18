import type { VerdictReason } from './types';

// Compara decisão e motivo sem armazenar gabarito em tabelas SQL.
export interface ExpectedVerdict { travelerId: number; approved: boolean; reasons: readonly VerdictReason[] }
export interface VerdictEvaluation { correct: boolean; decisionCorrect: boolean; reasonCorrect: boolean }
export function evaluateVerdict(expected: ExpectedVerdict, approved: boolean, reason: VerdictReason): VerdictEvaluation {
  const decisionCorrect = approved === expected.approved;
  const reasonCorrect = expected.reasons.includes(reason);
  return { correct: decisionCorrect && reasonCorrect, decisionCorrect, reasonCorrect };
}
