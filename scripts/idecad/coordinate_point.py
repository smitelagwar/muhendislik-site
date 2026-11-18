"""Enter one global X/Y point in an already active ideCAD drawing command.

Values use the current GUI input unit (verified as cm in the learning project).
The click point must be inside the observed plan work surface. No command launch.
"""
import argparse
import json
import math
import os
import re
import threading
import time
from pathlib import Path
import desktop as d


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--session', required=True)
    p.add_argument('--x', type=float, required=True)
    p.add_argument('--y', type=float, required=True)
    p.add_argument('--click-x', type=int, required=True)
    p.add_argument('--click-y', type=int, required=True)
    a = p.parse_args()
    cfg = d.read_json(a.session)
    d.validate(cfg)
    d.foreground(cfg)
    if (d.focus(cfg) or {}).get('class') == 'Edit':
        raise RuntimeError('Finish or cancel the pending Edit entry before starting a point')
    for axis, value, control in [('x', a.x, 12101), ('y', a.y, 12104)]:
        d.key(axis)
        deadline = time.monotonic()+2
        while True:
            focused = d.focus(cfg)
            if focused and focused['class'] == 'Edit' and focused['controlId'] == control:
                break
            if time.monotonic() > deadline:
                raise RuntimeError(f'{axis} shortcut did not focus coordinate Edit: {focused}')
            time.sleep(.05)
        # X/Y shortcuts open an empty coordinate entry, unlike a generic numeric Edit.
        if focused['title'].strip():
            raise RuntimeError(f'Coordinate entry is not empty: {focused}')
        d.type_text(str(value))
        deadline = time.monotonic()+3
        while True:
            actual = d.text(focused['hwnd'], True)
            try:
                matches = math.isclose(float(actual), value, abs_tol=.001)
            except ValueError:
                matches = False
            if matches:
                break
            if time.monotonic() > deadline:
                raise RuntimeError(f'Coordinate readback differs: {actual}, {value}')
            time.sleep(.05)
        d.key('enter')
        time.sleep(.15)
    state = d.observe(cfg)
    if state['target']['hwnd'] != cfg['main']:
        raise RuntimeError('Coordinate lock did not return to the plan window')
    # Do not allow an edited input field or an unexpected dialog to receive the click.
    if not state['focus'] or state['focus']['class'] in {'Edit', 'Button', 'ComboBox'}:
        raise RuntimeError('Expected drawing work surface focus')
    x, y = d.point(cfg, state['observation'], a.click_x, a.click_y)
    d.click(x, y)
    time.sleep(.25)
    final = d.observe(cfg)
    result = {'requested': [a.x, a.y], 'locked_observation': state['observation'],
              'result_observation': final['observation'], 'image': final['image']}
    with (Path(cfg['out_dir'])/'coordinate-actions.jsonl').open('a', encoding='utf-8') as f:
        f.write(json.dumps(result)+'\n')
    print(json.dumps(result))


if __name__ == '__main__':
    timer = threading.Timer(30, lambda: os._exit(124))
    timer.daemon = True
    timer.start()
    try:
        main()
    finally:
        timer.cancel()
