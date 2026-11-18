import type { Statement } from 'sql.js';
import type { Cell, ResultTable } from './protocol';
export function displayCell(value: unknown): Cell {
  if (value instanceof Uint8Array) return `[binário: ${value.length} bytes]`;
  if (typeof value === 'string') return value.length > 4000 ? `${value.slice(0, 4000)}… [texto reduzido]` : value;
  return typeof value === 'number' ? value : null;
}
export function collectStatement(statement: Statement, budget: { remaining: number; characters?:number }): ResultTable | null {
  const columns = statement.getColumnNames();
  if(columns.length>32)throw new Error('Mostre no máximo 32 colunas por resultado.');
  budget.characters ??= 200000;
  const rows: Cell[][] = [];
  let truncated = false;
  while (statement.step()) {
    if (columns.length && budget.remaining > 0) { rows.push(statement.get().map(value=>{
      const cell=displayCell(value);
      if(typeof cell!=='string')return cell;
      const available=Math.max(0,budget.characters!);budget.characters!-=Math.min(cell.length,available);
      if(cell.length>available){truncated=true;return cell.slice(0,available)+'…';}
      return cell;
    })); budget.remaining--; }
    else if (columns.length) { truncated = true; break; }
  }
  return columns.length ? { columns, rows, truncated } : null;
}
export function equivalentResult(actual: ResultTable, expected: Cell[][]): boolean {
  if (actual.truncated || actual.rows.length !== expected.length || !expected.length || actual.columns.length !== expected[0].length) return false;
  const permutations = (xs: number[]): number[][] => xs.length ? xs.flatMap((x, i) => permutations(xs.filter((_, j) => i !== j)).map(tail => [x, ...tail])) : [[]];
  const normalize = (rows: Cell[][]) => JSON.stringify(rows.map(r => JSON.stringify(r)).sort());
  return permutations(expected[0].map((_, i) => i)).some(order => normalize(actual.rows.map(row => order.map(i => row[i]))) === normalize(expected));
}
