from __future__ import annotations

from pathlib import Path
import html
import re
import sys

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd().resolve()
OUT = ROOT / "public" / "deprem-visual"
MAIN = ROOT / "src" / "lib" / "deprem-rollout.ts"
EXTRA = ROOT / "src" / "lib" / "deprem-rollout-extra.ts"

NAVY = "#123B63"
CYAN = "#12A9C6"
LIGHT = "#F8FBFC"
MID = "#DDE8EE"
TEXT = "#19324A"


def unescape_ts(value: str) -> str:
    return value.replace('\\"', '"').replace("\\'", "'")


def parse_specs() -> list[tuple[str, str, list[str]]]:
    main_text = MAIN.read_text(encoding="utf-8")
    extra_text = EXTRA.read_text(encoding="utf-8")

    specs: list[tuple[str, str, list[str]]] = []

    main_pat = re.compile(
        r'makeSpec\(\s*"([^"]+)"\s*,\s*\d+\s*,\s*"((?:\\.|[^"])*)"\s*,\s*"(?:\\.|[^"])*"\s*,\s*\[([^\]]+)\]',
        re.S,
    )
    for match in main_pat.finditer(main_text):
        slug = match.group(1)
        headline = unescape_ts(match.group(2))
        steps = [unescape_ts(x) for x in re.findall(r'"((?:\\.|[^"])*)"', match.group(3))][:3]
        if len(steps) == 3:
            specs.append((slug, headline, steps))

    extra_pat = re.compile(
        r'\{\s*slug:\s*"([^"]+)"\s*,\s*batch:\s*\d+\s*,\s*headline:\s*"((?:\\.|[^"])*)"\s*,\s*eyebrow:\s*"(?:\\.|[^"])*"\s*,\s*steps:\s*\[([^\]]+)\]',
        re.S,
    )
    for match in extra_pat.finditer(extra_text):
        slug = match.group(1)
        headline = unescape_ts(match.group(2))
        steps = [unescape_ts(x) for x in re.findall(r'"((?:\\.|[^"])*)"', match.group(3))][:3]
        if len(steps) == 3:
            specs.append((slug, headline, steps))

    unique: dict[str, tuple[str, str, list[str]]] = {}
    for spec in specs:
        unique.setdefault(spec[0], spec)

    targets = [spec for spec in unique.values() if not spec[0].startswith("ts500-")]
    if len(targets) != 143:
        raise RuntimeError(f"Expected 143 non-TS500 rollout topics, parsed {len(targets)}")
    return targets


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def defs() -> str:
    return f'''<defs>
<marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0 0L0 6L9 3z" fill="{CYAN}"/></marker>
<style>.p{{fill:{LIGHT};stroke:{MID};stroke-width:2}}.n{{fill:none;stroke:{NAVY};stroke-width:7;stroke-linecap:round;stroke-linejoin:round}}.c{{fill:none;stroke:{CYAN};stroke-width:6;stroke-linecap:round;stroke-linejoin:round}}.t{{font-family:Arial,sans-serif;fill:{TEXT};font-size:38px;font-weight:700}}.s{{font-family:Arial,sans-serif;fill:{TEXT};font-size:25px;font-weight:600}}.m{{font-family:Arial,sans-serif;fill:{TEXT};font-size:21px;font-weight:500}}</style>
</defs>'''


def frame(x: int, y: int, w: int = 340, h: int = 400, stories: int = 4) -> str:
    parts: list[str] = []
    for i in range(4):
        xx = x + i * w / 3
        parts.append(f'<line x1="{xx}" y1="{y}" x2="{xx}" y2="{y+h}" class="n"/>')
    for j in range(stories + 1):
        yy = y + j * h / stories
        parts.append(f'<line x1="{x}" y1="{yy}" x2="{x+w}" y2="{yy}" class="n"/>')
    return ''.join(parts)


def motif(slug: str) -> str:
    if "kolon" in slug:
        return '<rect x="220" y="235" width="220" height="430" rx="10" class="p"/><rect x="270" y="285" width="120" height="330" class="n"/><circle cx="290" cy="310" r="10" fill="#123B63"/><circle cx="370" cy="310" r="10" fill="#123B63"/><circle cx="290" cy="590" r="10" fill="#123B63"/><circle cx="370" cy="590" r="10" fill="#123B63"/>'
    if "kiris" in slug:
        return '<rect x="170" y="370" width="600" height="120" rx="10" class="p"/><rect x="205" y="490" width="75" height="150" fill="#EEF4F7" stroke="#123B63" stroke-width="7"/><rect x="660" y="490" width="75" height="150" fill="#EEF4F7" stroke="#123B63" stroke-width="7"/><path d="M210 420H730" class="c"/>'
    if "perde" in slug:
        return '<rect x="220" y="230" width="330" height="450" rx="8" fill="#EEF4F7" stroke="#123B63" stroke-width="8"/><rect x="220" y="230" width="60" height="450" fill="#E8F8FB" stroke="#12A9C6" stroke-width="5"/><rect x="490" y="230" width="60" height="450" fill="#E8F8FB" stroke="#12A9C6" stroke-width="5"/><line x1="130" y1="390" x2="210" y2="390" class="c" marker-end="url(#a)"/>'
    if any(k in slug for k in ("temel", "radye")):
        return '<rect x="160" y="470" width="650" height="110" rx="8" fill="#E8F8FB" stroke="#123B63" stroke-width="8"/><rect x="270" y="290" width="100" height="180" class="p"/><rect x="610" y="290" width="100" height="180" class="p"/><path d="M210 610H760M230 650H740" class="n"/>'
    if any(k in slug for k in ("zemin", "sivlas", "sondaj")):
        return '<rect x="170" y="300" width="560" height="360" rx="8" class="p"/><path d="M170 395H730M170 500H730M170 585H730" class="n"/><line x1="420" y1="250" x2="420" y2="650" class="c"/><circle cx="420" cy="280" r="13" fill="#12A9C6"/>'
    if "yangin" in slug or "sprinkler" in slug or "duman" in slug or "kacis" in slug:
        return '<rect x="170" y="260" width="540" height="390" rx="8" class="p"/><path d="M170 380H710M170 500H710M350 260V650M530 260V650" class="n"/><path d="M270 560C235 515 275 490 290 450C335 505 350 530 330 565C315 592 280 590 270 560Z" fill="#E8F8FB" stroke="#12A9C6" stroke-width="6"/>'
    if "otopark" in slug:
        return '<rect x="150" y="260" width="650" height="380" rx="8" class="p"/><path d="M280 260V640M410 260V640M540 260V640M670 260V640M150 450H800" class="n"/><rect x="175" y="310" width="80" height="120" rx="12" fill="#E8F8FB" stroke="#12A9C6" stroke-width="5"/><rect x="565" y="470" width="80" height="120" rx="12" fill="#E8F8FB" stroke="#12A9C6" stroke-width="5"/>'
    if "asansor" in slug:
        return '<rect x="240" y="220" width="300" height="470" rx="8" class="p"/><rect x="305" y="365" width="170" height="190" rx="8" fill="#E8F8FB" stroke="#12A9C6" stroke-width="6"/><line x1="390" y1="240" x2="390" y2="365" class="n"/><line x1="390" y1="555" x2="390" y2="670" class="n"/>'
    if slug.startswith("imar-"):
        return '<rect x="155" y="235" width="600" height="430" rx="8" fill="#fff" stroke="#123B63" stroke-width="8"/><rect x="280" y="340" width="350" height="220" rx="8" fill="#E8F8FB" stroke="#12A9C6" stroke-width="6"/><path d="M215 235V665M695 235V665M155 295H755M155 605H755" stroke="#123B63" stroke-width="3" stroke-dasharray="12 10" fill="none"/>'
    if any(k in slug for k in ("bep-", "enerji", "isi-", "isil")):
        return '<rect x="180" y="285" width="470" height="300" rx="8" fill="#fff" stroke="#123B63" stroke-width="8"/><rect x="250" y="285" width="70" height="300" fill="#EEF4F7"/><rect x="320" y="285" width="70" height="300" fill="#E8F8FB"/><rect x="390" y="285" width="70" height="300" fill="#EEF4F7"/><line x1="110" y1="435" x2="175" y2="435" class="c" marker-end="url(#a)"/><line x1="655" y1="435" x2="750" y2="435" class="c" marker-end="url(#a)"/>'
    if slug.startswith("isg-"):
        return '<path d="M180 650V260M320 650V260M460 650V260M600 650V260M180 340H600M180 460H600M180 580H600" class="n"/><circle cx="390" cy="390" r="22" fill="#E8F8FB" stroke="#123B63" stroke-width="6"/><path d="M390 415V500M390 440L345 485M390 440L435 485" class="c"/>'
    if slug.startswith("cevre-") or "yagmur-suyu" in slug:
        return '<rect x="170" y="410" width="520" height="180" rx="8" class="p"/><path d="M120 350C170 315 210 385 260 350C310 315 350 385 400 350" class="c"/><path d="M250 590C340 545 455 545 560 590" class="n"/><circle cx="610" cy="520" r="18" fill="#12A9C6"/>'
    if any(k in slug for k in ("mevcut", "guclendirme", "hasarli")):
        return frame(170, 270, 330, 360, 4) + '<rect x="285" y="270" width="55" height="360" fill="#E8F8FB" stroke="#12A9C6" stroke-width="5"/><path d="M560 315L650 315M560 435L650 435M560 555L650 555" class="c" marker-end="url(#a)"/>'
    return frame(170, 260, 360, 390, 5) + '<path d="M100 350H160M100 450H160M100 550H160" class="c" marker-end="url(#a)"/>'


def cover_svg(slug: str, headline: str, steps: list[str]) -> str:
    title = esc(headline)
    tag1 = esc(steps[0])
    tag2 = esc(steps[1])
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img">
<title>{title}</title>{defs()}<rect width="1600" height="900" fill="#fff"/><rect x="45" y="45" width="1510" height="810" rx="30" class="p"/><text x="105" y="125" class="t">{title}</text>{motif(slug)}<rect x="920" y="300" width="500" height="125" rx="22" fill="#EEF4F7" stroke="{NAVY}" stroke-width="3"/><text x="955" y="370" class="s">{tag1}</text><rect x="920" y="485" width="500" height="125" rx="22" fill="#E8F8FB" stroke="{CYAN}" stroke-width="3"/><text x="955" y="555" class="s">{tag2}</text></svg>'''


def diagram_svg(headline: str, steps: list[str]) -> str:
    title = esc(headline + " teknik akış şeması")
    s1, s2, s3 = [esc(x) for x in steps]
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img">
<title>{title}</title>{defs()}<rect width="1600" height="900" fill="#fff"/><text x="120" y="130" class="t">{esc(headline)}</text><rect x="105" y="315" width="350" height="190" rx="24" class="p"/><text x="140" y="390" class="s">{s1}</text><rect x="625" y="315" width="350" height="190" rx="24" class="p"/><text x="660" y="390" class="s">{s2}</text><rect x="1145" y="315" width="350" height="190" rx="24" class="p"/><text x="1180" y="390" class="s">{s3}</text><line x1="455" y1="410" x2="615" y2="410" class="c" marker-end="url(#a)"/><line x1="975" y1="410" x2="1135" y2="410" class="c" marker-end="url(#a)"/></svg>'''


def main() -> None:
    targets = parse_specs()
    OUT.mkdir(parents=True, exist_ok=True)
    created = 0
    for slug, headline, steps in targets:
        folder = OUT / slug
        folder.mkdir(parents=True, exist_ok=True)
        cover = folder / "cover.svg"
        diagram = folder / "diagram.svg"
        if not cover.exists():
            cover.write_text(cover_svg(slug, headline, steps), encoding="utf-8")
            created += 1
        if not diagram.exists():
            diagram.write_text(diagram_svg(headline, steps), encoding="utf-8")
            created += 1

    expected = 143 * 2
    actual = sum((OUT / slug / name).is_file() for slug, _, _ in targets for name in ("cover.svg", "diagram.svg"))
    if actual != expected:
        raise RuntimeError(f"Expected {expected} target SVG files, found {actual}")

    print(f"Non-TS500 target topics: {len(targets)}")
    print(f"Created SVG files: {created}")
    print(f"Total target SVG files: {actual}")


if __name__ == "__main__":
    main()
