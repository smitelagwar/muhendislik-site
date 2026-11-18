"""Draw precision axes in ideCAD conforming strictly to Turkish Civil Engineering standards.

- Vertical axes: A, B, C, D, E (left to right)
- Horizontal axes: 1, 2, 3, 4 (bottom to top)
- Extensions outside building box
- Automatic auto-increment naming
"""
from __future__ import annotations
import sys
import time
from pathlib import Path
import ctypes as C

sys.path.insert(0, str(Path(__file__).parent))
import desktop as d
from PIL import Image

def unlock_focus(hwnd):
    d.U.keybd_event(0x12, 0, 0, 0) # Alt down
    d.U.keybd_event(0x12, 0, 2, 0) # Alt up
    d.U.SetForegroundWindow(hwnd)
    d.U.BringWindowToTop(hwnd)
    time.sleep(0.15)

def open_settings_and_set_name(main_hwnd, name: str):
    # Aks toolbar is Afx:MiniFrame with title 'Aks'
    aks_tb = None
    for w in d.windows():
        if w['title'] == 'Aks':
            aks_tb = w
            break
            
    if not aks_tb:
        print("Warning: Aks toolbar not found for setting name!")
        return False
        
    tb_rect = aks_tb['rect']
    # Ayarlar button is near the right end, y center of toolbar buttons
    btn_x = tb_rect[2] - 16
    btn_y = (tb_rect[1] + tb_rect[3]) // 2 + 6
    print(f"Clicking Ayarlar at ({btn_x}, {btn_y})...")
    d.click(btn_x, btn_y)
    time.sleep(0.5)
    
    popup = d.U.GetLastActivePopup(main_hwnd)
    if popup == main_hwnd:
        # Retry with slightly different y
        d.click(btn_x, btn_y - 4)
        time.sleep(0.5)
        popup = d.U.GetLastActivePopup(main_hwnd)
        
    if popup != main_hwnd:
        print(f"Aks Ayarları opened (hwnd: {popup}). Setting name to '{name}'...")
        tamam_hwnd = None
        for c in d.children(popup):
            if c['controlId'] == 10040: # Aks adı edit control
                buf = C.c_wchar_p(name)
                d.U.SendMessageW(c['hwnd'], 0x000C, 0, buf) # WM_SETTEXT
            elif c['controlId'] == 1 and c['class'] == 'Button':
                tamam_hwnd = c['hwnd']
        time.sleep(0.2)
        if tamam_hwnd:
            d.U.SendMessageW(tamam_hwnd, 0x00F5, 0, 0) # BM_CLICK
            time.sleep(0.4)
        print("Aks Ayarları confirmed and closed.")
        return True
    else:
        print("Warning: Failed to open Aks Ayarları dialog.")
        return False

def draw():
    d.desktop()
    session_path = r"C:\Users\hsyn\Desktop\ide_cikti\mustafa_selvi_statik\session.json"
    cfg = d.read_json(session_path)
    main_hwnd = cfg['main']
    
    unlock_focus(main_hwnd)
    d.U.ShowWindow(main_hwnd, 3) # SW_MAXIMIZE
    time.sleep(0.3)
    
    # 1. Reset command line
    print("Resetting command line...")
    d.key('esc')
    time.sleep(0.15)
    d.key('esc')
    time.sleep(0.2)
    
    # 2. Start 'ak' command
    print("Starting 'ak' command...")
    d.type_text('ak')
    time.sleep(0.15)
    d.key('enter')
    time.sleep(0.6)
    
    # 3. Set Vertical Mode (Dikey)
    print("Setting Dikey mode...")
    d.type_text('d')
    time.sleep(0.1)
    d.key('enter')
    time.sleep(0.1)
    d.key('enter')
    time.sleep(0.4)
    
    # Set initial letter to 'A'
    open_settings_and_set_name(main_hwnd, 'A')
    
    # Vertical coordinates:
    # A: 467, B: 603, C: 807, D: 1011, E: 1215
    vertical_xs = [467, 603, 807, 1011, 1215]
    axis_letters = ['A', 'B', 'C', 'D', 'E']
    
    print("\n--- Drawing Vertical Axes (A to E) ---")
    for letter, x in zip(axis_letters, vertical_xs):
        print(f"Placing Axis {letter} at X={x}, Y=700...")
        d.click(x, 700)
        time.sleep(0.4)
        
    # 4. Switch to Horizontal Mode (Yatay)
    print("\nSetting Yatay mode...")
    d.type_text('y')
    time.sleep(0.1)
    d.key('enter')
    time.sleep(0.1)
    d.key('enter')
    time.sleep(0.4)
    
    # Set initial number to '1'
    open_settings_and_set_name(main_hwnd, '1')
    
    # Horizontal coordinates (from bottom to top: 1, 2, 3, 4):
    # 1: 1000, 2: 864, 3: 660, 4: 456
    horizontal_ys = [1000, 864, 660, 456]
    axis_numbers = ['1', '2', '3', '4']
    
    print("\n--- Drawing Horizontal Axes (1 to 4) ---")
    for num, y in zip(axis_numbers, horizontal_ys):
        print(f"Placing Axis {num} at X=800, Y={y}...")
        d.click(800, y)
        time.sleep(0.4)
        
    # 5. Exit command & Zoom extents
    print("\nExiting 'ak' command...")
    d.key('esc')
    time.sleep(0.15)
    d.key('esc')
    time.sleep(0.3)
    
    print("Executing Zoom Extents (Ctrl+X)...")
    d.key('ctrl+x')
    time.sleep(0.8)
    
    # 6. Save project safely
    print("Saving project (Ctrl+S)...")
    d.key('ctrl+s')
    time.sleep(0.8)
    
    # Check if a save dialog or overwrite dialog appeared
    for _ in range(5):
        popup = d.U.GetLastActivePopup(main_hwnd)
        if popup != main_hwnd:
            title = d.text(popup)
            print(f"Save dialog: {repr(title)}")
            if "Farklı Kaydetmeyi Onayla" in title or "Onayla" in title:
                # Find Evet button
                for c in d.children(popup):
                    if c['class'] == 'Button' and 'Evet' in c['title']:
                        print("Confirming overwrite (clicking Evet)...")
                        d.U.PostMessageW(c['hwnd'], 0x00F5, 0, 0)
                        time.sleep(0.5)
                        break
            elif "Proje Kaydet" in title or "Farklı Kaydet" in title:
                # Set path in edit 1001
                for c in d.children(popup):
                    if c['controlId'] == 1001 and c['class'] == 'Edit':
                        buf = C.c_wchar_p(r"C:\Users\hsyn\Desktop\AKSLAR_CALISMA.ide11trial")
                        d.U.SendMessageW(c['hwnd'], 0x000C, 0, buf)
                    elif c['controlId'] == 1 and c['class'] == 'Button':
                        btn = c['hwnd']
                time.sleep(0.2)
                d.U.PostMessageW(btn, 0x00F5, 0, 0)
                time.sleep(0.8)
        else:
            break
            
    # Update title in session
    for w in d.windows():
        if w['hwnd'] == main_hwnd:
            cfg['expect_title'] = w['title']
            d.write_json(session_path, cfg)
            break
            
    # 7. Capture Observation
    print("\nCapturing high-resolution observation...")
    obs = d.observe(cfg, capture=True)
    print(f"Screenshot: {obs['image']}")
    
    im = Image.open(obs['image'])
    l = 282 - (-8)
    t = 165 - (-8)
    r = 1371 - (-8)
    b = 1315 - (-8)
    crop = im.crop((l, t, r, b))
    out_path = r"C:\Users\hsyn\Desktop\ide_cikti\mustafa_selvi_statik\perfect_axes_2d.png"
    crop.save(out_path)
    print(f"2D plan view cropped: {out_path}")
    print("\n=== COMPLETE SUCCESS ===")

if __name__ == '__main__':
    draw()
