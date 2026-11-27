const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 const S = s => p.evaluate('(()=>{ const sn = window.Arcade._dbg.snow(); const P = sn.PERM; '+s+' })()');
 // only gloves: 1 equipped Mythic, 1 spare Snow, 1 spare Celestial, spare Phoenix, Phoenix +1, Phoenix +5
 await S('P.gear = []; P.eq = {}; const add = (r, n) => P.gear.push({id:P.gid++, slot:"gloves", rar:r, lv:0, name:n}); add(5,"EQ"); P.eq.gloves = P.gear[0].id; add(6,"SNOW"); add(7,"CEL"); add(8,"PHX"); add(9,"PHX1"); add(13,"PHX5"); sn.openPanel("loadout"); return 1');
 await p.waitForTimeout(300);
 console.log('salvage buttons on gloves:', await p.locator('button', {hasText:/^Salvage/}).count(), '(expect 2: Snow and Celestial)');
 // bag overflow: 58 Phoenix spares + new drops must never delete Phoenix
 await S('for (let i=0;i<60;i++) P.gear.push({id:P.gid++, slot:"boots", rar:8, lv:0, name:"B"+i}); for (let i=0;i<5;i++) sn.makeGear(0, "hat"); return 1');
 console.log('Phoenix pieces after bag overflow:', await S('return P.gear.filter(x=>x.rar>=8).length'), '(expect 63)');
 console.log('errors', errs); await b.close(); })();
