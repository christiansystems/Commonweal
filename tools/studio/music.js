/* Commonweal: Music for the Common Good. The official soundtrack, composed with Vigil Box's song tools
   (new_song, set_instrument, add_channel, generate_part, write_track, analyze_audio) and rendered with its
   BeepBox synth. Melodies are written out note by note below; bass, arpeggio, pad and drum parts come from
   Vigil Box's own generators over each section's chord progression.

   In the browser: await CYM.make(1) for one track, or await CYM.make('all'). */
(function (root) {
  'use strict';
  var NS = root.Amerika, B = root.beepbox;
  var ALBUM = 'Commonweal: Music for the Common Good', ARTIST = 'Commonweal', YEAR = '2026', RATE = 44100;

  // ---------------------------------------------------------------- Vigil Box host (as in its own test harness)
  function makeHost() {
    return {
      song: new B.Song(), silent: true, history: [],
      getSong: function () { return this.song; },
      commit: function (song) { this.history.push(1); this.song = song; },
      play: function () {}, stop: function () {}, undo: function () {}
    };
  }
  function save(path, data) {
    return fetch('/save/' + path, { method: 'POST', body: data }).then(function (r) { if (!r.ok) throw new Error('save failed ' + path); });
  }
  function log(s) { document.getElementById('log').textContent += s + '\n'; }

  // ---------------------------------------------------------------- melody notation
  // "A4:1 D5:1 E5:1.5 r:0.5 | D5/F5:2" -> Vigil Box note text "A4@0+1 D5@1+1 ...". '|' marks a barline and is
  // checked against the bar length so every bar adds up. Append vNN to a token for its volume.
  function seq(str, bpb, offset, transpose) {
    var out = [], t = offset || 0, barStart = t, bar = 1;
    str.split(/\s+/).filter(Boolean).forEach(function (tok) {
      if (tok === '|') {
        if (bpb && Math.abs(t - barStart - bpb) > 1e-6) throw new Error('bar ' + bar + ' of "' + str.slice(0, 40) + '..." has ' + (t - barStart) + ' beats, not ' + bpb);
        barStart = t; bar++; return;
      }
      var m = /^([^:]+):([\d.]+)(v\d+)?$/.exec(tok);
      if (!m) throw new Error('bad token ' + tok);
      var len = +m[2];
      if (m[1] !== 'r') {
        var pitches = m[1].split('/').map(function (p) { return transpose ? shift(p, transpose) : p; });
        out.push(pitches.join('/') + '@' + +t.toFixed(4) + '+' + len + (m[3] || ''));
      }
      t += len;
    });
    return { notes: out.join(' '), beats: t - (offset || 0) };
  }
  var NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  var PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function shift(name, semis) {
    var m = /^([A-G][#b]?)(-?\d)$/.exec(name); var midi = PC[m[1]] + 12 * (+m[2] + 1) + semis;
    return NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
  }

  // ---------------------------------------------------------------- arrangement
  // A track is a list of sections. Each section names its chords and which parts play.
  async function compose(def) {
    var host = makeHost(), tools = NS.songtools.create(B, host), bpb = def.beatsPerBar || 4;
    var run = function (name, input) { return tools.run(name, input); };
    var total = def.sections.reduce(function (n, s) { return n + s.bars; }, 0) + 1; // +1 bar for the reverb tail
    await run('new_song', { layout: 'standard', key: def.key, scale: 'expert', tempo: def.tempo, bars: total, beats_per_bar: bpb });
    var ins = def.instruments;
    await run('set_instrument', { channel: 1, preset: ins.lead });
    await run('set_instrument', { channel: 2, preset: ins.second });
    await run('set_instrument', { channel: 3, preset: ins.bass });
    var drums = 4;
    if (ins.pad) { await run('add_channel', { type: 'pitch', instrument: ins.pad, octave: 3 }); drums = 5; }
    // mix: the melody leads, drums sit under it; per-track overrides by channel number (or 'drums')
    var vol = Object.assign({ 1: 100, 2: 75, 3: 45, 4: 45, drums: 35 }, def.volumes || {});
    if (!ins.pad) delete vol[4];
    for (var c in vol) await run('set_instrument', { channel: c === 'drums' ? drums : +c, settings: { volume: vol[c] } });

    var bar = 1, warnings = [];
    for (var k = 0; k < def.sections.length; k++) {
      var s = def.sections[k], r;
      var part = function (ch, o) { return run('generate_part', Object.assign({ channel: ch, progression: s.chords, bars: s.bars, start_bar: bar }, o)); };
      if (s.lead) { r = await run('write_track', { channel: 1, start_bar: bar, bars: s.bars, notes: seq(s.lead, bpb).notes }); if (r.warnings) warnings = warnings.concat(r.warnings); }
      if (s.second && s.second.notes) { r = await run('write_track', { channel: 2, start_bar: bar, bars: s.bars, notes: s.second.notes }); if (r.warnings) warnings = warnings.concat(r.warnings); }
      else if (s.second) await part(2, Object.assign({ kind: 'arpeggio' }, s.second));
      if (s.bass) await part(3, Object.assign({ kind: 'bass' }, s.bass));
      if (s.pad && ins.pad) await part(4, Object.assign({ kind: 'pad' }, s.pad));
      if (s.drums) await part(drums, Object.assign({ kind: 'drums' }, s.drums));
      bar += s.bars;
    }
    return { host: host, tools: tools, warnings: warnings };
  }

  // ---------------------------------------------------------------- mastering and files
  function master(L, R) {
    // match loudness across the album (RMS -16 dBFS), then a soft knee keeps peaks under -1 dBFS
    var sum = 0, n = L.length;
    for (var i = 0; i < n; i++) sum += L[i] * L[i] + R[i] * R[i];
    var rms = Math.sqrt(sum / (2 * n)), gain = Math.pow(10, -16 / 20) / Math.max(rms, 1e-9), ceil = Math.pow(10, -1 / 20), knee = 0.7;
    function soft(x) { x *= gain; var a = Math.abs(x); if (a <= knee) return x; return Math.sign(x) * (knee + (ceil - knee) * Math.tanh((a - knee) / (ceil - knee))); }
    var fade = Math.floor(RATE * 0.4), peak = 0;
    for (i = 0; i < n; i++) {
      var f = i > n - fade ? (n - i) / fade : 1;
      L[i] = soft(L[i]) * f; R[i] = soft(R[i]) * f;
      peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    return { gainDb: +(20 * Math.log10(gain)).toFixed(1), peakDbfs: +(20 * Math.log10(peak)).toFixed(2), rmsDbfs: -16 };
  }
  function toInt16(F) { var o = new Int16Array(F.length); for (var i = 0; i < F.length; i++) o[i] = Math.max(-32768, Math.min(32767, Math.round(F[i] * 32767))); return o; }
  function mp3(L, R) {
    var enc = new lamejs.Mp3Encoder(2, RATE, 256), l = toInt16(L), r = toInt16(R), parts = [], blk = 1152;
    for (var i = 0; i < l.length; i += blk) { var b = enc.encodeBuffer(l.subarray(i, i + blk), r.subarray(i, i + blk)); if (b.length) parts.push(b); }
    parts.push(enc.flush());
    return parts;
  }
  // ID3v2.3 tag with title, artist, album, track number, year, genre and the cover art
  function id3(meta, cover) {
    function frame(id, body) { var h = new Uint8Array(10); h.set([...id].map(function (c) { return c.charCodeAt(0); })); var n = body.length; h[4] = n >>> 24; h[5] = n >>> 16 & 255; h[6] = n >>> 8 & 255; h[7] = n & 255; return [h, body]; }
    function textFrame(id, s) { var u = new Uint8Array(3 + s.length * 2); u[0] = 1; u[1] = 0xFF; u[2] = 0xFE; for (var i = 0; i < s.length; i++) { u[3 + 2 * i] = s.charCodeAt(i) & 255; u[4 + 2 * i] = s.charCodeAt(i) >>> 8; } return frame(id, u); }
    var parts = [].concat(textFrame('TIT2', meta.title), textFrame('TPE1', ARTIST), textFrame('TALB', ALBUM), textFrame('TRCK', meta.n + '/8'),
      textFrame('TYER', YEAR), textFrame('TCON', 'Chiptune'), textFrame('TCOP', '2026 The Commonweal contributors, Commonweal License 1.0 (GPL-3.0-only)'));
    if (cover) { var head = new TextEncoder().encode('\0image/png\0\x03Cover\0'); var body = new Uint8Array(head.length + cover.length); body.set(head); body.set(cover, head.length); parts = parts.concat(frame('APIC', body)); }
    var size = parts.reduce(function (n, p) { return n + p.length; }, 0), h = new Uint8Array(10);
    h.set([73, 68, 51, 3, 0, 0, size >>> 21 & 127, size >>> 14 & 127, size >>> 7 & 127, size & 127]);
    return [h].concat(parts);
  }
  function wavBytes(L, R) { return NS.audio.encodeWav(L, R, RATE); }

  // Mix targets in dB relative to the lead melody, measured with Vigil Box's analyze_audio.
  var MIX = { 2: -6, 3: -3, 4: -8, drums: -1.5 };
  /** Measure each channel and move its volume towards the target, damped (about 0.13 dB per volume step,
      steeper below -20, and -40 mutes, so steps are capped and the floor is -20). Repeats until within 1 dB. */
  async function autoMix(def, passes) {
    def.volumes = {};
    for (var p = 0; p < (passes || 5); p++) {
      var c = await compose(def), a = await c.tools.run('analyze_audio', { per_channel: true, max_seconds: 90 });
      var j = c.tools.snapshot(), drumsCh = j.channels.length, lead = a.channels[0].rmsDbfs, worst = 0;
      a.channels.forEach(function (ch) {
        var key = ch.channel === drumsCh ? 'drums' : ch.channel;
        if (MIX[key] === undefined || ch.rmsDbfs < -100) return;
        var cur = j.channels[ch.channel - 1].instruments[0].volume, err = lead + MIX[key] - ch.rmsDbfs;
        worst = Math.max(worst, Math.abs(err));
        def.volumes[key] = Math.round(Math.max(-20, Math.min(100, cur + Math.max(-25, Math.min(25, err / 0.13)))));
      });
      if (worst < 1) break;
    }
    return def.volumes;
  }
  /** Compose a track and report each channel's loudness (dBFS RMS over the first minute), without rendering files. */
  async function check(n) {
    var c = await compose(TRACKS[n - 1]), a = await c.tools.run('analyze_audio', { per_channel: true, max_seconds: 60 });
    return TRACKS[n - 1].title + ': ' + a.channels.map(function (ch) { return ch.channel + '=' + ch.rmsDbfs; }).join(' ') + ' | ' + a.advice.join(' ');
  }
  async function make(which) {
    var list = which === 'all' ? TRACKS : TRACKS.filter(function (t) { return t.n === which || t.slug === which; });
    var cover = new Uint8Array(await (await fetch('/assets/music/commonweal-soundtrack-cover-600.png')).arrayBuffer()), results = [];
    for (var k = 0; k < list.length; k++) {
      var t = list[k], t0 = Date.now(), name = String(t.n).padStart(2, '0') + '-' + t.slug;
      await autoMix(t);
      var c = await compose(t);
      var analysis = await c.tools.run('analyze_audio', { per_channel: true, max_seconds: 60 });
      var song = c.host.getSong();
      var r = await NS.audio.renderSong(B, song, { sampleRate: RATE, loops: 1, yieldEvery: 50 });
      var m = master(r.L, r.R);
      await save('src/box/' + name + '.song.json', JSON.stringify(song.toJsonObject(), null, 1));
      await save('music/wav/' + name + '.wav', wavBytes(r.L, r.R));
      await save('music/mp3/' + name + '.mp3', new Blob(id3(t, cover).concat(mp3(r.L, r.R))));
      var res = { n: t.n, volumes: t.volumes, id: name, title: t.title, subtitle: t.subtitle, key: t.key + ' ' + t.mode, bpm: t.tempo, beatsPerBar: t.beatsPerBar || 4, bars: r.totalBars,
        seconds: +r.seconds.toFixed(1), instruments: t.instruments, peakDbfs: m.peakDbfs, rmsDbfs: m.rmsDbfs, masteringGainDb: m.gainDb,
        balance: (analysis.channels || []).map(function (ch) { return ch.channel + '=' + ch.rmsDbfs; }).join(' '),
        advice: analysis.advice, warnings: c.warnings.length ? c.warnings : undefined, renderSeconds: (Date.now() - t0) / 1000 };
      log(name + ': ' + res.seconds + ' s, peak ' + m.peakDbfs + ' dBFS');
      results.push(res);
    }
    return results;
  }
  async function writeAlbum(results) {
    var album = { title: ALBUM, artist: ARTIST, year: YEAR, license: 'Commonweal License 1.0 (GPL-3.0-only)', made_with: 'Vigil Box (BeepBox 4.2.2 synth) by VigilTech; composed in tools/studio/music.js',
      cover: 'commonweal-soundtrack-cover-3000.png', sampleRate: RATE, mastering: 'RMS matched to -16 dBFS, soft knee limiting under -1 dBFS',
      tracks: results.map(function (r) { var t = TRACKS[r.n - 1]; return { n: r.n, id: r.id, title: r.title, subtitle: t.subtitle, about: t.about, key: r.key, bpm: r.bpm, beatsPerBar: r.beatsPerBar, seconds: r.seconds, mp3: 'mp3/' + r.id + '.mp3', source: '../src/box/' + r.id + '.song.json' }; }) };
    await save('music/album.json', JSON.stringify(album, null, 2));
    return album;
  }

  // ---------------------------------------------------------------- the eight tracks
  var TRACKS = [
    {
      n: 1, slug: 'keystone', title: 'Keystone', subtitle: 'Theme of Commonweal', key: 'D', mode: 'minor', tempo: 108,
      about: 'The main theme. A bell melody rises stone by stone over a minor progression and builds to a full band, the way an arch stands once its keystone is set.',
      instruments: { lead: 'fm bell', second: 'chip arp', bass: 'triangle bass', pad: 'soft pad' },
      sections: (function () {
        var A = 'A4:1 D5:1 E5:1 F5:1 | F5:1.5 E5:0.5 D5:1 Bb4:1 | C5:1 F5:1 A5:1.5 G5:0.5 | G5:2 E5:1 C5:1 | D5:1 F5:1 A5:1 D6:1 | D6:1.5 C6:0.5 Bb5:1 F5:1 | A5:1 G5:1 F5:1 E5:1 | E5:3 r:1';
        var Bm = 'D5:2 F5:1 Bb5:1 | A5:2 F5:1 C5:1 | E5:1 G5:1 C6:1 G5:1 | A5:3 r:1 | Bb5:1 A5:1 G5:1 D5:1 | F5:1.5 G5:0.5 F5:1 D5:1 | E5:1 G5:1 C6:1.5 Bb5:0.5 | A5:2 C#5:1 E5:1';
        var a = 'Dm Bb F C', b = 'Bb F C Dm Gm Bb C A';
        return [
          { bars: 4, chords: a, pad: { octave: 3, vol: 67 }, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 0.5, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time' } },
          { bars: 8, chords: a, lead: A, second: { style: 'updown', step: 0.25, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'chiptune march', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'broken', step: 0.5, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'rootfifth', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: a, lead: A, second: { style: 'updown', step: 0.25, octave: 4, vol: 60 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'up', step: 0.25, octave: 4, vol: 60 }, pad: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 8, fill_template: 'snare roll fill' } },
          { bars: 8, chords: a, lead: A, second: { style: 'updown', step: 0.25, octave: 4, vol: 60 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 4, chords: 'Dm Bb C Dm', lead: 'D5:4 | D5:2 F5:2 | E5:4 | D5:4', pad: { octave: 3 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 2, slug: 'open-standard', title: 'Open Standard', subtitle: 'Every part compatible', key: 'E', mode: 'minor', tempo: 140,
      about: 'One shared format carried to every corner of the nation, so every machine can talk to every other: fast, rhythmic, always transmitting.',
      instruments: { lead: 'pulse lead', second: 'chip arp', bass: 'square bass', pad: null },
      sections: (function () {
        var A = 'E5:0.5 E5:0.5 G5:0.5 E5:0.5 B5:1 A5:0.5 G5:0.5 | F#5:0.5 G5:0.5 E5:1 r:1 B4:0.5 D5:0.5 | F#5:0.5 F#5:0.5 A5:0.5 F#5:0.5 D6:1 C6:0.5 B5:0.5 | C6:1 B5:0.5 G5:0.5 E5:1 r:1 | ' +
          'E5:0.5 E5:0.5 G5:0.5 E5:0.5 B5:1 A5:0.5 G5:0.5 | F#5:0.5 G5:0.5 B5:1 E6:1 D6:0.5 B5:0.5 | A5:0.5 F#5:0.5 D5:0.5 F#5:0.5 A5:1 D6:1 | E6:2 r:2';
        var Bm = 'A5:1.5 C6:0.5 B5:1 A5:1 | G5:1.5 E5:0.5 G5:1 C6:1 | F#5:1.5 A5:0.5 D6:1 C6:1 | B5:2 D#5:1 F#5:1 | A5:1 E6:1 D6:1 C6:1 | B5:1 G5:1 E5:1 G5:1 | A5:1 D6:1 F#6:1 E6:0.5 D6:0.5 | D#6:2 B5:2';
        var a = 'Em Em D C', b = 'Am C D B';
        return [
          { bars: 4, chords: a, second: { style: 'up', step: 0.25, octave: 4, vol: 67 }, drums: { template: 'sixteenth hats' } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 0.25, octave: 4, vol: 50 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 8 } },
          { bars: 8, chords: a, lead: A, second: { style: 'updown', step: 0.25, octave: 4, vol: 50 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'breakbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'broken', step: 0.25, octave: 4, vol: 50 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 0.25, octave: 4, vol: 50 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'breakbeat', fill_every: 8 } },
          { bars: 8, chords: a, second: { style: 'down', step: 0.25, octave: 5, vol: 67 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'half time' } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'updown', step: 0.25, octave: 4, vol: 50 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 0.25, octave: 4, vol: 50 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 8 } },
          { bars: 4, chords: 'Em C D Em', lead: 'E5:0.5 E5:0.5 G5:0.5 E5:0.5 B5:2 | C6:4 | D6:4 | E6:4', bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    },
    {
      n: 3, slug: 'early-warning', title: 'Early Warning', subtitle: 'Signals in the numbers', key: 'A', mode: 'minor', tempo: 124,
      about: 'A steady pulse that keeps measuring and answering: problems caught early, by the people closest to them.',
      instruments: { lead: 'saw lead', second: 'pluck', bass: 'saw bass', pad: 'supersaw pad' },
      sections: (function () {
        var A = 'A4:0.75 C5:0.75 E5:0.5 A5:1 G5:0.5 E5:0.5 | F5:0.75 A5:0.75 C6:0.5 A5:1 F5:1 | G5:0.75 E5:0.75 C5:0.5 E5:1 G5:1 | D5:1 G5:1 B5:1 D6:1 | ' +
          'A4:0.75 C5:0.75 E5:0.5 A5:1 G5:0.5 E5:0.5 | F5:0.75 A5:0.75 C6:0.5 F6:1 E6:1 | E6:0.75 D6:0.75 C6:0.5 G5:1 E5:1 | D5:2 B4:2';
        var Bm = 'C6:2 A5:1 F5:1 | B5:2 G5:1 D5:1 | E5:1 G5:1 B5:1 E6:1 | C6:3 r:1 | A5:1 C6:1 F6:1 C6:1 | D6:1 B5:1 G5:1 B5:1 | G5:1 B5:1 E6:1.5 D6:0.5 | C6:2 A5:2';
        var a = 'Am F C G', b = 'F G Em Am';
        return [
          { bars: 8, chords: a, bass: { style: 'eighths', octave: 2 }, drums: { template: 'four on the floor', fill_every: 8 } },
          { bars: 8, chords: a, lead: A, second: { style: 'broken', step: 0.5, octave: 4, vol: 67 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'four on the floor', fill_every: 8 } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 0.25, octave: 4, vol: 67 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'four on the floor', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'updown', step: 0.25, octave: 4, vol: 67 }, pad: { octave: 3 }, bass: { style: 'rootfifth', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 8 } },
          { bars: 4, chords: a, pad: { octave: 3 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 0.25, octave: 4, vol: 67 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'four on the floor', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'updown', step: 0.25, octave: 4, vol: 67 }, pad: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'four on the floor', fill_every: 8, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'F G Am Am', lead: 'C6:4 | B5:4 | A5:4 | A5:4', pad: { octave: 3 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 4, slug: 'algedonic-signal', title: 'Algedonic Signal', subtitle: 'The alarm that skips the queue', key: 'C', mode: 'minor to major', tempo: 96,
      about: 'Beer\'s pain-and-pleasure alarm: a signal of harm that goes straight to whoever can act. It starts as a warning and ends resolved.',
      instruments: { lead: 'pwm lead', second: 'fm bell', bass: 'fm bass', pad: 'supersaw pad' },
      sections: (function () {
        var bell = function (bars) { var s = []; for (var i = 0; i < bars; i += 2) s.push('G5:0.5 C6:0.5 r:1 G5:0.5 C6:0.5 r:1 | r:4'); return seq(s.join(' | '), 4); };
        var A = 'G4:2 C5:1 Eb5:1 | Eb5:1.5 D5:0.5 C5:2 | F5:2 Ab5:1 G5:0.5 F5:0.5 | G5:3 B4:1 | C5:1 Eb5:1 G5:1 C6:1 | C6:1.5 Bb5:0.5 Ab5:2 | Ab5:1 G5:1 F5:1 D5:1 | B4:2 D5:1 G5:1';
        var Bm = 'C6:2 Eb6:2 | D6:2 Bb5:2 | G5:1 Bb5:1 Eb6:2 | D6:2 B5:2 | Ab5:1 C6:1 Eb6:1 C6:1 | Bb5:1 D6:1 F6:1 D6:1 | Eb6:2 G5:2 | G5:1 B5:1 D6:1 F6:1';
        var R = 'C6:2 Eb6:2 | D6:2 F6:2 | E6:4 | G5:2 C6:2 | Ab5:1 C6:1 Eb6:2 | Bb5:1 D6:1 F6:2 | E6:2 G6:2 | C6:4';
        var a = 'Cm Ab Fm G', b = 'Ab Bb Eb G';
        return [
          { bars: 4, chords: a, second: bell(4), pad: { octave: 3 } },
          { bars: 8, chords: a, lead: A, second: bell(8), pad: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time' } },
          { bars: 8, chords: a, lead: A, second: bell(8), pad: { octave: 3 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'half time', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, pad: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, second: bell(8), pad: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'boss double kick', fill_every: 8 } },
          { bars: 8, chords: 'Ab Bb C C', lead: R, second: { style: 'up', step: 0.5, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'calm' } },
          { bars: 4, chords: 'C C C C', lead: 'C6:16', pad: { octave: 3 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 5, slug: 'supply-lines', title: 'Supply Lines', subtitle: 'The trucks keep rolling', key: 'G', mode: 'major', tempo: 132,
      about: 'When supply is threatened, coordination keeps food and fuel moving to every town. Bright and driving: the nation looking after its own.',
      instruments: { lead: 'square lead', second: 'chip arp', bass: 'saw bass', pad: 'soft pad' },
      sections: (function () {
        var A = 'D5:1 G5:1 B5:1.5 A5:0.5 | A5:1 F#5:1 D5:2 | E5:1 G5:1 B5:1 E6:1 | D6:1 C6:1 G5:2 | B5:1 D6:1 G6:1.5 F#6:0.5 | F#6:1 E6:1 D6:2 | E6:1 D6:1 B5:1 G5:1 | A5:2 G5:2';
        var Bm = 'E5:0.5 G5:0.5 C6:1 E6:1 C6:1 | F#5:0.5 A5:0.5 D6:1 F#6:1 D6:1 | G6:2 D6:1 B5:1 | E6:2 B5:2 | E6:1 G6:1 E6:1 C6:1 | D6:1 F#6:1 A6:1 F#6:1 | G6:4 | r:2 D6:1 B5:1';
        var Br = 'B5:4 | C6:4 | B5:2 D6:2 | A5:4 | E6:4 | E6:2 C6:2 | D6:2 B5:2 | A5:2 F#5:2';
        var a = 'G D Em C', b = 'C D G Em C D G G';
        return [
          { bars: 4, chords: a, second: { style: 'up', step: 0.25, octave: 4, vol: 67 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'chiptune march' } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 0.25, octave: 4, vol: 50 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'updown', step: 0.25, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 0.25, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'updown', step: 0.25, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4 } },
          { bars: 8, chords: 'Em C G D', lead: Br, second: { style: 'broken', step: 0.5, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'updown', step: 0.25, octave: 4, vol: 55 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'C D G G', lead: 'E6:4 | F#6:4 | G6:8', pad: { octave: 3 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    },
    {
      n: 6, slug: 'hearth', title: 'Hearth', subtitle: 'A waltz for home and tradition', key: 'F', mode: 'major', tempo: 88, beatsPerBar: 3,
      about: 'A gentle waltz on plucked strings and organ, for family, faith and the customs handed down.',
      instruments: { lead: 'pluck', second: 'fm electric piano', bass: 'triangle bass', pad: 'organ' },
      sections: (function () {
        var A = 'C5:1 F5:1 A5:1 | Bb5:2 A5:0.5 G5:0.5 | A5:1 F5:1 C5:1 | G5:3 | A5:1 C6:1 A5:1 | D6:2 C6:0.5 Bb5:0.5 | A5:1 G5:1 F5:1 | E5:2 C5:1';
        var Bm = 'D5:1 F5:1 A5:1 | Bb5:1.5 A5:0.5 F5:1 | C6:2 A5:1 | G5:2 E5:1 | F5:1 A5:1 D6:1 | D6:1.5 C6:0.5 Bb5:1 | A5:1 C6:1 F5:1 | E5:1 G5:1 C6:1';
        var a = 'F Bb F C', b = 'Dm Bb F C';
        return [
          { bars: 4, chords: a, second: { style: 'up', step: 1, octave: 4, vol: 50 }, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 1, octave: 4, vol: 40 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 8, chords: a, lead: A, second: { style: 'broken', step: 0.5, octave: 4, vol: 40 }, pad: { octave: 3, vol: 50 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'updown', step: 0.5, octave: 4, vol: 40 }, pad: { octave: 3, vol: 50 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 8, chords: a, lead: A, second: { style: 'broken', step: 0.5, octave: 4, vol: 40 }, pad: { octave: 3, vol: 50 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'up', step: 0.5, octave: 4, vol: 40 }, pad: { octave: 3, vol: 50 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 1, octave: 4, vol: 40 }, pad: { octave: 3, vol: 50 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 4, chords: 'F Bb F F', lead: 'A5:3 | Bb5:3 | A5:3 | F5:3', pad: { octave: 3, vol: 50 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 7, slug: 'viable-system', title: 'Viable System', subtitle: 'Systems within systems', key: 'D', mode: 'minor', tempo: 72,
      about: 'Stafford Beer\'s model of a system that governs itself, where every part is a whole and every whole a part. The melody answers itself in canon.',
      instruments: { lead: 'fm bell', second: 'fm electric piano', bass: 'triangle bass', pad: 'supersaw pad' },
      sections: (function () {
        var A = 'A5:1.5 F5:0.5 D5:2 | r:1 D6:1 C6:1 Bb5:1 | G5:3 r:1 | E5:1 G5:1 C6:2 | A5:1.5 F5:0.5 D5:2 | F5:1 Bb5:1 D6:2 | D6:1 C6:1 Bb5:1 G5:1 | E5:4';
        var canon = seq(A, 4, 4, -12).notes; // the same melody an octave lower, one bar behind
        var Bm = 'D6:2 F6:2 | C6:4 | Bb5:2 D6:2 | C#6:4 | F6:1 D6:1 Bb5:2 | A5:1 C6:1 F6:2 | G5:1 Bb5:1 D6:2 | E6:2 C#6:2';
        var a = 'Dm Bb Gm C', b = 'Bb F Gm A';
        return [
          { bars: 8, chords: a, pad: { octave: 3 }, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, lead: A, pad: { octave: 3 }, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, lead: A, second: { notes: canon }, pad: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'sparse' } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'up', step: 0.5, octave: 4, vol: 40 }, pad: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'calm' } },
          { bars: 8, chords: a, lead: A, second: { notes: canon }, pad: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'calm' } },
          { bars: 8, chords: 'Dm Bb Gm Dm', lead: 'D6:4 | r:4 | A5:4 | r:4 | F5:4 | r:4 | D5:8', pad: { octave: 3 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 8, slug: 'commonweal', title: 'Commonweal', subtitle: 'Finale', key: 'D', mode: 'major', tempo: 112,
      about: 'The Keystone theme returns in a major key: the common good, held in common.',
      instruments: { lead: 'square lead', second: 'chip arp', bass: 'triangle bass', pad: 'supersaw pad' },
      sections: (function () {
        var A = 'A4:1 D5:1 E5:1 F#5:1 | F#5:1.5 E5:0.5 C#5:1 A4:1 | B4:1 D5:1 F#5:1.5 E5:0.5 | E5:2 D5:1 B4:1 | D5:1 F#5:1 A5:1 D6:1 | C#6:1.5 B5:0.5 A5:1 E5:1 | F#5:1 G5:1 A5:1 B5:1 | A5:3 r:1';
        var Bm = 'B5:2 D6:2 | C#6:2 E6:2 | F#6:1.5 E6:0.5 C#6:2 | D6:3 r:1 | B5:1 D6:1 G6:2 | E6:1 C#6:1 A5:2 | D6:4 | r:2 F#5:1 A5:1';
        var a = 'D A Bm G', b = 'G A F#m Bm G A D D';
        return [
          { bars: 4, chords: 'D G D A', pad: { octave: 3 }, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, lead: A, second: { style: 'up', step: 0.5, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time' } },
          { bars: 8, chords: a, lead: A, second: { style: 'updown', step: 0.25, octave: 4, vol: 50 }, pad: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'chiptune march', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'up', step: 0.25, octave: 4, vol: 55 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, second: { style: 'updown', step: 0.25, octave: 4, vol: 55 }, pad: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'up', step: 0.25, octave: 4, vol: 55 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, second: { style: 'updown', step: 0.25, octave: 5, vol: 55 }, pad: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'G A D D', lead: 'B5:4 | C#6:4 | D6:8', pad: { octave: 3 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    }
  ];

  root.CYM = { make: make, check: check, autoMix: autoMix, writeAlbum: writeAlbum, compose: compose, seq: seq, TRACKS: TRACKS };
})(window);
