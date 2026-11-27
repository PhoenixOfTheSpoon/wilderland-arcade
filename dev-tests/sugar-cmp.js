const L = require('./lib.js');
(async()=>{ const {b,p,app} = await L.start({ctx:{viewport:{width:1366,height:768}}});
 await p.evaluate(app + '.openSugar()'); await p.waitForTimeout(1200);
 const S = s => p.evaluate('(()=>{ const d = window.WLSugar._dbg(); ' + s + ' })()');
 for (const [n, diff] of (process.argv[2] ? JSON.parse(process.argv[2]) : [[4,'easy'],[6,'normal'],[9,'normal'],[9,'hard']])) {
  const out = []; for (let rep = 0; rep < 4; rep++) out.push(await S(`d.SV.done = {}; for (let k = 1; k < ${n}; k++) d.SV.done[k] = {s:1}; d.startLevel(${n}, "${diff}"); window.heroGodOff = 1;
   const R = d.R; let smashed = 0, waves = 0, hdown = 0; const spend = () => { d.L.spots.forEach((s, i) => { if (!R.spots[i]) { const c = s.opts[0]; d.build(i, c); } else if (!R.spots[i].rub && R.spots[i].lv < 2) d.upgrade(i); }); };
   const W = d.wavesOf(${n}); for (let w = 0; w < W && d.scr() == 'play'; w++) { spend(); d.startWave(); let st = 0; while (d.R.phase == 'wave' && d.scr() == 'play' && st++ < 12000) { const before = R.spots.map(b => b && b.rub); const hd = d.hero.dead; d.update(0.05); R.spots.forEach((b, i) => { if (b && b.rub && !before[i]) smashed++; }); if (!hd && d.hero.dead) hdown++; } waves++; }
   return {res:d.scr(), waves, keep:Math.round(R.keepHP) + '/' + d.keepMax(), smashed, heroDowns:hdown};`));
  console.log('level', n, diff, JSON.stringify(out)); }
 await b.close(); })();
