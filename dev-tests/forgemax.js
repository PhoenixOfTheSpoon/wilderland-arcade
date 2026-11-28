// Forge Max room: forge up to Snow … Phoenix +9, Phoenix +10..+12 stay fusing-only
const L = require('./lib.js');
(async()=>{ const {b,p,errs,app,D,world} = await L.start({ctx:{viewport:{width:1440,height:900}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await p.evaluate(app + '.open("snowball")'); await p.waitForTimeout(1200);
 const S = s => p.evaluate('(()=>{ const sn = window.Arcade._dbg.snow(); const P = sn.PERM; '+s+' })()');
 const pop = () => p.evaluate(()=>document.querySelectorAll('.wlw-pop').forEach(e=>e.remove()));
 // old save: no Forge Max → normal forge only
 await S('P.gear = []; P.eq = {}; P.frost = 1e9; P.fq = 1; P.faf = 0; P.ow = P.ow || {}; P.ow.base = P.ow.base || {rooms:{}, tier:11}; P.ow.base.rooms = P.ow.base.rooms || {}; P.ow.base.rooms.forge = 12; delete P.ow.base.rooms.forgemax; P.fmode = "max"; sn.openPanel("loadout"); return 1'); await p.waitForTimeout(300); await pop();
 await p.locator('button', {hasText:/^Forge 🧤 Gloves · /}).click({force:true}); await p.waitForTimeout(200);
 ok('no Forge Max: still Mythic at best, 25 🔷', (await S('return [1e9 - P.frost, Math.max(...P.gear.map(x => x.rar))]')).join() == '25,5', await S('return [1e9 - P.frost, P.gear.map(x => x.rar)]'));
 // level 3 → Phoenix at max
 await S('P.gear = []; P.ow.base.rooms.forgemax = 3; P.fmode = "max"; sn.openPanel("loadout"); return 1'); await p.waitForTimeout(300); await pop();
 const txt = await p.evaluate(() => (document.body.innerText.match(/🔥 Forge Max level[^\n]*/) || [])[0]); ok('Forge panel shows the max grade and the next unlock', /Phoenix/.test(txt) && /next level: Phoenix \+1/.test(txt), txt);
 await p.locator('button', {hasText:/^Forge 🧤 Gloves · /}).click({force:true}); await p.waitForTimeout(200);
 let r = await S('return [1e9 - P.frost, P.gear.map(x => x.rar)]'); ok('Lv3 "at max rarity": a Phoenix piece, costs more', r[1][0] == 8 && r[0] > 25, r);
 // level 12 → Phoenix +9, never +10..+12
 await S('P.gear = []; P.frost = 1e12; P.ow.base.rooms.forgemax = 12; P.fmode = "max"; P.fq = 10; sn.openPanel("loadout"); return 1'); await p.waitForTimeout(300); await pop();
 await p.locator('button', {hasText:/^Forge 🧤 Gloves ×10/}).click({force:true}); await p.waitForTimeout(300);
 r = await S('return P.gear.map(x => x.rar)'); ok('Lv12 at max: Phoenix +9 (grade 17), never +10..+12', r.length && r.every(x => x == 17), r);
 await S('P.gear = []; P.fmode = "rand"; P.fq = 250; sn.openPanel("loadout"); return 1'); await p.waitForTimeout(300); await pop();
 const f0 = await S('return P.frost'); await p.locator('button', {hasText:/^Forge 🧤 Gloves ×250/}).click({force:true}); await p.waitForTimeout(400);
 r = await S('const a = P.gear.map(x => x.rar); return [Math.min(...a), Math.max(...a), a.length]'); const c2 = await S('return ' + f0 + ' - P.frost');
 ok('random up to max: mixed grades, capped at +9, cheaper per piece', r[0] < r[1] && r[1] <= 17, [r, c2]);
 // room: unlocks at base level 8, steep costs
 await world(); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const rm = await D('const R = d.p3.ROOMS.find(r => r.id == "forgemax"); return [R.at, R.d(1), R.d(12), d.p3.roomCost("forgemax", 1).frost, d.p3.roomCost("forgemax", 11).frost]');
 ok('Forge Max room: base level 8, Snow at lv1, Phoenix +9 at lv12, very steep costs', rm[0] == 8 && /Snow/.test(rm[1]) && /Phoenix \+9/.test(rm[2]) && rm[4] > rm[3]*1000, rm);
 await D('d.W.base.tier = 11; d.W.base.rooms.forgemax = 6; d.p.x = 57.7*48; d.p.y = 88.6*48;'); await p.waitForTimeout(400); await p.screenshot({path:__dirname + '/forgemax.png'});
 ok('its building can be opened with E', await D('return d.things().some(t => /Forge Max/.test(t.n))'));
 await p.keyboard.press('Escape'); await p.waitForTimeout(500); await p.reload(); await p.waitForTimeout(5000); await p.evaluate(app + '.open("snowball")'); await p.waitForTimeout(1200);
 ok('Forge Max level + forge mode saved after reload', (await S('return [P.ow.base.rooms.forgemax, P.fmode]')).join() == '6,rand', await S('return [P.ow.base.rooms.forgemax, P.fmode]'));
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
