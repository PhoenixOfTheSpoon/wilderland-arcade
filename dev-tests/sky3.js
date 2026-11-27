const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
const REG = process.argv[2] || 'sky', CLOAK = process.argv[3] != '0';
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 await D(`window.Arcade.SAGA.story.adm.region("${REG}")`); await p.waitForTimeout(500); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const res = await D(`SG.SV.cloak = ${CLOAK?1:0}; const C = SG.C(), T = SG.T, RW = SG.RW, RH = SG.RH, out = [], solid = v => SG.tl(v) ; let n = 0;
   const at = (x,y) => C.M[y*RW + x];
   for (let y = 2; y < RH - 2; y++) for (let x = 2; x < RW - 2; x++) { const v = at(x,y); const nb = [[1,0],[-1,0],[0,1],[0,-1]].map(([a,b2]) => at(x+a,y+b2)); const edge = nb.some(q => q != v); if (!edge) continue;
     for (const [ox, oy] of [[.5,.5],[.15,.5],[.85,.5],[.5,.15],[.5,.85]]) { const q0 = SG.W2T({x:x + ox - .5, y:y + oy - .5}); let esc = false; const tr = [];
       for (const [mx,my] of [[0,-1],[0,1],[-1,0],[1,0]]) { d.p.x = q0.x; d.p.y = q0.y; d.p.vx = d.p.vy = 0; SG.setStam(100); for (let f = 0; f < 30; f++) SG.move(1/60, mx, my); const dd = Math.hypot(d.p.x - q0.x, d.p.y - q0.y); tr.push(Math.round(dd)); if (dd > 24) { esc = true; break; } }
       n++; if (!esc && out.length < 25) out.push([x, y, ox, oy, v, nb.join(''), tr.join('/')]); } }
   return {n, stuck:out};`);
 console.log(REG, 'cloak', CLOAK, 'tested', res.n, 'stuck', res.stuck.length); res.stuck.forEach(s => console.log(JSON.stringify(s)));
 console.log(await D('return JSON.stringify(SG.T)'), errs.slice(0,3)); await b.close(); })();
