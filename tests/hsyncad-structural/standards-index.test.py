"""Kaynak indeksi sınırları; normatif hesap doğruluğu iddia etmez."""
import importlib.util
import pathlib
import sys
import unittest

sys.dont_write_bytecode = True

ROOT = pathlib.Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('standards_index', ROOT / 'scripts/hsyncad/build-standards-index.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class StandardsIndexTests(unittest.TestCase):
    def test_toc_does_not_become_rule(self):
        self.assertEqual(MODULE.numbered_blocks(['7.11.3. Döşemeler...........100'], 'part'), [])

    def test_multiline_contents_heading_is_not_a_normative_leaf(self):
        self.assertEqual(MODULE.numbered_blocks([
            '4.5. DOĞRUSAL HESAP İÇİN MODELLEME',
            'KURALLARI .......................................... 42',
        ], 'part'), [])

    def test_explicit_contents_region_excludes_rows_without_dotted_leaders(self):
        blocks = MODULE.numbered_blocks([
            'İÇİNDEKİLER', '7.13. UYGULAMA PROJELERİ 141',
            'BÖLÜM 1 – GENEL HÜKÜMLER', '1.1. KAPSAM', '1.1.1 – Gerçek hüküm',
        ], 'part')
        self.assertEqual([b['clause'] for b in blocks], ['1.1', '1.1.1'])
        self.assertEqual(blocks[0]['paragraph'], 4)

    def test_nested_clauses_keep_source_and_subclauses(self):
        blocks = MODULE.numbered_blocks(['4.8.1. Modal yöntem', '4.8.1.2 – Kural',
                                         '(a) Birinci koşul', '(b) İkinci koşul'], 'part')
        self.assertEqual([b['clause'] for b in blocks], ['4.8.1', '4.8.1.2'])
        self.assertEqual(blocks[0]['classification'], 'parent')
        self.assertEqual(blocks[1]['classification'], 'leaf_candidate')
        self.assertEqual(blocks[1]['paragraph'], 2)
        self.assertEqual(blocks[1]['member'], 'part')
        self.assertEqual(blocks[1]['textCharacters'], len('4.8.1.2 – Kural\n(a) Birinci koşul\n(b) İkinci koşul'))

    def test_catalog_cannot_approve_rule_use(self):
        self.assertFalse(MODULE.source_ready_for_rule_use({'authority': 'official_catalog_metadata'}))

    def test_full_text_without_amendment_review_is_insufficient(self):
        self.assertFalse(MODULE.source_ready_for_rule_use({'fullTextVerified': True,
                                                         'equationsReviewed': True,
                                                         'engineeringReviewed': True}))

    def test_rule_use_requires_all_independent_gates(self):
        record = {key: True for key in ['fullTextVerified', 'amendmentSetVerified',
                                        'equationsReviewed', 'engineeringReviewed']}
        self.assertTrue(MODULE.source_ready_for_rule_use(record))
        for key in record:
            incomplete = {**record, key: False}
            self.assertFalse(MODULE.source_ready_for_rule_use(incomplete))


if __name__ == '__main__':
    unittest.main()
