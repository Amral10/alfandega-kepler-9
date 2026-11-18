import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { SqlEngine } from '../src/sql/engine';
import { INVESTIGATIONS, draftExample } from '../src/content/medium';
import { canConfirmMedium, mediumTotals } from '../src/game/medium';
import { sqlWords, hasSqlFeature } from '../src/sql/tokens';
let SQL: SqlJsStatic;
before(async () => { SQL = await initSqlJs({ locateFile: () => fileURLToPath(import.meta.resolve('sql.js/dist/sql-wasm.wasm')) }); });
const make = () => new SqlEngine(SQL, undefined, 'medio');
const insert = (id: number, approved = 1, reason = 'regular') => `INSERT INTO vereditos(viajante_id,aprovado,motivo) VALUES(${id},${approved},'${reason}');`;
function readyFirst(e: SqlEngine) {
  e.execute(INVESTIGATIONS[0].sql);
  for (let i = 0; i < 4; i++) {
    const s = e.exportMediumState()!;
    e.execute(draftExample(1, s.practice, s.drafts[0]));
  }
  assert.equal(canConfirmMedium(e.exportMediumState()), true);
}

test('banco atualizado contém seis viajantes e oito tabelas, sem gabarito SQL', () => {
  const e = make();
  assert.equal(e.execute('SELECT count(*) FROM viajantes').tables[0].rows[0][0], 6);
  assert.equal(e.execute("SELECT count(*) FROM sqlite_schema WHERE type='table'").tables[0].rows[0][0], 8);
  assert.equal(e.exportMediumState()!.index, 0);
  assert.equal(e.exportMediumState()!.drafts.length, 0);
});

test('prática exige inserir, corrigir com mudança, excluir e reinserir antes de confirmar', () => {
  const e = make();
  assert.throws(() => e.confirm(1, Date.now() + 60000), /Conclua/);
  e.execute(INVESTIGATIONS[0].sql);
  e.execute(insert(1, 0, 'identidade'));
  assert.equal(e.exportMediumState()!.practice, 'update');
  e.execute("UPDATE vereditos SET aprovado=0,motivo='identidade' WHERE viajante_id=1");
  assert.equal(e.exportMediumState()!.practice, 'update');
  e.execute("UPDATE vereditos SET aprovado=1,motivo='regular' WHERE viajante_id=1");
  assert.equal(e.exportMediumState()!.practice, 'delete');
  e.execute('DELETE FROM vereditos WHERE viajante_id=1');
  assert.equal(e.exportMediumState()!.practice, 'final-insert');
  e.execute(insert(1));
  assert.equal(canConfirmMedium(e.exportMediumState()), true);
});

test('confirmação é idempotente, bloqueia passado e confirma só o viajante atual', () => {
  const e = make(); readyFirst(e);
  const deadline = Date.now() + 60000;
  const state = e.confirm(1, deadline);
  assert.equal(state.index, 1); assert.equal(state.receipts.length, 1);
  assert.equal(state.receipts[0].points, 15);
  assert.equal(e.confirm(1, deadline).index, 1);
  assert.throws(() => e.confirm(3, deadline), /atendimento/);
  assert.throws(() => e.execute("UPDATE vereditos SET motivo='visto' WHERE viajante_id=1"), /protegido/);
  assert.throws(() => e.execute('DELETE FROM vereditos WHERE viajante_id=1'), /confirmado/);
  assert.equal(e.execute('SELECT confirmado FROM vereditos WHERE viajante_id=1').tables[0].rows[0][0], 1);
});

test('não confirma duplicados, rascunho ausente ou turno expirado', () => {
  const e = make(); readyFirst(e);
  e.execute(insert(1));
  assert.equal(canConfirmMedium(e.exportMediumState()), false);
  assert.throws(() => e.confirm(1, Date.now() + 60000), /exatamente/);
  e.execute('DELETE FROM vereditos WHERE id=(SELECT max(id) FROM vereditos)');
  assert.equal(canConfirmMedium(e.exportMediumState()), true);
  assert.throws(() => e.confirm(1, 1000, 1000), /tempo/);
  e.execute('DELETE FROM vereditos WHERE viajante_id=1');
  assert.equal(canConfirmMedium(e.exportMediumState()), false);
});

test('comentários, strings e identificadores não substituem recursos SQL', () => {
  const e = make();
  e.execute("SELECT nome,destino FROM viajantes WHERE id=1 /* AS */");
  assert.equal(e.exportMediumState()!.investigated, false);
  e.execute('SELECT nome AS pessoa,destino FROM viajantes WHERE id=1');
  assert.equal(e.exportMediumState()!.investigated, true);
  assert.equal(hasSqlFeature(sqlWords("SELECT 'ORDER BY' AS x -- LIMIT\nFROM viajantes"), 'ORDER BY'), false);
  assert.equal(hasSqlFeature(sqlWords('SELECT "AND", [OR], `NOT` FROM viajantes'), 'AND'), false);
  assert.equal(hasSqlFeature(sqlWords('SELECT * FROM viajantes ORDER /*ok*/ BY id LIMIT 1'), 'ORDER BY'), true);
});

test('percorre seis atendimentos, avalia evidências e cobre todos os recursos previstos', () => {
  const e = make(); readyFirst(e);
  e.confirm(1, Date.now() + 60000);
  const reasons = ['regular', 'visto', 'biologia', 'identidade', 'exame', 'regular'];
  for (let index = 1; index < 6; index++) {
    e.execute(INVESTIGATIONS[index].sql);
    assert.equal(e.exportMediumState()!.investigated, true, INVESTIGATIONS[index].title);
    e.execute(insert(index + 1, reasons[index] === 'regular' ? 1 : 0, reasons[index]));
    e.confirm(index + 1, Date.now() + 60000);
  }
  const state = e.exportMediumState()!;
  assert.deepEqual(mediumTotals(state), { correct: 6, errors: 0, pending: 0, points: 90 });
  assert.deepEqual(state.learned.sort(), ['SELECT','WHERE','AS','AND','OR','NOT','ORDER BY','LIMIT','INSERT INTO','UPDATE','DELETE'].sort());
  assert.ok(state.receipts.every(r => r.evidence.length >= 2));
  assert.throws(() => e.execute('SELECT 1'), /fila/);
});

test('veredito errado é permitido, explicado e separado dos pendentes na pontuação', () => {
  const e = make(); readyFirst(e);
  e.execute("UPDATE vereditos SET aprovado=0,motivo='visto' WHERE viajante_id=1");
  const state = e.confirm(1, Date.now() + 60000);
  assert.equal(state.receipts[0].correct, false);
  assert.equal(state.receipts[0].expectedApproved, true);
  assert.deepEqual(mediumTotals(state), { correct: 0, errors: 1, pending: 5, points: 0 });
});

test('snapshot e estado restauram a fila sem duplicar pontos ou perder a prática', () => {
  const e = make(); readyFirst(e); e.confirm(1, Date.now() + 60000);
  const restored = new SqlEngine(SQL, e.export(), 'medio', e.exportMediumState());
  assert.equal(restored.exportMediumState()!.index, 1);
  assert.equal(restored.confirm(1, Date.now() + 60000).receipts.length, 1);
  assert.throws(() => new SqlEngine(SQL, e.export(), 'medio'), /estado do turno/);
  assert.equal(make().exportMediumState()!.receipts.length, 0);
});

const attacks = [
  "UPDATE viajantes SET nome='Alterado' WHERE id=1", 'DELETE FROM viajantes',
  "INSERT INTO viajantes VALUES(7,'X','X','X','X','X')", 'DROP TABLE vistos',
  'ALTER TABLE viajantes RENAME TO outro', "CREATE TRIGGER fraude AFTER INSERT ON vereditos BEGIN UPDATE viajantes SET nome='X'; END",
  'PRAGMA query_only=OFF; UPDATE viajantes SET nome=\'X\'',
  'EXPLAIN PRAGMA query_only=OFF', 'BEGIN; DELETE FROM vereditos; COMMIT;',
  "ATTACH DATABASE ':memory:' AS ataque", 'VACUUM', 'PRAGMA writable_schema=ON',
  "WITH x AS (SELECT 1) UPDATE viajantes SET nome='X'", 'SAVEPOINT x',
  'UPDATE vereditos SET confirmado=1', 'UPDATE vereditos SET viajante_id=2',
  "INSERT INTO vereditos(viajante_id,aprovado,motivo,confirmado) VALUES(1,1,'regular',1)",
  "INSERT INTO vereditos(viajante_id,aprovado,motivo) VALUES(2,1,'regular')",
];
for (const attack of attacks) test(`proteção SQL: ${attack.slice(0, 65)}`, () => {
  const e = make(); e.execute(insert(1));
  const before = e.export(); const state = e.exportMediumState();
  assert.throws(() => e.execute(attack));
  assert.deepEqual(e.export(), before);
  assert.deepEqual(e.exportMediumState(), state);
});

test('scripts mistos são atômicos e REPLACE não remove decisões já confirmadas', () => {
  const e = make(); readyFirst(e); e.confirm(1, Date.now() + 60000);
  const before = e.export();
  assert.throws(() => e.execute(insert(2) + "UPDATE vistos SET validade='9999-01-01';"));
  assert.deepEqual(e.export(), before);
  assert.throws(() => e.execute("INSERT OR REPLACE INTO vereditos(id,viajante_id,aprovado,motivo) VALUES(1,2,1,'regular')"));
  assert.throws(() => e.execute("REPLACE INTO vereditos(id,viajante_id,aprovado,motivo) VALUES(1,2,1,'regular')"));
  assert.deepEqual(e.export(), before);
});

test('aceita consultas equivalentes e mantém objetivos separados dos vereditos', () => {
  const e = make();
  e.execute('select destino, nome as pessoa from VIAJANTES where 1=id;');
  assert.equal(e.exportMediumState()!.investigated, true);
  assert.equal(e.exportMediumState()!.receipts.length, 0);
  assert.equal(e.exportMediumState()!.practice, 'insert');
});

test('WITH somente leitura funciona e subconsultas de escrita não acessam cadastros', () => {
  const e = make();
  assert.equal(e.execute('WITH x AS (SELECT nome FROM viajantes) SELECT * FROM x').tables[0].rows.length, 6);
  assert.throws(() => e.execute("INSERT INTO vereditos(viajante_id,aprovado,motivo) SELECT id,1,'regular' FROM viajantes WHERE id=1"), /somente leitura/);
  assert.equal(e.exportMediumState()!.drafts.length, 0);
});

test('UPSERT, nomes entre aspas e mudança de id não contornam a proteção', () => {
  const e = make(); readyFirst(e); e.confirm(1, Date.now() + 60000);
  const before = e.export();
  for (const sql of [
    'UPDATE "viajantes" AS v SET nome=nome WHERE id=1',
    "INSERT INTO vereditos(id,viajante_id,aprovado,motivo) VALUES(1,2,1,'regular') ON CONFLICT(id) DO UPDATE SET motivo='visto'",
    "INSERT OR REPLACE INTO vereditos(id,viajante_id,aprovado,motivo) VALUES(1,2,1,'regular')",
    'UPDATE vereditos SET id=NULL WHERE viajante_id=1',
  ]) { assert.throws(() => e.execute(sql)); assert.deepEqual(e.export(), before); }
});

test('pontua decisão e motivo de forma independente, mantendo erros parciais separados', () => {
  for (const [approved, reason, points] of [[0,'regular',5],[1,'visto',10]] as const) {
    const e = make(); readyFirst(e);
    e.execute(`UPDATE vereditos SET aprovado=${approved},motivo='${reason}' WHERE viajante_id=1`);
    const state = e.confirm(1, Date.now() + 60000);
    assert.equal(state.receipts[0].points, points);
    assert.equal(mediumTotals(state).errors, 1);
    assert.equal(mediumTotals(state).pending, 5);
  }
});
