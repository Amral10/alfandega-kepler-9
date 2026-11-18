import type { SqlCheckpoint } from './checkpoint';
import type { MediumState } from '../game/medium';
import type { BankMode } from '../game/types';
import type { TutorialStepId } from '../content/tutorial';
import { QUERY_TIMEOUT_MS, type QueryResult, type WorkerRequest, type WorkerResponse } from './protocol';

type Pending = { id: number; resolve: (response: WorkerResponse) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };
export type WorkerFactory = () => Worker;

/** O checkpoint fica na interface, fora do worker que pode precisar ser encerrado. */
export class SqlClient {
  private worker: Worker | null = null;
  private pending: Pending | null = null;
  private snapshot: Uint8Array | undefined;
  private sequence = 0;
  private mode: BankMode = 'demo';
  private broken = false;
  private medium?: MediumState;
  get mediumState(): MediumState | undefined { return this.medium ? structuredClone(this.medium) : undefined; }
  busy = false;

  constructor(
    private readonly factory: WorkerFactory = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    private readonly timeout = QUERY_TIMEOUT_MS,
  ) {}

  get connected(): boolean { return this.worker !== null && !!this.snapshot && !this.broken; }

  private discard(message: string): void {
    this.worker?.terminate();
    this.worker = null;
    this.broken = true;
    if (this.pending) {
      const pending = this.pending;
      this.pending = null;
      clearTimeout(pending.timer);
      pending.reject(new Error(message));
    }
  }

  private request(request: WorkerRequest, timeout: number): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.discard(request.type === 'initialize'
        ? 'Não foi possível carregar o banco. Tente reiniciar a sessão.'
        : 'Consulta interrompida após 5 segundos. O último estado concluído foi preservado.'), timeout);
      this.pending = { id: request.id, resolve, reject, timer };
      this.worker!.postMessage(request);
    });
  }

  private async boot(snapshot?: Uint8Array): Promise<void> {
    this.worker?.terminate();
    this.broken = false;
    this.worker = this.factory();
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (!this.pending || message.id !== this.pending.id) return;
      const pending = this.pending;
      this.pending = null;
      clearTimeout(pending.timer);
      if (message.type === 'error') pending.reject(new Error(message.message));
      else pending.resolve(message);
    };
    this.worker.onerror = (event) => {
      event.preventDefault();
      this.discard('O mecanismo SQL foi interrompido. Tente novamente ou reinicie a sessão.');
    };
    try {
      const message = await this.request({ id: ++this.sequence, type: 'initialize', snapshot, mode: this.mode, medium: this.medium }, 15000);
      if (message.type !== 'ready') throw new Error('Resposta inesperada ao inicializar o banco.');
      this.snapshot = message.snapshot;
      this.medium = message.medium;
    } catch (error) {
      this.discard('Não foi possível inicializar a conexão. Reinicie a sessão.');
      throw error;
    }
  }

  async reset(mode: BankMode = 'demo'): Promise<void> {
    if (this.busy) throw new Error('Aguarde a operação atual terminar.');
    this.busy = true;
    this.mode = mode;
    this.snapshot = undefined;
    this.medium = undefined;
    try { await this.boot(); } finally { this.busy = false; }
  }

  exportCheckpoint(): SqlCheckpoint | undefined {
    return this.snapshot ? { mode:this.mode, bytes:this.snapshot.slice(), medium:this.mediumState } : undefined;
  }
  async restore(checkpoint: SqlCheckpoint): Promise<void> {
    if(this.busy)throw new Error('Aguarde a operação atual.');
    this.busy=true;this.mode=checkpoint.mode;this.snapshot=checkpoint.bytes.slice();this.medium=checkpoint.medium?structuredClone(checkpoint.medium):undefined;
    try {await this.boot(this.snapshot);} finally {this.busy=false;}
  }
  dispose(): void {
    this.discard('Sessão reiniciada.');this.snapshot=undefined;this.medium=undefined;this.busy=false;
  }

  async execute(sql: string, objective?: TutorialStepId): Promise<QueryResult> {
    if (this.busy) throw new Error('Já há uma operação em andamento.');
    if (!this.worker || !this.snapshot) throw new Error('Reinicie a sessão para conectar o banco.');
    this.busy = true;
    try {
      const response = await this.request({ id: ++this.sequence, type: 'execute', sql, objective }, this.timeout);
      if (response.type !== 'result') throw new Error('Resposta inesperada do banco.');
      this.snapshot = response.snapshot;
      this.medium = response.result.medium;
      return response.result;
    } catch (error) {
      if (this.broken && this.snapshot) {
        try { await this.boot(this.snapshot); }
        catch { throw new Error('A conexão falhou ao restaurar o banco. Reinicie a sessão.'); }
      }
      throw error;
    } finally { this.busy = false; }
  }

  async confirm(travelerId: number, deadline: number): Promise<MediumState> {
    if (this.busy || !this.connected) throw new Error('Aguarde a conexão e a operação atual.');
    this.busy = true;
    try {
      const response = await this.request({ id: ++this.sequence, type: 'confirm', travelerId, deadline }, this.timeout);
      if (response.type !== 'confirmed') throw new Error('Resposta inesperada ao confirmar.');
      this.snapshot = response.snapshot; this.medium = response.medium;
      return structuredClone(response.medium);
    } catch (error) {
      if (this.broken && this.snapshot) {
        try { await this.boot(this.snapshot); }
        catch { throw new Error('Não foi possível recuperar a confirmação. Reinicie a sessão.'); }
      }
      throw error;
    } finally { this.busy = false; }
  }

  cancel(): void {
    if (this.busy && this.pending) this.discard('Consulta cancelada. O último estado concluído foi preservado.');
  }
}
