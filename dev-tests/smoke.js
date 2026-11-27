// Open, play briefly and close every game: console errors, save registration, floor usable.
const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
(async()=>{ const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:+(process.argv[2]||1366),height:+(process.argv[3]||800)}}); await ctx.route(/gstatic\.com|googleapis\.com/, r=>r.abort());
 const p = await ctx.newPage(); const errs=[]; let cur = 'load'; p.on('pageerror',e=>errs.push(cur+': '+e.message)); p.on('console', m => { if (m.type()=='error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push(cur+' console: '+m.text().slice(0,200)); });
 const bad404 = []; p.on('response', r => { if (r.status() >= 400 && !/gstatic|googleapis/.test(r.url())) bad404.push(r.status()+' '+r.url().replace(/^.*\//,'')); });
 await p.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e9, earned:1e12, founderChk:1, savedAt:Date.now()})); localStorage.setItem('wl-wn','2099'); localStorage.setItem('wl-road-welcomed','1'); });
 await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(6000);
 const ids = await p.evaluate(()=>Object.keys(window.Arcade.games)); console.log(ids.length, 'games');
 const res = [];
 for (const id of ids) { cur = id; const n0 = errs.length;
   await p.evaluate(app+'.open('+JSON.stringify(id)+')'); await p.waitForTimeout(900);
   for (const k of [' ', 'ArrowRight', 'ArrowUp', 'Enter', 'ArrowLeft']) { await p.keyboard.press(k).catch(()=>{}); await p.waitForTimeout(120); }
   await p.mouse.click(683, 450).catch(()=>{}); await p.waitForTimeout(700);
   const mounted = await p.evaluate(app+'.mounted'); await p.evaluate(app+'.closeAll()'); await p.waitForTimeout(300);
   res.push(id + (mounted == id ? '' : ' (NOT MOUNTED)') + (errs.length > n0 ? ' ✖' : ' ✓')); }
 console.log(res.join('  ')); console.log('ERRORS:\n' + errs.slice(0, 30).join('\n')); console.log('HTTP errors:', [...new Set(bad404)].join(', ')); await b.close(); })();
