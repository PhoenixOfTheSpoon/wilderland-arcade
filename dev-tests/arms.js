const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start({ctx:{viewport:{width:900,height:700}, deviceScaleFactor:2}}); await world();
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 for (const [n, s] of [['idle', 'd.p.face = 0; d.p.throwT = 0; d.p.inv = 0; d.p.hurt = 0'], ['walk', 'd.p.face = 0; d.p.throwT = 0; d.p.inv = 0; d.p.hurt = 0; d.p.walk = 0.12'], ['left', 'd.p.face = Math.PI; d.p.throwT = 0; d.p.inv = 0'], ['charge', 'd.p.face = 2.5; d.p.throwT = 0; d.p.inv = 0'], ['throw', 'd.p.face = -0.6; d.p.throwT = 5']]) { await D(s + '; d.p.inv = 0'); await p.waitForTimeout(120);
   const q = await D('return [d.p.x, d.p.y]'); const cam = await p.evaluate(()=>{ const c = [...document.querySelectorAll('canvas')].find(c => c._lw) || document.querySelector('canvas'); const r = c.getBoundingClientRect(); return [r.x, r.y, r.width]; });
   await p.screenshot({path:__dirname + '/arms-' + n + '.png', clip:{x:cam[0] + cam[2]/2 - 60, y:250, width:120, height:200}}); }
 console.log(errs.filter(e => !e.includes('Failed to load'))); await b.close(); })();
