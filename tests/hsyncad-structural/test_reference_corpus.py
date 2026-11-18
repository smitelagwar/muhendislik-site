"""Referans çıkarımının kapsamını ve negatif sınırlarını doğrular; ürün hesabı değildir."""
import argparse
from collections import Counter
from decimal import Decimal
import importlib.util
import json
from pathlib import Path
import re
import sys
import unittest

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("reference_corpus", ROOT/"scripts/hsyncad/build_reference_corpus.py")
corpus = importlib.util.module_from_spec(spec)
spec.loader.exec_module(corpus)
SOURCE = None
OUTPUT = None


class ParserBoundaryTests(unittest.TestCase):
    def test_printed_precision_and_blank_differ_from_zero(self):
        self.assertEqual(corpus.cell("1.234", "m³")["roundingInterval"]["lower"], "1.2335")
        self.assertEqual(corpus.cell("1.23", "m³")["roundingInterval"]["upper"], "1.235")
        self.assertIsNone(corpus.cell(None, "kg")["printedValue"])
        self.assertEqual(corpus.cell("0.00", "kg")["printedValue"], "0.00")

    def test_inconsistent_total_is_not_hidden_by_rounding(self):
        result = corpus.compare_sum("synthetic", [corpus.cell("3.00", "kg"), corpus.cell("4.00", "kg")], corpus.cell("7.02", "kg"))
        self.assertFalse(result["intervalsOverlap"])
        self.assertEqual(result["delta"], "-0.02")

    def test_duplicate_printed_pages_and_missing_heading_fail(self):
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            corpus.catalog_sections("test", ["KİRİŞLER     1"], ["KİRİŞLER\nSayfa : 1", "KİRİŞLER\nSayfa : 1"])
        with self.assertRaisesRegex(ValueError, "heading missing"):
            corpus.catalog_sections("test", ["KİRİŞLER     1"], ["PERDELER\nSayfa : 1"])

    def test_repeated_headings_keep_separate_identity(self):
        entries = corpus.catalog_sections("test", ["MERDİVEN GENEL BİLGİSİ      1\nMERDİVEN GENEL BİLGİSİ      2"],
                                          ["MERDİVEN GENEL BİLGİSİ\nSayfa : 1", "MERDİVEN GENEL BİLGİSİ\nSayfa : 2"])
        self.assertEqual([row["titleOccurrence"] for row in entries], [1, 2])
        self.assertNotEqual(entries[0]["id"], entries[1]["id"])

    def test_unknown_numeric_row_and_incomplete_diameter_header_fail(self):
        with self.assertRaisesRegex(ValueError, "Unknown numeric"):
            corpus.scalar_rows("test", "Açıklama TOPLAM\nKAT A\nYENİ TÜR 12.00", 1, "m2", "m²")
        with self.assertRaisesRegex(ValueError, "distinct diameter"):
            corpus.rebar_rows("test", "Açıklama Ø8 Ø10 (Ø8-Ø12) (>=Ø14)")


class CorpusIntegrationTests(unittest.TestCase):
    def test_every_contents_entry_preserves_source_location(self):
        catalog = json.loads((OUTPUT/"reference-section-catalog.json").read_text(encoding="utf-8"))
        actual = {entry["id"]: entry for entry in catalog["sections"]}
        self.assertEqual(len(actual), 515)
        for group in corpus.GROUPS:
            pages = json.loads((SOURCE/f"{group}-kapak.pages.json").read_text(encoding="utf-8"))
            for page_no, page in enumerate(pages, 1):
                for line_no, line in enumerate(page.splitlines(), 1):
                    # Katalog üreticisinden bağımsız: dizin biçimiyle biten her satır.
                    match = re.search(r"\S.*\s{2,}\d+\s*$", line)
                    if not match or any(marker in line for marker in ("YAPAN:", "PROJE:", "TARİH:", "Lisans:", "Sayfa :")):
                        continue
                    identifier = f"{group}-toc-p{page_no:03}-l{line_no:03}"
                    self.assertEqual(actual[identifier]["rawSourceLine"], line)
                    self.assertTrue(actual[identifier]["bodyHeadingVerified"])

    def test_every_numeric_takeoff_row_is_present_once(self):
        for group in corpus.GROUPS:
            expected = json.loads((OUTPUT/f"{group}.expected.json").read_text(encoding="utf-8"))
            actual = {row["id"]: row for row in expected["rows"] if row["cells"]}
            pages = json.loads((SOURCE/f"{group}-metraj.pages.json").read_text(encoding="utf-8"))
            locations = []
            for page_no, page in enumerate(pages, 1):
                for line_no, line in enumerate(page.splitlines(), 1):
                    if re.search(r"\d+\.\d+\s*$", line) and not any(marker in line for marker in ("TARİH:", "PROJE:", "Lisans:", "Sayfa :")):
                        identifier = f"{group}-takeoff-p{page_no:03}-l{line_no:03}"
                        locations.append(identifier)
                        self.assertEqual(actual[identifier]["rawSourceLine"], line)
            self.assertEqual(set(actual), set(locations))
            self.assertEqual(len(actual), len(locations))

    def test_special_families_and_diameter_columns_survive(self):
        catalog = json.loads((OUTPUT/"reference-section-catalog.json").read_text(encoding="utf-8"))["sections"]
        for group, count in (("mustafa-1", 7), ("mustafa-2", 1), ("suheyla", 9)):
            self.assertEqual(sum(entry["id"].startswith(group) and entry["title"] == "MERDİVEN GENEL BİLGİSİ" for entry in catalog), count)
        sk = json.loads((OUTPUT/"suheyla.expected.json").read_text(encoding="utf-8"))
        radye = next(row for row in sk["rows"] if row["sourcePhysicalPage"] == 3 and row["label"] == "RADYE TEMELLER")
        self.assertEqual(radye["cells"]["Ø14"]["printedValue"], "21300.43")
        self.assertEqual(radye["cells"]["Ø16"]["printedValue"], "17189.26")
        self.assertIsNone(radye["cells"]["Ø12"]["printedValue"])

    def test_fixture_inputs_do_not_claim_solved_native_engineering_data(self):
        for group in corpus.GROUPS:
            inputs = json.loads((OUTPUT/f"{group}.input.json").read_text(encoding="utf-8"))
            self.assertIsNone(inputs["engineeringData"])
            self.assertEqual(len(inputs["unknownRequiredInputs"]), 6)
            self.assertEqual(inputs["separateOracleFile"], f"{group}.expected.json")

    def test_summary_recomputed_from_printed_groups_is_not_forced_to_target(self):
        values = {}
        for group in corpus.GROUPS:
            data = json.loads((OUTPUT/f"{group}.expected.json").read_text(encoding="utf-8"))
            summary = {key: Decimal(value["printedValue"]) for row in data["rows"] if row["kind"] == "summary" for key, value in row["cells"].items()}
            values[group] = summary["rebarThinKg"]+summary["rebarThickKg"]-summary["rebarTotalKg"]
            for row in data["printedArithmeticChecks"]:
                if "intervalsOverlap" in row:
                    self.assertTrue(row["intervalsOverlap"], row["id"])
        self.assertEqual(values, {"mustafa-1": Decimal("0.01"), "mustafa-2": Decimal("0.00"), "suheyla": Decimal("0.00")})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--corpus", required=True, type=Path)
    args = parser.parse_args()
    SOURCE, OUTPUT = args.source, args.corpus
    unittest.main(argv=[sys.argv[0]], verbosity=2)
