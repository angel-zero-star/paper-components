#!/usr/bin/env python3
"""Copy the Atlas 'Design system' bento (Terra Nova live components) out of the
portfolio into a standalone folder. Read-only on the site."""
import shutil
from pathlib import Path

SITE = Path("/Users/angelowellens/Documents/Projects/angelowellens_eu/_site")
OUT = Path("/Users/angelowellens/Documents/Projects/paper_components")
ATLAS = (SITE / "projects/atlas/atlas.html").read_text().splitlines()
JS = (SITE / "js/angelo.js").read_text().splitlines()

def lines(src, a, b):  # 1-indexed, inclusive
    return "\n".join(src[a - 1:b])

def fix(s):
    return s.replace("projects/atlas/assets/ds/", "assets/ds/")

css = lines(ATLAS, 527, 1033)
markup = ATLAS[1387:1714]  # lines 1388..1714
assert "dsb-wrap" in markup[0] and "dsb-fallback" in markup[1]
markup = "\n".join([markup[0]] + markup[2:])  # drop the phone fallback <img>
js = lines(JS, 2959, 3933)
assert js.startswith("function initDsBento") and js.rstrip().endswith("}")

guard = "    box.addEventListener('click', function(e) { e.stopPropagation(); });"
assert js.count(guard) == 1
js = js.replace(guard, "    // (site-only guard removed: on the portfolio a click on empty project space closes the page)")

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "css").mkdir(exist_ok=True)
(OUT / "js").mkdir(exist_ok=True)

(OUT / "css/terra-nova.css").write_text(
    "/* Terra Nova live components, copied from angelowellens.eu\n"
    "   projects/atlas/atlas.html lines 527-1033. Tokens (colour, radius,\n"
    "   spacing) are the custom properties on .dsb. */\n\n" + css.replace("projects/atlas/assets/ds/", "../assets/ds/") + "\n")

(OUT / "js/terra-nova.js").write_text(
    "// Terra Nova live components, copied from angelowellens.eu js/angelo.js\n"
    "// (initDsBento, lines 2959-3933). Vanilla JS, no jQuery.\n\n" + fix(js) +
    "\n\ndocument.addEventListener('DOMContentLoaded', function() { initDsBento(document.body); });\n")

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Terra Nova components</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/terra-nova.css">
<style>
  html, body {{ margin: 0; background: #fff; }}
  body {{ font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }}
  .page {{ max-width: 1474px; margin: 0 auto; padding: 40px 24px 80px; }}
</style>
</head>
<body>
<main class="page">
{fix(markup)}
</main>
<script src="js/terra-nova.js"></script>
</body>
</html>
"""
(OUT / "index.html").write_text(page)

dst = OUT / "assets/ds"
if dst.exists():
    shutil.rmtree(dst)
shutil.copytree(SITE / "projects/atlas/assets/ds", dst, ignore=shutil.ignore_patterns(".DS_Store"))

left = [p for p in ("index.html", "css/terra-nova.css", "js/terra-nova.js")
        if "projects/" in (OUT / p).read_text()]
print("built", OUT, "| leftover site paths in:", left or "none")
