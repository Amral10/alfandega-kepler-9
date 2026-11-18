import { TUTORIAL_STEPS, type TutorialStepId } from '../content/tutorial';
import type { Session } from './session';

export interface TutorialValidation { stepId: TutorialStepId; satisfied: boolean; message: string }

/** Progresso fora do SQL; uma execução bem-sucedida não avança mais de uma tarefa. */
export class TutorialProgress {
  private index = 0;
  readonly completed = new Set<TutorialStepId>();
  hintsRevealed = 0;
  feedback: TutorialValidation | null = null;
  get step() { return TUTORIAL_STEPS[this.index]; }
  get position() { return this.index; }
  get finished() { return this.completed.size === TUTORIAL_STEPS.length; }

  serialize() { return { completed: [...this.completed], hintsRevealed: this.hintsRevealed, feedback: this.feedback }; }
  static restore(data: ReturnType<TutorialProgress['serialize']>): TutorialProgress {
    const p = new TutorialProgress();
    if (!Array.isArray(data.completed) || data.completed.length > TUTORIAL_STEPS.length || !data.completed.every((id,i)=>id===TUTORIAL_STEPS[i].id)) throw new Error('Ordem de tarefas salva inválida.');
    if (!Number.isInteger(data.hintsRevealed) || data.hintsRevealed<0 || data.hintsRevealed>3) throw new Error('Dicas salvas inválidas.');
    data.completed.forEach(id=>p.completed.add(id));
    p.index=Math.min(data.completed.length,TUTORIAL_STEPS.length-1);
    p.hintsRevealed=data.hintsRevealed;
    if(data.feedback && (data.feedback.stepId!==p.step.id || typeof data.feedback.satisfied!=='boolean' || typeof data.feedback.message!=='string')) throw new Error('Validação salva inválida.');
    p.feedback=data.feedback?structuredClone(data.feedback):null;
    return p;
  }

  accept(validation: TutorialValidation | undefined, session: Session): void {
    this.feedback = session.phase === 'em-andamento' && validation?.stepId === this.step.id ? validation : null;
  }
  revealHint(): void { this.hintsRevealed = Math.min(this.step.hints.length, this.hintsRevealed + 1); }

  advance(session: Session, now = Date.now()): boolean {
    if (session.tick(now) || session.phase !== 'em-andamento' || this.finished || !this.feedback?.satisfied) return false;
    this.completed.add(this.step.id);
    this.feedback = null;
    this.hintsRevealed = 0;
    if (this.finished) session.finish('concluido', now);
    else this.index++;
    return true;
  }
}
