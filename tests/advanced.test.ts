import { before,test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import initSqlJs,{type SqlJsStatic} from 'sql.js';
import { SqlEngine } from '../src/sql/engine';
import { ADVANCED_INVESTIGATIONS } from '../src/content/advanced';
import { canConfirmMedium,mediumTotals } from '../src/game/medium';
import { hasSqlFeature,sqlWords } from '../src/sql/tokens';
let SQL:SqlJsStatic;
before(async()=>{SQL=await initSqlJs({locateFile:()=>fileURLToPath(import.meta.resolve('sql.js/dist/sql-wasm.wasm'))});});
const make=()=>new SqlEngine(SQL,undefined,'avancado');

test('seis investigações e vereditos concluem o avançado com 90 pontos',()=>{
 const e=make();const reasons=['regular','exame','historico','identidade','regular','regular'];
 for(let i=0;i<6;i++){
  assert.equal(e.execute(ADVANCED_INVESTIGATIONS[i].sql).medium!.investigated,true,ADVANCED_INVESTIGATIONS[i].title);
  e.execute(`INSERT INTO vereditos(viajante_id,aprovado,motivo) VALUES(${i+1},${reasons[i]==='regular'?1:0},'${reasons[i]}')`);
  assert.equal(canConfirmMedium(e.exportMediumState()),true);
  e.confirm(i+1,Date.now()+60000);
 }
 assert.deepEqual(mediumTotals(e.exportMediumState()!),{correct:6,errors:0,pending:0,points:90});
 for(const feature of ['INNER JOIN','LEFT JOIN','GROUP BY','COUNT','DISTINCT','HAVING'])assert.ok(e.exportMediumState()!.learned.includes(feature));
});
test('ausência de exame produz NULL, não aprovação pela presença de outro exame',()=>{
 const e=make();const rows=e.execute(ADVANCED_INVESTIGATIONS[1].sql).tables[0].rows;
 assert.deepEqual(rows,[['Borin Kael','Síndrome Nebular',null]]);
});
test('duplicatas e multiplicação de linhas não inflacionam contagens de referência',()=>{
 const e=make();
 assert.deepEqual(e.execute(ADVANCED_INVESTIGATIONS[4].sql).tables[0].rows,[['Ena Ril',2]]);
 assert.deepEqual(e.execute(ADVANCED_INVESTIGATIONS[5].sql).tables[0].rows,[['Fenn Ori',2]]);
 assert.equal(e.execute("SELECT count(*) FROM viajantes v JOIN vistos vi ON vi.viajante_id=v.id LEFT JOIN viagens h ON h.viajante_id=v.id WHERE v.id=6").tables[0].rows[0][0],6);
 assert.equal(e.execute('SELECT DISTINCT destino FROM viagens WHERE viajante_id=3').tables[0].rows.length,3);
});
test('resultados simples e palavras em comentários não cumprem junção obrigatória',()=>{
 const e=make();
 e.execute("SELECT 'Ayla Nox','Europa','2187-01-01' /* INNER JOIN WHERE */");
 assert.equal(e.exportMediumState()!.investigated,false);
 e.execute(ADVANCED_INVESTIGATIONS[0].sql.replace('INNER JOIN','JOIN'));
 assert.equal(e.exportMediumState()!.investigated,true);
 assert.equal(hasSqlFeature(sqlWords('SELECT 2 AS count FROM viajantes'),'COUNT'),false);
 assert.equal(hasSqlFeature(sqlWords("SELECT 'GROUP BY', 'HAVING', 'DISTINCT'"),'GROUP BY'),false);
 assert.equal(hasSqlFeature(sqlWords('SELECT COUNT /*ok*/ (DISTINCT destino) FROM viagens'),'COUNT'),true);
});
test('avançado reaproveita proteção e restaura modo sem misturar banco médio',()=>{
 const e=make();e.execute(ADVANCED_INVESTIGATIONS[0].sql);
 e.execute("INSERT INTO vereditos(viajante_id,aprovado,motivo) VALUES(1,1,'regular')");e.confirm(1,Date.now()+60000);
 const restored=new SqlEngine(SQL,e.export(),'avancado',e.exportMediumState());
 assert.equal(restored.exportMediumState()!.index,1);
 assert.throws(()=>restored.execute('DELETE FROM vereditos WHERE viajante_id=1'),/confirmado/);
 assert.throws(()=>restored.execute("UPDATE exames SET resultado='negativo'"));
 assert.throws(()=>new SqlEngine(SQL,e.export(),'medio',e.exportMediumState()),/outro nível/);
});
