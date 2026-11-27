const L = require('./lib.js');
(async()=>{ const {b,p,errs,app} = await L.start({ctx:{viewport:{width:1366,height:768}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await p.evaluate(app + '.openSugar()'); await p.waitForTimeout(1200); await p.screenshot({path:'./ss-map.png'});
 const S = s => p.evaluate('(()=>{ const d = window.WLSugar._dbg(); ' + s + ' })()');
 const n = +(process.argv[2] || 6); await S(`for (let k = 1; k < ${n}; k++) d.SV.done[k] = {s:1, d:'normal'}; d.startLevel(${n}, "normal"); d.R.coins = 4000;`); await p.waitForTimeout(500);
 await S(`const R = d.R; d.L.spots.forEach((s, i) => { d.build(i, s.opts[0]); d.upgrade(i); d.upgrade(i); });`);
 await S('d.startWave()'); await p.waitForTimeout(6000); await p.screenshot({path:'./ss-play.png'});
 await S(`d.R.wave = d.wavesOf(d.R.n) - 1; d.R.phase = 'build'; d.enemies.length = 0; d.startWave(); for (let k = 0; k < 600; k++) d.update(0.05);`); await p.waitForTimeout(1500); await p.screenshot({path:'./ss-boss.png'});
 console.log(await S('return [d.scr(), d.boss && d.boss.n, d.enemies.length, Math.round(d.R.keepHP)]'));
 // reload mid-wave → same wave, buildings kept
 const before = await S('return [d.R.wave, d.R.spots.filter(Boolean).length]'); await p.reload(); await p.waitForTimeout(6000); await p.evaluate(app + '.openSugar()'); await p.waitForTimeout(1200);
 const sv = await S('return d.SV.run ? [d.SV.run.wave, d.SV.run.spots.filter(Boolean).length, d.SV.run.reload] : null'); ok('reload mid-wave keeps the run at the same wave with buildings', sv && sv[0] == before[0] && sv[1] == before[1], {before, sv});
 console.log(errs.filter(e=>!e.includes('Failed to load resource'))); await b.close(); })();
