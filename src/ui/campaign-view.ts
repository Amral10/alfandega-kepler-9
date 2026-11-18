import type { ViewModel } from './view';
import { campaignTotals,newCampaign } from '../game/campaign';
import { TUTORIAL_STEPS } from '../content/tutorial';
import { LEVELS } from '../game/session';
import { escape } from './html';
export function campaignView(vm:ViewModel):string {
 const campaign=vm.campaign??newCampaign();const totals=campaignTotals(campaign);
 return `<main id="conteudo" tabindex="-1" class="page summary-page"><p class="eyebrow">REGISTRO DO OPERADOR / CAMPANHA</p><h1>${totals.complete?'Campanha concluída.':'Seu progresso em Kepler-9.'}</h1><p class="lead">${totals.points}/180 pontos nos turnos de fiscalização. ${campaign.completed.length}/3 níveis concluídos.</p><div class="summary-stats"><div><strong>${totals.correct}</strong><span>acertos completos</span></div><div><strong>${totals.errors}</strong><span>vereditos com erro</span></div><div><strong>${totals.pending}</strong><span>viajantes pendentes</span></div></div>
 <p class="small muted">Resultados da última tentativa de cada nível. As conclusões anteriores são mantidas mesmo se você praticar novamente. O tutorial avalia cinco tarefas; sua pontuação não é somada aos vereditos.</p>
 <div class="table-scroll" tabindex="0" role="region" aria-label="Resultados por nível"><table><thead><tr><th>Nível</th><th>Conclusão</th><th>Objetivos SQL</th><th>Pontos</th><th>Pendentes</th></tr></thead><tbody>${LEVELS.map((level,i)=>{const r=campaign.results[level.id];return `<tr><th scope="row">${['Fácil','Médio','Avançado'][i]}</th><td>${campaign.completed.includes(level.id)?'Concluído':r?'Turno interrompido':'Ainda não iniciado'}</td><td>${r?escape(r.objectives.map(o=>i===0?TUTORIAL_STEPS.find(s=>s.id===o)?.concept??o:o).join(', ')):'—'}</td><td>${i===0?'—':r?r.points+'/90':'0/90'}</td><td>${r?r.pending:i===0?'5 tarefas':'6 viajantes'}</td></tr>`;}).join('')}</tbody></table></div>
 <div class="hero-actions"><button class="primary" data-action="levels">Escolher próximo turno ↗</button><button class="secondary" data-action="reset-campaign">Reiniciar campanha</button></div><p class="small muted">O progresso é salvo neste navegador. O tempo de um turno ativo continua correndo fora da página.</p></main>`;
}
