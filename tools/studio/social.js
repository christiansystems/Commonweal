/* The Commonweal social media kit, drawn with Vigil Sprite through art.js's helpers.

   Every soundtrack track gets its own cover (1024x1024) plus the stills its post videos are built on: a square
   frame (1080x1080), a story frame (1080x1920) and a landscape frame (1920x1080, also the YouTube thumbnail).
   There are also album posts and a Facebook cover. tools/studio/video.swift turns the frames into MP4s.

   In the browser (sprite.html): await CYS.make('all'), or one job: 'tracks', 'posts' or 'facebook'. */
(function (root) {
  'use strict';
  var CY = root.CY, P = CY.P, T = CY.T, rect = CY.rect, poly = CY.poly, disc = CY.disc, line = CY.line, text = CY.text, textWidth = CY.textWidth;
  var DAWN = [P.night, '#2a0c0f', P.wine, P.deep, P.blood, P.red, P.goldDeep, P.gold];

  async function bg(S, color) { await rect(S, 0, 0, S.doc.w, S.doc.h, color); }
  async function sunrise(S, cx, cy, r, colors) { for (var k = 0; k < colors.length; k++) await disc(S, cx, cy, r * (1 - k / colors.length), colors[k]); }
  function centre(S, str, cx, y, u, color, opts) { return text(S, str, Math.round(cx - textWidth(str, u, opts) / 2), Math.round(y), u, color, opts); }
  // the largest whole text size (font units) at which `str` fits in `w` pixels
  function fit(str, w, max, opts) { for (var u = max; u > 1; u--) if (textWidth(str, u, opts) <= w) return u; return 1; }
  // split words into lines no wider than w at size u
  function wrap(str, w, u, opts) {
    var lines = [], cur = '';
    str.split(' ').forEach(function (word) { var t = cur ? cur + ' ' + word : word; if (cur && textWidth(t, u, opts) > w) { lines.push(cur); cur = word; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  }
  function arc(cx, cy, r, a0, a1, stepDeg) { var pts = []; for (var a = a0; a <= a1 + 0.001; a += stepDeg || 6) pts.push([Math.round(cx + r * Math.cos(a * Math.PI / 180)), Math.round(cy - r * Math.sin(a * Math.PI / 180))]); return pts; }
  async function arcLine(S, cx, cy, r, a0, a1, th, color) { var p = arc(cx, cy, r, a0, a1, 5); for (var k = 1; k < p.length; k++) await line(S, p[k - 1], p[k], th, color); }
  async function person(S, x, y, h, body, head) { // a standing figure, feet at (x, y)
    var hr = Math.max(2, Math.round(h * 0.16));
    await poly(S, [[x - Math.round(h * 0.22), y], [x - Math.round(h * 0.14), y - Math.round(h * 0.62)], [x + Math.round(h * 0.14), y - Math.round(h * 0.62)], [x + Math.round(h * 0.22), y]], body);
    await disc(S, x, y - Math.round(h * 0.62) - hr - 1, hr, head);
  }
  async function stars(S, x0, y0, w, h, n, seed) { var r = CY.rng(seed); for (var k = 0; k < n; k++) await rect(S, x0 + Math.floor(r() * w), y0 + Math.floor(r() * h), r() < 0.2 ? 2 : 1, r() < 0.2 ? 2 : 1, r() < 0.3 ? P.goldLight : P.paper); }

  // ---------------------------------------------------------------- one picture per track, in the 256x172 art window at (ox, oy)
  // Each says what the track is about: see assets/music/README.md.
  var W = 256, H = 176;
  var ART = {
    // 1. Keystone: the emblem itself, its sun rising over a dawn
    1: async function (S, ox, oy) {
      await rect(S, ox, oy, W, H, P.ink);
      await sunrise(S, ox + 128, oy + H + 40, 150, DAWN);
      await CY.mark(S, ox + 128, oy + 92, 158, 'color');
    },
    // 2. Open Standard: identical sockets on one lattice, every part compatible
    2: async function (S, ox, oy) {
      await rect(S, ox, oy, W, H, P.ink);
      var cols = 5, rows = 4, gx = 44, gy = 38, x0 = ox + 128 - (cols - 1) * gx / 2, y0 = oy + 92 - (rows - 1) * gy / 2;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var x = x0 + c * gx, y = y0 + r * gy;
        if (c < cols - 1) await rect(S, x, y - 1, gx, 3, P.wine);
        if (r < rows - 1) await rect(S, x - 1, y, 3, gy, P.wine);
      }
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        x = x0 + c * gx; y = y0 + r * gy;
        var lit = r === 1 && c === 2;
        await rect(S, x - 13, y - 10, 26, 20, lit ? P.gold : P.red);
        await rect(S, x - 13, y - 10, 26, 3, lit ? P.goldLight : P.bright);
        await rect(S, x - 13, y + 7, 26, 3, lit ? P.goldDeep : P.blood);
        await rect(S, x - 7, y - 3, 3, 6, P.ink); await rect(S, x + 4, y - 3, 3, 6, P.ink);
      }
    },
    // 3. Early Warning: a run of readings, and the one rising too fast is caught and marked early
    3: async function (S, ox, oy) {
      await rect(S, ox, oy, W, H, P.night);
      for (var gy = oy + 22; gy < oy + H; gy += 22) await rect(S, ox, gy, W, 1, P.wine);
      var base = oy + 150, rand = CY.rng(1971), n = 19, bw = 8, pitch = 12, x0 = ox + 128 - (n * pitch - (pitch - bw)) / 2;
      for (var k = 0; k < n; k++) {
        var hgt = k === 13 ? 104 : k === 12 ? 62 : Math.round(26 + rand() * 30);
        await rect(S, x0 + k * pitch, base - hgt, bw, hgt, k === 13 ? P.gold : k > 13 ? P.deep : P.red);
        await rect(S, x0 + k * pitch, base - hgt, bw, 2, k === 13 ? P.goldLight : k > 13 ? P.blood : P.bright);
      }
      await rect(S, ox + 16, base, W - 32, 2, P.cream);
      var mx = x0 + 13 * pitch + bw / 2;
      await poly(S, [[mx - 9, oy + 20], [mx + 9, oy + 20], [mx, oy + 32]], P.gold);
      await rect(S, mx - 1, oy + 8, 3, 10, P.gold);
    },
    // 4. Algedonic Signal: the alarm bell rings, and its signal cuts straight up through every layer
    4: async function (S, ox, oy) {
      await rect(S, ox, oy, W, H, P.ink);
      for (var k = 0; k < 4; k++) { var ly = oy + 30 + k * 34; await rect(S, ox + 20, ly, 216, 3, k % 2 ? P.deep : P.wine); }
      var cx = ox + 128, by = oy + 128;
      await rect(S, cx - 3, oy + 10, 7, by - oy - 30, P.gold); await rect(S, cx - 3, oy + 10, 3, by - oy - 30, P.goldLight);
      await poly(S, [[cx - 14, oy + 22], [cx, oy + 4], [cx + 14, oy + 22]], P.gold);
      for (var r = 0; r < 3; r++) { await arcLine(S, cx, by - 18, 56 + r * 18, 205, 245, 4, r ? P.red : P.bright); await arcLine(S, cx, by - 18, 56 + r * 18, -65, -25, 4, r ? P.red : P.bright); }
      await poly(S, arc(cx, by - 26, 26, 0, 180, 10).concat([[cx - 30, by + 8], [cx + 30, by + 8]]), P.red);
      await poly(S, [[cx - 26, by - 26], [cx + 26, by - 26], [cx + 32, by + 8], [cx - 32, by + 8]], P.red);
      await poly(S, [[cx - 26, by - 26], [cx - 6, by - 26], [cx - 10, by + 8], [cx - 32, by + 8]], P.bright);
      await rect(S, cx - 36, by + 8, 72, 6, P.blood);
      await disc(S, cx, by + 18, 7, P.gold);
    },
    // 5. Supply Lines: the road runs to every town, and the trucks keep rolling under the morning sun
    5: async function (S, ox, oy) {
      var hz = oy + 92;
      await rect(S, ox, oy, W, H, P.red);
      await rect(S, ox, oy, W, 30, P.bright);
      await sunrise(S, ox + 128, hz, 54, [P.goldDeep, P.gold, P.goldLight]);
      await rect(S, ox, hz, W, H - (hz - oy), P.blood);
      await rect(S, ox, hz, W, 3, P.deep);
      for (var t = 0; t < 7; t++) { var tx = ox + 14 + t * 36 + (t > 2 ? 22 : 0); if (t === 3) continue; await rect(S, tx, hz - 10, 12, 10, P.deep); await poly(S, [[tx - 2, hz - 10], [tx + 6, hz - 17], [tx + 14, hz - 10]], P.deep); await rect(S, tx + 4, hz - 6, 3, 3, P.goldLight); }
      await poly(S, [[ox + 124, hz], [ox + 132, hz], [ox + 214, oy + H], [ox + 42, oy + H]], P.ink);
      for (var d = 0; d < 5; d++) { var y0 = hz + 8 + d * d * 3 + d * 6, h = 3 + d * 2; await rect(S, ox + 127, y0, 2 + Math.floor(d / 2), h, P.gold); }
      // a truck coming toward us, and one far off
      var ty = oy + 140;
      await rect(S, ox + 82, ty - 26, 34, 24, P.cream); await rect(S, ox + 82, ty - 26, 34, 4, P.white);
      await rect(S, ox + 118, ty - 18, 16, 16, P.gold); await rect(S, ox + 122, ty - 15, 8, 6, P.ink);
      await rect(S, ox + 80, ty - 3, 56, 2, P.blood);
      for (var wx of [ox + 92, ox + 108, ox + 126]) { await disc(S, wx, ty, 6, P.paper); await disc(S, wx, ty, 4, P.night); await disc(S, wx, ty, 2, P.tan); }
      await rect(S, ox + 130, hz + 8, 8, 6, P.cream); await rect(S, ox + 138, hz + 10, 3, 4, P.gold);
    },
    // 6. Hearth: home at night, the window lit and the fire going
    6: async function (S, ox, oy) {
      await rect(S, ox, oy, W, H, P.night);
      await stars(S, ox, oy, W, 90, 46, 1976);
      await disc(S, ox + 206, oy + 32, 13, P.goldLight); await disc(S, ox + 212, oy + 28, 11, P.night);
      var gy = oy + 150;
      await rect(S, ox, gy, W, H - (gy - oy), P.wine);
      var hx = ox + 64, hw = 128;
      await rect(S, hx + 92, oy + 54, 14, 40, P.blood);
      for (var s = 0; s < 3; s++) await disc(S, hx + 99 + s * 5, oy + 44 - s * 12, 4 + s, P.deep);
      await rect(S, hx, oy + 92, hw, gy - oy - 92, P.cream);
      await rect(S, hx + hw - 18, oy + 92, 18, gy - oy - 92, P.paper);
      await poly(S, [[hx - 12, oy + 94], [hx + hw / 2, oy + 50], [hx + hw + 12, oy + 94]], P.red);
      await poly(S, [[hx - 12, oy + 94], [hx + hw / 2, oy + 50], [hx + hw / 2, oy + 94]], P.bright);
      await rect(S, hx - 12, oy + 94, hw + 24, 4, P.blood);
      // two lit windows and an arched door
      for (var wx of [hx + 14, hx + 86]) { await rect(S, wx, oy + 106, 28, 22, P.gold); await rect(S, wx + 2, oy + 108, 24, 18, P.goldLight); await rect(S, wx + 13, oy + 106, 2, 22, P.goldDeep); await rect(S, wx, oy + 116, 28, 2, P.goldDeep); }
      await rect(S, hx + 52, oy + 118, 24, gy - oy - 118, P.blood);
      await poly(S, arc(hx + 64, oy + 118, 12, 0, 180, 15), P.blood);
      await rect(S, hx + 70, oy + 132, 2, 3, P.gold);
      await rect(S, hx - 30, gy, 28, 4, P.deep); await rect(S, hx + hw + 2, gy, 28, 4, P.deep);
    },
    // 7. Viable System: systems within systems, each whole made of smaller wholes
    7: async function (S, ox, oy) {
      await rect(S, ox, oy, W, H, P.ink);
      async function box(x, y, w, h, depth) {
        var c = [P.red, P.blood, P.deep][depth] || P.wine, th = depth ? 2 : 3;
        await rect(S, x, y, w, th, c); await rect(S, x, y + h - th, w, th, c); await rect(S, x, y, th, h, c); await rect(S, x + w - th, y, th, h, c);
        var top = Math.round(h * 0.26);
        await rect(S, x + w / 2 - Math.round(top * 0.45), y + Math.round(top * 0.25), Math.round(top * 0.9), Math.round(top * 0.5), depth ? P.goldDeep : P.gold); // its own management
        if (depth >= 2) return;
        var pad = Math.max(4, Math.round(w * 0.05)), n = 3, iw = Math.floor((w - pad * (n + 1)) / n), ih = h - top - pad * 2;
        for (var k = 0; k < n; k++) { var bx = x + pad + k * (iw + pad); await rect(S, bx + iw / 2 - 1, y + top - 2, 2, pad + 2, P.goldDeep); await box(bx, y + top + pad, iw, ih, depth + 1); }
      }
      await box(ox + 14, oy + 10, 228, 158, 0);
    },
    // 8. Commonweal: the whole nation together under the full dawn
    8: async function (S, ox, oy) {
      var hz = oy + 132;
      await rect(S, ox, oy, W, H, P.red);
      for (var a = 15; a < 180; a += 15) { var p1 = [ox + 128, hz], p2 = [Math.round(ox + 128 + 220 * Math.cos(a * Math.PI / 180)), Math.round(hz - 220 * Math.sin(a * Math.PI / 180))]; await poly(S, [p1, [p2[0] - 10, p2[1]], [p2[0] + 10, p2[1]]], P.bright); }
      await sunrise(S, ox + 128, hz, 76, [P.goldDeep, P.gold, P.goldLight]);
      await CY.mark(S, ox + 128, oy + 86, 130, 'onred', { noSun: true });
      await rect(S, ox, hz, W, H - (hz - oy), P.blood);
      var rand = CY.rng(1987);
      for (var row = 0; row < 2; row++) for (var x = ox + 8 + row * 9; x < ox + W; x += 18) {
        var h = 22 + Math.floor(rand() * 8) + row * 6, c = rand() < 0.25 ? P.gold : row ? P.cream : P.paper;
        await person(S, x, oy + H - (row ? 4 : 18), h, row ? P.ink : P.deep, c);
      }
    }
  };

  // ---------------------------------------------------------------- the cover: art window, title band, credits
  async function cover(S, t, ox, oy) {
    await T(S, 'new_layer', { name: t.title + ' cover' });
    await rect(S, ox, oy, 256, 256, P.ink);
    await ART[t.n](S, ox, oy + 20);
    // top strip
    await rect(S, ox, oy, 256, 20, P.ink);
    await text(S, 'COMMONWEAL', ox + 8, oy + 7, 1, P.red, { bold: true });
    var tn = 'TRACK ' + t.n + ' OF 8';
    await text(S, tn, ox + 248 - textWidth(tn, 1), oy + 7, 1, P.gold);
    // title band
    await rect(S, ox, oy + 196, 256, 60, P.ink);
    for (var x = 4; x < 256; x += 8) await rect(S, ox + x, oy + 199, 4, 2, x % 64 === 28 ? P.gold : P.wine);
    var title = t.title.toUpperCase(), u = fit(title, 236, 4, { bold: true });
    await centre(S, title, ox + 128, oy + 205 + (28 - 7 * u) / 2, u, P.cream, { bold: true });
    await centre(S, t.subtitle.toUpperCase(), ox + 128, oy + 240, 1, P.gold);
    // the art may run past the edge (suns, rays); clip this layer to the cover's square
    var w = S.doc.w, h = S.doc.h;
    if (oy > 0) await rect(S, 0, 0, w, oy, null);
    if (oy + 256 < h) await rect(S, 0, oy + 256, w, h - oy - 256, null);
    if (ox > 0) await rect(S, 0, oy, ox, 256, null);
    if (ox + 256 < w) await rect(S, ox + 256, oy, w - ox - 256, 256, null);
  }
  async function background(S, w, h, seed, clear) {
    await bg(S, P.ink);
    await sunrise(S, w / 2, h + w * 0.25, w * 0.75, DAWN.slice(0, 5));
    await CY.network(S, 0, 0, w, h, { seed: seed, step: 14, clear: clear, people: 0.1, person: P.gold });
  }

  // Frame layouts. video.swift draws the progress bar where BAR says, in final pixels (scale 4).
  var BAR = { square: [28, 1062, 1024, 8], story: [28, 1448, 1024, 8], landscape: [1200, 900, 664, 8] };

  var JOBS = {};
  JOBS.tracks = async function () {
    var album = await (await fetch('/assets/music/album.json')).json(), out = [];
    for (var t of album.tracks) {
      var base = 'social/tracks/' + t.id, S;
      // cover, 1024x1024
      S = await CY.sprite(256, 256, t.title + ' cover');
      await cover(S, t, 0, 0);
      out = out.concat(await CY.save(S, base + '-cover', [{ scale: 4, suffix: '-1024' }]));
      // square video frame, 1080x1080: the cover with a rim for the progress bar
      S = await CY.sprite(270, 270, t.title + ' square frame');
      await bg(S, P.ink);
      await cover(S, t, 7, 4);
      out = out.concat(await CY.save(S, base + '-square', [{ scale: 4, suffix: '-1080' }]));
      // story / reel / short frame, 1080x1920; the top and bottom are kept clear of the apps' buttons
      S = await CY.sprite(270, 480, t.title + ' story frame');
      await background(S, 270, 480, 2000 + t.n, { cx: 135, cy: 228, rx: 160, ry: 190 });
      await centre(S, 'NEW FROM COMMONWEAL', 135, 70, 2, P.gold);
      await centre(S, 'MUSIC FOR THE COMMON GOOD', 135, 88, 1, P.paper);
      await cover(S, t, 7, 104);
      await rect(S, 7, 362, 256, 2, P.wine);
      await centre(S, 'LISTEN TO THE WHOLE ALBUM', 135, 376, 1, P.cream);
      out = out.concat(await CY.save(S, base + '-story', [{ scale: 4, suffix: '-1080x1920' }]));
      // landscape frame for YouTube, 1920x1080 (also the thumbnail)
      S = await CY.sprite(480, 270, t.title + ' landscape frame');
      await background(S, 480, 270, 3000 + t.n, { cx: 140, cy: 135, rx: 170, ry: 160 });
      await rect(S, 286, 0, 194, 270, P.ink);
      await rect(S, 286, 0, 2, 270, P.wine);
      await cover(S, t, 14, 7);
      var tx = 300, y = 46;
      await text(S, 'TRACK ' + t.n + ' OF 8', tx, y, 1, P.gold); y += 18;
      var u = fit(t.title.toUpperCase(), 166, 3, { bold: true }), lines = wrap(t.title.toUpperCase(), 166, Math.max(u, 2), { bold: true });
      u = Math.max(u, 2);
      for (var L of lines) { await text(S, L, tx, y, u, P.cream, { bold: true }); y += 7 * u + 6; }
      y += 4;
      for (L of wrap(t.subtitle, 166, 1)) { await text(S, L, tx, y, 1, P.paper); y += 11; }
      y += 6;
      await text(S, t.key + ' · ' + t.bpm + ' BPM', tx, y, 1, P.red);
      await text(S, 'COMMONWEAL', tx, 182, 2, P.red, { bold: true });
      await text(S, 'MUSIC FOR THE COMMON GOOD', tx, 202, 1, P.gold);
      out = out.concat(await CY.save(S, base + '-landscape', [{ scale: 4, suffix: '-1920x1080' }]));
    }
    return out;
  };

  JOBS.posts = async function () {
    var album = await (await fetch('/assets/music/album.json')).json(), out = [], S, y;
    // track list, 1080x1350 (4:5, the tallest feed post)
    S = await CY.sprite(216, 270, 'Commonweal soundtrack track list');
    await bg(S, P.ink);
    await sunrise(S, 108, 330, 150, DAWN.slice(0, 5));
    await CY.mark(S, 108, 34, 46, 'color');
    await centre(S, 'MUSIC FOR THE', 108, 64, 1, P.gold);
    await centre(S, 'COMMON GOOD', 108, 76, 2, P.cream, { bold: true });
    await centre(S, 'THE OFFICIAL SOUNDTRACK', 108, 98, 1, P.paper);
    y = 120;
    for (var t of album.tracks) {
      await text(S, String(t.n), 24, y, 1, P.gold);
      await text(S, t.title.toUpperCase(), 36, y, 1, P.cream, { bold: true });
      var len = Math.floor(t.seconds / 60) + ':' + ('0' + Math.round(t.seconds % 60)).slice(-2);
      await text(S, len, 192 - textWidth(len, 1), y, 1, P.red);
      await rect(S, 24, y + 11, 168, 1, P.wine);
      y += 16;
    }
    await centre(S, 'EIGHT TRACKS · FREE TO SHARE', 108, 252, 1, P.gold);
    out = out.concat(await CY.save(S, 'social/posts/tracklist', [{ scale: 5, suffix: '-1080x1350' }]));
    // album announcement, 1080x1080
    S = await CY.sprite(270, 270, 'Commonweal soundtrack announcement');
    await background(S, 270, 270, 2101, { cx: 135, cy: 140, rx: 150, ry: 135 });
    await centre(S, 'OUT NOW', 135, 22, 2, P.gold);
    await CY.mark(S, 135, 92, 104, 'color');
    await centre(S, 'MUSIC FOR THE', 135, 156, 2, P.cream);
    await centre(S, 'COMMON GOOD', 135, 178, 3, P.cream, { bold: true });
    await centre(S, 'THE OFFICIAL SOUNDTRACK OF COMMONWEAL', 135, 220, 1, P.gold);
    await centre(S, '8 TRACKS · 16 MINUTES · FREE TO SHARE', 135, 236, 1, P.paper);
    out = out.concat(await CY.save(S, 'social/posts/album-announcement', [{ scale: 4, suffix: '-1080' }]));
    // album story, 1080x1920
    S = await CY.sprite(270, 480, 'Commonweal soundtrack story');
    await background(S, 270, 480, 2102, { cx: 135, cy: 230, rx: 150, ry: 200 });
    await centre(S, 'OUT NOW', 135, 72, 3, P.gold, { bold: true });
    await CY.mark(S, 135, 170, 150, 'color');
    await centre(S, 'MUSIC FOR THE', 135, 262, 2, P.cream);
    await centre(S, 'COMMON GOOD', 135, 284, 3, P.cream, { bold: true });
    await centre(S, 'THE OFFICIAL SOUNDTRACK', 135, 326, 1, P.gold);
    await centre(S, 'OF COMMONWEAL', 135, 338, 1, P.gold);
    await centre(S, '8 TRACKS · FREE TO SHARE', 135, 364, 1, P.paper);
    out = out.concat(await CY.save(S, 'social/posts/album-story', [{ scale: 4, suffix: '-1080x1920' }]));
    // the motto, 1080x1080
    S = await CY.sprite(270, 270, 'Commonweal motto');
    await bg(S, P.red);
    await sunrise(S, 135, 120, 110, [P.bright, P.red, P.bright, P.red]);
    await CY.mark(S, 135, 104, 140, 'onred');
    await centre(S, 'THE COMMON GOOD,', 135, 198, 2, P.cream, { bold: true });
    await centre(S, 'HELD IN COMMON.', 135, 218, 2, P.cream, { bold: true });
    await centre(S, 'COMMONWEAL', 135, 252, 1, P.gold);
    out = out.concat(await CY.save(S, 'social/posts/motto', [{ scale: 4, suffix: '-1080' }]));
    // hello / introduction, 1080x1080
    S = await CY.sprite(270, 270, 'Commonweal introduction');
    await background(S, 270, 270, 2103, { cx: 135, cy: 135, rx: 150, ry: 125 });
    await centre(S, 'MEET', 135, 30, 2, P.gold);
    await CY.mark(S, 135, 98, 110, 'color');
    await centre(S, 'COMMONWEAL', 135, 170, 3, P.cream, { bold: true });
    await centre(S, 'THE SYSTEM OF THE COMMON GOOD', 135, 208, 1, P.gold);
    await centre(S, 'OPEN SOURCE · ANSWERABLE TO THE PEOPLE', 135, 226, 1, P.paper);
    out = out.concat(await CY.save(S, 'social/posts/introduction', [{ scale: 4, suffix: '-1080' }]));
    return out;
  };

  // Facebook cover 1640x624; Facebook crops the sides on phones, so the identity stays in the middle
  JOBS.facebook = async function () {
    var S = await CY.sprite(410, 156, 'Commonweal Facebook cover');
    await bg(S, P.ink);
    await sunrise(S, 205, 156 * 1.6, 156, [P.night, '#2a0c0f', P.wine, P.deep]);
    await CY.network(S, 0, 0, 410, 156, { seed: 1975, step: 13, clear: { cx: 205, cy: 78, rx: 150, ry: 90 }, people: 0.1, person: P.gold });
    await T(S, 'new_layer', { name: 'Identity' });
    await CY.mark(S, 205, 44, 56, 'color');
    await centre(S, 'COMMONWEAL', 205, 82, 3, P.cream, { bold: true });
    await centre(S, 'THE SYSTEM OF THE COMMON GOOD', 205, 112, 1, P.gold);
    return CY.save(S, 'social/facebook-cover', [{ scale: 4, suffix: '-1640x624' }]);
  };

  async function make(name) {
    await root.CYFont.ready;
    if (name === 'all') { var all = []; for (var k in JOBS) all = all.concat(await JOBS[k]()); return all; }
    if (!JOBS[name]) throw new Error('no job ' + name + '; have ' + Object.keys(JOBS).join(', '));
    return JOBS[name]();
  }
  root.CYS = { make: make, JOBS: JOBS, BAR: BAR };
})(window);
