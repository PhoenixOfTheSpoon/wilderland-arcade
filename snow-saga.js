// Wilderland Arcade · THE DUMPLING SAGA, part 1: the WORLD.
// Eleven new lands beyond the Snow Kingdom, each loaded only while you are in it (one region at a time lives east of the
// raid wing in the world's tile space). Climbing with stamina, gliding with the Snow Cloak, sledding down slopes, swimming,
// 66 Ice Shrine puzzles (every one checked by a solver), towers that reveal the map, weather, cooking, Frost Feathers,
// region waystones and a region map. The story (snow-saga-story.js) plugs into this through SAGA.story.
// Everything is saved in your Snowball progress (PERM.ow.saga). NOTHING resets.
(function(){
'use strict';
const A = window.Arcade; if (!A || !A._snowT) return;
const T0 = A._snowT, TAU = Math.PI*2;
const {SNOW, PATH, TREE, ROCK, ICE, DEEP, HOLE, WALL, FLOOR, CAVE, CAMP, DEAD, WATER} = T0.T;
// new ground for the new lands
const CLIFF = 17, CHASM = 18, SLOPE = 19, SAND = 20, SWIM = 21, TOWER = 22, SHRINE = 23, CRYST = 24, CLOUD = 25, VOIDF = 26, PILLAR = 27;
[[CLIFF, 1, '#7a8296'], [CHASM, 1, '#0e1a34'], [SLOPE, 0, '#dfeaf6'], [SAND, 0, '#e9d9c2'], [SWIM, 0, '#3a6ab0'], [TOWER, 1, '#c8a050'], [SHRINE, 1, '#64CDF5'], [CRYST, 1, '#c9a0ff'], [CLOUD, 0, '#f4f8ff'], [VOIDF, 0, '#8fb0d8'], [PILLAR, 1, '#4a3a6a']]
  .forEach(([id, sol, col]) => { T0.SOLID[id] = sol; T0.MINI[id] = col; });
const RW = 96, RH = 84;   // every region is 96 × 84 tiles

// ---------- the lands ----------
// look: base ground and colours · wx: weather (cold, wind, fog, storm, dark) · tier: enemy strength · pool: who lives there
const REGIONS = [
  {id:'frostfang', n:'Frostfang Mountains', e:'🏔️', ch:1, base:'#eef2f8', rock:'#7a8296', tree:'#2f5a4a', wx:{cold:1, wind:1}, tier:5, pool:['yeti', 'golem', 'hound', 'geck'], mood:'action', blurb:'Sheer cliffs, howling wind and the first gecko tracks.'},
  {id:'glaciers', n:'Glimmering Glaciers', e:'🧊', ch:2, base:'#e4f4ff', rock:'#9fc8e8', tree:'#3a6a7a', wx:{cold:1}, tier:5, pool:['golem', 'bat', 'geck', 'wisp'], mood:'calm', blurb:'Blue ice as far as you can see, cut by deep crevasses.'},
  {id:'sunken', n:'Sunken Ice Temple', e:'🏛️', ch:3, base:'#cfe0f0', rock:'#5a6a8a', tree:'#3a5a6a', wx:{dark:1, cold:1}, tier:6, pool:['geck', 'wisp', 'golem', 'imp'], mood:'story', blurb:'A drowned temple. Freeze the water to make bridges.'},
  {id:'whisper', n:'Whisperwood Forest', e:'🌲', ch:4, base:'#e6efe6', rock:'#7a8a7a', tree:'#1f4a32', wx:{fog:1}, tier:6, pool:['geck', 'pup', 'hound', 'stormling'], mood:'calm', blurb:'Ancient trees that whisper. The fog hides things.'},
  {id:'sky', n:'Aurora Sky Islands', e:'🌌', ch:5, base:'#f2f0ff', rock:'#a6a0d0', tree:'#3a4a8a', wx:{wind:2}, tier:7, pool:['bat', 'wisp', 'geck', 'stormling'], mood:'calm', blurb:'Floating islands. Glide between them with the Snow Cloak.', sky:1},
  {id:'desert', n:'Crystal Desert', e:'💎', ch:6, base:'#efe2cc', rock:'#c9a0ff', tree:'#6a8a5a', wx:{storm:1}, tier:7, pool:['golem', 'geck', 'imp', 'stormling'], mood:'action', blurb:'Glittering dunes and crystal storms full of lightning.', sand:1},
  {id:'hollow', n:'Gecko’s Hollow', e:'🦎', ch:7, base:'#4a4a5e', rock:'#2e2e40', tree:'#2a4a3a', wx:{dark:2}, tier:8, pool:['geck', 'geck', 'imp', 'hound'], mood:'story', blurb:'Dumpling’s lair. Geckos on every wall.', cave:1},
  {id:'citadel', n:'Dumpling’s Citadel', e:'🏯', ch:8, base:'#d8d8ea', rock:'#3e2c62', tree:'#2f3a5a', wx:{storm:1, cold:1}, tier:9, pool:['geck', 'imp', 'hound', 'golem'], mood:'story', blurb:'A fortress of black ice under a permanent storm.', castle:1},
  {id:'forbidden', n:'The Forbidden Temple', e:'⛩️', ch:20, base:'#e8e0f0', rock:'#6a4a8a', tree:'#3a2a5a', wx:{dark:1}, tier:10, pool:['geck', 'wisp', 'imp', 'stormling'], mood:'story', blurb:'Where the seal was made, long ago.', post:1, temple:1},
  {id:'above', n:'The Sky Above', e:'☁️', ch:21, base:'#f6f8ff', rock:'#b0b8e0', tree:'#4a5a9a', wx:{wind:3, storm:1}, tier:11, pool:['wisp', 'stormling', 'bat'], mood:'action', blurb:'Above the clouds, where the stars begin.', post:1, sky:1},
  {id:'void', n:'The Frozen Void', e:'🌑', ch:22, base:'#9ab0d8', rock:'#2a3458', tree:'#1a2448', wx:{cold:2, dark:1}, tier:12, pool:['wisp', 'stormling', 'geck'], mood:'story', blurb:'Nothing but ice, starlight and silence.', post:1, sky:1, voidL:1}];
const RIDX = {}; REGIONS.forEach((R, i) => { RIDX[R.id] = i; T0.REG['sg_' + R.id] = {n:R.n, tier:R.tier, pool:R.pool, mood:R.mood, haunt:R.wx.dark ? 1 : 0, saga:1}; });
// geckos: Dumpling's minions (they climb walls, so cliffs don't stop them)
T0.FOE.geck = {n:'Geckling', hp:5, sp:135, melee:1, r:13, pts:60, gecko:1};
T0.FOE.geckspit = {n:'Spitter Gecko', hp:6, sp:80, shoot:2, r:14, pts:70, gecko:1};

// ---------- seeded helpers ----------
const rng = sd => { let s = (sd*16807 + 11) % 2147483647 || 7; return () => (s = (s*16807) % 2147483647) / 2147483647; };
const H = T0.hash, NZ = T0.noise;

// ---------- making a region (same every time) ----------
const CACHE = {};
const genRegion = id => { if (CACHE[id]) return CACHE[id]; const R = REGIONS[RIDX[id]], ri = RIDX[id], sd = 9001 + ri*77, rnd = rng(sd);
  const M = new Uint8Array(RW*RH), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < RW && y < RH) M[y*RW + x] = v; }, get = (x, y) => x < 0 || y < 0 || x >= RW || y >= RH ? ROCK : M[y*RW + x];
  const floor0 = R.sand ? SAND : R.cave ? CAVE : R.temple ? FLOOR : R.voidL ? VOIDF : SNOW;
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) { const n1 = NZ(x, y, 7, sd), n2 = NZ(x, y, 3, sd + 1), h = H(x, y, sd + 2); let v = floor0;
    if (id == 'frostfang') v = n1 > .72 ? (n2 > .7 ? DEEP : SNOW) : n1 > .66 ? CLIFF : n1 > .6 && h < .4 ? ROCK : n2 > .78 ? DEEP : h < .03 ? TREE : n1 < .22 ? SLOPE : SNOW;
    else if (id == 'glaciers') v = Math.abs(n1 - .5) < .025 && n2 > .35 ? CHASM : n2 > .7 ? ICE : n1 > .8 ? SNOW : n1 > .74 ? CLIFF : h < .02 ? ROCK : n2 < .18 ? SWIM : SNOW;
    else if (id == 'sunken') { const cx = x % 12, cy = y % 12; v = (cx == 0 || cy == 0) && h > .22 ? WALL : n1 > .62 ? SWIM : FLOOR; }
    else if (id == 'whisper') v = (n1 > .48 && h < .62) || h < .06 ? TREE : n2 > .82 ? SWIM : n2 < .14 ? DEEP : SNOW;
    else if (id == 'sky' || id == 'above') { const isl = n1 + (n2 - .5)*.25; v = isl > .52 ? (h < .04 ? TREE : h < .06 ? ROCK : id == 'above' && n2 > .6 ? CLOUD : SNOW) : CHASM; }
    else if (id == 'desert') v = n1 > .7 && h < .5 ? CRYST : n2 > .76 ? DEEP : h < .015 ? CRYST : n1 < .2 ? SLOPE : SAND;
    else if (id == 'hollow') v = n1 > .7 ? CAVE : n1 > .6 ? (n2 > .5 ? CLIFF : ROCK) : n2 > .8 ? SWIM : CAVE;
    else if (id == 'citadel') { const inK = x > 30 && x < 66 && y < 34; v = inK ? (x == 31 || x == 65 || y == 33 || (y % 8 == 0 && h > .3)) ? WALL : FLOOR : n1 > .74 ? SNOW : n1 > .68 ? CLIFF : h < .03 ? DEAD : n2 > .8 ? DEEP : SNOW; }
    else if (id == 'forbidden') { const cx = x % 16, cy = y % 14; v = (cx == 0 || cy == 0) && h > .18 ? WALL : (cx == 8 && cy == 7) ? PILLAR : n1 > .7 ? SWIM : FLOOR; }
    else if (id == 'void') { const isl = n1 + (n2 - .5)*.3; v = isl > .5 ? (h < .03 ? CRYST : n2 > .7 ? ICE : VOIDF) : CHASM; }
    if (x == 0 || y == 0 || x == RW - 1 || y == RH - 1) v = R.sky || R.voidL ? CHASM : CLIFF;
    set(x, y, v); }
  if (id == 'citadel') { for (let y = 1; y <= 33; y++) for (let x = 31; x <= 65; x++) set(x, y, (x == 31 || x == 65 || y == 1 || y == 33) ? WALL : FLOOR); for (let x = 46; x <= 50; x++) set(x, 33, FLOOR); for (let y = 34; y < 46; y++) for (let x = 46; x <= 50; x++) set(x, y, SNOW); }
  // points of interest, spread over the land
  const spawn = {x:8, y:Math.floor(RH/2)}, pts = [spawn], far = (x, y, d) => pts.every(q => Math.hypot(q.x - x, q.y - y) >= d);
  const pick = (d, minX) => { for (let k = 0; k < 400; k++) { const x = 4 + Math.floor(rnd()*(RW - 8)), y = 4 + Math.floor(rnd()*(RH - 8)); if ((minX || 0) > x) continue; if (far(x, y, d)) { const q = {x, y}; pts.push(q); return q; } } const q = {x:6 + Math.floor(rnd()*(RW - 12)), y:6 + Math.floor(rnd()*(RH - 12))}; pts.push(q); return q; };
  if (id == 'citadel') pts.push({x:48, y:17}, {x:40, y:10}, {x:56, y:24}, {x:40, y:24}, {x:56, y:10});
  const lair = pick(14, RW - 26), tower = pick(14, 30), ways = [spawn, pick(16, 30), pick(16, 50)];
  const shrines = [...Array(6)].map(() => pick(9)), fires = [spawn, ways[1], ways[2]], npcs = [pick(8, 14), pick(8, 30), pick(8, 50)];
  // ground around every point; the boss lair is a wide arena
  const clear = (cx, cy, r, v) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (Math.hypot(x - cx, y - cy) <= r + .3 && x > 0 && y > 0 && x < RW - 1 && y < RH - 1) set(x, y, v); };
  const ground = R.sand ? SAND : R.cave ? CAVE : R.temple || R.castle ? FLOOR : R.voidL ? VOIDF : SNOW;
  // paths from the gate to everything: cliffs and chasms are left in some gaps on purpose (climb them, or glide over)
  const carve = (a, b, keepGaps) => { const L = Math.hypot(b.x - a.x, b.y - a.y); let gapLeft = 0; for (let i = 0; i <= L; i++) { const x = Math.round(a.x + (b.x - a.x)*i/L), y = Math.round(a.y + (b.y - a.y)*i/L), v = get(x, y);
      if (keepGaps && (v == CLIFF || v == CHASM) && gapLeft < 3 && i > 4 && i < L - 4) { gapLeft++; continue; } gapLeft = 0;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) { const v2 = get(x + dx, y + dy); if (v2 == CLIFF || v2 == CHASM || v2 == ROCK || v2 == TREE || v2 == WALL || v2 == CRYST || v2 == PILLAR || (v2 == SWIM && !keepGaps)) set(x + dx, y + dy, R.sky || R.voidL ? ground : v2 == SWIM ? (R.temple ? SWIM : ground) : ground); } } };
  const hub = [spawn, ...ways.slice(1), tower, lair, ...shrines, ...npcs];
  // a winding main road through every point in order, gaps kept so the new skills are needed
  let prev = spawn; [...hub.slice(1)].sort((a, b) => a.x - b.x).forEach(q => { carve(prev, q, true); prev = q; });
  if (id == 'citadel') carve(spawn, {x:48, y:44}, false);
  // and a gap-free back road to the gate from the waystones, so you can always walk home
  ways.slice(1).forEach(w => carve(w, spawn, false)); carve(lair, ways[2], false);
  clear(spawn.x, spawn.y, 3, ground); clear(lair.x, lair.y, id == 'void' || id == 'forbidden' || id == 'above' ? 11 : 7, ground); ways.forEach(w => clear(w.x, w.y, 2, ground)); npcs.forEach(q => clear(q.x, q.y, 2, ground)); clear(tower.x, tower.y, 2, ground); set(tower.x, tower.y, TOWER);
  shrines.forEach(q => { clear(q.x, q.y, 2, ground); set(q.x, q.y, SHRINE); });
  // ingredients, feathers (collectibles) and secret caves
  const ING = R.sand ? ['honey', 'pepper', 'berry'] : R.cave ? ['mush', 'mush', 'fish'] : R.sky ? ['berry', 'honey', 'pepper'] : ['berry', 'pepper', 'fish', 'mush', 'honey'];
  const okFloor = (x, y) => { const v = get(x, y); return v == ground || v == SNOW || v == SAND || v == CAVE || v == FLOOR || v == VOIDF || v == CLOUD || v == ICE || v == SLOPE; };
  const scatter = (n, minD, ok2) => { const out = []; for (let k = 0; k < n*60 && out.length < n; k++) { const x = 2 + Math.floor(rnd()*(RW - 4)), y = 2 + Math.floor(rnd()*(RH - 4)); if (!okFloor(x, y) || (ok2 && !ok2(x, y))) continue; if (out.some(q => Math.hypot(q.x - x, q.y - y) < minD) || pts.some(q => Math.hypot(q.x - x, q.y - y) < 3)) continue; out.push({x, y}); } return out; };
  const nearWater = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => get(x + dx, y + dy) == SWIM);
  const ing = scatter(14, 6).map((q, i) => ({...q, k:ING[i % ING.length] == 'fish' && !nearWater(q.x, q.y) ? 'berry' : ING[i % ING.length], id:i}));
  const fishSpots = scatter(4, 10, nearWater).map((q, i) => ({...q, k:'fish', id:100 + i}));
  const feathers = scatter(R.post ? 10 : 25, 5).map((q, i) => ({...q, id:i}));
  const C = {id, R, ri, M, spawn, lair, tower, ways, shrines, fires, npcs, ing:[...ing, ...fishSpots], feathers, ground, temp:new Map()}; CACHE[id] = C; return C; };

// =====================================================================================================
A.snowSaga = S => {
  const {X, W, g, TS, RX, p} = S; const A2 = S.A;
  const SV = W.saga = Object.assign({v:1, stam:100, ch:0, step:0, emb:0, embUsed:0, shr:{}, fe:{}, ing:{}, inv:{}, buf:{}, tow:{}, way:{}, fog:{}, seen:{}, time:0, cloak:0, at:null, fights:{}, flags:{}}, W.saga || {});
  ['shr', 'fe', 'ing', 'inv', 'buf', 'tow', 'way', 'fog', 'seen', 'fights', 'flags'].forEach(k => { SV[k] = SV[k] || {}; });
  let cur = null, C = null, stam = SV.stam, stamShow = 0, mode = '', lastSafe = null, modal = null, wind = {a:0, f:0, t:3}, coldT = 8, coldTold = 0, bolts = [], fogA = 0, mini = null, mg = null, rfog = null, fogDirty = 0;
  const story = () => SAGA.story;   // the chapters (snow-saga-story.js) fill this in
  const stamMax = () => SV.stam;
  const now = () => Date.now();
  const buffOn = k => (SV.buf[k] || 0) > now();
  const tl = (tx, ty) => { if (!C) return ROCK; const x = tx - RX; if (x < 0 || ty < 0 || x >= RW || ty >= RH) return C.R.sky || C.R.voidL ? CHASM : CLIFF; const k2 = ty*RW + x, tv = C.temp.get(k2); return tv ? tv.v : C.M[k2]; };
  const W2T = q => ({x:(RX + q.x + .5)*TS, y:(q.y + .5)*TS});
  const inside = (x, y) => { const tx = Math.floor(x/TS) - RX, ty = Math.floor(y/TS); return !!C && tx >= 1 && ty >= 1 && tx < RW - 1 && ty < RH - 1 && !T0.SOLID[tl(tx + RX, ty)] && tl(tx + RX, ty) != SWIM; };
  A.sagaReg = (x, y) => C ? 'sg_' + C.id : 'raid';
  const unlocked = id => { const st = story(); if (st && st.unlocked) return st.unlocked(id); return (W.sp|0) >= 6 && !REGIONS[RIDX[id]].post; };
  // ---------- region fog + mini map ----------
  const FB = RW/2, FBH = RH/2;
  const loadFog = () => { rfog = new Uint8Array(FB*FBH); const s2 = SV.fog[cur] || ''; for (let i = 0; i < s2.length; i++) { const v = parseInt(s2[i], 16) || 0; for (let b = 0; b < 4; b++) if (v & (1 << b)) { const j = i*4 + b; if (j < rfog.length) rfog[j] = 1; } } };
  const fogStr = () => { let s2 = ''; for (let i = 0; i < rfog.length; i += 4) s2 += (rfog[i] | rfog[i + 1] << 1 | rfog[i + 2] << 2 | rfog[i + 3] << 3).toString(16); return s2.replace(/0+$/, ''); };
  const paint = i => { const bx = (i % FB)*2, by = Math.floor(i/FB)*2; for (let y = by; y < by + 2; y++) for (let x = bx; x < bx + 2; x++) { mg.fillStyle = T0.MINI[C.M[y*RW + x]] || C.R.base; if (C.M[y*RW + x] == SNOW || C.M[y*RW + x] == SAND || C.M[y*RW + x] == FLOOR || C.M[y*RW + x] == CAVE || C.M[y*RW + x] == VOIDF) mg.fillStyle = C.R.base; mg.fillRect(x, y, 1, 1); } };
  const buildMini = () => { mini = document.createElement('canvas'); mini.width = RW; mini.height = RH; mg = mini.getContext('2d'); mg.fillStyle = '#1a2440'; mg.fillRect(0, 0, RW, RH); for (let i = 0; i < rfog.length; i++) if (rfog[i]) paint(i); };
  const reveal = (all) => { if (!cur) return; let ch = 0; if (all) { for (let i = 0; i < rfog.length; i++) if (!rfog[i]) { rfog[i] = 1; paint(i); ch++; } }
    else { const bx = Math.floor((p.x/TS - RX)/2), by = Math.floor(p.y/TS/2), R0 = 4; for (let y = by - R0; y <= by + R0; y++) for (let x = bx - R0; x <= bx + R0; x++) { if (x < 0 || y < 0 || x >= FB || y >= FBH || Math.hypot(x - bx, y - by) > R0 + .3) continue; const i = y*FB + x; if (!rfog[i]) { rfog[i] = 1; paint(i); ch++; } } }
    if (ch) { SV.fog[cur] = fogStr(); fogDirty = 1; } };
  const seenAt = q => rfog && rfog[Math.floor(q.y/2)*FB + Math.floor(q.x/2)];
  // ---------- going places ----------
  const enter = (id, wi, quiet) => { if (S.raid || S.siege) { S.say('Finish what you’re doing first', 2); return; } cur = id; C = genRegion(id); loadFog(); buildMini(); SV.seen[id] = 1; const w = C.ways[wi || 0] || C.spawn, q = W2T(w);
    p.x = q.x; p.y = q.y + 40; p.vx = p.vy = 0; S.foes = []; S.balls = []; S.boss = null; S.tornado = null; S.mateHome(); S.mau.x = p.x - 40; S.mau.y = p.y + 10; SV.way[id + ':' + (wi || 0)] = 1; lastSafe = {x:p.x, y:p.y}; stam = stamMax(); S.riding = false;
    S.lastReg = ''; reveal(); if (!quiet) { S.say(C.R.e + ' ' + C.R.n, 3); A2.sfx('win'); } SV.at = {id, x:p.x, y:p.y, rx:RX}; if (story() && story().entered) story().entered(id); S.save(); };
  const leave = (msg) => { cur = null; C = null; SV.at = null; const q = S.CAMPX; p.x = q.x; p.y = q.y; p.vx = p.vy = 0; S.foes = []; S.balls = []; S.boss = null; S.mateHome(); S.mau.x = p.x - 40; S.mau.y = p.y + 10; S.lastReg = ''; mode = ''; S.say(msg || '🏕 Back at Camp Cocoa', 2.4); S.save(); };
  // ---------- expedition board (at camp) ----------
  const BOARD = {x:57.5*TS, y:84.6*TS}, STATUE = {x:44.5*TS, y:81.6*TS};
  const expedition = () => S.openPanelUI(() => ({title:'🧭 Expedition Board · The Dumpling Saga', sub:'Travel to the new lands. A land opens when the story reaches it. ' + (SV.cloak ? 'You have the Snow Cloak (glide over gaps).' : 'Tip: the Snow Cloak lets you glide over gaps.'),
    rows:REGIONS.filter(R => !R.post || unlocked(R.id) || SV.seen[R.id]).map(R => { const on = unlocked(R.id) || SV.seen[R.id], ways = [0, 1, 2].filter(i => SV.way[R.id + ':' + i]).length, sh = [0, 1, 2, 3, 4, 5].filter(j => SV.shr[R.id + ':' + j]).length;
      return {e:R.e, n:R.n + (on ? ' · ' + sh + '/6 shrines · ' + Object.keys(SV.fe).filter(k => k.startsWith(R.id + ':')).length + '/' + (R.post ? 10 : 25) + ' 🪶' : ''), d:on ? R.blurb : '🔒 ' + (story() && story().lockText ? story().lockText(R.id) : 'Keep following the story'), btn:on ? 'Travel' + (ways > 1 ? ' (' + ways + ' waystones)' : '') : '🔒', ok:on, fn:() => { S.panel = null; enter(R.id, 0); }}; })}));
  // ---------- the Aurora Statue: 4 Frost Emblems → +1 heart or +20 stamina ----------
  // blessings are split evenly: there are only so many shrines, so each blessing has its own cap (old saves keep anything above it)
  const SHR_ALL = REGIONS.length*6, BL_CAP = Math.ceil(Math.floor(SHR_ALL/4)/2), blS = () => Math.max(0, Math.round((SV.stam - 100)/20)), blH = () => Math.max(0, SV.embUsed - blS());
  const statue = () => S.openPanelUI(() => { const have = SV.emb - SV.embUsed*4, hH = blH(), hS = blS(); return {title:'🗽 The Aurora Statue', sub:'Every Ice Shrine gives a Frost Emblem (' + SV.emb + ' of ' + SHR_ALL + ' found). Bring 4 for a blessing: up to ' + BL_CAP + ' of each, so there are always enough shrines for both.',
    rows:[{e:'❤️', n:'Blessing of the Heart · +1 max heart (' + Math.min(hH, BL_CAP) + '/' + BL_CAP + ')', d:'You have ' + Math.max(0, have) + ' unused emblem' + (have == 1 ? '' : 's'), btn:hH >= BL_CAP ? 'MAX' : 'Use 4 emblems', ok:have >= 4 && hH < BL_CAP, fn:() => { if (hH >= BL_CAP || have < 4) return; SV.embUsed++; W.extraHp = (W.extraHp|0) + 1; p.max++; p.hp = p.max; A2.sfx('win'); S.say('❤️ +1 max heart! (' + p.max + ')', 3); S.save(); }},
      {e:'💚', n:'Blessing of Endurance · +20 stamina (' + Math.min(hS, BL_CAP) + '/' + BL_CAP + ')', d:'Stamina: ' + stamMax(), btn:hS >= BL_CAP ? 'MAX' : 'Use 4 emblems', ok:have >= 4 && hS < BL_CAP, fn:() => { if (hS >= BL_CAP || have < 4) return; SV.embUsed++; SV.stam += 20; stam = stamMax(); A2.sfx('win'); S.say('💚 Stamina ' + stamMax() + '!', 3); S.save(); }}]}; });
  // ---------- cooking ----------
  const INGN = {berry:['🫐', 'Snowberry'], pepper:['🌶️', 'Ice Pepper'], fish:['🐟', 'Frost Fish'], mush:['🍄', 'Glow Mushroom'], honey:['🍯', 'Crystal Honey']};
  const RECIPES = [{k:'stew', e:'🍲', n:'Warm Stew', need:{pepper:1, fish:1}, d:'No cold damage for 6 minutes', buf:{warm:360}},
    {k:'soup', e:'🥣', n:'Stamina Soup', need:{mush:1, berry:1}, d:'Stamina refills 3× faster and +50% max for 5 minutes', buf:{stam:300}},
    {k:'pie', e:'🥧', n:'Hearty Pie', need:{berry:2, honey:1}, d:'Heals you fully, +2 hearts over your max until you’re hit', heal:1},
    {k:'porridge', e:'🍚', n:'Power Porridge', need:{honey:1, pepper:1}, d:'+40% snowball damage for 3 minutes', buf:{power:180}},
    {k:'skewer', e:'🍢', n:'Mau Mau’s Fish Skewer', need:{fish:2}, d:'+3 treats for Mau Mau and everything above', treats:3},
    {k:'feast', e:'🍱', n:'Royal Feast', need:{berry:1, pepper:1, fish:1, mush:1, honey:1}, d:'All buffs for 8 minutes', buf:{warm:480, stam:480, power:480}, heal:1}];
  const cook = () => S.openPanelUI(() => ({title:'🍳 Campfire cooking', sub:'Pick ingredients around the lands (✋ on 🫐🌶️🍄🍯, fish at the water’s edge). You have: ' + Object.keys(INGN).map(k => INGN[k][0] + ' ' + (SV.inv[k]|0)).join('  '),
    rows:RECIPES.map(r => { const ok = Object.keys(r.need).every(k => (SV.inv[k]|0) >= r.need[k]); return {e:r.e, n:r.n + ' · ' + Object.keys(r.need).map(k => r.need[k] + INGN[k][0]).join(' '), d:r.d, btn:'Cook', ok, fn:() => {
      Object.keys(r.need).forEach(k => SV.inv[k] -= r.need[k]); if (r.buf) Object.keys(r.buf).forEach(k => SV.buf[k] = Math.max(SV.buf[k] || 0, now()) + r.buf[k]*1000); if (r.heal) { p.hp = p.max + 2; } if (r.treats) W.treats = (W.treats|0) + r.treats;
      A2.sfx('coin'); S.say(r.e + ' ' + r.n + '! ' + r.d, 3.4); if (W.mau) S.mauSay(['Mmm! Is that for me? It’s for me.', 'Royal Guard taste test: APPROVED.', 'I’ll guard the leftovers. Forever.'][Math.floor(Math.random()*3)], 2.6); X.stat && X.stat('sagaCook', 1, 'add'); S.save(); }}; })}));
  // ---------- ICE SHRINES: puzzles made by a generator and checked by a solver ----------
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const slideBFS = (P, w, h, s, goal, cryst) => { // positions where you stop on ice, with crystals collected as a bitmask
    const key = (pos, m) => pos*16 + m, seen = new Map(), q = [[s, 0, 0]]; seen.set(key(s, 0), 0); let best = null;
    while (q.length) { const [pos, m, d] = q.shift(); if (pos == goal && m == (1 << cryst.length) - 1) { best = d; break; }
      for (const [dx, dy] of DIRS) { let x = pos % w, y = Math.floor(pos/w), m2 = m, moved = 0; while (true) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || P[ny*w + nx] == 1) break; x = nx; y = ny; moved = 1; const ci = cryst.indexOf(y*w + x); if (ci >= 0) m2 |= 1 << ci; if (y*w + x == goal && m2 == (1 << cryst.length) - 1) break; }
        if (!moved) continue; const np = y*w + x, k = key(np, m2); if (seen.has(k)) continue; seen.set(k, d + 1); q.push([np, m2, d + 1]); } }
    return {best, seen}; };
  const pushBFS = (P, w, h, s, blocks, sw) => { // sokoban with 1–2 blocks; returns the fewest moves
    const enc = (pp, bb) => pp + ',' + bb.slice().sort((a, b) => a - b).join('/'), q = [[s, blocks, 0]], seen = new Set([enc(s, blocks)]);
    while (q.length && seen.size < 60000) { const [pp, bb, d] = q.shift(); if (sw.every(x => bb.includes(x))) return d;
      for (const [dx, dy] of DIRS) { const x = pp % w + dx, y = Math.floor(pp/w) + dy; if (x < 0 || y < 0 || x >= w || y >= h || P[y*w + x] == 1) continue; const np = y*w + x; let nb = bb; const bi = bb.indexOf(np);
        if (bi >= 0) { const bx = x + dx, by = y + dy; if (bx < 0 || by < 0 || bx >= w || by >= h || P[by*w + bx] == 1 || bb.includes(by*w + bx)) continue; nb = bb.slice(); nb[bi] = by*w + bx; }
        const k = enc(np, nb); if (seen.has(k)) continue; seen.add(k); q.push([np, nb, d + 1]); } }
    return null; };
  const PCACHE = {};
  const makePuzzle = (rid, j) => { const k = rid + ':' + j; if (PCACHE[k]) return PCACHE[k]; const ri = RIDX[rid], level = ri*6 + j, kind = ['slide', 'gems', 'push'][(level + ri) % 3], want = 4 + Math.min(6, Math.floor(level/9));
    for (let tr = 0; tr < 400; tr++) { const rnd = rng(31337 + level*1009 + tr*7919), w = kind == 'push' ? 8 + (level % 3) : 11 + (level % 3), h = kind == 'push' ? 7 + (level % 2) : 9, P = new Array(w*h).fill(0), dens = kind == 'push' ? .14 : .13 + .02*(level % 4);
      for (let i = 0; i < w*h; i++) if (rnd() < dens) P[i] = 1; const free = () => { for (let k2 = 0; k2 < 200; k2++) { const i = Math.floor(rnd()*w*h); if (!P[i]) return i; } return -1; };
      const s = free(); if (s < 0) continue;
      if (kind == 'push') { const nb = level >= 30 ? 2 : 1, bl = [], sw = []; for (let i = 0; i < nb; i++) { let b = free(), x = b % w, y = Math.floor(b/w); if (b < 0 || b == s || bl.includes(b) || x == 0 || y == 0 || x == w - 1 || y == h - 1) { i--; if (bl.length + sw.length > 50) break; continue; } bl.push(b); }
        for (let i = 0; i < nb; i++) { const q2 = free(); if (q2 < 0 || q2 == s || bl.includes(q2) || sw.includes(q2)) { i--; continue; } sw.push(q2); }
        if (bl.length != nb || sw.length != nb) continue; const d = pushBFS(P, w, h, s, bl, sw); if (d == null || d < want + 2) continue; return (PCACHE[k] = {kind, w, h, P, s, blocks:bl, sw, best:d}); }
      const nc = kind == 'gems' ? (level >= 24 ? 3 : 2) : 0, cr = []; const base = slideBFS(P, w, h, s, -1, []); const stops = [...base.seen.keys()].map(k2 => Math.floor(k2/16));
      if (stops.length < 6) continue; let goal = -1, gd = -1; base.seen.forEach((d, k2) => { if (d > gd) { gd = d; goal = Math.floor(k2/16); } });
      if (kind == 'gems') { for (let i = 0; i < nc; i++) { const c2 = stops[Math.floor(rnd()*stops.length)]; if (c2 == s || c2 == goal || cr.includes(c2)) { i--; if (cr.length > 30) break; continue; } cr.push(c2); } if (cr.length != nc) continue; }
      const r2 = slideBFS(P, w, h, s, goal, cr); if (r2.best == null || r2.best < want) continue; return (PCACHE[k] = {kind, w, h, P, s, goal, cryst:cr, best:r2.best}); }
    // fallback (never used in practice): an open room
    const w = 9, h = 7, P = new Array(w*h).fill(0); return (PCACHE[k] = {kind:'slide', w, h, P, s:0, goal:w*h - 1, cryst:[], best:2}); };
  const openShrine = j => { const P = makePuzzle(cur, j); modal = {kind:'shrine', j, P, pos:P.s, got:0, blocks:(P.blocks || []).slice(), moves:0, anim:null, done:false, hist:[]}; A2.sfx('blip'); };
  const shrineMove = (dx, dy) => { const M2 = modal; if (!M2 || M2.done || M2.anim) return; const P = M2.P, w = P.w, h = P.h; let x = M2.pos % w, y = Math.floor(M2.pos/w);
    if (P.kind == 'push') { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || P.P[ny*w + nx]) return; const np = ny*w + nx, bi = M2.blocks.indexOf(np);
      if (bi >= 0) { const bx = nx + dx, by = ny + dy; if (bx < 0 || by < 0 || bx >= w || by >= h || P.P[by*w + bx] || M2.blocks.includes(by*w + bx)) { A2.sfx('bad'); return; } M2.hist.push([M2.pos, M2.blocks.slice()]); M2.blocks[bi] = by*w + bx; A2.tone(180, .06, 'square', .03); } else M2.hist.push([M2.pos, M2.blocks.slice()]);
      M2.anim = {from:M2.pos, to:np, t:0, d:.09}; M2.pos = np; M2.moves++; if (P.sw.every(q => M2.blocks.includes(q))) win(); return; }
    let moved = 0, path = [M2.pos]; while (true) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || P.P[ny*w + nx]) break; x = nx; y = ny; moved = 1; path.push(y*w + x); const ci = P.cryst.indexOf(y*w + x); if (ci >= 0) M2.got |= 1 << ci; if (y*w + x == P.goal && M2.got == (1 << P.cryst.length) - 1) break; }
    if (!moved) { A2.sfx('bad'); return; } M2.hist.push([M2.pos, M2.got]); M2.anim = {from:M2.pos, to:y*w + x, t:0, d:.05*path.length}; M2.pos = y*w + x; M2.moves++; A2.tone(520, .04, 'triangle', .02); if (M2.pos == P.goal && M2.got == (1 << P.cryst.length) - 1) win(); };
  const win = () => { const M2 = modal, k = cur + ':' + M2.j, first = !SV.shr[k]; M2.done = true; A2.sfx('win'); if (first) { SV.shr[k] = 1; SV.emb++; S.give({frost:8 + RIDX[cur], flakes:300, xp:50}); X.stat && X.stat('sagaShrine', Object.keys(SV.shr).length, 'max'); S.save(); } M2.first = first; };
  const shrineReset = () => { if (!modal) return; modal.pos = modal.P.s; modal.got = 0; modal.blocks = (modal.P.blocks || []).slice(); modal.moves = 0; modal.hist = []; modal.anim = null; };
  const shrineUndo = () => { const M2 = modal; if (!M2 || !M2.hist.length || M2.done) return; const h2 = M2.hist.pop(); M2.pos = h2[0]; if (M2.P.kind == 'push') M2.blocks = h2[1]; else M2.got = h2[1]; M2.moves = Math.max(0, M2.moves - 1); M2.anim = null; };
  let shR = [];
  const drawShrine = () => { const M2 = modal, P = M2.P, VW = S.VW, VH = S.VH; g.fillStyle = 'rgba(8,20,48,.94)'; g.fillRect(0, 0, VW, 720);
    const cs = Math.floor(Math.min((VW - 40)/P.w, (VH - 230)/P.h, 56)), BWd = cs*P.w, BH = cs*P.h, bx = VW/2 - BWd/2, by = 96;
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 22px ' + A2.font; g.fillText('🧊 Ice Shrine ' + (M2.j + 1) + ' of ' + C.R.n, VW/2, 40);
    g.font = '600 12px ' + A2.font; g.fillStyle = '#9fe8ff'; g.fillText(P.kind == 'push' ? 'Push every snow block onto a glowing switch. Blocks can’t be pulled.' : P.kind == 'gems' ? 'The floor is ice: you slide until you hit something. Grab every 💎, then stop on the ⭐.' : 'The floor is ice: you slide until you hit something. Stop exactly on the ⭐.', VW/2, 62);
    g.fillText('Moves ' + M2.moves + ' · best possible ' + P.best + ' · arrows/WASD · Z undo · R restart · Esc leave', VW/2, 80);
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const i = y*P.w + x, sx = bx + x*cs, sy = by + y*cs; g.fillStyle = P.kind == 'push' ? ((x + y) % 2 ? '#e8f0fa' : '#dde8f4') : ((x + y) % 2 ? '#c4e8fa' : '#b6e0f6'); g.fillRect(sx, sy, cs, cs);
      if (P.P[i]) { g.fillStyle = '#5a6a8a'; S.rr(g, sx + 2, sy + 2, cs - 4, cs - 4, 6); g.fill(); g.fillStyle = '#7a8aaa'; S.rr(g, sx + 4, sy + 4, cs - 8, (cs - 8)*.45, 5); g.fill(); }
      if (P.kind != 'push' && i == P.goal) { g.font = Math.floor(cs*.6) + 'px ' + A2.font; g.fillText('⭐', sx + cs/2, sy + cs*.72); }
      if (P.kind == 'gems') { const ci = P.cryst.indexOf(i); if (ci >= 0 && !(M2.got & (1 << ci))) { g.font = Math.floor(cs*.55) + 'px ' + A2.font; g.fillText('💎', sx + cs/2, sy + cs*.7); } }
      if (P.kind == 'push' && P.sw.includes(i)) { g.fillStyle = 'rgba(213,243,103,' + (.6 + .3*Math.sin(S.t*4)) + ')'; g.beginPath(); g.arc(sx + cs/2, sy + cs/2, cs*.3, 0, TAU); g.fill(); } }
    if (P.kind == 'push') M2.blocks.forEach(b => { const sx = bx + (b % P.w)*cs, sy = by + Math.floor(b/P.w)*cs, on = P.sw.includes(b); g.fillStyle = on ? '#D5F367' : '#ffffff'; S.rr(g, sx + 4, sy + 4, cs - 8, cs - 8, 8); g.fill(); g.strokeStyle = '#9ec4e8'; g.lineWidth = 2; g.stroke(); });
    let px2 = M2.pos % P.w, py2 = Math.floor(M2.pos/P.w); if (M2.anim) { M2.anim.t += 1/60; const k = Math.min(1, M2.anim.t/M2.anim.d), fx2 = M2.anim.from % P.w, fy2 = Math.floor(M2.anim.from/P.w); px2 = fx2 + (px2 - fx2)*k; py2 = fy2 + (py2 - fy2)*k; if (k >= 1) M2.anim = null; }
    S.kid(bx + (px2 + .5)*cs, by + (py2 + .5)*cs + cs*.25, X.CL().col, {face:0, walk:0, outfit:W.outfit});
    shR = []; const btn = (txt, x, y, w, fn, on) => { g.fillStyle = on ? '#D5F367' : 'rgba(255,255,255,.16)'; S.rr(g, x, y, w, 40, 12); g.fill(); g.fillStyle = on ? '#14204a' : '#fff'; g.font = '800 14px ' + A2.font; g.textAlign = 'center'; g.fillText(txt, x + w/2, y + 26); shR.push({x, y, w, h:40, fn}); };
    const by2 = by + BH + 14;
    if (M2.done) { g.fillStyle = '#D5F367'; g.font = '900 20px ' + A2.font; g.textAlign = 'center'; g.fillText(M2.first ? '✨ Shrine cleared! +1 Frost Emblem (' + SV.emb + ') · take 4 to the Aurora Statue' : '✨ Solved again! (already cleared)', VW/2, by2 + 20); btn('Leave the shrine', VW/2 - 90, by2 + 34, 180, () => { modal = null; }, true); return; }
    if (S.touchUI) { const cx = VW/2, cy = by2 + 70; btn('▲', cx - 30, cy - 46, 60, () => shrineMove(0, -1)); btn('◀', cx - 96, cy, 60, () => shrineMove(-1, 0)); btn('▼', cx - 30, cy, 60, () => shrineMove(0, 1)); btn('▶', cx + 36, cy, 60, () => shrineMove(1, 0)); btn('↶', cx - 200, cy, 60, shrineUndo); btn('Restart', cx + 120, cy, 90, shrineReset); btn('Leave', cx - 290, cy, 80, () => { modal = null; }); }
    else { btn('↶ Undo (Z)', VW/2 - 250, by2, 140, shrineUndo); btn('Restart (R)', VW/2 - 100, by2, 140, shrineReset); btn('Leave (Esc)', VW/2 + 50, by2, 140, () => { modal = null; }); } };
  // ---------- movement in the new lands: climbing, gliding, sledding, swimming ----------
  const passFor = (v, how) => v == CLIFF ? how.climb : v == CHASM ? how.glide : !T0.SOLID[v];
  const blockedFor = (x, y, r, how) => { const c = (xx, yy) => !passFor(tl(Math.floor(xx/TS), Math.floor(yy/TS)), how); return c(x - r, y - r) || c(x + r, y - r) || c(x - r, y + r) || c(x + r, y + r); };
  const fall = (why) => { mode = ''; if (lastSafe) { p.x = lastSafe.x; p.y = lastSafe.y; } p.vx = p.vy = 0; if (!A2.immortal) { p.hp = Math.max(0, p.hp - 1); if (p.hp <= 0) { p.hp = 1; } } p.inv = Math.max(p.inv, 1.2); S.say(why, 2.4); A2.sfx('bad'); S.shakeV = 6; };
  const move = (dt, mx, my) => { if (!cur) return false; const PW = SAGA.pw || {}; if (PW.invert) { mx = -mx; my = -my; }
    const tx = Math.floor(p.x/TS), ty = Math.floor(p.y/TS), v = tl(tx, ty), moving = mx || my, sm = stamMax()*(buffOn('stam') ? 1.5 : 1);
    const ahead = moving ? tl(Math.floor((p.x + mx*20)/TS), Math.floor((p.y + my*20)/TS)) : v;
    const canClimb = stam > 0, canGlide = SV.cloak && stam > 0;
    const fly = (PW.flyT || 0) > 0, how = {climb:fly || v == CLIFF || (ahead == CLIFF && canClimb), glide:fly || v == CHASM || (ahead == CHASM && canGlide)};
    mode = fly ? 'fly' : v == CLIFF ? 'climb' : v == CHASM ? 'glide' : v == SWIM ? 'swim' : '';
    // stamina
    const drain = mode == 'climb' ? (moving ? 9 : 2) : mode == 'glide' ? (SV.flags.starCloak ? 6.5 : 13) : mode == 'swim' ? (moving ? 9 : 4) : 0;
    if (drain) { stam -= drain*dt*(1 - .08*Math.min(5, (SV.flags.gripLv|0))); stamShow = 2; } else if (stam < sm) { stam = Math.min(sm, stam + dt*(buffOn('stam') ? 80 : 40)); stamShow = Math.max(stamShow, .8); } else stamShow = Math.max(0, stamShow - dt);
    if (stam <= 0) { stam = 0; if (mode == 'climb') { mode = ''; if (lastSafe) { p.x = lastSafe.x; p.y = lastSafe.y; } p.vx = p.vy = 0; S.say('😓 Too tired! You slide back down. Rest a second, then climb again', 2.4); return true; } if (mode == 'glide') { fall(SV.cloak ? '💨 Out of stamina mid-air… you drift back down' : '🕳️ You need the Snow Cloak to glide over that'); return true; } if (mode == 'swim') { fall('🌊 Too tired to swim! Back to the shore'); return true; } }
    if (v == CHASM && !SV.cloak && !fly) { fall('🕳️ Careful! You need the Snow Cloak to cross gaps'); return true; }
    // speed
    let spd = 215*X.spd()*(PW.slow || 1); if (mode == 'fly') spd = 300; else if (mode == 'climb') spd = 200 + 8*(SV.flags.gripLv|0); else if (mode == 'glide') spd = 270; else if (mode == 'swim') spd *= .55; else if (v == DEEP) spd *= .62; else if (v == SAND) spd *= .88; else if (v == PATH || v == FLOOR || v == CLOUD) spd *= 1.15;
    if (S.riding && W.mount && v == SLOPE) spd *= 1.25;
    const k2 = v == ICE ? 2.2 + .8*X.gStat('boots') : mode == 'glide' ? 3 : 14;
    if (!(p.roll > 0)) { p.vx += (mx*spd - p.vx)*Math.min(1, k2*dt); p.vy += (my*spd - p.vy)*Math.min(1, k2*dt); }
    if (v == SLOPE) { p.vy += (S.riding && W.mount ? 420 : 120)*dt; if (S.riding && W.mount && !S.low() && Math.random() < .5) S.splat(p.x, p.y + 12, 1, '#ffffff'); }
    if (C.R.wx.wind && (mode == 'glide' || wind.f > 0)) { const push = (mode == 'glide' ? 120 : 30)*C.R.wx.wind*(wind.f > 0 ? 1 : .3); p.vx += Math.cos(wind.a)*push*dt; p.vy += Math.sin(wind.a)*push*dt; }
    if (PW.drift) { p.vx += PW.drift.x*dt; p.vy += PW.drift.y*dt; } if (PW.pull) { const a = Math.atan2(PW.pull.y - p.y, PW.pull.x - p.x), dd = Math.hypot(PW.pull.x - p.x, PW.pull.y - p.y); if (dd < 520) { p.vx += Math.cos(a)*PW.pull.f*dt; p.vy += Math.sin(a)*PW.pull.f*dt; } }
    const nx = p.x + p.vx*dt, ny = p.y + p.vy*dt, inB = blockedFor(p.x, p.y, 12, how), rB = inB ? 3 : 12;   /* already touching a gap/wall edge: only the middle has to stay clear, so you can always walk back out */
    if (!blockedFor(nx, p.y, rB, how)) p.x = nx; else p.vx = 0; if (!blockedFor(p.x, ny, rB, how)) p.y = ny; else p.vy = 0;
    const v2 = tl(Math.floor(p.x/TS), Math.floor(p.y/TS)); if (v2 != CLIFF && v2 != CHASM && v2 != SWIM && !T0.SOLID[v2] && !blockedFor(p.x, p.y, 13, {climb:false, glide:false})) { if (!lastSafe || Math.hypot(lastSafe.x - p.x, lastSafe.y - p.y) > 40) lastSafe = {x:p.x, y:p.y}; }
    if (mode == 'climb' && moving) p.walk += dt*.6;
    const ALL = {climb:true, glide:true}; if (blockedFor(p.x, p.y, 8, ALL)) { inSolidT += dt; if (inSolidT > .4 && lastSafe && !blockedFor(lastSafe.x, lastSafe.y, 8, ALL)) { inSolidT = 0; p.x = lastSafe.x; p.y = lastSafe.y; p.vx = p.vy = 0; S.say('🧭 Unstuck!', 1.4); } } else inSolidT = 0;
    if (moving) { stuckT = Math.hypot(p.x - (stuckAt.x || 0), p.y - (stuckAt.y || 0)) < 6 ? stuckT + dt : 0; if (stuckT == 0) stuckAt = {x:p.x, y:p.y}; if (stuckT > 1.5 && lastSafe && Math.hypot(lastSafe.x - p.x, lastSafe.y - p.y) > 8) { stuckT = 0; p.x = lastSafe.x; p.y = lastSafe.y; p.vx = p.vy = 0; S.say('🧭 Unstuck! Back to solid ground', 2); } } else stuckT = 0;
    return true; };
  let stuckT = 0, stuckAt = {}, inSolidT = 0;
  // ---------- things you can use in the lands ----------
  const fireAt = i => W2T(C.fires[i]);
  const things = L => {
    if (!cur) { if ((W.sp|0) >= 6 || Object.keys(SV.seen).length) L.push({x:BOARD.x, y:BOARD.y, n:'Expedition Board', f:expedition}); if (SV.emb || Object.keys(SV.seen).length) L.push({x:STATUE.x, y:STATUE.y, n:'Aurora Statue', f:statue}); if (story() && story().things) story().things(L, null, null, W2T); return; }
    C.fires.forEach((q, i) => { const w = W2T(q); L.push({x:w.x + 30, y:w.y + 6, n:'Cook', f:cook}); });
    const sp = W2T(C.spawn); L.push({x:sp.x - 40, y:sp.y + 30, n:'Return to camp', f:() => leave()}); L.push({x:sp.x + 50, y:sp.y - 40, n:'Aurora Statue', f:statue});
    C.ways.forEach((q, i) => { const w = W2T(q); if (i) L.push({x:w.x, y:w.y, n:'Waystone', f:() => { S.travel = true; S.mapOpen = true; }}); });
    { const w = W2T(C.tower); L.push({x:w.x, y:w.y + 46, n:SV.tow[cur] ? 'Tower (map shown)' : 'Climb the tower', f:() => { if (SV.tow[cur]) { S.say('🗼 You can already see this whole land on the map', 2); return; } SV.tow[cur] = 1; reveal(true); A2.sfx('win'); S.give({frost:5, xp:40}); S.say('🗼 You climb to the top… the whole ' + C.R.n + ' appears on your map!', 3.6); S.save(); }}); }
    C.shrines.forEach((q, j) => { const w = W2T(q); L.push({x:w.x, y:w.y + 40, n:SV.shr[cur + ':' + j] ? 'Shrine ✓ (play again)' : 'Enter Ice Shrine', f:() => openShrine(j)}); });
    C.ing.forEach(it => { const k = cur + ':' + it.id; if ((SV.ing[k] || 0) > now()) return; const w = W2T(it); L.push({x:w.x, y:w.y, n:it.k == 'fish' ? 'Fish' : 'Pick ' + INGN[it.k][1], f:() => { SV.ing[k] = now() + 8*60e3; SV.inv[it.k] = (SV.inv[it.k]|0) + (it.k == 'fish' ? 1 + (Math.random() < .4 ? 1 : 0) : 1); A2.sfx('coin'); S.addNum(w.x, w.y - 20, '+' + INGN[it.k][0], '#00B451'); S.save(); }}); });
    if (story() && story().things) story().things(L, cur, C, W2T); };
  // ---------- per-frame ----------
  let fT = 0, timeT = 0;
  const update = dt => { timeT += dt; if (timeT >= 1) { SV.time = (SV.time || 0) + timeT; timeT = 0; }
    if (story() && story().update) story().update(dt, cur, C, W2T);
    if (!cur) return; fT -= dt; if (fT <= 0) { fT = .25; reveal(); }
    // collectibles: Frost Feathers
    C.feathers.forEach(f2 => { const k = cur + ':' + f2.id; if (SV.fe[k]) return; const w = W2T(f2); if (Math.hypot(w.x - p.x, w.y - p.y) < 34) { SV.fe[k] = 1; const n = Object.keys(SV.fe).length; A2.sfx('coin'); S.addNum(w.x, w.y - 24, '🪶 ' + n, '#2f8ad8'); if (n % 10 == 0) { S.give({frost:10, flakes:500}); S.say('🪶 ' + n + ' Frost Feathers! +10 Frost Crystals', 3); } X.stat && X.stat('sagaFeather', n, 'max'); S.save(); } });
    // weather
    const wx = C.R.wx; wind.t -= dt; if (wx.wind) { if (wind.t <= 0) { if (wind.f > 0) { wind.f = 0; wind.t = 4 + Math.random()*5; } else { wind.f = 2 + Math.random()*2; wind.t = wind.f; wind.a = Math.random()*TAU; } } if (wind.f > 0) wind.f = Math.max(.001, wind.f - dt); }
    if (wx.cold) { const near = C.fires.some(q => { const w = W2T(q); return Math.hypot(w.x - p.x, w.y - p.y) < 160; }), warm = buffOn('warm') || near || X.gStat('scarf') >= 2*wx.cold;
      if (!warm && !S.dlg && S.dead <= 0) { coldT -= dt; if (coldT <= 0) { coldT = 9/wx.cold; S.hurtMe(1); S.addNum(p.x, p.y - 40, '🥶 cold!', '#2f8ad8'); if (now() - coldTold > 60e3) { coldTold = now(); S.say('🥶 It’s freezing here! Cook a Warm Stew, stand by a campfire, or wear a ' + (wx.cold > 1 ? 'Epic' : 'Rare') + ' scarf', 4); } } } else coldT = Math.max(coldT, 4); }
    if (wx.storm && !S.low()) { if (Math.random() < dt*.35*wx.storm && bolts.length < 3) { const a = Math.random()*TAU, r = Math.random()*200; bolts.push({x:p.x + Math.cos(a)*r, y:p.y + Math.sin(a)*r, t:1.2}); } }
    else if (wx.storm && Math.random() < dt*.2 && bolts.length < 1) bolts.push({x:p.x + (Math.random() - .5)*200, y:p.y + (Math.random() - .5)*200, t:1.4});
    for (const b of bolts) { b.t -= dt; if (b.t <= 0 && !b.hit) { b.hit = 1; S.stormFlash = .35; A2.tone(90, .3, 'sawtooth', .04); if (Math.hypot(b.x - p.x, b.y - p.y) < 56) S.hurtMe(2); } } bolts = bolts.filter(b => b.t > -.25);
    // temporary ice from snowballs: throw at water to freeze a bridge
    for (const b of S.balls) { if (!b.mine) continue; const bt = Math.floor(b.x/TS), by = Math.floor(b.y/TS), x = bt - RX; if (x < 0 || x >= RW || by < 0 || by >= RH) continue; if (C.M[by*RW + x] == SWIM && !C.temp.has(by*RW + x)) { C.temp.set(by*RW + x, {v:ICE, t:22}); S.splat(b.x, b.y, 6, '#c4e8fa'); } }
    C.temp.forEach((o, k) => { o.t -= dt; if (o.t <= 0) C.temp.delete(k); });
    SV.at = {id:cur, x:Math.round(p.x), y:Math.round(p.y), rx:RX}; };
  // ---------- drawing the land ----------
  const drawTiles = () => { const cam = S.cam, x0 = Math.max(RX - 1, Math.floor(cam.x/TS)), y0 = Math.floor(cam.y/TS), x1 = Math.min(RX + RW, x0 + Math.ceil(S.VW/TS) + 1), y1 = Math.min(RH, y0 + Math.ceil(S.VH/TS) + 1), R = C.R, t = S.t, lo = S.low();
    g.fillStyle = R.sky || R.voidL ? (R.voidL ? '#0a1028' : '#1a2a5a') : R.base; g.fillRect(cam.x - 10, cam.y - 10, S.VW + 20, S.VH + 20);
    if ((R.sky || R.voidL) && !lo) { for (let i = 0; i < 40; i++) { const sx = cam.x + ((i*197 + cam.x*.6) % S.VW + S.VW) % S.VW, sy = cam.y + ((i*131 + cam.y*.6) % S.VH + S.VH) % S.VH; g.fillStyle = 'rgba(255,255,255,' + (.3 + .3*Math.sin(t + i)) + ')'; g.fillRect(sx, sy, 2, 2); } }
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const v = tl(tx, ty), sx = tx*TS, sy = ty*TS, h = H(tx, ty, 5);
      if (v == CHASM) { if (!(R.sky || R.voidL)) { g.fillStyle = '#0e1a34'; g.fillRect(sx, sy, TS + 1, TS + 1); } continue; }
      g.fillStyle = v == SNOW ? R.base : v == SAND ? R.base : v == CAVE ? R.base : v == FLOOR ? (R.castle ? '#5d4c7d' : R.temple ? '#d6cce6' : '#a8b8d0') : v == VOIDF ? '#8fb0d8' : v == CLOUD ? '#f4f8ff' : v == SLOPE ? '#e2edf8' : v == ICE ? '#c4e8fa' : v == DEEP ? '#ffffff' : v == SWIM ? (R.cave ? '#2a4a7a' : '#3a6ab0') : v == PATH ? '#e6dcc8' : R.base;
      g.fillRect(sx, sy, TS + 1, TS + 1);
      if (R.sky || R.voidL) { const below = tl(tx, ty + 1); if (below == CHASM) { g.fillStyle = R.voidL ? '#5a7ab0' : '#c8c0e8'; g.fillRect(sx, sy + TS - 6, TS + 1, 10); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(sx, sy + TS + 4, TS + 1, 4); } }
      if (lo) continue;
      if (v == SLOPE && h < .5) { g.strokeStyle = 'rgba(140,170,210,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx + 10, sy + 14); g.lineTo(sx + 24, sy + 30); g.lineTo(sx + 38, sy + 14); g.stroke(); }
      else if (v == SWIM) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); const wo = Math.sin(t*1.5 + tx + ty)*4; g.moveTo(sx + 6, sy + 24 + wo); g.quadraticCurveTo(sx + 16, sy + 18 + wo, sx + 26, sy + 24 + wo); g.stroke(); }
      else if (v == SAND && h < .3) { g.fillStyle = 'rgba(200,170,120,.3)'; g.beginPath(); g.ellipse(sx + 24, sy + 30, 14, 3, 0, 0, TAU); g.fill(); }
      else if (v == ICE) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx + 8 + h*10, sy + 12); g.lineTo(sx + 26 + h*10, sy + 30); g.stroke(); }
      else if (v == DEEP) { g.fillStyle = 'rgba(170,200,230,.35)'; g.beginPath(); g.arc(sx + 14, sy + 30, 10, Math.PI, 0); g.arc(sx + 34, sy + 24, 9, Math.PI, 0); g.fill(); } }
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const v = tl(tx, ty), sx = tx*TS, sy = ty*TS, h = H(tx, ty, 7);
      if (v == CLIFF) { const top = tl(tx, ty - 1) != CLIFF; g.fillStyle = R.rock; g.fillRect(sx, sy, TS + 1, TS + 1); g.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 3; k++) g.fillRect(sx + 6 + k*14 + h*4, sy + 8 + (k % 2)*14, 8, 3); if (top) { g.fillStyle = '#ffffff'; g.fillRect(sx, sy, TS + 1, 7); } if (tl(tx, ty + 1) != CLIFF) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(sx, sy + TS - 4, TS + 1, 4); } }
      else if (v == TREE) { const ox = (h - .5)*10, sz = .8 + h*.45; g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(sx + 24 + ox, sy + 42, 16, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#6b4a2b'; g.fillRect(sx + 21 + ox, sy + 32, 6, 12); for (const [w0, yy] of [[22, 34], [18, 22], [13, 10]]) { const w2 = w0*sz; g.fillStyle = R.tree; g.beginPath(); g.moveTo(sx + 24 + ox - w2, sy + yy); g.lineTo(sx + 24 + ox, sy + yy - 20); g.lineTo(sx + 24 + ox + w2, sy + yy); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(sx + 24 + ox - w2*.45, sy + yy - 11); g.lineTo(sx + 24 + ox, sy + yy - 20); g.lineTo(sx + 24 + ox + w2*.45, sy + yy - 11); g.fill(); } }
      else if (v == ROCK) { const cx = sx + 24, cy = sy + 28, sz = .75 + h*.5; g.fillStyle = R.rock; g.beginPath(); g.ellipse(cx, cy, 22*sz, 18*sz, h*.6, 0, TAU); g.fill(); if (!R.cave) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx - 2, cy - 13*sz, 15*sz, 6*sz, 0, Math.PI, 0); g.fill(); } }
      else if (v == CRYST) { const c1 = R.voidL ? '#9fd8ff' : '#c9a0ff'; g.fillStyle = c1; g.beginPath(); g.moveTo(sx + 12, sy + 44); g.lineTo(sx + 18, sy + 6 + h*8); g.lineTo(sx + 26, sy + 44); g.fill(); g.beginPath(); g.moveTo(sx + 22, sy + 44); g.lineTo(sx + 32, sy + 14); g.lineTo(sx + 38, sy + 44); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(sx + 17, sy + 16, 2, 20); }
      else if (v == WALL) { g.fillStyle = R.castle ? '#3e2c62' : R.temple ? '#6a5a8a' : '#4a6a8a'; g.fillRect(sx, sy, TS, TS); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (let yy = 0; yy < TS; yy += 12) { g.beginPath(); g.moveTo(sx, sy + yy); g.lineTo(sx + TS, sy + yy); g.stroke(); } if (tl(tx, ty - 1) != WALL) { g.fillStyle = '#fff'; g.fillRect(sx, sy, TS, 4); } }
      else if (v == PILLAR) { g.fillStyle = '#4a3a6a'; S.rr(g, sx + 10, sy - 20, 28, 64, 6); g.fill(); g.fillStyle = 'rgba(200,160,255,' + (.5 + .3*Math.sin(S.t*2 + tx)) + ')'; g.beginPath(); g.arc(sx + 24, sy - 8, 6, 0, TAU); g.fill(); }
      else if (v == DEAD) { g.strokeStyle = '#3a2a2a'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx + 24, sy + 44); g.lineTo(sx + 24, sy + 10); g.moveTo(sx + 24, sy + 24); g.lineTo(sx + 12, sy + 14); g.stroke(); }
      else if (v == SHRINE) { const done = C.shrines.some((q, j) => q.x == tx - RX && q.y == ty && SV.shr[cur + ':' + j]); g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(sx + 24, sy + 42, 26, 7, 0, 0, TAU); g.fill(); g.fillStyle = '#bfe9ff'; g.beginPath(); g.moveTo(sx - 2, sy + 40); g.lineTo(sx + 24, sy - 22); g.lineTo(sx + 50, sy + 40); g.fill(); g.fillStyle = '#64CDF5'; g.beginPath(); g.moveTo(sx + 6, sy + 40); g.lineTo(sx + 24, sy - 4); g.lineTo(sx + 42, sy + 40); g.fill();
        g.fillStyle = done ? '#D5F367' : 'rgba(255,255,255,' + (.6 + .3*Math.sin(S.t*3 + tx)) + ')'; g.beginPath(); g.arc(sx + 24, sy + 18, 6, 0, TAU); g.fill(); }
      else if (v == TOWER) { g.fillStyle = '#8a6a3a'; g.fillRect(sx + 8, sy - 70, 32, 114); g.fillStyle = '#c8a050'; for (let k = 0; k < 5; k++) g.fillRect(sx + 8, sy - 66 + k*22, 32, 4); g.fillStyle = '#5a3a1a'; g.beginPath(); g.moveTo(sx, sy - 70); g.lineTo(sx + 24, sy - 100); g.lineTo(sx + 48, sy - 70); g.fill(); g.fillStyle = SV.tow[cur] ? '#D5F367' : '#F9BF01'; g.beginPath(); g.arc(sx + 24, sy - 84, 5, 0, TAU); g.fill(); } } };
  const drawWorld = () => { if (!cur) { // the Expedition Board and the Aurora Statue at camp
      if (((W.sp|0) >= 6 || Object.keys(SV.seen).length) && S.onScreen(BOARD.x, BOARD.y)) { g.fillStyle = '#6b4a2b'; g.fillRect(BOARD.x - 3, BOARD.y - 10, 6, 34); g.fillStyle = '#c8a070'; S.rr(g, BOARD.x - 30, BOARD.y - 44, 60, 38, 6); g.fill(); g.fillStyle = '#14204a'; g.font = '900 10px ' + A2.font; g.textAlign = 'center'; g.fillText('🧭 LANDS', BOARD.x, BOARD.y - 28); g.fillText('BEYOND', BOARD.x, BOARD.y - 16); }
      if ((SV.emb || Object.keys(SV.seen).length) && S.onScreen(STATUE.x, STATUE.y)) drawStatue(STATUE.x, STATUE.y); if (story() && story().drawCamp) story().drawCamp(); return; }
    const t = S.t, lo = S.low();
    C.fires.forEach(q => { const w = W2T(q); g.fillStyle = '#6b4a2b'; g.fillRect(w.x + 12, w.y + 6, 36, 7); for (let k = 0; k < 3; k++) { const fl = Math.sin(t*12 + k)*3; g.fillStyle = ['#FF4539', '#ff8a3c', '#F9BF01'][k]; g.beginPath(); g.moveTo(w.x + 18 + k*4, w.y + 7); g.lineTo(w.x + 26 + k*4, w.y - 18 + k*5 + fl); g.lineTo(w.x + 34 + k*2, w.y + 7); g.fill(); } if (!lo) { g.strokeStyle = 'rgba(255,138,60,.3)'; g.lineWidth = 2; g.beginPath(); g.arc(w.x + 30, w.y, 160, 0, TAU); g.stroke(); } });
    C.ways.forEach((q, i) => { const w = W2T(q); if (!S.onScreen(w.x, w.y)) return; const on = SV.way[cur + ':' + i]; g.fillStyle = '#8a8e94'; g.beginPath(); g.moveTo(w.x - 12, w.y + 16); g.lineTo(w.x - 9, w.y - 26); g.lineTo(w.x, w.y - 34); g.lineTo(w.x + 9, w.y - 26); g.lineTo(w.x + 12, w.y + 16); g.fill(); g.fillStyle = on ? 'rgba(100,205,245,' + (.7 + .3*Math.sin(t*3)) + ')' : '#5a6a80'; g.beginPath(); g.arc(w.x, w.y - 12, 6, 0, TAU); g.fill(); });
    { const sp = W2T(C.spawn); drawStatue(sp.x + 50, sp.y - 40); g.fillStyle = '#6b4a2b'; g.fillRect(sp.x - 43, sp.y + 10, 6, 30); g.fillStyle = '#c8a070'; S.rr(g, sp.x - 70, sp.y - 6, 60, 22, 5); g.fill(); g.fillStyle = '#14204a'; g.font = '800 10px ' + A2.font; g.textAlign = 'center'; g.fillText('🏕 CAMP', sp.x - 40, sp.y + 9); }
    C.ing.forEach(it => { const k = cur + ':' + it.id; if ((SV.ing[k] || 0) > now()) return; const w = W2T(it); if (!S.onScreen(w.x, w.y)) return; g.font = '20px ' + A2.font; g.textAlign = 'center'; g.fillText(it.k == 'fish' ? '🎣' : INGN[it.k][0], w.x, w.y + 8); });
    C.feathers.forEach(f2 => { if (SV.fe[cur + ':' + f2.id]) return; const w = W2T(f2); if (!S.onScreen(w.x, w.y)) return; const bob = Math.sin(t*3 + f2.id)*3; if (!lo) { g.fillStyle = 'rgba(100,205,245,.25)'; g.beginPath(); g.arc(w.x, w.y - 4 + bob, 14, 0, TAU); g.fill(); } g.save(); g.translate(w.x, w.y + bob); g.rotate(-.5); g.fillStyle = '#64CDF5'; g.beginPath(); g.ellipse(0, -4, 5, 12, 0, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 10); g.lineTo(0, -14); g.stroke(); g.restore(); });
    for (const b of bolts) { if (b.t > 0) { g.strokeStyle = 'rgba(255,240,120,' + (.4 + .5*Math.sin(t*20)) + ')'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.arc(b.x, b.y, 56, 0, TAU); g.stroke(); g.setLineDash([]); } else { g.strokeStyle = '#fff6a0'; g.lineWidth = 5; g.beginPath(); g.moveTo(b.x - 20, b.y - 400); g.lineTo(b.x + 10, b.y - 200); g.lineTo(b.x - 10, b.y - 100); g.lineTo(b.x, b.y); g.stroke(); } }
    if (story() && story().drawWorld) story().drawWorld(cur, C, W2T); };
  const drawStatue = (x, y) => { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 22, 22, 6, 0, 0, TAU); g.fill(); g.fillStyle = '#d8e4f4'; S.rr(g, x - 16, y + 4, 32, 18, 4); g.fill(); g.fillStyle = '#eef4ff'; g.beginPath(); g.ellipse(x, y - 14, 12, 20, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x, y - 38, 9, 0, TAU); g.fill(); g.fillStyle = 'rgba(160,240,220,' + (.5 + .3*Math.sin(S.t*2)) + ')'; g.beginPath(); g.arc(x, y - 38, 14, 0, TAU); g.fill(); };
  const ents = L => { if (story() && story().ents) story().ents(L, cur, C, W2T); };
  const drawScreen = () => { if (!cur) { if (story() && story().drawScreen) story().drawScreen(null); return; } const wx = C.R.wx, VW = S.VW, VH = S.VH, cam = S.cam, lo = S.low();
    if (wx.fog) { const gr = g.createRadialGradient(p.x - cam.x, p.y - cam.y, 120, p.x - cam.x, p.y - cam.y, 520); gr.addColorStop(0, 'rgba(235,240,245,0)'); gr.addColorStop(1, 'rgba(235,240,245,.92)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); }
    if (wx.dark && !lo) { const gr = g.createRadialGradient(p.x - cam.x, p.y - cam.y, 100, p.x - cam.x, p.y - cam.y, 460); gr.addColorStop(0, 'rgba(8,10,30,0)'); gr.addColorStop(1, 'rgba(8,10,30,' + (wx.dark > 1 ? .78 : .55) + ')'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); }
    if (wx.wind && wind.f > 0 && !lo) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; for (let i = 0; i < 24; i++) { const sx = (i*173 + S.t*400*Math.cos(wind.a)) % VW, sy = (i*97 + S.t*400*Math.sin(wind.a)) % VH, x = (sx + VW) % VW, y = (sy + VH) % VH; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(wind.a)*34, y - Math.sin(wind.a)*34); g.stroke(); } }
    // stamina wheel next to you
    if (stamShow > 0 || stam < stamMax()) { const sx = p.x - cam.x + 30, sy = p.y - cam.y - 34, sm = stamMax()*(buffOn('stam') ? 1.5 : 1), k = stam/sm; g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(sx, sy, 12, 0, TAU); g.stroke(); g.strokeStyle = k < .25 ? (Math.sin(S.t*12) > 0 ? '#FF4539' : '#ff9a8a') : '#00B451'; g.beginPath(); g.arc(sx, sy, 12, -Math.PI/2, -Math.PI/2 + TAU*k); g.stroke(); }
    if (mode == 'glide') { g.fillStyle = '#fff'; g.font = '800 11px ' + A2.font; g.textAlign = 'center'; g.fillText('🪂 gliding', p.x - cam.x, p.y - cam.y + 40); } else if (mode == 'climb') { g.fillStyle = '#fff'; g.font = '800 11px ' + A2.font; g.textAlign = 'center'; g.fillText('🧗 climbing', p.x - cam.x, p.y - cam.y + 40); } else if (mode == 'swim') { g.fillStyle = '#fff'; g.font = '800 11px ' + A2.font; g.textAlign = 'center'; g.fillText('🏊 swimming', p.x - cam.x, p.y - cam.y + 40); } else if (mode == 'fly') { g.fillStyle = '#D5F367'; g.font = '800 11px ' + A2.font; g.textAlign = 'center'; g.fillText('✨ flying', p.x - cam.x, p.y - cam.y + 40); }
    // buffs
    const bl = [['warm', '🍲'], ['stam', '🥣'], ['power', '🍚']].filter(([k]) => buffOn(k)).map(([k, e]) => e + ' ' + Math.ceil((SV.buf[k] - now())/60e3) + 'm'); if (bl.length) { g.font = '800 11px ' + A2.font; g.textAlign = 'left'; const tx = bl.join('  '), tw = g.measureText(tx).width + 16; g.fillStyle = 'rgba(20,32,74,.55)'; S.rr(g, 8, (document.fullscreenElement ? 46 : 8) + 62, tw, 20, 10); g.fill(); g.fillStyle = '#fff'; g.fillText(tx, 16, (document.fullscreenElement ? 46 : 8) + 76); }
    if (story() && story().drawScreen) story().drawScreen(cur, C, W2T); };
  const drawTop = () => { if (modal && modal.kind == 'shrine') drawShrine(); if (story() && story().drawTop) story().drawTop(); };
  // ---------- mini map and big map ----------
  const drawMini = (TY, G0) => { const VW = S.VW, MX = VW - 116, MS = 100/RW; g.fillStyle = 'rgba(20,32,74,.6)'; S.rr(g, MX, TY, 108, 100*RH/RW + 20, 10); g.fill(); g.imageSmoothingEnabled = false; g.drawImage(mini, MX + 4, TY + 4, 100, 100*RH/RW); g.imageSmoothingEnabled = true;
    g.fillStyle = '#FF4539'; g.beginPath(); g.arc(MX + 4 + (p.x/TS - RX)*MS, TY + 4 + p.y/TS*MS, 3, 0, TAU); g.fill(); if (G0 && G0.x >= RX*TS) { g.fillStyle = '#F9BF01'; g.beginPath(); g.arc(MX + 4 + (G0.x/TS - RX)*MS, TY + 4 + G0.y/TS*MS, 2.5, 0, TAU); g.fill(); }
    const hh = 100*RH/RW; g.fillStyle = '#D5F367'; S.rr(g, MX + 22, TY + hh + 6, 64, 12, 6); g.fill(); g.fillStyle = '#14204a'; g.font = '800 9px ' + A2.font; g.textAlign = 'center'; g.fillText('M = MAP', MX + 54, TY + hh + 15); return {x:MX, y:TY, w:108, h:hh + 20}; };
  let MR = {x:0, y:0, s:1};
  const drawMap = (TY, G0) => { const VW = S.VW, MS = Math.min((VW - 40)/RW, (640 - TY - 62)/RH), MX = VW/2 - RW*MS/2; MR = {x:MX, y:TY + 62, s:MS}; g.fillStyle = 'rgba(10,16,36,.97)'; g.fillRect(0, 0, VW, 720);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 22px ' + A2.font; g.fillText(S.travel ? '✨ Fast travel: tap a waystone' : C.R.e + ' ' + C.R.n, VW/2, TY + 32); g.font = '600 11px ' + A2.font; g.fillStyle = '#9fe8ff';
    g.fillText(S.travel ? 'Waystones you have touched glow blue' : 'Shrines ' + C.shrines.filter((q, j) => SV.shr[cur + ':' + j]).length + '/6 · Frost Feathers ' + C.feathers.filter(f2 => SV.fe[cur + ':' + f2.id]).length + '/' + C.feathers.length + (SV.tow[cur] ? ' · map revealed' : ' · climb the 🗼 tower to reveal the map'), VW/2, TY + 50);
    g.imageSmoothingEnabled = false; g.drawImage(mini, MR.x, MR.y, RW*MS, RH*MS); g.imageSmoothingEnabled = true; const ms = q => ({x:MR.x + (q.x + .5)*MS, y:MR.y + (q.y + .5)*MS});
    g.font = '16px ' + A2.font; const icon = (q, e) => { if (!seenAt(q) && !SV.tow[cur]) return; const m2 = ms(q); g.fillText(e, m2.x, m2.y + 6); };
    icon(C.tower, '🗼'); C.shrines.forEach((q, j) => icon(q, SV.shr[cur + ':' + j] ? '✅' : '🧊')); C.fires.forEach(q => icon(q, '🔥')); if (story() && story().mapIcons) story().mapIcons(icon, cur, C);
    C.ways.forEach((q, i) => { if (!SV.way[cur + ':' + i]) return; const m2 = ms(q); g.fillStyle = S.travel ? '#64CDF5' : 'rgba(100,205,245,.8)'; g.beginPath(); g.arc(m2.x, m2.y, S.travel ? 11 : 6, 0, TAU); g.fill(); });
    const pq = {x:MR.x + (p.x/TS - RX)*MS, y:MR.y + p.y/TS*MS}; g.fillStyle = '#FF4539'; g.beginPath(); g.arc(pq.x, pq.y, 6, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    if (G0 && G0.x >= RX*TS) { g.font = '18px ' + A2.font; g.fillStyle = '#F9BF01'; g.fillText('⭐', MR.x + (G0.x/TS - RX)*MS, MR.y + G0.y/TS*MS + 6); }
    g.fillStyle = '#ffffff'; S.rr(g, VW/2 - 390, 650, 240, 48, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; S.rr(g, VW/2 - 120, 650, 240, 48, 14); g.fill(); S.rr(g, VW/2 + 150, 650, 240, 48, 14); g.fill();
    g.fillStyle = '#14204a'; g.font = '800 15px ' + A2.font; g.fillText('✕ Close map · M', VW/2 - 270, 680); g.fillStyle = '#fff'; g.fillText('🏕 Return to camp', VW/2, 680); g.fillText(S.travel ? '🗺 Just look' : '✨ Fast travel', VW/2 + 270, 680); };
  const mapDown = q => { const VW = S.VW; if (q.y > 650 && q.y < 700) { if (q.x < VW/2 - 140) { S.mapOpen = false; S.travel = false; } else if (q.x < VW/2 + 140) { S.mapOpen = false; S.travel = false; leave(); } else S.travel = !S.travel; return true; }
    if (S.travel) for (let i = 0; i < 3; i++) { if (!SV.way[cur + ':' + i]) continue; const w = C.ways[i], sx = MR.x + (w.x + .5)*MR.s, sy = MR.y + (w.y + .5)*MR.s; if (Math.hypot(q.x - sx, q.y - sy) < 26) { S.mapOpen = false; S.travel = false; enter(cur, i, true); A2.sfx('win'); S.say('✨ Whoosh!', 1.6); return true; } }
    return true; };
  // waystones light up when you walk past them
  const wayCheck = () => { if (!cur) return; C.ways.forEach((q, i) => { const k = cur + ':' + i; if (SV.way[k]) return; const w = W2T(q); if (Math.hypot(w.x - p.x, w.y - p.y) < 90) { SV.way[k] = 1; A2.sfx('win'); S.say('✨ Waystone found! Travel here from the map (M → Fast travel)', 3); S.save(); } }); };
  // ---------- input ----------
  const key = e => { const k = e.key; if (modal && modal.kind == 'shrine') { if (k == 'Escape') { modal = null; e.stopPropagation && e.stopPropagation(); return true; } if (k == 'r' || k == 'R') shrineReset(); else if (k == 'z' || k == 'Z' || k == 'Backspace') shrineUndo(); else if (modal.done && (k == 'Enter' || k == ' ' || k == 'e' || k == 'E')) modal = null;
      else { const d = {ArrowUp:[0, -1], w:[0, -1], W:[0, -1], ArrowDown:[0, 1], s:[0, 1], S:[0, 1], ArrowLeft:[-1, 0], a:[-1, 0], A:[-1, 0], ArrowRight:[1, 0], d:[1, 0], D:[1, 0]}[k]; if (d) shrineMove(d[0], d[1]); } return true; }
    if (story() && story().key && story().key(e)) return true; return false; };
  const down = q => { if (modal && modal.kind == 'shrine') { for (const r of shR) if (q.x >= r.x && q.x <= r.x + r.w && q.y >= r.y && q.y <= r.y + r.h) { r.fn(); return true; } return true; } if (story() && story().down && story().down(q)) return true; return false; };
  // Escape closes a shrine before the game sees it
  const escK = e => { if (e.key != 'Escape') return; if (modal) { e.stopPropagation(); e.preventDefault(); modal = null; } else if (story() && story().modal && story().modal()) { e.stopPropagation(); e.preventDefault(); story().key(e); } }; document.addEventListener('keydown', escK, true);
  // ---------- resume where you were ----------
  const SG = {expedition, cur:() => cur, C:() => C, tile:(tx, ty) => tx >= RX && tx < RX + RW ? tl(tx, ty) : ROCK, inside, bounds:() => ({x0:RX*TS, x1:(RX + RW)*TS, y1:RH*TS}), modal:() => !!modal || !!(story() && story().modal && story().modal()), move, update:dt => { update(dt); wayCheck(); },
    things, goal:() => story() && story().goal ? story().goal(cur, C, W2T) : null, drawTiles, drawWorld, ents, drawScreen, drawTop, drawMini, drawMap, mapDown, key, down, warmHeal:() => !!cur && C.fires.some(q => { const w = W2T(q); return Math.hypot(w.x + 30 - p.x, w.y - p.y) < 110; }),
    blockMap:() => !!modal, save:() => { SV.stam = Math.max(SV.stam, 100); }, respawn:() => { if (story() && story().respawn && story().respawn()) return true; if (!cur) return false; const i = [2, 1, 0].find(j => SV.way[cur + ':' + j]) || 0, q = W2T(C.ways[i]); p.x = q.x; p.y = q.y + 40; p.vx = p.vy = 0; p.hp = p.max; p.inv = 2.5; p.ammo = X.maxAmmo(); S.foes = []; S.balls = []; S.boss = null; S.mateHome(); S.say('❄ You wake up at the waystone', 2.4); return true; },
    bossReady:k => !!(story() && story().bossReady && story().bossReady(k, cur)), bossAI:(B, dt, ph, ang, d) => story() && story().bossAI(B, dt, ph, ang, d), bossDown:B => story() && story().bossDown(B), hurtBoss:(B, dmg) => !!(story() && story().hurtBoss && story().hurtBoss(B, dmg)),
    drawBoss:B => story() && story().drawBoss(B), drawFoe:f => story() && story().drawFoe(f), drawBar:(B, TY) => story() && story().drawBar(B, TY), portrait:(who, x, y, mood) => !!(story() && story().portrait && story().portrait(who, x, y, mood)),
    // used by the story and by admin tools
    enter, leave, reveal, unlocked, REGIONS, RIDX, W2T, SV, genRegion, makePuzzle, openShrine, expedition, statue, stam:() => stam, setStam:v => { stam = v; }, buffOn, tl, RW, RH, T:{CLIFF, CHASM, SLOPE, SAND, SWIM, TOWER, SHRINE, CRYST, CLOUD, VOIDF, PILLAR}, closeModal:() => { modal = null; }, mode:() => mode,
    shrineSolve:() => { if (!modal) return; const P = modal.P; if (P.kind == 'push') { modal.blocks = P.sw.slice(); } else { modal.got = (1 << P.cryst.length) - 1; modal.pos = P.goal; } win(); },
    dispose:() => document.removeEventListener('keydown', escK, true)};
  SAGA.story = null; if (SAGA.storyInit) { try { SAGA.story = SAGA.storyInit(S, SG); } catch (e) { console.error('[saga story]', e); } }
  if (SV.at && SV.at.id && REGIONS[RIDX[SV.at.id]]) { const at = SV.at; try { enter(at.id, 0, true); const sh = (RX - (at.rx || 180))*TS;   /* the lands beyond moved east when the main map grew (180 → 320 tiles) */ if (inside(at.x + sh, at.y)) { p.x = at.x + sh; p.y = at.y; } } catch (e) { console.error('[saga resume]', e); cur = null; C = null; SV.at = null; } }
  return SG; };
const SAGA = A.SAGA = A.SAGA || {}; SAGA.REGIONS = REGIONS; SAGA.genRegion = genRegion;
})();
