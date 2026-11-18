import type { MediumState } from '../game/medium';
import type { BankMode } from '../game/types';
import type { TutorialStepId } from '../content/tutorial';
import type { TutorialValidation } from '../game/tutorial';
export type Cell = string | number | null;
export interface ResultTable { columns: string[]; rows: Cell[][]; truncated: boolean }
export interface QueryResult { tables: ResultTable[]; changes: number; statementCount: number; elapsedMs: number; validation?: TutorialValidation; medium?: MediumState }
export type WorkerRequest =
  | { id: number; type: 'initialize'; snapshot?: Uint8Array; mode?: BankMode; medium?: MediumState }
  | { id: number; type: 'execute'; sql: string; objective?: TutorialStepId }
  | { id: number; type: 'confirm'; travelerId: number; deadline: number };
export type WorkerResponse =
  | { id: number; type: 'ready'; snapshot: Uint8Array; medium?: MediumState }
  | { id: number; type: 'result'; result: QueryResult; snapshot: Uint8Array }
  | { id: number; type: 'confirmed'; snapshot: Uint8Array; medium: MediumState }
  | { id: number; type: 'error'; message: string };
export const MAX_ROWS = 200;
export const MAX_STATEMENTS = 20;
export const MAX_SQL_LENGTH = 20000;
export const QUERY_TIMEOUT_MS = 5000;
