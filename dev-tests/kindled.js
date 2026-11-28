const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start({ctx:{viewport:{width:1366,height:768}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; }); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const sp = (k, dx, dy) => D(`d.p3.spawnFoe('${k}', d.p.x + ${dx}, d.p.y + ${dy}); const f = d.foes()[d.foes().length - 1]; f.idx = Math.random(); return f.hp`);
 await D('d.p.x = 30*48; d.p.y = 190*48; d.foes().length = 0; wm.adm.fireTools();');
 // art: one of each
 await D('wm.adm.kindled(); wm.adm.wild(); d.foes().forEach(f => { f.stun = 99; }); const n = d.foes().length; return n'); await D('d.foes().forEach((f, i) => { const a = i/14*6.28; f.x = d.p.x + Math.cos(a)*(150 + (i%2)*90); f.y = d.p.y + Math.sin(a)*(120 + (i%2)*80); f.up = 1; });');
 await p.waitForTimeout(600); await p.screenshot({path:__dirname + '/kindled.png'});
 ok('14 new enemies spawn', (await D('return d.foes().filter(f => window.Arcade._snowT.FOE[f.k].kx).length')) >= 14);
 await D('d.foes().length = 0;');
 // imp lights fires
 await sp('k_imp', 200, 0); const imp = await D('for (let i = 0; i < 60; i++) d.update(0.05); return d.p3.FX().fires().length'); ok('Ember Imp lights fires as it runs', imp > 0, imp); await D('d.p3.FX().adm.out(); d.foes().length = 0;');
 // golem armour
 await sp('k_golem', 200, 0); const gol = await D(`const f = d.foes()[0]; f.stun = 99; const h0 = f.hp; d.p3.hurtFoeT(f, 10, {}); const a = h0 - f.hp; f.cooled = 3; const h1 = f.hp; d.p3.hurtFoeT(f, 10, {}); return [Math.round(a*10)/10, Math.round((h1 - f.hp)*10)/10]`); ok('Magma Golem: 10% damage until cooled, full when cooled', gol[0] == 1 && gol[1] == 10, gol); await D('d.foes().length = 0;');
 await sp('k_wraith', 200, 0); const wr = await D(`const f = d.foes()[0]; f.stun = 99; const h0 = f.hp; d.p3.hurtFoeT(f, 10, {}); return Math.round((h0 - f.hp)*10)/10`); ok('Ash Wraith: soft to hit outside cold light (30%)', wr == 3, wr); await D('d.foes().length = 0;');
 // moth drains the lantern
 await sp('k_moth', 40, 0); const moth = await D(`const X = d.p3.FX(); X.F.lc = 30; if (!X.lantern()) X.toggleLantern(); for (let i = 0; i < 40; i++) d.update(0.05); return Math.round(X.F.lc)`); ok('Fire Moth drains the Cold Lantern faster', moth < 28, moth); await D('d.foes().length = 0;');
 // cultist heals the Kindled
 await sp('k_cult', 200, 0); await sp('k_imp', 230, 0); const cu = await D(`const c = d.foes().find(f => f.k == 'k_cult'), im = d.foes().find(f => f.k == 'k_imp'); im.stun = 99; im.hp = 1; c.hl = 0.01; for (let i = 0; i < 4; i++) d.update(0.05); return im.hp`); ok('Kindled Cultist heals fire enemies', cu > 1, cu); await D('d.p3.FX().adm.out(); d.foes().length = 0;');
 // wisp explodes into fire
 await sp('k_wisp', 50, 0); const wi = await D(`for (let i = 0; i < 40; i++) d.update(0.05); return [d.foes().filter(f => f.k == 'k_wisp').length, d.p3.FX().fires().length]`); ok('Flame Wisp explodes into fire patches', wi[0] == 0 && wi[1] > 0, wi); await D('d.p3.FX().adm.out(); d.foes().length = 0;');
 // wolves come in packs
 await sp('w_wolf', 300, 0); const wo = await D('d.update(0.05); return d.foes().filter(f => f.k == "w_wolf").length'); ok('Frost Wolves come in packs of 3', wo == 3, wo); await D('d.foes().length = 0;');
 // lurker hidden until close, elk trust
 await sp('w_lurker', 300, 0); const lu = await D(`const f = d.foes()[0]; const h0 = f.hp; d.p3.hurtFoeT(f, 5, {}); const hid = f.hp == h0 && !f.up; f.x = d.p.x + 80; f.y = d.p.y; d.update(0.05); return [hid, !!f.up]`); ok('Marsh Lurker: hidden (can’t be hit) until you come close', lu[0] && lu[1], lu); await D('d.foes().length = 0;');
 await sp('w_elk', 130, 0); const elk = await D(`const P0 = window.Arcade._dbg.snow().PERM.frost; for (let i = 0; i < 80; i++) { d.p.vx = 0; d.p.vy = 0; d.update(0.05); } return [d.foes().filter(f => f.k == 'w_elk').length, window.Arcade._dbg.snow().PERM.frost - P0]`); ok('Starlight Elk: stand still near it and it trusts you (+15 🔷)', elk[0] == 0 && elk[1] >= 15, elk);
 // eagle dive is telegraphed then hits
 await D('d.foes().length = 0;'); await sp('w_eagle', 150, 0); const ea = await D(`window.Arcade.immortal = false; d.p.inv = 0; d.p.hp = 20; d.p.max = 20; const f = d.foes()[0]; f.dc = 0; const h0 = d.p.hp; d.update(0.05); const tele = !!f.dive; for (let i = 0; i < 20; i++) { d.p.inv = 0; d.p.vx = d.p.vy = 0; d.update(0.05); } window.Arcade.immortal = true; return [tele, h0 - d.p.hp]`); ok('Ice Eagle dive: shadow warning first, then it hits', ea[0] && ea[1] >= 2, ea);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
