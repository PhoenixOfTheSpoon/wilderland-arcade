// Wilderland Arcade · BACKGROUND MUSIC — original chiptune tunes made on the fly with Web Audio (no audio files to load).
// window.WLMusic.mood('floor' | 'action' | 'puzzle' | 'space' | 'mines' | 'calm' | 'story'), .setOn(bool), .on(), .setMuted(bool)
(function(){
'use strict';
const KEY = 'wl-music';
let on = true; try { on = localStorage.getItem(KEY) !== 'off'; } catch(e){}
let muted = false, ctx = null, master = null, cur = null, timer = null, step = 0, nextT = 0, started = false, noiseBuf = null;

// Each mood: key root (MIDI), scale, tempo, chord progression (scale degrees), instrument colors, seed for its melody.
const MAJ = [0,2,4,5,7,9,11], MIN = [0,2,3,5,7,8,10], DOR = [0,2,3,5,7,9,10], PENT = [0,2,4,7,9], HARM = [0,2,3,5,7,8,11], PHRY = [0,1,3,5,7,8,10];
const MOODS = {
  floor:  {root:60, sc:MAJ, bpm:112, prog:[0,4,5,3], lead:'square',   arp:'triangle', bass:'triangle', drums:1, seed:7,  vol:1},
  action: {root:57, sc:MIN, bpm:138, prog:[0,5,2,6], lead:'square',   arp:'square',   bass:'sawtooth', drums:2, seed:21, vol:.9},
  puzzle: {root:65, sc:MAJ, bpm:92,  prog:[0,3,4,0], lead:'triangle', arp:'sine',     bass:'triangle', drums:0, seed:5,  vol:1},
  space:  {root:62, sc:DOR, bpm:122, prog:[0,6,3,4], lead:'sawtooth', arp:'square',   bass:'triangle', drums:2, seed:33, vol:.75},
  mines:  {root:64, sc:MIN, bpm:100, prog:[0,3,6,4], lead:'triangle', arp:'square',   bass:'triangle', drums:1, seed:12, vol:1},
  calm:   {root:67, sc:PENT,bpm:84,  prog:[0,3,4,2], lead:'sine',     arp:'triangle', bass:'sine',     drums:0, seed:3,  vol:1.1},
  story:  {root:62, sc:MIN, bpm:76,  prog:[0,5,3,4], lead:'triangle', arp:'sine',     bass:'sine',     drums:0, seed:44, vol:1.1},
  // super dramatic (original): last life, and boss fights — they take over from the game's own tune until it's over
  danger: {root:57, sc:HARM,bpm:168, prog:[0,5,6,4], lead:'sawtooth', arp:'square',   bass:'sawtooth', drums:3, seed:66, vol:.8},
  boss:   {root:52, sc:PHRY,bpm:150, prog:[0,1,0,6], lead:'sawtooth', arp:'sawtooth', bass:'square',   drums:3, seed:91, vol:.8},
};
const mtof = m => 440 * Math.pow(2, (m-69)/12);
const rnd = seed => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
// Build a song for a mood: 4 chords × 8 eighth-notes. Melody A (bars 1–4), B (bars 5–8), played A A B A.
const build = name => { const M = MOODS[name], r = rnd(M.seed * 9973 + 17), deg = d => { const n = M.sc.length; return M.root + M.sc[((d%n)+n)%n] + 12*Math.floor(d/n); };
  const chordTones = c => [c, c+2, c+4];
  const phrase = () => { const out = []; M.prog.forEach(c => { const tones = chordTones(c); for (let i = 0; i < 8; i++) {
      const strong = i % 2 == 0, rest = !strong && r() < .35, hold = i > 0 && r() < .18;
      out.push(rest ? null : hold ? 'h' : deg((strong ? tones[Math.floor(r()*3)] : c + Math.floor(r()*6) - 1) + 7)); } }); return out; };
  const A = phrase(), B = phrase(); return {M, deg, mel:[...A, ...A, ...B, ...A]}; };

// ---------- THE WILDERLAND PLAYLIST: 8 original songs, written note by note for the arcade ----------
// Melodies: one token per eighth note ("." holds the last note, "-" is a rest, "|" is just a bar line). Chords: one per bar.
// drums: 8 steps per bar (k kick, s snare, h hi-hat, x kick + hat). arp: 'arp' (broken chord), 'pad' (soft held chord) or ''.
// bass: 'walk' (root, fifth, octave), 'root8' (driving eighths), 'whole' (long notes).
const SONGS = [
 {n:'Snowball Morning', bpm:120, lead:'square', arpW:'triangle', bassW:'triangle', arp:'arp', bass:'walk', drums:'k.h.s.hk', echo:.18, form:['A','A','B','A'],
  A:{ch:'C G Am F C G F G', mel:'E5 . G5 . C6 . G5 E5 | D5 . G5 . B5 . A5 G5 | A5 . E5 . A5 B5 C6 . | A5 . F5 . A5 . G5 F5 | E5 . G5 . C6 . D6 E6 | D6 . B5 . G5 . A5 B5 | C6 . A5 . F5 . A5 C6 | B5 . . . - - G5 .'},
  B:{ch:'F G Em Am Dm G C C', mel:'A5 . . C6 A5 . F5 . | B5 . . D6 B5 . G5 . | G5 . E5 . B4 . E5 G5 | A5 . . . C6 . A5 . | F5 . A5 . D6 . C6 . | B5 . A5 . G5 . F5 . | E5 . G5 . C6 . . . | - - E5 G5 C6 . - -'}},
 {n:'Pinecone Parade', bpm:132, lead:'square', arpW:'square', bassW:'triangle', arp:'arp', bass:'root8', drums:'k.s.k.ss', echo:0, form:['A','B','A','A'],
  A:{ch:'G C G D G C D G', mel:'G5 . B5 . D6 . B5 . | C6 . E6 . C6 . G5 . | B5 A5 G5 A5 B5 . G5 . | A5 . F#5 . D5 . - - | G5 . B5 . D6 . G6 . | E6 . D6 C6 E6 . C6 . | D6 . C6 B5 A5 . F#5 . | G5 . . . - G5 A5 B5'},
  B:{ch:'Em Em C C G G D D', mel:'E6 . . D6 B5 . . G5 | E5 . G5 . B5 . . . | C6 . . B5 A5 . . G5 | E5 . G5 . C6 . . . | D6 . . C6 B5 . A5 . | G5 . B5 . D6 . . . | A5 B5 C6 B5 A5 . F#5 . | D5 . - - D6 . . .'}},
 {n:'Glimmer Lake', bpm:96, lead:'triangle', arpW:'sine', bassW:'sine', arp:'arp', bass:'whole', drums:'', echo:.35, form:['A','A','B','A'],
  A:{ch:'D A Bm G D G Em A', mel:'F#5 . . . A5 . . . | E5 . . . C#6 . . . | D6 . . C#6 B5 . . . | B5 . . . G5 . A5 . | F#5 . . . D6 . . . | B5 . . A5 G5 . . . | E5 . G5 . B5 . . . | A5 . . . - - - -'},
  B:{ch:'G A F#m Bm G A D D', mel:'D6 . . . B5 . . . | C#6 . . . E6 . . . | F#6 . . E6 C#6 . . . | D6 . . . B5 . . . | G5 . B5 . D6 . . B5 | C#6 . . . A5 . . . | D6 . . . . . . . | - - A5 . F#5 . A5 .'}},
 {n:'Hex Pup Hustle', bpm:150, lead:'square', arpW:'square', bassW:'sawtooth', arp:'arp', bass:'root8', drums:'x.hsk.hs', echo:0, form:['A','A','B','A','B'],
  A:{ch:'Am Am F G Am Am F E', mel:'A5 - A5 C6 - A5 E6 . | D6 C6 B5 A5 - E5 A5 . | C6 - C6 A5 - F5 C6 . | B5 A5 G5 B5 D6 . . . | A5 - A5 C6 - A5 E6 . | G6 . E6 . C6 . A5 . | F5 A5 C6 F6 E6 . C6 . | B5 . G#5 . E5 . . .'},
  B:{ch:'Dm Am Dm E F G Am E', mel:'F6 . E6 D6 . . A5 . | E6 . D6 C6 . . A5 . | D6 . F6 . A6 . F6 . | E6 . . . G#5 . B5 . | C6 . A5 . F5 . A5 C6 | D6 . B5 . G5 . B5 D6 | E6 . C6 . A5 . E6 . | G#6 . . . E6 . . .'}},
 {n:'Crystal Caves', bpm:100, lead:'triangle', arpW:'sine', bassW:'triangle', arp:'arp', bass:'whole', drums:'k...h...', echo:.4, form:['A','B','A'],
  A:{ch:'Em C Em D Em C Am B', mel:'E5 . . G5 B5 . . . | C6 . . B5 G5 . . . | E5 . . G5 B5 . E6 . | D6 . . . F#5 . . . | G5 . F#5 . E5 . B4 . | C5 . E5 . G5 . C6 . | A5 . . G5 E5 . . . | D#5 . . . F#5 . B5 .'},
  B:{ch:'Am Em Am Em C D B B', mel:'A5 . C6 . E6 . . . | D6 . B5 . G5 . . . | A5 . C6 . E6 . A6 . | G6 . . F#6 E6 . . . | E6 . D6 . C6 . . . | D6 . C6 . A5 . . . | B5 . . . D#6 . . . | F#6 . . . - - - -'}},
 {n:'Campfire Cocoa', bpm:84, lead:'sine', arpW:'triangle', bassW:'sine', arp:'pad', bass:'walk', drums:'k...s...', echo:.3, form:['A','B','A'],
  A:{ch:'F Dm Bb C F Dm Bb C', mel:'A5 . C6 . A5 . F5 . | D5 . F5 . A5 . . . | A#5 . A5 . G5 . F5 . | G5 . . . E5 . . . | F5 . A5 . C6 . D6 . | C6 . A5 . F5 . . . | D6 . C6 . A#5 . A5 . | G5 . . . - - - -'},
  B:{ch:'Bb C Am Dm Gm C F F', mel:'D6 . . . F6 . D6 . | E6 . . . G6 . E6 . | C6 . . A5 E5 . . . | F5 . A5 . D6 . . . | A#5 . A5 . G5 . A#5 . | C6 . . . E5 . G5 . | F5 . . . . . . . | - - C6 . A5 . F5 .'}},
 {n:'Bwird Zone Rocket', bpm:140, lead:'sawtooth', arpW:'square', bassW:'triangle', arp:'arp', bass:'root8', drums:'x.hsk.hs', echo:.22, form:['A','A','B','A','B'],
  A:{ch:'Dm Bb C Dm Dm Bb C A', mel:'D6 . A5 . F5 . A5 D6 | F6 . D6 . A#5 . D6 F6 | E6 . C6 . G5 . C6 E6 | D6 . . . A5 . . . | D6 E6 F6 . E6 D6 A5 . | A#5 . D6 . F6 . A#6 . | G6 . E6 . C6 . E6 G6 | A6 . . . C#6 . E6 .'},
  B:{ch:'Gm Gm Dm Dm Bb C A A', mel:'G6 . . . A#6 . . . | A6 . G6 . D6 . . . | F6 . . . A6 . . . | G6 . F6 . D6 . . . | F6 . D6 . A#5 . D6 . | E6 . G6 . C7 . . . | A6 . . . E6 . C#6 . | A5 . . . - - - -'}},
 {n:'Victory Lap', bpm:144, lead:'square', arpW:'triangle', bassW:'triangle', arp:'arp', bass:'walk', drums:'x.hsk.hs', echo:.15, form:['A','A','B','A'],
  A:{ch:'E B C#m A E B A B', mel:'G#5 . B5 . E6 . B5 . | F#5 . B5 . D#6 . B5 . | E6 . D#6 . C#6 . G#5 . | A5 . C#6 . E6 . . . | E6 . . F#6 G#6 . E6 . | F#6 . . E6 D#6 . B5 . | C#6 . E6 . A6 . F#6 . | G#6 . F#6 . D#6 . B5 .'},
  B:{ch:'A B G#m C#m A B E E', mel:'C#6 . . B5 A5 . C#6 . | D#6 . . C#6 B5 . D#6 . | B5 . D#6 . G#6 . . . | G#6 . F#6 . E6 . C#6 . | A5 . C#6 . E6 . A6 . | F#6 . D#6 . B5 . F#6 . | E6 . . . . . . . | - - B5 . E6 . . .'}},
];
const NOTE = {C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11};
const pn = tk => { const m = /^([A-G][#b]?)(\d)$/.exec(tk); return m ? NOTE[m[1]] + 12*(+m[2] + 1) : null; };
const chordOf = nm => { const m = /^([A-G][#b]?)(m?)/.exec(nm); return {r:NOTE[m[1]], minor:!!m[2]}; };
// a song becomes one long list of eighth notes (form A A B A …) plus one chord per bar, with a bar of rest at the end
const compile = S => { const mel = [], ch = []; S.form.forEach(sec => { const P = S[sec]; P.mel.split(/\s+/).filter(x => x && x != '|').forEach(tk => mel.push(tk == '.' ? 'h' : tk == '-' ? null : pn(tk))); P.ch.split(/\s+/).filter(Boolean).forEach(c => ch.push(chordOf(c))); });
  for (let i = 0; i < 8; i++) mel.push(null); ch.push(ch[ch.length - 1]); return {S, mel, ch}; };
let si = 0, sstep = 0, songC = null; try { si = Math.max(0, Math.min(SONGS.length - 1, +localStorage.getItem(KEY + '-song') || 0)); } catch(e){}
let dly = null;
const ensure = () => { if (ctx) return true; try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = .0; master.connect(ctx.destination);
    dly = ctx.createDelay(1); dly.delayTime.value = .3; const fb = ctx.createGain(); fb.gain.value = .32; dly.connect(fb); fb.connect(dly); const wet = ctx.createGain(); wet.gain.value = .5; dly.connect(wet); wet.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; return true; } catch(e) { return false; } };
const note = (f, t, d, type, v, fx) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(master); if (fx && dly) { const s2 = ctx.createGain(); s2.gain.value = fx; g.connect(s2); s2.connect(dly); } o.start(t); o.stop(t + d + .02); };
const hat = (t, v) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7000;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + .06); };
const kick = (t, v) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .12);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .15); o.connect(g); g.connect(master); o.start(t); o.stop(t + .16); };

const snare = (t, v) => { const s2 = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s2.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .8;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .13); s2.connect(f); f.connect(g); g.connect(master); s2.start(t); s2.stop(t + .14); };
const scheduleSong = () => { if (!songC) songC = compile(SONGS[si]);
  while (nextT < ctx.currentTime + .25) { if (sstep >= songC.mel.length) { si = (si + 1) % SONGS.length; sstep = 0; songC = compile(SONGS[si]); try { localStorage.setItem(KEY + '-song', si); } catch(e){} }
    const {S, mel, ch} = songC, e = 60 / S.bpm / 2, i = sstep, bar = Math.floor(i / 8), beat = i % 8, C = ch[Math.min(bar, ch.length - 1)], t = nextT;
    const m = mel[i]; if (m != null && m !== 'h') { let len = 1; while (mel[i + len] === 'h' && len < 8) len++; note(mtof(m), t, e*len*.92, S.lead, S.lead == 'sawtooth' ? .035 : S.lead == 'sine' ? .07 : .05, S.echo); }
    const tones = [C.r, C.r + (C.minor ? 3 : 4), C.r + 7];
    if (S.arp == 'arp') note(mtof(60 + [tones[0], tones[1], tones[2], tones[0] + 12][beat % 4]), t, e*.8, S.arpW, .02);
    else if (S.arp == 'pad' && beat == 0) tones.forEach(x => note(mtof(60 + x), t, e*7.6, S.arpW, .016));
    const b = 36 + C.r;
    if (S.bass == 'root8') note(mtof(b + (beat % 2 ? 12 : 0)), t, e*.9, S.bassW, .06);
    else if (S.bass == 'walk') { if (beat % 2 == 0) note(mtof(b + [0, 7, 12, 7][beat/2]), t, e*1.8, S.bassW, .07); }
    else if (beat == 0 || beat == 4) note(mtof(b), t, e*3.8, S.bassW, .08);
    const dr = (S.drums || '')[beat]; if (dr == 'k' || dr == 'x') kick(t, .12); if (dr == 'h' || dr == 'x') hat(t, .022); if (dr == 's') snare(t, .06);
    nextT += e; sstep++; } };
const schedule = () => { if (!cur || !ctx) return; if (track == 'playlist' && !dramatic()) { scheduleSong(); return; } const {M, deg, mel} = cur, e = 60 / M.bpm / 2;   // one eighth note
  while (nextT < ctx.currentTime + .25) { const i = step % mel.length, bar = Math.floor(i / 8) % 4, c = M.prog[bar], t = nextT, beat = i % 8, V = M.vol;
    // melody (hold = let the last note ring)
    const m = mel[i]; if (m && m !== 'h') { let len = 1; while (mel[(i+len) % mel.length] === 'h' && len < 4) len++; note(mtof(m), t, e*len*.95, M.lead, .05*V); }
    // arpeggio on chord tones
    const arpT = [c, c+2, c+4, c+7][beat % 4]; note(mtof(deg(arpT)), t, e*.8, M.arp, .022*V);
    // bass on beats 1 and 3 (and a pickup)
    if (beat == 0 || beat == 4 || (beat == 7 && M.drums)) note(mtof(deg(c) - 24), t, e*1.8, M.bass, .07*V);
    if (M.drums) { if (beat % 2 == 1 || M.drums > 2) hat(t, M.drums > 2 ? .018 : .025); if (beat == 0 || beat == 4 || (M.drums > 1 && beat == 6) || (M.drums > 2 && beat % 2 == 0)) kick(t, M.drums > 2 ? .15 : .12); if (M.drums > 2 && beat == 0) note(mtof(deg(c) - 36), t, e*3, 'sine', .12*V); }
    nextT += e; step++; } };

const audible = () => on && !muted && !document.hidden && started;
const fade = (to, secs) => { if (!ctx) return; const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(to, t + secs); };
// Song files (loaded only when picked). Credits are shown under the arcade floor.
const CC = ' · Licensed under Creative Commons: By Attribution 4.0 · creativecommons.org/licenses/by/4.0/';
// need = rebirths needed to unlock the song (the arcade tells us the player's rebirths)
const FILES = {monkeys: {src:'assets/music/monkeys-spinning-monkeys.mp3', n:'Monkeys Spinning Monkeys', s:'MONKEYS', need:0, credit:'“Monkeys Spinning Monkeys” Kevin MacLeod (incompetech.com)' + CC},
  snitch: {src:'assets/music/sneaky-snitch.mp3', n:'Sneaky Snitch', s:'SNEAKY SNITCH', need:10, credit:'“Sneaky Snitch” Kevin MacLeod (incompetech.com)' + CC},
  duck: {src:'assets/music/fluffing-a-duck.mp3', n:'Fluffing a Duck', s:'FLUFFING A DUCK', need:20, credit:'“Fluffing a Duck” Kevin MacLeod (incompetech.com)' + CC}};
let rebirths = 0; const unlocked = k => !FILES[k] || rebirths >= (FILES[k].need || 0);
let track = 'chip'; try { const t = localStorage.getItem(KEY+'-track'); if (t && (t == 'chip' || t == 'playlist' || FILES[t])) track = t; } catch(e){}
let audio = null, audioKey = '';
const playFile = () => { const F = FILES[track]; if (!audio || audioKey !== track) { if (audio) audio.pause(); audio = new Audio(F.src); audio.loop = true; audio.volume = .35; audioKey = track; }
  const pr = audio.play(); if (pr && pr.catch) pr.catch(() => {}); };
const pauseFile = () => { if (audio) audio.pause(); };
const dramatic = () => flagsNow.danger || flagsNow.boss;
const run = () => { if (!audible()) { stop(); return; }
  if (FILES[track] && unlocked(track) && !dramatic()) { stopChip(); playFile(); return; } pauseFile(); if (!cur) return; if (!ensure()) return; if (ctx.state == 'suspended') ctx.resume();
  if (!timer) { nextT = ctx.currentTime + .1; timer = setInterval(schedule, 90); schedule(); } fade(.5, .8); };
const stopChip = () => { if (!ctx) return; fade(0, .4); if (timer) { const tm = timer; timer = null; setTimeout(() => clearInterval(tm), 450); } };
const stop = () => { stopChip(); pauseFile(); };

let moodName = 'floor', baseMood = 'floor', flagsNow = {danger:false, boss:false};
const WLMusic = {
  mood(name){ if (!MOODS[name]) name = 'floor'; baseMood = name; if (name == 'floor') flagsNow = {danger:false, boss:false}; this._apply(); },
  // games report "last life" (danger) and "boss fight" (boss); boss music wins over danger music
  flags(o){ flagsNow = {danger:!!o.danger, boss:!!o.boss}; this._apply(); },
  _apply(){ const name = flagsNow.boss ? 'boss' : flagsNow.danger ? 'danger' : baseMood; if (name === moodName && cur) { run(); return; } const wasFile = FILES[track] && !['boss','danger'].includes(moodName); moodName = name;
    if (FILES[track]) { cur = build(name); step = 0; stop(); run(); return; }
    if (timer && !wasFile) { fade(0, .3); setTimeout(() => { cur = build(moodName); step = 0; if (ctx) nextT = ctx.currentTime + .05; if (audible()) fade(.5, .8); }, 320); } else { cur = build(name); step = 0; run(); } },
  setOn(v){ on = !!v; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch(e){} if (on) { started = true; if (!cur) cur = build(moodName); run(); } else stop(); },
  _state: () => ({ctx: ctx && ctx.state, playing: !!timer, mood: moodName, flags: flagsNow, file: !!(audio && !audio.paused)}),
  // MUSIC button: Chiptune → each song file → Off → Chiptune …
  setRebirths(n){ const was = unlocked(track); rebirths = Number(n) || 0; if (was != unlocked(track) && on) { stop(); run(); } },
  locked: () => Object.keys(FILES).filter(k => !unlocked(k)).map(k => FILES[k].n + ' unlocks at ' + FILES[k].need + ' rebirths'),
  cycle(){ const order = ['chip', 'playlist', ...Object.keys(FILES).filter(unlocked), 'off'], curK = on ? track : 'off', nx = order[(order.indexOf(curK)+1) % order.length];
    if (nx == 'off') { this.setOn(false); return; } track = nx; try { localStorage.setItem(KEY+'-track', track); } catch(e){} if (!on) this.setOn(true); else { stop(); started = true; if (!cur) cur = build(moodName); run(); } },
  label: () => !on ? 'MUSIC OFF' : track == 'playlist' ? 'PLAYLIST · ' + SONGS[si].n.toUpperCase() : FILES[track] && unlocked(track) ? FILES[track].s : 'CHIPTUNE',
  // the Wilderland Playlist: skip to the next song (turns the playlist on if something else was playing)
  next(){ if (track != 'playlist' || !on) { track = 'playlist'; try { localStorage.setItem(KEY+'-track', track); } catch(e){} } else { si = (si + 1) % SONGS.length; } sstep = 0; songC = null; try { localStorage.setItem(KEY + '-song', si); } catch(e){}
    if (!on) this.setOn(true); else { stop(); started = true; if (!cur) cur = build(moodName); run(); } },
  songs: () => SONGS.map(S2 => S2.n), song: () => track == 'playlist' ? SONGS[si].n : '',
  _songCheck: () => SONGS.map(S2 => ({n:S2.n, secs:S2.form.map(k => k + ':' + S2[k].mel.split(/\s+/).filter(x => x && x != '|').length + '/' + S2[k].ch.split(/\s+/).filter(Boolean).length)})),
  credit: () => on && FILES[track] && unlocked(track) ? FILES[track].credit : '',
  // every song file's credit, always (Creative Commons BY needs the credit shown)
  allCredits: () => Object.values(FILES).map(f => f.credit).join(' · '),
  on: () => on, setMuted(v){ muted = !!v; if (muted) stop(); else run(); }, moods: Object.keys(MOODS),
};
// Browsers only allow sound after the player clicks or presses a key.
const kick0 = () => { if (started) return; started = true; if (!cur) cur = build(moodName); run(); window.removeEventListener('pointerdown', kick0, true); window.removeEventListener('keydown', kick0, true); };
window.addEventListener('pointerdown', kick0, true); window.addEventListener('keydown', kick0, true);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else run(); });
window.WLMusic = WLMusic;
})();
