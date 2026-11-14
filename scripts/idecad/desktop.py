"""Local, explicitly authorized ideCAD desktop control; never switches desktops.

Uses visible GDI pixels (Pillow) and Win32 SendInput, independently of Sky/WGC.
Run --help. Every command is a bounded subprocess; no daemon or remote listener.
"""
from __future__ import annotations

import argparse
import ctypes as C
from ctypes import wintypes as W
import datetime as dt
import json
import os
from pathlib import Path
import sys
import threading
import time
import uuid

if sys.platform != "win32":
    raise SystemExit("Windows only")

U = C.WinDLL("user32", use_last_error=True)
K = C.WinDLL("kernel32", use_last_error=True)
P = C.c_size_t
S = C.c_ssize_t
CALLBACK = C.WINFUNCTYPE(W.BOOL, W.HWND, S)


def api(dll, name, result, *args):
    fn = getattr(dll, name)
    fn.restype, fn.argtypes = result, args
    return fn


api(U, "SetProcessDpiAwarenessContext", W.BOOL, W.HANDLE)(C.c_void_p(-4))
api(U, "EnumWindows", W.BOOL, CALLBACK, S)
api(U, "EnumChildWindows", W.BOOL, W.HWND, CALLBACK, S)
api(U, "IsWindow", W.BOOL, W.HWND)
api(U, "IsWindowVisible", W.BOOL, W.HWND)
api(U, "IsWindowEnabled", W.BOOL, W.HWND)
api(U, "IsIconic", W.BOOL, W.HWND)
api(U, "GetWindowTextW", C.c_int, W.HWND, W.LPWSTR, C.c_int)
api(U, "GetClassNameW", C.c_int, W.HWND, W.LPWSTR, C.c_int)
api(U, "GetWindowRect", W.BOOL, W.HWND, C.POINTER(W.RECT))
api(U, "GetWindowThreadProcessId", W.DWORD, W.HWND, C.POINTER(W.DWORD))
api(U, "GetForegroundWindow", W.HWND)
api(U, "GetLastActivePopup", W.HWND, W.HWND)
api(U, "GetAncestor", W.HWND, W.HWND, W.UINT)
api(U, "GetWindow", W.HWND, W.HWND, W.UINT)
api(U, "SetForegroundWindow", W.BOOL, W.HWND)
api(U, "BringWindowToTop", W.BOOL, W.HWND)
api(U, "AttachThreadInput", W.BOOL, W.DWORD, W.DWORD, W.BOOL)
api(U, "ShowWindow", W.BOOL, W.HWND, C.c_int)
api(U, "SetCursorPos", W.BOOL, C.c_int, C.c_int)
api(U, "WindowFromPoint", W.HWND, W.POINT)
api(U, "GetDlgCtrlID", C.c_int, W.HWND)
api(U, "GetWindowLongPtrW", S, W.HWND, C.c_int)
api(U, "SendMessageTimeoutW", S, W.HWND, W.UINT, P, S, W.UINT, W.UINT, C.POINTER(P))
api(K, "OpenProcess", W.HANDLE, W.DWORD, W.BOOL, W.DWORD)
api(K, "CloseHandle", W.BOOL, W.HANDLE)
api(K, "QueryFullProcessImageNameW", W.BOOL, W.HANDLE, W.DWORD, W.LPWSTR, C.POINTER(W.DWORD))
api(K, "GetProcessTimes", W.BOOL, W.HANDLE, *([C.POINTER(W.FILETIME)] * 4))
api(K, "GetCurrentThreadId", W.DWORD)
api(U, "GetThreadDesktop", W.HANDLE, W.DWORD)
api(U, "GetProcessWindowStation", W.HANDLE)
api(U, "GetUserObjectInformationW", W.BOOL, W.HANDLE, C.c_int, W.LPVOID, W.DWORD, C.POINTER(W.DWORD))
api(U, "OpenDesktopW", W.HANDLE, W.LPCWSTR, W.DWORD, W.BOOL, W.DWORD)
api(U, "SetThreadDesktop", W.BOOL, W.HANDLE)
api(U, "CloseDesktop", W.BOOL, W.HANDLE)
api(K, "CreateProcessW", W.BOOL, W.LPCWSTR, W.LPWSTR, C.c_void_p, C.c_void_p, W.BOOL, W.DWORD, C.c_void_p, W.LPCWSTR, C.c_void_p, C.c_void_p)


class STARTUPINFOW(C.Structure):
    _fields_ = [("cb", W.DWORD), ("lpReserved", W.LPWSTR), ("lpDesktop", W.LPWSTR),
                ("lpTitle", W.LPWSTR), ("dwX", W.DWORD), ("dwY", W.DWORD),
                ("dwXSize", W.DWORD), ("dwYSize", W.DWORD), ("dwXCountChars", W.DWORD),
                ("dwYCountChars", W.DWORD), ("dwFillAttribute", W.DWORD),
                ("dwFlags", W.DWORD), ("wShowWindow", W.WORD), ("cbReserved2", W.WORD),
                ("lpReserved2", C.c_void_p), ("hStdInput", W.HANDLE),
                ("hStdOutput", W.HANDLE), ("hStdError", W.HANDLE)]


class PROCESS_INFORMATION(C.Structure):
    _fields_ = [("hProcess", W.HANDLE), ("hThread", W.HANDLE),
                ("dwProcessId", W.DWORD), ("dwThreadId", W.DWORD)]



class MOUSEINPUT(C.Structure):
    _fields_ = [("dx", W.LONG), ("dy", W.LONG), ("mouseData", W.DWORD),
                ("dwFlags", W.DWORD), ("time", W.DWORD), ("dwExtraInfo", P)]


class KEYBDINPUT(C.Structure):
    _fields_ = [("wVk", W.WORD), ("wScan", W.WORD), ("dwFlags", W.DWORD),
                ("time", W.DWORD), ("dwExtraInfo", P)]


class HARDWAREINPUT(C.Structure):
    _fields_ = [("uMsg", W.DWORD), ("wParamL", W.WORD), ("wParamH", W.WORD)]


class INPUTUNION(C.Union):
    _fields_ = [("mi", MOUSEINPUT), ("ki", KEYBDINPUT), ("hi", HARDWAREINPUT)]


class INPUT(C.Structure):
    _anonymous_ = ("data",)
    _fields_ = [("type", W.DWORD), ("data", INPUTUNION)]


class GUIINFO(C.Structure):
    _fields_ = [("cbSize", W.DWORD), ("flags", W.DWORD),
                *[(n, W.HWND) for n in ("active", "focus", "capture", "menuOwner", "moveSize", "caret")],
                ("caretRect", W.RECT)]


api(U, "GetGUIThreadInfo", W.BOOL, W.DWORD, C.POINTER(GUIINFO))
api(U, "SendInput", W.UINT, W.UINT, C.POINTER(INPUT), C.c_int)


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write_json(path, data):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def desktop():
    def name(handle):
        buf, needed = C.create_unicode_buffer(256), W.DWORD()
        if not U.GetUserObjectInformationW(handle, 2, buf, C.sizeof(buf), C.byref(needed)):
            raise C.WinError(C.get_last_error())
        return buf.value
    station = name(U.GetProcessWindowStation())
    desk = name(U.GetThreadDesktop(K.GetCurrentThreadId()))
    if station != "WinSta0":
        raise RuntimeError(f"Interactive WinSta0 window station required: station={station}")
    if desk != "Default":
        hdesk = U.OpenDesktopW("Default", 0, False, 0x01FF)
        if not hdesk:
            raise RuntimeError(f"Cannot open Default desktop: error {C.get_last_error()}")
        if not U.SetThreadDesktop(hdesk):
            err = C.get_last_error()
            U.CloseDesktop(hdesk)
            raise RuntimeError(f"Cannot set thread desktop to Default: error {err}")
        desk = name(U.GetThreadDesktop(K.GetCurrentThreadId()))
    result = {"station": station, "desktop": desk}
    if result != {"station": "WinSta0", "desktop": "Default"}:
        raise RuntimeError(f"Interactive Default desktop required; failed to resolve: {result}")
    return result


def process(hwnd):
    pid = W.DWORD()
    U.GetWindowThreadProcessId(hwnd, C.byref(pid))
    handle = K.OpenProcess(0x1000, False, pid.value)
    if not handle:
        raise C.WinError(C.get_last_error())
    try:
        buf, size = C.create_unicode_buffer(32768), W.DWORD(32768)
        if not K.QueryFullProcessImageNameW(handle, 0, buf, C.byref(size)):
            raise C.WinError(C.get_last_error())
        times = [W.FILETIME() for _ in range(4)]
        if not K.GetProcessTimes(handle, *[C.byref(t) for t in times]):
            raise C.WinError(C.get_last_error())
        return {"pid": pid.value, "exe": buf.value,
                "created": (times[0].dwHighDateTime << 32) | times[0].dwLowDateTime}
    finally:
        K.CloseHandle(handle)


def same_pid(hwnd, pid):
    value = W.DWORD()
    U.GetWindowThreadProcessId(hwnd, C.byref(value))
    return value.value == pid


def is_idecad(info):
    return Path(info["exe"]).name.lower() in {"idecad_statik_11_deneme.exe", "idecad_statik_11.exe",
                                              "idecad_structural_11.exe"}


def text(hwnd, child=False):
    if child:
        length = P()
        U.SendMessageTimeoutW(hwnd, 0x000E, 0, 0, 2, 200, C.byref(length))
        buf = C.create_unicode_buffer(min(max(4096, length.value+1), 500001))
        result = P()
        U.SendMessageTimeoutW(hwnd, 0x000D, len(buf), C.addressof(buf), 2, 200, C.byref(result))
    else:
        buf = C.create_unicode_buffer(4096)
        U.GetWindowTextW(hwnd, buf, len(buf))
    return buf.value


def rect(hwnd):
    value = W.RECT()
    if not U.GetWindowRect(hwnd, C.byref(value)):
        raise C.WinError(C.get_last_error())
    return [value.left, value.top, value.right, value.bottom]


def info(hwnd, child=False):
    buf = C.create_unicode_buffer(256)
    U.GetClassNameW(hwnd, buf, len(buf))
    result = {"hwnd": int(hwnd), "title": text(hwnd, child), "class": buf.value,
              "rect": rect(hwnd), "enabled": bool(U.IsWindowEnabled(hwnd)),
              "visible": bool(U.IsWindowVisible(hwnd)), "controlId": U.GetDlgCtrlID(hwnd)}
    if buf.value == "Button" and (U.GetWindowLongPtrW(hwnd, -16) & 15) in {2, 3, 4, 5, 6, 9}:
        check = P()
        if U.SendMessageTimeoutW(hwnd, 0x00F0, 0, 0, 2, 200, C.byref(check)):
            result["check"] = check.value
    return result


def windows(pid=None):
    rows = []
    @CALLBACK
    def cb(hwnd, unused):
        if U.IsWindowVisible(hwnd):
            try:
                p = process(hwnd)
                if (pid is None and is_idecad(p)) or pid == p["pid"]:
                    rows.append({**info(hwnd), **p, "owner": int(U.GetWindow(hwnd, 4) or 0)})
            except OSError:
                pass
        return True
    U.EnumWindows(cb, 0)
    return rows


def children(hwnd):
    rows = []
    @CALLBACK
    def cb(child, unused):
        if U.IsWindowVisible(child):
            try:
                rows.append(info(child, True))
            except OSError:
                pass
        return len(rows) < 1000
    U.EnumChildWindows(hwnd, cb, 0)
    return rows


def validate(cfg):
    desktop()
    hwnd = cfg["main"]
    if not U.IsWindow(hwnd) or process(hwnd) != cfg["identity"]:
        raise RuntimeError("Bound window/process changed; list and bind again")
    if not is_idecad(cfg["identity"]):
        raise RuntimeError("Only an ideCAD process may be bound")
    expected = cfg.get("expect_title", "")
    if expected and expected.casefold() not in text(hwnd).casefold():
        raise RuntimeError(f"Expected project/title {expected!r}, found {text(hwnd)!r}")
    return hwnd


def belongs_to_main(hwnd, main):
    # GA_ROOTOWNER stops at some hidden owners during ideCAD's analysis UI.
    # Follow the actual GW_OWNER chain as well; never accept another process.
    root = U.GetAncestor(hwnd, 2)
    for _ in range(16):
        if root == main:
            return True
        if not root:
            break
        root = U.GetWindow(root, 4)
    return False


def active(cfg):
    main = validate(cfg)
    pid = cfg["identity"]["pid"]
    current = U.GetForegroundWindow()
    if current and same_pid(current, pid) and belongs_to_main(current, main) and U.IsWindowEnabled(current):
        return int(current)
    if not U.IsWindowEnabled(main):
        candidates = [w for w in windows(pid) if w["enabled"] and belongs_to_main(w["hwnd"], main)]
        if not candidates:
            raise RuntimeError("Main is blocked, but its modal is not ready; observe again")
        return candidates[0]["hwnd"]
    popup = U.GetLastActivePopup(main)
    return int(popup) if popup and U.IsWindowVisible(popup) and same_pid(popup, pid) else main


def foreground(cfg):
    hwnd = active(cfg)
    if U.IsIconic(cfg["main"]):
        U.ShowWindow(cfg["main"], 9)
    fg = U.GetForegroundWindow()
    if fg != hwnd:
        my_t = K.GetCurrentThreadId()
        fg_t = U.GetWindowThreadProcessId(fg, None) if fg else 0
        tgt_t = U.GetWindowThreadProcessId(hwnd, None)
        if fg_t:
            U.AttachThreadInput(my_t, fg_t, True)
        if tgt_t:
            U.AttachThreadInput(my_t, tgt_t, True)
        if U.IsIconic(hwnd):
            U.ShowWindow(hwnd, 9)
        U.SetForegroundWindow(hwnd)
        U.BringWindowToTop(hwnd)
        if tgt_t:
            U.AttachThreadInput(my_t, tgt_t, False)
        if fg_t:
            U.AttachThreadInput(my_t, fg_t, False)
    for _ in range(25):
        if U.GetForegroundWindow() == hwnd:
            return hwnd
        time.sleep(.04)
    raise RuntimeError("Foreground activation refused; input not sent")


def focus(cfg):
    g = GUIINFO(cbSize=C.sizeof(GUIINFO))
    thread = U.GetWindowThreadProcessId(active(cfg), None)
    if not U.GetGUIThreadInfo(thread, C.byref(g)):
        return None
    if not g.focus:
        return None
    try:
        return info(g.focus, True)
    except OSError:
        return None


def observe(cfg, capture=True):
    for attempt in range(4):
        try:
            hwnd = foreground(cfg) if capture else active(cfg)
            stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
            out = Path(cfg["out_dir"]) / stamp
            state = {"time": time.time(), "id": str(uuid.uuid4()), "main": cfg["main"],
                     "identity": cfg["identity"], "main_title": text(cfg["main"]),
                     "target": info(hwnd), "focus": focus(cfg), "windows": windows(cfg["identity"]["pid"]),
                     "controls": children(hwnd)}
            if capture:
                from PIL import ImageGrab
                bounds = rect(hwnd)
                if bounds[2] <= bounds[0] or bounds[3] <= bounds[1]:
                    raise RuntimeError("Target has no visible area")
                image = ImageGrab.grab(bbox=tuple(bounds), include_layered_windows=True, all_screens=True)
                if image.size != (bounds[2]-bounds[0], bounds[3]-bounds[1]):
                    raise RuntimeError("Screenshot geometry mismatch")
                out.parent.mkdir(parents=True, exist_ok=True)
                image.save(out.with_suffix(".png"))
                if U.GetForegroundWindow() != hwnd or rect(hwnd) != bounds:
                    raise RuntimeError("Window/focus changed during capture; discard screenshot")
                state["image"] = str(out.with_suffix(".png"))
                state["image_rect"] = bounds
            state["observation"] = str(out.with_suffix(".json"))
            write_json(state["observation"], state)
            write_json(Path(cfg["out_dir"]) / "latest.json", state)
            return state
        except OSError as exc:
            if getattr(exc, "winerror", None) == 1400 and attempt < 3:
                time.sleep(0.25)
                continue
            raise


def summary(state, contains=""):
    result = {k: v for k, v in state.items() if k != "controls"}
    controls = state["controls"]
    result["controls"] = [c for c in controls if contains.casefold() in c["title"].casefold()] if contains else controls[:90]
    result["control_count"] = len(controls)
    return result


def point(cfg, observation, x, y):
    old = read_json(observation)
    hwnd = foreground(cfg)
    if old["main"] != cfg["main"] or old["identity"] != cfg["identity"]:
        raise RuntimeError("Observation belongs to another session")
    if read_json(Path(cfg["out_dir"])/"latest.json")["id"] != old["id"]:
        raise RuntimeError("Observation superseded; use the latest screenshot")
    if not 0 <= time.time()-old["time"] <= 120 or "image_rect" not in old:
        raise RuntimeError("Fresh screenshot observation required (120 second maximum)")
    if old["target"]["hwnd"] != hwnd or old["target"]["title"] != text(hwnd) or old["image_rect"] != rect(hwnd):
        raise RuntimeError("Window/modal/title/geometry changed; observe again")
    l, t, r, b = old["image_rect"]
    if not (0 <= x < r-l and 0 <= y < b-t):
        raise RuntimeError("Point outside screenshot")
    hit = U.WindowFromPoint(W.POINT(l+x, t+y))
    if not hit or not same_pid(hit, cfg["identity"]["pid"]):
        raise RuntimeError("Point is occluded by a non-target window; input not sent")
    return l+x, t+y


def send(items):
    array = (INPUT * len(items))(*items)
    count = U.SendInput(len(array), array, C.sizeof(INPUT))
    if count != len(array):
        raise RuntimeError(f"SendInput sent {count}/{len(array)}; error {C.get_last_error()}")


def keyboard(vk=0, scan=0, flags=0):
    if vk in {0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x2E}:
        flags |= 1
    return INPUT(type=1, ki=KEYBDINPUT(vk, scan, flags, 0, 0))


KEYS = {"ctrl": 0x11, "control": 0x11, "alt": 0x12, "shift": 0x10,
        "enter": 0x0D, "return": 0x0D, "esc": 0x1B, "escape": 0x1B,
        "tab": 9, "space": 0x20, "backspace": 8, "delete": 0x2E,
        "left": 0x25, "up": 0x26, "right": 0x27, "down": 0x28,
        "home": 0x24, "end": 0x23, "pageup": 0x21, "pagedown": 0x22,
        **{f"f{i}": 0x6F+i for i in range(1, 25)}}


def key(chord):
    codes = []
    for part in chord.lower().split("+"):
        if part in KEYS:
            codes.append(KEYS[part])
        elif len(part) == 1 and part.isascii() and part.isalnum():
            codes.append(ord(part.upper()))
        else:
            raise ValueError(f"Unsupported key {part!r}; Windows/security shortcuts are excluded")
    try:
        send([keyboard(c) for c in codes])
    finally:
        send([keyboard(c, flags=2) for c in reversed(codes)])


def type_text(value):
    units = value.encode("utf-16-le")
    for n in range(0, len(units), 2):
        unit = int.from_bytes(units[n:n+2], "little")
        send([keyboard(scan=unit, flags=4), keyboard(scan=unit, flags=6)])


def mouse(flags, data=0):
    send([INPUT(type=0, mi=MOUSEINPUT(0, 0, data & 0xFFFFFFFF, flags, 0, 0))])


def click(x, y, button="left", count=1):
    if not U.SetCursorPos(x, y):
        raise C.WinError(C.get_last_error())
    down, up = {"left": (2, 4), "right": (8, 16), "middle": (32, 64)}[button]
    for _ in range(count):
        mouse(down)
        mouse(up)
        time.sleep(.07)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["list", "bind", "observe", "inspect", "click", "key", "type", "replace", "drag", "scroll", "launch"])
    parser.add_argument("--exe", default=r"C:\Program Files\ideCAD\ideCAD Statik 11 Deneme\ideCAD_Statik_11_Deneme.exe")
    parser.add_argument("--project", default="")
    parser.add_argument("--dismiss-trial", action="store_true", help="Automatically dismiss initial trial warning dialog after launch")
    parser.add_argument("--session", default=str(Path.home()/".codex-idecad-session.json"))
    parser.add_argument("--hwnd", type=int)
    parser.add_argument("--expect-title", default="")
    parser.add_argument("--out-dir", default=r"D:\HsyncadHybridOS\gui-erisim\desktop-control")
    parser.add_argument("--observation")
    parser.add_argument("--x", type=int)
    parser.add_argument("--y", type=int)
    parser.add_argument("--to-x", type=int)
    parser.add_argument("--to-y", type=int)
    parser.add_argument("--button", choices=["left", "right", "middle"], default="left")
    parser.add_argument("--count", type=int, choices=[1, 2], default=1)
    parser.add_argument("--chord")
    parser.add_argument("--text")
    parser.add_argument("--delta", type=int, default=0)
    parser.add_argument("--horizontal", action="store_true")
    parser.add_argument("--contains", default="")
    parser.add_argument("--brief", action="store_true")
    parser.add_argument("--no-observe", action="store_true")
    args = parser.parse_args()
    where = desktop()
    if args.action == "list":
        print(json.dumps({"desktop": where, "windows": windows()}, ensure_ascii=False, indent=2))
        return
    if args.action == "launch":
        si = STARTUPINFOW()
        si.cb = C.sizeof(STARTUPINFOW)
        si.lpDesktop = r"WinSta0\Default"
        pi = PROCESS_INFORMATION()
        cmd = f'"{args.exe}"'
        if args.project:
            cmd += f' "{args.project}"'
        res = K.CreateProcessW(None, cmd, None, None, False, 0, None, None, C.byref(si), C.byref(pi))
        if not res:
            raise RuntimeError(f"CreateProcessW failed with error {C.get_last_error()}")
        K.CloseHandle(pi.hThread)
        K.CloseHandle(pi.hProcess)
        pid = pi.dwProcessId
        main_hwnd = None
        dismissed = False
        if args.dismiss_trial:
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                time.sleep(0.4)
                for w in windows(pid=pid):
                    if w["class"] == "ideCADMainFrame":
                        main_hwnd = w["hwnd"]
                        break
                if main_hwnd:
                    break
            if main_hwnd:
                popup_deadline = time.monotonic() + 10
                while time.monotonic() < popup_deadline:
                    popup = U.GetLastActivePopup(main_hwnd)
                    if popup and popup != main_hwnd and U.IsWindowVisible(popup):
                        cfg = {"main": main_hwnd, "identity": process(main_hwnd),
                               "expect_title": text(main_hwnd), "out_dir": args.out_dir}
                        write_json(args.session, cfg)
                        foreground(cfg)
                        key("enter")
                        dismissed = True
                        break
                    time.sleep(0.3)
        else:
            time.sleep(2)
        print(json.dumps({"launched": True, "pid": pid, "cmd": cmd, "main_hwnd": main_hwnd, "dismissed_trial": dismissed, "desktop": where}, ensure_ascii=False, indent=2))
        return
    if args.action == "bind":
        if not args.hwnd or not U.IsWindow(args.hwnd):
            raise ValueError("Choose exactly one HWND from list")
        if not args.expect_title:
            raise ValueError("--expect-title required; bind to the observed project/title")
        cfg = {"main": args.hwnd, "identity": process(args.hwnd),
               "expect_title": args.expect_title, "out_dir": args.out_dir}
        validate(cfg)
        write_json(args.session, cfg)
    else:
        cfg = read_json(args.session)
    validate(cfg)
    if args.action in {"click", "drag", "scroll"}:
        if args.x is None or args.y is None or not args.observation:
            raise ValueError("Coordinates and --observation required")
        x, y = point(cfg, args.observation, args.x, args.y)
        if args.action == "click":
            click(x, y, args.button, args.count)
        elif args.action == "scroll":
            U.SetCursorPos(x, y)
            mouse(0x1000 if args.horizontal else 0x0800, args.delta)
        else:
            tx, ty = point(cfg, args.observation, args.to_x, args.to_y)
            U.SetCursorPos(x, y)
            down, up = {"left": (2, 4), "right": (8, 16), "middle": (32, 64)}[args.button]
            mouse(down)
            try:
                for n in range(1, 21):
                    U.SetCursorPos(round(x+(tx-x)*n/20), round(y+(ty-y)*n/20))
                    time.sleep(.015)
            finally:
                mouse(up)
    elif args.action == "key":
        foreground(cfg)
        key(args.chord or "")
    elif args.action in {"type", "replace"}:
        foreground(cfg)
        focused = focus(cfg)
        if not focused or "edit" not in focused["class"].casefold() or not focused["enabled"]:
            raise RuntimeError(f"Text entry requires a focused enabled Edit: {focused}")
        if args.action == "replace":
            result = P()
            if not U.SendMessageTimeoutW(focused["hwnd"], 0x00B1, 0, -1, 2, 1000, C.byref(result)):
                raise RuntimeError("EM_SETSEL failed; text not sent")
        type_text(args.text or "")
        if args.action == "replace":
            deadline = time.monotonic() + 2
            while text(focused["hwnd"], True) != (args.text or ""):
                if time.monotonic() >= deadline:
                    raise RuntimeError("Replacement readback differs; inspect before continuing")
                time.sleep(.05)
    if args.action not in {"observe", "inspect", "bind"}:
        time.sleep(.25)
        if args.no_observe:
            print(json.dumps({"ok": True, "action": args.action}, ensure_ascii=False))
            return
        if args.action == "key" and args.chord.lower() == "alt+f4":
            for _ in range(30):
                if not U.IsWindow(cfg["main"]):
                    result = {"closed": True, "identity": cfg["identity"], "time": time.time()}
                    write_json(Path(cfg["out_dir"])/"closed.json", result)
                    print(json.dumps(result, ensure_ascii=False))
                    return
                if not U.IsWindowEnabled(cfg["main"]):
                    break
                time.sleep(.1)
    state = observe(cfg, capture=args.action != "inspect")
    result = summary(state, args.contains)
    if args.brief:
        result = {k: v for k, v in result.items() if k in {"main_title", "target", "focus", "image", "observation", "controls"}}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.action not in {"observe", "inspect", "bind"}:
        with (Path(cfg["out_dir"])/"actions.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps({"action": vars(args), "result": state["observation"]}, ensure_ascii=False)+"\n")


if __name__ == "__main__":
    # Hard limit also bounds hung UI calls; there is no background service to clean up.
    watchdog = threading.Timer(30, lambda: os._exit(124))
    watchdog.daemon = True
    watchdog.start()
    try:
        main()
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
    finally:
        watchdog.cancel()
