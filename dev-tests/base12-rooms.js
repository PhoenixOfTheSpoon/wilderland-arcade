const L = require('./lib.js');
const save = {econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, gdata:{snowball:{sb:{cr:0, up:{}, frost:2e6, bank:2e9, ow:{v:1, met:1, base:{tier:10, rooms:{}}}}}}};
(async()=>{ const {b,p,errs,D,world,app} = await L.start({save}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world();
 const t12 = await D(`const r = d.p3.tierUp(); return [r, d.W.base.tier, d.W.base.mile, !!d.dlg()]`); ok('level 12 bought, celebration dialog', t12[1] == 11 && t12[3], t12);
 for (let i=0;i<6;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 await p.waitForTimeout(800);
 const st = await p.evaluate(app+'.P.stats.max.snowFort'); ok('Castle Builder stat = 11', st == 11, st);
 await p.waitForTimeout(500);
 const at = await p.evaluate(app+'.P.at && '+app+'.P.at.snowFort'); ok('Castle Builder achievement tier 5', at >= 5, at);
 // map room + flags
 await D(`d.W.base.rooms.maproom = 8; d.p.x = 30*48; d.p.y = 66*48;`); await D(`d.p3.mrPlant(); d.p.x = 70*48; d.p.y = 60*48; d.p3.mrPlant(); d.p.x = 90*48; d.p.y = 100*48; d.p3.mrPlant();`);
 const fl = await D(`return d.W.mflags.length`); ok('Map Room 8 keeps 2 flags', fl == 2, fl);
 await D(`d.p.x = 50*48; d.p.y = 88*48; d.p3.openMap(true);`); await p.waitForTimeout(400); await p.screenshot({path:'./map.png'});
 const tr = await D(`const f = d.W.mflags[0], M = d.p3.MAPR; d.p3.mapDown({x:M.x + f.x/48*M.s, y:M.y + f.y/48*M.s}); return [Math.round(d.p.x/48), Math.round(d.p.y/48)]`); ok('fast travel to flag', tr[0] == 70 && tr[1] == 60, tr);
 // infirmary gold hearts in a siege + armory blocks
 await D(`d.W.base.rooms.infirmary = 6; d.W.base.rooms.armory = 12;`); await p.evaluate(()=>window.Arcade._dbg.snow().wm().adm.siege()); await p.waitForTimeout(300); for (let i=0;i<6;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const gh = await D(`return d.p.over`); ok('siege starts with 6 gold hearts', gh == 6, gh);
 const hh = await D(`const h0 = d.p.hp; let blocks = 0; for (let i = 0; i < 200; i++) { d.p.inv = 0; const o = d.p.over, h = d.p.hp; d.p3.hurtMe(1); if (d.p.over == o && d.p.hp == h) blocks++; if (d.p.hp < 3) d.p.hp = 50; } return blocks`); ok('Ice Armory blocks ~31% of hits', hh > 35 && hh < 95, hh);
 await D(`d.p3.siegeEnd(false)`); ok('gold hearts end with the siege', (await D('return d.p.over')) == 0);
 await D(`d.p.x = 50*48; d.p.y = 92*48;`); await p.waitForTimeout(400); await p.screenshot({path:'./keep12.png'});
 console.log(errs.filter(e=>!e.includes('Failed to load resource'))); await b.close(); })();
