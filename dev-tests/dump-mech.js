const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start(); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world();
 // unit checks with a fake fight
 const u = await p.evaluate(()=>{ const M = window.Arcade.dumpMech, out = {}; const mk = () => { const S = {p:{x:0, y:300}, hp:20, says:[], foes:[], say(m){ this.says.push(m); }, hurtMe(n){ this.hp -= n; }, spawnFoe(k, x, y){ this.foes.push({k, x, y, hp:9, max:9}); }}; const B = {hx:0, hy:0, x:0, y:0, r:40, hp:1000, max:1000, mk:{cd:0, i:0, cur:null}}; return {S, B}; };
   const run = (S, B, list, secs, each) => { for (let i = 0; i < secs*20; i++) { if (each) each(S, B); M.tick(B, .05, S, list); } };
   // plates: walk 1 → 2 → 3
   { const {S, B} = mk(); M.tick(B, .05, S, ['plates']); const C = B.mk.cur; run(S, B, ['plates'], 3, (S2, B2) => { const c = B2.mk.cur; if (c) { const q = c.pl.find(x => x.n == c.next); if (q) { S2.p.x = q.x; S2.p.y = q.y; } } }); out.plates = [B.stunT > 0, S.hp]; }
   { const {S, B} = mk(); M.tick(B, .05, S, ['plates']); run(S, B, ['plates'], 12); out.platesFail = [!!B.stunT, S.hp]; }
   // pillars: hide behind one vs stand in the open
   { const {S, B} = mk(); M.tick(B, .05, S, ['pillars']); const q = B.mk.cur.pil[0]; run(S, B, ['pillars'], 5, (S2, B2) => { const a = Math.atan2(q.y - B2.y, q.x - B2.x); S2.p.x = q.x + Math.cos(a)*50; S2.p.y = q.y + Math.sin(a)*50; }); out.pillarSafe = S.hp; }
   { const {S, B} = mk(); M.tick(B, .05, S, ['pillars']); S.p = {x:0, y:-200}; B.mk.cur.pil = [{x:400, y:400}]; run(S, B, ['pillars'], 5); out.pillarHit = S.hp; }
   // shield: 5% damage, break crystals → stun
   { const {S, B} = mk(); M.tick(B, .05, S, ['shield']); out.shieldDmg = M.onHit(B, 100, {mine:1}); S.foes.forEach(f => f.dead = 1); M.tick(B, .05, S, ['shield']); out.shieldBroken = [B.stunT > 0, M.onHit(B, 100, {mine:1})]; }
   // beam: hit a lot → win; do nothing → lose
   { const {S, B} = mk(); M.tick(B, .05, S, ['beam']); run(S, B, ['beam'], 6, (S2, B2) => { if (B2.mk.cur) M.onHit(B2, 1, {mine:1, chg:0}); }); out.beamWin = [B.stunT > 0, S.hp]; }
   { const {S, B} = mk(); M.tick(B, .05, S, ['beam']); run(S, B, ['beam'], 9); out.beamLose = [!!B.stunT, S.hp]; }
   // zone: outside the light → hurt; inside → fine
   { const {S, B} = mk(); M.tick(B, .05, S, ['zone']); run(S, B, ['zone'], 9, (S2, B2) => { const c = B2.mk.cur; if (c) { S2.p.x = Math.cos(c.a + Math.PI)*200; S2.p.y = Math.sin(c.a + Math.PI)*200; } }); out.zoneOut = S.hp; }
   { const {S, B} = mk(); M.tick(B, .05, S, ['zone']); run(S, B, ['zone'], 9, (S2, B2) => { const c = B2.mk.cur; if (c) { S2.p.x = Math.cos(c.a)*200; S2.p.y = Math.sin(c.a)*200; } }); out.zoneIn = S.hp; }
   return out; });
 ok('rune plates in order stun him', u.plates[0] && u.plates[1] == 20, u.plates); ok('rune plates missed: 1 heart', !u.platesFail[0] && u.platesFail[1] == 19, u.platesFail);
 ok('hiding behind a pillar is safe', u.pillarSafe == 20, u.pillarSafe); ok('Frost Breath in the open: 2 hearts', u.pillarHit == 18, u.pillarHit);
 ok('ice shield: 5% damage, breaking the crystals stuns him and drops the shield', u.shieldDmg == 5 && u.shieldBroken[0] && u.shieldBroken[1] == 100, u);
 ok('beam struggle: hitting him wins (stun)', u.beamWin[0] && u.beamWin[1] == 20, u.beamWin); ok('beam struggle: doing nothing loses (2 hearts)', !u.beamLose[0] && u.beamLose[1] == 18, u.beamLose);
 ok('turning light: outside hurts, inside is safe', u.zoneOut < 20 && u.zoneIn == 20, [u.zoneOut, u.zoneIn]);
 // live: Dumpling fight 1 starts a mechanic and draws without errors
 const D2 = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); const ST = window.Arcade.SAGA.story; '+s+' })()');
 const skip = async () => { for (let i=0;i<40;i++){ if (!(await D2('return !!d.dlg()'))) break; await D2('d.nextLine()'); await p.waitForTimeout(25); } };
 await p.evaluate(()=>{ window.Arcade.immortal = true; }); await D2('wm.adm.chapter(6)'); await skip(); await D2('ST.adm.fight(1)'); await skip(); await D2('d.p.y -= 140'); for (let i=0;i<30;i++){ await p.waitForTimeout(150); await skip(); if (await D2('return !!d.bossNow()')) break; }
 await D2('const B = d.bossNow(); B.mk = {cd:0, i:0, cur:null};'); await p.waitForTimeout(1500); const live = await D2('const B = d.bossNow(); return B && B.mk && B.mk.cur ? B.mk.cur.k : (B ? "none" : "noboss")');
 await p.screenshot({path:__dirname + '/dump-mech.png'});
 ok('Dumpling fight 1 runs a mechanic in the real game', ['plates', 'pillars'].includes(live), live);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
