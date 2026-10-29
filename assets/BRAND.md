# Keystone and Christian Unionism brand guide

Everything a site, app or poster needs to look and sound like Keystone and Christian Unionism. All artwork was drawn with
**Vigil Sprite**, the music made with **Vigil Box**, and the typeface **Guild** was built for Keystone.
Every asset is regenerated from source by [tools/studio](../tools/studio/README.md), and each image has an
editable `.asprite.json` under [src/sprite/](src/sprite/).

## The idea

Keystone is a network of AI systems for the common good, and it carries the philosophy of Christian Unionism
(see [THE-CHRISTIAN-UNIONIST-MANIFESTO.md](../THE-CHRISTIAN-UNIONIST-MANIFESTO.md)). The look comes from three places:

- **Red and gold.** Red is for the workers and for solidarity, and it is always the main colour. Gold is for
  the common wealth, for tradition and for the dawn of plenty.
- **Civic architecture.** Arches, keystones and dressed stone, the language of public buildings meant to
  last for generations.
- **The pixel.** Pixel art and a pixel typeface are honest, cheap to reproduce and easy for anyone to remix,
  which suits a system built on open standards.

## The mark: the Keystone

![The Keystone](logo/keystone-mark-512.png)

A round arch of red stones held together by one gold keystone, with a gold sun rising through the opening.

- **The stones** are the people, faiths and regions of the nation. Each is different, and each bears weight.
- **The keystone** is the common good. Every stone leans on it, and it holds them all in place. Its small
  cream cross is the faith the common good is built on.
- **The rising sun** is the dawn of plenty that the nation is building toward.

| Variant | File | Use it for |
|---|---|---|
| Colour mark | `logo/keystone-mark-{1024,512}.png` | The default, on light or dark backgrounds |
| Badge, ink / cream / red | `logo/keystone-badge-{ink,cream,red}-1024.png` | Stickers, round avatars, buttons |
| Avatar | `logo/keystone-avatar-{1024,512}.png` | Profile pictures on Bluesky, X, Mastodon, GitHub, Discord |
| App icon | `logo/keystone-app-icon-{1024,512}.png` | App stores and home screens (a cream arch on red) |
| One colour | `logo/keystone-mark-mono-ink-*.png`, `logo/keystone-mark-knockout-cream-*.png` | Print, stamps, stencils, embroidery |

**Rules**

- Give the mark clear space of at least a quarter of its width on every side.
- Below 90 px the arch uses fewer stones and no joints, and at 16 px the sun drops away. The small sizes are
  drawn that way already, so use the favicon files rather than shrinking the big mark.
- Don't put the colour mark on a red background; use the app icon or red badge (a cream arch) instead.
- The keystone is always gold, in every colour version except the one-colour ones.
- Don't rotate, stretch or outline the arch, add gradients, or remove the keystone.
- When scaling pixel art in CSS, use `image-rendering: pixelated` so edges stay crisp.

## Wordmark and lockups

| File | Size | Use |
|---|---|---|
| `logo/keystone-wordmark-{red,ink,cream}-2048.png` | 2048×320 | The name alone, set in Guild Bold |
| `logo/keystone-lockup-light-2048.png` | 2048×640 | Mark, name and tagline, for light backgrounds |
| `logo/keystone-lockup-dark-2048.png` | 2048×640 | The same on ink |
| `logo/keystone-stacked-{light,dark}-1024.png` | 1024×1024 | Square lockup for posters and covers |

The name is written **KEYSTONE** in the wordmark and **Keystone** in running text. The philosophy is
**Christian Unionism**, and its followers are **Christian Unionists**. The tagline is
**Christian Unionism for all.** The motto is **The common good, built stone by stone.** The website is
**ChristianUnion.xyz**.

## Colour

| Token | Hex | Role |
|---|---|---|
| `--cw-red` | `#e3261c` | **Keystone Red.** The primary colour: buttons, links, the stones of the arch |
| `--cw-bright` | `#f2492f` | Hover states and lit faces |
| `--cw-blood` | `#a8151b` | Shaded faces, pressed states, red text on cream |
| `--cw-deep` | `#7d0f16` | Deep red panels, borders, the inner face of the arch |
| `--cw-wine` | `#4a0a0f` | Network lines and subtle dividers on ink |
| `--cw-gold` | `#f2b33d` | **Keystone Gold.** The keystone, the sun, taglines, highlights |
| `--cw-gold-light` | `#ffd36b` | Lit gold, the sun's core |
| `--cw-gold-deep` | `#b87a14` | Shaded gold; gold text on cream |
| `--cw-ink` | `#140708` | **Ink.** The dark background, a warm near-black |
| `--cw-night` | `#1f0b0d` | Raised surfaces on ink |
| `--cw-cream` | `#f6ebdd` | **Paper.** The light background and text on dark |
| `--cw-paper` | `#e8d8c3` | Secondary light surfaces |

Red leads, gold marks what matters most, and ink and cream carry the page. Body text is cream on ink or ink on
cream, and both pass WCAG AA by a wide margin. Gold text on ink is fine at any size. On cream, use
`--cw-gold-deep` for gold text and `--cw-blood` for red body text.

## Type

**Guild** is Keystone's own typeface: an original 5×7 pixel face named for the guilds (good work, honest
craft and shared standards). It comes in Regular and Bold, covers A–Z, a–z, 0–9, punctuation, Spanish
accents and ★, and is free under the SIL Open Font License. Files are in [font/](font/README.md), and
there's a specimen in `font/guild-specimen-2048x1152.png`.

- **Headings, navigation, labels, buttons, numbers:** Guild. Set it at multiples of 10 px (20, 30, 40, 50,
  70...) so every pixel lands on the screen grid.
- **Body text:** a highly readable open font such as
  [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible), designed for low vision.
  A system for the whole nation should be readable by all of it.

```css
@font-face { font-family: "Guild"; src: url("/fonts/Guild-Regular.woff") format("woff"), url("/fonts/Guild-Regular.ttf") format("truetype"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Guild"; src: url("/fonts/Guild-Bold.woff") format("woff"), url("/fonts/Guild-Bold.ttf") format("truetype"); font-weight: 700; font-display: swap; }

:root {
  --cw-red: #e3261c; --cw-bright: #f2492f; --cw-blood: #a8151b; --cw-deep: #7d0f16; --cw-wine: #4a0a0f;
  --cw-gold: #f2b33d; --cw-gold-light: #ffd36b; --cw-gold-deep: #b87a14;
  --cw-ink: #140708; --cw-night: #1f0b0d; --cw-cream: #f6ebdd; --cw-paper: #e8d8c3;
  --cw-display: "Guild", ui-monospace, monospace;
}
h1, h2, h3, nav, button, .label { font-family: var(--cw-display); -webkit-font-smoothing: none; }
img.pixel { image-rendering: pixelated; }
```

## Site art

| File | Size | Use |
|---|---|---|
| `site/hero-1920x1080.png`, `site/hero-3840x2160.png` | 16:9 | Home page hero: a network of people under a red-and-gold dawn. The centre is kept clear for a headline |
| `site/hero-portrait-1080x1920.png` | 9:16 | The same for phones |
| `site/pattern-network-tile-{256,512}.png` | square, seamless, transparent | Repeating background for sections on ink |
| `site/divider-masonry-2048x64.png` | strip | A course of red stones with gold keystones, to divide sections |
| `icons/skills/{connect,share,learn,decide,administer,alarm,remember}-{256,64}.png` | square | One icon for each of Keystone's skills: introductions, mutual aid, knowledge commons, collective decisions, administration, the alarm, and memory |

## Icons for the browser and phones

```html
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48.png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="theme-color" content="#e3261c">
<meta property="og:image" content="/social/og-image-1200x630.png">
```

Web app manifest icons: `icons/icon-192.png`, `icons/icon-512.png` and `icons/icon-512-maskable.png`
(`"purpose": "maskable"`).

## Social

| File | Size | Where |
|---|---|---|
| `social/bluesky-banner-3000x1000.png` | 3000×1000 | Bluesky header |
| `social/x-mastodon-header-1500x500.png` | 1500×500 | X / Twitter and Mastodon headers |
| `social/linkedin-banner-1584x396.png` | 1584×396 | LinkedIn |
| `social/youtube-channel-art-2560x1440.png` | 2560×1440 | YouTube (content sits inside the 1546×423 safe area) |
| `social/og-image-1200x630.png` | 1200×630 | Link previews on every platform |
| `logo/keystone-avatar-1024.png` | 1024×1024 | Profile picture everywhere |
| `social/facebook-cover-1640x624.png` | 1640×624 | Facebook cover |

Ready-made posts are in `social/posts/`: an introduction, the motto, the album announcement (square and Story)
and the track list (1080×1350). Every soundtrack track has its own art in `social/tracks/`: a 1024×1024 cover,
plus square, story and landscape frames that [tools/studio/video.swift](../tools/studio/video.swift) turns into
post videos with the song and a progress bar.

The banners keep the centre for the name and push the network to the edges, so profile pictures, which sit
bottom left on most platforms, never cover the content.

## Music

The official soundtrack, *Stone by Stone*, has thirteen rock tracks made with Vigil Box. MP3s, the cover and
the track list are in [music/](music/README.md). Every track also has its own cover and post-video frames in
`social/tracks/`. On the website, music plays only after a visitor chooses "Enter with sound"; never autoplay
sound without that choice.

## Voice

How Keystone writes is set out in [identity/voice.md](../identity/voice.md): neighbourly, plain, steady,
practical and honest, and respectful of faith and tradition. Keep site copy short. Lead with what people can
get done, and let the philosophy show in what Keystone does rather than in slogans.

## Licences

The original artwork, music, brand assets, typeface sources and code are offered under the
**Keystone License 1.0**. Existing CC BY-SA and OFL permissions remain valid; see
[LICENSING.md](../LICENSING.md) for scope and exceptions. Credit line: *Keystone, the system of the common
good. Art made with Vigil Sprite, music with Vigil Box.*
