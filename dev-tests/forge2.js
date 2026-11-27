const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, upg:{snowball:{mate:5}}})); localStorage.setItem('wl-wn','2026-12-10'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(4000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(900);
 const S = s => p.evaluate('(()=>{ const sn = window.Arcade._dbg.snow(); const P = sn.PERM; '+s+' })()');
 // ARENA loadout forge + fuse
 await S('P.frost = 500; P.bank = 50000; P.cr = 9999; sn.openPanel("loadout"); return 1'); await p.waitForTimeout(300);
 await p.getByText(/Forge 🧤 Gloves/).click(); await p.waitForTimeout(200);
 console.log('forged msg:', await p.evaluate(()=>(document.body.innerText.match(/⚒️ Forged[^\n]*/)||[])[0]));
 for (let i=0;i<4;i++){ await S('const it = sn.makeGear(0, "boots"); it.rar = 0; return 1'); }
 await S('sn.openPanel("loadout"); return 1'); await p.waitForTimeout(200);
 const fuseBtn = p.getByText(/Fuse 3 Common 🥾/); console.log('fuse button:', await fuseBtn.count()); await fuseBtn.first().click(); await p.waitForTimeout(200);
 console.log('fused msg:', await p.evaluate(()=>(document.body.innerText.match(/✨ Fused[^\n]*/)||[])[0]));
 await p.screenshot({path:__dirname+'/forge-loadout.png'});
 await p.reload(); await p.waitForTimeout(4000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(900);
 // WORLD: forge row + regen
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const P3 = d.p3; '+s+' })()');
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 await D('P3.give({frost:400, flakes:20000}); P3.fortPanel();'); await p.waitForTimeout(200);
 console.log('row0:', await D('const r = P3.panel()().rows[0]; return r.n + " [" + r.btn + "] ok=" + r.ok'));
 await D('P3.panel()().rows[0].fn()'); console.log('after build:', await D('const r = P3.panel()().rows[0]; return r.n + " [" + r.btn + "] ok=" + r.ok'));
 const g0 = await S('return P.gear.length'); await D('P3.panel()().rows[0].fn()'); console.log('gear +', (await S('return P.gear.length')) - g0);
 await p.screenshot({path:__dirname+'/forge-world.png'});
 await D('P3.skillPanel()'); console.log('skills sub:', await D('return P3.panel()().sub.split("⚪")[1]'));
 // regen timing: empty ammo, wait 2s idle
 await p.keyboard.press('Escape'); await p.waitForTimeout(200); console.log('panel open?', await D('return !!P3.panel()'), 'dlg?', await D('return !!d.dlg()'));
 await D('d.p.ammo = 0; d.p.reload = 0; d.p.idleT = 0;'); for (let i=0;i<4;i++){ await p.waitForTimeout(300); console.log('t', await D('return [d.p.ammo, d.p.reload, d.p.idleT, d.p.x]')); } console.log('ammo after 2s (base):', await D('return d.p.ammo'));
 await D('d.W.sk.regen = 5; d.W.base.rooms.well = 1; d.W.mitten = 1; d.W.globe = 1; d.p.ammo = 0; d.p.reload = 0; d.p.idleT = 0;'); await p.waitForTimeout(1000); console.log('ammo after 1s (boosted):', await D('return d.p.ammo + "/" + window.Arcade._dbg.snow().wm().dbg().p.ammo'));
 console.log('errors', errs); await b.close(); })();
