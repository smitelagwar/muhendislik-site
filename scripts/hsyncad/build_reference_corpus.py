"""Yerel, özel referans PDF metinlerini izlenebilir oracle fixture'larına dönüştürür.

Üretim hesabına veya web dağıtımına bağlı değildir. Özgün PDF/IDE'lere yazmaz.
"""
from __future__ import annotations

import argparse
from collections import Counter
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import unicodedata

GROUPS = ("mustafa-1", "mustafa-2", "suheyla")
COMPONENTS = {"DÖŞEMELER", "KİRİŞLER", "BANT KİRİŞLER", "PERDELER", "KOLONLAR",
              "RADYE TEMELLER", "TEMELLER", "MERDİVENLER"}
SKIP_MARKERS = ("YAPAN:", "PROJE:", "TARİH:", "Lisans:", "Sayfa :")
NUMBER = re.compile(r"-?\d+\.\d+")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(4 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalized(value: str) -> str:
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", value).casefold())


def cell(value: str | None, unit: str) -> dict:
    if value is None:
        return {"printedValue": None, "state": "printed_blank", "unit": unit,
                "roundingInterval": None, "decimalPlaces": None}
    number = Decimal(value)
    places = len(value.partition(".")[2])
    half = Decimal(10) ** -places / 2
    return {"printedValue": value, "state": "printed_number", "unit": unit,
            "decimalPlaces": places,
            "roundingInterval": {"lower": str(number-half), "upper": str(number+half),
                                 "boundaryPolicy": "closed-conservative; tie rule not observed"}}


def printed(value: dict) -> Decimal:
    # Yalnız basılı tablonun aritmetik denetiminde boş hücre sıfır katkıdır.
    return Decimal(value["printedValue"]) if value["printedValue"] is not None else Decimal(0)


def compare_sum(identifier: str, children: list[dict], target: dict) -> dict:
    if target["printedValue"] is None:
        return {"id": identifier, "status": "no_published_target"}
    total = sum((printed(item) for item in children), Decimal(0))
    target_number = printed(target)
    half_sum = sum((Decimal(10) ** -item["decimalPlaces"] / 2
                    for item in children if item["printedValue"] is not None), Decimal(0))
    half_target = Decimal(10) ** -target["decimalPlaces"] / 2
    return {"id": identifier, "sumPrintedChildren": str(total),
            "publishedValue": target["printedValue"], "delta": str(total-target_number),
            "sumRoundingInterval": [str(total-half_sum), str(total+half_sum)],
            "publishedRoundingInterval": [str(target_number-half_target), str(target_number+half_target)],
            "intervalsOverlap": total-half_sum <= target_number+half_target and target_number-half_target <= total+half_sum,
            "status": "printed_arithmetic_only; not structural verification"}


def family(title: str, previous: str) -> str:
    text = title.upper()
    for keyword, result in (("MERDİVEN", "stairs"), ("RADYE", "foundations"),
                            ("TEMEL", "foundations"), ("BİRLEŞİM", "joints"),
                            ("GÜÇLÜ KOLON", "joints"), ("KOLON", "columns"),
                            ("PERDE", "walls"), ("KİRİŞ", "beams"),
                            ("DÖŞEME", "slabs"), ("DİYAFRAM", "slabs"),
                            ("YÜK ANALİZ", "loads"), ("YERLEŞİM", "geometry"),
                            ("GENEL BİLGİLERİ", "model"), ("ANALİZ", "global-analysis"),
                            ("DEPREM", "global-analysis"), ("KAT GENEL", "global-analysis"),
                            ("YAPI ÖZET", "global-analysis"), ("DÜZENSİZ", "global-analysis"),
                            ("ÖTELEME", "global-analysis"), ("İKİNCİ MERTEBE", "global-analysis"),
                            ("SÜRTÜNME", "walls")):
        if keyword in text:
            return result
    return previous


STAGES = {"stairs": ["P14"], "foundations": ["P06", "P13"], "joints": ["P10"],
          "columns": ["P10"], "walls": ["P11"], "beams": ["P09"], "slabs": ["P12"],
          "loads": ["P05"], "geometry": ["P04", "P05"], "model": ["P03", "P05"],
          "global-analysis": ["P06", "P07", "P08"]}


def catalog_sections(group: str, contents: list[str], report: list[str]) -> list[dict]:
    page_map = {}
    for physical, page in enumerate(report, 1):
        footers = re.findall(r"Sayfa\s*:\s*(\d+)", page)
        if len(footers) != 1:
            raise ValueError(f"{group} physical page {physical}: printed footer ambiguous")
        printed_page = int(footers[0])
        if printed_page in page_map:
            raise ValueError("Duplicate printed page")
        page_map[printed_page] = physical
    entries = []
    occurrences = Counter()
    current_family = "geometry"
    for physical, page in enumerate(contents, 1):
        for line_no, line in enumerate(page.splitlines(), 1):
            if not line.strip() or any(value in line for value in SKIP_MARKERS):
                continue
            # SK'nin ilk sayfasında başlık değil lisans/müellif künyesi var.
            if re.match(r"\s*\S+\s+Statik \(Betonarme\+Çelik\) İnş\.Müh\.", line):
                continue
            match = re.fullmatch(r"\s*(.*?)\s{2,}(\d+)\s*", line)
            if not match:
                raise ValueError(f"Unclassified contents line {group}:{physical}:{line_no}: {line}")
            title, target = match[1].strip(), int(match[2])
            body_page = page_map[target]
            body_text = report[body_page-1]
            if normalized(title) not in normalized(body_text):
                raise ValueError(f"Contents target heading missing: {group}:{target}:{title}")
            current_family = family(title, current_family)
            occurrences[title] += 1
            entries.append({"id": f"{group}-toc-p{physical:03}-l{line_no:03}",
                            "title": title, "titleOccurrence": occurrences[title],
                            "contentsPhysicalPage": physical, "contentsSourceLine": line_no,
                            "reportPrintedPage": target, "reportPhysicalPage": body_page,
                            "bodyHeadingVerified": True, "family": current_family,
                            "plannedStages": STAGES[current_family],
                            "mappingAuthority": "editorial family mapping; not normative applicability",
                            "rawSourceLine": line})
    return entries


def row_identity(group: str, page: int, line: int) -> str:
    return f"{group}-takeoff-p{page:03}-l{line:03}"


def scalar_rows(group: str, page: str, page_no: int, metric: str, unit: str) -> list[dict]:
    rows = []
    floor = None
    table_started = False
    for line_no, line in enumerate(page.splitlines(), 1):
        text = line.strip()
        if "Açıklama" in line:
            table_started = True
            continue
        if not table_started or not text or any(value in line for value in SKIP_MARKERS):
            continue
        match = re.fullmatch(r"\s*(.*?)\s+(-?\d+\.\d+)\s*", line)
        row = {"id": row_identity(group, page_no, line_no), "sourcePhysicalPage": page_no,
               "sourcePrintedPage": page_no, "sourceLine": line_no, "rawSourceLine": line}
        if not match:
            if NUMBER.search(text):
                raise ValueError(f"Malformed scalar row: {line}")
            floor = text
            row.update(kind="floor_header", floor=floor, label=text, cells={})
        else:
            label, value = match[1].strip(), match[2]
            kind = "general_total" if label == "GENEL TOPLAM" else "floor_total" if label == "KAT TOPLAM" else "component"
            if kind == "component" and label not in COMPONENTS:
                raise ValueError(f"Unknown numeric component: {line}")
            row.update(kind=kind, floor=floor if kind != "general_total" else None,
                       label=label, cells={metric: cell(value, unit)})
        rows.append(row)
    return rows


def rebar_rows(group: str, page: str) -> list[dict]:
    rows = []
    columns = []
    floor = None
    for line_no, line in enumerate(page.splitlines(), 1):
        if "Açıklama" in line:
            columns = [(match.group(), (match.start()+match.end())/2)
                       for match in re.finditer(r"\(Ø8-Ø12\)|\(>=Ø14\)|Ø\d+", line)]
            if len(columns) != 15 or len(set(key for key, _ in columns)) != 15:
                raise ValueError("Expected 13 distinct diameter and 2 group columns")
            continue
        if not columns or not line.strip() or any(value in line for value in SKIP_MARKERS):
            continue
        tokens = list(NUMBER.finditer(line))
        row = {"id": row_identity(group, 3, line_no), "sourcePhysicalPage": 3,
               "sourcePrintedPage": 3, "sourceLine": line_no, "rawSourceLine": line}
        if not tokens:
            floor = line.strip()
            row.update(kind="floor_header", floor=floor, label=floor, cells={})
        else:
            label = line[:tokens[0].start()].strip()
            kind = "general_total" if label == "GENEL TOPLAM" else "floor_total" if label == "KAT TOPLAM" else "component"
            if kind == "component" and label not in COMPONENTS:
                raise ValueError(f"Unknown rebar component: {line}")
            values = {key: cell(None, "kg") for key, _ in columns}
            assigned = set()
            for token in tokens:
                center = (token.start()+token.end())/2
                key, column_center = min(columns, key=lambda col: abs(col[1]-center))
                if key in assigned or abs(column_center-center) > 4:
                    raise ValueError(f"Ambiguous diameter alignment {group}:{line_no}: {line}")
                assigned.add(key)
                values[key] = cell(token.group(), "kg")
            row.update(kind=kind, floor=floor if kind != "general_total" else None, label=label, cells=values)
        rows.append(row)
    return rows


def summary_rows(group: str, page: str) -> list[dict]:
    rows = []
    for line_no, line in enumerate(page.splitlines(), 1):
        match = re.fullmatch(r"\s*(.*?)\s{2,}(\d+\.\d+)\s*", line)
        if not match or any(value in line for value in SKIP_MARKERS):
            continue
        label, value = match[1].strip(), match[2]
        metric, unit = ("concreteM3", "m³") if "BETON" in label and "KALIP" not in label else ("formworkM2", "m²") if "KALIP" in label else ("rebarThinKg", "kg") if "İNCE" in label else ("rebarThickKg", "kg") if "KALIN" in label else ("rebarTotalKg", "kg") if "TOPLAM" in label else (None, None)
        if metric is None:
            raise ValueError(f"Unclassified summary: {line}")
        rows.append({"id": row_identity(group, 4, line_no), "sourcePhysicalPage": 4,
                     "sourcePrintedPage": 4, "sourceLine": line_no, "rawSourceLine": line,
                     "kind": "summary", "floor": None, "label": label, "cells": {metric: cell(value, unit)}})
    if len(rows) != 5:
        raise ValueError("Expected five summary rows")
    return rows


def takeoff_arithmetic(rows: list[dict]) -> list[dict]:
    checks = []
    for page in (1, 2, 3):
        page_rows = [row for row in rows if row["sourcePhysicalPage"] == page and row["cells"]]
        totals = [row for row in page_rows if row["kind"] == "floor_total"]
        general = next(row for row in page_rows if row["kind"] == "general_total")
        for total in totals:
            children = [row for row in page_rows if row["kind"] == "component" and row["floor"] == total["floor"]]
            for key, value in total["cells"].items():
                checks.append(compare_sum(total["id"]+":"+key, [row["cells"][key] for row in children], value))
        for key, value in general["cells"].items():
            checks.append(compare_sum(general["id"]+":"+key, [row["cells"][key] for row in totals], value))
        if page == 3:
            for row in page_rows:
                for group, diameters in (("(Ø8-Ø12)", (8, 10, 12)), ("(>=Ø14)", (14, 16, 18, 20, 22, 24, 26, 28, 30, 32))):
                    checks.append(compare_sum(row["id"]+":"+group+":diameters", [row["cells"][f"Ø{dia}"] for dia in diameters], row["cells"][group]))
    summary = {key: value for row in rows if row["kind"] == "summary" for key, value in row["cells"].items()}
    for page, key in ((1, "formworkM2"), (2, "concreteM3")):
        general = next(row for row in rows if row["sourcePhysicalPage"] == page and row["kind"] == "general_total")
        checks.append(compare_sum(f"summary:{key}", [general["cells"][key]], summary[key]))
    general = next(row for row in rows if row["sourcePhysicalPage"] == 3 and row["kind"] == "general_total")
    for key, group in (("rebarThinKg", "(Ø8-Ø12)"), ("rebarThickKg", "(>=Ø14)")):
        checks.append(compare_sum(f"summary:{key}", [general["cells"][group]], summary[key]))
    checks.append(compare_sum("summary:rebarTotalKg", [summary["rebarThinKg"], summary["rebarThickKg"]], summary["rebarTotalKg"]))
    return checks


def build(source: Path, destination: Path) -> dict:
    manifest = json.loads((source/"source-inventory.json").read_text(encoding="utf-8"))
    destination.mkdir(parents=True, exist_ok=False)
    sections = []
    summary = []
    identities = []
    for group in GROUPS:
        docs = {}
        for kind in ("kapak", "rapor", "metraj"):
            entry = next(item for item in manifest if item.get("id") == f"{group}-{kind}")
            source_pdf = Path(entry["path"])
            if sha256(source_pdf) != entry["sha256"]:
                raise ValueError(f"Source identity changed: {source_pdf}")
            pages_path = source/f"{group}-{kind}.pages.json"
            docs[kind] = json.loads(pages_path.read_text(encoding="utf-8"))
            if len(docs[kind]) != entry["pages"]:
                raise ValueError("Page count differs from manifest")
            identities.append({"id": entry["id"], "pdfSha256": entry["sha256"],
                               "pageTextSha256": sha256(pages_path), "pages": entry["pages"]})
        entries = catalog_sections(group, docs["kapak"], docs["rapor"])
        rows = scalar_rows(group, docs["metraj"][0], 1, "formworkM2", "m²")
        rows += scalar_rows(group, docs["metraj"][1], 2, "concreteM3", "m³")
        rows += rebar_rows(group, docs["metraj"][2]) + summary_rows(group, docs["metraj"][3])
        checks = takeoff_arithmetic(rows)
        native = next(item for item in manifest if item["group"] == group and item["path"].endswith(".ide10") and "iskele" not in item["path"])
        if sha256(Path(native["path"])) != native["sha256"]:
            raise ValueError("Native source identity changed")
        inputs = {"projectId": group, "authority": "reference_input_manifest; not a runnable structural model",
                  "nativeSource": {key: native[key] for key in ("path", "bytes", "sha256")},
                  "engineeringData": None, "unknownRequiredInputs": ["verified materials", "load semantics and self-weight", "analysis settings", "complete openings and physical roles", "reinforcement cut list", "stored-result freshness"],
                  "referenceDocuments": [item for item in identities if item["id"].startswith(group)],
                  "separateOracleFile": f"{group}.expected.json"}
        expected = {"projectId": group, "authority": "reference_document_output; not independently computed Hsyncad output",
                    "unitInterpretation": "m² formwork / m³ concrete / kg reinforcement, as established in source inspection; not every source table prints a unit label",
                    "blankCellMeaning": "printed blank retained as null; zero contribution only for printed-table arithmetic, not evidence of complete reinforcement design",
                    "rows": rows, "printedArithmeticChecks": checks}
        for name, data in ((f"{group}.input.json", inputs), (f"{group}.expected.json", expected)):
            (destination/name).write_text(json.dumps(data, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
        sections.extend(entries)
        summary.append({"projectId": group, "contentsEntries": len(entries), "bodyTargetsVerified": len(entries),
                        "takeoffRows": len(rows), "numericTakeoffRows": sum(bool(row["cells"]) for row in rows),
                        "arithmeticChecks": len(checks), "roundingInconsistentChecks": [check for check in checks if check.get("intervalsOverlap") is False]})
    catalog = {"scope": "every contents entry in all three source TOC PDFs; each target heading verified in report body; not every incidental table caption or body-only subheading",
               "editorialMapping": "family/plannedStages is report organization only; leaf normative applicability remains separate",
               "sections": sections, "sourceIdentities": identities}
    (destination/"reference-section-catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    audit = {"projects": summary, "totalContentsEntries": len(sections), "identityVerified": True,
             "noProductionImports": True, "structuralComparisonStatus": "not_run"}
    (destination/"corpus-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    return audit


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(build(args.source, args.output), ensure_ascii=False, indent=2))
