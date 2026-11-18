import type { Database } from 'sql.js';
import { ADVANCED_DATE, ADVANCED_TRAVELERS } from '../content/advanced';
import type { Verdict, VerdictReason } from './types';
import type { MediumReceipt } from './medium';
import { evaluateVerdict } from './evaluation';
export function assessAdvanced(db: Database, index: number, draft: Verdict): MediumReceipt {
  const traveler = ADVANCED_TRAVELERS[index];
  const scalar = (sql: string, args: (string|number)[]) => Number(db.exec(sql,args)[0].values[0][0]);
  const checks: [VerdictReason,boolean,string][] = [
    ['identidade', scalar('SELECT count(*) FROM documentos WHERE viajante_id=? AND nome_registrado=? AND validade>=?',[traveler.id,traveler.nome,ADVANCED_DATE])>0, 'Documento com nome correspondente e validade aceita'],
    ['visto', scalar('SELECT count(*) FROM vistos WHERE viajante_id=? AND destino=? AND validade>=?',[traveler.id,traveler.destino,ADVANCED_DATE])>0, 'Pelo menos um visto válido para o destino solicitado'],
    ['biologia', scalar('SELECT count(*) FROM analises_biologicas WHERE viajante_id=? AND compativel=1 AND data<=?',[traveler.id,ADVANCED_DATE])>0, 'Análise biológica compatível realizada até a referência'],
    ['exame', scalar("SELECT count(*) FROM restricoes r WHERE r.destino=? AND r.tipo='exame' AND NOT EXISTS (SELECT 1 FROM exames e WHERE e.viajante_id=? AND e.doenca=r.descricao AND e.resultado='negativo' AND e.data<=? AND e.validade>=?)",[traveler.destino,traveler.id,ADVANCED_DATE,ADVANCED_DATE])===0, 'Conjunto completo de doenças exigidas coberto por exames negativos válidos'],
    ['historico', scalar('SELECT count(DISTINCT destino) FROM viagens WHERE viajante_id=?',[traveler.id])<=2, 'Histórico com no máximo dois destinos distintos'],
  ];
  const expectedReason = checks.find(([,ok])=>!ok)?.[0] ?? 'regular';
  const expectedApproved = expectedReason==='regular';
  const evaluation=evaluateVerdict({travelerId:traveler.id,approved:expectedApproved,reasons:[expectedReason]},draft.aprovado===1,draft.motivo);
  return {travelerId:traveler.id,name:traveler.nome,approved:draft.aprovado===1,reason:draft.motivo,expectedApproved,expectedReason,...evaluation,points:(evaluation.decisionCorrect?10:0)+(evaluation.reasonCorrect?5:0),evidence:checks.map(([,ok,label])=>`${ok?'Atendido':'Falha'}: ${label}.`)};
}
