import type { EndReason, LevelConfig, Phase } from './types';

export const LEVELS: readonly LevelConfig[] = [
  { id: 'facil', title: 'Construir o sistema', durationSeconds: 1200, available: true },
  { id: 'medio', title: 'Controlar a fronteira', durationSeconds: 900, available: true },
  { id: 'avancado', title: 'Cruzar evidências', durationSeconds: 1200, available: true },
];
export const DEMO_DURATION_SECONDS = 600;

export class Session {
  phase: Phase = 'apresentacao';
  startedAt: number | null = null;
  endedAt: number | null = null;
  reason: EndReason | null = null;

  constructor(readonly durationSeconds = DEMO_DURATION_SECONDS) {}

  serialize() { return { durationSeconds:this.durationSeconds, phase:this.phase, startedAt:this.startedAt, endedAt:this.endedAt, reason:this.reason }; }
  static restore(data: ReturnType<Session['serialize']>): Session {
    const s=new Session(data.durationSeconds);
    s.phase=data.phase; s.startedAt=data.startedAt; s.endedAt=data.endedAt; s.reason=data.reason;
    return s;
  }

  start(now = Date.now()): void {
    if (this.phase !== 'apresentacao') return;
    this.startedAt = now;
    this.phase = 'em-andamento';
  }

  remaining(now = Date.now()): number {
    if (this.startedAt === null) return this.durationSeconds;
    return Math.min(this.durationSeconds, Math.max(0, Math.ceil((this.durationSeconds * 1000 - ((this.endedAt ?? now) - this.startedAt)) / 1000)));
  }

  tick(now = Date.now()): boolean {
    if (this.phase === 'em-andamento' && this.remaining(now) === 0) {
      this.finish('tempo', now);
      return true;
    }
    return false;
  }

  finish(reason: EndReason = 'manual', now = Date.now()): void {
    if (this.phase !== 'em-andamento') return;
    this.endedAt = now;
    this.reason = reason;
    this.phase = 'encerrada';
  }
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
