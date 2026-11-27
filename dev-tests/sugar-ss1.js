const L = require('./lib.js');
(async()=>{ const {b,p,errs,app} = await L.start({ctx:{viewport:{width:1366,height:768}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 const tix0 = await p.evaluate(app + '.P.tickets');
 await p.evaluate(app + '.openSugar()'); await p.waitForTimeout(1500);
 ok('Sugar Siege opens from the menu (lazy-loaded)', await p.evaluate(()=>!!document.querySelector('.ss-root')));
 await p.screenshot({path:'./ss-map.png'});
 const S = s => p.evaluate('(()=>{ const d = window.WLSugar._dbg(); ' + s + ' })()');
 console.log('score cap', await S('return [d.SCORE_MAX, d.wavesOf(1), d.wavesOf(24)]'));
 // every level generates, every Broccoli Field can reach the keep
 const gen = await S(`const out = []; for (let n = 1; n <= 24; n++) { const L = d.genLevel(n), F = d.field(L, false); const bad = L.sp.filter(s => F[s.y*36 + s.x] >= 1e8).length; out.push(n + ':' + L.spots.length + 's/' + L.sp.length + 'f' + (bad ? '/BAD' + bad : '')); } return out.join(' ')`); console.log(gen); ok('all 24 levels reachable', !gen.includes('BAD'));
 await S('d.startLevel(1, "normal")'); await p.waitForTimeout(600);
 // build every spot it can afford
 await S(`const R = d.R; d.L.spots.forEach((s, i) => { if (R.coins >= 120) d.build(i, s.opts[0]); });`);
 await p.waitForTimeout(400); await p.screenshot({path:'./ss-build.png'});
 // play waves: the bot keeps the hero near the keep and upgrades between waves
 let guard = 0, waves = [];
 while (guard++ < 400) { const st = await S('return [d.scr(), d.R && d.R.phase, d.R && d.R.wave, d.R && Math.round(d.R.keepHP), d.enemies.length, d.R && d.R.coins]');
   if (st[0] != 'play') { waves.push('END ' + st[0]); break; }
   if (st[1] == 'build') { waves.push(st[2] + ':keep' + st[3] + ':coins' + st[5]); await S(`const R = d.R; d.L.spots.forEach((s, i) => { const b = R.spots[i]; if (!b) { if (R.coins >= 150) d.build(i, s.opts[0]); } else if (b.lv < 3 && R.coins >= 200) d.upgrade(i); });`); await S('d.startWave()'); }
   if (guard == 3) { await p.waitForTimeout(2500); await p.screenshot({path:'./ss-wave.png'}); }
   await S('for (let k = 0; k < 200; k++) { if (d.scr() != "play") break; d.update(0.05); }'); }
 console.log(waves.join(' | '));
 const res = await S('return [d.scr(), d.SV.done[1], d.total()]'); ok('level 1 beaten by a simple bot', res[0] == 'won', res);
 await p.screenshot({path:'./ss-won.png'});
 const tix1 = await p.evaluate(app + '.P.tickets'); ok('no tickets earned', tix1 == tix0, [tix0, tix1]);
 console.log(errs.filter(e=>!e.includes('Failed to load resource'))); await b.close(); })();
