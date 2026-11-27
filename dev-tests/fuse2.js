const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1440,height:900}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{ if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x',1); localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); } localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1500);
 const S = s => p.evaluate('(()=>{ const sn = window.Arcade._dbg.snow(); const P = sn.PERM; '+s+' })()');
 // 1) single fuse: 3 Snow mittens, one equipped +5 -> Celestial, refund of + levels
 await S('P.gear = []; P.eq = {}; P.bank = 0; P.frost = 0; for (let i=0;i<3;i++){ const it = sn.makeGear(0, "gloves"); it.rar = 6; it.lv = i==0?5:2; } P.eq.gloves = P.gear[0].id; sn.openPanel("loadout"); return 1');
 await p.waitForTimeout(300); await p.getByText(/^Fuse 3 Snow/).click(); await p.waitForTimeout(300);
 console.log('single:', await p.evaluate(()=>(document.body.innerText.match(/✨ Fused[^\n]*/)||[])[0]));
 console.log('  bank/frost', await S('return P.bank+"/"+P.frost+" eq="+sn.PERM.gear.find(x=>x.id==P.eq.gloves).rar'), 'expected', 40*7*(15+3+3)+'/'+7*(15+3+3));
 // 2) Fuse ALL: 81 Mythic boots -> 27 Snow -> 9 Celestial -> 3 Phoenix -> 1 Phoenix +1
 await S('P.gear = P.gear.filter(x=>x.slot!="boots"); P.gear = P.gear.filter(x=>x.slot=="gloves"); for (let i=0;i<81;i++){ P.gear.push({id:P.gid++, slot:"boots", rar:5, lv:1, name:"M"+i}); } sn.openPanel("loadout"); return P.gear.length');
 await p.waitForTimeout(300); await p.getByText(/Fuse ALL the way up/).click(); await p.waitForTimeout(300);
 console.log('all:', await p.evaluate(()=>(document.body.innerText.match(/⚡ \d+ fusion[^\n]*/)||[])[0]));
 console.log('  boots', await S('return P.gear.filter(x=>x.slot=="boots").map(x=>x.rar+":"+x.name).join(",")'));
 // 3) beyond: 3 x Phoenix+1 -> Phoenix +2 label
 await S('for (let i=0;i<2;i++){ P.gear.push({id:P.gid++, slot:"boots", rar:9, lv:0, name:"P"+i}); } sn.openPanel("loadout"); return 1'); await p.waitForTimeout(300);
 console.log('btn:', await p.evaluate(()=>(document.body.innerText.match(/Fuse 3 Phoenix[^\n]*/)||[])[0]));
 await p.getByText(/^Fuse 3 Phoenix/).click(); await p.waitForTimeout(300);
 console.log('rows:', await p.evaluate(()=>(document.body.innerText.match(/Phoenix \+2 ·[^\n]*/)||[])[0]));
 await p.screenshot({path:'/tmp/fuse2.png'});
 await p.reload(); await p.waitForTimeout(5000); await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1500);
 console.log('after reload', await S('return P.gear.filter(x=>x.slot=="boots").map(x=>x.rar).join(",")+" gs="+(window.Arcade._dbg.snow().PERM.gear.length)'));
 console.log('errors', errs); await b.close(); })();
