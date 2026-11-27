const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
const run = async (fakeNow) => { const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript((fn)=>{ if (fn) { const N = Date.now, off = fn - N(); Date.now = () => N() + off; } if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x',1); localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); } localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); }, fakeNow || 0);
 const go = async () => { await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200); await p.evaluate(()=>window.Arcade._dbg.snow().openPanel('loadout')); await p.waitForTimeout(300); await p.evaluate(()=>document.querySelectorAll('.wlw-pop').forEach(e=>e.remove())); };
 const S = s => p.evaluate('(()=>{ const P = window.Arcade._dbg.snow().PERM; '+s+' })()');
 const red = async (code) => { await p.fill('input[placeholder="Have a reward code?"]', code); await p.getByText('Redeem', {exact:true}).click({force:true}); await p.waitForTimeout(600); return p.evaluate(()=>(document.body.innerText.match(/(🎉 \+[^\n]*|That code[^\n]*|You already[^\n]*)/)||[])[0]); };
 await go(); console.log(fakeNow ? 'IN 2027:' : 'NOW:', await red('OriginalGato'), await S('return JSON.stringify({frost:P.frost, bank:P.bank, cr:P.cr, og:P.og})'));
 if (!fakeNow) { await go(); console.log('after reload og=', await S('return P.og'), '| banner:', await p.evaluate(()=>(document.body.innerText.match(/⭐ OG player[^\n]*/)||[])[0]));
   await p.evaluate(()=>{ document.querySelectorAll('button').forEach(b=>{ if (/Done/.test(b.textContent)) b.click(); }); window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
   const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
   for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
   console.log('Kingdom give({frost:100}) adds:', await D('const P = window.Arcade._dbg.snow().PERM, f0 = P.frost; d.p3.give({frost:100}); return P.frost - f0'), '(×tm loot)', await D('return d.p3.X.curM()'));
   const t0 = await D('return SG.RS.tok'); await D('d.W.mau = 1; d.W.bau = 1; SG.raidAdm.enter(1, 0)'); await p.waitForTimeout(500); await D('SG.raidAdm.boss()'); await p.waitForTimeout(1500);
   for (let i=0;i<60;i++){ const st = await D('if (SG.vic()) return 1; SG.raidAdm.skip(); const B = d.bossNow ? d.bossNow() : null; if (B) { B.hp = Math.min(B.hp, 1); d.hurtBoss(5); } return 0'); if (st) break; await p.waitForTimeout(250); }
   console.log('raid loot:', await D('const V = SG.vic(); return V ? V.loot.slice(0,3).map(l => l.n).join(" | ") : "no vic"'), 'tokens gained', (await D('return SG.RS.tok')) - t0); }
 console.log('errors', errs.slice(0,4)); await b.close(); };
(async()=>{ await run(0); await run(new Date(2027,0,1,0,5).getTime()); })();
