// Burning Winter part 5: keeps & outposts
const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start({ctx:{viewport:{width:1366,height:768}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; });
 const skip = async () => { for (let i=0;i<30;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); } }; await skip();
 const tick = (n, dt = .05) => D(`for (let i = 0; i < ${n}; i++) d.update(${dt});`);
 const st = () => D('return SG.keepAdm("state")');
 let s = await st(); ok('8 keeps placed in the new regions', s.KS.length == 8, s.KS.map(k => [k.id, k.cx, k.cy]));
 const rc = await D('return SG.keepAdm("reach")'); ok('every chest and keep still reachable from Camp Cocoa', !rc.chests.length && !rc.keeps.length, rc);
 const K = s.KS[0]; const ID = K.id; await p.evaluate(id => { window.ID = id; }, K.id);
 await D('SG.keepAdm("tp", 1); d.foes().length = 0;'); await tick(4);
 ok('guards appear at the keep', (await D('return d.foes().length')) >= 4);
 const sh = await D('let m = 0; for (let i = 0; i < 60; i++) { d.update(.05); m = Math.max(m, d.p3.ballsArr().filter(q => !q.mine).length); } return m'); ok('towers shoot at you', sh > 0, sh);
 await p.waitForTimeout(200); await p.screenshot({path:__dirname + '/keep-assault.png'});
 // gate, towers, prisoners
 const gate = await D(`const k = SG.keepAdm("state").KS[0]; SG.ballWall({x:(k.cx + .5)*48, y:(k.cy + 6.5)*48, dmg:1e7, mine:1}); return [SG.keepAdm("state").K.k[ID].g, d.p3 ? 1 : 0]`); ok('snowballs break the gate', gate[0] == 1);
 const tw = await D(`const k = SG.keepAdm("state").KS[0]; [[-6,-6],[6,-6],[-6,6],[6,6]].forEach(q => SG.ballWall({x:(k.cx + q[0] + .5)*48, y:(k.cy + q[1] + .5)*48, dmg:1e7, mine:1})); return SG.keepAdm("state").K.k[ID].t`); ok('towers topple', tw.every(Boolean), tw);
 await D(`const k = SG.keepAdm("state").KS[0]; d.p.x = k.x; d.p.y = k.y; d.foes().length = 0;`);
 const pr = await D('const T = d.things().filter(t => /Free the prisoner/.test(t.n)); T.forEach(t => t.f()); return SG.keepAdm("state").K.k[ID].pr'); ok('prisoners freed', pr.every(Boolean), pr);
 s = await st(); ok('Keep Lord ready', s.KS[0].ready, s.KS[0]);
 await tick(3); const bo = await D('const B = d.bossNow(); return B ? {k:B.k, max:Math.round(B.max)} : null'); ok('Keep Lord fight starts', bo && bo.k == 'kl_' + ID, bo);
 const at = await D('let m = 0, h = 0; for (let i = 0; i < 200; i++) { d.update(.05); m = Math.max(m, d.p3.ballsArr().filter(q => !q.mine).length); h = Math.max(h, SG.keepAdm("state").hz); } return [m, h, !!d.bossNow()]'); ok('Lord attacks (volleys, slams, charges)', at[0] > 0, at);
 await p.waitForTimeout(200); await p.screenshot({path:__dirname + '/keep-lord.png'});
 await D('const B = d.bossNow(); B.hp = 1; d.hurtBoss(5);'); await tick(2); await skip();
 s = await st(); ok('captured → outpost', s.KS[0].held && (await D('return !!d.W.ways["kp_" + ID]')), s.KS[0]);
 // outpost upgrades + defences
 await D('window.Arcade._dbg.snow().PERM.frost = 99999;');
 const up = await D(`d.update(.05); const T = d.things().find(t => /Outpost upgrades/.test(t.n)); T.f(); const P = d.p3.panel(); return P ? P().rows.length : 0`); ok('upgrade panel opens', up >= 4, up);
 await D('d.W.kp.k[ID].up = {w:2, t:4, c:2, g:2}; d.p3.panelDown && 0;'); await p.keyboard.press('Escape');
 const df = await D(`const k = SG.keepAdm("state").KS[0]; d.foes().length = 0; d.p3.spawnFoe('goon', k.x + 150, k.y); const f = d.foes()[0]; f.stun = 99; const h0 = f.hp; for (let i = 0; i < 60; i++) d.update(.05); return [Math.round(h0), Math.round(Math.max(0, f.hp)), !!f.dead]`); ok('turrets / cannon / garrison hit enemies', df[2] || df[1] < df[0], df);
 await p.waitForTimeout(200); await p.screenshot({path:__dirname + '/keep-outpost.png'});
 const rest = await D('d.p.hp = 1; d.things().find(t => /Rest at the outpost/.test(t.n)).f(); return d.p.hp == d.p.max'); ok('rest spot heals', rest);
 // counterattack
 await D('SG.keepAdm("attack");'); s = await st(); ok('counterattack starts', !!s.atk, s.atk);
 const ca = await D('let mx = 0; for (let i = 0; i < 1700; i++) { d.update(.05); mx = Math.max(mx, d.foes().filter(f => f.kpa).length); if (!SG.keepAdm("state").atk) break; } return [mx, SG.keepAdm("state").atk, d.W.kp.won, d.W.kp.k[ID].dmg]'); ok('counterattack resolves (attackers came, outpost held or damaged)', ca[0] > 0 && !ca[1], ca);
 // scorched keeps after Lit Chapter 5
 await D('d.W.lit = Object.assign(d.W.lit || {}, {on:1, ch:6}); d.p.x = 50*48; d.p.y = 88*48; d.foes().length = 0;'); await tick(2);
 await D('SG.keepAdm("tp", 1);'); await tick(2);
 s = await st(); ok('Thornwood seized by the Kindled (Scorched Keep)', s.KS[0].scor && !s.KS[0].held && s.KS[0].lord == 'ks_' + ID && !(await D('return !!d.W.ways["kp_" + ID]')), s.KS[0]);
 ok('upgrades kept while seized', (await D('return d.W.kp.k[ID].up.t')) == 4);
 ok('Kindled guards at a scorched keep', (await D('return d.foes().some(f => f.k.slice(0, 2) == "k_")')));
 await p.waitForTimeout(200); await p.screenshot({path:__dirname + '/keep-scorched.png'});
 await D('SG.keepAdm("ready", 1); const k = SG.keepAdm("state").KS[0]; d.p.x = k.x; d.p.y = k.y; d.foes().length = 0;'); await tick(3);
 const sb = await D('const B = d.bossNow(); return B ? {k:B.k, max:Math.round(B.max)} : null'); ok('Kindled Lord fight (endgame HP)', sb && sb.k == 'ks_' + ID && sb.max >= 30000, sb);
 await D('const B = d.bossNow(); B.hp = 1; d.hurtBoss(5);'); await tick(2); await skip();
 s = await st(); ok('retaken → outpost again', s.KS[0].held && !s.KS[0].scor, s.KS[0]);
 // reload keeps everything
 await D('d.p3.save();'); await p.keyboard.press('Escape'); await p.waitForTimeout(600); await p.reload(); await p.waitForTimeout(5000); await world(); await skip(); await p.evaluate(id => { window.ID = id; }, ID);
 s = await st(); ok('progress survives a reload', s.KS[0].held && (await D('return d.W.kp.k[ID].up.t')) == 4 && (await D('return !!d.W.ways["kp_" + ID]')), s.KS[0]);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
