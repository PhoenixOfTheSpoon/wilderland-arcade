const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, snowball:{}})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); }); await p.waitForTimeout(800);
 console.log(await p.evaluate(() => { const S = window.Arcade.SAGA.story.api.S, T = window.Arcade._snowT, N = 140, d = window.Arcade._dbg.snow().wm().dbg();
   const pass = (x, y) => { if (x < 0 || y < 0 || x >= N || y >= N) return false; const v = S.tileAt(x, y); return v == 9 || v == 13 || !T.SOLID[v]; };
   const seen = new Uint8Array(N*N), q = [[50, 88]]; seen[88*N + 50] = 1; while (q.length) { const [x, y] = q.pop(); for (const [a, b2] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + a, ny = y + b2; if (pass(nx, ny) && !seen[ny*N + nx]) { seen[ny*N + nx] = 1; q.push([nx, ny]); } } }
   const bad = d.chests.filter(c => !seen[c.ty*N + c.tx]).map(c => c.id + '@' + c.tx + ',' + c.ty);
   return 'unreachable chests: ' + bad.length + ' / ' + d.chests.length + ' → ' + bad.join(' '); }));
 await b.close(); })();
