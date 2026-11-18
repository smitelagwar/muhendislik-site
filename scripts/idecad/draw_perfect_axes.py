"""Draw perfect horizontal and vertical axes in ideCAD conforming to engineering standards.

Engineering Standards:
- Düşey Akslar: A, B, C, D, E (soldan sağa artar, balonlar üstte/altta)
- Yatay Akslar: 1, 2, 3, 4 (aşağıdan yukarıya artar, balonlar solda/sağda)
- ideCAD Ribbon: Betonarme -> Aks (shortcut 'ak')
- Aks Ayarları: initial name 'A' for vertical, '1' for horizontal
- Zoom Extents (Ctrl+X) to center and balance views.
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

def set_axis_name_in_dialog(main_hwnd, name: str):
    # Click settings button on Aks toolbar (or wait for popup)
    # Toolbar rect is [300, 150, 581, 202], Ayarlar icon is at (565, 188)
    d.click(565, 188)
    time.sleep(0.5)
    
    popup = d.U.GetLastActivePopup(main_hwnd)
    if popup == main_hwnd:
        # Retry click
        d.click(565, 188)
        time.sleep(0.5)
        popup = d.U.GetLastActivePopup(main_hwnd)
    
    if popup != main_hwnd:
        print(f"Aks Ayarları opened (hwnd: {popup}), setting axis name to '{name}'...")
        tamam_hwnd = None
        for c in d.children(popup):
            if c['controlId'] == 10040: # Aks adı Edit control
                buf = C.c_wchar_p(name)
                d.U.SendMessageW(c['hwnd'], 0x000C, 0, buf) # WM_SETTEXT
            elif c['controlId'] == 1 and c['class'] == 'Button':
                tamam_hwnd = c['hwnd']
        
        time.sleep(0.2)
        if tamam_hwnd:
            d.U.SendMessageW(tamam_hwnd, 0x00F5, 0, 0) # BM_CLICK
            time.sleep(0.4)
        print("Aks Ayarları confirmed and closed.")
    else:
        print("Warning: Aks Ayarları popup did not appear!")

def run():
    d.desktop()
    session_path = r"C:\Users\hsyn\Desktop\ide_cikti\mustafa_selvi_statik\session.json"
    cfg = d.read_json(session_path)
    main_hwnd = cfg['main']
    
    print(f"Connecting to ideCAD main HWND {main_hwnd}...")
    unlock_focus(main_hwnd)
    d.U.ShowWindow(main_hwnd, 3) # SW_MAXIMIZE
    time.sleep(0.3)
    
    # 1. Reset any active command
    print("Resetting command line...")
    d.key('esc')
    time.sleep(0.15)
    d.key('esc')
    time.sleep(0.2)
    
    # 2. Open a fresh project from template
    print("Opening fresh clean project (Ctrl+N)...")
    d.key('ctrl+n')
    time.sleep(0.6)
    
    popup = d.U.GetLastActivePopup(main_hwnd)
    if popup != main_hwnd:
        title = d.text(popup)
        print(f"Popup appeared: {repr(title)}")
        if "ideCAD" in title: # Save prompt
            print("Discarding unsaved scratch project (sending 'h')...")
            d.key('h')
            time.sleep(0.6)
            popup = d.U.GetLastActivePopup(main_hwnd)
            title = d.text(popup)
        
        if "Yeni proje" in title:
            print("Selecting template and opening fresh project (sending Enter)...")
            d.key('enter')
            time.sleep(1.5)
    
    # Re-maximize and unlock focus
    unlock_focus(main_hwnd)
    d.U.ShowWindow(main_hwnd, 3)
    time.sleep(0.4)
    
    # Update title in session
    for w in d.windows():
        if w['hwnd'] == main_hwnd:
            cfg['expect_title'] = w['title']
            d.write_json(session_path, cfg)
            print(f"Project ready: {repr(w['title'])}")
            break
            
    # 3. Start Aks Command
    print("Starting 'ak' command...")
    d.type_text('ak')
    time.sleep(0.15)
    d.key('enter')
    time.sleep(0.6)
    
    # Set mode to Dikey (Vertical)
    print("Setting mode to Dikey (Vertical)...")
    d.type_text('d')
    time.sleep(0.1)
    d.key('enter')
    time.sleep(0.1)
    d.key('enter')
    time.sleep(0.3)
    
    # Set start name to 'A'
    set_axis_name_in_dialog(main_hwnd, 'A')
    
    # Screen coordinates for 2D Plan View:
    # 2D View rect is [282, 165, 1371, 1315]
    # Building box is X in [467, 1214], Y in [457, 1000]
    # Vertical axes:
    # A: X = 535 (bay 1 left)
    # B: X = 671 (+136 px = ~2.00 m)
    # C: X = 875 (+204 px = ~3.00 m)
    # D: X = 1079 (+204 px = ~3.00 m)
    # E: X = 1215 (+136 px = ~2.00 m)
    vertical_xs = [535, 671, 875, 1079, 1215]
    axis_letters = ['A', 'B', 'C', 'D', 'E']
    
    print("\n--- Drawing Vertical Axes (A through E) ---")
    for letter, x in zip(axis_letters, vertical_xs):
        print(f"Placing Vertical Axis {letter} at screen X={x}, Y=740...")
        d.click(x, 740)
        time.sleep(0.4)
        
    # 4. Switch to Horizontal (Yatay) Axes
    print("\nSetting mode to Yatay (Horizontal)...")
    d.type_text('y')
    time.sleep(0.1)
    d.key('enter')
    time.sleep(0.1)
    d.key('enter')
    time.sleep(0.3)
    
    # Set start name to '1'
    set_axis_name_in_dialog(main_hwnd, '1')
    
    # Horizontal axes (from bottom to top in engineering standards):
    # Bottom: Y = 932 (Axis 1)
    # Middle lower: Y = 796 (Axis 2, +136 px = ~2.00 m)
    # Middle upper: Y = 592 (Axis 3, +204 px = ~3.00 m)
    # Top: Y = 456 (Axis 4, +136 px = ~2.00 m)
    horizontal_ys = [932, 796, 592, 456]
    axis_numbers = ['1', '2', '3', '4']
    
    print("\n--- Drawing Horizontal Axes (1 through 4) ---")
    for num, y in zip(axis_numbers, horizontal_ys):
        print(f"Placing Horizontal Axis {num} at screen X=875, Y={y}...")
        d.click(875, y)
        time.sleep(0.4)
        
    # 5. Finish drawing & Zoom extents
    print("\nExiting 'ak' command...")
    d.key('esc')
    time.sleep(0.15)
    d.key('esc')
    time.sleep(0.3)
    
    print("Fitting view with Zoom Extents (Ctrl+X)...")
    d.key('ctrl+x')
    time.sleep(0.8)
    
    # 6. Save working project to Desktop
    print("Saving project to Desktop...")
    # Trigger Ctrl+S
    d.key('ctrl+s')
    time.sleep(0.8)
    popup = d.U.GetLastActivePopup(main_hwnd)
    if popup != main_hwnd:
        # If 'Farklı Kaydet' dialog appears, enter destination path
        title = d.text(popup)
        print(f"Save dialog appeared: {repr(title)}")
        # In standard Windows save dialog, control 1001 is file name Edit
        for c in d.children(popup):
            if c['controlId'] == 1001 and c['class'] == 'Edit':
                buf = C.c_wchar_p(r"C:\Users\hsyn\Desktop\AKSLAR_CALISMA.ide11trial")
                d.U.SendMessageW(c['hwnd'], 0x000C, 0, buf)
                time.sleep(0.2)
            elif c['controlId'] == 1 and c['class'] == 'Button': # Save button
                save_btn = c['hwnd']
        d.U.SendMessageW(save_btn, 0x00F5, 0, 0)
        time.sleep(1.0)
    
    # 7. Capture final observation
    print("Capturing final observation screenshot...")
    obs = d.observe(cfg, capture=True)
    print(f"Screenshot saved: {obs['image']}")
    
    # Also crop 2D view for report
    im = Image.open(obs['image'])
    l = 282 - (-8)
    t = 165 - (-8)
    r = 1371 - (-8)
    b = 1315 - (-8)
    crop = im.crop((l, t, r, b))
    out_2d = r"C:\Users\hsyn\Desktop\ide_cikti\mustafa_selvi_statik\final_perfect_axes.png"
    crop.save(out_2d)
    print(f"2D plan view cropped and saved: {out_2d}")
    print("\n=== AXIS DRAWING COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    run()
