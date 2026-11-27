const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start(); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; }); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const P = 'window.Arcade._dbg.snow().PERM';
 const a = await D(`d.W.mau = 1; d.W.bau = 1; const P = ${P}; P.frost = 0; P.bank = 0; SG.raidAdm.endless(); const r = SG.run(); return [!!r.endless, r.endless.n, Math.round(r.endless.t), SG.RS.run]`);
 ok('Endless starts on floor 1 with a 100 s timer and no resume save', a[0] && a[1] == 1 && a[2] == 100 && !a[3], a);
 // clear 4 floors via the door
 const fl = await D(`const P = ${P}, r = SG.run(), out = []; for (let k = 0; k < 4; k++) { const F = SG.F(); F.done = true; F.door = true; const G = d.goal(); d.p.x = G.x; d.p.y = G.y; const f0 = P.frost, b0 = P.bank; d.update(0.05); out.push([P.frost - f0, P.bank - b0, r.endless.n]); } return out`);
 ok('rewards double every floor: 10/250, 20/500, 40/1000, 80/2000', JSON.stringify(fl.map(x => [x[0], x[1]])) == JSON.stringify([[10,250],[20,500],[40,1000],[80,2000]]), fl);
 const g = await D(`const r = SG.run(); return [r.plan.length, r.plan[4].c, r.d, r.key]`);
 ok('floor 5 is a guardian floor; difficulty rises', g[1] == 'M' && g[2] >= 1, g);
 // time out → run ends, keeps rewards, best saved
 const to = await D(`const P = ${P}, f0 = P.frost; SG.run().endless.t = 0.01; d.update(0.05); return [!!SG.run(), SG.RS.endBest, P.frost - f0]`);
 ok('time out ends the run, keeps rewards, saves best floor 4', !to[0] && to[1] == 4 && to[2] == 0, to);
 const big = await D(`SG.raidAdm.endFloor(25); const r = SG.run(); return [r.endless.n, r.endless.earned.frost]`);
 ok('floor 25 reachable (admin) and rewards keep doubling', big[0] == 25 && big[1] == 10*(Math.pow(2, 24) - 1), big);
 await p.screenshot({path:__dirname + '/raid-endless.png'});
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
