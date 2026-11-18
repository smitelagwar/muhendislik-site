import sys
import time
from pathlib import Path
from PIL import Image

sys.path.append(str(Path(__file__).parent))
import desktop as d

def main():
    d.desktop()
    cfg = d.read_json('C:/Users/hsyn/Desktop/ide_cikti/mustafa_selvi_statik/session.json')
    obs = d.observe(cfg)
    img_path = obs['image']
    img = Image.open(img_path)
    # Crop the menu [0, 22, 524, 784]
    crop = img.crop((0, 22, 524, 784))
    crop_path = 'C:/Users/hsyn/Desktop/ide_cikti/mustafa_selvi_statik/menu_crop.png'
    crop.save(crop_path)
    print("Menu cropped to:", crop_path)

if __name__ == '__main__':
    main()
