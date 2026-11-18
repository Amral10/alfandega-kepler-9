export function explainSqlError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Ocorreu uma falha ao executar o comando.';
  if (message.includes('no such table:')) return `Tabela não encontrada: ${message.split('no such table:')[1].trim()}. Confira o esquema do banco.`;
  if (message.includes('no such column:')) return `Coluna não encontrada: ${message.split('no such column:')[1].trim()}. Confira os campos da tabela.`;
  if (message.includes('syntax error')) return `Há um erro de sintaxe no comando. Confira a escrita e a ordem das palavras. Detalhe do SQLite: ${message}`;
  if (message.includes('FOREIGN KEY constraint failed')) return 'O registro faz referência a um viajante que não existe ou ainda possui registros relacionados.';
  if (message.includes('constraint failed')) return `Um valor não atende às regras da tabela. Detalhe do SQLite: ${message}`;
  return message;
}
