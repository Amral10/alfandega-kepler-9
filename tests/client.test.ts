import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { SqlClient } from '../src/sql/client';
import { SqlEngine } from '../src/sql/engine';
import type { WorkerRequest, WorkerResponse } from '../src/sql/protocol';

let SQL: SqlJsStatic;
before(async () => { SQL = await initSqlJs({ locateFile: () => fileURLToPath(import.meta.resolve('sql.js/dist/sql-wasm.wasm')) }); });

// Simula apenas o transporte; a execução e os checkpoints usam SQLite real.
class TestWorker {
  onmessage: ((event: { data: WorkerResponse }) => void) | null = null;
  onerror: unknown;
  terminated = false;
  engine: SqlEngine | null = null;
  terminate() { this.terminated = true; }
  postMessage(request: WorkerRequest) {
    queueMicrotask(() => {
      if (this.terminated) return;
      let response: WorkerResponse;
      try {
        if (request.type === 'initialize') {
          this.engine = new SqlEngine(SQL, request.snapshot, request.mode, request.medium);
          response = { id: request.id, type: 'ready', snapshot: this.engine.export(), medium: this.engine.exportMediumState() };
        } else if (request.type === 'confirm') {
          const medium = this.engine!.confirm(request.travelerId, request.deadline);
          response = { id: request.id, type: 'confirmed', snapshot: this.engine!.export(), medium };
        } else {
          if (request.sql === '--travamento') return;
          response = { id: request.id, type: 'result', result: this.engine!.execute(request.sql, request.objective), snapshot: this.engine!.export() };
        }
      } catch (error) { response = { id: request.id, type: 'error', message: (error as Error).message }; }
      this.onmessage?.({ data: response });
    });
  }
}
function setup() {
  const workers: TestWorker[] = [];
  const client = new SqlClient(() => { const worker = new TestWorker(); workers.push(worker); return worker as unknown as Worker; }, 30);
  return { client, workers };
}

test('cancelar recria o worker e restaura a última alteração concluída', async () => {
  const { client, workers } = setup();
  await client.reset();
  await client.execute("UPDATE viajantes SET nome='Checkpoint' WHERE id=1");
  const pending = client.execute('--travamento');
  client.cancel();
  await assert.rejects(pending, /cancelada/);
  assert.equal(client.busy, false);
  assert.equal(workers.length, 2);
  assert.equal(workers[0].terminated, true);
  const result = await client.execute('SELECT nome FROM viajantes WHERE id=1');
  assert.equal(result.tables[0].rows[0][0], 'Checkpoint');
});

test('timeout restaura banco e permite a próxima consulta', async () => {
  const { client } = setup();
  await client.reset();
  await assert.rejects(client.execute('--travamento'), /interrompida/);
  const result = await client.execute('SELECT count(*) FROM viajantes');
  assert.equal(result.tables[0].rows[0][0], 3);
});

test('erro SQL preserva o worker e reset restaura o cenário original', async () => {
  const { client, workers } = setup();
  await client.reset();
  await assert.rejects(client.execute('SELEC 1'), /syntax/);
  assert.equal(workers.length, 1);
  await client.execute("UPDATE viajantes SET nome='Alterado' WHERE id=1");
  await client.reset();
  assert.equal((await client.execute('SELECT nome FROM viajantes WHERE id=1')).tables[0].rows[0][0], 'Lia Azevedo');
});

test('rejeita concorrência e não permite executar sem banco inicializado', async () => {
  const { client } = setup();
  await assert.rejects(client.execute('SELECT 1'), /Reinicie/);
  await client.reset();
  const pending = client.execute('--travamento');
  await assert.rejects(client.execute('SELECT 1'), /andamento/);
  await assert.rejects(client.reset(), /Aguarde/);
  client.cancel();
  await assert.rejects(pending, /cancelada/);
});

test('banco fácil continua vazio após timeout e não se mistura com a demo', async () => {
  const { client } = setup();
  await client.reset('facil');
  const result = await client.execute("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'", 'banco-vazio');
  assert.equal(result.validation?.satisfied, true);
  await assert.rejects(client.execute('--travamento'), /interrompida/);
  assert.equal((await client.execute("SELECT count(*) FROM sqlite_schema WHERE type='table'")).tables[0].rows[0][0], 0);
  await client.reset('demo');
  assert.equal((await client.execute('SELECT count(*) FROM viajantes')).tables[0].rows[0][0], 3);
  await client.reset('facil');
  assert.equal((await client.execute("SELECT count(*) FROM sqlite_schema WHERE type='table'")).tables[0].rows[0][0], 0);
});

test('recupera fila, prática e pontos do médio e permite confirmação idempotente', async () => {
  const { client } = setup();
  await client.reset('medio');
  await client.execute('SELECT nome AS pessoa,destino FROM viajantes WHERE id=1');
  await client.execute("INSERT INTO vereditos(viajante_id,aprovado,motivo) VALUES(1,0,'identidade')");
  await client.execute("UPDATE vereditos SET aprovado=1,motivo='regular' WHERE viajante_id=1");
  await client.execute('DELETE FROM vereditos WHERE viajante_id=1');
  await client.execute("INSERT INTO vereditos(viajante_id,aprovado,motivo) VALUES(1,1,'regular')");
  const deadline = Date.now() + 60000;
  await client.confirm(1, deadline);
  await assert.rejects(client.execute('--travamento'), /interrompida/);
  assert.equal(client.mediumState!.index, 1);
  assert.equal(client.mediumState!.receipts[0].points, 15);
  assert.equal((await client.confirm(1, deadline)).receipts.length, 1);
  await assert.rejects(client.execute("UPDATE vereditos SET confirmado=0 WHERE viajante_id=1"), /protegido/);
  await client.reset('medio');
  assert.equal(client.mediumState!.index, 0);
  assert.equal(client.mediumState!.receipts.length, 0);
  await client.reset('facil');
  assert.equal(client.mediumState, undefined);
});
