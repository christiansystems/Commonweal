# Keystone studio

This folder regenerates all of Keystone's art and music from source with VigilTech's tools:

- **Vigil Sprite** ([danecohn/AmerikaSprite](https://github.com/danecohn/AmerikaSprite)) draws every image.
  [art.js](art.js) calls Vigil Sprite's own tool API (`set_canvas`, `set_palette`, `draw_shape`, `draw_pixels`,
  `new_layer`, `export`...) and saves each PNG along with its editable `.asprite.json` document.
- **Vigil Box** ([danecohn/AmerikaBox](https://github.com/danecohn/AmerikaBox)) makes the soundtrack.
  [music.js](music.js) composes with Vigil Box's song tools (`new_song`, `set_instrument`, `generate_part`,
  `write_track`, `analyze_audio`), mixes each track against Vigil Box's own analysis, renders with its BeepBox
  synth, and encodes MP3 with its bundled LAME encoder.
  The band's sounds (guitars, basses, drum kit, organs, strings, brass, choir and bells) are BeepBox's own
  instruments, kept as settings in [../../assets/src/box/instruments.json](../../assets/src/box/instruments.json).
- **Guild**, Keystone's typeface, is drawn from [../font/guild-glyphs.json](../font/guild-glyphs.json), the same
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
   - the same page, then `await CYS.make('all')` for the social media kit ([social.js](social.js): track covers,
     video frames, posts and the Facebook cover)
   - <http://localhost:8790/studio/box.html>, then `await CYM.writeAlbum(await CYM.make('all'))` (or one
     track: `await CYM.make(3)`)
   - <http://localhost:8790/studio/review.html?f=logo/keystone-mark-512.png,...> shows any assets side by side

To make a track's post video from its frame and MP3 (macOS, no installs; the bar positions are `BAR` in social.js):

   ```bash
   swift tools/studio/video.swift assets/social/tracks/01-keystone-square-1080.png assets/music/mp3/01-keystone.mp3 keystone.mp4 28 1062 1024 8
   ```

The server writes only inside `assets/`. Rendered WAV masters go to `assets/music/wav/`, which git ignores
because of its size; regenerate them whenever you need them.

## Notes on the Vigil tools

- In the browser build of Vigil Sprite, `export.js` registers itself as `AS.exporter` while `tools.js` looks
  up `AS.export`, so the `export` tool fails. [sprite.html](sprite.html) adds the alias. The fix upstream is a
  one-word change in either file.
- Vigil Box instrument volume runs from 100 down to −40 (silent), in steps of about 1.4 dB per 10 near the top
  and steeper below −20. The auto-mixer in music.js accounts for that.
- BeepBox's older instrument presets use a few setting names Vigil Box rejects (`effects` as one string,
  `chord: harmony`, `transition: hard`). `assets/src/box/instruments.json` holds them already converted.

## The website

The site lives in [../../site/](../../site/). After changing the music, art or manifesto, rebuild its media and
assemble the social media pack:

```bash
python3 tools/site/build.py
```

```bash
python3 tools/site/pack.py "/path/to/Christian Democracy Social Media Pack" --videos /path/to/rendered/mp4s
```

With the studio server running, the site is at <http://localhost:8790/site/>.
