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

const ensure = () => { if (ctx) return true; try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = .0; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; return true; } catch(e) { return false; } };
const note = (f, t, d, type, v) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02); };
const hat = (t, v) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7000;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + .06); };
const kick = (t, v) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .12);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .15); o.connect(g); g.connect(master); o.start(t); o.stop(t + .16); };

const schedule = () => { if (!cur || !ctx) return; const {M, deg, mel} = cur, e = 60 / M.bpm / 2;   // one eighth note
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
const FILES = {monkeys: {src:'assets/music/monkeys-spinning-monkeys.mp3', n:'Monkeys Spinning Monkeys', s:'MONKEYS', credit:'“Monkeys Spinning Monkeys” Kevin MacLeod (incompetech.com) · Licensed under Creative Commons: By Attribution 4.0 · creativecommons.org/licenses/by/4.0/'}};
let track = 'chip'; try { const t = localStorage.getItem(KEY+'-track'); if (t && (t == 'chip' || FILES[t])) track = t; } catch(e){}
let audio = null, audioKey = '';
const playFile = () => { const F = FILES[track]; if (!audio || audioKey !== track) { if (audio) audio.pause(); audio = new Audio(F.src); audio.loop = true; audio.volume = .35; audioKey = track; }
  const pr = audio.play(); if (pr && pr.catch) pr.catch(() => {}); };
const pauseFile = () => { if (audio) audio.pause(); };
const dramatic = () => flagsNow.danger || flagsNow.boss;
const run = () => { if (!audible()) { stop(); return; }
  if (FILES[track] && !dramatic()) { stopChip(); playFile(); return; } pauseFile(); if (!cur) return; if (!ensure()) return; if (ctx.state == 'suspended') ctx.resume();
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
  cycle(){ const order = ['chip', ...Object.keys(FILES), 'off'], curK = on ? track : 'off', nx = order[(order.indexOf(curK)+1) % order.length];
    if (nx == 'off') { this.setOn(false); return; } track = nx; try { localStorage.setItem(KEY+'-track', track); } catch(e){} if (!on) this.setOn(true); else { stop(); started = true; if (!cur) cur = build(moodName); run(); } },
  label: () => !on ? 'MUSIC OFF' : FILES[track] ? FILES[track].s : 'CHIPTUNE',
  credit: () => on && FILES[track] ? FILES[track].credit : '',
  on: () => on, setMuted(v){ muted = !!v; if (muted) stop(); else run(); }, moods: Object.keys(MOODS),
};
// Browsers only allow sound after the player clicks or presses a key.
const kick0 = () => { if (started) return; started = true; if (!cur) cur = build(moodName); run(); window.removeEventListener('pointerdown', kick0, true); window.removeEventListener('keydown', kick0, true); };
window.addEventListener('pointerdown', kick0, true); window.addEventListener('keydown', kick0, true);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else run(); });
window.WLMusic = WLMusic;
})();
