import {before,test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import initSqlJs,{type SqlJsStatic} from 'sql.js';
import {SqlEngine} from '../src/sql/engine';
import {Session,LEVELS} from '../src/game/session';
import {TutorialProgress} from '../src/game/tutorial';
import {newCampaign,recordLevel,campaignTotals} from '../src/game/campaign';
import {SAVE_KEY,readProgress,writeProgress,clearProgress,encodeBytes,checksum,checkpointFromSave,type SaveData,type StoragePort} from '../src/game/persistence';
import type {BankMode} from '../src/game/types';
import {ADVANCED_INVESTIGATIONS} from '../src/content/advanced';
let SQL:SqlJsStatic;
before(async()=>{SQL=await initSqlJs({locateFile:()=>fileURLToPath(import.meta.resolve('sql.js/dist/sql-wasm.wasm'))});});
class MemoryStorage implements StoragePort {
 values=new Map<string,string>();blocked=false;
 getItem(k:string){return this.values.get(k)??null;}
 setItem(k:string,v:string){if(this.blocked)throw new Error('quota');this.values.set(k,v);}
 removeItem(k:string){if(this.blocked)throw new Error('blocked');this.values.delete(k);}
}
function data(mode:BankMode='facil'):SaveData {
 const e=new SqlEngine(SQL,undefined,mode);const s=new Session(mode==='demo'?600:LEVELS.find(l=>l.id===mode)!.durationSeconds);s.start(1000);
 return {savedAt:1100,campaign:newCampaign(),game:{mode,screen:'posto',session:s.serialize(),tutorial:new TutorialProgress().serialize(),checkpoint:{mode,bytes:encodeBytes(e.export()),medium:e.exportMediumState()},sql:'SELECT 1',selectedTraveler:0,inspectionHints:0,history:[],attempts:0,successes:0}};
}
function mutate(storage:MemoryStorage,fn:(value:any)=>void) {
 const envelope=JSON.parse(storage.getItem(SAVE_KEY)!);const body=JSON.parse(envelope.body);fn(body);envelope.body=JSON.stringify(body);envelope.checksum=checksum(envelope.body);storage.setItem(SAVE_KEY,JSON.stringify(envelope));
}
test('salva e restaura todos os modos com bytes e tags coerentes',()=>{
 for(const mode of ['demo','facil','medio','avancado'] as const){
  const storage=new MemoryStorage();const original=data(mode);
  assert.equal(writeProgress(storage,original),null);
  const loaded=readProgress(storage,1200);assert.equal(loaded.kind,'ok');
  if(loaded.kind!=='ok'||!loaded.data.game)throw new Error('load');
  const cp=checkpointFromSave(loaded.data.game);const restored=new SqlEngine(SQL,cp.bytes,cp.mode,cp.medium);
  assert.equal(restored.exportMediumState()?.level,mode==='medio'||mode==='avancado'?mode:undefined);
  assert.deepEqual(loaded.data.game.session,original.game!.session);
 }
});
test('restaurar não reinicia relógio e bloqueia turno expirado',()=>{
 const original=data('medio');const s=Session.restore(original.game!.session);
 assert.equal(s.remaining(121000),780);
 assert.equal(s.tick(901000),true);assert.equal(s.reason,'tempo');
 assert.equal(s.remaining(9999999),0);
 const before=new TutorialProgress();before.accept({stepId:'banco-vazio',satisfied:true,message:'ok'},s);
 assert.equal(before.advance(s,901000),false);
});
test('prefixo de tarefas, dicas e feedback são restaurados sem duplicação',()=>{
 const p=new TutorialProgress();const s=new Session(1200);s.start(0);
 p.accept({stepId:'banco-vazio',satisfied:true,message:'ok'},s);p.advance(s,1000);p.revealHint();
 const restored=TutorialProgress.restore(p.serialize());assert.equal(restored.position,1);assert.equal(restored.hintsRevealed,1);assert.equal(restored.advance(s,2000),false);
 assert.throws(()=>TutorialProgress.restore({...p.serialize(),completed:['consultar']}));
});
test('recusa versões, checksum, formato, prazo e mistura de modos inválidos',()=>{
 const cases=[
  (x:any)=>x.game.mode='avancado',
  (x:any)=>x.game.session.durationSeconds=99999,
  (x:any)=>x.game.session.startedAt=999999,
  (x:any)=>x.game.tutorial.completed=['relacionar'],
  (x:any)=>x.game.checkpoint.bytes='AAAA',
  (x:any)=>x.game.checkpoint.medium.level='avancado',
  (x:any)=>x.game.checkpoint.medium.learned=['<script>'],
 ];
 for(const fn of cases){const storage=new MemoryStorage();writeProgress(storage,data('medio'));mutate(storage,fn);assert.equal(readProgress(storage,1200).kind,'error');}
 const storage=new MemoryStorage();writeProgress(storage,data());
 const envelope=JSON.parse(storage.getItem(SAVE_KEY)!);envelope.version=99;storage.setItem(SAVE_KEY,JSON.stringify(envelope));assert.equal(readProgress(storage,1200).kind,'error');
 storage.setItem(SAVE_KEY,'{incompleto');assert.equal(readProgress(storage).kind,'error');
});
test('banco fisicamente inválido ou oficial alterado é rejeitado na inicialização',()=>{
 assert.throws(()=>new SqlEngine(SQL,new Uint8Array([1,2,3]),'demo'));
 const e=new SqlEngine(SQL,undefined,'avancado');const db=new SQL.Database(e.export());db.run("UPDATE viajantes SET nome='Outro' WHERE id=1");const changed=db.export();db.close();
 assert.throws(()=>new SqlEngine(SQL,changed,'avancado',e.exportMediumState()),/oficiais/);
});
test('restaura vereditos e objetivos avançados de forma consistente',()=>{
 const e=new SqlEngine(SQL,undefined,'avancado');e.execute(ADVANCED_INVESTIGATIONS[0].sql);e.execute("INSERT INTO vereditos(viajante_id,aprovado,motivo) VALUES(1,1,'regular')");e.confirm(1,Date.now()+60000);
 const saved=data('avancado');saved.game!.checkpoint={mode:'avancado',bytes:encodeBytes(e.export()),medium:e.exportMediumState()};
 const store=new MemoryStorage();writeProgress(store,saved);const loaded=readProgress(store,1200);
 assert.equal(loaded.kind,'ok');if(loaded.kind!=='ok')return;
 const cp=checkpointFromSave(loaded.data.game!);const resumed=new SqlEngine(SQL,cp.bytes,cp.mode,cp.medium);
 assert.equal(resumed.exportMediumState()!.index,1);assert.equal(resumed.exportMediumState()!.receipts[0].points,15);
 assert.throws(()=>resumed.execute('DELETE FROM vereditos WHERE viajante_id=1'));
});
test('falha de armazenamento preserva último salvamento e reinício pode limpá-lo',()=>{
 const s=new MemoryStorage();assert.equal(readProgress(s).kind,'none');writeProgress(s,data());const old=s.getItem(SAVE_KEY);
 s.blocked=true;assert.match(writeProgress(s,data())!,/Não foi possível/);assert.equal(s.getItem(SAVE_KEY),old);assert.equal(clearProgress(s),false);
 s.blocked=false;assert.equal(clearProgress(s),true);assert.equal(readProgress(s).kind,'none');
});
test('resumo da campanha é idempotente e separa tutorial e fiscalização',()=>{
 const c=newCampaign();const s=new Session(1200);s.start(0);s.finish('concluido',1000);
 const t=new TutorialProgress();for(let i=0;i<5;i++){const active=new Session(1200);active.start(0);t.accept({stepId:t.step.id,satisfied:true,message:'ok'},active);t.advance(active,1000);}
 recordLevel(c,'facil',s,t);recordLevel(c,'facil',s,t);
 assert.equal(c.completed.length,1);assert.equal(campaignTotals(c).points,0);assert.equal(campaignTotals(c).pending,12);
 assert.equal(newCampaign().completed.length,0);
});
test('limita colunas e tamanho de banco preservando checkpoint anterior',()=>{
 const e=new SqlEngine(SQL);const before=e.export();
 assert.throws(()=>e.execute('SELECT '+Array.from({length:33},(_,i)=>`${i} AS c${i}`).join(',')),/32 colunas/);
 assert.throws(()=>e.execute('CREATE TABLE grande(dado BLOB); INSERT INTO grande VALUES(zeroblob(5*1024*1024))'),/4 MB/);
 assert.deepEqual(e.export(),before);
});
