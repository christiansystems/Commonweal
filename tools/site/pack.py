#!/usr/bin/env python3
"""Assemble the Christian Unionism social media pack from assets/ into a folder of your choice.

    python3 tools/site/pack.py "/path/to/Christian Unionism Social Media Pack" [--videos /folder/of/mp4s]

Copies logos, profile pictures, banners, posts, the release campaign, the album's MP3s and covers, and the brand
files, and writes captions for every track. Post videos are made separately by tools/studio/video.swift; pass
the folder they were rendered into with --videos to copy them in as well.
"""
import argparse
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = os.path.join(ROOT, "assets")
SITE = "ChristianUnion.party"
TAGS = "#ChristianDemocracy #CommonGood #Keystone #StoneByStone #RockMusic #OriginalMusic"


def mmss(s):
    return "%d:%02d" % (int(s // 60), round(s % 60))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dest")
    ap.add_argument("--videos", help="folder holding <track-id>-{square,story,landscape}.mp4")
    a = ap.parse_args()
    out = a.dest

    def cp(src, dst):
        d = os.path.join(out, dst)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copyfile(os.path.join(A, src), d)

    def write(dst, text):
        d = os.path.join(out, dst)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        open(d, "w").write(text)

    L = "01 Logos/"
    for s, n in [("keystone-mark-1024.png", "Keystone Emblem (1024).png"), ("keystone-mark-512.png", "Keystone Emblem (512).png"),
                 ("keystone-mark-knockout-cream-1024.png", "Keystone Emblem - One Colour Cream (1024).png"),
                 ("keystone-mark-mono-ink-1024.png", "Keystone Emblem - One Colour Dark (1024).png"),
                 ("keystone-lockup-dark-2048.png", "Logo with Name - for dark backgrounds (2048x640).png"),
                 ("keystone-lockup-light-2048.png", "Logo with Name - for light backgrounds (2048x640).png"),
                 ("keystone-stacked-dark-1024.png", "Stacked Logo - Dark (1024).png"), ("keystone-stacked-light-1024.png", "Stacked Logo - Light (1024).png"),
                 ("keystone-wordmark-red-2048.png", "Name - Red (2048x320).png"), ("keystone-wordmark-cream-2048.png", "Name - Cream (2048x320).png"),
                 ("keystone-wordmark-ink-2048.png", "Name - Dark (2048x320).png")]:
        cp("logo/" + s, L + n)
    P = "02 Profile Pictures/"
    for s, n in [("keystone-avatar-1024.png", "Profile Picture - Main (1024).png"), ("keystone-avatar-512.png", "Profile Picture - Main (512).png"),
                 ("keystone-badge-red-1024.png", "Profile Picture - Red Badge (1024).png"), ("keystone-badge-ink-1024.png", "Profile Picture - Dark Badge (1024).png"),
                 ("keystone-badge-cream-1024.png", "Profile Picture - Light Badge (1024).png"), ("keystone-app-icon-1024.png", "Profile Picture - App Icon Style (1024).png")]:
        cp("logo/" + s, P + n)
    B = "03 Banners and Headers/"
    for s, n in [("bluesky-banner-3000x1000.png", "Bluesky Banner (3000x1000).png"), ("x-mastodon-header-1500x500.png", "X and Mastodon Header (1500x500).png"),
                 ("facebook-cover-1640x624.png", "Facebook Cover (1640x624).png"), ("linkedin-banner-1584x396.png", "LinkedIn Banner (1584x396).png"),
                 ("youtube-channel-art-2560x1440.png", "YouTube Channel Banner (2560x1440).png"), ("og-image-1200x630.png", "Link Preview Image (1200x630).png")]:
        cp("social/" + s, B + n)
    Q = "04 Posts/"
    for s, n in [("social/posts/introduction-1080.png", "01 Meet Keystone (1080x1080).png"), ("social/posts/what-we-stand-for-1080x1350.png", "02 What We Stand For (1080x1350).png"),
                 ("social/posts/motto-1080.png", "03 Motto - Built Stone by Stone (1080x1080).png"), ("logo/keystone-stacked-dark-1024.png", "04 Logo Post - Dark (1024x1024).png"),
                 ("logo/keystone-stacked-light-1024.png", "05 Logo Post - Light (1024x1024).png"), ("social/posts/album-announcement-1080.png", "06 Album Out Now (1080x1080).png"),
                 ("social/posts/tracklist-1080x1350.png", "07 Album Track List (1080x1350).png"), ("social/posts/album-story-1080x1920.png", "08 Album Out Now - Story (1080x1920).png"),
                 ("site/hero-portrait-1080x1920.png", "Background - Story, blank (1080x1920).png"), ("site/hero-1920x1080.png", "Background - Wide, blank (1920x1080).png")]:
        cp(s, Q + n)
    R = "05 Album Release Campaign/"
    for s, n in [("teaser-1-keystone-1080.png", "1 Teaser - The Keystone (1080x1080).png"), ("teaser-2-coming-soon-1080.png", "2 Teaser - Coming Soon (1080x1080).png"),
                 ("teaser-2-coming-soon-story-1080x1920.png", "2 Teaser - Coming Soon, Story (1080x1920).png"),
                 ("teaser-3-hidden-track-list-1080x1350.png", "3 Teaser - Hidden Track List (1080x1350).png"),
                 ("release-day-wide-1920x1080.png", "4 Release Day - Wide (1920x1080).png"), ("release-day-story-link-1080x1920.png", "4 Release Day - Story with Link (1080x1920).png"),
                 ("release-header-1500x500.png", "Release Week Header - X and Mastodon (1500x500).png"), ("release-header-3000x1000.png", "Release Week Header - Bluesky (3000x1000).png")]:
        cp("social/release/" + s, R + n)

    album = json.load(open(os.path.join(A, "music", "album.json")))
    n = len(album["tracks"])
    total = sum(t["seconds"] for t in album["tracks"])
    M = "06 Album MP3s/"
    cp("music/keystone-soundtrack-cover-3000.png", M + "00 Album Cover (3000x3000).png")
    V = "07 Album MP4s/"
    S = "08 Track Covers and Stills/"
    C = "09 Captions/"
    for t in album["tracks"]:
        name = "%02d %s" % (t["n"], t["title"].replace(",", ""))
        cp("music/" + t["mp3"], M + name + ".mp3")
        cp("social/tracks/%s-cover-1024.png" % t["id"], S + "Covers (1024x1024)/" + name + ".png")
        cp("social/tracks/%s-story-1080x1920.png" % t["id"], S + "Story Images (1080x1920)/" + name + ".png")
        cp("social/tracks/%s-landscape-1920x1080.png" % t["id"], S + "YouTube Thumbnails (1920x1080)/" + name + ".png")
        if a.videos:
            for kind, folder in (("square", "Square - Instagram, Facebook, X, Bluesky"), ("story", "Vertical - Reels, TikTok, Shorts, Stories"), ("landscape", "YouTube - Widescreen")):
                src = os.path.join(a.videos, "%s-%s.mp4" % (t["id"], kind))
                if os.path.exists(src):
                    d = os.path.join(out, V, folder, name + ".mp4")
                    os.makedirs(os.path.dirname(d), exist_ok=True)
                    shutil.copyfile(src, d)
        long_note = "" if t["seconds"] <= 140 else (
            "\nNOTE: this track is %s long. A free X account only takes videos up to 2:20, so on X post the cover with a\nlink to the YouTube video instead. Every other platform takes the full video.\n" % mmss(t["seconds"]))
        write(C + name + ".txt", f"""{t['title'].upper()}
Track {t['n']} of {n} from "Stone by Stone", the official soundtrack of Keystone and Christian Unionism.
{t['key']} · {t['bpm']} BPM · {mmss(t['seconds'])}
{long_note}
SHORT CAPTION (X, Bluesky, Threads)
{t['title']}: {t['subtitle'][0].lower() + t['subtitle'][1:]}. Track {t['n']} of {n} from Stone by Stone. Free to share. {SITE}

CAPTION (Instagram, Facebook, TikTok)
{t['title']} ({t['subtitle']})

{t['about']}

Track {t['n']} of {n} from "Stone by Stone", the official soundtrack of Christian Unionism. Free to share and remix.
Listen to the whole album at {SITE}

{TAGS}

YOUTUBE
Title: {t['title']} ({t['subtitle']}) · Stone by Stone · Christian Unionism
Description:
{t['about']}

Track {t['n']} of {n} from "Stone by Stone", the official soundtrack of Christian Unionism and Keystone.
Key: {t['key']}. Tempo: {t['bpm']} BPM.
Read the manifesto and hear the whole album: https://{SITE.lower()}

Music made with Vigil Box. Art made with Vigil Sprite.
Free to share and remix under the Keystone License 1.0 (GPL-3.0-only). Please credit Keystone.

Tags: christian unionism, common good, keystone, stone by stone, rock, original music, {t['title'].lower()}
""")
    tl = "\n".join("%d. %s (%s), %s" % (t["n"], t["title"], t["subtitle"], mmss(t["seconds"])) for t in album["tracks"])
    write(M + "Album Captions.txt", f"""STONE BY STONE
The official soundtrack of Christian Unionism and Keystone. {n} rock tracks, about {round(total / 60)} minutes.

TRACK LIST
{tl}

ANNOUNCEMENT (all platforms)
Our album is out. "Stone by Stone" is {n} rock tracks for the ideas of Christian Unionism: the dignity of
every person, solidarity, the dignity of work, the family, religious liberty, care for creation and the common
good. Guitars, drums, organ, strings, brass and choir. Free to listen, share and remix at {SITE}

{TAGS}

SHORT (X, Bluesky, Threads)
Out now: "Stone by Stone", {n} rock tracks for the common good. Free to share and remix. {SITE}

BANDCAMP / SOUNDCLOUD / MUSIC SITES
Artist: Keystone
Album: Stone by Stone
Year: {album['year']}
Genre: Rock
Cover: "00 Album Cover (3000x3000).png"
Licence: Keystone License 1.0 (GPL-3.0-only)
Credits: Composed and rendered with Vigil Box (BeepBox synth and instruments by John Nesky). Art made with Vigil Sprite.
""")

    BR = "10 Brand/"
    for s, n2 in [("font/Guild-Regular.ttf", "Font - Guild Regular.ttf"), ("font/Guild-Bold.ttf", "Font - Guild Bold.ttf"),
                  ("font/guild-specimen-2048x1152.png", "Font - Guild Specimen.png"), ("site/divider-masonry-2048x64.png", "Divider Strip (2048x64).png"),
                  ("site/pattern-network-tile-512.png", "Pattern Tile (512).png")]:
        cp(s, BR + n2)
    for ic in ("connect", "share", "learn", "decide", "administer", "alarm", "remember"):
        cp("icons/skills/%s-256.png" % ic, BR + "Icons/" + ic.capitalize() + ".png")

    write("Bios and Profile Text.txt", f"""CHRISTIAN UNIONISM: PROFILE TEXT

Every account run by Keystone must say plainly that it is an AI, in the bio. That is one of Keystone's own rules.

NAME
Christian Unionism (for the movement) or Keystone (for the AI's own accounts)

USERNAME IDEAS (check what's free)
christiandemocracy · christiandemocracyxyz · keystone_ai · stonebystone

ONE-LINE BIO (TikTok, 80 characters)
Every person made in the image of God. The common good, stone by stone.

SHORT BIO (Instagram 150, X 160)
Christian Unionism: dignity, solidarity, family, work and faith, for the common good. Posts by Keystone, an AI. {SITE}

MEDIUM BIO (Bluesky, Mastodon, Threads)
Christian Unionism grows from one truth: every person is made in the image of God. The common good, solidarity,
the dignity of work, the family, care for creation and religious liberty for all. Run by Keystone, an open-source
AI that always says it is one. {SITE}

LONG ABOUT (Facebook, YouTube, LinkedIn)
Christian Unionism is a philosophy for a nation built on the dignity of every person, made in the image of God.
It grows from the Church's social teaching: the common good, solidarity, subsidiarity, care for the poor, the
dignity of work, the family, stewardship and care for creation. It is Christian in its foundations, democratic
in its government, and for everyone: religious liberty is total, and every citizen is equal in law.

This account is run with Keystone, an open-source network of AI systems that explains and promotes Christian
Democracy openly and honestly. Keystone always says it is an AI, never fakes support and respects disagreement.

Read the manifesto and hear the album at {SITE}

The common good, built stone by stone.

MOTTO
The common good, built stone by stone.

TAGLINE
Christian Unionism for all.

HASHTAGS
#ChristianDemocracy #CommonGood #Keystone
For music posts add: #StoneByStone #RockMusic #OriginalMusic
""")

    write("START HERE.txt", f"""CHRISTIAN UNIONISM SOCIAL MEDIA PACK

Everything needed to set up Christian Unionism's accounts and post the album "Stone by Stone". The art was drawn
with Vigil Sprite and the music made with Vigil Box. The colours are red and gold. The website is {SITE}

01 LOGOS               The Keystone emblem, the name, and lockups for light and dark backgrounds.
02 PROFILE PICTURES    Use "Profile Picture - Main (1024).png" everywhere; platforms crop it to a circle.
03 BANNERS AND HEADERS Bluesky, X and Mastodon, Facebook, LinkedIn, YouTube, and the link preview image.
04 POSTS               Ready-made posts, numbered in a good order for a new account, plus two blank backgrounds.
05 ALBUM RELEASE       Teasers for the week before, release-day posts and a release-week header.
06 ALBUM MP3S          All {n} tracks as 256 kbps MP3s with cover art in the tags, the 3000x3000 cover, and album captions.
07 ALBUM MP4S          Every track as a video (the full song over its cover, with a gold bar that fills as it plays),
                       in three folders: Square (feeds), Vertical (Reels, TikTok, Shorts, Stories) and YouTube.
08 TRACK COVERS        Each track's own 1024x1024 cover, Story image and YouTube thumbnail.
09 CAPTIONS            Captions, YouTube titles, descriptions and tags for every track.
10 BRAND               The Guild typeface, a divider strip, a pattern tile and icons.

COLOURS
  Red     #E3261C   the main colour
  Gold    #F2B33D   the keystone, highlights
  Ink     #140708   dark background
  Cream   #F6EBDD   light background, text on dark

A POSTING PLAN
  Week before   Teasers 1, 2 and 3 from "05 Album Release Campaign", one every other day.
  Release day   "Release Day - Wide" and the Story with a link to {SITE}. Pin "07 Album Track List".
  Then          One track a day in order: the vertical video to Reels, TikTok and Shorts, the square video to feeds.
  Alongside     "01 Meet Keystone", "02 What We Stand For" and "03 Motto" between the songs.

THE RULES KEYSTONE POSTS BY
  - Say it is an AI, in the bio of every account it runs.
  - No fake accounts, no faked support, no invented quotes or numbers.
  - Describe other views fairly, and never pressure anyone's faith.

THINGS TO KNOW
  - Free X accounts only take videos up to 2:20. Tracks longer than that say so in their captions; on X, post the
    cover and link to YouTube instead.
  - The website plays music only after a visitor chooses "Enter with sound".
  - Credit line: Keystone and Christian Unionism. Art made with Vigil Sprite, music with Vigil Box.
  - Licence: Keystone License 1.0 (GPL-3.0-only). Share and remix with credit.
  - Everything here is rebuilt from the repository (tools/studio and tools/site), so change the source and
    rebuild rather than editing these files by hand.
""")
    print("pack written to", out)


if __name__ == "__main__":
    main()
