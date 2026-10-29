#!/usr/bin/env python3
"""Build the media for ChristianDemocracy.xyz.

Copies the soundtrack, covers, logos, icons and the Guild font from assets/ into site/media/, writes the album's
track list as site/media/album.json, and turns THE-CHRISTIAN-DEMOCRATIC-MANIFESTO.md into an HTML fragment
(site/media/manifesto.html) for the site's reader. Uses only Python's standard library.

    python3 tools/site/build.py
"""
import html
import json
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS = os.path.join(ROOT, "assets")
MEDIA = os.path.join(ROOT, "site", "media")


def copy(src, dst):
    dst = os.path.join(MEDIA, dst)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(os.path.join(ASSETS, src), dst)


def inline(text):
    text = html.escape(text, quote=False)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", text)
    return text


def markdown(md):
    """Just enough Markdown for the manifesto: headings, paragraphs, lists, rules, bold, italics and links."""
    out, para, items, kind = [], [], [], None

    def flush():
        nonlocal para, items, kind
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
            para = []
        if items:
            out.append("<%s>%s</%s>" % (kind, "".join("<li>" + inline(i) + "</li>" for i in items), kind))
            items, kind = [], None

    for raw in md.splitlines():
        line = raw.rstrip()
        m = re.match(r"^(#{1,4}) (.*)$", line)
        if m:
            flush()
            level = len(m.group(1))
            slug = re.sub(r"[^a-z0-9]+", "-", m.group(2).lower()).strip("-")
            out.append('<h%d id="m-%s">%s</h%d>' % (level, slug, inline(m.group(2)), level))
        elif line.strip() == "---":
            flush()
            out.append("<hr>")
        elif re.match(r"^\s*[-*] ", line):
            if para or kind == "ol":
                flush()
            kind = "ul"
            items.append(re.sub(r"^\s*[-*] ", "", line))
        elif re.match(r"^\s*\d+\. ", line):
            if para or kind == "ul":
                flush()
            kind = "ol"
            items.append(re.sub(r"^\s*\d+\. ", "", line))
        elif not line.strip():
            flush()
        elif items and raw.startswith("  "):
            items[-1] += " " + line.strip()
        else:
            if items:
                flush()
            para.append(line.strip())
    flush()
    return "\n".join(out)


def main():
    album = json.load(open(os.path.join(ASSETS, "music", "album.json")))
    tracks = []
    for t in album["tracks"]:
        copy("music/" + t["mp3"], "music/%s.mp3" % t["id"])
        copy("social/tracks/%s-cover-1024.png" % t["id"], "covers/%s.png" % t["id"])
        tracks.append({k: t[k] for k in ("n", "id", "title", "subtitle", "about", "key", "bpm", "seconds")} |
                      {"src": "media/music/%s.mp3" % t["id"], "cover": "media/covers/%s.png" % t["id"]})
    copy("music/keystone-soundtrack-cover-600.png", "covers/album-600.png")
    copy("music/keystone-soundtrack-cover-3000.png", "covers/album-3000.png")
    for f in ("keystone-mark-512.png", "keystone-mark-1024.png", "keystone-avatar-512.png", "keystone-mark-knockout-cream-512.png"):
        copy("logo/" + f, "logo/" + f)
    for f in ("favicon-16.png", "favicon-32.png", "favicon-48.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-512-maskable.png"):
        copy("icons/" + f, "icons/" + f)
    for f in ("connect", "share", "learn", "decide", "administer", "alarm", "remember"):
        copy("icons/skills/%s-256.png" % f, "icons/skills/%s.png" % f)
    copy("social/og-image-1200x630.png", "og-image.png")
    for f in ("Guild-Regular.woff", "Guild-Bold.woff"):
        copy("font/" + f, "font/" + f)
    json.dump({"title": album["title"], "artist": album["artist"], "year": album["year"], "license": album["license"],
               "cover": "media/covers/album-600.png", "tracks": tracks},
              open(os.path.join(MEDIA, "album.json"), "w"), indent=1)
    md = open(os.path.join(ROOT, "THE-CHRISTIAN-DEMOCRATIC-MANIFESTO.md")).read()
    open(os.path.join(MEDIA, "manifesto.html"), "w").write(markdown(md) + "\n")
    print("site/media: %d tracks, manifesto %d KB" % (len(tracks), os.path.getsize(os.path.join(MEDIA, "manifesto.html")) // 1024))


if __name__ == "__main__":
    main()
