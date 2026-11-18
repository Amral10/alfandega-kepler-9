# Prompt 4 de 5 — Implementar o nível avançado

## Como executar este prompt
Você é o Codex trabalhando no repositório Alfândega Kepler-9. Implemente a etapa descrita neste arquivo: escreva o código, integre a interface e valide o resultado. Não se limite a propor um plano.

Antes de alterar arquivos, leia as instruções aplicáveis em `AGENTS.md`, examine a estrutura, os scripts e o estado do Git. Preserve alterações existentes do usuário. Reutilize a arquitetura e as dependências presentes; se faltar uma decisão técnica, escolha uma opção simples e documente o motivo. Leia os arquivos das etapas anteriores para manter os contratos, mas implemente somente o escopo desta etapa. Se um pré-requisito estiver ausente, informe o bloqueio concreto em vez de simular uma funcionalidade pronta.

Toda a interface e o conteúdo educativo devem estar em português brasileiro. Use SQL real, dados fictícios e feedback compreensível para iniciantes. As inspirações são SQLNoir e jogos de fiscalização de fronteiras, com identidade visual e narrativa próprias.

## Sua missão
Implemente o terceiro nível, no qual o jogador precisa cruzar tabelas, agrupar registros e eliminar duplicidades para investigar viajantes. Reutilize o fluxo de fiscalização e as proteções da Parte 3.

## Implemente nesta etapa
1. Prepare um banco do nível avançado com relações de um para muitos, datas consistentes e pelo menos seis novos viajantes com histórias e destinos distintos. Aumente as informações verificadas sem tornar as regras ambíguas.
2. Crie casos com múltiplos vistos, exame obrigatório ausente, destinos repetidos no histórico, divergência documental e exigência de um conjunto completo de exames. Use uma data de referência fixa e explícita.
3. Distribua os fatos entre tabelas para que uma consulta simples a uma única tabela não resolva toda a investigação. Não inclua uma coluna pronta com o resultado esperado.
4. Introduza `INNER JOIN`, `LEFT JOIN`, `GROUP BY`, agregações, `HAVING` e `DISTINCT` com exemplos contextualizados e dicas graduais. Crie objetivos obrigatórios para junções, agrupamento e distinção, separados da avaliação do veredito.
5. Avalie o resultado sem exigir uma consulta literal. Quando um objetivo exigir um recurso SQL específico, analise a estrutura da consulta de forma robusta, sem aceitar palavras em comentários ou strings como prova de uso. Explique essa exigência ao jogador.
6. Prepare consultas de referência e resultados esperados para cada caso. Trate valores nulos, registros ausentes, datas de validade e multiplicação de linhas nas junções. Garanta que contagens não sejam infladas por relacionamentos de um para muitos.
7. Mantenha `INSERT INTO`, `UPDATE` e `DELETE` em vereditos provisórios, confirmação, bloqueio de registros finalizados e feedback com evidências.
8. Configure tempo próprio, resumo de objetivos aprendidos e resultado da campanha. Permita reiniciar o nível sem misturar bancos ou estados de outras etapas.

## Verifique para considerar concluído
- Existem casos reais para `JOIN`, `GROUP BY` e `DISTINCT`, com objetivos e soluções verificáveis.
- Os casos de registros ausentes e dados duplicados produzem decisões corretas.
- Consultas equivalentes funcionam e menções a comandos em comentários não satisfazem objetivos.
- Os três níveis podem ser percorridos em sequência, com progresso e encerramento coerentes.

## Validação e entrega ao terminar
Execute os testes pertinentes aos comportamentos alterados e o build disponível. Faça uma verificação da interface no navegador quando houver essa capacidade; se não houver, informe a limitação. Corrija falhas encontradas. Atualize a documentação com os comandos reais de execução e as decisões tomadas. Não declare testes, publicação ou validações que não foram realizados.

Confira o diff e versione somente os arquivos desta etapa, sem incluir segredos, dependências instaladas ou mudanças alheias. Use o repositório Git válido existente. Neste ambiente, se o Git padrão continuar indisponível e `.git-local` existir, use `git --git-dir=.git-local --work-tree=.` como prefixo dos comandos. Não reinicialize nem substitua o histórico existente. Crie um commit com a mensagem indicada abaixo. Se o commit estiver bloqueado, explique o motivo e preserve as alterações.

Na resposta final, resuma o que implementou, como executar e validar, os testes realizados, eventuais pendências e o hash do commit. Encerre após esta etapa e informe qual arquivo contém a próxima.

Mensagem do commit: `feat: implementa investigacoes SQL do nivel avancado`.

Próximo prompt: [parte-05-validacao-publicacao.md](parte-05-validacao-publicacao.md).
