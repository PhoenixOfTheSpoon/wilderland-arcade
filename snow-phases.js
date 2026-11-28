// Wilderland Arcade · Snow Kingdom · EVERY BOSS PHASE PLAYS DIFFERENTLY (snow-phases.js) — A.snowPhases(C)
// - Each phase of a 3+ phase boss has its OWN stagger method (no repeats within a boss), shown under the boss bar with a hint.
//   Phase 1 keeps the classic charged-throw stagger; at least one later phase reflects or ignores charged throws.
// - Variety bonus: repeating the same action (charged after charged…) gives less stagger AND damage, down to 25%. Switching resets it.
// - Bosses resist stagger for 3 s after a stun; each stun still raises the next stagger need (stgNeed in snow-world.js).
// - From phase 2 every boss also changes its arena; bosses without their own scripted brain also get a new attack set and movement.
// - A clear phase-change moment: roar, shake, a 2.5 s breather, and a banner naming what changed.
// Raid bosses keep their own action-based mechanics (wings, walls, casts, mirrors…). Fair: telegraphs ≥ 0.9 s, cooldowns, no one-shots.
(function () {
const A = window.Arcade = window.Arcade || {}, TAU = Math.PI*2;
const STG = {
  classic:{e:'💥', n:'Charged throws', h:'Charged throws fill the stagger bar'},
  reflect:{e:'🪞', n:'Reflect', h:'It REFLECTS charged throws! Use quick plain shots and teammates'},
  weak:{e:'🔮', n:'Weak point', h:'Only hits on the glowing gem fill stagger'},
  counter:{e:'⚡', n:'Counter', h:'Hit it DURING its glowing wind-up to interrupt it'},
  brk:{e:'🔷', n:'Break', h:'Smash the 3 shield pylons first'},
  env:{e:'🧊', n:'Environment', h:'Knock an icicle down while it stands under it'},
  team:{e:'🤝', n:'Teamwork', h:'Teammate hits (and your hit right after one) fill stagger'},
  status:{e:'❄', n:'Frostbite', h:'Pile up 12 quick hits before the frost fades'},
  speed:{e:'💨', n:'Speed', h:'Too fast for charged throws: rapid shots, or trap it in a Blizzard Bomb'},
  parry:{e:'🌀', n:'Parry', h:'Roll (Shift) through its shots at the last moment'},
  lure:{e:'🍪', n:'Lure', h:'Walk over a treat to drop it: hit the boss while it eats'}};
const MOVE = {teleport:'Teleporting', charge:'Charging', burrow:'Burrowing', fly:'Flying', zig:'Side-stepping'};
const ARENA = {crack:'The ice cracks', walls:'The walls close in', dark:'Darkness', wind:'Wind', flood:'Rising water'};
const ATK = {ring:'Shot rings', spiral:'Spirals', rain:'Hail rain', cross:'Cross beams', adds:'Calls helpers'};
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const pick = (list, seed, n, avoid = []) => { const L = list.filter(k => !avoid.includes(k)), out = []; let s = seed || 1; while (out.length < n && L.length) { s = (s*1103515245 + 12345) >>> 0; out.push(L.splice(s % L.length, 1)[0]); } return out; };
A.snowPhases = C => {
  const {W, BOSS, p, TS} = C, NO = {}; let st = null, hz = [], told = W.phTold = W.phTold || {};
  const plan = B => { const np = B.phases || 3, seed = hashS(B.k), brain = !!(BOSS[B.k] && BOSS[B.k].brain), pool = Object.keys(STG).filter(k => k != 'classic' && (k != 'team' || (C.mates && C.mates.length)));
    let rest = pick(pool, seed, np - 1); if (!rest.some(k => k == 'reflect' || k == 'speed')) rest[Math.min(rest.length - 1, seed % Math.max(1, rest.length))] = seed % 2 ? 'reflect' : 'speed';
    rest = rest.filter((k, i) => rest.indexOf(k) == i); while (rest.length < np - 1) rest.push(pool.find(k => !rest.includes(k)) || 'weak');
    return {stg:['classic', ...rest], arena:[null, ...pick(Object.keys(ARENA), seed >> 3, np - 1)], move:brain ? [] : [null, ...pick(Object.keys(MOVE), seed >> 5, np - 1)], atk:brain ? [] : [null, ...pick(Object.keys(ATK), seed >> 7, np - 1)], brain}; };
  const on = B => !!B && !C.isRB(B) && (B.phases || 3) >= 3;
  const S0 = B => { if (!st || st.B !== B) { st = {B, P:plan(B), ph:0, last:'', rep:0, plainN:0, t:{}, stack:0, gem:0, pyl:null, ice:null, wind:null, treat:null, eat:0, wall:0, res:0, wasStun:0, brk:0, teamT:-9, roar:0, dash:null, hide:0}; hz = []; } return st; };
  const cur = B => { const s = S0(B), i = Math.max(0, Math.min(s.P.stg.length - 1, (B.ph || 1) - 1)); return {s, stg:s.P.stg[i], arena:s.P.arena[i], move:s.P.move[i], atk:s.P.atk[i]}; };
  const near = (a, b, r) => Math.hypot(a.x - b.x, a.y - b.y) < r;
  const kindOf = src => !src ? 'other' : src.team ? 'team' : !src.mine ? 'other' : (src.chg || 0) >= .5 ? 'chg' : src.ab ? 'ab' : 'plain';
  // ---------- every hit on a boss goes through here: returns {dmg, stg} ----------
  const hit = (B, dmg, src) => { if (!on(B)) return null; const {s, stg} = cur(B), k = kindOf(src), need = C.stgNeed(B); let g = 0;
    if (s.hide > 0) return {dmg:0, stg:0};
    // variety bonus (your own actions only): the same trick again and again fades to 25%
    let vm = 1; if (k == 'chg' || k == 'ab' || k == 'plain') { if (k == 'plain') { s.plainN++; if (s.last == 'plain' && s.plainN % 6 == 0) s.rep++; } else if (s.last == k) s.rep++; if (s.last != k) { s.rep = 0; s.plainN = 1; } s.last = k;
      vm = Math.max(.25, Math.pow(.78, s.rep)); if (vm < .7 && !told.same) { told.same = 1; C.say('🔁 Same trick! Switch it up: repeating one move does less and less', 3); } s.vm = vm; }
    const charged = k == 'chg';
    if (stg == 'classic') g = charged ? 8 + 14*src.chg : k == 'plain' ? 1.2 : k == 'team' ? 2 : 0;
    else if (stg == 'reflect') { if (charged) { const a = Math.atan2(p.y - B.y, p.x - B.x); if (C.balls.length < 260) C.balls.push({x:B.x + Math.cos(a)*(B.r + 12), y:B.y + Math.sin(a)*(B.r + 12), vx:Math.cos(a)*360, vy:Math.sin(a)*360, mine:0, dmg:1, r:9, life:2.5, col:'#bfefff'}); C.addNum(B.x, B.y - B.r - 30, '🪞 REFLECTED!', '#9fe8ff'); return {dmg:0, stg:0}; } g = k == 'plain' ? 6 : k == 'team' ? 8 : 0; }
    else if (stg == 'weak') { const gp = gemAt(B); if (src && src.x != null && Math.hypot(src.x - gp.x, src.y - gp.y) < 30) { g = charged ? 38 : 22; dmg *= 1.5; C.addNum(gp.x, gp.y - 18, 'WEAK POINT!', '#F9BF01'); } }
    else if (stg == 'counter') { if (s.wind && s.wind.t > 0) { s.wind = null; g = need*.6; C.addNum(B.x, B.y - B.r - 30, '⚡ INTERRUPTED!', '#F9BF01'); } }
    else if (stg == 'brk') { if (s.pyl && s.pyl.some(q => q.hp > 0)) { dmg *= .3; g = 0; } else g = charged ? 10 : 3; }
    else if (stg == 'env') g = 0;
    else if (stg == 'team') { if (k == 'team') { g = 10; s.teamT = C.t; } else if (C.t - s.teamT < 1.2 && (k == 'plain' || charged)) { g = 26; s.teamT = -9; C.addNum(B.x, B.y - B.r - 30, '🤝 TEAM COMBO!', '#EA55AB'); } }
    else if (stg == 'status') { s.stack = Math.min(12, s.stack + 1); s.stT = 1.6; if (s.stack >= 12) { s.stack = 0; g = need; } }
    else if (stg == 'speed') { const inBomb = C.fire && C.fire() && C.fire().zones().some(z => Math.hypot(z.x - B.x, z.y - B.y) < z.r); if (charged && !inBomb) { dmg *= .2; C.addNum(B.x, B.y - B.r - 30, '💨 Too fast!', '#9fe8ff'); g = 0; } else g = inBomb ? 30 : k == 'plain' ? 7 : 4; }
    else if (stg == 'parry') g = s.parT > 0 ? (charged ? 30 : 12) : 0;
    else if (stg == 'lure') g = s.eat > 0 ? (charged ? 45 : 18) : 0;
    if (s.res > 0) g = 0;   // just got up from a stun: resists stagger for a moment
    return {dmg:dmg*vm, stg:g*vm}; };
  const gemAt = B => { const s = S0(B), a = s.gem; return {x:B.x + Math.cos(a)*(B.r + 10), y:B.y - 8 + Math.sin(a)*(B.r + 6)}; };
  // ---------- before the boss's own AI: movement overrides (return true = skip its AI this frame) ----------
  const preAI = (B, dt) => { if (!on(B) || !dt) return false; const {s, move, stg} = cur(B);
    if (stg == 'lure' && s.eat > 0) { s.eat -= dt; return true; }
    if (stg == 'lure' && s.treat && s.treat.down) { const tr = s.treat, a = Math.atan2(tr.y - B.y, tr.x - B.x); B.x += Math.cos(a)*170*dt; B.y += Math.sin(a)*170*dt; if (near(B, tr, 30)) { s.eat = 3.2; s.treat = null; C.say('🍪 It’s eating! Hit it now', 1.8); } return true; }
    if (s.dash) { const D = s.dash; D.t -= dt; if (D.w > 0) { D.w -= dt; return true; } B.x += Math.cos(D.a)*640*dt; B.y += Math.sin(D.a)*640*dt; if (Math.hypot(B.x - B.hx, B.y - B.hy) > 620 || C.solidAt(B.x, B.y)) D.t = 0; if (!D.hit && near(B, p, B.r + 20)) { D.hit = 1; C.hurtMe(1); } if (D.t <= 0) s.dash = null; return true; }
    if (s.hide > 0) { s.hide -= dt; if (s.hide <= 0 && s.burrow) { B.x = s.burrow.x; B.y = s.burrow.y; s.burrow = null; C.splat(B.x, B.y, 22, '#d8c8a8'); } return true; }
    return false; };
  // an open spot around the arena centre near the wanted angle (pylons, icicles and treats never sit inside trees or rocks)
  const spot = (B, a0, rx, ry) => { for (let k = 0; k < 24; k++) { const a = a0 + (k % 2 ? 1 : -1)*Math.ceil(k/2)*.2, f = 1 - Math.floor(k/12)*.3, x = B.hx + Math.cos(a)*rx*f, y = B.hy + Math.sin(a)*ry*f; if (!C.blocked(x, y, 18)) return {x, y}; } return {x:B.hx + Math.cos(a0)*rx*.5, y:B.hy + Math.sin(a0)*ry*.5}; };
  const leash = (B, x, y) => Math.hypot(x - B.hx, y - B.hy) < 600 && !C.solidAt(x, y);
  // ---------- every frame of a boss fight ----------
  const tick = dt => { const B = C.boss; if (!on(B)) { if (st) { st = null; hz = []; } return; } const {s, stg, arena, move, atk} = cur(B), T = s.t, tm = C.tm ? C.tm('spd') : 1, cd = (k, v) => { T[k] = (T[k] == null ? v*.5 : T[k]) - dt; if (T[k] <= 0) { T[k] = v/Math.min(1.4, tm); return true; } return false; };
    // phase change moment
    if ((B.ph || 1) != s.ph) { const first = !s.ph; s.ph = B.ph || 1; s.stack = 0; s.wind = null; s.pyl = null; s.ice = null; s.treat = null; s.eat = 0; s.rep = 0; hz = []; for (const k in T) T[k] = Math.max(T[k], 2.5);
      const parts = [STG[stg].e + ' ' + STG[stg].n, arena && ARENA[arena], move && MOVE[move], atk && ATK[atk]].filter(Boolean);
      if (!first) { C.shakeV = Math.max(C.shakeV, 10); B.flash = .6; A.sfx && A.sfx('bad'); if (!(BOSS[B.k] || {}).brain) { B.talk = ['', '*ROOOAR!*', '*a furious howl*', '*the ground shakes*', '*ROOOOOAR!!*'][Math.min(4, s.ph)] || '*ROAR*'; B.talkT = 2.2; } s.roar = 2.5; }
      C.say((first ? '⚔ ' : '⚠ PHASE ' + s.ph + ' · ') + parts.join(' · ') + ' — ' + STG[stg].h, 4); }
    if (s.roar > 0) s.roar -= dt;
    if (B.stunT > 0) s.wasStun = 1; else if (s.wasStun) { s.wasStun = 0; s.res = 3; if (stg == 'brk') s.pyl = null; } if (s.res > 0) s.res -= dt;
    if (s.stT > 0) { s.stT -= dt; if (s.stT <= 0 && s.stack > 0) { s.stack--; s.stT = .5; } }
    if (s.parT > 0) s.parT -= dt;
    s.gem += dt*1.3;
    const balls = C.balls, mine = balls.filter(b => b.mine && b.life > 0);
    // stagger set-ups
    if (stg == 'counter' && B.stunT <= 0 && s.roar <= 0) { if (s.wind) { s.wind.t -= dt; if (s.wind.t <= 0) { for (let i = 0; i < 10; i++) C.shot(B, i/10*TAU, 230, {col:'#ffe07a', r:7}); s.wind = null; } } else if (cd('wind', 5)) s.wind = {t:1.1, m:1.1}; }
    if (stg == 'brk' && B.stunT <= 0) { if (!s.pyl) s.pyl = [0, 1, 2].map(i => ({...spot(B, i/3*TAU + .5, 210, 160), hp:4})); for (const q of s.pyl) { if (q.hp <= 0) continue; for (const b of mine) if (near(b, q, 26)) { b.life = 0; q.hp -= (b.chg || 0) >= .5 ? 2 : 1; C.splat(q.x, q.y, 6, '#9fe8ff'); if (q.hp <= 0) { C.addStg(B, C.stgNeed(B)*.4); C.say('🔷 Pylon broken (' + s.pyl.filter(z => z.hp <= 0).length + '/3)', 1.6); } } } }
    if (stg == 'env') { if (!s.ice) s.ice = [0, 1, 2].map(i => ({...spot(B, i/3*TAU + 1.1, 230, 170), f:0, re:0})); for (const q of s.ice) { if (q.re > 0) { q.re -= dt; continue; } if (q.f > 0) { q.f -= dt; if (q.f <= 0) { q.re = 7; C.splat(q.x, q.y, 18, '#cfefff'); C.shakeV = Math.max(C.shakeV, 5); if (near(B, q, 105)) { C.addStg(B, C.stgNeed(B)); C.say('🧊 Icicle hit! STUNNED', 2); } if (near(p, q, 60)) C.hurtMe(1); } continue; } for (const b of mine) if (near(b, q, 28)) { b.life = 0; q.f = .55; } } }
    if (stg == 'lure') { if (!s.treat && !s.eat && cd('treat', 9)) { s.treat = spot(B, Math.random()*TAU, 200, 150); } if (s.treat && !s.treat.down && near(p, s.treat, 40)) { s.treat.down = 1; C.say('🍪 Treat dropped! Watch it come for it', 1.6); } }
    if (stg == 'parry' && C.p.roll > 0) for (const b of balls) if (!b.mine && b.life > 0 && near(b, p, 40)) { b.life = 0; s.parT = 1.6; C.addNum(p.x, p.y - 40, '🌀 PARRY!', '#F9BF01'); C.addStg(B, C.stgNeed(B)*.35); break; }
    if (stg == 'speed' && !s.prev) s.prev = {x:B.x, y:B.y}; if (stg == 'speed' && B.stunT <= 0 && !s.dash) { const dx = B.x - s.prev.x, dy = B.y - s.prev.y; if (leash(B, B.x + dx*.9, B.y + dy*.9)) { B.x += dx*.9; B.y += dy*.9; } } s.prev = {x:B.x, y:B.y};
    if (B.stunT > 0 || s.roar > 0) return tickHz(dt);
    // movement styles (bosses without their own scripted brain)
    if (move == 'teleport' && cd('tp', 6)) { const a = Math.random()*TAU, x = p.x + Math.cos(a)*260, y = p.y + Math.sin(a)*220; if (leash(B, x, y)) { C.splat(B.x, B.y, 14, '#c9b0ff'); B.x = x; B.y = y; C.splat(x, y, 14, '#c9b0ff'); } }
    if (move == 'charge' && !s.dash && cd('ch', 7)) s.dash = {a:Math.atan2(p.y - B.y, p.x - B.x), w:.9, t:.55, wm:.9};
    if (move == 'burrow' && !s.hide && cd('bu', 9)) { s.hide = 1.6; s.burrow = {x:p.x, y:p.y}; C.splat(B.x, B.y, 22, '#d8c8a8'); B.x = B.hx; B.y = B.hy - 1e5;   /* underground: off the field until it bursts up */ hz.push({c:1, x:p.x, y:p.y, r:90, w:1.5, wm:1.5, b:0}); }
    if (move == 'zig' && cd('zz', 2.2)) { const a = Math.atan2(p.y - B.y, p.x - B.x) + (Math.random() < .5 ? 1 : -1)*Math.PI/2, x = B.x + Math.cos(a)*110, y = B.y + Math.sin(a)*110; if (leash(B, x, y)) { B.x = x; B.y = y; } }
    if (move == 'fly') { s.fa = (s.fa || 0) + dt*.9; const x = p.x + Math.cos(s.fa)*240, y = p.y + Math.sin(s.fa)*180; if (leash(B, B.x + (x - B.x)*dt*1.5, B.y + (y - B.y)*dt*1.5)) { B.x += (x - B.x)*dt*1.5; B.y += (y - B.y)*dt*1.5; } }
    // attack sets
    if (atk == 'ring' && cd('ring', 5.5)) for (let i = 0; i < 12; i++) C.shot(B, i/12*TAU + C.t, 230, {col:'#ffffff', r:7});
    if (atk == 'spiral') { if (cd('spi', 7)) s.spi = 2.6; if (s.spi > 0) { s.spi -= dt; s.spT = (s.spT || 0) - dt; if (s.spT <= 0) { s.spT = .22; const a = C.t*3; C.shot(B, a, 210, {col:'#c9e8ff', r:6}); C.shot(B, a + Math.PI, 210, {col:'#c9e8ff', r:6}); } } }
    if (atk == 'rain' && cd('rain', 6)) for (let i = 0; i < 4; i++) { const a = Math.random()*TAU, r = i ? 70 + Math.random()*120 : 0; hz.push({c:1, x:p.x + Math.cos(a)*r, y:p.y + Math.sin(a)*r, r:50, w:1, wm:1, b:0}); }
    if (atk == 'cross' && cd('crs', 8)) { const a0 = Math.random() < .5 ? 0 : Math.PI/4; for (let i = 0; i < 2; i++) hz.push({x:B.x, y:B.y, ang:a0 + i*Math.PI/2, len:900, wd:44, w:1.1, wm:1.1, b:0}); }
    if (atk == 'adds' && cd('adds', 14)) { const pool = ((C.REG[C.regAt(B.x, B.y)] || {}).pool) || ['goon']; if (C.foes.filter(f => f.phAdd && !f.dead).length < 4) for (let i = 0; i < 2; i++) { const x = B.x + (i ? 70 : -70), y = B.y + 50; if (!C.solidAt(x, y)) { C.spawnFoe(pool[i % pool.length], x, y); const f = C.foes[C.foes.length - 1]; if (f) f.phAdd = 1; } } }
    // arena changes (every boss)
    if (arena == 'crack' && cd('crk', 4)) for (let i = 0; i < 2; i++) { const a = Math.random()*TAU, r = i ? 90 + Math.random()*90 : 0; hz.push({c:1, x:p.x + Math.cos(a)*r, y:p.y + Math.sin(a)*r, r:58, w:1, wm:1, b:0, ice:1}); }
    if (arena == 'walls') { s.wall = Math.min(1, s.wall + dt/20); const R = 720 - 330*s.wall, d = Math.hypot(p.x - B.hx, p.y - B.hy); if (d > R) { const a = Math.atan2(p.y - B.hy, p.x - B.hx); p.x -= Math.cos(a)*120*dt; p.y -= Math.sin(a)*120*dt; s.wallT = (s.wallT || 0) - dt; if (s.wallT <= 0) { s.wallT = 1.2; C.hurtMe(1); } } }
    if (arena == 'wind') { if (!s.wind2 || cd('wd', 8)) s.wind2 = {a:Math.random()*TAU}; const nx = p.x + Math.cos(s.wind2.a)*70*dt, ny = p.y + Math.sin(s.wind2.a)*70*dt; if (!C.blocked(nx, ny, 14)) { p.x = nx; p.y = ny; } }
    if (arena == 'flood' && cd('fl', 9)) { const side = Math.floor(Math.random()*4), a = side*Math.PI/2; hz.push({x:B.hx + Math.cos(a)*260, y:B.hy + Math.sin(a)*260, ang:a + Math.PI/2, len:1400, wd:380, w:1.5, wm:1.5, b:0, water:1}); }
    tickHz(dt); };
  const tickHz = dt => { for (const h of hz) { if (h.w > 0) { h.w -= dt; if (h.w <= 0) { h.b = .3; let hit; if (h.c) hit = Math.hypot(p.x - h.x, p.y - h.y) < h.r; else { const dx = p.x - h.x, dy = p.y - h.y, al = dx*Math.cos(h.ang) + dy*Math.sin(h.ang), pe = -dx*Math.sin(h.ang) + dy*Math.cos(h.ang); hit = Math.abs(al) < h.len/2 && Math.abs(pe) < h.wd/2; } if (hit) C.hurtMe(1); C.shakeV = Math.max(C.shakeV, 3); } } else h.b -= dt; }
    hz = hz.filter(h => h.w > 0 || h.b > 0); };
  // ---------- drawing ----------
  const drawWorld = () => { const B = C.boss; if (!on(B) || !st) return; const g = C.g, t = C.t, {s, stg, arena} = cur(B);
    for (const h of hz) { g.save(); const k = h.w > 0 ? 1 - h.w/h.wm : 1, col = h.water ? '80,150,230' : h.ice ? '150,210,255' : '255,90,40';
      if (h.c) { if (h.w > 0) { g.fillStyle = 'rgba(' + col + ',' + (.12 + .25*k) + ')'; g.strokeStyle = 'rgba(' + col + ',.9)'; g.lineWidth = 2; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(h.x, h.y, h.r*k, 0, TAU); g.stroke(); } else { g.globalAlpha = h.b/.3; g.fillStyle = 'rgb(' + col + ')'; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); } }
      else { g.translate(h.x, h.y); g.rotate(h.ang); g.fillStyle = h.w > 0 ? 'rgba(' + col + ',' + (.12 + .28*k) + ')' : 'rgba(' + col + ',' + h.b/.3 + ')'; g.fillRect(-h.len/2, -h.wd/2, h.len, h.wd); }
      g.restore(); }
    if (s.dash && s.dash.w > 0) { g.save(); g.globalAlpha = .4; g.strokeStyle = '#ff5030'; g.lineWidth = 12; g.beginPath(); g.moveTo(B.x, B.y); g.lineTo(B.x + Math.cos(s.dash.a)*320, B.y + Math.sin(s.dash.a)*320); g.stroke(); g.restore(); }
    if (stg == 'weak' && s.hide <= 0) { const q = gemAt(B), k = .6 + .4*Math.sin(t*8); g.fillStyle = 'rgba(249,191,1,' + (.25*k) + ')'; g.beginPath(); g.arc(q.x, q.y, 22, 0, TAU); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(q.x, q.y - 10); g.lineTo(q.x + 8, q.y); g.lineTo(q.x, q.y + 10); g.lineTo(q.x - 8, q.y); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
    if (stg == 'counter' && s.wind) { const k = 1 - s.wind.t/s.wind.m; g.strokeStyle = 'rgba(255,224,122,' + (.5 + .5*k) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(B.x, B.y, B.r + 14 + 20*(1 - k), 0, TAU); g.stroke(); }
    if (stg == 'brk' && s.pyl) { const up = s.pyl.some(q => q.hp > 0); for (const q of s.pyl) { if (q.hp <= 0) continue; g.fillStyle = '#5a7aa0'; g.fillRect(q.x - 10, q.y - 34, 20, 40); g.fillStyle = '#9fe8ff'; g.beginPath(); g.moveTo(q.x, q.y - 52); g.lineTo(q.x + 10, q.y - 36); g.lineTo(q.x, q.y - 28); g.lineTo(q.x - 10, q.y - 36); g.fill(); if (up) { g.strokeStyle = 'rgba(159,232,255,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(q.x, q.y - 36); g.lineTo(B.x, B.y - 10); g.stroke(); } }
      if (up) { g.strokeStyle = 'rgba(159,232,255,.7)'; g.lineWidth = 3; g.beginPath(); g.arc(B.x, B.y - 6, B.r + 16, 0, TAU); g.stroke(); } }
    if (stg == 'env' && s.ice) for (const q of s.ice) { if (q.re > 0) continue; g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(q.x, q.y, 34 + (q.f > 0 ? 20 : 0), 10, 0, 0, TAU); g.fill(); const y0 = q.y - 70 + (q.f > 0 ? (1 - q.f/.55)*60 : 0); g.fillStyle = '#cfefff'; g.beginPath(); g.moveTo(q.x - 12, y0 - 30); g.lineTo(q.x + 12, y0 - 30); g.lineTo(q.x, y0 + 14); g.fill(); g.strokeStyle = '#7ab8e0'; g.lineWidth = 1.5; g.stroke(); }
    if (stg == 'lure' && s.treat) { const q = s.treat; g.fillStyle = '#c8894a'; g.beginPath(); g.arc(q.x, q.y, 11, 0, TAU); g.fill(); g.fillStyle = '#5a3a1a'; [[-4, -3], [3, 2], [-1, 4]].forEach(o => { g.beginPath(); g.arc(q.x + o[0], q.y + o[1], 1.8, 0, TAU); g.fill(); }); if (!q.down) { g.strokeStyle = 'rgba(249,191,1,.7)'; g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, 18 + 3*Math.sin(t*6), 0, TAU); g.stroke(); } }
    if (arena == 'walls') { g.strokeStyle = 'rgba(160,200,240,.8)'; g.lineWidth = 10; g.setLineDash([18, 10]); g.beginPath(); g.arc(B.hx, B.hy, 720 - 330*s.wall, 0, TAU); g.stroke(); g.setLineDash([]); } };
  const drawScreen = () => { const B = C.boss; if (!on(B) || !st) return; const g = C.g, VW = C.VW, VH = C.VH, {s, arena} = cur(B);
    if (arena == 'dark' && !C.low()) { const px = p.x - C.cam.x, py = p.y - C.cam.y, gr = g.createRadialGradient(px, py, 120, px, py, 360); gr.addColorStop(0, 'rgba(6,10,30,0)'); gr.addColorStop(1, 'rgba(6,10,30,.82)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); }
    else if (arena == 'dark') { g.fillStyle = 'rgba(6,10,30,.45)'; g.fillRect(0, 0, VW, VH); }
    if (arena == 'wind' && s.wind2) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for (let i = 0; i < 14; i++) { const x = (i*137 + C.t*260*Math.cos(s.wind2.a)) % VW, y = (i*71 + C.t*260*Math.sin(s.wind2.a)) % VH, X2 = (x + VW) % VW, Y2 = (y + VH) % VH; g.beginPath(); g.moveTo(X2, Y2); g.lineTo(X2 + Math.cos(s.wind2.a)*26, Y2 + Math.sin(s.wind2.a)*26); g.stroke(); } } };
  const drawHud = TY => { const B = C.boss; if (!on(B) || !st) return; const g = C.g, {s, stg} = cur(B), M = STG[stg]; let txt = M.e + ' ' + M.n + ': ' + M.h;
    if (stg == 'status') txt += ' (' + s.stack + '/12)'; if (stg == 'brk' && s.pyl) txt += ' (' + s.pyl.filter(q => q.hp <= 0).length + '/3)'; if (s.res > 0) txt = '⛔ Stagger resisted for a moment'; if (W.phDbg) txt += ' · variety ×' + (s.vm || 1).toFixed(2) + ' · ' + stg;
    g.font = '700 11px ' + A.font; g.textAlign = 'center'; const tw = Math.min(C.VW - 20, g.measureText(txt).width + 18); g.fillStyle = 'rgba(20,32,74,.82)'; g.beginPath(); g.roundRect ? g.roundRect(C.VW/2 - tw/2, TY + 110, tw, 20, 10) : g.rect(C.VW/2 - tw/2, TY + 110, tw, 20); g.fill(); g.fillStyle = '#fff'; g.fillText(txt, C.VW/2, TY + 124); };
  const adm = {phase:n => { const B = C.boss; if (!B) return C.say('Admin: start a boss fight first', 2); const np = B.phases || 3, k = Math.max(1, Math.min(np, n|0)); B.hp = B.max*(1 - (k - 1)/np) - 1; B.ph = k; C.say('Admin: boss phase ' + k, 2); },
    dbg:() => { W.phDbg = W.phDbg ? 0 : 1; C.say('Admin: stagger method + variety ' + (W.phDbg ? 'shown' : 'hidden'), 2); }, state:() => st && {stg:cur(st.B).stg, plan:st.P, vm:st.vm || 1, res:st.res, stack:st.stack, hz:hz.length, treat:st.treat, eat:st.eat, pyl:st.pyl, ice:st.ice, wind:!!st.wind}};
  return {hit, preAI, tick, drawWorld, drawScreen, drawHud, adm, STG};
};
})();
