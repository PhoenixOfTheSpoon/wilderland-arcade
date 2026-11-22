// Wilderland Arcade · GAMES PACK 2 — Brick Quest, Trail Runner, Pine Pinball, Fishing Hole, Beat Hopper, Mossy Leap, Pinecone Rally, Bubble Pop.
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
// BRICK QUEST — breakout where you draft a power-up after every cleared wall.
// =====================================================================================================
A.register('brickrogue', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 480, 560); c.style.touchAction = 'none';
  const K = keysDown(); let st = 'ready', pad, balls, bricks, level, score, lives, perks, draft = null, quiz = false, t = 0, parts = [];
  const PERKS = [{k:'wide',n:'Wide Paddle',d:'+30% paddle width',e:'↔'},{k:'multi',n:'Multiball',d:'+1 ball at the start of each wall',e:'⚪'},{k:'fire',n:'Fireball',d:'Balls smash through 1 extra brick',e:'🔥'},{k:'slow',n:'Slow Time',d:'Ball 10% slower',e:'🐢'},{k:'life',n:'Extra Life',d:'+1 life now',e:'❤'},{k:'magnet',n:'Sticky Paddle',d:'Catch the ball, tap to launch',e:'🧲'},{k:'gold',n:'Gold Bricks',d:'+25% points per brick',e:'💰'},{k:'laser',n:'Lasers',d:'Paddle shoots tiny lasers',e:'⚡'}];
  const pv = k => perks[k]||0;
  const newWall = () => { bricks = []; const rows = Math.min(9, 4 + level), cols = 8, bw = (w-40)/cols;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const pat = (level*7 + r*3 + q) % 11; if (level > 1 && pat == 0) continue;
      const hp = 1 + (r < level/2 ? 1 : 0) + (level > 5 && r == 0 ? 1 : 0); bricks.push({x:20+q*bw, y:60+r*24, w:bw-4, h:18, hp, max:hp, col:['#FF4539','#FF8A3C','#F9BF01','#00B451','#64CDF5','#b48cff','#ff8fd0','#D5F367','#c9ccd1'][r%9]}); }
    pad.w = A.D(110,90,72) * (1 + .3*pv('wide')) + 8*A.U('wide'); balls = []; for (let i = 0; i <= pv('multi'); i++) launchBall(true, i); };
  const launchBall = (stuck, i=0) => { const sp = A.D(300,350,410) * (1 + level*.03) * Math.pow(.9, pv('slow')); balls.push({x:pad.x, y:pad.y-12, vx:(i%2?-1:1)*sp*.5, vy:-sp*.85, r:7, sp, stuck, fire:pv('fire')}); };
  const reset = () => { pad = {x:w/2, y:h-34, w:100}; level = 1; score = 0; lives = A.D(5,3,2) + A.U('life'); perks = {}; lasers = []; newWall(); api.score(0); };
  let lasers = [], laserT = 0;
  const offerDraft = () => { const pool = PERKS.slice().sort(() => Math.random() - .5).slice(0, 3); draft = pool; st = 'draft'; A.sfx('win'); };
  const pick = i => { const p = draft[i]; if (!p) return; perks[p.k] = pv(p.k) + 1; if (p.k == 'life') lives++; draft = null; level++; newWall(); st = 'play'; A.sfx('coin'); };
  const loseBall = () => { if (balls.length) return; if (A.immortal) { launchBall(true); return; }
    const die = () => { lives--; if (lives <= 0) { st = 'over'; A.sfx('over'); stat(api,'brickLevel',level,'max'); api.over(score); } else { launchBall(true); A.sfx('bad'); } };
    quiz = learn2(host, api, 'BALL LOST · ANSWER TO KEEP YOUR LIFE', () => { quiz = false; launchBall(true); }, () => { quiz = false; die(); }); };
  const offK = A.keys(e => { if (e.key == ' ' || e.key == 'Enter') { if (st == 'ready' || st == 'over') { reset(); st = 'play'; } else balls.forEach(b => b.stuck = false); }
    if (st == 'draft' && ['1','2','3'].includes(e.key)) pick(+e.key - 1); });
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h); if (st == 'ready' || st == 'over') { reset(); st = 'play'; return; }
    if (st == 'draft') { const i = Math.floor((q.x - 30) / ((w-60)/3)); if (q.y > 200 && q.y < 400) pick(clamp(i,0,2)); return; } pad.x = q.x; balls.forEach(b => b.stuck = false); });
  c.addEventListener('pointermove', e => { if (st == 'play') pad.x = pt(c, e, w, h).x; });
  const offL = A.loop(dt => { t += dt; dt = Math.min(dt, .033);
    if (st == 'play' && !quiz) { const ax = (K.k.ArrowLeft||K.k.a ? -1 : 0) + (K.k.ArrowRight||K.k.d ? 1 : 0); pad.x = clamp(pad.x + ax*520*dt, pad.w/2, w - pad.w/2);
      if (pv('laser')) { laserT -= dt; if (laserT <= 0) { laserT = .7 / pv('laser'); lasers.push({x:pad.x - pad.w/2 + 6, y:pad.y}, {x:pad.x + pad.w/2 - 6, y:pad.y}); } }
      for (const L of lasers) { L.y -= 600*dt; const hit = bricks.find(b => b.hp > 0 && L.x > b.x && L.x < b.x+b.w && L.y > b.y && L.y < b.y+b.h); if (hit) { L.y = -99; hitBrick(hit); } } lasers = lasers.filter(L => L.y > 0);
      for (const b of balls) { if (b.stuck) { b.x = pad.x; b.y = pad.y - 12; continue; }
        b.x += b.vx*dt; b.y += b.vy*dt;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } if (b.x > w - b.r) { b.x = w - b.r; b.vx = -Math.abs(b.vx); } if (b.y < b.r + 30) { b.y = b.r + 30; b.vy = Math.abs(b.vy); }
        if (b.vy > 0 && b.y + b.r >= pad.y - 6 && b.y < pad.y + 8 && Math.abs(b.x - pad.x) < pad.w/2 + b.r) { const off = (b.x - pad.x) / (pad.w/2), ang = off * 1.05; b.vx = Math.sin(ang)*b.sp; b.vy = -Math.cos(ang)*b.sp; b.y = pad.y - 7 - b.r; A.tone(440,.04,'square',.03); if (pv('magnet')) b.stuck = true; }
        let pierce = b.fire; for (const br of bricks) { if (br.hp <= 0) continue; if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
          hitBrick(br); if (pierce > 0 && br.hp <= 0) { pierce--; continue; } const ox = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r)), oy = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r)); if (ox < oy) b.vx *= -1; else b.vy *= -1; break; } }
        if (b.y > h + 20) b.dead = 1; }
      balls = balls.filter(b => !b.dead); if (!balls.length) loseBall();
      if (bricks.every(b => b.hp <= 0)) { score += 200*level; api.score(score); offerDraft(); } }
    for (const q of parts) { q.t -= dt; q.x += q.vx*dt; q.y += q.vy*dt; q.vy += 400*dt; } parts = parts.filter(q => q.t > 0);
    sky(g, w, h, '#1a1440', '#0b2e24'); g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Wall '+level+'   '+score.toLocaleString(), 12, 22); g.textAlign = 'right'; g.fillText('❤'.repeat(clamp(lives,0,8)), w-12, 22);
    const pk = Object.keys(perks).map(k => PERKS.find(p => p.k == k).e + (perks[k] > 1 ? perks[k] : '')).join(' '); g.textAlign = 'center'; g.font = '600 13px '+A.font; g.fillText(pk, w/2, 22);
    if (bricks) for (const br of bricks) { if (br.hp <= 0) continue; g.fillStyle = br.col; g.globalAlpha = .45 + .55*br.hp/br.max; rr(g, br.x, br.y, br.w, br.h, 5); g.fill(); g.globalAlpha = 1; if (br.max > 1) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(br.x+4, br.y+3, (br.w-8)*br.hp/br.max, 3); } }
    if (pad) { g.fillStyle = '#D5F367'; rr(g, pad.x - pad.w/2, pad.y - 6, pad.w, 12, 6); g.fill(); if (pv('magnet')) { g.fillStyle = '#ff8fd0'; g.fillRect(pad.x - 6, pad.y - 6, 12, 4); } }
    g.fillStyle = '#ff5a5a'; for (const L of lasers) g.fillRect(L.x-1, L.y-8, 2, 8);
    if (balls) for (const b of balls) { g.fillStyle = b.fire ? '#FF8A3C' : '#fff'; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); }
    for (const q of parts) { g.globalAlpha = q.t*2; g.fillStyle = q.col; g.fillRect(q.x, q.y, 3, 3); } g.globalAlpha = 1;
    if (st == 'draft') { g.fillStyle = 'rgba(0,0,0,.75)'; g.fillRect(0,0,w,h); g.fillStyle = '#F9BF01'; g.font = '800 24px '+A.font; g.textAlign = 'center'; g.fillText('WALL CLEARED! PICK A POWER', w/2, 170);
      draft.forEach((p, i) => { const x = 30 + i*(w-60)/3, cw = (w-60)/3 - 10; g.fillStyle = '#2a1a4a'; rr(g, x, 210, cw, 180, 14); g.fill(); g.strokeStyle = '#D5F367'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#fff'; g.font = '32px '+A.font; g.fillText(p.e, x+cw/2, 260); g.font = '700 14px '+A.font; g.fillText(p.n, x+cw/2, 296); g.font = '12px '+A.font; g.fillStyle = '#d8c8ff'; wrapText(g, p.d, x+cw/2, 318, cw-12, 15); g.fillStyle = '#D5F367'; g.font = '700 13px '+A.font; g.fillText('Press '+(i+1), x+cw/2, 376); }); }
    if (st == 'ready') A.overlayText(g, w, h, 'BRICK QUEST', 'Clear a wall, pick a power, repeat · tap or Space to start');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', score.toLocaleString()+' points · wall '+level+' · tap to try again'); });
  const hitBrick = br => { br.hp--; if (br.hp <= 0) { score += Math.round(10 * (1 + .25*pv('gold')) * (1 + level*.1)); api.score(score); A.tone(600 + Math.random()*200,.04,'square',.03); if (!low()) for (let i=0;i<6;i++) parts.push({x:br.x+br.w/2, y:br.y+br.h/2, vx:(Math.random()-.5)*200, vy:-Math.random()*150, t:.5, col:br.col}); } else A.tone(300,.03,'square',.02); };
  const wrapText = (g, s, x, y, mw, lh) => { const words = s.split(' '); let line = ''; words.forEach(wd => { const tt = line ? line+' '+wd : wd; if (g.measureText(tt).width > mw) { g.fillText(line, x, y); y += lh; line = wd; } else line = tt; }); g.fillText(line, x, y); };
  reset(); st = 'ready';
  return () => { offK(); offL(); K.off(); };
}});

// =====================================================================================================
// TRAIL RUNNER — endless forest run. Jump (and double jump) over logs and rocks, duck under branches.
// =====================================================================================================
A.register('runner', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 560, 320); c.style.touchAction = 'none';
  const GROUND = h - 50; let st = 'ready', p, obs, items, speed, dist, score, acorns, lives, t = 0, spawnT = 0, quiz = false, duck = false, hills = [];
  for (let i = 0; i < 6; i++) hills.push({x:i*120, h:40 + Math.random()*50});
  const reset = () => { p = {y:GROUND, vy:0, jumps:0, inv:0}; obs = []; items = []; speed = A.D(240,290,340); dist = 0; score = 0; acorns = 0; lives = 1 + A.U('life'); spawnT = 1; api.score(0); };
  const jump = () => { if (st != 'play') { if (st != 'quiz') { reset(); st = 'play'; } return; } const maxJ = 1 + (A.U('double') ? 1 : 0) + (A.D(1,0,0)); if (p.jumps < Math.max(2, maxJ)) { p.vy = -560 * (1 + .04*A.U('spring')); p.jumps++; A.tone(520 + p.jumps*120,.06,'triangle',.04); } };
  const offK = A.keys(e => { if (e.type != 'keydown') return; if (e.key == ' ' || e.key == 'ArrowUp' || e.key == 'w' || e.key == 'Enter') jump(); if (e.key == 'ArrowDown' || e.key == 's') duck = true; });
  const ku = e => { if (e.key == 'ArrowDown' || e.key == 's') duck = false; }; window.addEventListener('keyup', ku);
  let downY = null; c.addEventListener('pointerdown', e => { downY = pt(c, e, w, h).y; if (pt(c, e, w, h).y > h*.7 && st == 'play') duck = true; else jump(); });
  const pu = () => { duck = false; downY = null; }; c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const hit = () => { if (p.inv > 0 || A.immortal) return; lives--; p.inv = 1.5; A.sfx('bad');
    if (lives <= 0) { st = 'quiz'; quiz = learn2(host, api, 'OOF! ANSWER TO KEEP RUNNING', () => { lives = 1; p.inv = 2; st = 'play'; }, () => { st = 'over'; A.sfx('over'); stat(api,'runnerBest',score,'max'); api.over(score); }); } };
  const offL = A.loop(dt => { t += dt; dt = Math.min(dt, .033);
    if (st == 'play') { speed += dt * A.D(4,6,8); dist += speed*dt; p.vy += 1500*dt; p.y += p.vy*dt; if (p.y >= GROUND) { p.y = GROUND; p.vy = 0; p.jumps = 0; } p.inv = Math.max(0, p.inv - dt);
      spawnT -= dt; if (spawnT <= 0) { const r = Math.random(); spawnT = A.D(1.3,1.05,.85) * (0.8 + Math.random()*.6) * 300/speed * 1.2;
        if (r < .45) obs.push({x:w+20, y:GROUND, w:34, h:26, k:'log'}); else if (r < .7) obs.push({x:w+20, y:GROUND, w:30, h:38, k:'rock'}); else if (r < .88) obs.push({x:w+20, y:GROUND-46, w:60, h:16, k:'branch'}); else obs.push({x:w+20, y:GROUND-70 - Math.random()*30, w:30, h:20, k:'bird', vy:0});
        if (Math.random() < .7) for (let i = 0; i < 3; i++) items.push({x:w + 80 + i*28, y:GROUND - 30 - Math.random()*80}); }
      const ph = duck && p.y >= GROUND ? 24 : 44, px = 90;
      for (const o of obs) { o.x -= speed*dt * (o.k == 'bird' ? 1.25 : 1); if (o.x < px + 14 && o.x + o.w > px - 14 && p.y - ph < o.y && p.y > o.y - o.h) { o.x = -999; hit(); } }
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
    if (st == 'ready') A.overlayText(g, w, h, 'TRAIL RUNNER', 'Space / tap to jump (twice for a double jump) · ↓ or tap low to duck');
    if (st == 'over') A.overlayText(g, w, h, 'TRIPPED!', score.toLocaleString()+' points · tap to run again'); });
  reset(); st = 'ready';
  return () => { offK(); offL(); window.removeEventListener('keyup', ku); };
}});

// =====================================================================================================
// PINE PINBALL — flippers, bumpers, drop targets and multiball.
// =====================================================================================================
A.register('pinball', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 420, 620); c.style.touchAction = 'none';
  const K = keysDown(); let st = 'ready', balls, score, ballsLeft, t = 0, quiz = false, lFlip = 0, rFlip = 0, lUp = false, rUp = false, targets, mult = 1, multT = 0, plunge = 0, charging = false, lights = 0;
  const BUMP = [{x:140, y:180, r:24, c:'#FF4539'}, {x:280, y:180, r:24, c:'#64CDF5'}, {x:210, y:260, r:24, c:'#F9BF01'}, {x:110, y:330, r:16, c:'#b48cff'}, {x:310, y:330, r:16, c:'#00B451'}];
  // wall segments (x1,y1,x2,y2)
  const WALLS = [[20,620,20,90],[20,90,90,30],[90,30,330,30],[330,30,392,90],[392,90,392,620],[370,620,370,140],[20,470,120,545],[370,470,280,545],[60,400,60,470],[350,400,350,470],[60,470,120,505],[350,470,290,505]];
  const FL = {l:{x:128, y:552, len:62, side:1}, r:{x:282, y:552, len:62, side:-1}};
  const resetTargets = () => { targets = [0,1,2,3].map(i => ({x:150 + i*40, y:100, up:true})); };
  const newBall = () => { balls.push({x:381, y:560, vx:0, vy:0, r:8, inLane:true}); };
  const reset = () => { balls = []; score = 0; ballsLeft = A.D(5,3,3) + A.U('balls'); mult = 1; resetTargets(); newBall(); api.score(0); };
  const add = n => { score += n * mult; api.score(score); };
  const segHit = (b, x1, y1, x2, y2, bounce=0.8, kick=0) => { const dx = x2-x1, dy = y2-y1, L2 = dx*dx+dy*dy; let tt = ((b.x-x1)*dx + (b.y-y1)*dy) / L2; tt = clamp(tt, 0, 1);
    const cx = x1 + tt*dx, cy = y1 + tt*dy, ox = b.x - cx, oy = b.y - cy, d = Math.hypot(ox, oy); if (d < b.r && d > 0) { const nx = ox/d, ny = oy/d, vn = b.vx*nx + b.vy*ny;
      b.x = cx + nx*b.r; b.y = cy + ny*b.r; if (vn < 0) { b.vx -= (1+bounce)*vn*nx; b.vy -= (1+bounce)*vn*ny; } if (kick) { b.vx += nx*kick; b.vy += ny*kick; } return true; } return false; };
  const flipEnd = (f, ang) => { const a = f.side > 0 ? ang : Math.PI - ang; return {x:f.x + Math.cos(a)*f.len*f.side*f.side, y:f.y + Math.sin(a)*f.len}; };
  const flipAng = up => up ? -0.45 : 0.5;
  const drain = () => { if (balls.length) return; if (A.immortal) { newBall(); return; }
    const out = () => { ballsLeft--; if (ballsLeft <= 0) { st = 'over'; A.sfx('over'); stat(api,'pinballBest',score,'max'); api.over(score); } else { newBall(); A.sfx('bad'); } };
    quiz = learn2(host, api, 'DRAIN! ANSWER FOR A BALL SAVE', () => { quiz = false; newBall(); }, () => { quiz = false; out(); }); };
  const offK = A.keys(e => { if (e.key == ' ' || e.key == 'Enter') { if (st != 'play') { reset(); st = 'play'; } } });
  c.addEventListener('pointerdown', e => { const q = pt(c, e, w, h); if (st != 'play') { reset(); st = 'play'; return; } if (balls.some(b => b.inLane)) { charging = true; return; } if (q.x < w/2) lUp = true; else rUp = true; });
  const pu = e => { lUp = rUp = false; if (charging) { charging = false; balls.forEach(b => { if (b.inLane) { b.vy = -(500 + plunge*600); b.inLane = false; } }); plunge = 0; } };
  c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const offL = A.loop(dt => { t += dt;
    if (st == 'play' && !quiz) { const L = K.k.ArrowLeft || K.k.a || K.k.z || lUp, R = K.k.ArrowRight || K.k.d || K.k['/'] || rUp; const down = K.k[' '] || K.k.ArrowDown || charging;
      if (down && balls.some(b => b.inLane)) plunge = Math.min(1, plunge + dt*1.2); else if (plunge > 0 && !charging) { balls.forEach(b => { if (b.inLane) { b.vy = -(500 + plunge*600); b.inLane = false; } }); plunge = 0; }
      if (L && !lFlip) A.tone(200,.03,'square',.03); if (R && !rFlip) A.tone(200,.03,'square',.03); lFlip = L ? 1 : 0; rFlip = R ? 1 : 0;
      multT = Math.max(0, multT - dt); if (multT <= 0) mult = 1;
      const steps = 4, sdt = Math.min(dt, .033) / steps;
      for (let s = 0; s < steps; s++) for (const b of balls) { if (b.inLane) { b.x = 381; b.y = 560 + plunge*20; continue; }
        b.vy += 700*sdt; b.x += b.vx*sdt; b.y += b.vy*sdt; const sp = Math.hypot(b.vx, b.vy); if (sp > 1300) { b.vx *= 1300/sp; b.vy *= 1300/sp; }
        WALLS.forEach(W => segHit(b, ...W)); if (b.y < 140 && b.x > 360) segHit(b, 330, 30, 392, 90, .6);
        for (const B of BUMP) { const dx = b.x - B.x, dy = b.y - B.y, d = Math.hypot(dx, dy); if (d < B.r + b.r) { const nx = dx/d, ny = dy/d; b.x = B.x + nx*(B.r+b.r); b.y = B.y + ny*(B.r+b.r); b.vx = nx*620; b.vy = ny*620; B.hit = .15; add(100); A.tone(700 + Math.random()*300,.05,'square',.04); } }
        for (const T of targets) if (T.up && Math.abs(b.x - T.x) < 16 && Math.abs(b.y - T.y) < 10 + b.r) { T.up = false; b.vy = Math.abs(b.vy) + 50; add(250); A.sfx('coin');
          if (targets.every(q => !q.up)) { resetTargets(); lights++; mult = Math.min(5, mult + 1); multT = 20; add(1000); if (lights % 2 == 0 && balls.length < 3) { balls.push({x:200, y:120, vx:-150, vy:0, r:8}); A.sfx('win'); } } }
        for (const [f, up] of [[FL.l, lFlip], [FL.r, rFlip]]) { const e2 = flipEnd(f, flipAng(up)); if (segHit(b, f.x, f.y, e2.x, e2.y, .5, up ? 380 : 0) && up) b.vy -= 150; }
        if (b.y > h + 20) b.dead = 1; }
      balls = balls.filter(b => !b.dead); if (!balls.length) drain(); }
    BUMP.forEach(B => B.hit = Math.max(0, (B.hit||0) - dt));
    sky(g, w, h, '#0d3a2c', '#05150f'); g.strokeStyle = '#D5F367'; g.lineWidth = 4; g.lineCap = 'round'; WALLS.forEach(([a,b2,c2,d]) => { g.beginPath(); g.moveTo(a,b2); g.lineTo(c2,d); g.stroke(); });
    g.fillStyle = 'rgba(213,243,103,.08)'; g.beginPath(); g.moveTo(20,620); g.lineTo(20,90); g.lineTo(90,30); g.lineTo(330,30); g.lineTo(392,90); g.lineTo(392,620); g.fill();
    for (let i = 0; i < 5; i++) { g.fillStyle = i < lights % 6 ? '#F9BF01' : 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(150 + i*30, 420, 6, 0, TAU); g.fill(); }
    for (const B of BUMP) { g.fillStyle = B.hit ? '#fff' : B.c; g.beginPath(); g.arc(B.x, B.y, B.r + (B.hit ? 3 : 0), 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(B.x - B.r*.3, B.y - B.r*.3, B.r*.35, 0, TAU); g.fill(); }
    if (targets) for (const T of targets) { g.fillStyle = T.up ? '#ff8fd0' : 'rgba(255,255,255,.12)'; rr(g, T.x - 14, T.y - 5, 28, 10, 4); g.fill(); }
    for (const [f, up] of [[FL.l, lFlip], [FL.r, rFlip]]) { const e2 = flipEnd(f, flipAng(up)); g.strokeStyle = '#FF8A3C'; g.lineWidth = 12; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(e2.x, e2.y); g.stroke(); }
    g.fillStyle = '#8D5B1D'; g.fillRect(372, 575 + plunge*20, 18, 45);
    if (balls) for (const b of balls) { const gr = g.createRadialGradient(b.x-3, b.y-3, 1, b.x, b.y, b.r); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#9aa5a1'); g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); }
    g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText(score.toLocaleString(), 28, 22); g.textAlign = 'right'; g.fillText((mult > 1 ? '×'+mult+'  ' : '')+'Balls '+ballsLeft, 386, 22);
    if (st == 'ready') A.overlayText(g, w, h, 'PINE PINBALL', '← → (or tap left/right) flip · hold Space or tap to launch');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', score.toLocaleString()+' points · tap to play again'); });
  reset(); st = 'ready';
  return () => { offK(); offL(); K.off(); };
}});

// =====================================================================================================
// FISHING HOLE — cast, wait for a bite, then keep the fish in the reel zone. Fill your Fish Book.
// =====================================================================================================
A.register('fishing', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 480, 520); c.style.touchAction = 'none';
  const FISH = [{k:'minnow',n:'Minnow',r:0,pts:20,c:'#c9ccd1'},{k:'perch',n:'Yellow Perch',r:0,pts:35,c:'#F9BF01'},{k:'sunfish',n:'Sunfish',r:0,pts:40,c:'#FF8A3C'},{k:'trout',n:'Rainbow Trout',r:1,pts:80,c:'#ff8fd0'},{k:'bass',n:'Bass',r:1,pts:90,c:'#5a8a3a'},{k:'catfish',n:'Catfish',r:1,pts:110,c:'#8a7a6a'},{k:'pike',n:'Northern Pike',r:2,pts:200,c:'#3a7a5a'},{k:'salmon',n:'Salmon',r:2,pts:220,c:'#ff7a5a'},{k:'sturgeon',n:'Sturgeon',r:3,pts:500,c:'#6a6a7a'},{k:'koi',n:'Golden Koi',r:3,pts:600,c:'#ffb000'},{k:'boot',n:'Old Boot',r:0,pts:5,c:'#5a3a1a'},{k:'chest',n:'Treasure Chest',r:4,pts:1500,c:'#c8964a'},{k:'legend',n:'The Lake Legend',r:5,pts:5000,c:'#4a5cff'}];
  const RN = ['Common','Uncommon','Rare','Epic','Legendary','Mythic'];
  let st = 'ready', phase = 'idle', score = 0, casts, power = 0, pdir = 1, bobX = 0, biteT = 0, fish = null, zone = 0, zoneV = 0, fy = 0, fv = 0, prog = 0, t = 0, caught = [], hold = false, msg = '', msgT = 0, quiz = false;
  const book = () => { try { return JSON.parse(localStorage.getItem('wl-fishbook') || '{}'); } catch(e) { return {}; } };
  const saveBook = b => { try { localStorage.setItem('wl-fishbook', JSON.stringify(b)); } catch(e){} };
  const roll = () => { const luck = 1 + .15*A.U('lure') + power*.5; const w8 = FISH.map(f => f.k == 'boot' ? 6 : Math.pow(0.42, f.r) * 10 * (f.r >= 2 ? luck : 1)); let s = w8.reduce((a,b)=>a+b,0), x = Math.random()*s; for (let i = 0; i < FISH.length; i++) { x -= w8[i]; if (x <= 0) return FISH[i]; } return FISH[0]; };
  const reset = () => { score = 0; casts = A.D(12,10,8) + A.U('bait'); caught = []; phase = 'aim'; api.score(0); };
  const press = () => { if (st != 'play') { reset(); st = 'play'; return; } if (quiz) return;
    if (phase == 'aim') { phase = 'wait'; bobX = 80 + power*340; biteT = 1.5 + Math.random()*3; A.tone(300,.15,'sine',.05); }
    else if (phase == 'bite') { fish = roll(); phase = 'reel'; zone = 200; zoneV = 0; fy = 200; fv = 0; prog = .3; A.sfx('blip'); }
    else if (phase == 'wait') { msg = 'Too early!'; msgT = 1; endCast(false); } };
  const endCast = ok => { if (ok && fish) { score += fish.pts; api.score(score); caught.push(fish); const b = book(); b[fish.k] = (b[fish.k]||0) + 1; saveBook(b); stat(api,'fishCaught',1,'add'); if (fish.r >= 3) stat(api,'fishRare',1,'add'); msg = 'Caught: '+fish.n+'! +'+fish.pts; msgT = 2; A.sfx(fish.r >= 2 ? 'win' : 'coin'); }
    fish = null; casts--; phase = 'aim'; power = 0;
    if (casts <= 0) { st = 'over'; A.sfx('over'); api.over(score); } };
  const offK = A.keys(e => { if (e.key == ' ' || e.key == 'Enter') { if (e.type == 'keydown') { hold = true; press(); } } });
  const ku = e => { if (e.key == ' ' || e.key == 'Enter') hold = false; }; window.addEventListener('keyup', ku);
  c.addEventListener('pointerdown', () => { hold = true; press(); }); const pu = () => { hold = false; }; c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const offL = A.loop(dt => { t += dt; msgT = Math.max(0, msgT - dt);
    if (st == 'play' && !quiz) {
      if (phase == 'aim') { power += pdir*dt*.9; if (power > 1) { power = 1; pdir = -1; } if (power < 0) { power = 0; pdir = 1; } }
      if (phase == 'wait') { biteT -= dt; if (biteT <= 0) { phase = 'bite'; biteT = A.D(1.2,.9,.65); A.tone(880,.08,'square',.05); } }
      else if (phase == 'bite') { biteT -= dt; if (biteT <= 0) { msg = 'It got away!'; msgT = 1; endCast(false); } }
      else if (phase == 'reel') { const zh = 70 + 10*A.U('reel') - fish.r*6, diff = (1 + fish.r*.35) * A.D(.8,1,1.25);
        fv += (Math.random()-.5) * 1600 * diff * dt; fv *= Math.pow(.3, dt); fy = clamp(fy + fv*dt, 40, 380);
        zoneV += (hold ? -900 : 700) * dt; zoneV *= Math.pow(.15, dt); zone = clamp(zone + zoneV*dt, 40, 380);
        const inZ = Math.abs(fy - zone) < zh/2; prog += (inZ ? .35 : -.25 * diff) * dt;
        if (prog >= 1) endCast(true); else if (prog <= 0) { quiz = learn2(host, api, 'THE LINE IS SLIPPING! ANSWER TO HOLD ON', () => { quiz = false; prog = .5; }, () => { quiz = false; msg = 'The '+fish.n+' got away!'; msgT = 1.5; endCast(false); }); } } }
    sky(g, w, h, '#ffd9a0', '#ffb380'); g.fillStyle = '#ffe9b0'; g.beginPath(); g.arc(380, 90, 34, 0, TAU); g.fill();
    g.fillStyle = '#5a8a3a'; g.beginPath(); g.moveTo(0,190); for (let x = 0; x <= w; x += 40) g.lineTo(x, 170 + Math.sin(x*.05)*12); g.lineTo(w,200); g.lineTo(0,200); g.fill();
    const wg = g.createLinearGradient(0,200,0,h); wg.addColorStop(0,'#3aa0c8'); wg.addColorStop(1,'#0b3a5a'); g.fillStyle = wg; g.fillRect(0,200,w,h-200);
    for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(255,255,255,.18)'; g.beginPath(); const yy = 230 + i*40; g.moveTo(0, yy); for (let x = 0; x <= w; x += 20) g.lineTo(x, yy + Math.sin(x*.04 + t*2 + i)*3); g.stroke(); }
    g.fillStyle = '#8D5B1D'; g.fillRect(0, 190, 70, 20); g.fillStyle = '#c8742c'; rr(g, 26, 150, 20, 40, 8); g.fill(); g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(36, 142, 10, 0, TAU); g.fill();
    if (phase == 'wait' || phase == 'bite' || phase == 'reel') { const bob = phase == 'bite' ? Math.sin(t*30)*4 + 4 : Math.sin(t*3)*2; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(48, 130); g.quadraticCurveTo((48+bobX)/2, 120, bobX, 205 + bob); g.stroke();
      g.fillStyle = '#FF4539'; g.beginPath(); g.arc(bobX, 205 + bob, 6, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(bobX - 6, 205 + bob, 12, 3); if (phase == 'bite') { g.fillStyle = '#fff'; g.font = '800 22px '+A.font; g.textAlign = 'center'; g.fillText('BITE! TAP!', bobX, 180); } }
    else { g.strokeStyle = '#6b4a2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(44, 150); g.lineTo(90, 100); g.stroke(); }
    if (phase == 'aim' && st == 'play') { g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 100, 470, 280, 18, 9); g.fill(); g.fillStyle = power > .8 ? '#FF4539' : '#D5F367'; rr(g, 100, 470, 280*power, 18, 9); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText('TAP TO CAST · farther casts find rarer fish', w/2, 460); }
    if (phase == 'reel' && fish) { const zh = 70 + 10*A.U('reel') - fish.r*6; g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 410, 30, 46, 380, 12); g.fill(); g.fillStyle = 'rgba(213,243,103,.55)'; rr(g, 414, zone - zh/2, 38, zh, 8); g.fill();
      g.fillStyle = fish.c; g.beginPath(); g.ellipse(433, fy, 14, 8, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 380, 30, 14, 380, 6); g.fill(); g.fillStyle = '#F9BF01'; rr(g, 380, 30 + 380*(1-prog), 14, 380*prog, 6); g.fill();
      g.fillStyle = '#fff'; g.font = '700 14px '+A.font; g.textAlign = 'center'; g.fillText('HOLD to raise the green zone · keep the fish inside', 200, 250); }
    g.fillStyle = '#121313'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText(score.toLocaleString()+' pts · casts left '+(casts||0), 12, 24);
    const bk = book(), seen = FISH.filter(f => bk[f.k]).length; g.textAlign = 'right'; g.fillText('📖 Fish Book '+seen+'/'+FISH.length, w-12, 24);
    if (msgT > 0) { g.fillStyle = 'rgba(0,0,0,.6)'; rr(g, w/2-150, 300, 300, 40, 12); g.fill(); g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'center'; g.fillText(msg, w/2, 326); }
    if (st == 'ready') A.overlayText(g, w, h, 'FISHING HOLE', 'Tap to cast, tap on a bite, hold to reel · '+seen+' of '+FISH.length+' fish found');
    if (st == 'over') A.overlayText(g, w, h, 'OUT OF BAIT', score.toLocaleString()+' points · '+caught.length+' fish · tap to fish again'); });
  return () => { offK(); offL(); window.removeEventListener('keyup', ku); };
}});

// =====================================================================================================
// BEAT HOPPER — notes fall down 4 lanes; tap them on the line, in time with the music.
// =====================================================================================================
A.register('rhythm', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 400, 560); c.style.touchAction = 'none';
  const LANES = 4, LW = w/LANES, HIT = h - 90, COLS = ['#FF4539','#F9BF01','#00B451','#64CDF5'], KEYS = ['d','f','j','k'], ALT = ['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'], NOTE_F = [262,330,392,523];
  let st = 'ready', notes, score, combo, best, miss, songT, bpm, beat, nextBeat, t = 0, flash = [0,0,0,0], judge = '', judgeT = 0, quiz = false, song = 0;
  const reset = () => { notes = []; score = 0; combo = 0; best = 0; miss = 0; songT = 0; bpm = A.D(96,116,136); beat = 60/bpm; nextBeat = 1.5; song++; api.score(0); };
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
    if (st == 'ready') A.overlayText(g, w, h, 'BEAT HOPPER', 'D F J K (or arrows, or tap the lanes) when notes hit the line');
    if (st == 'over') A.overlayText(g, w, h, 'SONG OVER', Math.round(score).toLocaleString()+' points · best combo '+best+' · tap to dance again'); });
  const tick = {b:-1};
  return () => { offK(); offL(); };
}});

// =====================================================================================================
// MOSSY LEAP — short platformer levels (coins, spikes, moving platforms) with a boss every 5th level.
// =====================================================================================================
A.register('platformer', { mount(host, api){
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
  const reset = () => { lvl = 0; score = 0; lives = A.D(5,3,2) + A.U('life'); total = 0; load(); api.score(0); };
  const solid = (x, y) => { const cx = Math.floor(x / T), cy = Math.floor(y / T); if (cy < 0) return false; if (cy >= map.length) return false; return (map[cy][cx] || ' ') == '='; };
  const die = () => { if (A.immortal) { p.inv = 1; return; } const lose = () => { lives--; A.sfx('bad'); if (lives <= 0) { st = 'over'; A.sfx('over'); stat(api,'platLevel',lvl+1,'max'); api.over(score); } else load(); };
    quiz = learn2(host, api, 'OUCH! ANSWER TO TRY AGAIN FROM HERE', () => { quiz = false; p.inv = 2; p.vy = -500; }, () => { quiz = false; lose(); }); };
  const win = () => { score += 500 + coins*10; total++; api.score(score); A.sfx('win'); lvl++; load(); };
  const offK = A.keys(e => { if ((e.key == ' ' || e.key == 'Enter') && st != 'play') { reset(); st = 'play'; } });
  const touch = {l:false, r:false, j:false}; const tz = e => { const q = pt(c, e, w, h); touch.l = q.x < w*.25; touch.r = q.x > w*.25 && q.x < w*.5; touch.j = q.x > w*.5; };
  c.addEventListener('pointerdown', e => { if (st != 'play') { reset(); st = 'play'; return; } tz(e); }); c.addEventListener('pointermove', e => { if (e.buttons) tz(e); });
  const pu = () => { touch.l = touch.r = touch.j = false; }; c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const offL = A.loop(dt => { t += dt; dt = Math.min(dt, .033);
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
    if (st == 'ready') A.overlayText(g, w, h, 'MOSSY LEAP', '← → move · Space jump · phone: left quarter / next quarter move, right half jump');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', (score||0).toLocaleString()+' points · level '+(lvl+1)+' · tap to try again'); });
  reset(); st = 'ready';
  return () => { offK(); offL(); K.off(); };
}});

// =====================================================================================================
// PINECONE RALLY — top-down racing on a looping forest track against 3 rivals. 3 laps.
// =====================================================================================================
A.register('racing', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 520, 520); c.style.touchAction = 'none';
  const K = keysDown(), CX = w/2, CY = h/2, RX = 200, RY = 170, TW = 70;
  const onTrack = (x, y) => { const d = Math.hypot((x-CX)/RX, (y-CY)/RY); return Math.abs(d - 1) * Math.min(RX, RY) < TW/2; };
  const angOf = (x, y) => (Math.atan2((y-CY)/RY, (x-CX)/RX) + TAU) % TAU;
  let st = 'ready', cars, t = 0, raceT = 0, countdown = 0, finish = [], steerX = null, quiz = false;
  const mk = (i, me) => { const a = Math.PI/2 + .05 + i*.04, off = (i % 2 ? 18 : -18); return {x:CX + Math.cos(a)*(RX + off), y:CY + Math.sin(a)*(RY + off), dir:a + Math.PI/2, sp:0, me, lap:0, lastA:a, prog:0, col:['#FF4539','#64CDF5','#F9BF01','#b48cff'][i], aiSkill:A.D(.82,.9,.98) - i*.02, done:false, lane:off}; };
  const reset = () => { cars = [mk(0, true), mk(1), mk(2), mk(3)]; raceT = 0; countdown = 3; finish = []; api.score(0); };
  const startRace = () => { reset(); st = 'play'; if (A.learnOn && A.learnOn()) { countdown = 99; A.quiz(host, 'ANSWER FOR A HEAD START', ok => { try { api.edu && api.edu(ok); } catch(e){} countdown = 3; if (ok) cars[0].boost = 3; }); } };
  const offK = A.keys(e => { if ((e.key == ' ' || e.key == 'Enter') && st != 'play') startRace(); });
  c.addEventListener('pointerdown', e => { if (st != 'play') { startRace(); return; } steerX = pt(c, e, w, h); }); c.addEventListener('pointermove', e => { if (steerX) steerX = pt(c, e, w, h); });
  const pu = () => { steerX = null; }; c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  const LAPS = 3, top = () => 280 * (1 + .04*A.U('engine'));
  const offL = A.loop(dt => { t += dt; dt = Math.min(dt, .033);
    if (st == 'play') { if (countdown > 0) { const before = Math.ceil(countdown); countdown -= dt; if (Math.ceil(countdown) != before) A.tone(countdown <= 0 ? 880 : 440, .15, 'square', .05); }
      else { raceT += dt;
        for (const car of cars) { if (car.done) { car.sp *= Math.pow(.2, dt); } else if (car.me) { let turn = (K.k.ArrowLeft||K.k.a ? -1 : 0) + (K.k.ArrowRight||K.k.d ? 1 : 0), gas = K.k.ArrowUp || K.k.w || K.k[' '] ? 1 : (K.k.ArrowDown || K.k.s ? -0.6 : 0);
            if (steerX) { const want = Math.atan2(steerX.y - car.y, steerX.x - car.x); let d = want - car.dir; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; turn = clamp(d*2.5, -1, 1); gas = 1; }
            car.dir += turn * 2.8 * dt * clamp(car.sp/120, .3, 1); car.sp += gas * 260 * dt; }
          else { const a = angOf(car.x, car.y) + .35, tx = CX + Math.cos(a)*(RX + car.lane*.6), ty = CY + Math.sin(a)*(RY + car.lane*.6); let d = Math.atan2(ty - car.y, tx - car.x) - car.dir; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
            car.dir += clamp(d*3, -1, 1) * 2.8 * dt; car.sp += 260 * dt * (car.sp < top()*car.aiSkill ? 1 : 0); }
          const grip = onTrack(car.x, car.y) ? 1 : .45; if (car.boost > 0) car.boost -= dt; car.sp = clamp(car.sp * Math.pow(grip < 1 ? .25 : .7, dt), -80, top() * (car.me ? (car.boost > 0 ? 1.35 : 1) : car.aiSkill) * (grip < 1 ? .55 : 1));
          car.x += Math.cos(car.dir) * car.sp * dt; car.y += Math.sin(car.dir) * car.sp * dt; car.x = clamp(car.x, 10, w-10); car.y = clamp(car.y, 10, h-10);
          const a = angOf(car.x, car.y); let da = a - car.lastA; if (da < -Math.PI) da += TAU; if (da > Math.PI) da -= TAU; car.prog += da; car.lastA = a;
          const lap = Math.floor(car.prog / TAU); if (lap > car.lap) { car.lap = lap; if (car.me && lap < LAPS) A.sfx('coin'); if (lap >= LAPS && !car.done) { car.done = true; finish.push(car); if (car.me) { const place = finish.length, sc = Math.max(100, Math.round((4 - place) * 800 + Math.max(0, 120 - raceT) * 20 + A.D(0, 200, 500)));
                A.sfx(place == 1 ? 'win' : 'coin'); stat(api,'raceWins',place == 1 ? 1 : 0,'add'); api.score(sc); setTimeout(() => { st = 'over'; overText = place+(['st','nd','rd','th'][place-1])+' place! '+sc.toLocaleString()+' points'; api.over(sc); }, 900); } } } }
        // bump
        for (let i = 0; i < cars.length; i++) for (let j = i+1; j < cars.length; j++) { const A1 = cars[i], B1 = cars[j], dx = B1.x - A1.x, dy = B1.y - A1.y, d = Math.hypot(dx, dy); if (d < 20 && d > 0) { const nx = dx/d, ny = dy/d, push = (20 - d)/2; A1.x -= nx*push; A1.y -= ny*push; B1.x += nx*push; B1.y += ny*push; A1.sp *= .92; B1.sp *= .92; } } } }
    g.fillStyle = '#3f8a3a'; g.fillRect(0,0,w,h); for (let i = 0; i < 40; i++) { const x = (i*97) % w, y = (i*61) % h; if (onTrack(x, y)) continue; g.fillStyle = '#2f6a2a'; g.beginPath(); g.moveTo(x, y-10); g.lineTo(x+7, y+6); g.lineTo(x-7, y+6); g.fill(); }
    g.strokeStyle = '#6a6a72'; g.lineWidth = TW; g.beginPath(); g.ellipse(CX, CY, RX, RY, 0, 0, TAU); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.setLineDash([16,14]); g.beginPath(); g.ellipse(CX, CY, RX, RY, 0, 0, TAU); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#FF4539'; g.lineWidth = 4; g.beginPath(); g.ellipse(CX, CY, RX + TW/2, RY + TW/2, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(CX, CY, RX - TW/2, RY - TW/2, 0, 0, TAU); g.stroke();
    for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#fff' : '#121313'; g.fillRect(CX - 3, CY + RY - TW/2 + k*TW/6, 6, TW/6); }
    if (cars) for (const car of cars) { g.save(); g.translate(car.x, car.y); g.rotate(car.dir); g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -11, -6, 24, 14, 4); g.fill(); g.fillStyle = car.col; rr(g, -12, -7, 24, 14, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(2, -5, 5, 10); if (car.me) { g.fillStyle = '#fff'; g.font = '700 9px '+A.font; g.textAlign = 'center'; g.rotate(-car.dir); g.fillText('YOU', 0, -12); } g.restore(); }
    const me = cars && cars[0]; if (me) { const place = 1 + cars.filter(cc => cc !== me && (cc.done ? (finish.indexOf(cc) < (finish.indexOf(me) < 0 ? 99 : finish.indexOf(me))) : cc.prog > me.prog)).length;
      g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'left'; g.fillText('Lap '+Math.min(LAPS, me.lap+1)+'/'+LAPS+'   Place '+place+'/4', 12, 24); g.textAlign = 'right'; g.fillText(raceT.toFixed(1)+' s', w-12, 24); }
    if (st == 'play' && countdown > 0) { g.fillStyle = '#fff'; g.font = '800 64px '+A.font; g.textAlign = 'center'; g.fillText(String(Math.ceil(countdown)), CX, CY + 20); }
    if (st == 'ready') A.overlayText(g, w, h, 'PINECONE RALLY', '↑ go · ← → steer · or hold a finger where to drive · 3 laps');
    if (st == 'over') A.overlayText(g, w, h, 'RACE OVER', overText+' · tap to race again'); });
  let overText = '';
  reset(); st = 'ready';
  return () => { offK(); offL(); K.off(); };
}});

// =====================================================================================================
// BUBBLE POP — aim and shoot bubbles; 3+ of one color pop, and anything left hanging drops.
// =====================================================================================================
A.register('bubble', { mount(host, api){
  const {c,g,w,h} = A.canvas(host, 420, 600); c.style.touchAction = 'none';
  const R = 15, D = R*2, COLSN = 13, COL = ['#FF4539','#F9BF01','#00B451','#64CDF5','#b48cff','#ff8fd0'];
  let st = 'ready', grid, shot, next, cur, aim = -Math.PI/2, score, shotsToDrop, drop, t = 0, pops = [], quiz = false;
  const ncol = () => Math.min(COL.length, A.D(4,5,6));
  const cell = (r, q) => ({x: R + q*D + (r % 2 ? R : 0) + 3, y: R + r*(D-4) + drop*(D-4) + 40});
  const reset = () => { grid = []; drop = 0; for (let r = 0; r < 6; r++) { grid.push([]); for (let q = 0; q < COLSN - (r%2); q++) grid[r][q] = Math.floor(Math.random()*ncol()); } score = 0; shotsToDrop = A.D(9,7,5) + A.U('patience'); cur = Math.floor(Math.random()*ncol()); next = Math.floor(Math.random()*ncol()); shot = null; api.score(0); };
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
    if (st == 'ready') A.overlayText(g, w, h, 'BUBBLE POP', 'Aim with the mouse or ← →, tap / Space to shoot · match 3 to pop');
    if (st == 'over') A.overlayText(g, w, h, 'GAME OVER', (score||0).toLocaleString()+' points · tap to play again'); });
  reset(); st = 'ready';
  return () => { offK(); offL(); };
}});
})();
