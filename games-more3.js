// Wilderland Arcade · GAMES PACK 3 — Crate Camp, Air Hockey, Carnival Toss, Word Woods, Stream Fixer, Snowball Showdown, Sprout Farm, Critter Cards.
(function(){
const A = window.Arcade, C = A.C, TAU = Math.PI*2;
const rr = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const pt = (c, e, w, h) => { const r = c.getBoundingClientRect(); return {x:(e.clientX-r.left)*w/r.width, y:(e.clientY-r.top)*h/r.height}; };
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const learn2 = (host, api, title, yes, no) => { if (!A.learnOn || !A.learnOn()) { no(); return false; } A.quiz(host, title, ok => { try { api.edu && api.edu(ok); } catch(e){} ok ? yes() : no(); }); return true; };
const keysDown = () => { const k = {}; const d = e => { k[e.key] = true; }, u = e => { k[e.key] = false; }; window.addEventListener('keydown', d); window.addEventListener('keyup', u); return {k, off:() => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); }}; };
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
  const load = () => { if (__skip) { __skip = false; return; } map = LV[lvl].map(r => r.padEnd(Math.max(...LV[lvl].map(x => x.length)), ' ').split('')); moves = 0; hist = []; quizUsed = false;
    map.forEach((row, y) => row.forEach((ch, x) => { if (ch == '@' || ch == '+') { P = {x, y}; row[x] = ch == '+' ? '.' : ' '; } })); };
  const isCrate = ch => ch == '$' || ch == '*', isTgt = ch => ch == '.' || ch == '*';
  const move = (dx, dy) => { if (st != 'play') return; const nx = P.x+dx, ny = P.y+dy, ch = map[ny][nx]; if (ch == '#') return;
    if (isCrate(ch)) { const bx = nx+dx, by = ny+dy, bc = map[by][bx]; if (bc == '#' || isCrate(bc)) return; hist.push({P:{...P}, m:map.map(r => r.slice())}); map[by][bx] = bc == '.' ? '*' : '$'; map[ny][nx] = ch == '*' ? '.' : ' '; A.tone(220,.05,'square',.04); }
    else hist.push({P:{...P}, m:map.map(r => r.slice())});
    P.x = nx; P.y = ny; moves++; A.sfx('step');
    if (!map.some(r => r.includes('$'))) { const par = LV[lvl].join('').split('').filter(c2 => c2 == '$' || c2 == '*').length * 8 + 6; const gain = Math.max(50, 300 + (par - moves)*10) * (1 + lvl*.25);
      score += Math.round(gain); solved++; api.score(score); A.sfx('win'); try { const gd = api.gdata ? api.gdata() : {}; if (lvl+2 > (gd.unlocked||1)) api.setGdata && api.setGdata({unlocked: Math.min(LV.length, lvl+2)}); } catch(e){} if (A.learnOn && A.learnOn()) learn2(host, api, 'LEVEL DONE! BONUS QUESTION FOR +150', () => { score += 150; api.score(score); }, () => {}); stat(api,'sokoLevel',lvl+1,'max'); lvl++; if (lvl >= LV.length) { st = 'over'; api.over(score); } else setTimeout(load, 500); } };
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
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Level '+(lvl+1)+'/'+LV.length+'   Moves '+(moves||0), 12, 26); g.textAlign = 'right'; g.fillText((score||0).toLocaleString(), w-12, 26);
    ['↶ Undo (Z)','⟲ Restart (R)','🏁 Finish & cash in'].forEach((tx, i) => { g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, 8 + i*w/3, h-42, w/3-16, 34, 10); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText(tx, i*w/3 + w/6, h-20); });
    if (st == 'ready') A.overlayText(g, w, h, 'CRATE CAMP', __skip ? 'Saved game · tap or press Space to continue' : (startLvl() > 0 ? 'Tap to continue from level '+(startLvl()+1)+' · press 1 to start at level 1' : 'Push every crate onto a red circle · arrows / WASD or swipe · tap to start'));
    if (st == 'over') A.overlayText(g, w, h, solved >= LV.length ? 'ALL CRATES CAMPED!' : 'NICE PUSHING', (score||0).toLocaleString()+' points · '+solved+' levels · tap to play again'); });
  const inside = (x, y) => { let l = false, r2 = false; for (let i = 0; i < x; i++) if (map[y][i] == '#') l = true; for (let i = x+1; i < map[y].length; i++) if (map[y][i] == '#') r2 = true; return l && r2; };
  load();
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
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } ptr = pt(c, e, w, h); }); c.addEventListener('pointermove', e => { ptr = pt(c, e, w, h); });
  const offL = A.loop(dt => { t += dt; dt = Math.min(dt, .033);
    if (st == 'play' && !quiz) { me.px = me.x; me.py = me.y; const kx = (K.k.ArrowRight||K.k.d ? 1 : 0) - (K.k.ArrowLeft||K.k.a ? 1 : 0), ky = (K.k.ArrowDown||K.k.s ? 1 : 0) - (K.k.ArrowUp||K.k.w ? 1 : 0);
      if (kx || ky) { me.x += kx*420*dt; me.y += ky*420*dt; } else if (ptr) { me.x += (ptr.x - me.x) * Math.min(1, dt*18); me.y += (ptr.y - me.y) * Math.min(1, dt*18); }
      me.r = 28 + 3*A.U('mallet'); me.x = clamp(me.x, me.r, w - me.r); me.y = clamp(me.y, h/2 + me.r, h - me.r);
      const mvx = (me.x - me.px)/dt, mvy = (me.y - me.py)/dt;
      // AI
      const aiSp = A.D(240, 330, 430) * (1 - .06*A.U('slowai')), tx = puck.y < h/2 + 60 ? puck.x : w/2, ty = puck.y < h/2 ? Math.min(puck.y - 20, h/2 - ai.r) : 80; const dx = tx - ai.x, dy = ty - ai.y, d = Math.hypot(dx, dy) || 1, mv = Math.min(d, aiSp*dt);
      const apx = ai.x, apy = ai.y; ai.x = clamp(ai.x + dx/d*mv, ai.r, w - ai.r); ai.y = clamp(ai.y + dy/d*mv, ai.r, h/2 - ai.r); const avx = (ai.x - apx)/dt, avy = (ai.y - apy)/dt;
      if (serveT > 0) serveT -= dt; else { puck.x += puck.vx*dt; puck.y += puck.vy*dt; }
      puck.vx *= Math.pow(.6, dt); puck.vy *= Math.pow(.6, dt);
      if (puck.x < puck.r) { puck.x = puck.r; puck.vx = Math.abs(puck.vx); A.tone(300,.03,'square',.03); } if (puck.x > w - puck.r) { puck.x = w - puck.r; puck.vx = -Math.abs(puck.vx); A.tone(300,.03,'square',.03); }
      const inGoal = Math.abs(puck.x - w/2) < GOAL/2;
      if (puck.y < puck.r && !inGoal) { puck.y = puck.r; puck.vy = Math.abs(puck.vy); } if (puck.y > h - puck.r && !inGoal) { puck.y = h - puck.r; puck.vy = -Math.abs(puck.vy); }
      if (puck.y < -puck.r) goal(true); else if (puck.y > h + puck.r) goal(false);
      for (const [m, vx, vy] of [[me, mvx, mvy], [ai, avx, avy]]) { const ddx = puck.x - m.x, ddy = puck.y - m.y, dd = Math.hypot(ddx, ddy); if (dd < m.r + puck.r && dd > 0) { const nx = ddx/dd, ny = ddy/dd; puck.x = m.x + nx*(m.r + puck.r); puck.y = m.y + ny*(m.r + puck.r);
          const rv = (puck.vx - vx)*nx + (puck.vy - vy)*ny; if (rv < 0) { puck.vx -= 1.9*rv*nx; puck.vy -= 1.9*rv*ny; } const sp = Math.hypot(puck.vx, puck.vy), mx = 1100; if (sp > mx) { puck.vx *= mx/sp; puck.vy *= mx/sp; } rally++; A.tone(500,.03,'square',.04); } } }
    g.fillStyle = '#e8f4ff'; g.fillRect(0,0,w,h); g.strokeStyle = '#ff6a6a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h/2); g.lineTo(w, h/2); g.stroke(); g.beginPath(); g.arc(w/2, h/2, 50, 0, TAU); g.stroke();
    g.strokeStyle = '#64CDF5'; g.beginPath(); g.arc(w/2, 0, 80, 0, Math.PI); g.stroke(); g.beginPath(); g.arc(w/2, h, 80, Math.PI, TAU); g.stroke();
    g.fillStyle = '#121313'; g.fillRect(w/2 - GOAL/2, 0, GOAL, 6); g.fillRect(w/2 - GOAL/2, h-6, GOAL, 6);
    if (puck) { g.fillStyle = '#121313'; g.beginPath(); g.arc(puck.x, puck.y, puck.r, 0, TAU); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.arc(puck.x, puck.y, puck.r - 5, 0, TAU); g.stroke(); }
    for (const [m, col] of [[me, '#00B451'], [ai, '#FF4539']]) { if (!m) continue; g.fillStyle = col; g.beginPath(); g.arc(m.x, m.y, m.r, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(m.x, m.y, m.r*.5, 0, TAU); g.fill(); }
    g.fillStyle = '#121313'; g.font = '800 40px '+A.font; g.textAlign = 'right'; g.globalAlpha = .25; g.fillText(String(sAi||0), w - 16, h/2 - 14); g.fillText(String(sMe||0), w - 16, h/2 + 46); g.globalAlpha = 1;
    g.font = '700 14px '+A.font; g.textAlign = 'left'; g.fillText((score||0).toLocaleString()+' pts · first to 7', 10, h/2 - 8);
    if (st == 'ready') A.overlayText(g, w, h, 'AIR HOCKEY', __skip ? 'Saved game · tap or press Space to continue' : 'Move your green mallet with the mouse, a finger or WASD · first to 7');
    if (st == 'over') A.overlayText(g, w, h, sMe > sAi ? 'YOU WIN!' : 'CPU WINS', sMe+' – '+sAi+' · '+score.toLocaleString()+' points · tap for a rematch'); });
  reset(); st = 'ready';
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
    g.fillStyle = '#015640'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Round '+(round||1)+'   '+(score||0).toLocaleString(), 12, 28); g.textAlign = 'right'; g.fillStyle = timeLeft < 20 ? '#FF4539' : '#015640'; g.fillText('⏱ '+Math.ceil(timeLeft||0), w-12, 28);
    if (st == 'ready') A.overlayText(g, w, h, 'WORD WOODS', __skip ? 'Saved game · tap or press Space to continue' : 'Drag across the letters to find every word · tap to start');
    if (st == 'over') A.overlayText(g, w, h, 'TIME\'S UP', (score||0).toLocaleString()+' points · tap to search again'); });
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
    g.fillStyle = '#121313'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Level '+level+'   '+(score||0).toLocaleString()+'   Moves '+moves, 12, 26);
    g.textAlign = 'right'; g.fillText('❤'.repeat(clamp(hearts,0,20)), w - 12, 26);
    if (flow) { g.textAlign = 'left'; g.font = '13px '+A.font; g.fillText('🌳/🐸 '+flow.goals.filter(g2 => g2.ok).length+'/'+flow.goals.length+' reached in the preview · '+flow.leaks.length+' leak'+(flow.leaks.length == 1 ? '' : 's')+(speed ? '   ⏱ '+runT.toFixed(1)+' s' : ''), 12, 48); }
    if (st == 'play') { [['💧 Release water (Enter)', '#3ac8ff'], ['⟲ Restart level (Z)', 'rgba(255,255,255,.35)']].forEach(([tx, col], i) => { g.fillStyle = col; rr(g, 10 + i*w/2, h - 56, w/2 - 20, 46, 12); g.fill(); g.fillStyle = '#121313'; g.font = '700 15px '+A.font; g.textAlign = 'center'; g.fillText(tx, i*w/2 + w/4, h - 27); }); }
    if (msgT > 0 && st == 'play') { g.fillStyle = 'rgba(0,0,0,.65)'; rr(g, 16, h - 112, w - 32, 44, 12); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText(msg, w/2, h - 85); }
    if (st == 'ready') { A.overlayText(g, w, h, 'STREAM FIXER', __skip ? 'Saved game · tap or press Space to continue' : 'Turn pipes so water reaches every 🐸 pond and flows through every 🌳 tree, then release it');
      if (!__skip) { g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText('Tap middle: level '+startLvl()+'   ·   bottom-left: level 1   ·   bottom-right (or S): ⏱ speedrun', w/2, h - 70); } }
    if (st == 'over') A.overlayText(g, w, h, 'THE STREAM IS STUCK', (score||0).toLocaleString()+' points · level '+level+' · tap to try again'); });
  // ---- save & resume ----
  api.snap && api.snap(() => st == 'play' && T ? {v:2, level, score, hearts, moves, events, N, T, srcs, speed, runT} : null);
  { const R0 = api.resume; if (R0 && R0.v == 2) { try { ({level, score, hearts, moves, events, N, T, srcs, speed, runT} = R0); compute(); api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] pipes resume failed', e); } } }
  A._dbg = A._dbg || {}; A._dbg.pipes = () => ({T, N, level, flow, st, make, compute, solve: () => { for (const row of T) for (const Ti of row) { Ti.m = Ti.sol; Ti.beaver = false; Ti.rock = 0; Ti.frozen = 0; if (Ti.k == 'valve') Ti.open = true; if (Ti.dirty) Ti.filter = true; } return compute(); }, release: doRelease});
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// SNOWBALL SHOWDOWN — wave survival snow fight: 5 enemy types, a boss every 5 waves, 3 arenas, power-ups,
// and between waves you build walls, towers and cannons, repair, and hire teammates.
// =====================================================================================================
A.register('snowball', { mount(host, api){
  let __skip = false;
  const {c,g,w,h} = A.canvas(host, 520, 600); c.style.touchAction = 'none';
  const K = keysDown(), MID = 300, FIELD = 520;   // play field is 0..520 tall; the shop bar sits below it
  // ---- arenas ----
  const ARENAS = [
    {k:'lake', n:'Frozen Lake', bg:'#dff2ff', ice:'#c4e6fa', slip:true, walls:[]},
    {k:'village', n:'Snowy Village', bg:'#f2f7fb', ice:'#e2ebf2', walls:[{x:60, y:150, w:70, h:50, house:1}, {x:390, y:150, w:70, h:50, house:1}, {x:225, y:200, w:70, h:40, house:1}]},
    {k:'pass', n:'Mountain Pass', bg:'#eef3f6', ice:'#d6e0e8', wind:true, walls:[{x:0, y:60, w:70, h:440, rock:1}, {x:450, y:60, w:70, h:440, rock:1}]},
  ];
  // ---- enemy types ----
  const TYPES = {
    thrower: {hp:1, sp:70, cool:[2.2,1.7,1.3], col:'#FF4539', pts:50},
    fast:    {hp:1, sp:140, cool:[1.4,1.1,.85], col:'#F9BF01', pts:70},
    golem:   {hp:6, sp:30, cool:[3,2.6,2.2], col:'#e8f0f8', pts:150, big:1},
    flanker: {hp:2, sp:110, cool:[2,1.6,1.2], col:'#b48cff', pts:90, flank:1},
    builder: {hp:2, sp:60, cool:[3,2.6,2.2], col:'#64CDF5', pts:90, build:1},
  };
  const BOSSES = [{k:'yeti', n:'THE YETI KING', hp:60, col:'#f4f8ff'}, {k:'plow', n:'THE SNOWPLOW BOT', hp:80, col:'#ff8a3c'}];
  let st = 'ready', phase = 'fight', me, foes, balls, walls, towers, mates, drops, score, wave, flakes, t = 0, quiz = false, aim = {x:0, y:0}, hold = false, cool = 0, boss = null, buildT = 0, tool = 0, flakesFx = [], pw = {icy:0, mega:0, rapid:0, shield:0}, arena = 0, snowfall = [], msg = '', msgT = 0;
  for (let i = 0; i < 50; i++) snowfall.push({x:Math.random()*520, y:Math.random()*520, s:.5 + Math.random()});
  const D3 = a => A.D(a[0], a[1], a[2]);
  const say = (s2, d = 2.5) => { msg = s2; msgT = d; };
  const A0 = () => ARENAS[arena % ARENAS.length];
  const reset = () => { if (__skip) { __skip = false; return; } me = {x:w/2, y:FIELD-50, vx:0, vy:0, hp:A.lives(A.D(6,5,4) + A.U('life')), max:0, inv:0}; me.max = me.hp; balls = []; drops = []; towers = []; mates = []; score = 0; wave = 0; flakes = 20; arena = 0; pw = {icy:0, mega:0, rapid:0, shield:0}; boss = null;
    walls = [{x:120, y:420, w:70, h:22, hp:6, max:6, mine:1}, {x:330, y:420, w:70, h:22, hp:6, max:6, mine:1}]; for (let i = 0; i < Math.min(3, A.U('mate')); i++) addMate(); nextWave(); api.score(0); };
  const addMate = () => { if (mates.length >= 4) return false; mates.push({x:80 + mates.length*120, y:FIELD - 30, hp:3, lv:1, cool:1 + Math.random(), tx:0, ty:0}); return true; };
  const spawn = (k, x, y) => { const T = TYPES[k]; foes.push({k, x: x == null ? 60 + Math.random()*400 : x, y: y == null ? 40 + Math.random()*120 : y, hp:T.hp + Math.floor(wave/6), max:T.hp + Math.floor(wave/6), cool:1 + Math.random()*2, tx:0, ty:0, rt:0, slow:0}); };
  const nextWave = () => { wave++; foes = []; phase = 'fight'; if ((wave - 1) % 3 == 0 && wave > 1) { arena++; say('New arena: '+A0().n+'!'); }
    walls = walls.filter(W2 => W2.mine);   // enemy walls melt between waves
    if (wave % 5 == 0) { const B = BOSSES[(wave/5 - 1) % BOSSES.length]; boss = {k:B.k, n:B.n, x:w/2, y:90, hp:B.hp * (1 + (wave/5 - 1)*.6) * A.D(.8,1,1.25), max:0, cool:2, vx:90, charge:0, col:B.col}; boss.max = boss.hp; say(B.n+' appears!', 3); A.sfx('bad'); for (let i = 0; i < 2 + Math.floor(wave/10); i++) spawn('thrower'); return; }
    const n = Math.min(10, 2 + Math.floor(wave*.8)), pool = ['thrower','thrower']; if (wave >= 2) pool.push('fast'); if (wave >= 3) pool.push('builder'); if (wave >= 4) pool.push('golem', 'flanker'); if (wave >= 7) pool.push('fast','flanker','golem');
    for (let i = 0; i < n; i++) spawn(pool[Math.floor(Math.random()*pool.length)]); };
  const throwAt = (from, tx, ty, o) => { const d = Math.hypot(tx - from.x, ty - from.y) || 1, sp = o.sp || 420; balls.push({x:from.x, y:from.y, vx:(tx - from.x)/d*sp, vy:(ty - from.y)/d*sp, mine:o.mine, dmg:o.dmg || 1, kind:o.kind || 'n', r:o.r || 5, life:2}); };
  const lead = (f, sp) => { const d = Math.hypot(me.x - f.x, me.y - f.y), tt = d / sp, k = Math.min(1, wave/8); return {x: me.x + me.vx*tt*k, y: me.y + me.vy*tt*k}; };   // later waves aim where you're going
  // ---- shop between waves ----
  const TOOLS = [{k:'wall', n:'Snow wall', e:'🧱', cost:10}, {k:'tower', n:'Snow tower', e:'🗼', cost:30}, {k:'cannon', n:'Snow cannon', e:'💣', cost:50}, {k:'repair', n:'Repair all', e:'🔧', cost:0}, {k:'mate', n:'Teammate', e:'🧒', cost:0}, {k:'go', n:'Next wave', e:'▶', cost:0}];
  const toolCost = k => k == 'repair' ? walls.filter(W2 => W2.mine).reduce((a, W2) => a + (W2.max - W2.hp), 0) * 2 : k == 'mate' ? (mates.length >= 4 ? Infinity : 40 + mates.length*40) : TOOLS.find(T2 => T2.k == k).cost;
  const useTool = (k, x, y) => { if (k == 'go') { nextWave(); return; } const cost = toolCost(k); if (flakes < cost) { A.sfx('bad'); say('Need '+cost+' ❄'); return; }
    if (k == 'repair') { if (!cost) return say('Your walls are fine!'); walls.forEach(W2 => { if (W2.mine) W2.hp = W2.max; }); }
    else if (k == 'mate') { if (!addMate()) return say('Your team is full!'); else mates.forEach(m => m.lv = Math.max(m.lv, 1)); }
    else { y = clamp(y, MID + 20, FIELD - 70); x = clamp(x, 20, w - 20); if (k == 'wall') walls.push({x:x - 35, y:y - 11, w:70, h:22, hp:6, max:6, mine:1}); else towers.push({k, x, y, cool:1, hp:k == 'cannon' ? 6 : 5}); }
    flakes -= cost; A.sfx('coin'); };
  const offK = A.keys(e => { if ((e.key == ' ' || e.key == 'Enter') && st != 'play' && !quiz) { reset(); st = 'play'; return; } if (st != 'play') return;
    if (phase == 'build') { const n = +e.key; if (n >= 1 && n <= TOOLS.length) { tool = n - 1; if (['repair','mate','go'].includes(TOOLS[tool].k)) useTool(TOOLS[tool].k); } if (e.key == ' ') useTool(TOOLS[tool].k, me.x, me.y - 40); if (e.key == 'Enter') nextWave(); } });
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h); if (st != 'play') { if (!quiz) { reset(); st = 'play'; } return; }
    if (phase == 'build') { if (q.y > FIELD) { const i = Math.floor(q.x / (w/TOOLS.length)); tool = i; if (['repair','mate','go'].includes(TOOLS[i].k)) useTool(TOOLS[i].k); return; } if (q.y > MID) useTool(TOOLS[tool].k, q.x, q.y); return; }
    aim = q; hold = true; });
  c.addEventListener('pointermove', e => { aim = pt(c, e, w, h); }); const pu = () => { hold = false; }; c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const solid = (x, y) => walls.find(W2 => W2.hp > 0 && x > W2.x && x < W2.x + W2.w && y > W2.y && y < W2.y + W2.h) || A0().walls.find(W2 => x > W2.x && x < W2.x + W2.w && y > W2.y && y < W2.y + W2.h);
  const hurtMe = dmg => { if (me.inv > 0 || A.immortal) return; if (pw.shield > 0) { pw.shield = 0; me.inv = .6; A.tone(900,.1,'sine',.05); return; } me.hp -= dmg; me.inv = .8; A.sfx('bad');
    if (me.hp <= 0) { quiz = learn2(host, api, 'SPLAT! ANSWER TO SHAKE OFF THE SNOW', () => { quiz = false; me.hp = Math.ceil(me.max/2); me.inv = 2; }, () => { quiz = false; st = 'over'; A.sfx('over'); stat(api,'snowWave',wave,'max'); api.over(score); }); } };
  const killFoe = f => { f.dead = 1; const T = TYPES[f.k]; score += T.pts + wave*10; flakes += 10; api.score(score); if (Math.random() < .3) drops.push({x:clamp(f.x, 30, w-30), y:MID + 40 + Math.random()*120, k:['icy','mega','rapid','shield'][Math.floor(Math.random()*4)], life:10}); };
  const offL = A.loop(dt => { A.mood(() => ({danger: st=="play" && me && me.hp==1, boss: st=="play" && !!boss})); t += dt; dt = Math.min(dt, .033); msgT = Math.max(0, msgT - dt);
    for (const f of snowfall) { f.y += 20*f.s*dt; f.x += (A0().wind ? 30 : Math.sin(t + f.y*.02)*6)*dt; if (f.y > FIELD) f.y = 0; if (f.x > w) f.x = 0; }
    if (st == 'play' && !quiz) { const AR = A0(), mx = (K.k.ArrowRight||K.k.d ? 1 : 0) - (K.k.ArrowLeft||K.k.a ? 1 : 0), my = (K.k.ArrowDown||K.k.s ? 1 : 0) - (K.k.ArrowUp||K.k.w ? 1 : 0), sp = 200 * (1 + .05*A.U('boots'));
      let ix = mx, iy = my; if (!mx && !my && hold && aim.y > MID && phase == 'fight') { ix = clamp((aim.x - me.x)/30, -1, 1); iy = clamp((aim.y - me.y)/30, -1, 1); }
      const dl = Math.hypot(ix, iy) || 1, tvx = ix/dl*sp*(ix||iy ? 1 : 0), tvy = iy/dl*sp*(ix||iy ? 1 : 0), k = AR.slip ? 2.5 : 14; me.vx += (tvx - me.vx)*Math.min(1, k*dt); me.vy += (tvy - me.vy)*Math.min(1, k*dt);
      const nx = clamp(me.x + me.vx*dt, 14, w-14), ny = clamp(me.y + me.vy*dt, MID + 14, FIELD - 14); if (!solid(nx, me.y)) me.x = nx; else me.vx = 0; if (!solid(me.x, ny)) me.y = ny; else me.vy = 0; me.inv = Math.max(0, me.inv - dt);
      for (const key in pw) pw[key] = Math.max(0, pw[key] - (key == 'shield' ? 0 : dt));
      if (phase == 'fight') {
        // you throw
        cool -= dt; const target = (foes.length || boss) ? (boss || foes.reduce((a, f) => !a || Math.hypot(f.x-me.x, f.y-me.y) < Math.hypot(a.x-me.x, a.y-me.y) ? f : a, null)) : null;
        if ((K.k[' '] || (hold && aim.y < MID)) && cool <= 0) { cool = .32 * (1 - .08*A.U('arm')) * (pw.rapid > 0 ? .45 : 1); const tx = hold ? aim.x : (target ? target.x : me.x), ty = hold ? aim.y : (target ? target.y : 0);
          throwAt(me, tx, ty, {mine:1, kind: pw.mega > 0 ? 'mega' : pw.icy > 0 ? 'icy' : 'n', r: pw.mega > 0 ? 8 : 5, dmg: pw.mega > 0 ? 2 : 1}); A.tone(600,.03,'triangle',.03); }
        // teammates, towers, cannons
        for (const m of mates) { if (m.hp <= 0) continue; m.cool -= dt; if (target && m.cool <= 0) { m.cool = 1.6 / (1 + .25*(m.lv-1)); throwAt(m, target.x + (Math.random()-.5)*20, target.y, {mine:1, sp:380}); } m.x += clamp((m.tx || m.x) - m.x, -60*dt, 60*dt); if (Math.random() < dt*.5) m.tx = 30 + Math.random()*(w-60); }
        for (const T2 of towers) { if (T2.hp <= 0) continue; T2.cool -= dt; if (target && T2.cool <= 0) { if (T2.k == 'cannon') { T2.cool = 4; throwAt(T2, target.x, target.y, {mine:1, kind:'mega', r:9, dmg:3, sp:360}); } else { T2.cool = 1.2; throwAt(T2, target.x, target.y, {mine:1, sp:450}); } } }
        // enemies
        for (const f of foes) { const T = TYPES[f.k], spd = T.sp * (f.slow > 0 ? .4 : 1); f.slow = Math.max(0, f.slow - dt); f.rt -= dt;
          if (f.rt <= 0) { f.rt = 1 + Math.random()*1.5; if (T.flank) { f.tx = Math.random() < .5 ? 30 : w - 30; f.ty = MID - 30; } else { f.tx = 40 + Math.random()*(w-80); f.ty = 30 + Math.random()*(MID - 110); } }
          f.x += clamp(f.tx - f.x, -spd*dt, spd*dt); f.y += clamp(f.ty - f.y, -spd*dt, spd*dt);
          f.cool -= dt * (f.slow > 0 ? .5 : 1); if (f.cool <= 0) { f.cool = D3(T.cool) * (.8 + Math.random()*.4) / (1 + wave*.04);
            if (T.build && Math.random() < .5) walls.push({x:clamp(f.x - 30, 10, w-70), y:f.y + 24, w:60, h:18, hp:4, max:4, mine:0});
            else { const L = lead(f, T.big ? 220 : 260); throwAt(f, L.x + (Math.random()-.5)*30, L.y, {sp: T.big ? 220 : A.D(230, 260, 300) + wave*4, r: T.big ? 9 : 5, dmg: T.big ? 2 : 1}); } } }
        if (boss) { const B = boss; B.cool -= dt;
          if (B.k == 'plow') { B.x += B.vx*dt*(B.charge > 0 ? 3 : 1); if (B.x < 60 || B.x > w-60) B.vx *= -1; B.charge = Math.max(0, B.charge - dt); if (Math.random() < dt*.3) B.charge = 1.2;
            walls.forEach(W2 => { if (!W2.mine && Math.abs(W2.x + W2.w/2 - B.x) < 50 && Math.abs(W2.y - B.y) < 50) W2.hp = 0; });
            if (B.cool <= 0) { B.cool = A.D(1.6, 1.3, 1); for (let k2 = -1; k2 <= 1; k2++) throwAt(B, me.x + k2*50, me.y, {sp:300, r:6}); } }
          else { B.x += Math.sin(t*.7)*80*dt; if (B.cool <= 0) { B.cool = A.D(2.2, 1.8, 1.4); for (let k2 = -2; k2 <= 2; k2++) throwAt(B, me.x + k2*55, me.y, {sp:250, r:8, dmg:k2 == 0 ? 2 : 1}); if (Math.random() < .4) { spawn('golem', B.x, B.y + 40); say('The Yeti King calls a snow golem!'); } } } }
        // snowballs
        for (const b of balls) { const wind = A0().wind ? 40 : 0; b.vx += wind*dt*(b.mine ? 1 : -1)*.3; b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt; const W2 = solid(b.x, b.y);
          if (W2) { if (W2.hp != null) W2.hp -= b.kind == 'mega' ? 2 : 1; b.life = 0; A.tone(150,.03,'square',.02); continue; }
          if (b.mine) { const hitF = foes.find(f => Math.hypot(f.x - b.x, f.y - b.y) < (TYPES[f.k].big ? 22 : 15));
            if (hitF || (boss && Math.hypot(boss.x - b.x, boss.y - b.y) < 40)) { b.life = 0; flakes += 2; A.sfx('hit'); const hits = b.kind == 'mega' ? foes.filter(f => Math.hypot(f.x - b.x, f.y - b.y) < 55) : [hitF].filter(Boolean);
              hits.forEach(f => { f.hp -= b.dmg; if (b.kind == 'icy') f.slow = 3; if (f.hp <= 0 && !f.dead) killFoe(f); });
              if (boss && Math.hypot(boss.x - b.x, boss.y - b.y) < (b.kind == 'mega' ? 70 : 40)) { boss.hp -= b.dmg; if (boss.hp <= 0) { score += 1500 + wave*100; flakes += 80; api.score(score); A.sfx('win'); stat(api,'snowBoss',1,'add'); say(boss.n+' is defeated!', 3); boss = null; } } } }
          else { const hm = mates.find(m => m.hp > 0 && Math.hypot(m.x - b.x, m.y - b.y) < 14), ht = towers.find(T2 => T2.hp > 0 && Math.hypot(T2.x - b.x, T2.y - b.y) < 16);
            if (Math.hypot(me.x - b.x, me.y - b.y) < 14) { b.life = 0; hurtMe(b.dmg); } else if (hm) { b.life = 0; hm.hp--; } else if (ht) { b.life = 0; ht.hp--; } } }
        balls = balls.filter(b => b.life > 0 && b.x > -20 && b.x < w+20 && b.y > -20 && b.y < FIELD+20); foes = foes.filter(f => !f.dead); walls = walls.filter(W2 => W2.hp > 0); towers = towers.filter(T2 => T2.hp > 0); mates = mates.filter(m => m.hp > 0);
        for (const d of drops) { d.life -= dt; if (Math.hypot(d.x - me.x, d.y - me.y) < 22) { d.life = 0; if (d.k == 'shield') pw.shield = 1; else pw[d.k] = 10; A.sfx('coin'); say({icy:'❄ Icy snowballs: hits slow enemies!', mega:'💥 Mega snowballs: big splash!', rapid:'⚡ Rapid throw!', shield:'🛡 Shield: blocks the next hit'}[d.k]); } } drops = drops.filter(d => d.life > 0);
        if (!foes.length && !boss) { score += 200*wave; flakes += 15 + wave*2; api.score(score); A.sfx('win'); phase = 'build'; buildT = 0; balls = []; say('Wave '+wave+' cleared! Build, repair and hire between waves.', 3); } }
      else { buildT += dt; } }
    // ---- draw ----
    const AR = A0(); g.fillStyle = AR.bg; g.fillRect(0, 0, w, FIELD); if (AR.slip) { g.fillStyle = AR.ice; g.beginPath(); g.ellipse(w/2, FIELD/2, 230, 200, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; for (let k2 = 0; k2 < 5; k2++) { g.beginPath(); g.moveTo(100 + k2*70, 150); g.lineTo(160 + k2*60, 380); g.stroke(); } }
    g.fillStyle = 'rgba(160,190,220,.35)'; g.fillRect(0, MID - 2, w, 4);
    for (const W2 of AR.walls) { if (W2.house) { g.fillStyle = '#a0603a'; g.fillRect(W2.x, W2.y + 14, W2.w, W2.h - 14); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(W2.x - 6, W2.y + 16); g.lineTo(W2.x + W2.w/2, W2.y - 8); g.lineTo(W2.x + W2.w + 6, W2.y + 16); g.fill(); g.fillStyle = '#ffe9b0'; g.fillRect(W2.x + W2.w/2 - 7, W2.y + 26, 14, 12); } else { g.fillStyle = '#8a8e94'; g.fillRect(W2.x, W2.y, W2.w, W2.h); g.fillStyle = '#fff'; g.fillRect(W2.x, W2.y, W2.w, 10); } }
    if (walls) for (const W2 of walls) { g.fillStyle = W2.mine ? '#fff' : '#e4f2ff'; rr(g, W2.x, W2.y, W2.w, W2.h, 8); g.fill(); g.strokeStyle = W2.mine ? '#b8d0e8' : '#9ec4e8'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(100,150,200,.7)'; g.fillRect(W2.x + 4, W2.y + W2.h - 4, (W2.w-8)*W2.hp/W2.max, 2); }
    if (towers) for (const T2 of towers) { g.fillStyle = '#fff'; rr(g, T2.x - 12, T2.y - 26, 24, 30, 6); g.fill(); g.strokeStyle = '#b8d0e8'; g.stroke(); g.font = '16px '+A.font; g.textAlign = 'center'; g.fillText(T2.k == 'cannon' ? '💣' : '🗼', T2.x, T2.y - 6); }
    if (drops) for (const d of drops) { g.font = '20px '+A.font; g.textAlign = 'center'; g.globalAlpha = d.life < 2 ? .5 + .5*Math.sin(t*20) : 1; g.fillText({icy:'❄',mega:'💥',rapid:'⚡',shield:'🛡'}[d.k], d.x, d.y + 6 + Math.sin(t*4)*3); g.globalAlpha = 1; }
    const kid = (x, y, col, big) => { const s2 = big ? 1.5 : 1; g.fillStyle = col; rr(g, x-11*s2, y-6*s2, 22*s2, 18*s2, 7); g.fill(); g.fillStyle = big ? '#dfe8f0' : '#f2c9a0'; g.beginPath(); g.arc(x, y-12*s2, 8*s2, 0, TAU); g.fill(); if (!big) { g.fillStyle = col; g.beginPath(); g.arc(x, y-15, 8, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y-23, 3, 0, TAU); g.fill(); } else { g.fillStyle = '#121313'; g.beginPath(); g.arc(x-4, y-14*s2, 2, 0, TAU); g.arc(x+4, y-14*s2, 2, 0, TAU); g.fill(); g.fillStyle = '#FF8A3C'; g.fillRect(x-1, y-12*s2, 6, 3); } };
    if (foes) for (const f of foes) { kid(f.x, f.y, TYPES[f.k].col, TYPES[f.k].big); if (f.slow > 0) { g.strokeStyle = '#64CDF5'; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y - 6, 18, 0, TAU); g.stroke(); } if (f.max > 1) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(f.x - 12, f.y + 14, 24, 3); g.fillStyle = '#FF4539'; g.fillRect(f.x - 12, f.y + 14, 24*f.hp/f.max, 3); } }
    if (boss) { const B = boss; if (B.k == 'yeti') { g.fillStyle = B.col; g.beginPath(); g.ellipse(B.x, B.y, 40, 46, 0, 0, TAU); g.fill(); g.fillStyle = '#9ec4e8'; g.beginPath(); g.ellipse(B.x, B.y - 10, 22, 16, 0, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(B.x - 8, B.y - 14, 3, 0, TAU); g.arc(B.x + 8, B.y - 14, 3, 0, TAU); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(B.x - 18, B.y - 40); g.lineTo(B.x - 10, B.y - 56); g.lineTo(B.x, B.y - 42); g.lineTo(B.x + 10, B.y - 56); g.lineTo(B.x + 18, B.y - 40); g.fill(); }
      else { g.fillStyle = B.col; rr(g, B.x - 44, B.y - 26, 88, 52, 10); g.fill(); g.fillStyle = '#c9ccd1'; g.fillRect(B.x - 54, B.y + 14, 108, 14); g.fillStyle = '#64CDF5'; g.fillRect(B.x - 26, B.y - 18, 52, 16); g.fillStyle = B.charge > 0 ? '#FF4539' : '#fff'; g.beginPath(); g.arc(B.x - 30, B.y - 18, 5, 0, TAU); g.arc(B.x + 30, B.y - 18, 5, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, w/2 - 140, 8, 280, 14, 7); g.fill(); g.fillStyle = '#FF4539'; rr(g, w/2 - 140, 8, 280*Math.max(0, boss.hp)/boss.max, 14, 7); g.fill(); g.fillStyle = '#14204a'; g.font = '800 12px '+A.font; g.textAlign = 'center'; g.fillText(boss.n, w/2, 36); }
    if (mates) for (const m of mates) kid(m.x, m.y, '#2fa8e0');
    if (me && !(me.inv > 0 && Math.sin(t*25) > 0)) { kid(me.x, me.y, '#00B451'); if (pw.shield > 0) { g.strokeStyle = 'rgba(100,200,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(me.x, me.y - 6, 20, 0, TAU); g.stroke(); } }
    if (balls) for (const b of balls) { g.fillStyle = b.kind == 'icy' ? '#aee6ff' : b.kind == 'mega' ? '#fff' : '#fff'; g.strokeStyle = b.mine ? '#a0b8d0' : '#d08080'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.9)'; for (const f of snowfall) g.fillRect(f.x, f.y, 2*f.s, 2*f.s);
    // HUD + shop bar
    g.fillStyle = '#14204a'; g.font = '700 15px '+A.font; g.textAlign = 'left'; g.fillText('Wave '+(wave||0)+' · '+A0().n+'   '+(score||0).toLocaleString(), 10, boss ? 56 : 22); g.textAlign = 'right'; g.fillText('❄ '+(flakes||0)+'   ♥ '+(me ? Math.max(0, me.hp) : 0)+'/'+(me ? me.max : 0), w - 10, boss ? 56 : 22);
    const act = Object.keys(pw).filter(k2 => pw[k2] > 0).map(k2 => ({icy:'❄',mega:'💥',rapid:'⚡',shield:'🛡'}[k2] + (k2 == 'shield' ? '' : Math.ceil(pw[k2])))).join('  '); if (act) { g.textAlign = 'left'; g.fillText(act, 10, FIELD - 10); }
    g.fillStyle = '#14204a'; g.fillRect(0, FIELD, w, h - FIELD);
    if (phase == 'build' && st == 'play') TOOLS.forEach((T2, i) => { const x = i*w/TOOLS.length, cost = toolCost(T2.k), can = T2.k == 'go' || flakes >= cost; g.fillStyle = tool == i ? '#D5F367' : can ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.06)'; rr(g, x + 4, FIELD + 8, w/TOOLS.length - 8, h - FIELD - 16, 10); g.fill();
      g.fillStyle = tool == i ? '#14204a' : '#fff'; g.font = '20px '+A.font; g.textAlign = 'center'; g.fillText(T2.e, x + w/TOOLS.length/2, FIELD + 36); g.font = '700 10px '+A.font; g.fillText(T2.n, x + w/TOOLS.length/2, FIELD + 54); g.fillText(T2.k == 'go' ? 'Enter' : isFinite(cost) ? cost+' ❄ · '+(i+1) : 'full', x + w/TOOLS.length/2, FIELD + 68); });
    else if (st == 'play') { g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText('WASD / arrows move · Space or tap the top half to throw', w/2, FIELD + 36); g.font = '12px '+A.font; g.fillText('Walk over ❄ 💥 ⚡ 🛡 to grab power-ups', w/2, FIELD + 58); }
    if (msgT > 0) { g.fillStyle = 'rgba(20,32,74,.8)'; rr(g, 30, MID - 22, w - 60, 40, 12); g.fill(); g.fillStyle = '#fff'; g.font = '700 14px '+A.font; g.textAlign = 'center'; g.fillText(msg, w/2, MID + 3); }
    if (phase == 'build' && st == 'play') { g.fillStyle = '#14204a'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText('BUILD TIME · pick 🧱 or 🗼 or 💣, then tap your side to place it', w/2, MID + 40); }
    if (st == 'ready') A.overlayText(g, w, h, 'SNOWBALL SHOWDOWN', __skip ? 'Saved game · tap or press Space to continue' : 'Survive the waves · build forts and towers between waves · hire teammates · beat the bosses');
    if (st == 'over') A.overlayText(g, w, h, 'SNOWED UNDER', (score||0).toLocaleString()+' points · wave '+wave+' · tap to play again'); });
  // ---- save & resume ----
  api.snap && api.snap(() => (st == 'play') ? {v:2, me, foes, walls, towers, mates, drops, score, wave, flakes, boss, phase, arena, pw} : null);
  { const R0 = api.resume; if (R0 && R0.v == 2) { try { ({me, foes, walls, towers, mates, drops, score, wave, flakes, boss, phase, arena, pw} = R0); balls = []; api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] snowball resume failed', e); } } }
  A._dbg = A._dbg || {}; A._dbg.snow = () => ({me, foes, boss, wave, phase, walls, towers, mates, flakes, st, set:o => { if (o.wave != null) wave = o.wave; if (o.flakes != null) flakes = o.flakes; }, nextWave, useTool});
  return () => { offK(); offL(); K.off(); };
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
    g.fillStyle = '#015640'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('🌾 '+(score||0).toLocaleString(), 12, 26); g.textAlign = 'right'; g.fillText('☀ '+Math.ceil(timeLeft||0)+' s', w-12, 26);
    if (st == 'ready') A.overlayText(g, w, h, 'SPROUT FARM', __skip ? 'Saved game · tap or press Space to continue' : 'Pick a seed below, tap a plot to plant, tap to water, tap to pick · fill orders!');
    if (st == 'over') A.overlayText(g, w, h, 'WHAT A DAY!', (score||0).toLocaleString()+' points · tap to farm again'); });
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
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText((score||0).toLocaleString(), 12, 26);
    if (st == 'ready') A.overlayText(g, w, h, 'CRITTER CARDS', __skip ? 'Saved game · tap or press Space to continue' : 'Match pairs to attack · a miss lets the rival hit back · tap to start');
    if (st == 'over') A.overlayText(g, w, h, 'BATTLE OVER', (score||0).toLocaleString()+' points · reached stage '+(stage+1)+' · tap to battle again'); });
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, deck, stage, foeHp, myHp, myMax, shield, score} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({deck, stage, foeHp, myHp, myMax, shield, score} = R0); foe = FOES[Math.min(stage, FOES.length-1)]; open = []; api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] cardbattle resume failed', e); } } }
  return () => { offK(); offL(); };
}});
})();
