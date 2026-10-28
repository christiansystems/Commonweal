# Commonweal studio

This folder regenerates all of Commonweal's art and music from source with VigilTech's tools:

- **Vigil Sprite** ([danecohn/AmerikaSprite](https://github.com/danecohn/AmerikaSprite)) draws every image.
  [art.js](art.js) calls Vigil Sprite's own tool API (`set_canvas`, `set_palette`, `draw_shape`, `draw_pixels`,
  `new_layer`, `export`...) and saves each PNG along with its editable `.asprite.json` document.
- **Vigil Box** ([danecohn/AmerikaBox](https://github.com/danecohn/AmerikaBox)) makes the soundtrack.
  [music.js](music.js) composes with Vigil Box's song tools (`new_song`, `set_instrument`, `generate_part`,
  `write_track`, `analyze_audio`), mixes each track against Vigil Box's own analysis, renders with its BeepBox
  synth, and encodes MP3 with its bundled LAME encoder.
- **Guild**, Commonweal's typeface, is drawn from [../font/guild-glyphs.json](../font/guild-glyphs.json), the same
  source the font builder uses.

## Running it

1. Clone the two Vigil tools side by side in a folder of your choice:

   ```bash
   git clone https://github.com/danecohn/AmerikaSprite.git ~/vigil/AmerikaSprite
   ```

   ```bash
   git clone https://github.com/danecohn/AmerikaBox.git ~/vigil/AmerikaBox
   ```

2. Start the studio server from the repository root:

   ```bash
   python3 tools/studio/server.py --vendor ~/vigil
   ```

3. Open the pages in a browser and run the jobs from the developer console:

   - <http://localhost:8790/studio/sprite.html>, then `await CY.make('all')` (or one job: `marks`, `wordmarks`,
     `favicons`, `banners`, `site`, `icons`, `album`, `specimen`)
   - <http://localhost:8790/studio/box.html>, then `await CYM.writeAlbum(await CYM.make('all'))` (or one
     track: `await CYM.make(3)`)
   - <http://localhost:8790/studio/review.html?f=logo/commonweal-mark-512.png,...> shows any assets side by side

The server writes only inside `assets/`. Rendered WAV masters go to `assets/music/wav/`, which git ignores
because of its size; regenerate them whenever you need them.

## Notes on the Vigil tools

- In the browser build of Vigil Sprite, `export.js` registers itself as `AS.exporter` while `tools.js` looks
  up `AS.export`, so the `export` tool fails. [sprite.html](sprite.html) adds the alias. The fix upstream is a
  one-word change in either file.
- Vigil Box instrument volume runs from 100 down to −40 (silent), in steps of about 1.4 dB per 10 near the top
  and steeper below −20. The auto-mixer in music.js accounts for that.
