// Wilderland Arcade · Snow Kingdom · THE WIDER KINGDOM (snow-expanse.js)
// The main map grows from 140×140 to 280×280 tiles (4× the area) AROUND the old kingdom: the old lands stay exactly where they were
// (top-left), and eight new regions fill the east and the south. Loaded before snow-world.js; snow-world asks this file for the new
// regions' names, tiles, waystones, landmarks, villages and weather. Everything new is open to everyone right away.
(function(){
'use strict';
const A = window.Arcade = window.Arcade || {}, TAU = Math.PI*2;
const N1 = 140, N = 280;   // the old map size and the new one
// ---------- regions (all custom art: tiles, tints and weather are drawn in code) ----------
const REG = {
  pinecrest:{n:'Pinecrest Hollow', tier:2, pool:['pup', 'goon', 'bat', 'pup'], mood:'reg_pine', tint:'#e9f2ea', tree:'#1e5634', wx:'snow'},
  mirrormere:{n:'Mirrormere', tier:3, pool:['goon', 'bat', 'golem'], mood:'reg_mirror', tint:'#eaf4fb', tree:'#2a5a6a', wx:'calm'},
  northwatch:{n:'Northwatch Cliffs', tier:5, pool:['golem', 'hound', 'bat', 'yeti'], mood:'reg_north', tint:'#e3e8f0', tree:'#2a4a3a', wx:'wind'},
  ravenwatch:{n:'Ravenwatch Woods', tier:5, pool:['hound', 'imp', 'shade', 'hound'], mood:'reg_raven', tint:'#d9dde6', tree:'#1c2c2a', wx:'dark'},
  ember:{n:'Ember Springs', tier:4, pool:['goon', 'imp', 'golem'], mood:'reg_ember', tint:'#f3ebe4', tree:'#3a5a36', wx:'steam'},
  tundra:{n:'Starlight Tundra', tier:4, pool:['bat', 'wisp', 'golem', 'hound'], mood:'reg_tundra', tint:'#e6ecfa', tree:'#25485a', wx:'aurora'},
  marsh:{n:'Old Mill Marsh', tier:3, pool:['wisp', 'goon', 'bat'], mood:'reg_marsh', tint:'#e2e9e4', tree:'#3a4a3a', wx:'fog'},
  quarry:{n:'Shiverstone Quarry', tier:4, pool:['golem', 'goon', 'imp', 'golem'], mood:'reg_quarry', tint:'#e4e2de', tree:'#3a5a3a', wx:'dust'},
  pinev:{n:'Pinecrest Village', tier:0, pool:[], mood:'calm', tint:'#f3f6f0', tree:'#2a6a40', village:1, safe:1},
  emberford:{n:'Emberford', tier:0, pool:[], mood:'calm', tint:'#f6efe8', tree:'#3a6a40', village:1, safe:1}};
const VIL = {pinev:{x:35, y:172, n:'Pinecrest Village', reg:'pinecrest'}, emberford:{x:175, y:172, n:'Emberford', reg:'ember'}};
// borders between the new regions wobble a little so they look natural
const hash = (x, y, s) => { let h = (x*374761393 + y*668265263 + s*982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const regionAt = (x, y) => { for (const k in VIL) if (Math.hypot(x - VIL[k].x, y - VIL[k].y) < 9) return k;
  const w1 = (hash(Math.floor(y/6), 3, 71) - .5)*8, w2 = (hash(Math.floor(x/6), 5, 73) - .5)*8, xx = x + w1, yy = y + w2;
  if (x >= N1 && y < N1) return yy < 70 ? 'northwatch' : 'ravenwatch';
  if (y >= N1) { if (x < N1) { if (yy < 210) return xx < 70 ? 'pinecrest' : 'mirrormere'; return xx < 70 ? 'marsh' : 'quarry'; }
    return xx < 210 && yy < 210 ? 'ember' : 'tundra'; }
  return 'tundra'; };
// waystones (one per region, the two villages have theirs at the gate)
const WAYS = {pine:{x:38, y:164, n:'Pinecrest Village'}, mirror:{x:96, y:150, n:'Mirrormere Landing'}, north:{x:190, y:34, n:'Northwatch Cliffs'}, raven:{x:192, y:100, n:'Ravenwatch Woods'},
  ember:{x:178, y:164, n:'Emberford'}, quarry:{x:104, y:236, n:'Shiverstone Quarry'}, tundra:{x:236, y:232, n:'Starlight Tundra'}, marsh:{x:32, y:232, n:'Old Mill Marsh'}};
// landmarks with lore notes (a few quietly point at something to come)
const NOTES = [
  {x:20, y:196, reg:'pinecrest', k:'grove', t:'Hidden Grove', note:'Someone carved a little door into this old pine and left a cup of tea beside it. The tea is still warm. Nobody lives here. Nobody admits to the tea.'},
  {x:55, y:150, reg:'pinecrest', k:'cabin', t:'The Woodcutter’s Cabin', note:'A note on the table: “Gone to see the lights at Ember Springs. Back by supper.” The plate is frozen solid. The date on the note is from three winters ago.'},
  {x:82, y:158, reg:'mirrormere', k:'tower', t:'Mirrormere Lighthouse', note:'The lamp is lit. The keeper’s log ends with the same line, written every night for forty years: “The boat is late again. I will keep the light on.”'},
  {x:118, y:190, reg:'mirrormere', k:'wreck', t:'The Frozen Ferry', note:'The ferry froze into the lake in a single night. Its bell still rings when the wind blows from the north. Fishers say it sounds like someone calling a name.'},
  {x:165, y:16, reg:'northwatch', k:'tower', t:'Northwatch Tower', note:'From up here you can see the whole kingdom. Lately the watch has marked something odd on its charts: a warm spot that moves. It is never in the same place twice.'},
  {x:240, y:30, reg:'northwatch', k:'nest', t:'Ice Eagle Nests', note:'The eagles have built their nests out of old banners. One is stitched with a sun. Nobody in the kingdom has flown a sun banner for a hundred years.'},
  {x:230, y:100, reg:'ravenwatch', k:'cabin', t:'The Hunter’s Cabin', note:'The hunter left his boots by the door and his lantern on the hook. The ravens have kept watch on the cabin ever since. They will not say for how long.'},
  {x:200, y:125, reg:'ravenwatch', k:'stones', t:'Raven Ring', note:'Twelve stones, twelve ravens. When you come close they all turn their heads at once, and for a moment the woods are completely quiet.'},
  {x:192, y:152, reg:'ember', k:'ruins', t:'The Old Bathhouse', note:'Ember Springs has always been warm. The bathhouse keeper wrote: “The water is warmer this year. Much warmer. The snow on the roof melts before it lands.”'},
  {x:150, y:200, reg:'ember', k:'cave', t:'Steam Vents', note:'Soot on the cave wall, in the shape of a hand. The stone around it is still hot to the touch, even though no fire has burned here in living memory.'},
  {x:100, y:255, reg:'quarry', k:'cave', t:'Shaft Number Nine', note:'The miners closed Shaft Nine after they heard knocking from below. A sign on the boards says: DO NOT KNOCK BACK.'},
  {x:126, y:230, reg:'quarry', k:'cabin', t:'Foreman’s Shack', note:'Rock samples in neat rows, each labelled in tiny writing. The last one is black and glassy, labelled only: “Found it warm. Why is it warm?”'},
  {x:245, y:250, reg:'tundra', k:'stones', t:'The Star Stones', note:'Under the aurora the stones cast star-shaped shadows. An old song says that when one of the stars falls, someone will try to catch it.'},
  {x:180, y:250, reg:'tundra', k:'camp', t:'Abandoned Camp', note:'A tent, a cold fire and a sled with one runner. The map left behind shows Mirrormere, the Quarry and Ember Springs, each one circled twice.'},
  {x:30, y:248, reg:'marsh', k:'mill', t:'The Old Mill', note:'The mill wheel froze mid-turn. The miller’s daughter used to leave lanterns on the water for the will-o’-wisps, “so they don’t get lonely”. The wisps still come looking for them.'},
  {x:55, y:265, reg:'marsh', k:'bridge', t:'The Sunken Bridge', note:'The bridge sank so slowly that the last people to cross it did not notice their boots getting wet. Its planks are still under the ice, and so is the toll box.'}];
// viewpoints: use one to reveal the map around it
const VIEWS = [{x:30, y:150, reg:'pinecrest'}, {x:100, y:200, reg:'mirrormere'}, {x:210, y:12, reg:'northwatch'}, {x:250, y:80, reg:'ravenwatch'}, {x:200, y:190, reg:'ember'}, {x:250, y:215, reg:'tundra'}, {x:18, y:262, reg:'marsh'}, {x:130, y:262, reg:'quarry'}];
// gateways at the edges: the road to the lands beyond (the Expedition Board's lands)
const GATES = [{x:272, y:150, n:'East Expedition Gate'}, {x:150, y:272, n:'South Expedition Gate'}];

// ---------- the map: called by snow-world's genMap with the big map already holding the old 140×140 kingdom ----------
const gen = o => { const {M, T, set, get, noise, carve, clear, house, box} = o, {SNOW, PATH, TREE, ROCK, ICE, DEEP, HOLE, WALL, FLOOR, CAVE, DEAD, WATER, HOUSE} = T;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (x < N1 && y < N1) continue; const r = regionAt(x, y), h = hash(x, y, 21), n1 = noise(x, y, 7, 41), n2 = noise(x, y, 3, 42); let v = SNOW;
    if (r == 'pinecrest') v = n1 > .45 || h < .07 ? TREE : n2 > .86 ? DEEP : SNOW;
    else if (r == 'mirrormere') { const e = Math.hypot((x - 105)/30, (y - 178)/23) + (n2 - .5)*.25; v = e < 1 ? (h < .016 && e > .25 ? HOLE : ICE) : e < 1.12 ? DEEP : h < .04 ? TREE : SNOW; }
    else if (r == 'northwatch') v = n1 > .56 || h < .025 ? ROCK : n2 > .72 ? DEEP : h > .985 ? TREE : SNOW;
    else if (r == 'ravenwatch') v = h < .11 ? DEAD : n1 > .5 ? TREE : n2 > .82 ? DEEP : SNOW;
    else if (r == 'ember') v = n1 > .7 ? WATER : h < .03 ? ROCK : h > .975 ? TREE : SNOW;
    else if (r == 'quarry') v = n1 > .52 && n2 > .32 ? ROCK : n2 < .22 ? CAVE : SNOW;
    else if (r == 'tundra') v = h < .012 ? ROCK : n2 > .82 ? DEEP : h > .996 ? TREE : SNOW;
    else if (r == 'marsh') v = n1 > .62 ? ICE : h < .06 ? DEAD : n2 > .76 ? DEEP : SNOW;
    else v = SNOW;   // villages
    set(x, y, v); }
  // quarry terraces and minecart rails
  for (let y = 214; y < 276; y += 9) for (let x = 72; x < 138; x++) if (get(x, y) != CAVE) set(x, y, PATH);
  // roads: from the old lands out through the old walls, and between every new region
  carve(30, 112, 36, 160, 1); carve(88, 122, 98, 150, 1); carve(120, 122, 150, 150, 1); carve(150, 150, 175, 164, 1); carve(127, 74, 160, 92, 1); carve(130, 21, 160, 28, 1);
  carve(38, 168, 96, 152, 1); carve(96, 152, 150, 150, 0); carve(175, 180, 175, 236, 1); carve(175, 236, 236, 232, 1); carve(175, 164, 192, 100, 1); carve(192, 100, 190, 34, 1); carve(190, 34, 250, 40, 0);
  carve(192, 100, 260, 120, 0); carve(36, 180, 32, 232, 1); carve(32, 232, 104, 236, 1); carve(104, 236, 175, 236, 1); carve(236, 232, 270, 150, 0); carve(175, 236, 150, 270, 0);
  // the two villages: houses, a shop, an inn and a quest board around a little square
  for (const k in VIL) { const V = VIL[k]; clear(V.x, V.y, 7, SNOW); clear(V.x, V.y, 3, PATH); [[-7, -6], [-2, -8], [4, -6], [-8, 1], [5, 2], [-5, 5], [2, 6]].forEach(([dx, dy]) => house(V.x + dx, V.y + dy)); }
  // Ember Springs keeps its hot pools around the village
  for (const [x, y, r] of [[166, 182, 2], [186, 182, 2], [160, 168, 2]]) clear(x, y, r, WATER);
  // landmarks
  for (const L of NOTES) { clear(L.x, L.y, 2, L.reg == 'quarry' && L.k == 'cave' ? CAVE : SNOW);
    if (L.k == 'cabin' || L.k == 'mill') { house(L.x - 1, L.y - 3); }
    else if (L.k == 'tower') { for (let yy = L.y - 4; yy <= L.y - 3; yy++) for (let xx = L.x - 1; xx <= L.x + 1; xx++) set(xx, yy, WALL); }
    else if (L.k == 'wreck') { box(L.x - 5, L.y - 3, L.x + 5, L.y + 1, [[L.x, L.y + 1]]); }
    else if (L.k == 'stones') { for (let i = 0; i < 8; i++) { const a = i/8*TAU; set(Math.round(L.x + Math.cos(a)*5), Math.round(L.y + Math.sin(a)*5), ROCK); } }
    else if (L.k == 'ruins') { for (const [dx, dy] of [[-4, -3], [4, -3], [-4, 3], [4, 3]]) set(L.x + dx, L.y + dy, ROCK); } }
  for (const V of VIEWS) clear(V.x, V.y, 2, SNOW); for (const k in WAYS) clear(WAYS[k].x, WAYS[k].y, 1, PATH); for (const G of GATES) clear(G.x, G.y, 2, PATH);
  // the outer edge of the whole kingdom
  for (let i = 0; i < N; i++) for (const [x, y] of [[i, N - 1], [i, N - 2], [N - 1, i], [N - 2, i]]) set(x, y, ROCK);
  for (let i = N1; i < N; i++) for (const [x, y] of [[i, 0], [i, 1], [0, i], [1, i]]) set(x, y, ROCK); };

// ---------- weather per region, drawn over the screen (light, capped, off in low-effects mode except a tint) ----------
const drawWeather = (g, r, t, VW, VH, low) => { const R = REG[r]; if (!R || !R.wx) return; const wx = R.wx;
  if (wx == 'fog') { g.fillStyle = 'rgba(220,232,226,.28)'; g.fillRect(0, 0, VW, VH); if (!low) for (let i = 0; i < 5; i++) { const x = ((t*12 + i*260) % (VW + 400)) - 200, y = 80 + i*110; const gr = g.createRadialGradient(x, y, 10, x, y, 220); gr.addColorStop(0, 'rgba(240,248,244,.35)'); gr.addColorStop(1, 'rgba(240,248,244,0)'); g.fillStyle = gr; g.fillRect(x - 220, y - 220, 440, 440); } }
  else if (wx == 'dark') { if (low) { g.fillStyle = 'rgba(10,14,30,.18)'; g.fillRect(0, 0, VW, VH); } else { const gr = g.createRadialGradient(VW/2, VH/2, VH*.25, VW/2, VH/2, VH*.85); gr.addColorStop(0, 'rgba(10,14,30,0)'); gr.addColorStop(1, 'rgba(10,14,30,.45)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); } }
  else if (wx == 'steam') { g.fillStyle = 'rgba(255,220,190,.08)'; g.fillRect(0, 0, VW, VH); if (!low) for (let i = 0; i < 14; i++) { const x = (i*137 + Math.sin(t + i)*30) % VW, y = VH - ((t*40 + i*83) % (VH + 60)); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(x, y, 18 + (i % 4)*6, 0, TAU); g.fill(); } }
  else if (wx == 'aurora') { if (!low) { for (let k = 0; k < 2; k++) { g.fillStyle = k ? 'rgba(180,140,255,.12)' : 'rgba(80,255,190,.14)'; g.beginPath(); g.moveTo(0, 40 + k*30); for (let x = 0; x <= VW; x += 40) g.lineTo(x, 40 + k*30 + Math.sin(t*.6 + x*.01 + k)*24); g.lineTo(VW, 0); g.lineTo(0, 0); g.fill(); } } }
  else if (wx == 'wind') { if (!low) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; for (let i = 0; i < 18; i++) { const x = ((t*520 + i*173) % (VW + 200)) - 100, y = (i*97) % VH; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 40, y + 6); g.stroke(); } } }
  else if (wx == 'dust') { if (!low) { g.fillStyle = 'rgba(160,140,120,.35)'; for (let i = 0; i < 24; i++) g.fillRect((i*211 + t*60) % VW, (i*131 + Math.sin(t + i)*20) % VH, 2, 2); } } };

// ---------- landmark art (world space) ----------
const drawProps = (g, t, on, low, W) => { for (const L of NOTES) { if (!on(L.x*48, L.y*48, 120)) continue; const x = (L.x + .5)*48, y = (L.y + .5)*48, read = W.notes && W.notes[L.x + ',' + L.y];
    g.fillStyle = '#6b4a2b'; g.fillRect(x - 2, y - 6, 4, 22); g.fillStyle = read ? '#d8c8a8' : '#f3e6c0'; g.save(); g.translate(x, y - 12); g.rotate(-.08); g.fillRect(-10, -8, 20, 14); g.strokeStyle = 'rgba(120,90,50,.6)'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-7, -4 + i*4); g.lineTo(7, -4 + i*4); g.stroke(); } g.restore();
    if (!read && !low) { g.fillStyle = 'rgba(249,191,1,' + (.5 + .4*Math.sin(t*4 + L.x)) + ')'; g.beginPath(); g.arc(x + 10, y - 22, 4, 0, TAU); g.fill(); } }
  for (const V of VIEWS) { if (!on(V.x*48, V.y*48, 120)) continue; const x = (V.x + .5)*48, y = (V.y + .5)*48, used = W.views && W.views[V.reg];
    g.strokeStyle = '#4a3a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 10, y + 14); g.lineTo(x, y - 6); g.lineTo(x + 10, y + 14); g.moveTo(x, y - 6); g.lineTo(x, y + 14); g.stroke();
    g.save(); g.translate(x, y - 10); g.rotate(-.5); g.fillStyle = used ? '#8a8e94' : '#F9BF01'; g.fillRect(-14, -4, 28, 8); g.fillStyle = '#14204a'; g.fillRect(12, -5, 4, 10); g.restore(); }
  for (const G of GATES) { if (!on(G.x*48, G.y*48, 160)) continue; const x = (G.x + .5)*48, y = (G.y + .5)*48; g.fillStyle = '#8a8e94'; g.fillRect(x - 40, y - 60, 14, 70); g.fillRect(x + 26, y - 60, 14, 70); g.fillRect(x - 44, y - 72, 88, 16);
    if (!low) { const gr = g.createRadialGradient(x, y - 20, 4, x, y - 20, 34); gr.addColorStop(0, 'rgba(200,170,255,.9)'); gr.addColorStop(1, 'rgba(120,100,255,.1)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - 20, 24 + Math.sin(t*2)*2, 34, 0, 0, TAU); g.fill(); } else { g.fillStyle = 'rgba(160,140,255,.6)'; g.fillRect(x - 24, y - 54, 48, 62); } }
  for (const k in VIL) { const V = VIL[k]; for (const [dx, dy, txt, col] of [[-4, -3, 'SHOP', '#F9BF01'], [5, -3, 'INN', '#ff9a6a'], [0, 4, 'QUEST BOARD', '#9fe8ff']]) { const x = (V.x + dx + .5)*48, y = (V.y + dy + .5)*48; if (!on(x, y, 120)) continue;
      g.fillStyle = '#6b4a2b'; g.fillRect(x - 3, y - 4, 6, 26); g.fillStyle = '#c8a070'; g.fillRect(x - 34, y - 30, 68, 26); g.strokeStyle = '#6b4a2b'; g.lineWidth = 2; g.strokeRect(x - 34, y - 30, 68, 26); g.fillStyle = col == '#9fe8ff' ? '#14204a' : '#3a2400'; g.font = '900 10px sans-serif'; g.textAlign = 'center'; g.fillText(txt, x, y - 13); } } };

const CEN = {pinecrest:{x:30, y:190}, mirrormere:{x:105, y:178}, northwatch:{x:215, y:28}, ravenwatch:{x:215, y:110}, ember:{x:185, y:195}, tundra:{x:240, y:240}, marsh:{x:35, y:250}, quarry:{x:105, y:250}};
A.snowExp = {CEN, N1, N, REG, VIL, WAYS, NOTES, VIEWS, GATES, regionAt, gen, drawWeather, drawProps};
})();
