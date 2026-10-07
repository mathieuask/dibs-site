#!/usr/bin/env bash
# Verrou du site : liens internes (relatifs ou depuis la racine, le site vit à la racine sur Vercel), repères non remplacés, emoji et tirets cadratins, poids. Vert = prêt à déployer.
set -euo pipefail
cd "$(dirname "$0")"
python3 - <<'EOF'
import re, sys, pathlib, html.parser
root = pathlib.Path('.')
pages = sorted(root.glob('*.html')) + sorted(root.glob('fr/*.html'))
errors = []

class P(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.refs = []; self.ids = set(); self.tags = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); self.tags.append(tag)
        if 'id' in a: self.ids.add(a['id'])
        for k in ('href', 'src'):
            if a.get(k): self.refs.append(a[k])

def target(ref):
    path = ref.split('#')[0].split('?')[0].lstrip('/')
    while path.startswith('./'): path = path[2:]
    if path in ('', '.'): return root / 'index.html'
    p = root / path
    if p.suffix: return p
    if (p / 'index.html').exists(): return p / 'index.html'
    return root / (path + '.html')

ids = {}
parsed = {}
# Les liens relatifs d'une page de fr/ partent de fr/ ; les pages françaises utilisent des liens depuis la racine.
for page in pages:
    text = page.read_text()
    p = P(); p.feed(text); parsed[page] = (p, text); ids[page.as_posix()] = p.ids
for page, (p, text) in parsed.items():
    lang = '<html lang="fr">' if page.parts[0] == 'fr' else '<html lang="en">'
    for tag in ('<title>', 'name="viewport"', lang, 'name="description"' if page.name != '404.html' else '<title>'):
        if tag not in text: errors.append(f'{page}: manque {tag}')
    for ref in p.refs:
        if ref.startswith(('http://', 'https://', 'mailto:', 'dibs://')): continue
        if ref.startswith('#'):
            if ref[1:] not in p.ids: errors.append(f'{page}: ancre absente {ref}')
            continue
        t = target(ref)
        if not t.exists(): errors.append(f'{page}: lien mort {ref}')
        elif '#' in ref and ref.split('#')[1] not in ids.get(t.as_posix(), set()):
            errors.append(f'{page}: ancre absente {ref}')
    if '—' in text: errors.append(f'{page}: tiret cadratin')
    if re.search('[\U0001F300-\U0001FAFF☀-➿]', text): errors.append(f'{page}: emoji')

for f in list(root.glob('*.js')) + pages:
    t = f.read_text()
    if re.search(r"'SUPPORT_ENDPOINT'|SUPPORT_EMAIL", t): errors.append(f'{f}: repère SUPPORT_ENDPOINT ou SUPPORT_EMAIL non remplacé')

# Lien universel : le fichier lu par iOS doit rester un JSON valide qui nomme l'app.
import json
try:
    aasa = json.loads((root / '.well-known/apple-app-site-association').read_text())
    ids = [i for d in aasa['applinks']['details'] for i in d['appIDs']]
    if '9HZ6856XDA.com.mathieuaskamp.dibs' not in ids: errors.append('apple-app-site-association : appID absent')
except Exception as e:
    errors.append(f'apple-app-site-association illisible : {e}')

size = sum(f.stat().st_size for f in root.rglob('*') if f.is_file() and '.git' not in f.parts)
if size > 2_000_000: errors.append(f'site trop lourd : {size} octets')

for e in errors: print('ROUGE', e)
if errors: sys.exit(1)
print(f'VERT : {len(pages)} pages, {size // 1024} Ko')
EOF
