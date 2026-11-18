# Distribuição e publicação — 1.0.0

## Gerar e conferir

Requisitos: Node.js >=20.19, npm e Python 3 para empacotar.

```bash
npm ci
npm test
npm run package
npm run preview
```

O pacote é `release/alfandega-kepler-9-v1.0.0.zip`. Contém `site/` (build), `LEIA-ME.txt`, exemplo Nginx e `VERSAO.json` com versão, revisão HEAD, data UTC e SHA-256 dos arquivos. Empacote depois do commit para que a revisão corresponda ao código entregue. O ZIP gerado e `dist/` não entram no Git; scripts, lock e configuração permitem regenerá-los.

Para conferir o ZIP sem Node, descompacte e execute:

```bash
python3 -m http.server 8080 --bind 127.0.0.1 --directory site
```

Abra `http://127.0.0.1:8080`. Não use `file://`.

## Hospedagem estática

Envie o conteúdo de `dist/` ou de `site/` do pacote para a raiz escolhida em uma hospedagem estática. Preserve a pasta `assets/`, nomes gerados e `sqljs-license.txt`. O build usa caminhos relativos e pode ser servido em um subdiretório. Não há backend, banco remoto, variáveis secretas ou CDN em tempo de execução.

O servidor precisa servir `.wasm` como `application/wasm`, `.js` como `application/javascript` e `.css` como `text/css`. Não redirecione pedidos ausentes de assets para HTML. O exemplo `deploy/nginx.conf` usa `/usr/share/nginx/html`; ajuste o diretório para a instalação real. Configure HTTPS e domínio no provedor escolhido. Não é necessário isolamento de origem para threads compartilhadas: o SQLite roda em um worker comum.

Depois da publicação, confira na URL real:

1. Início, seleção dos três níveis e manual por teclado.
2. Carregamento do worker e WASM; execute `SELECT 1` no terminal.
3. Tutorial com banco vazio, médio e avançado com bancos oficiais diferentes.
4. Uma investigação, rascunho, confirmação e recarga preservando relógio e pontuação.
5. Layout estreito e mensagens de erro; verifique que os assets não retornam HTML.

O progresso é vinculado à origem (protocolo, domínio e porta). Uma prévia local não transfere salvamentos à URL pública. Mantenha nomes de assets com hash e atualize o HTML junto ao build; não troque somente o WASM. Mudanças incompatíveis de conteúdo devem incrementar `CONTENT_VERSION` e exibir recuperação em vez de mesclar dados.

## Situação desta entrega

Build e pacote preparados e validados localmente. Não existe destino de hospedagem configurado no projeto; nenhuma publicação externa foi executada. A pendência operacional é escolher/configurar o destino, enviar o build e executar a conferência acima na URL pública.
