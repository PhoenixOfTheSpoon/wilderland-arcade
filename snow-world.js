// Wilderland Arcade · SNOW KINGDOM — Snowball Showdown's open-world quest.
// One huge snowy map (100 × 100 tiles) that never resets: where you are, the map you've uncovered, chests, waystones,
// runes and rescued friends are saved in your Snowball progress. Get snowed under and you wake up at Camp Cocoa with
// everything you found. Quest: free Royal Guard Mau Mau, win 3 Moon Runes, storm the Shadow Castle, defeat the Evil
// Sorcerer Loki (a dog) and rescue Lord Emperor Bau Bau (a cat).
(function(){
const A = window.Arcade, TAU = Math.PI*2;
const rr = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const N = 280, N1 = 140, N0 = 100, TS = 48, WORLD = N*TS;   // the old 100×100 kingdom (top-left) + lands east (Spirits of the Snow) and south (N1 = 140), and the Wider Kingdom (snow-expanse.js) out to 280×280
let VW = 600, VH = 620, BAR = 620;   // VW grows to fill a wide screen; VH/BAR: the touch buttons only show on touch screens
const SNOW = 0, PATH = 1, TREE = 2, ROCK = 3, ICE = 4, DEEP = 5, HOLE = 6, WALL = 7, FLOOR = 8, GATE = 9, CAVE = 10, CAMP = 11, DEAD = 12, VEIL = 13, WATER = 14, HOUSE = 15;
const SOLID = [0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1];
const MINI = ['#eef5fc', '#e3d6bd', '#2f6a3a', '#8a8e94', '#aee6ff', '#ffffff', '#2a5a8a', '#3a2a5a', '#6a5a8a', '#c04ae0', '#5a6a80', '#ffd08a', '#5a4a4a', '#7ad8ff', '#3a6ab0', '#b0703a'];
// landmarks (tile coordinates)
const LM = {camp:{x:50, y:86}, forest:{x:16, y:62}, lake:{x:80, y:67}, caves:{x:16, y:18}, pass:{x:48, y:22}, castle:{x:83, y:13}, gate:{x:83, y:30}};
const WAYS = {camp:{x:55, y:84, n:'Camp Cocoa'}, forest:{x:22, y:66, n:'Frostpine Forest'}, lake:{x:64, y:64, n:'Glimmer Lake'}, caves:{x:22, y:24, n:'Crystal Caves'}, pass:{x:44, y:31, n:'Howling Pass'}, castle:{x:83, y:35, n:'Shadow Castle Gate'},
  village:{x:30, y:110, n:'Frostpine Village'}, aurora:{x:62, y:116, n:'Aurora Fields'}, coast:{x:40, y:126, n:'Shipwreck Coast'}, ruins:{x:84, y:116, n:'Ice Giant Ruins'}, yeti:{x:112, y:112, n:'Yeti Mountains'},
  hollow:{x:106, y:82, n:'Spirit Hollow', spirit:1}, oldroad:{x:108, y:50, n:'The Old Road', spirit:1}, shrine:{x:118, y:38, n:'The Driveway Shrine', spirit:1}, hall:{x:127, y:74, n:'The Hall of Paws', spirit:1}, peak:{x:130, y:22, n:'Storm Peak', spirit:1}};
const regionAt = (x, y) => { if (x >= N + 40) return (A.sagaReg && A.sagaReg(x, y)) || 'raid'; if (x >= N) return 'raid'; if (x >= N1 || y >= N1) return A.snowExp ? A.snowExp.regionAt(x, y) : 'meadow'; if (y >= N0) { if (x >= N0) return 'yeti'; if (y >= 127) return 'coast'; if (x < 42) return 'village'; if (x >= 74) return 'ruins'; return 'aurora'; }
  if (x >= N0) { if (y < 22) return 'peak'; if (y < 42) return 'shrine'; if (y < 56) return 'oldroad'; if (y >= 56 && y < 78 && x >= 116) return 'hall'; return 'hollow'; }
  if (Math.hypot(x - 50, y - 86) < 8) return 'camp'; if (x >= 70 && y <= 34) return 'castle'; if (x < 34 && y < 40) return 'caves'; if (x < 36) return 'forest'; if (x > 62 && y > 44) return 'lake'; if (y < 44) return 'pass'; return 'meadow'; };
const REG = {camp:{n:'Camp Cocoa', tier:0, pool:[]}, meadow:{n:'Snowy Meadows', tier:1, pool:['pup', 'pup', 'goon']}, forest:{n:'Frostpine Forest', tier:2, pool:['pup', 'goon', 'bat']},
  lake:{n:'Glimmer Lake', tier:2, pool:['goon', 'bat', 'golem']}, caves:{n:'Crystal Caves', tier:3, pool:['bat', 'golem', 'goon', 'imp']}, pass:{n:'Howling Pass', tier:3, pool:['golem', 'hound', 'goon']},
  castle:{n:'Loki’s Shadow Lands', tier:4, pool:['hound', 'imp', 'golem', 'imp']},
  village:{n:'Frostpine Village', tier:1, pool:['pup', 'goon'], mood:'calm'}, aurora:{n:'Aurora Fields', tier:3, pool:['bat', 'imp', 'goon']}, coast:{n:'Frozen Shipwreck Coast', tier:3, pool:['goon', 'golem', 'bat']},
  ruins:{n:'Ice Giant Ruins', tier:4, pool:['golem', 'golem', 'hound']}, yeti:{n:'Yeti Mountains', tier:5, pool:['golem', 'hound', 'yeti']},
  hollow:{n:'Spirit Hollow', tier:4, pool:['wisp', 'wisp', 'stormling'], haunt:1}, oldroad:{n:'The Old Road', tier:4, pool:['wisp'], haunt:1, quiet:1}, shrine:{n:'The Driveway Shrine', tier:4, pool:['wisp', 'stormling'], haunt:1},
  hall:{n:'The Hall of Paws', tier:0, pool:[], safe:1}, raid:{n:'Raid Dungeon', tier:5, pool:[], safe:1, haunt:1}, peak:{n:'Chao Chao’s Storm Peak', tier:5, pool:['stormling', 'wisp', 'stormling'], haunt:2}};
if (A.snowExp) { Object.assign(REG, A.snowExp.REG); Object.assign(WAYS, A.snowExp.WAYS); }
const FOE = {
  pup:{n:'Hex Pup', hp:2, sp:125, melee:1, r:13, pts:30},
  goon:{n:'Snow Goon', hp:3, sp:60, shoot:2.2, r:15, pts:40},
  bat:{n:'Frost Bat', hp:1, sp:150, melee:1, fly:1, r:12, pts:35},
  golem:{n:'Ice Golem', hp:8, sp:42, shoot:3.2, big:1, r:22, pts:90},
  hound:{n:'Shadow Hound', hp:5, sp:150, melee:2, r:16, pts:70},
  imp:{n:'Hex Imp', hp:4, sp:80, shoot:2.4, hex:1, r:14, pts:70},
  clone:{n:'Loki Clone', hp:3, sp:0, shoot:2.2, hex:1, r:20, pts:50, clone:1},
  shade:{n:'Shadow Minion', hp:3, sp:140, melee:1, r:14, pts:40},
  wisp:{n:'Spirit Wisp', hp:2, sp:110, shoot:2.6, fly:1, r:12, pts:45, slow:1}, stormling:{n:'Stormling', hp:4, sp:120, melee:1, r:15, pts:55}, yeti:{n:'Little Yeti', hp:6, sp:95, melee:2, r:18, pts:80},
  decoy:{n:'Fake-out', hp:1, sp:0, r:18, pts:0, clone:1, decoy:1}, echo:{n:'Shadow Copy', hp:3, sp:70, shoot:2.4, r:16, pts:40, clone:1}};
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
A._snowT = {REG, FOE, BOSS, SOLID, MINI, hash, noise, regionAt, N, TS, T:{SNOW, PATH, TREE, ROCK, ICE, DEEP, HOLE, WALL, FLOOR, GATE, CAVE, CAMP, DEAD, VEIL, WATER, HOUSE}};
// the ORIGINAL 100×100 kingdom, generated exactly as before (so every saved chest and explored spot stays put)
const genOld = () => { const N = N0; const M = new Uint8Array(N*N), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < N && y < N) M[y*N + x] = v; }, get = (x, y) => M[y*N + x];
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
  return {M, chests}; };


const LM2 = {village:{x:28, y:114}, aurora:{x:62, y:120}, coast:{x:30, y:133}, ruins:{x:88, y:122}, yeti:{x:120, y:122}, hollow:{x:114, y:86}, shrine:{x:121, y:31}, oldroad:{x:118, y:49}, hall:{x:127, y:64}, peak:{x:124, y:10}};
const genMap140 = () => { const N = N1; const old = genOld(), M = new Uint8Array(N*N), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < N && y < N) M[y*N + x] = v; }, get = (x, y) => M[y*N + x];
  for (let y = 0; y < N0; y++) for (let x = 0; x < N0; x++) M[y*N + x] = old.M[y*N0 + x];
  // new lands
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (x < N0 && y < N0) continue; const r = regionAt(x, y), n1 = noise(x, y, 6, 3), n2 = noise(x, y, 3, 4), h = hash(x, y, 11); let v = SNOW;
    if (r == 'hollow') v = (n1 > .5 && h < .55) || h < .06 ? TREE : n2 > .82 ? DEEP : SNOW;
    else if (r == 'shrine') v = h < .05 ? TREE : h < .07 ? ROCK : SNOW;
    else if (r == 'oldroad') v = h < .035 ? DEAD : h < .05 ? ROCK : n1 > .76 ? DEEP : SNOW;
    else if (r == 'hall') v = h < .03 ? TREE : SNOW;
    else if (r == 'peak') v = n1 > .56 || (n2 > .8 && h < .5) ? ROCK : n2 > .5 ? DEEP : SNOW;
    else if (r == 'village') v = h < .04 ? TREE : SNOW;
    else if (r == 'aurora') v = h < .025 ? TREE : n1 > .72 ? DEEP : SNOW;
    else if (r == 'coast') v = y > 133 ? WATER : y > 130 ? (h < .5 ? ICE : WATER) : h < .04 ? ROCK : SNOW;
    else if (r == 'ruins') v = n1 > .66 ? ROCK : h < .05 ? ROCK : SNOW;
    else if (r == 'yeti') v = n1 > .5 || h < .06 ? ROCK : n2 > .6 ? DEEP : SNOW;
    set(x, y, v); }
  // the old east and south edges used to be walls: give them back to the land around them
  for (let i = 2; i < N0 - 2; i++) for (const [x, y] of [[N0 - 1, i], [N0 - 2, i], [i, N0 - 1], [i, N0 - 2]]) { const r = regionAt(x, y); set(x, y, r == 'forest' ? TREE : r == 'castle' ? (y <= 30 ? get(x - 1, y) : SNOW) : r == 'caves' ? CAVE : SNOW); }
  const carve = (ax, ay, bx, by, wd) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); for (let i = 0; i <= L*3; i++) { const q = i/(L*3), wob = Math.sin(q*8 + ax*.7)*2.4*Math.sin(q*Math.PI), px = ax + dx*q - dy/L*wob, py = ay + dy*q + dx/L*wob;
      for (let oy = -wd; oy <= wd; oy++) for (let ox = -wd; ox <= wd; ox++) { const tx = Math.round(px + ox), ty = Math.round(py + oy); if (tx < 2 || ty < 2 || tx > N - 3 || ty > N - 3 || Math.hypot(ox, oy) > wd + .3) continue; const v = get(tx, ty);
        if (v == HOLE || v == WATER) set(tx, ty, ICE); else if (v == ICE || v == CAMP || v == FLOOR || v == WALL || v == GATE || v == VEIL || v == HOUSE) continue; else set(tx, ty, regionAt(tx, ty) == 'caves' ? CAVE : PATH); } } };
  const clear = (cx, cy, rad, v) => { for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (Math.hypot(x - cx, y - cy) <= rad && x > 1 && y > 1 && x < N - 2 && y < N - 2) set(x, y, v); };
  const box = (x0, y0, x1, y1, door) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, x == x0 || x == x1 || y == y0 || y == y1 ? WALL : FLOOR); if (door) door.forEach(([x, y]) => set(x, y, FLOOR)); };
  const house = (x, y) => { for (let yy = y; yy < y + 2; yy++) for (let xx = x; xx < x + 3; xx++) set(xx, yy, HOUSE); };
  // the spirit veil between the old kingdom and the eastern spirit lands, and a ridge between them and the Yeti Mountains
  for (let y = 2; y < N0; y++) { set(N0, y, VEIL); set(N0 + 1, y, VEIL); } for (let x = N0; x < N - 2; x++) { set(x, N0, ROCK); set(x, N0 + 1, ROCK); }
  // roads: camp → the new south lands, the lake → Spirit Hollow and on through the spirit lands
  carve(50, 90, 30, 112, 1); carve(50, 90, 62, 118, 1); carve(62, 118, 86, 120, 1); carve(86, 120, 116, 120, 1); carve(40, 112, 34, 126, 1); carve(62, 118, 40, 126, 0);
  carve(84, 70, 106, 82, 1); carve(106, 82, 116, 86, 1); carve(116, 86, 124, 72, 1); carve(110, 84, 108, 50, 1); carve(108, 50, 121, 42, 1); carve(121, 42, 129, 36, 1); carve(129, 36, 130, 21, 1); carve(130, 21, 124, 12, 1);
  // The Old Road: a long, quiet road east to west
  for (let x = N0 + 2; x < N - 3; x++) for (let y = 47; y <= 50; y++) set(x, y, PATH);
  // Frostpine Village houses, the shipwreck, the ice giant's ruins
  [[22, 106], [27, 106], [33, 107], [20, 112], [34, 112], [24, 118], [31, 118]].forEach(([x, y]) => house(x, y)); clear(28, 114, 2, PATH);
  box(24, 129, 36, 133, [[30, 133], [24, 131]]);
  for (let y = 112; y <= 132; y += 5) for (let x = 78; x <= 96; x += 5) if (hash(x, y, 4) < .7) { set(x, y, ROCK); set(x, y + 1, ROCK); }
  clear(120, 122, 6, SNOW); clear(88, 122, 4, SNOW); clear(62, 120, 4, SNOW);
  // Spirit Hollow grove, the Driveway Shrine (walled courtyard, door opened by three lanterns), the Hall of Paws, Storm Peak summit
  clear(114, 86, 6, SNOW); box(116, 25, 126, 33, []); for (let x = 120; x <= 122; x++) set(x, 33, GATE); for (let y = 34; y <= 40; y++) for (let x = 119; x <= 123; x++) set(x, y, PATH);
  box(120, 56, 134, 70, [[126, 70], [127, 70], [128, 70]]); clear(124, 10, 7, SNOW); clear(118, 49, 3, PATH);
  for (const k in WAYS) clear(WAYS[k].x, WAYS[k].y, 1, PATH);
  for (let i = 0; i < N; i++) for (const [x, y] of [[i, 0], [i, 1], [0, i], [1, i], [i, N - 1], [i, N - 2], [N - 1, i], [N - 2, i]]) if (x >= N0 || y >= N0 || x < 2 || y < 2) set(x, y, regionAt(x, y) == 'coast' ? WATER : regionAt(x, y) == 'village' ? TREE : ROCK);
  // the original 40 chests, plus 30 more in the new lands
  const chests = old.chests.slice(); let sd = 7; const rnd = () => (sd = (sd*16807) % 2147483647) / 2147483647;
  for (let tries = 0; chests.length < 70 && tries < 8000; tries++) { const x = 3 + Math.floor(rnd()*(N - 6)), y = 3 + Math.floor(rnd()*(N - 6)), v = get(x, y); if (x < N0 && y < N0) continue; const r = regionAt(x, y);
    if (SOLID[v] || v == HOLE || v == WATER || REG[r].safe || Object.values(LM2).some(L => Math.hypot(L.x - x, L.y - y) < 6) || chests.some(C => Math.hypot(C.tx - x, C.ty - y) < 6)) continue;
    chests.push({id:chests.length, tx:x, ty:y, x:(x + .5)*TS, y:(y + .5)*TS, tier:Math.max(1, REG[r].tier)}); }
  // the castle around Camp Cocoa: walls, a gate in the middle of each side and wherever a path reaches the wall
  { const X0 = 38, X1 = 62, Y0 = 76, Y1 = 96, at = (x, y) => M[y*N + x], put = (x, y, v) => { M[y*N + x] = v; }, gates = [];
    for (let y = Y0 + 1; y < Y1; y++) for (let x = X0 + 1; x < X1; x++) if (at(x, y) != HOUSE) put(x, y, CAMP);
    const runs = (cells, fixed) => { let run = []; const out = []; for (const c of [...cells, null]) { if (c && c.hit) run.push(c); else if (run.length) { const m = run[Math.floor(run.length/2)]; if (Math.abs(m.k - fixed) > 4) out.push(m.p); run = []; } } return out; };   // one 3-wide gate per path that reaches the wall
    const hz = [], vt = []; for (const [y, oy] of [[Y0, -1], [Y1, 1]]) { gates.push(...runs([...Array(X1 - X0 - 1)].map((_, i) => ({k:X0 + 1 + i, p:[X0 + 1 + i, y], hit:at(X0 + 1 + i, y + oy) == PATH})), 50)); }
    for (const [x, ox] of [[X0, -1], [X1, 1]]) { gates.push(...runs([...Array(Y1 - Y0 - 1)].map((_, i) => ({k:Y0 + 1 + i, p:[x, Y0 + 1 + i], hit:at(x + ox, Y0 + 1 + i) == PATH})), 86)); }
    for (let x = X0; x <= X1; x++) { put(x, Y0, WALL); put(x, Y1, WALL); } for (let y = Y0; y <= Y1; y++) { put(X0, y, WALL); put(X1, y, WALL); }
    gates.push([50, Y0], [50, Y1], [X0, 86], [X1, 86]);
    for (const [x, y] of gates) for (const d of [-1, 0, 1]) { const gx = y == Y0 || y == Y1 ? x + d : x, gy = y == Y0 || y == Y1 ? y : y + d; if (gx > X0 && gx < X1 || gy > Y0 && gy < Y1) put(gx, gy, CAMP); }
    for (const [x, y, dx, dy] of [[50, Y0, 0, -1], [50, Y1, 0, 1], [X0, 86, -1, 0], [X1, 86, 1, 0]]) for (let k = 1; k <= 4; k++) for (const d of [-1, 0, 1]) { const tx = x + dx*k + (dy ? d : 0), ty = y + dy*k + (dx ? d : 0); if (SOLID[at(tx, ty)] || at(tx, ty) == SNOW) put(tx, ty, PATH); } }
  // every chest can be reached from camp: if rocks or trees box one in, open a path to it
  { const seen = new Uint8Array(N*N), ok = v => v == GATE || v == VEIL || !SOLID[v], q = [[50, 88]]; seen[88*N + 50] = 1;
    const fill = () => { while (q.length) { const [x, y] = q.pop(); for (const [a, b] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + a, ny = y + b; if (nx < 0 || ny < 0 || nx >= N || ny >= N || seen[ny*N + nx] || !ok(M[ny*N + nx])) continue; seen[ny*N + nx] = 1; q.push([nx, ny]); } } }; fill();
    chests.forEach(c => { if (seen[c.ty*N + c.tx]) return; const prev = new Int32Array(N*N).fill(-1), bq = [c.ty*N + c.tx]; prev[bq[0]] = bq[0]; let hit = -1;
      for (let h = 0; h < bq.length && hit < 0; h++) { const i = bq[h], x = i % N, y = (i - x)/N; for (const [a, b] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + a, ny = y + b, j = ny*N + nx; if (nx < 1 || ny < 1 || nx >= N - 1 || ny >= N - 1 || prev[j] >= 0 || M[j] == HOUSE || M[j] == WALL) continue; prev[j] = i; if (seen[j]) { hit = j; break; } bq.push(j); } }
      for (let i = hit; i >= 0 && prev[i] != i; i = prev[i]) { if (SOLID[M[i]] && M[i] != GATE && M[i] != VEIL) M[i] = SNOW; } M[c.ty*N + c.tx] = M[c.ty*N + c.tx] || SNOW; q.push([c.tx, c.ty]); seen[c.ty*N + c.tx] = 1; fill(); }); }
  return {M, chests}; };
const genMap = () => { if (MAPC) return MAPC; const o140 = genMap140(), M = new Uint8Array(N*N), chests = o140.chests.slice(), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < N && y < N) M[y*N + x] = v; }, get = (x, y) => M[y*N + x];
  for (let y = 0; y < N1; y++) for (let x = 0; x < N1; x++) M[y*N + x] = o140.M[y*N1 + x];
  const carve = (ax, ay, bx, by, wd) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); for (let i = 0; i <= L*3; i++) { const q = i/(L*3), wob = Math.sin(q*8 + ax*.7)*2.4*Math.sin(q*Math.PI), px = ax + dx*q - dy/L*wob, py = ay + dy*q + dx/L*wob;
      for (let oy = -wd; oy <= wd; oy++) for (let ox = -wd; ox <= wd; ox++) { const tx = Math.round(px + ox), ty = Math.round(py + oy); if (tx < 2 || ty < 2 || tx > N - 3 || ty > N - 3 || Math.hypot(ox, oy) > wd + .3) continue; const v = get(tx, ty);
        if (v == HOLE || v == WATER) set(tx, ty, ICE); else if (v == ICE || v == CAMP || v == FLOOR || v == WALL || v == GATE || v == VEIL || v == HOUSE) continue; else set(tx, ty, PATH); } } };
  const clear = (cx, cy, rad, v) => { for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (Math.hypot(x - cx, y - cy) <= rad && x > 1 && y > 1 && x < N - 2 && y < N - 2) set(x, y, v); };
  const box = (x0, y0, x1, y1, door) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, x == x0 || x == x1 || y == y0 || y == y1 ? WALL : FLOOR); if (door) door.forEach(([x, y]) => set(x, y, FLOOR)); };
  const house = (x, y) => { for (let yy = y; yy < y + 2; yy++) for (let xx = x; xx < x + 3; xx++) set(xx, yy, HOUSE); };
  if (A.snowExp) A.snowExp.gen({M, T:{SNOW, PATH, TREE, ROCK, ICE, DEEP, HOLE, WALL, FLOOR, CAVE, DEAD, WATER, HOUSE}, set, get, noise, carve, clear, house, box});
  // 60 more chests in the Wider Kingdom (the old 70 keep their ids and places)
  let sd = 1337; const rnd = () => (sd = (sd*16807) % 2147483647) / 2147483647, LMX = A.snowExp ? [...A.snowExp.NOTES, ...A.snowExp.VIEWS, ...Object.values(A.snowExp.WAYS), ...Object.values(A.snowExp.VIL)] : [];
  for (let tries = 0; chests.length < 130 && tries < 12000; tries++) { const x = 3 + Math.floor(rnd()*(N - 6)), y = 3 + Math.floor(rnd()*(N - 6)), v = get(x, y); if (x < N1 && y < N1) continue; const r = regionAt(x, y);
    if (SOLID[v] || v == HOLE || v == WATER || !REG[r] || REG[r].safe || LMX.some(L => Math.hypot(L.x - x, L.y - y) < 5) || chests.some(C => Math.hypot(C.tx - x, C.ty - y) < 7)) continue;
    chests.push({id:chests.length, tx:x, ty:y, x:(x + .5)*TS, y:(y + .5)*TS, tier:Math.max(1, REG[r].tier)}); }
  // everything new can be reached from camp: open a path to any boxed-in chest, waystone or landmark
  { const seen = new Uint8Array(N*N), ok = v => v == GATE || v == VEIL || !SOLID[v], q = [[50, 88]]; seen[88*N + 50] = 1;
    const fill = () => { while (q.length) { const [x, y] = q.pop(); for (const [a, b] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + a, ny = y + b; if (nx < 0 || ny < 0 || nx >= N || ny >= N || seen[ny*N + nx] || !ok(M[ny*N + nx])) continue; seen[ny*N + nx] = 1; q.push([nx, ny]); } } }; fill();
    const targets = [...chests.filter(c => c.id >= o140.chests.length).map(c => [c.tx, c.ty]), ...LMX.map(L => [L.x, L.y])];
    for (const [tx0, ty0] of targets) { if (seen[ty0*N + tx0]) continue; const prev = new Int32Array(N*N).fill(-1), bq = [ty0*N + tx0]; prev[bq[0]] = bq[0]; let hit = -1;
      for (let h = 0; h < bq.length && hit < 0; h++) { const i = bq[h], x = i % N, y = (i - x)/N; for (const [a, b] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + a, ny = y + b, j = ny*N + nx; if (nx < 2 || ny < 2 || nx >= N - 2 || ny >= N - 2 || prev[j] >= 0 || M[j] == HOUSE || M[j] == WALL || (nx < N1 && ny < N1)) continue; prev[j] = i; if (seen[j]) { hit = j; break; } bq.push(j); } }
      for (let i = hit; i >= 0 && prev[i] != i; i = prev[i]) { if (SOLID[M[i]] || M[i] == HOLE) M[i] = M[i] == WATER ? ICE : SNOW; } if (SOLID[M[ty0*N + tx0]]) M[ty0*N + tx0] = SNOW; q.push([tx0, ty0]); seen[ty0*N + tx0] = 1; fill(); } }
  MAPC = {M, chests}; return MAPC; };
A._snowMap = () => genMap();   // tests: compare the map
A.snowWorld = function(X) {
  const {host, api, c, K, PERM} = X, g = c.getContext('2d'), {M, chests} = genMap();
  const W = PERM.ow = Object.assign({v:1, x:0, y:0, met:0, runes:{}, mau:0, loki:0, bau:0, down:{}, chests:{}, ways:{camp:1}, fog:'', kills:0, deaths:0}, PERM.ow || {});
  ['runes', 'down', 'chests', 'ways'].forEach(k => { W[k] = W[k] || {}; }); W.ways.camp = 1;
  // leaving while inside a raid dungeon saves you back at the Raids board (raids restart from floor 1, nothing is lost)
  const save = () => { if (SG) SG.save(); const inWing = p.x >= N*TS; W.x = Math.round(inWing ? 44.5*TS : p.x); W.y = Math.round(inWing ? 92*TS : p.y); W.fog = fogStr(); X.savePerm(); };
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
  let SG = null; const inRealm = () => !!(SG && SG.cur && SG.cur()); const RMOD = k => { const m = SG && SG.raidMods ? SG.raidMods() : (raid ? raid.mods : null); return m ? m.find(q => q[k]) : null; }, rOn = () => !!(raid || (SG && SG.raidOn && SG.raidOn()));
  const tileAt = (tx, ty) => tx < 0 || ty < 0 || ty >= N ? ROCK : tx >= N ? (tx < N + 40 ? RM[ty*40 + tx - N] : SG ? SG.tile(tx, ty) : ROCK) : M[ty*N + tx];
  const runesN = () => ['forest', 'lake', 'caves'].filter(k => W.runes[k]).length;
  const gateOpen = () => runesN() >= 3 && !!W.mau;
  const spiritsOpen = () => (W.sp|0) >= 1;
  const solidAt = (x, y) => { const tx = Math.floor(x/TS), ty = Math.floor(y/TS), v = tileAt(tx, ty); return v == 16 ? !(raid && raid.open >= ((ty % 28) >= 18 ? 2 : 1)) : v == GATE ? (regionAt(tx, ty) == 'shrine' ? !((W.sp|0) >= 3 || (W.lan|0) >= 3) : !gateOpen()) : v == VEIL ? !spiritsOpen() : !!SOLID[v] || v == HOLE; };
  const overGap = (x, y) => { const T2 = SG && SG.T; if (!T2) return false; const v = tileAt(Math.floor(x/TS), Math.floor(y/TS)); return v == T2.CHASM || v == T2.CLIFF; };   // snowballs fly over gaps and cliffs
  const blocked = (x, y, r) => solidAt(x - r, y - r) || solidAt(x + r, y - r) || solidAt(x - r, y + r) || solidAt(x + r, y + r);
  const regAt = (x, y) => regionAt(Math.floor(x/TS), Math.floor(y/TS));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const low = () => !!A.lowFx;
  // ---------- fog of war: the map fills in as you explore (2×2-tile blocks, saved) ----------
  const FB = N/2, fog = new Uint8Array(FB*FB); { const s2 = W.fog || '', oldFB = W.fogV == 3 ? FB : W.fogV == 2 ? 70 : 50; for (let i = 0; i < s2.length; i++) { const v = parseInt(s2[i], 16) || 0; for (let b = 0; b < 4; b++) if (v & (1 << b)) { const j = i*4 + b, bx = j % oldFB, by = Math.floor(j/oldFB); if (by < FB) fog[by*FB + bx] = 1; } } W.fogV = 3; }
  const fogStr = () => { let s2 = ''; for (let i = 0; i < fog.length; i += 4) s2 += (fog[i] | fog[i + 1] << 1 | fog[i + 2] << 2 | fog[i + 3] << 3).toString(16); return s2.replace(/0+$/, ''); };
  const mini = document.createElement('canvas'); mini.width = N; mini.height = N; const mg = mini.getContext('2d');
  const paintBlock = i => { const bx = (i % FB)*2, by = Math.floor(i/FB)*2; for (let y = by; y < by + 2; y++) for (let x = bx; x < bx + 2; x++) { const v = tileAt(x, y); mg.fillStyle = regionAt(x, y) == 'castle' && v == SNOW ? '#cfd2e2' : MINI[v]; mg.fillRect(x, y, 1, 1); } };
  mg.fillStyle = '#1a2440'; mg.fillRect(0, 0, N, N); for (let i = 0; i < fog.length; i++) if (fog[i]) paintBlock(i);
  let explored = fog.reduce((a, b) => a + b, 0);
  const reveal = () => { const bx = Math.floor(p.x/TS/2), by = Math.floor(p.y/TS/2), R0 = 4; let ch = 0; for (let y = by - R0; y <= by + R0; y++) for (let x = bx - R0; x <= bx + R0; x++) { if (x < 0 || y < 0 || x >= FB || y >= FB || Math.hypot(x - bx, y - by) > R0 + .3) continue; const i = y*FB + x; if (!fog[i]) { fog[i] = 1; paintBlock(i); ch++; } }
    if (ch) { const before = Math.floor(explored*100/fog.length); explored += ch; const pct = Math.floor(explored*100/fog.length); if (pct > before) X.stat('snowExplore', pct, 'max'); } };
  // ---------- you ----------
  const mx0 = X.maxHp();
  if (W.x >= N*TS) { W.x = Math.round(44.5*TS); W.y = Math.round(92*TS); }
  if (W.x && W.x < N*TS && SOLID[M[Math.floor(W.y/TS)*N + Math.floor(W.x/TS)]]) { W.x = 0; W.y = 0; }   // saved inside a spot that is now a castle wall   // saves made inside a raid before this fix
  const p = {x:W.x || CAMPX.x, y:W.y || CAMPX.y, hp:mx0, max:mx0, inv:2, ab:0, shieldT:0, eye:0, fortT:0, ammo:X.maxAmmo(), reload:0, vx:0, vy:0, face:-Math.PI/2, hitT:0, walk:0};
  if (blocked(p.x, p.y, 12)) { p.x = CAMPX.x; p.y = CAMPX.y; }
  const mau = {x:p.x - 40, y:p.y + 10, cool:1, walk:0, idle:0, st2:'', stT:0, blockCd:0, chargeCd:5, snackCd:0, dash:null, say:'', sayT:0, quipT:20};
  let story = null;   // "Spirits of the Snow" (after Loki) plugs in here
  W.treats = W.treats || 0; W.snacks = W.snacks || {}; let buffT = 0;
  const mauState = () => mau.stT > 0 && mau.st2 ? mau.st2 : mau.dash ? 'charge' : mau.sniff ? 'sniff' : mau.idle > 16 ? 'sleep' : mau.idle > 7 ? 'flop' : mau.moving ? 'march' : 'stand';
  const mauSay = (txt, d) => { mau.say = txt; mau.sayT = d || 3.2; };
  const bubble = (x, y, txt) => { g.font = '700 11px ' + A.font; const tw = Math.min(260, g.measureText(txt).width + 16); g.fillStyle = 'rgba(255,255,255,.95)'; rr(g, x - tw/2, y - 20, tw, 22, 10); g.fill(); g.beginPath(); g.moveTo(x - 5, y + 2); g.lineTo(x + 5, y + 2); g.lineTo(x, y + 8); g.fill(); g.fillStyle = '#14204a'; g.textAlign = 'center'; wrapClip(txt, x, y - 5, tw - 12); };
  // hidden snacks all over the kingdom: only Mau Mau can sniff them out
  const SNACKS = (() => { const out = []; let sd = 77; const rnd = () => (sd = (sd*16807) % 2147483647) / 2147483647; for (let k = 0; out.length < 36 && k < 4000; k++) { const x = 4 + Math.floor(rnd()*(N1 - 8)), y = 4 + Math.floor(rnd()*(N1 - 8)), v = tileAt(x, y); if (SOLID[v] || v == HOLE || regionAt(x, y) == 'camp' || out.some(o => Math.hypot(o.tx - x, o.ty - y) < 7)) continue; out.push({id:out.length, tx:x, ty:y, x:(x + .5)*TS, y:(y + .5)*TS, e:['🐟', '🍗', '🧀', '🥛'][out.length % 4]}); } return out; })();
  const feedMau = () => { if (!W.mau) { say('Free Royal Guard Mau Mau first. He’s caged at Howling Pass', 2.4); return; } if ((W.treats||0) <= 0) { say('🐟 No treats! Chests, enemies and Mau Mau’s nose (“!”) find more', 2.6); mauSay('Was that... a no-snack button?', 2.2); A.sfx('bad'); return; }
    W.treats--; mau.st2 = 'dance'; mau.stT = 2.8; buffT = (20 + 5*RL('pantry')) * (W.spoon ? 2 : 1); p.hp = Math.min(p.max, p.hp + 2); mates.forEach(m => { if (!m.ko) m.hp = m.max; }); splat(mau.x, mau.y - 10, 18, '#F9BF01'); A.sfx('win');
    mauSay(['Om nom nom! ROYAL POWER!', 'This fish was guarded... into my belly.', 'Royal Guard rule #1: never skip lunch!', 'Mmm! The team feels STRONGER!'][Math.floor(Math.random()*4)], 3); say('🐟 Mau Mau ate a treat! The team hits harder for 20 seconds, +♥', 2.6); X.stat('snowFeed', 1, 'add'); save(); };
  // teammates from your upgrades (Upgrade Workshop teammates + Snow Friends, levelled by Team Captain) come along too
  const MI = X.mates ? X.mates() : {n:0, lv:1, names:[]}, ROLES = ['thrower', 'builder', 'medic'], RCOL = {thrower:'#2fa8e0', builder:'#64CDF5', medic:'#ff9ad5'}, RE = {thrower:'🎯', builder:'🔨', medic:'➕'};
  const mates = []; for (let i = 0; i < MI.n; i++) mates.push({name:(MI.names[i] || 'Pal'), role:ROLES[i % 3], lv:MI.lv, x:p.x + (i - 1.5)*30, y:p.y + 40, cool:1 + i*.3, heal:12, hp:2 + MI.lv, max:2 + MI.lv, ko:0, face:0, walk:0, throwT:0});
  const mateHome = () => mates.forEach((m, i) => { m.x = p.x + (i - 1.5)*30; m.y = p.y + 40; });
  let sticks = [], tornado = null, blizzard = 0, blizT = 120 + Math.random()*180, regMood = '';
  // day and night: one full day every 12 minutes (night = darker, northern lights in the sky)
  let sqNightF = false;
  const nightAmt = () => { if (sqNightF) return .85; const ph = (Date.now()/720000) % 1; return Math.max(0, Math.min(1, (Math.cos(ph*TAU) + .25)*1.2)) * .9; };
  let foes = [], balls = [], fx = [], nums = [], drops = [], boss = null, dlg = null, mapOpen = false, travel = false, quiz = false, msg = '', msgT = 0, t = 0, score = 0;
  let saveT = 10, revealT = 0, spawnT = 1, dead = 0, lastReg = '', gateT = 0, lokiReady = !!W.bau, lokiSpar = false, charge = null, aim = {x:300, y:200}, mouseIn = false, healT = 0;
  const pads = new Map(); const pad = k => { for (const v of pads.values()) if (v == k) return 1; return 0; };
  const cam = {x:0, y:0};
  const say = (s2, d = 2.6) => { msg = s2; msgT = d; };
  const nfmt = d => d >= 1000 && A.fmt ? A.fmt(Math.round(d)) : d >= 100 ? Math.round(d) : Math.round(d*10)/10;
  const addNum = (x, y, txt, col) => { if (nums.length < 40) nums.push({x, y, txt, col:col || '#14204a', t:1}); };
  const splat = (x, y, n, col) => { const k = low() ? Math.ceil(n/3) : n; for (let i = 0; i < k; i++) fx.push({x, y, vx:(Math.random() - .5)*170, vy:(Math.random() - .5)*170, t:.35 + Math.random()*.3, col:col || '#ffffff', r:1.5 + Math.random()*2.5}); };
  const give = o => { const og = X.curM ? X.curM() : 1; if (o.flakes) PERM.bank += Math.round(og * o.flakes * (1 + .1*X.PU('flakes')) * (1 + .1*((W.base && W.base.rooms.trophy)|0))); if (o.frost) PERM.frost += Math.round(og * o.frost*tm('loot')); if (o.xp) { X.addXp(o.xp); W.kxp = (W.kxp||0) + o.xp; } if (o.score) { score += o.score; api.score(score); } let it = null; if (o.gear != null) it = X.makeGear(o.gear); return it; };
  // ---------- talking ----------
  const talk = (lines, done) => { if (!lines || !lines.length || !lines[0]) { console.warn('[snow] empty dialogue', new Error().stack); if (done) done(); return; } dlg = {lines, i:0, done, at:t}; A.sfx('blip'); };
  const nextLine = () => { if (!dlg) return; dlg.i++; dlg.at = t; A.sfx('blip'); if (dlg.i >= dlg.lines.length) { const d = dlg.done; dlg = null; d && d(); } };
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
  const openChest = ch => { if (W.chests[ch.id]) return; if (A.snowExp) jobTick('chest', regionAt(ch.tx, ch.ty)); const T2 = ch.tier, go = mult => { W.chests[ch.id] = 1; const fl = Math.round((25 + Math.random()*35)*T2*mult), fr = Math.round((1 + Math.random()*2)*T2*mult) + X.PU('frost'), gear = Math.random() < .25 + .1*T2 ? Math.max(0, T2 - 2) : null;
      const tr = W.mau && Math.random() < .5 ? 1 + (Math.random() < .3 ? 1 : 0) : 0; W.treats = (W.treats||0) + tr; const it = give({flakes:fl, frost:fr, score:100*T2, gear}); X.stat('snowChest', 1, 'add'); save(); A.sfx('coin'); splat(ch.x, ch.y - 10, 12, '#F9BF01'); say('🎁 +' + fl + ' ❄ banked · +' + fr + ' Frost Crystals' + (tr ? ' · +' + tr + ' 🐟' : '') + (it ? ' · ' + it.name : '') + (mult > 1 ? ' · DOUBLED!' : ''), 3.5); };
    if (boss) { go(1); return; }   // no pop-up questions in the middle of a boss fight
    quiz = true; if (!X.learn2('BONUS QUESTION · ANSWER RIGHT FOR DOUBLE TREASURE', () => { quiz = false; go(2); }, () => { quiz = false; go(1); })) quiz = false; };
  // ---------- things you can use (✋ / E / tap them) ----------
  const things = () => { const L = [{x:PIP.x, y:PIP.y, n:'Talk', f:talkPip}];
    for (const k in WAYS) { if (WAYS[k].spirit && !spiritsOpen()) continue; const w2 = px(WAYS[k]); L.push({x:w2.x, y:w2.y, n:W.ways[k] ? 'Travel' : 'Touch', f:() => { W.ways[k] = 1; save(); openMap(true); }}); }
    for (const ch of chests) if (!W.chests[ch.id]) L.push({x:ch.x, y:ch.y, n:'Open', f:() => openChest(ch)});
    if (W.loki && !W.bau) L.push({x:BAUCAGE.x, y:BAUCAGE.y, n:'Free', f:freeBau});
    if (W.bau) L.push({x:THRONE.x, y:THRONE.y, n:'Talk', f:talkBau});
    if (W.mau && !(boss && boss.k == 'sq_mau')) L.push({x:mau.x, y:mau.y, n:'Talk', f:talkMau, quiet:1});   // tap Mau Mau to chat; he follows you, so no pop-up label
    if (A.snowExp && !raid && !inRealm()) expThings(L);
    const n0 = L.length; const L2 = sqThings(p3Things(storyThings(L))); if (SG) SG.things(L2); for (let i = n0; i < L2.length; i++) if (L2[i].n != 'Talk') L2[i].pri = 1; return L2; };
  // ---------- the Wider Kingdom: lore notes, viewpoints, expedition gates, village shops, inns and quest boards ----------
  const EX = A.snowExp; W.notes = W.notes || {}; W.views = W.views || {};
  const expThings = L => { const near = q => Math.abs(q.x*TS - p.x) < 400 && Math.abs(q.y*TS - p.y) < 400;
    for (const nt of EX.NOTES) if (near(nt)) L.push({x:(nt.x + .5)*TS, y:(nt.y + .5)*TS, n:W.notes[nt.x + ',' + nt.y] ? 'Read again' : 'Read', f:() => { const k = nt.x + ',' + nt.y, first = !W.notes[k]; W.notes[k] = 1; talk([[nt.t, 'snow', nt.note]], () => { if (first) { give({frost:5 + 3*REG[nt.reg].tier, xp:60}); addNum(p.x, p.y - 40, '+lore', '#F9BF01'); } save(); }); }});
    for (const v of EX.VIEWS) if (near(v)) L.push({x:(v.x + .5)*TS, y:(v.y + .5)*TS, n:'Look out', f:() => { const bx = Math.floor(v.x/2), by = Math.floor(v.y/2), R0 = 22; let ch = 0; for (let y = by - R0; y <= by + R0; y++) for (let x = bx - R0; x <= bx + R0; x++) { if (x < 0 || y < 0 || x >= FB || y >= FB || Math.hypot(x - bx, y - by) > R0) continue; const i = y*FB + x; if (!fog[i]) { fog[i] = 1; paintBlock(i); ch++; } } explored += ch;
      const first = !W.views[v.reg]; W.views[v.reg] = 1; if (first) give({frost:10 + 4*REG[v.reg].tier, xp:80}); say('🔭 You can see all of ' + REG[v.reg].n + ' from here! The map fills in', 3); A.sfx('win'); save(); }});
    for (const G of EX.GATES) if (near(G)) L.push({x:(G.x + .5)*TS, y:(G.y + .5)*TS - 20, n:'Expedition Gate', f:() => { if (SG && SG.expedition && ((W.sp|0) >= 6 || (W.saga && Object.keys(W.saga.seen || {}).length))) SG.expedition(); else say('The gate hums… it opens to the lands beyond once your Dumpling saga reaches them (Spirits of the Snow first)', 3.2); }});
    for (const k in EX.VIL) { const V = EX.VIL[k], at = (dx, dy) => ({x:(V.x + dx + .5)*TS, y:(V.y + dy + .5)*TS}); if (!near(V)) continue;
      L.push({...at(-4, -3), n:'Shop', f:() => vilShop(k)}, {...at(5, -3), n:'Inn', f:() => vilInn(k)}, {...at(0, 4), n:'Quest board', f:() => vilBoard(k)}); } };
  const vilShop = k => { const V = EX.VIL[k]; openPanelUI(() => ({title:'🛒 ' + V.n + ' Shop', sub:'You have ' + A.fmt(PERM.frost) + ' 🔷 and ' + A.fmt(PERM.bank) + ' ❄',
    rows:[{e:'☕', n:'Hot Cocoa', d:'Heal to full hearts right now', btn:'150 ❄', ok:PERM.bank >= 150 && p.hp < p.max, fn:() => { PERM.bank -= 150; p.hp = Math.max(p.hp, p.max); A.sfx('coin'); save(); }},
      {e:'🐟', n:'Mau Mau treats ×5', d:'Feed him (G) for a big buff', btn:'400 ❄', ok:PERM.bank >= 400, fn:() => { PERM.bank -= 400; W.treats = (W.treats || 0) + 5; A.sfx('coin'); save(); }},
      {e:'🗺', n:'Map of ' + REG[V.reg].n, d:'Reveals the whole region on your map', btn:'40 🔷', ok:PERM.frost >= 40, fn:() => { PERM.frost -= 40; let ch = 0; for (let i = 0; i < fog.length; i++) if (!fog[i] && regionAt((i % FB)*2 + 1, Math.floor(i/FB)*2 + 1) == V.reg) { fog[i] = 1; paintBlock(i); ch++; } explored += ch; A.sfx('win'); say('🗺 ' + REG[V.reg].n + ' is on your map now', 2.4); save(); }},
      {e:'🎒', n:'Snowball bundle', d:'Refill your snowballs', btn:'60 ❄', ok:PERM.bank >= 60, fn:() => { PERM.bank -= 60; p.ammo = X.maxAmmo(); A.sfx('coin'); save(); }}]})); };
  const vilInn = k => { const V = EX.VIL[k]; p.hp = Math.max(p.hp, p.max); W.inn = k; save(); A.sfx('win'); talk([[V.n + ' Inn', 'snow', 'You rest by the fire. Full hearts! If you get snowed under, you’ll wake up here now (until you rest at another inn).']]); };
  // quest board: 3 small daily jobs per village (miss a day? nothing lost, there are new ones tomorrow)
  const dayKey = () => { const d = new Date(); return d.getFullYear()*10000 + (d.getMonth() + 1)*100 + d.getDate(); };
  const jobsFor = k => { const V = EX.VIL[k], dk = dayKey(); W.jobs = W.jobs || {}; let J = W.jobs[k]; if (!J || J.day != dk) { const h = q => hash(dk % 100000, q, k.length*7), regs = Object.keys(EX.REG).filter(r => !EX.REG[r].village), r1 = regs[Math.floor(h(1)*regs.length)], r2 = V.reg;
      J = W.jobs[k] = {day:dk, list:[{t:'kill', reg:r2, need:12, got:0}, {t:'kill', reg:r1, need:20, got:0}, {t:'chest', reg:'any', need:1, got:0}]}; } return J; };
  const jobTxt = j => j.t == 'kill' ? 'Defeat ' + j.need + ' enemies in ' + REG[j.reg].n : 'Open a chest anywhere in the Wider Kingdom';
  const jobPay = (k, j) => ({frost:20 + 4*(REG[j.reg] ? REG[j.reg].tier : 3), flakes:600});
  const vilBoard = k => openPanelUI(() => { const J = jobsFor(k), V = EX.VIL[k]; return {title:'📋 ' + V.n + ' Quest Board', sub:'Three small jobs a day. Missed one? No problem: new jobs come tomorrow.',
    rows:J.list.map(j => ({e:j.done ? '✅' : j.t == 'kill' ? '⚔️' : '🧰', n:jobTxt(j) + ' (' + Math.min(j.got, j.need) + '/' + j.need + ')', d:'Reward: ' + jobPay(k, j).frost + ' 🔷 + ' + jobPay(k, j).flakes + ' ❄', btn:j.done ? 'Done' : j.got >= j.need ? 'Claim' : 'In progress', ok:!j.done && j.got >= j.need,
      fn:() => { if (j.done || j.got < j.need) return; j.done = 1; give(jobPay(k, j)); A.sfx('win'); say('📋 Job done! +' + jobPay(k, j).frost + ' 🔷', 2.4); save(); }}))}; });
  const jobTick = (t2, reg) => { if (!W.jobs) return; for (const k in W.jobs) { const J = W.jobs[k]; if (!J || J.day != dayKey()) continue; for (const j of J.list) if (!j.done && j.t == t2 && (j.reg == reg || (t2 == 'chest' && EX.REG[reg]))) j.got++; } };
  const nearThing = () => { let best = null, bd = 74; for (const T2 of things()) { if (T2.quiet) continue; const d0 = dist(T2, p); if (d0 >= 74) continue; const d = d0 - (T2.pri ? 30 : 0); if (d < bd) { bd = d; best = T2; } } return best; };
  const use = () => { if (dlg) return nextLine(); const T2 = nearThing(); if (T2) T2.f(); };
  // ---------- the quest arrow ----------
  const goal = () => { if (raid) { const f = raid.open == 0 ? 'Floor 1: step on the rune plates in order (' + raid.step + '/4)' : raid.open == 1 ? 'Floor 2: defeat the guardian' : 'Floor 3: defeat ' + BOSS[raid.R.boss].n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()); const tg = raid.open == 0 ? rpx(raid.plates[raid.order[raid.step]].x, raid.plates[raid.order[raid.step]].y) : raid.open == 1 ? rpx(20, 14) : rpx(20, 23); return {...tg, n:'⚔ ' + raid.R.n + ' · ' + f}; }
    if (siege) return {x:BELL.x, y:BELL.y, n:siege.phase == 'build' ? '⚔ Siege: build snow turrets at the glowing spots (' + Math.ceil(siege.t) + ' s)' : '⚔ Siege: protect the village bell · wave ' + siege.wave + '/5 · bell ' + Math.ceil(siege.hp) + '/' + siege.max};
    if (SG) { const g2 = SG.goal(); if (g2) return g2; }
    if (W.sqTrack) { const sg = sqGoal(); if (sg) return sg; }
    if (!W.met) return {x:PIP.x, y:PIP.y, n:'Talk to Old Pip at Camp Cocoa'};
    if (W.bau) return storyGoal() || sqGoal() || sqNext();
    if (W.loki) return {x:BAUCAGE.x, y:BAUCAGE.y, n:'Open Lord Emperor Bau Bau’s cage'};
    if (gateOpen()) return {x:LAIR.loki.x, y:LAIR.loki.y, n:'Storm the Shadow Castle and defeat Loki the Evil Sorcerer'};
    const left = []; if (!W.mau) left.push({...LAIR.rufus, n:'Free Royal Guard Mau Mau at Howling Pass'});
    [['grumble', 'forest'], ['icefang', 'lake'], ['crystal', 'caves']].forEach(([b, r]) => { if (!W.runes[r]) left.push({...LAIR[b], n:'Win the ' + RUNE_N[r] + ' Moon Rune (' + runesN() + '/3) in ' + REG[r].n}); });
    left.sort((a, b) => dist(a, p) - dist(b, p)); return left[0]; };
  // ---------- throwing ----------
  // =====================================================================================================
  // THREAT (difficulty from your gear) + BOSS RULES (wind-ups, breathing room, a projectile cap, stagger and punish windows,
  // Threat extras). Raid bosses keep their own rules (the raid module), and story bosses can never be easier than before.
  // =====================================================================================================
  const THR = [{n:'Calm', gs:0, c:'#9fe8ff'}, {n:'Rising', gs:120, c:'#7fe08a'}, {n:'Fierce', gs:250, c:'#F9BF01'}, {n:'Savage', gs:400, c:'#ff9a3c'}, {n:'Brutal', gs:550, c:'#FF4539'}, {n:'Dire', gs:700, c:'#c04ae0'}, {n:'Mythic', gs:900, c:'#ff6ad5'}, {n:'Wilderland', gs:1200, c:'#ff5fd2'}];
  // per tier: boss health/damage, enemy health/damage, reaction speed, elite chance, loot
  const TM = {bhp:[1, 1.2, 1.45, 1.75, 2.1, 2.5, 3, 3.6], bdm:[1, 1.1, 1.25, 1.4, 1.6, 1.8, 2.1, 2.4], fhp:[1, 1.08, 1.16, 1.26, 1.38, 1.5, 1.65, 1.8], fdm:[1, 1, 1.1, 1.2, 1.3, 1.4, 1.55, 1.7], spd:[1, 1.04, 1.08, 1.12, 1.16, 1.2, 1.25, 1.3], elite:[0, .03, .06, .09, .12, .15, .18, .22], loot:[1, 1.1, 1.2, 1.35, 1.5, 1.7, 1.9, 2.2]};
  // Gear Score: the best piece you own in each slot (grade, level) + Power Arm. Hearts, skills and base level don't count.
  const gearScore = () => Math.round(['gloves', 'boots', 'hat', 'scarf', 'pack'].reduce((a, sl) => a + Math.max(0, ...(PERM.gear || []).filter(it => it.slot == sl).map(it => (it.rar + 1)*20*(1 + .15*(it.lv || 0)))), 0) + 15*X.PU('arm'));
  W.gsMax = Math.max(W.gsMax || 0, gearScore());   // the HIGHEST Gear Score ever reached, so unequipping gear can't make bosses easier
  const thrOf = gs => { let i = 0; THR.forEach((T2, j) => { if (gs >= T2.gs) i = j; }); return i; };
  const thr = () => W.forceThreat != null && W.forceThreat >= 0 ? Math.min(7, W.forceThreat) : thrOf(W.gsMax || 0);
  if (W.thrSeen == null) W.thrSeen = thr();
  let thrBanner = null, gsT = 0, haz = [], hostN = 0, thrR = null;
  const thrTick = dt => { gsT -= dt; if (gsT > 0) return; gsT = 2; const gs = gearScore(); if (gs > (W.gsMax || 0)) W.gsMax = gs; const T2 = thr(); if (T2 > (W.thrSeen|0)) { W.thrSeen = T2; thrBanner = {t:6, T:T2}; A.sfx('bad'); save(); } else if (W.forceThreat == null && T2 < (W.thrSeen|0)) W.thrSeen = T2; };
  const isRB = B => !!(B && BOSS[B.k] && BOSS[B.k].rd);
  const tm = k => rOn() ? 1 : TM[k][thr()];
  // hearts stay whole numbers: ×1.4 damage = 1 heart, plus a 40% chance of 1 more
  const scaleDmg = (d, m) => { if (d < 1 || m <= 1) return d; const v = d*m, f = Math.floor(v); return f + (Math.random() < v - f ? 1 : 0); };
  const TELL = () => Math.max(.6, .8/tm('spd'));
  const fireNow = (from, ang, sp, o) => { if (balls.length > 260) return; { const m2 = RMOD('shot'); if (m2) sp *= m2.shot; } balls.push({x:from.x, y:from.y, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp, mine:0, dmg:o.dmg || 1, r:o.r || 7, life:o.life || 3.5, col:o.col || '#ffffff', hex:o.hex, fb:from === boss ? 1 : 0}); };
  // every boss shot waits for a wind-up (glow, sound, aim lines); patterns are cut at 2.4 s and followed by 2 s of breathing room
  const bossShot = (B, ang, sp, o) => { const P2 = B.pat || (B.pat = {s:-99, l:-99, block:-99}); if (t < P2.block) return;
    if (t - P2.l > .35) { if (t - P2.l < TELL() + 2) return; P2.s = t; A.tone(260, .2, 'triangle', .045); } else if (t - P2.s > 2.4) { P2.block = t + TELL() + 2; return; }
    P2.l = t; B.q = B.q || []; if (!B.vol || B.vol.t != t) B.vol = {t, gap:Math.random()*TAU, n:0}; B.vol.n++; B.q.push({at:t + TELL(), ang, sp, o, v:B.vol}); };
  const angD = (a, b) => Math.abs(((a - b) % TAU + TAU*1.5) % TAU - Math.PI);
  const inGap = s2 => s2.v.n >= 8 && angD(s2.ang, s2.v.gap) < .34;   // rings always leave a visible safe gap
  const shot = (from, ang, sp, o) => { if (boss && from === boss && !isRB(boss)) { bossShot(boss, ang, sp, o); return; } fireNow(from, ang, sp, o); };
  const bossFire = () => { const B = boss; hostN = 0; for (const b of balls) if (b.fb && b.life > 0) hostN++; if (!B || !B.q || !B.q.length) return; const cap = low() ? 14 : 22;
    for (const s2 of B.q) if (s2.at <= t) { s2.done = 1; if (inGap(s2) || hostN >= cap) continue; hostN++; fireNow(B, s2.ang, s2.sp, s2.o); } B.q = B.q.filter(s2 => !s2.done); };
  // stagger: charged throws, hits during a wind-up, Mau Mau's charges and icicles fill it; full = STUNNED (the punish window)
  const stunB = B => { B.stuns = (B.stuns|0) + 1; B.stunT = Math.max(2.6, 3.6/tm('spd')); B.stg = 0; B.q = []; shakeV = Math.max(shakeV, 6); A.sfx('win'); say('💫 STUNNED! Hit it now for big damage!', 2.2);
    for (let i = 0; i < 1 + (B.stuns % 2); i++) drops.push({x:B.x + (i ? 46 : -46), y:B.y + 56, k:'heart', life:14}); };
  const stgNeed = B => Math.min(220, 100*(1 + .2*(B.stuns|0)));
  const addStg = (B, n) => { if (!B || isRB(B) || B.stunT > 0) return; B.stg = (B.stg || 0) + n; if (B.stg >= stgNeed(B)) stunB(B); };
  const guardsUp = () => foes.some(f => f.k == 'tguard' && !f.dead);
  // Threat extras on every (non-raid) boss: Fierce = Frost Guards, Brutal = a second form with slam circles, Mythic = icicle rain
  const exUpdate = (B, dt) => { if (isRB(B) || (BOSS[B.k] || {}).post) return; const T2 = thr();
    if (T2 >= 2 && B.exPh !== B.ph) { B.exPh = B.ph; let n = foes.filter(f => f.k == 'tguard' && !f.dead).length; for (; n < 2; n++) { const a = Math.random()*TAU; spawnFoe('tguard', B.x + Math.cos(a)*90, B.y + Math.sin(a)*70); const f = foes[foes.length - 1]; if (f) f.oa = a; } say('🛡 Frost Guards shield the boss! Break them first', 2.6); }
    if (T2 >= 4 && !B.form2 && B.hp < B.max*.5) { B.form2 = 1; B.r *= 1.12; B.flash = .6; shakeV = 10; A.sfx('bad'); B.slamT = 2.5; say('⚠ SECOND FORM! Step out of the red circles', 3); }
    if (B.form2) { B.slamT -= dt; if (B.slamT <= 0) { B.slamT = 7/tm('spd'); haz.push({k:'slam', x:p.x, y:p.y, r:95, t:1.2, max:1.2}); } }
    if (T2 >= 6) { B.iceT = (B.iceT == null ? 5 : B.iceT) - dt; if (B.iceT <= 0) { B.iceT = 9/tm('spd'); haz.push({k:'ice', x:p.x, y:p.y, r:44, t:1.3, max:1.3}); for (let i = 0; i < 2; i++) { const a = Math.random()*TAU; haz.push({k:'ice', x:B.x + Math.cos(a)*70, y:B.y + Math.sin(a)*55, r:44, t:1.5, max:1.5}); } if (!B.iceTold) { B.iceTold = 1; say('❄ Icicles! Lure the boss under a falling one to stun it', 3); } } } };
  const hazUpdate = dt => { for (const h of haz) { h.t -= dt; if (h.t > 0) continue; h.done = 1;
      if (h.k == 'slam') { if (dist(p, h) < h.r) hurtMe(2); splat(h.x, h.y, 18, '#ff9a8a'); shakeV = Math.max(shakeV, 6); }
      else { if (dist(p, h) < h.r) hurtMe(1); if (boss && Math.hypot(boss.x - h.x, boss.y - h.y) < h.r + boss.r*.6) { addStg(boss, 45); addNum(boss.x, boss.y - boss.r - 24, 'ICICLE HIT!', '#9fe8ff'); } splat(h.x, h.y, 14, '#d8f6ff'); } }
    haz = haz.filter(h => !h.done); if (!boss) haz = []; };
  Object.assign(FOE, {tguard:{n:'Frost Guard', hp:9, sp:0, r:17, pts:90, melee:1, guard:1}});
  const throwAt = (wx, wy, pk) => { const k = X.ballK(), cost = k == 'boulder' ? 3 : 1; if (p.ammo < cost) { if (msgT <= 0) say('Out of snowballs! They come back by themselves in a moment', 1.6); A.sfx('bad'); return; }
    const ang = Math.atan2(wy - (p.y - 10), wx - p.x), sn = X.CL().snipe || 1, crit = Math.random() < .05*X.crit() ? 2 + critX() : 1;
    let dmg = X.armM() * (1 + pk) * (pk > .5 ? sn : 1) * crit * (p.eye > 0 ? 2 : 1) * (buffT > 0 ? 1.25 : 1), r = 5 + pk*4, sp = 520 + (sn > 1 ? 120 : 0);
    if (p.stick) { p.stick = 0; balls.push({x:p.x, y:p.y - 10, vx:Math.cos(ang)*430, vy:Math.sin(ang)*430, mine:1, dmg:0, r:9, life:.75, kind:'stick', hits:[], col:'#8D5B1D'}); p.reload = .5; p.face = ang; p.throwT = .2; A.tone(300, .08, 'triangle', .04); say('🪵 Stick!', 1); return; }
    if (k == 'boulder') { dmg *= 3; r = 12; sp = 420; }
    balls.push({x:p.x, y:p.y - 10, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp, mine:1, dmg, r, chg:pk, life:1.6 + (sn > 1 ? .5 : 0) + pk*.6, kind:k, hits:[], pierce:k == 'shard' || p.eye > 0, col:k == 'shard' ? '#9fe8ff' : k == 'slush' ? '#bfe0ff' : k == 'sparkle' ? '#ffe9a0' : '#ffffff'});
    p.ammo -= cost; p.reload = Math.max(p.reload, .7/Math.min(4, Math.max(1, regenMul()))); p.idleT = 0; p.face = ang; p.throwT = .18; A.tone(520 + pk*200, .04, 'triangle', .03); };
  const useAbility = () => { if (p.ab > 0 || dead > 0) return; const C2 = X.CL(), k = PERM.cls; p.ab = X.abCd(); A.sfx('win'); say('⭐ ' + C2.ab + '!', 1.4);
    const wa = toWorld(aim);
    if (k == 'slinger') for (let i = -2; i <= 2; i++) { const a = Math.atan2(wa.y - p.y, wa.x - p.x) + i*.16; balls.push({x:p.x, y:p.y - 10, vx:Math.cos(a)*560, vy:Math.sin(a)*560, mine:1, dmg:X.armM()*1.2, r:6, life:.9, hits:[], col:'#ffffff'}); }
    else if (k == 'builder') { p.fortT = 8; say('🏰 Snow fort! It blocks every snowball for 8 seconds', 2); }
    else if (k == 'medic') { p.hp = Math.min(p.max, p.hp + 3); splat(p.x, p.y, 14, '#ff9ad5'); }
    else if (k == 'tank') p.shieldT = 4;
    else if (k == 'sniper') { p.eye = 6; const bx = Math.floor(p.x/TS/2), by = Math.floor(p.y/TS/2); for (let y = by - 9; y <= by + 9; y++) for (let x = bx - 9; x <= bx + 9; x++) if (x >= 0 && y >= 0 && x < FB && y < FB && !fog[y*FB + x]) { fog[y*FB + x] = 1; paintBlock(y*FB + x); explored++; } }
    else if (k == 'trapper') { for (const f of foes) { const d = dist(f, p); if (d < 300) { const a = Math.atan2(f.y - p.y, f.x - p.x); f.kbx = Math.cos(a)*320; f.kby = Math.sin(a)*320; f.kb = .35; f.stun = 2; hurtFoe(f, 2); } } if (boss && dist(boss, p) < 300) hurtBoss(3); splat(p.x, p.y, 30); } };
  // ---------- enemies ----------
  const spawnFoe = (k, x, y) => { const F = FOE[k], tier = Math.max(1, REG[regAt(x, y)].tier), el = !F.rd && !F.clone && !F.decoy && !F.guard && !rOn() && Math.random() < TM.elite[thr()] ? ['shield', 'fast', 'split', 'heal'][Math.floor(Math.random()*4)] : '', hp = Math.ceil(F.hp * (1 + .3*(tier - 1)) * A.D(.8, 1, 1.25) * (F.rd ? 1 : tm('fhp')) * (el ? 1.5 : 1)); foes.push({k, x, y, hp, max:hp, elite:el, cool:1 + Math.random()*1.5, wa:Math.random()*TAU, wt:0, stun:0, kb:0, kbx:0, kby:0, hurt:0, dir:Math.random() < .5 ? 1 : -1, tier, flap:Math.random()*6}); };
  const hurtFoe = (f, dmg) => { if (RMOD('glass')) dmg *= 2; f.hp -= dmg; f.hurt = 3; f.flash = .12; addNum(f.x, f.y - 26, '-' + nfmt(dmg), '#FF4539'); if (f.hp <= 0 && !f.dead) killFoe(f); };
  const killFoe = f => { if (A.snowExp && !f.dead) jobTick('kill', regAt(f.x, f.y)); f.dead = 1; if (!f.dk) { f.dk = 1; p.ammo = Math.min(X.maxAmmo(), p.ammo + 1 + RL('well')); } const F = FOE[f.k]; splat(f.x, f.y, 14, f.k == 'imp' || f.k == 'pup' || f.k == 'clone' ? '#c08aff' : '#ffffff'); if (F.decoy) addNum(f.x, f.y - 30, 'Fake-out!', '#2f8ad8'); if (F.clone) return;
    const fl = Math.round((3 + Math.random()*5) * f.tier); give({flakes:fl, xp:2, score:F.pts*f.tier}); addNum(f.x, f.y - 44, '+' + fl + ' ❄', '#2f8ad8'); W.kills = (W.kills || 0) + 1; X.stat('snowWorldKills', 1, 'add');
    if (f.elite) { const fr = 1 + thr(); give({frost:fr}); addNum(f.x, f.y - 60, '+' + fr + ' 🔷 elite', '#64CDF5'); if (f.elite == 'split' && !f.mini) for (const sx of [-18, 18]) { spawnFoe(f.k, f.x + sx, f.y); const m2 = foes[foes.length - 1]; if (m2) { m2.mini = 1; m2.elite = ''; m2.hp = m2.max = Math.max(1, Math.ceil(f.max*.3)); } } }
    if (!boss && Math.random() < .09) drops.push({x:f.x, y:f.y, k:'cocoa', life:15}); else if (W.mau && Math.random() < .05) drops.push({x:f.x, y:f.y, k:'fish', life:18}); };
  const hurtMe = dmg => { if (p.inv > 0 || p.shieldT > 0 || A.immortal || dead > 0 || quiz) return; if (RMOD('dmg')) dmg *= 2; dmg = scaleDmg(dmg, boss && !isRB(boss) ? tm('bdm') : tm('fdm')); shakeV = Math.max(shakeV, 4); if (Math.random() < .06*X.PU('armor')) { p.inv = .4; addNum(p.x, p.y - 40, 'Shrugged off!', '#2f8ad8'); return; }
    const ar = RL('armory'); if (ar && Math.random() < 1 - Math.pow(.97, ar)) { p.inv = .4; addNum(p.x, p.y - 40, 'Ice Armory block!', '#64CDF5'); A.tone(700, .06, 'triangle', .04); return; } if (ar && dmg > 1) dmg = Math.max(1, Math.round(dmg*(1 - .03*ar)));
    if ((p.over|0) > 0) { p.over = Math.max(0, p.over - Math.ceil(dmg)); p.inv = .9; p.hitT = .3; addNum(p.x, p.y - 40, '-💛 gold heart', '#F9BF01'); A.sfx('bad'); return; }
    p.hp -= dmg; p.inv = .9; p.hitT = .3; A.sfx('bad'); splat(p.x, p.y - 10, 8, '#e8f4ff');
    if (p.hp <= 0) { p.hp = 0; W.deaths = (W.deaths || 0) + 1; quiz = true;
      if (!X.learn2('SNOWED UNDER! ANSWER RIGHT TO GET BACK UP RIGHT HERE', () => { quiz = false; p.hp = Math.ceil(p.max/2); p.inv = 2.5; say('Back on your feet!', 1.6); }, () => { quiz = false; dead = 1.8; say('❄ Snowed under! Waking up at Camp Cocoa...', 2.4); A.sfx('over'); })) quiz = false; } };
  const respawn = () => { if (SG && SG.respawn()) return;
    // knocked out in a boss fight: get back up IN the arena at 50% hearts (3 s safe); the boss refills to the top of its current phase
    if (boss && !isRB(boss) && !raid) { const B = boss, np = B.phases || 3; B.hp = Math.max(1, B.max*(1 - (B.ph - 1)/np)*(B.ph > 1 ? .9999 : 1)); W.bhp = W.bhp || {}; W.bhm = W.bhm || {}; W.bhp[B.k] = B.hp; W.bhm[B.k] = B.max;
      B.q = []; B.stunT = 0; B.stg = 0; haz = []; balls = balls.filter(b => b.mine); foes = foes.filter(f => f.k == 'tguard'); const kx = B.hx, ky = B.hy + 240; if (!blocked(kx, ky, 14)) { p.x = kx; p.y = ky; }
      p.vx = p.vy = 0; p.hp = Math.max(1, Math.ceil(p.max*(W.koPct || 50)/100)); p.inv = 3; p.ammo = X.maxAmmo(); mates.forEach(m => { m.ko = 0; m.hp = m.max; }); mateHome(); save();
      say('💫 Back on your feet with ' + p.hp + ' heart' + (p.hp == 1 ? '' : 's') + '! The boss is back at the top of phase ' + B.ph, 3.2); return; } if (siege) siegeEnd(false); raid = null; riding = false; tornado = null; sticks = []; p.stick = 0; { const IN = W.inn && A.snowExp && A.snowExp.VIL[W.inn], RP = IN ? px({x:IN.x + 5, y:IN.y - 1}) : CAMPX; p.x = RP.x; p.y = RP.y; }   /* wake up at the last inn you rested at */ p.vx = p.vy = 0; p.hp = p.max; p.inv = 2.5; p.ammo = X.maxAmmo(); foes = []; balls = []; if (boss) { boss = null; } mau.x = p.x - 40; mau.y = p.y + 10; mates.forEach(m => { m.ko = 0; m.hp = m.max; }); mateHome(); save(); say('🏕 Back at Camp Cocoa. Everything you found is safe!', 3); };
  // ---------- bosses ----------
  const bossDone = k => k == 'loki' ? (W.loki > 0 && !lokiReady) || (W.lokiReformed && !lokiSpar) : (BOSS[k].ai || k == 'chao') ? storyDone(k) : !!W.down[k];
  const phOf = (hp, max, np) => Math.min(np, 1 + Math.floor((1 - Math.max(0, hp)/max) * np));
  const spawnBoss = k => { W.bhp = W.bhp || {}; W.bhm = W.bhm || {}; const B = BOSS[k], H = LAIR[k], hp = B.hp * A.D(.8, 1, 1.2) * (1 + .05*(X.lv() - 1)) * (k == 'loki' && W.loki ? 1.15 : 1) * (B.rd ? 1 : TM.bhp[thr()]);
    const np = B.phases || 3, sv = W.bhp[k] != null && W.bhm[k] && !(W.bhpExact && W.bhpExact[k]) ? W.bhp[k]/W.bhm[k]*hp : W.bhp[k];   /* saved as a share of its health, so a new Threat tier keeps the same phase */
    // knocked out or left mid-fight: the boss refills to the TOP of the phase it was in (phases you beat stay beaten).
    // Saves from before this rule keep their exact health once.
    let left = hp; if (sv != null) { if (W.bhpExact && W.bhpExact[k]) { left = Math.max(1, Math.min(hp, sv)); delete W.bhpExact[k]; } else { const ph0 = phOf(sv, hp, np); left = Math.max(1, hp*(1 - (ph0 - 1)/np)*(ph0 > 1 ? .9999 : 1)); } } boss = {k, n:B.n, x:H.x, y:H.y - 40, hx:H.x, hy:H.y, hp:left, max:hp, r:B.r, phases:np, ph:phOf(left, hp, np), cd:2, t:0, st:'walk', a:0, sum:6, tp:4, ring:3, rock:3, flash:0, talk:B.intro, talkT:4.5, castT:0, stg:0, stunT:0, q:[]}; haz = [];
    if (k == 'loki' || k == 'loki2') { boss.phn = LOKI_PH[boss.ph]; sticks = []; if (W.loki) boss.talk = W.lokiReformed ? 'Loki: “A practice match? Yay! I’ll go easy on you. (I will not go easy on you.)”' : 'Loki: “Back for more? Wonderful! I do love an audience.”'; }
    if (left < hp) { say('⚔ ' + BOSS[k].n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()) + ': phase ' + boss.ph + ' again. Beaten phases stay beaten', 2.6); } A.sfx('bad'); };
  const hurtBoss = (dmg, src) => { const B = boss; if (!B) return; if (B.mk && A.dumpMech) dmg = A.dumpMech.onHit(B, dmg, src);   // Dumpling mechanics: ice shield, beam struggle
    // punish windows: big damage only while STUNNED; plain (uncharged) snowball spam does half; Frost Guards cut damage until they break
    if (!isRB(B)) { const me = src && src.mine && !src.team; if (B.stunT > 0) dmg *= me ? 3 : 1.5; else if (guardsUp()) dmg *= .7;
      if (me) addStg(B, (src.chg >= .5 ? 8 + 14*src.chg : 1.2) + (B.q && B.q.length ? 6 : 0)); }
    if (SG && B.saga && SG.hurtBoss(B, dmg)) return; if (B.fetch && B.fetch.t > 0) dmg *= 2; B.hp -= dmg; W.bhp = W.bhp || {}; W.bhp[B.k] = Math.max(0, B.hp); W.bhm = W.bhm || {}; W.bhm[B.k] = B.max; B.flash = .1; addNum(B.x + (Math.random() - .5)*30, B.y - B.r - 10, '-' + nfmt(dmg), '#FF4539');
    if (B.fetch && B.fetch.t > 0) dmg *= 1;   // (fetching doubles damage, applied by the caller below)
    const ph = phOf(B.hp, B.max, B.phases || 3);
    if (ph > B.ph) { B.ph = ph; A.sfx('bad'); if (B.k == 'loki' || B.k == 'loki2') { B.phn = LOKI_PH[ph]; B.talk = ['', '', 'Loki: “Shadows, my darlings! Fetch!”', 'Loki: “Let’s make it a little... breezier! AWOOOO!”', 'Loki: “ENOUGH! Now you’ll see REAL magic!” *his golden coat blazes*'][ph]; B.talkT = 3.2; if (ph == 4) { spawnFoe('clone', B.hx - 160, B.hy + 40); spawnFoe('clone', B.hx + 160, B.hy + 40); } if (ph == 3) tornado = {x:B.x, y:B.y + 60, r:46, t:0, life:10}; if (B.hp <= 0) bossDown(B); return; }
      const lines = {loki:['', '', '', '', ''], rufus:['', '', 'Rufus: “Grr... I’m just getting warmed up!”', 'Rufus: “Boss Loki will be SO mad at me!”'],
        grumble:['', '', 'Grumblebark: “Hrrm! Bats, help me!”', 'Grumblebark: “You... are... annoying!”'], icefang:['', '', 'Icefang: “Arr, now ye’ve done it!”', 'Icefang: “Full speed ahead!”'], crystal:['', '', 'Crystal Golem: “...CRACK... ANGRY...”', 'Crystal Golem: “...SHATTER... EVERYTHING...”']}[B.k];
      if (lines && lines[ph]) { B.talk = lines[ph]; B.talkT = 3; } }
    if (B.hp <= 0) bossDown(B); };
  const bossDown = B => { boss = null; haz = []; if (W.bhp) delete W.bhp[B.k]; if (W.bhm) delete W.bhm[B.k]; foes = foes.filter(f => f.k != 'tguard'); balls = balls.filter(b => b.mine); foes = foes.filter(f => !FOE[f.k].clone);
    if (raidBossDown(B)) { cheerT = 2.5; shakeV = 8; save(); return; }
    if (SG && BOSS[B.k] && BOSS[B.k].saga) { SG.bossDown(B); save(); return; }
    if (B.k == 'chao') { chaoFade = {x:B.x, y:B.y, t:5}; A.tone(440, 1.2, 'sine', .03); X.stat('snowGuard', 1, 'add'); save(); return; }
    splat(B.x, B.y, 40, '#ffe9a0'); A.sfx('win'); X.stat('snowGuard', 1, 'add');
    cheerT = 2.5; shakeV = 8; if (BOSS[B.k].ai) { if (sqBossDown(B)) { save(); return; } if (B.k == 'snowking') { W.down.snowking = 1; give({frost:20, xp:80}); say('👑 The Siege King melts away!', 2.6); save(); return; } storyBossDown(B); save(); return; }
    if (B.k == 'loki') { const first = !W.loki; W.loki = (W.loki || 0) + 1; lokiReady = false; lokiSpar = false; X.stat('snowLoki', 1, 'add');
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
    if (BOSS[B.k] && BOSS[B.k].brain && SG) { SG.bossAI(B, dt, ph, ang, d); return; }
    if (B.k == 'chao' || BOSS[B.k].ai) (B.k == 'chao' ? chaoAI : genericAI)(B, dt, ph, ang, d);
    else if (B.k == 'grumble') { walk(p.x, p.y, 34);
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
    else if (B.k == 'loki' || B.k == 'loki2') { B.castT = Math.max(0, B.castT - dt); const rage = ph >= 4 ? 1.5 : 1;
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
    if (dist(p, {x:B.hx, y:B.hy}) > 1150) { boss = null; tornado = null; sticks = []; balls = balls.filter(b => b.mine); save(); foes = foes.filter(f => f.k != 'tguard'); haz = []; say('🏳 Leaving the arena counts as a knockout: ' + BOSS[B.k].n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()) + ' will be back at the top of phase ' + B.ph, 3.4); } };
  // =====================================================================================================
  // SPIRITS OF THE SNOW — after Loki. Bau Bau's brothers: Minccino (gentle and brave) and Chao Chao (the fallen).
  // Little Mow is NOT family: he's a small, shy stray cat that nobody ever really knew. Eerie and sad, never gory. W.sp: 0 not started · 1 Strange Lights · 2 The Driveway Shrine ·
  // 3 Whispers on the Road · 4 The Fallen · 5 The Last Storm · 6 epilogue (Hall of Paws, spirit companions, post-game)
  // =====================================================================================================
  const BAUQ = ['Lord Emperor Bau Bau', 'bau'], MINCQ = ['Minccino', 'mincG'], MOWQ = ['Little Mow', 'mowG'], CHAOQ = ['Chao Chao', 'chaoG'], NAR = ['', 'snow'];
  W.sp = W.sp|0; W.mem = W.mem || {}; W.clue = W.clue || {}; W.lanF = W.lanF || {}; W.party = W.party || {}; W.walk = W.walk || {}; W.echoN = W.echoN|0;
  const L2 = k => px(LM2[k]);
  const SHRINE_LAN = [{x:117.5, y:37}, {x:124.5, y:37}, {x:121, y:41}].map(q => ({x:q.x*TS, y:q.y*TS}));
  const CLUES = [{k:'paw', x:112, y:48, e:'🐾', n:'a tiny paw print, frozen into the snow', mem:'Such small paws. Whoever walked here was very little, and very light.'},
    {k:'string', x:122, y:50, e:'🧶', n:'a frayed piece of string', mem:'A string toy, chewed at one end. Someone played with this for a long, long time, all alone.'},
    {k:'bell', x:131, y:47, e:'🔔', n:'a little silver bell', mem:'A tiny bell with no collar. It still rings, very softly.'}].map(c => ({...c, x:(c.x + .5)*TS, y:(c.y + .5)*TS}));
  const MEMS = [{k:'hurt', at:{x:106, y:90}, n:'Memory: The Day He Got Hurt', lines:[[...BAUQ, 'Chao Chao was always the fastest of us. Skinny and quick. Nobody could catch him.', 'sad'], [...BAUQ, 'One day he jumped for the high fence and came down wrong. His leg was never quite right after that. He couldn’t run like before.', 'sad']]},
    {k:'changed', at:{x:134, y:52}, n:'Memory: How He Changed', lines:[[...BAUQ, 'After that, he stopped coming to the warm window. He hissed at shadows. At us. He’d stare at nothing for hours.', 'sad'], [...BAUQ, 'We tried to help. We all tried. But it was like a storm had moved in behind his eyes.', 'sad']]},
    {k:'ran', at:{x:112, y:28}, n:'Memory: The Night He Ran', lines:[[...BAUQ, 'One snowy night the door was open for just a moment. He ran out into the dark and didn’t look back.', 'sad'], [...BAUQ, 'We called and called. He never came home. Everyone thought he was gone for good.', 'sad'], [...BAUQ, '...I think part of him never stopped running.', 'sad']]}].map(m => ({...m, x:(m.at.x + .5)*TS, y:(m.at.y + .5)*TS}));
  const LANTERNS = [{x:20, y:80}, {x:60, y:40}, {x:90, y:90}, {x:30, y:120}, {x:110, y:60}, {x:126, y:118}].map((q, i) => ({i, x:(q.x + .5)*TS, y:(q.y + .5)*TS}));
  const TREAS = [...Array(10)].map((_, i) => { let x = 0, y = 0, k = 0; do { x = 6 + Math.floor(hash(i, k, 31)*(N1 - 12)); y = 6 + Math.floor(hash(k, i, 37)*(N1 - 12)); k++; } while ((SOLID[tileAt(x, y)] || tileAt(x, y) == HOLE || tileAt(x, y) == WATER) && k < 200); return {i, x:(x + .5)*TS, y:(y + .5)*TS, e:['🪀','🧸','🎀','🪶','🐚','🔑','🧦','🪙','🍂','🌰'][i]}; });
  W.small = W.small || {}; W.lanW = W.lanW || {};
  const bauF = {x:p.x - 30, y:p.y + 30, walk:0, cool:1};
  const comp = {x:p.x + 30, y:p.y - 20, healT:15};
  let chaoFade = null, holdWave = 0, holdT = 0, stormFlash = 0;
  const STORY_N = ['', 'Strange Lights', 'The Driveway Shrine', 'Whispers on the Road', 'The Fallen', 'The Last Storm', 'Epilogue: The Hall of Paws'];
  // the chapters' scenes
  const startCh1 = () => talk([[...MAUF, 'Psst. Hero. I was on night watch last night. Fully awake. Mostly.', 'surprised'], [...MAUF, 'Cold blue lights were floating over the eastern hills, past Glimmer Lake. And the wind... the wind said a name.', 'frightened'],
      [...BAUF, 'Chao Chao. It said Chao Chao.', 'sad'], [...BAUF, 'He was my brother. He ran away a long time ago. Everyone thought he was gone forever.', 'sad'],
      [...BAUF, 'I’m coming with you. If those lights are what I think they are... I have to know.', 'peaceful'], [...MAUF, 'Then the Royal Guard rides with you, Your Majesty. Well. Waddles.', 'happy']],
    () => { W.sp = 1; W.party.bau = 1; bauF.x = p.x - 30; bauF.y = p.y + 30; save(); A.sfx('win'); say('📖 Spirits of the Snow · Chapter 1: Strange Lights · the shimmering wall east of the lake has opened', 4.5); X.stat('snowStory', 1, 'max'); });
  story = () => null;
  const storyTalkBau = () => { const lines = {1:'The lights went east, into Spirit Hollow. Stay close to me.', 2:'North of the Old Road there’s a shrine... a driveway shrine. Something there is calling.', 3:'Somebody is out on the Old Road. Somebody very small and very quiet.', 4:'Chao Chao’s storms are getting worse. We need to understand what happened to him.', 5:'Storm Peak. He’s up there. Whatever happens... thank you for coming with me.', 6:'It’s quiet now. The storms are gone. Let’s visit the Hall of Paws sometimes, okay?'}[W.sp] || 'Purr.';
    talk([[...BAUF, lines, W.sp >= 6 ? 'peaceful' : 'sad']]); };
  const shrineDone = () => talk([[...MINCQ, '...You came. Little brother. You got so big.', 'peaceful'], [...BAUF, 'Minccino?! Is it really you?', 'surprised'],
      [...MINCQ, 'Shh. I can’t stay long. Listen. Chao Chao has come back. But he is not himself. He is the storm now.', 'sad'],
      [...MINCQ, 'He can’t be saved, Bau Bau. What’s left of him is only hurting and cold. The only kind thing left is to let the storm end.', 'sad'],
      [...MINCQ, 'Take my blessing. It will keep you warm and mend your hurts. And please... there is a little lost cat on the Old Road. Nobody ever knew him. Someone should.', 'peaceful']],
    () => { W.sp = 3; W.bless = 1; save(); A.sfx('win'); say('💙 Minccino’s Blessing: you and your team slowly heal · Chapter 3: Whispers on the Road', 4.5); });
  const mowFound = () => talk([[...MOWQ, '...', 'frightened'], [...BAUF, 'It’s okay. We won’t hurt you. You’re safe now.', 'peaceful'], [...MOWQ, '...mow?', 'sad'],
      [...BAUF, 'A little stray cat... I don’t know him. I don’t think anyone ever did. He just walked this road, all alone.', 'sad'],
      [...BAUF, 'Nobody even gave him a name. Let’s call him Little Mow. Because that’s the only thing he ever says.', 'peaceful'],
      [...BAUF, 'He never had a name tag. Every cat should have a name tag.', 'sad'], [...NAR, '*You fasten a little red name tag around Little Mow’s neck. It says LITTLE MOW.*', ''], [...MOWQ, '...mow.', 'peaceful'], [...BAUF, 'He likes it. Look. He’s purring.', 'happy']],
    () => { W.tag = 1; W.sp = 4; save(); A.sfx('win'); say('🏷️ Little Mow has a name tag now · Chapter 4: The Fallen', 4.5); setTimeout(() => talk([[...MAUF, 'Hero! The storms are getting worse! They’re heading for Camp Cocoa!', 'frightened'], [...MAUF, 'The Royal Guard will hold the kingdom. Come back to camp and help us hold the line! (Then find out what happened to Chao Chao.)', 'angry']]), 300); });
  const endStory = () => { const lines = [[...NAR, '*The storm goes quiet. Chao Chao stops. He looks at Bau Bau for a long moment.*', ''], [...CHAOQ, '...Bau Bau.', 'peaceful'], [...NAR, '*Then he fades away into the falling snow. He does not come back.*', ''],
      [...BAUF, '...', 'sad'], [...NAR, '*The storms clear. For the first time in a long time, the stars come out over the whole kingdom.*', ''],
      [...MINCQ, 'It’s over, little brother. You did the hardest thing. You stayed.', 'peaceful'], [...MOWQ, '...mow.', 'peaceful'],
      [...MAUF, 'Royal Guard Mau Mau, back at his post. ...Your Majesty, would you like a snack? It helps. A little.', 'sad'], [...BAUF, 'Yes, Mau Mau. I think it does.', 'peaceful']];
    talk(lines, () => { W.sp = 6; W.party.bau = 0; const it = give({frost:120, flakes:2500, xp:400, score:20000, gear:5}); X.stat('snowSpirits', 1, 'max'); save(); A.sfx('win'); say('🌌 Spirits of the Snow complete · the Hall of Paws is open · +120 Frost Crystals' + (it ? ' · ' + it.name : '') + ' · title: Keeper of Paws', 6); }); };
  const hallScene = () => talk([[...MAUF, 'This is the Hall of Paws. I keep watch here now. Royal Guard’s orders. My own orders.', 'peaceful'], [...BAUF, 'Minccino. Little Mow. Chao Chao. We’ll remember all of you.', 'sad'],
      [...MINCQ, 'If you like, one of us can walk with you a while longer. I can mend your hurts.', 'peaceful'], [...MOWQ, '...mow. (He points at something shiny. He’s good at finding things.)', 'happy']],
    () => { W.hallSeen = 1; save(); say('🕯️ Touch a memorial to choose a spirit companion: Minccino (healing) or Little Mow (finds hidden things)', 5); });
  // chapter quests for the quest arrow
  const storyGoal = () => { const sp = W.sp|0; if (!W.bau) return null;
    if (sp == 0) return {x:FIRE.x, y:FIRE.y, n:'📖 New story: go back to Camp Cocoa and talk to Royal Guard Mau Mau'};
    if (sp == 1) return {...L2('hollow'), n:'Ch.1 · Follow the strange lights east into Spirit Hollow'};
    if (sp == 2) { const left = SHRINE_LAN.filter((_, i) => !W.lanF[i]); if (left.length) { left.sort((a, b) => dist(a, p) - dist(b, p)); return {...left[0], n:'Ch.2 · Light the spirit lanterns at the Driveway Shrine (' + (3 - left.length) + '/3)'}; } return {...L2('shrine'), n:'Ch.2 · Enter the Driveway Shrine'}; }
    if (sp == 3) { const left = CLUES.filter(c => !W.clue[c.k]); if (left.length) { left.sort((a, b) => dist(a, p) - dist(b, p)); return {...left[0], n:'Ch.3 · Search the Old Road for clues (' + (3 - left.length) + '/3)'}; } return {x:(133 + .5)*TS, y:(48 + .5)*TS, n:'Ch.3 · Someone is waiting at the end of the Old Road'}; }
    if (sp == 4) { if (!W.held) return {x:FIRE.x, y:FIRE.y, n:'Ch.4 · Help the Royal Guard hold Camp Cocoa against the storm'}; const left = MEMS.filter(m => !W.mem[m.k]); left.sort((a, b) => dist(a, p) - dist(b, p)); return left.length ? {...left[0], n:'Ch.4 · Find Chao Chao’s memories (' + (3 - left.length) + '/3)'} : null; }
    if (sp == 5) return {...L2('peak'), n:'Ch.5 · The Last Storm: climb Storm Peak'};
    if (sp == 6 && !W.hallSeen) return {...L2('hall'), n:'Epilogue · Visit the Hall of Paws'};
    if (sp >= 6) { const lw = LANTERNS.filter(l => !W.lanW[l.i]); if (lw.length) { lw.sort((a, b) => dist(a, p) - dist(b, p)); return {...lw[0], n:'Post-game · Lantern Walk: light the spirit lanterns (' + (LANTERNS.length - lw.length) + '/' + LANTERNS.length + ')'}; }
      const st = TREAS.filter(q => !W.small[q.i]); if (st.length && W.comp == 'mow') { st.sort((a, b) => dist(a, p) - dist(b, p)); return {...st[0], n:'Post-game · Little Mow’s small treasures (' + (10 - st.length) + '/10)'}; } }
    return null; };
  // things you can use in the spirit lands
  const storyThings = L => { const sp = W.sp|0;
    if (W.party.bau) L.push({x:bauF.x, y:bauF.y, n:'Talk', f:storyTalkBau, quiet:1});
    if (sp == 2) SHRINE_LAN.forEach((q, i) => { if (!W.lanF[i]) L.push({x:q.x, y:q.y, n:'Light', f:() => { W.lanF[i] = 1; W.lan = Object.keys(W.lanF).length; splat(q.x, q.y - 20, 16, '#9fe8ff'); A.sfx('coin'); say(W.lan >= 3 ? '🏮 All three lanterns glow. The shrine gate opens…' : '🏮 Spirit lantern lit (' + W.lan + '/3)', 2.6); save(); }}); });
    if (sp == 3) CLUES.forEach(c => { if (!W.clue[c.k]) L.push({x:c.x, y:c.y, n:'Look', f:() => { W.clue[c.k] = 1; save(); talk([[...NAR, 'You found ' + c.n + '.', ''], [...BAUQ, c.mem, 'sad']], () => { if (Object.keys(W.clue).length >= 3) say('🌫️ Something small is waiting at the end of the Old Road…', 3); }); }}); });
    if (sp == 4 && W.held) MEMS.forEach(m => { if (!W.mem[m.k] && W.down['elite_' + m.k]) L.push({x:m.x, y:m.y, n:'Remember', f:() => { W.mem[m.k] = 1; save(); talk([[...NAR, '✨ ' + m.n, ''], ...m.lines], () => { if (MEMS.every(q => W.mem[q.k])) { W.sp = 5; save(); A.sfx('win'); say('📖 Chapter 5: The Last Storm · Storm Peak is open', 4); talk([[...BAUF, 'Now I understand. He wasn’t angry at us. He was hurting, and he didn’t know how to stop.', 'sad'], [...BAUF, 'Storm Peak. Let’s end this. Gently, if we can.', 'peaceful']]); } }); }}); });
    if (sp >= 6) { L.push({x:L2('hall').x, y:L2('hall').y - 20, n:'Remember', f:() => { if (!W.hallSeen) hallScene(); else talk([[...NAR, 'MINCCINO · gentle and brave. LITTLE MOW · small, shy, and loved. CHAO CHAO · the fastest of us all.', 'peaceful']]); }});
      if (W.hallSeen) { L.push({x:L2('hall').x - 80, y:L2('hall').y - 10, n:W.comp == 'minc' ? 'With you' : 'Choose', f:() => { W.comp = 'minc'; save(); A.sfx('win'); say('💙 Minccino walks with you: he slowly heals you and your team', 3); }});
        L.push({x:L2('hall').x + 80, y:L2('hall').y - 10, n:W.comp == 'mow' ? 'With you' : 'Choose', f:() => { W.comp = 'mow'; save(); A.sfx('win'); say('🔔 Little Mow walks with you: he finds hidden chests, snacks and small treasures', 3); }}); }
      LANTERNS.forEach(l => { if (!W.lanW[l.i]) L.push({x:l.x, y:l.y, n:'Light', f:() => { W.lanW[l.i] = 1; splat(l.x, l.y - 20, 14, '#9fe8ff'); A.sfx('coin'); const n = Object.keys(W.lanW).length; if (n >= LANTERNS.length) { give({frost:60, flakes:1200, xp:120}); say('🏮 Lantern Walk complete! Every spirit lantern glows · +60 Frost Crystals', 4); } else say('🏮 Spirit lantern lit (' + n + '/' + LANTERNS.length + ')', 2.4); save(); }}); }); }
    return L; };
  // bosses of the story (and the new lands)
  Object.assign(BOSS, {
    wraith:{n:'THE FROST WRAITH', hp:140, r:34, intro:'The Frost Wraith: “...colddd... so colddd... go awayyy...”', ai:{walk:30, spread:2.2, ring:4, summon:'wisp', summonT:8}},
    guardian:{n:'THE SHRINE STORM GOLEM', hp:170, r:36, intro:'The Storm Golem rumbles. Lightning crackles in its stones.', ai:{walk:26, spread:2.6, burst:1, rock:3}},
    fog:{n:'THE LONELY FOG', hp:150, r:40, intro:'A cold, lonely fog rolls down the road. It doesn’t want to let him go.', ai:{walk:40, spread:3, ring:5, summon:'wisp', summonT:9, fade:1}},
    elite_hurt:{n:'STORM ELITE', hp:90, r:26, intro:'A storm spirit guards a memory.', ai:{walk:60, spread:1.8, dash:1}}, elite_changed:{n:'STORM ELITE', hp:100, r:26, intro:'A storm spirit guards a memory.', ai:{walk:60, spread:1.8, dash:1, ring:4}}, elite_ran:{n:'STORM ELITE', hp:110, r:26, intro:'A storm spirit guards a memory.', ai:{walk:60, spread:1.6, dash:1, ring:3.5}},
    chao:{n:'CHAO CHAO, THE FALLEN', hp:380, r:26, phases:4, intro:'Chao Chao: “Who’s there? WHO’S THERE? ...Go away. Go AWAY.”'},
    echo:{n:'STORM ECHO', hp:220, r:30, intro:'Only an echo of the old storm is left. It howls, but nobody is inside it.', ai:{walk:50, spread:1.8, ring:3.5, spiral:1, summon:'stormling', summonT:9}},
    yeti:{n:'THE YETI KING', hp:240, r:40, intro:'The Yeti King: “ROOOAR! These are MY mountains! Throw snow at ME? I’ll throw a MOUNTAIN!”', ai:{walk:55, rock:2.2, dash:1, summon:'yeti', summonT:10}},
    giant:{n:'THE ICE GIANT', hp:260, r:44, intro:'The Ice Giant wakes up, very slowly, and very grumpily.', ai:{walk:22, ring:3.5, rock:2.5, burst:1}},
    frostbeard:{n:'CAPTAIN FROSTBEARD', hp:200, r:30, intro:'Captain Frostbeard: “Yarr! This shipwreck be haunted... by ME! And I be very bored!”', ai:{walk:70, spread:1.6, dash:1, summon:'goon', summonT:9}},
    serpent:{n:'THE AURORA SERPENT', hp:210, r:30, intro:'The Aurora Serpent ripples across the sky like the northern lights.', ai:{walk:110, spiral:1, spread:2.4}}});
  Object.assign(LAIR, {wraith:L2('hollow'), guardian:{x:121*TS, y:28.5*TS}, fog:{x:133.5*TS, y:48.5*TS}, elite_hurt:MEMS[0], elite_changed:MEMS[1], elite_ran:MEMS[2], chao:L2('peak'), echo:L2('peak'), yeti:L2('yeti'), giant:L2('ruins'), frostbeard:L2('coast'), serpent:L2('aurora')});
  const storyReady = k => { const sp = W.sp|0; if (k.slice(0, 3) == 'sq_') return sqReady(k); return k == 'wraith' ? sp == 1 : k == 'guardian' ? sp == 2 && (W.lan|0) >= 3 && dist(p, LAIR.guardian) < 230 : k == 'fog' ? sp == 3 && Object.keys(W.clue).length >= 3 : k.slice(0, 6) == 'elite_' ? sp == 4 && !!W.held && !W.mem[k.slice(6)] : k == 'chao' ? sp == 5 : k == 'echo' ? sp >= 6 && Date.now() > (W.echoAt||0) : true; };
  const storyDone = k => k.slice(0, 3) == 'sq_' ? !sqReady(k) : k == 'wraith' ? (W.sp|0) >= 2 : k == 'guardian' ? (W.sp|0) >= 3 : k == 'fog' ? (W.sp|0) >= 4 : k.slice(0, 6) == 'elite_' ? !!W.down[k] : k == 'chao' ? (W.sp|0) >= 6 : k == 'echo' ? false : !!W.down[k];
  const storyBossDown = B => { const k = B.k;
    if (k == 'wraith') { give({frost:30, flakes:500, xp:100, score:3000, gear:3}); W.sp = 2; save(); talk([[...BAUF, 'These lights... they smell like home. Like the warm window on the porch.', 'sad'], [...BAUF, 'They’re pointing north, past the Old Road. To the old driveway. I remember it.', 'peaceful']], () => say('📖 Chapter 2: The Driveway Shrine · light its three spirit lanterns', 4)); return; }
    if (k == 'guardian') { give({frost:35, flakes:600, xp:110, score:3500, gear:3}); save(); shrineDone(); return; }
    if (k == 'fog') { give({frost:35, flakes:600, xp:110, score:3500, gear:3}); save(); mowFound(); return; }
    if (k.slice(0, 6) == 'elite_') { W.down[k] = 1; give({frost:12, flakes:250, xp:60, score:1500}); save(); say('✨ A memory shard glows where the storm spirit was. Touch it to remember', 3.5); return; }
    if (k == 'chao') { endStory(); return; }
    if (k == 'echo') { W.echoN++; W.echoAt = Date.now() + 10*60e3; const it = give({frost:25, flakes:700, xp:90, score:3000, gear:Math.random() < .5 ? 4 : 3}); save(); say('🌩️ The Storm Echo scatters into snowflakes · +25 Frost' + (it ? ' · ' + it.name : '') + ' · it gathers again in 10 minutes', 4); return; }
    W.down[k] = 1; const it = give({frost:30, flakes:800, xp:120, score:4000, gear:4}); save(); say('🏆 ' + B.n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()) + ' defeated! +30 Frost Crystals' + (it ? ' · ' + it.name : ''), 4.5); };
  // generic boss brain for the new bosses (spread shots, rings, summons, dashes, rock throws, spirals, fading)
  const genericAI = (B, dt, ph, ang, d) => { const C2 = BOSS[B.k].ai || {}, sp1 = 1 + .25*(ph - 1); const walk = (tx, ty, spd) => { const a = Math.atan2(ty - B.y, tx - B.x), nx = B.x + Math.cos(a)*spd*dt, ny = B.y + Math.sin(a)*spd*dt; if (Math.hypot(nx - B.hx, ny - B.hy) < 300 && !blocked(nx, ny, 18)) { B.x = nx; B.y = ny; } };
    if (B.st == 'dash') { B.wt -= dt; const nx = B.x + Math.cos(B.da)*420*dt, ny = B.y + Math.sin(B.da)*420*dt; if (!blocked(nx, ny, 18) && Math.hypot(nx - B.hx, ny - B.hy) < 330) { B.x = nx; B.y = ny; } else B.wt = 0; if (d < B.r + 14) hurtMe(2); if (B.wt <= 0) B.st = 'walk'; return; }
    if (B.st == 'wind') { B.wt -= dt; if (B.wt <= 0) { B.st = 'dash'; B.wt = .7; } return; }
    walk(p.x, p.y, (C2.walk || 40) * (d < 140 ? -.5 : 1));
    if (C2.spread && B.cd <= 0) { B.cd = C2.spread / sp1; const n = 3 + 2*Math.min(2, ph - 1); for (let i = 0; i < n; i++) shot(B, ang + (i - (n - 1)/2)*.2, 230, {r:7, col:B.col || '#bfeeff'}); }
    if (C2.ring) { B.ring -= dt; if (B.ring <= 0) { B.ring = C2.ring / sp1; for (let i = 0; i < 12; i++) shot(B, i/12*TAU + B.t, 150, {r:7, col:B.col || '#9fd8ff'}); } }
    if (C2.rock) { B.rock -= dt; if (B.rock <= 0) { B.rock = C2.rock; shot(B, ang, 210, {r:13, dmg:2, col:'#c8d8e8'}); } }
    if (C2.burst && ph >= 2) { B.tp -= dt; if (B.tp <= 0) { B.tp = .2; B.a += .45; shot(B, B.a, 160, {r:7, col:B.col || '#c9a0ff'}); } }
    if (C2.spiral && ph >= 2) { B.tp2 = (B.tp2 || 0) - dt; if (B.tp2 <= 0) { B.tp2 = .16; B.a += .34; shot(B, B.a, 140, {r:6, col:'#ff9ad5'}); shot(B, B.a + Math.PI, 140, {r:6, col:'#9fe8ff'}); } }
    if (C2.summon && ph >= 2) { B.sum -= dt; if (B.sum <= 0) { B.sum = C2.summonT || 9; for (let i = 0; i < (RMOD('swarm') ? 4 : 2) && foes.length < 12; i++) spawnFoe(C2.summon, B.x + (i ? 60 : -60), B.y + 40); } }
    if (C2.dash && B.cd2 == null) B.cd2 = 4; if (C2.dash) { B.cd2 -= dt; if (B.cd2 <= 0) { B.cd2 = 4.5 / sp1; B.st = 'wind'; B.wt = .7; B.da = ang; } }
    if (C2.fade) B.fadeA = .35 + .3*Math.sin(B.t*1.5); };
  // CHAO CHAO, THE FALLEN: erratic teleports, fake-outs, splitting into shadow copies, screaming storms
  const CHAO_SAY = ['Chao Chao: “The window was warm... why is it so COLD?”', 'Chao Chao: “Don’t touch me. DON’T. It hurts. Everything hurts.”', 'Chao Chao: “Bau Bau? ...No. You’re not real. None of you are real.”', 'Chao Chao: “I ran. I ran and the snow kept going and going and—”', 'Chao Chao: “You stopped looking. You ALL stopped looking!”', 'Chao Chao: “The bowl... my bowl... the door... THE DOOR—”', 'Chao Chao: “Shh. Shh. Do you hear it? The storm is talking.”'];
  const CHAO_PH = ['', 'Flickering', 'Fake-Outs', 'Shadow Copies', 'Screaming Storm'];
  const chaoAI = (B, dt, ph, ang, d) => { B.phn = CHAO_PH[ph]; B.sayT = (B.sayT || 2) - dt; if (B.sayT <= 0) { B.sayT = 6 + Math.random()*3; B.talk = CHAO_SAY[Math.floor(Math.random()*CHAO_SAY.length)]; B.talkT = 3.2; }
    B.tp -= dt; if (B.tp <= 0) { B.tp = (ph >= 2 ? 1.6 : 2.4) * (.6 + Math.random()*.8); for (let k3 = 0; k3 < 8; k3++) { const a = Math.random()*TAU, r = 150 + Math.random()*170, nx = p.x + Math.cos(a)*r, ny = p.y + Math.sin(a)*r; if (!blocked(nx, ny, 16) && Math.hypot(nx - B.hx, ny - B.hy) < 360) { splat(B.x, B.y, 10, '#cfe8ff'); B.x = nx; B.y = ny; splat(B.x, B.y, 10, '#cfe8ff'); break; } }
      if (ph >= 2 && foes.filter(f => f.k == 'decoy').length < 3) { spawnFoe('decoy', B.x + (Math.random() - .5)*200, B.y + (Math.random() - .5)*160); } }
    if (B.cd <= 0) { B.cd = 1.4 / (1 + .15*(ph - 1)); const n = 3 + (ph >= 3 ? 2 : 0); for (let i = 0; i < n; i++) shot(B, ang + (i - (n - 1)/2)*.24 + (Math.random() - .5)*.2, 240, {r:6, col:'#dff4ff'}); }
    if (ph >= 3) { B.sum -= dt; if (B.sum <= 0) { B.sum = 8; for (let i = 0; i < 2 && foes.filter(f => f.k == 'echo').length < 4; i++) spawnFoe('echo', B.x + (i ? 70 : -70), B.y + 30); B.talk = 'Chao Chao: “There’s MORE of me. There was always more of me.”'; B.talkT = 2.4; } }
    if (ph >= 4) { B.ring -= dt; if (B.ring <= 0) { B.ring = 2.2; stormFlash = .5; A.tone(120, .4, 'sawtooth', .05); for (let i = 0; i < 18; i++) shot(B, i/18*TAU + B.t*.5, 170, {r:7, col:'#ffffff'}); } } };
  // things in the world that come with the story
  const storyUpdate = dt => { const sp = W.sp|0, rg2 = regAt(p.x, p.y);
    if (W.bau && sp == 0 && W.mau && !dlg && dist(p, FIRE) < 260 && !boss) startCh1();
    // hold Camp Cocoa (chapter 4): three storm waves, with Mau Mau and the Royal Guard
    if (sp == 4 && !W.held && dist(p, FIRE) < 420 && !boss) { if (!holdWave) { holdWave = 1; holdT = 1; talk([[...MAUF, 'ROYAL GUARD, FORM UP! Nobody touches the cocoa!', 'angry']]); }
      holdT -= dt; if (holdT <= 0 && holdWave <= 3 && foes.filter(f => f.hold).length == 0) { for (let i = 0; i < 3 + holdWave*2; i++) { const a = Math.random()*TAU; spawnFoe(i % 3 ? 'wisp' : 'stormling', FIRE.x + Math.cos(a)*520, FIRE.y + Math.sin(a)*420); foes[foes.length - 1].hold = 1; foes[foes.length - 1].hurt = 9; } say('🌩️ Storm wave ' + holdWave + ' of 3!', 2.2); holdWave++; holdT = 2; }
      if (holdWave > 3 && foes.filter(f => f.hold).length == 0) { W.held = 1; holdWave = 0; give({frost:25, flakes:500, xp:80}); save(); A.sfx('win'); talk([[...MAUF, 'The camp holds! Well done, everyone. Snack for the troops!', 'happy'], [...BAUF, 'Now let’s find out what happened to Chao Chao. His memories are scattered in the spirit lands, guarded by storm spirits.', 'sad']]); } }
    // Storm Peak is wrapped in a storm until chapter 5
    if (rg2 == 'peak' && sp < 5 && p.y < 21*TS) { p.y = 21*TS + 4; p.vy = 0; if (msgT <= 0) say('🌩️ The storm on Storm Peak pushes you back. ' + (sp < 4 ? 'You’re not ready yet.' : 'Find Chao Chao’s three memories first.'), 2.6); }
    // Bau Bau in your party
    if (W.party.bau) { const tx = p.x + Math.cos(p.face + 2.3)*56, ty = p.y + Math.sin(p.face + 2.3)*56, dm = Math.hypot(tx - bauF.x, ty - bauF.y); if (dm > 600) { bauF.x = tx; bauF.y = ty; } else if (dm > 12) { const s2 = Math.min(dm*3.4, 270); bauF.x += (tx - bauF.x)/dm*s2*dt; bauF.y += (ty - bauF.y)/dm*s2*dt; bauF.walk += dt; } else bauF.walk = 0;
      bauF.cool -= dt; if (bauF.cool <= 0) { let tg = boss && dist(boss, bauF) < 340 ? boss : null; if (!tg) { let bd = 300; for (const f of foes) { const d3 = dist(f, bauF); if (d3 < bd) { bd = d3; tg = f; } } } if (tg) { bauF.cool = 1.3; const a = Math.atan2(tg.y - bauF.y, tg.x - bauF.x); balls.push({x:bauF.x, y:bauF.y - 10, vx:Math.cos(a)*460, vy:Math.sin(a)*460, mine:1, dmg:X.armM()*.8, r:5, life:.9, hits:[], col:'#fff3e0', team:1}); } else bauF.cool = .3; } }
    // spirit companions and Minccino's blessing
    const healer = W.comp == 'minc' || (W.bless && sp < 6); if (healer) { comp.healT -= dt; if (comp.healT <= 0) { comp.healT = (W.comp == 'minc' ? 14 : 20) * shrineM(RL('shrine')) / (1 + .15*RL('vault')); if (p.hp < p.max) { p.hp++; addNum(p.x, p.y - 44, '💙 +♥', '#2f8ad8'); } mates.forEach(m => { if (!m.ko && m.hp < m.max) m.hp++; }); } }
    if (W.comp && sp >= 6) { const tx = p.x + 40, ty = p.y - 30, dm = Math.hypot(tx - comp.x, ty - comp.y); if (dm > 500) { comp.x = tx; comp.y = ty; } else { comp.x += (tx - comp.x)*Math.min(1, dt*3); comp.y += (ty - comp.y)*Math.min(1, dt*3); } }
    if (W.comp == 'mow') TREAS.forEach(q => { if (!W.small[q.i] && dist(q, p) < 34) { W.small[q.i] = 1; const n = Object.keys(W.small).length; addNum(q.x, q.y - 20, '+ ' + q.e, '#c4601a'); A.sfx('coin'); give({flakes:Math.round(150*(1 + .1*RL('vault'))), frost:Math.round(3*(1 + .1*RL('vault')))}); if (n >= 10) { give({frost:Math.round(50*(1 + .1*RL('vault'))), xp:100}); say('🔔 Little Mow found all 10 small treasures! +50 Frost Crystals', 4); } save(); } });
    if (chaoFade) { chaoFade.t -= dt; if (chaoFade.t < 2.6 && !chaoFade.told) { chaoFade.told = 1; endStory(); } if (chaoFade.t <= 0) chaoFade = null; }
    stormFlash = Math.max(0, stormFlash - dt); };
  // drawing for the story
  const storyDraw = () => { const sp = W.sp|0;
    if (sp == 2) SHRINE_LAN.forEach((q, i) => { if (!onScreen(q.x, q.y)) return; const on = W.lanF[i]; g.fillStyle = '#3a3a4a'; g.fillRect(q.x - 3, q.y - 26, 6, 30); g.fillStyle = on ? 'rgba(159,232,255,' + (.8 + .2*Math.sin(t*3 + i)) + ')' : '#5a6a80'; rr(g, q.x - 10, q.y - 44, 20, 20, 5); g.fill(); if (on && !low()) { g.fillStyle = 'rgba(159,232,255,.25)'; g.beginPath(); g.arc(q.x, q.y - 34, 26, 0, TAU); g.fill(); } });
    if (sp == 3) CLUES.forEach(c => { if (W.clue[c.k] || !onScreen(c.x, c.y)) return; g.font = '18px ' + A.font; g.textAlign = 'center'; g.globalAlpha = .7 + .3*Math.sin(t*3); g.fillText(c.e, c.x, c.y + 6); g.globalAlpha = 1; });
    if (sp == 3 && Object.keys(W.clue).length >= 3) { const mx = 133.5*TS, my = 48.5*TS; if (onScreen(mx, my)) SC.spirit(g, 'mow', mx, my, {ghost:1, mood:'frightened', alpha:.45 + .15*Math.sin(t*2)}, t); }
    if (sp == 4 && W.held) MEMS.forEach(m => { if (W.mem[m.k] || !W.down['elite_' + m.k] || !onScreen(m.x, m.y)) return; g.fillStyle = 'rgba(200,240,255,' + (.6 + .3*Math.sin(t*4)) + ')'; g.beginPath(); g.moveTo(m.x, m.y - 30); g.lineTo(m.x + 10, m.y - 12); g.lineTo(m.x, m.y + 6); g.lineTo(m.x - 10, m.y - 12); g.closePath(); g.fill(); });
    if (sp == 2 && W.lanF && (W.lan|0) >= 3 && dist(p, LAIR.guardian) < 600 && !boss && onScreen(LAIR.guardian.x, LAIR.guardian.y)) SC.spirit(g, 'minc', LAIR.guardian.x, LAIR.guardian.y - 60, {ghost:1, mood:'sad', alpha:.35}, t);
    if (sp >= 6) { const H2 = L2('hall'); if (onScreen(H2.x, H2.y, 400)) { // the Hall of Paws: three memorials and candles
        [['minc', -80], ['mow', 0], ['chao', 80]].forEach(([w2, ox], i) => { const mx = H2.x + ox, my = H2.y - 10; g.fillStyle = '#b8b098'; rr(g, mx - 22, my + 6, 44, 18, 4); g.fill(); g.fillStyle = '#8a8270'; g.font = '700 8px ' + A.font; g.textAlign = 'center'; g.fillText({minc:'MINCCINO', mow:'LITTLE MOW', chao:'CHAO CHAO'}[w2], mx, my + 19);
          SC.spirit(g, w2, mx, my - 8, {fur:'#cfc8b4', belly:'#e8e2d0', stripe:null, patch:null, mask:null, eye:'#a09880', mood:'peaceful', tag:w2 == 'mow' ? 1 : 0}, t); g.fillStyle = '#F9BF01'; for (const cx of [-16, 16]) { g.fillStyle = '#f2e8d0'; g.fillRect(mx + cx - 2, my + 2, 4, 6); g.fillStyle = 'rgba(255,200,80,' + (.7 + .3*Math.sin(t*9 + i + cx)) + ')'; g.beginPath(); g.ellipse(mx + cx, my, 2, 3.5, 0, 0, TAU); g.fill(); } });
        if (W.comp) { const cx2 = W.comp == 'minc' ? H2.x - 80 : H2.x + 80; g.strokeStyle = '#9fe8ff'; g.lineWidth = 2; g.beginPath(); g.arc(cx2, H2.y - 18, 30, 0, TAU); g.stroke(); } }
      LANTERNS.forEach(l => { if (!onScreen(l.x, l.y)) return; const on = W.lanW[l.i]; g.fillStyle = '#3a3a4a'; g.fillRect(l.x - 3, l.y - 26, 6, 30); g.fillStyle = on ? 'rgba(159,232,255,' + (.8 + .2*Math.sin(t*3 + l.i)) + ')' : '#5a6a80'; rr(g, l.x - 10, l.y - 44, 20, 20, 5); g.fill(); });
      if (W.comp == 'mow') TREAS.forEach(q => { if (W.small[q.i] || dist(q, p) > 520 || !onScreen(q.x, q.y)) return; g.font = '16px ' + A.font; g.textAlign = 'center'; g.fillText(q.e, q.x, q.y + 6); g.fillStyle = '#F9BF01'; g.font = '900 14px ' + A.font; g.fillText('!', q.x, q.y - 16 + Math.sin(t*6)*3); }); }
    if (chaoFade && chaoFade.t > 0) SC.spirit(g, 'chao', chaoFade.x, chaoFade.y, {ghost:1, mood:'peaceful', alpha:Math.max(0, chaoFade.t/5)*.8, noSpark:1}, t); };
  const storyEnts = ents => { if (W.party.bau) ents.push({y:bauF.y, d:() => SC.spirit(g, 'bau', bauF.x, bauF.y, {mood:'sad', walk:bauF.walk, pose:bauF.walk ? 'walk' : 'sit'}, t)});
    if (W.comp && (W.sp|0) >= 6) ents.push({y:comp.y, d:() => SC.spirit(g, W.comp, comp.x, comp.y, {ghost:1, mood:'peaceful', tag:W.comp == 'mow' ? 1 : 0, alpha:.75}, t)});
    // Mau Mau stands watch at the Hall of Paws entrance after the story
    if ((W.sp|0) >= 6) { const H2 = L2('hall'), gx = H2.x, gy = 71.5*TS; if (onScreen(gx, gy)) ents.push({y:gy, d:() => SC.mau(g, gx - 60, gy, {st:Math.sin(t*.4) > .9 ? 'salute' : 'stand', s:.95}, t)}); } };
  const compHint = (mx, my, sc2) => { if (W.comp != 'mow') return; g.fillStyle = '#F9BF01'; chests.forEach(ch => { if (!W.chests[ch.id] && dist(ch, p) < 900) { g.fillRect(mx + ch.x/TS*sc2 - 1, my + ch.y/TS*sc2 - 1, 2, 2); } }); };
  // =====================================================================================================
  // ICE FORT (base tiers + rooms), VILLAGE SIEGE, RAID DUNGEONS, MOUNTS, SKILLS, VILLAGE SHOP, PANELS
  // =====================================================================================================
  const TIER_N = ['Snow Camp', 'Ice Fort', 'Frost Keep', 'Crystal Castle', 'Glacier Bastion', 'Aurora Citadel', 'Frostfang Stronghold', 'Starfall Spire', 'Polar Palace', 'Everwinter Fortress', 'Celestial Ice Throne', 'Wilderland Winter Kingdom'], MAXT = TIER_N.length - 1;
  // base level = tier + 1 (an old Crystal Castle is Level 4 / 12). Tiers 5–12 cost about ×2.5 more each.
  const nice = v => { const q = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 2)); return Math.round(v/q)*q; };
  const TIER_COST = [null, {frost:40, flakes:2000}, {frost:120, flakes:8000}, {frost:300, flakes:25000}]; for (let i = 4; i <= MAXT; i++) TIER_COST.push({frost:nice(TIER_COST[i - 1].frost*2.5), flakes:nice(TIER_COST[i - 1].flakes*2.5)});
  const ROOMS = [
    {id:'barracks', e:'🛏️', n:'Barracks', d:lv => 'Teammates fight at +' + lv + ' level' + (lv == 1 ? '' : 's')},
    {id:'guard', e:'🛡️', n:'Royal Guard Post', d:lv => 'Mau Mau hits ' + (100 + 25*lv) + '% as hard · Spear Charge every ' + guardCd(lv).toFixed(1) + ' s'},
    {id:'forge', e:'⚒️', n:'Forge', d:lv => '+' + (8*lv) + '% snowball damage · forges ' + GRN[forgeR(lv)[0]] + (forgeR(lv)[1] > forgeR(lv)[0] ? '–' + GRN[forgeR(lv)[1]] : '') + ' gear'},
    {id:'kitchen', e:'☕', n:'Cocoa Kitchen', d:lv => '+' + lv + ' max heart' + (lv == 1 ? '' : 's') + ' · the campfire heals faster'},
    {id:'pantry', e:'🐟', n:'Mau Mau’s Pantry', d:lv => '+' + lv + ' treat' + (lv == 1 ? '' : 's') + ' every time you rest at camp (every 5 min) · treats last ' + (20 + 5*lv) + ' s'},
    {id:'trophy', e:'🏆', n:'Trophy Hall', d:lv => '+' + (10*lv) + '% snowflakes from everything'},
    {id:'shrine', e:'🕯️', n:'Spirit Shrine', d:lv => 'Spirit companions and blessings heal ×' + (1/shrineM(lv)).toFixed(1) + ' faster', need:() => (W.sp|0) >= 6, needTxt:'Finish Spirits of the Snow'},
    {id:'yard', e:'🎯', n:'Training Yard', d:lv => '+' + (2*lv) + ' snowballs you can carry'},
    {id:'well', e:'⛲', n:'Snow Well', d:lv => 'Snowballs come back ' + (35*lv) + '% faster · knockouts give +' + lv + ' extra snowball' + (lv == 1 ? '' : 's')},
    {id:'defenses', e:'🏰', n:'Defenses', d:lv => Math.min(4, lv) + ' free snow turret' + (lv == 1 ? '' : 's') + ' in sieges' + (lv > 4 ? ' · turrets +' + 15*(lv - 4) + '% faster and stronger' : '') + ' · village bell +' + (25*lv) + '% sturdier'},
    {id:'lodge', e:'🏡', n:'Snow Friends Lodge', d:lv => '+' + Math.min(3, lv) + ' teammate' + (lv == 1 ? '' : 's') + ' in every Snowball game (4 at most)' + (lv > 3 ? ' · they start +' + (lv - 3) + ' level' + (lv == 4 ? '' : 's') : '')},
    {id:'armory', e:'🧊', n:'Ice Armory', at:5, d:lv => Math.round(100*(1 - Math.pow(.97, lv))) + '% chance to block a hit · big hits do ' + 3*lv + '% less'},
    {id:'maproom', e:'🗺️', n:'Map Room', at:6, d:lv => 'Unopened chests on your maps' + (lv >= 2 ? ' · quest markers on the mini-map' : ' · level 2: quest markers') + ' · ' + mrFlags(lv) + '/3 travel flags' + (lv < 12 ? ' (more at 4, 8, 12)' : '')},
    {id:'infirmary', e:'🩹', n:'Infirmary', at:7, d:lv => 'Teammates get back up ' + 25*lv + '% faster · start sieges and raids with +' + lv + ' gold heart' + (lv == 1 ? '' : 's')},
    {id:'beacon', e:'🔦', n:'Beacon Tower', at:8, d:lv => 'Sieges: +' + 3*lv + ' s warning to build, enemies ' + 3*lv + '% slower, turret range +' + 5*lv + '%'},
    {id:'mine', e:'⛏️', n:'Frost Crystal Mine', at:9, d:lv => 'Digs ' + A.fmt(mineRate(lv)) + ' 🔷 an hour, even while you’re away (holds 12 hours)'},
    {id:'warroom', e:'🗡️', n:'War Room', at:10, d:lv => 'War Table raids: +' + 10*lv + '% Raid Tokens and loot · ' + 5*lv + '% chance of a bonus key level'},
    {id:'hall', e:'👑', n:'Royal Hall', at:11, d:lv => 'Mau Mau and teammates hit +' + 10*lv + '% harder' + (lv >= 4 ? ' · Royal Shield Belly' : ' · lv 4: Royal Shield Belly') + (lv >= 8 ? ' · triple throws' : ' · lv 8: triple throws')},
    {id:'vault', e:'✨', n:'Spirit Vault', at:12, d:lv => 'Spirit companions and Minccino’s blessing heal ' + 15*lv + '% faster · Little Mow’s treasures +' + 10*lv + '%'}];
  const guardCd = lv => lv <= 4 ? 7 - lv : 3*Math.pow(.92, lv - 4), shrineM = lv => lv <= 4 ? 1 - .2*lv : .2*Math.pow(.9, lv - 4);
  const forgeR = lv => [Math.min(5, 1 + Math.floor(lv/3)), Math.min(5, 1 + lv)];   // forged gear rarity range (Snow and above: fusing only)
  const mineRate = lv => lv ? Math.round(30*lv*Math.pow(1.3, lv)) : 0, mrFlags = lv => (lv >= 4) + (lv >= 8) + (lv >= 12);
  // one-time rewards for reaching base levels 5–12 (index = tier)
  const MILE = {4:{d:'500 🔷', fn:() => give({frost:500})}, 5:{d:'a Legendary gear piece', fn:() => give({gear:4})},
    6:{d:'Frost Guard teammate outfit', fn:() => { W.mateOuts = {...(W.mateOuts || {}), frost:1}; W.mateOut = 'frost'; }}, 7:{d:'Aurora mount skin', fn:() => { W.mskins = {...(W.mskins || {}), aurora:1}; W.mskin = 'aurora'; }},
    8:{d:'3K 🔷 + a Mythic gear piece', fn:() => give({frost:3000, gear:5})}, 9:{d:'Starlight teammate outfit', fn:() => { W.mateOuts = {...(W.mateOuts || {}), star:1}; W.mateOut = 'star'; }},
    10:{d:'Crystal mount skin', fn:() => { W.mskins = {...(W.mskins || {}), crystal:1}; W.mskin = 'crystal'; }}, 11:{d:'10K 🔷 + the Winter Kingdom Crown (Wilderland avatar hat)', fn:() => give({frost:10000})}};
  if (!W.koV2) { W.koV2 = 1; W.bhpExact = {}; for (const k in (W.bhp || {})) W.bhpExact[k] = 1; }   // saves mid-fight from before the knockout rule keep their exact boss health once
  W.base = W.base || {tier:0, rooms:{}}; W.base.rooms = W.base.rooms || {}; W.sk = W.sk || {}; W.kxp = W.kxp || 0; W.mounts = W.mounts || {}; W.village = W.village|0; W.raids = W.raids || {};
  const RL = id => W.base.rooms[id]|0;
  const ROOM_MUL = {armory:1.5, maproom:1.5, infirmary:1.5, beacon:1.6, mine:1.8, warroom:1.8, hall:2, vault:2};
  const roomCost = (id, lv) => { const m = Math.pow(1.6, Math.max(0, lv - 3))*(ROOM_MUL[id] || 1); return {frost:Math.round(8*(lv + 1)*(1 + W.base.tier*.6)*m + (id == 'shrine' ? 20 : 0)), flakes:Math.round(400*(lv + 1)*(W.base.tier + 1)*m)}; };
  const canPay = c => PERM.frost >= (c.frost||0) && PERM.bank >= (c.flakes||0), pay = c => { PERM.frost -= (c.frost||0); PERM.bank -= (c.flakes||0); };
  const costTxt = c => [c.frost ? c.frost + ' 🔷' : '', c.flakes ? A.fmt(c.flakes) + ' ❄' : ''].filter(Boolean).join(' + ');
  // kingdom level + skill tree (hearts keep growing: +1 every 3 levels, and the Heart skill)
  const SK = [{id:'dmg', e:'💥', n:'Strong Arm', d:r => '+' + (8*r) + '% snowball damage'}, {id:'hp', e:'❤️', n:'Big Heart', d:r => '+' + r + ' max heart' + (r == 1 ? '' : 's')}, {id:'spd', e:'👟', n:'Quick Feet', d:r => '+' + Math.round(100*spdB(r)) + '% walking speed'},
    {id:'ammo', e:'⚪', n:'Deep Pockets', d:r => '+' + (2*r) + ' snowballs'}, {id:'crit', e:'🍀', n:'Lucky Shot', d:r => '+' + (4*Math.min(5, r)) + '% critical hits' + (r > 5 ? ' · crits hit +' + (10*(r - 5)) + '% harder' : '')}, {id:'regen', e:'🏭', n:'Snow Factory', d:r => 'Snowballs come back ' + (25*r) + '% faster'}];
  // skills have no rank cap: Quick Feet slows down after rank 5 (always a little more), Lucky Shot ranks past 5 make crits hit harder
  const spdB = r => .06*Math.min(5, r) + (r > 5 ? .4*(1 - Math.pow(.92, r - 5)) : 0), critX = () => .1*Math.max(0, (W.sk.crit|0) - 5);
  const kLv = () => Math.floor(Math.sqrt(W.kxp/30)) + 1, kPts = () => kLv() - 1 - SK.reduce((a, s) => a + (W.sk[s.id]|0), 0);
  { const a0 = X.armM, m0 = X.maxAmmo, s0 = X.spd, h0 = X.maxHp, c0 = X.crit, g0 = X.give;
    X.armM = () => a0() * (1 + .08*(W.sk.dmg|0)) * (1 + .08*RL('forge')) * (X.gDmg ? X.gDmg() : 1);
    X.maxAmmo = () => m0() + 2*(W.sk.ammo|0) + 2*RL('yard');
    X.spd = () => s0() * (1 + spdB(W.sk.spd|0)) * mountMul();
    X.maxHp = () => h0() + (W.sk.hp|0) + RL('kitchen') + Math.floor((kLv() - 1)/3) + (W.extraHp|0);
    X.crit = () => c0() + Math.min(5, W.sk.crit|0); }
  // snowball regen: every source multiplies. Standing still (not throwing) for a moment refills three times as fast.
  const regenParts = () => [['Fast Scoop & Snow Machine (arena upgrades)', X.scoop()], ['Snow Factory skill', 1 + .25*(W.sk.regen|0)], ['Snow Well', 1 + .35*RL('well')],
    ['Backpack & gloves', 1 + .1*(X.gStat ? X.gStat('pack') : 0) + .05*(X.gStat ? X.gStat('gloves') : 0)], ['Bottomless Mitten', W.mitten ? 1.5 : 1], ['Snow Globe Charm', W.globe ? 2 : 1]];
  const regenMul = () => regenParts().reduce((a, q) => a*q[1], 1);
  const regenTxt = () => (2.5*regenMul()).toFixed(1) + ' snowballs/s (×3 when you pause throwing)';
  const refreshMax = () => { const m2 = X.maxHp(); if (m2 > p.max) p.hp += m2 - p.max; p.max = m2; };
  // mounts: sled, reindeer, snowmobile (V to hop on or off)
  const MOUNTS = [{id:'sled', e:'🛷', n:'Sled', mul:1.4}, {id:'reindeer', e:'🦌', n:'Reindeer', mul:1.65}, {id:'snowmobile', e:'🏍️', n:'Snowmobile', mul:1.95}];
  let riding = false;
  const mountMul = () => riding && W.mount && !rOn() ? (MOUNTS.find(m => m.id == W.mount) || {mul:1}).mul : 1;
  const toggleMount = () => { if (!W.mount) { say('🛷 No mount yet: buy a sled, reindeer or snowmobile at the Frostpine Village shop', 2.8); return; } if (rOn()) { say('No mounts in raid dungeons', 1.6); return; } riding = !riding; A.sfx('blip'); say(riding ? (MOUNTS.find(m => m.id == W.mount).e + ' Riding! (V to hop off)') : 'Hopped off', 1.4); };
  // ---------- panels (Ice Fort, skills, shop, raid board) ----------
  let panel = null, pnR = [], pnPage = 0;
  const openPanelUI = build => { panel = build; pnPage = 0; A.sfx('blip'); };
  const drawPanel = () => { const P2 = panel(); pnR = []; const PW = Math.min(620, VW - 30), PX = VW/2 - PW/2, fit = Math.max(1, Math.floor((VH - 40 - 104)/48)), pages = Math.ceil(P2.rows.length/fit); pnPage = Math.min(pnPage, pages - 1); const rows = P2.rows.slice(pnPage*fit, pnPage*fit + fit), PH = 104 + rows.length*48 + (pages > 1 ? 40 : 0), PY = Math.max(10, (VH - PH)/2);
    g.fillStyle = 'rgba(10,16,36,.6)'; g.fillRect(0, 0, VW, VH); g.fillStyle = '#fff'; rr(g, PX, PY, PW, PH, 18); g.fill(); g.strokeStyle = '#64CDF5'; g.lineWidth = 3; rr(g, PX, PY, PW, PH, 18); g.stroke();
    g.fillStyle = '#14204a'; g.font = '900 20px ' + A.font; g.textAlign = 'left'; g.fillText(P2.title, PX + 18, PY + 32); g.font = '600 12px ' + A.font; g.fillStyle = '#4a4a6a'; wrapClip(P2.sub || '', PX + 18, PY + 52, PW - 120);
    g.fillStyle = '#14204a'; rr(g, PX + PW - 96, PY + 14, 80, 30, 15); g.fill(); g.fillStyle = '#fff'; g.font = '800 13px ' + A.font; g.textAlign = 'center'; g.fillText('✕ Close', PX + PW - 56, PY + 34); pnR.push({x:PX + PW - 96, y:PY + 14, w:80, h:30, fn:() => { panel = null; }});
    if (pages > 1) { const by = PY + PH - 44; [[-1, '◀ Back', PX + 20], [1, 'More ▶', PX + PW - 130]].forEach(([d2, tx, bx]) => { const on = d2 < 0 ? pnPage > 0 : pnPage < pages - 1; g.fillStyle = on ? '#14204a' : '#c8ccd4'; rr(g, bx, by, 110, 32, 16); g.fill(); g.fillStyle = '#fff'; g.font = '800 13px ' + A.font; g.textAlign = 'center'; g.fillText(tx, bx + 55, by + 21); if (on) pnR.push({x:bx, y:by, w:110, h:32, fn:() => { pnPage += d2; }}); }); g.fillStyle = '#4a4a6a'; g.font = '700 12px ' + A.font; g.textAlign = 'center'; g.fillText('Page ' + (pnPage + 1) + ' / ' + pages, PX + PW/2, by + 21); }
    let y = PY + 70; rows.forEach(r2 => { g.fillStyle = r2.ok === false ? '#f2f2f2' : '#f3f8ff'; rr(g, PX + 12, y, PW - 24, 42, 10); g.fill(); g.font = '20px ' + A.font; g.textAlign = 'center'; g.fillStyle = '#14204a'; g.fillText(r2.e || '', PX + 34, y + 28);
      g.textAlign = 'left'; g.font = '800 13px ' + A.font; wrapClip(r2.n, PX + 54, y + 18, PW - 230); g.font = '600 11px ' + A.font; g.fillStyle = '#4a4a6a'; wrapClip(r2.d || '', PX + 54, y + 34, PW - 230);
      if (r2.btn) { const bw = 150, bx = PX + PW - bw - 20; g.fillStyle = r2.ok ? '#00B451' : '#c8ccd4'; rr(g, bx, y + 7, bw, 28, 14); g.fill(); g.fillStyle = '#fff'; g.font = '800 11px ' + A.font; g.textAlign = 'center'; wrapClip(r2.btn, bx + bw/2, y + 25, bw - 10); if (r2.ok) pnR.push({x:bx, y:y + 7, w:bw, h:28, fn:r2.fn}); }
      y += 48; }); };
  const panelDown = q => { for (const r2 of pnR) if (q.x >= r2.x && q.x <= r2.x + r2.w && q.y >= r2.y && q.y <= r2.y + r2.h) { r2.fn(); return; } };
  // ---------- the base: 12 levels, rooms up to 12, Upgrade all ----------
  const roomOpen = r0 => (r0.at || 1) <= W.base.tier + 1 && !(r0.need && !r0.need());
  const roomMax = () => Math.min(12, W.base.tier + 1);
  // the Frost Crystal Mine: W.mineAt = when you last emptied it; it holds 12 hours
  const mineHas = () => { const lv = RL('mine'); if (!lv) return 0; if (!W.mineAt) W.mineAt = Date.now(); return Math.floor(mineRate(lv)*Math.min(12, Math.max(0, (Date.now() - W.mineAt)/36e5))); };
  const mineFull = () => RL('mine') ? Math.min(1, Math.max(0, (Date.now() - (W.mineAt || Date.now()))/432e5)) : 0;
  const mineTake = quiet => { const n = Math.round(mineHas()*(X.curM ? X.curM() : 1)); W.mineAt = Date.now(); if (n > 0) { PERM.frost += n; if (!quiet) { addNum(p.x, p.y - 44, '+' + A.fmt(n) + ' 🔷 from the mine', '#64CDF5'); A.sfx('coin'); } } return n; };
  const mineRow = () => RL('mine') ? {e:'⛏️', n:'Frost Crystal Mine · ' + A.fmt(mineHas()) + ' 🔷 ready', d:Math.round(mineFull()*100) + '% full · digs ' + A.fmt(mineRate(RL('mine'))) + ' 🔷 an hour · holds 12 hours', btn:'Collect', ok:mineHas() > 0, fn:() => { mineTake(); save(); }} : null;
  // the Snow Friends Lodge adds teammates right away
  const syncMates = () => { const MI2 = X.mates(); while (mates.length < MI2.n) { const i = mates.length, lv = MI2.lv + RL('barracks'); mates.push({name:(MI2.names[i] || 'Pal'), role:ROLES[i % 3], lv, x:p.x + (i - 1.5)*30, y:p.y + 40, cool:1 + i*.3, heal:12, hp:2 + lv, max:2 + lv, ko:0, face:0, walk:0, throwT:0}); } };
  const buyRoom = (r0, quiet) => { const lv = RL(r0.id), c = roomCost(r0.id, lv); if (!roomOpen(r0) || lv >= roomMax() || !canPay(c)) return false; if (r0.id == 'mine') mineTake(true); pay(c); W.base.rooms[r0.id] = lv + 1;
    if (r0.id == 'lodge') { if (lv + 1 > 3) mates.forEach(m => { m.lv++; m.max++; m.hp++; }); syncMates(); } if (r0.id == 'mine' && lv == 0) W.mineAt = Date.now();
    refreshMax(); if (!quiet) { save(); A.sfx('win'); say('🏗 ' + r0.n + ' is now level ' + (lv + 1) + '! Look how it grew', 2.6); } return true; };
  const celebrate12 = () => { cheerT = 6; shakeV = 10; for (let i = 0; i < 60; i++) { const a = Math.random()*TAU, v = 120 + Math.random()*260; fx.push({x:FORT.x, y:FORT.y - 60, vx:Math.cos(a)*v, vy:Math.sin(a)*v - 120, t:1.6 + Math.random(), col:['#ff5fd2', '#64CDF5', '#F9BF01', '#D5F367', '#ffffff'][i % 5], r:3 + Math.random()*3}); }
    talk([[...NAR, '👑 LEVEL 12 · THE WILDERLAND WINTER KINGDOM! Aurora light pours over Camp Cocoa and every tower rings.', ''], [...MAUF, 'ROYAL GUARD, SALUTE! This is the greatest castle the snow has ever seen. I am so proud I could eat a whole fish. Two fish.', 'happy'], [...NAR, 'You earned the Winter Kingdom Crown (Wilderland avatar hat), the Castle Builder achievement and 10K 🔷.', '']]); };
  const tierUp = quiet => { const T = W.base.tier, nx = TIER_COST[T + 1]; if (!nx || !canPay(nx)) return false; pay(nx); W.base.tier = T + 1; W.base.mile = W.base.mile || {}; const M = MILE[T + 1];
    let got = ''; if (M && !W.base.mile[T + 1]) { W.base.mile[T + 1] = 1; M.fn(); got = ' · Reward: ' + M.d; } X.stat('snowFort', W.base.tier, 'max'); const nr = ROOMS.find(r0 => r0.at == W.base.tier + 1);
    save(); A.sfx('win'); if (W.base.tier == MAXT) celebrate12(); else if (!quiet) say('🏰 Level ' + (W.base.tier + 1) + ': ' + TIER_N[W.base.tier] + '!' + (nr ? ' New room: ' + nr.n : '') + got, 3.6); return true; };
  // everything you could buy right now, cheapest first
  const buyable = () => { const L = []; const nx = TIER_COST[W.base.tier + 1]; if (nx && canPay(nx)) L.push({c:nx, f:() => tierUp(true)}); ROOMS.forEach(r0 => { const lv = RL(r0.id), c = roomCost(r0.id, lv); if (roomOpen(r0) && lv < roomMax() && canPay(c)) L.push({c, f:() => buyRoom(r0, true)}); });
    return L.sort((a, b) => (a.c.frost||0) - (b.c.frost||0) || (a.c.flakes||0) - (b.c.flakes||0)); };
  const upgradeAll = () => { const T0 = W.base.tier; let n = 0; for (let i = 0; i < 400; i++) { const L = buyable(); if (!L.length) break; L[0].f(); n++; } refreshMax(); save();
    if (n) { A.sfx('win'); if (W.base.tier < MAXT || T0 == W.base.tier) say('⚡ ' + n + ' upgrade' + (n == 1 ? '' : 's') + ' bought! Base level ' + (W.base.tier + 1) + ' / 12', 3); } else say('Nothing you can afford yet', 1.6); };
  let canBuyT = 0, canBuyV = false; const canBuy = () => { if (t - canBuyT > .5 || t < canBuyT) { canBuyT = t; canBuyV = buyable().length > 0 || mineFull() >= .5; } return canBuyV; };
  const fortPanel = () => openPanelUI(() => { const T = W.base.tier, nx = TIER_COST[T + 1], M = MILE[T + 1], nr = ROOMS.find(r0 => r0.at == T + 2), any = buyable().length;
    return {title:'🏰 ' + TIER_N[T] + ' · Level ' + (T + 1) + ' / 12', sub:'Rooms give bonuses all over the Snow Kingdom and can grow up to your base level. You have ' + A.fmt(PERM.frost) + ' 🔷 and ' + A.fmt(PERM.bank) + ' ❄.',
      rows:[{e:'⚡', n:'Upgrade all you can afford', d:any ? 'Buys the cheapest upgrades first until you run out' : 'Nothing affordable right now', btn:any ? 'Upgrade all' : '—', ok:!!any, fn:upgradeAll},
        ...(nx ? [{e:'⬆️', n:'Level ' + (T + 2) + ': ' + TIER_N[T + 1], d:'Bigger walls and towers · rooms up to level ' + (T + 2) + (nr ? ' · new room: ' + nr.n : '') + (M && !(W.base.mile || {})[T + 1] ? ' · Reward: ' + M.d : ''), btn:costTxt(nx), ok:canPay(nx), fn:() => tierUp()}] : [{e:'👑', n:'Level 12 · Wilderland Winter Kingdom', d:'Your base is fully upgraded!', btn:''}]),
        ...(mineRow() ? [mineRow()] : []), forgeRow(), ...ROOMS.map(r0 => roomRow(r0, T)),
        {e:'📈', n:'Skills · kingdom level ' + kLv(), d:kPts() + ' skill point' + (kPts() == 1 ? '' : 's') + ' to spend (or press K)', btn:'Open skills', ok:true, fn:() => skillPanel()}]}; });
  const roomRow = (r0, T) => { const lv = RL(r0.id), max = Math.min(12, T + 1), c = roomCost(r0.id, lv), lockB = (r0.at || 1) > T + 1, locked = lockB || (r0.need && !r0.need());
    return {e:r0.e, n:r0.n + ' · Lv ' + lv + '/' + (lockB ? r0.at : max), d:lockB ? 'Unlocks at base level ' + r0.at + ': ' + r0.d(1) : (lv ? r0.d(lv) : 'Not built') + (lv < max && !locked ? ' → next: ' + r0.d(lv + 1) : ''),
      btn:lockB ? '🔒 Base level ' + r0.at : locked ? '🔒 ' + r0.needTxt : lv >= 12 ? 'MAX' : lv >= max ? 'Needs base level ' + (lv + 1) : (lv ? 'Upgrade · ' : 'Build · ') + costTxt(c), ok:!locked && lv < max && canPay(c), fn:() => buyRoom(r0)}; };
  const roomPanel = r0 => openPanelUI(() => ({title:r0.n + ' · ' + TIER_N[W.base.tier] + ' (Level ' + (W.base.tier + 1) + ')', sub:'You have ' + A.fmt(PERM.frost) + ' 🔷 and ' + A.fmt(PERM.bank) + ' ❄. A room can grow up to your base level.',
    rows:[roomRow(r0, W.base.tier), ...(r0.id == 'forge' ? [forgeRow()] : []), ...(r0.id == 'mine' && mineRow() ? [mineRow()] : []), ...(r0.id == 'maproom' ? mrRows() : []), {e:'🏰', n:'Whole base', d:'All rooms, base levels and Upgrade all', btn:'Open', ok:true, fn:fortPanel}]}));
  const forgeRow = () => { const fl = RL('forge'), c0 = roomCost('forge', 0), [r1, r2] = forgeR(fl);
    return fl ? {e:'🔨', n:'Forge gear · ' + GRN[r1] + (r2 > r1 ? ' to ' + GRN[r2] : '') + ' guaranteed', d:'Random slot · upgrade the Forge for rarer gear (Snow grade is fusing only) · equip it in the Snowball menu → Loadout', btn:'Forge · 25 🔷', ok:PERM.frost >= 25, fn:() => { PERM.frost -= 25; const it = give({gear:r1 + Math.floor(Math.random()*(r2 - r1 + 1))}); X.savePerm && X.savePerm(); save(); A.sfx('coin'); say('🔨 Forged: ' + (it ? it.name : 'gear') + (it ? ' (' + GRN[it.rar] + ')' : ''), 3); }}
      : {e:'🔨', n:'Forge gear', d:'You need a Forge first: build it here, then forge gear for 25 🔷', btn:'Build Forge · ' + costTxt(c0), ok:canPay(c0), fn:() => { pay(c0); W.base.rooms.forge = 1; save(); A.sfx('coin'); say('⚒️ Forge built! Now you can forge gear', 2.6); }}; };
  // Map Room travel flags: plant them anywhere in the kingdom from the map, then fast travel to them
  const mrRows = () => { const n = mrFlags(RL('maproom')), F2 = W.mflags || []; return [{e:'📍', n:'Travel flags · ' + F2.length + '/' + n, d:n ? 'Open the map (M) anywhere in the kingdom and tap “Plant a travel flag here”' : 'Map Room level 4 gives your first travel flag', btn:''}]; };
  const GRN = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Snow'];
  const skillPanel = () => openPanelUI(() => ({title:'📈 Level ' + kLv() + ' · ' + kPts() + ' skill point' + (kPts() == 1 ? '' : 's'), sub:'Earn kingdom XP from enemies, bosses, raids and quests. Every 3 levels also gives +1 max heart. Next level at ' + A.fmt(30*kLv()*kLv()) + ' XP (you have ' + A.fmt(W.kxp) + '). ⚪ Snowball regen: ' + regenTxt() + '.',
    rows:SK.map(s2 => { const r = W.sk[s2.id]|0; return {e:s2.e, n:s2.n + ' · rank ' + r, d:(r ? s2.d(r) : 'Not learned') + ' → ' + s2.d(r + 1), btn:'Learn · 1 point', ok:kPts() > 0, fn:() => { W.sk[s2.id] = r + 1; refreshMax(); save(); A.sfx('coin'); }}; })}));
  const SHOP = [{e:'🐟', n:'Bag of 5 treats', d:'For Royal Guard Mau Mau', c:{flakes:250}, fn:() => { W.treats = (W.treats||0) + 5; }},
    {e:'☕', n:'Cocoa (full heal)', d:'Heals you and your team right now (not during boss fights)', c:{flakes:120}, noBoss:1, fn:() => { p.hp = p.max; mates.forEach(m => { m.ko = 0; m.hp = m.max; }); }},
    {e:'🛷', n:'Sled', d:'Ride ×1.4 speed (V)', c:{flakes:1500}, own:'sled'}, {e:'🦌', n:'Reindeer', d:'Ride ×1.65 speed (V) · village level 1', c:{frost:40}, own:'reindeer', lv:1},
    {e:'🏍️', n:'Snowmobile', d:'Ride ×1.95 speed (V) · village level 2', c:{frost:150}, own:'snowmobile', lv:2},
    {e:'🛡️', n:'Royal Guard armor piece', d:'Rare gear · village level 1', c:{frost:60}, lv:1, fn:() => { const it = give({gear:4}); say('🛡️ ' + (it ? it.name : 'Royal Guard armor'), 2.4); }},
    {e:'🧤', n:'Bottomless Mitten', d:'Snowballs come back ×1.5 faster, forever · village level 1', c:{frost:80}, lv:1, perk:'mitten'},
    {e:'🔮', n:'Snow Globe Charm', d:'Snowballs come back ×2 faster, forever · village level 2', c:{frost:220}, lv:2, perk:'globe'},
    {e:'🧣', n:'Spirit scarf (cosmetic gear)', d:'Legendary gear · village level 3', c:{frost:160}, lv:3, fn:() => { const it = give({gear:5}); say('🧣 ' + (it ? it.name : 'Spirit scarf'), 2.4); }}];
  const shopPanel = () => openPanelUI(() => ({title:'🏪 Frostpine Village Shop · village level ' + W.village, sub:'Defend the village from sieges to grow it and unlock more. You have ' + A.fmt(PERM.frost) + ' 🔷 and ' + A.fmt(PERM.bank) + ' ❄.',
    rows:SHOP.map(it => { const owned = it.own && W.mounts[it.own], locked = (it.lv||0) > W.village, perk = it.perk && W[it.perk]; if (perk) return {e:it.e, n:it.n, d:it.d, btn:'✓ Owned', ok:false}; if (it.noBoss && boss) return {e:it.e, n:it.n, d:'No full heals during a boss fight. Stun the boss: it drops hearts', btn:'⚔ Boss fight', ok:false}; return {e:it.e, n:it.n, d:it.d, btn:owned ? (W.mount == it.own && riding ? 'Hop off (V)' : 'Ride (V)') : locked ? '🔒 Village level ' + it.lv : costTxt(it.c), ok:owned ? true : !locked && canPay(it.c),
      fn:() => { if (owned) { if (W.mount == it.own && riding) riding = false; else { W.mount = it.own; riding = true; } save(); A.sfx('blip'); return; } pay(it.c); if (it.own) { W.mounts[it.own] = 1; W.mount = it.own; riding = true; } if (it.perk) { W[it.perk] = 1; say(it.e + ' ' + it.n + ': snowballs come back faster!', 2.6); } if (it.fn) it.fn(); save(); A.sfx('coin'); }}; })}));
  // ---------- VILLAGE SIEGE ----------
  const BELL = {x:28.5*TS, y:115.5*TS}, TSPOT = [[-140, -60], [140, -60], [-140, 90], [140, 90]].map(([a, b]) => ({x:BELL.x + a, y:BELL.y + b}));
  let siege = null;
  Object.assign(FOE, {catapult:{n:'Snow Catapult', hp:8, sp:40, r:20, pts:90, siege:1, lob:1}, ram:{n:'Ice Ram', hp:7, sp:120, r:20, pts:80, siege:1, ram:1}, snowman:{n:'Giant Snowman', hp:22, sp:45, r:26, pts:150, siege:1, melee:2, big:1}});
  BOSS.snowking = {n:'THE SNOWMAN SIEGE KING', hp:240, r:36, intro:'The Snowman Siege King: “Your little bell will be MINE! Catapults, FIRE!”', ai:{walk:35, spread:2, ring:4.5, summon:'ram', summonT:8}};
  const startSiege = () => { if (siege) return; const hpMax = Math.round(60*(1 + .25*RL('defenses'))); siege = {phase:'build', t:20 + 3*RL('beacon'), wave:0, hp:hpMax, max:hpMax, turrets:TSPOT.slice(0, RL('defenses')).map(s2 => ({...s2, cool:1})), guards:[{x:BELL.x - 60, y:BELL.y + 40, cool:1}, {x:BELL.x + 60, y:BELL.y + 40, cool:1.5}, ...(W.recruits ? [{x:BELL.x - 120, y:BELL.y - 10, cool:.8}, {x:BELL.x + 120, y:BELL.y - 10, cool:1.2}] : [])]};
    p.over = RL('infirmary'); foes = []; talk([[...MAUF, 'ROYAL GUARD! Frostpine Village is under siege! Protect the village bell!', 'angry'], [...MAUF, 'You have ' + (20 + 3*RL('beacon')) + ' seconds to build snow turrets at the glowing spots. Then hold them off for 5 waves!', 'angry']]); };
  const siegeEnd = win => { const S2 = siege; siege = null; p.over = 0; foes = foes.filter(f => !FOE[f.k].siege); if (win) { W.village = Math.min(5, W.village + 1); W.siegeWins = (W.siegeWins|0) + 1; const it = give({frost:30 + 10*W.village, flakes:800 + 300*W.village, xp:120, gear:Math.random() < .5 ? 3 : 4}); X.stat('snowSiege', 1, 'add'); save(); A.sfx('win');
      talk([[...MAUF, 'VICTORY! The bell still rings! Frostpine Village is safe!', 'happy'], [...NAR, 'Frostpine Village grew to level ' + W.village + '! The shop has new things. +' + (30 + 10*W.village) + ' Frost Crystals' + (it ? ' · ' + it.name : ''), '']]); }
    else { say('🔔 The bell fell... The village is fine, and you can try again any time', 3.5); save(); } };
  const siegeUpdate = dt => { if (!siege) return; const S2 = siege;
    if (dist(p, BELL) > 1300) { siegeEnd(false); return; }
    if (S2.phase == 'build') { S2.t -= dt; if (S2.t <= 0) { S2.phase = 'fight'; S2.wave = 0; S2.t = 1; } return; }
    S2.t -= dt; const alive = foes.filter(f => f.sw).length;
    if (S2.t <= 0 && alive == 0 && !boss) { if (S2.wave >= 5) { siegeEnd(true); return; } S2.wave++; S2.t = 2 + .3*RL('beacon'); say('⚔ Siege wave ' + S2.wave + ' of 5!', 2.2);
      const n = 3 + S2.wave*2; for (let i = 0; i < n; i++) { const a = -Math.PI/2 + (Math.random() - .5)*2.2, r = 620 + Math.random()*120, k = ['goon', 'ram', 'pup', 'catapult', 'snowman'][i % (S2.wave >= 3 ? 5 : S2.wave >= 2 ? 4 : 3)]; spawnFoe(k, BELL.x + Math.cos(a)*r, BELL.y + Math.sin(a)*r); const f = foes[foes.length - 1]; if (f) { f.sw = 1; f.hurt = 99; } }
      if (S2.wave == 5) { LAIR.snowking = {x:BELL.x, y:BELL.y - 330}; spawnBoss('snowking'); } }
    for (const T of [...S2.turrets, ...S2.guards]) { T.cool -= dt; if (T.cool > 0) continue; const isTur = S2.turrets.includes(T); let tg = null, bd = (T.guard ? 320 : 380)*(1 + .05*RL('beacon')); for (const f of foes) { const d3 = dist(f, T); if (d3 < bd) { bd = d3; tg = f; } } if (!tg && boss && dist(boss, T) < 380*(1 + .05*RL('beacon'))) tg = boss;
      if (tg) { const dB = isTur ? 1 + .15*Math.max(0, RL('defenses') - 4) : 1; T.cool = (S2.guards.includes(T) ? 1.4 : 1)/dB; const a = Math.atan2(tg.y - T.y, tg.x - T.x); balls.push({x:T.x, y:T.y - 14, vx:Math.cos(a)*480, vy:Math.sin(a)*480, mine:1, dmg:X.armM()*.7*dB, r:6, life:1, hits:[], col:'#e8f8ff', team:1}); } else T.cool = .3; }
    if (S2.hp <= 0) siegeEnd(false); };
  const bellHit = n => { if (!siege) return; siege.hp = Math.max(0, siege.hp - n); siege.hitT = .3; };
  // ---------- RAID DUNGEONS (party of 4: you + up to 3 teammates) ----------
  const RW = 40, RAIDS = [
    {id:'catacombs', n:'The Frozen Catacombs', e:'⚰️', col:'#5a6a8a', mini:'r_knight', boss:'r_warden'},
    {id:'labyrinth', n:'The Spirit Labyrinth', e:'🌀', col:'#3a5a8a', mini:'r_lantern', boss:'r_queen', need:() => (W.sp|0) >= 2},
    {id:'citadel', n:'Storm Peak Citadel', e:'🌩️', col:'#4a4a6a', mini:'r_sentinel', boss:'r_titan', need:() => (W.sp|0) >= 5},
    {id:'vault', n:'The Yeti King’s Vault', e:'🏔', col:'#6a8aa0', mini:'r_vgolem', boss:'r_yeti', need:() => !!W.down.yeti},
    {id:'library', n:'Loki’s Sunken Library', e:'📚', col:'#3a2a5a', mini:'r_book', boss:'loki2', need:() => !!W.bau}];
  Object.assign(BOSS, {
    r_knight:{n:'FROSTBONE KNIGHT', hp:160, r:26, intro:'The Frostbone Knight raises a frozen shield.', ai:{walk:70, spread:1.8, dash:1}}, r_warden:{n:'THE FROST WARDEN', hp:420, r:36, phases:3, intro:'The Frost Warden: “None may wake the catacombs.”', ai:{walk:35, ring:3.4, summon:'bat', summonT:8, spiral:1, spread:2.4}},
    r_lantern:{n:'THE LOST LANTERN', hp:170, r:28, intro:'A lantern drifts closer, flickering angrily.', ai:{walk:60, ring:3, fade:1}}, r_queen:{n:'THE WISP QUEEN', hp:440, r:32, phases:3, intro:'The Wisp Queen: “Stay... stay in my maze forever...”', ai:{walk:50, summon:'wisp', summonT:7, spiral:1, spread:2, fade:1}},
    r_sentinel:{n:'STORM SENTINEL', hp:180, r:30, intro:'A sentinel made of thunderclouds.', ai:{walk:40, rock:2.4, burst:1}}, r_titan:{n:'THE STORM TITAN', hp:480, r:42, phases:3, intro:'The Storm Titan: “I AM THE THUNDER!”', ai:{walk:30, ring:3, rock:2.6, summon:'stormling', summonT:9, burst:1}},
    r_vgolem:{n:'VAULT GOLEM', hp:190, r:34, intro:'A golem made of gold coins and ice.', ai:{walk:30, rock:2, ring:4}}, r_yeti:{n:'THE GOLDEN YETI KING', hp:500, r:42, phases:3, intro:'The Golden Yeti King: “MY GOLD! MY MOUNTAIN! MY VAULT! ROOOAR!”', ai:{walk:60, rock:1.8, dash:1, summon:'yeti', summonT:9, ring:4}},
    r_book:{n:'LIVING SPELLBOOK', hp:170, r:26, intro:'A spellbook flaps open and starts reading YOU.', ai:{walk:55, spread:1.6, burst:1}}, loki2:{n:'EMPOWERED LOKI', hp:600, r:32, phases:4, intro:'Loki: “Welcome to my library! I’ve been studying. A LOT. And there are no sticks down here!”'}});
  const MODS = [{n:'Slippery Floors', d:'the floors are icy', ice:1}, {n:'Swarming Minions', d:'bosses call twice as many helpers', swarm:1}, {n:'Hard Hitters', d:'enemies hit twice as hard', dmg:2}, {n:'Speedy Snowballs', d:'enemy snowballs fly faster', shot:1.35}, {n:'Treasure Week', d:'double raid loot', loot:2}];
  const weekNo = () => Math.floor((Date.now() + 4*864e5) / (7*864e5)), weekMods = () => { const w = weekNo(); return [MODS[w % MODS.length], MODS[(w*3 + 1) % MODS.length]].filter((m, i, a) => a.indexOf(m) == i); };
  if (W.raidW != weekNo()) { W.raidW = weekNo(); W.raidClr = {}; }   // weekly raid reset
  let raid = null; const RM = new Uint8Array(RW*N);
  { const set2 = (x, y, v) => { if (x >= 0 && y >= 0 && x < RW && y < N) RM[y*RW + x] = v; }; RM.fill(WALL);
    RAIDS.forEach((R0, r) => { const y0 = r*28; for (const [a, b] of [[1, 8], [10, 17], [19, 26]]) for (let y = y0 + a; y <= y0 + b; y++) for (let x = 1; x <= RW - 2; x++) set2(x, y, FLOOR); for (const dy of [9, 18]) for (let x = 18; x <= 21; x++) set2(x, y0 + dy, 16);
      for (let k = 0; k < 6; k++) { const px2 = 6 + (k*5 + r*3) % 28, py2 = y0 + 11 + (k*3) % 6; set2(px2, py2, ROCK); } }); }
  const RDOOR = 16; SOLID[RDOOR] = 1; MINI[RDOOR] = '#7a5ab0';
  const raidY0 = () => raid ? raid.r*28 : 0, rpx = (x, y) => ({x:(N + x + .5)*TS, y:(raidY0() + y + .5)*TS});
  const PLATE_E = ['❄', '🔥', '🌙', '⭐'];
  const enterRaid = R0 => { const r = RAIDS.indexOf(R0); raid = {R:R0, r, mods:weekMods(), open:0, order:[0, 1, 2, 3].sort(() => Math.random() - .5), step:0, mini:0, bossOn:0, loot:0, plates:[[8, 3], [16, 6], [24, 3], [32, 6]].map(([x, y], i) => ({i, x, y}))};
    const st = rpx(3, 4); p.x = st.x; p.y = st.y; p.vx = p.vy = 0; riding = false; foes = []; balls = []; boss = null; tornado = null; mateHome(); mau.x = p.x - 40; mau.y = p.y + 10; bauF.x = p.x - 30; bauF.y = p.y + 30;
    for (let i = 0; i < 3; i++) { const q = rpx(14 + i*7, 5); spawnFoe(['bat', 'imp', 'golem'][i], q.x, q.y); }
    talk([[...NAR, R0.e + ' ' + R0.n + ' · this week: ' + raid.mods.map(m => m.n + ' (' + m.d + ')').join(' · '), ''], [...NAR, 'Floor 1: step on the rune plates in the order shown on the wall. Floor 2: a guardian. Floor 3: the raid boss.', '']]); };
  const leaveRaid = msg2 => { raid = null; boss = null; foes = []; balls = []; respawn(); if (msg2) say(msg2, 3); };
  const raidTile = (tx, ty) => RM[ty*RW + (tx - N)];
  const raidUpdate = dt => { if (!raid) return; const ry = Math.floor(p.y/TS) - raidY0();
    if (raid.open == 0) for (const pl of raid.plates) { const q = rpx(pl.x, pl.y); if (dist(q, p) < 30 && raid.lastPlate !== pl.i) { raid.lastPlate = pl.i; if (raid.order[raid.step] == pl.i) { raid.step++; A.sfx('coin'); splat(q.x, q.y, 10, '#9fe8ff'); if (raid.step >= 4) { raid.open = 1; A.sfx('win'); say('🚪 The rune door opens! Floor 2', 2.6); } } else { raid.step = 0; A.sfx('bad'); say('✖ Wrong rune! The plates reset… and something woke up', 2.4); for (let i = 0; i < 2; i++) { const s2 = rpx(10 + i*20, 4); spawnFoe('imp', s2.x, s2.y); } } } }
    if (raid.lastPlate != null && raid.plates.every(pl => dist(rpx(pl.x, pl.y), p) > 40)) raid.lastPlate = null;
    if (ry >= 10 && ry <= 17 && !raid.mini) { raid.mini = 1; LAIR[raid.R.mini] = rpx(20, 14); spawnBoss(raid.R.mini); }
    if (ry >= 19 && !raid.bossOn) { raid.bossOn = 1; LAIR[raid.R.boss] = rpx(20, 23); spawnBoss(raid.R.boss); if (raid.R.boss == 'loki2') sticks = []; } };
  const raidBossDown = B => { if (!raid) return false; if (B.k == raid.R.mini) { raid.open = 2; give({frost:15, flakes:400, xp:120}); say('🚪 The guardian falls! The way down opens · Floor 3', 3); return true; }
    if (B.k == raid.R.boss) { raid.loot = 1; const first = !W.raidClr[raid.R.id], mul = raid.mods.some(m => m.loot) ? 2 : 1; W.raidClr[raid.R.id] = 1; W.raids[raid.R.id] = (W.raids[raid.R.id]|0) + 1; X.stat('snowRaids', 1, 'add');
      const it = give({frost:(first ? 80 : 25)*mul, flakes:(first ? 3000 : 800)*mul, xp:300, score:8000, gear:first ? 5 : 4}); W.treats = (W.treats||0) + 5*mul; save(); A.sfx('win');
      talk([[...NAR, '🏆 ' + raid.R.n + ' cleared!' + (first ? ' (first clear this week!)' : ''), ''], [...NAR, 'Loot: +' + (first ? 80 : 25)*mul + ' Frost Crystals, +' + A.fmt((first ? 3000 : 800)*mul) + ' snowflakes, +' + 5*mul + ' Mau Mau treats' + (it ? ', ' + it.name : '') + '. Raid title progress: ' + (W.raids[raid.R.id]) + ' clear' + (W.raids[raid.R.id] == 1 ? '' : 's') + '.', '']], () => leaveRaid('🏕 Back at Camp Cocoa with your raid loot!')); return true; }
    return false; };
  const raidPanel = () => openPanelUI(() => ({title:'⚔️ Raid Board · weekly raids', sub:'Party of 4: you, your teammates, Mau Mau and Bau Bau. This week: ' + weekMods().map(m => m.n).join(' + ') + '. First clear each week gives the big loot.',
    rows:RAIDS.map(R0 => { const ok = !R0.need || R0.need(); return {e:R0.e, n:R0.n + (W.raidClr[R0.id] ? ' ✓ cleared this week' : ''), d:ok ? 'Boss: ' + BOSS[R0.boss].n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()) + ' · cleared ' + (W.raids[R0.id]|0) + '×' : '🔒 ' + {labyrinth:'Reach Spirits of the Snow chapter 2', citadel:'Reach chapter 5', vault:'Beat the Yeti King', library:'Rescue Bau Bau'}[R0.id], btn:ok ? 'Enter raid' : 'Locked', ok, fn:() => { panel = null; enterRaid(R0); }}; })}));
  // where the base, raid board, shop and siege bell are
  const FORT = {x:57.5*TS, y:93.6*TS}, BOARD = {x:44.5*TS, y:90.5*TS};
  const p3Things = L => { L.push({x:FORT.x, y:FORT.y, n:TIER_N[W.base.tier] + ' · Lv ' + (W.base.tier + 1), f:fortPanel}); if (A.snowCastle) for (const r0 of ROOMS) { const sp = A.snowCastle.SPOTS[r0.id]; if (sp && (RL(r0.id) || (r0.at || 1) <= W.base.tier + 1)) L.push({x:(sp[0] + .5)*TS, y:(sp[1] + .9)*TS, n:(RL(r0.id) ? '' : 'Build ') + r0.n, f:() => roomPanel(r0)}); } if (!(SG && SG.warTable)) L.push({x:BOARD.x, y:BOARD.y, n:'Raids', f:raidPanel});
    L.push({x:24.5*TS, y:113.5*TS, n:'Shop', f:shopPanel}); if (!siege) L.push({x:BELL.x, y:BELL.y, n:'Defend', f:startSiege});
    if (siege && siege.phase == 'build') TSPOT.forEach(s2 => { if (!siege.turrets.some(T => T.x == s2.x && T.y == s2.y)) L.push({x:s2.x, y:s2.y, n:'Build 120 ❄', f:() => { if (PERM.bank < 120) { say('Need 120 snowflakes', 1.6); A.sfx('bad'); return; } PERM.bank -= 120; siege.turrets.push({...s2, cool:1}); A.sfx('coin'); }}); });
    if (raid && raid.open == 0) L.push({x:rpx(2, 2).x, y:rpx(2, 2).y, n:'Leave raid', f:() => leaveRaid('🏕 You left the raid')});
    return L; };
  const p3Update = dt => { siegeUpdate(dt); raidUpdate(dt);
    if (p.over && !siege && !rOn()) p.over = 0;   // Infirmary gold hearts only last for one siege or raid
    // pantry: treats when you rest at camp
    if (RL('pantry') && dist(p, FIRE) < 200 && Date.now() - (W.pantryAt||0) > 5*60e3) { W.pantryAt = Date.now(); W.treats = (W.treats||0) + RL('pantry'); addNum(p.x, p.y - 40, '+' + RL('pantry') + ' 🐟 from the pantry', '#c4601a'); save(); }
    // level ups
    const lv = kLv(); if (lv > (W.klv || 1)) { W.klv = lv; X.stat('snowKLv', lv, 'max'); refreshMax(); say('📈 Kingdom level ' + lv + '! +1 skill point (K)' + ((lv - 1) % 3 == 0 ? ' · +1 max heart' : ''), 3); A.sfx('win'); save(); } };
  const p3Draw = () => {
    if (A.snowCastle && onScreen(50*TS, 86*TS, 1400)) A.snowCastle.draw(g, {TS, t, tier:W.base.tier, RL, M, N, WALL, onScreen, low:low(), rr, font:A.font, open:id => { const r0 = ROOMS.find(q => q.id == id); return !!r0 && (r0.at || 1) <= W.base.tier + 1; }, dot:id => id == 'mine' && mineFull() >= .5});
    // your castle's keep: bigger and fancier every base level; a red dot when you can afford an upgrade
    if (onScreen(FORT.x, FORT.y, 260)) { const T = W.base.tier, fx = FORT.x, fy = FORT.y + 20; if (A.snowCastle && A.snowCastle.keep) A.snowCastle.keep(g, fx, fy, T, t, low());
      const lb = TIER_N[T] + ' · Lv ' + (T + 1) + '/12'; g.font = '800 10px ' + A.font; const lw = g.measureText(lb).width + 14; g.fillStyle = 'rgba(20,32,74,.78)'; rr(g, fx - lw/2, fy + 7, lw, 15, 7); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(lb, fx, fy + 18);
      if (canBuy()) { const dx = fx + lw/2 - 2, dy = fy + 7, k = 1 + .15*Math.sin(t*6); g.fillStyle = '#FF4539'; g.beginPath(); g.arc(dx, dy, 6*k, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); } }
    if (!(SG && SG.warTable) && onScreen(BOARD.x, BOARD.y)) { g.fillStyle = '#8D5B1D'; g.fillRect(BOARD.x - 2, BOARD.y - 30, 4, 34); g.fillStyle = '#c8a070'; rr(g, BOARD.x - 22, BOARD.y - 50, 44, 26, 4); g.fill(); g.fillStyle = '#14204a'; g.font = '800 9px ' + A.font; g.textAlign = 'center'; g.fillText('⚔ RAIDS', BOARD.x, BOARD.y - 33); }
    // village bell, turrets, guards, siege bar; the village grows with every siege won
    if (onScreen(BELL.x, BELL.y, 300)) { g.fillStyle = '#8D5B1D'; g.fillRect(BELL.x - 22, BELL.y - 40, 4, 44); g.fillRect(BELL.x + 18, BELL.y - 40, 4, 44); g.fillRect(BELL.x - 24, BELL.y - 44, 48, 6); const sw2 = siege && siege.hitT > 0 ? Math.sin(t*40)*.3 : Math.sin(t*1.5)*.05;
      g.save(); g.translate(BELL.x, BELL.y - 38); g.rotate(sw2); g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(-12, 22); g.quadraticCurveTo(-12, 0, 0, 0); g.quadraticCurveTo(12, 0, 12, 22); g.closePath(); g.fill(); g.restore();
      for (let i = 0; i < W.village; i++) { const bx = BELL.x - 160 + i*80, by = BELL.y - 120; g.fillStyle = '#8D5B1D'; g.fillRect(bx, by, 3, 40); g.fillStyle = ['#c8102e', '#2f5fd0', '#00B451', '#F9BF01', '#EA55AB'][i]; g.beginPath(); g.moveTo(bx + 3, by); g.lineTo(bx + 22, by + 6); g.lineTo(bx + 3, by + 12); g.fill(); }
      if (siege) { if (siege.phase == 'build') TSPOT.forEach(s2 => { if (!siege.turrets.some(T => T.x == s2.x)) { g.strokeStyle = 'rgba(100,205,245,' + (.5 + .3*Math.sin(t*5)) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(s2.x, s2.y, 22, 0, TAU); g.stroke(); } });
        siege.turrets.forEach(T => { g.fillStyle = '#e8f4ff'; rr(g, T.x - 14, T.y - 24, 28, 28, 6); g.fill(); g.strokeStyle = '#9ec4e8'; g.stroke(); g.fillStyle = '#5a7aa0'; g.fillRect(T.x - 3, T.y - 32, 6, 10); });
        siege.guards.forEach(G => penguin(G.x, G.y));
        const bw = 160; g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, BELL.x - bw/2, BELL.y + 12, bw, 10, 5); g.fill(); g.fillStyle = siege.hp < siege.max/3 ? '#FF4539' : '#00B451'; rr(g, BELL.x - bw/2, BELL.y + 12, bw*siege.hp/siege.max, 10, 5); g.fill(); } }
    // raid wing: rune plates, the order on the wall, loot
    if (raid) { raid.plates.forEach(pl => { const q = rpx(pl.x, pl.y), lit = raid.open > 0 || raid.order.indexOf(pl.i) < raid.step; g.fillStyle = lit ? 'rgba(159,232,255,.85)' : 'rgba(80,90,130,.85)'; rr(g, q.x - 20, q.y - 14, 40, 28, 8); g.fill(); g.font = '18px ' + A.font; g.textAlign = 'center'; g.fillText(PLATE_E[pl.i], q.x, q.y + 6); });
      if (raid.open == 0) { const q = rpx(20, 1.4); g.fillStyle = 'rgba(20,32,74,.85)'; rr(g, q.x - 120, q.y - 16, 240, 30, 10); g.fill(); g.fillStyle = '#fff'; g.font = '800 13px ' + A.font; g.textAlign = 'center'; g.fillText('RUNE ORDER: ' + raid.order.map(i => PLATE_E[i]).join('  ') + '   (' + raid.step + '/4)', q.x, q.y + 4); } }
    // your mount
    if (riding && W.mount && dead <= 0) { const m = W.mount, skC = c => W.mskin == 'aurora' ? '#8a5ae0' : W.mskin == 'crystal' ? '#9fe8ff' : c; if (W.mskin && W.mskin != 'none' && !low() && Math.random() < .5) fx.push({x:p.x + (Math.random() - .5)*30, y:p.y + 16, vx:-p.vx*.2, vy:-10, t:.6, col:W.mskin == 'aurora' ? 'rgba(255,95,210,.8)' : 'rgba(200,245,255,.9)', r:2.5}); g.save(); g.translate(p.x, p.y + 10); if (m == 'sled') { g.fillStyle = skC('#a0522d'); rr(g, -18, 0, 36, 8, 3); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-20, 10); g.lineTo(22, 10); g.quadraticCurveTo(28, 10, 26, 4); g.stroke(); }
      else if (m == 'reindeer') { g.fillStyle = skC('#a0703a'); g.beginPath(); g.ellipse(0, 4, 20, 9, 0, 0, TAU); g.fill(); g.fillRect(-14, 8, 4, 10); g.fillRect(10, 8, 4, 10); g.beginPath(); g.ellipse(20, -6, 7, 6, 0, 0, TAU); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(20, -12); g.lineTo(16, -24); g.moveTo(22, -12); g.lineTo(28, -24); g.stroke(); g.fillStyle = '#FF4539'; g.beginPath(); g.arc(27, -6, 2.5, 0, TAU); g.fill(); }
      else { g.fillStyle = skC('#c8102e'); rr(g, -20, -4, 40, 14, 6); g.fill(); g.fillStyle = '#14204a'; g.fillRect(-22, 10, 44, 3); g.fillStyle = '#ffe066'; g.beginPath(); g.arc(20, 2, 3, 0, TAU); g.fill(); }
      g.restore(); } };
  refreshMax(); p.hp = p.max; mates.forEach(m => { m.lv += RL('barracks'); m.max += RL('barracks'); m.hp = m.max; });
  const roll = () => { if ((p.rollCd||0) > 0 || dead > 0) return; const kk = K.k; let mx = ((kk.ArrowRight || kk.d || kk.D) ? 1 : 0) - ((kk.ArrowLeft || kk.a || kk.A) ? 1 : 0), my = ((kk.ArrowDown || kk.s || kk.S) ? 1 : 0) - ((kk.ArrowUp || kk.w || kk.W) ? 1 : 0); const a = mx || my ? Math.atan2(my, mx) : p.face;
    p.roll = .26; p.rollCd = 1; p.vx = Math.cos(a)*640; p.vy = Math.sin(a)*640; p.inv = Math.max(p.inv, .32); A.tone(260, .06, 'triangle', .03); };
  let holdMates = false, cheerT = 0, shakeV = 0;
  // =====================================================================================================
  // SIDE STORIES — quest chains that run alongside the main story (after Loki / after Spirits of the Snow).
  // Each chain is a list of steps: go (reach a place and talk), items (find things), chase, boss, waves, course.
  // Saved in W.sq (current step), W.sqD (finished), W.sqI (items found), W.sqR (rewards granted, once each).
  // =====================================================================================================
  W.sq = W.sq || {}; W.sqD = W.sqD || {}; W.sqI = W.sqI || {}; W.sqR = W.sqR || {};
  const spot = (tx, ty) => { for (let r = 0; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) != r) continue; const x = tx + dx, y = ty + dy, v = tileAt(x, y); if (!SOLID[v] && v != HOLE && v != WATER && x >= 0 && x < N) return {x:(x + .5)*TS, y:(y + .5)*TS}; } return {x:(tx + .5)*TS, y:(ty + .5)*TS}; };
  const RACQ = ['Rocco the Raccoon', 'rac'], BARDQ = ['Wren the Frozen Bard', 'bard'], LOKQ = ['Loki', 'loki'], VILQ = ['Villager', 'pip'], TEAMQ = n => [n, 'kid:' + n];
  const TEAMCOL = {Maya:'#2fa8e0', Leo:'#64CDF5', Ava:'#ff9ad5', Sam:'#2fa8e0'};
  const mateIdx = n => mates.findIndex(m => m.name == n);
  const afterLoki = () => !!W.bau && (W.loki|0) > 0, afterSpirits = () => (W.sp|0) >= 6;
  // ---------- the chains ----------
  const SQ = {
    heist:{e:'🍪', n:'The Great Snack Heist', who:'Mau Mau', tone:'funny', giver:[53, 89], avail:() => afterLoki() && !!W.mau, lock:'Defeat Loki and free Mau Mau first', reward:'Mau Mau’s Golden Spoon (food buffs last twice as long) · title “Snack Detective”',
      intro:[[...MAUF, 'HERO. Code red. CODE RED. Someone has been stealing from the Royal Guard pantry.', 'angry'], [...MAUF, 'Three fish. Two cocoa biscuits. One entire wheel of snow cheese. GONE.', 'frightened'], [...MAUF, 'As Royal Guard, I am opening a very serious investigation. Detective Mau Mau, on the case.', 'happy']],
      steps:[
        {k:'items', g:'Search Camp Cocoa for clues', items:[
          {at:[51, 90], e:'🍪', line:[[...MAUF, 'Clue one: cookie crumbs. Small ones. *sniff* ...Chocolate chip. *crunch* — I mean. Evidence. I have secured the evidence.', 'happy']]},
          {at:[57, 84], e:'🐾', line:[[...MAUF, 'Tiny hand prints. Little fingers. Five of them. Who has HANDS and steals SNACKS?', 'surprised']]},
          {at:[47, 85], e:'🧀', line:[[...MAUF, 'A bite mark in the cheese wheel. ...Hm. That one might be mine, actually. From earlier. For testing.', 'sad']]},
          {at:[49, 92], e:'🎭', line:[[...MAUF, 'A tiny black mask! The thief wears a MASK. This is the most serious crime the kingdom has ever seen.', 'angry'], [...MAUF, 'Footprints lead west, toward Whisperpine Forest. After them! ...Right after I finish this biscuit.', 'happy']]}]},
        {k:'chase', g:'Chase the masked thief toward the forest', path:[[42, 85], [38, 79], [33, 73], [26, 68], [21, 64]], e:'🦝', done:[[...RACQ, 'Eep! Okay, okay! You caught me! Nobody catches Rocco!', 'surprised'], [...RACQ, '...Except you, apparently. Boss! BOSS! We got company!', 'frightened']]},
        {k:'boss', g:'Defeat the Raccoon Bandit King at the forest hideout', boss:'sq_raccoon', at:[19, 61], done:[[...RACQ, 'Fine, FINE! We give up! We were just hungry. Winter is long and the forest is empty.', 'sad'], [...MAUF, '...Hungry? You were hungry?', 'surprised'], [...MAUF, 'Hmph. The Royal Guard does not forgive thieves. ...But the Royal Guard does share snacks. Come by the camp. Bring plates.', 'happy']]},
        {k:'go', g:'Report back to the Royal Guard pantry at Camp Cocoa', at:[53, 89], act:'Report', done:[[...MAUF, 'Case closed! The raccoons now have a weekly snack ration and a job: Assistant Pantry Guards.', 'happy'], [...MAUF, 'For your excellent detective work, you get the highest honor of the Royal Guard: my Golden Spoon.', 'peaceful'], [...MAUF, 'Food makes you stronger, and with this spoon, it lasts TWICE as long. Use it wisely. And often.', 'happy']]}],
      finish:() => { W.spoon = 1; give({frost:40, flakes:1500, xp:150}); X.stat('sqHeist', 1, 'max'); return '🥄 Mau Mau’s Golden Spoon: food buffs last twice as long · title “Snack Detective”'; }},
    trials:{e:'🛡️', n:'Trials of the Royal Guard', who:'Mau Mau', tone:'funny', giver:[47, 91], avail:() => afterLoki() && !!W.mau, lock:'Defeat Loki and free Mau Mau first', reward:'Royal Guard armor for you · Royal Guard recruits help in village sieges · title “Royal Guard”',
      intro:[[...MAUF, 'Hero. You have fought bravely. You have eaten bravely. I think... you are ready.', 'peaceful'], [...MAUF, 'Ready to try out for THE ROYAL GUARD. Four trials. Obstacle course, shield drills, night watch, and a duel. With me.', 'happy'], [...MAUF, 'Do not worry. I will go easy on you. (I will not go easy on you.)', 'angry']],
      steps:[
        {k:'course', g:'Trial 1: run the obstacle course through every flag in time', pts:[[47, 88], [42, 86], [40, 81], [44, 77], [50, 76], [56, 79], [58, 84], [54, 92], [48, 94]], time:55, done:[[...MAUF, 'Fast feet! The Royal Guard approves. Mostly of your feet.', 'happy']]},
        {k:'waves', g:'Trial 2: shield drills — hold the training yard against the practice squad', at:[47, 91], waves:[['goon', 'goon', 'goon'], ['goon', 'pup', 'goon', 'pup'], ['pup', 'pup', 'goon', 'goon', 'imp']], done:[[...MAUF, 'You held the line! That is what the shield is for. Also for snacks. It is a very good tray.', 'happy']]},
        {k:'waves', g:'Trial 3: night watch — guard the lookout until dawn', at:[50, 78], night:1, waves:[['wisp', 'wisp', 'stormling'], ['wisp', 'wisp', 'stormling', 'wisp'], ['stormling', 'stormling', 'wisp', 'wisp', 'wisp']], done:[[...MAUF, 'The sun is up. You did not fall asleep once. I fell asleep twice. Do not tell anyone.', 'surprised']]},
        {k:'boss', g:'Final trial: duel Royal Guard Mau Mau in the camp arena', boss:'sq_mau', at:[52, 81], done:[[...MAUF, '*puff* *puff* ...Enough! I yield! You have bested the Royal Guard.', 'surprised'], [...MAUF, 'Kneel, hero. ...Okay, you can stand up. That is the ceremony. It is short because I am tired.', 'peaceful']]}],
      finish:() => { W.rgArmor = 1; W.outfit = 'guard'; W.recruits = 1; give({frost:50, flakes:2000, xp:200}); X.stat('sqTrials', 1, 'max'); return '🛡️ You are a Royal Guard! Royal Guard armor (change outfits in the journal, J) · 2 recruits join every village siege'; }},
    lokiball:{e:'🎾', n:'Loki’s Lost Ball', who:'Loki', tone:'mysterious', giver:[83, 15], avail:afterLoki, lock:'Defeat Loki first', reward:'Loki’s Ball: throw it (B) and enemies chase it instead of you',
      intro:[[...NAR, '*The Shadow Castle is empty now. Snow drifts through the broken windows. In the corner of the throne room, something small is half-buried in the snow.*', ''], [...NAR, '*A chewed-up leather collar with a tag: LOKI · GOOD BOY. And a note in shaky handwriting: “I lost my ball. The cold voice said it could help me find it.”*', ''], [...BAUF, '...Loki was a dog. A normal, happy dog. What happened to him?', 'sad']],
      steps:[
        {k:'items', g:'Find pieces of Loki’s past around the kingdom', items:[
          {at:[18, 64], e:'🐾', line:[[...NAR, '*Old paw prints under the pines, frozen in the ice. Big, happy, bouncing ones.*', ''], [...BAUF, 'He used to play here. You can tell from how they zig-zag. Happy dogs never walk straight.', 'peaceful']]},
          {at:[78, 70], e:'📷', line:[[...NAR, '*A frozen photograph: a golden retriever with a red ball in his mouth, sitting on a lake shore, tail a blur.*', ''], [...BAUF, 'That’s him. That’s Loki. Look how happy he is.', 'sad']]},
          {at:[48, 26], e:'❄️', line:[[...NAR, '*A crack in the rock, where the frost is darker than it should be. It hums.*', ''], [...NAR, '*A whisper in the ice: “Take the cold, little dog. The cold will find your ball for you.”*', ''], [...BAUF, 'Someone tricked him. Someone small... and very, very cold.', 'frightened']]},
          {at:[20, 22], e:'🎾', line:[[...NAR, '*Deep in the Crystal Caves, wedged between two glowing crystals: a faded red ball, chewed soft at one end.*', ''], [...BAUF, 'His ball! It was here all along. But it’s covered in dark frost... something is guarding it.', 'surprised']]}]},
        {k:'boss', g:'Defeat the Dark Frost that clings to Loki’s ball in Howling Pass', boss:'sq_frost', at:[48, 24], done:[[...NAR, '*The dark frost shrieks and scatters. For a moment you hear a voice, bored and far away: “Hmph. A toy. How dull.” Then nothing.*', ''], [...BAUF, 'The ball is clean now. Just a ball. A good ball.', 'peaceful'], [...NAR, '🎾 You can throw Loki’s Ball (press B). Enemies can’t resist chasing it.', '']]},
        {k:'go', g:'(Optional) Return the ball to Loki’s empty castle', at:[83, 15], act:'Return the ball', optional:1, done:[[...NAR, '*You set the red ball on the empty throne. The snow stops falling. A golden shape steps out of the shadows.*', ''], [...LOKQ, '...My ball? You found my ball?', 'surprised'], [...LOKQ, 'I... I remember now. I just wanted my ball back. The cold voice promised. It lied.', 'sad'], [...LOKQ, 'I’m sorry. For the castle. For the storms. For all of it. ...Can I keep being a good boy now?', 'sad'], [...BAUF, 'Yes, Loki. You can.', 'peaceful'], [...LOKQ, 'Here. I have a spare one. Every good dog has a spare. Throw it for me sometime?', 'happy']]}],
      // the ball is earned after the boss step; returning it is an optional ending
      stepDone:(i) => { if (i == 1) { W.lball = 1; save(); } if (i == 2) { W.lokiReformed = 1; } },
      finish:() => { W.lball = 1; give({frost:45, flakes:1600, xp:180}); X.stat('sqLoki', 1, 'max'); return W.lokiReformed ? '🎾 Loki is a good boy again · Loki’s Ball is yours (B)' : '🎾 Loki’s Ball is yours (press B)'; }},
    baumem:{e:'📔', n:'Bau Bau’s Memories', who:'Bau Bau', tone:'quiet', giver:[127, 68], avail:afterSpirits, lock:'Finish Spirits of the Snow first', reward:'A memory album in the Hall of Paws · a Bau Bau outfit',
      intro:[[...BAUF, 'I found something in my old blanket. A whisker. One of Minccino’s, I think. Long and white.', 'peaceful'], [...BAUF, 'It made me remember things. Little things. Will you walk with me? I want to visit the places from when we were small.', 'sad']],
      steps:[
        {k:'items', g:'Visit the places Bau Bau remembers', items:[
          {at:[27, 113], e:'🪟', line:[[...BAUF, 'The warm window. Minccino always got the sunny spot first. He’d move over for me, though. Every time.', 'peaceful']]},
          {at:[120, 35], e:'🚗', line:[[...BAUF, 'The driveway. Chao Chao used to race the leaves here. He always won. Even against the wind.', 'peaceful']]},
          {at:[110, 84], e:'🌿', line:[[...BAUF, 'The fence with the soft grass. We napped here in a pile, the three of us. Minccino purred so loud the birds flew off.', 'peaceful']]},
          {at:[52, 94], e:'🧶', line:[[...BAUF, 'And this... our blanket. Chao Chao pulled every thread out of one corner. Minccino tried to put them back.', 'sad'], [...BAUF, 'Let’s go to the Hall of Paws. I want to put these somewhere safe.', 'peaceful']]}]},
        {k:'go', g:'Bring the memories to the Hall of Paws', at:[127, 66], act:'Remember', done:[[...BAUF, 'I made an album. Every memory, one page each. So I don’t forget the good parts.', 'peaceful'], [...MINCQ, '(a soft purr in the candlelight)', 'peaceful'], [...BAUF, 'Thank you for walking with me. ...Here. You should have something to remember us by too.', 'happy']]}],
      finish:() => { W.album = 1; W.outfits = {...(W.outfits || {}), bau:1}; give({frost:35, flakes:1200, xp:140}); X.stat('sqBau', 1, 'max'); return '📔 The memory album is in the Hall of Paws · Bau Bau outfit unlocked (journal, J)'; }},
    mowtale:{e:'🏷️', n:'The Cat Nobody Knew', who:'Little Mow', tone:'quiet', giver:[114, 50], avail:afterSpirits, lock:'Finish Spirits of the Snow first', reward:'Little Mow’s name tag in the Hall of Paws · a calm blue spirit trail',
      intro:[[...MOWQ, '...mow?', 'sad'], [...NAR, '*Little Mow’s spirit waits by the Old Road, as if he wants to show you something. Nobody ever knew who he was. Maybe he’d like someone to know.*', '']],
      steps:[
        {k:'items', g:'Follow Little Mow along the Old Road and learn who he was', items:[
          {at:[110, 51], e:'📦', line:[[...NAR, '*An old cardboard box under a bush, lined with leaves. Just the right size for a very small cat.*', ''], [...MOWQ, '...mow.', 'peaceful'], [...NAR, '*This is where he slept.*', '']]},
          {at:[116, 47], e:'🪨', line:[[...NAR, '*A flat rock that catches the afternoon sun. It’s still a little warm.*', ''], [...NAR, '*This is what he liked: warm spots, quiet afternoons.*', '']]},
          {at:[122, 51], e:'📬', line:[[...VILQ, 'Oh, that little gray one? I used to see him every morning on my route. I’d leave him a bit of my sandwich.', 'peaceful'], [...VILQ, 'He never let me pet him. But he always waited by this mailbox. Every single day.', 'sad']]},
          {at:[127, 48], e:'✏️', line:[[...NAR, '*A child’s drawing, frozen to a post: a tiny cat, and the words “I SAW THE KITTY AGAIN TODAY!”*', '']]},
          {at:[132, 50], e:'💡', line:[[...NAR, '*A porch light at the end of the road. Someone left it on every night, “just in case the little cat gets cold.”*', ''], [...MOWQ, '...mow.', 'happy'], [...NAR, '*People did know him. A little. Enough to leave a light on.*', '']]}]},
        {k:'go', g:'Bring Little Mow’s story to the Hall of Paws', at:[130, 65], act:'Hang the tag', done:[[...NAR, '*You hang a new name tag in the Hall of Paws, under his memorial. It says: LITTLE MOW · liked warm rocks, sandwiches, and porch lights.*', ''], [...MOWQ, '...mow.', 'peaceful'], [...NAR, '*A soft blue glow drifts around your feet. It feels like being remembered.*', '']]}],
      finish:() => { W.mowTag = 1; W.trail = 'spirit'; give({frost:35, flakes:1200, xp:140}); X.stat('sqMow', 1, 'max'); return '🏷️ Little Mow’s name tag hangs in the Hall of Paws · calm blue spirit trail unlocked'; }},
    bard:{e:'🎵', n:'The Frozen Bard', who:'Wren', tone:'funny', giver:[30, 113], avail:afterLoki, lock:'Defeat Loki first', reward:'6 new Snow Kingdom music tracks · title “Muse of the Snow”',
      intro:[[...BARDQ, 'Ah! The hero of the Snow Kingdom! I write songs about your adventures, you know. Ballads! Epics! One limerick.', 'happy'], [...BARDQ, 'But a gust of wind stole my songbook and scattered the pages all over the kingdom. Six songs, lost!', 'sad'], [...BARDQ, 'Find them, and I’ll play them for the whole kingdom. Each page you find, I can play right away!', 'happy']],
      steps:[
        {k:'items', g:'Find Wren’s six lost song pages', items:[
          {at:[16, 60], e:'📜', line:[[...NAR, '🎵 Song page: “Whisperpine Waltz” · you can hear it in the Snow Kingdom now', '']]},
          {at:[82, 64], e:'📜', line:[[...NAR, '🎵 Song page: “Glimmer Lake Lullaby”', '']]},
          {at:[50, 26], e:'📜', line:[[...NAR, '🎵 Song page: “The Royal Guard March” (it has a verse about snacks)', '']]},
          {at:[60, 118], e:'📜', line:[[...NAR, '🎵 Song page: “Aurora Nights”', '']]},
          {at:[32, 131], e:'📜', line:[[...NAR, '🎵 Song page: “Shanty of Captain Frostbeard”', '']]},
          {at:[118, 120], e:'📜', line:[[...NAR, '🎵 Song page: “Ballad of the Brave Hero” (it’s about you)', '']]}]},
        {k:'go', g:'Bring the song pages back to Wren in Frostpine Village', at:[30, 113], act:'Give the pages', done:[[...BARDQ, 'My songs! All of them! Gather round, Frostpine! A concert for the hero!', 'happy'], [...NAR, '*The whole village claps along. Mau Mau dances. Badly. Happily.*', ''], [...BARDQ, 'From now on, my songs play all across the Snow Kingdom. Pick your favorite in your journal (J).', 'happy']]}],
      finish:() => { W.bardAll = 1; give({frost:40, flakes:1500, xp:160}); X.stat('sqBard', 1, 'max'); return '🎵 Six Snow Kingdom songs unlocked · pick them in the journal (J)'; }},
  };
  // Teammate Tales: one short chain per teammate, each unlocking a new ability
  const TALES = {
    Maya:{ab:'Eagle Eye', abD:'every 8 s Maya fires a long, piercing shot for triple damage', place:[78, 66], items:[[74, 64], [82, 70], [86, 64]], e:'🎯',
      intro:'I learned to throw on Glimmer Lake. My grandma set up tin cans on the ice. I missed every single one, for a whole winter.', mid:'These are the old cans! Still here. Let’s knock them over. For grandma.', end:'I hit all three. Grandma would be so proud. I joined you because she said: “Aim for the thing that matters.” That’s you guys.'},
    Leo:{ab:'Ice Wall', abD:'every 14 s Leo freezes nearby enemies in place for a moment', place:[18, 20], items:[[14, 16], [22, 22], [18, 26]], e:'🔨',
      intro:'I build things. Forts, walls, snowmen with hats. I built my first fort in the Crystal Caves, where nobody could knock it down.', mid:'The old fort fell apart. Help me find the three foundation stones?', end:'Good as new. Better, actually. I joined because I want to build a kingdom where nobody’s house gets knocked over.'},
    Ava:{ab:'Warm Hug', abD:'every 20 s Ava heals you and every teammate by one heart', place:[28, 112], items:[[24, 110], [32, 116], [26, 118]], e:'➕',
      intro:'Frostpine Village is where I grew up. Every winter, people got sick from the cold. I started bringing them warm cocoa.', mid:'Old Mrs. Fir and her two neighbors are freezing again. Let’s bring them cocoa!', end:'Everyone’s warm. I joined you because a warm kingdom starts with warm people. And a lot of cocoa.'},
    Sam:{ab:'Snow Volley', abD:'every 7 s Sam throws a fan of five snowballs at the nearest enemy', place:[62, 118], items:[[58, 116], [66, 122], [64, 114]], e:'⚪',
      intro:'I used to be the slowest kid in snowball fights. Everyone hit me first. So I practiced at Aurora Fields. Every night. Under the lights.', mid:'My old practice targets are still out here. Three of them. Watch this.', end:'Five at once! I joined you because I don’t want anyone to be the kid who gets hit first ever again.'}};
  Object.keys(TALES).forEach(nm => { const T2 = TALES[nm]; SQ['tale' + nm] = {e:T2.e, n:'Teammate Tales: ' + nm, who:nm, tone:'warm', giver:[49 + Object.keys(TALES).indexOf(nm)*2, 87], tale:nm, avail:() => afterLoki() && mateIdx(nm) >= 0, lock:'Defeat Loki, and have ' + nm + ' on your team (Snowball Showdown upgrades: teammates)', reward:'New ability for ' + nm + ': ' + T2.ab + ' (' + T2.abD + ')',
    intro:[[...TEAMQ(nm), T2.intro, 'peaceful'], [...TEAMQ(nm), 'Come with me? I want to show you.', 'happy']],
    steps:[{k:'go', g:nm + '’s tale: go to the place from ' + nm + '’s past', at:T2.place, act:'Listen', done:[[...TEAMQ(nm), T2.mid, 'happy']]},
      {k:'items', g:nm + '’s tale: help ' + nm, items:T2.items.map((a, i) => ({at:a, e:T2.e, line:[[...TEAMQ(nm), ['One!', 'Two!', 'Three!'][i], 'happy']]})), done:[[...TEAMQ(nm), T2.end, 'peaceful'], [...NAR, '✨ ' + nm + ' learned ' + T2.ab + ': ' + T2.abD + '.', '']]}],
    finish:() => { W.abil = {...(W.abil || {}), [nm]:1}; give({frost:20, flakes:800, xp:100}); const n = Object.keys(W.abil).length; X.stat('sqTeam', n, 'max'); return '✨ ' + nm + ' learned ' + T2.ab; }}; });
  const SQK = Object.keys(SQ);
  // which tracks belong to each bard page
  const BARD_N = () => W.bardAll ? 6 : SQ.bard.steps[0].items.filter((_, i) => W.sqI['bard:0:' + i]).length;
  // ---------- side-quest bosses ----------
  Object.assign(BOSS, {
    sq_raccoon:{n:'ROCCO’S BOSS: THE RACCOON BANDIT KING', hp:260, r:32, intro:'The Raccoon Bandit King: “Who dares interrupt SNACK TIME?! Bandits, attack! Politely!”', ai:{walk:90, spread:1.6, dash:1, summon:'pup', summonT:8}},
    sq_mau:{n:'ROYAL GUARD MAU MAU (DUEL)', hp:320, r:30, phases:3, intro:'Mau Mau: “En garde! The Royal Guard does not hold back! (A little bit.)”', ai:{walk:70, spread:1.9, dash:1, ring:4.5}},
    sq_frost:{n:'THE DARK FROST', hp:300, r:34, phases:3, intro:'The Dark Frost hisses. It smells like old magic, and something small and smug.', ai:{walk:40, ring:3.4, spiral:1, summon:'wisp', summonT:9, fade:1}}});
  Object.assign(LAIR, {sq_raccoon:spot(19, 61), sq_mau:spot(52, 81), sq_frost:spot(48, 24)});
  const sqStep = id => W.sqD[id] || W.sq[id] == null ? null : SQ[id].steps[W.sq[id]];
  const sqReady = k => SQK.some(id => { const s2 = sqStep(id); return s2 && s2.k == 'boss' && s2.boss == k; });
  // ---------- running the chains ----------
  let chase = null, course = null, waves = null;
  const sqStart = id => { const Q = SQ[id]; talk(Q.intro, () => { W.sq[id] = 0; W.sqTrack = id; save(); A.sfx('win'); say('📗 Side story: ' + Q.n + ' · track it in the journal (J)', 3.5); }); };
  const sqAdvance = (id, lines) => { const Q = SQ[id], i = W.sq[id], s2 = Q.steps[i]; const next = () => { if (Q.stepDone) Q.stepDone(i); W.sq[id] = i + 1; chase = course = waves = null; sqNightF = false;
      if (W.sq[id] >= Q.steps.length) sqFinish(id); else { save(); A.sfx('coin'); say('📗 ' + Q.n + ' · ' + Q.steps[i + 1].g, 3.2); } };
    const L3 = lines || s2.done; if (L3 && L3.length) talk(L3, next); else next(); };
  const sqFinish = id => { const Q = SQ[id]; W.sqD[id] = 1; delete W.sq[id]; if (W.sqTrack == id) W.sqTrack = null; let txt = '';
    if (!W.sqR[id]) { W.sqR[id] = 1; txt = Q.finish(); } save(); A.sfx('win'); cheerT = 2.5;
    const all = SQK.filter(k => !SQ[k].tale).every(k => W.sqD[k]) && Object.keys(TALES).every(nm => W.sqD['tale' + nm] || mateIdx(nm) < 0);
    if (all) X.stat('sqAll', 1, 'max');
    say('🏅 Side story complete: ' + Q.n + (txt ? ' · ' + txt : ''), 6); };
  // skip the optional ending of Loki's Lost Ball and finish it from the journal
  const sqSkipOptional = id => { const s2 = sqStep(id); if (s2 && s2.optional) sqFinish(id); };
  const sqBossDown = B => { const id = SQK.find(q => { const s2 = sqStep(q); return s2 && s2.k == 'boss' && s2.boss == B.k; }); if (!id) return false; give({frost:15, flakes:500, xp:80}); sqAdvance(id); return true; };
  const sqThings = L => { if (raid || siege) return L;
    SQK.forEach(id => { const Q = SQ[id];
      if (!W.sqD[id] && W.sq[id] == null) { if (!Q.avail()) return; const g2 = spot(Q.giver[0], Q.giver[1]); if (Q.tale && dist(g2, p) > 900) return; L.push({x:g2.x, y:g2.y, n:'❕ ' + Q.n, f:() => sqStart(id)}); return; }
      const s2 = sqStep(id); if (!s2) return;
      if (s2.k == 'go') { const q = spot(s2.at[0], s2.at[1]); L.push({x:q.x, y:q.y, n:s2.act || 'Look', f:() => sqAdvance(id)}); }
      if (s2.k == 'items') s2.items.forEach((it, j) => { const key = id + ':' + W.sq[id] + ':' + j; if (W.sqI[key]) return; const q = spot(it.at[0], it.at[1]);
        L.push({x:q.x, y:q.y, n:'Look', f:() => { W.sqI[key] = 1; save(); A.sfx('coin'); splat(q.x, q.y - 10, 10, '#F9BF01'); const left = s2.items.filter((_, j2) => !W.sqI[id + ':' + W.sq[id] + ':' + j2]).length;
          talk(it.line, () => { if (left) say('📗 ' + (s2.items.length - left) + ' / ' + s2.items.length + ' found', 2); }); }}); });
      if (s2.k == 'course' && !course) { const q = spot(s2.pts[0][0], s2.pts[0][1]); L.push({x:q.x, y:q.y, n:'Start the course', f:() => { course = {id, i:1, t:s2.time, pts:s2.pts.map(a => spot(a[0], a[1]))}; A.sfx('blip'); say('🏁 GO! Run through every flag in ' + s2.time + ' seconds!', 2.5); }}); }
      if (s2.k == 'waves' && !waves) { const q = spot(s2.at[0], s2.at[1]); L.push({x:q.x, y:q.y, n:s2.night ? 'Start the night watch' : 'Start the drill', f:() => { waves = {id, i:0, at:q, t:1.5}; if (s2.night) sqNightF = true; talk([[...MAUF, s2.night ? 'Night watch begins. Eyes open. Ears open. Snack bag... closed. For now.' : 'Shield up! Here comes the practice squad!', 'angry']]); }}); }
      if (s2.k == 'chase' && !chase) { const q = spot(s2.path[0][0], s2.path[0][1]); L.push({x:q.x, y:q.y, n:'Sneak up', f:() => { chase = {id, i:0, x:q.x, y:q.y, pts:s2.path.map(a => spot(a[0], a[1])), wait:0}; say('🦝 The thief bolts! Catch it!', 2.2); A.sfx('blip'); }}); }
    });
    // the memory album and Little Mow's name tag in the Hall of Paws
    if (W.album) { const H2 = L2('hall'); L.push({x:H2.x - 140, y:H2.y + 30, n:'Memory album', f:albumPanel}); }
    if (W.lball && W.lokiReformed && !(boss && boss.k == 'loki')) { const c2 = spot(83, 15); L.push({x:c2.x - 60, y:c2.y, n:'Practice match', f:() => { lokiSpar = true; lokiReady = true; say('🎾 Loki bounces to the middle of the throne room. Step closer!', 2.5); }}); L.push({x:c2.x + 60, y:c2.y, n:'Pet Loki', f:() => talk([[...LOKQ, ['*wag wag wag*', 'Throw the ball! Throw it! ...Please?', 'I’m a good boy now. Right? Right!', 'I keep the castle tidy now. Mostly I nap in it.'][Math.floor(t) % 4], 'happy']])}); }
    return L; };
  const sqUpdate = dt => {
    if (!dlg) SQK.forEach(id => { const s2 = sqStep(id); if (s2 && s2.k == 'items' && s2.items.every((_, j) => W.sqI[id + ':' + W.sq[id] + ':' + j])) sqAdvance(id); });
    // the masked thief: it runs to the next waypoint whenever you get close, and is caught at the last one
    if (chase) { const C3 = chase, tgt = C3.pts[Math.min(C3.i, C3.pts.length - 1)], d = Math.hypot(tgt.x - C3.x, tgt.y - C3.y);
      if (d > 6) { const sp3 = 250*dt; C3.x += (tgt.x - C3.x)/d*Math.min(d, sp3); C3.y += (tgt.y - C3.y)/d*Math.min(d, sp3); }
      else if (dist(C3, p) < (C3.i >= C3.pts.length - 1 ? 60 : 230)) { if (C3.i >= C3.pts.length - 1) { const id = C3.id; chase = null; sqAdvance(id); } else C3.i++; }
      if (dist(C3, p) > 900) { chase = null; say('🦝 The thief got away... it ran back to the pantry. Try again!', 3); } }
    if (course) { const C3 = course; C3.t -= dt; const q = C3.pts[C3.i]; if (dist(q, p) < 52) { C3.i++; A.sfx('coin'); splat(q.x, q.y - 20, 10, '#D5F367'); if (C3.i >= C3.pts.length) { const id = C3.id; course = null; sqAdvance(id); } }
      else if (C3.t <= 0) { course = null; A.sfx('bad'); talk([[...MAUF, 'Too slow! The obstacle course waits for no one. Except me. Try again!', 'angry']]); } }
    if (waves) { const W3 = waves, s2 = sqStep(W3.id); if (!s2) { waves = null; sqNightF = false; } else { const alive = foes.filter(f => f.sqw).length;
      if (dist(p, W3.at) > 900) { waves = null; sqNightF = false; foes = foes.filter(f => !f.sqw); say('📗 You left the post. Start again when you’re ready.', 3); }
      else if (!alive) { W3.t -= dt; if (W3.t <= 0) { if (W3.i >= s2.waves.length) { const id = W3.id; waves = null; sqAdvance(id); } else { s2.waves[W3.i].forEach((k2, j) => { const a = j/s2.waves[W3.i].length*TAU + Math.random(); spawnFoe(k2, W3.at.x + Math.cos(a)*340, W3.at.y + Math.sin(a)*300); const f = foes[foes.length - 1]; if (f) { f.sqw = 1; f.hurt = 99; } }); W3.i++; W3.t = 1.5; say('⚔ Wave ' + W3.i + ' of ' + s2.waves.length, 1.8); } } } } }
    // teammate abilities from Teammate Tales
    if (W.abil) mates.forEach(m => { if (m.ko || !W.abil[m.name]) return; m.abT = (m.abT == null ? 3 : m.abT) - dt; if (m.abT > 0) return; const near = (r2) => { let tg = boss && dist(boss, m) < r2 ? boss : null; if (!tg) { let bd = r2; for (const f of foes) { const d3 = dist(f, m); if (d3 < bd) { bd = d3; tg = f; } } } return tg; };
      if (m.name == 'Sam') { const tg = near(320); if (!tg) { m.abT = .5; return; } m.abT = 7; const a = Math.atan2(tg.y - m.y, tg.x - m.x); for (let i = -2; i <= 2; i++) balls.push({team:1, x:m.x, y:m.y - 10, vx:Math.cos(a + i*.16)*480, vy:Math.sin(a + i*.16)*480, mine:1, dmg:X.armM()*.7, r:5, life:.9, hits:[], col:'#e8f8ff'}); addNum(m.x, m.y - 40, 'Snow Volley!', '#2fa8e0'); }
      else if (m.name == 'Maya') { const tg = near(560); if (!tg) { m.abT = .5; return; } m.abT = 8; const a = Math.atan2(tg.y - m.y, tg.x - m.x); balls.push({team:1, x:m.x, y:m.y - 10, vx:Math.cos(a)*760, vy:Math.sin(a)*760, mine:1, dmg:X.armM()*3, r:6, life:1.1, hits:[], pierce:1, col:'#F9BF01'}); addNum(m.x, m.y - 40, 'Eagle Eye!', '#c48a00'); }
      else if (m.name == 'Leo') { const hit = foes.filter(f => dist(f, m) < 170); if (!hit.length) { m.abT = .5; return; } m.abT = 14; hit.forEach(f => { f.stun = Math.max(f.stun || 0, 1.6); f.slow = 3; }); splat(m.x, m.y, 18, '#bfe9ff'); addNum(m.x, m.y - 40, 'Ice Wall!', '#2a6ab0'); }
      else if (m.name == 'Ava') { m.abT = 20; if (p.hp < p.max) p.hp++; mates.forEach(m2 => { if (!m2.ko && m2.hp < m2.max) m2.hp++; }); addNum(p.x, p.y - 46, '🤗 Warm Hug +♥', '#d0408a'); } });
    // Loki's Ball: enemies chase it while it bounces around
    if (lballT > 0) { lballT -= dt; lb.x += lb.vx*dt; lb.y += lb.vy*dt; lb.vx *= Math.pow(.25, dt); lb.vy *= Math.pow(.25, dt); if (solidAt(lb.x, lb.y)) { lb.vx *= -.6; lb.vy *= -.6; } }
    lballCd = Math.max(0, lballCd - dt);
    // blue spirit trail
    if (W.trail == 'spirit' && !low() && Math.hypot(p.vx, p.vy) > 40 && Math.random() < dt*14) fx.push({x:p.x + (Math.random() - .5)*12, y:p.y + 14, vx:(Math.random() - .5)*20, vy:-20 - Math.random()*20, t:.9, col:'rgba(120,200,255,.8)', r:3}); };
  // Loki's Ball (B): throw it where you aim; nearby enemies run after it for a few seconds
  let lballT = 0, lballCd = 0; const lb = {x:0, y:0, vx:0, vy:0};
  const throwBall = () => { if (!W.lball) return; if (lballCd > 0) { say('🎾 Loki’s Ball is coming back… ' + Math.ceil(lballCd) + ' s', 1.2); return; } const wa = toWorld(aim), a = Math.atan2(wa.y - p.y, wa.x - p.x); lb.x = p.x; lb.y = p.y - 10; lb.vx = Math.cos(a)*520; lb.vy = Math.sin(a)*520; lballT = 6; lballCd = 18; A.sfx('blip'); say('🎾 Go get it!', 1.4); };
  const lballLure = () => lballT > 0 ? lb : null;
  // ---------- quest arrow ----------
  const sqNext = () => { const av = SQK.filter(id => !W.sqD[id] && W.sq[id] == null && SQ[id].avail()).map(id => ({id, ...spot(SQ[id].giver[0], SQ[id].giver[1])})); if (!av.length) return null; av.sort((a, b) => dist(a, p) - dist(b, p)); return {x:av[0].x, y:av[0].y, n:'📗 New side story: ' + SQ[av[0].id].n + ' (purple !)'}; };
  const sqGoal = () => { const ids = W.sqTrack && sqStep(W.sqTrack) ? [W.sqTrack] : SQK.filter(id => sqStep(id) && !sqStep(id).optional); for (const id of ids) { const Q = SQ[id], s2 = sqStep(id); const pre = '📗 ' + Q.n + ' · ';
      if (chase && chase.id == id) return {x:chase.x, y:chase.y, n:pre + 'Catch the thief!'};
      if (course && course.id == id) return {...course.pts[course.i], n:pre + 'Flag ' + course.i + '/' + (course.pts.length - 1) + ' · ' + Math.ceil(course.t) + ' s'};
      if (s2.k == 'items') { const left = s2.items.map((it, j) => ({...spot(it.at[0], it.at[1]), j})).filter(q => !W.sqI[id + ':' + W.sq[id] + ':' + q.j]); left.sort((a, b) => dist(a, p) - dist(b, p)); if (left.length) return {x:left[0].x, y:left[0].y, n:pre + s2.g + ' (' + (s2.items.length - left.length) + '/' + s2.items.length + ')'}; }
      if (s2.k == 'items') continue; const at = sqAt(s2); if (at) return {x:at.x, y:at.y, n:pre + s2.g}; } return null; };
  const sqAt = s2 => s2.k == 'boss' ? LAIR[s2.boss] : s2.k == 'chase' ? spot(s2.path[0][0], s2.path[0][1]) : s2.k == 'course' ? spot(s2.pts[0][0], s2.pts[0][1]) : s2.at ? spot(s2.at[0], s2.at[1]) : null;
  // ---------- drawing ----------
  const raccoon = (x, y, o = {}) => { const s = o.s || 1; g.save(); g.translate(x, y); g.scale(o.flip ? -s : s, s); g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(0, 12, 14, 4, 0, 0, TAU); g.fill();
    g.fillStyle = '#7a7a84'; g.beginPath(); g.ellipse(0, 2, 13, 10, 0, 0, TAU); g.fill(); for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#3a3a42' : '#9a9aa4'; g.beginPath(); g.arc(-14 - i*5, -2 - i*3, 5, 0, TAU); g.fill(); }
    g.fillStyle = '#8a8a94'; g.beginPath(); g.arc(9, -8, 9, 0, TAU); g.fill(); g.fillStyle = '#e8e8ee'; g.beginPath(); g.ellipse(13, -5, 5, 4, 0, 0, TAU); g.fill(); g.fillStyle = '#2a2a30'; g.fillRect(3, -12, 14, 5); g.fillStyle = '#fff'; g.beginPath(); g.arc(7, -10, 1.6, 0, TAU); g.arc(13, -10, 1.6, 0, TAU); g.fill();
    g.fillStyle = '#5a5a64'; g.beginPath(); g.moveTo(3, -15); g.lineTo(5, -21); g.lineTo(8, -15); g.moveTo(11, -16); g.lineTo(14, -22); g.lineTo(15, -15); g.fill(); g.fillStyle = '#14204a'; g.beginPath(); g.arc(17, -5, 1.6, 0, TAU); g.fill();
    if (o.crown) { g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(3, -17); g.lineTo(3, -24); g.lineTo(7, -20); g.lineTo(10, -27); g.lineTo(13, -20); g.lineTo(17, -24); g.lineTo(17, -17); g.fill(); }
    if (o.sack) { g.fillStyle = '#c8a070'; g.beginPath(); g.arc(-6, -8, 7, 0, TAU); g.fill(); g.fillStyle = '#8D5B1D'; g.fillRect(-8, -16, 4, 3); } g.restore(); };
  const bardDraw = (x, y) => { kid(x, y, '#a64be0', {hat:'#F9BF01', face:0, walk:0}); g.fillStyle = '#c48a4a'; g.beginPath(); g.ellipse(x + 12, y - 2, 7, 9, .4, 0, TAU); g.fill(); g.strokeStyle = '#8D5B1D'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 14, y - 8); g.lineTo(x + 22, y - 22); g.stroke();
    if (!low()) { g.font = '12px ' + A.font; g.textAlign = 'center'; g.fillText('🎵', x + 18 + Math.sin(t*2)*4, y - 34 - (t*20 % 16)); } };
  const sqDraw = () => {
    SQK.forEach(id => { const Q = SQ[id];
      if (!W.sqD[id] && W.sq[id] == null && Q.avail()) { const q = spot(Q.giver[0], Q.giver[1]); if (!onScreen(q.x, q.y)) return; if (Q.tale && dist(q, p) > 900) return;
        g.fillStyle = 'rgba(166,75,224,.9)'; g.beginPath(); g.arc(q.x, q.y - 56 + Math.sin(t*4)*3, 11, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '900 15px ' + A.font; g.textAlign = 'center'; g.fillText('!', q.x, q.y - 51 + Math.sin(t*4)*3); }
      const s2 = sqStep(id); if (!s2) return;
      if (s2.k == 'items') s2.items.forEach((it, j) => { if (W.sqI[id + ':' + W.sq[id] + ':' + j]) return; const q = spot(it.at[0], it.at[1]); if (!onScreen(q.x, q.y)) return; g.globalAlpha = .75 + .25*Math.sin(t*3 + j); g.font = '20px ' + A.font; g.textAlign = 'center'; g.fillText(it.e, q.x, q.y + 6); g.globalAlpha = 1; g.fillStyle = '#a64be0'; g.font = '900 13px ' + A.font; g.fillText('◆', q.x, q.y - 18 + Math.sin(t*5 + j)*3); });
      if (s2.k == 'go' || s2.k == 'waves') { const q = spot(s2.at[0], s2.at[1]); if (onScreen(q.x, q.y)) { g.strokeStyle = 'rgba(166,75,224,' + (.5 + .3*Math.sin(t*4)) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(q.x, q.y, 26, 0, TAU); g.stroke(); } }
      if (s2.k == 'chase' && !chase) { const q = spot(s2.path[0][0], s2.path[0][1]); if (onScreen(q.x, q.y)) raccoon(q.x, q.y, {sack:1}); }
      if (s2.k == 'course') { const pts = course ? course.pts : s2.pts.map(a => spot(a[0], a[1])); pts.forEach((q, j) => { if (!onScreen(q.x, q.y) || (course && j < course.i)) return; const next = course ? j == course.i : j == 0; g.fillStyle = '#8D5B1D'; g.fillRect(q.x - 2, q.y - 34, 3, 36); g.fillStyle = next ? '#D5F367' : '#ff9ad5'; g.beginPath(); g.moveTo(q.x + 1, q.y - 34); g.lineTo(q.x + 20, q.y - 28); g.lineTo(q.x + 1, q.y - 22); g.fill(); if (next) { g.strokeStyle = '#D5F367'; g.lineWidth = 3; g.beginPath(); g.arc(q.x, q.y, 30 + Math.sin(t*6)*3, 0, TAU); g.stroke(); } }); } });
    if (chase && onScreen(chase.x, chase.y)) raccoon(chase.x, chase.y, {sack:1, flip:chase.pts[chase.i] && chase.pts[chase.i].x < chase.x});
    if (lballT > 0) { g.fillStyle = '#c8102e'; g.beginPath(); g.arc(lb.x, lb.y, 7, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(lb.x, lb.y, 5, .3, 2.6); g.stroke(); }
    // NPCs: Wren the bard in Frostpine, the reformed Loki at his castle
    { const q = spot(30, 113); if (onScreen(q.x, q.y) && (W.sq.bard != null || W.sqD.bard || afterLoki())) bardDraw(q.x - 30, q.y); }
    if (W.lokiReformed && !(boss && boss.k == 'loki')) { const c2 = spot(83, 15); if (onScreen(c2.x + 60, c2.y)) SC.loki(g, c2.x + 60, c2.y, {s:1.1, mood:'happy', ph:1}, t); }
    const H2 = L2('hall'); if (onScreen(H2.x, H2.y, 400)) {
      if (W.album) { const ax = H2.x - 140, ay = H2.y + 30; g.fillStyle = '#8D5B1D'; g.fillRect(ax - 14, ay - 4, 28, 14); g.fillStyle = '#c84a4a'; rr(g, ax - 12, ay - 14, 24, 12, 2); g.fill(); g.fillStyle = '#F9BF01'; g.font = '700 7px ' + A.font; g.textAlign = 'center'; g.fillText('ALBUM', ax, ay - 5); }
      if (W.mowTag) { const tx2 = H2.x, ty2 = H2.y + 22; g.strokeStyle = '#8a8270'; g.lineWidth = 1; g.beginPath(); g.moveTo(tx2, ty2 - 6); g.lineTo(tx2, ty2); g.stroke(); g.fillStyle = '#c8102e'; rr(g, tx2 - 26, ty2, 52, 14, 4); g.fill(); g.fillStyle = '#fff'; g.font = '800 8px ' + A.font; g.fillText('LITTLE MOW', tx2, ty2 + 10); } } };
  const sqEnts = ents => { if (chase || !SQK.some(id => sqStep(id) && sqStep(id).k == 'boss' && sqStep(id).boss == 'sq_raccoon')) return; };
  // ---------- map: side quest givers have a purple "!" (main story uses the gold star) ----------
  // Map Room: unopened chests (and side-quest markers from level 2) on the maps; travel flags from level 4
  const mrMini = (mx, my, sc2) => { const lv = RL('maproom'); if (!lv) return; g.fillStyle = '#F9BF01'; chests.forEach(ch => { if (!W.chests[ch.id]) g.fillRect(mx + ch.x/TS*sc2 - 1, my + ch.y/TS*sc2 - 1, 2, 2); });
    if (lv >= 2) sqMap(q2 => ({x:mx + (q2.x + .5)*sc2, y:my + (q2.y + .5)*sc2}), 3.5); };
  const mrBig = ms => { const lv = RL('maproom'); if (lv) chests.forEach(ch => { if (W.chests[ch.id]) return; const q = ms({x:ch.tx, y:ch.ty}); g.fillStyle = '#F9BF01'; g.strokeStyle = '#8D5B1D'; g.lineWidth = 1.5; rr(g, q.x - 4, q.y - 3, 8, 6, 1.5); g.fill(); g.stroke(); });
    (W.mflags || []).forEach((f2, i) => { const q = ms({x:f2.x/TS - .5, y:f2.y/TS - .5}); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(q.x, q.y + 6); g.lineTo(q.x, q.y - 16); g.stroke(); g.fillStyle = '#FF4539'; g.beginPath(); g.moveTo(q.x, q.y - 16); g.lineTo(q.x + 13, q.y - 11); g.lineTo(q.x, q.y - 6); g.fill();
      if (travel) { g.fillStyle = '#fff'; g.font = '700 11px ' + A.font; g.textAlign = 'center'; g.fillText('Flag ' + (i + 1), q.x, q.y - 22); } });
    MRB = null; const n = mrFlags(lv); if (!travel && n && !raid && !inRealm()) { const bw = 250, bx = VW - bw - 16, by = TY + 8; MRB = {x:bx, y:by, w:bw, h:34}; g.fillStyle = '#F9BF01'; rr(g, bx, by, bw, 34, 17); g.fill(); g.fillStyle = '#14204a'; g.font = '800 12px ' + A.font; g.textAlign = 'center'; g.fillText('📍 Plant a travel flag here (' + (W.mflags || []).length + '/' + n + ')', bx + bw/2, by + 22); } };
  let MRB = null;
  const mrPlant = () => { const n = mrFlags(RL('maproom')); if (!n) return; W.mflags = (W.mflags || []).slice(); if (W.mflags.length >= n) W.mflags.shift(); W.mflags.push({x:Math.round(p.x), y:Math.round(p.y)}); save(); A.sfx('coin'); say('📍 Travel flag planted! Touch any waystone to fast travel back here', 3); };
  const sqMap = (ms, rad) => { SQK.forEach(id => { const Q = SQ[id]; let at = null, ic = '';
      if (!W.sqD[id] && W.sq[id] == null && Q.avail()) { at = spot(Q.giver[0], Q.giver[1]); ic = '❕'; } else { const s2 = sqStep(id); if (s2 && s2.k != 'items') { at = sqAt(s2); ic = '◆'; } }
      if (!at || !isFinite(at.x)) return; const q = ms({x:at.x/TS - .5, y:at.y/TS - .5}); g.fillStyle = 'rgba(166,75,224,.95)'; g.beginPath(); g.arc(q.x, q.y, rad || 8, 0, TAU); g.fill(); if (rad) return; g.fillStyle = '#fff'; g.font = '900 10px ' + A.font; g.textAlign = 'center'; g.fillText(ic == '❕' ? '!' : '◆', q.x, q.y + 4); }); };
  // ---------- the quest journal (J): main story chapters + Side Quests tab + outfits + Wren's songs ----------
  let jTab = 'side';
  const albumPanel = () => openPanelUI(() => ({title:'📔 Bau Bau’s memory album', sub:'Every memory, one page each. So nobody forgets the good parts.', rows:SQ.baumem.steps[0].items.map(it => ({e:it.e, n:it.line[0][2].slice(0, 60) + (it.line[0][2].length > 60 ? '…' : ''), d:'Bau Bau'})).concat([{e:'🕯️', n:'Minccino · gentle and brave · Chao Chao · the fastest of us all', d:'The brothers'}])}));
  const MAIN_CH = () => [{n:'Kingdom Quest: rescue Bau Bau and Mau Mau, defeat Loki', done:!!W.bau}, ...STORY_N.slice(1).map((n, i) => ({n:'Spirits of the Snow · ' + n, done:(W.sp|0) > i + 1 || ((W.sp|0) >= 6 && i == 5), now:(W.sp|0) == i + 1}))];
  const journal = () => openPanelUI(() => { const tabs = [{e:'📖', n:'Tabs', d:'Main story · Side quests · Outfits & songs', btn:jTab == 'main' ? '▶ Side quests' : jTab == 'side' ? '▶ Outfits & songs' : '▶ Main story', ok:true, fn:() => { jTab = jTab == 'main' ? 'side' : jTab == 'side' ? 'extra' : 'main'; pnPage = 0; }}];
    if (jTab == 'main') return {title:'📖 Journal · Main story', sub:'Your chapters so far. The gold star on the map and the arrow show the next step.', rows:[...tabs, ...MAIN_CH().map(c => ({e:c.done ? '✅' : c.now ? '▶️' : '⬜', n:c.n, d:c.done ? 'Done' : c.now ? 'In progress' : ''}))]};
    if (jTab == 'extra') { const n = BARD_N(), S = ['Whisperpine Waltz', 'Glimmer Lake Lullaby', 'The Royal Guard March', 'Aurora Nights', 'Shanty of Captain Frostbeard', 'Ballad of the Brave Hero'];
      const outs = [['none', '🧥', 'Your usual coat', true], ['guard', '🛡️', 'Royal Guard armor', !!W.rgArmor], ['bau', '👑', 'Bau Bau outfit', !!(W.outfits || {}).bau], ['god', '🌌', 'Godlike set (beat the Gecko God)', !!(W.outfits || {}).god], ['raid', '⚔️', 'Raid Champion outfit (Raid Quartermaster)', !!(W.outfits || {}).raid]];
      return {title:'🎒 Journal · Outfits & songs', sub:'Rewards from side stories. Songs come from Wren’s lost pages (' + n + '/6 found).', rows:[...tabs,
        ...outs.map(([k, e, nm, ok]) => ({e, n:nm, d:ok ? ((W.outfit || 'none') == k ? 'Wearing' : 'Unlocked') : 'Locked · finish its side story', btn:ok ? ((W.outfit || 'none') == k ? 'Wearing' : 'Wear') : '🔒', ok:ok && (W.outfit || 'none') != k, fn:() => { W.outfit = k; save(); A.sfx('blip'); }})),
        ...(W.mateOuts ? [(() => { const L = ['none', ...Object.keys(W.mateOuts)], NM = {none:'Their usual coats', frost:'Frost Guard', star:'Starlight'}, cur = W.mateOut || 'none'; return {e:'🧣', n:'Teammate outfit · ' + NM[cur], d:'Base level rewards · tap to switch', btn:'Switch', ok:L.length > 1, fn:() => { W.mateOut = L[(L.indexOf(cur) + 1) % L.length]; save(); A.sfx('blip'); }}; })()] : []),
        ...(W.mskins ? [(() => { const L = ['none', ...Object.keys(W.mskins)], NM = {none:'Normal', aurora:'Aurora', crystal:'Crystal'}, cur = W.mskin || 'none'; return {e:'🛷', n:'Mount skin · ' + NM[cur], d:'Base level rewards · for your sled, reindeer or snowmobile', btn:'Switch', ok:L.length > 1, fn:() => { W.mskin = L[(L.indexOf(cur) + 1) % L.length]; save(); A.sfx('blip'); }}; })()] : []),
        {e:'🎶', n:'Kingdom music', d:W.bardSong ? 'Playing: ' + S[W.bardSong - 1] : 'Normal kingdom music', btn:'Normal music', ok:!!W.bardSong, fn:() => { W.bardSong = 0; regMood = ''; save(); }},
        ...S.map((s3, i) => ({e:i < n ? '🎵' : '🔒', n:s3, d:i < n ? 'Wren’s song' : 'Find this song page', btn:i < n ? (W.bardSong == i + 1 ? 'Playing' : 'Play') : '🔒', ok:i < n && W.bardSong != i + 1, fn:() => { W.bardSong = i + 1; regMood = ''; save(); A.sfx('blip'); }}))]}; }
    const rows = SQK.map(id => { const Q = SQ[id], s2 = sqStep(id), done = !!W.sqD[id], on = !!s2, av = Q.avail();
      const prog = done ? '✅ Complete' : on ? 'Step ' + (W.sq[id] + 1) + '/' + Q.steps.length + ': ' + s2.g : av ? 'Ready: find the purple ! on the map' : '🔒 ' + Q.lock;
      return {e:Q.e, n:Q.n + ' · ' + Q.who, d:prog + ' · Reward: ' + Q.reward, btn:done ? 'Done' : on ? (W.sqTrack == id ? (s2.optional ? 'Skip ending' : 'Tracking') : 'Track') : av ? 'Show on arrow' : '🔒', ok:!done && (on ? (W.sqTrack != id || !!s2.optional) : av),
        fn:() => { if (on) { if (W.sqTrack == id && s2.optional) sqSkipOptional(id); else W.sqTrack = id; } else W.sqTrack = null; save(); A.sfx('blip'); }}; });
    const nd = SQK.filter(id => W.sqD[id]).length;
    return {title:'📗 Journal · Side quests (' + nd + '/' + SQK.length + ')', sub:'Side stories run alongside the main story. Purple ! marks a new one on the map. “Track” puts it on your arrow.', rows:[...tabs, {e:'🧭', n:'Arrow shows', d:W.sqTrack ? 'Side story: ' + SQ[W.sqTrack].n : 'Main story first', btn:'Main story', ok:!!W.sqTrack, fn:() => { W.sqTrack = null; save(); }}, ...rows]}; });
  // admin: finish a side story's current step (for testing)
  const sqAdminStep = () => { const id = W.sqTrack || SQK.find(q => sqStep(q)); if (!id) { const av = SQK.find(q => !W.sqD[q] && W.sq[q] == null && SQ[q].avail()); if (av) { W.sq[av] = 0; W.sqTrack = av; save(); say('Admin: started ' + SQ[av].n, 2); } return; } chase = course = waves = null; sqAdvance(id, []); };
  // ---------- map / fast travel ----------
  const openMap = tr => { if (SG && SG.blockMap && SG.blockMap()) return; if (raid) { say('🗺 No map down here! Finish the raid, or leave from the entrance on floor 1', 2.4); return; } mapOpen = true; travel = !!tr; A.sfx('blip'); };
  const MAPR = {x:20, y:66, s:5.6};
  let regB = null; const regExplored = () => { if (!regB) { regB = []; for (let i = 0; i < FB*FB; i++) regB.push(regionAt((i % FB)*2 + 1, Math.floor(i/FB)*2 + 1)); } const o = {}; for (let i = 0; i < regB.length; i++) { const k = regB[i]; if (!REG[k]) continue; const e3 = o[k] || (o[k] = {seen:0, all:0}); e3.all++; if (fog[i]) e3.seen++; } return o; };
  const mapDown = q => { if (inRealm() && SG.mapDown(q)) return; if (inR(q, MRB)) { mrPlant(); return; }
    if (travel) { const F2 = W.mflags || []; for (let i = 0; i < F2.length; i++) { const sx = MAPR.x + F2[i].x/TS*MAPR.s, sy = MAPR.y + F2[i].y/TS*MAPR.s; if (Math.hypot(q.x - sx, q.y - sy) < 24) { p.x = F2[i].x; p.y = F2[i].y; p.vx = p.vy = 0; foes = []; balls = []; if (boss) boss = null; mateHome(); mapOpen = false; travel = false; A.sfx('win'); say('✨ Whoosh! Travel flag ' + (i + 1), 2); save(); return; } } } if (q.y > 650 && q.y < 700) { if (q.x < VW/2) { mapOpen = false; travel = false; } else { close(); X.exit(); } return; }
    if (travel) for (const k in WAYS) { if (!W.ways[k]) continue; const sx = MAPR.x + (WAYS[k].x + .5)*MAPR.s, sy = MAPR.y + (WAYS[k].y + .5)*MAPR.s; if (Math.hypot(q.x - sx, q.y - sy) < 24) { const w2 = px(WAYS[k]); p.x = w2.x; p.y = w2.y + 40; p.vx = p.vy = 0; foes = []; balls = []; if (boss) boss = null; mateHome(); mapOpen = false; travel = false; A.sfx('win'); say('✨ Whoosh! ' + WAYS[k].n, 2); save(); return; } } };
  const toWorld = q => ({x:q.x + cam.x, y:q.y + cam.y});
  // ---------- input (called by Snowball Showdown) ----------
  const BTN = ['🤸', '⭐', '✋', '🐟', '📈', '📗', '🗺'];
  // touch screens (iPads, phones): a floating joystick on the left of the screen, a big THROW button that aims for you on the right
  let joy = null; const FIREB = () => ({x:VW - 96, y:BAR - 100, r:58});
  // auto-target: the strongest enemy in range first (boss, then most health); between equally strong ones, the closest, then farther ones
  const autoTarget = () => { if (boss && dist(boss, p) < 680) return boss; let tg = null, bs = -1, bd = 1e9; for (const f of foes) { if (f.dead || FOE[f.k].decoy) continue; const d3 = dist(f, p); if (d3 > 600) continue; const s3 = (f.max || f.hp || 1)*(f.elite ? 1.5 : 1); if (s3 > bs + 1e-6 || (Math.abs(s3 - bs) <= 1e-6 && d3 < bd)) { bs = s3; bd = d3; tg = f; } } return tg; };
  let spWas = false; const toggleAuto = () => { W.autoT = W.autoT ? 0 : 1; save(); A.sfx('blip'); say(W.autoT ? '🎯 Auto-target ON: throws go to the strongest enemy, closest first (T to turn off)' : '🎯 Auto-target OFF: throws go where you aim (T to turn on)', 2.4); };
  const autoAim = () => { const tg = autoTarget(); return tg ? {x:tg.x, y:tg.y - 8} : {x:p.x + Math.cos(p.face)*320, y:p.y + Math.sin(p.face)*320}; };
  let hudR = null, mmR = null, btnR = [];
  const inR = (q, r2) => r2 && q.x >= r2.x && q.x <= r2.x + r2.w && q.y >= r2.y && q.y <= r2.y + r2.h;
  const down = (q, e) => { if (e && e.pointerType) { const was = touchUI; touchUI = e.pointerType == 'touch' || e.pointerType == 'pen'; if (was != touchUI) layout(); }
    mouseIn = true; aim = q; if (quiz) return; if (panel) { panelDown(q); return; } if (SG && SG.down(q)) return; if (mapOpen) return mapDown(q); if (dlg) { if (t - (dlg.at || 0) > .45) nextLine(); return; } if (dead > 0) return;
    if (inR(q, hudR)) { W.hudMin = W.hudMin ? 0 : 1; A.sfx('blip'); return; } if (inR(q, thrR)) { threatPanel(); return; } if (inR(q, mmR)) { openMap(false); return; }
    for (const b of btnR) if (inR(q, b)) { if (b.id == 'ride') { toggleMount(); return; } if (b.id == 'roll') { roll(); return; } if (b.id == 'skills') { skillPanel(); return; } if (b.id == 'journal') { journal(); return; } if (b.id == 'hold') { holdMates = false; say('👣 Teammates: follow me', 1.6); return; } if (b.id == 'ball') { throwBall(); return; } if (b.id == 'auto') { toggleAuto(); return; } if (b.id == 'throw') { const wa = W.autoT ? autoAim() : {x:p.x + Math.cos(p.face)*300, y:p.y + Math.sin(p.face)*300}; throwAt(wa.x, wa.y, 0); return; } if (b.id == 'ab') useAbility(); else if (b.id == 'use') use(); else if (b.id == 'feed') feedMau(); else openMap(false); return; }
    if (touchUI && q.y > BAR) { const i = Math.floor(q.x/(VW/BTN.length)); [roll, useAbility, use, feedMau, skillPanel, journal, () => openMap(false)][Math.max(0, Math.min(BTN.length - 1, i))](); return; }
    if (touchUI) { const F = FIREB(); if (Math.hypot(q.x - F.x, q.y - F.y) < F.r + 14) { charge = {id:e.pointerId, t:0, auto:1}; return; } }
    const wq = toWorld(q); if (!boss) for (const T2 of things()) if (Math.hypot(T2.x - wq.x, T2.y - wq.y) < (touchUI ? 44 : 30) && dist(T2, p) < 110) { T2.f(); return; }
    if (touchUI && q.x < VW*.42 && q.y > 70 && !joy) { joy = {id:e.pointerId, ox:q.x, oy:q.y, x:q.x, y:q.y}; return; }
    charge = {id:e.pointerId, t:0}; };
  const move = (q, e) => { if (joy && e && joy.id == e.pointerId) { joy.x = q.x; joy.y = q.y; return; } if (e && e.pointerType == 'mouse' && touchUI && !e.buttons) { touchUI = false; joy = null; layout(); } mouseIn = q.y < BAR; if (!charge || (charge.id == e.pointerId && !charge.auto)) aim = q; };
  const up = e => { pads.delete(e.pointerId); if (joy && joy.id == e.pointerId) { joy = null; return; } if (charge && charge.id == e.pointerId) { const pk = Math.min(1, charge.t), au = charge.auto; charge = null; if (!dlg && !mapOpen && !quiz && dead <= 0) { const wa = au || W.autoT ? autoAim() : toWorld(aim); throwAt(wa.x, wa.y, pk > .25 ? pk : 0); } } };
  const key = e => { const k = e.key; if (quiz) return; if (!panel && !dlg && SG && SG.key(e)) return; if (panel) { if (k == 'Escape' || k == 'e' || k == 'E' || k == 'Enter' || k == 'k' || k == 'K' || k == 'j' || k == 'J') panel = null; return; }
    if (mapOpen) { if (k == 'm' || k == 'M' || k == 'Enter' || k == ' ') { mapOpen = false; travel = false; } return; }
    if (dlg) { if (k == 'Enter' || k == 'e' || k == 'E') nextLine(); return; }
    if (k == 'm' || k == 'M') openMap(false); else if (k == 'e' || k == 'E' || k == 'Enter') use(); else if (k == 'q' || k == 'Q') useAbility(); else if (k == 't' || k == 'T') toggleAuto(); else if (k == 'g' || k == 'G') feedMau(); else if (k == 'v' || k == 'V') toggleMount(); else if (k == 'j' || k == 'J') journal(); else if (k == 'b' || k == 'B') throwBall(); else if (k == 'k' || k == 'K') skillPanel(); else if (k == 'Shift') roll(); else if (k == 'c' || k == 'C') { holdMates = !holdMates; say(holdMates ? '✋ Teammates: hold this position (C to follow)' : '👣 Teammates: follow me', 1.8); } else if (k == 'h' || k == 'H') { W.hudMin = W.hudMin ? 0 : 1; }
    else if ((k == 'f' || k == 'F') && dead <= 0) { const wa = W.autoT ? autoAim() : mouseIn ? toWorld(aim) : {x:p.x + Math.cos(p.face)*300, y:p.y + Math.sin(p.face)*300}; throwAt(wa.x, wa.y, 0); } };
  // ---------- update ----------
  const update = dt => { t += dt; msgT = Math.max(0, msgT - dt);
    for (const f2 of fx) { f2.x += f2.vx*dt; f2.y += f2.vy*dt; f2.t -= dt; } fx = fx.filter(f2 => f2.t > 0);
    for (const n of nums) { n.y -= 30*dt; n.t -= dt; } nums = nums.filter(n => n.t > 0);
    if (quiz || dlg || mapOpen || panel || (SG && SG.modal())) return;
    if (dead > 0) { dead -= dt; if (dead <= 0) respawn(); return; }
    // Space = throw a snowball (hold to charge, release to throw)
    { const sh = !!K.k[' ']; if (sh && !spWas && !charge) charge = {id:'key', t:0, auto:W.autoT ? 1 : 0}; else if (!sh && charge && charge.id == 'key') { const pk = Math.min(1, charge.t), au = charge.auto; charge = null; const wa = au ? autoAim() : mouseIn ? toWorld(aim) : {x:p.x + Math.cos(p.face)*300, y:p.y + Math.sin(p.face)*300}; throwAt(wa.x, wa.y, pk > .25 ? pk : 0); } spWas = sh; }
    if (charge) charge.t += dt * (1 + .12*(X.PU ? X.PU('pack') : 0)) * (X.CL().pack || 1);
    // move
    const kk = K.k; let mx = ((kk.ArrowRight || kk.d || kk.D || pad('r')) ? 1 : 0) - ((kk.ArrowLeft || kk.a || kk.A || pad('l')) ? 1 : 0), my = ((kk.ArrowDown || kk.s || kk.S || pad('d')) ? 1 : 0) - ((kk.ArrowUp || kk.w || kk.W || pad('u')) ? 1 : 0);
    if (joy && !panel && !mapOpen && !dlg) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy), R = 60; if (d > 8) { const m = Math.min(1, d/R); mx = dx/d*m; my = dy/d*m; } if (d > R) { joy.ox = joy.x - dx/d*R; joy.oy = joy.y - dy/d*R; } }
    const L = Math.hypot(mx, my); if (L) { if (L > 1) { mx /= L; my /= L; } if (!charge || charge.auto) p.face = Math.atan2(my, mx); p.walk += dt; }
    if (!(SG && SG.move(dt, mx, my))) { const tl = tileAt(Math.floor(p.x/TS), Math.floor(p.y/TS)), spd = 215 * X.spd() * (tl == PATH || tl == CAMP || tl == FLOOR ? 1.2 : tl == DEEP ? .62 : 1) * (charge ? .6 : 1), k2 = tl == ICE ? 2.2 + .8*X.gStat('boots') : 14;
    const k3 = RMOD('ice') ? Math.min(k2, 2.4) : k2; if (!(p.roll > 0)) { p.vx += (mx*spd - p.vx) * Math.min(1, k3*dt); p.vy += (my*spd - p.vy) * Math.min(1, k3*dt); } else splat(p.x, p.y + 10, 1, '#ffffff');
    const nx = p.x + p.vx*dt, ny = p.y + p.vy*dt, rB = blocked(p.x, p.y, 12) ? 3 : 12; if (!blocked(nx, p.y, rB)) p.x = nx; else p.vx = 0; if (!blocked(p.x, ny, rB)) p.y = ny; else p.vy = 0; }
    if (!gateOpen() && Math.abs(p.x - (83.5*TS)) < 90 && Math.abs(p.y - 31*TS) < 40) { gateT -= dt; if (gateT <= 0) { gateT = 4; say('🔒 The gate is sealed: ' + runesN() + '/3 Moon Runes' + (W.mau ? '' : ' · Royal Guard Mau Mau has the key') , 3); } }
    // timers, ammo, healing
    p.inv = Math.max(0, p.inv - dt); p.hitT = Math.max(0, p.hitT - dt); p.ab = Math.max(0, p.ab - dt); p.shieldT = Math.max(0, p.shieldT - dt); p.eye = Math.max(0, p.eye - dt); p.fortT = Math.max(0, p.fortT - dt); p.throwT = Math.max(0, (p.throwT || 0) - dt);
    p.idleT = (p.idleT || 0) + dt; { const mxA = X.maxAmmo(); p.reload -= dt * regenMul() * (p.idleT > 1.2 ? 3 : 1); let n3 = 0; while (p.reload <= 0 && p.ammo < mxA && n3++ < 50) { p.ammo++; p.reload += .4; } if (p.ammo >= mxA) p.reload = Math.max(p.reload, 0); }
    if (X.PU('regen') && p.hp < p.max) { p.regT = (p.regT || 0) + dt; if (p.regT >= 40 - 5*X.PU('regen')) { p.regT = 0; p.hp++; addNum(p.x, p.y - 40, '☕ +♥', '#8D5B1D'); } }
    if ((dist(p, FIRE) < 110 || (SG && SG.warmHeal())) && p.hp < p.max) { healT -= dt; if (healT <= 0) { healT = 1; p.hp++; addNum(p.x, p.y - 40, '+♥', '#FF4539'); } }
    for (const d2 of drops) { d2.life -= dt; if (dist(d2, p) < 34) { d2.life = 0; if (d2.k == 'fish') { W.treats = (W.treats||0) + 1; addNum(p.x, p.y - 40, '+1 🐟 treat', '#c4601a'); } else { p.hp = Math.min(p.max, p.hp + 1); addNum(p.x, p.y - 40, d2.k == 'heart' ? '+♥' : '☕ +♥', d2.k == 'heart' ? '#FF4539' : '#8D5B1D'); } A.sfx('coin'); } } drops = drops.filter(d2 => d2.life > 0);
    storyUpdate(dt); p3Update(dt); sqUpdate(dt); if (SG) SG.update(dt);
    blizT -= dt; if (blizT <= 0) { if (blizzard > 0) { blizzard = 0; blizT = 150 + Math.random()*200; } else { blizzard = 40 + Math.random()*30; blizT = blizzard; } } if (blizzard > 0) blizzard = Math.max(.01, blizzard - dt);
    // where am I
    const rg = regAt(p.x, p.y); if (rg != lastReg) { if (lastReg) say('📍 ' + REG[rg].n, 2); const md = REG[rg].haunt ? 'story' : W.bardSong ? 'bard' + W.bardSong : REG[rg].mood || 'action'; if (md != regMood && window.WLMusic && window.WLMusic.mood) { regMood = md; try { window.WLMusic.mood(md); } catch(e){} } if (rg != 'castle' && W.bau) lokiReady = true; lastReg = rg; }
    { const md3 = REG[rg].haunt ? 'story' : W.bardSong ? 'bard' + W.bardSong : REG[rg].mood || 'action'; if (md3 != regMood && window.WLMusic && window.WLMusic.mood) { regMood = md3; try { window.WLMusic.mood(md3); } catch(e){} } }
    for (const k in WAYS) if (!W.ways[k] && dist(p, px(WAYS[k])) < 80) { W.ways[k] = 1; say('✨ Waystone found: ' + WAYS[k].n + '! Use any waystone to travel here', 3); A.sfx('win'); save(); }
    for (let i = sticks.length - 1; i >= 0; i--) if (!p.stick && dist(sticks[i], p) < 30) { sticks.splice(i, 1); p.stick = 1; say('🪵 You picked up a stick! Throw it near Loki and watch what happens…', 2.6); A.sfx('coin'); }
    if (tornado) { tornado.t += dt; tornado.life -= dt; const ta = Math.atan2(p.y - tornado.y, p.x - tornado.x); tornado.x += Math.cos(ta)*70*dt; tornado.y += Math.sin(ta)*70*dt; const td = dist(tornado, p);
      if (td < 220 && td > 10) { p.vx -= Math.cos(ta)*160*dt; p.vy -= Math.sin(ta)*160*dt; } if (td < tornado.r) { tornado.hitT = (tornado.hitT || 0) - dt; if (tornado.hitT <= 0) { tornado.hitT = .8; hurtMe(1); } }
      if (tornado.life <= 0 || !boss) tornado = null; }
    revealT -= dt; if (revealT <= 0) { revealT = .25; reveal(); }
    saveT -= dt; if (saveT <= 0) { saveT = 15; save(); }
    // bosses wake up when you come close to their lair
    if (!boss) for (const k in LAIR) { if (RAIDS.some(R0 => R0.mini == k || R0.boss == k)) continue;   /* raid bosses only appear through the raid itself (they used to wake up again right after dying) */
      if (BOSS[k] && BOSS[k].saga) { if (!SG || !SG.bossReady(k)) continue; if (!dlg && dist(p, LAIR[k]) < (BOSS[k].wake || 380)) { spawnBoss(k); break; } continue; } if (bossDone(k)) continue; if (k == 'loki' && !gateOpen()) continue; if ((BOSS[k].ai || k == 'chao') && !storyReady(k)) continue; if (dlg) break; if (dist(p, LAIR[k]) < 380) { spawnBoss(k); break; } }
    thrTick(dt); bossFire(); if (boss) { if (boss.stunT > 0) { boss.stunT -= dt; boss.t += dt; if (dist(p, {x:boss.hx, y:boss.hy}) > 1150) bossAI(boss, 0); } else bossAI(boss, dt*(isRB(boss) ? 1 : tm('spd'))); if (boss) exUpdate(boss, dt); } hazUpdate(dt); if (thrBanner) { thrBanner.t -= dt; if (thrBanner.t <= 0) thrBanner = null; }
    // Loki's minions roam the land (never inside camp)
    spawnT -= dt; const cap = A.D(6, 8, 10); if (spawnT <= 0 && rg != 'camp' && !REG[rg].safe) { spawnT = 1.1; if (foes.length < cap && !boss) for (let k3 = 0; k3 < 6; k3++) { const a = Math.random()*TAU, r2 = 430 + Math.random()*260, sx = p.x + Math.cos(a)*r2, sy = p.y + Math.sin(a)*r2, rr2 = regAt(sx, sy);
        if (inRealm() ? !SG.inside(sx, sy) : (sx < TS*2 || sy < TS*2 || sx > WORLD - TS*2 || sy > WORLD - TS*2) || rr2 == 'camp' || M[Math.floor(sy/TS)*N + Math.floor(sx/TS)] == CAMP || REG[rr2].safe || (rr2 == 'oldroad' && Math.random() < .5) || blocked(sx, sy, 16) || (!spiritsOpen() && Math.floor(sx/TS) >= N0 && sy < N0*TS) || Math.hypot(sx - FIRE.x, sy - FIRE.y) < 600) continue; const pool = REG[rr2].pool; spawnFoe(pool[Math.floor(Math.random()*pool.length)], sx, sy); break; } }
    for (const f of foes) { const F = FOE[f.k], TG = lballT > 0 && dist(f, lb) < 420 ? lb : siege && F.siege && dist(f, p) > 120 ? BELL : p, d = dist(f, TG), ang = Math.atan2(TG.y - f.y, TG.x - f.x); f.flash = Math.max(0, (f.flash || 0) - dt); f.hurt = Math.max(0, f.hurt - dt); f.flap += dt*12; f.cool -= dt;
      if (d > 1150 && !F.clone) { f.dead = 1; continue; }
      if (f.kb > 0) { f.kb -= dt; const nx2 = f.x + f.kbx*dt, ny2 = f.y + f.kby*dt; if (F.fly || !blocked(nx2, ny2, 10)) { f.x = nx2; f.y = ny2; } }
      if (f.stun > 0) { f.stun -= dt; continue; }
      if (f.k == 'tguard') { if (!boss) { f.dead = 1; continue; } f.oa = (f.oa || 0) + dt*.7; const gx2 = boss.x + Math.cos(f.oa)*100, gy2 = boss.y + Math.sin(f.oa)*72; f.x += (gx2 - f.x)*Math.min(1, dt*4); f.y += (gy2 - f.y)*Math.min(1, dt*4); continue; }
      if (f.elite == 'heal') { f.healT = (f.healT || 2) - dt; if (f.healT <= 0) { f.healT = 2; for (const f2 of foes) if (!f2.dead && f2.hp < f2.max && dist(f2, f) < 140) { f2.hp = Math.min(f2.max, f2.hp + 1); addNum(f2.x, f2.y - 30, '+1', '#7fe08a'); } } }
      const aggro = ((d < (F.fly ? 340 : 300) || f.hurt > 0) && dist(p, FIRE) > 400) || (siege && f.sw); let vx = 0, vy = 0;
      if (F.lob && siege) { if (d > 380) { vx = Math.cos(ang); vy = Math.sin(ang); } f.cool -= 0; if (f.cool <= 0 && d < 460) { f.cool = 3.2; shot(f, ang, 170, {r:13, dmg:2, col:'#e8f4ff', life:3}); } }
      if (F.clone) { f.x += Math.sin(t*2 + f.flap)*20*dt; }
      else if (aggro) { if (F.shoot) { const want = d > 250 ? 1 : d < 160 ? -1 : 0, pa = ang + Math.PI/2; vx = Math.cos(ang)*want + Math.cos(pa)*f.dir*.6; vy = Math.sin(ang)*want + Math.sin(pa)*f.dir*.6; if (Math.random() < dt*.4) f.dir *= -1; }
        else { vx = Math.cos(ang); vy = Math.sin(ang); if (F.fly) { vx += Math.cos(t*5 + f.flap)*.6; vy += Math.sin(t*4 + f.flap)*.6; } } }
      else { f.wt -= dt; if (f.wt <= 0) { f.wt = 1.5 + Math.random()*2; f.wa = Math.random()*TAU; } vx = Math.cos(f.wa)*.35; vy = Math.sin(f.wa)*.35; }
      const sp2 = F.sp * (f.slow > 0 ? .5 : 1) * (f.sw ? 1 - .03*RL('beacon') : 1) * (f.elite == 'fast' ? 1.5 : 1); f.slow = Math.max(0, (f.slow || 0) - dt); const nx2 = f.x + vx*sp2*dt, ny2 = f.y + vy*sp2*dt;
      const inCamp = (x, y) => Math.hypot(x - FIRE.x, y - FIRE.y) < 8*TS;
      if (F.fly || !blocked(nx2, f.y, 10)) { if (!inCamp(nx2, f.y)) f.x = nx2; } else { f.wt = 0; f.dir *= -1; } if (F.fly || !blocked(f.x, ny2, 10)) { if (!inCamp(f.x, ny2)) f.y = ny2; } else f.wt = 0;
      if (F.ram && siege && d < F.r + 20) { bellHit(4); f.dead = 1; splat(f.x, f.y, 16, '#bfe9ff'); shakeV = 5; continue; }
      if (F.melee && TG === BELL && d < F.r + 20 && f.cool <= 0) { f.cool = 1.2; bellHit(F.melee); }
      else if (F.melee && d < F.r + 14 && f.cool <= 0) { f.cool = 1; hurtMe(F.melee); f.kbx = -Math.cos(ang)*200; f.kby = -Math.sin(ang)*200; f.kb = .25; }
      if (F.shoot && (aggro || F.clone) && f.cool <= 0 && d < 380) { f.cool = F.shoot * (.8 + Math.random()*.4) * A.D(1.3, 1, .8); if (F.hex) for (let i = -1; i <= 1; i++) shot(f, ang + i*.22, 230, {r:6, col:'#c04ae0', hex:1}); else shot(f, ang, F.big ? 220 : 270, {r:F.big ? 11 : 6, dmg:F.big ? 2 : 1}); } }
    foes = foes.filter(f => !f.dead);
    // ROYAL GUARD MAU MAU: follows you, throws, Shield Belly, Spear Charge, Snack Break, sniffs out snacks, naps when you stand still
    buffT = Math.max(0, buffT - dt);
    if (W.mau && !(boss && boss.k == 'sq_mau')) { mau.stT = Math.max(0, mau.stT - dt); mau.sayT = Math.max(0, mau.sayT - dt); mau.blockCd -= dt; mau.chargeCd -= dt; mau.snackCd -= dt; mau.quipT -= dt;
      const pm = Math.hypot(p.vx, p.vy) > 30; mau.idle = pm || boss || foes.some(f => dist(f, p) < 300) ? 0 : mau.idle + dt; if (pm && mau.idle == 0 && mau.wasSleep) { mau.wasSleep = 0; mauSay('Huh?! I was guarding! With my eyes closed!', 2.4); } if (mau.idle > 16) mau.wasSleep = 1;
      if (mau.dash) { mau.dash.t -= dt; const nx = mau.x + Math.cos(mau.dash.a)*520*dt, ny = mau.y + Math.sin(mau.dash.a)*520*dt; if (!blocked(nx, ny, 10)) { mau.x = nx; mau.y = ny; }
        for (const f of foes) if (!f.dead && !mau.dash.hit.includes(f) && dist(f, mau) < FOE[f.k].r + 18) { mau.dash.hit.push(f); hurtFoe(f, 3*X.armM()); f.stun = 1; splat(f.x, f.y, 8, '#F9BF01'); }
        if (boss && !mau.dash.hit.includes(boss) && dist(boss, mau) < boss.r + 18) { mau.dash.hit.push(boss); addStg(boss, 14); hurtBoss(4*X.armM()); }
        if (mau.dash.t <= 0) mau.dash = null; }
      else { const ms2 = SG && SG.mauSpot ? SG.mauSpot() : null, tx = ms2 ? ms2.x : p.x - Math.cos(p.face)*50, ty = ms2 ? ms2.y : p.y - Math.sin(p.face)*50 + 8, dm = Math.hypot(tx - mau.x, ty - mau.y); mau.moving = dm > 14 && mau.idle < 7;
        if (dm > 600) { mau.x = tx; mau.y = ty; } else if (dm > 14 && (mau.idle < 7 || dm > 160)) { const s2 = Math.min(dm*3.6, 280); mau.x += (tx - mau.x)/dm*s2*dt; mau.y += (ty - mau.y)/dm*s2*dt; mau.walk += dt; } }
      // Spear Charge at the nearest enemy
      if (mau.chargeCd <= 0 && !mau.dash) { let tg = null, bd = 230; for (const f of foes) { const d3 = dist(f, mau); if (d3 < bd && !FOE[f.k].clone) { bd = d3; tg = f; } } if (!tg && boss && dist(boss, mau) < 260) tg = boss;
        if (tg) { mau.dash = {a:Math.atan2(tg.y - mau.y, tg.x - mau.x), t:.42, hit:[]}; mau.chargeCd = guardCd(RL('guard')); mauSay('SPEAR CHARGE! For the Emperor!', 1.6); A.tone(300, .12, 'sawtooth', .04); } else mau.chargeCd = .5; }
      // Snack Break: when you're hurt, he eats a treat to heal and buff the team
      if (mau.snackCd <= 0 && p.hp <= Math.max(1, Math.floor(p.max*.4)) && (W.treats||0) > 0 && dead <= 0) { W.treats--; mau.snackCd = 30; mau.st2 = 'eat'; mau.stT = 1.8; buffT = Math.max(buffT, 10); p.hp = Math.min(p.max, p.hp + 3); mates.forEach(m => { if (!m.ko) m.hp = m.max; }); addNum(p.x, p.y - 44, '🐟 Snack Break! +3♥', '#c4601a'); mauSay('SNACK BREAK! *munch munch* Team, eat up!', 2.6); A.sfx('coin'); }
      // sniffing out hidden snacks
      mau.sniff = null; for (const sn of SNACKS) { if (W.snacks[sn.id]) continue; const ds = dist(sn, mau); if (ds < 170) { mau.sniff = sn; if (!sn.told) { sn.told = 1; mauSay('*sniff sniff* I smell a ' + {'🐟':'fish', '🍗':'drumstick', '🧀':'cheese', '🥛':'milk'}[sn.e] + '!', 2.4); } }
        if (ds < 170 && dist(sn, p) < 34) { W.snacks[sn.id] = 1; W.treats = (W.treats||0) + 1; addNum(sn.x, sn.y - 20, '+1 ' + sn.e, '#c4601a'); A.sfx('coin'); X.stat('snowSnack', 1, 'add'); mau.st2 = 'dance'; mau.stT = 1.6; save(); } }
      if (mau.quipT <= 0) { mau.quipT = 28 + Math.random()*20; if (!boss && mau.idle < 7) mauSay(MAU_LINES[Math.floor(Math.random()*MAU_LINES.length)], 3.2); }
      mau.cool -= dt; if (mau.cool <= 0 && !mau.dash && mau.idle < 7) { let tg = boss && dist(boss, mau) < 340 ? boss : null; if (!tg) { let bd = 320; for (const f of foes) { const d3 = dist(f, mau); if (d3 < bd) { bd = d3; tg = f; } } }
        if (tg) { mau.cool = 1.1; const a = Math.atan2(tg.y - mau.y, tg.x - mau.x); balls.push({x:mau.x, y:mau.y - 10, vx:Math.cos(a)*480, vy:Math.sin(a)*480, mine:1, dmg:(buffT > 0 ? 1.3 : 1)*(1 + .25*RL('guard'))*(1 + .1*RL('hall')), r:5, life:1.4, hits:[], col:'#ffe0f0', team:1}); } else mau.cool = .3; } }
    mates.forEach((m, i) => { m.throwT = Math.max(0, m.throwT - dt);
      if (m.ko > 0) { m.ko -= dt * (dist(m, p) < 50 ? 4 : 1) * (1 + .25*RL('infirmary')); if (m.ko <= 0) { m.ko = 0; m.hp = m.max; addNum(m.x, m.y - 30, m.name + ' is back!', '#00B451'); } return; }
      if (holdMates && !m.hx) { m.hx = m.x; m.hy = m.y; } if (holdMates && Math.hypot(m.hx - p.x, m.hy - p.y) > 650) { holdMates = false; say('👣 Your team is following you again', 2); } if (!holdMates) m.hx = 0; const ms3 = SG && SG.mateSpot ? SG.mateSpot(m, i) : null; if (m.fa == null) m.fa = p.face; m.fa += Math.atan2(Math.sin(p.face - m.fa), Math.cos(p.face - m.fa))*Math.min(1, dt*1.5);   /* the formation turns slowly, so teammates don't swing through each other */
      const a = m.fa + Math.PI + (i - (mates.length - 1)/2)*.8, rad = 84 + (i % 2)*34, tx = ms3 ? ms3.x : holdMates ? m.hx : p.x + Math.cos(a)*rad, ty = ms3 ? ms3.y : holdMates ? m.hy : p.y + Math.sin(a)*rad + 6, dm = Math.hypot(tx - m.x, ty - m.y);
      for (const o2 of [...mates, ...(W.mau ? [mau] : []), p]) { if (o2 === m) continue; const sd = Math.hypot(m.x - o2.x, m.y - o2.y), mn = o2 === p ? 40 : 46; if (sd > 0 && sd < mn) { m.x += (m.x - o2.x)/sd*(mn - sd)*.5; m.y += (m.y - o2.y)/sd*(mn - sd)*.5; } else if (sd == 0) m.x += 4; }
      if (dm > 650) { m.x = tx; m.y = ty; } else if (dm > 10) { const s2 = Math.min(dm*3.5, 280); m.x += (tx - m.x)/dm*s2*dt; m.y += (ty - m.y)/dm*s2*dt; m.walk += dt; }
      if (m.role == 'medic') { m.heal -= dt; if (m.heal <= 0 && p.hp < p.max && dead <= 0) { m.heal = Math.max(6, 14 - m.lv); p.hp++; addNum(p.x, p.y - 44, '➕ ' + m.name + ' +♥', '#ff5fa8'); } }
      m.cool -= dt; if (m.cool <= 0) { let tg = boss && dist(boss, m) < 360 ? boss : null; if (!tg) { let bd = 330; for (const f of foes) { const d3 = dist(f, m); if (d3 < bd) { bd = d3; tg = f; } } }
        if (!tg) { m.cool = .3; return; } m.cool = (m.role == 'thrower' ? 1.2 : m.role == 'builder' ? 1.7 : 2.2) / (1 + .1*m.lv); const a2 = Math.atan2(tg.y - m.y, tg.x - m.x); m.face = a2; m.throwT = .18;
        m.tri = (m.tri|0) + 1; const three = RL('hall') >= 8 && m.tri % 3 == 0; for (const da of three ? [-.18, 0, .18] : [0]) balls.push({team:1, x:m.x, y:m.y - 10, vx:Math.cos(a2 + da)*470, vy:Math.sin(a2 + da)*470, mine:1, dmg:X.armM()*(.5 + .1*m.lv)*(m.role == 'builder' ? 1.3 : 1)*(buffT > 0 ? 1.25 : 1)*(1 + .1*RL('hall')), r:m.role == 'builder' ? 7 : 5, life:1.4, hits:[], kind:m.role == 'builder' ? 'slush' : 'snow', col:m.role == 'builder' ? '#bfe0ff' : '#ffffff'}); } });
    // snowballs
    for (const b of balls) { b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
      if (b.kind == 'stick') { b.spin = (b.spin||0) + dt*18; if (b.life <= 0 || solidAt(b.x, b.y) || (boss && Math.hypot(boss.x - b.x, boss.y - b.y) < boss.r + 10)) { b.life = 0; if (boss && boss.k == 'loki' && Math.hypot(boss.x - b.x, boss.y - b.y) < 280) { boss.fetch = {x:b.x, y:b.y, t:3.4}; boss.talk = ['Loki: “Is that... a STICK?! Mine mine mine!”', 'Loki: “Don’t you DARE throw that again— ooh, STICK!”', 'Loki: “I can stop any time I want! ...STICK!”'][Math.floor(Math.random()*3)]; boss.talkT = 2.6; A.sfx('point'); } else sticks.push({x:b.x, y:b.y}); } continue; }
      if (b.kind == 'boomer' && !b.ret && b.life < .45) { b.ret = 1; b.hits = []; const a = Math.atan2(p.y - b.y, p.x - b.x); b.vx = Math.cos(a)*560; b.vy = Math.sin(a)*560; b.life = .9; }
      if (solidAt(b.x, b.y) && !(b.mine && b.ret) && !overGap(b.x, b.y)) { b.life = 0; splat(b.x, b.y, 5, b.col); continue; }
      if (b.mine) { for (const f of foes) { if (f.dead || b.hits.includes(f) || Math.hypot(f.x - b.x, f.y - 8 - b.y) > FOE[f.k].r + b.r) continue; b.hits.push(f);
          let dm2 = b.dmg; if (f.elite == 'shield' && !f.shB) { if (b.chg >= .5) { f.shB = 1; addNum(f.x, f.y - 46, 'SHIELD BROKEN!', '#64CDF5'); } else dm2 *= .3; } if (b.team) f.mateHit = t; else if (t - (f.mateHit || -9) < .6) { dm2 *= 1.5; addNum(f.x, f.y - 46, 'TEAM COMBO!', '#EA55AB'); f.mateHit = -9; } hurtFoe(f, dm2); if (b.kind == 'slush') f.slow = 3; if (b.kind == 'sparkle') { for (const f2 of foes) if (f2 !== f && !f2.dead && dist(f2, f) < 70) hurtFoe(f2, b.dmg*.5); splat(b.x, b.y, 12, '#ffe9a0'); }
          const ka = Math.atan2(b.vy, b.vx); f.kbx = Math.cos(ka)*120; f.kby = Math.sin(ka)*120; f.kb = .12; splat(b.x, b.y, 6); A.sfx('hit'); if (!b.pierce) { b.life = 0; break; } }
        if (b.life > 0 && boss && !b.hits.includes(boss) && Math.hypot(boss.x - b.x, boss.y - b.y) < boss.r + b.r) { b.hits.push(boss); boss.lastBall = b; hurtBoss(b.dmg * (1 + .1*X.PU('boss')), b); splat(b.x, b.y, 7); A.sfx('hit'); if (!b.pierce) b.life = 0; } }
      else { if (p.fortT > 0 && Math.hypot(b.x - p.x, b.y - p.y) < 64) { b.life = 0; splat(b.x, b.y, 5); continue; }
        const rh = RL('hall') >= 4 ? RL('hall') : 0, bR = 70 + 6*rh; if (W.mau && mau.blockCd <= 0 && (Math.hypot(b.x - mau.x, b.y - mau.y) < 26 + 2*rh || (Math.hypot(b.x - p.x, b.y - p.y) < 44 && dist(mau, p) < bR) || mates.some(m => !m.ko && Math.hypot(b.x - m.x, b.y - m.y) < 40 && dist(mau, m) < bR))) { b.life = 0; mau.blockCd = 4.5/(1 + .08*rh); mau.st2 = 'block'; mau.stT = .5; addNum(mau.x, mau.y - 40, 'SHIELD BELLY!', '#2f5fd0'); splat(b.x, b.y, 8, '#F9BF01'); A.tone(180, .08, 'square', .05); continue; }
        if (siege && Math.hypot(b.x - BELL.x, b.y - (BELL.y - 20)) < 26 + b.r) { b.life = 0; bellHit(b.dmg); splat(b.x, b.y, 6); continue; }
        if (Math.hypot(b.x - p.x, b.y - (p.y - 8)) < 13 + b.r) { b.life = 0; hurtMe(b.dmg); continue; }
        for (const m of mates) if (!m.ko && Math.hypot(b.x - m.x, b.y - (m.y - 8)) < 12 + b.r) { b.life = 0; m.hp -= b.dmg; splat(m.x, m.y - 8, 6); if (m.hp <= 0) { m.ko = 10; say('💫 ' + m.name + ' is knocked out! Stand next to them to help them up faster', 2.2); } break; } } }
    balls = balls.filter(b => b.life > 0);
    A.mood(() => ({danger:p.hp == 1, boss:!!boss}));
    { const RB = inRealm() ? SG.bounds() : null, lo = RB ? RB.x0 : raid ? N*TS : 0, hi = RB ? RB.x1 : raid ? (N + 40)*TS : WORLD, tx = Math.max(lo, Math.min(hi - VW, p.x - VW/2)), ty = Math.max(0, Math.min((RB ? RB.y1 : WORLD) - VH, p.y - VH/2 - 20)); if (Math.abs(tx - cam.x) > 500 || Math.abs(ty - cam.y) > 500) { cam.x = tx; cam.y = ty; } else { const k = Math.min(1, dt*9); cam.x += (tx - cam.x)*k; cam.y += (ty - cam.y)*k; } }
    shakeV = Math.max(0, shakeV - dt*20); cheerT = Math.max(0, cheerT - dt); p.roll = Math.max(0, (p.roll||0) - dt); p.rollCd = Math.max(0, (p.rollCd||0) - dt); };
  // ---------- drawing ----------
  // the Threat badge: a little ice crystal that gets more points and a hotter colour every tier (tap it for details)
  const thrIcon = (x, y, T2, s2) => { const c = THR[T2].c; g.save(); g.translate(x, y); g.scale(s2, s2); g.fillStyle = 'rgba(20,32,74,.9)'; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill(); g.fillStyle = c; g.strokeStyle = '#fff'; g.lineWidth = 1;
    const n = 3 + T2; g.beginPath(); for (let i = 0; i < n*2; i++) { const a = -Math.PI/2 + i*Math.PI/n, r2 = i % 2 ? 3.5 : 9; g.lineTo(Math.cos(a)*r2, Math.sin(a)*r2); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill(); g.restore(); };
  const drawThreat = (x, y) => { if (inRealm() && rOn()) { thrR = null; return; } const T2 = thr(), lb = 'Threat: ' + THR[T2].n + (W.forceThreat != null && W.forceThreat >= 0 ? ' (admin)' : ''); g.font = '800 11px ' + A.font; const w2 = g.measureText(lb).width + 36;
    g.fillStyle = 'rgba(20,32,74,.6)'; rr(g, x, y, w2, 22, 11); g.fill(); thrIcon(x + 12, y + 11, T2, .8); g.fillStyle = THR[T2].c; g.textAlign = 'left'; g.fillText(lb, x + 26, y + 15); thrR = {x, y, w:w2, h:22};
    if (thrBanner) { const k2 = Math.min(1, thrBanner.t, (6 - thrBanner.t)*2), T3 = THR[thrBanner.T]; g.globalAlpha = Math.max(0, k2); g.fillStyle = 'rgba(8,14,34,.82)'; g.fillRect(0, 150, VW, 92); g.strokeStyle = T3.c; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 150); g.lineTo(VW, 150); g.moveTo(0, 242); g.lineTo(VW, 242); g.stroke();
      g.font = '900 22px ' + A.font; const tl = 'The Kingdom grows colder. Threat: ' + T3.n, tw2 = g.measureText(tl).width; thrIcon(VW/2 - tw2/2 - 8, 185, thrBanner.T, 1.5); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(tl, VW/2 + 14, 192); g.fillStyle = '#cfe3f5'; g.font = '600 13px ' + A.font; g.fillText('Your gear got stronger, and so did your enemies. Bosses learn new tricks at Fierce, Brutal and Mythic.', VW/2, 222); g.globalAlpha = 1; } };
  const threatPanel = () => openPanelUI(() => ({title:'❄ Threat: ' + THR[thr()].n, sub:'Gear Score ' + gearScore() + ' now · highest ever ' + (W.gsMax || 0) + '. Threat follows your highest Gear Score: better gear = tougher bosses and enemies, but more Frost Crystals. Hearts, skills and your base never raise it.',
    rows:THR.map((T2, i) => ({e:i == thr() ? '▶️' : i < thr() ? '✅' : '⬜', n:T2.n + ' · Gear Score ' + T2.gs + '+', d:'Bosses ×' + TM.bhp[i] + ' health, ×' + TM.bdm[i] + ' damage · enemies ×' + TM.fhp[i] + ' · ×' + TM.loot[i] + ' 🔷' + (i == 2 ? ' · Frost Guards' : i == 4 ? ' · second forms' : i == 6 ? ' · icicle rain' : ''), btn:''}))}));
  const kid = (x, y, col, o = {}) => { if (o.outfit == 'guard') { col = '#2f5fd0'; } else if (o.outfit == 'bau') col = '#e8a050'; else if (o.outfit == 'god') col = '#3a2a8a'; else if (o.outfit == 'raid') col = '#7a1a2a'; g.save(); g.translate(x, y); if (o.hit) g.globalAlpha = .55; const bob = o.walk ? Math.sin(o.walk*14)*2 : 0;
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(0, 16, 13, 4, 0, 0, TAU); g.fill();
    g.fillStyle = '#14204a'; g.fillRect(-8, 6 + bob*.5, 6, 10); g.fillRect(2, 6 - bob*.5, 6, 10);
    g.fillStyle = col; rr(g, -11, -8, 22, 18, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-11, 1, 22, 3);
    // two arms, always outside the body with an outline and mittens: the throwing arm follows your aim, the other hangs at your side
    const fc = Math.cos(o.face || 0), sd = fc >= 0 ? 1 : -1, act = o.throwT > 0 || o.charge > 0, aa = act ? o.face : Math.PI/2 - sd*.35, sw = o.walk ? Math.sin(o.walk*14)*.25 : 0;
    const arm = (sx, a2) => { const x0 = sx*10, y0 = -5, x1 = x0 + Math.cos(a2)*11, y1 = y0 + Math.sin(a2)*11; g.lineCap = 'round'; g.strokeStyle = 'rgba(20,32,74,.35)'; g.lineWidth = 7; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.fillStyle = '#14204a'; g.beginPath(); g.arc(x1, y1, 3, 0, TAU); g.fill(); return [x1, y1]; };
    arm(-sd, Math.PI/2 + sd*.35 - sw); const hnd = arm(sd, act ? aa : aa + sw);
    if (o.charge > 0) { g.fillStyle = '#fff'; g.beginPath(); g.arc(hnd[0] + Math.cos(aa)*3, hnd[1] + Math.sin(aa)*3, 4 + 5*Math.min(1, o.charge), 0, TAU); g.fill(); }
    g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(0, -16, 9, 0, TAU); g.fill();
    g.fillStyle = o.hat || col; g.beginPath(); g.arc(0, -19, 9.5, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -29, 3.5, 0, TAU); g.fill();
    g.fillStyle = '#14204a'; g.beginPath(); g.arc(-3, -15, 1.6, 0, TAU); g.arc(3, -15, 1.6, 0, TAU); g.fill();
    if (o.outfit == 'guard') { g.fillStyle = '#F9BF01'; g.fillRect(-11, -8, 22, 3); g.fillRect(-2, -8, 4, 16); g.fillStyle = '#c8d0dc'; g.beginPath(); g.arc(0, -19, 10.5, Math.PI, 0); g.fill(); g.fillStyle = '#9aa4b4'; g.fillRect(-10.5, -20, 21, 3); g.fillStyle = '#c8102e'; g.beginPath(); g.moveTo(-2, -29); g.quadraticCurveTo(6, -38, 12, -30); g.lineTo(2, -27); g.fill(); }
    else if (o.outfit == 'm_frost') { g.fillStyle = '#bfe9ff'; g.beginPath(); g.arc(0, -19, 10.5, Math.PI, 0); g.fill(); g.fillStyle = '#64CDF5'; g.beginPath(); g.moveTo(-2, -29); g.lineTo(0, -37); g.lineTo(2, -29); g.fill(); g.fillStyle = '#e8f8ff'; rr(g, -14, -9, 8, 6, 3); g.fill(); rr(g, 6, -9, 8, 6, 3); g.fill(); g.strokeStyle = '#64CDF5'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-10.5, -19); g.lineTo(10.5, -19); g.stroke(); }
    else if (o.outfit == 'm_star') { g.fillStyle = '#2a2a6a'; g.beginPath(); g.moveTo(-9, -6); g.lineTo(9, -6); g.lineTo(13, 10); g.lineTo(-13, 10); g.fill(); g.beginPath(); g.arc(0, -19, 11, Math.PI*.95, Math.PI*.05); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI/2 + i*Math.PI/5, r2 = i % 2 ? 1.6 : 3.8; g.lineTo(Math.cos(a)*r2, -25 + Math.sin(a)*r2); } g.fill(); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(-7, 2, 1.6, 1.6); g.fillRect(5, 6, 1.6, 1.6); }
    else if (o.outfit == 'bau') { g.fillStyle = '#e8a050'; g.beginPath(); g.arc(0, -19, 10.5, Math.PI, 0); g.fill(); for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx*9, -22); g.lineTo(sx*7, -33); g.lineTo(sx*2, -26); g.fill(); g.fillStyle = '#ffc0cb'; g.beginPath(); g.moveTo(sx*7.5, -24); g.lineTo(sx*6.6, -30); g.lineTo(sx*4, -26); g.fill(); g.fillStyle = '#e8a050'; } g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(-5, -28); g.lineTo(-5, -33); g.lineTo(-2.5, -30.5); g.lineTo(0, -34); g.lineTo(2.5, -30.5); g.lineTo(5, -33); g.lineTo(5, -28); g.fill(); }
    g.restore(); };
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
  // a Frost Guard: a small ice knight with a tower shield (Threat: Fierce and up)
  const guardArt = (x, y, f) => { const a = Math.atan2(y - (boss ? boss.y : y), x - (boss ? boss.x : x)); g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 16, 14, 4, 0, 0, TAU); g.fill();
    g.fillStyle = '#9fb4d0'; g.fillRect(x - 8, y + 4, 6, 11); g.fillRect(x + 2, y + 4, 6, 11); g.fillStyle = '#cfeaff'; rr(g, x - 12, y - 12, 24, 20, 6); g.fill(); g.strokeStyle = '#64CDF5'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#e8f8ff'; g.beginPath(); g.arc(x, y - 18, 10, Math.PI, 0); g.lineTo(x + 10, y - 13); g.lineTo(x - 10, y - 13); g.fill(); g.fillStyle = '#14204a'; g.fillRect(x - 6, y - 18, 12, 3); g.fillStyle = '#64CDF5'; g.beginPath(); g.moveTo(x - 2, y - 28); g.lineTo(x, y - 34); g.lineTo(x + 2, y - 28); g.fill();
    g.strokeStyle = '#c8ccd4'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 14, y + 10); g.lineTo(x + 14, y - 30); g.stroke(); g.fillStyle = '#9fe8ff'; g.beginPath(); g.moveTo(x + 10, y - 30); g.lineTo(x + 14, y - 40); g.lineTo(x + 18, y - 30); g.fill();
    const sx = x + Math.cos(a)*10, sy = y - 2 + Math.sin(a)*6; g.fillStyle = '#64CDF5'; rr(g, sx - 9, sy - 12, 18, 22, 5); g.fill(); g.strokeStyle = '#e8f8ff'; g.lineWidth = 2; g.stroke(); g.strokeStyle = '#2f5fd0'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy - 8); g.lineTo(sx, sy + 6); g.moveTo(sx - 5, sy - 2); g.lineTo(sx + 5, sy - 2); g.stroke(); };
  // elite enemies wear a coloured ring and a small sign of their trick
  const eliteMark = f => { const x = f.x, y = f.y, c = {shield:'#64CDF5', fast:'#F9BF01', split:'#c04ae0', heal:'#7fe08a'}[f.elite], r = FOE[f.k].r + 6; g.strokeStyle = c; g.lineWidth = 3; g.globalAlpha = .7 + .3*Math.sin(t*5); g.beginPath(); g.ellipse(x, y + 14, r, r*.32, 0, 0, TAU); g.stroke(); g.globalAlpha = 1;
    const hx = x, hy = y - FOE[f.k].r - 26; g.fillStyle = 'rgba(20,32,74,.8)'; g.beginPath(); g.arc(hx, hy, 9, 0, TAU); g.fill(); g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 2;
    if (f.elite == 'shield') { g.beginPath(); g.moveTo(hx - 5, hy - 5); g.lineTo(hx + 5, hy - 5); g.lineTo(hx + 5, hy); g.quadraticCurveTo(hx + 5, hy + 5, hx, hy + 6); g.quadraticCurveTo(hx - 5, hy + 5, hx - 5, hy); g.closePath(); if (!f.shB) g.fill(); else g.stroke(); }
    else if (f.elite == 'fast') { g.beginPath(); g.moveTo(hx - 5, hy - 4); g.lineTo(hx, hy); g.lineTo(hx - 5, hy + 4); g.moveTo(hx, hy - 4); g.lineTo(hx + 5, hy); g.lineTo(hx, hy + 4); g.stroke(); }
    else if (f.elite == 'split') { g.beginPath(); g.arc(hx - 2.5, hy, 3.2, 0, TAU); g.arc(hx + 3.5, hy, 3.2, 0, TAU); g.fill(); }
    else { g.fillRect(hx - 1.5, hy - 5, 3, 10); g.fillRect(hx - 5, hy - 1.5, 10, 3); if (!low()) { g.strokeStyle = 'rgba(127,224,138,.25)'; g.beginPath(); g.arc(x, y, 140, 0, TAU); g.stroke(); } } };
  const drawFoe = f => { const F = FOE[f.k], x = f.x, y = f.y; if ((F.gecko || F.rd) && SG && SG.drawFoe) { SG.drawFoe(f); return; } if (f.flash > 0) g.globalAlpha = .6;
    if (f.k == 'tguard') guardArt(x, y, f);
    else if (f.k == 'pup') dog(x, y, {s:.75, fur:'#8a5cf0', ear:'#5a3ab0', snout:'#c8b0ff', eyes:'#ffe066', brows:1});
    else if (f.k == 'hound') dog(x, y, {s:.95, fur:'#2a2040', ear:'#14101f', snout:'#4a3a6a', eyes:'#FF4539', brows:1});
    else if (f.k == 'clone') SC.loki(g, x, y, {s:1.15, alpha:.5, cast:1}, t);
    else if (f.k == 'shade') SC.shade(g, x, y, {}, t);
    else if (f.k == 'wisp') { const fl = Math.sin(f.flap*.4)*3; const gl = g.createRadialGradient(x, y - 6 + fl, 2, x, y - 6 + fl, 18); gl.addColorStop(0, 'rgba(220,250,255,.95)'); gl.addColorStop(1, 'rgba(120,200,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y - 6 + fl, 18, 0, TAU); g.fill(); g.fillStyle = '#14204a'; g.beginPath(); g.arc(x - 3, y - 7 + fl, 1.4, 0, TAU); g.arc(x + 3, y - 7 + fl, 1.4, 0, TAU); g.fill(); }
    else if (f.k == 'stormling') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 14, 13, 4, 0, 0, TAU); g.fill(); g.fillStyle = '#5a6a8a'; for (const [ox, oy, r2] of [[-8, -2, 9], [6, -4, 10], [0, -10, 9], [10, 2, 7], [-10, 4, 7]]) { g.beginPath(); g.arc(x + ox, y + oy, r2, 0, TAU); g.fill(); }
      g.fillStyle = '#ffe066'; g.beginPath(); g.moveTo(x - 2, y + 4); g.lineTo(x + 3, y + 4); g.lineTo(x - 1, y + 14); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 4, y - 5, 2.2, 0, TAU); g.arc(x + 5, y - 5, 2.2, 0, TAU); g.fill(); g.strokeStyle = '#14204a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 7, y - 9); g.lineTo(x - 2, y - 7); g.moveTo(x + 8, y - 9); g.lineTo(x + 3, y - 7); g.stroke(); }
    else if (f.k == 'yeti') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 16, 16, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#f4f8ff'; g.beginPath(); g.ellipse(x, y, 15, 16, 0, 0, TAU); g.fill(); g.strokeStyle = '#c8d8e8'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#8ab0d0'; g.beginPath(); g.ellipse(x, y - 4, 8, 7, 0, 0, TAU); g.fill(); g.fillStyle = '#14204a'; g.beginPath(); g.arc(x - 3, y - 6, 1.6, 0, TAU); g.arc(x + 3, y - 6, 1.6, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 3, y - 2, 2, 3); g.fillRect(x + 1, y - 2, 2, 3); }
    else if (f.k == 'decoy') SC.spirit(g, 'chao', x, y, {ghost:1, mood:'mad', jitter:.6, alpha:.4 + .15*Math.sin(t*9 + f.flap)}, t);
    else if (f.k == 'echo') { g.save(); g.globalAlpha = .75; SC.spirit(g, 'chao', x, y, {fur:'#2a2a3a', belly:'#3a3a4a', patch:'#1a1a2a', mask:'#1a1a2a', ghost:1, glow:'#8a6aff', mood:'mad', jitter:.4}, t); g.restore(); }
    else if (f.k == 'goon') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 16, 13, 4, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.strokeStyle = '#c8d8e8'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y + 4, 13, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(x, y - 14, 9, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#7a3ab0'; g.fillRect(x - 9, y - 7, 18, 4); g.fillStyle = '#121313'; g.beginPath(); g.arc(x - 3, y - 15, 1.6, 0, TAU); g.arc(x + 3, y - 15, 1.6, 0, TAU); g.fill(); g.strokeStyle = '#121313'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 6, y - 20); g.lineTo(x - 1, y - 18); g.moveTo(x + 6, y - 20); g.lineTo(x + 1, y - 18); g.stroke();
      g.fillStyle = '#ff8a3c'; g.beginPath(); g.moveTo(x, y - 13); g.lineTo(x + 7, y - 12); g.lineTo(x, y - 11); g.fill(); g.strokeStyle = '#6b4a2b'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 12, y + 2); g.lineTo(x - 22, y - 6); g.moveTo(x + 12, y + 2); g.lineTo(x + 22, y - 6); g.stroke(); }
    else if (f.k == 'bat') { const fl = Math.sin(f.flap)*6; g.fillStyle = '#3a7ab0'; g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x - 18, y - 12 - fl); g.lineTo(x - 10, y + 2); g.fill(); g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 18, y - 12 - fl); g.lineTo(x + 10, y + 2); g.fill(); g.fillStyle = '#5ab0e0'; g.beginPath(); g.arc(x, y - 4, 7, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 2.5, y - 5, 1.5, 0, TAU); g.arc(x + 2.5, y - 5, 1.5, 0, TAU); g.fill(); }
    else if (f.k == 'golem') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 20, 22, 6, 0, 0, TAU); g.fill(); g.fillStyle = '#bfe9ff'; rr(g, x - 20, y - 26, 40, 44, 8); g.fill(); g.strokeStyle = '#7fb8d8'; g.lineWidth = 2; g.stroke(); g.beginPath(); g.moveTo(x - 8, y - 20); g.lineTo(x - 2, y - 6); g.lineTo(x - 10, y + 8); g.stroke();
      g.fillStyle = '#64CDF5'; g.beginPath(); g.arc(x - 7, y - 14, 3, 0, TAU); g.arc(x + 7, y - 14, 3, 0, TAU); g.fill(); g.fillStyle = '#bfe9ff'; rr(g, x - 30, y - 16, 10, 26, 4); g.fill(); rr(g, x + 20, y - 16, 10, 26, 4); g.fill(); }
    else if (f.k == 'imp') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 14, 11, 3, 0, 0, TAU); g.fill(); g.fillStyle = '#9a3ac0'; g.beginPath(); g.moveTo(x - 6, y - 8); g.lineTo(x - 20, y - 18 + Math.sin(f.flap)*4); g.lineTo(x - 10, y); g.fill(); g.beginPath(); g.moveTo(x + 6, y - 8); g.lineTo(x + 20, y - 18 + Math.sin(f.flap)*4); g.lineTo(x + 10, y); g.fill();
      g.fillStyle = '#c04ae0'; g.beginPath(); g.arc(x, y - 4, 11, 0, TAU); g.fill(); g.fillStyle = '#5a2a9a'; g.beginPath(); g.moveTo(x - 8, y - 12); g.lineTo(x - 10, y - 22); g.lineTo(x - 3, y - 14); g.fill(); g.beginPath(); g.moveTo(x + 8, y - 12); g.lineTo(x + 10, y - 22); g.lineTo(x + 3, y - 14); g.fill();
      g.fillStyle = '#ffe066'; g.beginPath(); g.arc(x - 4, y - 5, 2.2, 0, TAU); g.arc(x + 4, y - 5, 2.2, 0, TAU); g.fill(); }
    else if (f.k == 'catapult') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 16, 22, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#8D5B1D'; rr(g, x - 20, y - 2, 40, 12, 3); g.fill(); g.fillStyle = '#5a3a1a'; for (const ox of [-13, 13]) { g.beginPath(); g.arc(x + ox, y + 12, 6, 0, TAU); g.fill(); }
      const arm = f.cool > 2.6 ? -.2 : -1.1; g.save(); g.translate(x - 4, y - 2); g.rotate(arm); g.fillStyle = '#a0703a'; g.fillRect(0, -3, 26, 5); g.fillStyle = '#e8f4ff'; g.beginPath(); g.arc(26, -4, 6, 0, TAU); g.fill(); g.restore(); }
    else if (f.k == 'ram') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 16, 22, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#7a5a3a'; rr(g, x - 22, y - 8, 44, 18, 6); g.fill(); g.fillStyle = '#bfe3ff'; g.beginPath(); g.moveTo(x + 22, y - 10); g.lineTo(x + 34, y + 1); g.lineTo(x + 22, y + 12); g.fill();
      g.fillStyle = '#e8f4ff'; rr(g, x - 20, y - 14, 40, 7, 3); g.fill(); g.fillStyle = '#5a3a1a'; for (const ox of [-14, 0, 14]) { g.beginPath(); g.arc(x + ox, y + 12, 5, 0, TAU); g.fill(); } }
    else if (f.k == 'snowman') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 22, 22, 6, 0, 0, TAU); g.fill(); for (const [oy, r2] of [[8, 18], [-14, 13], [-32, 10]]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y + oy, r2, 0, TAU); g.fill(); g.strokeStyle = '#c8d8e8'; g.lineWidth = 1.5; g.stroke(); }
      g.fillStyle = '#14204a'; g.beginPath(); g.arc(x - 4, y - 34, 2, 0, TAU); g.arc(x + 4, y - 34, 2, 0, TAU); g.fill(); g.strokeStyle = '#14204a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 7, y - 41); g.lineTo(x - 2, y - 38); g.moveTo(x + 7, y - 41); g.lineTo(x + 2, y - 38); g.stroke();
      g.fillStyle = '#ff8c1a'; g.beginPath(); g.moveTo(x, y - 31); g.lineTo(x + 10, y - 29); g.lineTo(x, y - 27); g.fill(); g.fillStyle = '#2f5fd0'; g.fillRect(x - 12, y - 24, 24, 4); }
    g.globalAlpha = 1;
    if (f.max > 1 && f.hp < f.max) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 15, y + 22, 30, 4); g.fillStyle = '#FF4539'; g.fillRect(x - 15, y + 22, 30*Math.max(0, f.hp)/f.max, 4); }
    if (f.stun > 0) { g.font = '12px ' + A.font; g.textAlign = 'center'; g.fillText('💫', x, y - 30); } if (f.slow > 0) { g.strokeStyle = '#64CDF5'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 4, F.r + 6, 0, TAU); g.stroke(); } };
  // raid bosses + the Siege King: simple, friendly looks (no gore)
  const RLOOK = {r_knight:{f:'knight', c:'#9ab4d8', c2:'#5a6a8a', s:1}, r_warden:{f:'hood', c:'#bfe3ff', c2:'#3a4a7a', s:1.35}, r_lantern:{f:'lantern', c:'#9fe8ff', c2:'#3a5a8a', s:1},
    r_queen:{f:'hood', c:'#e8d8ff', c2:'#7a5ab0', s:1.35, crown:1}, r_sentinel:{f:'golem', c:'#8a8aa8', c2:'#ffe066', s:1}, r_titan:{f:'golem', c:'#6a6a8a', c2:'#9fe8ff', s:1.45, crown:1},
    r_vgolem:{f:'golem', c:'#f2d27a', c2:'#9fe8ff', s:1.1}, r_book:{f:'book', c:'#7a4ab0', c2:'#ffe066', s:1}, snowking:{f:'snowman', c:'#ffffff', c2:'#F9BF01', s:1.5, crown:1}, sq_frost:{f:'hood', c:'#9fd8ff', c2:'#1c1830', s:1.3}};
  const raidLook = (B, x, y) => { const L = RLOOK[B.k], ang = B.ph >= 2, eye = ang ? '#FF4539' : '#14204a', bob = Math.sin(t*3)*3; g.save(); g.translate(x, y); g.scale(L.s, L.s);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 30, 28, 7, 0, 0, TAU); g.fill();
    if (L.f == 'knight') { g.fillStyle = L.c2; rr(g, -16, -6, 32, 34, 8); g.fill(); g.fillStyle = L.c; g.beginPath(); g.arc(0, -16, 15, 0, TAU); g.fill(); g.fillStyle = '#14204a'; g.fillRect(-10, -18, 20, 4); g.fillStyle = eye; g.fillRect(-7, -18, 4, 4); g.fillRect(3, -18, 4, 4);
      g.fillStyle = '#c8102e'; g.beginPath(); g.moveTo(0, -31); g.quadraticCurveTo(14, -40, 18, -26); g.lineTo(0, -28); g.fill(); g.fillStyle = L.c; rr(g, -32, -4, 18, 26, 6); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(-23, 0); g.lineTo(-23, 18); g.moveTo(-29, 8); g.lineTo(-17, 8); g.stroke();
      g.strokeStyle = '#dfeaf5'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(18, 6); g.lineTo(32, -18 + bob); g.stroke(); }
    else if (L.f == 'hood') { g.fillStyle = L.c2; g.beginPath(); g.moveTo(-24, 30); g.quadraticCurveTo(-26, -20, 0, -40 + bob); g.quadraticCurveTo(26, -20, 24, 30); g.closePath(); g.fill(); g.fillStyle = '#0a1430'; g.beginPath(); g.ellipse(0, -14 + bob, 13, 15, 0, 0, TAU); g.fill();
      g.fillStyle = ang ? '#FF4539' : L.c; g.beginPath(); g.arc(-5, -15 + bob, 3, 0, TAU); g.arc(5, -15 + bob, 3, 0, TAU); g.fill(); g.strokeStyle = '#8D5B1D'; g.lineWidth = 3; g.beginPath(); g.moveTo(26, 30); g.lineTo(26, -26); g.stroke();
      if (!low()) { g.fillStyle = 'rgba(160,230,255,' + (.35 + .2*Math.sin(t*5)) + ')'; g.beginPath(); g.arc(26, -30, 12, 0, TAU); g.fill(); } g.fillStyle = L.c; g.beginPath(); g.arc(26, -30, 6, 0, TAU); g.fill(); }
    else if (L.f == 'lantern') { g.translate(0, bob*2); if (!low()) { g.fillStyle = 'rgba(160,230,255,.25)'; g.beginPath(); g.arc(0, -6, 34, 0, TAU); g.fill(); } g.fillStyle = '#3a4a6a'; rr(g, -14, -34, 28, 6, 3); g.fill(); rr(g, -14, 16, 28, 6, 3); g.fill(); g.fillStyle = L.c; rr(g, -12, -28, 24, 44, 8); g.fill();
      g.fillStyle = eye; g.beginPath(); g.arc(-5, -8, 3, 0, TAU); g.arc(5, -8, 3, 0, TAU); g.fill(); g.strokeStyle = '#14204a'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 5, .2, Math.PI - .2); g.stroke(); g.strokeStyle = '#3a4a6a'; g.beginPath(); g.arc(0, -40, 7, Math.PI, 0); g.stroke(); }
    else if (L.f == 'golem') { for (const [ox, oy, r2] of [[0, 4, 22], [-24, -4, 11], [24, -4, 11], [0, -24, 14], [-12, 26, 8], [12, 26, 8]]) { g.fillStyle = L.c; g.beginPath(); g.arc(ox, oy, r2, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 2; g.stroke(); }
      g.strokeStyle = L.c2; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-6, -4); g.lineTo(2, 6); g.lineTo(-4, 16); g.stroke(); g.fillStyle = ang ? '#FF4539' : L.c2; g.beginPath(); g.arc(-5, -26, 3, 0, TAU); g.arc(5, -26, 3, 0, TAU); g.fill(); }
    else if (L.f == 'book') { g.translate(0, bob*2); const fl = Math.sin(t*6)*.25; g.fillStyle = L.c; g.save(); g.rotate(-.15 - fl); rr(g, -34, -16, 34, 40, 4); g.fill(); g.restore(); g.save(); g.rotate(.15 + fl); rr(g, 0, -16, 34, 40, 4); g.fill(); g.restore();
      g.fillStyle = '#fff8e0'; rr(g, -28, -12, 56, 32, 3); g.fill(); g.strokeStyle = '#c8b890'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-24, -4 + i*6); g.lineTo(-4, -4 + i*6); g.moveTo(4, -4 + i*6); g.lineTo(24, -4 + i*6); g.stroke(); }
      g.fillStyle = eye; g.beginPath(); g.arc(-12, -20, 4, 0, TAU); g.arc(12, -20, 4, 0, TAU); g.fill(); g.fillStyle = L.c2; g.font = '14px ' + A.font; g.textAlign = 'center'; g.fillText('✦', 0, 34 + Math.sin(t*4)*3); }
    else if (L.f == 'snowman') { for (const [oy, r2] of [[14, 22], [-14, 16], [-36, 12]]) { g.fillStyle = L.c; g.beginPath(); g.arc(0, oy, r2, 0, TAU); g.fill(); g.strokeStyle = '#c8d8e8'; g.lineWidth = 1.5; g.stroke(); }
      g.fillStyle = eye; g.beginPath(); g.arc(-4, -38, 2.2, 0, TAU); g.arc(4, -38, 2.2, 0, TAU); g.fill(); g.fillStyle = '#ff8c1a'; g.beginPath(); g.moveTo(0, -35); g.lineTo(12, -33); g.lineTo(0, -31); g.fill(); g.fillStyle = '#14204a'; for (const yy of [-18, -10, 8]) { g.beginPath(); g.arc(0, yy, 2, 0, TAU); g.fill(); }
      g.strokeStyle = '#6b4a2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, -16); g.lineTo(-32, -26 + bob); g.moveTo(14, -16); g.lineTo(32, -26 - bob); g.stroke(); g.fillStyle = '#c8102e'; g.fillRect(-14, -26, 28, 5); }
    if (L.crown) { const cy = L.f == 'snowman' ? -50 : L.f == 'golem' ? -38 : -42; g.fillStyle = L.f == 'snowman' ? L.c2 : '#F9BF01'; g.beginPath(); g.moveTo(-11, cy + 8); g.lineTo(-11, cy); g.lineTo(-5, cy + 5); g.lineTo(0, cy - 3); g.lineTo(5, cy + 5); g.lineTo(11, cy); g.lineTo(11, cy + 8); g.closePath(); g.fill(); }
    g.restore(); };
  const drawBoss = B => { const x = B.x, y = B.y; if (SG && BOSS[B.k] && BOSS[B.k].draw) { SG.drawBoss(B); return; } g.save(); if (B.flash > 0) g.globalAlpha = .6;
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
    else if (B.k == 'loki' || B.k == 'loki2') { if (B.ph < 4) { g.fillStyle = 'rgba(150,210,255,' + (.16 + .08*Math.sin(t*4)) + ')'; g.beginPath(); g.arc(x, y, 48, 0, TAU); g.fill(); } SC.loki(g, x, y, {s:1.6, ph:B.ph, cast:B.castT > 0, fetch:B.fetch && B.fetch.t > 0}, t); if (B.fetch && B.fetch.t > 0) { g.font = '900 16px ' + A.font; g.textAlign = 'center'; g.fillStyle = '#F9BF01'; g.fillText('🪵 STICK!!', x, y - 74); } }
    else if (B.k == 'chao') { if (!low()) { const au = g.createRadialGradient(x, y - 8, 6, x, y - 8, 70); au.addColorStop(0, 'rgba(20,30,70,.55)'); au.addColorStop(1, 'rgba(20,30,70,0)'); g.fillStyle = au; g.beginPath(); g.arc(x, y - 8, 70, 0, TAU); g.fill(); g.strokeStyle = 'rgba(200,230,255,.5)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x, y - 8, 30 + i*12 + Math.sin(t*5 + i)*3, t*2 + i, t*2 + i + 2.2); g.stroke(); } } SC.spirit(g, 'chao', x, y, {s:1.5, ghost:1, mood:B.ph >= 4 ? 'mad' : B.ph >= 2 ? 'angry' : 'frightened', jitter:.6 + .2*B.ph, glow:B.ph >= 4 ? '#ffffff' : '#cfe8ff'}, t); }
    else if (B.k == 'wraith' || B.k == 'echo') { const col = B.k == 'echo' ? '90,110,150' : '170,220,255'; g.globalAlpha = .85; const gl = g.createRadialGradient(x, y - 10, 6, x, y - 10, 60); gl.addColorStop(0, 'rgba(' + col + ',.55)'); gl.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y - 10, 60, 0, TAU); g.fill();
      g.fillStyle = 'rgba(' + col + ',.9)'; g.beginPath(); g.moveTo(x - 30, y + 30); for (let i = 0; i <= 6; i++) g.lineTo(x - 30 + i*10, y + 30 + (i % 2 ? -10 : 0) + Math.sin(t*6 + i)*3); g.lineTo(x + 30, y - 20); g.quadraticCurveTo(x, y - 70, x - 30, y - 20); g.closePath(); g.fill();
      g.fillStyle = '#0a1430'; g.beginPath(); g.ellipse(x - 10, y - 22, 5, 8, 0, 0, TAU); g.ellipse(x + 10, y - 22, 5, 8, 0, 0, TAU); g.fill(); g.globalAlpha = 1; if (B.k == 'echo') { g.strokeStyle = '#ffe066'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 4, y + 6); g.lineTo(x + 6, y + 14); g.lineTo(x - 2, y + 22); g.stroke(); } }
    else if (B.k == 'guardian') { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + 34, 36, 9, 0, 0, TAU); g.fill(); for (const [ox, oy, r2] of [[0, 4, 26], [-26, -6, 14], [26, -6, 14], [0, -30, 16]]) { g.fillStyle = '#4a5a7a'; g.beginPath(); g.arc(x + ox, y + oy, r2, 0, TAU); g.fill(); g.strokeStyle = '#2a3450'; g.lineWidth = 2; g.stroke(); }
      g.strokeStyle = 'rgba(255,230,100,' + (.6 + .4*Math.sin(t*12)) + ')'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 8, y - 8); g.lineTo(x + 2, y + 4); g.lineTo(x - 4, y + 18); g.stroke(); g.fillStyle = '#9fe8ff'; g.beginPath(); g.arc(x - 6, y - 32, 3, 0, TAU); g.arc(x + 6, y - 32, 3, 0, TAU); g.fill(); }
    else if (B.k == 'fog') { g.globalAlpha = B.fadeA || .6; for (let i = 0; i < 9; i++) { const a = i*.7 + t*.3; g.fillStyle = 'rgba(220,228,240,.55)'; g.beginPath(); g.arc(x + Math.cos(a)*30, y - 6 + Math.sin(a*1.3)*16, 26, 0, TAU); g.fill(); } g.fillStyle = 'rgba(40,50,80,.8)'; g.beginPath(); g.ellipse(x - 12, y - 10, 4, 7, 0, 0, TAU); g.ellipse(x + 12, y - 10, 4, 7, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
    else if (B.k.slice(0, 6) == 'elite_') { g.save(); g.translate(x, y); g.scale(1.8, 1.8); g.fillStyle = '#4a5a7a'; for (const [ox, oy, r2] of [[-8, -2, 9], [6, -4, 10], [0, -10, 9], [10, 2, 7], [-10, 4, 7]]) { g.beginPath(); g.arc(ox, oy, r2, 0, TAU); g.fill(); } g.fillStyle = '#ffe066'; g.beginPath(); g.moveTo(-2, 4); g.lineTo(3, 4); g.lineTo(-1, 14); g.closePath(); g.fill(); g.fillStyle = '#ff6a6a'; g.beginPath(); g.arc(-4, -5, 2.2, 0, TAU); g.arc(5, -5, 2.2, 0, TAU); g.fill(); g.restore(); }
    else if (B.k == 'sq_raccoon') raccoon(x, y, {s:2.4, crown:1});
    else if (B.k == 'sq_mau') SC.mau(g, x, y, {s:1.35, st:B.ph >= 3 ? 'charge' : 'stand', mood:'angry'}, t);
    else if (RLOOK[B.k]) raidLook(B, x, y);
    else if (B.k == 'yeti' || B.k == 'r_yeti') { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + 40, 40, 10, 0, 0, TAU); g.fill(); g.fillStyle = '#f4f8ff'; g.beginPath(); g.ellipse(x, y + 4, 36, 38, 0, 0, TAU); g.fill(); g.strokeStyle = '#c8d8e8'; g.lineWidth = 2; g.stroke(); const sw2 = Math.sin(t*3)*8; g.beginPath(); g.ellipse(x - 40, y + 8 + sw2, 12, 22, .3, 0, TAU); g.ellipse(x + 40, y + 8 - sw2, 12, 22, -.3, 0, TAU); g.fill();
      g.fillStyle = '#8ab0d0'; g.beginPath(); g.ellipse(x, y - 12, 18, 15, 0, 0, TAU); g.fill(); g.fillStyle = B.ph >= 2 ? '#FF4539' : '#14204a'; g.beginPath(); g.arc(x - 7, y - 16, 3, 0, TAU); g.arc(x + 7, y - 16, 3, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 7, y - 6, 4, 6); g.fillRect(x + 3, y - 6, 4, 6); g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(x - 16, y - 34); g.lineTo(x - 16, y - 46); g.lineTo(x - 8, y - 40); g.lineTo(x, y - 50); g.lineTo(x + 8, y - 40); g.lineTo(x + 16, y - 46); g.lineTo(x + 16, y - 34); g.fill(); }
    else if (B.k == 'giant') { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + 44, 44, 10, 0, 0, TAU); g.fill(); g.fillStyle = '#a8d8f0'; rr(g, x - 30, y - 30, 60, 74, 12); g.fill(); g.strokeStyle = '#6aa8d0'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#c8ecff'; rr(g, x - 24, y - 70, 48, 44, 12); g.fill(); rr(g, x - 50, y - 24, 18, 50, 8); g.fill(); rr(g, x + 32, y - 24, 18, 50, 8); g.fill();
      g.fillStyle = B.ph >= 2 ? '#FF4539' : '#2a5a8a'; g.beginPath(); g.arc(x - 9, y - 52, 4, 0, TAU); g.arc(x + 9, y - 52, 4, 0, TAU); g.fill(); g.strokeStyle = '#6aa8d0'; g.beginPath(); g.moveTo(x - 10, y - 38); g.lineTo(x + 10, y - 38); g.stroke(); }
    else if (B.k == 'frostbeard') { g.globalAlpha = .85; g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + 26, 26, 7, 0, 0, TAU); g.fill(); g.fillStyle = '#9fc8e8'; g.beginPath(); g.ellipse(x, y + 2, 20, 24, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y + 6, 12, 16, 0, 0, TAU); g.fill(); g.fillStyle = '#e8f4ff'; g.beginPath(); g.moveTo(x - 12, y - 4); g.quadraticCurveTo(x, y + 26, x + 12, y - 4); g.fill();
      g.fillStyle = '#1c1c24'; g.beginPath(); g.moveTo(x - 24, y - 18); g.quadraticCurveTo(x, y - 46, x + 24, y - 18); g.fill(); g.fillStyle = '#fff'; g.font = '12px ' + A.font; g.textAlign = 'center'; g.fillText('☠', x, y - 24); g.fillStyle = '#14204a'; g.beginPath(); g.arc(x - 6, y - 10, 2.4, 0, TAU); g.arc(x + 6, y - 10, 2.4, 0, TAU); g.fill(); g.globalAlpha = 1; }
    else if (B.k == 'serpent') { for (let i = 9; i >= 0; i--) { const sx2 = x - Math.cos(B.t*2 + i*.5)*i*9, sy2 = y + i*7 + Math.sin(B.t*3 + i*.6)*8; g.fillStyle = 'hsl(' + ((i*30 + t*60) % 360) + ',80%,65%)'; g.beginPath(); g.arc(sx2, sy2, 16 - i*.9, 0, TAU); g.fill(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 6, y - 4, 3.5, 0, TAU); g.arc(x + 6, y - 4, 3.5, 0, TAU); g.fill(); g.fillStyle = '#14204a'; g.beginPath(); g.arc(x - 6, y - 4, 1.6, 0, TAU); g.arc(x + 6, y - 4, 1.6, 0, TAU); g.fill(); }
    g.restore();
    if (B.talkT > 0 && B.talk) { g.font = '700 12px ' + A.font; const tw = Math.min(380, g.measureText(B.talk).width + 20), bx = Math.max(8, Math.min(VW - tw - 8, x - cam.x - tw/2)) + cam.x, by = Math.max(cam.y + topY() + 112, y - B.r - 70); g.fillStyle = 'rgba(255,255,255,.95)'; rr(g, bx, by, tw, 28, 10); g.fill(); g.fillStyle = '#14204a'; g.textAlign = 'left'; wrapClip(B.talk, bx + 10, by + 19, tw - 20); } };
  const wrapClip = (s2, x, y, mw) => { let line = s2; while (g.measureText(line).width > mw && line.length > 4) line = line.slice(0, -2); if (line != s2) line = line.slice(0, -1) + '…'; g.fillText(line, x, y); };
  const RT = {...Object.fromEntries(Object.entries(REG).filter(([k, r]) => r.tint).map(([k, r]) => [k, r.tint])), hollow:'#d6ecff', shrine:'#e4e8f4', oldroad:'#dfe3ea', hall:'#eef1f6', peak:'#cdd3e3', aurora:'#eef6ff', coast:'#f2f6fa', ruins:'#e6ecf2', yeti:'#e8eef6', village:'#f3f7fb', raid:'#584878'};
  const tileCol = (v, x, y) => v == 16 ? '#5d4c7d' : v == VEIL ? (spiritsOpen() ? '#cfeaff' : '#7ad8ff') : v == WATER ? '#3a6ab0' : v == HOUSE ? '#b0703a' : v == PATH && regionAt(x, y) == 'oldroad' ? '#9aa2ac' : v == SNOW && RT[regionAt(x, y)] ? RT[regionAt(x, y)] : v == SNOW ? (regionAt(x, y) == 'castle' ? '#d8dbe9' : '#eef5fc') : v == PATH ? '#e6dcc8' : v == ICE || v == HOLE ? '#c4e8fa' : v == DEEP ? '#ffffff' : v == WALL ? '#2e2048' : v == FLOOR || v == GATE ? '#5d4c7d' : v == CAVE || (v == ROCK && regionAt(x, y) == 'caves') ? '#5a6a80' : v == CAMP ? '#f3e6cf' : regionAt(x, y) == 'castle' ? '#d8dbe9' : '#eef5fc';
  const drawTiles = () => { const x0 = Math.floor(cam.x/TS), y0 = Math.floor(cam.y/TS), x1 = Math.min((raid ? N + 40 : N) - 1, x0 + Math.ceil(VW/TS) + 1), y1 = Math.min(N - 1, y0 + Math.ceil(VH/TS) + 1);
    // smooth, natural ground: every tile gets its land's snow colour first, then paths, ice, drifts, water and cave floors
    // are drawn as rounded shapes that flow into their neighbours (no blocky squares)
    const BLOB = {[PATH]:1, [ICE]:2, [HOLE]:2, [WATER]:3, [DEEP]:4, [CAVE]:5, [CAMP]:6};
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const v = tileAt(tx, ty), sx = tx*TS, sy = ty*TS, cls = BLOB[v];
      if (cls || v == ROCK || v == TREE || v == DEAD) { const r0 = regionAt(tx, ty); g.fillStyle = r0 == 'caves' ? '#5a6a80' : RT[r0] || (r0 == 'castle' ? '#d8dbe9' : r0 == 'camp' ? '#eef5fc' : '#eef5fc'); } else g.fillStyle = tileCol(v, tx, ty);
      g.fillRect(sx, sy, TS + 1, TS + 1); }
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const v = tileAt(tx, ty), cls = BLOB[v]; if (!cls || (cls == 5 && regionAt(tx, ty) == 'caves')) continue; const sx = tx*TS, sy = ty*TS, cx = sx + TS/2, cy = sy + TS/2, r2 = TS*.49;
      if (cls == 4) { const hh = hash(tx, ty, 13); g.fillStyle = 'rgba(160,190,225,.35)'; g.beginPath(); g.ellipse(cx + (hh - .5)*10, cy + 9, TS*.58, TS*.22, 0, 0, TAU); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx + (hh - .5)*10, cy + 4, TS*.55, TS*.3, 0, Math.PI, 0); g.fill(); continue; }
      g.fillStyle = tileCol(v, tx, ty); g.beginPath(); g.arc(cx, cy, r2, 0, TAU); g.fill();
      if (cls != 4) { const same = (x2, y2) => BLOB[tileAt(x2, y2)] == cls; if (same(tx + 1, ty)) g.fillRect(cx, cy - r2, TS/2 + 1, r2*2); if (same(tx - 1, ty)) g.fillRect(sx - 1, cy - r2, TS/2 + 1, r2*2); if (same(tx, ty + 1)) g.fillRect(cx - r2, cy, r2*2, TS/2 + 1); if (same(tx, ty - 1)) g.fillRect(cx - r2, sy - 1, r2*2, TS/2 + 1); } }
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const v = tileAt(tx, ty), sx = tx*TS, sy = ty*TS;
      if (low()) continue; const h = hash(tx, ty, 5);
      if (v == PATH && h < .5 && !low()) { g.fillStyle = 'rgba(120,100,80,.22)'; g.beginPath(); g.ellipse(sx + 16 + h*20, sy + 20, 3, 4.5, .3, 0, TAU); g.ellipse(sx + 24 + h*20, sy + 30, 3, 4.5, -.3, 0, TAU); g.fill(); }   // footprints
      if (v == SNOW && h < .25) { g.fillStyle = 'rgba(150,180,215,.25)'; g.beginPath(); g.ellipse(sx + h*160 % 40 + 4, sy + 30, 8, 3, 0, 0, TAU); g.fill(); }
      else if (v == DEEP) { g.fillStyle = 'rgba(170,200,230,.35)'; g.beginPath(); g.arc(sx + 14, sy + 30, 10, Math.PI, 0); g.arc(sx + 34, sy + 24, 9, Math.PI, 0); g.fill(); }
      else if (v == ICE) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx + 8 + h*10, sy + 12); g.lineTo(sx + 26 + h*10, sy + 30); g.stroke(); }
      else if (v == PATH && h < .4) { g.fillStyle = 'rgba(140,110,80,.25)'; g.beginPath(); g.arc(sx + 10 + h*60 % 30, sy + 14 + h*90 % 24, 2, 0, TAU); g.fill(); }
      else if (v == CAVE && h < .12) { g.fillStyle = 'rgba(200,160,255,.5)'; g.beginPath(); g.moveTo(sx + 20, sy + 36); g.lineTo(sx + 24, sy + 22); g.lineTo(sx + 28, sy + 36); g.fill(); } }
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const v = tileAt(tx, ty), sx = tx*TS, sy = ty*TS, h = hash(tx, ty, 7);
      if (v == TREE) { const ox = (h - .5)*10; g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(sx + 24 + ox, sy + 42, 16, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#6b4a2b'; g.fillRect(sx + 21 + ox, sy + 32, 6, 12);
        const tr2 = regionAt(tx, ty), sz = .8 + h*.45; if (tr2 == 'hollow' && !low() && h < .35) { g.fillStyle = 'rgba(150,225,255,' + (.35 + .25*Math.sin(t*2 + tx)) + ')'; g.beginPath(); g.arc(sx + 24 + ox + Math.sin(t + tx)*6, sy + 8 + Math.cos(t*1.3 + ty)*5, 3, 0, TAU); g.fill(); }
        for (const [w0, yy] of [[22, 34], [18, 22], [13, 10]]) { const w2 = w0*sz; g.fillStyle = tr2 == 'hollow' ? '#1f5a7a' : tr2 == 'forest' ? '#24583a' : tr2 == 'village' ? '#2f7a4a' : (REG[tr2] && REG[tr2].tree) || '#2f6a3a'; g.beginPath(); g.moveTo(sx + 24 + ox - w2, sy + yy); g.lineTo(sx + 24 + ox, sy + yy - 20); g.lineTo(sx + 24 + ox + w2, sy + yy); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(sx + 24 + ox - w2*.45, sy + yy - 11); g.lineTo(sx + 24 + ox, sy + yy - 20); g.lineTo(sx + 24 + ox + w2*.45, sy + yy - 11); g.fill(); } }
      else if (v == ROCK) { const r0 = regionAt(tx, ty), cv = r0 == 'caves', dark = cv ? '#3a4658' : r0 == 'peak' ? '#6a7084' : r0 == 'ruins' ? '#8ab0c8' : '#8a8e94', lite = cv ? '#4a5870' : r0 == 'peak' ? '#868ca0' : r0 == 'ruins' ? '#b8d8ec' : '#a6aab0';
        const nR = tileAt(tx + 1, ty) == ROCK, nD = tileAt(tx, ty + 1) == ROCK, sz = .75 + h*.5, cx = sx + 24 + (h - .5)*8, cy = sy + 28;
        g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(cx, cy + 14*sz, 22*sz, 6, 0, 0, TAU); g.fill();
        g.fillStyle = dark; g.beginPath(); g.ellipse(cx, cy, 22*sz, 18*sz, h*.6, 0, TAU); g.fill(); if (nR) { g.beginPath(); g.ellipse(sx + TS, cy + 2, 16, 14, 0, 0, TAU); g.fill(); } if (nD) { g.beginPath(); g.ellipse(cx, sy + TS + 2, 18, 14, 0, 0, TAU); g.fill(); }
        if (h > .55) { g.beginPath(); g.ellipse(cx + 14*sz, cy + 6, 10*sz, 8*sz, 0, 0, TAU); g.fill(); }
        g.fillStyle = lite; g.beginPath(); g.ellipse(cx - 5*sz, cy - 6*sz, 10*sz, 6*sz, -.3, 0, TAU); g.fill();
        if (!cv) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx - 2, cy - 13*sz, 15*sz, 6*sz, (h - .5)*.4, Math.PI, 0); g.fill(); } else if (h < .25) { g.fillStyle = '#c9a0ff'; g.beginPath(); g.moveTo(sx + 16, sy + 30); g.lineTo(sx + 22, sy + 10); g.lineTo(sx + 28, sy + 30); g.fill(); } }
      else if (v == HOLE) { g.fillStyle = '#1f4f7a'; g.beginPath(); g.ellipse(sx + 24, sy + 24, 20, 14, 0, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }
      else if (v == WALL) { g.fillStyle = '#3e2c62'; g.fillRect(sx, sy, TS, TS); g.strokeStyle = '#2a1c44'; g.lineWidth = 2; for (let yy = 0; yy < TS; yy += 12) { g.beginPath(); g.moveTo(sx, sy + yy); g.lineTo(sx + TS, sy + yy); g.stroke(); for (let xx = (yy/12) % 2 ? 0 : 12; xx < TS; xx += 24) { g.beginPath(); g.moveTo(sx + xx, sy + yy); g.lineTo(sx + xx, sy + yy + 12); g.stroke(); } } if (tileAt(tx, ty - 1) != WALL) { g.fillStyle = '#fff'; g.fillRect(sx, sy, TS, 4); } }
      else if (v == GATE) { if (gateOpen()) { g.fillStyle = '#3e2c62'; g.fillRect(sx, sy, 6, TS); g.fillRect(sx + TS - 6, sy, 6, TS); } else { g.fillStyle = '#2a1c44'; g.fillRect(sx, sy, TS, TS); g.strokeStyle = '#8a8e94'; g.lineWidth = 3; for (let xx = 6; xx < TS; xx += 10) { g.beginPath(); g.moveTo(sx + xx, sy); g.lineTo(sx + xx, sy + TS); g.stroke(); }
        g.fillStyle = 'rgba(200,120,255,' + (.6 + .3*Math.sin(t*3 + tx)) + ')'; g.beginPath(); g.arc(sx + 24, sy + 24, 8, 0, TAU); g.fill(); } }
      else if (v == VEIL) { if (!spiritsOpen()) { g.fillStyle = 'rgba(122,216,255,' + (.55 + .25*Math.sin(t*2 + ty*.4)) + ')'; g.fillRect(sx, sy, TS, TS); if (!low()) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(sx + (t*20 + ty*13) % TS, sy, 2, TS); } } }
      else if (v == 16) { const closed = !(raid && raid.open >= ((ty % 28) >= 18 ? 2 : 1)); if (closed) { g.fillStyle = '#2a1c44'; g.fillRect(sx, sy, TS, TS); g.strokeStyle = '#9fe8ff'; g.lineWidth = 3; for (let xx = 6; xx < TS; xx += 10) { g.beginPath(); g.moveTo(sx + xx, sy); g.lineTo(sx + xx, sy + TS); g.stroke(); } } }
      else if (v == WATER) { if (!low()) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); const wo = Math.sin(t*1.5 + tx + ty)*4; g.moveTo(sx + 6, sy + 24 + wo); g.quadraticCurveTo(sx + 16, sy + 18 + wo, sx + 26, sy + 24 + wo); g.stroke(); } }
      else if (v == HOUSE) { if (tileAt(tx - 1, ty) != HOUSE && tileAt(tx, ty - 1) != HOUSE) { const hx = sx, hy = sy; g.fillStyle = '#c88a50'; g.fillRect(hx + 4, hy + 18, TS*3 - 8, TS*2 - 22); g.fillStyle = '#8a3a2a'; g.beginPath(); g.moveTo(hx - 4, hy + 22); g.lineTo(hx + TS*1.5, hy - 18); g.lineTo(hx + TS*3 + 4, hy + 22); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(hx - 4, hy + 22); g.lineTo(hx + TS*1.5, hy - 18); g.lineTo(hx + TS*3 + 4, hy + 22); g.lineTo(hx + TS*3 - 6, hy + 14); g.lineTo(hx + TS*1.5, hy - 8); g.lineTo(hx + 6, hy + 14); g.fill();
          g.fillStyle = '#5a3a1a'; g.fillRect(hx + TS*1.5 - 9, hy + TS*2 - 26, 18, 22); g.fillStyle = 'rgba(255,214,120,' + (.75 + .2*Math.sin(t*3 + tx)) + ')'; g.fillRect(hx + 16, hy + 34, 16, 14); g.fillRect(hx + TS*3 - 32, hy + 34, 16, 14); } }
      else if (v == PATH && regionAt(tx, ty) == 'oldroad' && (ty == 48) && tx % 3 == 0) { g.fillStyle = '#e8d070'; g.fillRect(sx + 8, sy + TS - 3, 22, 4); }
      else if (v == DEAD) { g.strokeStyle = '#3a2a2a'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx + 24, sy + 44); g.lineTo(sx + 24, sy + 10); g.moveTo(sx + 24, sy + 24); g.lineTo(sx + 12, sy + 14); g.moveTo(sx + 24, sy + 18); g.lineTo(sx + 36, sy + 8); g.stroke(); } } };
  const onScreen = (x, y, m = 80) => x > cam.x - m && x < cam.x + VW + m && y > cam.y - m && y < cam.y + VH + m;
  const SC = A.snowCast;
  const portrait = (who, x, y, mood) => { if (SG && SG.portrait(who, x, y, mood)) return; if (who.slice(0, 4) == 'kid:') kid(x, y + 12, TEAMCOL[who.slice(4)] || '#2fa8e0', {face:0}); else if (who == 'rac') raccoon(x, y + 8, {s:1.7}); else if (who == 'bard') bardDraw(x, y + 12); else if (who == 'pip') penguin(x, y); else if (who == 'mau') SC.mau(g, x, y + 2, {s:.9, st:'stand', mood:mood || 'happy'}, t); else if (who == 'loki') SC.loki(g, x, y + 4, {s:.85, mood:mood || 'smug', cast:1}, t);
    else if (SC.LOOK[who]) SC.spirit(g, who, x, y, {mood:mood || 'peaceful'}, t); else if (who.slice(-1) == 'G' && SC.LOOK[who.slice(0, -1)]) SC.spirit(g, who.slice(0, -1), x, y + 4, {ghost:1, mood:mood || 'peaceful', jitter: who == 'chaoG' ? 1 : 0}, t); };
  const draw = () => { layout(); g.fillStyle = '#eef5fc'; g.fillRect(0, 0, VW, 720);
    g.save(); g.beginPath(); g.rect(0, 0, VW, VH); g.clip(); g.translate(-cam.x + (shakeV > 0 && !low() ? (Math.random() - .5)*shakeV : 0), -cam.y + (shakeV > 0 && !low() ? (Math.random() - .5)*shakeV : 0)); if (inRealm()) SG.drawTiles(); else drawTiles();
    // camp: tent, campfire, Old Pip, the Emperor's ice throne
    if (onScreen(FIRE.x, FIRE.y, 260)) { g.fillStyle = '#c84a2a'; g.beginPath(); g.moveTo(TENT.x - 44, TENT.y + 20); g.lineTo(TENT.x, TENT.y - 34); g.lineTo(TENT.x + 44, TENT.y + 20); g.fill(); g.fillStyle = '#5a1a0a'; g.beginPath(); g.moveTo(TENT.x - 10, TENT.y + 20); g.lineTo(TENT.x, TENT.y - 6); g.lineTo(TENT.x + 10, TENT.y + 20); g.fill();
      g.fillStyle = '#6b4a2b'; g.fillRect(FIRE.x - 18, FIRE.y + 6, 36, 7); for (let k = 0; k < 3; k++) { const fl = Math.sin(t*12 + k)*3; g.fillStyle = ['#FF4539', '#ff8a3c', '#F9BF01'][k]; g.beginPath(); g.moveTo(FIRE.x - 12 + k*4, FIRE.y + 7); g.lineTo(FIRE.x - 4 + k*4, FIRE.y - 18 + k*5 + fl); g.lineTo(FIRE.x + 4 + k*4 - k*2, FIRE.y + 7); g.fill(); }
      g.strokeStyle = 'rgba(255,138,60,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(FIRE.x, FIRE.y, 110, 0, TAU); g.stroke();
      g.fillStyle = '#bfe9ff'; rr(g, THRONE.x - 22, THRONE.y - 40, 44, 52, 8); g.fill(); g.fillStyle = '#e8f8ff'; rr(g, THRONE.x - 16, THRONE.y - 4, 32, 14, 4); g.fill(); g.fillStyle = '#64CDF5'; g.beginPath(); g.moveTo(THRONE.x - 22, THRONE.y - 40); g.lineTo(THRONE.x - 14, THRONE.y - 54); g.lineTo(THRONE.x - 6, THRONE.y - 40); g.lineTo(THRONE.x, THRONE.y - 58); g.lineTo(THRONE.x + 6, THRONE.y - 40); g.lineTo(THRONE.x + 14, THRONE.y - 54); g.lineTo(THRONE.x + 22, THRONE.y - 40); g.fill();
      if (W.bau && !(W.party && W.party.bau)) SC.spirit(g, 'bau', THRONE.x, THRONE.y - 8, {mood:'happy'}, t);
      penguin(PIP.x, PIP.y); if (!W.met || (Math.sin(t*3) > 0 && !W.bau && !W.loki && runesN() == 0 && !W.mau)) { g.fillStyle = '#F9BF01'; g.font = '900 22px ' + A.font; g.textAlign = 'center'; g.fillText('!', PIP.x, PIP.y - 30 + Math.sin(t*5)*3); } }
    // waystones and chests
    if (A.snowExp && !raid && !inRealm()) A.snowExp.drawProps(g, t, onScreen, low(), W);
    for (const k in WAYS) { const w2 = px(WAYS[k]); if (!onScreen(w2.x, w2.y)) continue; const on = W.ways[k]; g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(w2.x, w2.y + 16, 16, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#8a8e94'; g.beginPath(); g.moveTo(w2.x - 12, w2.y + 16); g.lineTo(w2.x - 9, w2.y - 26); g.lineTo(w2.x, w2.y - 34); g.lineTo(w2.x + 9, w2.y - 26); g.lineTo(w2.x + 12, w2.y + 16); g.fill();
      g.fillStyle = on ? 'rgba(100,205,245,' + (.7 + .3*Math.sin(t*3)) + ')' : '#5a6a80'; g.beginPath(); g.arc(w2.x, w2.y - 12, 6, 0, TAU); g.fill(); if (on && !low()) { g.fillStyle = 'rgba(100,205,245,.18)'; g.beginPath(); g.arc(w2.x, w2.y - 12, 18, 0, TAU); g.fill(); } }
    for (const ch of chests) { if (!onScreen(ch.x, ch.y)) continue; const op = W.chests[ch.id]; g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(ch.x, ch.y + 12, 16, 4, 0, 0, TAU); g.fill(); g.fillStyle = '#8D5B1D'; rr(g, ch.x - 15, ch.y - 6, 30, 18, 3); g.fill();
      g.fillStyle = op ? '#5a3a1a' : '#a8702d'; if (op) { rr(g, ch.x - 15, ch.y - 20, 30, 8, 3); g.fill(); } else { rr(g, ch.x - 16, ch.y - 14, 32, 10, 5); g.fill(); g.fillStyle = '#F9BF01'; g.fillRect(ch.x - 2, ch.y - 8, 4, 7); if (!low()) { g.fillStyle = 'rgba(249,191,1,' + (.25 + .2*Math.sin(t*4 + ch.id)) + ')'; g.beginPath(); g.arc(ch.x, ch.y - 4, 22, 0, TAU); g.fill(); } } }
    if (onScreen(LAIR.loki.x, LAIR.loki.y, 200)) { const T0 = {x:LAIR.loki.x, y:LAIR.loki.y - 70}; g.fillStyle = '#7a3ab0'; rr(g, T0.x - 26, T0.y - 30, 52, 50, 8); g.fill(); g.fillStyle = '#F9BF01'; g.fillRect(T0.x - 26, T0.y - 30, 52, 5); }
    // cages: Mau Mau (until Rufus is beaten) and Bau Bau (until you free him)
    if (!W.mau && onScreen(MAUCAGE.x, MAUCAGE.y)) { SC.mau(g, MAUCAGE.x, MAUCAGE.y, {st:'sleep'}, t); cage(MAUCAGE.x, MAUCAGE.y); }
    if (!W.bau && onScreen(BAUCAGE.x, BAUCAGE.y)) { SC.spirit(g, 'bau', BAUCAGE.x, BAUCAGE.y, {mood:'sad'}, t); cage(BAUCAGE.x, BAUCAGE.y); if (W.loki) { g.fillStyle = '#F9BF01'; g.font = '900 20px ' + A.font; g.textAlign = 'center'; g.fillText('!', BAUCAGE.x, BAUCAGE.y - 52 + Math.sin(t*5)*3); } }
    for (const d2 of drops) { g.globalAlpha = d2.life < 3 ? .5 + .5*Math.sin(t*20) : 1; if (d2.k == 'heart') { const hy = d2.y - 4 + Math.sin(t*4 + d2.x)*3, k2 = 1 + .08*Math.sin(t*8); g.fillStyle = 'rgba(255,69,57,.25)'; g.beginPath(); g.arc(d2.x, hy, 16*k2, 0, TAU); g.fill(); g.fillStyle = '#FF4539'; g.beginPath(); g.moveTo(d2.x, hy + 9*k2); g.bezierCurveTo(d2.x - 14*k2, hy - 2*k2, d2.x - 7*k2, hy - 13*k2, d2.x, hy - 5*k2); g.bezierCurveTo(d2.x + 7*k2, hy - 13*k2, d2.x + 14*k2, hy - 2*k2, d2.x, hy + 9*k2); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(d2.x - 4*k2, hy - 5*k2, 2.2*k2, 0, TAU); g.fill(); } else { g.font = '20px ' + A.font; g.textAlign = 'center'; g.fillText(d2.k == 'fish' ? '🐟' : '☕', d2.x, d2.y + 6); } g.globalAlpha = 1; }
    for (const sk of sticks) if (onScreen(sk.x, sk.y)) { g.save(); g.translate(sk.x, sk.y); g.rotate(.4); g.fillStyle = '#8D5B1D'; rr(g, -12, -2.5, 24, 5, 2.5); g.fill(); g.fillRect(2, -7, 2.5, 6); g.restore(); if (!low()) { g.strokeStyle = 'rgba(249,191,1,' + (.4 + .3*Math.sin(t*5)) + ')'; g.lineWidth = 2; g.beginPath(); g.arc(sk.x, sk.y, 16, 0, TAU); g.stroke(); } }
    if (W.mau && mau.sniff && !W.snacks[mau.sniff.id] && onScreen(mau.sniff.x, mau.sniff.y)) { const sn = mau.sniff; g.font = '18px ' + A.font; g.textAlign = 'center'; g.fillText(sn.e, sn.x, sn.y + 6); g.fillStyle = '#F9BF01'; g.font = '900 18px ' + A.font; g.fillText('!', sn.x, sn.y - 18 + Math.sin(t*6)*3); }
    if (tornado) SC.tornado(g, tornado.x, tornado.y, tornado.r, t, low());
    storyDraw(); p3Draw(); sqDraw(); if (SG) SG.drawWorld();
    // characters, back to front (name tags are placed afterwards so they never overlap)
    const tags = [];
    const ents = foes.filter(f => onScreen(f.x, f.y)).map(f => ({y:f.y, d:() => { drawFoe(f); g.globalAlpha = 1; if (f.elite) eliteMark(f); }}));
    storyEnts(ents); if (SG) SG.ents(ents); if (boss) ents.push({y:boss.y, d:() => drawBoss(boss)}); if (W.mau && !(boss && boss.k == 'sq_mau')) ents.push({y:mau.y, d:() => { SC.mau(g, mau.x, mau.y, {st:mauState(), walk:mau.walk}, t); if (mau.say && mau.sayT > 0) bubble(mau.x, mau.y - 52, mau.say); }}); if (W.mau) tags.push({x:mau.x, y:mau.y + 32, t:'Royal Guard Mau Mau', s:'Mau Mau', col:'#2f5fd0'});
    for (const m of mates) if (onScreen(m.x, m.y)) ents.push({y:m.y, d:() => { if (m.ko > 0) { g.fillStyle = RCOL[m.role]; rr(g, m.x - 16, m.y + 4, 32, 12, 6); g.fill(); g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(m.x + 18, m.y + 8, 7, 0, TAU); g.fill(); g.font = '12px ' + A.font; g.textAlign = 'center'; g.fillText('💫', m.x, m.y - 6); }
      else { kid(m.x, m.y - (cheerT > 0 ? Math.abs(Math.sin(t*10 + m.x))*9 : 0), RCOL[m.role], {walk:m.walk, face:m.face, throwT:m.throwT, outfit:W.mateOut && W.mateOut != 'none' ? 'm_' + W.mateOut : ''}); if (cheerT > 0) { g.font = '14px ' + A.font; g.textAlign = 'center'; g.fillText('🎉', m.x, m.y - 40); } } tags.push({x:m.x, y:m.y + 30, t:m.name + ' ' + RE[m.role] + ' ' + m.lv, s:m.name, col:RCOL[m.role]}); }});
    if (dead <= 0) ents.push({y:p.y - 1, d:() => { g.fillStyle = 'rgba(213,243,103,' + (.28 + .12*Math.sin(t*4)) + ')'; g.beginPath(); g.ellipse(p.x, p.y + 16, 24, 8, 0, 0, TAU); g.fill(); g.strokeStyle = '#D5F367'; g.lineWidth = 2; g.stroke(); }});
    if (dead <= 0 && !(p.inv > 0 && p.inv < 2 && Math.sin(t*25) > 0)) ents.push({y:p.y, d:() => { kid(p.x, p.y, X.CL().col, {outfit:W.outfit, hat:X.CL().hat, walk:Math.hypot(p.vx, p.vy) > 30 ? p.walk : 0, face:p.face, throwT:p.throwT, charge:charge ? charge.t : 0, hit:p.hitT > 0});
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
    // boss overlay: wind-up aim lines, guard shield links, stagger bar, stun stars, slam circles and icicle shadows
    if (boss && boss.mk && A.dumpMech) A.dumpMech.draw(g, boss, t, p);
    for (const h of haz) { const k2 = 1 - h.t/h.max; if (h.k == 'slam') { g.fillStyle = 'rgba(255,69,57,' + (.12 + .25*k2) + ')'; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,69,57,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(h.x, h.y, h.r*k2, 0, TAU); g.stroke(); }
      else { g.fillStyle = 'rgba(20,40,80,' + (.15 + .3*k2) + ')'; g.beginPath(); g.ellipse(h.x, h.y, h.r*(.4 + .6*k2), h.r*.35*(.4 + .6*k2), 0, 0, TAU); g.fill(); if (k2 > .55) { const iy = h.y - 260*(1 - (k2 - .55)/.45); g.fillStyle = '#d8f6ff'; g.beginPath(); g.moveTo(h.x - 9, iy - 30); g.lineTo(h.x + 9, iy - 30); g.lineTo(h.x, iy + 8); g.fill(); g.strokeStyle = '#64CDF5'; g.lineWidth = 1.5; g.stroke(); } } }
    if (boss && !isRB(boss) && dead <= 0) { const B = boss;
      if (B.q && B.q.length) { const k2 = .5 + .5*Math.sin(t*18); g.strokeStyle = 'rgba(255,90,70,' + (.45 + .4*k2) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(B.x, B.y, B.r + 10 + 4*k2, 0, TAU); g.stroke();
        g.lineWidth = 2; for (const s2 of B.q) { if (inGap(s2)) continue; const pr = Math.min(1, 1 - (s2.at - t)/TELL()), L = 26 + 60*pr; g.strokeStyle = 'rgba(255,120,100,' + (.25 + .5*pr) + ')'; g.beginPath(); g.moveTo(B.x + Math.cos(s2.ang)*(B.r + 6), B.y + Math.sin(s2.ang)*(B.r + 6)); g.lineTo(B.x + Math.cos(s2.ang)*(B.r + 6 + L), B.y + Math.sin(s2.ang)*(B.r + 6 + L)); g.stroke(); } }
      if (guardsUp()) { g.setLineDash([6, 6]); g.strokeStyle = 'rgba(100,205,245,.8)'; g.lineWidth = 2; for (const f of foes) if (f.k == 'tguard' && !f.dead) { g.beginPath(); g.moveTo(f.x, f.y - 8); g.lineTo(B.x, B.y); g.stroke(); } g.setLineDash([]); g.strokeStyle = 'rgba(100,205,245,' + (.4 + .2*Math.sin(t*4)) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(B.x, B.y, B.r + 16, 0, TAU); g.stroke(); }
      const bw = Math.max(60, B.r*2), by = B.y + B.r + 14; g.fillStyle = 'rgba(20,32,74,.7)'; rr(g, B.x - bw/2 - 2, by - 2, bw + 4, 10, 5); g.fill();
      if (B.stunT > 0) { g.fillStyle = '#F9BF01'; rr(g, B.x - bw/2, by, bw*Math.min(1, B.stunT/3.6), 6, 3); g.fill(); g.fillStyle = '#F9BF01'; g.font = '900 12px ' + A.font; g.textAlign = 'center'; g.fillText('STUNNED · HIT IT!', B.x, by + 22);
        for (let i = 0; i < 4; i++) { const a = t*4 + i*TAU/4, sx = B.x + Math.cos(a)*(B.r*.7), sy = B.y - B.r - 12 + Math.sin(a)*6; g.fillStyle = '#ffe066'; g.beginPath(); for (let k3 = 0; k3 < 10; k3++) { const a2 = -Math.PI/2 + k3*Math.PI/5, r2 = k3 % 2 ? 2.2 : 5; g.lineTo(sx + Math.cos(a2)*r2, sy + Math.sin(a2)*r2); } g.fill(); } }
      else { g.fillStyle = '#64CDF5'; rr(g, B.x - bw/2, by, bw*Math.min(1, (B.stg || 0)/stgNeed(B)), 6, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '700 9px ' + A.font; g.textAlign = 'center'; g.fillText('STAGGER', B.x, by + 18); } }
    if (charge && dead <= 0) { const wa = charge.auto ? autoAim() : toWorld(aim); g.strokeStyle = 'rgba(20,32,74,.35)'; g.setLineDash([5, 7]); g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, p.y - 10); g.lineTo(wa.x, wa.y); g.stroke(); g.setLineDash([]); }
    // the thing you can use right now
    const nt = !dlg && nearThing(); if (nt) { g.fillStyle = 'rgba(20,32,74,.85)'; g.font = '800 12px ' + A.font; g.textAlign = 'center'; const lb = '✋ ' + nt.n + ' (E)'; const tw = g.measureText(lb).width + 16; rr(g, nt.x - tw/2, nt.y - 64, tw, 22, 11); g.fill(); g.fillStyle = '#fff'; g.fillText(lb, nt.x, nt.y - 49); }
    g.restore();
    // darker caves and castle, with light around you
    const rg = regAt(p.x, p.y); if ((rg == 'caves' || (rg == 'castle' && tileAt(Math.floor(p.x/TS), Math.floor(p.y/TS)) == FLOOR)) && !low()) { const gr = g.createRadialGradient(p.x - cam.x, p.y - cam.y, 90, p.x - cam.x, p.y - cam.y, 420); gr.addColorStop(0, 'rgba(10,15,40,0)'); gr.addColorStop(1, 'rgba(10,15,40,.5)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); }
    if (sqNightF) { g.fillStyle = 'rgba(8,16,48,.38)'; g.fillRect(0, 0, VW, VH); }
    if (SG) SG.drawScreen();
    { const H2 = REG[rg] && REG[rg].haunt && !rOn(), night = rOn() ? 0 : nightAmt();   /* raids are indoors: no night sky */ if (H2 || night > .05) { const a2 = Math.max(night*.42, H2 ? (H2 == 2 && (W.sp|0) < 6 ? .5 : .32) : 0); const gr = g.createRadialGradient(p.x - cam.x, p.y - cam.y, 110, p.x - cam.x, p.y - cam.y, Math.max(VW, VH)*.7); gr.addColorStop(0, 'rgba(10,20,50,' + a2*.35 + ')'); gr.addColorStop(1, 'rgba(10,20,50,' + a2 + ')'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); }
      if (night > .4 && !low()) { for (let b = 0; b < 3; b++) { const yb = 30 + b*26; g.fillStyle = 'rgba(' + ['80,255,190', '120,200,255', '200,140,255'][b] + ',' + (.08 + .06*Math.sin(t*.7 + b))*night + ')'; g.beginPath(); g.moveTo(0, yb); for (let xx = 0; xx <= VW; xx += 40) g.lineTo(xx, yb + Math.sin(xx*.01 + t*.5 + b)*18); g.lineTo(VW, yb + 40); for (let xx = VW; xx >= 0; xx -= 40) g.lineTo(xx, yb + 40 + Math.sin(xx*.012 + t*.4 + b)*14); g.fill(); } }
      if (H2 && !low()) { g.fillStyle = 'rgba(180,230,255,.7)'; for (let i = 0; i < 14; i++) { const sx = (i*173 + t*12 - cam.x*.2) % VW, sy = (i*97 + Math.sin(t + i)*30 - cam.y*.2) % VH; g.beginPath(); g.arc((sx + VW) % VW, (sy + VH) % VH, 2 + (i % 3), 0, TAU); g.fill(); } }
      if (stormFlash > 0) { g.fillStyle = 'rgba(255,255,255,' + stormFlash*.8 + ')'; g.fillRect(0, 0, VW, VH); } }
    if (A.snowExp && !rOn() && !inRealm()) A.snowExp.drawWeather(g, rg, t, VW, VH, low());
    { const snowN = low() ? 0 : (blizzard > 0 || (rg == 'peak' && (W.sp|0) < 6)) ? 170 : 40; if (blizzard > 0 && !low()) { g.fillStyle = 'rgba(235,242,255,' + Math.min(.32, blizzard*.1) + ')'; g.fillRect(0, 0, VW, VH); }
      const wind = blizzard > 0 ? 160 : 14; g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < snowN; i++) { const sx = (i*137 + t*(wind + i % 5*4) - cam.x*.3) % VW, sy = (i*71 + t*(30 + i % 7*6) - cam.y*.3) % VH; g.fillRect((sx + VW) % VW, (sy + VH) % VH, 2, 2); } }
    // quest arrow
    const G0 = goal(); if (G0) { const sx = G0.x - cam.x, sy = G0.y - cam.y; if (sx < 20 || sx > VW - 20 || sy < 130 || sy > VH - 20) { const a = Math.atan2(sy - (p.y - cam.y), sx - (p.x - cam.x)), ax = Math.max(30, Math.min(VW - 30, p.x - cam.x + Math.cos(a)*230)), ay = Math.max(150, Math.min(VH - 30, p.y - cam.y + Math.sin(a)*230));
        g.save(); g.translate(ax, ay); g.rotate(a); g.fillStyle = 'rgba(249,191,1,.95)'; g.strokeStyle = '#14204a'; g.lineWidth = 2; g.beginPath(); g.moveTo(18, 0); g.lineTo(-10, -12); g.lineTo(-4, 0); g.lineTo(-10, 12); g.closePath(); g.fill(); g.stroke(); g.restore(); }
      else { g.fillStyle = '#F9BF01'; g.font = '20px ' + A.font; g.textAlign = 'center'; g.fillText('⭐', sx, sy - 70 + Math.sin(t*4)*4); } }
    // ----- HUD: small, see-through, tap to fold it away -----
    const TY = topY(), hp = W.hudMin ? null : 1;
    if (W.hudMin) { const lb = '♥ ' + p.hp + '/' + p.max + (p.over ? ' +' + p.over + '💛' : '') + '  ⚪ ' + p.ammo + '  ▸'; g.font = '800 12px ' + A.font; const tw = g.measureText(lb).width + 18; g.fillStyle = 'rgba(20,32,74,.55)'; rr(g, 8, TY, tw, 24, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(lb, 17, TY + 16); hudR = {x:8, y:TY, w:tw, h:24}; }
    else { const hw = Math.min(330, VW*.5); g.fillStyle = 'rgba(20,32,74,.55)'; rr(g, 8, TY, hw, 56, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '800 12px ' + A.font; wrapClip('📍 ' + (REG[rg] || REG.meadow).n + '  ♥ ' + p.hp + '/' + p.max + (p.over ? ' +' + p.over + '💛' : '') + '  ⚪ ' + p.ammo + '/' + X.maxAmmo(), 16, TY + 17, hw - 34);
      g.font = '700 10px ' + A.font; g.fillStyle = '#D5F367'; wrapClip('🎯 ' + (G0 ? G0.n : 'Kingdom saved! Explore, find every chest, rematch Loki'), 16, TY + 33, hw - 18);
      g.fillStyle = '#cfe3f5'; wrapClip('❄ ' + A.fmt(PERM.bank) + ' · 🔷 ' + A.fmt(PERM.frost) + ' · 🌙 ' + runesN() + '/3' + (W.mau ? ' · 🐟 ' + (W.treats||0) : '') + ' · ' + Math.floor(explored*100/fog.length) + '% explored', 16, TY + 48, hw - 18);
      g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '800 11px ' + A.font; g.textAlign = 'right'; g.fillText('▾', 8 + hw - 8, TY + 14); hudR = {x:8, y:TY, w:hw, h:56}; }
    if (!(mapOpen || panel)) drawThreat(8, W.hudMin ? TY + 30 : TY + 62);
    if (raid) { const MX = VW - 196; g.fillStyle = 'rgba(20,32,74,.7)'; rr(g, MX, TY, 188, 92, 10); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '800 12px ' + A.font; wrapClip(raid.R.e + ' ' + raid.R.n, MX + 10, TY + 18, 170); g.font = '700 11px ' + A.font; g.fillStyle = '#D5F367'; g.fillText('Floor ' + (raid.open + 1) + ' / 3', MX + 10, TY + 36);
      g.fillStyle = '#cfe3f5'; g.font = '600 10px ' + A.font; raid.mods.forEach((m2, i) => wrapClip('⚙ ' + m2.n, MX + 10, TY + 54 + i*14, 170)); mmR = null; }
    else if (inRealm()) mmR = SG.drawMini(TY, G0);
    else { const MX = VW - 116, MS2 = 100/N; g.fillStyle = 'rgba(20,32,74,.6)'; rr(g, MX, TY, 108, 120, 10); g.fill(); g.imageSmoothingEnabled = false; g.drawImage(mini, MX + 4, TY + 4, 100, 100); g.imageSmoothingEnabled = true; if (compHint) compHint(MX + 4, TY + 4, MS2); mrMini(MX + 4, TY + 4, MS2); g.fillStyle = '#FF4539'; g.beginPath(); g.arc(MX + 4 + p.x/TS*MS2, TY + 4 + p.y/TS*MS2, 3, 0, TAU); g.fill();
    if (G0) { g.fillStyle = '#F9BF01'; g.beginPath(); g.arc(MX + 4 + G0.x/TS*MS2, TY + 4 + G0.y/TS*MS2, 2.5, 0, TAU); g.fill(); } g.fillStyle = '#D5F367'; rr(g, MX + 22, TY + 106, 64, 12, 6); g.fill(); g.fillStyle = '#14204a'; g.font = '800 9px ' + A.font; g.textAlign = 'center'; g.fillText('M = MAP', MX + 54, TY + 115); mmR = {x:MX, y:TY, w:108, h:120}; }
    if (boss && SG && BOSS[boss.k] && BOSS[boss.k].bar) SG.drawBar(boss, TY);
    else if (boss) { const bw = Math.min(440, VW - 280), bx = VW/2 - bw/2, by = TY + 70; g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, bx, by, bw, 14, 7); g.fill(); const np = boss.phases || 3; g.fillStyle = boss.ph >= np ? '#8a0000' : boss.ph >= 2 ? '#ff6a3c' : '#FF4539'; rr(g, bx, by, bw*Math.max(0, boss.hp)/boss.max, 14, 7); g.fill(); g.fillStyle = '#fff'; for (let i = 1; i < np; i++) g.fillRect(bx + bw*i/np, by, 2, 14);
      g.font = '800 12px ' + A.font; g.textAlign = 'center'; const bl = boss.n + ' · phase ' + boss.ph + '/' + np + (boss.phn ? ' · ' + boss.phn : ''); const tw = g.measureText(bl).width + 16; g.fillStyle = 'rgba(255,255,255,.85)'; rr(g, VW/2 - tw/2, by + 17, tw, 18, 9); g.fill(); g.fillStyle = '#14204a'; g.fillText(bl, VW/2, by + 30); }
    if (msgT > 0 && !dlg) { g.font = '700 13px ' + A.font; const tw = Math.min(VW - 30, g.measureText(msg).width + 30); g.fillStyle = 'rgba(20,32,74,.88)'; rr(g, VW/2 - tw/2, VH - 84, tw, 34, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; wrapClip(msg, VW/2, VH - 62, VW - 50); }
    if (dead > 0) { g.fillStyle = 'rgba(230,240,255,' + Math.min(.9, (1.8 - dead)*.8) + ')'; g.fillRect(0, 0, VW, VH); }
    // dialogue box
    if (dlg && !dlg.lines[dlg.i]) dlg = null;
    if (dlg) { const [who, pic, txt, mood] = dlg.lines[dlg.i], DW = Math.min(820, VW - 20), DX = VW/2 - DW/2, DY = VH - 150; g.fillStyle = 'rgba(20,32,74,.95)'; rr(g, DX, DY, DW, 140, 16); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; rr(g, DX + 10, DY + 12, 84, 116, 12); g.fill(); g.save(); g.translate(DX + 52, DY + 86); g.scale(1.7, 1.7); portrait(pic, 0, 0, mood); g.restore();
      g.fillStyle = '#D5F367'; g.font = '800 15px ' + A.font; g.textAlign = 'left'; g.fillText(who, DX + 106, DY + 30); g.fillStyle = '#fff'; g.font = '600 14px ' + A.font;
      let line = '', ly = DY + 54; txt.split(' ').forEach(wd => { if (g.measureText(line + wd).width > DW - 130) { g.fillText(line, DX + 106, ly); line = ''; ly += 19; } line += wd + ' '; }); g.fillText(line, DX + 106, ly);
      g.fillStyle = '#9fe8ff'; g.font = '700 11px ' + A.font; g.textAlign = 'right'; g.fillText((dlg.i + 1) + '/' + dlg.lines.length + ' · ' + (touchUI ? 'tap' : 'click, Enter or E') + ' ▶', DX + DW - 12, DY + 130); }
    // controls: big buttons on touch screens; on computers a small row of key chips (you can click them too)
    const nt2 = nearThing(); btnR = [];
    if (touchUI) { if (!mapOpen && !panel && dead <= 0 && !dlg) { const F = FIREB(), tg = autoTarget();
        if (tg) { const sx = tg.x - cam.x, sy = tg.y - cam.y - 8, k = 1 + .12*Math.sin(t*8); g.strokeStyle = charge && charge.auto ? 'rgba(255,69,57,.95)' : 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(sx, sy, 22*k, 0, TAU); g.stroke(); for (let a = 0; a < 4; a++) { const aa = a*Math.PI/2; g.beginPath(); g.moveTo(sx + Math.cos(aa)*16*k, sy + Math.sin(aa)*16*k); g.lineTo(sx + Math.cos(aa)*28*k, sy + Math.sin(aa)*28*k); g.stroke(); } }
        const on = charge && charge.auto; g.fillStyle = on ? 'rgba(255,69,57,.9)' : 'rgba(20,32,74,.6)'; g.beginPath(); g.arc(F.x, F.y, F.r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
        if (on) { g.strokeStyle = '#D5F367'; g.lineWidth = 6; g.beginPath(); g.arc(F.x, F.y, F.r - 6, -Math.PI/2, -Math.PI/2 + TAU*Math.min(1, charge.t)); g.stroke(); }
        g.fillStyle = '#fff'; g.beginPath(); g.arc(F.x, F.y - 8, 15, 0, TAU); g.fill(); g.fillStyle = 'rgba(180,215,240,.9)'; g.beginPath(); g.arc(F.x + 4, F.y - 4, 6, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '900 12px ' + A.font; g.textAlign = 'center'; g.fillText('THROW', F.x, F.y + 26);
        if (joy) { g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.arc(joy.ox, joy.oy, 60, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.stroke(); const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy), m = Math.min(d, 60)/(d || 1); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(joy.ox + dx*m, joy.oy + dy*m, 26, 0, TAU); g.fill(); }
        else { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath(); g.arc(100, BAR - 100, 52, 0, TAU); g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '800 11px ' + A.font; g.textAlign = 'center'; g.fillText('DRAG HERE', 100, BAR - 104); g.fillText('TO MOVE', 100, BAR - 90); } }
      g.fillStyle = '#14204a'; g.fillRect(0, BAR, VW, 720 - BAR); const BW = VW/BTN.length;
      BTN.forEach((b, i) => { const on = (i == 1 && p.ab <= 0) || (i == 2 && nt2) || (i == 3 && W.mau && (W.treats||0) > 0) || (i == 4 && kPts() > 0), x = i*BW; g.fillStyle = on ? '#D5F367' : 'rgba(255,255,255,.16)'; rr(g, x + 4, BAR + 12, BW - 8, 76, 14); g.fill(); g.fillStyle = on ? '#14204a' : '#fff'; g.textAlign = 'center';
        g.font = '800 18px ' + A.font; g.fillText(i == 1 && p.ab > 0 ? Math.ceil(p.ab) + 's' : b, x + BW/2, BAR + 50); g.font = '700 10px ' + A.font; wrapClip(['Roll', X.CL().ab, nt2 ? nt2.n : 'Use', 'Feed (' + (W.treats||0) + ')', 'Skills', 'Journal', 'Map'][i], x + BW/2, BAR + 72, BW - 14); }); }
    else { const chips = [['❄ Throw', 'Space', 'throw', false], ['🎯 Auto ' + (W.autoT ? 'ON' : 'OFF'), 'T', 'auto', !!W.autoT], ['⭐ ' + (p.ab > 0 ? Math.ceil(p.ab) + 's' : X.CL().ab), 'Q', 'ab', p.ab <= 0], ['✋ ' + (nt2 ? nt2.n : 'Use'), 'E', 'use', !!nt2], ...(W.mau ? [['🐟 Feed Mau Mau (' + (W.treats||0) + ')', 'G', 'feed', (W.treats||0) > 0]] : []), ...(W.mount && !rOn() ? [[(MOUNTS.find(m => m.id == W.mount) || {e:'🛷'}).e + (riding ? ' Riding' : ' Ride'), 'V', 'ride', riding]] : []), ['🤸 Roll', 'Shift', 'roll', false], ...(W.lball ? [['🎾 Ball', 'B', 'ball', lballCd <= 0]] : []), ['📗 Journal', 'J', 'journal', false], ...(holdMates && mates.length ? [['✋ Team holding', 'C', 'hold', true]] : []), ['📈 Skills' + (kPts() > 0 ? ' (' + kPts() + ')' : ''), 'K', 'skills', kPts() > 0], ['🗺 Map', 'M', 'map', false]];
      g.font = '800 11px ' + A.font; const fitW = VW - 24; let tot = 0, ws = chips.map(([a, k]) => g.measureText(a).width + g.measureText(k).width + 30); tot = ws.reduce((u, v) => u + v + 8, 0) - 8;
      if (tot > fitW) { chips.forEach(c => { c[0] = c[0].split(' ')[0]; }); ws = chips.map(([a, k]) => g.measureText(a).width + g.measureText(k).width + 30); tot = ws.reduce((u, v) => u + v + 8, 0) - 8; }   /* small screens: icons + keys only */
      const gap = tot > fitW ? 4 : 8; if (tot > fitW) tot = ws.reduce((u, v) => u + v + gap, 0) - gap; let x = Math.max(12, VW/2 - tot/2); const y = VH - 30;
      chips.forEach(([a, k, id, on], i) => { const w2 = ws[i]; g.fillStyle = on ? 'rgba(213,243,103,.92)' : 'rgba(20,32,74,.6)'; rr(g, x, y, w2, 24, 12); g.fill(); g.fillStyle = on ? '#14204a' : '#fff'; g.textAlign = 'left'; g.fillText(a, x + 10, y + 16); const kw = g.measureText(k).width + 8; g.fillStyle = on ? '#14204a' : 'rgba(255,255,255,.85)'; rr(g, x + w2 - kw - 6, y + 4, kw, 16, 5); g.fill(); g.fillStyle = on ? '#D5F367' : '#14204a'; g.textAlign = 'center'; g.fillText(k, x + w2 - 6 - kw/2, y + 16); btnR.push({x, y, w:w2, h:24, id}); x += w2 + gap; }); }
    // map
    if (mapOpen && inRealm()) SG.drawMap(TY, G0);
    else if (mapOpen) { const MS = Math.min((VW - 40)/N, (640 - TY - 62)/N), MXo = VW/2 - N*MS/2; MAPR.x = MXo; MAPR.y = TY + 62; MAPR.s = MS; g.fillStyle = 'rgba(10,16,36,.97)'; g.fillRect(0, 0, VW, 720); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 22px ' + A.font; g.fillText(travel ? '✨ Fast travel: tap a waystone' : '🗺 The Snow Kingdom', VW/2, TY + 32); g.font = '600 11px ' + A.font; g.fillStyle = '#9fe8ff'; g.fillText(travel ? 'Waystones you have touched glow blue' : (touchUI ? 'Drag on the left to move · THROW aims for you (hold = bigger) · or tap anywhere to throw there · ⭐ ability · ✋ use' : 'WASD/arrows move · click to throw (hold = bigger) · F throws · Space ability · E use · G feed Mau Mau · Shift roll · V ride · K skills · J journal · B ball · C team hold · M map'), VW/2, TY + 50);
      g.imageSmoothingEnabled = false; g.drawImage(mini, MAPR.x, MAPR.y, N*MAPR.s, N*MAPR.s); g.imageSmoothingEnabled = true;
      const ms = (L2) => ({x:MAPR.x + (L2.x + .5)*MAPR.s, y:MAPR.y + (L2.y + .5)*MAPR.s}), seen = L2 => fog[Math.floor(L2.y/2)*FB + Math.floor(L2.x/2)];
      g.font = '18px ' + A.font; [['camp', '🏕'], ['forest', W.runes.forest ? '🌙' : '🌲'], ['lake', W.runes.lake ? '🌙' : '🧊'], ['caves', W.runes.caves ? '🌙' : '💎'], ['pass', W.mau ? '🐱' : '⛓'], ['castle', W.bau ? '👑' : '🏰']].forEach(([k, e2]) => { if (!seen(LM[k])) return; const q = ms(LM[k]); g.fillText(e2, q.x, q.y + 6); });
      [['village', '🏘'], ['aurora', '🌌'], ['coast', '⚓'], ['ruins', '🗿'], ['yeti', '🏔'], ['hollow', '✨'], ['shrine', '⛩️'], ['oldroad', '🛤️'], ['hall', '🕯️'], ['peak', '🌩️']].forEach(([k, e2]) => { if (!seen(LM2[k])) return; const q = ms(LM2[k]); g.fillText(e2, q.x, q.y + 6); });
      if (A.snowExp) { g.font = '800 11px ' + A.font; g.textAlign = 'center'; for (const k in A.snowExp.CEN) { const c2 = A.snowExp.CEN[k]; if (!seen(c2)) continue; const q = ms(c2); g.fillStyle = 'rgba(10,16,36,.55)'; const tw = g.measureText(REG[k].n).width + 10; g.fillRect(q.x - tw/2, q.y - 9, tw, 14); g.fillStyle = '#e8f4ff'; g.fillText(REG[k].n, q.x, q.y + 2); } for (const k in A.snowExp.VIL) { const V = A.snowExp.VIL[k]; if (!seen(V)) continue; const q = ms(V); g.fillStyle = '#F9BF01'; g.fillText('🏘 ' + V.n, q.x, q.y - 10); } }
      sqMap(ms); mrBig(ms);
      for (const k in WAYS) { if (!W.ways[k]) continue; const q = ms(WAYS[k]); g.fillStyle = travel ? '#64CDF5' : 'rgba(100,205,245,.8)'; g.beginPath(); g.arc(q.x, q.y, travel ? 10 : 5, 0, TAU); g.fill(); if (travel) { g.fillStyle = '#fff'; g.font = '700 11px ' + A.font; g.fillText(WAYS[k].n, q.x, q.y - 14); } }
      const pq = {x:MAPR.x + p.x/TS*MAPR.s, y:MAPR.y + p.y/TS*MAPR.s}; g.fillStyle = '#FF4539'; g.beginPath(); g.arc(pq.x, pq.y, 6, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      if (G0) { g.fillStyle = '#F9BF01'; g.font = '18px ' + A.font; g.fillText('⭐', MAPR.x + G0.x/TS*MAPR.s, MAPR.y + G0.y/TS*MAPR.s + 6); }
      { const side = MAPR.x - 30; if (side >= 150) { const ex = regExplored(), ks = Object.keys(ex).filter(k => ex[k].seen > 0); const LW = Math.min(220, side), lx = MAPR.x - LW - 16; g.fillStyle = 'rgba(255,255,255,.08)'; rr(g, lx, MAPR.y, LW, 26 + ks.length*19, 10); g.fill();
        g.textAlign = 'left'; g.fillStyle = '#D5F367'; g.font = '800 12px ' + A.font; g.fillText('% explored per land', lx + 10, MAPR.y + 18); ks.forEach((k, i) => { const e3 = ex[k], pc = Math.floor(e3.seen*100/e3.all), yy = MAPR.y + 38 + i*19; g.fillStyle = pc >= 100 ? '#D5F367' : '#cfe3f5'; g.font = '600 11px ' + A.font; wrapClip(REG[k].n, lx + 10, yy, LW - 70); g.textAlign = 'right'; g.font = '800 11px ' + A.font; g.fillText((pc >= 100 ? '✓ ' : '') + pc + '%', lx + LW - 10, yy); g.textAlign = 'left'; });
        g.textAlign = 'center'; } }
      g.fillStyle = '#ffffff'; rr(g, VW/2 - 270, 650, 250, 48, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, VW/2 + 20, 650, 250, 48, 14); g.fill(); g.fillStyle = '#14204a'; g.font = '800 16px ' + A.font; g.fillText('✕ Close map · M', VW/2 - 145, 680); g.fillStyle = '#fff'; g.fillText('⬅ Snowball menu', VW/2 + 145, 680); } };
  const escK = e => { if (e.key == 'Escape' && (panel || mapOpen)) { e.stopPropagation(); e.preventDefault(); panel = null; mapOpen = false; travel = false; } }; document.addEventListener('keydown', escK, true);
  const close = () => { save(); unlayout(); document.removeEventListener('keydown', escK, true); };
  const drawTop = () => { if (SG) SG.drawTop(); if (panel) drawPanel(); };
  reveal(); lastReg = regAt(p.x, p.y);
  if (!W.met) say('❄ Welcome to the Snow Kingdom! Talk to Old Pip, the penguin by the campfire', 4); else say('❄ Welcome back to the Snow Kingdom!', 2.4);
  const adm = {
    tp:k => { const w2 = px(WAYS[k] || LM2[k] || WAYS.camp); if (WAYS[k] && WAYS[k].spirit && !spiritsOpen()) W.sp = Math.max(W.sp|0, 1); p.x = w2.x; p.y = w2.y + 40; foes = []; boss = null; tornado = null; mateHome(); save(); say('Admin: teleported to ' + ((WAYS[k] || {}).n || REG[k] && REG[k].n || k), 2); },
    flakes:n => { PERM.bank += Math.round(n); save(); }, frost:n => { PERM.frost += Math.round(n); save(); }, item:tr => { const it = give({gear:Math.max(0, Math.min(5, Math.floor(tr)))}); save(); say('Admin: ' + (it ? it.name : 'item given'), 2.5); },
    hearts:n => { p.max += Math.round(n); p.hp = p.max; W.extraHp = (W.extraHp|0) + Math.round(n); save(); say('Admin: ♥ ' + p.hp + '/' + p.max, 2); },
    boss:k => { if (!BOSS[k]) { say('Admin: unknown boss', 2); return; } if (boss) boss = null; const H = LAIR[k]; p.x = H.x; p.y = H.y + 200; foes = []; spawnBoss(k); },
    quest:() => { const sp = W.sp|0; if (!W.bau) { W.met = 1; W.runes = {forest:1, lake:1, caves:1}; W.mau = 1; W.down.grumble = W.down.icefang = W.down.crystal = W.down.rufus = 1; W.loki = Math.max(1, W.loki|0); W.bau = 1; } else if (sp == 2) { W.lan = 3; W.lanF = {0:1, 1:1, 2:1}; W.sp = 3; W.bless = 1; } else if (sp == 3) { W.clue = {paw:1, string:1, bell:1}; W.tag = 1; W.sp = 4; } else if (sp == 4) { W.held = 1; MEMS.forEach(m => { W.mem[m.k] = 1; W.down['elite_' + m.k] = 1; }); W.sp = 5; } else if (sp < 6) { W.sp = sp + 1; if (W.sp == 1) W.party.bau = 1; if (W.sp == 6) W.party.bau = 0; } save(); say('Admin: quest step completed · ' + (STORY_N[W.sp|0] || 'main quest'), 2.6); },
    chapter:n => { n = Math.max(0, Math.min(6, Math.floor(n))); W.met = 1; W.runes = {forest:1, lake:1, caves:1}; W.mau = 1; W.loki = Math.max(1, W.loki|0); W.bau = 1; ['grumble','icefang','crystal','rufus'].forEach(k => W.down[k] = 1); W.sp = n; W.party.bau = n >= 1 && n < 6 ? 1 : 0; if (n >= 3) { W.bless = 1; W.lan = 3; W.lanF = {0:1, 1:1, 2:1}; } if (n >= 4) { W.clue = {paw:1, string:1, bell:1}; W.tag = 1; } if (n >= 5) { W.held = 1; MEMS.forEach(m => { W.mem[m.k] = 1; W.down['elite_' + m.k] = 1; }); } save(); say('Admin: jumped to ' + (n ? 'Chapter ' + n + ': ' + STORY_N[n] : 'before the story'), 3); },
    siege:() => { if (raid) leaveRaid(); p.x = BELL.x; p.y = BELL.y + 120; startSiege(); }, raid:(n, d) => { if (siege) siegeEnd(false); if (SG && SG.raidAdm) { SG.raidAdm.enter(n, d); return; } const R0 = RAIDS[Math.max(0, Math.min(4, Math.floor(n) - 1))]; enterRaid(R0); }, raids:() => SG && SG.raidAdm,
    kxp:n => { give({xp:Math.round(n)}); save(); say('Admin: kingdom level ' + kLv(), 2); }, base:() => { W.base.tier = MAXT; ROOMS.forEach(r0 => { if (!r0.need || r0.need()) W.base.rooms[r0.id] = 12; }); syncMates(); refreshMax(); save(); say('Admin: Level 12 base, every room maxed', 2.5); },
    baseLv:n => { W.base.tier = Math.max(0, Math.min(MAXT, Math.floor(n) - 1)); ROOMS.forEach(r0 => { if (RL(r0.id) > roomMax()) W.base.rooms[r0.id] = roomMax(); }); refreshMax(); save(); say('Admin: base level ' + (W.base.tier + 1) + ' (' + TIER_N[W.base.tier] + ')', 2.5); },
    roomLv:n => { const v = Math.max(0, Math.min(roomMax(), Math.floor(n))); ROOMS.forEach(r0 => { if (roomOpen(r0)) W.base.rooms[r0.id] = v; }); syncMates(); refreshMax(); save(); say('Admin: every open room at level ' + v + ' (max ' + roomMax() + ')', 2.5); },
    mileReset:() => { W.base.mile = {}; save(); say('Admin: base level rewards can be earned again', 2.2); },
    threat:n => { n = Math.floor(n); W.forceThreat = n >= 0 && n <= 7 ? n : null; save(); say('Admin: Threat ' + (W.forceThreat == null ? 'follows gear again (' + THR[thr()].n + ')' : 'forced to ' + THR[thr()].n) + ' · Gear Score ' + gearScore() + ' (highest ' + (W.gsMax || 0) + ')', 3.5); },
    koPct:n => { W.koPct = Math.max(1, Math.min(100, Math.floor(n))); save(); say('Admin: after a knockout in a boss fight you get back up with ' + W.koPct + '% hearts', 3); },
    bossReset:n => { const ks = Object.keys(BOSS).filter(k => !BOSS[k].rd), k = ks[Math.floor(n) - 1]; if (n <= 0) { W.bhp = {}; W.bhm = {}; save(); say('Admin: every boss is back to full health', 2.5); return; } if (!k) { say('Admin: boss number 1–' + ks.length + ' (0 = all)', 2.5); return; } delete (W.bhp || {})[k]; delete (W.bhm || {})[k]; if (boss && boss.k == k) { boss.hp = boss.max; boss.ph = 1; } save(); say('Admin: ' + BOSS[k].n + ' reset to full health', 2.5); },
    bossPhase:n => { const B = boss; if (!B) { say('Admin: no boss fight right now', 2); return; } const np = B.phases || 3, ph = Math.max(1, Math.min(np, Math.floor(n))); B.hp = Math.max(1, B.max*(1 - (ph - 1)/np)*(ph > 1 ? .9999 : 1)); if (!B.saga) B.ph = Math.max(B.ph, ph); hurtBoss(0.0001); say('Admin: ' + B.n + ' jumped to phase ' + ph, 2.4); },
    bossListSay:() => say('Bosses: ' + Object.keys(BOSS).filter(k => !BOSS[k].rd).map((k, i) => (i + 1) + ' ' + BOSS[k].n.toLowerCase()).join(' · ').slice(0, 600), 10),
    bossList:() => Object.keys(BOSS).filter(k => !BOSS[k].rd).map((k, i) => (i + 1) + ' ' + BOSS[k].n).join(' · '),
    raidReset:() => { W.raidClr = {}; save(); say('Admin: weekly raid clears reset (rewards can be earned again)', 2.5); },
    sq:() => sqAdminStep(), sqAll:() => { SQK.forEach(id => { if (!W.sqR[id] && SQ[id].avail()) { W.sqD[id] = 1; delete W.sq[id]; W.sqR[id] = 1; SQ[id].finish(); } }); save(); say('Admin: every available side story finished', 2.5); },
    bosses:() => Object.keys(BOSS), saga:() => SG};
  if (W.extraHp) { p.max += W.extraHp; p.hp = p.max; }
  // ---------- THE DUMPLING SAGA (snow-saga.js): new regions, climbing, gliding, shrines, the main quest ----------
  if (A.snowSaga) { const S = {A, X, W, PERM, g, TS, N, RX:N + 40, TAU, SOLID, MINI, REG, FOE, BOSS, LAIR, MATE_NAMES:mates.map(m => m.name), T:{SNOW, PATH, TREE, ROCK, ICE, DEEP, HOLE, WALL, FLOOR, GATE, CAVE, CAMP, DEAD, VEIL, WATER, HOUSE},
      p, mau, mates, mateHome, say, talk, nextLine, give, hurtBoss, journal, save, splat, addNum, spawnFoe, spawnBoss, hurtMe, hurtFoe, shot, kid, cat, dog, penguin, rr, wrapClip, openPanelUI, onScreen, dist, blocked, solidAt, tileAt, hash, noise, regAt, bubble, low, mauSay, px, CAMPX, FIRE, PIP, THRONE, RL, refreshMax, MAUF, BAUF, PIPF, nightAmt, bossDown, use, journalTab:() => jTab,
      SC:A.snowCast, portraitBase:(who, x, y, mood) => portrait(who, x, y, mood), skillPanel, MOUNTS, regenMul,
      get foes() { return foes; }, set foes(v) { foes = v; }, get balls() { return balls; }, set balls(v) { balls = v; }, get boss() { return boss; }, set boss(v) { boss = v; }, get dlg() { return dlg; }, get panel() { return panel; }, set panel(v) { panel = v; },
      get cam() { return cam; }, get VW() { return VW; }, get VH() { return VH; }, get BAR() { return BAR; }, get t() { return t; }, get riding() { return riding; }, set riding(v) { riding = v; }, get raid() { return raid; }, get siege() { return siege; }, get dead() { return dead; }, set dead(v) { dead = v; },
      get shakeV() { return shakeV; }, set shakeV(v) { shakeV = v; }, get cheerT() { return cheerT; }, set cheerT(v) { cheerT = v; }, get mapOpen() { return mapOpen; }, set mapOpen(v) { mapOpen = v; }, get travel() { return travel; }, set travel(v) { travel = v; }, get touchUI() { return touchUI; }, get K() { return K; }, pad,
      get tornado() { return tornado; }, set tornado(v) { tornado = v; }, get msgT() { return msgT; }, get blizzard() { return blizzard; }, set blizzard(v) { blizzard = v; }, get stormFlash() { return stormFlash; }, set stormFlash(v) { stormFlash = v; }, get fx() { return fx; }, set fx(v) { fx = v; },
      get holdMates() { return holdMates; }, set holdMates(v) { holdMates = v; }, lball:() => lballLure(), get quiz() { return quiz; }, set quiz(v) { quiz = v; }, get lastReg() { return lastReg; }, set lastReg(v) { lastReg = v; }};
    Object.keys(BOSS).forEach(k => { if (BOSS[k].saga && !LAIR[k]) LAIR[k] = {x:-1e6, y:-1e6}; });
    try { SG = A.snowSaga(S); } catch (e) { console.error('[saga] failed to start', e); SG = null; }
    if (A.snowRaids) { try { SG = A.snowRaids(S, SG); } catch (e) { console.error('[raids] failed to start', e); } } }
  return {frame:dt => { update(dt); draw(); drawTop(); }, down, move, up, key, close, adm, admin:{reveal:() => { fog.fill(1); for (let i = 0; i < fog.length; i++) paintBlock(i); explored = fog.length; save(); }, quest:() => { W.met = 1; W.runes = {forest:1, lake:1, caves:1}; W.mau = 1; W.down.grumble = W.down.icefang = W.down.crystal = W.down.rufus = 1; save(); say('Admin: runes + Mau Mau given, gate open'); }, tp:k => { const w2 = px(WAYS[k] || WAYS.camp); p.x = w2.x; p.y = w2.y + 40; foes = []; boss = null; }},
    dbg:() => ({sq:{SQ, sqStep, sqAdvance, sqStart, journal, throwBall, chase:() => chase, course:() => course, waves:() => waves, spot, lballT:() => lballT}, p3:{X, spawnFoe, talk, raid:() => raid, siege:() => siege, panel:() => panel, startSiege, siegeEnd, enterRaid, leaveRaid, RAIDS, toggleMount, riding:() => riding, skillPanel, fortPanel, raidPanel, shopPanel, panelDown, kLv, RL, roomCost, BELL, FORT, BOARD, rpx, give, ROOMS, TIER_N, TIER_COST, MILE, buyRoom, tierUp, upgradeAll, buyable, mineHas, mineTake, mineRate, roomPanel, canBuy, hurtMe, joy:() => joy, autoTarget, thr, gearScore, THR, TM, haz:() => haz, stunB, addStg, guardsUp, threatPanel, respawn, hostN:() => hostN, mrPlant, openMap, mapDown, MAPR, travel:v => { travel = v; }}, p, W, mates, foes:() => foes, bossNow:() => boss, balls, gateOpen, things, spawnBoss, hurtBoss, chests, LAIR, use, update, dlg:() => dlg, nextLine, SG:() => SG, goal, tileAt, regionAt, M:() => M})}; };
})();
