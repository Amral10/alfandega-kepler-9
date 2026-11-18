import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { SqlEngine } from '../src/sql/engine';
import { CREATE_TRAVELERS_SQL, INSERT_TRAVELERS_SQL, TUTORIAL_STEPS, correctionSql } from '../src/content/tutorial';
import { TutorialProgress } from '../src/game/tutorial';
import { Session, LEVELS } from '../src/game/session';
import { renderView, type ViewModel } from '../src/ui/view';

let SQL: SqlJsStatic;
before(async () => { SQL = await initSqlJs({ locateFile: () => fileURLToPath(import.meta.resolve('sql.js/dist/sql-wasm.wasm')) }); });
const makeEngine = () => new SqlEngine(SQL, undefined, 'facil');
function populated() { const e = makeEngine(); e.execute(CREATE_TRAVELERS_SQL); e.execute(INSERT_TRAVELERS_SQL); return e; }

test('começa sem tabelas, com catálogo vazio real e demonstração preservada', () => {
  const e = makeEngine();
  const result = e.execute(TUTORIAL_STEPS[0].example, 'banco-vazio');
  assert.equal(result.validation?.satisfied, true);
  assert.equal(result.tables[0].rows.length, 0);
  assert.equal(e.execute("SELECT count(*) FROM sqlite_schema WHERE type='table'").tables[0].rows[0][0], 0);
  assert.equal(new SqlEngine(SQL).execute('SELECT count(*) FROM viajantes').tables[0].rows[0][0], 3);
});

test('todos os exemplos exibidos permitem concluir o nível em sequência', () => {
  const e = makeEngine();
  const progress = new TutorialProgress();
  const session = new Session(LEVELS[0].durationSeconds);
  session.start();
  for (const step of TUTORIAL_STEPS) {
    assert.equal(progress.step.id, step.id);
    const result = e.execute(step.example, step.id);
    assert.equal(result.validation?.satisfied, true, result.validation?.message);
    progress.accept(result.validation, session);
    assert.equal(progress.advance(session), true);
  }
  assert.equal(progress.finished, true);
  assert.equal(progress.completed.size, 5);
  assert.equal(session.reason, 'concluido');
  assert.equal(progress.advance(session), false);
});

test('valida esquema real e aceita caixa, espaços, ordem e afinidade equivalentes', () => {
  const e = makeEngine();
  const equivalent = ' create table VIAJANTES (NOME varchar(100) not null, ID int primary key, HISTORIA text not null, DESTINO text not null, ORIGEM text not null, ESPECIE text not null); ';
  assert.equal(e.execute(equivalent, 'criar-tabela').validation?.satisfied, true);
  const wrong = makeEngine();
  assert.equal(wrong.execute('CREATE TABLE viajantes(id TEXT PRIMARY KEY, nome TEXT)', 'criar-tabela').validation?.satisfied, false);
  assert.equal(wrong.execute(correctionSql(TUTORIAL_STEPS[1]), 'criar-tabela').validation?.satisfied, true);
});

test('detecta tabela vazia, ficha incorreta e registros extras; correção mantém sessão', () => {
  const e = makeEngine();
  assert.equal(e.execute(CREATE_TRAVELERS_SQL, 'cadastrar').validation?.satisfied, false);
  e.execute(INSERT_TRAVELERS_SQL);
  assert.equal(e.execute("UPDATE viajantes SET destino='Destino incorreto' WHERE id=1", 'cadastrar').validation?.satisfied, false);
  assert.equal(e.execute(correctionSql(TUTORIAL_STEPS[2]), 'cadastrar').validation?.satisfied, true);
  assert.equal(e.execute("INSERT INTO viajantes VALUES(4,'Extra','Humana','Terra','Europa','Extra')", 'cadastrar').validation?.satisfied, false);
});

test('objetivo de consulta exige resultado completo além do estado cadastrado', () => {
  const e = populated();
  assert.equal(e.execute('SELECT 1', 'consultar').validation?.satisfied, false);
  assert.equal(e.execute('SELECT * FROM viajantes LIMIT 1', 'consultar').validation?.satisfied, false);
  assert.equal(e.execute('SELECT nome FROM viajantes', 'consultar').validation?.satisfied, false);
  assert.equal(e.execute('SELECT * FROM viajantes', 'consultar').validation?.satisfied, true);
  assert.equal(e.execute('SELECT destino AS lugar, historia, origem, especie, nome, id FROM viajantes ORDER BY id DESC', 'consultar').validation?.satisfied, true);
  // Um resultado correto no início não pode ocultar uma alteração incorreta no final.
  assert.equal(e.execute("SELECT * FROM viajantes; UPDATE viajantes SET nome='Outro' WHERE id=1;", 'consultar').validation?.satisfied, false);
});

test('exige id e nome juntos e não aceita dados trocados entre viajantes', () => {
  const e = populated();
  assert.equal(e.execute('SELECT id, nome FROM viajantes', 'relacionar').validation?.satisfied, true);
  assert.equal(e.execute('SELECT nome AS pessoa, id AS chave FROM viajantes ORDER BY id DESC', 'relacionar').validation?.satisfied, true);
  assert.equal(e.execute('SELECT id FROM viajantes', 'relacionar').validation?.satisfied, false);
  assert.equal(e.execute('SELECT 4-id AS id,nome FROM viajantes', 'relacionar').validation?.satisfied, false);
});

test('erros não alteram dados e checkpoints recuperam banco fácil sem seed da demo', () => {
  const e = makeEngine();
  assert.throws(() => e.execute('CREAT TABLE viajantes(id INT)', 'criar-tabela'));
  const restoredEmpty = new SqlEngine(SQL, e.export(), 'facil');
  assert.equal(restoredEmpty.execute(TUTORIAL_STEPS[0].example, 'banco-vazio').validation?.satisfied, true);
  const filled = populated();
  const restored = new SqlEngine(SQL, filled.export(), 'facil');
  assert.equal(restored.execute('SELECT * FROM viajantes', 'consultar').validation?.satisfied, true);
  assert.equal(restored.execute("SELECT count(*) FROM sqlite_schema WHERE type='table'").tables[0].rows[0][0], 1);
});

test('bloqueia avanço inválido, repetição, resultado de outra tarefa e dicas além do limite', () => {
  const p = new TutorialProgress();
  const s = new Session(1200); s.start(0);
  assert.equal(p.advance(s, 1000), false);
  p.accept({ stepId: 'consultar', satisfied: true, message: 'fora de ordem' }, s);
  assert.equal(p.advance(s, 1000), false);
  for (let i = 0; i < 10; i++) p.revealHint();
  assert.equal(p.hintsRevealed, 3);
  p.accept({ stepId: 'banco-vazio', satisfied: true, message: 'ok' }, s);
  assert.equal(p.advance(s, 1000), true);
  assert.equal(p.completed.size, 1);
  assert.equal(p.hintsRevealed, 0);
  assert.equal(p.advance(s, 1000), false);
});

test('tempo esgotado e encerramento manual impedem avanço; reinício zera tarefas', () => {
  const p = new TutorialProgress();
  const s = new Session(1); s.start(0);
  p.accept({ stepId: 'banco-vazio', satisfied: true, message: 'ok' }, s);
  assert.equal(p.advance(s, 1000), false);
  assert.equal(s.reason, 'tempo');
  assert.equal(p.completed.size, 0);
  const manual = new Session(1200); manual.start(0); manual.finish('manual', 1000);
  p.accept({ stepId: 'banco-vazio', satisfied: true, message: 'tarde' }, manual);
  assert.equal(p.advance(manual, 1000), false);
  assert.equal(new TutorialProgress().position, 0);
  assert.equal(new TutorialProgress().feedback, null);
  assert.equal(new Session(1200).remaining(), 1200);
});

test('interface libera fácil, inclui glossário e libera médio e avançado', () => {
  const vm: ViewModel = { screen: 'niveis', mode: 'facil', tutorial: new TutorialProgress(), easyCompleted: false, session: new Session(1200), sql: '', selectedTraveler: 0, busy: false, loading: false, connected: true, error: '', result: null, history: [], attempts: 0, successes: 0 };
  const levels = renderView(vm);
  assert.match(levels, /data-action="easy"/);
  assert.match(levels, /data-action="medium"/);
  assert.match(levels, /data-action="advanced"/);
  vm.screen = 'posto';
  const desk = renderView(vm);
  assert.match(desk, /Glossário do operador/);
  assert.match(desk, /compativel/);
  assert.match(desk, /doenca \/ resultado/);
  assert.match(desk, /data-action="advance" disabled/);
  assert.doesNotMatch(desk, /08 TABELAS/);
});
