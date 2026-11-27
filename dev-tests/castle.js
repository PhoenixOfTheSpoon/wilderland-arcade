const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1600,height:1000}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 for (const [tier, lv] of [[0, 0], [1, 1], [2, 3], [3, 4]]) { await D(`d.W.base.tier = ${tier}; for (const k of ['barracks','guard','forge','kitchen','pantry','trophy','shrine','yard','well','defenses']) d.W.base.rooms[k] = ${lv};`);
   for (const [i, [x, y]] of [[44, 82], [56, 90]].entries()) { await D(`d.p.x = ${x}*48; d.p.y = ${y}*48;`); await p.waitForTimeout(700); await p.screenshot({path:`castle-${tier}-${i}.png`}); } }
 // walk through each gate: from inside to 6 tiles outside
 for (const [name, sx, sy, mx, my] of [['N', 50, 80, 0, -1], ['S', 50, 92, 0, 1], ['W', 42, 86, -1, 0], ['E', 58, 86, 1, 0]]) { await D(`d.p.x = ${sx}.5*48; d.p.y = ${sy}.5*48;`); const k = {'0,-1':'w', '0,1':'s', '-1,0':'a', '1,0':'d'}[mx + ',' + my]; await p.keyboard.down(k); await p.waitForTimeout(2600); await p.keyboard.up(k);
   console.log('gate', name, await D(`return [Math.floor(d.p.x/48), Math.floor(d.p.y/48)]`)); }
 console.log(errs); await b.close(); })();
