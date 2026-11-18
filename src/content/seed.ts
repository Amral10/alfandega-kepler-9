import type { Database } from 'sql.js';
import { demo } from './demo';
import { SCHEMA_SQL } from './schema';

export function seedDemo(db: Database): void {
  db.run(SCHEMA_SQL);
  for (const traveler of demo.travelers) {
    db.run('INSERT INTO viajantes VALUES (?, ?, ?, ?, ?, ?)', [traveler.id, traveler.nome, traveler.especie, traveler.origem, traveler.destino, traveler.historia]);
    db.run('INSERT INTO documentos VALUES (?, ?, ?, ?, ?)', [traveler.id, traveler.id, `K9-00${traveler.id}`, traveler.nome, '2187-12-31']);
    db.run('INSERT INTO vistos VALUES (?, ?, ?, ?)', [traveler.id, traveler.id, traveler.destino, traveler.id === 2 ? '2186-06-01' : '2186-12-31']);
    db.run('INSERT INTO analises_biologicas VALUES (?, ?, ?, ?)', [traveler.id, traveler.id, 1, '2186-06-14']);
    db.run('INSERT INTO exames VALUES (?, ?, ?, ?, ?, ?)', [traveler.id, traveler.id, 'Febre de Íon', 'negativo', '2186-06-14', '2186-06-30']);
    db.run('INSERT INTO viagens VALUES (?, ?, ?, ?)', [traveler.id, traveler.id, traveler.origem, '2186-06-10']);
  }
  db.run("INSERT INTO restricoes VALUES (1, 'Europa', 'visto', 'Visto válido para o destino na data de referência.'), (2, 'Titã', 'visto', 'Visto válido para o destino na data de referência.')");
}
