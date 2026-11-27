const L = require('./lib.js');
(async()=>{ const {b,p,errs,app} = await L.start({ctx:{viewport:{width:1366,height:768}}}); await p.evaluate(app + '.openSugar()'); await p.waitForTimeout(1200);
 const S = s => p.evaluate('(()=>{ const d = window.WLSugar._dbg(); ' + s + ' })()');
 for (const [n, diff] of [[3, 'normal'], [12, 'normal'], [24, 'hard']]) {
  await S(`for (let k = 1; k < ${n}; k++) d.SV.done[k] = {s:1, d:'normal'}; d.startLevel(${n}, "${diff}"); d.R.coins += 1500 + ${n}*400;`);
  let guard = 0, log = [], bossSeen = '';
  while (guard++ < 120) { const st = await S('return [d.scr(), d.R && d.R.phase, d.R && d.R.wave, d.R && Math.round(d.R.keepHP), d.boss && d.boss.n, d.R && d.R.coins]'); if (st[4]) bossSeen = st[4];
    if (st[0] != 'play') { log.push('END ' + st[0]); break; }
    if (st[1] == 'build') { log.push(st[2] + ':' + st[3]); await S(`const R = d.R; if (R.keepLv < 5 && R.coins > [0,0,450,1000,2000,3800][R.keepLv + 1] + 400) { R.coins -= [0,0,450,1000,2000,3800][R.keepLv + 1]; R.keepLv++; R.specs[R.keepLv] = ['sour','arsenal','frosted','rush'][R.keepLv - 2]; } d.L.spots.forEach((s, i) => { const b = R.spots[i]; if (!b) d.build(i, s.opts[0]); else if (b.lv < 3) d.upgrade(i); else if (b.br == null) d.upgrade(i, 0); }); d.startWave();`); }
    if (guard == 40) await p.screenshot({path:'./ss-L' + n + '.png'});
    await S('for (let k = 0; k < 400; k++) { if (d.scr() != "play") break; d.update(0.05); }'); }
  console.log('level', n, diff, 'boss:', bossSeen, '·', log.join(' ')); }
 console.log(errs.filter(e=>!e.includes('Failed to load resource'))); await b.close(); })();
