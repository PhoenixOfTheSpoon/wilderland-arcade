// Wilderland Arcade · SUGAR SIEGE (sugar-siege.js) — an extra game, opened from ☰ Menu → Extras. Loaded only when opened.
// You are the EVIL SUGAR: defend the Sugar Keep from the healthy Broccoli Army across 24 levels.
// Its rewards stay inside the game: Chocolate Coins, its own achievements (no tickets) and its own leaderboard ('sugarsiege').
// It is NOT an arcade cabinet: no tickets, no Golden Stars, no prizes, no Workshop upgrades.
(function(){
'use strict';
const SS = window.WLSugar = window.WLSugar || {};
const A = window.Arcade || {}, TAU = Math.PI*2, FONT = A.font || 'system-ui,sans-serif';
const TS = 32, GW = 36, GH = 22, WW = GW*TS, WH = GH*TS;
const G = 0, ROCK = 1, RIV = 2, BRG = 3, TREE = 4, CLIFF = 5, RUB = 6, KEEPT = 7;
const KX = 3, KY = 11;                                   // the Sugar Keep (centre tile)
const LEVELS = 24, ADMIN_EMAIL = 'jonah@wilderland.academy';
const sfx = n => { try { A.sfx && A.sfx(n); } catch (e) {} }, tone = (f, d, w, v) => { try { A.tone && A.tone(f, d, w, v); } catch (e) {} };
const fmt = n => A.fmt ? A.fmt(n) : String(Math.round(n));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rngOf = seed => { let s = (seed % 2147483646) + 1; return () => (s = (s*16807) % 2147483647) / 2147483647; };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const circ = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
const shadow = (g, x, y, w) => { g.fillStyle = 'rgba(60,20,40,.18)'; g.beginPath(); g.ellipse(x, y, w, w*.32, 0, 0, TAU); g.fill(); };

// =====================================================================================================
// DATA: enemies (the Broccoli Army), bosses, buildings, troops, keep specializations
// tier: 0 no damage · 1 low · 2 good · 3 high
// =====================================================================================================
const EN = {
  foot:{n:'Broccoli Footsoldier', hp:20, sp:38, r:9, tier:1, coin:4, cost:1, from:1},
  celery:{n:'Celery Spearman', hp:14, sp:72, r:8, tier:1, coin:5, cost:1.3, from:1},
  kale:{n:'Kale Shieldbearer', hp:44, sp:32, r:11, tier:1, coin:9, cost:3.5, armor:.45, from:2, lead:1},
  spinach:{n:'Spinach Brute', hp:95, sp:30, r:13, tier:1, coin:12, cost:5, gateX:5, from:3},
  lettuce:{n:'Lettuce Healer', hp:26, sp:32, r:10, tier:0, coin:8, cost:4, heal:1, from:3},
  bomber:{n:'Brussels Sprout Bomber', hp:18, sp:62, r:8, tier:2, coin:8, cost:3, bomb:1, from:4},
  avocado:{n:'Avocado Tank', hp:200, sp:17, r:16, tier:1, coin:26, cost:12, armor:.4, tank:1, from:5},
  carrot:{n:'Carrot Caster', hp:8, sp:22, r:8, tier:3, coin:10, cost:6, ranged:1, from:7}};
const DMG = {hero:[0, .25, 1, 1.5], bld:[0, 2, 12, 9], troop:[0, 2, 8, 10], keep:[0, 3, 10, 15]};
const BOSSES = {3:{k:'radish', n:'Radish Rogue', hp:700, sp:46, r:16, dash:1},
  6:{k:'cauli', n:'Cauliflower Colossus', hp:1800, sp:20, r:24, armor:.35, pound:1, split:1},
  9:{k:'beet', n:'Beetroot Baron', hp:1700, sp:24, r:20, healer:1, puddle:1},
  12:{k:'eggplant', n:'Eggplant Warlock', hp:2000, sp:26, r:19, warp:1, bolt:1, shield:.5},
  15:{k:'pumpkin', n:'Pumpkin Juggernaut', hp:3200, sp:18, r:26, roll:1, tank:1, armor:.3},
  18:{k:'cabbage', n:'Cabbage Queen', hp:3200, sp:22, r:22, guards:1},
  21:{k:'artichoke', n:'Artichoke Knight', hp:3700, sp:28, r:20, armor:.4, thorns:1, dash:1},
  24:{k:'king', n:'THE BROCCOLI KING', hp:6500, sp:20, r:28, king:1}};
// buildings: cost per level [1, 2, 3] and the two level-4 branches
const BT = {
  sprinkle:{n:'Sprinkle Tower', d:'Fast single-target sprinkle darts', cost:[70, 90, 140], br:[{n:'Rainbow Gatling', d:'Very fast darts', cost:230}, {n:'Sniper Sprinkler', d:'Long range, big hits', cost:230}], from:1, hp:140},
  ginger:{n:'Gingerbread House', d:'Pays Chocolate Coins at the end of every wave it survives', cost:[60, 90, 130], br:[{n:'Ginger Bank', d:'Pays a lot more', cost:200}, {n:'Gingerbread Fortress', d:'Pays more, tough walls, enemies love to attack it', cost:200}], from:1, hp:160},
  gumball:{n:'Gumball Cannon', d:'Slow, big splash damage', cost:[120, 150, 220], br:[{n:'Jawbreaker Mortar', d:'Huge splash, slower', cost:320}, {n:'Gumball Gatling', d:'Three gumballs at once', cost:320}], from:2, hp:150},
  syrup:{n:'Syrup Spout', d:'Sticky puddle: slow stacks on enemies', cost:[80, 100, 150], br:[{n:'Frozen Syrup', d:'Full stacks freeze enemies', cost:240}, {n:'Hot Caramel', d:'The puddle burns too', cost:240}], from:3, hp:130},
  rock:{n:'Rock Candy Spire', d:'Crystal beams, pierce armor (magic)', cost:[110, 140, 200], br:[{n:'Prism Spire', d:'Beams chain to 2 more enemies', cost:300}, {n:'Crystal Lance', d:'One huge beam that cracks armor', cost:300}], from:5, hp:140},
  taffy:{n:'Taffy Gate', d:'Blocks the gap: enemies must chew through · back every round', cost:[50, 60, 90], br:[{n:'Jawbreaker Wall', d:'Twice the toughness', cost:140}, {n:'Thorny Taffy', d:'Big spikes hurt every chewer', cost:140}], from:4, hp:120, gate:1},
  melee:{n:'Melee Barracks', d:'Sugar fighters hold your enemies back', cost:[100, 120, 170], br:[{n:'Deep-Fried Butter Champions', d:'Huge, slow, massive health', cost:260}, {n:'Caramel Golems', d:'Sticky hits root enemies', cost:260}], from:1, hp:180, bar:'m'},
  ranged:{n:'Ranged Barracks', d:'Sugar shooters fire from behind', cost:[110, 130, 180], br:[{n:'Cotton Candy Sorcerers', d:'Chain magic', cost:270}, {n:'Triple-Chocolate Cannoneers', d:'Long-range artillery', cost:270}], from:3, hp:170, bar:'r'}};
// troops: by barracks level 1–3, then branch 0 / 1 at level 4
const TROOPS = {m:[{n:'Brown Sugar Grunt', hp:34, dmg:3, rng:16, cd:1}, {n:'Gummy Bear Brawler', hp:65, dmg:4, rng:16, cd:1}, {n:'Donut Knight', hp:85, dmg:6, rng:18, cd:1, kb:1}, {n:'Deep-Fried Butter Champion', hp:230, dmg:9, rng:20, cd:1.4, big:1}, {n:'Caramel Golem', hp:120, dmg:6, rng:18, cd:1, root:1}],
  r:[{n:'Sprinkle Slinger', hp:18, dmg:3, rng:110, cd:1.1}, {n:'Candy Corn Archer', hp:22, dmg:5, rng:130, cd:1}, {n:'Soda Fizz Grenadier', hp:26, dmg:7, rng:120, cd:1.4, splash:30}, {n:'Cotton Candy Sorcerer', hp:28, dmg:6, rng:130, cd:1.2, chain:2, magic:1}, {n:'Triple-Chocolate Cannoneer', hp:30, dmg:18, rng:210, cd:2.4, splash:42}]};
const SPECS = {2:[{k:'cottage', n:'Candy Cottage', pro:'All buildings cost 20% less', con:'Towers deal 10% less damage'}, {k:'bastion', n:'Chocolate Bastion', pro:'Keep and Taffy Gates +50% health', con:'No damage bonus'}, {k:'sour', n:'Sour Citadel', pro:'Towers deal +20% damage', con:'Buildings cost 15% more'}],
  3:[{k:'treasury', n:'Caramel Treasury', pro:'+30% Chocolate Coins from everything', con:''}, {k:'arsenal', n:'Hard Candy Arsenal', pro:'Towers +25% range', con:''}, {k:'sorcery', n:'Sprinkle Sorcery', pro:'Wand +50% damage and a Sprinkle Storm (Q, every 15 s)', con:''}],
  4:[{k:'garrison', n:'Gumdrop Garrison', pro:'Barracks hold +1 troop and train faster', con:''}, {k:'frosted', n:'Frosted Fortress', pro:'Every tower slows a little; Syrup Spouts freeze', con:''}, {k:'licorice', n:'Licorice Legion', pro:'Troops have 20% more health', con:'Barracks cost 20% more'}],
  5:[{k:'rush', n:'Sugar Rush Empire', pro:'Everything attacks 25% faster', con:''}, {k:'clouds', n:'Cotton Candy Clouds', pro:'Storm clouds zap enemies all over the field', con:'Towers cost 10% more'}, {k:'fudge', n:'Molten Fudge Throne', pro:'The keep fires fudge blasts; once a wave, drop a Fudge Flood (F) that blocks an area for 10 s', con:''}]};
const KEEP_COST = [0, 0, 450, 1000, 2000, 3800];          // to reach keep level 2..5
const THEME = {base:{wall:'#f7d9e6', roof:'#e4588f', trim:'#ffffff', glow:'255,150,200'}, cottage:{wall:'#f2d3a6', roof:'#e86a9a', trim:'#ffffff', glow:'255,190,220'}, bastion:{wall:'#8a5a3a', roof:'#4a2a1a', trim:'#f0c890', glow:'255,200,150'}, sour:{wall:'#e2f56a', roof:'#7ad13a', trim:'#ffe066', glow:'200,255,120'}};
const ACH = [['win1', 'First Victory', 'Beat your first level'], ['half', 'Halfway to Dessert', 'Beat 12 levels'], ['all', 'No More Salad', 'Defeat the Broccoli King'], ['boss', 'Boss Breaker', 'Defeat a boss'], ['hard', 'Hard Candy', 'Beat any level on Hard'],
  ['flaw', 'Flawless Frosting', 'Beat a level with the keep at full health'], ['fast', 'Sugar Rush', 'Beat a level faster than par'], ['keep5', 'Supreme Sweetness', 'Reach keep level 5'], ['spec', 'Every Flavor', 'Try all 12 keep specializations'],
  ['army', 'Sugar Army', 'Have 12 troops on the field at once'], ['rich', 'Chocolate Hoard', 'Earn 20,000 Chocolate Coins in total'], ['gate', 'Sticky Situation', 'Taffy Gates soak up 2,000 damage in total']];

// =====================================================================================================
// LEVELS: 24 hand-flavoured but generated layouts (same layout every time for the same level)
// =====================================================================================================
const LNAME = ['Gumdrop Meadow', 'Candy Corn Creek', 'Radish Ridge', 'Taffy Pass', 'Licorice Lake', 'Cauliflower Crags', 'Sherbet Shore', 'Fudge Falls', 'Beetroot Bog', 'Marshmallow Moor', 'Toffee Thicket', 'Eggplant Eclipse',
  'Peppermint Peaks', 'Jellybean Junction', 'Pumpkin Patch Panic', 'Caramel Canyon', 'Rock Candy Ruins', 'Cabbage Court', 'Cocoa Cliffs', 'Sorbet Summit', 'Artichoke Armory', 'Bonbon Bastion', 'Last Lollipop', 'The Broccoli Throne'];
const wavesOf = n => n == 24 ? 15 : 5 + Math.floor((n - 1)/3);
const parOf = n => wavesOf(n)*70;                           // seconds: beat it faster for the speed bonus
const DIFFM = {easy:{coin:1.2, hp:.8, keep:1.3, score:.75, extraSpawn:0}, normal:{coin:1, hp:1, keep:1, score:1, extraSpawn:0}, hard:{coin:.8, hp:1.3, keep:.9, score:1.5, extraSpawn:1}};
// highest possible score: every wave + a full keep + the whole speed bonus, on Hard
const LV_MAX = n => Math.round((1000*wavesOf(n) + 2000 + 3000)*DIFFM.hard.score);
const SCORE_MAX = (() => { let s = 0; for (let n = 1; n <= LEVELS; n++) s += LV_MAX(n); return s; })();
SS.SCORE_MAX = SCORE_MAX;

const genLevel = n => { const R = rngOf(n*7919 + 13), T = new Uint8Array(GW*GH), at = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH) ? ROCK : T[y*GW + x], set = (x, y, v) => { if (x >= 0 && y >= 0 && x < GW && y < GH) T[y*GW + x] = v; };
  const blob = (cx, cy, r, v) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx)*(x - cx) + (y - cy)*(y - cy) <= r*r + R()*1.5) set(x, y, v); };
  // the river (most levels): a winding chocolate river with a few bridges
  if (n % 4 != 1) { let rx = 15 + Math.floor(R()*8); const br = new Set(); const nb = 2 + (R() < .5 ? 1 : 0); while (br.size < nb) br.add(2 + Math.floor(R()*(GH - 4)));
    for (let y = 0; y < GH; y++) { if (R() < .3) rx = clamp(rx + (R() < .5 ? -1 : 1), 12, 26); for (let w = 0; w < 2; w++) set(rx + w, y, [...br].some(b => Math.abs(b - y) <= 0) ? BRG : RIV); } }
  for (let i = 0; i < 5 + Math.floor(n/4); i++) blob(7 + Math.floor(R()*27), 1 + Math.floor(R()*(GH - 2)), R() < .35 ? 2 : 1, ROCK);
  for (let i = 0; i < 3 + Math.floor(R()*3); i++) blob(7 + Math.floor(R()*27), 1 + Math.floor(R()*(GH - 2)), R() < .35 ? 2 : 1, TREE);
  for (let i = 0; i < 1 + Math.floor(n/8); i++) { const vert = R() < .5, x0 = 8 + Math.floor(R()*24), y0 = 2 + Math.floor(R()*(GH - 6)), L = 4 + Math.floor(R()*6); for (let k = 0; k < L; k++) set(vert ? x0 : x0 + k, vert ? y0 + k : y0, CLIFF); }
  // the keep and the area around it stay clear; bridges never get covered
  for (let y = KY - 4; y <= KY + 4; y++) for (let x = 0; x <= 7; x++) set(x, y, G); for (let y = KY - 1; y <= KY + 1; y++) for (let x = KX - 1; x <= KX + 1; x++) set(x, y, KEEPT);
  // Broccoli Fields: spawn points on the far edges (more open in later waves and on Hard)
  const sp = []; const nsp = clamp(1 + Math.floor(n/5), 1, 4) + 1; for (let i = 0; i < nsp; i++) { const side = i == 0 ? 0 : Math.floor(R()*3); let x, y;
    if (side == 0) { x = GW - 1; y = 2 + Math.floor(R()*(GH - 4)); } else if (side == 1) { x = 20 + Math.floor(R()*14); y = 0; } else { x = 20 + Math.floor(R()*14); y = GH - 1; }
    if (sp.some(s => Math.abs(s.x - x) + Math.abs(s.y - y) < 6)) { i--; if (sp.length > 6) break; continue; } sp.push({x, y}); for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (at(xx, yy) != BRG) set(xx, yy, G); }
  const L = {n, T, base:T.slice(), sp, spots:[], name:LNAME[n - 1]};
  // make sure every Broccoli Field can reach the keep (carve a trail if not)
  for (const s of sp) { let F = field(L, false); let guard = 0; while (F[s.y*GW + s.x] >= 1e8 && guard++ < 80) { let x = s.x, y = s.y; while (!(Math.abs(x - KX) <= 1 && Math.abs(y - KY) <= 1)) { const t = at(x, y); if (t == ROCK || t == TREE || t == CLIFF) set(x, y, G); if (t == RIV) set(x, y, BRG); if (Math.abs(x - KX) > Math.abs(y - KY)) x += Math.sign(KX - x); else y += Math.sign(KY - y); if (F[y*GW + x] < 1e8) break; } F = field(L, false); } }
  L.base = T.slice();
  // build spots next to the routes the army takes (and one or two in awkward places)
  const F = field(L, false), path = new Set(); for (const s of sp) { let x = s.x, y = s.y, g2 = 0; while (F[y*GW + x] > 0 && g2++ < 400) { path.add(y*GW + x); let best = null, bd = F[y*GW + x]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = F[(y + dy)*GW + (x + dx)]; if (x + dx >= 0 && x + dx < GW && y + dy >= 0 && y + dy < GH && v < bd) { bd = v; best = [x + dx, y + dy]; } } if (!best) break; [x, y] = best; } }
  L.path = path; const types = ['sprinkle', 'melee', 'ginger', 'gumball', 'syrup', 'ranged', 'rock'].filter(k => BT[k].from <= n);
  const cand = []; for (let y = 1; y < GH - 1; y++) for (let x = 6; x < GW - 2; x++) { if (at(x, y) != G || path.has(y*GW + x)) continue; let near = 9; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (path.has((y + dy)*GW + (x + dx))) near = Math.min(near, Math.abs(dx) + Math.abs(dy)); if (near <= 2) cand.push({x, y, s:R()}); }
  cand.sort((a, b) => a.s - b.s); const want = 9 + Math.min(6, Math.floor(n/3));
  for (const c of cand) { if (L.spots.length >= want) break; if (L.spots.some(o => Math.abs(o.x - c.x) + Math.abs(o.y - c.y) < 4)) continue; const k = L.spots.length, t = types[k % types.length];
    const choice = n >= 2 && R() < .3 ? [t, types[(k + 2) % types.length], ...(R() < .4 && types.length > 3 ? [types[(k + 4) % types.length]] : [])].filter((v, i, a) => a.indexOf(v) == i) : [t]; L.spots.push({x:c.x, y:c.y, opts:choice}); }
  for (let i = 0; i < 2; i++) { const x = 8 + Math.floor(R()*24), y = 1 + Math.floor(R()*(GH - 2)); if (at(x, y) == G && !path.has(y*GW + x) && !L.spots.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < 3)) L.spots.push({x, y, opts:[types[Math.floor(R()*types.length)]], far:1}); }
  // Taffy Gate spots: on the route where it squeezes between obstacles (bridges, gaps)
  if (n >= BT.taffy.from) { const narrow = [...path].filter(i => { const x = i % GW, y = Math.floor(i/GW); if (x < 8 || x > GW - 3) return false; const bl = (a, b) => { const t2 = at(a, b); return t2 != G && t2 != BRG && t2 != RUB; }; return (bl(x - 1, y) && bl(x + 1, y)) || (bl(x, y - 1) && bl(x, y + 1)) || at(x, y) == BRG; });
    const gates = []; for (const i of narrow.sort((a, b) => ((a*2654435761) % 997) - ((b*2654435761) % 997))) { const x = i % GW, y = Math.floor(i/GW); if (gates.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < 5)) continue; gates.push({x, y, opts:['taffy'], gate:1}); if (gates.length >= 1 + Math.floor(n/8)) break; } L.spots.push(...gates); }
  L.spots.forEach((s2, i) => { s2.i = i; s2.px = (s2.x + .5)*TS; s2.py = (s2.y + .5)*TS; });
  return L; };

// flow field toward the keep. tank = Avocado Tanks and the Pumpkin: obstacles cost a lot but can be chewed through.
// Taffy Gates are NOT in the field (buildings never change where enemies walk; they chew through gates in the way).
function field(L, tank) { const T = L.T, D = new Float64Array(GW*GH).fill(1e9), flood = L.flood || null; const heap = [];
  const push = (i, d) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const pa = (k - 1) >> 1; if (heap[pa][0] <= heap[k][0]) break; [heap[pa], heap[k]] = [heap[k], heap[pa]]; k = pa; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2*k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m == k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const cost = i => { const t = T[i]; let c = t == RIV ? -1 : (t == ROCK || t == TREE || t == CLIFF) ? (tank ? 7 : -1) : 1; if (c > 0 && flood && flood.has(i)) c += 40; return c; };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (T[y*GW + x] == KEEPT) { D[y*GW + x] = 0; push(y*GW + x, 0); }
  while (heap.length) { const [d, i] = pop(); if (d > D[i]) continue; const x = i % GW, y = (i/GW) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue; const j = ny*GW + nx, c = cost(j); if (c < 0) continue;
      if (dx && dy && (cost(y*GW + nx) < 0 || cost(ny*GW + x) < 0 || T[y*GW + nx] == ROCK || T[ny*GW + x] == ROCK)) continue; const nd = d + c*(dx && dy ? 1.414 : 1); if (nd < D[j]) { D[j] = nd; push(j, nd); } } }
  return D; }

// =====================================================================================================
// SAVE: progress, achievements and the run in progress (per arcade profile, on this device)
// =====================================================================================================
let api = null, SV = null;
const KEY = () => 'wl-sugar-v1:' + (api && api.profKey ? api.profKey() : 'local');
const load = () => { let d = null; try { d = JSON.parse(localStorage.getItem(KEY()) || 'null'); } catch (e) {} SV = Object.assign({v:1, done:{}, ach:{}, stats:{coins:0, kills:0, bosses:0, gate:0}, specs:{}, run:null, best:0, posted:0}, d || {}); SV.stats = Object.assign({coins:0, kills:0, bosses:0, gate:0}, SV.stats || {}); };
const save = () => { try { localStorage.setItem(KEY(), JSON.stringify(SV)); } catch (e) {} };
const total = () => Object.values(SV.done).reduce((a, d) => a + (d.s || 0), 0);
const unlocked = n => n == 1 || !!SV.done[n - 1];
const isAdmin = () => { try { if (api && api.admin && api.admin()) return true; const me = window.WLCloud && window.WLCloud.ev && window.WLCloud.ev.me && window.WLCloud.ev.me(); return !!(me && me.email == ADMIN_EMAIL && me.google); } catch (e) { return false; } };
let achQ = [];
const ach = k => { if (SV.ach[k]) return; SV.ach[k] = Date.now(); const a = ACH.find(q => q[0] == k); if (a) achQ.push({t:4, n:a[1], d:a[2]}); sfx('win'); save(); };

// =====================================================================================================
// THE GAME STATE
// =====================================================================================================
let root = null, cv = null, g = null, raf = 0, last = 0, ui = {}, panel = null;
let scr = 'map', L = null, R = null;      // screen, level, run state
let FN = null, FT = null, fieldDirty = true;
let enemies = [], shots = [], fx = [], troops = [], spawnQ = [], boss = null, floatT = [];
let hero = null, keys = {}, cam = {x:0, y:0, z:1, fit:true}, joy = null, ptrs = new Map(), pinch = null, showGrid = false, heroGod = false;
let t = 0, VWp = 800, VHp = 600, dpr = 1;
const low = () => !!(api && api.lowFx && api.lowFx());
const S = k => R && R.specs && Object.values(R.specs).includes(k);
const costMul = (type) => (S('cottage') ? .8 : 1) * (S('sour') ? 1.15 : 1) * (S('clouds') && !BT[type].bar && !BT[type].gate && type != 'ginger' ? 1.1 : 1) * (S('licorice') && BT[type].bar ? 1.2 : 1);
const dmgMul = () => (S('cottage') ? .9 : 1) * (S('sour') ? 1.2 : 1);
const rateMul = () => S('rush') ? 1.25 : 1;
const rngMul = () => S('arsenal') ? 1.25 : 1;
const coinMul = () => (S('treasury') ? 1.3 : 1) * DIFFM[R.diff].coin;
const themeOf = () => THEME[R && R.specs && R.specs[2] || 'base'] || THEME.base;
const keepMax = () => Math.round(500*DIFFM[R.diff].keep*(1 + .25*(R.keepLv - 1))*(S('bastion') ? 1.5 : 1));

const newRun = (n, diff) => { const Lv = genLevel(n); return {n, diff, wave:0, phase:'build', coins:Math.round((260 + 30*n)*DIFFM[diff].coin), keepLv:1, keepHP:0, specs:{}, wand:{d:0, r:0, s:0}, spots:Lv.spots.map(() => null), rub:[], t:0, flood:0, stormCd:0, reload:0}; };
const startLevel = (n, diff, resume) => { L = genLevel(n); R = resume ? JSON.parse(JSON.stringify(resume)) : newRun(n, diff); R.phase = 'build'; if (!resume) R.keepHP = keepMax(); for (const i of R.rub) L.T[i] = RUB;
  FN = FT = null; fieldDirty = true; enemies = []; shots = []; fx = []; troops = []; spawnQ = []; boss = null; floatT = [];
  hero = {x:(KX + 2.5)*TS, y:(KY + .5)*TS, hp:3, dead:0, cd:0, face:0, hurtT:0, walk:0, regen:0};
  R.spots.forEach((b, i) => { if (b) spawnTroopsFor(i, true); });
  cam.fit = window.innerWidth >= 900; cam.z = cam.fit ? fitZ() : Math.max(fitZ()*1.6, 1); scr = 'play';   /* Chromebooks see the whole map; phones follow the hero (pinch to zoom) */ mood(); save(); renderUI(); if (resume && resume.reload) say('You left in the middle of wave ' + (R.wave + 1) + ': it starts again from the beginning', 4); R.reload = 0; };
const mood = () => { try { if (!window.WLMusic) return; window.WLMusic.mood(scr != 'play' ? 'ss_build' : R.phase == 'wave' ? (boss ? 'ss_boss' : 'ss_battle') : 'ss_build'); } catch (e) {} };
const say = (m, d = 2.6) => { floatT.push({m, t:d, max:d}); if (floatT.length > 3) floatT.shift(); };

// ---------- buildings ----------
const bAt = i => R.spots[i];
const bStats = (b) => { const T2 = BT[b.t], lv = b.lv, br = b.br; const k = lv + (br != null ? 1 : 0);
  const base = {sprinkle:{rng:120, rate:3, dmg:4}, gumball:{rng:140, rate:.45, dmg:18, splash:42}, syrup:{rng:110}, rock:{rng:130, rate:.8, dmg:13, magic:1}}[b.t] || {};
  const s2 = {...base}; if (s2.dmg) s2.dmg *= 1 + .45*(Math.min(lv, 3) - 1); if (s2.rate) s2.rate *= 1 + .15*(Math.min(lv, 3) - 1); if (s2.rng) s2.rng *= 1 + .08*(Math.min(lv, 3) - 1);
  if (br != null) { if (b.t == 'sprinkle') { if (br == 0) { s2.rate *= 2.4; s2.dmg *= 1.1; } else { s2.rng *= 1.8; s2.dmg *= 3.2; s2.rate *= .55; } }
    if (b.t == 'gumball') { if (br == 0) { s2.splash = 80; s2.dmg *= 2.2; s2.rate *= .7; } else { s2.multi = 3; s2.dmg *= 1.15; } }
    if (b.t == 'rock') { if (br == 0) { s2.chain = 2; s2.dmg *= 1.25; } else { s2.dmg *= 3; s2.rate *= .7; s2.shred = 1; } } }
  if (s2.dmg) s2.dmg *= dmgMul(); if (s2.rate) s2.rate *= rateMul(); if (s2.rng) s2.rng *= rngMul(); s2.k = k; return s2; };
const bMaxHP = b => { const T2 = BT[b.t]; let h = T2.hp*(1 + .35*(b.lv - 1))*(b.br != null ? 1.4 : 1); if (T2.gate) { h = 120*(1 + .6*(b.lv - 1)); if (b.br == 0) h *= 2; if (S('bastion')) h *= 1.5; } if (b.t == 'ginger' && b.br == 1) h *= 2; return Math.round(h); };
const spent = b => { let c = 0; for (let l = 1; l <= b.lv; l++) c += Math.round(BT[b.t].cost[l - 1]*(b.cm || 1)); if (b.br != null) c += Math.round(BT[b.t].br[b.br].cost*(b.cm || 1)); return c; };
const nextCost = b => { if (!b) return null; const T2 = BT[b.t]; if (b.lv < 3) return Math.round(T2.cost[b.lv]*costMul(b.t)); return null; };
const build = (i, type) => { const c = Math.round(BT[type].cost[0]*costMul(type)); if (R.coins < c) { sfx('bad'); say('Not enough Chocolate Coins'); return; } R.coins -= c;
  const s2 = L.spots[i]; R.spots[i] = {t:type, lv:1, br:null, cm:costMul(type), hp:0, rally:null}; R.spots[i].hp = bMaxHP(R.spots[i]); spawnTroopsFor(i, true); sfx('coin'); fxBurst(s2.px, s2.py, 16, '#ffd6ec'); save(); };
const upgrade = (i, br) => { const b = bAt(i); if (!b) return; let c = br != null ? Math.round(BT[b.t].br[br].cost*costMul(b.t)) : nextCost(b); if (c == null || R.coins < c) { sfx('bad'); say('Not enough Chocolate Coins'); return; } R.coins -= c;
  if (br != null) b.br = br; else b.lv++; b.hp = bMaxHP(b); spawnTroopsFor(i, true); sfx('win'); fxBurst(L.spots[i].px, L.spots[i].py, 22, '#fff3a0'); save(); };
const sell = i => { const b = bAt(i); if (!b) return; R.coins += Math.round(spent(b)*.6); R.spots[i] = null; troops = troops.filter(q => q.home != i); sfx('coin'); save(); };
const rebuild = i => { const b = bAt(i); if (!b || !b.rub) return; const c = Math.round(spent(b)*.5); if (R.coins < c) { sfx('bad'); say('Not enough Chocolate Coins'); return; } R.coins -= c; b.rub = 0; b.hp = bMaxHP(b); spawnTroopsFor(i, true); sfx('coin'); save(); };
const breakB = (i, why) => { const b = bAt(i); if (!b || b.rub) return; const s2 = L.spots[i]; fxBurst(s2.px, s2.py, 26, '#c08a5a'); sfx('bad');
  if (BT[b.t].gate) { b.rub = 1; b.hp = 0; say('A Taffy Gate was chewed through! It comes back after the round', 2.6); } else { b.rub = 1; b.hp = 0; troops = troops.filter(q => q.home != i); say((BT[b.t].n) + ' was smashed! Rebuild it from the rubble', 2.6); } save(); };
const hurtB = (i, d) => { const b = bAt(i); if (!b || b.rub) return; b.hp -= d; b.hitT = .15; if (BT[b.t].gate) { SV.stats.gate += d; if (SV.stats.gate >= 2000) ach('gate'); } if (b.hp <= 0) breakB(i); };
// troops: each barracks keeps a squad; fallen troops come back every 10 s during waves
const troopType = b => TROOPS[BT[b.t].bar][b.br != null ? 3 + b.br : b.lv - 1];
const squadSize = b => (b.br != null ? 4 : [0, 2, 3, 3][b.lv]) + (S('garrison') ? 1 : 0);
const rallyOf = i => { const b = bAt(i), s2 = L.spots[i]; if (b && b.rally) return b.rally; let best = null, bd = 1e9; for (const p of L.path) { const x = (p % GW + .5)*TS, y = (Math.floor(p/GW) + .5)*TS, d = Math.hypot(x - s2.px, y - s2.py); if (d < bd) { bd = d; best = {x, y}; } } return best && bd < 150 ? best : {x:s2.px, y:s2.py + 20}; };
const spawnTroopsFor = (i, full) => { const b = bAt(i); troops = troops.filter(q => q.home != i); if (!b || b.rub || !BT[b.t].bar) return; const ty = troopType(b), n = squadSize(b), rp = rallyOf(i), s2 = L.spots[i];
  for (let k = 0; k < n; k++) troops.push(mkTroop(i, k, ty, rp, full ? null : s2)); };
const mkTroop = (i, k, ty, rp, from) => { const hp = Math.round(ty.hp*(S('licorice') ? 1.2 : 1)*(1 + .1*(R.keepLv - 1))), a = k*TAU/5; return {home:i, slot:k, ty, x:from ? from.px : rp.x + Math.cos(a)*16, y:from ? from.py : rp.y + Math.sin(a)*12, hp, max:hp, cd:Math.random(), dead:0, foe:null, walk:0}; };

// ---------- waves ----------
const openSpawns = () => { const n = L.sp.length, W = wavesOf(R.n), k = 1 + Math.floor(R.wave/(W/n)) + DIFFM[R.diff].extraSpawn; return L.sp.slice(0, clamp(k, 1, n)); };   // more Broccoli Fields open in later waves
const planWave = () => { const n = R.n, w = R.wave + 1, W = wavesOf(n); let budget = (9 + 6*w)*(1 + .15*(n - 1))*(R.diff == 'hard' ? 1.2 : R.diff == 'easy' ? .85 : 1);
  const pool = Object.keys(EN).filter(k => EN[k].from <= n && (k != 'avocado' || w >= 3) && (k != 'carrot' || w >= 2)); const sp = openSpawns(), q = []; let tt = 1.2, guard = 0;
  while (budget > 0 && guard++ < 400) { const k = Math.random() < .45 ? 'foot' : pool[Math.floor(Math.random()*pool.length)]; const E = EN[k]; if (E.cost > budget + 1) continue; budget -= E.cost; const s2 = sp[Math.floor(Math.random()*sp.length)];
    q.push({at:tt, k, s:s2}); if (E.lead) for (let j = 0; j < 3; j++) q.push({at:tt + .25*(j + 1), k:'foot', s:s2}); if (k == 'lettuce') q[q.length - 1].at += .6; tt += Math.max(.35, 1.1 - .04*n) + Math.random()*.6; }
  if (w == W && BOSSES[n]) q.push({at:tt + 3, k:'BOSS', s:sp[0]}); spawnQ = q.sort((a, b) => a.at - b.at); R.wt = 0; };
const startWave = () => { if (R.phase != 'build' || scr != 'play') return; R.snap = JSON.parse(JSON.stringify({...R, snap:null, reload:0})); SV.run = {...R.snap, reload:1}; R.phase = 'wave'; planWave(); R.flood = 0; save(); mood(); sfx('bad'); say('Wave ' + (R.wave + 1) + ' of ' + wavesOf(R.n) + ': the Broccoli Army marches!', 2.6); renderUI(); };
const endWave = () => { R.wave++; R.phase = 'build'; const bonus = Math.round((40 + 12*R.wave)*coinMul()); R.coins += bonus; SV.stats.coins += bonus; let gp = 0;
  R.spots.forEach((b, i) => { if (!b) return; if (BT[b.t].gate && b.rub) { b.rub = 0; b.hp = bMaxHP(b); } if (b.t == 'ginger' && !b.rub) { const pay = Math.round([0, 25, 45, 75][b.lv]*(b.br == 0 ? 2.4 : b.br == 1 ? 1.6 : 1)*coinMul()); gp += pay; R.coins += pay; fxText(L.spots[i].px, L.spots[i].py - 30, '+' + pay, '#7a4a22'); } });
  troops.forEach(q => { if (q.dead) { q.dead = 0; const rp = rallyOf(q.home); q.x = rp.x; q.y = rp.y; } q.hp = q.max; }); hero.hp = 3; hero.dead = 0;
  shots = []; boss = null; say('Wave cleared! +' + bonus + (gp ? ' and +' + gp + ' from Gingerbread Houses' : '') + ' Chocolate Coins', 3); sfx('win');
  if (R.wave >= wavesOf(R.n)) return winLevel(); R.snap = null; SV.run = {...R, snap:null}; save(); mood(); renderUI(); };
const winLevel = () => { const n = R.n, W = wavesOf(n), keepF = clamp(R.keepHP/keepMax(), 0, 1), par = parOf(n), speed = Math.max(0, 3000*(1 - R.t/(par*1.6)));
  const s2 = Math.round((1000*W + 2000*keepF + speed)*DIFFM[R.diff].score), old = SV.done[n]; SV.done[n] = {s:Math.max(s2, old ? old.s : 0), d:old && old.s > s2 ? old.d : R.diff, t:Math.round(R.t), at:Date.now()};
  ach('win1'); if (Object.keys(SV.done).length >= 12) ach('half'); if (n == 24) ach('all'); if (R.diff == 'hard') ach('hard'); if (keepF >= .999) ach('flaw'); if (R.t < par) ach('fast');
  SV.run = null; save(); postScore(); scr = 'won'; R.result = {s:s2, keepF, speed:Math.round(speed), W, best:SV.done[n].s}; mood(); sfx('win'); renderUI(); };
const loseLevel = () => { SV.run = null; save(); scr = 'lost'; mood(); sfx('over'); renderUI(); };
const postScore = () => { const s2 = Math.min(total(), SCORE_MAX); SV.best = Math.max(SV.best || 0, s2); save(); try { const C = window.WLCloud, u = api && api.user && api.user(); if (C && C.postScore && u && s2 > (SV.posted || 0)) { C.postScore('sugarsiege', {u, s:s2}, SCORE_MAX).then(() => { SV.posted = s2; save(); }).catch(() => {}); } } catch (e) {} };

// ---------- enemies ----------
const spawnEnemy = (k, s2) => { if (enemies.length >= 90) return; const E = EN[k], lvM = (1 + .1*(R.n - 1))*(1 + .06*R.wave)*DIFFM[R.diff].hp, hp = Math.round(E.hp*lvM);
  enemies.push({k, x:(s2.x + .5)*TS + (Math.random() - .5)*14, y:(s2.y + .5)*TS + (Math.random() - .5)*14, hp, max:hp, sp:E.sp*(.92 + Math.random()*.16), slow:0, stacks:0, stackT:0, freeze:0, root:0, burn:0, cd:Math.random(), walk:Math.random()*6, bully:Math.random() < .4, chew:0, block:null, flash:0, armor:E.armor || 0}); };
const spawnBoss = s2 => { const B = BOSSES[R.n]; if (!B) return; const hpM = (1 + .02*R.n)*DIFFM[R.diff].hp, hp = Math.round(B.hp*hpM);
  boss = {k:'BOSS', bk:B.k, n:B.n, x:(s2.x + .5)*TS, y:(s2.y + .5)*TS, hp, max:hp, sp:B.sp, r:B.r, armor:B.armor || 0, B, slow:0, stacks:0, stackT:0, freeze:0, root:0, burn:0, cd:3, walk:0, flash:0, ph:1, phases:B.king ? (R.diff == 'hard' ? 4 : 3) : 2, t:0, tell:null, shieldOn:0};
  enemies.push(boss); say('⚠ ' + B.n + ' joins the battle!', 3.4); mood(); sfx('bad'); };
const tileOf = (x, y) => [clamp(Math.floor(x/TS), 0, GW - 1), clamp(Math.floor(y/TS), 0, GH - 1)];
const walkable = (x, y) => { const [tx, ty] = tileOf(x, y), v = L.T[ty*GW + tx]; return v == G || v == BRG || v == RUB || v == KEEPT; };
const nextStep = (e, tank) => { const F = tank ? FT : FN, [tx, ty] = tileOf(e.x, e.y); let best = null, bd = F[ty*GW + tx];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = tx + dx, ny = ty + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue; const v = F[ny*GW + nx]; if (dx && dy && (F[ty*GW + nx] >= 1e8 || F[ny*GW + tx] >= 1e8)) continue; if (v < bd) { bd = v; best = [nx, ny]; } }
  return best; };
const hurtE = (e, d, magic, src) => { if (e.dead) return; if (e === boss && e.shieldOn) { d *= .1; } let arm = e.armor; if (e.shred) arm *= .4; if (!magic) d *= 1 - arm; else if (e.k == 'kale') d *= 1.5; if (e === boss && boss.B.shield && !magic) d *= 1 - boss.B.shield;
  e.hp -= d; e.flash = .1; if (e.hp <= 0) killE(e, src); };
const killE = (e, src) => { e.dead = 1; if (e === boss) { SV.stats.bosses++; ach('boss'); R.coins += Math.round(300*coinMul()); fxBurst(e.x, e.y, 60, '#7fd04a'); say('🏆 ' + boss.n + ' is defeated! +' + Math.round(300*coinMul()) + ' Chocolate Coins', 3.4); boss = null; mood(); sfx('win');
    if (e.B.split && !e.splitDone) { } return; }
  const E = EN[e.k], c = Math.round(E.coin*coinMul()); R.coins += c; SV.stats.coins += c; SV.stats.kills++; if (SV.stats.coins >= 20000) ach('rich');
  // defeated vegetables wilt, burst into leaves or roll away
  fxBurst(e.x, e.y, low() ? 6 : 14, e.k == 'carrot' ? '#ff9a3c' : e.k == 'avocado' ? '#6aa84f' : e.k == 'lettuce' ? '#b7e07a' : e.k == 'bomber' ? '#7fbf4a' : '#3f9f3f', 'leaf'); if (Math.random() < .3) fxText(e.x, e.y - 14, '+' + c, '#8a5a2a'); };
const bombGo = e => { fxBurst(e.x, e.y, 26, '#a8d860'); sfx('hit'); R.spots.forEach((b, i) => { if (!b || b.rub) return; const s2 = L.spots[i]; if (Math.hypot(s2.px - e.x, s2.py - e.y) < 48) hurtB(i, 45); }); if (dist(hero, e) < 40 && !hero.dead) hurtHero(DMG.hero[2]); e.dead = 1; };
const hurtHero = d => { if (hero.dead || heroGod || hero.inv > 0) return; hero.hp -= d; hero.hurtT = .3; hero.inv = .5; hero.regen = 0; sfx('bad'); if (hero.hp <= 0) { hero.hp = 0; hero.dead = 5; say('💥 The Sugar Sorcerer is down! Back at the keep in 5 seconds', 3); } };
const hurtKeep = d => { R.keepHP -= d; R.keepHit = .2; if (R.keepHP <= 0) { R.keepHP = 0; loseLevel(); } };

const enemyAI = (e, dt) => { if (e.dead) return; const E = e === boss ? null : EN[e.k]; e.flash = Math.max(0, e.flash - dt); e.walk += dt*6;
  e.stackT -= dt; if (e.stackT <= 0) e.stacks = Math.max(0, e.stacks - 1), e.stackT = 1; if (e.burn > 0) { e.burn -= dt; hurtE(e, 4*dt, true); if (e.dead) return; }
  if (e.freeze > 0) { e.freeze -= dt; return; } if (e.root > 0) { e.root -= dt; }
  const tier = e === boss ? 3 : E.tier, slowM = Math.max(.2, 1 - .22*e.stacks) * (e.chill > 0 ? .85 : 1); e.chill = Math.max(0, (e.chill || 0) - dt);
  if (e === boss) { bossAI(e, dt); if (e.dead) return; }
  // healers mend their friends
  if (E && E.heal) { e.cd -= dt; if (e.cd <= 0) { e.cd = 1; for (const o of enemies) if (!o.dead && o !== e && o.hp < o.max && dist(o, e) < 75) { o.hp = Math.min(o.max, o.hp + 3 + R.n*.4); } fx.push({x:e.x, y:e.y, r:75, t:.4, ring:'#9fe07a'}); } }
  // carrot casters throw from far away
  if (E && E.ranged) { e.cd -= dt; const tg = !hero.dead && dist(hero, e) < 160 ? hero : troops.find(q => !q.dead && dist(q, e) < 160); if (tg && e.cd <= 0) { e.cd = 2.2; shots.push({x:e.x, y:e.y, tg, sp:220, dmg:tg === hero ? DMG.hero[3] : DMG.troop[3], kind:'carrot', from:'enemy', life:2}); } if (tg) return; }
  // in a fight with a troop?
  if (e.block && (e.block.dead || dist(e.block, e) > 26)) e.block = null;
  if (e.block) { if (E && E.bomb) { e.block = null; } else { e.cd -= dt; if (e.cd <= 0) { e.cd = 1; hitTroop(e.block, DMG.troop[tier]); } return; } }
  // chase the hero if he comes close
  const hd = hero.dead ? 1e9 : dist(hero, e), chase = !(E && (E.bomb || E.heal || E.tank)) && (hd < 95 || (e.chasing && hd < 190));
  e.chasing = chase; if (chase) { if (hd > 18) { const a = Math.atan2(hero.y - e.y, hero.x - e.x), nx = e.x + Math.cos(a)*e.sp*slowM*dt, ny = e.y + Math.sin(a)*e.sp*slowM*dt; if (walkable(nx, ny)) { e.x = nx; e.y = ny; } }
    else { e.cd -= dt; if (e.cd <= 0) { e.cd = 1; hurtHero(DMG.hero[tier]); } } return; }
  // bombers run at the nearest gate or barracks
  if (E && E.bomb) { let tg = null, bd = 220; R.spots.forEach((b, i) => { if (!b || b.rub || !(BT[b.t].gate || BT[b.t].bar)) return; const s2 = L.spots[i], d2 = Math.hypot(s2.px - e.x, s2.py - e.y); if (d2 < bd) { bd = d2; tg = s2; } });
    if (tg) { if (bd < 22) { bombGo(e); return; } const a = Math.atan2(tg.py - e.y, tg.px - e.x), nx = e.x + Math.cos(a)*e.sp*slowM*dt, ny = e.y + Math.sin(a)*e.sp*slowM*dt; if (walkable(nx, ny)) { e.x = nx; e.y = ny; return; } } }
  // at the keep: attack it
  if (Math.hypot(e.x - (KX + .5)*TS, e.y - (KY + .5)*TS) < 52) { e.cd -= dt; if (e.cd <= 0) { e.cd = e === boss ? 1.6 : 1; hurtKeep(e === boss ? 18 : DMG.keep[tier]); if (E && E.bomb) { hurtKeep(25); bombGo(e); } } return; }
  // a Taffy Gate in the way: chew through it (Spinach Brutes smash through fast)
  for (let i = 0; i < L.spots.length; i++) { const b = R.spots[i]; if (!b || b.rub || !BT[b.t].gate) continue; const s2 = L.spots[i]; if (Math.hypot(s2.px - e.x, s2.py - e.y) < 22) { e.cd -= dt; if (e.cd <= 0) { e.cd = 1; hurtB(i, (e === boss ? 40 : DMG.bld[tier]*(E && E.gateX ? E.gateX : 1)) + 1); if (b.br == 1 || b.lv >= 2) hurtE(e, b.br == 1 ? 6 : (b.lv - 1)*1.5); } return; } }
  // some enemies stop to attack buildings they brush past
  if (e.bully && !(E && E.heal) && (e.bullyT || 0) < 7) for (let i = 0; i < L.spots.length; i++) { const b = R.spots[i]; if (!b || b.rub || BT[b.t].gate) continue; const s2 = L.spots[i], d2 = Math.hypot(s2.px - e.x, s2.py - e.y); if (d2 < (b.t == 'ginger' && b.br == 1 ? 70 : 40)) { e.bullyT = (e.bullyT || 0) + dt; e.cd -= dt; if (e.cd <= 0) { e.cd = 1; hurtB(i, DMG.bld[tier]); } return; } }
  // walk the flow field
  const tank = !!((E && E.tank) || (e === boss && boss.B.tank)); const st = nextStep(e, tank); if (!st) return; const ti = st[1]*GW + st[0], tv = L.T[ti];
  if (tank && (tv == ROCK || tv == TREE || tv == CLIFF)) { e.chew += dt; if (e.chew > 2.4) { e.chew = 0; L.T[ti] = RUB; R.rub.push(ti); fieldDirty = true; fxBurst((st[0] + .5)*TS, (st[1] + .5)*TS, 16, '#d8a0c0'); sfx('hit'); } return; }
  const tx = (st[0] + .5)*TS, ty = (st[1] + .5)*TS, a = Math.atan2(ty - e.y, tx - e.x), spd = e.sp*slowM*(e.root > 0 ? 0 : 1);
  e.x += Math.cos(a)*spd*dt; e.y += Math.sin(a)*spd*dt;
  e.stk = (e.stk || 0) + dt; if (e.stk > 2) { if (Math.hypot(e.x - (e.lx || 0), e.y - (e.ly || 0)) < 6 && spd > 0) { e.x = tx; e.y = ty; } e.stk = 0; e.lx = e.x; e.ly = e.y; } };   /* never get stuck on a corner */
// ---------- bosses ----------
const bossAI = (B, dt) => { B.t += dt; const P = B.B, np = B.phases, ph = Math.min(np, 1 + Math.floor((1 - B.hp/B.max)*np)); if (ph > B.ph) { B.ph = ph; say('⚠ ' + B.n + ' · phase ' + ph + '!', 2.4); sfx('bad'); onPhase(B); }
  B.cd -= dt; if (B.tell) { B.tell.t -= dt; if (B.tell.t <= 0) { const T2 = B.tell; B.tell = null; doTell(B, T2); } return; }
  if (B.cd > 0) return; B.cd = 5 - Math.min(2, R.n*.06);
  if (P.dash) { const tg = hero.dead ? null : hero; if (tg && dist(tg, B) < 260) { B.tell = {k:'dash', t:.9, x:tg.x, y:tg.y}; return; } }
  if (P.pound) { if (troops.some(q => !q.dead && dist(q, B) < 120)) { B.tell = {k:'pound', t:1.1, x:B.x, y:B.y, r:110}; return; } }
  if (P.healer || (P.king && B.ph >= 2)) { for (let i = 0; i < 2; i++) spawnEnemy('lettuce', {x:Math.floor(B.x/TS), y:Math.floor(B.y/TS)}); B.hp = Math.min(B.max, B.hp + B.max*.03); fx.push({x:B.x, y:B.y, r:90, t:.6, ring:'#9fe07a'}); }
  if (P.puddle) { let tg = null, bd = 220; R.spots.forEach((b, i) => { if (!b || b.rub || BT[b.t].gate) return; const s2 = L.spots[i], d2 = Math.hypot(s2.px - B.x, s2.py - B.y); if (d2 < bd) { bd = d2; tg = i; } }); if (tg != null) { B.tell = {k:'puddle', t:1, x:L.spots[tg].px, y:L.spots[tg].py, r:40, i:tg}; return; } }
  if (P.warp) { B.tell = {k:'warp', t:.9, x:B.x, y:B.y}; return; }
  if (P.bolt && !hero.dead && dist(hero, B) < 260) { for (let k = -1; k <= 1; k++) shots.push({x:B.x, y:B.y, tg:{x:hero.x + k*30, y:hero.y}, sp:200, dmg:1, kind:'bolt', from:'enemy', life:2, fixed:1}); }
  if (P.roll) { B.tell = {k:'roll', t:1, x:B.x, y:B.y}; return; }
  if (P.guards || (P.king && B.ph >= 3)) { if (!enemies.some(o => o.guard && !o.dead)) { for (let i = 0; i < (P.king ? 4 : 3); i++) { spawnEnemy(P.king ? 'kale' : 'kale', {x:Math.floor(B.x/TS), y:Math.floor(B.y/TS)}); const o = enemies[enemies.length - 1]; if (o) { o.guard = 1; o.x += Math.cos(i*TAU/3)*40; o.y += Math.sin(i*TAU/3)*40; } } say(P.king ? 'The King hides behind his Kale Guard! Break the guards' : 'The Cabbage Queen shields herself with Kale guards!', 2.8); } }
  if (P.king) { for (let i = 0; i < 2 + B.ph; i++) spawnEnemy(B.ph >= 2 ? 'celery' : 'foot', {x:Math.floor(B.x/TS), y:Math.floor(B.y/TS)}); if (B.ph >= 4) for (let i = 0; i < 2; i++) spawnEnemy('bomber', {x:Math.floor(B.x/TS), y:Math.floor(B.y/TS)}); }
  if (P.thorns) {} };
const onPhase = B => { const P = B.B; if (P.split && B.ph == 2) { for (let i = 0; i < 2; i++) { spawnEnemy('spinach', {x:Math.floor(B.x/TS), y:Math.floor(B.y/TS)}); } say('The Colossus sheds two Spinach Brutes!', 2.4); } if (P.king && B.ph == 4) { B.sp *= 1.5; say('THE BROCCOLI KING IS FURIOUS! (Hard)', 3); } };
const doTell = (B, T2) => { if (T2.k == 'dash') { const a = Math.atan2(T2.y - B.y, T2.x - B.x); for (let k = 0; k < 10; k++) { const nx = B.x + Math.cos(a)*14, ny = B.y + Math.sin(a)*14; if (!walkable(nx, ny)) break; B.x = nx; B.y = ny; } if (!hero.dead && dist(hero, B) < B.r + 20) hurtHero(1.5); troops.forEach(q => { if (!q.dead && dist(q, B) < B.r + 20) hitTroop(q, 25); }); fxBurst(B.x, B.y, 14, '#ff6a6a'); }
  if (T2.k == 'pound') { troops.forEach(q => { if (!q.dead && Math.hypot(q.x - T2.x, q.y - T2.y) < T2.r) { hitTroop(q, 20); q.stun = 2; } }); if (!hero.dead && Math.hypot(hero.x - T2.x, hero.y - T2.y) < T2.r) hurtHero(1); fx.push({x:T2.x, y:T2.y, r:T2.r, t:.5, ring:'#ffffff'}); sfx('hit'); }
  if (T2.k == 'puddle') { const b = bAt(T2.i); if (b && !b.rub) { b.jam = 4; hurtB(T2.i, 30); } fx.push({x:T2.x, y:T2.y, r:40, t:.8, ring:'#a0306a'}); }
  if (T2.k == 'warp') { for (let k = 0; k < 4; k++) { const st = nextStep(B, false); if (!st) break; B.x = (st[0] + .5)*TS; B.y = (st[1] + .5)*TS; } fxBurst(B.x, B.y, 18, '#8a4be0'); }
  if (T2.k == 'roll') { for (let k = 0; k < 5; k++) { const st = nextStep(B, true); if (!st) break; const ti = st[1]*GW + st[0]; if (L.T[ti] == ROCK || L.T[ti] == TREE || L.T[ti] == CLIFF) { L.T[ti] = RUB; R.rub.push(ti); fieldDirty = true; } B.x = (st[0] + .5)*TS; B.y = (st[1] + .5)*TS; R.spots.forEach((b, i) => { if (b && !b.rub && BT[b.t].gate && Math.hypot(L.spots[i].px - B.x, L.spots[i].py - B.y) < 30) hurtB(i, 120); }); } fxBurst(B.x, B.y, 20, '#ff9a3c'); } };
const hitTroop = (q, d) => { if (q.dead) return; q.hp -= d; q.flash = .12; if (boss && boss.B.thorns) {} if (q.hp <= 0) { q.dead = 10/(S('garrison') ? 1.6 : 1); q.foe = null; fxBurst(q.x, q.y, 10, '#e8b070'); } };

// ---------- towers, troops, hero ----------
const firstIn = (x, y, rng, pred) => { let best = null, bd = 1e9; const F = FN; for (const e of enemies) { if (e.dead) continue; if (Math.hypot(e.x - x, e.y - y) > rng) continue; if (pred && !pred(e)) continue; const [tx, ty] = tileOf(e.x, e.y), dv = F ? F[ty*GW + tx] : 0; if (dv < bd) { bd = dv; best = e; } } return best; };
const nearestIn = (x, y, rng) => { let best = null, bd = rng; for (const e of enemies) { if (e.dead) continue; const d2 = Math.hypot(e.x - x, e.y - y); if (d2 < bd) { bd = d2; best = e; } } return best; };
const towerTick = (i, b, dt) => { if (b.rub) return; const s2 = L.spots[i]; if (b.jam > 0) { b.jam -= dt; return; } const st = bStats(b);
  if (b.t == 'syrup') { if (!b.pud) { let best = null, bd = 1e9; for (const p of L.path) { const x = (p % GW + .5)*TS, y = (Math.floor(p/GW) + .5)*TS, d2 = Math.hypot(x - s2.px, y - s2.py); if (d2 < bd && d2 < st.rng) { bd = d2; best = {x, y}; } } b.pud = best || {x:s2.px, y:s2.py + 30}; }
    b.tk = (b.tk || 0) - dt; if (b.tk > 0) return; b.tk = .8/rateMul(); const pr = 46 + 6*b.lv; for (const e of enemies) { if (e.dead || Math.hypot(e.x - b.pud.x, e.y - b.pud.y) > pr) continue; e.stacks = Math.min(3 + (b.lv >= 3 ? 1 : 0), e.stacks + 1); e.stackT = 1.6;
      if ((b.br == 0 || S('frosted')) && e.stacks >= 3 && !(e.frozeCd > t)) { e.freeze = e === boss ? .4 : 1.1; e.frozeCd = t + 3; } if (b.br == 1) { e.burn = 1.2; } } return; }
  if (!st.rate) return; b.cd = (b.cd || 0) - dt; if (b.cd > 0) return; const tg = firstIn(s2.px, s2.py, st.rng); if (!tg) { b.cd = .15; return; } b.cd = 1/st.rate; b.aim = Math.atan2(tg.y - s2.py, tg.x - s2.px);
  if (b.t == 'rock') { const hits = [tg]; if (st.chain) { let cur = tg; for (let k = 0; k < st.chain; k++) { const nx2 = enemies.find(e => !e.dead && !hits.includes(e) && dist(e, cur) < 90); if (!nx2) break; hits.push(nx2); cur = nx2; } }
    let px2 = s2.px, py2 = s2.py - 26; for (const h of hits) { fx.push({beam:1, x:px2, y:py2, x2:h.x, y2:h.y, t:.16, col:'#c9a0ff'}); hurtE(h, st.dmg, true, 'tower'); if (st.shred) h.shred = 1; if (S('frosted')) h.chill = 1; px2 = h.x; py2 = h.y; } tone(900, .05, 'sine', .02); return; }
  const n = st.multi || 1; for (let k = 0; k < n; k++) shots.push({x:s2.px, y:s2.py - 24, tg, sp:b.t == 'gumball' ? 260 : 440, dmg:st.dmg, splash:st.splash, kind:b.t, from:'tower', life:2, off:(k - (n - 1)/2)*14, chill:S('frosted')}); };
const troopTick = (q, dt) => { if (q.dead) { if (R.phase == 'wave') { q.dead -= dt; if (q.dead <= 0) { q.dead = 0; q.hp = q.max; const s2 = L.spots[q.home]; q.x = s2.px; q.y = s2.py; } } return; } q.flash = Math.max(0, (q.flash || 0) - dt); if (q.stun > 0) { q.stun -= dt; return; }
  const ty = q.ty, rp = rallyOf(q.home), slot = {x:rp.x + Math.cos(q.slot*TAU/5)*18, y:rp.y + Math.sin(q.slot*TAU/5)*12}; q.cd -= dt*rateMul();
  if (ty.rng > 40) { const tg = nearestIn(q.x, q.y, ty.rng); if (tg && q.cd <= 0) { q.cd = ty.cd; shots.push({x:q.x, y:q.y - 10, tg, sp:ty.splash ? 240 : 380, dmg:ty.dmg*(1 + .08*(R.keepLv - 1)), splash:ty.splash, magic:ty.magic, chain:ty.chain, kind:ty.magic ? 'cotton' : ty.splash ? 'fizz' : 'troop', from:'troop', life:2}); q.face = Math.atan2(tg.y - q.y, tg.x - q.x); }
    const d2 = Math.hypot(slot.x - q.x, slot.y - q.y); if (d2 > 4) { q.x += (slot.x - q.x)/d2*Math.min(d2, 70*dt); q.y += (slot.y - q.y)/d2*Math.min(d2, 70*dt); q.walk += dt*6; } return; }
  // melee: hold the line near the rally point, grab an enemy and fight it
  if (!q.foe || q.foe.dead || Math.hypot(q.foe.x - rp.x, q.foe.y - rp.y) > 95) { q.foe = null; let bd = 80; for (const e of enemies) { if (e.dead || (e.block && e.block !== q)) continue; const d2 = Math.hypot(e.x - rp.x, e.y - rp.y); if (d2 < bd) { bd = d2; q.foe = e; } } }
  const tgt = q.foe || slot, d2 = Math.hypot(tgt.x - q.x, tgt.y - q.y); if (d2 > (q.foe ? 15 : 3)) { const sp = ty.big ? 45 : 70; q.x += (tgt.x - q.x)/d2*Math.min(d2, sp*dt); q.y += (tgt.y - q.y)/d2*Math.min(d2, sp*dt); q.walk += dt*6; }
  if (q.foe && d2 < 22) { if (!EN[q.foe.k] || !EN[q.foe.k].bomb) q.foe.block = q; if (q.cd <= 0) { q.cd = ty.cd; hurtE(q.foe, ty.dmg*(1 + .08*(R.keepLv - 1)), false, 'troop'); if (ty.root && q.foe) q.foe.root = 1.2; if (ty.kb && q.foe && !q.foe.dead && q.foe !== boss) { const a = Math.atan2(q.foe.y - q.y, q.foe.x - q.x); const nx = q.foe.x + Math.cos(a)*14, ny = q.foe.y + Math.sin(a)*14; if (walkable(nx, ny)) { q.foe.x = nx; q.foe.y = ny; } } if (boss && q.foe === boss && boss.B.thorns) hitTroop(q, ty.dmg*.3); } } };
const wandStats = () => ({dmg:(5 + 2.2*R.wand.d)*(S('sorcery') ? 1.5 : 1)*(1 + .1*(R.keepLv - 1)), rng:140 + 14*R.wand.r, rate:(2.2 + .3*R.wand.s)*rateMul()});
const heroTick = dt => { const H = hero; if (H.dead) { H.dead -= dt; if (H.dead <= 0) { H.dead = 0; H.hp = 3; H.x = (KX + 2.5)*TS; H.y = (KY + .5)*TS; say('The Sugar Sorcerer is back!', 1.6); } return; }
  H.inv = Math.max(0, (H.inv || 0) - dt); H.hurtT = Math.max(0, H.hurtT - dt); H.regen += dt; if (H.regen > 8 && H.hp < 3) { H.regen = 4; H.hp = Math.min(3, H.hp + 1); }
  let mx = (keys.ArrowRight || keys.d || keys.D ? 1 : 0) - (keys.ArrowLeft || keys.a || keys.A ? 1 : 0), my = (keys.ArrowDown || keys.s || keys.S ? 1 : 0) - (keys.ArrowUp || keys.w || keys.W ? 1 : 0);
  if (joy) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d2 = Math.hypot(dx, dy); if (d2 > 8) { const m = Math.min(1, d2/55); mx = dx/d2*m; my = dy/d2*m; } }
  const Lm = Math.hypot(mx, my); if (Lm) { if (Lm > 1) { mx /= Lm; my /= Lm; } const sp = 150; const nx = H.x + mx*sp*dt, ny = H.y + my*sp*dt; if (walkable(nx, H.y) && nx > 8 && nx < WW - 8) H.x = nx; if (walkable(H.x, ny) && ny > 8 && ny < WH - 8) H.y = ny; H.walk += dt*8; H.face = Math.atan2(my, mx); }
  const W2 = wandStats(); H.cd -= dt; if (H.cd <= 0) { const tg = nearestIn(H.x, H.y, W2.rng); if (tg) { H.cd = 1/W2.rate; shots.push({x:H.x, y:H.y - 18, tg, sp:420, dmg:W2.dmg, magic:1, kind:'wand', from:'hero', life:1.5}); H.aim = Math.atan2(tg.y - H.y, tg.x - H.x); tone(700, .03, 'triangle', .015); } }
  R.stormCd = Math.max(0, (R.stormCd || 0) - dt); };
const storm = () => { if (!S('sorcery') || R.stormCd > 0 || hero.dead) return; R.stormCd = 15; for (let k = 0; k < 20; k++) { const a = k*TAU/20; shots.push({x:hero.x, y:hero.y - 10, tg:{x:hero.x + Math.cos(a)*150, y:hero.y + Math.sin(a)*150}, sp:300, dmg:wandStats().dmg*1.4, magic:1, kind:'storm', from:'hero', life:.6, fixed:1, pierce:1}); } sfx('win'); };
const fudgeFlood = () => { if (!S('fudge') || R.flood || R.phase != 'wave' || hero.dead) return; R.flood = 1; const [tx, ty] = tileOf(hero.x, hero.y), set = new Set(); for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) if (x >= 0 && y >= 0 && x < GW && y < GH) set.add(y*GW + x); L.flood = set; R.floodT = 10; fieldDirty = true; say('🍫 FUDGE FLOOD! Enemies take the long way round for 10 s', 2.6); sfx('win'); };
const shotTick = (s2, dt) => { s2.life -= dt; const tg = s2.tg; if (s2.fixed) { if (!s2.dx) { const a = Math.atan2(tg.y - s2.y, tg.x - s2.x); s2.dx = Math.cos(a); s2.dy = Math.sin(a); } s2.x += s2.dx*s2.sp*dt; s2.y += s2.dy*s2.sp*dt;
    if (s2.from == 'enemy') { if (!hero.dead && Math.hypot(hero.x - s2.x, hero.y - 10 - s2.y) < 14) { hurtHero(s2.dmg); s2.life = 0; } } else for (const e of enemies) if (!e.dead && Math.hypot(e.x - s2.x, e.y - s2.y) < (e.r || EN[e.k].r) + 6 && !(s2.hit || (s2.hit = [])).includes(e)) { s2.hit.push(e); hurtE(e, s2.dmg, s2.magic, s2.from); if (!s2.pierce) { s2.life = 0; break; } } return; }
  if (tg.dead || (tg.hp != null && tg.hp <= 0 && tg !== hero)) { s2.life = Math.min(s2.life, .05); }
  const tx = tg.x + (s2.off || 0), ty = tg.y - 8, d2 = Math.hypot(tx - s2.x, ty - s2.y), step = s2.sp*dt; if (d2 > step) { s2.x += (tx - s2.x)/d2*step; s2.y += (ty - s2.y)/d2*step; return; }
  s2.life = 0; if (s2.from == 'enemy') { if (tg === hero) hurtHero(s2.dmg); else if (tg.ty) hitTroop(tg, s2.dmg); return; }
  if (s2.splash) { for (const e of enemies) if (!e.dead && Math.hypot(e.x - tx, e.y - ty) < s2.splash) hurtE(e, s2.dmg*(e === tg ? 1 : .6), s2.magic, s2.from); fx.push({x:tx, y:ty, r:s2.splash, t:.3, ring:s2.kind == 'fizz' ? '#9fe8ff' : '#ff7ab8'}); }
  else { hurtE(tg, s2.dmg, s2.magic, s2.from); if (s2.chain) { let cur = tg, hit = [tg]; for (let k = 0; k < s2.chain; k++) { const nx2 = enemies.find(e => !e.dead && !hit.includes(e) && dist(e, cur) < 80); if (!nx2) break; fx.push({beam:1, x:cur.x, y:cur.y, x2:nx2.x, y2:nx2.y, t:.15, col:'#ffb3e6'}); hurtE(nx2, s2.dmg*.7, true, s2.from); hit.push(nx2); cur = nx2; } } }
  if (s2.chill && !tg.dead) tg.chill = 1; };
const fxBurst = (x, y, n, col, kind) => { const cap = low() ? 60 : 160; for (let i = 0; i < n && fx.length < cap; i++) { const a = Math.random()*TAU, v = 40 + Math.random()*120; fx.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v - 30, t:.5 + Math.random()*.5, col, leaf:kind == 'leaf'}); } };
const fxText = (x, y, m, col) => fx.push({x, y, txt:m, col, t:1, vy:-30, vx:0});

// =====================================================================================================
// UPDATE
// =====================================================================================================
const update = dt => { t += dt; floatT.forEach(f => f.t -= dt); floatT = floatT.filter(f => f.t > 0); achQ.forEach(a => a.t -= dt); achQ = achQ.filter(a => a.t > 0);
  for (const f of fx) { f.t -= dt; if (f.vx != null) { f.x += f.vx*dt; f.y += f.vy*dt; if (!f.txt) f.vy += 120*dt; } } fx = fx.filter(f => f.t > 0);
  if (scr != 'play' || panel) return;
  if (fieldDirty || !FN) { FN = field(L, false); FT = field(L, true); fieldDirty = false; }
  if (L.flood) { R.floodT -= dt; if (R.floodT <= 0) { L.flood = null; fieldDirty = true; } }
  if (R.phase == 'wave') { R.t += dt; R.wt += dt; while (spawnQ.length && spawnQ[0].at <= R.wt) { const q = spawnQ.shift(); if (q.k == 'BOSS') spawnBoss(q.s); else spawnEnemy(q.k, q.s); }
    for (const e of enemies) enemyAI(e, dt); if (R.keepHP <= 0) return; enemies = enemies.filter(e => !e.dead);
    // enemies push apart a little so they don't stack
    for (let i = 0; i < enemies.length; i++) for (let j = i + 1; j < enemies.length; j++) { const a = enemies[i], b = enemies[j], d2 = Math.hypot(a.x - b.x, a.y - b.y), rs = 10; if (d2 > 0 && d2 < rs) { const k = (rs - d2)/d2*.5, ox = (a.x - b.x)*k, oy = (a.y - b.y)*k; if (walkable(a.x + ox, a.y + oy)) { a.x += ox; a.y += oy; } if (walkable(b.x - ox, b.y - oy)) { b.x -= ox; b.y -= oy; } } }
    R.spots.forEach((b, i) => { if (b && BT[b.t] && !BT[b.t].bar && !BT[b.t].gate && b.t != 'ginger') towerTick(i, b, dt); });
    // keep: fudge blasts (Molten Fudge Throne) and storm clouds
    if (S('fudge')) { R.kcd = (R.kcd || 0) - dt*rateMul(); if (R.kcd <= 0) { const tg = nearestIn((KX + .5)*TS, (KY + .5)*TS, 170); if (tg) { R.kcd = 1; shots.push({x:(KX + .5)*TS, y:(KY - 1)*TS, tg, sp:260, dmg:12 + 3*R.keepLv, splash:34, kind:'fudge', from:'tower', life:2}); } else R.kcd = .2; } }
    if (S('clouds')) { R.ccd = (R.ccd || 0) - dt*rateMul(); if (R.ccd <= 0) { R.ccd = 1.4; const alive = enemies.filter(e => !e.dead); if (alive.length) { const e = alive[Math.floor(Math.random()*alive.length)]; hurtE(e, 14, true, 'tower'); fx.push({bolt:1, x:e.x, y:e.y, t:.25}); } } }
    if (!spawnQ.length && !enemies.length) endWave(); }
  heroTick(dt); troops.forEach(q => troopTick(q, dt)); if (troops.filter(q => !q.dead).length >= 12) ach('army');
  for (const s2 of shots) shotTick(s2, dt); shots = shots.filter(s2 => s2.life > 0);
  R.keepHit = Math.max(0, (R.keepHit || 0) - dt);
  // camera
  const vw = VWp/cam.z, vh = VHp/cam.z; if (cam.fit) { cam.x = WW/2 - vw/2; cam.y = WH/2 - (VHp/2 - 2)/cam.z; } else { cam.x = clamp(hero.x - vw/2, Math.min(0, WW - vw), Math.max(0, WW - vw)); cam.y = clamp(hero.y - vh/2, Math.min(0, WH - vh), Math.max(0, WH - vh)); if (vw >= WW) cam.x = WW/2 - vw/2; if (vh >= WH) cam.y = WH/2 - vh/2; }
  R.saveT = (R.saveT || 0) - dt; if (R.saveT <= 0 && R.phase == 'build') { R.saveT = 5; SV.run = {...R, snap:null, reload:0}; save(); } };

// =====================================================================================================
// DRAWING (all custom art: no emojis for characters, enemies, troops or buildings)
// =====================================================================================================
const drawGround = () => { const th = themeOf();
  g.fillStyle = '#ffe9f2'; g.fillRect(0, 0, WW, WH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = L.T[y*GW + x], px = x*TS, py = y*TS, h = ((x*73856093) ^ (y*19349663)) & 255;
    if (v == G || v == KEEPT) { g.fillStyle = (x + y) % 2 ? '#ffe3ee' : '#ffdbe9'; g.fillRect(px, py, TS, TS); if (h < 30) { circ(g, px + 8 + h % 16, py + 10 + (h >> 3) % 14, 2, ['#ff8ab8', '#9fe8ff', '#ffe066', '#b8f08a'][h % 4]); } }
    else if (v == RIV) { g.fillStyle = '#6b3a1f'; g.fillRect(px, py, TS, TS); g.strokeStyle = 'rgba(255,220,180,.25)'; g.lineWidth = 2; g.beginPath(); const o = (t*20 + y*9) % TS; g.moveTo(px + 4, py + o); g.quadraticCurveTo(px + 16, py + o - 6, px + 28, py + o); g.stroke(); }
    else if (v == BRG) { g.fillStyle = '#6b3a1f'; g.fillRect(px, py, TS, TS); g.fillStyle = '#c8945a'; g.fillRect(px - 1, py + 3, TS + 2, TS - 6); g.strokeStyle = '#8a5a2a'; g.lineWidth = 1.5; for (let k = 4; k < TS; k += 7) { g.beginPath(); g.moveTo(px + k, py + 3); g.lineTo(px + k, py + TS - 3); g.stroke(); } }
    else if (v == RUB) { g.fillStyle = '#ffdbe9'; g.fillRect(px, py, TS, TS); for (let k = 0; k < 4; k++) circ(g, px + 6 + ((h >> k) % 20), py + 8 + ((h >> (k + 2)) % 16), 3, '#d8a0c0'); }
    else { g.fillStyle = '#ffdbe9'; g.fillRect(px, py, TS, TS); } }
  // obstacles drawn on top: candy-rock boulders, lollipop trees, cliffs
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = L.T[y*GW + x], cx = (x + .5)*TS, cy = (y + .5)*TS, h = ((x*73856093) ^ (y*19349663)) & 255;
    if (v == ROCK) { shadow(g, cx, cy + 12, 14); const c = ['#c8a0e0', '#9fd0f0', '#f0b0c8'][h % 3]; g.fillStyle = c; g.beginPath(); g.moveTo(cx - 14, cy + 10); g.lineTo(cx - 12, cy - 6); g.lineTo(cx - 2, cy - 14); g.lineTo(cx + 11, cy - 8); g.lineTo(cx + 14, cy + 9); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(cx - 9, cy - 4); g.lineTo(cx - 2, cy - 11); g.lineTo(cx + 2, cy - 4); g.fill(); }
    else if (v == TREE) { shadow(g, cx, cy + 13, 10); g.fillStyle = '#fff'; g.fillRect(cx - 2, cy - 4, 4, 17); const c = ['#ff5f9e', '#5fc8ff', '#ffb84a', '#8ae05a'][h % 4]; circ(g, cx, cy - 8, 11, c); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.5; g.beginPath(); for (let a = 0; a < 9; a += .5) { const r2 = a*1.2; g.lineTo(cx + Math.cos(a)*r2, cy - 8 + Math.sin(a)*r2); } g.stroke(); }
    else if (v == CLIFF) { g.fillStyle = '#b07a9a'; g.fillRect(x*TS, y*TS + 6, TS, TS - 6); g.fillStyle = '#e8b8d0'; g.fillRect(x*TS, y*TS, TS, 9); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x*TS, y*TS + TS - 6, TS, 6); } }
  // fudge flood
  if (L.flood) for (const i of L.flood) { g.fillStyle = 'rgba(90,40,20,' + (.6 + .15*Math.sin(t*6 + i)) + ')'; g.fillRect((i % GW)*TS, Math.floor(i/GW)*TS, TS, TS); }
  // Broccoli Fields (spawn points)
  const open = R.phase == 'wave' ? openSpawns() : openSpawns(); L.sp.forEach(s2 => { const cx = (s2.x + .5)*TS, cy = (s2.y + .5)*TS, on = open.includes(s2); g.fillStyle = on ? 'rgba(60,140,60,.35)' : 'rgba(60,140,60,.12)'; g.beginPath(); g.arc(cx, cy, 22, 0, TAU); g.fill();
    for (let k = 0; k < 5; k++) { const a = k*TAU/5 + 1; g.fillStyle = on ? '#2f8f3f' : '#9fc09f'; circ(g, cx + Math.cos(a)*12, cy + Math.sin(a)*12, 5, g.fillStyle); } }); };
const drawKeep = () => { const th = themeOf(), x = (KX + .5)*TS, y = (KY + 1.4)*TS, lv = R.keepLv, sc = 1 + .08*(lv - 1); g.save(); g.translate(x, y); g.scale(sc, sc); if (R.keepHit > 0) g.translate((Math.random() - .5)*4, 0);
  shadow(g, 0, 2, 56); g.fillStyle = th.wall; rr(g, -42, -60, 84, 62, 6); g.fill(); g.strokeStyle = th.trim; g.lineWidth = 3; g.stroke();
  for (let i = -42; i < 42; i += 12) { g.fillStyle = th.wall; g.fillRect(i, -68, 8, 9); }
  const towers = [-36, 36, ...(lv >= 3 ? [-18, 18] : []), ...(lv >= 5 ? [0] : [])]; towers.forEach((tx, k) => { const h = 74 + k*4 + (tx == 0 ? 22 : 0); g.fillStyle = th.wall; rr(g, tx - 10, -h, 20, h - 4, 4); g.fill(); g.strokeStyle = th.trim; g.lineWidth = 2; g.stroke(); g.fillStyle = th.roof; g.beginPath(); g.moveTo(tx - 13, -h); g.lineTo(tx, -h - 22); g.lineTo(tx + 13, -h); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(tx - 7, -h - 6); g.lineTo(tx + 4, -h - 14); g.stroke(); circ(g, tx, -h - 24, 4, R.specs[3] == 'treasury' ? '#F9BF01' : R.specs[3] == 'arsenal' ? '#9fe8ff' : '#ff8ab8'); });
  g.fillStyle = '#7a3a2a'; g.beginPath(); g.arc(0, 2, 13, Math.PI, 0); g.fill(); g.fillStyle = th.roof; g.beginPath(); g.arc(0, -36, 9, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-3, -39, 3, 0, TAU); g.fill();
  if (R.specs[4] == 'garrison') for (let k = 0; k < 5; k++) circ(g, -36 + k*18, -62, 5, ['#ff5f9e', '#5fc8ff', '#ffe066', '#8ae05a', '#c88aff'][k]); if (R.specs[4] == 'frosted') { g.fillStyle = 'rgba(255,255,255,.9)'; for (let k = -42; k < 42; k += 8) { g.beginPath(); g.arc(k + 4, -60, 4.5, 0, Math.PI); g.fill(); } } if (R.specs[4] == 'licorice') { g.strokeStyle = '#2a1a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(-42, -30); g.lineTo(42, -30); g.stroke(); }
  if (R.specs[5] == 'fudge') { g.fillStyle = '#5a2a14'; for (let k = -40; k < 40; k += 14) { g.beginPath(); g.moveTo(k, -60); g.lineTo(k + 8, -60); g.lineTo(k + 4, -48 - 6*Math.sin(t*2 + k)); g.fill(); } } if (R.specs[5] == 'rush') { for (let k = 0; k < 6; k++) { const a = t*3 + k; circ(g, Math.cos(a)*56, -40 + Math.sin(a)*20, 2.5, '#fff6a0'); } }
  g.restore(); if (R.specs[5] == 'clouds') { for (let k = 0; k < 3; k++) { const cx = (8 + k*10 + Math.sin(t*.2 + k)*3)*TS, cy = (3 + (k % 2)*12)*TS; g.fillStyle = 'rgba(255,200,240,.55)'; for (const [ox, oy, r2] of [[-20, 0, 18], [0, -8, 22], [22, 0, 18]]) { g.beginPath(); g.arc(cx + ox, cy + oy, r2, 0, TAU); g.fill(); } } }
  const bw = 90; g.fillStyle = 'rgba(40,10,30,.6)'; rr(g, x - bw/2, y + 10, bw, 8, 4); g.fill(); g.fillStyle = R.keepHP < keepMax()*.3 ? '#FF4539' : '#ff5f9e'; rr(g, x - bw/2, y + 10, bw*clamp(R.keepHP/keepMax(), 0, 1), 8, 4); g.fill(); };
// each building: its own look per level, in your keep's colours
const drawBuilding = (i) => { const s2 = L.spots[i], b = R.spots[i], x = s2.px, y = s2.py + 12, th = themeOf();
  if (!b) { const o = s2.opts; g.strokeStyle = 'rgba(160,60,110,.55)'; g.setLineDash([4, 4]); g.lineWidth = 2; rr(g, x - 15, y - 26, 30, 30, 6); g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(122,40,80,.85)'; g.font = '800 8px ' + FONT; g.textAlign = 'center';
    g.fillText(o.length > 1 ? o.length + ' CHOICES' : BT[o[0]].n.split(' ')[0].toUpperCase(), x, y - 9); g.fillText(Math.round(Math.min(...o.map(k => BT[k].cost[0]*costMul(k)))) + ' ◉', x, y + 1); return; }
  if (b.rub) { for (let k = 0; k < 6; k++) circ(g, x - 12 + (k*7) % 24, y - 4 - (k*5) % 10, 4, '#c8946a'); g.fillStyle = 'rgba(122,40,80,.85)'; g.font = '800 8px ' + FONT; g.textAlign = 'center'; g.fillText(BT[b.t].gate ? 'GATE (BACK SOON)' : 'RUBBLE · REBUILD', x, y + 10); return; }
  const lv = b.lv + (b.br != null ? 1 : 0), sc = .9 + .08*lv, T2 = b.t; g.save(); g.translate(x, y); g.scale(sc, sc); if (b.hitT > 0) { b.hitT -= 1/60; g.translate((Math.random() - .5)*3, 0); } shadow(g, 0, 0, 16);
  if (T2 == 'sprinkle') { g.fillStyle = th.wall; rr(g, -10, -30, 20, 30, 4); g.fill(); g.fillStyle = th.roof; g.beginPath(); g.moveTo(-13, -30); g.lineTo(0, -44 - lv*2); g.lineTo(13, -30); g.fill(); for (let k = 0; k < 6; k++) { g.fillStyle = ['#ff5f9e', '#5fc8ff', '#ffe066', '#8ae05a'][k % 4]; g.fillRect(-8 + (k*5) % 16, -26 + k*4, 4, 2); }
    g.save(); g.translate(0, -34); g.rotate(b.aim || 0); g.fillStyle = '#444'; g.fillRect(0, -2.5, 12 + lv*2, 5); g.restore(); if (b.br == 0) { for (let k = 0; k < 3; k++) circ(g, -10 + k*10, -48, 3, ['#ff5f9e', '#5fc8ff', '#ffe066'][k]); } if (b.br == 1) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(0, -52, 5, 0, TAU); g.stroke(); } }
  else if (T2 == 'gumball') { g.fillStyle = th.roof; rr(g, -12, -14, 24, 14, 3); g.fill(); g.fillStyle = 'rgba(220,240,255,.85)'; g.beginPath(); g.arc(0, -26, 14, 0, TAU); g.fill(); g.strokeStyle = th.trim; g.lineWidth = 2; g.stroke(); for (let k = 0; k < 4 + lv; k++) circ(g, -7 + (k*9) % 14, -30 + ((k*5) % 12), 3, ['#ff5f9e', '#5fc8ff', '#ffe066', '#8ae05a', '#c88aff'][k % 5]);
    g.save(); g.translate(0, -26); g.rotate(b.aim || 0); g.fillStyle = '#7a3a5a'; g.fillRect(10, -4, 10 + lv, 8); g.restore(); if (b.br == 0) { g.fillStyle = '#5a2a3a'; g.fillRect(-14, -10, 28, 6); } if (b.br == 1) { for (const ox of [-8, 8]) { g.fillStyle = '#7a3a5a'; g.fillRect(ox - 2, -46, 4, 8); } } }
  else if (T2 == 'syrup') { g.fillStyle = '#c87a2a'; rr(g, -9, -24, 18, 24, 5); g.fill(); g.fillStyle = th.roof; rr(g, -11, -28, 22, 6, 3); g.fill(); g.fillStyle = '#e8a040'; g.beginPath(); g.moveTo(9, -16); g.quadraticCurveTo(18, -16, 18, -6); g.lineTo(15, -6); g.quadraticCurveTo(15, -12, 9, -12); g.fill(); for (let k = 0; k < lv; k++) circ(g, -4 + k*4, -18 + k*3, 2, '#ffd080');
    if (b.br == 0) { g.fillStyle = '#bff0ff'; g.fillRect(-11, -30, 22, 3); } if (b.br == 1) circ(g, 0, -34, 4, '#ff7a3a'); }
  else if (T2 == 'rock') { g.fillStyle = th.wall; rr(g, -9, -12, 18, 12, 3); g.fill(); g.fillStyle = b.br == 1 ? '#ff9ad5' : '#c9a0ff'; g.beginPath(); g.moveTo(0, -24 - 12*lv); g.lineTo(9, -16); g.lineTo(0, -8); g.lineTo(-9, -16); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); if (b.br == 0) for (let k = 0; k < 3; k++) { const a = t*2 + k*TAU/3; circ(g, Math.cos(a)*14, -24 + Math.sin(a)*5, 3, '#e8d8ff'); } }
  else if (T2 == 'ginger') { g.fillStyle = '#b8763a'; rr(g, -14, -20, 28, 20, 3); g.fill(); g.fillStyle = th.roof; g.beginPath(); g.moveTo(-17, -20); g.lineTo(0, -34 - lv*2); g.lineTo(17, -20); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); for (let k = -14; k <= 14; k += 4) g.lineTo(k, -21 + (k/4 % 2 ? 2 : -2)); g.stroke(); g.fillStyle = '#6a3a1a'; rr(g, -4, -10, 8, 10, 3); g.fill(); circ(g, -9, -13, 2.5, '#ff5f9e'); circ(g, 9, -13, 2.5, '#5fc8ff');
    if (b.br == 0) circ(g, 0, -40, 5, '#F9BF01'); if (b.br == 1) { g.fillStyle = '#8a5a2a'; g.fillRect(-18, -6, 4, 6); g.fillRect(14, -6, 4, 6); } }
  else if (T2 == 'taffy') { const hp = clamp(b.hp/bMaxHP(b), 0, 1); g.fillStyle = b.br == 0 ? '#ff8ab8' : '#ffb3d1'; rr(g, -15, -22, 30, 22, 6); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; for (let k = -12; k < 15; k += 8) { g.beginPath(); g.moveTo(k, -22); g.lineTo(k + 6, 0); g.stroke(); }
    if (b.br == 1 || lv >= 2) { g.fillStyle = '#fff'; for (let k = -14; k <= 14; k += 7) { g.beginPath(); g.moveTo(k - 3, -22); g.lineTo(k, -29 - (b.br == 1 ? 4 : 0)); g.lineTo(k + 3, -22); g.fill(); } } g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-14, 3, 28, 3); g.fillStyle = '#7fe08a'; g.fillRect(-14, 3, 28*hp, 3); }
  else { const isM = T2 == 'melee'; g.fillStyle = th.wall; rr(g, -15, -20, 30, 20, 3); g.fill(); g.fillStyle = isM ? '#c8102e' : '#2f5fd0'; g.beginPath(); g.moveTo(-18, -20); g.lineTo(0, -32 - lv*2); g.lineTo(18, -20); g.fill(); g.fillStyle = '#5a2a14'; rr(g, -4, -10, 8, 10, 3); g.fill();
    g.strokeStyle = '#8a5a2a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(14, -20); g.lineTo(14, -40); g.stroke(); g.fillStyle = isM ? '#ff5f9e' : '#5fc8ff'; g.beginPath(); g.moveTo(14, -40); g.lineTo(24, -36); g.lineTo(14, -32); g.fill(); if (isM) { g.strokeStyle = '#ddd'; g.lineWidth = 2; g.beginPath(); g.moveTo(-8, -26); g.lineTo(-2, -14); g.moveTo(-2, -26); g.lineTo(-8, -14); g.stroke(); } else { g.strokeStyle = '#ddd'; g.lineWidth = 1.5; g.beginPath(); g.arc(-6, -20, 5, -1.2, 1.2); g.stroke(); } }
  // level pips
  for (let k = 0; k < lv; k++) circ(g, -10 + k*7, 8, 2.5, k >= 3 ? '#F9BF01' : '#fff');
  g.restore(); if (b.hp < bMaxHP(b) && !BT[b.t].gate) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 14, y + 14, 28, 3); g.fillStyle = '#7fe08a'; g.fillRect(x - 14, y + 14, 28*clamp(b.hp/bMaxHP(b), 0, 1), 3); } if (b.jam > 0) { g.fillStyle = 'rgba(160,40,110,.5)'; g.beginPath(); g.arc(x, y - 10, 18, 0, TAU); g.fill(); } };
// the Broccoli Army
const drawEnemy = e => { const x = e.x, y = e.y, bob = Math.sin(e.walk)*1.5, E = EN[e.k]; if (e === boss) return drawBoss(e); g.save(); if (e.flash > 0) g.globalAlpha = .6; if (e.freeze > 0) { g.fillStyle = 'rgba(190,240,255,.7)'; g.beginPath(); g.arc(x, y - 6, E.r + 5, 0, TAU); g.fill(); }
  shadow(g, x, y + E.r*.8, E.r);
  const legs = () => { g.strokeStyle = '#3a6a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 4 - bob, y + 7); g.moveTo(x + 3, y); g.lineTo(x + 4 + bob, y + 7); g.stroke(); };
  const eyes = (ey, angry) => { circ(g, x - 3, ey, 2.2, '#fff'); circ(g, x + 3, ey, 2.2, '#fff'); circ(g, x - 3, ey + .5, 1.1, '#14204a'); circ(g, x + 3, ey + .5, 1.1, '#14204a'); if (angry) { g.strokeStyle = '#14204a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 5, ey - 4); g.lineTo(x - 1, ey - 2.5); g.moveTo(x + 5, ey - 4); g.lineTo(x + 1, ey - 2.5); g.stroke(); } };
  if (e.k == 'foot') { legs(); g.fillStyle = '#7fbf4a'; g.fillRect(x - 3, y - 8 + bob, 6, 9); for (const [ox, oy] of [[-6, -12], [0, -16], [6, -12], [-3, -18], [3, -18]]) circ(g, x + ox, y + oy + bob, 5, '#2f8f3f'); eyes(y - 6 + bob, 1); }
  else if (e.k == 'celery') { legs(); g.fillStyle = '#b8e07a'; rr(g, x - 3, y - 20 + bob, 6, 21, 3); g.fill(); for (const ox of [-4, 0, 4]) circ(g, x + ox, y - 22 + bob, 3, '#6ab04a'); eyes(y - 12 + bob, 1); g.strokeStyle = '#c8a070'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 7, y + 4); g.lineTo(x + 7, y - 24); g.stroke(); g.fillStyle = '#ddd'; g.beginPath(); g.moveTo(x + 5, y - 24); g.lineTo(x + 7, y - 30); g.lineTo(x + 9, y - 24); g.fill(); }
  else if (e.k == 'kale') { legs(); g.fillStyle = '#2f6f3f'; for (let k = 0; k < 7; k++) { const a = k/7*TAU; circ(g, x + Math.cos(a)*7, y - 9 + Math.sin(a)*6 + bob, 5, k % 2 ? '#2f6f3f' : '#3f8f4f'); } eyes(y - 10 + bob, 1); g.fillStyle = '#8a9ab0'; rr(g, x - 13, y - 14 + bob, 7, 14, 3); g.fill(); g.strokeStyle = '#c8d0dc'; g.lineWidth = 1.5; g.stroke(); }
  else if (e.k == 'spinach') { legs(); g.fillStyle = '#1f5f2f'; g.beginPath(); g.ellipse(x, y - 10 + bob, 13, 12, 0, 0, TAU); g.fill(); g.fillStyle = '#2f7f3f'; for (const ox of [-8, 8]) { g.beginPath(); g.ellipse(x + ox*1.3, y - 8 + bob, 5, 8, ox > 0 ? .5 : -.5, 0, TAU); g.fill(); } eyes(y - 12 + bob, 1); }
  else if (e.k == 'lettuce') { legs(); for (let k = 0; k < 6; k++) { const a = k/6*TAU + t; circ(g, x + Math.cos(a)*6, y - 9 + Math.sin(a)*5 + bob, 6, k % 2 ? '#b7e07a' : '#d4f09a'); } eyes(y - 9 + bob, 0); g.fillStyle = '#fff'; g.fillRect(x - 1, y - 24 + bob, 2, 6); g.fillRect(x - 3, y - 22 + bob, 6, 2); }
  else if (e.k == 'bomber') { legs(); circ(g, x, y - 7 + bob, 8, '#6a9f3a'); g.strokeStyle = '#4a7f2a'; g.lineWidth = 1; g.beginPath(); g.arc(x, y - 7 + bob, 5, 0, TAU); g.stroke(); eyes(y - 8 + bob, 1); g.strokeStyle = '#8a5a2a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y - 15 + bob); g.quadraticCurveTo(x + 4, y - 20, x + 2, y - 23); g.stroke(); circ(g, x + 2, y - 24, 2 + Math.random()*1.5, '#ffb347'); }
  else if (e.k == 'avocado') { g.fillStyle = '#3a5a1a'; g.beginPath(); g.ellipse(x, y - 12, 16, 19, 0, 0, TAU); g.fill(); g.fillStyle = '#c8e07a'; g.beginPath(); g.ellipse(x, y - 11, 11, 14, 0, 0, TAU); g.fill(); circ(g, x, y - 7, 6, '#8a5a2a'); eyes(y - 18, 1); g.fillStyle = '#5a6a3a'; rr(g, x - 16, y + 2, 32, 7, 3); g.fill(); }
  else if (e.k == 'carrot') { legs(); g.fillStyle = '#ff8a3c'; g.beginPath(); g.moveTo(x - 6, y - 16 + bob); g.lineTo(x + 6, y - 16 + bob); g.lineTo(x, y + 2); g.fill(); for (const ox of [-3, 0, 3]) { g.fillStyle = '#5fbf3f'; g.beginPath(); g.ellipse(x + ox, y - 20 + bob, 1.6, 4, ox*.15, 0, TAU); g.fill(); } eyes(y - 11 + bob, 1); g.strokeStyle = '#8a4be0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 8, y - 2); g.lineTo(x + 8, y - 20); g.stroke(); circ(g, x + 8, y - 21, 2.5, '#c88aff'); }
  if (e.stacks) { g.fillStyle = 'rgba(232,160,64,.75)'; g.beginPath(); g.ellipse(x, y + 6, E.r + 2, 4, 0, 0, TAU); g.fill(); } if (e.guard) { g.strokeStyle = 'rgba(255,230,120,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 8, E.r + 6, 0, TAU); g.stroke(); }
  if (e.hp < e.max) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 10, y - E.r - 20, 20, 3); g.fillStyle = '#ff5f5f'; g.fillRect(x - 10, y - E.r - 20, 20*clamp(e.hp/e.max, 0, 1), 3); } g.restore(); };
const drawBoss = B => { const x = B.x, y = B.y, r = B.r, k = B.bk, bob = Math.sin(t*3)*2; g.save(); if (B.flash > 0) g.globalAlpha = .7; shadow(g, x, y + r*.7, r*1.1);
  if (B.tell) { const T2 = B.tell, pr = 1 - Math.max(0, T2.t)/1.1; g.strokeStyle = 'rgba(255,60,60,.9)'; g.fillStyle = 'rgba(255,60,60,' + (.15 + .2*pr) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(T2.x, T2.y, T2.r || 30, 0, TAU); g.fill(); g.stroke(); if (T2.k == 'dash') { g.setLineDash([6, 6]); g.beginPath(); g.moveTo(x, y); g.lineTo(T2.x, T2.y); g.stroke(); g.setLineDash([]); } }
  const eyes = (ey, s2) => { for (const ox of [-r*.3, r*.3]) { circ(g, x + ox, ey, 4*s2, '#fff'); circ(g, x + ox, ey + 1, 2*s2, '#14204a'); } g.strokeStyle = '#14204a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - r*.5, ey - 7*s2); g.lineTo(x - r*.12, ey - 4*s2); g.moveTo(x + r*.5, ey - 7*s2); g.lineTo(x + r*.12, ey - 4*s2); g.stroke(); };
  const crown = (cy, s2, c) => { g.fillStyle = c || '#F9BF01'; g.beginPath(); g.moveTo(x - 12*s2, cy); g.lineTo(x - 12*s2, cy - 9*s2); g.lineTo(x - 6*s2, cy - 4*s2); g.lineTo(x, cy - 12*s2); g.lineTo(x + 6*s2, cy - 4*s2); g.lineTo(x + 12*s2, cy - 9*s2); g.lineTo(x + 12*s2, cy); g.fill(); };
  if (k == 'radish') { circ(g, x, y - r + bob, r, '#d8306a'); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y - 6 + bob, r*.7, r*.4, 0, 0, Math.PI); g.fill(); for (const ox of [-6, 0, 6]) { g.fillStyle = '#5fbf3f'; g.beginPath(); g.ellipse(x + ox, y - 2*r - 6 + bob, 3, 9, ox*.08, 0, TAU); g.fill(); } eyes(y - r + bob, 1); g.fillStyle = '#14204a'; g.fillRect(x - r*.7, y - r - 4 + bob, r*1.4, 5); }
  else if (k == 'cauli') { for (let i = 0; i < 9; i++) { const a = i/9*TAU; circ(g, x + Math.cos(a)*r*.55, y - r + Math.sin(a)*r*.45 + bob, r*.45, i % 2 ? '#f4f0e0' : '#e8e0c8'); } circ(g, x, y - r + bob, r*.5, '#f8f4e8'); g.fillStyle = '#5f9f3f'; g.beginPath(); g.ellipse(x, y - 4, r, r*.35, 0, 0, Math.PI); g.fill(); eyes(y - r + bob, 1.2); }
  else if (k == 'beet') { g.fillStyle = '#8a1a4a'; g.beginPath(); g.ellipse(x, y - r + bob, r, r*1.1, 0, 0, TAU); g.fill(); g.strokeStyle = '#c84a8a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - r + bob, r*.6, 0, TAU); g.stroke(); for (const ox of [-6, 6]) { g.fillStyle = '#4f9f3f'; g.beginPath(); g.ellipse(x + ox, y - 2*r - 8, 4, 10, ox*.1, 0, TAU); g.fill(); } eyes(y - r + bob, 1); g.fillStyle = '#14204a'; g.fillRect(x - 10, y - 2*r - 2, 20, 4); g.fillRect(x - 6, y - 2*r - 14, 12, 12); }
  else if (k == 'eggplant') { g.fillStyle = '#4a1a6a'; g.beginPath(); g.ellipse(x, y - r + bob, r*.8, r*1.25, 0, 0, TAU); g.fill(); g.fillStyle = '#3f8f3f'; g.beginPath(); g.moveTo(x - 10, y - 2*r - 4); g.lineTo(x, y - 2*r - 14); g.lineTo(x + 10, y - 2*r - 4); g.fill(); eyes(y - r - 4 + bob, 1); if (B.B.shield) { g.strokeStyle = 'rgba(200,140,255,' + (.4 + .2*Math.sin(t*4)) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(x, y - r, r*1.5, 0, TAU); g.stroke(); } g.strokeStyle = '#c88aff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + r + 4, y - 2*r); g.stroke(); circ(g, x + r + 4, y - 2*r - 3, 4, '#ff8aff'); }
  else if (k == 'pumpkin') { for (const ox of [-.5, 0, .5]) { g.fillStyle = ox ? '#e8701a' : '#ff8a2a'; g.beginPath(); g.ellipse(x + ox*r, y - r + bob, r*.6, r, 0, 0, TAU); g.fill(); } g.fillStyle = '#5a3a1a'; g.fillRect(x - 3, y - 2*r - 8, 6, 10); g.fillStyle = '#ffe066'; g.beginPath(); g.moveTo(x - 10, y - r - 6); g.lineTo(x - 4, y - r - 12); g.lineTo(x - 2, y - r - 4); g.fill(); g.beginPath(); g.moveTo(x + 10, y - r - 6); g.lineTo(x + 4, y - r - 12); g.lineTo(x + 2, y - r - 4); g.fill(); g.beginPath(); g.moveTo(x - 12, y - r + 6); g.lineTo(x + 12, y - r + 6); g.lineTo(x, y - r + 14); g.fill(); }
  else if (k == 'cabbage') { for (let i = 3; i >= 0; i--) circ(g, x, y - r + bob, r*(.5 + i*.17), ['#c8e8a0', '#a8d880', '#88c860', '#68b040'][i]); eyes(y - r + bob, 1.1); crown(y - 2*r - 2, 1.2, '#F9BF01'); if (enemies.some(o => o.guard && !o.dead)) { g.strokeStyle = 'rgba(255,230,120,.8)'; g.lineWidth = 4; g.beginPath(); g.arc(x, y - r, r*1.4, 0, TAU); g.stroke(); } }
  else if (k == 'artichoke') { for (let i = 0; i < 5; i++) { const yy = y - 4 - i*r*.38 + bob, w = r*(1 - i*.15); g.fillStyle = i % 2 ? '#6a9a4a' : '#5a8a3a'; g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - r*.6); g.lineTo(x + w, yy); g.fill(); } eyes(y - r*.9 + bob, 1); g.fillStyle = '#8a9ab0'; rr(g, x - r - 8, y - r, 10, r, 3); g.fill(); g.strokeStyle = '#c8ccd4'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + r + 2, y + 4); g.lineTo(x + r + 2, y - 2*r); g.stroke(); }
  else { // the Broccoli King
    g.fillStyle = '#7fbf4a'; g.fillRect(x - 8, y - r, 16, r); for (let i = 0; i < 11; i++) { const a = i/11*TAU; circ(g, x + Math.cos(a)*r*.75, y - r*1.4 + Math.sin(a)*r*.55 + bob, r*.42, i % 2 ? '#1f7f2f' : '#2f9f3f'); } circ(g, x, y - r*1.4 + bob, r*.5, '#2f8f3f'); eyes(y - r*1.3 + bob, 1.4); crown(y - r*2.1 + bob, 1.8);
    g.fillStyle = '#8a1a2a'; g.beginPath(); g.moveTo(x - r, y - r*.6); g.lineTo(x + r, y - r*.6); g.lineTo(x + r*1.1, y + 6); g.lineTo(x - r*1.1, y + 6); g.fill(); g.fillStyle = '#fff'; for (let i = -r; i <= r; i += 6) circ(g, x + i, y + 6, 2, '#fff'); }
  if (B.freeze > 0) { g.fillStyle = 'rgba(190,240,255,.45)'; g.beginPath(); g.arc(x, y - r, r*1.2, 0, TAU); g.fill(); } g.restore(); };
const drawTroop = q => { if (q.dead) return; const x = q.x, y = q.y, ty = q.ty, bob = Math.sin(q.walk)*1.2, th = themeOf(); g.save(); if (q.flash > 0) g.globalAlpha = .6; shadow(g, x, y + 7, 7);
  const n = ty.n; if (n.startsWith('Brown')) { g.fillStyle = '#b07a4a'; rr(g, x - 6, y - 12 + bob, 12, 12, 3); g.fill(); g.fillStyle = '#d8a070'; g.fillRect(x - 6, y - 12 + bob, 12, 3); }
  else if (n.startsWith('Gummy')) { g.fillStyle = 'rgba(255,90,140,.85)'; g.beginPath(); g.ellipse(x, y - 6 + bob, 7, 8, 0, 0, TAU); g.fill(); circ(g, x, y - 15 + bob, 5, 'rgba(255,90,140,.9)'); circ(g, x - 4, y - 19 + bob, 2, 'rgba(255,90,140,.9)'); circ(g, x + 4, y - 19 + bob, 2, 'rgba(255,90,140,.9)'); }
  else if (n.startsWith('Donut')) { circ(g, x, y - 8 + bob, 8, '#d8a060'); circ(g, x, y - 8 + bob, 7, '#ff8ab8'); circ(g, x, y - 8 + bob, 2.5, th.wall); g.fillStyle = '#c8ccd4'; g.fillRect(x - 5, y - 20 + bob, 10, 4); }
  else if (n.startsWith('Deep')) { g.fillStyle = '#f0c040'; rr(g, x - 9, y - 18 + bob, 18, 18, 4); g.fill(); g.fillStyle = '#d89a20'; g.fillRect(x - 9, y - 6 + bob, 18, 3); }
  else if (n.startsWith('Caramel')) { g.fillStyle = '#c87a2a'; rr(g, x - 8, y - 16 + bob, 16, 16, 6); g.fill(); g.fillStyle = 'rgba(255,220,160,.6)'; g.fillRect(x - 6, y - 14 + bob, 4, 10); }
  else if (n.startsWith('Sprinkle')) { g.fillStyle = '#fff'; rr(g, x - 4, y - 14 + bob, 8, 14, 4); g.fill(); g.fillStyle = '#ff5f9e'; g.fillRect(x - 2, y - 10 + bob, 4, 2); g.fillStyle = '#5fc8ff'; g.fillRect(x - 2, y - 6 + bob, 4, 2); }
  else if (n.startsWith('Candy Corn')) { g.fillStyle = '#ffe066'; g.beginPath(); g.moveTo(x - 6, y + bob); g.lineTo(x + 6, y + bob); g.lineTo(x, y - 16 + bob); g.fill(); g.fillStyle = '#ff8a3c'; g.fillRect(x - 4, y - 7 + bob, 8, 3); }
  else if (n.startsWith('Soda')) { g.fillStyle = '#5fc8ff'; rr(g, x - 5, y - 14 + bob, 10, 14, 3); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 5, y - 9 + bob, 10, 3); circ(g, x + Math.sin(t*6)*2, y - 18 + bob, 2, 'rgba(255,255,255,.8)'); }
  else if (n.startsWith('Cotton')) { for (const [ox, oy] of [[-4, -10], [4, -10], [0, -15]]) circ(g, x + ox, y + oy + bob, 5, '#ffc8ec'); g.fillStyle = '#fff'; g.fillRect(x - 1, y - 6 + bob, 2, 7); }
  else { g.fillStyle = '#4a2a14'; rr(g, x - 7, y - 14 + bob, 14, 14, 3); g.fill(); g.fillStyle = '#6a3a1a'; g.fillRect(x - 2, y - 20 + bob, 12, 5); }
  circ(g, x - 2, y - 9 + bob, 1.3, '#14204a'); circ(g, x + 2, y - 9 + bob, 1.3, '#14204a');
  if (q.hp < q.max) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 8, y - 26, 16, 2.5); g.fillStyle = '#7fe08a'; g.fillRect(x - 8, y - 26, 16*clamp(q.hp/q.max, 0, 1), 2.5); } g.restore(); };
// the hero: an evil sugar sorcerer (a sugar cube in a starry hat and cape) with a magic sugar wand
const drawHero = () => { const H = hero; if (H.dead) { const x = (KX + 2.5)*TS, y = (KY + .5)*TS; g.fillStyle = 'rgba(40,10,30,.7)'; g.beginPath(); g.arc(x, y - 20, 16, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '900 16px ' + FONT; g.textAlign = 'center'; g.fillText(Math.ceil(H.dead), x, y - 14); return; }
  const x = H.x, y = H.y, bob = Math.sin(H.walk)*1.5, W2 = wandStats(); if (!(cam.fit && low())) { g.strokeStyle = 'rgba(200,80,255,.22)'; g.setLineDash([5, 6]); g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, W2.rng, 0, TAU); g.stroke(); g.setLineDash([]); }
  if (H.inv > 0 && Math.sin(t*30) > 0) return; shadow(g, x, y + 10, 10); g.fillStyle = '#5a1a7a'; g.beginPath(); g.moveTo(x - 10, y - 6 + bob); g.lineTo(x + 10, y - 6 + bob); g.lineTo(x + 13, y + 9); g.lineTo(x - 13, y + 9); g.fill();
  g.fillStyle = '#fff'; rr(g, x - 9, y - 22 + bob, 18, 18, 3); g.fill(); g.strokeStyle = '#e8d8f0'; g.lineWidth = 1; g.stroke(); for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(220,220,240,.8)'; g.fillRect(x - 6 + (k*7) % 12, y - 19 + bob + (k*3) % 12, 2, 2); }
  circ(g, x - 3, y - 14 + bob, 1.8, '#14204a'); circ(g, x + 3, y - 14 + bob, 1.8, '#14204a'); g.strokeStyle = '#14204a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 4, y - 9 + bob); g.quadraticCurveTo(x, y - 7 + bob, x + 4, y - 10 + bob); g.stroke(); g.beginPath(); g.moveTo(x - 6, y - 18 + bob); g.lineTo(x - 1, y - 16 + bob); g.moveTo(x + 6, y - 18 + bob); g.lineTo(x + 1, y - 16 + bob); g.stroke();
  g.fillStyle = '#3a0a5a'; g.beginPath(); g.moveTo(x - 13, y - 22 + bob); g.lineTo(x + 13, y - 22 + bob); g.lineTo(x + 3, y - 42 + bob); g.fill(); circ(g, x + 4, y - 33 + bob, 2, '#F9BF01'); circ(g, x - 3, y - 27 + bob, 1.5, '#F9BF01');
  const a = H.aim != null ? H.aim : 0; g.strokeStyle = '#ff8ab8'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 8, y - 8 + bob); g.lineTo(x + 8 + Math.cos(a)*14, y - 8 + Math.sin(a)*14 + bob); g.stroke(); circ(g, x + 8 + Math.cos(a)*16, y - 8 + Math.sin(a)*16 + bob, 4, '#fff6a0');
  for (let k = 0; k < 3; k++) circ(g, x - 12 + k*12, y - 52, 5, k < Math.ceil(H.hp - 1e-6) ? '#ff5f9e' : 'rgba(0,0,0,.25)'); };
const drawShots = () => { for (const s2 of shots) { const c = {sprinkle:'#ff5f9e', gumball:'#5fc8ff', wand:'#e8a0ff', storm:'#fff6a0', carrot:'#ff8a3c', bolt:'#c88aff', fudge:'#5a2a14', troop:'#ffe066', fizz:'#9fe8ff', cotton:'#ffc8ec'}[s2.kind] || '#fff';
    if (s2.kind == 'sprinkle') { g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(s2.x, s2.y); g.lineTo(s2.x - 5, s2.y + 2); g.stroke(); } else circ(g, s2.x, s2.y, s2.kind == 'gumball' || s2.kind == 'fudge' ? 6 : s2.kind == 'wand' ? 4.5 : 3.5, c); } };
const drawFx = () => { for (const f of fx) { const a = Math.min(1, f.t*2); if (f.beam) { g.strokeStyle = f.col; g.globalAlpha = a; g.lineWidth = 4; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x2, f.y2); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); g.globalAlpha = 1; continue; }
    if (f.bolt) { g.strokeStyle = '#fff6ff'; g.lineWidth = 3; g.globalAlpha = a; g.beginPath(); g.moveTo(f.x, f.y - 120); g.lineTo(f.x + 8, f.y - 70); g.lineTo(f.x - 6, f.y - 40); g.lineTo(f.x, f.y); g.stroke(); g.globalAlpha = 1; continue; }
    if (f.ring) { g.strokeStyle = f.ring; g.globalAlpha = a*.8; g.lineWidth = 3; g.beginPath(); g.arc(f.x, f.y, f.r*(1.1 - f.t), 0, TAU); g.stroke(); g.globalAlpha = 1; continue; }
    if (f.txt) { g.globalAlpha = a; g.fillStyle = f.col; g.font = '900 12px ' + FONT; g.textAlign = 'center'; g.fillText(f.txt, f.x, f.y); g.globalAlpha = 1; continue; }
    g.globalAlpha = a; g.fillStyle = f.col; if (f.leaf) { g.save(); g.translate(f.x, f.y); g.rotate(f.t*8); g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, TAU); g.fill(); g.restore(); } else g.fillRect(f.x - 2, f.y - 2, 4, 4); g.globalAlpha = 1; } };
const draw = () => { const W0 = cv.width, H0 = cv.height; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#3a1030'; g.fillRect(0, 0, W0, H0); if (scr != 'play' && scr != 'won' && scr != 'lost') return; if (!L) return;
  g.setTransform(dpr*cam.z, 0, 0, dpr*cam.z, -cam.x*dpr*cam.z, -cam.y*dpr*cam.z);
  drawGround(); if (showGrid && FN) { g.font = '700 8px ' + FONT; g.textAlign = 'center'; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = FN[y*GW + x]; if (v >= 1e8) continue; g.fillStyle = 'rgba(40,0,60,.55)'; g.fillText(Math.round(v), (x + .5)*TS, (y + .5)*TS + 3); const st = nextStep({x:(x + .5)*TS, y:(y + .5)*TS}, false); if (st) { g.strokeStyle = 'rgba(80,0,120,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo((x + .5)*TS, (y + .5)*TS); g.lineTo((x + .5)*TS + (st[0] - x)*10, (y + .5)*TS + (st[1] - y)*10); g.stroke(); } } }
  // syrup puddles and rally points under everything
  R.spots.forEach((b, i) => { if (!b || b.rub) return; if (b.t == 'syrup' && b.pud) { g.fillStyle = b.br == 0 || S('frosted') ? 'rgba(170,220,255,.5)' : b.br == 1 ? 'rgba(220,110,40,.5)' : 'rgba(232,160,64,.45)'; g.beginPath(); g.ellipse(b.pud.x, b.pud.y, 46 + 6*b.lv, 30 + 4*b.lv, 0, 0, TAU); g.fill(); }
    if (BT[b.t].bar && panel && panel.i == i) { const rp = rallyOf(i); g.strokeStyle = '#ff5f9e'; g.lineWidth = 2; g.beginPath(); g.arc(rp.x, rp.y, 80, 0, TAU); g.stroke(); } });
  const ents = []; R.spots.forEach((b, i) => ents.push({y:L.spots[i].py + 12, d:() => drawBuilding(i)})); enemies.forEach(e => ents.push({y:e.y, d:() => drawEnemy(e)})); troops.forEach(q => ents.push({y:q.y, d:() => drawTroop(q)})); ents.push({y:(KY + 1.4)*TS, d:drawKeep}); ents.push({y:hero.y, d:drawHero});
  ents.sort((a, b) => a.y - b.y).forEach(e => e.d()); drawShots(); drawFx();
  // a selected spot's range
  if (panel && panel.i != null) { const b = bAt(panel.i), s2 = L.spots[panel.i]; if (b && !b.rub) { const st = bStats(b); if (st.rng) { g.strokeStyle = 'rgba(255,95,158,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(s2.px, s2.py, st.rng, 0, TAU); g.stroke(); } } }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  // boss bar, messages, achievements (screen space)
  if (boss) { const bw = Math.min(520, VWp - 40), bx = VWp/2 - bw/2, by = 58; g.fillStyle = 'rgba(30,10,20,.8)'; rr(g, bx - 6, by - 6, bw + 12, 32, 10); g.fill(); g.fillStyle = '#5a1a2a'; rr(g, bx, by, bw, 12, 6); g.fill(); g.fillStyle = '#7fe08a'; rr(g, bx, by, bw*clamp(boss.hp/boss.max, 0, 1), 12, 6); g.fill();
    for (let k = 1; k < boss.phases; k++) { g.fillStyle = '#fff'; g.fillRect(bx + bw*k/boss.phases - 1, by, 2, 12); } g.fillStyle = '#fff'; g.font = '900 11px ' + FONT; g.textAlign = 'center'; g.fillText(boss.n + ' · phase ' + boss.ph + '/' + boss.phases, VWp/2, by + 23); }
  floatT.forEach((f, i) => { const a = Math.min(1, f.t, (f.max - f.t)*4); g.globalAlpha = a; g.font = '800 14px ' + FONT; const w = g.measureText(f.m).width + 26; g.fillStyle = 'rgba(40,10,30,.85)'; rr(g, VWp/2 - w/2, VHp - 130 - i*38, w, 30, 15); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(f.m, VWp/2, VHp - 110 - i*38); g.globalAlpha = 1; });
  achQ.slice(0, 1).forEach(a => { g.globalAlpha = Math.min(1, a.t); g.fillStyle = 'rgba(40,10,30,.92)'; rr(g, VWp - 290, 60, 270, 54, 12); g.fill(); g.strokeStyle = '#F9BF01'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#F9BF01'; g.font = '900 11px ' + FONT; g.textAlign = 'left'; g.fillText('SUGAR SIEGE ACHIEVEMENT', VWp - 276, 80); g.fillStyle = '#fff'; g.font = '800 14px ' + FONT; g.fillText(a.n, VWp - 276, 100); g.globalAlpha = 1; });
  // touch joystick
  if (joy) { g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(joy.ox, joy.oy, 55, 0, TAU); g.fill(); const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d2 = Math.hypot(dx, dy), m = Math.min(d2, 55)/(d2 || 1); circ(g, joy.ox + dx*m, joy.oy + dy*m, 24, 'rgba(255,255,255,.75)'); }
  if (scr == 'play' && R.phase == 'build' && !panel && R.wave == 0 && R.t == 0) { const nar = VWp < 600, hw = nar ? VWp - 20 : 460, hy = nar ? 128 : 64; g.fillStyle = 'rgba(40,10,30,.75)'; rr(g, VWp/2 - hw/2, hy, hw, 44, 14); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px ' + FONT; g.textAlign = 'center'; g.fillText(nar ? 'Tap a dotted spot to build, then start the wave!' : 'Build on the dotted spots (walk to them and press E, or tap them), then start the wave!', VWp/2, hy + 27); } };

// =====================================================================================================
// UI (DOM): top bar, buttons, panels, map, results
// =====================================================================================================
const E = (tag, st, ...kids) => { const n = document.createElement(tag); if (st) Object.assign(n.style, st); kids.flat().forEach(c => { if (c == null || c === false) return; n.appendChild(typeof c == 'object' ? c : document.createTextNode(String(c))); }); return n; };
const B = (label, fn, st) => { const b = E('button', Object.assign({fontFamily:FONT, fontWeight:800, fontSize:'14px', border:'none', borderRadius:'999px', padding:'9px 16px', cursor:'pointer', background:'#ff5f9e', color:'#fff', touchAction:'manipulation'}, st || {}), label); b.onclick = e => { e.stopPropagation(); fn(); }; return b; };
const css = () => { if (document.getElementById('ss-css')) return; const s = document.createElement('style'); s.id = 'ss-css'; s.textContent = `
.ss-root{position:fixed;inset:0;z-index:99000;background:#3a1030;font-family:${FONT};color:#fff;user-select:none;-webkit-user-select:none;touch-action:none}
.ss-root button:disabled{opacity:.45;cursor:default}
.ss-bar{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;align-items:center;padding:8px 10px;background:linear-gradient(#5a1a4acc,#5a1a4a00);flex-wrap:wrap;z-index:2}
.ss-chip{background:rgba(40,10,30,.75);border-radius:999px;padding:6px 12px;font-weight:800;font-size:13px;white-space:nowrap}
.ss-modal{position:absolute;inset:0;background:rgba(30,6,24,.72);display:flex;align-items:center;justify-content:center;z-index:5;padding:10px;box-sizing:border-box}
.ss-card{background:#fff4f8;color:#3a1030;border-radius:20px;padding:16px;max-width:620px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 0 0 4px #ff5f9e,0 20px 60px rgba(0,0,0,.4);box-sizing:border-box}
.ss-row{display:flex;gap:10px;align-items:center;justify-content:space-between;background:#ffe3ee;border-radius:12px;padding:10px 12px;margin:6px 0;flex-wrap:wrap}
.ss-h{font-weight:900;font-size:22px;margin:0 0 4px}
.ss-s{font-weight:600;font-size:13px;color:#7a3a5a}
.ss-bot{position:absolute;right:10px;bottom:10px;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;z-index:2}
`; document.head.appendChild(s); };
const openPanel = p => { panel = p; renderUI(); }, closePanel = () => { panel = null; renderUI(); };
const renderUI = () => { if (!root) return; ui.top.innerHTML = ''; ui.bot.innerHTML = ''; ui.modal.innerHTML = ''; ui.modal.style.display = 'none'; ui.modal.style.background = '';
  const top = ui.top, bot = ui.bot; top.append(B('✕ Leave', () => SS.close(), {background:'rgba(40,10,30,.8)'}));
  if (scr == 'play') { const W = wavesOf(R.n); top.append(chip('◉ ' + fmt(R.coins) + ' Chocolate Coins'), chip('🏰 Keep ' + Math.ceil(R.keepHP) + '/' + keepMax()), chip('Wave ' + Math.min(W, R.wave + (R.phase == 'wave' ? 1 : 0)) + ' / ' + W), chip(L.name + ' · ' + R.diff[0].toUpperCase() + R.diff.slice(1)));
    if (R.phase == 'build') bot.append(B('▶ Start wave ' + (R.wave + 1) + ' (Space)', startWave, {fontSize:'16px', padding:'12px 22px', background:'#e4588f'}));
    bot.append(B('🏰 Keep (K)', () => openPanel({k:'keep'}), {background:'#7a2a5a'})); if (S('sorcery')) bot.append(B('✨ Storm (Q)', storm, {background:'#8a4be0'})); if (S('fudge')) bot.append(B('🍫 Flood (F)', fudgeFlood, {background:'#5a2a14'}));
    bot.append(B(cam.fit ? '🔍 Zoom in' : '🗺 Whole map', () => { cam.fit = !cam.fit; cam.z = cam.fit ? fitZ() : Math.max(fitZ()*1.6, 1); renderUI(); }, {background:'rgba(40,10,30,.8)'})); bot.append(B('⏸ (P)', () => openPanel({k:'pause'}), {background:'rgba(40,10,30,.8)'})); }
  else top.append(chip('Sugar Siege · total score ' + fmt(total())));
  if (scr == 'map') return mapUI(); if (scr == 'won' || scr == 'lost') return resultUI(); if (!panel) return;
  ui.modal.style.display = 'flex'; const c = E('div', {}); c.className = 'ss-card'; ui.modal.append(c); ui.modal.onclick = e => { if (e.target === ui.modal) closePanel(); };
  if (panel.k == 'spot') spotUI(c, panel.i); else if (panel.k == 'keep') keepUI(c); else if (panel.k == 'pause') pauseUI(c); else if (panel.k == 'spec') specUI(c, panel.lv); };
const chip = s2 => { const d = E('div', {}, s2); d.className = 'ss-chip'; return d; };
const row = (title, sub, btns) => { const r = E('div', {}); r.className = 'ss-row'; const l = E('div', {flex:'1 1 240px'}, E('div', {fontWeight:900, fontSize:'15px'}, title), E('div', {fontSize:'12px', fontWeight:600, color:'#7a3a5a'}, sub)); r.append(l, E('div', {display:'flex', gap:'6px', flexWrap:'wrap'}, btns)); return r; };
const head = (c, h, s2) => { const hh = E('div', {}, h); hh.className = 'ss-h'; const ss = E('div', {}, s2); ss.className = 'ss-s'; c.append(hh, ss); };
const statTxt = b => { const st = bStats(b); if (b.t == 'ginger') return 'Pays ' + Math.round([0, 25, 45, 75][b.lv]*(b.br == 0 ? 2.4 : b.br == 1 ? 1.6 : 1)*coinMul()) + ' coins after each wave it survives'; if (b.t == 'taffy') return 'Health ' + Math.ceil(b.hp) + '/' + bMaxHP(b) + (b.lv >= 2 || b.br == 1 ? ' · spikes hurt chewers' : '');
  if (BT[b.t].bar) { const ty = troopType(b); return squadSize(b) + ' × ' + ty.n + ' (' + Math.round(ty.hp*(S('licorice') ? 1.2 : 1)) + ' health, ' + ty.dmg + ' damage) · back 10 s after falling'; } if (b.t == 'syrup') return 'Slow stacks in its puddle' + (b.br == 0 || S('frosted') ? ' · freezes at 3 stacks' : '') + (b.br == 1 ? ' · burns' : '');
  return Math.round(st.dmg*10)/10 + ' damage · ' + Math.round(st.rate*10)/10 + '/s · range ' + Math.round(st.rng) + (st.splash ? ' · splash' : '') + (st.magic ? ' · magic (pierces armor)' : '') + (st.chain ? ' · chains' : '') + (st.multi ? ' · ×' + st.multi : ''); };
const spotUI = (c, i) => { const s2 = L.spots[i], b = bAt(i);
  if (!b) { head(c, s2.opts.length > 1 ? 'Choose a building' : 'Build here', s2.far ? 'This spot is a bit out of the way…' : s2.opts.length > 1 ? 'This spot lets you choose one of these:' : 'This spot is made for:');
    s2.opts.forEach(k => { const cst = Math.round(BT[k].cost[0]*costMul(k)); c.append(row(BT[k].n, BT[k].d, [B('Build · ' + cst + ' ◉', () => { build(i, k); closePanel(); }, {background:R.coins >= cst ? '#e4588f' : '#c8a0b0'})])); }); }
  else if (b.rub) { const cst = Math.round(spent(b)*.5); head(c, BT[b.t].n + ' · rubble', BT[b.t].gate ? 'Taffy Gates come back by themselves at the end of every round.' : 'Rebuild it as it was (level ' + b.lv + (b.br != null ? ', ' + BT[b.t].br[b.br].n : '') + ').'); if (!BT[b.t].gate) c.append(row('Rebuild', 'Half of what you spent on it', [B('Rebuild · ' + cst + ' ◉', () => { rebuild(i); closePanel(); })])); }
  else { const T2 = BT[b.t]; head(c, (b.br != null ? T2.br[b.br].n : T2.n) + ' · level ' + (b.lv + (b.br != null ? 1 : 0)), statTxt(b) + ' · health ' + Math.ceil(b.hp) + '/' + bMaxHP(b));
    const nc = nextCost(b); if (nc != null) c.append(row('Upgrade to level ' + (b.lv + 1), 'Stronger and looks fancier', [B('Upgrade · ' + nc + ' ◉', () => { upgrade(i); renderUI(); }, {background:R.coins >= nc ? '#e4588f' : '#c8a0b0'})]));
    else if (b.br == null) T2.br.forEach((br, k) => { const cst = Math.round(br.cost*costMul(b.t)); c.append(row('Level 4: ' + br.n, br.d, [B('Choose · ' + cst + ' ◉', () => { upgrade(i, k); renderUI(); }, {background:R.coins >= cst ? '#8a4be0' : '#c8a0b0'})])); });
    if (T2.bar) c.append(row('Move the troops', 'They guard the spot where your Sugar Sorcerer is standing (close to the barracks)', [B('Rally here', () => { const d2 = Math.hypot(hero.x - s2.px, hero.y - s2.py); if (d2 > 190) { say('Walk your Sugar Sorcerer closer to the barracks first'); sfx('bad'); return; } b.rally = {x:hero.x, y:hero.y}; sfx('blip'); save(); closePanel(); })]));
    c.append(row('Sell', 'Get back 60%', [B('Sell · ' + Math.round(spent(b)*.6) + ' ◉', () => { sell(i); closePanel(); }, {background:'#7a5a6a'})])); }
  c.append(E('div', {textAlign:'right', marginTop:'8px'}, B('Close', closePanel, {background:'#7a2a5a'}))); };
const keepUI = c => { const lv = R.keepLv; head(c, 'The Sugar Keep · level ' + lv + ' / 5', 'Health ' + Math.ceil(R.keepHP) + '/' + keepMax() + '. Every keep level makes the keep, your troops and your wand a bit stronger, and lets you pick a specialization.');
  if (lv < 5) { const cst = KEEP_COST[lv + 1]; c.append(row('Upgrade to keep level ' + (lv + 1), 'Choose one of 3 specializations (they stack with the ones you already picked)', [B('Upgrade · ' + fmt(cst) + ' ◉', () => { if (R.coins < cst) { sfx('bad'); say('Not enough Chocolate Coins'); return; } openPanel({k:'spec', lv:lv + 1}); }, {background:R.coins >= cst ? '#e4588f' : '#c8a0b0'})])); }
  const rep = Math.round(keepMax()*.25), rc = 60 + 20*R.n; if (R.keepHP < keepMax()) c.append(row('Patch the walls', 'Restore ' + rep + ' keep health', [B('Repair · ' + rc + ' ◉', () => { if (R.coins < rc) { sfx('bad'); return; } R.coins -= rc; R.keepHP = Math.min(keepMax(), R.keepHP + rep); sfx('coin'); save(); renderUI(); })]));
  [['d', 'Wand power', '+damage'], ['r', 'Wand reach', '+range'], ['s', 'Wand speed', '+fire rate']].forEach(([k, n, d]) => { const l2 = R.wand[k], cst = Math.round(80*Math.pow(1.7, l2)); c.append(row(n + ' · level ' + l2, d + (l2 >= 8 ? ' (max)' : ''), l2 >= 8 ? [] : [B(cst + ' ◉', () => { if (R.coins < cst) { sfx('bad'); return; } R.coins -= cst; R.wand[k]++; sfx('coin'); save(); renderUI(); })])); });
  const chosen = Object.keys(R.specs).map(l => SPECS[l].find(q => q.k == R.specs[l]).n); if (chosen.length) c.append(E('div', {fontSize:'13px', fontWeight:700, margin:'8px 0'}, 'Your specializations: ' + chosen.join(' · ')));
  c.append(E('div', {textAlign:'right', marginTop:'8px'}, B('Close', closePanel, {background:'#7a2a5a'}))); };
const specUI = (c, lv) => { head(c, 'Keep level ' + lv + ': choose a specialization', 'It changes how your keep and towers look and what they do. You keep every specialization you pick.');
  SPECS[lv].forEach(sp => c.append(row(sp.n, '✔ ' + sp.pro + (sp.con ? '  ✖ ' + sp.con : ''), [B('Choose · ' + fmt(KEEP_COST[lv]) + ' ◉', () => { if (R.coins < KEEP_COST[lv]) return; R.coins -= KEEP_COST[lv]; const old = keepMax(); R.keepLv = lv; R.specs[lv] = sp.k; R.keepHP += keepMax() - old;
    SV.specs[sp.k] = 1; if (Object.keys(SV.specs).length >= 12) ach('spec'); if (lv >= 5) ach('keep5'); R.spots.forEach((b, i) => { if (b && !b.rub) { b.hp = Math.min(bMaxHP(b), b.hp + 999); if (BT[b.t].bar) spawnTroopsFor(i, true); } }); sfx('win'); fxBurst((KX + .5)*TS, (KY - 1)*TS, 40, '#fff6a0'); save(); closePanel(); }, {background:'#8a4be0'})])));
  c.append(E('div', {textAlign:'right', marginTop:'8px'}, B('Not now', closePanel, {background:'#7a2a5a'}))); };
const pauseUI = c => { head(c, 'Paused', L.name + ' · wave ' + (R.wave + (R.phase == 'wave' ? 1 : 0)) + ' of ' + wavesOf(R.n));
  c.append(row('Keep playing', '', [B('Resume', closePanel)]), row('Back to the Sugar Map', 'Your run is saved: come back to it any time', [B('Map', () => { SV.run = R.phase == 'wave' && R.snap ? {...R.snap, reload:1} : {...R, snap:null}; save(); panel = null; scr = 'map'; mood(); renderUI(); }, {background:'#7a2a5a'})]),
    row('Give up this level', 'Ends the run (your best scores stay)', [B('Give up', () => { SV.run = null; save(); panel = null; scr = 'map'; mood(); renderUI(); }, {background:'#7a5a6a'})]));
  if (isAdmin()) { c.append(E('div', {fontWeight:900, marginTop:'12px'}, 'Admin (Sugar Siege only)'));
    const num = (ph, v) => { const n = E('input', {width:'80px', padding:'6px', borderRadius:'8px', border:'1px solid #c8a0b0', fontFamily:FONT}); n.type = 'number'; n.value = v; n.placeholder = ph; return n; };
    const nC = num('coins', 5000), nW = num('wave', 1), nK = num('keep', 5);
    c.append(row('Give Chocolate Coins', '', [nC, B('Give', () => { R.coins += +nC.value || 0; save(); renderUI(); })]), row('Skip to wave', '1 – ' + wavesOf(R.n), [nW, B('Go', () => { const w = clamp((+nW.value || 1) - 1, 0, wavesOf(R.n) - 1); enemies = []; spawnQ = []; boss = null; shots = []; R.wave = w; R.phase = 'build'; save(); closePanel(); })]),
      row('Hero invincible', heroGod ? 'ON' : 'OFF', [B(heroGod ? 'Turn off' : 'Turn on', () => { heroGod = !heroGod; renderUI(); })]), row('Show the pathfinding grid', showGrid ? 'ON' : 'OFF', [B(showGrid ? 'Hide' : 'Show', () => { showGrid = !showGrid; renderUI(); })]),
      row('Set keep level (1–5)', 'Then pick its specializations from the Keep panel', [nK, B('Set', () => { const v = clamp(+nK.value || 1, 1, 5); R.keepLv = 1; R.specs = {}; R.keepHP = keepMax(); for (let l = 2; l <= v; l++) { R.keepLv = l; R.specs[l] = SPECS[l][0].k; } R.keepHP = keepMax(); save(); renderUI(); })]));
    [2, 3, 4, 5].forEach(l => { if (R.keepLv >= l) c.append(row('Level ' + l + ' specialization', SPECS[l].find(q => q.k == R.specs[l]).n, SPECS[l].map(sp => B(sp.n.split(' ')[0], () => { R.specs[l] = sp.k; R.keepHP = Math.min(R.keepHP, keepMax()); R.spots.forEach((b, i) => { if (b && BT[b.t].bar) spawnTroopsFor(i, true); }); save(); renderUI(); }, {background:R.specs[l] == sp.k ? '#8a4be0' : '#c8a0b0', padding:'6px 10px', fontSize:'12px'})))); }); } };
const mapUI = () => { ui.modal.style.display = 'flex'; ui.modal.style.background = 'radial-gradient(circle at 30% 20%, #ffd6ec, #ff9ac8 60%, #c8408a)'; const c = E('div', {}); c.className = 'ss-card'; c.style.maxWidth = '980px'; ui.modal.append(c); ui.modal.onclick = null;
  head(c, 'Sugar Siege', 'You are the Evil Sugar. The Broccoli Army wants to turn the world into a salad. Defend the Sugar Keep across 24 levels! Total score: ' + fmt(total()) + ' (best possible ' + fmt(SCORE_MAX) + ').');
  const grid = E('div', {display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'8px', margin:'10px 0'}); c.append(grid);
  for (let n = 1; n <= LEVELS; n++) { const d = SV.done[n], ok = unlocked(n), cur = SV.run && SV.run.n == n; const card = E('button', {fontFamily:FONT, textAlign:'left', border:'none', borderRadius:'14px', padding:'10px', cursor:ok ? 'pointer' : 'default', background:d ? '#ffe066' : ok ? '#fff' : '#e8d0dc', color:'#3a1030', boxShadow:cur ? '0 0 0 3px #8a4be0' : 'none', opacity:ok ? 1 : .6},
      E('div', {fontWeight:900, fontSize:'13px'}, n + '. ' + LNAME[n - 1]), E('div', {fontSize:'11px', fontWeight:700, color:'#7a3a5a'}, !ok ? 'Locked: beat level ' + (n - 1) : d ? '★ ' + fmt(d.s) + ' · ' + d.d : cur ? 'Run in progress' : wavesOf(n) + ' waves' + (BOSSES[n] ? ' · boss!' : '') + ' · layout hidden'));
    card.onclick = e => { e.stopPropagation(); if (!ok) { sfx('bad'); return; } levelCard(n); }; grid.append(card); }
  const ach2 = E('div', {fontSize:'12px', fontWeight:700, marginTop:'8px'}, 'Achievements (' + Object.keys(SV.ach).length + '/' + ACH.length + '): ' + ACH.map(a => (SV.ach[a[0]] ? '★ ' : '☆ ') + a[1]).join(' · ')); c.append(ach2);
  const lb = E('div', {fontSize:'12px', fontWeight:700, marginTop:'8px'}, 'Leaderboard: loading…'); c.append(lb); try { const C = window.WLCloud; if (C && C.top) C.top('sugarsiege', 10).then(rows => { lb.textContent = 'Leaderboard: ' + (rows.length ? rows.map((r, i) => (i + 1) + '. ' + r.u + ' ' + fmt(r.s)).join(' · ') : 'no scores yet: be the first!'); }).catch(() => { lb.textContent = 'Leaderboard: sign in to the arcade to post your score.'; }); else lb.textContent = 'Leaderboard: sign in to the arcade to post your score.'; } catch (e) {}
  c.append(E('div', {fontSize:'11px', color:'#7a3a5a', marginTop:'8px'}, 'Sugar Siege is an extra: it gives no tickets, Golden Stars or prizes. Chocolate Coins stay in this game.')); };
const levelCard = n => { ui.modal.innerHTML = ''; const c = E('div', {}); c.className = 'ss-card'; ui.modal.append(c); const d = SV.done[n];
  head(c, n + '. ' + LNAME[n - 1], wavesOf(n) + ' waves' + (BOSSES[n] ? ' · boss: ' + BOSSES[n].n : '') + ' · par time ' + Math.round(parOf(n)/60) + ' min · the layout opens when you start.' + (d ? ' Best: ' + fmt(d.s) : ''));
  if (SV.run && SV.run.n != n) c.append(E('div', {fontSize:'12px', fontWeight:700, color:'#a0306a'}, 'Starting this level ends your run on level ' + SV.run.n + '.'));
  if (SV.run && SV.run.n == n) c.append(row('Continue your run', 'Wave ' + (SV.run.wave + 1) + ' · ' + fmt(SV.run.coins) + ' coins', [B('Continue', () => { const run = SV.run; startLevel(n, run.diff, run); })]));
  [['easy', 'Easy', 'More coins, softer waves'], ['normal', 'Normal', ''], ['hard', 'Hard', 'Fewer coins, tougher waves, more Broccoli Fields' + (n == 24 ? ', the King gets an extra phase' : '') + ' · ×1.5 score']].forEach(([k, nm, dd]) => c.append(row(nm, dd, [B('Start', () => { SV.run = null; startLevel(n, k); }, {background:k == 'hard' ? '#8a1a4a' : '#e4588f'})])));
  c.append(E('div', {textAlign:'right', marginTop:'8px'}, B('Back', () => renderUI(), {background:'#7a2a5a'}))); };
const resultUI = () => { ui.modal.style.display = 'flex'; const c = E('div', {}); c.className = 'ss-card'; ui.modal.append(c); ui.modal.onclick = null;
  if (scr == 'won') { const r2 = R.result; head(c, '🏆 ' + L.name + ' is safe!', 'The Broccoli Army wilts away. Score ' + fmt(r2.s) + ' (best ' + fmt(r2.best) + ') · ' + r2.W + ' waves · keep ' + Math.round(r2.keepF*100) + '% · speed bonus ' + fmt(r2.speed));
    if (R.n < LEVELS) c.append(row('Next level', (R.n + 1) + '. ' + LNAME[R.n], [B('Go', () => { scr = 'map'; renderUI(); levelCard(R.n + 1); })])); else c.append(E('div', {fontWeight:900, margin:'8px 0'}, 'THE BROCCOLI KING IS DEFEATED. The world stays deliciously unhealthy forever!')); }
  else head(c, 'The Sugar Keep has fallen…', 'The Broccoli Army made a salad. Try again: more towers near the narrow spots, and upgrade the keep!');
  c.append(E('div', {textAlign:'right', marginTop:'8px'}, B('Sugar Map', () => { scr = 'map'; mood(); renderUI(); }, {background:'#7a2a5a'}))); };

// =====================================================================================================
// INPUT, LOOP, OPEN/CLOSE
// =====================================================================================================
const fitZ = () => Math.min(VWp/WW, Math.max(.2, VHp - 108)/WH);   // the whole map between the top bar and the buttons
const resize = () => { dpr = Math.min(2, window.devicePixelRatio || 1); VWp = window.innerWidth; VHp = window.innerHeight; cv.width = Math.round(VWp*dpr); cv.height = Math.round(VHp*dpr); cv.style.width = VWp + 'px'; cv.style.height = VHp + 'px'; if (cam.fit || cam.z < fitZ()) cam.z = fitZ(); };
const toWorld = (sx, sy) => ({x:sx/cam.z + cam.x, y:sy/cam.z + cam.y});
const spotAt = (wx, wy) => L.spots.findIndex(s2 => Math.abs(s2.px - wx) < 22 && Math.abs(s2.py - wy) < 26);
const tapAt = (sx, sy) => { if (scr != 'play' || panel) return; const w = toWorld(sx, sy), i = spotAt(w.x, w.y); if (i >= 0) { openPanel({k:'spot', i}); sfx('blip'); } };
const onKey = e => { if (!root) return; const k = e.key; if (!/^F\d+$/.test(k)) { e.stopPropagation(); if (k.startsWith('Arrow') || k == ' ') e.preventDefault(); }   // the arcade behind us never sees these keys
  if (e.type == 'keyup') { keys[k] = false; return; } keys[k] = true; if (scr != 'play') { if (k == 'Escape') SS.close(); return; }
  if (panel) { if (k == 'Escape' || k == 'e' || k == 'E' || k == 'p' || k == 'P' || k == 'k' || k == 'K') closePanel(); return; }
  if (k == ' ') startWave(); else if (k == 'k' || k == 'K') openPanel({k:'keep'}); else if (k == 'p' || k == 'P' || k == 'Escape') openPanel({k:'pause'}); else if (k == 'q' || k == 'Q') storm(); else if (k == 'f' || k == 'F') fudgeFlood(); else if ((k == 'g' || k == 'G') && isAdmin()) showGrid = !showGrid;
  else if (k == 'e' || k == 'E' || k == 'Enter') { let bi = -1, bd = 70; L.spots.forEach((s2, i) => { const d2 = Math.hypot(s2.px - hero.x, s2.py - hero.y); if (d2 < bd) { bd = d2; bi = i; } }); if (bi >= 0) openPanel({k:'spot', i:bi}); else say('Walk up to a building spot and press E'); }
  else if (k == '+' || k == '=') { cam.fit = false; cam.z = Math.min(3, cam.z*1.2); } else if (k == '-') { cam.z = Math.max(fitZ(), cam.z/1.2); if (cam.z <= fitZ() + .001) cam.fit = true; } };
const pdown = e => { if (e.target !== cv) return; e.preventDefault(); ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY, sx:e.clientX, sy:e.clientY, t:performance.now()});
  if (ptrs.size == 2) { const [a, b] = [...ptrs.values()]; pinch = {d:Math.hypot(a.x - b.x, a.y - b.y), z:cam.z}; joy = null; return; }
  if (e.pointerType != 'mouse' && e.clientX < VWp*.45 && scr == 'play' && !panel) joy = {id:e.pointerId, ox:e.clientX, oy:e.clientY, x:e.clientX, y:e.clientY, moved:false}; };
const pmove = e => { const p = ptrs.get(e.pointerId); if (!p) return; p.x = e.clientX; p.y = e.clientY; if (pinch && ptrs.size == 2) { const [a, b] = [...ptrs.values()], d2 = Math.hypot(a.x - b.x, a.y - b.y); cam.z = clamp(pinch.z*d2/pinch.d, fitZ(), 3); cam.fit = cam.z <= fitZ() + .001; return; }
  if (joy && joy.id == e.pointerId) { joy.x = e.clientX; joy.y = e.clientY; if (Math.hypot(joy.x - joy.ox, joy.y - joy.oy) > 12) joy.moved = true; } };
const pup = e => { const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!p) return; const moved = Math.hypot(p.x - p.sx, p.y - p.sy) > 12;
  if (joy && joy.id == e.pointerId) { const was = joy.moved; joy = null; if (was) return; } if (!moved && performance.now() - p.t < 450) tapAt(e.clientX, e.clientY); };
const wheel = e => { if (scr != 'play') return; e.preventDefault(); cam.z = clamp(cam.z*(e.deltaY < 0 ? 1.12 : 1/1.12), fitZ(), 3); cam.fit = cam.z <= fitZ() + .001; };
const loop = now => { raf = requestAnimationFrame(loop); if (document.hidden) { last = now; return; } const dt = Math.min(.05, (now - (last || now))/1000); last = now; try { update(dt); draw(); } catch (err) { console.error('[sugar siege]', err); } };
SS.open = a => { api = a || {}; if (root) return; load(); css(); root = E('div', {}); root.className = 'ss-root'; cv = E('canvas', {position:'absolute', inset:0}); g = cv.getContext('2d'); root.append(cv);
  ui.top = E('div', {}); ui.top.className = 'ss-bar'; ui.bot = E('div', {}); ui.bot.className = 'ss-bot'; ui.modal = E('div', {}); ui.modal.className = 'ss-modal'; root.append(ui.top, ui.bot, ui.modal); document.body.append(root);
  resize(); window.addEventListener('resize', resize); window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKey, true); cv.addEventListener('pointerdown', pdown); window.addEventListener('pointermove', pmove); window.addEventListener('pointerup', pup); window.addEventListener('pointercancel', pup); cv.addEventListener('wheel', wheel, {passive:false});
  scr = 'map'; panel = null; mood(); renderUI(); if (SV.run) levelCard(SV.run.n); last = 0; raf = requestAnimationFrame(loop); };
SS.close = () => { if (!root) return; if (scr == 'play' && R) { SV.run = R.phase == 'wave' && R.snap ? {...R.snap, reload:1} : {...R, snap:null}; save(); } cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKey, true); window.removeEventListener('pointermove', pmove); window.removeEventListener('pointerup', pup); window.removeEventListener('pointercancel', pup);
  root.remove(); root = null; keys = {}; joy = null; try { window.WLMusic && window.WLMusic.mood('floor'); } catch (e) {} if (api && api.closed) api.closed(); };
SS._dbg = () => ({get L() { return L; }, get R() { return R; }, get SV() { return SV; }, get enemies() { return enemies; }, get troops() { return troops; }, get hero() { return hero; }, get boss() { return boss; }, update, startLevel, startWave, build, upgrade, spawnEnemy, spawnBoss, field, genLevel, tapAt, openPanel, panel:() => panel, scr:() => scr, FN:() => FN, SCORE_MAX, LV_MAX, wavesOf, setScr:v => { scr = v; renderUI(); }, renderUI, fudgeFlood, storm, keepMax, save, total});
})();
