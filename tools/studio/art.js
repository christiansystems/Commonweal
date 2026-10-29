/* Keystone's art, drawn with Vigil Sprite's own engine and tools (AS.tools.run: set_canvas, draw_shape,
   draw_pixels, fill_region, new_layer, outline, export...). Every asset is saved twice: the PNG export and the
   editable .asprite.json document, so anyone can open and change it in Vigil Sprite.

   In the browser: await CY.make('mark') or await CY.make('all'). */
(function (root) {
  'use strict';
  var AS = root.AS, F = root.CYFont;

  // ---------------------------------------------------------------- palette (see assets/BRAND.md)
  var P = {
    ink: '#140708', night: '#1f0b0d', wine: '#4a0a0f', deep: '#7d0f16', blood: '#a8151b',
    red: '#e3261c', bright: '#f2492f', glow: '#ff7a52', cream: '#f6ebdd', paper: '#e8d8c3', tan: '#d9c4aa',
    gold: '#f2b33d', goldLight: '#ffd36b', goldDeep: '#b87a14', white: '#ffffff', black: '#000000'
  };
  var PALETTE = [P.ink, P.night, P.wine, P.deep, P.blood, P.red, P.bright, P.glow, P.tan, P.paper, P.cream, P.goldDeep, P.gold, P.goldLight];

  // ---------------------------------------------------------------- Vigil Sprite plumbing
  var io = {
    write: function (path, data) {
      return fetch('/save/' + path, { method: 'POST', body: data }).then(function (r) { if (!r.ok) throw new Error('save failed ' + path); return { path: path }; });
    }
  };
  function sprite(w, h, name) {
    var S = new AS.session.Session();
    S.doc.name = name;
    return T(S, 'set_canvas', { width: w, height: h, mode: 'rgba', clear: true })
      .then(function () { return T(S, 'set_palette', { colors: PALETTE }); })
      .then(function () { return S; });
  }
  function T(S, tool, input) { return AS.tools.run(S, tool, input, io); }
  async function save(S, base, scales) {
    var files = [];
    for (var k = 0; k < scales.length; k++) {
      var s = scales[k], path = base + (s.suffix || '') + '.png';
      await T(S, 'export', { format: 'png', path: path, scale: s.scale });
      files.push(path + ' (' + S.doc.w * s.scale + 'x' + S.doc.h * s.scale + ')');
    }
    await io.write('src/sprite/' + base.split('/').pop() + '.asprite.json', JSON.stringify(S.doc.toJSON()));
    return files;
  }

  // ---------------------------------------------------------------- geometry helpers
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function pt(cx, cy, r, deg) { var a = deg * Math.PI / 180; return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))]; }
  function disc(S, cx, cy, r, color, layer) { return T(S, 'draw_shape', { shape: 'ellipse', x0: Math.round(cx - r), y0: Math.round(cy - r), x1: Math.round(cx + r) - 1, y1: Math.round(cy + r) - 1, color: color, fill: true, layer: layer }); }
  function poly(S, pts, color, layer) { return T(S, 'draw_shape', { shape: 'polygon', points: pts, color: color, fill: true, layer: layer }); }
  function rect(S, x, y, w, h, color, layer) { return T(S, 'draw_pixels', { rects: [{ x: x, y: y, w: w, h: h, color: color }], layer: layer }); }
  async function line(S, a, b, th, color, layer) {
    // a thick line as a filled quad, so every thickness stays crisp
    var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * th / 2, ny = dx / L * th / 2;
    return poly(S, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]].map(function (p) { return [Math.round(p[0]), Math.round(p[1])]; }), color, layer);
  }
  function text(S, str, x, y, u, color, opts) {
    opts = opts || {};
    return T(S, 'draw_pixels', { rects: F.rects(str, x, y, u, opts.track, opts.bold).map(function (r) { r.color = color; return r; }), layer: opts.layer });
  }
  function textWidth(str, u, opts) { opts = opts || {}; return F.width(str, opts.track, opts.bold) * u; }

  // ---------------------------------------------------------------- the mark
  // The Keystone: a round arch of red stones (the people, faiths and regions of the nation) held together by
  // one gold keystone (the common good), with a gold sun rising through the opening (plenty for all).
  // The arch fills `size`; opts.badge draws a solid disc behind it.
  var SCHEMES = {
    color: { lit: P.bright, mid: P.red, shade: P.blood, soffit: P.deep, key: P.gold, keyLit: P.goldLight, keyShade: P.goldDeep, sun: P.gold, sunCore: P.goldLight },
    onred: { lit: P.white, mid: P.cream, shade: P.paper, soffit: P.tan, key: P.gold, keyLit: P.goldLight, keyShade: P.goldDeep, sun: P.gold, sunCore: P.goldLight },
    mono: { lit: P.ink, mid: P.ink, shade: P.ink, soffit: P.ink, key: P.ink, keyLit: P.ink, keyShade: P.ink, sun: P.ink, sunCore: P.ink },
    knockout: { lit: P.cream, mid: P.cream, shade: P.cream, soffit: P.cream, key: P.cream, keyLit: P.cream, keyShade: P.cream, sun: P.cream, sunCore: P.cream }
  };
  function ap(cx, cy, r, deg) { var a = deg * Math.PI / 180; return [Math.round(cx + r * Math.cos(a)), Math.round(cy - r * Math.sin(a))]; }
  async function mark(S, cx, cy, size, scheme, opts) {
    opts = opts || {};
    var c = SCHEMES[scheme || 'color'];
    if (opts.badge) { await disc(S, cx, cy, size / 2, opts.badge); size *= 0.74; }
    var small = size < 90, n = small ? 7 : 9, ro = size * 0.40, ri = size * (small ? 0.22 : 0.255), rm = ri + (ro - ri) * 0.42;
    var keyTop = size * 0.035, pierH = size * 0.27, plinth = size * 0.045;
    var oy = Math.round(cy - (ro + keyTop + pierH + plinth) / 2 + ro + keyTop); // springing line, centring the whole emblem
    var gap = small ? 0 : Math.max(1, size * 0.008) / ro * 180 / Math.PI;      // mortar joints, in degrees at the outer edge
    var step = 180 / n, mid = (n - 1) / 2;
    // the sun rising through the arch, behind everything
    if (!opts.noSun) {
      var gy = oy + pierH, half = function (r) { var pts = []; for (var a = 0; a <= 180; a += 6) pts.push(ap(cx, gy, r, a)); return pts; };
      await poly(S, half(ri * 0.74), c.sun); await poly(S, half(ri * 0.46), c.sunCore);
    }
    // voussoirs: lit from the upper left, each with a darker inner face (the soffit) for depth
    for (var k = 0; k < n; k++) {
      if (k === mid) continue;
      var a0 = 180 - k * step - gap / 2, a1 = 180 - (k + 1) * step + gap / 2, am = (a0 + a1) / 2;
      var d = Math.cos((am - 135) * Math.PI / 180), face = d > 0.45 ? c.lit : d > -0.2 ? c.mid : c.shade;
      await poly(S, [ap(cx, oy, rm, a0), ap(cx, oy, ro, a0), ap(cx, oy, ro, a1), ap(cx, oy, rm, a1)], face);
      await poly(S, [ap(cx, oy, ri, a0), ap(cx, oy, rm, a0), ap(cx, oy, rm, a1), ap(cx, oy, ri, a1)], c.soffit);
    }
    // the keystone: taller than the rest and flared, gold, bevelled
    var k0 = 90 + step / 2 - gap / 2, k1 = 90 - step / 2 + gap / 2, flare = step * 0.06;
    var kTopL = ap(cx, oy, ro + keyTop, k0 + flare), kTopR = ap(cx, oy, ro + keyTop, k1 - flare), kBotL = ap(cx, oy, ri, k0), kBotR = ap(cx, oy, ri, k1);
    var kMidTop = [cx, kTopL[1]], kMidBot = [cx, kBotL[1]];
    await poly(S, [kBotL, kTopL, kMidTop, kMidBot], c.keyLit);
    await poly(S, [kMidBot, kMidTop, kTopR, kBotR], c.key);
    await poly(S, [ap(cx, oy, ri, k0), ap(cx, oy, rm, k0), ap(cx, oy, rm, k1), ap(cx, oy, ri, k1)], c.keyShade);
    if (!small) { // a small cross at the heart of the keystone: the faith the common good is built on
      var ny = Math.round((kTopL[1] + ap(cx, oy, rm, 90)[1]) / 2), th = Math.max(2, Math.round(size * 0.014)), ch = Math.round(size * 0.062), cw = Math.round(size * 0.04), crossColor = c.sunCore === c.key ? c.key : P.cream;
      await rect(S, Math.round(cx - th / 2), Math.round(ny - ch / 2), th, ch, crossColor);
      await rect(S, Math.round(cx - cw / 2), Math.round(ny - ch / 2 + ch * 0.3 - th / 2), cw, th, crossColor);
    }
    // piers and plinths
    var pw = Math.round(ro - ri), lx = Math.round(cx - ro), rx = Math.round(cx + ri), py = oy, ph = Math.round(pierH);
    var jg = small ? 0 : Math.max(1, Math.round(size * 0.008));
    await rect(S, lx, py + jg, pw, ph - jg, c.lit); await rect(S, rx, py + jg, pw, ph - jg, c.mid);
    await rect(S, lx + pw - Math.round(pw * 0.3), py + jg, Math.round(pw * 0.3), ph - jg, c.mid);
    await rect(S, rx, py + jg, Math.round(pw * 0.3), ph - jg, c.shade);
    var pl = Math.round(plinth), ext = Math.round(size * 0.03);
    await rect(S, lx - ext, py + ph + jg, pw + ext * 2, pl, c.shade); await rect(S, rx - ext, py + ph + jg, pw + ext * 2, pl, c.shade);
  }

  // ---------------------------------------------------------------- the network field
  // Nodes (people) scattered by a seeded jittered grid, each linked to its nearest neighbours.
  // `clear` is an ellipse {cx, cy, rx, ry} kept empty for text; density thins towards it.
  async function network(S, x0, y0, w, h, o) {
    var rand = rng(o.seed || 1972), step = o.step || 14, nodes = [], lines = [];
    for (var gy = y0 - step; gy < y0 + h + step; gy += step) {
      for (var gx = x0 - step; gx < x0 + w + step; gx += step) {
        var x = Math.round(gx + rand() * step), y = Math.round(gy + rand() * step), keep = 1;
        if (o.clear) { var q = Math.pow((x - o.clear.cx) / o.clear.rx, 2) + Math.pow((y - o.clear.cy) / o.clear.ry, 2); keep = q < 1 ? 0 : Math.min(1, (q - 1) * 1.6); }
        if (o.fade) keep *= o.fade(x, y);
        if (rand() < keep) nodes.push([x, y]);
      }
    }
    nodes.forEach(function (a, i) {
      var near = nodes.map(function (b, j) { return [Math.hypot(a[0] - b[0], a[1] - b[1]), j]; }).filter(function (d) { return d[1] !== i; }).sort(function (p, q) { return p[0] - q[0]; });
      near.slice(0, o.links || 2).forEach(function (d) { if (d[0] < step * 2.2 && i < d[1] || near.indexOf(d) === 0) lines.push([a, nodes[d[1]]]); });
    });
    var L = await T(S, 'new_layer', { name: (o.name || 'Network') + ' links' });
    for (var k = 0; k < lines.length; k++) await T(S, 'draw_shape', { shape: 'line', x0: lines[k][0][0], y0: lines[k][0][1], x1: lines[k][1][0], y1: lines[k][1][1], color: o.link || P.wine });
    await T(S, 'new_layer', { name: (o.name || 'Network') + ' nodes' });
    for (k = 0; k < nodes.length; k++) {
      var n = nodes[k], roll = rand();
      if (roll < (o.people || 0.12)) { await rect(S, n[0] - 1, n[1] - 1, 3, 3, o.person || P.cream); }
      else await rect(S, n[0] - 1, n[1] - 1, 2, 2, roll < 0.55 ? (o.node || P.red) : (o.node2 || P.blood));
    }
    return { nodes: nodes.length, links: lines.length };
  }
  // Concentric bands of a rising sun, for the constructivist horizon.
  async function sunrise(S, cx, cy, r, colors) {
    for (var k = 0; k < colors.length; k++) await disc(S, cx, cy, r * (1 - k / colors.length), colors[k]);
  }
  function centreText(S, str, cy, u, color, opts, cx) {
    var w = textWidth(str, u, opts);
    return text(S, str, Math.round((cx === undefined ? S.doc.w / 2 : cx) - w / 2), Math.round(cy), u, color, opts);
  }
  async function bg(S, color) { await rect(S, 0, 0, S.doc.w, S.doc.h, color); }

  // ---------------------------------------------------------------- assets
  var NAME = 'KEYSTONE', TAGLINE = 'AN AI FOR THE COMMON GOOD';
  var DAWN = [P.night, '#2a0c0f', P.wine, P.deep, P.blood, P.red, P.goldDeep, P.gold];
  var JOBS = {};

  // Logos ------------------------------------------------------------
  JOBS.marks = async function () {
    var out = [], S;
    for (var v of [['keystone-mark', 'color'], ['keystone-mark-mono-ink', 'mono'], ['keystone-mark-knockout-cream', 'knockout']]) {
      S = await sprite(512, 512, 'Keystone mark (' + v[1] + ')');
      await mark(S, 256, 256, 500, v[1]);
      out = out.concat(await save(S, 'logo/' + v[0], [{ scale: 2, suffix: '-1024' }, { scale: 1, suffix: '-512' }]));
    }
    for (var b of [['keystone-badge-ink', P.ink], ['keystone-badge-cream', P.cream]]) {
      S = await sprite(512, 512, 'Keystone badge');
      await mark(S, 256, 256, 512, 'color', { badge: b[1] });
      out = out.concat(await save(S, 'logo/' + b[0], [{ scale: 2, suffix: '-1024' }]));
    }
    S = await sprite(512, 512, 'Keystone badge (red)');
    await mark(S, 256, 256, 512, 'onred', { badge: P.red });
    out = out.concat(await save(S, 'logo/keystone-badge-red', [{ scale: 2, suffix: '-1024' }]));
    // full-bleed squares for avatars and app icons (platforms crop them to a circle or rounded square)
    S = await sprite(512, 512, 'Keystone avatar');
    await bg(S, P.ink); await mark(S, 256, 256, 400, 'color');
    out = out.concat(await save(S, 'logo/keystone-avatar', [{ scale: 2, suffix: '-1024' }, { scale: 1, suffix: '-512' }]));
    S = await sprite(512, 512, 'Keystone app icon');
    await bg(S, P.red); await mark(S, 256, 256, 400, 'onred');
    out = out.concat(await save(S, 'logo/keystone-app-icon', [{ scale: 2, suffix: '-1024' }, { scale: 1, suffix: '-512' }]));
    return out;
  };

  JOBS.wordmarks = async function () {
    var out = [], S;
    for (var v of [['keystone-wordmark-red', P.red], ['keystone-wordmark-ink', P.ink], ['keystone-wordmark-cream', P.cream]]) {
      S = await sprite(512, 80, 'Keystone wordmark');
      await centreText(S, NAME, 15, 7, v[1], { bold: true });
      out = out.concat(await save(S, 'logo/' + v[0], [{ scale: 4, suffix: '-2048' }]));
    }
    // horizontal lockup: mark + wordmark + tagline
    for (var l of [['keystone-lockup-light', P.ink, P.blood, null], ['keystone-lockup-dark', P.cream, P.gold, P.ink]]) {
      S = await sprite(512, 160, 'Keystone lockup');
      if (l[3]) await bg(S, l[3]);
      await mark(S, 66, 80, 124, 'color');
      await text(S, NAME, 138, 50, 5, l[1], { bold: true });
      await text(S, TAGLINE, 140, 100, 2, l[2]);
      out = out.concat(await save(S, 'logo/' + l[0], [{ scale: 4, suffix: '-2048' }]));
    }
    // stacked lockup, square
    for (var st of [['keystone-stacked-light', P.ink, P.blood, null], ['keystone-stacked-dark', P.cream, P.gold, P.ink]]) {
      S = await sprite(512, 512, 'Keystone stacked lockup');
      if (st[3]) await bg(S, st[3]);
      await mark(S, 256, 196, 320, 'color');
      await centreText(S, NAME, 366, 7, st[1], { bold: true });
      await centreText(S, TAGLINE, 436, 3, st[2]);
      out = out.concat(await save(S, 'logo/' + st[0], [{ scale: 2, suffix: '-1024' }]));
    }
    return out;
  };

  JOBS.favicons = async function () {
    var out = [], S;
    for (var f of [[16, 'favicon-16'], [32, 'favicon-32'], [48, 'favicon-48']]) {
      S = await sprite(f[0], f[0], 'Keystone ' + f[1]);
      await mark(S, f[0] / 2, f[0] / 2, f[0], 'color', { noSun: f[0] < 32 });
      out = out.concat(await save(S, 'icons/' + f[1], [{ scale: 1 }]));
    }
    for (var a of [[180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']]) {
      S = await sprite(a[0], a[0], 'Keystone ' + a[1]);
      await bg(S, P.red); await mark(S, a[0] / 2, a[0] / 2, a[0] * 0.8, 'onred');
      out = out.concat(await save(S, 'icons/' + a[1], [{ scale: 1 }]));
    }
    // maskable PWA icon: content inside the central 80% safe zone
    S = await sprite(512, 512, 'Keystone maskable icon');
    await bg(S, P.red); await mark(S, 256, 256, 340, 'onred');
    out = out.concat(await save(S, 'icons/icon-512-maskable', [{ scale: 1 }]));
    return out;
  };

  // Social -------------------------------------------------------------
  async function bannerArt(S, w, h, seed) {
    await bg(S, P.ink);
    await sunrise(S, w / 2, h * 1.6, h * 1.0, [P.night, '#2a0c0f', P.wine, P.deep]);
    await network(S, 0, 0, w, h, { seed: seed, step: 13, clear: { cx: w / 2, cy: h * 0.5, rx: w * 0.42, ry: h * 0.58 }, people: 0.1, person: P.gold });
  }
  JOBS.banners = async function () {
    var out = [], S;
    // Bluesky 3000x1000; X / Twitter and Mastodon 1500x500 (same 3:1 art). Avatars sit bottom left, so the centre carries the content.
    S = await sprite(300, 100, 'Keystone social banner 3:1');
    await bannerArt(S, 300, 100, 1971);
    await T(S, 'new_layer', { name: 'Identity' });
    await mark(S, 150, 28, 50, 'color');
    await centreText(S, NAME, 58, 3, P.cream, { bold: true });
    await centreText(S, TAGLINE, 84, 1, P.gold);
    out = out.concat(await save(S, 'social/bluesky-banner', [{ scale: 10, suffix: '-3000x1000' }]));
    out = out.concat(await save(S, 'social/x-mastodon-header', [{ scale: 5, suffix: '-1500x500' }]));
    // LinkedIn 1584x396 (4:1)
    S = await sprite(396, 99, 'Keystone LinkedIn banner');
    await bannerArt(S, 396, 99, 1973);
    await T(S, 'new_layer', { name: 'Identity' });
    var gx = Math.round((396 - (64 + 10 + textWidth(NAME, 3, { bold: true }))) / 2);
    await mark(S, gx + 32, 50, 64, 'color');
    await text(S, NAME, gx + 74, 34, 3, P.cream, { bold: true });
    await text(S, TAGLINE, gx + 75, 62, 1, P.gold);
    out = out.concat(await save(S, 'social/linkedin-banner', [{ scale: 4, suffix: '-1584x396' }]));
    // Open Graph / link preview 1200x630
    S = await sprite(240, 126, 'Keystone Open Graph image');
    await bannerArt(S, 240, 126, 1972);
    await T(S, 'new_layer', { name: 'Identity' });
    await mark(S, 120, 38, 60, 'color');
    await centreText(S, NAME, 76, 3, P.cream, { bold: true });
    await centreText(S, TAGLINE, 103, 1, P.gold);
    out = out.concat(await save(S, 'social/og-image', [{ scale: 5, suffix: '-1200x630' }]));
    // YouTube channel art 2560x1440, content in the 1546x423 safe area
    S = await sprite(512, 288, 'Keystone YouTube channel art');
    await bannerArt(S, 512, 288, 1974);
    await T(S, 'new_layer', { name: 'Identity' });
    gx = Math.round((512 - (70 + 12 + textWidth(NAME, 3, { bold: true }))) / 2);
    await mark(S, gx + 35, 144, 70, 'color');
    await text(S, NAME, gx + 82, 128, 3, P.cream, { bold: true });
    await text(S, TAGLINE, gx + 83, 155, 1, P.gold);
    out = out.concat(await save(S, 'social/youtube-channel-art', [{ scale: 5, suffix: '-2560x1440' }]));
    return out;
  };

  // Site ---------------------------------------------------------------
  JOBS.site = async function () {
    var out = [], S;
    // hero backgrounds, no text (the site sets its own headline over the clear centre): a network of people over a dawn
    S = await sprite(384, 216, 'Keystone hero');
    await bg(S, P.ink);
    await sunrise(S, 192, 300, 200, DAWN);
    await network(S, 0, 0, 384, 216, { seed: 1970, step: 15, clear: { cx: 192, cy: 96, rx: 130, ry: 70 }, people: 0.1, person: P.gold, fade: function (x, y) { return y > 150 ? 0.25 : 1; } });
    out = out.concat(await save(S, 'site/hero', [{ scale: 5, suffix: '-1920x1080' }, { scale: 10, suffix: '-3840x2160' }]));
    S = await sprite(216, 384, 'Keystone hero (portrait)');
    await bg(S, P.ink);
    await sunrise(S, 108, 470, 190, DAWN);
    await network(S, 0, 0, 216, 384, { seed: 1969, step: 15, clear: { cx: 108, cy: 150, rx: 80, ry: 90 }, people: 0.1, person: P.gold, fade: function (x, y) { return y > 300 ? 0.25 : 1; } });
    out = out.concat(await save(S, 'site/hero-portrait', [{ scale: 5, suffix: '-1080x1920' }]));
    // seamless network tile for section backgrounds
    S = await sprite(64, 64, 'Keystone network tile');
    await tile(S, 64, 7);
    out = out.concat(await save(S, 'site/pattern-network-tile', [{ scale: 4, suffix: '-256' }, { scale: 8, suffix: '-512' }]));
    // divider strip: a course of red stones with a gold keystone every few
    S = await sprite(256, 8, 'Keystone masonry divider');
    await bg(S, P.ink);
    for (var x = 0, k = 0; x < 256; x += 16, k++) await rect(S, x + 1, 1, 14, 6, k % 4 === 2 ? P.gold : (k % 2 ? P.red : P.blood));
    out = out.concat(await save(S, 'site/divider-masonry', [{ scale: 8, suffix: '-2048x64' }]));
    return out;
  };
  async function tile(S, n, seed) {
    var rand = rng(seed), nodes = [], step = 16;
    for (var gy = 0; gy < n; gy += step) for (var gx = 0; gx < n; gx += step) nodes.push([gx + 2 + Math.floor(rand() * (step - 4)), gy + 2 + Math.floor(rand() * (step - 4))]);
    await T(S, 'new_layer', { name: 'links' });
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i], best = [];
      for (var j = 0; j < nodes.length; j++) for (var ox = -n; ox <= n; ox += n) for (var oy = -n; oy <= n; oy += n) {
        if (i === j && !ox && !oy) continue;
        var b = [nodes[j][0] + ox, nodes[j][1] + oy]; best.push([Math.hypot(a[0] - b[0], a[1] - b[1]), b]);
      }
      best.sort(function (p, q) { return p[0] - q[0]; });
      for (var k = 0; k < 2; k++) for (var wx = -n; wx <= n; wx += n) for (var wy = -n; wy <= n; wy += n)
        await T(S, 'draw_shape', { shape: 'line', x0: a[0] + wx, y0: a[1] + wy, x1: best[k][1][0] + wx, y1: best[k][1][1] + wy, color: P.wine });
    }
    await T(S, 'new_layer', { name: 'nodes' });
    for (i = 0; i < nodes.length; i++) await rect(S, nodes[i][0] - 1, nodes[i][1] - 1, i % 5 ? 2 : 3, i % 5 ? 2 : 3, i % 5 ? P.blood : P.gold);
  }

  // Icons for Keystone's seven skills, on a 64 grid ---------------------------------------
  var ICONS = {
    connect: async function (S) { // three people joined
      var a = [14, 46], b = [50, 46], c = [32, 16];
      await line(S, a, b, 4, P.red); await line(S, a, c, 4, P.red); await line(S, b, c, 4, P.red);
      for (var p of [a, b, c]) { await disc(S, p[0], p[1], 10, P.red); await disc(S, p[0], p[1], 5, P.cream); }
    },
    share: async function (S) { // give and receive: two arrows in a loop
      await T(S, 'draw_shape', { shape: 'ellipse', x0: 8, y0: 8, x1: 55, y1: 55, color: P.red, fill: true });
      await T(S, 'draw_shape', { shape: 'ellipse', x0: 16, y0: 16, x1: 47, y1: 47, color: null, fill: true });
      await rect(S, 0, 26, 64, 12, null); await rect(S, 26, 0, 12, 64, null);
      await poly(S, [[48, 14], [58, 24], [46, 28]], P.red); await poly(S, [[16, 50], [6, 40], [18, 36]], P.red);
      await poly(S, [[14, 16], [24, 6], [28, 18]], P.red); await poly(S, [[50, 48], [40, 58], [36, 46]], P.red);
      await disc(S, 32, 32, 7, P.gold);
    },
    learn: async function (S) { // an open book
      await poly(S, [[4, 16], [30, 20], [30, 56], [4, 50]], P.red); await poly(S, [[60, 16], [34, 20], [34, 56], [60, 50]], P.blood);
      for (var y = 26; y <= 42; y += 8) { await line(S, [9, y], [25, y + 3], 2, P.cream); await line(S, [39, y + 3], [55, y], 2, P.cream); }
      await rect(S, 30, 18, 4, 40, P.gold);
    },
    decide: async function (S) { // a ballot going into a box
      await rect(S, 22, 4, 20, 26, P.cream); await rect(S, 26, 10, 12, 2, P.blood); await rect(S, 26, 16, 8, 2, P.blood);
      await rect(S, 6, 28, 52, 30, P.red); await rect(S, 6, 28, 52, 6, P.bright); await rect(S, 18, 30, 28, 3, P.ink);
      await rect(S, 6, 52, 52, 6, P.blood);
    },
    administer: async function (S) { // a decision on record, under seal
      await rect(S, 12, 4, 36, 48, P.cream); await rect(S, 44, 4, 4, 48, P.paper);
      for (var y = 12; y <= 32; y += 7) await rect(S, 18, y, y === 32 ? 14 : 24, 3, P.blood);
      await poly(S, [[36, 46], [42, 62], [46, 54], [50, 62], [50, 46]], P.red);
      await disc(S, 44, 44, 11, P.goldDeep); await disc(S, 44, 44, 9, P.gold); await disc(S, 44, 44, 4, P.goldLight);
    },
    alarm: async function (S) { // the algedonic signal
      await poly(S, [[32, 4], [61, 58], [3, 58]], P.red); await poly(S, [[32, 12], [52, 52], [12, 52]], P.bright);
      await rect(S, 28, 22, 8, 18, P.cream); await rect(S, 28, 44, 8, 6, P.cream);
    },
    remember: async function (S) { // the shared memory: stacked records
      for (var k = 0; k < 3; k++) { var y = 40 - k * 14; await poly(S, [[6, y + 8], [32, y], [58, y + 8], [32, y + 16]], [P.blood, P.red, P.bright][k]); }
      await disc(S, 32, 16, 4, P.gold);
    }
  };
  JOBS.icons = async function () {
    var out = [];
    for (var name in ICONS) {
      var S = await sprite(64, 64, 'Keystone icon: ' + name);
      await ICONS[name](S);
      out = out.concat(await save(S, 'icons/skills/' + name, [{ scale: 4, suffix: '-256' }, { scale: 1, suffix: '-64' }]));
    }
    return out;
  };

  // Album cover --------------------------------------------------------
  JOBS.album = async function () {
    var S = await sprite(300, 300, 'Keystone soundtrack cover'), out = [];
    await bg(S, P.ink);
    // a red dawn and a rising sun behind the arch
    await sunrise(S, 150, 232, 170, [P.night, P.wine, P.deep, P.blood, P.red, P.bright]);
    for (var a = 12; a < 180; a += 12) { var e = pt(150, 232, 210, -a); await poly(S, [[150, 232], [e[0] - 4, e[1]], [e[0] + 4, e[1]]], a % 24 ? P.deep : P.blood); }
    await disc(S, 150, 232, 62, P.goldDeep); await disc(S, 150, 232, 50, P.gold); await disc(S, 150, 232, 34, P.goldLight);
    await mark(S, 150, 138, 190, 'color', { noSun: true });
    await rect(S, 0, 236, 300, 64, P.ink);
    for (var x2 = 4; x2 < 300; x2 += 8) await rect(S, x2, 239, 4, 2, x2 % 64 === 36 ? P.gold : P.wine);
    var u = textWidth('STONE BY STONE', 4, { bold: true }) <= 284 ? 4 : 3;
    await centreText(S, 'STONE BY STONE', 248 + (28 - 7 * u) / 2, u, P.cream, { bold: true });
    await centreText(S, 'THE KEYSTONE SOUNDTRACK', 284, 1, P.gold);
    await text(S, NAME, 10, 10, 1, P.red, { bold: true });
    await text(S, 'THIRTEEN TRACKS', 290 - textWidth('THIRTEEN TRACKS', 1), 10, 1, P.gold);
    out = out.concat(await save(S, 'music/keystone-soundtrack-cover', [{ scale: 10, suffix: '-3000' }, { scale: 2, suffix: '-600' }]));
    return out;
  };

  // The Christian Union Party: the same Keystone emblem with the party's name -----------
  JOBS.party = async function () {
    var out = [], S, P1 = 'CHRISTIAN UNION', P2 = 'PARTY';
    for (var l of [['christian-union-lockup-light', P.ink, P.blood, null], ['christian-union-lockup-dark', P.cream, P.gold, P.ink]]) {
      S = await sprite(512, 160, 'Christian Union Party lockup');
      if (l[3]) await bg(S, l[3]);
      await mark(S, 66, 80, 124, 'color');
      await text(S, P1, 138, 46, 3, l[1], { bold: true });
      await text(S, P2, 138, 78, 3, l[1] === P.ink ? P.red : P.red, { bold: true });
      await text(S, 'FOUNDED IN ARIZONA', 140, 112, 2, l[2]);
      out = out.concat(await save(S, 'logo/' + l[0], [{ scale: 4, suffix: '-2048' }]));
    }
    for (var st of [['christian-union-stacked-light', P.ink, P.blood, null], ['christian-union-stacked-dark', P.cream, P.gold, P.ink]]) {
      S = await sprite(512, 512, 'Christian Union Party stacked logo');
      if (st[3]) await bg(S, st[3]);
      await mark(S, 256, 186, 300, 'color');
      await centreText(S, P1, 356, 4, st[1], { bold: true });
      await centreText(S, P2, 396, 4, P.red, { bold: true });
      await centreText(S, 'FOUNDED IN ARIZONA', 456, 2, st[2]);
      out = out.concat(await save(S, 'logo/' + st[0], [{ scale: 2, suffix: '-1024' }]));
    }
    // link preview for christianunion.xyz, 1200x630
    S = await sprite(240, 126, 'Christian Union Party link preview');
    await bg(S, P.ink);
    await sunrise(S, 120, 126 * 1.6, 126, [P.night, '#2a0c0f', P.wine, P.deep]);
    await network(S, 0, 0, 240, 126, { seed: 1977, step: 13, clear: { cx: 120, cy: 63, rx: 104, ry: 70 }, people: 0.1, person: P.gold });
    await T(S, 'new_layer', { name: 'Identity' });
    await mark(S, 120, 34, 50, 'color');
    await centreText(S, P1, 66, 2, P.cream, { bold: true });
    await centreText(S, 'PARTY', 84, 2, P.red, { bold: true });
    await centreText(S, 'FOUNDED IN ARIZONA', 106, 1, P.gold);
    out = out.concat(await save(S, 'social/christian-union-og', [{ scale: 5, suffix: '-1200x630' }]));
    return out;
  };

  // Typeface specimen ----------------------------------------------------
  JOBS.specimen = async function () {
    var S = await sprite(512, 288, 'Guild specimen'), out = [];
    await bg(S, P.ink);
    await text(S, 'Guild', 24, 22, 10, P.red, { bold: true });
    await text(S, 'THE TYPEFACE OF KEYSTONE', 26, 102, 2, P.gold);
    await text(S, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 26, 132, 2, P.cream, { bold: true });
    await text(S, 'abcdefghijklmnopqrstuvwxyz 0123456789', 26, 154, 2, P.cream);
    await text(S, 'The common good, built stone by stone. Faith, family, work and nation.', 26, 182, 1, P.paper);
    await text(S, 'Liberty for all, care for the weakest. ¡Bienvenidos! Café, niño, acción.', 26, 196, 1, P.paper);
    await text(S, 'Named for the guilds: good work, honest craft and shared standards.', 26, 254, 1, P.blood);
    await mark(S, 446, 62, 100, 'color');
    out = out.concat(await save(S, 'font/guild-specimen', [{ scale: 4, suffix: '-2048x1152' }]));
    return out;
  };
  JOBS['mark-test'] = async function () {
    var out = [];
    var S = await sprite(512, 512, 'Keystone mark test');
    await mark(S, 256, 256, 500, 'color');
    out = out.concat(await save(S, 'tmp/mark-test-a', [{ scale: 2 }]));
    S = await sprite(512, 512, 'Keystone badge test');
    await mark(S, 256, 256, 512, 'color', { badge: P.ink });
    out = out.concat(await save(S, 'tmp/mark-test-b', [{ scale: 2 }]));
    return out;
  };

  async function make(name) {
    await F.ready;
    if (name === 'all') { var all = []; for (var k in JOBS) if (!/test/.test(k)) all = all.concat(await JOBS[k]()); return all; }
    if (!JOBS[name]) throw new Error('no job ' + name + '; have ' + Object.keys(JOBS).join(', '));
    return JOBS[name]();
  }
  root.CY = { make: make, JOBS: JOBS, P: P, sprite: sprite, T: T, save: save, mark: mark, text: text, textWidth: textWidth, disc: disc, poly: poly, rect: rect, line: line, pt: pt, rng: rng, network: network };
})(window);
