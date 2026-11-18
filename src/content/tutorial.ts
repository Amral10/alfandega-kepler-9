import { demo } from './demo';

export type TutorialStepId = 'banco-vazio' | 'criar-tabela' | 'cadastrar' | 'consultar' | 'relacionar';
export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  concept: string;
  instruction: string;
  expected: string;
  example: string;
  hints: readonly string[];
}
const literal = (text: string) => `'${text.replaceAll("'", "''")}'`;
export const CREATE_TRAVELERS_SQL = `CREATE TABLE viajantes (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  especie TEXT NOT NULL,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  historia TEXT NOT NULL
);`;
export const INSERT_TRAVELERS_SQL = `INSERT INTO viajantes (id, nome, especie, origem, destino, historia)
VALUES
${demo.travelers.map(t => `  (${[t.id, ...[t.nome, t.especie, t.origem, t.destino, t.historia].map(literal)].join(', ')})`).join(',\n')};`;

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: 'banco-vazio', title: 'Conferir o sistema vazio', concept: 'Banco, tabelas e consultas',
    instruction: 'Seu sistema começa sem tabelas. Um banco organiza tabelas; cada tabela reúne registros em linhas e campos em colunas. Consulte o catálogo sqlite_schema, que descreve a estrutura do SQLite. Ele existe mesmo em um banco vazio.',
    expected: 'Uma consulta ao catálogo com a coluna name, sem nenhuma linha: ainda não existe tabela de usuário.',
    example: "SELECT name FROM sqlite_schema\nWHERE type = 'table' AND name NOT LIKE 'sqlite_%';",
    hints: ['O catálogo sqlite_schema descreve as estruturas criadas no banco.', 'SELECT name escolhe o nome; FROM sqlite_schema escolhe o catálogo. O exemplo já filtra as tabelas de usuário.', 'Carregue o exemplo e execute. A tabela de resultados deve conter zero linhas, sem ser um erro.'],
  },
  {
    id: 'criar-tabela', title: 'Criar o cadastro de viajantes', concept: 'CREATE TABLE, tipos e chave primária',
    instruction: 'Crie viajantes com seis campos: id, nome, especie, origem, destino e historia. INTEGER guarda números inteiros e TEXT guarda texto. PRIMARY KEY identifica cada viajante sem repetição. NOT NULL torna os cinco campos de texto obrigatórios.',
    expected: 'Uma tabela real chamada viajantes, com id inteiro como única chave primária e os cinco campos de texto obrigatórios.',
    example: CREATE_TRAVELERS_SQL,
    hints: ['CREATE TABLE nome_da_tabela (...) define as colunas entre parênteses, separadas por vírgulas.', 'id deve ser INTEGER PRIMARY KEY. Cada outro campo deve ser TEXT NOT NULL.', 'Se já criou uma estrutura diferente, use o SQL de correção desta tarefa para reconstruí-la. Ele só é executado quando você escolher Executar SQL.'],
  },
  {
    id: 'cadastrar', title: 'Cadastrar os primeiros viajantes', concept: 'INSERT INTO e registros',
    instruction: 'Cadastre Lia Azevedo, Oryn Tal e Suri Venn com os dados das fichas da missão. INSERT INTO escolhe a tabela e as colunas; VALUES informa os valores na mesma ordem. Textos ficam entre aspas simples. Cada linha é um registro diferente.',
    expected: 'Exatamente três registros, com os seis campos iguais às fichas e ids 1, 2 e 3. O exemplo inclui as histórias completas.',
    example: INSERT_TRAVELERS_SQL,
    hints: ['Associe os valores à ordem declarada: id, nome, especie, origem, destino, historia.', 'O exemplo contém as três linhas prontas. Separe os grupos de valores por vírgulas e termine com ponto e vírgula.', 'Se cadastrou dados incorretos ou extras, carregue o SQL de correção. Ele limpa apenas viajantes e insere as três fichas novamente.'],
  },
  {
    id: 'consultar', title: 'Conferir todos os cadastros', concept: 'SELECT e resultados',
    instruction: 'Consulte os seis campos dos três viajantes. SELECT escolhe colunas, FROM escolhe a tabela e * significa todas as colunas. Agora confira o que o banco devolve: criar dados não substitui consultá-los.',
    expected: 'Um único resultado completo com os seis campos e as três fichas. A ordem das colunas e das linhas pode variar.',
    example: 'SELECT * FROM viajantes;',
    hints: ['Use SELECT e FROM para ler o cadastro que acabou de construir.', 'SELECT id, nome, especie, origem, destino, historia FROM viajantes também resolve.', 'Não limite a um viajante nem selecione só o nome. O objetivo pede os seis campos dos três registros.'],
  },
  {
    id: 'relacionar', title: 'Preparar as próximas verificações', concept: 'Identificadores e relações',
    instruction: 'Consulte apenas id e nome dos três viajantes. Em documentos, vistos, analises_biologicas, exames e viagens, viajante_id apontará para viajantes.id: essa é uma chave estrangeira. Um viajante poderá ter vários exames ou vistos. Conheça esses campos no glossário; as tabelas complementares serão adicionadas no próximo nível.',
    expected: 'Um resultado completo com duas colunas: id e nome, para os três viajantes. Não crie as tabelas futuras nesta tarefa.',
    example: 'SELECT id, nome FROM viajantes;',
    hints: ['O id é a identidade do registro, mesmo quando duas pessoas têm nomes parecidos.', 'Escolha id e nome em SELECT e informe viajantes em FROM.', 'Compare os ids nas fichas. Futuramente o mesmo número aparecerá em viajante_id nas tabelas relacionadas.'],
  },
];

export function correctionSql(step: TutorialStep): string {
  if (step.id === 'criar-tabela') return `DROP TABLE IF EXISTS viajantes;\n${CREATE_TRAVELERS_SQL}`;
  if (step.id === 'cadastrar') return `DELETE FROM viajantes;\n${INSERT_TRAVELERS_SQL}`;
  return `DROP TABLE IF EXISTS viajantes;\n${CREATE_TRAVELERS_SQL}\n${INSERT_TRAVELERS_SQL}\n${step.example}`;
}

export const GLOSSARY = [
  { field: 'id', meaning: 'Identificador inteiro e chave primária do viajante.', example: '1, 2 ou 3' },
  { field: 'nome', meaning: 'Nome usado no cadastro e na conferência de identidade.', example: 'Lia Azevedo' },
  { field: 'especie', meaning: 'Espécie fictícia; orienta verificações biológicas futuras.', example: 'Humana, Neriano ou Aureliana' },
  { field: 'origem', meaning: 'Planeta ou lua de onde o viajante veio.', example: 'Terra, Nereida ou Aurora' },
  { field: 'destino', meaning: 'Local de entrada solicitado pelo viajante.', example: 'Europa ou Titã' },
  { field: 'historia', meaning: 'Contexto narrativo e motivo da viagem, em texto.', example: 'Engenheira a caminho de observatórios' },
  { field: 'viajante_id', meaning: 'Chave estrangeira: liga um documento, visto ou exame ao id de um viajante.', example: '1 aponta para Lia' },
  { field: 'numero / nome_registrado', meaning: 'Número único e nome escrito no documento de identidade.', example: 'K9-001 / Lia Azevedo' },
  { field: 'validade / data', meaning: 'Datas em texto ISO; validade indica até quando algo pode ser usado e data indica quando ocorreu.', example: '2186-06-15 (AAAA-MM-DD)' },
  { field: 'vistos.destino', meaning: 'Destino autorizado pelo visto; deve corresponder ao destino solicitado.', example: 'Europa' },
  { field: 'compativel', meaning: 'Resultado da análise biológica para as condições do destino.', example: '1 = compatível; 0 = incompatível' },
  { field: 'doenca / resultado', meaning: 'Doença fictícia investigada e resultado de um exame infeccioso.', example: 'Febre de Íon / negativo ou positivo' },
  { field: 'viagens.destino / viagens.data', meaning: 'Local e data de cada viagem anterior; pode haver várias por viajante.', example: 'Terra / 2186-06-10' },
  { field: 'restricoes.tipo / descricao', meaning: 'Categoria e explicação de uma regra de entrada por destino.', example: 'visto / visto válido para Europa' },
  { field: 'aprovado / motivo', meaning: 'Veredito e código da justificativa, introduzidos no nível médio.', example: '0 ou 1 / regular, identidade, visto, biologia, exame' },
  { field: 'registrado_em / confirmado', meaning: 'Momento do registro do veredito e indicação de que ele foi finalizado.', example: 'timestamp / 0 ou 1' },
];
