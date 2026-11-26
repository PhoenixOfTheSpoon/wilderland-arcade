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
  // Wren the Frozen Bard's six songs (Snow Kingdom side story "The Frozen Bard")
  bard1:  {root:64, sc:MAJ, bpm:96,  prog:[0,3,4,0], lead:'triangle', arp:'sine',     bass:'triangle', drums:0, seed:101, vol:1.05},
  bard2:  {root:69, sc:PENT,bpm:72,  prog:[0,5,3,4], lead:'sine',     arp:'triangle', bass:'sine',     drums:0, seed:117, vol:1.1},
  bard3:  {root:60, sc:MAJ, bpm:120, prog:[0,4,0,4], lead:'square',   arp:'triangle', bass:'square',   drums:1, seed:131, vol:.95},
  bard4:  {root:62, sc:DOR, bpm:88,  prog:[0,6,3,4], lead:'triangle', arp:'sine',     bass:'triangle', drums:0, seed:149, vol:1.05},
  bard5:  {root:57, sc:MIN, bpm:116, prog:[0,5,6,4], lead:'square',   arp:'square',   bass:'triangle', drums:1, seed:163, vol:.95},
  bard6:  {root:65, sc:MAJ, bpm:104, prog:[0,4,5,3], lead:'sawtooth', arp:'triangle', bass:'triangle', drums:1, seed:181, vol:.9},
  // super dramatic (original): last life, and boss fights — they take over from the game's own tune until it's over
  danger: {root:57, sc:HARM,bpm:168, prog:[0,5,6,4], lead:'sawtooth', arp:'square',   bass:'sawtooth', drums:3, seed:66, vol:.8},
  boss:   {root:52, sc:PHRY,bpm:150, prog:[0,1,0,6], lead:'sawtooth', arp:'sawtooth', bass:'square',   drums:3, seed:91, vol:.8},
  // Dumpling's theme: the same tune, more intense each time (original)
  dump1:  {root:50, sc:HARM,bpm:128, prog:[0,5,1,4], lead:'square',   arp:'triangle', bass:'square',   drums:2, seed:203, vol:.85},
  dump2:  {root:50, sc:HARM,bpm:148, prog:[0,5,1,4], lead:'sawtooth', arp:'square',   bass:'sawtooth', drums:3, seed:203, vol:.8},
  godchoir:{root:55, sc:HARM,bpm:84, prog:[0,5,3,6], lead:'sine',     arp:'triangle', bass:'sine',     drums:2, seed:233, vol:1},
  dump3:  {root:50, sc:HARM,bpm:170, prog:[0,5,1,6], lead:'sawtooth', arp:'sawtooth', bass:'sawtooth', drums:3, seed:203, vol:.78},
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
// drums: one step per eighth (k kick, s snare, h hi-hat, x kick + hat, S kick + snare). beats: eighths per bar (6 = waltz). swing: delay of the off-beats. arp: 'arp' (broken chord), 'pad' (soft held chord) or ''.
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
 // ---- volume 2: more styles ----
 {n:'Shadow Hound Chase', bpm:160, lead:'square', arpW:'square', bassW:'sawtooth', arp:'arp', bass:'root8', drums:'x.hsk.hs', echo:0, form:['A','A','B','A','B'],
  A:{ch:'Em Em C D Em Em C B', mel:'E5 - E5 G5 - E5 B5 . | A5 G5 F#5 E5 - B4 E5 . | G5 - G5 E5 - C5 G5 . | F#5 E5 D5 F#5 A5 . . . | E5 - E5 G5 - E5 B5 . | D6 . B5 . G5 . E5 . | C5 E5 G5 C6 B5 . G5 . | F#5 . D#5 . B4 . . .'},
  B:{ch:'Am Em Am B C D Em B', mel:'C6 . B5 A5 . . E5 . | B5 . A5 G5 . . E5 . | A5 . C6 . E6 . C6 . | B5 . . . D#5 . F#5 . | G5 . E5 . C5 . E5 G5 | A5 . F#5 . D5 . F#5 A5 | B5 . G5 . E5 . B5 . | D#6 . . . B5 . . .'}},
 {n:'Loki’s Last Trick', bpm:152, lead:'square', arpW:'square', bassW:'sawtooth', arp:'arp', bass:'root8', drums:'x.hsk.hs', echo:.12, form:['A','A','B','A','B'],
  A:{ch:'Dm Dm Bb A Dm Dm Gm A', mel:'D5 F5 A5 D6 - A5 F5 D5 | E5 F5 G5 A5 - - D6 . | D6 - D6 C6 A#5 . F5 . | E5 . C#5 . A4 . - - | D5 F5 A5 D6 - A5 F5 D5 | F6 . E6 . D6 . A5 . | G5 A#5 D6 G6 F6 . D6 . | C#6 . E6 . A6 . . .'},
  B:{ch:'Gm Dm Gm A Bb C Dm A', mel:'A#5 . A5 G5 . . D5 . | A5 . G5 F5 . . D5 . | G5 . A#5 . D6 . G6 . | E6 . . . C#6 . A5 . | D6 . A#5 . F5 . A#5 D6 | E6 . C6 . G5 . C6 E6 | F6 . D6 . A5 . F6 . | E6 . C#6 . A5 . . .'}},
 {n:'Snow Fort Funk', bpm:108, lead:'square', arpW:'triangle', bassW:'sawtooth', arp:'stab', bass:'funk', drums:'x.hsxkhs', echo:0, swing:.12, form:['A','A','B','A'],
  A:{ch:'Em A Em A Em A G A', mel:'E5 - G5 - A5 B5 - - | D6 - C#6 - B5 A5 - - | E5 - G5 A5 - B5 - D6 | C#6 . . A5 - - E5 - | B5 - B5 - A5 G5 - E5 | F#5 - A5 - C#6 . . - | B5 - D6 - B5 A5 G5 - | A5 . . . - - E5 F#5'},
  B:{ch:'C D Em Em C D B B', mel:'G5 . E5 G5 - C6 - - | A5 . F#5 A5 - D6 - - | E6 - D6 - B5 - G5 - | E5 . . . - - - - | C6 - C6 - E6 - C6 - | D6 - D6 - F#6 - D6 - | D#6 . . B5 - F#5 - - | B5 . . . - - - -'}},
 {n:'Surf the Glacier', bpm:168, lead:'sawtooth', arpW:'square', bassW:'triangle', arp:'arp', bass:'root8', drums:'k.hsk.hs', echo:.35, form:['A','A','B','A'],
  A:{ch:'E E A A B A E B', mel:'E5 . G#5 . B5 . G#5 . | E6 . D#6 . B5 . G#5 . | A5 . C#6 . E6 . C#6 . | A6 . G#6 . E6 . C#6 . | B5 . D#6 . F#6 . . . | E6 . C#6 . A5 . . . | G#5 . B5 . E6 . B5 G#5 | F#5 . . . D#5 . . .'},
  B:{ch:'C#m C#m A A E E B B', mel:'C#6 . E6 . G#6 . E6 . | C#6 . . . G#5 . . . | A5 . C#6 . E6 . A6 . | G#6 . F#6 . E6 . C#6 . | B5 . . . G#5 . E5 . | B5 . E6 . G#6 . B6 . | A6 . F#6 . D#6 . B5 . | F#5 . . . - - - -'}},
 {n:'Penguin Ska', bpm:156, lead:'square', arpW:'square', bassW:'triangle', arp:'off', bass:'walk', drums:'k.s.k.s.', echo:0, form:['A','B','A','B'],
  A:{ch:'C Am F G C Am Dm G', mel:'E5 . G5 . E5 . C5 . | A5 . C6 . A5 . E5 . | F5 . A5 . C6 . A5 . | G5 . B5 . D6 . . . | C6 . B5 . A5 . G5 . | E5 . G5 . A5 . . . | F5 . E5 . D5 . F5 . | G5 . . . - - - -'},
  B:{ch:'F F C C F G C C', mel:'A5 - A5 - C6 - A5 - | F5 . . . A5 . . . | G5 - G5 - C6 - G5 - | E5 . . . G5 . . . | F5 . A5 . C6 . F6 . | D6 . B5 . G5 . B5 . | C6 . . . . . . . | - - G5 . E5 . C5 .'}},
 {n:'Moonlight Waltz', bpm:132, beats:6, lead:'triangle', arpW:'triangle', bassW:'sine', arp:'waltz', bass:'waltz', drums:'k.h.h.', echo:.3, form:['A','A','B','A'],
  A:{ch:'G D Em C G D C D', mel:'B5 . . . D6 . | A5 . . . F#5 . | G5 . . B5 E6 . | E6 . . . C6 . | D6 . . B5 G5 . | A5 . . F#5 D5 . | E5 . G5 . C6 . | A5 . . . . .'},
  B:{ch:'Em Bm C G Am D G G', mel:'G6 . . . E6 . | F#6 . . . D6 . | E6 . . D6 C6 . | B5 . . . G5 . | A5 . C6 . E6 . | D6 . . C6 A5 . | G5 . . . . . | - - D5 . G5 .'}},
 {n:'Sleepy Bwird Lullaby', bpm:70, lead:'sine', arpW:'triangle', bassW:'sine', arp:'pad', bass:'whole', drums:'', echo:.4, form:['A','B','A'],
  A:{ch:'F C Dm Bb F C Bb F', mel:'C6 . . . A5 . . . | G5 . . . E5 . . . | F5 . A5 . D6 . . . | D6 . . C6 A#5 . . . | A5 . . . C6 . . . | G5 . . . E5 . G5 . | F5 . . . D5 . . . | F5 . . . - - - -'},
  B:{ch:'Bb C Am Dm Bb C F F', mel:'D6 . . . F6 . . . | E6 . . . C6 . . . | C6 . . . A5 . . . | D6 . . . A5 . . . | A#5 . . . D6 . . . | C6 . . . G5 . . . | A5 . . . . . . . | - - - - - - - -'}},
 {n:'Haunted Igloo', bpm:118, lead:'triangle', arpW:'sine', bassW:'triangle', arp:'arp', bass:'walk', drums:'k..hk.s.', echo:.3, form:['A','B','A'],
  A:{ch:'Cm Ab G Cm Cm Fm G G', mel:'C5 . D#5 . G5 . . F#5 | G5 . D#5 . C5 . . . | D5 . G5 . B5 . . A#5 | C6 . G5 . D#5 . . . | G5 . G#5 . G5 . F5 . | G#5 . F5 . C5 . . . | B4 . D5 . F5 . G#5 . | G5 . . . - - - -'},
  B:{ch:'Fm Cm Fm Cm Ab G Cm Cm', mel:'F5 . G#5 . C6 . . . | D#6 . D6 . C6 . . . | G#5 . C6 . F6 . . . | D#6 . . . C6 . . . | C6 . D#6 . G#6 . . . | G6 . F6 . D6 . B5 . | C6 . . . G5 . . . | C5 . - - - - - -'}},
 {n:'Rocket Rave', bpm:128, lead:'sawtooth', arpW:'square', bassW:'sawtooth', arp:'arp', bass:'root8', drums:'khShkhSh', echo:.25, form:['A','A','B','A','B'],
  A:{ch:'Am Am F F C C G G', mel:'A5 - A5 - C6 - A5 - | E6 - D6 - C6 - B5 - | A5 - A5 - C6 - A5 - | F6 - E6 - C6 - A5 - | G5 - G5 - C6 - G5 - | E6 - D6 - C6 - G5 - | B5 - D6 - G6 - D6 - | B5 . . . D6 . . .'},
  B:{ch:'Am F C G Am F G G', mel:'E6 . . . A6 . . . | F6 . . . C6 . . . | G6 . . . E6 . . . | D6 . . . B5 . . . | C6 . E6 . A6 . E6 . | A5 . C6 . F6 . C6 . | B5 . D6 . G6 . B6 . | A6 . G6 . F6 . D6 .'}},
 {n:'Swing Shift Sledding', bpm:150, lead:'square', arpW:'triangle', bassW:'triangle', arp:'stab', bass:'walk', drums:'x.h.s.h.', echo:0, swing:.33, form:['A','A','B','A'],
  A:{ch:'F Dm Gm C F Dm Gm C', mel:'A5 . C6 A5 F5 . . . | D6 . C6 A5 F5 . . . | G5 A#5 D6 A#5 G5 . F5 . | E5 . G5 . C6 . . . | F6 . E6 D6 C6 . A5 . | D6 . A5 . F5 . D5 . | A#5 . A5 G5 F5 . E5 . | G5 . . . - - C6 .'},
  B:{ch:'Bb Bb F F G G C C', mel:'D6 . . F6 D6 . A#5 . | F5 . A#5 . D6 . . . | C6 . . A5 F5 . A5 . | C6 . . . A5 . . . | B5 . D6 . G6 . F6 . | D6 . B5 . G5 . . . | C6 . E6 . G6 . E6 . | C6 . . . - - - -'}},
 // ---- Rebirth Road songs: original tunes that unlock as you rebirth (need = rebirths) ----
 {n:'First Light', need:1, bpm:116, lead:'square', arpW:'triangle', bassW:'triangle', arp:'arp', bass:'walk', drums:'k.h.s.h.', echo:.2, form:['A','A','B','A'],
  A:{ch:'C Em F G C Em F G', mel:'C5 . E5 . G5 . C6 . | B5 . G5 . E5 . G5 . | A5 . C6 . F6 . E6 D6 | D6 . . . B5 . G5 . | E6 . D6 . C6 . G5 . | B5 . . G5 E5 . . . | F5 . A5 . C6 . D6 . | G5 . . . - - G5 .'},
  B:{ch:'Am F C G Am F G G', mel:'A5 . . C6 E6 . . . | F6 . E6 . C6 . A5 . | G5 . . E5 C6 . . . | D6 . . . B5 . . . | C6 . E6 . A6 . E6 . | F6 . C6 . A5 . F5 . | G5 . B5 . D6 . F6 . | G6 . . . - - - -'}},
 {n:'Trailblazer', need:3, bpm:140, lead:'square', arpW:'square', bassW:'triangle', arp:'off', bass:'root8', drums:'x.hsk.hs', echo:0, form:['A','A','B','A','B'],
  A:{ch:'G D Em C G D C D', mel:'G5 - B5 - D6 - B5 G5 | A5 - F#5 - D5 - F#5 A5 | B5 . . G5 E5 . G5 B5 | C6 . . . E6 . C6 . | D6 - D6 - B5 - G5 - | A5 . F#5 . A5 . D6 . | E6 . D6 C6 B5 . A5 . | F#5 . . . D5 . . .'},
  B:{ch:'C C G G Am Am D D', mel:'E6 . . D6 C6 . G5 . | E5 . G5 . C6 . . . | D6 . . C6 B5 . G5 . | D5 . G5 . B5 . . . | C6 . B5 . A5 . E5 . | A5 . C6 . E6 . . . | F#6 . E6 . D6 . A5 . | D6 . . . - - - -'}},
 {n:'Neon Night Drive', need:7, bpm:124, lead:'sawtooth', arpW:'square', bassW:'sawtooth', arp:'arp', bass:'root8', drums:'khShkhSh', echo:.3, form:['A','A','B','A','B'],
  A:{ch:'Am F C G Am F C E', mel:'E5 . . A5 C6 . B5 A5 | C6 . A5 . F5 . . . | G5 . C6 . E6 . D6 C6 | D6 . . . B5 . . . | A5 . C6 . E6 . A6 . | G6 . F6 . E6 . C6 . | E6 . D6 . C6 . G5 . | G#5 . . . B5 . . .'},
  B:{ch:'F G Am Am F G E E', mel:'A5 . . C6 F6 . . . | G6 . . F6 D6 . . . | E6 . . C6 A5 . . . | A5 . C6 . E6 . A6 . | F6 . E6 . C6 . A5 . | B5 . D6 . G6 . F6 . | E6 . . . G#5 . B5 . | E6 . . . - - - -'}},
 {n:'Lucky Clover Jig', need:15, bpm:168, beats:6, lead:'square', arpW:'triangle', bassW:'triangle', arp:'waltz', bass:'waltz', drums:'k.hs.h', echo:0, form:['A','A','B','A'],
  A:{ch:'D G D A D G A D', mel:'F#5 . A5 D6 . A5 | B5 . G5 D5 . G5 | F#5 . A5 D6 . F#6 | E6 . C#6 A5 . . | F#5 . A5 D6 . A5 | B5 . D6 G6 . B5 | A5 . C#6 E6 . C#6 | D6 . . . - -'},
  B:{ch:'G D Em A G D A D', mel:'D6 . B5 G5 . B5 | A5 . F#5 D5 . F#5 | G5 . B5 E6 . G6 | E6 . . C#6 . . | B5 . D6 G6 . D6 | F#6 . E6 D6 . A5 | C#6 . E6 A6 . E6 | D6 . . . - -'}},
 {n:'Mythic Skies', need:75, bpm:96, lead:'triangle', arpW:'sine', bassW:'sine', arp:'pad', bass:'whole', drums:'k...s...', echo:.4, form:['A','B','A'],
  A:{ch:'Em C G D Em C D B', mel:'B5 . . . E6 . . . | G6 . . E6 C6 . . . | D6 . . B5 G5 . . . | A5 . . . F#5 . . . | E5 . G5 . B5 . E6 . | G6 . F#6 . E6 . C6 . | D6 . . . A5 . F#5 . | D#5 . . . B5 . . .'},
  B:{ch:'C D Em Em C D B B', mel:'E6 . . . G6 . . . | F#6 . . . A6 . . . | G6 . . F#6 E6 . . . | B5 . . . E6 . . . | C6 . E6 . G6 . . . | F#6 . E6 . D6 . . . | D#6 . . . F#6 . . . | B5 . . . - - - -'}},
 {n:'Eternal Anthem', need:100, bpm:108, lead:'square', arpW:'triangle', bassW:'triangle', arp:'arp', bass:'walk', drums:'k.h.S.h.', echo:.2, form:['A','A','B','A'],
  A:{ch:'F C Dm Bb F C Bb C', mel:'F5 . . A5 C6 . . . | C6 . . E6 G6 . . . | F6 . E6 . D6 . A5 . | A#5 . . . D6 . . . | C6 . A5 . F5 . A5 . | G5 . C6 . E6 . G6 . | F6 . D6 . A#5 . D6 . | C6 . . . - - C6 .'},
  B:{ch:'Dm Bb F C Dm Bb C F', mel:'D6 . . . F6 . . . | D6 . . A#5 F5 . . . | A5 . . C6 F6 . . . | E6 . . . G6 . . . | A6 . . . F6 . D6 . | A#6 . . . F6 . D6 . | G6 . . . E6 . C6 . | F6 . . . - - - -'}},
 {n:'Comet Waltz', need:125, bpm:138, beats:6, lead:'triangle', arpW:'triangle', bassW:'sine', arp:'waltz', bass:'waltz', drums:'k.h.h.', echo:.3, form:['A','A','B','A'],
  A:{ch:'A E F#m D A E D E', mel:'C#6 . . . E6 . | B5 . . . G#5 . | A5 . . C#6 F#6 . | F#6 . . . D6 . | E6 . . C#6 A5 . | B5 . . G#5 E5 . | F#5 . A5 . D6 . | B5 . . . . .'},
  B:{ch:'F#m C#m D A Bm E A A', mel:'A6 . . . F#6 . | G#6 . . . E6 . | F#6 . . E6 D6 . | C#6 . . . A5 . | B5 . D6 . F#6 . | E6 . . D6 B5 . | A5 . . . . . | - - E5 . A5 .'}},
 {n:'Starforge Funk', need:175, bpm:104, lead:'square', arpW:'triangle', bassW:'sawtooth', arp:'stab', bass:'funk', drums:'x.hsxkhs', echo:0, swing:.12, form:['A','A','B','A'],
  A:{ch:'Dm G Dm G Dm G Bb A', mel:'D5 - F5 - A5 C6 - - | B5 - D6 - B5 A5 - - | D6 - C6 A5 - F5 - A5 | G5 . . B5 - - D5 - | A5 - A5 - C6 D6 - F6 | E6 - D6 - B5 . . - | D6 - F6 - D6 A#5 - - | C#6 . . . - - A5 -'},
  B:{ch:'Bb C Dm Dm Bb C A A', mel:'F6 . D6 A#5 - F5 - - | G5 . E5 G5 - C6 - - | A5 - C6 - D6 - F6 - | D6 . . . - - - - | A#5 - A#5 - D6 - F6 - | E6 - E6 - G6 - E6 - | C#6 . . A5 - E5 - - | A5 . . . - - - -'}},
 {n:'Wilderland Forever', need:225, bpm:132, lead:'square', arpW:'square', bassW:'triangle', arp:'arp', bass:'root8', drums:'x.hsk.hs', echo:.2, form:['A','A','B','A','B'],
  A:{ch:'E C#m A B E C#m A B', mel:'E5 . G#5 . B5 . E6 . | C#6 . . B5 G#5 . E5 . | A5 . C#6 . E6 . A6 . | F#6 . . . D#6 . B5 . | G#6 . F#6 . E6 . B5 . | C#6 . E6 . G#6 . E6 . | A6 . G#6 . F#6 . E6 . | D#6 . . . B5 . . .'},
  B:{ch:'A B G#m C#m A B E E', mel:'C#6 . . . E6 . . . | D#6 . . . F#6 . . . | B5 . D#6 . G#6 . . . | G#6 . F#6 . E6 . C#6 . | A5 . C#6 . E6 . A6 . | B6 . A6 . F#6 . D#6 . | E6 . . . . . . . | - - B5 . E6 . . .'}},
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
const songOk = i => !!SONGS[i] && rebirths >= (SONGS[i].need || 0);
const nextSi = i => { for (let k = 1; k <= SONGS.length; k++) { const j = (i + k) % SONGS.length; if (songOk(j)) return j; } return 0; };
const scheduleSong = () => { if (!songC) { if (track == 'player') { const j = songIdx(curId()); if (j >= 0) si = j; } else if (!songOk(si)) si = nextSi(si); songC = compile(SONGS[si]); }
  while (nextT < ctx.currentTime + .25) { if (sstep >= songC.mel.length) { sstep = 0;
      if (track == 'player') { if (!repeat1) advance(); if (isFileId(curId())) { songC = null; setTimeout(() => { stop(); run(); }, 0); return; } const j = songIdx(curId()); si = j >= 0 ? j : si; }
      else si = nextSi(si);
      songC = compile(SONGS[si]); try { localStorage.setItem(KEY + '-song', si); } catch(e){} }
    const {S, mel, ch} = songC, BB = S.beats || 8, e = 60 / S.bpm / 2, i = sstep, bar = Math.floor(i / BB), beat = i % BB, C = ch[Math.min(bar, ch.length - 1)], t = nextT + (beat % 2 ? e*(S.swing || 0) : 0);
    const m = mel[i]; if (m != null && m !== 'h') { let len = 1; while (mel[i + len] === 'h' && len < 8) len++; note(mtof(m), t, e*len*.92, S.lead, S.lead == 'sawtooth' ? .035 : S.lead == 'sine' ? .07 : .05, S.echo); }
    const tones = [C.r, C.r + (C.minor ? 3 : 4), C.r + 7];
    if (S.arp == 'arp') note(mtof(60 + [tones[0], tones[1], tones[2], tones[0] + 12][beat % 4]), t, e*.8, S.arpW, .02);
    else if (S.arp == 'pad' && beat == 0) tones.forEach(x => note(mtof(60 + x), t, e*(BB - .4), S.arpW, .016));
    else if ((S.arp == 'off' && beat % 2 == 1) || (S.arp == 'stab' && (beat == 2 || beat == 6)) || (S.arp == 'waltz' && (beat == 2 || beat == 4))) tones.forEach(x => note(mtof(60 + x), t, e*.55, S.arpW, .018));
    const b = 36 + C.r;
    if (S.bass == 'root8') note(mtof(b + (beat % 2 ? 12 : 0)), t, e*.9, S.bassW, .06);
    else if (S.bass == 'walk') { if (beat % 2 == 0) note(mtof(b + [0, 7, 12, 7][beat/2]), t, e*1.8, S.bassW, .07); }
    else if (S.bass == 'funk') { const f2 = [0, null, 12, 0, null, 7, 10, 12][beat]; if (f2 != null) note(mtof(b + f2), t, e*.8, S.bassW, .065); }
    else if (S.bass == 'waltz') { if (beat == 0) note(mtof(b), t, e*1.8, S.bassW, .08); }
    else if (beat == 0 || beat == 4) note(mtof(b), t, e*3.8, S.bassW, .08);
    const dr = (S.drums || '')[beat]; if (dr == 'k' || dr == 'x' || dr == 'S') kick(t, .12); if (dr == 'h' || dr == 'x') hat(t, .022); if (dr == 's' || dr == 'S') snare(t, .06);
    nextT += e; sstep++; } };
const schedule = () => { if (!cur || !ctx) return; if ((track == 'playlist' || (track == 'player' && !isFileId(curId()))) && !dramatic()) { scheduleSong(); return; } const {M, deg, mel} = cur, e = 60 / M.bpm / 2;   // one eighth note
  while (nextT < ctx.currentTime + .25) { const i = step % mel.length, bar = Math.floor(i / 8) % 4, c = M.prog[bar], t = nextT, beat = i % 8, V = M.vol;
    // melody (hold = let the last note ring)
    const m = mel[i]; if (m && m !== 'h') { let len = 1; while (mel[(i+len) % mel.length] === 'h' && len < 4) len++; note(mtof(m), t, e*len*.95, M.lead, .05*V); }
    // arpeggio on chord tones
    const arpT = [c, c+2, c+4, c+7][beat % 4]; note(mtof(deg(arpT)), t, e*.8, M.arp, .022*V);
    // bass on beats 1 and 3 (and a pickup)
    if (beat == 0 || beat == 4 || (beat == 7 && M.drums)) note(mtof(deg(c) - 24), t, e*1.8, M.bass, .07*V);
    if (M.drums) { if (beat % 2 == 1 || M.drums > 2) hat(t, M.drums > 2 ? .018 : .025); if (beat == 0 || beat == 4 || (M.drums > 1 && beat == 6) || (M.drums > 2 && beat % 2 == 0)) kick(t, M.drums > 2 ? .15 : .12); if (M.drums > 2 && beat == 0) note(mtof(deg(c) - 36), t, e*3, 'sine', .12*V); }
    nextT += e; step++; } };

const audible = () => on && !muted && !document.hidden && started && vol > 0;
const fade = (to, secs) => { if (!ctx) return; if (to > 0) to *= vol; const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(to, t + secs); };
// Song files (loaded only when picked). Credits are shown under the arcade floor.
const CC = ' · Licensed under Creative Commons: By Attribution 4.0 · creativecommons.org/licenses/by/4.0/';
// need = rebirths needed to unlock the song (the arcade tells us the player's rebirths)
const FILES = {monkeys: {src:'assets/music/monkeys-spinning-monkeys.mp3', n:'Monkeys Spinning Monkeys', s:'MONKEYS', need:0, credit:'“Monkeys Spinning Monkeys” Kevin MacLeod (incompetech.com)' + CC},
  snitch: {src:'assets/music/sneaky-snitch.mp3', n:'Sneaky Snitch', s:'SNEAKY SNITCH', need:10, credit:'“Sneaky Snitch” Kevin MacLeod (incompetech.com)' + CC},
  duck: {src:'assets/music/fluffing-a-duck.mp3', n:'Fluffing a Duck', s:'FLUFFING A DUCK', need:20, credit:'“Fluffing a Duck” Kevin MacLeod (incompetech.com)' + CC},
  weasel: {src:'assets/music/scheming-weasel-faster.mp3', n:'Scheming Weasel (faster version)', s:'SCHEMING WEASEL', need:30, credit:'“Scheming Weasel (faster version)” Kevin MacLeod (incompetech.com)' + CC},
  invest: {src:'assets/music/investigations.mp3', n:'Investigations', s:'INVESTIGATIONS', need:40, credit:'“Investigations” Kevin MacLeod (incompetech.com)' + CC},
  cipher: {src:'assets/music/cipher.mp3', n:'Cipher', s:'CIPHER', need:50, credit:'“Cipher” Kevin MacLeod (incompetech.com)' + CC}};
let rebirths = 0, rbSet = false; const unlocked = k => !FILES[k] || rebirths >= (FILES[k].need || 0);
let track = 'chip'; try { const t = localStorage.getItem(KEY+'-track'); if (t && (t == 'chip' || t == 'playlist' || t == 'player' || FILES[t])) track = t; } catch(e){}
// ---- MUSIC PLAYER (unlocked on the Rebirth Road): a queue of tracks — 's:<song name>' (original songs) or 'f:<file key>' (song files)
let vol = 1; try { const v = localStorage.getItem(KEY+'-vol'); if (v != null && v !== '') vol = Math.max(0, Math.min(1, +v)); } catch(e){}
let queue = [], qi = 0, shuffle = false, repeat1 = false;
try { const q = JSON.parse(localStorage.getItem(KEY+'-q') || 'null'); if (q && Array.isArray(q.l)) { queue = q.l; qi = q.i|0; shuffle = !!q.s; repeat1 = !!q.r; } } catch(e){}
const saveQ = () => { try { localStorage.setItem(KEY+'-q', JSON.stringify({l:queue, i:qi, s:shuffle, r:repeat1})); } catch(e){} };
const curId = () => queue[qi] || '';
const isFileId = id => !!id && id.slice(0, 2) == 'f:';
const songIdx = id => SONGS.findIndex(S2 => 's:'+S2.n === id);
const idOk = id => isFileId(id) ? !!FILES[id.slice(2)] && unlocked(id.slice(2)) : songIdx(id) >= 0 && songOk(songIdx(id));
const advance = () => { if (!queue.length) return; for (let k = 0; k < queue.length; k++) { let n = shuffle && queue.length > 2 ? Math.floor(Math.random()*queue.length) : (qi + 1) % queue.length; if (shuffle && n == qi) n = (n + 1) % queue.length; qi = n; if (idOk(queue[qi])) break; } saveQ(); };
// the song file that should be playing right now (null = the synth plays)
const fileNow = () => track == 'player' ? (isFileId(curId()) && idOk(curId()) ? curId().slice(2) : null) : (FILES[track] && unlocked(track) ? track : null);
let audio = null, audioKey = '';
const playFile = () => { const key = fileNow(), F = FILES[key]; if (!F) return; if (!audio || audioKey !== key) { if (audio) audio.pause(); audio = new Audio(F.src); audioKey = key;
    audio.addEventListener('ended', () => { if (track == 'player' && audioKey == key) { if (!repeat1) advance(); songC = null; sstep = 0; stop(); run(); } }); }
  audio.loop = track != 'player' || repeat1; audio.volume = .35 * vol;
  const pr = audio.play(); if (pr && pr.catch) pr.catch(() => {}); };
const pauseFile = () => { if (audio) audio.pause(); };
const dramatic = () => flagsNow.danger || flagsNow.boss;
const run = () => { if (!audible()) { stop(); return; }
  if (fileNow() && !dramatic()) { stopChip(); playFile(); return; } pauseFile(); if (!cur) return; if (!ensure()) return; if (ctx.state == 'suspended') ctx.resume();
  if (!timer) { nextT = ctx.currentTime + .1; timer = setInterval(schedule, 90); schedule(); } fade(.5, .8); };
const stopChip = () => { if (!ctx) return; fade(0, .4); if (timer) { const tm = timer; timer = null; setTimeout(() => clearInterval(tm), 450); } };
const stop = () => { stopChip(); pauseFile(); };

let moodName = 'floor', baseMood = 'floor', flagsNow = {danger:false, boss:false};
const WLMusic = {
  mood(name){ if (!MOODS[name]) name = 'floor'; baseMood = name; if (name == 'floor') flagsNow = {danger:false, boss:false}; this._apply(); },
  // games report "last life" (danger) and "boss fight" (boss); boss music wins over danger music
  flags(o){ flagsNow = {danger:!!o.danger, boss:!!o.boss}; this._apply(); },
  _apply(){ const name = flagsNow.boss ? 'boss' : flagsNow.danger ? 'danger' : baseMood; if (name === moodName && cur) { run(); return; } const wasFile = fileNow() && !['boss','danger'].includes(moodName); moodName = name;
    if (fileNow()) { cur = build(name); step = 0; stop(); run(); return; }
    if (timer && !wasFile) { fade(0, .3); setTimeout(() => { cur = build(moodName); step = 0; if (ctx) nextT = ctx.currentTime + .05; if (audible()) fade(.5, .8); }, 320); } else { cur = build(name); step = 0; run(); } },
  setOn(v){ on = !!v; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch(e){} if (on) { started = true; if (!cur) cur = build(moodName); run(); } else stop(); },
  _state: () => ({ctx: ctx && ctx.state, playing: !!timer, mood: moodName, flags: flagsNow, file: !!(audio && !audio.paused)}),
  // MUSIC button: Chiptune → each song file → Off → Chiptune …
  setRebirths(n){ const was = !!fileNow(), before = Object.keys(FILES).filter(unlocked), old = rebirths; rebirths = Number(n) || 0; if (was != !!fileNow() && on) { stop(); run(); }
    const fresh = Object.keys(FILES).filter(k => unlocked(k) && !before.includes(k)); if (rbSet && rebirths - old >= 1 && rebirths - old <= 2 && fresh.length && this.onUnlock) { try { this.onUnlock(fresh.map(k => FILES[k].n)); } catch(e){} } rbSet = true; },
  // the next song file you can unlock: its name, the rebirths it needs, and the rebirths the one before it needed (for the meter)
  nextSong: () => { const all = [...Object.values(FILES), ...SONGS.filter(x => x.need)].map(x => ({n:x.n, need:x.need||0})), ks = all.filter(x => x.need > rebirths).sort((a, b) => a.need - b.need); if (!ks.length) return null; const F = ks[0];
    return {n:F.n, need:F.need, prev:Math.max(0, ...all.map(f => f.need).filter(x => x < F.need))}; },
  locked: () => [...Object.values(FILES), ...SONGS.filter(x => x.need)].filter(x => (x.need||0) > rebirths).sort((a, b) => a.need - b.need).map(x => x.n + ' unlocks at ' + x.need + ' rebirths'),
  cycle(){ const order = ['chip', 'playlist', ...Object.keys(FILES).filter(unlocked), 'off'], curK = on ? track : 'off', nx = order[(order.indexOf(curK)+1) % order.length];
    if (nx == 'off') { this.setOn(false); return; } track = nx; try { localStorage.setItem(KEY+'-track', track); } catch(e){} if (!on) this.setOn(true); else { stop(); started = true; if (!cur) cur = build(moodName); run(); } },
  label: () => !on ? 'MUSIC OFF' : track == 'player' ? '▶ ' + (WLMusic.nowPlaying().n || 'PLAYER').toUpperCase() : track == 'playlist' ? 'PLAYLIST · ' + SONGS[si].n.toUpperCase() : fileNow() ? FILES[fileNow()].s : 'CHIPTUNE',
  // the Wilderland Playlist: skip to the next song (turns the playlist on if something else was playing)
  next(){ if (track == 'player' && on && queue.length) { this.skip(); return; } if (track != 'playlist' || !on) { track = 'playlist'; try { localStorage.setItem(KEY+'-track', track); } catch(e){} } else { si = nextSi(si); } sstep = 0; songC = null; try { localStorage.setItem(KEY + '-song', si); } catch(e){}
    if (!on) this.setOn(true); else { stop(); started = true; if (!cur) cur = build(moodName); run(); } },
  songs: () => SONGS.filter((S2, i) => songOk(i)).map(S2 => S2.n), song: () => track == 'playlist' ? SONGS[si].n : track == 'player' ? WLMusic.nowPlaying().n : '',
  // ---- Music Player ----
  ORIGINAL: 'Original music made for Wilderland Arcade · free to use',
  tracks: () => [...SONGS.map(S2 => ({id:'s:'+S2.n, n:S2.n, kind:'song', need:S2.need||0, ok:rebirths >= (S2.need||0), by:'Wilderland Arcade (original)', credit:WLMusic.ORIGINAL, road:!!S2.need, bpm:S2.bpm})),
    ...Object.keys(FILES).map(k => ({id:'f:'+k, n:FILES[k].n, kind:'file', need:FILES[k].need||0, ok:unlocked(k), by:'Kevin MacLeod (incompetech.com)', credit:FILES[k].credit, road:!!FILES[k].need}))],
  playIds(ids, startId, shuf){ queue = (ids||[]).filter(idOk); if (!queue.length) return false; if (shuf != null) shuffle = !!shuf; qi = Math.max(0, queue.indexOf(startId)); if (startId == null && shuffle) qi = Math.floor(Math.random()*queue.length);
    track = 'player'; songC = null; sstep = 0; saveQ(); try { localStorage.setItem(KEY+'-track', track); } catch(e){} if (!on) this.setOn(true); else { stop(); started = true; if (!cur) cur = build(moodName); run(); } return true; },
  skip(){ if (track != 'player') { this.next(); return; } advance(); songC = null; sstep = 0; if (!on) this.setOn(true); else { stop(); started = true; if (!cur) cur = build(moodName); run(); } },
  prev(){ if (track != 'player' || !queue.length) return; for (let k = 0; k < queue.length; k++) { qi = (qi - 1 + queue.length) % queue.length; if (idOk(queue[qi])) break; } saveQ(); songC = null; sstep = 0; stop(); run(); },
  nowPlaying: () => { if (!on) return {id:'', n:''}; if (track == 'player') { const id = curId(), t = WLMusic.tracks().find(x => x.id == id); return t ? {id, n:t.n, credit:t.credit, by:t.by} : {id:'', n:''}; }
    if (track == 'playlist') return {id:'s:'+SONGS[si].n, n:SONGS[si].n, credit:WLMusic.ORIGINAL, by:'Wilderland Arcade (original)'}; const f = fileNow(); if (f) return {id:'f:'+f, n:FILES[f].n, credit:FILES[f].credit, by:'Kevin MacLeod (incompetech.com)'};
    return {id:'chip', n:'Arcade chiptune (changes with each game)', credit:WLMusic.ORIGINAL, by:'Wilderland Arcade (original)'}; },
  queue: () => queue.slice(), track: () => track,
  shuffle: () => shuffle, setShuffle(v){ shuffle = !!v; saveQ(); }, repeat: () => repeat1, setRepeat(v){ repeat1 = !!v; if (audio) audio.loop = track != 'player' || repeat1; saveQ(); },
  volume: () => vol, setVolume(v){ vol = Math.max(0, Math.min(1, +v || 0)); try { localStorage.setItem(KEY+'-vol', vol); } catch(e){} if (audio) audio.volume = .35 * vol; if (vol <= 0) stop(); else if (ctx && timer) { const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(.5*vol, t); } else run(); },
  useChip(){ track = 'chip'; try { localStorage.setItem(KEY+'-track', track); } catch(e){} if (!on) this.setOn(true); else { stop(); started = true; cur = build(moodName); run(); } },
  _songCheck: () => SONGS.map(S2 => ({n:S2.n, secs:S2.form.map(k => k + ':' + S2[k].mel.split(/\s+/).filter(x => x && x != '|').length + '/' + S2[k].ch.split(/\s+/).filter(Boolean).length)})),
  credit: () => on && fileNow() ? FILES[fileNow()].credit : '',
  // every song file's credit, always (Creative Commons BY needs the credit shown)
  allCredits: () => Object.values(FILES).map(f => f.credit).join(' · ') + ' · All other songs: ' + WLMusic.ORIGINAL,
  on: () => on, setMuted(v){ muted = !!v; if (muted) stop(); else run(); }, moods: Object.keys(MOODS),
};
// Browsers only allow sound after the player clicks or presses a key.
const kick0 = () => { if (started) return; started = true; if (!cur) cur = build(moodName); run(); window.removeEventListener('pointerdown', kick0, true); window.removeEventListener('keydown', kick0, true); };
window.addEventListener('pointerdown', kick0, true); window.addEventListener('keydown', kick0, true);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else run(); });
window.WLMusic = WLMusic;
})();
