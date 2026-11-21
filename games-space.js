// Wilderland Arcade · STAR RANGER — an original alien-wave space shooter.
// Marching rows of space critters, dive-bombing swoopers, breakable asteroid bunkers, power-ups,
// a mini-boss every 5 waves and a big boss every 10 (with boss bars), Learn-mode questions between waves, touch controls.
(function(){
const A = window.Arcade, C = A.C, el = A.el;
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const TAU = Math.PI*2;

A.register('space', { mount(host, api){
  const W = 480, H = 600;
  const wrap = el('div',{width:W+'px',fontFamily:A.font,userSelect:'none',position:'relative'}); host.appendChild(wrap);
  const {c,g} = A.canvas(wrap,W,H); c.style.touchAction = 'none'; c.style.background = '#050a1a';
  const low = () => !!A.lowFx;
  // ---------------- data ----------------
  // Space critters: bloop (basic), zapper (shoots more), shellback (tough), swooper (loves to dive)
  const KIND = {
    bloop:   {hp:1, pts:10, col:'#7be08a', eye:'#121313', shoot:.6},
    zapper:  {hp:1, pts:20, col:'#64CDF5', eye:'#121313', shoot:1.6},
    shell:   {hp:3, pts:40, col:'#F9BF01', eye:'#121313', shoot:.8},
    swooper: {hp:2, pts:30, col:'#EA55AB', eye:'#fff',    shoot:1, dive:2.2},
  };
  const POW = {double:{n:'Double Shot',c:'#64CDF5',t:15,e:'II'}, spread:{n:'Spread Shot',c:'#EA55AB',t:12,e:'≋'}, rapid:{n:'Rapid Fire',c:'#F9BF01',t:12,e:'»'}, shield:{n:'Shield',c:'#D5F367',t:0,e:'◯'}, rescue:{n:'Wing Mate',c:'#ffffff',t:0,e:'✈'}};
  const PKEYS = Object.keys(POW);
  // ---------------- state ----------------
  let state = 'menu', wave = 0, score = 0, lives = 3, ship = {x:W/2, y:H-56, vx:0, inv:0}, wing = false, shield = 0, pw = {double:0, spread:0, rapid:0};
  let aliens = [], bullets = [], ebul = [], parts = [], drops = [], bunkers = [], stars = [], boss = null, fireT = 0, formX = 0, formDir = 1, formY = 0, stepT = 0, diveT = 3, banner = null, shake = 0, combo = 0, comboT = 0, hits = 0, shots = 0, quizOn = false;
  const keys = {}; let touchX = null, touching = false;
  for (let i=0;i<70;i++) stars.push({x:Math.random()*W, y:Math.random()*H, z:.3+Math.random()*1.4});
  const say = (t, s) => banner = {t, s, life:2.4};
  const lives0 = () => A.D(7,5,3) + A.U('life');
  const bulCap = () => Math.min(10, 3 + Math.floor(wave/3)) + (boss ? 6 : 0);   // max enemy shots on screen at once
  // ---------------- waves ----------------
  const makeBunkers = () => { bunkers = []; const n = A.D(4,4,3); for (let b=0;b<n;b++) { const bx = W*(b+1)/(n+1) - 24, by = H-140; const cells = [];
      for (let r=0;r<5;r++) for (let q=0;q<8;q++) { if (r==4 && q>=2 && q<=5) continue; if (r==0 && (q==0||q==7)) continue; cells.push({x:bx+q*6, y:by+r*6, hp:2}); } bunkers.push(cells); } };
  const startWave = () => { wave++; aliens = []; ebul = []; boss = null; formX = 0; formY = 0; formDir = 1; diveT = 2.5; stepT = 0;
    if (wave % 10 == 0) { boss = {kind:'big', n:'Grand Hive Mother', x:W/2, y:110, hp:0, max:0, t:0, phase:1, shootT:1, armT:3, spawnT:5};
      boss.max = boss.hp = Math.round((240 + wave*24) * A.D(.7,1,1.4)); say('WAVE '+wave+' · BOSS', 'The Grand Hive Mother arrives! Hit her glowing core.'); }
    else if (wave % 5 == 0) { boss = {kind:'mini', n:'Saucer Chief', x:W/2, y:90, hp:0, max:0, t:0, vx:90, shootT:1};
      boss.max = boss.hp = Math.round((70 + wave*10) * A.D(.7,1,1.4)); say('WAVE '+wave+' · MINI-BOSS', 'The Saucer Chief is zooming in!'); }
    const rowsN = Math.min(5, 2 + Math.floor(wave/4)), colsN = Math.min(9, 6 + Math.floor(wave/5));
    if (!boss || boss.kind=='mini') { const order = ['shell','zapper','zapper','swooper','bloop','bloop'];
      for (let r=0;r<rowsN;r++) for (let q=0;q<colsN;q++) { const k = order[Math.max(0, order.length - rowsN + r)] || 'bloop', K = KIND[k];
        aliens.push({k, K, hx:q*38 - (colsN-1)*19, hy:60 + r*34 + (boss ? 50 : 0), x:0, y:0, hp:K.hp + (wave>=8 && k!='bloop' ? 1 : 0), dive:null, flap:Math.random()*6}); } }
    if (wave==1 || wave % 4 == 1) makeBunkers();
    if (!boss) say('WAVE '+wave, wave==1 ? '← → or drag to move · Space or hold to fire' : rowsN+' rows of space critters');
    state = 'play'; };
  const nextWave = () => { if (A.learnOn()) { state = 'quiz'; quizOn = true; A.quiz(wrap, 'BONUS ROUND · answer for a power-up', ok => { quizOn = false; try { api.edu && api.edu(ok); } catch(e){} if (ok) { grant(PKEYS[Math.random()*PKEYS.length|0]); score += 100*wave; api.score(score); } startWave(); }); }
    else startWave(); };
  const newGame = r => { wave = r ? r.wave : 0; score = r ? r.score : 0; lives = r ? r.lives : lives0(); ship = {x:W/2, y:H-56, vx:0, inv:2}; wing = !!(r && r.wing); shield = A.U('shield'); pw = {double: A.U('power') ? 20 : 0, spread:0, rapid:0};
    bullets = []; ebul = []; parts = []; drops = []; hits = shots = 0; combo = 0; api.score(score); makeBunkers(); startWave(); };
  // ---------------- helpers ----------------
  const burst = (x, y, col, n) => { n = low() ? Math.min(4, n) : n; for (let i=0;i<n && parts.length < 220;i++) { const a = Math.random()*TAU, s = 40 + Math.random()*170; parts.push({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, t:.6+Math.random()*.4, c:col}); } };
  const grant = k => { if (k=='shield') shield = Math.min(3, shield+1); else if (k=='rescue') { if (wing) { score += 500; } wing = true; } else pw[k] = POW[k].t; say(POW[k].n.toUpperCase(), k=='rescue' ? 'A rescued wing mate flies beside you — double firepower!' : k=='shield' ? 'Blocks one hit' : POW[k].t+' seconds'); A.sfx('win'); };
  const addScore = n => { score += n; api.score(score); };
  const alienPos = a => { if (a.dive) return; a.x = W/2 + formX + a.hx; a.y = a.hy + formY + Math.sin(performance.now()/500 + a.hx)*2; };
  const hitBunker = (b) => { for (const B of bunkers) for (const cell of B) { if (cell.hp <= 0) continue; if (b.x > cell.x-1 && b.x < cell.x+7 && b.y > cell.y-1 && b.y < cell.y+7) { cell.hp--; if (!low()) burst(b.x, b.y, '#9a8a7a', 2); return true; } } return false; };
  const fire = () => { const rate = pw.rapid > 0 ? .11 : .26; if (fireT > 0) return; fireT = rate; shots++;
    const guns = wing ? [-14, 14] : [0];
    guns.forEach(o => { const bx = ship.x + o; if (pw.spread > 0) [-.28,0,.28].forEach(a => bullets.push({x:bx, y:ship.y-16, vx:Math.sin(a)*520, vy:-Math.cos(a)*520}));
      else if (pw.double > 0) { bullets.push({x:bx-6, y:ship.y-14, vx:0, vy:-560}); bullets.push({x:bx+6, y:ship.y-14, vx:0, vy:-560}); }
      else bullets.push({x:bx, y:ship.y-16, vx:0, vy:-560}); });
    A.tone(880, .03, 'square', .02); };
  const killShip = () => { if (ship.inv > 0 || A.immortal) return; if (shield > 0) { shield--; ship.inv = 1.2; burst(ship.x, ship.y, '#D5F367', 14); A.sfx('hit'); return; }
    if (wing) { wing = false; ship.inv = 1.5; burst(ship.x+14, ship.y, '#fff', 18); say('WING MATE DOWN', 'Pick up another ✈ to rescue one'); A.sfx('bad'); return; }
    lives--; ship.inv = 2.5; ebul = []; burst(ship.x, ship.y, '#FF8A3C', 30); shake = .4; A.sfx('bad'); pw = {double:0, spread:0, rapid:0}; combo = 0;
    if (lives <= 0) { state = 'over'; A.sfx('over'); const acc = shots ? hits/shots : 0; const fin = Math.round(score * (1 + Math.min(.5, acc*.5))); stat(api,'spaceWave',wave,'max'); api.over(fin); return; }
    ship.inv = 2.5; };
  const dropPow = (x, y) => { if (Math.random() < A.D(.11,.08,.06) + (combo>=10 ? .05 : 0)) { const k = Math.random() < .12 ? 'rescue' : PKEYS[Math.random()*4|0]; drops.push({x, y, k, vy:90}); } };
  const killAlien = a => { a.dead = 1; hits++; combo++; comboT = 2.2; const bonus = a.dive ? 2 : 1; addScore((a.K.pts * bonus + Math.min(50, combo)) * wave); burst(a.x, a.y, a.K.col, 12); dropPow(a.x, a.y); A.tone(520+Math.random()*200, .05, 'triangle', .03); };
  // ---------------- update ----------------
  const step = dt => {
    if (banner) banner.life -= dt; shake = Math.max(0, shake - dt); ship.inv = Math.max(0, ship.inv - dt); fireT -= dt; comboT -= dt; if (comboT <= 0) combo = 0;
    for (const k in pw) pw[k] = Math.max(0, pw[k] - dt);
    // ship
    const sp = 300; let dir = (keys.ArrowLeft||keys.a ? -1 : 0) + (keys.ArrowRight||keys.d ? 1 : 0);
    if (touchX != null) { const d = touchX - ship.x; dir = Math.abs(d) < 4 ? 0 : Math.sign(d); if (Math.abs(d) < sp*dt) { ship.x = touchX; dir = 0; } }
    ship.x = Math.max(22, Math.min(W-22, ship.x + dir*sp*dt));
    if (keys[' '] || touching) fire();
    // formation march (gets faster as it thins out and as waves go up)
    const alive = aliens.length, speed = (26 + wave*3.5) * A.D(.8,1,1.25) * (1 + (1 - alive/Math.max(1, 60))*1.4);
    let minX = 1e9, maxX = -1e9; for (const a of aliens) if (!a.dive) { minX = Math.min(minX, a.hx); maxX = Math.max(maxX, a.hx); }
    formX += formDir * speed * dt; if (alive && (W/2 + formX + maxX > W-20 || W/2 + formX + minX < 20)) { formDir *= -1; formY += A.D(8,12,16); formX += formDir*speed*dt*2; }
    for (const a of aliens) { a.flap += dt*8; alienPos(a);
      if (a.dive) { const D = a.dive; D.t += dt; const u = D.t / D.dur; // swoop curve, then loop back to the formation
        if (u < 1) { a.x = D.x0 + Math.sin(u*Math.PI*2)*D.amp + (D.tx - D.x0)*u; a.y = D.y0 + (H + 40 - D.y0)*u; if (Math.random() < dt*.6*a.K.shoot && ebul.length < bulCap()) ebul.push({x:a.x, y:a.y+10, vx:(ship.x-a.x)*.25, vy:170+wave*3}); }
        else { a.dive = null; a.hy = Math.max(40, a.hy); } }
      else if (ebul.length < bulCap() && Math.random() < dt * .011 * a.K.shoot * A.D(.5,1,1.4) * (1 + wave*.04)) ebul.push({x:a.x, y:a.y+10, vx:0, vy:160+wave*3});
    }
    // the formation never comes lower than this (reaching the bottom doesn't cost a life any more)
    { let low = 0; for (const a of aliens) if (!a.dive) low = Math.max(low, a.hy + formY); if (low > H-170) formY -= low - (H-170); }
    diveT -= dt; if (diveT <= 0 && aliens.length) { diveT = Math.max(1.8, A.D(5.5,4.2,3) - wave*.05); const n = 1 + Math.floor(Math.random()*Math.min(2, 1 + wave/6));
      for (let i=0;i<n;i++) { const cand = aliens.filter(a => !a.dive); if (!cand.length) break; const a = cand.find(x => x.k=='swooper' && Math.random()<.7) || cand[Math.random()*cand.length|0];
        a.dive = {t:0, dur:A.D(3.4,2.8,2.2), x0:a.x, y0:a.y, tx:ship.x, amp:(60+Math.random()*80)*(Math.random()<.5?-1:1)}; } }
    // boss
    if (boss) { boss.t += dt;
      if (boss.kind=='mini') { boss.x += boss.vx*dt; if (boss.x < 60 || boss.x > W-60) boss.vx *= -1; boss.shootT -= dt; if (boss.shootT <= 0) { boss.shootT = A.D(2,1.6,1.1); for (const a of [-.3,0,.3]) ebul.push({x:boss.x, y:boss.y+18, vx:Math.sin(a)*180, vy:Math.cos(a)*190}); } }
      else { boss.x = W/2 + Math.sin(boss.t*.6)*140; boss.phase = boss.hp < boss.max*.35 ? 3 : boss.hp < boss.max*.7 ? 2 : 1;
        boss.shootT -= dt; if (boss.shootT <= 0) { boss.shootT = [0, 1.8, 1.4, 1.1][boss.phase] * A.D(1.3,1,.8); const n = 3 + boss.phase; for (let i=0;i<n;i++) { const a = -Math.PI/2 + (i-(n-1)/2)*.22 + Math.PI; ebul.push({x:boss.x, y:boss.y+30, vx:Math.sin((i-(n-1)/2)*.22)*200, vy:190}); } }
        boss.armT -= dt; if (boss.armT <= 0) { boss.armT = 4 - boss.phase; ebul.push({x:boss.x-60, y:boss.y+10, vx:(ship.x-boss.x+60)*.5, vy:180, big:1}); ebul.push({x:boss.x+60, y:boss.y+10, vx:(ship.x-boss.x-60)*.5, vy:180, big:1}); }
        boss.spawnT -= dt; if (boss.spawnT <= 0 && aliens.length < 8) { boss.spawnT = 6 - boss.phase; for (let i=0;i<2+boss.phase;i++) { const K = KIND.swooper; aliens.push({k:'swooper', K, hx:0, hy:boss.y, x:boss.x, y:boss.y, hp:2, flap:0, dive:{t:0, dur:2.6, x0:boss.x+(i-1)*30, y0:boss.y+30, tx:ship.x, amp:70*(i%2?1:-1)}}); } } } }
    // player bullets
    for (const b of bullets) { b.x += b.vx*dt; b.y += b.vy*dt; if (b.y < -10 || b.x < -10 || b.x > W+10) { b.dead = 1; continue; }
      if (hitBunker(b)) { b.dead = 1; continue; }
      for (const a of aliens) { if (a.dead) continue; if (Math.abs(b.x-a.x) < 15 && Math.abs(b.y-a.y) < 13) { b.dead = 1; a.hp--; if (a.hp <= 0) killAlien(a); else burst(b.x, b.y, '#fff', 3); break; } }
      if (!b.dead && boss) { const bw = boss.kind=='mini' ? 44 : 90, bh = boss.kind=='mini' ? 18 : 40;
        if (Math.abs(b.x-boss.x) < bw && Math.abs(b.y-boss.y) < bh) { b.dead = 1; const core = boss.kind=='big' && Math.abs(b.x-boss.x) < 22; boss.hp -= core ? 3 : 1; hits++; burst(b.x, b.y, core ? '#F9BF01' : '#ffffff', core ? 5 : 2);
          if (boss.hp <= 0) { const big = boss.kind=='big'; addScore((big ? 5000 : 1500) * Math.ceil(wave/5)); burst(boss.x, boss.y, '#F9BF01', 60); burst(boss.x, boss.y, '#EA55AB', 40); shake = .6; A.sfx('win'); stat(api,'spaceBoss',1,'add');
            say(boss.n.toUpperCase()+' DEFEATED!', '+'+((big ? 5000 : 1500) * Math.ceil(wave/5)).toLocaleString()+' points'); drops.push({x:boss.x, y:boss.y, k:'rescue', vy:90}); drops.push({x:boss.x+30, y:boss.y, k:PKEYS[Math.random()*3|0], vy:80}); boss = null; } } } }
    // enemy bullets
    for (const b of ebul) { b.x += (b.vx||0)*dt; b.y += b.vy*dt; if (b.y > H+10) { b.dead = 1; continue; } if (hitBunker(b)) { b.dead = 1; continue; }
      const r = b.big ? 10 : 5; if (Math.abs(b.x-ship.x) < 14+r*.4 && Math.abs(b.y-ship.y) < 12+r*.4) { b.dead = 1; killShip(); }
      else if (wing && Math.abs(b.x-(ship.x+14)) < 10 && Math.abs(b.y-ship.y) < 10) { b.dead = 1; killShip(); } }
    for (const d of drops) { d.y += d.vy*dt; if (d.y > H+20) d.dead = 1; else if (Math.abs(d.x-ship.x) < 22 && Math.abs(d.y-ship.y) < 20) { d.dead = 1; grant(d.k); } }
    for (const p of parts) { p.x += p.vx*dt; p.y += p.vy*dt; p.vx *= .97; p.vy *= .97; p.t -= dt; }
    for (const s of stars) { s.y += s.z*40*dt*(1+wave*.03); if (s.y > H) { s.y = 0; s.x = Math.random()*W; } }
    // compact
    const keep = arr => { let n = 0; for (const o of arr) if (!o.dead && !(o.t <= 0)) arr[n++] = o; arr.length = n; };
    keep(bullets); keep(ebul); keep(drops); keep(aliens); let n = 0; for (const p of parts) if (p.t > 0) parts[n++] = p; parts.length = n;
    if (state=='play' && !aliens.length && !boss) { stat(api,'spaceWave',wave,'max'); addScore(250*wave); state = 'clear'; setTimeout(()=>{ if (state=='clear') nextWave(); }, 1200); } };
  // ---------------- drawing ----------------
  const drawShip = (x, y, s, ghost) => { g.save(); g.translate(x, y); g.scale(s, s); if (ghost) g.globalAlpha = .55;
    if (!low()) { g.fillStyle = 'rgba(255,138,60,.85)'; g.beginPath(); g.moveTo(-6,14); g.lineTo(0,22+Math.random()*6); g.lineTo(6,14); g.fill(); }
    g.fillStyle = '#00B451'; g.beginPath(); g.moveTo(0,-18); g.lineTo(9,4); g.lineTo(20,12); g.lineTo(20,16); g.lineTo(-20,16); g.lineTo(-20,12); g.lineTo(-9,4); g.closePath(); g.fill();
    g.fillStyle = '#D5F367'; g.beginPath(); g.moveTo(0,-14); g.lineTo(5,2); g.lineTo(-5,2); g.fill();
    g.fillStyle = '#64CDF5'; g.beginPath(); g.ellipse(0,-2,3.5,6,0,0,TAU); g.fill();
    g.fillStyle = '#015640'; g.fillRect(-20,10,6,6); g.fillRect(14,10,6,6); g.restore(); };
  const drawAlien = a => { const K = a.K, f = Math.sin(a.flap) > 0; g.save(); g.translate(a.x, a.y);
    // little space critter: round body, flapping wing-ears, antenna
    g.fillStyle = K.col; g.beginPath(); g.ellipse(0, 0, 13, 10, 0, 0, TAU); g.fill();
    g.beginPath(); if (f) { g.moveTo(-10,-4); g.lineTo(-19,-12); g.lineTo(-13,2); g.moveTo(10,-4); g.lineTo(19,-12); g.lineTo(13,2); } else { g.moveTo(-10,0); g.lineTo(-20,4); g.lineTo(-12,6); g.moveTo(10,0); g.lineTo(20,4); g.lineTo(12,6); } g.fill();
    g.strokeStyle = K.col; g.lineWidth = 2; g.beginPath(); g.moveTo(-4,-9); g.lineTo(-7,-15); g.moveTo(4,-9); g.lineTo(7,-15); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-4.5,-1,3.5,0,TAU); g.arc(4.5,-1,3.5,0,TAU); g.fill(); g.fillStyle = K.eye == '#fff' ? '#5a1040' : '#121313'; g.beginPath(); g.arc(-4,-1,1.6,0,TAU); g.arc(5,-1,1.6,0,TAU); g.fill();
    if (a.k=='shell') { g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0,2,9,.2,Math.PI-.2); g.stroke(); }
    if (a.hp > 1 && !low()) { g.fillStyle = 'rgba(255,255,255,.7)'; for (let i=0;i<a.hp-1;i++) g.fillRect(-6+i*5, 9, 3, 2); }
    g.restore(); };
  const drawBoss = () => { const b = boss; g.save(); g.translate(b.x, b.y);
    if (b.kind == 'mini') { g.fillStyle = '#c9ccd1'; g.beginPath(); g.ellipse(0,4,44,13,0,0,TAU); g.fill(); g.fillStyle = '#64CDF5'; g.beginPath(); g.ellipse(0,-6,20,14,0,Math.PI,0); g.fill(); g.fillStyle = '#7be08a'; g.beginPath(); g.arc(0,-8,7,0,TAU); g.fill();
      for (let i=-3;i<=3;i++) { g.fillStyle = (Math.floor(b.t*6)+i)%2 ? '#F9BF01' : '#FF4539'; g.beginPath(); g.arc(i*12,6,3,0,TAU); g.fill(); } }
    else { const pul = Math.sin(b.t*4)*3; g.fillStyle = '#5B2A86'; g.beginPath(); g.ellipse(0,0,92,40,0,0,TAU); g.fill(); g.fillStyle = '#8a4be0'; g.beginPath(); g.ellipse(0,-10,70,22,0,0,TAU); g.fill();
      for (const sx of [-1,1]) { g.fillStyle = '#EA55AB'; g.beginPath(); g.ellipse(sx*60,14,16,10,0,0,TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(sx*60,14,4,0,TAU); g.fill(); }
      g.fillStyle = b.phase==3 ? '#FF4539' : '#F9BF01'; g.beginPath(); g.arc(0,8,16+pul,0,TAU); g.fill(); if (!low()) { g.fillStyle = 'rgba(249,191,1,.25)'; g.beginPath(); g.arc(0,8,28+pul,0,TAU); g.fill(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-22,-14,6,0,TAU); g.arc(22,-14,6,0,TAU); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(-21,-13,2.6,0,TAU); g.arc(23,-13,2.6,0,TAU); g.fill(); }
    g.restore(); };
  const draw = () => { g.save(); if (shake > 0 && !low()) g.translate((Math.random()-.5)*shake*14, (Math.random()-.5)*shake*14);
    g.fillStyle = '#050a1a'; g.fillRect(-10,-10,W+20,H+20);
    for (const s of stars) { g.fillStyle = s.z > 1.2 ? '#ffffff' : s.z > .8 ? '#9fb8ff' : '#4a5a8a'; g.fillRect(s.x, s.y, s.z > 1 ? 2 : 1, s.z > 1 ? 2 : 1); }
    if (!low()) { g.fillStyle = 'rgba(166,75,224,.08)'; g.beginPath(); g.arc(380,140,120,0,TAU); g.fill(); g.fillStyle = 'rgba(100,205,245,.06)'; g.beginPath(); g.arc(90,330,150,0,TAU); g.fill(); }
    for (const B of bunkers) for (const cell of B) if (cell.hp > 0) { g.fillStyle = cell.hp > 1 ? '#8a7a6a' : '#5a4e44'; g.fillRect(cell.x, cell.y, 6, 6); }
    for (const a of aliens) drawAlien(a);
    if (boss) drawBoss();
    for (const b of bullets) { g.fillStyle = pw.rapid > 0 ? '#F9BF01' : '#D5F367'; g.fillRect(b.x-1.5, b.y-7, 3, 10); }
    for (const b of ebul) { g.fillStyle = b.big ? '#EA55AB' : '#FF8A3C'; g.strokeStyle = '#fff'; g.lineWidth = 1.5; if (b.big) { g.beginPath(); g.arc(b.x,b.y,7,0,TAU); g.fill(); g.stroke(); } else { g.beginPath(); g.arc(b.x, b.y, 4.5, 0, TAU); g.fill(); g.stroke(); } }
    for (const d of drops) { const P = POW[d.k]; g.fillStyle = P.c; g.beginPath(); g.arc(d.x,d.y,11,0,TAU); g.fill(); g.fillStyle = '#121313'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(P.e, d.x, d.y+4); }
    if (state=='play' || state=='clear' || state=='quiz') { if (!(ship.inv > 0 && Math.floor(ship.inv*10)%2)) { drawShip(ship.x, ship.y, 1); if (wing) drawShip(ship.x+30, ship.y+4, .75); }
      if (shield > 0) { g.strokeStyle = 'rgba(213,243,103,'+(.5+.2*Math.sin(performance.now()/120))+')'; g.lineWidth = 2; g.beginPath(); g.arc(ship.x, ship.y, 26, 0, TAU); g.stroke(); } }
    for (const p of parts) { g.globalAlpha = Math.max(0, p.t); g.fillStyle = p.c; g.fillRect(p.x, p.y, 3, 3); } g.globalAlpha = 1;
    g.restore();
    // HUD
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, H-26, W, 26); g.fillStyle = '#fff'; g.font = '700 14px '+A.font; g.textAlign = 'left';
    g.fillText('WAVE '+wave+'   '+score.toLocaleString(), 10, H-8); g.textAlign = 'right'; g.fillText((shield ? '◯×'+shield+'  ' : '')+'♥ '.repeat(Math.max(0,Math.min(lives,6)))+(lives>6?'+'+(lives-6):''), W-10, H-8);
    let px = 10; for (const k of ['double','spread','rapid']) if (pw[k] > 0) { g.fillStyle = POW[k].c; g.fillRect(px, H-36, 70*(pw[k]/POW[k].t), 5); g.fillStyle = '#fff'; g.font = '600 10px '+A.font; g.textAlign = 'left'; g.fillText(POW[k].n, px, H-40); px += 84; }
    if (combo >= 5) { g.fillStyle = C.gold; g.font = '700 16px '+A.font; g.textAlign = 'right'; g.fillText('COMBO ×'+combo, W-10, H-40); }
    if (boss) { const bw = 360, bx = (W-bw)/2; g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(bx-8, 6, bw+16, 34); g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(boss.n.toUpperCase()+(boss.kind=='big' ? ' · PHASE '+boss.phase : ''), W/2, 20);
      g.fillStyle = '#3a1010'; g.fillRect(bx, 25, bw, 9); g.fillStyle = boss.kind=='big' ? '#a64be0' : C.red; g.fillRect(bx, 25, bw*Math.max(0, boss.hp/boss.max), 9); g.strokeStyle = '#fff'; g.strokeRect(bx, 25, bw, 9); }
    if (banner && banner.life > 0) { g.globalAlpha = Math.min(1, banner.life); g.fillStyle = 'rgba(1,86,64,.88)'; g.fillRect(40, H/2-50, W-80, banner.s ? 70 : 44); g.fillStyle = C.lime; g.font = '700 22px '+A.font; g.textAlign = 'center'; g.fillText(banner.t, W/2, H/2-20);
      if (banner.s) { g.fillStyle = '#fff'; g.font = '500 13px '+A.font; g.fillText(banner.s, W/2, H/2+4, W-100); } g.globalAlpha = 1; }
    if (state=='menu') { A.overlayText(g, W, H, 'STAR RANGER', 'Press Space or tap to launch'); g.fillStyle = '#fff'; g.font = '500 13px '+A.font; g.textAlign = 'center';
      ['← → / A D or drag to move · Space or hold to fire', 'Power-ups: II double · ≋ spread · » rapid · ◯ shield · ✈ wing mate', 'Mini-boss every 5 waves · big boss every 10'].forEach((t,i) => g.fillText(t, W/2, H/2+56+i*20));
      if (api.resume && api.resume.wave) { g.fillStyle = C.gold; g.fillText('Saved run: wave '+(api.resume.wave+1)+' — press R or tap “Resume” below', W/2, H/2+124); } }
    if (state=='over') A.overlayText(g, W, H, 'GAME OVER', 'Wave '+wave+' · '+score.toLocaleString()+' points · accuracy '+(shots ? Math.round(hits/shots*100) : 0)+'% · tap to play again'); };
  // ---------------- input ----------------
  const offK = A.keys(e => { const k = e.key.length==1 ? e.key.toLowerCase() : e.key; keys[k] = true;
    if (state=='menu' && (k==' ' || k=='Enter')) { newGame(); return; } if (state=='menu' && k=='r' && api.resume && api.resume.wave) { newGame(api.resume); return; }
    if (state=='over' && (k==' ' || k=='Enter')) { state = 'menu'; } });
  const ku = e => { const k = e.key.length==1 ? e.key.toLowerCase() : e.key; keys[k] = false; }; window.addEventListener('keyup', ku);
  const at = e => { const r = c.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; };
  c.addEventListener('pointerdown', e => { if (state=='menu') { newGame(); return; } if (state=='over') { state = 'menu'; return; } touching = true; touchX = at(e); try { c.setPointerCapture(e.pointerId); } catch(_){} });
  c.addEventListener('pointermove', e => { if (touching) touchX = at(e); });
  const up = () => { touching = false; touchX = null; }; c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  const resumeBtn = el('button', {display:'none', margin:'8px auto 0', fontFamily:A.font, fontWeight:700, fontSize:'14px', border:'none', borderRadius:'999px', padding:'8px 16px', background:C.gold, color:C.forest, cursor:'pointer'}, 'Resume saved run'); wrap.appendChild(resumeBtn);
  resumeBtn.onclick = () => { if (api.resume) newGame(api.resume); };
  const offL = A.loop(dt => { resumeBtn.style.display = state=='menu' && api.resume && api.resume.wave ? 'block' : 'none';
    if (state=='play' || state=='clear') { let left = Math.min(dt, .1); while (left > 0) { const s = Math.min(left, 1/60); step(s); left -= s; } } draw(); });
  api.snap && api.snap(() => (state=='play' || state=='clear') && wave > 1 ? {wave: wave-1, score, lives, wing} : null);
  A._space = {get: () => ({state, wave, score, lives, shots, hits, aliens: aliens.length, boss: boss ? {n:boss.n, hp:boss.hp} : null, wing, shield, pw:{...pw}}), newGame, kill: () => { aliens.forEach(a => a.dead = 1); }, hurtBoss: n => { if (boss) boss.hp = Math.min(boss.hp, n); }, jump: w => { wave = w - 1; startWave(); }};
  return () => { offK(); offL(); window.removeEventListener('keyup', ku); A._space = null; };
}});
})();
