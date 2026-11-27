const L = require('./lib.js');
(async()=>{ const {b,p,errs} = await L.start({ctx:{viewport:{width:1300, height:700}}}); await p.waitForTimeout(800);
 await p.evaluate(()=>{ document.querySelectorAll('body *').forEach(e => { const z = +getComputedStyle(e).zIndex; if (getComputedStyle(e).position == 'fixed' && z > 50) e.remove(); }); });
 const imgs = await p.evaluate(()=>[...document.querySelectorAll('.wl-dev img')].map(i => i.src));
 const p2 = await b.newPage({viewport:{width:1300,height:470}}); await p2.setContent('<body style="margin:0;background:#0b2e24;display:flex;flex-wrap:wrap;gap:16px;padding:16px">' + imgs.map(s => '<div><img src="' + s + '" style="width:300px;height:200px;border-radius:10px"><img src="' + s + '" style="width:90px;height:90px;margin-left:8px;border-radius:8px"></div>').join('') + '</body>');
 await p2.waitForTimeout(1200); await p2.screenshot({path:__dirname + '/devart.png'}); console.log(imgs.length, errs.filter(e => !e.includes('Failed to load'))); await b.close(); })();
