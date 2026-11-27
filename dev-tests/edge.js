// Walk along every cliff edge in Frostfang and the Glaciers, pushing in all directions: count "Unstuck" teleports and true stalls.
const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 for (const r of ['frostfang', 'glaciers', 'hollow', 'citadel']) {
   await D(`window.Arcade.SAGA.story.adm.region(${JSON.stringify(r)})`); await p.waitForTimeout(400); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
   const edges = await D('const C = SG.C(), out = []; for (let y = 2; y < SG.RH - 2; y += 1) for (let x = 2; x < SG.RW - 2; x++) { const v = C.M[y*SG.RW + x]; if (v != SG.T.CLIFF) continue; for (const [a, b2] of [[0,-1],[0,1],[1,0],[-1,0]]) { const n = C.M[(y+b2)*SG.RW + x + a]; if (!d.W || [0,1,4,5,20,25,26,8,10].includes(n)) { out.push([x + a, y + b2, -a, -b2]); break; } } } return out.filter((_, i) => i % 9 == 0).slice(0, 14);');
   let unstuck = 0, stalls = 0;
   let full = 0, say = 0; for (const [x, y, dx, dy] of edges) { let st = 0; await D(`const q = SG.W2T({x:${x}, y:${y}}); d.p.x = q.x; d.p.y = q.y; d.p.vx = d.p.vy = 0; SG.setStam(100);`); await p.waitForTimeout(150);
     for (const k of ['w','a','s','d']) { const b0 = await D('return [d.p.x, d.p.y]'); await p.keyboard.down(k); await p.waitForTimeout(400); await p.keyboard.up(k); const b1 = await D('return [d.p.x, d.p.y]'); if (Math.hypot(b1[0]-b0[0], b1[1]-b0[1]) < 3) { stalls++; st++; } } if (st == 4) full++; if (/Unstuck/.test(await p.evaluate(()=>document.body.innerText))) say++;
     const m = await p.evaluate(()=>document.body.innerText); }
   const n = await p.evaluate(()=>window.__u||0); console.log(r, 'edges', edges.length, 'stalled pushes', stalls, '/', edges.length*4, 'fully stuck spots', full); }
 console.log(errs); await b.close(); })();
