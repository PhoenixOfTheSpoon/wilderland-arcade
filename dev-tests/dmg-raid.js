const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 const S = s => p.evaluate('(()=>{ const sn = window.Arcade._dbg.snow(); const P = sn.PERM; '+s+' })()');
 // gear like the screenshot: Snow +5 gloves, Legendary/Epic others
 await S('P.gear = []; P.eq = {}; const add = (sl, r, lv) => { const it = sn.makeGear(0, sl); it.rar = r; it.lv = lv; P.eq[sl] = it.id; }; add("gloves",6,5); add("boots",4,2); add("hat",4,1); add("scarf",3,0); add("pack",4,0); sn.openPanel("loadout"); return 1');
 await p.waitForTimeout(300); console.log(await p.evaluate(()=>(document.body.innerText.match(/💥 Gear damage[^\n]*/)||[])[0]));
 await p.evaluate(()=>{ document.querySelectorAll('button').forEach(b=>{ if (/Done/.test(b.textContent)) b.click(); }); window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 console.log('Kingdom damage per plain snowball (X.armM):', await D('return d.p3.X.armM().toFixed(2) + " (gear x" + d.p3.X.gDmg().toFixed(2) + ")"'));
 // raid victory rewards
 const before = await D('const P = window.Arcade._dbg.snow().PERM; return {frost:P.frost, bank:P.bank, gear:P.gear.length, tok:SG.RS.tok}');
 await D('d.W.mau = 1; d.W.bau = 1; SG.raidAdm.enter(1, 1)'); await p.waitForTimeout(600);
 await D('SG.raidAdm.boss()'); await p.waitForTimeout(1500); for (let i=0;i<60;i++){ const st = await D('if (SG.vic()) return 1; SG.raidAdm.skip(); const B = d.bossNow ? d.bossNow() : null; if (B) { B.hp = Math.min(B.hp, 1); d.hurtBoss(5); } return 0'); if (st) break; await p.waitForTimeout(250); }
 const v = await D('const V = SG.vic(); return V ? V.loot.map(l => l.e + " " + l.n).join(" | ") : "no vic; raidAdm keys: " + Object.keys(SG.raidAdm).join(",")');
 console.log('loot:', v);
 const after = await D('const P = window.Arcade._dbg.snow().PERM; return {frost:P.frost, bank:P.bank, gear:P.gear.length}');
 console.log('before', before, 'after', after);
 console.log('errors', errs.slice(0,5)); await b.close(); })();
