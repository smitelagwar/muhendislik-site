import sys
import time
from pathlib import Path

sys.path.append(str(Path(__file__).parent))
import desktop as d
import build_mustafa_selvi_project as b

def main():
    d.desktop()
    cfg = d.read_json(b.SESSION_PATH)
    d.foreground(cfg)
    time.sleep(0.3)
    d.key('esc')
    time.sleep(0.2)
    d.key('esc')
    time.sleep(0.2)
    
    print("Starting draw_beams_and_slabs...")
    b.draw_beams_and_slabs(cfg)
    print("Finished draw_beams_and_slabs successfully!")
    
    print("Starting copy_floors_and_raft...")
    b.copy_floors_and_raft(cfg)
    print("Finished copy_floors_and_raft successfully!")
    
    print("Finalizing and capturing observation...")
    b.finalize_and_observe(cfg)
    print("ALL DONE!")

if __name__ == '__main__':
    main()
