// Every boss phase plays differently: stagger methods, variety bonus, phase changes
const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start({ctx:{viewport:{width:1366,height:768}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; });
 const skip = async () => { for (let i=0;i<30;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); } }; await skip();
 const tick = (n, dt = .05) => D(`for (let i = 0; i < ${n}; i++) d.update(${dt});`);
 const fight = async k => { await D(`d.foes().length = 0; d.p3.ballsArr().length = 0; d.spawnBoss('${k}'); const B = d.bossNow(); d.p.x = B.x; d.p.y = B.y + 220; B.stunT = 0; B.stg = 0; B.max = B.hp = 1e6;`); await tick(2); };
 const hit = (src, dmg = 10) => D(`const B = d.bossNow(); const h0 = B.hp, s0 = B.stg || 0, st0 = B.stuns | 0; d.hurtBoss(${dmg}, Object.assign({mine:1, x:B.x, y:B.y}, ${JSON.stringify(src)})); return {dmg:Math.round((h0 - B.hp)*100)/100, stg:Math.round(((B.stg || 0) - s0)*10)/10, stun:(B.stuns|0) > st0}`);
 const setStg = m => D(`const B0 = d.bossNow(); B0.hp = B0.max*(1 - (B0.ph - 1)/(B0.phases || 3)) - 1; const S = wm.adm.phState(); S.plan.stg[d.bossNow().ph - 1] = '${m}'; const B = d.bossNow(); B.stg = 0; B.stunT = 0; for (let i = 0; i < 70; i++) { d.update(.05); B.stunT = 0; } B.stg = 0; return 1`);
 await fight('grumble');
 const pl = await D('return wm.adm.phState().plan'); ok('plan: phase 1 classic, every phase a different stagger method, one reflects/ignores charged', pl.stg[0] == 'classic' && new Set(pl.stg).size == pl.stg.length && pl.stg.some(s => s == 'reflect' || s == 'speed'), pl);
 ok('non-scripted boss also changes arena, movement and attacks each phase', pl.arena.slice(1).every(Boolean) && pl.move.slice(1).every(Boolean) && pl.atk.slice(1).every(Boolean) && new Set(pl.move.slice(1)).size == pl.move.length - 1);
 // classic + variety bonus
 let r = await hit({chg:1}); ok('phase 1: a charged throw fills stagger', r.stg > 15, r);
 const rs = []; for (let i = 0; i < 7; i++) rs.push(await hit({chg:1})); ok('same trick again and again fades to 25%', rs[6].dmg <= 2.6 && rs[6].dmg < rs[0].dmg, rs.map(q => q.dmg));
 r = await hit({chg:0}); const r2 = await hit({chg:1}); ok('switching actions resets the variety bonus', r2.dmg >= 9.9, [r, r2]);
 // each method
 await D('const B = d.bossNow(); B.stuns = 0;');
 await setStg('reflect'); const nb0 = await D('return d.p3.ballsArr().filter(q => !q.mine).length'); r = await hit({chg:1}); const nb1 = await D('return d.p3.ballsArr().filter(q => !q.mine).length');
 ok('Reflect: charged throws bounce back (no damage)', r.dmg == 0 && nb1 > nb0, [r, nb0, nb1]); r = await hit({chg:0}); ok('Reflect: quick plain shots stagger', r.stg > 0, r);
 await setStg('weak'); r = await hit({chg:0}); const gemR = await D(`const B = d.bossNow(); const S = wm.adm.phState(); return 1`);
 const wk = await D(`const B = d.bossNow(); for (let i = 0; i < 3; i++) d.update(.01); let best = null; for (let a = 0; a < 6.3; a += .05) { const x = B.x + Math.cos(a)*(B.r + 10), y = B.y - 8 + Math.sin(a)*(B.r + 6); const h0 = B.stg || 0; d.hurtBoss(1, {mine:1, x, y, chg:0}); if ((B.stg || 0) > h0) { best = a; break; } } return best != null`);
 ok('Weak point: body hits do nothing, the glowing gem staggers', r.stg == 0 && wk, r);
 await setStg('counter'); await D('for (let i = 0; i < 100 && wm.adm.phState().wind; i++) d.update(.05);'); r = await hit({chg:1}); const ct = await D(`const B = d.bossNow(); let got = 0; for (let i = 0; i < 200 && !got; i++) { d.update(.05); const S = wm.adm.phState(); if (B.stunT <= 0 && S && i % 8 == 0) { const s0 = B.stg || 0, st0 = B.stuns|0; d.hurtBoss(1, {mine:1, x:B.x, y:B.y, chg:i % 16 ? 0 : 1}); if ((B.stg || 0) > s0 + 5 || (B.stuns|0) > st0) got = 1; } } return got`);
 ok('Counter: only hits during the glowing wind-up count', r.stg == 0 && ct, r);
 await setStg('brk'); await tick(2); r = await hit({chg:1}); ok('Break: shielded by 3 pylons (damage cut, no stagger)', r.dmg <= 3.1 && r.stg == 0, r);
 const bp = await D(`const B = d.bossNow(); const s0 = B.stg || 0, st0 = B.stuns|0; const P = wm.adm.phState().pyl; for (const q of P) for (let i = 0; i < 4; i++) { d.p3.ballsArr().push({x:q.x, y:q.y, vx:0, vy:0, mine:1, life:1, r:6, dmg:1, hits:[]}); d.update(.02); } return [(B.stg || 0) > s0 || (B.stuns|0) > st0, P.map(q => q.hp)]`);
 ok('Break: smashing the pylons fills stagger', bp[0], bp);
 await setStg('env'); await tick(2); const ev = await D(`const B = d.bossNow(); B.stunT = 0; const st0 = B.stuns|0; const q = wm.adm.phState().ice[0]; B.x = q.x; B.y = q.y; d.p3.ballsArr().push({x:q.x, y:q.y, vx:0, vy:0, mine:1, life:1, r:6, dmg:1, hits:[]}); for (let i = 0; i < 20; i++) { B.x = q.x; B.y = q.y; d.update(.05); } return (B.stuns|0) > st0`);
 ok('Environment: knock an icicle onto it → stun', ev);
 await D('const B = d.bossNow(); B.stunT = 0;'); await tick(70);
 await setStg('status'); const stt = await D(`const B = d.bossNow(); B.stunT = 0; const st0 = B.stuns|0; for (let i = 0; i < 12; i++) d.hurtBoss(1, {mine:1, x:B.x, y:B.y, chg:i % 2}); return (B.stuns|0) > st0`); ok('Frostbite: 12 quick hits → stun', stt);
 await tick(140); await setStg('speed'); r = await hit({chg:1}); const r3 = await hit({chg:0}); ok('Speed: charged throws mostly miss, rapid shots stagger', r.dmg <= 2.1 && r3.stg > 0, [r, r3]);
 await setStg('parry'); const pa = await D(`const B = d.bossNow(); B.stunT = 0; const s0 = B.stg || 0, st0 = B.stuns|0; d.p.roll = .2; d.p3.ballsArr().push({x:d.p.x + 10, y:d.p.y, vx:0, vy:0, mine:0, life:1, r:7, dmg:1, hits:[]}); d.update(.02); return (B.stg || 0) > s0 || (B.stuns|0) > st0`); ok('Parry: rolling through a shot opens it up', pa);
 await tick(70); await setStg('lure');
 const lure = await D(`const B = d.bossNow(); B.stunT = 0; let S = null; for (let i = 0; i < 260; i++) { d.update(.05); S = wm.adm.phState(); if (S.treat) break; } if (!S.treat) return 'no treat'; d.p.x = S.treat.x; d.p.y = S.treat.y; let ate = false; for (let i = 0; i < 200 && !ate; i++) { d.update(.05); ate = wm.adm.phState().eat > 0; } if (!ate) return 'never ate'; const s0 = B.stg || 0, st0 = B.stuns|0; d.hurtBoss(1, {mine:1, x:B.x, y:B.y, chg:1}); return (B.stg || 0) > s0 || (B.stuns|0) > st0`);
 ok('Lure: walk over the treat, it eats, hits stagger', lure === true, lure);
 // phase changes: banner + arena/move/attack add-ons are live
 await D('const B = d.bossNow(); B.stunT = 0;'); await D('wm.adm.bossPhase(2);'); await tick(4);
 const msg = await D('return d.p3 ? (window.__lastSay || "") : ""');
 const live = await D(`let hz = 0, en = 0; const B = d.bossNow(); for (let i = 0; i < 400; i++) { d.update(.05); const S = wm.adm.phState(); if (S) hz = Math.max(hz, S.hz); } en = d.p3.ballsArr().filter(q => !q.mine).length; return [hz, en, !!d.bossNow()]`);
 ok('phase 2: new hazards/attacks show up', live[0] > 0 || live[1] > 0, live);
 await p.waitForTimeout(200); await p.screenshot({path:__dirname + '/phases.png'});
 // charged-only vs mixed
 await fight('icefang'); const cmp = await D(`const B = d.bossNow(); const go = mix => { B.hp = B.max; B.ph = 1; B.stunT = 0; B.stg = 0; B.stuns = 0; let dealt = 0; for (let i = 0; i < 60; i++) { const h0 = B.hp; d.hurtBoss(10, {mine:1, x:B.x, y:B.y, chg:mix ? (i % 3 == 0 ? 1 : 0) : 1, team:mix && i % 3 == 2}); dealt += h0 - B.hp; B.stunT = 0; if (B.hp < B.max*.4) { B.hp = B.max; } } return Math.round(dealt); }; return [go(false), go(true)]`);
 ok('charged-throw spam does far less than mixing it up', cmp[0] < cmp[1]*.6, cmp);
 // scripted bosses (Keep Lords, Lit…) keep their own attacks but still get stagger methods + arena changes
 const kp = await D(`d.foes().length = 0; const k = SG.keepAdm("state").KS[1]; SG.keepAdm("ready", 2); d.p.x = k.x; d.p.y = k.y; for (let i = 0; i < 40; i++) d.update(.05); const S = wm.adm.phState(); return S ? {stg:S.plan.stg, arena:S.plan.arena, move:S.plan.move.length} : null`);
 ok('scripted bosses: stagger methods + arena changes, own attacks kept', kp && kp.stg.length >= 3 && kp.arena[1] && kp.move == 0, kp);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
