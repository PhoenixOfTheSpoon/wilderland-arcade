const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start({ctx:{viewport:{width:1366,height:768}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; }); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 // go to Pinecrest Hollow (lots of trees) and start fires
 await D('d.p.x = 30*48; d.p.y = 190*48; for (let i = 0; i < 5; i++) d.update(0.05);');
 const n0 = await D('wm.adm.fireHere(); return 1'); const FX = 'd.p3.X && 0';
 const st = await D('for (let i = 0; i < 5; i++) d.update(0.05); const fx = wm.adm && 0; return 1');
 const F = await p.evaluate(() => { const wm = window.Arcade._dbg.snow().wm(); return wm.fx ? 1 : 0; });
 // reach the fire system through the debug hook
 const nf = await D('const X = d.p3.FX ? d.p3.FX() : null; return X ? [X.fires().length, Math.round(X.heatAt(d.p.x, d.p.y)*100)] : null');
 ok('fires start in Pinecrest and there is heat near them', nf && nf[0] > 0 && nf[1] > 0, nf);
 // fires spread near you (but are capped)
 const sp = await D('const X = d.p3.FX(); const a = X.fires().length; for (let i = 0; i < 400; i++) d.update(0.05); return [a, X.fires().length, X.adm.ash()]');
 ok('fire spreads (and burned trees turn to ash), capped at 60', sp[1] <= 60 && (sp[1] > sp[0] || sp[2] > 0), sp);
 // snowballs melt in heat: throw into a strong fire zone vs a cold place

 const m2 = await D(`const X = d.p3.FX(), f = X.fires()[0]; if (!f) return null; const bs = d.p3.ballsArr(); bs.length = 0; d.p.x = f.x - 40; d.p.y = f.y + 30; d.throwAt ? 0 : 0; d.p3.throwAt(d.p.x + 300, d.p.y, 0); const b0 = bs[bs.length - 1]; const h = X.heatAt(b0.x, b0.y); for (let i = 0; i < 6; i++) d.update(0.05); return [Math.round(h*100), Math.round(b0.r*10)/10, Math.round(b0.life*10)/10]`);
 const m3 = await D(`const bs = d.p3.ballsArr(); d.p3.FX().adm.out(); d.p.x = 60*48; d.p.y = 160*48; bs.length = 0; d.p3.throwAt(d.p.x + 300, d.p.y, 0); const b0 = bs[bs.length - 1]; for (let i = 0; i < 6; i++) d.update(0.05); return [Math.round(b0.r*10)/10, Math.round(b0.life*10)/10]`);
 ok('snowballs shrink and lose flight time in heat, not in the cold', m2 && m2[0] > 0 && m2[1] < m3[0] && m2[2] < m3[1], {hot:m2, cold:m3});
 // tools
 await D('wm.adm.fireTools(); d.p.x = 30*48; d.p.y = 190*48; wm.adm.fireHere(); for (let i = 0; i < 5; i++) d.update(0.05);');
 await p.keyboard.press('l'); await p.waitForTimeout(100); ok('L turns the Cold Lantern on', await D('return d.p3.FX().lantern()'));
 const pump = await D(`const X = d.p3.FX(), f = X.fires()[0]; if (!f) return null; const n = X.fires().length; d.p.x = f.x - 80; d.p.y = f.y; d.W.autoT = 0; return [n, f.x, f.y]`);
 await p.mouse.move(700, 400); const pumpRes = await D(`const X = d.p3.FX(), f = X.fires()[0]; const P0 = window.Arcade._dbg.snow().PERM.frost; d.p3.FX().F.water = 100; const keys = d.p3.keysObj(); keys.r = true; const aimFix = 1; for (let i = 0; i < 60; i++) { d.p.x = f.x - 80; d.p.y = f.y; d.p.face = 0; d.update(0.05); } keys.r = false; return [f.out ? 1 : 0, f.hp <= 0 || !X.fires().includes(f), window.Arcade._dbg.snow().PERM.frost - P0]`);
 ok('holding R sprays a fire out and it drops Frost Crystals', pumpRes[1] && pumpRes[2] > 0, pumpRes);
 const bomb = await D(`const X = d.p3.FX(); X.F.bombCd = 0; X.blizzardBomb(); return X.zones().length`); ok('Blizzard Bomb makes a cold zone', bomb > 0, bomb);
 const heart = await D(`const X = d.p3.FX(); X.F.heartCd = 0; d.p3.spawnFoe('pup', d.p.x + 100, d.p.y); X.frozenHeart(); const f = d.foes()[d.foes().length - 1]; return [f.stun >= 3, X.zones().some(z => z.k == 'heart')]`); ok('Frozen Heart freezes enemies around you', heart[0] && heart[1], heart);
 await D('for (let i = 0; i < 8; i++) d.update(0.05);'); await p.waitForTimeout(400); await p.screenshot({path:__dirname + '/fire.png'});
 // safe at camp, save + reload keeps ash, never burns offline (fires are not saved)
 const camp = await D(`const X = d.p3.FX(); return X.ignite(50, 88) ? 'burned' : 'safe'`); ok('no fires at Camp Cocoa', camp == 'safe');
 const ashN = await D('wm.save ? 0 : 0; return d.p3.FX().adm.ash()'); await D('d.p3.save()'); await p.keyboard.press('Escape'); await p.waitForTimeout(400); await p.reload(); await p.waitForTimeout(5000); await world();
 const after = await D('const X = d.p3.FX ? (d.update(0.05), d.p3.FX()) : null; return X ? [X.adm.ash(), X.fires().length] : null'); ok('after a reload the ash is still there and no fire kept burning', after && after[0] == ashN && after[1] == 0, {ashN, after});
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
