# Arquitetura — Versão 1.0

## Fronteiras de responsabilidade

| Módulo | Responsabilidade |
| --- | --- |
| `src/main.ts` | Integra telas, eventos, relógio e cliente SQL; bloqueia execução fora de uma sessão ativa |
| `src/ui/view.ts` | Renderiza o estado, escapa conteúdo e apresenta tabelas, fichas, manual e histórico |
| `src/game/session.ts` | Estados apresentação/em andamento/encerrada, durações e tempo real decorrido |
| `src/game/types.ts` | Contratos de níveis, cenário, viajantes e registros das oito tabelas |
| `src/game/evaluation.ts` | Compara decisão e motivo contra um gabarito recebido; não acessa SQL |
| `src/ui/tutorial-view.ts` | Apresentação, tarefas, dicas, glossário e resumo do nível fácil |
| `src/ui/html.ts` | Escape compartilhado de conteúdo para HTML |
| `src/content/` | Cenário determinístico, esquema completo e conteúdo dos objetivos do tutorial |
| `src/game/tutorial.ts` | Progresso em memória, dicas e avanço condicionado à validação e ao relógio |
| `src/game/tutorial-validation.ts` | Consulta esquema e dados reais e compara os resultados de cada tarefa |
| `src/sql/protocol.ts` | Mensagens e limites compartilhados entre interface e worker |
| `src/sql/client.ts` | Mantém checkpoint, serializa operações, aplica timeout e recria worker |
| `src/sql/worker.ts` | Carrega o WASM local e atende inicialização e execução |
| `src/sql/engine.ts` | Cria cópia do banco, executa comandos, coleta resultados e publica checkpoint após sucesso |
| `src/content/medium.ts` | Seis viajantes, atualização oficial, regras progressivas e consultas de referência |
| `src/game/medium.ts` | Estado serializável da fila, rascunhos, recursos aprendidos e recibos |
| `src/game/medium-evaluation.ts` | Avalia os fatos oficiais e aplica a ordem de motivos após a confirmação |
| `src/sql/medium-engine.ts` | Coordena consultas, prática, publicação atômica e confirmação idempotente |
| `src/sql/medium-guard.ts` | Banco isolado de escrita, gatilhos e invariantes de registros protegidos |
| `src/sql/tokens.ts` | Reconhece vocabulário do SQL compilado, ignorando comentários e trechos entre aspas |
| `src/sql/results.ts` | Coleta e compara resultados e limita a apresentação de células |
| `src/ui/medium-view.ts` | Apresentação, fila, regulamento, prática, revisão e resultado do médio |
| `src/sql/errors.ts` | Explica erros comuns do SQLite em português |

## Execução e recuperação

Ao assumir o posto, o cliente cria um worker e solicita a inicialização. O worker monta o cenário da demonstração, cria um banco vazio para o fácil ou instala o banco oficial do médio e devolve o banco serializado; esse checkpoint permanece na memória da interface. Só então a sessão começa a contar tempo.

Para cada execução, a engine abre uma cópia do checkpoint e executa as instruções reais do script. Resultados respeitam o orçamento compartilhado de linhas; erros descartam a cópia. Scripts com uma transação explícita ainda aberta são rejeitados, evitando que uma exportação reverta dados silenciosamente.

Ao concluir, a engine exporta o banco e o cliente substitui o checkpoint anterior. Cancelar ou expirar o tempo de execução encerra o worker e restaura a última versão concluída. Durante a recuperação, novas consultas e reinício ficam bloqueados. IDs de requisição impedem que respostas antigas sejam aceitas como a operação atual.

O SQLite executa em memória no worker; seu checkpoint é salvo localmente pela interface. O cenário só contém dados fictícios. Não há backend, autenticação ou integração externa. A validação do tutorial fica em JavaScript no worker, fora do banco SQL. Nenhuma tabela contém critérios de aprovação de objetivos ou gabaritos de vereditos. A avaliação dos vereditos também fica fora de tabelas SQL, e seus fatos esperados são calculados no worker a partir dos dados oficiais somente após a confirmação.

## Evolução prevista

A Parte 2 acrescentou os modos `demo` e `facil` à inicialização e recuperação, além dos objetivos guiados. O resultado SQL pode incluir uma validação da tarefa atual. A interface aceita somente a validação correspondente à tarefa ativa; avançar exige tempo disponível e conta cada objetivo uma única vez. A Parte 3 implementou a atualização de banco, fila, escrita isolada, investigação e prática guiadas, confirmação, avaliação e recuperação do estado do médio. A Parte 4 ampliou dados e validação de objetivos. A Parte 5 adicionou persistência versionada e distribuição.

Não reutilize o modo de escrita livre da demonstração como política de acesso dos níveis de fiscalização. Antes de liberar esses níveis, teste scripts com vários comandos, transações e comandos de esquema contra as permissões efetivas.

## Contrato de validação do tutorial

Os exemplos e textos ficam em `src/content/tutorial.ts`; os ids das tarefas identificam as verificações do worker. A criação é avaliada por `sqlite_schema` e `PRAGMA table_info`: seis campos, afinidades SQLite adequadas, campos de texto obrigatórios e uma única chave primária. O cadastro é comparado com as três fichas completas.

Os objetivos de consulta exigem também um resultado completo da execução atual. A comparação ignora a ordem de linhas e aceita permutações de colunas e aliases, mas conserva as tuplas de cada viajante para não aceitar valores trocados entre registros. Os testes cobrem SQL equivalente, resultados parciais, dados incorretos e alterações posteriores dentro do mesmo script.

Validar um objetivo como falso não transforma SQL válido em erro nem descarta sua escrita: o jogador pode corrigir os dados. Erros de execução continuam descartando o script inteiro. O cliente mantém o modo ao restaurar o worker, evitando que o banco fácil receba os dados iniciais da demonstração.

O progresso, as dicas e o indicador de conclusão vivem fora do SQL e são persistidos junto ao checkpoint. Nova tentativa cria um `TutorialProgress`, um `Session` e um banco novos. Ao concluir todos os objetivos, a sessão encerra com motivo `concluido`; expirar ou encerrar manualmente não marca o nível como concluído.

## Checkpoints do médio

A recuperação do worker leva juntos os bytes do banco e um `MediumState`: índice da fila, investigação, etapa de prática, rascunhos, recursos aprendidos e recibos de vereditos confirmados. Esse estado vive no cliente, fora do SQL. Restaurar apenas os bytes de um banco médio é rejeitado, pois perderia o vínculo com a fila e a pontuação.

`confirm` recebe o id do viajante esperado e o prazo do turno. O worker verifica o prazo e o atendimento atual, reconsulta o rascunho, avalia as regras e marca a linha como confirmada. Repetir o mesmo id devolve o estado existente, sem avançar nem pontuar de novo. A interface bloqueia ações fora da sessão ativa; a confirmação verifica o prazo também no worker.

As investigações exigem recursos indicados e resultados equivalentes aos exemplos oficiais. O SQLite compila e executa a consulta; o reconhecimento de recursos não atribui significado a comentários, strings ou identificadores entre aspas. A prática de escrita exige mudanças reais e estado final coerente. Só uma etapa de prática pode avançar por execução.

A política de isolamento do banco e suas limitações estão em [proteção SQL](protecao-sql.md).

## Fiscalização compartilhada e nível avançado

`src/content/inspection.ts` seleciona viajantes, tarefas, regras e inicialização por modo. `MediumEngine` e `medium-view.ts` mantêm o nome por compatibilidade, mas atendem médio e avançado sem duplicar a política de escrita. O estado inclui a tag `level`; restaurar um checkpoint de outro nível é recusado.

`src/content/advanced.ts` fornece os novos casos e as consultas de referência. `src/game/advanced-evaluation.ts` confere documentos, vistos, biologia, cobertura de doenças exigidas e destinos distintos. A avaliação usa EXISTS e contagens distintas para não confundir ausência com duplicação. Os objetivos de consulta e o veredito são avaliados separadamente.

O reconhecedor estrutural usa SQL compilado pelo SQLite e tokens sem comentários/strings. Reconhece LEFT OUTER JOIN como LEFT JOIN, JOIN simples como INNER JOIN e exige parêntese após COUNT para não dar crédito a um alias com esse nome. A equivalência de resultados continua independente da escrita literal da solução.

## Persistência e campanha

`src/game/persistence.ts` serializa o estado em um envelope único de `localStorage`, formato 1/conteúdo 1.0, com checksum FNV de detecção de corrupção acidental. O banco vira base64; o payload inclui modo, timestamp absoluto inicial, fase, tutorial, estado de fiscalização, editor e histórico limitado. Não salva consultas em andamento nem resultados visuais completos. A gravação ocorre após transições e operações concluídas, antes de executar SQL, após edição com debounce e nos eventos de saída/ocultação.

Enquanto um worker executa, o salvamento conserva seu último checkpoint concluído. Se o turno foi encerrado durante a operação, salva a fase encerrada sem revivê-lo. A inicialização bloqueia ações até restaurar e conferir o banco. `Session.restore` reaplica a diferença entre timestamps; um prazo vencido encerra imediatamente o turno.

O carregamento valida versões, formato, enums, prefixo de tarefas, duração configurada, timestamps e tags de nível. `src/sql/checkpoint.ts` aplica `quick_check`, limite de 4 MB, compara esquema e cadastros oficiais com o cenário canônico e confere recibos/rascunhos contra vereditos. Conteúdo incompatível não é mesclado com outro banco. Falhas mostram aviso e deixam os dados intactos até o usuário optar por uma nova partida ou reinício. O formato não é uma barreira contra manipulação pelo dono do navegador.

`src/game/campaign.ts` registra de forma idempotente a última tentativa encerrada por nível, com pontos, acertos, erros, pendências e objetivos. Mantém separadamente as conclusões históricas. `src/ui/campaign-view.ts` consolida o tutorial e os dois turnos, sem somar tarefas educativas à pontuação de vereditos. Reiniciar a campanha descarta worker, banco, sessão e resultados; uma confirmação modal evita acionamento acidental.

O build usa caminhos relativos (`vite.config.ts`). `scripts/verify-build.mjs` verifica os recursos gerados e `scripts/package.py` produz ZIP com manifesto SHA-256 e revisão HEAD. Consulte [publicação](publicacao.md).
