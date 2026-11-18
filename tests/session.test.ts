import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session, formatTime } from '../src/game/session';
import { evaluateVerdict } from '../src/game/evaluation';
import { escape } from '../src/ui/view';
import { explainSqlError } from '../src/sql/errors';

test('não conta apresentação e expira pelo tempo real mesmo sem ticks intermediários', () => {
  const session = new Session(10);
  assert.equal(session.remaining(999999), 10);
  assert.equal(session.tick(999999), false);
  session.start(1000);
  assert.equal(session.remaining(2500), 9);
  assert.equal(session.tick(12000), true);
  assert.equal(session.phase, 'encerrada');
  assert.equal(session.reason, 'tempo');
  assert.equal(session.remaining(50000), 0);
  session.start(50000);
  assert.equal(session.phase, 'encerrada');
});

test('encerra uma vez, congela relógio e nova sessão restaura o tempo', () => {
  const session = new Session(10);
  session.start(0);
  session.finish('manual', 4000);
  session.finish('tempo', 9000);
  assert.equal(session.remaining(100000), 6);
  assert.equal(session.reason, 'manual');
  assert.equal(new Session(10).phase, 'apresentacao');
  assert.equal(new Session(10).remaining(), 10);
  assert.equal(formatTime(600), '10:00');
});

test('avalia decisão e motivo separadamente, sem acoplar o gabarito ao banco', () => {
  const expected = { travelerId: 2, approved: false, reasons: ['visto'] as const };
  assert.deepEqual(evaluateVerdict(expected, false, 'visto'), { correct: true, decisionCorrect: true, reasonCorrect: true });
  assert.equal(evaluateVerdict(expected, true, 'visto').correct, false);
  assert.equal(evaluateVerdict(expected, false, 'regular').reasonCorrect, false);
});

test('escapa conteúdo SQL e textos antes de inserir no HTML', () => {
  assert.equal(escape('<script>"&\'</script>'), '&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;');
});

test('explica erros comuns em português sem remover os detalhes úteis', () => {
  assert.match(explainSqlError(new Error('no such table: outra')), /Tabela não encontrada: outra/);
  assert.match(explainSqlError(new Error('no such column: erro')), /Coluna não encontrada: erro/);
  assert.match(explainSqlError(new Error('near "SELEC": syntax error')), /erro de sintaxe/);
  assert.match(explainSqlError(new Error('FOREIGN KEY constraint failed')), /referência a um viajante/);
});
