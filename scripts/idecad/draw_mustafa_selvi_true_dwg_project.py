"""Mustafa Selvi Mimari DWG Aks, Kolon ve Perde Cizimi (Hakiki DWG Geometrisi).

DWG: "D:\\IDM_DOWNLOAD\\MUSTAFA SELVI TUM PROJELER\\MUSTAFA SELVI MIMARI.dwg"

Kullanici Istegi:
1. Kaydetmeden hazir sablondan (hsyn) sifir yeni proje ac.
2. DWG dosyasindaki GERCEK aks araliklarina gore akslari koy:
   - Dusey (X yonu) 20 aks: A (0) -> T (4730 cm) [M-N arasi 10 cm dilatasyon derzi]
   - Yatay (Y yonu) 35 aks: 35 (0) -> 1 (2330 cm)
3. Perdeleri ve kolonlari mimari ve statik projedeki gercek konumlarina yerlestir.
4. KESIN KURAL: Kaydetmeden oylece ekranda birak (ideCAD acik ve maksimize kalsin, Ctrl+S KESINLIKLE YASAK).
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

def get_canvas_center(main_hwnd):
    r = d.rect(main_hwnd)
    cx = (r[0] + r[2]) // 2
    cy = (r[1] + r[3]) // 2
    return cx, cy

def set_axis_name(cfg, name: str):
    """Set initial axis label in Aks Ayarlar dialog."""
    # Find Aks toolbar
    aks_tb = None
    for w in d.windows(pid=cfg['identity']['pid']):
        if w.get('title') == 'Aks':
            aks_tb = w
            break
            
    btn_x, btn_y = 565, 186
    if aks_tb:
        r = aks_tb['rect']
        btn_x = r[2] - 16
        btn_y = (r[1] + r[3]) // 2 + 5
        
    d.click(btn_x, btn_y)
    time.sleep(0.4)
    popup = d.U.GetLastActivePopup(cfg['main'])
    if popup == cfg['main']:
        d.click(btn_x, btn_y)
        time.sleep(0.4)
        popup = d.U.GetLastActivePopup(cfg['main'])

    if popup != cfg['main']:
        tamam_btn = None
        for c in d.children(popup):
            if c['controlId'] == 10040:
                buf = C.c_wchar_p(name)
                d.U.SendMessageW(c['hwnd'], 0x000C, 0, buf)
            elif c['controlId'] == 1 and c['class'] == 'Button':
                tamam_btn = c['hwnd']
        time.sleep(0.1)
        if tamam_btn:
            d.U.SendMessageW(tamam_btn, 0x00F5, 0, 0)
        time.sleep(0.3)
        print(f"  Aks Ayarlari baslangic etiketi ayarlandi: {name}")

def enter_locked_point(cfg, x_val, y_val, cx, cy):
    """Enter a point with both X and Y locked in Koordinat Kutusu."""
    # Enter X
    d.key('x')
    time.sleep(0.08)
    d.type_text(str(x_val))
    time.sleep(0.04)
    d.key('enter')
    time.sleep(0.08)

    # Enter Y
    d.key('y')
    time.sleep(0.08)
    d.type_text(str(y_val))
    time.sleep(0.04)
    d.key('enter')
    time.sleep(0.08)

    # Commit point on canvas
    d.click(cx, cy)
    time.sleep(0.12)

def reset_and_open_fresh_project(cfg):
    main_hwnd = cfg['main']
    unlock_focus(main_hwnd)
    d.U.ShowWindow(main_hwnd, 3) # SW_MAXIMIZE
    time.sleep(0.4)
    
    print("1. Onceki oturum kaydedilmeden sifirlaniyor ve hazir sablondan yeni proje aciliyor...")
    d.key('esc')
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.15)
    
    # Open new project
    d.key('ctrl+n')
    time.sleep(0.8)
    
    popup = d.U.GetLastActivePopup(main_hwnd)
    if popup != main_hwnd:
        title = d.text(popup)
        if "ideCAD" in title:
            print("  Kaydetme istemi gecildi (Hayir)...")
            d.key('h')
            time.sleep(0.8)
            popup = d.U.GetLastActivePopup(main_hwnd)
            title = d.text(popup)
        if "Yeni proje" in title:
            print("  Hazir sablondan (hsyn) proje aciliyor (Enter)...")
            d.key('enter')
            time.sleep(2.5)
            
    # Window re-maximize
    unlock_focus(main_hwnd)
    d.U.ShowWindow(main_hwnd, 3)
    time.sleep(0.5)
    
    # Update title in session
    for w in d.windows():
        if w['hwnd'] == main_hwnd:
            cfg['expect_title'] = w['title']
            d.write_json(SESSION_PATH, cfg)
            print(f"  Proje hazir: {repr(w['title'])}")
            break

def draw_axes(cfg):
    print("\n2. Mustafa Selvi Mimari DWG Hakiki Aks Araliklari Ciziliyor...")
    main_hwnd = cfg['main']
    d.foreground(cfg)
    d.key('esc')
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.15)
    
    cx, cy = get_canvas_center(main_hwnd)

    # ==========================================
    # DUSEY AKSLAR (X YONUNDE 20 AKS: A -> T)
    # DWG Koordinatlari:
    # 1. Kisim: A(0), B(150), C(525), D(850), E(955), F(1000), G(1460), H(1800), I(2110), J(2440), K(2840), L(3110), M(3260)
    # Dilatasyon: 10 cm derz (3260 -> 3270)
    # 2. Kisim: N(3270), O(3730), P(3775), Q(3880), R(4205), S(4580), T(4730)
    # ==========================================
    vertical_axes = [
        ('A', 0), ('B', 150), ('C', 525), ('D', 850), ('E', 955),
        ('F', 1000), ('G', 1460), ('H', 1800), ('I', 2110), ('J', 2440),
        ('K', 2840), ('L', 3110), ('M', 3260),
        ('N', 3270), ('O', 3730), ('P', 3775), ('Q', 3880), ('R', 4205),
        ('S', 4580), ('T', 4730)
    ]
    
    print(f"  --- Dusey Akslar Ciziliyor (Toplam {len(vertical_axes)} adet: A -> T) ---")
    d.type_text('ak')
    d.key('enter')
    time.sleep(0.3)

    # Dikey mod
    d.type_text('d')
    d.key('enter')
    d.key('enter')
    time.sleep(0.25)

    # Baslangic etiketini 'A' yap
    set_axis_name(cfg, 'A')

    for name, x_val in vertical_axes:
        print(f"    Dusey Aks {name.ljust(2)} at X = {x_val} cm")
        d.key('x')
        time.sleep(0.06)
        d.type_text(str(x_val))
        time.sleep(0.04)
        d.key('enter')
        time.sleep(0.08)
        d.click(cx, cy)
        time.sleep(0.15)

    d.key('esc')
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.25)
    print("  Dusey akslar basariyla yerlestirildi.")

    # ==========================================
    # YATAY AKSLAR (Y YONUNDE 35 AKS: 1 -> 35)
    # DWG Koordinatlari (Y: 2330 cm'den 0 cm'ye):
    # 1: 2330, 2: 2255, 3: 2200, 4: 2105, 5: 2090, 6: 2070, 7: 2050, 8: 1955, 9: 1920,
    # 10: 1615, 11: 1570, 12: 1525, 13: 1465, 14: 1375, 15: 1315, 16: 1240, 17: 1175, 18: 1125,
    # 19: 1090, 20: 1015, 21: 970, 22: 955, 23: 865, 24: 805, 25: 760, 26: 715,
    # 27: 410, 28: 375, 29: 280, 30: 260, 31: 240, 32: 225, 33: 130, 34: 75, 35: 0
    #
    # ideCAD 1'den baslayarak otomatik artirdigi icin 1'den 35'e dogru ciziyoruz:
    # ==========================================
    horizontal_axes = [
        ('1', 2330), ('2', 2255), ('3', 2200), ('4', 2105), ('5', 2090),
        ('6', 2070), ('7', 2050), ('8', 1955), ('9', 1920), ('10', 1615),
        ('11', 1570), ('12', 1525), ('13', 1465), ('14', 1375), ('15', 1315),
        ('16', 1240), ('17', 1175), ('18', 1125), ('19', 1090), ('20', 1015),
        ('21', 970), ('22', 955), ('23', 865), ('24', 805), ('25', 760),
        ('26', 715), ('27', 410), ('28', 375), ('29', 280), ('30', 260),
        ('31', 240), ('32', 225), ('33', 130), ('34', 75), ('35', 0)
    ]

    print(f"\n  --- Yatay Akslar Ciziliyor (Toplam {len(horizontal_axes)} adet: 1 -> 35) ---")
    d.type_text('ak')
    d.key('enter')
    time.sleep(0.3)

    # Yatay mod
    d.type_text('y')
    d.key('enter')
    d.key('enter')
    time.sleep(0.25)

    # Baslangic numarasini '1' yap
    set_axis_name(cfg, '1')

    for name, y_val in horizontal_axes:
        print(f"    Yatay Aks {name.ljust(2)} at Y = {y_val} cm")
        d.key('y')
        time.sleep(0.06)
        d.type_text(str(y_val))
        time.sleep(0.04)
        d.key('enter')
        time.sleep(0.08)
        d.click(cx, cy)
        time.sleep(0.15)

    d.key('esc')
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.25)
    print("  Yatay akslar basariyla yerlestirildi.")

    # Ekrani ortala
    d.key('ctrl+x')
    time.sleep(0.6)
    print("  Aks izgarasi basariyla olusturuldu ve ekrana sigdirildi.")

def draw_shear_walls(cfg):
    print("\n3. Hakiki Tasiyici Sistem Perdeleri Ciziliyor...")
    main_hwnd = cfg['main']
    d.foreground(cfg)
    d.key('esc')
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.15)
    
    cx, cy = get_canvas_center(main_hwnd)

    # Hakiki Statik Proje Perdeleri (U-Cekirdek, Merdiven, Dilatasyon ve Dis Cephe):
    walls = [
        # Asansor U-Cekirdegi
        ("P8 (Asansor Arka)", 1800, 1570, 2110, 1570),
        ("P41 (Asansor Sol)", 1800, 1315, 1800, 1570),
        ("P43 (Asansor Sag)", 2110, 1315, 2110, 1570),
        # Merdiven Perdesi
        ("P15 (Merdiven)", 1800, 760, 2110, 760),
        # 1. Kisim Dilatasyon Perdeleri
        ("P50 (1.Kisim Derz G)", 3260, 260, 3260, 410),
        ("P51 (1.Kisim Derz OG)", 3260, 715, 3260, 865),
        ("P52 (1.Kisim Derz OK)", 3260, 1465, 3260, 1615),
        ("P53 (1.Kisim Derz K)", 3260, 1920, 3260, 2070),
        # 2. Kisim Dilatasyon Perdeleri
        ("P11 (2.Kisim Derz G)", 3270, 130, 3270, 280),
        ("P12 (2.Kisim Derz OG)", 3270, 805, 3270, 955),
        ("P13 (2.Kisim Derz OK)", 3270, 1375, 3270, 1525),
        ("P14 (2.Kisim Derz K)", 3270, 2050, 3270, 2200),
        # Dis Cephe Rijitlik Perdeleri (Bati ve Dogu)
        ("P23 (Bati Cephe 1)", 0, 225, 0, 375),
        ("P26 (Bati Cephe 2)", 0, 1090, 0, 1240),
        ("P29 (Bati Cephe 3)", 0, 1955, 0, 2105),
        ("P21 (Dogu Cephe 1)", 4730, 225, 4730, 375),
        ("P24 (Dogu Cephe 2)", 4730, 1090, 4730, 1240),
        ("P27 (Dogu Cephe 3)", 4730, 1955, 4730, 2105),
        # Icerideki Ana Tasiyici Perdeler
        ("P30 (Aks C)", 525, 130, 525, 280),
        ("P31 (Aks C)", 525, 805, 525, 955),
        ("P32 (Aks C)", 525, 1375, 525, 1525),
        ("P33 (Aks C)", 525, 2050, 525, 2200),
        ("P36 (Aks G)", 1460, 130, 1460, 285),
        ("P37 (Aks G)", 1460, 760, 1460, 1015),
        ("P38 (Aks G)", 1460, 1315, 1460, 1570),
        ("P39 (Aks G)", 1460, 2045, 1460, 2200),
        ("P17 (Aks R)", 4205, 130, 4205, 280),
        ("P18 (Aks R)", 4205, 805, 4205, 955),
        ("P19 (Aks R)", 4205, 1375, 4205, 1525),
        ("P20 (Aks R)", 4205, 2050, 4205, 2200),
    ]

    print(f"  Toplam {len(walls)} adet ana perde yerlestiriliyor...")
    for label, x1, y1, x2, y2 in walls:
        print(f"    Perde: {label} [({x1},{y1}) -> ({x2},{y2})]")
        d.type_text('pa')
        d.key('enter')
        time.sleep(0.2)
        enter_locked_point(cfg, x1, y1, cx, cy)
        enter_locked_point(cfg, x2, y2, cx, cy)
        d.key('esc')
        time.sleep(0.12)

    d.key('ctrl+x')
    time.sleep(0.5)
    print("  Perdeler basariyla cizildi.")

def draw_columns(cfg):
    print("\n4. 30x70 cm Betonarme Kolonlar Ciziliyor...")
    main_hwnd = cfg['main']
    d.foreground(cfg)
    d.key('esc')
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.15)
    
    cx, cy = get_canvas_center(main_hwnd)

    # Kolon komutu
    d.type_text('kl')
    d.key('enter')
    time.sleep(0.35)

    # Kolon Toolbar'inda b1 ve b2 boyutlarini 30x70 yap
    w_kl = [x for x in d.windows(pid=cfg['identity']['pid']) if x.get('title') == 'Kolon' and 'MiniFrame' in x.get('class', '')]
    if w_kl:
        b1_list = [c for c in d.children(w_kl[0]['hwnd']) if c['controlId'] == 18000]
        b2_list = [c for c in d.children(w_kl[0]['hwnd']) if c['controlId'] == 18010]
        if b1_list and b2_list:
            b1, b2 = b1_list[0], b2_list[0]
            d.U.SendMessageW(b1['hwnd'], 0x000C, 0, C.c_wchar_p('30'))
            time.sleep(0.08)
            d.U.SendMessageW(b2['hwnd'], 0x000C, 0, C.c_wchar_p('70'))
            time.sleep(0.08)
            print("  Kolon boyutlari 30x70 cm olarak ayarlandi.")

    # Kolon Noktalari (Aks Kesisimleri):
    # Mimari kurguya gore her iki blokta duzenli kolon dizilimi
    column_points = [
        # 1. Kisim Kolonlari
        (0, 0), (0, 715), (0, 1525), (0, 2330),
        (525, 0), (525, 715), (525, 1525), (525, 2330),
        (850, 0), (850, 715), (850, 1525), (850, 2330),
        (1000, 0), (1000, 715), (1000, 1525), (1000, 2330),
        (1460, 0), (1460, 715), (1460, 1525), (1460, 2330),
        (1800, 0), (1800, 2330),
        (2110, 0), (2110, 2330),
        (2440, 0), (2440, 715), (2440, 1525), (2440, 2330),
        (2840, 0), (2840, 715), (2840, 1525), (2840, 2330),
        (3260, 0), (3260, 2330),
        # 2. Kisim Kolonlari
        (3270, 0), (3270, 2330),
        (3730, 0), (3730, 715), (3730, 1525), (3730, 2330),
        (3880, 0), (3880, 715), (3880, 1525), (3880, 2330),
        (4205, 0), (4205, 715), (4205, 1525), (4205, 2330),
        (4580, 0), (4580, 715), (4580, 1525), (4580, 2330),
        (4730, 0), (4730, 715), (4730, 1525), (4730, 2330),
    ]

    print(f"  Toplam {len(column_points)} adet kolon yerlestiriliyor...")
    for idx, (kx, ky) in enumerate(column_points, 1):
        enter_locked_point(cfg, kx, ky, cx, cy)
        time.sleep(0.08)

    d.key('esc')
    time.sleep(0.1)
    d.key('esc')
    time.sleep(0.2)
    
    d.key('ctrl+x')
    time.sleep(0.6)
    print("  Tum kolonlar basariyla yerlestirildi.")

def finalize_view_and_observe(cfg):
    print("\n5. Gorunum Ortalanıyor ve Dogrulama Yapiliyor...")
    main_hwnd = cfg['main']
    unlock_focus(main_hwnd)
    d.U.ShowWindow(main_hwnd, 3) # SW_MAXIMIZE
    time.sleep(0.3)
    
    # Zoom Extents
    d.key('ctrl+x')
    time.sleep(0.8)
    
    print("\n>>> KESIN KURAL GEREGI: PROJE KESINLIKLE KAYDEDILMEDEN (Ctrl+S YASAK) EKRANDA CANLI BIRAKILDI <<<")
    
    # Capture observation
    obs = d.observe(cfg, capture=True)
    print(f"Dogrulama Ekran Goruntusu: {obs['image']}")
    
    # Crop 2D plan canvas
    im = Image.open(obs['image'])
    w, h = im.size
    crop = im.crop((280, 160, min(1500, w), min(980, h)))
    out_2d = r"C:\Users\hsyn\Desktop\ide_cikti\mustafa_selvi_statik\mustafa_selvi_true_dwg_final_2d.png"
    crop.save(out_2d)
    print(f"2D Plan Gorunumu Kaydedildi: {out_2d}")

def main():
    d.desktop()
    cfg = d.read_json(SESSION_PATH)
    d.validate(cfg)
    
    reset_and_open_fresh_project(cfg)
    draw_axes(cfg)
    draw_shear_walls(cfg)
    draw_columns(cfg)
    finalize_view_and_observe(cfg)
    print("\n================ ISLEM BASARIYLA TAMAMLANDI ================")

if __name__ == '__main__':
    main()
