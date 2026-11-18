import type { BankMode } from './types';
import { Session, LEVELS, DEMO_DURATION_SECONDS } from './session';
import { TutorialProgress } from './tutorial';
import type { CampaignProgress } from './campaign';
import type { MediumState } from './medium';
import type { SqlCheckpoint } from '../sql/checkpoint';
import { inspectionContent, isInspection } from '../content/inspection';
export const SAVE_KEY='kepler9.progress';
export const SAVE_VERSION=1;
export const CONTENT_VERSION='1.0';
export interface StoragePort {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
export interface SavedGame {
 mode:BankMode; screen:'inicio'|'niveis'|'campanha'|'posto'|'resultado';
 session:ReturnType<Session['serialize']>; tutorial:ReturnType<TutorialProgress['serialize']>;
 checkpoint:{mode:BankMode;bytes:string;medium?:MediumState};
 sql:string;selectedTraveler:number;inspectionHints:number;
 history:{sql:string;success:boolean;detail:string}[]; attempts:number;successes:number;
}
export interface SaveData {campaign:CampaignProgress;game:SavedGame|null;savedAt:number}
export type LoadResult={kind:'none'}|{kind:'ok';data:SaveData}|{kind:'error';message:string};
const modes=['demo','facil','medio','avancado'];
const reasons=['regular','identidade','visto','biologia','exame','historico'];
const features=['SELECT','WHERE','AS','AND','OR','NOT','ORDER BY','LIMIT','INSERT INTO','UPDATE','DELETE','JOIN','INNER JOIN','LEFT JOIN','GROUP BY','COUNT','DISTINCT','HAVING'];
const phases=['em-andamento','encerrada'];
const levelIds=['facil','medio','avancado'];
function object(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function integer(value:unknown,min=0,max=Number.MAX_SAFE_INTEGER):value is number{return Number.isSafeInteger(value)&&Number(value)>=min&&Number(value)<=max;}
function text(value:unknown,max=20000):value is string{return typeof value==='string'&&value.length<=max;}
function assert(condition:unknown):asserts condition {if(!condition)throw new Error('Formato de salvamento inválido.');}
function list(value:unknown,allowed:readonly string[],max:number):value is string[]{return Array.isArray(value)&&value.length<=max&&value.every(v=>typeof v==='string'&&allowed.includes(v))&&new Set(value).size===value.length;}
export function checksum(text:string):string {let n=2166136261;for(let i=0;i<text.length;i++){n^=text.charCodeAt(i);n=Math.imul(n,16777619);}return (n>>>0).toString(16);}
export function encodeBytes(bytes:Uint8Array):string {let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(raw);}
export function decodeBytes(value:string):Uint8Array {
 assert(value.length<=6*1024*1024&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value));
 return Uint8Array.from(atob(value),c=>c.charCodeAt(0));
}
function validateInspection(value:unknown,mode:BankMode):void {
 assert(object(value)&&value.level===mode&&integer(value.index,0,6)&&typeof value.investigated==='boolean'&&['insert','update','delete','final-insert','ready'].includes(String(value.practice))&&text(value.feedback,2000));
 assert(list(value.learned,features,features.length)&&Array.isArray(value.receipts)&&value.receipts.length===value.index&&Array.isArray(value.drafts)&&value.drafts.length<=10000);
 const travelers=inspectionContent(mode).travelers;
 value.receipts.forEach((r:unknown,i:number)=>{
  assert(object(r)&&r.travelerId===travelers[i].id&&text(r.name,200)&&typeof r.approved==='boolean'&&typeof r.expectedApproved==='boolean'&&reasons.includes(String(r.reason))&&reasons.includes(String(r.expectedReason)));
  assert(typeof r.correct==='boolean'&&typeof r.decisionCorrect==='boolean'&&typeof r.reasonCorrect==='boolean'&&r.correct===(r.decisionCorrect&&r.reasonCorrect)&&r.points===(r.decisionCorrect?10:0)+(r.reasonCorrect?5:0)&&Array.isArray(r.evidence)&&r.evidence.length<=10&&r.evidence.every(e=>text(e,1000)));
 });
 value.drafts.forEach((d:unknown)=>assert(object(d)&&integer(d.id,Number.MIN_SAFE_INTEGER)&&d.viajante_id===travelers[Number(value.index)]?.id&&(d.aprovado===0||d.aprovado===1)&&reasons.includes(String(d.motivo))&&d.confirmado===0&&text(d.registrado_em,100)));
}
export function validateSaveData(value:unknown,now=Date.now()):asserts value is SaveData {
 assert(object(value)&&integer(value.savedAt)&&value.savedAt<=now+5000&&object(value.campaign));
 const campaign=value.campaign;
 assert(list(campaign.completed,levelIds,3)&&object(campaign.results));
 for(const [id,r]of Object.entries(campaign.results)){
  assert(levelIds.includes(id)&&object(r)&&typeof r.completed==='boolean'&&integer(r.points,0,90)&&integer(r.correct,0,6)&&integer(r.errors,0,6)&&integer(r.pending,0,6)&&integer(r.endedAt)&&['manual','tempo','concluido'].includes(String(r.reason))&&Array.isArray(r.objectives)&&r.objectives.length<=20&&r.objectives.every(o=>text(o,100)));
  if(id!=='facil')assert(Number(r.correct)+Number(r.errors)+Number(r.pending)===6);
 }
 for(const id of campaign.completed)assert(Object.hasOwn(campaign.results,id));
 if(value.game===null)return;
 const g=value.game;assert(object(g)&&modes.includes(String(g.mode))&&['inicio','niveis','campanha','posto','resultado'].includes(String(g.screen))&&object(g.session)&&object(g.checkpoint));
 const mode=g.mode as BankMode;const s=g.session;
 const duration=mode==='demo'?DEMO_DURATION_SECONDS:LEVELS.find(l=>l.id===mode)!.durationSeconds;
 assert(s.durationSeconds===duration&&phases.includes(String(s.phase))&&integer(s.startedAt)&&Number(s.startedAt)<=Number(value.savedAt));
 if(s.phase==='em-andamento')assert(s.endedAt===null&&s.reason===null);
 else assert(integer(s.endedAt,Number(s.startedAt))&&Number(s.endedAt)<=Number(value.savedAt)&&['manual','tempo','concluido'].includes(String(s.reason)));
 assert(object(g.tutorial)&&Array.isArray(g.tutorial.completed));
 TutorialProgress.restore(g.tutorial as unknown as ReturnType<TutorialProgress['serialize']>);
 assert(g.checkpoint.mode===mode&&text(g.checkpoint.bytes,6*1024*1024));
 const bytes=decodeBytes(g.checkpoint.bytes);
 assert((mode==='facil'&&bytes.length===0)||new TextDecoder().decode(bytes.subarray(0,16))==='SQLite format 3\0');
 if(isInspection(mode))validateInspection(g.checkpoint.medium,mode);else assert(g.checkpoint.medium===undefined);
 assert(text(g.sql)&&integer(g.selectedTraveler,0,2)&&integer(g.inspectionHints,0,3)&&integer(g.attempts)&&integer(g.successes,0,Number(g.attempts))&&Array.isArray(g.history)&&g.history.length<=20);
 g.history.forEach((h:unknown)=>assert(object(h)&&text(h.sql)&&typeof h.success==='boolean'&&text(h.detail,2000)));
}
export function readProgress(storage:StoragePort,now=Date.now()):LoadResult {
 try {
  const raw=storage.getItem(SAVE_KEY);if(!raw)return {kind:'none'};
  assert(raw.length<=8*1024*1024);const parsed:unknown=JSON.parse(raw);
  assert(object(parsed)&&parsed.version===SAVE_VERSION&&parsed.contentVersion===CONTENT_VERSION&&typeof parsed.body==='string'&&parsed.checksum===checksum(parsed.body));
  const data:unknown=JSON.parse(parsed.body);validateSaveData(data,now);
  return {kind:'ok',data};
 }catch{return {kind:'error',message:'O salvamento local está corrompido, indisponível ou incompatível. Você pode iniciar outra partida ou reiniciar a campanha para apagar esses dados.'};}
}
export function writeProgress(storage:StoragePort,data:SaveData):string|null {
 try {const body=JSON.stringify(data);if(body.length>6*1024*1024)throw new Error('size');storage.setItem(SAVE_KEY,JSON.stringify({version:SAVE_VERSION,contentVersion:CONTENT_VERSION,checksum:checksum(body),body}));return null;}
 catch{return 'Não foi possível salvar localmente (limite de espaço ou armazenamento bloqueado). A partida continua; o último salvamento disponível foi preservado.';}
}
export function clearProgress(storage:StoragePort):boolean {try{storage.removeItem(SAVE_KEY);return true;}catch{return false;}}
export function checkpointFromSave(game:SavedGame):SqlCheckpoint{return {mode:game.mode,bytes:decodeBytes(game.checkpoint.bytes),medium:game.checkpoint.medium};}
