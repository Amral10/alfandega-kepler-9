# Orientações para o Codex — Alfândega Kepler-9

## Contexto e objetivo
Alfândega Kepler-9 é um jogo educativo de SQL para navegador. O jogador atua como fiscal de uma estação espacial, consulta dados de viajantes e registra decisões de entrada com justificativas. As referências são SQLNoir e jogos de fiscalização de fronteiras; crie narrativa, interface e recursos visuais próprios.

A interface, as explicações, as dicas e os feedbacks devem estar em português brasileiro. Use personagens, espécies, doenças e documentos fictícios. Ensine os conceitos progressivamente, com exemplos executáveis e mensagens compreensíveis para iniciantes.

## Estado inicial e fonte de verdade
Na criação deste guia, o projeto contém os cinco prompts de desenvolvimento e a configuração de versionamento; a aplicação ainda não foi implementada. Confira o estado real dos arquivos antes de trabalhar. Não trate funcionalidades planejadas como existentes.

Os prompts detalham o escopo e os critérios de aceite de cada etapa. Este arquivo reúne as orientações comuns. Siga as instruções atuais do usuário e as instruções aplicáveis do ambiente; em caso de divergência entre documentos do projeto, registre a decisão adotada.

## Sequência de execução
| Ordem | Prompt | Entrega |
| --- | --- | --- |
| 1 | [parte-01-fundacao.md](parte-01-fundacao.md) | Aplicação web, interface, SQL real e base compartilhada |
| 2 | [parte-02-nivel-facil.md](parte-02-nivel-facil.md) | Tutorial que começa com banco vazio |
| 3 | [parte-03-nivel-medio.md](parte-03-nivel-medio.md) | Fiscalização, consultas e registro de vereditos |
| 4 | [parte-04-nivel-avancado.md](parte-04-nivel-avancado.md) | Investigações com junções e agregações |
| 5 | [parte-05-validacao-publicacao.md](parte-05-validacao-publicacao.md) | Persistência, acabamento, validação e distribuição |

Quando solicitado a executar uma etapa, leia o prompt correspondente e os contratos das etapas anteriores. Implemente a etapa até seus critérios de conclusão, sem avançar automaticamente para a seguinte. Se faltar uma dependência essencial, identifique exatamente o que falta; não simule sua existência. Se o usuário pedir toda a implementação, siga a sequência completa.

## Regras do jogo
- Cada nível tem um limite próprio de tempo, configurável e documentado. Os valores iniciais são estimativas até serem avaliados em partidas.
- O relógio começa após a apresentação. Ao encerrar ou expirar, bloqueie novas ações de jogo e apresente o resultado. Reiniciar deve restaurar o estado correto.
- No fácil, o jogador cria o banco do zero com instruções prontas, aprende `CREATE TABLE`, `INSERT INTO` e `SELECT` e conhece os campos dos viajantes.
- No médio, uma atualização oficial substitui o banco do tutorial por uma versão preenchida. Ensine `SELECT`, `WHERE`, `AS`, operadores lógicos, `ORDER BY` e `LIMIT`; use `INSERT INTO`, `UPDATE` e `DELETE` para vereditos provisórios.
- No avançado, exija investigações com `JOIN`, `GROUP BY` e `DISTINCT`, introduzindo agregações e `HAVING` quando necessário.
- Inclua vários viajantes por nível, com informações, histórias e destinos diferentes. Aumente as verificações de identidade, visto, análise biológica e exames de forma progressiva.
- As regras precisam ser inequívocas, com datas de referência explícitas e evidências acessíveis. Avalie o veredito separadamente dos objetivos de aprendizagem SQL.

## Diretrizes técnicas
- Inspecione a estrutura e reutilize a stack existente. Na ausência de aplicação, a Parte 1 orienta iniciar uma stack web simples com TypeScript. Não imponha framework adicional sem necessidade.
- Execute SQLite real no navegador. Não substitua a execução por respostas prontas ou comparação literal de comandos.
- Separe interface, estado da partida, execução SQL, conteúdo dos cenários e avaliação. Use contratos claros e evite duplicação entre níveis.
- Execute SQL fora da thread da interface, limite resultados e permita interromper consultas demoradas com recuperação consistente do estado.
- O esquema compartilhado contempla `viajantes`, `documentos`, `vistos`, `analises_biologicas`, `exames`, `viagens`, `restricoes` e `vereditos`. Documente campos, relações e alterações de esquema.
- Mantenha o gabarito fora do banco acessível por SQL. Em uma aplicação cliente, isso não garante segredo contra inspeção do código.
- Nos níveis de fiscalização, proteja cadastros oficiais e vereditos confirmados. Restrinja escrita aos registros provisórios permitidos, inclusive em scripts com vários comandos e transações.
- Aceite consultas equivalentes. Quando o objetivo exigir um recurso específico, valide sua estrutura sem confundir comentários ou strings com comandos executados.
- Use dados determinísticos e consultas de referência verificáveis. Trate nulos, duplicidades e multiplicação de linhas em junções.
- A persistência da Parte 5 deve ter versão e tratamento de dados incompatíveis. Recarregar não pode reiniciar indevidamente o tempo nem misturar bancos de níveis.
- Mantenha layout adaptável, contraste, rótulos, foco visível e navegação por teclado.

## Fluxo de trabalho
1. Leia as instruções aplicáveis, o prompt solicitado e o estado do Git antes de editar.
2. Preserve alterações do usuário e trabalhe apenas no escopo solicitado. Não apague, sobrescreva ou reverta mudanças alheias.
3. Resolva escolhas rotineiras com uma solução simples e registre decisões relevantes. Peça informação apenas quando faltar algo essencial que não possa ser inferido do projeto.
4. Implemente comportamento funcional e integrado. Não encerre apenas com planejamento quando a solicitação for de implementação.
5. Execute as verificações pertinentes, revise o diff e atualize a documentação afetada.
6. Crie um commit da etapa concluída e informe o resultado e eventuais limitações.

## Validação
Use os scripts reais do projeto; ainda não há comandos de instalação, build ou teste definidos neste estado inicial. Documente-os ao criar a aplicação e mantenha o arquivo de lock consistente com o gerenciador escolhido.

Faça testes úteis para as regras alteradas, especialmente validação do tutorial, proteção de dados, confirmação de vereditos, consultas avançadas, cronômetro e persistência. Execute o build quando disponível e confira a interface no navegador quando houver capacidade. Para alterações somente documentais, confira links, consistência e `git diff --check`; não é necessário criar testes de aplicação.

Não declare verificações que não executou. Se uma dependência, ferramenta ou restrição impedir uma validação, relate o bloqueio concreto e o que permanece sem verificar.

## Versionamento
Use o repositório válido existente. Na criação deste guia, `.git` está somente para leitura e o histórico está em `.git-local`, na branch `main`. Confira essa condição antes de usar o caminho alternativo; não reinicialize, substitua ou remova o histórico.

Enquanto essa configuração persistir, execute na raiz:

```bash
git --git-dir=.git-local --work-tree=. status --short
git --git-dir=.git-local --work-tree=. diff --check
git --git-dir=.git-local --work-tree=. diff
git --git-dir=.git-local --work-tree=. add <arquivos-da-tarefa>
git --git-dir=.git-local --work-tree=. commit -m "tipo: descreve a alteracao"
git --git-dir=.git-local --work-tree=. log -1 --oneline
```

Adicione apenas arquivos relacionados à tarefa e confira também o diff preparado para commit. Não versione segredos, dependências instaladas, builds gerados ou os metadados de `.git-local`. Preserve as exclusões em `.gitignore`.

Os prompts fornecem as mensagens dos commits de implementação. Para ajustes documentais, use uma mensagem com prefixo `docs:`. Não faça push, reescrita de histórico ou publicação externa sem autorização correspondente. A existência de um commit local não significa sincronização com um remoto.

## Documentação e entrega
Mantenha este guia e os prompts coerentes com decisões relevantes, sem marcar como concluído o que ainda não funciona. Ao criar a aplicação, documente no README os comandos reais de instalação e execução, arquitetura, esquema e limitações; amplie as instruções conforme as etapas forem concluídas.

Na resposta final de cada tarefa, informe o que mudou, como foi validado, limitações concretas e hash do commit. Em tarefas de implementação, indique também como executar e qual é a próxima etapa. Só informe uma URL de publicação depois de publicá-la e verificá-la.
