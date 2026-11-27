const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 await D('d.W.bau = 1; d.W.mau = 1; SG.warTable()'); await p.waitForTimeout(300);
 // click every button through the real panel: choose Library, then START RAID
 const clickRow = txt => D(`const P = d.p3.panel()(); const i = P.rows.findIndex(r => r.n.includes(${JSON.stringify(txt)})); return i < 0 ? 'no row' : (P.rows[i].ok ? (P.rows[i].fn(), 'clicked') : 'DISABLED');`);
 console.log('choose:', await clickRow('Loki')); await p.waitForTimeout(200);
 console.log('start:', await clickRow('START')); await p.waitForTimeout(500);
 console.log('in raid:', await D('return !!SG.run()'));
 await D('SG.leaveRun()'); await D('SG.warTable()');
 const dis = await D('const P = d.p3.panel()(); return P.rows.filter(r => r.fn && !r.ok).map(r => r.n)'); console.log('disabled-with-action rows (should be locked raids only):', dis);
 console.log(errs); await b.close(); })();
