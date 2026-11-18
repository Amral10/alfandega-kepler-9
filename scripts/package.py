from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess
import zipfile

root = Path(__file__).resolve().parent.parent
package = json.loads((root / 'package.json').read_text())
static = root / 'dist'
if not (static / 'index.html').is_file():
    raise SystemExit('Execute npm run build antes de empacotar.')
output = root / 'release'
output.mkdir(exist_ok=True)
archive = output / f"alfandega-kepler-9-v{package['version']}.zip"
git = ['git', '--git-dir=.git-local', '--work-tree=.'] if (root / '.git-local' / 'HEAD').is_file() else ['git']
try:
    revision = subprocess.check_output(git + ['rev-parse', 'HEAD'], cwd=root, text=True, stderr=subprocess.DEVNULL).strip()
except (OSError, subprocess.CalledProcessError):
    revision = 'working-tree'
manifest = {'name': package['name'], 'version': package['version'], 'head_revision': revision,
            'built_at': datetime.now(timezone.utc).isoformat(), 'files': {}}
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
    for path in sorted(static.rglob('*')):
        if path.is_file():
            relative = path.relative_to(static).as_posix()
            manifest['files'][relative] = hashlib.sha256(path.read_bytes()).hexdigest()
            bundle.write(path, f'site/{relative}')
    bundle.writestr('VERSAO.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    bundle.writestr('LEIA-ME.txt', '''Alfândega Kepler-9 — versão web

Prévia local com Python 3, a partir desta pasta descompactada:
python3 -m http.server 8080 --bind 127.0.0.1 --directory site
Abra http://127.0.0.1:8080

Para publicar, envie o conteúdo de site/ a uma hospedagem de arquivos estáticos.
Preserve assets/, os nomes dos arquivos e o MIME application/wasm para .wasm.
Não abra index.html por file://. O progresso pertence ao navegador e à origem
(domínio e porta); mudar de origem não transfere os dados locais.
O relógio de um turno ativo continua contando com a página fechada.
VERSAO.json lista a revisão HEAD e os hashes dos arquivos do build.
''')
    bundle.write(root / 'deploy' / 'nginx.conf', 'deploy/nginx.conf')
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert 'site/index.html' in bundle.namelist()
    assert any(name.endswith('.wasm') for name in bundle.namelist())
print(archive)
