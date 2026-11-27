const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start(); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; }); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const res = await D(`const out = []; const FW = 34, FH = 24; for (let n = 1; n <= 10; n++) for (let dd = 0; dd < 4; dd++) { const orders = new Set(); let bad = 0, lens = [];
   for (let rep = 0; rep < 3; rep++) { d.W.mau = 1; d.W.bau = 1; SG.raidAdm.enter(n, dd); const r = SG.run(); lens.push(r.plan.length); orders.add(r.plan.map(q => q.c).join(''));
     for (let fi = 0; fi < r.plan.length; fi++) { SG.raidAdm.floor(fi + 1); const F = SG.F(); const V = (x, y) => x < 0 || y < 0 || x >= FW || y >= FH ? 1 : F.V[y*FW + x];
       const sx = Math.floor(F.spawn.x/48) - (F.ox || 0); const seen = new Set(); const st = []; let found = false;
       // flood from the bottom middle to the top door
       st.push([16, FH - 3]); seen.add(16 + ',' + (FH - 3)); while (st.length) { const [x, y] = st.pop(); if (y <= 2 && Math.abs(x - 16.5) < 2) { found = true; break; } for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const X = x + dx, Y = y + dy, v = V(X, Y); if (seen.has(X + ',' + Y) || (v >= 1 && v <= 3 && !(Y <= 1 && Math.abs(X - 16.5) < 2))) continue; seen.add(X + ',' + Y); st.push([X, Y]); } }
       if (!found && F.code != 'm') bad++; } SG.leaveRun ? 0 : 0; }
   out.push([n, dd, lens[0], r0 = orders.size, bad]); } return out;`);
 const base = await D('return SG.RAIDS.map(R => R.fl.length)');
 ok('floor count = base + difficulty extra (0/1/2/3)', res.every(([n, dd, len]) => len == base[n - 1] + dd), res.filter(([n, dd, len]) => len != base[n - 1] + dd));
 ok('order changes between runs (most raids)', res.filter(r => r[3] > 1).length >= 30, res.map(r => r[3]).join(''));
 ok('every non-maze floor has a way from the entrance to the door', res.every(r => r[4] == 0), res.filter(r => r[4]));
 // twists + elite floors on Nightmare
 const tw = await D(`d.W.mau = 1; SG.raidAdm.enter(1, 3); const r = SG.run(); return r.plan.map(q => q.c + (q.tw ? ':' + q.tw : '') + (q.extra ? '*' : ''))`);
 ok('Nightmare plan has elite + 2 guardian echo floors and twists', tw.filter(x => x.includes('*')).length == 3 && tw.some(x => x.includes(':')), tw);
 const shrink = await D(`for (let k = 0; k < 40; k++) { SG.raidAdm.enter(2, 3); const r = SG.run(); const i = r.plan.findIndex(q => q.tw == 'shrink'); if (i >= 0) { SG.raidAdm.floor(i + 1); const F = SG.F(); const r0 = F.zr.r; for (let j = 0; j < 100; j++) d.update(0.05); return [r0, SG.F().zr.r]; } } return null`);
 ok('shrinking ring floor shrinks', shrink && shrink[1] < shrink[0], shrink);
 const nb = await D(`SG.raidAdm.enter(1, 3); SG.raidAdm.boss(); for (let j = 0; j < 60; j++) d.update(0.05); const B = d.bossNow(); return B ? [B.phases, B.rd.K.ph.length] : null`);
 const nb0 = await D(`SG.raidAdm.enter(1, 2); SG.raidAdm.boss(); for (let j = 0; j < 60; j++) d.update(0.05); const B = d.bossNow(); return B ? B.phases : null`);
 ok('Nightmare final boss has one more phase than Mythic', nb && nb0 && nb[0] == nb0 + 1, {nightmare:nb, mythic:nb0});
 const trap = await D(`SG.raidAdm.enter(3, 1); SG.raidAdm.floor(1); d.p3 && 0; let z = 0; for (let j = 0; j < 200; j++) { d.update(0.05); z = Math.max(z, SG.hz().length); } return z`);
 ok('Heroic: traps go off on normal floors', trap > 0, trap);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
