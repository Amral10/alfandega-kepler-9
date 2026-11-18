import type { Scenario } from '../game/types';

export const demo: Scenario = {
  id: 'demonstracao-01',
  title: 'Primeiro contato',
  referenceDate: '2186-06-15',
  briefing: 'O terminal acaba de ser instalado. Antes da abertura oficial da alfândega, conheça os registros de três viajantes e confira se a conexão com o banco está funcionando.',
  travelers: [
    { id: 1, nome: 'Lia Azevedo', especie: 'Humana', origem: 'Terra', destino: 'Europa', historia: 'Engenheira de sistemas a caminho dos observatórios sob o gelo. Traz uma carta da equipe que a espera em Europa.' },
    { id: 2, nome: 'Oryn Tal', especie: 'Neriano', origem: 'Nereida', destino: 'Titã', historia: 'Botânico que transporta sementes de sua lua natal. Pretende iniciar uma estufa na colônia de Titã.' },
    { id: 3, nome: 'Suri Venn', especie: 'Aureliana', origem: 'Aurora', destino: 'Europa', historia: 'Cartógrafa em sua primeira viagem ao sistema. Busca os registros de uma antiga expedição científica.' },
  ],
};

export const EXAMPLES = [
  { title: 'Todos os viajantes', sql: 'SELECT id, nome, especie, origem, destino\nFROM viajantes;' },
  { title: 'Quem vai para Europa?', sql: "SELECT nome, origem\nFROM viajantes\nWHERE destino = 'Europa'\nORDER BY nome;" },
  { title: 'Consultar os vistos', sql: 'SELECT viajante_id, destino, validade\nFROM vistos\nORDER BY validade;' },
];
