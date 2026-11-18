import type { BankMode, LevelId } from './types';
import type { Session } from './session';
import type { TutorialProgress } from './tutorial';
import { mediumTotals, type MediumState } from './medium';
import { TUTORIAL_STEPS } from '../content/tutorial';
export interface LevelResult {
  completed: boolean; points: number; correct: number; errors: number; pending: number;
  objectives: string[]; endedAt: number; reason: 'manual'|'tempo'|'concluido';
}
export interface CampaignProgress { completed: LevelId[]; results: Partial<Record<LevelId,LevelResult>> }
export function newCampaign(): CampaignProgress { return {completed:[],results:{}}; }
export function recordLevel(campaign: CampaignProgress,mode: BankMode,session: Session,tutorial: TutorialProgress,inspection?: MediumState): void {
  if(mode==='demo'||session.phase!=='encerrada'||session.endedAt===null||!session.reason)return;
  const completed=session.reason==='concluido';
  if(completed&&!campaign.completed.includes(mode))campaign.completed.push(mode);
  const totals=inspection?mediumTotals(inspection):{points:0,correct:0,errors:0,pending:0};
  campaign.results[mode]={completed,...totals,pending:mode==='facil'?TUTORIAL_STEPS.length-tutorial.completed.size:totals.pending,objectives:mode==='facil'?[...tutorial.completed]:[...(inspection?.learned??[])],endedAt:session.endedAt,reason:session.reason};
}
export function campaignTotals(campaign: CampaignProgress) {
  const inspections=['medio','avancado'] as const;
  return {points:inspections.reduce((n,l)=>n+(campaign.results[l]?.points??0),0),correct:inspections.reduce((n,l)=>n+(campaign.results[l]?.correct??0),0),errors:inspections.reduce((n,l)=>n+(campaign.results[l]?.errors??0),0),pending:inspections.reduce((n,l)=>n+(campaign.results[l]?.pending??6),0),complete:['facil','medio','avancado'].every(l=>campaign.completed.includes(l as LevelId))};
}
