import type { Database } from 'sql.js';
import type { Traveler } from '../game/types';
import type { Investigation } from './medium';
import { SCHEMA_SQL } from './schema';
export const ADVANCED_DATE = '2186-06-15';
export const ADVANCED_TRAVELERS: readonly Traveler[] = [
  { id: 1, nome: 'Ayla Nox', especie: 'Auriana', origem: 'Auriga', destino: 'Europa', historia: 'Engenheira de marés que recebeu versões diferentes de seu visto após uma mudança de contrato.' },
  { id: 2, nome: 'Borin Kael', especie: 'Calíxio', origem: 'Calyx', destino: 'Io', historia: 'Mineralogista que apresenta vários documentos de saúde, mas não sabe se o laboratório realizou todos os exames exigidos em Io.' },
  { id: 3, nome: 'Cira Lys', especie: 'Liriana', origem: 'Lira', destino: 'Titã', historia: 'Mensageira que percorreu rotas repetidas antes de chegar à estação. Seu histórico precisa ser conferido por destinos distintos.' },
  { id: 4, nome: 'Daren Vox', especie: 'Humana', origem: 'Ceres', destino: 'Marte', historia: 'Mecânico com documentos antigos e recentes. A grafia de seu nome mudou durante uma reemissão.' },
  { id: 5, nome: 'Ena Ril', especie: 'Miridiana', origem: 'Mir', destino: 'Encélado', historia: 'Médica com exames repetidos feitos por laboratórios diferentes. Viaja para atender uma base sob o gelo.' },
  { id: 6, nome: 'Fenn Ori', especie: 'Velariano', origem: 'Vela', destino: 'Ganímedes', historia: 'Técnico de navegação com vários vistos e passagens repetidas pelos mesmos portos. Solicita entrada em Ganímedes.' },
];
export function advancedRules(): string[] {
  return [
    'Referência fixa: 15/06/2186. Validade igual à referência é aceita.',
    'Identidade: deve existir documento com nome correspondente ao cadastro e validade aceita.',
    'Visto: deve existir pelo menos um visto válido para o destino solicitado. Vistos antigos ou de outros destinos não substituem esse requisito.',
    'Biologia: deve existir análise compatível realizada até a referência.',
    'Saúde: cada doença listada em restricoes (tipo exame) para o destino exige um exame negativo realizado até a referência e ainda válido. Repetições do mesmo exame contam uma única vez.',
    'Histórico: no máximo dois destinos distintos no histórico completo. Viagens repetidas ao mesmo local contam uma vez. Histórico vazio conta zero.',
    'Se tudo estiver regular, aprove com motivo regular. Caso contrário, negue pela primeira falha: identidade, visto, biologia, exame, historico.',
  ];
}
export const ADVANCED_INVESTIGATIONS: readonly Investigation[] = [
  { title: 'Cruzar cadastro e vistos', explanation: 'INNER JOIN liga registros de tabelas diferentes. Cruze viajantes e vistos e retorne nome, destino do visto e validade apenas dos vistos válidos para o destino de Ayla. Há vistos antigos e para outro local.', required: ['INNER JOIN', 'WHERE'], sql: `SELECT v.nome, vi.destino, vi.validade FROM viajantes v\nINNER JOIN vistos vi ON vi.viajante_id = v.id\nWHERE v.id = 1 AND vi.destino = v.destino AND vi.validade >= '${ADVANCED_DATE}';`, hints: ['Ligue viajantes.id a vistos.viajante_id com INNER JOIN.', 'Um visto só serve se destino e validade corresponderem ao pedido.', 'A condição vi.destino = v.destino evita aceitar um visto válido para outro local.'] },
  { title: 'Encontrar o exame ausente', explanation: 'LEFT JOIN preserva o registro da esquerda mesmo sem correspondência. Cruze as doenças exigidas para Io com os exames de Borin. Retorne nome, doença exigida e resultado para os requisitos sem exame válido; resultado NULL indica ausência.', required: ['LEFT JOIN', 'WHERE'], sql: `SELECT v.nome, r.descricao AS doenca_exigida, e.resultado\nFROM viajantes v INNER JOIN restricoes r ON r.destino=v.destino AND r.tipo='exame'\nLEFT JOIN exames e ON e.viajante_id=v.id AND e.doenca=r.descricao AND e.resultado='negativo' AND e.data<='${ADVANCED_DATE}' AND e.validade>='${ADVANCED_DATE}'\nWHERE v.id=2 AND e.id IS NULL;`, hints: ['Comece pelas restrições do destino; não comece pelos exames existentes.', 'Os filtros do exame válido ficam no ON do LEFT JOIN para preservar os requisitos ausentes.', 'e.id IS NULL seleciona as doenças que ficaram sem correspondência.'] },
  { title: 'Separar destinos de viagens', explanation: 'DISTINCT elimina repetições. Consulte os destinos distintos das viagens de Cira. O limite do posto é de dois destinos diferentes, independentemente da quantidade de viagens.', required: ['DISTINCT', 'WHERE'], sql: 'SELECT DISTINCT destino FROM viagens WHERE viajante_id=3 ORDER BY destino;', hints: ['SELECT DISTINCT destino devolve uma linha por local.', 'Filtre viajante_id=3 antes de comparar o histórico com a regra.', 'O número de viagens não é o número de destinos distintos.'] },
  { title: 'Confrontar as identidades', explanation: 'Use INNER JOIN entre cadastro e documentos válidos de Daren. Retorne nome do cadastro e nome_registrado. Um documento antigo com nome correto pode estar vencido.', required: ['INNER JOIN', 'WHERE'], sql: `SELECT v.nome, d.nome_registrado FROM viajantes v\nINNER JOIN documentos d ON d.viajante_id=v.id\nWHERE v.id=4 AND d.validade>='${ADVANCED_DATE}';`, hints: ['Ligue o documento ao viajante pelo id, sem comparar o nome no ON.', 'Filtre validade aceita e observe os dois nomes lado a lado.', 'Se filtrar nomes iguais antes de mostrar a divergência, o resultado ficará vazio.'] },
  { title: 'Conferir o conjunto de exames', explanation: 'GROUP BY reúne registros por viajante; COUNT agrega; HAVING filtra o grupo. Conte as doenças exigidas com exame válido de Ena, usando COUNT(DISTINCT e.doenca), e retorne nome e quantidade apenas quando ambas estiverem cobertas. Duplicatas de exames não podem inflar a contagem.', required: ['JOIN', 'GROUP BY', 'COUNT', 'DISTINCT', 'HAVING'], sql: `SELECT v.nome, COUNT(DISTINCT e.doenca) AS exames_validos\nFROM viajantes v INNER JOIN exames e ON e.viajante_id=v.id\nINNER JOIN restricoes r ON r.destino=v.destino AND r.tipo='exame' AND r.descricao=e.doenca\nWHERE v.id=5 AND e.resultado='negativo' AND e.data<='${ADVANCED_DATE}' AND e.validade>='${ADVANCED_DATE}'\nGROUP BY v.id,v.nome HAVING COUNT(DISTINCT e.doenca)=2;`, hints: ['Conte doenças distintas, não linhas de exames nem ids de exames.', 'O JOIN com restricoes limita a contagem às doenças realmente exigidas pelo destino.', 'HAVING é aplicado depois do agrupamento. A duplicação de Febre de Íon deve continuar contando uma doença.'] },
  { title: 'Agregar sem multiplicar evidências', explanation: 'Um viajante com vários vistos e viagens gera várias linhas na junção. Cruze os vistos válidos de Fenn com seu histórico e retorne nome e quantidade de destinos distintos, agrupando e aceitando até dois. LEFT JOIN mantém também quem não tem histórico.', required: ['LEFT JOIN', 'GROUP BY', 'COUNT', 'DISTINCT', 'HAVING'], sql: `SELECT v.nome, COUNT(DISTINCT h.destino) AS destinos\nFROM viajantes v INNER JOIN vistos vi ON vi.viajante_id=v.id\nLEFT JOIN viagens h ON h.viajante_id=v.id\nWHERE v.id=6 AND vi.destino=v.destino AND vi.validade>='${ADVANCED_DATE}'\nGROUP BY v.id,v.nome HAVING COUNT(DISTINCT h.destino)<=2;`, hints: ['Dois vistos e três viagens podem produzir seis linhas.', 'COUNT(DISTINCT h.destino) mede locais, mesmo quando a junção repete registros.', 'Confira também os dois exames, o documento e a biologia antes de inserir o veredito.'] },
];
export function seedAdvanced(db: Database): void {
  db.run(SCHEMA_SQL);
  for (const t of ADVANCED_TRAVELERS) {
    db.run('INSERT INTO viajantes VALUES(?,?,?,?,?,?)', [t.id,t.nome,t.especie,t.origem,t.destino,t.historia]);
    db.run('INSERT INTO documentos VALUES(?,?,?,?,?)', [t.id,t.id,`K9-A${t.id}`,t.id===4?'Daren Voss':t.nome,'2187-12-31']);
    db.run('INSERT INTO vistos VALUES(?,?,?,?)', [t.id,t.id,t.destino,'2187-01-01']);
    db.run('INSERT INTO analises_biologicas VALUES(?,?,?,?)', [t.id,t.id,1,'2186-06-14']);
    db.run('INSERT INTO exames VALUES(?,?,?,?,?,?)', [t.id,t.id,'Febre de Íon','negativo','2186-06-14','2186-06-30']);
    db.run('INSERT INTO exames VALUES(?,?,?,?,?,?)', [t.id+10,t.id,t.id===2?'Resfriado de Plasma':'Síndrome Nebular','negativo','2186-06-14','2186-06-30']);
    for (const [offset,disease] of ['Febre de Íon','Síndrome Nebular'].entries()) db.run('INSERT INTO restricoes VALUES(?,?,?,?)', [t.id*2+offset,t.destino,'exame',disease]);
  }
  db.run("INSERT INTO vistos VALUES(7,1,'Europa','2185-01-01'),(8,1,'Titã','2187-12-31'),(9,6,'Ganímedes','2187-12-31')");
  db.run("INSERT INTO documentos VALUES(7,4,'K9-A4-ANTIGO','Daren Vox','2185-12-31')");
  db.run("INSERT INTO exames VALUES(30,5,'Febre de Íon','negativo','2186-06-13','2186-07-01')");
  ['Terra','Terra','Marte','Europa'].forEach((dest,i)=>db.run('INSERT INTO viagens VALUES(?,?,?,?)',[i+1,3,dest,'2186-06-10']));
  ['Vela','Vela','Ceres'].forEach((dest,i)=>db.run('INSERT INTO viagens VALUES(?,?,?,?)',[i+10,6,dest,'2186-06-10']));
  db.run('CREATE UNIQUE INDEX veredito_final_unico ON vereditos(viajante_id) WHERE confirmado=1');
}
