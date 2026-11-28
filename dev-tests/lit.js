// Burning Winter part 4: Lit story chapters 1–5
const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start({ctx:{viewport:{width:1366,height:768}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; });
 const skip = async () => { for (let i=0;i<30;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); } };
 const st = () => D('const s = SG.litAdm("state"); return {on:s.L.on, ch:s.L.ch, st:s.L.st, k:s.step && s.step.k, heat:s.L.heat}');
 const tick = (n, dt = .05) => D(`for (let i = 0; i < ${n}; i++) d.update(${dt});`);
 const tp = k => D(`const P = SG.litAdm("state").SP["${k}"]; d.p.x = P.x; d.p.y = P.y + 10; d.foes().length = 0;`);
 await skip();
 // locked before the Gecko God
 await D('d.W.saga.flags.godDown = 0; d.W.saga.flags.oswaldHome = 0;'); await tick(80);
 let s = await st(); ok('locked before the Gecko God', !s.on, s);
 await D('const P = SG.litAdm("state"); d.p.x = 190*48; d.p.y = 205*48;'); await p.waitForTimeout(400); await p.screenshot({path:__dirname + '/lit-tease.png'});
 // unlocks after Gecko God + Oswald home (old saves too)
 await D('d.W.saga.flags.godDown = 1; d.W.saga.flags.oswaldHome = 1; d.p.x = 50*48; d.p.y = 88*48;'); await tick(70);
 s = await st(); ok('unlocks after the Gecko God (Ch.1)', s.on && s.ch == 1 && s.st == 0, s);
 // Ch.1
 await tp('camp'); const th = await D('const T = d.things().find(t => /Gecko God Slayer party/.test(t.n)); if (T) T.f(); return !!T'); await skip();
 s = await st(); ok('Ch1 party talk → Snow Pump', th && s.st == 1 && (await D('return d.W.fx.pump')) == 1, s);
 await tp('bath'); await tick(2); await skip(); s = await st(); ok('arrive at the bathhouse', s.k == 'fires', s);
 const nf = await D('for (let i = 0; i < 3; i++) d.update(.05); return SG.litAdm("state").fs ? SG.litAdm("state").fs.list.length : 0'); ok('bathhouse fires start', nf >= 6, nf);
 await D('SG.litAdm("state").fs.list.forEach(f => { f.out = 1; });'); await tick(3); s = await st(); ok('fires out → next step', s.k == 'talk', s);
 await D('const T = d.things().find(t => /Mau Mau at the bathhouse/.test(t.n)); T.f();'); await skip(); s = await st(); ok('Ch1 done → Ch2, World Heat 1', s.ch == 2 && s.st == 0 && s.heat == 1, s);
 // Ch.2
 await tp('square'); await tick(2); await skip(); s = await st(); ok('Emberford → Cold Lantern', s.k == 'kill' && (await D('return d.W.fx.lantern')) == 1, s);
 const nk = await D('d.update(.05); return d.foes().filter(f => f.litq).length'); ok('Kindled appear in the square', nk >= 6, nk);
 await D('d.foes().filter(f => f.litq).forEach(f => d.p3.hurtFoeT(f, 1e6, {}));'); await tick(10); s = await st(); ok('Kindled beaten → fires step', s.k == 'fires', s);
 await tick(3); await D('const q = SG.litAdm("state").fs; q && q.list.forEach(f => { f.out = 1; });'); await tick(3); s = await st(); ok('square fires out → Lit appears', s.k == 'go', s);
 await tp('lit1'); await tick(2); await D('d.nextLine(); d.nextLine();'); await p.waitForTimeout(300); await p.screenshot({path:__dirname + '/lit-talk.png'}); await skip(); s = await st(); ok('meet Lit → boss step', s.k == 'boss', s);
 await tick(3); const bo = await D('const B = d.bossNow(); return B ? {k:B.k, max:Math.round(B.max), n:B.n} : null'); ok('Lit fight starts (HP ≥ Gecko God base)', bo && bo.k == 'lit1' && bo.max >= 75000, bo);
 const hz = await D('let m = 0, b2 = 0; for (let i = 0; i < 160; i++) { d.update(.05); m = Math.max(m, SG.litAdm("state").hz.length); b2 = Math.max(b2, d.p3.ballsArr().filter(q => !q.mine).length); } return [m, b2]'); ok('Lit attacks (telegraphs + bolts)', hz[0] > 0 && hz[1] > 0, hz);
 await p.waitForTimeout(200); await p.screenshot({path:__dirname + '/lit-fight.png'});
 await D('const B = d.bossNow(); B.hp = B.max*.3;'); await tick(2); ok('Lit escapes at 35%', !(await D('return !!d.bossNow()')));
 await skip(); s = await st(); ok('Ch2 done → Ch3, Ember Springs scorched', s.ch == 3 && (await D('return SG.litAdm("state").L.sc.ember')) == 1, s);
 // Ch.3
 await tp('camp'); await D('d.things().find(t => /Report to Bau Bau/.test(t.n)).f();'); await skip(); ok('Frostforged unlocked', (await D('return d.W.fx.frost')) == 1);
 for (const k of ['tower', 'shaft', 'light']) { await tp(k); await D('const T = d.things().find(t => /clues/.test(t.n)); T && T.f();'); await skip(); }
 s = await st(); ok('3 clues → next step', s.k == 'talk' && s.st == 2, s);
 await tp('camp'); await D('d.things().find(t => /Tell Bau Bau/.test(t.n)).f();'); await skip(); s = await st(); ok('Ch3 done → Ch4, sightings on', s.ch == 4 && (await D('return SG.litAdm("state").L.sight')) == 1, s);
 await D('d.p.x = 180*48; d.p.y = 230*48; SG.litAdm("sight");'); await tick(2); const sg = await D('return SG.litAdm("state").sgt'); ok('a sighting appears', !!sg, sg && Math.round(sg.t));
 await D('const q = SG.litAdm("state").sgt; d.p.x = q.x; d.p.y = q.y;'); await tick(2); await skip(); ok('reach it → glimpse + clue', (await D('return SG.litAdm("state").L.seen')) == 1);
 // Ch.4 / Ch.5 quickly (admin steps), check tools + bosses
 for (let i = 0; i < 4; i++) { await D('SG.litAdm("next");'); await skip(); }
 s = await st(); ok('Ch4 to Lit in Pinecrest', s.k == 'boss' && (await D('return d.W.fx.bomb')) == 1, s);
 await tp('lit2'); await tick(3); ok('Lit 2 fight (fire walls)', (await D('const B = d.bossNow(); return B && B.k')) == 'lit2'); await tick(220);
 const wall = await D('return SG.litAdm("state").hz.some(h => !h.c) || d.W.litWins'); ok('fire wall seen', !!wall);
 await D('SG.litAdm("next");'); await tick(2); await skip(); s = await st(); ok('Ch4 done → Ch5', s.ch == 5, s);
 for (let i = 0; i < 5; i++) { await D('SG.litAdm("next");'); await skip(); }
 s = await st(); ok('Ch5: Frozen Heart, Lit 3 waits', s.k == 'boss' && (await D('return d.W.fx.heart')) == 1, s);
 await tp('lit3'); await tick(3); ok('Lit 3 fight', (await D('const B = d.bossNow(); return B && B.k')) == 'lit3');
 await D('const B = d.bossNow(); B.hp = 1;'); await tick(2); await skip(); s = await st();
 ok('Ch5 done → keeps teaser, three regions scorched', s.ch == 6 && !s.k, [s, await D('return SG.litAdm("state").L.sc')]);
 // scorched lands: Kindled spawn and healing
 await D('d.p.x = 185*48; d.p.y = 195*48; d.foes().length = 0;'); await tick(300);
 const kn = await D('return d.foes().filter(f => f.k.slice(0, 2) == "k_").length'); ok('Kindled roam scorched Ember Springs', kn > 0, kn);
 const rs = await D('const r0 = SG.litAdm("state").L.rs.ember | 0; d.foes().filter(f => f.k.slice(0, 2) == "k_").forEach(f => d.p3.hurtFoeT(f, 1e6, {})); for (let i = 0; i < 5; i++) d.update(.05); return [r0, SG.litAdm("state").L.rs.ember]'); ok('beating Kindled heals the land', rs[1] > rs[0], rs);
 await D('SG.litAdm("state").L.rs.ember = 29; d.p3.spawnFoe("k_imp", d.p.x + 100, d.p.y); d.update(.05); const f = d.foes().find(q => q.k == "k_imp"); d.p3.hurtFoeT(f, 1e6, {}); for (let i = 0; i < 5; i++) d.update(.05);');
 ok('Ember Springs healed at 30', (await D('return SG.litAdm("state").L.rd.ember')) == 1);
 await p.waitForTimeout(200); await p.screenshot({path:__dirname + '/lit-scorch.png'});
 // reload keeps progress
 await D('d.p3.save();'); await p.keyboard.press('Escape'); await p.waitForTimeout(600); await p.reload(); await p.waitForTimeout(5000); await world(); await skip();
 s = await st(); ok('progress survives a reload', s.on && s.ch == 6, s);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
