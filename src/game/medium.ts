import type { Verdict, VerdictReason } from './types';
import { inspectionContent, type InspectionLevel } from '../content/inspection';
export interface MediumReceipt {
  travelerId: number; name: string; approved: boolean; reason: VerdictReason;
  expectedApproved: boolean; expectedReason: VerdictReason;
  decisionCorrect: boolean; reasonCorrect: boolean; correct: boolean; points: number; evidence: string[];
}
export interface MediumState {
  level: InspectionLevel;
  index: number;
  investigated: boolean;
  practice: 'insert' | 'update' | 'delete' | 'final-insert' | 'ready';
  drafts: Verdict[];
  receipts: MediumReceipt[];
  learned: string[];
  feedback: string;
}
export function createMediumState(level: InspectionLevel = 'medio'): MediumState {
  return { level, index: 0, investigated: false, practice: 'insert', drafts: [], receipts: [], learned: [], feedback: 'Execute a investigação e prepare um rascunho antes de confirmar.' };
}
export function canConfirmMedium(state?: MediumState): boolean {
  return !!state && state.index < inspectionContent(state.level).travelers.length && state.investigated && state.practice === 'ready' && state.drafts.length === 1;
}
export function mediumTotals(state: MediumState) {
  const correct = state.receipts.filter(r => r.correct).length;
  return { correct, errors: state.receipts.length - correct, pending: inspectionContent(state.level).travelers.length - state.receipts.length, points: state.receipts.reduce((sum, r) => sum + r.points, 0) };
}
