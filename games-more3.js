// Wilderland Arcade · GAMES PACK 3 — Crate Camp, Air Hockey, Carnival Toss, Word Woods, Stream Fixer, Snowball Showdown, Sprout Farm, Critter Cards.
(function(){
const A = window.Arcade, C = A.C, TAU = Math.PI*2;
const rr = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const pt = (c, e, w, h) => { const r = c.getBoundingClientRect(); w = c._lw || w; h = c._lh || h; return {x:(e.clientX-r.left)*w/r.width, y:(e.clientY-r.top)*h/r.height}; };
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const learn2 = (host, api, title, yes, no) => { if (!A.learnOn || !A.learnOn()) { no(); return false; } A.quiz(host, title, ok => { try { api.edu && api.edu(ok); } catch(e){} ok ? yes() : no(); }); return true; };
const keysDown = () => { const k = {}; const d = e => { k[e.key] = true; }, u = e => { k[e.key] = false; if (e.key.length == 1) k[e.key.toLowerCase()] = k[e.key.toUpperCase()] = false; }; const bl = () => { for (const q in k) k[q] = false; }; window.addEventListener('keydown', d); window.addEventListener('keyup', u); window.addEventListener('blur', bl); return {k, off:() => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); window.removeEventListener('blur', bl); }}; };
const shuffle = a => { for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wrap = (g, s, x, y, mw, lh) => { let line = ''; s.split(' ').forEach(wd => { const t = line ? line+' '+wd : wd; if (g.measureText(t).width > mw) { g.fillText(line, x, y); y += lh; line = wd; } else line = t; }); g.fillText(line, x, y); };

// =====================================================================================================
// CRATE CAMP — push every crate onto a target. 12 hand-made levels, undo, fewer moves = more points.
// =====================================================================================================
A.register('sokoban', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 480, 520); c.style.touchAction = 'none';
  // # wall  . target  $ crate  * crate on target  @ player  + player on target
  // Every level is checked with a Sokoban solver (same number of crates and goals, no crate starts stuck, a solution exists).
  const LV = [
    ['#####','#@$.#','#####'],
    ['######','#@ $.#','#  $.#','######'],
    ['  ###  ','  #.#  ','###$###','#.$@$.#','###$###','  #.#  ','  ###  '],
    ['#######','#.   .#','# $$$ #','#  @  #','#  .  #','#######'],
    ['########','#   #  #','# $   .#','#  $@#.#','# ##   #','#      #','########'],
    [' ##### ','##   ##','# $$  #','# $@$ #','#.....#','## $ ##',' #   # ',' ##### '],   // level 6: 5 crates for 5 goals; the bottom crate can be pushed up from below
    ['#######','#.    #','#.$ $ #','## # ##','#  $@ #','#.    #','#######'],
    ['  #####','###   #','#.@$  #','### $.#','#.##$ #','# # . ##','#$ *$$.#','#   .  #','########'],
    ['########','#  ....#','# $$$$ #','#   @  #','########'],
    ['  ####  ','  #..#  ',' ## .## ',' #  $.# ','## $  ##','#  #$$ #','#  @   #','########'],
    ['#########','#   #   #','# $ . $ #','#  .@.  #','# $ . $ #','#   #   #','#########'],
    ['##########','#    #   #','# $$ # . #','#  $   . #','## @ $ . #','#  ### . #','#        #','##########'],
  ];
  let lvl = 0, map, P, moves, hist, score = 0, solved = 0, st = 'ready', t = 0, swipe = null, quizUsed = false;
  const load = () => { if (__skip) { __skip = false; return; } try { if (typeof hints != 'undefined' && hints) hints.reset(); } catch(e){} map = LV[lvl].map(r => r.padEnd(Math.max(...LV[lvl].map(x => x.length)), ' ').split('')); moves = 0; hist = []; quizUsed = false;
    map.forEach((row, y) => row.forEach((ch, x) => { if (ch == '@' || ch == '+') { P = {x, y}; row[x] = ch == '+' ? '.' : ' '; } })); };
  const isCrate = ch => ch == '$' || ch == '*', isTgt = ch => ch == '.' || ch == '*';
  const move = (dx, dy) => { if (st != 'play') return; let pushed = false; const nx = P.x+dx, ny = P.y+dy, ch = map[ny][nx]; if (ch == '#') return;
    if (isCrate(ch)) { const bx = nx+dx, by = ny+dy, bc = map[by][bx]; if (bc == '#' || isCrate(bc)) return; hist.push({P:{...P}, m:map.map(r => r.slice())}); map[by][bx] = bc == '.' ? '*' : '$'; map[ny][nx] = ch == '*' ? '.' : ' '; A.tone(220,.05,'square',.04);  pushed = true; }
    else hist.push({P:{...P}, m:map.map(r => r.slice())});
    P.x = nx; P.y = ny; moves++; A.sfx('step');
    if (pushed && !hintBusy) { try { if (solveFrom(map, P, 1).dead) { hintMsg = '⚠ That crate is stuck now · press Undo (Z) or ask for a Hint'; hintT = 3.5; A.sfx('bad'); } } catch(e){} }
    if (!map.some(r => r.includes('$'))) { const par = LV[lvl].join('').split('').filter(c2 => c2 == '$' || c2 == '*').length * 8 + 6; const gain = Math.max(50, 300 + (par - moves)*10) * (1 + lvl*.25);
      score += Math.round(gain); solved++; api.score(score); A.sfx('win'); try { const gd = api.gdata ? api.gdata() : {}; if (lvl+2 > (gd.unlocked||1)) api.setGdata && api.setGdata({unlocked: Math.min(LV.length, lvl+2)}); } catch(e){} if (A.learnOn && A.learnOn()) learn2(host, api, 'LEVEL DONE! BONUS QUESTION FOR +150', () => { score += 150; api.score(score); }, () => {}); stat(api,'sokoLevel',lvl+1,'max'); lvl++; if (lvl >= LV.length) { st = 'over'; api.over(score); } else setTimeout(load, 500); } };
  // ---- hints: a real solver works out the best next push from wherever you are, then walks you there and does it ----
  const solveFrom = (m, p0, limit) => { const Hh = m.length, Ww = m[0].length, D4 = [[1,0],[-1,0],[0,1],[0,-1]];
    const wall = new Uint8Array(Ww*Hh), goal = new Uint8Array(Ww*Hh), boxes0 = [];
    m.forEach((row, y) => row.forEach((ch, x) => { const i = y*Ww + x; if (ch == '#') wall[i] = 1; if (ch == '.' || ch == '*') goal[i] = 1; if (ch == '$' || ch == '*') boxes0.push(i); }));
    const floor = new Uint8Array(Ww*Hh), q0 = [p0.y*Ww + p0.x]; floor[q0[0]] = 1;
    while (q0.length) { const cc = q0.pop(), x = cc % Ww, y = (cc - x) / Ww; for (const [dx, dy] of D4) { const nx = x+dx, ny = y+dy; if (nx < 0 || ny < 0 || nx >= Ww || ny >= Hh) continue; const n = ny*Ww + nx; if (!wall[n] && !floor[n]) { floor[n] = 1; q0.push(n); } } }
    const live = new Uint8Array(Ww*Hh), ql = []; for (let i = 0; i < Ww*Hh; i++) if (goal[i] && floor[i]) { live[i] = 1; ql.push(i); }
    while (ql.length) { const cc = ql.pop(), x = cc % Ww, y = (cc - x) / Ww; for (const [dx, dy] of D4) { const bx = x+dx, by = y+dy, px = x+2*dx, py = y+2*dy; if (px < 0 || py < 0 || px >= Ww || py >= Hh) continue; const b = by*Ww + bx, pp = py*Ww + px; if (floor[b] && floor[pp] && !live[b]) { live[b] = 1; ql.push(b); } } }
    if (boxes0.some(b => !live[b] && !goal[b])) return {dead:true};
    const reach = (p, bs) => { const set = new Set(bs), seen = new Uint8Array(Ww*Hh), st2 = [p]; seen[p] = 1; let mn = p;
      while (st2.length) { const cc = st2.pop(), x = cc % Ww, y = (cc - x) / Ww; if (cc < mn) mn = cc; for (const [dx, dy] of D4) { const n = (y+dy)*Ww + x+dx; if (floor[n] && !seen[n] && !set.has(n)) { seen[n] = 1; st2.push(n); } } } return {seen, mn}; };
    const done = bs => bs.every(b => goal[b]);
    const start = {bs:boxes0.slice().sort((a, b) => a - b), p:p0.y*Ww + p0.x, par:null, push:null};
    if (done(start.bs)) return {path:[]};
    const key = (bs, mn) => bs.join(',') + '|' + mn, seenK = new Set([key(start.bs, reach(start.p, start.bs).mn)]); let qq = [start], n = 0;
    while (qq.length) { const nq = []; for (const nd of qq) { if (++n > limit) return {limit:true}; const R = reach(nd.p, nd.bs), set = new Set(nd.bs);
        for (const b of nd.bs) { const x = b % Ww, y = (b - x) / Ww; for (const [dx, dy] of D4) { const frm = (y-dy)*Ww + x-dx, to = (y+dy)*Ww + x+dx; if (!R.seen[frm] || !live[to] || set.has(to)) continue;
            const bs = nd.bs.map(v => v == b ? to : v).sort((a1, a2) => a1 - a2), k = key(bs, reach(b, bs).mn); if (seenK.has(k)) continue; seenK.add(k);
            const ch = {bs, p:b, par:nd, push:{bx:x, by:y, dx, dy}}; if (done(bs)) { const path = []; for (let c2 = ch; c2.par; c2 = c2.par) path.unshift(c2.push); return {path}; } nq.push(ch); } } } qq = nq; }
    return {dead:true}; };
  const walkTo = (tx, ty) => { const Hh = map.length, Ww = map[0].length, prev = {}, q = [[P.x, P.y]]; prev[P.x + ',' + P.y] = null;
    while (q.length) { const [x, y] = q.shift(); if (x == tx && y == ty) break; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x+dx, ny = y+dy, kk = nx + ',' + ny; if (kk in prev || ny < 0 || ny >= Hh || nx < 0 || nx >= Ww) continue; const ch = map[ny][nx]; if (ch == '#' || isCrate(ch)) continue; prev[kk] = [x, y, dx, dy]; q.push([nx, ny]); } }
    const steps = []; let kk = tx + ',' + ty; if (!(kk in prev)) return null; while (prev[kk]) { const [x, y, dx, dy] = prev[kk]; steps.unshift([dx, dy]); kk = x + ',' + y; } return steps; };
  let hintBusy = false, hintMsg = '', hintT = 0, hintMark = null;
  const runHint = quiet => { if (st != 'play' || hintBusy) return false;
    let sol = solveFrom(map, P, 250000), undone = 0;
    while (sol.dead && hist.length && undone < 80) { undo(); undone++; sol = solveFrom(map, P, 250000); }
    if (sol.limit) { hintMsg = 'Too tricky to work out from here · try Restart (R)'; hintT = 3; return false; }
    if (sol.dead || !sol.path || !sol.path.length) { hintMsg = sol.dead ? 'Stuck · press Restart (R)' : 'Already solved!'; hintT = 2.5; return false; }
    const pu = sol.path[0], steps = walkTo(pu.bx - pu.dx, pu.by - pu.dy); if (!steps) return false; steps.push([pu.dx, pu.dy]);
    hintMsg = (undone ? 'Dead end! Undid ' + undone + ' move' + (undone == 1 ? '' : 's') + ' · ' : '') + 'Push the glowing crate ' + ({'1,0':'right','-1,0':'left','0,1':'down','0,-1':'up'})[pu.dx + ',' + pu.dy] + ' · ' + sol.path.length + ' push' + (sol.path.length == 1 ? '' : 'es') + ' to go';
    hintT = 4.5; hintMark = {x:pu.bx, y:pu.by, dx:pu.dx, dy:pu.dy}; hintBusy = true; let i = 0;
    const iv = setInterval(() => { if (st != 'play' || i >= steps.length) { clearInterval(iv); hintBusy = false; hintMark = null; return; } move(...steps[i++]); }, quiet ? 60 : 140); return true; };
  const hints = A.hinter(api, q => runHint(q), A.D(8, 5, 3));
  const startLvl = () => { let u = 1; try { u = (api.gdata ? api.gdata().unlocked : 1) || 1; } catch(e){} return Math.max(0, Math.min(LV.length, u) - 1); };
  const undo = () => { const hh = hist.pop(); if (hh) { P = hh.P; map = hh.m; moves++; } };
  const offK = A.keys(e => { if (e.type != 'keydown') return; const m = {ArrowLeft:[-1,0], a:[-1,0], ArrowRight:[1,0], d:[1,0], ArrowUp:[0,-1], w:[0,-1], ArrowDown:[0,1], s:[0,1]}[e.key];
    if (st != 'play' && e.key == '1') { __skip = false; lvl = 0; score = 0; solved = 0; st = 'play'; load(); api.score(0); return; }
    if (st != 'play' && (e.key == ' ' || e.key == 'Enter')) { if (!__skip) { lvl = startLvl(); score = 0; solved = 0; } st = 'play'; load(); api.score(score); return; } if (m) move(...m); if (e.key == 'z' || e.key == 'u' || e.key == 'Backspace') undo(); if (e.key == 'r') load(); if (e.key == 'n' && st == 'play') { st = 'over'; api.over(score); } });
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h); if (st != 'play') { if (!__skip) { lvl = startLvl(); score = 0; solved = 0; } st = 'play'; load(); api.score(score); return; }
    if (q.y > h - 48) { if (q.x < w/3) undo(); else if (q.x < 2*w/3) load(); else { st = 'over'; api.over(score); } return; } swipe = q; });
  c.addEventListener('pointerup', e => { if (!swipe) return; const q = pt(c, e, w, h), dx = q.x - swipe.x, dy = q.y - swipe.y; swipe = null;
    if (Math.hypot(dx, dy) < 15) { const S = cellSize(), ox = (w - map[0].length*S)/2, oy = 50, tx = (q.x - ox)/S - .5 - P.x, ty = (q.y - oy)/S - .5 - P.y; if (Math.abs(tx) > Math.abs(ty)) move(Math.sign(tx), 0); else move(0, Math.sign(ty)); }
    else if (Math.abs(dx) > Math.abs(dy)) move(Math.sign(dx), 0); else move(0, Math.sign(dy)); });
  const cellSize = () => Math.min(44, Math.floor((w-20) / map[0].length), Math.floor((h-110) / map.length));
  const offL = A.loop(dt => { t += dt;
    g.fillStyle = '#2a3a2a'; g.fillRect(0,0,w,h);
    if (map) { const S = cellSize(), ox = (w - map[0].length*S)/2, oy = 50;
      map.forEach((row, y) => row.forEach((ch, x) => { const X = ox + x*S, Y = oy + y*S; if (ch == '#') { g.fillStyle = '#6e6a5e'; rr(g, X+1, Y+1, S-2, S-2, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(X+4, Y+3, S-8, 4); return; }
        if (ch == ' ' && !inside(x, y)) return; g.fillStyle = '#c8b078'; g.fillRect(X, Y, S, S); g.strokeStyle = 'rgba(0,0,0,.08)'; g.strokeRect(X, Y, S, S);
        if (isTgt(ch)) { g.strokeStyle = '#FF4539'; g.lineWidth = 3; g.beginPath(); g.arc(X+S/2, Y+S/2, S*.25, 0, TAU); g.stroke(); }
        if (isCrate(ch)) { g.fillStyle = ch == '*' ? '#00B451' : '#8D5B1D'; rr(g, X+4, Y+4, S-8, S-8, 5); g.fill(); g.strokeStyle = ch == '*' ? '#D5F367' : '#c8964a'; g.lineWidth = 2; g.beginPath(); g.moveTo(X+8, Y+8); g.lineTo(X+S-8, Y+S-8); g.moveTo(X+S-8, Y+8); g.lineTo(X+8, Y+S-8); g.stroke(); } }));
      const X = ox + P.x*S, Y = oy + P.y*S; g.fillStyle = '#DD8B03'; g.beginPath(); g.arc(X+S/2, Y+S/2, S*.36, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(X+S*.4, Y+S*.42, S*.08, 0, TAU); g.arc(X+S*.6, Y+S*.42, S*.08, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(X+S*.4, Y+S*.44, S*.04, 0, TAU); g.arc(X+S*.6, Y+S*.44, S*.04, 0, TAU); g.fill(); }
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Level '+(lvl+1)+'/'+LV.length+'   Moves '+(moves||0), 12, 26); g.textAlign = 'right'; g.fillText(A.fmt(score||0), w-12, 26);
    ['↶ Undo (Z)','⟲ Restart (R)','🏁 Finish & cash in'].forEach((tx, i) => { g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, 8 + i*w/3, h-42, w/3-16, 34, 10); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText(tx, i*w/3 + w/6, h-20); });
    if (hintMark && map) { const S = cellSize(), ox = (w - map[0].length*S)/2, oy = 50, X = ox + hintMark.x*S + S/2, Y = oy + hintMark.y*S + S/2; g.strokeStyle = '#F9BF01'; g.lineWidth = 4; g.strokeRect(X - S/2 + 2, Y - S/2 + 2, S - 4, S - 4);
      g.fillStyle = '#F9BF01'; g.beginPath(); const ax = X + hintMark.dx*S*.75, ay = Y + hintMark.dy*S*.75; g.moveTo(ax + hintMark.dx*10, ay + hintMark.dy*10); g.lineTo(ax - hintMark.dy*9, ay + hintMark.dx*9); g.lineTo(ax + hintMark.dy*9, ay - hintMark.dx*9); g.fill(); }
    if (hintT > 0) { hintT -= 1/60; g.fillStyle = 'rgba(0,0,0,.75)'; rr(g, 10, h - 84, w - 20, 34, 10); g.fill(); g.fillStyle = '#F9BF01'; g.textAlign = 'center'; let fs = 14; do { g.font = '700 ' + fs + 'px '+A.font; fs--; } while (fs > 9 && g.measureText(hintMsg).width > w - 36); g.fillText(hintMsg, w/2, h - 62); }
    if (st == 'ready') A.overlayText(g, w, h, 'CRATE CAMP', __skip ? 'Saved game · tap or press Space to continue' : (startLvl() > 0 ? 'Tap to continue from level '+(startLvl()+1)+' · press 1 to start at level 1' : 'Push every crate onto a red circle · arrows / WASD or swipe · tap to start'));
    if (st == 'over') A.overlayText(g, w, h, solved >= LV.length ? 'ALL CRATES CAMPED!' : 'NICE PUSHING', A.fmt(score||0)+' points · '+solved+' levels · tap to play again'); });
  const inside = (x, y) => { let l = false, r2 = false; for (let i = 0; i < x; i++) if (map[y][i] == '#') l = true; for (let i = x+1; i < map[y].length; i++) if (map[y][i] == '#') r2 = true; return l && r2; };
  load(); A._dbg = A._dbg || {}; A._dbg.crate = { s: () => ({st, lvl, moves, left: map ? map.flat().filter(c2 => c2 == '$').length : -1, busy: hintBusy, msg: hintMsg}), hint: () => runHint(false), solve: () => solveFrom(map, P, 250000), go: n => { lvl = n; st = 'play'; load(); }, move: (dx, dy) => move(dx, dy) };
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play') ? {v:1, lvl, score, solved, map, P, moves} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({lvl, score, solved, map, P, moves} = R0); hist = []; api.score(score); { const f = map.flat(), cr = f.filter(c2 => c2 == '$' || c2 == '*').length, tg = f.filter(c2 => c2 == '.' || c2 == '*').length; if (cr != tg || !LV[lvl]) { lvl = Math.min(lvl, LV.length-1); load(); } } __skip = true; st = 'ready'; } catch(e) { console.error('[save] sokoban resume failed', e); } } }
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// AIR HOCKEY — first to 7 against the computer.
// =====================================================================================================
A.register('airhockey', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 400, 600); c.style.touchAction = 'none';
  const K = keysDown(), GOAL = 120; let st = 'ready', me, ai, puck, sMe, sAi, t = 0, quiz = false, ptr = null, serveT = 0, rally = 0, score = 0;
  const reset = () => { if (__skip) { __skip = false; return; } me = {x:w/2, y:h-80, r:28, px:w/2, py:h-80}; ai = {x:w/2, y:80, r:28}; sMe = 0; sAi = 0; score = 0; serve(1); api.score(0); };
  const serve = toMe => { puck = {x:w/2, y:h/2 + (toMe ? 40 : -40), vx:0, vy:0, r:16}; serveT = .6; rally = 0; };
  const goal = mine => { if (mine) { sMe++; score += 100 + rally*10; api.score(score); A.sfx('win'); } else { A.sfx('bad');
      if (A.learnOn && A.learnOn()) { quiz = true; learn2(host, api, 'GOAL AGAINST YOU! ANSWER TO BLOCK IT', () => { quiz = false; serve(true); }, () => { quiz = false; sAi++; check(); serve(true); }); return; } sAi++; }
    check(); serve(!mine); };
  const check = () => { const to = 7; if (sMe >= to || sAi >= to) { st = 'over'; if (sMe > sAi) { score += 1000; stat(api,'hockeyWins',1,'add'); } api.score(score); A.sfx(sMe > sAi ? 'win' : 'over'); api.over(score); } };
  const offK = A.keys(e => { if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; } });
  // The mallet follows the mouse while it's over the table, or a finger while it's touching. When you let go it stays put
  // (it used to slide back to the last spot the pointer had been).
  let ptrDown = false, stuckT = 0, pinT = 0, idleT = 0;
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } ptrDown = true; ptr = pt(c, e, w, h); try { c.setPointerCapture(e.pointerId); } catch(_){} });
  c.addEventListener('pointermove', e => { if (e.pointerType == 'mouse' || ptrDown) ptr = pt(c, e, w, h); });
  const ptrEnd = e => { ptrDown = false; if (e.pointerType != 'mouse' || e.type == 'pointerleave') ptr = null; };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(k => c.addEventListener(k, ptrEnd));
  const walls = () => { let hit = false; const inGoal = Math.abs(puck.x - w/2) < GOAL/2;
    if (puck.x < puck.r) { puck.x = puck.r; puck.vx = Math.abs(puck.vx); hit = true; } if (puck.x > w - puck.r) { puck.x = w - puck.r; puck.vx = -Math.abs(puck.vx); hit = true; }
    if (!inGoal) { if (puck.y < puck.r) { puck.y = puck.r; puck.vy = Math.abs(puck.vy); hit = true; } if (puck.y > h - puck.r) { puck.y = h - puck.r; puck.vy = -Math.abs(puck.vy); hit = true; } }
    return hit; };
  const offL = A.loop(dt => { t += dt; dt = Math.min(dt, .033);
    if (st == 'play' && !quiz) { const sx = me.x, sy = me.y; const kx = (K.k.ArrowRight||K.k.d ? 1 : 0) - (K.k.ArrowLeft||K.k.a ? 1 : 0), ky = (K.k.ArrowDown||K.k.s ? 1 : 0) - (K.k.ArrowUp||K.k.w ? 1 : 0);
      me.r = 28 + 3*A.U('mallet'); let tx0 = me.x, ty0 = me.y;
      if (kx || ky) { ptr = null; tx0 += kx*420*dt; ty0 += ky*420*dt; } else if (ptr) { tx0 += (ptr.x - me.x) * Math.min(1, dt*18); ty0 += (ptr.y - me.y) * Math.min(1, dt*18); }
      { const mdx = tx0 - me.x, mdy = ty0 - me.y, md = Math.hypot(mdx, mdy), cap = 1500*dt; if (md > cap) { tx0 = me.x + mdx/md*cap; ty0 = me.y + mdy/md*cap; } }
      tx0 = clamp(tx0, me.r, w - me.r); ty0 = clamp(ty0, h/2 + me.r, h - me.r);
      // AI: hits the puck from the goal side; backs off instead of pinning it against the wall
      const aiSp = A.D(240, 330, 430) * (1 - .06*A.U('slowai')); let tx = puck.y < h/2 + 60 ? puck.x : w/2, ty = puck.y < h/2 ? Math.min(puck.y - 20, h/2 - ai.r) : 80;
      if (puck.y < ai.r*2 + puck.r + 6) { tx = puck.x + (puck.x < w/2 ? 1 : -1) * (ai.r + puck.r + 14); ty = Math.min(h/2 - ai.r, puck.y + ai.r + puck.r + 30); }
      const adx = tx - ai.x, ady = ty - ai.y, ad = Math.hypot(adx, ady) || 1, amv = Math.min(ad, aiSp*dt);
      const ax1 = clamp(ai.x + adx/ad*amv, ai.r, w - ai.r), ay1 = clamp(ai.y + ady/ad*amv, ai.r, h/2 - ai.r);
      const mvx = (tx0 - sx)/dt, mvy = (ty0 - sy)/dt, avx = (ax1 - ai.x)/dt, avy = (ay1 - ai.y)/dt, ax0 = ai.x, ay0 = ai.y;
      if (serveT > 0) serveT -= dt;
      // small steps so a fast puck or a fast swipe can't pass through a mallet
      const pv = Math.hypot(puck.vx, puck.vy)*dt, mm = Math.max(Math.hypot(tx0 - sx, ty0 - sy), Math.hypot(ax1 - ax0, ay1 - ay0));
      const N = Math.min(12, Math.max(1, Math.ceil(Math.max(pv, mm) / 8))), sdt = dt / N; let tick = false;
      for (let i = 1; i <= N; i++) { const f = i / N; me.x = sx + (tx0 - sx)*f; me.y = sy + (ty0 - sy)*f; ai.x = ax0 + (ax1 - ax0)*f; ai.y = ay0 + (ay1 - ay0)*f;
        if (serveT <= 0) { puck.x += puck.vx*sdt; puck.y += puck.vy*sdt; }
        if (walls()) tick = true;
        for (const [m, vx, vy] of [[me, mvx, mvy], [ai, avx, avy]]) { const ddx = puck.x - m.x, ddy = puck.y - m.y, dd = Math.hypot(ddx, ddy); if (dd < m.r + puck.r) { const nx = dd > 0 ? ddx/dd : 0, ny = dd > 0 ? ddy/dd : (m === me ? -1 : 1);
            puck.x = m.x + nx*(m.r + puck.r); puck.y = m.y + ny*(m.r + puck.r);
            const rv = (puck.vx - vx)*nx + (puck.vy - vy)*ny; if (rv < 0) { puck.vx -= 1.9*rv*nx; puck.vy -= 1.9*rv*ny; } const sp = Math.hypot(puck.vx, puck.vy), mx = 1100; if (sp > mx) { puck.vx *= mx/sp; puck.vy *= mx/sp; }
            // squeezed against a wall: the puck stays on the table and squirts out sideways instead of jittering
            if (walls()) { pinT += sdt; const ox = puck.x - m.x, oy = puck.y - m.y, od = Math.hypot(ox, oy) || 1; if (od < m.r + puck.r - .5) { const side = puck.x < w/2 ? 1 : -1; puck.vx += side*260; puck.vy += (puck.y < h/2 ? 1 : -1)*120; m.x -= ox/od*((m.r + puck.r) - od); m.y -= oy/od*((m.r + puck.r) - od); } }
            if (m.hitT == null || t - m.hitT > .08) { rally++; A.tone(500,.03,'square',.04); } m.hitT = t; } } }
      if (tick) A.tone(300,.03,'square',.03);
      me.x = clamp(me.x, me.r, w - me.r); me.y = clamp(me.y, h/2 + me.r, h - me.r); ai.x = clamp(ai.x, ai.r, w - ai.r); ai.y = clamp(ai.y, ai.r, h/2 - ai.r);
      puck.vx *= Math.pow(.6, dt); puck.vy *= Math.pow(.6, dt);
      // never let the puck sit still in a corner or against an end wall
      const nearX = puck.x < puck.r + 40 || puck.x > w - puck.r - 40, nearY = puck.y < puck.r + 40 || puck.y > h - puck.r - 40, slow = Math.hypot(puck.vx, puck.vy) < 60;
      if (serveT <= 0 && (nearY || pinT > .25) && slow) stuckT += dt; else stuckT = 0;
      if (serveT <= 0 && Math.hypot(puck.vx, puck.vy) < 25) idleT += dt; else idleT = 0;
      if (stuckT > (nearX ? .8 : 1.2) || pinT > .6 || idleT > 3) { idleT = 0; const dx2 = w/2 - puck.x, dy2 = h/2 - puck.y, d2 = Math.hypot(dx2, dy2) || 1; puck.vx = dx2/d2*260; puck.vy = dy2/d2*260; stuckT = 0; pinT = 0; }
      if (pinT > 0) pinT = Math.max(0, pinT - dt*.5);
      if (puck.y < -puck.r) goal(true); else if (puck.y > h + puck.r) goal(false); }
    g.fillStyle = '#e8f4ff'; g.fillRect(0,0,w,h); g.strokeStyle = '#ff6a6a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h/2); g.lineTo(w, h/2); g.stroke(); g.beginPath(); g.arc(w/2, h/2, 50, 0, TAU); g.stroke();
    g.strokeStyle = '#64CDF5'; g.beginPath(); g.arc(w/2, 0, 80, 0, Math.PI); g.stroke(); g.beginPath(); g.arc(w/2, h, 80, Math.PI, TAU); g.stroke();
    g.fillStyle = '#121313'; g.fillRect(w/2 - GOAL/2, 0, GOAL, 6); g.fillRect(w/2 - GOAL/2, h-6, GOAL, 6);
    if (puck) { g.fillStyle = '#121313'; g.beginPath(); g.arc(puck.x, puck.y, puck.r, 0, TAU); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.arc(puck.x, puck.y, puck.r - 5, 0, TAU); g.stroke(); }
    for (const [m, col] of [[me, '#00B451'], [ai, '#FF4539']]) { if (!m) continue; g.fillStyle = col; g.beginPath(); g.arc(m.x, m.y, m.r, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(m.x, m.y, m.r*.5, 0, TAU); g.fill(); }
    g.fillStyle = '#121313'; g.font = '800 40px '+A.font; g.textAlign = 'right'; g.globalAlpha = .25; g.fillText(String(sAi||0), w - 16, h/2 - 14); g.fillText(String(sMe||0), w - 16, h/2 + 46); g.globalAlpha = 1;
    g.font = '700 14px '+A.font; g.textAlign = 'left'; g.fillText(A.fmt(score||0)+' pts · first to 7', 10, h/2 - 8);
    if (st == 'ready') A.overlayText(g, w, h, 'AIR HOCKEY', __skip ? 'Saved game · tap or press Space to continue' : 'Move your green mallet with the mouse, a finger or WASD · first to 7');
    if (st == 'over') A.overlayText(g, w, h, sMe > sAi ? 'YOU WIN!' : 'CPU WINS', sMe+' – '+sAi+' · '+A.fmt(score)+' points · tap for a rematch'); });
  reset(); st = 'ready'; A._dbg = A._dbg || {}; A._dbg.hockey = { s: () => ({st, me, ai, puck, sMe, sAi}), start: () => { reset(); st = 'play'; } };
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, sMe, sAi, score} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({sMe, sAi, score} = R0); me = {x:w/2, y:h-80, r:28, px:w/2, py:h-80}; ai = {x:w/2, y:80, r:28}; serve(true); api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] airhockey resume failed', e); } } }
  return () => { offK(); offL(); K.off(); };
}});

// =====================================================================================================
// CARNIVAL TOSS — skee-ball. Aim with the moving arrow, set power, and roll into the scoring rings.
// =====================================================================================================
A.register('skeeball', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 420, 600); c.style.touchAction = 'none';
  const RINGS = [{x:210, y:120, r:22, pts:100}, {x:90, y:120, r:20, pts:100}, {x:330, y:120, r:20, pts:100}, {x:210, y:190, r:28, pts:50}, {x:210, y:250, r:38, pts:40}, {x:210, y:300, r:50, pts:30}, {x:210, y:345, r:64, pts:20}, {x:210, y:385, r:80, pts:10}];
  let st = 'ready', phase = 'aim', ang = 0, adir = 1, pow = 0, pdir = 1, ball = null, balls, score, t = 0, last = '', lastT = 0, rnd = 0, quiz = false;
  const reset = () => { if (__skip) { __skip = false; return; } balls = 9 + A.U('balls'); score = 0; phase = 'aim'; rnd++; api.score(0); };
  const press = () => { if (st != 'play') { reset(); st = 'play'; return; } if (quiz) return;
    if (phase == 'aim') phase = 'power'; else if (phase == 'power') { const sp = launchSpeed(pow); ball = {x:210, y:560, vx:Math.sin(ang)*sp*.35, vy:-sp, r:12, z:0}; phase = 'roll'; A.tone(200,.2,'triangle',.05); } };
  // stopping distance grows evenly with power (decel 260 px/s², ball scores when it slows to 40 px/s)
  const GRAV = 260, stopDist = pw => 150 + pw*340, launchSpeed = pw => Math.sqrt(2*GRAV*stopDist(pw) + 40*40);
  const ringScale = () => A.D(1.3, 1.15, 1);
  const landing = (pw, a) => { const sp = launchSpeed(pw), t2 = (sp - 40)/GRAV; let x = 210 + Math.sin(a)*sp*.35*t2*Math.pow(.2, Math.max(0, t2 - 0.4)*0); return {x: Math.max(30, Math.min(390, x)), y: 560 - stopDist(pw)}; };
  const offK = A.keys(e => { if (e.type == 'keydown' && (e.key == ' ' || e.key == 'Enter')) press(); });
  c.addEventListener('pointerdown', press);
  const scoreBall = () => { let got = 0; for (const R of RINGS) if (Math.hypot(ball.x - R.x, ball.y - R.y) < R.r*ringScale() - 4) { got = Math.max(got, R.pts); }
    score += got; api.score(score); last = got ? '+'+got : 'Gutter!'; lastT = 1.2; A.sfx(got >= 50 ? 'win' : got ? 'coin' : 'bad'); balls--; ball = null; phase = 'aim'; pow = 0;
    if (balls <= 0) { quiz = learn2(host, api, 'OUT OF BALLS · ANSWER FOR ONE BONUS BALL', () => { quiz = false; balls = 1; }, () => { quiz = false; st = 'over'; stat(api,'skeeBest',score,'max'); api.over(score); }); } };
  const offL = A.loop(dt => { t += dt; lastT = Math.max(0, lastT - dt);
    if (st == 'play' && !quiz) { const aimSp = A.D(.7, .9, 1.25) * (1 - .08*A.U('steady'));
      if (phase == 'aim') { ang += adir*aimSp*dt; if (Math.abs(ang) > .5) { ang = Math.sign(ang)*.5; adir *= -1; } }
      if (phase == 'power') { pow += pdir*aimSp*.7*dt; if (pow > 1) { pow = 1; pdir = -1; } if (pow < 0) { pow = 0; pdir = 1; } }
      if (phase == 'roll' && ball) { ball.x += ball.vx*dt; ball.y += ball.vy*dt; ball.vy += GRAV*dt; if (ball.x < 30 || ball.x > 390) ball.vx *= -1;
        if (ball.vy > -40 || ball.y < 70) scoreBall(); } }
    const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#4a1a3a'); gr.addColorStop(1,'#8a3a2a'); g.fillStyle = gr; g.fillRect(0,0,w,h);
    g.fillStyle = '#c8964a'; g.beginPath(); g.moveTo(130, 600); g.lineTo(150, 430); g.lineTo(270, 430); g.lineTo(290, 600); g.fill(); g.strokeStyle = '#8D5B1D'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(150 + i*24, 430); g.lineTo(130 + i*32, 600); g.stroke(); }
    g.fillStyle = '#2a1a2a'; rr(g, 20, 60, 380, 370, 20); g.fill();
    for (let i = RINGS.length-1; i >= 0; i--) { const R = RINGS[i]; g.fillStyle = i < 3 ? '#F9BF01' : i % 2 ? '#3a2a3a' : '#5a3a5a'; g.beginPath(); g.arc(R.x, R.y, R.r*ringScale(), 0, TAU); g.fill(); g.strokeStyle = '#ff8fd0'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(String(R.pts), R.x, R.y - R.r*ringScale() + 14 + (i < 3 ? 6 : 0)); }
    for (let i = 0; i < 12; i++) { g.fillStyle = Math.floor(t*4 + i) % 3 == 0 ? '#ffe14f' : '#aa7a3a'; g.beginPath(); g.arc(30 + i*33, 48, 5, 0, TAU); g.fill(); }
    if (st == 'play' && phase != 'roll' && A.diff == 'easy') { const L2 = landing(phase == 'aim' ? .5 : pow, ang); g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([5,7]); g.lineWidth = 2; g.beginPath(); g.moveTo(210, 545); g.lineTo(L2.x, L2.y); g.stroke(); g.setLineDash([]); g.strokeStyle = 'rgba(213,243,103,.8)'; g.beginPath(); g.arc(L2.x, L2.y, 10, 0, TAU); g.stroke(); }
    if (st == 'play' && phase != 'roll') { g.save(); g.translate(210, 560); g.rotate(ang); g.fillStyle = '#D5F367'; g.beginPath(); g.moveTo(0, -70); g.lineTo(-10, -50); g.lineTo(10, -50); g.fill(); g.fillRect(-3, -50, 6, 40); g.restore();
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 340, 450, 22, 130, 10); g.fill(); g.fillStyle = pow > .85 ? '#FF4539' : '#D5F367'; rr(g, 340, 450 + 130*(1-pow), 22, 130*pow, 10); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText(phase == 'aim' ? 'TAP to lock aim' : 'TAP to roll!', 210, 595); }
    if (ball) { const s = clamp((ball.y - 60)/500, .45, 1); g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, ball.r*s, 0, TAU); g.fill(); g.fillStyle = '#FF4539'; g.beginPath(); g.arc(ball.x - 3*s, ball.y - 3*s, ball.r*s*.4, 0, TAU); g.fill(); }
    g.fillStyle = '#fff'; g.font = '700 18px '+A.font; g.textAlign = 'left'; g.fillText((score||0)+' pts', 14, 26); g.textAlign = 'right'; g.fillText('Balls '+(balls||0), w-14, 26);
    if (lastT > 0) { g.fillStyle = last == 'Gutter!' ? '#ffb3ab' : '#F9BF01'; g.font = '800 34px '+A.font; g.textAlign = 'center'; g.fillText(last, w/2, 470); }
    if (st == 'ready') A.overlayText(g, w, h, 'CARNIVAL TOSS', __skip ? 'Saved game · tap or press Space to continue' : 'Tap once to lock the aim, again to set the power · 9 balls');
    if (st == 'over') A.overlayText(g, w, h, 'NICE ROLLING', score+' points · tap to play again'); });
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, balls, score} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({balls, score} = R0); phase = 'aim'; ball = null; api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] skeeball resume failed', e); } } }
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// WORD WOODS — word search. Drag across letters to find the hidden nature words before time runs out.
// =====================================================================================================
A.register('words', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 460, 580); c.style.touchAction = 'none';
  const BANK = ['FOX','OWL','BEAR','DEER','MOOSE','TROUT','EAGLE','HAWK','PINE','ASPEN','RIVER','LAKE','STONE','MOSS','FERN','ACORN','CEDAR','CLOUD','STORM','RAIN','SNOW','FROG','TOAD','WOLF','ELK','BISON','OTTER','BEAVER','MAPLE','BIRCH','PEAK','TRAIL','CAMP','TENT','STAR','MOON','COMET','ROBIN','WREN','HERON','SAGE','CACTUS','LIZARD','SNAKE','BADGER','SKUNK','RACCOON','CANYON','MEADOW','GLACIER','BOULDER','CRYSTAL','SPRUCE','LUPINE','COYOTE','MARMOT','PIKA','FALCON','SALMON','BEETLE','SPIDER','MAGPIE'];
  let st = 'ready', N, grid, words, found, sel = null, score, round, timeLeft, t = 0, flash = [], quiz = false;
  const DIRS = () => A.D([[1,0],[0,1]], [[1,0],[0,1],[1,1]], [[1,0],[0,1],[1,1],[-1,0],[0,-1],[1,-1]]);
  const make = () => { N = A.D(8,9,10); const count = A.D(5,6,8); grid = Array.from({length:N}, () => Array(N).fill('')); words = []; found = [];
    const pool = shuffle(BANK.filter(x => x.length <= N)); for (const wd of pool) { if (words.length >= count) break; for (let tries = 0; tries < 80; tries++) { const [dx, dy] = DIRS()[Math.floor(Math.random()*DIRS().length)], x0 = Math.floor(Math.random()*N), y0 = Math.floor(Math.random()*N), x1 = x0 + dx*(wd.length-1), y1 = y0 + dy*(wd.length-1);
        if (x1 < 0 || x1 >= N || y1 < 0 || y1 >= N) continue; let ok = true; for (let i = 0; i < wd.length; i++) { const ch = grid[y0+dy*i][x0+dx*i]; if (ch && ch != wd[i]) { ok = false; break; } } if (!ok) continue;
        for (let i = 0; i < wd.length; i++) grid[y0+dy*i][x0+dx*i] = wd[i]; words.push({wd, x0, y0, dx, dy}); break; } }
    const AB = 'ABCDEFGHIJKLMNOPRSTUWY'; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!grid[y][x]) grid[y][x] = AB[Math.floor(Math.random()*AB.length)];
    timeLeft = A.D(150, 120, 100) + 10*A.U('time'); };
  const reset = () => { if (__skip) { __skip = false; return; } score = 0; round = 1; make(); api.score(0); };
  const S = () => Math.floor(Math.min(w - 20, 420) / N), OX = () => (w - S()*N)/2, OY = 50;
  const cellAt = q => ({x: Math.floor((q.x - OX())/S()), y: Math.floor((q.y - OY)/S())});
  const line = (a, b) => { const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y), len = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)); if (!(dx == 0 || dy == 0 || Math.abs(b.x - a.x) == Math.abs(b.y - a.y))) return null; const out = []; for (let i = 0; i <= len; i++) out.push({x:a.x+dx*i, y:a.y+dy*i}); return out; };
  const check = () => { if (!sel || !sel.b) return; const L = line(sel.a, sel.b); sel = null; if (!L) return; const s1 = L.map(p => (grid[p.y]||[])[p.x] || '').join(''), s2 = s1.split('').reverse().join('');
    const wd = words.find(x => !found.includes(x.wd) && (x.wd == s1 || x.wd == s2)); if (wd) { found.push(wd.wd); flash.push({L, t:1}); score += wd.wd.length*20 + Math.floor(timeLeft); api.score(score); A.sfx('coin');
      if (found.length == words.length) { score += 300 * round; api.score(score); A.sfx('win'); round++; make(); } } else A.tone(180,.05,'square',.03); };
  const offK = A.keys(e => { if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; } });
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } const q = pt(c, e, w, h), cc = cellAt(q); if (cc.x >= 0 && cc.y >= 0 && cc.x < N && cc.y < N) sel = {a:cc, b:cc}; });
  c.addEventListener('pointermove', e => { if (!sel) return; const cc = cellAt(pt(c, e, w, h)); if (cc.x >= 0 && cc.y >= 0 && cc.x < N && cc.y < N) sel.b = cc; });
  c.addEventListener('pointerup', check);
  const offL = A.loop(dt => { t += dt; for (const f of flash) f.t -= dt*.6; flash = flash.filter(f => f.t > 0);
    if (st == 'play' && !quiz) { timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; quiz = learn2(host, api, 'TIME\'S UP! ANSWER FOR 30 MORE SECONDS', () => { quiz = false; timeLeft = 30; }, () => { quiz = false; st = 'over'; stat(api,'wordsFound',found.length,'add'); api.over(score); }); } }
    g.fillStyle = '#eaf3df'; g.fillRect(0,0,w,h);
    if (grid) { const s = S(), ox = OX(); const selL = sel && sel.b ? line(sel.a, sel.b) : null;
      words.forEach(x => { if (!found.includes(x.wd)) return; g.strokeStyle = 'rgba(0,180,81,.35)'; g.lineWidth = s*.7; g.lineCap = 'round'; g.beginPath(); g.moveTo(ox + (x.x0+.5)*s, OY + (x.y0+.5)*s); g.lineTo(ox + (x.x0 + x.dx*(x.wd.length-1) + .5)*s, OY + (x.y0 + x.dy*(x.wd.length-1) + .5)*s); g.stroke(); });
      if (selL) { g.strokeStyle = 'rgba(249,191,1,.55)'; g.lineWidth = s*.7; g.beginPath(); g.moveTo(ox + (selL[0].x+.5)*s, OY + (selL[0].y+.5)*s); g.lineTo(ox + (selL[selL.length-1].x+.5)*s, OY + (selL[selL.length-1].y+.5)*s); g.stroke(); }
      g.fillStyle = '#1a3a2a'; g.font = '700 '+Math.floor(s*.55)+'px '+A.font; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) g.fillText(grid[y][x], ox + (x+.5)*s, OY + (y+.5)*s);
      g.textBaseline = 'alphabetic'; const by = OY + s*N + 24; g.font = '700 14px '+A.font; words.forEach((x, i) => { const col = i % 3, row = Math.floor(i/3); g.fillStyle = found.includes(x.wd) ? '#9aa5a1' : '#015640'; g.textAlign = 'center'; g.fillText(found.includes(x.wd) ? '✓ '+x.wd : x.wd, w/6 + col*w/3, by + row*20); }); }
    g.fillStyle = '#015640'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Round '+(round||1)+'   '+A.fmt(score||0), 12, 28); g.textAlign = 'right'; g.fillStyle = timeLeft < 20 ? '#FF4539' : '#015640'; g.fillText('⏱ '+Math.ceil(timeLeft||0), w-12, 28);
    if (st == 'ready') A.overlayText(g, w, h, 'WORD WOODS', __skip ? 'Saved game · tap or press Space to continue' : 'Drag across the letters to find every word · tap to start');
    if (st == 'over') A.overlayText(g, w, h, 'TIME\'S UP', A.fmt(score||0)+' points · tap to search again'); });
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, N, grid, words, found, score, round, timeLeft} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({N, grid, words, found, score, round, timeLeft} = R0); api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] words resume failed', e); } } }
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// STREAM FIXER — turn pipes so the springs' water reaches every pond and flows through every tree, then release it. No timer:
// beavers, rocks, frozen pipes, pollution and leaks make it tricky. Every level is generated from a real solution.
// =====================================================================================================
A.register('pipes', { mount(host, api){
  let __skip = false;
  const {c,g,w,h} = A.canvas(host, 480, 600); c.style.touchAction = 'none';
  // Sides: 1 up, 2 right, 4 down, 8 left. Tiles: {k, m, sol, ...}
  //  k: 'pipe' (straight/elbow/T/cross by mask), 'src' spring, 'pond' goal end, 'tree' goal pipe the water flows THROUGH,
  //     'bridge' over/under crossing (two separate straight pipes), 'valve' straight pipe you open/close by tapping.
  // Dangers (no timer): beavers block a pipe, rocks fall on tiles, frozen pipes can't turn for a few moves, pollution must be filtered,
  // and releasing water while pipes leak costs a heart.
  const DIRS = [[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]], OPP = {1:4,2:8,4:1,8:2};
  const rot = m => ((m << 1) | (m >> 3)) & 15, bits = m => [1,2,4,8].filter(b => m & b);
  const rng = seed => () => { seed = (seed * 16807 + 11) % 2147483647; return seed / 2147483647; };
  let st = 'ready', N, T, level = 1, score = 0, hearts = 3, moves = 0, srcs = [], flow = null, release = null, msg = '', msgT = 0, t = 0, speed = false, runT = 0, events = 0, quiz = false, pondsWon = 0;
  // ---------- level generator: always solvable (the scrambled tiles are a real solution turned around) ----------
  const make = lv => { const R = rng(lv * 7919 + 13); N = Math.min(8, 4 + Math.floor((lv+1)/2)); const nS = Math.min(3, 1 + Math.floor((lv-1)/3));
    T = Array.from({length:N}, () => Array.from({length:N}, () => ({k:'pipe', m:0})));
    const seen = new Set(), front = []; srcs = [];
    const edgeCells = []; for (let i = 0; i < N; i++) edgeCells.push([0,i],[N-1,i],[i,0],[i,N-1]);
    while (srcs.length < nS) { const [x,y] = edgeCells[Math.floor(R()*edgeCells.length)]; if (srcs.some(s2 => Math.abs(s2.x-x) + Math.abs(s2.y-y) < 3)) { if (R() < .98) continue; } srcs.push({x,y}); seen.add(x+','+y); T[y][x].k = 'src'; }
    // long winding paths (depth-first) from every spring; when a path is boxed in it may hop over a straight pipe with a bridge
    const stacks = srcs.map(s2 => [[s2.x, s2.y]]);
    const nbrs = (x, y) => DIRS.map(([b,dx,dy]) => [b, x+dx, y+dy]).filter(([, nx, ny]) => nx>=0&&ny>=0&&nx<N&&ny<N&&!seen.has(nx+','+ny));
    let guard = 0;
    while (stacks.some(sk => sk.length) && guard++ < 5000) { const live = stacks.filter(sk => sk.length), sk = live[Math.floor(R()*live.length)], [x, y] = sk[sk.length-1], opts = nbrs(x, y);
      if (opts.length) { const [b, nx, ny] = opts[Math.floor(R()*opts.length)]; T[y][x].m |= b; T[ny][nx].m |= OPP[b]; seen.add(nx+','+ny); sk.push([nx, ny]); continue; }
      let hopped = false;
      if (lv >= 3 && T[y][x].k == 'pipe') for (const [b, dx, dy] of DIRS.slice().sort(() => R() - .5)) { const bx = x+dx, by = y+dy, cx = x+2*dx, cy = y+2*dy; if (cx<0||cy<0||cx>=N||cy>=N || seen.has(cx+','+cy)) continue; const B = T[by][bx], perp = (b == 2 || b == 8) ? 5 : 10;
        if (B.k == 'pipe' && B.m == perp) { T[y][x].m |= b; B.k = 'bridge'; B.m = 15; T[cy][cx].m |= OPP[b]; seen.add(cx+','+cy); sk.push([cx, cy]); hopped = true; break; } }
      if (!hopped) sk.pop(); }
    // 4-way splitters: some T-junctions get their 4th side joined to a neighbour (a small loop never leaks)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const Ti = T[y][x]; if (Ti.k != 'pipe' || bits(Ti.m).length != 3 || R() > (lv >= 2 ? .45 : .2)) continue; const b = [1,2,4,8].find(b2 => !(Ti.m & b2)), [, dx, dy] = DIRS.find(d => d[0] == b), nx = x+dx, ny = y+dy;
      if (nx<0||ny<0||nx>=N||ny>=N) continue; const Tn = T[ny][nx], dn = bits(Tn.m).length; if (Tn.k == 'pipe' && dn >= 2 && dn <= 3) { Ti.m |= b; Tn.m |= OPP[b]; } }
    // goals: every dead end is a pond; some pipes become trees (water flows through and they bloom)
    const pipes2 = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const Ti = T[y][x]; if (Ti.k != 'pipe') continue; const d = bits(Ti.m).length; if (d == 1) Ti.k = 'pond'; else if (d == 2) pipes2.push(Ti); }
    for (let k = 0, want = Math.min(pipes2.length, 1 + Math.ceil(lv/2)); k < want; k++) { const i = Math.floor(R()*pipes2.length); pipes2.splice(i,1)[0].k = 'tree'; }
    // some straight pipes become valves (start closed sometimes)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const Ti = T[y][x]; if (Ti.k == 'pipe' && (Ti.m == 5 || Ti.m == 10) && lv >= 3 && R() < .12) { Ti.k = 'valve'; Ti.open = R() < .5; } }
    // remember the solution, then scramble rotations
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const Ti = T[y][x]; Ti.sol = Ti.m; if (Ti.k != 'src' && Ti.k != 'bridge' && Ti.m != 15) { const k = Math.floor(R()*4); for (let q = 0; q < k; q++) Ti.m = rot(Ti.m); } }
    moves = 0; events = 0; runT = 0; release = null; compute(); };
  // ---------- water flow (used for the live preview and for the release) ----------
  const blocked = Ti => Ti.beaver || Ti.rock || (Ti.k == 'valve' && !Ti.open);
  const compute = () => { const wet = new Map(), leaks = [], order = []; const q = [];
    srcs.forEach(s2 => { const Ti = T[s2.y][s2.x]; wet.set(s2.x+','+s2.y, {clean:true}); order.push([s2.x,s2.y]); bits(Ti.m).forEach(b => q.push([s2.x, s2.y, b, true])); });
    const seenS = new Set();
    while (q.length) { const [x,y,b,clean] = q.shift(), [, dx, dy] = DIRS.find(d => d[0] == b), nx = x+dx, ny = y+dy;
      if (nx<0||ny<0||nx>=N||ny>=N) { leaks.push([x,y,b]); continue; }
      const Tn = T[ny][nx], ent = OPP[b]; if (!(Tn.m & ent) || blocked(Tn)) { if (!blocked(Tn)) leaks.push([x,y,b]); continue; }
      const key = nx+','+ny+','+ent; if (seenS.has(key)) continue; seenS.add(key);
      const cl = clean && !(Tn.dirty && !Tn.filter); const prev = wet.get(nx+','+ny); wet.set(nx+','+ny, {clean: cl || (prev && prev.clean), ax: Tn.k == 'bridge' ? ((prev && prev.ax) || 0) | (ent == 1 || ent == 4 ? 1 : 2) : 0}); order.push([nx,ny]);
      const outs = Tn.k == 'bridge' ? [OPP[ent]] : bits(Tn.m).filter(o => o != ent); outs.forEach(o => q.push([nx, ny, o, cl])); }
    const goals = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (T[y][x].k == 'pond' || T[y][x].k == 'tree') goals.push({x, y, ok: !!(wet.get(x+','+y) || {}).clean});
    flow = {wet, leaks, goals, order, done: goals.every(g2 => g2.ok) && !leaks.length}; return flow; };
  // ---------- dangers (every few moves on harder levels) ----------
  const danger = () => { if (level < 2) return; events++; const R = Math.random(), cells = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const Ti = T[y][x]; if (Ti.k != 'src' && !Ti.beaver && !Ti.rock) cells.push(Ti); } if (!cells.length) return; const Ti = cells[Math.floor(Math.random()*cells.length)];
    if (R < .3) { Ti.beaver = true; say('🦫 A beaver plugged a pipe! Tap it to shoo it away.'); }
    else if (R < .55 && level >= 3) { Ti.rock = 2; say('🪨 A rock fell! Tap it twice to break it.'); }
    else if (R < .8) { Ti.frozen = 3; say('❄ A pipe froze — it can\'t turn for 3 moves.'); }
    else if (level >= 4) { Ti.dirty = true; Ti.filter = false; say('☣ Pollution! Tap the sludgy pipe to add a filter.'); }
    else { Ti.frozen = 3; say('❄ A pipe froze — it can\'t turn for 3 moves.'); } A.tone(160,.15,'sawtooth',.04); };
  const say = s2 => { msg = s2; msgT = 3; };
  const every = () => A.D(12, 9, 7);
  const tapTile = (x, y) => { const Ti = T[y][x]; if (!Ti || release) return;
    if (Ti.beaver) { Ti.beaver = false; A.sfx('blip'); }
    else if (Ti.rock) { Ti.rock--; A.tone(120,.06,'square',.05); }
    else if (Ti.dirty && !Ti.filter) { Ti.filter = true; A.sfx('coin'); }
    else if (Ti.k == 'valve') { Ti.open = !Ti.open; A.tone(500,.05,'square',.04); }
    else if (Ti.frozen) { A.sfx('bad'); say('That pipe is frozen for '+Ti.frozen+' more move'+(Ti.frozen > 1 ? 's' : '')+'.'); return; }
    else if (Ti.k == 'src' || Ti.k == 'bridge' || Ti.m == 15) { A.sfx('bad'); return; }
    else { Ti.m = rot(Ti.m); A.tone(380 + flow.wet.size*12, .04, 'triangle', .04); }
    moves++; for (const row of T) for (const T2 of row) if (T2.frozen && T2 !== Ti) T2.frozen--;
    if (moves % every() == 0) danger(); compute(); };
  // ---------- release the water ----------
  const doRelease = () => { if (release || st != 'play') return; compute(); release = {t:0, n:flow.order.length}; A.tone(300,.3,'sine',.05); };
  const finishRelease = () => { const f = compute(); release = null;
    if (f.done) { const par = N*N, gain = Math.round((400 + 100*level + f.goals.filter(g2 => T[g2.y][g2.x].k == 'tree').length*60 + Math.max(0, par - moves)*8) * (speed && runT < par*2 ? 1.5 : 1));
      score += gain; api.score(score); A.sfx('win'); say('All watered! +'+gain+(speed && runT < par*2 ? ' (speedrun ×1.5)' : '')); stat(api,'pipesLevel',level,'max');
      level++; try { const gd = api.gdata ? api.gdata() : {}; if (level > (gd.unlocked||1)) api.setGdata && api.setGdata({unlocked:level}); } catch(e){} setTimeout(() => { if (st == 'play') make(level); }, 900); return; }
    if (f.leaks.length) { hearts--; A.sfx('bad'); say('💦 '+f.leaks.length+' leak'+(f.leaks.length > 1 ? 's' : '')+'! You lost a heart. Fix the open pipe ends.');
      if (hearts <= 0 && !A.immortal) { quiz = true; learn2(host, api, 'OUT OF HEARTS! ANSWER FOR ONE MORE', () => { quiz = false; hearts = 1; }, () => { quiz = false; st = 'over'; A.sfx('over'); api.over(score); }); } }
    else say('No leaks, but some plants are still dry ('+f.goals.filter(g2 => !g2.ok).length+' left).'); };
  const startLvl = () => { let u = 1; try { u = (api.gdata ? api.gdata().unlocked : 1) || 1; } catch(e){} return Math.max(1, u); };
  const reset = (lv) => { if (__skip) { __skip = false; return; } level = lv || 1; score = 0; hearts = A.lives(3 + A.U('time')); make(level); api.score(0); };
  const start = (lv, sp) => { speed = !!sp; reset(lv); st = 'play'; };
  // ---------- input ----------
  const S = () => Math.floor(Math.min(w - 40, h - 190) / N), OX = () => (w - S()*N)/2, OY = 64;
  let cx = 0, cy = 0;
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h);
    if (st != 'play') { if (quiz) return; if (__skip) { __skip = false; st = 'play'; return; } const sp = q.y > h - 120 && q.x > w/2; start(q.y > h - 120 && q.x < w/2 ? 1 : startLvl(), sp); return; }
    if (quiz) return; if (q.y > h - 64) { if (q.x < w/2) doRelease(); else { make(level); say('Level restarted.'); } return; }
    const x = Math.floor((q.x - OX())/S()), y = Math.floor((q.y - OY)/S()); if (x >= 0 && y >= 0 && x < N && y < N) { cx = x; cy = y; tapTile(x, y); } });
  const offK = A.keys(e => { if (e.type != 'keydown') return;
    if (st != 'play') { if (quiz) return; if (e.key == ' ' || e.key == 'Enter') { if (__skip) { __skip = false; st = 'play'; } else start(startLvl(), false); } if (e.key == '1') start(1, false); if (e.key == 's') start(startLvl(), true); return; }
    const m = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]}[e.key]; if (m) { cx = clamp(cx + m[0], 0, N-1); cy = clamp(cy + m[1], 0, N-1); }
    if (e.key == ' ') tapTile(cx, cy); if (e.key == 'Enter' || e.key == 'r') doRelease(); if (e.key == 'z') { make(level); say('Level restarted.'); } });
  // ---------- draw ----------
  const offL = A.loop(dt => { A.mood(() => ({danger: st=="play" && hearts==1, boss: false})); t += dt; msgT = Math.max(0, msgT - dt); if (st == 'play' && !quiz) runT += dt;
    if (release) { release.t += dt; if (release.t > Math.min(1.6, .25 + release.n*.06)) finishRelease(); }
    g.fillStyle = '#7cb85a'; g.fillRect(0,0,w,h);
    if (T) { const s = S(), ox = OX(), shown = release ? Math.floor(release.t / Math.min(1.6, .25 + release.n*.06) * release.n) : -1, shownSet = new Set((flow.order||[]).slice(0, shown + 1).map(([x,y]) => x+','+y));
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const X = ox + x*s, Y = OY + y*s, Ti = T[y][x], mx = X + s/2, my = Y + s/2, wv = flow.wet.get(x+','+y);
        g.fillStyle = (x+y) % 2 ? '#8D5B1D' : '#9a6a2a'; g.fillRect(X, Y, s, s); if (Ti.dirty && !Ti.filter) { g.fillStyle = 'rgba(120,150,40,.55)'; g.fillRect(X, Y, s, s); }
        const isW = release ? shownSet.has(x+','+y) : false, pre = !release && wv;   // live preview = faint dashed water
        const pipeCol = isW ? (wv && wv.clean ? '#3ac8ff' : '#9aa040') : '#c8b078';
        const seg = (sides, col, wd) => { g.strokeStyle = col; g.lineWidth = wd; g.lineCap = 'round'; g.beginPath(); bits(sides).forEach(b => { const [, dx, dy] = DIRS.find(d => d[0] == b); g.moveTo(mx, my); g.lineTo(mx + dx*s/2, my + dy*s/2); }); g.stroke(); };
        if (Ti.k == 'bridge') { seg(10, isW && wv.ax & 2 ? '#3ac8ff' : '#c8b078', s*.26); g.fillStyle = '#6b4a2b'; g.fillRect(mx - s*.22, Y, s*.44, s); seg(5, isW && wv.ax & 1 ? '#3ac8ff' : '#e0c890', s*.26); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 2; g.strokeRect(mx - s*.2, Y + 2, s*.4, s - 4); }
        else if (Ti.k != 'src') seg(Ti.m, pipeCol, s*.26);
        if (pre && Ti.k != 'src') { g.strokeStyle = wv.clean ? 'rgba(58,200,255,.75)' : 'rgba(160,170,60,.8)'; g.lineWidth = s*.08; g.setLineDash([s*.1, s*.08]); g.beginPath(); (Ti.k == 'bridge' ? [ (wv.ax & 1 ? 5 : 0) | (wv.ax & 2 ? 10 : 0) ] : [Ti.m]).forEach(m2 => bits(m2).forEach(b => { const [, dx, dy] = DIRS.find(d => d[0] == b); g.moveTo(mx, my); g.lineTo(mx + dx*s/2, my + dy*s/2); })); g.stroke(); g.setLineDash([]); }
        if (Ti.k == 'valve') { g.fillStyle = Ti.open ? '#00B451' : '#FF4539'; g.beginPath(); g.arc(mx, my, s*.16, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); const vert = Ti.m == 5; if (Ti.open == vert) { g.moveTo(mx - s*.12, my); g.lineTo(mx + s*.12, my); } else { g.moveTo(mx, my - s*.12); g.lineTo(mx, my + s*.12); } g.stroke(); }
        if (Ti.k == 'src') { seg(Ti.m, '#3ac8ff', s*.26); g.fillStyle = '#3ac8ff'; g.beginPath(); g.arc(mx, my, s*.3, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = Math.floor(s*.34)+'px '+A.font; g.textAlign = 'center'; g.fillText('💧', mx, my + s*.12); }
        if (Ti.k == 'pond') { const ok = (flow.goals.find(g2 => g2.x == x && g2.y == y) || {}).ok && (!release || isW); g.fillStyle = ok ? '#3ac8ff' : '#5a7a8a'; g.beginPath(); g.ellipse(mx, my, s*.32, s*.22, 0, 0, TAU); g.fill(); if (ok) { g.font = Math.floor(s*.3)+'px '+A.font; g.textAlign = 'center'; g.fillText('🐸', mx, my + s*.1); } }
        if (Ti.k == 'tree') { const ok = (flow.goals.find(g2 => g2.x == x && g2.y == y) || {}).ok && (!release || isW); g.fillStyle = ok ? '#00B451' : '#b8a060'; g.beginPath(); g.moveTo(mx, my - s*.36); g.lineTo(mx + s*.26, my + s*.12); g.lineTo(mx - s*.26, my + s*.12); g.fill(); if (ok) { g.fillStyle = '#ff8fd0'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(mx + Math.cos(k*1.6 + t)*s*.14, my - s*.08 + Math.sin(k*1.6)*s*.1, s*.04, 0, TAU); g.fill(); } } g.fillStyle = '#6b4a2b'; g.fillRect(mx - s*.04, my + s*.1, s*.08, s*.12); }
        if (Ti.frozen) { g.fillStyle = 'rgba(200,240,255,.55)'; g.fillRect(X+2, Y+2, s-4, s-4); g.fillStyle = '#14204a'; g.font = '700 '+Math.floor(s*.22)+'px '+A.font; g.textAlign = 'right'; g.fillText('❄'+Ti.frozen, X + s - 4, Y + s*.28); }
        if (Ti.beaver || Ti.rock || (Ti.dirty && !Ti.filter) || (Ti.dirty && Ti.filter)) { g.font = Math.floor(s*.42)+'px '+A.font; g.textAlign = 'center'; g.fillText(Ti.beaver ? '🦫' : Ti.rock ? '🪨' : Ti.filter ? '🧽' : '☣', mx, my + s*.15); }
        if (x == cx && y == cy) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.strokeRect(X+2, Y+2, s-4, s-4); } }
      // leak markers in the preview
      if (!release) for (const [x,y,b] of flow.leaks) { const [, dx, dy] = DIRS.find(d => d[0] == b), X = ox + (x + .5 + dx*.5)*s, Y = OY + (y + .5 + dy*.5)*s; g.fillStyle = 'rgba(58,200,255,'+(.5 + .4*Math.sin(t*8))+')'; g.beginPath(); g.arc(X, Y, s*.1, 0, TAU); g.fill(); } }
    // HUD
    g.fillStyle = '#121313'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Level '+level+'   '+A.fmt(score||0)+'   Moves '+moves, 12, 26);
    g.textAlign = 'right'; g.fillText('❤'.repeat(clamp(hearts,0,20)), w - 12, 26);
    if (flow) { g.textAlign = 'left'; g.font = '13px '+A.font; g.fillText('🌳/🐸 '+flow.goals.filter(g2 => g2.ok).length+'/'+flow.goals.length+' reached in the preview · '+flow.leaks.length+' leak'+(flow.leaks.length == 1 ? '' : 's')+(speed ? '   ⏱ '+runT.toFixed(1)+' s' : ''), 12, 48); }
    if (st == 'play') { [['💧 Release water (Enter)', '#3ac8ff'], ['⟲ Restart level (Z)', 'rgba(255,255,255,.35)']].forEach(([tx, col], i) => { g.fillStyle = col; rr(g, 10 + i*w/2, h - 56, w/2 - 20, 46, 12); g.fill(); g.fillStyle = '#121313'; g.font = '700 15px '+A.font; g.textAlign = 'center'; g.fillText(tx, i*w/2 + w/4, h - 27); }); }
    if (msgT > 0 && st == 'play') { g.fillStyle = 'rgba(0,0,0,.65)'; rr(g, 16, h - 112, w - 32, 44, 12); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText(msg, w/2, h - 85); }
    if (st == 'ready') { A.overlayText(g, w, h, 'STREAM FIXER', __skip ? 'Saved game · tap or press Space to continue' : 'Turn pipes so water reaches every 🐸 pond and flows through every 🌳 tree, then release it');
      if (!__skip) { g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText('Tap middle: level '+startLvl()+'   ·   bottom-left: level 1   ·   bottom-right (or S): ⏱ speedrun', w/2, h - 70); } }
    if (st == 'over') A.overlayText(g, w, h, 'THE STREAM IS STUCK', A.fmt(score||0)+' points · level '+level+' · tap to try again'); });
  // ---- save & resume ----
  api.snap && api.snap(() => st == 'play' && T ? {v:2, level, score, hearts, moves, events, N, T, srcs, speed, runT} : null);
  { const R0 = api.resume; if (R0 && R0.v == 2) { try { ({level, score, hearts, moves, events, N, T, srcs, speed, runT} = R0); compute(); api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] pipes resume failed', e); } } }
  A._dbg = A._dbg || {}; A._dbg.pipes = () => ({T, N, level, flow, st, make, compute, solve: () => { for (const row of T) for (const Ti of row) { Ti.m = Ti.sol; Ti.beaver = false; Ti.rock = 0; Ti.frozen = 0; if (Ti.k == 'valve') Ti.open = true; if (Ti.dirty) Ti.filter = true; } return compute(); }, release: doRelease});
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// SNOWBALL SHOWDOWN 2.0 — wave survival snow fight. Your throws LOB over your own walls; enemy throws are blocked by them.
// Duck behind walls, pack big snowballs, keep your ammo up, heal with cocoa / Warm Up / a campfire, build forts, turrets,
// trap pits and ice, hire named teammates, beat 4 bosses, and play Endless, Boss Rush or the Daily Challenge.
// =====================================================================================================
A.register('snowball', { mount(host, api){
  let __skip = false;
  const {c,g,w,h} = A.canvas(host, 600, 720); c.style.touchAction = 'none';
  const K = keysDown(), MID = 300, FIELD = 620, PY = 566, BAR = FIELD;
  const low = () => !!A.lowFx;
  // ---------- permanent progress (kept between games, saved with your profile) ----------
  const PERM = Object.assign({cr:0, up:{}, best:0, bosses:0}, (api.gdata && api.gdata().sb) || {});
  const PU = k => PERM.up[k] || 0;
  const savePerm = () => { try { api.setGdata && api.setGdata({sb:PERM}); } catch(e){} };
  const PUPS = [{k:'coat', n:'Warm Coat', d:'+1 max heart (never above 50)', b:20, max:10}, {k:'pockets', n:'Big Pockets', d:'Carry 2 more snowballs', b:15, max:5},
    {k:'arm', n:'Power Arm', d:'Snowballs hit 15% harder', b:25, max:10}, {k:'pack', n:'Quick Packing', d:'Pack big snowballs 12% faster', b:20, max:5},
    {k:'walls', n:'Thick Walls', d:'Your walls get +2 strength', b:20, max:5}, {k:'mitts', n:'Warm Mittens', d:'Campfires heal faster, more cocoa drops', b:20, max:5},
    {k:'stash', n:'Snowflake Stash', d:'Start with 15 more ❄', b:15, max:10}, {k:'captain', n:'Team Captain', d:'Teammates start 1 level higher', b:30, max:4},
    {k:'boots', n:'Snow Boots', d:'Move 8% faster', b:15, max:5}, {k:'rollcd', n:'Quick Roll', d:'Dodge-roll comes back 10% sooner', b:20, max:5},
    {k:'scoop', n:'Fast Scoop', d:'Scoop and regrow snowballs 12% faster', b:15, max:10}, {k:'crit', n:'Lucky Throw', d:'5% chance per level to hit for double', b:25, max:6},
    {k:'magnet', n:'Snow Magnet', d:'Grab cocoa and power-ups from farther away', b:15, max:5}, {k:'turret', n:'Turret Training', d:'Your turrets throw 12% faster', b:25, max:5},
    {k:'thermos', n:'Cocoa Thermos', d:'Heal 1 heart at the start of every wave', b:40, max:3}, {k:'shield', n:'Snow Shield', d:'Start every wave with a shield', b:60, max:1},
    {k:'mates', n:'Snow Friends', d:'Start with one more teammate', b:50, max:2},
    {k:'abcd', n:'Hero Training', d:'Your class ability comes back 6% sooner', b:30, max:5}, {k:'boss', n:'Boss Hunter', d:'+10% damage to bosses', b:30, max:5},
    {k:'regen', n:'Cocoa Flask', d:'Heal 1 heart every 35 s (5 s sooner per level)', b:40, max:4}, {k:'flakes', n:'Flake Magnet', d:'+10% snowflakes from everything', b:25, max:5},
    {k:'frost', n:'Frost Finder', d:'+1 Frost Crystal from every boss and chest', b:40, max:5}, {k:'armor', n:'Puffy Jacket', d:'6% chance to shrug off a hit', b:35, max:5},
    {k:'machine', n:'Snow Machine', d:'Snowballs refill by themselves anywhere · +20% regen in the Kingdom', b:30, max:5}];
  const pcost = u => Math.ceil(u.b * Math.pow(1.6, PU(u.k)));
  // ======== WINTER WAR: classes, skill trees, gear and special snowballs (all saved in PERM) ========
  PERM.cls = PERM.cls || 'slinger'; PERM.cx = PERM.cx || {}; PERM.sk = PERM.sk || {}; PERM.gear = PERM.gear || []; PERM.eq = PERM.eq || {}; PERM.frost = PERM.frost || 0; PERM.bank = PERM.bank || 0; PERM.balls = PERM.balls || {snow:1, shard:1, slush:1}; PERM.ball = PERM.ball || 'snow'; PERM.gid = PERM.gid || 1;
  const CLASSES = {
    slinger: {n:'Slinger', e:'🎯', col:'#00B451', hat:'#F9BF01', d:'Fast throws and a bigger pouch', ab:'Flurry', abD:'Throws 5 snowballs at once', cd:12, hp:0, ammo:4, pack:1.4},
    builder: {n:'Builder', e:'🔨', col:'#ff8a3c', hat:'#F9BF01', d:'Builds 30% cheaper, walls 50% stronger', ab:'Instant Fort', abD:'Drops a full snow fort in front of you', cd:30, hp:1},
    medic:   {n:'Medic', e:'➕', col:'#ff9ad5', hat:'#ffffff', d:'Teammates heal and revive faster', ab:'Cocoa Break', abD:'Heals you +2 and every teammate nearby, and picks up knocked-out friends', cd:25, hp:1},
    tank:    {n:'Tank', e:'🛡', col:'#5a6a80', hat:'#9ec4e8', d:'+3 hearts, a little slower', ab:'Snow Shield', abD:'Nothing can hurt you for 4 seconds', cd:20, hp:3, slow:.9},
    sniper:  {n:'Sniper', e:'🔭', col:'#2f6a3a', hat:'#121313', d:'Packed throws hit 50% harder and fly faster', ab:'Eagle Eye', abD:'Reveals hidden enemies and clears whiteouts for 6 seconds', cd:18, hp:0, snipe:1.5},
    trapper: {n:'Trapper', e:'🕳', col:'#8D5B1D', hat:'#7fe6ff', d:'A free ice patch and trap pit every break', ab:'Avalanche', abD:'Knocks every enemy back and stuns them', cd:22, hp:0}};
  const CLS_K = Object.keys(CLASSES);
  // 3 branches per class, 3 ranks each: power (+8% damage), focus (ability cooldown −10%), grit (+1 heart)
  const BRANCH = {slinger:['Arm Power', 'Quick Flurry', 'Snow Grit'], builder:['Hammer Power', 'Fast Fort', 'Sturdy Boots'], medic:['Snowball Power', 'Hot Cocoa', 'Warm Heart'], tank:['Heavy Arm', 'Shield Wall', 'Iron Belly'], sniper:['Long Shot', 'Sharp Eye', 'Camo Coat'], trapper:['Trap Power', 'Rumble', 'Thick Fur']};
  const clsXp = k => PERM.cx[k] || 0, clsLv = k => Math.min(30, 1 + Math.floor(Math.sqrt(clsXp(k) / 60)));
  const skR = (k, b) => ((PERM.sk[k] || {})[b] || 0), skUsed = k => [0, 1, 2].reduce((a, b) => a + skR(k, b), 0), skFree = k => (clsLv(k) - 1) - skUsed(k);
  const CL = () => CLASSES[PERM.cls] || CLASSES.slinger;
  // gear: five slots, six rarities (prize counter colors), upgrade with banked snowflakes + Frost Crystals
  const GRAR = [{n:'Common', c:'#c9ccd1'}, {n:'Uncommon', c:'#7fe08a'}, {n:'Rare', c:'#64CDF5'}, {n:'Epic', c:'#E9B9F7'}, {n:'Legendary', c:'#F9BF01'}, {n:'Mythic', c:'#ff6ad5'}, {n:'Snow', c:'#e6fbff', snow:1}];   // Snow: only by fusing 3 Mythics
  const GSLOT = {gloves:{n:'Gloves', e:'🧤', base:['Mittens', 'Gloves', 'Grips', 'Snow Paws'], stat:'throws faster'}, boots:{n:'Boots', e:'🥾', base:['Boots', 'Snow Treads', 'Ice Skids', 'Trekkers'], stat:'moves faster, grips ice'},
    hat:{n:'Hat', e:'🎩', base:['Beanie', 'Earmuffs', 'Bobble Hat', 'Helmet'], stat:'extra hearts'}, scarf:{n:'Scarf', e:'🧣', base:['Scarf', 'Neck Warmer', 'Wrap', 'Cowl'], stat:'resists freezing'}, pack:{n:'Backpack', e:'🎒', base:['Backpack', 'Satchel', 'Snow Sack', 'Rucksack'], stat:'carries more snowballs'}};
  const GPRE = ['Frosty', 'Polar', 'Glacier', 'Blizzard', 'Aurora', 'Crystal', 'Northern', 'Snowdrift', 'Icicle', 'Tundra'], GSUF = ['of the Yeti King', 'of the Frost Dragon', 'of Queen Glacia', 'of the Snowplow', 'of the Blizzard Witch', 'of Winter', 'of the North Wind', 'of the Penguin Squire'];
  const makeGear = (minR, slot0) => { const r0 = Math.random(), rar = Math.min(Math.max(5, minR || 0), Math.max(minR || 0, r0 < .45 ? 0 : r0 < .72 ? 1 : r0 < .88 ? 2 : r0 < .96 ? 3 : r0 < .99 ? 4 : 5)); const slots = Object.keys(GSLOT), slot = slot0 || slots[Math.floor(Math.random()*slots.length)], S2 = GSLOT[slot];
    const base = S2.base[Math.floor(Math.random()*S2.base.length)], name = rar >= 6 ? 'Snow ' + base + ' of the Endless Winter' : rar >= 3 ? (S2.base[0] == base ? base : base) + ' ' + GSUF[Math.floor(Math.random()*GSUF.length)] : GPRE[Math.floor(Math.random()*GPRE.length)] + (rar >= 2 ? ' Pathfinder ' : ' ') + base;
    const it = {id:PERM.gid++, slot, rar, lv:0, name}; PERM.gear.push(it); if (PERM.gear.length > 60) { const worst = PERM.gear.filter(x => !Object.values(PERM.eq).includes(x.id)).sort((a, b) => a.rar - b.rar || a.lv - b.lv)[0]; if (worst) PERM.gear = PERM.gear.filter(x => x !== worst); } if (!PERM.eq[slot]) PERM.eq[slot] = it.id; savePerm(); return it; };
  const gpow = it => it ? (1 + it.rar*.5) * (1 + .15*it.lv) : 0;
  const eqd = slot => PERM.gear.find(x => x.id == PERM.eq[slot]);
  const gStat = slot => gpow(eqd(slot));
  const gearTxt = it => { const v = gpow(it); return {gloves:'+' + Math.round(6*v) + '% throw & pack speed', boots:'+' + Math.round(5*v) + '% speed, better grip', hat:'+' + Math.max(1, Math.round(v*.8)) + ' heart' + (Math.round(v*.8) > 1 ? 's' : ''), scarf:'−' + Math.min(80, Math.round(12*v)) + '% freeze time', pack:'+' + Math.round(2*v) + ' snowballs'}[it.slot]; };
  const gUpCost = it => ({flakes:Math.ceil(40*(it.lv + 1)*(1 + it.rar)), frost:(it.lv + 1)*(it.rar + 1)});
  // special snowballs
  const BALLS = {snow:{n:'Snowball', e:'⚪', d:'The classic', cost:0}, shard:{n:'Ice Shard', e:'🔷', d:'Flies straight and pierces through every enemy in its path', cost:0}, slush:{n:'Slushball', e:'💧', d:'Slows whatever it hits', cost:0},
    sparkle:{n:'Sparkleball', e:'✨', d:'Big sparkly splash', cost:30}, boomer:{n:'Boomerball', e:'🪃', d:'Lands, then flies back and hits again', cost:50}, boulder:{n:'Mega Boulder', e:'🪨', d:'Huge damage, uses 3 snowballs', cost:120}};
  // ---------- seeded random (Daily Challenge uses the same seed for everyone) ----------
  let seed = 1; const R = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const today = () => { const d = new Date(); return d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate(); };
  // ---------- arenas ----------
  const ARENAS = [
    {k:'lake', n:'Frozen Lake', bg:'#e3f3ff', bg2:'#c9e6fa', slip:true, hz:'Slippery ice: you slide!', cover:[]},
    {k:'village', n:'Snowy Village', bg:'#f2f7fb', bg2:'#dfe9f2', icicles:true, hz:'Watch out for falling icicles!', cover:[{x:70, y:140, w:80, h:56, house:1}, {x:450, y:140, w:80, h:56, house:1}]},
    {k:'pass', n:'Mountain Pass', bg:'#edf2f6', bg2:'#d3dde6', aval:true, hz:'Avalanches roll down the mountain!', cover:[{x:250, y:120, w:100, h:40, rock:1}]},
    {k:'castle', n:'Ice Castle', bg:'#e6f0ff', bg2:'#c6d8f5', wind:true, hz:'Wind bends every throw!', cover:[{x:40, y:200, w:90, h:44, ice:1}, {x:470, y:200, w:90, h:44, ice:1}]},
  ];
  // ---------- enemies ----------
  const TYPES = {
    thrower: {hp:1, sp:55, cool:[2.8,2.3,1.9], col:'#FF4539', pts:50, cover:1},
    fast:    {hp:1, sp:110, cool:[1.9,1.5,1.2], col:'#F9BF01', pts:70},
    golem:   {hp:6, sp:30, cool:[3.2,2.8,2.4], col:'#e8f0f8', pts:150, big:1},
    flanker: {hp:2, sp:110, cool:[2.2,1.8,1.4], col:'#b48cff', pts:90, flank:1},
    builder: {hp:2, sp:60, cool:[3.2,2.8,2.4], col:'#64CDF5', pts:90, build:1},
    sniper:  {hp:2, sp:50, cool:[3.4,2.8,2.2], col:'#2f6a3a', pts:120, snipe:1, cover:1},
    sledder: {hp:2, sp:150, cool:[9,9,9], col:'#ff8a3c', pts:100, sled:1},
    medic:   {hp:2, sp:60, cool:[3,3,3], col:'#ffffff', pts:110, medic:1},
    catapult:{hp:4, sp:25, cool:[4.6,3.8,3.2], col:'#8D5B1D', pts:140, cat:1},
    iceman:  {hp:2, sp:80, cool:[2.6,2.2,1.8], col:'#7fe6ff', pts:100, ice:1},
  };
  const TNAME = {thrower:'Thrower', fast:'Speedy', golem:'Snow Golem', flanker:'Flanker', builder:'Builder', sniper:'Sniper', sledder:'Sledder', medic:'Medic', catapult:'Catapult crew', iceman:'Ice thrower'};
  const BOSSES = {yeti:{n:'THE YETI KING', hp:60, col:'#f4f8ff'}, plow:{n:'THE SNOWPLOW BOT', hp:70, col:'#ff8a3c'}, witch:{n:'THE BLIZZARD WITCH', hp:70, col:'#6a4ab8'}, dragon:{n:'THE FROST DRAGON', hp:150, col:'#9fe8ff'}};
  const MATE_NAMES = ['Maya', 'Leo', 'Ava', 'Sam', 'Zoe', 'Kai', 'Mia', 'Ben', 'Ivy', 'Max'];
  // ---------- state ----------
  let st = 'ready', mode = 'endless', phase = 'fight', me, foes = [], balls = [], walls = [], builds = [], mates = [], drops = [], fx = [], nums = [], prints = [];
  let score = 0, wave = 0, flakes = 0, t = 0, quiz = false, boss = null, arena = 0, pw = {icy:0, mega:0, rapid:0, shield:0}, msg = '', msgT = 0, shake = 0, combo = 0, comboT = 0, waveHurt = false, bossesBeat = 0;
  let aim = {x:300, y:150}, aiming = false, packing = false, packT = 0, mouseOn = false, tool = 0, guide = false, upOpen = false, white = 0, hazT = 0, haz = null, cheerT = 0, builtN = 0;
  const touch = {l:false, r:false, duck:false};
  const snow = []; for (let i = 0; i < 70; i++) snow.push({x:Math.random()*600, y:Math.random()*620, s:.5 + Math.random()});
  const D3 = a => A.D(a[0], a[1], a[2]);
  const say = (s2, d = 2.5) => { msg = s2; msgT = d; };
  const AR = () => ARENAS[arena % ARENAS.length];
  const armM = () => (1 + .15*PU('arm')) * (1 + .08*skR(PERM.cls, 0));
  const maxAmmo = () => 10 + 2*PU('pockets') + (CL().ammo || 0) + Math.round(2*gStat('pack'));
  const rollCD = () => 1.6 * (1 - .1*PU('rollcd'));
  const wallHp = k => ((k == 'reinforced' ? 16 : k == 'ice' ? 10 : 6) + 2*PU('walls')) * (PERM.cls == 'builder' ? 1.5 : 1);
  // ---------- setup ----------
  const startGame = m => { mode = m || mode; seed = mode == 'daily' ? today() : (Math.random()*1e9)|0;
    const hp = A.lives(A.D(6,5,4) + A.U('life') + PU('coat') + (CL().hp || 0) + skR(PERM.cls, 2) + (eqd('hat') ? Math.max(1, Math.round(gStat('hat')*.8)) : 0));
    me = {x:300, y:PY, vx:0, hp, max:hp, inv:0, duck:false, roll:0, rollCd:0, rdir:1, freeze:0, ammo:maxAmmo(), throwT:0, hitT:0, face:1, scoop:0, ab:0, shieldT:0, eye:0, cls:PERM.cls};
    balls = []; drops = []; builds = []; mates = []; fx = []; nums = []; score = 0; wave = 0; flakes = 20 + 15*PU('stash'); arena = mode == 'daily' ? today() % 4 : 0; pw = {icy:0, mega:0, rapid:0, shield:0}; boss = null; bossesBeat = 0; builtN = 0; combo = 0;
    walls = [{x:150, y:476, w:80, h:24, hp:wallHp('snow'), max:wallHp('snow'), mine:1, kind:'snow'}, {x:370, y:476, w:80, h:24, hp:wallHp('snow'), max:wallHp('snow'), mine:1, kind:'snow'}];
    for (let i = 0; i < Math.min(4, A.U('mate') + PU('mates') + lodgeN()); i++) addMate(['thrower', 'builder', 'medic'][i % 3]);
    rewarded = false; st = 'play'; nextWave(); api.score(0); };
  const lodgeLv = () => ((((PERM.ow || {}).base || {}).rooms || {}).lodge | 0), lodgeN = () => Math.min(3, lodgeLv()), lodgeUp = () => Math.max(0, lodgeLv() - 3);   // Snow Friends Lodge (Snow Kingdom base, Frost Crystals)
  const addMate = role => { if (mates.length >= 4) return false; const lv = 1 + PU('captain') + lodgeUp(); mates.push({name:MATE_NAMES[(mates.length + wave) % MATE_NAMES.length], role, lv, xp:0, x:80 + mates.length*140, y:PY + 6, hp:2 + lv, max:2 + lv, ko:false, rev:0, cool:1 + Math.random(), tx:0, duck:false, job:0}); return true; };
  const spawn = (k, x, y) => { const T = TYPES[k], hp = T.hp + Math.floor(wave/5) + Math.max(0, Math.floor((wave - 20)/2)); foes.push({k, x: x == null ? 60 + R()*480 : x, y: y == null ? 40 + R()*140 : y, hp, max:hp, cool:1 + R()*2, tx:0, ty:0, rt:0, slow:0, kb:0, kx:0, duck:false, dt:0, act:0}); };
  const bossFor = wv => mode == 'rush' ? ['yeti', 'plow', 'witch', 'dragon'][(wv - 1) % 4] : wv % 20 == 0 ? 'dragon' : ['yeti', 'plow', 'witch'][(wv/5 - 1) % 3];
  const nextWave = () => { wave++; foes = []; balls = []; phase = 'fight'; waveHurt = false; haz = null; hazT = 4 + R()*4;
    if (me && wave > 1 && PU('thermos')) me.hp = Math.min(me.max, me.hp + PU('thermos')); if (PU('shield')) pw.shield = 1;
    if (mode == 'endless' && (wave - 1) % 3 == 0 && wave > 1) { arena++; say('New arena: ' + AR().n + '! ' + AR().hz, 3.5); } else if (wave == 1) say(AR().n + ' · ' + AR().hz, 3);
    walls = walls.filter(W2 => W2.mine);   // enemy walls melt between waves
    // the enemy side always gets a little cover to hide behind
    const nW = 1 + Math.min(3, Math.floor(wave/3)); for (let i = 0; i < nW; i++) walls.push({x:40 + R()*440, y:170 + R()*70, w:70, h:20, hp:4 + Math.floor(wave/4), max:4 + Math.floor(wave/4), mine:0, kind:'snow'});
    const isBoss = mode == 'rush' || wave % 5 == 0;
    if (isBoss) { const k = bossFor(wave), B = BOSSES[k], sc = (1 + (wave/5 - 1)*.45) * A.D(.8, 1, 1.25) * (mode == 'rush' ? .7 + wave*.15 : 1);
      boss = {k, n:B.n, x:300, y:k == 'dragon' ? 118 : 100, hp:B.hp*sc, max:B.hp*sc, cool:2, vx:90, charge:0, col:B.col, ph:1, tp:0, kb:0}; say(B.n + ' appears!', 3); A.sfx('bad');
      for (let i = 0; i < 1 + Math.floor(wave/10); i++) spawn('thrower'); return; }
    const n = Math.min(12 + Math.floor(Math.max(0, wave - 15)/3), 22, 2 + Math.floor(wave*.8)), pool = ['thrower', 'thrower'];
    if (wave >= 2) pool.push('fast'); if (wave >= 3) pool.push('builder', 'sniper'); if (wave >= 4) pool.push('golem', 'flanker', 'sledder'); if (wave >= 6) pool.push('medic', 'iceman'); if (wave >= 8) pool.push('catapult', 'fast', 'flanker', 'golem'); if (wave >= 12) pool.push('catapult', 'sniper', 'iceman');
    for (let i = 0; i < n; i++) spawn(pool[Math.floor(R()*pool.length)]); };
  // ---------- throwing ----------
  // straight throw (enemies) and lob (you, teammates, turrets, catapults: flies over walls and lands on the target)
  const straight = (from, tx, ty, o) => { const d = Math.hypot(tx - from.x, ty - from.y) || 1, sp = o.sp || 300; balls.push({x:from.x, y:from.y, vx:(tx - from.x)/d*sp, vy:(ty - from.y)/d*sp, mine:o.mine, dmg:o.dmg || 1, r:o.r || 5, ice:o.ice, life:3}); };
  const lob = (from, tx, ty, o) => { const d = Math.hypot(tx - from.x, ty - from.y), sp = o.sp || 480, wind = AR().wind ? Math.sin(t*.4)*60 : 0;
    balls.push({lob:1, x0:from.x, y0:from.y - 20, x1:tx + (o.mine ? wind*d/600 : 0), y1:ty, t:0, T:Math.max(.35, d/sp), mine:o.mine, dmg:o.dmg || 1, r:o.r || 5, big:o.big, kind:o.kind || 'n', ice:o.ice, tur:o.tur, x:from.x, y:from.y, z:0, life:9}); };
  const nearestFoe = (x, y) => { let best = null, bd = 1e9; for (const f of foes) { const d = Math.hypot(f.x - x, f.y - y); if (d < bd) { bd = d; best = f; } } if (boss) { const d = Math.hypot(boss.x - x, boss.y - y); if (d < bd) best = boss; } return best; };
  const throwMine = () => { if (!me || me.ammo <= 0) { say('Out of snowballs! Stand on a ❄ snow pile or duck behind a wall to scoop more', 2); A.sfx('bad'); packing = false; packT = 0; return; }
    const p2 = Math.min(1, packT), small = packT < .12, nf = nearestFoe(me.x, me.y), tgt = mouseOn || aiming ? aim : nf ? {x:nf.x + Math.sign((nf.tx || nf.x) - nf.x)*20, y:nf.y} : {x:me.x, y:120};
    const bk = PERM.balls[PERM.ball] ? PERM.ball : 'snow'; if (bk == 'boulder' && me.ammo < 3) { say('The Mega Boulder needs 3 snowballs', 1.4); A.sfx('bad'); packing = false; packT = 0; return; }
    const crit = Math.random() < .05*PU('crit'), snipeM = !small && CL().snipe ? CL().snipe : 1, ballM = {snow:1, shard:.85, slush:.85, sparkle:.75, boomer:.7, boulder:4}[bk];
    const dmg = (small ? 1 : 1 + 2*p2) * armM() * (pw.mega > 0 ? 2 : 1) * (crit ? 2 : 1) * snipeM * ballM, r = (small ? 5 : 5 + 5*p2) + (pw.mega > 0 ? 3 : 0) + (bk == 'boulder' ? 8 : 0), sp = (small ? 760 : 640 - 220*p2) * (snipeM > 1 ? 1.3 : 1);
    if (bk == 'shard') { straight(me, tgt.x, Math.min(MID - 4, tgt.y), {mine:1, dmg, r:5, sp:620}); balls[balls.length - 1].pierce = 1; balls[balls.length - 1].shard = 1; }
    else lob(me, tgt.x, Math.min(MID - 4, tgt.y), {mine:1, dmg, r, sp:sp * (pw.rapid > 0 ? 1.3 : 1), big:p2 >= .6 || pw.mega > 0 || bk == 'boulder', kind:pw.mega > 0 || bk == 'sparkle' || bk == 'boulder' ? 'mega' : pw.icy > 0 || bk == 'slush' ? 'icy' : 'n'});
    if (bk == 'boomer' && balls.length) balls[balls.length - 1].boomer = 1; if (bk == 'boulder') me.ammo -= 2;
    if (crit) addNum(me.x, me.y - 50, 'LUCKY ×2!', '#F9BF01'); me.ammo--; me.throwT = .22; me.duck = false; packing = false; packT = 0; A.tone(small ? 640 : 420, .05, 'triangle', .04); };
  // ---------- class abilities (Q, F or the ⭐ button) ----------
  const abCd = () => CL().cd * (1 - .1*skR(PERM.cls, 1)) * (1 - .06*PU('abcd'));
  const useAbility = () => { if (!me || st != 'play' || phase != 'fight' || me.ab > 0 || me.freeze > 0) return; const C2 = CL(); me.ab = abCd(); A.sfx('win'); say('⭐ ' + C2.ab + '!', 1.6); cheerT = .6;
    if (PERM.cls == 'slinger') { const tg = mouseOn ? aim : (nearestFoe(me.x, me.y) || {x:300, y:120}); for (let k2 = -2; k2 <= 2; k2++) lob(me, tg.x + k2*40, Math.min(MID - 4, tg.y + Math.abs(k2)*10), {mine:1, dmg:1.5*armM(), r:7, sp:700, big:true}); }
    else if (PERM.cls == 'builder') { const y = Math.max(MID + 40, me.y - 70); walls.push({x:Math.max(10, Math.min(470, me.x - 60)), y:y - 14, w:120, h:28, hp:wallHp('snow')*1.5, max:wallHp('snow')*1.5, mine:1, kind:'snow', fort:1}); splat(me.x, y, 20); stat(api, 'snowBuild', 1, 'add'); }
    else if (PERM.cls == 'medic') { me.hp = Math.min(me.max, me.hp + 2); addNum(me.x, me.y - 40, '+2 ♥', '#00B451'); for (const m of mates) { if (Math.hypot(m.x - me.x, m.y - me.y) < 220) { if (m.ko) m.ko = false; m.hp = m.max; addNum(m.x, m.y - 30, '+♥', '#00B451'); } } }
    else if (PERM.cls == 'tank') { me.shieldT = 4; }
    else if (PERM.cls == 'sniper') { me.eye = 6; white = 0; }
    else if (PERM.cls == 'trapper') { shake = .5; for (const f of foes) { f.y = Math.max(30, f.y - 120); f.ty = f.y; f.slow = 3; f.kb = .4; f.hp -= 1; if (f.hp <= 0) killFoe(f); } if (boss) hitBoss(3, boss.x, boss.y); splat(300, 200, 40); } };
  // ---------- hurting ----------
  const hurtMe = (dmg, ice) => { if (!me || me.inv > 0 || me.roll > 0 || me.shieldT > 0 || A.immortal) return; if (Math.random() < .06*PU('armor')) { me.inv = .4; addNum(me.x, me.y - 40, 'Shrugged off!', '#2f8ad8'); return; } if (pw.shield > 0) { pw.shield = 0; me.inv = .6; A.tone(900,.1,'sine',.05); return; }
    me.hp -= dmg; me.inv = .8; me.hitT = .3; waveHurt = true; shake = Math.max(shake, .15); A.sfx('bad'); if (ice) { me.freeze = 1 * (1 - Math.min(.8, .12*gStat('scarf'))); if (me.freeze > .25) say('🥶 Frozen for a moment!', 1.2); }
    if (me.hp <= 0) { quiz = learn2(host, api, 'SPLAT! ANSWER TO SHAKE OFF THE SNOW', () => { quiz = false; me.hp = Math.ceil(me.max/2); me.inv = 2; }, () => { quiz = false; gameOver(); }); } };
  let rewarded = false;
  const endRewards = () => { if (rewarded) return 0; rewarded = true; stat(api,'snowWave',wave,'max'); const cr = Math.floor(wave*1.5 + bossesBeat*5); PERM.cr += cr; PERM.bank += Math.floor(flakes/2); PERM.best = Math.max(PERM.best, wave); savePerm(); return cr; };
  A.onCash = A.onCash || {}; A.onCash.snowball = () => { if (st == 'play' && wave > 0) { const cr = endRewards(); A.toast && A.toast('+' + cr + ' ice crystals · +' + Math.floor(flakes/2) + ' banked snowflakes'); } };
  const gameOver = () => { st = 'over'; A.sfx('over'); const cr = endRewards(); say('+' + cr + ' 🧊 ice crystals for permanent upgrades', 5); api.over(score); };
  const addNum = (x, y, txt, col) => { if (nums.length < 40) nums.push({x, y, txt, col:col || '#14204a', t:1}); };
  const splat = (x, y, n, col) => { const k = low() ? Math.ceil(n/3) : n; for (let i = 0; i < k; i++) fx.push({x, y, vx:(Math.random() - .5)*160, vy:(Math.random() - .8)*140, t:.5 + Math.random()*.3, col:col || '#ffffff', r:1.5 + Math.random()*2.5}); };
  const killFoe = f => { if (f.dead) return; f.dead = 1; const T = TYPES[f.k]; score += T.pts + wave*10; flakes += Math.round(10*(1 + .1*PU('flakes'))); api.score(score); splat(f.x, f.y, 14);
    const r = Math.random(), cocoa = .2 + .04*PU('mitts');
    if (r < cocoa) drops.push({x:Math.max(30, Math.min(570, f.x)), y:MID + 20, vy:60, k:'cocoa', life:14});
    else if (r < cocoa + .2) drops.push({x:Math.max(30, Math.min(570, f.x)), y:MID + 20, vy:60, k:['icy','mega','rapid','shield'][Math.floor(Math.random()*4)], life:12}); };
  const hitBoss = (dmg, x, y, quiet) => { if (!boss) return; dmg *= 1 + .1*PU('boss'); boss.hp -= dmg; boss.kb = .15; if (!quiet) addNum(x, y - 30, '-' + Math.round(dmg*10)/10, '#FF4539');
    const ph = boss.hp < boss.max/3 ? 3 : boss.hp < boss.max*2/3 ? 2 : 1; if (ph > boss.ph) { boss.ph = ph; say(boss.n + (ph == 2 ? ' gets angry!' : ' goes WILD!'), 2.5); shake = .4; A.sfx('bad'); }
    if (boss.hp <= 0) { score += 1500 + wave*100; flakes += 80; bossesBeat++; PERM.bosses++; { const fr = 10 + Math.floor(wave/2) + PU('frost'); PERM.frost += fr; const it = makeGear(2); setTimeout(() => say('🎁 ' + GRAR[it.rar].n + ' gear: ' + it.name + ' · +' + fr + ' ❄ Frost Crystals', 3.5), 2600); PERM.cx[PERM.cls] = clsXp(PERM.cls) + 60; } api.score(score); A.sfx('win'); stat(api,'snowBoss',1,'add'); say(boss.n + ' is defeated!', 3); shake = .5; splat(boss.x, boss.y, 40); boss = null; } };
  // ---------- build menu ----------
  const TOOLS = [{k:'wall', n:'Wall', e:'🧱', cost:10}, {k:'upgrade', n:'Upgrade wall', e:'⬆', cost:15}, {k:'fort', n:'Snow fort', e:'🏰', cost:40}, {k:'turret', n:'Turret', e:'🎯', cost:35},
    {k:'pit', n:'Trap pit', e:'🕳', cost:20}, {k:'ice', n:'Ice patch', e:'🧊', cost:15}, {k:'fire', n:'Campfire', e:'🔥', cost:40}, {k:'repair', n:'Repair all', e:'🔧', cost:0},
    {k:'cocoa', n:'Warm Up +♥', e:'☕', cost:15}, {k:'mate', n:'Teammate', e:'🧒', cost:0}, {k:'role', n:'Mate role', e:'🔁', cost:0}, {k:'undo', n:'Undo (Z)', e:'↩', cost:0}, {k:'remove', n:'Remove', e:'🗑', cost:0}, {k:'go', n:'Next wave', e:'▶', cost:0}];
  const PLACE = ['wall', 'fort', 'turret', 'pit', 'ice', 'fire', 'upgrade', 'remove']; let placed = [], freeTrap = {};   // what you built this break, newest last (for Undo); the Trapper's free pit + ice each break
  const toolCost = k => (PERM.cls == 'builder' && ['wall', 'fort', 'turret', 'pit', 'ice', 'fire', 'upgrade'].includes(k) ? .7 : 1) * (PERM.cls == 'trapper' && freeTrap[k] ? 0 : 1) * toolCost0(k);
  const toolCost0 = k => k == 'repair' ? walls.filter(W2 => W2.mine).reduce((a, W2) => a + Math.ceil(W2.max - W2.hp), 0) * 2 : k == 'mate' ? (mates.length >= 4 ? Infinity : 40 + mates.length*40) : (TOOLS.find(T2 => T2.k == k) || {cost:0}).cost;
  // the wall under your finger: one whose box contains the tap wins (the last drawn is on top), otherwise the nearest one close by
  const pickWall = (x, y) => { let best = null, bd = 1e9; walls.forEach((W3, i) => { if (!W3.mine || W3.hp <= 0) return; const dx = Math.max(W3.x - x, 0, x - (W3.x + W3.w)), dy = Math.max(W3.y - y, 0, y - (W3.y + W3.h)), d = Math.hypot(dx, dy) - i*1e-6; if (d < 30 && d < bd) { bd = d; best = W3; } }); return best; };
  const CAPS = {wall:12, fort:12, turret:6, pit:6, ice:6};
  const capN = k => k == 'wall' || k == 'fort' ? walls.filter(W3 => W3.mine).length : builds.filter(B3 => B3.k == k).length;
  const useTool = (k, x, y) => { if (k == 'go') { placed = []; nextWave(); return; } const cost = toolCost(k);
    if (k == 'undo') { const last = placed.pop(); if (!last) return say('Nothing to undo'); if (last.up) { last.ref.kind = last.up.kind; last.ref.max = last.up.max; last.ref.hp = Math.min(last.ref.hp, last.ref.max); } else { walls = walls.filter(W2 => W2 !== last.ref); builds = builds.filter(B2 => B2 !== last.ref); } flakes += last.cost; A.sfx('blip'); say('↩ Undone · +' + last.cost + ' ❄ back', 1.4); return; }
    if (k == 'remove') { y = y == null ? me.y - 60 : y; x = x == null ? me.x : x; const W2 = pickWall(x, y), B2 = !W2 && builds.slice().sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y)).find(B3 => Math.hypot(B3.x - x, B3.y - y) < 44);
      const it = W2 || B2; if (!it) return say('Tap one of your walls or buildings to remove it'); const was = placed.find(p2 => p2.ref === it && !p2.up); const back = was ? was.cost : Math.floor(((TOOLS.find(T2 => T2.k == (W2 ? (W2.fort ? 'fort' : 'wall') : B2.k)) || {cost:10}).cost) / 2);
      walls = walls.filter(W3 => W3 !== it); builds = builds.filter(B3 => B3 !== it); placed = placed.filter(p2 => p2.ref !== it); flakes += back; A.sfx('blip'); say('🗑 Removed · +' + back + ' ❄ back', 1.4); return; }
    if (k == 'role') { const m = mates.find(m2 => !m2.ko && m2.role == 'thrower') || mates[0]; if (!m) return say('Hire a teammate first'); const order = ['thrower', 'builder', 'medic']; m.role = order[(order.indexOf(m.role) + 1) % 3]; say(m.name + ' is now a ' + m.role, 1.6); return; }
    if (!isFinite(cost)) return say('Your team is full (4)!'); if (flakes < cost) { A.sfx('bad'); say('Need ' + cost + ' ❄'); return; }
    if (k == 'repair') { if (!cost) return say('Your walls are fine!'); walls.forEach(W2 => { if (W2.mine) W2.hp = W2.max; }); }
    else if (k == 'cocoa') { if (me.hp >= me.max) return say('Your hearts are full!'); me.hp = Math.min(me.max, me.hp + 1); say('☕ Warm cocoa: +1 heart', 1.4); }
    else if (k == 'mate') { const role = ['thrower', 'builder', 'medic'][mates.length % 3]; addMate(role); say('Hired ' + mates[mates.length - 1].name + ' the ' + role + '!', 2); }
    else { const x0 = x, y0 = y; y = Math.max(MID + 30, Math.min(PY - 50, y)); x = Math.max(30, Math.min(570, x));
      if (CAPS[k] && capN(k) >= CAPS[k]) { A.sfx('bad'); return say('Max ' + CAPS[k] + ' ' + (k == 'wall' || k == 'fort' ? 'walls and forts' : k == 'turret' ? 'turrets' : k == 'pit' ? 'trap pits' : 'ice patches') + '! Upgrade or remove one to build more', 2.2); }
      if (k == 'upgrade') { const W2 = pickWall(x0, y0); if (!W2) return say('Tap one of your walls to upgrade it'); if (W2.kind == 'reinforced') return say('That wall is already reinforced!');
        placed.push({ref:W2, cost, up:{kind:W2.kind, max:W2.max}}); W2.kind = W2.kind == 'snow' ? 'ice' : 'reinforced'; const m = wallHp(W2.kind); W2.max = W2.fort ? m*1.5 : m; W2.hp = W2.max; say('Upgraded to ' + (W2.kind == 'ice' ? 'an ice wall' : 'a reinforced wall') + '!', 1.6); }
      else if (k == 'wall') { walls.push({x:x - 40, y:y - 12, w:80, h:24, hp:wallHp('snow'), max:wallHp('snow'), mine:1, kind:'snow'}); placed.push({ref:walls[walls.length - 1], cost}); }
      else if (k == 'fort') { walls.push({x:x - 60, y:y - 14, w:120, h:28, hp:wallHp('snow')*1.5, max:wallHp('snow')*1.5, mine:1, kind:'snow', fort:1}); placed.push({ref:walls[walls.length - 1], cost}); }
      else if (k == 'fire') { if (builds.some(b => b.k == 'fire')) return say('Only one campfire at a time · remove it to move it'); builds.push({k, x, y:Math.max(y, PY - 60), hp:4}); placed.push({ref:builds[builds.length - 1], cost}); }
      else { builds.push({k, x, y, hp:k == 'turret' ? 5 : 3, cool:1, r:k == 'pit' ? 26 : 40}); placed.push({ref:builds[builds.length - 1], cost}); if (freeTrap[k]) freeTrap[k] = 0; } builtN++; stat(api, 'snowBuild', 1, 'add'); }
    flakes -= cost; A.sfx('coin'); };
  // ---------- input ----------
  // ---------- Class & skills / Loadout & gear panels (HTML, scrollable) ----------
  let panelEl = null;
  const closePanelS = () => { if (panelEl) { panelEl.remove(); panelEl = null; } };
  const openPanel = tab => { closePanelS(); const el = A.el; panelEl = el('div', {position:'absolute', left:'0', top:'0', width:'600px', height:'720px', background:'rgba(10,20,50,.97)', color:'#fff', zIndex:6, display:'flex', flexDirection:'column', padding:'14px', boxSizing:'border-box', font:'600 14px '+A.font});
    panelEl.addEventListener('pointerdown', e => e.stopPropagation()); host.style.position = host.style.position || 'relative'; host.appendChild(panelEl);
    const top = el('div', {display:'flex', gap:'6px', alignItems:'center', marginBottom:'8px'}); panelEl.appendChild(top);
    const B = (txt, fn, bg, fg) => { const b = el('button', {background:bg || '#3f8fd8', color:fg || '#fff', border:'none', borderRadius:'999px', padding:'7px 12px', font:'800 13px '+A.font, cursor:'pointer'}, txt); b.onclick = e => { e.stopPropagation(); fn(); }; return b; };
    [['class', '🎽 Class & skills'], ['loadout', '🎒 Loadout & gear']].forEach(([k, n]) => top.appendChild(B(n, () => openPanel(k), tab == k ? '#D5F367' : 'rgba(255,255,255,.14)', tab == k ? '#14204a' : '#fff')));
    const x = B('✕ Done', closePanelS, '#ffffff', '#14204a'); x.style.marginLeft = 'auto'; top.appendChild(x);
    const body = el('div', {overflowY:'auto', flex:'1', display:'flex', flexDirection:'column', gap:'8px'}); panelEl.appendChild(body);
    const card = () => { const r = el('div', {background:'rgba(255,255,255,.07)', borderRadius:'12px', padding:'10px 12px', display:'flex', flexDirection:'column', gap:'6px'}); body.appendChild(r); return r; };
    if (tab == 'class') { CLS_K.forEach(k => { const C2 = CLASSES[k], on = PERM.cls == k, r = card(); if (on) r.style.boxShadow = 'inset 0 0 0 2px #D5F367';
        const h = el('div', {display:'flex', alignItems:'center', gap:'8px'}); h.appendChild(el('div', {font:'800 17px '+A.font, color:on ? '#D5F367' : '#fff', flex:'1'}, C2.e + ' ' + C2.n + ' · Lv ' + clsLv(k) + (on ? ' · playing' : ''))); if (!on) h.appendChild(B('Pick', () => { PERM.cls = k; savePerm(); openPanel('class'); }, '#00B451')); r.appendChild(h);
        r.appendChild(el('div', {font:'500 12px '+A.font, color:'#cfe3f5'}, C2.d + ' · ⭐ ' + C2.ab + ': ' + C2.abD + ' (every ' + Math.round(C2.cd*(1 - .1*skR(k, 1))) + ' s)'));
        const nx = Math.pow(clsLv(k), 2)*60; r.appendChild(el('div', {font:'600 11px '+A.font, color:'#9fe8ff'}, 'Class XP ' + clsXp(k) + (clsLv(k) < 30 ? ' / ' + nx + ' for the next level' : ' (max level)') + ' · ' + skFree(k) + ' skill point' + (skFree(k) == 1 ? '' : 's') + ' to spend'));
        const tr = el('div', {display:'flex', gap:'6px', flexWrap:'wrap'}); BRANCH[k].forEach((bn, bi) => { const rk = skR(k, bi), can = skFree(k) > 0 && rk < 3; const b = B(bn + ' ' + '●'.repeat(rk) + '○'.repeat(3 - rk), () => { if (!can) { A.sfx('bad'); return; } PERM.sk[k] = PERM.sk[k] || {}; PERM.sk[k][bi] = rk + 1; savePerm(); A.sfx('coin'); openPanel('class'); }, can ? '#3f8fd8' : 'rgba(255,255,255,.1)'); b.title = ['+8% snowball damage per rank', 'Ability comes back 10% sooner per rank', '+1 heart per rank'][bi]; tr.appendChild(b); }); r.appendChild(tr);
        r.appendChild(el('div', {font:'500 11px '+A.font, color:'#8fb9c9'}, 'Branches: ' + BRANCH[k][0] + ' +8% damage · ' + BRANCH[k][1] + ' −10% ability cooldown · ' + BRANCH[k][2] + ' +1 heart (each up to 3 ranks)')); }); }
    if (tab == 'loadout') { const r0 = card(); r0.appendChild(el('div', {font:'800 15px '+A.font, color:'#D5F367'}, '🔷 ' + A.fmt(PERM.frost) + ' Frost Crystals · ❄ ' + A.fmt(PERM.bank) + ' banked snowflakes (half of what you have left at the end of each game) · 🧊 ' + A.fmt(PERM.cr) + ' ice crystals'));
      const cr0 = el('div', {display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap'}); const inp = el('input', {flex:'1', minWidth:'140px', padding:'7px 10px', borderRadius:'999px', border:'none', font:'700 13px '+A.font}); inp.placeholder = 'Have a reward code?'; inp.addEventListener('keydown', e => e.stopPropagation());
      const cmsg = el('div', {font:'600 12px '+A.font, color:'#9fe8ff'}); cr0.appendChild(inp); cr0.appendChild(B('Redeem', () => redeem(inp.value, m => { cmsg.textContent = m; }), '#00B451')); r0.appendChild(cr0); r0.appendChild(cmsg);
      const rb = card(); rb.appendChild(el('div', {font:'800 15px '+A.font}, 'Special snowball')); const bw = el('div', {display:'flex', gap:'6px', flexWrap:'wrap'}); rb.appendChild(bw);
      Object.keys(BALLS).forEach(k => { const BL = BALLS[k], have = PERM.balls[k], on = PERM.ball == k; const b = B(BL.e + ' ' + BL.n + (have ? '' : ' · 🔷 ' + BL.cost), () => { if (!have) { if (PERM.frost < BL.cost) { A.sfx('bad'); return; } PERM.frost -= BL.cost; PERM.balls[k] = 1; } PERM.ball = k; savePerm(); A.sfx('coin'); openPanel('loadout'); }, on ? '#D5F367' : have ? '#3f8fd8' : 'rgba(255,255,255,.12)', on ? '#14204a' : '#fff'); b.title = BL.d; bw.appendChild(b); });
      rb.appendChild(el('div', {font:'500 12px '+A.font, color:'#cfe3f5'}, (BALLS[PERM.ball] || BALLS.snow).d));
      { const fl = ((PERM.ow && PERM.ow.base && PERM.ow.base.rooms) || {}).forge | 0, fc = el('div'), fr = card(); fr.appendChild(el('div', {font:'800 15px '+A.font}, '⚒️ Forge · ' + (fl ? 'Forge level ' + fl + ': ' + GRAR[Math.min(5, 1 + Math.floor(fl/3))].n + ' to ' + GRAR[Math.min(5, 1 + fl)].n + ' (Snow grade is fusing only)' : 'no Forge yet (build one at your Ice Fort in the Snow Kingdom for rarer gear)')));
        const fw = el('div', {display:'flex', gap:'6px', flexWrap:'wrap'}); fr.appendChild(fw); const cost = 25;
        Object.keys(GSLOT).forEach(sl => { const ok = PERM.frost >= cost; fw.appendChild(B('Forge ' + GSLOT[sl].e + ' ' + GSLOT[sl].n + ' · ' + cost + ' 🔷', () => { if (!ok) { A.sfx('bad'); return; } PERM.frost -= cost; const r1 = Math.min(5, 1 + Math.floor(fl/3)), r2 = Math.min(5, 1 + fl), it = makeGear(fl ? r1 + Math.floor(Math.random()*(r2 - r1 + 1)) : 0, sl); savePerm(); A.sfx('coin'); fmsg = '⚒️ Forged ' + it.name + ' (' + GRAR[it.rar].n + ')'; openPanel('loadout'); }, ok ? '#3f8fd8' : 'rgba(255,255,255,.1)')); });
        const fz = el('div', {display:'flex', gap:'6px', flexWrap:'wrap'}); fr.appendChild(el('div', {font:'600 12px '+A.font, color:'#cfe3f5'}, 'Fuse: 3 spare pieces of the same slot and rarity become 1 piece one rarity higher (free), Mythic, and then ❄ Snow, the highest tier (3 Mythics make 1 Snow). ⚡ Fuse ALL keeps fusing until nothing is left to fuse.')); fr.appendChild(fz);
        Object.keys(GSLOT).forEach(sl => { for (let r = 0; r < GRAR.length - 1; r++) { const spare = PERM.gear.filter(x => x.slot == sl && x.rar == r).sort((a, b) => (PERM.eq[sl] == a.id) - (PERM.eq[sl] == b.id) || a.lv - b.lv); if (spare.length < 3) continue;
          fz.appendChild(B('Fuse 3 ' + GRAR[r].n + ' ' + GSLOT[sl].e + ' → ' + GRAR[r + 1].n, () => { const use = spare.slice(0, 3), wasEq = use.some(x => PERM.eq[sl] == x.id); PERM.gear = PERM.gear.filter(x => !use.includes(x)); const it = makeGear(r + 1, sl); it.rar = r + 1; if (wasEq) PERM.eq[sl] = it.id; savePerm(); A.sfx('win'); fmsg = '✨ Fused into ' + it.name + ' (' + GRAR[it.rar].n + ')'; openPanel('loadout'); }, '#00B451')); } });
        if (!fz.children.length) fz.appendChild(el('div', {font:'500 11px '+A.font, color:'#8fb9c9'}, 'Nothing to fuse yet.'));
        else fz.prepend(B('⚡ Fuse ALL the way up (to ❄ Snow)', () => { let n = 0, top = -1, go = true; while (go) { go = false; Object.keys(GSLOT).forEach(sl => { for (let r = 0; r < GRAR.length - 1; r++) { const spare = PERM.gear.filter(x => x.slot == sl && x.rar == r).sort((a, b) => (PERM.eq[sl] == a.id) - (PERM.eq[sl] == b.id) || a.lv - b.lv); while (spare.length >= 3) { const use = spare.splice(0, 3), wasEq = use.some(x => PERM.eq[sl] == x.id); PERM.gear = PERM.gear.filter(x => !use.includes(x)); const e0 = PERM.eq[sl]; const it = makeGear(r + 1, sl); if (wasEq) PERM.eq[sl] = it.id; else if (e0 == null) delete PERM.eq[sl]; else PERM.eq[sl] = e0; it.rar = r + 1; n++; top = Math.max(top, it.rar); go = true; if (it.rar == r + 1 && r + 1 < 5) { /* the new piece can fuse again next round */ } } } }); }
          Object.keys(GSLOT).forEach(sl => { if (PERM.eq[sl] == null || !PERM.gear.some(x => x.id == PERM.eq[sl])) { const best = PERM.gear.filter(x => x.slot == sl).sort((a, b) => b.rar - a.rar || b.lv - a.lv)[0]; if (best) PERM.eq[sl] = best.id; } });
          savePerm(); A.sfx('win'); fmsg = '⚡ ' + n + ' fusion' + (n == 1 ? '' : 's') + (top >= 0 ? ' · best result: ' + GRAR[top].n : ''); openPanel('loadout'); }, '#F9BF01', '#14204a'));
        if (fmsg) { fr.appendChild(el('div', {font:'800 13px '+A.font, color:'#D5F367'}, fmsg)); fmsg = ''; } }
      Object.keys(GSLOT).forEach(sl => { const S2 = GSLOT[sl], cur = eqd(sl), r = card(); r.appendChild(el('div', {font:'800 15px '+A.font}, S2.e + ' ' + S2.n + ' · ' + S2.stat));
        const items = PERM.gear.filter(x => x.slot == sl).sort((a, b) => b.rar - a.rar || b.lv - a.lv); if (!items.length) r.appendChild(el('div', {font:'500 12px '+A.font, color:'#8fb9c9'}, 'No ' + S2.n.toLowerCase() + ' yet: gear drops from bosses and every few waves.'));
        items.forEach(it => { const row = el('div', {display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap'}), on = cur && cur.id == it.id, uc = gUpCost(it);
          const nm = el('div', {flex:'1', minWidth:'200px'}); nm.appendChild(el('div', {font:'800 13px '+A.font, color:GRAR[it.rar].c, textShadow:GRAR[it.rar].snow ? '0 0 8px #7fe6ff, 0 0 2px #fff' : ''}, (GRAR[it.rar].snow ? '❄ ' : '') + it.name + (it.lv ? ' +' + it.lv : ''))); nm.appendChild(el('div', {font:'500 11px '+A.font, color:'#cfe3f5'}, GRAR[it.rar].n + ' · ' + gearTxt(it))); row.appendChild(nm);
          row.appendChild(B(on ? 'Equipped' : 'Equip', () => { PERM.eq[sl] = it.id; savePerm(); openPanel('loadout'); }, on ? '#D5F367' : '#00B451', on ? '#14204a' : '#fff'));
          const can = PERM.bank >= uc.flakes && PERM.frost >= uc.frost && it.lv < 10; row.appendChild(B(it.lv >= 10 ? 'MAX' : 'Upgrade · ' + A.fmt(uc.flakes) + ' ❄ + ' + uc.frost + ' 🔷', () => { if (!can) { A.sfx('bad'); return; } PERM.bank -= uc.flakes; PERM.frost -= uc.frost; it.lv++; savePerm(); A.sfx('coin'); openPanel('loadout'); }, can ? '#3f8fd8' : 'rgba(255,255,255,.1)'));
          if (!on) row.appendChild(B('Salvage +' + (it.rar + 1) + ' 🔷', () => { PERM.gear = PERM.gear.filter(x => x !== it); PERM.frost += it.rar + 1; savePerm(); openPanel('loadout'); }, 'rgba(255,255,255,.1)')); r.appendChild(row); }); }); } };
  let fmsg = '';
  const CODES = {'3ebf1e1837e7cc2aea800115abcc82b95d7f865f2a2cd342b1589a4b8ec4f93c':{cr:62, bank:226, n:'the wave 25 run that cashed out without its rewards'}};
  const redeem = async (code, show) => { try { const hb = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(code).trim().toLowerCase())), hx = [...new Uint8Array(hb)].map(b2 => b2.toString(16).padStart(2, '0')).join(''), RW = CODES[hx];
      PERM.codes = PERM.codes || {}; if (!RW) { A.sfx('bad'); return show('That code doesn’t work.'); } if (PERM.codes[hx]) { A.sfx('bad'); return show('You already used that code.'); }
      PERM.codes[hx] = 1; PERM.cr += RW.cr || 0; PERM.bank += RW.bank || 0; PERM.frost += RW.frost || 0; savePerm(); A.sfx('win'); show('🎉 +' + (RW.cr || 0) + ' ice crystals, +' + (RW.bank || 0) + ' banked snowflakes for ' + RW.n + '!'); setTimeout(() => panelEl && openPanel('loadout'), 1800); } catch(e) { show('Could not check the code here. Try again.'); } };
  const inBar = q => q.y > BAR;
  const barBtn = q => { const cols = phase == 'build' ? 7 : 5, row = phase == 'build' ? Math.floor((q.y - BAR) / 50) : 0, col = Math.floor(q.x / (600/cols)); return row*cols + col; };
  const MENU = [['world', '🗺 Kingdom Quest · open world'], ['endless', '♾ Endless Waves'], ['rush', '👑 Boss Rush'], ['daily', '📅 Daily Challenge'], ['class', '🎽 Class & skills'], ['loadout', '🎒 Loadout & gear'], ['up', '🧊 Upgrades'], ['guide', '❓ How to play']];
  const menuHit = q => { for (let i = 0; i < MENU.length; i++) { const bx = 150, by = 210 + i*54; if (q.x > bx && q.x < bx + 300 && q.y > by && q.y < by + 48) return MENU[i][0]; } return null; };
  const upBox = i => ({x:i < 12 ? 12 : 304, y:108 + (i % 12)*43}); const upHit = q => { for (let i = 0; i < PUPS.length; i++) { const B2 = upBox(i); if (q.x > B2.x && q.x < B2.x + 284 && q.y > B2.y && q.y < B2.y + 40) return PUPS[i]; } return q.y > 640 && q.y < 690 ? 'close' : null; };
  // ---------- Kingdom Quest: the open world lives in snow-world.js and borrows this canvas, your class and your gear ----------
  let wm = null;
  const openWorld = () => { if (!A.snowWorld) { say('The Snow Kingdom is still loading, try again in a second'); return; } closePanelS();
    wm = A.snowWorld({host, api, c, K, PERM, savePerm, stat:(k2, v, m2) => stat(api, k2, v, m2), learn2:(t2, y2, n2) => learn2(host, api, t2, y2, n2), PU,
      maxHp:() => Math.max(1, Math.floor(A.D(6,5,4) + A.U('life') + PU('coat') + (CL().hp || 0) + skR(PERM.cls, 2) + (eqd('hat') ? Math.max(1, Math.round(gStat('hat')*.8)) : 0))),   // no heart cap in the Snow Kingdom
      maxAmmo, armM, CL, abCd, gStat, makeGear, lv:() => clsLv(PERM.cls), addXp:n => { PERM.cx[PERM.cls] = clsXp(PERM.cls) + n; stat(api, 'snowClass_' + PERM.cls, clsLv(PERM.cls), 'max'); }, crit:() => PU('crit'), ballK:() => PERM.ball,
      spd:() => (1 + .05*A.U('boots')) * (1 + .08*PU('boots')) * (1 + .05*gStat('boots')) * (CL().slow || 1), scoop:() => (1 + .12*PU('scoop')) * (1 + .2*PU('machine')), mates:() => ({n:Math.min(4, A.U('mate') + PU('mates') + lodgeN()), lv:1 + PU('captain') + lodgeUp(), names:MATE_NAMES}), exit:() => { wm = null; st = 'ready'; mode = 'endless'; }});
    st = 'world'; mode = 'world'; A.sfx('win'); };
  const onMenu = k => { if (k == 'world') { openWorld(); return; } if (k == 'guide') { guide = true; return; } if (k == 'up') { upOpen = true; return; } if (k == 'class' || k == 'loadout') { openPanel(k); return; } if (k) startGame(k); };
  const offK = A.keys(e => { if (wm) { wm.key(e); return; } if (guide) { guide = false; return; } if (upOpen) { if (e.key == 'Escape' || e.key == 'Enter' || e.key == ' ') upOpen = false; return; }
    if ((e.key == ' ' || e.key == 'Enter') && st != 'play' && !quiz) { if (__skip) { __skip = false; st = 'play'; return; } startGame(mode); return; } if (st != 'play') return;
    if (e.key == 'h' || e.key == 'H' || e.key == '?') { guide = true; return; }
    if (phase == 'build') { if (e.key == 'z' || e.key == 'Z') { useTool('undo'); return; } const n = e.key == '0' ? 10 : +e.key; if (n >= 1 && n <= TOOLS.length) { tool = n - 1; if (!PLACE.includes(TOOLS[tool].k)) useTool(TOOLS[tool].k); } if (e.key == 'Enter') nextWave(); if (e.key == ' ' && PLACE.includes(TOOLS[tool].k)) useTool(TOOLS[tool].k, me.x, me.y - 70); return; }
    if (['q', 'Q', 'f', 'F'].includes(e.key)) { useAbility(); return; }
    if ((e.key == 'e' || e.key == 'E') && me.rollCd <= 0 && !me.freeze) { me.roll = .3; me.rollCd = rollCD(); me.rdir = me.face; A.tone(300, .06, 'sine', .04); } });
  let lastTapX = -99, lastTapT = -9;
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h); if (wm) { wm.down(q, e); return; } aim = q; mouseOn = true;
    if (guide) { guide = false; return; } if (upOpen) { const u = upHit(q); if (u == 'close') upOpen = false; else if (u && (u.max == null || PU(u.k) < u.max) && PERM.cr >= pcost(u)) { PERM.cr -= pcost(u); PERM.up[u.k] = PU(u.k) + 1; savePerm(); A.sfx('coin'); } else if (u) A.sfx('bad'); return; }
    if (st != 'play') { if (quiz) return; if (__skip) { __skip = false; st = 'play'; return; } onMenu(menuHit(q) || (st == 'over' ? null : null)); return; }
    if (q.x > 548 && q.y < 44) { guide = true; return; }
    if (phase == 'build') { if (inBar(q)) { const i = barBtn(q); if (i < TOOLS.length) { tool = i; if (!PLACE.includes(TOOLS[i].k)) useTool(TOOLS[i].k); } return; } if (q.y > MID) useTool(TOOLS[tool].k, q.x, q.y); return; }
    if (inBar(q)) { const i = barBtn(q); if (i == 0) touch.l = true; else if (i == 1) touch.r = true; else if (i == 2) touch.duck = true; else if (i == 3 && me.rollCd <= 0) { me.roll = .3; me.rollCd = rollCD(); me.rdir = me.face; } else if (i == 4) useAbility(); return; }
    if (q.y < MID) { aiming = true; packing = true; packT = 0; return; }
    // tap your own side to walk there (double tap = dodge roll)
    if (t - lastTapT < .3 && Math.abs(q.x - lastTapX) < 60 && me.rollCd <= 0) { me.roll = .3; me.rollCd = rollCD(); me.rdir = q.x > me.x ? 1 : -1; } lastTapT = t; lastTapX = q.x; me.tx = q.x; me.ty = q.y; });
  c.addEventListener('pointermove', e => { const q = pt(c, e, w, h); if (wm) { wm.move(q, e); return; } if (q.y < MID || aiming) aim = q; mouseOn = true; if (e.buttons && st == 'play' && phase == 'fight' && q.y >= MID && !aiming && !inBar(q)) { me.tx = q.x; me.ty = q.y; } });
  const pu = () => { touch.l = touch.r = touch.duck = false; if (aiming && packing && st == 'play' && phase == 'fight') throwMine(); aiming = false; };
  c.addEventListener('pointerup', e => { if (wm) { wm.up(e); return; } pu(); }); c.addEventListener('pointercancel', e => { if (wm) { wm.up(e); return; } touch.l = touch.r = touch.duck = false; aiming = false; packing = false; packT = 0; });
  c.addEventListener('pointerleave', () => { mouseOn = false; });
  let spaceWas = false; const duckK = {};
  const dkd = e => { if (['ShiftLeft', 'ShiftRight', 'KeyC'].includes(e.code)) duckK[e.code] = true; }, dku = e => { if (['ShiftLeft', 'ShiftRight', 'KeyC'].includes(e.code)) duckK[e.code] = false; }, dbl = () => { for (const k in duckK) duckK[k] = false; touch.l = touch.r = touch.duck = false; for (const k in K.k) K.k[k] = false; };
  window.addEventListener('keydown', dkd); window.addEventListener('keyup', dku); window.addEventListener('blur', dbl);
  // ---------- helpers ----------
  const covering = (x, y) => walls.find(W2 => W2.mine && W2.hp > 0 && x > W2.x - 8 && x < W2.x + W2.w + 8 && W2.y < y && y - W2.y < 110);
  const enemyCover = f => walls.find(W2 => !W2.mine && W2.hp > 0 && f.x > W2.x - 6 && f.x < W2.x + W2.w + 6 && f.y < W2.y && W2.y - f.y < 40);
  const inWall = (x, y, mine) => walls.find(W2 => W2.hp > 0 && !!W2.mine == mine && x > W2.x && x < W2.x + W2.w && y > W2.y && y < W2.y + W2.h) || AR().cover.find(C2 => x > C2.x && x < C2.x + C2.w && y > C2.y && y < C2.y + C2.h);
  const weakestWall = () => walls.filter(W2 => W2.mine && W2.hp > 0).sort((a, b) => a.hp/a.max - b.hp/b.max)[0];
  const underRoof = x => walls.find(W2 => W2.mine && W2.fort && W2.hp > 0 && x > W2.x && x < W2.x + W2.w);
  const landHit = (b, x, y) => { // a lob lands
    if (b.mine) { let hit = 0; const rad = (b.kind == 'mega' ? 56 : b.r + 22);
      const W2 = inWall(x, y, false); if (W2 && W2.hp != null) { W2.hp -= b.dmg; addNum(x, y - 10, '🧱', '#5a7a9a'); }
      for (const f of foes) { if (f.dead || Math.hypot(f.x - x, f.y - y) > rad + (TYPES[f.k].big ? 10 : 0)) continue;
        if (f.duck && enemyCover(f) && !b.big && !(me.eye > 0)) { const C2 = enemyCover(f); C2.hp -= b.dmg*.5; continue; }   // hiding behind their wall: only big snowballs get through
        f.hp -= b.dmg; f.kb = .25; f.kx = (f.x - x) * .3; hit++; if (!b.tur) addNum(f.x, f.y - 26, '-' + Math.round(b.dmg*10)/10, '#FF4539'); if (b.kind == 'icy' || b.ice) f.slow = 3; if (f.hp <= 0) killFoe(f); }
      if (boss && Math.hypot(boss.x - x, boss.y - y) < (boss.k == 'dragon' ? 85 : 62) + (b.kind == 'mega' ? 30 : 0)) { hitBoss(b.dmg, x, y, b.tur); hit++; }
      for (const f of foes) if (f.k == 'medic' && f.dead) {}
      if (hit && b.tur) { flakes += 1; splat(x, y, 3); return; }   // turret hits: a flake each, but no combo (combos are for your own throws)
      if (hit) { combo = t - comboT < 2.5 ? combo + 1 : 1; comboT = t; flakes += 1 + Math.min(5, Math.floor(combo/3)); A.sfx('hit'); if (b.big) shake = Math.max(shake, .2); }
      splat(x, y, b.tur ? 3 : b.big ? 14 : 7); return; }
    // enemy lob (catapults, bosses)
    splat(x, y, 10, '#e8f4ff'); if (underRoof(x) && y > MID + 60) { const W2 = underRoof(x); W2.hp -= b.dmg*.5; return; }
    if (Math.abs(me.x - x) < 26 + b.r && Math.abs(me.y - y) < 40) hurtMe(b.dmg, b.ice);
    for (const m of mates) if (!m.ko && Math.abs(m.x - x) < 24 && Math.abs(m.y - y) < 40) hurtMate(m);
    for (const B2 of builds) if (Math.hypot(B2.x - x, B2.y - y) < 30 && B2.k != 'pit' && B2.k != 'ice') B2.hp -= 1;
    const W2 = inWall(x, y, true); if (W2) W2.hp -= b.dmg; };
  const hurtMate = m => { if (m.ko) return; m.hp--; if (m.hp <= 0) { m.ko = true; m.rev = 0; say(m.name + ' is knocked out! Stand next to them to help them up', 2.4); } };
  // ---------- main loop ----------
  const offL = A.loop(dt => { if (wm) { wm.frame(Math.min(dt, .033)); return; } A.mood(() => ({danger: st=="play" && me && me.hp==1, boss: st=="play" && !!boss})); t += dt; dt = Math.min(dt, .033); msgT = Math.max(0, msgT - dt); shake = Math.max(0, shake - dt); white = Math.max(0, white - dt); cheerT = Math.max(0, cheerT - dt);
    for (const f of snow) { f.y += 24*f.s*dt; f.x += (AR().wind ? 50*Math.sin(t*.4) : Math.sin(t + f.y*.02)*6)*dt; if (f.y > FIELD) f.y = 0; if (f.x > w) f.x = 0; if (f.x < 0) f.x = w; }
    for (const p2 of fx) { p2.x += p2.vx*dt; p2.y += p2.vy*dt; p2.vy += 300*dt; p2.t -= dt; } fx = fx.filter(p2 => p2.t > 0);
    for (const n of nums) { n.y -= 30*dt; n.t -= dt; } nums = nums.filter(n => n.t > 0);
    for (const p2 of prints) p2.t -= dt; prints = prints.filter(p2 => p2.t > 0);
    if (st == 'play' && !quiz && !guide) {
      // ----- you -----
      const space = !!K.k[' ']; const duckKey = duckK.ShiftLeft || duckK.ShiftRight || duckK.KeyC || touch.duck;
      me.ab = Math.max(0, (me.ab || 0) - dt); me.shieldT = Math.max(0, (me.shieldT || 0) - dt); me.eye = Math.max(0, (me.eye || 0) - dt); if (me.eye > 0) white = 0;
      me.inv = Math.max(0, me.inv - dt); me.throwT = Math.max(0, me.throwT - dt); me.hitT = Math.max(0, me.hitT - dt); me.rollCd = Math.max(0, me.rollCd - dt); me.freeze = Math.max(0, me.freeze - dt);
      for (const key in pw) pw[key] = Math.max(0, pw[key] - (key == 'shield' ? 0 : dt));
      if (PU('regen') && phase == 'fight' && me.hp < me.max) { me.regT = (me.regT || 0) + dt; if (me.regT >= 40 - 5*PU('regen')) { me.regT = 0; me.hp++; addNum(me.x, me.y - 40, '☕ +♥', '#8D5B1D'); } }
      const mx = (K.k.ArrowRight || K.k.d || K.k.D || touch.r ? 1 : 0) - (K.k.ArrowLeft || K.k.a || K.k.A || touch.l ? 1 : 0), my = (K.k.ArrowDown || K.k.s || K.k.S ? 1 : 0) - (K.k.ArrowUp || K.k.w || K.k.W ? 1 : 0);
      let want = 0, wantY = 0; if (mx || my) { want = mx; wantY = my; me.tx = null; me.ty = null; }
      else if (me.tx != null) { const d = me.tx - me.x, dy2 = (me.ty == null ? me.y : me.ty) - me.y, L2 = Math.hypot(d, dy2); if (L2 < 6) { me.tx = null; me.ty = null; } else { want = d / L2; wantY = dy2 / L2; } }
      if (Math.abs(want) > .2) me.face = Math.sign(want);
      const spd = 220 * (1 + .05*A.U('boots')) * (1 + .08*PU('boots')) * (1 + .05*gStat('boots')) * (CL().slow || 1) * (me.duck ? .35 : 1) * (me.freeze > 0 ? 0 : 1);
      me.vy = me.vy || 0; if (me.roll > 0) { me.roll -= dt; me.vx = me.rdir * 420; me.vy = 0; } else { const k = AR().slip ? 3 + 1.2*gStat('boots') : 14; me.vx += (want*spd - me.vx) * Math.min(1, k*dt); me.vy += (wantY*spd - me.vy) * Math.min(1, k*dt); }
      // walk anywhere on your half, but not through your own walls (bump off the edges instead of sticking)
      const ox = me.x, oy = me.y, nx = Math.max(16, Math.min(584, me.x + me.vx*dt)), ny = Math.max(MID + 34, Math.min(PY + 14, me.y + me.vy*dt));
      const blocked = (x, y) => walls.some(W2 => W2.mine && W2.hp > 0 && x > W2.x - 10 && x < W2.x + W2.w + 10 && y > W2.y - 6 && y < W2.y + W2.h + 18);
      if (!blocked(nx, me.y)) me.x = nx; else me.vx = 0; if (!blocked(me.x, ny)) me.y = ny; else me.vy = 0;
      if (blocked(me.x, me.y)) me.y = Math.min(PY + 14, me.y + 60*dt);   // never get stuck inside a wall
      if (me.x <= 16 || me.x >= 584) me.vx = 0;
      if (Math.hypot(me.x - ox, me.y - oy) > .5 && Math.floor(t*8) != Math.floor((t - dt)*8)) prints.push({x:me.x, y:me.y + 22, t:4});
      me.duck = !!duckKey && me.roll <= 0 && !(packing && aiming);
      // scoop more snow: from the snow piles, or while ducking behind a wall
      if (PU('machine') && me.ammo < maxAmmo()) { me.mach = (me.mach || 0) + dt; const iv = (3.6 - .6*PU('machine')) / (1 + .12*PU('scoop')); if (me.mach >= iv) { me.mach = 0; me.ammo++; } }
      me.scoop -= dt; const onPile = Math.hypot(me.x - 60, me.y - PY - 10) < 42 || Math.hypot(me.x - 540, me.y - PY - 10) < 42;
      if ((onPile || (me.duck && covering(me.x, me.y))) && me.ammo < maxAmmo() && me.scoop <= 0) { me.ammo++; me.scoop = (onPile ? .3 : .55) / (1 + .12*PU('scoop')); A.tone(220, .03, 'sine', .02); }
      if (phase == 'fight') {
        // packing with Space (aim with the mouse, or the nearest enemy)
        if (space && !spaceWas && !me.duck && me.freeze <= 0) { packing = true; packT = 0; }
        if (!space && spaceWas && packing && !aiming) throwMine(); spaceWas = space;
        if (packing && me.freeze <= 0) packT += dt / (.9 * Math.pow(.88, PU('pack')) / (CL().pack || 1) / (1 + .06*gStat('gloves')));
        // ----- teammates -----
        const target = nearestFoe(300, 150);
        for (const m of mates) { if (m.ko) { if (Math.hypot(me.x - m.x, me.y - m.y) < 40) { m.rev += dt * (PERM.cls == 'medic' ? 2 : 1); if (m.rev >= 1.5) { m.ko = false; m.hp = Math.ceil(m.max/2); say(m.name + ' is back up!', 1.5); A.sfx('coin'); } } else m.rev = Math.max(0, m.rev - dt*.5); continue; }
          m.cool -= dt; m.job -= dt; const cov = covering(m.x, m.y); m.duck = !!cov && m.cool > .6;
          if (m.role == 'thrower' && target && m.cool <= 0) { m.cool = 1.8 / (1 + .2*(m.lv - 1)); lob(m, target.x + (Math.random() - .5)*30, target.y, {mine:1, sp:440, dmg:(.8 + .2*m.lv) * armM()}); }
          if (m.role == 'builder' && m.job <= 0) { m.job = 4 / m.lv; const W2 = weakestWall(); if (W2 && W2.hp < W2.max) { W2.hp = Math.min(W2.max, W2.hp + 1); addNum(W2.x + W2.w/2, W2.y - 8, '+🧱', '#2fa8e0'); } }
          if (m.role == 'medic' && m.job <= 0) { m.job = (11 - m.lv) * (PERM.cls == 'medic' ? .5 : 1); if (me.hp < me.max) { me.hp++; addNum(me.x, me.y - 40, '+♥', '#00B451'); } }
          if (!m.tx || Math.random() < dt*.25) m.tx = 40 + Math.random()*520; m.x += Math.max(-60*dt, Math.min(60*dt, m.tx - m.x)); }
        // ----- your buildings -----
        for (const B2 of builds) { if (B2.k == 'turret' && target) { B2.cool -= dt; if (B2.cool <= 0) { B2.cool = 1.4 * (1 - .12*PU('turret')); lob(B2, target.x, target.y, {mine:1, sp:460, dmg:armM(), tur:1}); } }
          if (B2.k == 'fire' && Math.hypot(me.x - B2.x, (me.y - B2.y)*1.6) < 80) { B2.heal = (B2.heal || 0) + dt * (1 + .25*PU('mitts')); if (B2.heal >= 4) { B2.heal = 0; if (me.hp < me.max) { me.hp++; addNum(me.x, me.y - 40, '+♥', '#FF8A3C'); A.tone(700, .08, 'sine', .04); } } } }
        // ----- enemies -----
        const AIc = Math.min(3, 1 + wave*.04);
        for (const f of foes) { const T = TYPES[f.k], spd2 = T.sp * (f.slow > 0 ? .4 : 1); f.slow = Math.max(0, f.slow - dt); f.kb = Math.max(0, f.kb - dt); f.rt -= dt; f.act -= dt;
          if (T.sled) { // rush down to your weakest wall and smash it (trap pits and ice patches stop them)
            const W2 = weakestWall(); const tx = W2 ? W2.x + W2.w/2 : me.x, ty = W2 ? W2.y - 14 : PY - 40; f.x += Math.max(-spd2*dt, Math.min(spd2*dt, tx - f.x)); if (!f.spin) f.y += Math.max(-spd2*dt, Math.min(spd2*dt, ty - f.y));
            f.spin = Math.max(0, (f.spin || 0) - dt);
            for (const B2 of builds) { if (B2.k == 'pit' && Math.hypot(B2.x - f.x, B2.y - f.y) < B2.r) { killFoe(f); B2.hp--; say('🕳 A sledder fell in your trap!', 1.4); } if (B2.k == 'ice' && !f.spin && Math.hypot(B2.x - f.x, B2.y - f.y) < B2.r) { f.spin = 2; f.slow = 3; } }
            if (W2 && Math.abs(f.x - tx) < 12 && Math.abs(f.y - ty) < 14) { W2.hp -= 3; shake = .2; splat(f.x, f.y, 16); f.dead = 1; addNum(tx, ty, '-3 🧱', '#5a7a9a'); }
            else if (!W2 && f.y > PY - 50) { hurtMe(1); f.dead = 1; }
            continue; }
          if (f.rt <= 0) { f.rt = 2.2 + R()*2.2;
            const cov = walls.filter(W2 => !W2.mine && W2.hp > 0);
            if (T.flank) { f.tx = R() < .5 ? 30 : 570; f.ty = MID - 40; }
            else if ((T.cover || T.snipe) && cov.length) { const W2 = cov[Math.floor(R()*cov.length)]; f.tx = W2.x + 10 + R()*(W2.w - 20); f.ty = W2.y - 16; }
            else if (T.medic) { f.tx = 60 + R()*480; f.ty = 40 + R()*70; }
            else { f.tx = 40 + R()*520; f.ty = 30 + R()*(MID - 120); } }
          f.x += Math.max(-spd2*dt, Math.min(spd2*dt, f.tx - f.x)); f.y += Math.max(-spd2*dt, Math.min(spd2*dt, f.ty - f.y));
          // hiders duck behind their wall between throws
          f.duck = (T.cover || T.snipe) && !!enemyCover(f) && f.cool > 1.2;
          if (T.medic && f.act <= 0) { f.act = 3; const hurt = foes.filter(o => !o.dead && o !== f && o.hp < o.max && Math.hypot(o.x - f.x, o.y - f.y) < 160); if (hurt[0]) { hurt[0].hp++; addNum(hurt[0].x, hurt[0].y - 26, '+1', '#00B451'); } }
          f.cool -= dt * (f.slow > 0 ? .5 : 1); if (f.cool <= 0 && !T.medic) { f.cool = D3(T.cool) * (.8 + R()*.4) / AIc;
            if (T.build && R() < .5) walls.push({x:Math.max(10, Math.min(520, f.x - 35)), y:Math.min(MID - 40, f.y + 24), w:70, h:20, hp:4, max:4, mine:0, kind:'snow'});
            else if (T.cat) { const W2 = weakestWall(), tx = R() < .5 && W2 ? W2.x + W2.w/2 : me.x, ty = R() < .5 && W2 ? W2.y + 10 : me.y; lob(f, tx, ty, {mine:0, sp:260, dmg:2, r:9}); balls[balls.length - 1].warn = 1; }
            else { const lead = Math.min(1, wave/8), tt = Math.hypot(me.x - f.x, me.y - f.y) / 300; const tx = me.x + me.vx*tt*lead + (T.snipe ? 0 : (R() - .5)*(wave < 5 ? 80 : 40));
              straight(f, tx, me.y, {sp: T.snipe ? 520 : T.big ? 230 : A.D(250, 290, 330) + wave*4, r: T.big ? 9 : 5, dmg: T.big ? 2 : 1, ice:T.ice}); } } }
        // ----- bosses (3 phases each) -----
        if (boss) { const B = boss, ph = B.ph; B.cool -= dt; B.kb = Math.max(0, B.kb - dt);
          if (B.k == 'plow') { B.x += B.vx*dt*(B.charge > 0 ? 3 : 1)*(ph == 3 ? 1.3 : 1); if (B.x < 70 || B.x > 530) B.vx *= -1; B.charge = Math.max(0, B.charge - dt); if (Math.random() < dt*.3) B.charge = 1.2;
            walls.forEach(W2 => { if (!W2.mine && Math.abs(W2.x + W2.w/2 - B.x) < 50 && Math.abs(W2.y - B.y) < 60) W2.hp = 0; });
            if (B.cool <= 0) { B.cool = A.D(1.8, 1.5, 1.2) / (ph == 3 ? 1.3 : 1); for (let k2 = -1; k2 <= 1; k2++) straight(B, me.x + k2*60, me.y, {sp:300, r:6}); if (ph >= 2) lob(B, me.x, me.y, {mine:0, sp:240, dmg:2, r:9}); } }
          else if (B.k == 'witch') { B.tp -= dt; if (B.tp <= 0) { B.tp = 5 - ph; B.x = 80 + Math.random()*440; B.y = 60 + Math.random()*120; splat(B.x, B.y, 12, '#b48cff'); }
            if (B.cool <= 0) { B.cool = A.D(2.2, 1.8, 1.4) / (1 + .2*(ph - 1)); for (let k2 = -1; k2 <= 1; k2++) straight(B, me.x + k2*50, me.y, {sp:280, r:6, ice:k2 == 0});
              if (Math.random() < .25 + .1*ph) { white = 3; say('❄ WHITEOUT! The Blizzard Witch hides her helpers', 2); } if (ph >= 2 && foes.length < 6 && Math.random() < .3) { spawn('thrower', B.x, B.y + 40); spawn('iceman', B.x + 30, B.y + 40); } } }
          else if (B.k == 'dragon') { B.x = 300 + Math.sin(t*.32*(1 + .15*ph))*210; B.y = 118 + Math.sin(t*1.3)*16;
            if (B.cool <= 0) { B.cool = A.D(3, 2.5, 2) / (1 + .25*(ph - 1)); const sweep = Math.random() < .5 ? 1 : -1; for (let k2 = 0; k2 < 7; k2++) setTimeout(() => { if (boss === B && st == 'play') straight(B, 300 + sweep*(k2 - 3)*80, PY, {sp:340, r:7, ice:true}); }, k2*110);
              if (ph >= 2) for (let k2 = 0; k2 < ph; k2++) lob(B, 80 + Math.random()*440, PY - Math.random()*60, {mine:0, sp:250, dmg:2, r:10}); } }
          else { B.x += Math.sin(t*.7)*80*dt*(ph == 3 ? 1.6 : 1); if (B.cool <= 0) { B.cool = A.D(2.2, 1.8, 1.4) / (1 + .2*(ph - 1)); const fan = ph >= 2 ? 3 : 2; for (let k2 = -fan; k2 <= fan; k2++) straight(B, me.x + k2*50, me.y, {sp:260, r:8, dmg:k2 == 0 ? 2 : 1});
              if (ph == 3) for (let k2 = 0; k2 < 2; k2++) lob(B, me.x + (k2 ? 60 : -60), me.y, {mine:0, sp:240, dmg:2, r:10}); if (Math.random() < .3 && foes.length < 6) { spawn('golem', B.x, B.y + 40); say('The Yeti King calls a snow golem!'); } } } }
        if (boss) { boss.x = Math.max(70, Math.min(530, boss.x)); boss.y = Math.max(60, Math.min(MID - 60, boss.y)); }   // bosses never wander off the screen
        // ----- arena hazards -----
        hazT -= dt; if (hazT <= 0) { hazT = AR().aval ? 16 : AR().icicles ? 5 : 999;
          if (AR().icicles) haz = {k:'icicle', x:40 + R()*520, y:R() < .6 ? PY : 60 + R()*200, t:1.2};
          if (AR().aval) { haz = {k:'aval', side:R() < .5 ? 0 : 1, t:2.5}; say('⚠ AVALANCHE coming down the ' + (haz.side ? 'right' : 'left') + ' side!', 2); } }
        if (haz) { haz.t -= dt; if (haz.t <= 0) {
            if (haz.k == 'icicle') { splat(haz.x, haz.y, 12, '#bfe9ff'); if (Math.abs(me.x - haz.x) < 24 && Math.abs(haz.y - me.y) < 30) hurtMe(1); for (const f of foes) if (Math.hypot(f.x - haz.x, f.y - haz.y) < 26) { f.hp--; if (f.hp <= 0) killFoe(f); } }
            else { const x0 = haz.side ? 300 : 0; shake = .5; for (const f of foes) if (f.x >= x0 && f.x < x0 + 300) { f.hp -= 2; if (f.hp <= 0) killFoe(f); } walls.forEach(W2 => { if (W2.x + W2.w/2 >= x0 && W2.x + W2.w/2 < x0 + 300) W2.hp -= 2; });
              if (me.x >= x0 && me.x < x0 + 300 && !(me.duck && covering(me.x, me.y))) hurtMe(1); }
            haz = null; } }
        // ----- snowballs -----
        for (const b of balls) { if (b.lob) { b.t += dt; const k2 = Math.min(1, b.t / b.T); b.x = b.x0 + (b.x1 - b.x0)*k2; b.y = b.y0 + (b.y1 - b.y0)*k2; b.z = Math.sin(k2*Math.PI) * Math.min(160, 40 + b.T*120); if (k2 >= 1) { b.life = 0; landHit(b, b.x1, b.y1); if (b.boomer && !b.back) { lob({x:b.x1, y:b.y1 + 20}, (b.x0 + b.x1)/2, Math.min(MID - 4, (b.y0 + b.y1)/2), {mine:1, dmg:b.dmg, r:b.r, sp:520}); balls[balls.length - 1].back = 1; } } continue; }
          b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt; if (AR().wind) b.vx += Math.sin(t*.4)*30*dt;
          if (b.shard) { for (const f of foes) { if (f.dead || (b.hitIds || (b.hitIds = new Set())).has(f) || Math.hypot(f.x - b.x, f.y - b.y) > 18) continue; b.hitIds.add(f); f.hp -= b.dmg; f.kb = .2; addNum(f.x, f.y - 26, '-' + Math.round(b.dmg*10)/10, '#7fe6ff'); if (f.hp <= 0) killFoe(f); } if (boss && Math.hypot(boss.x - b.x, boss.y - b.y) < 50 && !b.hitB) { b.hitB = 1; hitBoss(b.dmg, b.x, b.y); } if (b.y < 10) b.life = 0; continue; }
          const W2 = inWall(b.x, b.y, !b.mine); if (W2) { if (W2.hp != null) W2.hp -= b.dmg; b.life = 0; splat(b.x, b.y, 5); A.tone(150,.03,'square',.02); continue; }
          const tb = builds.find(B2 => (B2.k == 'turret' || B2.k == 'fire') && Math.hypot(B2.x - b.x, B2.y - b.y) < 16); if (tb) { tb.hp--; b.life = 0; splat(b.x, b.y, 5); continue; }
          const hm = mates.find(m => !m.ko && !m.duck && Math.hypot(m.x - b.x, m.y - 10 - b.y) < 16); if (hm) { b.life = 0; hurtMate(hm); continue; }
          if (Math.abs(me.x - b.x) < 16 + b.r && Math.abs(me.y - 14 - b.y) < 24) { if (me.duck && covering(me.x, me.y)) continue; b.life = 0; splat(b.x, b.y, 8); hurtMe(b.dmg, b.ice); } }
        balls = balls.filter(b => b.life > 0 && (b.lob || (b.x > -20 && b.x < w + 20 && b.y > -20 && b.y < FIELD + 20)));
        foes = foes.filter(f => !f.dead); walls = walls.filter(W2 => W2.hp > 0); builds = builds.filter(B2 => B2.hp > 0);
        for (const d of drops) { d.life -= dt; if (d.y < (d.ty || (d.ty = MID + 60 + Math.random()*(PY - MID - 60)))) d.y += d.vy*dt; if (Math.hypot(d.x - me.x, d.y - me.y) < 34 + 12*PU('magnet')) { d.life = 0;
            if (d.k == 'cocoa') { if (me.hp < me.max) me.hp++; addNum(me.x, me.y - 40, '☕ +♥', '#8D5B1D'); } else if (d.k == 'shield') pw.shield = 1; else pw[d.k] = 10;
            A.sfx('coin'); if (d.k != 'cocoa') say({icy:'❄ Icy snowballs: hits slow enemies!', mega:'💥 Mega snowballs: big splash!', rapid:'⚡ Rapid throws!', shield:'🛡 Shield: blocks the next hit'}[d.k], 1.6); } } drops = drops.filter(d => d.life > 0);
        if (!foes.length && !boss) { score += 200*wave; flakes += 15 + wave*2; if (!waveHurt) { score += 300; flakes += 10; stat(api, 'snowPerfect', 1, 'add'); say('✨ PERFECT wave ' + wave + '! No hits taken · +300', 3); } else say('Wave ' + wave + ' cleared! Build, heal and hire before the next one.', 3);
          api.score(score); A.sfx('win'); stat(api, 'snowWave', wave, 'max'); phase = 'build'; balls = []; cheerT = 2; tool = 0;
          { const lv0 = clsLv(PERM.cls); PERM.cx[PERM.cls] = clsXp(PERM.cls) + 10 + wave*4; if (clsLv(PERM.cls) > lv0) setTimeout(() => say('⭐ ' + CL().n + ' reached level ' + clsLv(PERM.cls) + '! New skill point', 3), 1800);
            if (wave % 3 == 0 && Math.random() < .4) { const it = makeGear(0); setTimeout(() => say('🎁 New gear: ' + it.name + ' (' + GRAR[it.rar].n + ')', 3), 3200); } stat(api, 'snowClass_' + PERM.cls, clsLv(PERM.cls), 'max'); savePerm(); }
          if (PERM.cls == 'trapper') freeTrap = {pit:1, ice:1};
          if (A.learnOn && A.learnOn()) setTimeout(() => { if (st == 'play' && phase == 'build' && !quiz) quiz = learn2(host, api, 'BONUS QUESTION · RIGHT = +25 ❄', () => { quiz = false; flakes += 25; say('+25 ❄ for the right answer!', 2); }, () => { quiz = false; }); }, 900);
          for (const m of mates) { m.xp++; if (m.xp >= 2 && m.lv < 5) { m.xp = 0; m.lv++; m.max++; m.hp = m.max; say(m.name + ' reached level ' + m.lv + '!', 2); } if (m.ko) { m.ko = false; m.hp = 1; } }
          if (mode == 'daily' && wave >= 15) { say('📅 Daily Challenge complete!', 4); gameOver(); } } } }
    // ======================= DRAW =======================
    g.save(); if (shake > 0 && !low()) g.translate((Math.random() - .5)*shake*16, (Math.random() - .5)*shake*16);
    const A0 = AR(), bgG = g.createLinearGradient(0, 0, 0, FIELD); bgG.addColorStop(0, A0.bg2); bgG.addColorStop(1, A0.bg); g.fillStyle = bgG; g.fillRect(-10, -10, w + 20, FIELD + 10);
    if (!low()) { g.fillStyle = 'rgba(160,190,220,.18)'; for (let i = 0; i < 90; i++) { const x = (i*137) % 600, y = (i*89) % FIELD; g.beginPath(); g.ellipse(x, y, 14, 4, 0, 0, TAU); g.fill(); } }
    if (A0.slip) { g.fillStyle = 'rgba(180,220,250,.55)'; g.beginPath(); g.ellipse(300, 410, 280, 120, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; for (let k2 = 0; k2 < 6; k2++) { g.beginPath(); g.moveTo(90 + k2*80, 340); g.lineTo(140 + k2*70, 480); g.stroke(); } }
    if (A0.k == 'castle') { g.fillStyle = '#b8cdf0'; for (let k2 = 0; k2 < 6; k2++) g.fillRect(k2*110 + 10, 0, 60, 40 + (k2 % 2)*20); }
    g.fillStyle = 'rgba(90,130,180,.25)'; g.fillRect(0, MID - 2, w, 4);
    // snow piles (scoop more ammo here)
    for (const px of [60, 540]) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(px, PY + 16, 34, 16, 0, Math.PI, TAU); g.fill(); g.fillStyle = '#9ec4e8'; g.font = '700 10px '+A.font; g.textAlign = 'center'; g.fillText('❄ pile', px, PY + 30); }
    for (const p2 of prints) { g.fillStyle = 'rgba(120,150,190,' + Math.min(.4, p2.t/6) + ')'; g.beginPath(); g.ellipse(p2.x, p2.y, 4, 2, 0, 0, TAU); g.fill(); }
    for (const C2 of A0.cover) { if (C2.house) { g.fillStyle = '#a0603a'; g.fillRect(C2.x, C2.y + 16, C2.w, C2.h - 16); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(C2.x - 8, C2.y + 18); g.lineTo(C2.x + C2.w/2, C2.y - 10); g.lineTo(C2.x + C2.w + 8, C2.y + 18); g.fill(); g.fillStyle = '#ffe9b0'; g.fillRect(C2.x + C2.w/2 - 8, C2.y + 28, 16, 14); }
      else if (C2.rock) { g.fillStyle = '#8a8e94'; rr(g, C2.x, C2.y, C2.w, C2.h, 12); g.fill(); g.fillStyle = '#fff'; rr(g, C2.x, C2.y, C2.w, 12, 6); g.fill(); }
      else { g.fillStyle = '#bfe0ff'; g.fillRect(C2.x, C2.y, C2.w, C2.h); g.fillStyle = '#e8f4ff'; for (let k2 = 0; k2 < C2.w; k2 += 18) g.fillRect(C2.x + k2, C2.y - 10, 10, 10); } }
    if (haz && haz.k == 'icicle') { g.fillStyle = 'rgba(20,40,80,' + (.15 + .25*(1 - haz.t/1.2)) + ')'; g.beginPath(); g.ellipse(haz.x, haz.y + 18, 22, 7, 0, 0, TAU); g.fill(); }
    if (haz && haz.k == 'aval') { g.fillStyle = 'rgba(255,255,255,' + (.2 + .4*(1 - haz.t/2.5)) + ')'; g.fillRect(haz.side ? 300 : 0, 0, 300, FIELD); }
    // buildings on the ground
    for (const B2 of builds) { if (B2.k == 'pit') { g.fillStyle = '#5a6a80'; g.beginPath(); g.ellipse(B2.x, B2.y, B2.r, B2.r*.45, 0, 0, TAU); g.fill(); g.fillStyle = '#2a3440'; g.beginPath(); g.ellipse(B2.x, B2.y + 2, B2.r*.75, B2.r*.3, 0, 0, TAU); g.fill(); }
      if (B2.k == 'ice') { g.fillStyle = 'rgba(160,220,255,.6)'; g.beginPath(); g.ellipse(B2.x, B2.y, B2.r, B2.r*.5, 0, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(B2.x - 20, B2.y - 4); g.lineTo(B2.x + 14, B2.y + 6); g.stroke(); } }
    // walls with damage stages (cracks, then crumbling) and upgrades
    for (const W2 of walls) { const fr = W2.hp / W2.max, base = W2.mine ? (W2.kind == 'reinforced' ? '#c8d4e0' : W2.kind == 'ice' ? '#bfe9ff' : '#ffffff') : '#e4f2ff';
      g.fillStyle = base; g.beginPath(); g.moveTo(W2.x, W2.y + W2.h); if (fr < .33) { for (let x = 0; x <= W2.w; x += 10) g.lineTo(W2.x + x, W2.y + 6 + ((x/10) % 2)*7); } else { g.lineTo(W2.x, W2.y + 6); g.quadraticCurveTo(W2.x + W2.w/2, W2.y - 6, W2.x + W2.w, W2.y + 6); } g.lineTo(W2.x + W2.w, W2.y + W2.h); g.closePath(); g.fill();
      g.strokeStyle = W2.mine ? (W2.kind == 'reinforced' ? '#6a7a8a' : '#9ec4e8') : '#9ec4e8'; g.lineWidth = 2; g.stroke();
      g.strokeStyle = 'rgba(150,180,210,.6)'; g.lineWidth = 1; for (let x = 16; x < W2.w; x += 20) { g.beginPath(); g.moveTo(W2.x + x, W2.y + 8); g.lineTo(W2.x + x, W2.y + W2.h - 2); g.stroke(); }
      if (W2.kind == 'reinforced') { g.fillStyle = '#6a7a8a'; for (let x = 6; x < W2.w; x += 22) g.fillRect(W2.x + x, W2.y + W2.h/2 - 2, 8, 4); }
      if (fr < .66) { g.strokeStyle = '#5a7a9a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(W2.x + W2.w*.3, W2.y + 4); g.lineTo(W2.x + W2.w*.38, W2.y + W2.h*.6); g.lineTo(W2.x + W2.w*.3, W2.y + W2.h); g.moveTo(W2.x + W2.w*.7, W2.y + 6); g.lineTo(W2.x + W2.w*.64, W2.y + W2.h*.7); g.stroke(); }
      if (W2.fort) { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(W2.x - 6, W2.y - 26); g.lineTo(W2.x + W2.w + 6, W2.y - 26); g.lineTo(W2.x + W2.w - 4, W2.y - 40); g.lineTo(W2.x + 4, W2.y - 40); g.fill(); g.strokeStyle = '#9ec4e8'; g.stroke(); [W2.x + 4, W2.x + W2.w - 10].forEach(x => { g.fillStyle = '#ffffff'; g.fillRect(x, W2.y - 26, 6, 26); }); } }
    for (const B2 of builds) { if (B2.k == 'turret') { g.fillStyle = '#ffffff'; rr(g, B2.x - 14, B2.y - 22, 28, 30, 8); g.fill(); g.strokeStyle = '#9ec4e8'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#14204a'; g.beginPath(); g.arc(B2.x, B2.y - 12, 7, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(B2.x, B2.y - 14, 3, 0, TAU); g.fill(); }
      if (B2.k == 'fire') { g.fillStyle = '#6b4a2b'; g.fillRect(B2.x - 16, B2.y + 4, 32, 6); for (let k2 = 0; k2 < 3; k2++) { const fl = Math.sin(t*12 + k2)*3; g.fillStyle = ['#FF4539', '#ff8a3c', '#F9BF01'][k2]; g.beginPath(); g.moveTo(B2.x - 12 + k2*4, B2.y + 4); g.quadraticCurveTo(B2.x, B2.y - 28 + k2*7 + fl, B2.x + 12 - k2*4, B2.y + 4); g.fill(); }
        if (Math.hypot(me.x - B2.x, (me.y - B2.y)*1.6) < 80 && st == 'play') { g.strokeStyle = 'rgba(255,138,60,.4)'; g.lineWidth = 2; g.beginPath(); g.ellipse(B2.x, B2.y + 6, 70, 18, 0, 0, TAU); g.stroke(); } } }
    for (const d of drops) { g.font = '22px '+A.font; g.textAlign = 'center'; g.globalAlpha = d.life < 2 ? .5 + .5*Math.sin(t*20) : 1; g.fillText({cocoa:'☕', icy:'❄', mega:'💥', rapid:'⚡', shield:'🛡'}[d.k], d.x, d.y + Math.sin(t*4)*3); g.globalAlpha = 1; }
    // ----- characters: bigger, with wind-up, throw, duck, hit and cheer poses -----
    const kid = (x, y, col, o) => { o = o || {}; const s2 = (o.big ? 1.6 : 1.25) * (o.duck ? .7 : 1), dy = o.duck ? 10 : 0, cheer = o.cheer && Math.sin(t*10) > 0;
      g.save(); g.translate(x + (o.kx || 0), y + dy); if (o.hit) g.globalAlpha = .6;
      g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(0, 16*s2 - dy, 14*s2, 4*s2, 0, 0, TAU); g.fill();
      g.fillStyle = o.boots || '#3a4a6a'; g.fillRect(-9*s2, 8*s2, 7*s2, 8*s2); g.fillRect(2*s2, 8*s2, 7*s2, 8*s2);
      g.fillStyle = col; rr(g, -12*s2, -8*s2, 24*s2, 20*s2, 8*s2); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-12*s2, 2*s2, 24*s2, 3*s2);
      const armA = o.wind ? -2.4 : o.throwT > 0 ? .4 : cheer ? -2.6 : o.big ? .3 : .6; g.strokeStyle = col; g.lineWidth = 5*s2; g.lineCap = 'round'; g.beginPath(); g.moveTo(10*s2, -4*s2); g.lineTo(10*s2 + Math.cos(armA)*12*s2, -4*s2 + Math.sin(armA)*12*s2); g.stroke(); g.beginPath(); g.moveTo(-10*s2, -4*s2); g.lineTo(-10*s2 - Math.cos(cheer ? -2.6 : .6)*12*s2, -4*s2 + Math.sin(cheer ? -2.6 : .6)*12*s2); g.stroke();
      if (o.wind) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(10*s2 + Math.cos(armA)*14*s2, -4*s2 + Math.sin(armA)*14*s2, 4 + 5*Math.min(1, o.pack || 0), 0, TAU); g.fill(); g.strokeStyle = '#9ec4e8'; g.lineWidth = 1; g.stroke(); }
      g.fillStyle = o.big ? '#dfe8f0' : '#f2c9a0'; g.beginPath(); g.arc(0, -15*s2, 9*s2, 0, TAU); g.fill();
      if (o.big) { g.fillStyle = '#121313'; g.beginPath(); g.arc(-4*s2, -17*s2, 2*s2, 0, TAU); g.arc(4*s2, -17*s2, 2*s2, 0, TAU); g.fill(); g.fillStyle = '#FF8A3C'; g.fillRect(-1*s2, -15*s2, 7*s2, 3*s2); }
      else { g.fillStyle = col; g.beginPath(); g.arc(0, -18*s2, 9*s2, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -27*s2, 3.5*s2, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(-3*s2, -14*s2, 1.4*s2, 0, TAU); g.arc(3*s2, -14*s2, 1.4*s2, 0, TAU); g.fill(); if (o.medic) { g.fillStyle = '#FF4539'; g.fillRect(-2*s2, -4*s2, 4*s2, 12*s2); g.fillRect(-6*s2, 0, 12*s2, 4*s2); } }
      g.restore(); };
    const hidden = white > 0 && !(me && me.eye > 0);
    for (const f of foes) { if (hidden && Math.random() < .9) continue; const T = TYPES[f.k];
      if (T.cat) { g.fillStyle = '#8D5B1D'; g.fillRect(f.x - 22, f.y + 4, 44, 8); g.strokeStyle = '#6b4a2b'; g.lineWidth = 4; g.beginPath(); g.moveTo(f.x, f.y + 6); g.lineTo(f.x + 18*Math.cos(-1 - (f.cool < .4 ? 1 : 0)), f.y + 6 + 18*Math.sin(-1 - (f.cool < .4 ? 1 : 0))); g.stroke(); }
      if (T.sled) { g.fillStyle = '#c84a2a'; rr(g, f.x - 16, f.y + 8, 32, 8, 4); g.fill(); }
      kid(f.x, f.y, T.col, {big:T.big, duck:f.duck, kx:f.kb > 0 ? f.kx : 0, hit:f.kb > 0, wind:f.cool < .35 && !T.medic && !T.sled, medic:T.medic});
      if (f.slow > 0) { g.strokeStyle = '#64CDF5'; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y - 8, 22, 0, TAU); g.stroke(); }
      if (f.max > 1) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(f.x - 14, f.y + 24, 28, 3); g.fillStyle = '#FF4539'; g.fillRect(f.x - 14, f.y + 24, 28*f.hp/f.max, 3); } }
    if (boss) { const B = boss; g.save(); g.translate(B.x + (B.kb > 0 ? (Math.random() - .5)*6 : 0), B.y);
      if (B.k == 'yeti') { g.fillStyle = B.col; g.beginPath(); g.ellipse(0, 0, 44, 50, 0, 0, TAU); g.fill(); g.fillStyle = '#9ec4e8'; g.beginPath(); g.ellipse(0, -10, 24, 18, 0, 0, TAU); g.fill(); g.fillStyle = B.ph >= 2 ? '#FF4539' : '#121313'; g.beginPath(); g.arc(-8, -14, 3.5, 0, TAU); g.arc(8, -14, 3.5, 0, TAU); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(-20, -44); g.lineTo(-12, -60); g.lineTo(0, -46); g.lineTo(12, -60); g.lineTo(20, -44); g.fill(); }
      else if (B.k == 'plow') { g.fillStyle = B.col; rr(g, -48, -28, 96, 56, 10); g.fill(); g.fillStyle = '#c9ccd1'; g.fillRect(-58, 16, 116, 14); g.fillStyle = '#64CDF5'; g.fillRect(-28, -20, 56, 18); g.fillStyle = B.charge > 0 ? '#FF4539' : '#fff'; g.beginPath(); g.arc(-32, -20, 5, 0, TAU); g.arc(32, -20, 5, 0, TAU); g.fill(); }
      else if (B.k == 'witch') { g.fillStyle = B.col; g.beginPath(); g.moveTo(-30, 30); g.lineTo(0, -30); g.lineTo(30, 30); g.fill(); g.fillStyle = '#dfe8f0'; g.beginPath(); g.arc(0, -30, 13, 0, TAU); g.fill(); g.fillStyle = '#3a2a6a'; g.beginPath(); g.moveTo(-18, -38); g.lineTo(0, -78); g.lineTo(18, -38); g.fill(); g.fillStyle = '#7df9ff'; g.beginPath(); g.arc(-5, -32, 2.5, 0, TAU); g.arc(5, -32, 2.5, 0, TAU); g.fill(); g.strokeStyle = '#8D5B1D'; g.lineWidth = 4; g.beginPath(); g.moveTo(26, 30); g.lineTo(40, -20); g.stroke(); g.fillStyle = '#9fe8ff'; g.beginPath(); g.arc(40, -24, 7, 0, TAU); g.fill(); }
      else { const fl = Math.sin(t*6)*.5; g.fillStyle = B.col; g.beginPath(); g.ellipse(0, 0, 60, 26, 0, 0, TAU); g.fill(); g.fillStyle = '#7fd0f0'; g.beginPath(); g.moveTo(-20, -8); g.lineTo(-90, -40 - fl*30); g.lineTo(-50, 6); g.fill(); g.beginPath(); g.moveTo(20, -8); g.lineTo(90, -40 - fl*30); g.lineTo(50, 6); g.fill(); g.fillStyle = B.col; g.beginPath(); g.ellipse(0, 26, 22, 18, 0, 0, TAU); g.fill(); g.fillStyle = B.ph >= 2 ? '#FF4539' : '#14204a'; g.beginPath(); g.arc(-8, 26, 3, 0, TAU); g.arc(8, 26, 3, 0, TAU); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-12, -20); g.lineTo(-6, -36); g.lineTo(0, -20); g.lineTo(6, -36); g.lineTo(12, -20); g.fill(); }
      g.restore(); }
    for (const m of mates) { if (m.ko) { g.fillStyle = '#2fa8e0'; rr(g, m.x - 16, m.y + 6, 32, 12, 6); g.fill(); g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(m.x + 18, m.y + 10, 7, 0, TAU); g.fill(); g.font = '12px '+A.font; g.textAlign = 'center'; g.fillText('💫', m.x, m.y - 4);
        if (m.rev > 0) { g.strokeStyle = '#00B451'; g.lineWidth = 3; g.beginPath(); g.arc(m.x, m.y, 20, -Math.PI/2, -Math.PI/2 + TAU*m.rev/1.5); g.stroke(); } }
      else kid(m.x, m.y, {thrower:'#2fa8e0', builder:'#64CDF5', medic:'#ff9ad5'}[m.role], {duck:m.duck, cheer:cheerT > 0, wind:m.cool < .35 && m.role == 'thrower'});
      g.fillStyle = '#14204a'; g.font = '700 10px '+A.font; g.textAlign = 'center'; g.fillText(m.name + ' · ' + {thrower:'🎯', builder:'🔨', medic:'➕'}[m.role] + ' Lv' + m.lv, m.x, m.y + 34); }
    if (me && st != 'ready' && !(me.inv > 0 && Math.sin(t*25) > 0)) { kid(me.x, me.y, me.freeze > 0 ? '#7fe6ff' : CL().col, {duck:me.duck, wind:packing && phase == 'fight', pack:packT, throwT:me.throwT, hit:me.hitT > 0, cheer:cheerT > 0, boots:'#14204a'});
      if (me.shieldT > 0) { g.strokeStyle = 'rgba(255,233,120,' + (.5 + .4*Math.sin(t*12)) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(me.x, me.y - 8, 34, 0, TAU); g.stroke(); }
      if (me.eye > 0) { g.fillStyle = '#2f6a3a'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('🔭 Eagle Eye', me.x, me.y - 52); }
      if (me.roll > 0) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(me.x, me.y - 6, 24, 0, TAU); g.stroke(); }
      if (pw.shield > 0) { g.strokeStyle = 'rgba(100,200,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(me.x, me.y - 8, 28, 0, TAU); g.stroke(); }
      if (me.duck && covering(me.x, me.y)) { g.fillStyle = '#00B451'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('safe behind wall · scooping', me.x, me.y + 36); } }
    // aim arc preview
    if (st == 'play' && phase == 'fight' && me && (packing || (mouseOn && aim.y < MID))) { const tx = aim.x, ty = Math.min(MID - 4, aim.y), d = Math.hypot(tx - me.x, ty - me.y), hz = Math.min(160, 40 + d/520*120);
      g.strokeStyle = 'rgba(20,32,74,' + (packing ? .5 : .2) + ')'; g.setLineDash([5, 7]); g.lineWidth = 2; g.beginPath(); for (let k2 = 0; k2 <= 20; k2++) { const q = k2/20; g.lineTo(me.x + (tx - me.x)*q, me.y - 20 + (ty - me.y + 20)*q - Math.sin(q*Math.PI)*hz); } g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(255,69,57,.6)'; g.beginPath(); g.arc(tx, ty, 8 + 6*Math.min(1, packT), 0, TAU); g.stroke(); }
    // snowballs (lobs fly high with a shadow; enemy lobs show where they'll land)
    for (const b of balls) { if (hidden && !b.mine && Math.random() < .7) continue;
      if (b.lob) { if (b.warn || !b.mine) { g.strokeStyle = 'rgba(255,69,57,.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(b.x1, b.y1 + 6, 16, 6, 0, 0, TAU); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(b.x, b.y + 4, b.r, b.r*.4, 0, 0, TAU); g.fill(); g.fillStyle = b.kind == 'icy' || b.ice ? '#aee6ff' : '#fff'; g.strokeStyle = b.mine ? '#a0b8d0' : '#d08080'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y - b.z, b.r, 0, TAU); g.fill(); g.stroke(); continue; }
      g.fillStyle = b.ice ? '#aee6ff' : '#fff'; g.strokeStyle = b.mine ? '#a0b8d0' : '#d08080'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); g.stroke(); }
    for (const p2 of fx) { g.fillStyle = p2.col; g.globalAlpha = Math.min(1, p2.t*2); g.beginPath(); g.arc(p2.x, p2.y, p2.r, 0, TAU); g.fill(); } g.globalAlpha = 1;
    for (const n of nums) { g.globalAlpha = Math.min(1, n.t*2); g.fillStyle = n.col; g.font = '800 14px '+A.font; g.textAlign = 'center'; g.fillText(n.txt, n.x, n.y); } g.globalAlpha = 1;
    g.fillStyle = 'rgba(255,255,255,.9)'; for (const f of snow) { if (low() && f.s < 1) continue; g.fillRect(f.x, f.y, 2*f.s, 2*f.s); }
    if (white > 0) { g.fillStyle = 'rgba(245,250,255,' + Math.min(.85, white*.5) + ')'; g.fillRect(0, 0, w, MID + 20); }
    g.restore();
    // ----- HUD -----
    if (boss) { g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, 150, 8, 300, 16, 8); g.fill(); g.fillStyle = boss.ph == 3 ? '#8a0000' : boss.ph == 2 ? '#ff6a3c' : '#FF4539'; rr(g, 150, 8, 300*Math.max(0, boss.hp)/boss.max, 16, 8); g.fill(); g.fillStyle = '#fff'; g.fillRect(250, 8, 2, 16); g.fillRect(350, 8, 2, 16);
      g.fillStyle = '#14204a'; g.font = '800 12px '+A.font; g.textAlign = 'center'; g.fillText(boss.n + ' · phase ' + boss.ph, 300, 38); }
    if (st != 'ready') { g.fillStyle = '#14204a'; g.font = '700 15px '+A.font; g.textAlign = 'left'; g.fillText('Wave ' + (wave||0) + ' · ' + AR().n + (mode == 'rush' ? ' · Boss Rush' : mode == 'daily' ? ' · Daily' : ''), 10, boss ? 58 : 22); g.fillText(A.fmt(score||0) + ' pts', 10, boss ? 78 : 42);
      g.textAlign = 'right'; g.fillText('❄ ' + (flakes||0) + '   ♥ ' + (me ? Math.max(0, me.hp) : 0) + '/' + (me ? me.max : 0), 540, boss ? 58 : 22);
      if (me) { g.fillText('⚪ ' + me.ammo + '/' + maxAmmo() + (me.rollCd > 0 ? '   🤸 ' + me.rollCd.toFixed(1) : '   🤸 ready'), 540, boss ? 78 : 42); }
      if (combo >= 3 && t - comboT < 2.5) { g.fillStyle = '#b48cff'; g.font = '800 18px '+A.font; g.textAlign = 'center'; g.fillText('COMBO ×' + combo, 300, MID - 34); }
      const act = Object.keys(pw).filter(k2 => pw[k2] > 0).map(k2 => ({icy:'❄', mega:'💥', rapid:'⚡', shield:'🛡'}[k2] + (k2 == 'shield' ? '' : Math.ceil(pw[k2])))).join('  '); if (act) { g.textAlign = 'left'; g.font = '700 14px '+A.font; g.fillText(act, 10, FIELD - 10); }
      if (packing && phase == 'fight') { g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, me.x - 30, me.y + 40, 60, 7, 3); g.fill(); g.fillStyle = packT >= .6 ? '#FF4539' : '#64CDF5'; rr(g, me.x - 30, me.y + 40, 60*Math.min(1, packT), 7, 3); g.fill(); } }
    g.fillStyle = '#14204a'; g.beginPath(); g.arc(574, 22, 15, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '800 16px '+A.font; g.textAlign = 'center'; g.fillText('?', 574, 28);
    // ----- bottom bar: touch controls in a fight, the build menu between waves -----
    g.fillStyle = '#14204a'; g.fillRect(0, BAR, w, h - BAR);
    if (st == 'play' && phase == 'build') { const cols = 7; TOOLS.forEach((T2, i) => { const x = (i % cols)*w/cols, y = BAR + Math.floor(i/cols)*50, cost = toolCost(T2.k), can = ['go', 'role', 'undo', 'remove'].includes(T2.k) || flakes >= cost;
        g.fillStyle = tool == i ? '#D5F367' : can ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.06)'; rr(g, x + 3, y + 4, w/cols - 6, 42, 9); g.fill(); g.fillStyle = tool == i ? '#14204a' : '#fff'; g.textAlign = 'center';
        g.font = '15px '+A.font; g.fillText(T2.e, x + w/cols/2, y + 22); g.font = '700 10px '+A.font; g.fillText(T2.n + (['go', 'role', 'undo', 'remove'].includes(T2.k) ? '' : CAPS[T2.k] && capN(T2.k) >= CAPS[T2.k] ? ' · max' : isFinite(cost) ? ' · ' + cost + '❄' : ' · full'), x + w/cols/2, y + 38); });
      g.fillStyle = '#14204a'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText(PLACE.includes(TOOLS[tool].k) ? (TOOLS[tool].k == 'remove' ? 'BUILD TIME · tap one of your walls or buildings to remove it (refund)' : 'BUILD TIME · tap your side to place ' + TOOLS[tool].e + ' ' + TOOLS[tool].n + ' · Z undoes') : 'BUILD TIME · pick something below, then ▶ Next wave', 300, MID + 40); }
    else if (st == 'play') { const L = [['◀', touch.l], ['▶', touch.r], ['🦆 Duck', touch.duck || me.duck], ['🤸 Roll', me.roll > 0], [me.ab > 0 ? '⭐ ' + Math.ceil(me.ab) + 's' : '⭐ ' + CL().ab, me.ab <= 0]]; L.forEach(([tx2, on], i) => { const x = i*w/5; g.fillStyle = on ? '#D5F367' : 'rgba(255,255,255,.16)'; rr(g, x + 5, BAR + 12, w/5 - 10, 76, 14); g.fill(); g.fillStyle = on ? '#14204a' : '#fff'; g.font = '800 18px '+A.font; g.textAlign = 'center'; g.fillText(tx2, x + w/10, BAR + 58); }); }
    if (msgT > 0 && st == 'play') { g.fillStyle = 'rgba(20,32,74,.85)'; rr(g, 30, MID - 22, w - 60, 40, 12); g.fill(); g.fillStyle = '#fff'; g.font = '700 14px '+A.font; g.textAlign = 'center'; g.fillText(msg, 300, MID + 3); }
    // ----- menus -----
    if (st != 'play') { g.fillStyle = 'rgba(20,32,74,.8)'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 34px '+A.font; g.fillText(st == 'over' ? 'SNOWED UNDER' : 'SNOWBALL SHOWDOWN', 300, 130);
      g.font = '600 15px '+A.font; g.fillStyle = '#cfe3f5'; g.fillText(st == 'over' ? A.fmt(score||0) + ' points · wave ' + wave + (msgT > 0 ? ' · ' + msg : '') : __skip ? 'Saved game · tap anywhere or press Space to keep going' : 'Best wave ' + PERM.best + ' · 🧊 ' + A.fmt(PERM.cr) + ' ice crystals', 300, 170);
      g.font = '700 14px '+A.font; g.fillStyle = '#D5F367'; if (!__skip) g.fillText(CL().e + ' ' + CL().n + ' · level ' + clsLv(PERM.cls) + ' · ' + (BALLS[PERM.ball] || BALLS.snow).e + ' ' + (BALLS[PERM.ball] || BALLS.snow).n + ' · ❄ ' + PERM.frost + ' Frost Crystals', 300, 196);
      if (!__skip) MENU.forEach(([k, n], i) => { const by = 210 + i*54; g.fillStyle = k == mode && st == 'over' ? '#D5F367' : k == 'world' ? '#ffd08a' : k == 'up' ? '#64CDF5' : k == 'class' || k == 'loadout' ? '#ffe9a0' : k == 'guide' ? 'rgba(255,255,255,.2)' : '#ffffff'; rr(g, 150, by, 300, 48, 14); g.fill(); g.fillStyle = '#14204a'; g.font = '800 18px '+A.font; g.fillText(n, 300, by + 31); }); }
    if (upOpen) { g.fillStyle = 'rgba(10,20,50,.95)'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 26px '+A.font; g.fillText('🧊 Permanent upgrades', 300, 70); g.font = '600 14px '+A.font; g.fillStyle = '#9fe8ff'; g.fillText('You have ' + PERM.cr + ' ice crystals · tap an upgrade to buy it · earn crystals every game', 300, 96);
      PUPS.forEach((u, i) => { const B2 = upBox(i), L = PU(u.k), mx2 = L >= u.max, cst = pcost(u), can = !mx2 && PERM.cr >= cst; g.fillStyle = can ? 'rgba(0,180,81,.22)' : 'rgba(255,255,255,.08)'; rr(g, B2.x, B2.y, 284, 40, 10); g.fill();
        g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '800 13px '+A.font; g.fillText(u.n + ' · ' + L + '/' + u.max, B2.x + 10, B2.y + 16); g.font = '500 11px '+A.font; g.fillStyle = '#cfe3f5'; g.fillText(u.d, B2.x + 10, B2.y + 32);
        g.textAlign = 'right'; g.font = '800 13px '+A.font; g.fillStyle = mx2 ? '#D5F367' : can ? '#7fe08a' : '#9fb8d0'; g.fillText(mx2 ? 'MAX' : '🧊 ' + cst, B2.x + 274, B2.y + 16); });
      g.fillStyle = '#ffffff'; rr(g, 200, 644, 200, 44, 12); g.fill(); g.fillStyle = '#14204a'; g.textAlign = 'center'; g.font = '800 16px '+A.font; g.fillText('Done', 300, 672); }
    if (guide) { g.fillStyle = 'rgba(10,20,50,.95)'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '900 26px '+A.font; g.fillText('❓ How to play', 30, 60);
      [['🎯', 'Aim at the top half and HOLD to pack a bigger snowball, let go to throw. Quick taps = small fast ones.'], ['🧱', 'Your snowballs fly OVER your own walls. Enemy snowballs hit your walls.'], ['🦆', 'Duck (Shift, C or the Duck button) behind a wall: straight throws can’t hit you.'],
       ['⚪', 'You carry 10 snowballs. Scoop more on the ❄ piles or while ducking behind a wall.'], ['🤸', 'Move anywhere on your side with WASD / arrows, or tap where to walk. Dodge-roll with E, Roll, or double-tap.'], ['☕', 'Heal: cocoa drops, ☕ Warm Up between waves, or stand near your 🔥 campfire.'],
       ['🏰', 'Between waves build walls, forts (roof stops catapults), turrets, trap pits, ice and a campfire.'], ['🧒', 'Teammates: throwers, builders (fix walls) and medics. Stand next to a knocked-out one to help them up.'], ['👑', 'Bosses every 5 waves (the Frost Dragon every 20). Each has 3 phases.']]
        .forEach(([e2, tx2], i) => { const y = 110 + i*58; g.font = '28px '+A.font; g.fillText(e2, 30, y + 14); g.fillStyle = '#e8f4ff'; g.font = '600 14px '+A.font; const words = tx2.split(' '); let line = '', ly = y; words.forEach(wd => { if (g.measureText(line + wd).width > 480) { g.fillText(line, 80, ly); line = ''; ly += 18; } line += wd + ' '; }); g.fillText(line, 80, ly); g.fillStyle = '#fff'; });
      g.textAlign = 'center'; g.font = '700 15px '+A.font; g.fillStyle = '#D5F367'; g.fillText('Tap anywhere to close', 300, 680); } });
  // ---- admin controls (only in this game) ----
  A.admins = A.admins || {}; A.admins.snowball = [
    {label:'Go to wave', num:10, min:1, run:n => { if (st != 'play') startGame(mode); wave = Math.floor(n) - 1; boss = null; foes = []; nextWave(); }},
    {label:'Add snowflakes', num:500, min:1, run:n => { flakes += Math.floor(n); }},
    {label:'Add hearts', num:5, min:1, max:50, run:n => { if (me) { me.max = A.lives(me.max + Math.floor(n)); me.hp = me.max; } }},
    {label:'Spawn boss', run:() => { if (st != 'play') startGame(mode); const k = ['yeti', 'plow', 'witch', 'dragon'][Math.floor(Math.random()*4)], B = BOSSES[k]; boss = {k, n:B.n, x:300, y:k == 'dragon' ? 118 : 100, hp:B.hp, max:B.hp, cool:2, vx:90, charge:0, col:B.col, ph:1, tp:0, kb:0}; phase = 'fight'; say(B.n + ' appears!', 2); }},
    {label:'Add ice crystals', num:100, min:1, run:n => { PERM.cr += Math.floor(n); savePerm(); }},
    {label:'Add Frost Crystals', num:100, min:1, run:n => { PERM.frost += Math.floor(n); savePerm(); }},
    {label:'Give gear (rarity 0-5)', num:4, min:0, max:5, run:n => { makeGear(Math.floor(n)); }},
    {label:'Kingdom: reveal whole map', run:() => { if (!wm) openWorld(); wm && wm.admin.reveal(); }},
    {label:'Kingdom: give runes + free Mau Mau', run:() => { if (!wm) openWorld(); wm && wm.admin.quest(); }},
    {label:'Kingdom: teleport to region (1 camp 2 forest 3 lake 4 caves 5 pass 6 castle 7 village 8 aurora 9 coast 10 ruins 11 yeti 12 hollow 13 old road 14 shrine 15 hall 16 peak)', num:1, min:1, max:16, run:n => { if (!wm) openWorld(); wm && wm.adm.tp(['camp','forest','lake','caves','pass','castle','village','aurora','coast','ruins','yeti','hollow','oldroad','shrine','hall','peak'][Math.floor(n) - 1]); }},
    {label:'Kingdom: add snowflakes', num:1000, min:1, run:n => { if (!wm) openWorld(); wm && wm.adm.flakes(n); }},
    {label:'Dumpling Saga: teleport to region (1 Frostfang 2 Glaciers 3 Sunken Temple 4 Whisperwood 5 Sky Islands 6 Crystal Desert 7 Gecko’s Hollow 8 Citadel 9 Forbidden Temple 10 Sky Above 11 Frozen Void)', num:1, min:1, max:11, run:n => { if (!wm) openWorld(); const S2 = A.SAGA && A.SAGA.story; S2 && S2.adm.region(S2.adm.regions()[Math.floor(n) - 1]); }},
    {label:'Dumpling Saga: jump to chapter (1-9)', num:1, min:1, max:9, run:n => { if (!wm) openWorld(); const S2 = A.SAGA && A.SAGA.story; S2 && S2.adm.chapter(n); }},
    {label:'Dumpling Saga: jump to Dumpling fight (1-6)', num:1, min:1, max:6, run:n => { if (!wm) openWorld(); const S2 = A.SAGA && A.SAGA.story; S2 && S2.adm.fight(n); }},
    {label:'Dumpling Saga: start the post-game (Cat Gone Missing)', run:() => { if (!wm) openWorld(); const S2 = A.SAGA && A.SAGA.story; S2 && S2.adm.post && S2.adm.post(); }},
    {label:'Dumpling Saga: jump to godlike fight (1-3) or the Gecko God (4)', num:4, min:1, max:4, run:n => { if (!wm) openWorld(); const S2 = A.SAGA && A.SAGA.story; S2 && S2.adm.god && S2.adm.god(n); }},
    {label:'Dumpling Saga: skip boss phase', run:() => { const S2 = A.SAGA && A.SAGA.story; S2 && S2.adm.phase(); }},
    {label:'Dumpling Saga: add stamina', num:50, min:1, run:n => { if (!wm) openWorld(); const S2 = A.SAGA && A.SAGA.story; S2 && S2.adm.stamina(n); }},
    {label:'Kingdom: add Frost', num:100, min:1, run:n => { if (!wm) openWorld(); wm && wm.adm.frost(n); }},
    {label:'Kingdom: give item (rarity 0-5)', num:4, min:0, max:5, run:n => { if (!wm) openWorld(); wm && wm.adm.item(n); }},
    {label:'Kingdom: add hearts', num:5, min:1, max:500, run:n => { if (!wm) openWorld(); wm && wm.adm.hearts(n); }},
    {label:'Kingdom: spawn boss (1 Grumblebark 2 Icefang 3 Crystal Golem 4 Rufus 5 Loki 6 Frost Wraith 7 Storm Golem 8 Lonely Fog 9 Storm Elite 10 Chao Chao 11 Storm Echo 12 Yeti King 13 Ice Giant 14 Frostbeard 15 Aurora Serpent)', num:5, min:1, max:15, run:n => { if (!wm) openWorld(); wm && wm.adm.boss(['grumble','icefang','crystal','rufus','loki','wraith','guardian','fog','elite_hurt','chao','echo','yeti','giant','frostbeard','serpent'][Math.floor(n) - 1]); }},
    {label:'Kingdom: complete current quest step', run:() => { if (!wm) openWorld(); wm && wm.adm.quest(); }},
    {label:'Kingdom: jump to story chapter (0 before · 1-5 chapters · 6 epilogue)', num:1, min:0, max:6, run:n => { if (!wm) openWorld(); wm && wm.adm.chapter(n); }},
    {label:'Kingdom: start a village siege', run:() => { if (!wm) openWorld(); wm && wm.adm.siege(); }},
    {label:'Raids: start a raid on Normal (1 Library 2 Catacombs 3 Labyrinth 4 Citadel 5 Vault 6 Kitchen 7 Temple 8 Hollow 9 Clockwork 10 Void)', num:1, min:1, max:10, run:n => { if (!wm) openWorld(); wm && wm.adm.raid(n, 0); }},
    {label:'Raids: start a raid on Mythic (1-10)', num:1, min:1, max:10, run:n => { if (!wm) openWorld(); wm && wm.adm.raid(n, 2); }},
    {label:'Raids: teleport to raid floor', num:1, min:1, max:8, run:n => { const R2 = wm && wm.adm.raids(); R2 && R2.floor(n); }},
    {label:'Raids: spawn the raid boss (jumps to the last floor)', run:() => { if (!wm) openWorld(); const R2 = wm && wm.adm.raids(); R2 && R2.boss(); }},
    {label:'Raids: skip boss phase (or finish the floor)', run:() => { const R2 = wm && wm.adm.raids(); R2 && R2.skip(); }},
    {label:'Raids: give a raid set piece (Legendary)', run:() => { if (!wm) openWorld(); const R2 = wm && wm.adm.raids(); R2 && R2.gear(); }},
    {label:'Raids: set every raid key level', num:5, min:0, run:n => { if (!wm) openWorld(); const R2 = wm && wm.adm.raids(); R2 && R2.key(n); }},
    {label:'Raids: reset weekly lockouts', run:() => { if (!wm) openWorld(); const R2 = wm && wm.adm.raids(); R2 && R2.resetLock(); }},
    {label:'Raids: unlock every difficulty', run:() => { if (!wm) openWorld(); const R2 = wm && wm.adm.raids(); R2 && R2.unlockAll(); }},
    {label:'Raids: add Raid Tokens', num:500, min:1, run:n => { if (!wm) openWorld(); const R2 = wm && wm.adm.raids(); R2 && R2.tokens(n); }},
    {label:'Raids: toggle boss hints', run:() => { if (!wm) openWorld(); const R2 = wm && wm.adm.raids(); if (R2) { const RS = wm.adm.raids && window.Arcade._dbg && window.Arcade._dbg.snow().wm().dbg().W.rs; if (RS) RS.hints = RS.hints ? 0 : 1; } }},
    {label:'Kingdom: add kingdom XP', num:1000, min:1, run:n => { if (!wm) openWorld(); wm && wm.adm.kxp(n); }},
    {label:'Kingdom: max base (Level 12 + all rooms 12)', run:() => { if (!wm) openWorld(); wm && wm.adm.base(); }},
    {label:'Kingdom: set base level (1-12)', num:12, min:1, max:12, run:n => { if (!wm) openWorld(); wm && wm.adm.baseLv(n); }},
    {label:'Kingdom: set every open room to level (0-12, up to base level)', num:12, min:0, max:12, run:n => { if (!wm) openWorld(); wm && wm.adm.roomLv(n); }},
    {label:'Kingdom: base level rewards can be earned again', run:() => { if (!wm) openWorld(); wm && wm.adm.mileReset(); }},
        {label:'Kingdom: side story — finish the current step (or start the next one)', run:() => { if (!wm) openWorld(); wm && wm.adm.sq(); }},
    {label:'Kingdom: finish every available side story', run:() => { if (!wm) openWorld(); wm && wm.adm.sqAll(); }}];
  // ---- save & resume (old v2 saves still load) ----
  api.snap && api.snap(() => (st == 'play') ? {v:3, mode, seed, me, foes, walls, builds, mates, drops, score, wave, flakes, boss, phase, arena, pw, bossesBeat} : null);
  { const R0 = api.resume; if (R0 && (R0.v == 2 || R0.v == 3)) { try {
      if (R0.v == 3) ({mode, seed, me, foes, walls, builds, mates, drops, score, wave, flakes, boss, phase, arena, pw, bossesBeat} = R0);
      else { startGame('endless'); score = R0.score || 0; wave = R0.wave || 1; flakes = R0.flakes || 20; arena = R0.arena || 0; phase = 'build'; foes = []; boss = null; if (R0.me) { me.hp = R0.me.hp; me.max = R0.me.max; } }
      me.ammo = me.ammo == null ? maxAmmo() : me.ammo; me.y = PY; balls = []; api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] snowball resume failed', e); } } }
  A._dbg = A._dbg || {}; A._dbg.snow = () => ({wm:() => wm, openWorld, PERM, useAbility, makeGear, openPanel, CLS_K, me, foes, boss, wave, phase, walls, builds, mates, flakes, st, mode, balls, PERM, set:o => { if (o.wave != null) wave = o.wave; if (o.flakes != null) flakes = o.flakes; }, nextWave, useTool, startGame, throwAt:(x, y, p) => { aim = {x, y}; packT = p || 0; mouseOn = true; throwMine(); }});
  return () => { if (wm) { wm.close(); wm = null; } closePanelS(); offK(); offL(); K.off(); window.removeEventListener('keydown', dkd); window.removeEventListener('keyup', dku); window.removeEventListener('blur', dbl); if (A.admins) delete A.admins.snowball; if (A.onCash) delete A.onCash.snowball; };
}});

// =====================================================================================================
// SPROUT FARM — a busy 2-minute day in the garden: plant, water, harvest, fill orders. (Played actively — no passive income.)
// =====================================================================================================
A.register('farm', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 480, 560); c.style.touchAction = 'none';
  const CROPS = [{k:'carrot',e:'🥕',grow:6,pts:20},{k:'corn',e:'🌽',grow:9,pts:35},{k:'tomato',e:'🍅',grow:8,pts:30},{k:'pumpkin',e:'🎃',grow:14,pts:70},{k:'berry',e:'🍓',grow:7,pts:25}];
  let st = 'ready', plots, seed = 0, orders, score, timeLeft, t = 0, tool = 'plant', quiz = false, coinsPop = [], dayN = 0;
  const reset = () => { if (__skip) { __skip = false; return; } plots = Array.from({length:12}, () => ({c:null, g:0, water:0, wilt:0})); orders = []; score = 0; timeLeft = 120 + 10*A.U('time'); dayN++; addOrder(); addOrder(); api.score(0); };
  const addOrder = () => { const n = 2 + Math.floor(Math.random()*2), need = {}; for (let i = 0; i < n; i++) { const cr = CROPS[Math.floor(Math.random()*CROPS.length)]; need[cr.k] = (need[cr.k]||0) + 1; } orders.push({need, t:A.D(55, 45, 35)}); };
  const inv = {}; const PX = (i) => 20 + (i % 4) * 112, PY = (i) => 170 + Math.floor(i / 4) * 110;
  const tap = q => { if (st != 'play') { reset(); for (const k in inv) inv[k] = 0; st = 'play'; return; } if (quiz) return;
    if (q.y > h - 60) { const i = Math.floor(q.x / (w/7)); if (i < 5) { seed = i; tool = 'plant'; } else if (i == 5) tool = 'water'; else tool = 'pick'; A.sfx('blip'); return; }
    if (q.y < 140) { const i = Math.floor((q.x - 10) / 155); const o = orders[i]; if (o && Object.keys(o.need).every(k => (inv[k]||0) >= o.need[k])) { let pts = 0; for (const k in o.need) { inv[k] -= o.need[k]; pts += o.need[k] * CROPS.find(cc => cc.k == k).pts; } pts = Math.round(pts * 2 * (1 + .1*A.U('market'))); score += pts; api.score(score); orders.splice(i, 1); A.sfx('win'); coinsPop.push({x:q.x, y:q.y, txt:'+'+pts, t:1}); stat(api,'farmOrders',1,'add'); } return; }
    const i = plots.findIndex((p, k) => q.x > PX(k) && q.x < PX(k) + 100 && q.y > PY(k) && q.y < PY(k) + 100); if (i < 0) return; const p = plots[i];
    if (!p.c) { p.c = CROPS[seed]; p.g = 0; p.water = 1; p.wilt = 0; A.tone(400,.05,'triangle',.04); }
    else if (p.g >= 1) { inv[p.c.k] = (inv[p.c.k]||0) + 1; score += 5; api.score(score); coinsPop.push({x:PX(i)+50, y:PY(i)+30, txt:p.c.e, t:1}); p.c = null; A.sfx('coin'); }
    else { p.water = 1; A.tone(700,.04,'sine',.04); } };
  c.addEventListener('pointerdown', e => tap(pt(c, e, w, h)));
  const offK = A.keys(e => { if (e.type == 'keydown' && (e.key == ' ' || e.key == 'Enter') && st != 'play') tap({x:0, y:300}); const n = +e.key; if (n >= 1 && n <= 5) seed = n - 1; });
  const offL = A.loop(dt => { t += dt; for (const cp of coinsPop) { cp.t -= dt; cp.y -= 30*dt; } coinsPop = coinsPop.filter(cp => cp.t > 0);
    if (st == 'play' && !quiz) { timeLeft -= dt;
      for (const p of plots) { if (!p.c) continue; if (p.g < 1) { if (p.water > 0) { p.g += dt / p.c.grow * A.D(1.3, 1, .85) * (1 + .1*A.U('soil')); p.water -= dt / (A.D(9, 7, 5)); } else { p.wilt += dt; if (p.wilt > A.D(8, 6, 4)) { p.c = null; A.sfx('bad'); } } } else { p.wilt += dt * .5; if (p.wilt > 18) { p.c = null; } } }
      for (const o of orders) o.t -= dt; const lost = orders.filter(o => o.t <= 0).length; if (lost) { orders = orders.filter(o => o.t > 0); A.sfx('bad'); }
      if (orders.length < 3 && Math.random() < dt / 9) addOrder(); if (!orders.length) addOrder();
      if (timeLeft <= 0) { timeLeft = 0; quiz = learn2(host, api, 'SUNSET! ANSWER FOR 20 MORE SECONDS OF DAYLIGHT', () => { quiz = false; timeLeft = 20; }, () => { quiz = false; st = 'over'; A.sfx('win'); stat(api,'farmBest',score,'max'); api.over(score); }); } }
    g.fillStyle = '#9fd8a0'; g.fillRect(0,0,w,h); g.fillStyle = '#7ac07a'; for (let i = 0; i < 30; i++) g.fillRect((i*67) % w, 150 + (i*41) % 300, 3, 6);
    if (orders) orders.forEach((o, i) => { const x = 10 + i*155, can = Object.keys(o.need).every(k => (inv[k]||0) >= o.need[k]); g.fillStyle = can ? '#eefbe8' : '#fff8e8'; rr(g, x, 40, 148, 92, 12); g.fill(); g.strokeStyle = can ? '#00B451' : '#c8964a'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#5a3a1a'; g.font = '700 12px '+A.font; g.textAlign = 'left'; g.fillText('ORDER · '+Math.ceil(o.t)+' s', x+10, 58); let k2 = 0; for (const k in o.need) { const cr = CROPS.find(cc => cc.k == k); g.font = '22px '+A.font; g.fillText(cr.e, x + 10 + k2*46, 92); g.font = '700 13px '+A.font; g.fillText((inv[k]||0)+'/'+o.need[k], x + 10 + k2*46, 116); k2++; }
      if (can) { g.fillStyle = '#00B451'; g.font = '700 11px '+A.font; g.textAlign = 'right'; g.fillText('TAP TO SELL', x + 140, 58); } });
    if (plots) plots.forEach((p, i) => { const X = PX(i), Y = PY(i); g.fillStyle = p.c && p.water > 0 ? '#5a3a1a' : '#8D5B1D'; rr(g, X, Y, 100, 100, 14); g.fill(); g.strokeStyle = 'rgba(0,0,0,.15)'; for (let r = 1; r < 4; r++) { g.beginPath(); g.moveTo(X+8, Y + r*25); g.lineTo(X+92, Y + r*25); g.stroke(); }
      if (p.c) { const s = clamp(p.g, .15, 1); if (p.g < 1) { g.strokeStyle = p.wilt > 0 ? '#b8a060' : '#3fae5a'; g.lineWidth = 4; g.beginPath(); g.moveTo(X+50, Y+80); g.lineTo(X+50, Y+80 - 40*s); g.stroke(); g.fillStyle = p.wilt > 0 ? '#b8a060' : '#5fd46a'; g.beginPath(); g.ellipse(X+42, Y+80-40*s, 8*s+2, 4*s+2, -.5, 0, TAU); g.ellipse(X+58, Y+80-36*s, 8*s+2, 4*s+2, .5, 0, TAU); g.fill();
          g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, X+10, Y+88, 80, 6, 3); g.fill(); g.fillStyle = '#F9BF01'; rr(g, X+10, Y+88, 80*p.g, 6, 3); g.fill(); if (p.water <= 0) { g.font = '18px '+A.font; g.textAlign = 'center'; g.fillText('💧?', X+80, Y+24); } }
        else { g.font = (34 + Math.sin(t*5)*2)+'px '+A.font; g.textAlign = 'center'; g.fillText(p.c.e, X+50, Y+62); g.fillStyle = '#fff'; g.font = '700 11px '+A.font; g.fillText('TAP TO PICK', X+50, Y+92); } }
      else { g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('PLANT '+CROPS[seed].e, X+50, Y+55); } });
    CROPS.forEach((cr, i) => { const X = i*w/7; g.fillStyle = seed == i ? '#D5F367' : 'rgba(255,255,255,.55)'; rr(g, X+4, h-56, w/7-8, 50, 10); g.fill(); g.font = '24px '+A.font; g.textAlign = 'center'; g.fillText(cr.e, X + w/14, h-24); g.fillStyle = '#5a3a1a'; g.font = '700 10px '+A.font; g.fillText((inv[cr.k]||0)+' · '+(i+1), X + w/14, h-10); });
    g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, 5*w/7+4, h-56, 2*w/7-8, 50, 10); g.fill(); g.fillStyle = '#5a3a1a'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('Tap a growing plant', 6*w/7, h-34); g.fillText('to water it 💧', 6*w/7, h-18);
    for (const cp of coinsPop) { g.globalAlpha = cp.t; g.fillStyle = '#015640'; g.font = '800 20px '+A.font; g.textAlign = 'center'; g.fillText(cp.txt, cp.x, cp.y); } g.globalAlpha = 1;
    g.fillStyle = '#015640'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('🌾 '+A.fmt(score||0), 12, 26); g.textAlign = 'right'; g.fillText('☀ '+Math.ceil(timeLeft||0)+' s', w-12, 26);
    if (st == 'ready') A.overlayText(g, w, h, 'SPROUT FARM', __skip ? 'Saved game · tap or press Space to continue' : 'Pick a seed below, tap a plot to plant, tap to water, tap to pick · fill orders!');
    if (st == 'over') A.overlayText(g, w, h, 'WHAT A DAY!', A.fmt(score||0)+' points · tap to farm again'); });
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, inv:{...inv}, orders, score, timeLeft, plots: plots.map(p2 => ({...p2, c: p2.c ? p2.c.k : null}))} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({orders, score, timeLeft} = R0); Object.assign(inv, R0.inv||{}); plots = R0.plots.map(p2 => ({...p2, c: p2.c ? CROPS.find(cc => cc.k == p2.c) : null})); api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] farm resume failed', e); } } }
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// CRITTER CARDS — memory battle. Each pair you match makes your critter attack; every miss lets the rival attack.
// =====================================================================================================
A.register('cardbattle', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 480, 580); c.style.touchAction = 'none';
  const CARDS = [{e:'🦊',n:'Fox',dmg:2},{e:'🐻',n:'Bear',dmg:3},{e:'🦉',n:'Owl',dmg:2},{e:'🐺',n:'Wolf',dmg:3},{e:'🦌',n:'Deer',dmg:2},{e:'🦅',n:'Eagle',dmg:3},{e:'🐸',n:'Frog',dmg:1,heal:2},{e:'🦔',n:'Hedgehog',dmg:1,shield:1},{e:'🐉',n:'Dragon',dmg:5},{e:'🦄',n:'Unicorn',dmg:2,heal:3}];
  const FOES = [{e:'🦝',n:'Sneaky Raccoon',hp:10,atk:2},{e:'🐗',n:'Grumpy Boar',hp:14,atk:2},{e:'🦂',n:'Desert Scorpion',hp:16,atk:3},{e:'🐊',n:'Swamp Gator',hp:20,atk:3},{e:'🦖',n:'Rex the Mighty',hp:26,atk:4},{e:'👾',n:'Pixel Phantom',hp:32,atk:4}];
  let st = 'ready', deck, open = [], foe, foeHp, myHp, myMax, shield, score, stage, lock = 0, t = 0, fx = [], quiz = false, turnMsg = '';
  const deal = () => { const n = A.D(6, 8, 10); const pick = shuffle(CARDS.slice()).slice(0, n/2 + (n > 8 ? 1 : 0)).slice(0, n/2); deck = shuffle([...pick, ...pick].map(cd => ({...cd, up:false, gone:false}))); open = []; };
  const reset = () => { if (__skip) { __skip = false; return; } stage = 0; score = 0; myMax = A.D(14, 12, 10) + 2*A.U('life'); myHp = myMax; shield = 0; nextFoe(); api.score(0); };
  const nextFoe = () => { foe = FOES[Math.min(stage, FOES.length-1)]; foeHp = foe.hp + Math.max(0, stage - FOES.length + 1)*8; deal(); turnMsg = foe.n+' appears!'; };
  const layout = () => { const n = deck.length, cols = n <= 8 ? 4 : 5, rows = Math.ceil(n / cols), cw = Math.min(88, (w - 40) / cols - 8), ch = cw * 1.25; return {cols, cw, ch, ox:(w - cols*(cw+8))/2 + 4, oy:250}; };
  const flip = i => { if (st != 'play' || lock > 0 || quiz) return; const cd = deck[i]; if (!cd || cd.up || cd.gone) return; cd.up = true; open.push(cd); A.tone(500,.04,'triangle',.04);
    if (open.length == 2) { lock = .7; const [a, b] = open; if (a.e == b.e) { setTimeout(() => { a.gone = b.gone = true; const dmg = a.dmg * (1 + .15*A.U('power')); foeHp -= dmg; if (a.heal) myHp = Math.min(myMax, myHp + a.heal); if (a.shield) shield += a.shield; score += Math.round(dmg*30); api.score(score); fx.push({t:.6, txt:'-'+Math.round(dmg*10)/10, x:w/2, y:120, col:'#FF4539'}); turnMsg = a.n+' attacks!'+(a.heal?' +'+a.heal+' HP':'')+(a.shield?' +shield':''); A.sfx('hit');
          if (foeHp <= 0) { score += 300*(stage+1); api.score(score); A.sfx('win'); stat(api,'cardFoes',1,'add'); stage++; setTimeout(nextFoe, 700); } else if (deck.every(x => x.gone)) deal(); open = []; }, 450); }
      else setTimeout(() => { a.up = b.up = false; open = []; if (shield > 0) { shield--; turnMsg = 'Your Hedgehog blocks the attack!'; } else { myHp -= foe.atk; fx.push({t:.6, txt:'-'+foe.atk, x:w/2, y:210, col:'#ff8a3c'}); turnMsg = foe.n+' strikes back!'; A.sfx('bad'); }
        if (myHp <= 0 && !A.immortal) quiz = learn2(host, api, 'YOUR CRITTERS ARE TIRED! ANSWER TO HEAL', () => { quiz = false; myHp = Math.ceil(myMax/2); }, () => { quiz = false; st = 'over'; A.sfx('over'); api.over(score); }); }, 650); } };
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } const q = pt(c, e, w, h), L = layout(); deck.forEach((cd, i) => { const x = L.ox + (i % L.cols)*(L.cw+8), y = L.oy + Math.floor(i / L.cols)*(L.ch+8); if (q.x > x && q.x < x + L.cw && q.y > y && q.y < y + L.ch) flip(i); }); });
  let cur = 0; const offK = A.keys(e => { if (e.type != 'keydown') return; if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; return; } if (st != 'play') return; const L = layout(), m = {ArrowLeft:-1, ArrowRight:1, ArrowUp:-L.cols, ArrowDown:L.cols}[e.key]; if (m) cur = clamp(cur + m, 0, deck.length-1); if (e.key == ' ' || e.key == 'Enter') flip(cur); });
  const offL = A.loop(dt => { A.mood(() => ({danger: st=="play" && foe && myHp>0 && myHp<=foe.atk, boss: false})); t += dt; lock = Math.max(0, lock - dt); for (const f of fx) { f.t -= dt; f.y -= 30*dt; } fx = fx.filter(f => f.t > 0);
    const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0, '#2a1a4a'); gr.addColorStop(1, '#0b2e24'); g.fillStyle = gr; g.fillRect(0,0,w,h);
    if (foe) { g.font = (58 + Math.sin(t*3)*3)+'px '+A.font; g.textAlign = 'center'; g.fillText(foe.e, w/2, 110); g.fillStyle = '#fff'; g.font = '700 15px '+A.font; g.fillText(foe.n+' · stage '+(stage+1), w/2, 140);
      const fm = foe.hp + Math.max(0, stage - FOES.length + 1)*8; g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, w/2-110, 150, 220, 12, 6); g.fill(); g.fillStyle = '#FF4539'; rr(g, w/2-110, 150, 220*clamp(foeHp/fm, 0, 1), 12, 6); g.fill();
      g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, w/2-110, 200, 220, 12, 6); g.fill(); g.fillStyle = '#00B451'; rr(g, w/2-110, 200, 220*clamp(myHp/myMax, 0, 1), 12, 6); g.fill(); g.fillStyle = '#D5F367'; g.font = '700 12px '+A.font; g.fillText('YOUR CRITTERS '+Math.max(0, Math.round(myHp))+'/'+myMax+(shield ? ' · 🛡'+shield : ''), w/2, 230);
      g.fillStyle = '#fff'; g.font = '13px '+A.font; g.fillText(turnMsg, w/2, 186); }
    if (deck) { const L = layout(); deck.forEach((cd, i) => { if (cd.gone) return; const x = L.ox + (i % L.cols)*(L.cw+8), y = L.oy + Math.floor(i / L.cols)*(L.ch+8);
        g.fillStyle = cd.up ? '#fff8e8' : '#5B2A86'; rr(g, x, y, L.cw, L.ch, 10); g.fill(); g.strokeStyle = i == cur ? '#D5F367' : 'rgba(255,255,255,.3)'; g.lineWidth = i == cur ? 3 : 1.5; g.stroke();
        if (cd.up) { g.font = Math.floor(L.cw*.45)+'px '+A.font; g.textAlign = 'center'; g.fillText(cd.e, x + L.cw/2, y + L.ch*.55); g.fillStyle = '#5a3a1a'; g.font = '700 10px '+A.font; g.fillText(cd.n+' · '+cd.dmg+'⚔'+(cd.heal?' +'+cd.heal+'❤':'')+(cd.shield?' 🛡':''), x + L.cw/2, y + L.ch - 8); }
        else { g.fillStyle = 'rgba(255,255,255,.15)'; g.font = Math.floor(L.cw*.4)+'px '+A.font; g.textAlign = 'center'; g.fillText('🐾', x + L.cw/2, y + L.ch*.6); } }); }
    for (const f of fx) { g.globalAlpha = f.t*1.6; g.fillStyle = f.col; g.font = '800 28px '+A.font; g.textAlign = 'center'; g.fillText(f.txt, f.x, f.y); } g.globalAlpha = 1;
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText(A.fmt(score||0), 12, 26);
    if (st == 'ready') A.overlayText(g, w, h, 'CRITTER CARDS', __skip ? 'Saved game · tap or press Space to continue' : 'Match pairs to attack · a miss lets the rival hit back · tap to start');
    if (st == 'over') A.overlayText(g, w, h, 'BATTLE OVER', A.fmt(score||0)+' points · reached stage '+(stage+1)+' · tap to battle again'); });
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, deck, stage, foeHp, myHp, myMax, shield, score} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({deck, stage, foeHp, myHp, myMax, shield, score} = R0); foe = FOES[Math.min(stage, FOES.length-1)]; open = []; api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] cardbattle resume failed', e); } } }
  return () => { offK(); offL(); };
}});
})();
