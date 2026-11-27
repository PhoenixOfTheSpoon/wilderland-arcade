// Wilderland Arcade · THE DUMPLING SAGA, part 3: AFTER THE CREDITS.
// "Cat Gone Missing" (Oswald, Frostpine Village's cat) → the ritual in the Forbidden Temple → Dumpling's godlike form →
// 3 godlike "fake" fights (each unlocks a power) → THE GECKO GOD: 50 layered bars, 10 phases, story moments, checkpoints,
// the ending (Oswald comes home), the Gecko God Slayer title, the godlike set, a statue and a timed rematch with a leaderboard.
// Saved in PERM.ow.saga (post*). NOTHING resets.
(function(){
'use strict';
const A = window.Arcade; if (!A) return;
const SAGA = A.SAGA = A.SAGA || {}, TAU = Math.PI*2;
SAGA.postInit = api => {
  const {S, SG, SV} = api, {g, W, X, p, TS, BOSS, LAIR} = S, A2 = S.A, SC = S.SC;
  SV.ps = SV.ps|0; SV.postUnlock = SV.postUnlock || {}; SV.flags = SV.flags || {};
  const PW = SAGA.pw = {};   // live powers for the movement code (flight, time-slow, reversed gravity, pulls)
  const NAR = ['', 'none'], DUMQ = ['Dumpling', 'dump'], GODQ = ['Dumpling, Unsealed', 'dumpG'], NELLQ = ['Nell the Baker', 'kid:Nell'], OSWQ = ['Oswald', 'oswald'], MAUQ = S.MAUF, BAUQ = S.BAUF, LOKQ = ['Loki', 'loki'], PELLQ = ['Archivist Pell', 'owl'];
  const T = (x, y) => ({x:(x + .5)*TS, y:(y + .5)*TS});
  const findSpot = (tx, ty) => { for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const v = S.tileAt(tx + dx, ty + dy); if (!S.SOLID[v] && v != S.T.HOLE && v != S.T.WATER) return T(tx + dx, ty + dy); } return T(tx, ty); };
  // ---------- places in Frostpine Village (main world) ----------
  const NELL = findSpot(31, 113), NOTICE = findSpot(26, 111), CLUES = [{at:findSpot(23, 118), e:'🥣', n:'Oswald’s empty food bowl', line:'Still full. Oswald NEVER leaves food. Something is wrong.'}, {at:findSpot(35, 107), e:'🚪', n:'a scratched door', line:'Tiny claw marks… and tiny STICKY toe prints next to them.'}, {at:findSpot(29, 121), e:'🐾', n:'fresh paw prints', line:'Paw prints, heading south-east toward the coast. Running.'}];
  const TRAIL = [[34, 122], [40, 124], [47, 126], [54, 129], [61, 132], [66, 134]].map(([x, y]) => findSpot(x, y));
  const PEOPLE = [{at:findSpot(21, 107), who:['Bram the Woodcutter', 'kid:Bram'], line:'I saw Oswald chasing a glowing green ball of light toward the shore. Since when do lights run?'}, {at:findSpot(37, 116), who:['Ivy the Fisher', 'kid:Ivy'], line:'Last night the sea froze for a moment. Just one moment. Then a little crowned shadow walked across it.'}, {at:findSpot(26, 123), who:['Old Gus', 'kid:Gus'], line:'The Forbidden Temple. Grandma said: if the cat goes missing, the seal is breaking. I thought it was just a story.'}];
  const FRAGS = [[63, 131], [67, 136], [70, 132]].map(([x, y]) => findSpot(x, y));
  // ---------- the post-game steps ----------
  const PS = [
    {k:'talk', at:NELL, who:NELLQ, g:'Someone in Frostpine Village is worried', lines:[[...NELLQ, 'Hero! Have you seen Oswald? Grey cat, white socks, VERY round? He’s been gone since the night the sky went quiet.', 'sad'], [...NELLQ, 'Everyone in the village knows him. He visits every kitchen. Please, will you help me look?', 'sad'], [...MAUQ, 'A missing cat is a ROYAL GUARD emergency. We’re on it.', 'happy']]},
    {k:'clues', g:'Search Frostpine Village for clues'},
    {k:'trail', g:'Follow Oswald’s paw prints'},
    {k:'people', g:'Ask the villagers what they saw'},
    {k:'frags', g:'Strange gecko tracks… and glowing seal fragments on the shore'},
    {k:'travel', r:'forbidden', g:'Travel to the Forbidden Temple (Expedition Board)', unlock:'forbidden'},
    {k:'ritual', r:'forbidden', g:'Stop the ritual in the heart of the temple'},
    {k:'god', r:'forbidden', n:1, g:'Survive Dumpling, Unsealed · the Shattered Temple'},
    {k:'travel', r:'above', g:'Follow him into the Sky Above', unlock:'above'},
    {k:'god', r:'above', n:2, g:'Survive Dumpling, Unsealed · the Sky Above the Kingdom'},
    {k:'travel', r:'void', g:'Follow him into the Frozen Void', unlock:'void'},
    {k:'god', r:'void', n:3, g:'Survive Dumpling, Unsealed · the Frozen Void'},
    {k:'final', r:'void', g:'Face the GECKO GOD above the clouds'},
    {k:'home', g:'Bring Oswald home to Nell in Frostpine Village'}];
  const pstep = () => PS[SV.ps];
  const padv = () => { SV.ps++; const s2 = pstep(); if (s2 && s2.unlock) SV.postUnlock[s2.unlock] = 1; if (s2) S.say('🐾 ' + s2.g, 3.4); S.save(); };
  const done = k => !!SV.flags[k];
  // ---------- bosses ----------
  const GODN = {1:{r:'forbidden', n:'DUMPLING, UNSEALED · THE SHATTERED TEMPLE', hp:3000, reward:'Seal-Breaker Snowballs', flag:'sealBalls', d:'Your snowballs now hurt gods (needed for the Gecko God).'},
    2:{r:'above', n:'DUMPLING, UNSEALED · THE SKY ABOVE', hp:3600, reward:'the Starlight Cloak', flag:'starCloak', d:'Gliding costs half the stamina, +30 stamina.'},
    3:{r:'void', n:'DUMPLING, UNSEALED · THE FROZEN VOID', hp:4200, reward:'Flight', flag:'flight', d:'Press X (or the ✨ button) to fly for 2.5 s: over gaps, cliffs and danger.'}};
  [1, 2, 3].forEach(n => { BOSS['god' + n] = {n:GODN[n].n, hp:GODN[n].hp, r:34, phases:4, saga:1, post:1, brain:1, bar:1, draw:1, wake:600, god:n}; });
  const LAYERS = 50, GPH = ['', 'Ice Meteors', 'Gravity Reversed', 'Frozen Time', 'Three of Me', 'Black Hole', 'Constellation Walk', 'Echoes of Every Fight', 'Godstorm', 'The Last Seal', 'Starfall'];
  BOSS.geckogod = {n:'THE GECKO GOD', hp:LAYERS*1500, r:40, phases:10, saga:1, post:1, brain:1, bar:3, draw:1, wake:700, gg:1};
  BOSS.geckogodR = {n:'THE GECKO GOD · REMATCH', hp:LAYERS*1000, r:40, phases:10, saga:1, post:1, brain:1, bar:3, draw:1, wake:700, gg:1, rematch:1};   // each of the 50 layers takes real work (was 240 / 160)
  Object.keys(BOSS).forEach(k => { if (BOSS[k].post && !LAIR[k]) LAIR[k] = {x:-1e6, y:-1e6}; });
  let rematch = null, gx = {hz:[], ghosts:[], copies:[], frozen:0, warn:null, shieldT:0, buffT:0, moments:{}, team:0, teamReady:false, flyCd:0, fill:0};
  const bossReady = (k, cur) => { const C = SG.C(); if (!C || !cur) return false; const s2 = pstep();
    if (k == 'geckogodR') { if (rematch && cur == 'void') { LAIR[k] = SG.W2T(C.lair); return true; } return false; }
    if (!s2) return false; if (s2.k == 'god' && k == 'god' + s2.n && cur == s2.r && !SV.flags[GODN[s2.n].flag]) { LAIR[k] = SG.W2T(C.lair); return true; }
    if (s2.k == 'final' && k == 'geckogod' && cur == 'void' && !SV.flags.godDown) { LAIR[k] = SG.W2T(C.lair); return true; } return false; };
  // ---------- godlike Dumpling: floating, glowing, a halo of ice, constellations, spectral tails, galaxy eyes ----------
  const drawGod = (x, y, s, o = {}) => { const t = S.t, lo = S.low(), fy = y + Math.sin(t*1.6)*6; g.save(); if (o.alpha != null) g.globalAlpha = o.alpha;
    if (!lo) { const gr = g.createRadialGradient(x, fy, 10, x, fy, 90*s); gr.addColorStop(0, 'rgba(180,160,255,.55)'); gr.addColorStop(1, 'rgba(120,100,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, fy, 90*s, 0, TAU); g.fill(); }
    const fl = o.flip ? -1 : 1; for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(190,220,255,' + (.35 - i*.08) + ')'; g.lineWidth = 8*s - i*2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 18*s*fl, fy); for (let k = 1; k <= 7; k++) g.lineTo(x - (18 + k*7)*s*fl, fy + Math.sin(t*2 + k*.8 + i*2)*5*s*(k/7) + (i - 1)*9*s*(k/7)); g.stroke(); }
    g.restore(); api.drawGecko(x, fy, {s, flip:o.flip, galaxy:1, col:'#a8c0f8', dark:'#2a2a6a', belly:'#e8f0ff', noSeal:1, noTail:1, mood:o.mood || 'smug', alpha:o.alpha});
    g.save(); if (o.alpha != null) g.globalAlpha = o.alpha; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; const st = [[-8, 0], [-2, 6], [6, 2], [10, 10], [-6, 12]]; g.beginPath(); st.forEach(([a, b], i) => { const px = x + a*s, py = fy + b*s; if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke(); st.forEach(([a, b]) => { g.beginPath(); g.arc(x + a*s, fy + b*s, 1.3*s/2 + 1, 0, TAU); g.fill(); });
    for (let i = 0; i < 8; i++) { const a = i/8*TAU + t*.8, hx = x + 24*s*fl + Math.cos(a)*16*s, hy = fy - 20*s + Math.sin(a)*5*s; g.fillStyle = '#d8f4ff'; g.beginPath(); g.moveTo(hx, hy - 5*s/2); g.lineTo(hx + 2*s/2, hy); g.lineTo(hx, hy + 5*s/2); g.lineTo(hx - 2*s/2, hy); g.fill(); } g.restore(); };
  const drawOswald = (x, y, o = {}) => SC.hcat(g, x, y, {fur:'#9aa0aa', belly:'#ffffff', stripe:'#6a707a', eye:'#F9BF01', seed:9, s:o.s || 1, ghost:o.ghost, glow:'#fff6c0', alpha:o.alpha}, S.t);
  // ---------- god-fight brains ----------
  const hz = gx.hz; const haz = (x, y, r, t, dmg, o = {}) => { if (hz.length < 40) hz.push({x, y, r, t, t0:t, dmg, ...o}); };
  const warnBanner = (txt, t) => { gx.warn = {txt, t}; A2.sfx('bad'); };
  const godAI = (B, dt, ph, ang, d) => { const n = BOSS[B.k].god || 3, gg = BOSS[B.k].gg, sp1 = 1 + .15*(ph - 1) + .1*n, D3 = A2.D(.85, 1, 1.2); B.t2 = (B.t2 || 0) + dt;
    if (!B.mus) { B.mus = 1; if (window.WLMusic && window.WLMusic.mood) try { window.WLMusic.mood(gg ? 'godchoir' : 'dump3'); } catch (e) {} }
    if (gg) return ggAI(B, dt, ph, ang, d);
    // floats and blinks across the arena
    B.mv = (B.mv || 0) - dt; if (B.mv <= 0) { B.mv = 2.2/sp1; const a = Math.random()*TAU, r = 60 + Math.random()*220; B.tx = B.hx + Math.cos(a)*r; B.ty = B.hy + Math.sin(a)*r; if (Math.random() < .3) { B.x = B.tx; B.y = B.ty; S.splat(B.x, B.y, 12, '#c9b0ff'); } }
    B.x += (B.tx - B.x)*Math.min(1, dt*2); B.y += (B.ty - B.y)*Math.min(1, dt*2);
    if (window.Arcade.dumpMech && window.Arcade.dumpMech.tick(B, dt, S, [['plates', 'beam'], ['pillars', 'zone'], ['shield', 'beam', 'zone']][n - 1])) return;
    // bullet hell: spiral arms + rings with gaps
    B.sp = (B.sp || 0) - dt; if (B.sp <= 0) { B.sp = .11/sp1; B.a = (B.a || 0) + .23; const arms = 2 + n + (ph >= 3 ? 1 : 0); for (let i = 0; i < arms; i++) S.shot(B, B.a + i*TAU/arms, 150*D3, {r:6, col:'#c9b0ff'}); }
    B.rg = (B.rg == null ? 2 : B.rg) - dt; if (B.rg <= 0) { B.rg = 3/sp1; const gap = Math.random()*TAU; for (let i = 0; i < 28; i++) { const a = i/28*TAU; if (Math.abs(((a - gap + Math.PI*3) % TAU) - Math.PI) < .45) continue; S.shot(B, a, 190*D3, {r:7, col:'#9fe8ff'}); } }
    // time slows (warned)
    B.ts = (B.ts == null ? 9 : B.ts) - dt; if (B.ts <= 0) { B.ts = 14/sp1; warnBanner('⏳ TIME SLOWS!', 1.6); setTimeout(() => { PW.slow = .45; setTimeout(() => { PW.slow = 1; }, 3200); }, 1600); }
    // arena-wide freeze: get into a glowing safe circle
    // Arena Freeze and Starfall never overlap, and safe circles are never inside a Starfall
    const koOn = () => hz.some(h => h.ko && h.t > 0), fzOn = () => hz.some(h => h.freeze && h.t > 0);
    if (ph >= 2) { B.fz = (B.fz == null ? 6 : B.fz) - dt; if (B.fz <= 0 && koOn()) B.fz = .5; if (B.fz <= 0) { B.fz = 16/sp1; B.ko = Math.max(B.ko || 0, 4); warnBanner('❄ ARENA FREEZE! Stand in a glowing circle!', 2.6); const kos = hz.filter(h => h.ko); const safes = [0, 1, 2].map(i => { let q = null; for (let tr = 0; tr < 30; tr++) { const a = Math.random()*TAU, r = 120 + Math.random()*160; q = {x:B.hx + Math.cos(a)*r, y:B.hy + Math.sin(a)*r}; if (!kos.some(h => Math.hypot(q.x - h.x, q.y - h.y) < h.r + 60)) break; } return q; }); safes.forEach(q => haz(q.x, q.y, 54, 2.6, 0, {safe:1})); haz(B.hx, B.hy, 9999, 2.6, 3, {freeze:1, safes}); } }
    // instant knockout (huge warning)
    if (ph >= 3) { B.ko = (B.ko == null ? 8 : B.ko) - dt; if (B.ko <= 0 && fzOn()) B.ko = .5; if (B.ko <= 0) { B.ko = 20/sp1; B.fz = Math.max(B.fz || 0, 4); warnBanner('☠ STARFALL! GET OUT OF THE RED!', 3); haz(B.x, B.y, 300, 3, 999, {ko:1}); } }
    if (d < B.r + 14) S.hurtMe(2); };
  // the GECKO GOD: 50 layers, 10 phases
  const arenaPts = (B, R2) => { const out = []; for (let i = 0; i < 7; i++) { const a = i/7*TAU + .3; out.push({x:B.hx + Math.cos(a)*R2, y:B.hy + Math.sin(a)*R2}); } return out; };
  const constellation = (on, B) => { const C = SG.C(); if (!C) return; const L = C.lair; for (let y = L.y - 12; y <= L.y + 12; y++) for (let x = L.x - 12; x <= L.x + 12; x++) { if (x < 1 || y < 1 || x >= SG.RW - 1 || y >= SG.RH - 1) continue; const k = y*SG.RW + x;
      if (!on) { if (C.temp.has(k) && C.temp.get(k).v == SG.T.CHASM) C.temp.delete(k); continue; } if (Math.hypot(x - L.x, y - L.y) > 11) continue; const dx = x - L.x, dy = y - L.y, a = Math.atan2(dy, dx), arm = Math.abs(((a*7/TAU) % 1 + 1) % 1 - .5) < .09, ring = Math.abs(Math.hypot(dx, dy) - 7) < .6;
      if (!(arm || ring || Math.hypot(dx, dy) < 2)) C.temp.set(k, {v:SG.T.CHASM, t:9999}); } };
  const ggAI = (B, dt, ph, ang, d) => { const D3 = A2.D(.85, 1, 1.2), sp1 = 1 + .07*ph, layer = layerOf(B);
    B.phn = GPH[ph]; if (B.lastPh != ph) { B.lastPh = ph; if (!BOSS[B.k].rematch) { SV.flags.godCp = Math.max(SV.flags.godCp || 1, ph); S.save(); } if (ph > 1) S.say('🌌 Phase ' + ph + ': ' + GPH[ph] + (BOSS[B.k].rematch ? '' : ' · checkpoint'), 3); PW.invert = ph == 2; PW.drift = ph == 2 ? {x:0, y:-70} : null; PW.pull = null; constellation(ph == 6, B); gx.copies = ph == 4 || ph == 9 ? [{a:0}, {a:TAU/3}, {a:2*TAU/3}] : []; if (ph == 7) { for (let i = 0; i < 4 && S.foes.length < 10; i++) S.spawnFoe('echo', B.x + (i - 1.5)*110, B.y + 100); S.tornado = {x:B.x, y:B.y + 100, r:50, t:0, life:14}; } }
    moments(B, layer);
    // drifting high above the arena
    B.mv = (B.mv || 0) - dt; if (B.mv <= 0) { B.mv = 2.6/sp1; const a = Math.random()*TAU, r = 40 + Math.random()*200; B.tx = B.hx + Math.cos(a)*r; B.ty = B.hy - 60 + Math.sin(a)*r*.6; } B.x += (B.tx - B.x)*Math.min(1, dt*1.6); B.y += (B.ty - B.y)*Math.min(1, dt*1.6);
    const spiral = (iv, arms, spd) => { B.sp = (B.sp || 0) - dt; if (B.sp <= 0) { B.sp = iv; B.a = (B.a || 0) + .21; for (let i = 0; i < arms; i++) S.shot(B, B.a + i*TAU/arms, spd*D3, {r:6, col:'#c9b0ff'}); } };
    const ring = (iv, n2, spd) => { B.rg = (B.rg == null ? 1 : B.rg) - dt; if (B.rg <= 0) { B.rg = iv; const gap = Math.random()*TAU; for (let i = 0; i < n2; i++) { const a = i/n2*TAU; if (Math.abs(((a - gap + Math.PI*3) % TAU) - Math.PI) < .4) continue; S.shot(B, a, spd*D3, {r:7, col:'#9fe8ff'}); } } };
    const meteors = (iv, n2, r) => { B.mt = (B.mt == null ? 1 : B.mt) - dt; if (B.mt <= 0) { B.mt = iv; for (let i = 0; i < n2; i++) haz(p.x + (Math.random() - .5)*420, p.y + (Math.random() - .5)*420, r, 1.3, 2, {met:1}); haz(p.x, p.y, r, 1.4, 2, {met:1}); } };
    if (ph == 1) { meteors(1.6, 3, 48); ring(2.8, 24, 170); }
    else if (ph == 2) { spiral(.14, 3, 150); ring(3.2, 22, 160); }
    else if (ph == 3) { spiral(.12, 4, 150); B.fr = (B.fr == null ? 4 : B.fr) - dt; if (B.fr <= 0) { B.fr = 7; warnBanner('⏸ TIME STOPS', 1); gx.frozen = 2.2; S.balls.forEach(b => { if (!b.mine) { b.fvx = b.vx; b.fvy = b.vy; b.vx = b.vy = 0; b.life += 2.2; } }); } }
    else if (ph == 4) { spiral(.15, 3, 160); ring(2.6, 22, 170); gx.copies.forEach(c => c.a += dt*.9); }
    else if (ph == 5) { spiral(.16, 3, 150); B.bh = (B.bh == null ? 1 : B.bh) - dt; if (B.bh <= 0) { B.bh = 6; const a = Math.random()*TAU; PW.pull = {x:B.hx + Math.cos(a)*200, y:B.hy + Math.sin(a)*200, f:420}; warnBanner('🕳 BLACK HOLE!', 1.2); } if (PW.pull) haz(PW.pull.x, PW.pull.y, 40, .05, 1, {hole:1}); }
    else if (ph == 6) { ring(2.4, 20, 150); meteors(2.2, 2, 44); }
    else if (ph == 7) { spiral(.13, 4, 155); ring(3, 24, 165); }
    else if (ph == 8) { spiral(.1, 3, 165); B.lt = (B.lt || 0) - dt; if (B.lt <= 0) { B.lt = .5; haz(p.x + (Math.random() - .5)*300, p.y + (Math.random() - .5)*300, 50, 1.1, 2, {bolt:1}); } }
    else if (ph == 9) { spiral(.1, 4, 160); ring(2.4, 26, 175); meteors(2, 3, 46); gx.copies.forEach(c => c.a += dt*1.2); B.ko = (B.ko == null ? 6 : B.ko) - dt; if (B.ko <= 0) { B.ko = 14; warnBanner('☠ STARFALL! GET OUT OF THE RED!', 3); haz(B.x, B.y, 320, 3, 999, {ko:1}); } }
    else { spiral(.09, 5, 170); meteors(1.4, 4, 50); gx.team = Math.min(1, gx.team + dt*.015); if (gx.team >= 1 && !gx.teamReady) { gx.teamReady = true; S.say('💥 EVERYONE ATTACK! Press E', 3.5); A2.sfx('win'); } }
    if (d < B.r + 20) S.hurtMe(2); };
  const layerOf = B => Math.max(0, Math.ceil(B.hp/(B.max/LAYERS)));   // layers left
  // story moments, mid-fight (once each per attempt)
  const moments = (B, layer) => { if (BOSS[B.k].rematch) return; const M2 = gx.moments, at = (n, f) => { if (layer <= n && !M2[n]) { M2[n] = 1; f(); } };
    at(40, () => { gx.shieldT = 8; p.shieldT = Math.max(p.shieldT, 8); S.talk([[...MAUQ, 'NOBODY TOUCHES MY HERO! SHIELD BELLY, MAXIMUM SIZE!', 'happy']]); });
    at(30, () => { gx.ghosts = ['mincG', 'chaoG', 'mowG'].map((w, i) => ({w, a:i*TAU/3, t:25, cd:.5})); S.talk([[...BAUQ, 'Brothers… you came!', 'surprised'], [...['Chao Chao', 'chaoG'], 'We never stopped watching over you, little brother. Now… let’s fight.', 'peaceful']]); });
    at(20, () => { p.hp = Math.max(p.hp, p.max); gx.buffT = 30; S.talk([[...OSWQ, '*A warm light pours out of the crystal. Oswald is purring. The whole team feels stronger.*', 'happy']]); });
    at(10, () => { gx.team = .6; S.talk([[...LOKQ, 'You taught me what magic is for. Take ALL of mine. Every last sparkle!', 'happy']]); }); };
  const teamAttack = () => { const B = S.boss; if (!B || !BOSS[B.k].gg || !gx.teamReady) return false; gx.teamReady = false; gx.team = 0; S.shakeV = 16; S.cheerT = 3; A2.sfx('win'); B.allowHit = 1; S.hurtBoss(B.max/LAYERS*2.2); B.allowHit = 0; S.say('💥 Mau Mau, Bau Bau, Maya, Leo, Ava, Sam, Loki and Oswald: EVERYTHING AT ONCE!', 3.5); return true; };
  const hurt = (B, dmg) => { if (B.allowHit) return false; if (BOSS[B.k].gg) { if (gx.copies.length && Math.random() < .5) { S.addNum(B.x, B.y - 70, 'just a copy…', '#c9b0ff'); return true; } let m = (SV.flags.sealBalls ? 1 : .25)*(gx.buffT > 0 ? 1.5 : 1); if (!SV.flags.sealBalls && Math.random() < .1) S.addNum(B.x, B.y - 60, 'barely a scratch… (Seal-Breaker Snowballs needed)', '#ff9ad5'); B.allowHit = 1; S.hurtBoss(dmg*m); B.allowHit = 0; if (B.ph == 10) gx.team = Math.min(1, gx.team + .015); return true; } return false; };
  // ---------- bars ----------
  const HUES = ['#7fd860', '#64CDF5', '#c9a0ff', '#F9BF01', '#ff6ad5', '#ff8a3c', '#9fe8ff', '#D5F367', '#ff4539', '#ffffff', '#a0ffd8', '#5a7aff'];
  const drawBar = (B, TY) => { const VW = S.VW, rr = S.rr;
    if (!BOSS[B.k].gg) { const bw = Math.min(560, VW - 240), bx = VW/2 - bw/2, by = TY + 70, k = Math.max(0, B.hp)/B.max; g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, bx, by, bw, 16, 8); g.fill(); const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#c9a0ff'); gr.addColorStop(1, '#64CDF5'); g.fillStyle = gr; rr(g, bx, by, bw*k, 16, 8); g.fill();
      g.font = '800 12px ' + A2.font; g.textAlign = 'center'; const bl = BOSS[B.k].n + ' · phase ' + B.ph + '/4', tw = g.measureText(bl).width + 16; g.fillStyle = 'rgba(255,255,255,.9)'; rr(g, VW/2 - tw/2, by + 19, tw, 18, 9); g.fill(); g.fillStyle = '#14204a'; g.fillText(bl, VW/2, by + 32); return; }
    // THE GECKO GOD: a stack of 50 coloured layers, full width, ×N counter, and a thin row with every layer left
    const m = 14, top = TY + 128, L = VW - m*2, per = B.max/LAYERS, left = layerOf(B), cur = Math.max(0, B.hp - (left - 1)*per)/per; gx.fill = Math.min(1, gx.fill + 1/60/3);
    const col = i => HUES[i % HUES.length], ci = left - 1;
    g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, m, top, L, 22, 11); g.fill();
    if (left > 1) { g.fillStyle = col(ci - 1); rr(g, m, top, L*gx.fill, 22, 11); g.fill(); g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, m, top, L*gx.fill, 22, 11); g.fill(); }
    if (left > 0) { g.fillStyle = col(ci); rr(g, m, top, L*cur*gx.fill, 22, 11); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(m + 6, top + 4, Math.max(0, L*cur*gx.fill - 12), 4); }
    g.font = '900 26px ' + A2.font; g.textAlign = 'right'; g.lineWidth = 4; g.strokeStyle = '#14204a'; g.strokeText('×' + left, VW - m - 8, top + 20); g.fillStyle = '#fff'; g.fillText('×' + left, VW - m - 8, top + 20);
    const sw = L/LAYERS; for (let i = 0; i < LAYERS; i++) { g.fillStyle = i < left ? col(i) : 'rgba(255,255,255,.12)'; g.fillRect(m + i*sw + 1, top + 27, sw - 2, 5); } for (let i = 5; i < LAYERS; i += 5) { g.fillStyle = '#fff'; g.fillRect(m + i*sw - 1, top + 25, 2, 9); }
    g.font = '800 12px ' + A2.font; g.textAlign = 'center'; const bl = BOSS[B.k].n + ' · phase ' + B.ph + '/10: ' + GPH[B.ph] + (BOSS[B.k].rematch ? ' · ⏱ ' + fmtT(rematchT()) : ' · checkpoint ' + (SV.flags.godCp || 1)), tw = g.measureText(bl).width + 16; g.fillStyle = 'rgba(255,255,255,.9)'; rr(g, VW/2 - tw/2, top + 38, tw, 18, 9); g.fill(); g.fillStyle = '#14204a'; g.fillText(bl, VW/2, top + 51);
    if (B.ph == 10) { const tw2 = 280, tx = VW/2 - tw2/2, ty = top + 62; g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, tx, ty, tw2, 12, 6); g.fill(); g.fillStyle = gx.teamReady ? '#D5F367' : '#64CDF5'; rr(g, tx, ty, tw2*gx.team, 12, 6); g.fill(); g.fillStyle = '#fff'; g.font = '800 11px ' + A2.font; g.fillText(gx.teamReady ? '💥 EVERYONE ATTACK: press E' : 'Everyone together: keep hitting!', VW/2, ty + 26); } };
  const fmtT = s => Math.floor(s/60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const rematchT = () => rematch ? (Date.now() - rematch.t0)/1000 : 0;
  const drawBoss = B => { const sc = BOSS[B.k].gg ? 3 : 2.2, al = B.flash > 0 ? .6 : 1; gx.copies.forEach(c => drawGod(B.hx + Math.cos(c.a)*180, B.hy - 60 + Math.sin(c.a)*90, sc*.9, {alpha:.75})); drawGod(B.x, B.y, sc, {alpha:al, flip:p.x < B.x, mood:B.ph >= 3 ? 'angry' : 'smug'});
    if (B.talk && B.talkT > 0) S.bubble(B.x, B.y - 110, B.talk.replace(/^Dumpling[^:]*: /, '')); };
  // ---------- when a god-bar runs out ----------
  const godDown = B => { const n = BOSS[B.k].god; hz.length = 0; gx.copies = []; PW.invert = false; PW.drift = null; PW.pull = null; PW.slow = 1; S.foes = []; S.splat(B.x, B.y, 40, '#c9b0ff');
    if (BOSS[B.k].rematch) { const secs = rematchT(); rematch = null; SV.godTimes = (SV.godTimes || []).concat([Math.round(secs)]).sort((a, b) => a - b).slice(0, 10); SV.godBest = SV.godTimes[0]; A2.sfx('win'); S.cheerT = 3;
      try { const C2 = window.WLCloud; if (C2 && C2.postScore && C2.me && C2.me()) C2.postScore('snowgod', {u:(window.Arcade.username || 'player'), s:Math.max(1, 36000 - Math.round(secs))}, 36000); } catch (e) {}
      S.give({frost:60, flakes:5000, xp:400}); S.save(); S.talk([[...NAR, '⏱ Gecko God rematch cleared in ' + fmtT(secs) + (secs <= SV.godBest ? ' · a new best!' : ' · best ' + fmtT(SV.godBest)), '']]); return; }
    if (BOSS[B.k].gg) { ending(B); return; }
    SV.flags[GODN[n].flag] = 1; if (n == 2) SV.stam += 30; S.give({frost:80 + 20*n, flakes:8000, xp:800, score:20000, gear:5}); X.stat && X.stat('sagaGodFight', n, 'max'); A2.sfx('win');
    S.talk([[...GODQ, '*The bar is empty. He doesn’t even look hurt. He just rises, slowly, out of reach.*', 'smug'], [...GODQ, 'You still don’t understand what I am.', 'smug'], [...NAR, '✨ You got ' + GODN[n].reward + '! ' + GODN[n].d, '']], () => { const s2 = pstep(); if (s2 && s2.k == 'god' && s2.n == n) padv(); }); };
  // ---------- the ending ----------
  let credits = null;
  const ending = B => { constellation(false, B); SV.flags.godDown = 1; SV.flags.godSky = 0; W.outfits = W.outfits || {}; W.outfits.god = 1; W.titles = W.titles || {}; W.titles['Gecko God Slayer'] = 1; S.give({frost:500, flakes:50000, xp:3000, score:100000, gear:5}); X.stat && X.stat('sagaGod', 1, 'max'); A2.sfx('win'); S.cheerT = 6; S.shakeV = 20;
    if (window.WLMusic && window.WLMusic.mood) try { window.WLMusic.mood('calm'); } catch (e) {}
    S.talk([[...GODQ, 'No… NO. I am a GOD. I was a god before your kingdom had a name!', 'angry'], [...NAR, '*Nine chains of light rise from the clouds and wrap around him, one by one. The seal reforms.*', ''], [...DUMQ, '…small again. How… tiresome.', 'sad'], [...PELLQ, 'Sealed. Properly, this time. I will keep watch over him myself. Hoo.', 'peaceful'], [...NAR, '*The crystal cracks open. A round grey cat with white socks tumbles out and blinks.*', ''], [...OSWQ, 'Mrrrp?', 'happy'], [...MAUQ, 'OSWALD! You’re safe! Let’s get you home. I hear there’s a kitchen waiting.', 'happy']], () => { const s2 = pstep(); if (s2 && s2.k == 'final') padv(); S.save(); }); };
  const homeScene = () => S.talk([[...NELLQ, 'OSWALD!!', 'happy'], [...OSWQ, '*purrrrrrrrr*', 'happy'], [...NELLQ, 'You brought him home. You brought the SKY back. Thank you, hero. Thank you, everyone.', 'happy'], [...BAUQ, 'The Snow Kingdom is safe. Truly safe. You are a Gecko God Slayer now.', 'peaceful'],
      [...NAR, '🏆 Title: GECKO GOD SLAYER · 🌌 Godlike outfit set (Journal → Outfits) · 🗿 your statue now stands in the Hall of Paws, where you can rematch the Gecko God for the fastest time.', '']], () => { SV.flags.oswaldHome = 1; padv(); credits = {t:0}; S.save(); });
  const CRED = ['THE DUMPLING SAGA', 'THE GECKO GOD', '', 'You saved the Snow Kingdom.', 'Twice.', '', 'Oswald is home.', 'The sky is clear.', 'The seal holds.', '', 'Royal Guard Mau Mau', 'Lord Emperor Bau Bau', 'Maya · Leo · Ava · Sam', 'Loki · Archivist Pell · Old Pip', 'Nell, Bram, Ivy and Old Gus', 'Oswald the cat', '', 'and', 'Dumpling', '(sealed, and a little grumpy)', '', 'THE END', ''];
  const drawCredits = () => { const VW = S.VW, VH = S.VH; credits.t += 1/60; g.fillStyle = '#060a1a'; g.fillRect(0, 0, VW, 720); for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,' + (.3 + .3*Math.sin(credits.t + i)) + ')'; g.fillRect((i*197) % VW, (i*131) % VH, 2, 2); }
    const y0 = VH - credits.t*44; g.textAlign = 'center'; CRED.forEach((ln, i) => { const y = y0 + i*40; if (y < -40 || y > VH + 40) return; g.fillStyle = i < 2 || ln == 'THE END' ? '#D5F367' : '#fff'; g.font = (i < 2 || ln == 'THE END' ? '900 28px ' : '600 18px ') + A2.font; g.fillText(ln, VW/2, y); });
    if (y0 + CRED.length*40 < VH*.4) { drawOswald(VW/2, VH/2, {s:3}); g.fillStyle = '#fff'; g.font = '600 14px ' + A2.font; g.fillText('Tap or press any key', VW/2, VH - 30); } };
  // ---------- things to use ----------
  const things = (L, cur, C, W2T) => { const s2 = pstep();
    if (!cur) { if (SV.flags.godDown) { const st = hallStatue(); L.push({x:st.x, y:st.y + 50, n:'Gecko God rematch', f:rematchPanel}); }
      if (!s2) return;
      if (s2.k == 'talk') L.push({x:s2.at.x, y:s2.at.y, n:'⭐ Talk', f:() => S.talk(s2.lines, padv)});
      if (s2.k == 'clues') CLUES.forEach((c, i) => { if (done('cl' + i)) return; L.push({x:c.at.x, y:c.at.y, n:'Look at ' + c.e, f:() => { SV.flags['cl' + i] = 1; S.save(); const left = CLUES.filter((c2, j) => !done('cl' + j)).length; S.talk([[...NAR, '🔎 ' + c.n + ': ' + c.line, '']], () => { if (!left) padv(); }); }}); });
      if (s2.k == 'people') PEOPLE.forEach((q, i) => { if (done('pp' + i)) return; L.push({x:q.at.x, y:q.at.y, n:'⭐ Ask', f:() => { SV.flags['pp' + i] = 1; S.save(); const left = PEOPLE.filter((q2, j) => !done('pp' + j)).length; S.talk([[...q.who, q.line, 'surprised']], () => { if (!left) padv(); }); }}); });
      if (s2.k == 'frags') FRAGS.forEach((q, i) => { if (done('fr' + i)) return; L.push({x:q.x, y:q.y, n:'Pick up ✨', f:() => { SV.flags['fr' + i] = 1; S.save(); const left = FRAGS.filter((q2, j) => !done('fr' + j)).length; S.talk([[...NAR, left ? '✨ A glowing seal fragment, cracked straight through. (' + (3 - left) + '/3)' : '✨ The third fragment. They all point the same way: the Forbidden Temple. The seal is breaking.', '']], () => { if (!left) { SV.postUnlock.forbidden = 1; padv(); } }); }}); });
      if (s2.k == 'home' && SV.flags.godDown) L.push({x:NELL.x, y:NELL.y, n:'⭐ Bring Oswald home', f:homeScene});
      return; }
    if (s2 && s2.k == 'ritual' && cur == 'forbidden') { const q = W2T(C.lair); L.push({x:q.x, y:q.y + 150, n:'⭐ Stop the ritual', f:ritual}); } };
  const ritual = () => { SV.flags.godSky = 1; S.shakeV = 18; A2.sfx('bad');
    S.talk([[...NAR, '*In the heart of the temple, Dumpling sits in a circle of nine broken chains. Next to him, Oswald is asleep inside a glowing crystal.*', ''], [...DUMQ, 'Oh, good. An audience. You’re just in time for the best part.', 'smug'], [...DUMQ, 'A cat’s purr is the oldest warm thing in the world. It was the last lock on my seal. Thank you for not finding him sooner.', 'smug'],
      [...NAR, '*CRACK. The seal shatters. Light pours out of Dumpling. He rises, and keeps rising. He grows, and keeps growing.*', ''], [...NAR, '*A halo of ice. Stars across his skin. Three ghostly tails. Eyes like galaxies. Over the whole kingdom, the sky turns violet.*', ''], [...GODQ, 'Ahhh. THERE I am.', 'smug'], [...GODQ, 'Now. Shall we play? I promise to try… a little.', 'smug']], padv); };
  // ---------- quest arrow ----------
  api.postGoal = (cur, C, W2T) => { const s2 = pstep(); if (!SV.post) return null; if (!s2) return null; const pre = '🐾 ';
    const inVillage = (pos, n) => cur ? {x:W2T(C.spawn).x - 40, y:W2T(C.spawn).y + 30, n:pre + 'Return to camp · ' + n} : {...pos, n:pre + n};
    if (s2.k == 'talk') return inVillage(s2.at, s2.g);
    if (s2.k == 'clues') { const i = CLUES.findIndex((c, j) => !done('cl' + j)); return inVillage(CLUES[Math.max(0, i)].at, s2.g + ' (' + CLUES.filter((c, j) => done('cl' + j)).length + '/3)'); }
    if (s2.k == 'trail') { const i = SV.flags.trail|0; return inVillage(TRAIL[Math.min(i, TRAIL.length - 1)], s2.g + ' (' + i + '/' + TRAIL.length + ')'); }
    if (s2.k == 'people') { const i = PEOPLE.findIndex((q, j) => !done('pp' + j)); return inVillage(PEOPLE[Math.max(0, i)].at, s2.g + ' (' + PEOPLE.filter((q, j) => done('pp' + j)).length + '/3)'); }
    if (s2.k == 'frags') { const i = FRAGS.findIndex((q, j) => !done('fr' + j)); return inVillage(FRAGS[Math.max(0, i)], s2.g + ' (' + FRAGS.filter((q, j) => done('fr' + j)).length + '/3)'); }
    if (s2.k == 'home') return inVillage(NELL, s2.g);
    const r = s2.r, Rn = SG.REGIONS[SG.RIDX[r]].n; if (!cur) return {...api.BOARD, n:pre + 'Travel to ' + Rn + ' (Expedition Board)'}; if (cur != r) return {x:W2T(C.spawn).x - 40, y:W2T(C.spawn).y + 30, n:pre + 'Return to camp, then travel to ' + Rn};
    const q = W2T(C.lair); return {x:q.x, y:q.y + (s2.k == 'ritual' ? 150 : 0), n:pre + s2.g}; };
  // ---------- per-frame ----------
  const update = (dt, cur, C, W2T) => { if (!SV.post) return; const s2 = pstep();
    if (s2 && s2.k == 'travel' && cur == s2.r) padv();
    if (s2 && s2.k == 'trail' && !cur) { const i = SV.flags.trail|0, q = TRAIL[i]; if (q && Math.hypot(q.x - p.x, q.y - p.y) < 60) { SV.flags.trail = i + 1; A2.sfx('blip'); if (i + 1 >= TRAIL.length) { S.talk([[...NAR, '🐾 The paw prints stop at the shore. Next to them: small, round, STICKY toe prints. And something glowing in the snow.', '']], padv); } S.save(); } }
    PW.flyT = Math.max(0, (PW.flyT || 0) - dt); gx.flyCd = Math.max(0, gx.flyCd - dt); gx.buffT = Math.max(0, gx.buffT - dt);
    if (gx.warn) { gx.warn.t -= dt; if (gx.warn.t <= 0) gx.warn = null; }
    if (gx.frozen > 0) { gx.frozen -= dt; if (gx.frozen <= 0) S.balls.forEach(b => { if (b.fvx != null) { b.vx = b.fvx; b.vy = b.fvy; b.fvx = null; } }); }
    for (const h of hz) { h.t -= dt; if (h.t <= 0 && !h.hit) { h.hit = 1; if (h.safe || h.hole) continue; if (h.freeze) { if (!h.safes.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 54) && !(PW.flyT > 0)) { S.hurtMe(h.dmg); S.say('🥶 Frozen!', 1.6); } S.stormFlash = .4; continue; }
        if (Math.hypot(h.x - p.x, h.y - p.y) < h.r && !(h.ko && PW.flyT > 0)) S.hurtMe(h.ko ? 999 : h.dmg); S.splat(h.x, h.y, h.ko ? 30 : 8, h.ko ? '#ff9a8a' : '#e8f8ff'); if (h.ko) S.shakeV = 14; } }
    for (let i = hz.length - 1; i >= 0; i--) if (hz[i].t < -.4) hz.splice(i, 1);
    gx.ghosts.forEach(gh => { gh.t -= dt; gh.a += dt*1.4; gh.cd -= dt; const B = S.boss; if (gh.cd <= 0 && B) { gh.cd = .6; const gxp = p.x + Math.cos(gh.a)*70, gyp = p.y + Math.sin(gh.a)*50, a = Math.atan2(B.y - gyp, B.x - gxp); S.balls.push({x:gxp, y:gyp, vx:Math.cos(a)*520, vy:Math.sin(a)*520, mine:1, team:1, dmg:X.armM()*2, r:6, life:1.2, hits:[], col:'#bff0ff'}); } }); gx.ghosts = gx.ghosts.filter(gh => gh.t > 0);
    const B = S.boss; if (!B || !BOSS[B.k] || !BOSS[B.k].post) { if (PW.invert || PW.drift || PW.pull || (PW.slow || 1) != 1) { PW.invert = false; PW.drift = null; PW.pull = null; PW.slow = 1; } if (gx.copies.length) gx.copies = []; } };
  // dying in the Gecko God fight: back to the last checkpoint (every 5 layers)
  const respawn = () => { const B = S.boss; if (!B || !BOSS[B.k] || !BOSS[B.k].post) return false; hz.length = 0; gx.copies = []; gx.moments = {}; PW.invert = false; PW.drift = null; PW.pull = null; PW.slow = 1; S.foes = []; S.balls = []; S.boss = null; constellation(false, B);
    W.bhp = W.bhp || {}; if (BOSS[B.k].gg && !BOSS[B.k].rematch) { const cp = SV.flags.godCp || 1; W.bhp[B.k] = B.max*(1 - (cp - 1)/10)*(cp > 1 ? .999 : 1); W.bhm = W.bhm || {}; W.bhm[B.k] = B.max; gx.fill = 0; S.say('🌌 Back to checkpoint: phase ' + cp + ' · ' + GPH[cp], 3); } else if (BOSS[B.k].rematch) { delete W.bhp[B.k]; rematch = null; S.say('⏱ Rematch over. Try again from the statue!', 3); }
    const C = SG.C(); if (C) { const q = SG.W2T(C.lair); p.x = q.x; p.y = q.y + 300; } p.vx = p.vy = 0; p.hp = p.max; p.inv = 3; p.ammo = X.maxAmmo(); S.mateHome(); return true; };
  // ---------- drawing ----------
  const hallStatue = () => ({x:121.5*TS, y:62.5*TS});
  const drawCamp = () => { const s2 = pstep(), t = S.t;
    if (SV.post && s2) { const mark = (q, e) => { if (!S.onScreen(q.x, q.y)) return; g.fillStyle = '#F9BF01'; g.font = '900 20px ' + A2.font; g.textAlign = 'center'; g.fillText(e || '!', q.x, q.y - 40 + Math.sin(t*5)*3); };
      if (S.onScreen(NOTICE.x, NOTICE.y)) { g.fillStyle = '#6b4a2b'; g.fillRect(NOTICE.x - 3, NOTICE.y - 6, 6, 26); g.fillStyle = '#f3e6cf'; S.rr(g, NOTICE.x - 26, NOTICE.y - 40, 52, 36, 4); g.fill(); g.fillStyle = '#14204a'; g.font = '800 9px ' + A2.font; g.textAlign = 'center'; g.fillText('MISSING:', NOTICE.x, NOTICE.y - 26); g.fillText('OSWALD 🐱', NOTICE.x, NOTICE.y - 14); }
      if (s2.k == 'talk' || s2.k == 'home') { if (S.onScreen(NELL.x, NELL.y)) { S.kid(NELL.x, NELL.y, '#ff9ad5', {face:Math.PI/2}); if (s2.k == 'home' && SV.flags.godDown) drawOswald(NELL.x + 34, NELL.y + 6, {}); mark(NELL); } }
      if (s2.k == 'clues') CLUES.forEach((c, i) => { if (done('cl' + i) || !S.onScreen(c.at.x, c.at.y)) return; g.font = '22px ' + A2.font; g.textAlign = 'center'; g.fillText(c.e, c.at.x, c.at.y + 6); mark(c.at, '?'); });
      if (s2.k == 'trail') { const i = SV.flags.trail|0; TRAIL.slice(i, i + 2).forEach((q, j) => { if (!S.onScreen(q.x, q.y)) return; g.fillStyle = 'rgba(249,191,1,' + (.5 + .3*Math.sin(t*4)) + ')'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(q.x - 12 + k*8, q.y + (k % 2)*6, 3, 4, 0, 0, TAU); g.fill(); } }); }
      if (s2.k == 'people') PEOPLE.forEach((q, i) => { if (done('pp' + i) || !S.onScreen(q.at.x, q.at.y)) return; S.kid(q.at.x, q.at.y, ['#8D5B1D', '#2fa8e0', '#9aa0aa'][i], {face:Math.PI/2}); mark(q.at); });
      if (s2.k == 'frags') FRAGS.forEach((q, i) => { if (done('fr' + i) || !S.onScreen(q.x, q.y)) return; g.fillStyle = 'rgba(249,191,1,' + (.3 + .25*Math.sin(t*4 + i)) + ')'; g.beginPath(); g.arc(q.x, q.y - 4, 20, 0, TAU); g.fill(); g.font = '20px ' + A2.font; g.textAlign = 'center'; g.fillText('✨', q.x, q.y + 4); g.fillStyle = 'rgba(80,110,70,.5)'; g.beginPath(); g.ellipse(q.x - 30, q.y + 10, 3, 2, 0, 0, TAU); g.ellipse(q.x - 22, q.y + 14, 3, 2, 0, 0, TAU); g.fill(); }); }
    if (SV.flags.oswaldHome && S.onScreen(NELL.x, NELL.y)) { S.kid(NELL.x, NELL.y, '#ff9ad5', {face:Math.PI/2}); drawOswald(NELL.x + 34, NELL.y + 6, {}); }
    if (SV.flags.godDown) { const st = hallStatue(); if (S.onScreen(st.x, st.y, 200)) { g.fillStyle = '#c8d0dc'; S.rr(g, st.x - 40, st.y + 10, 80, 26, 6); g.fill(); g.fillStyle = '#e8ecf4'; S.kid(st.x - 16, st.y, '#d8dde8', {face:Math.PI/2}); api.drawGecko(st.x + 22, st.y - 4, {s:.9, col:'#d8dde8', dark:'#b0b8c8', noSeal:1, mood:'smug'}); g.fillStyle = '#14204a'; g.font = '800 10px ' + A2.font; g.textAlign = 'center'; g.fillText('GECKO GOD SLAYER', st.x, st.y + 28); } } };
  const drawWorld = (cur, C, W2T) => { const t = S.t;
    const s2 = pstep(); if (s2 && s2.k == 'ritual' && cur == 'forbidden' && C) { const q = W2T(C.lair); api.drawGecko(q.x, q.y, {s:1.4, mood:'smug'}); drawOswald(q.x + 70, q.y + 10, {}); g.strokeStyle = 'rgba(160,240,255,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(q.x + 50, q.y + 30); g.lineTo(q.x + 70, q.y - 26); g.lineTo(q.x + 90, q.y + 30); g.closePath(); g.stroke(); }
    for (const h of hz) { const k = 1 - Math.max(0, h.t)/h.t0; if (h.freeze) continue; if (h.safe) { if (h.t > 0) { g.fillStyle = 'rgba(213,243,103,' + (.25 + .2*Math.sin(t*8)) + ')'; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); g.strokeStyle = '#D5F367'; g.lineWidth = 3; g.stroke(); } continue; }
      if (h.hole) { g.fillStyle = 'rgba(20,10,40,.85)'; g.beginPath(); g.arc(h.x, h.y, 40 + Math.sin(t*6)*4, 0, TAU); g.fill(); g.strokeStyle = 'rgba(200,160,255,.6)'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(h.x, h.y, 50 + i*20 - (t*40 % 20), 0, TAU); g.stroke(); } continue; }
      if (h.t > 0) { g.fillStyle = h.ko ? 'rgba(255,40,40,' + (.12 + .2*k) + ')' : 'rgba(200,160,255,' + (.12 + .25*k) + ')'; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); g.strokeStyle = h.ko ? '#FF4539' : '#c9a0ff'; g.lineWidth = h.ko ? 5 : 2.5; g.setLineDash([8, 6]); g.stroke(); g.setLineDash([]); if (h.ko) { g.fillStyle = '#fff'; g.font = '900 30px ' + A2.font; g.textAlign = 'center'; g.fillText(Math.ceil(h.t), h.x, h.y); } }
      else { g.fillStyle = h.met ? '#bfe6ff' : '#fff6a0'; g.beginPath(); g.arc(h.x, h.y, h.r*.5, 0, TAU); g.fill(); } }
    gx.ghosts.forEach(gh => { const x = p.x + Math.cos(gh.a)*70, y = p.y + Math.sin(gh.a)*50; S.portraitBase(gh.w, x, y, 'peaceful'); }); };
  const drawScreen = cur => { if (SV.flags.godSky && !SV.flags.godDown && !S.low()) { g.fillStyle = 'rgba(80,40,140,.16)'; g.fillRect(0, 0, S.VW, S.VH); }
    if (gx.warn) { const VW = S.VW; g.font = '900 26px ' + A2.font; g.textAlign = 'center'; g.lineWidth = 5; g.strokeStyle = '#14204a'; g.strokeText(gx.warn.txt, VW/2, S.VH*.42); g.fillStyle = Math.sin(S.t*14) > 0 ? '#FF4539' : '#fff'; g.fillText(gx.warn.txt, VW/2, S.VH*.42); }
    if ((PW.slow || 1) < 1 && !S.low()) { g.fillStyle = 'rgba(120,180,255,.12)'; g.fillRect(0, 0, S.VW, S.VH); }
    if (SV.flags.flight && SG.cur()) { const VW = S.VW, x = VW - 160, y = S.VH - 70; g.fillStyle = PW.flyT > 0 ? '#D5F367' : gx.flyCd > 0 ? 'rgba(20,32,74,.6)' : 'rgba(213,243,103,.85)'; S.rr(g, x, y, 140, 30, 15); g.fill(); g.fillStyle = '#14204a'; g.font = '800 12px ' + A2.font; g.textAlign = 'center'; g.fillText(PW.flyT > 0 ? '✨ Flying!' : gx.flyCd > 0 ? '✨ Fly in ' + Math.ceil(gx.flyCd) + 's' : '✨ Fly · X', x + 70, y + 20); flyR = {x, y, w:140, h:30}; } else flyR = null; };
  let flyR = null;
  const fly = () => { if (!SV.flags.flight || gx.flyCd > 0 || !SG.cur()) return false; PW.flyT = 2.5; gx.flyCd = 8; p.inv = Math.max(p.inv, .6); A2.sfx('win'); return true; };
  const drawTop = () => { if (credits) drawCredits(); };
  const pkey = e => { const k = e.key; if (credits) { if (credits.t > (CRED.length*40 + S.VH)/44 + 3 || k == 'Escape') credits = null; else credits.t += 2; return true; } if ((k == 'x' || k == 'X') && fly()) return true; if ((k == 'e' || k == 'E') && gx.teamReady && S.boss && BOSS[S.boss.k] && BOSS[S.boss.k].gg) return teamAttack(); return false; };
  const pdown = q => { if (credits) { if (credits.t > (CRED.length*40 + S.VH)/44 + 3) credits = null; else credits.t += 4; return true; } if (flyR && q.x >= flyR.x && q.x <= flyR.x + flyR.w && q.y >= flyR.y && q.y <= flyR.y + flyR.h) return fly(); if (gx.teamReady && S.boss && BOSS[S.boss.k] && BOSS[S.boss.k].gg && q.y > S.BAR - 90) return teamAttack(); return false; };
  // ---------- rematch + leaderboard ----------
  let board = null;
  const rematchPanel = () => { if (!board && window.WLCloud && window.WLCloud.top) { board = []; window.WLCloud.top('snowgod', 10).then(r => { board = r || []; }).catch(() => { board = []; }); }
    S.openPanelUI(() => ({title:'🗿 Gecko God rematch · fastest time', sub:'Your best: ' + (SV.godBest ? fmtT(SV.godBest) : 'none yet') + '. The timer starts when he wakes. Times post to the online leaderboard when you’re signed in.',
      rows:[{e:'🌌', n:'Rematch the Gecko God', d:'50 layers, no story moments, no checkpoints. As fast as you can.', btn:'Fight!', ok:true, fn:() => { S.panel = null; rematch = {t0:Date.now() + 2500}; W.bhp && delete W.bhp.geckogodR; SG.enter('void', 0); const C = SG.C(), q = SG.W2T(C.lair); p.x = q.x; p.y = q.y + 300; }},
        ...((board || []).length ? board : []).map((r, i) => ({e:['🥇', '🥈', '🥉'][i] || '🏅', n:(r.u || 'player') + ' · ' + fmtT(36000 - r.s), d:'Online leaderboard #' + (i + 1)})),
        ...(SV.godTimes || []).slice(0, 5).map((s, i) => ({e:'⏱', n:'Your run: ' + fmtT(s), d:'Personal top ' + (i + 1)}))]})); };
  const rows = () => SV.post ? [{e:'🐾', n:'After the credits: Cat Gone Missing → the Gecko God', d:pstep() ? 'Now: ' + pstep().g : SV.flags.godDown ? '✅ Done! Rematch from your statue in the Hall of Paws' : ''}, {e:'✨', n:'God powers', d:['sealBalls', 'starCloak', 'flight'].map(f => ({sealBalls:'Seal-Breaker Snowballs', starCloak:'Starlight Cloak', flight:'Flight (X)'})[f] + (SV.flags[f] ? ' ✅' : ' 🔒')).join(' · ')}] : [];
  SAGA.afterCredits = () => { SV.post = 1; S.say('📌 Something is wrong in Frostpine Village… (follow the 🐾 arrow)', 5); S.save(); };
  // admin
  api.adm.post = () => { SV.post = 1; SV.ch = Math.max(SV.ch, 9); S.save(); S.say('Admin: post-game (Cat Gone Missing) started', 2.5); };
  api.adm.god = n => { SV.post = 1; SV.ch = Math.max(SV.ch, 9); n = Math.max(1, Math.min(4, Math.floor(n))); SV.ps = n == 4 ? PS.findIndex(s2 => s2.k == 'final') : PS.findIndex(s2 => s2.k == 'god' && s2.n == n); ['forbidden', 'above', 'void'].forEach(r => SV.postUnlock[r] = 1); if (n >= 2) SV.flags.sealBalls = 1; if (n >= 3) SV.flags.starCloak = 1; if (n >= 4) SV.flags.flight = 1; SV.flags.godSky = 1; const r = n == 4 ? 'void' : GODN[n].r; SG.enter(r, 0, true); const C = SG.C(), q = SG.W2T(C.lair); p.x = q.x; p.y = q.y + 320; S.save(); S.say('Admin: ' + (n == 4 ? 'the Gecko God' : 'godlike fight ' + n), 2.4); };
  SAGA.post = {gx:() => gx, bossReady, ai:godAI, hurt, down:godDown, drawBoss, drawBar, respawn, drawScreen, drawWorld, mapIcons:(icon, cur, C) => { const s2 = pstep(); if (s2 && (s2.k == 'god' || s2.k == 'final' || s2.k == 'ritual') && cur == s2.r) icon(C.lair, '🌌'); }};
  SAGA.postModal = () => !!credits; SAGA.postThings = things; SAGA.postUpdate = update; SAGA.postDrawCamp = drawCamp; SAGA.postDrawTop = drawTop; SAGA.postKey = pkey; SAGA.postDown = pdown; SAGA.postRows = rows;
  // portraits for the new faces
  const portrait0 = S.portraitBase;
  SAGA.postPortrait = (who, x, y, mood) => { if (who == 'dumpG') { drawGod(x - 8, y + 4, .65, {mood}); return true; } if (who == 'oswald') { drawOswald(x, y + 8, {s:1.2}); return true; } if (who.slice(0, 4) == 'kid:' && ['Nell', 'Bram', 'Ivy', 'Gus'].includes(who.slice(4))) { S.kid(x, y + 12, {Nell:'#ff9ad5', Bram:'#8D5B1D', Ivy:'#2fa8e0', Gus:'#9aa0aa'}[who.slice(4)], {face:0}); return true; } return false; };
};
})();
