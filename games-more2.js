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
    g.fillStyle = '#121313'; g.font = '700 17px '+A.font; g.textAlign = 'left'; g.fillText(score.toLocaleString()+' · 🌰 '+acorns, 12, 24); g.textAlign = 'right'; g.fillText('❤'.repeat(clamp(lives,0,8)), w-12, 24);
    if (st == 'ready') A.overlayText(g, w, h, 'TRAIL RUNNER', __skip ? 'Saved game · tap or press Space to continue' : 'Space / tap to jump (tap again in the air for a double jump) · ↓ or tap low to duck under branches and birds');
    if (st == 'over') A.overlayText(g, w, h, 'TRIPPED!', score.toLocaleString()+' points · tap to run again'); });
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
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText(score.toLocaleString(), 28, 22); g.textAlign = 'right'; g.fillText((mult > 1 ? '×'+mult+'  ' : '')+'Balls '+ballsLeft, 386, 22);
    if (st == 'ready') A.overlayText(g, w, h, 'PINE PINBALL', __skip ? 'Saved game · tap or press Space to continue' : '← → (or tap left/right) flip · hold Space or tap to launch');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', score.toLocaleString()+' points · tap to play again'); });
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
  const W = 480, H = 600, PXM = 4, SURF = 150, el = A.el;
  const fmt = n => { n = Math.max(0, Number(n)||0); if (!isFinite(n)) return '∞'; if (n < 10 && n % 1) return n.toFixed(1); if (n < 1000) return String(Math.floor(n));
    const u = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc']; if (n >= 1e36) return n.toExponential(2).replace('e+','e');
    let i = -1; while (n >= 1000 && i < u.length-1) { n /= 1000; i++; } return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + u[i]; };
  const fin = v => (v = Number(v), isFinite(v) ? v : 0);
  const wrap = el('div', {position:'relative', width:W+'px', fontFamily:A.font, userSelect:'none'}); host.appendChild(wrap);
  const CV = A.canvas(wrap, W, H), c = CV.c; let g = CV.g; c.style.touchAction = 'none';

  // ---------- the water ----------
  const ZONES = [{d:0,n:'Sunny Shallows'},{d:25,n:'Reed Beds'},{d:60,n:'Deep Water'},{d:120,n:'Twilight Zone'},{d:250,n:'Midnight Zone'},{d:500,n:'The Abyss'},{d:1000,n:'The Trench'},{d:2000,n:'The Unknown'}];
  const zoneOf = d => { let z = 0; for (let i = 0; i < ZONES.length; i++) if (d >= ZONES[i].d) z = i; return z; };
  const layerOf = d => d >= 2000 ? Math.floor((d - 2000) / 1000) : 0;   // every 1,000 m past 2,000 m doubles fish value
  const zoneName = d => ZONES[zoneOf(d)].n + (d >= 2000 ? ' · Layer ' + (layerOf(d) + 1) : '');
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
      'Quantum Kraken|Infinity Eel|Big Bang Bass|Galaxy Whale', 'Dream Fish|The Starfish King|Universe Koi|The First Fish']}];
  const RN = ['Common','Uncommon','Rare','Epic','Legendary','Mythic'], RC = ['#c9ccd1','#7fe08a','#64CDF5','#E9B9F7','#F9BF01','#ff6ad5'];
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
    else if (/(^| )ray$/.test(N) || has(' ray ')) shape = 'ray'; else if (has('shark', 'megamouth')) shape = 'shark';
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
      asp:.42 + rnd(n, 'a')*.2, glow:z >= 3, tusk:has('narwhal', 'sword', 'unicorn'), whisk:has('catfish', 'sturgeon', 'dragon', 'coelacanth'), crown:has('king', 'queen'), spikes:has('lion', 'puffer', 'hailstone', 'dragon', 'wyrm') }; };
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
  const iconCache = {}; const fishIcon = f => { if (iconCache[f.k]) return iconCache[f.k]; const cv = document.createElement('canvas'); cv.width = 112; cv.height = 72; const g0 = g; try { g = cv.getContext('2d'); g.translate(56, 36);
      if (f.junk) { g.fillStyle = f.col; rr(g, -14, -18, 16, 26, 4); g.fill(); rr(g, -14, 2, 32, 12, 4); g.fill(); } else if (f.chest) { g.fillStyle = '#8D5B1D'; rr(g, -22, -14, 44, 28, 4); g.fill(); g.fillStyle = '#F9BF01'; g.fillRect(-22, -3, 44, 5); }
      else { const sz = ['eel', 'dragon'].includes(f.look.shape) ? 16 : ['whale', 'sword', 'shark'].includes(f.look.shape) ? 22 : ['seahorse', 'octo', 'crab', 'star', 'angler', 'puffer'].includes(f.look.shape) ? 24 : 27; drawLook(f, sz, 0, false, false); } } catch(e) {} g = g0; return (iconCache[f.k] = cv.toDataURL()); };
  const FISH = {}; LOCS.forEach(L => { FISH[L.k] = L.fish.map((row, z) => row.split('|').map((it, i) => { const p = it.split(':'), n = p[1] || p[0], k = p[1] ? p[0] : L.k+'-'+z+'-'+i;
    return {k, n, z, i, loc:L.k, r:Math.min(5, i + (z >= 4 ? 1 : 0) + (z >= 7 ? 1 : 0)), look:mkLook(n, z, i), get col(){ return this.look.col; }, s:0}; })); });
  Object.values(FISH).forEach(rows => rows.forEach(row => row.forEach(f => { f.s = (9 + f.i*2.5 + f.z*1.2) * ({whale:1.6, shark:1.35, dragon:1.1, squid:1.15, sword:1.2, ray:1.2, crab:.85, shrimp:.75, seahorse:.9, puffer:.9, star:.85, eel:.95}[f.look.shape] || 1); })));
  const BOOT = {k:'boot', n:'Old Boot', z:0, i:-1, r:0, col:'#5a3a1a', s:11, junk:true}, CHEST = {k:'chest', n:'Treasure Chest', z:2, i:-2, r:4, col:'#c8964a', s:13, chest:true};
  const ALL = [].concat(...LOCS.map(L => [].concat(...FISH[L.k]))).concat([BOOT, CHEST]);

  // ---------- upgrades (bought with coins; levels never reset except by a Pearl Dive) ----------
  const UP = [
    {k:'line', n:'Longer Line', d:L => 'Line reaches '+fmt(lineM(L))+' m → '+fmt(lineM(L+1))+' m', b:15, gr:1.36},
    {k:'hook', n:'Bigger Hook', d:L => 'Hold '+(3+L)+' → '+(4+L)+' fish per dive', b:40, gr:1.5},
    {k:'value', n:'Fish Market', d:L => 'Fish sell for ×'+fmt(Math.pow(1.12, L))+' → ×'+fmt(Math.pow(1.12, L+1)), b:60, gr:1.48},
    {k:'sink', n:'Heavy Sinker', d:L => 'Sink '+fmt(sinkV(L))+' → '+fmt(sinkV(L+1))+' m/s', b:30, gr:1.34},
    {k:'reel', n:'Fast Reel', d:L => 'Reel '+fmt(reelV(L))+' → '+fmt(reelV(L+1))+' m/s', b:30, gr:1.34},
    {k:'steer', n:'Quick Steer', d:L => 'Hook moves '+(100+10*L)+'% → '+(110+10*L)+'% as fast', b:25, gr:1.32, max:20},
    {k:'luck', n:'Lucky Lure', d:L => 'Rare & Epic fish +'+(12*L)+'% → +'+(12*L+12)+'%', b:50, gr:1.42},
    {k:'magnet', n:'Magnet Hook', d:L => 'Grab fish from '+(3*L)+' → '+(3*L+3)+' px farther away', b:80, gr:1.5, max:15},
    {k:'ghost', n:'Ghost Lure', d:L => 'On the way down your hook ignores ' + GHOST[Math.min(3, L)] + (L < 3 ? ' → ' + GHOST[L+1] : ''), b:150, gr:9, max:3},
    {k:'shield', n:'Jelly Guard', d:L => 'Block '+L+' → '+(L+1)+' jellyfish stings per dive', b:120, gr:1.55},
    {k:'gold', n:'Golden Bait', d:L => 'Golden fish (×5): '+goldP(L).toFixed(1)+'% → '+goldP(L+1).toFixed(1)+'%', b:150, gr:1.45, max:40},
    {k:'combo', n:'Combo Charm', d:L => 'Each fish in a row adds +'+(10+4*L)+'% → +'+(14+4*L)+'%', b:90, gr:1.45},
    {k:'drop', n:'Express Drop', d:L => 'Skip up to '+Math.min(80, 8*L)+'% → '+Math.min(80, 8*L+8)+'% of the line (choose how much with the ⏬ slider)', b:300, gr:1.9, max:10},
    {k:'chest', n:'Treasure Map', d:L => 'Chests '+(25*L)+'% → '+(25*L+25)+'% more common & richer', b:300, gr:1.5},
    {k:'buddy', n:'Fishing Buddy', d:L => 'Earns '+fmt(buddyRate(L))+' → '+fmt(buddyRate(L+1))+' coins/s for you', b:250, gr:1.42},
    {k:'sonar', n:'Sonar', d:L => ['Rare fish get a colored ring','Shows each fish’s price','Rares +15% more often','Maxed!'][Math.min(3, L)], b:400, gr:6, max:3}];
  const GHOST = ['nothing', 'Old Boots & Common fish', 'Boots, Common & Uncommon fish', 'everything below Epic'];
  const ghosty = o => { const tier = Math.min(3, UL('ghost')); return tier > 0 && !o.jelly && (o.f.junk || (!o.f.chest && !o.gold && o.f.i < tier)); };
  const lineM = L => Math.round(30 + 12*L + .6*L*L);
  const sinkV = L => 20 * (1 + .15*L), reelV = L => 24 * (1 + .15*L) * (1 + .1*A.U('reel'));
  const goldP = L => 1 + .6*L;
  const cost = (u, L) => Math.ceil(u.b * Math.pow(u.gr, L));

  // ---------- saved progress (with your profile + the cloud) ----------
  let bookC = null; const book = () => { if (bookC) return bookC; let loc = {}; try { loc = JSON.parse(localStorage.getItem('wl-fishbook') || '{}'); } catch(e){} const sv = (api.gdata && api.gdata().book) || {}; bookC = {...loc}; for (const k in sv) bookC[k] = Math.max(bookC[k]||0, sv[k]); return bookC; };
  const G = Object.assign({coins:0, upg:{}, loc:'lake', locs:{lake:1}, best:0, deepest:0, pearls:0, run:0, tot:0, dives:0, caught:0}, (api.gdata && api.gdata().fg) || {});
  const UL = k => G.upg[k] || 0;
  const skipMax = () => Math.min(80, 8*UL('drop')), skipPct = () => G.skip == null ? skipMax() : Math.max(0, Math.min(skipMax(), G.skip));
  const save = () => { try { api.setGdata && api.setGdata({book:book(), fg:G}); } catch(e){} try { localStorage.setItem('wl-fishbook', JSON.stringify(book())); } catch(e){} };
  const LOC = () => LOCS.find(L => L.k == G.loc) || LOCS[0];
  const bookBonus = () => { const b = book(); let m = 1; LOCS.forEach(L => { let all = true; FISH[L.k].forEach(z => { const done = z.every(f => b[f.k]); if (done) m += .03; else all = false; }); if (all) m += .25; }); return m; };
  const coinMult = () => Math.pow(1.12, UL('value')) * (1 + .1*G.pearls) * bookBonus();
  const capN = () => 3 + UL('hook') + A.U('bait');
  const luck = () => 1 + .12*UL('luck') + .15*A.U('lure') + (UL('sonar') >= 3 ? .15 : 0);
  function buddyRate(L) { const z = zoneOf(G.best||0); return L ? L * .35 * 4 * Math.pow(2.3, z) * LOC().mult * coinMult() : 0; }
  const fishVal = (f, d) => f.chest ? 60 * Math.pow(2.3, zoneOf(d)) * LOC().mult * Math.pow(2, layerOf(d)) * (1 + .2*UL('chest')) : f.junk ? 1 : 4 * Math.pow(2.3, f.z) * [1, 2, 4, 9][f.i] * LOC().mult * Math.pow(2, layerOf(d));
  const fishPts = (f, d) => f.junk ? 2 : f.chest ? 150 + 20*zoneOf(d) : Math.round((10 + 14*f.z) * [1, 1.6, 2.6, 4.5][f.i] + 25*layerOf(d));

  // ---------- one dive ----------
  let st = 'ready', phase = 'surface', score = 0, t = 0, hx = W/2, tx = null, hd = 0, camD = 0, maxD = 0, skipD = 0, caught = [], fish = [], genTo = 0, ghostN = 0, shieldN = 0,
    combo = 0, lastCatch = -9, msg = '', msgT = 0, quiz = false, tally = null, zoneShow = '', zoneT = 0, lastZone = -1, ptrDown = false, panel = null, panelTab = 'up', armPearl = false, flash = 0, buddyAcc = 0;
  const K = {}; const kd = e => { K[e.key] = true; }, ku = e => { K[e.key] = false; }; window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const say = (s, d) => { msg = s; msgT = d || 1.6; };
  const pick = d => { const z = zoneOf(d), L = LOC(), u = Math.random();
    if (z <= 2 && u < .07) return BOOT;
    if (z >= 2 && u < .012 * (1 + .25*UL('chest'))) return CHEST;
    const zz = Math.random() < .8 || z == 0 ? z : z - 1, row = FISH[L.k][zz], lk = luck(), w8 = [10, 5, 2.2*lk, .7*lk];
    let s = w8.reduce((a, b) => a + b, 0), x = Math.random()*s; for (let i = 0; i < 4; i++) { x -= w8[i]; if (x <= 0) return row[i]; } return row[0]; };
  const gen = upTo => { const df = A.D(.8, 1, 1.25); while (genTo < upTo) { const b0 = genTo, z = zoneOf(b0); genTo += 12;
      const n = (Math.random() < .9 ? 1 : 0) + (Math.random() < .35 ? 1 : 0) + (z >= 4 && Math.random() < .25 ? 1 : 0);
      for (let i = 0; i < n; i++) { const f = pick(b0), dir = Math.random() < .5 ? 1 : -1;
        fish.push({f, x:20 + Math.random()*(W-40), d:b0 + Math.random()*12, vx:f.chest ? 0 : dir * (25 + Math.random()*45 + z*6) * df, ph:Math.random()*TAU, gold:!f.junk && !f.chest && Math.random()*100 < goldP(UL('gold'))}); }
      if (z >= 1 && Math.random() < Math.min(.5, (.12 + .04*z) * df)) fish.push({jelly:true, x:20 + Math.random()*(W-40), d:b0 + Math.random()*12, vx:(Math.random()-.5)*30, ph:Math.random()*TAU}); } };
  const startDive = () => { if (panel) closePanel(); maxD = lineM(UL('line')); skipD = Math.floor(maxD * skipPct() / 100); fish = []; genTo = Math.max(1, skipD); caught = []; ghostN = UL('ghost'); shieldN = UL('shield');
    combo = 0; hd = skipD; hx = tx != null ? tx : W/2; phase = 'drop'; lastZone = -1; A.tone(300, .15, 'sine', .05); if (skipD) say('Express drop to '+fmt(skipD)+' m', 1.2); refreshBar(); };
  const startReel = why => { if (phase != 'drop') return; phase = 'reel'; combo = 0; lastCatch = -9; if (why) say(why, 1.6); A.sfx('blip'); refreshBar(); };
  const catchIt = o => { const v = fishVal(o.f, o.d) * (o.gold ? 5 : 1), p = fishPts(o.f, o.d) * (o.gold ? 2 : 1);
    if (t - lastCatch < 1.6) combo++; else combo = 0; lastCatch = t; caught.push({f:o.f, v:v * (1 + combo*(.1 + .04*UL('combo'))), p, gold:o.gold}); o.dead = true;
    A.tone(500 + Math.min(10, combo)*60, .05, 'square', .04); if (o.f.r >= 3 || o.gold) A.sfx('coin'); };
  const finishDive = () => { phase = 'tally'; let coins = 0, pts = 0; const b = book(), news = [];
    caught.forEach(x => { coins += x.v; pts += x.p; if (!b[x.f.k]) news.push(x.f.n); b[x.f.k] = (b[x.f.k]||0) + 1; stat(api,'fishCaught',1,'add'); if (x.f.r >= 3) stat(api,'fishRare',1,'add'); });
    coins = fin(coins * coinMult()); G.coins = fin(G.coins + coins); G.run = fin(G.run + coins); G.tot = fin(G.tot + coins); G.dives++; G.caught += caught.length;
    score += pts; api.score(score); tally = {coins, pts, n:caught.length, news, list:caught.slice(0, 40)}; save(); refreshBar();
    A.sfx(caught.length ? 'win' : 'blip'); if (news.length) setTimeout(() => A.sfx('coin'), 300); };
  const toSurface = () => { phase = 'surface'; tally = null; refreshBar(); };
  const press = () => { if (quiz) return; if (st != 'play') { reset(); st = 'play'; refreshBar(); return; }
    if (phase == 'surface') startDive(); else if (phase == 'tally') toSurface(); };
  const reset = () => { if (__skip) { __skip = false; return; } score = 0; api.score(0); phase = 'surface'; tally = null; caught = []; };
  const offK = A.keys(e => { if (panel && e.key == 'Escape') { closePanel(); return; } if (e.key == ' ' || e.key == 'Enter') { if (!panel) press(); }
    if ((e.key == 'q' || e.key == 'Q') && st == 'play' && phase == 'drop' && !quiz) startReel('Coming up!');
    if ((e.key == 'u' || e.key == 'U') && phase == 'surface' && st == 'play') openPanel('up'); if ((e.key == 'b' || e.key == 'B') && st == 'play') openPanel('book'); });
  const toX = e => { const r = c.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; };
  c.addEventListener('pointerdown', e => { ptrDown = true; tx = toX(e); try { c.setPointerCapture(e.pointerId); } catch(_){} if (st != 'play' || phase == 'surface' || phase == 'tally') press(); });
  c.addEventListener('pointermove', e => { if (e.pointerType == 'mouse' || ptrDown) tx = toX(e); });
  ['pointerup','pointercancel'].forEach(k => c.addEventListener(k, () => { ptrDown = false; }));

  // ---------- buttons + panels (shop, spots, book, pearls) ----------
  const bar = el('div', {display:'flex', gap:'6px', padding:'6px 0 0', flexWrap:'wrap', justifyContent:'center'}); wrap.appendChild(bar);
  const mk = (txt, fn, bg, fg) => { const b = el('button', {background:bg||'#015640', color:fg||'#fff', border:'none', borderRadius:'999px', padding:'8px 12px', font:'700 13px '+A.font, cursor:'pointer'}, txt); b.tabIndex = -1; b.onclick = e => { e.stopPropagation(); b.blur(); fn(); }; return b; };
  const bUp = mk('🛒 Upgrades', () => openPanel('up')), bSpot = mk('🗺 Spots', () => openPanel('spot')), bBook = mk('📖 Fish Book', () => openPanel('book')), bPearl = mk('🦪 Pearls', () => openPanel('pearl')), bReel = mk('⏫ Come up now · Q', () => startReel('Coming up!'), '#FF4539');
  [bUp, bSpot, bBook, bPearl, bReel].forEach(b => bar.appendChild(b));
  // Express Drop: choose how much of the line to skip (0% up to what your upgrade allows)
  const skipBox = el('label', {display:'none', alignItems:'center', gap:'6px', background:'rgba(1,86,64,.12)', borderRadius:'999px', padding:'4px 12px', font:'700 13px '+A.font, color:'#015640'});
  const skipIn = el('input', {width:'120px', accentColor:'#00B451'}); skipIn.type = 'range'; skipIn.min = 0; skipIn.step = 1; skipIn.tabIndex = -1;
  const skipTx = el('span', {minWidth:'92px'}); skipBox.appendChild(el('span', {}, '⏬ Skip')); skipBox.appendChild(skipIn); skipBox.appendChild(skipTx); bar.appendChild(skipBox);
  skipIn.addEventListener('pointerdown', e => e.stopPropagation()); skipIn.addEventListener('keydown', e => e.stopPropagation());
  skipIn.addEventListener('input', () => { G.skip = +skipIn.value; skipTx.textContent = skipIn.value + '% · ' + fmt(Math.floor(lineM(UL('line')) * skipPct() / 100)) + ' m'; });
  skipIn.addEventListener('change', () => { save(); skipIn.blur(); });
  function refreshBar(){ const dive = st == 'play' && (phase == 'drop' || phase == 'reel'); [bUp, bSpot, bPearl].forEach(b => b.style.display = dive ? 'none' : ''); bReel.style.display = st == 'play' && phase == 'drop' ? '' : 'none';
    const sm = skipMax(); skipBox.style.display = sm > 0 && !dive ? 'flex' : 'none'; if (sm > 0) { skipIn.max = sm; skipIn.value = skipPct(); skipTx.textContent = skipPct() + '% · ' + fmt(Math.floor(lineM(UL('line')) * skipPct() / 100)) + ' m'; } }
  function closePanel(){ if (panel) { panel.remove(); panel = null; } armPearl = false; try { refreshBar(); } catch(e){} }
  function openPanel(tab){ if (st == 'play' && (phase == 'drop' || phase == 'reel')) return; panelTab = tab; closePanel();
    panel = el('div', {position:'absolute', left:0, top:0, width:W+'px', height:H+'px', background:'rgba(6,30,44,.97)', borderRadius:'12px', zIndex:5, color:'#fff', display:'flex', flexDirection:'column', boxSizing:'border-box', padding:'12px'});
    panel.addEventListener('pointerdown', e => e.stopPropagation()); wrap.appendChild(panel); drawPanel(); }
  function drawPanel(){ if (!panel) return; const keep = panel.querySelector('.fl-body'), sc = keep ? keep.scrollTop : 0; panel.innerHTML = '';
    const top = el('div', {display:'flex', gap:'6px', alignItems:'center', marginBottom:'8px', flexWrap:'wrap'}); panel.appendChild(top);
    [['up','🛒 Upgrades'],['spot','🗺 Spots'],['book','📖 Book'],['pearl','🦪 Pearls']].forEach(([k, n]) => { const b = mk(n, () => { panelTab = k; armPearl = false; drawPanel(); }, panelTab == k ? '#D5F367' : 'rgba(255,255,255,.12)', panelTab == k ? '#015640' : '#fff'); b.style.padding = '6px 10px'; top.appendChild(b); });
    const x = mk('✕', closePanel, 'rgba(255,255,255,.15)'); x.style.marginLeft = 'auto'; top.appendChild(x);
    panel.appendChild(el('div', {font:'800 18px '+A.font, color:'#F9BF01', margin:'2px 0 8px'}, '🪙 ' + fmt(G.coins) + ' coins'));
    const body = el('div', {overflowY:'auto', flex:'1', display:'flex', flexDirection:'column', gap:'6px'}); body.className = 'fl-body'; panel.appendChild(body);
    const row = () => { const r = el('div', {display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,.07)', borderRadius:'10px', padding:'8px 10px'}); body.appendChild(r); return r; };
    if (panelTab == 'up') UP.forEach(u => { const L = UL(u.k), maxed = u.max != null && L >= u.max, cst = cost(u, L), r = row();
      const info = el('div', {flex:'1', minWidth:0}); info.appendChild(el('div', {font:'700 14px '+A.font}, u.n + ' · Lv ' + L)); info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, u.d(L))); r.appendChild(info);
      if (maxed) { r.appendChild(el('div', {font:'700 12px '+A.font, color:'#D5F367'}, 'MAX')); return; }
      const can = G.coins >= cst, b1 = mk('🪙 ' + fmt(cst), () => buy(u, 1), can ? '#00B451' : 'rgba(255,255,255,.12)'); b1.style.opacity = can ? 1 : .55; r.appendChild(b1);
      const bm = mk('Max', () => buy(u, 999), can ? '#007a37' : 'rgba(255,255,255,.08)'); bm.style.opacity = can ? 1 : .45; bm.style.padding = '8px 9px'; r.appendChild(bm); });
    if (panelTab == 'spot') LOCS.forEach(L => { const r = row(), have = G.locs[L.k], here = G.loc == L.k; const info = el('div', {flex:'1'});
      info.appendChild(el('div', {font:'700 14px '+A.font}, L.n + (here ? ' · you are here' : ''))); info.appendChild(el('div', {font:'500 12px '+A.font, color:'#b9d9e6'}, 'Fish worth ×' + fmt(L.mult) + ' · 32 new fish for your book')); r.appendChild(info);
      if (here) return; if (have) { r.appendChild(mk('Go fish here', () => { G.loc = L.k; save(); closePanel(); say('Welcome to ' + L.n + '!', 2); })); return; }
      const can = G.coins >= L.cost, b = mk('🪙 ' + fmt(L.cost), () => { if (G.coins < L.cost) return; G.coins -= L.cost; G.locs[L.k] = 1; G.loc = L.k; save(); A.sfx('win'); closePanel(); say('New spot: ' + L.n + '!', 2.5); }, can ? '#00B451' : 'rgba(255,255,255,.12)'); b.style.opacity = can ? 1 : .55; r.appendChild(b); });
    if (panelTab == 'book') { const b = book(), found = ALL.filter(f => b[f.k]).length;
      body.appendChild(el('div', {font:'600 13px '+A.font, color:'#D5F367'}, found + ' of ' + ALL.length + ' found · Book bonus ×' + bookBonus().toFixed(2) + ' coins (+3% per full zone, +25% per full spot)'));
      LOCS.forEach(L => { body.appendChild(el('div', {font:'800 15px '+A.font, marginTop:'6px'}, L.n + (G.locs[L.k] ? '' : ' 🔒')));
        FISH[L.k].forEach((zr, z) => { const r = row(); r.style.flexWrap = 'wrap'; r.style.gap = '4px'; r.appendChild(el('div', {width:'100%', font:'600 11px '+A.font, color:'#8fb9c9'}, ZONES[z].n + ' · ' + ZONES[z].d + ' m+'));
          zr.forEach(f => { const n = b[f.k] || 0, cell = el('div', {flex:'1 1 45%', display:'flex', alignItems:'center', gap:'6px', font:'600 12px '+A.font, color:n ? RC[f.r] : '#5d7d8a'}); if (n) { const im = el('img', {width:'46px', height:'30px', flexShrink:0}); im.src = fishIcon(f); cell.appendChild(im); } else cell.appendChild(el('div', {width:'46px', height:'30px', flexShrink:0, borderRadius:'8px', background:'rgba(255,255,255,.06)', textAlign:'center', lineHeight:'30px'}, '?')); cell.appendChild(el('span', {}, n ? f.n + ' ×' + n : '??? (' + RN[f.r] + ')')); r.appendChild(cell); }); }); });
      const r = row(); [BOOT, CHEST].forEach(f => { const cell = el('div', {flex:'1', display:'flex', alignItems:'center', gap:'6px', font:'600 12px '+A.font, color:b[f.k] ? RC[f.r] : '#5d7d8a'}); if (b[f.k]) { const im = el('img', {width:'46px', height:'30px'}); im.src = fishIcon(f); cell.appendChild(im); } cell.appendChild(el('span', {}, b[f.k] ? f.n + ' ×' + b[f.k] : '??? (' + RN[f.r] + ')')); r.appendChild(cell); }); }
    if (panelTab == 'pearl') { const n = pearlsFor(), ok = n >= 1 && (G.best||0) >= 250;
      body.appendChild(el('div', {font:'600 14px '+A.font, lineHeight:1.4}, '🦪 You have ' + G.pearls + ' pearl' + (G.pearls == 1 ? '' : 's') + '. Each pearl makes every fish worth +10% forever (now ×' + (1 + .1*G.pearls).toFixed(1) + ').'));
      body.appendChild(el('div', {font:'500 13px '+A.font, color:'#b9d9e6', lineHeight:1.4}, 'A Pearl Dive starts your fishing over: coins, upgrades and spots go back to the start. You keep your pearls, your Fish Book, your tickets and Workshop upgrades. Pearls come from coins earned since your last Pearl Dive, and you must have reached 250 m.'));
      body.appendChild(el('div', {font:'700 14px '+A.font, color:'#D5F367'}, 'Coins this run: ' + fmt(G.run) + ' · deepest this run: ' + fmt(G.best||0) + ' m → ' + n + ' pearl' + (n == 1 ? '' : 's')));
      if (ok) body.appendChild(mk(armPearl ? 'YES · Pearl Dive for ' + n + ' 🦪' : 'Pearl Dive for ' + n + ' 🦪', () => { if (!armPearl) { armPearl = true; drawPanel(); return; } pearlDive(); }, armPearl ? '#FF4539' : '#E9B9F7', '#121313'));
      else body.appendChild(el('div', {font:'600 13px '+A.font, color:'#ffb3ab'}, (G.best||0) < 250 ? 'Reach 250 m first.' : 'Earn more coins first (100K coins = 1 pearl).'));
      body.appendChild(el('div', {font:'500 12px '+A.font, color:'#8fb9c9', marginTop:'8px'}, 'All-time: ' + fmt(G.tot) + ' coins · ' + fmt(G.caught) + ' fish · ' + fmt(G.dives) + ' dives · deepest ever ' + fmt(G.deepest||0) + ' m')); }
    const nb = panel.querySelector('.fl-body'); if (nb) nb.scrollTop = sc; }
  const buy = (u, n) => { let k = 0; while (k < n && (u.max == null || UL(u.k) < u.max) && G.coins >= cost(u, UL(u.k))) { G.coins -= cost(u, UL(u.k)); G.upg[u.k] = UL(u.k) + 1; k++; }
    if (k) { A.sfx('coin'); save(); refreshBar(); } else A.sfx('bad'); drawPanel(); };
  const pearlsFor = () => Math.floor(Math.sqrt(G.run / 1e5));
  const pearlDive = () => { const n = pearlsFor(); if (n < 1) return; G.pearls += n; G.coins = 0; G.upg = {}; G.locs = {lake:1}; G.loc = 'lake'; G.run = 0; G.best = 0; save(); A.sfx('win'); closePanel(); say('+' + n + ' pearl' + (n == 1 ? '' : 's') + '! Fish are worth ×' + (1 + .1*G.pearls).toFixed(1) + ' now', 3); stat(api,'fishPearls',G.pearls,'max'); };

  // ---------- drawing ----------
  const mixHex = (a, b, k) => { const p = s => [1,3,5].map(i => parseInt(s.slice(i, i+2), 16)); const A1 = p(a), B1 = p(b); return 'rgb(' + A1.map((v, i) => Math.round(v + (B1[i]-v)*k)).join(',') + ')'; };
  const dark = d => Math.min(.94, Math.log(1 + d/25) / Math.log(1 + 2500/25));
  const sy = d => SURF + (d - camD) * PXM;
  const drawFish = (o, x, y) => { const f = o.f, s = f.s, dir = o.vx < 0 ? -1 : 1; g.save(); g.translate(x, y); g.scale(dir, 1);
    if (f.junk) { g.fillStyle = f.col; rr(g, -9, -10, 10, 16, 3); g.fill(); rr(g, -9, 2, 20, 8, 3); g.fill(); g.restore(); return; }
    if (f.chest) { g.fillStyle = '#8D5B1D'; rr(g, -14, -9, 28, 18, 3); g.fill(); g.fillStyle = '#F9BF01'; g.fillRect(-14, -2, 28, 3); g.fillRect(-2, -4, 4, 7); if (!low()) { g.fillStyle = 'rgba(255,233,120,' + (.4 + .3*Math.sin(t*4 + o.ph)) + ')'; g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill(); } g.restore(); return; }
    if ((f.r >= 3 || o.gold) && !low()) { g.shadowColor = o.gold ? '#FFD700' : f.look.acc; g.shadowBlur = f.r >= 4 ? 16 : 10; }
    drawLook(f, s, o.ph, o.gold, low()); g.shadowBlur = 0;
    if (f.r >= 4 && !low()) { g.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { const a = t*2 + k*2.1 + o.ph; g.globalAlpha = .5 + .5*Math.sin(t*6 + k); g.fillRect(Math.cos(a)*s*1.2, Math.sin(a)*s*.8, 2, 2); } g.globalAlpha = 1; }
    g.restore();
    if (UL('sonar') >= 1 && f.i >= 2) { g.strokeStyle = RC[f.r]; g.lineWidth = 2; g.globalAlpha = .7; g.beginPath(); g.arc(x, y, s + 7, 0, TAU); g.stroke(); g.globalAlpha = 1; } };
  const drawJelly = (o, x, y) => { const p = Math.sin(t*3 + o.ph); g.fillStyle = 'rgba(255,120,200,.55)'; g.beginPath(); g.ellipse(x, y, 13 + p*2, 10 - p*1.5, 0, Math.PI, TAU); g.fill();
    g.strokeStyle = 'rgba(255,150,210,.6)'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i*5, y); g.quadraticCurveTo(x + i*5 + Math.sin(t*4 + i)*4, y + 10, x + i*5, y + 20 + p*3); g.stroke(); } };
  const draw = () => { const L = LOC(), dTop = camD - SURF/PXM, dBot = camD + (H - SURF)/PXM;
    if (dTop < 0) { const yS = sy(0); const gr = g.createLinearGradient(0, yS - 200, 0, yS); gr.addColorStop(0, L.sky[0]); gr.addColorStop(1, L.sky[1]); g.fillStyle = gr; g.fillRect(0, 0, W, Math.max(0, yS));
      if (L.stars) { g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) g.fillRect((i*97) % W, ((i*53) % 140) + yS - 160, 2, 2); }
      else { g.fillStyle = L.k == 'vent' ? '#ffcf70' : '#ffe9b0'; g.beginPath(); g.arc(390, yS - 90, 30, 0, TAU); g.fill(); }
      g.fillStyle = L.land; g.beginPath(); g.moveTo(0, yS - 8); for (let x = 0; x <= 160; x += 20) g.lineTo(x, yS - 22 - Math.sin(x*.05)*10); g.lineTo(180, yS); g.lineTo(0, yS); g.fill();
      g.beginPath(); g.moveTo(W, yS - 6); for (let x = W; x >= W - 120; x -= 20) g.lineTo(x, yS - 18 - Math.sin(x*.07)*8); g.lineTo(W - 140, yS); g.lineTo(W, yS); g.fill();
      if (L.snow) { g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 40; i++) { const xx = (i*61 + t*20*(1 + i%3)) % W, yy = ((i*37 + t*30*(1 + i%2)) % 200) + yS - 200; g.fillRect(xx, yy, 2, 2); } }
      if (L.ember) { g.fillStyle = 'rgba(255,140,60,.8)'; for (let i = 0; i < 20; i++) { const xx = (i*61 + Math.sin(t + i)*20 + W) % W, yy = yS - ((i*37 + t*40) % 200); g.fillRect(xx, yy, 2, 3); } }
      const bx = W/2; g.fillStyle = '#8D5B1D'; g.beginPath(); g.moveTo(bx - 50, yS - 14); g.lineTo(bx + 50, yS - 14); g.lineTo(bx + 38, yS + 4); g.lineTo(bx - 38, yS + 4); g.fill();
      g.fillStyle = '#c8742c'; rr(g, bx - 30, yS - 44, 18, 30, 7); g.fill(); g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(bx - 21, yS - 52, 9, 0, TAU); g.fill();
      g.strokeStyle = '#6b4a2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 14, yS - 30); g.lineTo(bx + 30, yS - 64); g.stroke(); }
    const y0 = Math.max(0, sy(0)), gr = g.createLinearGradient(0, y0, 0, H); gr.addColorStop(0, mixHex(L.sea, '#02040a', dark(Math.max(0, dTop)))); gr.addColorStop(1, mixHex(L.sea, '#02040a', dark(dBot))); g.fillStyle = gr; g.fillRect(0, y0, W, H - y0);
    if (dTop < 60 && !low()) { g.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 5; i++) { const x = 60 + i*95 + Math.sin(t*.5 + i)*20; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + 40, y0); g.lineTo(x - 30, Math.min(H, sy(60))); g.lineTo(x - 70, Math.min(H, sy(60))); g.fill(); } }
    if (!low()) { g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 14; i++) { const by = ((i*71 - t*40*(1 + i%3)) % H + H) % H; if (by > y0) g.fillRect((i*83 + Math.sin(t + i)*6) % W, by, 2, 2); } }
    for (const o of fish) { if (o.dead) continue; const y = sy(o.d); if (y < -30 || y > H + 30) continue; const fade = phase == 'drop' && ghosty(o); if (fade) g.globalAlpha = .35; if (o.jelly) drawJelly(o, o.x, y); else drawFish(o, o.x, y); g.globalAlpha = 1;
      if (UL('sonar') >= 2 && !o.jelly && Math.abs(y - sy(hd)) < 120) { g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '700 10px '+A.font; g.textAlign = 'center'; g.fillText('🪙' + fmt(fishVal(o.f, o.d) * (o.gold ? 5 : 1) * coinMult()), o.x, y - o.f.s - 6); } }
    if (dBot > maxD && phase != 'surface') { const yb = sy(maxD + 3); g.strokeStyle = 'rgba(255,69,57,.6)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(0, yb); g.lineTo(W, yb); g.stroke(); g.setLineDash([]); }
    const hy = sy(hd); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W/2 + 30, Math.max(0, sy(0) - 64)); g.lineTo(hx, hy - 10); g.stroke();
    caught.slice(-8).forEach((x, i) => { g.save(); g.translate(hx + Math.sin(t*3 + i)*6, hy + 16 + i*9); g.rotate(Math.PI/2 + Math.sin(t*4 + i)*.3); if (x.f.junk || x.f.chest) { g.fillStyle = x.f.col; g.fillRect(-6, -5, 12, 10); } else drawLook(x.f, 8, i, x.gold, true); g.restore(); });
    g.strokeStyle = '#d8dde3'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy - 10); g.lineTo(hx, hy + 4); g.arc(hx - 6, hy + 4, 6, 0, Math.PI); g.stroke();
    if (UL('magnet') && phase == 'reel') { g.strokeStyle = 'rgba(213,243,103,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(hx, hy, 14 + 3*UL('magnet'), 0, TAU); g.stroke(); }
    if (flash > 0) { g.fillStyle = 'rgba(233,185,247,' + flash + ')'; g.fillRect(0, 0, W, H); }
    // HUD
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 6, 6, W - 12, 30, 10); g.fill(); g.font = '700 14px '+A.font; g.textBaseline = 'middle'; g.fillStyle = '#F9BF01'; g.textAlign = 'left'; g.fillText('🪙 ' + fmt(G.coins), 14, 21);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText((phase == 'surface' || phase == 'tally' ? 'Line ' + fmt(lineM(UL('line'))) : fmt(hd) + ' / ' + fmt(maxD)) + ' m', W/2 - 30, 21);
    g.textAlign = 'right'; g.fillText('🐟 ' + caught.length + '/' + capN() + ' · ' + fmt(score) + ' pts', W - 14, 21); g.textBaseline = 'alphabetic';
    if (phase == 'drop' || phase == 'reel') { g.font = '600 11px '+A.font; g.textAlign = 'left'; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText((UL('ghost') && phase == 'drop' ? '👻 skipping ' + ['', 'Common', 'Common & Uncommon', 'below Epic'][Math.min(3, UL('ghost'))] + '  ' : '') + (shieldN ? '🛡 ' + shieldN + '  ' : '') + (combo ? 'COMBO ×' + (combo + 1) : ''), 12, 52);
      const bw = 8, bh = H - 120; g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, W - 16, 60, bw, bh, 4); g.fill(); g.fillStyle = '#D5F367'; g.beginPath(); g.arc(W - 12, 60 + bh * Math.min(1, hd / Math.max(1, maxD)), 6, 0, TAU); g.fill(); }
    if (zoneT > 0) { g.globalAlpha = Math.min(1, zoneT); g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, W/2 - 140, 70, 280, 38, 12); g.fill(); g.fillStyle = '#D5F367'; g.font = '800 17px '+A.font; g.textAlign = 'center'; g.fillText(zoneShow, W/2, 95); g.globalAlpha = 1; }
    if (msgT > 0) { g.fillStyle = 'rgba(0,0,0,.6)'; rr(g, W/2 - 170, H - 90, 340, 36, 12); g.fill(); g.fillStyle = '#fff'; g.font = '700 15px '+A.font; g.textAlign = 'center'; g.fillText(msg, W/2, H - 66); }
    if (st == 'play' && phase == 'surface') { g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, W/2 - 175, SURF + 60, 350, 62, 14); g.fill(); g.fillStyle = '#fff'; g.font = '800 18px '+A.font; g.textAlign = 'center'; g.fillText('Tap to drop your hook ⬇', W/2, SURF + 86);
      g.font = '500 12px '+A.font; g.fillStyle = '#cfe3d9'; g.fillText('Fish you touch get hooked · Q to come up early · ' + LOC().n, W/2, SURF + 108); }
    if (phase == 'tally' && tally) { g.fillStyle = 'rgba(1,40,30,.9)'; rr(g, 40, 120, W - 80, 330, 16); g.fill(); g.textAlign = 'center'; g.fillStyle = '#D5F367'; g.font = '800 22px '+A.font; g.fillText(tally.n ? 'Catch of the dive!' : 'Nothing this time', W/2, 156);
      g.fillStyle = '#F9BF01'; g.font = '800 26px '+A.font; g.fillText('+🪙 ' + fmt(tally.coins), W/2, 194); g.fillStyle = '#fff'; g.font = '700 14px '+A.font; g.fillText('+' + fmt(tally.pts) + ' points · ' + tally.n + ' fish', W/2, 218);
      const cnt = {}; tally.list.forEach(x => { const k = x.f.n + (x.gold ? ' ✨' : ''); cnt[k] = (cnt[k]||0) + 1; }); g.font = '600 13px '+A.font; Object.entries(cnt).slice(0, 7).forEach(([n, k], i) => { g.fillStyle = '#e8f4ff'; g.fillText(n + (k > 1 ? ' ×' + k : ''), W/2, 246 + i*20); });
      if (tally.news.length) { g.fillStyle = '#E9B9F7'; g.font = '700 13px '+A.font; g.fillText('📖 New in your Fish Book: ' + tally.news.slice(0, 2).join(', ') + (tally.news.length > 2 ? ' +' + (tally.news.length - 2) : ''), W/2, 400); }
      g.fillStyle = '#cfe3d9'; g.font = '600 12px '+A.font; g.fillText('Tap to keep fishing', W/2, 432); }
    if (st == 'ready') A.overlayText(g, W, H, 'FISHING HOLE', __skip ? 'Saved trip · tap or press Space to continue' : 'Endless dive fishing · tap to start');
    if (st == 'over') A.overlayText(g, W, H, 'TICKETS CASHED IN!', fmt(score) + ' points · your coins & upgrades are saved · tap to fish on'); };

  // ---------- the loop ----------
  const offL = A.loop(dt => { t += dt; msgT = Math.max(0, msgT - dt); zoneT = Math.max(0, zoneT - dt); flash = Math.max(0, flash - dt*2); dt = Math.min(dt, .05);
    if (st == 'play' && !quiz) {
      if (UL('buddy') && !document.hidden) { const add = buddyRate(UL('buddy')) * dt; G.coins = fin(G.coins + add); G.run = fin(G.run + add); G.tot = fin(G.tot + add); buddyAcc += dt; if (buddyAcc > 20) { buddyAcc = 0; save(); } if (panel && panelTab != 'book' && Math.floor(t*2) != Math.floor((t - dt)*2)) { const p = panel.querySelector('div:nth-child(2)'); if (p) p.textContent = '🪙 ' + fmt(G.coins) + ' coins'; } }
      const kx = (K.ArrowRight || K.d ? 1 : 0) - (K.ArrowLeft || K.a ? 1 : 0), sp = 420 * (1 + .1*UL('steer'));
      if (kx) { tx = null; hx += kx * sp * dt; } else if (tx != null) { const dx = tx - hx; hx += Math.sign(dx) * Math.min(Math.abs(dx), sp*dt); } hx = clamp(hx, 14, W - 14);
      for (const o of fish) { if (o.dead) continue; const y = sy(o.d); if (y < -200 || y > H + 200) continue; o.x += o.vx * dt; if (o.x < -30) o.x = W + 30; if (o.x > W + 30) o.x = -30; }
      const prevD = hd;
      if (phase == 'drop') { hd += sinkV(UL('sink')) * dt; gen(hd + 160);
        const z = zoneOf(hd); if (z != lastZone) { if (lastZone >= 0 || z > 0) { zoneShow = zoneName(hd) + ' · ' + fmt(ZONES[z].d) + ' m'; zoneT = 2; } lastZone = z; }
        if (hd >= 2000 && layerOf(hd) != layerOf(prevD)) { zoneShow = zoneName(hd); zoneT = 2; A.sfx('blip'); }
        for (const o of fish) { if (o.dead || o.jelly || o.passed) continue; if (o.d < prevD - 3 || o.d > hd + 3) continue; if (Math.abs(o.x - hx) < o.f.s + 7) {
            if (ghosty(o)) { o.passed = true; continue; }
            o.passed = true; if (caught.length < capN()) { catchIt(o); say('Hooked a ' + o.f.n + ' on the way down' + (caught.length >= capN() ? ' · hook full!' : ''), 1.2); } } }
        if (phase == 'drop' && hd >= maxD) { hd = maxD; startReel('End of the line! Reel up and grab fish'); } }
      else if (phase == 'reel') { const full = caught.length >= capN(), turbo = full || hd < skipD ? 4 : 1; hd -= reelV(UL('reel')) * turbo * dt;
        if (!full) for (const o of fish) { if (o.dead) continue; if (o.d > prevD + 4 || o.d < hd - 4) continue; const rad = (o.jelly ? 12 : o.f.s) + 8 + 3*UL('magnet');
          if (Math.abs(o.x - hx) < rad && Math.abs(o.d*PXM - hd*PXM) < rad + Math.abs(prevD - hd)*PXM) {
            if (o.jelly) { o.dead = true; if (shieldN > 0) { shieldN--; A.tone(900, .06, 'sine', .04); say('Jelly Guard blocked a sting!', 1.2); continue; } if (!caught.length) { A.sfx('bad'); continue; }
              const lost = caught[caught.length - 1]; A.sfx('bad'); quiz = learn2(host, api, 'A JELLYFISH STUNG YOUR LINE! ANSWER TO KEEP YOUR ' + lost.f.n.toUpperCase(), () => { quiz = false; say('You held on to the ' + lost.f.n + '!', 1.6); }, () => { quiz = false; caught.pop(); say('Ouch! A jellyfish knocked off your ' + lost.f.n, 1.8); }); if (quiz) break; continue; }
            catchIt(o); if (caught.length >= capN()) { say('Hook full! Zooming up', 1.2); break; } } }
        if (hd <= 0) { hd = 0; finishDive(); } }
      if (phase == 'drop' || phase == 'reel') { if (hd > G.best) G.best = hd; if (hd > (G.deepest||0)) { G.deepest = hd; stat(api,'fishDepth',Math.floor(hd),'max'); } }
      if (combo && t - lastCatch > 1.6) combo = 0; }
    const want = phase == 'drop' ? hd - (230 - SURF)/PXM : phase == 'reel' ? hd - (440 - SURF)/PXM : 0;
    camD += (Math.max(0, want) - camD) * Math.min(1, dt * (phase == 'surface' || phase == 'tally' ? 3 : 8)); if (phase == 'drop' && hd - camD > (H - SURF - 60)/PXM) camD = hd - (H - SURF - 60)/PXM;
    draw(); });
  refreshBar();
  A._dbg = A._dbg || {}; A._dbg.fish = { G, s: () => ({st, phase, hd, maxD, caught:caught.length, score, fish:fish.length, camD}), press, setX: x => { tx = x; }, fishes: () => fish.filter(o => !o.dead).map(o => ({x:o.x, d:o.d, j:!!o.jelly})), hx: () => hx, gallery: () => ALL.map(f => ({n:f.n, sh:f.look ? f.look.shape : '', src:fishIcon(f)})) };
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
    g.fillStyle = '#fff'; g.font = '700 18px '+A.font; g.textAlign = 'left'; g.fillText(Math.round(score||0).toLocaleString(), 12, 26); g.textAlign = 'right'; g.fillText('Combo '+(combo||0), w-12, 26);
    if (judgeT > 0) { g.fillStyle = judge == 'MISS' ? '#ff6a6a' : judge == 'PERFECT' ? '#F9BF01' : '#D5F367'; g.font = '800 30px '+A.font; g.textAlign = 'center'; g.fillText(judge, w/2, HIT - 160); }
    if (st == 'ready') A.overlayText(g, w, h, 'BEAT HOPPER', __skip ? 'Saved game · tap or press Space to continue' : 'D F J K (or arrows, or tap the lanes) when notes hit the line');
    if (st == 'over') A.overlayText(g, w, h, 'SONG OVER', Math.round(score).toLocaleString()+' points · best combo '+best+' · tap to dance again'); });
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
  let st = 'ready', lvl = 0, map, p, coins, score, lives, cam, movers, boss, t = 0, quiz = false, total = 0;
  const load = () => { const L = LEVELS[lvl % LEVELS.length]; map = L.map(r => r.split('')); movers = []; boss = null; coins = 0;
    map.forEach((row, y) => row.forEach((ch, x) => { if (ch == 'P') { p = {x:x*T, y:y*T, vx:0, vy:0, on:false, face:1, inv:1}; row[x] = ' '; } if (ch == 'M') { movers.push({x:x*T, y:y*T, w:T*3, ox:x*T, dir:1}); row[x] = ' '; } }));
    if (lvl % 5 == 4) boss = {x:28*T, y:7*T - 40, w:56, h:56, vx:-90, hp:3 + Math.floor(lvl/5), max:3 + Math.floor(lvl/5), inv:0, vy:0}; cam = 0; };
  const reset = () => { if (__skip) { __skip = false; return; } lvl = 0; score = 0; lives = A.lives(A.D(5,3,2) + A.U('life')); total = 0; load(); api.score(0); };
  const solid = (x, y) => { const cx = Math.floor(x / T), cy = Math.floor(y / T); if (cy < 0) return false; if (cy >= map.length) return false; return (map[cy][cx] || ' ') == '='; };
  const die = () => { if (A.immortal) { p.inv = 1; return; } const lose = () => { lives--; A.sfx('bad'); if (lives <= 0) { st = 'over'; A.sfx('over'); stat(api,'platLevel',lvl+1,'max'); api.over(score); } else load(); };
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
      p.y += p.vy*dt; p.on = false; if (p.vy > 0 && (solid(p.x+2, p.y+ph) || solid(p.x+pw-2, p.y+ph))) { p.y = Math.floor((p.y+ph)/T)*T - ph; p.vy = 0; p.on = true; } if (p.vy < 0 && (solid(p.x+2, p.y) || solid(p.x+pw-2, p.y))) { p.y = (Math.floor(p.y/T)+1)*T; p.vy = 0; }
      for (const m of movers) if (p.vy >= 0 && p.x+pw > m.x && p.x < m.x+m.w && p.y+ph >= m.y && p.y+ph <= m.y+14) { p.y = m.y - ph; p.vy = 0; p.on = true; p.x += m.dir*70*dt; }
      p.x = clamp(p.x, 0, map[0].length*T - pw);
      const cx = Math.floor((p.x+pw/2)/T), cy = Math.floor((p.y+ph/2)/T), ch = (map[cy]||[])[cx];
      if (ch == 'o') { map[cy][cx] = ' '; coins++; score += 10; api.score(score); A.sfx('coin'); }
      if (ch == '^' && p.inv <= 0) die(); if (ch == 'F' && !boss) win();
      if (p.y > map.length*T + 40) die();
      if (boss) { const B = boss; B.inv = Math.max(0, B.inv - dt); B.x += B.vx*dt; if (B.x < 3*T || B.x > 36*T) B.vx *= -1; B.vy += 1500*dt; B.y += B.vy*dt; if (B.y > 8*T - B.h) { B.y = 8*T - B.h; B.vy = Math.random() < .02 ? -600 : 0; }
        if (p.x+pw > B.x && p.x < B.x+B.w && p.y+ph > B.y && p.y < B.y+B.h) { if (p.vy > 0 && p.y+ph - B.y < 20 && B.inv <= 0) { B.hp--; B.inv = .8; p.vy = -520; A.sfx('hit'); score += 200; api.score(score); if (B.hp <= 0) { boss = null; score += 1500; A.sfx('win'); stat(api,'platBoss',1,'add'); } } else if (p.inv <= 0) die(); } }
      if (!boss && lvl % 5 == 4) win();
      cam = clamp(p.x - w/2, 0, map[0].length*T - w); }
    sky(g, w, h, '#a0e0ff', '#e0fff0'); g.save(); g.translate(-Math.round(cam||0), 0);
    if (map) map.forEach((row, y) => row.forEach((ch, x) => { const X = x*T, Y = y*T; if (X - cam < -T || X - cam > w) return;
      if (ch == '=') { g.fillStyle = (map[y-1]||[])[x] == '=' ? '#8D5B1D' : '#5aa84a'; g.fillRect(X, Y, T, T); if ((map[y-1]||[])[x] != '=') { g.fillStyle = '#8D5B1D'; g.fillRect(X, Y+8, T, T-8); g.fillStyle = '#7cc46a'; g.fillRect(X, Y, T, 8); } }
      else if (ch == 'o') { g.fillStyle = C.gold; g.beginPath(); g.ellipse(X+T/2, Y+T/2, 7*Math.abs(Math.cos(t*3)) + 1, 8, 0, 0, TAU); g.fill(); }
      else if (ch == '^') { g.fillStyle = '#c9ccd1'; g.beginPath(); for (let k = 0; k < 3; k++) { g.moveTo(X + k*T/3, Y+T); g.lineTo(X + k*T/3 + T/6, Y+8); g.lineTo(X + (k+1)*T/3, Y+T); } g.fill(); }
      else if (ch == 'F') { g.fillStyle = '#6b4a2b'; g.fillRect(X+12, Y-30, 4, 58); g.fillStyle = boss ? '#999' : '#FF4539'; g.beginPath(); g.moveTo(X+16, Y-30); g.lineTo(X+36, Y-22); g.lineTo(X+16, Y-14); g.fill(); } }));
    if (movers) for (const m of movers) { g.fillStyle = '#b48cff'; rr(g, m.x, m.y, m.w, 12, 6); g.fill(); }
    if (boss) { const B = boss; g.globalAlpha = B.inv > 0 && Math.sin(t*30) > 0 ? .4 : 1; g.fillStyle = '#6a3a8a'; rr(g, B.x, B.y, B.w, B.h, 14); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(B.x+16, B.y+20, 7, 0, TAU); g.arc(B.x+40, B.y+20, 7, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(B.x+16 + Math.sign(B.vx)*2, B.y+20, 3, 0, TAU); g.arc(B.x+40 + Math.sign(B.vx)*2, B.y+20, 3, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(B.x+8, B.y); g.lineTo(B.x+16, B.y-14); g.lineTo(B.x+28, B.y-4); g.lineTo(B.x+40, B.y-14); g.lineTo(B.x+48, B.y); g.fill(); }
    if (p && !(p.inv > 0 && Math.sin(t*25) > 0)) { g.fillStyle = '#00B451'; rr(g, p.x, p.y, 20, 26, 8); g.fill(); g.fillStyle = '#D5F367'; rr(g, p.x+3, p.y+12, 14, 8, 4); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x+10 + p.face*4, p.y+7, 4, 0, TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(p.x+11 + p.face*5, p.y+7, 2, 0, TAU); g.fill(); }
    g.restore();
    g.fillStyle = '#121313'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Level '+(lvl+1)+'  ·  '+(score||0).toLocaleString(), 12, 22); g.textAlign = 'right'; g.fillText('❤'.repeat(clamp(lives||0,0,8)), w-12, 22);
    if (boss) { g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, w/2-100, 32, 200, 10, 5); g.fill(); g.fillStyle = '#b48cff'; rr(g, w/2-100, 32, 200*boss.hp/boss.max, 10, 5); g.fill(); g.fillStyle = '#121313'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText('THE BRAMBLE KING · stomp on his head!', w/2, 56); }
    if (st == 'ready') A.overlayText(g, w, h, 'MOSSY LEAP', __skip ? 'Saved game · tap or press Space to continue' : '← → move · Space jump · phone: left quarter / next quarter move, right half jump');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', (score||0).toLocaleString()+' points · level '+(lvl+1)+' · tap to try again'); });
  reset(); st = 'ready';
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
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
    overText = place+(['st','nd','rd','th'][place-1])+' place! '+sc.toLocaleString()+' points'; st = 'over'; api.over(sc); };
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
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText((score||0).toLocaleString(), 10, 24); g.textAlign = 'right'; g.fillText('Drop in '+(shotsToDrop||0), w-10, 24); g.font = '11px '+A.font; g.textAlign = 'center'; g.fillText('swap', w/2 + 60, h-16);
    if (st == 'ready') A.overlayText(g, w, h, 'BUBBLE POP', __skip ? 'Saved game · tap or press Space to continue' : 'Aim with the mouse or ← →, tap / Space to shoot · match 3 to pop');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', (score||0).toLocaleString()+' points · tap to play again'); });
  reset(); st = 'ready';
  // ---- save & resume (Save & leave, reloads, closing the browser) ----
  api.snap && api.snap(() => (st == 'play' || st == 'quiz') ? {v:1, grid, drop, score, shotsToDrop, cur, next} : null);
  { const R0 = api.resume; if (R0 && R0.v == 1) { try { ({grid, drop, score, shotsToDrop, cur, next} = R0); shot = null; api.score(score); __skip = true; st = 'ready'; } catch(e) { console.error('[save] bubble resume failed', e); } } }
  return () => { offK(); offL(); };
}});
})();
