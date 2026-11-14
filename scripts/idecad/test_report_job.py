import hashlib
import json
import struct
import sys
import zlib
from pathlib import Path
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))

from report_job import (
    DEFAULT_SECTIONS,
    IDE_KAPAK_INDEX,
    OPTIONAL_SECTIONS,
    RPT_DEFAULT_ASSET,
    RPT_HEADER,
    SECTION_GROUPS,
    apply_report_profile,
    build_rpt_profile,
    desktop_lock,
    floor_matches_title,
    main as cli_main,
    matches_displayed_source,
    prepare,
    run_job,
    select_active_floor,
    verify_preview,
)


def carrier():
    signature = b"IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI\r\n"
    data = bytearray(128)
    data[:len(signature)] = signature
    struct.pack_into("<IBI", data, 74, 201094, 0, len(data))
    struct.pack_into("<I", data, 96, 1)
    struct.pack_into("<I", data, 83, (~zlib.crc32(data[88:])) & 0xffffffff)
    return bytes(data)


class PreparationTests(unittest.TestCase):
    def test_immutable_source_receipt_and_option_fingerprint(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "project.ide10"
            source.write_bytes(carrier())
            sha = hashlib.sha256(source.read_bytes()).hexdigest()
            receipt = prepare(source, sha, "rev-3", {"scope": "all", "analysis": "saved"}, root / "jobs")
            job = root / "jobs" / receipt["jobId"]
            self.assertEqual((job / "source.ide10").read_bytes(), source.read_bytes())
            self.assertEqual(json.loads((job / "receipt.json").read_text(encoding="utf-8")), receipt)
            self.assertEqual(receipt["status"], "prepared")
            self.assertEqual(receipt["preview"], "not_started")
            self.assertEqual(receipt["pdf"], "blocked")
            self.assertNotIn(str(source), json.dumps(receipt))
            self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(), sha)

    def test_desktop_lock_excludes_another_process_and_releases(self):
        import subprocess
        import sys
        with tempfile.TemporaryDirectory() as temp:
            code = "from pathlib import Path; from report_job import desktop_lock; " \
                   "c=desktop_lock(Path(__import__('sys').argv[1])); c.__enter__(); c.__exit__(None,None,None)"
            with desktop_lock(Path(temp)):
                result = subprocess.run([sys.executable, "-c", code, temp], capture_output=True, timeout=10, cwd=Path(__file__).parent)
                self.assertNotEqual(result.returncode, 0)
            result = subprocess.run([sys.executable, "-c", code, temp], capture_output=True, timeout=10, cwd=Path(__file__).parent)
            self.assertEqual(result.returncode, 0, result.stderr.decode(errors="replace"))

    def test_preview_requires_fresh_child_and_unchanged_source(self):
        good = dict(parent_pid=10, viewer_pid=20, viewer_parent_pid=10,
                    viewer_created_ms=101, report_modified_ms=102, report_bytes=64,
                    report_header=b"IDERPT FILE 11.00", request_started_ms=100,
                    source_hash_before="same", source_hash_after="same")
        verify_preview(**good)
        for change in ({"viewer_parent_pid": 11}, {"viewer_created_ms": 99},
                       {"report_modified_ms": 99}, {"report_header": b"%PDF"},
                       {"source_hash_after": "changed"}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                verify_preview(**(good | change))

    def test_truncated_analysis_path_must_match_both_ends(self):
        source = Path(r"D:\jobs\abc123\source.ide10")
        self.assertTrue(matches_displayed_source(r"Proje dosyası : D:\jobs\abc...\source.ide10", source))
        self.assertFalse(matches_displayed_source(r"Proje dosyası : D:\jobs\different...\source.ide10", source))
        self.assertFalse(matches_displayed_source(r"Proje dosyası : D:\jobs\abc...\other.ide10", source))

    def test_damaged_crc_is_rejected_even_when_sha_matches(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "project.ide10"
            damaged = bytearray(carrier()); damaged[-1] ^= 1; source.write_bytes(damaged)
            with self.assertRaisesRegex(ValueError, "CRC32"):
                prepare(source, hashlib.sha256(damaged).hexdigest(), "rev", {"scope": "all", "analysis": "saved"}, root / "jobs")
            self.assertFalse((root / "jobs").exists())

    @unittest.skipUnless(__import__("os").name == "nt", "Windows job runner")
    def test_source_changed_after_prepare_fails_receipt_without_opening_gui(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as temp, patch.dict("os.environ", {"LOCALAPPDATA": temp}):
            root = Path(temp); source = root / "project.ide10"; source.write_bytes(carrier())
            sha = hashlib.sha256(source.read_bytes()).hexdigest()
            receipt = prepare(source, sha, "rev", {"scope": "all", "analysis": "saved"}, root / "jobs")
            source.write_bytes(b"changed")
            with self.assertRaises(ValueError):
                run_job(receipt["jobId"], root / "jobs", source, Path("unused.exe"))
            final = json.loads((root / "jobs" / receipt["jobId"] / "receipt.json").read_text(encoding="utf-8"))
            self.assertEqual(final["status"], "failed")
            self.assertEqual(final["preview"], "not_verified")
            self.assertIsNone(final["idecadPid"])

    def test_mismatch_or_unverified_option_creates_no_job(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "project.ide10"
            source.write_bytes(carrier())
            jobs = root / "jobs"
            sha = hashlib.sha256(source.read_bytes()).hexdigest()
            with self.assertRaises(ValueError):
                prepare(source, "0" * 64, "rev", {"scope": "all", "analysis": "fresh"}, jobs)
            with self.assertRaises(ValueError):
                prepare(source, sha, "rev", {"scope": "floor", "analysis": "saved"}, jobs)
            self.assertFalse(jobs.exists())


class ProfileAndScopeTests(unittest.TestCase):
    DEFAULT_ASSET_SHA256 = "3deccaa53e18e7fe48d66e09830827ef4588c4688f1098ed2495f7dd1329334e"

    def test_build_rpt_profile_default_matches_verified_asset(self):
        base = RPT_DEFAULT_ASSET.read_bytes()
        self.assertEqual(len(DEFAULT_SECTIONS), 14)
        self.assertEqual(len(OPTIONAL_SECTIONS), 7)
        self.assertEqual(len(SECTION_GROUPS), 21)
        generated = build_rpt_profile(base)
        self.assertEqual(generated, base)
        self.assertEqual(hashlib.sha256(generated).hexdigest(), self.DEFAULT_ASSET_SHA256)

    def test_build_rpt_profile_toggles_ide_kapak_and_sections(self):
        base = RPT_DEFAULT_ASSET.read_bytes()
        no_cover = build_rpt_profile(base, ide_kapak=False)
        kapak_offset = len(RPT_HEADER) + 4 + IDE_KAPAK_INDEX
        self.assertEqual(kapak_offset, 48)
        self.assertEqual(no_cover[kapak_offset], 0)
        diffs = [i for i, (a, b) in enumerate(zip(base, no_cover)) if a != b]
        self.assertEqual(diffs, [kapak_offset])

        minimal = build_rpt_profile(base, sections=["aciklama", "kat_yuk"], ide_kapak=True)
        self.assertEqual(minimal[kapak_offset], 1)
        for idx in SECTION_GROUPS["aciklama"] + SECTION_GROUPS["kat_yuk"]:
            self.assertEqual(minimal[len(RPT_HEADER) + 4 + idx], 1)
        for key, indices in SECTION_GROUPS.items():
            if key not in ("aciklama", "kat_yuk"):
                for idx in indices:
                    self.assertEqual(minimal[len(RPT_HEADER) + 4 + idx], 0)

        all_groups = build_rpt_profile(base, sections=list(SECTION_GROUPS.keys()), ide_kapak=True)
        for indices in SECTION_GROUPS.values():
            for idx in indices:
                self.assertEqual(all_groups[len(RPT_HEADER) + 4 + idx], 1)

    def test_build_rpt_profile_rejects_invalid_inputs(self):
        base = RPT_DEFAULT_ASSET.read_bytes()
        for bad_sections in ([], ["celik"], ["bilinmeyen"], ["aciklama", "aciklama"], "aciklama"):
            with self.subTest(bad_sections=bad_sections), self.assertRaises(ValueError):
                build_rpt_profile(base, sections=bad_sections)  # type: ignore[arg-type]
        with self.assertRaises(ValueError):
            build_rpt_profile(base, ide_kapak=1)  # type: ignore[arg-type]
        with self.assertRaises(ValueError):
            build_rpt_profile(b"short")
        bad_header = bytearray(base)
        bad_header[:4] = b"XXXX"
        with self.assertRaises(ValueError):
            build_rpt_profile(bytes(bad_header))
        bad_ver = bytearray(base)
        struct.pack_into("<I", bad_ver, len(RPT_HEADER), 211270)
        with self.assertRaises(ValueError):
            build_rpt_profile(bytes(bad_ver))

    def test_prepare_generates_profile_and_validates_scope_options(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "project.ide10"
            source.write_bytes(carrier())
            sha = hashlib.sha256(source.read_bytes()).hexdigest()
            jobs = root / "jobs"

            receipt = prepare(
                source,
                sha,
                "rev-4",
                {
                    "scope": "active_floor",
                    "analysis": "saved",
                    "activeFloorName": "ZEMİN KAT",
                    "sections": ["aciklama", "kat_yuk"],
                    "ideKapak": False,
                },
                jobs,
            )
            profile_path = jobs / receipt["jobId"] / "report-profile.rpt"
            self.assertTrue(profile_path.is_file())
            self.assertEqual(receipt["profileSha256"], hashlib.sha256(profile_path.read_bytes()).hexdigest())
            self.assertEqual(profile_path.read_bytes()[48], 0)

            bad_options_list = [
                {"scope": "selected", "analysis": "saved"},
                {"scope": "floor", "analysis": "saved"},
                {"scope": "all", "analysis": "saved", "activeFloorName": "ZEMİN KAT"},
                {"scope": "active_floor", "analysis": "saved"},
                {"scope": "active_floor", "analysis": "saved", "activeFloorName": "   "},
                {"scope": "active_floor", "analysis": "saved", "activeFloorName": "K" * 65},
                {"scope": "active_floor", "analysis": "saved", "activeFloorName": "ZEMİN\nKAT"},
                {"scope": "all", "analysis": "saved", "ideKapak": "no"},
                {"scope": "all", "analysis": "saved", "sections": None},
                {"scope": "all", "analysis": "saved", "sections": []},
                {"scope": "all", "analysis": "saved", "sections": ["celik"]},
            ]
            bad_jobs = root / "bad-jobs"
            for bad_opts in bad_options_list:
                with self.subTest(bad_opts=bad_opts), self.assertRaises(ValueError):
                    prepare(source, sha, "rev-4", bad_opts, bad_jobs)
            self.assertFalse(bad_jobs.exists())

    def test_floor_matches_title_turkish_normalization(self):
        self.assertTrue(floor_matches_title("ideCAD Statik [ZEMİN KAT TAVANI, 4.50 KOTU]", "ZEMİN KAT"))
        self.assertTrue(floor_matches_title("ideCAD Statik [ZEMİN KAT TAVANI, 4.50 KOTU]", "zemin kat"))
        self.assertTrue(floor_matches_title("ideCAD Statik [ZEMİN KAT TAVANI, 4.50 KOTU]", "ZEMIN KAT"))
        self.assertTrue(floor_matches_title("ideCAD Statik [1. BODRUM, -3.00 KOTU]", "1. BODRUM"))
        self.assertFalse(floor_matches_title("ideCAD Statik [11. KAT TAVANI, 33.00 KOTU]", "1. KAT"))
        self.assertFalse(floor_matches_title("ideCAD Statik [1. BODRUM, -3.00 KOTU]", "ZEMİN KAT"))
        self.assertFalse(floor_matches_title("ideCAD Statik", "ZEMİN KAT"))

    def test_cli_preserves_default_options_sha_and_supports_new_flags(self):
        import io
        import sys
        from unittest.mock import patch

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "project.ide10"
            source.write_bytes(carrier())
            sha = hashlib.sha256(source.read_bytes()).hexdigest()

            baseline = prepare(source, sha, "rev-cli", {"scope": "all", "analysis": "saved"}, root / "jobs-base")
            stdout = io.StringIO()
            with patch.object(
                sys,
                "argv",
                ["report_job.py", "--source", str(source), "--sha256", sha, "--revision", "rev-cli", "--analysis", "saved", "--job-root", str(root / "jobs-cli")],
            ), patch("sys.stdout", stdout):
                code = cli_main()
            self.assertEqual(code, 0)
            cli_receipt = json.loads(stdout.getvalue())
            self.assertEqual(cli_receipt["optionsSha256"], baseline["optionsSha256"])
            self.assertEqual(cli_receipt["profileSha256"], self.DEFAULT_ASSET_SHA256)

            stdout2 = io.StringIO()
            with patch.object(
                sys,
                "argv",
                [
                    "report_job.py",
                    "--source", str(source),
                    "--sha256", sha,
                    "--revision", "rev-cli",
                    "--analysis", "saved",
                    "--job-root", str(root / "jobs-cli2"),
                    "--scope", "active_floor",
                    "--active-floor-name", "ZEMİN KAT",
                    "--sections", "aciklama,kat_yuk",
                    "--ide-kapak", "no",
                ],
            ), patch("sys.stdout", stdout2):
                code2 = cli_main()
            self.assertEqual(code2, 0)
            cli_receipt2 = json.loads(stdout2.getvalue())
            self.assertEqual(cli_receipt2["reportOptions"], {
                "scope": "active_floor",
                "analysis": "saved",
                "activeFloorName": "ZEMİN KAT",
                "sections": ["aciklama", "kat_yuk"],
                "ideKapak": False,
            })

            stderr = io.StringIO()
            with patch.object(
                sys,
                "argv",
                [
                    "report_job.py",
                    "--source", str(source),
                    "--sha256", sha,
                    "--revision", "rev-cli",
                    "--analysis", "saved",
                    "--job-root", str(root / "jobs-bad"),
                    "--sections", "celik",
                ],
            ), patch("sys.stderr", stderr):
                bad_code = cli_main()
            self.assertEqual(bad_code, 1)
            self.assertIn("failed", stderr.getvalue())

    def test_select_active_floor_and_apply_report_profile_mocked(self):
        from types import SimpleNamespace
        from unittest.mock import patch

        class FakeFloorDriver:
            def __init__(self):
                self.title = "ideCAD [ZEMİN KAT TAVANI, 0.00 KOTU]"
                self.clicks = 0

            def call(self, *args):
                cmd = args[0]
                if cmd == "observe":
                    return {
                        "observation": "obs-1",
                        "target": {"hwnd": 100, "class": "ideCADMainFrame", "rect": [0, 0, 2560, 1400]},
                        "main_title": self.title,
                    }
                if cmd == "click":
                    self.clicks += 1
                    if self.clicks == 2:
                        self.title = "ideCAD [1. BODRUM, -3.00 KOTU]"
                    return {
                        "observation": "obs-2",
                        "target": {"hwnd": 100, "class": "ideCADMainFrame", "rect": [0, 0, 2560, 1400]},
                        "windows": [{"hwnd": 200, "title": "", "class": "Afx:00400000:8", "rect": [10, 100, 180, 170]}],
                    }
                raise AssertionError(cmd)

        drv = FakeFloorDriver()
        res_already = select_active_floor(drv, "ZEMİN KAT")  # type: ignore[arg-type]
        self.assertEqual(drv.clicks, 0)
        self.assertIn("ZEMİN KAT", res_already["main_title"])

        res_switched = select_active_floor(drv, "1. BODRUM")  # type: ignore[arg-type]
        self.assertEqual(drv.clicks, 2)
        self.assertIn("1. BODRUM", res_switched["main_title"])

        with tempfile.TemporaryDirectory() as temp:
            job_dir = Path(temp)
            profile = job_dir / "report-profile.rpt"
            profile.write_bytes(build_rpt_profile(RPT_DEFAULT_ASSET.read_bytes(), sections=["aciklama", "kat_yuk"]))

            class FakeProfileDriver:
                def __init__(self, initial_radio=10220):
                    self.stage = "main"
                    self.scope_radio = initial_radio

                def _controls(self):
                    return [
                        {"controlId": 2685, "enabled": True, "visible": True, "rect": [100, 100, 150, 120]},
                        {"controlId": 2461, "enabled": True, "visible": True, "rect": [160, 100, 210, 120]},
                        {"controlId": 10200, "enabled": True, "visible": True, "rect": [220, 100, 240, 120], "check": 1 if self.scope_radio == 10200 else 0},
                        {"controlId": 10220, "enabled": True, "visible": True, "rect": [250, 100, 270, 120], "check": 1 if self.scope_radio == 10220 else 0},
                    ]

                def _state(self):
                    if self.stage == "main":
                        return {
                            "observation": "obs-main",
                            "image": str(job_dir / "fake.png"),
                            "target": {"hwnd": 100, "class": "ideCADMainFrame", "rect": [0, 0, 2560, 1400]},
                        }
                    if self.stage == "open":
                        return {"observation": "obs-open", "target": {"hwnd": 301, "title": "Aç", "rect": [0, 0, 500, 400]}, "focus": {"class": "Edit"}}
                    if self.stage == "saveas":
                        return {"observation": "obs-save", "target": {"hwnd": 302, "title": "Farklı Kaydet", "rect": [0, 0, 500, 400]}, "focus": {"class": "Edit"}}
                    return {
                        "observation": "obs-settings",
                        "target": {"hwnd": 300, "title": "Statik Rapor Ayarları", "rect": [0, 0, 800, 600]},
                        "controls": self._controls(),
                    }

                def call(self, *args):
                    cmd = args[0]
                    if cmd == "observe":
                        return self._state()
                    if cmd == "click":
                        x = int(args[args.index("--x") + 1])
                        if self.stage == "main":
                            self.stage = "settings"
                        elif self.stage == "settings":
                            if 100 <= x <= 150:
                                self.stage = "open"
                            elif 160 <= x <= 210:
                                self.stage = "saveas"
                            elif 220 <= x <= 240:
                                self.scope_radio = 10200
                            elif 250 <= x <= 270:
                                self.scope_radio = 10220
                    elif cmd == "replace":
                        text = args[args.index("--text") + 1]
                        if self.stage == "saveas":
                            Path(text).write_bytes(profile.read_bytes())
                    elif cmd == "key":
                        if self.stage in ("open", "saveas"):
                            self.stage = "settings"
                    return self._state()

            fake_img = SimpleNamespace(size=(2576, 1416), convert=lambda _mode: SimpleNamespace(size=(2576, 1416), crop=lambda _box: None))
            with patch("PIL.Image.open", return_value=fake_img), patch("PIL.ImageChops.difference", return_value=SimpleNamespace(getbbox=lambda: None)):
                pdrv = FakeProfileDriver(initial_radio=10220)
                st_active = apply_report_profile(pdrv, profile, job_dir, scope="active_floor")  # type: ignore[arg-type]
                self.assertEqual(pdrv.scope_radio, 10200)
                readback = job_dir / "report-profile-readback.rpt"
                self.assertTrue(readback.is_file())
                self.assertEqual(next(c["check"] for c in st_active["controls"] if c["controlId"] == 10200), 1)

                readback.unlink()
                pdrv_all = FakeProfileDriver(initial_radio=10200)
                st_all = apply_report_profile(pdrv_all, profile, job_dir, scope="all")  # type: ignore[arg-type]
                self.assertEqual(pdrv_all.scope_radio, 10220)
                self.assertEqual(next(c["check"] for c in st_all["controls"] if c["controlId"] == 10220), 1)

    def test_build_rpt_profile_matches_captured_idecad_evidence(self):
        evidence_dir = Path(r"D:\HsyncadHybridOS\idecad-rapor-hizli-2026-11-13\asama3-kanit")
        if not evidence_dir.is_dir():
            return
        base = RPT_DEFAULT_ASSET.read_bytes()
        default_keys = list(DEFAULT_SECTIONS.keys())
        cases = [
            ("ms1-initial.rpt", default_keys, True),
            ("readback-betonarme.rpt", default_keys, True),
            ("g01-aciklama-off.rpt", [k for k in default_keys if k != "aciklama"], True),
            ("readback-g01.rpt", [k for k in default_keys if k != "aciklama"], True),
            ("g02-katyuk-off.rpt", [k for k in default_keys if k not in ("aciklama", "kat_yuk")], True),
            ("g03-dinamik-off.rpt", [k for k in default_keys if k not in ("aciklama", "kat_yuk", "dinamik")], True),
            ("test-02-ide-kapak-white-off.rpt", default_keys, False),
        ]
        for filename, sections, ide_kapak in cases:
            path = evidence_dir / filename
            if path.is_file():
                with self.subTest(filename=filename):
                    self.assertEqual(build_rpt_profile(base, sections=sections, ide_kapak=ide_kapak), path.read_bytes())

        g07_sections = [k for k in default_keys if k not in ("aciklama", "kat_yuk", "dinamik", "kolon")]
        expected_g07 = build_rpt_profile(base, sections=g07_sections, ide_kapak=True)
        header_len = len(RPT_HEADER) + 4
        for filename in ("g07-kolon-off.rpt", "readback-g07.rpt"):
            path = evidence_dir / filename
            if path.is_file():
                actual = path.read_bytes()
                with self.subTest(filename=filename):
                    for indices in SECTION_GROUPS.values():
                        for idx in indices:
                            self.assertEqual(expected_g07[header_len + idx], actual[header_len + idx])

    def test_build_rpt_profile_with_146_rpt_flags_roundtrip_and_cli(self):
        import io
        from unittest.mock import patch

        base = RPT_DEFAULT_ASSET.read_bytes()
        header_len = len(RPT_HEADER) + 4
        initial_false = {
            13, 28, 79, 80, 81, 82, 86, 87, 88, 89, 108, 113, 114, 115, 116, 117, 118,
            132, 133, 134, 135, 136, 137, 138, 139, 140, 143, 145,
        }
        initial_flags = [i not in initial_false for i in range(146)]
        rebuilt = build_rpt_profile(base, rpt_flags=initial_flags)
        self.assertEqual(rebuilt, base)
        self.assertEqual(hashlib.sha256(rebuilt).hexdigest(), self.DEFAULT_ASSET_SHA256)

        # Custom leaf toggle + ide_kapak=False override
        custom_flags = list(initial_flags)
        custom_flags[13] = True   # perde_orani on
        custom_flags[28] = True   # doseme_statik on
        custom_flags[3] = False   # rapor_indeksi off
        custom_profile = build_rpt_profile(base, sections=["aciklama", "duzensizlik", "doseme"], ide_kapak=False, rpt_flags=custom_flags)
        readback_flags = [b == 1 for b in custom_profile[header_len:]]
        expected_readback = list(custom_flags)
        expected_readback[IDE_KAPAK_INDEX] = False
        self.assertEqual(readback_flags, expected_readback)

        # Invalid rpt_flags
        for bad in ([True] * 145, [True] * 147, [1] * 146, "1" * 146):
            with self.subTest(bad=type(bad)), self.assertRaises(ValueError):
                build_rpt_profile(base, rpt_flags=bad)  # type: ignore[arg-type]

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "project.ide10"
            source.write_bytes(carrier())
            sha = hashlib.sha256(source.read_bytes()).hexdigest()

            # prepare() with rptFlags
            receipt = prepare(source, sha, "rev-rpt", {"scope": "all", "analysis": "saved", "rptFlags": custom_flags, "ideKapak": False}, root / "jobs")
            saved_profile = (root / "jobs" / receipt["jobId"] / "report-profile.rpt").read_bytes()
            self.assertEqual(saved_profile, custom_profile)

            # Invalid rptFlags in prepare()
            with self.assertRaises(ValueError):
                prepare(source, sha, "rev-rpt", {"scope": "all", "analysis": "saved", "rptFlags": [True] * 10}, root / "jobs-bad")

            # CLI --rpt-flags (146-char 0/1 string)
            bitstring = "".join("1" if f else "0" for f in custom_flags)
            stdout = io.StringIO()
            with patch.object(
                sys,
                "argv",
                [
                    "report_job.py",
                    "--source", str(source),
                    "--sha256", sha,
                    "--revision", "rev-cli-flags",
                    "--analysis", "saved",
                    "--job-root", str(root / "jobs-cli"),
                    "--ide-kapak", "no",
                    "--rpt-flags", bitstring,
                ],
            ), patch("sys.stdout", stdout):
                code = cli_main()
            self.assertEqual(code, 0)
            cli_receipt = json.loads(stdout.getvalue())
            self.assertEqual(cli_receipt["profileSha256"], hashlib.sha256(custom_profile).hexdigest())

            # CLI --rpt-flags (comma-separated)
            csv_flags = ",".join("1" if f else "0" for f in initial_flags)
            stdout2 = io.StringIO()
            with patch.object(
                sys,
                "argv",
                [
                    "report_job.py",
                    "--source", str(source),
                    "--sha256", sha,
                    "--revision", "rev-cli-csv",
                    "--analysis", "saved",
                    "--job-root", str(root / "jobs-cli-csv"),
                    "--rpt-flags", csv_flags,
                ],
            ), patch("sys.stdout", stdout2):
                code2 = cli_main()
            self.assertEqual(code2, 0)
            cli_receipt2 = json.loads(stdout2.getvalue())
            self.assertEqual(cli_receipt2["profileSha256"], self.DEFAULT_ASSET_SHA256)

            # CLI --rpt-flags invalid
            stderr = io.StringIO()
            with patch.object(
                sys,
                "argv",
                [
                    "report_job.py",
                    "--source", str(source),
                    "--sha256", sha,
                    "--revision", "rev-cli-bad",
                    "--analysis", "saved",
                    "--job-root", str(root / "jobs-cli-bad"),
                    "--rpt-flags", "1010",
                ],
            ), patch("sys.stderr", stderr):
                bad_code = cli_main()
            self.assertEqual(bad_code, 1)


if __name__ == "__main__":
    unittest.main()
