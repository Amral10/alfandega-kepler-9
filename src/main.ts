import { newCampaign, recordLevel } from './game/campaign';
import { readProgress, writeProgress, clearProgress, encodeBytes, checkpointFromSave, type SavedGame, type StoragePort } from './game/persistence';
import './style.css';
import { draftExample } from './content/medium';
import { inspectionContent, isInspection } from './content/inspection';
import { canConfirmMedium } from './game/medium';
import { EXAMPLES } from './content/demo';
import { TABLES } from './content/schema';
import { formatTime, LEVELS, Session } from './game/session';
import { TutorialProgress } from './game/tutorial';
import { correctionSql, TUTORIAL_STEPS } from './content/tutorial';
import type { BankMode } from './game/types';
import { SqlClient } from './sql/client';
import { renderView, type ViewModel, type Screen } from './ui/view';

const root = document.querySelector<HTMLDivElement>('#app')!;
const dialog = document.querySelector<HTMLDialogElement>('#ajuda')!;
const sql = new SqlClient();
const vm: ViewModel = {
  screen: 'inicio', campaign:newCampaign(), mode: 'demo', tutorial: new TutorialProgress(), easyCompleted: false, connected: false, session: new Session(), sql: EXAMPLES[0].sql,
  selectedTraveler: 0, busy: false, loading: false, error: '', result: null,
  history: [], attempts: 0, successes: 0,
};

let restoring=true;
let preserveInvalidSave=false;
let lastGame:SavedGame|null=null;
let storage:StoragePort|null=null;
try { storage=window.localStorage; } catch { vm.notice='Armazenamento bloqueado: a partida funciona, mas o progresso não pode ser salvo neste navegador.'; }
function syncCampaign():void {
  recordLevel(vm.campaign!,vm.mode,vm.session,vm.tutorial,vm.medium);
  vm.easyCompleted=vm.campaign!.completed.includes('facil');
  vm.mediumCompleted=vm.campaign!.completed.includes('medio');
  vm.advancedCompleted=vm.campaign!.completed.includes('avancado');
}
function captureGame():SavedGame|null {
  if(vm.session.startedAt===null||vm.screen==='apresentacao')return null;
  if(vm.busy||vm.loading) {
    if(lastGame&&lastGame.mode===vm.mode&&lastGame.session.startedAt===vm.session.startedAt)
      return {...lastGame,session:vm.session.serialize(),screen:vm.session.phase==='encerrada'?'resultado':lastGame.screen};
    return lastGame;
  }
  const checkpoint=sql.exportCheckpoint();
  if(!checkpoint||checkpoint.mode!==vm.mode)return null;
  return {mode:vm.mode,screen:vm.screen,session:vm.session.serialize(),tutorial:vm.tutorial.serialize(),
    checkpoint:{mode:checkpoint.mode,bytes:encodeBytes(checkpoint.bytes),medium:checkpoint.medium},
    sql:vm.sql.slice(0,20000),selectedTraveler:vm.selectedTraveler,inspectionHints:vm.inspectionHints??0,
    history:vm.history.map(h=>({...h,sql:h.sql.slice(0,20000),detail:h.detail.slice(0,2000)})),attempts:vm.attempts,successes:vm.successes};
}
function saveNow():void {
  if(restoring||preserveInvalidSave||!storage)return;
  lastGame=captureGame();
  const message=writeProgress(storage,{campaign:vm.campaign!,game:lastGame,savedAt:Date.now()});
  if(message)vm.notice=message;
}
async function initialize():Promise<void> {
  try {
    const loaded=storage?readProgress(storage):{kind:'none' as const};
    if(loaded.kind==='error'){vm.notice=loaded.message;preserveInvalidSave=true;return;}
    if(loaded.kind==='none')return;
    vm.campaign=loaded.data.campaign;
    const g=loaded.data.game;
    if(!g){vm.notice='Resultados da campanha restaurados.';return;}
    vm.loading=true;render();
    await sql.restore(checkpointFromSave(g));
    vm.mode=g.mode;vm.session=Session.restore(g.session);vm.tutorial=TutorialProgress.restore(g.tutorial);
    vm.medium=sql.mediumState;vm.sql=g.sql;vm.selectedTraveler=g.selectedTraveler;vm.inspectionHints=g.inspectionHints;
    vm.history=g.history;vm.attempts=g.attempts;vm.successes=g.successes;vm.result=null;
    const expired=vm.session.tick();vm.screen=expired?'resultado':g.screen;
    vm.notice=expired?'Seu prazo terminou enquanto a página estava fechada. O turno foi encerrado com os vereditos já confirmados.':'Partida restaurada. O tempo continuou correndo; o último checkpoint concluído foi recuperado.';
    lastGame=g;
  } catch {
    sql.dispose();vm.mode='demo';vm.session=new Session();vm.tutorial=new TutorialProgress();vm.medium=undefined;vm.screen='inicio';
    vm.notice='Não foi possível restaurar o banco salvo. Ele foi preservado; inicie outra partida ou reinicie a campanha.';preserveInvalidSave=true;
  } finally {restoring=false;vm.loading=false;render(true);}
}
function resetCampaign():void {
  if(vm.busy||vm.loading)return;
  sql.dispose();lastGame=null;preserveInvalidSave=false;
  if(storage&&!clearProgress(storage))vm.notice='O navegador não permitiu apagar o salvamento. O progresso atual foi zerado somente em memória.';
  else vm.notice='Campanha reiniciada. Os três níveis estão prontos para uma nova jornada.';
  vm.campaign=newCampaign();vm.mode='demo';vm.session=new Session();vm.tutorial=new TutorialProgress();vm.medium=undefined;
  vm.screen='inicio';vm.sql=EXAMPLES[0].sql;vm.history=[];vm.result=null;vm.error='';vm.attempts=0;vm.successes=0;vm.inspectionHints=0;
  render(true);
}

function render(focusMain = false): void {
  syncCampaign();saveNow();
  vm.connected = sql.connected;
  const focused = document.activeElement?.id;
  root.innerHTML = renderView(vm);
  if (focusMain) {
    document.querySelector<HTMLElement>('#conteudo')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  else if (focused) document.getElementById(focused)?.focus();
}
function navigate(screen: Screen): void {
  if (vm.loading || vm.busy) return;
  if (vm.session.phase === 'em-andamento') finish();
  vm.screen = screen;
  render(true);
}
function finish(): void {
  if (!vm.session.tick()) vm.session.finish();
  vm.screen = 'resultado';
  sql.cancel();
  render(true);
}
function setSql(value: string): void {
  vm.sql = value;
  render();
  const editor = document.querySelector<HTMLTextAreaElement>('#sql-editor');
  editor?.focus();
  editor?.setSelectionRange(0, 0);
}
async function begin(): Promise<void> {
  if (vm.busy || vm.loading) return;
  vm.loading = true;
  vm.error = '';
  render();
  try {
    await sql.reset(vm.mode);
    preserveInvalidSave=false;
    vm.tutorial = new TutorialProgress();
    vm.session = new Session(vm.mode === 'demo' ? undefined : LEVELS.find(level => level.id === vm.mode)!.durationSeconds);
    vm.medium = sql.mediumState;
    vm.inspectionHints = 0;
    vm.session.start();
    vm.screen = 'posto';
    vm.sql = vm.mode === 'facil' ? TUTORIAL_STEPS[0].example : isInspection(vm.mode) ? inspectionContent(vm.mode).tasks[0].sql : EXAMPLES[0].sql;
    vm.selectedTraveler = 0;
    vm.history = [];
    vm.attempts = 0;
    vm.successes = 0;
    vm.result = null;
  } catch (error) {
    vm.error = error instanceof Error ? error.message : 'Não foi possível abrir o banco.';
    vm.screen = 'apresentacao';
  } finally { vm.loading = false; render(true); }
}
async function execute(): Promise<void> {
  if (vm.busy || !vm.sql.trim() || vm.session.phase !== 'em-andamento') return;
  if (vm.session.tick()) { vm.screen = 'resultado'; render(true); return; }
  saveNow();
  const command = vm.sql;
  vm.busy = true;
  vm.error = '';
  vm.attempts++;
  vm.tutorial.feedback = null;
  render();
  const entry = { sql: command, success: false, detail: '' };
  try {
    const result = await sql.execute(command, vm.mode === 'facil' ? vm.tutorial.step.id : undefined);
    // O relógio pode expirar durante uma consulta; o turno permanece encerrado.
    const expired = vm.session.tick();
    if (expired) vm.screen = 'resultado';
    entry.success = true;
    entry.detail = `${result.statementCount} comando(s), ${result.changes} registro(s) alterado(s).`;
    vm.result = result;
    if (isInspection(vm.mode)) vm.medium = result.medium;
    if (vm.mode === 'facil') vm.tutorial.accept(result.validation, vm.session);
    vm.successes++;
  } catch (error) {
    vm.error = error instanceof Error ? error.message : 'Falha inesperada ao consultar o banco.';
    entry.detail = vm.error;
  } finally {
    vm.history.unshift(entry);
    vm.history = vm.history.slice(0, 20);
    vm.busy = false;
    render();
    if (vm.screen === 'posto' && !dialog.open) document.querySelector<HTMLTextAreaElement>('#sql-editor')?.focus();
  }
}
function prepare(mode: BankMode): void {
  if (vm.session.phase === 'em-andamento') { finish(); return; }
  vm.mode = mode;
  vm.session = new Session(mode === 'demo' ? undefined : LEVELS.find(level => level.id === mode)!.durationSeconds);
  vm.medium = undefined;
  vm.tutorial = new TutorialProgress();
  vm.error = '';
  navigate('apresentacao');
}
function advance(): void {
  if (vm.mode !== 'facil' || vm.busy) return;
  const advanced = vm.tutorial.advance(vm.session);
  if (vm.session.phase === 'encerrada') {
    if (vm.session.reason === 'concluido') vm.easyCompleted = true;
    vm.screen = 'resultado';
  } else if (advanced) {
    vm.sql = vm.tutorial.step.example;
    vm.result = null;
    vm.error = '';
  }
  render(advanced);
}
async function confirmVerdict(): Promise<void> {
  if (!isInspection(vm.mode) || vm.busy || !canConfirmMedium(vm.medium) || vm.session.phase !== 'em-andamento') return;
  if (vm.session.tick()) { vm.screen = 'resultado'; render(true); return; }
  const traveler = inspectionContent(vm.mode).travelers[vm.medium!.index];
  const deadline = vm.session.startedAt! + vm.session.durationSeconds * 1000;
  vm.busy = true; vm.error = ''; render();
  try {
    vm.medium = await sql.confirm(traveler.id, deadline);
    vm.inspectionHints = 0;
    if (vm.medium.index === inspectionContent(vm.mode).travelers.length) {
      vm.session.finish('concluido'); if (vm.mode === 'avancado') vm.advancedCompleted = true; else vm.mediumCompleted = true; vm.screen = 'resultado';
    } else if (vm.session.tick()) vm.screen = 'resultado';
    else {
      vm.sql = inspectionContent(vm.mode).tasks[vm.medium.index].sql;
      vm.result = null;
    }
  } catch (error) { vm.error = error instanceof Error ? error.message : 'Não foi possível confirmar.'; }
  finally { vm.busy = false; render(true); }
}
function mediumWrite(stage: 'insert' | 'update' | 'delete' | 'current'): void {
  if (!isInspection(vm.mode) || !vm.medium) return;
  setSql(draftExample(inspectionContent(vm.mode).travelers[vm.medium.index].id, stage === 'current' ? vm.medium.practice : stage, vm.medium.drafts[0], vm.mode !== 'avancado'));
}
let inputSaveTimer:ReturnType<typeof setTimeout>;
root.addEventListener('input', event => {
  if (event.target instanceof HTMLTextAreaElement && event.target.id === 'sql-editor') {
    vm.sql = event.target.value;
    clearTimeout(inputSaveTimer);inputSaveTimer=setTimeout(saveNow,250);
    const button = root.querySelector<HTMLButtonElement>('[data-action="execute"]');
    if (button) button.disabled = vm.busy || !vm.connected || !vm.sql.trim();
  }
});
root.addEventListener('keydown', event => {
  if (event.target instanceof HTMLTextAreaElement && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    void execute();
  }
});
root.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target || (target instanceof HTMLButtonElement && target.disabled)) return;
  event.preventDefault();
  const action = target.dataset.action;
  if (action === 'help') { dialog.showModal(); return; }
  if (action === 'cancel') { sql.cancel(); return; }
  if (action === 'finish') { finish(); return; }
  if (action === 'execute') { void execute(); return; }
  if (action === 'confirm-verdict') { void confirmVerdict(); return; }
  if (vm.loading || vm.busy) return;
  switch (action) {
    case 'home': navigate('inicio'); break;
    case 'levels': navigate('niveis'); break;
    case 'campaign': navigate('campanha'); break;
    case 'reset-campaign': document.querySelector<HTMLDialogElement>('#reiniciar-campanha')!.showModal(); break;
    case 'dismiss-notice': vm.notice='';render();break;
    case 'demo': prepare('demo'); break;
    case 'easy': prepare('facil'); break;
    case 'medium': prepare('medio'); break;
    case 'advanced': prepare('avancado'); break;
    case 'inspection-hint': vm.inspectionHints = Math.min(3, (vm.inspectionHints ?? 0) + 1); render(); break;
    case 'medium-query': if (vm.medium) setSql(inspectionContent(vm.mode).tasks[vm.medium.index].sql); break;
    case 'medium-write': mediumWrite('current'); break;
    case 'medium-insert': mediumWrite('insert'); break;
    case 'medium-update': mediumWrite('update'); break;
    case 'medium-delete': mediumWrite('delete'); break;
    case 'medium-record': {
      const table = TABLES.find(t => t.name === target.dataset.table);
      if (table && vm.medium) setSql(`SELECT * FROM ${table.name} WHERE viajante_id = ${inspectionContent(vm.mode).travelers[vm.medium.index].id};`);
      break;
    }
    case 'begin': void begin(); break;
    case 'restart': if(!vm.session.tick())vm.session.finish(); syncCampaign(); prepare(vm.mode); break;
    case 'advance': advance(); break;
    case 'hint': vm.tutorial.revealHint(); render(); break;
    case 'tutorial-example': setSql(vm.tutorial.step.example); break;
    case 'tutorial-correction': setSql(correctionSql(vm.tutorial.step)); break;
    case 'previous': vm.selectedTraveler = Math.max(0, vm.selectedTraveler - 1); render(); break;
    case 'next': vm.selectedTraveler = Math.min(2, vm.selectedTraveler + 1); render(); break;
    case 'example': { const example = EXAMPLES[Number(target.dataset.index)]; if (example) setSql(example.sql); break; }
    case 'history': { const entry = vm.history[Number(target.dataset.index)]; if (entry) setSql(entry.sql); break; }
    case 'table': { const table = TABLES.find(t => t.name === target.dataset.table); if (table) setSql(`SELECT * FROM ${table.name}\nLIMIT 20;`); break; }
  }
});
document.querySelector('#cancelar-reinicio')!.addEventListener('click',()=>document.querySelector<HTMLDialogElement>('#reiniciar-campanha')!.close());
document.querySelector('#confirmar-reinicio')!.addEventListener('click',()=>{document.querySelector<HTMLDialogElement>('#reiniciar-campanha')!.close();resetCampaign();});
window.addEventListener('pagehide',saveNow);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow();});
window.addEventListener('pageshow',()=>{if(!restoring&&vm.session.tick()){vm.screen='resultado';sql.cancel();render(true);}});
document.querySelector('#fechar-ajuda')!.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
setInterval(() => {
  if (vm.session.phase !== 'em-andamento') return;
  if (vm.session.tick()) {
    sql.cancel();
    vm.screen = 'resultado';
    render(true);
    return;
  }
  const clock = document.getElementById('clock');
  if (clock) {
    clock.textContent = formatTime(vm.session.remaining());
    clock.classList.toggle('urgent', vm.session.remaining() <= 60);
  }
}, 250);
render();
void initialize();
