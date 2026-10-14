
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "stitch"
OUT = ROOT / "content" / "pages"

PAGES = {
    "index": "screen10.html",
    "a-propos": "screen1.html",
    "galerie": "screen2.html",
    "suite": "screen3.html",
    "services": "screen4.html",
    "chambres": "screen5.html",
    "reservation": "screen6.html",
    "faq": "screen7.html",
    "404": "screen8.html",
    "confirmation": "screen9.html",
}
LEGAL_SOURCE = "screen8.html"
FIXED_TITLES = {"index": "Accueil", "404": "Page introuvable", "legal": "Mentions Légales"}

DATA_PATHS = {
    "accueil": "/",
    "chambres-et-suites": "/chambres",
    "services-et-experiences": "/services",
    "galerie": "/galerie",
    "a-propos": "/a-propos",
    "faq": "/faq",
    "contact": "/reservation?tab=contact",
    "reservation": "/reservation",
    "mentions-legales": "/legal?tab=mentions",
    "confidentialite": "/legal?tab=confidentialite",
    "cookies": "/legal?tab=cookies",
    "conditions-generales": "/legal?tab=cgu",
    "charte-environnementale": "/a-propos#manifeste",
}
MISSING_ANCHORS = {
    "#booking-container": "/reservation",
    "#contact": "/reservation?tab=contact",
    "#chambres": "/chambres",
    "#faq-section": "/faq",
    "#explore": "/chambres",
}
TEXT_RULES = [
    (r"Accueil|Retourner à l'Accueil|Retourner à l'accue", "/"),
    (r"Chambres|Villas|Explorer$|collection", "/chambres"),
    (r"FAQ", "/faq"),
    (r"Galerie", "/galerie"),
    (r"Catamaran|Services", "/services"),
    (r"Concierg|Contacter", "/reservation?tab=contact"),
    (r"Philosophie|Agence", "/a-propos"),
    (r"brochure", "/galerie"),
    (r"^call ", "tel:+261320000000"),
]

IMAGE_SWAPS = {
    "siDfdLiMxk4xv46ykBJCNFlMU": "RrLX5nRFcZ8EZyv3nAXVg1dkb",
}

HERO = 
FEATURE = 

def text_of(html):
    return " ".join(re.sub(r"<[^>]+>", " ", html).split())

def rewrite_links(html):
    ids = set(re.findall(r'\sid="([^"]+)"', html))

    def repl(m):
        attrs, inner = m.group(1), m.group(2)
        dp = re.search(r'data-path="([^"]+)"', attrs)
        href_m = re.search(r'href="([^"]*)"', attrs)
        href = href_m.group(1) if href_m else None
        new = None
        if dp and dp.group(1) in DATA_PATHS and not (href and href.startswith("#") and href[1:] in ids):
            new = DATA_PATHS[dp.group(1)]
        elif href in MISSING_ANCHORS and href[1:] not in ids:
            new = MISSING_ANCHORS[href]
        elif href == "#":
            label = text_of(inner)
            for pat, target in TEXT_RULES:
                if re.search(pat, label):
                    new = target
                    break
        if new and href_m:
            attrs = attrs.replace(href_m.group(0), f'href="{new}"')
        return f"<a{attrs}>{inner}</a>"

    return re.sub(r"<a(\s[^>]*)>(.*?)</a>", repl, html, flags=re.S)

def full_width_hero(body):
    
    start = body.find("<section", body.find("<main"))
    end = body.find("</section>", start) + len("</section>")
    hero = body[start:end]
    img = re.search(r'<img[^>]*data-alt="([^"]*)"[^>]*src="([^"]+)"', hero)
    features = re.findall(r'<span class="w-2 h-2 rounded-full bg-sun-gold"></span>\s*<span>([^<]+)</span>', hero)
    widget_start = hero.find('<div class="relative max-w-[1140px]')
    widget = hero[widget_start:hero.rfind("</section>")]
    widget = widget.replace('mx-auto px-gutter mt-4 z-30', 'mx-auto px-gutter -mt-14 z-30', 1)
    new = HERO.format(alt=img.group(1), img=img.group(2), widget=widget,
                      features="\n".join(FEATURE.format(f) for f in features))
    return body[:start] + new + body[end:]

def split_page(html):
    scripts = []

    def grab(m):
        attrs, code = m.group(1), m.group(2)
        if "src=" in attrs or "tailwind.config" in code or 'id="tailwind-config"' in attrs:
            return ""
        scripts.append(code.strip())
        return ""

    html = re.sub(r"<script([^>]*)>(.*?)</script>", grab, html, flags=re.S)
    body_m = re.search(r"<body([^>]*)>(.*)</body>", html, re.S)
    body_class = re.search(r'class="([^"]*)"', body_m.group(1))
    return body_m.group(2).strip(), "\n;\n".join(scripts), body_class.group(1) if body_class else ""

def page_title(slug, html):
    if slug in FIXED_TITLES:
        return FIXED_TITLES[slug]
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    return text_of(h1.group(1)).replace("&amp;", "&") if h1 else "Hôtel Baie d'Or"

def element_span(html, start):
    
    tag = re.match(r"<(\w+)", html[start:]).group(1)
    depth = 0
    for m in re.finditer(rf"<(/?){tag}\b[^>]*>", html[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return start, start + m.end()
    raise ValueError(f"unclosed <{tag}> at {start}")

def remove_element(html, start):
    if start < 0:
        raise ValueError("element to remove not found")
    a, b = element_span(html, start)
    return html[:a] + html[b:]

def tidy_layout(slug, body):
    
    body = remove_element(body, body.find('<div class="fixed top-0 left-0 right-0 z-50 flex flex-col">'))
    body = remove_element(body, body.find("<footer"))
    if slug == "index":
        body = remove_element(body, body.rfind("<section", 0, body.find("Hébergements en Vedette</h2>")))
        body = re.sub(r"<!-- (?:Directional Pagination Controls|Pagination numbers)[^>]*-->\s*<div[^>]*>.*?</div>", "", body, flags=re.S)
    body = body.replace('href="https://wa.me" rel="noopener noreferrer" target="_blank"', 'href="/reservation?tab=contact"')
    body = body.replace("WhatsApp Concierge", "Écrire au concierge")
    if slug == "suite":
        body = body.replace('disabled="" id="guest-minus"', 'id="guest-minus"')
    if slug == "404":
        body = remove_element(body, body.rfind("<section", 0, body.find("Hub des Mentions Légales")))
    return body

def write_page(meta, slug, html):
    for old, new in IMAGE_SWAPS.items():
        html = html.replace(find_image(old), find_image(new))
    has_forms_plugin = "plugins=forms" in html
    body, script, body_class = split_page(html)
    if slug == "index":
        body = full_width_hero(body)
    body = tidy_layout(slug, body)
    body = rewrite_links(body)
    body = strip_unknown_tokens(body, page_config(html), tailwind_config())
    (OUT / f"{slug}.html").write_text(body + "\n", encoding="utf-8")
    (OUT / f"{slug}.js").write_text(script + "\n", encoding="utf-8")
    meta[slug] = {"title": page_title(slug, html), "bodyClass": body_class, "formsPlugin": has_forms_plugin}
    ids = set(re.findall(r'\sid="([^"]+)"', body))
    dangling = sorted({h for h in re.findall(r'href="#([^"]+)"', body) if h not in ids})
    if dangling:
        print(f"  {slug}: anchors without target: {dangling}")

_ALL_HTML = None

def find_image(suffix):
    
    global _ALL_HTML
    if _ALL_HTML is None:
        _ALL_HTML = "".join(p.read_text(encoding="utf-8") for p in sorted(SRC.glob("*.html")))
    url = re.search(r"https://lh3\.googleusercontent\.com/[^\"')\s]*" + re.escape(suffix), _ALL_HTML).group(0)
    return url

def page_config(html):
    
    m = re.search(r"tailwind\.config\s*=\s*(\{.*?\})\s*;?\s*</script>", html, re.S)
    if not m:
        return {}
    js = subprocess.run(["node", "-e", "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.stringify(eval('('+s+')'))))"],
                        input=m.group(1), capture_output=True, text=True, check=True).stdout
    return json.loads(js)["theme"]["extend"]

SPACING_PREFIXES = r"(?:-?(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me)|gap|gap-x|gap-y|space-x|space-y|w|h|min-w|min-h|max-w|max-h|top|bottom|left|right|inset|inset-x|inset-y|size|scroll-m|scroll-p)"

TAILWIND_DEFAULTS = {"sans", "serif", "mono"}

def strip_unknown_tokens(body, own, merged):
    
    rules = [("fontSize", r"text"), ("fontFamily", r"font"), ("spacing", SPACING_PREFIXES)]
    patterns = []
    for section, prefix in rules:
        missing = [k for k in merged.get(section, {}) if k not in own.get(section, {}) and k not in TAILWIND_DEFAULTS]
        if missing:
            keys = "|".join(sorted(map(re.escape, missing), key=len, reverse=True))
            patterns.append(re.compile(r"^(?:[\w\[\]&:-]+:)?!?" + prefix + r"-(?:" + keys + r")$"))
    if not patterns:
        return body

    def clean(m):
        tag = re.match(r"<(\w+)", m.string[m.string.rfind("<", 0, m.start()):])
        if tag and tag.group(1) in ("h1", "h2", "h3"):
            return m.group(0)  # Headings keep their sizes: unsized titles read as body text.
        kept = [c for c in m.group(2).split() if not any(p.match(c) for p in patterns)]
        return f'{m.group(1)}"{" ".join(kept)}"'

    return re.sub(r'(\sclass=)"([^"]*)"', clean, body)

_MERGED = None

def tailwind_config():
    
    global _MERGED
    if _MERGED is not None:
        return _MERGED
    configs = [c for c in (page_config(p.read_text(encoding="utf-8")) for p in sorted(SRC.glob("*.html"))) if c]
    merged = {}
    for section in sorted({k for c in configs for k in c}):
        keys = {k for c in configs for k in c.get(section, {})}
        merged[section] = {}
        for key in sorted(keys):
            values = [json.dumps(c[section][key]) for c in configs if key in c.get(section, {})]
            merged[section][key] = json.loads(max(set(values), key=values.count))
    _MERGED = merged
    return merged

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for slug, src in PAGES.items():
        write_page(meta, slug, (SRC / src).read_text(encoding="utf-8"))

    html = (SRC / LEGAL_SOURCE).read_text(encoding="utf-8")
    main_start = html.find("<main")
    first = re.search(r"<section.*?</section>", html[main_start:], re.S)
    html = html[: main_start + first.start()] + html[main_start + first.end():]
    write_page(meta, "legal", html)

    (ROOT / "content" / "pages.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    extend = json.dumps(tailwind_config(), ensure_ascii=False, indent=2)
    (ROOT / "tailwind.config.ts").write_text(
        "// Generated by scripts/import_stitch.py from the Stitch exports' inline Tailwind configs.\n"
        'import type { Config } from "tailwindcss";\n'
        'import forms from "@tailwindcss/forms";\n'
        'import containerQueries from "@tailwindcss/container-queries";\n\n'
        "const config: Config = {\n"
        '  darkMode: "class",\n'
        '  content: ["./src/**/*.{ts,tsx}", "./content/**/*.{html,js}"],\n'
        f"  theme: {{\n    extend: {extend.replace(chr(10), chr(10) + '    ')},\n  }},\n"
        "  plugins: [forms, containerQueries],\n"
        "};\n\nexport default config;\n",
        encoding="utf-8",
    )
    print("pages:", ", ".join(meta))

if __name__ == "__main__":
    main()
