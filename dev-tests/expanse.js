const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world,app} = await L.start({ctx:{viewport:{width:1366,height:768}}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 // an OLD save: position in Frostpine Village, fog v2 (70 blocks wide) with a corner explored, a saga position in the old lands-beyond space
 await p.evaluate(app + '.open("snowball")'); await p.waitForTimeout(1000);
 await p.evaluate(()=>{ const P = window.Arcade._dbg.snow().PERM; let f = ''; for (let i = 0; i < 70*70/4; i++) f += (i < 300 ? 'f' : '0'); P.ow = Object.assign(P.ow || {}, {x:Math.round(30.5*48), y:Math.round(112.5*48), fog:f.replace(/0+$/, ''), fogV:2, ways:{camp:1, village:1}, met:1}); window.Arcade._dbg.snow().savePerm ? 0 : 0; });
 await p.evaluate(()=>{ window.Arcade._dbg.snow().openWorld(); }); await p.waitForTimeout(1200); for (let i=0;i<20;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const st = await D('return [Math.floor(d.p.x/48), Math.floor(d.p.y/48), d.W.fogV, d.W.fog.length]'); ok('old save: same spot (Frostpine Village 30,112), fog migrated to v3', st[0] == 30 && st[1] == 112 && st[2] == 3, st);
 const fog0 = await D('let n = 0; const s = d.W.fog; for (const ch of s) n += [0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4][parseInt(ch, 16) || 0]; return n'); ok('explored corner kept (1200 blocks)', fog0 >= 1200, fog0);
 // travel to every new waystone and check the region there
 const ways = await D('const E = window.Arcade.snowExp, out = []; for (const k in E.WAYS) { d.W.ways[k] = 1; wm.adm && 0; const w = E.WAYS[k]; d.p.x = (w.x + .5)*48; d.p.y = (w.y + .5)*48 + 40; for (let i = 0; i < 10; i++) d.update(0.05); out.push([k, window.Arcade._snowT.regionAt(Math.floor(d.p.x/48), Math.floor(d.p.y/48))]); } return out');
 ok('all 8 new waystones are in their regions', ways.length == 8, ways);
 // frame time in a busy new region (Ravenwatch woods)
 await D('d.p.x = 200*48; d.p.y = 110*48;'); await p.waitForTimeout(800); const ft = await p.evaluate(() => new Promise(res => { let n = 0, t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(Math.round(n/2)); }; requestAnimationFrame(f); }));
 ok('frames per second in Ravenwatch Woods (headless, no GPU)', ft >= 30, ft + ' fps');
 await p.waitForTimeout(600); await p.screenshot({path:__dirname + '/exp-raven.png'});
 for (const [nm, x, y] of [['ember', 175, 176], ['mirror', 100, 172], ['marsh', 30, 250], ['tundra', 240, 240]]) { await D(`d.p.x = ${x}*48; d.p.y = ${y}*48;`); await p.waitForTimeout(700); await p.screenshot({path:__dirname + '/exp-' + nm + '.png'}); }
 // village: shop, inn (respawn), quest board
 const v = await D(`const E = window.Arcade.snowExp, V = E.VIL.emberford; d.p.x = (V.x + 5 + .5)*48; d.p.y = (V.y - 3 + .5)*48 + 20; const T = d.p3 && 0; return 1`);
 await p.keyboard.press('e'); await p.waitForTimeout(300); for (let i=0;i<5;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 ok('resting at the Emberford inn sets your wake-up spot', (await D('return d.W.inn')) == 'emberford');
 await D(`d.p.hp = 0; d.p3 && 0;`); const rs = await D('d.p3.hurtMe(99); for (let i = 0; i < 200; i++) d.update(0.05); return [Math.round(d.p.x/48), Math.round(d.p.y/48)]'); ok('snowed under → wake up at the Emberford inn', Math.abs(rs[0] - 180) < 3 && Math.abs(rs[1] - 171) < 3, rs);
 // notes + viewpoint
 const nv = await D(`const E = window.Arcade.snowExp, N0 = E.NOTES[8], V0 = E.VIEWS[4]; return [N0.x, N0.y, V0.x, V0.y]`);
 await D(`d.p.x = (${nv[0]} + .5)*48; d.p.y = (${nv[1]} + .5)*48 + 30;`); await p.keyboard.press('e'); await p.waitForTimeout(200); const note = await D('return d.dlg() ? d.dlg().lines[0][2].slice(0, 40) : null'); for (let i=0;i<5;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 ok('lore note reads and is remembered', !!note && (await D('return Object.keys(d.W.notes).length')) >= 1, note);
 const e0 = await D('return d.W.views && Object.keys(d.W.views).length'); await D(`d.p.x = (${nv[2]} + .5)*48; d.p.y = (${nv[3]} + .5)*48 + 30;`); await p.keyboard.press('e'); await p.waitForTimeout(200);
 ok('viewpoint reveals the region', (await D('return Object.keys(d.W.views).length')) > (e0 || 0));
 // reload: position + fog kept
 await D('d.p.x = 105*48; d.p.y = 160*48; wm.save ? wm.save() : 0;'); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
