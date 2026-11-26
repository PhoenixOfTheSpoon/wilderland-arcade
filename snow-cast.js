// Wilderland Arcade · SNOW KINGDOM CAST — how the Snow Kingdom's characters look and move.
// Royal Guard Mau Mau (a big, round orange tabby who loves food), Loki the Evil Sorcerer (a golden retriever in a dark
// sorcerer's robe), and the house cats of "Spirits of the Snow" (Bau Bau, Minccino, Little Mow and Chao Chao).
// Every function draws at (x, y) = the character's feet-ish centre on a 2D canvas; t is the game clock in seconds.
(function(){
const A = window.Arcade, TAU = Math.PI*2;
const rr = (g, x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
const C = {};

// ---------- faces: eyes + mouth for every mood (happy, sad, surprised, angry, frightened, mad, smug, peaceful, sleepy) ----------
const face = (g, o, ex, ey, er, t) => { const m = o.mood || 'happy', eye = o.eye || '#7fe08a', blink = Math.sin(t*1.7 + (o.seed||0)) > .985;
  const pupil = (x, y, w, h) => { g.fillStyle = '#121313'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill(); };
  if (m == 'sleepy' || m == 'peaceful' || blink) { g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.4; g.beginPath(); g.arc(-ex, ey, er*.8, .15*Math.PI, .85*Math.PI); g.moveTo(ex + er*.8, ey); g.arc(ex, ey, er*.8, .15*Math.PI, .85*Math.PI); g.stroke(); }
  else if (o.ghost) { const gl = o.glow || '#bff0ff'; g.fillStyle = gl; g.shadowColor = gl; g.shadowBlur = 8; g.beginPath(); g.ellipse(-ex, ey, er*1.05, er*1.25, 0, 0, TAU); g.ellipse(ex, ey, er*1.05, er*1.25, 0, 0, TAU); g.fill(); g.shadowBlur = 0; g.fillStyle = 'rgba(10,20,40,.85)'; g.beginPath(); g.ellipse(-ex, ey + .5, er*.45, er*.75, 0, 0, TAU); g.ellipse(ex, ey + .5, er*.45, er*.75, 0, 0, TAU); g.fill(); }
  else { g.fillStyle = eye; g.beginPath(); g.ellipse(-ex, ey, er, er*1.12, 0, 0, TAU); g.ellipse(ex, ey, er, er*1.12, 0, 0, TAU); g.fill();
    const pw = m == 'surprised' || m == 'frightened' ? er*.75 : m == 'mad' ? er*.25 : er*.42; pupil(-ex, ey, pw, er*.95); pupil(ex, ey, pw, er*.95);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-ex + er*.35, ey - er*.4, er*.28, 0, TAU); g.arc(ex + er*.35, ey - er*.4, er*.28, 0, TAU); g.fill(); }
  // brows
  g.strokeStyle = 'rgba(40,25,10,.8)'; g.lineWidth = 1.3; g.beginPath();
  if (m == 'angry' || m == 'mad') { g.moveTo(-ex - er, ey - er*1.6); g.lineTo(-ex + er, ey - er*1.1); g.moveTo(ex + er, ey - er*1.6); g.lineTo(ex - er, ey - er*1.1); }
  else if (m == 'sad' || m == 'frightened') { g.moveTo(-ex - er, ey - er*1.1); g.lineTo(-ex + er, ey - er*1.7); g.moveTo(ex + er, ey - er*1.1); g.lineTo(ex - er, ey - er*1.7); }
  else if (m == 'smug') { g.moveTo(-ex - er, ey - er*1.5); g.lineTo(-ex + er, ey - er*1.35); g.moveTo(ex + er, ey - er*1.9); g.lineTo(ex - er, ey - er*1.4); }
  g.stroke(); };
const mouth = (g, m, y, w) => { g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.2; g.beginPath();
  if (m == 'happy' || m == 'smug') { g.moveTo(-w, y); g.quadraticCurveTo(-w/2, y + w*.7, 0, y); g.quadraticCurveTo(w/2, y + w*.7, w, y); }
  else if (m == 'sad' || m == 'frightened') { g.moveTo(-w*.8, y + w*.5); g.quadraticCurveTo(0, y - w*.2, w*.8, y + w*.5); }
  else if (m == 'surprised') { g.stroke(); g.fillStyle = '#5a2030'; g.beginPath(); g.ellipse(0, y + 1.5, w*.4, w*.55, 0, 0, TAU); g.fill(); return; }
  else if (m == 'angry' || m == 'mad') { g.moveTo(-w, y + 1); g.lineTo(-w*.5, y - .5); g.lineTo(0, y + 1); g.lineTo(w*.5, y - .5); g.lineTo(w, y + 1); }
  else { g.moveTo(-w*.6, y); g.quadraticCurveTo(0, y + w*.4, w*.6, y); }
  g.stroke(); };

// ---------- a house cat (Bau Bau, Minccino, Little Mow, Chao Chao, the Hall of Paws statues) ----------
// o: fur, belly, stripe, patch, eye, s (size), thin (0..1), ears (droop), crown, cape, ghost, glow, mood, pose ('sit','walk','groom','stretch','pounce','float'), walk, seed
C.hcat = (g, x, y, o, t) => { const s = o.s || 1, thin = o.thin || 0, sd = o.seed || 0; g.save(); g.translate(x, y); g.scale(s, s);
  let jx = 0, jy = 0; if (o.ghost) { const fl = o.jitter || 0; if (fl) { jx = (Math.random() - .5)*fl*6; jy = (Math.random() - .5)*fl*4; } g.globalAlpha = (o.alpha != null ? o.alpha : .72) * (fl ? (Math.random() < .08*fl ? .25 : 1) : 1); jy += Math.sin(t*2 + sd)*3 - 6; }
  g.translate(jx, jy);
  if (!o.ghost) { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(0, 17, 13 - thin*3, 4, 0, 0, TAU); g.fill(); }
  else { const gl = g.createRadialGradient(0, 0, 4, 0, 0, 34); gl.addColorStop(0, (o.glow || '#bff0ff') + '66'); gl.addColorStop(1, 'rgba(160,220,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, 34, 0, TAU); g.fill(); }
  const fur = o.fur || '#c8a070', pose = o.pose || 'sit', bodyW = 11 - thin*4, step = o.walk ? Math.sin(o.walk*12)*2 : 0;
  if (o.cape) { g.fillStyle = o.cape; g.beginPath(); g.moveTo(-10, -4); g.lineTo(10, -4); g.lineTo(16, 16); g.lineTo(-16, 16); g.fill(); g.fillStyle = '#fff'; for (let i = -12; i <= 12; i += 6) { g.beginPath(); g.arc(i, 15, 2, 0, TAU); g.fill(); } }
  // tail swish
  const sw = Math.sin(t*(pose == 'pounce' ? 9 : 2.4) + sd)*5; g.strokeStyle = fur; g.lineWidth = 4 - thin*1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(8, 10); g.quadraticCurveTo(22 + sw*.4, 8 + sw, 16 + sw*.6, -6); g.stroke();
  if (o.stripe) { g.strokeStyle = o.stripe; g.lineWidth = 1.6; g.beginPath(); g.moveTo(17 + sw*.5, 2); g.lineTo(20 + sw*.5, 0); g.moveTo(19 + sw*.4, 7); g.lineTo(22 + sw*.4, 6); g.stroke(); }
  // body
  g.save(); if (pose == 'stretch') { g.translate(0, 4); g.scale(1.25, .8); } if (pose == 'pounce') g.rotate(Math.sin(t*9)*.08);
  g.fillStyle = fur; g.beginPath(); g.ellipse(0, 6, bodyW, 11, 0, 0, TAU); g.fill();
  if (o.patch) { g.fillStyle = o.patch; g.beginPath(); g.ellipse(-4, 4, 5, 6, .4, 0, TAU); g.fill(); }
  g.fillStyle = o.belly || '#fff'; g.beginPath(); g.ellipse(0, 9, 6 - thin*2, 7, 0, 0, TAU); g.fill();
  if (o.stripe) { g.strokeStyle = o.stripe; g.lineWidth = 1.6; for (const sy2 of [0, 4, 8]) { g.beginPath(); g.moveTo(-bodyW + 1, sy2); g.lineTo(-bodyW + 5, sy2 + 1); g.moveTo(bodyW - 1, sy2); g.lineTo(bodyW - 5, sy2 + 1); g.stroke(); } }
  // paws
  g.fillStyle = o.socks || fur; g.beginPath(); g.ellipse(-5, 16 + step*.5, 3.5, 2.5, 0, 0, TAU); g.ellipse(5, 16 - step*.5, 3.5, 2.5, 0, 0, TAU); g.fill();
  g.restore();
  // head (grooming tilts it down)
  g.save(); if (pose == 'groom') { g.translate(-3, 3); g.rotate(-.35 + Math.sin(t*8)*.05); }
  const ear = Math.sin(t*3.1 + sd*2) > .96 ? .25 : 0, droop = o.ears || 0;   // a quick ear twitch now and then
  g.fillStyle = fur; g.beginPath(); g.moveTo(-11, -14); g.lineTo(-9 - droop*4, -29 + droop*8 + ear*6); g.lineTo(-1, -20); g.fill(); g.beginPath(); g.moveTo(11, -14); g.lineTo(9 + droop*4, -29 + droop*8); g.lineTo(1, -20); g.fill();
  g.fillStyle = '#ffb0c8'; g.beginPath(); g.moveTo(-9, -17); g.lineTo(-8.5 - droop*3, -25 + droop*6 + ear*5); g.lineTo(-4, -20); g.fill(); g.beginPath(); g.moveTo(9, -17); g.lineTo(8.5 + droop*3, -25 + droop*6); g.lineTo(4, -20); g.fill();
  g.fillStyle = fur; g.beginPath(); g.ellipse(0, -12, 11 - thin*1.5, 10.5, 0, 0, TAU); g.fill();
  if (o.mask) { g.fillStyle = o.mask; g.beginPath(); g.ellipse(0, -9, 6, 4.5, 0, 0, TAU); g.fill(); }
  if (o.stripe) { g.strokeStyle = o.stripe; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-4, -22); g.lineTo(-2, -18); g.lineTo(0, -21); g.lineTo(2, -18); g.lineTo(4, -22); g.stroke(); }
  g.fillStyle = o.muzzle || '#fff6ea'; g.beginPath(); g.ellipse(-2.6, -7, 3.2, 2.4, 0, 0, TAU); g.ellipse(2.6, -7, 3.2, 2.4, 0, 0, TAU); g.fill();
  face(g, o, 4.5, -13, 2.9, t);
  g.fillStyle = '#ff8aa8'; g.beginPath(); g.moveTo(-1.6, -9); g.lineTo(1.6, -9); g.lineTo(0, -7.4); g.fill();
  mouth(g, o.mood || 'peaceful', -6.2, 2.2);
  g.strokeStyle = 'rgba(40,40,40,.45)'; g.lineWidth = .8; for (const wy of [-7.5, -6]) { g.beginPath(); g.moveTo(-5, wy); g.lineTo(-13, wy - 1); g.moveTo(5, wy); g.lineTo(13, wy - 1); g.stroke(); }
  if (o.crown) { g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(-9, -21); g.lineTo(-9, -31); g.lineTo(-4.5, -26); g.lineTo(0, -33); g.lineTo(4.5, -26); g.lineTo(9, -31); g.lineTo(9, -21); g.fill(); g.fillStyle = '#FF4539'; g.beginPath(); g.arc(0, -24, 2, 0, TAU); g.fill(); }
  if (o.tag) { g.fillStyle = '#c8102e'; g.fillRect(-6, -3, 12, 2.5); g.fillStyle = '#F9BF01'; g.beginPath(); g.arc(0, 1, 2.6, 0, TAU); g.fill(); }
  g.restore();
  if (o.ghost && !o.noSpark) { g.fillStyle = 'rgba(200,240,255,.8)'; for (let i = 0; i < 4; i++) { const a = t*1.2 + i*1.6 + sd; g.fillRect(Math.cos(a)*18, Math.sin(a*1.3)*14 - 6, 2, 2); } }
  g.restore(); };

// ---------- ROYAL GUARD MAU MAU: big, round, fluffy orange tabby in royal guard armor ----------
// o.st: 'stand' · 'march' · 'salute' · 'flop' · 'sniff' · 'dance' · 'sleep' · 'block' · 'charge' · 'eat'; o.walk (seconds walking); o.mood
C.mau = (g, x, y, o, t) => { const s = o.s || 1, st = o.st || 'stand'; g.save(); g.translate(x, y); g.scale(s, s);
  const OR = '#f0902a', DK = '#c4601a', CR = '#ffe2bd', wob = st == 'march' ? Math.sin((o.walk||t)*11) : 0, jig = st == 'march' ? Math.abs(Math.sin((o.walk||t)*11))*1.4 : st == 'dance' ? Math.abs(Math.sin(t*10))*3 : 0;
  g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(0, 18, st == 'flop' ? 22 : 16, 5, 0, 0, TAU); g.fill();
  if (st == 'flop') {   // belly flop: flat on his tummy, legs out, very content
    g.fillStyle = OR; g.beginPath(); g.ellipse(0, 10, 21, 9, 0, 0, TAU); g.fill(); g.strokeStyle = DK; g.lineWidth = 2; for (const sx of [-10, -3, 4, 11]) { g.beginPath(); g.moveTo(sx, 3); g.lineTo(sx + 2, 9); g.stroke(); }
    g.fillStyle = '#2f5fd0'; rr(g, -9, 4, 18, 9, 3); g.fill(); g.fillStyle = OR; g.beginPath(); g.ellipse(-22, 13, 5, 3, 0, 0, TAU); g.ellipse(22, 13, 5, 3, 0, 0, TAU); g.fill();
    g.fillStyle = OR; g.beginPath(); g.arc(-16, 2, 10, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-24, -4); g.lineTo(-23, -14); g.lineTo(-17, -8); g.fill(); g.beginPath(); g.moveTo(-10, -6); g.lineTo(-9, -15); g.lineTo(-14, -8); g.fill();
    g.fillStyle = '#aeb8c4'; g.beginPath(); g.arc(-16, -3, 9, Math.PI, 0); g.fill(); g.fillStyle = '#e8312a'; g.beginPath(); g.ellipse(-16, -14, 2.5, 5, -.3, 0, TAU); g.fill();
    g.save(); g.translate(-16, 4); face(g, {mood:'peaceful'}, 3.5, -2, 2.3, t); mouth(g, 'happy', 3, 2); g.restore();
    g.strokeStyle = '#8D5B1D'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(6, 18); g.lineTo(32, 12); g.stroke(); g.fillStyle = '#d0d8e0'; g.beginPath(); g.moveTo(38, 10.5); g.lineTo(31, 9); g.lineTo(32, 15); g.fill();
    g.restore(); return; }
  g.rotate(wob*.06 + (st == 'dance' ? Math.sin(t*10)*.14 : 0)); g.translate(0, -jig);
  // tail: thick, ringed
  const tw = Math.sin(t*(st == 'dance' ? 10 : 2.6))*4; g.strokeStyle = OR; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, 12); g.quadraticCurveTo(26, 10 + tw, 21 + tw*.5, -4); g.stroke(); g.strokeStyle = DK; g.lineWidth = 2; g.beginPath(); g.moveTo(21 + tw*.3, 8); g.lineTo(25 + tw*.3, 6); g.moveTo(23 + tw*.4, 1); g.lineTo(26 + tw*.4, 0); g.stroke();
  // round fluffy body
  g.fillStyle = OR; g.beginPath(); g.ellipse(0, 6, 16, 14, 0, 0, TAU); g.fill();
  g.strokeStyle = DK; g.lineWidth = 2; for (const sy2 of [-1, 4, 9]) { g.beginPath(); g.moveTo(-15, sy2); g.lineTo(-10, sy2 + 1.5); g.moveTo(15, sy2); g.lineTo(10, sy2 + 1.5); g.stroke(); }
  g.fillStyle = CR; g.beginPath(); g.ellipse(0, 15 + jig*.3, 9, 5, 0, 0, TAU); g.fill();   // belly fluff poking out under the tabard
  // royal guard tabard: a little too tight around the belly
  const tj = Math.sin((o.walk||t)*22)*(st == 'march' ? .9 : 0); g.fillStyle = '#2f5fd0'; rr(g, -10, -3 + tj, 20, 17, 4); g.fill(); g.strokeStyle = '#F9BF01'; g.lineWidth = 1.5; rr(g, -10, -3 + tj, 20, 17, 4); g.stroke();
  g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(-4, 2 + tj); g.lineTo(-4, -1 + tj); g.lineTo(-2, 1 + tj); g.lineTo(0, -2 + tj); g.lineTo(2, 1 + tj); g.lineTo(4, -1 + tj); g.lineTo(4, 2 + tj); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 7 + tj, 2.6, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-10, 10 + tj); g.lineTo(-13, 11); g.moveTo(10, 10 + tj); g.lineTo(13, 11); g.stroke();   // the seams straining
  // feet
  const lf = st == 'march' ? Math.sin((o.walk||t)*11)*2.5 : 0; g.fillStyle = OR; g.beginPath(); g.ellipse(-7, 19 + lf, 5, 3, 0, 0, TAU); g.ellipse(7, 19 - lf, 5, 3, 0, 0, TAU); g.fill(); g.fillStyle = CR; g.beginPath(); g.ellipse(-7, 20 + lf, 3, 1.6, 0, 0, TAU); g.ellipse(7, 20 - lf, 3, 1.6, 0, 0, TAU); g.fill();
  // head (sniffing: nose to the ground)
  g.save(); if (st == 'sniff' || st == 'eat') { g.translate(4, 8 + Math.sin(t*14)*1); g.rotate(.35); } else if (st == 'sleep') { g.translate(0, 2); g.rotate(Math.sin(t*1.2)*.05 - .06); }
  g.fillStyle = OR; g.beginPath(); g.moveTo(-13, -16); g.lineTo(-11, -32); g.lineTo(-3, -22); g.fill(); g.beginPath(); g.moveTo(13, -16); g.lineTo(11, -32); g.lineTo(3, -22); g.fill();
  g.fillStyle = OR; g.beginPath(); g.ellipse(0, -14, 13.5, 12.5, 0, 0, TAU); g.fill();
  g.fillStyle = OR; g.beginPath(); g.ellipse(-12, -9, 4, 5, .4, 0, TAU); g.ellipse(12, -9, 4, 5, -.4, 0, TAU); g.fill();   // chubby cheeks
  g.strokeStyle = DK; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-5, -24); g.lineTo(-3, -20); g.lineTo(0, -23); g.lineTo(3, -20); g.lineTo(5, -24); g.stroke();   // tabby M
  g.beginPath(); g.moveTo(-13, -14); g.lineTo(-9, -13); g.moveTo(13, -14); g.lineTo(9, -13); g.stroke();
  g.fillStyle = CR; g.beginPath(); g.ellipse(-3, -8, 3.6, 2.8, 0, 0, TAU); g.ellipse(3, -8, 3.6, 2.8, 0, 0, TAU); g.fill();
  face(g, {mood: st == 'sleep' ? 'sleepy' : st == 'dance' || st == 'eat' ? 'happy' : st == 'sniff' ? 'surprised' : (o.mood || 'happy'), eye:'#7fd06a', seed:3}, 5, -15, 3, t);
  g.fillStyle = '#ff8aa8'; g.beginPath(); g.moveTo(-2, -10.5); g.lineTo(2, -10.5); g.lineTo(0, -8.6); g.fill(); mouth(g, st == 'eat' ? 'surprised' : 'happy', -7, 2.6);
  g.strokeStyle = 'rgba(40,40,40,.5)'; g.lineWidth = .8; for (const wy of [-9, -7]) { g.beginPath(); g.moveTo(-6, wy); g.lineTo(-16, wy - 1); g.moveTo(6, wy); g.lineTo(16, wy - 1); g.stroke(); }
  // helmet with a red plume
  g.fillStyle = '#aeb8c4'; g.beginPath(); g.arc(0, -19, 12, Math.PI, 0); g.fill(); g.fillStyle = '#d8e0e8'; g.beginPath(); g.arc(-3, -24, 4, Math.PI, 0); g.fill(); g.fillStyle = '#8a96a4'; g.fillRect(-12.5, -20, 25, 3);
  const pl = Math.sin(t*5)*1.5 + (st == 'march' ? wob*2 : 0); g.fillStyle = '#e8312a'; g.beginPath(); g.moveTo(-1, -31); g.quadraticCurveTo(-8 + pl, -42, 4 + pl, -44); g.quadraticCurveTo(2, -36, 3, -31); g.fill();
  g.restore();
  // spear (raised for the salute, lowered for a charge)
  g.save(); if (st == 'charge') { g.translate(6, 0); g.rotate(1.15); } else if (st == 'salute') { g.translate(0, -2); }
  g.strokeStyle = '#8D5B1D'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(18, 18); g.lineTo(18, -30); g.stroke(); g.fillStyle = '#d0d8e0'; g.beginPath(); g.moveTo(18, -39); g.lineTo(14, -29); g.lineTo(22, -29); g.fill(); g.fillStyle = '#e8312a'; g.fillRect(16, -29, 4, 3);
  g.fillStyle = OR; g.beginPath(); g.arc(17, -2, 3.6, 0, TAU); g.fill(); g.restore();
  if (st == 'salute') { g.fillStyle = OR; g.beginPath(); g.ellipse(-10, -22, 3.5, 3, -.5, 0, TAU); g.fill(); g.strokeStyle = OR; g.lineWidth = 4; g.beginPath(); g.moveTo(-12, 0); g.lineTo(-11, -19); g.stroke(); }
  if (st == 'block') { g.strokeStyle = 'rgba(255,233,120,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 6, 22, -1.1, 1.1); g.stroke(); }
  g.restore();
  if (st == 'sleep') { g.fillStyle = '#5a7ab0'; g.font = '800 ' + (10 + (t*2 % 1)*4) + 'px ' + A.font; g.textAlign = 'center'; g.globalAlpha = 1 - (t*.8 % 1); g.fillText('z', x + 14 + (t*12 % 10), y - 40 - (t*16 % 18)); g.globalAlpha = 1; }
  if (st == 'dance') { g.fillStyle = '#EA55AB'; g.font = '700 12px ' + A.font; g.textAlign = 'center'; g.fillText('♪', x - 20, y - 44 + Math.sin(t*8)*4); g.fillText('♫', x + 22, y - 48 + Math.cos(t*8)*4); }
  if (st == 'sniff') { g.strokeStyle = 'rgba(120,90,60,.6)'; g.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const ph = (t*3 + i/3) % 1; g.beginPath(); g.arc(x + 16 + ph*10, y + 6 - ph*8, 2 + ph*3, -1, 1); g.stroke(); } } };

// ---------- LOKI THE EVIL SORCERER: a golden retriever in a dark robe, pointed hat and frost magic at his paws ----------
// o: ph (1-4), cast (true while casting: the tail wags), mood ('smug' by default), fetch (chasing a stick), alpha (clones)
C.loki = (g, x, y, o, t) => { const s = o.s || 1, ph = o.ph || 1, rage = ph >= 4; g.save(); g.translate(x, y); g.scale(s, s); if (o.alpha) g.globalAlpha = o.alpha;
  const GOLD = rage ? '#ffcf5a' : '#e3a54a', DEEP = rage ? '#e8a030' : '#c98a3a', LIGHT = '#f6d79a', ROBE = '#2b1d52', TRIM = '#9fe8ff';
  if (rage) { const pg = .5 + .5*Math.sin(t*8), gr = g.createRadialGradient(0, -6, 6, 0, -6, 52); gr.addColorStop(0, 'rgba(255,214,90,' + (.55 + .25*pg) + ')'); gr.addColorStop(.6, 'rgba(255,120,40,' + (.25 + .15*pg) + ')'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, -6, 52, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 19, 17, 5, 0, 0, TAU); g.fill();
  // feathery tail: wags hard while he casts (or when he sees a stick)
  const wag = Math.sin(t*(o.cast || o.fetch ? 20 : 6))*(o.cast || o.fetch ? .55 : .25);
  g.save(); g.translate(10, 8); g.rotate(-.9 + wag); for (let i = 0; i < 4; i++) { g.strokeStyle = i ? LIGHT : GOLD; g.lineWidth = 7 - i*1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(10, -6 - i, 22, -2 + i*2); g.stroke(); } g.restore();
  // robe with a frosty hem that swirls
  const sw = Math.sin(t*3)*2; g.fillStyle = ROBE; g.beginPath(); g.moveTo(-10, -4); g.lineTo(10, -4); g.lineTo(17 + sw, 18); g.lineTo(-17 + sw, 18); g.closePath(); g.fill();
  g.strokeStyle = TRIM; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= 8; i++) { const xx = -17 + sw + i*(34/8), yy = 18 + (i % 2 ? -3 : 0); if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.stroke();
  g.fillStyle = '#F9BF01'; g.beginPath(); g.arc(-5, 8, 1.4, 0, TAU); g.arc(6, 12, 1.4, 0, TAU); g.arc(1, 3, 1.2, 0, TAU); g.fill();
  // frost magic glowing around his paws
  for (const px2 of [-8, 8]) { const gl = g.createRadialGradient(px2, 18, 1, px2, 18, 10); gl.addColorStop(0, 'rgba(190,240,255,.95)'); gl.addColorStop(1, 'rgba(120,200,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(px2, 18, 10, 0, TAU); g.fill(); g.fillStyle = GOLD; g.beginPath(); g.ellipse(px2, 18, 4.5, 3, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#e8f8ff'; for (let i = 0; i < 6; i++) { const a = t*2 + i*TAU/6; g.fillRect(Math.cos(a)*14 - 1, 16 + Math.sin(a)*4 - 1, 2, 2); }
  // casting paw (raised) with a frost orb
  if (o.cast) { g.fillStyle = GOLD; g.beginPath(); g.ellipse(-15, -6, 4, 5, 0, 0, TAU); g.fill(); const og = g.createRadialGradient(-17, -14, 1, -17, -14, 9); og.addColorStop(0, '#ffffff'); og.addColorStop(1, 'rgba(120,200,255,0)'); g.fillStyle = og; g.beginPath(); g.arc(-17, -14, 9 + Math.sin(t*14)*1.5, 0, TAU); g.fill(); }
  // big fluffy golden chest ruff
  g.fillStyle = LIGHT; for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(i*3.5, -3 + Math.abs(i), 4, 6, 0, 0, TAU); g.fill(); }
  // head
  g.fillStyle = GOLD; g.beginPath(); g.ellipse(0, -13, 12.5, 11.5, 0, 0, TAU); g.fill();
  // long floppy ears
  const es = Math.sin(t*2.5)*.08; g.fillStyle = DEEP; g.save(); g.translate(-11, -17); g.rotate(.35 + es); g.beginPath(); g.ellipse(0, 7, 5, 11, 0, 0, TAU); g.fill(); g.restore(); g.save(); g.translate(11, -17); g.rotate(-.35 - es); g.beginPath(); g.ellipse(0, 7, 5, 11, 0, 0, TAU); g.fill(); g.restore();
  g.fillStyle = LIGHT; g.beginPath(); g.ellipse(0, -7, 8, 6, 0, 0, TAU); g.fill();   // muzzle
  g.fillStyle = '#121313'; g.beginPath(); g.ellipse(0, -10, 3, 2.2, 0, 0, TAU); g.fill();
  const mood = o.fetch ? 'surprised' : o.mood || (ph >= 3 ? 'angry' : 'smug');
  if (mood == 'smug' || mood == 'happy') { g.fillStyle = '#5a2030'; g.beginPath(); g.moveTo(-6, -6); g.quadraticCurveTo(0, 1, 6, -6); g.closePath(); g.fill(); g.fillStyle = '#ff7aa0'; g.beginPath(); g.ellipse(1.5, -2.5, 2.6, 3, 0, 0, TAU); g.fill(); }   // the big grin with a tongue
  else mouth(g, mood, -5, 4);
  face(g, {mood, eye: ph >= 4 ? '#ff7a3c' : '#4a2a10', seed:7}, 4.6, -15, 2.6, t);
  // pointed sorcerer's hat with stars and a moon
  g.fillStyle = '#1d1340'; g.beginPath(); g.ellipse(0, -22, 16, 4.2, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-10, -23); g.quadraticCurveTo(-2, -42, 11, -51 + Math.sin(t*3)*2); g.lineTo(9, -23); g.fill();
  g.fillStyle = '#d8e8ff'; g.font = '8px ' + A.font; g.textAlign = 'center'; g.fillText('★', -3, -29); g.fillText('☾', 4, -37); g.fillStyle = TRIM; g.fillRect(-10, -25, 20, 2);
  g.restore(); };

// ---------- shadow minion (Loki's summons) and the frost tornado ----------
C.shade = (g, x, y, o, t) => { g.save(); g.translate(x, y); g.globalAlpha = .8; const sm = g.createRadialGradient(0, 0, 2, 0, 0, 22); sm.addColorStop(0, 'rgba(40,20,70,.9)'); sm.addColorStop(1, 'rgba(40,20,70,0)'); g.fillStyle = sm; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.fill();
  g.fillStyle = '#1a1030'; g.beginPath(); g.ellipse(0, 4, 12, 9, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0, -8, 9, 8, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-8, -6, 3, 7, .3, 0, TAU); g.ellipse(8, -6, 3, 7, -.3, 0, TAU); g.fill();
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(40,20,70,.6)'; g.beginPath(); g.arc(-10 + i*5, 12 + Math.sin(t*6 + i)*2, 3, 0, TAU); g.fill(); }
  g.fillStyle = '#ff5ad0'; g.shadowColor = '#ff5ad0'; g.shadowBlur = 6; g.beginPath(); g.arc(-3.5, -9, 1.8, 0, TAU); g.arc(3.5, -9, 1.8, 0, TAU); g.fill(); g.shadowBlur = 0; g.restore(); };
C.tornado = (g, x, y, r, t, low) => { g.save(); g.translate(x, y); for (let i = 0; i < (low ? 4 : 8); i++) { const yy = 18 - i*9, ww = r*(.35 + i*.09), a = t*9 + i; g.strokeStyle = 'rgba(200,235,255,' + (.75 - i*.06) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(Math.sin(a)*4, yy, ww, ww*.28, 0, 0, TAU); g.stroke(); }
  if (!low) { g.fillStyle = '#fff'; for (let i = 0; i < 10; i++) { const a = t*6 + i*.63; g.fillRect(Math.cos(a)*r*.7, -20 + Math.sin(a*1.7)*26, 2.5, 2.5); } } g.restore(); };

// ---------- the cast of "Spirits of the Snow" (looks shared by the world, portraits and memories) ----------
C.LOOK = {
  bau:   {fur:'#f0c890', belly:'#fffaf0', stripe:'#a8682e', eye:'#6ac0e0', crown:1, cape:'#c8102e', seed:1},
  minc:  {fur:'#8e959e', belly:'#f4f4f6', stripe:'#6a707a', socks:'#f4f4f6', eye:'#8ad0ff', seed:2},
  mow:   {fur:'#8a6a4a', belly:'#d8c2a8', stripe:'#5e4630', eye:'#e0c060', s:.8, ears:.35, seed:5},
  chao:  {fur:'#d8d4cc', belly:'#f2efe8', patch:'#6a6460', mask:'#7a746c', eye:'#e8d060', thin:.8, seed:9},
};
C.spirit = (g, who, x, y, o, t) => C.hcat(g, x, y, {...C.LOOK[who], ...(o||{})}, t);
A.snowCast = C;
})();
