const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start(); await world(); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 await D('d.W.sp = 6; const G = window.Arcade.snowExp.GATES[0]; d.p.x = (G.x + .5)*48; d.p.y = (G.y + .5)*48;'); await p.waitForTimeout(300); await p.keyboard.press('e'); await p.waitForTimeout(300);
 const t = await D('const P = d.p3.panel(); return P ? P().title : null'); console.log((t && /Expedition/.test(t) ? 'PASS' : 'FAIL') + ' the East Expedition Gate opens the Expedition Board', t);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
