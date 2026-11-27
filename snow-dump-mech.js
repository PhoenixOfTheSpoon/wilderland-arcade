// Wilderland Arcade · Snow Kingdom · DUMPLING MECHANICS (snow-dump-mech.js)
// Raid-style mechanics for the Dumpling fights (1–6) and the godlike fights, so they are more than "attack and dodge":
//   plates  · step on 3 rune plates in order before time runs out → Dumpling is stunned
//   pillars · FROST BREATH: hide behind an ice pillar (out of his line of sight) or take a big hit
//   shield  · he hides in an ice shield: break the 3 shield crystals first
//   beam    · beam struggle: hit him with snowballs to push the beam back; win = stunned, lose = big hit
//   zone    · a rotating safe wedge: stay inside the turning light
// Every mechanic is announced and telegraphed first; while one runs his normal attacks pause (a breather).
// Hooks: A.dumpMech.tick(B, dt, S, list) → true while a mechanic runs · .draw(g, B, t, player) · .onHit(B, dmg, src) → dmg
(function(){
'use strict';
const A = window.Arcade = window.Arcade || {}, TAU = Math.PI*2;
const NAME = {plates:'RUNE SEAL', pillars:'FROST BREATH', shield:'ICE SHIELD', beam:'BEAM STRUGGLE', zone:'TURNING LIGHT'};
const TIP = {plates:'Step on the rune plates 1 → 2 → 3 before time runs out!', pillars:'Hide behind an ice pillar!', shield:'Break the 3 shield crystals!', beam:'Hit him with snowballs to push the beam back!', zone:'Stay inside the turning light!'};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// spots around the arena middle, never inside rocks or walls (S.blocked) when the engine can tell
const around = (B, n, r0, r1, S) => { const out = [], a0 = Math.random()*TAU; for (let i = 0; i < n; i++) { let q = null; for (let k = 0; k < 24; k++) { const a = a0 + i*TAU/n + (Math.random() - .5)*(.6 + k*.1), r = r0 + Math.random()*(r1 - r0)*(1 - k/30); q = {x:B.hx + Math.cos(a)*r, y:B.hy + Math.sin(a)*r}; if (!(S && S.blocked && S.blocked(q.x, q.y, 22))) break; } out.push(q); } return out; };

const start = (B, k, S) => { const M = B.mk, p = S.p; M.cur = {k, t:0}; const C = M.cur; S.say('⚠ ' + NAME[k] + '! ' + TIP[k], 3); if (S.shakeV != null) S.shakeV = Math.max(S.shakeV, 5);
  if (k == 'plates') { C.pl = around(B, 3, 120, 230, S).map((q, i) => ({...q, n:i + 1, on:0})); C.next = 1; C.max = 11; }
  if (k == 'pillars') { C.pil = around(B, 3, 140, 210, S); C.max = 4.2; }
  if (k == 'shield') { C.max = 22; C.crys = []; for (const q of around(B, 3, 150, 200, S)) { S.spawnFoe('tguard', q.x, q.y); const f = S.foes[S.foes.length - 1]; if (f) { f.mcrys = 1; f.hp = f.max = Math.max(f.hp, 6); C.crys.push(f); } } B.mshield = 1; }
  if (k == 'beam') { C.v = .5; C.max = 8; }
  if (k == 'zone') { C.a = Math.atan2(p.y - B.hy, p.x - B.hx); C.max = 9; C.hit = 1.2; } };

const end = (B, S, win) => { const M = B.mk, C = M.cur; if (!C) return; B.mshield = 0;
  if (C.k == 'shield') for (const f of C.crys) if (!f.dead) f.dead = 1;
  if (win) { B.stunT = Math.max(B.stunT || 0, 4); S.say('💫 ' + NAME[C.k] + ' broken! Dumpling is STUNNED: hit him now!', 2.6); A.sfx && A.sfx('win'); }
  M.cur = null; M.cd = 15 + Math.random()*5; };

const tick = (B, dt, S, list) => { if (!list || !list.length) return false; const M = B.mk = B.mk || {cd:8, i:0, cur:null}, p = S.p;
  if (!M.cur) { M.cd -= dt; if (M.cd <= 0 && !(B.stunT > 0)) { start(B, list[M.i % list.length], S); M.i++; } return false; }
  const C = M.cur; C.t += dt;
  // the boss holds still near the middle while he channels
  B.x += (B.hx - B.x)*Math.min(1, dt*2); B.y += (B.hy - 40 - B.y)*Math.min(1, dt*2);
  if (C.k == 'plates') { const nx = C.pl.find(q => q.n == C.next); if (nx && dist(nx, p) < 34) { nx.on = 1; C.next++; A.sfx && A.sfx('coin'); } else { const wrong = C.pl.find(q => !q.on && q.n > C.next && dist(q, p) < 34); if (wrong && !C.oops) { C.oops = 1; S.say('✖ Wrong plate: follow the numbers!', 1.4); } if (!wrong) C.oops = 0; }
    if (C.next > 3) { end(B, S, true); return false; } if (C.t >= C.max) { S.hurtMe(1); S.say('The runes flare! Try the plates faster next time', 2); end(B, S, false); } return true; }
  if (C.k == 'pillars') { if (C.t >= C.max) { const safe = C.pil.some(q => { const bx = p.x - B.x, by = p.y - B.y, L = Math.hypot(bx, by) || 1, tq = ((q.x - B.x)*bx + (q.y - B.y)*by)/L; if (tq <= 0 || tq >= L) return false; const px = B.x + bx/L*tq, py = B.y + by/L*tq; return Math.hypot(q.x - px, q.y - py) < 30; });
      if (!safe) { S.hurtMe(2); S.say('🥶 Caught in the Frost Breath!', 1.8); } else S.say('🧊 The pillar saved you!', 1.6); if (S.shakeV != null) S.shakeV = 10; end(B, S, safe); } return true; }
  if (C.k == 'shield') { if (C.crys.every(f => f.dead || f.hp <= 0 || !S.foes.includes(f))) { end(B, S, true); return false; } if (C.t >= C.max) { B.hp = Math.min(B.max, B.hp + B.max*.03); S.say('The crystals heal Dumpling a little…', 2); end(B, S, false); } return true; }
  if (C.k == 'beam') { C.v -= dt*.085; if (C.v >= 1) { end(B, S, true); return false; } if (C.v <= 0 || C.t >= C.max) { if (C.v < .5) { S.hurtMe(2); S.say('💥 The beam broke through!', 1.8); end(B, S, false); } else end(B, S, true); } return true; }
  if (C.k == 'zone') { C.a += dt*.65; if (C.t > 1.2) { C.hit -= dt; if (C.hit <= 0) { C.hit = 1.5; const da = Math.abs(((Math.atan2(p.y - B.hy, p.x - B.hx) - C.a) % TAU + TAU*1.5) % TAU - Math.PI); if (dist(p, {x:B.hx, y:B.hy}) < 420 && da > .62) { S.hurtMe(1); S.say('Stay in the light!', 1); } } } if (C.t >= C.max) end(B, S, false); return true; }
  return false; };

const onHit = (B, dmg, src) => { const C = B.mk && B.mk.cur; if (C && C.k == 'beam' && src && src.mine && !src.team) C.v = Math.min(1.05, C.v + .045 + .03*(src.chg || 0)); return B.mshield ? dmg*.05 : dmg; };

const draw = (g, B, t, pp) => { const C = B.mk && B.mk.cur; if (!C) return; const lo = A.lowFx && A.lowFx(); g.save();
  if (C.k == 'plates') { for (const q of C.pl) { const nx = q.n == C.next; g.fillStyle = q.on ? 'rgba(127,224,138,.55)' : nx ? 'rgba(249,191,1,' + (.35 + .2*Math.sin(t*8)) + ')' : 'rgba(150,180,255,.3)'; g.beginPath(); g.ellipse(q.x, q.y, 34, 20, 0, 0, TAU); g.fill(); g.strokeStyle = q.on ? '#7fe08a' : nx ? '#F9BF01' : '#9fb8ff'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#fff'; g.font = '900 18px sans-serif'; g.textAlign = 'center'; g.fillText(q.on ? '✓' : String(q.n), q.x, q.y + 6); }
    bar(g, B, 1 - C.t/C.max, '#F9BF01'); }
  if (C.k == 'pillars') { const k = Math.min(1, C.t/C.max); for (const q of C.pil) { g.fillStyle = 'rgba(20,40,80,.25)'; g.beginPath(); g.ellipse(q.x, q.y + 8, 22, 8, 0, 0, TAU); g.fill(); const gr = g.createLinearGradient(q.x - 16, 0, q.x + 16, 0); gr.addColorStop(0, '#9fd8f5'); gr.addColorStop(.5, '#f0fbff'); gr.addColorStop(1, '#7fb8e0'); g.fillStyle = gr; g.fillRect(q.x - 15, q.y - 62, 30, 66); g.fillStyle = '#e8f8ff'; g.beginPath(); g.moveTo(q.x - 17, q.y - 62); g.lineTo(q.x, q.y - 80); g.lineTo(q.x + 17, q.y - 62); g.fill(); }
    // the breath cone grows (telegraph)
    g.fillStyle = 'rgba(160,220,255,' + (.08 + .22*k) + ')'; g.beginPath(); g.arc(B.x, B.y, 60 + 380*k, 0, TAU); g.fill(); if (!lo) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(B.x, B.y, 60 + 380*k, 0, TAU); g.stroke(); } bar(g, B, 1 - k, '#9fe8ff'); }
  if (C.k == 'shield') { g.strokeStyle = 'rgba(150,230,255,' + (.6 + .3*Math.sin(t*5)) + ')'; g.lineWidth = 5; g.beginPath(); g.arc(B.x, B.y, (B.r || 40) + 18, 0, TAU); g.stroke(); g.fillStyle = 'rgba(150,230,255,.18)'; g.fill();
    g.setLineDash([6, 8]); g.lineWidth = 2; for (const f of C.crys) if (!f.dead) { g.beginPath(); g.moveTo(B.x, B.y); g.lineTo(f.x, f.y); g.stroke(); } g.setLineDash([]); bar(g, B, 1 - C.t/C.max, '#64CDF5'); }
  if (C.k == 'beam') { const P = pp; if (P) { const mx = B.x + (P.x - B.x)*(1 - C.v), my = B.y + (P.y - 10 - B.y)*(1 - C.v); g.lineCap = 'round'; g.strokeStyle = 'rgba(160,140,255,.85)'; g.lineWidth = 12; g.beginPath(); g.moveTo(B.x, B.y); g.lineTo(mx, my); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 9; g.beginPath(); g.moveTo(P.x, P.y - 10); g.lineTo(mx, my); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(mx, my, 10 + 3*Math.sin(t*20), 0, TAU); g.fill(); } bar(g, B, C.v, C.v > .5 ? '#7fe08a' : '#ff6a6a'); }
  if (C.k == 'zone') { const R = 420; g.fillStyle = C.t > 1.2 ? 'rgba(255,69,57,.16)' : 'rgba(255,69,57,.08)'; g.beginPath(); g.moveTo(B.hx, B.hy); g.arc(B.hx, B.hy, R, C.a + .62, C.a - .62 + TAU); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,240,170,.28)'; g.beginPath(); g.moveTo(B.hx, B.hy); g.arc(B.hx, B.hy, R, C.a - .62, C.a + .62); g.closePath(); g.fill(); bar(g, B, 1 - C.t/C.max, '#ffe27a'); }
  g.restore(); };
const bar = (g, B, k, col) => { const w = 120, x = B.x - w/2, y = B.y - (B.r || 40) - 58; g.fillStyle = 'rgba(10,16,36,.7)'; g.fillRect(x - 2, y - 2, w + 4, 10); g.fillStyle = col; g.fillRect(x, y, w*Math.max(0, Math.min(1, k)), 6); };

A.dumpMech = {tick, draw, onHit, NAME};
})();
