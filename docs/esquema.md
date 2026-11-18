# Esquema de dados

A definição executável está em `src/content/schema.ts`. Os tipos TypeScript estão em `src/game/types.ts`. O cenário inicial é preenchido em `src/content/seed.ts` a partir dos viajantes de `src/content/demo.ts`.

| Tabela | Colunas | Finalidade |
| --- | --- | --- |
| `viajantes` | `id`, `nome`, `especie`, `origem`, `destino`, `historia` | Cadastro e narrativa do viajante |
| `documentos` | `id`, `viajante_id`, `numero`, `nome_registrado`, `validade` | Identidade documental; número único |
| `vistos` | `id`, `viajante_id`, `destino`, `validade` | Permissões por destino |
| `analises_biologicas` | `id`, `viajante_id`, `compativel`, `data` | Compatibilidade biológica |
| `exames` | `id`, `viajante_id`, `doenca`, `resultado`, `data`, `validade` | Resultados de exames fictícios |
| `viagens` | `id`, `viajante_id`, `destino`, `data` | Histórico de destinos |
| `restricoes` | `id`, `destino`, `tipo`, `descricao` | Regras por destino |
| `vereditos` | `id`, `viajante_id`, `aprovado`, `motivo`, `registrado_em`, `confirmado` | Decisões a serem avaliadas nos próximos níveis |

## Bancos por modo

A demonstração continua preenchendo as oito tabelas. O médio instala outra versão dessas oito tabelas, com seis viajantes, sete documentos e os demais registros de fiscalização. O nível fácil começa sem tabelas de usuário, e o jogador cria apenas `viajantes`, com os seis campos do contrato compartilhado. O catálogo interno `sqlite_schema` já existe no SQLite e não representa uma tabela de jogo pré-carregada.

No fácil, o glossário apresenta as outras tabelas como conteúdo futuro; ele não as cria no banco. As validações e o progresso do tutorial ficam em JavaScript, sem tabelas de respostas. O esquema completo acima permanece como referência para a demonstração e os próximos níveis.

## Convenções

- `id`: chave primária inteira em todas as tabelas.
- `viajante_id`: chave estrangeira obrigatória para `viajantes.id`. Cada viajante pode ter vários registros relacionados. A engine ativa `foreign_keys` antes de cada script.
- Todos os campos definidos são obrigatórios; as únicas colunas com valor padrão são `registrado_em` e `confirmado`.
- Datas do cenário: texto ISO `AAAA-MM-DD`, comparável lexicograficamente quando os valores seguem o formato. SQLite não valida esse formato automaticamente neste esquema inicial.
- Data narrativa de referência: `2186-06-15`. As regras de validade devem comparar com a data do cenário, não com a data real do computador.
- `compativel`, `aprovado` e `confirmado`: inteiro `0` ou `1`, com restrição `CHECK`.
- `resultado`: `negativo` ou `positivo`, com restrição `CHECK`.
- `motivo`: `regular`, `identidade`, `visto`, `biologia` ou `exame`, com restrição `CHECK`. Esses códigos serão apresentados com descrições em português no fluxo de vereditos.
- `registrado_em`: padrão `CURRENT_TIMESTAMP` do SQLite para auditoria de execução; não substitui a data narrativa usada nas regras de validade.

## Cenário de demonstração

Lia Azevedo, humana da Terra, segue para Europa. Oryn Tal, neriano de Nereida, segue para Titã. Suri Venn, aureliana de Aurora, segue para Europa. Todos possuem documento, visto, análise, exame e registro de viagem. O visto de Oryn venceu em `2186-06-01`; os demais vencem em `2186-12-31`.

Existem duas regras de visto na tabela `restricoes`. A tabela `vereditos` começa vazia. Nenhuma tabela armazena decisão esperada ou pontuação. A demonstração apresenta os dados para exploração e não avalia a entrada dos viajantes.

A demonstração permite alterações livres. No médio, as permissões e os gatilhos do banco isolado restringem a escrita aos rascunhos do viajante atual. O índice parcial `veredito_final_unico` garante um veredito confirmado por viajante; rascunhos duplicados podem existir, mas impedem a confirmação até serem corrigidos.

## Atualização oficial do nível médio

`src/content/medium.ts` mantém os dados do novo banco. Os três primeiros viajantes reaparecem com cadastros atualizados, e Ivo Renn, Nami Sol e Tess Aru completam a fila. As verificações são progressivas por atendimento. Em `restricoes`, o id identifica o número do atendimento e a descrição contém o regulamento completo aplicável àquela posição; destinos podem se repetir.

As datas permanecem ISO, com referência fixa em 15/06/2186. Oryn tem visto vencido. Suri tem análise incompatível, exigida a partir do terceiro atendimento. Ivo possui um documento recente com nome divergente e outro correto vencido. Nami tem exame positivo, com saúde exigida a partir do quinto atendimento. Lia e Tess atendem aos requisitos ativos. Esses casos ficam documentados para manutenção e são reavaliados a partir dos fatos, sem coluna SQL com o resultado esperado.

Os mesmos nomes e colunas são usados nos SELECTs e no banco isolado de rascunhos. Este último não contém as tabelas oficiais nem se conecta a elas; os registros finais são publicados no banco principal apenas por código interno validado. O estado da fila, aprendizado, avaliação esperada e pontuação não cria novas tabelas consultáveis.

## Protocolo avançado

As oito tabelas são reutilizadas com seis novos viajantes, múltiplos vistos/documentos/exames e viagens repetidas. `restricoes` lista, para cada destino, duas linhas com `tipo = exame` e a doença exigida em `descricao`. Borin possui outro exame que não substitui a Síndrome Nebular ausente. Ena tem exames duplicados da mesma doença. Fenn combina dois vistos e três viagens, gerando seis linhas em uma junção, mas apenas dois destinos distintos.

O motivo `historico` foi acrescentado aos tipos e aos CHECKs de vereditos. A referência continua 15/06/2186. Todas as regras estão ativas desde o primeiro viajante avançado. Ayla, Ena e Fenn são aprováveis; Borin falha em exames, Cira em histórico e Daren em identidade. Essas conclusões são calculadas pelo avaliador e não são colunas de tabela.
