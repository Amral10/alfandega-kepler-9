# Prompt 3 de 5 — Implementar o nível médio

## Como executar este prompt
Você é o Codex trabalhando no repositório Alfândega Kepler-9. Implemente a etapa descrita neste arquivo: escreva o código, integre a interface e valide o resultado. Não se limite a propor um plano.

Antes de alterar arquivos, leia as instruções aplicáveis em `AGENTS.md`, examine a estrutura, os scripts e o estado do Git. Preserve alterações existentes do usuário. Reutilize a arquitetura e as dependências presentes; se faltar uma decisão técnica, escolha uma opção simples e documente o motivo. Leia os arquivos das etapas anteriores para manter os contratos, mas implemente somente o escopo desta etapa. Se um pré-requisito estiver ausente, informe o bloqueio concreto em vez de simular uma funcionalidade pronta.

Toda a interface e o conteúdo educativo devem estar em português brasileiro. Use SQL real, dados fictícios e feedback compreensível para iniciantes. As inspirações são SQLNoir e jogos de fiscalização de fronteiras, com identidade visual e narrativa próprias.

## Sua missão
Implemente o primeiro nível de fiscalização completo sobre a base existente. Ao entrar, explique narrativamente que uma atualização oficial substituiu o banco do tutorial por um banco completo e preenchido.

## Implemente nesta etapa
1. Substitua o banco somente na entrada do nível, preservando o progresso de conclusão do tutorial. Prepare pelo menos seis viajantes com histórias e destinos diferentes, incluindo casos aprováveis e casos de recusa.
2. Exiba uma fila e um viajante atual. Forneça regulamento com data de referência fixa e critérios inequívocos de identidade, visto, destino, compatibilidade biológica e doenças fictícias. Introduza as verificações progressivamente.
3. Crie objetivos práticos para `SELECT`, `WHERE`, `AS`, `AND`, `OR`, `NOT`, `ORDER BY` e `LIMIT`. Inclua exemplos e acesso ao esquema. Valide resultados e objetivos sem exigir uma string SQL idêntica à solução de referência.
4. Faça o jogador usar `INSERT INTO` na tabela `vereditos` para registrar viajante, aprovação e motivo. Permita `UPDATE` para corrigir e `DELETE` para remover um registro provisório. Crie tarefas guiadas que exercitem essas operações.
5. Inclua confirmação explícita do atendimento. Antes de confirmar, valide o vínculo com o viajante atual e a existência de exatamente um veredito provisório válido. Depois de confirmar, bloqueie sua edição e exclusão e avance a fila uma única vez.
6. Proteja os cadastros oficiais contra escrita e permita apenas as alterações previstas em vereditos do viajante em atendimento. Use controles do mecanismo SQL ou isolamento equivalente; não dependa apenas de verificar o primeiro termo de uma consulta. Considere scripts com vários comandos, comandos de esquema e transações para impedir alteração de registros protegidos.
7. Avalie decisão e motivo contra regras fora do banco consultável. Defina códigos de motivo documentados, com descrições em português, evitando exigir uma frase livre exata.
8. Mostre feedback após a confirmação com os fatos relevantes. Configure duração própria para o nível e pontuação determinística documentada, separando acertos, erros e viajantes pendentes. Encerre por fim da fila ou tempo esgotado.

## Verifique para considerar concluído
- A transição cria o banco atualizado e mantém a conclusão do nível anterior.
- O fluxo investigar, inserir, corrigir ou excluir, confirmar e avançar funciona.
- Confirmações repetidas e SQL com múltiplos comandos não permitem mudar dados oficiais ou vereditos finalizados.
- Todos os recursos SQL previstos têm objetivos verificáveis e soluções de referência.
- Vereditos certos e errados recebem feedback coerente; encerramento e reinício restauram o estado correto.

## Validação e entrega ao terminar
Execute os testes pertinentes aos comportamentos alterados e o build disponível. Faça uma verificação da interface no navegador quando houver essa capacidade; se não houver, informe a limitação. Corrija falhas encontradas. Atualize a documentação com os comandos reais de execução e as decisões tomadas. Não declare testes, publicação ou validações que não foram realizados.

Confira o diff e versione somente os arquivos desta etapa, sem incluir segredos, dependências instaladas ou mudanças alheias. Use o repositório Git válido existente. Neste ambiente, se o Git padrão continuar indisponível e `.git-local` existir, use `git --git-dir=.git-local --work-tree=.` como prefixo dos comandos. Não reinicialize nem substitua o histórico existente. Crie um commit com a mensagem indicada abaixo. Se o commit estiver bloqueado, explique o motivo e preserve as alterações.

Na resposta final, resuma o que implementou, como executar e validar, os testes realizados, eventuais pendências e o hash do commit. Encerre após esta etapa e informe qual arquivo contém a próxima.

Mensagem do commit: `feat: implementa fiscalizacao e vereditos do nivel medio`.

Próximo prompt: [parte-04-nivel-avancado.md](parte-04-nivel-avancado.md).
