"""Offline visual comparison of the exact synthetic inputs measured by the Deno benchmark.

python supabase/tests/png-codec-contact-sheet.py --sources-root <primary checkout>
  --artifacts artifacts/p33c1-codec
Requires Pillow; creates only comparison JPEGs inside the supplied artifacts directory.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument('--sources-root', required=True, type=Path)
parser.add_argument('--artifacts', required=True, type=Path)
args = parser.parse_args()
report = json.loads((args.artifacts / 'benchmark.json').read_text(encoding='utf-8'))
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 15)
rows = [c for c in report['cases'] if c['id'] != 'entropy']
for group in range(2):
    sheet = Image.new('RGB', (940, 3 * 490 + 44), '#faf6ef')
    draw = ImageDraw.Draw(sheet)
    for x, title in zip([10, 320, 630], ['Before: PNG 120 x 180', 'After: JPEG 600 x 900', 'Original PNG 1024 x 1536']):
        draw.text((x, 10), title, font=font, fill='#432e44')
    for index, case in enumerate(rows[group * 3:group * 3 + 3]):
        paths = [args.artifacts / case['legacy']['file'], args.artifacts / case['thumbnail']['file'],
                 args.sources_root / f"artifacts/p33b-results/{case['id']}-main.png"]
        expected_hashes = [case['legacy']['sha256'], case['thumbnail']['sha256'], case['sourceSha256']]
        for column, (path, digest) in enumerate(zip(paths, expected_hashes)):
            assert hashlib.sha256(path.read_bytes()).hexdigest() == digest
            with Image.open(path) as image:
                image.load()
                assert image.size == [(120, 180), (600, 900), (1024, 1536)][column]
                # All three are shown at a 300px wide preview; scale only for this sheet.
                image = image.convert('RGB').resize((300, 450), Image.Resampling.LANCZOS)
                sheet.paste(image, (10 + column * 310, 44 + index * 490))
            draw.text((10 + column * 310, 498 + index * 490), f"{case['id']} | {path.stat().st_size:,} B", font=small, fill='#432e44')
    path = args.artifacts / f'contact-sheet-{group + 1}.jpg'
    sheet.save(path, quality=95, optimize=True, subsampling=0)
    print(path.resolve())
