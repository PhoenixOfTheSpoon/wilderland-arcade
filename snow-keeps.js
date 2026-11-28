// THE BURNING WINTER · part 5: KEEPS & OUTPOSTS (A.snowKeeps).
// 8 enemy keeps in the new regions, held by what is left of Dumpling's army (open to everyone right away).
// Assault: break the gate (or a cracked wall), topple 4 towers, free 3 prisoners, then the Keep Lord (boss rules + Threat).
// Captured keeps become YOUR outposts: waystone, rest spot, upgrades (walls, turrets, frost cannon, garrison) for Frost Crystals.
// Counterattacks only happen while you play. After Lit's Chapter 5, five keeps are seized by the Kindled: SCORCHED KEEPS (endgame).
(function () {
const A = window.Arcade = window.Arcade || {}, TAU = Math.PI*2;
A.snowKeeps = (S, SG0) => {
  const {W, PERM, BOSS, LAIR, TS, p, T, M, N, REG, SOLID} = S, NAR = ['', 'snow'];
  const STUB = {cur:() => null, update:() => {}, things:() => {}, goal:() => null, drawWorld:() => {}, drawScreen:() => {}, bossReady:() => false, bossAI:() => {}, bossDown:() => {}, drawBoss:() => {}, portrait:() => false};
  const B0 = SG0 || STUB;
  const KD = [
    {id:'thorn', reg:'pinecrest', at:[58, 198], n:'Thornwood Keep', lord:'Warlord Barkscale', col:'#6a8a3a', sc:1},
    {id:'glass', reg:'mirrormere', at:[130, 150], n:'Glasswater Keep', lord:'Captain Glimmertail', col:'#5a9ab0'},
    {id:'cliff', reg:'northwatch', at:[205, 55], n:'Cliffside Hold', lord:'General Cragclaw', col:'#8a8e9a', sc:1},
    {id:'black', reg:'ravenwatch', at:[255, 122], n:'Blackfeather Keep', lord:'Warlord Duskscale', col:'#4a4a6a', sc:1},
    {id:'cinder', reg:'ember', at:[155, 186], n:'Cinderstone Keep', lord:'Warlord Ashtail', col:'#b0603a', sc:1},
    {id:'fang', reg:'tundra', at:[232, 182], n:'Frostfang Fort', lord:'Commander Frostback', col:'#7ab0d8', sc:1},
    {id:'mire', reg:'marsh', at:[55, 226], n:'Mirefort', lord:'Warlord Bogscale', col:'#5a6a4a'},
    {id:'iron', reg:'quarry', at:[128, 262], n:'Ironstone Keep', lord:'Foreman Flintclaw', col:'#9a7a5a'}];
  const POOLK = {pinecrest:['k_moth', 'k_wisp', 'k_imp'], northwatch:['k_bat', 'k_golem', 'k_hound'], ravenwatch:['k_wraith', 'k_bat', 'k_cult'], ember:['k_imp', 'k_hound', 'k_golem'], tundra:['k_wisp', 'k_hound', 'k_cult']};
  // ---------- save ----------
  const K = W.kp = Object.assign({v:1, k:{}, atkT:0, won:0}, W.kp || {});
  const ST = id => { let o = K.k[id]; if (!o) o = K.k[id] = {}; for (const [k, v] of Object.entries({g:0, wb:[0, 0], t:[0, 0, 0, 0], pr:[0, 0, 0], fo:0, cap:0, dmg:0, up:{w:0, t:0, c:0, g:0}, s:0})) if (o[k] == null) o[k] = v; return o; };   // same object every call
  KD.forEach(d => ST(d.id));
  const litCh = () => (W.lit && W.lit.on && W.lit.ch) | 0;
  const scorchOn = () => litCh() >= 6;
  // ---------- placement (deterministic: same spot every load) ----------
  const get = (x, y) => x < 0 || y < 0 || x >= N || y >= N ? T.ROCK : M[y*N + x], set = (x, y, v) => { if (x > 0 && y > 0 && x < N - 1 && y < N - 1) M[y*N + x] = v; };
  const bad = v => SOLID[v] || v == T.WATER || v == T.DEEP || v == T.HOLE;
  const EX = A.snowExp || {}, avoid = [...(S.chests || []).map(c => ({x:c.tx, y:c.ty, r:9, sq:1})), ...Object.values(S.WAYS).map(w => ({x:w.x, y:w.y, r:12})),
    ...(EX.NOTES || []).map(q => ({x:q.x, y:q.y, r:11})), ...(EX.VIEWS || []).map(q => ({x:q.x, y:q.y, r:11})), ...(EX.GATES || []).map(q => ({x:q.x, y:q.y, r:13})), ...Object.values(EX.VIL || {}).map(q => ({x:q.x, y:q.y, r:18})),
    ...[[190, 155], [175, 174], [186, 184], [166, 18], [101, 252], [84, 160], [42, 178], [28, 190], [214, 112], [200, 122], [196, 198]].map(q => ({x:q[0], y:q[1], r:12}))];
  const fits = (cx, cy, reg) => { if (cx < 10 || cy < 10 || cx > N - 11 || cy > N - 11) return false; if (avoid.some(a => (a.sq ? Math.max(Math.abs(a.x - cx), Math.abs(a.y - cy)) : Math.hypot(a.x - cx, a.y - cy)) < a.r)) return false;
    let wet = 0, ring = 0, ringOk = 0; for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) { const x = cx + dx, y = cy + dy, v = get(x, y); if (Math.max(Math.abs(dx), Math.abs(dy)) <= 8 && S.regionAt(x, y) != reg) return false;
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= 7) { if (v == T.WATER || v == T.DEEP) wet++; } else { ring++; if (!bad(v)) ringOk++; } }
    return wet < 20 && ringOk >= ring*.7; };
  const placed = [];
  KD.forEach(d => { let at = null; for (let r = 0; r <= 30 && !at; r++) for (let dy = -r; dy <= r && !at; dy++) for (let dx = -r; dx <= r && !at; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) != r) continue;
      const cx = d.at[0] + dx, cy = d.at[1] + dy; if (placed.some(q => Math.hypot(q.x - cx, q.y - cy) < 22)) continue; if (fits(cx, cy, d.reg)) at = {x:cx, y:cy}; }
    d.ok = !!at; if (!at) return; d.cx = at.x; d.cy = at.y; d.x = (at.x + .5)*TS; d.y = (at.y + .5)*TS; d.tier = Math.max(1, (REG[d.reg] || {}).tier || 1); placed.push(at); });
  const KS = KD.filter(d => d.ok);
  const scor = d => d.sc && scorchOn() && ST(d.id).s != 2;   // seized by the Kindled right now
  const held = d => { const s = ST(d.id); return scor(d) ? false : !!s.cap; };   // yours and working
  const stamp = d => { for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const m = Math.max(Math.abs(dx), Math.abs(dy)), x = d.cx + dx, y = d.cy + dy;
      if (m == 6) set(x, y, T.WALL); else if (m < 6) set(x, y, T.FLOOR); else if (bad(get(x, y)) || get(x, y) == T.HOUSE) set(x, y, T.PATH); } };
  const GATE = d => [-1, 0, 1].map(i => [d.cx + i, d.cy + 6]), CRACK = (d, i) => [-1, 0, 1].map(j => [d.cx + (i ? 6 : -6), d.cy + j]);
  const TOW = d => [[-6, -6], [6, -6], [-6, 6], [6, 6]].map(q => ({x:(d.cx + q[0] + .5)*TS, y:(d.cy + q[1] + .5)*TS}));
  const CAGE = d => [[-3, -2], [3, -2], [0, -4]].map(q => ({x:(d.cx + q[0] + .5)*TS, y:(d.cy + q[1] + .5)*TS}));
  const open = d => { const s = ST(d.id), sz = scor(d), gOpen = sz ? s.g : (s.g || s.cap); GATE(d).forEach(q => set(q[0], q[1], gOpen ? T.FLOOR : T.WALL)); [0, 1].forEach(i => CRACK(d, i).forEach(q => set(q[0], q[1], s.wb[i] ? T.FLOOR : T.WALL)));
    for (let dy = -8; dy <= 8; dy += 2) for (let dx = -8; dx <= 8; dx += 2) S.repaint && S.repaint(d.cx + dx, d.cy + dy); };
  // seized keeps: reset the assault (upgrades are kept), once, only while you are far away
  const seize = d => { const s = ST(d.id); if (s.s) return; s.s = 1; s.g = 0; s.wb = [0, 0]; s.t = [0, 0, 0, 0]; s.pr = [0, 0, 0]; s.fo = 0; s.dmg = 0; delete W.ways['kp_' + d.id]; };
  const wayKey = d => 'kp_' + d.id;
  const syncWay = d => { const k = wayKey(d); if (held(d) && !ST(d.id).dmg) { S.WAYS[k] = {x:d.cx, y:d.cy + 3, n:d.n + ' (outpost)'}; W.ways[k] = 1; } else { delete S.WAYS[k]; delete W.ways[k]; } };
  KS.forEach(d => { if (scor(d) && Math.hypot(p.x - d.x, p.y - d.y) > 20*TS) seize(d); stamp(d); open(d); syncWay(d); });
  // ---------- live state (not saved: structure health refills after a reload, progress flags stay) ----------
  const sc = d => (1 + .3*(d.tier - 1))*S.tm('fhp')*(scor(d) ? 3 : 1);
  const RT = {}; const rt = d => RT[d.id] || (RT[d.id] = {gate:{hp:Math.ceil(40*sc(d))}, wb:[0, 1].map(() => ({hp:Math.ceil(55*sc(d))})), tw:[0, 1, 2, 3].map(i => ({hp:Math.ceil(18*sc(d)), cd:1 + i*.4})), sp:0, fires:null, def:{t:[0, 0, 0, 0], c:2, g:0}, trc:[]});
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const inside = d => Math.abs(p.x - d.x) < 5.5*TS && Math.abs(p.y - d.y) < 5.5*TS;
  const near = (d, r) => dist(p, d) < r*TS;
  const objs = d => { const s = ST(d.id), sz = scor(d), L = [{n:'🚪 Break the gate or a cracked wall', ok:!!(s.g || s.wb[0] || s.wb[1])}, {n:'🗼 Topple the towers', ok:s.t.every(Boolean), c:s.t.filter(Boolean).length + '/4'}, {n:'🔓 Free the prisoners', ok:s.pr.every(Boolean), c:s.pr.filter(Boolean).length + '/3'}];
    if (sz) L.push({n:'🔥 Put out the fires', ok:!!s.fo}); L.push({n:'👑 Defeat ' + (sz ? 'the Kindled Lord' : d.lord), ok:false}); return L; };
  const ready = d => objs(d).slice(0, -1).every(o => o.ok);
  const lordK = d => (scor(d) ? 'ks_' : 'kl_') + d.id;
  KS.forEach(d => { BOSS['kl_' + d.id] = {n:d.lord.toUpperCase(), hp:300 + 120*d.tier, r:30, phases:3, saga:1, brain:1, draw:1, wake:330, keep:d.id, intro:d.lord.split(' ').pop() + ': “The Little King fell, but his army NEVER surrenders!”'};
    if (d.sc) BOSS['ks_' + d.id] = {n:'THE KINDLED LORD OF ' + d.n.toUpperCase(), hp:30000, r:32, phases:4, saga:1, brain:1, draw:1, wake:330, keep:d.id, hot:1, intro:'Kindled Lord: “Lit gave this keep to US. It burns forever!”'};
    LAIR['kl_' + d.id] = {x:-1e6, y:-1e6}; if (d.sc) LAIR['ks_' + d.id] = {x:-1e6, y:-1e6}; });
  const isLord = B => !!(B && BOSS[B.k] && BOSS[B.k].keep);
  const KDB = id => KS.find(d => d.id == id);
  // ---------- structures take snowball hits (hook from the world's ball/wall check) ----------
  const hitPart = (d, b) => { const s = ST(d.id), R = rt(d), tx = Math.floor(b.x/TS), ty = Math.floor(b.y/TS), dmg = b.dmg || 1;
    const dent = (o, x, y, done) => { o.hp -= dmg; S.addNum(x, y - 20, '-' + Math.ceil(dmg), '#c08a4a'); S.splat(x, y, 4, '#b0a090'); if (o.hp <= 0) { done(); S.shakeV = Math.max(S.shakeV, 6); S.splat(x, y, 24, '#8a7a6a'); A.sfx && A.sfx('point'); open(d); S.save(); } };
    if (!held(d) || scor(d)) { if (ty == d.cy + 6 && Math.abs(tx - d.cx) <= 1 && !s.g) return dent(R.gate, b.x, b.y, () => { s.g = 1; S.say('🚪 The gate of ' + d.n + ' is down!', 2.4); });
      for (let i = 0; i < 2; i++) if (!s.wb[i] && tx == d.cx + (i ? 6 : -6) && Math.abs(ty - d.cy) <= 1) return dent(R.wb[i], b.x, b.y, () => { s.wb[i] = 1; S.say('🧱 You smashed through the cracked wall!', 2.4); });
      const T4 = TOW(d); for (let i = 0; i < 4; i++) if (!s.t[i] && Math.hypot(T4[i].x - b.x, T4[i].y - b.y) < TS*1.3) return dent(R.tw[i], T4[i].x, T4[i].y, () => { s.t[i] = 1; S.say('🗼 Tower down (' + s.t.filter(Boolean).length + '/4)', 2); }); } };
  const ballWall = b => { for (const d of KS) if (Math.abs(b.x - d.x) < 8*TS && Math.abs(b.y - d.y) < 8*TS) { hitPart(d, b); return true; } return B0.ballWall ? B0.ballWall(b) : false; };
  // ---------- the assault ----------
  const pool = d => scor(d) ? POOLK[d.reg] : (REG[d.reg] || {}).pool || ['goon'];
  const assault = (d, dt, F) => { const s = ST(d.id), R = rt(d), T4 = TOW(d);
    if (!R.sp && near(d, 14) && !S.boss) { R.sp = 1; const P = pool(d); for (let i = 0; i < 7; i++) { const a = i/7*TAU, rr = i < 4 ? 3*TS : 0, x = i < 4 ? d.x + Math.cos(a)*rr : d.x + (i - 5)*TS*1.5, y = i < 4 ? d.y + Math.sin(a)*rr : d.y + 8.5*TS; if (!S.solidAt(x, y)) S.spawnFoe(P[i % P.length], x, y); } }
    if (!S.dlg && near(d, 13)) for (let i = 0; i < 4; i++) { if (s.t[i]) continue; const w = R.tw[i]; w.cd -= dt; if (w.cd <= 0) { w.cd = scor(d) ? 1.3 : 1.9; const a = Math.atan2(p.y - T4[i].y, p.x - T4[i].x); S.shot({x:T4[i].x + Math.cos(a)*42, y:T4[i].y + Math.sin(a)*42}, a, 290, {col:scor(d) ? '#ff8a2a' : '#7a5a3a', r:7}); } }
    if (scor(d) && !s.fo && F && near(d, 18)) { if (!R.fires) { R.fires = []; for (let i = 0; i < 40 && R.fires.length < 7; i++) { const x = d.cx - 4 + Math.floor(Math.random()*9), y = d.cy - 4 + Math.floor(Math.random()*9); const f = F.ignite(x, y, {hp:6, life:999}); if (f) R.fires.push(f); } }
      else { const cur = new Set(F.fires()); if (R.fires.every(f => f.out || !cur.has(f))) { s.fo = 1; R.fires = null; S.say('🔥 The keep’s fires are out', 2); S.save(); } } } };
  // ---------- outposts: your defences ----------
  const COST = [60, 150, 350, 800, 1800], cost = (d, lv) => Math.round(COST[lv]*(1 + .25*(d.tier - 1)));
  const UPG = [{k:'w', e:'🧱', n:'Walls', d:lv => 'Outpost toughness in counterattacks: ' + (100 + 60*lv)}, {k:'t', e:'🗼', n:'Snow turrets', d:lv => lv ? lv + ' tower turret' + (lv > 1 ? 's' : '') + ' fire at enemies' : 'Turrets on the towers fire at enemies', max:4},
    {k:'c', e:'❄', n:'Frost cannon', d:lv => 'A big freezing blast every ' + (7 - .6*Math.max(1, lv)).toFixed(1) + ' s that slows enemies'}, {k:'g', e:'🧒', n:'Garrison', d:lv => lv ? lv + ' snowball fighter' + (lv > 1 ? 's' : '') + ' guard the gate' : 'Teammates guard the gate'}];
  const hostile = f => !f.dead && f.hp > 0 && S.FOE[f.k] && !S.FOE[f.k].peaceful;
  const defTick = (d, dt) => { const s = ST(d.id), R = rt(d), D = R.def, U = s.up, m = (1 + .3*(d.tier - 1))*S.tm('fhp'), T4 = TOW(d);
    const fire = (from, rng, dmg, col) => { const f = S.foes.filter(hostile).filter(q => dist(q, from) < rng).sort((a, b) => dist(a, from) - dist(b, from))[0]; if (!f) return false; R.trc.push({x:from.x, y:from.y, tx:f.x, ty:f.y, t:.25, col}); S.hurtFoe(f, dmg, {}); return true; };
    for (let i = 0; i < Math.min(4, U.t); i++) { D.t[i] -= dt; if (D.t[i] <= 0 && fire(T4[i], 430, 2*(1 + .5*U.t)*m, '#bfe8ff')) D.t[i] = 1.4 - .1*U.t; }
    if (U.c) { D.c -= dt; if (D.c <= 0) { const fs = S.foes.filter(hostile).filter(q => dist(q, d) < 560); if (fs.length) { D.c = 7 - .6*U.c; const tg = fs[Math.floor(Math.random()*fs.length)]; R.trc.push({x:d.x, y:d.y, tx:tg.x, ty:tg.y, t:.4, col:'#7ad8ff', boom:1});
          fs.filter(q => dist(q, tg) < 130).forEach(q => { S.hurtFoe(q, 3*(1 + .5*U.c)*m, {}); q.stun = Math.max(q.stun || 0, 1.2); }); S.splat(tg.x, tg.y, 20, '#cfefff'); } } }
    if (U.g) { D.g -= dt; if (D.g <= 0) { D.g = 1.6 - .15*U.g; for (let i = 0; i < U.g; i++) fire({x:d.x + (i - (U.g - 1)/2)*44, y:d.y + 7.6*TS}, 380, 1.5*(1 + .4*U.g)*m, '#ffffff'); } }
    R.trc = R.trc.filter(q => (q.t -= dt) > 0); };
  const upPanel = d => S.openPanelUI(() => { const s = ST(d.id); return {title:'🏰 ' + d.n + ' · your outpost', sub:'Upgrades help in counterattacks and fight anything that comes close. You have ' + A.fmt(PERM.frost) + ' 🔷.',
    rows:UPG.map(u => { const lv = s.up[u.k] | 0, mx = u.max || 5, c = lv < mx ? cost(d, lv) : 0; return {e:u.e, n:u.n + ' · level ' + lv + '/' + mx, d:u.d(lv), btn:lv < mx ? A.fmt(c) + ' 🔷' : 'MAX', ok:lv < mx && PERM.frost >= c,
      fn:() => { if (lv >= mx || PERM.frost < c) return; PERM.frost -= c; s.up[u.k] = lv + 1; A.sfx && A.sfx('coin'); S.say(u.e + ' ' + u.n + ' → level ' + (lv + 1), 1.8); S.save(); }}; })}; });
  // ---------- counterattacks (only while you play, never offline) ----------
  let atk = null;
  const atkTick = dt => { const mine = KS.filter(d => held(d) && !ST(d.id).dmg);
    if (!atk) { if (!mine.length || S.boss || S.dlg) return; K.atkT += dt; if (K.atkT < 600) return; K.atkT = Math.random()*240; startAtk(mine[Math.floor(Math.random()*mine.length)]); return; }
    const d = atk.d, s = ST(d.id); atk.t -= dt; const hereNow = near(d, 22);
    if (hereNow) { atk.seen = 1; atk.sp -= dt; if (atk.sp <= 0 && atk.left > 0) { atk.sp = 5; const P = pool(d), n = Math.min(atk.left, 3); for (let i = 0; i < n; i++) { const a = Math.random()*TAU, x = d.x + Math.cos(a)*10*TS, y = d.y + Math.sin(a)*10*TS; if (!S.solidAt(x, y)) { S.spawnFoe(P[Math.floor(Math.random()*P.length)], x, y); const f = S.foes[S.foes.length - 1]; if (f) f.kpa = 1; } } atk.left -= n; }
      for (const f of S.foes) if (f.kpa && hostile(f) && dist(f, d) < 3*TS) atk.hp -= dt*4; }
    const alive = S.foes.some(f => f.kpa && hostile(f));
    if (atk.hp <= 0) return endAtk(false);
    if (atk.t <= 0) { if (atk.seen) return endAtk(!alive || atk.hp > atk.max*.5); const def = s.up.w + s.up.t + s.up.c + s.up.g, pw = 2 + d.tier/2 + Math.random()*3; return endAtk(def >= pw); } };
  const startAtk = d => { const s = ST(d.id), mx = 100 + 60*s.up.w; atk = {d, t:75, hp:mx, max:mx, left:6 + d.tier*2, sp:0, seen:0}; S.say('⚔ COUNTERATTACK! Enemies are storming your outpost at ' + d.n + '! (75 s)', 4); A.sfx && A.sfx('bad'); };
  const endAtk = win => { const d = atk.d, s = ST(d.id); atk = null; S.foes.forEach(f => { if (f.kpa) f.kpa = 0; });
    if (win) { const n = 60 + 20*d.tier; S.give({frost:n}); K.won++; S.say('🛡 ' + d.n + ' held! +' + n + ' 🔷', 3); } else { s.dmg = 1; syncWay(d); S.say('💥 ' + d.n + ' was damaged! Its waystone is out until you clear the attackers there', 4); } S.save(); };
  const repairTick = d => { const s = ST(d.id), R = rt(d); if (!s.dmg || !near(d, 14)) return; if (!R.rep) { R.rep = 1; const P = pool(d); for (let i = 0; i < 5; i++) { const a = i/5*TAU, x = d.x + Math.cos(a)*3*TS, y = d.y + Math.sin(a)*3*TS; if (!S.solidAt(x, y)) { S.spawnFoe(P[i % P.length], x, y); const f = S.foes[S.foes.length - 1]; if (f) f.kpr = d.id; } } S.say('⚔ Clear the attackers out of ' + d.n, 2.4); return; }
    if (!S.foes.some(f => f.kpr == d.id && hostile(f))) { s.dmg = 0; R.rep = 0; syncWay(d); S.give({frost:30}); S.say('🛠 ' + d.n + ' is repaired! Waystone back on', 3); S.save(); } };
  // ---------- the Keep Lord (Dumpling's army) / the Kindled Lord ----------
  let hz = [], hsrc = null; const FX = () => S.fire && S.fire();
  const dropHeat = () => { const F = FX(); if (hsrc && F) { const i = F.heatSrc.indexOf(hsrc); if (i >= 0) F.heatSrc.splice(i, 1); } hsrc = null; };
  const lordAI = (B, dt, ph) => { const d = KDB(BOSS[B.k].keep), hot = BOSS[B.k].hot, F = FX(); if (!d) return;
    if (!B.li) { B.li = 1; B.a1 = 1.6; B.a2 = 4; B.a3 = 7; B.a4 = 12; B.a5 = 5; B.dir = 1; hz = []; dropHeat(); if (hot && F) { hsrc = {x:B.x, y:B.y, r:210, h:.4}; F.heatSrc.push(hsrc); } }
    if (hsrc) { hsrc.x = B.x; hsrc.y = B.y; } if (!dt) return; const sp = 1 + .2*(ph - 1), ang = Math.atan2(p.y - B.y, p.x - B.x); B.dir = Math.cos(ang) < 0 ? -1 : 1;
    const clamp = () => { B.x = Math.max(d.x - 5*TS, Math.min(d.x + 5*TS, B.x)); B.y = Math.max(d.y - 5*TS, Math.min(d.y + 5*TS, B.y)); };
    if (B.dash) { B.dash.t -= dt; B.x += Math.cos(B.dash.a)*640*dt; B.y += Math.sin(B.dash.a)*640*dt; clamp(); if (!B.dash.hit && dist(B, p) < B.r + 22) { B.dash.hit = 1; S.hurtMe(1); } if (B.dash.t <= 0) B.dash = null; return; }
    if (B.tel) { B.tel.t -= dt; if (B.tel.t <= 0) { B.dash = {a:B.tel.a, t:.45}; B.tel = null; } return; }
    const dd = dist(B, p); if (dd > 130) { B.x += Math.cos(ang)*105*sp*dt; B.y += Math.sin(ang)*105*sp*dt; clamp(); }
    B.a1 -= dt; if (B.a1 <= 0) { B.a1 = 2.4/sp; const n = 3 + ph; for (let i = 0; i < n; i++) S.shot(B, ang + (i - (n - 1)/2)*.22, 280, {col:hot ? '#ff8a2a' : d.col, r:8}); }
    B.a2 -= dt; if (B.a2 <= 0) { B.a2 = 6.5 - .5*ph; B.tel = {a:ang, t:.8}; }
    if (ph >= 2) { B.a3 -= dt; if (B.a3 <= 0) { B.a3 = 7.5; hz.push({c:1, x:B.x, y:B.y, r:170, w:1, wm:1, b:0}); } B.a4 -= dt; if (B.a4 <= 0) { B.a4 = 14; const P = pool(d); for (let i = 0; i < 2; i++) { const q = {x:B.x + (i ? 60 : -60), y:B.y + 40}; if (!S.solidAt(q.x, q.y)) S.spawnFoe(P[i % P.length], q.x, q.y); } } }
    if (ph >= 3) { B.a5 -= dt; if (B.a5 <= 0) { B.a5 = 5; for (let i = 0; i < 12; i++) S.shot(B, i/12*TAU + B.t, 220, {col:hot ? '#ffb04a' : '#ffffff', r:7}); } }
    if (hot) { B.a6 = (B.a6 == null ? 3 : B.a6) - dt; if (B.a6 <= 0) { B.a6 = 4.5 - .4*ph; for (let i = 0; i < 2 + ph; i++) { const a = Math.random()*TAU, r = i ? 80 + Math.random()*140 : 0; hz.push({c:1, x:p.x + Math.cos(a)*r, y:p.y + Math.sin(a)*r, r:62, w:1.1, wm:1.1, b:0, fire:1}); } } } };
  const hzTick = dt => { if (!isLord(S.boss)) { if (hz.length || hsrc) { hz = []; dropHeat(); } return; } const F = FX();
    for (const h of hz) { if (h.w > 0) { h.w -= dt; if (h.w <= 0) { h.b = .3; if (Math.hypot(p.x - h.x, p.y - h.y) < h.r) S.hurtMe(1); if (h.fire && F) F.ignite(Math.floor(h.x/TS), Math.floor(h.y/TS), {hp:2, life:6}); S.shakeV = Math.max(S.shakeV, 3); } } else h.b -= dt; }
    hz = hz.filter(h => h.w > 0 || h.b > 0); };
  const lordDown = B => { const d = KDB(BOSS[B.k].keep), s = ST(d.id), hot = BOSS[B.k].hot; hz = []; dropHeat(); S.splat(B.x, B.y, 40, hot ? '#ffb04a' : d.col); S.shakeV = 8; S.cheerT = 2.5; A.sfx && A.sfx('win');
    s.cap = 1; s.dmg = 0; if (hot) s.s = 2; open(d); syncWay(d); const it = S.give({frost:(hot ? 400 : 120) + 40*d.tier, flakes:(hot ? 30000 : 8000)*d.tier, xp:(hot ? 900 : 300)*d.tier, score:5000*d.tier, gear:hot ? 5 : 3});
    S.talk([hot ? [...NAR, 'The Kindled Lord collapses into a heap of cooling cinders. The fires of ' + d.n + ' go out one by one.', ''] : ['Keep Lord ' + d.lord, 'kl:' + d.id, 'Hssss… The Little King would be… disappointed. Take your keep, snowball thrower.', 'sad'],
      [...NAR, '🏰 ' + d.n + ' is YOUR OUTPOST now: its waystone works for fast travel, you can rest here, and you can buy defences with Frost Crystals.', '']]); S.save(); };
  // ---------- art ----------
  const drawGecko = (g, x, y, o) => { const s = o.s || 1, t = o.t || 0, col = o.col, hot = o.hot, dir = o.dir || 1; g.save(); g.translate(x, y); g.scale(dir*s, s);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0, 22, 46, 8, 0, 0, TAU); g.fill();
    const body = hot ? '#3a2018' : '#e8c66a', spot = hot ? '#ff7a2a' : '#5a3a1a', st = Math.sin(t*6)*3;
    g.fillStyle = body; g.beginPath(); g.moveTo(-30, 6); g.quadraticCurveTo(-58, 4, -66, -6 + st*.4); g.quadraticCurveTo(-60, 10, -30, 14); g.fill();   // tail
    [[-20, 1], [18, -1]].forEach(([lx, k]) => { g.fillStyle = body; g.fillRect(lx - 4 + k*st*.5, 10, 8, 12); g.fillRect(lx + 6 - k*st*.5, 10, 8, 12); });
    g.fillStyle = body; g.beginPath(); g.ellipse(0, 4, 34, 13, 0, 0, TAU); g.fill();
    g.fillStyle = spot; [[-18, 0], [-6, 6], [6, -2], [16, 5], [-26, 6]].forEach(q => { g.beginPath(); g.arc(q[0], q[1], 2.6, 0, TAU); g.fill(); });
    g.fillStyle = body; g.beginPath(); g.ellipse(34, -2, 15, 10, -.15, 0, TAU); g.fill();   // head
    g.fillStyle = '#14141a'; g.beginPath(); g.arc(40, -5, 2.6, 0, TAU); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(40, 3); g.quadraticCurveTo(46, 5, 49, 1); g.stroke();
    g.fillStyle = hot ? '#5a3a30' : '#9aa2ae'; g.beginPath(); g.ellipse(0, -6, 24, 10, 0, Math.PI, TAU); g.fill(); g.fillRect(-24, -7, 48, 5);   // armour
    if (hot) { g.strokeStyle = 'rgba(255,140,40,.85)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-14, -12); g.lineTo(-6, -6); g.lineTo(2, -13); g.moveTo(8, -10); g.lineTo(14, -5); g.stroke(); }
    g.fillStyle = hot ? '#4a2a20' : '#b8c0cc'; g.beginPath(); g.ellipse(32, -10, 12, 6, -.2, Math.PI, TAU); g.fill();   // helmet
    if (hot) { g.fillStyle = '#ff7a1a'; for (let i = 0; i < 3; i++) { const h = 10 + 4*Math.sin(t*8 + i); g.beginPath(); g.moveTo(26 + i*5, -14); g.quadraticCurveTo(28 + i*5, -14 - h, 30 + i*5, -14); g.fill(); } }
    else { g.fillStyle = col; g.beginPath(); g.ellipse(30, -18, 7, 4, -.6 + Math.sin(t*3)*.1, 0, TAU); g.fill(); }
    g.strokeStyle = '#5a4a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-14, -12); g.lineTo(-16, -44); g.stroke(); g.fillStyle = hot ? '#ff6a1a' : col; g.beginPath(); g.moveTo(-16, -44); g.lineTo(4 + Math.sin(t*4)*3, -40); g.lineTo(-16, -32); g.fill();   // banner
    g.restore(); };
  const drawKeep = (g, d, t) => { const s = ST(d.id), sz = scor(d), mine = held(d), T4 = TOW(d), lo = S.low();
    const stone = sz ? '#4a3a36' : mine ? '#a8b4c4' : '#7a7470', top = sz ? '#6a4a40' : mine ? '#cfd8e4' : '#9a948e';
    for (let i = 0; i < 4; i++) { const q = T4[i]; if (s.t[i] && !mine) { g.fillStyle = '#6a6460'; g.beginPath(); g.ellipse(q.x, q.y + 10, 22, 9, 0, 0, TAU); g.fill(); continue; }
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(q.x - 20, q.y + 14, 44, 10); g.fillStyle = stone; g.fillRect(q.x - 22, q.y - 34, 44, 56); g.fillStyle = top; for (let k = 0; k < 4; k++) g.fillRect(q.x - 22 + k*12, q.y - 42, 8, 9);
      g.fillStyle = '#20242c'; g.fillRect(q.x - 3, q.y - 22, 6, 12); if (mine) { g.fillStyle = '#64CDF5'; g.beginPath(); g.moveTo(q.x, q.y - 44); g.lineTo(q.x, q.y - 64); g.lineTo(q.x + 16, q.y - 58); g.lineTo(q.x, q.y - 52); g.fill(); } }
    const gx = d.x, gy = (d.cy + 6 + .5)*TS; if (!s.g && !(mine && !sz)) { g.fillStyle = sz ? '#3a2a24' : '#6a4a2a'; g.fillRect(gx - 1.5*TS, gy - TS/2 - 6, 3*TS, TS + 6); g.strokeStyle = '#2a1a10'; g.lineWidth = 3; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(gx - 1.5*TS + k*TS/2, gy - TS/2 - 6); g.lineTo(gx - 1.5*TS + k*TS/2, gy + TS/2); g.stroke(); }
      const R = RT[d.id]; if (R && R.gate.hp < 40*sc(d)) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(gx - 20, gy - 20); g.lineTo(gx + 4, gy); g.lineTo(gx - 8, gy + 16); g.stroke(); } }
    [0, 1].forEach(i => { if (s.wb[i]) return; const cx = (d.cx + (i ? 6 : -6) + .5)*TS; g.strokeStyle = 'rgba(40,30,20,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 8, d.y - 30); g.lineTo(cx + 6, d.y - 6); g.lineTo(cx - 6, d.y + 10); g.lineTo(cx + 8, d.y + 30); g.stroke(); });
    if (!mine || sz) CAGE(d).forEach((q, i) => { if (s.pr[i]) return; S.kid(q.x, q.y + 6, ['#ff9ad5', '#64CDF5', '#F9BF01'][i], {face:Math.PI/2}); g.strokeStyle = '#3a3a44'; g.lineWidth = 3; g.strokeRect(q.x - 20, q.y - 30, 40, 48); for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(q.x - 20 + k*10, q.y - 30); g.lineTo(q.x - 20 + k*10, q.y + 18); g.stroke(); } });
    const fl = sz ? '#ff6a1a' : mine ? '#64CDF5' : d.col; g.strokeStyle = '#5a4a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(d.x, d.y - 10); g.lineTo(d.x, d.y - 70); g.stroke(); g.fillStyle = fl; g.beginPath(); g.moveTo(d.x, d.y - 70); g.lineTo(d.x + 30 + Math.sin(t*3)*4, d.y - 62); g.lineTo(d.x, d.y - 52); g.fill();
    if (mine && !sz) { const U = s.up; for (let i = 0; i < U.g; i++) S.kid(d.x + (i - (U.g - 1)/2)*44, d.y + 7.6*TS, '#2fa8e0', {face:Math.PI/2}); if (U.c) { g.fillStyle = '#5a6a80'; g.beginPath(); g.arc(d.x + 70, d.y + 20, 16, 0, TAU); g.fill(); g.fillStyle = '#9fe8ff'; g.fillRect(d.x + 70, d.y + 14, 26, 12); }
      const R = RT[d.id]; if (R) for (const q of R.trc) { g.strokeStyle = q.col; g.globalAlpha = Math.min(1, q.t*4); g.lineWidth = q.boom ? 5 : 2; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.tx, q.ty); g.stroke(); g.globalAlpha = 1; } }
    if (sz && !lo) { g.fillStyle = 'rgba(255,90,20,.08)'; g.fillRect(d.x - 6.5*TS, d.y - 6.5*TS, 13*TS, 13*TS); } };
  // ---------- hooks ----------
  const KP = Object.create(B0), here = () => !B0.cur();
  let curK = null;
  Object.assign(KP, {
    ballWall,
    update:dt => { B0.update(dt); if (!here()) return; hzTick(dt); const F = FX(); curK = null;
      for (const d of KS) { const s = ST(d.id), far = !near(d, 30);
        if (d.sc && scorchOn() && !s.s && !near(d, 20)) { seize(d); delete RT[d.id]; open(d); syncWay(d); S.save(); }
        if (far) { if (RT[d.id]) RT[d.id].sp = 0; if (far && !near(d, 40)) continue; }
        if (!held(d)) { assault(d, dt, F); if (near(d, 12)) curK = d; } else { defTick(d, dt); repairTick(d); } }
      atkTick(dt); },
    things:L => { B0.things(L); if (!here()) return; for (const d of KS) { if (!near(d, 12)) continue; const s = ST(d.id);
        if (!held(d)) CAGE(d).forEach((q, i) => { if (!s.pr[i]) L.push({x:q.x, y:q.y + 30, n:'🔓 Free the prisoner', f:() => { s.pr[i] = 1; S.give({frost:10}); S.splat(q.x, q.y, 14, '#F9BF01'); S.say(['“Thank you! They locked us up for building snowmen on their road!”', '“Free! Go get that Keep Lord!”', '“I knew someone would come!”'][i] + ' (' + s.pr.filter(Boolean).length + '/3)', 2.6); S.save(); }}); });
        else if (!s.dmg) { L.push({x:d.x - 40, y:d.y + 50, n:'🏰 Outpost upgrades', f:() => upPanel(d)}); L.push({x:d.x + 50, y:d.y + 50, n:'🔥 Rest at the outpost', f:() => { if (S.boss) return S.say('Not during a boss fight!', 1.6); p.hp = p.max; S.say('🔥 You rest by the outpost fire. Hearts full!', 2); }}); } } },
    goal:() => { if (here() && atk) return {x:atk.d.x, y:atk.d.y, n:'⚔ Defend ' + atk.d.n + ' · ' + Math.ceil(atk.t) + ' s · outpost ' + Math.max(0, Math.ceil(atk.hp)) + '/' + atk.max}; return B0.goal(); },
    bossReady:k => { if (!BOSS[k] || !BOSS[k].keep) return B0.bossReady(k); const d = KDB(BOSS[k].keep); if (!d || !here() || held(d) || lordK(d) != k || !ready(d) || !inside(d)) return false; LAIR[k] = {x:d.x, y:d.y + 40}; return true; },
    bossAI:(B, dt, ph, ang, dd) => isLord(B) ? lordAI(B, dt, ph) : B0.bossAI(B, dt, ph, ang, dd),
    bossDown:B => isLord(B) ? lordDown(B) : B0.bossDown(B),
    drawBoss:B => { if (!isLord(B)) return B0.drawBoss(B); const d = KDB(BOSS[B.k].keep), g = S.g; if (B.flash > 0) g.globalAlpha = .6;
      if (B.tel) { g.save(); g.strokeStyle = 'rgba(255,80,40,.8)'; g.lineWidth = 10; g.globalAlpha = .4; g.beginPath(); g.moveTo(B.x, B.y); g.lineTo(B.x + Math.cos(B.tel.a)*290, B.y + Math.sin(B.tel.a)*290); g.stroke(); g.restore(); }
      drawGecko(g, B.x, B.y, {s:1.45, t:S.t, col:d.col, hot:BOSS[B.k].hot, dir:B.dir || 1}); g.globalAlpha = 1; },
    portrait:(who, x, y, mood) => { if (who.slice(0, 3) == 'kl:') { const d = KDB(who.slice(3)); drawGecko(S.g, x - 6, y + 8, {s:.7, t:S.t, col:d ? d.col : '#888'}); return true; } return B0.portrait(who, x, y, mood); },
    drawWorld:() => { B0.drawWorld(); if (!here()) return; const g = S.g, t = S.t; for (const d of KS) if (Math.abs(S.cam.x + S.VW/2 - d.x) < S.VW/2 + 9*TS && Math.abs(S.cam.y + S.VH/2 - d.y) < S.VH/2 + 9*TS) drawKeep(g, d, t);
      for (const h of hz) { g.save(); if (h.w > 0) { const k = 1 - h.w/h.wm; g.fillStyle = 'rgba(255,90,30,' + (.12 + .25*k) + ')'; g.strokeStyle = 'rgba(255,120,40,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); g.stroke(); } else { g.globalAlpha = h.b/.3; g.fillStyle = h.fire ? '#ffb04a' : '#e8e0d0'; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); } g.restore(); } },
    drawScreen:() => { B0.drawScreen(); if (!here()) return; const g = S.g, VW = S.VW;
      if (curK && !S.boss) { const d = curK, L = objs(d), sz = scor(d), w = 330, x0 = VW - w - 14, y0 = 232; g.fillStyle = 'rgba(10,16,36,.78)'; g.fillRect(x0, y0, w, 30 + L.length*20);
        g.textAlign = 'left'; g.font = 'bold 13px system-ui'; g.fillStyle = sz ? '#ff9a4a' : '#F9BF01'; g.fillText((sz ? '🔥 SCORCHED · ' : '🏰 ') + d.n, x0 + 10, y0 + 20); g.font = '12px system-ui';
        L.forEach((o, i) => { g.fillStyle = o.ok ? '#9fe8a0' : '#e8f4ff'; g.fillText((o.ok ? '✓ ' : '• ') + o.n + (o.c && !o.ok ? ' (' + o.c + ')' : ''), x0 + 10, y0 + 40 + i*20); }); }
      if (atk) { g.textAlign = 'center'; g.font = 'bold 13px system-ui'; g.fillStyle = '#ffb0a0'; g.fillText('⚔ Counterattack at ' + atk.d.n + ' · ' + Math.ceil(atk.t) + ' s', VW/2, 84); } },
    keepAdm:(c, v) => { const d = KS[Math.max(0, Math.min(KS.length - 1, (v | 0) - 1))];
      if (c == 'state') return {K, KS:KS.map(q => ({id:q.id, n:q.n, cx:q.cx, cy:q.cy, x:q.x, y:q.y, sc:!!q.sc, held:held(q), scor:scor(q), ready:ready(q), lord:lordK(q)})), atk:atk && {id:atk.d.id, t:atk.t, hp:atk.hp}, hz:hz.length};
      if (c == 'list') return S.say('Keeps: ' + KS.map((q, i) => (i + 1) + ' ' + q.n + (held(q) ? ' ✓' : scor(q) ? ' 🔥' : '')).join(' · '), 8);
      if (c == 'tp') { p.x = d.x; p.y = d.y + 9*TS; S.foes = []; return; }
      if (c == 'ready') { const s = ST(d.id); s.g = 1; s.t = [1, 1, 1, 1]; s.pr = [1, 1, 1]; s.fo = 1; open(d); S.save(); return S.say('Admin: ' + d.n + ' ready for its Lord', 2); }
      if (c == 'capture') { const s = ST(d.id); s.cap = 1; s.dmg = 0; if (scor(d)) s.s = 2; open(d); syncWay(d); S.save(); return S.say('Admin: ' + d.n + ' captured', 2); }
      if (c == 'reset') { K.k[d.id] = null; ST(d.id); delete RT[d.id]; open(d); syncWay(d); S.save(); return S.say('Admin: ' + d.n + ' reset', 2); }
      if (c == 'attack') { const m = KS.filter(q => held(q) && !ST(q.id).dmg); if (!m.length) return S.say('Admin: capture a keep first', 2); startAtk(m[0]); return; }
      if (c == 'reach') { const seen = new Uint8Array(N*N), q = [], s0 = {x:Math.floor(S.FIRE.x/TS), y:Math.floor(S.FIRE.y/TS) + 2}; q.push(s0.y*N + s0.x); seen[q[0]] = 1;
        while (q.length) { const i = q.pop(), x = i % N, y = (i - x)/N; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 1 || ny < 1 || nx >= N - 1 || ny >= N - 1) continue; const j = ny*N + nx; if (seen[j]) continue; const v = M[j]; if (SOLID[v] && v != T.GATE) continue; seen[j] = 1; q.push(j); } }
        return {chests:(S.chests || []).filter(c2 => !seen[c2.ty*N + c2.tx]).map(c2 => c2.id), keeps:KS.filter(q => !seen[(q.cy + 8)*N + q.cx]).map(q => q.id)}; } }});
  return KP;
};
})();
