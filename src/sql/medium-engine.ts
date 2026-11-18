import { checkDatabaseSize } from './checkpoint';
import type { SqlJsStatic, Statement } from 'sql.js';
import { inspectionContent, type InspectionLevel } from '../content/inspection';
import { assessAdvanced } from '../game/advanced-evaluation';
import { canConfirmMedium, createMediumState, type MediumState } from '../game/medium';
import { assessMedium } from '../game/medium-evaluation';
import { MAX_ROWS, MAX_SQL_LENGTH, MAX_STATEMENTS, type Cell, type QueryResult } from './protocol';
import { collectStatement, equivalentResult } from './results';
import { draftsFor, publishVerdicts, verdictWorkspace } from './medium-guard';
import { hasSqlFeature, sqlWords } from './tokens';

export class MediumEngine {
  private snapshot: Uint8Array;
  private state: MediumState;
  constructor(private readonly SQL: SqlJsStatic, snapshot?: Uint8Array, state?: MediumState, private readonly level: InspectionLevel = 'medio') {
    if (state && state.level !== level) throw new Error('O estado salvo pertence a outro nível.');
    if (snapshot && !state) throw new Error('O checkpoint de fiscalização precisa do estado do turno.');
    this.state = structuredClone(state ?? createMediumState(level));
    if (snapshot) this.snapshot = snapshot.slice();
    else {
      const db = new SQL.Database();
      try { inspectionContent(level).seed(db); this.snapshot = db.export(); } finally { db.close(); }
    }
  }
  export(): Uint8Array { return this.snapshot.slice(); }
  exportState(): MediumState { return structuredClone(this.state); }

  execute(sql: string): QueryResult {
    if (!sql.trim()) throw new Error('Escreva uma consulta antes de executar.');
    if (sql.length > MAX_SQL_LENGTH) throw new Error(`Use no máximo ${MAX_SQL_LENGTH} caracteres por execução.`);
    const current = inspectionContent(this.level).travelers[this.state.index];
    if (!current) throw new Error('A fila já foi encerrada.');
    const start = performance.now();
    const reader = new this.SQL.Database(this.snapshot);
    const writer = verdictWorkspace(this.SQL, reader, current.id);
    const state = this.exportState();
    const beforeDrafts = draftsFor(reader, current.id);
    const budget = { remaining: MAX_ROWS };
    const tables: QueryResult['tables'] = [];
    const writes = new Set<string>();
    const task = inspectionContent(this.level).tasks[state.index];
    let changes = 0;
    let statementCount = 0;
    try {
      reader.run('PRAGMA foreign_keys = ON; PRAGMA query_only = ON');
      for (const statement of reader.iterateStatements(sql)) {
        if (++statementCount > MAX_STATEMENTS) throw new Error(`Execute até ${MAX_STATEMENTS} comandos por vez.`);
        const source = statement.getSQL();
        const words = sqlWords(source);
        const kind = words[0];
        if (['SELECT', 'WITH'].includes(kind)) {
          // SQLite impõe somente leitura, inclusive para WITH que tenta escrever.
          const table = collectStatement(statement, budget);
          if (table) {
            tables.push(table);
            if (!state.investigated) {
              const expected = (reader.exec(task.sql)[0]?.values ?? []) as Cell[][];
              if (equivalentResult(table, expected) && task.required.every(feature => hasSqlFeature(words, feature))) {
                state.investigated = true;
                state.learned = [...new Set([...state.learned, ...task.required])];
              }
            }
          }
        } else if (['INSERT', 'UPDATE', 'DELETE'].includes(kind)) {
          // A instrução inteira roda em outro banco: não há cadastros oficiais nele.
          let writeStatement: Statement;
          try { writeStatement = writer.prepare(source); }
          catch (error) {
            if (error instanceof Error && error.message.includes('no such table:')) throw new Error('Cadastros oficiais são somente leitura. Escreva apenas em vereditos; subconsultas de escrita também só podem ler vereditos. Consulte documentos e outros cadastros em um SELECT separado.');
            throw error;
          }
          try {
            const table = collectStatement(writeStatement, budget);
            if (table) tables.push(table);
          } finally { writeStatement.free(); }
          const affected = writer.getRowsModified();
          changes += affected;
          if (affected > 0) writes.add(kind);
          publishVerdicts(reader, writer, current.id);
        } else {
          throw new Error('Neste nível use SELECT (ou WITH de leitura) e INSERT INTO, UPDATE ou DELETE em vereditos. Comandos de esquema, PRAGMA e controle de transação não são permitidos; cada execução já é atômica.');
        }
      }
      if (!statementCount) throw new Error('Nenhum comando SQL encontrado.');
      state.drafts = draftsFor(reader, current.id);
      const oneDraft = state.drafts.length === 1;
      const stage = state.practice;
      if ((stage === 'insert' || stage === 'final-insert') && writes.has('INSERT') && oneDraft) {
        state.practice = this.level === 'medio' && state.index === 0 && stage === 'insert' ? 'update' : 'ready';
        state.learned = [...new Set([...state.learned, 'INSERT INTO'])];
      } else if (stage === 'update' && writes.has('UPDATE') && beforeDrafts.length === 1 && oneDraft &&
        (beforeDrafts[0].aprovado !== state.drafts[0].aprovado || beforeDrafts[0].motivo !== state.drafts[0].motivo)) {
        state.practice = 'delete'; state.learned = [...new Set([...state.learned, 'UPDATE'])];
      } else if (stage === 'delete' && writes.has('DELETE') && beforeDrafts.length > 0 && !state.drafts.length) {
        state.practice = 'final-insert'; state.learned = [...new Set([...state.learned, 'DELETE'])];
      }
      state.feedback = !state.investigated
        ? `Investigue os dados pedidos usando ${task.required.join(', ')} na mesma consulta. Resultados incompletos, comentários e palavras dentro de textos não cumprem o objetivo.`
        : canConfirmMedium(state) ? 'Investigação e rascunho prontos. Confira decisão e motivo antes de confirmar.'
        : `Investigação concluída. ${state.drafts.length > 1 ? 'Há rascunhos duplicados: mantenha apenas um. ' : ''}Conclua a prática de vereditos indicada acima.`;
      const next=reader.export();checkDatabaseSize(next);
      this.snapshot = next;
      this.state = state;
      return { tables, changes, statementCount, elapsedMs: performance.now() - start, medium: this.exportState() };
    } finally { reader.close(); writer.close(); }
  }

  confirm(travelerId: number, deadline: number, now = Date.now()): MediumState {
    // Idempotência: repetir a confirmação antiga não confirma o próximo viajante.
    if (this.state.receipts.some(r => r.travelerId === travelerId)) return this.exportState();
    if (!Number.isFinite(deadline) || now >= deadline) throw new Error('O tempo do turno terminou. Não é possível confirmar.');
    const current = inspectionContent(this.level).travelers[this.state.index];
    if (!current || current.id !== travelerId) throw new Error('Esse viajante não está em atendimento.');
    if (!canConfirmMedium(this.state)) throw new Error('Conclua a investigação e a prática e mantenha exatamente um rascunho antes de confirmar.');
    const db = new this.SQL.Database(this.snapshot);
    try {
      db.run('PRAGMA foreign_keys = ON');
      const drafts = draftsFor(db, travelerId);
      if (drafts.length !== 1) throw new Error('É necessário exatamente um rascunho válido.');
      const receipt = (this.level === 'avancado' ? assessAdvanced : assessMedium)(db, this.state.index, drafts[0]);
      db.run('UPDATE vereditos SET confirmado=1 WHERE id=? AND viajante_id=? AND confirmado=0', [drafts[0].id, travelerId]);
      const state = this.exportState();
      state.receipts.push(receipt); state.index++;
      state.investigated = false; state.practice = 'insert'; state.drafts = [];
      state.feedback = 'Novo atendimento: investigue os registros e insira seu veredito por SQL.';
      this.snapshot = db.export(); this.state = state;
      return this.exportState();
    } finally { db.close(); }
  }
}
