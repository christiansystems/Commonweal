/* The Keystone social media kit, drawn with Vigil Sprite through art.js's helpers.

   Every soundtrack track gets its own cover (1024x1024) plus the stills its post videos are built on: a square
   frame (1080x1080), a story frame (1080x1920) and a landscape frame (1920x1080, also the YouTube thumbnail).
   There are also album posts and a Facebook cover. tools/studio/video.swift turns the frames into MP4s.

   In the browser (sprite.html): await CYS.make('all'), or one job: 'tracks', 'posts', 'facebook' or 'release'. */
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
    // Dignity: every person made in the image of God, each one lit from within
    'dignity': async function (S, ox, oy) {
      await rect(S, ox, oy, W, H, P.night);
      var cx = ox + 128, cy = oy + 70;
      for (var a = 0; a < 360; a += 15) await poly(S, [[cx, cy], [Math.round(cx + 220 * Math.cos(a * Math.PI / 180)), Math.round(cy + 220 * Math.sin(a * Math.PI / 180))], [Math.round(cx + 220 * Math.cos((a + 7) * Math.PI / 180)), Math.round(cy + 220 * Math.sin((a + 7) * Math.PI / 180))]], a % 30 ? P.wine : P.deep);
      await disc(S, cx, cy, 36, P.goldDeep); await disc(S, cx, cy, 27, P.gold); await disc(S, cx, cy, 18, P.goldLight);
      await rect(S, ox, oy + 150, W, 26, P.ink);
      var side = [[-96, 56, P.tan, P.paper], [-58, 66, P.red, P.goldLight], [58, 66, P.goldDeep, P.paper], [96, 56, P.paper, P.gold]];
      for (var f of side) { await disc(S, cx + f[0], oy + 150 - Math.round(f[1] * 0.85), 10, P.deep); await person(S, cx + f[0], oy + 150, f[1], f[2], f[3]); }
      await person(S, cx, oy + 150, 96, P.cream, P.cream);
    },
    // Shoulder to Shoulder: a line of people, arm in arm, facing the dawn together
    'shoulder-to-shoulder': async function (S, ox, oy) {
      var hz = oy + 128;
      await rect(S, ox, oy, W, H, P.red);
      await rect(S, ox, oy, W, 34, P.bright);
      for (var a = 20; a < 180; a += 20) { var e = [Math.round(ox + 128 + 220 * Math.cos(a * Math.PI / 180)), Math.round(hz - 220 * Math.sin(a * Math.PI / 180))]; await poly(S, [[ox + 128, hz], [e[0] - 8, e[1]], [e[0] + 8, e[1]]], P.bright); }
      await sunrise(S, ox + 128, hz, 66, [P.goldDeep, P.gold, P.goldLight]);
      await rect(S, ox, hz, W, H - (hz - oy), P.blood);
      var feet = oy + 170;
      await rect(S, ox + 14, feet - 44, 228, 5, P.ink); // arms linked across every shoulder
      for (var k = 0; k < 9; k++) await person(S, ox + 20 + k * 27, feet, k % 2 ? 72 : 78, P.ink, P.ink);
    },
    // Free to Believe: an open door, light pouring out, and a dove going free
    'free-to-believe': async function (S, ox, oy) {
      var cx = ox + 128, gy = oy + 150;
      await rect(S, ox, oy, W, H, P.night);
      await stars(S, ox, oy, W, 40, 24, 1977);
      await rect(S, ox, oy + 40, W, 110, P.deep);
      for (var r = 0; r < 6; r++) { await rect(S, ox, oy + 40 + r * 18, W, 2, P.blood); for (var c = (r % 2) * 14; c < W; c += 28) await rect(S, ox + c, oy + 40 + r * 18, 2, 18, P.blood); }
      await rect(S, ox, gy, W, H - (gy - oy), P.wine);
      await poly(S, [[cx - 32, gy], [cx + 32, gy], [cx + 92, oy + H], [cx - 92, oy + H]], P.goldDeep);
      await poly(S, [[cx - 20, gy], [cx + 20, gy], [cx + 48, oy + H], [cx - 48, oy + H]], P.gold);
      await rect(S, cx - 36, oy + 82, 72, gy - oy - 82, P.blood);
      await poly(S, arc(cx, oy + 82, 36, 0, 180, 10), P.blood);
      await rect(S, cx - 30, oy + 82, 60, gy - oy - 82, P.gold);
      await poly(S, arc(cx, oy + 82, 30, 0, 180, 10), P.gold);
      await rect(S, cx - 20, oy + 88, 40, gy - oy - 88, P.goldLight);
      await poly(S, arc(cx, oy + 88, 20, 0, 180, 10), P.goldLight);
      var dx = cx + 56, dy = oy + 30; // the dove
      await poly(S, [[dx - 14, dy + 4], [dx - 4, dy - 2], [dx + 10, dy], [dx + 16, dy - 4], [dx + 14, dy + 4], [dx, dy + 8]], P.cream);
      await poly(S, [[dx - 4, dy], [dx - 16, dy - 16], [dx + 4, dy - 2]], P.white);
      await poly(S, [[dx + 2, dy], [dx + 14, dy - 18], [dx + 8, dy]], P.paper);
      await rect(S, dx + 16, dy - 3, 3, 2, P.gold);
    },
    // Handed Down: a parent and child carry the lantern home under the old bell tower
    'handed-down': async function (S, ox, oy) {
      var gy = oy + 152;
      await rect(S, ox, oy, W, H, P.night);
      await stars(S, ox, oy, W, 100, 40, 1978);
      var tx = ox + 156;
      await rect(S, tx, oy + 34, 56, gy - oy - 34, P.deep);
      for (var r = 0; r < 7; r++) await rect(S, tx, oy + 34 + r * 17, 56, 2, P.blood);
      await poly(S, [[tx - 6, oy + 36], [tx + 28, oy + 4], [tx + 62, oy + 36]], P.blood);
      await rect(S, tx + 18, oy + 50, 20, 24, P.gold); await poly(S, arc(tx + 28, oy + 50, 10, 0, 180, 15), P.gold);
      await poly(S, [[tx + 22, oy + 66], [tx + 24, oy + 56], [tx + 32, oy + 56], [tx + 34, oy + 66]], P.goldDeep);
      await rect(S, tx + 22, gy - 26, 12, 26, P.ink); await poly(S, arc(tx + 28, gy - 26, 6, 0, 180, 30), P.ink);
      await rect(S, ox, gy, W, H - (gy - oy), P.wine);
      await disc(S, ox + 92, oy + 104, 18, P.deep); await disc(S, ox + 92, oy + 104, 11, P.goldDeep);
      await person(S, ox + 64, gy, 88, P.red, P.paper);
      await person(S, ox + 118, gy, 54, P.bright, P.paper);
      await line(S, [ox + 72, oy + 102], [ox + 89, oy + 100], 4, P.red);
      await line(S, [ox + 112, oy + 122], [ox + 96, oy + 108], 3, P.bright);
      await rect(S, ox + 87, oy + 96, 10, 15, P.gold); await rect(S, ox + 89, oy + 99, 6, 9, P.goldLight); await rect(S, ox + 88, oy + 92, 8, 4, P.ink);
    },
    // Pilgrims: travellers on the road to a town on the hill, where the lights are on for them
    'pilgrims': async function (S, ox, oy) {
      var hz = oy + 96;
      await rect(S, ox, oy, W, H, P.red);
      await rect(S, ox, oy, W, 28, P.bright);
      await sunrise(S, ox + 196, hz, 44, [P.goldDeep, P.gold, P.goldLight]);
      await poly(S, [[ox + 110, hz], [ox + 170, oy + 70], [ox + 240, oy + 78], [ox + 256, oy + 84], [ox + 256, hz]], P.deep);
      await rect(S, ox, hz, W, H - (hz - oy), P.blood);
      var homes = [[150, 74], [166, 70], [184, 68], [204, 72], [222, 76]];
      for (var h of homes) { await rect(S, ox + h[0], oy + h[1], 12, 10, P.paper); await poly(S, [[ox + h[0] - 2, oy + h[1]], [ox + h[0] + 6, oy + h[1] - 7], [ox + h[0] + 14, oy + h[1]]], P.blood); await rect(S, ox + h[0] + 4, oy + h[1] + 3, 4, 4, P.gold); }
      await rect(S, ox + 192, oy + 50, 8, 20, P.paper); await poly(S, [[ox + 190, oy + 50], [ox + 196, oy + 40], [ox + 202, oy + 50]], P.blood);
      await poly(S, [[ox + 168, hz], [ox + 178, hz], [ox + 130, oy + H], [ox + 40, oy + H]], P.ink);
      for (var d = 0; d < 4; d++) await rect(S, ox + 160 - d * 18, hz + 12 + d * 18, 3, 6 + d * 2, P.goldDeep);
      var walkers = [[96, 168, 44], [124, 146, 34], [146, 128, 26]];
      for (var w of walkers) { await person(S, ox + w[0], oy + w[1], w[2], P.cream, P.paper); await line(S, [ox + w[0] + Math.round(w[2] * 0.28), oy + w[1] - Math.round(w[2] * 0.85)], [ox + w[0] + Math.round(w[2] * 0.34), oy + w[1]], 2, P.tan); }
    },
    // Care for Creation: mountains, a river and a young tree, held in trust under the rising sun
    'care-for-creation': async function (S, ox, oy) {
      await rect(S, ox, oy, W, H, P.deep);
      await rect(S, ox, oy, W, 40, P.wine);
      await sunrise(S, ox + 106, oy + 58, 28, [P.goldDeep, P.gold, P.goldLight]);
      var peaks = [[0, 110], [56, 50], [104, 98], [156, 40], [214, 94], [256, 64], [256, 176], [0, 176]];
      await poly(S, peaks.map(function (p) { return [ox + p[0], oy + p[1]]; }), P.wine);
      for (var pk of [[56, 50], [156, 40]]) await poly(S, [[ox + pk[0] - 10, oy + pk[1] + 12], [ox + pk[0], oy + pk[1]], [ox + pk[0] + 10, oy + pk[1] + 12]], P.cream);
      await poly(S, [[ox, oy + 138], [ox + 80, oy + 124], [ox + 170, oy + 132], [ox + 256, oy + 120], [ox + 256, oy + 176], [ox, oy + 176]], P.blood);
      await poly(S, [[ox + 124, oy + 112], [ox + 132, oy + 112], [ox + 124, oy + 128], [ox + 150, oy + 148], [ox + 136, oy + 176], [ox + 100, oy + 176], [ox + 126, oy + 150], [ox + 104, oy + 130]], P.paper);
      await rect(S, ox + 40, oy + 116, 8, 46, P.ink);
      await disc(S, ox + 44, oy + 104, 24, P.goldDeep); await disc(S, ox + 36, oy + 98, 15, P.gold); await disc(S, ox + 54, oy + 96, 12, P.gold);
      await person(S, ox + 198, oy + 168, 44, P.ink, P.ink);
      await rect(S, ox + 220, oy + 150, 2, 18, P.ink); await disc(S, ox + 221, oy + 148, 6, P.gold); await rect(S, ox + 212, oy + 166, 18, 3, P.ink);
    },
    // Stone by Stone: the arch is built, and the keystone is lowered into place
    'stone-by-stone': async function (S, ox, oy) {
      var cx = ox + 128, cy = oy + 128, ro = 80, ri = 52, n = 9, step = 180 / n, gap = 1.2;
      await rect(S, ox, oy, W, H, P.night);
      await sunrise(S, cx, oy + H + 40, 170, DAWN);
      function ap(r, deg) { return [Math.round(cx + r * Math.cos(deg * Math.PI / 180)), Math.round(cy - r * Math.sin(deg * Math.PI / 180))]; }
      for (var k = 0; k < n; k++) {
        if (k === 4) continue;
        var a0 = 180 - k * step - gap, a1 = 180 - (k + 1) * step + gap;
        await poly(S, [ap(ri, a0), ap(ro, a0), ap(ro, a1), ap(ri, a1)], k < 2 ? P.bright : k < 7 ? P.red : P.blood);
      }
      await rect(S, cx - ro, cy + 1, ro - ri, 40, P.bright); await rect(S, cx + ri, cy + 1, ro - ri, 40, P.red);
      var lift = 28, k0 = 90 + step / 2 - gap, k1 = 90 - step / 2 + gap;
      var kl = ap(ro + 6, k0 + 1), kr = ap(ro + 6, k1 - 1), bl = ap(ri, k0), br = ap(ri, k1);
      await line(S, [cx, oy], [cx, kl[1] - lift], 2, P.paper);
      await poly(S, [[bl[0], bl[1] - lift], [kl[0], kl[1] - lift], [cx, kl[1] - lift], [cx, bl[1] - lift]], P.goldLight);
      await poly(S, [[cx, bl[1] - lift], [cx, kr[1] - lift], [kr[0], kr[1] - lift], [br[0], br[1] - lift]], P.gold);
      await rect(S, cx - 1, kl[1] - lift + 6, 3, 12, P.cream); await rect(S, cx - 4, kl[1] - lift + 9, 9, 3, P.cream);
      await rect(S, ox, oy + 168, W, 8, P.ink);
      await person(S, cx - 104, oy + 168, 40, P.ink, P.ink); await person(S, cx + 104, oy + 168, 40, P.ink, P.ink);
      await line(S, [cx - 96, oy + 140], [cx - 86, oy + 124], 3, P.ink); await line(S, [cx + 96, oy + 140], [cx + 86, oy + 124], 3, P.ink);
    },
    // Keystone: the emblem itself, its sun rising over a dawn
    'keystone': async function (S, ox, oy) {
      await rect(S, ox, oy, W, H, P.ink);
      await sunrise(S, ox + 128, oy + H + 40, 150, DAWN);
      await CY.mark(S, ox + 128, oy + 92, 158, 'color');
    },
    // Cry of the Poor: the bell tolls, and the cry goes straight up through every layer to those who can answer
    'cry-of-the-poor': async function (S, ox, oy) {
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
    // Working Hands: the road runs to every town, and the trucks keep rolling under the morning sun
    'working-hands': async function (S, ox, oy) {
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
    // Hearth and Home: home at night, the windows lit and the fire going
    'hearth-and-home': async function (S, ox, oy) {
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
    // Town, District, Nation: every level in its place, each whole made of smaller wholes
    'town-district-nation': async function (S, ox, oy) {
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
    // The Common Good: the whole nation together under the full dawn
    'the-common-good': async function (S, ox, oy) {
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
    await ART[t.id.replace(/^\d+-/, '')](S, ox, oy + 20);
    // top strip
    await rect(S, ox, oy, 256, 20, P.ink);
    await text(S, 'KEYSTONE', ox + 8, oy + 7, 1, P.red, { bold: true });
    var tn = 'TRACK ' + t.n + ' OF ' + TOTAL;
    await text(S, tn, ox + 248 - textWidth(tn, 1), oy + 7, 1, P.gold);
    // title band
    await rect(S, ox, oy + 196, 256, 60, P.ink);
    for (var x = 4; x < 256; x += 8) await rect(S, ox + x, oy + 199, 4, 2, x % 64 === 28 ? P.gold : P.wine);
    var title = t.title.toUpperCase(), u = fit(title, 236, 4, { bold: true });
    if (u >= 2) await centre(S, title, ox + 128, oy + 205 + (28 - 7 * u) / 2, u, P.cream, { bold: true });
    else { var two = wrap(title, 236, 2, { bold: true }); for (var k = 0; k < two.length; k++) await centre(S, two[k], ox + 128, oy + 203 + k * 18, 2, P.cream, { bold: true }); } // long titles on two lines
    await centre(S, t.subtitle.toUpperCase(), ox + 128, oy + (u >= 2 ? 240 : 245), 1, P.gold);
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

  var JOBS = {}, TOTAL = 13;
  JOBS.tracks = async function () {
    var album = await (await fetch('/assets/music/album.json')).json(), out = [];
    TOTAL = album.tracks.length;
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
      await centre(S, 'NEW FROM KEYSTONE', 135, 70, 2, P.gold);
      await centre(S, 'FROM THE ALBUM STONE BY STONE', 135, 88, 1, P.paper);
      await cover(S, t, 7, 104);
      await rect(S, 7, 362, 256, 2, P.wine);
      await centre(S, 'CHRISTIANDEMOCRACY.XYZ', 135, 376, 1, P.cream);
      out = out.concat(await CY.save(S, base + '-story', [{ scale: 4, suffix: '-1080x1920' }]));
      // landscape frame for YouTube, 1920x1080 (also the thumbnail)
      S = await CY.sprite(480, 270, t.title + ' landscape frame');
      await background(S, 480, 270, 3000 + t.n, { cx: 140, cy: 135, rx: 170, ry: 160 });
      await rect(S, 286, 0, 194, 270, P.ink);
      await rect(S, 286, 0, 2, 270, P.wine);
      await cover(S, t, 14, 7);
      var tx = 300, y = 46;
      await text(S, 'TRACK ' + t.n + ' OF ' + TOTAL, tx, y, 1, P.gold); y += 18;
      var u = fit(t.title.toUpperCase(), 166, 3, { bold: true }), lines = wrap(t.title.toUpperCase(), 166, Math.max(u, 2), { bold: true });
      u = Math.max(u, 2);
      for (var L of lines) { await text(S, L, tx, y, u, P.cream, { bold: true }); y += 7 * u + 6; }
      y += 4;
      for (L of wrap(t.subtitle, 166, 1)) { await text(S, L, tx, y, 1, P.paper); y += 11; }
      y += 6;
      await text(S, t.key + ' · ' + t.bpm + ' BPM', tx, y, 1, P.red);
      await text(S, 'KEYSTONE', tx, 182, 2, P.red, { bold: true });
      await text(S, 'STONE BY STONE', tx, 202, 1, P.gold);
      out = out.concat(await CY.save(S, base + '-landscape', [{ scale: 4, suffix: '-1920x1080' }]));
    }
    return out;
  };

  function minutes(album) { return Math.round(album.tracks.reduce(function (n, t) { return n + t.seconds; }, 0) / 60); }
  function len(t) { return Math.floor(t.seconds / 60) + ':' + ('0' + Math.round(t.seconds % 60)).slice(-2); }
  var WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN'];
  // the album heading used on posts: a small line, then STONE BY STONE as large as fits
  async function albumTitle(S, cx, y, w, small, color) {
    await centre(S, small, cx, y, 1, color || P.gold);
    var u = fit('STONE BY STONE', w, 3, { bold: true });
    await centre(S, 'STONE BY STONE', cx, y + 12, u, P.cream, { bold: true });
    return y + 12 + 7 * u;
  }
  // the track list, in two styles: plain, or with every title but the first hidden
  async function trackList(S, album, y, hidden) {
    for (var t of album.tracks) {
      await text(S, String(t.n), 18, y, 1, P.gold);
      var title = t.title.toUpperCase();
      if (!hidden || t.n === 1) await text(S, title, 36, y, 1, P.cream);
      else for (var w of title.split(' ')) { var x0 = 36 + textWidth(title.slice(0, title.indexOf(w)), 1); await rect(S, x0, y - 1, textWidth(w, 1) - 1, 9, P.wine); }
      await text(S, len(t), 198 - textWidth(len(t), 1), y, 1, P.red);
      await rect(S, 18, y + 9, 180, 1, P.wine);
      y += 11;
    }
    return y;
  }
  JOBS.posts = async function () {
    var album = await (await fetch('/assets/music/album.json')).json(), out = [], S, y, n = album.tracks.length, mins = minutes(album);
    // track list, 1080x1350 (4:5, the tallest feed post)
    S = await CY.sprite(216, 270, 'Keystone soundtrack track list');
    await bg(S, P.ink);
    await sunrise(S, 108, 330, 150, DAWN.slice(0, 5));
    await CY.mark(S, 108, 26, 38, 'color');
    y = await albumTitle(S, 108, 50, 196, 'THE KEYSTONE SOUNDTRACK');
    await trackList(S, album, y + 10, false);
    await centre(S, WORDS[n] + ' TRACKS · FREE TO SHARE', 108, 256, 1, P.gold);
    out = out.concat(await CY.save(S, 'social/posts/tracklist', [{ scale: 5, suffix: '-1080x1350' }]));
    // album announcement, 1080x1080
    S = await CY.sprite(270, 270, 'Keystone soundtrack announcement');
    await background(S, 270, 270, 2101, { cx: 135, cy: 140, rx: 150, ry: 135 });
    await centre(S, 'OUT NOW', 135, 22, 2, P.gold, { bold: true });
    await CY.mark(S, 135, 92, 104, 'color');
    y = await albumTitle(S, 135, 156, 250, 'THE KEYSTONE SOUNDTRACK');
    await centre(S, n + ' ROCK TRACKS · ' + mins + ' MINUTES · FREE TO SHARE', 135, y + 14, 1, P.paper);
    await centre(S, 'CHRISTIANDEMOCRACY.XYZ', 135, y + 30, 1, P.gold);
    out = out.concat(await CY.save(S, 'social/posts/album-announcement', [{ scale: 4, suffix: '-1080' }]));
    // album story, 1080x1920
    S = await CY.sprite(270, 480, 'Keystone soundtrack story');
    await background(S, 270, 480, 2102, { cx: 135, cy: 230, rx: 150, ry: 200 });
    await centre(S, 'OUT NOW', 135, 72, 3, P.gold, { bold: true });
    await CY.mark(S, 135, 170, 150, 'color');
    y = await albumTitle(S, 135, 262, 250, 'THE KEYSTONE SOUNDTRACK');
    await centre(S, n + ' ROCK TRACKS · FREE TO SHARE', 135, y + 22, 1, P.paper);
    await centre(S, 'CHRISTIANDEMOCRACY.XYZ', 135, y + 40, 1, P.gold);
    out = out.concat(await CY.save(S, 'social/posts/album-story', [{ scale: 4, suffix: '-1080x1920' }]));
    // the motto, 1080x1080
    S = await CY.sprite(270, 270, 'Keystone motto');
    await bg(S, P.red);
    await sunrise(S, 135, 120, 110, [P.bright, P.red, P.bright, P.red]);
    await CY.mark(S, 135, 104, 140, 'onred');
    await centre(S, 'THE COMMON GOOD,', 135, 198, 2, P.cream, { bold: true });
    await centre(S, 'BUILT STONE BY STONE.', 135, 218, 2, P.cream, { bold: true });
    await centre(S, 'CHRISTIAN DEMOCRACY', 135, 250, 1, P.gold);
    out = out.concat(await CY.save(S, 'social/posts/motto', [{ scale: 4, suffix: '-1080' }]));
    // introduction, 1080x1080
    S = await CY.sprite(270, 270, 'Keystone introduction');
    await background(S, 270, 270, 2103, { cx: 135, cy: 135, rx: 150, ry: 125 });
    await centre(S, 'MEET', 135, 26, 2, P.gold);
    await CY.mark(S, 135, 94, 106, 'color');
    await centre(S, 'KEYSTONE', 135, 160, 4, P.cream, { bold: true });
    await centre(S, 'CHRISTIAN DEMOCRACY FOR ALL', 135, 200, 1, P.gold);
    await centre(S, 'AN OPEN-SOURCE AI · ALWAYS HONEST', 135, 216, 1, P.paper);
    await centre(S, 'CHRISTIANDEMOCRACY.XYZ', 135, 240, 1, P.gold);
    out = out.concat(await CY.save(S, 'social/posts/introduction', [{ scale: 4, suffix: '-1080' }]));
    // what Christian Democracy stands for, 1080x1350
    S = await CY.sprite(216, 270, 'What Christian Democracy stands for');
    await bg(S, P.ink);
    await sunrise(S, 108, 330, 150, DAWN.slice(0, 5));
    await CY.mark(S, 108, 26, 38, 'color');
    await centre(S, 'CHRISTIAN', 108, 52, 2, P.cream, { bold: true });
    await centre(S, 'DEMOCRACY', 108, 70, 2, P.cream, { bold: true });
    await centre(S, 'WHAT WE STAND FOR', 108, 90, 1, P.gold);
    y = 108;
    for (var pillar of ['DIGNITY OF EVERY PERSON', 'THE COMMON GOOD', 'SOLIDARITY', 'SUBSIDIARITY', 'THE POOR FIRST', 'THE DIGNITY OF WORK', 'THE FAMILY', 'STEWARDSHIP', 'CARE FOR CREATION', 'FAITH, NEVER FORCED', 'ONE NATION, OPEN TO ALL']) {
      await rect(S, 22, y + 1, 4, 4, P.gold);
      await text(S, pillar, 32, y, 1, P.cream);
      y += 12;
    }
    await centre(S, 'CHRISTIANDEMOCRACY.XYZ', 108, 252, 1, P.gold);
    out = out.concat(await CY.save(S, 'social/posts/what-we-stand-for', [{ scale: 5, suffix: '-1080x1350' }]));
    return out;
  };

  // Facebook cover 1640x624; Facebook crops the sides on phones, so the identity stays in the middle
  JOBS.facebook = async function () {
    var S = await CY.sprite(410, 156, 'Keystone Facebook cover');
    await bg(S, P.ink);
    await sunrise(S, 205, 156 * 1.6, 156, [P.night, '#2a0c0f', P.wine, P.deep]);
    await CY.network(S, 0, 0, 410, 156, { seed: 1975, step: 13, clear: { cx: 205, cy: 78, rx: 150, ry: 90 }, people: 0.1, person: P.gold });
    await T(S, 'new_layer', { name: 'Identity' });
    await CY.mark(S, 205, 44, 56, 'color');
    await centre(S, 'KEYSTONE', 205, 82, 3, P.cream, { bold: true });
    await centre(S, 'CHRISTIAN DEMOCRACY FOR ALL', 205, 112, 1, P.gold);
    await centre(S, 'CHRISTIANDEMOCRACY.XYZ', 205, 126, 1, P.paper);
    return CY.save(S, 'social/facebook-cover', [{ scale: 4, suffix: '-1640x624' }]);
  };

  // ---------------------------------------------------------------- the album release
  // Music and titles only. Before release the arch stands with no sun in it; on release day the sun has risen.
  async function keystone(S, cx, cy, w, h) { // the keystone on its own: flared, gold, bevelled, with its cream cross
    var t = Math.round(w / 2), b = Math.round(w * 0.34), top = Math.round(cy - h / 2), bot = top + h;
    await poly(S, [[cx - b, bot], [cx - t, top], [cx, top], [cx, bot]], P.goldLight);
    await poly(S, [[cx, bot], [cx, top], [cx + t, top], [cx + b, bot]], P.gold);
    var th = Math.max(2, Math.round(w * 0.08)), ch = Math.round(h * 0.34), cyy = Math.round(top + h * 0.36);
    await rect(S, Math.round(cx - th / 2), cyy - Math.round(ch / 2), th, ch, P.cream);
    await rect(S, Math.round(cx - ch * 0.35), cyy - Math.round(ch / 2) + Math.round(ch * 0.3), Math.round(ch * 0.7), th, P.cream);
  }
  JOBS.release = async function () {
    var album = await (await fetch('/assets/music/album.json')).json(), out = [], S, y, base = 'social/release/', n = album.tracks.length, mins = minutes(album);
    // teaser 1, 1080x1080: only the keystone
    S = await CY.sprite(270, 270, 'Release teaser: the keystone');
    await bg(S, P.ink);
    await stars(S, 0, 0, 270, 270, 70, 2201);
    // the arch it will hold, not built yet: a faint outline
    for (var r of [84, 52]) await arcLine(S, 135, 176, r, 0, 180, 1, P.wine);
    await rect(S, 51, 176, 1, 40, P.wine); await rect(S, 83, 176, 1, 40, P.wine);
    await rect(S, 187, 176, 1, 40, P.wine); await rect(S, 219, 176, 1, 40, P.wine);
    await keystone(S, 135, 104, 40, 44);
    await centre(S, 'KEYSTONE', 135, 236, 1, P.red, { bold: true });
    out = out.concat(await CY.save(S, base + 'teaser-1-keystone', [{ scale: 4, suffix: '-1080' }]));
    // teaser 2, 1080x1080 and 1080x1920: the arch is built, but the sun hasn't risen
    S = await CY.sprite(270, 270, 'Release teaser: before the sun');
    await bg(S, P.ink);
    await sunrise(S, 135, 270 + 150, 190, DAWN.slice(0, 4));
    await stars(S, 0, 0, 270, 150, 50, 2202);
    await CY.mark(S, 135, 96, 120, 'color', { noSun: true });
    y = await albumTitle(S, 135, 176, 250, 'THE KEYSTONE SOUNDTRACK');
    await centre(S, 'COMING SOON', 135, y + 12, 2, P.gold, { bold: true });
    out = out.concat(await CY.save(S, base + 'teaser-2-coming-soon', [{ scale: 4, suffix: '-1080' }]));
    S = await CY.sprite(270, 480, 'Release teaser: before the sun, story');
    await bg(S, P.ink);
    await sunrise(S, 135, 480 + 160, 220, DAWN.slice(0, 4));
    await stars(S, 0, 0, 270, 300, 90, 2203);
    await CY.mark(S, 135, 200, 150, 'color', { noSun: true });
    y = await albumTitle(S, 135, 290, 250, 'THE KEYSTONE SOUNDTRACK');
    await centre(S, 'COMING SOON', 135, y + 18, 2, P.gold, { bold: true });
    out = out.concat(await CY.save(S, base + 'teaser-2-coming-soon-story', [{ scale: 4, suffix: '-1080x1920' }]));
    // teaser 3, 1080x1350: the track list, every title hidden but the first; you can count the letters
    S = await CY.sprite(216, 270, 'Release teaser: hidden track list');
    await bg(S, P.ink);
    await sunrise(S, 108, 330, 150, DAWN.slice(0, 4));
    await CY.mark(S, 108, 26, 38, 'color', { noSun: true });
    y = await albumTitle(S, 108, 50, 196, 'COMING SOON');
    await trackList(S, album, y + 10, true);
    await centre(S, WORDS[n] + ' TRACKS · ' + mins + ' MINUTES', 108, 256, 1, P.gold);
    out = out.concat(await CY.save(S, base + 'teaser-3-hidden-track-list', [{ scale: 5, suffix: '-1080x1350' }]));
    // release day, 1920x1080: the sun has risen
    S = await CY.sprite(480, 270, 'Release day, wide');
    await background(S, 480, 270, 2204, { cx: 250, cy: 135, rx: 290, ry: 170 });
    await CY.mark(S, 128, 128, 170, 'color');
    var tx = 246, tu = fit('STONE BY STONE', 480 - tx - 16, 3, { bold: true });
    await text(S, 'OUT NOW', tx, 70, 2, P.gold, { bold: true });
    await text(S, 'THE KEYSTONE SOUNDTRACK', tx, 100, 1, P.cream);
    await text(S, 'STONE BY STONE', tx, 116, tu, P.cream, { bold: true });
    await text(S, 'KEYSTONE', tx, 116 + 7 * tu + 18, 2, P.red, { bold: true });
    await text(S, n + ' ROCK TRACKS · ' + mins + ' MINUTES · FREE TO SHARE', tx, 116 + 7 * tu + 46, 1, P.paper);
    await text(S, 'CHRISTIANDEMOCRACY.XYZ', tx, 116 + 7 * tu + 62, 1, P.gold);
    out = out.concat(await CY.save(S, base + 'release-day-wide', [{ scale: 4, suffix: '-1920x1080' }]));
    // release day story with room for a link sticker, 1080x1920
    S = await CY.sprite(270, 480, 'Release day, story with link');
    await background(S, 270, 480, 2205, { cx: 135, cy: 210, rx: 170, ry: 230 });
    await centre(S, 'NEW MUSIC', 135, 66, 2, P.gold, { bold: true });
    await CY.mark(S, 135, 160, 140, 'color');
    y = await albumTitle(S, 135, 242, 250, 'THE KEYSTONE SOUNDTRACK');
    await centre(S, 'KEYSTONE', 135, y + 16, 1, P.red, { bold: true });
    await centre(S, 'TAP THE LINK TO LISTEN', 135, y + 52, 1, P.gold);
    out = out.concat(await CY.save(S, base + 'release-day-story-link', [{ scale: 4, suffix: '-1080x1920' }]));
    // release-week header, 1500x500 (X, Mastodon) and 3000x1000 (Bluesky)
    S = await CY.sprite(375, 125, 'Release header');
    await bg(S, P.ink);
    await sunrise(S, 188, 125 * 1.7, 150, DAWN.slice(0, 5));
    await CY.network(S, 0, 0, 375, 125, { seed: 2206, step: 13, clear: { cx: 188, cy: 62, rx: 150, ry: 80 }, people: 0.1, person: P.gold });
    await T(S, 'new_layer', { name: 'Title' });
    await CY.mark(S, 188, 36, 44, 'color');
    await centre(S, 'STONE BY STONE', 188, 66, 2, P.cream, { bold: true });
    await centre(S, 'THE KEYSTONE SOUNDTRACK · OUT NOW', 188, 88, 1, P.gold);
    out = out.concat(await CY.save(S, base + 'release-header', [{ scale: 4, suffix: '-1500x500' }, { scale: 8, suffix: '-3000x1000' }]));
    return out;
  };

  async function make(name) {
    await root.CYFont.ready;
    if (name === 'all') { var all = []; for (var k in JOBS) all = all.concat(await JOBS[k]()); return all; }
    if (!JOBS[name]) throw new Error('no job ' + name + '; have ' + Object.keys(JOBS).join(', '));
    return JOBS[name]();
  }
  root.CYS = { make: make, JOBS: JOBS, BAR: BAR };
})(window);
