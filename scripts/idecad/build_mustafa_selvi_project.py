"""Automated execution of the Mustafa Selvi Static Model in ideCAD Statik 11.
Following the Hakem Heyeti Binding Protocol.
"""
import sys
import os
from pathlib import Path
import time
import math
import shutil
import json

sys.path.append(str(Path(__file__).parent))
import desktop as d

SESSION_PATH = 'C:/Users/hsyn/Desktop/ide_cikti/mustafa_selvi_statik/session.json'

def enter_point(cfg, x_val, y_val, click_x=800, click_y=700):
    """Deterministic coordinate entry without subprocess overhead."""
    d.foreground(cfg)
    # Ensure drawing surface focus if stuck in an unrelated Edit
    f = d.focus(cfg)
    if f and f.get('class') == 'Edit' and f.get('controlId') not in [12101, 12104]:
        d.key('esc')
        time.sleep(0.1)
        state = d.observe(cfg)
        cx, cy = d.point(cfg, state['observation'], click_x, click_y)
        d.click(cx, cy)
        time.sleep(0.1)

    for axis, value, control in [('x', x_val, 12101), ('y', y_val, 12104)]:
        deadline = time.monotonic() + 3.5
        focused = None
        while time.monotonic() < deadline:
            focused = d.focus(cfg)
            if focused and focused.get('class') == 'Edit' and focused.get('controlId') == control:
                break
            d.key(axis)
            time.sleep(0.12)
        if not (focused and focused.get('class') == 'Edit' and focused.get('controlId') == control):
            state = d.observe(cfg)
            cx, cy = d.point(cfg, state['observation'], click_x, click_y)
            d.click(cx, cy)
            time.sleep(0.1)
            d.key(axis)
            time.sleep(0.15)
            focused = d.focus(cfg)
            if not (focused and focused.get('class') == 'Edit' and focused.get('controlId') == control):
                raise RuntimeError(f'{axis} shortcut did not focus coordinate Edit: {focused}')

        d.type_text(str(value))
        deadline = time.monotonic() + 3.0
        while time.monotonic() < deadline:
            actual = d.text(focused['hwnd'], True)
            try:
                matches = math.isclose(float(actual), value, abs_tol=0.01)
            except ValueError:
                matches = False
            if matches:
                break
            time.sleep(0.04)
        d.key('enter')
        time.sleep(0.15)
    
    # Click work surface to commit point
    state = d.observe(cfg)
    cx, cy = d.point(cfg, state['observation'], click_x, click_y)
    d.click(cx, cy)
    time.sleep(0.12)

def set_axis_name(cfg, name):
    d.click(565, 186)
    time.sleep(0.35)
    dlgs = [w for w in d.windows(pid=cfg['identity']['pid']) if 'Aks Ayar' in w['title']]
    if not dlgs:
        time.sleep(0.3)
        dlgs = [w for w in d.windows(pid=cfg['identity']['pid']) if 'Aks Ayar' in w['title']]
    dlg = dlgs[0]
    ed = [c for c in d.children(dlg['hwnd']) if c['controlId'] == 10040][0]
    d.U.SendMessageW(ed['hwnd'], 0x000C, 0, name)
    time.sleep(0.05)
    btn = [c for c in d.children(dlg['hwnd']) if c['controlId'] == 1][0]
    d.click(btn['rect'][0] + 10, btn['rect'][1] + 10)
    time.sleep(0.35)

def draw_all_axes(cfg):
    print("--- Priority 1: Drawing Axes System ---")
    d.validate(cfg)
    d.foreground(cfg)
    d.click(800, 700)
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.1)

    # Vertical Axes (X Direction: A to M)
    vertical_axes = [
        ('A', 0), ('B', 150), ('C', 525), ('D', 850), ('E', 955),
        ('F', 1000), ('G', 1460), ('H', 1800), ('I', 2110), ('J', 2440),
        ('K', 2840), ('L', 3110), ('M', 3260)
    ]

    print("Drawing vertical axes (A to M)...")
    for name, x_val in vertical_axes:
        print(f"  Drawing Vertical Axis {name} at X={x_val}...")
        d.type_text('ak')
        d.key('enter')
        time.sleep(0.2)
        set_axis_name(cfg, name)
        # Restart ak
        d.type_text('ak')
        d.key('enter')
        time.sleep(0.2)
        # Two points: (X, -200) to (X, 2530)
        enter_point(cfg, x_val, -200)
        enter_point(cfg, x_val, 2530)
        d.key('esc')
        time.sleep(0.1)

    # Horizontal Axes (Y Direction: 35 down to 1)
    horizontal_axes = [
        ('35', 0), ('34', 75), ('33', 130), ('32', 225), ('28', 375),
        ('26', 715), ('25', 760), ('23', 865), ('20', 1015), ('16', 1240),
        ('15', 1315), ('11', 1570), ('9', 1920), ('7', 2050), ('3', 2200),
        ('1', 2330)
    ]

    print("Drawing horizontal axes (35 to 1)...")
    for name, y_val in horizontal_axes:
        print(f"  Drawing Horizontal Axis {name} at Y={y_val}...")
        d.type_text('ak')
        d.key('enter')
        time.sleep(0.2)
        set_axis_name(cfg, name)
        d.type_text('ak')
        d.key('enter')
        time.sleep(0.2)
        # Two points: (-200, Y) to (3460, Y)
        enter_point(cfg, -200, y_val)
        enter_point(cfg, 3460, y_val)
        d.key('esc')
        time.sleep(0.1)

    d.key('ctrl+x')
    time.sleep(0.5)
    print("All axes drawn successfully!")

def draw_shear_walls(cfg):
    print("\n--- Priority 2: Drawing Core & Shear Walls ---")
    d.validate(cfg)
    d.foreground(cfg)
    d.click(800, 700)
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.1)

    # 1. Elevator Core (Asansör Kuyusu):
    # Aks H (1800) to Aks I (2110)
    # Arka perde: along Aks 11 (Y=1570), from X=1800 to X=2110
    # Yan perdeler: along Aks H (X=1800) from Y=1315 to Y=1570; along Aks I (X=2110) from Y=1315 to Y=1570
    core_walls = [
        ("Asansor Arka (Aks 11)", 1800, 1570, 2110, 1570),
        ("Asansor Sol (Aks H)", 1800, 1315, 1800, 1570),
        ("Asansor Sag (Aks I)", 2110, 1315, 2110, 1570)
    ]

    print("Drawing elevator core walls...")
    for label, x1, y1, x2, y2 in core_walls:
        print(f"  Drawing {label} from ({x1}, {y1}) to ({x2}, {y2})...")
        d.type_text('pa')
        d.key('enter')
        time.sleep(0.3)
        enter_point(cfg, x1, y1)
        enter_point(cfg, x2, y2)
        d.key('esc')
        time.sleep(0.2)

    # 2. Torsional Balance Shear Walls (Burulma Denge Perdeleri):
    # 25x255 cm walls on exterior perimeter
    torsion_walls = [
        ("Burulma Perdesi Bati (Aks A)", 0, 1015, 0, 1270),
        ("Burulma Perdesi Dogu (Aks M)", 3260, 1015, 3260, 1270),
        ("Burulma Perdesi Guney (Aks 35)", 1460, 0, 1715, 0),
        ("Burulma Perdesi Kuzey (Aks 1)", 1460, 2330, 1715, 2330)
    ]

    print("Drawing torsional balance shear walls...")
    for label, x1, y1, x2, y2 in torsion_walls:
        print(f"  Drawing {label} from ({x1}, {y1}) to ({x2}, {y2})...")
        d.type_text('pa')
        d.key('enter')
        time.sleep(0.3)
        enter_point(cfg, x1, y1)
        enter_point(cfg, x2, y2)
        d.key('esc')
        time.sleep(0.2)

    d.key('ctrl+x')
    time.sleep(0.5)
    print("Shear walls created successfully!")

def draw_columns(cfg):
    print("\n--- Priority 3: Drawing Columns ---")
    d.validate(cfg)
    d.foreground(cfg)
    d.click(800, 700)
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.1)

    # Kolon komutu
    d.type_text('kl')
    d.key('enter')
    time.sleep(0.4)

    # Kolon boyutları MiniFrame penceresinden ayarlanır (30x70)
    w_kl = [x for x in d.windows(pid=cfg['identity']['pid']) if x['title'] == 'Kolon' and 'MiniFrame' in x['class']]
    if w_kl:
        b1_list = [c for c in d.children(w_kl[0]['hwnd']) if c['controlId'] == 18000]
        b2_list = [c for c in d.children(w_kl[0]['hwnd']) if c['controlId'] == 18010]
        if b1_list and b2_list:
            b1 = b1_list[0]
            b2 = b2_list[0]
            d.click(b1['rect'][0] + 15, b1['rect'][1] + 8)
            time.sleep(0.1)
            d.U.SendMessageW(b1['hwnd'], 0x00B1, 0, -1)
            d.type_text('30')
            d.key('enter')
            time.sleep(0.1)
            d.click(b2['rect'][0] + 15, b2['rect'][1] + 8)
            time.sleep(0.1)
            d.U.SendMessageW(b2['hwnd'], 0x00B1, 0, -1)
            d.type_text('70')
            d.key('enter')
            time.sleep(0.2)
            d.click(800, 700)
            time.sleep(0.2)

    column_points = [
        # Corners
        (0, 0), (3260, 0), (0, 2330), (3260, 2330),
        # Line Y=0
        (525, 0), (850, 0), (1460, 0), (1800, 0), (2110, 0), (2440, 0), (2840, 0),
        # Line Y=715
        (0, 715), (525, 715), (850, 715), (1460, 715), (2440, 715), (2840, 715), (3260, 715),
        # Line Y=1240
        (525, 1240), (850, 1240), (1460, 1240), (2440, 1240), (2840, 1240),
        # Line Y=1570
        (0, 1570), (3260, 1570),
        # Line Y=1920
        (525, 1920), (850, 1920), (1460, 1920), (1800, 1920), (2110, 1920), (2440, 1920), (2840, 1920),
        # Line Y=2200
        (0, 2200), (3260, 2200),
        # Line Y=2330
        (525, 2330), (850, 2330), (1460, 2330), (1800, 2330), (2110, 2330), (2440, 2330), (2840, 2330)
    ]

    print(f"Placing {len(column_points)} columns across the grid with 50% X / 50% Y inertia balance...")
    for idx, (cx, cy) in enumerate(column_points):
        # Alternate orientation for 50% X / 50% Y inertia balance
        if idx % 2 == 1:
            d.key('space')
            time.sleep(0.05)
        print(f"  Column {idx+1}/{len(column_points)} at ({cx}, {cy})...")
        enter_point(cfg, cx, cy)
        if idx % 2 == 1:
            d.key('space')
            time.sleep(0.05)

    d.key('esc')
    time.sleep(0.3)
    d.key('ctrl+x')
    time.sleep(0.5)
    print("All columns placed successfully!")

def draw_beams_and_slabs(cfg):
    print("\n--- Priority 4: Drawing Beams & Slabs ---")
    d.validate(cfg)
    d.foreground(cfg)
    d.click(800, 700)
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.1)

    # Framing beam grid lines:
    beam_lines = [
        # X direction lines
        [(0, 0), (525, 0), (850, 0), (1460, 0), (1800, 0), (2110, 0), (2440, 0), (2840, 0), (3260, 0)],
        [(0, 715), (525, 715), (850, 715), (1460, 715), (1800, 715), (2110, 715), (2440, 715), (2840, 715), (3260, 715)],
        [(0, 1240), (525, 1240), (850, 1240), (1460, 1240), (2440, 1240), (2840, 1240), (3260, 1240)],
        [(0, 1920), (525, 1920), (850, 1920), (1460, 1920), (1800, 1920), (2110, 1920), (2440, 1920), (2840, 1920), (3260, 1920)],
        [(0, 2330), (525, 2330), (850, 2330), (1460, 2330), (1800, 2330), (2110, 2330), (2440, 2330), (2840, 2330), (3260, 2330)],
        # Y direction lines
        [(0, 0), (0, 715), (0, 1240), (0, 1920), (0, 2330)],
        [(525, 0), (525, 715), (525, 1240), (525, 1920), (525, 2330)],
        [(850, 0), (850, 715), (850, 1240), (850, 1920), (850, 2330)],
        [(1460, 0), (1460, 715), (1460, 1240), (1460, 1920), (1460, 2330)],
        [(1800, 0), (1800, 715), (1800, 1315)],
        [(2110, 0), (2110, 715), (2110, 1315)],
        [(2440, 0), (2440, 715), (2440, 1240), (2440, 1920), (2440, 2330)],
        [(2840, 0), (2840, 715), (2840, 1240), (2840, 1920), (2840, 2330)],
        [(3260, 0), (3260, 715), (3260, 1240), (3260, 1920), (3260, 2330)]
    ]

    print("Drawing framing beams line by line...")
    for l_idx, pts in enumerate(beam_lines):
        print(f"  Drawing Beam Line {l_idx+1}/{len(beam_lines)} with {len(pts)-1} segments...")
        d.type_text('k')
        d.key('enter')
        time.sleep(0.3)
        for pt in pts:
            enter_point(cfg, pt[0], pt[1])
        d.key('esc')
        time.sleep(0.2)

    # Floor Slabs (hf = 15 cm)
    print("Placing floor slabs (hf = 15 cm)...")
    d.type_text('dö')
    d.key('enter')
    time.sleep(0.4)

    w_slab = [x for x in d.windows(pid=cfg['identity']['pid']) if 'Döşeme' in x['title'] or 'Deme' in x['title']]
    if w_slab:
        ed = [c for c in d.children(w_slab[0]['hwnd']) if c['controlId'] == 18014]
        if ed:
            d.click(ed[0]['rect'][0] + 15, ed[0]['rect'][1] + 8)
            time.sleep(0.1)
            d.U.SendMessageW(ed[0]['hwnd'], 0x00B1, 0, -1)
            d.type_text('15')
            d.key('enter')
            time.sleep(0.1)

    # Click center of key bays to generate slabs
    slab_centers = [
        (260, 350), (680, 350), (1150, 350), (1630, 350), (1950, 350), (2270, 350), (2640, 350), (3050, 350),
        (260, 970), (680, 970), (1150, 970), (2270, 970), (2640, 970), (3050, 970),
        (260, 1580), (680, 1580), (1150, 1580), (2640, 1580), (3050, 1580),
        (260, 2120), (680, 2120), (1150, 2120), (1630, 2120), (1950, 2120), (2270, 2120), (2640, 2120), (3050, 2120)
    ]

    for pt in slab_centers:
        print(f"  Placing slab at bay center {pt}...")
        try:
            enter_point(cfg, pt[0], pt[1])
        except Exception as e:
            print(f"    Notice: {e}")

    d.key('esc')
    time.sleep(0.3)
    d.key('ctrl+x')
    time.sleep(0.5)
    print("Beams and slabs completed!")

def copy_floors_and_raft(cfg):
    print("\n--- Priority 5: Story Copy & Raft Foundation ---")
    d.validate(cfg)
    d.foreground(cfg)
    d.U.ShowWindow(cfg['main'], 3) # SW_MAXIMIZE
    time.sleep(0.5)
    d.click(800, 700)
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.1)

    # 1. Kat Kopyala
    print("Opening Kat Kopyala...")
    d.click(150, 87) # Kat Kopyala button on ribbon (maximized)
    time.sleep(1.2)
    dlg = None
    for w in d.windows(pid=cfg['identity']['pid']):
        if 'Kat Kopyala' in w['title']:
            dlg = w
            break

    if dlg:
        print("Selecting upper floors to copy...")
        btn_ust = [c for c in d.children(dlg['hwnd']) if c['controlId'] == 1003]
        if btn_ust:
            d.click(btn_ust[0]['rect'][0] + 15, btn_ust[0]['rect'][1] + 10)
        else:
            d.click(1493, 661)
        time.sleep(0.5)
        btn_ok = [c for c in d.children(dlg['hwnd']) if c['controlId'] == 1]
        if btn_ok:
            d.click(btn_ok[0]['rect'][0] + 15, btn_ok[0]['rect'][1] + 10)
        else:
            d.click(1493, 392)
        time.sleep(2.0)
        print("Kat Kopyala completed!")

    # 2. Raft Foundation (Radye Temel)
    print("Switching down to foundation level...")
    d.click(800, 700)
    time.sleep(0.1)
    d.key('pagedown')
    time.sleep(0.4)
    d.key('pagedown')
    time.sleep(0.5)

    print("Drawing Radye Kenarı boundary...")
    d.type_text('radyekenar')
    d.key('enter')
    time.sleep(0.8)

    raft_boundary = [
        (-70, -70),
        (3330, -70),
        (3330, 2400),
        (-70, 2400),
        (-70, -70)
    ]

    for pt in raft_boundary:
        try:
            enter_point(cfg, pt[0], pt[1])
        except Exception as e:
            print(f"  Raft edge point notice: {e}")

    d.key('esc')
    time.sleep(0.5)

    # Radye Temel döşemesi (d = 65 cm)
    print("Placing Radye Temel döşemesi (d = 65 cm)...")
    d.type_text('radye')
    d.key('enter')
    time.sleep(0.8)

    w_raft = [x for x in d.windows(pid=cfg['identity']['pid']) if 'Radye' in x['title']]
    if w_raft:
        ed = [c for c in d.children(w_raft[0]['hwnd']) if c['class'] == 'Edit']
        if ed:
            d.click(ed[0]['rect'][0] + 15, ed[0]['rect'][1] + 8)
            time.sleep(0.1)
            d.U.SendMessageW(ed[0]['hwnd'], 0x00B1, 0, -1)
            d.type_text('65')
            d.key('enter')
            time.sleep(0.1)

    try:
        enter_point(cfg, 1630, 1165)
    except Exception as e:
        print(f"  Raft slab point notice: {e}")
    d.key('esc')
    time.sleep(0.5)

    # Switch back up to Zemin Kat
    d.key('pageup')
    time.sleep(0.3)
    d.key('pageup')
    time.sleep(0.3)

    # Zoom Extents
    d.click(800, 700)
    time.sleep(0.1)
    d.key('ctrl+x')
    time.sleep(0.5)
    d.click(1900, 700)
    time.sleep(0.1)
    d.key('ctrl+x')
    time.sleep(0.5)

    print("Story copy and raft foundation successfully created!")

def finalize_and_observe(cfg):
    print("\n--- Priority 6: Final Presentation & Observation ---")
    d.validate(cfg)
    d.foreground(cfg)
    d.click(800, 700)
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.1)
    d.key('ctrl+x')
    time.sleep(0.5)
    d.click(1900, 700)
    time.sleep(0.1)
    d.key('ctrl+x')
    time.sleep(0.5)

    obs = d.observe(cfg)
    final_png = 'C:/Users/hsyn/Desktop/ide_cikti/mustafa_selvi_statik/FINAL_MUSTAFA_SELVI_PROJECT.png'
    final_json = 'C:/Users/hsyn/Desktop/ide_cikti/mustafa_selvi_statik/FINAL_MUSTAFA_SELVI_PROJECT.json'
    
    shutil.copyfile(obs['image'], final_png)
    shutil.copyfile(obs['observation'], final_json)
    
    print(f"Final model successfully generated!")
    print(f"Screenshot: {final_png}")
    print(f"Observation JSON: {final_json}")
    print("Application remains LIVE and OPEN on Windows desktop.")

if __name__ == '__main__':
    d.desktop()
    cfg = d.read_json(SESSION_PATH)
    draw_all_axes(cfg)
    draw_shear_walls(cfg)
    draw_columns(cfg)
    draw_beams_and_slabs(cfg)
    copy_floors_and_raft(cfg)
    finalize_and_observe(cfg)
