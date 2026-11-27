const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}, deviceScaleFactor:2}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); const ST = window.Arcade.SAGA.story; '+s+' })()');
 const skip = async () => { for (let i=0;i<40;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); await p.waitForTimeout(25); } };
 await D('wm.adm.chapter(6)'); await skip(); await D('ST.adm.fight(1)'); await skip(); await D('d.p.y -= 140'); for (let i=0;i<30;i++){ await p.waitForTimeout(150); await skip(); if (await D('return !!d.bossNow()')) break; }
 await p.waitForTimeout(1500); await D('const B = d.bossNow(); d.p.x = B.x - 110; d.p.y = B.y + 40;'); await p.waitForTimeout(900); const sp = await D('const B = d.bossNow(); const c = d.p3 ? null : null; return [B.x, B.y]'); const cv = await p.evaluate(()=>{ const c = document.querySelector('canvas'); const r = c.getBoundingClientRect(); return [r.x, r.y, r.width, c.width/ (window.devicePixelRatio||1)]; }); const cam = await D('return [d.p.x, d.p.y]'); console.log('boss', sp, 'p', cam, cv); await p.screenshot({path:__dirname+'/gecko-full.png'});
 await D('const B = d.bossNow(); B.allowHit = 1; d.hurtBoss(B.hp + 5);'); let respawned = false; for (let i = 0; i < 20; i++) { await p.waitForTimeout(150); if (await D('return !!d.bossNow()')) respawned = true; }
 await skip(); for (let i = 0; i < 10; i++) { await p.waitForTimeout(150); if (await D('return !!d.bossNow()')) respawned = true; }
 console.log('dumpling respawned after defeat?', respawned, 'step', await D('return SG.SV.ch + ":" + SG.SV.step'));
 // raid floor 2 guardian
 await D('SG.leave(); wm.adm.raid(1)'); await skip(); await D('const R = d.p3.raid(); R.open = 1; const q = d.p3.rpx(20, 14); d.p.x = q.x; d.p.y = q.y + 60;'); for (let i=0;i<20;i++){ await p.waitForTimeout(150); await skip(); if (await D('return !!d.bossNow()')) break; }
 console.log('guardian', await D('const B = d.bossNow(); return B && B.k'));
 await D('const B = d.bossNow(); if (B) { B.hp = 1; d.hurtBoss(5); }'); let again = false; for (let i = 0; i < 20; i++) { await p.waitForTimeout(150); await skip(); if (await D('return !!d.bossNow()')) again = true; }
 console.log('guardian respawned?', again, 'open', await D('return d.p3.raid() && d.p3.raid().open'));
 console.log(errs); await b.close(); })();
