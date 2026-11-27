const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
const LIST = (process.argv[2] || '1').split(',').map(Number), DIF = +(process.argv[3] || 0), SECS = +(process.argv[4] || 14), MINI = process.argv[5] == 'mini';
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 for (const N of LIST) {
 await D(`d.W.mau = 1; d.W.bau = 1; SG.raidAdm.enter(${N}, ${DIF}); SG.raidAdm.floor(SG.run().R.fl.${MINI ? "indexOf('G')+1" : 'length'});`); await p.waitForTimeout(300);
 const acts = new Set(); let shots = 0;
 for (let k = 0; k < SECS*4; k++) { const st = await D(`const B = d.bossNow(); if (!B) return null; d.p.x = B.x + 260; d.p.y = B.y + 120; d.p.hp = d.p.max; return {n:B.n, hp:Math.round(B.hp), max:B.max, ph:B.ph, act:B.rd && B.rd.act ? B.rd.act.id : '', hz:SG.hz().length, foes:d.foes().length, x:Math.round(B.x), y:Math.round(B.y)}`);
   if (st) { acts.add(st.act); if (k % 8 == 0) await D('const B = d.bossNow(); B.hp -= B.max*.07; d.hurtBoss(.1);'); }
   if ((k == SECS*2 || k == SECS*4 - 4) && shots < 2) { shots++; await p.screenshot({path:`rb-${N}${MINI ? 'm' : ''}-${shots}.png`}); }
   await p.waitForTimeout(250); }
 console.log(N, await D('const B = d.bossNow(); return B ? B.n + " ph" + B.ph + " hp" + Math.round(B.hp) : (SG.vic() ? "VICTORY" : "no boss")'), [...acts].join(','));
 await D('SG.leaveRun && SG.vic() ? 0 : 0'); await D('if (SG.vic()) { } SG.leaveRun()'); }
 console.log('errors:', errs.slice(0, 8)); await b.close(); })();
