const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start(); await world(); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const r = await D(`d.W.mau = 1; SG.raidAdm.enter(4, 2); SG.raidAdm.floor(3); const a = SG.run().plan.map(q => q.c + (q.tw || '')).join(','); SG.leaveRun('x', true); const RS = SG.RS; const R = SG.RAIDS.find(R2 => R2.id == RS.run.id); SG.startRun(R, RS.run.d, RS.run.key, RS.run.fi, RS.run); return [a, SG.run().plan.map(q => q.c + (q.tw || '')).join(','), SG.run().fi]`);
 console.log((r[0] == r[1] && r[2] == 2 ? 'PASS' : 'FAIL') + ' resume keeps the same floors and floor number', r);
 await p.reload(); await p.waitForTimeout(5000); await world(); const sv = await D('return SG.RS.run && SG.RS.run.seed ? 1 : 0'); console.log((sv ? 'PASS' : 'FAIL') + ' saved run keeps its seed after reload');
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
