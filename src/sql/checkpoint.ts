import type { SqlJsStatic } from 'sql.js';
import type { BankMode } from '../game/types';
import type { MediumState } from '../game/medium';
import { inspectionContent, isInspection } from '../content/inspection';
import { draftsFor, verdictRows } from './medium-guard';
export interface SqlCheckpoint { mode:BankMode; bytes:Uint8Array; medium?:MediumState }
export const MAX_DATABASE_BYTES=4*1024*1024;
export function checkDatabaseSize(bytes:Uint8Array):void {
  if(bytes.byteLength>MAX_DATABASE_BYTES)throw new Error('O banco excedeu 4 MB. A execução foi descartada e o estado anterior foi preservado.');
}
export function validateDatabase(SQL:SqlJsStatic,bytes:Uint8Array,mode:BankMode,state?:MediumState):void {
  checkDatabaseSize(bytes);
  const db=new SQL.Database(bytes);
  try {
    if(db.exec('PRAGMA quick_check')[0]?.values[0][0]!=='ok')throw new Error('Banco salvo corrompido.');
    if(!isInspection(mode))return;
    if(!state||state.level!==mode||state.index!==state.receipts.length)throw new Error('Estado e banco de níveis diferentes.');
    const expected=new SQL.Database();
    try {
      inspectionContent(mode).seed(expected);
      const schema="SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY name";
      if(JSON.stringify(db.exec(schema))!==JSON.stringify(expected.exec(schema)))throw new Error('Esquema oficial salvo incompatível.');
      for(const table of ['viajantes','documentos','vistos','analises_biologicas','exames','viagens','restricoes']) {
        const query=`SELECT * FROM ${table} ORDER BY id`;
        if(JSON.stringify(db.exec(query))!==JSON.stringify(expected.exec(query)))throw new Error('Dados oficiais salvos incompatíveis.');
      }
    } finally {expected.close();}
    const rows=verdictRows(db);
    const finals=rows.filter(r=>r[5]===1);
    if(finals.length!==state.receipts.length||state.receipts.some(r=>!finals.some(v=>v[1]===r.travelerId&&v[2]===(r.approved?1:0)&&v[3]===r.reason)))throw new Error('Histórico salvo inconsistente.');
    const current=inspectionContent(mode).travelers[state.index]?.id??-1;
    if(JSON.stringify(draftsFor(db,current))!==JSON.stringify(state.drafts)||rows.some(r=>r[5]===0&&r[1]!==current))throw new Error('Rascunhos salvos inconsistentes.');
  } finally {db.close();}
}
