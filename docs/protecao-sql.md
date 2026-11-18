# Proteção SQL nos níveis de fiscalização

## Fronteira protegida

A política protege cadastros oficiais, vereditos de outros viajantes e linhas já confirmadas contra comandos enviados pelo editor. A aplicação continua local e seu código é inspecionável: essa política não pretende impedir alguém de alterar a aplicação pelo DevTools. O gabarito e a pontuação não são armazenados no banco SQL do jogador.

## Duas conexões, uma publicação validada

1. Cada execução abre uma cópia do último checkpoint. As consultas rodam nessa cópia com `PRAGMA query_only = ON`, imposto pelo SQLite.
2. Instruções de escrita rodam em outro banco, que contém **somente vereditos**. Esse banco nunca recebe cadastros oficiais e não tem banco anexado.
3. Gatilhos `BEFORE INSERT`, `BEFORE UPDATE` e `BEFORE DELETE` aceitam apenas rascunhos do viajante atual. Eles recusam atribuir `confirmado = 1`, trocar o viajante, editar ids de rascunhos ou alterar/excluir decisões confirmadas.
4. `recursive_triggers` é ativado pelo aplicativo, para que substituições por `INSERT OR REPLACE` também acionem a proteção de exclusão. O jogador não pode mudar essa configuração.
5. Antes de publicar os vereditos, o aplicativo compara as linhas protegidas antes/depois e valida os vínculos dos rascunhos. Somente então copia os vereditos de volta por uma operação interna. Os dados oficiais nunca são copiados do banco de escrita, pois nem existem nele.
6. O checkpoint e o estado da prática só são substituídos depois de **todas** as instruções concluírem. Qualquer falha descarta o script inteiro, incluindo alterações provisórias feitas antes do erro.

O primeiro termo de uma instrução serve apenas para encaminhá-la depois que o SQLite a separa e compila. A autorização efetiva depende da conexão somente de leitura, do isolamento dos dados, dos gatilhos e das invariantes verificadas antes da publicação. Não é uma permissão baseada apenas em procurar palavras na string.

## Comandos e transações

O médio aceita SELECT, WITH de leitura e INSERT INTO/UPDATE/DELETE em vereditos. WITH que tenta escrever no banco oficial falha pela política do SQLite. PRAGMA, ATTACH, VACUUM, mudanças de esquema e comandos explícitos de transação são recusados. Uma PRAGMA pode agir já na compilação, mas age apenas na cópia descartável: a instrução é recusada e nenhum checkpoint é publicado.

Uma escrita que usa subconsulta também só enxerga vereditos. Para conferir identidade, visto, análise ou exames, execute um SELECT separado. Scripts continuam podendo combinar consultas e várias escritas suportadas, de forma atômica.

## Confirmação e recuperação

Só a operação interna de confirmação pode definir `confirmado = 1`. Ela exige id do atendimento atual, prazo não expirado, investigação concluída, prática concluída e exatamente um rascunho válido. O banco principal tem ainda índice único parcial para decisões finalizadas por viajante.

A confirmação registra um recibo no estado JavaScript e incrementa a fila. Repetir um id já confirmado devolve o estado existente, sem duplicar pontuação ou confirmar outra pessoa. O checkpoint externo ao worker inclui banco e estado da fila: cancelar ou expirar uma execução restaura ambos, em vez de reiniciar atendimentos ou carregar o cenário de demonstração.

## Referências e alcance

Os testes de `tests/medium.test.ts` exercitam escritas oficiais, comandos de esquema, PRAGMA, WITH de escrita, transações, scripts mistos, confirmação por SQL, viajante incorreto, decisões confirmadas, REPLACE e UPSERT. `tests/client.test.ts` verifica a recuperação de fila, prática e pontos.

Referências oficiais: [query_only e PRAGMAs](https://www.sqlite.org/pragma.html#pragma_query_only), [ON CONFLICT e REPLACE](https://www.sqlite.org/lang_conflict.html) e [gatilhos e RAISE](https://www.sqlite.org/lang_createtrigger.html).

Os limites de tempo, linhas e texto não são um limite rígido de memória para qualquer expressão SQLite. A persistência guarda o checkpoint e o estado juntos; a restauração verifica integridade, cenário oficial e coerência dos vereditos antes de aceitar o banco. Há um limite de 4 MB por banco publicado, 32 colunas e 200 mil caracteres exibidos por execução.
