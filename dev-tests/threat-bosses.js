const L = require('./lib.js');
const gear = []; let id = 1; for (const sl of ['gloves','boots','hat','scarf','pack']) gear.push({id:id++, slot:sl, rar:5, lv:0, name:'Test ' + sl});
const save = {econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, gdata:{snowball:{sb:{cr:0, up:{}, frost:5000, bank:1e6, gear, eq:{gloves:1, boots:2, hat:3, scarf:4, pack:5}, gid:9, ow:{v:1, met:1, base:{tier:3, rooms:{}}}}}}};
(async()=>{ const {b,p,errs,D,world} = await L.start({save}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); const A = 'window.Arcade._dbg.snow().wm()';
 const g0 = await D('return [d.p3.gearScore(), d.W.gsMax, d.p3.THR[d.p3.thr()].n]'); ok('Gear Score from 5 Mythic pieces = 600, Brutal', g0[0] == 600 && g0[2] == 'Brutal', g0);
 await D('d.W.gear = 0; window.Arcade._dbg.snow().wm().dbg(); '); await p.evaluate(()=>{ const P = window.Arcade._dbg.snow(); });
 const g1 = await D('const PE = window.Arcade._dbg.snow(); return 0'); 
 // unequip/sell gear: Threat stays
 await D('const W = d.W; return 0');
 const unequip = await p.evaluate(()=>{ const s = window.Arcade._dbg.snow(); const wm = s.wm(), d = wm.dbg(); const PERM = s.perm ? s.perm() : null; return !!PERM; });
 // fight at forced Calm
 await p.evaluate(()=>window.Arcade._dbg.snow().wm().adm.threat(0));
 const hp0 = await D(`d.p.x = d.LAIR.grumble.x; d.p.y = d.LAIR.grumble.y + 200; d.spawnBoss('grumble'); return Math.round(d.bossNow().max)`);
 await p.evaluate(()=>window.Arcade._dbg.snow().wm().adm.threat(7)); const hp7 = await D(`d.bossNow() && (window.__x = 1); d.spawnBoss('grumble'); return Math.round(d.bossNow().max)`);
 ok('Wilderland boss health ×3.6 of Calm', Math.abs(hp7/hp0 - 3.6) < .05, [hp0, hp7]);
 await p.evaluate(()=>window.Arcade._dbg.snow().wm().adm.threat(0)); await D(`d.spawnBoss('grumble'); d.p.inv = 99;`);
 // watch 12 s of the fight: hostile boss shots never above the cap, every volley comes after a wind-up
 let maxHost = 0, tellsSeen = 0, firstShotAt = null, firstTellAt = null; const t0 = Date.now();
 for (let i = 0; i < 120; i++) { const r = await D(`const B = d.bossNow(); if (!B) return null; d.p.inv = 99; return [d.p3.hostN(), (B.q || []).length]`); if (!r) break; maxHost = Math.max(maxHost, r[0]); if (r[1] && firstTellAt == null) firstTellAt = Date.now(); if (r[0] && firstShotAt == null) firstShotAt = Date.now(); await p.waitForTimeout(100); }
 ok('boss shots stay under the cap (22)', maxHost <= 22, maxHost); ok('first shot comes after a visible wind-up', firstTellAt != null && firstShotAt != null && firstShotAt - firstTellAt >= 500, [firstTellAt - t0, firstShotAt - t0]);
 await p.screenshot({path:'./tell.png'});
 // stagger → stun → hearts + double damage
 const st = await D(`const B = d.bossNow(); B.stg = 0; for (let i = 0; i < 6; i++) d.p3.addStg(B, 20); return [B.stunT > 0, d.balls.length]`); ok('charged hits fill stagger → STUNNED', st[0], st);
 const dm = await D(`const B = d.bossNow(); const h = B.hp; d.hurtBoss(10, {mine:1, chg:0}); const a = h - B.hp; B.stunT = 0; const h2 = B.hp; d.hurtBoss(10, {mine:1, chg:0}); const b2 = h2 - B.hp; const h3 = B.hp; d.hurtBoss(10, {mine:1, chg:1}); return [a, b2, h3 - B.hp]`); ok('stunned ×3, no spam penalty (plain = charged), guards ×0.7', dm[0] == 30 && dm[1] == dm[2] && Math.abs(dm[1] - 7) < .01, dm);
 // knockout in the arena
 const ko = await D(`const B = d.bossNow(); B.hp = B.max*0.4; d.hurtBoss(0.001); const ph = B.ph; d.p.inv = 0; d.p.hp = 1; window.Arcade.immortal = false; d.p3.hurtMe(3); return [ph, d.p.hp]`);
 let revived = null; for (let i=0;i<60;i++){ const q = await D('return [d.p.hp, d.p.inv]'); if (q[0] > 0) { revived = q; break; } await p.waitForTimeout(100); } console.log('revived', revived);
 const after = await D(`const B = d.bossNow(); return B ? [d.p.hp, d.p.max, B.ph, +(B.hp/B.max).toFixed(3), Math.round(Math.hypot(d.p.x - B.hx, d.p.y - B.hy))] : ['no boss', d.p.hp]`);
 ok('knockout: back in the arena at 50%, boss at top of its phase', after[0] == Math.ceil(after[1]/2) && Math.abs(after[3] - (1 - (after[2]-1)/3)) < .01 && after[4] < 400, {ko, after});
 // threat extras
 await p.evaluate(()=>window.Arcade._dbg.snow().wm().adm.threat(6)); await D(`d.spawnBoss('grumble'); d.p.inv = 99;`); await p.waitForTimeout(600);
 const ex = await D(`return d.foes().filter(f => f.k == 'tguard').length`); ok('Fierce+: 2 Frost Guards', ex == 2, ex);
 const red = await D(`const B = d.bossNow(); B.stunT = 0; const h = B.hp; d.hurtBoss(10, {mine:1, chg:1}); return h - B.hp`); ok('guards cut damage to 70%', Math.abs(red - 7) < .01, red);
 await D(`const B = d.bossNow(); B.hp = B.max*0.45; d.hurtBoss(0.01);`); await p.waitForTimeout(3500); const ex2 = await D(`const B = d.bossNow(); return [!!B.form2, d.p3.haz().map(h => h.k), B.slamT]`); ok('Brutal+: second form + slam circles / icicles', ex2[0] && (ex2[1].length > 0 || ex2[2] > 2.5), ex2);
 await p.screenshot({path:'./extras.png'});
 // elites
 await p.evaluate(()=>window.Arcade._dbg.snow().wm().adm.threat(7)); const el = await D(`let n = 0; for (let i = 0; i < 200; i++) { d.p3.give({}); } const fs = []; return 0`);
 const elites = await D(`const before = d.foes().length; return 0`);
 console.log(errs.filter(e=>!e.includes('Failed to load resource'))); await b.close(); })();
