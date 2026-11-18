# Prompt 1 de 5 — Implementar a fundação do jogo web

## Como executar este prompt
Você é o Codex trabalhando no repositório Alfândega Kepler-9. Implemente a etapa descrita neste arquivo: escreva o código, integre a interface e valide o resultado. Não se limite a propor um plano.

Antes de alterar arquivos, leia as instruções aplicáveis em `AGENTS.md`, examine a estrutura, os scripts e o estado do Git. Preserve alterações existentes do usuário. Reutilize a arquitetura e as dependências presentes; se faltar uma decisão técnica, escolha uma opção simples e documente o motivo. Leia os arquivos das etapas anteriores para manter os contratos, mas implemente somente o escopo desta etapa. Se um pré-requisito estiver ausente, informe o bloqueio concreto em vez de simular uma funcionalidade pronta.

Toda a interface e o conteúdo educativo devem estar em português brasileiro. Use SQL real, dados fictícios e feedback compreensível para iniciantes. As inspirações são SQLNoir e jogos de fiscalização de fronteiras, com identidade visual e narrativa próprias.

## Sua missão
Crie a base executável de um jogo educativo de SQL no navegador chamado Alfândega Kepler-9. O jogador trabalha em uma estação espacial e investiga viajantes para permitir ou negar sua entrada. A campanha terá três níveis com limites de tempo próprios: fácil para construir o banco, médio para fiscalizar e avançado para cruzar informações.

## Implemente nesta etapa
1. Se não houver aplicação, inicialize uma stack web simples com TypeScript, scripts de desenvolvimento e build e dependências fixadas em arquivo de lock. Se já houver stack, mantenha-a.
2. Crie uma interface com tema de posto espacial: início, seleção de nível, apresentação, posto de fiscalização, ajuda e resultado. No posto, organize ficha do viajante, regulamento, editor SQL, tabela de resultados, histórico e cronômetro. Identifique claramente os níveis ainda não implementados.
3. Integre um mecanismo SQLite real no navegador. Execute consultas fora da thread da interface, com limite de resultados e mecanismo para interromper consultas demoradas e recuperar o banco. Mostre erros sem derrubar a partida. Não simule resultados com correspondência de strings.
4. Separe módulos de interface, execução SQL, cenários, estado da partida e avaliação. Mantenha o gabarito fora do banco acessível por SQL; isso não implica ocultá-lo de quem inspeciona o código cliente.
5. Defina tipos e esquema para `viajantes`, `documentos`, `vistos`, `analises_biologicas`, `exames`, `viagens`, `restricoes` e `vereditos`. Use identificadores e chaves estrangeiras consistentes. Documente campos e relações.
6. Crie um pequeno cenário de demonstração técnica com viajantes fictícios de origens, espécies e destinos diferentes. Ele deve permitir consultar dados reais e reiniciar o banco sem recarregar a página.
7. Implemente o ciclo de estados: apresentação, em andamento e encerrada, com reinício. Configure durações por nível; o relógio começa após a apresentação e termina ao encerrar. Use tempo decorrido real para não depender da frequência de atualização da tela.
8. Garanta layout adaptável, rótulos, foco visível e operação básica por teclado.

## Verifique para considerar concluído
- A aplicação instala, inicia e gera build com comandos documentados.
- Uma consulta válida mostra linhas e colunas; uma inválida mostra erro recuperável.
- Reiniciar restaura os dados originais e o cronômetro.
- Consultas demoradas não deixam a interface permanentemente travada.
- O banco SQL não contém gabaritos e cada partida usa seu próprio estado.

## Validação e entrega ao terminar
Execute os testes pertinentes aos comportamentos alterados e o build disponível. Faça uma verificação da interface no navegador quando houver essa capacidade; se não houver, informe a limitação. Corrija falhas encontradas. Atualize a documentação com os comandos reais de execução e as decisões tomadas. Não declare testes, publicação ou validações que não foram realizados.

Confira o diff e versione somente os arquivos desta etapa, sem incluir segredos, dependências instaladas ou mudanças alheias. Use o repositório Git válido existente. Neste ambiente, se o Git padrão continuar indisponível e `.git-local` existir, use `git --git-dir=.git-local --work-tree=.` como prefixo dos comandos. Não reinicialize nem substitua o histórico existente. Crie um commit com a mensagem indicada abaixo. Se o commit estiver bloqueado, explique o motivo e preserve as alterações.

Na resposta final, resuma o que implementou, como executar e validar, os testes realizados, eventuais pendências e o hash do commit. Encerre após esta etapa e informe qual arquivo contém a próxima.

Mensagem do commit: `feat: implementa fundacao web e execucao SQL`.

Próximo prompt: [parte-02-nivel-facil.md](parte-02-nivel-facil.md).
