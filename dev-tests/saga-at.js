const L = require('./lib.js');
(async()=>{ const {b,p,errs,D,world} = await L.start(); await world(); await p.evaluate(()=>{ window.Arcade.immortal = true; });
 const D2 = s => p.evaluate('(()=>{ const wm = window.Arcade._dbg.snow().wm(); const d = wm.dbg(); const SG = d.SG(); const ST = window.Arcade.SAGA.story; '+s+' })()');
 const skip = async () => { for (let i=0;i<40;i++){ if (!(await D2('return !!d.dlg()'))) break; await D2('d.nextLine()'); await p.waitForTimeout(25); } };
 await D2('wm.adm.chapter(6)'); await skip(); await D2('ST.adm.fight(1)'); await skip(); await p.waitForTimeout(800);
 const at = await D2('d.p.y += 0; const P = window.Arcade._dbg.snow().PERM; const SV = P.ow.saga; return SV.at ? [SV.at.id, Math.round(d.p.x), Math.round(d.p.y), SV.at.rx] : null');
 // turn the saved spot into an OLD save (lands beyond at x = 180 tiles, no rx)
 await D2(`const P = window.Arcade._dbg.snow().PERM, SV = P.ow.saga; SV.at = {id:'${at && at[0]}', x:${at && at[1]} - 140*48, y:${at && at[2]}}; window.Arcade._dbg.snow().savePerm ? window.Arcade._dbg.snow().savePerm() : 0;`);
 await p.keyboard.press('Escape'); await p.waitForTimeout(600); await p.reload(); await p.waitForTimeout(5000); await world(); await skip();
 const now = await D2('const SV = window.Arcade._dbg.snow().PERM.ow.saga; return [SG.cur && SG.cur(), Math.round(d.p.x), Math.round(d.p.y)]');
 console.log((now[0] == (at && at[0]) && Math.abs(now[1] - at[1]) < 60 && Math.abs(now[2] - at[2]) < 60 ? 'PASS' : 'FAIL') + ' an old save inside a land beyond reopens in the same spot', {at, now});
 console.log(errs.filter(e => !e.includes('Failed to load')).slice(0, 5)); await b.close(); })();
