import type { ViewModel } from './view';
import { escape } from './html';
import { inspectionContent } from '../content/inspection';
import { draftExample, REASON_LABELS } from '../content/medium';
import { canConfirmMedium, createMediumState, mediumTotals, type MediumReceipt } from '../game/medium';
import { formatTime, LEVELS } from '../game/session';
import { TABLES } from '../content/schema';

export function mediumPresentation(vm: ViewModel): string {
  if (vm.mode === 'avancado') return advancedPresentation(vm);
  return `<main id="conteudo" tabindex="-1" class="page briefing"><p class="eyebrow">NÍVEL MÉDIO / ATUALIZAÇÃO OFICIAL K9.2</p>
    <h1>O sistema foi atualizado.<br>A fronteira está aberta.</h1>
    <p class="lead">A central enviou um banco completo: ao assumir o posto, ele substituirá o banco do tutorial por novos registros oficiais. Sua conclusão salva do nível fácil será preservada.</p>
    <div class="brief-grid"><section class="panel"><h2>Investigue. Registre. Confirme.</h2><ol class="brief-list">
      <li><strong>Uma fila de seis viajantes.</strong><span>Leia a ficha e o regulamento. Documentos e vistos vêm primeiro; biologia entra no terceiro atendimento e exame infeccioso no quinto.</span></li>
      <li><strong>Consultas com objetivos.</strong><span>Pratique WHERE, AS, AND, OR, NOT, ORDER BY e LIMIT. Os exemplos podem ser editados e consultas equivalentes são aceitas.</span></li>
      <li><strong>O veredito é escrito em SQL.</strong><span>Use INSERT INTO, UPDATE e DELETE. No primeiro atendimento, pratique as três operações antes do registro final.</span></li>
      <li><strong>Confirmação encerra o atendimento.</strong><span>Depois de confirmar, a decisão fica protegida e a fila avança. O feedback explica os fatos e a pontuação.</span></li></ol></section>
      <aside class="panel briefing-aside"><p class="eyebrow">DADOS DO TURNO</p><dl><div><dt>Duração inicial</dt><dd>${formatTime(LEVELS[1].durationSeconds)}</dd></div><div><dt>Data de referência</dt><dd>15/06/2186</dd></div><div><dt>Banco oficial</dt><dd>8 tabelas / 6 viajantes</dd></div><div><dt>Pontuação máxima</dt><dd>90 pontos</dd></div></dl><p class="small muted">Cada decisão correta vale 10 pontos; o motivo correto vale mais 5. Acerto completo exige os dois. Pendentes não pontuam e aparecem separados dos erros. A duração ainda será ajustada com jogadores.</p><p class="small muted">O relógio começa após o carregamento. O progresso é salvo neste navegador. O relógio continua correndo fora da página.</p></aside></div>
    ${vm.error ? `<p class="error" role="alert">${escape(vm.error)}</p>` : ''}<button class="primary" data-action="begin" ${vm.loading ? 'disabled' : ''}>${vm.loading ? 'Instalando atualização oficial…' : 'Assumir o posto atualizado ↗'}</button></main>`;
}
export function mediumQueue(vm: ViewModel): string {
  const index = vm.medium?.index ?? 0;
  return `<ol class="queue-list" aria-label="Fila de fiscalização">${inspectionContent(vm.mode).travelers.map((t, i) => `<li ${i === index ? 'aria-current="step"' : ''}><span>${i < index ? '✓' : String(i + 1).padStart(2, '0')}</span>${t.nome}<small>${i < index ? 'confirmado' : i === index ? 'em atendimento' : 'aguardando'}</small></li>`).join('')}</ol>`;
}
export function mediumRegulations(vm: ViewModel): string {
  return `<section class="panel regulations"><p class="eyebrow">REGULAMENTO OFICIAL</p><h2>Controle ${(vm.medium?.index ?? 0) + 1} de 6</h2><ol>${inspectionContent(vm.mode).rules(vm.medium?.index ?? 0).map(rule => `<li>${escape(rule)}</li>`).join('')}</ol><p class="small muted">Somente leitura nos cadastros. Escreva apenas rascunhos do viajante atual em vereditos. A confirmação é feita pelo botão do posto.</p></section>`;
}
function receiptView(receipt: MediumReceipt): string {
  return `<details class="receipt" open><summary>${receipt.correct ? '✓ Veredito correto' : '◇ Revisão do veredito'} · ${escape(receipt.name)} · ${receipt.points}/15 pontos</summary><p>Você: ${receipt.approved ? 'aprovado' : 'negado'} / ${receipt.reason}. Esperado: ${receipt.expectedApproved ? 'aprovado' : 'negado'} / ${receipt.expectedReason}.</p><ul>${receipt.evidence.map(fact => `<li>${escape(fact)}</li>`).join('')}</ul></details>`;
}
export function mediumPanel(vm: ViewModel): string {
  const state = vm.medium ?? createMediumState();
  const task = inspectionContent(vm.mode).tasks[state.index];
  const stageLabel = { insert: '1. Inserir um rascunho', update: '2. Corrigir decisão ou motivo com UPDATE', delete: '3. Excluir o rascunho de treinamento com DELETE', 'final-insert': '4. Inserir o veredito a ser confirmado', ready: 'Veredito pronto para revisão' }[state.practice];
  const total = mediumTotals(state);
  return `<section class="panel medium-panel" aria-labelledby="titulo-investigacao"><div class="panel-heading"><span class="eyebrow">ATENDIMENTO ${state.index + 1} / 6</span><span class="small muted">${total.points} PONTOS</span></div>
    ${state.receipts.length ? receiptView(state.receipts[state.receipts.length - 1]) : ''}
    <h2 id="titulo-investigacao">${escape(task.title)}</h2><p>${escape(task.explanation)}</p>${task.hints ? `<button class="text-button" data-action="inspection-hint" ${(vm.inspectionHints ?? 0) >= task.hints.length ? 'disabled' : ''}>Revelar dica (${vm.inspectionHints ?? 0}/${task.hints.length})</button><ol class="tutorial-hints">${task.hints.slice(0,vm.inspectionHints ?? 0).map(h=>`<li>${escape(h)}</li>`).join('')}</ol>` : ''}
    <p class="small ${state.investigated ? 'success-text' : 'muted'}">${state.investigated ? '✓ Objetivo de investigação concluído' : `Recursos desta tarefa: ${task.required.join(' / ')}`}</p>
    <details class="tutorial-example"><summary>Ver consulta de exemplo</summary><pre><code>${escape(task.sql)}</code></pre></details><button class="secondary" data-action="medium-query" ${vm.busy ? 'disabled' : ''}>Carregar investigação no editor</button>
    <div class="verdict-practice"><h3>${stageLabel}</h3><p>${vm.mode === 'medio' && state.index === 0 && state.practice !== 'ready' ? 'Prática guiada: insira, altere efetivamente decisão ou motivo, exclua e reinsira. Cada execução avança no máximo uma etapa. Nada será julgado até a confirmação.' : 'Insira um veredito, confira os dados e corrija ou exclua enquanto ele for provisório.'}</p>
    <p class="small muted">Os modelos são rascunhos, não respostas. Ajuste aprovado (1 ou 0) e motivo ao regulamento. ${state.practice === 'delete' ? 'Esta exclusão faz parte do treinamento; depois você inserirá a decisão final.' : ''}</p>
    <details class="tutorial-example"><summary>Ver modelo de escrita</summary><pre><code>${escape(draftExample(inspectionContent(vm.mode).travelers[state.index].id, state.practice, state.drafts[0], vm.mode !== 'avancado'))}</code></pre></details>
    <div class="tutorial-actions"><button class="secondary" data-action="medium-write" ${vm.busy ? 'disabled' : ''}>Carregar escrita desta etapa</button></div>
    <div class="draft-tools"><button class="text-button" data-action="medium-insert" ${vm.busy ? 'disabled' : ''}>Modelo INSERT</button><button class="text-button" data-action="medium-update" ${vm.busy ? 'disabled' : ''}>Modelo UPDATE</button><button class="text-button" data-action="medium-delete" ${vm.busy ? 'disabled' : ''}>Modelo DELETE</button></div></div>
    <div class="draft-review"><strong>Rascunhos do viajante atual: ${state.drafts.length}</strong>${state.drafts.map(d => `<p>#${d.id} · ${d.aprovado ? 'Aprovar' : 'Negar'} · ${d.motivo}</p>`).join('')}<p class="small muted">A confirmação exige exatamente um rascunho. Para corrigir duplicados, exclua os rascunhos e insira um só; o histórico confirmado fica protegido.</p></div>
    <p class="tutorial-feedback ${canConfirmMedium(state) ? 'satisfied' : ''}" role="status">${escape(state.feedback)}</p>
    <button class="primary tutorial-next" data-action="confirm-verdict" ${vm.busy || !canConfirmMedium(state) ? 'disabled' : ''}>Confirmar veredito e avançar →</button><p class="small muted">Depois de confirmar, o veredito não pode ser editado nem excluído.</p>
  </section>`;
}
export function mediumReference(vm: ViewModel): string {
  const id = inspectionContent(vm.mode).travelers[vm.medium?.index ?? 0].id;
  return `<aside class="reference-column"><section class="panel"><p class="eyebrow">EVIDÊNCIAS DO VIAJANTE #${id}</p><h2>Investigue cada requisito.</h2>${['documentos','vistos','analises_biologicas','exames', ...(vm.mode === 'avancado' ? ['viagens'] : [])].map(table => `<button class="example-button medium-record" data-action="medium-record" data-table="${table}" ${vm.busy ? 'disabled' : ''}>${table} ↗</button>`).join('')}<p class="small muted">Os atalhos carregam SELECTs para o viajante atual. Confira datas, nome, destino e resultados.</p></section>
    <section class="panel reason-list"><p class="eyebrow">CÓDIGOS DE MOTIVO</p><h2>Uma justificativa precisa.</h2><p class="small muted">aprovado: 1 permite, 0 nega. Use o código entre aspas simples.</p>${Object.entries(REASON_LABELS).filter(([code])=>vm.mode==='avancado'||code!=='historico').map(([code,label]) => `<p><code>${code}</code><span>${label}</span></p>`).join('')}</section>
    <section class="panel schema-panel"><h2>Esquema do banco</h2><p class="small muted">8 tabelas. Somente vereditos permite escrita.</p>${TABLES.map(table => `<details><summary>${table.name}</summary><p class="schema-fields">${table.fields.split(' · ').map(field => `<code>${field}</code>`).join('')}</p><button class="text-button" data-action="table" data-table="${table.name}" ${vm.busy ? 'disabled' : ''}>Consultar tabela ↗</button></details>`).join('')}</section></aside>`;
}
export function mediumSummary(vm: ViewModel): string {
  const state = vm.medium ?? createMediumState();
  const totals = mediumTotals(state);
  return `<main id="conteudo" tabindex="-1" class="page summary-page"><p class="eyebrow">NÍVEL ${inspectionContent(vm.mode).label} / TURNO ENCERRADO</p><h1>${totals.pending ? vm.session.reason === 'tempo' ? 'O turno terminou por tempo.' : 'Atendimento encerrado.' : 'A fila chegou ao fim.'}</h1><p class="lead">${totals.points}/90 pontos. Decisões e justificativas são avaliadas separadamente; cada acerto completo exige ambas corretas.</p>
    <div class="summary-stats"><div><strong>${totals.correct}</strong><span>acertos completos</span></div><div><strong>${totals.errors}</strong><span>vereditos com erro</span></div><div><strong>${totals.pending}</strong><span>viajantes pendentes</span></div></div>
    <p class="small muted">Tempo restante: ${formatTime(vm.session.remaining())}. Pendentes não são contados como erros e não pontuam. Encerrar com todos os atendidos marca o nível como concluído na campanha.</p>
    <section class="summary-receipts" aria-label="Revisão dos vereditos">${state.receipts.length ? state.receipts.map(receiptView).join('') : '<p>Nenhum veredito foi confirmado.</p>'}</section>
    <h2>SQL praticado</h2><p class="learned-features">${state.learned.length ? state.learned.map(f => `<code>${f}</code>`).join(' ') : 'Nenhum objetivo finalizado.'}</p>
    <div class="hero-actions"><button class="primary" data-action="restart" ${vm.busy ? 'disabled' : ''}>Tentar outro turno ↗</button><button class="secondary" data-action="levels" ${vm.busy ? 'disabled' : ''}>Ver os níveis</button><button class="secondary" data-action="campaign" ${vm.busy?'disabled':''}>Resumo da campanha</button></div>${vm.mode === 'medio' && !totals.pending ? '<button class="primary" data-action="advanced">Continuar para o nível avançado ↗</button>' : ''}<p class="muted small">${vm.mode === 'avancado' ? 'Você chegou ao último nível da campanha.' : 'O nível avançado já está disponível.'} O progresso é salvo neste navegador.</p></main>`;
}

function advancedPresentation(vm: ViewModel): string {
  return `<main id="conteudo" tabindex="-1" class="page briefing"><p class="eyebrow">NÍVEL AVANÇADO / PROTOCOLO DE CRUZAMENTO</p><h1>As pistas agora estão espalhadas.</h1><p class="lead">Seis novos viajantes, múltiplos documentos, vistos e exames. Cruze as tabelas para encontrar ausências, divergências e repetições que mudam a decisão.</p><div class="brief-grid"><section class="panel"><h2>Novas ferramentas de investigação</h2><ol class="brief-list"><li><strong>INNER JOIN e LEFT JOIN.</strong><span>Ligue os registros pelo viajante_id. LEFT JOIN também preserva o que está sem correspondência.</span></li><li><strong>DISTINCT.</strong><span>Separe destinos ou doenças diferentes das repetições de registros.</span></li><li><strong>GROUP BY, COUNT e HAVING.</strong><span>Agrupe, conte e filtre grupos. Use COUNT(DISTINCT ...) para não inflar os valores em junções.</span></li></ol><p class="small muted">Cada investigação exige os recursos indicados e um resultado correto. Palavras em comentários ou textos não contam. Há três dicas graduais por atendimento.</p></section><aside class="panel briefing-aside"><h2>Seu último turno</h2><dl><div><dt>Tempo inicial</dt><dd>${formatTime(LEVELS[2].durationSeconds)}</dd></div><div><dt>Viajantes</dt><dd>6 novos registros</dd></div><div><dt>Referência</dt><dd>15/06/2186</dd></div><div><dt>Máximo</dt><dd>90 pontos</dd></div></dl><p class="small muted">Documento, visto e biologia são obrigatórios para todos. Cada destino exige dois exames; o histórico aceita no máximo dois destinos distintos. Registre e corrija por SQL e só depois confirme. Os cadastros e vereditos finalizados continuam protegidos.</p></aside></div>${vm.error ? `<p class="error" role="alert">${escape(vm.error)}</p>` : ''}<button class="primary" data-action="begin" ${vm.loading?'disabled':''}>${vm.loading?'Preparando as evidências…':'Iniciar nível avançado ↗'}</button></main>`;
}
