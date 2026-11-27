const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world,app} = await L.start(); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; }); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 await D(`d.W.mau = 1; d.W.bau = 1; SG.raidAdm.enter(2, 0); SG.raidAdm.floor(2);`); await p.waitForTimeout(300);
 // walk through the door holding E
 await D(`const F = SG.F(); F.done = true; F.door = true; const G = d.goal(); d.p.x = G.x; d.p.y = G.y + 60;`); await p.keyboard.down('e'); await p.waitForTimeout(50); await p.keyboard.up('e');
 await D(`const G = d.goal(); d.p.x = G.x; d.p.y = G.y;`); await p.waitForTimeout(200); await p.keyboard.press('e'); await p.waitForTimeout(200); await p.keyboard.press('e'); await p.waitForTimeout(300);
 const st = await D(`return [!!SG.run(), SG.run() && SG.run().fi]`); ok('pressing E at / right after the door does NOT exit the raid (E at the door goes forward)', st[0] && st[1] >= 2, st); const FI = st[1];
 // leave on purpose (two presses), then reload → resume at the same floor
 await p.waitForTimeout(3200); await D(`const F = SG.F(); d.p.x = F.spawn.x; d.p.y = F.spawn.y;`); await p.keyboard.press('e'); await p.waitForTimeout(150); const one = await D(`return !!SG.run()`); await p.keyboard.press('e'); await p.waitForTimeout(300);
 const left = await D(`return [!!SG.run(), SG.RS.run]`); ok('leaving needs a second E press, then saves the floor', one && !left[0] && left[1] && left[1].fi == FI, {one, left});
 await p.reload(); await p.waitForTimeout(5000); await world(); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const rs = await D(`return SG.RS.run`); ok('saved floor survives a reload', rs && rs.fi == FI, rs);
 const res = await D(`const RS = SG.RS; const R = SG.RAIDS.find(R2 => R2.id == RS.run.id); SG.startRun(R, RS.run.d, RS.run.key, RS.run.fi, RS.run); return SG.run().fi`); ok('resume starts on that floor', res == FI, res);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
