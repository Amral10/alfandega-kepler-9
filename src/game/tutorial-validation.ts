import type { Database } from 'sql.js';
import { demo } from '../content/demo';
import type { TutorialStepId } from '../content/tutorial';
import type { QueryResult, ResultTable } from '../sql/protocol';
import type { TutorialValidation } from './tutorial';

const FIELDS = ['id', 'nome', 'especie', 'origem', 'destino', 'historia'] as const;
function rowsMatch(actual: unknown[][], expected: unknown[][]): boolean {
  const normalize = (rows: unknown[][]) => rows.map(row => JSON.stringify(row)).sort();
  return JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected));
}
function values(fields: readonly (typeof FIELDS[number])[]) {
  return demo.travelers.map(t => fields.map(field => t[field]));
}
function resultMatches(table: ResultTable, fields: readonly (typeof FIELDS[number])[]): boolean {
  if (table.truncated || table.rows.length !== demo.travelers.length || table.columns.length !== fields.length) return false;
  // Compara tuplas completas, aceitando projeções reordenadas e aliases.
  const expected = values(fields);
  const permutations = (items: number[]): number[][] => items.length ? items.flatMap((x, i) => permutations(items.filter((_, j) => j !== i)).map(tail => [x, ...tail])) : [[]];
  return permutations(fields.map((_, i) => i)).some(order => rowsMatch(table.rows.map(row => order.map(i => row[i])), expected));
}

export function validateTutorial(db: Database, result: QueryResult, stepId: TutorialStepId): TutorialValidation {
  const reply = (satisfied: boolean, message: string): TutorialValidation => ({ stepId, satisfied, message });
  const tables = db.exec("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'")[0]?.values ?? [];
  if (stepId === 'banco-vazio') {
    const emptyResult = result.tables.some(t => t.columns.length === 1 && t.columns[0].toLowerCase() === 'name' && !t.rows.length && !t.truncated);
    return tables.length === 0 && emptyResult
      ? reply(true, 'Catálogo conferido: nenhuma tabela de usuário foi criada. Agora podemos construir o cadastro.')
      : reply(false, 'O banco deve estar vazio, e a consulta deve devolver a coluna name sem linhas. Se criou tabelas antes da hora, reinicie o nível.');
  }
  if (!tables.some(row => String(row[0]).toLowerCase() === 'viajantes')) return reply(false, 'A tabela viajantes ainda não existe. Crie-a com os seis campos da tarefa.');
  const columns = db.exec('PRAGMA table_info("viajantes")')[0]?.values ?? [];
  const correctSchema = columns.length === FIELDS.length && columns.filter(c => Number(c[5]) > 0).length === 1 && FIELDS.every(field => {
    const column = columns.find(c => String(c[1]).toLowerCase() === field);
    if (!column) return false;
    const type = String(column[2]).toUpperCase();
    return field === 'id' ? type.includes('INT') && Number(column[5]) === 1 : /CHAR|CLOB|TEXT/.test(type) && !type.includes('INT') && Number(column[3]) === 1;
  });
  if (!correctSchema) return reply(false, 'Confira a estrutura: id inteiro como única chave primária e nome, especie, origem, destino e historia como texto obrigatório (NOT NULL). Use o SQL de correção se precisar reconstruir.');
  if (stepId === 'criar-tabela') return reply(true, 'Estrutura conferida no SQLite: os seis campos e a chave primária estão corretos.');
  const actual = db.exec('SELECT id, nome, especie, origem, destino, historia FROM viajantes')[0]?.values ?? [];
  if (!rowsMatch(actual, values(FIELDS))) return reply(false, 'O cadastro precisa conter exatamente as três fichas da missão, incluindo histórias e ids. Compare os dados ou carregue o SQL de correção.');
  if (stepId === 'cadastrar') return reply(true, 'Os três viajantes foram cadastrados com todos os campos corretos.');
  const fields = stepId === 'consultar' ? FIELDS : ['id', 'nome'] as const;
  if (!result.tables.some(table => resultMatches(table, fields))) return reply(false, stepId === 'consultar'
    ? 'Os cadastros estão corretos, mas falta um resultado com os seis campos dos três viajantes. Execute SELECT * FROM viajantes;.'
    : 'Retorne somente id e nome dos três viajantes em um resultado. Esses ids ligarão os futuros documentos e exames ao cadastro.');
  return reply(true, stepId === 'consultar' ? 'Consulta conferida: os seis campos dos três viajantes apareceram no resultado.' : 'Identificadores conferidos. Você está pronto para entender os vínculos entre cadastros, documentos e exames.');
}
