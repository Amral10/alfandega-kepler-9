# Validação da Parte 3 — Nível médio

Conferência em 17/11/2026, com testes automatizados e build de produção servido por HTTP local. Sem publicação externa.

![Fila do nível médio concluída com 90 pontos](nivel-medio-concluido.jpg)

## Verificações automatizadas

Executados `npm run check`, `npm test` e `npm run build`. O conjunto anterior continua cobrindo a demonstração e o nível fácil. Os novos casos de `tests/medium.test.ts` e `tests/client.test.ts` verificam:

- Banco com seis viajantes e oito tabelas, sem gabarito consultável por SQL.
- Recursos SELECT, WHERE, AS, AND, OR, NOT, ORDER BY e LIMIT por objetivos com soluções de referência.
- SQL equivalente aceito e palavras em comentários, strings e identificadores sem crédito indevido.
- Prática de inserir, alterar efetivamente decisão/motivo, excluir e reinserir.
- Rascunho ausente ou duplicado impedindo confirmação; prazo expirado e viajante incorreto rejeitados.
- Confirmação idempotente, veredito único e histórico protegido.
- Seis decisões corretas produzindo 90 pontos e todos os recursos aprendidos.
- Veredito errado explicado e separado dos viajantes pendentes.
- Recuperação de checkpoint com fila, prática, dados e pontuação; reinício e troca de modo isolados.
- Rejeição de UPDATE/INSERT/DELETE em cadastros, PRAGMAs, esquema, gatilhos, ATTACH, VACUUM e transações explícitas.
- WITH somente de leitura funcionando e WITH de escrita recusado pelo SQLite.
- Scripts mistos atômicos, proteção contra REPLACE, UPSERT, nomes entre aspas e alterações de id.

## Percurso no navegador

| Fluxo | Resultado observado |
| --- | --- |
| Tutorial completo → continuar para médio | Atualização explicada; banco oficial carregado; conclusão do fácil preservada |
| Início do médio | Seis viajantes na fila, primeiro em atendimento e relógio em 15:00 |
| Investigação inicial e prática | INSERT, UPDATE com mudança, DELETE e reinserção liberaram a confirmação |
| Veredito deliberadamente errado | Feedback explicou aprovação esperada e fatos; marcou erro e zero pontos |
| Encerramento parcial | Separou um erro confirmado de cinco pendentes |
| Nova tentativa | Fila, prática, rascunhos e pontuação zerados, sem perder conclusão do tutorial |
| Script com INSERT válido seguido de UPDATE oficial | Script rejeitado inteiro; nenhum rascunho foi preservado |
| DELETE de decisão confirmada | Bloqueado; recibo e pontuação anteriores mantidos |
| Turno completo com decisões corretas | Seis acertos completos, nenhum erro, nenhum pendente e 90/90 pontos |
| Navegação para o resumo | Retorna ao topo para mostrar a pontuação sem preservar a rolagem do terminal |
| Seleção após concluir | Dois indicadores de conclusão nesta visita: fácil e médio |
| Consulta longa no novo turno | Timeout de cinco segundos preservou rascunho e etapa UPDATE da prática |
| Consulta após recuperação | Executou normalmente, sem reiniciar a prática ou a fila |
| Viewport 390 × 844 | Editor, resultado e controles utilizáveis, sem excesso de largura na página |

O prazo completo foi exercitado por timestamps nos testes, sem esperar quinze minutos no navegador. Não houve teste em aparelho físico nem avaliação dos tempos com jogadores. O progresso e as conclusões continuam somente em memória. Os avisos de módulos Node externalizados do adaptador sql.js permanecem conhecidos; o worker e o WASM local foram carregados e executados no navegador.
