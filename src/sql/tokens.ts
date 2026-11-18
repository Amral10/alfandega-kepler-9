/** Apenas vocabulário de SQL já compilado pelo SQLite; não substitui as permissões do banco. */
export function sqlWords(sql: string): string[] {
  const words: string[] = [];
  let i = 0;
  while (i < sql.length) {
    if (sql.startsWith('--', i)) { while (i < sql.length && !/[\r\n]/.test(sql[i])) i++; }
    else if (sql.startsWith('/*', i)) { const end = sql.indexOf('*/', i + 2); i = end < 0 ? sql.length : end + 2; }
    else if ("'\"`[".includes(sql[i])) {
      const quote = sql[i] === '[' ? ']' : sql[i]; i++;
      while (i < sql.length) {
        if (sql[i++] === quote) { if (quote !== ']' && sql[i] === quote) i++; else break; }
      }
      // Marcador impede reconhecer ORDER 'texto' BY como uma expressão ORDER BY.
      words.push('<quoted>');
    } else if (/[a-z_]/i.test(sql[i])) {
      const start = i++;
      while (i < sql.length && /[a-z0-9_$]/i.test(sql[i])) i++;
      words.push(sql.slice(start, i).toUpperCase());
    } else { if ('(),'.includes(sql[i])) words.push(sql[i]); i++; }
  }
  return words;
}
export function hasSqlFeature(words: string[], feature: string): boolean {
  if (feature === 'INNER JOIN') return words.some((w,i) => w === 'JOIN' && !['LEFT','RIGHT','FULL','CROSS','OUTER'].includes(words[i-1]));
  if (feature === 'LEFT JOIN') return words.some((w,i) => w === 'LEFT' && (words[i+1] === 'JOIN' || (words[i+1] === 'OUTER' && words[i+2] === 'JOIN')));
  if (feature === 'COUNT') return words.some((word, i) => word === 'COUNT' && words[i + 1] === '(');
  const parts = feature.split(' ');
  return words.some((_, i) => parts.every((word, j) => words[i + j] === word));
}
