(function(){
const A = window.Arcade, C = A.C, el = A.el, {splash, choice} = A.ui;
const rrect = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const edu = (api,ok) => { try { api.edu && api.edu(ok); } catch(e){} };
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const TOPIC = () => ({add:'ADDITION',sub:'SUBTRACTION',mult:'MULTIPLICATION',div:'DIVISION',skip:'SKIP COUNTING',spell:'SPELLING',multi:'TWO-STEP MATH',mixed:'MIXED'}[A.edu.topic]||'MATH');

// ================= FLAPPER MATH =================
A.flapMath = (host, api) => {
  const {c,g,w,h} = A.canvas(host), TOPB = 58, GROUND = h-30, G = A.D(104,92,82), SP = A.D(92,108,124), GAPX = A.D(300,270,250);
  const bands = [0,1,2].map(i=>TOPB + (GROUND-TOPB)/3*(i+.5));
  let y, vy, cols, score, state='ready', resumed=false, deadMsg='', deadSub='';
  const addCol = x => cols.push({x, p:A.problem(), entered:0, band:-1, ok:0, done:0});
  const reset = () => { y = bands[1]; vy = 0; cols = []; score = 0; resumed = false; addCol(w+60); api.score(0); };
  reset();
  const R = api.resume; if (R && R.edu && R.cols) { y = R.y; cols = R.cols; score = R.score; api.score(score); resumed = true; }
  const die = (m,sub) => { if (state!='play') return; if (A.immortal) { if (y > GROUND-BR-1) { y = GROUND-BR-2; vy = -290; } cols.forEach(cl=>{ if (cl.entered && !cl.done) { cl.ok = 1; cl.band = -2; } }); return; } state = 'dead'; deadMsg = m; deadSub = sub||''; A.sfx('over'); api.over(score); };
  const flap = () => { if (state=='dead') { reset(); state = 'ready'; return; } state = 'play'; vy = -290; A.sfx('flip'); };
  const offK = A.keys(e=>{ if (e.key==' ' || e.key=='ArrowUp') flap(); }); c.addEventListener('mousedown', flap);
  const BX = 100, BR = 13, PW = 46;
  const offL = A.loop(dt=>{
    if (state=='play') { vy += 820*dt; y += vy*dt;
      cols.forEach(cl=>cl.x -= SP*dt); const last = cols[cols.length-1]; if (last.x < w-GAPX) addCol(last.x+GAPX);
      for (const cl of cols) { if (cl.done) continue;
        const over = cl.x < BX+BR && cl.x+PW > BX-BR;
        if (over) { const bi = bands.findIndex(b=>Math.abs(y-b) < G/2-BR+2);
          if (!cl.entered) { cl.entered = 1; cl.band = bi; if (bi<0) { die('CRASHED','Aim for the gaps'); break; }
            if (cl.p.choices[bi]!==cl.p.a) { edu(api,false); die('WRONG ANSWER', A.solved(cl.p)+' · Space to try again'); break; } cl.ok = 1; }
          else if (bi!==cl.band) { die('CRASHED','Stay in your gap'); break; } }
        if (cl.ok && cl.x+PW < BX-BR) { cl.done = 1; score++; api.score(score); edu(api,true); A.sfx('point'); } }
      cols = cols.filter(cl=>cl.x > -70);
      if (y > GROUND-BR) die('GROUNDED','Keep flapping'); if (y < TOPB+BR) { y = TOPB+BR; vy = Math.max(vy,0); } }
    g.fillStyle = C.sky; g.fillRect(0,0,w,h);
    g.fillStyle = C.forest; g.beginPath(); g.moveTo(0,h-30); [[80,h-110],[170,h-60],[260,h-150],[360,h-70],[440,h-120],[480,h-80]].forEach(p=>g.lineTo(...p)); g.lineTo(w,h); g.lineTo(0,h); g.fill();
    cols.forEach(cl=>{ const segs = [[TOPB, bands[0]-G/2],[bands[0]+G/2, bands[1]-G/2],[bands[1]+G/2, bands[2]-G/2],[bands[2]+G/2, GROUND]];
      g.fillStyle = C.green; segs.forEach(([a,b])=>{ rrect(g,cl.x,a,PW,b-a,6); g.fill(); });
      g.fillStyle = '#028a4e'; segs.forEach(([a,b])=>{ g.fillRect(cl.x-4,a,PW+8,6); g.fillRect(cl.x-4,b-6,PW+8,6); });
      cl.p.choices.forEach((v,i)=>{ const cy = bands[i], show = cl.done; g.fillStyle = show ? (v===cl.p.a ? C.lime : 'rgba(255,255,255,.5)') : '#ffffff';
        g.beginPath(); g.arc(cl.x+PW/2, cy, 21, 0, 7); g.fill(); g.fillStyle = C.forest; g.font = '700 '+(String(v).length>4?12:String(v).length>3?14:String(v).length>2?16:20)+'px '+A.font; g.textAlign = 'center'; g.fillText(v, cl.x+PW/2, cy+7); }); });
    g.save(); g.translate(BX,y); g.rotate(Math.max(-.4,Math.min(.6,vy/500)));
    g.fillStyle = C.gold; g.beginPath(); g.arc(0,0,BR,0,7); g.fill(); g.fillStyle = C.orange; g.fillRect(9,-3,10,6); g.fillStyle = C.ink; g.beginPath(); g.arc(4,-5,3,0,7); g.fill(); g.restore();
    g.fillStyle = C.forest; g.fillRect(0,0,w,TOPB);
    const next = cols.find(cl=>!cl.done);
    g.fillStyle = C.lime; g.font = '700 11px '+A.font; g.textAlign = 'left'; g.fillText('LEARN MODE · '+TOPIC(),14,20);
    g.fillStyle = '#fff'; g.font = '700 28px '+A.font; g.fillText(next ? A.qText(next.p) : '', 14, 48);
    g.textAlign = 'right'; g.fillStyle = C.lime; g.font = '700 30px '+A.font; g.fillText(score, w-14, 44);
    if (state=='ready') A.overlayText(g,w,h,resumed?'PAUSED':'FLAPPER MATH',resumed?score+' right so far · flap to continue':'Fly through the right answer · Space or tap');
    if (state=='dead') A.overlayText(g,w,h,deadMsg,deadSub||('Score '+score+' · Space to reset'));
  });
  api.snap && api.snap(()=> state=='play' || (state=='ready' && resumed) ? {edu:1, y, score, cols:cols.map(cl=>({...cl}))} : null);
  return () => { offK(); offL(); c.removeEventListener('mousedown', flap); };
};

// ================= SNAKE MATH =================
A.snakeMath = (host, api) => {
  const {g,w,h} = A.canvas(host), N = 16, S = w/N, TOPR = 2;
  let snake, dir, nd, apples, p, score, lives, t, state='ready', resumed=false, flash=0;
  const free = () => { let x, y, k = 0; do { x = Math.random()*N|0; y = TOPR + (Math.random()*(N-TOPR)|0); k++; } while (k<500 && (snake.some(s=>s.x==x&&s.y==y) || apples.some(a=>a.x==x&&a.y==y) || Math.abs(x-snake[0].x)+Math.abs(y-snake[0].y)<3)); return {x,y}; };
  const newQ = () => { p = A.problem(); apples = []; p.choices.forEach(v=>{ const f = free(); apples.push({...f, v}); }); };
  const body = () => { snake = [{x:8,y:9},{x:7,y:9},{x:6,y:9}]; dir = {x:1,y:0}; nd = dir; };
  const reset = () => { body(); score = 0; lives = A.D(5,3,2); t = 0; resumed = false; apples = []; newQ(); api.score(0); };
  reset();
  const R = api.resume; if (R && R.edu && R.snake) { snake = R.snake; dir = R.dir; nd = dir; score = R.score; lives = R.lives; p = R.p; apples = R.apples; api.score(score); resumed = true; }
  const hurt = msg => { if (!A.immortal) lives--; flash = .35; A.sfx('bad'); if (lives<=0) { state = 'dead'; A.sfx('over'); api.over(score); } return msg; };
  const offK = A.keys(e=>{ const m = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];
    if (state!='play' && (e.key==' ' || m)) { if (state=='dead') reset(); state = 'play'; }
    if (m && (m[0]!=-dir.x || m[1]!=-dir.y)) nd = {x:m[0], y:m[1]}; });
  const offL = A.loop(dt=>{ flash = Math.max(0, flash-dt);
    if (state=='play') { t += dt; const sp = Math.max(.1, A.D(.2,.16,.13) - score*.002);
      while (t>sp) { t -= sp; dir = nd; const hd = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
        if (hd.x<0 || hd.y<TOPR || hd.x>=N || hd.y>=N || snake.some(s=>s.x==hd.x&&s.y==hd.y)) { hurt(); if (state=='play') body(); break; }
        snake.unshift(hd); const ai = apples.findIndex(a=>a.x==hd.x&&a.y==hd.y);
        if (ai>=0) { if (apples[ai].v===p.a) { score++; api.score(score); edu(api,true); A.sfx('point'); newQ(); }
          else { edu(api,false); hurt(); snake.pop(); if (snake.length>3) snake.pop(); if (state=='play') newQ(); } }
        else snake.pop(); } }
    g.fillStyle = C.forest; g.fillRect(0,0,w,h);
    g.fillStyle = 'rgba(255,255,255,.04)'; for (let i=0;i<N;i++) for (let j=TOPR;j<N;j++) if ((i+j)%2) g.fillRect(i*S,j*S,S,S);
    apples.forEach(a=>{ g.fillStyle = C.pink; g.beginPath(); g.arc(a.x*S+S/2, a.y*S+S/2, S/2-1, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 '+(String(a.v).length>3?9:String(a.v).length>2?11:14)+'px '+A.font; g.textAlign = 'center'; g.fillText(a.v, a.x*S+S/2, a.y*S+S/2+5); });
    snake.forEach((s,i)=>{ g.fillStyle = i?C.green:C.lime; g.fillRect(s.x*S+1, s.y*S+1, S-2, S-2); });
    g.fillStyle = C.ink; g.fillRect(0,0,w,TOPR*S);
    g.fillStyle = C.lime; g.font = '700 11px '+A.font; g.textAlign = 'left'; g.fillText('LEARN MODE · '+TOPIC()+' · EAT THE ANSWER',12,18);
    g.fillStyle = '#fff'; g.font = '700 26px '+A.font; g.fillText(A.qText(p), 12, 50);
    g.textAlign = 'right'; g.fillStyle = '#ffd0e8'; g.font = '700 16px '+A.font; g.fillText('♥'.repeat(Math.max(0,lives))+'   '+score+' right', w-12, 42);
    if (flash>0) { g.fillStyle = 'rgba(255,69,57,'+flash+')'; g.fillRect(0,0,w,h); }
    if (state=='ready') A.overlayText(g,w,h,resumed?'PAUSED':'SNAKE MATH',resumed?'Space or an arrow to continue':'Eat the apple with the right answer · Space');
    if (state=='dead') A.overlayText(g,w,h,'OUT OF LIVES',score+' right · last one: '+A.solved(p));
  });
  api.snap && api.snap(()=> state=='dead' || (state=='ready' && !resumed) ? null : {edu:1, snake, dir, score, lives, p, apples});
  return () => { offK(); offL(); };
};

// ================= TRACE & WRITE (handwriting) =================
// Scoring: points for covering the letter, MINUS points for ink outside the lines.
// Camera mode: write on paper, hold it up, the camera reads it and scores it the same way.
A.register('trace', { mount(host, api){
  const wrap = el('div',{width:'480px',fontFamily:A.font,userSelect:'none',background:C.forest,borderRadius:'12px',overflow:'hidden',position:'relative'}); host.appendChild(wrap);
  const top = el('div',{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',padding:'8px 10px',flexWrap:'wrap'}); wrap.appendChild(top);
  const setBox = el('div',{display:'flex',background:'rgba(255,255,255,.15)',borderRadius:'999px',padding:'3px',gap:'2px'}); top.appendChild(setBox);
  const info = el('div',{color:'#fff',fontWeight:700,fontSize:'14px'}); top.appendChild(info);
  const {c,g,w,h} = A.canvas(wrap,480,370); c.style.borderRadius = '0'; c.style.touchAction = 'none'; c.style.cursor = 'crosshair';
  const bot = el('div',{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1.3fr',gap:'8px',padding:'8px 10px'}); wrap.appendChild(bot);
  const mkb = (t,fn,main) => { const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'15px',border:'none',borderRadius:'999px',padding:'11px 6px',cursor:'pointer',background:main?C.lime:'rgba(255,255,255,.18)',color:main?C.forest:'#fff',whiteSpace:'nowrap'},t); x.onclick = () => { fn(); x.blur(); }; return x; };
  const SETS = {upper:['ABC','ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')], lower:['abc','abcdefghijklmnopqrstuvwxyz'.split('')], digits:['123','0123456789'.split('')], words:['Words',['cat','dog','sun','map','owl','fox','bee','elk','pine','moss','lake','fern','bug','hat','tree','fish']]};
  let set = 'upper', round = [], idx = 0, strokes = [], cur = null, score = 0, stars = [], guide = null, feedback = null, done = false, live = true, adv = null;
  let cam = false, stream = null, video = null, camMsg = '', countdown = 0, cdTimer = null, inkC = null, badC = null;
  const segBtns = {};
  Object.entries(SETS).forEach(([k,[label]])=>{ const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'13px',border:'none',borderRadius:'999px',padding:'5px 11px',cursor:'pointer'},label); x.onclick = () => { if (set==k) return; set = k; paintSeg(); newRound(); A.sfx('blip'); }; segBtns[k] = x; setBox.appendChild(x); });
  const paintSeg = () => Object.entries(segBtns).forEach(([k,x])=>{ x.style.background = set==k ? C.lime : 'transparent'; x.style.color = set==k ? C.forest : '#fff'; });
  const fontSize = t => t.length>1 ? Math.min(230, 430/(t.length*.62)) : 250;
  const BASE = 290, CELL = 4, GW = Math.ceil(w/CELL), GH = Math.ceil(h/CELL), TOL = 9, INK = 12;
  const mk = () => { const o = document.createElement('canvas'); o.width = w; o.height = h; return o; };
  const toGrid = (o, thr) => { const s = document.createElement('canvas'); s.width = GW; s.height = GH; const x = s.getContext('2d'); x.drawImage(o,0,0,GW,GH);
    const d = x.getImageData(0,0,GW,GH).data, m = new Uint8Array(GW*GH); for (let i=0;i<m.length;i++) m[i] = d[i*4+3] > thr ? 1 : 0; return m; };
  const dil = (m,r) => { const out = new Uint8Array(m.length); for (let y=0;y<GH;y++) for (let x=0;x<GW;x++) if (m[y*GW+x]) for (let dy=-r;dy<=r;dy++) for (let dx=-r;dx<=r;dx++) { const X = x+dx, Y = y+dy; if (X>=0&&Y>=0&&X<GW&&Y<GH) out[Y*GW+X] = 1; } return out; };
  const makeGuide = t => { const fs = fontSize(t), font = '700 '+fs+'px '+A.font;
    const o = mk(), x = o.getContext('2d'); x.font = font; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#000'; x.fillText(t, w/2, BASE);
    const tc = mk(), y = tc.getContext('2d'); y.font = font; y.textAlign = 'center'; y.textBaseline = 'alphabetic'; y.fillStyle = '#000'; y.strokeStyle = '#000'; y.lineWidth = TOL*2; y.lineJoin = 'round'; y.fillText(t, w/2, BASE); y.strokeText(t, w/2, BASE);
    const G = toGrid(o,140), T = toGrid(tc,40);
    let x0 = GW, x1 = 0, y0 = GH, y1 = 0; for (let i=0;i<G.length;i++) if (G[i]) { const gx = i%GW, gy = i/GW|0; if (gx<x0) x0 = gx; if (gx>x1) x1 = gx; if (gy<y0) y0 = gy; if (gy>y1) y1 = gy; }
    return {t, fs, G, T, tc, box:{x:x0*CELL, y:y0*CELL, w:(x1-x0+1)*CELL, h:(y1-y0+1)*CELL}}; };
  const strokesCanvas = () => { const o = mk(), x = o.getContext('2d'); x.strokeStyle = C.forest; x.lineWidth = INK; x.lineCap = 'round'; x.lineJoin = 'round';
    strokes.forEach(s=>{ x.beginPath(); s.forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y)); if (s.length==1) x.lineTo(s[0].x+.1,s[0].y); x.stroke(); }); return o; };
  // red copy of the ink that sits outside the allowed band
  const outsideOf = ink => { const o = mk(), x = o.getContext('2d'); x.drawImage(ink,0,0); x.globalCompositeOperation = 'source-in'; x.fillStyle = C.red; x.fillRect(0,0,w,h); x.globalCompositeOperation = 'destination-out'; x.drawImage(guide.tc,0,0); return o; };
  const grade = (ink, lenient) => { const I = toGrid(ink,60), ID = dil(I,2);
    let gN = 0, cov = 0, iN = 0, out = 0;
    for (let i=0;i<I.length;i++) { if (guide.G[i]) { gN++; if (ID[i]) cov++; } if (I[i]) { iN++; if (!guide.T[i]) out++; } }
    const covF = cov/Math.max(1,gN), outF = out/Math.max(1,iN), q = Math.max(0, covF - outF*1.2), th = lenient ? [.74,.58,.42] : [.8,.62,.45];
    const st = q>=th[0] ? 3 : q>=th[1] ? 2 : q>=th[2] ? 1 : 0;
    return {st, q, cov:Math.round(covF*100), out:Math.round(outF*120)}; };
  const load = () => { strokes = []; cur = null; feedback = null; inkC = null; badC = null; camMsg = ''; guide = makeGuide(round[idx]); paintInfo(); };
  const paintInfo = () => { info.textContent = (done ? 'Round done' : (idx+1)+' / '+round.length) + '  ·  ' + '★'.repeat(stars.reduce((a,b)=>a+b,0)); };
  const newRound = () => { clearTimeout(adv); const pool = SETS[set][1].slice().sort(()=>Math.random()-.5); round = pool.slice(0, set=='digits'?10:8); idx = 0; score = 0; stars = []; done = false; api.score(0); load(); };
  const award = (r) => { stars.push(r.st); const pts = Math.round(r.q*200) + r.st*50; score += pts; api.score(score); edu(api, r.st>=2); if (r.st==3) stat(api,'traceStars',3);
    feedback = {s:r.st, msg:['Try that one again next time','Good start','Nice writing!','Perfect!'][r.st], cov:r.cov, out:r.out, pts};
    A.sfx(r.st>=2?'point':'bad'); paintInfo();
    adv = setTimeout(()=>{ if (!live) return; if (idx+1 < round.length) { idx++; load(); } else finishRound(); }, 2200); };
  const flash = m => { feedback = {s:-1,msg:m}; setTimeout(()=>{ if (feedback && feedback.s<0) feedback = null; },1600); };
  const check = () => { if (done || feedback) return; if (cam) return snap(); if (!strokes.length) return flash('Trace the letter first');
    inkC = strokesCanvas(); badC = outsideOf(inkC); award(grade(inkC,false)); };
  const finishRound = () => { done = true; const total = stars.reduce((a,b)=>a+b,0); stat(api,'traceRound',total); if (total >= round.length*3) api.perfect && api.perfect(); paintInfo(); A.sfx('win'); api.over(score);
    choice(wrap, 'ROUND DONE', total+' stars · '+score+' points', [['New round',()=>{ newRound(); }]]); };

  // ---------- camera ----------
  const stopCam = () => { if (stream) stream.getTracks().forEach(t=>t.stop()); stream = null; if (video) { video.srcObject = null; } clearInterval(cdTimer); countdown = 0; };
  const startCam = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { flash('No camera on this device or browser'); return; }
    camMsg = 'Starting camera…'; cam = true; paintBtns();
    try { stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}, width:{ideal:1280}, height:{ideal:720}}, audio:false}); }
    catch(e) { cam = false; paintBtns(); flash(e && e.name=='NotAllowedError' ? 'Camera permission was blocked' : 'Camera not available here — try arcade.wilderland.academy'); return; }
    if (!live || !cam) { stopCam(); return; }
    video = video || Object.assign(document.createElement('video'), {muted:true, playsInline:true}); video.setAttribute('playsinline',''); video.srcObject = stream;
    try { await video.play(); } catch(e){}
    camMsg = ''; };
  const FR = {x:90, y:30, w:300, h:300};  // on-screen frame the paper should fill
  const vidRect = () => { const vw = video.videoWidth, vh = video.videoHeight, s = Math.max(w/vw, h/vh); return {s, ox:(w-vw*s)/2, oy:(h-vh*s)/2}; };
  const snap = () => { if (!video || !video.videoWidth || countdown) return; countdown = 3; A.sfx('blip');
    cdTimer = setInterval(()=>{ countdown--; if (countdown>0) { A.sfx('blip'); return; } clearInterval(cdTimer); capture(); }, 800); };
  const capture = () => {
    const {s, ox, oy} = vidRect(), sx = (FR.x-ox)/s, sy = (FR.y-oy)/s, sw = FR.w/s, sh = FR.h/s, N = 220;
    const cc = document.createElement('canvas'); cc.width = N; cc.height = N; const x = cc.getContext('2d', {willReadFrequently:true}); x.drawImage(video, sx, sy, sw, sh, 0, 0, N, N);
    const id = x.getImageData(0,0,N,N), d = id.data, gray = new Float32Array(N*N);
    for (let i=0;i<N*N;i++) gray[i] = d[i*4]*.3 + d[i*4+1]*.59 + d[i*4+2]*.11;
    // local background (box blur) so shadows on the paper don't count as ink
    const R = 14, bg = new Float32Array(N*N), sat = new Float64Array((N+1)*(N+1));
    for (let y=0;y<N;y++) { let row = 0; for (let xx=0;xx<N;xx++) { row += gray[y*N+xx]; sat[(y+1)*(N+1)+xx+1] = sat[y*(N+1)+xx+1] + row; } }
    for (let y=0;y<N;y++) for (let xx=0;xx<N;xx++) { const a = Math.max(0,xx-R), b = Math.max(0,y-R), e = Math.min(N,xx+R+1), f = Math.min(N,y+R+1);
      bg[y*N+xx] = (sat[f*(N+1)+e] - sat[b*(N+1)+e] - sat[f*(N+1)+a] + sat[b*(N+1)+a]) / ((e-a)*(f-b)); }
    const dark = new Uint8Array(N*N), M = 8; let cnt = 0;
    for (let y=M;y<N-M;y++) for (let xx=M;xx<N-M;xx++) { const i = y*N+xx; if (bg[i]-gray[i] > Math.max(18, bg[i]*.16)) { dark[i] = 1; cnt++; } }
    // drop specks
    const clean = new Uint8Array(N*N); let x0 = N, x1 = 0, y0 = N, y1 = 0, n = 0;
    for (let y=1;y<N-1;y++) for (let xx=1;xx<N-1;xx++) { const i = y*N+xx; if (!dark[i]) continue; let k = 0; for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) k += dark[i+dy*N+dx]; if (k>=4) { clean[i] = 1; n++; if (xx<x0) x0 = xx; if (xx>x1) x1 = xx; if (y<y0) y0 = y; if (y>y1) y1 = y; } }
    if (n < 40 || (x1-x0) < 14 && (y1-y0) < 14) { flash('I couldn’t see any writing — use a dark marker and fill the frame'); return; }
    if (n > N*N*.35) { flash('Too dark — hold plain white paper in the frame'); return; }
    const ic = document.createElement('canvas'); ic.width = N; ic.height = N; const ix = ic.getContext('2d'), od = ix.createImageData(N,N);
    for (let i=0;i<N*N;i++) if (clean[i]) { od.data[i*4] = 1; od.data[i*4+1] = 86; od.data[i*4+2] = 64; od.data[i*4+3] = 255; }
    ix.putImageData(od,0,0);
    // fit the writing onto the guide letter
    const bw = x1-x0+1, bh = y1-y0+1, B = guide.box, k = Math.min(B.w/bw, B.h/bh), dw = bw*k, dh = bh*k, dx0 = B.x + (B.w-dw)/2, dy0 = B.y + (B.h-dh)/2;
    inkC = mk(); const ox2 = inkC.getContext('2d'); ox2.imageSmoothingEnabled = true;
    const thick = Math.max(1, Math.min(5, Math.round(INK/2 - k*1.2)));
    for (let a=0;a<8;a++) ox2.drawImage(ic, x0, y0, bw, bh, dx0+Math.cos(a*Math.PI/4)*thick, dy0+Math.sin(a*Math.PI/4)*thick, dw, dh);
    ox2.drawImage(ic, x0, y0, bw, bh, dx0, dy0, dw, dh);
    badC = outsideOf(inkC); A.sfx('flip'); award(grade(inkC,true)); };

  const btns = {};
  const paintBtns = () => { bot.innerHTML = '';
    if (cam) bot.append(btns.exit, btns.skip, btns.flip, btns.snap); else bot.append(btns.clear, btns.skip, btns.cam, btns.check); };
  btns.clear = mkb('Clear',()=>{ if (!feedback) { strokes = []; A.sfx('flip'); } });
  btns.skip = mkb('Skip',()=>{ if (done || feedback || countdown) return; stars.push(0); edu(api,false); if (idx+1<round.length) { idx++; load(); } else finishRound(); });
  btns.cam = mkb('📷 Camera',()=>{ if (!feedback) startCam(); });
  btns.check = mkb('Check ✓',check,true);
  btns.exit = mkb('✏️ Trace',()=>{ cam = false; stopCam(); paintBtns(); });
  btns.flip = mkb('🔄 Flip',async ()=>{ if (!stream) return; const f = (stream.getVideoTracks()[0].getSettings().facingMode=='user') ? 'environment' : 'user'; stopCam();
    try { stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:f},audio:false}); video.srcObject = stream; await video.play(); } catch(e) { flash('Only one camera here'); startCam(); } });
  btns.snap = mkb('📸 Snap',check,true);
  paintBtns();

  const pt = e => { const r = c.getBoundingClientRect(); return {x:(e.clientX-r.left)*w/r.width, y:(e.clientY-r.top)*h/r.height}; };
  c.addEventListener('pointerdown', e=>{ if (done || feedback || cam) return; e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch(_){} cur = [pt(e)]; strokes.push(cur); });
  c.addEventListener('pointermove', e=>{ if (!cur) return; e.preventDefault(); const p = pt(e), l = cur[cur.length-1]; if (Math.hypot(p.x-l.x,p.y-l.y)>2) cur.push(p); });
  const up = () => { cur = null; }; c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  const offK = A.keys(e=>{ if (e.key=='Enter' || e.key==' ') check(); else if ((e.key=='Backspace' || e.key=='c') && !cam) strokes = []; else return false; });

  const drawGuide = (alpha) => { const fs = guide.fs; g.save(); g.globalAlpha = alpha;
    g.strokeStyle = '#9fb8d6'; g.lineWidth = 2; [BASE-fs*.72, BASE].forEach(y=>{ g.beginPath(); g.moveTo(16,y); g.lineTo(w-16,y); g.stroke(); });
    g.setLineDash([10,8]); g.strokeStyle = '#c9a3c9'; g.beginPath(); g.moveTo(16,BASE-fs*.5); g.lineTo(w-16,BASE-fs*.5); g.stroke(); g.setLineDash([]);
    g.font = '700 '+fs+'px '+A.font; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    // the allowed band, faint, so kids can see where "inside the lines" ends
    g.strokeStyle = feedback && feedback.s>=0 ? 'rgba(0,180,81,.16)' : 'rgba(1,86,64,.07)'; g.lineWidth = TOL*2; g.lineJoin = 'round'; g.strokeText(guide.t, w/2, BASE);
    g.fillStyle = feedback && feedback.s>=0 ? '#cfe9d6' : '#e3e0d0'; g.fillText(guide.t, w/2, BASE);
    g.setLineDash([3,7]); g.strokeStyle = '#9a9a9b'; g.lineWidth = 2; g.strokeText(guide.t, w/2, BASE); g.setLineDash([]); g.restore(); };
  const draw = () => { g.fillStyle = '#fbf8ec'; g.fillRect(0,0,w,h);
    const camLive = cam && !feedback && video && video.videoWidth;
    if (camLive) { const {s, ox, oy} = vidRect(); g.drawImage(video, ox, oy, video.videoWidth*s, video.videoHeight*s);
      g.fillStyle = 'rgba(1,86,64,.55)'; g.fillRect(0,0,w,FR.y); g.fillRect(0,FR.y+FR.h,w,h-FR.y-FR.h); g.fillRect(0,FR.y,FR.x,FR.h); g.fillRect(FR.x+FR.w,FR.y,w-FR.x-FR.w,FR.h);
      g.strokeStyle = C.lime; g.lineWidth = 4; rrect(g,FR.x,FR.y,FR.w,FR.h,14); g.stroke();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '700 15px '+A.font; g.fillText('Write  “'+guide.t+'”  big on paper · fill the frame', w/2, 22);
      g.font = '700 50px '+A.font; g.textAlign = 'left'; g.fillStyle = C.lime; g.fillText(guide.t.length>3?'':guide.t, 14, 80);
      g.textAlign = 'center'; g.font = '500 13px '+A.font; g.fillStyle = '#fff'; g.fillText('Dark marker on white paper works best · tap Snap', w/2, h-10);
      if (countdown) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(w/2,h/2,52,0,7); g.fill(); g.fillStyle = '#fff'; g.font = '700 64px '+A.font; g.textBaseline = 'middle'; g.fillText(countdown, w/2, h/2+2); g.textBaseline = 'alphabetic'; } }
    else if (cam && !feedback) { drawGuide(.5); g.fillStyle = C.forest; g.textAlign = 'center'; g.font = '700 16px '+A.font; g.fillText(camMsg || 'Waiting for the camera…', w/2, 40); }
    else if (guide) drawGuide(1);
    if (!camLive) {
      if (inkC) { g.drawImage(inkC,0,0,w,h); if (badC) g.drawImage(badC,0,0,w,h); }
      else if (!cam) { g.strokeStyle = C.forest; g.lineWidth = INK; g.lineCap = 'round'; g.lineJoin = 'round';
        strokes.forEach(s=>{ g.beginPath(); s.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); if (s.length==1) g.lineTo(s[0].x+.1,s[0].y); g.stroke(); }); }
      if (!cam && !strokes.length && !feedback) { g.fillStyle = '#4a4a4a'; g.font = '500 14px '+A.font; g.textAlign = 'center'; g.fillText('Trace inside the grey shape · ink outside the lines costs points', w/2, h-14); } }
    if (feedback) { const big = feedback.s>=0, by = big ? h-74 : h-58; g.fillStyle = 'rgba(1,86,64,.93)'; rrect(g,40,by,400,big?66:46,16); g.fill(); g.textAlign = 'center';
      if (big) { g.font = '700 22px '+A.font; const st = '★'.repeat(feedback.s)+'☆'.repeat(3-feedback.s), msg = '  '+feedback.msg+'  +'+feedback.pts, sw = g.measureText(st).width; g.font = '700 16px '+A.font; const mw = g.measureText(msg).width, x0 = w/2-(sw+mw)/2;
        g.textAlign = 'left'; g.font = '700 22px '+A.font; g.fillStyle = C.gold; g.fillText(st, x0, by+28); g.font = '700 16px '+A.font; g.fillStyle = '#fff'; g.fillText(msg, x0+sw, by+27);
        g.textAlign = 'center'; g.font = '600 14px '+A.font; g.fillStyle = C.lime; g.fillText('Covered '+feedback.cov+'%', w/2-80, by+52); g.fillStyle = feedback.out>0 ? '#ff9a8a' : C.lime; g.fillText('Outside the lines −'+feedback.out, w/2+70, by+52); }
      else { g.fillStyle = '#fff'; g.font = '700 15px '+A.font; g.fillText(feedback.msg, w/2, by+29); } } };
  const offL = A.loop(draw);
  paintSeg();
  const RS = api.resume;
  if (RS && RS.round && RS.idx < RS.round.length) { set = RS.set; paintSeg(); round = RS.round; idx = RS.idx; score = RS.score; stars = RS.stars; api.score(score); load(); }
  else newRound();
  api.snap && api.snap(()=> !done && (idx>0 || stars.length) ? {set, round, idx: feedback ? Math.min(idx+1, round.length) : idx, score, stars} : null);
  return () => { live = false; clearTimeout(adv); stopCam(); offK(); offL(); };
}});

// ================= ROOT OUT THE CORRUPTION (invasive-species tower stacker) =================
const SPECIES = [
  // natives
  {n:'Quaking Aspen',k:'tree',inv:0,c:'#9fe07a',f:'An aspen grove is often one living thing — the trees share a single root system. Utah’s “Pando” clone covers about 106 acres.'},
  {n:'Blue Columbine',k:'flower',inv:0,c:'#a9c8ff',f:'Colorado’s state flower since 1899. Its long spurs hold nectar for hummingbirds and long-tongued moths.'},
  {n:'Ponderosa Pine',k:'tree',inv:0,c:'#00B451',f:'Thick, plated bark lets grown ponderosas survive low-intensity wildfires. Some people say the bark smells like vanilla.'},
  {n:'Big Sagebrush',k:'grass',inv:0,c:'#c7d9b8',f:'Greater sage-grouse depend on sagebrush — in winter it is almost all they eat.'},
  {n:'Blue Grama',k:'grass',inv:0,c:'#D5F367',f:'Colorado’s state grass. Its curved seed heads look like tiny eyebrows, and it survives drought by going dormant.'},
  {n:'Showy Milkweed',k:'flower',inv:0,c:'#FBB99D',f:'Monarch caterpillars eat only milkweed, and its toxins make them taste bad to birds.'},
  {n:'Greenback Cutthroat',k:'fish',inv:0,c:'#64CDF5',f:'Colorado’s state fish was once thought extinct. In 2012 scientists found the true greenback surviving in one small creek near Colorado Springs.'},
  {n:'American Beaver',k:'mammal',inv:0,c:'#c48a4a',f:'Beaver dams slow rivers, raise groundwater and create wetlands that hundreds of other species use.'},
  {n:'Bur Oak',k:'tree',inv:0,c:'#7fbf6a',f:'Bur oak’s thick, corky bark helps it survive prairie fires. Its acorns are some of the largest of any North American oak.'},
  {n:'Rocky Mtn Juniper',k:'tree',inv:0,c:'#5fae8c',f:'Its blue “berries” are really tiny cones. Birds eat them and spread the seeds.'},
  {n:'Mountain Bluebird',k:'bird',inv:0,c:'#8fd0ff',f:'Bluebirds nest in tree holes and nest boxes. Their blue is structural — feathers scatter light; there is no blue pigment.'},
  {n:'Pasqueflower',k:'flower',inv:0,c:'#E9B9F7',f:'One of the first wildflowers to bloom in spring, often while snow is still on the ground. Its fuzzy hairs trap warmth.'},
  // invasives
  {n:'Cheatgrass',k:'grass',inv:1,c:'#d9c27a',f:'From Eurasia. It dries out early in the year and fuels more frequent wildfires across the West, which natives can’t keep up with.'},
  {n:'Tamarisk',k:'tree',inv:1,c:'#d8a0b8',f:'Also called saltcedar. Planted for erosion control in the 1800s, it pulls salt up from deep soil and leaves it on the surface, crowding out cottonwoods and willows.'},
  {n:'Russian Olive',k:'tree',inv:1,c:'#b9c4bf',f:'Planted as windbreaks, it now crowds riverbanks. It adds nitrogen to soil, changing conditions for native plants.'},
  {n:'Canada Thistle',k:'flower',inv:1,c:'#c9a3e0',f:'Despite the name, it came from Europe and Asia. Its creeping roots can spread several feet sideways in one season.'},
  {n:'Leafy Spurge',k:'grass',inv:1,c:'#e6e07a',f:'Its milky sap is toxic to cattle and irritates skin. Its roots can grow more than 20 feet deep, so pulling it rarely works.'},
  {n:'Zebra Mussel',k:'mussel',inv:1,c:'#e8d7b0',f:'Each mussel filters about a liter of water a day, stripping out food native species need. Clean, drain and dry boats to stop them spreading.'},
  {n:'Emerald Ash Borer',k:'bug',inv:1,c:'#3fd18a',f:'This Asian beetle has killed hundreds of millions of North American ash trees. It was found in Boulder, Colorado in 2013.'},
  {n:'Kudzu',k:'vine',inv:1,c:'#6fcf6f',f:'“The vine that ate the South.” In summer it can grow up to a foot a day, smothering trees under a blanket of leaves.'},
  {n:'Purple Loosestrife',k:'flower',inv:1,c:'#d17be0',f:'A single plant can make over 2 million seeds a year, turning diverse wetlands into one purple monoculture.'},
  {n:'Burmese Python',k:'snake',inv:1,c:'#c9b07a',f:'Released and escaped pets now breed in Florida’s Everglades, where raccoon, opossum and rabbit numbers have crashed.'},
  {n:'European Starling',k:'bird',inv:1,c:'#7a7a9a',f:'About 100 starlings were released in New York’s Central Park in 1890–91. Today there are tens of millions, competing with bluebirds for nest holes.'},
  {n:'Myrtle Spurge',k:'flower',inv:1,c:'#b5d98a',f:'Once a popular rock-garden plant, it is now a Colorado “List A” noxious weed — by law it must be wiped out wherever it’s found.'},
];
const drawIcon = (g,k,x,y,col) => { g.save(); g.translate(x,y); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 2;
  if (k=='tree') { g.beginPath(); g.moveTo(0,-8); g.lineTo(7,5); g.lineTo(-7,5); g.fill(); g.fillRect(-1,5,2,3); }
  else if (k=='flower') { for (let i=0;i<5;i++){ const a=i*1.256; g.beginPath(); g.arc(Math.cos(a)*4,Math.sin(a)*4,3,0,7); g.fill(); } g.fillStyle='#121313'; g.beginPath(); g.arc(0,0,2,0,7); g.fill(); }
  else if (k=='grass') { [-5,0,5].forEach(o=>{ g.beginPath(); g.moveTo(o,7); g.quadraticCurveTo(o+2,0,o+(o||2),-8); g.stroke(); }); }
  else if (k=='fish') { g.beginPath(); g.ellipse(-1,0,7,4,0,0,7); g.fill(); g.beginPath(); g.moveTo(5,0); g.lineTo(10,-4); g.lineTo(10,4); g.fill(); }
  else if (k=='mammal') { g.beginPath(); g.ellipse(0,1,7,5,0,0,7); g.fill(); g.fillRect(5,1,5,3); }
  else if (k=='bird') { g.beginPath(); g.arc(0,0,6,0,7); g.fill(); g.beginPath(); g.moveTo(5,-1); g.lineTo(10,1); g.lineTo(5,3); g.fill(); }
  else if (k=='mussel') { g.beginPath(); g.ellipse(0,0,8,5,0,0,7); g.fill(); g.strokeStyle='#121313'; g.lineWidth=1; [-4,0,4].forEach(o=>{ g.beginPath(); g.moveTo(o,-5); g.lineTo(o+2,5); g.stroke(); }); }
  else if (k=='bug') { g.beginPath(); g.ellipse(0,0,4,7,0,0,7); g.fill(); g.lineWidth=1.5; [-3,1,5].forEach(o=>{ g.beginPath(); g.moveTo(-7,o-2); g.lineTo(7,o-2); g.stroke(); }); }
  else if (k=='vine') { g.beginPath(); for (let a=0;a<12;a+=.3) { const r=a*.7; g.lineTo(Math.cos(a)*r,Math.sin(a)*r); } g.stroke(); }
  else if (k=='snake') { g.beginPath(); g.moveTo(-9,0); g.bezierCurveTo(-5,-8,-1,8,3,0); g.bezierCurveTo(5,-5,8,-3,9,0); g.lineWidth=3; g.stroke(); }
  g.restore(); };
A.ROOT_SPECIES = SPECIES;

A.register('rootout', { mount(host, api){
  const wrap = el('div',{width:'480px',fontFamily:A.font,userSelect:'none',position:'relative'}); host.appendChild(wrap);
  const {c,g,w,h} = A.canvas(wrap,480,420); c.style.borderRadius = '12px 12px 0 0'; c.style.touchAction = 'manipulation'; c.style.cursor = 'pointer';
  const panel = el('div',{background:C.forest,borderRadius:'0 0 12px 12px',padding:'10px 12px',display:'flex',flexDirection:'column',gap:'8px'}); wrap.appendChild(panel);
  const fact = el('div',{background:'#fbf8ec',borderRadius:'10px',padding:'8px 10px',minHeight:'58px',boxSizing:'border-box',color:C.ink,fontSize:'13px',lineHeight:1.35}); panel.appendChild(fact);
  const btnRow = el('div',{display:'grid',gridTemplateColumns:'1.2fr 1.2fr 1fr',gap:'8px'}); panel.appendChild(btnRow);
  const mkb = (t,fn,bg,fg) => { const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'10px 6px',cursor:'pointer',background:bg,color:fg,lineHeight:1.1},t); x.onclick = e=>{ e.stopPropagation(); fn(); x.blur(); }; return x; };
  const plantB = mkb('Plant ↓  (Space)',()=>drop(),C.lime,C.forest), rootB = mkb('Root out ✕  (R)',()=>root(),'#7a3fa0','#ffffff'), pullB = mkb('',()=>pull(),C.gold,C.forest);
  btnRow.append(plantB,rootB,pullB);
  const LH = 28, GROUND = h-34, BASEW = A.D(240,210,180), MAXINF = A.D(5,4,3);
  let layers, cur, score, health, pulls, perfects, state='ready', resumed=false, camY=0, banner=null, spreadT=0, fx=[], seen={}, rooted=0, flash=0, boss=null, seeds=0;
  const level = () => 1 + Math.floor(layers.length/8);
  const tagsVisible = () => A.diff=='easy' || level()<=2;
  const top = () => layers[layers.length-1];
  const pickSpecies = () => { const pInv = Math.min(boss ? .62 : .5, .28 + level()*.025 + (boss ? .15 : 0)); const inv = Math.random()<pInv ? 1 : 0, pool = SPECIES.filter(s=>s.inv===inv); return pool[Math.random()*pool.length|0]; };
  const spawn = () => { const t = top(); const sp = pickSpecies(); const speed = (130 + level()*18) * A.D(.8,1,1.2);
    cur = {sp:SPECIES.indexOf(sp), w:t.w, x: Math.random()<.5 ? -t.w : w, dir: 1, speed, fall:null}; cur.dir = cur.x<0 ? 1 : -1; };
  const showFact = (s, verdict, good) => { fact.innerHTML = ''; const head = el('div',{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'});
    head.append(el('span',{fontWeight:700,fontSize:'14px',color:C.forest},s.n), el('span',{fontSize:'10px',fontWeight:700,letterSpacing:'.08em',padding:'2px 7px',borderRadius:'999px',background:s.inv?'#7a3fa0':'#00B451',color:'#fff'},s.inv?'INVASIVE':'NATIVE'));
    if (verdict) head.append(el('span',{marginLeft:'auto',fontSize:'12px',fontWeight:700,color:good?'#007a37':'#B3001B'},verdict));
    fact.append(head, el('div',{fontWeight:500},s.f)); if (!seen[s.n]) { seen[s.n] = 1; stat(api,'rootSpecies',Object.keys(seen).length); } };
  const paintBtns = () => { pullB.textContent = 'Weed puller ×'+pulls; pullB.style.opacity = pulls ? 1 : .5; };
  const reset = () => { layers = [{x:(w-BASEW)/2, w:BASEW, sp:-1, inf:0}]; score = 0; health = A.D(5,3,2)+A.U('health'); pulls = 1+A.U('pull'); perfects = 0; boss = null; seeds = 0; camY = 0; spreadT = 0; fx = []; rooted = 0; resumed = false; banner = null; api.score(0); spawn(); paintBtns();
    fact.innerHTML = ''; fact.append(el('div',{fontWeight:700,color:C.forest,marginBottom:'3px'},'Field guide'), el('div',{fontWeight:500},'Plant native species to grow the tower. Root out invasive ones before they land — if they do, their corruption spreads down the tower.')); };
  const say = (txt,sub,col) => banner = {txt,sub,col:col||C.lime,t:1.6};
  const hitBoss = n => { if (!boss) return; boss.hp -= n; A.tone(300,.08,'square',.04); if (boss.hp <= 0) { const bonus = 300*level(); score += bonus; api.score(score); pulls += 2; health++; seeds += 3; boss = null; stat(api,'rootBoss',1,'add'); A.sfx('win');
      say('KUDZU KING DEFEATED!','+'+bonus+' · +2 weed pullers · +1 health · 3 super seeds',C.gold); paintBtns(); } };
  const loseHealth = (why) => { if (!A.immortal) health--; flash = .35; A.sfx('bad'); say(why,'−1 ecosystem health',C.red); if (health<=0) end('ECOSYSTEM COLLAPSED'); };
  const end = (why) => { state = 'dead'; A.sfx('over'); stat(api,'rootHeight',layers.length-1); api.over(score); banner = {txt:why,sub:'',t:99}; };
  function drop(){ if (state=='ready') { state = 'play'; return; } if (state!='play' || !cur || cur.fall) return; cur.fall = {y:0}; A.sfx('flip'); }
  function root(){ if (state!='play' || !cur || cur.fall) return; const s = SPECIES[cur.sp];
    if (s.inv) { hitBoss(1); score += 30*level(); api.score(score); rooted++; if (rooted % 20 == 0) { seeds += 3; say('SUPER SEEDS ×3','Your next 3 plantings land perfectly'); } stat(api,'rootPulled',1,'add'); edu(api,true); A.sfx('coin'); say('ROOTED OUT!','+'+30*level(),C.lime); showFact(s,'✓ Good call',true); fx.push({x:cur.x+cur.w/2,y:70,t:.6,s:'✕'}); }
    else { edu(api,false); showFact(s,'✗ That one was native',false); loseHealth('THAT WAS NATIVE!'); }
    if (state=='play') spawn(); }
  function pull(){ if (state!='play' || pulls<=0) return; const has = layers.some(l=>l.inf); if (!has) { say('NO CORRUPTION','Save your weed puller',C.gold); return; }
    pulls--; const before = layers.length; layers = layers.filter((l,i)=>i==0 || !(l.inf && SPECIES[l.sp] && SPECIES[l.sp].inv)); layers.forEach(l=>{ l.inf = 0; });
    const removed = before - layers.length; score += 40*removed; api.score(score); A.sfx('win'); say('CORRUPTION PULLED','Removed '+removed+' invasive layer'+(removed==1?'':'s')+' · tower healed'); if (cur && !cur.fall) cur.w = Math.min(cur.w, top().w); paintBtns(); }
  const land = () => { const t = top(), s = SPECIES[cur.sp]; const l = Math.max(cur.x, t.x), r = Math.min(cur.x+cur.w, t.x+t.w);
    if (r-l < 4) { fx.push({x:cur.x+cur.w/2,y:GROUND-layers.length*LH+camY,t:.8,s:'MISS'}); loseHealth('MISSED THE TOWER'); if (state=='play') spawn(); return; }
    let nx = l, nw = r-l, perfect = Math.abs(cur.x-t.x) < 5; if (!perfect && seeds > 0 && !s.inv) { seeds--; perfect = true; nx = t.x; }
    if (perfect && !s.inv) hitBoss(1);
    if (perfect) { nx = t.x; nw = Math.min(BASEW, t.w + 4); perfects++; if (perfects%5==0) { pulls++; say('PERFECT ×5','+1 weed puller'); } else say('PERFECT','+25'); score += 25; A.sfx('point'); }
    layers.push({x:nx, w:nw, sp:cur.sp, inf: s.inv ? 1 : 0});
    if (s.inv) { edu(api,false); showFact(s,'✗ It took root!',false); say('INVASIVE TOOK ROOT','Corruption will spread — use the weed puller',C.lavender); A.sfx('bad'); }
    else { score += 10*level(); edu(api,true); showFact(s,'✓ Planted',true); if (!perfect) A.sfx('hit'); }
    api.score(score); stat(api,'rootHeight',layers.length-1);
    if (layers.length % 20 == 0 && !boss) { const hp = 4 + level(); boss = {hp, max:hp, t:8}; say('THE KUDZU KING ARRIVES','Root out invasives and land perfect blocks to beat him',C.lavender); A.sfx('bad'); }
    if (layers.length%10==1 && layers.length>1) { pulls++; say('LEVEL '+level(),tagsVisible()?'+1 weed puller':'+1 weed puller · labels hidden now — trust what you learned'); }
    paintBtns(); spawn(); };
  const tick = dt => { if (banner && banner.t<90) banner.t -= dt;
    if (boss) { boss.t -= dt; if (boss.t <= 0) { boss.t = A.D(10,8,6); const idx = layers.map((l,i)=>i>0 && !l.inf ? i : -1).filter(i=>i>0); if (idx.length) { const i = idx[idx.length-1]; layers[i].inf = 1; say('THE KUDZU KING STRIKES','He corrupted a native layer',C.lavender); A.tone(90,.25,'sawtooth',.06); } } } flash = Math.max(0,flash-dt); fx.forEach(f=>f.t-=dt); fx = fx.filter(f=>f.t>0);
    const targetCam = Math.max(0,(layers.length-9)*LH); camY += (targetCam-camY)*Math.min(1,dt*6);
    if (cur) { if (!cur.fall) { cur.x += cur.dir*cur.speed*dt; if (cur.x+cur.w > w+20) cur.dir = -1; if (cur.x < -20) cur.dir = 1; }
      else { cur.fall.y += 900*dt; const startY = 70, targetY = GROUND - layers.length*LH + camY - LH; if (startY + cur.fall.y >= targetY) land(); } }
    if (layers.some(l=>l.inf)) { spreadT += dt; const every = A.D(7,5.5,4.2);
      if (spreadT >= every) { spreadT = 0; const idxs = layers.map((l,i)=>l.inf?i:-1).filter(i=>i>0); let spread = false;
        idxs.forEach(i=>{ const below = i-1; if (below>0 && !layers[below].inf) { layers[below].inf = 1; layers[below].w = Math.max(16, layers[below].w*.85); spread = true; } });
        if (spread) { A.tone(110,.2,'sawtooth',.05); say('CORRUPTION SPREADS','A native layer was overrun',C.lavender); }
        const n = layers.filter(l=>l.inf).length; if (n >= MAXINF && !A.immortal) end('TOWER OVERRUN'); } } else spreadT = 0; };
  const drawBlock = (x,y,bw,spi,inf,showTag) => { const s = SPECIES[spi], hide = !showTag;
    const col = inf ? '#6b3a85' : hide ? '#c9a77a' : s.c; g.fillStyle = 'rgba(0,0,0,.2)'; rrect(g,x+2,y+3,bw,LH-2,6); g.fill();
    g.fillStyle = col; rrect(g,x,y,bw,LH-2,6); g.fill();
    if (inf) { g.strokeStyle = '#d9a8ff'; g.lineWidth = 2; g.beginPath(); for (let k=0;k<bw;k+=6) g.lineTo(x+k, y+6+Math.sin((k+performance.now()/120)/5)*4); g.stroke(); }
    g.save(); g.beginPath(); g.rect(x,y,bw,LH); g.clip(); drawIcon(g,s.k,x+14,y+LH/2-1,inf?'#f0d8ff':'#121313');
    g.fillStyle = inf ? '#ffffff' : '#121313'; g.font = '700 12px '+A.font; g.textAlign = 'left'; g.fillText(s.n, x+28, y+17); g.restore();
    if (showTag && s.inv && !inf) { g.fillStyle = '#7a3fa0'; rrect(g,x+bw-14,y-6,14,14,7); g.fill(); g.fillStyle = '#fff'; g.font = '700 10px '+A.font; g.textAlign = 'center'; g.fillText('!',x+bw-7,y+5); } };
  const draw = () => { const sky = g.createLinearGradient(0,0,0,h); sky.addColorStop(0,'#bfe6f7'); sky.addColorStop(1,'#eaf6e3'); g.fillStyle = sky; g.fillRect(0,0,w,h);
    g.fillStyle = 'rgba(1,86,64,.25)'; g.beginPath(); g.moveTo(0,h-90+camY*.3); [[90,h-170],[190,h-110],[300,h-200],[400,h-120],[480,h-160]].forEach(([x,y])=>g.lineTo(x,y+camY*.3)); g.lineTo(w,h); g.lineTo(0,h); g.fill();
    const gy = GROUND + camY; g.fillStyle = '#6e4515'; g.fillRect(0,gy,w,h); g.strokeStyle = '#a0703a'; g.lineWidth = 2; for (let i=0;i<8;i++) { g.beginPath(); g.moveTo(60+i*50,gy+4); g.quadraticCurveTo(70+i*50,gy+18,55+i*50,gy+30); g.stroke(); }
    const b = layers[0]; g.fillStyle = '#3d6b4f'; rrect(g,b.x,gy-LH,b.w,LH,6); g.fill(); g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText('HEALTHY SOIL',b.x+b.w/2,gy-LH+18);
    layers.forEach((l,i)=>{ if (!i) return; const y = GROUND - (i+1)*LH + camY; if (y > h || y < -LH) return; drawBlock(l.x,y,l.w,l.sp,l.inf,true); });
    if (cur && state!='dead') { const y = cur.fall ? 70 + cur.fall.y : 70; drawBlock(cur.x,y,cur.w,cur.sp,0,tagsVisible());
      if (!cur.fall) { g.strokeStyle = 'rgba(18,19,19,.25)'; g.setLineDash([4,6]); g.beginPath(); g.moveTo(cur.x,y+LH); g.lineTo(cur.x,GROUND-layers.length*LH+camY); g.moveTo(cur.x+cur.w,y+LH); g.lineTo(cur.x+cur.w,GROUND-layers.length*LH+camY); g.stroke(); g.setLineDash([]); } }
    g.fillStyle = 'rgba(18,19,19,.72)'; rrect(g,8,8,w-16,30,15); g.fill(); g.textAlign = 'left'; g.font = '700 13px '+A.font; g.fillStyle = '#fff';
    const inf = layers.filter(l=>l.inf).length; g.fillText('HEIGHT '+(layers.length-1)+'   LV '+level()+'   '+A.fmt(score), 20, 28);
    g.textAlign = 'right'; g.fillStyle = '#ffd0e8'; g.fillText('♥'.repeat(Math.max(0,health)), w-20, 28);
    if (inf) { g.fillStyle = '#d9a8ff'; g.fillText('CORRUPTION '+inf+'/'+MAXINF, w-20-health*14-12, 28); }
    if (boss) { const bw = 300, bx = (w-bw)/2; g.fillStyle = 'rgba(18,19,19,.78)'; rrect(g,bx-8,44,bw+16,32,10); g.fill(); g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText('KUDZU KING · strikes in '+Math.ceil(boss.t)+'s', w/2, 57);
      g.fillStyle = '#2a1030'; g.fillRect(bx,62,bw,8); g.fillStyle = '#a64be0'; g.fillRect(bx,62,bw*Math.max(0,boss.hp/boss.max),8); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(bx,62,bw,8);
      g.font = '28px sans-serif'; g.fillText('👑', w-34, 72); }
    if (seeds > 0) { g.fillStyle = C.gold; g.font = '700 12px '+A.font; g.textAlign = 'left'; g.fillText('🌱 super seeds ×'+seeds, 16, 54); }
    fx.forEach(f=>{ g.globalAlpha = Math.min(1,f.t*2); g.fillStyle = C.red; g.font = '700 22px '+A.font; g.textAlign = 'center'; g.fillText(f.s,f.x,f.y-(1-f.t)*20); }); g.globalAlpha = 1;
    if (banner && banner.t>0 && state!='ready') { g.globalAlpha = Math.min(1,banner.t); g.fillStyle = 'rgba(1,86,64,.88)'; rrect(g,60,118,360,banner.sub?60:40,14); g.fill(); g.fillStyle = banner.col||C.lime; g.textAlign = 'center'; g.font = '700 20px '+A.font; g.fillText(banner.txt,w/2,144); if (banner.sub) { g.fillStyle = '#fff'; g.font = '500 12px '+A.font; g.fillText(banner.sub,w/2,166,340); } g.globalAlpha = 1; }
    if (flash>0) { g.fillStyle = 'rgba(255,69,57,'+flash*.6+')'; g.fillRect(0,0,w,h); }
    if (state=='ready') A.overlayText(g,w,h,resumed?'PAUSED':'ROOT OUT THE CORRUPTION',resumed?'Height '+(layers.length-1)+' · Space or tap to continue':'Plant natives · root out invasives · Space / tap');
    if (state=='dead') A.overlayText(g,w,h,banner?banner.txt:'GAME OVER','Height '+(layers.length-1)+' · '+rooted+' invasives rooted out · Space to replay'); };
  reset();
  const R = api.resume; if (R && R.layers) { layers = R.layers; score = R.score; health = R.health; pulls = R.pulls; perfects = R.perfects||0; rooted = R.rooted||0; seen = R.seen||{}; camY = Math.max(0,(layers.length-9)*LH); api.score(score); spawn(); paintBtns(); resumed = true; }
  c.addEventListener('mousedown', e=>{ e.preventDefault(); if (state=='dead') { reset(); state = 'play'; return; } drop(); });
  const offK = A.keys(e=>{ const k = e.key.length==1 ? e.key.toLowerCase() : e.key;
    if (k==' ' || k=='ArrowDown' || k=='Enter') { if (state=='dead') { reset(); state = 'play'; } else drop(); }
    else if (k=='r' || k=='x') root(); else if (k=='p' || k=='w') pull(); else return false; });
  const offL = A.loop(dt=>{ A.mood(() => ({danger: false, boss: !!(boss && boss.hp>0)})); if (state=='play') tick(dt); draw(); });
  api.snap && api.snap(()=> state=='play' || (state=='ready' && resumed) ? {layers:layers.map(l=>({...l})), score, health, pulls, perfects, rooted, seen, seeds} : null);
  return () => { stat(api,'rootHeight',layers.length-1); offK(); offL(); };
}});
})();
