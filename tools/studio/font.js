/* Guild, Commonweal's pixel typeface, for drawing text into Vigil Sprite art.
   The glyphs live in tools/font/guild-glyphs.json, the same source the TTF/WOFF builder uses. */
(function (root) {
  'use strict';
  var data = null;
  var ready = fetch('/font/guild-glyphs.json').then(function (r) { return r.json(); }).then(function (j) { data = j; });
  function plain(ch) { var G = data.glyphs; return G[ch] || G[String(ch).toUpperCase()] || G['?']; }
  // Guild Bold: every stroke grows one pixel to the right (same rule as tools/font/build_font.py).
  function embolden(rows) { return rows.map(function (r) { var o = ''; for (var c = 0; c <= r.length; c++) o += r[c] === '#' || r[c - 1] === '#' ? '#' : ' '; return o; }); }
  var bold = false;
  function glyph(ch) { if (bold && data.boldOverrides && data.boldOverrides[ch]) return data.boldOverrides[ch]; var g = plain(ch); return bold ? embolden(g) : g; }
  /** Width in font units of a string, with `track` units between letters (default 1); isBold selects Guild Bold. */
  function width(str, track, isBold) {
    bold = !!isBold; track = track === undefined ? data.tracking : track;
    var w = 0; for (var i = 0; i < str.length; i++) w += glyph(str[i])[0].length + (i ? track : 0);
    return w;
  }
  /** Rectangles in pixels that draw `str` with its cap top at (x, y) and each font unit `u` pixels square. */
  function rects(str, x, y, u, track, isBold) {
    bold = !!isBold; track = track === undefined ? data.tracking : track;
    var out = [], cx = x;
    for (var i = 0; i < str.length; i++) {
      var g = glyph(str[i]);
      for (var r = 0; r < g.length; r++) {
        var row = g[r], c = 0;
        while (c < row.length) {
          if (row[c] !== '#') { c++; continue; }
          var c0 = c; while (c < row.length && row[c] === '#') c++;
          out.push({ x: cx + c0 * u, y: y + r * u, w: (c - c0) * u, h: u });
        }
      }
      cx += (g[0].length + track) * u;
    }
    return out;
  }
  root.CYFont = { ready: ready, width: width, rects: rects, HEIGHT: 7 };
})(window);
