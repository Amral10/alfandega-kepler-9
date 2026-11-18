import { checkDatabaseSize, validateDatabase } from './checkpoint';
import { collectStatement } from './results';
import { MediumEngine } from './medium-engine';
import type { MediumState } from '../game/medium';
import type { BankMode } from '../game/types';
import type { TutorialStepId } from '../content/tutorial';
import { validateTutorial } from '../game/tutorial-validation';
import type { Database, SqlJsStatic } from 'sql.js';
import { seedDemo } from '../content/seed';
import { MAX_ROWS, MAX_SQL_LENGTH, MAX_STATEMENTS, type QueryResult } from './protocol';

/** Cada script roda numa cópia. Somente execuções completas viram o próximo checkpoint. */
export class SqlEngine {
  private snapshot: Uint8Array = new Uint8Array();
  private medium?: MediumEngine;

  constructor(private readonly SQL: SqlJsStatic, snapshot?: Uint8Array, private readonly mode: BankMode = 'demo', mediumState?: MediumState) {
    if (mode === 'medio' || mode === 'avancado') { this.medium = new MediumEngine(SQL, snapshot, mediumState, mode); if(snapshot)validateDatabase(SQL,snapshot,mode,mediumState); return; }
    if (snapshot) {
      validateDatabase(SQL,snapshot,mode);
      this.snapshot = snapshot.slice();
    } else {
      const db = new SQL.Database();
      try { if (this.mode === 'demo') seedDemo(db); this.snapshot = db.export(); } finally { db.close(); }
    }
  }

  export(): Uint8Array { return this.medium?.export() ?? this.snapshot.slice(); }
  exportMediumState(): MediumState | undefined { return this.medium?.exportState(); }
  confirm(travelerId: number, deadline: number, now = Date.now()): MediumState {
    if (!this.medium) throw new Error('Confirmação disponível apenas nos níveis de fiscalização.');
    return this.medium.confirm(travelerId, deadline, now);
  }

  execute(sql: string, objective?: TutorialStepId): QueryResult {
    if (this.medium) return this.medium.execute(sql);
    if (!sql.trim()) throw new Error('Escreva uma consulta antes de executar.');
    if (sql.length > MAX_SQL_LENGTH) throw new Error(`Use no máximo ${MAX_SQL_LENGTH} caracteres por execução.`);
    const startedAt = performance.now();
    const db: Database = new this.SQL.Database(this.snapshot);
    const tables: QueryResult['tables'] = [];
    let statementCount = 0;
    const budget = { remaining: MAX_ROWS };
    try {
      db.run('PRAGMA foreign_keys = ON');
      const before = Number(db.exec('SELECT total_changes()')[0].values[0][0]);
      for (const statement of db.iterateStatements(sql)) {
        statementCount++;
        if (statementCount > MAX_STATEMENTS) throw new Error(`Execute até ${MAX_STATEMENTS} comandos por vez.`);
        const table = collectStatement(statement,budget);
        if(table)tables.push(table);
      }
      if (!statementCount) throw new Error('Nenhum comando encontrado. Escreva uma instrução SQL.');
      // BEGIN falha se o script deixou BEGIN ou SAVEPOINT aberto. Não aceite
      // resultados que seriam silenciosamente revertidos por export().
      try { db.run('BEGIN'); }
      catch { throw new Error('Finalize a transação com COMMIT ou ROLLBACK na mesma execução.'); }
      db.run('ROLLBACK');
      const changes = Number(db.exec('SELECT total_changes()')[0].values[0][0]) - before;
      const result: QueryResult = { tables, changes, statementCount, elapsedMs: performance.now() - startedAt };
      if (this.mode === 'facil' && objective) result.validation = validateTutorial(db, result, objective);
      const next = db.export();
      checkDatabaseSize(next);
      this.snapshot = next;
      return result;
    } finally { db.close(); }
  }
}
