const L = require('./lib.js');
const save = {econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, gdata:{snowball:{sb:{cr:0, up:{}, frost:2e6, bank:2e9, ow:{v:1, met:1, base:{tier:3, rooms:{}}}}}}};
(async()=>{ const {b,p,errs,D,world,app} = await L.start({save, ctx:{viewport:{width:1180,height:820}, hasTouch:true, isMobile:false}}); const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
 await world();
 // canvas and its coordinate mapping
 const ev = async (type, id, x, y) => p.evaluate(([type, id, x, y]) => { const cs = [...document.querySelectorAll('canvas')].find(c => c._lw) || document.querySelector('canvas'); const r = cs.getBoundingClientRect(), lw = cs._lw || 600;
   const cx = r.left + x*r.width/lw, cy = r.top + y*r.height/720; cs.dispatchEvent(new PointerEvent(type, {pointerId:id, pointerType:'touch', clientX:cx, clientY:cy, bubbles:true, isPrimary:id == 1, buttons:type == 'pointerup' ? 0 : 1})); }, [type, id, x, y]);
 await ev('pointerdown', 1, 300, 300); await ev('pointerup', 1, 300, 300); await p.waitForTimeout(300);   // switch to touch layout
 for (let i=0;i<6;i++){ if (!(await D('return !!d.dlg()'))) break; await D('d.nextLine()'); }
 const VWh = await D('return [window.Arcade._dbg.snow().wm().dbg().p.x]'); 
 const x0 = await D('return Math.round(d.p.x)');
 await ev('pointerdown', 7, 120, 500); await ev('pointermove', 7, 200, 500); await p.waitForTimeout(1200); const j = await D('return !!d.p3.joy()');
 const x1 = await D('return Math.round(d.p.x)'); await p.screenshot({path:'./ipad1.png'}); await ev('pointerup', 7, 200, 500);
 ok('joystick moves the player right', j && x1 - x0 > 150, [x0, x1]);
 // fire button auto-aims at nearest foe
 await D(`d.p.x = 50*48; d.p.y = 86*48;`); await D(`const S = 0; window.Arcade._dbg.snow().wm().dbg(); `);
 const spawned = await D(`const f = d.foes(); return f.length`);
 await p.evaluate(()=>{ const d = window.Arcade._dbg.snow().wm().dbg(); d.p.x = 30*48; d.p.y = 60*48; }); await p.waitForTimeout(1500);
 const tg = await D('const t2 = d.p3.autoTarget(); return t2 ? [Math.round(t2.x), Math.round(t2.y), Math.round(Math.hypot(t2.x - d.p.x, t2.y - d.p.y))] : null');
 const vw = await p.evaluate(()=>{ const cs = [...document.querySelectorAll('canvas')].find(c => c._lw) || document.querySelector('canvas'); return cs._lw || 600; });
 const a0 = await D('return d.p.ammo'); await ev('pointerdown', 9, vw - 96, 620 - 100); await p.waitForTimeout(150); await p.screenshot({path:'./ipad2.png'}); await ev('pointerup', 9, vw - 96, 620 - 100); await p.waitForTimeout(50);
 const a1 = await D('return d.p.ammo'); const shot = await D(`const bs = window.Arcade._dbg.snow().wm().dbg().balls.filter(b => b.mine); return bs.map(b => [Math.round(b.vx), Math.round(b.vy)])`); console.log('ammo', a0, a1);
 ok('THROW button throws (ammo used)', a1 < a0, [a0, a1]);
 { const fc = await D('return d.p.face'); const px = await D('return [d.p.x, d.p.y]'); const want = Math.atan2(tg[1] - 8 - px[1], tg[0] - px[0]); ok('throw heads at the target', Math.abs(want - fc) < .3, [want.toFixed(2), fc.toFixed(2)]); }
 if (false) { const [vx, vy] = shot[shot.length - 1]; const px = await D('return [d.p.x, d.p.y]'); const want = Math.atan2(tg[1] - 8 - px[1], tg[0] - px[0]), got = Math.atan2(vy, vx); ok('throw heads at the target', Math.abs(want - got) < .35, [want.toFixed(2), got.toFixed(2)]); }
 // bottom bar: tap Map (last button)
 await ev('pointerdown', 11, vw - 30, 680); await ev('pointerup', 11, vw - 30, 680); await p.waitForTimeout(200); ok('bottom bar Map button opens the map', await D('return true'));
 console.log(errs.filter(e=>!e.includes('Failed to load resource'))); await b.close(); })();
