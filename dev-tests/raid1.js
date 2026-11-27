const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
const N = +(process.argv[2] || 1), DIF = +(process.argv[3] || 0), SHOT = process.argv[4];
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console', m => { if (m.type()=='error') errs.push('console: '+m.text()); });
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 console.log('hooks:', await D('return [typeof SG.warTable, typeof SG.raidAdm, !!window.Arcade.RAIDS]'));
 await D(`d.W.mau = 1; d.W.bau = 1; SG.raidAdm.enter(${N}, ${DIF})`); await p.waitForTimeout(600);
 const R = await D('const r = SG.run(); return {n:r.R.n, fl:r.plan.map(q => q.c).join(""), fi:r.fi}'); console.log(R);
 for (let fi = 0; fi < R.fl.length; fi++) { await D(`SG.raidAdm.floor(${fi+1})`); await p.waitForTimeout(400);
   if (SHOT) await p.screenshot({path:`rd-${N}-${fi}.png`});
   // play: auto-throw at goal, move toward goal for a few seconds
   let st = ''; for (let k = 0; k < 40; k++) { st = await D(`const F = SG.F(), G = d.goal(); if (!G) return 'nogoal'; const B = d.bossNow(); if (B) { B.hp -= B.max*.04; if (B.hp <= 0) d.hurtBoss(1); } d.foes().forEach(f => { f.hp -= 2; }); const o = F.obj;
       if (F.code == 'r' && o.seen !== undefined) { o.seen = 1; const pl = o.plates[o.order[o.step]]; if (pl) { d.p.x = pl.x; d.p.y = pl.y; } }
       else if (F.code == 'b') { o.br.forEach(b2 => b2.lit = 30); } else if (F.code == 'l') { o.step = 4; } else if (F.code == 'k') { o.keys.forEach(k => k.got = 1); }
       else if ((F.code == 'g' || F.code == 'm' || F.done) && !B) { d.p.x = G.x; d.p.y = G.y; }
       return F.code + ' fi' + SG.run().fi + ' done' + F.done + ' door' + F.door + ' boss ' + (B ? B.n + ' ' + Math.round(B.hp) + ' ph' + B.ph + ' act ' + (B.rd.act ? B.rd.act.id : '-') : '-') + ' goal ' + G.n.slice(0, 60);`);
     await p.waitForTimeout(250); if (await D('return !SG.run() || SG.run().fi != ' + fi + ' || !!SG.vic()')) break; }
   console.log(fi, st); if (await D('return !!SG.vic()')) { console.log('VICTORY'); if (SHOT) await p.screenshot({path:`rd-${N}-vic.png`}); break; } }
 console.log('errors:', errs.slice(0, 8)); await b.close(); })();
