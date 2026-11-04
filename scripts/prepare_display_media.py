"""Create lightweight display copies; retain full-size web copies for lightboxes."""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]

def prepare():
    media = ROOT / 'public/media'
    dest = media / 'display'
    dest.mkdir(exist_ok=True)
    sources = [*sorted(media.glob('outdoor-??.webp')), media/'yema-portrait.webp', media/'hero-poster.jpg']
    rows = []
    for source in sources:
        output = dest / (source.stem + '.webp')
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert('RGB')
            image.thumbnail((1600, 1800), Image.Resampling.LANCZOS)
            image.save(output, 'WEBP', quality=82, method=6)
            rows.append({'source':source.name, 'display':output.name, 'before':source.stat().st_size,
                         'after':output.stat().st_size, 'size':list(image.size)})
    return rows

if __name__ == '__main__':
    rows = prepare()
    print(json.dumps({'files':len(rows), 'before':sum(x['before'] for x in rows),
                      'after':sum(x['after'] for x in rows), 'filesDetail':rows}, ensure_ascii=False))
