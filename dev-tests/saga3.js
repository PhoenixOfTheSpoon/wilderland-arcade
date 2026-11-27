const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1])); p.on('console', m => { if ((m.type()=='error' && !/Failed to load/.test(m.text())) || /empty dialogue/.test(m.text())) errs.push('console: '+m.text().slice(0,400)); });
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, upg:{snowball:{mate:5}}})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); if (!wm) throw new Error("WORLD CLOSED"); const d = wm.dbg(); const SG = d.SG(); const ST = window.Arcade.SAGA.story; '+s+' })()').catch(e => { console.log('ERR', e.message.slice(0,200), JSON.stringify(errs.slice(0,6))); process.exit(1); });
 const skip = async () => { for (let i=0;i<60;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); await p.waitForTimeout(25); } };
 const goal = () => D('const G = d.goal(); return G ? G.n : "none"');
 const useNear = async (name) => { await D(`const G = d.goal(); d.p.x = G.x; d.p.y = G.y + 10;`); await p.waitForTimeout(150); const r = await D(`const G = d.goal(); const T = d.things().filter(t => Math.hypot(t.x - G.x, t.y - G.y) < 40).sort((a,b)=>Math.hypot(a.x-G.x,a.y-G.y)-Math.hypot(b.x-G.x,b.y-G.y)); const t = T.find(t => /⭐|Look|Pick|Bring|Stop/.test(t.n)) || T[0]; if (!t) return "no thing"; t.f(); return t.n;`); await skip(); return r; };
 await D('wm.adm.chapter(6)'); await skip(); await D('ST.adm.chapter(9); SG.SV.ch = 9; ST.adm.post();');
 for (let i = 0; i < 30; i++) { const g0 = await goal(); if (/Gecko God|GECKO GOD/.test(g0) || /Survive|Follow him|Travel to/.test(g0)) { console.log('stop at', g0); break; }
   if (/paw prints/.test(g0)) { await D('const G = d.goal(); d.p.x = G.x; d.p.y = G.y;'); await p.waitForTimeout(250); await skip(); console.log('trail', await goal()); continue; }
   const r = await useNear(); console.log(i, g0, '→', r); }
 await D('SG.enter("forbidden", 0)'); await p.waitForTimeout(300); await skip(); console.log('goal', await goal()); console.log('use', await useNear()); await skip(); console.log('after ritual', await goal());
 for (const n of [1,2,3]) { if (n > 1) { await D(`SG.enter(${JSON.stringify(['','forbidden','above','void'][n])}, 0)`); await skip(); }
   await D('const C = SG.C(), q = SG.W2T(C.lair); d.p.x = q.x; d.p.y = q.y + 300;'); for (let i=0;i<30;i++){ await p.waitForTimeout(150); await skip(); if (await D('return !!d.bossNow()')) break; }
   await p.waitForTimeout(2500); if (n == 2) await p.screenshot({path:__dirname+'/saga-god2.png'});
   console.log('god', n, await D('const B = d.bossNow(); return B ? B.k + " " + Math.round(B.hp) + " ph" + B.ph : "none"'));
   await D('const B = d.bossNow(); if (B) { B.allowHit = 1; d.hurtBoss(B.hp + 5); B.allowHit = 0; }'); await p.waitForTimeout(500); await skip(); console.log(' → ', await goal(), await D('return JSON.stringify({s:SG.SV.flags.sealBalls, c:SG.SV.flags.starCloak, f:SG.SV.flags.flight})')); }
 // Gecko God
 await D('const C = SG.C(), q = SG.W2T(C.lair); d.p.x = q.x; d.p.y = q.y + 320;'); for (let i=0;i<30;i++){ await p.waitForTimeout(150); await skip(); if (await D('return !!d.bossNow()')) break; }
 await p.waitForTimeout(3200); await p.screenshot({path:__dirname+'/saga-gg1.png'});
 for (let ph = 2; ph <= 10; ph++) { await D('ST.adm.phase()'); await p.waitForTimeout(1200); await skip(); await p.waitForTimeout(400); await skip(); console.log('gg', await D('const B = d.bossNow(); return B ? B.ph + " " + B.phn + " hp " + Math.round(B.hp) : "none"')); if ([2,4,6,10].includes(ph)) await p.screenshot({path:__dirname+'/saga-gg'+ph+'.png'}); }
 await D('ST.adm.phase()'); await p.waitForTimeout(800); await skip(); console.log('after gg:', await goal());
 await D('SG.leave()'); await skip(); console.log('home goal', await goal()); console.log('use', await useNear()); await skip(); await p.waitForTimeout(1500); await p.screenshot({path:__dirname+'/saga-end.png'});
 await p.keyboard.press('Escape'); await p.waitForTimeout(300);
 console.log('final', await D('return JSON.stringify({ps:SG.SV.ps, god:SG.SV.flags.godDown, home:SG.SV.flags.oswaldHome, out:d.W.outfits, titles:d.W.titles})'));
 console.log('errors', errs.slice(0,10)); await b.close(); })();
