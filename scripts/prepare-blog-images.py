"""Prepare responsive delivery copies; retain original editorial photographs.

Run manually with Python and Pillow when adding a blog image. The Node build
uses the committed variants and manifest, so hosting needs no Python dependency.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1]
manifest = {}
for source in sorted((ROOT / 'images' / 'blog').glob('*')):
    if source.suffix.lower() not in ('.jpeg', '.jpg', '.png'):
        continue
    with Image.open(source) as image:
        original = ImageOps.exif_transpose(image).convert('RGB')
        variants = []
        for limit in (640, 720, 1200):
            copy = original.copy()
            copy.thumbnail((limit, 10000), Image.Resampling.LANCZOS)
            target = source.with_name(f'{source.stem}-{limit}.webp')
            copy.save(target, 'WEBP', quality=82, method=6)
            variants.append({'src': '/' + target.relative_to(ROOT).as_posix(), 'width': copy.width, 'height': copy.height, 'bytes': target.stat().st_size})
        manifest['/' + source.relative_to(ROOT).as_posix()] = {'width': original.width, 'height': original.height, 'originalBytes': source.stat().st_size, 'variants': variants}
(ROOT / 'data' / 'blog-image-variants.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Prepared three responsive sizes for {len(manifest)} article images.')
print(f'Original total: {sum(v["originalBytes"] for v in manifest.values()):,} bytes; 1200px total: {sum(v["variants"][-1]["bytes"] for v in manifest.values()):,} bytes.')
