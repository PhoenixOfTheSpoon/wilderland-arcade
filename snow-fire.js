// Wilderland Arcade · Snow Kingdom · FIRE vs FROST (snow-fire.js) — The Burning Winter, part 2
// HEAT: near fires (and later Lit and the Kindled) the air is hot: snowballs shrink and melt in flight, sooner the hotter it is.
// FIRES burn trees, dead trees and wooden houses and spread to their neighbours, but ONLY near the player (capped), never while
// offline, never at Camp Cocoa / your base. Burned trees leave ash (saved compactly in W.ash); scorched houses get repaired by quests.
// TOOLS (unlocked by the Lit story, W.fx): Frostforged Snowballs (crafted at the Forge, last much longer in heat), the Cold Lantern (L:
// a chill bubble that runs out and recharges on snow), the Blizzard Bomb (Z: a cold zone that frosts snowballs thrown through it),
// the Snow Pump (hold R: spray out fires, they drop Frost Crystals) and Frozen Heart (N: freeze everything around you, snowballs reach anything).
// Mau Mau sits on small fires; teammates beat out fires near them. Fire events themselves only start after the Gecko God (the Lit story).
(function(){
'use strict';
const A = window.Arcade = window.Arcade || {}, TAU = Math.PI*2;
A.snowFire = C => {   // C: {W, PERM, TS, N, M, T:{SNOW, TREE, DEAD, HOUSE, DEEP, PATH}, p, foes(), balls(), mates, mau, say, addNum, give, save, regAt, regionAt, safe(reg), low, onScreen, aimW(), keys, g, cam(), hurtMe, mauSay}
  const {W, PERM, TS, N, M, T} = C, F = W.fx = Object.assign({frost:0, lantern:0, bomb:0, pump:0, heart:0, lc:30, water:100, bombCd:0, heartCd:0, heat:0}, W.fx || {});
  let fires = [], zones = [], spray = null, lanternOn = false, heatNow = 0, puffs = [];
  const ash = new Set((W.ash || '').split(',').filter(Boolean).map(s => parseInt(s, 36)));
  for (const i of ash) if (M[i] == T.TREE || M[i] == T.DEAD) M[i] = T.SNOW;   // burned trees stay burned after a reload
  const saveAsh = () => { const a = [...ash]; W.ash = a.slice(-6000).map(i => i.toString(36)).join(','); };
  const flam = v => v == T.TREE || v == T.DEAD || v == T.HOUSE;
  const near = (x, y, r) => Math.hypot(x - C.p.x, y - C.p.y) < r;
  const MAXF = () => C.low() ? 30 : 60;
  // ---------- fires ----------
  const ignite = (tx, ty, o = {}) => { if (fires.length >= MAXF() || tx < 1 || ty < 1 || tx >= N - 1 || ty >= N - 1) return null; const reg = C.regionAt(tx, ty); if (C.safe(reg)) return null;
    if (fires.some(f => f.tx == tx && f.ty == ty)) return null; const v = M[ty*N + tx], f = {tx, ty, x:(tx + .5)*TS, y:(ty + .5)*TS, hp:o.hp || (v == T.HOUSE ? 8 : flam(v) ? 6 : 3), max:o.hp || 6, life:o.life || (flam(v) ? 26 : 12), sp:2 + Math.random()*3, v}; fires.push(f); return f; };
  const putOut = (f, by) => { if (f.out) return; f.out = 1; puffs.push({x:f.x, y:f.y, t:.8}); if (by) { const n = 1 + Math.floor(Math.random()*3); C.give({frost:n}); C.addNum(f.x, f.y - 30, '+' + n + ' 🔷', '#64CDF5'); } };
  const burnOut = f => { const i = f.ty*N + f.tx; if (f.v == T.TREE || f.v == T.DEAD) { M[i] = T.SNOW; ash.add(i); } else if (f.v == T.HOUSE) ash.add(i); else ash.add(i); };
  // heat at a point: fires (and extra heat sources from the story: Lit, the Kindled)
  const heatSrc = [];
  const heatAt = (x, y) => { let h = 0; for (const f of fires) { const d = Math.hypot(f.x - x, f.y - y); if (d < 4*TS) h += (1 - d/(4*TS))*.55*Math.min(1, f.hp/3); } for (const s of heatSrc) { const d = Math.hypot(s.x - x, s.y - y); if (d < s.r) h += (1 - d/s.r)*s.h; } return Math.min(1.6, h); };
  const chilled = (x, y) => (lanternOn && F.lc > 0 && near(x, y, 115)) || zones.some(z => Math.hypot(z.x - x, z.y - y) < z.r);
  // ---------- tools ----------
  const has = k => !!F[k];
  const toggleLantern = () => { if (!has('lantern')) return C.say('🏮 You don’t have the Cold Lantern yet', 1.6); if (!lanternOn && F.lc < 2) return C.say('🏮 The Cold Lantern is empty: walk on snow to recharge it', 2); lanternOn = !lanternOn; C.say(lanternOn ? '🏮 Cold Lantern ON: snowballs don’t melt inside its light' : '🏮 Cold Lantern off (recharging on snow)', 1.8); };
  const blizzardBomb = () => { if (!has('bomb')) return C.say('💣 You don’t have the Blizzard Bomb yet', 1.6); if (F.bombCd > 0) return C.say('💣 Blizzard Bomb ready in ' + Math.ceil(F.bombCd) + ' s', 1.4); const a = C.aimW(); F.bombCd = 10; zones.push({x:a.x, y:a.y, r:125, t:5, max:5, k:'bomb'}); A.sfx && A.sfx('win'); for (const f of fires) if (Math.hypot(f.x - a.x, f.y - a.y) < 125) f.hp -= 4; };
  const frozenHeart = () => { if (!has('heart')) return C.say('💙 Frozen Heart is not awake yet', 1.6); if (F.heartCd > 0) return C.say('💙 Frozen Heart ready in ' + Math.ceil(F.heartCd) + ' s', 1.4); F.heartCd = 60; zones.push({x:C.p.x, y:C.p.y, r:320, t:6, max:6, k:'heart', follow:1});
    for (const f of C.foes()) if (!f.dead && near(f.x, f.y, 320)) f.stun = Math.max(f.stun || 0, 4); for (const f of fires) if (near(f.x, f.y, 320)) f.hp -= 6; C.say('💙 FROZEN HEART! Everything around you freezes', 2.4); A.sfx && A.sfx('win'); };
  // ---------- update ----------
  const update = (dt, active) => { if (!active) return; const keys = C.keys(), P = C.p;
    F.bombCd = Math.max(0, F.bombCd - dt); F.heartCd = Math.max(0, F.heartCd - dt);
    const tl = M[Math.floor(P.y/TS)*N + Math.floor(P.x/TS)], onSnow = tl == T.SNOW || tl == T.DEEP;
    if (lanternOn) { F.lc = Math.max(0, F.lc - dt); if (F.lc <= 0) { lanternOn = false; C.say('🏮 The Cold Lantern ran out: walk on snow to recharge it', 2); } } else if (onSnow) F.lc = Math.min(30, F.lc + dt*1.5);
    // snow pump (hold R)
    spray = null; if (has('pump') && (keys.r || keys.R || pumpTouch) && F.water > 0) { let nf = null, nd = 190; for (const f of fires) { const d = Math.hypot(f.x - P.x, f.y - P.y); if (d < nd) { nd = d; nf = f; } } const tg = nf || C.aimW(), a = Math.atan2(tg.y - P.y, tg.x - P.x); spray = {a};   // the pump turns to the nearest fire F.water = Math.max(0, F.water - dt*10);
      for (const f of fires) { const d = Math.hypot(f.x - P.x, f.y - P.y), da = Math.abs(((Math.atan2(f.y - P.y, f.x - P.x) - a) % TAU + TAU*1.5) % TAU - Math.PI); if (d < 170 && da < .5) { f.hp -= dt*4; f.pumped = 1; } } }
    else if (onSnow) F.water = Math.min(100, F.water + dt*12);
    // zones
    for (const z of zones) { z.t -= dt; if (z.follow) { z.x = P.x; z.y = P.y; } } zones = zones.filter(z => z.t > 0);
    // fires: only those near you burn and spread (nothing happens far away or offline)
    const mau = C.mau;
    for (const f of fires) { if (!near(f.x, f.y, 34*TS)) continue; f.life -= dt; if (zones.some(z => Math.hypot(z.x - f.x, z.y - f.y) < z.r)) f.hp -= dt*1.5;
      f.sp -= dt; if (f.sp <= 0) { f.sp = 3 + Math.random()*4; const d = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]][Math.floor(Math.random()*6)], nx = f.tx + d[0], ny = f.ty + d[1]; if (flam(M[ny*N + nx]) && Math.random() < .55) ignite(nx, ny); else if (Math.random() < .12) ignite(nx, ny, {hp:2, life:8}); }
      if (mau && !mau.dead && f.hp <= 3 && Math.hypot(mau.x - f.x, mau.y - f.y) < 70) { f.hp -= dt*2.2; if (!f.mau) { f.mau = 1; C.mauSay && C.mauSay(['*sits on the fire* …There. Fire’s gone. You’re welcome.', 'SHIELD BELLY: FIRE MODE!', 'Hot hot hot. Still sitting. Royal duty.'][Math.floor(Math.random()*3)], 2.4); } }
      for (const m of C.mates || []) if (!m.ko && Math.hypot(m.x - f.x, m.y - f.y) < 140) f.hp -= dt*.8;
      if (f.hp <= 0) putOut(f, true); else if (f.life <= 0) { burnOut(f); f.out = 1; } }
    if (fires.some(f => f.out)) { fires = fires.filter(f => !f.out); saveAsh(); }
    // snowballs: Frostforged ones are used up when you throw into heat; heat shrinks and melts the rest; they also put out fires
    heatNow = heatAt(P.x, P.y); F.heat = heatNow;
    for (const b of C.balls()) { if (!b.mine || b.life <= 0) continue; if (b._hc == null) { b._hc = 1; if (heatNow > .05 && (PERM.ffb|0) > 0) { PERM.ffb--; b.ff = 1; } }
      for (const f of fires) if (Math.hypot(f.x - b.x, f.y - b.y) < 24) { f.hp -= b.ff ? 2 : 1; f.pumped = 1; b.life = 0; break; } if (b.life <= 0) continue;
      if (b.frost || chilled(b.x, b.y)) { if (zones.some(z => z.k == 'bomb' && Math.hypot(z.x - b.x, z.y - b.y) < z.r) && !b.frost) { b.frost = 1; b.dmg = (b.dmg || 1)*1.5; } continue; }
      const h = heatAt(b.x, b.y); if (h <= 0) continue; const k = b.ff ? .25 : 1; b.r = Math.max(0, (b.r || 6)*(1 - dt*h*1.8*k)); b.life -= dt*h*2.4*k; b.dmg = (b.dmg || 1)*(1 - dt*h*.6*k);
      if (b.r < 2) { b.life = 0; puffs.push({x:b.x, y:b.y, t:.4, steam:1}); } }
    for (const q of puffs) q.t -= dt; puffs = puffs.filter(q => q.t > 0); };
  // ---------- drawing ----------
  const drawWorld = (g, t) => { const cam = C.cam(), lo = C.low(), x0 = Math.floor(cam.x/TS) - 1, y0 = Math.floor(cam.y/TS) - 1, x1 = x0 + Math.ceil(cam.w/TS) + 2, y1 = y0 + Math.ceil(cam.h/TS) + 2;
    if (ash.size) for (let ty = Math.max(0, y0); ty <= Math.min(N - 1, y1); ty++) for (let tx = Math.max(0, x0); tx <= Math.min(N - 1, x1); tx++) { if (!ash.has(ty*N + tx)) continue; const sx = tx*TS, sy = ty*TS;
      if (M[ty*N + tx] == T.HOUSE) { g.fillStyle = 'rgba(40,30,30,.35)'; g.fillRect(sx, sy, TS, TS); continue; } g.fillStyle = 'rgba(70,64,64,.45)'; g.beginPath(); g.ellipse(sx + 24, sy + 26, 22, 14, 0, 0, TAU); g.fill(); g.fillStyle = '#3a2e2a'; g.fillRect(sx + 21, sy + 20, 6, 14); }
    for (const z of zones) { g.fillStyle = z.k == 'heart' ? 'rgba(120,200,255,' + (.14*z.t/z.max + .05) + ')' : 'rgba(200,235,255,' + (.25*z.t/z.max + .05) + ')'; g.beginPath(); g.arc(z.x, z.y, z.r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.stroke(); }
    if (lanternOn && F.lc > 0) { const P = C.p; if (!lo) { const gr = g.createRadialGradient(P.x, P.y, 20, P.x, P.y, 115); gr.addColorStop(0, 'rgba(170,230,255,.28)'); gr.addColorStop(1, 'rgba(170,230,255,0)'); g.fillStyle = gr; } else g.fillStyle = 'rgba(170,230,255,.15)'; g.beginPath(); g.arc(P.x, P.y, 115, 0, TAU); g.fill(); }
    for (const f of fires) { if (!C.onScreen(f.x, f.y, 60)) continue; const k = Math.min(1, f.hp/4) + .3, fl = Math.sin(t*14 + f.tx)*3;
      if (!lo) { const gr = g.createRadialGradient(f.x, f.y, 4, f.x, f.y, 70); gr.addColorStop(0, 'rgba(255,170,60,.45)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.beginPath(); g.arc(f.x, f.y, 70, 0, TAU); g.fill(); }
      for (const [w, h, c] of [[16, 34, '#ff5a1f'], [11, 24, '#ffb020'], [6, 14, '#fff3a0']]) { g.fillStyle = c; g.beginPath(); g.moveTo(f.x - w*k, f.y + 10); g.quadraticCurveTo(f.x - w*k*.6, f.y - h*k*.4, f.x + fl*.3, f.y - h*k + fl); g.quadraticCurveTo(f.x + w*k*.6, f.y - h*k*.4, f.x + w*k, f.y + 10); g.fill(); }
      if (!lo) for (let i = 0; i < 3; i++) { const ph = (t*1.2 + i/3 + f.tx*.1) % 1; g.fillStyle = 'rgba(255,200,80,' + (1 - ph) + ')'; g.fillRect(f.x + Math.sin(t*3 + i*2)*10, f.y - 20 - ph*50, 2, 2); g.fillStyle = 'rgba(90,90,100,' + (.25*(1 - ph)) + ')'; g.beginPath(); g.arc(f.x + Math.sin(t + i)*8, f.y - 40 - ph*60, 6 + ph*10, 0, TAU); g.fill(); } }
    if (spray) { const P = C.p; g.fillStyle = 'rgba(230,246,255,.75)'; for (let i = 0; i < (lo ? 6 : 16); i++) { const d = ((t*400 + i*37) % 170), a = spray.a + Math.sin(i*7.3)*.4; g.beginPath(); g.arc(P.x + Math.cos(a)*d, P.y - 10 + Math.sin(a)*d, 3 + d/60, 0, TAU); g.fill(); } }
    for (const q of puffs) { g.fillStyle = 'rgba(220,230,240,' + q.t + ')'; g.beginPath(); g.arc(q.x, q.y - (1 - q.t)*30, 8 + (1 - q.t)*14, 0, TAU); g.fill(); } };
  const drawScreen = (g, t, VW, VH, touch) => { const lo = C.low();
    if (heatNow > .05) { g.fillStyle = 'rgba(255,140,60,' + Math.min(.22, heatNow*.12) + ')'; g.fillRect(0, 0, VW, VH); if (!lo) { g.strokeStyle = 'rgba(255,200,150,' + Math.min(.25, heatNow*.15) + ')'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { const y = (i*97 + t*40) % VH; g.beginPath(); for (let x = 0; x <= VW; x += 30) g.lineTo(x, y + Math.sin(x*.03 + t*6 + i)*4); g.stroke(); } } }
    const anyTool = ['lantern', 'bomb', 'pump', 'heart'].some(has); if (!anyTool && heatNow <= .05) return;
    const x = 12, y = VH - (touch ? 190 : 120), w = 170; g.fillStyle = 'rgba(20,32,74,.72)'; g.fillRect(x, y, w, 76); g.fillStyle = '#fff'; g.font = '800 10px sans-serif'; g.textAlign = 'left';
    const bar = (yy, k, col, lab) => { g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(x + 8, yy, w - 16, 6); g.fillStyle = col; g.fillRect(x + 8, yy, (w - 16)*Math.max(0, Math.min(1, k)), 6); g.fillStyle = '#fff'; g.fillText(lab, x + 8, yy - 3); };
    bar(y + 14, heatNow/1.6, heatNow > .8 ? '#ff4539' : '#ff9a3c', '🔥 Heat ' + (heatNow > .05 ? Math.round(heatNow*100) + '%' : 'none') + ((PERM.ffb|0) ? ' · ❄ Frostforged ' + PERM.ffb : ''));
    if (has('lantern')) bar(y + 34, F.lc/30, '#9fe8ff', '🏮 Lantern (L) ' + (lanternOn ? 'ON' : 'off'));
    if (has('pump')) bar(y + 54, F.water/100, '#64CDF5', '💦 Snow Pump (hold R)');
    g.fillStyle = '#cfe3f5'; g.fillText((has('bomb') ? '💣 Z ' + (F.bombCd > 0 ? Math.ceil(F.bombCd) + 's' : 'ready') : '') + (has('heart') ? '  💙 N ' + (F.heartCd > 0 ? Math.ceil(F.heartCd) + 's' : 'ready') : ''), x + 8, y + 72); };
  const key = k => { if ((k == 'l' || k == 'L') && has('lantern')) { toggleLantern(); return true; } if ((k == 'z' || k == 'Z') && has('bomb')) { blizzardBomb(); return true; } if ((k == 'n' || k == 'N') && has('heart')) { frozenHeart(); return true; } return false; };
  // touch: small round buttons left of the throw button, one per tool you have (hold the pump button to spray)
  let pumpTouch = false;
  const touchBtns = (VW, BAR) => [['lantern', '🏮', toggleLantern], ['bomb', '💣', blizzardBomb], ['pump', '💦', null], ['heart', '💙', frozenHeart]].filter(q => has(q[0])).map((q, i) => ({k:q[0], e:q[1], fn:q[2], x:VW - 190 - i*62, y:BAR - 64, r:26}));
  const drawTouch = (g, VW, BAR) => { for (const b of touchBtns(VW, BAR)) { g.fillStyle = b.k == 'lantern' && lanternOn ? 'rgba(159,232,255,.85)' : 'rgba(20,32,74,.7)'; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); g.font = '22px sans-serif'; g.textAlign = 'center'; g.fillText(b.e, b.x, b.y + 8); } };
  const touchDown = (q, VW, BAR) => { for (const b of touchBtns(VW, BAR)) if (Math.hypot(q.x - b.x, q.y - b.y) < b.r + 6) { if (b.fn) b.fn(); else pumpTouch = true; return true; } return false; };
  const touchUp = () => { pumpTouch = false; };
  const adm = {ignite:() => { const P = C.p, tx = Math.floor(P.x/TS), ty = Math.floor(P.y/TS); let n = 0; for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (flam(M[(ty + dy)*N + tx + dx]) && Math.random() < .5 && ignite(tx + dx, ty + dy)) n++; if (!n) ignite(tx + 3, ty); return n; },
    out:() => { for (const f of fires) f.out = 1; fires = []; }, tools:() => { for (const k of ['frost', 'lantern', 'bomb', 'pump', 'heart']) F[k] = 1; }, ash:() => ash.size};
  return {touchDown, touchUp, drawTouch, update, drawWorld, drawScreen, key, ignite, heatAt, heatSrc, fires:() => fires, zones:() => zones, adm, chilled, F, lantern:() => lanternOn, toggleLantern, blizzardBomb, frozenHeart};
};
})();
