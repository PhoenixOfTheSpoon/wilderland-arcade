const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); window.Arcade.immortal = true; }); await p.waitForTimeout(800);
 const D = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); '+s+' })()');
 for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 await D('window.Arcade.SAGA.story.adm.region("frostfang")'); await p.waitForTimeout(500); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 // find cliff tiles with cliff all around (deep inside a cliff mass), and ones next to rocks
 const spots = await D('const C = SG.C(), out = []; for (let y = 3; y < SG.RH - 3; y++) for (let x = 3; x < SG.RW - 3; x++) { const v = C.M[y*SG.RW + x]; if (v != SG.T.CLIFF) continue; const nb = [[1,0],[-1,0],[0,1],[0,-1]].map(([a,b]) => C.M[(y+b)*SG.RW + x + a]); if (nb.includes(3) && out.length < 6) out.push([x, y, "rock"]); else if (nb.every(n => n == SG.T.CLIFF) && out.filter(o=>o[2]=="deep").length < 4) out.push([x, y, "deep"]); } return out;');
 for (const [x, y, kind] of spots) { await D(`const q = SG.W2T({x:${x}, y:${y}}); d.p.x = q.x; d.p.y = q.y; d.p.vx = d.p.vy = 0; SG.setStam(100);`); await p.waitForTimeout(100);
   const before = await D('return [Math.round(d.p.x), Math.round(d.p.y)]'); const moved = [];
   for (const k of ['w','a','s','d']) { await p.keyboard.down(k); await p.waitForTimeout(350); await p.keyboard.up(k); moved.push(await D('return Math.round(d.p.x)+","+Math.round(d.p.y)+" "+SG.mode()+" stam "+Math.round(SG.stam())')); }
   console.log(kind, x, y, before.join(','), '→', moved.join(' | ')); }
 console.log(errs); await b.close(); })();
