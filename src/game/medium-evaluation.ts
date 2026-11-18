import type { Database } from 'sql.js';
import { MEDIUM_DATE, MEDIUM_TRAVELERS } from '../content/medium';
import type { Verdict, VerdictReason } from './types';
import type { MediumReceipt } from './medium';
import { evaluateVerdict } from './evaluation';

export function assessMedium(db: Database, index: number, draft: Verdict): MediumReceipt {
  const traveler = MEDIUM_TRAVELERS[index];
  const count = (query: string, params: (string | number)[]) => Number(db.exec(query, params)[0].values[0][0]);
  const failures: VerdictReason[] = [];
  const evidence: string[] = [];
  const document = count('SELECT count(*) FROM documentos WHERE viajante_id=? AND nome_registrado=? AND validade>=?', [traveler.id, traveler.nome, MEDIUM_DATE]) > 0;
  evidence.push(document ? 'Documento com nome correspondente e validade aceita.' : 'Nenhum documento reúne nome correspondente e validade aceita.');
  if (!document) failures.push('identidade');
  const visa = count('SELECT count(*) FROM vistos WHERE viajante_id=? AND destino=? AND validade>=?', [traveler.id, traveler.destino, MEDIUM_DATE]) > 0;
  evidence.push(visa ? `Visto válido para ${traveler.destino}.` : `Não há visto válido para ${traveler.destino} em 15/06/2186.`);
  if (!visa) failures.push('visto');
  if (index >= 2) {
    const biology = count('SELECT count(*) FROM analises_biologicas WHERE viajante_id=? AND compativel=1 AND data<=?', [traveler.id, MEDIUM_DATE]) > 0;
    evidence.push(biology ? 'Análise biológica compatível, realizada até a referência.' : 'Não há análise biológica compatível realizada até a referência.');
    if (!biology) failures.push('biologia');
  }
  if (index >= 4) {
    const exam = count("SELECT count(*) FROM exames WHERE viajante_id=? AND doenca='Febre de Íon' AND resultado='negativo' AND data<=? AND validade>=?", [traveler.id, MEDIUM_DATE, MEDIUM_DATE]) > 0;
    evidence.push(exam ? 'Exame de Febre de Íon negativo, realizado e válido na referência.' : 'Não há exame de Febre de Íon negativo que atenda às datas exigidas.');
    if (!exam) failures.push('exame');
  }
  const expectedReason = failures[0] ?? 'regular';
  const expectedApproved = !failures.length;
  const evaluation = evaluateVerdict({ travelerId: traveler.id, approved: expectedApproved, reasons: [expectedReason] }, draft.aprovado === 1, draft.motivo);
  return { travelerId: traveler.id, name: traveler.nome, approved: draft.aprovado === 1, reason: draft.motivo, expectedApproved, expectedReason, ...evaluation, points: (evaluation.decisionCorrect ? 10 : 0) + (evaluation.reasonCorrect ? 5 : 0), evidence };
}
