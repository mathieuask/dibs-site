#!/usr/bin/env bash
# Verrou du site : liens internes, repères non remplacés, emoji et tirets cadratins, poids. Vert = prêt à déployer.
set -euo pipefail
cd "$(dirname "$0")"
python3 - <<'EOF'
import re, sys, pathlib, html.parser
root = pathlib.Path('.')
pages = sorted(root.glob('*.html'))
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
    path = ref.split('#')[0].split('?')[0]
    if path in ('', '/'): return root / 'index.html'
    p = root / path.lstrip('/')
    if p.suffix: return p
    return root / (path.lstrip('/') + '.html')

ids = {}
parsed = {}
for page in pages:
    text = page.read_text()
    p = P(); p.feed(text); parsed[page] = (p, text); ids[page.name] = p.ids
for page, (p, text) in parsed.items():
    for tag in ('<title>', 'name="viewport"', '<html lang="en">', 'name="description"' if page.name != '404.html' else '<title>'):
        if tag not in text: errors.append(f'{page}: manque {tag}')
    for ref in p.refs:
        if ref.startswith(('http://', 'https://', 'mailto:')): continue
        if ref.startswith('#'):
            if ref[1:] not in p.ids: errors.append(f'{page}: ancre absente {ref}')
            continue
        t = target(ref)
        if not t.exists(): errors.append(f'{page}: lien mort {ref}')
        elif '#' in ref and ref.split('#')[1] not in ids.get(t.name, set()):
            errors.append(f'{page}: ancre absente {ref}')
    if '—' in text: errors.append(f'{page}: tiret cadratin')
    if re.search('[\U0001F300-\U0001FAFF☀-➿]', text): errors.append(f'{page}: emoji')

for f in list(root.glob('*.js')) + pages:
    t = f.read_text()
    if re.search(r"'SUPPORT_ENDPOINT'|SUPPORT_EMAIL", t): errors.append(f'{f}: repère SUPPORT_ENDPOINT ou SUPPORT_EMAIL non remplacé')

size = sum(f.stat().st_size for f in root.rglob('*') if f.is_file() and '.git' not in f.parts)
if size > 2_000_000: errors.append(f'site trop lourd : {size} octets')

for e in errors: print('ROUGE', e)
if errors: sys.exit(1)
print(f'VERT : {len(pages)} pages, {size // 1024} Ko')
EOF
