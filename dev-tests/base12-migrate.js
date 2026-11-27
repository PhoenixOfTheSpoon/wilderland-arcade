const L = require('./lib.js');
const save = {econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, upg:{snowball:{mate:839, life:850, arm:843, boots:841, boost:993}},
  gdata:{snowball:{sb:{cr:0, up:{}, frost:50000, bank:5e6, ow:{v:1, met:1, base:{tier:3, rooms:{barracks:4,guard:4,forge:4,kitchen:4,pantry:4,trophy:4,shrine:4,yard:4,well:4,defenses:4}}, bhp:{grumble:50, icefang:180}}}}}};
(async()=>{ const {b,p,errs,D,world,app} = await L.start({save}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 const leg = await p.evaluate(app+'.P.snowLeg'); ok('legacy captured from Workshop levels', leg && leg.mate == 3 && leg.life == 19 && leg.boots == 5, leg);
 await p.evaluate(app+'.open("snowball")'); await p.waitForTimeout(1200);
 const U = await p.evaluate(()=>window.Arcade.upg); ok('game sees legacy power only', U.mate == 3 && U.life == 19 && U.boots == 5 && U.arm == 0, U);
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); }); await p.waitForTimeout(900); for (let i=0;i<25;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 ok('teammates from legacy Snow Buddy', (await D('return d.mates.length')) == 3, await D('return d.mates.length'));
 ok('old exact boss hp flagged once', await D('return !!(d.W.bhpExact && d.W.bhpExact.grumble)'));
 const hp1 = await D(`d.p.x = d.LAIR.grumble.x; d.p.y = d.LAIR.grumble.y + 200; d.spawnBoss('grumble'); return Math.round(d.bossNow().hp)`); ok('first spawn keeps exact old health (50)', hp1 == 50, hp1);
 
 
 const top = await D(`const mx = d.bossNow().max, np = 3; d.W.bhp.grumble = mx*0.55; d.spawnBoss('grumble'); const B = d.bossNow(); return [Math.round(B.hp), Math.round(mx*(1-1/np)), B.ph]`);
 ok('respawned boss refills to top of its phase', top[0] == top[1] && top[2] == 2, top);
 await D(`d.p.x = 50*48; d.p.y = 92*48;`);
 const T = await D(`d.p3.fortPanel(); const P = d.p3.panel()(); return {title:P.title, rows:P.rows.map(r=>r.n + ' | ' + r.btn).slice(0,6)}`); ok('fort panel shows Level 4 / 12', T.title.includes('Level 4 / 12'), T);
 ok('room shows Lv 4/4', (await D(`return d.p3.panel()().rows.find(r=>r.n.startsWith('Barracks')).n`)).includes('4/4'));
 const lockA = await D(`return d.p3.panel()().rows.find(r=>r.n.startsWith('Ice Armory')).btn`); ok('Ice Armory locked until level 5', lockA.includes('Base level 5'), lockA);
 const before = await D(`return [d.W.base.tier, window.Arcade._dbg.snow().perm ? 0 : 0]`);
 const tu = await D(`const f0 = 0; const r = d.p3.tierUp(); return [r, d.W.base.tier, d.W.base.mile]`); ok('buy base level 5 (+ reward)', tu[0] && tu[1] == 4 && tu[2][4] == 1, tu);
 const lockA2 = await D(`d.p3.fortPanel(); return d.p3.panel()().rows.find(r=>r.n.startsWith('Ice Armory')).btn`); ok('Ice Armory unlocked at level 5', lockA2.includes('Build'), lockA2);
 const n0 = await D(`return d.mates.length`); await D(`const r = d.p3.ROOMS.find(q=>q.id=='lodge'); d.p3.buyRoom(r); d.p3.buyRoom(r);`);
 ok('Lodge adds a 4th teammate live', (await D('return d.mates.length')) == 4, await D('return [d.mates.length, d.W.base.rooms.lodge]'));
 const ua = await D(`d.p3.upgradeAll(); return {tier:d.W.base.tier, rooms:d.W.base.rooms}`); ok('Upgrade all buys lots', ua.tier >= 4, ua);
 const mine = await D(`d.W.base.tier = 8; d.W.base.rooms.mine = 3; d.W.mineAt = Date.now() - 20*3600e3; return [d.p3.mineHas(), d.p3.mineRate(3)*12]`); ok('mine holds 12 hours (offline)', mine[0] == mine[1], mine);
 const fr = await D(`const PERM = window.Arcade._dbg.snow(); return 0`);
 // max-level descriptions read right at 12
 const desc = await D(`d.W.base.tier = 11; return d.p3.ROOMS.map(r => r.n + ': ' + r.d(12))`); console.log(desc.join('\n'));
 const tc = await D(`return d.p3.TIER_COST.map(c => c ? c.frost + '/' + c.flakes : '-').join(' ')`); console.log('tier costs', tc);
 const rc = await D(`return [1,4,8,11].map(l => l + ':' + JSON.stringify(d.p3.roomCost('mine', l)))`); console.log('room costs', rc.join(' '));
 // reload keeps everything
 await D(`d.W.base.rooms.armory = 5;`); await p.evaluate(()=>window.Arcade._dbg.snow().wm().adm.baseLv(6)); await p.evaluate(()=>{ const a = window.Arcade._dbg.snow(); a.wm().dbg(); }); 
 await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
 await p.reload(); await p.waitForTimeout(5000);
 const after = await p.evaluate(app+'.P.gdata.snowball.sb.ow.base'); ok('base saved after reload', after.tier == 5 && after.rooms.armory == 5, after);
 const tix = await p.evaluate(()=>{ return 1; });
 console.log(errs.filter(e=>!e.includes('Failed to load resource'))); await b.close(); })();
