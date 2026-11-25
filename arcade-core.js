(function(){
const A = window.Arcade = window.Arcade || { games:{} };
A.register = (id, def) => { A.games[id] = def; };
A.C = { forest:'#015640', green:'#00B451', lime:'#D5F367', ink:'#121313', cream:'#EDE9D8', sand:'#DAD3B1', paper:'#F0F2F0', pink:'#EA55AB', sky:'#64CDF5', gold:'#F9BF01', red:'#FF4539', orange:'#DD8B03', lavender:'#E9B9F7', mint:'#C7F1EE', blue:'#014987', bark:'#8D5B1D', peach:'#FBB99D' };
A.diff = 'normal'; A.speed = 1; A.D = (e,n,h) => A.diff=='easy'?e:A.diff=='hard'?h:n;
// Short number format everywhere (1.2K, 3.4M … then 3.92e49) — uses the prize counter's formatter once it has loaded.
A.fmt = n => window.WLP ? window.WLP.fmt(n) : (n = Number(n) || 0, Math.abs(n) < 1e4 ? String(Math.round(n)) : n.toExponential(2).replace('e+', 'e'));
A.hinter = (api, run, max) => { if (max == null) max = A.D(5,3,1); let left = max;
  const push = () => api.hint && api.hint({ left: A.infiniteHints ? Infinity : left, run: (quiet) => { if (left <= 0 && !A.infiniteHints) { if (!quiet) A.sfx('bad'); return; } if (run(quiet) !== false) { if (!A.infiniteHints) left--; if (!quiet) { A.sfx('coin'); push(); } } } });
  push(); return { reset(){ left = max; push(); } }; };
A.pulse = (e, col='#F9BF01', ms=1400) => { e.style.outline = '4px solid ' + col; e.style.outlineOffset = '-4px'; setTimeout(() => { e.style.outline = ''; }, ms); };
A.font = '"Uncut Sans","Inter",system-ui,sans-serif';
A.edu = { on:false, topic:'add' };
const SPELL = {easy:'planet garden rabbit window forest pencil castle bridge rocket turtle spider island winter bottle'.split(' '), normal:'because friend people answer weather picture different balloon thought through enough minute library knowledge'.split(' '), hard:'necessary rhythm separate receive definitely environment government february conscience occasion restaurant embarrass millennium questionnaire'.split(' ')};
const LETTERS = 'abcdefghijklmnoprstuwy';
const R = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pickN = (arr,n) => arr.slice().sort(()=>Math.random()-.5).slice(0,n);
const numChoices = (a, extra) => { const c = [a+1, a-1, a+10, a-10, a+2, a-2, a+100, a-100, ...(extra||[])];
  const sw = String(Math.abs(a)); if (sw.length>1) { const r = +(sw.slice(0,-2)+sw.slice(-1)+sw.slice(-2,-1)); if (r!==a) c.push(r); }
  const opts = [...new Set(c.filter(d=>d!==a && d>=0 && Number.isInteger(d)))]; return [a, ...pickN(opts,2)].sort(()=>Math.random()-.5); };
A.problem = () => { const pool = ['add','sub','mult','div','skip','spell','multi']; const T = A.edu.topic=='mixed' ? pool[Math.random()*pool.length|0] : A.edu.topic; let q, a, extra = [];
  if (T=='spell') { const list = SPELL[A.diff] || SPELL.normal, wd = list[Math.random()*list.length|0];
    const vow = [...wd].map((ch,i)=>'aeiouy'.includes(ch)?i:-1).filter(i=>i>=0), idx = vow.length && Math.random()<.6 ? vow[Math.random()*vow.length|0] : Math.random()*wd.length|0;
    a = wd[idx]; q = wd.slice(0,idx)+'_'+wd.slice(idx+1); const ch = new Set([a]); const lp = 'aeiouy'.includes(a) ? 'aeiouy' : LETTERS;
    let g = 0; while (ch.size<3 && g++<60) { const c = lp[Math.random()*lp.length|0]; if (c!==a) ch.add(c); }
    return { q:'Spell: '+q, a, choices:[...ch].sort(()=>Math.random()-.5), kind:'spell', word:wd }; }
  if (T=='skip') { let seq;
    if (A.diff=='hard' && Math.random()<.4) { const m = R(2,3), s0 = R(2,9); seq = [s0, s0*m, s0*m*m, s0*m*m*m]; extra = [seq[2]+ (seq[2]-seq[1]), seq[3]+m]; }
    else { const step = A.D(R(3,12), R(6,25), R(13,75)) * (A.diff!='easy' && Math.random()<.35 ? -1 : 1), s0 = step<0 ? R(-step*5, -step*9) : A.D(R(0,50), R(10,150), R(100,900)); seq = [0,1,2,3].map(k=>s0+k*step); extra = [seq[3]+step, seq[2]-step]; }
    q = seq.slice(0,3).join(', ')+', ?'; a = seq[3]; return { q, a, choices:numChoices(a, extra), kind:'skip' }; }
  if (T=='multi' || (T=='mult' && A.diff=='hard' && Math.random()<.35)) { const f = Math.random()<.5;
    if (f) { const x = R(3,A.D(9,12,15)), y = R(3,A.D(9,12,15)), z = R(5,A.D(30,60,150)), plus = Math.random()<.6; q = x+' × '+y+(plus?' + ':' − ')+z; a = x*y + (plus?z:-z); if (a<0) { q = x+' × '+y+' + '+z; a = x*y+z; } extra = [(x*(y+z)), x*y]; }
    else { const x = R(4,A.D(15,40,99)), y = R(3,A.D(15,40,99)), z = R(2,A.D(6,9,12)); q = '('+x+' + '+y+') × '+z; a = (x+y)*z; extra = [x+y*z]; }
    return { q, a, choices:numChoices(a, extra), kind:'math' }; }
  if (T=='sub') { const x = A.D(R(30,99), R(200,999), R(1000,9999)), y = A.D(R(11,x-1), R(45,x-1), R(150,999)); q = x+' − '+y; a = x-y; extra = [a+10, a-10]; }
  else if (T=='mult') { let x, y; if (A.diff=='easy') { x = R(3,12); y = R(3,12); } else if (A.diff=='hard') { x = R(12,49); y = R(11,29); } else { x = R(12,99); y = R(3,9); } q = x+' × '+y; a = x*y; extra = [x*(y+1), x*(y-1)]; }
  else if (T=='div') { const y = A.D(R(3,12), R(4,12), R(6,19)), z = A.D(R(3,12), R(11,30), R(12,60)); q = (y*z)+' ÷ '+y; a = z; extra = [z+1, z-1, z+y]; }
  else { const x = A.D(R(15,99), R(120,999), R(1000,9999)), y = A.D(R(15,99), R(45,999), R(150,999)); q = x+' + '+y; a = x+y; extra = [a+10, a-10]; }
  return { q, a, choices:numChoices(a, extra), kind:'math' }; };
A.moreChoices = (p, n) => { const ch = new Set(p.choices); let g = 0;
  while (ch.size<n && g++<200) { if (typeof p.a=='string') { const c = LETTERS[Math.random()*LETTERS.length|0]; ch.add(c); } else { const d = p.a + [1,-1,2,-2,10,-10,3,-3,100,-100,11,-11][Math.random()*12|0]; if (d>=0) ch.add(d); } }
  return [...ch].slice(0,n).sort(()=>Math.random()-.5); };
A.solved = p => p.kind=='spell' ? 'The word is “'+p.word+'”' : p.q.replace(', ?',', '+p.a).replace(/ = \?$/,'')+(p.kind=='skip'?'':' = '+p.a);
A.qText = p => p.kind=='math' ? p.q+' = ?' : p.q;
A.learnOn = () => !!(A.edu && A.edu.on);
A.U = k => (A.upg && A.upg[k]) || 0; // Upgrade Workshop level for the current game
// Lives never go over 50 in any game. A life gained past 50 pays a small ticket bonus instead.
// Dramatic music: games report each frame whether you're down to your last life (danger) or fighting a boss.
// The music engine only switches when the answer changes.
A.mood = fn => { let o; try { o = fn(); } catch(e) { return; } const d = !!(o && o.danger), b = !!(o && o.boss); if (d === A._mDanger && b === A._mBoss) return; A._mDanger = d; A._mBoss = b; try { window.WLMusic && window.WLMusic.flags({danger:d, boss:b}); } catch(e){} };
A.MAXLIVES = 50; A.lives = n => Math.max(0, Math.min(A.MAXLIVES, Math.floor(n)));
A.addLife = (cur, api, n = 1) => { const nx = cur + n; if (nx <= A.MAXLIVES) return nx; try { api && api.tix && api.tix(25 * (nx - A.MAXLIVES), 0, 'MAX LIVES · BONUS TICKETS'); } catch(e){} try { A.sfx('coin'); } catch(e){} return A.MAXLIVES; };
A.quiz = (host, title, cb) => { const p = A.problem(), E = A.el;
  if (getComputedStyle(host).position=='static') host.style.position = 'relative';
  const o = E('div',{position:'absolute',inset:0,background:'rgba(1,86,64,.95)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'14px',zIndex:40,color:'#fff',textAlign:'center',padding:'20px',boxSizing:'border-box',fontFamily:A.font,borderRadius:'12px'});
  o.append(E('div',{fontSize:'13px',fontWeight:700,letterSpacing:'.1em',color:'#D5F367'},title), E('div',{fontSize:'34px',fontWeight:700},A.qText(p)));
  const row = E('div',{display:'flex',gap:'10px',flexWrap:'wrap',justifyContent:'center'}); let done = false;
  p.choices.forEach(v=>{ const b = E('button',{fontFamily:A.font,fontWeight:700,fontSize:'22px',minWidth:'84px',padding:'12px 18px',borderRadius:'999px',border:'none',background:'#D5F367',color:'#015640',cursor:'pointer'},String(v));
    b.onclick = e => { e.stopPropagation(); if (done) return; done = true; const ok = v===p.a; A.sfx(ok?'coin':'bad');
      o.innerHTML = ''; o.append(E('div',{fontSize:'30px',fontWeight:700,color:ok?'#D5F367':'#ffb3ab'},ok?'Correct!':'Not quite'), E('div',{fontSize:'18px',fontWeight:500},A.solved(p)));
      setTimeout(()=>{ o.remove(); cb(ok,p); }, ok ? 700 : 1500); }; row.appendChild(b); });
  o.appendChild(row); host.appendChild(o); return o; };
let ctx = null; A.muted = false;
const tone = (f, d, type='square', v=0.06, when=0) => {
  if (A.muted) return; if (A.sfxVol != null) { if (A.sfxVol <= 0) return; v *= A.sfxVol; }
  try {
    ctx = ctx || new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d);
  } catch(e){}
};
A.tone = tone;
A.sfx = (n) => {
  const s = {
    blip:()=>tone(660,.06), hit:()=>tone(330,.08,'square'), point:()=>{tone(880,.07);tone(1320,.09,'square',.05,.06)},
    bad:()=>tone(140,.25,'sawtooth',.07), over:()=>{[440,330,220,150].forEach((f,i)=>tone(f,.18,'triangle',.08,i*.14))},
    win:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.14,'square',.06,i*.1))}, coin:()=>{tone(988,.06);tone(1319,.16,'square',.05,.06)},
    step:()=>tone(200,.03,'triangle',.03), flip:()=>tone(520,.05,'triangle',.06)
  }; (s[n]||s.blip)();
};
A.el = (tag, style={}, text) => { const e = document.createElement(tag); Object.assign(e.style, style); if (text!=null) e.textContent = text; return e; };
A.canvas = (host, w=480, h=480) => {
  const c = document.createElement('canvas'), dpr = window.devicePixelRatio||1;
  c.width = w*dpr; c.height = h*dpr; c.style.width = w+'px'; c.style.height = h+'px'; c.style.display='block'; c.style.borderRadius='12px';
  host.appendChild(c); const g = c.getContext('2d'); g.scale(dpr,dpr); return {c, g, w, h};
};
A.keys = (handler) => { const f = e => { if (handler(e) !== false && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); }; window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); };
A.loop = (fn) => { let id, last = performance.now(), live = true; const t = now => { if(!live) return; const dt = Math.min(50, now-last); last = now; fn(dt/1000*A.speed*(A.liveSpeed || 1)); id = requestAnimationFrame(t); }; id = requestAnimationFrame(t); return () => { live=false; cancelAnimationFrame(id); }; };
A.overlayText = (g, w, h, big, small) => {
  g.fillStyle = 'rgba(1,86,64,0.82)'; g.fillRect(0,0,w,h);
  g.fillStyle = '#D5F367'; g.textAlign='center'; g.font = '700 34px '+A.font; g.fillText(big, w/2, h/2-8);
  if (small){ g.fillStyle='#fff'; g.font='500 16px '+A.font; g.fillText(small, w/2, h/2+26); }
};
})();
