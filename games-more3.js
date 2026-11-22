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
  const {c,g,w,h} = A.canvas(host, 480, 520); c.style.touchAction = 'none';
  // # wall  . target  $ crate  * crate on target  @ player  + player on target
  const LV = [
    ['#####','#@$.#','#####'],
    ['######','#@ $.#','#  $.#','######'],
    ['  ###  ','  #.#  ','###$###','#.$@$.#','###$###','  #.#  ','  ###  '],
    ['#######','#.   .#','# $$$ #','#  @  #','#  .  #','#######'],
    ['########','#   #  #','# $   .#','#  $@#.#','# ##   #','#      #','########'],
    [' ##### ','##   ##','#  $  #','# $@$ #','#.....#','#  $  #','#######'],
    ['#######','#.    #','#.$ $ #','## # ##','#  $@ #','#.    #','#######'],
    ['  #####','###   #','#.@$  #','### $.#','#.##$ #','# # . ##','#$ *$$.#','#   .  #','########'],
    ['########','#  ....#','# $$$$ #','#   @  #','########'],
    ['  ####  ','  #..#  ',' ## .## ',' #  $.# ','## $  ##','#  #$$ #','#  @   #','########'],
    ['#########','#   #   #','# $ . $ #','#  .@.  #','# $ . $ #','#   #   #','#########'],
    ['##########','#    #   #','# $$ # . #','#  $   . #','## @ $ . #','#  ### . #','#        #','##########'],
  ];
  let lvl = 0, map, P, moves, hist, score = 0, solved = 0, st = 'ready', t = 0, swipe = null, quizUsed = false;
  const load = () => { map = LV[lvl].map(r => r.padEnd(Math.max(...LV[lvl].map(x => x.length)), ' ').split('')); moves = 0; hist = []; quizUsed = false;
    map.forEach((row, y) => row.forEach((ch, x) => { if (ch == '@' || ch == '+') { P = {x, y}; row[x] = ch == '+' ? '.' : ' '; } })); };
  const isCrate = ch => ch == '$' || ch == '*', isTgt = ch => ch == '.' || ch == '*';
  const move = (dx, dy) => { if (st != 'play') return; const nx = P.x+dx, ny = P.y+dy, ch = map[ny][nx]; if (ch == '#') return;
    if (isCrate(ch)) { const bx = nx+dx, by = ny+dy, bc = map[by][bx]; if (bc == '#' || isCrate(bc)) return; hist.push({P:{...P}, m:map.map(r => r.slice())}); map[by][bx] = bc == '.' ? '*' : '$'; map[ny][nx] = ch == '*' ? '.' : ' '; A.tone(220,.05,'square',.04); }
    else hist.push({P:{...P}, m:map.map(r => r.slice())});
    P.x = nx; P.y = ny; moves++; A.sfx('step');
    if (!map.some(r => r.includes('$'))) { const par = LV[lvl].join('').split('').filter(c2 => c2 == '$' || c2 == '*').length * 8 + 6; const gain = Math.max(50, 300 + (par - moves)*10) * (1 + lvl*.25);
      score += Math.round(gain); solved++; api.score(score); A.sfx('win'); if (A.learnOn && A.learnOn()) learn2(host, api, 'LEVEL DONE! BONUS QUESTION FOR +150', () => { score += 150; api.score(score); }, () => {}); stat(api,'sokoLevel',lvl+1,'max'); lvl++; if (lvl >= LV.length) { st = 'over'; api.over(score); } else setTimeout(load, 500); } };
  const undo = () => { const hh = hist.pop(); if (hh) { P = hh.P; map = hh.m; moves++; } };
  const offK = A.keys(e => { if (e.type != 'keydown') return; const m = {ArrowLeft:[-1,0], a:[-1,0], ArrowRight:[1,0], d:[1,0], ArrowUp:[0,-1], w:[0,-1], ArrowDown:[0,1], s:[0,1]}[e.key];
    if (st != 'play' && (e.key == ' ' || e.key == 'Enter')) { if (st == 'over') { lvl = 0; score = 0; } st = 'play'; load(); api.score(score); return; } if (m) move(...m); if (e.key == 'z' || e.key == 'u' || e.key == 'Backspace') undo(); if (e.key == 'r') load(); if (e.key == 'n' && st == 'play') { st = 'over'; api.over(score); } });
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h); if (st != 'play') { if (st == 'over') { lvl = 0; score = 0; } st = 'play'; load(); api.score(score); return; }
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
    if (st == 'ready') A.overlayText(g, w, h, 'CRATE CAMP', 'Push every crate onto a red circle · arrows / WASD or swipe · tap to start');
    if (st == 'over') A.overlayText(g, w, h, solved >= LV.length ? 'ALL CRATES CAMPED!' : 'NICE PUSHING', (score||0).toLocaleString()+' points · '+solved+' levels · tap to play again'); });
  const inside = (x, y) => { let l = false, r2 = false; for (let i = 0; i < x; i++) if (map[y][i] == '#') l = true; for (let i = x+1; i < map[y].length; i++) if (map[y][i] == '#') r2 = true; return l && r2; };
  load();
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// AIR HOCKEY — first to 7 against the computer.
// =====================================================================================================
A.register('airhockey', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 400, 600); c.style.touchAction = 'none';
  const K = keysDown(), GOAL = 120; let st = 'ready', me, ai, puck, sMe, sAi, t = 0, quiz = false, ptr = null, serveT = 0, rally = 0, score = 0;
  const reset = () => { me = {x:w/2, y:h-80, r:28, px:w/2, py:h-80}; ai = {x:w/2, y:80, r:28}; sMe = 0; sAi = 0; score = 0; serve(1); api.score(0); };
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
    if (st == 'ready') A.overlayText(g, w, h, 'AIR HOCKEY', 'Move your green mallet with the mouse, a finger or WASD · first to 7');
    if (st == 'over') A.overlayText(g, w, h, sMe > sAi ? 'YOU WIN!' : 'CPU WINS', sMe+' – '+sAi+' · '+score.toLocaleString()+' points · tap for a rematch'); });
  reset(); st = 'ready';
  return () => { offK(); offL(); K.off(); };
}});

// =====================================================================================================
// CARNIVAL TOSS — skee-ball. Aim with the moving arrow, set power, and roll into the scoring rings.
// =====================================================================================================
A.register('skeeball', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 420, 600); c.style.touchAction = 'none';
  const RINGS = [{x:210, y:120, r:22, pts:100}, {x:90, y:120, r:20, pts:100}, {x:330, y:120, r:20, pts:100}, {x:210, y:190, r:28, pts:50}, {x:210, y:250, r:38, pts:40}, {x:210, y:300, r:50, pts:30}, {x:210, y:345, r:64, pts:20}, {x:210, y:385, r:80, pts:10}];
  let st = 'ready', phase = 'aim', ang = 0, adir = 1, pow = 0, pdir = 1, ball = null, balls, score, t = 0, last = '', lastT = 0, rnd = 0, quiz = false;
  const reset = () => { balls = 9 + A.U('balls'); score = 0; phase = 'aim'; rnd++; api.score(0); };
  const press = () => { if (st != 'play') { reset(); st = 'play'; return; } if (quiz) return;
    if (phase == 'aim') phase = 'power'; else if (phase == 'power') { const sp = 380 + pow*620; ball = {x:210, y:560, vx:Math.sin(ang)*sp*.35, vy:-sp, r:12, z:0}; phase = 'roll'; A.tone(200,.2,'triangle',.05); } };
  const offK = A.keys(e => { if (e.type == 'keydown' && (e.key == ' ' || e.key == 'Enter')) press(); });
  c.addEventListener('pointerdown', press);
  const scoreBall = () => { let got = 0; for (const R of RINGS) if (Math.hypot(ball.x - R.x, ball.y - R.y) < R.r - 4) { got = Math.max(got, R.pts); } if (got == 0 && ball.y < 420) got = 0;
    score += got; api.score(score); last = got ? '+'+got : 'Gutter!'; lastT = 1.2; A.sfx(got >= 50 ? 'win' : got ? 'coin' : 'bad'); balls--; ball = null; phase = 'aim'; pow = 0;
    if (balls <= 0) { quiz = learn2(host, api, 'OUT OF BALLS · ANSWER FOR ONE BONUS BALL', () => { quiz = false; balls = 1; }, () => { quiz = false; st = 'over'; stat(api,'skeeBest',score,'max'); api.over(score); }); } };
  const offL = A.loop(dt => { t += dt; lastT = Math.max(0, lastT - dt);
    if (st == 'play' && !quiz) { const aimSp = A.D(1.1, 1.5, 2) * (1 - .08*A.U('steady'));
      if (phase == 'aim') { ang += adir*aimSp*dt; if (Math.abs(ang) > .5) { ang = Math.sign(ang)*.5; adir *= -1; } }
      if (phase == 'power') { pow += pdir*aimSp*.9*dt; if (pow > 1) { pow = 1; pdir = -1; } if (pow < 0) { pow = 0; pdir = 1; } }
      if (phase == 'roll' && ball) { ball.x += ball.vx*dt; ball.y += ball.vy*dt; ball.vy += 260*dt; if (ball.x < 30 || ball.x > 390) ball.vx *= -1;
        if (ball.y < 420) { ball.vx *= Math.pow(.2, dt); if (ball.vy > -40 || ball.y < 90) scoreBall(); } } }
    const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#4a1a3a'); gr.addColorStop(1,'#8a3a2a'); g.fillStyle = gr; g.fillRect(0,0,w,h);
    g.fillStyle = '#c8964a'; g.beginPath(); g.moveTo(130, 600); g.lineTo(150, 430); g.lineTo(270, 430); g.lineTo(290, 600); g.fill(); g.strokeStyle = '#8D5B1D'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(150 + i*24, 430); g.lineTo(130 + i*32, 600); g.stroke(); }
    g.fillStyle = '#2a1a2a'; rr(g, 20, 60, 380, 370, 20); g.fill();
    for (let i = RINGS.length-1; i >= 0; i--) { const R = RINGS[i]; g.fillStyle = i < 3 ? '#F9BF01' : i % 2 ? '#3a2a3a' : '#5a3a5a'; g.beginPath(); g.arc(R.x, R.y, R.r, 0, TAU); g.fill(); g.strokeStyle = '#ff8fd0'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(String(R.pts), R.x, R.y - R.r + 14 + (i < 3 ? 6 : 0)); }
    for (let i = 0; i < 12; i++) { g.fillStyle = Math.floor(t*4 + i) % 3 == 0 ? '#ffe14f' : '#aa7a3a'; g.beginPath(); g.arc(30 + i*33, 48, 5, 0, TAU); g.fill(); }
    if (st == 'play' && phase != 'roll') { g.save(); g.translate(210, 560); g.rotate(ang); g.fillStyle = '#D5F367'; g.beginPath(); g.moveTo(0, -70); g.lineTo(-10, -50); g.lineTo(10, -50); g.fill(); g.fillRect(-3, -50, 6, 40); g.restore();
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 340, 450, 22, 130, 10); g.fill(); g.fillStyle = pow > .85 ? '#FF4539' : '#D5F367'; rr(g, 340, 450 + 130*(1-pow), 22, 130*pow, 10); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText(phase == 'aim' ? 'TAP to lock aim' : 'TAP to roll!', 210, 595); }
    if (ball) { const s = clamp((ball.y - 60)/500, .45, 1); g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, ball.r*s, 0, TAU); g.fill(); g.fillStyle = '#FF4539'; g.beginPath(); g.arc(ball.x - 3*s, ball.y - 3*s, ball.r*s*.4, 0, TAU); g.fill(); }
    g.fillStyle = '#fff'; g.font = '700 18px '+A.font; g.textAlign = 'left'; g.fillText((score||0)+' pts', 14, 26); g.textAlign = 'right'; g.fillText('Balls '+(balls||0), w-14, 26);
    if (lastT > 0) { g.fillStyle = last == 'Gutter!' ? '#ffb3ab' : '#F9BF01'; g.font = '800 34px '+A.font; g.textAlign = 'center'; g.fillText(last, w/2, 470); }
    if (st == 'ready') A.overlayText(g, w, h, 'CARNIVAL TOSS', 'Tap once to lock the aim, again to set the power · 9 balls');
    if (st == 'over') A.overlayText(g, w, h, 'NICE ROLLING', score+' points · tap to play again'); });
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// WORD WOODS — word search. Drag across letters to find the hidden nature words before time runs out.
// =====================================================================================================
A.register('words', { mount(host, api){
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
  const reset = () => { score = 0; round = 1; make(); api.score(0); };
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
    if (st == 'ready') A.overlayText(g, w, h, 'WORD WOODS', 'Drag across the letters to find every word · tap to start');
    if (st == 'over') A.overlayText(g, w, h, 'TIME\'S UP', (score||0).toLocaleString()+' points · tap to search again'); });
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// STREAM FIXER — rotate pipe tiles so the spring's water reaches every thirsty tree before it runs out.
// =====================================================================================================
A.register('pipes', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 480, 560); c.style.touchAction = 'none';
  // tile = bitmask of open sides: 1 up, 2 right, 4 down, 8 left
  let st = 'ready', N, tiles, src, trees, score, level, timeLeft, t = 0, wet = new Set(), quiz = false, moves = 0;
  const rot = m => ((m << 1) | (m >> 3)) & 15;
  const make = () => { N = Math.min(8, A.D(4,5,6) + Math.floor((level-1)/2)); tiles = Array.from({length:N}, () => Array(N).fill(0));
    // carve a spanning tree from the spring with random walk (guarantees a solution)
    src = {x:0, y:Math.floor(N/2)}; const seen = new Set([src.x+','+src.y]), stack = [src];
    while (stack.length) { const cur = stack[stack.length-1], opts = [[0,-1,1,4],[1,0,2,8],[0,1,4,1],[-1,0,8,2]].filter(([dx,dy]) => { const nx = cur.x+dx, ny = cur.y+dy; return nx >= 0 && ny >= 0 && nx < N && ny < N && !seen.has(nx+','+ny); });
      if (!opts.length) { stack.pop(); continue; } const [dx,dy,a,b] = opts[Math.floor(Math.random()*opts.length)], nx = cur.x+dx, ny = cur.y+dy; tiles[cur.y][cur.x] |= a; tiles[ny][nx] |= b; seen.add(nx+','+ny); stack.push({x:nx, y:ny}); }
    trees = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const m = tiles[y][x], deg = [1,2,4,8].filter(b => m & b).length; if (deg == 1 && !(x == src.x && y == src.y)) trees.push({x, y}); }
    trees = trees.slice(0, Math.max(2, Math.min(trees.length, 2 + level)));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = Math.floor(Math.random()*4); for (let i = 0; i < k; i++) tiles[y][x] = rot(tiles[y][x]); }
    timeLeft = A.D(70, 55, 42) + N*4 + 6*A.U('time'); moves = 0; flow(); };
  const flow = () => { wet = new Set([src.x+','+src.y]); const q = [src]; while (q.length) { const cur = q.shift(), m = tiles[cur.y][cur.x];
      for (const [b, dx, dy, ob] of [[1,0,-1,4],[2,1,0,8],[4,0,1,1],[8,-1,0,2]]) { if (!(m & b)) continue; const nx = cur.x+dx, ny = cur.y+dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; if (!(tiles[ny][nx] & ob)) continue; const k = nx+','+ny; if (wet.has(k)) continue; wet.add(k); q.push({x:nx, y:ny}); } }
    if (trees.every(tr => wet.has(tr.x+','+tr.y))) { score += Math.round((200 + timeLeft*10) * level); api.score(score); A.sfx('win'); level++; setTimeout(make, 600); } };
  const reset = () => { score = 0; level = 1; make(); api.score(0); };
  const S = () => Math.floor(Math.min(w - 40, h - 120) / N), OX = () => (w - S()*N)/2, OY = 60;
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } if (quiz) return; const q = pt(c, e, w, h), x = Math.floor((q.x - OX())/S()), y = Math.floor((q.y - OY)/S());
    if (x >= 0 && y >= 0 && x < N && y < N) { tiles[y][x] = rot(tiles[y][x]); moves++; A.tone(400 + (wet.size*20), .04, 'triangle', .04); flow(); } });
  let cx = 0, cy = 0; const offK = A.keys(e => { if (e.type != 'keydown') return; if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; return; }
    const m = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]}[e.key]; if (m) { cx = clamp(cx + m[0], 0, N-1); cy = clamp(cy + m[1], 0, N-1); } if ((e.key == ' ' || e.key == 'Enter') && st == 'play') { tiles[cy][cx] = rot(tiles[cy][cx]); flow(); } });
  const offL = A.loop(dt => { t += dt;
    if (st == 'play' && !quiz) { timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; quiz = learn2(host, api, 'THE SPRING IS DRYING UP! ANSWER FOR 20 MORE SECONDS', () => { quiz = false; timeLeft = 20; }, () => { quiz = false; st = 'over'; stat(api,'pipesLevel',level,'max'); api.over(score); }); } }
    g.fillStyle = '#7cb85a'; g.fillRect(0,0,w,h);
    if (tiles) { const s = S(), ox = OX();
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const X = ox + x*s, Y = OY + y*s, m = tiles[y][x], isW = wet.has(x+','+y); g.fillStyle = (x+y) % 2 ? '#8D5B1D' : '#9a6a2a'; g.fillRect(X, Y, s, s);
        g.strokeStyle = isW ? '#3ac8ff' : '#c8b078'; g.lineWidth = s*.28; g.lineCap = 'round'; g.beginPath(); const mx = X+s/2, my = Y+s/2; if (m & 1) { g.moveTo(mx, my); g.lineTo(mx, Y); } if (m & 2) { g.moveTo(mx, my); g.lineTo(X+s, my); } if (m & 4) { g.moveTo(mx, my); g.lineTo(mx, Y+s); } if (m & 8) { g.moveTo(mx, my); g.lineTo(X, my); } g.stroke();
        if (isW) { g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(mx + Math.sin(t*4 + x + y)*s*.08, my, s*.05, 0, TAU); g.fill(); }
        if (x == cx && y == cy) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.strokeRect(X+2, Y+2, s-4, s-4); } }
      const sx = ox + src.x*s, sy = OY + src.y*s; g.fillStyle = '#3ac8ff'; g.beginPath(); g.arc(sx + s/2, sy + s/2, s*.32, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '700 '+Math.floor(s*.3)+'px '+A.font; g.textAlign = 'center'; g.fillText('💧', sx + s/2, sy + s/2 + s*.1);
      for (const tr of trees) { const X = ox + tr.x*s, Y = OY + tr.y*s, ok = wet.has(tr.x+','+tr.y); g.fillStyle = ok ? '#00B451' : '#b8a060'; g.beginPath(); g.moveTo(X+s/2, Y+s*.12); g.lineTo(X+s*.82, Y+s*.72); g.lineTo(X+s*.18, Y+s*.72); g.fill(); g.fillStyle = '#6b4a2b'; g.fillRect(X+s*.44, Y+s*.7, s*.12, s*.18); } }
    g.fillStyle = '#121313'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Level '+(level||1)+'   '+(score||0).toLocaleString(), 12, 28); g.textAlign = 'right'; g.fillStyle = timeLeft < 10 ? '#FF4539' : '#121313'; g.fillText('💧 '+Math.ceil(timeLeft||0)+' s', w-12, 28);
    g.fillStyle = '#121313'; g.font = '13px '+A.font; g.textAlign = 'center'; g.fillText('Tap a pipe to turn it · water every tree', w/2, h - 18);
    if (st == 'ready') A.overlayText(g, w, h, 'STREAM FIXER', 'Turn the pipes so the spring waters every tree · tap to start');
    if (st == 'over') A.overlayText(g, w, h, 'THE SPRING RAN DRY', (score||0).toLocaleString()+' points · level '+level+' · tap to try again'); });
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// SNOWBALL SHOWDOWN — top-down snow fight. Move, hide behind forts, throw at the CPU kids. Survive the waves.
// =====================================================================================================
A.register('snowball', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 520, 520); c.style.touchAction = 'none';
  const K = keysDown(); let st = 'ready', me, foes, balls, forts, score, wave, t = 0, quiz = false, aim = {x:0, y:0}, cool = 0, flakes = [], hold = false;
  for (let i = 0; i < 50; i++) flakes.push({x:Math.random()*520, y:Math.random()*520, s:.5 + Math.random()});
  const mkForts = () => { forts = [{x:120, y:330, w:70, h:22, hp:5}, {x:330, y:330, w:70, h:22, hp:5}, {x:225, y:250, w:70, h:22, hp:5}, {x:90, y:170, w:60, h:20, hp:4}, {x:370, y:170, w:60, h:20, hp:4}]; };
  const spawnWave = () => { wave++; foes = []; const n = Math.min(7, 1 + wave); for (let i = 0; i < n; i++) foes.push({x:60 + Math.random()*400, y:40 + Math.random()*70, hp:1 + Math.floor(wave/4), cool:1 + Math.random()*2, tx:0, ty:0, rt:0, col:['#FF4539','#b48cff','#F9BF01','#64CDF5','#ff8fd0'][i%5]}); mkForts(); };
  const reset = () => { me = {x:w/2, y:h-50, hp:A.D(6,4,3) + A.U('life'), inv:0}; balls = []; score = 0; wave = 0; spawnWave(); api.score(0); };
  const throwAt = (from, tx, ty, mine) => { const d = Math.hypot(tx - from.x, ty - from.y) || 1, sp = mine ? 420 : A.D(200, 250, 300); balls.push({x:from.x, y:from.y, vx:(tx - from.x)/d*sp, vy:(ty - from.y)/d*sp, mine, life:1.6}); };
  const offK = A.keys(e => { if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; } });
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } aim = pt(c, e, w, h); hold = true; }); c.addEventListener('pointermove', e => { aim = pt(c, e, w, h); });
  const pu = () => { hold = false; }; c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const blocked = (x, y) => forts.find(f => f.hp > 0 && x > f.x && x < f.x + f.w && y > f.y && y < f.y + f.h);
  const offL = A.loop(dt => { t += dt; dt = Math.min(dt, .033); for (const f of flakes) { f.y += 20*f.s*dt; f.x += Math.sin(t + f.y*.02)*6*dt; if (f.y > h) f.y = 0; }
    if (st == 'play' && !quiz) { const mx = (K.k.ArrowRight||K.k.d ? 1 : 0) - (K.k.ArrowLeft||K.k.a ? 1 : 0), my = (K.k.ArrowDown||K.k.s ? 1 : 0) - (K.k.ArrowUp||K.k.w ? 1 : 0), sp = 190 * (1 + .05*A.U('boots'));
      if (mx || my) { const d = Math.hypot(mx, my); me.x += mx/d*sp*dt; me.y += my/d*sp*dt; } else if (hold && aim.y > h*.55) { me.x += clamp(aim.x - me.x, -sp*dt, sp*dt); }
      me.x = clamp(me.x, 14, w-14); me.y = clamp(me.y, h*.55, h-14); me.inv = Math.max(0, me.inv - dt);
      cool -= dt; if ((K.k[' '] || (hold && aim.y < h*.55)) && cool <= 0) { cool = .35 * (1 - .08*A.U('arm')); const tx = hold ? aim.x : (foes[0] ? foes[0].x : me.x), ty = hold ? aim.y : (foes[0] ? foes[0].y : 0); throwAt(me, tx, ty, true); A.tone(600,.03,'triangle',.03); }
      for (const f of foes) { f.rt -= dt; if (f.rt <= 0) { f.rt = 1 + Math.random()*1.5; f.tx = 40 + Math.random()*440; f.ty = 30 + Math.random()*170; } f.x += clamp(f.tx - f.x, -70*dt, 70*dt); f.y += clamp(f.ty - f.y, -70*dt, 70*dt);
        f.cool -= dt; if (f.cool <= 0) { f.cool = A.D(2.4, 1.8, 1.3) + Math.random(); throwAt(f, me.x + (Math.random()-.5)*40, me.y, false); } }
      for (const b of balls) { b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt; const ft = blocked(b.x, b.y); if (ft) { ft.hp--; b.life = 0; A.tone(150,.03,'square',.02); continue; }
        if (b.mine) { const f = foes.find(f2 => Math.hypot(f2.x - b.x, f2.y - b.y) < 16); if (f) { f.hp--; b.life = 0; A.sfx('hit'); if (f.hp <= 0) { score += 50 + wave*10; api.score(score); f.dead = 1; } } }
        else if (Math.hypot(me.x - b.x, me.y - b.y) < 15 && me.inv <= 0) { b.life = 0; if (!A.immortal) me.hp--; me.inv = 1; A.sfx('bad');
          if (me.hp <= 0) quiz = learn2(host, api, 'SPLAT! ANSWER TO SHAKE OFF THE SNOW', () => { quiz = false; me.hp = 2; me.inv = 2; }, () => { quiz = false; st = 'over'; A.sfx('over'); stat(api,'snowWave',wave,'max'); api.over(score); }); } }
      balls = balls.filter(b => b.life > 0 && b.x > -10 && b.x < w+10 && b.y > -10 && b.y < h+10); foes = foes.filter(f => !f.dead);
      if (!foes.length) { score += 200*wave; api.score(score); A.sfx('win'); spawnWave(); } }
    g.fillStyle = '#eef6ff'; g.fillRect(0,0,w,h); g.fillStyle = 'rgba(160,190,220,.25)'; g.fillRect(0, h*.55 - 2, w, 4);
    if (forts) for (const f of forts) { if (f.hp <= 0) continue; g.fillStyle = '#fff'; rr(g, f.x, f.y, f.w, f.h, 8); g.fill(); g.strokeStyle = '#b8d0e8'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(160,190,220,.6)'; g.fillRect(f.x + 4, f.y + f.h - 4, (f.w-8)*f.hp/5, 2); }
    const kid = (x, y, col, face) => { g.fillStyle = col; rr(g, x-11, y-6, 22, 18, 7); g.fill(); g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(x, y-12, 8, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y-15, 8, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y-23, 3, 0, TAU); g.fill(); };
    if (foes) for (const f of foes) kid(f.x, f.y, f.col);
    if (me && !(me.inv > 0 && Math.sin(t*25) > 0)) kid(me.x, me.y, '#00B451');
    if (balls) for (const b of balls) { g.fillStyle = '#fff'; g.strokeStyle = '#a0b8d0'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y, 5, 0, TAU); g.fill(); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.9)'; for (const f of flakes) g.fillRect(f.x, f.y, 2*f.s, 2*f.s);
    g.fillStyle = '#14204a'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Wave '+(wave||0)+'   '+(score||0).toLocaleString(), 12, 24); g.textAlign = 'right'; g.fillText('❄'.repeat(clamp(me ? me.hp : 0, 0, 10)), w-12, 24);
    if (st == 'ready') A.overlayText(g, w, h, 'SNOWBALL SHOWDOWN', 'WASD / arrows move · Space throws · or tap the top half to throw there');
    if (st == 'over') A.overlayText(g, w, h, 'SNOWED UNDER', (score||0).toLocaleString()+' points · wave '+wave+' · tap to play again'); });
  return () => { offK(); offL(); K.off(); };
}});

// =====================================================================================================
// SPROUT FARM — a busy 2-minute day in the garden: plant, water, harvest, fill orders. (Played actively — no passive income.)
// =====================================================================================================
A.register('farm', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 480, 560); c.style.touchAction = 'none';
  const CROPS = [{k:'carrot',e:'🥕',grow:6,pts:20},{k:'corn',e:'🌽',grow:9,pts:35},{k:'tomato',e:'🍅',grow:8,pts:30},{k:'pumpkin',e:'🎃',grow:14,pts:70},{k:'berry',e:'🍓',grow:7,pts:25}];
  let st = 'ready', plots, seed = 0, orders, score, timeLeft, t = 0, tool = 'plant', quiz = false, coinsPop = [], dayN = 0;
  const reset = () => { plots = Array.from({length:12}, () => ({c:null, g:0, water:0, wilt:0})); orders = []; score = 0; timeLeft = 120 + 10*A.U('time'); dayN++; addOrder(); addOrder(); api.score(0); };
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
    if (st == 'ready') A.overlayText(g, w, h, 'SPROUT FARM', 'Pick a seed below, tap a plot to plant, tap to water, tap to pick · fill orders!');
    if (st == 'over') A.overlayText(g, w, h, 'WHAT A DAY!', (score||0).toLocaleString()+' points · tap to farm again'); });
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// CRITTER CARDS — memory battle. Each pair you match makes your critter attack; every miss lets the rival attack.
// =====================================================================================================
A.register('cardbattle', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 480, 580); c.style.touchAction = 'none';
  const CARDS = [{e:'🦊',n:'Fox',dmg:2},{e:'🐻',n:'Bear',dmg:3},{e:'🦉',n:'Owl',dmg:2},{e:'🐺',n:'Wolf',dmg:3},{e:'🦌',n:'Deer',dmg:2},{e:'🦅',n:'Eagle',dmg:3},{e:'🐸',n:'Frog',dmg:1,heal:2},{e:'🦔',n:'Hedgehog',dmg:1,shield:1},{e:'🐉',n:'Dragon',dmg:5},{e:'🦄',n:'Unicorn',dmg:2,heal:3}];
  const FOES = [{e:'🦝',n:'Sneaky Raccoon',hp:10,atk:2},{e:'🐗',n:'Grumpy Boar',hp:14,atk:2},{e:'🦂',n:'Desert Scorpion',hp:16,atk:3},{e:'🐊',n:'Swamp Gator',hp:20,atk:3},{e:'🦖',n:'Rex the Mighty',hp:26,atk:4},{e:'👾',n:'Pixel Phantom',hp:32,atk:4}];
  let st = 'ready', deck, open = [], foe, foeHp, myHp, myMax, shield, score, stage, lock = 0, t = 0, fx = [], quiz = false, turnMsg = '';
  const deal = () => { const n = A.D(6, 8, 10); const pick = shuffle(CARDS.slice()).slice(0, n/2 + (n > 8 ? 1 : 0)).slice(0, n/2); deck = shuffle([...pick, ...pick].map(cd => ({...cd, up:false, gone:false}))); open = []; };
  const reset = () => { stage = 0; score = 0; myMax = A.D(14, 12, 10) + 2*A.U('life'); myHp = myMax; shield = 0; nextFoe(); api.score(0); };
  const nextFoe = () => { foe = FOES[Math.min(stage, FOES.length-1)]; foeHp = foe.hp + Math.max(0, stage - FOES.length + 1)*8; deal(); turnMsg = foe.n+' appears!'; };
  const layout = () => { const n = deck.length, cols = n <= 8 ? 4 : 5, rows = Math.ceil(n / cols), cw = Math.min(88, (w - 40) / cols - 8), ch = cw * 1.25; return {cols, cw, ch, ox:(w - cols*(cw+8))/2 + 4, oy:250}; };
  const flip = i => { if (st != 'play' || lock > 0 || quiz) return; const cd = deck[i]; if (!cd || cd.up || cd.gone) return; cd.up = true; open.push(cd); A.tone(500,.04,'triangle',.04);
    if (open.length == 2) { lock = .7; const [a, b] = open; if (a.e == b.e) { setTimeout(() => { a.gone = b.gone = true; const dmg = a.dmg * (1 + .15*A.U('power')); foeHp -= dmg; if (a.heal) myHp = Math.min(myMax, myHp + a.heal); if (a.shield) shield += a.shield; score += Math.round(dmg*30); api.score(score); fx.push({t:.6, txt:'-'+Math.round(dmg*10)/10, x:w/2, y:120, col:'#FF4539'}); turnMsg = a.n+' attacks!'+(a.heal?' +'+a.heal+' HP':'')+(a.shield?' +shield':''); A.sfx('hit');
          if (foeHp <= 0) { score += 300*(stage+1); api.score(score); A.sfx('win'); stat(api,'cardFoes',1,'add'); stage++; setTimeout(nextFoe, 700); } else if (deck.every(x => x.gone)) deal(); open = []; }, 450); }
      else setTimeout(() => { a.up = b.up = false; open = []; if (shield > 0) { shield--; turnMsg = 'Your Hedgehog blocks the attack!'; } else { myHp -= foe.atk; fx.push({t:.6, txt:'-'+foe.atk, x:w/2, y:210, col:'#ff8a3c'}); turnMsg = foe.n+' strikes back!'; A.sfx('bad'); }
        if (myHp <= 0 && !A.immortal) quiz = learn2(host, api, 'YOUR CRITTERS ARE TIRED! ANSWER TO HEAL', () => { quiz = false; myHp = Math.ceil(myMax/2); }, () => { quiz = false; st = 'over'; A.sfx('over'); api.over(score); }); }, 650); } };
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } const q = pt(c, e, w, h), L = layout(); deck.forEach((cd, i) => { const x = L.ox + (i % L.cols)*(L.cw+8), y = L.oy + Math.floor(i / L.cols)*(L.ch+8); if (q.x > x && q.x < x + L.cw && q.y > y && q.y < y + L.ch) flip(i); }); });
  let cur = 0; const offK = A.keys(e => { if (e.type != 'keydown') return; if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; return; } if (st != 'play') return; const L = layout(), m = {ArrowLeft:-1, ArrowRight:1, ArrowUp:-L.cols, ArrowDown:L.cols}[e.key]; if (m) cur = clamp(cur + m, 0, deck.length-1); if (e.key == ' ' || e.key == 'Enter') flip(cur); });
  const offL = A.loop(dt => { t += dt; lock = Math.max(0, lock - dt); for (const f of fx) { f.t -= dt; f.y -= 30*dt; } fx = fx.filter(f => f.t > 0);
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
    if (st == 'ready') A.overlayText(g, w, h, 'CRITTER CARDS', 'Match pairs to attack · a miss lets the rival hit back · tap to start');
    if (st == 'over') A.overlayText(g, w, h, 'BATTLE OVER', (score||0).toLocaleString()+' points · reached stage '+(stage+1)+' · tap to battle again'); });
  return () => { offK(); offL(); };
}});
})();
