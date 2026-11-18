import type { Database } from 'sql.js';
import { demo } from './demo';
import { SCHEMA_SQL } from './schema';
import type { Traveler, Verdict, VerdictReason } from '../game/types';

export const MEDIUM_DATE = '2186-06-15';
export const MEDIUM_TRAVELERS: readonly Traveler[] = [
  ...demo.travelers,
  { id: 4, nome: 'Ivo Renn', especie: 'Humana', origem: 'Ceres', destino: 'Marte', historia: 'Técnico de antenas chamado para reparar uma rede de comunicação em Marte. Apresenta dois documentos emitidos em anos diferentes.' },
  { id: 5, nome: 'Nami Sol', especie: 'Miridiana', origem: 'Mir', destino: 'Titã', historia: 'Musicista convidada para o festival das cúpulas. Fez um exame no posto de origem antes de embarcar.' },
  { id: 6, nome: 'Tess Aru', especie: 'Velariana', origem: 'Vela', destino: 'Io', historia: 'Pesquisadora de materiais que vai estudar as forjas de Io. Sua equipe já reservou uma bancada no laboratório orbital.' },
];
export const REASON_LABELS: Record<VerdictReason, string> = {
  regular: 'Todos os requisitos ativos atendidos', identidade: 'Documento ou identidade irregular',
  visto: 'Visto ausente, vencido ou para outro destino', biologia: 'Análise biológica ausente ou incompatível',
  exame: 'Exame ausente, vencido ou positivo', historico: 'Histórico excede o limite de destinos distintos',
};
export function mediumRules(index: number): string[] {
  return [
    `Data fixa de referência: 15/06/2186. Validade igual a essa data ainda é aceita.`,
    'Identidade: pelo menos um documento deve ter nome_registrado igual ao nome do cadastro e validade não anterior à referência.',
    'Visto: pelo menos um visto deve corresponder ao destino solicitado e estar válido na referência.',
    ...(index >= 2 ? ['Biologia: é obrigatória uma análise com compativel = 1, realizada até a referência.'] : []),
    ...(index >= 4 ? ['Saúde: é obrigatório exame de Febre de Íon negativo, realizado até a referência e ainda válido.'] : []),
    'Se todos os requisitos ativos forem atendidos, aprove com motivo regular. Caso contrário, negue usando a primeira falha na ordem: identidade, visto, biologia, exame.',
  ];
}
export interface Investigation { title: string; explanation: string; required: string[]; sql: string; hints?: readonly string[] }
export const INVESTIGATIONS: readonly Investigation[] = [
  { title: 'Localizar e nomear os dados', explanation: 'Use SELECT, WHERE e AS para devolver nome e destino apenas de Lia. AS dá um apelido à coluna.', required: ['SELECT', 'WHERE', 'AS'], sql: 'SELECT nome AS viajante, destino FROM viajantes WHERE id = 1;' },
  { title: 'Combinar condições do visto', explanation: 'Use AND para exigir o id do viajante e OR para pesquisar os destinos Titã ou Europa. Os parênteses mantêm a prioridade das condições. Retorne destino e validade do visto de Oryn.', required: ['SELECT', 'WHERE', 'AND', 'OR'], sql: "SELECT destino, validade FROM vistos\nWHERE viajante_id = 2 AND (destino = 'Titã' OR destino = 'Europa');" },
  { title: 'Excluir uma origem', explanation: 'NOT inverte uma condição. Consulte id e nome de Suri, exigindo seu id e excluindo quem tem origem Terra. A partir deste atendimento, a análise biológica também é obrigatória.', required: ['SELECT', 'WHERE', 'NOT'], sql: "SELECT id, nome FROM viajantes WHERE id = 3 AND NOT (origem = 'Terra');" },
  { title: 'Conferir o documento mais recente', explanation: 'ORDER BY validade DESC põe a maior validade primeiro; LIMIT 1 escolhe só esse registro. Retorne nome_registrado e validade do documento de maior validade de Ivo. Compare-o com a ficha.', required: ['SELECT', 'WHERE', 'ORDER BY', 'LIMIT'], sql: 'SELECT nome_registrado, validade FROM documentos\nWHERE viajante_id = 4 ORDER BY validade DESC LIMIT 1;' },
  { title: 'Investigar o exame infeccioso', explanation: 'Retorne doenca, resultado e validade dos exames de Nami. A partir deste atendimento, o exame negativo de Febre de Íon é obrigatório. Leia também as datas e as outras evidências antes de decidir.', required: ['SELECT', 'WHERE'], sql: 'SELECT doenca, resultado, validade FROM exames WHERE viajante_id = 5;' },
  { title: 'Revisar o último visto', explanation: 'Consulte destino e validade do visto mais duradouro de Tess. Use ORDER BY e LIMIT; depois confira documento, biologia e exame para concluir o turno.', required: ['SELECT', 'WHERE', 'ORDER BY', 'LIMIT'], sql: 'SELECT destino, validade FROM vistos WHERE viajante_id = 6 ORDER BY validade DESC LIMIT 1;' },
];

export type PracticeStage = 'insert' | 'update' | 'delete' | 'final-insert' | 'ready';
export function draftExample(id: number, stage: PracticeStage, draft?: Verdict, training = true): string {
  if (stage === 'update') return `UPDATE vereditos SET aprovado = ${draft?.aprovado === 1 ? 0 : 1}, motivo = '${draft?.motivo === 'regular' ? 'visto' : 'regular'}'\nWHERE viajante_id = ${id} AND confirmado = 0;`;
  if (stage === 'delete') return `DELETE FROM vereditos WHERE viajante_id = ${id} AND confirmado = 0;`;
  return `INSERT INTO vereditos (viajante_id, aprovado, motivo)\nVALUES (${id}, ${training && id === 1 && stage === 'insert' ? 0 : 1}, '${training && id === 1 && stage === 'insert' ? 'identidade' : 'regular'}');`;
}

export function seedMedium(db: Database): void {
  db.run(SCHEMA_SQL);
  for (const t of MEDIUM_TRAVELERS) {
    db.run('INSERT INTO viajantes VALUES (?, ?, ?, ?, ?, ?)', [t.id, t.nome, t.especie, t.origem, t.destino, t.historia]);
    db.run('INSERT INTO documentos VALUES (?, ?, ?, ?, ?)', [t.id, t.id, `K9-M${t.id}`, t.id === 4 ? 'Ivo Rhen' : t.nome, '2187-12-31']);
    db.run('INSERT INTO vistos VALUES (?, ?, ?, ?)', [t.id, t.id, t.destino, t.id === 2 ? '2186-06-01' : '2187-01-01']);
    db.run('INSERT INTO analises_biologicas VALUES (?, ?, ?, ?)', [t.id, t.id, t.id === 3 ? 0 : 1, '2186-06-14']);
    db.run('INSERT INTO exames VALUES (?, ?, ?, ?, ?, ?)', [t.id, t.id, 'Febre de Íon', t.id === 5 ? 'positivo' : 'negativo', '2186-06-14', '2186-06-30']);
    db.run('INSERT INTO viagens VALUES (?, ?, ?, ?)', [t.id, t.id, t.origem, '2186-06-10']);
  }
  db.run("INSERT INTO documentos VALUES (7, 4, 'K9-M4-ANTIGO', 'Ivo Renn', '2185-12-31')");
  db.run('CREATE UNIQUE INDEX veredito_final_unico ON vereditos(viajante_id) WHERE confirmado = 1');
  MEDIUM_TRAVELERS.forEach((t, i) => db.run('INSERT INTO restricoes VALUES (?, ?, ?, ?)', [i + 1, t.destino, 'regulamento', mediumRules(i).join('\n')]));
}
