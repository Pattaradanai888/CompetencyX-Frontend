"""Build English UI subsets without changing glyph outlines or metrics.

Run with Python and fonttools[woff] installed. Originals and subsets retain
the SIL Open Font License in public/fonts/line-seed-sans-th/OFL.txt.
"""

from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


FONT_DIR = Path(__file__).resolve().parents[1] / 'public/fonts/line-seed-sans-th'

for weight in ('Rg', 'Bd', 'XBd'):
    source = FONT_DIR / f'LINESeedSansTH_W_{weight}.woff2'
    font = TTFont(source)
    original_cmap = font.getBestCmap()
    # Keep the Thai language-switch label in the English subset as well.
    codepoints = {c for c in original_cmap if not 0x0E00 <= c <= 0x0E7F}
    codepoints.update(map(ord, 'ไทย'))
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    assert set(font.getBestCmap()) == codepoints
    destination = FONT_DIR / f'line-seed-sans-th-{weight.lower()}-latin.woff2'
    font.save(destination)
    print(f'{destination.name}: {source.stat().st_size} -> {destination.stat().st_size} bytes')
