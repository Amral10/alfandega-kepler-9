export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;
CREATE TABLE viajantes (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  especie TEXT NOT NULL,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  historia TEXT NOT NULL
);
CREATE TABLE documentos (
  id INTEGER PRIMARY KEY,
  viajante_id INTEGER NOT NULL REFERENCES viajantes(id),
  numero TEXT NOT NULL UNIQUE,
  nome_registrado TEXT NOT NULL,
  validade TEXT NOT NULL
);
CREATE TABLE vistos (
  id INTEGER PRIMARY KEY,
  viajante_id INTEGER NOT NULL REFERENCES viajantes(id),
  destino TEXT NOT NULL,
  validade TEXT NOT NULL
);
CREATE TABLE analises_biologicas (
  id INTEGER PRIMARY KEY,
  viajante_id INTEGER NOT NULL REFERENCES viajantes(id),
  compativel INTEGER NOT NULL CHECK(compativel IN (0, 1)),
  data TEXT NOT NULL
);
CREATE TABLE exames (
  id INTEGER PRIMARY KEY,
  viajante_id INTEGER NOT NULL REFERENCES viajantes(id),
  doenca TEXT NOT NULL,
  resultado TEXT NOT NULL CHECK(resultado IN ('negativo', 'positivo')),
  data TEXT NOT NULL,
  validade TEXT NOT NULL
);
CREATE TABLE viagens (
  id INTEGER PRIMARY KEY,
  viajante_id INTEGER NOT NULL REFERENCES viajantes(id),
  destino TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE TABLE restricoes (
  id INTEGER PRIMARY KEY,
  destino TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL
);
CREATE TABLE vereditos (
  id INTEGER PRIMARY KEY,
  viajante_id INTEGER NOT NULL REFERENCES viajantes(id),
  aprovado INTEGER NOT NULL CHECK(aprovado IN (0, 1)),
  motivo TEXT NOT NULL CHECK(motivo IN ('regular', 'identidade', 'visto', 'biologia', 'exame', 'historico')),
  registrado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmado INTEGER NOT NULL DEFAULT 0 CHECK(confirmado IN (0, 1))
);
`;

export const TABLES = [
  { name: 'viajantes', fields: 'id · nome · especie · origem · destino · historia' },
  { name: 'documentos', fields: 'id · viajante_id · numero · nome_registrado · validade' },
  { name: 'vistos', fields: 'id · viajante_id · destino · validade' },
  { name: 'analises_biologicas', fields: 'id · viajante_id · compativel · data' },
  { name: 'exames', fields: 'id · viajante_id · doenca · resultado · data · validade' },
  { name: 'viagens', fields: 'id · viajante_id · destino · data' },
  { name: 'restricoes', fields: 'id · destino · tipo · descricao' },
  { name: 'vereditos', fields: 'id · viajante_id · aprovado · motivo · registrado_em · confirmado' },
] as const;
