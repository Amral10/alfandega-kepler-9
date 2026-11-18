import { demo } from '../content/demo';
import { GLOSSARY, TUTORIAL_STEPS } from '../content/tutorial';
import { TABLES } from '../content/schema';
import { LEVELS, formatTime } from '../game/session';
import { escape } from './html';
import type { ViewModel } from './view';

export function tutorialPresentation(vm: ViewModel): string {
  return `<main id="conteudo" tabindex="-1" class="briefing page">
    <p class="eyebrow">NÍVEL FÁCIL / INICIALIZAÇÃO DO POSTO</p>
    <h1>Antes da primeira chegada, construa o sistema.</h1>
    <p class="lead">A estação Kepler-9 ainda não tem um cadastro. Você vai criar a primeira tabela, registrar três viajantes e consultar os dados. Cada tarefa traz um exemplo pronto, dicas e uma conferência do seu trabalho.</p>
    <div class="brief-grid"><section class="panel">
      <p class="eyebrow">DO BANCO VAZIO À PRIMEIRA CONSULTA</p><h2>Aprenda uma etapa de cada vez.</h2>
      <ol class="brief-list">${TUTORIAL_STEPS.map(step => `<li><strong>${step.title}</strong><span>${step.concept}</span></li>`).join('')}</ol>
    </section><aside class="panel briefing-aside"><p class="eyebrow">SEU PRIMEIRO TURNO</p>
      <dl><div><dt>Tempo inicial</dt><dd>${formatTime(LEVELS[0].durationSeconds)}</dd></div><div><dt>Viajantes</dt><dd>${demo.travelers.length}</dd></div><div><dt>Tabelas ao iniciar</dt><dd>Nenhuma</dd></div><div><dt>Objetivos</dt><dd>${TUTORIAL_STEPS.length} tarefas guiadas</dd></div></dl>
      <p class="small muted">O relógio só começa após a conexão. Você pode corrigir comandos e consultar o glossário durante a partida. O progresso é salvo neste navegador; o tempo continua correndo fora da página.</p>
      <p class="small muted">Não é preciso saber SQL para começar: carregue os exemplos no editor e execute-os. As fichas fornecem os dados e as histórias completas.</p>
    </aside></div>
    ${vm.error ? `<p class="error" role="alert">${escape(vm.error)}</p>` : ''}
    <button class="primary" data-action="begin" ${vm.loading ? 'disabled' : ''}>${vm.loading ? 'Preparando banco vazio…' : 'Iniciar nível fácil ↗'}</button>
  </main>`;
}

export function tutorialPanel(vm: ViewModel): string {
  const progress = vm.tutorial;
  const step = progress.step;
  return `<section class="panel tutorial-panel" aria-labelledby="titulo-tarefa">
    <div class="panel-heading"><span class="eyebrow">TAREFA ${progress.position + 1} DE ${TUTORIAL_STEPS.length}</span><span class="small muted">${progress.completed.size} concluída(s)</span></div>
    <ol class="tutorial-track" aria-label="Progresso do tutorial">${TUTORIAL_STEPS.map((s, i) => `<li class="${progress.completed.has(s.id) ? 'done' : i === progress.position ? 'active' : ''}" ${i === progress.position ? 'aria-current="step"' : ''}><span>${progress.completed.has(s.id) ? '✓' : i + 1}</span><span class="sr-only">${escape(s.title)}${progress.completed.has(s.id) ? ', concluída' : ''}</span></li>`).join('')}</ol>
    <h2 id="titulo-tarefa">${step.title}</h2><p class="tutorial-concept">${step.concept}</p>
    <p>${step.instruction}</p><div class="tutorial-expected"><strong>O que vamos conferir</strong><p>${step.expected}</p></div>
    <details class="tutorial-example"><summary>Ver SQL de exemplo</summary><pre><code>${escape(step.example)}</code></pre></details>
    <div class="tutorial-actions"><button class="secondary" data-action="tutorial-example" ${vm.busy ? 'disabled' : ''}>Usar exemplo da tarefa</button><button class="text-button" data-action="hint" ${progress.hintsRevealed >= step.hints.length ? 'disabled' : ''}>${progress.hintsRevealed ? 'Próxima dica' : 'Preciso de uma dica'} (${progress.hintsRevealed}/${step.hints.length})</button></div>
    ${progress.hintsRevealed ? `<ol class="tutorial-hints">${step.hints.slice(0, progress.hintsRevealed).map(hint => `<li>${escape(hint)}</li>`).join('')}</ol>` : ''}
    ${step.id !== 'banco-vazio' ? `<details class="tutorial-repair"><summary>Preciso corrigir o cadastro</summary><p class="small muted">O SQL de correção ${step.id === 'criar-tabela' ? 'recria a tabela viajantes' : step.id === 'cadastrar' ? 'limpa e preenche viajantes' : 'recria e preenche viajantes e faz a consulta da tarefa'}. O tempo e as tarefas já concluídas continuam. Confira o comando antes de executá-lo.</p><button class="text-button" data-action="tutorial-correction" ${vm.busy ? 'disabled' : ''}>Carregar SQL de correção ↗</button></details>` : ''}
    <div class="tutorial-feedback ${progress.feedback?.satisfied ? 'satisfied' : ''}" role="status">${progress.feedback ? escape(progress.feedback.message) : 'Execute um comando para verificar este objetivo.'}</div>
    <button class="primary tutorial-next" data-action="advance" ${vm.busy || !progress.feedback?.satisfied ? 'disabled' : ''}>${progress.position === TUTORIAL_STEPS.length - 1 ? 'Concluir nível fácil' : 'Próxima tarefa'} →</button>
  </section>`;
}

export function tutorialReference(): string {
  return `<aside class="reference-column tutorial-reference"><section class="panel">
    <p class="eyebrow">CONSULTA RÁPIDA</p><h2>Glossário do operador</h2>
    <p class="small muted">Os seis primeiros campos formam viajantes. Os demais pertencem às verificações que chegarão no próximo nível.</p>
    ${GLOSSARY.map(entry => `<details><summary>${escape(entry.field)}</summary><p>${escape(entry.meaning)}</p><p class="small muted">Exemplo: ${escape(entry.example)}</p></details>`).join('')}
    </section><section class="panel future-tables"><p class="eyebrow">MAPA DO SISTEMA</p><h2>Uma identidade, vários registros.</h2>
    <p class="small muted">Neste nível você cria apenas viajantes. Documentos verificam identidade; vistos autorizam destinos; análises conferem compatibilidade; exames verificam doenças fictícias. O campo viajante_id conecta cada registro ao viajante.</p>
    ${TABLES.map(table => `<details><summary>${table.name}${table.name === 'viajantes' ? ' · criar agora' : ' · próximo nível'}</summary><p class="schema-fields">${table.fields.split(' · ').map(field => `<code>${field}</code>`).join('')}</p></details>`).join('')}
    </section></aside>`;
}

export function tutorialSummary(vm: ViewModel): string {
  const complete = vm.session.reason === 'concluido' && vm.tutorial.finished;
  return `<main id="conteudo" tabindex="-1" class="page summary-page">
    <p class="eyebrow">NÍVEL FÁCIL / ${complete ? 'CONCLUÍDO' : 'TURNO ENCERRADO'}</p>
    <span class="summary-symbol" aria-hidden="true">${complete ? '✓' : '◇'}</span>
    <h1>${complete ? 'Seu primeiro banco está pronto.' : vm.session.reason === 'tempo' ? 'O tempo deste turno terminou.' : 'Vamos continuar em outro turno.'}</h1>
    <p class="lead">${complete ? 'Você criou o cadastro, inseriu três viajantes e consultou os registros. Também conheceu os vínculos com documentos, vistos e exames.' : 'O nível não foi concluído. Você pode começar de novo com o banco vazio, novas dicas e o tempo completo.'}</p>
    <div class="summary-stats"><div><strong>${vm.tutorial.completed.size}/${TUTORIAL_STEPS.length}</strong><span>tarefas concluídas</span></div><div><strong>${vm.successes}</strong><span>execuções sem erro SQL</span></div><div><strong>${formatTime(vm.session.remaining())}</strong><span>tempo restante</span></div></div>
    <ul class="learning-list">${TUTORIAL_STEPS.map(step => `<li><span>${vm.tutorial.completed.has(step.id) ? '✓' : '○'}</span>${step.concept}</li>`).join('')}</ul>
    <p class="muted">${complete ? 'Conclusão registrada na campanha. O nível médio já está disponível: uma atualização oficial trará o banco completo para a fiscalização.' : 'Os exemplos continuam disponíveis na próxima tentativa. Erros fazem parte do aprendizado.'}</p>
    <div class="hero-actions"><button class="primary" data-action="restart" ${vm.busy ? 'disabled' : ''}>${vm.busy ? 'Recuperando banco…' : complete ? 'Praticar novamente ↗' : 'Tentar novamente ↗'}</button><button class="secondary" data-action="levels" ${vm.busy ? 'disabled' : ''}>Ver os níveis</button></div>
    ${complete ? '<button class="primary" data-action="medium">Continuar para o nível médio ↗</button>' : ''}
  </main>`;
}
