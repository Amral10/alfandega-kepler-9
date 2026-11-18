import type { Database, SqlJsStatic, SqlValue } from 'sql.js';
import type { Verdict } from '../game/types';

export const VERDICT_COLUMNS = 'id, viajante_id, aprovado, motivo, registrado_em, confirmado';
export function verdictRows(db: Database): SqlValue[][] { return db.exec(`SELECT ${VERDICT_COLUMNS} FROM vereditos ORDER BY id`)[0]?.values ?? []; }
export function draftsFor(db: Database, id: number): Verdict[] {
  return verdictRows(db).filter(row => row[1] === id && row[5] === 0).map(row => ({ id: Number(row[0]), viajante_id: Number(row[1]), aprovado: Number(row[2]) as 0 | 1, motivo: String(row[3]) as Verdict['motivo'], registrado_em: String(row[4]), confirmado: 0 }));
}
export function copyVerdicts(target: Database, rows: SqlValue[][]): void {
  target.run('DELETE FROM vereditos');
  rows.forEach(row => target.run(`INSERT INTO vereditos (${VERDICT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)`, row));
}

/** O banco de escrita nunca recebe os cadastros oficiais nem se conecta ao banco de consulta. */
export function verdictWorkspace(SQL: SqlJsStatic, source: Database, currentId: number): Database {
  const writer = new SQL.Database();
  writer.run(`CREATE TABLE vereditos (
    id INTEGER PRIMARY KEY, viajante_id INTEGER NOT NULL,
    aprovado INTEGER NOT NULL CHECK(aprovado IN (0,1)),
    motivo TEXT NOT NULL CHECK(motivo IN ('regular','identidade','visto','biologia','exame','historico')),
    registrado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmado INTEGER NOT NULL DEFAULT 0 CHECK(confirmado IN (0,1))
  ); PRAGMA recursive_triggers = ON;`);
  copyVerdicts(writer, verdictRows(source));
  writer.run(`
    CREATE TRIGGER proteger_insercao BEFORE INSERT ON vereditos
    WHEN NEW.viajante_id IS NOT ${currentId} OR NEW.confirmado IS NOT 0
    BEGIN SELECT RAISE(ABORT, 'Somente rascunhos do viajante atual podem ser inseridos.'); END;
    CREATE TRIGGER proteger_alteracao BEFORE UPDATE ON vereditos
    WHEN OLD.confirmado IS NOT 0 OR OLD.viajante_id IS NOT ${currentId} OR NEW.viajante_id IS NOT ${currentId}
      OR NEW.confirmado IS NOT 0 OR NEW.id IS NOT OLD.id
    BEGIN SELECT RAISE(ABORT, 'Veredito protegido: altere apenas o rascunho do viajante atual, sem trocar seu id.'); END;
    CREATE TRIGGER proteger_exclusao BEFORE DELETE ON vereditos
    WHEN OLD.confirmado IS NOT 0 OR OLD.viajante_id IS NOT ${currentId}
    BEGIN SELECT RAISE(ABORT, 'Veredito confirmado ou de outro viajante não pode ser excluído.'); END;
  `);
  return writer;
}

export function publishVerdicts(reader: Database, writer: Database, currentId: number): void {
  const before = verdictRows(reader);
  const after = verdictRows(writer);
  const protectedRows = (rows: SqlValue[][]) => rows.filter(r => r[5] !== 0 || r[1] !== currentId);
  if (JSON.stringify(protectedRows(before)) !== JSON.stringify(protectedRows(after))) throw new Error('Uma decisão protegida não pode ser alterada.');
  if (after.some(r => r[5] !== 1 && (r[5] !== 0 || r[1] !== currentId))) throw new Error('Rascunho fora do atendimento atual.');
  reader.run('PRAGMA query_only = OFF');
  try { copyVerdicts(reader, after); }
  finally { reader.run('PRAGMA query_only = ON'); }
}
