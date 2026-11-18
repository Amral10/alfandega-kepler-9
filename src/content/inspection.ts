import type { BankMode } from '../game/types';
import { ADVANCED_TRAVELERS, ADVANCED_INVESTIGATIONS, advancedRules, seedAdvanced } from './advanced';
import { MEDIUM_TRAVELERS, INVESTIGATIONS, mediumRules, seedMedium } from './medium';
export type InspectionLevel = 'medio' | 'avancado';
export function isInspection(mode: BankMode): mode is InspectionLevel { return mode === 'medio' || mode === 'avancado'; }
export function inspectionContent(mode: BankMode) {
  return mode === 'avancado'
    ? { level: 'avancado' as const, label: 'AVANÇADO', travelers: ADVANCED_TRAVELERS, tasks: ADVANCED_INVESTIGATIONS, rules: advancedRules, seed: seedAdvanced }
    : { level: 'medio' as const, label: 'MÉDIO', travelers: MEDIUM_TRAVELERS, tasks: INVESTIGATIONS, rules: mediumRules, seed: seedMedium };
}
