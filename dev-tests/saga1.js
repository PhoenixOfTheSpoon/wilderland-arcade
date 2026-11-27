const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1])); p.on('console', m => { if (m.type()=='error' && !/Failed to load/.test(m.text())) errs.push('console: '+m.text().slice(0,300)); });
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, upg:{snowball:{mate:5}}})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(1000);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 const skip = async () => { for (let i=0;i<40;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); await p.waitForTimeout(30); } };
 console.log('SG ready:', await D('return !!SG'));
 await D('wm.adm.chapter(6);'); await skip();
 await D('SG.SV.ch = 0; SG.SV.step = 0;'); await p.waitForTimeout(300);
 console.log('goal at camp:', await D('return d.goal() && d.goal().n'));
 await p.screenshot({path:__dirname+'/saga-camp.png'});
 // Ch1 step0: talk to Loki → step 1 pip → cloak
 for (let s = 0; s < 2; s++) { await D('const G = d.goal(); d.p.x = G.x; d.p.y = G.y + 20;'); await p.waitForTimeout(200); console.log('near:', await D('const G = d.goal(); return d.things().filter(t=>Math.hypot(t.x-G.x,t.y-G.y)<80).map(t=>t.n+"@"+Math.round(Math.hypot(t.x-G.x,t.y-G.y))).join(",")')); await D('const G = d.goal(); const T = d.things().filter(t=>t.n=="⭐ Talk").sort((a,b)=>Math.hypot(a.x-G.x,a.y-G.y)-Math.hypot(b.x-G.x,b.y-G.y))[0]; T.f();'); await skip(); }
 console.log('after talks: step', await D('return SG.SV.ch+":"+SG.SV.step+" cloak="+SG.SV.cloak'));
 // travel
 await D('SG.enter("frostfang", 0)'); await p.waitForTimeout(800); await skip();
 console.log('in region:', await D('return SG.cur() + " step " + SG.SV.step + " goal: " + (d.goal()||{}).n'));
 await p.screenshot({path:__dirname+'/saga-frost.png'});
 // fps + errors in region
 const fps = await p.evaluate(()=>new Promise(r=>{ let n=0; const t0=performance.now(); const f=()=>{ n++; if (performance.now()-t0<1000) requestAnimationFrame(f); else r(n); }; requestAnimationFrame(f); })); console.log('fps', fps);
 // walk around with keys
 for (const k of ['d','w','a','s']) { await p.keyboard.down(k); await p.waitForTimeout(700); await p.keyboard.up(k); }
 console.log('pos', await D('return Math.round(d.p.x)+","+Math.round(d.p.y)+" mode="+SG.mode()+" stam="+Math.round(SG.stam())'));
 // shrine puzzles: generate all 66 and confirm solver results
 console.log('puzzles:', await D('const out = {slide:0, gems:0, push:0}, bad = []; SG.REGIONS.forEach(R => { for (let j=0;j<6;j++){ const P = SG.makePuzzle(R.id, j); out[P.kind]++; out.min = Math.min(out.min||99, P.best); out.max = Math.max(out.max||0, P.best); if (P.best < 4) bad.push(R.id+j+":"+P.best); } }); return JSON.stringify(out) + " weak:" + bad.join(",")'));
 // open a shrine and solve it with the solver path check via shrineSolve
 await D('SG.openShrine(0)'); await p.waitForTimeout(300); await p.screenshot({path:__dirname+'/saga-shrine.png'}); await D('SG.shrineSolve()'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
 console.log('emblems', await D('return SG.SV.emb'));
 console.log('errors', errs.slice(0,10)); await b.close(); })();
