/* ChristianUnion.party: the entry gate, the music player and its visualizers, the moving backgrounds, the
   arches built stone by stone, scroll reveals and the manifesto reader. No libraries. */
(function () {
  'use strict';
  var C = { red: '#e3261c', bright: '#f2492f', blood: '#a8151b', deep: '#7d0f16', wine: '#4a0a0f', gold: '#f2b33d', goldLight: '#ffd36b', goldDeep: '#b87a14', ink: '#140708', cream: '#f6ebdd', paper: '#e8d8c3' };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  // ---------------------------------------------------------------- the arch, built stone by stone
  // Nine stones round an arch, the gold keystone (with its small cross) dropping in last, and the sun rising.
  function buildArch(svg, delay) {
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg', cx = 200, cy = 210, ro = 150, ri = 96, n = 9, step = 180 / n, gap = 1.1, out = '';
    function p(r, d) { var a = d * Math.PI / 180; return (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy - r * Math.sin(a)).toFixed(1); }
    out += '<g class="sun"><path d="M' + (cx - 70) + ',' + cy + ' A70,70 0 0 1 ' + (cx + 70) + ',' + cy + 'Z" fill="' + C.gold + '"/><path d="M' + (cx - 44) + ',' + cy + ' A44,44 0 0 1 ' + (cx + 44) + ',' + cy + 'Z" fill="' + C.goldLight + '"/></g>';
    var order = [0, 8, 1, 7, 2, 6, 3, 5];
    order.forEach(function (k, i) {
      var a0 = 180 - k * step - gap, a1 = 180 - (k + 1) * step + gap, am = (a0 + a1) / 2, d = Math.cos((am - 135) * Math.PI / 180);
      var face = d > 0.45 ? C.bright : d > -0.2 ? C.red : C.blood, rm = ri + (ro - ri) * 0.42;
      out += '<g class="stone" style="animation-delay:' + (delay + i * 0.12).toFixed(2) + 's"><polygon points="' + [p(rm, a0), p(ro, a0), p(ro, a1), p(rm, a1)].join(' ') + '" fill="' + face + '"/><polygon points="' + [p(ri, a0), p(rm, a0), p(rm, a1), p(ri, a1)].join(' ') + '" fill="' + C.deep + '"/></g>';
    });
    var pw = ro - ri;
    out += '<g class="stone" style="animation-delay:' + delay.toFixed(2) + 's"><rect x="' + (cx - ro) + '" y="' + (cy + 2) + '" width="' + pw + '" height="62" fill="' + C.bright + '"/><rect x="' + (cx - ro + pw * 0.7) + '" y="' + (cy + 2) + '" width="' + pw * 0.3 + '" height="62" fill="' + C.red + '"/><rect x="' + (cx - ro - 10) + '" y="' + (cy + 64) + '" width="' + (pw + 20) + '" height="12" fill="' + C.blood + '"/></g>';
    out += '<g class="stone" style="animation-delay:' + (delay + 0.06).toFixed(2) + 's"><rect x="' + (cx + ri) + '" y="' + (cy + 2) + '" width="' + pw + '" height="62" fill="' + C.red + '"/><rect x="' + (cx + ri) + '" y="' + (cy + 2) + '" width="' + pw * 0.3 + '" height="62" fill="' + C.blood + '"/><rect x="' + (cx + ri - 10) + '" y="' + (cy + 64) + '" width="' + (pw + 20) + '" height="12" fill="' + C.blood + '"/></g>';
    var k0 = 90 + step / 2 - gap, k1 = 90 - step / 2 + gap, top = ro + 10;
    out += '<g class="key" style="animation-delay:' + (delay + 1.05).toFixed(2) + 's"><polygon points="' + [p(ri, k0), p(top, k0 + 1), cx + ',' + (cy - top).toFixed(1), cx + ',' + (cy - ri).toFixed(1)].join(' ') + '" fill="' + C.goldLight + '"/><polygon points="' + [cx + ',' + (cy - ri).toFixed(1), cx + ',' + (cy - top).toFixed(1), p(top, k1 - 1), p(ri, k1)].join(' ') + '" fill="' + C.gold + '"/>' +
      '<rect x="' + (cx - 3) + '" y="' + (cy - top + 12) + '" width="6" height="26" fill="' + C.cream + '"/><rect x="' + (cx - 9) + '" y="' + (cy - top + 19) + '" width="18" height="6" fill="' + C.cream + '"/></g>';
    svg.innerHTML = out;
    svg.querySelector('.sun').style.animationDelay = (delay + 1.6) + 's';
    void svg.getBoundingClientRect();
    svg.classList.add('built');
  }

  // ---------------------------------------------------------------- the network of people (hero and Keystone section)
  // Nodes drift and link to their neighbours. While music plays, they pulse with the bass.
  var level = 0; // current loudness of the music, 0-1, from the analyser
  function network(canvas, opts) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d'), nodes = [], W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), mouse = { x: -1e4, y: -1e4 }, visible = true;
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = Math.round(W * H / (opts.density || 14000));
      while (nodes.length < want) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, gold: Math.random() < .12, r: Math.random() < .12 ? 2.6 : 1.8 });
      nodes.length = want;
    }
    resize(); window.addEventListener('resize', resize);
    canvas.parentElement.addEventListener('pointermove', function (e) { var b = canvas.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top; });
    canvas.parentElement.addEventListener('pointerleave', function () { mouse.x = mouse.y = -1e4; });
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);
    var LINK = opts.link || 120;
    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      var boost = 1 + level * 1.6;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        if (!reduced) { a.x += a.vx * boost; a.y += a.vy * boost; }
        if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1;
        var dx = a.x - mouse.x, dy = a.y - mouse.y, dm = dx * dx + dy * dy;
        if (dm < 16000 && !reduced) { a.x += dx / Math.sqrt(dm) * .8; a.y += dy / Math.sqrt(dm) * .8; }
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], ex = a.x - b.x, ey = a.y - b.y, d2 = ex * ex + ey * ey;
          if (d2 < LINK * LINK) { var t = 1 - Math.sqrt(d2) / LINK; ctx.strokeStyle = 'rgba(227,38,28,' + (t * .35 * (opts.alpha || 1) * (0.7 + level)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.fillStyle = a.gold ? C.gold : C.red;
        var s = a.r * (a.gold ? 1 + level * 1.5 : 1);
        ctx.fillRect(a.x - s, a.y - s, s * 2, s * 2);
      }
    }
    frame();
  }

  // ---------------------------------------------------------------- the gate's starry sky
  function gateSky() {
    var c = $('#gate-sky'); if (!c) return;
    var ctx = c.getContext('2d'), stars = [], dpr = Math.min(2, window.devicePixelRatio || 1), W, H, running = true;
    function resize() { W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); stars = []; for (var i = 0; i < W * H / 4000; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * .8, s: Math.random() < .15 ? 2 : 1, p: Math.random() * 6.28, g: Math.random() < .2 }); }
    resize(); window.addEventListener('resize', resize);
    (function draw(t) {
      if (!running) return;
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      stars.forEach(function (s) { ctx.globalAlpha = reduced ? .7 : .35 + .65 * Math.abs(Math.sin(s.p + t / 1400)); ctx.fillStyle = s.g ? C.goldLight : C.paper; ctx.fillRect(s.x, s.y, s.s, s.s); });
      ctx.globalAlpha = 1;
    })(0);
    return function () { running = false; };
  }

  // ---------------------------------------------------------------- the music player
  var audio = $('#audio'), album = null, current = 0, actx = null, analyser = null, freq = null, wantPlay = false;
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function setupAnalyser() {
    if (actx || !window.AudioContext && !window.webkitAudioContext) return;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      var src = actx.createMediaElementSource(audio);
      analyser = actx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = .8;
      src.connect(analyser); analyser.connect(actx.destination);
      freq = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) { actx = null; analyser = null; }
  }
  function load(i, play) {
    if (!album) return;
    current = (i + album.tracks.length) % album.tracks.length;
    var t = album.tracks[current];
    audio.src = t.src;
    $('#p-cover').src = t.cover; $('#p-title').textContent = t.title; $('#p-sub').textContent = t.subtitle + ' · Stone by Stone';
    $('#feature-cover').src = t.cover; $('#feature-title').textContent = t.title; $('#feature-sub').textContent = t.subtitle;
    $('#feature-about').textContent = t.about; $('#feature-kicker').textContent = 'Track ' + t.n + ' of ' + album.tracks.length + ' · ' + t.key + ' · ' + t.bpm + ' BPM';
    var dl = $('#feature-download'); dl.href = t.src; dl.setAttribute('download', String(t.n).padStart(2, '0') + ' ' + t.title + '.mp3');
    document.documentElement.style.setProperty('--beat', (60 / t.bpm).toFixed(3) + 's');
    $$('.track, .player-queue li').forEach(function (el) { el.classList.toggle('current', +el.dataset.i === current); });
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: 'Keystone', album: 'Stone by Stone', artwork: [{ src: t.cover, sizes: '1024x1024', type: 'image/png' }] });
    }
    store.set('cd-track', current);
    if (play) playNow();
  }
  function playNow() {
    setupAnalyser();
    if (actx && actx.state === 'suspended') actx.resume();
    wantPlay = true;
    var p = audio.play(); if (p && p.catch) p.catch(function () { wantPlay = false; render(); });
    $('#player').classList.add('shown');
  }
  function toggle() { if (audio.paused) playNow(); else { wantPlay = false; audio.pause(); } }
  function render() {
    var playing = !audio.paused;
    $('#p-play').innerHTML = playing ? '&#10074;&#10074;' : '&#9654;';
    $('#p-play').setAttribute('aria-label', playing ? 'Pause' : 'Play');
    $('#feature-play').innerHTML = playing ? '<span aria-hidden="true">&#10074;&#10074;</span> Pause' : '<span aria-hidden="true">&#9654;</span> ' + (audio.currentTime > 0 ? 'Resume' : 'Play the album');
    $('.album-art').classList.toggle('playing', playing && !reduced);
    $$('.track').forEach(function (el) { el.classList.toggle('playing', playing); });
  }
  function buildLists() {
    var grid = $('#tracks'), queue = $('#p-queue');
    album.tracks.forEach(function (t, i) {
      var li = document.createElement('li'); li.className = 'track reveal'; li.dataset.i = i; li.style.setProperty('--d', (i % 4) * 0.06 + 's');
      li.innerHTML = '<button type="button" aria-label="Play ' + t.title + '"><div class="cover"><img src="' + t.cover + '" alt="" loading="lazy" width="1024" height="1024"><span class="play-badge" aria-hidden="true">&#9654;</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
        '<div class="info"><b>' + t.n + '. ' + t.title + '</b><span>' + t.subtitle + ' · ' + fmt(t.seconds) + '</span></div></button>';
      li.querySelector('button').addEventListener('click', function () { if (i === current && !audio.paused) toggle(); else load(i, true); });
      grid.appendChild(li); revealer.observe(li);
      var q = document.createElement('li'); q.dataset.i = i;
      q.innerHTML = '<button type="button"><img src="' + t.cover + '" alt="" loading="lazy"><div><b>' + t.n + '. ' + t.title + '</b><span>' + t.subtitle + ' · ' + fmt(t.seconds) + '</span></div></button>';
      q.querySelector('button').addEventListener('click', function () { load(i, true); });
      queue.appendChild(q);
    });
  }
  function wirePlayer() {
    $('#p-play').addEventListener('click', toggle);
    $('#feature-play').addEventListener('click', toggle);
    $('#p-prev').addEventListener('click', function () { if (audio.currentTime > 3) audio.currentTime = 0; else load(current - 1, true); });
    $('#p-next').addEventListener('click', function () { load(current + 1, true); });
    $('#p-list').addEventListener('click', function () { var q = $('#p-queue'), open = q.hidden; q.hidden = !open; this.setAttribute('aria-expanded', open); });
    var vol = $('#p-vol'), saved = parseFloat(store.get('cd-volume')); if (saved >= 0 && saved <= 1) vol.value = saved;
    audio.volume = +vol.value;
    vol.addEventListener('input', function () { audio.volume = +vol.value; store.set('cd-volume', vol.value); });
    var bar = $('#p-progress');
    function seek(e) { var b = bar.getBoundingClientRect(); if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)) * audio.duration; }
    bar.addEventListener('click', seek);
    bar.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') audio.currentTime += 5; if (e.key === 'ArrowLeft') audio.currentTime -= 5; });
    audio.addEventListener('timeupdate', function () {
      var p = audio.duration ? audio.currentTime / audio.duration * 100 : 0;
      $('#p-bar').style.width = p + '%'; bar.setAttribute('aria-valuenow', Math.round(p));
      $('#p-time').textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration || album.tracks[current].seconds);
    });
    audio.addEventListener('play', render); audio.addEventListener('pause', render);
    audio.addEventListener('ended', function () { load(current + 1, true); });
    document.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea, button, summary, [role=slider]') || document.body.classList.contains('gated')) return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
    });
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', playNow);
      navigator.mediaSession.setActionHandler('pause', function () { audio.pause(); });
      navigator.mediaSession.setActionHandler('previoustrack', function () { load(current - 1, true); });
      navigator.mediaSession.setActionHandler('nexttrack', function () { load(current + 1, true); });
    }
  }

  // visualizers: bars in the player, and a glowing spectrum over the album art
  function visualizers() {
    var pv = $('#p-viz'), fv = $('#feature-viz'), pc = pv.getContext('2d'), fc = fv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), idle = 0;
    function size(c, ctx) { var w = c.clientWidth, h = c.clientHeight; if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); } return [w, h]; }
    (function draw(t) {
      requestAnimationFrame(draw);
      var data = null;
      if (analyser && !audio.paused) { analyser.getByteFrequencyData(freq); data = freq; }
      // overall loudness, mostly from the low end, drives the network pulse
      var lv = 0; if (data) { for (var i = 0; i < 24; i++) lv += data[i]; lv = lv / 24 / 255; }
      level += (lv - level) * .2;
      idle = t / 1000;
      var s = size(pv, pc), w = s[0], h = s[1], n = 40, bw = w / n;
      pc.clearRect(0, 0, w, h);
      for (i = 0; i < n; i++) {
        var v = data ? data[Math.floor(i * 1.5) + 1] / 255 : (audio.paused ? 0.06 : .1 + .08 * Math.sin(idle * 3 + i * .5));
        var bh = Math.max(2, Math.round(v * h / 2) * 2), g = i / n;
        pc.fillStyle = g < .6 ? C.red : C.gold; pc.globalAlpha = .45 + v * .55;
        pc.fillRect(Math.round(i * bw) + 1, h - bh, Math.max(1, Math.round(bw) - 2), bh);
      }
      pc.globalAlpha = 1;
      if (fv.offsetParent) {
        s = size(fv, fc); w = s[0]; h = s[1];
        fc.clearRect(0, 0, w, h);
        if (data) {
          var grad = fc.createLinearGradient(0, h, 0, 0); grad.addColorStop(0, 'rgba(227,38,28,.85)'); grad.addColorStop(1, 'rgba(255,211,107,.9)');
          fc.fillStyle = grad; n = 48; bw = w / n;
          for (i = 0; i < n; i++) { v = data[Math.floor(i * 1.3) + 1] / 255; bh = Math.round(v * v * h / 6) * 6; fc.fillRect(Math.round(i * bw) + 1, h - bh, Math.max(1, Math.round(bw) - 2), bh); }
        }
      }
    })(0);
  }

  // ---------------------------------------------------------------- the levels: federal, Arizona, counties, cities and towns
  function levels() {
    var svg = $('#levels-svg'); if (!svg) return;
    var out = '';
    out += '<g class="lv" data-level="federal"><circle cx="200" cy="200" r="194" fill="rgba(74,10,15,.35)" stroke="' + C.cream + '" stroke-width="2" stroke-dasharray="6 6"/><text x="200" y="26" text-anchor="middle" fill="' + C.cream + '" font-family="Guild" font-size="16">UNITED STATES</text></g>';
    out += '<g class="lv" data-level="state"><circle cx="200" cy="208" r="160" fill="rgba(125,15,22,.3)" stroke="' + C.gold + '" stroke-width="3"/><text x="200" y="72" text-anchor="middle" fill="' + C.gold + '" font-family="Guild" font-size="18">ARIZONA</text></g>';
    var counties = [[200, 140], [130, 230], [270, 230]], towns = [];
    counties.forEach(function (d, k) {
      out += '<line class="flow" x1="' + d[0] + '" y1="' + d[1] + '" x2="200" y2="208" stroke="' + C.goldDeep + '" stroke-width="2"/>';
      out += '<g class="lv" data-level="county"><circle cx="' + d[0] + '" cy="' + d[1] + '" r="52" fill="rgba(227,38,28,.18)" stroke="' + C.red + '" stroke-width="3"/></g>';
      for (var t = 0; t < 4; t++) { var a = t * Math.PI / 2 + k + .4; towns.push([d[0] + 28 * Math.cos(a), d[1] + 28 * Math.sin(a), d]); }
    });
    towns.forEach(function (t) { out += '<line class="flow" x1="' + t[0].toFixed(1) + '" y1="' + t[1].toFixed(1) + '" x2="' + t[2][0] + '" y2="' + t[2][1] + '" stroke="' + C.deep + '" stroke-width="1.5"/>'; });
    towns.forEach(function (t, i) { out += '<g class="lv" data-level="local"><rect class="node" style="animation-delay:' + (i * .23).toFixed(2) + 's" x="' + (t[0] - 6).toFixed(1) + '" y="' + (t[1] - 6).toFixed(1) + '" width="12" height="12" fill="' + C.cream + '"/></g>'; });
    out += '<rect x="190" y="198" width="20" height="20" fill="' + C.gold + '"/><rect x="198" y="194" width="4" height="28" fill="' + C.ink + '"/><rect x="192" y="201" width="16" height="4" fill="' + C.ink + '"/>';
    svg.innerHTML = out;
    var tabs = $$('.level-tab');
    function select(tab) {
      tabs.forEach(function (t) { var on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
      var lvl = tab.dataset.level;
      $$('.lv', svg).forEach(function (g) { g.classList.toggle('dim', g.dataset.level !== lvl); g.classList.toggle('on', g.dataset.level === lvl); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n); } });
    });
    select(tabs[0]);
  }

  // ---------------------------------------------------------------- Keystone at the centre of the state's services
  function hub() {
    var svg = $('#hub-svg'); if (!svg) return;
    var cx = 300, cy = 180, names = ['MVD', 'AHCCCS', 'DES', 'ADOT', 'COURTS', 'SCHOOLS', 'WATER', 'COUNTIES', 'CITIES', 'LICENSING'], out = '';
    names.forEach(function (n, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / names.length, x = cx + 230 * Math.cos(a), y = cy + 140 * Math.sin(a);
      out += '<line class="spoke" style="animation-delay:' + (i * -.12).toFixed(2) + 's" x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + C.gold + '" stroke-width="2" opacity=".75"/>';
    });
    names.forEach(function (n, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / names.length, x = cx + 230 * Math.cos(a), y = cy + 140 * Math.sin(a), w = n.length * 9 + 22;
      out += '<g class="agency" style="animation-delay:' + (i * .3).toFixed(2) + 's"><rect x="' + (x - w / 2).toFixed(1) + '" y="' + (y - 15).toFixed(1) + '" width="' + w + '" height="30" rx="6" fill="' + C.ink + '" stroke="' + C.red + '" stroke-width="2"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (y + 5).toFixed(1) + '" text-anchor="middle" fill="' + C.cream + '" font-family="Guild" font-size="13">' + n + '</text></g>';
    });
    out += '<g class="core"><circle cx="' + cx + '" cy="' + cy + '" r="46" fill="' + C.red + '" stroke="' + C.gold + '" stroke-width="4"/>' +
      '<polygon points="' + (cx - 14) + ',' + (cy - 20) + ' ' + (cx + 14) + ',' + (cy - 20) + ' ' + (cx + 10) + ',' + (cy + 18) + ' ' + (cx - 10) + ',' + (cy + 18) + '" fill="' + C.gold + '"/>' +
      '<rect x="' + (cx - 2) + '" y="' + (cy - 14) + '" width="4" height="20" fill="' + C.cream + '"/><rect x="' + (cx - 7) + '" y="' + (cy - 9) + '" width="14" height="4" fill="' + C.cream + '"/></g>';
    out += '<text x="' + cx + '" y="' + (cy + 70) + '" text-anchor="middle" fill="' + C.gold + '" font-family="Guild" font-size="16">KEYSTONE</text>';
    svg.innerHTML = out;
  }
  // ---------------------------------------------------------------- fifty states, Arizona first
  function states() {
    var el = $('#us'); if (!el) return;
    'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ').forEach(function (s) {
      var b = document.createElement('span'); b.textContent = s; b.title = s === 'AZ' ? 'Arizona: organizing now' : 'Coming soon';
      if (s === 'AZ') b.className = 'on';
      el.appendChild(b);
    });
  }

  // ---------------------------------------------------------------- scroll: reveals, nav, active links, tilt
  var revealer = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  function scrolling() {
    $$('.reveal-group').forEach(function (g) { $$('.reveal', g).forEach(function (el, i) { el.style.setProperty('--d', (i % 6) * 0.08 + 's'); }); });
    $$('.reveal').forEach(function (el) { revealer.observe(el); });
    var nav = $('.nav'), last = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      nav.classList.toggle('scrolled', y > 40);
      nav.classList.toggle('hidden', y > last && y > 400 && !$('#nav-links').classList.contains('open'));
      last = y;
    }, { passive: true });
    var links = $$('#nav-links a[href^="#"]:not(.open-reader)');
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) spy.observe(s); });
    $('.nav-toggle').addEventListener('click', function () { var ul = $('#nav-links'), open = !ul.classList.contains('open'); ul.classList.toggle('open', open); this.setAttribute('aria-expanded', open); });
    $$('#nav-links a').forEach(function (a) { a.addEventListener('click', function () { $('#nav-links').classList.remove('open'); }); });
    // pillar cards: a gold glow follows the pointer, and the card tilts toward it
    if (!reduced) $$('.pillar').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var b = card.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
        card.style.transform = 'perspective(700px) rotateX(' + ((.5 - y) * 6).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 8).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
    // the closing arch is built when it scrolls into view
    var close = $('#close-arch');
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { buildArch(close, 0); o.disconnect(); } }, { threshold: .4 }).observe(close);
    // gentle parallax on the hero
    if (!reduced) window.addEventListener('scroll', function () { var y = window.scrollY; if (y < window.innerHeight) { $('.hero-content').style.transform = 'translateY(' + y * .25 + 'px)'; $('.hero-content').style.opacity = 1 - y / window.innerHeight * 1.1; } }, { passive: true });
  }

  // ---------------------------------------------------------------- the manifesto reader
  function reader() {
    var r = $('#reader'), body = $('#reader-body'), loaded = false, opener = null;
    function open(e) {
      if (e) e.preventDefault();
      opener = document.activeElement;
      r.hidden = false; document.body.style.overflow = 'hidden';
      if (!loaded) fetch('media/manifesto.html').then(function (x) { return x.text(); }).then(function (h) { body.innerHTML = h; loaded = true; }).catch(function () { body.innerHTML = '<p>The manifesto could not be loaded. <a href="https://github.com/danecohn/Commonweal/blob/main/THE-CHRISTIAN-UNIONIST-MANIFESTO.md">Read it on GitHub</a>.</p>'; });
      body.focus();
      if (location.hash !== '#manifesto') history.replaceState(null, '', '#manifesto');
    }
    function close() { r.hidden = true; document.body.style.overflow = ''; history.replaceState(null, '', location.pathname); if (opener) opener.focus(); }
    $$('.open-reader').forEach(function (a) { a.addEventListener('click', open); });
    $('#reader-close').addEventListener('click', close);
    r.addEventListener('click', function (e) { if (e.target === r) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !r.hidden) close(); });
    body.addEventListener('scroll', function () { $('#reader-progress').style.setProperty('--p', (body.scrollTop / Math.max(1, body.scrollHeight - body.clientHeight) * 100) + '%'); });
    return { open: open };
  }

  // ---------------------------------------------------------------- the gate
  function gate(rd) {
    var g = $('#gate'), stopSky = gateSky();
    buildArch($('#gate-arch'), .2);
    function enter(withSound) {
      store.set('cd-entered', withSound ? 'sound' : 'quiet');
      if (withSound) { load(0, true); }
      g.classList.add('leaving');
      document.body.classList.remove('gated');
      setTimeout(function () { g.hidden = true; if (stopSky) stopSky(); }, 950);
      buildArch($('#hero-arch'), .4);
      $$('#hero .reveal').forEach(function (el, i) { el.style.setProperty('--d', (0.5 + i * 0.15) + 's'); el.classList.add('in'); });
      $('#player').classList.add('shown');
      if (location.hash === '#manifesto') rd.open();
    }
    $('#enter-sound').addEventListener('click', function () { enter(true); });
    $('#enter-quiet').addEventListener('click', function () { enter(false); });
    $('#enter-sound').focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- start
  states();
  scrolling();
  levels();
  hub();
  network($('#net'), { density: 12000, link: 130 });
  network($('#ks-net'), { density: 16000, link: 110, alpha: .8 });
  wirePlayer();
  visualizers();
  var rd = reader();
  gate(rd);
  fetch('media/album.json').then(function (r) { return r.json(); }).then(function (a) {
    album = a; buildLists();
    var saved = parseInt(store.get('cd-track'), 10);
    load(isNaN(saved) ? 0 : saved, wantPlay);
  });
  // "Enter with sound" may be pressed before the track list has loaded: play as soon as it arrives
  var _load = load; load = function (i, play) { if (!album) { wantPlay = wantPlay || play; return; } _load(i, play); };
})();
