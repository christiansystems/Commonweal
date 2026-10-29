/* Keystone: Stone by Stone. The official soundtrack, composed with Vigil Box's song tools (new_song, add_channel,
   set_instrument, generate_part, write_track, analyze_audio) and rendered with its BeepBox synth.

   Every track is played by a rock band: lead guitar, rhythm guitar, bass, keys and a layer of strings, choir,
   brass or organ, over a real drum kit. The sounds are BeepBox's own instruments, kept in
   assets/src/box/instruments.json. Melodies and guitar solos are written out note by note below; the rhythm
   guitar's power chords come from each section's chords and a strumming pattern, and the bass, keys, layer
   and drum parts come from Vigil Box's own generators.

   In the browser: await CYM.make(1) for one track, or await CYM.writeAlbum(await CYM.make('all')). */
(function (root) {
  'use strict';
  var NS = root.Amerika, B = root.beepbox;
  var ALBUM = 'Stone by Stone', ARTIST = 'Keystone', YEAR = '2026', RATE = 44100, LOUDNESS = -14;
  var INS = null; // instrument settings by name, loaded from assets/src/box/instruments.json

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
  function midiName(midi) { return NAMES[midi % 12] + (Math.floor(midi / 12) - 1); }

  // ---------------------------------------------------------------- the rhythm guitar
  // Power chords (root, fifth, octave) from E2 up to D#3, struck in one of these patterns: [start, length, volume].
  var RIFFS = {
    chug: [[0, 0.5, 100], [0.5, 0.5, 75], [1, 0.5, 100], [1.5, 0.5, 75], [2, 0.5, 100], [2.5, 0.5, 75], [3, 0.5, 100], [3.5, 0.5, 75]],
    gallop: [0, 1, 2, 3].reduce(function (a, b) { return a.concat([[b, 0.5, 100], [b + 0.5, 0.25, 75], [b + 0.75, 0.25, 75]]); }, []),
    push: [[0, 1.5, 100], [1.5, 1.5, 95], [3, 1, 90]],
    stab: [[0, 0.5, 100], [1.5, 0.5, 90], [2.5, 0.5, 90], [3, 0.5, 80]],
    half: [[0, 2, 100], [2, 2, 95]],
    whole: null // one chord held for the whole bar
  };
  function powerChords(chords, bars, bpb, riff, semis) {
    var list = chords.split(/\s+/).filter(Boolean), out = [];
    for (var b = 0; b < bars; b++) {
      var pc = PC[/^([A-G][#b]?)/.exec(list[b % list.length])[1]], r = 40 + (pc - 4 + 12) % 12 + (semis || 0);
      var notes = [r, r + 7, r + 12].map(midiName).join('/');
      (RIFFS[riff] || [[0, bpb, 100]]).forEach(function (h) { if (h[0] < bpb) out.push(notes + '@' + (b * bpb + h[0]) + '+' + Math.min(h[1], bpb - h[0]) + 'v' + h[2]); });
    }
    return out.join(' ');
  }

  // ---------------------------------------------------------------- arrangement
  // Channels: 1 lead, 2 rhythm, 3 bass, 4 keys, 5 layer, 6 drums. A track is a list of sections; each section
  // names its chords and what each part plays. `write` puts written-out notes on any channel (a canon, a bell, a
  // melody on the piano), as a note string or {notes, offset (beats), shift (semitones)}.
  var CH = { lead: 1, rhythm: 2, bass: 3, keys: 4, layer: 5 }, DRUMS = 6;
  function instrument(name) {
    if (INS[name]) return JSON.parse(JSON.stringify(INS[name]));
    return name; // otherwise one of Vigil Box's own presets
  }
  async function compose(def) {
    var host = makeHost(), tools = NS.songtools.create(B, host), bpb = def.beatsPerBar || 4;
    var run = function (name, input) { return tools.run(name, input); };
    var total = def.sections.reduce(function (n, s) { return n + s.bars; }, 0) + 1; // +1 bar for the reverb tail
    await run('new_song', { layout: 'standard', key: def.key, scale: 'expert', tempo: def.tempo, bars: total, beats_per_bar: bpb });
    await run('add_channel', { type: 'pitch', octave: 3 });
    await run('add_channel', { type: 'pitch', octave: 3 });
    for (var part in CH) {
      var ins = instrument(def.instruments[part]);
      if (part === 'rhythm' && typeof ins === 'object') ins.chord = 'simultaneous'; // power chords hit as one
      await run('set_instrument', typeof ins === 'string' ? { channel: CH[part], preset: ins } : { channel: CH[part], settings: ins });
    }
    await run('set_instrument', { channel: DRUMS, settings: instrument('rock kit') });
    for (var c in def.volumes || {}) await run('set_instrument', { channel: c === 'drums' ? DRUMS : +c, settings: { volume: def.volumes[c] } });

    var bar = 1, warnings = [];
    async function write(ch, notes, bars) { var r = await run('write_track', { channel: ch, start_bar: bar, bars: bars, notes: notes }); if (r.warnings) warnings = warnings.concat(r.warnings); }
    for (var k = 0; k < def.sections.length; k++) {
      var s = def.sections[k];
      var gen = function (ch, o) { return run('generate_part', Object.assign({ channel: ch, progression: s.chords, bars: s.bars, start_bar: bar }, o)); };
      if (s.lead) await write(1, seq(s.lead, bpb, 0, s.leadShift || 0).notes, s.bars);
      if (s.rhythm && s.rhythm.riff) await write(2, powerChords(s.chords, s.bars, bpb, s.rhythm.riff, s.rhythm.shift), s.bars);
      else if (s.rhythm) await gen(2, Object.assign({ kind: 'arpeggio' }, s.rhythm));
      if (s.bass) await gen(3, Object.assign({ kind: 'bass' }, s.bass));
      if (s.keys) await gen(4, Object.assign({ kind: 'pad' }, s.keys));
      if (s.layer) await gen(5, Object.assign({ kind: 'pad' }, s.layer));
      for (var w in s.write || {}) {
        var v = s.write[w];
        await write(+w, typeof v === 'string' ? (v.indexOf('@') > 0 ? v : seq(v, bpb).notes) : seq(v.notes, bpb, v.offset || 0, v.shift || 0).notes, s.bars);
      }
      if (s.drums) await gen(DRUMS, Object.assign({ kind: 'drums' }, s.drums));
      bar += s.bars;
    }
    return { host: host, tools: tools, warnings: warnings };
  }

  // ---------------------------------------------------------------- mastering and files
  function master(L, R) {
    // match loudness across the album, then a soft knee keeps peaks under -1 dBFS
    var sum = 0, n = L.length;
    for (var i = 0; i < n; i++) sum += L[i] * L[i] + R[i] * R[i];
    var rms = Math.sqrt(sum / (2 * n)), gain = Math.pow(10, LOUDNESS / 20) / Math.max(rms, 1e-9), ceil = Math.pow(10, -1 / 20), knee = 0.7;
    function soft(x) { x *= gain; var a = Math.abs(x); if (a <= knee) return x; return Math.sign(x) * (knee + (ceil - knee) * Math.tanh((a - knee) / (ceil - knee))); }
    var fade = Math.floor(RATE * 0.4), peak = 0;
    for (i = 0; i < n; i++) {
      var f = i > n - fade ? (n - i) / fade : 1;
      L[i] = soft(L[i]) * f; R[i] = soft(R[i]) * f;
      peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    return { gainDb: +(20 * Math.log10(gain)).toFixed(1), peakDbfs: +(20 * Math.log10(peak)).toFixed(2), rmsDbfs: LOUDNESS };
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
    var parts = [].concat(textFrame('TIT2', meta.title), textFrame('TPE1', ARTIST), textFrame('TALB', ALBUM), textFrame('TRCK', meta.n + '/' + TRACKS.length),
      textFrame('TYER', YEAR), textFrame('TCON', 'Rock'), textFrame('TCOP', '2026 The Keystone contributors, Keystone License 1.0 (GPL-3.0-only)'));
    if (cover) { var head = new TextEncoder().encode('\0image/png\0\x03Cover\0'); var body = new Uint8Array(head.length + cover.length); body.set(head); body.set(cover, head.length); parts = parts.concat(frame('APIC', body)); }
    var size = parts.reduce(function (n, p) { return n + p.length; }, 0), h = new Uint8Array(10);
    h.set([73, 68, 51, 3, 0, 0, size >>> 21 & 127, size >>> 14 & 127, size >>> 7 & 127, size & 127]);
    return [h].concat(parts);
  }
  function wavBytes(L, R) { return NS.audio.encodeWav(L, R, RATE); }

  // Mix targets in dB relative to the reference part (the lead guitar unless a track says otherwise), measured
  // with Vigil Box's analyze_audio over the whole track.
  var MIX = { 2: -3, 3: -6, 4: -8, 5: -8, drums: -3 };
  /** Measure each channel and move its volume towards the target, damped (about 0.13 dB per volume step,
      steeper below -20, and -40 mutes, so steps are capped and the floor is -20). Repeats until within 1 dB. */
  async function autoMix(def, passes) {
    var targets = Object.assign({}, MIX, def.mix || {}), ref = def.ref || 1;
    def.volumes = {};
    for (var p = 0; p < (passes || 8); p++) {
      var c = await compose(def), a = await c.tools.run('analyze_audio', { per_channel: true, max_seconds: 240 });
      var j = c.tools.snapshot(), refDb = a.channels.filter(function (ch) { return ch.channel === ref; })[0].rmsDbfs, worst = 0, short = 0;
      a.channels.forEach(function (ch) {
        var key = ch.channel === DRUMS ? 'drums' : ch.channel;
        if (ch.channel === ref || targets[key] === undefined || ch.rmsDbfs < -100) return;
        var cur = j.channels[ch.channel - 1].instruments[0].volume, err = refDb + targets[key] - ch.rmsDbfs;
        worst = Math.max(worst, Math.abs(err));
        if (cur >= 100 && err > 1) short = Math.max(short, err); // already as loud as it goes
        def.volumes[key] = Math.round(Math.max(-20, Math.min(100, cur + Math.max(-25, Math.min(25, err / 0.13)))));
      });
      // when a part can't get any louder, turn the reference part down instead
      if (short) def.volumes[ref] = Math.round(Math.max(-20, j.channels[ref - 1].instruments[0].volume - Math.min(25, short / 0.13)));
      if (worst < 1) break;
    }
    return def.volumes;
  }
  async function load() { if (!INS) INS = (await (await fetch('/assets/src/box/instruments.json')).json()).instruments; }
  /** Compose a track and report each channel's loudness (dBFS RMS), without rendering files. */
  async function check(n) {
    await load();
    var c = await compose(TRACKS[n - 1]), a = await c.tools.run('analyze_audio', { per_channel: true, max_seconds: 240 });
    return TRACKS[n - 1].title + ': ' + a.channels.map(function (ch) { return ch.channel + '=' + ch.rmsDbfs; }).join(' ') + ' | ' + a.advice.join(' ') + (c.warnings.length ? ' | ' + c.warnings.slice(0, 5).join('; ') : '');
  }
  async function make(which) {
    await load();
    var list = which === 'all' ? TRACKS : TRACKS.filter(function (t) { return t.n === which || t.slug === which; });
    var cr = await fetch('/assets/music/keystone-soundtrack-cover-600.png'), cover = cr.ok ? new Uint8Array(await cr.arrayBuffer()) : null, results = [];
    for (var k = 0; k < list.length; k++) {
      var t = list[k], t0 = Date.now(), name = String(t.n).padStart(2, '0') + '-' + t.slug;
      await autoMix(t);
      var c = await compose(t);
      var analysis = await c.tools.run('analyze_audio', { per_channel: true, max_seconds: 240 });
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
    var album = { title: ALBUM, artist: ARTIST, year: YEAR, license: 'Keystone License 1.0 (GPL-3.0-only)', made_with: 'Vigil Box (BeepBox 4.2.2 synth and instruments) by VigilTech; composed in tools/studio/music.js',
      cover: 'keystone-soundtrack-cover-3000.png', sampleRate: RATE, mastering: 'RMS matched to ' + LOUDNESS + ' dBFS, soft knee limiting under -1 dBFS',
      tracks: results.map(function (r) { var t = TRACKS[r.n - 1]; return { n: r.n, id: r.id, title: r.title, subtitle: t.subtitle, about: t.about, key: r.key, bpm: r.bpm, beatsPerBar: r.beatsPerBar, seconds: r.seconds, instruments: t.instruments, mp3: 'mp3/' + r.id + '.mp3', source: '../src/box/' + r.id + '.song.json' }; }) };
    await save('music/album.json', JSON.stringify(album, null, 2));
    return album;
  }

  // ---------------------------------------------------------------- the thirteen tracks
  var TRACKS = [
    {
      n: 1, slug: 'keystone', title: 'Keystone', subtitle: 'Theme of Keystone', key: 'D', mode: 'minor', tempo: 112,
      about: 'The main theme, for the stone that holds the arch. A guitar riff, then the theme low and steady, a chorus that lifts, a solo, and the theme again an octave higher with strings and organ behind it.',
      instruments: { lead: 'distortion guitar', rhythm: 'overdrive guitar', bass: 'picked bass', keys: 'rock organ', layer: 'strings' },
      sections: (function () {
        var A = 'A4:1 D5:1 E5:1 F5:1 | F5:1.5 E5:0.5 D5:1 Bb4:1 | C5:1 F5:1 A5:1.5 G5:0.5 | G5:2 E5:1 C5:1 | D5:1 F5:1 A5:1 D6:1 | D6:1.5 C6:0.5 Bb5:1 F5:1 | A5:1 G5:1 F5:1 E5:1 | E5:3 r:1';
        var Bm = 'D5:2 F5:1 Bb5:1 | A5:2 F5:1 C5:1 | E5:1 G5:1 C6:1 G5:1 | A5:3 r:1 | Bb5:1 A5:1 G5:1 D5:1 | F5:1.5 G5:0.5 F5:1 D5:1 | E5:1 G5:1 C6:1.5 Bb5:0.5 | A5:2 C#5:1 E5:1';
        var riff = 'D4:0.5 A4:0.5 D5:0.5 A4:0.5 F5:0.5 A4:0.5 E5:0.5 A4:0.5 | D4:0.5 Bb4:0.5 D5:0.5 Bb4:0.5 F5:0.5 Bb4:0.5 D5:0.5 Bb4:0.5 | C4:0.5 A4:0.5 C5:0.5 A4:0.5 F5:0.5 A4:0.5 C5:0.5 A4:0.5 | C4:0.5 G4:0.5 C5:0.5 G4:0.5 E5:0.5 G4:0.5 C5:0.5 E5:0.5';
        var solo = 'D5:0.25 F5:0.25 G5:0.25 A5:0.25 C6:0.5 A5:0.5 G5:0.5 F5:0.5 D5:1 | F5:0.5 Bb5:0.5 D6:1 C6:0.5 Bb5:0.5 A5:1 | A5:0.25 C6:0.25 A5:0.25 F5:0.25 A5:0.25 C6:0.25 F6:0.5 E6:0.5 C6:0.5 A5:1 | G5:1.5 E5:0.5 C5:1 E5:0.5 G5:0.5 | ' +
          'D6:0.5 C6:0.25 A5:0.25 C6:0.5 A5:0.25 G5:0.25 A5:0.5 G5:0.25 F5:0.25 D5:1 | D5:0.25 F5:0.25 Bb5:0.25 D6:0.25 F6:1 D6:0.5 Bb5:0.5 F5:1 | C6:0.25 A5:0.25 F5:0.25 A5:0.25 C6:0.25 F6:0.25 A6:0.5 G6:0.5 F6:0.5 E6:1 | G6:2 E6:1 C6:1';
        var a = 'Dm Bb F C', b = 'Bb F C Dm Gm Bb C A';
        return [
          { bars: 4, chords: a, rhythm: { riff: 'whole' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'half time' } },
          { bars: 4, chords: a, lead: riff, rhythm: { riff: 'chug' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'stab' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4 } },
          { bars: 8, chords: a, lead: solo, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 8, chords: a, lead: A, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 8 } },
          { bars: 4, chords: 'Dm Bb C Dm', lead: 'D5:4 | D5:2 F5:2 | E5:4 | D5:4', rhythm: { riff: 'whole' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    },
    {
      n: 2, slug: 'dignity', title: 'Dignity', subtitle: 'Made in the image of God', key: 'E', mode: 'minor', tempo: 140,
      about: 'Hard rock for the worth of every person, which no state, market or machine can take away. Twin distorted guitars, a galloping verse and a brass-backed chorus.',
      instruments: { lead: 'distortion guitar', rhythm: 'distortion guitar', bass: 'picked bass', keys: 'rock organ', layer: 'brass section' },
      sections: (function () {
        var A = 'E5:0.5 E5:0.5 G5:0.5 E5:0.5 B5:1 A5:0.5 G5:0.5 | F#5:0.5 G5:0.5 E5:1 r:1 B4:0.5 D5:0.5 | F#5:0.5 F#5:0.5 A5:0.5 F#5:0.5 D6:1 C6:0.5 B5:0.5 | C6:1 B5:0.5 G5:0.5 E5:1 r:1 | ' +
          'E5:0.5 E5:0.5 G5:0.5 E5:0.5 B5:1 A5:0.5 G5:0.5 | F#5:0.5 G5:0.5 B5:1 E6:1 D6:0.5 B5:0.5 | A5:0.5 F#5:0.5 D5:0.5 F#5:0.5 A5:1 D6:1 | E6:2 r:2';
        var Bm = 'A5:1.5 C6:0.5 B5:1 A5:1 | G5:1.5 E5:0.5 G5:1 C6:1 | F#5:1.5 A5:0.5 D6:1 C6:1 | B5:2 D#5:1 F#5:1 | A5:1 E6:1 D6:1 C6:1 | B5:1 G5:1 E5:1 G5:1 | A5:1 D6:1 F#6:1 E6:0.5 D6:0.5 | D#6:2 B5:2';
        var riff = 'E4:0.5 E4:0.5 G4:0.5 E4:0.5 A4:0.5 E4:0.5 B4:0.5 A4:0.5 | E4:0.5 E4:0.5 G4:0.5 E4:0.5 D5:0.5 B4:0.5 A4:0.5 G4:0.5 | D4:0.5 D4:0.5 F#4:0.5 D4:0.5 A4:0.5 D4:0.5 B4:0.5 A4:0.5 | C4:0.5 C4:0.5 E4:0.5 C4:0.5 G4:0.5 E4:0.5 B4:1';
        var solo = 'E5:0.25 G5:0.25 A5:0.25 B5:0.25 D6:0.5 B5:0.5 A5:0.5 G5:0.5 E5:1 | B5:0.25 D6:0.25 E6:0.5 D6:0.25 B5:0.25 A5:0.5 B5:0.5 G5:0.5 E5:1 | F#5:0.5 A5:0.5 D6:0.5 F#6:0.5 E6:0.25 D6:0.25 A5:0.5 F#5:1 | G5:0.25 C6:0.25 E6:0.25 G6:0.25 E6:0.5 C6:0.5 B5:2 | ' +
          'E6:0.25 D6:0.25 B5:0.25 A5:0.25 G5:0.25 A5:0.25 B5:0.5 D6:0.5 E6:0.5 G6:1 | G6:0.5 E6:0.5 D6:0.5 B5:0.5 D6:0.25 E6:0.25 D6:0.25 B5:0.25 A5:1 | A5:0.25 D6:0.25 F#6:0.25 A6:0.25 F#6:0.25 D6:0.25 A5:0.25 F#5:0.25 D6:2 | E6:1 G6:1 B6:2';
        var a = 'Em Em D C', b = 'Am C D B';
        return [
          { bars: 4, chords: a, lead: riff },
          { bars: 4, chords: a, lead: riff, rhythm: { riff: 'chug' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'gallop' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4 } },
          { bars: 8, chords: a, lead: solo, rhythm: { riff: 'gallop' }, keys: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'Em C D Em', lead: 'E5:0.5 E5:0.5 G5:0.5 E5:0.5 B5:2 | C6:4 | D6:4 | E6:4', rhythm: { riff: 'whole' }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'half time' } }
        ];
      })()
    },
    {
      n: 3, slug: 'shoulder-to-shoulder', title: 'Shoulder to Shoulder', subtitle: 'Solidarity', key: 'A', mode: 'minor', tempo: 150,
      about: 'Fast, loud and together: a punk-rock anthem for solidarity, where the strong stand with the weak. Power chords all the way through, and a choir on every chorus.',
      instruments: { lead: 'overdrive guitar', rhythm: 'distortion guitar', bass: 'fingered bass', keys: 'grand piano', layer: 'choir soprano' },
      sections: (function () {
        var A = 'A4:0.75 C5:0.75 E5:0.5 A5:1 G5:0.5 E5:0.5 | F5:0.75 A5:0.75 C6:0.5 A5:1 F5:1 | G5:0.75 E5:0.75 C5:0.5 E5:1 G5:1 | D5:1 G5:1 B5:1 D6:1 | ' +
          'A4:0.75 C5:0.75 E5:0.5 A5:1 G5:0.5 E5:0.5 | F5:0.75 A5:0.75 C6:0.5 F6:1 E6:1 | E6:0.75 D6:0.75 C6:0.5 G5:1 E5:1 | D5:2 B4:2';
        var Bm = 'C6:2 A5:1 F5:1 | B5:2 G5:1 D5:1 | E5:1 G5:1 B5:1 E6:1 | C6:3 r:1 | A5:1 C6:1 F6:1 C6:1 | D6:1 B5:1 G5:1 B5:1 | G5:1 B5:1 E6:1.5 D6:0.5 | C6:2 A5:2';
        var riff = 'A4:0.5 A4:0.5 C5:0.5 A4:0.5 E5:1 D5:0.5 C5:0.5 | F4:0.5 F4:0.5 A4:0.5 F4:0.5 C5:1 A4:1 | C5:0.5 C5:0.5 E5:0.5 C5:0.5 G5:1 E5:0.5 D5:0.5 | G4:0.5 G4:0.5 B4:0.5 D5:0.5 G5:2';
        var solo = 'A5:0.5 C6:0.5 E6:1 D6:0.5 C6:0.5 A5:1 | A5:0.25 C6:0.25 F6:0.5 E6:0.5 C6:0.5 A5:0.5 F5:0.5 A5:1 | G5:0.25 C6:0.25 E6:0.25 G6:0.25 E6:0.5 C6:0.5 G5:1 E5:1 | D6:0.5 B5:0.5 G5:0.5 B5:0.5 D6:1 G6:1 | ' +
          'A6:0.25 G6:0.25 E6:0.25 D6:0.25 C6:0.25 D6:0.25 E6:0.5 C6:0.5 A5:0.5 E6:1 | F6:1 E6:0.5 C6:0.5 A5:1 C6:1 | E6:0.25 D6:0.25 C6:0.25 G5:0.25 E5:0.25 G5:0.25 C6:0.5 E6:1 G6:1 | D6:1 B5:1 G6:2';
        var a = 'Am F C G', b = 'F G Em Am';
        return [
          { bars: 4, chords: a, lead: riff, rhythm: { riff: 'chug' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'chug' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'chug' }, keys: { octave: 4 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'four on the floor', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'chug' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'chug' }, keys: { octave: 4 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'four on the floor', fill_every: 4 } },
          { bars: 4, chords: a, rhythm: { riff: 'whole' }, keys: { kind: 'arpeggio', style: 'up', step: 0.25, octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } },
          { bars: 8, chords: a, lead: solo, rhythm: { riff: 'chug' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'chug' }, keys: { octave: 4 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'four on the floor', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'F G Am Am', lead: 'C6:4 | B5:4 | A5:4 | A5:4', rhythm: { riff: 'whole' }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    },
    {
      n: 4, slug: 'cry-of-the-poor', title: 'Cry of the Poor', subtitle: 'The first claim on our care', key: 'C', mode: 'minor to major', tempo: 96,
      about: 'A tolling bell, a heavy guitar and a pipe organ. The poor cry out, and the cry goes straight to those who can answer. In the last section it is answered, and the music turns from C minor to C major.',
      instruments: { lead: 'distortion guitar', rhythm: 'overdrive guitar', bass: 'picked bass', keys: 'tubular bell', layer: 'pipe organ' },
      sections: (function () {
        var bell = function (bars) { var s = []; for (var i = 0; i < bars; i += 2) s.push('G5:0.5 C6:0.5 r:1 G5:0.5 C6:0.5 r:1 | r:4'); return seq(s.join(' | '), 4).notes; };
        var A = 'G4:2 C5:1 Eb5:1 | Eb5:1.5 D5:0.5 C5:2 | F5:2 Ab5:1 G5:0.5 F5:0.5 | G5:3 B4:1 | C5:1 Eb5:1 G5:1 C6:1 | C6:1.5 Bb5:0.5 Ab5:2 | Ab5:1 G5:1 F5:1 D5:1 | B4:2 D5:1 G5:1';
        var Bm = 'C6:2 Eb6:2 | D6:2 Bb5:2 | G5:1 Bb5:1 Eb6:2 | D6:2 B5:2 | Ab5:1 C6:1 Eb6:1 C6:1 | Bb5:1 D6:1 F6:1 D6:1 | Eb6:2 G5:2 | G5:1 B5:1 D6:1 F6:1';
        var R = 'C6:2 Eb6:2 | D6:2 F6:2 | E6:4 | G5:2 C6:2 | Ab5:1 C6:1 Eb6:2 | Bb5:1 D6:1 F6:2 | E6:2 G6:2 | C6:4';
        var solo = 'C5:0.5 Eb5:0.5 G5:1 F5:0.5 Eb5:0.5 C5:1 | Eb5:0.25 Ab5:0.25 C6:0.5 Bb5:0.5 Ab5:0.5 G5:1 Eb5:1 | F5:0.25 Ab5:0.25 C6:0.25 F6:0.25 Eb6:0.5 C6:0.5 Ab5:1 F5:1 | G5:0.5 B5:0.5 D6:1 F6:1 D6:1 | ' +
          'C6:0.25 D6:0.25 Eb6:0.25 G6:0.25 Eb6:0.5 C6:0.5 G5:2 | Ab5:0.5 C6:0.5 Eb6:1 C6:1 Ab5:1 | F6:0.25 Eb6:0.25 C6:0.25 Ab5:0.25 F5:0.25 Ab5:0.25 C6:0.5 F6:1 Eb6:1 | D6:1 B5:1 G5:1 B5:1';
        var a = 'Cm Ab Fm G', b = 'Ab Bb Eb G';
        return [
          { bars: 4, chords: a, write: { 4: bell(4) }, layer: { octave: 3 } },
          { bars: 8, chords: a, lead: A, write: { 4: bell(8) }, rhythm: { riff: 'whole' }, layer: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time' } },
          { bars: 8, chords: a, lead: A, write: { 4: bell(8) }, rhythm: { riff: 'stab' }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'half time', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, layer: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: solo, write: { 4: bell(8) }, rhythm: { riff: 'chug' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'boss double kick', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, layer: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 8, chords: 'Ab Bb C C', lead: R, keys: { kind: 'arpeggio', style: 'up', step: 0.5, octave: 4 }, rhythm: { riff: 'whole' }, layer: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'calm' } },
          { bars: 4, chords: 'C C C C', lead: 'C6:16', rhythm: { riff: 'whole' }, layer: { octave: 3 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 5, slug: 'working-hands', title: 'Working Hands', subtitle: 'Work is a vocation', key: 'G', mode: 'major', tempo: 132,
      about: 'Bright, driving rock with a Hammond-style organ and a brass section, for the dignity of work and a just wage. Every job done well builds the nation.',
      instruments: { lead: 'overdrive guitar', rhythm: 'distortion guitar', bass: 'picked bass', keys: 'rock organ', layer: 'brass section' },
      sections: (function () {
        var A = 'D5:1 G5:1 B5:1.5 A5:0.5 | A5:1 F#5:1 D5:2 | E5:1 G5:1 B5:1 E6:1 | D6:1 C6:1 G5:2 | B5:1 D6:1 G6:1.5 F#6:0.5 | F#6:1 E6:1 D6:2 | E6:1 D6:1 B5:1 G5:1 | A5:2 G5:2';
        var Bm = 'E5:0.5 G5:0.5 C6:1 E6:1 C6:1 | F#5:0.5 A5:0.5 D6:1 F#6:1 D6:1 | G6:2 D6:1 B5:1 | E6:2 B5:2 | E6:1 G6:1 E6:1 C6:1 | D6:1 F#6:1 A6:1 F#6:1 | G6:4 | r:2 D6:1 B5:1';
        var Br = 'B5:4 | C6:4 | B5:2 D6:2 | A5:4 | E6:4 | E6:2 C6:2 | D6:2 B5:2 | A5:2 F#5:2';
        var solo = 'G5:0.5 B5:0.5 D6:1 B5:0.5 A5:0.5 G5:1 | F#5:0.25 A5:0.25 D6:0.5 E6:0.5 F#6:0.5 E6:0.5 D6:0.5 A5:1 | E6:0.25 D6:0.25 B5:0.25 G5:0.25 E5:0.5 G5:0.5 B5:1 E6:1 | C6:0.5 E6:0.5 G6:1 E6:1 D6:1 | ' +
          'B5:0.25 D6:0.25 G6:0.25 B6:0.25 A6:0.5 G6:0.5 D6:2 | A6:0.5 F#6:0.5 D6:0.5 A5:0.5 D6:0.25 E6:0.25 F#6:0.25 A6:0.25 F#6:1 | G6:0.5 E6:0.5 B5:0.5 E6:0.5 G6:1 B6:1 | C7:1 B6:1 A6:1 D6:1';
        var a = 'G D Em C', b = 'C D G Em C D G G';
        return [
          { bars: 4, chords: a, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'stab' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: 'Em C G D', lead: Br, rhythm: { riff: 'whole' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time', fill_every: 8 } },
          { bars: 8, chords: a, lead: solo, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'C D G G', lead: 'E6:4 | F#6:4 | G6:8', rhythm: { riff: 'whole' }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    },
    {
      n: 6, slug: 'hearth-and-home', title: 'Hearth and Home', subtitle: 'A waltz for the family', key: 'F', mode: 'major', tempo: 84, beatsPerBar: 3, ref: 4,
      mix: { 1: -3, 2: -5, 3: -6, 5: -7, drums: -7 },
      about: 'A power ballad in waltz time for the family, the first school of love. It begins with piano and acoustic guitar, then the strings come in and the electric guitar takes the melody home.',
      instruments: { lead: 'distortion guitar', rhythm: 'steel guitar', bass: 'fingered bass', keys: 'grand piano', layer: 'strings' },
      sections: (function () {
        var A = 'C5:1 F5:1 A5:1 | Bb5:2 A5:0.5 G5:0.5 | A5:1 F5:1 C5:1 | G5:3 | A5:1 C6:1 A5:1 | D6:2 C6:0.5 Bb5:0.5 | A5:1 G5:1 F5:1 | E5:2 C5:1';
        var Bm = 'D5:1 F5:1 A5:1 | Bb5:1.5 A5:0.5 F5:1 | C6:2 A5:1 | G5:2 E5:1 | F5:1 A5:1 D6:1 | D6:1.5 C6:0.5 Bb5:1 | A5:1 C6:1 F5:1 | E5:1 G5:1 C6:1';
        var a = 'F Bb F C', b = 'Dm Bb F C', arp = { style: 'broken', step: 0.5, octave: 3 };
        return [
          { bars: 4, chords: a, rhythm: { style: 'up', step: 1, octave: 3 }, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, write: { 4: A }, rhythm: arp, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, write: { 4: A }, rhythm: arp, layer: { octave: 4 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 8, chords: b, write: { 4: Bm }, rhythm: { style: 'updown', step: 0.5, octave: 3 }, layer: { octave: 4 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 8, chords: a, lead: A, rhythm: arp, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 8, chords: b, lead: Bm, rhythm: arp, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 8, chords: a, lead: A, write: { 4: A }, rhythm: arp, layer: { octave: 4 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'waltz' } },
          { bars: 4, chords: 'F Bb F F', write: { 4: 'A5:3 | Bb5:3 | A5:3 | F5:3' }, rhythm: { style: 'up', step: 1, octave: 3 }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 7, slug: 'free-to-believe', title: 'Free to Believe', subtitle: 'Religious liberty for all', key: 'A', mode: 'major', tempo: 120,
      about: 'An open-hearted anthem for religious liberty. Faith cannot be forced, so every faith, and none, is free. Ringing guitars, piano and a choir that keeps rising.',
      instruments: { lead: 'distortion guitar', rhythm: 'overdrive guitar', bass: 'picked bass', keys: 'grand piano', layer: 'choir soprano' },
      sections: (function () {
        var A = 'E5:1 A5:1 C#6:1 B5:0.5 A5:0.5 | B5:2 G#5:1 E5:1 | F#5:1 A5:1 C#6:1.5 B5:0.5 | A5:2 F#5:2 | E5:1 A5:1 C#6:1 E6:1 | E6:1.5 D6:0.5 B5:1 G#5:1 | A5:1 C#6:1 F#6:1 E6:1 | D6:2 C#6:1 B5:1';
        var Bm = 'F#6:2 E6:1 D6:1 | E6:2 C#6:2 | B5:1 E6:1 G#6:1 E6:1 | F#6:3 r:1 | D6:1 F#6:1 A6:1.5 F#6:0.5 | E6:1 C#6:1 A5:2 | B5:1 C#6:1 D6:1 E6:1 | E6:2 G#5:2';
        var riff = 'A4:0.5 E5:0.5 A5:0.5 E5:0.5 C#5:1 E5:1 | B4:0.5 E5:0.5 G#5:0.5 E5:0.5 B5:2 | A4:0.5 C#5:0.5 F#5:0.5 C#5:0.5 A5:1 F#5:1 | D5:0.5 F#5:0.5 A5:0.5 F#5:0.5 D6:2';
        var solo = 'A5:0.25 B5:0.25 C#6:0.25 E6:0.25 F#6:0.5 E6:0.5 C#6:1 A5:1 | B5:0.5 E6:0.5 G#6:1 F#6:0.5 E6:0.5 B5:1 | C#6:0.25 E6:0.25 F#6:0.25 A6:0.25 F#6:0.5 E6:0.5 C#6:2 | D6:0.5 F#6:0.5 A6:1 F#6:1 E6:1 | ' +
          'E6:0.25 C#6:0.25 B5:0.25 A5:0.25 C#6:0.5 E6:0.5 A6:2 | G#6:0.5 F#6:0.5 E6:0.5 B5:0.5 E6:1 G#6:1 | A6:0.25 F#6:0.25 E6:0.25 C#6:0.25 A5:0.25 C#6:0.25 E6:0.5 F#6:1 A6:1 | F#6:1 E6:1 D6:1 E6:1';
        var a = 'A E F#m D', b = 'D A E F#m D A E E';
        return [
          { bars: 4, chords: a, lead: riff, rhythm: { riff: 'whole' }, bass: { style: 'whole', octave: 2 }, drums: { template: 'half time' } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'stab' }, keys: { kind: 'arpeggio', style: 'up', step: 0.5, octave: 4 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'chug' }, keys: { kind: 'arpeggio', style: 'up', step: 0.5, octave: 4 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: solo, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'D A E A', lead: 'F#6:4 | E6:4 | E6:2 G#6:2 | A6:4', rhythm: { riff: 'whole' }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    },
    {
      n: 8, slug: 'handed-down', title: 'Handed Down', subtitle: 'Tradition held in trust', key: 'E', mode: 'minor', tempo: 100,
      about: 'A heavy, rolling groove with a rock organ, for the customs, crafts and faith our parents gave us. We keep what is good and hand it on.',
      instruments: { lead: 'distortion guitar', rhythm: 'distortion guitar', bass: 'fingered bass', keys: 'rock organ', layer: 'strings' },
      sections: (function () {
        var A = 'E5:1.5 G5:0.5 B5:1 A5:0.5 G5:0.5 | F#5:2 D5:1 E5:1 | E5:1 G5:1 C6:1.5 B5:0.5 | B5:2 D#5:1 F#5:1 | E5:1 G5:1 B5:1 E6:1 | D6:1.5 C6:0.5 A5:1 F#5:1 | G5:1 E5:1 C5:1 E5:1 | D#5:2 F#5:1 B5:1';
        var Bm = 'G5:1 C6:1 E6:2 | D6:1.5 B5:0.5 G5:2 | A5:1 D6:1 F#6:1 E6:1 | E6:3 r:1 | E6:1 G6:1 E6:1 C6:1 | D6:1 B5:1 G5:1 B5:1 | F#6:2 D#6:1 B5:1 | B5:3 r:1';
        var riff = 'E4:0.75 E4:0.25 G4:0.5 E4:0.5 A4:0.5 G4:0.5 E4:1 | D4:0.75 D4:0.25 F#4:0.5 D4:0.5 A4:1 F#4:1 | C4:0.75 C4:0.25 E4:0.5 C4:0.5 G4:1 E4:1 | B3:0.75 B3:0.25 D#4:0.5 F#4:0.5 B4:2';
        var solo = 'E5:0.25 G5:0.25 A5:0.25 Bb5:0.25 B5:1 D6:0.5 B5:0.5 G5:1 | A5:0.5 D6:0.5 F#6:1 E6:0.5 D6:0.5 A5:1 | G5:0.25 C6:0.25 E6:0.25 G6:0.25 E6:1 C6:1 G5:1 | F#6:0.5 D#6:0.5 B5:1 A5:0.5 F#5:0.5 D#5:1 | ' +
          'B5:0.25 D6:0.25 E6:0.25 G6:0.25 E6:0.5 D6:0.5 B5:2 | A6:0.5 F#6:0.5 D6:0.5 A5:0.5 F#6:2 | G6:0.25 E6:0.25 C6:0.25 G5:0.25 E6:0.5 G6:0.5 C7:2 | B6:1 A6:1 F#6:1 D#6:1';
        var a = 'Em D C B', b = 'C G D Em C G B B';
        return [
          { bars: 4, chords: a, lead: riff, keys: { octave: 3 } },
          { bars: 4, chords: a, lead: riff, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'half time', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'stab' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'half time', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: solo, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4 } },
          { bars: 4, chords: a, lead: riff, rhythm: { riff: 'gallop' }, keys: { octave: 3 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'C B Em Em', lead: 'E6:4 | D#6:4 | E6:8', rhythm: { riff: 'whole' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    },
    {
      n: 9, slug: 'town-district-nation', title: 'Town, District, Nation', subtitle: 'Every level in its place', key: 'D', mode: 'minor', tempo: 72, ref: 4,
      mix: { 1: -2, 2: -6, 3: -6, 5: -5, drums: -6 },
      about: 'One melody played as a round. The piano is the town; the strings answer a bar later, an octave lower, as the district; the guitar joins two bars later as the nation. Then the whole band rises together.',
      instruments: { lead: 'distortion guitar', rhythm: 'clean guitar', bass: 'fingered bass', keys: 'grand piano', layer: 'slow strings' },
      sections: (function () {
        var A = 'A5:1.5 F5:0.5 D5:2 | r:1 D6:1 C6:1 Bb5:1 | G5:3 r:1 | E5:1 G5:1 C6:2 | A5:1.5 F5:0.5 D5:2 | F5:1 Bb5:1 D6:2 | D6:1 C6:1 Bb5:1 G5:1 | E5:4';
        var a = 'Dm Bb Gm C', arp = { style: 'up', step: 0.5, octave: 3 };
        return [
          { bars: 4, chords: a, layer: { octave: 3 }, rhythm: arp, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, write: { 4: A }, rhythm: arp, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, write: { 4: A, 5: { notes: A, offset: 4, shift: -12 } }, rhythm: arp, bass: { style: 'half', octave: 2 }, drums: { template: 'sparse' } },
          { bars: 8, chords: a, write: { 4: A, 5: { notes: A, offset: 4, shift: -12 }, 2: { notes: A, offset: 8 } }, bass: { style: 'half', octave: 2 }, drums: { template: 'calm' } },
          { bars: 8, chords: a, lead: A, rhythm: arp, keys: { octave: 3 }, layer: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time', fill_every: 8 } },
          { bars: 8, chords: a, lead: A, write: { 5: { notes: A, offset: 4, shift: -12 } }, rhythm: arp, keys: { octave: 3 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: 'Dm Bb Gm Dm', write: { 4: 'D6:4 | r:4 | A5:4 | r:4 | F5:4 | r:4 | D5:8' }, layer: { octave: 3 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 10, slug: 'pilgrims', title: 'Pilgrims', subtitle: 'Strangers made at home', key: 'D', mode: 'major', tempo: 116,
      about: 'Folk rock for newcomers who take up the nation\'s language, laws and customs and are welcomed as equals. Acoustic guitar and piano at first, then the band and strings join in.',
      instruments: { lead: 'overdrive guitar', rhythm: 'steel guitar', bass: 'picked bass', keys: 'grand piano', layer: 'strings' },
      sections: (function () {
        var A = 'F#5:1 A5:1 D6:1.5 C#6:0.5 | B5:1 G5:1 D5:2 | D5:1 F#5:1 B5:1 A5:1 | A5:2 E5:2 | F#5:1 A5:1 D6:1 F#6:1 | E6:1.5 D6:0.5 B5:2 | D6:1 C#6:1 B5:1 F#5:1 | A5:3 r:1';
        var Bm = 'B5:1 D6:1 G6:2 | F#6:1.5 E6:0.5 D6:2 | C#6:1 E6:1 A6:1.5 G6:0.5 | F#6:3 r:1 | G6:1 F#6:1 E6:1 D6:1 | F#6:2 A5:2 | B5:1 C#6:1 D6:1 E6:1 | C#6:2 A5:2';
        var solo = 'D6:0.25 E6:0.25 F#6:0.25 A6:0.25 F#6:0.5 E6:0.5 D6:2 | B5:0.5 D6:0.5 G6:1 F#6:0.5 E6:0.5 D6:1 | F#6:0.25 E6:0.25 D6:0.25 B5:0.25 D6:0.5 F#6:0.5 B6:2 | A6:1 E6:1 C#6:1 A5:1 | ' +
          'F#5:0.5 A5:0.5 D6:0.5 F#6:0.5 A6:1 F#6:1 | G6:0.25 F#6:0.25 E6:0.25 D6:0.25 B5:0.5 D6:0.5 G6:2 | F#6:0.5 D6:0.5 B5:0.5 D6:0.5 F#6:1 B6:1 | A6:1 G6:1 E6:1 C#6:1';
        var a = 'D G Bm A', b = 'G D A Bm G D A A', arp = { style: 'up', step: 0.5, octave: 3 };
        return [
          { bars: 4, chords: a, rhythm: arp, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, write: { 4: A }, rhythm: arp, bass: { style: 'half', octave: 2 }, drums: { template: 'calm' } },
          { bars: 8, chords: b, lead: Bm, rhythm: { style: 'updown', step: 0.25, octave: 3 }, layer: { octave: 4 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: arp, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { style: 'updown', step: 0.25, octave: 3 }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: solo, rhythm: arp, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { style: 'updown', step: 0.25, octave: 3 }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'G D A D', lead: 'B5:4 | A5:4 | C#6:4 | D6:4', rhythm: { style: 'up', step: 1, octave: 3 }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 11, slug: 'care-for-creation', title: 'Care for Creation', subtitle: 'Stewards of the earth', key: 'E', mode: 'minor', tempo: 76,
      about: 'A slow, wide build for the earth we hold in trust for our children. Clean guitar and organ open it like a sunrise, and it ends with every instrument at full height.',
      instruments: { lead: 'distortion guitar', rhythm: 'clean guitar', bass: 'fingered bass', keys: 'grand piano', layer: 'pipe organ' },
      sections: (function () {
        var A = 'B5:2 E6:1 D6:1 | C6:2 G5:2 | B5:1 D6:1 G6:2 | F#6:3 r:1 | G6:2 F#6:1 E6:1 | E6:2 C6:1 G5:1 | D6:1 B5:1 G5:1 B5:1 | A5:4';
        var Bm = 'E6:2 G6:2 | F#6:2 A6:2 | B6:3 G6:1 | E6:4 | E6:1 G6:1 C7:2 | A6:1 F#6:1 D6:2 | D6:1 G6:1 B6:2 | D#6:2 F#6:2';
        var a = 'Em C G D', b = 'C D Em Em C D G B', arp = { style: 'up', step: 0.5, octave: 3 };
        return [
          { bars: 8, chords: a, layer: { octave: 3 }, rhythm: arp, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, write: { 4: A }, rhythm: arp, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: arp, layer: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time' } },
          { bars: 8, chords: b, lead: Bm, leadShift: -12, rhythm: arp, keys: { octave: 3 }, layer: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time', fill_every: 8 } },
          { bars: 8, chords: a, lead: A, rhythm: arp, keys: { octave: 3 }, layer: { octave: 3 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, leadShift: -12, rhythm: arp, keys: { octave: 3 }, layer: { octave: 3 }, bass: { style: 'quarters', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'C D Em Em', write: { 4: 'G5:4 | F#5:4 | E5:8' }, layer: { octave: 3 }, bass: { style: 'whole', octave: 2 } }
        ];
      })()
    },
    {
      n: 12, slug: 'the-common-good', title: 'The Common Good', subtitle: 'Everyone\'s good, together', key: 'C', mode: 'major', tempo: 128,
      about: 'A stadium anthem for the measure of every law and every institution: the good of the whole nation and of every person in it. Big riff, big chorus, brass and piano.',
      instruments: { lead: 'distortion guitar', rhythm: 'overdrive guitar', bass: 'picked bass', keys: 'grand piano', layer: 'brass section' },
      sections: (function () {
        var A = 'E5:1 G5:1 C6:1.5 B5:0.5 | B5:1 D6:1 G5:2 | A5:1 C6:1 E6:1.5 D6:0.5 | C6:2 A5:2 | G5:1 C6:1 E6:1 G6:1 | G6:1.5 F6:0.5 D6:1 B5:1 | C6:1 E6:1 A6:1 G6:1 | F6:2 E6:1 D6:1';
        var Bm = 'A6:2 G6:1 F6:1 | G6:2 D6:2 | E6:1 G6:1 C7:2 | A6:3 r:1 | F6:1 A6:1 C7:1 A6:1 | B6:1.5 A6:0.5 G6:2 | G6:1 E6:1 C6:1 E6:1 | C6:3 r:1';
        var riff = 'C5:0.5 G4:0.5 C5:0.5 E5:0.5 G5:1 E5:1 | D5:0.5 B4:0.5 D5:0.5 G5:0.5 B5:2 | C5:0.5 A4:0.5 C5:0.5 E5:0.5 A5:1 E5:1 | F5:0.5 C5:0.5 F5:0.5 A5:0.5 C6:2';
        var solo = 'C6:0.25 D6:0.25 E6:0.25 G6:0.25 E6:0.5 D6:0.5 C6:2 | D6:0.5 G6:0.5 B6:1 A6:0.5 G6:0.5 D6:1 | E6:0.25 G6:0.25 A6:0.25 C7:0.25 A6:0.5 G6:0.5 E6:2 | F6:0.5 A6:0.5 C7:1 A6:1 F6:1 | ' +
          'G6:0.25 E6:0.25 D6:0.25 C6:0.25 D6:0.5 E6:0.5 G6:2 | B6:0.5 G6:0.5 D6:0.5 B5:0.5 D6:1 G6:1 | C7:0.25 A6:0.25 G6:0.25 E6:0.25 C6:0.25 E6:0.25 G6:0.5 A6:1 C7:1 | A6:1 G6:1 F6:1 G6:1';
        var a = 'C G Am F', b = 'F G C Am F G C C';
        return [
          { bars: 4, chords: a, lead: riff, rhythm: { riff: 'chug' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'stab' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, leadShift: -12, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'four on the floor', fill_every: 4 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, leadShift: -12, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'four on the floor', fill_every: 4 } },
          { bars: 8, chords: a, lead: solo, leadShift: -12, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4 } },
          { bars: 4, chords: a, rhythm: { riff: 'whole' }, keys: { kind: 'arpeggio', style: 'up', step: 0.25, octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'F G C C', lead: 'A5:4 | B5:4 | C6:8', rhythm: { riff: 'whole' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    },
    {
      n: 13, slug: 'stone-by-stone', title: 'Stone by Stone', subtitle: 'Finale', key: 'D', mode: 'major', tempo: 112,
      about: 'The Keystone theme returns in D major with the whole band, a pipe organ and a choir: the common good, built stone by stone.',
      instruments: { lead: 'distortion guitar', rhythm: 'distortion guitar', bass: 'picked bass', keys: 'pipe organ', layer: 'choir soprano' },
      sections: (function () {
        var A = 'A4:1 D5:1 E5:1 F#5:1 | F#5:1.5 E5:0.5 C#5:1 A4:1 | B4:1 D5:1 F#5:1.5 E5:0.5 | E5:2 D5:1 B4:1 | D5:1 F#5:1 A5:1 D6:1 | C#6:1.5 B5:0.5 A5:1 E5:1 | F#5:1 G5:1 A5:1 B5:1 | A5:3 r:1';
        var Bm = 'B5:2 D6:2 | C#6:2 E6:2 | F#6:1.5 E6:0.5 C#6:2 | D6:3 r:1 | B5:1 D6:1 G6:2 | E6:1 C#6:1 A5:2 | D6:4 | r:2 F#5:1 A5:1';
        var solo = 'D5:0.5 F#5:0.5 A5:1 F#5:0.5 A5:0.5 D6:1 | C#6:0.25 E6:0.25 A6:0.5 G6:0.5 E6:0.5 C#6:0.5 A5:0.5 E6:1 | B5:0.25 D6:0.25 F#6:0.25 B6:0.25 A6:0.5 F#6:0.5 D6:1 B5:1 | G5:0.5 B5:0.5 D6:0.5 G6:0.5 F#6:1 E6:1 | ' +
          'F#6:0.25 E6:0.25 D6:0.25 A5:0.25 D6:0.5 F#6:0.5 A6:2 | A6:0.5 G6:0.5 E6:0.5 C#6:0.5 E6:1 A6:1 | B6:0.25 A6:0.25 F#6:0.25 D6:0.25 B5:0.25 D6:0.25 F#6:0.5 B6:1 A6:1 | G6:1 A6:1 B6:1 C#7:1';
        var a = 'D A Bm G', b = 'G A F#m Bm G A D D';
        return [
          { bars: 4, chords: 'D G D A', keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'whole' }, keys: { octave: 3 }, bass: { style: 'half', octave: 2 }, drums: { template: 'half time' } },
          { bars: 8, chords: a, lead: A, leadShift: -12, rhythm: { riff: 'chug' }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'rock backbeat', fill_every: 8 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4 } },
          { bars: 8, chords: a, lead: solo, rhythm: { riff: 'chug' }, keys: { octave: 3 }, bass: { style: 'eighths', octave: 2 }, drums: { template: 'sixteenth hats', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'push' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4 } },
          { bars: 8, chords: b, lead: Bm, rhythm: { riff: 'chug' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'octaves', octave: 2 }, drums: { template: 'boss double kick', fill_every: 4, fill_template: 'snare roll fill' } },
          { bars: 4, chords: 'G A D D', lead: 'B5:4 | C#6:4 | D6:8', rhythm: { riff: 'whole' }, keys: { octave: 3 }, layer: { octave: 4 }, bass: { style: 'whole', octave: 2 }, drums: { template: 'sparse' } }
        ];
      })()
    }
  ];

  root.CYM = { make: make, check: check, autoMix: autoMix, writeAlbum: writeAlbum, compose: compose, seq: seq, powerChords: powerChords, TRACKS: TRACKS };
})(window);
