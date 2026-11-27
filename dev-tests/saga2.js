const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1])); p.on('console', m => { if (/empty dialogue/.test(m.text())) errs.push(m.text().slice(0,600)); if (m.type()=='error' && !/Failed to load/.test(m.text())) errs.push('console: '+m.text().slice(0,300)); });
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, upg:{snowball:{mate:5}}})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(1000);
 const D = s => p.evaluate('(()=>{ if (!window.Arcade._dbg.snow().wm()) throw new Error("WORLD CLOSED"); })()').then(() => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); const ST = SG && SG.SV; '+s+' })()')).catch(e => { console.log('ERR', e.message.slice(0,200), JSON.stringify(errs.slice(0,6))); process.exit(1); });
 const skip = async () => { for (let i=0;i<40;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); await p.waitForTimeout(30); } };
 await D('wm.adm.chapter(6);'); await skip();
 for (const n of [1,2,3,4,5]) {
   await D('wm.adm.saga().api; window.__S = window.Arcade._dbg.snow().wm().adm.saga(); window.__S && 0;');
   await D('const st = window.Arcade._dbg.snow().wm().adm.saga(); return 1');
   await D(`window.Arcade.SAGA.story.adm.fight(${n})`); await skip(); await p.waitForTimeout(400);
   await D('const B = d.goal(); d.p.y -= 120;'); for (let i=0;i<30;i++){ await p.waitForTimeout(150); await skip(); if (await D('return !!d.bossNow()')) break; }
   const bn = await D('const B = d.bossNow(); return B ? B.k + " hp " + Math.round(B.hp) + " ph " + B.ph : "no boss"'); await p.waitForTimeout(2500);
   if (n == 3) await p.screenshot({path:__dirname+'/saga-dump3.png'});
   await D('const B = d.bossNow(); if (B) { B.allowHit = 1; d.hurtBoss(B.hp + 5); }'); await p.waitForTimeout(1500); await p.screenshot({path:__dirname+'/saga-leave'+n+'.png'}); await skip(); await p.waitForTimeout(300);
   console.log('fight', n, bn, '→ fights', JSON.stringify(ST_ = await D('return ST.fights')), 'ch', await D('return ST.ch + ":" + ST.step + " " + (d.goal()||{}).n'));
 }
 // fight 6
 await D('window.Arcade.SAGA.story.adm.fight(6)'); await skip(); for (let i=0;i<30;i++){ await p.waitForTimeout(150); await skip(); if (await D('return !!d.bossNow()')) break; }
 await p.waitForTimeout(3200); await p.screenshot({path:__dirname+'/saga-six1.png'});
 for (let ph = 2; ph <= 10; ph++) { await D('window.Arcade.SAGA.story.adm.phase()'); await p.waitForTimeout(1800); await skip(); const st = await D('const B = d.bossNow(); return B ? B.ph + " " + B.phn + " hp " + Math.round(B.hp) : "none"'); console.log('six →', st); if ([4,6,8,10].includes(ph)) await p.screenshot({path:__dirname+'/saga-six'+ph+'.png'}); }
 // checkpoint respawn
 await D('d.p.hp = 0; window.Arcade.immortal = false;'); 
 await D('const B = d.bossNow(); window.__cpBefore = B && B.ph;');
 console.log('cp6', await D('return ST.fights.cp6'));
 await D('window.Arcade.immortal = true; window.Arcade.SAGA.story.adm.phase()'); await p.waitForTimeout(1500); await skip(); await p.waitForTimeout(500); await skip();
 console.log('after final:', await D('return JSON.stringify({ch:ST.ch, post:ST.post, boss:!!d.bossNow()})'));
 await p.waitForTimeout(3000); await p.screenshot({path:__dirname+'/saga-credits.png'});
 console.log('errors', errs.slice(0,10)); await b.close(); })();
