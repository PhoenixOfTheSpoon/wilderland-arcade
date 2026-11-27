const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ if (!localStorage.getItem('wl-arcade-v1')) localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 const open = async () => { await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200); await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800); };
 await open(); const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 // pretend old raid clears exist (they must carry over)
 console.log('migrated:', await D('return JSON.stringify(SG.RS.clr)'));
 await D('d.W.mau = 1; d.W.bau = 1; d.p.x = 44.5*48; d.p.y = 92.3*48;'); await p.waitForTimeout(500);
 await D('SG.warTable()'); await p.waitForTimeout(400); await p.screenshot({path:'wt-1.png'});
 // pick Library → start
 await D('d.p3.panel(); ');
 await D('SG.startRun(SG.RAIDS[0], 0, 0)'); await p.waitForTimeout(300);
 await D('SG.raidAdm.floor(6)'); await p.waitForTimeout(3500);
 for (let i = 0; i < 30 && !(await D('return !!SG.vic()')); i++) { await D('const B = d.bossNow(); if (B) { B.hp -= B.max*.12; d.hurtBoss(.1); }'); await p.waitForTimeout(150); }
 await p.waitForTimeout(4500); await p.screenshot({path:'wt-vic.png'});
 console.log('vic', await D('return SG.vic() && SG.vic().loot.map(l => l.n)'));
 await p.keyboard.press('Enter'); await p.waitForTimeout(500);
 console.log('after:', await D('return {run:!!SG.run(), tok:SG.RS.tok, clr:JSON.stringify(SG.RS.clr), keys:JSON.stringify(SG.RS.keys), maxD:JSON.stringify(SG.RS.maxD), lock:JSON.stringify(SG.RS.lock)}'));
 // start another, leave mid-run (saved floor), then reload
 await D('SG.startRun(SG.RAIDS[1], 0, 0); SG.raidAdm.floor(3);'); await p.waitForTimeout(400); await D('SG.leaveRun("x", true)'); await p.waitForTimeout(300);
 await p.evaluate(app+'.close && 0'); await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
 await open(); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 console.log('reloaded:', await D('return {tok:SG.RS.tok, run:JSON.stringify(SG.RS.run), clr:JSON.stringify(SG.RS.clr), gear:(d.W && 1)}'));
 await D('SG.warTable()'); await p.waitForTimeout(400); await p.screenshot({path:'wt-2.png'});
 console.log('errors:', errs.slice(0, 8)); await b.close(); })();
