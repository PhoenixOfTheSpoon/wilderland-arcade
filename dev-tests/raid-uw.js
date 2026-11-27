const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start(); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = false; }); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const a = await D(`d.W.mau = 1; d.W.bau = 1; SG.RS.mask = 0; SG.raidAdm.enter(7, 0); const r = SG.run(); SG.raidAdm.floor(1); const F = SG.F(); return [r.uw, r.air, (F.vents || []).length, (SG.raidMods() || []).map(m => m.id)]`);
 ok('Sunken Ice Temple is underwater: air from stamina (40 s at 100), bubble vents, Deep Water mod', a[0] && a[1] == 40 && a[2] >= 2 && a[3].includes('deep'), a);
 const dr = await D(`const r = SG.run(); const F = SG.F(); d.p.x = F.spawn.x; d.p.y = F.spawn.y; d.p.inv = 0; const a0 = r.air; for (let k = 0; k < 100; k++) { d.p.x = F.spawn.x; d.p.y = F.spawn.y; d.update(0.05); } const a1 = r.air; d.p.x = F.vents[0].x; d.p.y = F.vents[0].y; for (let k = 0; k < 40; k++) { d.p.x = F.vents[0].x; d.p.y = F.vents[0].y; d.update(0.05); } return [a0, Math.round(a1*10)/10, Math.round(r.air*10)/10]`);
 ok('air drains (5 s → −5) and a bubble vent refills it', dr[1] < dr[0] - 4 && dr[2] > dr[1], dr);
 const out = await D(`const r = SG.run(); const F = SG.F(); r.air = 0; d.p.hp = 20; d.p.max = Math.max(d.p.max, 20); d.p.inv = 0; d.p.x = F.spawn.x; d.p.y = F.spawn.y; const h0 = d.p.hp; for (let k = 0; k < 120; k++) { d.p.inv = 0; d.p.x = F.spawn.x; d.p.y = F.spawn.y; d.update(0.05); } return [h0, d.p.hp]`);
 ok('out of air: you lose hearts until a vent', out[1] < out[0], out);
 const hp2 = await D(`const one = n => { SG.raidAdm.enter(n, 0); const i = SG.run().plan.findIndex(q => q.c == 'c'); SG.raidAdm.floor(i + 1); d.p.inv = 99; for (let k = 0; k < 400 && !d.foes().some(q => q.rf); k++) { d.p.inv = 99; d.update(0.05); } const fs = d.foes().filter(q => q.rf); return fs.reduce((x, q) => x + q.max/((window.Arcade._snowT.FOE[q.k] || {}).hp || 1), 0)/Math.max(1, fs.length); }; return [Math.round(one(4)*100)/100, Math.round(one(7)*100)/100]`);
 ok('temple enemies have about twice the health', hp2[1] > hp2[0]*1.7, hp2);
 // mask: buy + effect
 const mk = await D(`const P = window.Arcade._dbg.snow().PERM; P.frost = 5000; SG.RS.mask = 0; SG.raidAdm.enter(7, 0); SG.raidAdm.floor(1); const r = SG.run(), F = SG.F(); d.p.x = F.spawn.x; d.p.y = F.spawn.y; r.air = 40; for (let k = 0; k < 100; k++) { d.p.x = F.spawn.x; d.p.y = F.spawn.y; d.update(0.05); } const noMask = 40 - r.air; SG.RS.mask = 1; r.air = 40; for (let k = 0; k < 100; k++) { d.p.x = F.spawn.x; d.p.y = F.spawn.y; d.update(0.05); } return [Math.round(noMask*10)/10, Math.round((40 - r.air)*10)/10]`);
 ok('Breathing Mask lv1 drains air less than half as fast', mk[1] < mk[0]*.5, mk);
 await p.screenshot({path:__dirname + '/raid-uw.png'});
 // loot ×2: compare a temple victory with a library victory (same difficulty, first clear)
 const loot = await D(`const go = n => { SG.raidAdm.enter(n, 0); SG.raidAdm.boss(); for (let k = 0; k < 400 && !SG.vic(); k++) { const B = d.bossNow(); if (B) { SG.raidAdm.skip(); B.hp = Math.min(B.hp, 1); d.hurtBoss(5); } d.update(0.05); } const V = SG.vic(); const l = V ? V.loot.find(x => /Frost Crystals/.test(x.n)).n : 'none'; SG.closeVic(); return l; }; SG.RS.lock.got = {}; const a = go(1); SG.RS.lock.got = {}; const b2 = go(7); return [a, b2]`);
 ok('temple raid gives double rewards', loot && parseInt(loot[1].replace(/,/g, '')) >= 2*parseInt(loot[0].replace(/,/g, '')), loot);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
