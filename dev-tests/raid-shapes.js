const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start({ctx:{viewport:{width:1100,height:760}}}); await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; }); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 let shot = 0; for (let k = 0; k < 30 && shot < 3; k++) { const info = await D(`d.W.mau = 1; SG.raidAdm.enter(${1 + (k % 10)}, 2); const r = SG.run(); const i = r.plan.findIndex(q => q.c == 'c' && q.shape && q.shape != 5 && q.shape > ${shot}); if (i < 0) return null; SG.raidAdm.floor(i + 1); return [r.R.n, r.plan[i].shape, r.plan[i].tw]`);
   if (!info) continue; await p.waitForTimeout(400); await p.evaluate(()=>{ const c = [...document.querySelectorAll('canvas')].find(c => c._lw); }); await D('d.p.y -= 0'); for (let i=0;i<3;i++){ await p.keyboard.press('m'); await p.waitForTimeout(100); await p.keyboard.press('m'); }
   await p.waitForTimeout(500); await p.screenshot({path:__dirname + '/rshape-' + shot + '.png'}); console.log(shot, info); shot++; }
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
