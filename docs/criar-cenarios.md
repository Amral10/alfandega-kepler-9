# Criar ou alterar cenários

Os cenários são determinísticos e inteiramente fictícios, com interface em português brasileiro. Mantenha a data de referência explícita e regras inequívocas. Novos casos precisam fornecer todas as evidências consultáveis, além de uma explicação compreensível após a confirmação.

| Conteúdo | Arquivos |
| --- | --- |
| Esquema e relações | `src/content/schema.ts`, `src/game/types.ts`, `docs/esquema.md` |
| Demonstração e fichas do tutorial | `src/content/demo.ts`, `src/content/tutorial.ts` |
| Objetivos e validação fácil | `src/game/tutorial.ts`, `src/game/tutorial-validation.ts` |
| Dados, regras e objetivos médios | `src/content/medium.ts`, `src/game/medium-evaluation.ts` |
| Dados, regras e objetivos avançados | `src/content/advanced.ts`, `src/game/advanced-evaluation.ts` |
| Seleção do cenário compartilhado | `src/content/inspection.ts` |
| Durações iniciais | `src/game/session.ts` |
| Versão de salvamento/conteúdo | `src/game/persistence.ts` |

1. Defina os fatos e a regra antes da consulta. Mantenha ids estáveis, relações válidas, datas ISO e destinos coerentes. Não coloque respostas ou critérios pedagógicos em tabelas SQL.
2. Escreva a avaliação do veredito a partir dos dados oficiais, separada do objetivo SQL. Preserve a prioridade de motivos e teste identidade, visto, biologia, exame e histórico aplicáveis ao nível.
3. Acrescente a investigação, consulta de referência, resultado esperado e dicas graduais. Aceite SQL equivalente, validando o resultado e os recursos necessários. O reconhecedor deve ignorar strings, comentários e identificadores que apenas parecem comandos.
4. No avançado, teste ausência via LEFT JOIN, nulos, registros antigos, duplicações e produtos entre relações. Use COUNT(DISTINCT ...) quando a regra contar entidades, não linhas da junção.
5. Atualize os testes com SQLite real. Confira as consultas de referência, decisões, justificativas, proteção de escrita e restauração. Execute `npm test`, `npm run build` e uma partida do caso alterado no build.
6. Se o esquema, dados oficiais, número/ordem de tarefas ou contratos mudarem de modo incompatível, incremente a versão de conteúdo. O formato atual assume cinco tarefas fáceis e seis viajantes por fiscalização; mudar essas quantidades exige atualizar validação, campanha, interface e testes, não só os dados.

O banco oficial é reconstruído e comparado durante a restauração. Uma alteração incompatível sem mudar a versão será detectada e rejeitada; não deve ser contornada ignorando essa conferência. Não há migração automática entre versões. Os tempos iniciais são hipóteses de dificuldade e precisam de avaliação com jogadores.
