// Wilderland Arcade · GAMES PACK 2 — Trail Runner, Pine Pinball, Fishing Hole, Beat Hopper, Mossy Leap, Pinecone Rally, Bubble Pop.
// All original. Keyboard + touch, Easy/Normal/Hard via A.D, Workshop upgrades via A.U, Learn mode "answer for a second chance" via A.quiz.
(function(){
const A = window.Arcade, C = A.C, TAU = Math.PI*2;
const rr = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const pt = (c, e, w, h) => { const r = c.getBoundingClientRect(); return {x:(e.clientX-r.left)*w/r.width, y:(e.clientY-r.top)*h/r.height}; };
const low = () => !!A.lowFx;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
// Learn mode: answer a question for a second chance (otherwise run `no`). Returns true while the quiz is open.
const learn2 = (host, api, title, yes, no) => { if (!A.learnOn || !A.learnOn()) { no(); return false; } A.quiz(host, title, ok => { try { api.edu && api.edu(ok); } catch(e){} ok ? yes() : no(); }); return true; };
const keysDown = () => { const k = {}; const d = e => { k[e.key] = true; }, u = e => { k[e.key] = false; }; window.addEventListener('keydown', d); window.addEventListener('keyup', u); return {k, off:() => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); }}; };
const sky = (g, w, h, a, b) => { const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,a); gr.addColorStop(1,b); g.fillStyle = gr; g.fillRect(0,0,w,h); };

// =====================================================================================================
// TRAIL RUNNER — endless forest run. Jump (and double jump) over logs and rocks, duck under branches.
// =====================================================================================================
A.register('runner', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 560, 320); c.style.touchAction = 'none';
  const GROUND = h - 50, GRAV = 1500; let st = 'ready', p, obs, items, speed, dist, score, acorns, lives, t = 0, spawnT = 0, quiz = false, duck = false, hills = [], nextAt = 0, jumpBuf = 0;
  // Fairness: the top speed is capped, and obstacles are spaced by distance so there is always time to land and react.
  const MAXS = () => A.D(380, 430, 480), START = () => A.D(230, 270, 310), JV = () => 560 * (1 + .04*A.U('spring')), AIR = () => 2*JV()/GRAV;
  const REACT = () => A.D(.6, .48, .4);   // seconds of reaction time guaranteed between patterns
  const intensity = () => Math.max(0, Math.floor((dist - 6000) / 4000));   // grows after you've run a while (mostly once top speed is reached)
  for (let i = 0; i < 6; i++) hills.push({x:i*120, h:40 + Math.random()*50});
  const reset = () => { if (__skip) { __skip = false; return; } p = {y:GROUND, vy:0, jumps:0, inv:0}; obs = []; items = []; speed = START(); dist = 0; score = 0; acorns = 0; lives = A.lives(1 + A.U('life')); nextAt = 500; jumpBuf = 0; api.score(0); };
  const jump = () => { if (st != 'play') { if (st != 'quiz') { reset(); st = 'play'; } return; } const maxJ = 2 + (A.U('double') ? 1 : 0); if (p.jumps < maxJ) { p.vy = -JV(); p.jumps++; A.tone(520 + p.jumps*120,.06,'triangle',.04); } else jumpBuf = .15; };   // a press just before landing still counts
  const offK = A.keys(e => { if (e.type != 'keydown') return; if (e.key == ' ' || e.key == 'ArrowUp' || e.key == 'w' || e.key == 'Enter') jump(); if (e.key == 'ArrowDown' || e.key == 's') duck = true; });
  const ku = e => { if (e.key == 'ArrowDown' || e.key == 's') duck = false; }; window.addEventListener('keyup', ku);
  let downY = null; c.addEventListener('pointerdown', e => { downY = pt(c, e, w, h).y; if (pt(c, e, w, h).y > h*.7 && st == 'play') duck = true; else jump(); });
  const pu = () => { duck = false; downY = null; }; c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const hit = () => { if (p.inv > 0 || A.immortal) return; lives--; p.inv = 1.5; A.sfx('bad');
    if (lives <= 0) { st = 'quiz'; quiz = learn2(host, api, 'OOF! ANSWER TO KEEP RUNNING', () => { lives = 1; p.inv = 2; st = 'play'; }, () => { st = 'over'; A.sfx('over'); stat(api,'runnerBest',score,'max'); api.over(score); }); } };
  const offL = A.loop(dt => { A.mood(() => ({danger: st=="play" && lives==1, boss: false})); t += dt; dt = Math.min(dt, .033);
    if (st == 'play') { speed = Math.min(MAXS(), speed + dt * A.D(4,6,8)); dist += speed*dt;
      if (duck && p.y < GROUND) p.vy += 2600*dt;   // ducking in the air drops you fast
      p.vy += GRAV*dt; p.y += p.vy*dt; if (p.y >= GROUND) { p.y = GROUND; p.vy = 0; p.jumps = 0; if (jumpBuf > 0) { jumpBuf = 0; jump(); } } p.inv = Math.max(0, p.inv - dt); jumpBuf = Math.max(0, jumpBuf - dt);
      // patterns appear at the right edge; the next one is at least (air time + reaction time) of running away
      if (dist + w + 20 >= nextAt) { const lvl = intensity(), r = Math.random(), X = w + 20, J = speed*AIR();
        const pats = [['log'], ['rock'], ['branch'], ['bird']];
        if (lvl >= 1 || speed >= MAXS()) pats.push(['log','log2'], ['tall']);
        if (lvl >= 2) pats.push(['log','branchAfter'], ['rock','birdAfter']);
        if (lvl >= 3) pats.push(['branch','branch2'], ['tall','logAfter']);
        const pat = pats[Math.floor(r * pats.length)]; let x = X, extra = 0;
        pat.forEach(k => { const after = k.endsWith('After'), base = k.replace('After','').replace('2',''); if (after) x += J + speed*.3; else if (k.endsWith('2')) x += base == 'log' ? 70 : 90;
          if (base == 'log') obs.push({x, y:GROUND, w:34, h:26, k:'log'});
          else if (base == 'rock') obs.push({x, y:GROUND, w:30, h:38, k:'rock'});
          else if (base == 'tall') obs.push({x, y:GROUND, w:32, h:58, k:'rock'});
          else if (base == 'branch') obs.push({x, y:GROUND-28, w:60, h:18, k:'branch'});
          else if (base == 'bird') obs.push({x, y:GROUND-28, w:30, h:18, k:'bird'});
          extra = x - X; });
        if (Math.random() < .7) for (let i = 0; i < 3; i++) items.push({x:X + 80 + extra + i*28, y:GROUND - 30 - Math.random()*80});
        nextAt = dist + w + 20 + extra + J + speed*REACT() + Math.random()*A.D(320, 260, 200); }
      // forgiving hitboxes: a slimmer runner and obstacles trimmed by 4 px
      const ph = duck && p.y >= GROUND ? 22 : 42, px = 90;
      for (const o of obs) { o.x -= speed*dt; if (o.x + 4 < px + 10 && o.x + o.w - 4 > px - 10 && p.y - ph < o.y - 3 && p.y > o.y - o.h + 4) { o.x = -999; hit(); } }
      for (const it of items) { it.x -= speed*dt; if (Math.abs(it.x - px) < 18 && Math.abs(it.y - (p.y - 22)) < 26 + 6*A.U('magnet')) { it.x = -999; acorns++; A.sfx('coin'); } }
      obs = obs.filter(o => o.x > -80); items = items.filter(it => it.x > -20);
      score = Math.floor(dist/10) + acorns*20; api.score(score); }
    for (const hh of hills) { hh.x -= (st == 'play' ? speed*.3 : 20)*dt; if (hh.x < -120) hh.x += 720; }
    sky(g, w, h, '#9fe0ff', '#e8f8ff'); g.fillStyle = '#7cc46a'; for (const hh of hills) { g.beginPath(); g.moveTo(hh.x-80, GROUND); g.quadraticCurveTo(hh.x, GROUND - hh.h*2, hh.x+80, GROUND); g.fill(); }
    g.fillStyle = '#2f7a4f'; for (let i = 0; i < 8; i++) { const tx = ((i*90 - dist*.6) % 720 + 720) % 720 - 60; g.beginPath(); g.moveTo(tx, GROUND); g.lineTo(tx+20, GROUND-70); g.lineTo(tx+40, GROUND); g.fill(); }
    g.fillStyle = '#8D5B1D'; g.fillRect(0, GROUND, w, h-GROUND); g.fillStyle = '#5a8a3a'; g.fillRect(0, GROUND, w, 8);
    if (obs) for (const o of obs) { if (o.k == 'log') { g.fillStyle = '#7a4a1a'; rr(g, o.x, o.y-o.h, o.w, o.h, 8); g.fill(); g.fillStyle = '#c8964a'; g.beginPath(); g.ellipse(o.x+o.w-4, o.y-o.h/2, 5, o.h/2-2, 0, 0, TAU); g.fill(); }
      else if (o.k == 'rock') { g.fillStyle = '#8a8e94'; g.beginPath(); g.moveTo(o.x, o.y); g.lineTo(o.x+6, o.y-o.h); g.lineTo(o.x+o.w-4, o.y-o.h+8); g.lineTo(o.x+o.w, o.y); g.fill(); }
      else if (o.k == 'branch') { g.fillStyle = '#6b4a2b'; rr(g, o.x, o.y-o.h, o.w, o.h, 6); g.fill(); g.fillStyle = '#3fae5a'; g.beginPath(); g.arc(o.x+o.w-6, o.y-o.h/2, 12, 0, TAU); g.fill(); }
      else { g.fillStyle = '#4a4a5a'; const f = Math.sin(t*16)*6; g.beginPath(); g.moveTo(o.x, o.y-10); g.lineTo(o.x+15, o.y-10-f); g.lineTo(o.x+30, o.y-10); g.lineTo(o.x+15, o.y-4); g.fill(); } }
    if (items) for (const it of items) { g.fillStyle = '#c8742c'; g.beginPath(); g.ellipse(it.x, it.y+3, 7, 8, 0, 0, TAU); g.fill(); g.fillStyle = '#7a4a1a'; g.fillRect(it.x-7, it.y-6, 14, 5); }
    if (p && !(p.inv > 0 && Math.sin(t*25) > 0)) { const px = 90, ph = duck && p.y >= GROUND ? 24 : 44, run = st == 'play' ? Math.sin(t*18) : 0;
      g.fillStyle = '#c8742c'; rr(g, px-14, p.y-ph, 28, ph-8, 10); g.fill(); g.fillStyle = '#fff3e0'; g.beginPath(); g.arc(px+6, p.y-ph+10, 7, 0, TAU); g.fill();
      g.fillStyle = '#121313'; g.beginPath(); g.arc(px+8, p.y-ph+9, 2.2, 0, TAU); g.fill(); g.strokeStyle = '#8D5B1D'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(px-6, p.y-8); g.lineTo(px-6 - run*6, p.y); g.moveTo(px+6, p.y-8); g.lineTo(px+6 + run*6, p.y); g.stroke();
      g.fillStyle = '#c8742c'; g.beginPath(); g.ellipse(px-18, p.y-ph+16, 9, 16, -.6, 0, TAU); g.fill(); }
    g.fillStyle = '#121313'; g.font = '700 17px '+A.font; g.textAlign = 'left'; g.fillText(A.fmt(score)+' · 🌰 '+acorns, 12, 24); g.textAlign = 'right'; g.fillText('❤'.repeat(clamp(lives,0,8)), w-12, 24);
    if (st == 'ready') A.overlayText(g, w, h, 'TRAIL RUNNER', __skip ? 'Saved game · tap or press Space to continue' : 'Space / tap to jump (tap again in the air for a double jump) · ↓ or tap low to duck under branches and birds');
    if (st == 'over') A.overlayText(g, w, h, 'TRIPPED!', A.fmt(score)+' points · tap to run again'); });
  A._dbg = A._dbg || {}; A._dbg.runner = () => ({p, obs, speed, lives, st, dist, max:MAXS(), set:o => { if (o.speed) speed = o.speed; if (o.dist) dist = o.dist; if (o.duck !== undefined) duck = o.duck; }, jump});
  reset(); st = 'ready';
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, p, obs, items, speed, dist, score, acorns, lives, nextAt} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({p, obs, items, speed, dist, score, acorns, lives} = R0); nextAt = R0.nextAt || dist + 600; api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] runner resume failed', e); } } }
  return () => { offK(); offL(); window.removeEventListener('keyup', ku); };
}});

// =====================================================================================================
// PINE PINBALL — flippers, bumpers, drop targets and multiball.
// =====================================================================================================
A.register('pinball', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 420, 620); c.style.touchAction = 'none';
  const K = keysDown(); let st = 'ready', balls, score, ballsLeft, t = 0, quiz = false, lFlip = 0, rFlip = 0, lAng = .5, rAng = .5, lUp = false, rUp = false, targets, mult = 1, multT = 0, plunge = 0, charging = false, lights = 0;
  const BUMP = [{x:140, y:180, r:24, c:'#FF4539'}, {x:280, y:180, r:24, c:'#64CDF5'}, {x:210, y:260, r:24, c:'#F9BF01'}, {x:110, y:330, r:16, c:'#b48cff'}, {x:310, y:330, r:16, c:'#00B451'}];
  // wall segments (x1,y1,x2,y2)
  const WALLS = [[20,620,20,90],[20,90,90,30],[90,30,330,30],[330,30,392,90],[392,90,392,620],[370,620,370,140],[20,470,120,545],[370,470,280,545],[60,400,60,470],[350,400,350,470],[60,470,120,505],[350,470,290,505]];
  const FL = {l:{x:128, y:552, len:62, side:1}, r:{x:282, y:552, len:62, side:-1}};
  const resetTargets = () => { targets = [0,1,2,3].map(i => ({x:150 + i*40, y:100, up:true})); };
  const newBall = () => { balls.push({x:381, y:560, vx:0, vy:0, r:8, inLane:true}); };
  const reset = () => { if (__skip) { __skip = false; return; } balls = []; score = 0; ballsLeft = A.lives(A.D(5,3,3) + A.U('balls')); mult = 1; resetTargets(); newBall(); api.score(0); };
  const add = n => { score += n * mult; api.score(score); };
  const segHit = (b, x1, y1, x2, y2, bounce=0.8, kick=0) => { const dx = x2-x1, dy = y2-y1, L2 = dx*dx+dy*dy; let tt = ((b.x-x1)*dx + (b.y-y1)*dy) / L2; tt = clamp(tt, 0, 1);
    const cx = x1 + tt*dx, cy = y1 + tt*dy, ox = b.x - cx, oy = b.y - cy, d = Math.hypot(ox, oy); if (d < b.r && d > 0) { const nx = ox/d, ny = oy/d, vn = b.vx*nx + b.vy*ny;
      b.x = cx + nx*b.r; b.y = cy + ny*b.r; if (vn < 0) { b.vx -= (1+bounce)*vn*nx; b.vy -= (1+bounce)*vn*ny; } if (kick) { b.vx += nx*kick; b.vy += ny*kick; } return true; } return false; };
  const flipEnd = (f, ang) => { const a = f.side > 0 ? ang : Math.PI - ang; return {x:f.x + Math.cos(a)*f.len*f.side*f.side, y:f.y + Math.sin(a)*f.len}; };
  const flipAng = up => up ? -0.45 : 0.5;   // flipper target angles; the real angle swings there smoothly (no teleporting through the ball)
  const drain = () => { if (balls.length) return; if (A.immortal) { newBall(); return; }
    const out = () => { ballsLeft--; if (ballsLeft <= 0) { st = 'over'; A.sfx('over'); stat(api,'pinballBest',score,'max'); api.over(score); } else { newBall(); A.sfx('bad'); } };
    quiz = learn2(host, api, 'DRAIN! ANSWER FOR A BALL SAVE', () => { quiz = false; newBall(); }, () => { quiz = false; out(); }); };
  const offK = A.keys(e => { if (e.key == ' ' || e.key == 'Enter') { if (st != 'play') { reset(); st = 'play'; } } });
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h); if (st != 'play') { reset(); st = 'play'; return; } if (balls.some(b => b.inLane)) { charging = true; return; } if (q.x < w/2) lUp = true; else rUp = true; });
  const pu = e => { lUp = rUp = false; if (charging) { charging = false; balls.forEach(b => { if (b.inLane) { b.vy = -(500 + plunge*600); b.inLane = false; } }); plunge = 0; } };
  c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const offL = A.loop(dt => { A.mood(() => ({danger: st=="play" && ballsLeft==1, boss: false})); t += dt;
    if (st == 'play' && !quiz) { const L = K.k.ArrowLeft || K.k.a || K.k.z || lUp, R = K.k.ArrowRight || K.k.d || K.k['/'] || rUp; const down = K.k[' '] || K.k.ArrowDown || charging;
      if (down && balls.some(b => b.inLane)) plunge = Math.min(1, plunge + dt*1.2); else if (plunge > 0 && !charging) { balls.forEach(b => { if (b.inLane) { b.vy = -(500 + plunge*600); b.inLane = false; } }); plunge = 0; }
      if (L && !lFlip) A.tone(200,.03,'square',.03); if (R && !rFlip) A.tone(200,.03,'square',.03); lFlip = L ? 1 : 0; rFlip = R ? 1 : 0;
      multT = Math.max(0, multT - dt); if (multT <= 0) mult = 1;
      // small physics steps: the ball never moves more than ~3 px per step, so it can't skip through walls or flippers
      const fdt = Math.min(dt, .033), vmax = Math.max(1, ...balls.map(b => Math.hypot(b.vx, b.vy))), steps = Math.min(40, Math.max(6, Math.ceil(vmax*fdt/3))), sdt = fdt / steps;
      for (let s = 0; s < steps; s++) { const FS = 16; lAng += clamp(flipAng(lFlip) - lAng, -FS*sdt, FS*sdt); rAng += clamp(flipAng(rFlip) - rAng, -FS*sdt, FS*sdt);
      for (const b of balls) { if (b.inLane) { b.x = 381; b.y = 560 + plunge*20; continue; }
        b.vy += 700*sdt; b.x += b.vx*sdt; b.y += b.vy*sdt; const sp = Math.hypot(b.vx, b.vy); if (sp > 1300) { b.vx *= 1300/sp; b.vy *= 1300/sp; }
        { const r0 = b.r; b.r = r0 + 2; WALLS.forEach(W => segHit(b, ...W)); b.r = r0; }   // walls are 4 px thick if (b.y < 140 && b.x > 360) segHit(b, 330, 30, 392, 90, .6);
        for (const B of BUMP) { const dx = b.x - B.x, dy = b.y - B.y, d = Math.hypot(dx, dy); if (d < B.r + b.r) { const nx = dx/d, ny = dy/d; b.x = B.x + nx*(B.r+b.r); b.y = B.y + ny*(B.r+b.r); b.vx = nx*620; b.vy = ny*620; B.hit = .15; add(100); A.tone(700 + Math.random()*300,.05,'square',.04); } }
        for (const T of targets) if (T.up && Math.abs(b.x - T.x) < 16 && Math.abs(b.y - T.y) < 10 + b.r) { T.up = false; b.vy = Math.abs(b.vy) + 50; add(250); A.sfx('coin');
          if (targets.every(q => !q.up)) { resetTargets(); lights++; mult = Math.min(5, mult + 1); multT = 20; add(1000); if (lights % 2 == 0 && balls.length < 3) { balls.push({x:200, y:120, vx:-150, vy:0, r:8, played:true}); A.sfx('win'); } } }
        for (const [f, up, ang] of [[FL.l, lFlip, lAng], [FL.r, rFlip, rAng]]) { const e2 = flipEnd(f, ang), swinging = up && Math.abs(ang - flipAng(1)) > .02, r0 = b.r; b.r = r0 + 5; const hit = segHit(b, f.x, f.y, e2.x, e2.y, .5, swinging ? 420 : 0); b.r = r0; if (hit && swinging) b.vy -= 150; }   // flippers are 12 px thick
        if (b.x < 362) b.played = true;   // it has left the launch lane and is in play
        if (!b.played && b.x > 362 && b.y > 548 && b.vy > 0) { b.inLane = true; b.vx = 0; b.vy = 0; continue; }   // a weak launch rolls back onto the plunger — not a lost ball
        if (b.y > h + 20) b.dead = 1; } }
      balls = balls.filter(b => !b.dead); if (!balls.length) drain(); }
    BUMP.forEach(B => B.hit = Math.max(0, (B.hit||0) - dt));
    sky(g, w, h, '#0d3a2c', '#05150f'); g.strokeStyle = '#D5F367'; g.lineWidth = 4; g.lineCap = 'round'; WALLS.forEach(([a,b2,c2,d]) => { g.beginPath(); g.moveTo(a,b2); g.lineTo(c2,d); g.stroke(); });
    g.fillStyle = 'rgba(213,243,103,.08)'; g.beginPath(); g.moveTo(20,620); g.lineTo(20,90); g.lineTo(90,30); g.lineTo(330,30); g.lineTo(392,90); g.lineTo(392,620); g.fill();
    for (let i = 0; i < 5; i++) { g.fillStyle = i < lights % 6 ? '#F9BF01' : 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(150 + i*30, 420, 6, 0, TAU); g.fill(); }
    for (const B of BUMP) { g.fillStyle = B.hit ? '#fff' : B.c; g.beginPath(); g.arc(B.x, B.y, B.r + (B.hit ? 3 : 0), 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(B.x - B.r*.3, B.y - B.r*.3, B.r*.35, 0, TAU); g.fill(); }
    if (targets) for (const T of targets) { g.fillStyle = T.up ? '#ff8fd0' : 'rgba(255,255,255,.12)'; rr(g, T.x - 14, T.y - 5, 28, 10, 4); g.fill(); }
    for (const [f, ang] of [[FL.l, lAng], [FL.r, rAng]]) { const e2 = flipEnd(f, ang); g.strokeStyle = '#FF8A3C'; g.lineWidth = 12; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(e2.x, e2.y); g.stroke(); }
    g.fillStyle = '#8D5B1D'; g.fillRect(372, 575 + plunge*20, 18, 45);
    if (balls) for (const b of balls) { const gr = g.createRadialGradient(b.x-3, b.y-3, 1, b.x, b.y, b.r); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#9aa5a1'); g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); }
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText(A.fmt(score), 28, 22); g.textAlign = 'right'; g.fillText((mult > 1 ? '×'+mult+'  ' : '')+'Balls '+ballsLeft, 386, 22);
    if (st == 'ready') A.overlayText(g, w, h, 'PINE PINBALL', __skip ? 'Saved game · tap or press Space to continue' : '← → (or tap left/right) flip · hold Space or tap to launch');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', A.fmt(score)+' points · tap to play again'); });
  reset(); st = 'ready';
  A._dbg = A._dbg || {}; A._dbg.pinball = () => ({balls, ballsLeft, st, score});
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, balls, score, ballsLeft, mult, multT, targets, lights} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({balls, score, ballsLeft, mult, multT, targets, lights} = R0); api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] pinball resume failed', e); } } }
  return () => { offK(); offL(); K.off(); };
}});

// FISHING HOLE — endless dive fishing. Drop your hook, steer AROUND fish on the way down (touching one starts the reel-up early),
// then steer INTO fish on the way up. Sell the catch for coins, buy upgrades, dive deeper. No end: past 2,000 m the
// Unknown keeps going layer after layer, each worth double. Five fishing spots, 162 fish for the Fish Book, Pearl Dives.
A.register('fishing', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const W = 960, H = 600, PXM = 4, SURF = 190, el = A.el;
  const fmt = n => { n = Math.max(0, Number(n)||0); if (!isFinite(n)) return '∞'; if (n < 10 && n % 1) return n.toFixed(1); if (n < 1000) return String(Math.floor(n));
    const u = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc']; if (n >= 1e36) return n.toExponential(2).replace('e+','e');
    let i = -1; while (n >= 1000 && i < u.length-1) { n /= 1000; i++; } return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + u[i]; };
  const fin = v => (v = Number(v), v !== v ? 0 : v > Number.MAX_VALUE ? Number.MAX_VALUE : v < -Number.MAX_VALUE ? -Number.MAX_VALUE : v);   // never Infinity   // never lose coins to Infinity
  const wrap = el('div', {position:'relative', width:W+'px', fontFamily:A.font, userSelect:'none'}); host.appendChild(wrap);
  const CV = A.canvas(wrap, W, H), c = CV.c; let g = CV.g; c.style.touchAction = 'none';

  // ---------- the water ----------
  const ZONES = [{d:0,n:'Sunny Shallows'},{d:25,n:'Reed Beds'},{d:60,n:'Deep Water'},{d:120,n:'Twilight Zone'},{d:250,n:'Midnight Zone'},{d:500,n:'The Abyss'},{d:1000,n:'The Trench'},{d:2000,n:'The Unknown'}];
  const zoneOf = d => { let z = 0; for (let i = 0; i < ZONES.length; i++) if (d >= ZONES[i].d) z = i; return z; };
  // 45 deep layers below 2,000 m, each with its own water, scenery and a guardian fish (all spots share them)
  const LAYERS = [
    {d:2e3, n:'The Unknown', c:'#14223e', dec:'none', fish:'The Unknown Thing'}, {d:5e3, n:'Glowing Gardens', c:'#0b3a2c', dec:'glow', fish:'Gardener Glowfish'},
    {d:1e4, n:'Crystal Depths', c:'#16305a', dec:'crystal', fish:'Prism Pike'}, {d:2.5e4, n:'The Bone Yard', c:'#2a2822', dec:'bone', fish:'Bone King Fish'},
    {d:5e4, n:'Lava Cracks', c:'#3a1206', dec:'lava', fish:'Magma Manta Ray'}, {d:1e5, n:'Void Waters', c:'#120a24', dec:'void', fish:'Void Eel'},
    {d:2.5e5, n:'The Dreamsea', c:'#2a1446', dec:'dream', fish:'Dream Whale'}, {d:5e5, n:'Time Rift', c:'#0a2630', dec:'clock', fish:'Clockwork Carp'},
    {d:1e6, n:'Star Sea', c:'#05061c', dec:'stars', fish:'Star Swallower'}, {d:1e7, n:'Cosmic Trench', c:'#160328', dec:'nebula', fish:'Nebula Narwhal'},
    {d:1e8, n:'Rainbow Abyss', c:'#1a0d30', dec:'rainbow', fish:'Rainbow Serpent'}, {d:1e9, n:'The Ancient Deep', c:'#0e1c12', dec:'ruins', fish:'Ancient Coelacanth'},
    {d:1e10, n:'Infinite Ocean', c:'#000a18', dec:'stars', fish:'Infinity Koi'}, {d:1e11, n:'The Bottom of Everything', c:'#1c1a18', dec:'bone', fish:'Bottom Feeder Titan'},
    {d:1e12, n:'The Edge of the World', c:'#20123a', dec:'rainbow', fish:'Edge of the World Leviathan'},
    ...[['The Moon Pool','#101a3a','stars','Moonlight Manta'], ['Candy Current','#3a1030','dream','Gummy Grouper'], ['Thunder Trench','#0c1430','void','Thunder Eel'],
      ['Mirror Lagoon','#1a2e40','crystal','Mirror Marlin'], ['Kelp Kingdom','#0b3020','glow','Kelp King Crab'], ['Dragon Hoard','#3a2008','lava','Treasure Dragon'],
      ['Frozen Time','#14304a','clock','Frostclock Cod'], ['Bubble Galaxy','#120a38','nebula','Bubble Whale'], ['Robot Reef','#1a2228','ruins','Robo Shark'],
      ['The Jungle Below','#0e2a12','glow','Jungle Jaguarfish'], ['The Upside-Down Sea','#2a1030','void','Flipped Flounder'], ['Cloud Ocean','#2a3a5a','dream','Cloud Carp'],
      ['Pirate Graveyard','#1e1a14','bone','Ghost Pirate Pike'], ['Gem Mines','#1a1440','crystal','Diamond Dorado'], ['Sunken Castle','#202838','ruins','Knight Fish'],
      ['Volcano Heart','#400c04','lava','Phoenix Fish'], ['Rainbow Falls','#241040','rainbow','Prism Dolphin'], ['Clockwork City','#1a2a2a','clock','Gearfin Tuna'],
      ['Dino Deep','#1e2a10','bone','Sea Rex'], ['Aurora Waters','#0a2a30','nebula','Aurora Angelfish'], ['The Echo Chamber','#14142a','void','Echo Orca'],
      ['Starfish Galaxy','#06061e','stars','Galaxy Starfish'], ['Glass Ocean','#18384a','crystal','Glass Gar'], ['Garden of Giants','#0a3018','glow','Giant Lily Ray'],
      ['Shadow Realm','#0a0610','void','Shadow Leviathan'], ['Golden Kingdom','#3a2e08','rainbow','Golden Emperor Fish'], ['Dreamer’s Deep','#2a0a3a','dream','Sleepy Sunfish'],
      ['The Big Bang','#1a0420','nebula','Big Bang Barracuda'], ['Ocean of Everything','#101010','stars','Everything Eel'], ['The True Bottom','#2a1a10','rainbow','The Final Fish']]
      .map(([n, c, dec, fish], i) => ({d:Math.pow(10, 15 + 10*i), n, c, dec, fish}))];
  const layerIdx = d => { let k = -1; for (let i = 0; i < LAYERS.length; i++) if (d >= LAYERS[i].d) k = i; return k; };
  // where you are in the deep layers as a smooth number: 0 above 2,000 m, then 1, 2, 3 … (45.3 at the very bottom)
  const layerLg = j => j < LAYERS.length ? Math.log10(LAYERS[j].d) : Math.log10(LAYERS[LAYERS.length - 1].d) + 10*(j - LAYERS.length + 1);   // log10 of each layer's top (past the last one: every ×1e10)
  const layerPos = d => { if (!(d >= 2000)) return 0; const i = layerIdx(d), a = layerLg(i), b = layerLg(i + 1); return 1 + i + Math.max(0, Math.min(1, (Math.log10(Math.min(d, Number.MAX_VALUE)) - a) / (b - a))); };
  const layerOf = d => Math.floor(layerPos(d));
  const zoneName = d => d >= 2000 ? LAYERS[layerIdx(d)].n : ZONES[zoneOf(d)].n;
  const LOCS = [
    {k:'lake', n:'Wilder Lake', cost:0, mult:1, sky:['#ffd9a0','#ffb380'], sea:'#3aa0c8', land:'#5a8a3a', fish:[
      'minnow:Minnow|perch:Yellow Perch|sunfish:Sunfish|trout:Rainbow Trout', 'bluegill:Bluegill|bass:Bass|catfish:Catfish|pike:Northern Pike',
      'walleye:Walleye|salmon:Salmon|muskie:Muskie|sturgeon:Sturgeon', 'lmin:Lantern Minnow|gcarp:Ghost Carp|gleel:Glow Eel|koi:Golden Koi',
      'gulper:Gulper Eel|moonp:Moon Perch|shpike:Shadow Pike|serpent:Lake Serpent', 'bonef:Bone Fish|ccarp:Crystal Carp|acat:Abyss Catfish|gar:Ancient Gar',
      'fossil:Fossil Fish|drift:Deep Drifter|ssturg:Stone Sturgeon|legend:The Lake Legend', 'echo:Echo Fish|dtrout:Dream Trout|skoi:Starry Koi|lspirit:Lake Spirit']},
    {k:'isle', n:'Frosty Isle', cost:2e4, mult:6, sky:['#e9f6ff','#a9d8f5'], sea:'#5fb8d8', land:'#f4fbff', snow:true, fish:[
      'Ice Minnow|Snow Smelt|Frost Perch|Arctic Char', 'Polar Cod|Icicle Eel|Snowflake Ray|Glacier Trout', 'Blue Halibut|Frozen Pike|Aurora Salmon|Mammoth Sturgeon',
      'Shiver Squid|Ice Lanternfish|Frostfang Barracuda|Snow Queen Koi', 'Yeti Grouper|Blizzard Eel|Ice Dragonet|Narwhal', 'Frozen Coelacanth|Permafrost Pike|Hailstone Puffer|Ice Wyrm',
      'Glacier Ghost|Crystal Kraken|Northern Lights Ray|Frost Titan', 'Snowdream Fish|Comet Char|Aurora Whale|Spirit of Winter']},
    {k:'coast', n:'Coral Coast', cost:2e6, mult:40, sky:['#bff0ff','#7fd6f0'], sea:'#1fb5c8', land:'#f2d9a0', fish:[
      'Clownfish|Sergeant Major|Blue Tang|Parrotfish', 'Butterflyfish|Angelfish|Seahorse|Lionfish', 'Grouper|Moray Eel|Sea Turtle|Swordfish',
      'Hatchetfish|Lanternfish|Vampire Squid|Oarfish', 'Anglerfish|Viperfish|Gulper Shark|Giant Squid', 'Abyss Octopus|Glass Squid|Goblin Shark|Coral Dragon',
      'Trench Snailfish|Barreleye|Megamouth|Sea King', 'Pearl Ray|Rainbow Leviathan|Star Turtle|Heart of the Reef']},
    {k:'vent', n:'Lava Vents', cost:4e8, mult:300, sky:['#ffb38a','#d0603a'], sea:'#c8643a', land:'#3a2a2a', ember:true, fish:[
      'Ember Minnow|Ash Guppy|Cinder Perch|Magma Trout', 'Smoke Eel|Pumice Puffer|Flame Ray|Lava Bass', 'Sulfur Shrimp|Obsidian Pike|Scorch Salmon|Basalt Sturgeon',
      'Vent Crab|Glowcoal Fish|Furnace Eel|Phoenix Koi', 'Smoker Squid|Iron Gulper|Molten Grouper|Fire Serpent', 'Volcano Shark|Lava Glass Eel|Thunder Ray|Magma Dragon',
      'Core Crawler|Plasma Snapper|Blaze Ray|Lava Leviathan', 'Sunstone Fish|Inferno Koi|Star Forge Whale|Heart of the Volcano']},
    {k:'star', n:'Starlight Sea', cost:1.5e11, mult:2500, sky:['#2a2060','#120a30'], sea:'#4a3ab8', land:'#2a2a50', stars:true, fish:[
      'Star Minnow|Moon Guppy|Comet Perch|Nebula Trout', 'Meteor Eel|Galaxy Ray|Orbit Fish|Saturn Bass', 'Quasar Pike|Cosmic Salmon|Rocket Swordfish|Planet Sturgeon',
      'Void Lantern|Wormhole Eel|Pulsar Squid|Supernova Koi', 'Black Hole Gulper|Eclipse Shark|Starlight Serpent|Celestial Narwhal', 'Dark Matter Fish|Time Trout|Gravity Ray|Cosmic Dragon',
      'Quantum Kraken|Infinity Eel|Big Bang Bass|Galaxy Whale', 'Dream Fish|The Starfish King|Universe Koi|The First Fish']},
    {k:'fwish', n:'Fwish Zone', cost:0, needAll:true, mult:2e4, sky:['#ffd1f7','#b8e8ff'], sea:'#7a5cff', land:'#ff9ad5', stars:true, fish:[
      'Fwish Minnow|Blub Guppy|Wobble Perch|Fwishy Trout', 'Bloop Eel|Squish Ray|Gloop Bass|Wiggle Pike', 'Fwump Salmon|Blorp Sturgeon|Splish Swordfish|Splosh Grouper',
      'Glimmer Fwish|Twinkle Squid|Dazzle Eel|Fwish Koi', 'Mega Bloop|Fwish Shark|Ultra Wiggle|Fwish Serpent', 'Hyper Fwish|Fwish Octopus|Fwish Turtle|Fwish Dragon',
      'Giga Fwish|Fwish Whale|Fwish Kraken|Fwish Leviathan', 'Omega Fwish|Fwish King|Fwish Narwhal|The Almost-Biggest Fish']}];
  const RN = ['Common','Uncommon','Rare','Epic','Legendary','Mythic','Godly','DANG','OH DANG!!!!','FISH!!','Ancient','Celestial','Cosmic','Eternal','BIRD!!','Secret'], RC = ['#c9ccd1','#7fe08a','#64CDF5','#E9B9F7','#F9BF01','#ff6ad5','#7df9ff','#ff3b3b','#ff7bff','#ffffff','#d89a5a','#9fe8ff','#b48cff','#ffd1f7','#ffffff','#ff9a3c'];
  const mixR = f => f.r >= 10 ? 5 : f.r;   // the newer rarities count as Mythic for the bait mix
  const hue = s => { let h = 7; for (const ch of s) h = (h*31 + ch.charCodeAt(0)) % 360; return h; };
  // ---------- fish art: every species gets a body shape from what it is (eel, ray, shark, squid, puffer, whale, anglerfish,
  // crab, seahorse, turtle, dragon …), its own colors and a pattern. Real fish use their real colors. ----------
  const rnd = (n, k) => (hue(n + '#' + k) % 1000) / 1000;
  const REAL = { // h, s, l, pattern, h2 (accent)
    'Minnow':[200,12,72,'lines',210], 'Yellow Perch':[50,85,55,'stripes',120], 'Sunfish':[28,85,56,'spots',200], 'Rainbow Trout':[95,28,58,'trout',330],
    'Bluegill':[215,50,48,'stripes',30], 'Bass':[95,45,40,'lines',100], 'Catfish':[30,20,42,'belly',30], 'Northern Pike':[100,40,40,'spots',60],
    'Walleye':[45,50,52,'stripes',45], 'Salmon':[8,58,62,'spots',200], 'Muskie':[80,30,46,'stripes',80], 'Sturgeon':[210,10,46,'plates',210], 'Golden Koi':[40,95,55,'koi',0],
    'Clownfish':[25,100,55,'bands',0], 'Sergeant Major':[55,85,62,'stripes',0], 'Blue Tang':[215,85,50,'tang',52], 'Parrotfish':[170,70,50,'lines',330],
    'Butterflyfish':[55,92,60,'eyeband',0], 'Angelfish':[45,30,80,'stripes',45], 'Lionfish':[10,70,55,'stripes',0], 'Grouper':[30,35,40,'spots',30],
    'Moray Eel':[90,50,34,'spots',60], 'Swordfish':[220,40,45,'belly',220], 'Arctic Char':[15,70,55,'spots',40], 'Polar Cod':[200,15,60,'spots',200],
    'Blue Halibut':[205,45,45,'spots',200], 'Narwhal':[200,10,62,'spots',200], 'Sea Turtle':[95,45,38,'plain',35], 'Seahorse':[35,85,58,'plain',20],
    'Giant Squid':[5,60,52,'spots',5], 'Anglerfish':[260,25,25,'plain',55], 'Goblin Shark':[350,40,72,'belly',350], 'Lanternfish':[210,40,30,'dots',190] };
  const mkLook = (n, z, i) => { const N = n.toLowerCase(), has = (...w) => w.some(x => N.includes(x)), R = REAL[n];
    let shape = 'fish';
    if (has('dragon', 'serpent', 'wyrm', 'leviathan')) shape = 'dragon'; else if (has('eel')) shape = 'eel';
    else if (/(^| )ray$/.test(N) || has(' ray ')) shape = 'ray'; else if (has('shark', 'megamouth', 'megalodon')) shape = 'shark';
    else if (has('squid', 'kraken')) shape = 'squid'; else if (has('octopus')) shape = 'octo'; else if (has('puffer')) shape = 'puffer';
    else if (has('seahorse')) shape = 'seahorse'; else if (has('turtle')) shape = 'turtle'; else if (has('whale', 'narwhal')) shape = 'whale';
    else if (has('angler', 'viperfish', 'gulper', 'hatchet', 'snailfish', 'barreleye', 'lantern')) shape = 'angler';
    else if (has('crab', 'crawler')) shape = 'crab'; else if (has('shrimp')) shape = 'shrimp'; else if (has('starfish')) shape = 'star';
    else if (has('sword', 'barracuda', 'gar', 'pike', 'muskie', 'oarfish', 'snapper', 'rocket')) shape = 'sword';
    else if (has('halibut', 'flounder')) shape = 'flat'; else if (has('koi', 'carp')) shape = 'koi';
    else if (has('catfish', 'cod', 'grouper', 'sturgeon', 'bass', 'coelacanth', 'titan', 'king')) shape = 'big';
    else if (has('bone', 'fossil')) shape = 'bone'; else if (has('ghost', 'spirit', 'dream', 'echo', 'heart of')) shape = 'ghost';
    else if (has('crystal', 'glass', 'ice ', 'icicle', 'quantum', 'void', 'dark matter')) shape = 'crystal';
    else if (has('clown', 'tang', 'angel', 'butterfly', 'sunfish', 'bluegill', 'perch', 'sergeant', 'parrot', 'lion', 'moon')) shape = 'tall';
    const h = R ? R[0] : hue(n), sat = R ? R[1] : 55 + Math.round(rnd(n, 's')*35), li = R ? R[2] : 45 + Math.round(rnd(n, 'l')*20) + (z >= 5 ? 6 : 0);
    const h2 = R ? R[4] : (h + [180, 40, 320, 150, 90][Math.floor(rnd(n, 'h2')*5)]) % 360;
    const pat = R ? R[3] : ['plain', 'stripes', 'spots', 'lines', 'belly', 'dots', 'bands'][Math.floor(rnd(n, 'p')*7)];
    return {shape, pat, col:'hsl(' + h + ',' + sat + '%,' + li + '%)', dark:'hsl(' + h + ',' + sat + '%,' + Math.max(12, li - 22) + '%)', belly:'hsl(' + h + ',' + Math.max(10, sat - 25) + '%,' + Math.min(92, li + 25) + '%)',
      acc:'hsl(' + h2 + ',' + Math.min(100, sat + 15) + '%,' + (R ? 50 : 58) + '%)', tail:['fork', 'round', 'moon', 'fan'][shape == 'koi' ? 3 : Math.floor(rnd(n, 't')*3)],
      asp:.42 + rnd(n, 'a')*.2, glow:z >= 3, tusk:has('narwhal', 'sword', 'unicorn'), whisk:has('catfish', 'sturgeon', 'dragon', 'coelacanth'), crown:has('king', 'queen', 'crown', 'god', 'guardian'), spikes:has('lion', 'puffer', 'hailstone', 'dragon', 'wyrm') }; };
  const golden = {col:'#FFD700', dark:'#b8860b', belly:'#fff3a0', acc:'#fff8d0'};
  // body path for fish-like shapes (nose at +s, tail base at -0.8s)
  const bodyPath = (s, H) => { g.beginPath(); g.moveTo(s, 0); g.bezierCurveTo(s*.6, -H*1.3, -s*.45, -H*1.1, -s*.82, -H*.2); g.lineTo(-s*.82, H*.2); g.bezierCurveTo(-s*.45, H*1.1, s*.6, H*1.3, s, 0); g.closePath(); };
  const tailPath = (s, H, kind, wag) => { g.save(); g.translate(-s*.78, 0); g.rotate(wag); g.beginPath();
    if (kind == 'fork') { g.moveTo(0, 0); g.lineTo(-s*.55, -H*1.05); g.lineTo(-s*.32, 0); g.lineTo(-s*.55, H*1.05); }
    else if (kind == 'round') { g.moveTo(0, -H*.2); g.quadraticCurveTo(-s*.7, -H*1.1, -s*.55, 0); g.quadraticCurveTo(-s*.7, H*1.1, 0, H*.2); }
    else if (kind == 'moon') { g.moveTo(0, 0); g.quadraticCurveTo(-s*.2, -H*.6, -s*.5, -H*1.25); g.quadraticCurveTo(-s*.3, 0, -s*.5, H*1.25); g.quadraticCurveTo(-s*.2, H*.6, 0, 0); }
    else { g.moveTo(0, 0); g.bezierCurveTo(-s*.5, -H*1.6, -s*1.1, -H*.8, -s*.9, -H*.1); g.bezierCurveTo(-s*1.1, H*.8, -s*.5, H*1.6, 0, 0); }
    g.closePath(); g.fill(); g.restore(); };
  const eye = (x, y, r, big) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(x + r*.25, y, r*(big ? .62 : .5), 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x + r*.4, y - r*.3, r*.2, 0, TAU); g.fill(); };
  const pattern = (L, C, s, H, nm) => { const p = L.pat; g.save(); g.clip();
    if (p == 'stripes') { g.fillStyle = C.dark; g.globalAlpha = .55; for (let k = -2; k <= 2; k++) g.fillRect(k*s*.32 - s*.06, -H*1.4, s*.12, H*2.8); }
    else if (p == 'bands') { for (const bx of [s*.45, -s*.05, -s*.6]) { g.fillStyle = '#121313'; g.fillRect(bx - s*.11, -H*1.4, s*.22, H*2.8); g.fillStyle = '#fff'; g.fillRect(bx - s*.07, -H*1.4, s*.14, H*2.8); } }
    else if (p == 'spots' || p == 'koi' || p == 'trout') { g.fillStyle = p == 'koi' ? '#fff' : C.dark; g.globalAlpha = p == 'koi' ? .9 : .6; for (let k = 0; k < (p == 'koi' ? 4 : 9); k++) { const a = rnd(nm, 'x' + k), b = rnd(nm, 'y' + k); g.beginPath(); g.arc((a - .45)*s*1.6, (b - .5)*H*1.6, p == 'koi' ? s*.22 : Math.max(1, s*.07), 0, TAU); g.fill(); }
      if (p == 'koi') { g.fillStyle = '#ff5a1f'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc((rnd(nm, 'k' + k) - .4)*s*1.4, (rnd(nm, 'j' + k) - .6)*H, s*.2, 0, TAU); g.fill(); } }
      if (p == 'trout') { g.globalAlpha = .7; g.fillStyle = 'hsl(330,70%,62%)'; g.fillRect(-s, -H*.12, s*2, H*.3); } }
    else if (p == 'lines') { g.fillStyle = C.acc; g.globalAlpha = .75; g.fillRect(-s, -H*.1, s*2, H*.22); g.globalAlpha = .4; g.fillRect(-s, -H*.55, s*2, H*.12); }
    else if (p == 'dots') { g.fillStyle = C.acc; for (let k = 0; k < 6; k++) { g.globalAlpha = .6 + .4*Math.sin(t*4 + k); g.beginPath(); g.arc(s*.5 - k*s*.26, H*.55, Math.max(1, s*.06), 0, TAU); g.fill(); } }
    else if (p == 'eyeband') { g.fillStyle = '#121313'; g.fillRect(s*.38, -H*1.4, s*.16, H*2.8); g.fillStyle = C.dark; g.beginPath(); g.arc(-s*.45, -H*.2, s*.14, 0, TAU); g.fill(); }
    else if (p == 'plates') { g.fillStyle = C.belly; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(s*.5 - k*s*.25, -H*.75); g.lineTo(s*.4 - k*s*.25, -H*.5); g.lineTo(s*.6 - k*s*.25, -H*.5); g.fill(); } }
    if (p != 'bands' && p != 'koi') { g.globalAlpha = .55; g.fillStyle = C.belly; g.beginPath(); g.ellipse(s*.05, H*.75, s*.85, H*.55, 0, 0, TAU); g.fill(); }
    g.globalAlpha = .25; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(s*.15, -H*.45, s*.5, H*.18, -.1, 0, TAU); g.fill(); g.restore(); };
  // draw one creature facing right at (0,0); s = half its length
  const drawLook = (f, s, ph, gold, simple) => { const L = f.look, C = gold ? golden : L, wag = Math.sin(t*8 + ph)*.22, sw = Math.sin(t*5 + ph);
    g.lineJoin = 'round'; g.lineCap = 'round';
    switch (L.shape) {
      case 'eel': case 'dragon': { const segs = 12, len = s*2.6, wd = s*.32; const pts = []; for (let k = 0; k <= segs; k++) { const x = s - k*len/segs; pts.push([x, Math.sin(k*.7 - t*6 + ph)*s*.18*(k/segs + .2)]); }
        g.strokeStyle = C.col; for (let k = 0; k < segs; k++) { g.lineWidth = wd*2*(1 - k/segs*.75); g.beginPath(); g.moveTo(...pts[k]); g.lineTo(...pts[k+1]); g.stroke(); }
        g.strokeStyle = C.acc; g.lineWidth = Math.max(1, wd*.35); g.beginPath(); pts.slice(1).forEach((p2, k) => { const yy = p2[1] - wd*(1 - k/segs*.75); k ? g.lineTo(p2[0], yy) : g.moveTo(p2[0], yy); }); g.stroke();
        if (L.shape == 'dragon') { g.fillStyle = C.acc; for (let k = 2; k < segs - 1; k += 2) { const [x, y] = pts[k], w2 = wd*(1 - k/segs*.75); g.beginPath(); g.moveTo(x - 3, y - w2); g.lineTo(x, y - w2 - s*.22); g.lineTo(x + 3, y - w2); g.fill(); }
          g.strokeStyle = C.acc; g.lineWidth = 2; g.beginPath(); g.moveTo(s*.7, -wd*.8); g.lineTo(s*.45, -wd*2); g.moveTo(s*.55, -wd*.8); g.lineTo(s*.25, -wd*1.8); g.stroke(); }
        g.fillStyle = C.col; g.beginPath(); g.ellipse(s*.95, pts[0][1], wd*1.3, wd*1.05, 0, 0, TAU); g.fill(); eye(s*1.05, pts[0][1] - wd*.3, Math.max(2, wd*.42), L.shape == 'dragon');
        if (L.whisk) { g.strokeStyle = C.belly; g.lineWidth = 1.2; g.beginPath(); g.moveTo(s*1.2, pts[0][1] + wd*.3); g.quadraticCurveTo(s*1.5, pts[0][1] + wd + sw*3, s*1.35, pts[0][1] + wd*2); g.stroke(); }
        break; }
      case 'ray': { const fl = .75 + .25*Math.sin(t*4 + ph); g.fillStyle = C.col; g.beginPath(); g.moveTo(s*.75, 0); g.quadraticCurveTo(s*.2, -s*1.15*fl, -s*.55, 0); g.quadraticCurveTo(s*.2, s*1.15*fl, s*.75, 0); g.fill();
        g.save(); g.beginPath(); g.moveTo(s*.75, 0); g.quadraticCurveTo(s*.2, -s*1.15*fl, -s*.55, 0); g.quadraticCurveTo(s*.2, s*1.15*fl, s*.75, 0); g.clip(); g.fillStyle = C.acc; g.globalAlpha = .6;
        for (let k = 0; k < 7; k++) { g.beginPath(); g.arc((rnd(f.n, 'r' + k) - .4)*s, (rnd(f.n, 'q' + k) - .5)*s*1.4*fl, Math.max(1.2, s*.08), 0, TAU); g.fill(); } g.restore();
        g.strokeStyle = C.dark; g.lineWidth = Math.max(1, s*.07); g.beginPath(); g.moveTo(-s*.5, 0); g.quadraticCurveTo(-s*1.2, sw*s*.25, -s*1.9, sw*s*.1); g.stroke(); eye(s*.4, -s*.12, Math.max(1.6, s*.1)); eye(s*.4, s*.12, Math.max(1.6, s*.1)); break; }
      case 'squid': { g.strokeStyle = C.col; g.lineWidth = Math.max(1.5, s*.1); for (let k = 0; k < 6; k++) { const yy = (k - 2.5)*s*.11; g.beginPath(); g.moveTo(-s*.3, yy); g.quadraticCurveTo(-s*.9, yy + Math.sin(t*6 + k + ph)*s*.25, -s*1.5 - (k % 2)*s*.2, yy*1.6 + Math.sin(t*5 + k)*s*.15); g.stroke(); }
        g.fillStyle = C.col; g.beginPath(); g.moveTo(s*1.05, 0); g.quadraticCurveTo(s*.6, -s*.42, -s*.35, -s*.3); g.lineTo(-s*.35, s*.3); g.quadraticCurveTo(s*.6, s*.42, s*1.05, 0); g.fill();
        g.fillStyle = C.dark; g.beginPath(); g.moveTo(s*1.05, 0); g.lineTo(s*.6, -s*.5); g.lineTo(s*.55, 0); g.lineTo(s*.6, s*.5); g.fill(); g.fillStyle = C.acc; g.globalAlpha = .6; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(s*.6 - k*s*.2, (k % 2 ? 1 : -1)*s*.1, s*.05, 0, TAU); g.fill(); } g.globalAlpha = 1;
        eye(-s*.15, -s*.05, Math.max(2.5, s*.2), true); break; }
      case 'octo': { g.strokeStyle = C.col; g.lineWidth = Math.max(2, s*.14); for (let k = 0; k < 8; k++) { const a = Math.PI*.55 + k*.28; g.beginPath(); g.moveTo(Math.cos(a)*s*.3, s*.15); g.quadraticCurveTo(Math.cos(a)*s*.9 + sw*4, s*.7, Math.cos(a + .3 + Math.sin(t*4 + k)*.4)*s*1.1, s*1.1); g.stroke(); }
        g.fillStyle = C.col; g.beginPath(); g.ellipse(0, -s*.2, s*.62, s*.55, 0, 0, TAU); g.fill(); g.fillStyle = C.acc; g.globalAlpha = .5; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc((rnd(f.n, 'o' + k) - .5)*s, -s*.45 + rnd(f.n, 'p' + k)*s*.3, s*.07, 0, TAU); g.fill(); } g.globalAlpha = 1;
        eye(s*.25, -s*.15, Math.max(2, s*.15), true); eye(-s*.1, -s*.15, Math.max(2, s*.13), true); break; }
      case 'puffer': { const R = s*.72*(1 + .06*Math.sin(t*3 + ph)); g.strokeStyle = C.dark; g.lineWidth = Math.max(1, s*.06); for (let k = 0; k < 14; k++) { const a = k/14*TAU; g.beginPath(); g.moveTo(Math.cos(a)*R, Math.sin(a)*R); g.lineTo(Math.cos(a)*(R + s*.22), Math.sin(a)*(R + s*.22)); g.stroke(); }
        g.fillStyle = C.col; tailPath(s*.55, s*.4, 'round', wag); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); g.fillStyle = C.belly; g.beginPath(); g.ellipse(0, R*.35, R*.75, R*.5, 0, 0, TAU); g.fill();
        g.fillStyle = C.dark; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc((rnd(f.n, 'u' + k) - .5)*R*1.2, (rnd(f.n, 'v' + k) - .8)*R*.8, s*.06, 0, TAU); g.fill(); } eye(R*.45, -R*.2, Math.max(2.5, s*.2), true); break; }
      case 'seahorse': { g.strokeStyle = C.col; g.lineWidth = Math.max(3, s*.38); g.beginPath(); g.moveTo(s*.15, -s*.85); g.bezierCurveTo(-s*.45, -s*.4, s*.35, s*.15, -s*.05, s*.6); g.quadraticCurveTo(-s*.4, s*1.05, -s*.1, s*1.05 + sw*2); g.stroke();
        g.fillStyle = C.col; g.beginPath(); g.ellipse(s*.2, -s*.95, s*.28, s*.22, 0, 0, TAU); g.fill(); g.fillRect(s*.3, -s*1.02, s*.45, s*.13); g.fillStyle = C.acc; g.beginPath(); g.moveTo(-s*.15, -s*.4); g.lineTo(-s*.5, -s*.25 + sw*2); g.lineTo(-s*.15, -s*.1); g.fill();
        eye(s*.22, -s*1, Math.max(1.6, s*.12)); break; }
      case 'turtle': { g.fillStyle = C.belly; const fl = Math.sin(t*4 + ph)*.5; for (const [x, y, sg] of [[s*.5, -s*.45, -1], [s*.5, s*.45, 1], [-s*.55, s*.4, 1], [-s*.55, -s*.4, -1]]) { g.save(); g.translate(x, y); g.rotate(sg*(.5 + fl*.6)); g.beginPath(); g.ellipse(s*.15, 0, s*.38, s*.12, 0, 0, TAU); g.fill(); g.restore(); }
        g.beginPath(); g.ellipse(s*.95, 0, s*.28, s*.2, 0, 0, TAU); g.fill(); eye(s*1.05, -s*.06, Math.max(1.6, s*.09));
        g.fillStyle = C.col; g.beginPath(); g.ellipse(0, 0, s*.8, s*.6, 0, 0, TAU); g.fill(); g.strokeStyle = C.dark; g.lineWidth = Math.max(1, s*.06);
        for (const [x, y] of [[0, 0], [s*.42, -s*.2], [s*.42, s*.2], [-s*.42, -s*.2], [-s*.42, s*.2]]) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = k/6*TAU; g.lineTo(x + Math.cos(a)*s*.2, y + Math.sin(a)*s*.2); } g.closePath(); g.stroke(); } break; }
      case 'whale': { const H = s*.5, fw = Math.sin(t*3 + ph)*.25; g.fillStyle = C.col;
        // tail stock + horizontal flukes (a whale's tail goes up and down, not side to side)
        g.save(); g.translate(-s*.8, -H*.1); g.rotate(fw); g.beginPath(); g.moveTo(s*.1, -H*.3); g.quadraticCurveTo(-s*.25, -H*.25, -s*.4, -H*.05); g.lineTo(-s*.4, H*.05); g.quadraticCurveTo(-s*.25, H*.2, s*.1, H*.3); g.fill();
        g.beginPath(); g.ellipse(-s*.48, 0, s*.18, H*.55, 0, 0, TAU); g.fill(); g.restore();
        g.beginPath(); g.moveTo(s*1.05, H*.1); g.bezierCurveTo(s*1.05, -H*1.25, s*.1, -H*1.15, -s*.8, -H*.3); g.lineTo(-s*.8, H*.2); g.bezierCurveTo(-s*.2, H*1.05, s*.95, H*1.1, s*1.05, H*.1); g.fill();
        g.save(); g.clip(); g.fillStyle = C.belly; g.beginPath(); g.ellipse(s*.2, H*1.05, s*.95, H*.62, 0, 0, TAU); g.fill(); g.strokeStyle = C.dark; g.globalAlpha = .35; g.lineWidth = 1; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(s*.95, H*.5 + k*H*.1); g.lineTo(s*.1, H*.55 + k*H*.1); g.stroke(); }
        g.globalAlpha = .5; g.fillStyle = C.acc; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc((rnd(f.n, 'w' + k) - .3)*s*1.2, (rnd(f.n, 'z' + k) - .9)*H*.7, s*.05, 0, TAU); g.fill(); } g.restore();
        g.strokeStyle = C.dark; g.lineWidth = Math.max(1, s*.04); g.beginPath(); g.moveTo(s*1.03, H*.25); g.quadraticCurveTo(s*.7, H*.45, s*.45, H*.3); g.stroke();
        g.fillStyle = C.dark; g.save(); g.translate(s*.3, H*.55); g.rotate(.6 + fw*.6); g.beginPath(); g.ellipse(-s*.15, 0, s*.28, H*.13, 0, 0, TAU); g.fill(); g.restore();
        g.beginPath(); g.moveTo(-s*.15, -H*.95); g.lineTo(-s*.3, -H*1.25); g.lineTo(-s*.4, -H*.85); g.fill();
        eye(s*.55, H*.1, Math.max(1.6, s*.07));
        if (L.tusk) { g.strokeStyle = '#f3efe0'; g.lineWidth = Math.max(1.5, s*.06); g.beginPath(); g.moveTo(s*1.0, -H*.1); g.lineTo(s*1.95, -H*.45); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; for (let k = 1; k < 6; k++) { const x = s*1.0 + k*s*.16, y = -H*.1 - k*H*.06; g.beginPath(); g.moveTo(x - 2, y - 2); g.lineTo(x + 2, y + 2); g.stroke(); } }
        if (!simple) { g.fillStyle = 'rgba(255,255,255,.5)'; const bt = (t*1.2 + ph) % 2; g.beginPath(); g.arc(s*.55, -H*1.15 - bt*s*.3, 1.5 + bt, 0, TAU); g.fill(); } break; }
      case 'angler': { const R = s*.68; g.fillStyle = C.col; tailPath(s*.7, R*.6, 'round', wag); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
        g.fillStyle = '#1a0a10'; g.beginPath(); g.moveTo(R*1.02, -R*.05); g.quadraticCurveTo(R*.3, R*.35, R*.95, R*.6); g.closePath(); g.fill(); g.fillStyle = '#fff';
        for (let k = 0; k < 4; k++) { const x = R*.98 - k*R*.18; g.beginPath(); g.moveTo(x, -R*.02 + k*R*.08); g.lineTo(x - R*.06, R*.14 + k*R*.08); g.lineTo(x - R*.12, -R*.0 + k*R*.08); g.fill(); }
        g.strokeStyle = C.dark; g.lineWidth = Math.max(1, s*.05); g.beginPath(); g.moveTo(R*.1, -R*.95); g.quadraticCurveTo(R*.8, -R*1.8, R*1.3, -R*1.1 + sw*2); g.stroke();
        if (!simple) { g.shadowColor = C.acc; g.shadowBlur = 14; } g.fillStyle = C.acc; g.globalAlpha = .7 + .3*Math.sin(t*5 + ph); g.beginPath(); g.arc(R*1.3, -R*1.1 + sw*2, Math.max(2, s*.13), 0, TAU); g.fill(); g.globalAlpha = 1; g.shadowBlur = 0;
        eye(R*.4, -R*.35, Math.max(2, s*.13), true); break; }
      case 'crab': { g.strokeStyle = C.dark; g.lineWidth = Math.max(1.5, s*.08); for (let k = 0; k < 3; k++) for (const sg of [-1, 1]) { const x = (k - 1)*s*.35; g.beginPath(); g.moveTo(x, s*.15); g.lineTo(x + sg*s*.15 + Math.sin(t*10 + k)*2, s*.5); g.lineTo(x + sg*s*.3, s*.75); g.stroke(); }
        g.fillStyle = C.col; g.beginPath(); g.ellipse(0, 0, s*.7, s*.42, 0, Math.PI, TAU); g.quadraticCurveTo(0, s*.4, -s*.7, 0); g.fill();
        for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(sg*s*.85, -s*.35 + sw*2, s*.22, s*.16, sg*.4, 0, TAU); g.fill(); }
        g.strokeStyle = C.col; g.beginPath(); g.moveTo(-s*.15, -s*.35); g.lineTo(-s*.2, -s*.6); g.moveTo(s*.15, -s*.35); g.lineTo(s*.2, -s*.6); g.stroke(); eye(-s*.2, -s*.65, Math.max(1.6, s*.1)); eye(s*.2, -s*.65, Math.max(1.6, s*.1)); break; }
      case 'shrimp': { g.fillStyle = C.col; for (let k = 0; k < 6; k++) { const a = -.6 + k*.32, x = Math.cos(a)*s*.6 - s*.1, y = Math.sin(a)*s*.6 - s*.2; g.beginPath(); g.arc(x, y, s*(.24 - k*.025), 0, TAU); g.fill(); }
        g.beginPath(); g.moveTo(-s*.45, s*.4); g.lineTo(-s*.85, s*.65 + sw*2); g.lineTo(-s*.4, s*.7); g.fill(); g.strokeStyle = C.acc; g.lineWidth = 1; g.beginPath(); g.moveTo(s*.5, -s*.5); g.quadraticCurveTo(s*1.2, -s*1, s*1.5, -s*.3 + sw*3); g.moveTo(s*.5, -s*.4); g.quadraticCurveTo(s*1.1, -s*.6, s*1.4, s*.1 + sw*2); g.stroke();
        eye(s*.45, -s*.55, Math.max(1.5, s*.09)); break; }
      case 'star': { g.save(); g.rotate(t*.6 + ph); g.fillStyle = C.col; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k/10*TAU - Math.PI/2, r2 = k % 2 ? s*.42 : s; g.lineTo(Math.cos(a)*r2, Math.sin(a)*r2); } g.closePath(); g.fill();
        g.fillStyle = C.belly; for (let k = 0; k < 5; k++) { const a = k/5*TAU - Math.PI/2; g.beginPath(); g.arc(Math.cos(a)*s*.55, Math.sin(a)*s*.55, s*.07, 0, TAU); g.fill(); } g.restore(); eye(-s*.15, -s*.05, Math.max(1.6, s*.1)); eye(s*.15, -s*.05, Math.max(1.6, s*.1)); break; }
      case 'bone': { g.strokeStyle = gold ? '#FFD700' : '#efe8d6'; g.lineWidth = Math.max(1.5, s*.08); g.beginPath(); g.moveTo(s*.45, 0); g.lineTo(-s*.9, Math.sin(t*6 + ph)*2); g.stroke();
        for (let k = 0; k < 6; k++) { const x = s*.25 - k*s*.2, hh = s*.45*(1 - k*.1); g.beginPath(); g.moveTo(x, -hh); g.quadraticCurveTo(x - s*.12, 0, x, hh); g.stroke(); }
        g.beginPath(); g.moveTo(-s*.9, 0); g.lineTo(-s*1.25, -s*.35); g.moveTo(-s*.9, 0); g.lineTo(-s*1.25, s*.35); g.stroke(); g.beginPath(); g.ellipse(s*.65, 0, s*.32, s*.3, 0, 0, TAU); g.stroke();
        g.fillStyle = L.glow ? C.acc : '#121313'; g.beginPath(); g.arc(s*.72, -s*.06, Math.max(1.6, s*.1), 0, TAU); g.fill(); break; }
      default: { // fish-like: fish, tall, big, sword, koi, flat, ghost, crystal, shark
        const sh = L.shape, H = s*(sh == 'tall' ? .85 : sh == 'sword' ? .26 : sh == 'shark' ? .3 : sh == 'big' ? .55 : sh == 'flat' ? .5 : L.asp);
        const ghosty2 = sh == 'ghost', crys = sh == 'crystal';
        if (ghosty2) g.globalAlpha *= .55 + .25*Math.sin(t*3 + ph);
        // fins behind the body
        g.fillStyle = sh == 'shark' ? C.col : C.acc; if (L.pat == 'tang') g.fillStyle = 'hsl(52,95%,55%)';
        if (sh == 'flat') { g.globalAlpha *= .8; g.beginPath(); g.ellipse(-s*.05, 0, s*.95, H*1.35, 0, 0, TAU); g.fill(); g.globalAlpha = ghosty2 ? .6 : 1; }
        else if (sh == 'shark') { g.beginPath(); g.moveTo(s*.1, -H*.8); g.lineTo(-s*.25, -H*2.3); g.lineTo(-s*.4, -H*.8); g.fill(); g.beginPath(); g.moveTo(s*.2, H*.6); g.lineTo(-s*.15, H*1.9); g.lineTo(-s*.05, H*.6); g.fill(); }
        else { const tall = sh == 'tall' || L.spikes ? 1.7 : sh == 'koi' ? 1.3 : 1; g.beginPath(); g.moveTo(s*.35, -H*.85); g.quadraticCurveTo(-s*.05, -H*(1 + .9*tall) + sw, -s*.6, -H*.5); g.fill();
          if (sh == 'tall') { g.beginPath(); g.moveTo(s*.1, H*.85); g.quadraticCurveTo(-s*.25, H*1.9 - sw, -s*.6, H*.5); g.fill(); }
          if (L.spikes && !simple) { g.strokeStyle = C.dark; g.lineWidth = 1; for (let k = 0; k < 6; k++) { const x = s*.3 - k*s*.15; g.beginPath(); g.moveTo(x, -H*.8); g.lineTo(x - s*.05, -H*2.1); g.stroke(); } } }
        g.fillStyle = C.col; if (L.pat == 'tang') g.fillStyle = 'hsl(52,95%,55%)'; tailPath(s, H, sh == 'shark' ? 'moon' : sh == 'sword' ? 'moon' : L.tail, wag); if (L.pat == 'tang') g.fillStyle = C.col;
        if (crys) { g.globalAlpha *= .6; }
        g.fillStyle = C.col; bodyPath(s, H); g.fill(); if (!simple) pattern(L, C, s, H, f.n); else { g.save(); g.clip(); g.globalAlpha = .5; g.fillStyle = C.belly; g.beginPath(); g.ellipse(0, H*.8, s, H*.6, 0, 0, TAU); g.fill(); g.restore(); }
        if (crys) { g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(s*.6, -H*.6); g.lineTo(0, H*.2); g.lineTo(-s*.5, -H*.5); g.moveTo(s*.2, H*.8); g.lineTo(0, H*.2); g.stroke(); }
        if (sh == 'shark') { g.strokeStyle = C.dark; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(s*.42 - k*s*.07, -H*.35); g.lineTo(s*.38 - k*s*.07, H*.3); g.stroke(); } }
        else { g.strokeStyle = C.dark; g.globalAlpha *= .6; g.lineWidth = Math.max(1, s*.05); g.beginPath(); g.arc(s*.5, 0, H*.75, Math.PI*.65, Math.PI*1.35); g.stroke(); g.globalAlpha = ghosty2 ? .6 : 1; }
        // side fin
        g.fillStyle = C.acc; g.globalAlpha *= .85; g.save(); g.translate(s*.2, H*.25); g.rotate(.5 + sw*.25); g.beginPath(); g.ellipse(-s*.12, 0, s*.2, H*.2, 0, 0, TAU); g.fill(); g.restore(); g.globalAlpha = ghosty2 ? .6 : 1;
        if (sh == 'sword' && L.tusk) { g.strokeStyle = C.dark; g.lineWidth = Math.max(1.5, H*.25); g.beginPath(); g.moveTo(s*.95, -H*.1); g.lineTo(s*1.75, -H*.2); g.stroke(); }
        else if (sh == 'sword') { g.fillStyle = C.col; g.beginPath(); g.moveTo(s*.9, -H*.3); g.lineTo(s*1.35, -H*.05); g.lineTo(s*.9, H*.25); g.fill(); }
        if (L.whisk) { g.strokeStyle = C.dark; g.lineWidth = 1; g.beginPath(); g.moveTo(s*.92, H*.15); g.quadraticCurveTo(s*1.25, H*.6 + sw*2, s*1.1, H*1.1); g.moveTo(s*.9, H*.25); g.quadraticCurveTo(s*1.05, H*.9, s*.85, H*1.3 + sw); g.stroke(); }
        if (sh == 'flat') { eye(s*.55, -H*.45, Math.max(1.6, s*.1)); eye(s*.3, -H*.62, Math.max(1.6, s*.1)); }
        else eye(s*(sh == 'shark' ? .62 : .55), -H*(sh == 'tall' ? .3 : .2), Math.max(1.8, s*(sh == 'sword' || sh == 'shark' ? .08 : .13) + (f.z >= 4 ? s*.04 : 0)), f.z >= 4);
        g.strokeStyle = C.dark; g.lineWidth = 1; g.beginPath(); g.moveTo(s*.98, H*.08); g.lineTo(s*.82, H*.14); g.stroke();
        if (ghosty2 && !simple) { g.strokeStyle = C.belly; g.globalAlpha = .35; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-s*.9, (k - 1)*H*.4); g.quadraticCurveTo(-s*1.5, (k - 1)*H*.6 + sw*4, -s*2, (k - 1)*H*.8); g.stroke(); } }
        g.globalAlpha = 1; } }
    if (L.crown) { g.fillStyle = '#FFD700'; const cx = L.shape == 'star' ? 0 : s*.45, cy = L.shape == 'star' ? -s*1.05 : -s*.62; g.beginPath(); g.moveTo(cx - s*.22, cy); g.lineTo(cx - s*.22, cy - s*.22); g.lineTo(cx - s*.1, cy - s*.1); g.lineTo(cx, cy - s*.28); g.lineTo(cx + s*.1, cy - s*.1); g.lineTo(cx + s*.22, cy - s*.22); g.lineTo(cx + s*.22, cy); g.fill(); } };
  // small pictures for the Fish Book
  const drawBird = (f, s, ph) => { const C = f.look, fl = Math.sin(t*10 + ph), col = C.col, dk2 = C.dark || mixHex(col, '#000000', .35);
    g.fillStyle = dk2; g.beginPath(); g.moveTo(-s*.7, 0); g.lineTo(-s*1.15, -s*.3); g.lineTo(-s*1.1, s*.25); g.fill();
    g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, s*.75, s*.42, 0, 0, TAU); g.fill();
    g.fillStyle = C.belly || mixHex(col, '#ffffff', .45); g.beginPath(); g.ellipse(s*.05, s*.14, s*.5, s*.22, 0, 0, TAU); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(s*.62, -s*.18, s*.3, 0, TAU); g.fill();
    g.fillStyle = '#F9A01B'; g.beginPath(); g.moveTo(s*.88, -s*.24); g.lineTo(s*1.2, -s*.12); g.lineTo(s*.88, -s*.04); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(s*.7, -s*.25, s*.11, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(s*.73, -s*.25, s*.055, 0, TAU); g.fill();
    g.fillStyle = dk2; g.beginPath(); g.moveTo(-s*.3, -s*.08); g.quadraticCurveTo(-s*.1, -s*(.25 + .95*fl), s*.32, -s*(.12 + .75*fl)); g.lineTo(s*.25, -s*.02); g.fill(); };
  const iconCache = {}; const fishIcon = f => { if (iconCache[f.k]) return iconCache[f.k]; const cv = document.createElement('canvas'); cv.width = 112; cv.height = 72; const g0 = g; try { g = cv.getContext('2d'); g.translate(56, 36);
      if (f.junk) { g.fillStyle = f.col; rr(g, -14, -18, 16, 26, 4); g.fill(); rr(g, -14, 2, 32, 12, 4); g.fill(); } else if (f.chest) { g.fillStyle = '#8D5B1D'; rr(g, -22, -14, 44, 28, 4); g.fill(); g.fillStyle = '#F9BF01'; g.fillRect(-22, -3, 44, 5); }
      else if (f.bird) drawBird(f, 26, 0);
      else { const sz = ['eel', 'dragon'].includes(f.look.shape) ? 16 : ['whale', 'sword', 'shark'].includes(f.look.shape) ? 22 : ['seahorse', 'octo', 'crab', 'star', 'angler', 'puffer'].includes(f.look.shape) ? 24 : 27; drawLook(f, sz, 0, false, false); } } catch(e) {} g = g0; return (iconCache[f.k] = cv.toDataURL()); };
  const FISH = {}; LOCS.forEach(L => { FISH[L.k] = L.fish.map((row, z) => row.split('|').map((it, i) => { const p = it.split(':'), n = p[1] || p[0], k = p[1] ? p[0] : L.k+'-'+z+'-'+i;
    return {k, n, z, i, loc:L.k, r:Math.min(5, i + (z >= 4 ? 1 : 0) + (z >= 7 ? 1 : 0)), look:mkLook(n, z, i), get col(){ return this.look.col; }, s:0}; })); });
  Object.values(FISH).forEach(rows => rows.forEach(row => row.forEach(f => { f.s = (9 + f.i*2 + f.z*.7) * ({whale:1.3, shark:1.2, dragon:1.05, squid:1.1, sword:1.1, ray:1.1, crab:.85, shrimp:.75, seahorse:.9, puffer:.9, star:.85, eel:.95}[f.look.shape] || 1); })));
  const BOOT = {k:'boot', n:'Old Boot', z:0, i:-1, r:0, col:'#5a3a1a', s:11, junk:true}, CHEST = {k:'chest', n:'Treasure Chest', z:2, i:-2, r:4, col:'#c8964a', s:13, chest:true};
  // Godly (from 60 m) and DANG (from 250 m) fish: one of each per spot, worth a fortune, very rare unless you aim your bait mix at them
  const SPECIAL = {lake:['Crown Sturgeon', 'DANG Catfish', 'OH DANG!!!! Lake Titan'], isle:['Glacier God Narwhal', 'DANG Yeti Fish', 'OH DANG!!!! Frost Colossus Whale'], coast:['Poseidon Ray', 'DANG Megalodon', 'OH DANG!!!! Abyss Behemoth Shark'], vent:['Volcano God Koi', 'DANG Lava Kraken', 'OH DANG!!!! Magma Titan Dragon'], star:['Galaxy Guardian', 'DANG Cosmic Whale', 'OH DANG!!!! Galaxy Devourer'], fwish:['Fwish God Koi', 'DANG Fwishosaurus Dragon', 'OH DANG!!!! Fwish Titan Whale', 'FISH!!']};
  const SPEC = {}; Object.entries(SPECIAL).forEach(([lk, names]) => { SPEC[lk] = names.map((n, j) => { const lo = mkLook(n, 6, 3);
      if (j == 3) { lo.rainbow = true; lo.shape = 'fish'; lo.pat = 'spots'; lo.tail = 'fan'; lo.crown = true; lo.glow = true; lo.col = 'hsl(300,95%,60%)'; lo.dark = 'hsl(260,80%,30%)'; lo.belly = '#ffffff'; lo.acc = '#ffff00';
        return {k:'fwish-FISH', n, z:7, i:7, r:9, loc:lk, look:lo, get col(){ return this.look.col; }, s:230, special:'fishmax', minD:Infinity}; }
      if (j == 2) { lo.rainbow = true; lo.col = 'hsl(300,90%,60%)'; lo.dark = 'hsl(260,80%,30%)'; lo.belly = '#ffffff'; lo.acc = '#ffff00'; lo.crown = true; lo.glow = true;
        return {k:lk + '-ohdang', n, z:7, i:6, r:8, loc:lk, look:lo, get col(){ return this.look.col; }, s:58 * (lo.shape == 'whale' ? 1.15 : 1), special:'ohdang', minD:Infinity}; }
      if (j) { lo.col = 'hsl(0,85%,48%)'; lo.dark = 'hsl(0,80%,22%)'; lo.belly = 'hsl(20,90%,70%)'; lo.acc = '#121313'; } else { lo.col = 'hsl(48,100%,62%)'; lo.dark = 'hsl(40,90%,36%)'; lo.belly = '#fffbe6'; lo.acc = '#7df9ff'; }
      lo.glow = true; return {k:lk + '-' + (j ? 'dang' : 'godly'), n, z:6, i:4 + j, r:6 + j, loc:lk, look:lo, get col(){ return this.look.col; }, s:(j ? 25 : 22) * (lo.shape == 'whale' ? 1.1 : 1), special:j ? 'dang' : 'godly', minD:j ? 10000 : 5000}; }); });
  const GUARD = LAYERS.map((Ly, j) => { const lo = mkLook(Ly.fish, 7, 3); lo.glow = true; return {k:'deep-' + j, n:Ly.fish, z:7, i:3, r:j < 15 ? 5 : j < 25 ? 10 : j < 35 ? 11 : j < 42 ? 12 : 13, loc:'deep', look:lo, get col(){ return this.look.col; }, s:18 + j*.4, guard:j, minD:Ly.d}; });
  // ⛵ Boats: buy them in order; each one looks different and adds hook space and coins (and sky bonuses for the flying ones)
  const BOATS = [
    {n:'Little Fishing Boat', cost:0, hook:0, coin:1, sky:1, hull:'#7a4a1e', trim:'#a0632a', rim:'#f3efe0', cabin:'#e8dcc0', roof:'#8D5B1D', flag:'#FF4539'},
    {n:'Speedy Skiff', cost:5e3, hook:2, coin:1.1, sky:1, hull:'#2a6fb8', trim:'#3f8fd8', rim:'#ffffff', cabin:'#f4f8ff', roof:'#1d4f86', flag:'#F9BF01'},
    {n:'Sturdy Trawler', cost:2e5, hook:4, coin:1.25, sky:1, hull:'#b8332a', trim:'#d8534a', rim:'#f3efe0', cabin:'#ffffff', roof:'#5a2a1a', flag:'#00B451', sail:'#f3efe0'},
    {n:'Hot-Air Balloon Boat', cost:1e7, hook:6, coin:1.5, sky:1.5, hull:'#6a4ab8', trim:'#8a6ad8', rim:'#ffe9a0', cabin:'#fff4d6', roof:'#4a2a8a', flag:'#ff7aa8', balloon:['#FF4539', '#F9BF01']},
    {n:'Royal Yacht', cost:1e10, hook:8, coin:2, sky:1.5, hull:'#f4f4f4', trim:'#d8e4ee', rim:'#1d4f86', cabin:'#ffffff', roof:'#1d4f86', flag:'#64CDF5', yacht:true},
    {n:'Submarine Boat', cost:1e14, hook:10, coin:3, sky:1.5, hull:'#e8b81a', trim:'#f9d04a', rim:'#4a4a4a', cabin:'#e8b81a', roof:'#8a6a10', flag:'#FF4539', sub:true},
    {n:'Sky Pirate Ship', cost:1e20, hook:12, coin:4, sky:2.5, hull:'#3a2a1e', trim:'#5a4030', rim:'#F9BF01', cabin:'#6a4a30', roof:'#2a1a10', flag:'#121313', sail:'#2a2a3a', balloon:['#3a2a6a', '#6a4ab8']},
    {n:'Golden Galleon', cost:1e28, hook:15, coin:6, sky:3, hull:'#e8b81a', trim:'#ffd84a', rim:'#fff6c8', cabin:'#fff2b0', roof:'#c8961a', flag:'#D5F367', sail:'#fff6c8', gold:true}];
  const boatT = () => BOATS[Math.max(0, Math.min(BOATS.length - 1, G.boat || 0))];
  // ☁️ Sky fishing: 16 skies, 4 flying creatures each (a * marks a bird). The last one, the Bwird Zone, is home of BIRD!!
  const SKYZ = [{a:0, n:'Treetops', c:['#7fc8f8', '#d8f3ff']}, {a:40, n:'Low Clouds', c:['#8ab8e8', '#eef6ff']}, {a:120, n:'Rainbow Skies', c:['#a898f0', '#ffd6ef']}, {a:300, n:'Storm Clouds', c:['#3a4660', '#6a7690']},
    {a:800, n:'Aurora Heights', c:['#06243a', '#1a5a5a']}, {a:2500, n:'Edge of Space', c:['#05071e', '#1a2a5a']}, {a:1e4, n:'Moon Orbit', c:['#03030f', '#16163a']}, {a:1e5, n:'Star Nebula', c:['#10031f', '#3a0a4a']},
    {a:1e8, n:'Galaxy Rim', c:['#0a0626', '#2a1a6a']}, {a:1e15, n:'Wormhole Winds', c:['#12002a', '#4a0a6a']}, {a:1e30, n:'Rainbow Cosmos', c:['#2a0a4a', '#ff9ad5']}, {a:1e50, n:'Dream Sky', c:['#3a1a5a', '#ffd1f7']},
    {a:1e80, n:'Clockwork Heavens', c:['#1a1408', '#8a6a2a']}, {a:1e120, n:'Crystal Firmament', c:['#0a2a4a', '#bfe9ff']}, {a:1e170, n:'Sky of Everything', c:['#000000', '#3a3a6a']}, {a:1e230, n:'Bwird Zone', c:['#ff9ad5', '#b8e8ff']}];
  const skyZ = a => { let z = 0; for (let i = 0; i < SKYZ.length; i++) if (a >= SKYZ[i].a) z = i; return z; };
  const SKY = ['Sparrow*|Robin*|Blue Jay*|Golden Eagle*', 'Puffy Cloud Puffer|Kite Ray|Seagull*|Sky Seahorse', 'Rainbow Lorikeet*|Flying Fish|Parrot*|Rainbow Dragon', 'Storm Petrel*|Lightning Eel|Thunderbird*|Thunder Whale',
    'Snowy Owl*|Aurora Ray|Glow Squid|Aurora Phoenix*', 'Satellite Squid|Meteor Hawk*|Space Shark|Sky Whale', 'Moon Puffer|Crater Crab|Lunar Moth*|Moon Dragon', 'Star Swallow*|Comet Koi|Nebula Ray|Galaxy Griffin*',
    'Comet Gull*|Orbit Ray|Asteroid Puffer|Galaxy Goose*', 'Warp Wren*|Wormhole Eel|Portal Parrot*|Twist Dragon', 'Prism Pelican*|Spectrum Ray|Rainbow Robin*|Color Whale', 'Sleepy Swan*|Dream Squid|Pillow Puffer|Dream Dragon',
    'Gear Hawk*|Cog Crab|Tick-Tock Toucan*|Clockwork Whale', 'Crystal Crane*|Diamond Ray|Glass Swan*|Prism Serpent', 'Every-Bird*|Infinity Eel|Cosmic Condor*|Sky Leviathan', 'Bwird Sparrow*|Bwird Owl*|Bwird Eagle*|Bwird Phoenix*']
    .map((row, z) => row.split('|').map((it, i) => { const bird = it.endsWith('*'), n = it.replace('*', ''), lo = mkLook(n, Math.min(7, z), i);
      return {k:'sky-' + z + '-' + i, n, z, i, loc:'sky', r:z >= 15 ? [11, 12, 13, 13][i] : z >= 12 ? [5, 10, 11, 12][i] : z >= 8 ? [4, 5, 10, 11][i] : Math.min(5, i + (z >= 4 ? 1 : 0) + (z >= 7 ? 1 : 0)), look:lo, get col(){ return this.look.col; }, s:(10 + i*2 + Math.min(z, 10)*.7) * (lo.shape == 'whale' ? 1.3 : 1), bird, sky:true}; }));
  const BIRDMAX = (() => { const lo = mkLook('BIRD!! Rainbow Phoenix', 7, 3); lo.rainbow = true; return {k:'sky-BIRD', n:'BIRD!!', z:15, i:3, r:14, loc:'sky', look:lo, get col(){ return this.look.col; }, s:120, bird:true, sky:true, special:'birdmax'}; })();
  const SKYALL = [].concat(...SKY).concat([BIRDMAX]);
  const SECRET = {}; [['lake', 'Secret Golden Minnow'], ['isle', 'Secret Snow Spirit'], ['coast', 'Secret Mermaid Fish'], ['vent', 'Secret Lava Pearl'], ['star', 'Secret Wishing Starfish'], ['fwish', 'Secret Fwish Fish']].forEach(([lk, n]) => {
    const lo = mkLook(n, 7, 3); lo.glow = true; SECRET[lk] = {k:'secret-' + lk, n, z:7, i:3, r:15, loc:lk, look:lo, get col(){ return this.look.col; }, s:16, secret:true}; });
  const ALL = [].concat(...LOCS.map(L => [].concat(...FISH[L.k]).concat(SPEC[L.k]))).concat(GUARD).concat(Object.values(SECRET)).concat([BOOT, CHEST]);

  // ---------- upgrades (bought with coins; levels never reset except by a Pearl Dive) ----------
  const UP = [
    {k:'line', n:'Longer Line', d:L => 'Line reaches '+fmt(lineM(L))+' m → '+fmt(lineM(L+1))+' m', b:10, gr:1.34},
    {k:'hook', n:'Bigger Hook', d:L => 'Hold '+(5+L)+' → '+(6+L)+' fish per dive', b:25, gr:1.45},
    {k:'value', n:'Fish Market', d:L => 'Fish sell for ×'+fmt(marketM(L))+' → ×'+fmt(marketM(L+1)), b:40, gr:1.45},
    {k:'sink', n:'Heavy Sinker', d:L => 'Sink '+fmt(sinkV(L))+' → '+fmt(sinkV(L+1))+' m/s', b:20, gr:1.32},
    {k:'reel', n:'Fast Reel', d:L => 'Reel '+fmt(reelV(L))+' → '+fmt(reelV(L+1))+' m/s', b:20, gr:1.32},
    {k:'steer', n:'Quick Steer', d:L => 'Hook moves '+(100+10*L)+'% → '+(110+10*L)+'% as fast', b:25, gr:1.32, max:20},
    {k:'luck', n:'Lucky Lure', d:L => 'Rare & Epic fish +'+(12*L)+'% → +'+(12*L+12)+'%', b:50, gr:1.42},
    {k:'magnet', n:'Magnet Hook', d:L => 'Grab fish from '+(3*L)+' → '+(3*L+3)+' px farther away', b:80, gr:1.5, max:15},
    {k:'ghost', n:'Ghost Lure', d:L => 'On the way down your hook can ignore ' + GHOST[Math.min(3, L)] + (L < 3 ? ' → ' + GHOST[L+1] : '') + ' (pick with 👻 Ignore)', b:150, gr:9, max:3},
    {k:'shield', n:'Jelly Guard', d:L => 'Block '+L+' → '+(L+1)+' jellyfish stings per dive', b:120, gr:1.55},
    {k:'gold', n:'Golden Bait', d:L => 'Golden fish (×5): '+goldP(L).toFixed(1)+'% → '+goldP(L+1).toFixed(1)+'%', b:150, gr:1.45, max:40},
    {k:'combo', n:'Combo Charm', d:L => 'Each fish in a row adds +'+(10+4*L)+'% → +'+(14+4*L)+'%', b:90, gr:1.45},
    {k:'drop', n:'Express Drop', d:L => 'Skip up to '+Math.min(80, 8*L)+'% → '+Math.min(80, 8*L+8)+'% of the line (choose how much with the ⏬ slider)', b:300, gr:1.9, max:10},
    {k:'chest', n:'Treasure Map', d:L => 'Chests '+Math.min(233, 25*L)+'% → '+Math.min(233, 25*L+25)+'% more common (max) and '+(20*L)+'% → '+(20*L+20)+'% richer', b:300, gr:1.5},
    {k:'haggle', n:'Haggler', d:L => 'Every other upgrade costs ' + Math.round(100 - 100*Math.pow(.95, L)) + '% → ' + Math.round(100 - 100*Math.pow(.95, L+1)) + '% less', b:500, gr:1.8, max:30},
    {k:'spool', n:'Mega Spool', d:L => 'Line ×' + fmt(spoolMult(L)) + ' → ×' + fmt(spoolMult(L+1)) + ' as long (about 1 new deep layer every 4 levels)', b:2e4, gr:1.4, max:180},
    {k:'drill', n:'Anchor Drill', d:L => 'Sink ×' + fmt(Math.pow(2, L)) + ' → ×' + fmt(Math.pow(2, L+1)) + ' faster', b:1e4, gr:4, max:40},
    {k:'winch', n:'Turbo Winch', d:L => 'Reel ×' + fmt(Math.pow(2, L)) + ' → ×' + fmt(Math.pow(2, L+1)) + ' faster', b:1e4, gr:4, max:40},
    {k:'deepmap', n:'Deep Map', d:L => UL('drop') < 10 ? 'Needs Express Drop maxed first' : 'Express Drop can skip up to ' + (80 + 5*L) + '% → ' + (80 + 5*L + 5) + '%', b:5e5, gr:30, max:3},
    {k:'buddy', n:'Fishing Buddy', d:L => 'Earns '+fmt(buddyRate(L))+' → '+fmt(buddyRate(L+1))+' coins/s for you', b:250, gr:1.42},
    {k:'lines', n:'Extra Lines', d:L => L >= 4 ? 'Fishing with 5 hooks side by side (max)' : 'Fish with ' + (1+L) + ' → ' + (2+L) + ' hooks side by side (every hook catches fish; they share your hook space)', b:5000, gr:12, max:4},
    {k:'newbait', n:'Fresh Bait', d:L => 'Fish missing from your Fish Book show up ×' + (1 + .4*L).toFixed(1) + ' → ×' + (1 + .4*(L+1)).toFixed(1) + ' as often', b:120, gr:1.5, max:20},
    {k:'lamp', n:'Deep Lamp', d:L => 'Your light reaches ' + (70 + 45*L) + ' → ' + (115 + 45*L) + ' px in dark water', b:150, gr:1.6, max:10},
    {k:'clear', n:'Clear Water', d:L => 'Deep water is ' + (7*L) + '% → ' + (7*L + 7) + '% brighter', b:200, gr:1.65, max:10},
    {k:'radar', n:'Fish Radar', d:L => ['Arrows at the screen edge point to Rare+ fish you still need, just out of view', 'Radar shows every new fish', 'Radar shows every fish, farther away', 'Maxed!'][Math.min(3, L)], b:600, gr:8, max:3},
    {k:'sonar', n:'Sonar', d:L => ['Rare fish get a colored ring','Shows each fish’s price','Rares +15% more often','Fish missing from your Fish Book flash','Maxed!'][Math.min(4, L)], b:400, gr:6, max:4}];
  const GHOST = ['nothing', 'Old Boots & Common fish', 'Boots, Common & Uncommon fish', 'everything below Epic'];
  const ghostTier = () => { const mx = Math.min(3, UL('ghost')); return G.ghostSel == null ? mx : Math.max(0, Math.min(mx, G.ghostSel)); };
  const ghosty = o => { const tier = ghostTier(); return tier > 0 && !o.jelly && !o.pred && (o.f.junk || (!o.f.chest && !o.gold && o.f.i < tier)); };
  // the bottom is 1.7976931348623157e308 m down, the biggest number a computer can hold (deep dives use a moving origin, so the hook never freezes)
  const FLOOR = Number.MAX_VALUE; const lineM = L => Math.min(FLOOR, Math.round((30 + 12*L + .6*L*L) * spoolMult(UL('spool')) * pearlM()));
  // 🧵 Mega Spool: every 4 levels reaches about one more deep layer (so each new layer takes about the same effort)
  const spoolMult = k => { if (!(k > 0)) return 1; const x = Math.min(k / 4, 46), i = Math.floor(x), f = x - i, a = layerLg(i), b = layerLg(i + 1); return Math.pow(10, Math.min(308, a + f*(b - a))) / 2000; };
  // pearls: +10% each up to 100, then they keep helping more gently
  const pearlM = () => { const p = G.pearls || 0; return p <= 100 ? 1 + .1*p : 11 + 5*Math.log10(p / 100); };
  const marketM = L => Math.pow(1.12, Math.min(L, 100)) * (1 + .03*Math.max(0, L - 100));
  const sinkV = L => 20 * (1 + .15*L) * Math.pow(2, Math.min(40, UL('drill'))), reelV = L => 24 * (1 + .15*L) * (1 + .1*A.U('reel')) * Math.pow(2, Math.min(40, UL('winch')));
  // fish are worth ×3 more for every deep layer (smoothly, as you go down) — about ×3e21 at the very bottom, never Infinity
  const depthMult = d => Math.pow(3, layerPos(d));
  const goldP = L => 1 + .6*L;
  const cost = (u, L) => Math.ceil(Math.min(1e300, u.b * Math.pow(u.gr, L) * (u.k == 'haggle' ? 1 : Math.pow(.95, UL('haggle')))));

  // ---------- saved progress (with your profile + the cloud) ----------
  let bookC = null; const book = () => { if (bookC) return bookC; let loc = {}; try { loc = JSON.parse(localStorage.getItem('wl-fishbook') || '{}'); } catch(e){} const sv = (api.gdata && api.gdata().book) || {}; bookC = {...loc}; for (const k in sv) bookC[k] = Math.max(bookC[k]||0, sv[k]); return bookC; };
  const G = Object.assign({coins:0, upg:{}, loc:'lake', locs:{lake:1}, best:0, deepest:0, pearls:0, run:0, tot:0, dives:0, caught:0}, (api.gdata && api.gdata().fg) || {});
  const UL = k => G.upg[k] || 0;
  // ☁️ sky fishing has its own wallet (🪶 feathers), upgrades and Sky Book
  G.sky = Object.assign({feathers:0, upg:{}, best:0, run:0, tot:0, cap:null, upMS:null, downMS:null}, G.sky || {}); const SG = G.sky;
  const SUL = k => SG.upg[k] || 0;
  if (!G.fmode) G.fmode = G.skyMode ? 'sky' : 'sea';
  const inSky = () => G.fmode == 'sky', inPlanet = () => G.fmode == 'planet';
  // 🎣 Extra Lines: more hooks beside your main one, 90 px apart
  const hooksX = () => { const n = Math.min(4, inSky() ? SUL('sballoons') : UL('lines')), xs = [hx]; for (let i = 0; i < n; i++) xs.push(Math.max(14, Math.min(W - 14, hx + (i % 2 ? 1 : -1) * 90 * (1 + (i >> 1))))); return xs; };
  let hitHook = 0; const nearHook = (x, r) => { const xs = hooksX(); for (let k = 0; k < xs.length; k++) if (Math.abs(x - xs[k]) < r) { hitHook = k; return true; } return false; };
  // what you caught hangs under the hook that caught it
  const hangCatch = (hy, skyLook) => { const xs = hooksX(); xs.forEach((x0, k) => { caught.filter(c2 => (c2.h || 0) == k || (k == 0 && (c2.h || 0) >= xs.length)).slice(-8).forEach((x, i) => { g.save(); g.translate(x0 + Math.sin(t*3 + i)*6, hy + (skyLook ? 20 : 16) + i*9);
      if (x.f.bird) drawBird(x.f, 8, i); else if (x.f.junk || x.f.chest) { g.fillStyle = x.f.col; g.fillRect(-6, -5, 12, 10); } else { g.rotate(Math.PI/2 + Math.sin(t*4 + i)*.3); drawLook(x.f, 8, i, x.gold, true); } g.restore(); }); }); };
  const spd = k => Math.max(10, Math.min(100, G[k] == null ? 100 : G[k])) / 100;   // speed sliders: 10–100% of your upgraded speed
  // 📏 Depth slider: let out only part of your line (from 25 m up to the whole line) so shallow fish are reachable again
  // a short line never moves so fast you can't fish it: each way takes at least ~3 s
  // short lines are never too fast to fish, and long lines never take more than ~40 s each way
  const capV = v => Math.max(Math.min(v, Math.max(14, maxD / 8)), maxD / 40);   // automatic speed: at least ~8 s each way so there's time to aim
  // what the hook actually does: your typed/slid speed is used exactly (1 m/s up to your max); otherwise the automatic speed
  const sinkMax = () => sinkV(UL('sink')), reelMax = () => reelV(UL('reel'));
  const speedNow = (key, mx) => G[key] != null ? Math.max(1, Math.min(mx, G[key])) : null;
  const sinkEff = () => { const v = speedNow('sinkMS', sinkMax()); return v != null ? v : capV(sinkMax() * spd('sinkPct')); };
  const reelEff = () => { const v = speedNow('reelMS', reelMax()); return v != null ? v : capV(reelMax() * spd('reelPct')); };
  const lineUse = () => { const full = lineM(UL('line')); return G.lineCap == null ? full : Math.max(1, Math.min(full, G.lineCap)); };
  const skipMax = () => Math.min(80, 8*UL('drop')) + (UL('drop') >= 10 ? 5*UL('deepmap') : 0), skipPct = () => G.skip == null ? skipMax() : Math.max(0, Math.min(skipMax(), G.skip));
  const save = () => { try { api.setGdata && api.setGdata({book:book(), fg:G}); } catch(e){} try { localStorage.setItem('wl-fishbook', JSON.stringify(book())); } catch(e){} };
  const LOC = () => LOCS.find(L => L.k == G.loc) || LOCS[0];
  const bookBonus = () => { const b = book(); let m = 1; LOCS.forEach(L => { let all = true; FISH[L.k].forEach(z => { const done = z.every(f => b[f.k]); if (done) m += .03; else all = false; }); if (all) m += .25; }); return m; };
  const coinMult = () => marketM(UL('value')) * pearlM() * bookBonus() * boatT().coin;
  const capN = () => 5 + UL('hook') + A.U('bait') + boatT().hook;
  const luck = () => 1 + .12*UL('luck') + .15*A.U('lure') + (UL('sonar') >= 3 ? .15 : 0) + (isNight() ? .3 : 0);
  function buddyRate(L) { const z = zoneOf(G.best||0); return L ? fin(L * .35 * 4 * Math.pow(2.3, z) * Math.sqrt(depthMult(Math.min(G.best||0, lineUse()))) * LOC().mult * coinMult()) : 0; }
  const fishVal = (f, d) => fin(fishVal0(f, d)), fishPts = (f, d) => fin(fishPts0(f, d));   // never ∞, however deep
  const fishVal0 = (f, d) => f.secret ? 4 * Math.pow(2.3, zoneOf(d)) * 300 * LOC().mult * depthMult(d) : f.guard != null ? 4 * Math.pow(2.3, 7) * 30 * LOC().mult * depthMult(d) : f.special ? 4 * Math.pow(2.3, zoneOf(d)) * ({dang:500, godly:60, ohdang:1e6, fishmax:1e9})[f.special] * LOC().mult * depthMult(d) : f.chest ? 60 * Math.pow(2.3, zoneOf(d)) * LOC().mult * depthMult(d) * (1 + .2*UL('chest')) : f.junk ? 1 : 4 * Math.pow(2.3, f.z) * [1, 2, 4, 9][f.i] * LOC().mult * depthMult(d);
  const fishPts0 = (f, d) => f.secret ? 3000 + 25*layerOf(d) : f.guard != null ? 900 + 60*f.guard + 25*layerOf(d) : f.special ? (f.special == 'fishmax' ? 9e15 : f.special == 'ohdang' ? 100000 + 1000*zoneOf(d) : f.special == 'dang' ? 1500 + 80*zoneOf(d) : 400 + 30*zoneOf(d)) + 25*layerOf(d) : f.junk ? 2 : f.chest ? 150 + 20*zoneOf(d) : Math.round((10 + 14*f.z) * [1, 1.6, 2.6, 4.5][f.i] + 25*layerOf(d));

  // ---------- time of day (a 5-minute day) & weather ----------
  const DAYLEN = 300; const dayT = () => ((Date.now()/1000) % DAYLEN) / DAYLEN;
  const daylight = () => Math.max(0, Math.min(1, .5 + .6*Math.sin(dayT()*TAU)));
  const isNight = () => daylight() < .25;
  let weather = 'clear'; const rollWeather = () => { const r = Math.random(); weather = r < .12 ? 'storm' : r < .35 ? 'rain' : 'clear'; };
  const wMult = () => weather == 'storm' ? 1.4 : weather == 'rain' ? 1.2 : 1;
  // a snappy barracuda patrols the deep: on the way up it can snatch a fish off your hook (never a new one), Jelly Guard blocks it
  const PRED = {k:'pred', n:'Snappy Barracuda', z:3, i:0, r:0, look:(() => { const lo = mkLook('Snappy Barracuda Shark', 3, 0); lo.col = 'hsl(210,18%,34%)'; lo.dark = 'hsl(210,25%,16%)'; lo.belly = 'hsl(210,15%,62%)'; lo.acc = 'hsl(210,20%,26%)'; return lo; })(), s:30};
  // ---------- bounties: catch the fish on the board for a big coin bonus ----------
  const mkBounty = () => { const zMax = Math.max(0, Math.min(7, zoneOf(lineUse()))), zz = Math.floor(Math.random()*(zMax + 1)), i = Math.random() < .55 ? 0 : Math.random() < .6 ? 1 : Math.random() < .7 ? 2 : 3, f = FISH[G.loc][zz][i], need = [4, 3, 2, 1][i];
    return {loc:G.loc, k:f.k, n:f.n, need, have:0, reward:Math.ceil(fishVal(f, ZONES[zz].d + 1) * need * 8 * coinMult())}; };
  const fillBounties = () => { G.bounties = (G.bounties || []).filter(b => b && b.have < b.need); let tries = 0; while (G.bounties.filter(b => b.loc == G.loc).length < 3 && tries++ < 20) { const nb = mkBounty(); if (!G.bounties.some(b => b.k == nb.k)) G.bounties.push(nb); } };
  // ---------- one dive ----------
  let st = 'ready', phase = 'surface', score = 0, t = 0, hx = W/2, tx = null, hd = 0, camD = 0, maxD = 0, skipD = 0, caught = [], fish = [], genTo = 0, ghostN = 0, shieldN = 0,
    combo = 0, lastCatch = -9, msg = '', msgT = 0, quiz = false, tally = null, zoneShow = '', zoneT = 0, lastZone = -1, ptrDown = false, panel = null, panelTab = 'up', armPearl = false, flash = 0, buddyAcc = 0;
  const K = {}; const kd = e => { K[e.key] = true; }, ku = e => { K[e.key] = false; }; window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const say = (s, d) => { msg = s; msgT = d || 1.6; };
  let slowHeld = false; const slowF = () => (K[' '] || slowHeld) ? .3 : 1;   // hold Space (or the 🐢 button) to go slow
  // ---- bait mix: the player picks how much of each rarity they want; aiming at rarer fish means fewer fish ----
  const MIXN = 8, COST = [1, 1.6, 2.6, 4.5, 7, 11, 22, 120];   // "how hard to attract" per rarity: rarer mix = emptier water
  const mixOn = () => Array.isArray(G.mix) && G.mix.length == MIXN && G.mix.some(v => v > 0);
  const poolAt = d => { const z = zoneOf(d), L = LOC(), lk = luck(), w8 = [10, 5, 2.2*lk, .7*lk], out = [];
    FISH[L.k][z].forEach((f, i) => out.push({f, w:w8[i]*(z ? .8 : 1)})); if (z > 0) FISH[L.k][z-1].forEach((f, i) => out.push({f, w:w8[i]*.2}));
    const li = layerIdx(d); if (li >= 0) out.push({f:GUARD[li], w:.25*lk});
    const gd = SPEC[L.k][0], dg = SPEC[L.k][1]; if (d >= gd.minD) out.push({f:gd, w:.05*lk}); if (d >= dg.minD) out.push({f:dg, w:.008*lk}); if (SECRET[L.k]) out.push({f:SECRET[L.k], w:.0035*lk}); return out; };
  const mixed = pool => { if (!mixOn()) return pool; const nat = new Array(MIXN).fill(0); let T = 0; pool.forEach(p2 => { nat[mixR(p2.f)] += p2.w; T += p2.w; });
    const want = G.mix.map((v, r) => nat[r] > 0 ? Math.max(0, v) : 0), W8 = want.reduce((a, b) => a + b, 0); if (!(W8 > 0)) return pool;
    return pool.map(p2 => ({f:p2.f, w:p2.w / nat[mixR(p2.f)] * want[mixR(p2.f)] / W8 * T})); };
  const densCache = {}; const density = d => { const key = zoneOf(d) + '|' + (d >= 10000 ? 2 : d >= 5000 ? 1 : 0) + '|' + G.loc + '|' + (mixOn() ? G.mix.join(',') : 'n'); if (densCache[key] != null) return densCache[key];
    const nat = poolAt(d), mx = mixed(nat), ec = p2 => { let a = 0, b = 0; p2.forEach(q => { a += q.w*COST[mixR(q.f)]; b += q.w; }); return a / b; };
    return (densCache[key] = Math.max(.008, Math.min(1.35, ec(nat) / ec(mx)))); };
  const pick = d => { const z = zoneOf(d), u = Math.random();
    if (z <= 2 && u < .07*(mixOn() ? (G.mix[0]||0) / Math.max(1, G.mix.reduce((a, b) => a + b, 0)) * 3 : 1)) return BOOT;
    if (z >= 2 && u < Math.min(.04, .012 * (1 + .25*UL('chest')))) return CHEST;
    const nb = 1 + .4*UL('newbait'), bk = book(), wt = p2 => bk[p2.f.k] ? p2.w : p2.w * nb;   // 🪱 Fresh Bait: new-to-you fish bite more often
    const pool = mixed(poolAt(d)); let S = pool.reduce((a, b) => a + wt(b), 0), x = Math.random()*S; for (const p2 of pool) { x -= wt(p2); if (x <= 0) return p2.f; } return pool[0].f; };
  const spawnBand = (b0L, band) => { const df = A.D(.8, 1, 1.25), b0 = base + b0L, z = zoneOf(b0);
      const dn = density(b0) * wMult(), n = (Math.random() < .9*dn ? 1 : 0) + (Math.random() < .35*dn ? 1 : 0) + (z >= 4 && Math.random() < .25*dn ? 1 : 0);
      for (let i = 0; i < n; i++) { const f = pick(b0), dir = Math.random() < .5 ? 1 : -1;
        fish.push({f, x:20 + Math.random()*(W-40), d:b0L + Math.random()*band, vx:f.chest ? 0 : dir * (25 + Math.random()*45 + z*6) * df, ph:Math.random()*TAU, gold:!f.junk && !f.chest && Math.random()*100 < goldP(UL('gold'))}); }
      if (z >= 2 && Math.random() < .035 * df) { const dir = Math.random() < .5 ? 1 : -1; fish.push({pred:true, f:PRED, x:dir > 0 ? -60 : W + 60, d:b0L + Math.random()*band, vx:dir*(150 + z*12) * df, ph:Math.random()*TAU}); }
      if (z >= 1 && Math.random() < Math.min(.4, (.09 + .03*z) * df)) fish.push({jelly:true, x:20 + Math.random()*(W-40), d:b0L + Math.random()*band, vx:(Math.random()-.5)*30, ph:Math.random()*TAU}); };
  const gen = upTo => { if (upTo - genTo > 12*400) genTo = upTo - 12*400; let n = 0; while (genTo < upTo && n++ < 500) { const b0 = genTo; genTo += 12; if (genTo == b0) { genTo = upTo; break; } spawnBand(b0, 12); } };
  // Very fast hooks: the water near you "rides along" so fish still pass at a speed you can see (max 150 m/s on screen),
  // and fresh fish are made ahead of you on the way up too.
  // how fast fish go past the hook on screen, however fast the line really moves (slow enough to aim at a fish); holding Space slows it even more
  const FASTV = 42; let visBoost = 1; const visV = () => FASTV * slowF() * visBoost; let genUp = -1;
  const genAbove = to => { let n = 0; while (genUp > to && genUp > 0 && n++ < 500) { const b1 = Math.max(0, genUp - 12); if (b1 == genUp) { genUp = to; break; } spawnBand(b1, genUp - b1); genUp = b1; } };
  const ride = (prevD, dir, dt) => { const ex = Math.max(0, Math.abs(hd - prevD) - visV()*dt); if (!(ex > 0)) return prevD; const sh = ex*dir;
    for (const o of fish) if (!o.dead && (dir > 0 ? (o.d > prevD - 60 && o.d < prevD + 420) : (o.d < prevD + 60 && o.d > prevD - 420))) { o.d += sh; if (o.d < 1 && base == 0) o.dead = true; }
    if (dir > 0) genTo += sh; else { if (genUp < 0) genUp = prevD - 60; genUp += sh; } return prevD + sh; };
  let layerT = -9;
  let fT = 0; const spawnFISH = () => { const f = SPEC.fwish[3]; if (fish.some(o => !o.dead && o.f === f)) return; fish.push({f, x:W/2, d:Math.max(1, hd + (phase == 'reel' ? -40 : 40)), vx:8, ph:0, gold:false});
    say('🌍 FISH!! — THE BIGGEST FISH IN THE WORLD IS HERE!!!', 6); flash = 1; A.sfx('win'); };
  const catchFISH = o => { catchIt(o); flash = 1; say('🌍🌍 YOU CAUGHT FISH!! 🌍🌍', 8);
    // every coin a computer can count, every upgrade maxed, plus the arcade jackpot (1.80e308 tickets, +10 Rebirths, +2 Diamond Stars)
    G.coins = Number.MAX_VALUE; G.run = Number.MAX_VALUE; G.tot = Number.MAX_VALUE; UP.forEach(u => { G.upg[u.k] = u.max != null ? u.max : 200; }); Object.keys(LOCS).forEach(i => { G.locs[LOCS[i].k] = 1; });
    save(); try { api.jackpot && api.jackpot('🌍 FISH!!'); } catch(e){} stat(api, 'fishFISH', 1, 'add'); refreshBar(); };
  const ohChance = d => Math.min(1, Math.max(0, d) * 1e-12); let ohT = 0;
  const ohTxt = d => { const p = ohChance(d) * 100; return p >= 1 ? p.toFixed(p >= 10 ? 0 : 1) + '%' : p >= .001 ? p.toPrecision(2) + '%' : p.toExponential(1).replace('e-', '×10⁻').replace(/⁻(\d+)/, (m, n) => '⁻' + n.split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')) + '%'; };
  // Very deep dives: everything near the hook is stored relative to a moving origin ("base"), so positions stay precise
  // even trillions of trillions of meters down. Absolute depth = base + local depth.
  let base = 0; const AB = d => base + d;
  const rebase = () => { const sh = hd - 1000; base += sh; hd -= sh; camD -= sh; genTo -= sh; if (genUp >= 0) genUp -= sh; for (const o of fish) o.d -= sh; fish = fish.filter(o => !o.dead && Math.abs(o.d - hd) < 2500); };
  const unbase = () => { if (!base) return; hd += base; camD += base; genTo += base; if (genUp >= 0) genUp += base; for (const o of fish) o.d += base; base = 0; };
  const startDive = () => { ohT = 0; genUp = -1; base = 0; if (panel) closePanel(); maxD = lineUse(); skipD = Math.floor(maxD / 100 * skipPct()); fish = fish.filter(o => !o.dead && !o.pred); genTo = Math.max(1, skipD, genTo || 0);   // the fish under the boat stay caught = []; ghostN = UL('ghost'); shieldN = UL('shield');
    combo = 0; hd = skipD; if (hd > 1e8) rebase(); hx = tx != null ? tx : W/2; phase = 'drop'; lastZone = -1; A.tone(300, .15, 'sine', .05); if (skipD) say('Express drop to '+fmt(skipD)+' m', 1.2); refreshBar(); };
  // ======================= ☁️ SKY FISHING: your balloon lure floats UP; catch flying creatures, dodge lightning, come back down =======================
  let alt = 0, skyMax = 0, skyCr = [], skyHi = 0, skyLo = 0, skyScroll = 0, lastSkyZ = -1, skyHY = 340, bT = 0;
  const skyPh = () => phase == 'skyup' || phase == 'skydown';
  // every 4 Rocket Balloon levels reach about one more sky (past the Storm Clouds)
  const skyLg = j => j < SKYZ.length ? Math.log10(Math.max(10, SKYZ[j].a)) : Math.log10(SKYZ[SKYZ.length - 1].a) + 30*(j - SKYZ.length + 1);
  const skySpoolM = k => { if (!(k > 0)) return 1; const x = Math.min(k / 4 + 3, SKYZ.length + 1), i = Math.floor(x), f = x - i, a = skyLg(i), b = skyLg(i + 1); return Math.pow(10, Math.min(308, a + f*(b - a))) / SKYZ[3].a; };
  const skyLineM = L => Math.min(FLOOR, Math.round((30 + 12*L + .6*L*L) * skySpoolM(SUL('srocket'))));
  const skyUse = () => { const full = skyLineM(SUL('sline')); return SG.cap == null ? full : Math.max(1, Math.min(full, SG.cap)); };
  const riseV = L => 20 * (1 + .15*L) * Math.pow(2, Math.min(40, SUL('sjet'))), fallV = L => 24 * (1 + .15*L) * Math.pow(2, Math.min(40, SUL('sjet')));
  const capVs = v => Math.max(Math.min(v, Math.max(14, skyMax / 8)), skyMax / 40);
  const riseEff = () => SG.upMS != null ? Math.max(1, Math.min(riseV(SUL('sbig')), SG.upMS)) : capVs(riseV(SUL('sbig')));
  const fallEff = () => SG.downMS != null ? Math.max(1, Math.min(fallV(SUL('schute')), SG.downMS)) : capVs(fallV(SUL('schute')));
  const skyCap = () => 5 + SUL('snet') + boatT().hook;
  const skyPos = a => { if (!(a >= SKYZ[7].a)) return 7; const z = skyZ(a), lo = skyLg(z), hi = skyLg(z + 1); return z + Math.max(0, Math.min(1, (Math.log10(Math.min(a, Number.MAX_VALUE)) - lo) / (hi - lo))); };
  const skyMult = a => Math.pow(3, Math.max(0, skyPos(a) - 7));   // ×3 for every sky past the Star Nebula
  const skyBookBonus = () => { const b = book(); let m = 1, all = true; SKY.forEach(z => { if (z.every(f => b[f.k])) m += .03; else all = false; }); return m + (all ? .25 : 0); };
  const featherMult = () => marketM(SUL('sval')) * skyBookBonus() * boatT().sky;
  const skyVal = (f, a) => f.special == 'birdmax' ? Number.MAX_VALUE : fin(4 * Math.pow(2.3, Math.min(7, f.z)) * [1, 2, 4, 9][f.i] * skyMult(a));
  const skyPts = (f, a) => f.special == 'birdmax' ? 9e15 : Math.round((10 + 14*Math.min(10, f.z)) * [1, 1.6, 2.6, 4.5][f.i] + 25*Math.max(0, Math.floor(skyPos(a)) - 7));
  const sbuddyRate = L => L ? fin(L * .35 * 4 * Math.pow(2.3, Math.min(7, skyZ(Math.min(SG.best || 0, skyUse())))) * Math.sqrt(skyMult(Math.min(SG.best || 0, skyUse()))) * featherMult()) : 0;
  const skyLuck = () => 1 + .12*SUL('sluck') + (isNight() ? .3 : 0);
  const allSkyCaught = () => { const b = book(); return [].concat(...SKY).every(f => b[f.k]); };
  const skyPick = a => { const z = skyZ(a), lk = skyLuck(), w8 = [10, 5, 2.2*lk, .7*lk], nb = 1 + .4*SUL('snew'), bk = book(), pool = [];
    for (const zz of [z, z - 1]) if (zz >= 0) SKY[zz].forEach((f, i) => pool.push({f, w:w8[i] * (zz == z ? 1 : .35) * (bk[f.k] ? 1 : nb)}));
    let S = pool.reduce((a2, p2) => a2 + p2.w, 0), x = Math.random()*S; for (const p2 of pool) { x -= p2.w; if (x <= 0) return p2.f; } return pool[0].f; };
  const skyBand = (r0, band) => { const a = alt + r0; if (a < 4) return; const z = skyZ(a), dn = weather == 'storm' ? 1.3 : weather == 'rain' ? 1.15 : 1;
    const n = (Math.random() < .85*dn ? 1 : 0) + (Math.random() < .35*dn ? 1 : 0);
    for (let i = 0; i < n; i++) { const f = skyPick(a), dir = Math.random() < .5 ? 1 : -1; skyCr.push({f, x:20 + Math.random()*(W - 40), r:r0 + Math.random()*band, vx:dir*(30 + Math.random()*50 + Math.min(z, 10)*6), ph:Math.random()*TAU, gold:Math.random()*100 < goldP(SUL('sgold'))}); }
    if (z >= 3 && z < 15 && Math.random() < .14) skyCr.push({zap:true, x:Math.random()*W, r:r0 + Math.random()*band, vx:(Math.random() < .5 ? -1 : 1)*(18 + Math.random()*20), ph:Math.random()*TAU}); };
  const startSky = () => { if (panel) closePanel(); skyMax = skyUse(); alt = 0; skyCr = []; caught = []; combo = 0; lastCatch = -9; shieldN = SUL('srod'); skyHi = 6; skyLo = 0; lastSkyZ = -1; skyHY = 340; bT = 0; hx = tx != null ? tx : W/2;
    phase = 'skyup'; A.tone(420, .15, 'sine', .05); say('☁️ Up, up and away! Touch flying creatures to catch them', 2); refreshBar(); };
  const skyCatch = o => { const v = fin(skyVal(o.f, alt + o.r) * (o.gold ? 5 : 1)), p = fin(skyPts(o.f, alt + o.r) * (o.gold ? 2 : 1));
    if (t - lastCatch < 1.6) combo++; else combo = 0; lastCatch = t; caught.push({f:o.f, v:fin(v * (1 + combo*(.1 + .04*SUL('scombo')))), p, gold:o.gold, h:hitHook}); o.dead = true; hitHook = 0;
    A.tone(620 + Math.min(10, combo)*60, .05, 'triangle', .04); if (o.f.r >= 3 || o.gold) A.sfx('coin'); };
  // 🐦 BIRD!!: only in the Bwird Zone, only once every other sky creature is in your Sky Book, 10 times a second at 0.00000000000000000000001%
  const spawnBIRD = () => { if (skyCr.some(o => !o.dead && o.f === BIRDMAX)) return; skyCr.push({f:BIRDMAX, x:W/2, r:phase == 'skyup' ? 40 : -40, vx:8, ph:0, gold:false}); say('🐦 BIRD!! — THE BIGGEST BIRD IN THE WORLD IS HERE!!!', 6); flash = 1; A.sfx('win'); };
  const catchBIRD = o => { skyCatch(o); flash = 1; say('🐦🐦 YOU CAUGHT BIRD!! 🐦🐦', 8);
    SG.feathers = Number.MAX_VALUE; SG.run = Number.MAX_VALUE; SG.tot = Number.MAX_VALUE; SUP.forEach(u => { SG.upg[u.k] = u.max != null ? u.max : 200; });
    save(); try { api.jackpot && api.jackpot('🐦 BIRD!!'); } catch(e){} stat(api, 'skyBIRD', 1, 'add'); refreshBar(); };
  const skyStep = dt => { const up = phase == 'skyup', full = caught.length >= skyCap();
    const v = (up ? riseEff() : fallEff() * (full ? 4 : 1)) * slowF(), room = up ? Math.max(0, skyMax - alt) : Math.max(0, alt), step = Math.min(v*dt, room);
    visBoost = !up && full ? 4 : 1; const vis = Math.min(step, visV()*dt); alt = up ? alt + step : alt - step; skyScroll = (skyScroll + (up ? vis : -vis)) % 1e6;
    skyHY += ((up ? 340 : 240) - skyHY) * Math.min(1, dt*3);
    for (const o of skyCr) { o.r += up ? -vis : vis; o.x += o.vx*dt; if (o.x < -40) o.x = W + 40; if (o.x > W + 40) o.x = -40; }
    skyCr = skyCr.filter(o => !o.dead && Math.abs(o.r) < 260 && alt + o.r > 2);
    if (up) { skyHi -= vis; while (skyHi < 170) { skyBand(skyHi, 12); skyHi += 12; } } else { skyLo += vis; while (skyLo > -170) { skyBand(skyLo - 12, 12); skyLo -= 12; } }
    const z = skyZ(alt); if (z != lastSkyZ) { if (lastSkyZ >= 0) { zoneShow = (up ? '⬆ ' : '⬇ ') + SKYZ[z].n + ' · ' + fmt(SKYZ[z].a) + ' m'; zoneT = 2; A.sfx('blip'); } lastSkyZ = z; }
    if (z == SKYZ.length - 1 && allSkyCaught()) { bT += dt; while (bT >= .1) { bT -= .1; if (Math.random() < 1e-12 && Math.random() < 1e-13) spawnBIRD(); } }
    const mag = up ? 0 : 3*SUL('sgrab');
    for (const o of skyCr) { if (o.dead) continue; const sz = o.zap ? 26 : o.f.s; if (Math.abs(o.r*PXM) > sz*.6 + 10 + mag) continue;
      if (o.f && o.f.special == 'birdmax') { if (nearHook(o.x, sz*.9 + 12)) catchBIRD(o); continue; }
      if (o.zap) { if (Math.abs(o.x - hx) > 34 || t - (o.hitT || -9) < 1.2) continue; o.hitT = t; flash = .5;
        if (shieldN > 0) { shieldN--; A.tone(900, .06, 'sine', .04); say('⚡ Your Lightning Rod caught the zap!', 1.4); continue; }
        let li = -1; for (let q = caught.length - 1; q >= 0; q--) { const kk = caught[q].f.k; if (book()[kk] || caught.findIndex(c2 => c2.f.k == kk) < q) { li = q; break; } }
        if (li < 0) { A.sfx('bad'); say('⚡ Zap! Your new creatures held on', 1.4); continue; } const lost = caught.splice(li, 1)[0]; A.sfx('bad'); say('⚡ Lightning! Your ' + lost.f.n + ' flew away', 1.8); continue; }
      if (full || !nearHook(o.x, sz + 12 + mag)) continue; skyCatch(o);
      if (caught.length >= skyCap()) { say(up ? 'Basket full! Floating back down' : 'Basket full! Zooming down', 1.2); if (up) { phase = 'skydown'; refreshBar(); } break; } }
    if (phase == 'skyup' && alt >= skyMax * (1 - 1e-12)) { phase = 'skydown'; say('Top of the string! Coming down: grab more on the way', 1.6); A.sfx('blip'); refreshBar(); }
    if (alt > (SG.best || 0)) SG.best = alt;
    if (phase == 'skydown' && alt <= 0) { alt = 0; skyCr = []; finishSky(); } };
  const finishSky = () => { phase = 'tally'; let fe = 0, pts = 0; const b = book(), news = [];
    caught.forEach(x => { fe += x.v; pts += x.p; if (!b[x.f.k]) news.push(x.f.n); b[x.f.k] = (b[x.f.k]||0) + 1; stat(api,'skyCaught',1,'add'); });
    fe = fin(fe * featherMult()); SG.feathers = fin(SG.feathers + fe); SG.run = fin(SG.run + fe); SG.tot = fin(SG.tot + fe);
    score = fin(score + pts); api.score(score); tally = {coins:fe, cur:'🪶', pts, n:caught.length, news, list:caught.slice(0, 40), bounty:0, at:t, sky:true}; save(); refreshBar();
    A.sfx(caught.length ? 'win' : 'blip'); if (news.length) setTimeout(() => A.sfx('coin'), 300); };
  // 🎈 the sky's own upgrade shop (paid with 🪶 feathers)
  const SUP = [
    {k:'sline', n:'Longer String', d:L => 'String reaches ' + fmt(skyLineM(L)) + ' → ' + fmt(skyLineM(L+1)) + ' m up', b:10, gr:1.34},
    {k:'snet', n:'Bigger Basket', d:L => 'Hold ' + (5+L) + ' → ' + (6+L) + ' creatures per trip', b:25, gr:1.45},
    {k:'sval', n:'Feather Market', d:L => 'Creatures sell for ×' + fmt(marketM(L)) + ' → ×' + fmt(marketM(L+1)), b:40, gr:1.45},
    {k:'sbig', n:'Bigger Balloon', d:L => 'Rise ' + fmt(riseV(L)) + ' → ' + fmt(riseV(L+1)) + ' m/s', b:20, gr:1.32},
    {k:'schute', n:'Parachute', d:L => 'Come down ' + fmt(fallV(L)) + ' → ' + fmt(fallV(L+1)) + ' m/s', b:20, gr:1.32},
    {k:'swing', n:'Kite Steering', d:L => 'Lure moves ' + (100+10*L) + '% → ' + (110+10*L) + '% as fast', b:25, gr:1.32, max:20},
    {k:'sluck', n:'Lucky Seeds', d:L => 'Rare & Epic creatures +' + (12*L) + '% → +' + (12*L+12) + '%', b:50, gr:1.42},
    {k:'sgrab', n:'Sticky Lure', d:L => 'Grab creatures from ' + (3*L) + ' → ' + (3*L+3) + ' px farther away (coming down)', b:80, gr:1.5, max:15},
    {k:'srod', n:'Lightning Rod', d:L => 'Block ' + L + ' → ' + (L+1) + ' lightning zaps per trip', b:120, gr:1.55},
    {k:'sgold', n:'Golden Seeds', d:L => 'Golden creatures (×5): ' + goldP(L).toFixed(1) + '% → ' + goldP(L+1).toFixed(1) + '%', b:150, gr:1.45, max:40},
    {k:'scombo', n:'Flock Charm', d:L => 'Each creature in a row adds +' + (10+4*L) + '% → +' + (14+4*L) + '%', b:90, gr:1.45},
    {k:'snew', n:'Fresh Birdseed', d:L => 'Creatures missing from your Sky Book show up ×' + (1+.4*L).toFixed(1) + ' → ×' + (1+.4*(L+1)).toFixed(1) + ' as often', b:120, gr:1.5, max:20},
    {k:'sballoons', n:'Extra Balloons', d:L => L >= 4 ? 'Flying 5 lures side by side (max)' : 'Fly ' + (1+L) + ' → ' + (2+L) + ' lures side by side (they share your basket)', b:5000, gr:12, max:4},
    {k:'srocket', n:'Rocket Balloon', d:L => 'String ×' + fmt(skySpoolM(L)) + ' → ×' + fmt(skySpoolM(L+1)) + ' as long (about 1 new sky every 4 levels)', b:2e4, gr:1.4, max:60},
    {k:'sjet', n:'Jet Burner', d:L => 'Rise & fall ×' + fmt(Math.pow(2, L)) + ' → ×' + fmt(Math.pow(2, L+1)) + ' faster', b:1e4, gr:4, max:40},
    {k:'sbuddy', n:'Bird Buddy', d:L => 'Earns ' + fmt(sbuddyRate(L)) + ' → ' + fmt(sbuddyRate(L+1)) + ' feathers/s for you', b:250, gr:1.42},
    {k:'ssonar', n:'Bird Radar', d:L => ['Shows what each creature is worth', 'Creatures missing from your Sky Book sparkle', 'Maxed!'][Math.min(2, L)], b:400, gr:6, max:2}];
  const scost = (u, L) => Math.ceil(Math.min(1e300, u.b * Math.pow(u.gr, L)));
  const sbuy = (u, n) => { let k = 0; while (k < n && (u.max == null || SUL(u.k) < u.max) && SG.feathers >= scost(u, SUL(u.k))) { SG.feathers -= scost(u, SUL(u.k)); SG.upg[u.k] = SUL(u.k) + 1; k++; }
    if (k) { A.sfx('coin'); save(); refreshBar(); } else A.sfx('bad'); drawPanel(); };
  // ======================= 🎣 FISHING PLANET: cast from the shore, watch the bobber, strike, then fight the fish (don't snap the line!) =======================
  G.planet = Object.assign({bucks:0, upg:{}, bait:'worm', baits:{worm:1}, lake:'pond', lakes:{pond:1}, rec:{}, tot:0}, G.planet || {}); const PG = G.planet;
  const PUL = k => PG.upg[k] || 0;
  const PLAKES = [{k:'pond', n:'Sunny Pond', cost:0, mult:1, sky:'#9fd8ff', hill:'#5a8a3a', water:['#4a9ab8', '#1a5a70']}, {k:'creek', n:'Pine Creek', cost:300, mult:1.6, sky:'#bfe4ff', hill:'#2f6a3a', water:['#5aa8b0', '#1a4a50']},
    {k:'river', n:'Muddy River', cost:3000, mult:2.6, sky:'#d8e8f0', hill:'#6a7a3a', water:['#8a8a5a', '#4a4a2a']}, {k:'mountain', n:'Mountain Lake', cost:2e4, mult:4.2, sky:'#a8d8ff', hill:'#7a8aa0', peaks:true, water:['#3a8ac8', '#103a60']},
    {k:'bigblue', n:'Big Blue Lake', cost:1.5e5, mult:7, sky:'#8fd0ff', hill:'#3a6a4a', water:['#2a7ad8', '#0a2a60']}];
  const PBAITS = [{k:'worm', n:'🪱 Worm', cost:0}, {k:'corn', n:'🌽 Corn', cost:50}, {k:'spinner', n:'🥄 Spinner', cost:200}, {k:'minnow', n:'🐟 Live Minnow', cost:1000}, {k:'liver', n:'🍗 Chicken Liver', cost:3000}];
  // name, waters, baits, min kg, max kg, trophy kg, bucks per kg, fight power, how common
  const PFISH = [['Bluegill', 'pond creek river', 'worm corn', .05, .6, .45, 4, .5, 10], ['Yellow Perch', 'pond mountain bigblue', 'worm minnow', .1, .9, .7, 5, .55, 9], ['Crappie', 'pond river', 'minnow worm', .2, 1.5, 1.1, 6, .6, 7],
    ['Rainbow Trout', 'creek mountain', 'worm spinner', .5, 5, 3.5, 10, 1, 7], ['Brown Trout', 'creek mountain', 'spinner minnow', .5, 8, 6, 12, 1.1, 5], ['Largemouth Bass', 'pond bigblue', 'spinner worm minnow', .5, 8, 5, 12, 1.2, 6],
    ['Smallmouth Bass', 'creek river', 'spinner worm', .4, 4, 3, 12, 1.2, 6], ['Walleye', 'bigblue river', 'minnow spinner', .6, 8, 6, 14, 1.1, 5], ['Channel Catfish', 'river pond', 'liver worm', 1, 20, 12, 8, 1.3, 5],
    ['Common Carp', 'river bigblue pond', 'corn', 1, 30, 18, 7, 1.4, 6], ['Northern Pike', 'bigblue mountain', 'spinner minnow', 1, 20, 12, 14, 1.5, 4], ['Muskellunge', 'bigblue', 'spinner', 3, 30, 22, 20, 1.7, 1.2],
    ['Lake Sturgeon', 'river bigblue', 'liver minnow', 5, 90, 60, 18, 1.8, .8], ['Longnose Gar', 'river', 'minnow', 1, 15, 10, 12, 1.4, 2], ['Arctic Char', 'mountain', 'spinner minnow', .5, 9, 7, 16, 1.2, 3], ['Golden Trout', 'mountain creek', 'spinner worm', .3, 3, 2.4, 45, 1, .5]]
    .map(([n, lk, bt, min, max, troph, val, pow, w]) => { const lo = mkLook(n, 3, 1); return {k:'planet-' + n.toLowerCase().replace(/[^a-z]+/g, '-'), n, lakes:lk.split(' '), baits:bt.split(' '), min, max, troph, val, pow, w, look:lo, get col(){ return this.look.col; }, s:30, r:w >= 5 ? 1 : w >= 2 ? 2 : w >= 1 ? 3 : 4, planet:true}; });
  const PUP = [
    {k:'prod', n:'Stronger Rod & Line', d:L => 'Line holds ' + fmt(lineKg(L)) + ' → ' + fmt(lineKg(L+1)) + ' kg (big fish need a strong line)', b:30, gr:1.6},
    {k:'preel', n:'Faster Reel', d:L => 'Reel ' + reelSpd(L).toFixed(1) + ' → ' + reelSpd(L+1).toFixed(1) + ' m/s', b:25, gr:1.5, max:30},
    {k:'pcast', n:'Long-Cast Rod', d:L => 'Cast up to ' + (26 + 5*L) + ' → ' + (31 + 5*L) + ' m (far casts find bigger fish)', b:40, gr:1.55, max:12},
    {k:'pbobber', n:'Sensitive Bobber', d:L => 'Time to strike ' + (.9 + .15*L).toFixed(2) + ' → ' + (.9 + .15*(L+1)).toFixed(2) + ' s', b:30, gr:1.6, max:6},
    {k:'pdrag', n:'Smooth Drag', d:L => 'Line tension ' + Math.round(100 - 100*Math.pow(.93, L)) + '% → ' + Math.round(100 - 100*Math.pow(.93, L+1)) + '% lower', b:60, gr:1.6, max:10},
    {k:'plure', n:'Fish Attractor', d:L => 'Bites come ' + (5*L) + '% → ' + (5*L+5) + '% sooner and bigger fish bite more', b:50, gr:1.55, max:15},
    {k:'pmarket', n:'Fish Market', d:L => 'Fish sell for ×' + fmt(Math.pow(1.15, L)) + ' → ×' + fmt(Math.pow(1.15, L+1)), b:80, gr:1.5}];
  const lineKg = L => 2 * Math.pow(1.25, L), reelSpd = L => 3 * (1 + .15*L), maxCast = () => 26 + 5*PUL('pcast');
  const pLake = () => PLAKES.find(L => L.k == PG.lake) || PLAKES[0];
  let pPow = 0, pDir = 1, pCast = 0, pT = 0, pBite = 0, pNibs = [], pFish = null, pKg = 0, pDist = 0, pTen = 0, pStam = 1, pSurge = false, pSurgeT = 0, pJump = 0;
  const pCands = () => PFISH.filter(f => f.lakes.includes(PG.lake) && f.baits.includes(PG.bait));
  const pStartCharge = () => { if (panel) closePanel(); phase = 'pCharge'; pPow = 0; pDir = 1; refreshBar(); };
  const pDoCast = () => { pCast = 5 + pPow * (maxCast() - 5); phase = 'pCast'; pT = 0; A.tone(300, .2, 'triangle', .05); refreshBar(); };
  const pSetBite = () => { const c = pCands(); if (!c.length) { pBite = Infinity; pNibs = []; say('Nothing here bites on ' + (PBAITS.find(b => b.k == PG.bait) || {}).n + ' · try another bait or water', 3); return; }
    let S = c.reduce((a, f) => a + f.w * (PG.rec[f.k] ? 1 : 1.5), 0), x = Math.random()*S; pFish = c[c.length - 1]; for (const f of c) { x -= f.w * (PG.rec[f.k] ? 1 : 1.5); if (x <= 0) { pFish = f; break; } }
    const wait = (2.5 + Math.random()*6) * (1 - .05*Math.min(15, PUL('plure'))) * (isNight() ? .8 : 1); pBite = pT + wait; pNibs = []; const nn = Math.floor(Math.random()*3); for (let i = 0; i < nn; i++) pNibs.push(pT + wait * (.35 + .5*Math.random())); };
  const pWin = () => .9 + .15*PUL('pbobber');
  const pStrike = () => { if (pT >= pBite && pT <= pBite + pWin()) { pStartFight(); return; }
    if (pNibs.some(n => pT >= n - .1 && pT <= n + .5)) { say('Too early! That was just a nibble… it swam off', 2); A.sfx('bad'); pSetBite(); return; } say('Wait for the bobber to go UNDER, then strike!', 1.6); };
  const pStartFight = () => { const far = Math.min(1, pCast / maxCast()), e = Math.max(.6, 2.2 - .9*far - .04*PUL('plure'));
    pKg = +(pFish.min + (pFish.max - pFish.min) * Math.pow(Math.random(), e)).toFixed(pFish.max < 2 ? 2 : 1); pDist = pCast; pTen = .25; pStam = 1; pSurge = true; pSurgeT = .8; phase = 'pFight'; A.sfx('hit'); say('🎣 Fish on! Hold to reel · let go when the line gets tight!', 2.4); refreshBar(); };
  const pLose = why => { say(why, 3); A.sfx('bad'); phase = 'surface'; tally = null; pFish = null; refreshBar(); };
  const pLand = () => { const f = pFish, kg = pKg, cm = Math.round(10 + 42*Math.cbrt(kg)), trophy = kg >= f.troph, r0 = PG.rec[f.k], first = !r0, best = !r0 || kg > r0.best;
    const val = fin((f.val*kg + 3) * pLake().mult * Math.pow(1.15, PUL('pmarket')) * (trophy ? 3 : 1)), pts = Math.round((kg*20 + 50) * (trophy ? 3 : 1));
    PG.rec[f.k] = {n:(r0 ? r0.n : 0) + 1, best:Math.max(r0 ? r0.best : 0, kg), trophy:(r0 && r0.trophy) || trophy}; PG.bucks = fin(PG.bucks + val); PG.tot = fin((PG.tot || 0) + val);
    score = fin(score + pts); api.score(score); stat(api, 'planetCaught', 1, 'add'); if (trophy) stat(api, 'planetTrophy', 1, 'add');
    tally = {planet:true, f, kg, cm, coins:val, cur:'💵', pts, trophy, first, best, n:1, news:[], list:[], at:t}; phase = 'tally'; save(); refreshBar(); A.sfx('win'); };
  const planetStep = dt => { const hold = K[' '] || ptrDown || slowHeld;
    if (phase == 'pCharge') { pPow += pDir*dt*1.1; if (pPow > 1) { pPow = 1; pDir = -1; } if (pPow < 0) { pPow = 0; pDir = 1; } if (!hold) pDoCast(); return; }
    if (phase == 'pCast') { pT += dt; if (pT >= .7) { phase = 'pWait'; pT = 0; pSetBite(); refreshBar(); } return; }
    if (phase == 'pWait') { pT += dt; if (pT > pBite + pWin()) { say('It stole your bait! Wait for the next bite…', 1.8); pSetBite(); } return; }
    if (phase != 'pFight') return;
    const power = pKg / lineKg(PUL('prod')) * pFish.pow;
    pSurgeT -= dt; if (pSurgeT <= 0) { pSurge = !pSurge; pSurgeT = pSurge ? .6 + Math.random()*1.2*(.4 + pStam) : .8 + Math.random()*1.6; if (pSurge && Math.random() < .35) pJump = .6; }
    pJump = Math.max(0, pJump - dt);
    const pull = Math.min(2.5, power) * (pSurge ? 1 : .35) * (.4 + .6*pStam);
    const target = (pull*(hold ? 1 : .45) + (hold ? .18 : 0)) * Math.pow(.93, PUL('pdrag'));
    pTen += (target - pTen) * Math.min(1, dt*3);
    if (hold) pDist -= reelSpd(PUL('preel')) * dt * (1 - Math.min(.85, pull*.5)); else if (pSurge) pDist += pull*1.5*dt;
    pStam = Math.max(0, pStam - dt*(.03 + .1*pTen));
    if (pTen >= 1) { pLose('💥 SNAP! The line broke and the fish got away. Let go of reeling when the tension bar turns red.'); return; }
    if (pDist > pCast + 25) { pLose('The fish ran off with all your line! Reel in between its runs.'); return; }
    if (pDist <= 0) pLand(); };
  const startReel = why => { if (phase == 'skyup') { phase = 'skydown'; if (why) say(why, 1.4); A.sfx('blip'); refreshBar(); return; } if (phase != 'drop') return; phase = 'reel'; combo = 0; lastCatch = -9; if (why) say(why, 1.6); A.sfx('blip'); refreshBar(); };
  const catchIt = o => { const v = fin(fishVal(o.f, AB(o.d)) * (o.gold ? 5 : 1)), p = fin(fishPts(o.f, AB(o.d)) * (o.gold ? 2 : 1));
    if (t - lastCatch < 1.6) combo++; else combo = 0; lastCatch = t; caught.push({f:o.f, v:v * (1 + combo*(.1 + .04*UL('combo'))), p, gold:o.gold, h:hitHook}); o.dead = true; hitHook = 0;
    A.tone(500 + Math.min(10, combo)*60, .05, 'square', .04); if (o.f.r >= 3 || o.gold) A.sfx('coin'); };
  const finishDive = () => { fish = fish.filter(o => !o.dead && o.d >= 1); phase = 'tally'; let coins = 0, pts = 0; const b = book(), news = [];
    caught.forEach(x => { coins += x.v; pts += x.p; if (!b[x.f.k]) news.push(x.f.n); b[x.f.k] = (b[x.f.k]||0) + 1; stat(api,'fishCaught',1,'add'); if (x.f.r >= 3) stat(api,'fishRare',1,'add'); });
    coins = fin(coins * coinMult()); let bonus = 0; fillBounties();
    caught.forEach(x => { const bq = G.bounties.find(b => b.k == x.f.k && b.have < b.need); if (bq) { bq.have++; if (bq.have >= bq.need) { bonus += bq.reward; A.sfx('win'); } } }); if (bonus) { coins = fin(coins + bonus); setTimeout(() => say('📜 Bounty complete! +🪙' + fmt(bonus), 2.5), 300); } fillBounties();
    G.coins = fin(G.coins + coins); G.run = fin(G.run + coins); G.tot = fin(G.tot + coins); G.dives++; G.caught += caught.length;
    score = fin(score + pts); api.score(score); tally = {coins, pts, n:caught.length, news, list:caught.slice(0, 40), bounty:bonus, at:t}; save(); refreshBar();
    A.sfx(caught.length ? 'win' : 'blip'); if (news.length) setTimeout(() => A.sfx('coin'), 300); };
  const preview = () => { caught = []; genUp = -1; base = 0; fish = fish.filter(o => !o.dead && !o.pred && o.d >= 0 && o.d < 150);
    // keep the fish that are still swimming under the boat, fill in any empty stretches, and make fresh fish everywhere below 150 m on the next dive
    for (let b0 = 1; b0 < 150; b0 += 12) if (!fish.some(o => o.d >= b0 - 3 && o.d < b0 + 15)) spawnBand(b0, 12); genTo = 150; };   // fish swimming under the boat while you get ready
  const toSurface = () => { fish = fish.filter(o => !o.dead && o.d >= 1); phase = 'surface'; tally = null; rollWeather(); preview(); refreshBar(); };
  const press = () => { if (quiz) return; if (st != 'play') { reset(); st = 'play'; refreshBar(); return; }
    if (phase == 'surface') { if (inPlanet()) pStartCharge(); else if (inSky()) startSky(); else startDive(); } else if (phase == 'pWait') pStrike(); else if (phase == 'tally') toSurface(); };
  const reset = () => { if (__skip) { __skip = false; phase = 'surface'; preview(); return; } score = 0; api.score(0); phase = 'surface'; tally = null; caught = []; preview(); };
  const offK = A.keys(e => { if (panel && e.key == 'Escape') { closePanel(); return; } if (e.key == ' ' || e.key == 'Enter') { if (!panel) press(); }
    if ((e.key == 'q' || e.key == 'Q') && st == 'play' && phase == 'pWait') { say('Reeled in', 1); toSurface(); }
    if ((e.key == 'q' || e.key == 'Q') && st == 'play' && (phase == 'drop' || phase == 'skyup') && !quiz) startReel(phase == 'skyup' ? 'Coming down!' : 'Coming up!');
    if ((e.key == 'u' || e.key == 'U') && phase == 'surface' && st == 'play') openPanel(inPlanet() ? 'pshop' : inSky() ? 'sup' : 'up'); if ((e.key == 'b' || e.key == 'B') && st == 'play') openPanel(inPlanet() ? 'pbook' : inSky() ? 'sbook' : 'book'); });
  const toX = e => { const r = c.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; };
  c.addEventListener('pointerdown', e => { ptrDown = true; tx = toX(e); try { c.setPointerCapture(e.pointerId); } catch(_){} if (st != 'play' || phase == 'surface' || phase == 'tally' || phase == 'pWait') press(); });
  c.addEventListener('pointermove', e => { if (e.pointerType == 'mouse' || ptrDown) tx = toX(e); });
  ['pointerup','pointercancel'].forEach(k => c.addEventListener(k, () => { ptrDown = false; }));

  // ---------- buttons + panels (shop, spots, book, pearls) ----------
  const bar = el('div', {display:'flex', gap:'6px', padding:'6px 0 0', flexWrap:'wrap', justifyContent:'center'}); wrap.appendChild(bar);
  const mk = (txt, fn, bg, fg) => { const b = el('button', {background:bg||'#015640', color:fg||'#fff', border:'none', borderRadius:'999px', padding:'8px 12px', font:'700 13px '+A.font, cursor:'pointer'}, txt); b.tabIndex = -1; b.onclick = e => { e.stopPropagation(); b.blur(); fn(); }; return b; };
  const bUp = mk('🛒 Upgrades', () => openPanel(inPlanet() ? 'pshop' : inSky() ? 'sup' : 'up')), bSpot = mk('🗺 Spots', () => openPanel(inPlanet() ? 'plakes' : 'spot')), bBook = mk('📖 Fish Book', () => openPanel(inPlanet() ? 'pbook' : inSky() ? 'sbook' : 'book')), bPearl = mk('🦪 Pearls', () => openPanel('pearl')), bMix = mk('🎯 Bait mix', () => openPanel('mix')), bReel = mk('⏫ Come up now · Q', () => { if (phase == 'pWait') { say('Reeled in', 1); toSurface(); return; } startReel(phase == 'skyup' ? 'Coming down!' : 'Coming up!'); }, '#FF4539'), bSlow = mk('🐢 Hold to slow · Space', () => {}, '#015640');
  bSlow.style.touchAction = 'none'; bSlow.addEventListener('pointerdown', e => { e.preventDefault(); slowHeld = true; try { bSlow.setPointerCapture(e.pointerId); } catch(_){} }); ['pointerup', 'pointercancel', 'pointerleave'].forEach(k => bSlow.addEventListener(k, () => { slowHeld = false; }));
  const bBoat = mk('⛵ Boat', () => openPanel('boat')), bSky = mk('☁️ Sky fishing', () => { G.fmode = G.fmode == 'sea' ? 'sky' : G.fmode == 'sky' ? 'planet' : 'sea'; G.skyMode = G.fmode == 'sky'; save(); if (panel) closePanel(); refreshBar(); say(G.fmode == 'sky' ? '☁️ Sky fishing! Your balloon lure floats UP into the sky' : G.fmode == 'planet' ? '🎣 Fishing Planet! Cast from the shore, strike, and fight the fish' : '🌊 Back to fishing in the sea', 2.4); }, '#3f8fd8');
  [bUp, bSpot, bMix, bBook, bPearl, bBoat, bSky, bSlow, bReel].forEach(b => bar.appendChild(b));
  // Express Drop: choose how much of the line to skip (0% up to what your upgrade allows)
  const skipBox = el('label', {display:'none', alignItems:'center', gap:'6px', background:'rgba(0,0,0,.35)', borderRadius:'999px', padding:'4px 12px', font:'700 13px '+A.font, color:'#e8f4ec'});
  const skipIn = el('input', {width:'120px', accentColor:'#00B451'}); skipIn.type = 'range'; skipIn.min = 0; skipIn.step = 1; skipIn.tabIndex = -1;
  const skipTx = el('span', {minWidth:'92px'}); skipBox.appendChild(el('span', {}, '⏬ Skip')); skipBox.appendChild(skipIn); skipBox.appendChild(skipTx); bar.appendChild(skipBox);
  skipIn.addEventListener('pointerdown', e => e.stopPropagation()); skipIn.addEventListener('keydown', e => e.stopPropagation());
  skipIn.addEventListener('input', () => { G.skip = +skipIn.value; skipTx.textContent = skipIn.value + '% · ' + fmt(Math.floor(lineUse() / 100 * skipPct())) + ' m'; });
  skipIn.addEventListener('change', () => { save(); skipIn.blur(); });
  // 📏 Depth, ⬇ Sink and ⬆ Reel: a slider for quick changes plus a box to type an exact number (1 up to your maximum)
  const numBox = () => { const n = el('input', {width:'92px', font:'700 13px '+A.font, border:'1.5px solid rgba(232,244,236,.4)', borderRadius:'8px', padding:'3px 6px', background:'rgba(255,255,255,.1)', color:'#ffffff'}); n.type = 'number'; n.min = 1; n.tabIndex = -1; n.inputMode = 'decimal';
    ['pointerdown', 'keydown', 'keyup'].forEach(k => n.addEventListener(k, e => e.stopPropagation())); n.addEventListener('keydown', e => { if (e.key == 'Enter') n.blur(); }); return n; };
  const logTo = (v, mx) => Math.round(1000 * Math.log(Math.max(1, v)) / Math.log(Math.max(2, mx))), logFrom = (p2, mx) => Math.max(1, Math.round(Math.exp(Math.log(Math.max(2, mx)) * p2 / 1000)));
  const control = (label, unit, get, set, mx) => { const box = el('label', {display:'flex', alignItems:'center', gap:'6px', background:'rgba(0,0,0,.35)', borderRadius:'999px', padding:'4px 12px', font:'700 13px '+A.font, color:'#e8f4ec'});
    const sl = el('input', {width:'110px', accentColor:'#00B451'}); sl.type = 'range'; sl.min = 0; sl.max = 1000; sl.step = 1; sl.tabIndex = -1; ['pointerdown', 'keydown'].forEach(k => sl.addEventListener(k, e => e.stopPropagation()));
    const nb = numBox(), tx = el('span', {font:'600 12px '+A.font, color:'#9fc4b5', minWidth:'70px'});
    box.appendChild(el('span', {}, label)); box.appendChild(sl); box.appendChild(nb); box.appendChild(el('span', {}, unit)); box.appendChild(tx); bar.appendChild(box);
    const show = (fromBox) => { const m = mx(), v = get(); sl.value = logTo(v, m); if (!fromBox) nb.value = Math.round(v); nb.max = Math.round(m); tx.textContent = '/ ' + fmt(m) + (v >= m ? ' (max)' : ''); };
    sl.addEventListener('input', () => { const m = mx(), p2 = +sl.value; set(p2 >= 1000 ? null : logFrom(p2, m)); show(); refreshMore(); }); sl.addEventListener('change', () => { save(); sl.blur(); });
    nb.addEventListener('input', () => { const v = parseFloat(nb.value); if (!(v > 0)) return; const m = mx(); set(v >= m ? null : Math.max(1, v)); show(true); refreshMore(); });
    nb.addEventListener('change', () => { show(); save(); }); return {box, show}; };
  const depCtl = control('📏 Depth', 'm', () => lineUse(), v => { G.lineCap = v; }, () => lineM(UL('line')));
  const sinkCtl = control('⬇ Sink', 'm/s', () => { const v = speedNow('sinkMS', sinkMax()); return v != null ? v : Math.min(sinkMax(), Math.max(20, lineUse() / 3)); }, v => { G.sinkMS = v; G.sinkPct = null; }, () => sinkMax());
  const reelCtl = control('⬆ Reel', 'm/s', () => { const v = speedNow('reelMS', reelMax()); return v != null ? v : Math.min(reelMax(), Math.max(20, lineUse() / 3)); }, v => { G.reelMS = v; G.reelPct = null; }, () => reelMax());
  const sDepCtl = control('🎈 String', 'm', () => skyUse(), v => { SG.cap = v; }, () => skyLineM(SUL('sline')));
  const sUpCtl = control('⬆ Rise', 'm/s', () => SG.upMS != null ? Math.min(riseV(SUL('sbig')), SG.upMS) : Math.min(riseV(SUL('sbig')), Math.max(14, skyUse() / 8)), v => { SG.upMS = v; }, () => riseV(SUL('sbig')));
  const sDownCtl = control('⬇ Fall', 'm/s', () => SG.downMS != null ? Math.min(fallV(SUL('schute')), SG.downMS) : Math.min(fallV(SUL('schute')), Math.max(14, skyUse() / 8)), v => { SG.downMS = v; }, () => fallV(SUL('schute')));
  const sinkSl = sinkCtl, reelSl = reelCtl, depBox = depCtl.box;
  const refreshMore = () => { try { [depCtl, sinkCtl, reelCtl, sDepCtl, sUpCtl, sDownCtl].forEach(c2 => c2.show()); if (typeof skipTx != 'undefined') skipTx.textContent = skipPct() + '% · ' + fmt(Math.floor(lineUse() / 100 * skipPct())) + ' m'; } catch(e){} };
  // Ghost Lure: choose which fish your hook ignores on the way down (up to what your upgrade allows)
  const ghostBox = el('div', {display:'none', alignItems:'center', gap:'4px', background:'rgba(0,0,0,.35)', borderRadius:'999px', padding:'4px 8px', font:'700 13px '+A.font, color:'#e8f4ec', flexWrap:'wrap'});
  bar.appendChild(ghostBox);
  const drawGhost = () => { ghostBox.innerHTML = ''; ghostBox.appendChild(el('span', {padding:'0 4px'}, '👻 Ignore')); const mx = Math.min(3, UL('ghost')), cur = ghostTier();
    ['Off', 'Common', '≤ Uncommon', '≤ Rare'].slice(0, mx + 1).forEach((n, k) => { const b = mk(n, () => { G.ghostSel = k; save(); drawGhost(); }, cur == k ? '#D5F367' : 'transparent', cur == k ? '#015640' : '#e8f4ec'); b.style.padding = '4px 9px'; b.style.fontSize = '12px'; if (cur != k) b.style.border = '1.5px solid rgba(232,244,236,.35)'; ghostBox.appendChild(b); }); };
  function refreshBar(){ const dive = st == 'play' && (phase == 'drop' || phase == 'reel' || skyPh() || (phase[0] == 'p' && phase.length > 1 && phase[1] == phase[1].toUpperCase())); [bUp, bSpot, bPearl, bMix, bBoat, bSky].forEach(b => b.style.display = dive ? 'none' : ''); [bSpot, bPearl, bMix].forEach(b => { if (inSky()) b.style.display = 'none'; }); if (inPlanet()) [bPearl, bMix, bBoat].forEach(b => b.style.display = 'none');
    bSky.textContent = G.fmode == 'sea' ? '☁️ Sky fishing' : G.fmode == 'sky' ? '🎣 Fishing Planet' : '🌊 Fish the sea'; bUp.textContent = inPlanet() ? '🛒 Tackle Shop' : inSky() ? '🎈 Sky Upgrades' : '🛒 Upgrades'; bBook.textContent = inPlanet() ? '🏆 Trophies' : inSky() ? '🐦 Sky Book' : '📖 Fish Book'; bSpot.textContent = inPlanet() ? '🗺 Waters' : '🗺 Spots';
    bReel.style.display = st == 'play' && (phase == 'drop' || phase == 'skyup' || phase == 'pWait') ? '' : 'none'; bReel.textContent = phase == 'pWait' ? '⏫ Reel in · Q' : phase == 'skyup' ? '⏬ Come down now · Q' : '⏫ Come up now · Q'; bSlow.style.display = dive && !inPlanet() ? '' : 'none'; if (!dive) slowHeld = false;
    [sinkSl, reelSl, depCtl].forEach(o => { o.box.style.display = dive || inSky() || inPlanet() ? 'none' : 'flex'; o.show(); }); [sDepCtl, sUpCtl, sDownCtl].forEach(o => { o.box.style.display = dive || !inSky() ? 'none' : 'flex'; o.show(); });
    ghostBox.style.display = UL('ghost') > 0 && !dive && !inSky() && !inPlanet() ? 'flex' : 'none'; if (UL('ghost') > 0) drawGhost();
    const sm = skipMax(); skipBox.style.display = sm > 0 && !dive && !inSky() && !inPlanet() ? 'flex' : 'none'; if (sm > 0) { skipIn.max = sm; skipIn.value = skipPct(); skipTx.textContent = skipPct() + '% · ' + fmt(Math.floor(lineUse() / 100 * skipPct())) + ' m'; } }
  function closePanel(){ if (panel) { panel.remove(); panel = null; } armPearl = false; try { refreshBar(); } catch(e){} }
  let bookJump = false;
  function openPanel(tab){ bookJump = tab == 'book'; if (st == 'play' && (phase == 'drop' || phase == 'reel' || skyPh())) return; panelTab = tab; closePanel();
    panel = el('div', {position:'absolute', left:((W - 660)/2)+'px', top:0, width:'660px', height:H+'px', background:'rgba(6,30,44,.97)', borderRadius:'12px', zIndex:5, color:'#fff', display:'flex', flexDirection:'column', boxSizing:'border-box', padding:'12px'});
    panel.addEventListener('pointerdown', e => e.stopPropagation()); wrap.appendChild(panel); drawPanel(); }
  function drawPanel(){ if (!panel) return; const keep = panel.querySelector('.fl-body'), sc = keep ? keep.scrollTop : 0; panel.innerHTML = '';
    const top = el('div', {display:'flex', gap:'6px', alignItems:'center', marginBottom:'8px', flexWrap:'wrap'}); panel.appendChild(top);
    (inPlanet() ? [['pshop','🛒 Tackle Shop'],['plakes','🗺 Waters'],['pbook','🏆 Trophies']] : inSky() ? [['sup','🎈 Sky Upgrades'],['sbook','🐦 Sky Book'],['boat','⛵ Boat']] : [['up','🛒 Upgrades'],['spot','🗺 Spots'],['boat','⛵ Boat'],['mix','🎯 Mix'],['book','📖 Book'],['pearl','🦪 Pearls']]).forEach(([k, n]) => { const b = mk(n, () => { panelTab = k; armPearl = false; bookJump = k == 'book'; drawPanel(); }, panelTab == k ? '#D5F367' : 'rgba(255,255,255,.12)', panelTab == k ? '#015640' : '#fff'); b.style.padding = '6px 10px'; top.appendChild(b); });
    const x = mk('✕', closePanel, 'rgba(255,255,255,.15)'); x.style.marginLeft = 'auto'; top.appendChild(x);
    panel.appendChild(el('div', {font:'800 18px '+A.font, color:['sup', 'sbook'].includes(panelTab) ? '#bfe9ff' : ['pshop', 'plakes', 'pbook'].includes(panelTab) ? '#7fe08a' : '#F9BF01', margin:'2px 0 8px'}, ['sup', 'sbook'].includes(panelTab) ? '🪶 ' + fmt(SG.feathers) + ' feathers' : ['pshop', 'plakes', 'pbook'].includes(panelTab) ? '💵 ' + fmt(PG.bucks) + ' bucks' : '🪙 ' + fmt(G.coins) + ' coins'));
    const body = el('div', {overflowY:'auto', flex:'1', display:'flex', flexDirection:'column', gap:'6px'}); body.className = 'fl-body'; panel.appendChild(body);
    const row = () => { const r = el('div', {display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,.07)', borderRadius:'10px', padding:'8px 10px'}); body.appendChild(r); return r; };
    if (panelTab == 'up') UP.forEach(u => { const L = UL(u.k), maxed = u.max != null && L >= u.max, cst = cost(u, L), r = row();
      const info = el('div', {flex:'1', minWidth:0}); info.appendChild(el('div', {font:'700 14px '+A.font}, u.n + ' · Lv ' + L)); info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, u.d(L))); r.appendChild(info);
      if (maxed) { r.appendChild(el('div', {font:'700 12px '+A.font, color:'#D5F367'}, 'MAX')); return; }
      const can = G.coins >= cst, b1 = mk('🪙 ' + fmt(cst), () => buy(u, 1), can ? '#00B451' : 'rgba(255,255,255,.12)'); b1.style.opacity = can ? 1 : .55; r.appendChild(b1);
      const bm = mk('Max', () => buy(u, 999), can ? '#007a37' : 'rgba(255,255,255,.08)'); bm.style.opacity = can ? 1 : .45; bm.style.padding = '8px 9px'; r.appendChild(bm); });
    if (panelTab == 'sup') SUP.forEach(u => { const L = SUL(u.k), maxed = u.max != null && L >= u.max, cst = scost(u, L), r = row();
      const info = el('div', {flex:'1', minWidth:0}); info.appendChild(el('div', {font:'700 14px '+A.font}, u.n + ' · Lv ' + L)); info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, u.d(L))); r.appendChild(info);
      if (maxed) { r.appendChild(el('div', {font:'700 12px '+A.font, color:'#D5F367'}, 'MAX')); return; }
      const can = SG.feathers >= cst, b1 = mk('🪶 ' + fmt(cst), () => sbuy(u, 1), can ? '#3f8fd8' : 'rgba(255,255,255,.12)'); b1.style.opacity = can ? 1 : .55; r.appendChild(b1);
      const bm = mk('Max', () => sbuy(u, 999), can ? '#1d6fb8' : 'rgba(255,255,255,.08)'); bm.style.opacity = can ? 1 : .45; bm.style.padding = '8px 9px'; r.appendChild(bm); });
    if (panelTab == 'sbook') { const b = book(), found = SKYALL.filter(f => b[f.k]).length;
      body.appendChild(el('div', {font:'600 13px '+A.font, color:'#bfe9ff'}, found + ' of ' + SKYALL.length + ' found · Sky Book bonus ×' + skyBookBonus().toFixed(2) + ' feathers (+3% per full sky, +25% for all of them)'));
      SKY.forEach((zr, z) => { const r = row(); r.style.flexWrap = 'wrap'; r.style.gap = '4px'; r.appendChild(el('div', {width:'100%', font:'600 11px '+A.font, color:z == SKYZ.length - 1 ? '#ff9ad5' : '#8fb9c9'}, SKYZ[z].n + ' · ' + fmt(SKYZ[z].a) + ' m up'));
        zr.forEach(f => { const n = b[f.k] || 0, cell = el('div', {flex:'1 1 45%', display:'flex', alignItems:'center', gap:'6px', font:'600 12px '+A.font, color:n ? RC[f.r] : '#5d7d8a'});
          if (n) { const im = el('img', {width:'46px', height:'30px', flexShrink:0}); im.src = fishIcon(f); cell.appendChild(im); } else cell.appendChild(el('div', {width:'46px', height:'30px', flexShrink:0, borderRadius:'8px', background:'rgba(255,255,255,.06)', textAlign:'center', lineHeight:'30px'}, '?'));
          cell.appendChild(el('span', {}, n ? f.n + ' ×' + n : '??? (' + RN[f.r] + ')')); r.appendChild(cell); }); });
      const rb = row(), nB = b[BIRDMAX.k] || 0, okB = allSkyCaught(); rb.appendChild(el('div', {font:'800 14px '+A.font, color:nB ? RC[9] : '#ff9ad5'}, nB ? '🐦 BIRD!! ×' + nB + ' · the biggest bird in the world' : '🐦 ??? · BIRD!! lives in the Bwird Zone (' + fmt(SKYZ[SKYZ.length - 1].a) + ' m up). ' + (okB ? 'You have every other sky creature, so it can appear now (10 times a second, 0.00000000000000000000001%).' : 'It only appears once every other sky creature is in your Sky Book.'))); }
    if (panelTab == 'pshop') { body.appendChild(el('div', {font:'800 15px '+A.font, color:'#7fe08a'}, '🎣 Gear'));
      PUP.forEach(u => { const L = PUL(u.k), maxed = u.max != null && L >= u.max, cst = scost(u, L), r = row(); const info = el('div', {flex:'1', minWidth:0}); info.appendChild(el('div', {font:'700 14px '+A.font}, u.n + ' · Lv ' + L)); info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, u.d(L))); r.appendChild(info);
        if (maxed) { r.appendChild(el('div', {font:'700 12px '+A.font, color:'#D5F367'}, 'MAX')); return; } const can = PG.bucks >= cst, b1 = mk('💵 ' + fmt(cst), () => { if (PG.bucks < cst) { A.sfx('bad'); return; } PG.bucks -= cst; PG.upg[u.k] = L + 1; A.sfx('coin'); save(); drawPanel(); }, can ? '#00B451' : 'rgba(255,255,255,.12)'); b1.style.opacity = can ? 1 : .55; r.appendChild(b1); });
      body.appendChild(el('div', {font:'800 15px '+A.font, color:'#7fe08a', marginTop:'6px'}, '🪱 Bait (different fish like different bait)'));
      PBAITS.forEach(bt => { const r = row(), have = PG.baits[bt.k], on = PG.bait == bt.k, who = PFISH.filter(f => f.baits.includes(bt.k)).map(f => f.n);
        const info = el('div', {flex:'1', minWidth:0}); info.appendChild(el('div', {font:'700 14px '+A.font, color:on ? '#D5F367' : '#fff'}, bt.n + (on ? ' · on your hook' : ''))); info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, 'Good for: ' + who.slice(0, 6).join(', ') + (who.length > 6 ? '…' : ''))); r.appendChild(info);
        if (on) return; if (have) { r.appendChild(mk('Use', () => { PG.bait = bt.k; save(); drawPanel(); })); return; }
        const can = PG.bucks >= bt.cost, b = mk('💵 ' + fmt(bt.cost), () => { if (PG.bucks < bt.cost) { A.sfx('bad'); return; } PG.bucks -= bt.cost; PG.baits[bt.k] = 1; PG.bait = bt.k; A.sfx('coin'); save(); drawPanel(); }, can ? '#00B451' : 'rgba(255,255,255,.12)'); b.style.opacity = can ? 1 : .55; r.appendChild(b); }); }
    if (panelTab == 'plakes') PLAKES.forEach(Lk => { const r = row(), have = PG.lakes[Lk.k], here = PG.lake == Lk.k, who = PFISH.filter(f => f.lakes.includes(Lk.k)).map(f => f.n); const info = el('div', {flex:'1', minWidth:0});
      info.appendChild(el('div', {font:'700 14px '+A.font, color:here ? '#D5F367' : '#fff'}, Lk.n + (here ? ' · you are here' : ''))); info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, 'Fish worth ×' + Lk.mult + ' · ' + who.join(', '))); r.appendChild(info);
      if (here) return; if (have) { r.appendChild(mk('Fish here', () => { PG.lake = Lk.k; save(); closePanel(); say('Welcome to ' + Lk.n + '!', 2); })); return; }
      const can = PG.bucks >= Lk.cost, b = mk('💵 ' + fmt(Lk.cost), () => { if (PG.bucks < Lk.cost) { A.sfx('bad'); return; } PG.bucks -= Lk.cost; PG.lakes[Lk.k] = 1; PG.lake = Lk.k; A.sfx('win'); save(); closePanel(); say('New water: ' + Lk.n + '!', 2.5); }, can ? '#00B451' : 'rgba(255,255,255,.12)'); b.style.opacity = can ? 1 : .55; r.appendChild(b); });
    if (panelTab == 'pbook') { body.appendChild(el('div', {font:'600 13px '+A.font, color:'#7fe08a'}, Object.keys(PG.rec).length + ' of ' + PFISH.length + ' species caught · ' + PFISH.filter(f => PG.rec[f.k] && PG.rec[f.k].trophy).length + ' trophies'));
      PFISH.forEach(f => { const rc = PG.rec[f.k], r = row(); if (rc) { const im = el('img', {width:'64px', height:'42px', flexShrink:0}); im.src = fishIcon(f); r.appendChild(im); } else r.appendChild(el('div', {width:'64px', height:'42px', flexShrink:0, borderRadius:'8px', background:'rgba(255,255,255,.06)', textAlign:'center', lineHeight:'42px'}, '?'));
        const info = el('div', {flex:'1', minWidth:0}); info.appendChild(el('div', {font:'700 14px '+A.font, color:rc ? (rc.trophy ? '#F9BF01' : '#fff') : '#5d7d8a'}, (rc ? f.n : '???') + (rc && rc.trophy ? ' 🏆' : '')));
        info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, rc ? 'Caught ' + rc.n + ' · best ' + rc.best + ' kg · trophy at ' + f.troph + ' kg' : 'Lives in: ' + f.lakes.map(k => (PLAKES.find(L => L.k == k) || {}).n).join(', ') + ' · bites: ' + f.baits.map(k => (PBAITS.find(b => b.k == k) || {}).n).join(' '))); r.appendChild(info); }); }
    if (panelTab == 'boat') { const cur = G.boat || 0;
      body.appendChild(el('div', {font:'600 13px '+A.font, lineHeight:1.4, color:'#cfe3ec'}, 'Upgrade your boat one step at a time. Every boat keeps the bonuses shown, works for sea AND sky fishing, and looks different on the water.'));
      BOATS.forEach((T, i) => { const r = row(), im = el('img', {width:'96px', height:'84px', flexShrink:0}); im.src = boatIcon(i); r.appendChild(im); const info = el('div', {flex:'1', minWidth:0});
        info.appendChild(el('div', {font:'700 14px '+A.font, color:i == cur ? '#D5F367' : '#fff'}, T.n + (i == cur ? ' · your boat' : '')));
        info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, (i ? '+' + T.hook + ' hook space · coins ×' + T.coin + (T.sky > 1 ? ' · sky creatures worth ×' + T.sky : '') : 'Where every angler starts.'))); r.appendChild(info);
        if (i <= cur) { r.appendChild(el('div', {font:'700 12px '+A.font, color:'#D5F367'}, i == cur ? 'SAILING' : 'OWNED')); return; }
        if (i > cur + 1) { r.appendChild(el('div', {font:'700 12px '+A.font, color:'#8fb9c9'}, '🔒 buy the one above first')); return; }
        const can = G.coins >= T.cost, b = mk('🪙 ' + fmt(T.cost), () => { if (G.coins < T.cost) return; G.coins -= T.cost; G.boat = i; save(); A.sfx('win'); say('⛵ New boat: ' + T.n + '!', 2.5); drawPanel(); refreshBar(); }, can ? '#00B451' : 'rgba(255,255,255,.12)'); b.style.opacity = can ? 1 : .55; r.appendChild(b); }); }
    if (panelTab == 'spot') LOCS.forEach(L => { const r = row(), have = G.locs[L.k], here = G.loc == L.k; const info = el('div', {flex:'1'});
      info.appendChild(el('div', {font:'700 14px '+A.font}, L.n + (here ? ' · you are here' : ''))); info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, 'Fish worth ×' + fmt(L.mult) + ' · ' + ([].concat(...FISH[L.k]).length + SPEC[L.k].length) + ' new fish for your book' + (L.k == 'fwish' ? ' · 🌍 home of FISH!!' : ''))); r.appendChild(info);
      if (here) return; if (have) { r.appendChild(mk('Go fish here', () => { G.loc = L.k; save(); closePanel(); say('Welcome to ' + L.n + '!', 2); })); return; }
      // Fwish Zone: free, but only once every fish from every other spot is in your Fish Book (Godly, DANG and OH DANG!!!! included)
      if (L.needAll) { const need = LOCS.filter(o => o.k != L.k).map(o => [].concat(...FISH[o.k]).concat(SPEC[o.k])).flat(), got = need.filter(f => book()[f.k]).length, ok = got >= need.length;
        info.appendChild(el('div', {font:'700 12px '+A.font, color:ok ? '#D5F367' : '#ffb3ab', marginTop:'2px'}, ok ? 'Every other fish caught · the Fwish Zone is open to you!' : '🔒 Catch every fish in every other spot first: ' + got + ' / ' + need.length));
        const b = mk(ok ? '🌍 Unlock · free' : '🔒 ' + got + '/' + need.length, () => { if (!ok) { A.sfx('bad'); return; } G.locs[L.k] = 1; G.loc = L.k; save(); A.sfx('win'); closePanel(); say('Welcome to the Fwish Zone! FISH!! lives here…', 3); }, ok ? '#00B451' : 'rgba(255,255,255,.12)'); b.style.opacity = ok ? 1 : .55; r.appendChild(b); return; }
      const can = G.coins >= L.cost, b = mk('🪙 ' + fmt(L.cost), () => { if (G.coins < L.cost) return; G.coins -= L.cost; G.locs[L.k] = 1; G.loc = L.k; save(); A.sfx('win'); closePanel(); say('New spot: ' + L.n + '!', 2.5); }, can ? '#00B451' : 'rgba(255,255,255,.12)'); b.style.opacity = can ? 1 : .55; r.appendChild(b); });
    if (panelTab == 'book') { const b = book(), found = ALL.filter(f => b[f.k]).length;
      body.appendChild(el('div', {font:'600 13px '+A.font, color:'#D5F367'}, found + ' of ' + ALL.length + ' found · Book bonus ×' + bookBonus().toFixed(2) + ' coins (+3% per full zone, +25% per full spot)'));
      LOCS.forEach(L => { const hd2 = el('div', {font:'800 15px '+A.font, marginTop:'6px', color:L.k == G.loc ? '#D5F367' : '#ffffff'}, L.n + (G.locs[L.k] ? '' : ' 🔒') + (L.k == G.loc ? ' · you are here' : '')); hd2.dataset.loc = L.k; body.appendChild(hd2);
        FISH[L.k].concat([SPEC[L.k]]).forEach((zr, z) => { const r = row(); r.style.flexWrap = 'wrap'; r.style.gap = '4px'; r.appendChild(el('div', {width:'100%', font:'600 11px '+A.font, color:z < 8 ? '#8fb9c9' : '#ff9b9b'}, z < 8 ? ZONES[z].n + ' · ' + ZONES[z].d + ' m+' : (L.k == 'fwish' ? '✨ Godly · 🔥 DANG · 🌈 OH DANG!!!! · 🌍 FISH!!' : '✨ Godly (5,000 m+) · 🔥 DANG (10,000 m+) · 🌈 OH DANG!!!! (deeper = likelier)')));
          zr.forEach(f => { const n = b[f.k] || 0, cell = el('div', {flex:'1 1 45%', display:'flex', alignItems:'center', gap:'6px', font:'600 12px '+A.font, color:n ? RC[f.r] : '#5d7d8a'}); if (n) { const im = el('img', {width:'46px', height:'30px', flexShrink:0}); im.src = fishIcon(f); cell.appendChild(im); } else cell.appendChild(el('div', {width:'46px', height:'30px', flexShrink:0, borderRadius:'8px', background:'rgba(255,255,255,.06)', textAlign:'center', lineHeight:'30px'}, '?')); cell.appendChild(el('span', {}, n ? f.n + ' ×' + n : '??? (' + RN[f.r] + ')')); r.appendChild(cell); }); }); });
      body.appendChild(el('div', {font:'800 15px '+A.font, marginTop:'6px'}, '🌌 Deep layer guardians (every spot)'));
      for (let q = 0; q < GUARD.length; q += 2) { const r = row(); r.style.flexWrap = 'wrap'; r.style.gap = '4px'; GUARD.slice(q, q + 2).forEach(f => { const n = b[f.k] || 0, cell = el('div', {flex:'1 1 45%', display:'flex', alignItems:'center', gap:'6px', font:'600 12px '+A.font, color:n ? RC[f.r] : '#5d7d8a'});
          if (n) { const im = el('img', {width:'46px', height:'30px', flexShrink:0}); im.src = fishIcon(f); cell.appendChild(im); } else cell.appendChild(el('div', {width:'46px', height:'30px', flexShrink:0, borderRadius:'8px', background:'rgba(255,255,255,.06)', textAlign:'center', lineHeight:'30px'}, '?'));
          cell.appendChild(el('span', {}, n ? f.n + ' ×' + n + ' · ' + RN[f.r] : '??? (' + RN[f.r] + ') · ' + LAYERS[f.guard].n + ' (' + fmt(LAYERS[f.guard].d) + ' m+)')); r.appendChild(cell); }); }
      body.appendChild(el('div', {font:'800 15px '+A.font, marginTop:'6px', color:RC[15]}, '🤫 Secret fish (1 hiding in every spot · about 1 in 5,000 fish)'));
      { const r = row(); r.style.flexWrap = 'wrap'; r.style.gap = '4px'; Object.values(SECRET).forEach(f => { const n = b[f.k] || 0, cell = el('div', {flex:'1 1 30%', display:'flex', alignItems:'center', gap:'6px', font:'600 12px '+A.font, color:n ? RC[15] : '#5d7d8a'});
          if (n) { const im = el('img', {width:'46px', height:'30px', flexShrink:0}); im.src = fishIcon(f); cell.appendChild(im); } cell.appendChild(el('span', {}, n ? f.n + ' ×' + n : '??? · ' + (LOCS.find(L => L.k == f.loc) || {}).n)); r.appendChild(cell); }); }
      const r = row(); [BOOT, CHEST].forEach(f => { const cell = el('div', {flex:'1', display:'flex', alignItems:'center', gap:'6px', font:'600 12px '+A.font, color:b[f.k] ? RC[f.r] : '#5d7d8a'}); if (b[f.k]) { const im = el('img', {width:'46px', height:'30px'}); im.src = fishIcon(f); cell.appendChild(im); } cell.appendChild(el('span', {}, b[f.k] ? f.n + ' ×' + b[f.k] : '??? (' + RN[f.r] + ')')); r.appendChild(cell); }); }
    if (panelTab == 'mix') { const deep = Math.max(30, lineM(UL('line'))), WH = ['up to 250 m', 'up to 2,000 m', 'everywhere', 'everywhere', '250 m+', '2,000 m+', '5,000 m+', '10,000 m+'];
      const cur = mixOn() ? G.mix.slice() : null, vals = cur || [60, 30, 12, 5, 2, 1, 0, 0];
      body.appendChild(el('div', {font:'600 13px '+A.font, lineHeight:1.4, color:'#cfe3ec'}, 'Choose what your bait attracts. Higher numbers = more of that rarity. Aiming for rarer fish means fewer fish in the water, so pick your mix to fit your hook.'));
      const info = el('div', {font:'800 14px '+A.font, color:'#D5F367'}); body.appendChild(info);
      const shareTx = [];
      const upd = () => { const v = mixOn() ? G.mix : null, tot = v ? v.reduce((a, b) => a + b, 0) : 0; shareTx.forEach((tx, r) => { tx.textContent = v ? Math.round(100 * v[r] / Math.max(1, tot)) + '%' : 'natural'; });
        info.textContent = (mixOn() ? '🎯 Your mix' : '🌊 Natural mix') + ' · fish in the water at ' + fmt(deep) + ' m: ' + Math.round(density(deep) * 100) + '% of normal'; };
      for (let r = 0; r < MIXN; r++) { const rw = row(); rw.style.gap = '10px';
        const lab = el('div', {width:'92px', font:'800 13px '+A.font, color:RC[r]}, RN[r]); lab.appendChild(el('div', {font:'500 10px '+A.font, color:'#8fb9c9'}, WH[r]));
        const sl = el('input', {flex:'1', accentColor:RC[r]}); sl.type = 'range'; sl.min = 0; sl.max = 100; sl.step = 1; sl.value = vals[r];
        const tx = el('div', {width:'52px', textAlign:'right', font:'800 13px '+A.font}); shareTx[r] = tx;
        sl.addEventListener('input', () => { if (!mixOn()) G.mix = vals.slice(); G.mix[r] = +sl.value; upd(); }); sl.addEventListener('change', () => save());
        rw.appendChild(lab); rw.appendChild(sl); rw.appendChild(tx); }
      const pr = el('div', {display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'4px'}); body.appendChild(pr);
      [['🌊 Natural', null], ['🐟 Lots of fish', [100, 50, 10, 2, 0, 0, 0, 0]], ['💎 Rare hunter', [0, 5, 30, 40, 30, 20, 10, 5]], ['✨ Godly hunt', [0, 0, 0, 10, 20, 20, 100, 20]], ['🔥 DANG or bust', [0, 0, 0, 0, 0, 0, 0, 100]]].forEach(([n, v]) => pr.appendChild(mk(n, () => { G.mix = v ? v.slice() : null; save(); drawPanel(); }, 'rgba(255,255,255,.12)')));
      body.appendChild(el('div', {font:'500 11px '+A.font, color:'#8fb9c9', marginTop:'6px'}, 'Only rarities that live at your depth can show up — if none of your picks live there, you get the natural mix. Treasure chests and golden fish are not affected.'));
      upd(); }
    if (panelTab == 'pearl') { const n = pearlsFor(), ok = n >= 1 && (G.best||0) >= 250;
      body.appendChild(el('div', {font:'600 14px '+A.font, lineHeight:1.4}, '🦪 You have ' + G.pearls + ' pearl' + (G.pearls == 1 ? '' : 's') + '. Each pearl makes every fish worth +10% and your line 10% longer, forever (now ×' + pearlM().toFixed(1) + ').'));
      body.appendChild(el('div', {font:'500 13px '+A.font, color:'#b9d9e6', lineHeight:1.4}, 'A Pearl Dive starts your fishing over: coins, upgrades and spots go back to the start. You keep your pearls, your Fish Book, your tickets and Workshop upgrades. Pearls come from coins earned since your last Pearl Dive, and you must have reached 250 m.'));
      body.appendChild(el('div', {font:'700 14px '+A.font, color:'#D5F367'}, 'Coins this run: ' + fmt(G.run) + ' · deepest this run: ' + fmt(G.best||0) + ' m → ' + n + ' pearl' + (n == 1 ? '' : 's')));
      if (ok) body.appendChild(mk(armPearl ? 'YES · Pearl Dive for ' + n + ' 🦪' : 'Pearl Dive for ' + n + ' 🦪', () => { if (!armPearl) { armPearl = true; drawPanel(); return; } pearlDive(); }, armPearl ? '#FF4539' : '#E9B9F7', '#121313'));
      else body.appendChild(el('div', {font:'600 13px '+A.font, color:'#ffb3ab'}, (G.best||0) < 250 ? 'Reach 250 m first.' : 'Earn more coins first (100K coins = 1 pearl).'));
      body.appendChild(el('div', {font:'500 12px '+A.font, color:'#8fb9c9', marginTop:'8px'}, 'All-time: ' + fmt(G.tot) + ' coins · ' + fmt(G.caught) + ' fish · ' + fmt(G.dives) + ' dives · deepest ever ' + fmt(G.deepest||0) + ' m')); }
    const nb = panel.querySelector('.fl-body'); if (nb) nb.scrollTop = sc;
    // the Fish Book opens at the spot you're fishing in
    if (nb && panelTab == 'book' && bookJump) { bookJump = false; const hdr = nb.querySelector('[data-loc="' + G.loc + '"]'); if (hdr) nb.scrollTop = hdr.offsetTop - nb.offsetTop - 8; } }
  const buy = (u, n) => { let k = 0; while (k < n && (u.max == null || UL(u.k) < u.max) && G.coins >= cost(u, UL(u.k))) { G.coins -= cost(u, UL(u.k)); G.upg[u.k] = UL(u.k) + 1; k++; }
    if (k) { A.sfx('coin'); save(); refreshBar(); } else A.sfx('bad'); drawPanel(); };
  const pearlsFor = () => G.run < 1e5 ? 0 : Math.floor(Math.sqrt(Math.min(G.run, 1e9) / 1e5)) + Math.floor(4*Math.log10(Math.max(1, G.run / 1e9)));
  const pearlDive = () => { const n = pearlsFor(); if (n < 1) return; G.pearls += n; G.coins = 0; G.upg = {}; G.locs = {lake:1}; G.loc = 'lake'; G.run = 0; G.best = 0; save(); A.sfx('win'); closePanel(); say('+' + n + ' pearl' + (n == 1 ? '' : 's') + '! Fish are worth ×' + pearlM().toFixed(1) + ' now', 3); stat(api,'fishPearls',G.pearls,'max'); };

  // ---------- drawing ----------
  const mixHex = (a, b, k) => { const p = s => s[0] == '#' ? [1,3,5].map(i => parseInt(s.slice(i, i+2), 16)) : (s.match(/\d+/g) || [0,0,0]).slice(0, 3).map(Number); const A1 = p(a), B1 = p(b); return 'rgb(' + A1.map((v, i) => Math.round(v + (B1[i]-v)*k)).join(',') + ')'; };
  const dark = d => Math.min(.94, Math.log(1 + d/25) / Math.log(1 + 2500/25)) * (1 - .07*UL('clear'));
  const sy = d => SURF + (d - camD) * PXM;
  const drawFish = (o, x, y) => { const f = o.f, s = f.s, dir = o.vx < 0 ? -1 : 1; g.save(); g.translate(x, y); g.scale(dir, 1);
    if (f.junk) { g.fillStyle = f.col; rr(g, -9, -10, 10, 16, 3); g.fill(); rr(g, -9, 2, 20, 8, 3); g.fill(); g.restore(); return; }
    if (f.bird) { if (f.special == 'birdmax') { const hh = (t*140) % 360; f.look.col = 'hsl(' + hh + ',95%,60%)'; f.look.dark = 'hsl(' + ((hh + 180) % 360) + ',95%,45%)';
        for (let k = 0; k < 5; k++) { g.strokeStyle = 'hsla(' + ((t*200 + k*72) % 360) + ',95%,60%,.8)'; g.lineWidth = 6; g.beginPath(); g.ellipse(0, 0, s*1.25 + k*14 + Math.sin(t*3 + k)*8, s*.8 + k*10, 0, 0, TAU); g.stroke(); }
        g.save(); g.scale(o.vx < 0 ? -1 : 1, 1); g.font = '900 48px ' + A.font; g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = '#121313'; g.strokeText('BIRD!!', 0, -s*.8); g.fillStyle = 'hsl(' + ((t*300) % 360) + ',95%,70%)'; g.fillText('BIRD!!', 0, -s*.8); g.restore(); }
      else if (inSky() && SUL('ssonar') >= 2 && !book()[f.k] && !low()) { g.shadowColor = '#ffffff'; g.shadowBlur = 14 + 8*Math.sin(t*8); }
      drawBird(f, s, o.ph); g.shadowBlur = 0; g.restore(); return; }
    if (f.chest) { g.fillStyle = '#8D5B1D'; rr(g, -14, -9, 28, 18, 3); g.fill(); g.fillStyle = '#F9BF01'; g.fillRect(-14, -2, 28, 3); g.fillRect(-2, -4, 4, 7); if (!low()) { g.fillStyle = 'rgba(255,233,120,' + (.4 + .3*Math.sin(t*4 + o.ph)) + ')'; g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill(); } g.restore(); return; }
    if ((f.r >= 3 || o.gold) && !low()) { g.shadowColor = o.gold ? '#FFD700' : f.look.acc; g.shadowBlur = f.r >= 4 ? 16 : 10; }
    drawLook(f, s, o.ph, o.gold, low()); g.shadowBlur = 0;
    if (f.look && f.look.rainbow) { const hh = (t*140) % 360; f.look.col = 'hsl(' + hh + ',95%,60%)'; f.look.acc = 'hsl(' + ((hh + 180) % 360) + ',95%,60%)'; }
    if (f.special == 'fishmax') { for (let k = 0; k < 5; k++) { g.strokeStyle = 'hsla(' + ((t*200 + k*72) % 360) + ',95%,60%,.8)'; g.lineWidth = 6; g.beginPath(); g.ellipse(0, 0, s*1.25 + k*14 + Math.sin(t*3 + k)*8, s*.8 + k*10, 0, 0, TAU); g.stroke(); }
      g.save(); g.scale(o.vx < 0 ? -1 : 1, 1); g.font = '900 48px ' + A.font; g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = '#121313'; g.strokeText('FISH!!', 0, -s*.75); g.fillStyle = 'hsl(' + ((t*300) % 360) + ',95%,70%)'; g.fillText('FISH!!', 0, -s*.75); g.restore(); }
    if (f.special == 'ohdang' && !low()) { for (let k = 0; k < 3; k++) { g.strokeStyle = 'hsla(' + ((t*200 + k*120) % 360) + ',95%,60%,.75)'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, s*1.4 + k*10 + Math.sin(t*4 + k)*5, s*.9 + k*8, 0, 0, TAU); g.stroke(); }
      g.save(); g.scale(o.vx < 0 ? -1 : 1, 1); g.font = '900 22px ' + A.font; g.textAlign = 'center'; g.lineWidth = 5; g.strokeStyle = '#121313'; g.strokeText('OH DANG!!!!', 0, -s*1.3); g.fillStyle = 'hsl(' + ((t*240) % 360) + ',95%,65%)'; g.fillText('OH DANG!!!!', 0, -s*1.3); g.restore(); }
    if (f.special && f.special != 'ohdang' && f.special != 'fishmax' && !low()) { const pu = .5 + .5*Math.sin(t*5 + o.ph); g.strokeStyle = f.special == 'dang' ? 'rgba(255,40,40,' + (.4 + .5*pu) + ')' : 'rgba(125,249,255,' + (.35 + .4*pu) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, s*1.5 + pu*4, s*.95 + pu*3, 0, 0, TAU); g.stroke();
      if (f.special == 'dang') { g.fillStyle = '#fff'; g.font = '900 ' + Math.round(s*.5) + 'px ' + A.font; g.textAlign = 'center'; g.save(); g.scale(o.vx < 0 ? -1 : 1, 1); g.fillText('DANG!', 0, -s*1.05); g.restore(); } }
    if (f.r >= 4 && !low()) { g.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { const a = t*2 + k*2.1 + o.ph; g.globalAlpha = .5 + .5*Math.sin(t*6 + k); g.fillRect(Math.cos(a)*s*1.2, Math.sin(a)*s*.8, 2, 2); } g.globalAlpha = 1; }
    g.restore();
    // Sonar Lv 4: fish you haven't caught yet flash (3 times a second at most, so it's safe for eyes)
    if (UL('sonar') >= 4 && !f.junk && !book()[f.k] && !caught.some(c2 => c2.f.k == f.k)) { const on = Math.floor(t*6) % 2 == 0, R2 = s*1.6 + 6;
      g.save(); g.lineWidth = 4; g.strokeStyle = on ? '#ffff00' : '#ff2bd6'; g.shadowColor = g.strokeStyle; g.shadowBlur = low() ? 0 : 14; g.beginPath(); g.arc(x, y, R2, 0, TAU); g.stroke();
      g.fillStyle = on ? 'rgba(255,255,0,.22)' : 'rgba(255,43,214,.18)'; g.fill(); g.shadowBlur = 0;
      g.font = '900 12px ' + A.font; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#121313'; g.strokeText('NEW!', x, y - R2 - 4); g.fillStyle = on ? '#ffff00' : '#ff2bd6'; g.fillText('NEW!', x, y - R2 - 4); g.restore(); }
    if (UL('sonar') >= 1 && f.i >= 2) { g.strokeStyle = RC[f.r]; g.lineWidth = 2; g.globalAlpha = .7; g.beginPath(); g.arc(x, y, s + 7, 0, TAU); g.stroke(); g.globalAlpha = 1; } };
  const drawJelly = (o, x, y) => { const p = Math.sin(t*3 + o.ph); g.fillStyle = 'rgba(255,120,200,.55)'; g.beginPath(); g.ellipse(x, y, 13 + p*2, 10 - p*1.5, 0, Math.PI, TAU); g.fill();
    g.strokeStyle = 'rgba(255,150,210,.6)'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i*5, y); g.quadraticCurveTo(x + i*5 + Math.sin(t*4 + i)*4, y + 10, x + i*5, y + 20 + p*3); g.stroke(); } };
  // ---------- scenery helpers ----------
  const nz = d => (Math.sin(d*.013) + Math.sin(d*.031 + 1.7) + Math.sin(d*.0071 + 4)) / 3;   // smooth noise by depth
  const wave = x => (Math.sin(x*.018 + t*1.6) * 3 + Math.sin(x*.047 - t*2.3) * 1.6) * (weather == 'storm' ? 3 : weather == 'rain' ? 1.6 : 1);
  const drawSky = (L, yS) => { const nk = 1 - daylight(), st = weather == 'storm' ? .55 : weather == 'rain' ? .3 : 0;
    const top = mixHex(mixHex(L.sky[0], '#0b1033', nk*.85), '#3a3f4a', st), bot = mixHex(mixHex(L.sky[1], '#2a2f5a', nk*.75), '#5a606a', st);
    const gr = g.createLinearGradient(0, yS - 260, 0, yS); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, Math.max(0, yS));
    if (nk > .45 || L.stars) { g.fillStyle = 'rgba(255,255,255,' + (L.stars ? .9 : (nk - .45)*1.6) + ')'; for (let i = 0; i < 60; i++) { const tw = .5 + .5*Math.sin(t*2 + i); g.globalAlpha = Math.min(1, tw + .2); g.fillRect((i*157) % W, yS - 40 - ((i*53) % 220), 2, 2); } g.globalAlpha = 1; }
    // sun by day, moon by night, travelling across the sky
    const a = dayT(), dayArc = a < .5, f2 = dayArc ? a / .5 : (a - .5) / .5, cx = W*(.08 + .84*f2), cy = yS - 60 - Math.sin(f2*Math.PI) * 150;
    if (dayArc) { if (!low()) { const sg = g.createRadialGradient(cx, cy, 10, cx, cy, 70); sg.addColorStop(0, 'rgba(255,240,180,.6)'); sg.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, 70, 0, TAU); g.fill(); }
      g.fillStyle = L.k == 'vent' ? '#ffb347' : '#fff3b0'; g.beginPath(); g.arc(cx, cy, 26, 0, TAU); g.fill(); }
    else { g.fillStyle = '#f4f1e0'; g.beginPath(); g.arc(cx, cy, 20, 0, TAU); g.fill(); g.fillStyle = top; g.beginPath(); g.arc(cx + 8, cy - 5, 17, 0, TAU); g.fill(); }
    // clouds
    for (let i = 0; i < 6; i++) { const x = ((i*230 + t*(6 + (i%3)*4)) % (W + 320)) - 160, y = yS - 170 + (i%3)*34 - (i%2)*20, k = .8 + (i%3)*.25;
      g.fillStyle = weather == 'storm' ? 'rgba(80,86,98,.92)' : weather == 'rain' ? 'rgba(170,176,186,.9)' : 'rgba(255,255,255,' + (.85 - nk*.5) + ')';
      g.beginPath(); g.ellipse(x, y, 46*k, 16*k, 0, 0, TAU); g.ellipse(x + 26*k, y - 10*k, 30*k, 18*k, 0, 0, TAU); g.ellipse(x - 24*k, y - 6*k, 26*k, 14*k, 0, 0, TAU); g.fill(); }
    // far hills, then a near island with trees
    g.fillStyle = mixHex(L.land, bot, .55); g.beginPath(); g.moveTo(0, yS); for (let x = 0; x <= W; x += 24) g.lineTo(x, yS - 34 - Math.sin(x*.009 + 1)*18 - Math.sin(x*.023)*8); g.lineTo(W, yS); g.fill();
    const near = mixHex(L.land, '#000000', nk*.5); g.fillStyle = near; g.beginPath(); g.moveTo(0, yS + 2); for (let x = 0; x <= 230; x += 10) g.lineTo(x, yS - 26 - Math.sin(x*.03)*8 - (230 - x)*.08); g.lineTo(260, yS + 2); g.fill();
    g.beginPath(); g.moveTo(W, yS + 2); for (let x = W; x >= W - 170; x -= 10) g.lineTo(x, yS - 18 - Math.sin(x*.05)*6 - (x - (W - 170))*.06); g.lineTo(W - 200, yS + 2); g.fill();
    if (!L.stars && L.k != 'vent') { for (let i = 0; i < 7; i++) { const tx2 = 30 + i*28, ty = yS - 30 - Math.sin(tx2*.03)*8 - (230 - tx2)*.08; g.fillStyle = L.snow ? '#e8f4ff' : mixHex('#2f6b3a', '#000000', nk*.5);
        g.beginPath(); g.moveTo(tx2, ty - 30 - (i%2)*8); g.lineTo(tx2 - 11, ty + 2); g.lineTo(tx2 + 11, ty + 2); g.fill(); g.fillStyle = '#5a3a1a'; g.fillRect(tx2 - 2, ty, 4, 6); } }
    if (L.k == 'vent') { g.fillStyle = '#3a2a2a'; g.beginPath(); g.moveTo(W - 160, yS); g.lineTo(W - 90, yS - 90); g.lineTo(W - 70, yS - 90); g.lineTo(W - 10, yS); g.fill(); g.fillStyle = 'rgba(255,120,40,' + (.6 + .3*Math.sin(t*3)) + ')'; g.beginPath(); g.ellipse(W - 80, yS - 92, 14, 6, 0, 0, TAU); g.fill(); }
    if (L.snow) { g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 60; i++) g.fillRect((i*61 + t*20*(1 + i%3)) % W, ((i*37 + t*30*(1 + i%2)) % 260) + yS - 260, 2, 2); }
    if (L.ember) { g.fillStyle = 'rgba(255,140,60,.8)'; for (let i = 0; i < 30; i++) g.fillRect((i*61 + Math.sin(t + i)*20 + W) % W, yS - ((i*37 + t*40) % 260), 2, 3); } };
  const drawBoat = (yS, To) => { const T = To || boatT(), bx = W/2, by = yS + (To ? 0 : wave(bx) - 4), tilt = To ? 0 : (wave(bx + 30) - wave(bx - 30)) / 60, sc = 1 + .08*Math.max(0, BOATS.indexOf(T)); g.save(); g.translate(bx, by); g.rotate(tilt); g.scale(sc, sc);   // better boats are bigger
    // a hot-air balloon floats above the flying boats
    if (T.balloon) { g.strokeStyle = '#5a3412'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(12, -50); g.lineTo(-6, -114); g.moveTo(56, -50); g.lineTo(74, -114); g.stroke();
      for (let k = 0; k < 6; k++) { g.fillStyle = T.balloon[k % 2]; g.beginPath(); g.ellipse(34, -160, 48 - k*8, 54, 0, 0, TAU); g.fill(); } }
    // a sail behind the fisher
    if (T.sail) { g.strokeStyle = '#5a3412'; g.lineWidth = 3; g.beginPath(); g.moveTo(-60, -16); g.lineTo(-60, -124); g.stroke(); g.fillStyle = T.sail; g.beginPath(); g.moveTo(-63, -118); g.quadraticCurveTo(-104 - Math.sin(t*2)*3, -72, -63, -24); g.fill();
      if (T.flag == '#121313') { g.fillStyle = '#ffffff'; g.font = '700 16px '+A.font; g.textAlign = 'center'; g.fillText('★', -78, -66); } }
    // hull
    g.fillStyle = T.hull; g.beginPath(); g.moveTo(-74, -16); g.lineTo(74, -16); g.quadraticCurveTo(66, 10, 48, 14); g.lineTo(-48, 14); g.quadraticCurveTo(-66, 10, -74, -16); g.fill();
    g.fillStyle = T.trim; g.fillRect(-70, -16, 140, 7); g.fillStyle = mixHex(T.hull, '#000000', .3); if (!T.sub) for (let k = -60; k <= 60; k += 20) g.fillRect(k, -9, 2, 20);
    g.fillStyle = T.rim; g.fillRect(-74, -19, 148, 4);
    const tier = BOATS.indexOf(T);
    if (tier == 1 || tier == 4) { g.fillStyle = tier == 1 ? '#F9BF01' : '#64CDF5'; g.beginPath(); g.moveTo(-60, -2); g.lineTo(40, -2); g.lineTo(30, 4); g.lineTo(-60, 4); g.fill(); }
    if (tier == 2) { g.strokeStyle = 'rgba(240,230,200,.8)'; g.lineWidth = 1; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-74 + k*4, -18); g.lineTo(-90 + k*3, 6); g.stroke(); } g.beginPath(); g.moveTo(-90, -6); g.lineTo(-72, -6); g.stroke(); }
    if (tier == 6) for (const px of [-40, -16, 8]) { g.fillStyle = '#121313'; g.beginPath(); g.arc(px, -2, 5, 0, TAU); g.fill(); g.fillStyle = '#4a4a4a'; g.fillRect(px - 2, -4, 10, 4); }
    if (tier == 7) { [[-48, -150], [-66, -168]].forEach(([mx, top]) => { g.strokeStyle = '#8a6a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(mx, -16); g.lineTo(mx, top); g.stroke(); g.fillStyle = T.sail; g.globalAlpha = .9; g.beginPath(); g.moveTo(mx - 3, top + 6); g.quadraticCurveTo(mx - 40 - Math.sin(t*2 + mx)*3, (top - 16)/2, mx - 3, -26); g.fill(); g.globalAlpha = 1; g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(mx - 8, top); g.lineTo(mx - 4, top - 10); g.lineTo(mx, top - 2); g.lineTo(mx + 4, top - 10); g.lineTo(mx + 8, top); g.fill(); }); }
    if (T.sub) for (const px of [-48, -24, 0, 24, 48]) { g.fillStyle = '#4a4a4a'; g.beginPath(); g.arc(px, 0, 6, 0, TAU); g.fill(); g.fillStyle = '#8fd3ff'; g.beginPath(); g.arc(px, 0, 4, 0, TAU); g.fill(); }
    // cabin (the yacht has two decks)
    let poleTop = -56;
    if (T.yacht) { g.fillStyle = T.cabin; rr(g, -6, -40, 76, 24, 6); g.fill(); g.fillStyle = daylight() < .3 ? '#ffd76a' : '#8fd3ff'; g.fillRect(0, -34, 64, 7); g.fillStyle = T.cabin; rr(g, 12, -58, 44, 18, 5); g.fill(); g.fillStyle = T.roof; g.fillRect(8, -60, 52, 4); g.fillRect(-6, -42, 76, 3); poleTop = -60; }
    else { g.fillStyle = T.cabin; g.fillRect(14, -46, 40, 30); g.fillStyle = T.roof; g.beginPath(); g.moveTo(10, -46); g.lineTo(58, -46); g.lineTo(52, -56); g.lineTo(16, -56); g.fill();
      g.fillStyle = daylight() < .3 ? '#ffd76a' : '#8fd3ff'; g.fillRect(22, -40, 11, 10); g.fillRect(37, -40, 11, 10); }
    if (T.sub) { g.fillStyle = '#4a4a4a'; g.fillRect(36, poleTop - 26, 5, 26); g.fillRect(36, poleTop - 26, 14, 5); g.fillStyle = '#c8961a'; g.beginPath(); g.moveTo(-74, -10); g.lineTo(-92, -24); g.lineTo(-92, 6); g.fill(); }
    if (T.yacht) { g.strokeStyle = '#1d4f86'; g.lineWidth = 2; g.beginPath(); g.moveTo(34, -62); g.lineTo(34, -72); g.stroke(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(34, -74, 5, 0, TAU); g.fill(); g.save(); g.translate(34, -80); g.rotate(t*3); g.fillStyle = '#1d4f86'; g.fillRect(-9, -1.5, 18, 3); g.restore(); }
    g.strokeStyle = '#5a3412'; g.lineWidth = 2; g.beginPath(); g.moveTo(54, poleTop); g.lineTo(54, poleTop - 30); g.stroke(); g.fillStyle = T.flag; g.beginPath(); g.moveTo(54, poleTop - 30); g.lineTo(76 + Math.sin(t*6)*3, poleTop - 24); g.lineTo(54, poleTop - 18); g.fill();
    if (T.gold && !low()) for (let k = 0; k < 6; k++) { const a2 = .5 + .5*Math.sin(t*3 + k*1.7); g.fillStyle = 'rgba(255,250,200,' + a2 + ')'; g.beginPath(); g.arc(-60 + k*24, -24 + (k % 2)*30 - 8, 2 + a2*1.5, 0, TAU); g.fill(); }
    // the fisher
    g.fillStyle = '#00B451'; rr(g, -40, -46, 20, 30, 8); g.fill(); g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(-30, -54, 10, 0, TAU); g.fill();
    g.fillStyle = '#121313'; g.beginPath(); g.arc(-26, -55, 1.6, 0, TAU); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); g.ellipse(-30, -62, 15, 4, 0, 0, TAU); g.fill(); rr(g, -38, -72, 16, 10, 4); g.fill();
    g.strokeStyle = '#6b4a2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(-22, -38); g.lineTo(28, -96); g.stroke(); g.restore();
    return {x: bx + (28 + tilt*-96)*sc, y: by - 96*sc}; };
  const puff = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.arc(x + r*.9, y + r*.2, r*.75, 0, TAU); g.arc(x - r*.9, y + r*.25, r*.7, 0, TAU); g.arc(x + r*.3, y - r*.45, r*.7, 0, TAU); g.fill(); };
  const drawZap = (o, x, y) => { puff(x, y, 22, '#4a5068'); puff(x - 4, y - 4, 16, '#5a6280'); if (Math.sin(t*9 + o.ph) > .2) { g.strokeStyle = '#ffe94a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y + 14); g.lineTo(x - 8, y + 28); g.lineTo(x + 2, y + 30); g.lineTo(x - 6, y + 46); g.stroke(); } };
  const drawSkyScene = () => { const z = skyZ(alt), Z = SKYZ[z], Z2 = SKYZ[Math.min(SKYZ.length - 1, z + 1)], fz = z < SKYZ.length - 1 ? Math.max(0, Math.min(1, (alt - Z.a) / (Z2.a - Z.a))) : 0;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, mixHex(Z.c[0], Z2.c[0], fz)); gr.addColorStop(1, mixHex(Z.c[1], Z2.c[1], fz)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const hy = skyHY, gy = hy + alt*PXM, sc = skyScroll*PXM;
    if (alt > 500 && !low()) { const k2 = Math.min(1, (alt - 500) / 1500); for (let i = 0; i < 80; i++) { const x = (i*137.5) % W, y = (((i*91 + sc*.3) % (H + 40)) + H + 40) % (H + 40) - 20; g.fillStyle = 'rgba(255,255,255,' + (k2*(.35 + .5*Math.abs(Math.sin(t*1.3 + i)))) + ')'; g.fillRect(x, y, 2, 2); } }
    if (z == 4 && !low()) ['120,255,170', '120,200,255', '220,140,255'].forEach((c2, k) => { g.strokeStyle = 'rgba(' + c2 + ',.28)'; g.lineWidth = 22; g.beginPath(); for (let x = -20; x <= W + 20; x += 20) g.lineTo(x, 120 + k*60 + Math.sin(x*.01 + t*.6 + k)*30); g.stroke(); });
    if (z == 2 && !low()) ['#ff6a6a', '#ffb347', '#fff36a', '#7fe08a', '#64CDF5', '#b48cff'].forEach((c2, k) => { g.strokeStyle = c2; g.globalAlpha = .28; g.lineWidth = 12; g.beginPath(); g.arc(W/2, H + 160, 520 - k*12, Math.PI, TAU); g.stroke(); g.globalAlpha = 1; });
    if (z >= 6) { g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(W - 170, 150, 62, 0, TAU); g.fill(); g.fillStyle = '#d8d2b8'; [[-20, -14, 12], [18, 10, 9], [-6, 26, 7]].forEach(([a, b2, r2]) => { g.beginPath(); g.arc(W - 170 + a, 150 + b2, r2, 0, TAU); g.fill(); }); }
    if (alt < 4000) for (let i = 0; i < 9; i++) { const y = (((i*83 + sc*.8) % (H + 160)) + H + 160) % (H + 160) - 80, x = ((i*211 + t*(8 + (i % 3)*5)) % (W + 240)) - 120; g.globalAlpha = .55; puff(x, y, 34 + (i % 3)*14, z >= 3 ? '#6a7488' : '#ffffff'); g.globalAlpha = 1; }
    let tip = {x: W/2 + 30, y: H + 20};
    if (gy < H + 160) { g.fillStyle = LOC().sea; g.fillRect(0, gy, W, Math.max(0, H - gy + 10)); tip = drawBoat(gy); }
    for (const o of skyCr) { const y = hy - o.r*PXM; if (y < -60 || y > H + 60) continue; if (o.zap) drawZap(o, o.x, y); else drawFish(o, o.x, y);
      if (SUL('ssonar') >= 1 && !o.zap && Math.abs(y - hy) < 140) { g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('🪶' + fmt(skyVal(o.f, alt + o.r) * (o.gold ? 5 : 1) * featherMult()), o.x, y - o.f.s - 6); } }
    hooksX().forEach((x2, k) => { g.strokeStyle = 'rgba(255,255,255,' + (k ? .5 : .8) + ')'; g.lineWidth = k ? 1 : 1.4; g.beginPath(); g.moveTo(tip.x, Math.min(H + 20, tip.y)); g.quadraticCurveTo((tip.x + x2)/2, Math.min(H + 20, tip.y) - 20, x2, hy + 8); g.stroke();
      g.strokeStyle = '#d8dde3'; g.lineWidth = k ? 2.2 : 3; g.beginPath(); g.moveTo(x2, hy - 6); g.lineTo(x2, hy + 6); g.arc(x2 - 5, hy + 6, 5, 0, Math.PI); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x2, hy - 6); g.lineTo(x2, hy - 18); g.stroke();
      g.fillStyle = k ? '#FFB000' : '#FF4539'; g.beginPath(); g.ellipse(x2, hy - 30 + Math.sin(t*3 + k)*2, k ? 9 : 12, k ? 11 : 14, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(x2 - 4, hy - 35, 3, 4, 0, 0, TAU); g.fill(); });
    hangCatch(hy, true);
    if (SUL('sgrab') && phase == 'skydown') { g.strokeStyle = 'rgba(213,243,103,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(hx, hy, 20 + 3*SUL('sgrab'), 0, TAU); g.stroke(); } };
  const pY = d => 268 + 300 / (1 + d/8), pX = d => Math.min(W - 30, 250 + d*9);
  const drawPlanet = () => { const Lk = pLake(), dl = daylight(), sk = g.createLinearGradient(0, 0, 0, 268); sk.addColorStop(0, mixHex('#0a1030', Lk.sky, dl)); sk.addColorStop(1, mixHex('#2a2050', '#ffffff', dl*.8)); g.fillStyle = sk; g.fillRect(0, 0, W, 270);
    g.fillStyle = dl > .3 ? '#fff4b0' : '#f4f0d8'; g.beginPath(); g.arc(780, 90, 30, 0, TAU); g.fill();
    if (Lk.peaks) { g.fillStyle = mixHex(Lk.hill, '#000000', .2); for (let k = 0; k < 6; k++) { const x0 = k*190 - 60; g.beginPath(); g.moveTo(x0, 268); g.lineTo(x0 + 110, 120 + (k % 3)*30); g.lineTo(x0 + 220, 268); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x0 + 86, 152 + (k % 3)*24); g.lineTo(x0 + 110, 120 + (k % 3)*30); g.lineTo(x0 + 134, 152 + (k % 3)*24); g.fill(); g.fillStyle = mixHex(Lk.hill, '#000000', .2); } }
    g.fillStyle = mixHex(Lk.hill, '#000000', 1 - dl*.7); g.beginPath(); g.moveTo(0, 268); for (let x = 0; x <= W; x += 40) g.lineTo(x, 236 + Math.sin(x*.013)*12 + Math.sin(x*.037)*6); g.lineTo(W, 268); g.fill();
    g.fillStyle = mixHex(mixHex(Lk.hill, '#000000', .35), '#000000', 1 - dl*.7); for (let x = 10; x < W; x += 26) { const h0 = 18 + (x*7 % 13); g.beginPath(); g.moveTo(x, 262 - h0); g.lineTo(x - 8, 266); g.lineTo(x + 8, 266); g.fill(); }
    const wg = g.createLinearGradient(0, 266, 0, H); wg.addColorStop(0, mixHex(Lk.water[0], '#000020', (1 - dl)*.6)); wg.addColorStop(1, mixHex(Lk.water[1], '#000010', (1 - dl)*.6)); g.fillStyle = wg; g.fillRect(0, 266, W, H - 266);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.2; for (let i = 0; i < 26; i++) { const y = 276 + (i*i*.9) % (H - 280), x = (i*173 + t*14*(1 + (i % 3))) % (W + 80) - 40, w2 = 14 + (y - 266)*.12; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w2/2, y - 2, x + w2, y); g.stroke(); }
    // the dock and you
    g.fillStyle = '#7a4a1e'; g.fillRect(0, 520, 230, 80); g.fillStyle = '#a0632a'; for (let k = 0; k < 230; k += 23) g.fillRect(k, 520, 20, 10); g.fillStyle = '#5a3412'; [30, 120, 210].forEach(x => g.fillRect(x, 528, 10, 80));
    g.fillStyle = '#1d4f86'; rr(g, 98, 470, 20, 52, 6); g.fill(); rr(g, 122, 470, 20, 52, 6); g.fill(); g.fillStyle = '#00B451'; rr(g, 94, 404, 52, 74, 14); g.fill();
    g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(120, 386, 18, 0, TAU); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); g.ellipse(120, 372, 26, 6, 0, 0, TAU); g.fill(); rr(g, 106, 352, 28, 18, 6); g.fill();
    const bend = phase == 'pFight' ? pTen : phase == 'pCharge' ? -.3*pPow : 0, tip = {x: 300 - bend*50, y: 300 + bend*70};
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(140, 440); g.quadraticCurveTo(220, 330 + bend*30, tip.x, tip.y); g.stroke(); g.fillStyle = '#121313'; g.beginPath(); g.arc(165, 425, 7, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.2;
    if (phase == 'pCast') { const k = Math.min(1, pT / .7), x = tip.x + (pX(pCast) - tip.x)*k, y = tip.y + (pY(pCast) - tip.y)*k - Math.sin(k*Math.PI)*140; g.beginPath(); g.moveTo(tip.x, tip.y); g.quadraticCurveTo((tip.x + x)/2, Math.min(tip.y, y) - 30, x, y); g.stroke(); g.fillStyle = '#FF4539'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); }
    if (phase == 'pWait') { const bx = pX(pCast), by0 = pY(pCast), nib = pNibs.some(n => pT >= n && pT <= n + .35), bite = pT >= pBite && pT <= pBite + pWin(), sc2 = Math.max(.5, 1.4 - pCast/60);
      const by = by0 + Math.sin(t*2)*1.5 + (nib ? 4*Math.abs(Math.sin(t*30)) : 0) + (bite ? 10*sc2 : 0); g.beginPath(); g.moveTo(tip.x, tip.y); g.quadraticCurveTo((tip.x + bx)/2, (tip.y + by)/2 + 40, bx, by); g.stroke();
      if (bite) { for (let k = 0; k < 3; k++) { g.strokeStyle = 'rgba(255,255,255,' + (.6 - k*.18) + ')'; g.beginPath(); g.ellipse(bx, by0 + 4, (14 + k*10 + (pT - pBite)*30)*sc2, (4 + k*3)*sc2, 0, 0, TAU); g.stroke(); } }
      g.save(); g.translate(bx, by); g.scale(sc2, sc2); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 8, 0, Math.PI); g.fill(); if (!bite) { g.fillStyle = '#FF4539'; g.beginPath(); g.arc(0, 0, 8, Math.PI, TAU); g.fill(); g.fillStyle = '#121313'; g.fillRect(-1, -14, 2, 7); } g.restore(); }
    if (phase == 'pFight') { const fx = pX(Math.max(0, pDist)) + Math.sin(t*3)*12, fy = pY(Math.max(0, pDist)); g.strokeStyle = pTen > .8 ? '#FF4539' : 'rgba(255,255,255,.9)'; g.beginPath(); g.moveTo(tip.x, tip.y); g.lineTo(fx, fy); g.stroke();
      const sc2 = Math.max(.6, 1.6 - pDist/40); for (let k = 0; k < 2; k++) { g.strokeStyle = 'rgba(255,255,255,' + (.5 - k*.2) + ')'; g.beginPath(); g.ellipse(fx, fy + 3, (16 + k*12 + Math.sin(t*9)*4)*sc2, (5 + k*3)*sc2, 0, 0, TAU); g.stroke(); }
      if (pJump > 0) { g.save(); g.translate(fx, fy - Math.sin((1 - pJump/.6)*Math.PI)*50*sc2); g.rotate(-.6 + (1 - pJump/.6)*1.2); g.scale(sc2*.9, sc2*.9); drawLook(pFish, 26, 0, false, false); g.restore(); } }
    if (phase == 'pCharge') { g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, 40, 300, 22, 160, 8); g.fill(); g.fillStyle = 'hsl(' + (120 - pPow*120) + ',85%,55%)'; rr(g, 43, 457 - 154*pPow, 16, 154*pPow, 6); g.fill(); g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(Math.round(5 + pPow*(maxCast() - 5)) + ' m', 51, 292); }
    if (phase == 'pFight') { const bx2 = W/2 - 220, by2 = H - 128; g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, bx2 - 10, by2 - 30, 460, 66, 14); g.fill(); const tg = g.createLinearGradient(bx2, 0, bx2 + 440, 0); tg.addColorStop(0, '#00B451'); tg.addColorStop(.6, '#F9BF01'); tg.addColorStop(.85, '#FF4539'); tg.addColorStop(1, '#8a0000');
      g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, bx2, by2, 440, 16, 8); g.fill(); g.fillStyle = tg; rr(g, bx2, by2, 440*Math.min(1, pTen), 16, 8); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'left'; g.fillText('Line tension', bx2, by2 - 10); g.textAlign = 'right';
      g.fillText(Math.max(0, pDist).toFixed(1) + ' m away · ' + (pKg > pFish.troph ? 'HUGE!' : pKg > (pFish.min + pFish.max)/3 ? 'big fish' : 'fish') + (pStam < .3 ? ' · tiring!' : ''), bx2 + 440, by2 - 10); }
    if (st == 'play' && phase == 'surface') { const c = pCands(); g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, W/2 - 230, 120, 460, 76, 16); g.fill(); g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '800 21px '+A.font; g.fillText('Hold to swing back, let go to cast 🎣', W/2, 152);
      g.font = '500 13px '+A.font; g.fillStyle = '#cfe3d9'; g.fillText(pLake().n + ' · bait: ' + (PBAITS.find(b => b.k == PG.bait) || {}).n + ' · ' + (c.length ? c.length + ' kinds of fish bite here' : 'nothing bites this bait here!'), W/2, 178); }
    if (phase == 'pWait') { g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, W/2 - 220, 120, 440, 34, 12); g.fill(); g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '700 14px '+A.font; g.fillText('Watch the bobber… tap / Space when it goes UNDER', W/2, 142); } };
  const boatIc = {}; const boatIcon = i => { if (boatIc[i]) return boatIc[i]; const cv = document.createElement('canvas'); cv.width = 192; cv.height = 168; const g0 = g; try { g = cv.getContext('2d'); g.translate(96, 130); g.scale(.62, .62); g.translate(-W/2, 0); drawBoat(0, BOATS[i]); } catch(e) {} g = g0; return (boatIc[i] = cv.toDataURL()); };
  const drawWalls = (L, y0, dTop) => { if (low()) return; const nk = dark(Math.max(0, dTop) + 60), wc = base + dTop >= 2000 ? mixHex(LAYERS[layerIdx(base + dTop)].c, '#000000', .55) : mixHex(mixHex(L.sea, '#02040a', .55), '#02040a', nk*.8);
    for (const side of [0, 1]) { g.fillStyle = wc; g.beginPath(); const X = y => { const d = camD + (y - SURF)/PXM + side*977; return 26 + (nz(d) + 1) * 34 + Math.sin(d*.11)*6; };
      g.moveTo(side ? W : 0, y0); for (let y = y0; y <= H + 20; y += 16) g.lineTo(side ? W - X(y) : X(y), y); g.lineTo(side ? W : 0, H + 20); g.fill();
      // plants on the walls: kelp in shallow water, coral on the coast, crystals in the ice, glowing vents, stars in space
      for (let y = Math.ceil((y0 + 80 - SURF)/48)*48 + SURF; y < H; y += 48) { const d = camD + (y - SURF)/PXM, sd = Math.floor(d / 12) + side*31, r0 = Math.abs(Math.sin(sd*12.9898)*43758.5) % 1; if (r0 > .45) continue;
        const bx = side ? W - X(y) + 2 : X(y) - 2, dir = side ? -1 : 1, dA = base + d, z = zoneOf(Math.max(0, dA));
        if (dA >= 2000) { const dec = LAYERS[layerIdx(dA)].dec, pu = .5 + .5*Math.sin(t*2 + sd);
          if (dec == 'glow') { g.fillStyle = 'rgba(120,255,170,' + (.4 + .4*pu) + ')'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(bx + dir*(6 + k*8), y - k*9, 3 + k, 0, TAU); g.fill(); } }
          else if (dec == 'crystal') { g.fillStyle = 'rgba(140,230,255,' + (.5 + .3*pu) + ')'; g.beginPath(); g.moveTo(bx, y); g.lineTo(bx + dir*26, y - 10); g.lineTo(bx + dir*8, y - 22); g.fill(); g.beginPath(); g.moveTo(bx, y - 4); g.lineTo(bx + dir*14, y + 12); g.lineTo(bx + dir*4, y + 8); g.fill(); }
          else if (dec == 'bone') { g.strokeStyle = 'rgba(235,228,210,.75)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(bx + dir*12, y - k*6, 8 - k, Math.PI*.2, Math.PI*.8); g.stroke(); } g.fillStyle = 'rgba(235,228,210,.8)'; g.beginPath(); g.arc(bx + dir*24, y - 22, 6, 0, TAU); g.fill(); }
          else if (dec == 'lava') { g.strokeStyle = 'rgba(255,' + Math.round(90 + 80*pu) + ',30,.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx, y); g.lineTo(bx + dir*10, y - 8); g.lineTo(bx + dir*6, y - 16); g.lineTo(bx + dir*18, y - 26); g.stroke(); }
          else if (dec == 'void') { g.strokeStyle = 'rgba(170,90,255,' + (.35 + .35*pu) + ')'; g.lineWidth = 2; g.beginPath(); g.arc(bx + dir*14, y - 8, 8 + 4*pu, t + sd, t + sd + 4.5); g.stroke(); }
          else if (dec == 'dream') { g.fillStyle = 'rgba(255,170,230,' + (.3 + .3*pu) + ')'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(bx + dir*(8 + k*9), y - k*10 - pu*6, 4 + k*1.5, 0, TAU); g.fill(); } }
          else if (dec == 'clock') { g.strokeStyle = 'rgba(240,210,120,.8)'; g.lineWidth = 2; g.save(); g.translate(bx + dir*16, y - 10); g.rotate(t*(sd % 2 ? 1 : -1)); g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.stroke(); for (let k = 0; k < 8; k++) { g.rotate(TAU/8); g.beginPath(); g.moveTo(9, 0); g.lineTo(13, 0); g.stroke(); } g.restore(); }
          else if (dec == 'stars') { g.fillStyle = 'rgba(255,255,255,' + pu + ')'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k/10*TAU, r2 = k % 2 ? 2 : 6; g.lineTo(bx + dir*14 + Math.cos(a)*r2, y - 10 + Math.sin(a)*r2); } g.fill(); }
          else if (dec == 'nebula') { g.fillStyle = 'hsla(' + ((sd*47) % 360) + ',90%,65%,.18)'; g.beginPath(); g.arc(bx + dir*30, y - 10, 26, 0, TAU); g.fill(); }
          else if (dec == 'rainbow') { for (let k = 0; k < 4; k++) { g.strokeStyle = 'hsla(' + ((t*60 + k*60 + sd*20) % 360) + ',95%,60%,.7)'; g.lineWidth = 3; g.beginPath(); g.arc(bx + dir*22, y, 20 - k*4, Math.PI, TAU); g.stroke(); } }
          else if (dec == 'ruins') { g.fillStyle = 'rgba(170,160,130,.65)'; g.fillRect(dir > 0 ? bx : bx - 12, y - 34, 12, 34); g.fillRect(dir > 0 ? bx - 3 : bx - 15, y - 38, 18, 5); }
          continue; }
        if (L.k == 'coast' && z <= 3) { g.fillStyle = ['#ff7aa8', '#ffb347', '#a77bff'][sd % 3]; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(bx + dir*(6 + k*7), y - k*6, 5, 9, dir*.4, 0, TAU); g.fill(); } }
        else if (L.snow) { g.fillStyle = 'rgba(200,240,255,.7)'; g.beginPath(); g.moveTo(bx, y); g.lineTo(bx + dir*22, y - 6); g.lineTo(bx + dir*4, y - 14); g.fill(); }
        else if (L.k == 'vent' || z >= 5) { g.fillStyle = L.k == 'vent' ? 'rgba(255,110,40,.7)' : 'rgba(120,220,255,.5)'; g.beginPath(); g.arc(bx + dir*6, y, 3 + 2*Math.sin(t*3 + sd), 0, TAU); g.fill(); }
        else if (z <= 2) { g.strokeStyle = mixHex('#2f8a4a', '#02040a', nk*.7); g.lineWidth = 3; g.beginPath(); g.moveTo(bx, y); for (let k = 1; k <= 5; k++) g.lineTo(bx + dir*(k*5 + Math.sin(t*1.5 + k + sd)*5), y - k*14); g.stroke(); } } } };
  const waterAt = (L, d) => d >= 2000 && UL('clear') ? mixHex(LAYERS[layerIdx(d)].c, '#6a8aa8', .05*UL('clear')) : d < 2000 ? mixHex(mixHex(L.sea, '#02040a', dark(d)), '#030818', (1 - daylight()) * .5) : mixHex(LAYERS[layerIdx(d)].c, mixHex(L.sea, '#02040a', .85), .15);
  // ---------- background sea life: schools, turtles, mantas, whales, giant squid, glowing plankton (just for looks) ----------
  const BG = { turtle: mkLook('Sea Turtle', 1, 1), manta: mkLook('Manta Ray', 2, 2), whale: mkLook('Blue Whale', 4, 2), squid: mkLook('Giant Squid', 4, 3), shark: mkLook('Reef Shark', 2, 2), angler: mkLook('Anglerfish', 4, 1), eel: mkLook('Ribbon Eel', 3, 1) };
  const hash1 = (a, b) => { const x = Math.sin(a*127.1 + b*311.7) * 43758.5453; return x - Math.floor(x); };
  const drawBackLife = (L, dTop, dBot) => { if (low()) return; const CH = 150, c0 = Math.floor(Math.max(0, dTop) / CH) - 1, c1 = Math.floor(dBot / CH) + 1, li = LOCS.indexOf(L);
    for (let c = Math.max(0, c0); c <= c1; c++) { const r1 = hash1(c, li + 1), r2 = hash1(c + 7, li + 3), d = c*CH + 40 + r1*70, y = sy(d), dA = base + d, z = zoneOf(dA);
      if (y < -200 || y > H + 200 || r2 < .15) continue;
      const pool = dA >= 2000 ? ['squid', 'whale', 'plankton', 'angler', 'plankton'] : z <= 1 ? ['school', 'turtle', 'school', 'shark'] : z <= 3 ? ['manta', 'school', 'jellies', 'eel', 'turtle'] : ['whale', 'squid', 'angler', 'plankton', 'jellies'];
      const kind = pool[Math.floor(hash1(c, 99) * pool.length)], dir = hash1(c, 5) < .5 ? 1 : -1, spd = kind == 'whale' ? 12 : kind == 'school' ? 45 : kind == 'plankton' ? 0 : 22;
      const span = W + 600, x = ((r2 * span + t * spd * dir) % span + span) % span - 300, dk = dark(Math.max(0, dA));
      g.save(); g.globalAlpha = kind == 'whale' ? .22 : .34; g.translate(x, y);
      if (kind == 'school') { g.fillStyle = mixHex(L.sea, '#ffffff', .55); for (let k = 0; k < 16; k++) { const ox = ((k*37) % 90) - 45 + Math.sin(t*2 + k)*6, oy = ((k*53) % 40) - 20 + Math.cos(t*1.6 + k)*4; g.save(); g.translate(ox, oy); g.scale(dir, 1); g.beginPath(); g.ellipse(0, 0, 6, 2.6, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-5, 0); g.lineTo(-9, -3); g.lineTo(-9, 3); g.fill(); g.restore(); } }
      else if (kind == 'jellies') { for (let k = 0; k < 5; k++) { const ox = k*34 - 68, oy = Math.sin(t*1.2 + k)*14 + (k%2)*18; g.fillStyle = 'rgba(255,170,230,.8)'; g.beginPath(); g.ellipse(ox, oy, 10, 7, 0, Math.PI, TAU); g.fill(); g.strokeStyle = 'rgba(255,170,230,.6)'; g.lineWidth = 1.5; for (let q = -1; q <= 1; q++) { g.beginPath(); g.moveTo(ox + q*4, oy); g.quadraticCurveTo(ox + q*4 + Math.sin(t*3 + q)*3, oy + 9, ox + q*4, oy + 16); g.stroke(); } } }
      else if (kind == 'plankton') { g.globalAlpha = 1; for (let k = 0; k < 26; k++) { const ox = ((k*71) % 300) - 150, oy = ((k*43) % 120) - 60, tw = .4 + .6*Math.abs(Math.sin(t*1.5 + k)); g.fillStyle = 'hsla(' + (170 + (k*13) % 80) + ',90%,70%,' + (tw*.7) + ')'; g.beginPath(); g.arc(ox, oy, 1.6 + (k%3)*.6, 0, TAU); g.fill(); } }
      else { const look = BG[kind], sz = {turtle:22, manta:42, whale:120, squid:62, shark:46, angler:26, eel:30}[kind], fake = {look, n:kind}; g.scale(dir, 1);
        if (dk > .6) { g.globalAlpha *= .9; } drawLook(fake, sz, c, false, true);
        if (kind == 'squid' || kind == 'angler') { g.globalAlpha = .9; g.fillStyle = kind == 'angler' ? '#fff6a0' : '#ff7a3c'; g.beginPath(); g.arc(kind == 'angler' ? sz*.9 : -sz*.15, kind == 'angler' ? -sz*.75 : -sz*.05, kind == 'angler' ? 4 : 5, 0, TAU); g.fill(); } }
      g.restore(); } };
  // shallow-water reef: coral, anemones and starfish growing on the walls near the surface
  const drawReef = (L, y0, dTop) => { if (low() || base > 0 || dTop > 140) return; const coral = L.k == 'vent' ? ['#ff7a3c', '#ffb347', '#c84a2a'] : L.snow ? ['#bfe9ff', '#e8f6ff', '#8fd3ff'] : L.k == 'star' ? ['#b79cff', '#7df9ff', '#ff9ad5'] : ['#ff7aa8', '#ffb347', '#a77bff', '#5fd3c8', '#ff6a5a'];
    for (const side of [0, 1]) for (let k = 0; k < 9; k++) { const d = 8 + k*14 + hash1(k, side + 2)*6, y = sy(d); if (y < y0 + 10 || y > H + 20) continue; const X = 26 + (nz(d + side*977) + 1) * 34 + Math.sin((d + side*977)*.11)*6, bx = side ? W - X + 4 : X - 4, dir = side ? -1 : 1, col = coral[(k + side) % coral.length], kind = Math.floor(hash1(k, side + 9) * 4);
      g.save(); g.translate(bx, y);
      if (kind == 0) { g.strokeStyle = col; g.lineWidth = 4; g.lineCap = 'round'; const br = (x, yy, a, len, depth) => { if (depth > 3) return; const x2 = x + Math.cos(a)*len*dir, y2 = yy + Math.sin(a)*len; g.beginPath(); g.moveTo(x, yy); g.lineTo(x2, y2); g.stroke(); br(x2, y2, a - .5, len*.7, depth + 1); br(x2, y2, a + .5, len*.7, depth + 1); }; br(0, 0, -.6, 14, 0); }
      else if (kind == 1) { g.fillStyle = col; g.beginPath(); g.ellipse(dir*10, -6, 12, 9, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1.5; for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(dir*10, -6, 3 + q*3, Math.PI*.1, Math.PI*.9); g.stroke(); } }
      else if (kind == 2) { for (let q = 0; q < 7; q++) { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(dir*4, 0); g.quadraticCurveTo(dir*(8 + q*2) + Math.sin(t*2 + q)*4, -10, dir*(6 + q*3) + Math.sin(t*2.4 + q)*6, -18 - (q%3)*3); g.stroke(); } g.fillStyle = mixHex(col, '#ffffff', .3); g.beginPath(); g.arc(dir*6, 0, 5, 0, TAU); g.fill(); }
      else { g.fillStyle = col; g.rotate(Math.sin(t*.3 + k)*.1); g.beginPath(); for (let q = 0; q < 10; q++) { const a = q/10*TAU - Math.PI/2, r2 = q % 2 ? 4 : 10; g.lineTo(dir*12 + Math.cos(a)*r2, -4 + Math.sin(a)*r2); } g.closePath(); g.fill(); }
      g.restore(); } };
  // Fish Radar: arrows on the screen edge pointing to good fish just out of view
  const drawRadar = () => { const lv = UL('radar'); if (!lv || (phase != 'drop' && phase != 'reel')) return; const top = camD - SURF/PXM, bot = camD + (H - SURF)/PXM, range = 80 + 40*lv;
    for (const o of fish) { if (o.dead || o.jelly || o.pred || !o.f) continue; if (lv < 2 && o.f.r < 2 && !o.gold && !o.f.special && o.f.guard == null) continue; if (book()[o.f.k] && lv < 3 && !o.gold && !o.f.special) continue;
      const above = o.d < top, below = o.d > bot; if (!above && !below) continue; const dist = above ? top - o.d : o.d - bot; if (dist > range) continue;
      const y = above ? 92 : H - 22, x = Math.max(24, Math.min(W - 24, o.x)), a = 1 - dist / range; g.globalAlpha = .4 + .6*a; g.fillStyle = RC[Math.min(RC.length - 1, o.f.r)];
      g.beginPath(); if (above) { g.moveTo(x, y - 10); g.lineTo(x - 8, y + 4); g.lineTo(x + 8, y + 4); } else { g.moveTo(x, y + 10); g.lineTo(x - 8, y - 4); g.lineTo(x + 8, y - 4); } g.fill(); g.globalAlpha = 1; } };
  const drawWater = (L, y0, dTop, dBot) => {
    const gr = g.createLinearGradient(0, y0, 0, H); gr.addColorStop(0, waterAt(L, Math.max(0, base + dTop))); gr.addColorStop(1, waterAt(L, base + dBot)); g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 16) g.lineTo(x, Math.max(0, sy(-base)) + (sy(-base) > -20 ? wave(x) : 0)); g.lineTo(W, H); g.fill();
    if (sy(-base) > -20) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 16) { const yy = sy(-base) + wave(x); x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
    if (base + dTop < 80 && !low()) { // light rays + caustic shimmer near the surface
      g.fillStyle = 'rgba(255,255,255,' + (.05 + .04*daylight()) + ')'; for (let i = 0; i < 9; i++) { const x = 40 + i*115 + Math.sin(t*.5 + i)*24; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + 46, y0); g.lineTo(x - 40, Math.min(H, sy(80))); g.lineTo(x - 90, Math.min(H, sy(80))); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { const yy = y0 + 18 + k*22; if (yy > H) break; g.beginPath(); for (let x = 0; x <= W; x += 20) { const v = yy + Math.sin(x*.05 + t*2 + k)*4; x ? g.lineTo(x, v) : g.moveTo(x, v); } g.stroke(); } }
    if (!low()) { g.fillStyle = base + dTop > 120 ? 'rgba(220,235,255,.25)' : 'rgba(255,255,255,.2)'; for (let i = 0; i < 40; i++) { const by = ((i*71 - t*(base + dTop > 120 ? -12 : 40)*(1 + i%3)) % H + H) % H; if (by > y0) g.fillRect((i*83 + Math.sin(t + i)*6) % W, by, base + dTop > 120 ? 1.5 : 2, base + dTop > 120 ? 1.5 : 2); } }
    drawBackLife(L, dTop, dBot); drawWalls(L, y0, dTop); drawReef(L, y0, dTop); };
  const drawPred = (o, x, y) => { const dir = o.vx < 0 ? -1 : 1; g.save(); g.translate(x, y); g.scale(dir, 1); drawLook(PRED, PRED.s, o.ph, false, low());
    g.fillStyle = 'rgba(255,40,40,' + (.6 + .4*Math.sin(t*10)) + ')'; g.beginPath(); g.arc(PRED.s*.62, -PRED.s*.08, 3.2, 0, TAU); g.fill(); g.restore();
    if (phase == 'reel' && !low()) { g.strokeStyle = 'rgba(255,60,60,.55)'; g.lineWidth = 2; g.setLineDash([5, 5]); g.beginPath(); g.ellipse(x, y, PRED.s*1.5, PRED.s*.8, 0, 0, TAU); g.stroke(); g.setLineDash([]); } };
  const pill = (x, y, w, h, txt, col, align) => { g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, x, y, w, h, h/2); g.fill(); g.fillStyle = col || '#fff'; g.textBaseline = 'middle'; g.textAlign = align || 'center'; g.fillText(txt, align == 'left' ? x + 12 : align == 'right' ? x + w - 12 : x + w/2, y + h/2 + 1); g.textBaseline = 'alphabetic'; };
  const draw = () => { const L = LOC(), dTop = camD - SURF/PXM, dBot = camD + (H - SURF)/PXM, yS = sy(-base); let tip = {x: W/2 + 30, y: yS - 64};
    if (inPlanet()) drawPlanet(); else if (skyPh()) drawSkyScene(); else {
    if (yS > -40) { drawSky(L, yS); }
    const y0 = Math.max(0, yS);
    drawWater(L, y0, dTop, dBot);
    if (yS > -140) tip = drawBoat(yS);
    for (const o of fish) { if (o.dead) continue; const y = sy(o.d), mg = o.f && o.f.s > 60 ? o.f.s*1.5 : 40; if (y < -mg || y > H + mg) continue; const fade = phase == 'drop' && ghosty(o); if (fade) g.globalAlpha = .35;
      if (o.jelly) drawJelly(o, o.x, y); else if (o.pred) drawPred(o, o.x, y); else drawFish(o, o.x, y); g.globalAlpha = 1;
      if (UL('sonar') >= 2 && !o.jelly && !o.pred && Math.abs(y - sy(hd)) < 140) { g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('🪙' + fmt(fishVal(o.f, AB(o.d)) * (o.gold ? 5 : 1) * coinMult()), o.x, y - o.f.s - 6); } }
    if (base + dBot > maxD && phase != 'surface') { const yb = sy(maxD - base + 3); g.strokeStyle = 'rgba(255,69,57,.6)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(0, yb); g.lineTo(W, yb); g.stroke(); g.setLineDash([]); }
    const hy = sy(hd); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(tip.x, Math.max(-10, tip.y)); g.quadraticCurveTo((tip.x + hx)/2, Math.max(-10, tip.y) + 20, hx, hy - 10); g.stroke();
    hooksX().slice(1).forEach(x2 => { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tip.x, Math.max(-10, tip.y)); g.quadraticCurveTo((tip.x + x2)/2, Math.max(-10, tip.y) + 20, x2, hy - 8); g.stroke();
      g.strokeStyle = '#c3c9d0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x2, hy - 8); g.lineTo(x2, hy + 3); g.arc(x2 - 5, hy + 3, 5, 0, Math.PI); g.stroke(); g.fillStyle = '#FFB000'; g.beginPath(); g.arc(x2, hy - 12, 3, 0, TAU); g.fill(); });
    hangCatch(hy, false);
    // lantern bobber glow in the dark
    const dk = dark(Math.max(0, AB(hd))); if (dk > .35 && !low()) { g.fillStyle = 'rgba(255,240,170,' + (.18 + .1*Math.sin(t*4)) + ')'; g.beginPath(); g.arc(hx, hy - 16, 16, 0, TAU); g.fill(); }
    g.strokeStyle = '#d8dde3'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy - 10); g.lineTo(hx, hy + 4); g.arc(hx - 6, hy + 4, 6, 0, Math.PI); g.stroke(); g.fillStyle = '#FF4539'; g.beginPath(); g.arc(hx, hy - 16, 4, 0, TAU); g.fill();
    // deep water is dark: your lantern lights a circle around the hook
    if (dk > .35 && phase != 'surface' && !low()) { const vg = g.createRadialGradient(hx, hy, 70 + 45*UL('lamp'), hx, hy, 520 + 60*UL('lamp')); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + Math.min(.7, (dk - .35)*1.2) + ')'); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
    drawRadar();
    if (UL('magnet') && phase == 'reel') { g.strokeStyle = 'rgba(213,243,103,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(hx, hy, 20 + 3*UL('magnet'), 0, TAU); g.stroke(); }
    // weather on top
    if (weather != 'clear' && !low() && yS > -40) { g.strokeStyle = 'rgba(200,220,255,.45)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < (weather == 'storm' ? 90 : 50); i++) { const x = (i*97 + t*60) % W, y = (i*53 + t*700) % Math.max(1, yS); g.moveTo(x, y); g.lineTo(x - 4, y + 12); } g.stroke(); }
    if (weather == 'storm' && (Math.sin(t*.9)*Math.sin(t*2.3) > .97)) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 0, W, H); }
    }
    if (flash > 0) { g.fillStyle = 'rgba(233,185,247,' + flash + ')'; g.fillRect(0, 0, W, H); }
    // HUD
    g.font = '800 15px '+A.font; pill(10, 10, 190, 32, inPlanet() ? '💵 ' + fmt(PG.bucks) : inSky() ? '🪶 ' + fmt(SG.feathers) : '🪙 ' + fmt(G.coins), inPlanet() ? '#7fe08a' : inSky() ? '#bfe9ff' : '#F9BF01', 'left');
    const dTxt = inPlanet() ? '🎣 ' + pLake().n + (phase == 'pWait' || phase == 'pFight' ? ' · cast ' + pCast.toFixed(0) + ' m' : ' · cast up to ' + maxCast() + ' m') : skyPh() ? '⬆ ' + fmt(alt) + ' / ' + fmt(skyMax) + ' m up' : (phase == 'surface' || phase == 'tally') && inSky() ? '🎈 ' + fmt(skyUse()) + ' m string' : (phase == 'surface' || phase == 'tally' ? '📏 ' + fmt(lineUse()) + ' m line' + (lineUse() >= FLOOR ? ' (the very bottom!)' : '') : '⬇ ' + fmt(AB(hd)) + ' / ' + fmt(maxD) + ' m');
    g.font = '800 15px '+A.font; pill(W/2 - 150, 10, 300, 32, dTxt, '#fff');
    g.font = '800 15px '+A.font; pill(W - 250, 10, 240, 32, (inPlanet() ? '🏆 ' + Object.keys(PG.rec).length + '/' + PFISH.length : inSky() ? '🐦 ' + caught.length + '/' + skyCap() : '🐟 ' + caught.length + '/' + capN()) + ' · ' + fmt(score) + ' pts', '#fff', 'right');
    g.font = '700 12px '+A.font; const dn = daylight(), clock = dn > .7 ? '☀️ Day' : dn > .25 ? (dayT() < .5 ? '🌤 Morning' : '🌇 Evening') : '🌙 Night · rare fish +30%';
    const wx = weather == 'storm' ? '⛈ Storm · +40% fish' : weather == 'rain' ? '🌧 Rain · +20% fish' : '';
    pill(10, 48, Math.max(120, g.measureText(clock + (wx ? '   ' + wx : '')).width + 26), 24, clock + (wx ? '   ' + wx : ''), '#cfe3ec', 'left');
    if (phase == 'drop' || phase == 'reel' || skyPh()) { g.font = '700 12px '+A.font; const extra = (ghostTier() && phase == 'drop' ? '👻 ignoring ' + ['', 'Common', 'Common & Uncommon', 'below Epic'][ghostTier()] + '   ' : '') + (shieldN ? '🛡 ' + shieldN + '   ' : '') + (combo ? 'COMBO ×' + (combo + 1) + '   ' : '') + (slowF() < 1 ? '🐢 SLOW   ' : '') + (skyPh() ? '☁️ ' + SKYZ[skyZ(alt)].n : '🌈 ' + ohTxt(AB(hd)) + ' / 10 s');
      pill(W - 20 - g.measureText(extra).width - 26, 48, g.measureText(extra).width + 26, 24, extra, '#e8f4ff', 'right');
      const bh = H - 140; g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, W - 18, 84, 8, bh, 4); g.fill(); g.fillStyle = '#D5F367'; g.beginPath(); g.arc(W - 14, 84 + bh * (skyPh() ? 1 - Math.min(1, alt / Math.max(1, skyMax)) : Math.min(1, AB(hd) / Math.max(1, maxD))), 7, 0, TAU); g.fill(); }
    if (zoneT > 0) { g.globalAlpha = Math.min(1, zoneT); g.font = '800 19px '+A.font; pill(W/2 - 190, 86, 380, 40, zoneShow, '#D5F367'); g.globalAlpha = 1; }
    if (msgT > 0) { g.font = '700 16px '+A.font; const mw = Math.min(W - 40, g.measureText(msg).width + 40); pill(W/2 - mw/2, H - 70, mw, 38, msg, '#fff'); }
    if (st == 'play' && phase == 'surface' && !inPlanet()) { const bt = G.bounties && G.bounties.filter(b => b.loc == G.loc);
      g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, W/2 - 210, SURF + 70, 420, 70, 16); g.fill(); g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '800 21px '+A.font; g.fillText(G.skyMode ? 'Tap to float your lure up ☁️' : 'Tap to drop your hook ⬇', W/2, SURF + 100);
      g.font = '500 13px '+A.font; g.fillStyle = '#cfe3d9'; g.fillText(G.skyMode ? 'Sky fishing · touch flying creatures · dodge ⚡ storm clouds · Q to come down' : 'Touch fish to hook them · hold Space to slow · Q to come up · ' + LOC().n, W/2, SURF + 124);
      if (bt && bt.length) { g.font = '700 13px '+A.font; const lines = bt.slice(0, 3).map(b => '📜 ' + b.n + ' ' + Math.min(b.have, b.need) + '/' + b.need + ' → 🪙' + fmt(b.reward)); const bw2 = Math.max(...lines.map(l => g.measureText(l).width)) + 30;
        g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, 10, H - 30 - lines.length*20, bw2, lines.length*20 + 16, 12); g.fill(); g.fillStyle = '#F9BF01'; g.textAlign = 'left'; lines.forEach((l, i) => g.fillText(l, 24, H - 16 - (lines.length - 1 - i)*20 - 4)); } }
    if (phase == 'tally' && tally && tally.planet) { const tw = 460, tx2 = W/2 - tw/2; g.fillStyle = 'rgba(1,40,30,.92)'; rr(g, tx2, 110, tw, 340, 18); g.fill(); g.strokeStyle = tally.trophy ? '#F9BF01' : '#D5F367'; g.lineWidth = tally.trophy ? 4 : 2; g.stroke(); g.textAlign = 'center';
      g.fillStyle = tally.trophy ? '#F9BF01' : '#D5F367'; g.font = '800 24px '+A.font; g.fillText(tally.trophy ? '🏆 TROPHY ' + tally.f.n + '!' : tally.f.n + '!', W/2, 148);
      g.save(); g.translate(W/2, 214); drawLook(tally.f, 44, 0, false, false); g.restore();
      g.fillStyle = '#fff'; g.font = '800 22px '+A.font; g.fillText(tally.kg + ' kg · ' + tally.cm + ' cm', W/2, 300); g.fillStyle = '#7fe08a'; g.font = '800 24px '+A.font; g.fillText('+💵 ' + fmt(tally.coins) + '   +' + fmt(tally.pts) + ' pts', W/2, 336);
      g.fillStyle = '#E9B9F7'; g.font = '700 14px '+A.font; g.fillText(tally.first ? '🏆 New in your Trophy Book!' : tally.best ? '⭐ New personal best!' : 'Trophy size: ' + tally.f.troph + ' kg+', W/2, 372);
      g.fillStyle = '#cfe3d9'; g.font = '600 12px '+A.font; g.fillText('Tap to cast again (closes by itself)', W/2, 430); }
    else if (phase == 'tally' && tally) { const tw = 460, tx2 = W/2 - tw/2; g.fillStyle = 'rgba(1,40,30,.92)'; rr(g, tx2, 110, tw, 350, 18); g.fill(); g.strokeStyle = '#D5F367'; g.lineWidth = 2; g.stroke(); g.textAlign = 'center'; g.fillStyle = '#D5F367'; g.font = '800 24px '+A.font; g.fillText(tally.n ? (tally.sky ? 'Catch of the sky!' : 'Catch of the dive!') : 'Nothing this time', W/2, 148);
      g.fillStyle = '#F9BF01'; g.font = '800 28px '+A.font; g.fillText('+' + (tally.cur || '🪙') + ' ' + fmt(tally.coins), W/2, 188); g.fillStyle = '#fff'; g.font = '700 14px '+A.font; g.fillText('+' + fmt(tally.pts) + ' points · ' + tally.n + ' fish' + (tally.bounty ? ' · 📜 +' + fmt(tally.bounty) : ''), W/2, 214);
      const cnt = {}; tally.list.forEach(x => { const k = x.f.n + (x.gold ? ' ✨' : ''); cnt[k] = (cnt[k]||0) + 1; }); g.font = '600 13px '+A.font; Object.entries(cnt).slice(0, 8).forEach(([n, k], i) => { g.fillStyle = '#e8f4ff'; g.fillText(n + (k > 1 ? ' ×' + k : ''), W/2, 242 + i*20); });
      if (tally.news.length) { g.fillStyle = '#E9B9F7'; g.font = '700 13px '+A.font; g.fillText((tally.sky ? '🐦 New in your Sky Book: ' : '📖 New in your Fish Book: ') + tally.news.slice(0, 2).join(', ') + (tally.news.length > 2 ? ' +' + (tally.news.length - 2) : ''), W/2, 410); }
      g.fillStyle = '#cfe3d9'; g.font = '600 12px '+A.font; g.fillText('Tap to keep fishing (closes by itself)', W/2, 440); }
    if (st == 'ready') A.overlayText(g, W, H, 'FISHING HOLE', __skip ? 'Saved trip · tap or press Space to continue' : 'Endless dive fishing · tap to start');
    if (st == 'over') A.overlayText(g, W, H, 'TICKETS CASHED IN!', fmt(score) + ' points · your coins & upgrades are saved · tap to fish on'); };

  // ---------- the loop ----------
  const offL = A.loop(dt => { t += dt; msgT = Math.max(0, msgT - dt); zoneT = Math.max(0, zoneT - dt); flash = Math.max(0, flash - dt*2); dt = Math.min(dt, .05);
    if (st == 'play' && !quiz) {
      if (SUL('sbuddy') && !document.hidden) { const add = sbuddyRate(SUL('sbuddy')) * dt; SG.feathers = fin(SG.feathers + add); SG.run = fin(SG.run + add); SG.tot = fin(SG.tot + add); }
      if (UL('buddy') && !document.hidden) { const add = buddyRate(UL('buddy')) * dt; G.coins = fin(G.coins + add); G.run = fin(G.run + add); G.tot = fin(G.tot + add); buddyAcc += dt; if (buddyAcc > 20) { buddyAcc = 0; save(); } if (panel && panelTab != 'book' && Math.floor(t*2) != Math.floor((t - dt)*2)) { const p = panel.querySelector('div:nth-child(2)'); if (p) p.textContent = '🪙 ' + fmt(G.coins) + ' coins'; } }
      const kx = (K.ArrowRight || K.d ? 1 : 0) - (K.ArrowLeft || K.a ? 1 : 0), sp = 640 * (1 + .1*(inSky() ? SUL('swing') : UL('steer')));
      if (kx) { tx = null; hx += kx * sp * dt; } else if (tx != null) { const dx = tx - hx; hx += Math.sign(dx) * Math.min(Math.abs(dx), sp*dt); } hx = clamp(hx, 14, W - 14);
      for (const o of fish) { if (o.dead) continue; const y = sy(o.d); if (y < -200 || y > H + 200) continue; o.x += o.vx * dt; if (o.x < -30) o.x = W + 30; if (o.x > W + 30) o.x = -30; }
      if ((phase == 'drop' || phase == 'reel') && !(isFinite(hd) && isFinite(base) && isFinite(camD))) { base = 0; hd = 0; camD = 0; caught = []; toSurface(); say('Oops! Your line got tangled. Try again', 2.5); }   // never freeze on a broken number
      if (skyPh()) skyStep(dt);
      if (inPlanet()) planetStep(dt);
      const prevD = hd;
      const move = (v, dir) => { const room = dir > 0 ? Math.max(0, maxD - AB(hd)) : Math.max(0, AB(hd)), step = Math.min(v*dt, room);
        if (base !== 0 || hd > 1e8 || hd + step > 1e7) { if (!base) rebase(); const rel = Math.min(step, visV()*dt); base += dir*(step - rel); hd += dir*rel; return prevD; } hd += dir*step; return ride(prevD, dir, dt); };
      const prevA = AB(prevD);
      if (phase == 'drop') { visBoost = 1; const pD = move(sinkEff() * slowF(), 1); gen(hd + 160); const hA = AB(hd);
        const z = zoneOf(hA); if (z != lastZone) { if (lastZone >= 0 || z > 0) { zoneShow = zoneName(hA) + ' · ' + fmt(hA >= 2000 ? LAYERS[layerIdx(hA)].d : ZONES[z].d) + ' m'; zoneT = 2; } lastZone = z; }
        if (hA >= 2000 && layerIdx(hA) != layerIdx(prevA) && t - layerT > 1.5) { layerT = t; zoneShow = '⬇ ' + zoneName(hA) + ' · ' + fmt(LAYERS[layerIdx(hA)].d) + ' m'; zoneT = 2.5; A.sfx('blip'); }
        for (const o of fish) { if (o.dead || o.jelly || o.pred || o.passed || o.f.special == 'ohdang' || o.f.special == 'fishmax') continue; if (o.d < pD - 3 || o.d > hd + 3) continue; if (nearHook(o.x, o.f.s + 11)) {
            if (ghosty(o)) { o.passed = true; continue; }
            o.passed = true; if (caught.length < capN()) { catchIt(o); say('Hooked ' + (/^[AEIOU]/i.test(o.f.n) ? 'an ' : 'a ') + o.f.n + ' on the way down' + (caught.length >= capN() ? ' · hook full!' : ''), 1.2); } } }
        if (phase == 'drop' && AB(hd) >= maxD * (1 - 1e-12)) { hd = maxD - base; startReel('End of the line! Reel up and grab fish'); } }
      else if (phase == 'reel') { const full = caught.length >= capN(), turbo = full || AB(hd) < skipD ? 4 : 1; visBoost = full ? 4 : 1; const pD = move(reelEff() * turbo * slowF(), -1); if (base !== 0 && genUp < 0) genUp = hd - 60; if (genUp >= 0) genAbove(hd - 160);
        if (!full) for (const o of fish) { if (o.dead) continue; if (o.d > pD + 4 || o.d < hd - 4) continue; const rad = o.jelly ? 20 : o.pred ? 26 : o.f.s + 14 + 3*UL('magnet');
          if ((o.jelly || o.pred ? Math.abs(o.x - hx) < rad : nearHook(o.x, rad)) && Math.abs(o.d*PXM - hd*PXM) < rad + Math.abs(pD - hd)*PXM) {
            if (o.jelly || o.pred) { const who = o.pred ? 'barracuda' : 'jellyfish'; if (o.pred) o.vx *= -1.4; else o.dead = true; if (o.pred && t - (o.hitT || -9) < 1.2) continue; o.hitT = t; if (shieldN > 0) { shieldN--; A.tone(900, .06, 'sine', .04); say(o.pred ? 'Jelly Guard scared off the barracuda!' : 'Jelly Guard blocked a sting!', 1.2); continue; } if (!caught.length) { A.sfx('bad'); continue; }
              // jellyfish never take a fish that's new for your Fish Book — only one you already have (or a second copy)
              let li = -1; for (let q = caught.length - 1; q >= 0; q--) { const kk = caught[q].f.k; if (book()[kk] || caught.findIndex(c2 => c2.f.k == kk) < q) { li = q; break; } }
              if (li < 0) { A.tone(900, .06, 'sine', .04); say('The ' + who + ' couldn’t grab your new fish!', 1.4); continue; }
              const lost = caught[li]; A.sfx('bad'); quiz = learn2(host, api, (o.pred ? 'A BARRACUDA BIT YOUR LINE' : 'A JELLYFISH STUNG YOUR LINE') + '! ANSWER TO KEEP YOUR ' + lost.f.n.toUpperCase(), () => { quiz = false; say('You held on to the ' + lost.f.n + '!', 1.6); }, () => { quiz = false; const j2 = caught.indexOf(lost); if (j2 >= 0) caught.splice(j2, 1); say('Ouch! A ' + who + ' knocked off your ' + lost.f.n, 1.8); }); if (quiz) break; continue; }
            catchIt(o); if (caught.length >= capN()) { say('Hook full! Zooming up', 1.2); break; } } }
        if (base !== 0 && AB(hd) < 1e8) unbase(); if (AB(hd) <= 0) { unbase(); hd = 0; finishDive(); } }
      if (phase == 'drop' || phase == 'reel') {
        // 🌈 OH DANG!!!!: every 10 s of diving, a chance of depth × 0.00001% per 100,000 m (1 million m = 0.0001% … 1 trillion m = 100%)
        if (G.loc == 'fwish') { fT += dt; while (fT >= .1) { fT -= .1; if (Math.random() < 1e-12 && Math.random() < 1e-13) spawnFISH(); } }
        ohT += dt; if (ohT >= 10) { ohT -= 10; if (Math.random() < ohChance(AB(hd))) { const f = SPEC[G.loc][2]; fish.push({f, x:80 + Math.random()*(W-160), d:Math.max(1, hd + (phase == 'drop' ? 22 : -22)), vx:(Math.random() < .5 ? -1 : 1)*14, ph:0, gold:false});
          say('🌈 OH DANG!!!! Something ENORMOUS is right next to you!', 4); flash = .7; A.sfx('win'); stat(api,'ohDangSeen',1,'add'); } }
        // it can always be hooked, even with a full hook
        for (const o of fish) { if (o.dead || o.jelly || o.pred || !o.f || (o.f.special != 'ohdang' && o.f.special != 'fishmax')) continue; if (nearHook(o.x, o.f.s*(o.f.special == 'fishmax' ? .9 : 1) + 12) && Math.abs(o.d - hd)*PXM < o.f.s*.6 + 12) { if (o.f.special == 'fishmax') { catchFISH(o); continue; } catchIt(o); say('🌈🌈 YOU CAUGHT ' + o.f.n.toUpperCase() + '!!! 🌈🌈', 5); flash = 1; } }
        const hA2 = AB(hd); if (hA2 > G.best) G.best = hA2; if (hA2 > (G.deepest||0)) { G.deepest = hA2; stat(api,'fishDepth',Math.floor(hA2),'max'); }
        if (base !== 0 && (hd > 1e7 || hd < 500)) rebase(); }
      if (combo && t - lastCatch > 1.6) combo = 0; }
    const want = phase == 'drop' ? hd - (230 - SURF)/PXM : phase == 'reel' ? hd - (440 - SURF)/PXM : 0;
    // the catch card closes by itself after 5 s (or tap to close it sooner)
    if (phase == 'tally' && tally && !panel && t - (tally.at || 0) > 5) toSurface();
    camD += (Math.max(0, want) - camD) * Math.min(1, dt * (phase == 'surface' || phase == 'tally' ? 3 : 8)); if (phase == 'drop' && hd - camD > (H - SURF - 60)/PXM) camD = hd - (H - SURF - 60)/PXM; camD = Math.max(Math.max(0, want) - 60, Math.min(Math.max(0, want) + 60, camD));
    draw(); });
  // one-time rebalance for saves from before the Nov 2026 update: your line still reaches just as deep (Mega Spool levels are converted),
  // and giant coin piles shrink to the new scale (about 20 full dives' worth of fish at your depth). Fish Book, spots and other upgrades stay.
  if ((G.bal || 0) < 2) { try { const L = UL('line'), oldLine = Math.min(FLOOR, (30 + 12*L + .6*L*L) * Math.pow(2, UL('spool')) * (1 + .1*(G.pearls || 0)));
      if (UL('spool') > 0) { let k = 0; G.upg.spool = 0; while (k < 180 && lineM(L) < oldLine * .999) G.upg.spool = ++k; }
      const mult = Math.max(...LOCS.filter(o => G.locs[o.k]).map(o => o.mult), 1), fair = fin(20 * capN() * 4 * Math.pow(2.3, 7) * 4 * mult * depthMult(lineM(L)) * coinMult());
      if (G.coins > fair) G.coins = fair; if (G.run > fair) G.run = fair; if (G.tot > fair * 10) G.tot = fair * 10;
    } catch(e) { console.error('[fishing] rebalance failed', e); } G.bal = 2; save(); }
  refreshBar();
  A._dbg = A._dbg || {}; A._dbg.fish = { G, SG, PG, planet: () => ({phase, pPow, pCast, pT, pBite, pWin: pWin(), pTen, pDist, pKg, fish: pFish && pFish.n, nibs: pNibs.slice()}), skyAll: () => SKYALL.length, spawnBIRD: () => spawnBIRD(), sky: () => ({alt, skyMax, cr: skyCr.filter(o => !o.dead && !o.zap).map(o => ({x:o.x, r:o.r})), zaps: skyCr.filter(o => o.zap).length}), s: () => ({st, phase, hd: base + hd, maxD, base, caught:caught.length, score, fish:fish.length, camD}), press, setX: x => { tx = x; }, fishes: () => fish.filter(o => !o.dead).map(o => ({x:o.x, d:o.d, j:!!(o.jelly || o.pred)})), hx: () => hx, ohTest: d => ({chance: ohChance(d), txt: ohTxt(d)}), caughtNames: () => caught.map(c2 => c2.f.n), autoBuy: keys => { let n = 0, go = true; while (go && n < 50) { go = false; let best = null, bc = Infinity; for (const u of UP) { if (!keys.includes(u.k) || (u.max != null && UL(u.k) >= u.max)) continue; const c = cost(u, UL(u.k)); if (c < bc) { bc = c; best = u; } } if (best && G.coins >= bc) { G.coins -= bc; G.upg[best.k] = UL(best.k) + 1; n++; go = true; } } return n; }, bookCount: () => ALL.filter(f => book()[f.k]).length, fillBook: (skip, leave) => { let n = 0; LOCS.filter(o => o.k != skip).forEach(o => [].concat(...FISH[o.k]).concat(SPEC[o.k]).forEach(f => { if (n++ >= (leave == null ? 1e9 : leave)) return; book()[f.k] = 1; })); return n; }, spawnFISH: () => spawnFISH(), spawnOh: () => { const f = SPEC[G.loc][2]; fish.push({f, x:W/2, d:hd + 22, vx:14, ph:0, gold:false}); }, econ: () => { const keep = JSON.stringify(G.upg), out = []; const sp = UP.find(u => u.k == 'spool'); for (let k = 0; k <= 192; k += 12) { G.upg = {line:60, spool:k}; const d = lineM(60); out.push({k, line: d.toExponential(2), layer: zoneName(d), pos: +layerPos(d).toFixed(2), cost: cost(sp, k).toExponential(2), fish: fishVal(FISH.coast[7][3], d).toExponential(2)}); } G.upg = JSON.parse(keep); return out; }, newTest: (d, n) => { let k = 0; for (let i = 0; i < n; i++) { const f = pick(d); if (!f.junk && !f.chest && !book()[f.k]) k++; } return k / n; }, rarTest: (d, n) => { const c = {}; for (let k = 0; k < n; k++) { const f = pick(d); const nm = f.junk ? 'boot' : f.chest ? 'chest' : RN[f.r]; c[nm] = (c[nm]||0) + 1; } return {c, dens: +density(d).toFixed(2)}; }, gallery: () => ALL.map(f => ({n:f.n, sh:f.look ? f.look.shape : '', src:fishIcon(f)})) };
  // ---- save & resume (Save & leave, reloads, closing the browser): coins & upgrades live in the game data; the trip's points here ----
  api.snap && api.snap(() => (st == 'play' && score > 0) ? {v:2, score} : null);
  { const R0 = api.resume; if (R0 && (R0.v == 1 || R0.v == 2)) { try { score = Math.max(0, fin(R0.score)); api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] fishing resume failed', e); } } }
  return () => { offK(); offL(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); save(); };
}});

// =====================================================================================================
// BEAT HOPPER — notes fall down 4 lanes; tap them on the line, in time with the music.
// =====================================================================================================
A.register('rhythm', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 400, 560); c.style.touchAction = 'none';
  const LANES = 4, LW = w/LANES, HIT = h - 90, COLS = ['#FF4539','#F9BF01','#00B451','#64CDF5'], KEYS = ['d','f','j','k'], ALT = ['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'], NOTE_F = [262,330,392,523];
  let st = 'ready', notes, score, combo, best, miss, songT, bpm, beat, nextBeat, t = 0, flash = [0,0,0,0], judge = '', judgeT = 0, quiz = false, song = 0;
  const reset = () => { if (__skip) { __skip = false; return; } notes = []; score = 0; combo = 0; best = 0; miss = 0; songT = 0; bpm = A.D(96,116,136); beat = 60/bpm; nextBeat = 1.5; song++; api.score(0); };
  const fallT = () => A.D(2.2, 1.8, 1.45) / (1 + .06*A.U('slow') * -1 + 0);
  const spawn = () => { const pat = ((song*31) + Math.floor(nextBeat/beat)) % 7, lane = (Math.floor(nextBeat/beat*3 + song) % 4 + (pat > 4 ? 2 : 0)) % 4;
    notes.push({lane, at:nextBeat, hit:false}); if (pat == 2 && nextBeat > 8) notes.push({lane:(lane+2)%4, at:nextBeat, hit:false}); if (pat == 5 && nextBeat > 16) notes.push({lane:(lane+1)%4, at:nextBeat + beat/2, hit:false}); };
  const tap = lane => { if (st != 'play') { if (!quiz) { reset(); st = 'play'; } return; } flash[lane] = .15; const win = .18 + .02*A.U('timing');
    let bestN = null, bd = 9; for (const n of notes) { if (n.hit || n.lane != lane) continue; const d = Math.abs(n.at - songT); if (d < bd) { bd = d; bestN = n; } }
    if (bestN && bd < win) { bestN.hit = true; combo++; best = Math.max(best, combo); const perfect = bd < win*.4; score += (perfect ? 100 : 50) * (1 + Math.floor(combo/10)*.5); api.score(Math.round(score)); judge = perfect ? 'PERFECT' : 'GOOD'; judgeT = .4; A.tone(NOTE_F[lane] * (perfect ? 2 : 1), .12, 'triangle', .06); }
    else { combo = 0; judge = 'MISS'; judgeT = .4; } };
  const offK = A.keys(e => { if (e.type != 'keydown' || e.repeat) return; const i = KEYS.indexOf(e.key.toLowerCase()), j = ALT.indexOf(e.key); if (i >= 0) tap(i); else if (j >= 0) tap(j); else if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; } });
  c.addEventListener('pointerdown', e => tap(clamp(Math.floor(pt(c, e, w, h).x / LW), 0, 3)));
  const offL = A.loop(dt => { t += dt; for (let i = 0; i < 4; i++) flash[i] = Math.max(0, flash[i] - dt); judgeT = Math.max(0, judgeT - dt);
    if (st == 'play' && !quiz) { songT += dt; while (nextBeat < songT + 3) { spawn(); nextBeat += beat; if (Math.floor(nextBeat/beat) % 32 == 0) { bpm += A.D(4,6,8); beat = 60/bpm; } }
      // backing beat
      const bi = Math.floor(songT / beat); if (bi !== tick.b) { tick.b = bi; if (!A.muted) { A.tone(bi % 4 == 0 ? 90 : 140, .06, 'sine', .07); if (bi % 2) A.tone(1800, .02, 'square', .01); } }
      for (const n of notes) if (!n.hit && !n.missed && songT - n.at > .25) { n.missed = true; combo = 0; miss++; judge = 'MISS'; judgeT = .4; }
      notes = notes.filter(n => songT - n.at < 1);
      const maxMiss = A.D(14, 10, 7) + 2*A.U('life');
      if (miss >= maxMiss) { miss = 0; quiz = learn2(host, api, 'TOO MANY MISSES! ANSWER TO KEEP DANCING', () => { quiz = false; }, () => { quiz = false; st = 'over'; A.sfx('over'); stat(api,'rhythmCombo',best,'max'); api.over(Math.round(score)); }); } }
    g.fillStyle = '#120a24'; g.fillRect(0,0,w,h);
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.07)'; g.fillRect(i*LW, 0, LW, h); if (flash[i]) { g.fillStyle = COLS[i]; g.globalAlpha = flash[i]*3; g.fillRect(i*LW, 0, LW, h); g.globalAlpha = 1; } }
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, HIT-2, w, 4);
    if (notes) { const ft = fallT(); for (const n of notes) { if (n.hit) continue; const y = HIT - (n.at - songT) / ft * HIT; if (y < -30 || y > h + 30) continue; g.fillStyle = COLS[n.lane]; rr(g, n.lane*LW + 10, y - 12, LW - 20, 24, 12); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; rr(g, n.lane*LW + 16, y - 9, LW - 32, 6, 3); g.fill(); } }
    for (let i = 0; i < 4; i++) { g.strokeStyle = COLS[i]; g.lineWidth = 3; g.beginPath(); g.arc(i*LW + LW/2, HIT, 18, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '700 14px '+A.font; g.textAlign = 'center'; g.fillText(KEYS[i].toUpperCase(), i*LW + LW/2, h - 30); }
    g.fillStyle = '#fff'; g.font = '700 18px '+A.font; g.textAlign = 'left'; g.fillText(A.fmt(Math.round(score||0)), 12, 26); g.textAlign = 'right'; g.fillText('Combo '+(combo||0), w-12, 26);
    if (judgeT > 0) { g.fillStyle = judge == 'MISS' ? '#ff6a6a' : judge == 'PERFECT' ? '#F9BF01' : '#D5F367'; g.font = '800 30px '+A.font; g.textAlign = 'center'; g.fillText(judge, w/2, HIT - 160); }
    if (st == 'ready') A.overlayText(g, w, h, 'BEAT HOPPER', __skip ? 'Saved game · tap or press Space to continue' : 'D F J K (or arrows, or tap the lanes) when notes hit the line');
    if (st == 'over') A.overlayText(g, w, h, 'SONG OVER', A.fmt(Math.round(score))+' points · best combo '+best+' · tap to dance again'); });
  const tick = {b:-1};
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, notes, score, combo, best, miss, songT, bpm, beat, nextBeat, song} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({notes, score, combo, best, miss, songT, bpm, beat, nextBeat, song} = R0); tick.b = -1; api.score(Math.round(score)); __skip = true; st = 'ready'; } catch(e) { console.error('[save] rhythm resume failed', e); } } }
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// MOSSY LEAP — short platformer levels (coins, spikes, moving platforms) with a boss every 5th level.
// =====================================================================================================
A.register('platformer', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 560, 360); c.style.touchAction = 'none';
  const T = 28, K = keysDown();
  const LEVELS = [
    ['                                        ','                                        ','                                        ','                     o o                ','                    ====          o o   ','          o o                    ====   ','         ====       ^^    ===           ','   P                                  F ','==========  ======  ====  =====  =======','==========  ======  ====  =====  ======='],
    ['                                        ','                        o o o           ','                       =======          ','            o o                    o    ','           ====    ^              ===   ','   P              ===     M             ','=======    ^^           ====      ^   F ','=======  =====  ==            ======== ','=======  =====  ==   ====   ===========','=======  =====  ==   ====   ==========='],
    ['                                        ','              o o o                     ','             =======         o o o      ','      o                     =======     ','     ===          M               ^  F  ','  P        ^             ^^      ====== ','=====    ====  ==      =====          =','=====    ====  ==  ^^  =====  ==  ^^  =','=====    ====  ======  =====  ========','=====    ====  ======  =====  ========'],
    ['                                        ','     o o           o o o                ','    =====         =======       o o     ','               M               =====    ','  P      ^^         ^     ^^         F  ','======  ====      ====   ====   ======= ','======        ==                =======','======  ^^    ==  ^^  ==  ^^  ==  =====','======================================','======================================'],
    ['                                        ','                                        ','                                        ','                                        ','                                        ','  P                                     ','                                        ','                                        ','========================================','========================================'],
  ];
  let st = 'ready', lvl = 0, map, p, coins, score, lives, cam, movers, boss, t = 0, quiz = false, total = 0, keepHp = null;
  const load = () => { const L = LEVELS[lvl % LEVELS.length]; map = L.map(r => r.split('')); movers = []; boss = null; coins = 0;
    map.forEach((row, y) => row.forEach((ch, x) => { if (ch == 'P') { p = {x:x*T, y:y*T, vx:0, vy:0, on:false, face:1, inv:1}; row[x] = ' '; } if (ch == 'M') { movers.push({x:x*T, y:y*T, w:T*3, ox:x*T, dir:1}); row[x] = ' '; } }));
    if (lvl % 5 == 4) { const mx = A.D(2, 3, 4) + Math.floor(lvl/10); boss = {x:28*T, y:8*T - 56, w:56, h:56, vx:-70, hp:mx, max:mx, inv:0, vy:0, jt:2.5, warn:0, stun:0}; if (keepHp && keepHp.lvl == lvl) boss.hp = Math.max(1, keepHp.hp); } keepHp = null; cam = 0; };
  const reset = () => { if (__skip) { __skip = false; return; } lvl = 0; score = 0; lives = A.lives(A.D(5,3,2) + A.U('life')); total = 0; load(); api.score(0); };
  const solid = (x, y) => { const cx = Math.floor(x / T), cy = Math.floor(y / T); if (cy < 0) return false; if (cy >= map.length) return false; return (map[cy][cx] || ' ') == '='; };
  const die = () => { if (A.immortal) { p.inv = 1; return; } const lose = () => { lives--; A.sfx('bad'); if (lives <= 0) { st = 'over'; A.sfx('over'); stat(api,'platLevel',lvl+1,'max'); api.over(score); } else { if (boss) keepHp = {lvl, hp:boss.hp}; load(); } };
    quiz = learn2(host, api, 'OUCH! ANSWER TO TRY AGAIN FROM HERE', () => { quiz = false; p.inv = 2; p.vy = -500; }, () => { quiz = false; lose(); }); };
  const win = () => { score += 500 + coins*10; total++; api.score(score); A.sfx('win'); lvl++; load(); };
  const offK = A.keys(e => { if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; } });
  const touch = {l:false, r:false, j:false}; const tz = e => { const q = pt(c, e, w, h); touch.l = q.x < w*.25; touch.r = q.x > w*.25 && q.x < w*.5; touch.j = q.x > w*.5; };
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } tz(e); }); c.addEventListener('pointermove', e => { if (e.buttons) tz(e); });
  const pu = () => { touch.l = touch.r = touch.j = false; }; c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const offL = A.loop(dt => { A.mood(() => ({danger: st=="play" && lives==1, boss: !!boss})); t += dt; dt = Math.min(dt, .033);
    if (st == 'play' && !quiz) { const L = K.k.ArrowLeft || K.k.a || touch.l, R = K.k.ArrowRight || K.k.d || touch.r, J = K.k[' '] || K.k.ArrowUp || K.k.w || touch.j;
      const acc = 1600, maxv = 220 * (1 + .05*A.U('speed')); p.vx += ((R?1:0) - (L?1:0)) * acc * dt; if (!L && !R) p.vx *= Math.pow(.001, dt); p.vx = clamp(p.vx, -maxv, maxv); if (L) p.face = -1; if (R) p.face = 1;
      if (J && p.on) { p.vy = -560 * (1 + .04*A.U('jump')); p.on = false; A.tone(500,.05,'triangle',.04); }
      p.vy += 1500*dt; p.inv = Math.max(0, p.inv - dt);
      for (const m of movers) { m.x += m.dir*70*dt; if (Math.abs(m.x - m.ox) > T*3) m.dir *= -1; }
      // move x
      p.x += p.vx*dt; const pw = 20, ph = 26; if (solid(p.x, p.y+2) || solid(p.x, p.y+ph-2)) { p.x = (Math.floor(p.x/T)+1)*T; p.vx = 0; } if (solid(p.x+pw, p.y+2) || solid(p.x+pw, p.y+ph-2)) { p.x = Math.floor((p.x+pw)/T)*T - pw - .01; p.vx = 0; }
      const py0 = p.y; p.y += p.vy*dt; p.on = false; if (p.vy > 0 && (solid(p.x+2, p.y+ph) || solid(p.x+pw-2, p.y+ph))) { p.y = Math.floor((p.y+ph)/T)*T - ph; p.vy = 0; p.on = true; } if (p.vy < 0 && (solid(p.x+2, p.y) || solid(p.x+pw-2, p.y))) { p.y = (Math.floor(p.y/T)+1)*T; p.vy = 0; }
      for (const m of movers) if (p.vy >= 0 && p.x+pw > m.x && p.x < m.x+m.w && p.y+ph >= m.y && p.y+ph <= m.y+14) { p.y = m.y - ph; p.vy = 0; p.on = true; p.x += m.dir*70*dt; }
      p.x = clamp(p.x, 0, map[0].length*T - pw);
      const cx = Math.floor((p.x+pw/2)/T), cy = Math.floor((p.y+ph/2)/T), ch = (map[cy]||[])[cx];
      if (ch == 'o') { map[cy][cx] = ' '; coins++; score += 10; api.score(score); A.sfx('coin'); }
      if (ch == '^' && p.inv <= 0) die(); if (ch == 'F' && !boss) win();
      if (p.y > map.length*T + 40) die();
      if (boss) { const B = boss; B.inv = Math.max(0, B.inv - dt); B.stun = Math.max(0, B.stun - dt);
        // walks back and forth (a little faster each time you stomp him), and shakes for half a second before every jump so you can see it coming
        const sp = 70 + 18*(B.max - B.hp); if (B.stun <= 0 && B.warn <= 0) { B.x += Math.sign(B.vx || -1)*sp*dt; }
        if (B.x < 3*T) { B.x = 3*T; B.vx = 1; } if (B.x > 36*T) { B.x = 36*T; B.vx = -1; }
        B.vy += 1500*dt; B.y += B.vy*dt; const onG = B.y >= 8*T - B.h; if (onG) { B.y = 8*T - B.h; B.vy = 0; }
        if (onG && B.stun <= 0) { if (B.warn > 0) { B.warn -= dt; if (B.warn <= 0) { B.vy = -480; B.vx = p.x > B.x ? 1 : -1; } } else { B.jt -= dt; if (B.jt <= 0) { B.warn = .5; B.jt = 2.6 + Math.random()*1.4; } } }
        const over = p.x+pw > B.x && p.x < B.x+B.w && p.y+ph > B.y && p.y < B.y+B.h;
        if (over) { const fromAbove = p.vy >= 0 && py0 + ph <= B.y + 12;
          if (fromAbove) { p.y = B.y - ph; p.vy = -540; p.inv = Math.max(p.inv, .35);
            if (B.inv <= 0) { B.hp--; B.inv = .9; B.stun = .7; B.warn = 0; A.sfx('hit'); score += 200; api.score(score); if (B.hp <= 0) { boss = null; score += 1500; A.sfx('win'); stat(api,'platBoss',1,'add'); } } }
          // bumping his side only hurts if you're really inside him (a few pixels of forgiveness), and never while he's dazed
          else if (p.inv <= 0 && B.stun <= 0 && p.x+pw > B.x+6 && p.x < B.x+B.w-6 && p.y+ph > B.y+8) die(); } }
      if (!boss && lvl % 5 == 4) win();
      cam = clamp(p.x - w/2, 0, map[0].length*T - w); }
    sky(g, w, h, '#a0e0ff', '#e0fff0'); g.save(); g.translate(-Math.round(cam||0), 0);
    if (map) map.forEach((row, y) => row.forEach((ch, x) => { const X = x*T, Y = y*T; if (X - cam < -T || X - cam > w) return;
      if (ch == '=') { g.fillStyle = (map[y-1]||[])[x] == '=' ? '#8D5B1D' : '#5aa84a'; g.fillRect(X, Y, T, T); if ((map[y-1]||[])[x] != '=') { g.fillStyle = '#8D5B1D'; g.fillRect(X, Y+8, T, T-8); g.fillStyle = '#7cc46a'; g.fillRect(X, Y, T, 8); } }
      else if (ch == 'o') { g.fillStyle = C.gold; g.beginPath(); g.ellipse(X+T/2, Y+T/2, 7*Math.abs(Math.cos(t*3)) + 1, 8, 0, 0, TAU); g.fill(); }
      else if (ch == '^') { g.fillStyle = '#c9ccd1'; g.beginPath(); for (let k = 0; k < 3; k++) { g.moveTo(X + k*T/3, Y+T); g.lineTo(X + k*T/3 + T/6, Y+8); g.lineTo(X + (k+1)*T/3, Y+T); } g.fill(); }
      else if (ch == 'F') { g.fillStyle = '#6b4a2b'; g.fillRect(X+12, Y-30, 4, 58); g.fillStyle = boss ? '#999' : '#FF4539'; g.beginPath(); g.moveTo(X+16, Y-30); g.lineTo(X+36, Y-22); g.lineTo(X+16, Y-14); g.fill(); } }));
    if (movers) for (const m of movers) { g.fillStyle = '#b48cff'; rr(g, m.x, m.y, m.w, 12, 6); g.fill(); }
    if (boss) { const B = boss; g.save(); if (B.warn > 0) g.translate(Math.sin(t*60)*3, 0); g.globalAlpha = B.inv > 0 && Math.sin(t*30) > 0 ? .4 : 1; g.fillStyle = '#6a3a8a'; rr(g, B.x, B.y, B.w, B.h, 14); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(B.x+16, B.y+20, 7, 0, TAU); g.arc(B.x+40, B.y+20, 7, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(B.x+16 + Math.sign(B.vx)*2, B.y+20, 3, 0, TAU); g.arc(B.x+40 + Math.sign(B.vx)*2, B.y+20, 3, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(B.x+8, B.y); g.lineTo(B.x+16, B.y-14); g.lineTo(B.x+28, B.y-4); g.lineTo(B.x+40, B.y-14); g.lineTo(B.x+48, B.y); g.fill();
      if (B.stun > 0) { g.fillStyle = '#F9BF01'; g.font = '700 14px '+A.font; g.textAlign = 'center'; for (let k = 0; k < 3; k++) g.fillText('★', B.x + B.w/2 + Math.cos(t*6 + k*2.1)*22, B.y - 20 + Math.sin(t*6 + k*2.1)*6); }
      if (B.warn > 0) { g.fillStyle = '#FF4539'; g.font = '800 18px '+A.font; g.textAlign = 'center'; g.fillText('!', B.x + B.w/2, B.y - 22); } g.restore(); }
    if (p && !(p.inv > 0 && Math.sin(t*25) > 0)) { g.fillStyle = '#00B451'; rr(g, p.x, p.y, 20, 26, 8); g.fill(); g.fillStyle = '#D5F367'; rr(g, p.x+3, p.y+12, 14, 8, 4); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x+10 + p.face*4, p.y+7, 4, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(p.x+11 + p.face*5, p.y+7, 2, 0, TAU); g.fill(); }
    g.restore();
    g.fillStyle = '#121313'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Level '+(lvl+1)+'  ·  '+A.fmt(score||0), 12, 22); g.textAlign = 'right'; g.fillText('❤'.repeat(clamp(lives||0,0,8)), w-12, 22);
    if (boss) { g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, w/2-100, 32, 200, 10, 5); g.fill(); g.fillStyle = '#b48cff'; rr(g, w/2-100, 32, 200*boss.hp/boss.max, 10, 5); g.fill(); g.fillStyle = '#121313'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText('THE BRAMBLE KING · stomp on his head!', w/2, 56); }
    if (st == 'ready') A.overlayText(g, w, h, 'MOSSY LEAP', __skip ? 'Saved game · tap or press Space to continue' : '← → move · Space jump · phone: left quarter / next quarter move, right half jump');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', A.fmt(score||0)+' points · level '+(lvl+1)+' · tap to try again'); });
  reset(); st = 'ready';
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  A._dbg = A._dbg || {}; A._dbg.plat = { s: () => ({st, lvl, lives, quiz:!!quiz, p:p && {x:p.x, y:p.y, vy:p.vy, on:p.on}, boss:boss && {x:boss.x, y:boss.y, hp:boss.hp, warn:boss.warn, stun:boss.stun}}), go: n => { lvl = n; load(); } };
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, lvl, score, lives, total} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({lvl, score, lives, total} = R0); load(); api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] platformer resume failed', e); } } }
  return () => { offK(); offL(); K.off(); };
}});

// =====================================================================================================
// PINECONE RALLY — top-down racing on a looping forest track against 3 rivals. 3 laps.
// =====================================================================================================
A.register('racing', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 520, 520); c.style.touchAction = 'none';
  const K = keysDown(), CX = w/2, CY = h/2 + 6, TW = 66, N = 240, CPN = 8, LAPS = 4;
  // Track centerline: a wobbly loop (not a plain oval) sampled into N points
  const TR = []; for (let i = 0; i < N; i++) { const a = i / N * TAU; const r = 1 + .16*Math.sin(2*a + .6) + .07*Math.cos(3*a); TR.push({x: CX + Math.cos(a)*190*r, y: CY + Math.sin(a)*160*r}); }
  TR.forEach((p, i) => { const q = TR[(i+1) % N], o = TR[(i-1+N) % N], dx = q.x - o.x, dy = q.y - o.y, L = Math.hypot(dx, dy) || 1; p.tx = dx/L; p.ty = dy/L; p.nx = -dy/L; p.ny = dx/L; });
  const START = Math.round(N/4);   // bottom of the loop
  const CP = Array.from({length:CPN}, (_, k) => (START + Math.round(k*N/CPN)) % N);   // checkpoint 0 = start/finish line
  const nearest = (x, y, hint) => { let best = 0, bd = 1e9; const from = hint == null ? 0 : hint - 20, to = hint == null ? N : hint + 20; for (let k = from; k < to; k++) { const i = (k + N) % N, p = TR[i], d = (p.x-x)*(p.x-x) + (p.y-y)*(p.y-y); if (d < bd) { bd = d; best = i; } } return {i:best, d:Math.sqrt(bd)}; };
  let st = 'ready', cars, t = 0, raceT = 0, countdown = 0, finish = [], steerX = null, endT = 0, overText = '';
  const mk = (i, me) => { const idx = (START - 6 - Math.floor(i/2)*7 + N) % N, p = TR[idx], off = i % 2 ? 15 : -15; return {x:p.x + p.nx*off, y:p.y + p.ny*off, dir:Math.atan2(p.ty, p.tx), sp:0, me:!!me, lap:0, cp:1, last:0, near:idx, off:0, inv:0, col:['#FF4539','#64CDF5','#F9BF01','#b48cff'][i], aiSkill:A.D(.8,.88,.97) - i*.025, done:false, lane:off*.8, boost:0}; };
  const reset = () => { if (__skip) { __skip = false; return; } cars = [mk(0, true), mk(1), mk(2), mk(3)]; raceT = 0; countdown = 3; finish = []; endT = 0; api.score(0); };
  const startRace = () => { reset(); st = 'play'; if (A.learnOn && A.learnOn()) { countdown = 99; A.quiz(host, 'ANSWER FOR A HEAD START', ok => { try { api.edu && api.edu(ok); } catch(e){} countdown = 3; if (ok) cars[0].boost = 3; }); } };
  const offK = A.keys(e => { if ((e.key == ' ' || e.key == 'Enter') && st != 'play') startRace(); });
  c.addEventListener('pointerdown', e => { if (st != 'play') { startRace(); return; } steerX = pt(c, e, w, h); }); c.addEventListener('pointermove', e => { if (steerX) steerX = pt(c, e, w, h); });
  const pu = () => { steerX = null; }; c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const top = () => 270 * (1 + .04*A.U('engine'));
  const progress = car => car.done ? 1e6 - finish.indexOf(car) : car.lap*CPN + ((car.cp - 1 + CPN) % CPN) + (1 - Math.min(1, Math.hypot(TR[CP[car.cp]].x - car.x, TR[CP[car.cp]].y - car.y)/200))*.9;
  const respawn = car => { const p = TR[CP[car.last]]; car.x = p.x; car.y = p.y; car.dir = Math.atan2(p.ty, p.tx); car.sp = 0; car.off = 0; car.inv = 1.2; car.near = CP[car.last]; if (car.me) A.tone(220,.2,'triangle',.05); };
  const endRace = place => { if (st != 'play') return; const sc = Math.max(100, Math.round((4 - place) * 800 + Math.max(0, 150 - raceT) * 20 + A.D(0, 200, 500))); A.sfx(place == 1 ? 'win' : 'coin'); stat(api,'raceWins',place == 1 ? 1 : 0,'add'); api.score(sc);
    overText = place+(['st','nd','rd','th'][place-1])+' place! '+A.fmt(sc)+' points'; st = 'over'; api.over(sc); };
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const offL = A.loop(dt => { t += dt; dt = Math.min(dt, .033);
    if (st == 'play') { if (countdown > 0) { const before = Math.ceil(countdown); countdown -= dt; if (Math.ceil(countdown) != before) A.tone(countdown <= 0 ? 880 : 440, .15, 'square', .05); }
      else { raceT += dt;
        for (const car of cars) { const nr = nearest(car.x, car.y, car.near); car.near = nr.i; const onRoad = nr.d < TW/2; car.inv = Math.max(0, car.inv - dt);
          if (car.done) car.sp *= Math.pow(.2, dt);
          else if (car.me) { let turn = (K.k.ArrowLeft||K.k.a ? -1 : 0) + (K.k.ArrowRight||K.k.d ? 1 : 0), gas = K.k.ArrowUp || K.k.w || K.k[' '] ? 1 : (K.k.ArrowDown || K.k.s ? -0.6 : 0);
            if (steerX) { const want = Math.atan2(steerX.y - car.y, steerX.x - car.x); turn = clamp(angDiff(want, car.dir)*2.2, -1, 1); gas = Math.hypot(steerX.x - car.x, steerX.y - car.y) > 30 ? 1 : 0; }
            car.dir += turn * 2.6 * dt * clamp(Math.abs(car.sp)/110, .25, 1) * Math.sign(car.sp || 1); car.sp += gas * 250 * dt; }
          else { const tg = TR[(car.near + 9) % N], tx = tg.x + tg.nx*car.lane, ty = tg.y + tg.ny*car.lane; car.dir += clamp(angDiff(Math.atan2(ty - car.y, tx - car.x), car.dir)*3, -1, 1) * 2.6 * dt; car.sp += 250 * dt * (car.sp < top()*car.aiSkill ? 1 : 0); }
          if (car.boost > 0) car.boost -= dt;
          const cap = top() * (car.me ? (car.boost > 0 ? 1.35 : 1) : car.aiSkill) * (onRoad ? 1 : .4);   // grass and dirt slow you down a lot
          car.sp = clamp(car.sp * Math.pow(onRoad ? .72 : .3, dt), -70, cap);
          car.x += Math.cos(car.dir) * car.sp * dt; car.y += Math.sin(car.dir) * car.sp * dt;
          // too far off the track (or off the screen) → back to the last checkpoint
          car.off = onRoad ? 0 : car.off + dt; if (!car.done && (nr.d > TW/2 + 55 || car.off > 3 || car.x < 4 || car.y < 4 || car.x > w-4 || car.y > h-4)) respawn(car);
          // checkpoints must be passed in order; crossing the start line (checkpoint 0) after all the others counts a lap
          if (!car.done) { const p = TR[CP[car.cp]]; if (Math.hypot(p.x - car.x, p.y - car.y) < TW*.75) { car.last = car.cp;
              if (car.cp == 0) { car.lap++; if (car.me && car.lap < LAPS) A.sfx('coin');
                if (car.lap >= LAPS) { car.done = true; finish.push(car); if (car.me) { setTimeout(() => endRace(finish.indexOf(car) + 1), 700); } else if (finish.length == 1) endT = 25; } }
              else if (car.me) A.tone(660,.05,'triangle',.04);
              car.cp = (car.cp + 1) % CPN; } } }
        // cars push apart instead of sticking
        for (let i = 0; i < cars.length; i++) for (let j = i+1; j < cars.length; j++) { const A1 = cars[i], B1 = cars[j], dx = B1.x - A1.x, dy = B1.y - A1.y, d = Math.hypot(dx, dy); if (d < 20 && d > 0) { const nx = dx/d, ny = dy/d, push = (20 - d)/2; A1.x -= nx*push; A1.y -= ny*push; B1.x += nx*push; B1.y += ny*push; A1.sp *= .95; B1.sp *= .95; } }
        // once a rival finishes, the race ends within 25 s (you come in behind everyone who finished)
        if (endT > 0 && !cars[0].done) { endT -= dt; if (endT <= 0 || finish.length >= 3) endRace(finish.length + 1); }
        if (raceT > 300 && !cars[0].done) endRace(4); } }
    // ---- draw ----
    g.fillStyle = '#3f8a3a'; g.fillRect(0,0,w,h); for (let i = 0; i < 46; i++) { const x = (i*97) % w, y = (i*61) % h; if (nearest(x, y).d < TW/2 + 8) continue; g.fillStyle = '#2f6a2a'; g.beginPath(); g.moveTo(x, y-10); g.lineTo(x+7, y+6); g.lineTo(x-7, y+6); g.fill(); }
    const loop = () => { g.beginPath(); TR.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); };
    g.lineJoin = 'round'; g.strokeStyle = '#c8b078'; g.lineWidth = TW + 34; loop(); g.stroke(); g.strokeStyle = '#FF4539'; g.lineWidth = TW + 8; loop(); g.stroke(); g.strokeStyle = '#6a6a72'; g.lineWidth = TW; loop(); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.setLineDash([16,14]); loop(); g.stroke(); g.setLineDash([]);
    { const p = TR[CP[0]]; for (let k = 0; k < 6; k++) { const o = -TW/2 + (k+.5)*TW/6; g.fillStyle = k % 2 ? '#fff' : '#121313'; g.save(); g.translate(p.x + p.nx*o, p.y + p.ny*o); g.rotate(Math.atan2(p.ty, p.tx)); g.fillRect(-3, -TW/12, 6, TW/6); g.restore(); } }
    // next checkpoint gate for the player
    const me = cars && cars[0];
    if (me && !me.done && st == 'play') { const p = TR[CP[me.cp]], pulse = .6 + .4*Math.sin(t*6); g.strokeStyle = 'rgba(249,191,1,'+pulse+')'; g.lineWidth = 6; g.beginPath(); g.moveTo(p.x + p.nx*TW/2, p.y + p.ny*TW/2); g.lineTo(p.x - p.nx*TW/2, p.y - p.ny*TW/2); g.stroke();
      g.fillStyle = '#F9BF01'; g.font = '800 12px '+A.font; g.textAlign = 'center'; g.fillText(me.cp == 0 ? 'FINISH' : 'CP '+me.cp, p.x + p.nx*(TW/2 + 14), p.y + p.ny*(TW/2 + 14) + 4);
      const a = Math.atan2(p.y - me.y, p.x - me.x); g.save(); g.translate(me.x + Math.cos(a)*26, me.y + Math.sin(a)*26); g.rotate(a); g.fillStyle = 'rgba(249,191,1,.9)'; g.beginPath(); g.moveTo(8, 0); g.lineTo(-4, -6); g.lineTo(-4, 6); g.fill(); g.restore(); }
    if (cars) for (const car of cars) { if (car.inv > 0 && Math.sin(t*30) > 0) continue; g.save(); g.translate(car.x, car.y); g.rotate(car.dir); g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -11, -6, 24, 14, 4); g.fill(); g.fillStyle = car.col; rr(g, -12, -7, 24, 14, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(2, -5, 5, 10); if (car.me) { g.fillStyle = '#fff'; g.font = '700 9px '+A.font; g.textAlign = 'center'; g.rotate(-car.dir); g.fillText('YOU', 0, -12); } g.restore(); }
    if (me) { const place = 1 + cars.filter(cc => cc !== me && progress(cc) > progress(me)).length;
      g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Lap '+Math.min(LAPS, me.lap+1)+'/'+LAPS+'   Place '+place+'/4   Next: '+(me.cp == 0 ? 'finish line' : 'checkpoint '+me.cp+'/'+(CPN-1)), 12, 24); g.textAlign = 'right'; g.fillText(raceT.toFixed(1)+' s', w-12, 24);
      if (endT > 0 && !me.done) { g.fillStyle = '#F9BF01'; g.textAlign = 'center'; g.fillText('A rival finished! '+Math.ceil(endT)+' s left', w/2, 48); }
      if (me.off > .6 && !me.done) { g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('Back to the road! ('+Math.max(0, 3 - me.off).toFixed(1)+' s)', w/2, h - 20); } }
    if (st == 'play' && countdown > 0) { g.fillStyle = '#fff'; g.font = '800 64px '+A.font; g.textAlign = 'center'; g.fillText(countdown > 10 ? '…' : String(Math.ceil(countdown)), CX, CY + 20); }
    if (st == 'ready') A.overlayText(g, w, h, 'PINECONE RALLY', __skip ? 'Saved game · tap or press Space to continue' : '↑ go · ← → steer · or hold a finger where to drive · pass every checkpoint · 4 laps');
    if (st == 'over') A.overlayText(g, w, h, 'RACE OVER', overText+' · tap to race again'); });
  A._dbg = A._dbg || {}; A._dbg.racing = () => ({cars, TR, CP, st, raceT, steer:q => { steerX = q; }});
  reset(); st = 'ready';
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' && cars && !cars[0].done) ? {v:2, cars, raceT, countdown, endT, finishIdx: finish.map(c2 => cars.indexOf(c2))} : null);
  { const R0 = api.resume; if (R0 && R0.v == 2) { try { ({cars, raceT, countdown} = R0); endT = R0.endT || 0; finish = (R0.finishIdx||[]).map(i => cars[i]).filter(Boolean); api.score(0); __skip = true; st = 'ready'; } catch(e) { console.error('[save] racing resume failed', e); } } }
  return () => { offK(); offL(); K.off(); };
}});

// =====================================================================================================
// BUBBLE POP — aim and shoot bubbles; 3+ of one color pop, and anything left hanging drops.
// =====================================================================================================
A.register('bubble', { mount(host, api){
  let __skip = false;   // set when a saved game was restored: the next start continues it instead of resetting
  const {c,g,w,h} = A.canvas(host, 420, 600); c.style.touchAction = 'none';
  const R = 15, D = R*2, COLSN = 13, COL = ['#FF4539','#F9BF01','#00B451','#64CDF5','#b48cff','#ff8fd0'];
  let st = 'ready', grid, shot, next, cur, aim = -Math.PI/2, score, shotsToDrop, drop, t = 0, pops = [], quiz = false;
  const ncol = () => Math.min(COL.length, A.D(4,5,6));
  const cell = (r, q) => ({x: R + q*D + (r % 2 ? R : 0) + 3, y: R + r*(D-4) + drop*(D-4) + 40});
  const reset = () => { if (__skip) { __skip = false; return; } grid = []; drop = 0; for (let r = 0; r < 6; r++) { grid.push([]); for (let q = 0; q < COLSN - (r%2); q++) grid[r][q] = Math.floor(Math.random()*ncol()); } score = 0; shotsToDrop = A.D(9,7,5) + A.U('patience'); cur = Math.floor(Math.random()*ncol()); next = Math.floor(Math.random()*ncol()); shot = null; api.score(0); };
  const nbrs = (r, q) => { const odd = r % 2, d = odd ? [[0,-1],[0,1],[-1,0],[-1,1],[1,0],[1,1]] : [[0,-1],[0,1],[-1,-1],[-1,0],[1,-1],[1,0]]; return d.map(([dr,dq]) => [r+dr, q+dq]).filter(([a,b]) => a >= 0 && b >= 0 && b < COLSN - (a%2)); };
  const get = (r, q) => grid[r] ? grid[r][q] : undefined;
  const flood = (r0, q0, match) => { const seen = new Set([r0+','+q0]), st2 = [[r0,q0]], out = []; while (st2.length) { const [r,q] = st2.pop(); out.push([r,q]); for (const [a,b] of nbrs(r,q)) { const k = a+','+b; if (seen.has(k)) continue; const v = get(a,b); if (v === undefined || v === null) continue; if (match !== null && v !== match) continue; seen.add(k); st2.push([a,b]); } } return out; };
  const fire = () => { if (shot || st != 'play' || quiz) return; shot = {x:w/2, y:h-50, vx:Math.cos(aim)*700, vy:Math.sin(aim)*700, c:cur}; cur = next; next = Math.floor(Math.random()*ncol()); A.tone(500,.04,'square',.03); };
  const land = () => { let best = null, bd = 1e9; for (let r = 0; r < grid.length + 1; r++) for (let q = 0; q < COLSN - (r%2); q++) { if (get(r,q) != null) continue; const p = cell(r,q), d = Math.hypot(p.x - shot.x, p.y - shot.y); if (d < bd && (r == 0 || nbrs(r,q).some(([a,b]) => get(a,b) != null))) { bd = d; best = [r,q]; } }
    if (!best) { shot = null; return; } const [r,q] = best; while (grid.length <= r) grid.push([]); grid[r][q] = shot.c; shot = null;
    const grp = flood(r, q, grid[r][q]); if (grp.length >= 3) { grp.forEach(([a,b]) => { const p = cell(a,b); pops.push({x:p.x, y:p.y, c:COL[grid[a][b]], t:.4}); grid[a][b] = null; }); score += grp.length*10; A.sfx('point');
      // drop floaters
      const anchored = new Set(); for (let q2 = 0; q2 < COLSN; q2++) if (get(0,q2) != null) flood(0, q2, null).forEach(([a,b]) => anchored.add(a+','+b));
      let fell = 0; grid.forEach((row, a) => row.forEach((v, b) => { if (v != null && !anchored.has(a+','+b)) { const p = cell(a,b); pops.push({x:p.x, y:p.y, c:COL[v], t:.6, fall:1}); grid[a][b] = null; fell++; } }));
      if (fell) { score += fell*25; A.sfx('coin'); } api.score(score); }
    else { shotsToDrop--; if (shotsToDrop <= 0) { drop++; shotsToDrop = A.D(9,7,5) + A.U('patience'); A.tone(160,.15,'sawtooth',.05); } }
    if (grid.every(row => row.every(v => v == null))) { score += 1000; api.score(score); A.sfx('win'); const keep = score; reset(); score = keep; api.score(score); }
    // lose check
    let lowest = -1; grid.forEach((row, a) => { if (row.some(v => v != null)) lowest = a; });
    if (lowest >= 0 && cell(lowest, 0).y > h - 110) { quiz = learn2(host, api, 'THE BUBBLES REACHED THE BOTTOM! ANSWER TO PUSH THEM BACK', () => { quiz = false; drop = Math.max(-2, drop - 3); }, () => { quiz = false; st = 'over'; A.sfx('over'); stat(api,'bubbleBest',score,'max'); api.over(score); }); } };
  const offK = A.keys(e => { if (e.type != 'keydown') return; if (e.key == 'ArrowLeft' || e.key == 'a') aim = Math.max(-Math.PI + .2, aim - .06); if (e.key == 'ArrowRight' || e.key == 'd') aim = Math.min(-.2, aim + .06);
    if (e.key == ' ' || e.key == 'Enter' || e.key == 'ArrowUp') { if (st != 'play') { reset(); st = 'play'; } else fire(); } if (e.key == 'Shift' || e.key == 'x') { const tmp = cur; cur = next; next = tmp; } });
  const aimAt = e => { const q = pt(c, e, w, h); aim = clamp(Math.atan2(q.y - (h-50), q.x - w/2), -Math.PI + .2, -.2); };
  c.addEventListener('pointermove', aimAt); c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } const q = pt(c, e, w, h); if (q.y > h - 60 && Math.abs(q.x - (w/2 + 60)) < 30) { const tmp = cur; cur = next; next = tmp; return; } aimAt(e); });
  c.addEventListener('pointerup', e => { if (st == 'play') fire(); });
  const offL = A.loop(dt => { t += dt;
    if (shot) { const steps = 4; for (let s = 0; s < steps && shot; s++) { shot.x += shot.vx*dt/steps; shot.y += shot.vy*dt/steps; if (shot.x < R+3) { shot.x = R+3; shot.vx *= -1; } if (shot.x > w-R-3) { shot.x = w-R-3; shot.vx *= -1; }
      if (shot.y < 40 + drop*(D-4) + R) { land(); break; } let hit = false; grid.forEach((row, a) => row.forEach((v, b) => { if (v != null && !hit) { const p = cell(a,b); if (Math.hypot(p.x - shot.x, p.y - shot.y) < D - 4) hit = true; } })); if (hit) land(); } }
    for (const p of pops) { p.t -= dt; if (p.fall) p.y += 400*dt; } pops = pops.filter(p => p.t > 0);
    g.fillStyle = '#0d2a40'; g.fillRect(0,0,w,h); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, 0, w, 40 + drop*(D-4)); g.strokeStyle = 'rgba(255,90,90,.5)'; g.setLineDash([6,6]); g.beginPath(); g.moveTo(0, h-110); g.lineTo(w, h-110); g.stroke(); g.setLineDash([]);
    const ball = (x, y, ci, r=R) => { const gr = g.createRadialGradient(x - r*.35, y - r*.35, 1, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(.3, COL[ci]); gr.addColorStop(1, COL[ci]); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r-1, 0, TAU); g.fill(); };
    if (grid) grid.forEach((row, a) => row.forEach((v, b) => { if (v != null) { const p = cell(a,b); ball(p.x, p.y, v); } }));
    for (const p of pops) { g.globalAlpha = p.t*2; g.strokeStyle = p.c; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, R + (1-p.t)*12, 0, TAU); g.stroke(); } g.globalAlpha = 1;
    if (st == 'play') { g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([4,8]); g.beginPath(); g.moveTo(w/2, h-50); let ax = w/2, ay = h-50, vx = Math.cos(aim), vy = Math.sin(aim); for (let k = 0; k < 40; k++) { ax += vx*10; ay += vy*10; if (ax < R || ax > w-R) vx *= -1; g.lineTo(ax, ay); if (ay < 60) break; } g.stroke(); g.setLineDash([]); }
    if (cur != null) ball(w/2, h-50, cur); if (next != null) ball(w/2 + 60, h-40, next, 11);
    if (shot) ball(shot.x, shot.y, shot.c);
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText(A.fmt(score||0), 10, 24); g.textAlign = 'right'; g.fillText('Drop in '+(shotsToDrop||0), w-10, 24); g.font = '11px '+A.font; g.textAlign = 'center'; g.fillText('swap', w/2 + 60, h-16);
    if (st == 'ready') A.overlayText(g, w, h, 'BUBBLE POP', __skip ? 'Saved game · tap or press Space to continue' : 'Aim with the mouse or ← →, tap / Space to shoot · match 3 to pop');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', A.fmt(score||0)+' points · tap to play again'); });
  reset(); st = 'ready';
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, grid, drop, score, shotsToDrop, cur, next} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({grid, drop, score, shotsToDrop, cur, next} = R0); shot = null; api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] bubble resume failed', e); } } }
  return () => { offK(); offL(); };
}});
})();
