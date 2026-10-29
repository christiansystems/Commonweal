#!/usr/bin/env python3
"""Local studio server for making Keystone's art and music with Vigil Sprite and Vigil Box.

Serves this folder at /studio/, the website at /site/, tools/font at /font/, assets/ at /assets/, and a checkout of the Vigil tools at /vendor/
(clones of github.com/danecohn/AmerikaSprite and github.com/danecohn/AmerikaBox),
and accepts POST /save/<path> to write a rendered file under the repository's assets/ folder.

    python3 tools/studio/server.py --vendor /path/to/vendor [--port 8790]
"""
import argparse
import http.server
import os
import posixpath
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
ASSETS = os.path.join(REPO, "assets")


def safe_join(root, rel):
    rel = posixpath.normpath(urllib.parse.unquote(rel)).lstrip("/")
    if rel.startswith("..") or "\0" in rel:
        return None
    path = os.path.join(root, rel)
    return path if os.path.abspath(path).startswith(os.path.abspath(root) + os.sep) else None


def make_handler(vendor):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def translate_path(self, path):
            path = urllib.parse.urlsplit(path).path
            routes = (("/studio/", HERE), ("/site/", os.path.join(REPO, "site")), ("/font/", os.path.join(REPO, "tools", "font")),
                      ("/assets-font/", os.path.join(ASSETS, "font")), ("/assets/", ASSETS), ("/vendor/", vendor))
            for prefix, root in routes:
                if path.startswith(prefix):
                    return safe_join(root, path[len(prefix):]) or os.devnull
            return os.devnull

        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            super().end_headers()

        def do_POST(self):
            path = urllib.parse.urlsplit(self.path).path
            target = safe_join(ASSETS, path[len("/save/"):]) if path.startswith("/save/") else None
            if not target:
                self.send_error(403, "only /save/<path inside assets/> is allowed")
                return
            data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "wb") as f:
                f.write(data)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true,"bytes":%d}' % len(data))

        def log_message(self, fmt, *args):
            pass

    return Handler


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--vendor", required=True, help="folder holding AmerikaSprite/ and AmerikaBox/")
    ap.add_argument("--port", type=int, default=8790)
    a = ap.parse_args()
    http.server.ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(os.path.abspath(a.vendor))).serve_forever()
