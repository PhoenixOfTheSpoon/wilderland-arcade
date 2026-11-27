const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start(); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; });
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 await p.mouse.move(700, 300);
 // Space throws (tap), Q is the ability
 const n0 = await D('d.p.ammo = 20; return d.p.ammo'); await p.keyboard.down(' '); await p.waitForTimeout(80); await p.keyboard.up(' '); await p.waitForTimeout(150);
 ok('Space throws a snowball', (await D('return d.p.ammo')) == n0 - 1, await D('return d.p.ammo'));
 const ab0 = await D('d.p.ab = 0; return d.p.ab'); await p.keyboard.press(' '); await p.waitForTimeout(150); ok('Space no longer fires the ability', (await D('return d.p.ab')) == 0);
 await p.keyboard.press('q'); await p.waitForTimeout(150); ok('Q fires the ability', (await D('return d.p.ab')) > 0);
 // hold Space = charged throw
 await D('d.p.ammo = 20'); await p.keyboard.down(' '); await p.waitForTimeout(900); await p.keyboard.up(' '); await p.waitForTimeout(60);
 // auto-target: strongest first, closest among equal
 await p.keyboard.press('t'); await p.waitForTimeout(100); ok('T turns auto-target on', await D('return d.W.autoT == 1'));
 const at = await D(`d.foes().length = 0; d.p3.spawnFoe('pup', d.p.x + 80, d.p.y); d.p3.spawnFoe('golem', d.p.x + 300, d.p.y); d.p3.spawnFoe('golem', d.p.x - 200, d.p.y); const F = d.foes(); F.forEach(f => { f.stun = 99; f.hp = f.max; }); const tg = d.p3.autoTarget(); return [tg.k, Math.round(Math.hypot(tg.x - d.p.x, tg.y - d.p.y))]`);
 ok('auto-target picks the strongest (Ice Golem), the closer one first', at[0] == 'golem' && at[1] == 200, at);
 await D('d.p.ammo = 20; d.p.face = 0'); await p.keyboard.down(' '); await p.waitForTimeout(60); await p.keyboard.up(' '); await p.waitForTimeout(40);
 await D('d.foes().length = 0');
 // skills: no rank cap
 const sk = await D('d.W.sk.dmg = 5; d.W.sk.spd = 5; d.W.sk.crit = 5; const m0 = d.p3.X.armM(), s0 = d.p3.X.spd(); d.W.sk.dmg = 6; d.W.sk.spd = 6; d.W.sk.crit = 8; return [d.p3.X.armM() > m0, d.p3.X.spd() > s0, d.p3.X.crit()]');
 ok('skills go past rank 5 and still do something (damage, speed; crit chance stays, crit damage grows)', sk[0] && sk[1], sk);
 await D('d.p3.skillPanel()'); await p.waitForTimeout(200); ok('skill panel: no MAX buttons', await D('return !JSON.stringify(d.p3.panel()()).includes("MAX")'));
 await D('d.p3.panelDown && null'); await D('d.p3.skillPanel && null');
 // dialogue: Space doesn't skip, a fast click doesn't skip
 await p.keyboard.press('Escape'); await p.waitForTimeout(100); await D('d.p3.talk([["Test", "t", "line one"], ["Test", "t", "line two"]])'); await p.keyboard.press(' '); await p.waitForTimeout(100); ok('Space does not skip dialogue', (await D('return d.dlg() && d.dlg().i')) === 0);
 await p.mouse.click(700, 300); await p.waitForTimeout(60); ok('a click right as the line appears does not skip it', (await D('return d.dlg() && d.dlg().i')) === 0);
 await p.waitForTimeout(500); await p.mouse.click(700, 300); await p.waitForTimeout(60); ok('a normal click still advances', (await D('return d.dlg() && d.dlg().i')) === 1);
 await p.keyboard.press('Enter'); await p.waitForTimeout(60); ok('Enter advances/ends dialogue', !(await D('return !!d.dlg()')));
 // god fight: Arena Freeze and Starfall never overlap; safe circles never inside a Starfall
 const gres = await p.evaluate(()=>{ const P = window.Arcade.SAGA.post, gx = P.gx(), hz = gx.hz; hz.length = 0; const B = {k:'god3', x:0, y:0, hx:0, hy:0, r:34, hp:1, max:1}; let both = 0, badSafe = 0, fz = 0, ko = 0;
   for (let i = 0; i < 6000; i++) { P.ai(B, .05, 3, 0, 500); for (const h of hz) h.t -= .05; for (let j = hz.length - 1; j >= 0; j--) if (hz[j].t < -.4) hz.splice(j, 1);
     const kos = hz.filter(h => h.ko && h.t > 0), fzs = hz.filter(h => h.freeze && h.t > 0); if (kos.length && fzs.length) both++; fzs.forEach(f => { if (!f.counted) { f.counted = 1; fz++; } f.safes.forEach(q => { if (kos.some(k => Math.hypot(q.x - k.x, q.y - k.y) < k.r)) badSafe++; }); }); kos.forEach(k => { if (!k.counted) { k.counted = 1; ko++; } }); }
   return {freezes:fz, starfalls:ko, overlapFrames:both, safeInsideStarfall:badSafe}; });
 ok('300 s of the god fight: freezes and starfalls happen but never at the same time', gres.freezes > 5 && gres.starfalls > 5 && gres.overlapFrames == 0 && gres.safeInsideStarfall == 0, gres);
 ok('Gecko God: 50 layers × 1,500 health', await p.evaluate(()=>window.Arcade._snowT.BOSS.geckogod.hp) == 75000);
 console.log(errs.filter(e => !e.includes('Failed to load'))); await b.close(); })();
