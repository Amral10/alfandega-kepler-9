/// <reference lib="webworker" />
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SqlEngine } from './engine';
import { explainSqlError } from './errors';
import type { WorkerRequest, WorkerResponse } from './protocol';

const scope = self as unknown as DedicatedWorkerGlobalScope;
const sqlite = initSqlJs({ locateFile: () => wasmUrl });
let engine: SqlEngine | null = null;
scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  const reply = (response: WorkerResponse) => scope.postMessage(response);
  try {
    const SQL = await sqlite;
    if (request.type === 'initialize') {
      engine = new SqlEngine(SQL, request.snapshot, request.mode, request.medium);
      reply({ id: request.id, type: 'ready', snapshot: engine.export(), medium: engine.exportMediumState() });
    } else if (request.type === 'confirm') {
      if (!engine) throw new Error('Banco ainda não inicializado.');
      const medium = engine.confirm(request.travelerId, request.deadline);
      reply({ id: request.id, type: 'confirmed', snapshot: engine.export(), medium });
    } else {
      if (!engine) throw new Error('Banco ainda não inicializado. Reinicie a sessão.');
      const result = engine.execute(request.sql, request.objective);
      reply({ id: request.id, type: 'result', result, snapshot: engine.export() });
    }
  } catch (error) {
    reply({ id: request.id, type: 'error', message: explainSqlError(error) });
  }
};
