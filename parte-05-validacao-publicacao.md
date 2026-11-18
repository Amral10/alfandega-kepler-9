# Prompt 5 de 5 — Finalizar, validar e preparar a publicação

## Como executar este prompt
Você é o Codex trabalhando no repositório Alfândega Kepler-9. Implemente a etapa descrita neste arquivo: escreva o código, integre a interface e valide o resultado. Não se limite a propor um plano.

Antes de alterar arquivos, leia as instruções aplicáveis em `AGENTS.md`, examine a estrutura, os scripts e o estado do Git. Preserve alterações existentes do usuário. Reutilize a arquitetura e as dependências presentes; se faltar uma decisão técnica, escolha uma opção simples e documente o motivo. Leia os arquivos das etapas anteriores para manter os contratos, mas implemente somente o escopo desta etapa. Se um pré-requisito estiver ausente, informe o bloqueio concreto em vez de simular uma funcionalidade pronta.

Toda a interface e o conteúdo educativo devem estar em português brasileiro. Use SQL real, dados fictícios e feedback compreensível para iniciantes. As inspirações são SQLNoir e jogos de fiscalização de fronteiras, com identidade visual e narrativa próprias.

## Sua missão
Com os três níveis implementados, finalize a primeira versão distribuível de Alfândega Kepler-9. Corrija problemas encontrados e produza uma entrega executável e documentada.

## Implemente nesta etapa
1. Revise a campanha inteira, textos, regulamentos, datas, dados, dicas, consultas de referência e justificativas. Corrija inconsistências pedagógicas e de funcionamento.
2. Implemente salvamento local com versão do formato. Salve progresso, nível, estado necessário do banco, vereditos e referência temporal. Restaure sem misturar versões ou bancos; trate dados ausentes, corrompidos ou incompatíveis com mensagem e opção de reinício.
3. Defina e documente a política de tempo ao sair ou recarregar. Recomendação inicial: o tempo continua transcorrendo enquanto a partida estiver ativa, inclusive fora da aba. Garanta que a restauração não reinicie o relógio nem permita ações após a expiração.
4. Consolide resultados por nível e da campanha, distinguindo acertos, erros, pendências e objetivos SQL concluídos. Implemente reinício do nível e de toda a campanha com comportamento claro.
5. Revise layout em desktop e telas menores, contraste, navegação por teclado, foco, rótulos e leitura dos resultados SQL. Corrija bloqueios de uso encontrados.
6. Revise limites de consultas, recuperação após execução interrompida e proteção de cadastros e vereditos confirmados. Garanta que interromper uma consulta não apague silenciosamente o progresso.
7. Execute verificações automatizadas adequadas para tutorial, vereditos, consultas avançadas, cronômetro e persistência. Faça uma partida completa, incluindo erros de SQL, tempo esgotado, correção de vereditos, recarga e reinício.
8. Avalie os tempos e a dificuldade por partidas de teste. Registre o que foi testado por você e o que ainda precisa de avaliação com usuários; não apresente estimativas como resultados de testes reais.
9. Gere o build de produção e verifique carregamento dos recursos e do mecanismo SQL a partir desse build. Prepare configuração e instruções para uma hospedagem compatível. Se já houver destino configurado e autorização para publicação, publique e confira o endereço; caso contrário, entregue o build e documente o passo pendente sem inventar uma URL.
10. Atualize o README com instalação, desenvolvimento, testes, build, arquitetura, esquema, criação de cenários, duração dos níveis, persistência, limitações e publicação. Inclua instruções para o Git alternativo se `.git-local` ainda for necessário neste ambiente.

## Verifique para considerar concluído
- A campanha completa funciona no build de produção e não possui bloqueios conhecidos de conclusão.
- As soluções de referência e os resultados dos cenários foram verificados.
- Recarga, expiração e reinício preservam as regras de tempo e progresso.
- Os comandos da documentação correspondem aos scripts reais.
- O relatório diferencia claramente verificações executadas, limitações e eventual publicação pendente.

## Validação e entrega ao terminar
Execute os testes pertinentes aos comportamentos alterados e o build disponível. Faça uma verificação da interface no navegador quando houver essa capacidade; se não houver, informe a limitação. Corrija falhas encontradas. Atualize a documentação com os comandos reais de execução e as decisões tomadas. Não declare testes, publicação ou validações que não foram realizados.

Confira o diff e versione somente os arquivos desta etapa, sem incluir segredos, dependências instaladas ou mudanças alheias. Use o repositório Git válido existente. Neste ambiente, se o Git padrão continuar indisponível e `.git-local` existir, use `git --git-dir=.git-local --work-tree=.` como prefixo dos comandos. Não reinicialize nem substitua o histórico existente. Crie um commit com a mensagem indicada abaixo. Se o commit estiver bloqueado, explique o motivo e preserve as alterações.

Na resposta final, resuma o que implementou, como executar e validar, os testes realizados, eventuais pendências e o hash do commit. Encerre após esta etapa e informe qual arquivo contém a próxima.

Mensagem do commit: `feat: finaliza campanha e prepara versao de distribuicao`.

Esta é a última etapa. Informe o estado final da entrega e qualquer pendência concreta.
