// Wilderland Arcade · Snow Kingdom · NEW ENEMIES (snow-kindled.js) — The Burning Winter, part 3
// LIT'S FIRE ARMY, "the Kindled" (they only appear through the Lit story and fire events, after the Gecko God):
//   Ember Imp (fast, lights fires as it runs) · Cinder Hound (chases you, leaves a burning trail) · Smoke Bat (blinds you with smoke)
//   Ash Wraith (only shows in cold light; hits hard to see, soft to hit inside a chill) · Magma Golem (armoured until cooled by frost)
//   Fire Moth (drawn to your Cold Lantern and drains it) · Kindled Cultist (heals the Kindled, starts fires) · Flame Wisp (explodes into fire)
// WILD CREATURES of the Wider Kingdom (they roam the new regions now):
//   Frost Wolves (packs) · Ice Eagles (Northwatch, telegraphed dives) · Mirrormere Ice Serpent (rare) · Quarry Rock Crabs (armoured)
//   Marsh Lurkers (hidden until close) · Starlight Elk (peaceful and rare: stand near one quietly and it trusts you)
// All custom canvas art; all follow Threat scaling (spawnFoe) and give the usual drops.
(function(){
'use strict';
const A = window.Arcade = window.Arcade || {}, TAU = Math.PI*2;
const FOE = {
  k_imp:{n:'Ember Imp', hp:3, sp:165, melee:1, r:12, pts:45, kx:1, fire:1},
  k_hound:{n:'Cinder Hound', hp:6, sp:170, melee:2, r:16, pts:75, kx:1, fire:1},
  k_bat:{n:'Smoke Bat', hp:2, sp:150, melee:1, fly:1, r:12, pts:50, kx:1, fire:1},
  k_wraith:{n:'Ash Wraith', hp:7, sp:95, melee:2, fly:1, r:15, pts:90, kx:1, fire:1},
  k_golem:{n:'Magma Golem', hp:22, sp:38, shoot:3, big:1, r:24, pts:160, kx:1, fire:1},
  k_moth:{n:'Fire Moth', hp:1, sp:140, fly:1, r:10, pts:30, kx:1, fire:1},
  k_cult:{n:'Kindled Cultist', hp:6, sp:70, shoot:2.8, r:15, pts:95, kx:1, fire:1},
  k_wisp:{n:'Flame Wisp', hp:2, sp:120, fly:1, r:12, pts:55, kx:1, fire:1},
  w_wolf:{n:'Frost Wolf', hp:4, sp:150, melee:1, r:15, pts:55, kx:1, pack:1},
  w_eagle:{n:'Ice Eagle', hp:4, sp:130, fly:1, r:16, pts:70, kx:1},
  w_serpent:{n:'Mirrormere Ice Serpent', hp:40, sp:30, shoot:2.6, big:1, r:28, pts:300, kx:1, rare:1},
  w_crab:{n:'Quarry Rock Crab', hp:9, sp:55, melee:2, r:17, pts:80, kx:1},
  w_lurker:{n:'Marsh Lurker', hp:6, sp:120, melee:2, r:16, pts:85, kx:1},
  w_elk:{n:'Starlight Elk', hp:999, sp:90, r:18, pts:0, kx:1, peaceful:1, rare:1}};
// the new regions' pools: wild creatures join (rare ones show up now and then)
const POOLS = {pinecrest:['w_wolf', 'w_wolf'], mirrormere:['w_serpent'], northwatch:['w_eagle', 'w_eagle'], quarry:['w_crab', 'w_crab'], marsh:['w_lurker', 'w_lurker'], tundra:['w_wolf', 'w_elk'], ravenwatch:['w_wolf']};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

A.snowKindled = {FOE, POOLS, make:C => {   // C: {p, foes(), FX(), shot, hurtMe, spawnFoe, addNum, say, give, TS, low, t()}
  let smoke = [];
  // behaviour: return true to skip the normal movement/attack code this frame
  const ai = (f, F, dt, d, ang) => { const P = C.p, FX = C.FX(); f.kt = (f.kt || 0) + dt;
    if (F.fire && FX && !f.hs) { f.hs = {x:f.x, y:f.y, r:F.big ? 150 : 90, h:F.big ? .7 : .35}; FX.heatSrc.push(f.hs); } if (f.hs) { f.hs.x = f.x; f.hs.y = f.y; }
    const fireAt = (o) => { if (!FX) return; FX.ignite(Math.floor(f.x/C.TS), Math.floor(f.y/C.TS), o || {hp:2, life:7}); };
    switch (f.k) {
      case 'k_imp': f.ig = (f.ig || 1.5) - dt; if (f.ig <= 0 && d < 520) { f.ig = 1.6; fireAt(); } return false;
      case 'k_hound': f.ig = (f.ig || .5) - dt; if (f.ig <= 0 && d < 420) { f.ig = .55; fireAt({hp:1, life:4}); } return false;
      case 'k_bat': f.sm = (f.sm == null ? 3 : f.sm) - dt; if (f.sm <= 0 && d < 320) { f.sm = 7; smoke.push({x:P.x + (Math.random() - .5)*60, y:P.y + (Math.random() - .5)*60, t:4, max:4}); C.say('💨 Smoke! Keep moving', 1.2); } return false;
      case 'k_moth': if (FX && FX.lantern() && d < 500) { f.x += Math.cos(ang)*F.sp*1.2*dt; f.y += Math.sin(ang)*F.sp*1.2*dt; if (d < 60) { FX.F.lc = Math.max(0, FX.F.lc - dt*4); if (!f.dr) { f.dr = 1; C.say('🦋 A Fire Moth is draining your Cold Lantern!', 1.6); } } return true; } return false;
      case 'k_cult': f.hl = (f.hl || 3) - dt; if (f.hl <= 0) { f.hl = 3; for (const o of C.foes()) if (!o.dead && o !== f && FOE[o.k] && FOE[o.k].fire && o.hp < o.max && dist(o, f) < 170) { o.hp = Math.min(o.max, o.hp + 2); C.addNum(o.x, o.y - 30, '+2', '#ff9a3c'); } }
        f.cf = (f.cf || 5) - dt; if (f.cf <= 0 && d < 380 && FX) { f.cf = 7; f.mark = {x:P.x, y:P.y, t:1}; } if (f.mark) { f.mark.t -= dt; if (f.mark.t <= 0) { FX.ignite(Math.floor(f.mark.x/C.TS), Math.floor(f.mark.y/C.TS), {hp:3, life:9}); if (dist(f.mark, P) < 40) C.hurtMe(1); f.mark = null; } } return false;
      case 'k_wisp': if (f.fuse != null) { f.fuse -= dt; if (f.fuse <= 0) { f.dead = 1; if (FX) for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1]]) FX.ignite(Math.floor(f.x/C.TS) + ox, Math.floor(f.y/C.TS) + oy, {hp:2, life:8}); if (dist(f, P) < 70) C.hurtMe(1); } return true; }
        if (d < 70) { f.fuse = .8; } return false;
      case 'k_golem': if (FX && FX.chilled(f.x, f.y)) f.cooled = Math.max(f.cooled || 0, 3); f.cooled = Math.max(0, (f.cooled || 0) - dt); return false;
      case 'w_wolf': if (F.pack && !f.pk) { f.pk = 1; if (!f.cub) { for (let i = 0; i < 2; i++) { C.spawnFoe('w_wolf', f.x + (i ? 50 : -50), f.y + 30); const o = C.foes()[C.foes().length - 1]; if (o) { o.pk = 1; o.cub = 1; } } } } return false;
      case 'w_eagle': if (f.dive) { f.dive.t -= dt; if (f.dive.t <= 0) { f.x = f.dive.x; f.y = f.dive.y; if (dist(f, P) < 46) C.hurtMe(2); f.dive = null; f.dc = 4; } return true; }
        f.dc = (f.dc == null ? 3 : f.dc) - dt; if (f.dc <= 0 && d < 300) { f.dive = {x:P.x, y:P.y, t:.8}; } return false;
      case 'w_serpent': f.sub = (f.sub || 0) + dt; return false;
      case 'w_lurker': if (!f.up) { if (d < 120) { f.up = 1; C.say('🐊 A Marsh Lurker bursts out of the snow!', 1.4); } else return true; } return false;
      case 'w_elk': { const away = Math.atan2(f.y - P.y, f.x - P.x); if (d < 110 && Math.hypot(P.vx || 0, P.vy || 0) > 40) { f.x += Math.cos(away)*F.sp*dt; f.y += Math.sin(away)*F.sp*dt; f.trust = 0; } else if (d < 150) { f.trust = (f.trust || 0) + dt; if (f.trust > 3 && !f.gone) { f.gone = 1; C.give({frost:15, xp:120}); C.say('✨ The Starlight Elk trusts you. It leaves a glowing antler behind (+15 🔷)', 3); f.dead = 1; } } return true; } }
    return false; };
  // damage rules for some of them
  const hurt = (f, dmg, src) => { const F = FOE[f.k], FX = C.FX(); if (!F) return dmg;
    if (f.k == 'w_elk') return 0; if (f.k == 'k_golem') return f.cooled > 0 || (src && (src.frost || src.ff)) ? dmg : dmg*.1;
    if (f.k == 'k_wraith') return FX && FX.chilled(f.x, f.y) ? dmg : dmg*.3; if (f.k == 'w_crab') return src && src.chg >= .5 ? dmg : dmg*.5; if (f.k == 'w_lurker' && !f.up) return 0; return dmg; };
  // art
  const draw = (g, f, t) => { const x = f.x, y = f.y, fl = Math.sin((f.flap || 0)*.5), FX = C.FX(), sh = (w = 12) => { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x, y + 14, w, 4, 0, 0, TAU); g.fill(); };
    const eye = (ex, ey, c = '#fff3a0', r = 2) => { g.fillStyle = c; g.beginPath(); g.arc(ex, ey, r, 0, TAU); g.fill(); };
    const flame = (cx, cy, s) => { for (const [w, h, c] of [[8, 16, '#ff5a1f'], [5, 11, '#ffb020'], [3, 6, '#fff3a0']]) { g.fillStyle = c; g.beginPath(); g.moveTo(cx - w*s, cy); g.quadraticCurveTo(cx, cy - h*s*1.6 - Math.sin(t*12 + x)*2, cx + w*s, cy); g.fill(); } };
    switch (f.k) {
      case 'k_imp': sh(10); g.fillStyle = '#7a2a14'; g.beginPath(); g.ellipse(x, y, 10, 11, 0, 0, TAU); g.fill(); flame(x, y - 8, .9); g.fillStyle = '#3a1208'; g.beginPath(); g.moveTo(x - 9, y - 4); g.lineTo(x - 14, y - 12); g.lineTo(x - 5, y - 8); g.moveTo(x + 9, y - 4); g.lineTo(x + 14, y - 12); g.lineTo(x + 5, y - 8); g.fill(); eye(x - 3, y - 1); eye(x + 3, y - 1); break;
      case 'k_hound': sh(16); g.fillStyle = '#3a2420'; g.beginPath(); g.ellipse(x, y, 17, 9, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + 13, y - 6, 8, 7, 0, 0, TAU); g.fill(); g.fillStyle = '#ff7a2a'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x - 12 + i*5, y - 7); g.lineTo(x - 10 + i*5, y - 14 - Math.sin(t*14 + i)*3); g.lineTo(x - 8 + i*5, y - 7); g.fill(); } eye(x + 15, y - 7, '#ffdd55');
        g.fillStyle = '#3a2420'; for (const lx of [-10, -4, 6, 11]) g.fillRect(x + lx, y + 5, 3, 8 + Math.sin(t*16 + lx)*2); break;
      case 'k_bat': g.fillStyle = '#3a3438'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 16, y - 12 - fl*6, x - 22, y + 2); g.quadraticCurveTo(x - 12, y - 2, x, y + 4); g.quadraticCurveTo(x + 12, y - 2, x + 22, y + 2); g.quadraticCurveTo(x + 16, y - 12 - fl*6, x, y); g.fill(); g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); eye(x - 2, y - 1, '#ff9a3c', 1.5); eye(x + 2, y - 1, '#ff9a3c', 1.5);
        if (!C.low()) { g.fillStyle = 'rgba(110,100,110,.35)'; g.beginPath(); g.arc(x - 6, y + 10 + fl*2, 6, 0, TAU); g.arc(x + 6, y + 12, 5, 0, TAU); g.fill(); } break;
      case 'k_wraith': { const vis = FX && FX.chilled(x, y) ? .95 : .14; g.save(); g.globalAlpha = vis; g.fillStyle = '#6a6a72'; g.beginPath(); g.moveTo(x - 13, y + 12); g.quadraticCurveTo(x - 15, y - 16, x, y - 20); g.quadraticCurveTo(x + 15, y - 16, x + 13, y + 12); for (let i = 0; i < 4; i++) g.lineTo(x + 13 - (i + .5)*26/4, y + 6 + (i % 2)*8); g.fill(); eye(x - 4, y - 8, '#ffb020'); eye(x + 4, y - 8, '#ffb020'); g.restore(); break; }
      case 'k_golem': { sh(22); const cool = f.cooled > 0; g.fillStyle = cool ? '#4a5a6a' : '#3a2a26'; for (const [ox, oy, r] of [[0, 0, 18], [-12, -14, 9], [12, -14, 9], [0, -20, 11]]) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); }
        g.strokeStyle = cool ? '#9fe8ff' : '#ff7a2a'; g.lineWidth = 3; for (const [a, b, c2, d2] of [[-10, -4, 6, 8], [4, -16, 12, 0], [-6, -24, 2, -12]]) { g.beginPath(); g.moveTo(x + a, y + b); g.lineTo(x + c2, y + d2); g.stroke(); } eye(x - 4, y - 21, cool ? '#cfefff' : '#ffdd55', 2.5); eye(x + 4, y - 21, cool ? '#cfefff' : '#ffdd55', 2.5);
        if (!cool) { g.fillStyle = '#fff'; g.font = '800 9px sans-serif'; g.textAlign = 'center'; g.fillText('COOL IT WITH FROST!', x, y - 40); } break; }
      case 'k_moth': g.fillStyle = 'rgba(255,170,60,.85)'; g.beginPath(); g.ellipse(x - 7, y - 2, 8, 5 + fl*2, -.6, 0, TAU); g.ellipse(x + 7, y - 2, 8, 5 + fl*2, .6, 0, TAU); g.fill(); g.fillStyle = '#5a2a10'; g.fillRect(x - 1.5, y - 6, 3, 12); if (!C.low()) { g.fillStyle = 'rgba(255,220,120,.3)'; g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill(); } break;
      case 'k_cult': sh(12); g.fillStyle = '#4a1a1a'; g.beginPath(); g.moveTo(x - 12, y + 14); g.lineTo(x - 7, y - 10); g.quadraticCurveTo(x, y - 24, x + 7, y - 10); g.lineTo(x + 12, y + 14); g.fill(); g.fillStyle = '#14080a'; g.beginPath(); g.ellipse(x, y - 9, 5, 6, 0, 0, TAU); g.fill(); eye(x - 2, y - 9, '#ff9a3c', 1.3); eye(x + 2, y - 9, '#ff9a3c', 1.3); flame(x + 12, y - 4, .5);
        if (f.mark) { g.strokeStyle = 'rgba(255,120,40,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(f.mark.x, f.mark.y, 40*(1.2 - f.mark.t*.2), 0, TAU); g.stroke(); } break;
      case 'k_wisp': { const k = f.fuse != null ? 1.4 + Math.sin(t*40)*.3 : 1; flame(x, y + 6, k); if (f.fuse != null) { g.strokeStyle = 'rgba(255,90,40,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 70, 0, TAU); g.stroke(); } break; }
      case 'w_wolf': sh(15); g.fillStyle = '#d8e2ee'; g.beginPath(); g.ellipse(x, y, 16, 8, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + 13, y - 6, 7, 6, 0, 0, TAU); g.fill(); g.fillStyle = '#9fb0c4'; g.beginPath(); g.moveTo(x + 10, y - 11); g.lineTo(x + 12, y - 17); g.lineTo(x + 15, y - 11); g.fill(); g.beginPath(); g.moveTo(x - 15, y - 2); g.quadraticCurveTo(x - 24, y - 8, x - 22, y + 2); g.fill();
        for (const lx of [-10, -4, 6, 11]) { g.fillStyle = '#c0ccda'; g.fillRect(x + lx, y + 5, 3, 8 + Math.sin(t*14 + lx)*2); } eye(x + 15, y - 7, '#5ab4ff', 1.6); break;
      case 'w_eagle': if (f.dive) { g.fillStyle = 'rgba(20,40,80,' + (.25 + .3*(1 - f.dive.t/.8)) + ')'; g.beginPath(); g.ellipse(f.dive.x, f.dive.y, 34, 14, 0, 0, TAU); g.fill(); }
        g.fillStyle = '#e8f0f8'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 20, y - 10 - fl*8, x - 30, y + 2); g.lineTo(x, y + 6); g.lineTo(x + 30, y + 2); g.quadraticCurveTo(x + 20, y - 10 - fl*8, x, y); g.fill(); g.fillStyle = '#9fc4e8'; g.beginPath(); g.ellipse(x, y + 2, 6, 9, 0, 0, TAU); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(x - 2, y - 6); g.lineTo(x + 2, y - 6); g.lineTo(x, y - 1); g.fill(); break;
      case 'w_serpent': { const s = Math.sin(t*2 + (f.sub || 0)); g.fillStyle = 'rgba(40,80,120,.25)'; g.beginPath(); g.ellipse(x, y + 18, 34, 10, 0, 0, TAU); g.fill(); g.strokeStyle = '#7fc8e8'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 30, y + 14); g.quadraticCurveTo(x - 10, y - 10 + s*6, x + 6, y - 20); g.stroke();
        g.fillStyle = '#7fc8e8'; g.beginPath(); g.ellipse(x + 12, y - 26, 13, 9, -.3, 0, TAU); g.fill(); g.fillStyle = '#e8f8ff'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x - 22 + i*8, y + 4 - i*6); g.lineTo(x - 18 + i*8, y - 6 - i*6); g.lineTo(x - 14 + i*8, y + 2 - i*6); g.fill(); } eye(x + 16, y - 28, '#14204a', 2); break; }
      case 'w_crab': sh(16); g.fillStyle = '#8a8e94'; g.beginPath(); g.ellipse(x, y, 16, 11, 0, 0, TAU); g.fill(); g.fillStyle = '#6a6e74'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx*20, y - 6, 7, 0, TAU); g.fill(); g.strokeStyle = '#6a6e74'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + sx*10, y + 2 + i*3); g.lineTo(x + sx*20, y + 8 + i*3); g.stroke(); } } eye(x - 4, y - 8, '#14204a', 1.6); eye(x + 4, y - 8, '#14204a', 1.6); break;
      case 'w_lurker': if (!f.up) { g.fillStyle = 'rgba(200,215,210,.6)'; g.beginPath(); g.ellipse(x, y + 6, 14, 5, 0, 0, TAU); g.fill(); eye(x - 4, y + 4, '#d0ff60', 1.2); eye(x + 4, y + 4, '#d0ff60', 1.2); break; }
        sh(16); g.fillStyle = '#4a5a48'; g.beginPath(); g.ellipse(x, y, 18, 9, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + 15, y - 3, 10, 6, .2, 0, TAU); g.fill(); g.fillStyle = '#e8f0e0'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + 10 + i*4, y); g.lineTo(x + 12 + i*4, y + 4); g.lineTo(x + 14 + i*4, y); g.fill(); } eye(x + 16, y - 6, '#d0ff60', 1.8); break;
      case 'w_elk': { sh(16); g.fillStyle = '#c8b8e8'; g.beginPath(); g.ellipse(x, y, 17, 10, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + 15, y - 12, 7, 6, 0, 0, TAU); g.fill(); g.fillRect(x + 10, y - 10, 5, 8); for (const lx of [-11, -5, 6, 11]) g.fillRect(x + lx, y + 6, 3, 10);
        g.strokeStyle = '#fff6c0'; g.lineWidth = 2; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(x + 15, y - 17); g.lineTo(x + 15 + sx*8, y - 30); g.lineTo(x + 15 + sx*14, y - 32); g.moveTo(x + 15 + sx*5, y - 25); g.lineTo(x + 15 + sx*10, y - 22); g.stroke(); }
        if (!C.low()) for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(255,250,200,' + (.5 + .4*Math.sin(t*3 + i)) + ')'; g.fillRect(x - 14 + i*7, y - 4 + Math.sin(t*2 + i)*3, 2, 2); } if (f.trust > 0) { g.fillStyle = '#fff6c0'; g.fillRect(x - 15, y - 44, 30*Math.min(1, f.trust/3), 3); } break; } } };
  // smoke clouds (world space) drawn over everything
  const update = dt => { for (const s of smoke) s.t -= dt; smoke = smoke.filter(s => s.t > 0); };
  const drawOver = g => { for (const s of smoke) { const k = Math.min(1, s.t/1.2), r = 150 + (1 - s.t/s.max)*60; const gr = g.createRadialGradient(s.x, s.y, 10, s.x, s.y, r); gr.addColorStop(0, 'rgba(70,64,70,' + .85*k + ')'); gr.addColorStop(1, 'rgba(70,64,70,0)'); g.fillStyle = gr; g.beginPath(); g.arc(s.x, s.y, r, 0, TAU); g.fill(); } };
  const died = f => { if (f.hs) { const FX = C.FX(); if (FX) { const i = FX.heatSrc.indexOf(f.hs); if (i >= 0) FX.heatSrc.splice(i, 1); } } if (f.k == 'w_serpent') C.give({frost:12}); };
  return {ai, hurt, draw, update, drawOver, died, smoke:() => smoke}; }};
})();
