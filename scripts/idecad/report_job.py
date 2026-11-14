"""Local ideCAD report job preparation; never treats a preview as a PDF.

Only the trusted local host may provide input paths. User-selected bytes should be
staged by that host; paths are never accepted directly from a browser.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import struct
import zlib
import sys
import time
import unicodedata
import uuid

MAX_BYTES = 512 * 1024 * 1024

RPT_HEADER = b"IDE BUILDING DESIGNER REPORT SETTINGS FILE\x00"
RPT_VERSION = 211280
RPT_PAYLOAD_LEN = 146
RPT_TOTAL_LEN = len(RPT_HEADER) + 4 + RPT_PAYLOAD_LEN  # 193 bytes
RPT_DEFAULT_ASSET = Path(__file__).parent / "report-assets/betonarme-11-28.rpt"
IDE_KAPAK_INDEX = 1

DEFAULT_SECTIONS: dict[str, list[int]] = {
    "aciklama": [1, 2, 3, 4, 5, 6, 7, 8],
    "kat_yuk": [122, 123, 124, 125, 141, 142],
    "dinamik": [126, 127, 128, 129],
    "duzensizlik": [9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 21, 22, 23, 85],
    "doseme": [24, 25, 26, 27, 29, 30, 31, 32, 33, 90, 91],
    "kiris": [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
    "kolon": [47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 60],
    "perde": [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 83, 84],
    "perde_grubu": [71, 72, 73, 74, 75, 76, 77, 78],
    "birlesim": [119, 120],
    "surekli_temel": [92, 93, 94, 95, 96, 97, 98],
    "tekil_temel": [99, 100, 101, 102, 103],
    "radye": [104, 105, 106, 107, 109, 110, 111, 112],
    "merdiven": [130, 131],
}

OPTIONAL_SECTIONS: dict[str, list[int]] = {
    "bag_kiris": [135, 136],
    "kazik": [113, 114, 115, 116, 117, 118],
    "izolator": [143, 145],
    "istinat": [132],
    "kuyu_temel": [133],
    "iskele": [134],
    "guclendirme": [137, 138, 140],
}

SECTION_GROUPS: dict[str, list[int]] = {**DEFAULT_SECTIONS, **OPTIONAL_SECTIONS}
ALLOWED_OPTION_KEYS = {"scope", "analysis", "staircaseSmart", "activeFloorName", "sections", "ideKapak", "rptFlags"}


def _validate_rpt_flags(rpt_flags: object) -> list[bool]:
    if not isinstance(rpt_flags, list) or len(rpt_flags) != RPT_PAYLOAD_LEN or any(type(v) is not bool for v in rpt_flags):
        raise ValueError("rptFlags 146 adet boolean içermelidir")
    return list(rpt_flags)


def _parse_cli_rpt_flags(raw: str) -> list[bool]:
    text = raw.strip()
    if "," in text:
        parts = [p.strip().lower() for p in text.split(",")]
        if len(parts) != RPT_PAYLOAD_LEN:
            raise ValueError("rptFlags 146 adet bayrak içermelidir")
        parsed: list[bool] = []
        for p in parts:
            if p in ("1", "true"):
                parsed.append(True)
            elif p in ("0", "false"):
                parsed.append(False)
            else:
                raise ValueError("Geçersiz rptFlags değeri")
        return parsed
    if len(text) != RPT_PAYLOAD_LEN or any(c not in ("0", "1") for c in text):
        raise ValueError("rptFlags 146 karakterlik 0/1 dizisi olmalıdır")
    return [c == "1" for c in text]


def build_rpt_profile(
    base_bytes: bytes,
    sections: list[str] | None = None,
    ide_kapak: bool = True,
    rpt_flags: list[bool] | None = None,
) -> bytes:
    """Build a 193-byte ideCAD 11.28 .rpt profile from verified tree group offsets or explicit 146 flags."""
    if not isinstance(base_bytes, (bytes, bytearray)) or len(base_bytes) != RPT_TOTAL_LEN:
        raise ValueError("Temel RPT profili 193 bayt olmalıdır")
    if base_bytes[:len(RPT_HEADER)] != RPT_HEADER:
        raise ValueError("Temel RPT başlığı geçersiz")
    if struct.unpack_from("<I", base_bytes, len(RPT_HEADER))[0] != RPT_VERSION:
        raise ValueError("Temel RPT sürümü 211280 (11.28) değil")
    if type(ide_kapak) is not bool:
        raise ValueError("ideKapak boolean olmalıdır")

    if rpt_flags is not None:
        validated_flags = _validate_rpt_flags(rpt_flags)
        if sections is not None:
            if not isinstance(sections, list):
                raise ValueError("sections liste olmalıdır")
            if any(not isinstance(s, str) or s not in SECTION_GROUPS for s in sections):
                raise ValueError("Doğrulanmamış rapor bölümü seçildi")
            if len(set(sections)) != len(sections):
                raise ValueError("Tekrarlanan rapor bölümü geçersiz")
        buf = bytearray(base_bytes)
        header_len = len(RPT_HEADER) + 4
        for idx, flag in enumerate(validated_flags):
            buf[header_len + idx] = 1 if flag else 0
        if not ide_kapak:
            buf[header_len + IDE_KAPAK_INDEX] = 0
        return bytes(buf)

    if sections is None:
        selected = list(DEFAULT_SECTIONS.keys())
    else:
        if not isinstance(sections, list) or not sections:
            raise ValueError("En az bir rapor bölümü seçilmelidir")
        if any(not isinstance(s, str) or s not in SECTION_GROUPS for s in sections):
            raise ValueError("Doğrulanmamış rapor bölümü seçildi")
        if len(set(sections)) != len(sections):
            raise ValueError("Tekrarlanan rapor bölümü geçersiz")
        selected = sections

    buf = bytearray(base_bytes)
    header_len = len(RPT_HEADER) + 4
    for indices in SECTION_GROUPS.values():
        for idx in indices:
            buf[header_len + idx] = 0
    for key in selected:
        for idx in SECTION_GROUPS[key]:
            buf[header_len + idx] = 1
    if not ide_kapak:
        buf[header_len + IDE_KAPAK_INDEX] = 0
    return bytes(buf)


def normalize_tr(value: str) -> str:
    """Fold Turkish characters consistently for floor-title comparisons."""
    folded = value.replace("İ", "i").replace("I", "i").replace("ı", "i").casefold().strip()
    return "".join(ch for ch in unicodedata.normalize("NFKD", folded) if not unicodedata.combining(ch))


def floor_matches_title(main_title: str, target_floor_name: str) -> bool:
    """Check whether ideCADMainFrame's bracketed floor title matches target_floor_name."""
    start = main_title.rfind("[")
    end = main_title.rfind("]")
    if start == -1 or end <= start:
        return False
    bracket = main_title[start + 1:end].strip()
    floor_part = bracket.split(",", 1)[0].strip()
    norm_target = normalize_tr(target_floor_name)
    norm_floor = normalize_tr(floor_part)
    if norm_floor == norm_target:
        return True
    if norm_floor.endswith(" tavani"):
        return norm_floor[: -len(" tavani")].strip() == norm_target
    return False


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()



def validate_ide10_carrier(path: Path) -> None:
    signature = b"IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI\r\n"
    size = path.stat().st_size
    with path.open("rb") as f:
        head = f.read(100)
        if len(head) != 100 or not head.startswith(signature):
            raise ValueError("IDE dosya başlığı doğrulanamadı")
        version, flag, stored_size, stored_crc = struct.unpack_from("<IBII", head, 74)
        name_size = struct.unpack_from("<I", head, 96)[0]
        if version not in (201091, 201094) or flag != 0 or stored_size != size or not (1 <= name_size <= min(size - 100, 1024 * 1024)):
            raise ValueError("IDE10 sürümü veya dosya boyutu geçersiz")
        name = f.read(name_size)
        if not name.endswith(b"\x00") or b"\x00" in name[:-1]:
            raise ValueError("IDE proje adı bozuk")
        f.seek(88)
        crc = 0
        for block in iter(lambda: f.read(1024 * 1024), b""):
            crc = zlib.crc32(block, crc)
        if ((~crc) & 0xffffffff) != stored_crc:
            raise ValueError("IDE dosya CRC32 değeri geçersiz")


def atomic_json(path: Path, obj: dict) -> None:
    temp = path.with_suffix(".tmp")
    with temp.open("x", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(temp, path)



@contextmanager
def desktop_lock(root: Path):
    """An OS-held lock is released even if the process exits unexpectedly."""
    root.mkdir(parents=True, exist_ok=True)
    lock = (root / ".desktop.lock").open("a+b")
    try:
        if os.name == "nt":
            import msvcrt
            lock.seek(0)
            if lock.read(1) == b"":
                lock.write(b"0")
                lock.flush()
            lock.seek(0)
            try:
                msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError as exc:
                raise RuntimeError("Masaüstünde başka bir rapor işi çalışıyor") from exc
        else:
            import fcntl
            try:
                fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc:
                raise RuntimeError("Masaüstünde başka bir rapor işi çalışıyor") from exc
        try:
            yield
        finally:
            if os.name == "nt":
                lock.seek(0)
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)
    finally:
        lock.close()




class DesktopDriver:
    """Bounded calls into the existing guarded Windows desktop helper."""
    def __init__(self, script: Path, session: Path, evidence: Path):
        self.script, self.session, self.evidence = script, session, evidence

    def call(self, action: str, *args: str) -> dict:
        command = [sys.executable, "-X", "utf8", str(self.script), action,
                   "--session", str(self.session), "--out-dir", str(self.evidence), "--brief", *args]
        env = dict(os.environ, PYTHONUTF8="1")
        completed = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", env=env, timeout=35)
        if completed.returncode != 0:
            raise RuntimeError("ideCAD masaüstü işlemi başarısız: " + completed.stderr[-1000:])
        try:
            return json.loads(completed.stdout)
        except json.JSONDecodeError as exc:
            raise RuntimeError("ideCAD masaüstü gözlemi okunamadı") from exc


def assert_bound_project(state: dict, session: dict, pid: int, basename: str) -> None:
    if session.get("identity", {}).get("pid") != pid:
        raise ValueError("Yanlış ideCAD süreci")
    title = state.get("main_title", "")
    if basename.casefold() not in title.casefold():
        raise ValueError("Yanlış ideCAD proje penceresi")



def control(state: dict, control_id: int) -> dict:
    matches = [c for c in state.get("controls", []) if c.get("controlId") == control_id]
    if len(matches) != 1 or not matches[0].get("enabled") or not matches[0].get("visible"):
        raise RuntimeError(f"Beklenen ideCAD kontrolü bulunamadı: {control_id}")
    return matches[0]


def click_control(driver: DesktopDriver, state: dict, control_id: int, *, no_observe: bool = False) -> dict:
    fresh = driver.call("observe")
    if fresh.get("target", {}).get("hwnd") != state.get("target", {}).get("hwnd"):
        raise RuntimeError("Pencere değişti; işlem gönderilmedi")
    button = control(fresh, control_id)
    left, top, right, bottom = button["rect"]
    ox, oy, _, _ = fresh["target"]["rect"]
    extra = ("--no-observe",) if no_observe else ()
    return driver.call("click", "--observation", fresh["observation"],
                       "--x", str((left + right) // 2 - ox), "--y", str((top + bottom) // 2 - oy), *extra)



def matches_displayed_source(label: str, expected: Path) -> bool:
    if ":" not in label:
        return False
    displayed = label.split(":", 1)[1].strip().replace("/", "\\").casefold()
    expected_path = str(expected).replace("/", "\\").casefold()
    parts = displayed.split("...", 1)
    return displayed == expected_path if len(parts) == 1 else expected_path.startswith(parts[0]) and expected_path.endswith(parts[1])


def analyze(driver: DesktopDriver, expected_source: Path, staircase_smart: bool | None,
            deadline_seconds: float = 480, cancel_path: Path | None = None) -> str:
    """Run F9 and require ideCAD's terminal log, path and enabled completion button."""
    state = driver.call("key", "--chord", "f9")
    if state.get("target", {}).get("class") != "#32770" or not any(
        "Analiz yaptırmak istiyor musunuz?" in c.get("title", "") for c in state.get("controls", [])
    ):
        raise RuntimeError("Beklenen analiz onayı görünmedi")
    state = click_control(driver, state, 6)
    limit = time.monotonic() + deadline_seconds
    while time.monotonic() < limit:
        if cancel_path and cancel_path.exists():
            raise JobCancelled("İş kullanıcı tarafından iptal edildi")
        title = state.get("target", {}).get("title", "")
        controls = state.get("controls", [])
        if any("Merdivenlerin ana yapıya mesnetlemesi" in c.get("title", "") for c in controls):
            if staircase_smart is None:
                raise RuntimeError("Merdiven bağlantısı seçimi bekleniyor")
            state = click_control(driver, state, 6 if staircase_smart else 7)
            continue
        if title == "Analiz Durumu":
            progress = [c.get("title", "") for c in controls if c.get("controlId") == 2552]
            source = [c.get("title", "") for c in controls if c.get("controlId") == 4484]
            if len(source) != 1 or not matches_displayed_source(source[0], expected_source):
                raise RuntimeError("Analiz penceresinde kaynak dosya doğrulanamadı")
            if len(progress) == 1 and "Analiz tamamlandı." in progress[0]:
                control(state, 1)
                result = progress[0]
                click_control(driver, state, 1)
                return result
        elif state.get("target", {}).get("class") == "#32770":
            raise RuntimeError("Beklenmeyen ideCAD analiz penceresi: " + title)
        time.sleep(2)
        state = driver.call("inspect")
    raise TimeoutError("Analiz 8 dakikalık zaman sınırını aştı")



def select_active_floor(driver: DesktopDriver, target_floor_name: str) -> dict:
    """Ensure ideCADMainFrame's active floor matches target_floor_name using Kat listesi."""
    state = driver.call("observe")
    if state.get("target", {}).get("class") != "ideCADMainFrame":
        raise RuntimeError("Aktif kat seçimi için ana pencere bekleniyor")
    if floor_matches_title(state.get("main_title", ""), target_floor_name):
        return state

    main_hwnd = state["target"]["hwnd"]
    opened = driver.call("click", "--observation", state["observation"], "--x", "80", "--y", "92")
    popups = [
        w for w in opened.get("windows", [])
        if w.get("hwnd") != main_hwnd
        and w.get("title", "") == ""
        and w.get("class", "").startswith("Afx:")
        and (w["rect"][3] - w["rect"][1]) >= 24
    ]
    if not popups:
        raise RuntimeError("Kat listesi menüsü açılamadı")
    popup = min(popups, key=lambda w: (w["rect"][1], w["rect"][0]))
    left, top, right, bottom = popup["rect"]
    row_step = 21
    row_ys = list(range(top + 12, bottom - 7, row_step))
    if not row_ys:
        raise RuntimeError("Kat listesi satırları bulunamadı")

    for idx, screen_y in enumerate(row_ys):
        if idx > 0:
            state = driver.call("observe")
            if floor_matches_title(state.get("main_title", ""), target_floor_name):
                return state
            opened = driver.call("click", "--observation", state["observation"], "--x", "80", "--y", "92")
        ox, oy, _, _ = opened["target"]["rect"]
        screen_x = (left + right) // 2
        try:
            driver.call("click", "--observation", opened["observation"], "--x", str(screen_x - ox), "--y", str(screen_y - oy))
        except RuntimeError:
            # Title change immediately after floor click can trigger desktop.py's title guard.
            pass
        time.sleep(0.6)
        state = driver.call("observe")
        if floor_matches_title(state.get("main_title", ""), target_floor_name):
            return state
    raise RuntimeError(f"Hedef aktif kat ideCAD içinde bulunamadı: {target_floor_name}")


def apply_report_profile(driver: DesktopDriver, profile: Path, job_dir: Path, scope: str = "all") -> dict:
    """Load the ideCAD-saved profile, verify readback SHA-256, and enforce scope radio selection."""
    from PIL import Image, ImageChops
    state = driver.call("observe")
    if state.get("target", {}).get("class") != "ideCADMainFrame":
        raise RuntimeError("Rapor için ana pencere bekleniyor")
    screenshot = Image.open(state["image"]).convert("RGB")
    anchor = Image.open(Path(__file__).parent / "report-assets/selective-reports-2560x1400.png").convert("RGB")
    if screenshot.size != (2576, 1416) or ImageChops.difference(screenshot.crop((1263, 55, 1314, 130)), anchor).getbbox():
        raise RuntimeError("Doğrulanmış Seçmeli Raporlar düğmesi görünmüyor")
    state = driver.call("click", "--observation", state["observation"], "--x", "1285", "--y", "80")
    if state.get("target", {}).get("title") != "Statik Rapor Ayarları":
        raise RuntimeError("Statik rapor ayarları açılmadı")
    state = click_control(driver, state, 2685)
    if state.get("target", {}).get("title") != "Aç" or "edit" not in state.get("focus", {}).get("class", "").casefold():
        raise RuntimeError("Profil açma diyaloğu doğrulanamadı")
    state = driver.call("replace", "--text", str(profile))
    state = driver.call("key", "--chord", "enter")
    if state.get("target", {}).get("title") != "Statik Rapor Ayarları":
        raise RuntimeError("Rapor profili yüklenemedi")
    state = click_control(driver, state, 2461)
    if state.get("target", {}).get("title") != "Farklı Kaydet" or "edit" not in state.get("focus", {}).get("class", "").casefold():
        raise RuntimeError("Profil doğrulama kayıt diyaloğu açılmadı")
    readback = job_dir / "report-profile-readback.rpt"
    if readback.exists():
        raise RuntimeError("Profil doğrulama dosyası zaten var")
    state = driver.call("replace", "--text", str(readback))
    state = driver.call("key", "--chord", "enter")
    if state.get("target", {}).get("title") != "Statik Rapor Ayarları" or not readback.is_file() or digest(readback) != digest(profile):
        raise RuntimeError("Kaydedilmiş rapor profili doğrulanamadı")
    if scope == "active_floor":
        state = click_control(driver, state, 10200)
        if control(state, 10200).get("check") != 1:
            raise RuntimeError("Aktif kat kapsamı seçilemedi")
    else:
        if control(state, 10220).get("check") != 1:
            state = click_control(driver, state, 10220)
        if control(state, 10220).get("check") != 1:
            raise RuntimeError("Rapor kapsamı Tüm proje değil")
    return state



def _viewer_windows_by_pid() -> dict[int, tuple[int, str]]:
    """Collect visible unowned top-level Win32 windows on WinSta0\\Default per PID."""
    import ctypes
    import ctypes.wintypes as wt

    user32 = ctypes.windll.user32
    user32.OpenDesktopW.argtypes = [wt.LPCWSTR, wt.DWORD, wt.BOOL, wt.DWORD]
    user32.OpenDesktopW.restype = wt.HANDLE
    user32.CloseDesktop.argtypes = [wt.HANDLE]
    user32.CloseDesktop.restype = wt.BOOL
    user32.EnumDesktopWindows.argtypes = [wt.HANDLE, ctypes.c_void_p, wt.LPARAM]
    user32.EnumDesktopWindows.restype = wt.BOOL
    user32.IsWindowVisible.argtypes = [wt.HWND]
    user32.IsWindowVisible.restype = wt.BOOL
    user32.GetWindow.argtypes = [wt.HWND, wt.UINT]
    user32.GetWindow.restype = wt.HWND
    user32.GetWindowThreadProcessId.argtypes = [wt.HWND, ctypes.POINTER(wt.DWORD)]
    user32.GetWindowThreadProcessId.restype = wt.DWORD
    user32.GetWindowTextW.argtypes = [wt.HWND, wt.LPWSTR, ctypes.c_int]
    user32.GetWindowTextW.restype = ctypes.c_int

    cb_type = ctypes.WINFUNCTYPE(wt.BOOL, wt.HWND, wt.LPARAM)
    found: dict[int, list[tuple[int, str]]] = {}

    @cb_type
    def cb(hwnd: int, _unused: int) -> bool:
        if user32.IsWindowVisible(hwnd) and not user32.GetWindow(hwnd, 4):
            pid_val = wt.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid_val))
            buf = ctypes.create_unicode_buffer(1024)
            user32.GetWindowTextW(hwnd, buf, len(buf))
            if buf.value:
                found.setdefault(int(pid_val.value), []).append((int(hwnd), buf.value))
        return True

    hdesk = user32.OpenDesktopW("Default", 0, False, 0x0001)
    if hdesk:
        try:
            user32.EnumDesktopWindows(hdesk, cb, 0)
        finally:
            user32.CloseDesktop(hdesk)
    else:
        user32.EnumWindows(cb, 0)

    picked: dict[int, tuple[int, str]] = {}
    for pid_key, candidates in found.items():
        preferred = next((c for c in candidates if "iderpt.tmp" in c[1].casefold()), candidates[0])
        picked[pid_key] = preferred
    return picked


def list_viewers() -> list[dict]:
    if os.name != "nt":
        raise RuntimeError("ideCAD rapor işi yalnız Windows üzerinde çalışır")
    script = """$items = @(Get-CimInstance Win32_Process -Filter "Name='ideRPTTrial.exe'" | ForEach-Object {
        @{pid=[int]$_.ProcessId; parent=[int]$_.ParentProcessId;
          startedMs=([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds();
          command=[string]$_.CommandLine}
    }); ConvertTo-Json -InputObject $items -Compress"""
    env = dict(os.environ, PYTHONUTF8="1")
    result = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script],
                            capture_output=True, text=True, encoding="utf-8", env=env, timeout=15)
    if result.returncode:
        raise RuntimeError("ideRAPOR süreçleri doğrulanamadı")
    viewers = json.loads(result.stdout)
    if not isinstance(viewers, list):
        raise RuntimeError("ideRAPOR süreç listesi okunamadı")
    win_map = _viewer_windows_by_pid()
    for item in viewers:
        hwnd, title = win_map.get(int(item.get("pid", 0)), (0, ""))
        item["hwnd"] = hwnd
        item["title"] = title
    return viewers


def create_preview(driver: DesktopDriver, state: dict, parent_pid: int, source: Path,
                   source_hash: str, report: Path, timeout_seconds: float = 180,
                   cancel_path: Path | None = None) -> dict:
    previous_pids = {item["pid"] for item in list_viewers()}
    requested_ms = int(time.time() * 1000)
    click_control(driver, state, 4, no_observe=True)
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if cancel_path and cancel_path.exists():
            raise JobCancelled("İş kullanıcı tarafından iptal edildi")
        for viewer in list_viewers():
            if viewer["pid"] in previous_pids or viewer["parent"] != parent_pid or not viewer["hwnd"]:
                continue
            if "iderpt.tmp" not in viewer["title"].casefold() or str(report).casefold() not in viewer["command"].casefold():
                continue
            if not report.is_file():
                continue
            with report.open("rb") as f:
                header = f.read(32)
            verify_preview(parent_pid=parent_pid, viewer_pid=viewer["pid"], viewer_parent_pid=viewer["parent"],
                           viewer_created_ms=viewer["startedMs"], report_modified_ms=report.stat().st_mtime_ns // 1_000_000,
                           report_bytes=report.stat().st_size, report_header=header, request_started_ms=requested_ms,
                           source_hash_before=source_hash, source_hash_after=digest(source))
            return {"status": "ready", "viewerPid": viewer["pid"], "viewerStartedMs": viewer["startedMs"],
                    "reportModifiedMs": report.stat().st_mtime_ns // 1_000_000, "reportBytes": report.stat().st_size}
        time.sleep(1)
    raise TimeoutError("Rapor önizlemesi 3 dakikada doğrulanamadı")


def verify_preview(*, parent_pid: int, viewer_pid: int, viewer_parent_pid: int,
                   viewer_created_ms: int, report_modified_ms: int, report_bytes: int,
                   report_header: bytes, request_started_ms: int,
                   source_hash_before: str, source_hash_after: str) -> None:
    """Validate only preview provenance; this does not validate report contents."""
    if parent_pid <= 0 or viewer_pid <= 0 or viewer_pid == parent_pid or viewer_parent_pid != parent_pid:
        raise ValueError("Rapor görüntüleyicisi bu işin ideCAD sürecine ait değil")
    if viewer_created_ms < request_started_ms or report_modified_ms < request_started_ms:
        raise ValueError("Görüntüleyici veya rapor bu istekten eski")
    if report_bytes <= 0 or not report_header.startswith(b"IDERPT FILE 11.00"):
        raise ValueError("Yeni ideRAPOR içeriği doğrulanamadı")
    if source_hash_before != source_hash_after:
        raise ValueError("Kaynak dosya iş sırasında değişti")


def prepare(source: Path, expected_sha256: str, revision: str, options: dict, root: Path) -> dict:
    if not isinstance(revision, str) or not revision.strip() or len(revision) > 128:
        raise ValueError("modelRevision gerekli")
    if not isinstance(expected_sha256, str) or len(expected_sha256) != 64 or any(c not in "0123456789abcdef" for c in expected_sha256):
        raise ValueError("Geçerli SHA-256 gerekli")
    if not isinstance(options, dict) or options.get("scope") not in ("all", "active_floor") or options.get("analysis") not in ("fresh", "saved"):
        raise ValueError("Yalnız tüm proje veya aktif kat kapsamı ve fresh/saved analiz seçenekleri destekleniyor")
    if set(options) - ALLOWED_OPTION_KEYS:
        raise ValueError("Doğrulanmamış rapor seçeneği")
    if "staircaseSmart" in options and type(options["staircaseSmart"]) is not bool:
        raise ValueError("Doğrulanmamış rapor seçeneği")
    if options["scope"] == "active_floor":
        floor_name = options.get("activeFloorName")
        if (
            not isinstance(floor_name, str)
            or not floor_name.strip()
            or len(floor_name.strip()) > 64
            or any(ord(c) < 32 or ord(c) == 127 for c in floor_name)
        ):
            raise ValueError("Aktif kat kapsamı için geçerli activeFloorName gerekli")
    elif "activeFloorName" in options:
        raise ValueError("Tüm proje kapsamında activeFloorName kullanılamaz")
    if "ideKapak" in options and type(options["ideKapak"]) is not bool:
        raise ValueError("ideKapak boolean olmalıdır")
    if "sections" in options and options["sections"] is None:
        raise ValueError("En az bir rapor bölümü seçilmelidir")
    if "rptFlags" in options:
        _validate_rpt_flags(options["rptFlags"])
    profile_bytes = build_rpt_profile(
        RPT_DEFAULT_ASSET.read_bytes(),
        sections=options["sections"] if "sections" in options else None,
        ide_kapak=options.get("ideKapak", True),
        rpt_flags=options["rptFlags"] if "rptFlags" in options else None,
    )
    if not source.is_file() or source.suffix.lower() != ".ide10" or not (0 < source.stat().st_size <= MAX_BYTES):
        raise ValueError("Desteklenen kaynak IDE10 dosyası gerekli")
    validate_ide10_carrier(source)
    source_hash = digest(source)
    if source_hash != expected_sha256:
        raise ValueError("Kaynak SHA-256 eşleşmiyor")
    root.mkdir(parents=True, exist_ok=True)
    job_id = uuid.uuid4().hex
    job_dir = root / job_id
    job_dir.mkdir(mode=0o700)
    target = job_dir / "source.ide10"
    profile_path = job_dir / "report-profile.rpt"
    try:
        with source.open("rb") as inp, target.open("xb") as out:
            shutil.copyfileobj(inp, out, 1024 * 1024)
        if digest(target) != source_hash or digest(source) != source_hash:
            raise ValueError("Kopyalama sırasında kaynak değişti")
        with profile_path.open("xb") as pf:
            pf.write(profile_bytes)
        profile_hash = digest(profile_path)
        opts_json = json.dumps(options, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        receipt = {"jobId": job_id, "status": "prepared", "sourceSha256": source_hash,
                   "profileSha256": profile_hash,
                   "modelRevision": revision, "reportOptions": options,
                   "optionsSha256": hashlib.sha256(opts_json).hexdigest(),
                   "createdUnixMs": int(time.time() * 1000), "preview": "not_started",
                   "pdf": "blocked", "warnings": None, "warningsStatus": "unknown"}
        atomic_json(job_dir / "receipt.json", receipt)
        return receipt
    except BaseException:
        # This directory is a newly created UUID child owned by this operation.
        shutil.rmtree(job_dir)
        raise




def terminate_owned(pid: int, creation_ticks: int, *, millisecond_precision: bool = False) -> str:
    """Terminate only a process whose exact Windows creation time still matches."""
    import ctypes
    from ctypes import wintypes
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.GetProcessTimes.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.FILETIME),
                                       ctypes.POINTER(wintypes.FILETIME), ctypes.POINTER(wintypes.FILETIME),
                                       ctypes.POINTER(wintypes.FILETIME)]
    kernel.TerminateProcess.argtypes = [wintypes.HANDLE, wintypes.UINT]
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    handle = kernel.OpenProcess(0x1001, False, pid)
    if not handle:
        return "not_opened"
    try:
        creation, exit_time, kernel_time, user_time = (wintypes.FILETIME() for _ in range(4))
        if not kernel.GetProcessTimes(handle, ctypes.byref(creation), ctypes.byref(exit_time), ctypes.byref(kernel_time), ctypes.byref(user_time)):
            return "identity_unavailable"
        actual = (creation.dwHighDateTime << 32) | creation.dwLowDateTime
        matches = actual // 10000 == creation_ticks // 10000 if millisecond_precision else actual == creation_ticks
        if not matches:
            return "identity_changed"
        return "terminated" if kernel.TerminateProcess(handle, 1) else "termination_failed"
    finally:
        kernel.CloseHandle(handle)


def cleanup_job_process(driver: DesktopDriver, pid: int | None) -> str:
    if pid is None or not driver.session.is_file():
        return "no_verified_process"
    session = json.loads(driver.session.read_text(encoding="utf-8"))
    identity = session.get("identity", {})
    if identity.get("pid") != pid or not isinstance(identity.get("created"), int):
        return "identity_unavailable"
    viewer_results = []
    try:
        viewers = list_viewers()
    except (OSError, RuntimeError, ValueError, subprocess.TimeoutExpired):
        viewers = []
        viewer_results.append("unverified")
    for viewer in viewers:
        if viewer.get("parent") == pid and "iderpt.tmp" in viewer.get("command", "").casefold():
            ticks = int(viewer["startedMs"]) * 10000 + 116444736000000000
            viewer_results.append(terminate_owned(viewer["pid"], ticks, millisecond_precision=True))
    result = terminate_owned(pid, identity["created"])
    return "idecad_" + result + "; viewer_" + (",".join(viewer_results) or "none")


class JobCancelled(RuntimeError):
    pass


def check_cancel(directory: Path) -> None:
    if (directory / "cancel.flag").exists():
        raise JobCancelled("İş kullanıcı tarafından iptal edildi")



def verify_process_command(pid: int, source: Path, exe: Path) -> None:
    script = f"Get-CimInstance Win32_Process -Filter 'ProcessId={pid}' | Select-Object ProcessId,ExecutablePath,CommandLine | ConvertTo-Json -Compress"
    completed = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script],
                               capture_output=True, text=True, encoding="utf-8", timeout=15)
    if completed.returncode:
        raise RuntimeError("ideCAD süreç komut satırı doğrulanamadı")
    proc = json.loads(completed.stdout)
    if proc.get("ProcessId") != pid or os.path.normcase(proc.get("ExecutablePath", "")) != os.path.normcase(str(exe)):
        raise RuntimeError("Yanlış ideCAD çalıştırılabilir dosyası")
    if ('"' + str(source) + '"').casefold() not in proc.get("CommandLine", "").casefold():
        raise RuntimeError("ideCAD süreç komut satırında iş kaynağı bulunamadı")


def run_job(job_id: str, root: Path, original: Path, exe: Path) -> dict:
    if os.name != "nt" or len(job_id) != 32 or any(c not in "0123456789abcdef" for c in job_id):
        raise ValueError("Geçersiz iş veya desteklenmeyen işletim sistemi")
    directory = root / job_id
    receipt_path = directory / "receipt.json"
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    if receipt.get("jobId") != job_id or receipt.get("status") != "prepared":
        raise ValueError("İş hazır durumda değil")
    source = directory / "source.ide10"
    expected = receipt["sourceSha256"]
    custom_profile = directory / "report-profile.rpt"
    profile = custom_profile if custom_profile.is_file() else RPT_DEFAULT_ASSET
    evidence = directory / "gui"
    evidence.mkdir(exist_ok=True)
    driver = DesktopDriver(Path(__file__).parent / "desktop.py", directory / "session.json", evidence)
    lock_root = Path(os.environ["LOCALAPPDATA"]) / "Hsyncad" / "idecad-report"
    started = time.monotonic()
    pid = None
    try:
        if digest(source) != expected or digest(original) != expected:
            raise ValueError("Kaynak veya iş kopyası değişmiş")
        expected_profile = receipt.get("profileSha256")
        actual_profile = digest(profile)
        if expected_profile and actual_profile != expected_profile:
            raise ValueError("Rapor profili değişmiş")
        receipt["profileSha256"] = actual_profile
        with desktop_lock(lock_root):
            check_cancel(directory)
            if driver.call("list").get("windows") or list_viewers():
                raise RuntimeError("ideCAD masaüstü veya ideRAPOR şu anda kullanımda")
            receipt["status"] = "opening"
            atomic_json(receipt_path, receipt)
            launched = driver.call("launch", "--exe", str(exe), "--project", str(source), "--dismiss-trial")
            pid = launched.get("pid")
            if not isinstance(pid, int) or pid <= 0:
                raise RuntimeError("ideCAD süreci başlatılamadı")
            deadline = time.monotonic() + 60
            window = None
            while time.monotonic() < deadline:
                matches = [w for w in driver.call("list").get("windows", [])
                           if w.get("pid") == pid and w.get("class") == "ideCADMainFrame"
                           and source.name.casefold() in w.get("title", "").casefold()]
                if len(matches) == 1:
                    window = matches[0]
                    break
                time.sleep(1)
            if not window:
                raise TimeoutError("ideCAD iş kopyasını açmadı")
            import ctypes
            user32 = ctypes.windll.user32
            if not user32.IsZoomed(int(window["hwnd"])):
                user32.ShowWindow(int(window["hwnd"]), 3)
                time.sleep(0.3)
            state = driver.call("bind", "--hwnd", str(window["hwnd"]), "--expect-title", source.name)
            session = json.loads((directory / "session.json").read_text(encoding="utf-8"))
            assert_bound_project(state, session, pid, source.name)
            verify_process_command(pid, source, exe)
            check_cancel(directory)
            receipt["status"] = "checking_results"
            atomic_json(receipt_path, receipt)
            if receipt["reportOptions"]["analysis"] == "fresh":
                receipt["status"] = "analyzing"
                atomic_json(receipt_path, receipt)
                log = analyze(driver, source, receipt["reportOptions"].get("staircaseSmart"), cancel_path=directory / "cancel.flag")
                (directory / "analysis.log").write_text(log, encoding="utf-8")
                receipt["warningsStatus"] = "analysis_log_only"
                receipt["warnings"] = [line.strip() for line in log.splitlines()
                                       if "uyarı" in line.casefold() or "tavsiye" in line.casefold() or "kalite ölçütü" in line.casefold()]
            check_cancel(directory)
            receipt["status"] = "reporting"
            atomic_json(receipt_path, receipt)
            scope = receipt["reportOptions"].get("scope", "all")
            if scope == "active_floor":
                target_floor = receipt["reportOptions"].get("activeFloorName")
                if not isinstance(target_floor, str) or not target_floor.strip():
                    raise ValueError("Aktif kat adı eksik")
                select_active_floor(driver, target_floor.strip())
            state = apply_report_profile(driver, profile, directory, scope=scope)
            check_cancel(directory)
            receipt["status"] = "verifying"
            atomic_json(receipt_path, receipt)
            preview = create_preview(driver, state, pid, original, expected,
                                     Path(os.environ["PROGRAMDATA"]) / "ideCAD11Trial" / "iderpt.tmp", cancel_path=directory / "cancel.flag")
            check_cancel(directory)
            if digest(source) != expected:
                raise ValueError("İş kopyası dosyası değişti")
            receipt.update({"status": "ready", "preview": preview, "idecadPid": pid,
                            "elapsedMs": round((time.monotonic() - started) * 1000)})
            atomic_json(receipt_path, receipt)
            return receipt
    except Exception as exc:
        cleanup = "not_attempted"
        try:
            with desktop_lock(lock_root):
                cleanup = cleanup_job_process(driver, pid)
        except (OSError, RuntimeError, ValueError):
            cleanup = "identity_or_lock_unavailable"
        receipt.update({"status": "cancelled" if isinstance(exc, JobCancelled) else "failed", "preview": "not_verified", "error": str(exc),
                        "idecadPid": pid, "cleanup": cleanup, "elapsedMs": round((time.monotonic() - started) * 1000)})
        atomic_json(receipt_path, receipt)
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--sha256", required=True)
    parser.add_argument("--revision", required=True)
    parser.add_argument("--analysis", choices=("fresh", "saved"), default="fresh")
    parser.add_argument("--job-root", type=Path, required=True)
    parser.add_argument("--staircase-smart", choices=("yes", "no"))
    parser.add_argument("--scope", choices=("all", "active_floor"), default="all")
    parser.add_argument("--active-floor-name")
    parser.add_argument("--sections")
    parser.add_argument("--ide-kapak", choices=("yes", "no"))
    parser.add_argument("--rpt-flags")
    args = parser.parse_args()
    try:
        options: dict = {"scope": args.scope, "analysis": args.analysis}
        if args.staircase_smart is not None:
            options["staircaseSmart"] = args.staircase_smart == "yes"
        if args.active_floor_name is not None:
            options["activeFloorName"] = args.active_floor_name
        if args.sections is not None:
            options["sections"] = [s.strip() for s in args.sections.split(",")]
        if args.ide_kapak is not None:
            options["ideKapak"] = args.ide_kapak == "yes"
        if args.rpt_flags is not None:
            options["rptFlags"] = _parse_cli_rpt_flags(args.rpt_flags)
        result = prepare(args.source, args.sha256, args.revision, options, args.job_root)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except (OSError, ValueError) as exc:
        print(json.dumps({"status": "failed", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
