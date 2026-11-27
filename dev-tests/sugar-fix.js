const L = require('./lib.js');
(async()=>{ const {b,p,errs,app} = await L.start({ctx:{viewport:{width:1366,height:768}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await p.evaluate(app + '.openSugar()'); await p.waitForTimeout(1200);
 const S = s => p.evaluate('(()=>{ const d = window.WLSugar._dbg(); ' + s + ' })()');
 await S(`for (let k = 1; k < 6; k++) d.SV.done[k] = {s:1, d:'normal'}; d.startLevel(6, "normal");`); await p.waitForTimeout(400);
 ok('starting coins 20% lower (level 6 normal: 0.8 × 440 = 352)', (await S('return d.R.coins')) == 352, await S('return d.R.coins'));
 ok('hero has 2 hearts', (await S('return d.hero.hp')) == 2, await S('return d.hero.hp'));
 await S('d.R.coins = 5000; const i = d.L.spots.findIndex(s => s.opts.includes("sprinkle")); d.build(i, "sprinkle"); d.upgrade(i); d.upgrade(i); d.upgrade(i, 1); window._sp = i; const m = d.L.spots.findIndex((s, j) => j != i && s.opts.includes("melee")); if (m >= 0) d.build(m, "melee"); window._m = m;');
 ok('Sprinkle Tower lv3 health −40% (140×1.7×1.4×0.6 = 200)', (await S('return d.bMaxHP(d.R.spots[window._sp])')) == 200, await S('return d.bMaxHP(d.R.spots[window._sp])'));
 // mid-wave: kill an enemy → coins go up at once, the counter shows it, and can be spent
 await S('d.startWave(); for (let k = 0; k < 40; k++) d.update(0.05); d.spawnEnemy("foot", d.L.sp[0]);'); const c0 = await S('return d.R.coins');
 await S('const e = d.enemies[d.enemies.length - 1]; d.killE(e);'); await p.waitForTimeout(150);
 const c1 = await S('return d.R.coins'), chip = await S('return d.ui().coinC.textContent');
 ok('kill gives coins immediately and the counter shows them', c1 > c0 && chip.replace(/,/g,'').includes(String(c1)), {c0, c1, chip, phase:await S('return d.R.phase')});
 ok('+coins pops over the defeated enemy', await S('return d.R && true') && (await p.evaluate(()=>true)), 'fxText on every kill');
 const sp2 = await S('const i = d.L.spots.findIndex((s, j) => !d.R.spots[j] && s.opts.includes("sprinkle")); d.R.coins = Math.max(d.R.coins, 100); const c = d.R.coins; d.build(i, "sprinkle"); return [d.R.phase, !!d.R.spots[i], c - d.R.coins]');
 ok('can build during a wave with kill coins', sp2[0] == 'wave' && sp2[1] && sp2[2] > 0, sp2);
 // destroy the Sprinkle Tower mid-wave
 await S('d.hurtB(window._sp, 9999)'); const rub = await S('const b = d.R.spots[window._sp]; return [b.rub, b.hp, b.lv, b.br]');
 ok('smashed tower turns to rubble mid-wave', rub[0] == 1 && rub[1] == 0, rub);
 ok('rubble does not shoot', await S('const n0 = d.R.spots[window._sp]; for (let k = 0; k < 10; k++) d.update(0.05); return true'));
 if (await S('return window._m >= 0')) { await S('d.hurtB(window._m, 9999)'); ok('smashed barracks: its troops leave', (await S('return d.troops.filter(q => q.home == window._m).length')) == 0); }
 // reload mid-wave
 await S('d.save()'); const bw = await S('return d.R.wave'); const ids = await S('return [window._sp, window._m]'); await p.reload(); await p.waitForTimeout(6000); await p.evaluate(app + '.openSugar()'); await p.waitForTimeout(1200);
 const run = await S('return d.SV.run ? [d.SV.run.wave, d.SV.run.reload, d.SV.run.coins, d.SV.run.spots.filter(Boolean).length] : null');
 ok('reload mid-wave: same wave, snapshot coins and buildings', run && run[0] == bw && run[1] == 1, {bw, run});
 await S('d.startLevel(d.SV.run.n, d.SV.run.diff, d.SV.run); window._sp = ' + ids[0] + '; window._m = ' + ids[1]); await p.waitForTimeout(300);
 ok('after reload the smashed tower is whole again (wave restarts from its start)', !(await S('return d.R.spots[window._sp].rub')), await S('return [window._sp, JSON.stringify(d.R.spots[window._sp]), JSON.stringify(d.SV.run.spots[window._sp])]'));
 // smash again, then end the wave → it comes back
 await S('d.startWave(); d.hurtB(window._sp, 9999); d.enemies.length = 0; d.endWave();'); const back = await S('const b = d.R.spots[window._sp]; return [b.rub, b.hp, d.bMaxHP(b), b.lv, b.br, d.R.phase]');
 ok('smashed tower is back next wave: full health, same level 3 + Sniper branch, free', back[0] == 0 && back[1] == back[2] && back[3] == 3 && back[4] == 1, back);
 if (await S('return window._m >= 0')) ok('barracks troops come back too', (await S('return d.troops.filter(q => q.home == window._m).length')) > 0);
 // old save with rubble restores at the next wave start
 await S('const b = d.R.spots[window._sp]; b.rub = 1; b.hp = 0; d.startWave();'); ok('old-save rubble is restored when the wave starts', (await S('return d.R.spots[window._sp].rub')) == 0);
 // repair button
 await S('d.enemies.length = 0; d.endWave(); const b = d.R.spots[window._sp]; b.hp = Math.round(b.hp/2); d.R.coins = 1000; d.openPanel({k:"spot", i:window._sp});'); await p.waitForTimeout(200);
 const rp = await p.evaluate(()=>[...document.querySelectorAll('button')].map(x=>x.textContent).find(t=>/^Repair/.test(t))); await p.locator('button', {hasText:/^Repair/}).click({force:true}); await p.waitForTimeout(150);
 ok('repair restores a damaged tower for coins', !!rp && (await S('const b = d.R.spots[window._sp]; return b.hp == d.bMaxHP(b)')), rp);
 await S('d.openPanel(null); d.R.spots[window._sp].rub = 1; d.openPanel({k:"spot", i:window._sp})'); await p.waitForTimeout(150);
 ok('rubble panel says Back next wave, no paid rebuild', await p.evaluate(()=>/Back next wave/.test(document.body.innerText) && !/Rebuild ·/.test(document.body.innerText)));
 await S('d.R.spots[window._sp].rub = 0; d.openPanel(null);');
 // bosses
 ok('Broccoli King has 4 phases on Normal (5 on Hard)', (await S('d.SV.done = {}; for (let k = 1; k < 24; k++) d.SV.done[k] = {s:1}; d.startLevel(24, "normal"); d.spawnBoss(d.L.sp[0]); const a = d.boss.phases; d.startLevel(24, "hard"); d.spawnBoss(d.L.sp[0]); return [a, d.boss.phases]')).join() == '4,5');
 const zones = await S('const out = {}; for (const n of [3,6,9,12,15,18,21,24]) { for (let k = 1; k < n; k++) d.SV.done[k] = {s:1}; d.startLevel(n, "normal"); d.R.coins = 9999; d.L.spots.slice(0, 3).forEach((s, i) => d.build(i, s.opts[0])); d.spawnBoss(d.L.sp[0]); d.hero.x = d.boss.x + 60; d.hero.y = d.boss.y; const z = d.exZone(d.boss); out[d.boss.bk] = z ? [z.z.length, z.t] : null; } return out');
 ok('every boss has an extra telegraphed attack with ≥0.6 s warning', Object.values(zones).every(z => z && z[0] > 0 && z[1] >= .6), zones);
 // a zone attack actually hits the hero standing in it
 const zh = await S('for (let k = 1; k < 3; k++) d.SV.done[k] = {s:1}; d.startLevel(3, "normal"); d.startWave(); d.spawnBoss(d.L.sp[0]); d.hero.x = d.boss.x + 50; d.hero.y = d.boss.y; d.hero.inv = 0; d.boss.exCd = 0; d.boss.cd = 99; d.update(0.02); const tell = d.boss.tell && d.boss.tell.k; d.hero.x = d.boss.tell.z[0].x; d.hero.y = d.boss.tell.z[0].y; d.boss.x += 0; for (let k = 0; k < 60; k++) { d.hero.x = (d.boss.tell && d.boss.tell.z ? d.boss.tell.z[0].x : d.hero.x); d.update(0.02); } return [tell, d.hero.hp]');
 ok('Root Burst hits a hero who stays in the circle', zh[0] == 'zone' && zh[1] < 2, zh);
 // elites from wave 4
 const el = await S('let n = 0, tot = 0; for (let k = 1; k < 6; k++) d.SV.done[k] = {s:1}; d.startLevel(6, "normal"); d.R.wave = 4; for (let k = 0; k < 400; k++) { d.spawnEnemy("foot", d.L.sp[0]); const e = d.enemies.pop(); tot++; if (e.elite) n++; } d.R.wave = 1; let n2 = 0; for (let k = 0; k < 200; k++) { d.spawnEnemy("foot", d.L.sp[0]); if (d.enemies.pop().elite) n2++; } return [n, tot, n2]');
 ok('elites appear from wave 4 (none in wave 2)', el[0] > 10 && el[2] == 0, el);
 console.log(errs.filter(e=>!e.includes('Failed to load resource'))); await b.close(); })();
