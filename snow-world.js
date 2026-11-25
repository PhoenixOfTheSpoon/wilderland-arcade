// Wilderland Arcade · SNOW KINGDOM — Snowball Showdown's open-world quest.
// One huge snowy map (100 × 100 tiles) that never resets: where you are, the map you've uncovered, chests, waystones,
// runes and rescued friends are saved in your Snowball progress. Get snowed under and you wake up at Camp Cocoa with
// everything you found. Quest: free Royal Guard Mau Mau, win 3 Moon Runes, storm the Shadow Castle, defeat the Evil
// Sorcerer Loki (a dog) and rescue Lord Emperor Bau Bau (a cat).
(function(){
const A = window.Arcade, TAU = Math.PI*2;
const rr = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const N = 100, TS = 48, WORLD = N*TS; let VW = 600, VH = 620, BAR = 620;   // VW grows to fill a wide screen; VH/BAR: the touch buttons only show on touch screens
const SNOW = 0, PATH = 1, TREE = 2, ROCK = 3, ICE = 4, DEEP = 5, HOLE = 6, WALL = 7, FLOOR = 8, GATE = 9, CAVE = 10, CAMP = 11, DEAD = 12;
const SOLID = [0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1];
const MINI = ['#eef5fc', '#e3d6bd', '#2f6a3a', '#8a8e94', '#aee6ff', '#ffffff', '#2a5a8a', '#3a2a5a', '#6a5a8a', '#c04ae0', '#5a6a80', '#ffd08a', '#5a4a4a'];
// landmarks (tile coordinates)
const LM = {camp:{x:50, y:86}, forest:{x:16, y:62}, lake:{x:80, y:67}, caves:{x:16, y:18}, pass:{x:48, y:22}, castle:{x:83, y:13}, gate:{x:83, y:30}};
const WAYS = {camp:{x:55, y:84, n:'Camp Cocoa'}, forest:{x:22, y:66, n:'Frostpine Forest'}, lake:{x:64, y:64, n:'Glimmer Lake'}, caves:{x:22, y:24, n:'Crystal Caves'}, pass:{x:44, y:31, n:'Howling Pass'}, castle:{x:83, y:35, n:'Shadow Castle Gate'}};
const regionAt = (x, y) => { if (Math.hypot(x - 50, y - 86) < 8) return 'camp'; if (x >= 70 && y <= 34) return 'castle'; if (x < 34 && y < 40) return 'caves'; if (x < 36) return 'forest'; if (x > 62 && y > 44) return 'lake'; if (y < 44) return 'pass'; return 'meadow'; };
const REG = {camp:{n:'Camp Cocoa', tier:0, pool:[]}, meadow:{n:'Snowy Meadows', tier:1, pool:['pup', 'pup', 'goon']}, forest:{n:'Frostpine Forest', tier:2, pool:['pup', 'goon', 'bat']},
  lake:{n:'Glimmer Lake', tier:2, pool:['goon', 'bat', 'golem']}, caves:{n:'Crystal Caves', tier:3, pool:['bat', 'golem', 'goon', 'imp']}, pass:{n:'Howling Pass', tier:3, pool:['golem', 'hound', 'goon']},
  castle:{n:'Loki’s Shadow Lands', tier:4, pool:['hound', 'imp', 'golem', 'imp']}};
const FOE = {
  pup:{n:'Hex Pup', hp:2, sp:125, melee:1, r:13, pts:30},
  goon:{n:'Snow Goon', hp:3, sp:60, shoot:2.2, r:15, pts:40},
  bat:{n:'Frost Bat', hp:1, sp:150, melee:1, fly:1, r:12, pts:35},
  golem:{n:'Ice Golem', hp:8, sp:42, shoot:3.2, big:1, r:22, pts:90},
  hound:{n:'Shadow Hound', hp:5, sp:150, melee:2, r:16, pts:70},
  imp:{n:'Hex Imp', hp:4, sp:80, shoot:2.4, hex:1, r:14, pts:70},
  clone:{n:'Loki Clone', hp:3, sp:0, shoot:2.2, hex:1, r:20, pts:50, clone:1},
  shade:{n:'Shadow Minion', hp:3, sp:140, melee:1, r:14, pts:40}};
const BOSS = {
  grumble:{n:'GRUMBLEBARK THE FROST ENT', hp:60, at:'forest', r:38, rune:'forest', intro:'Grumblebark: “Hrrrm! Loki told me to guard this rune. Go away, little snowball!”'},
  icefang:{n:'CAPTAIN ICEFANG', hp:75, at:'lake', r:32, rune:'lake', intro:'Captain Icefang: “Arr! This Moon Rune be MY treasure now!”'},
  crystal:{n:'THE CRYSTAL GOLEM', hp:90, at:'caves', r:36, rune:'caves', intro:'The Crystal Golem: “...INTRUDER... SHINY RUNE... MINE...”'},
  rufus:{n:'HEX GUARD RUFUS', hp:80, at:'pass', r:26, intro:'Hex Guard Rufus: “Grr! Nobody frees the cat! Boss Loki’s orders!”'},
  loki:{n:'LOKI THE EVIL SORCERER', hp:260, at:'castle', r:30, phases:4, intro:'Loki: “Well, hello there, little snowball! Aren’t you adorable. Those cats are MINE. Be a good sport and lose quietly.”'}};
const LOKI_PH = ['', 'Ice Magic', 'Shadow Minions', 'Frost Tornado', 'Enraged'];
const RUNE_N = {forest:'Frostpine', lake:'Glimmer', caves:'Crystal'};
// ---------- the map is made the same way every time (seeded), so the world is always the same place ----------
const hash = (x, y, s) => { let h = (x*374761393 + y*668265263 + s*982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const noise = (x, y, sc, s) => { const fx = x/sc, fy = y/sc, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy, sm = q => q*q*(3 - 2*q), a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s), top = a + (b - a)*sm(u), bot = c + (d - c)*sm(u); return top + (bot - top)*sm(v); };
let MAPC = null;
const genMap = () => { if (MAPC) return MAPC; const M = new Uint8Array(N*N), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < N && y < N) M[y*N + x] = v; }, get = (x, y) => M[y*N + x];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = regionAt(x, y), n1 = noise(x, y, 6, 1), n2 = noise(x, y, 3, 2), h = hash(x, y, 9); let v = SNOW;
    if (r == 'meadow') v = h < .045 ? TREE : h < .06 ? ROCK : n1 > .74 ? DEEP : SNOW;
    else if (r == 'forest') v = (n1 > .45 && h < .5) || h < .07 ? TREE : n2 > .8 ? DEEP : SNOW;
    else if (r == 'lake') { const e = ((x - 80)/15)**2 + ((y - 68)/11)**2; v = e < 1 ? (h < .035 && e > .15 ? HOLE : ICE) : h < .08 ? TREE : SNOW; }
    else if (r == 'caves') v = n1 > .57 || h < .05 ? ROCK : CAVE;
    else if (r == 'pass') v = n1 > .62 || (n2 > .78 && h < .5) ? ROCK : n2 > .55 ? DEEP : SNOW;
    else if (r == 'castle') v = h < .06 ? DEAD : h < .085 ? ROCK : SNOW;
    else v = CAMP;
    set(x, y, v); }
  // paths between the camp and every place you need to go (wiggly, two tiles wide)
  const carve = (ax, ay, bx, by, wd) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); for (let i = 0; i <= L*3; i++) { const q = i/(L*3), wob = Math.sin(q*8 + ax*.7)*2.4*Math.sin(q*Math.PI), px = ax + dx*q - dy/L*wob, py = ay + dy*q + dx/L*wob;
      for (let oy = -wd; oy <= wd; oy++) for (let ox = -wd; ox <= wd; ox++) { const tx = Math.round(px + ox), ty = Math.round(py + oy); if (tx < 2 || ty < 2 || tx > N - 3 || ty > N - 3 || Math.hypot(ox, oy) > wd + .3) continue; const v = get(tx, ty);
        if (v == HOLE) set(tx, ty, ICE); else if (v == ICE || v == CAMP || v == FLOOR || v == WALL || v == GATE) continue; else set(tx, ty, regionAt(tx, ty) == 'caves' ? CAVE : PATH); } } };
  const clear = (cx, cy, rad, v) => { for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (Math.hypot(x - cx, y - cy) <= rad && x > 1 && y > 1 && x < N - 2 && y < N - 2) set(x, y, v); };
  carve(50, 84, 50, 68, 1); carve(50, 68, 17, 62, 1); carve(50, 84, 66, 70, 1); carve(50, 68, 48, 25, 1); carve(48, 25, 17, 20, 1); carve(17, 58, 17, 24, 1); carve(52, 24, 83, 33, 1); carve(66, 70, 72, 50, 1); carve(72, 50, 83, 33, 1);
  clear(16, 62, 6, SNOW); clear(80, 67, 6, ICE); clear(16, 18, 6, CAVE); clear(48, 22, 6, SNOW); clear(83, 35, 3, SNOW);
  for (const k in WAYS) clear(WAYS[k].x, WAYS[k].y, 1, regionAt(WAYS[k].x, WAYS[k].y) == 'caves' ? CAVE : PATH);
  // Loki's Shadow Castle
  for (let y = 4; y <= 30; y++) for (let x = 71; x <= 95; x++) set(x, y, x == 71 || x == 95 || y == 4 || y == 30 ? WALL : FLOOR);
  for (let y = 9; y <= 25; y += 8) for (let x = 75; x <= 91; x += 4) if (Math.abs(x - 83) > 3) { set(x, y, WALL); set(x, y + 1, WALL); }
  for (let x = 82; x <= 84; x++) set(x, 30, GATE);
  clear(50, 86, 7, CAMP);
  for (let i = 0; i < N; i++) for (const [x, y] of [[i, 0], [i, 1], [0, i], [1, i], [i, N - 1], [i, N - 2], [N - 1, i], [N - 2, i]]) set(x, y, regionAt(x, y) == 'forest' || regionAt(x, y) == 'meadow' ? TREE : ROCK);
  // 40 treasure chests in places worth exploring (seeded)
  const chests = []; let s = 1; const rnd = () => (s = (s*16807) % 2147483647) / 2147483647;
  for (let tries = 0; chests.length < 40 && tries < 5000; tries++) { const x = 3 + Math.floor(rnd()*(N - 6)), y = 3 + Math.floor(rnd()*(N - 6)), v = get(x, y), r = regionAt(x, y);
    if (SOLID[v] || v == HOLE || r == 'camp' || (r == 'castle' && v == FLOOR && y > 20 && Math.abs(x - 83) < 4)) continue;
    if (Object.values(LM).some(L => Math.hypot(L.x - x, L.y - y) < 7) || chests.some(C => Math.hypot(C.tx - x, C.ty - y) < 6)) continue;
    chests.push({id:chests.length, tx:x, ty:y, x:(x + .5)*TS, y:(y + .5)*TS, tier:Math.max(1, REG[r].tier)}); }
  MAPC = {M, chests}; return MAPC; };

A.snowWorld = function(X) {
  const {host, api, c, K, PERM} = X, g = c.getContext('2d'), {M, chests} = genMap();
  const W = PERM.ow = Object.assign({v:1, x:0, y:0, met:0, runes:{}, mau:0, loki:0, bau:0, down:{}, chests:{}, ways:{camp:1}, fog:'', kills:0, deaths:0}, PERM.ow || {});
  ['runes', 'down', 'chests', 'ways'].forEach(k => { W[k] = W[k] || {}; }); W.ways.camp = 1;
  const save = () => { W.x = Math.round(p.x); W.y = Math.round(p.y); W.fog = fogStr(); X.savePerm(); };
  // ---------- screen layout: fill the whole screen (wider view of the map), touch buttons only on touch screens ----------
  const dpr = window.devicePixelRatio || 1; let layW = 0;
  let touchUI = (() => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches; } catch(e) { return false; } })();
  const layout = () => { const iw = window.innerWidth || 600, ih = window.innerHeight || 720, want = Math.max(600, Math.min(1700, Math.round(720 * (iw - 8) / Math.max(300, ih - 64))));
    if (Math.abs(want - layW) > 6) { layW = want; c.width = Math.round(want*dpr); c.style.width = want + 'px'; c._lw = want; g.setTransform(dpr, 0, 0, dpr, 0, 0); if (api.setWide) api.setWide(want); }
    VW = layW; BAR = touchUI ? 620 : 720; VH = BAR; };
  const unlayout = () => { c.width = Math.round(600*dpr); c.style.width = '600px'; c._lw = 0; g.setTransform(dpr, 0, 0, dpr, 0, 0); if (api.setWide) api.setWide(0); VW = 600; VH = BAR = 620; };
  const topY = () => document.fullscreenElement ? 46 : 8;   // room for the browser's "press Esc to exit full screen" message
  W.hudMin = W.hudMin || 0;
  const px = L => ({x:(L.x + .5)*TS, y:(L.y + .5)*TS});
  const CAMPX = px({x:50, y:88}), FIRE = px({x:50, y:86}), PIP = px({x:46, y:84}), TENT = px({x:54, y:89}), THRONE = px({x:50, y:82});
  const LAIR = {grumble:px(LM.forest), icefang:px(LM.lake), crystal:px(LM.caves), rufus:px(LM.pass), loki:px(LM.castle)};
  const MAUCAGE = {x:LAIR.rufus.x, y:LAIR.rufus.y - 84}, BAUCAGE = {x:LAIR.loki.x, y:LAIR.loki.y - 120};
  const tileAt = (tx, ty) => tx < 0 || ty < 0 || tx >= N || ty >= N ? ROCK : M[ty*N + tx];
  const runesN = () => ['forest', 'lake', 'caves'].filter(k => W.runes[k]).length;
  const gateOpen = () => runesN() >= 3 && !!W.mau;
  const solidAt = (x, y) => { const v = tileAt(Math.floor(x/TS), Math.floor(y/TS)); return v == GATE ? !gateOpen() : !!SOLID[v] || v == HOLE; };
  const blocked = (x, y, r) => solidAt(x - r, y - r) || solidAt(x + r, y - r) || solidAt(x - r, y + r) || solidAt(x + r, y + r);
  const regAt = (x, y) => regionAt(Math.floor(x/TS), Math.floor(y/TS));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const low = () => !!A.lowFx;
  // ---------- fog of war: the map fills in as you explore (2×2-tile blocks, saved) ----------
  const FB = 50, fog = new Uint8Array(FB*FB); { const s2 = W.fog || ''; for (let i = 0; i < s2.length && i*4 < fog.length; i++) { const v = parseInt(s2[i], 16) || 0; for (let b = 0; b < 4; b++) if (v & (1 << b)) fog[i*4 + b] = 1; } }
  const fogStr = () => { let s2 = ''; for (let i = 0; i < fog.length; i += 4) s2 += (fog[i] | fog[i + 1] << 1 | fog[i + 2] << 2 | fog[i + 3] << 3).toString(16); return s2.replace(/0+$/, ''); };
  const mini = document.createElement('canvas'); mini.width = N; mini.height = N; const mg = mini.getContext('2d');
  const paintBlock = i => { const bx = (i % FB)*2, by = Math.floor(i/FB)*2; for (let y = by; y < by + 2; y++) for (let x = bx; x < bx + 2; x++) { const v = tileAt(x, y); mg.fillStyle = regionAt(x, y) == 'castle' && v == SNOW ? '#cfd2e2' : MINI[v]; mg.fillRect(x, y, 1, 1); } };
  mg.fillStyle = '#1a2440'; mg.fillRect(0, 0, N, N); for (let i = 0; i < fog.length; i++) if (fog[i]) paintBlock(i);
  let explored = fog.reduce((a, b) => a + b, 0);
  const reveal = () => { const bx = Math.floor(p.x/TS/2), by = Math.floor(p.y/TS/2), R0 = 4; let ch = 0; for (let y = by - R0; y <= by + R0; y++) for (let x = bx - R0; x <= bx + R0; x++) { if (x < 0 || y < 0 || x >= FB || y >= FB || Math.hypot(x - bx, y - by) > R0 + .3) continue; const i = y*FB + x; if (!fog[i]) { fog[i] = 1; paintBlock(i); ch++; } }
    if (ch) { const before = Math.floor(explored*100/fog.length); explored += ch; const pct = Math.floor(explored*100/fog.length); if (pct > before) X.stat('snowExplore', pct, 'max'); } };
  // ---------- you ----------
  const mx0 = X.maxHp();
  const p = {x:W.x || CAMPX.x, y:W.y || CAMPX.y, hp:mx0, max:mx0, inv:2, ab:0, shieldT:0, eye:0, fortT:0, ammo:X.maxAmmo(), reload:0, vx:0, vy:0, face:-Math.PI/2, hitT:0, walk:0};
  if (blocked(p.x, p.y, 12)) { p.x = CAMPX.x; p.y = CAMPX.y; }
  const mau = {x:p.x - 40, y:p.y + 10, cool:1, walk:0, idle:0, st2:'', stT:0, blockCd:0, chargeCd:5, snackCd:0, dash:null, say:'', sayT:0, quipT:20};
  let story = null;   // "Spirits of the Snow" (after Loki) plugs in here
  W.treats = W.treats || 0; W.snacks = W.snacks || {}; let buffT = 0;
  const mauState = () => mau.stT > 0 && mau.st2 ? mau.st2 : mau.dash ? 'charge' : mau.sniff ? 'sniff' : mau.idle > 16 ? 'sleep' : mau.idle > 7 ? 'flop' : mau.moving ? 'march' : 'stand';
  const mauSay = (txt, d) => { mau.say = txt; mau.sayT = d || 3.2; };
  const bubble = (x, y, txt) => { g.font = '700 11px ' + A.font; const tw = Math.min(260, g.measureText(txt).width + 16); g.fillStyle = 'rgba(255,255,255,.95)'; rr(g, x - tw/2, y - 20, tw, 22, 10); g.fill(); g.beginPath(); g.moveTo(x - 5, y + 2); g.lineTo(x + 5, y + 2); g.lineTo(x, y + 8); g.fill(); g.fillStyle = '#14204a'; g.textAlign = 'center'; wrapClip(txt, x, y - 5, tw - 12); };
  // hidden snacks all over the kingdom: only Mau Mau can sniff them out
  const SNACKS = (() => { const out = []; let sd = 77; const rnd = () => (sd = (sd*16807) % 2147483647) / 2147483647; for (let k = 0; out.length < 36 && k < 4000; k++) { const x = 4 + Math.floor(rnd()*(N - 8)), y = 4 + Math.floor(rnd()*(N - 8)), v = tileAt(x, y); if (SOLID[v] || v == HOLE || regionAt(x, y) == 'camp' || out.some(o => Math.hypot(o.tx - x, o.ty - y) < 7)) continue; out.push({id:out.length, tx:x, ty:y, x:(x + .5)*TS, y:(y + .5)*TS, e:['🐟', '🍗', '🧀', '🥛'][out.length % 4]}); } return out; })();
  const feedMau = () => { if (!W.mau) { say('Free Royal Guard Mau Mau first. He’s caged at Howling Pass', 2.4); return; } if ((W.treats||0) <= 0) { say('🐟 No treats! Chests, enemies and Mau Mau’s nose (“!”) find more', 2.6); mauSay('Was that... a no-snack button?', 2.2); A.sfx('bad'); return; }
    W.treats--; mau.st2 = 'dance'; mau.stT = 2.8; buffT = 20; p.hp = Math.min(p.max, p.hp + 2); mates.forEach(m => { if (!m.ko) m.hp = m.max; }); splat(mau.x, mau.y - 10, 18, '#F9BF01'); A.sfx('win');
    mauSay(['Om nom nom! ROYAL POWER!', 'This fish was guarded... into my belly.', 'Royal Guard rule #1: never skip lunch!', 'Mmm! The team feels STRONGER!'][Math.floor(Math.random()*4)], 3); say('🐟 Mau Mau ate a treat! The team hits harder for 20 seconds, +♥', 2.6); X.stat('snowFeed', 1, 'add'); save(); };
  // teammates from your upgrades (Upgrade Workshop teammates + Snow Friends, levelled by Team Captain) come along too
  const MI = X.mates ? X.mates() : {n:0, lv:1, names:[]}, ROLES = ['thrower', 'builder', 'medic'], RCOL = {thrower:'#2fa8e0', builder:'#64CDF5', medic:'#ff9ad5'}, RE = {thrower:'🎯', builder:'🔨', medic:'➕'};
  const mates = []; for (let i = 0; i < MI.n; i++) mates.push({name:(MI.names[i] || 'Pal'), role:ROLES[i % 3], lv:MI.lv, x:p.x + (i - 1.5)*30, y:p.y + 40, cool:1 + i*.3, heal:12, hp:2 + MI.lv, max:2 + MI.lv, ko:0, face:0, walk:0, throwT:0});
  const mateHome = () => mates.forEach((m, i) => { m.x = p.x + (i - 1.5)*30; m.y = p.y + 40; });
  let sticks = [], tornado = null;
  let foes = [], balls = [], fx = [], nums = [], drops = [], boss = null, dlg = null, mapOpen = false, travel = false, quiz = false, msg = '', msgT = 0, t = 0, score = 0;
  let saveT = 10, revealT = 0, spawnT = 1, dead = 0, lastReg = '', gateT = 0, lokiReady = !!W.bau, charge = null, aim = {x:300, y:200}, mouseIn = false, healT = 0;
  const pads = new Map(); const pad = k => { for (const v of pads.values()) if (v == k) return 1; return 0; };
  const cam = {x:0, y:0};
  const say = (s2, d = 2.6) => { msg = s2; msgT = d; };
  const addNum = (x, y, txt, col) => { if (nums.length < 40) nums.push({x, y, txt, col:col || '#14204a', t:1}); };
  const splat = (x, y, n, col) => { const k = low() ? Math.ceil(n/3) : n; for (let i = 0; i < k; i++) fx.push({x, y, vx:(Math.random() - .5)*170, vy:(Math.random() - .5)*170, t:.35 + Math.random()*.3, col:col || '#ffffff', r:1.5 + Math.random()*2.5}); };
  const give = o => { if (o.flakes) PERM.bank += Math.round(o.flakes * (1 + .1*X.PU('flakes'))); if (o.frost) PERM.frost += o.frost; if (o.xp) X.addXp(o.xp); if (o.score) { score += o.score; api.score(score); } let it = null; if (o.gear != null) it = X.makeGear(o.gear); return it; };
  // ---------- talking ----------
  const talk = (lines, done) => { dlg = {lines, i:0, done}; A.sfx('blip'); };
  const nextLine = () => { if (!dlg) return; dlg.i++; A.sfx('blip'); if (dlg.i >= dlg.lines.length) { const d = dlg.done; dlg = null; d && d(); } };
  const PIPF = ['Old Pip', 'pip'];
  const talkPip = () => {
    if (!W.met) return talk([[...PIPF, 'Oh, thank goodness! A hero! I’m Old Pip, keeper of Camp Cocoa.'],
      [...PIPF, 'Loki the Evil Sorcerer has kidnapped Lord Emperor Bau Bau and Royal Guard Mau Mau! He’s a golden retriever in a dark sorcerer’s robe. He LOOKS friendly. Don’t let that fool you.'],
      [...PIPF, 'One more thing: Loki can’t resist a thrown stick. Not even in the middle of a battle.'],
      [...PIPF, 'Royal Guard Mau Mau is locked in a cage up at Howling Pass, straight north of here. Lord Emperor Bau Bau is trapped in Loki’s Shadow Castle, far to the north-east.'],
      [...PIPF, 'The castle gate is sealed by 3 Moon Runes. Loki gave them to his guardians in Frostpine Forest (west), Glimmer Lake (east) and the Crystal Caves (north-west).'],
      [...PIPF, 'Free Mau Mau, win the runes, and save our Emperor! The arrow on your screen points the way. Press M to see the map.'],
      [...PIPF, 'If you get snowed under you’ll wake up here, safe and sound, with everything you found. Sit by the campfire to heal, and touch the glowing waystones to travel fast. Good luck!']],
      () => { W.met = 1; save(); say('🎯 Quest started: Save the Snow Kingdom!', 3); A.sfx('win'); });
    if (W.bau && story) { const sp = story(); if (sp) return talk(sp); }
    if (W.bau) return talk([[...PIPF, 'The whole kingdom is cheering for you! Lord Emperor Bau Bau is back on his ice throne.'], [...PIPF, 'There are still treasure chests hidden all over the map. And I hear Loki the Evil Sorcerer keeps sneaking back into his castle for rematches...']]);
    if (W.loki) return talk([[...PIPF, 'You beat Loki the Evil Sorcerer! Hurry, open Lord Emperor Bau Bau’s cage in the castle throne room!']]);
    if (gateOpen()) return talk([[...PIPF, 'All 3 Moon Runes AND Mau Mau’s guard key! The Shadow Castle gate is open. Go stop Loki the Evil Sorcerer! Grab a stick or two on the way.']]);
    return talk([[...PIPF, 'You have ' + runesN() + ' of 3 Moon Runes. ' + (W.mau ? 'And Royal Guard Mau Mau is free. Wonderful!' : 'Royal Guard Mau Mau is still caged at Howling Pass, north of camp.')], [...PIPF, 'Follow the arrow on your screen. Stay warm out there!']]); };
  const MAUF = ['Royal Guard Mau Mau', 'mau'], BAUF = ['Lord Emperor Bau Bau', 'bau'];
  const MAU_LINES = ['I shall guard this fish... with my life.', 'Royal Guard rule #1: never skip lunch.', 'Royal Guard rule #2: see rule #1.', 'This armor fit perfectly last winter. Perfectly.', 'I smell... adventure. And possibly tuna.', 'A Royal Guard never sleeps on duty. I was resting my eyes. Proudly.', 'Snack Break is a very serious military move.', 'If you find a treat, I can find two more. That is my royal promise.'];
  const talkMau = () => { mau.st2 = 'salute'; mau.stT = 1.6; talk([[...MAUF, W.bau ? MAU_LINES[Math.floor(t*7) % MAU_LINES.length]
    : gateOpen() ? 'The gate is open! Let’s go get the Emperor back! ...After a small snack.' : 'We need all 3 Moon Runes. Then I can open the castle gate with my guard key. ' + runesN() + ' of 3 so far! (Do you have any fish?)', 'happy'],
    [...MAUF, (W.treats||0) ? 'You have ' + W.treats + ' treat' + (W.treats == 1 ? '' : 's') + '. Press ' + (touchUI ? '🐟' : 'G') + ' to feed me and I’ll make the whole team stronger!' : 'No treats? I can sniff them out. Walk with me and watch for the “!”', 'happy']]); };
  const talkBau = () => talk([[...BAUF, ['Purr... Thanks to you, the Snow Kingdom is safe. You are a true Snow General!', 'Royal Guard Mau Mau, give this hero a royal salute! *Mau Mau salutes*', 'Loki? Hmph. That silly dog keeps coming back to his castle. Feel free to teach him another lesson.'][Math.floor(t) % 3]]]);
  const freeBau = () => talk([[...BAUF, 'Meow! Free at last! I am Lord Emperor Bau Bau, ruler of the Snow Kingdom!'], [...MAUF, 'Your Majesty! Royal Guard Mau Mau reporting. This brave hero beat Loki!'],
      [...BAUF, 'Then I name you Snow General of the kingdom! Take this royal treasure. Now, let us go home to Camp Cocoa.']],
    () => { W.bau = 1; const it = give({frost:50, flakes:800, xp:150, score:5000, gear:4}); X.stat('snowRescue', 1, 'add'); save(); A.sfx('win'); say('👑 Kingdom saved! +50 Frost Crystals · ' + (it ? it.name : '') + ' · title: Snow General', 5); });
  // ---------- treasure chests ----------
  const openChest = ch => { if (W.chests[ch.id]) return; const T2 = ch.tier, go = mult => { W.chests[ch.id] = 1; const fl = Math.round((25 + Math.random()*35)*T2*mult), fr = Math.round((1 + Math.random()*2)*T2*mult) + X.PU('frost'), gear = Math.random() < .25 + .1*T2 ? Math.max(0, T2 - 2) : null;
      const tr = W.mau && Math.random() < .5 ? 1 + (Math.random() < .3 ? 1 : 0) : 0; W.treats = (W.treats||0) + tr; const it = give({flakes:fl, frost:fr, score:100*T2, gear}); X.stat('snowChest', 1, 'add'); save(); A.sfx('coin'); splat(ch.x, ch.y - 10, 12, '#F9BF01'); say('🎁 +' + fl + ' ❄ banked · +' + fr + ' Frost Crystals' + (tr ? ' · +' + tr + ' 🐟' : '') + (it ? ' · ' + it.name : '') + (mult > 1 ? ' · DOUBLED!' : ''), 3.5); };
    if (boss) { go(1); return; }   // no pop-up questions in the middle of a boss fight
    quiz = true; if (!X.learn2('BONUS QUESTION · ANSWER RIGHT FOR DOUBLE TREASURE', () => { quiz = false; go(2); }, () => { quiz = false; go(1); })) quiz = false; };
  // ---------- things you can use (✋ / E / tap them) ----------
  const things = () => { const L = [{x:PIP.x, y:PIP.y, n:'Talk', f:talkPip}];
    for (const k in WAYS) { const w2 = px(WAYS[k]); L.push({x:w2.x, y:w2.y, n:W.ways[k] ? 'Travel' : 'Touch', f:() => { W.ways[k] = 1; save(); openMap(true); }}); }
    for (const ch of chests) if (!W.chests[ch.id]) L.push({x:ch.x, y:ch.y, n:'Open', f:() => openChest(ch)});
    if (W.loki && !W.bau) L.push({x:BAUCAGE.x, y:BAUCAGE.y, n:'Free', f:freeBau});
    if (W.bau) L.push({x:THRONE.x, y:THRONE.y, n:'Talk', f:talkBau});
    if (W.mau) L.push({x:mau.x, y:mau.y, n:'Talk', f:talkMau, quiet:1});   // tap Mau Mau to chat; he follows you, so no pop-up label
    return L; };
  const nearThing = () => { let best = null, bd = 74; for (const T2 of things()) { if (T2.quiet) continue; const d = dist(T2, p); if (d < bd) { bd = d; best = T2; } } return best; };
  const use = () => { if (dlg) return nextLine(); const T2 = nearThing(); if (T2) T2.f(); };
  // ---------- the quest arrow ----------
  const goal = () => { if (!W.met) return {x:PIP.x, y:PIP.y, n:'Talk to Old Pip at Camp Cocoa'};
    if (W.bau) return null;
    if (W.loki) return {x:BAUCAGE.x, y:BAUCAGE.y, n:'Open Lord Emperor Bau Bau’s cage'};
    if (gateOpen()) return {x:LAIR.loki.x, y:LAIR.loki.y, n:'Storm the Shadow Castle and defeat Loki the Evil Sorcerer'};
    const left = []; if (!W.mau) left.push({...LAIR.rufus, n:'Free Royal Guard Mau Mau at Howling Pass'});
    [['grumble', 'forest'], ['icefang', 'lake'], ['crystal', 'caves']].forEach(([b, r]) => { if (!W.runes[r]) left.push({...LAIR[b], n:'Win the ' + RUNE_N[r] + ' Moon Rune (' + runesN() + '/3) in ' + REG[r].n}); });
    left.sort((a, b) => dist(a, p) - dist(b, p)); return left[0]; };
  // ---------- throwing ----------
  const shot = (from, ang, sp, o) => { if (balls.length > 260) return; balls.push({x:from.x, y:from.y, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp, mine:0, dmg:o.dmg || 1, r:o.r || 7, life:o.life || 3.5, col:o.col || '#ffffff', hex:o.hex}); };
  const throwAt = (wx, wy, pk) => { const k = X.ballK(), cost = k == 'boulder' ? 3 : 1; if (p.ammo < cost) { if (msgT <= 0) say('Out of snowballs! They come back by themselves in a moment', 1.6); A.sfx('bad'); return; }
    const ang = Math.atan2(wy - (p.y - 10), wx - p.x), sn = X.CL().snipe || 1, crit = Math.random() < .05*X.crit() ? 2 : 1;
    let dmg = X.armM() * (1 + pk) * (pk > .5 ? sn : 1) * crit * (p.eye > 0 ? 2 : 1) * (buffT > 0 ? 1.25 : 1), r = 5 + pk*4, sp = 520 + (sn > 1 ? 120 : 0);
    if (p.stick) { p.stick = 0; balls.push({x:p.x, y:p.y - 10, vx:Math.cos(ang)*430, vy:Math.sin(ang)*430, mine:1, dmg:0, r:9, life:.75, kind:'stick', hits:[], col:'#8D5B1D'}); p.reload = .5; p.face = ang; p.throwT = .2; A.tone(300, .08, 'triangle', .04); say('🪵 Stick!', 1); return; }
    if (k == 'boulder') { dmg *= 3; r = 12; sp = 420; }
    balls.push({x:p.x, y:p.y - 10, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp, mine:1, dmg, r, life:.8 + (sn > 1 ? .35 : 0) + pk*.2, kind:k, hits:[], pierce:k == 'shard' || p.eye > 0, col:k == 'shard' ? '#9fe8ff' : k == 'slush' ? '#bfe0ff' : k == 'sparkle' ? '#ffe9a0' : '#ffffff'});
    p.ammo -= cost; p.reload = .7; p.face = ang; p.throwT = .18; A.tone(520 + pk*200, .04, 'triangle', .03); };
  const useAbility = () => { if (p.ab > 0 || dead > 0) return; const C2 = X.CL(), k = PERM.cls; p.ab = X.abCd(); A.sfx('win'); say('⭐ ' + C2.ab + '!', 1.4);
    const wa = toWorld(aim);
    if (k == 'slinger') for (let i = -2; i <= 2; i++) { const a = Math.atan2(wa.y - p.y, wa.x - p.x) + i*.16; balls.push({x:p.x, y:p.y - 10, vx:Math.cos(a)*560, vy:Math.sin(a)*560, mine:1, dmg:X.armM()*1.2, r:6, life:.9, hits:[], col:'#ffffff'}); }
    else if (k == 'builder') { p.fortT = 8; say('🏰 Snow fort! It blocks every snowball for 8 seconds', 2); }
    else if (k == 'medic') { p.hp = Math.min(p.max, p.hp + 3); splat(p.x, p.y, 14, '#ff9ad5'); }
    else if (k == 'tank') p.shieldT = 4;
    else if (k == 'sniper') { p.eye = 6; const bx = Math.floor(p.x/TS/2), by = Math.floor(p.y/TS/2); for (let y = by - 9; y <= by + 9; y++) for (let x = bx - 9; x <= bx + 9; x++) if (x >= 0 && y >= 0 && x < FB && y < FB && !fog[y*FB + x]) { fog[y*FB + x] = 1; paintBlock(y*FB + x); explored++; } }
    else if (k == 'trapper') { for (const f of foes) { const d = dist(f, p); if (d < 300) { const a = Math.atan2(f.y - p.y, f.x - p.x); f.kbx = Math.cos(a)*320; f.kby = Math.sin(a)*320; f.kb = .35; f.stun = 2; hurtFoe(f, 2); } } if (boss && dist(boss, p) < 300) hurtBoss(3); splat(p.x, p.y, 30); } };
  // ---------- enemies ----------
  const spawnFoe = (k, x, y) => { const F = FOE[k], tier = Math.max(1, REG[regAt(x, y)].tier), hp = Math.ceil(F.hp * (1 + .3*(tier - 1)) * A.D(.8, 1, 1.25)); foes.push({k, x, y, hp, max:hp, cool:1 + Math.random()*1.5, wa:Math.random()*TAU, wt:0, stun:0, kb:0, kbx:0, kby:0, hurt:0, dir:Math.random() < .5 ? 1 : -1, tier, flap:Math.random()*6}); };
  const hurtFoe = (f, dmg) => { f.hp -= dmg; f.hurt = 3; f.flash = .12; addNum(f.x, f.y - 26, '-' + Math.round(dmg*10)/10, '#FF4539'); if (f.hp <= 0 && !f.dead) killFoe(f); };
  const killFoe = f => { f.dead = 1; const F = FOE[f.k]; splat(f.x, f.y, 14, f.k == 'imp' || f.k == 'pup' || f.k == 'clone' ? '#c08aff' : '#ffffff'); if (F.clone) return;
    const fl = Math.round((3 + Math.random()*5) * f.tier); give({flakes:fl, xp:2, score:F.pts*f.tier}); addNum(f.x, f.y - 44, '+' + fl + ' ❄', '#2f8ad8'); W.kills = (W.kills || 0) + 1; X.stat('snowWorldKills', 1, 'add');
    if (Math.random() < .09) drops.push({x:f.x, y:f.y, k:'cocoa', life:15}); else if (W.mau && Math.random() < .05) drops.push({x:f.x, y:f.y, k:'fish', life:18}); };
  const hurtMe = dmg => { if (p.inv > 0 || p.shieldT > 0 || A.immortal || dead > 0 || quiz) return; if (Math.random() < .06*X.PU('armor')) { p.inv = .4; addNum(p.x, p.y - 40, 'Shrugged off!', '#2f8ad8'); return; } p.hp -= dmg; p.inv = .9; p.hitT = .3; A.sfx('bad'); splat(p.x, p.y - 10, 8, '#e8f4ff');
    if (p.hp <= 0) { p.hp = 0; W.deaths = (W.deaths || 0) + 1; quiz = true;
      if (!X.learn2('SNOWED UNDER! ANSWER RIGHT TO GET BACK UP RIGHT HERE', () => { quiz = false; p.hp = Math.ceil(p.max/2); p.inv = 2.5; say('Back on your feet!', 1.6); }, () => { quiz = false; dead = 1.8; say('❄ Snowed under! Waking up at Camp Cocoa...', 2.4); A.sfx('over'); })) quiz = false; } };
  const respawn = () => { tornado = null; sticks = []; p.stick = 0; p.x = CAMPX.x; p.y = CAMPX.y; p.vx = p.vy = 0; p.hp = p.max; p.inv = 2.5; p.ammo = X.maxAmmo(); foes = []; balls = []; if (boss) { boss = null; } mau.x = p.x - 40; mau.y = p.y + 10; mates.forEach(m => { m.ko = 0; m.hp = m.max; }); mateHome(); save(); say('🏕 Back at Camp Cocoa. Everything you found is safe!', 3); };
  // ---------- bosses ----------
  const bossDone = k => k == 'loki' ? (W.loki > 0 && !lokiReady) : !!W.down[k];
  const phOf = (hp, max, np) => Math.min(np, 1 + Math.floor((1 - Math.max(0, hp)/max) * np));
  const spawnBoss = k => { W.bhp = W.bhp || {}; const B = BOSS[k], H = LAIR[k], hp = B.hp * A.D(.8, 1, 1.2) * (1 + .05*(X.lv() - 1)) * (k == 'loki' && W.loki ? 1.15 : 1);
    const left = W.bhp[k] != null ? Math.max(1, Math.min(hp, W.bhp[k])) : hp;
    const np = B.phases || 3; boss = {k, n:B.n, x:H.x, y:H.y - 40, hx:H.x, hy:H.y, hp:left, max:hp, r:B.r, phases:np, ph:phOf(left, hp, np), cd:2, t:0, st:'walk', a:0, sum:6, tp:4, ring:3, rock:3, flash:0, talk:B.intro, talkT:4.5, castT:0};
    if (k == 'loki') { boss.phn = LOKI_PH[boss.ph]; sticks = []; if (W.loki) boss.talk = 'Loki: “Back for more? Wonderful! I do love an audience.”'; }
    if (left < hp) { say('💪 ' + BOSS[k].n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()) + ' is still hurt from last time!', 2.6); } A.sfx('bad'); };
  const hurtBoss = dmg => { const B = boss; if (!B) return; if (B.fetch && B.fetch.t > 0) dmg *= 2; B.hp -= dmg; W.bhp = W.bhp || {}; W.bhp[B.k] = Math.max(0, B.hp); B.flash = .1; addNum(B.x + (Math.random() - .5)*30, B.y - B.r - 10, '-' + Math.round(dmg*10)/10, '#FF4539');
    if (B.fetch && B.fetch.t > 0) dmg *= 1;   // (fetching doubles damage, applied by the caller below)
    const ph = phOf(B.hp, B.max, B.phases || 3);
    if (ph > B.ph) { B.ph = ph; A.sfx('bad'); if (B.k == 'loki') { B.phn = LOKI_PH[ph]; B.talk = ['', '', 'Loki: “Shadows, my darlings! Fetch!”', 'Loki: “Let’s make it a little... breezier! AWOOOO!”', 'Loki: “ENOUGH! Now you’ll see REAL magic!” *his golden coat blazes*'][ph]; B.talkT = 3.2; if (ph == 4) { spawnFoe('clone', B.hx - 160, B.hy + 40); spawnFoe('clone', B.hx + 160, B.hy + 40); } if (ph == 3) tornado = {x:B.x, y:B.y + 60, r:46, t:0, life:10}; if (B.hp <= 0) bossDown(B); return; }
      const lines = {loki:['', '', '', '', ''], rufus:['', '', 'Rufus: “Grr... I’m just getting warmed up!”', 'Rufus: “Boss Loki will be SO mad at me!”'],
        grumble:['', '', 'Grumblebark: “Hrrm! Bats, help me!”', 'Grumblebark: “You... are... annoying!”'], icefang:['', '', 'Icefang: “Arr, now ye’ve done it!”', 'Icefang: “Full speed ahead!”'], crystal:['', '', 'Crystal Golem: “...CRACK... ANGRY...”', 'Crystal Golem: “...SHATTER... EVERYTHING...”']}[B.k];
      B.talk = lines[ph]; B.talkT = 3; if (B.k == 'loki' && ph == 3) { spawnFoe('clone', B.hx - 150, B.hy + 40); spawnFoe('clone', B.hx + 150, B.hy + 40); } }
    if (B.hp <= 0) bossDown(B); };
  const bossDown = B => { boss = null; if (W.bhp) delete W.bhp[B.k]; balls = balls.filter(b => b.mine); foes = foes.filter(f => !FOE[f.k].clone); splat(B.x, B.y, 40, '#ffe9a0'); A.sfx('win'); X.stat('snowGuard', 1, 'add');
    if (B.k == 'loki') { const first = !W.loki; W.loki = (W.loki || 0) + 1; lokiReady = false; X.stat('snowLoki', 1, 'add');
      const it = give(first ? {frost:40 + X.PU('frost'), flakes:600, xp:120, score:4000, gear:3} : {frost:15 + X.PU('frost'), flakes:250, xp:60, score:1500, gear:Math.random() < .4 ? 2 : null});
      tornado = null; sticks = [];
      if (first) talk([['Loki the Evil Sorcerer', 'loki', 'Aroooo! My beautiful robe is SOAKED! Fine. FINE. You win... this time.', 'sad'], ['Loki the Evil Sorcerer', 'loki', '*Loki trots off into the snow. His tail is still wagging a tiny bit.*', 'smug'], [...MAUF, 'He dropped the cage key! Quick, open Lord Emperor Bau Bau’s cage! ...Is anyone else hungry?', 'happy']], save);
      else say('🐶 Loki the Evil Sorcerer runs away again! +15 Frost Crystals' + (it ? ' · ' + it.name : ''), 3.5); save(); return; }
    W.down[B.k] = 1; const it = give({frost:15 + 5*Math.max(0, Object.keys(W.down).length - 1) + X.PU('frost'), flakes:300, xp:80, score:1500, gear:2});
    if (B.k == 'rufus') { W.mau = 1; mau.x = MAUCAGE.x; mau.y = MAUCAGE.y;
      talk([[...MAUF, 'Meow! Free at last! Royal Guard Mau Mau, at your service!'], [...MAUF, 'Loki is keeping Lord Emperor Bau Bau in his Shadow Castle. I have the guard key for the gate, but it’s sealed with 3 Moon Runes.'],
        [...MAUF, (runesN() >= 3 ? 'And you already have all 3 runes! Let’s go to the castle, north-east!' : 'Find the runes and I’ll open it. I’m coming with you, and I throw a mean snowball!')]], save); }
    else { const rn = BOSS[B.k].rune; W.runes[rn] = 1; say('🌙 The ' + RUNE_N[rn] + ' Moon Rune! (' + runesN() + '/3)' + (it ? ' · ' + it.name : '') + (gateOpen() ? ' · The castle gate is OPEN!' : ''), 4.5); }
    save(); };
  const bossAI = (B, dt) => { const ph = B.ph, d = dist(B, p), ang = Math.atan2(p.y - B.y, p.x - B.x), sp1 = 1 + .25*(ph - 1); B.t += dt; B.cd -= dt; B.flash = Math.max(0, B.flash - dt); B.talkT = Math.max(0, B.talkT - dt);
    const walk = (tx, ty, spd) => { const a = Math.atan2(ty - B.y, tx - B.x), nx = B.x + Math.cos(a)*spd*dt, ny = B.y + Math.sin(a)*spd*dt; if (Math.hypot(nx - B.hx, ny - B.hy) < 260 && !blocked(nx, ny, 18)) { B.x = nx; B.y = ny; } };
    if (B.k == 'grumble') { walk(p.x, p.y, 34);
      if (B.cd <= 0) { B.cd = 2.6 / sp1; const n = 8 + 2*ph; for (let i = 0; i < n; i++) shot(B, i/n*TAU + B.t*.7, 165, {r:8, col:'#a07040'}); if (ph >= 3) for (let i = -1; i <= 1; i++) shot(B, ang + i*.22, 240, {r:7, col:'#a07040'}); }
      if (ph >= 2) { B.sum -= dt; if (B.sum <= 0) { B.sum = 9; if (foes.length < 10) { spawnFoe('bat', B.x - 60, B.y); spawnFoe('bat', B.x + 60, B.y); } } } }
    else if (B.k == 'icefang') {
      if (B.st == 'walk') { const oa = ang + Math.PI + Math.sin(B.t*.8)*.9; walk(p.x + Math.cos(oa)*220, p.y + Math.sin(oa)*220, 90); B.tp -= dt; if (B.tp <= 0) { B.tp = 1.6 / sp1; const n = ph >= 2 ? 5 : 3; for (let i = 0; i < n; i++) shot(B, ang + (i - (n - 1)/2)*.24, 230, {r:7, col:'#cfefff'}); }
        if (B.cd <= 0) { B.st = 'wind'; B.wt = .75; B.da = ang; } }
      else if (B.st == 'wind') { B.wt -= dt; if (B.wt <= 0) { B.st = 'dash'; B.wt = .8; } }
      else { B.wt -= dt; const nx = B.x + Math.cos(B.da)*440*dt, ny = B.y + Math.sin(B.da)*440*dt; if (!blocked(nx, ny, 18) && Math.hypot(nx - B.hx, ny - B.hy) < 330) { B.x = nx; B.y = ny; } else B.wt = 0;
        if (ph >= 3 && Math.random() < dt*10) shot(B, B.da + Math.PI + (Math.random() - .5)*1.2, 120, {r:6, col:'#cfefff'});
        if (d < B.r + 14) hurtMe(2); if (B.wt <= 0) { B.st = 'walk'; B.cd = 2.4 / sp1; } } }
    else if (B.k == 'crystal') { walk(p.x, p.y, 28);
      if (B.cd <= 0) { B.burst = 2.2; B.cd = 4.6 / (1 + .15*(ph - 1)); } if (B.burst > 0) { B.burst -= dt; B.tp -= dt; if (B.tp <= 0) { B.tp = .16; B.a += .45; shot(B, B.a, 160, {r:7, col:'#c9a0ff'}); if (ph >= 3) shot(B, B.a + Math.PI, 160, {r:7, col:'#c9a0ff'}); } }
      if (ph >= 2) { B.rock -= dt; if (B.rock <= 0) { B.rock = 3; shot(B, ang, 210, {r:13, dmg:2, col:'#9ec4e8'}); } } }
    else if (B.k == 'rufus') { if (d > 190) walk(p.x, p.y, 70); else walk(B.x - Math.cos(ang)*40, B.y - Math.sin(ang)*40, 50);
      if (B.cd <= 0) { B.cd = 1.8 / sp1; for (let i = -1; i <= 1; i++) shot(B, ang + i*.22, 250, {r:7, col:'#c04ae0', hex:1}); }
      B.tp -= dt; if (B.tp <= 0) { B.tp = 5; for (let k2 = 0; k2 < 8; k2++) { const a = Math.random()*TAU, nx = p.x + Math.cos(a)*220, ny = p.y + Math.sin(a)*220; if (!blocked(nx, ny, 18) && Math.hypot(nx - B.hx, ny - B.hy) < 300) { splat(B.x, B.y, 12, '#c08aff'); B.x = nx; B.y = ny; splat(B.x, B.y, 12, '#c08aff'); break; } } }
      if (ph >= 2) { B.sum -= dt; if (B.sum <= 0) { B.sum = 9; if (foes.length < 10) { spawnFoe('pup', B.x - 50, B.y); spawnFoe('pup', B.x + 50, B.y); } } }
      if (ph >= 3) { B.ring -= dt; if (B.ring <= 0) { B.ring = 4; for (let i = 0; i < 12; i++) shot(B, i/12*TAU, 150, {r:7, col:'#c04ae0', hex:1}); } } }
    else if (B.k == 'loki') { B.castT = Math.max(0, B.castT - dt); const rage = ph >= 4 ? 1.5 : 1;
      // he can't resist a thrown stick: he runs to it, stops attacking and takes double damage
      if (B.fetch && B.fetch.t > 0) { B.fetch.t -= dt; const fd = Math.hypot(B.fetch.x - B.x, B.fetch.y - B.y); if (fd > 8) { B.x += (B.fetch.x - B.x)/fd*Math.min(fd, 260*dt); B.y += (B.fetch.y - B.y)/fd*Math.min(fd, 260*dt); } if (B.fetch.t <= 0) { B.talk = 'Loki: “...Where was I? Oh yes. EVIL.”'; B.talkT = 2.2; } }
      else { B.x += Math.sin(B.t*1.3)*30*dt*rage; B.y += Math.cos(B.t*1.1)*20*dt*rage;
        if (ph >= 2) { B.tp -= dt; if (B.tp <= 0) { B.tp = (ph >= 4 ? 3.2 : 4.6); const spots = [[-150, 0], [150, 0], [0, -100], [0, 110], [-120, 100], [120, 100]], s2 = spots[Math.floor(Math.random()*spots.length)]; splat(B.x, B.y, 16, '#9fe8ff'); B.x = B.hx + s2[0]; B.y = B.hy + s2[1]; splat(B.x, B.y, 16, '#9fe8ff'); A.tone(220, .15, 'sine', .05); } }
        // phase 1+: ICE MAGIC — frost bolts and shard rings
        if (B.cd <= 0) { B.cd = (ph == 3 ? 2.2 : 1.6) / rage; B.castT = .5; const n = ph >= 4 ? 7 : 5; for (let i = 0; i < n; i++) shot(B, ang + (i - (n - 1)/2)*.19, 240, {r:7, col:'#bfeeff'}); }
        B.ring -= dt; if (B.ring <= 0) { B.ring = ph >= 4 ? 2.4 : 4; B.castT = .5; for (let i = 0; i < 12; i++) shot(B, i/12*TAU + B.t, 150, {r:7, col:'#9fd8ff'}); }
        // phase 2: SHADOW MINIONS
        if (ph >= 2) { B.sum -= dt; if (B.sum <= 0) { B.sum = ph >= 4 ? 7 : 8.5; B.castT = .8; for (let i = 0; i < 3 && foes.filter(f => f.k == 'shade').length < 7; i++) spawnFoe('shade', B.x + (i - 1)*70, B.y + 60); } }
        // phase 4: ENRAGED — spinning frost spirals
        if (ph >= 4) { B.tp2 = (B.tp2 || 0) - dt; if (B.tp2 <= 0) { B.tp2 = .13; B.a += .3; shot(B, B.a, 140, {r:6, col:'#ffd27a'}); shot(B, B.a + Math.PI, 140, {r:6, col:'#ffd27a'}); } } }
      // sticks keep turning up in the throne room
      B.stickT = (B.stickT || 4) - dt; if (B.stickT <= 0) { B.stickT = 9; if (sticks.length < 2) { for (let k3 = 0; k3 < 8; k3++) { const sx = B.hx + (Math.random() - .5)*420, sy = B.hy + 60 + Math.random()*170; if (!blocked(sx, sy, 10)) { sticks.push({x:sx, y:sy}); break; } } } }
      // phase 3: the FROST TORNADO keeps coming back
      if (ph >= 3 && !tornado) { B.torT = (B.torT || 3) - dt; if (B.torT <= 0) { B.torT = 3; tornado = {x:B.x, y:B.y + 60, r:46, t:0, life:10}; } } }
    if (d < B.r + 12 && B.k != 'icefang') hurtMe(1);
    if (dist(p, {x:B.hx, y:B.hy}) > 1150) { boss = null; tornado = null; sticks = []; balls = balls.filter(b => b.mine); save(); say(BOSS[B.k].n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()) + ' waits for you. Its health stays where you left it', 3); } };
  // ---------- map / fast travel ----------
  const openMap = tr => { mapOpen = true; travel = !!tr; A.sfx('blip'); };
  const MAPR = {x:20, y:66, s:5.6};
  const mapDown = q => { if (q.y > 650 && q.y < 700) { if (q.x < VW/2) { mapOpen = false; travel = false; } else { close(); X.exit(); } return; }
    if (travel) for (const k in WAYS) { if (!W.ways[k]) continue; const sx = MAPR.x + (WAYS[k].x + .5)*MAPR.s, sy = MAPR.y + (WAYS[k].y + .5)*MAPR.s; if (Math.hypot(q.x - sx, q.y - sy) < 24) { const w2 = px(WAYS[k]); p.x = w2.x; p.y = w2.y + 40; p.vx = p.vy = 0; foes = []; balls = []; if (boss) boss = null; mateHome(); mapOpen = false; travel = false; A.sfx('win'); say('✨ Whoosh! ' + WAYS[k].n, 2); save(); return; } } };
  const toWorld = q => ({x:q.x + cam.x, y:q.y + cam.y});
  // ---------- input (called by Snowball Showdown) ----------
  const BTN = ['◀', '▲', '▼', '▶', '⭐', '✋', '🐟', '🗺'];
  let hudR = null, mmR = null, btnR = [];
  const inR = (q, r2) => r2 && q.x >= r2.x && q.x <= r2.x + r2.w && q.y >= r2.y && q.y <= r2.y + r2.h;
  const down = (q, e) => { if (e && e.pointerType) { const was = touchUI; touchUI = e.pointerType == 'touch' || e.pointerType == 'pen'; if (was != touchUI) layout(); }
    mouseIn = true; aim = q; if (quiz) return; if (mapOpen) return mapDown(q); if (dlg) return nextLine(); if (dead > 0) return;
    if (inR(q, hudR)) { W.hudMin = W.hudMin ? 0 : 1; A.sfx('blip'); return; } if (inR(q, mmR)) { openMap(false); return; }
    for (const b of btnR) if (inR(q, b)) { if (b.id == 'ab') useAbility(); else if (b.id == 'use') use(); else if (b.id == 'feed') feedMau(); else openMap(false); return; }
    if (touchUI && q.y > BAR) { const i = Math.floor(q.x/(VW/BTN.length)); if (i < 4) pads.set(e.pointerId, ['l', 'u', 'd', 'r'][i]); else if (i == 4) useAbility(); else if (i == 5) use(); else if (i == 6) feedMau(); else openMap(false); return; }
    const wq = toWorld(q); if (!boss) for (const T2 of things()) if (Math.hypot(T2.x - wq.x, T2.y - wq.y) < 30 && dist(T2, p) < 110) { T2.f(); return; }
    charge = {id:e.pointerId, t:0}; };
  const move = (q, e) => { if (e && e.pointerType == 'mouse' && touchUI && !e.buttons) { touchUI = false; layout(); } mouseIn = q.y < BAR; if (!charge || charge.id == e.pointerId) aim = q; };
  const up = e => { pads.delete(e.pointerId); if (charge && charge.id == e.pointerId) { const pk = Math.min(1, charge.t); charge = null; if (!dlg && !mapOpen && !quiz && dead <= 0) { const wa = toWorld(aim); throwAt(wa.x, wa.y, pk > .25 ? pk : 0); } } };
  const key = e => { const k = e.key; if (quiz) return;
    if (mapOpen) { if (k == 'm' || k == 'M' || k == 'Enter' || k == ' ') { mapOpen = false; travel = false; } return; }
    if (dlg) { if (k == ' ' || k == 'Enter' || k == 'e' || k == 'E') nextLine(); return; }
    if (k == 'm' || k == 'M') openMap(false); else if (k == 'e' || k == 'E' || k == 'Enter') use(); else if (k == ' ' || k == 'q' || k == 'Q') useAbility(); else if (k == 'g' || k == 'G') feedMau(); else if (k == 'h' || k == 'H') { W.hudMin = W.hudMin ? 0 : 1; }
    else if ((k == 'f' || k == 'F') && dead <= 0) { const wa = mouseIn ? toWorld(aim) : {x:p.x + Math.cos(p.face)*300, y:p.y + Math.sin(p.face)*300}; throwAt(wa.x, wa.y, 0); } };
  // ---------- update ----------
  const update = dt => { t += dt; msgT = Math.max(0, msgT - dt);
    for (const f2 of fx) { f2.x += f2.vx*dt; f2.y += f2.vy*dt; f2.t -= dt; } fx = fx.filter(f2 => f2.t > 0);
    for (const n of nums) { n.y -= 30*dt; n.t -= dt; } nums = nums.filter(n => n.t > 0);
    if (quiz || dlg || mapOpen) return;
    if (dead > 0) { dead -= dt; if (dead <= 0) respawn(); return; }
    if (charge) charge.t += dt * (1 + .12*(X.PU ? X.PU('pack') : 0)) * (X.CL().pack || 1);
    // move
    const kk = K.k; let mx = ((kk.ArrowRight || kk.d || kk.D || pad('r')) ? 1 : 0) - ((kk.ArrowLeft || kk.a || kk.A || pad('l')) ? 1 : 0), my = ((kk.ArrowDown || kk.s || kk.S || pad('d')) ? 1 : 0) - ((kk.ArrowUp || kk.w || kk.W || pad('u')) ? 1 : 0);
    const L = Math.hypot(mx, my); if (L) { mx /= L; my /= L; if (!charge) p.face = Math.atan2(my, mx); p.walk += dt; }
    const tl = tileAt(Math.floor(p.x/TS), Math.floor(p.y/TS)), spd = 215 * X.spd() * (tl == PATH || tl == CAMP || tl == FLOOR ? 1.2 : tl == DEEP ? .62 : 1) * (charge ? .6 : 1), k2 = tl == ICE ? 2.2 + .8*X.gStat('boots') : 14;
    p.vx += (mx*spd - p.vx) * Math.min(1, k2*dt); p.vy += (my*spd - p.vy) * Math.min(1, k2*dt);
    const nx = p.x + p.vx*dt, ny = p.y + p.vy*dt; if (!blocked(nx, p.y, 12)) p.x = nx; else p.vx = 0; if (!blocked(p.x, ny, 12)) p.y = ny; else p.vy = 0;
    if (!gateOpen() && Math.abs(p.x - (83.5*TS)) < 90 && Math.abs(p.y - 31*TS) < 40) { gateT -= dt; if (gateT <= 0) { gateT = 4; say('🔒 The gate is sealed: ' + runesN() + '/3 Moon Runes' + (W.mau ? '' : ' · Royal Guard Mau Mau has the key') , 3); } }
    // timers, ammo, healing
    p.inv = Math.max(0, p.inv - dt); p.hitT = Math.max(0, p.hitT - dt); p.ab = Math.max(0, p.ab - dt); p.shieldT = Math.max(0, p.shieldT - dt); p.eye = Math.max(0, p.eye - dt); p.fortT = Math.max(0, p.fortT - dt); p.throwT = Math.max(0, (p.throwT || 0) - dt);
    p.reload -= dt * X.scoop(); if (p.reload <= 0 && p.ammo < X.maxAmmo()) { p.ammo++; p.reload = .4; }
    if (X.PU('regen') && p.hp < p.max) { p.regT = (p.regT || 0) + dt; if (p.regT >= 40 - 5*X.PU('regen')) { p.regT = 0; p.hp++; addNum(p.x, p.y - 40, '☕ +♥', '#8D5B1D'); } }
    if (dist(p, FIRE) < 110 && p.hp < p.max) { healT -= dt; if (healT <= 0) { healT = 1; p.hp++; addNum(p.x, p.y - 40, '+♥', '#FF4539'); } }
    for (const d2 of drops) { d2.life -= dt; if (dist(d2, p) < 34) { d2.life = 0; if (d2.k == 'fish') { W.treats = (W.treats||0) + 1; addNum(p.x, p.y - 40, '+1 🐟 treat', '#c4601a'); } else { p.hp = Math.min(p.max, p.hp + 1); addNum(p.x, p.y - 40, '☕ +♥', '#8D5B1D'); } A.sfx('coin'); } } drops = drops.filter(d2 => d2.life > 0);
    // where am I
    const rg = regAt(p.x, p.y); if (rg != lastReg) { if (lastReg) say('📍 ' + REG[rg].n, 2); if (rg != 'castle' && W.bau) lokiReady = true; lastReg = rg; }
    for (const k in WAYS) if (!W.ways[k] && dist(p, px(WAYS[k])) < 80) { W.ways[k] = 1; say('✨ Waystone found: ' + WAYS[k].n + '! Use any waystone to travel here', 3); A.sfx('win'); save(); }
    for (let i = sticks.length - 1; i >= 0; i--) if (!p.stick && dist(sticks[i], p) < 30) { sticks.splice(i, 1); p.stick = 1; say('🪵 You picked up a stick! Throw it near Loki and watch what happens…', 2.6); A.sfx('coin'); }
    if (tornado) { tornado.t += dt; tornado.life -= dt; const ta = Math.atan2(p.y - tornado.y, p.x - tornado.x); tornado.x += Math.cos(ta)*70*dt; tornado.y += Math.sin(ta)*70*dt; const td = dist(tornado, p);
      if (td < 220 && td > 10) { p.vx -= Math.cos(ta)*160*dt; p.vy -= Math.sin(ta)*160*dt; } if (td < tornado.r) { tornado.hitT = (tornado.hitT || 0) - dt; if (tornado.hitT <= 0) { tornado.hitT = .8; hurtMe(1); } }
      if (tornado.life <= 0 || !boss) tornado = null; }
    revealT -= dt; if (revealT <= 0) { revealT = .25; reveal(); }
    saveT -= dt; if (saveT <= 0) { saveT = 15; save(); }
    // bosses wake up when you come close to their lair
    if (!boss) for (const k in LAIR) { if (bossDone(k)) continue; if (k == 'loki' && !gateOpen()) continue; if (dist(p, LAIR[k]) < 380) { spawnBoss(k); break; } }
    if (boss) bossAI(boss, dt);
    // Loki's minions roam the land (never inside camp)
    spawnT -= dt; const cap = A.D(6, 8, 10); if (spawnT <= 0 && rg != 'camp') { spawnT = 1.1; if (foes.length < cap && !boss) for (let k3 = 0; k3 < 6; k3++) { const a = Math.random()*TAU, r2 = 430 + Math.random()*260, sx = p.x + Math.cos(a)*r2, sy = p.y + Math.sin(a)*r2, rr2 = regAt(sx, sy);
        if (sx < TS*2 || sy < TS*2 || sx > WORLD - TS*2 || sy > WORLD - TS*2 || rr2 == 'camp' || blocked(sx, sy, 16) || Math.hypot(sx - FIRE.x, sy - FIRE.y) < 600) continue; const pool = REG[rr2].pool; spawnFoe(pool[Math.floor(Math.random()*pool.length)], sx, sy); break; } }
    for (const f of foes) { const F = FOE[f.k], d = dist(f, p), ang = Math.atan2(p.y - f.y, p.x - f.x); f.flash = Math.max(0, (f.flash || 0) - dt); f.hurt = Math.max(0, f.hurt - dt); f.flap += dt*12; f.cool -= dt;
      if (d > 1150 && !F.clone) { f.dead = 1; continue; }
      if (f.kb > 0) { f.kb -= dt; const nx2 = f.x + f.kbx*dt, ny2 = f.y + f.kby*dt; if (F.fly || !blocked(nx2, ny2, 10)) { f.x = nx2; f.y = ny2; } }
      if (f.stun > 0) { f.stun -= dt; continue; }
      const aggro = (d < (F.fly ? 340 : 300) || f.hurt > 0) && dist(p, FIRE) > 400; let vx = 0, vy = 0;
      if (F.clone) { f.x += Math.sin(t*2 + f.flap)*20*dt; }
      else if (aggro) { if (F.shoot) { const want = d > 250 ? 1 : d < 160 ? -1 : 0, pa = ang + Math.PI/2; vx = Math.cos(ang)*want + Math.cos(pa)*f.dir*.6; vy = Math.sin(ang)*want + Math.sin(pa)*f.dir*.6; if (Math.random() < dt*.4) f.dir *= -1; }
        else { vx = Math.cos(ang); vy = Math.sin(ang); if (F.fly) { vx += Math.cos(t*5 + f.flap)*.6; vy += Math.sin(t*4 + f.flap)*.6; } } }
      else { f.wt -= dt; if (f.wt <= 0) { f.wt = 1.5 + Math.random()*2; f.wa = Math.random()*TAU; } vx = Math.cos(f.wa)*.35; vy = Math.sin(f.wa)*.35; }
      const sp2 = F.sp * (f.slow > 0 ? .5 : 1); f.slow = Math.max(0, (f.slow || 0) - dt); const nx2 = f.x + vx*sp2*dt, ny2 = f.y + vy*sp2*dt;
      const inCamp = (x, y) => Math.hypot(x - FIRE.x, y - FIRE.y) < 8*TS;
      if (F.fly || !blocked(nx2, f.y, 10)) { if (!inCamp(nx2, f.y)) f.x = nx2; } else { f.wt = 0; f.dir *= -1; } if (F.fly || !blocked(f.x, ny2, 10)) { if (!inCamp(f.x, ny2)) f.y = ny2; } else f.wt = 0;
      if (F.melee && d < F.r + 14 && f.cool <= 0) { f.cool = 1; hurtMe(F.melee); f.kbx = -Math.cos(ang)*200; f.kby = -Math.sin(ang)*200; f.kb = .25; }
      if (F.shoot && (aggro || F.clone) && f.cool <= 0 && d < 380) { f.cool = F.shoot * (.8 + Math.random()*.4) * A.D(1.3, 1, .8); if (F.hex) for (let i = -1; i <= 1; i++) shot(f, ang + i*.22, 230, {r:6, col:'#c04ae0', hex:1}); else shot(f, ang, F.big ? 220 : 270, {r:F.big ? 11 : 6, dmg:F.big ? 2 : 1}); } }
    foes = foes.filter(f => !f.dead);
    // ROYAL GUARD MAU MAU: follows you, throws, Shield Belly, Spear Charge, Snack Break, sniffs out snacks, naps when you stand still
    buffT = Math.max(0, buffT - dt);
    if (W.mau) { mau.stT = Math.max(0, mau.stT - dt); mau.sayT = Math.max(0, mau.sayT - dt); mau.blockCd -= dt; mau.chargeCd -= dt; mau.snackCd -= dt; mau.quipT -= dt;
      const pm = Math.hypot(p.vx, p.vy) > 30; mau.idle = pm || boss || foes.some(f => dist(f, p) < 300) ? 0 : mau.idle + dt; if (pm && mau.idle == 0 && mau.wasSleep) { mau.wasSleep = 0; mauSay('Huh?! I was guarding! With my eyes closed!', 2.4); } if (mau.idle > 16) mau.wasSleep = 1;
      if (mau.dash) { mau.dash.t -= dt; const nx = mau.x + Math.cos(mau.dash.a)*520*dt, ny = mau.y + Math.sin(mau.dash.a)*520*dt; if (!blocked(nx, ny, 10)) { mau.x = nx; mau.y = ny; }
        for (const f of foes) if (!f.dead && !mau.dash.hit.includes(f) && dist(f, mau) < FOE[f.k].r + 18) { mau.dash.hit.push(f); hurtFoe(f, 3*X.armM()); f.stun = 1; splat(f.x, f.y, 8, '#F9BF01'); }
        if (boss && !mau.dash.hit.includes(boss) && dist(boss, mau) < boss.r + 18) { mau.dash.hit.push(boss); hurtBoss(4*X.armM()); }
        if (mau.dash.t <= 0) mau.dash = null; }
      else { const tx = p.x - Math.cos(p.face)*50, ty = p.y - Math.sin(p.face)*50 + 8, dm = Math.hypot(tx - mau.x, ty - mau.y); mau.moving = dm > 14 && mau.idle < 7;
        if (dm > 600) { mau.x = tx; mau.y = ty; } else if (dm > 14 && (mau.idle < 7 || dm > 160)) { const s2 = Math.min(dm*3.6, 280); mau.x += (tx - mau.x)/dm*s2*dt; mau.y += (ty - mau.y)/dm*s2*dt; mau.walk += dt; } }
      // Spear Charge at the nearest enemy
      if (mau.chargeCd <= 0 && !mau.dash) { let tg = null, bd = 230; for (const f of foes) { const d3 = dist(f, mau); if (d3 < bd && !FOE[f.k].clone) { bd = d3; tg = f; } } if (!tg && boss && dist(boss, mau) < 260) tg = boss;
        if (tg) { mau.dash = {a:Math.atan2(tg.y - mau.y, tg.x - mau.x), t:.42, hit:[]}; mau.chargeCd = 7; mauSay('SPEAR CHARGE! For the Emperor!', 1.6); A.tone(300, .12, 'sawtooth', .04); } else mau.chargeCd = .5; }
      // Snack Break: when you're hurt, he eats a treat to heal and buff the team
      if (mau.snackCd <= 0 && p.hp <= Math.max(1, Math.floor(p.max*.4)) && (W.treats||0) > 0 && dead <= 0) { W.treats--; mau.snackCd = 30; mau.st2 = 'eat'; mau.stT = 1.8; buffT = Math.max(buffT, 10); p.hp = Math.min(p.max, p.hp + 3); mates.forEach(m => { if (!m.ko) m.hp = m.max; }); addNum(p.x, p.y - 44, '🐟 Snack Break! +3♥', '#c4601a'); mauSay('SNACK BREAK! *munch munch* Team, eat up!', 2.6); A.sfx('coin'); }
      // sniffing out hidden snacks
      mau.sniff = null; for (const sn of SNACKS) { if (W.snacks[sn.id]) continue; const ds = dist(sn, mau); if (ds < 170) { mau.sniff = sn; if (!sn.told) { sn.told = 1; mauSay('*sniff sniff* I smell a ' + {'🐟':'fish', '🍗':'drumstick', '🧀':'cheese', '🥛':'milk'}[sn.e] + '!', 2.4); } }
        if (ds < 170 && dist(sn, p) < 34) { W.snacks[sn.id] = 1; W.treats = (W.treats||0) + 1; addNum(sn.x, sn.y - 20, '+1 ' + sn.e, '#c4601a'); A.sfx('coin'); X.stat('snowSnack', 1, 'add'); mau.st2 = 'dance'; mau.stT = 1.6; save(); } }
      if (mau.quipT <= 0) { mau.quipT = 28 + Math.random()*20; if (!boss && mau.idle < 7) mauSay(MAU_LINES[Math.floor(Math.random()*MAU_LINES.length)], 3.2); }
      mau.cool -= dt; if (mau.cool <= 0 && !mau.dash && mau.idle < 7) { let tg = boss && dist(boss, mau) < 340 ? boss : null; if (!tg) { let bd = 320; for (const f of foes) { const d3 = dist(f, mau); if (d3 < bd) { bd = d3; tg = f; } } }
        if (tg) { mau.cool = 1.1; const a = Math.atan2(tg.y - mau.y, tg.x - mau.x); balls.push({x:mau.x, y:mau.y - 10, vx:Math.cos(a)*480, vy:Math.sin(a)*480, mine:1, dmg:buffT > 0 ? 1.3 : 1, r:5, life:.9, hits:[], col:'#ffe0f0'}); } else mau.cool = .3; } }
    mates.forEach((m, i) => { m.throwT = Math.max(0, m.throwT - dt);
      if (m.ko > 0) { m.ko -= dt * (dist(m, p) < 50 ? 4 : 1); if (m.ko <= 0) { m.ko = 0; m.hp = m.max; addNum(m.x, m.y - 30, m.name + ' is back!', '#00B451'); } return; }
      const a = p.face + Math.PI + (i - (mates.length - 1)/2)*.72, rad = 78 + (i % 2)*30, tx = p.x + Math.cos(a)*rad, ty = p.y + Math.sin(a)*rad + 6, dm = Math.hypot(tx - m.x, ty - m.y);
      for (const o2 of mates) { if (o2 === m) continue; const sd = Math.hypot(m.x - o2.x, m.y - o2.y); if (sd > 0 && sd < 38) { m.x += (m.x - o2.x)/sd*(38 - sd)*.5; m.y += (m.y - o2.y)/sd*(38 - sd)*.5; } }
      if (dm > 650) { m.x = tx; m.y = ty; } else if (dm > 10) { const s2 = Math.min(dm*3.5, 280); m.x += (tx - m.x)/dm*s2*dt; m.y += (ty - m.y)/dm*s2*dt; m.walk += dt; }
      if (m.role == 'medic') { m.heal -= dt; if (m.heal <= 0 && p.hp < p.max && dead <= 0) { m.heal = Math.max(6, 14 - m.lv); p.hp++; addNum(p.x, p.y - 44, '➕ ' + m.name + ' +♥', '#ff5fa8'); } }
      m.cool -= dt; if (m.cool <= 0) { let tg = boss && dist(boss, m) < 360 ? boss : null; if (!tg) { let bd = 330; for (const f of foes) { const d3 = dist(f, m); if (d3 < bd) { bd = d3; tg = f; } } }
        if (!tg) { m.cool = .3; return; } m.cool = (m.role == 'thrower' ? 1.2 : m.role == 'builder' ? 1.7 : 2.2) / (1 + .1*m.lv); const a2 = Math.atan2(tg.y - m.y, tg.x - m.x); m.face = a2; m.throwT = .18;
        balls.push({x:m.x, y:m.y - 10, vx:Math.cos(a2)*470, vy:Math.sin(a2)*470, mine:1, dmg:X.armM()*(.5 + .1*m.lv)*(m.role == 'builder' ? 1.3 : 1)*(buffT > 0 ? 1.25 : 1), r:m.role == 'builder' ? 7 : 5, life:.9, hits:[], kind:m.role == 'builder' ? 'slush' : 'snow', col:m.role == 'builder' ? '#bfe0ff' : '#ffffff'}); } });
    // snowballs
    for (const b of balls) { b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
      if (b.kind == 'stick') { b.spin = (b.spin||0) + dt*18; if (b.life <= 0 || solidAt(b.x, b.y) || (boss && Math.hypot(boss.x - b.x, boss.y - b.y) < boss.r + 10)) { b.life = 0; if (boss && boss.k == 'loki' && Math.hypot(boss.x - b.x, boss.y - b.y) < 280) { boss.fetch = {x:b.x, y:b.y, t:3.4}; boss.talk = ['Loki: “Is that... a STICK?! Mine mine mine!”', 'Loki: “Don’t you DARE throw that again— ooh, STICK!”', 'Loki: “I can stop any time I want! ...STICK!”'][Math.floor(Math.random()*3)]; boss.talkT = 2.6; A.sfx('point'); } else sticks.push({x:b.x, y:b.y}); } continue; }
      if (b.kind == 'boomer' && !b.ret && b.life < .45) { b.ret = 1; b.hits = []; const a = Math.atan2(p.y - b.y, p.x - b.x); b.vx = Math.cos(a)*560; b.vy = Math.sin(a)*560; b.life = .9; }
      if (solidAt(b.x, b.y) && !(b.mine && b.ret)) { b.life = 0; splat(b.x, b.y, 5, b.col); continue; }
      if (b.mine) { for (const f of foes) { if (f.dead || b.hits.includes(f) || Math.hypot(f.x - b.x, f.y - 8 - b.y) > FOE[f.k].r + b.r) continue; b.hits.push(f);
          hurtFoe(f, b.dmg); if (b.kind == 'slush') f.slow = 3; if (b.kind == 'sparkle') { for (const f2 of foes) if (f2 !== f && !f2.dead && dist(f2, f) < 70) hurtFoe(f2, b.dmg*.5); splat(b.x, b.y, 12, '#ffe9a0'); }
          const ka = Math.atan2(b.vy, b.vx); f.kbx = Math.cos(ka)*120; f.kby = Math.sin(ka)*120; f.kb = .12; splat(b.x, b.y, 6); A.sfx('hit'); if (!b.pierce) { b.life = 0; break; } }
        if (b.life > 0 && boss && !b.hits.includes(boss) && Math.hypot(boss.x - b.x, boss.y - b.y) < boss.r + b.r) { b.hits.push(boss); hurtBoss(b.dmg * (1 + .1*X.PU('boss'))); splat(b.x, b.y, 7); A.sfx('hit'); if (!b.pierce) b.life = 0; } }
      else { if (p.fortT > 0 && Math.hypot(b.x - p.x, b.y - p.y) < 64) { b.life = 0; splat(b.x, b.y, 5); continue; }
        if (W.mau && mau.blockCd <= 0 && (Math.hypot(b.x - mau.x, b.y - mau.y) < 26 || (Math.hypot(b.x - p.x, b.y - p.y) < 44 && dist(mau, p) < 70) || mates.some(m => !m.ko && Math.hypot(b.x - m.x, b.y - m.y) < 40 && dist(mau, m) < 70))) { b.life = 0; mau.blockCd = 4.5; mau.st2 = 'block'; mau.stT = .5; addNum(mau.x, mau.y - 40, 'SHIELD BELLY!', '#2f5fd0'); splat(b.x, b.y, 8, '#F9BF01'); A.tone(180, .08, 'square', .05); continue; }
        if (Math.hypot(b.x - p.x, b.y - (p.y - 8)) < 13 + b.r) { b.life = 0; hurtMe(b.dmg); continue; }
        for (const m of mates) if (!m.ko && Math.hypot(b.x - m.x, b.y - (m.y - 8)) < 12 + b.r) { b.life = 0; m.hp -= b.dmg; splat(m.x, m.y - 8, 6); if (m.hp <= 0) { m.ko = 10; say('💫 ' + m.name + ' is knocked out! Stand next to them to help them up faster', 2.2); } break; } } }
    balls = balls.filter(b => b.life > 0);
    A.mood(() => ({danger:p.hp == 1, boss:!!boss}));
    cam.x = Math.max(0, Math.min(WORLD - VW, p.x - VW/2)); cam.y = Math.max(0, Math.min(WORLD - VH, p.y - VH/2 - 20)); };
  // ---------- drawing ----------
  const kid = (x, y, col, o = {}) => { g.save(); g.translate(x, y); if (o.hit) g.globalAlpha = .55; const bob = o.walk ? Math.sin(o.walk*14)*2 : 0;
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(0, 16, 13, 4, 0, 0, TAU); g.fill();
    g.fillStyle = '#14204a'; g.fillRect(-8, 6 + bob*.5, 6, 10); g.fillRect(2, 6 - bob*.5, 6, 10);
    g.fillStyle = col; rr(g, -11, -8, 22, 18, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-11, 1, 22, 3);
    const aa = o.throwT > 0 ? o.face : o.face + 1.2; g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(8, -4); g.lineTo(8 + Math.cos(aa)*12, -4 + Math.sin(aa)*12); g.stroke();
    if (o.charge > 0) { g.fillStyle = '#fff'; g.beginPath(); g.arc(8 + Math.cos(aa)*14, -4 + Math.sin(aa)*14, 4 + 5*Math.min(1, o.charge), 0, TAU); g.fill(); }
    g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(0, -16, 9, 0, TAU); g.fill();
    g.fillStyle = o.hat || col; g.beginPath(); g.arc(0, -19, 9.5, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -29, 3.5, 0, TAU); g.fill();
    g.fillStyle = '#14204a'; g.beginPath(); g.arc(-3, -15, 1.6, 0, TAU); g.arc(3, -15, 1.6, 0, TAU); g.fill(); g.restore(); };
  const cat = (x, y, o) => { const s = o.s || 1; g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(0, 17, 13, 4, 0, 0, TAU); g.fill();
    if (o.cape) { g.fillStyle = o.cape; g.beginPath(); g.moveTo(-10, -4); g.lineTo(10, -4); g.lineTo(16, 16); g.lineTo(-16, 16); g.fill(); g.fillStyle = '#fff'; for (let i = -12; i <= 12; i += 6) { g.beginPath(); g.arc(i, 15, 2, 0, TAU); g.fill(); } }
    g.strokeStyle = o.fur; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(8, 10); g.quadraticCurveTo(22, 6 + Math.sin(t*4)*4, 17, -6); g.stroke();
    g.fillStyle = o.fur; g.beginPath(); g.ellipse(0, 6, 11, 11, 0, 0, TAU); g.fill(); g.fillStyle = o.belly || '#fff'; g.beginPath(); g.ellipse(0, 9, 6, 7, 0, 0, TAU); g.fill();
    g.fillStyle = o.fur; g.beginPath(); g.moveTo(-11, -14); g.lineTo(-9, -29); g.lineTo(-1, -20); g.fill(); g.beginPath(); g.moveTo(11, -14); g.lineTo(9, -29); g.lineTo(1, -20); g.fill();
    g.fillStyle = '#ffb0c8'; g.beginPath(); g.moveTo(-9, -17); g.lineTo(-8.5, -25); g.lineTo(-4, -20); g.fill(); g.beginPath(); g.moveTo(9, -17); g.lineTo(8.5, -25); g.lineTo(4, -20); g.fill();
    g.fillStyle = o.fur; g.beginPath(); g.arc(0, -12, 11, 0, TAU); g.fill();
    if (o.stripe) { g.strokeStyle = o.stripe; g.lineWidth = 2; for (const sx of [-4, 0, 4]) { g.beginPath(); g.moveTo(sx, -23); g.lineTo(sx, -18); g.stroke(); } }
    g.fillStyle = '#7fe08a'; g.beginPath(); g.ellipse(-4.5, -13, 3, 3.5, 0, 0, TAU); g.ellipse(4.5, -13, 3, 3.5, 0, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.fillRect(-5.2, -16, 1.4, 6); g.fillRect(3.8, -16, 1.4, 6);
    g.fillStyle = '#ff7aa0'; g.beginPath(); g.moveTo(-2, -8); g.lineTo(2, -8); g.lineTo(0, -6); g.fill();
    g.strokeStyle = 'rgba(20,20,20,.5)'; g.lineWidth = 1; for (const sy of [-7, -5]) { g.beginPath(); g.moveTo(-4, sy); g.lineTo(-13, sy - 1); g.moveTo(4, sy); g.lineTo(13, sy - 1); g.stroke(); }
    if (o.crown) { g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(-9, -22); g.lineTo(-9, -32); g.lineTo(-4.5, -27); g.lineTo(0, -34); g.lineTo(4.5, -27); g.lineTo(9, -32); g.lineTo(9, -22); g.fill(); g.fillStyle = '#FF4539'; g.beginPath(); g.arc(0, -25, 2, 0, TAU); g.fill(); }
    if (o.helmet) { g.fillStyle = '#3f6fd8'; g.beginPath(); g.arc(0, -17, 10.5, Math.PI, 0); g.fill(); g.fillRect(-11, -18, 22, 3); g.fillStyle = '#FF4539'; g.beginPath(); g.ellipse(0, -30, 3, 6, 0, 0, TAU); g.fill();
      g.strokeStyle = '#8D5B1D'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(15, 14); g.lineTo(15, -26); g.stroke(); g.fillStyle = '#d0d8e0'; g.beginPath(); g.moveTo(15, -34); g.lineTo(11, -25); g.lineTo(19, -25); g.fill(); }
    g.restore(); };
  const dog = (x, y, o) => { const s = o.s || 1; g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha) g.globalAlpha = o.alpha;
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(0, 17, 14, 4, 0, 0, TAU); g.fill();
    if (o.robe) { g.fillStyle = o.robe; g.beginPath(); g.moveTo(-8, -4); g.lineTo(8, -4); g.lineTo(15, 17); g.lineTo(-15, 17); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); g.arc(-5, 8, 1.6, 0, TAU); g.arc(6, 12, 1.6, 0, TAU); g.arc(1, 2, 1.4, 0, TAU); g.fill(); }
    else { g.fillStyle = o.fur; g.beginPath(); g.ellipse(0, 6, 12, 11, 0, 0, TAU); g.fill(); if (o.armor) { g.fillStyle = '#8a8e94'; rr(g, -10, -2, 20, 14, 5); g.fill(); g.fillStyle = '#c04ae0'; g.beginPath(); g.arc(0, 5, 3, 0, TAU); g.fill(); } }
    g.strokeStyle = o.fur; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-9, 10); g.lineTo(-17, 2 + Math.sin(t*10)*3); g.stroke();
    g.fillStyle = o.fur; g.beginPath(); g.ellipse(0, -12, 12, 11, 0, 0, TAU); g.fill();
    g.fillStyle = o.ear || '#4a3020'; g.beginPath(); g.ellipse(-12, -10, 4, 9, .3, 0, TAU); g.ellipse(12, -10, 4, 9, -.3, 0, TAU); g.fill();
    g.fillStyle = o.snout || '#f2dcc0'; g.beginPath(); g.ellipse(0, -6, 7, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.ellipse(0, -9, 2.8, 2, 0, 0, TAU); g.fill();
    g.fillStyle = o.eyes || '#121313'; g.beginPath(); g.arc(-4.5, -15, 2, 0, TAU); g.arc(4.5, -15, 2, 0, TAU); g.fill();
    if (o.brows) { g.strokeStyle = '#121313'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-8, -20); g.lineTo(-2, -18); g.moveTo(8, -20); g.lineTo(2, -18); g.stroke(); }
    if (o.hat) { g.fillStyle = '#5a2a9a'; g.beginPath(); g.ellipse(0, -21, 15, 4, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-10, -22); g.quadraticCurveTo(-2, -40, 10, -50 + Math.sin(t*3)*2); g.lineTo(9, -22); g.fill(); g.fillStyle = '#F9BF01'; g.font = '8px ' + A.font; g.textAlign = 'center'; g.fillText('★', -2, -28); g.fillText('☾', 4, -36); }
    if (o.staff) { g.strokeStyle = '#6b4a2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(17, 16); g.lineTo(17, -26); g.stroke(); g.fillStyle = 'rgba(200,100,255,.35)'; g.beginPath(); g.arc(17, -30, 9 + Math.sin(t*6)*1.5, 0, TAU); g.fill(); g.fillStyle = '#e07aff'; g.beginPath(); g.arc(17, -30, 5, 0, TAU); g.fill(); }
    if (o.helmet) { g.fillStyle = '#6a7a8a'; g.beginPath(); g.arc(0, -17, 11, Math.PI, 0); g.fill(); g.fillStyle = '#c04ae0'; g.fillRect(-1.5, -30, 3, 8); }
    g.restore(); };
  const penguin = (x, y) => { g.save(); g.translate(x, y + Math.sin(t*2)*1); g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(0, 18, 13, 4, 0, 0, TAU); g.fill();
    g.fillStyle = '#ff9a3c'; g.beginPath(); g.ellipse(-5, 17, 5, 2.5, 0, 0, TAU); g.ellipse(5, 17, 5, 2.5, 0, 0, TAU); g.fill(); g.fillStyle = '#1c2230'; g.beginPath(); g.ellipse(0, 0, 13, 18, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 4, 9, 13, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(-4, -9, 2.6, 0, TAU); g.arc(4, -9, 2.6, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(-4, -9, 1.3, 0, TAU); g.arc(4, -9, 1.3, 0, TAU); g.fill();
    g.fillStyle = '#ff9a3c'; g.beginPath(); g.moveTo(-3, -5); g.lineTo(3, -5); g.lineTo(0, -1); g.fill(); g.fillStyle = '#FF4539'; g.fillRect(-11, -3, 22, 4); g.fillRect(6, -3, 4, 10);
    g.strokeStyle = '#8D5B1D'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(16, 18); g.lineTo(16, -10); g.arc(13, -10, 3, 0, Math.PI, true); g.stroke(); g.restore(); };
  const cage = (x, y) => { g.strokeStyle = '#3a3a4a'; g.lineWidth = 3; for (let i = -24; i <= 24; i += 8) { g.beginPath(); g.moveTo(x + i, y - 38); g.lineTo(x + i, y + 18); g.stroke(); } g.fillStyle = '#5a2a9a'; rr(g, x - 28, y - 42, 56, 8, 4); g.fill(); rr(g, x - 28, y + 16, 56, 6, 3); g.fill(); };
  const drawFoe = f => { const F = FOE[f.k], x = f.x, y = f.y; if (f.flash > 0) g.globalAlpha = .6;
    if (f.k == 'pup') dog(x, y, {s:.75, fur:'#8a5cf0', ear:'#5a3ab0', snout:'#c8b0ff', eyes:'#ffe066', brows:1});
    else if (f.k == 'hound') dog(x, y, {s:.95, fur:'#2a2040', ear:'#14101f', snout:'#4a3a6a', eyes:'#FF4539', brows:1});
    else if (f.k == 'clone') SC.loki(g, x, y, {s:1.15, alpha:.5, cast:1}, t);
    else if (f.k == 'shade') SC.shade(g, x, y, {}, t);
    else if (f.k == 'goon') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 16, 13, 4, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.strokeStyle = '#c8d8e8'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y + 4, 13, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(x, y - 14, 9, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#7a3ab0'; g.fillRect(x - 9, y - 7, 18, 4); g.fillStyle = '#121313'; g.beginPath(); g.arc(x - 3, y - 15, 1.6, 0, TAU); g.arc(x + 3, y - 15, 1.6, 0, TAU); g.fill(); g.strokeStyle = '#121313'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 6, y - 20); g.lineTo(x - 1, y - 18); g.moveTo(x + 6, y - 20); g.lineTo(x + 1, y - 18); g.stroke();
      g.fillStyle = '#ff8a3c'; g.beginPath(); g.moveTo(x, y - 13); g.lineTo(x + 7, y - 12); g.lineTo(x, y - 11); g.fill(); g.strokeStyle = '#6b4a2b'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 12, y + 2); g.lineTo(x - 22, y - 6); g.moveTo(x + 12, y + 2); g.lineTo(x + 22, y - 6); g.stroke(); }
    else if (f.k == 'bat') { const fl = Math.sin(f.flap)*6; g.fillStyle = '#3a7ab0'; g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x - 18, y - 12 - fl); g.lineTo(x - 10, y + 2); g.fill(); g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 18, y - 12 - fl); g.lineTo(x + 10, y + 2); g.fill(); g.fillStyle = '#5ab0e0'; g.beginPath(); g.arc(x, y - 4, 7, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 2.5, y - 5, 1.5, 0, TAU); g.arc(x + 2.5, y - 5, 1.5, 0, TAU); g.fill(); }
    else if (f.k == 'golem') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 20, 22, 6, 0, 0, TAU); g.fill(); g.fillStyle = '#bfe9ff'; rr(g, x - 20, y - 26, 40, 44, 8); g.fill(); g.strokeStyle = '#7fb8d8'; g.lineWidth = 2; g.stroke(); g.beginPath(); g.moveTo(x - 8, y - 20); g.lineTo(x - 2, y - 6); g.lineTo(x - 10, y + 8); g.stroke();
      g.fillStyle = '#64CDF5'; g.beginPath(); g.arc(x - 7, y - 14, 3, 0, TAU); g.arc(x + 7, y - 14, 3, 0, TAU); g.fill(); g.fillStyle = '#bfe9ff'; rr(g, x - 30, y - 16, 10, 26, 4); g.fill(); rr(g, x + 20, y - 16, 10, 26, 4); g.fill(); }
    else if (f.k == 'imp') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 14, 11, 3, 0, 0, TAU); g.fill(); g.fillStyle = '#9a3ac0'; g.beginPath(); g.moveTo(x - 6, y - 8); g.lineTo(x - 20, y - 18 + Math.sin(f.flap)*4); g.lineTo(x - 10, y); g.fill(); g.beginPath(); g.moveTo(x + 6, y - 8); g.lineTo(x + 20, y - 18 + Math.sin(f.flap)*4); g.lineTo(x + 10, y); g.fill();
      g.fillStyle = '#c04ae0'; g.beginPath(); g.arc(x, y - 4, 11, 0, TAU); g.fill(); g.fillStyle = '#5a2a9a'; g.beginPath(); g.moveTo(x - 8, y - 12); g.lineTo(x - 10, y - 22); g.lineTo(x - 3, y - 14); g.fill(); g.beginPath(); g.moveTo(x + 8, y - 12); g.lineTo(x + 10, y - 22); g.lineTo(x + 3, y - 14); g.fill();
      g.fillStyle = '#ffe066'; g.beginPath(); g.arc(x - 4, y - 5, 2.2, 0, TAU); g.arc(x + 4, y - 5, 2.2, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    if (f.max > 1 && f.hp < f.max) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 15, y + 22, 30, 4); g.fillStyle = '#FF4539'; g.fillRect(x - 15, y + 22, 30*Math.max(0, f.hp)/f.max, 4); }
    if (f.stun > 0) { g.font = '12px ' + A.font; g.textAlign = 'center'; g.fillText('💫', x, y - 30); } if (f.slow > 0) { g.strokeStyle = '#64CDF5'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 4, F.r + 6, 0, TAU); g.stroke(); } };
  const drawBoss = B => { const x = B.x, y = B.y; g.save(); if (B.flash > 0) g.globalAlpha = .6;
    if (B.k == 'grumble') { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + 34, 34, 9, 0, 0, TAU); g.fill(); g.fillStyle = '#6b4a2b'; rr(g, x - 14, y - 10, 28, 46, 6); g.fill();
      g.strokeStyle = '#6b4a2b'; g.lineWidth = 6; g.lineCap = 'round'; const sw = Math.sin(t*3)*6; g.beginPath(); g.moveTo(x - 12, y + 6); g.lineTo(x - 36, y - 6 + sw); g.moveTo(x + 12, y + 6); g.lineTo(x + 36, y - 6 - sw); g.stroke();
      for (const [ox, oy, r2] of [[0, -40, 30], [-22, -22, 22], [22, -22, 22]]) { g.fillStyle = '#2f6a3a'; g.beginPath(); g.arc(x + ox, y + oy, r2, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + ox, y + oy - r2*.5, r2*.6, Math.PI, 0); g.fill(); }
      g.fillStyle = B.ph >= 2 ? '#FF4539' : '#ffe066'; g.beginPath(); g.arc(x - 6, y + 4, 3.5, 0, TAU); g.arc(x + 6, y + 4, 3.5, 0, TAU); g.fill(); g.strokeStyle = '#3a2410'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y + 20, 6, Math.PI*1.15, Math.PI*1.85); g.stroke(); }
    else if (B.k == 'icefang') { if (B.st == 'wind') { g.strokeStyle = 'rgba(255,69,57,.5)'; g.lineWidth = 3; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(B.da)*300, y + Math.sin(B.da)*300); g.stroke(); g.setLineDash([]); }
      g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + 26, 32, 8, 0, 0, TAU); g.fill(); g.fillStyle = '#9a7a5a'; g.beginPath(); g.ellipse(x, y + 4, 32, 26, 0, 0, TAU); g.fill(); g.fillStyle = '#b8987a'; g.beginPath(); g.ellipse(x, y - 4, 16, 12, 0, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - 7, y + 2); g.lineTo(x - 5, y + 22); g.lineTo(x - 2, y + 2); g.fill(); g.beginPath(); g.moveTo(x + 7, y + 2); g.lineTo(x + 5, y + 22); g.lineTo(x + 2, y + 2); g.fill();
      g.fillStyle = '#121313'; g.beginPath(); g.arc(x - 8, y - 14, 2.5, 0, TAU); g.arc(x + 8, y - 14, 2.5, 0, TAU); g.fill(); g.fillStyle = '#1c1c24'; g.beginPath(); g.moveTo(x - 26, y - 18); g.quadraticCurveTo(x, y - 50, x + 26, y - 18); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - 28, 4, 0, TAU); g.fill(); }
    else if (B.k == 'crystal') { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + 32, 34, 8, 0, 0, TAU); g.fill();
      for (const [ox, oy, h2, col] of [[-22, 10, 40, '#9a7ad8'], [22, 10, 40, '#7a9ad8'], [0, 0, 64, '#c9a0ff'], [-12, -6, 44, '#b0c8ff'], [12, -6, 44, '#d8b0ff']]) { g.fillStyle = col; g.beginPath(); g.moveTo(x + ox - 11, y + oy + 24); g.lineTo(x + ox, y + oy + 24 - h2); g.lineTo(x + ox + 11, y + oy + 24); g.fill(); }
      g.fillStyle = B.ph >= 2 ? '#FF4539' : '#ffffff'; g.beginPath(); g.arc(x - 6, y - 2, 3.5, 0, TAU); g.arc(x + 6, y - 2, 3.5, 0, TAU); g.fill(); }
    else if (B.k == 'rufus') dog(x, y, {s:1.5, fur:'#b07a4a', ear:'#6b4a2b', armor:1, helmet:1, brows:1, eyes:B.ph >= 3 ? '#FF4539' : '#121313'});
    else if (B.k == 'loki') { if (B.ph < 4) { g.fillStyle = 'rgba(150,210,255,' + (.16 + .08*Math.sin(t*4)) + ')'; g.beginPath(); g.arc(x, y, 48, 0, TAU); g.fill(); } SC.loki(g, x, y, {s:1.6, ph:B.ph, cast:B.castT > 0, fetch:B.fetch && B.fetch.t > 0}, t); if (B.fetch && B.fetch.t > 0) { g.font = '900 16px ' + A.font; g.textAlign = 'center'; g.fillStyle = '#F9BF01'; g.fillText('🪵 STICK!!', x, y - 74); } }
    g.restore();
    if (B.talkT > 0 && B.talk) { g.font = '700 12px ' + A.font; const tw = Math.min(380, g.measureText(B.talk).width + 20), bx = Math.max(8, Math.min(VW - tw - 8, x - cam.x - tw/2)) + cam.x; g.fillStyle = 'rgba(255,255,255,.95)'; rr(g, bx, y - B.r - 70, tw, 28, 10); g.fill(); g.fillStyle = '#14204a'; g.textAlign = 'left'; wrapClip(B.talk, bx + 10, y - B.r - 51, tw - 20); } };
  const wrapClip = (s2, x, y, mw) => { let line = s2; while (g.measureText(line).width > mw && line.length > 4) line = line.slice(0, -2); if (line != s2) line = line.slice(0, -1) + '…'; g.fillText(line, x, y); };
  const tileCol = (v, x, y) => v == SNOW ? (regionAt(x, y) == 'castle' ? '#d8dbe9' : '#eef5fc') : v == PATH ? '#e6dcc8' : v == ICE || v == HOLE ? '#c4e8fa' : v == DEEP ? '#ffffff' : v == WALL ? '#2e2048' : v == FLOOR || v == GATE ? '#5d4c7d' : v == CAVE || (v == ROCK && regionAt(x, y) == 'caves') ? '#5a6a80' : v == CAMP ? '#f3e6cf' : regionAt(x, y) == 'castle' ? '#d8dbe9' : '#eef5fc';
  const drawTiles = () => { const x0 = Math.floor(cam.x/TS), y0 = Math.floor(cam.y/TS), x1 = Math.min(N - 1, x0 + Math.ceil(VW/TS) + 1), y1 = Math.min(N - 1, y0 + Math.ceil(VH/TS) + 1);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const v = tileAt(tx, ty), sx = tx*TS, sy = ty*TS; g.fillStyle = tileCol(v, tx, ty); g.fillRect(sx, sy, TS + 1, TS + 1);
      if (low()) continue; const h = hash(tx, ty, 5);
      if (v == SNOW && h < .25) { g.fillStyle = 'rgba(150,180,215,.25)'; g.beginPath(); g.ellipse(sx + h*160 % 40 + 4, sy + 30, 8, 3, 0, 0, TAU); g.fill(); }
      else if (v == DEEP) { g.fillStyle = 'rgba(170,200,230,.35)'; g.beginPath(); g.arc(sx + 14, sy + 30, 10, Math.PI, 0); g.arc(sx + 34, sy + 24, 9, Math.PI, 0); g.fill(); }
      else if (v == ICE) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx + 8 + h*10, sy + 12); g.lineTo(sx + 26 + h*10, sy + 30); g.stroke(); }
      else if (v == PATH && h < .4) { g.fillStyle = 'rgba(140,110,80,.25)'; g.beginPath(); g.arc(sx + 10 + h*60 % 30, sy + 14 + h*90 % 24, 2, 0, TAU); g.fill(); }
      else if (v == CAVE && h < .12) { g.fillStyle = 'rgba(200,160,255,.5)'; g.beginPath(); g.moveTo(sx + 20, sy + 36); g.lineTo(sx + 24, sy + 22); g.lineTo(sx + 28, sy + 36); g.fill(); } }
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const v = tileAt(tx, ty), sx = tx*TS, sy = ty*TS, h = hash(tx, ty, 7);
      if (v == TREE) { const ox = (h - .5)*10; g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(sx + 24 + ox, sy + 42, 16, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#6b4a2b'; g.fillRect(sx + 21 + ox, sy + 32, 6, 12);
        for (const [w2, yy] of [[22, 34], [18, 22], [13, 10]]) { g.fillStyle = regionAt(tx, ty) == 'forest' ? '#24583a' : '#2f6a3a'; g.beginPath(); g.moveTo(sx + 24 + ox - w2, sy + yy); g.lineTo(sx + 24 + ox, sy + yy - 20); g.lineTo(sx + 24 + ox + w2, sy + yy); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(sx + 24 + ox - w2*.45, sy + yy - 11); g.lineTo(sx + 24 + ox, sy + yy - 20); g.lineTo(sx + 24 + ox + w2*.45, sy + yy - 11); g.fill(); } }
      else if (v == ROCK) { const cv = regionAt(tx, ty) == 'caves'; g.fillStyle = cv ? '#3a4658' : '#8a8e94'; rr(g, sx + 3, sy + 6, TS - 6, TS - 8, 12); g.fill(); g.fillStyle = cv ? '#4a5870' : '#a6aab0'; rr(g, sx + 8, sy + 10, TS - 20, 10, 6); g.fill();
        if (!cv) { g.fillStyle = '#fff'; rr(g, sx + 5, sy + 4, TS - 10, 10, 6); g.fill(); } else if (h < .25) { g.fillStyle = '#c9a0ff'; g.beginPath(); g.moveTo(sx + 16, sy + 30); g.lineTo(sx + 22, sy + 10); g.lineTo(sx + 28, sy + 30); g.fill(); } }
      else if (v == HOLE) { g.fillStyle = '#1f4f7a'; g.beginPath(); g.ellipse(sx + 24, sy + 24, 20, 14, 0, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }
      else if (v == WALL) { g.fillStyle = '#3e2c62'; g.fillRect(sx, sy, TS, TS); g.strokeStyle = '#2a1c44'; g.lineWidth = 2; for (let yy = 0; yy < TS; yy += 12) { g.beginPath(); g.moveTo(sx, sy + yy); g.lineTo(sx + TS, sy + yy); g.stroke(); for (let xx = (yy/12) % 2 ? 0 : 12; xx < TS; xx += 24) { g.beginPath(); g.moveTo(sx + xx, sy + yy); g.lineTo(sx + xx, sy + yy + 12); g.stroke(); } } g.fillStyle = '#fff'; g.fillRect(sx, sy, TS, 4); }
      else if (v == GATE) { if (gateOpen()) { g.fillStyle = '#3e2c62'; g.fillRect(sx, sy, 6, TS); g.fillRect(sx + TS - 6, sy, 6, TS); } else { g.fillStyle = '#2a1c44'; g.fillRect(sx, sy, TS, TS); g.strokeStyle = '#8a8e94'; g.lineWidth = 3; for (let xx = 6; xx < TS; xx += 10) { g.beginPath(); g.moveTo(sx + xx, sy); g.lineTo(sx + xx, sy + TS); g.stroke(); }
        g.fillStyle = 'rgba(200,120,255,' + (.6 + .3*Math.sin(t*3 + tx)) + ')'; g.beginPath(); g.arc(sx + 24, sy + 24, 8, 0, TAU); g.fill(); } }
      else if (v == DEAD) { g.strokeStyle = '#3a2a2a'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx + 24, sy + 44); g.lineTo(sx + 24, sy + 10); g.moveTo(sx + 24, sy + 24); g.lineTo(sx + 12, sy + 14); g.moveTo(sx + 24, sy + 18); g.lineTo(sx + 36, sy + 8); g.stroke(); } } };
  const onScreen = (x, y, m = 80) => x > cam.x - m && x < cam.x + VW + m && y > cam.y - m && y < cam.y + VH + m;
  const SC = A.snowCast;
  const portrait = (who, x, y, mood) => { if (who == 'pip') penguin(x, y); else if (who == 'mau') SC.mau(g, x, y + 2, {s:.9, st:'stand', mood:mood || 'happy'}, t); else if (who == 'loki') SC.loki(g, x, y + 4, {s:.85, mood:mood || 'smug', cast:1}, t);
    else if (SC.LOOK[who]) SC.spirit(g, who, x, y, {mood:mood || 'peaceful'}, t); else if (who.slice(-1) == 'G' && SC.LOOK[who.slice(0, -1)]) SC.spirit(g, who.slice(0, -1), x, y + 4, {ghost:1, mood:mood || 'peaceful', jitter: who == 'chaoG' ? 1 : 0}, t); };
  const draw = () => { layout(); g.fillStyle = '#eef5fc'; g.fillRect(0, 0, VW, 720);
    g.save(); g.beginPath(); g.rect(0, 0, VW, VH); g.clip(); g.translate(-cam.x, -cam.y); drawTiles();
    // camp: tent, campfire, Old Pip, the Emperor's ice throne
    if (onScreen(FIRE.x, FIRE.y, 260)) { g.fillStyle = '#c84a2a'; g.beginPath(); g.moveTo(TENT.x - 44, TENT.y + 20); g.lineTo(TENT.x, TENT.y - 34); g.lineTo(TENT.x + 44, TENT.y + 20); g.fill(); g.fillStyle = '#5a1a0a'; g.beginPath(); g.moveTo(TENT.x - 10, TENT.y + 20); g.lineTo(TENT.x, TENT.y - 6); g.lineTo(TENT.x + 10, TENT.y + 20); g.fill();
      g.fillStyle = '#6b4a2b'; g.fillRect(FIRE.x - 18, FIRE.y + 6, 36, 7); for (let k = 0; k < 3; k++) { const fl = Math.sin(t*12 + k)*3; g.fillStyle = ['#FF4539', '#ff8a3c', '#F9BF01'][k]; g.beginPath(); g.moveTo(FIRE.x - 12 + k*4, FIRE.y + 7); g.lineTo(FIRE.x - 4 + k*4, FIRE.y - 18 + k*5 + fl); g.lineTo(FIRE.x + 4 + k*4 - k*2, FIRE.y + 7); g.fill(); }
      g.strokeStyle = 'rgba(255,138,60,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(FIRE.x, FIRE.y, 110, 0, TAU); g.stroke();
      g.fillStyle = '#bfe9ff'; rr(g, THRONE.x - 22, THRONE.y - 40, 44, 52, 8); g.fill(); g.fillStyle = '#e8f8ff'; rr(g, THRONE.x - 16, THRONE.y - 4, 32, 14, 4); g.fill(); g.fillStyle = '#64CDF5'; g.beginPath(); g.moveTo(THRONE.x - 22, THRONE.y - 40); g.lineTo(THRONE.x - 14, THRONE.y - 54); g.lineTo(THRONE.x - 6, THRONE.y - 40); g.lineTo(THRONE.x, THRONE.y - 58); g.lineTo(THRONE.x + 6, THRONE.y - 40); g.lineTo(THRONE.x + 14, THRONE.y - 54); g.lineTo(THRONE.x + 22, THRONE.y - 40); g.fill();
      if (W.bau && !(W.party && W.party.bau)) SC.spirit(g, 'bau', THRONE.x, THRONE.y - 8, {mood:'happy'}, t);
      penguin(PIP.x, PIP.y); if (!W.met || (Math.sin(t*3) > 0 && !W.bau && !W.loki && runesN() == 0 && !W.mau)) { g.fillStyle = '#F9BF01'; g.font = '900 22px ' + A.font; g.textAlign = 'center'; g.fillText('!', PIP.x, PIP.y - 30 + Math.sin(t*5)*3); } }
    // waystones and chests
    for (const k in WAYS) { const w2 = px(WAYS[k]); if (!onScreen(w2.x, w2.y)) continue; const on = W.ways[k]; g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(w2.x, w2.y + 16, 16, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#8a8e94'; g.beginPath(); g.moveTo(w2.x - 12, w2.y + 16); g.lineTo(w2.x - 9, w2.y - 26); g.lineTo(w2.x, w2.y - 34); g.lineTo(w2.x + 9, w2.y - 26); g.lineTo(w2.x + 12, w2.y + 16); g.fill();
      g.fillStyle = on ? 'rgba(100,205,245,' + (.7 + .3*Math.sin(t*3)) + ')' : '#5a6a80'; g.beginPath(); g.arc(w2.x, w2.y - 12, 6, 0, TAU); g.fill(); if (on && !low()) { g.fillStyle = 'rgba(100,205,245,.18)'; g.beginPath(); g.arc(w2.x, w2.y - 12, 18, 0, TAU); g.fill(); } }
    for (const ch of chests) { if (!onScreen(ch.x, ch.y)) continue; const op = W.chests[ch.id]; g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(ch.x, ch.y + 12, 16, 4, 0, 0, TAU); g.fill(); g.fillStyle = '#8D5B1D'; rr(g, ch.x - 15, ch.y - 6, 30, 18, 3); g.fill();
      g.fillStyle = op ? '#5a3a1a' : '#a8702d'; if (op) { rr(g, ch.x - 15, ch.y - 20, 30, 8, 3); g.fill(); } else { rr(g, ch.x - 16, ch.y - 14, 32, 10, 5); g.fill(); g.fillStyle = '#F9BF01'; g.fillRect(ch.x - 2, ch.y - 8, 4, 7); if (!low()) { g.fillStyle = 'rgba(249,191,1,' + (.25 + .2*Math.sin(t*4 + ch.id)) + ')'; g.beginPath(); g.arc(ch.x, ch.y - 4, 22, 0, TAU); g.fill(); } } }
    if (onScreen(LAIR.loki.x, LAIR.loki.y, 200)) { const T0 = {x:LAIR.loki.x, y:LAIR.loki.y - 70}; g.fillStyle = '#7a3ab0'; rr(g, T0.x - 26, T0.y - 30, 52, 50, 8); g.fill(); g.fillStyle = '#F9BF01'; g.fillRect(T0.x - 26, T0.y - 30, 52, 5); }
    // cages: Mau Mau (until Rufus is beaten) and Bau Bau (until you free him)
    if (!W.mau && onScreen(MAUCAGE.x, MAUCAGE.y)) { SC.mau(g, MAUCAGE.x, MAUCAGE.y, {st:'sleep'}, t); cage(MAUCAGE.x, MAUCAGE.y); }
    if (!W.bau && onScreen(BAUCAGE.x, BAUCAGE.y)) { SC.spirit(g, 'bau', BAUCAGE.x, BAUCAGE.y, {mood:'sad'}, t); cage(BAUCAGE.x, BAUCAGE.y); if (W.loki) { g.fillStyle = '#F9BF01'; g.font = '900 20px ' + A.font; g.textAlign = 'center'; g.fillText('!', BAUCAGE.x, BAUCAGE.y - 52 + Math.sin(t*5)*3); } }
    for (const d2 of drops) { g.font = '20px ' + A.font; g.textAlign = 'center'; g.globalAlpha = d2.life < 3 ? .5 + .5*Math.sin(t*20) : 1; g.fillText(d2.k == 'fish' ? '🐟' : '☕', d2.x, d2.y + 6); g.globalAlpha = 1; }
    for (const sk of sticks) if (onScreen(sk.x, sk.y)) { g.save(); g.translate(sk.x, sk.y); g.rotate(.4); g.fillStyle = '#8D5B1D'; rr(g, -12, -2.5, 24, 5, 2.5); g.fill(); g.fillRect(2, -7, 2.5, 6); g.restore(); if (!low()) { g.strokeStyle = 'rgba(249,191,1,' + (.4 + .3*Math.sin(t*5)) + ')'; g.lineWidth = 2; g.beginPath(); g.arc(sk.x, sk.y, 16, 0, TAU); g.stroke(); } }
    if (W.mau && mau.sniff && !W.snacks[mau.sniff.id] && onScreen(mau.sniff.x, mau.sniff.y)) { const sn = mau.sniff; g.font = '18px ' + A.font; g.textAlign = 'center'; g.fillText(sn.e, sn.x, sn.y + 6); g.fillStyle = '#F9BF01'; g.font = '900 18px ' + A.font; g.fillText('!', sn.x, sn.y - 18 + Math.sin(t*6)*3); }
    if (tornado) SC.tornado(g, tornado.x, tornado.y, tornado.r, t, low());
    // characters, back to front (name tags are placed afterwards so they never overlap)
    const tags = [];
    const ents = foes.filter(f => onScreen(f.x, f.y)).map(f => ({y:f.y, d:() => drawFoe(f)}));
    if (boss) ents.push({y:boss.y, d:() => drawBoss(boss)}); if (W.mau) ents.push({y:mau.y, d:() => { SC.mau(g, mau.x, mau.y, {st:mauState(), walk:mau.walk}, t); if (mau.say && mau.sayT > 0) bubble(mau.x, mau.y - 52, mau.say); }}); if (W.mau) tags.push({x:mau.x, y:mau.y + 32, t:'Royal Guard Mau Mau', s:'Mau Mau', col:'#2f5fd0'});
    for (const m of mates) if (onScreen(m.x, m.y)) ents.push({y:m.y, d:() => { if (m.ko > 0) { g.fillStyle = RCOL[m.role]; rr(g, m.x - 16, m.y + 4, 32, 12, 6); g.fill(); g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(m.x + 18, m.y + 8, 7, 0, TAU); g.fill(); g.font = '12px ' + A.font; g.textAlign = 'center'; g.fillText('💫', m.x, m.y - 6); }
      else kid(m.x, m.y, RCOL[m.role], {walk:m.walk, face:m.face, throwT:m.throwT}); tags.push({x:m.x, y:m.y + 30, t:m.name + ' ' + RE[m.role] + ' ' + m.lv, s:m.name, col:RCOL[m.role]}); }});
    if (dead <= 0) ents.push({y:p.y - 1, d:() => { g.fillStyle = 'rgba(213,243,103,' + (.28 + .12*Math.sin(t*4)) + ')'; g.beginPath(); g.ellipse(p.x, p.y + 16, 24, 8, 0, 0, TAU); g.fill(); g.strokeStyle = '#D5F367'; g.lineWidth = 2; g.stroke(); }});
    if (dead <= 0 && !(p.inv > 0 && p.inv < 2 && Math.sin(t*25) > 0)) ents.push({y:p.y, d:() => { kid(p.x, p.y, X.CL().col, {hat:X.CL().hat, walk:Math.hypot(p.vx, p.vy) > 30 ? p.walk : 0, face:p.face, throwT:p.throwT, charge:charge ? charge.t : 0, hit:p.hitT > 0});
      if (p.shieldT > 0) { g.strokeStyle = 'rgba(255,233,120,' + (.5 + .4*Math.sin(t*12)) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(p.x, p.y - 6, 32, 0, TAU); g.stroke(); }
      if (p.fortT > 0) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 7; g.beginPath(); g.arc(p.x, p.y - 6, 60, 0, TAU); g.stroke(); g.strokeStyle = '#9ec4e8'; g.lineWidth = 2; g.stroke(); }
      if (p.eye > 0) { g.fillStyle = '#2f6a3a'; g.font = '700 11px ' + A.font; g.textAlign = 'center'; g.fillText('🔭 Eagle Eye', p.x, p.y - 44); } }});
    ents.sort((a, b) => a.y - b.y).forEach(e2 => e2.d());
    // the YOU arrow, always on top
    if (dead <= 0) { const yy = p.y - 50 + Math.sin(t*4)*2; g.fillStyle = '#D5F367'; g.strokeStyle = '#14204a'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x - 7, yy - 6); g.lineTo(p.x + 7, yy - 6); g.lineTo(p.x, yy + 2); g.closePath(); g.fill(); g.stroke(); g.font = '900 10px ' + A.font; g.textAlign = 'center'; g.lineWidth = 3; g.strokeText('YOU', p.x, yy - 10); g.fillStyle = '#14204a'; g.fillText('YOU', p.x, yy - 10); }
    // name tags: stack neatly, shrink when crowded, never overlap (a tag that can't fit is left out)
    { const placed = [{x:p.x - 22, y:p.y - 66, w:44, h:24}], hit = r2 => placed.some(q => r2.x < q.x + q.w && r2.x + r2.w > q.x && r2.y < q.y + q.h && r2.y + r2.h > q.y);
      tags.sort((a, b) => a.y - b.y).forEach(tg => { const crowd = tags.filter(o => o !== tg && Math.hypot(o.x - tg.x, o.y - tg.y) < 90).length, fs = crowd >= 2 ? 8 : 9, txt = crowd >= 3 ? tg.s : tg.t; g.font = '700 ' + fs + 'px ' + A.font; const w2 = g.measureText(txt).width + 10, h2 = fs + 5;
        for (const dy of [0, 12, -62, 24, -74]) { const r2 = {x:tg.x - w2/2, y:tg.y - h2 + 3 + dy, w:w2, h:h2}; if (hit(r2)) continue; placed.push(r2); g.fillStyle = 'rgba(255,255,255,.82)'; rr(g, r2.x, r2.y, w2, h2, 5); g.fill(); g.fillStyle = tg.col || '#14204a'; g.fillRect(r2.x + 2, r2.y + h2 - 2, w2 - 4, 1.5); g.fillStyle = '#14204a'; g.textAlign = 'center'; g.fillText(txt, tg.x, r2.y + h2 - 4); break; } }); }
    for (const b of balls) { if (b.kind == 'stick') { g.save(); g.translate(b.x, b.y); g.rotate(b.spin||0); g.fillStyle = '#8D5B1D'; rr(g, -12, -2.5, 24, 5, 2.5); g.fill(); g.fillRect(2, -7, 2.5, 6); g.restore(); continue; } g.fillStyle = b.col; g.strokeStyle = b.mine ? '#a0b8d0' : b.hex ? '#7a2aa0' : '#d08080'; g.lineWidth = 1.5; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); g.stroke(); if (b.hex && !low()) { g.fillStyle = 'rgba(200,100,255,.25)'; g.beginPath(); g.arc(b.x, b.y, b.r + 4, 0, TAU); g.fill(); } }
    for (const f2 of fx) { g.fillStyle = f2.col; g.globalAlpha = Math.min(1, f2.t*2); g.beginPath(); g.arc(f2.x, f2.y, f2.r, 0, TAU); g.fill(); } g.globalAlpha = 1;
    for (const n of nums) { g.globalAlpha = Math.min(1, n.t*2); g.fillStyle = n.col; g.font = '800 14px ' + A.font; g.textAlign = 'center'; g.fillText(n.txt, n.x, n.y); } g.globalAlpha = 1;
    // aim line while packing a snowball
    if (charge && dead <= 0) { const wa = toWorld(aim); g.strokeStyle = 'rgba(20,32,74,.35)'; g.setLineDash([5, 7]); g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, p.y - 10); g.lineTo(wa.x, wa.y); g.stroke(); g.setLineDash([]); }
    // the thing you can use right now
    const nt = !dlg && nearThing(); if (nt) { g.fillStyle = 'rgba(20,32,74,.85)'; g.font = '800 12px ' + A.font; g.textAlign = 'center'; const lb = '✋ ' + nt.n + ' (E)'; const tw = g.measureText(lb).width + 16; rr(g, nt.x - tw/2, nt.y - 64, tw, 22, 11); g.fill(); g.fillStyle = '#fff'; g.fillText(lb, nt.x, nt.y - 49); }
    g.restore();
    // darker caves and castle, with light around you
    const rg = regAt(p.x, p.y); if ((rg == 'caves' || (rg == 'castle' && tileAt(Math.floor(p.x/TS), Math.floor(p.y/TS)) == FLOOR)) && !low()) { const gr = g.createRadialGradient(p.x - cam.x, p.y - cam.y, 90, p.x - cam.x, p.y - cam.y, 420); gr.addColorStop(0, 'rgba(10,15,40,0)'); gr.addColorStop(1, 'rgba(10,15,40,.5)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); }
    if (!low()) { g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 40; i++) { const sx = (i*137 + t*(14 + i % 5*4) - cam.x*.3) % VW, sy = (i*71 + t*(30 + i % 7*6) - cam.y*.3) % VH; g.fillRect((sx + VW) % VW, (sy + VH) % VH, 2, 2); } }
    // quest arrow
    const G0 = goal(); if (G0) { const sx = G0.x - cam.x, sy = G0.y - cam.y; if (sx < 20 || sx > VW - 20 || sy < 130 || sy > VH - 20) { const a = Math.atan2(sy - (p.y - cam.y), sx - (p.x - cam.x)), ax = Math.max(30, Math.min(VW - 30, p.x - cam.x + Math.cos(a)*230)), ay = Math.max(150, Math.min(VH - 30, p.y - cam.y + Math.sin(a)*230));
        g.save(); g.translate(ax, ay); g.rotate(a); g.fillStyle = 'rgba(249,191,1,.95)'; g.strokeStyle = '#14204a'; g.lineWidth = 2; g.beginPath(); g.moveTo(18, 0); g.lineTo(-10, -12); g.lineTo(-4, 0); g.lineTo(-10, 12); g.closePath(); g.fill(); g.stroke(); g.restore(); }
      else { g.fillStyle = '#F9BF01'; g.font = '20px ' + A.font; g.textAlign = 'center'; g.fillText('⭐', sx, sy - 70 + Math.sin(t*4)*4); } }
    // ----- HUD: small, see-through, tap to fold it away -----
    const TY = topY(), hp = W.hudMin ? null : 1;
    if (W.hudMin) { const lb = '♥ ' + p.hp + '/' + p.max + '  ⚪ ' + p.ammo + '  ▸'; g.font = '800 12px ' + A.font; const tw = g.measureText(lb).width + 18; g.fillStyle = 'rgba(20,32,74,.55)'; rr(g, 8, TY, tw, 24, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(lb, 17, TY + 16); hudR = {x:8, y:TY, w:tw, h:24}; }
    else { const hw = Math.min(330, VW*.5); g.fillStyle = 'rgba(20,32,74,.55)'; rr(g, 8, TY, hw, 56, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '800 12px ' + A.font; wrapClip('📍 ' + REG[rg].n + '  ♥ ' + p.hp + '/' + p.max + '  ⚪ ' + p.ammo + '/' + X.maxAmmo(), 16, TY + 17, hw - 34);
      g.font = '700 10px ' + A.font; g.fillStyle = '#D5F367'; wrapClip('🎯 ' + (G0 ? G0.n : 'Kingdom saved! Explore, find every chest, rematch Loki'), 16, TY + 33, hw - 18);
      g.fillStyle = '#cfe3f5'; wrapClip('❄ ' + A.fmt(PERM.bank) + ' · 🔷 ' + PERM.frost + ' · 🌙 ' + runesN() + '/3' + (W.mau ? ' · 🐟 ' + (W.treats||0) : '') + ' · ' + Math.floor(explored*100/fog.length) + '% explored', 16, TY + 48, hw - 18);
      g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '800 11px ' + A.font; g.textAlign = 'right'; g.fillText('▾', 8 + hw - 8, TY + 14); hudR = {x:8, y:TY, w:hw, h:56}; }
    const MX = VW - 116; g.fillStyle = 'rgba(20,32,74,.6)'; rr(g, MX, TY, 108, 120, 10); g.fill(); g.imageSmoothingEnabled = false; g.drawImage(mini, MX + 4, TY + 4, 100, 100); g.imageSmoothingEnabled = true; g.fillStyle = '#FF4539'; g.beginPath(); g.arc(MX + 4 + p.x/TS, TY + 4 + p.y/TS, 3, 0, TAU); g.fill();
    if (G0) { g.fillStyle = '#F9BF01'; g.beginPath(); g.arc(MX + 4 + G0.x/TS, TY + 4 + G0.y/TS, 2.5, 0, TAU); g.fill(); } g.fillStyle = '#D5F367'; rr(g, MX + 22, TY + 106, 64, 12, 6); g.fill(); g.fillStyle = '#14204a'; g.font = '800 9px ' + A.font; g.textAlign = 'center'; g.fillText('M = MAP', MX + 54, TY + 115); mmR = {x:MX, y:TY, w:108, h:120};
    if (boss) { const bw = Math.min(440, VW - 280), bx = VW/2 - bw/2, by = TY + 70; g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, bx, by, bw, 14, 7); g.fill(); const np = boss.phases || 3; g.fillStyle = boss.ph >= np ? '#8a0000' : boss.ph >= 2 ? '#ff6a3c' : '#FF4539'; rr(g, bx, by, bw*Math.max(0, boss.hp)/boss.max, 14, 7); g.fill(); g.fillStyle = '#fff'; for (let i = 1; i < np; i++) g.fillRect(bx + bw*i/np, by, 2, 14);
      g.font = '800 12px ' + A.font; g.textAlign = 'center'; const bl = boss.n + ' · phase ' + boss.ph + '/' + np + (boss.phn ? ' · ' + boss.phn : ''); const tw = g.measureText(bl).width + 16; g.fillStyle = 'rgba(255,255,255,.85)'; rr(g, VW/2 - tw/2, by + 17, tw, 18, 9); g.fill(); g.fillStyle = '#14204a'; g.fillText(bl, VW/2, by + 30); }
    if (msgT > 0 && !dlg) { g.font = '700 13px ' + A.font; const tw = Math.min(VW - 30, g.measureText(msg).width + 30); g.fillStyle = 'rgba(20,32,74,.88)'; rr(g, VW/2 - tw/2, VH - 84, tw, 34, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; wrapClip(msg, VW/2, VH - 62, VW - 50); }
    if (dead > 0) { g.fillStyle = 'rgba(230,240,255,' + Math.min(.9, (1.8 - dead)*.8) + ')'; g.fillRect(0, 0, VW, VH); }
    // dialogue box
    if (dlg) { const [who, pic, txt, mood] = dlg.lines[dlg.i], DW = Math.min(820, VW - 20), DX = VW/2 - DW/2, DY = VH - 150; g.fillStyle = 'rgba(20,32,74,.95)'; rr(g, DX, DY, DW, 140, 16); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; rr(g, DX + 10, DY + 12, 84, 116, 12); g.fill(); g.save(); g.translate(DX + 52, DY + 86); g.scale(1.7, 1.7); portrait(pic, 0, 0, mood); g.restore();
      g.fillStyle = '#D5F367'; g.font = '800 15px ' + A.font; g.textAlign = 'left'; g.fillText(who, DX + 106, DY + 30); g.fillStyle = '#fff'; g.font = '600 14px ' + A.font;
      let line = '', ly = DY + 54; txt.split(' ').forEach(wd => { if (g.measureText(line + wd).width > DW - 130) { g.fillText(line, DX + 106, ly); line = ''; ly += 19; } line += wd + ' '; }); g.fillText(line, DX + 106, ly);
      g.fillStyle = '#9fe8ff'; g.font = '700 11px ' + A.font; g.textAlign = 'right'; g.fillText((dlg.i + 1) + '/' + dlg.lines.length + ' · ' + (touchUI ? 'tap' : 'click, Space or E') + ' ▶', DX + DW - 12, DY + 130); }
    // controls: big buttons on touch screens; on computers a small row of key chips (you can click them too)
    const nt2 = nearThing(); btnR = [];
    if (touchUI) { g.fillStyle = '#14204a'; g.fillRect(0, BAR, VW, 720 - BAR); const BW = VW/BTN.length;
      BTN.forEach((b, i) => { const on = (i < 4 && pad(['l', 'u', 'd', 'r'][i])) || (i == 4 && p.ab <= 0) || (i == 5 && nt2) || (i == 6 && W.mau && (W.treats||0) > 0), x = i*BW; g.fillStyle = on ? '#D5F367' : 'rgba(255,255,255,.16)'; rr(g, x + 4, BAR + 12, BW - 8, 76, 14); g.fill(); g.fillStyle = on ? '#14204a' : '#fff'; g.textAlign = 'center';
        g.font = '800 ' + (i < 4 ? 24 : 18) + 'px ' + A.font; g.fillText(i == 4 && p.ab > 0 ? Math.ceil(p.ab) + 's' : b, x + BW/2, BAR + (i < 4 ? 58 : 50)); if (i >= 4) { g.font = '700 10px ' + A.font; g.fillText(i == 4 ? X.CL().ab : i == 5 ? (nt2 ? nt2.n : 'Use') : i == 6 ? 'Feed (' + (W.treats||0) + ')' : 'Map', x + BW/2, BAR + 72); } }); }
    else { const chips = [['⭐ ' + (p.ab > 0 ? Math.ceil(p.ab) + 's' : X.CL().ab), 'Space', 'ab', p.ab <= 0], ['✋ ' + (nt2 ? nt2.n : 'Use'), 'E', 'use', !!nt2], ...(W.mau ? [['🐟 Feed Mau Mau (' + (W.treats||0) + ')', 'G', 'feed', (W.treats||0) > 0]] : []), ['🗺 Map', 'M', 'map', false]];
      g.font = '800 11px ' + A.font; let tot = 0; const ws = chips.map(([a, k]) => { const w2 = g.measureText(a).width + g.measureText(k).width + 30; tot += w2 + 6; return w2; }); let x = VW/2 - tot/2; const y = VH - 30;
      chips.forEach(([a, k, id, on], i) => { const w2 = ws[i]; g.fillStyle = on ? 'rgba(213,243,103,.92)' : 'rgba(20,32,74,.6)'; rr(g, x, y, w2, 24, 12); g.fill(); g.fillStyle = on ? '#14204a' : '#fff'; g.textAlign = 'left'; g.fillText(a, x + 10, y + 16); const kw = g.measureText(k).width + 8; g.fillStyle = on ? '#14204a' : 'rgba(255,255,255,.85)'; rr(g, x + w2 - kw - 6, y + 4, kw, 16, 5); g.fill(); g.fillStyle = on ? '#D5F367' : '#14204a'; g.textAlign = 'center'; g.fillText(k, x + w2 - 6 - kw/2, y + 16); btnR.push({x, y, w:w2, h:24, id}); x += w2 + 6; }); }
    // map
    if (mapOpen) { const MS = Math.min((VW - 40)/N, (720 - 160)/N), MXo = VW/2 - N*MS/2; MAPR.x = MXo; MAPR.y = 70; MAPR.s = MS; g.fillStyle = 'rgba(10,16,36,.97)'; g.fillRect(0, 0, VW, 720); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 22px ' + A.font; g.fillText(travel ? '✨ Fast travel: tap a waystone' : '🗺 The Snow Kingdom', VW/2, TY + 32); g.font = '600 11px ' + A.font; g.fillStyle = '#9fe8ff'; g.fillText(travel ? 'Waystones you have touched glow blue' : (touchUI ? '◀▲▼▶ move · tap to throw (hold = bigger) · ⭐ ability · ✋ use · 🐟 feed Mau Mau' : 'WASD/arrows move · click to throw (hold = bigger) · F throws · Space ability · E use · G feed Mau Mau · M map'), VW/2, TY + 50);
      g.imageSmoothingEnabled = false; g.drawImage(mini, MAPR.x, MAPR.y, N*MAPR.s, N*MAPR.s); g.imageSmoothingEnabled = true;
      const ms = (L2) => ({x:MAPR.x + (L2.x + .5)*MAPR.s, y:MAPR.y + (L2.y + .5)*MAPR.s}), seen = L2 => fog[Math.floor(L2.y/2)*FB + Math.floor(L2.x/2)];
      g.font = '18px ' + A.font; [['camp', '🏕'], ['forest', W.runes.forest ? '🌙' : '🌲'], ['lake', W.runes.lake ? '🌙' : '🧊'], ['caves', W.runes.caves ? '🌙' : '💎'], ['pass', W.mau ? '🐱' : '⛓'], ['castle', W.bau ? '👑' : '🏰']].forEach(([k, e2]) => { if (!seen(LM[k])) return; const q = ms(LM[k]); g.fillText(e2, q.x, q.y + 6); });
      for (const k in WAYS) { if (!W.ways[k]) continue; const q = ms(WAYS[k]); g.fillStyle = travel ? '#64CDF5' : 'rgba(100,205,245,.8)'; g.beginPath(); g.arc(q.x, q.y, travel ? 10 : 5, 0, TAU); g.fill(); if (travel) { g.fillStyle = '#fff'; g.font = '700 11px ' + A.font; g.fillText(WAYS[k].n, q.x, q.y - 14); } }
      const pq = {x:MAPR.x + p.x/TS*MAPR.s, y:MAPR.y + p.y/TS*MAPR.s}; g.fillStyle = '#FF4539'; g.beginPath(); g.arc(pq.x, pq.y, 6, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      if (G0) { g.fillStyle = '#F9BF01'; g.font = '18px ' + A.font; g.fillText('⭐', MAPR.x + G0.x/TS*MAPR.s, MAPR.y + G0.y/TS*MAPR.s + 6); }
      g.fillStyle = '#ffffff'; rr(g, VW/2 - 270, 650, 250, 48, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, VW/2 + 20, 650, 250, 48, 14); g.fill(); g.fillStyle = '#14204a'; g.font = '800 16px ' + A.font; g.fillText('✕ Close map · M', VW/2 - 145, 680); g.fillStyle = '#fff'; g.fillText('⬅ Snowball menu', VW/2 + 145, 680); } };
  const close = () => { save(); unlayout(); };
  reveal(); lastReg = regAt(p.x, p.y);
  if (!W.met) say('❄ Welcome to the Snow Kingdom! Talk to Old Pip, the penguin by the campfire', 4); else say('❄ Welcome back to the Snow Kingdom!', 2.4);
  return {frame:dt => { update(dt); draw(); }, down, move, up, key, close, admin:{reveal:() => { fog.fill(1); for (let i = 0; i < fog.length; i++) paintBlock(i); explored = fog.length; save(); }, quest:() => { W.met = 1; W.runes = {forest:1, lake:1, caves:1}; W.mau = 1; W.down.grumble = W.down.icefang = W.down.crystal = W.down.rufus = 1; save(); say('Admin: runes + Mau Mau given, gate open'); }, tp:k => { const w2 = px(WAYS[k] || WAYS.camp); p.x = w2.x; p.y = w2.y + 40; foes = []; boss = null; }},
    dbg:() => ({p, W, mates, foes, boss, balls, gateOpen, things, spawnBoss, hurtBoss, chests, LAIR, use, update, dlg:() => dlg, nextLine})}; };
})();
