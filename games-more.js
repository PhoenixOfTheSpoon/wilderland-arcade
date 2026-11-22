// Wilderland Arcade · MORE GAMES — Bounce Up, Gem Match, Maze Muncher, Comet Dash, Lumber Jump.
// Each is a full little cabinet: keyboard + touch, increasing difficulty, score → tickets through api.over().
(function(){
const A = window.Arcade, C = A.C, TAU = Math.PI*2;
const rr = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const pt = (c, e, w, h) => { const r = c.getBoundingClientRect(); return {x:(e.clientX-r.left)*w/r.width, y:(e.clientY-r.top)*h/r.height}; };
const low = () => !!A.lowFx;

// =====================================================================================================
// BOUNCE UP — hop from cloud to cloud, as high as you can. ← → / A D / tilt by dragging.
// =====================================================================================================
A.register('bounce', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 480, 560); c.style.touchAction = 'none';
  let st = 'ready', p, plats, camY, score, best = 0, coins, keys = {}, dragX = null, parts = [], t = 0;
  const reset = () => { p = {x:w/2, y:h-80, vx:0, vy:-560, face:1}; plats = []; camY = 0; score = 0; coins = 0; parts = [];
    for (let i = 0; i < 12; i++) addPlat(h - 40 - i*50); plats[0].x = w/2 - 40; plats[0].kind = 'n'; api.score(0); };
  const addPlat = y => { const lvl = Math.max(0, -y)/1500, r = Math.random(); const kind = r < Math.min(.25, .05+lvl*.04) ? 'm' : r < Math.min(.4, .1+lvl*.05) ? 'b' : r < .5 ? 's' : 'n';
    plats.push({x: 20 + Math.random()*(w-120), y, w: Math.max(52, 84 - lvl*6), kind, vx: kind=='m' ? (60+lvl*20)*(Math.random()<.5?-1:1) : 0, broke:false, coin: Math.random() < .18}); };
  const offK = A.keys(e => { if (e.type == 'keydown') { keys[e.key] = true; if (st != 'play' && (e.key==' '||e.key=='Enter')) { reset(); st = 'play'; } } });
  const ku = e => { keys[e.key] = false; }; window.addEventListener('keyup', ku);
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } dragX = pt(c, e, w, h).x; });
  c.addEventListener('pointermove', e => { if (dragX != null) dragX = pt(c, e, w, h).x; });
  const upP = () => { dragX = null; }; c.addEventListener('pointerup', upP); c.addEventListener('pointercancel', upP);
  const offL = A.loop(dt => { t += dt;
    if (st == 'play') { const ax = (keys.ArrowLeft||keys.a ? -1 : 0) + (keys.ArrowRight||keys.d ? 1 : 0);
      if (dragX != null) p.vx += Math.max(-1, Math.min(1, (dragX - p.x)/60)) * 2600*dt; else p.vx += ax * 2200*dt;
      p.vx *= Math.pow(.02, dt); p.vx = Math.max(-420, Math.min(420, p.vx)); if (p.vx) p.face = Math.sign(p.vx);
      p.x += p.vx*dt; if (p.x < -14) p.x = w+14; if (p.x > w+14) p.x = -14;
      p.vy += 1300*dt; const oy = p.y; p.y += p.vy*dt;
      for (const q of plats) { if (q.kind == 'm') { q.x += q.vx*dt; if (q.x < 8 || q.x + q.w > w-8) q.vx *= -1; }
        if (p.vy > 0 && !q.broke && oy+16 <= q.y && p.y+16 >= q.y && p.x > q.x-8 && p.x < q.x+q.w+8) {
          if (q.kind == 'b') { q.broke = true; A.tone(180,.08,'square',.03); continue; }
          p.vy = q.kind == 's' ? -980 : -580; A.tone(q.kind=='s'?700:420,.06,'triangle',.04); if (!low()) for (let i=0;i<6;i++) parts.push({x:p.x, y:q.y, vx:(Math.random()-.5)*160, vy:-Math.random()*80, t:.4, col:'#fff'}); } }
      for (const q of plats) if (q.coin && Math.hypot(p.x-(q.x+q.w/2), p.y-(q.y-22)) < 22) { q.coin = false; coins++; A.sfx('coin'); }
      if (p.y < camY + h*.4) camY = p.y - h*.4;
      score = Math.max(score, Math.floor((h-80 - p.y)/10) + coins*25); api.score(score);
      plats = plats.filter(q => q.y < camY + h + 40); while (plats.length < 14) addPlat(Math.min(...plats.map(q=>q.y)) - (46 + Math.random()*22 + Math.min(30, -camY/500)));
      if (p.y > camY + h + 40) { st = 'over'; best = Math.max(best, score); A.sfx('over'); stat(api,'bounceBest',score,'max'); api.over(score); } }
    for (const q of parts) { q.t -= dt; q.x += q.vx*dt; q.y += q.vy*dt; q.vy += 300*dt; } parts = parts.filter(q => q.t > 0);
    // draw
    const sky = g.createLinearGradient(0,0,0,h), hue = Math.min(1, -camY/20000); sky.addColorStop(0, hue > .5 ? '#14204a' : '#64CDF5'); sky.addColorStop(1, hue > .5 ? '#3a2a6a' : '#bfe6ff'); g.fillStyle = sky; g.fillRect(0,0,w,h);
    for (let i=0;i<8;i++) { const yy = ((i*97 - camY*.2) % (h+60)) - 30; g.fillStyle = 'rgba(255,255,255,'+(hue>.5?.6:.35)+')'; if (hue > .5) g.fillRect((i*131)%w, yy, 2, 2); else { g.beginPath(); g.ellipse((i*131)%w, yy, 40, 12, 0, 0, TAU); g.fill(); } }
    g.save(); g.translate(0, -camY);
    for (const q of plats) { if (q.broke) continue; const col = q.kind=='s' ? '#F9BF01' : q.kind=='m' ? '#b48cff' : q.kind=='b' ? '#c9a77a' : '#fff';
      g.fillStyle = 'rgba(0,0,0,.12)'; rr(g, q.x+3, q.y+4, q.w, 12, 6); g.fill(); g.fillStyle = col; rr(g, q.x, q.y, q.w, 12, 6); g.fill();
      if (q.kind=='b') { g.strokeStyle = '#8D5B1D'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(q.x+q.w*.4, q.y); g.lineTo(q.x+q.w*.5, q.y+12); g.stroke(); }
      if (q.kind=='s') { g.strokeStyle = '#c48a00'; g.lineWidth = 2; g.beginPath(); for (let k=0;k<4;k++) g.lineTo(q.x+q.w/2-6+(k%2)*12, q.y-2-k*3); g.stroke(); }
      if (q.coin) { const cy = q.y-22 + Math.sin(t*4+q.x)*3; g.fillStyle = C.gold; g.beginPath(); g.arc(q.x+q.w/2, cy, 7, 0, TAU); g.fill(); g.fillStyle = '#fff6b0'; g.fillRect(q.x+q.w/2-1, cy-4, 2, 8); } }
    for (const q of parts) { g.globalAlpha = q.t*2; g.fillStyle = q.col; g.fillRect(q.x, q.y, 3, 3); } g.globalAlpha = 1;
    if (p) { g.save(); g.translate(p.x, p.y); g.scale(p.face, 1); const sq = Math.max(.8, Math.min(1.2, 1 - p.vy/3000));
      g.scale(1/sq, sq); g.fillStyle = '#00B451'; rr(g, -14, -16, 28, 30, 12); g.fill(); g.fillStyle = '#D5F367'; rr(g, -9, -2, 18, 12, 6); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-4, -7, 5, 0, TAU); g.arc(7, -7, 5, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(-2.5, -7, 2.4, 0, TAU); g.arc(8.5, -7, 2.4, 0, TAU); g.fill(); g.restore(); }
    g.restore();
    g.fillStyle = '#121313'; g.font = '700 18px '+A.font; g.textAlign = 'left'; g.fillText(score.toLocaleString()+'  · 🪙 '+coins, 12, 26);
    if (st == 'ready') A.overlayText(g, w, h, 'BOUNCE UP', '← → or drag to steer · tap / Space to start');
    if (st == 'over') A.overlayText(g, w, h, 'YOU FELL!', score.toLocaleString()+' points · tap to bounce again'); });
  reset(); st = 'ready';
  return () => { offK(); offL(); window.removeEventListener('keyup', ku); };
}});

// =====================================================================================================
// GEM MATCH — swap neighbouring gems to make 3+ in a row. 30 moves; specials for 4 and 5.
// =====================================================================================================
A.register('gems', { mount(host, api){
  const N = 8, S = 54, OX = 24, OY = 70, {c,g,w,h} = A.canvas(host, 480, 520); c.style.touchAction = 'none';
  const COL = ['#FF4539','#F9BF01','#00B451','#64CDF5','#b48cff','#ff8fd0'], SH = ['◆','●','▲','■','★','♥'];
  let B, sel = null, score = 0, moves = 30, st = 'ready', anim = 0, fall = [], pops = [], combo = 0, level = 1, target = 2500, t = 0;
  const rnd = () => Math.floor(Math.random()*(level >= 3 ? 6 : 5));
  const at = (x, y) => x>=0 && y>=0 && x<N && y<N ? B[y][x] : null;
  const fill = () => { B = Array.from({length:N}, () => Array.from({length:N}, () => ({k:rnd(), sp:0, dy:0})));
    let again = true; while (again) { again = false; for (let y=0;y<N;y++) for (let x=0;x<N;x++) if ((x>1 && B[y][x].k==B[y][x-1].k && B[y][x].k==B[y][x-2].k) || (y>1 && B[y][x].k==B[y-1][x].k && B[y][x].k==B[y-2][x].k)) { B[y][x].k = rnd(); again = true; } } };
  const find = () => { const hit = new Set(), runs = [];
    for (let y=0;y<N;y++) { let s=0; for (let x=1;x<=N;x++) { if (x<N && B[y][x] && B[y][s] && B[y][x].k==B[y][s].k) continue; if (x-s>=3) { runs.push({len:x-s, cells:[...Array(x-s)].map((_,i)=>[s+i,y])}); for (let i=s;i<x;i++) hit.add(i+','+y); } s = x; } }
    for (let x=0;x<N;x++) { let s=0; for (let y=1;y<=N;y++) { if (y<N && B[y][x] && B[s][x] && B[y][x].k==B[s][x].k) continue; if (y-s>=3) { runs.push({len:y-s, cells:[...Array(y-s)].map((_,i)=>[x,s+i])}); for (let i=s;i<y;i++) hit.add(x+','+i); } s = y; } }
    return {hit, runs}; };
  const clear = () => { const {hit, runs} = find(); if (!hit.size) return false; combo++;
    const extra = new Set(hit); hit.forEach(key => { const [x,y] = key.split(',').map(Number), cell = B[y][x]; if (cell.sp == 1) for (let i=0;i<N;i++) { extra.add(i+','+y); } if (cell.sp == 2) for (let i=0;i<N;i++) extra.add(x+','+i); if (cell.sp == 3) for (let yy=0;yy<N;yy++) for (let xx=0;xx<N;xx++) if (B[yy][xx].k == cell.k) extra.add(xx+','+yy); });
    const keep = {}; runs.forEach(r => { if (r.len >= 4) { const [x,y] = r.cells[Math.floor(r.len/2)]; keep[x+','+y] = {k:B[y][x].k, sp: r.len >= 5 ? 3 : (r.cells[0][1]==r.cells[1][1] ? 1 : 2)}; } });
    extra.forEach(key => { const [x,y] = key.split(',').map(Number); pops.push({x:OX+x*S+S/2, y:OY+y*S+S/2, col:COL[B[y][x].k], t:.4}); B[y][x] = keep[key] ? {...keep[key], dy:0} : null; });
    score += extra.size * 20 * combo; api.score(score); A.tone(500+combo*90,.08,'triangle',.05);
    for (let x=0;x<N;x++) { let wy = N-1; for (let y=N-1;y>=0;y--) if (B[y][x]) { const cell = B[y][x]; B[y][x] = null; B[wy][x] = cell; cell.dy = (wy - y)*S; wy--; } for (let y=wy;y>=0;y--) B[y][x] = {k:rnd(), sp:0, dy:(wy+1)*S}; }
    anim = .22; return true; };
  const anyMove = () => { for (let y=0;y<N;y++) for (let x=0;x<N;x++) for (const [dx,dy] of [[1,0],[0,1]]) { const x2=x+dx, y2=y+dy; if (x2>=N||y2>=N) continue; [B[y][x],B[y2][x2]]=[B[y2][x2],B[y][x]]; const ok = find().hit.size>0; [B[y][x],B[y2][x2]]=[B[y2][x2],B[y][x]]; if (ok) return true; } return false; };
  const swap = (a, b) => { const A1 = B[a[1]][a[0]], B1 = B[b[1]][b[0]]; B[a[1]][a[0]] = B1; B[b[1]][b[0]] = A1;
    if (!find().hit.size && !(A1.sp==3 || B1.sp==3)) { B[a[1]][a[0]] = A1; B[b[1]][b[0]] = B1; A.sfx('bad'); return; }
    if (A1.sp == 3 || B1.sp == 3) { const k = A1.sp==3 ? B1.k : A1.k; let n = 0; for (let y=0;y<N;y++) for (let x=0;x<N;x++) if (B[y][x].k == k || B[y][x].sp==3) { pops.push({x:OX+x*S+S/2, y:OY+y*S+S/2, col:COL[B[y][x].k], t:.4}); B[y][x] = {k:-1}; n++; }
      for (let y=0;y<N;y++) for (let x=0;x<N;x++) if (B[y][x].k == -1) B[y][x] = null; score += n*40; for (let x=0;x<N;x++) { let wy = N-1; for (let y=N-1;y>=0;y--) if (B[y][x]) { const cell = B[y][x]; B[y][x] = null; B[wy][x] = cell; cell.dy = (wy-y)*S; wy--; } for (let y=wy;y>=0;y--) B[y][x] = {k:rnd(), sp:0, dy:(wy+1)*S}; } anim = .22; A.sfx('win'); }
    combo = 0; moves--; anim = Math.max(anim, .01); };
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h); if (st != 'play') { if (st != 'anim') start(); return; } if (anim > 0) return;
    const x = Math.floor((q.x-OX)/S), y = Math.floor((q.y-OY)/S); if (!at(x,y)) { sel = null; return; }
    if (sel && Math.abs(sel[0]-x) + Math.abs(sel[1]-y) == 1) { swap(sel, [x,y]); sel = null; } else { sel = [x,y]; A.sfx('blip'); } });
  const start = () => { score = 0; moves = 30; level = 1; target = 2500; combo = 0; fill(); st = 'play'; api.score(0); };
  const offL = A.loop(dt => { t += dt;
    if (st == 'play') { if (anim > 0) { anim -= dt; for (let y=0;y<N;y++) for (let x=0;x<N;x++) if (B[y][x]) B[y][x].dy = Math.max(0, B[y][x].dy - 900*dt); if (anim <= 0) { if (!clear()) { combo = 0;
          if (score >= target) { level++; target = Math.round(target*2.2); moves += 20; A.sfx('win'); }
          else if (moves <= 0) { st = 'over'; A.sfx('over'); stat(api,'gemsBest',score,'max'); api.over(score); }
          else if (!anyMove()) fill(); } } } }
    for (const q of pops) q.t -= dt; pops = pops.filter(q => q.t > 0);
    g.fillStyle = '#1a1030'; g.fillRect(0,0,w,h); g.fillStyle = '#2a1a4a'; rr(g, OX-6, OY-6, N*S+12, N*S+12, 12); g.fill();
    g.fillStyle = '#fff'; g.font = '700 18px '+A.font; g.textAlign = 'left'; g.fillText('Score '+score.toLocaleString(), 24, 30); g.textAlign = 'right'; g.fillText('Moves '+moves, w-24, 30);
    g.font = '600 12px '+A.font; g.fillStyle = '#d8c8ff'; g.textAlign = 'center'; g.fillText('Level '+level+' · reach '+target.toLocaleString()+' for +20 moves', w/2, 54);
    if (B) for (let y=0;y<N;y++) for (let x=0;x<N;x++) { const cell = B[y][x]; if (!cell) continue; const px = OX+x*S, py = OY+y*S - (cell.dy||0); if (py < OY-S) continue;
      const on = sel && sel[0]==x && sel[1]==y; g.fillStyle = on ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.05)'; rr(g, px+2, py+2, S-4, S-4, 10); g.fill();
      const col = COL[cell.k] || '#fff', gr = g.createRadialGradient(px+S*.4, py+S*.35, 2, px+S/2, py+S/2, S*.45); gr.addColorStop(0, '#fff'); gr.addColorStop(.25, col); gr.addColorStop(1, col);
      g.fillStyle = gr; g.beginPath(); g.arc(px+S/2, py+S/2, S*.36 * (on ? 1 + .06*Math.sin(t*10) : 1), 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '700 16px '+A.font; g.textAlign = 'center'; g.fillText(SH[cell.k]||'', px+S/2, py+S/2+6);
      if (cell.sp) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); if (cell.sp==1) { g.moveTo(px+8, py+S/2); g.lineTo(px+S-8, py+S/2); } else if (cell.sp==2) { g.moveTo(px+S/2, py+8); g.lineTo(px+S/2, py+S-8); } else g.arc(px+S/2, py+S/2, S*.42, 0, TAU); g.stroke(); } }
    for (const q of pops) { g.globalAlpha = q.t*2.5; g.strokeStyle = q.col; g.lineWidth = 4; g.beginPath(); g.arc(q.x, q.y, 26 - q.t*40, 0, TAU); g.stroke(); } g.globalAlpha = 1;
    if (st == 'ready') A.overlayText(g, w, h, 'GEM MATCH', 'Tap a gem, then a neighbour to swap · tap to start');
    if (st == 'over') A.overlayText(g, w, h, 'OUT OF MOVES', score.toLocaleString()+' points · level '+level+' · tap to play again'); });
  return () => { offL(); };
}});

// =====================================================================================================
// MAZE MUNCHER — eat every dot, dodge the ghosts, grab a power berry to turn the tables.
// =====================================================================================================
A.register('maze', { mount(host, api){
  const MAP = ['###################','#........#........#','#o##.###.#.###.##o#','#.................#','#.##.#.#####.#.##.#','#....#...#...#....#','####.### # ###.####','   #.#   G   #.#   ','####.# ##-## #.####','#......#   #......#','####.# ##### #.####','   #.#       #.#   ','####.# ##### #.####','#........#........#','#.##.###.#.###.##.#','#o.#.....P.....#.o#','##.#.#.#####.#.#.##','#....#...#...#....#','#.######.#.######.#','#.................#','###################'];
  const CW = 24, R = MAP.length, Cn = MAP[0].length, {c,g,w,h} = A.canvas(host, Cn*CW, R*CW + 34); c.style.touchAction = 'none';
  let grid, dots, pac, ghosts, st = 'ready', score = 0, lives = 3, level = 1, power = 0, t = 0, want = null, swipe = null;
  const wall = (x, y) => { if (x < 0 || x >= Cn) return false; const ch = (grid[y]||'')[x]; return ch == '#' || ch == '-'; };
  const setup = keepScore => { grid = MAP.map(r => r.split('')); dots = 0; ghosts = [];
    for (let y=0;y<R;y++) for (let x=0;x<Cn;x++) { const ch = grid[y][x]; if (ch == '.' || ch == 'o') dots++; if (ch == 'P') { pac = {x, y, px:x, py:y, dx:0, dy:0, prog:0}; grid[y][x] = ' '; } if (ch == 'G') { grid[y][x] = ' '; [0,1,2,3].forEach(i => ghosts.push({x:x-1+i%3, y, sx:x-1+i%3, sy:y, dx:0, dy:0, prog:0, col:['#FF4539','#ff8fd0','#64CDF5','#F9BF01'][i], wait:i*2.5, dead:0})); } }
    if (!keepScore) { score = 0; lives = 3; level = 1; } power = 0; api.score(score); };
  const resetPos = () => { pac.x = pac.px; pac.y = pac.py; pac.dx = pac.dy = 0; pac.prog = 0; ghosts.forEach((q,i) => { q.x = q.sx; q.y = q.sy; q.prog = 0; q.dx = q.dy = 0; q.wait = i*2; q.dead = 0; }); };
  const offK = A.keys(e => { const m = {ArrowLeft:[-1,0], a:[-1,0], ArrowRight:[1,0], d:[1,0], ArrowUp:[0,-1], w:[0,-1], ArrowDown:[0,1], s:[0,1]}[e.key]; if (m) want = m; if (st != 'play' && (e.key==' '||e.key=='Enter')) { setup(false); st = 'play'; } });
  c.addEventListener('pointerdown', e => { if (st != 'play') { setup(false); st = 'play'; return; } swipe = pt(c, e, w, h); });
  c.addEventListener('pointerup', e => { if (!swipe) return; const q = pt(c, e, w, h), dx = q.x - swipe.x, dy = q.y - swipe.y; swipe = null;
    if (Math.hypot(dx, dy) < 12) { const px = pac.x*CW+CW/2, py = pac.y*CW+CW/2, ax = q.x - px, ay = q.y - py; want = Math.abs(ax) > Math.abs(ay) ? [Math.sign(ax),0] : [0,Math.sign(ay)]; }
    else want = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx),0] : [0,Math.sign(dy)]; });
  const step = (o, sp, dt, choose) => { o.prog += sp*dt; while (o.prog >= 1) { o.prog -= 1; o.x += o.dx; o.y += o.dy; if (o.x < 0) o.x = Cn-1; if (o.x >= Cn) o.x = 0; choose(o); } if (!o.dx && !o.dy) { o.prog = 0; choose(o); } };
  const offL = A.loop(dt => { t += dt;
    if (st == 'play') { const sp = 6.2 + level*.25;
      step(pac, sp, dt, o => { if (want && !wall(o.x+want[0], o.y+want[1])) { o.dx = want[0]; o.dy = want[1]; } if (wall(o.x+o.dx, o.y+o.dy)) { o.dx = 0; o.dy = 0; }
        const ch = grid[o.y][o.x]; if (ch == '.' || ch == 'o') { grid[o.y][o.x] = ' '; dots--; score += ch == 'o' ? 50 : 10; api.score(score); if (ch == 'o') { power = 7 - Math.min(4, level*.5); A.sfx('win'); } else A.tone(660,.03,'square',.02); } });
      power = Math.max(0, power - dt);
      ghosts.forEach(q => { if (q.wait > 0) { q.wait -= dt; return; } const gs = q.dead ? 12 : power > 0 ? 3.6 : 4.6 + level*.3;
        step(q, gs, dt, o => { const opts = [[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy]) => !wall(o.x+dx, o.y+dy) && !(dx == -o.dx && dy == -o.dy && (o.dx||o.dy)));
          const tx = o.dead ? o.sx : pac.x, ty = o.dead ? o.sy : pac.y; if (o.dead && o.x == o.sx && o.y == o.sy) o.dead = 0;
          if (!opts.length) { o.dx = -o.dx; o.dy = -o.dy; return; }
          opts.sort((a, b) => Math.hypot(o.x+a[0]-tx, o.y+a[1]-ty) - Math.hypot(o.x+b[0]-tx, o.y+b[1]-ty)); const pick = (power > 0 && !o.dead) ? opts[opts.length-1] : Math.random() < .2 ? opts[Math.floor(Math.random()*opts.length)] : opts[0]; o.dx = pick[0]; o.dy = pick[1]; });
        const gx = q.x + q.dx*q.prog, gy = q.y + q.dy*q.prog, px = pac.x + pac.dx*pac.prog, py = pac.y + pac.dy*pac.prog;
        if (!q.dead && Math.hypot(gx-px, gy-py) < .7) { if (power > 0) { q.dead = 1; score += 200; A.sfx('coin'); api.score(score); } else if (!A.immortal) { lives--; A.sfx('bad'); if (lives <= 0) { st = 'over'; A.sfx('over'); stat(api,'mazeLevel',level,'max'); api.over(score); } else resetPos(); } } });
      if (dots <= 0) { level++; score += 500; A.sfx('win'); setup(true); } }
    // draw
    g.fillStyle = '#05050f'; g.fillRect(0,0,w,h);
    for (let y=0;y<R;y++) for (let x=0;x<Cn;x++) { const ch = grid ? grid[y][x] : MAP[y][x];
      if (ch == '#') { g.fillStyle = '#1a2a8a'; rr(g, x*CW+2, y*CW+2, CW-4, CW-4, 6); g.fill(); g.strokeStyle = '#4a6aff'; g.lineWidth = 1.5; g.stroke(); }
      if (ch == '-') { g.fillStyle = '#ff8fd0'; g.fillRect(x*CW, y*CW+CW/2-2, CW, 4); }
      if (ch == '.') { g.fillStyle = '#ffe9b0'; g.beginPath(); g.arc(x*CW+CW/2, y*CW+CW/2, 2.6, 0, TAU); g.fill(); }
      if (ch == 'o') { g.fillStyle = '#D5F367'; g.beginPath(); g.arc(x*CW+CW/2, y*CW+CW/2, 6 + Math.sin(t*6)*1.5, 0, TAU); g.fill(); } }
    if (pac && grid) { const px = (pac.x + pac.dx*pac.prog)*CW+CW/2, py = (pac.y + pac.dy*pac.prog)*CW+CW/2, ang = Math.atan2(pac.dy, pac.dx||(pac.dy?0:1)), mo = .25 + .22*Math.abs(Math.sin(t*12));
      g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(px, py); g.arc(px, py, CW*.42, ang+mo, ang+TAU-mo); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(px + Math.cos(ang-1.2)*4, py + Math.sin(ang-1.2)*4, 1.8, 0, TAU); g.fill();
      ghosts.forEach(q => { const gx = (q.x + q.dx*q.prog)*CW+CW/2, gy = (q.y + q.dy*q.prog)*CW+CW/2, scared = power > 0 && !q.dead;
        if (!q.dead) { g.fillStyle = scared ? (power < 2 && Math.sin(t*16) > 0 ? '#fff' : '#2f4aff') : q.col; g.beginPath(); g.arc(gx, gy-2, CW*.4, Math.PI, 0); g.lineTo(gx+CW*.4, gy+CW*.38); for (let k=0;k<4;k++) g.lineTo(gx+CW*.4 - (k+.5)*CW*.2, gy+CW*.38 - (k%2?0:4)); g.lineTo(gx-CW*.4, gy+CW*.38); g.fill(); }
        g.fillStyle = '#fff'; g.beginPath(); g.arc(gx-4, gy-3, 3.2, 0, TAU); g.arc(gx+4, gy-3, 3.2, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(gx-4+q.dx*1.4, gy-3+q.dy*1.4, 1.5, 0, TAU); g.arc(gx+4+q.dx*1.4, gy-3+q.dy*1.4, 1.5, 0, TAU); g.fill(); }); }
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Score '+score.toLocaleString()+'   Level '+level, 10, R*CW+22); g.textAlign = 'right'; g.fillText('❤'.repeat(Math.max(0, Math.min(lives, 6))), w-10, R*CW+22);
    if (st == 'ready') A.overlayText(g, w, h, 'MAZE MUNCHER', 'Arrows / WASD or swipe · eat the dots · tap to start');
    if (st == 'over') A.overlayText(g, w, h, 'CAUGHT!', score.toLocaleString()+' points · level '+level+' · tap to play again'); });
  setup(false); st = 'ready';
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// COMET DASH — spin, thrust and blast the comets apart before they hit your ship.
// =====================================================================================================
A.register('comets', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 480, 480); c.style.touchAction = 'none';
  let st = 'ready', ship, rocks, shots, parts = [], score = 0, lives = 3, wave = 0, keys = {}, cool = 0, inv = 0, t = 0, touch = null, stars = Array.from({length:60}, () => ({x:Math.random()*480, y:Math.random()*480, z:Math.random()}));
  const spawnWave = () => { wave++; rocks = []; for (let i = 0; i < 2 + wave; i++) { let x, y; do { x = Math.random()*w; y = Math.random()*h; } while (Math.hypot(x-w/2, y-h/2) < 140); addRock(x, y, 3); } };
  const addRock = (x, y, s) => { const a = Math.random()*TAU, v = (40 + Math.random()*40) * (1 + wave*.08) * (4-s)*.6; rocks.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, s, r:s*14, rot:0, vr:(Math.random()-.5)*2, pts:Array.from({length:10}, () => .75 + Math.random()*.35)}); };
  const reset = () => { ship = {x:w/2, y:h/2, vx:0, vy:0, a:-Math.PI/2}; shots = []; parts = []; score = 0; lives = 3; wave = 0; inv = 2; spawnWave(); api.score(0); };
  const boom = (x, y, col, n) => { if (low()) n = Math.min(n, 4); for (let i=0;i<n;i++) { const a = Math.random()*TAU, s = 40 + Math.random()*140; parts.push({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, t:.5+Math.random()*.4, col}); } };
  const offK = A.keys(e => { keys[e.key] = true; if (st != 'play' && (e.key == ' ' || e.key == 'Enter')) { reset(); st = 'play'; } });
  const ku = e => { keys[e.key] = false; }; window.addEventListener('keyup', ku);
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } touch = pt(c, e, w, h); });
  c.addEventListener('pointermove', e => { if (touch) touch = pt(c, e, w, h); });
  const tup = () => { touch = null; }; c.addEventListener('pointerup', tup); c.addEventListener('pointercancel', tup);
  const offL = A.loop(dt => { t += dt;
    if (st == 'play') { let turn = (keys.ArrowLeft||keys.a ? -1 : 0) + (keys.ArrowRight||keys.d ? 1 : 0), thrust = keys.ArrowUp||keys.w, fire = keys[' '];
      if (touch) { const want = Math.atan2(touch.y - ship.y, touch.x - ship.x); let d = want - ship.a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; turn = Math.max(-1, Math.min(1, d*3)); fire = true; thrust = Math.hypot(touch.x-ship.x, touch.y-ship.y) > 110; }
      ship.a += turn*4.2*dt; if (thrust) { ship.vx += Math.cos(ship.a)*260*dt; ship.vy += Math.sin(ship.a)*260*dt; if (!low() && Math.random() < .6) parts.push({x:ship.x - Math.cos(ship.a)*12, y:ship.y - Math.sin(ship.a)*12, vx:-Math.cos(ship.a)*80+(Math.random()-.5)*40, vy:-Math.sin(ship.a)*80+(Math.random()-.5)*40, t:.3, col:'#FF8A3C'}); }
      ship.vx *= Math.pow(.5, dt); ship.vy *= Math.pow(.5, dt); ship.x = (ship.x + ship.vx*dt + w) % w; ship.y = (ship.y + ship.vy*dt + h) % h;
      cool -= dt; inv = Math.max(0, inv - dt); if (fire && cool <= 0) { cool = .2; shots.push({x:ship.x + Math.cos(ship.a)*14, y:ship.y + Math.sin(ship.a)*14, vx:Math.cos(ship.a)*460 + ship.vx, vy:Math.sin(ship.a)*460 + ship.vy, t:.95}); A.tone(880,.03,'square',.02); }
      for (const s of shots) { s.x = (s.x + s.vx*dt + w) % w; s.y = (s.y + s.vy*dt + h) % h; s.t -= dt; }
      for (const r of rocks) { r.x = (r.x + r.vx*dt + w) % w; r.y = (r.y + r.vy*dt + h) % h; r.rot += r.vr*dt; }
      for (const s of shots) for (const r of rocks) if (!r.dead && s.t > 0 && Math.hypot(s.x-r.x, s.y-r.y) < r.r) { s.t = 0; r.dead = 1; score += [0,100,50,20][r.s]; api.score(score); boom(r.x, r.y, '#c9b48a', 12); A.tone(160,.08,'square',.04); if (r.s > 1) { addRock(r.x, r.y, r.s-1); addRock(r.x, r.y, r.s-1); } }
      rocks = rocks.filter(r => !r.dead); shots = shots.filter(s => s.t > 0);
      if (inv <= 0 && !A.immortal) for (const r of rocks) if (Math.hypot(ship.x-r.x, ship.y-r.y) < r.r + 9) { lives--; boom(ship.x, ship.y, '#64CDF5', 30); A.sfx('bad'); inv = 2.5; ship.x = w/2; ship.y = h/2; ship.vx = ship.vy = 0; if (lives <= 0) { st = 'over'; A.sfx('over'); stat(api,'cometWave',wave,'max'); api.over(score); } break; }
      if (!rocks.length) { score += 250*wave; A.sfx('win'); spawnWave(); inv = 1.5; } }
    for (const q of parts) { q.t -= dt; q.x += q.vx*dt; q.y += q.vy*dt; } parts = parts.filter(q => q.t > 0);
    g.fillStyle = '#05061a'; g.fillRect(0,0,w,h); for (const s of stars) { g.fillStyle = 'rgba(255,255,255,'+(.3+s.z*.7)+')'; g.fillRect(s.x, s.y, s.z > .7 ? 2 : 1, s.z > .7 ? 2 : 1); }
    if (rocks) for (const r of rocks) { g.save(); g.translate(r.x, r.y); g.rotate(r.rot); g.fillStyle = '#5a4a3a'; g.strokeStyle = '#c9b48a'; g.lineWidth = 2; g.beginPath(); r.pts.forEach((k, i) => { const a = i/r.pts.length*TAU; g.lineTo(Math.cos(a)*r.r*k, Math.sin(a)*r.r*k); }); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(-r.r*.25, -r.r*.2, r.r*.22, 0, TAU); g.arc(r.r*.3, r.r*.25, r.r*.15, 0, TAU); g.fill(); g.restore(); }
    if (shots) { g.fillStyle = '#D5F367'; for (const s of shots) { g.beginPath(); g.arc(s.x, s.y, 2.6, 0, TAU); g.fill(); } }
    for (const q of parts) { g.globalAlpha = Math.min(1, q.t*2); g.fillStyle = q.col; g.fillRect(q.x, q.y, 3, 3); } g.globalAlpha = 1;
    if (ship && st == 'play' && !(inv > 0 && Math.sin(t*20) > 0)) { g.save(); g.translate(ship.x, ship.y); g.rotate(ship.a); g.fillStyle = '#64CDF5'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(16, 0); g.lineTo(-10, -10); g.lineTo(-5, 0); g.lineTo(-10, 10); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(3, 0, 3, 0, TAU); g.fill(); g.restore(); }
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Score '+score.toLocaleString()+'   Wave '+wave, 10, 24); g.textAlign = 'right'; g.fillText('▲'.repeat(Math.max(0, Math.min(lives, 6))), w-10, 24);
    if (st == 'ready') A.overlayText(g, w, h, 'COMET DASH', '← → turn · ↑ thrust · Space fire · or hold a finger where to fly');
    if (st == 'over') A.overlayText(g, w, h, 'SHIP LOST', score.toLocaleString()+' points · wave '+wave+' · tap to fly again'); });
  return () => { offK(); offL(); window.removeEventListener('keyup', ku); };
}});

// =====================================================================================================
// LUMBER JUMP — chop the tree from the left or right side; dodge the branches; don't run out of time.
// =====================================================================================================
A.register('lumber', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 420, 540); c.style.touchAction = 'none';
  let st = 'ready', side = -1, logs = [], score = 0, time = 1, t = 0, chopT = 0, flying = [];
  const newLog = () => { const prev = logs.length ? logs[logs.length-1] : 0; const r = Math.random(); return prev ? 0 : r < .35 ? -1 : r < .7 ? 1 : 0; };
  const reset = () => { logs = [0,0,0]; while (logs.length < 9) logs.push(newLog()); score = 0; time = 1; side = -1; api.score(0); };
  const chop = s => { if (st != 'play') { reset(); st = 'play'; return; } side = s; if (logs[0] == side) return die();
    flying.push({side, t:0, b:logs[0]}); logs.shift(); logs.push(newLog()); chopT = .1; score++; api.score(score); time = Math.min(1, time + .06); A.tone(240 + (score%5)*30, .05, 'square', .04);
    if (logs[0] == side) die(); };
  const die = () => { st = 'over'; A.sfx('over'); stat(api,'lumberBest',score,'max'); api.over(score); };
  const offK = A.keys(e => { if (e.key == 'ArrowLeft' || e.key == 'a') chop(-1); else if (e.key == 'ArrowRight' || e.key == 'd') chop(1); else if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; } });
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h); chop(q.x < w/2 ? -1 : 1); });
  const offL = A.loop(dt => { t += dt; chopT = Math.max(0, chopT - dt);
    if (st == 'play') { time -= dt * (.14 + Math.min(.5, score*.004)); if (time <= 0) die(); }
    for (const f of flying) f.t += dt; flying = flying.filter(f => f.t < .6);
    const sky = g.createLinearGradient(0,0,0,h); sky.addColorStop(0, '#9fd8ff'); sky.addColorStop(1, '#e8f8ff'); g.fillStyle = sky; g.fillRect(0,0,w,h);
    g.fillStyle = '#3fae5a'; for (let i=0;i<6;i++) { g.beginPath(); g.moveTo(i*80-20, h-60); g.lineTo(i*80+20, h-200-(i%2)*40); g.lineTo(i*80+60, h-60); g.fill(); }
    g.fillStyle = '#5a8a3a'; g.fillRect(0, h-60, w, 60);
    const TW = 70, tx = w/2 - TW/2, LH = 56; g.fillStyle = '#8D5B1D'; g.fillRect(tx, 0, TW, h-60);
    logs.forEach((b, i) => { const y = h - 60 - (i+1)*LH; g.fillStyle = i%2 ? '#9a6a2a' : '#8D5B1D'; g.fillRect(tx, y, TW, LH); g.strokeStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.moveTo(tx+10, y+LH*.5); g.lineTo(tx+TW-10, y+LH*.5); g.stroke();
      if (b) { const bx = b < 0 ? tx - 90 : tx + TW; g.fillStyle = '#6b4a2b'; rr(g, bx, y + LH*.3, 90, 16, 6); g.fill(); g.fillStyle = '#3fae5a'; g.beginPath(); g.arc(b < 0 ? bx + 6 : bx + 84, y + LH*.3 + 8, 16, 0, TAU); g.fill(); } });
    for (const f of flying) { const y = h - 60 - LH + f.t*60, x = tx + f.side*-1*f.t*500; g.save(); g.translate(x + TW/2, y + LH/2); g.rotate(f.side*-f.t*6); g.fillStyle = '#9a6a2a'; g.fillRect(-TW/2, -LH/2, TW, LH); g.restore(); }
    // the lumberjack
    const lx = side < 0 ? tx - 40 : tx + TW + 40, ly = h - 60; g.save(); g.translate(lx, ly); g.scale(side < 0 ? 1 : -1, 1);
    g.fillStyle = '#FF4539'; rr(g, -12, -46, 24, 30, 6); g.fill(); g.fillStyle = '#121313'; g.fillRect(-12, -36, 24, 3); g.fillRect(-12, -26, 24, 3);
    g.fillStyle = '#2f5d99'; g.fillRect(-11, -18, 9, 18); g.fillRect(2, -18, 9, 18); g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(0, -56, 10, 0, TAU); g.fill(); g.fillStyle = '#6b4226'; g.beginPath(); g.arc(0, -52, 9, 0, Math.PI); g.fill();
    g.save(); g.translate(12, -36); g.rotate(chopT > 0 ? .3 : -1.1); g.fillStyle = '#8D5B1D'; g.fillRect(0, -3, 34, 5); g.fillStyle = '#c9ccd1'; g.beginPath(); g.moveTo(30, -10); g.lineTo(42, -6); g.lineTo(42, 8); g.lineTo(30, 6); g.fill(); g.restore(); g.restore();
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, w/2-100, 16, 200, 14, 7); g.fill(); g.fillStyle = time > .3 ? C.lime : C.red; rr(g, w/2-100, 16, 200*Math.max(0, time), 14, 7); g.fill();
    g.fillStyle = '#121313'; g.font = '700 30px '+A.font; g.textAlign = 'center'; g.fillText(String(score), w/2, 70);
    if (st == 'ready') A.overlayText(g, w, h, 'LUMBER JUMP', 'Tap left / right (or ← →) to chop · dodge branches');
    if (st == 'over') A.overlayText(g, w, h, 'TIMBER!', score+' logs · tap to chop again'); });
  return () => { offK(); offL(); };
}});
})();
