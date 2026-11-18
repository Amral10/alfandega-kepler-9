import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { SqlEngine } from '../src/sql/engine';
import { MAX_ROWS } from '../src/sql/protocol';

let SQL: SqlJsStatic;
before(async () => { SQL = await initSqlJs({ locateFile: () => fileURLToPath(import.meta.resolve('sql.js/dist/sql-wasm.wasm')) }); });

function query(engine: SqlEngine, sql = 'SELECT nome FROM viajantes ORDER BY id') {
  return engine.execute(sql).tables[0].rows;
}

test('cria oito tabelas relacionadas, três viajantes e nenhum gabarito SQL', () => {
  const engine = new SqlEngine(SQL);
  const tables = query(engine, "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").flat();
  assert.deepEqual(tables, ['analises_biologicas', 'documentos', 'exames', 'restricoes', 'vereditos', 'viagens', 'viajantes', 'vistos'].sort());
});

test('executa SQL real com filtro, alias, ordenação e junção', () => {
  const engine = new SqlEngine(SQL);
  assert.deepEqual(query(engine, "SELECT v.nome AS pessoa, vistos.destino FROM viajantes v JOIN vistos ON v.id = vistos.viajante_id WHERE vistos.destino='Europa' ORDER BY pessoa DESC"), [['Suri Venn', 'Europa'], ['Lia Azevedo', 'Europa']]);
  assert.equal(query(engine, 'PRAGMA foreign_key_check').length, 0);
});

test('erro de sintaxe não modifica o checkpoint nem impede uma próxima consulta', () => {
  const engine = new SqlEngine(SQL);
  assert.throws(() => engine.execute("UPDATE viajantes SET nome='Alterado'; SELEC * FROM viajantes"));
  assert.equal(query(engine)[0][0], 'Lia Azevedo');
});

test('escrita válida é preservada em checkpoint e reinício cria banco isolado', () => {
  const engine = new SqlEngine(SQL);
  assert.equal(engine.execute("UPDATE viajantes SET nome='Lia' WHERE id=1").changes, 1);
  const restored = new SqlEngine(SQL, engine.export());
  assert.equal(query(restored)[0][0], 'Lia');
  assert.equal(query(new SqlEngine(SQL))[0][0], 'Lia Azevedo');
  assert.equal(query(engine)[0][0], 'Lia');
});

test('rejeita quebra de chave estrangeira e preserva os dados', () => {
  const engine = new SqlEngine(SQL);
  assert.throws(() => engine.execute("INSERT INTO vistos VALUES (9, 999, 'Europa', '2187-01-01')"), /FOREIGN KEY/);
  assert.equal(query(engine, 'SELECT count(*) FROM vistos')[0][0], 3);
});

test('limita linhas entre vários resultados sem impedir comandos seguintes', () => {
  const engine = new SqlEngine(SQL);
  const result = engine.execute('WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<250) SELECT x FROM n; SELECT nome FROM viajantes; UPDATE viajantes SET nome=nome WHERE id=1;');
  assert.equal(result.tables[0].rows.length, MAX_ROWS);
  assert.equal(result.tables[0].truncated, true);
  assert.equal(result.tables[1].rows.length, 0);
  assert.equal(result.tables[1].truncated, true);
  assert.equal(result.changes, 1);
});

test('rejeita scripts grandes, vazios e excesso de comandos sem aplicar alterações parciais', () => {
  const engine = new SqlEngine(SQL);
  assert.throws(() => engine.execute(' '.repeat(20001) + 'SELECT 1'), /caracteres/);
  assert.throws(() => engine.execute('-- somente comentário'), /Nenhum comando/);
  assert.throws(() => engine.execute("UPDATE viajantes SET nome='Outro';" + 'SELECT 1;'.repeat(20)), /20 comandos/);
  assert.equal(query(engine)[0][0], 'Lia Azevedo');
});

test('transações precisam encerrar no mesmo script e erros não deixam alterações', () => {
  const engine = new SqlEngine(SQL);
  assert.throws(() => engine.execute("BEGIN; UPDATE viajantes SET nome='Incompleto'"), /Finalize a transação/);
  assert.equal(query(engine)[0][0], 'Lia Azevedo');
  engine.execute("BEGIN; UPDATE viajantes SET nome='Confirmado' WHERE id=1; COMMIT;");
  assert.equal(query(engine)[0][0], 'Confirmado');
});

test('normaliza valores nulos, binários e textos longos para exibição', () => {
  const engine = new SqlEngine(SQL);
  const row = query(engine, "SELECT NULL, x'0123', printf('%05000d', 1)")[0];
  assert.equal(row[0], null);
  assert.equal(row[1], '[binário: 2 bytes]');
  assert.ok(String(row[2]).endsWith('[texto reduzido]'));
});
