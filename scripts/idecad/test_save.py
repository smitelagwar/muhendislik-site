import sys
import time
from pathlib import Path

sys.path.append(str(Path(__file__).parent))
import desktop as d

def main():
    d.desktop()
    cfg = d.read_json('C:/Users/hsyn/Desktop/ide_cikti/mustafa_selvi_statik/session.json')
    d.validate(cfg)
    d.foreground(cfg)
    
    # Maximize window
    d.U.ShowWindow(cfg['main'], 3)
    time.sleep(0.5)
    
    # Get window rect
    main_w = [w for w in d.windows(pid=cfg['identity']['pid']) if w['hwnd'] == cfg['main']][0]
    print(f"Main window rect after maximize: {main_w['rect']}")
    
    # The logo is at the top left of the ribbon bar
    # In maximized mode [-8, -8, ...], logo center is roughly at (25, 25)
    d.click(25, 25)
    time.sleep(0.5)
    
    windows = d.windows(pid=cfg['identity']['pid'])
    print(f"Windows after clicking logo at (25, 25): {len(windows)}")
    for w in windows:
        if w['hwnd'] != cfg['main'] and w['title'] != 'Koordinat Kutusu':
            print(f"  Popup window: hwnd={w['hwnd']}, title={repr(w['title'])}, class={w['class']}, rect={w['rect']}")
            for ch in d.children(w['hwnd']):
                print(f"    child: id={ch['controlId']}, title={repr(ch['title'])}, class={ch['class']}, rect={ch['rect']}")

if __name__ == '__main__':
    main()
