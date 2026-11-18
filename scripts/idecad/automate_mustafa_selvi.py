import sys
import os
from pathlib import Path
import time
import json
import ctypes as C

sys.path.append(str(Path(__file__).parent))
import desktop as d

SESSION_PATH = 'C:/Users/hsyn/Desktop/ide_cikti/mustafa_selvi_statik/session.json'

def get_hproc(cfg):
    pid = cfg['identity']['pid']
    return d.K.OpenProcess(0x1F0FFF, False, pid)

def get_subitem_rect(hProc, lv_hwnd, r, c):
    rect_remote = d.K.VirtualAllocEx(hProc, None, 16, 0x1000 | 0x2000, 0x04)
    rect_in = (C.c_int * 4)(0, c, 0, 0)
    d.K.WriteProcessMemory(hProc, rect_remote, rect_in, 16, None)
    d.U.SendMessageW(lv_hwnd, 0x1038, r, rect_remote)
    rect_out = (C.c_int * 4)()
    d.K.ReadProcessMemory(hProc, rect_remote, rect_out, 16, None)
    d.K.VirtualFreeEx(hProc, rect_remote, 0, 0x8000)
    return rect_out[0], rect_out[1], rect_out[2], rect_out[3]

def read_cell(hProc, lv_hwnd, r, c):
    buf_remote = d.K.VirtualAllocEx(hProc, None, 1024, 0x1000 | 0x2000, 0x04)
    text_remote = buf_remote + 256
    LVITEM_SIZE = 88
    lvitem = (C.c_char * LVITEM_SIZE)()
    C.cast(lvitem, C.POINTER(C.c_uint))[0] = 1
    C.cast(C.byref(lvitem, 4), C.POINTER(C.c_int))[0] = r
    C.cast(C.byref(lvitem, 8), C.POINTER(C.c_int))[0] = c
    C.cast(C.byref(lvitem, 24), C.POINTER(C.c_void_p))[0] = text_remote
    C.cast(C.byref(lvitem, 32), C.POINTER(C.c_int))[0] = 100
    d.K.WriteProcessMemory(hProc, buf_remote, lvitem, LVITEM_SIZE, None)
    d.U.SendMessageW(lv_hwnd, 0x1073, r, buf_remote)
    res_buf = (C.c_wchar * 100)()
    d.K.ReadProcessMemory(hProc, text_remote, res_buf, 200, None)
    d.K.VirtualFreeEx(hProc, buf_remote, 0, 0x8000)
    return res_buf.value

def set_cell_text(cfg, hProc, lv, r, c, new_text):
    l, t, r_b, b = get_subitem_rect(hProc, lv['hwnd'], r, c)
    cx = (l + r_b) // 2
    cy = (t + b) // 2
    sx = lv['rect'][0] + cx
    sy = lv['rect'][1] + cy
    d.click(sx, sy, count=2)
    time.sleep(0.3)
    re = [ch for ch in d.children(lv['hwnd']) if ch['class'] == 'RichEdit20A']
    if not re:
        raise RuntimeError(f"RichEdit20A did not spawn for cell ({r}, {c})")
    hwnd = re[0]['hwnd']
    d.U.SendMessageW(hwnd, 0x00B1, 0, -1)
    time.sleep(0.05)
    d.type_text(new_text)
    time.sleep(0.1)
    d.key('enter')
    time.sleep(0.3)

def click_cell(cfg, hProc, lv, r, c):
    l, t, r_b, b = get_subitem_rect(hProc, lv['hwnd'], r, c)
    cx = (l + r_b) // 2
    cy = (t + b) // 2
    sx = lv['rect'][0] + cx
    sy = lv['rect'][1] + cy
    d.click(sx, sy)
    time.sleep(0.25)

def fix_flags():
    d.desktop()
    cfg = d.read_json(SESSION_PATH)
    dlg = [w for w in d.windows(pid=cfg['identity']['pid']) if 'Kat Genel' in w['title']][0]
    lv = [c for c in d.children(dlg['hwnd']) if c['controlId'] == 25103][0]
    hProc = get_hproc(cfg)
    try:
        for r in [0, 1, 2, 3, 4]:
            val = read_cell(hProc, lv['hwnd'], r, 6)
            if val != '0':
                print(f"Toggling Row {r} Col 6 (Rijit) from {val} to 0...")
                click_cell(cfg, hProc, lv, r, 6)
                print(f"  Row {r} Col 6 is now {read_cell(hProc, lv['hwnd'], r, 6)}")
                
        val0_7 = read_cell(hProc, lv['hwnd'], 0, 7)
        if val0_7 != '1':
            print(f"Toggling Row 0 Col 7 (Asansor) from {val0_7} to 1...")
            click_cell(cfg, hProc, lv, 0, 7)
            print(f"  Row 0 Col 7 is now {read_cell(hProc, lv['hwnd'], 0, 7)}")

        print("\n--- Current Verified Kat Tablosu ---")
        item_count = d.U.SendMessageW(lv['hwnd'], 0x1004, 0, 0)
        for r in range(item_count):
            vals = [read_cell(hProc, lv['hwnd'], r, c) for c in range(9)]
            print(f"Row {r}: {vals}")
    finally:
        d.K.CloseHandle(hProc)

if __name__ == '__main__':
    fix_flags()
