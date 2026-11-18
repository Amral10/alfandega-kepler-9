# Alfândega Kepler-9

Jogo educativo de SQL no navegador, ambientado em um posto de fiscalização espacial. **Versão 1.0.0 — cinco etapas implementadas:** tutorial fácil, fiscalização média e avançada, campanha, salvamento local e distribuição estática.

## Executar

Requisitos: Node.js 20.19 ou superior e npm. A instalação inicial precisa de acesso ao registro npm.

```bash
npm ci
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://127.0.0.1:5173`. Na página inicial ou na seleção de níveis, escolha **Iniciar nível fácil**, leia a apresentação e inicie o tutorial. Para fiscalizar, escolha **Iniciar nível médio** ou continue pelo resumo do tutorial. Para explorar o banco pronto, escolha **Conhecer o terminal** e depois **Assumir o posto**.

```bash
npm run check   # checagem de tipos
npm test        # testes de SQL, tutorial, sessão, recuperação e avaliação
npm run build  # checagem de tipos e build estático em dist/
npm run preview # conferir o build em http://127.0.0.1:4173
npm run verify:build # conferir arquivos, worker, WASM e licença
npm run package # build e ZIP de distribuição; requer Python 3
```

O build inclui JavaScript, CSS e o SQLite WebAssembly localmente, além do aviso de licença de sql.js em `public/sqljs-license.txt`. Depois da instalação e do build, a aplicação não depende de CDN, API, conta ou banco remoto. Sirva o build por HTTP; abrir `index.html` diretamente por `file://` não é suportado.

## O que está disponível

- Início, seleção de níveis, apresentação, posto de fiscalização, manual e resultado da sessão.
- Três viajantes na demonstração/tutorial e seis em cada nível de fiscalização, com histórias, espécies, origens e destinos diferentes.
- Demonstração com oito tabelas relacionadas e data de referência de **15/06/2186**.
- Nível fácil com banco inicialmente vazio, cinco tarefas, exemplos completos, dicas graduais e glossário.
- Conferência do esquema, dos registros reais e dos resultados SQL, aceitando consultas equivalentes.
- Resumo de aprendizado e conclusão dos três níveis salvos neste navegador.
- Editor com exemplos, exploração do esquema, resultados tabulares e as 20 execuções mais recentes.
- SQLite real via sql.js, executado em um Web Worker.
- Erros explicados, cancelamento manual e limite automático de cinco segundos por execução.
- Recuperação do banco a partir da última execução concluída e reinício sem recarregar a página.
- Cronômetros separados: dez minutos na demonstração, vinte no fácil, quinze no médio e vinte no avançado.
- No médio: fila de atendimento, regulamento progressivo, rascunhos por SQL, confirmação, proteção de dados e feedback com pontuação.
- Salvamento versionado do banco, fila, vereditos, dicas, editor e relógio; retomada após recarga.
- Resumo da campanha com objetivos SQL, acertos, erros e pendências; reinício por nível ou de toda a campanha.
- Interface em português, navegação por teclado e layout adaptável.

Experimente:

```sql
SELECT nome, origem, destino
FROM viajantes
WHERE destino = 'Europa'
ORDER BY nome;
```

Use **Ctrl + Enter** ou **⌘ + Enter** no editor para executar. Na demonstração, a escrita no banco está liberada: alterar dados não produz pontuação nem vereditos avaliados. As fichas laterais apresentam o cenário original; os resultados SQL mostram o estado atual do banco.

## Como concluir o nível fácil

1. Consulte o catálogo e confira que o banco não tem tabelas de usuário.
2. Crie `viajantes` com os seis campos descritos na tarefa.
3. Insira os três viajantes usando os dados das fichas e o exemplo pronto.
4. Consulte os seis campos dos três registros.
5. Consulte `id` e `nome` e conheça as relações com documentos, vistos e exames no glossário.

Cada tarefa tem **Usar exemplo da tarefa**, três dicas graduais e um resultado esperado. Execute o SQL e, quando a conferência liberar, escolha **Próxima tarefa**. A última libera **Concluir nível fácil**. Executar o mesmo comando repetidamente não soma tarefas.

Uma instrução pode ser válida em SQL e ainda não satisfazer o objetivo. Nesse caso o terminal mostra o que falta, mantendo o banco para correção. **Preciso corrigir o cadastro** carrega SQL para reconstruir ou preencher somente o cadastro do exercício; confira e execute no editor. Corrigir não reinicia o relógio nem apaga tarefas concluídas.

O glossário e o mapa de tabelas apresentam os campos futuros. Neste nível só `viajantes` é criada pelo jogador: as outras sete tabelas não são pré-carregadas. A conclusão fica apenas em memória até recarregar a página; praticar de novo começa com cinco tarefas pendentes e banco vazio. O nível médio já está disponível pelo botão de continuação. A seleção também permite começar diretamente nele para praticar.

## Como jogar o nível médio

A atualização oficial substitui o banco do tutorial por oito tabelas preenchidas ao entrar no turno. A conclusão do fácil é preservada em memória. A fila tem seis viajantes e quinze minutos iniciais.

1. Leia a ficha e as regras do atendimento, com referência fixa em **15/06/2186**. Identidade e visto são obrigatórios desde o início; análise biológica passa a ser exigida no terceiro viajante e exame de Febre de Íon no quinto.
2. Execute a investigação proposta. Ela exige um resultado correto e os recursos SQL indicados, sem comparar a consulta com uma string literal. Comentários e textos entre aspas não contam como comandos.
3. Consulte documentos, vistos, análises e exames pelos atalhos e pelo esquema. A investigação guiada não substitui a conferência de todos os requisitos ativos.
4. Registre o rascunho em `vereditos`. No primeiro atendimento, pratique INSERT, uma alteração real de decisão/motivo com UPDATE, DELETE e nova inserção. Cada execução avança no máximo uma etapa. Nos demais atendimentos, basta inserir o rascunho e revisar.
5. Ajuste decisão e motivo antes de **Confirmar veredito e avançar**. A confirmação exige a investigação concluída, a prática concluída e exatamente um rascunho do viajante atual. A decisão passa a ser protegida, recebe avaliação e a fila avança uma vez.

Modelo de escrita — ajuste os valores ao caso, pois o modelo não é um gabarito:

```sql
INSERT INTO vereditos (viajante_id, aprovado, motivo)
VALUES (1, 1, 'regular');
```

| Código de motivo | Uso |
| --- | --- |
| `regular` | Todos os requisitos ativos foram atendidos |
| `identidade` | Nenhum documento reúne nome correspondente e validade aceita |
| `visto` | Nenhum visto atende ao destino e à validade |
| `biologia` | Não há análise compatível realizada até a referência |
| `exame` | Não há exame de Febre de Íon negativo com as datas exigidas |

Use `aprovado = 1` para permitir e `0` para negar. Se houver várias falhas, escolha a primeira na ordem identidade, visto, biologia, exame. `UPDATE` e `DELETE` continuam disponíveis para rascunhos até a confirmação; o botão de confirmação não pode ser substituído por `UPDATE confirmado = 1`.

| Avaliação por viajante | Pontos |
| --- | --- |
| Decisão correta | 10 |
| Motivo correto | 5 |
| Máximo por viajante / turno | 15 / 90 |

Acerto completo exige decisão e motivo corretos. Vereditos com qualquer erro aparecem na coluna de erros, mesmo se renderem pontos parciais. Viajantes não confirmados ficam pendentes, sem pontos e separados dos erros. Atender a fila inteira conclui o nível na campanha, independentemente da pontuação; o jogo não impõe nota mínima. Encerrar manualmente ou por tempo mostra o resultado parcial. Reiniciar cria novo banco, fila, prática e pontuação, preservando os indicadores de níveis já concluídos.

### Operações permitidas no médio

Consultas `SELECT` e `WITH` de leitura acessam os cadastros completos. `INSERT INTO`, `UPDATE` e `DELETE` são executados em um banco isolado que contém somente vereditos, com gatilhos para proteger os registros confirmados e limitar alterações ao viajante atual. Por isso, uma subconsulta de escrita também só pode ler `vereditos`: leia os dados oficiais em um SELECT separado.

Comandos de esquema, `PRAGMA`, bancos anexados e controle explícito de transação são recusados nesse nível. Cada execução já é atômica: se qualquer instrução falhar, todas as mudanças daquele script são descartadas. A demonstração e o tutorial conservam suas políticas anteriores. Veja os detalhes em [proteção SQL](docs/protecao-sql.md).

## Decisões de implementação

TypeScript com Vite e DOM nativo mantém a primeira etapa pequena, sem um framework de interface adicional. sql.js fornece SQLite em memória, com o arquivo WASM empacotado pelo Vite. O estado da partida e os contratos de avaliação ficam separados do mecanismo SQL.

Cada script roda em uma cópia do último banco concluído. Só um script bem-sucedido substitui o checkpoint. Um erro descarta suas alterações parciais; cancelar ou atingir o limite encerra o worker e restaura o checkpoint em outro worker. Isso preserva as execuções anteriores sem tentar interromper o SQLite síncrono na thread principal.

Os testes usam `node:test`, SQLite real e um loader TypeScript pequeno, sem exigir executáveis nativos adicionais para transpilar os testes. `npm run check` faz a checagem de tipos que o loader não realiza.

## Tempo e limites

| Configuração | Valor inicial | Local |
| --- | --- | --- |
| Demonstração | 10 minutos | `src/game/session.ts` |
| Fácil, disponível | 20 minutos | `src/game/session.ts` |
| Médio, disponível | 15 minutos | `src/game/session.ts` |
| Avançado, disponível | 20 minutos | `src/game/session.ts` |
| Tempo de uma execução SQL | 5 segundos | `src/sql/protocol.ts` |
| Inicialização ou recuperação do worker | 15 segundos | `src/sql/client.ts` |
| Linhas exibidas por execução, somando resultados | 200 | `src/sql/protocol.ts` |
| Comandos por execução | 20 | `src/sql/protocol.ts` |
| Tamanho do script | 20.000 caracteres | `src/sql/protocol.ts` |
| Texto exibido por célula | 4.000 caracteres | `src/sql/results.ts` |
| Colunas por resultado | 32 | `src/sql/results.ts` |
| Texto exibido por execução | 200.000 caracteres | `src/sql/results.ts` |
| Banco publicado por execução | 4 MB | `src/sql/checkpoint.ts` |

Os tempos dos níveis são configurações preliminares, sem validação com jogadores. O relógio começa quando a apresentação termina e o banco fica pronto. Usa diferença entre timestamps, portanto o tempo continua passando fora da aba. Ao encerrar, congela o tempo restante; expirar cancela a consulta pendente e fecha o turno. Reiniciar volta à apresentação e cria outro banco ao assumir o posto.

## Arquitetura e dados

Veja [arquitetura](docs/arquitetura.md), [esquema](docs/esquema.md), [validação da Parte 1](docs/validacao-parte-01.md), [validação do nível fácil](docs/validacao-parte-02.md) e [validação do nível médio](docs/validacao-parte-03.md).

```text
src/main.ts             integração, eventos e navegação
src/ui/                 renderização de telas
src/style.css           apresentação e adaptação a telas menores
src/content/            cenário, dados iniciais e esquema SQL
src/game/               sessão, tipos e contratos de avaliação
src/sql/                protocolo, engine, worker e recuperação
tests/                 testes automatizados e loader TypeScript
```

## Salvamento e resultados

O salvamento automático usa `localStorage`, chave `kepler9.progress`, formato 1 e conteúdo 1.0. Guarda a campanha e um checkpoint do turno atual em um único registro, incluindo banco SQLite, modo, fila, rascunhos, recibos, objetivos, dicas, editor e início do relógio. Dados ausentes iniciam uma campanha nova; dados incompatíveis ou corrompidos mostram aviso e opção de reinício. Uma falha de armazenamento preserva o último registro válido e avisa que a partida atual pode não ser retomada. Veja os detalhes em [arquitetura](docs/arquitetura.md).

O relógio continua transcorrendo com a página fechada. Recarregar não repõe o tempo; um turno expirado é restaurado encerrado. A execução em andamento não é salva: conserva-se a última execução concluída. Sair do posto pela navegação encerra o turno. Reiniciar um nível abre sua apresentação e substitui seu banco ao começar; o histórico de conclusão dos outros níveis permanece. Reiniciar a campanha pede confirmação e remove o progresso local.

A campanha exibe o resultado da última tentativa de cada nível. Conclusões anteriores permanecem marcadas ao praticar novamente. No fácil são avaliadas cinco tarefas; médio e avançado somam até 180 pontos, separando decisão, motivo, objetivos SQL e viajantes pendentes.

## Cenários e distribuição

Para modificar viajantes, regras, investigações e consultas, consulte [criação de cenários](docs/criar-cenarios.md). O esquema está em [docs/esquema.md](docs/esquema.md).

`npm run package` gera `release/alfandega-kepler-9-v1.0.0.zip`, com o site, instruções, configuração Nginx e manifesto de versão/hashes. O código-fonte e o lock ficam no Git; builds e ZIPs gerados são ignorados. Veja [publicação](docs/publicacao.md) e [validação final](docs/validacao-parte-05.md). Nenhuma hospedagem externa está configurada ou foi publicada nesta entrega.

## Limitações

O progresso pertence à origem do site (domínio, protocolo e porta) e ao navegador; limpar seus dados ou usar outra origem não transfere o progresso. Não há conta, sincronização remota ou migração de salvamentos entre versões incompatíveis. O checksum detecta corrupção acidental, sem autenticar dados contra edição intencional. A aplicação cliente e o gabarito em JavaScript são inspecionáveis.

Checkpoints preservam apenas o banco principal; tabelas temporárias e bancos anexados não são suportados entre execuções. Na demonstração e no fácil, transações explícitas precisam terminar no mesmo script. Nos níveis de fiscalização, são recusadas e cada execução é automaticamente atômica.

Os limites de exibição e do banco publicado não limitam rigidamente a memória temporária consumida por uma expressão SQLite. O timeout encerra o worker e recupera o último checkpoint; não oferece isolamento contra todo consumo excessivo de memória. Tempos e dificuldade ainda precisam de avaliação com jogadores reais. A interface foi conferida em navegador desktop e viewport estreito, sem teste em aparelho físico.

## Versionamento e próximos passos

Neste ambiente o `.git` padrão está bloqueado para escrita e o histórico usa `.git-local`. Enquanto essa configuração persistir:

```bash
git --git-dir=.git-local --work-tree=. status --short
git --git-dir=.git-local --work-tree=. log --oneline
```

Os arquivos de dependências e o lock fazem parte do projeto; `node_modules/`, `dist/` e segredos são ignorados. Mudanças preexistentes nos arquivos de instruções devem ser preservadas e não incluídas automaticamente em commits de implementação.

Os cinco prompts foram executados. Os relatórios de validação registram o alcance e as limitações de cada etapa. O próximo trabalho operacional é escolher uma hospedagem e publicar conforme [as instruções](docs/publicacao.md).

## Nível avançado

A fila avançada tem seis novos viajantes e vinte minutos iniciais. Todos precisam de documento, visto, biologia e exames válidos para as doenças listadas nas restrições do destino. O histórico admite no máximo dois destinos distintos. O novo motivo `historico` vem depois de `exame` na ordem de prioridade.

As investigações exigem INNER JOIN, LEFT JOIN, DISTINCT, GROUP BY, COUNT e HAVING, com exemplos e três dicas graduais. Consultas equivalentes são aceitas; comentários, textos e aliases não simulam recursos SQL. COUNT precisa ser uma chamada de função. Os casos incluem vistos antigos, exame ausente, documento divergente e multiplicação de linhas em relações de um para muitos. COUNT(DISTINCT ...) mantém as contagens corretas.

A escrita isolada, confirmação e pontuação de 15 pontos por viajante são compartilhadas com o médio. A prática de quatro escritas não se repete: insira um rascunho e revise por UPDATE/DELETE se necessário. Veja [a validação da Parte 4](docs/validacao-parte-04.md). O salvamento persistente inclui o banco e a fila deste nível.
