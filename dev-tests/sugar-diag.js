const L = require('./lib.js');
(async()=>{ const {b,p,app} = await L.start({ctx:{viewport:{width:1366,height:768}}}); await p.evaluate(app + '.openSugar()'); await p.waitForTimeout(1200);
 const S = s => p.evaluate('(()=>{ const d = window.WLSugar._dbg(); ' + s + ' })()');
 console.log(await S(`for (let k = 1; k < 12; k++) d.SV.done[k] = {s:1}; d.startLevel(12, "normal"); d.R.coins += 6300; const R = d.R;
  d.L.spots.forEach((s, i) => { d.build(i, s.opts[0]); }); const types = R.spots.map(b => b && b.t).join(','); d.startWave(); const log = []; let sm = 0;
  for (let k = 0; k < 6000 && R.phase == 'wave' && d.scr() == 'play'; k++) { const bf = R.spots.map(b => b && b.rub); d.update(0.05); R.spots.forEach((b, i) => { if (b && b.rub && !bf[i]) { sm++; log.push(Math.round(k*.05) + 's ' + b.t); } }); if (k % 200 == 0) log.push(Math.round(k*.05) + 's keep ' + Math.round(R.keepHP) + ' en ' + d.enemies.length + ' troops ' + d.troops.filter(q=>!q.dead).length); }
  return [types, d.scr(), sm, log.join(' | ')];`));
 await b.close(); })();
