"""Mustafa Selvi Mimari DWG Aks, Kolon ve Perde Cizimi.

Kullanici Istegi:
1. Kaydetmeden hazir sablondan (hsyn) yeni proje ac.
2. Mustafa Selvi Mimari DWG dosyasindaki aks araliklarina gore akslari koy (A-M, 35-1).
3. Kolon ve perdeleri gerekli yerlere koy (U asansor perdesi, burulma perdeleri, 41 adet 30x70 kolon).
4. Kaydetmeden oylece birak (ideCAD acik ve ekranda kalsin).
"""
from __future__ import annotations
import sys
import time
import math
from pathlib import Path
import ctypes as C

sys.path.insert(0, str(Path(__file__).parent))
import desktop as d
from PIL import Image

SESSION_PATH = r"C:\Users\hsyn\Desktop\ide_cikti\mustafa_selvi_statik\session.json"

def unlock_focus(hwnd):
    d.U.keybd_event(0x12, 0, 0, 0)
    d.U.keybd_event(0x12, 0, 2, 0)
    d.U.SetForegroundWindow(hwnd)
    d.U.BringWindowToTop(hwnd)
    time.sleep(0.15)

def enter_point(cfg, x_val, y_val, click_x=800, click_y=700):
    """Deterministic coordinate entry via Koordinat Kutusu."""
    d.foreground(cfg)
    f = d.focus(cfg)
    if f and f.get('class') == 'Edit' and f.get('controlId') not in [12101, 12104]:
        d.key('esc')
        time.sleep(0.05)
        d.click(click_x, click_y)
        time.sleep(0.05)

    for axis, value, control in [('x', x_val, 12101), ('y', y_val, 12104)]:
        deadline = time.monotonic() + 3.0
        focused = None
        while time.monotonic() < deadline:
            focused = d.focus(cfg)
            if focused and focused.get('class') == 'Edit' and focused.get('controlId') == control:
                break
            d.key(axis)
            time.sleep(0.08)
            
        if not (focused and focused.get('class') == 'Edit' and focused.get('controlId') == control):
            d.click(click_x, click_y)
            time.sleep(0.06)
            d.key(axis)
            time.sleep(0.1)
            focused = d.focus(cfg)

        d.type_text(str(value))
        time.sleep(0.05)
        d.key('enter')
        time.sleep(0.08)
    
    # Click work surface to commit point
    d.click(click_x, click_y)
    time.sleep(0.08)

def set_axis_name(cfg, name: str):
    """Set axis label in Aks Ayarları dialog."""
    # Find Aks toolbar
    aks_tb = None
    for w in d.windows(pid=cfg['identity']['pid']):
        if w['title'] == 'Aks':
            aks_tb = w
            break
    if aks_tb:
        r = aks_tb['rect']
        btn_x = r[2] - 16
        btn_y = (r[1] + r[3]) // 2 + 5
        d.click(btn_x, btn_y)
        time.sleep(0.35)
        popup = d.U.GetLastActivePopup(cfg['main'])
        if popup != cfg['main']:
            for c in d.children(popup):
                if c['controlId'] == 10040:
                    buf = C.c_wchar_p(name)
                    d.U.SendMessageW(c['hwnd'], 0x000C, 0, buf)
                elif c['controlId'] == 1 and c['class'] == 'Button':
                    tamam_btn = c['hwnd']
            time.sleep(0.1)
            d.U.SendMessageW(tamam_btn, 0x00F5, 0, 0)
            time.sleep(0.25)

def reset_and_open_fresh_project(cfg):
    main_hwnd = cfg['main']
    unlock_focus(main_hwnd)
    d.U.ShowWindow(main_hwnd, 3) # SW_MAXIMIZE
    time.sleep(0.3)
    
    print("1. Sifirlaniyor ve kaydetmeden yeni proje aciliyor...")
    d.key('esc')
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.15)
    
    # Open new project
    d.key('ctrl+n')
    time.sleep(0.7)
    
    popup = d.U.GetLastActivePopup(main_hwnd)
    if popup != main_hwnd:
        title = d.text(popup)
        if "ideCAD" in title:
            # Kaydetmeden gec (Hayir = 'h')
            print("  Kaydetme istemi gecildi (Hayir)...")
            d.key('h')
            time.sleep(0.7)
            popup = d.U.GetLastActivePopup(main_hwnd)
            title = d.text(popup)
        if "Yeni proje" in title:
            print("  Hazir sablondan (hsyn) proje aciliyor (Enter)...")
            d.key('enter')
            time.sleep(2.0)
            
    # Window re-maximize
    unlock_focus(main_hwnd)
    d.U.ShowWindow(main_hwnd, 3)
    time.sleep(0.4)
    
    # Update title in session
    for w in d.windows():
        if w['hwnd'] == main_hwnd:
            cfg['expect_title'] = w['title']
            d.write_json(SESSION_PATH, cfg)
            print(f"  Proje hazir: {repr(w['title'])}")
            break

def draw_axes(cfg):
    print("\n2. Mustafa Selvi Mimari DWG Aks Araliklari Ciziliyor...")
    d.foreground(cfg)
    d.key('esc')
    time.sleep(0.1)
    
    # Vertical Axes (X: 0 to 3260 cm)
    vertical_axes = [
        ('A', 0), ('B', 150), ('C', 525), ('D', 850), ('E', 955),
        ('F', 1000), ('G', 1460), ('H', 1800), ('I', 2110), ('J', 2440),
        ('K', 2840), ('L', 3110), ('M', 3260)
    ]
    
    print("  Dusey akslar ciziliyor (A -> M)...")
    for name, x_val in vertical_axes:
        d.type_text('ak')
        d.key('enter')
        time.sleep(0.15)
        set_axis_name(cfg, name)
        d.type_text('ak')
        d.key('enter')
        time.sleep(0.15)
        # 2 nokta ile cizim: (X, -200) -> (X, 2530)
        enter_point(cfg, x_val, -200)
        enter_point(cfg, x_val, 2530)
        d.key('esc')
        time.sleep(0.08)
        print(f"    Dusey Aks {name} (X={x_val} cm) yerlestirildi.")

    # Horizontal Axes (Y: 0 to 2330 cm)
    horizontal_axes = [
        ('35', 0), ('34', 75), ('33', 130), ('32', 225), ('28', 375),
        ('26', 715), ('25', 760), ('23', 865), ('20', 1015), ('16', 1240),
        ('15', 1315), ('11', 1570), ('9', 1920), ('7', 2050), ('3', 2200),
        ('1', 2330)
    ]
    
    print("  Yatay akslar ciziliyor (35 -> 1)...")
    for name, y_val in horizontal_axes:
        d.type_text('ak')
        d.key('enter')
        time.sleep(0.15)
        set_axis_name(cfg, name)
        d.type_text('ak')
        d.key('enter')
        time.sleep(0.15)
        # 2 nokta ile cizim: (-200, Y) -> (3460, Y)
        enter_point(cfg, -200, y_val)
        enter_point(cfg, 3460, y_val)
        d.key('esc')
        time.sleep(0.08)
        print(f"    Yatay Aks {name} (Y={y_val} cm) yerlestirildi.")

    d.key('ctrl+x')
    time.sleep(0.5)
    print("  Tum akslar basariyla olusturuldu.")

def draw_shear_walls(cfg):
    print("\n3. Perdeler Ciziliyor...")
    d.foreground(cfg)
    d.key('esc')
    time.sleep(0.1)

    # 1. Asansor Cekirdek Perdeleri (U Kurgusu)
    core_walls = [
        ("Asansor Arka (Aks 11)", 1800, 1570, 2110, 1570),
        ("Asansor Sol (Aks H)", 1800, 1315, 1800, 1570),
        ("Asansor Sag (Aks I)", 2110, 1315, 2110, 1570)
    ]
    print("  Asansor U perdeleri ciziliyor...")
    for label, x1, y1, x2, y2 in core_walls:
        d.type_text('pa')
        d.key('enter')
        time.sleep(0.2)
        enter_point(cfg, x1, y1)
        enter_point(cfg, x2, y2)
        d.key('esc')
        time.sleep(0.1)
        print(f"    {label} ({x1},{y1}) -> ({x2},{y2}) tamamlandi.")

    # 2. Burulma Denge Perdeleri (25x255 cm)
    torsion_walls = [
        ("Burulma Bati (Aks A)", 0, 1015, 0, 1270),
        ("Burulma Dogu (Aks M)", 3260, 1015, 3260, 1270),
        ("Burulma Guney (Aks 35)", 1460, 0, 1715, 0),
        ("Burulma Kuzey (Aks 1)", 1460, 2330, 1715, 2330)
    ]
    print("  Burulma denge perdeleri ciziliyor...")
    for label, x1, y1, x2, y2 in torsion_walls:
        d.type_text('pa')
        d.key('enter')
        time.sleep(0.2)
        enter_point(cfg, x1, y1)
        enter_point(cfg, x2, y2)
        d.key('esc')
        time.sleep(0.1)
        print(f"    {label} ({x1},{y1}) -> ({x2},{y2}) tamamlandi.")

    d.key('ctrl+x')
    time.sleep(0.4)
    print("  Tum perdeler basariyla cizildi.")

def draw_columns(cfg):
    print("\n4. Kolonlar Ciziliyor (30x70 cm, %50 X - %50 Y Atalet Dengesi)...")
    d.foreground(cfg)
    d.key('esc')
    time.sleep(0.1)

    # Kolon komutu
    d.type_text('kl')
    d.key('enter')
    time.sleep(0.35)

    # Kolon Toolbar'inda b1 ve b2 boyutlarini 30x70 yap
    w_kl = [x for x in d.windows(pid=cfg['identity']['pid']) if x['title'] == 'Kolon' and 'MiniFrame' in x['class']]
    if w_kl:
        b1_list = [c for c in d.children(w_kl[0]['hwnd']) if c['controlId'] == 18000]
        b2_list = [c for c in d.children(w_kl[0]['hwnd']) if c['controlId'] == 18010]
        if b1_list and b2_list:
            b1, b2 = b1_list[0], b2_list[0]
            d.click(b1['rect'][0] + 15, b1['rect'][1] + 8)
            time.sleep(0.08)
            d.U.SendMessageW(b1['hwnd'], 0x00B1, 0, -1)
            d.type_text('30')
            d.key('enter')
            time.sleep(0.08)
            d.click(b2['rect'][0] + 15, b2['rect'][1] + 8)
            time.sleep(0.08)
            d.U.SendMessageW(b2['hwnd'], 0x00B1, 0, -1)
            d.type_text('70')
            d.key('enter')
            time.sleep(0.15)
            d.click(800, 700)
            time.sleep(0.15)

    # DWG kat planina uygun 41 adet kolon koordinati
    column_points = [
        # Koseler
        (0, 0), (3260, 0), (0, 2330), (3260, 2330),
        # Guney Hatti (Y=0)
        (525, 0), (850, 0), (1460, 0), (1800, 0), (2110, 0), (2440, 0), (2840, 0),
        # Hat Y=715
        (0, 715), (525, 715), (850, 715), (1460, 715), (2440, 715), (2840, 715), (3260, 715),
        # Hat Y=1240
        (525, 1240), (850, 1240), (1460, 1240), (2440, 1240), (2840, 1240),
        # Hat Y=1570
        (0, 1570), (3260, 1570),
        # Hat Y=1920
        (525, 1920), (850, 1920), (1460, 1920), (1800, 1920), (2110, 1920), (2440, 1920), (2840, 1920),
        # Hat Y=2200
        (0, 2200), (3260, 2200),
        # Kuzey Hatti (Y=2330)
        (525, 2330), (850, 2330), (1460, 2330), (1800, 2330), (2110, 2330), (2440, 2330), (2840, 2330)
    ]

    print(f"  {len(column_points)} kolon yerlestiriliyor...")
    for idx, (cx, cy) in enumerate(column_points):
        # 50% X ve 50% Y atalet dengesi icin yon degisimi (Space)
        if idx % 2 == 1:
            d.key('space')
            time.sleep(0.04)
        enter_point(cfg, cx, cy)
        if idx % 2 == 1:
            d.key('space')
            time.sleep(0.04)

    d.key('esc')
    time.sleep(0.2)
    d.key('ctrl+x')
    time.sleep(0.5)
    print("  Tum kolonlar basariyla yerlestirildi.")

def main():
    d.desktop()
    cfg = d.read_json(SESSION_PATH)
    d.validate(cfg)
    
    # 1. Kaydetmeden sifirla ve hazir sablondan ac
    reset_and_open_fresh_project(cfg)
    
    # 2. DWG aks araliklarina gore akslari ciz
    draw_axes(cfg)
    
    # 3. Perdeleri ciz
    draw_shear_walls(cfg)
    
    # 4. Kolonlari ciz
    draw_columns(cfg)
    
    # 5. Ekrana sigdir (Ctrl+X)
    print("\n5. Model ekrana sigdiriliyor (Ctrl+X)...")
    d.key('esc')
    time.sleep(0.1)
    d.key('ctrl+x')
    time.sleep(0.8)
    
    # 6. KESIN KURAL: KAYDETMEDEN OYLECE BIRAK
    print("\n=== KULLANICI TALIMATI: KAYDEDILMEDEN OYLECE EKRANDA BIRAKILIYOR ===")
    
    # 7. Dogrulama goruntusu al
    obs = d.observe(cfg, capture=True)
    print(f"Dogrulama goruntusu alindi: {obs['image']}")
    
    im = Image.open(obs['image'])
    l = 282 - (-8)
    t = 165 - (-8)
    r = 1371 - (-8)
    b = 1315 - (-8)
    crop = im.crop((l, t, r, b))
    out_2d = r"C:\Users\hsyn\Desktop\ide_cikti\mustafa_selvi_statik\mustafa_selvi_axes_cols_walls.png"
    crop.save(out_2d)
    print(f"2D plan kesiti kaydedildi: {out_2d}")
    print("\nIslem tamamlandi. ideCAD kapatilmadi, kaydedilmedi, ekranda canli birakildi.")

if __name__ == '__main__':
    main()
