# Prompt 2 de 5 — Implementar o nível fácil

## Como executar este prompt
Você é o Codex trabalhando no repositório Alfândega Kepler-9. Implemente a etapa descrita neste arquivo: escreva o código, integre a interface e valide o resultado. Não se limite a propor um plano.

Antes de alterar arquivos, leia as instruções aplicáveis em `AGENTS.md`, examine a estrutura, os scripts e o estado do Git. Preserve alterações existentes do usuário. Reutilize a arquitetura e as dependências presentes; se faltar uma decisão técnica, escolha uma opção simples e documente o motivo. Leia os arquivos das etapas anteriores para manter os contratos, mas implemente somente o escopo desta etapa. Se um pré-requisito estiver ausente, informe o bloqueio concreto em vez de simular uma funcionalidade pronta.

Toda a interface e o conteúdo educativo devem estar em português brasileiro. Use SQL real, dados fictícios e feedback compreensível para iniciantes. As inspirações são SQLNoir e jogos de fiscalização de fronteiras, com identidade visual e narrativa próprias.

## Sua missão
Com a fundação da Parte 1 funcionando, implemente um tutorial jogável em que o jogador cria o banco do zero com instruções prontas e conhece as informações dos viajantes.

## Implemente nesta etapa
1. Ao iniciar o nível fácil, crie um banco vazio, sem tabelas de jogo preexistentes. Não reutilize o banco de demonstração.
2. Apresente uma sequência guiada: conhecer o posto, criar a tabela de viajantes com `CREATE TABLE`, cadastrar viajantes com `INSERT INTO` e conferir cadastros com `SELECT`. Apresente tipos, colunas, chave primária e relações básicas com exemplos curtos.
3. Cada objetivo deve ter explicação, SQL de exemplo utilizável, dica gradual e validação. Avalie o esquema e os dados reais do banco, aceitando diferenças de caixa, espaços e SQL equivalente. Para objetivos de consulta, confira também o resultado obtido, não apenas a presença de dados cadastrados.
4. Inclua pelo menos três viajantes com histórias, espécies, origens e destinos diferentes. Apresente identidade, documentos, visto, análise biológica e exames, mesmo quando as tabelas complementares forem apenas introduzidas para os próximos níveis.
5. Adicione um glossário acessível durante o tutorial com nomes dos campos, significado e valores possíveis. Mantenha exemplos e nomes compatíveis com o modelo da Parte 1.
6. Permita corrigir SQL sem perder a partida. Só avance quando o objetivo estiver satisfeito. Não contabilize um objetivo repetidamente ao reexecutar comandos.
7. Use um limite próprio de tempo, configurável e documentado como valor inicial para testes. Ao expirar, encerre a interação e ofereça reinício. Ao concluir, mostre os conteúdos aprendidos e a entrada para o próximo nível, se disponível.
8. Preserve o modo de demonstração e os componentes compartilhados que já funcionam.

## Verifique para considerar concluído
- O nível começa sem tabelas do jogo e pode ser concluído somente pelas instruções exibidas.
- Soluções SQL equivalentes avançam e soluções com esquema ou dados incorretos não avançam.
- Erros, conclusão, tempo esgotado e reinício funcionam sem reaproveitar progresso indevido.
- O jogador encontra a explicação de todas as informações dos viajantes.

## Validação e entrega ao terminar
Execute os testes pertinentes aos comportamentos alterados e o build disponível. Faça uma verificação da interface no navegador quando houver essa capacidade; se não houver, informe a limitação. Corrija falhas encontradas. Atualize a documentação com os comandos reais de execução e as decisões tomadas. Não declare testes, publicação ou validações que não foram realizados.

Confira o diff e versione somente os arquivos desta etapa, sem incluir segredos, dependências instaladas ou mudanças alheias. Use o repositório Git válido existente. Neste ambiente, se o Git padrão continuar indisponível e `.git-local` existir, use `git --git-dir=.git-local --work-tree=.` como prefixo dos comandos. Não reinicialize nem substitua o histórico existente. Crie um commit com a mensagem indicada abaixo. Se o commit estiver bloqueado, explique o motivo e preserve as alterações.

Na resposta final, resuma o que implementou, como executar e validar, os testes realizados, eventuais pendências e o hash do commit. Encerre após esta etapa e informe qual arquivo contém a próxima.

Mensagem do commit: `feat: implementa tutorial SQL do nivel facil`.

Próximo prompt: [parte-03-nivel-medio.md](parte-03-nivel-medio.md).
