(function(){
const A = window.Arcade, C = A.C, el = A.el, {board, splash, choice} = A.ui;
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const rrect = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };

// ================= WHACK-A-GOPHER (lives, levels, gopher types, abilities) =================
A.register('whack', { mount(host, api){
  const b = board(host, C.bark);
  const TYPES = {
    normal:{c:C.sand,pts:10,glyph:'• •',esc:1},
    gold:{c:C.gold,pts:30,glyph:'$ $',esc:0,tag:'GOLD'},
    bomb:{c:C.red,pts:0,glyph:'✹',esc:0,bomb:1,tag:'BOMB'},
    helmet:{c:'#c9d1cd',pts:25,glyph:'• •',esc:1,hp:2,tag:'HELMET'},
    speedy:{c:C.sky,pts:20,glyph:'» «',esc:1,fast:1,tag:'SPEEDY'},
    heart:{c:C.pink,pts:5,glyph:'♥',esc:0,tag:'+LIFE'},
    ice:{c:C.mint,pts:5,glyph:'❄',esc:0,tag:'FREEZE'},
    thief:{c:'#6b4f9e',pts:20,glyph:'◣◢',esc:0,thief:1,tag:'THIEF'},
    king:{c:C.lavender,pts:150,glyph:'♛',esc:0,tag:'KING'},
    tank:{c:'#7d8a86',pts:0,glyph:'⛑',esc:0,tag:'TANK'}, // the joke mole: level×10 helmets, stays level×2.5 s
  };
  const NEWS = {2:'NEW · RED BOMBS — DO NOT BONK', 3:'NEW · HELMETS TAKE TWO BONKS', 4:'NEW · SPEEDY BLUE GOPHERS', 6:'NEW · THIEVES STEAL POINTS IF THEY ESCAPE'};
  const ABIL = [['quake','Quake','Q / 1'],['freeze','Freeze','W / 2'],['shield','Shield','E / 3']];
  let st = null, running = false, offL = null, sayTo;
  const need = lv => 8 + lv*2;

  const run = (init) => {
    if (offL) { offL(); offL = null; }
    b.innerHTML = '';
    st = Object.assign({level:1,score:0,lives:A.D(7,5,3)+A.U('life'),whacks:0,charges:{quake:1+A.U('charge'),freeze:1+A.U('charge'),shield:1+A.U('charge')},shield:0,bestCombo:0}, init||{});
    st.charges = Object.assign({quake:0,freeze:0,shield:0}, st.charges); st.combo = 0;
    let spawnT = .7, frozen = 0, king = null, kingT = 0, tankT = 3 + Math.random()*4;
    const learn = !!(A.edu && A.edu.on); let prob = learn ? A.problem() : null;
    const edu = ok => { try { api.edu && api.edu(ok); } catch(e){} };
    api.score(st.score);
    const hud = el('div',{position:'absolute',top:'10px',left:'16px',right:'16px',display:'flex',justifyContent:'space-between',alignItems:'center',color:C.cream,fontWeight:700,fontSize:'16px',gap:'8px'});
    const hL = el('span'), hH = el('span',{color:'#ffd0e8',letterSpacing:'1px'}), hC = el('span',{color:C.lime});
    hud.append(hL,hH,hC); b.appendChild(hud);
    const bar = el('div',{position:'absolute',top:'38px',left:'16px',right:'16px',height:'6px',background:'rgba(0,0,0,.3)',borderRadius:'999px',overflow:'hidden'});
    const barIn = el('div',{height:'100%',width:'0%',background:C.lime,transition:'width .2s'}); bar.appendChild(barIn); b.appendChild(bar);
    const msg = el('div',{position:'absolute',top:'50px',left:0,right:0,textAlign:'center',color:C.lime,fontWeight:700,fontSize:'13px',letterSpacing:'.06em',height:'16px',transition:'opacity .3s',opacity:0}); b.appendChild(msg);
    const grid = el('div',{position:'absolute',top:'74px',left:'30px',right:'30px',height:'326px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gridTemplateRows:'repeat(3,1fr)',gap:'14px',transition:'filter .3s'}); b.appendChild(grid);
    const holes = [...Array(9)].map((_,i)=>{
      const hEl = el('div',{background:'#5a3a12',borderRadius:'50%',position:'relative',overflow:'hidden',cursor:'crosshair',boxShadow:'inset 0 8px 0 rgba(0,0,0,.35)',touchAction:'none'});
      const m = el('div',{position:'absolute',left:'17%',width:'66%',height:'84%',top:'108%',borderRadius:'50% 50% 30% 30%',transition:'top .11s ease-out, transform .08s',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.ink,pointerEvents:'none'});
      const cap = el('div',{position:'absolute',top:0,left:0,right:0,height:'30%',background:'#5f6b67',borderRadius:'50% 50% 0 0',display:'none'});
      const face = el('div',{fontSize:'22px',lineHeight:1}), tag = el('div',{fontSize:'10px',letterSpacing:'.08em',marginTop:'3px'});
      m.append(cap,face,tag); hEl.appendChild(m); grid.appendChild(hEl);
      hEl.addEventListener('pointerdown', e=>{ e.preventDefault(); hit(i); });
      return {el:hEl,m,cap,face,tag,up:false,type:null,hp:0,ttl:0};
    });
    const ab = el('div',{position:'absolute',left:'30px',right:'30px',bottom:'12px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}); b.appendChild(ab);
    const abBtn = {};
    ABIL.forEach(([id,name,key])=>{ const x = el('button',{fontFamily:A.font,border:'none',borderRadius:'12px',padding:'6px 8px',fontWeight:700,fontSize:'14px',lineHeight:1.15});
      const t1 = el('div'), t2 = el('div',{fontSize:'10px',fontWeight:500,opacity:.85},key); x.append(t1,t2); x.onclick = ()=>use(id); ab.appendChild(x); abBtn[id] = [x,t1,name]; });

    const say = t => { msg.textContent = t; msg.style.opacity = 1; msg.style.color = C.lime; msg.style.fontSize = '13px'; clearTimeout(sayTo); sayTo = setTimeout(()=>{ if (learn) showProb(); else msg.style.opacity = 0; }, 2300); };
    const showProb = () => { if (!learn) return; msg.textContent = 'WHACK THE ANSWER · '+A.qText(prob); msg.style.opacity = 1; msg.style.color = '#ffffff'; msg.style.fontSize = '16px'; };
    const labelOf = () => Math.random() < .42 ? prob.a : prob.choices.filter(c=>c!==prob.a)[Math.random()*2|0];
    const setLabel = (h,v) => { h.label = v; h.face.textContent = String(v); h.face.style.fontSize = String(v).length>2 ? '18px' : '24px'; h.tag.textContent = ''; };
    const newProb = () => { prob = A.problem(); holes.forEach(x=>{ if (x.up && x.label!=null) setLabel(x,labelOf()); }); showProb(); };
    const mult = () => Math.min(4, 1 + Math.floor(st.combo/5)*.25);
    const pop = (txt,i,col) => { const h = holes[i].el; const t = el('div',{position:'absolute',left:(grid.offsetLeft+h.offsetLeft+h.offsetWidth/2)+'px',top:(grid.offsetTop+h.offsetTop+6)+'px',transform:'translateX(-50%)',color:col||C.lime,fontWeight:700,fontSize:'18px',pointerEvents:'none',transition:'transform .7s ease-out, opacity .7s',zIndex:3,textShadow:'0 2px 0 rgba(0,0,0,.45)',whiteSpace:'nowrap'},txt);
      b.appendChild(t); requestAnimationFrame(()=>{ t.style.transform='translate(-50%,-36px)'; t.style.opacity=0; }); setTimeout(()=>t.remove(),760); };
    const paint = () => { if (!st) return;
      hL.textContent = 'LV '+st.level+' · '+st.score.toLocaleString();
      hH.textContent = '♥'.repeat(Math.max(0,Math.min(9,st.lives))) + (st.shield ? '  ⛉'+st.shield : '');
      hC.textContent = st.combo>1 ? 'COMBO '+st.combo+' · ×'+mult() : '';
      barIn.style.width = (king ? Math.max(0,kingT/14*100) : Math.min(100, st.whacks/need(st.level)*100)) + '%';
      barIn.style.background = king ? C.lavender : C.lime;
      ABIL.forEach(([id])=>{ const [x,t1,name] = abBtn[id], n = st.charges[id]||0; t1.textContent = name+' ×'+n;
        x.style.background = n ? C.lime : 'rgba(0,0,0,.28)'; x.style.color = n ? C.forest : '#e6d3b3'; x.style.cursor = n ? 'pointer' : 'not-allowed'; }); };
    const upTime = () => Math.max(.55, 1.45 - st.level*.08) * A.D(1.35,1,.78);
    const gapTime = () => Math.max(.26, 1.0 - st.level*.06) * A.D(1.3,1,.75);
    const show = (h,type,hp) => { const T = TYPES[type]; h.type = type; h.up = true;
      h.hp = hp || (type=='king' ? Math.round(4 + st.level/2.5) : type=='tank' ? st.level*10 : T.hp || 1);
      h.ttl = type=='king' ? 1.2 : type=='tank' ? st.level*2.5 : upTime()*(T.fast ? .55 : 1);
      h.m.style.background = T.c; h.face.textContent = T.glyph; h.tag.textContent = type=='king' ? 'KING · '+h.hp : type=='tank' ? '⛑ ×'+h.hp : (T.tag||'');
      h.cap.style.display = type=='helmet'||type=='tank' ? 'block' : 'none'; h.cap.style.height = type=='tank' ? '46%' : '30%'; h.cap.style.background = type=='tank' ? 'repeating-linear-gradient(#5f6b67 0 5px,#9aa5a1 5px 8px)' : '#5f6b67'; h.m.style.top = '16%';
      if (learn && !['bomb','heart','ice','king','tank'].includes(type)) setLabel(h,labelOf()); else { h.label = null; h.face.style.fontSize = '22px'; } };
    const hide = h => { h.up = false; h.type = null; h.m.style.top = '108%'; };
    const pick = () => { const lv = st.level, W = [['normal',learn?72:60],['gold',learn?10:9]];
      if (learn) { if (lv>=3) W.push(['speedy',12]); if (lv>=2 && st.lives<9) W.push(['heart',4]); }
      else if (lv>=2) W.push(['bomb',9+lv]); if (!learn) { if (lv>=3) W.push(['helmet',14],['ice',4]); if (lv>=4) W.push(['speedy',12]); if (lv>=6) W.push(['thief',8]);
      if (lv>=2 && st.lives<9) W.push(['heart',3]); }
      let r = Math.random()*W.reduce((a,x)=>a+x[1],0); for (const [t,wt] of W) { if ((r-=wt) < 0) return t; } return 'normal'; };
    const flashRed = () => { b.style.boxShadow = 'inset 0 0 0 6px '+C.red; setTimeout(()=>b.style.boxShadow='',220); };
    const loseLife = (n=1) => { for (let k=0;k<n;k++) { if (st.shield>0) { st.shield--; say('SHIELD BLOCKED IT'); } else if (!A.immortal) st.lives--; }
      st.combo = 0; A.sfx('bad'); flashRed(); if (st.lives<=0) end(); };
    const spawnKing = () => { const free = holes.filter(h=>!h.up); const h = free[Math.random()*free.length|0] || holes[4]; if (h.up) hide(h); show(h,'king'); king = h; kingT = 14; };
    const levelUp = () => { st.level++; st.whacks = 0; tankT = 3 + Math.random()*5; const gift = ['quake','freeze','shield'][Math.random()*3|0]; st.charges[gift]++;
      A.sfx('win'); stat(api,'whackLevel',st.level);
      if (st.level%5==0 && !learn) { spawnKing(); say(st.level==5 ? 'BOSS · THE GOPHER KING — 14 SECONDS' : 'THE GOPHER KING RETURNS'); }
      else say(NEWS[st.level] || ('LEVEL '+st.level+' · +1 '+gift.toUpperCase())); };
    const whacked = (h,i) => { const T = TYPES[h.type], wasAns = learn && h.label!=null && h.label===prob.a; if (wasAns) { edu(true); setTimeout(newProb, 0); }
      st.combo++; st.bestCombo = Math.max(st.bestCombo, st.combo);
      const pts = Math.round(T.pts * mult() * (1 + (st.level-1)*.1));
      if (h.type=='heart') { st.lives = Math.min(9, st.lives+1); pop('+1 ♥',i,'#ffd0e8'); A.sfx('coin'); }
      else if (h.type=='ice') { frozen = 3.5; pop('FREEZE',i,C.mint); A.sfx('coin'); }
      else if (h.type=='tank') { const bonus = 100*st.level; stat(api,'whackTank',1,'add'); pop('+'+bonus,i,C.gold); A.sfx('win'); say('THE TANK MOLE IS DOWN · '+(st.level*10)+' HELMETS · +'+bonus); st.score += bonus; }
      else if (h.type=='king') { king = null; stat(api,'whackKing',1,'add'); pop('+'+pts,i,C.gold); A.sfx('win'); say('THE KING IS BONKED · +'+pts); }
      else { pop('+'+pts,i,h.type=='gold'?C.gold:C.lime); A.sfx(h.type=='gold'?'coin':'hit'); }
      st.score += pts; api.score(st.score); const wasKing = h.type=='king'; hide(h);
      if (st.combo%15==0) { const gg = ['quake','freeze','shield'][Math.random()*3|0]; st.charges[gg]++; say(st.combo+'× COMBO · +1 '+gg.toUpperCase()); }
      if (!king && !wasKing) { st.whacks++; if (st.whacks >= need(st.level)) levelUp(); } };
    function hit(i){ if (!running || !st) return; const h = holes[i];
      if (!h.up) { if (st.combo) { st.combo = 0; A.sfx('step'); } paint(); return; }
      const T = TYPES[h.type];
      if (learn && h.label!=null && h.label!==prob.a) { hide(h); pop('✗',i,'#ffb3ab'); edu(false); say('NOT QUITE · '+A.solved(prob)); loseLife(); paint(); return; }
      if (learn && h.label!=null) h.hp = 1;
      if (T.bomb) { hide(h); pop('BOOM',i,C.red); loseLife(); paint(); return; }
      h.hp--;
      if (h.hp>0) { A.sfx('hit'); h.m.style.transform = 'scale(.9)'; setTimeout(()=>h.m.style.transform='',90);
        if (h.type=='helmet') { h.cap.style.display = 'none'; h.tag.textContent = 'CRACKED'; h.ttl = Math.max(h.ttl,.5); }
        if (h.type=='tank') { h.tag.textContent = '⛑ ×'+h.hp; if (h.hp%10==0) pop(h.hp+' TO GO',i,'#c9d1cd'); }
        if (h.type=='king') { const hp = h.hp, free = holes.filter(x=>!x.up); if (free.length) { hide(h); const n = free[Math.random()*free.length|0]; show(n,'king',hp); king = n; } else h.tag.textContent = 'KING · '+hp; }
        paint(); return; }
      whacked(h,i); paint(); }
    function use(id){ if (!running || !st || !(st.charges[id]>0)) return; st.charges[id]--; A.sfx('coin');
      if (id=='quake') { if (b.animate) b.animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:260});
        holes.forEach((h,i)=>{ if (!h.up || TYPES[h.type].bomb || (learn && h.label!=null && h.label!==prob.a)) return; if (h.type=='king') { h.hp = Math.max(1,h.hp-2); h.tag.textContent = 'KING · '+h.hp; } else if (h.type=='tank') { h.hp = Math.max(1,h.hp-10); h.tag.textContent = '⛑ ×'+h.hp; } else { h.hp = 1; hit(i); } }); say('QUAKE!'); }
      if (id=='freeze') { frozen = 4; say('FROZEN SOLID · 4 SECONDS'); }
      if (id=='shield') { st.shield += 3; say('SHIELD UP · BLOCKS THE NEXT 3 LOST LIVES'); }
      paint(); }
    run.use = use;
    running = true; paint();
    if (init && init.level) say('WELCOME BACK · LEVEL '+st.level); else showProb();
    let pt = 0;
    offL = A.loop(dt=>{ if (!running) return;
      if (frozen>0) { frozen -= dt; grid.style.filter = 'hue-rotate(150deg) saturate(.75) brightness(1.08)'; if (frozen<=0) grid.style.filter = ''; }
      else {
        spawnT -= dt; const upN = holes.filter(h=>h.up && h.type!='king' && h.type!='tank').length, maxUp = Math.min(5, 1 + Math.floor(st.level/2));
        if (spawnT<=0) { spawnT = gapTime()*(king?1.5:1); if (upN<maxUp) { const free = holes.filter(h=>!h.up); if (free.length) show(free[Math.random()*free.length|0], pick()); } }
        for (let i=0;i<9;i++) { const h = holes[i]; if (!running) return; if (!h.up) continue; h.ttl -= dt; if (h.ttl>0) continue;
          if (h.type=='king') { const free = holes.filter(x=>!x.up), hp = h.hp; if (free.length) { hide(h); const n = free[Math.random()*free.length|0]; show(n,'king',hp); king = n; } else h.ttl = 1.2; continue; }
          const T = TYPES[h.type]; if (h.type=='tank') { hide(h); pop('HE GOT AWAY',i,'#c9d1cd'); say('THE TANK MOLE WADDLED OFF · '+h.hp+' HELMETS LEFT'); paint(); continue; } hide(h);
          if (T.thief) { const lost = Math.min(st.score, 50*st.level); st.score -= lost; api.score(st.score); pop('−'+lost,i,'#d9b8ff'); A.sfx('bad'); st.combo = 0; }
          else if (T.esc && !learn) { pop('MISSED',i,'#ffb3ab'); loseLife(); }
          else if (learn && h.label===prob.a) st.combo = 0;
          paint(); }
        if (tankT>0 && !learn) { tankT -= dt; if (tankT<=0) { const free = holes.filter(x=>!x.up); if (free.length) { show(free[Math.random()*free.length|0],'tank'); say('A TANK MOLE APPEARS · '+(st.level*10)+' HELMETS · '+(st.level*2.5)+' SECONDS'); } else tankT = 1; } }
        if (king && running) { kingT -= dt; if (kingT<=0) { hide(king); king = null; say('THE KING ESCAPED · −2 LIVES'); loseLife(2); } }
      }
      pt += dt; if (pt>.2) { pt = 0; paint(); }
    });
  };
  const end = () => { running = false; if (offL) { offL(); offL = null; } const s = st; st = null;
    stat(api,'whackCombo',s.bestCombo); A.sfx('over'); api.over(s.score);
    setTimeout(()=>splash(b,'OUT OF LIVES','Level '+s.level+' · '+s.score.toLocaleString()+' points · best combo '+s.bestCombo,'Play again',()=>run()),450); };
  const offK = A.keys(e=>{ const k = e.key.toLowerCase(); const id = {q:'quake','1':'quake',w:'freeze','2':'freeze',e:'shield','3':'shield'}[k]; if (id && running && run.use) run.use(id); });
  api.snap && api.snap(()=> running && st ? {level:st.level,score:st.score,lives:st.lives,whacks:st.whacks,charges:st.charges,shield:st.shield,bestCombo:st.bestCombo} : null);
  const R = api.resume;
  if (R && R.level) choice(b,'WELCOME BACK','Level '+R.level+' · '+(R.score||0).toLocaleString()+' points · '+R.lives+' lives left',[['Resume',()=>run(R)],['New game',()=>run()]]);
  else splash(b,'WHACK-A-GOPHER','No clock — you have lives. Bonk gophers before they duck. Skip red bombs. Q/W/E fire Quake, Freeze and Shield.','Start',()=>run());
  return ()=>{ if (st) stat(api,'whackCombo',st.bestCombo); running = false; if (offL) offL(); offK(); clearTimeout(sayTo); };
}});

// ================= TRAILHEAD DEFENSE (tower defense) =================
// Trailhead Defense lives in games-td.js now (bigger maps, more towers, one fast canvas).

// ================= CRITTER CROSSING (frogger-style) =================
A.register('crossing', { mount(host, api){
  const {g,w,h} = A.canvas(host), T = 40;
  const DENX = [48,144,240,336,432];
  const learn = !!(A.edu && A.edu.on); let prob = null, denLab = [];
  const newProb = () => { if (!learn) return; prob = A.problem(); const open = [0,1,2,3,4].filter(i=>!dens[i]);
    const opts = [prob.a, ...A.moreChoices(prob,8).filter(x=>x!==prob.a)].slice(0,open.length).sort(()=>Math.random()-.5); denLab = []; open.forEach((d,k)=>denLab[d]=opts[k]); };
  let st='ready', level=1, score=0, lives=3, dens=[0,0,0,0,0], px=240, pr=11, furthest=11, lanes=[], deadT=0, deadMsg='', time=0, shieldN=0, slowT=0, pickup=null, fly=null, flyT=4, resumed=false, banner=null, hopA=0;
  const mkLanes = () => { const s = (1 + (level-1)*.14) * A.D(.8,1,1.2), L = [];
    const defs = [
      {r:1,dir:1,sp:45,kind:'log',len:3,gap:1.1}, {r:2,dir:-1,sp:58,kind:'turtle',len:3,gap:.9}, {r:3,dir:1,sp:76,kind:'log',len:2,gap:1.4},
      {r:4,dir:-1,sp:40,kind:level>=3?'gator':'log',len:4,gap:1.0}, {r:5,dir:1,sp:54,kind:'turtle',len:2,gap:1.2},
      {r:7,dir:-1,sp:70,kind:'truck',len:2,gap:2.6}, {r:8,dir:1,sp:95,kind:'car',len:1,gap:3.2}, {r:9,dir:-1,sp:50,kind:'tractor',len:1.5,gap:2.4}, {r:10,dir:1,sp:135,kind:'racer',len:1,gap:5.5}];
    defs.forEach(d=>{ const lane = Object.assign({},d,{sp:d.sp*s*(.9+Math.random()*.2),objs:[]}); const span = (d.len + d.len*d.gap)*T, n = Math.ceil((w + d.len*T)/span) + 1, off = Math.random()*span;
      for (let i=0;i<n;i++) lane.objs.push({x:i*span+off-span,len:d.len,ph:Math.random()*6.28,dive:i%2==0}); lane.wrap = n*span; L.push(lane); }); return L; };
  const reset = () => { level = 1; score = 0; lives = A.D(5,4,3)+A.U('life'); dens = [0,0,0,0,0]; shieldN = A.U('shield'); slowT = 0; pickup = null; fly = null; resumed = false; lanes = mkLanes(); respawn(); api.score(0); newProb(); };
  const respawn = () => { px = 240; pr = 11; furthest = 11; };
  const submerged = o => level>=2 && o.dive && Math.sin(time*1.1+o.ph) < -.55;
  const sinking = o => level>=2 && o.dive && Math.sin(time*1.1+o.ph) < -.2;
  const laneOf = r => lanes.find(l=>l.r==r);
  const die = m => { if (deadT>0 || st!='play') return;
    if (shieldN>0) { shieldN--; banner = {t:1.4,txt:'SHIELD POPPED',sub:'Back to the start, no life lost'}; A.sfx('blip'); respawn(); return; }
    if (!A.immortal) lives--; deadT = .9; deadMsg = m; A.sfx('bad');
    if (lives<=0) { st = 'dead'; A.sfx('over'); api.over(score); } };
  const hop = (dx,dy) => { if (st!='play' || deadT>0) return; pr = Math.max(0,Math.min(11,pr+dy)); px = Math.max(20,Math.min(w-20,px+dx*T)); hopA = 1; A.sfx('step');
    if (pr<furthest) { furthest = pr; score += 10; api.score(score); }
    if (pr==0) { const i = DENX.findIndex(x=>Math.abs(px-x)<24);
      if (i<0 || dens[i]) return die(i<0 ? 'HEDGE' : 'DEN TAKEN');
      if (learn && denLab[i]!==prob.a) { try { api.edu && api.edu(false); } catch(e){} banner = {t:2.4,txt:'WRONG DEN',sub:A.solved(prob)}; return die('WRONG'); }
      if (learn) { try { api.edu && api.edu(true); } catch(e){} }
      dens[i] = 1; let bonus = 100*level; if (fly && fly.i==i) { bonus += 200; fly = null; banner = {t:1.2,txt:'FIREFLY BONUS +200'}; }
      score += bonus; api.score(score); A.sfx('point');
      if (dens.every(Boolean)) { score += 500*level; level++; lives = Math.min(7,lives+1); dens = [0,0,0,0,0]; lanes = mkLanes(); A.sfx('win');
        banner = {t:2,txt:'LEVEL '+level,sub:level==2?'Some turtles dive now':level==3?'Gators! Only ride their backs':'Everything is faster · +1 life'};
        api.score(score); stat(api,'crossLevel',level); }
      newProb(); respawn(); } };
  const tick = dt => { time += dt; if (slowT>0) slowT -= dt; const m = (slowT>0 ? .5 : 1) * (1 - .1*A.U('slow')); if (banner) banner.t -= dt; hopA = Math.max(0,hopA-dt*8);
    lanes.forEach(l=>l.objs.forEach(o=>{ o.x += l.dir*l.sp*m*dt; if (l.dir>0 && o.x>w) o.x -= l.wrap; if (l.dir<0 && o.x+o.len*T<0) o.x += l.wrap; }));
    flyT -= dt; if (flyT<=0) { flyT = 6+Math.random()*4; const free = [0,1,2,3,4].filter(i=>!dens[i]); fly = free.length && Math.random()<.75 ? {i:free[Math.random()*free.length|0],t:5} : null; }
    if (fly) { fly.t -= dt; if (fly.t<=0) fly = null; }
    if (!pickup && Math.random()<dt*.07) pickup = {x:40+40*(Math.random()*11|0),kind:Math.random()<.5?'shield':'slow',t:9};
    if (pickup) { pickup.t -= dt; if (pickup.t<=0) pickup = null; }
    if (deadT>0) { deadT -= dt; if (deadT<=0) respawn(); return; }
    if (pr>=1 && pr<=5) { const l = laneOf(pr), o = l.objs.find(o=>px>o.x+4 && px<o.x+o.len*T-4 && !(l.kind=='turtle' && submerged(o)));
      if (!o) return die('SPLASH'); px += l.dir*l.sp*m*dt; if (px<6 || px>w-6) return die('SWEPT AWAY');
      if (l.kind=='gator' && (l.dir>0 ? px>o.x+(o.len-1)*T : px<o.x+T)) return die('CHOMP'); }
    if (pr>=7 && pr<=10) { const l = laneOf(pr); if (l.objs.some(o=>px+12>o.x+3 && px-12<o.x+o.len*T-3)) return die('SPLAT'); }
    if (pickup && pr==6 && Math.abs(px-pickup.x)<24) { if (pickup.kind=='shield') { shieldN++; banner = {t:1.2,txt:'SHIELD',sub:'Survives one hit'}; } else { slowT = 6; banner = {t:1.2,txt:'SLOW-MO',sub:'Traffic and river at half speed'}; } pickup = null; A.sfx('coin'); } };
  // ---------- detailed art (Performance mode keeps it simple) ----------
  const lowFx = () => !!A.lowFx;
  let bgC = null; const bg = () => { if (bgC) return bgC; const o = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio||1); o.width = w*dpr; o.height = h*dpr; const x = o.getContext('2d'); x.scale(dpr,dpr);
    const rnd = (i) => { const v = Math.sin(i*127.1)*43758.5453; return v - Math.floor(v); };
    // hedge & dens strip
    let gr = x.createLinearGradient(0,0,0,T); gr.addColorStop(0,'#0b3a24'); gr.addColorStop(1,'#145c38'); x.fillStyle = gr; x.fillRect(0,0,w,T);
    for (let i=0;i<70;i++) { x.fillStyle = i%3 ? '#1d7a48' : '#0f5132'; x.beginPath(); x.arc(rnd(i)*w, 4+rnd(i+9)*30, 6+rnd(i+3)*6, 0, 7); x.fill(); }
    // river bed
    gr = x.createLinearGradient(0,T,0,6*T); gr.addColorStop(0,'#1f78c7'); gr.addColorStop(1,'#0e4f8f'); x.fillStyle = gr; x.fillRect(0,T,w,5*T);
    // grassy median with tufts and flowers
    gr = x.createLinearGradient(0,6*T,0,7*T); gr.addColorStop(0,'#5fae4f'); gr.addColorStop(1,'#3f8a3c'); x.fillStyle = gr; x.fillRect(0,6*T,w,T);
    for (let i=0;i<90;i++) { const gx = rnd(i+40)*w, gy = 6*T+4+rnd(i+80)*32; x.strokeStyle = i%2 ? '#2f6e2e' : '#7cc46a'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(gx,gy+5); x.lineTo(gx-2,gy); x.moveTo(gx,gy+5); x.lineTo(gx+2,gy-1); x.stroke(); }
    for (let i=0;i<10;i++) { x.fillStyle = ['#fff','#F9BF01','#EA55AB'][i%3]; x.beginPath(); x.arc(rnd(i+200)*w, 6*T+8+rnd(i+210)*24, 2.2, 0, 7); x.fill(); }
    // curbs
    x.fillStyle = '#c9c4b0'; x.fillRect(0,7*T,w,4); x.fillRect(0,11*T-4,w,4); x.fillStyle = '#8f8a78'; for (let xx=0; xx<w; xx+=24) { x.fillRect(xx,7*T,2,4); x.fillRect(xx,11*T-4,2,4); }
    // asphalt with speckle + tyre marks
    gr = x.createLinearGradient(0,7*T+4,0,11*T-4); gr.addColorStop(0,'#3d3f44'); gr.addColorStop(1,'#2e3034'); x.fillStyle = gr; x.fillRect(0,7*T+4,w,4*T-8);
    for (let i=0;i<500;i++) { x.fillStyle = i%2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.15)'; x.fillRect(rnd(i+300)*w, 7*T+4+rnd(i+900)*(4*T-8), 2, 2); }
    x.fillStyle = 'rgba(0,0,0,.12)'; for (let r=7;r<=10;r++) { x.fillRect(0,r*T+10,w,3); x.fillRect(0,r*T+27,w,3); }
    x.fillStyle = 'rgba(255,255,255,.75)'; for (let r=8;r<=10;r++) for (let xx=0;xx<w;xx+=40) x.fillRect(xx,r*T-1,20,3);
    // start lawn
    gr = x.createLinearGradient(0,11*T,0,12*T); gr.addColorStop(0,'#3f8a3c'); gr.addColorStop(1,'#2a6a32'); x.fillStyle = gr; x.fillRect(0,11*T,w,h-11*T);
    for (let i=0;i<60;i++) { const gx = rnd(i+500)*w, gy = 11*T+6+rnd(i+560)*28; x.strokeStyle = '#5aa84a'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(gx,gy+4); x.lineTo(gx+1,gy-1); x.stroke(); }
    bgC = o; return o; };
  const shade = (col, f) => { const m = /^#([0-9a-f]{6})$/i.exec(col); if (!m) return col; const n = parseInt(m[1],16); const c = k => Math.max(0, Math.min(255, Math.round(((n>>k)&255)*f))); return 'rgb('+c(16)+','+c(8)+','+c(0)+')'; };
  const wheel = (x, y, r) => { g.fillStyle = '#121313'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#9a9a9b'; g.beginPath(); g.arc(x, y, r*.45, 0, 7); g.fill(); };
  const vehicle = (kind, x, y, L, dir, idx) => { const lo = lowFx(), front = dir > 0 ? x+L-2 : x+2, back = dir > 0 ? x+2 : x+L-2, f = dir > 0 ? 1 : -1;
    const bus = kind=='truck' && idx%2==1, col = kind=='truck' ? (bus ? '#F9BF01' : '#e8e2cc') : kind=='car' ? ['#64CDF5','#FF4539','#EA55AB','#ffffff'][idx%4] : kind=='tractor' ? '#FF8A3C' : '#EA55AB';
    g.fillStyle = 'rgba(0,0,0,.28)'; rrect(g, x+4, y+30, L-8, 6, 3); g.fill();                                         // shadow
    if (kind=='truck' && !bus) { // cab + cargo box
      const cabW = 26, cabX = dir > 0 ? x+L-cabW-2 : x+2, boxX = dir > 0 ? x+2 : x+cabW+4;
      let gr = g.createLinearGradient(0,y+5,0,y+33); gr.addColorStop(0,'#ffffff'); gr.addColorStop(1,'#cfc9b3'); g.fillStyle = gr; rrect(g, boxX, y+5, L-cabW-6, 28, 4); g.fill();
      g.fillStyle = '#00B451'; g.fillRect(boxX+6, y+15, L-cabW-18, 7); g.fillStyle = '#fff'; g.font = '700 6px '+A.font; g.textAlign = 'center'; g.fillText('WILDERLAND', boxX+(L-cabW-6)/2, y+21);
      gr = g.createLinearGradient(0,y+8,0,y+33); gr.addColorStop(0,'#2f7de0'); gr.addColorStop(1,'#014987'); g.fillStyle = gr; rrect(g, cabX, y+8, cabW, 25, 6); g.fill();
      g.fillStyle = '#bfe6ff'; g.fillRect(dir > 0 ? cabX+cabW-11 : cabX+3, y+11, 8, 12);
      wheel(boxX+12, y+33, 5); wheel(boxX+L-cabW-18, y+33, 5); wheel(cabX+cabW/2, y+33, 5); }
    else { const top = kind=='racer' ? y+12 : y+7, hgt = kind=='racer' ? 21 : 26;
      let gr = g.createLinearGradient(0,top,0,top+hgt); gr.addColorStop(0, shade(col, 1.15)); gr.addColorStop(.55, col); gr.addColorStop(1, shade(col, .65)); g.fillStyle = gr; rrect(g, x+2, top, L-4, hgt, kind=='racer' ? 10 : 7); g.fill();
      if (bus) { g.fillStyle = '#bfe6ff'; for (let k=0;k<Math.floor((L-20)/14);k++) { rrect(g, x+8+k*14, top+4, 10, 9, 2); g.fill(); } g.fillStyle = '#121313'; g.fillRect(x+4, top+16, L-8, 2); g.fillStyle = '#121313'; g.font = '700 7px '+A.font; g.textAlign = 'center'; g.fillText('SCHOOL BUS', x+L/2, top+24); }
      else if (kind=='tractor') { g.fillStyle = '#5a3a1c'; rrect(g, dir > 0 ? x+L*.15 : x+L*.45, top-6, L*.4, 14, 3); g.fill(); g.fillStyle = '#bfe6ff'; g.fillRect(dir > 0 ? x+L*.2 : x+L*.5, top-3, L*.3, 7);
        g.fillStyle = '#4b4d50'; g.fillRect(dir > 0 ? x+L-14 : x+8, top-8, 4, 10); if (!lo) { g.fillStyle = 'rgba(200,200,200,'+(.3+.2*Math.sin(time*8+idx))+')'; g.beginPath(); g.arc(dir > 0 ? x+L-12 : x+10, top-12-Math.sin(time*5+idx)*2, 4, 0, 7); g.fill(); } }
      else { // windshield + roof shine
        g.fillStyle = 'rgba(18,40,60,.85)'; const ws = kind=='racer' ? 9 : 11; rrect(g, dir > 0 ? x+L-ws-11 : x+11, top+4, ws, hgt-8, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(dir > 0 ? x+L-ws-9 : x+13, top+5, 3, hgt-12);
        g.fillStyle = 'rgba(18,40,60,.6)'; rrect(g, dir > 0 ? x+9 : x+L-17, top+5, 8, hgt-10, 3); g.fill();
        if (kind=='racer') { g.fillStyle = '#fff'; g.fillRect(x+6, top+hgt/2-2, L-12, 4); g.fillStyle = shade(col,.5); g.fillRect(dir > 0 ? x : x+L-6, top-2, 6, hgt+4); } }
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x+6, top+2, L-12, 2);
      const wr = kind=='tractor' ? 0 : 5; if (wr) { wheel(x+10, y+33, wr); wheel(x+L-10, y+33, wr); } else { wheel(dir > 0 ? x+10 : x+L-10, y+31, 9); wheel(dir > 0 ? x+L-9 : x+9, y+34, 5); } }
    // headlights + beams, tail lights
    g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(front, y+12, 2.6, 0, 7); g.arc(front, y+28, 2.6, 0, 7); g.fill();
    if (!lo) { g.fillStyle = 'rgba(255,246,176,.09)'; g.beginPath(); g.moveTo(front, y+10); g.lineTo(front+f*34, y+2); g.lineTo(front+f*34, y+38); g.lineTo(front, y+30); g.fill(); }
    g.fillStyle = '#FF4539'; g.fillRect(back-(dir>0?0:2), y+11, 2, 4); g.fillRect(back-(dir>0?0:2), y+25, 2, 4); };
  const log = (x, y, L) => { let gr = g.createLinearGradient(0,y+6,0,y+34); gr.addColorStop(0,'#b07a3a'); gr.addColorStop(.5,'#8D5B1D'); gr.addColorStop(1,'#5e3a12'); g.fillStyle = gr; rrect(g,x,y+6,L,28,13); g.fill();
    g.strokeStyle = 'rgba(60,35,10,.45)'; g.lineWidth = 1.5; for (let k=0;k<Math.floor(L/18);k++) { g.beginPath(); g.moveTo(x+10+k*18, y+11); g.quadraticCurveTo(x+16+k*18, y+20, x+10+k*18, y+29); g.stroke(); }
    g.fillStyle = '#d9a86a'; g.beginPath(); g.ellipse(x+L-6, y+20, 5, 13, 0, 0, 7); g.fill(); g.strokeStyle = '#8D5B1D'; g.lineWidth = 1; g.beginPath(); g.ellipse(x+L-6, y+20, 2.5, 7, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(0,180,81,.8)'; g.beginPath(); g.ellipse(x+L*.35, y+8, 6, 3, -.3, 0, 7); g.fill(); };
  const turtle = (cx, cy, k, ph) => { const lo = lowFx(), pad = lo ? 0 : Math.sin(time*6+ph+k)*2.5; g.fillStyle = '#7fbf6a';
    g.beginPath(); g.arc(cx-12, cy-10+pad, 4, 0, 7); g.arc(cx+12, cy-10-pad, 4, 0, 7); g.arc(cx-12, cy+10-pad, 4, 0, 7); g.arc(cx+12, cy+10+pad, 4, 0, 7); g.arc(cx+16, cy, 5, 0, 7); g.fill();
    const gr = g.createRadialGradient(cx-4, cy-5, 2, cx, cy, 15); gr.addColorStop(0,'#3fd17a'); gr.addColorStop(1,'#0b7a3e'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, 15, 13, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,60,30,.6)'; g.lineWidth = 1.2; g.beginPath(); for (let a=0;a<6;a++) { const an = a*Math.PI/3; g.moveTo(cx+Math.cos(an)*5, cy+Math.sin(an)*5); g.lineTo(cx+Math.cos(an)*13, cy+Math.sin(an)*11); } g.stroke(); g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.stroke();
    g.fillStyle = '#121313'; g.beginPath(); g.arc(cx+18, cy-2, 1.2, 0, 7); g.fill(); };
  const draw = () => { const lo = lowFx();
    g.drawImage(bg(), 0, 0, w, h);
    // animated water: ripples and sparkles
    if (!lo) { g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let r=1;r<=5;r++) for (let k=0;k<6;k++) { const xx = ((k*97 + time*(r%2?18:-14)*(1+r*.1)) % (w+60) + w+60) % (w+60) - 30, yy = r*T + 10 + (k%3)*9; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx+8, yy-3, xx+16, yy); g.stroke(); }
      for (let k=0;k<8;k++) { const a = Math.abs(Math.sin(time*2+k*1.7)); g.fillStyle = 'rgba(255,255,255,'+a*.5+')'; g.fillRect((k*61+time*10)%w, T+12+(k*37)%(5*T-20), 2, 2); } }
    DENX.forEach((x,i)=>{ g.fillStyle = '#0e4f8f'; rrect(g,x-22,6,44,34,12); g.fill(); g.fillStyle = 'rgba(100,205,245,.35)'; rrect(g,x-18,10,36,10,6); g.fill();
      g.fillStyle = '#3fae5a'; g.beginPath(); g.ellipse(x, 30, 13, 6, 0, 0, 7); g.fill(); g.fillStyle = '#EA55AB'; g.beginPath(); g.arc(x+8, 27, 2.5, 0, 7); g.fill();
      if (learn && !dens[i] && denLab[i]!=null) { g.fillStyle = '#fff'; g.font = '700 '+(String(denLab[i]).length>2?13:17)+'px '+A.font; g.textAlign = 'center'; g.fillText(denLab[i], x, 24); }
      if (dens[i]) { g.fillStyle = C.lime; g.beginPath(); g.arc(x,24,11,0,7); g.fill(); g.fillStyle = '#9fe07a'; g.beginPath(); g.arc(x-5,15,4,0,7); g.arc(x+5,15,4,0,7); g.fill(); g.fillStyle = C.ink; g.beginPath(); g.arc(x-5,15,1.8,0,7); g.arc(x+5,15,1.8,0,7); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.beginPath(); g.arc(x,25,4,.2,Math.PI-.2); g.stroke(); }
      if (fly && fly.i==i) { const gl = 5+Math.sin(time*12); if (!lo) { g.fillStyle = 'rgba(249,191,1,.3)'; g.beginPath(); g.arc(x,22,gl*2.4,0,7); g.fill(); } g.fillStyle = C.gold; g.beginPath(); g.arc(x,22,gl,0,7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x-4,18,4,2,-.5,0,7); g.ellipse(x+4,18,4,2,.5,0,7); g.fill(); } });
    lanes.forEach(l=>{ const y = l.r*T; l.objs.forEach((o, oi)=>{ const L = o.len*T;
      if (l.kind=='log') { if (!lo) { g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(l.dir>0 ? o.x-8 : o.x+L, y+30, 8, 2); } log(o.x, y, L); }
      else if (l.kind=='turtle') { g.globalAlpha = submerged(o) ? .18 : sinking(o) ? .55 : 1; for (let k=0;k<o.len;k++) turtle(o.x+k*T+T/2, y+T/2, k, o.ph); g.globalAlpha = 1; if (sinking(o) && !submerged(o) && !lo) { g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(o.x+L/2, y+T/2, L/2, 14, 0, 0, 7); g.stroke(); } }
      else if (l.kind=='gator') { let gr = g.createLinearGradient(0,y+8,0,y+32); gr.addColorStop(0,'#5a9a6a'); gr.addColorStop(1,'#2b4f39'); g.fillStyle = gr; rrect(g,o.x,y+8,L,24,10); g.fill();
        g.fillStyle = '#2b4f39'; for (let k=0;k<Math.floor(L/12);k++) { g.beginPath(); g.moveTo(o.x+8+k*12, y+10); g.lineTo(o.x+12+k*12, y+5); g.lineTo(o.x+16+k*12, y+10); g.fill(); }
        const mx = l.dir>0 ? o.x+L-T : o.x, open = lo ? 0 : Math.max(0, Math.sin(time*3+o.ph))*5; g.fillStyle = '#244232'; g.fillRect(mx,y+8-open,T,12); g.fillRect(mx,y+20+open*.4,T,12);
        g.fillStyle = '#fff'; for (let k=0;k<4;k++) { g.beginPath(); g.moveTo(mx+5+k*8, y+20-open); g.lineTo(mx+9+k*8, y+20-open); g.lineTo(mx+7+k*8, y+25-open); g.fill(); }
        g.fillStyle = C.gold; g.beginPath(); g.arc(l.dir>0?mx+8:mx+T-8,y+11-open,3.5,0,7); g.fill(); g.fillStyle = C.ink; g.fillRect(l.dir>0?mx+7:mx+T-9,y+9-open,2,4); }
      else vehicle(l.kind, o.x, y, L, l.dir, oi); }); });
    if (pickup) { g.fillStyle = pickup.kind=='shield' ? C.mint : C.lavender; g.beginPath(); g.arc(pickup.x,6*T+20,10+Math.sin(time*6)*1.5,0,7); g.fill(); g.fillStyle = C.ink; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText(pickup.kind=='shield'?'S':'◷',pickup.x,6*T+24); }
    if (st!='dead') { const y = pr*T+T/2 - hopA*6;
      if (deadT>0) { g.fillStyle = C.red; g.font = '700 16px '+A.font; g.textAlign = 'center'; g.fillText(deadMsg,px,y+5); }
      else { const lo2 = lowFx(), stretch = hopA, blink = !lo2 && (time % 3.2) < .12;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(px, pr*T+T/2+12, 13-stretch*3, 4, 0, 0, 7); g.fill();
        g.fillStyle = '#4fae3a'; g.beginPath(); g.ellipse(px-12, y+8+stretch*4, 6, 4+stretch*3, -.5, 0, 7); g.ellipse(px+12, y+8+stretch*4, 6, 4+stretch*3, .5, 0, 7); g.fill();
        const gr = g.createRadialGradient(px-4, y-4, 2, px, y, 15); gr.addColorStop(0,'#e9ff9a'); gr.addColorStop(1,'#6fbf2a'); g.fillStyle = gr; g.beginPath(); g.ellipse(px, y, 13, 12+stretch*2, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(0,100,40,.35)'; g.beginPath(); g.arc(px-4, y+3, 2.2, 0, 7); g.arc(px+5, y+5, 1.8, 0, 7); g.fill();
        g.fillStyle = '#fffbe0'; g.beginPath(); g.ellipse(px, y+5, 7, 4, 0, 0, 7); g.fill();
        g.fillStyle = '#9fe07a'; g.beginPath(); g.arc(px-8,y-9,5.5,0,7); g.arc(px+8,y-9,5.5,0,7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(px-8,y-9,3.6,0,7); g.arc(px+8,y-9,3.6,0,7); g.fill();
        if (blink) { g.strokeStyle = C.ink; g.lineWidth = 1.5; g.beginPath(); g.moveTo(px-11,y-9); g.lineTo(px-5,y-9); g.moveTo(px+5,y-9); g.lineTo(px+11,y-9); g.stroke(); }
        else { g.fillStyle = C.ink; g.beginPath(); g.arc(px-8,y-8.5,2.1,0,7); g.arc(px+8,y-8.5,2.1,0,7); g.fill(); g.fillStyle = '#fff'; g.fillRect(px-8,y-10,1,1); g.fillRect(px+8,y-10,1,1); }
        g.fillStyle = '#ff9fbf'; g.beginPath(); g.arc(px-8, y-1, 2, 0, 7); g.arc(px+8, y-1, 2, 0, 7); g.fill(); g.strokeStyle = '#2f6e2e'; g.lineWidth = 1.4; g.beginPath(); g.arc(px, y-1, 4, .3, Math.PI-.3); g.stroke();
        if (shieldN>0) { g.strokeStyle = C.mint; g.lineWidth = 3; g.beginPath(); g.arc(px,y,18,0,7); g.stroke(); } } }
    g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'left'; g.fillText('LV '+level+'   '+score.toLocaleString(),10,11*T+25); if (learn && prob) { g.textAlign = 'center'; g.fillStyle = C.lime; g.font = '700 17px '+A.font; g.fillText(A.qText(prob), w/2, 11*T+26); }
    g.textAlign = 'right'; g.fillStyle = '#ffd0e8'; g.fillText('♥'.repeat(Math.max(0,lives))+(shieldN?'  ⛉'+shieldN:'')+(slowT>0?'  SLOW '+Math.ceil(slowT):''),w-10,11*T+25);
    if (banner && banner.t>0) { g.globalAlpha = Math.min(1,banner.t); g.fillStyle = 'rgba(1,86,64,.88)'; rrect(g,70,6*T-14,340,banner.sub?66:44,14); g.fill(); g.fillStyle = C.lime; g.textAlign = 'center'; g.font = '700 20px '+A.font; g.fillText(banner.txt,w/2,6*T+14); if (banner.sub) { g.fillStyle = '#fff'; g.font = '500 13px '+A.font; g.fillText(banner.sub,w/2,6*T+38); } g.globalAlpha = 1; }
    if (st=='ready') A.overlayText(g,w,h,resumed?'PAUSED':'CRITTER CROSSING',resumed?'Level '+level+' · Space to keep crossing':'Fill all 5 dens · Arrows/WASD to hop · Space');
    if (st=='dead') A.overlayText(g,w,h,'OUT OF LIVES','Level '+level+' · score '+score.toLocaleString()+' · Space to try again');
  };
  reset();
  const R = api.resume; if (R && R.level) { level = R.level; score = R.score; lives = R.lives; dens = R.dens || [0,0,0,0,0]; shieldN = R.shieldN||0; lanes = mkLanes(); respawn(); api.score(score); resumed = true; newProb(); }
  const offK = A.keys(e=>{ const k = e.key.length==1 ? e.key.toLowerCase() : e.key;
    if (st!='play') { if (k==' ' || k=='Enter') { if (st=='dead') reset(); st = 'play'; } return; }
    const m = {ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}[k]; if (m && !e.repeat) hop(m[0],m[1]); });
  const offL = A.loop(dt=>{ if (st=='play') tick(dt); draw(); });
  api.snap && api.snap(()=> st=='play' || (st=='ready' && resumed) ? {level,score,lives,dens,shieldN} : null);
  return ()=>{ offK(); offL(); };
}});

// ================= TIMBER STACK (falling blocks) =================
A.register('stack', { mount(host, api){
  const {g,w,h} = A.canvas(host), CW = 10, CH = 20, S = 22, BX = 20, BY = 20;
  const SH = {I:[[1,1,1,1]],O:[[1,1],[1,1]],T:[[0,1,0],[1,1,1]],S:[[0,1,1],[1,1,0]],Z:[[1,1,0],[0,1,1]],J:[[1,0,0],[1,1,1]],L:[[0,0,1],[1,1,1]],B:[[1]]};
  const COL = {I:C.sky,O:C.gold,T:C.lavender,S:C.green,Z:C.red,J:'#4f8fd6',L:C.orange,B:'#ff6a3d'};
  let grid, cur, next = [], hold = null, canHold = true, score = 0, lines = 0, level = 1, saws = 1, st = 'ready', dropT = 0, lockT = 0, resumed = false, banner = null, bag = [], quizzing = false, chances = 1;
  const edu = ok => { try { api.edu && api.edu(ok); } catch(e){} };
  const draw7 = () => { if (!bag.length) bag = 'IOTSZJL'.split('').sort(()=>Math.random()-.5); const k = bag.pop(); return level>=2 && Math.random()<A.D(.09,.07,.05) ? 'B' : k; };
  const rot = m => m[0].map((_,i)=>m.map(r=>r[i]).reverse());
  const rotL = m => m[0].map((_,i)=>m.map(r=>r[r.length-1-i]));
  const fits = (m,x,y) => m.every((row,r)=>row.every((v,c)=>!v || (x+c>=0 && x+c<CW && y+r<CH && (y+r<0 || !grid[y+r][x+c]))));
  const spawnP = (k) => { k = k || next.shift(); while (next.length<3) next.push(draw7()); cur = {k,m:SH[k].map(r=>r.slice()),x:Math.floor((CW-SH[k][0].length)/2),y:0}; lockT = 0; dropT = 0;
    if (!fits(cur.m,cur.x,cur.y) && A.immortal) { for (let i=0;i<8;i++) { grid.pop(); grid.unshift(Array(CW).fill(0)); } banner = {t:1.2,txt:'IMMORTAL',sub:'Eight rows cleared'}; }
    if (!fits(cur.m,cur.x,cur.y)) { const die = () => { st = 'dead'; A.sfx('over'); stat(api,'stackLines',lines); api.over(score); };
      if (A.learnOn() && chances>0) { chances--; quizzing = true; A.quiz(host,'STACKED OUT · ANSWER FOR A SECOND CHANCE',ok=>{ quizzing = false; edu(ok); if (ok) { for (let i=0;i<5;i++) { grid.pop(); grid.unshift(Array(CW).fill(0)); } banner = {t:1.6,txt:'SECOND CHANCE',sub:'Five rows cleared'}; if (!fits(cur.m,cur.x,cur.y)) die(); } else die(); }); }
      else die(); } };
  const reset = () => { grid = [...Array(CH)].map(()=>Array(CW).fill(0)); score = 0; lines = 0; level = 1; saws = 1+A.U('saw'); hold = null; canHold = true; bag = []; next = [draw7(),draw7(),draw7()]; resumed = false; spawnP(); api.score(0); };
  const clearLines = () => { const full = []; for (let r=0;r<CH;r++) if (grid[r].every(v=>v)) full.push(r); if (!full.length) return;
    full.forEach(r=>{ grid.splice(r,1); grid.unshift(Array(CW).fill(0)); }); const n = full.length, before = lines; lines += n;
    score += [0,100,300,500,800][Math.min(4,n)]*level; if (n>=4) banner = {t:1.6,txt:'TIMBER!',sub:'Four lines at once'};
    const nl = 1 + Math.floor(lines/10); if (nl>level) { level = nl; banner = {t:1.6,txt:'LEVEL '+level,sub:level==2?'Ember blocks appear — they burn a 3×3 hole':'Faster drops'}; }
    if (A.learnOn() && Math.floor(lines/5) > Math.floor(before/5)) { quizzing = true; A.quiz(host,'BONUS · ANSWER FOR A SAW',ok=>{ quizzing = false; edu(ok); if (ok) { saws++; banner = {t:1.2,txt:'+1 SAW'}; } }); }
    const gained = Math.floor(lines/10) - Math.floor(before/10); if (gained>0) { chances += gained; saws += gained; setTimeout(()=>banner = {t:1.4,txt:'+1 SAW',sub:'Press X to saw off the bottom row'},900); }
    stat(api,'stackMulti',n); stat(api,'stackLines',lines); api.score(score); A.sfx(n>=4?'win':'point'); };
  const lock = () => { const ember = cur.k=='B';
    cur.m.forEach((row,r)=>row.forEach((v,c)=>{ if (v && cur.y+r>=0) grid[cur.y+r][cur.x+c] = cur.k; }));
    if (ember) { let n = 0; for (let r=cur.y-1;r<=cur.y+1;r++) for (let c=cur.x-1;c<=cur.x+1;c++) if (r>=0 && r<CH && c>=0 && c<CW && grid[r][c]) { grid[r][c] = 0; n++; }
      score += n*15*level; api.score(score); A.tone(90,.25,'sawtooth',.07); banner = {t:1,txt:'EMBER BURN',sub:n+' blocks burned'}; }
    else A.sfx('blip');
    clearLines(); canHold = true; spawnP(); };
  const move = dx => { if (fits(cur.m,cur.x+dx,cur.y)) { cur.x += dx; lockT = Math.min(lockT,.25); } };
  const turn = d => { const m2 = d>0 ? rot(cur.m) : rotL(cur.m); for (const k of [0,-1,1,-2,2]) if (fits(m2,cur.x+k,cur.y)) { cur.m = m2; cur.x += k; lockT = Math.min(lockT,.25); A.sfx('flip'); return; } };
  const soft = () => { if (fits(cur.m,cur.x,cur.y+1)) { cur.y++; score += 1; api.score(score); dropT = 0; } };
  const hard = () => { let n = 0; while (fits(cur.m,cur.x,cur.y+1)) { cur.y++; n++; } score += n*2; api.score(score); lock(); };
  const doHold = () => { if (!canHold) return; const k = cur.k; if (hold) spawnP(hold); else spawnP(); hold = k; canHold = false; A.sfx('flip'); };
  const saw = () => { if (saws<=0) return A.sfx('bad'); saws--; grid.pop(); grid.unshift(Array(CW).fill(0)); while (!fits(cur.m,cur.x,cur.y) && cur.y>-2) cur.y--; score += 50*level; api.score(score); A.tone(300,.2,'sawtooth',.05); banner = {t:.9,txt:'SAWED'}; };
  const tick = dt => { if (banner) banner.t -= dt; dropT += dt; const iv = Math.max(.05,.8*Math.pow(.84,level-1))*A.D(1.25,1,.8);
    if (dropT>=iv) { dropT = 0; if (fits(cur.m,cur.x,cur.y+1)) cur.y++; }
    if (!fits(cur.m,cur.x,cur.y+1)) { lockT += dt; if (lockT>.5) lock(); } else lockT = 0; };
  const cell = (x,y,k,ghost) => { const col = COL[k]; if (ghost) { g.strokeStyle = col; g.globalAlpha = .45; g.lineWidth = 2; g.strokeRect(x+2,y+2,S-4,S-4); g.globalAlpha = 1; return; }
    g.fillStyle = col; rrect(g,x+1,y+1,S-2,S-2,4); g.fill(); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x+4,y+8,S-8,2); g.fillRect(x+6,y+14,S-12,2);
    if (k=='B') { g.fillStyle = C.gold; g.font = '700 14px '+A.font; g.textAlign = 'center'; g.fillText('✹',x+S/2,y+S/2+5); } };
  const mini = (k,x,y) => { const m = SH[k], s = 14; m.forEach((row,r)=>row.forEach((v,c)=>{ if (v) { g.fillStyle = COL[k]; rrect(g,x+c*s,y+r*s,s-2,s-2,3); g.fill(); } })); };
  const draw = () => { g.fillStyle = C.ink; g.fillRect(0,0,w,h);
    g.fillStyle = '#1d2a24'; g.fillRect(BX,BY,CW*S,CH*S); g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 1;
    for (let x=0;x<=CW;x++) { g.beginPath(); g.moveTo(BX+x*S,BY); g.lineTo(BX+x*S,BY+CH*S); g.stroke(); }
    for (let r=0;r<CH;r++) for (let c=0;c<CW;c++) if (grid[r][c]) cell(BX+c*S,BY+r*S,grid[r][c]);
    if (cur && st!='dead') { let gy = cur.y; while (fits(cur.m,cur.x,gy+1)) gy++;
      cur.m.forEach((row,r)=>row.forEach((v,c)=>{ if (v && gy+r>=0) cell(BX+(cur.x+c)*S,BY+(gy+r)*S,cur.k,true); }));
      cur.m.forEach((row,r)=>row.forEach((v,c)=>{ if (v && cur.y+r>=0) cell(BX+(cur.x+c)*S,BY+(cur.y+r)*S,cur.k); })); }
    const X = 262; g.textAlign = 'left'; g.fillStyle = C.lime; g.font = '700 12px '+A.font; g.fillText('NEXT',X,34);
    next.slice(0,3).forEach((k,i)=>mini(k,X,44+i*48));
    g.fillStyle = C.lime; g.fillText('HOLD · C',X+120,34); if (hold) mini(hold,X+120,44);
    const rows = [['SCORE',score.toLocaleString()],['LINES',lines],['LEVEL',level],['SAWS · X','×'+saws]];
    rows.forEach(([a,b],i)=>{ g.fillStyle = '#9fb8ad'; g.font = '700 11px '+A.font; g.fillText(a,X,210+i*44); g.fillStyle = '#fff'; g.font = '700 20px '+A.font; g.fillText(String(b),X,232+i*44); });
    g.fillStyle = '#9fb8ad'; g.font = '500 11px '+A.font; ['← → move   ↑ rotate   Z rotate back','↓ soft drop   Space hard drop'].forEach((t,i)=>g.fillText(t,X,404+i*16));
    if (banner && banner.t>0) { g.globalAlpha = Math.min(1,banner.t); g.fillStyle = 'rgba(1,86,64,.9)'; rrect(g,BX+10,180,CW*S-20,banner.sub?70:44,12); g.fill(); g.fillStyle = C.lime; g.textAlign = 'center'; g.font = '700 22px '+A.font; g.fillText(banner.txt,BX+CW*S/2,210); if (banner.sub) { g.fillStyle = '#fff'; g.font = '500 11px '+A.font; g.fillText(banner.sub,BX+CW*S/2,234,CW*S-30); } g.globalAlpha = 1; }
    if (st=='ready') A.overlayText(g,w,h,resumed?'PAUSED':'TIMBER STACK',resumed?'Lines '+lines+' · Space to keep stacking':'Clear lines · every 10 earns a saw · Space');
    if (st=='dead') A.overlayText(g,w,h,'STACKED OUT','Lines '+lines+' · score '+score.toLocaleString()+' · Space to replay');
  };
  reset();
  const R = api.resume; if (R && R.grid) { grid = R.grid; score = R.score; lines = R.lines; level = R.level; saws = R.saws; hold = R.hold || null; next = R.next && R.next.length ? R.next.slice() : next; spawnP(); api.score(score); resumed = true; }
  const offK = A.keys(e=>{ const k = e.key.length==1 ? e.key.toLowerCase() : e.key;
    if (st!='play') { if (k==' ' || k=='Enter') { if (st=='dead') reset(); st = 'play'; } return; }
    if (k=='ArrowLeft' || k=='a') move(-1); else if (k=='ArrowRight' || k=='d') move(1); else if (k=='ArrowUp' || k=='w') turn(1); else if (k=='z') turn(-1);
    else if (k=='ArrowDown' || k=='s') soft(); else if (k==' ') hard(); else if (k=='c' || k=='Shift') doHold(); else if (k=='x') saw(); });
  const offL = A.loop(dt=>{ if (st=='play' && !quizzing) tick(dt); draw(); });
  api.snap && api.snap(()=> st=='play' || (st=='ready' && resumed) ? {grid,score,lines,level,saws,hold,next} : null);
  return ()=>{ offK(); offL(); };
}});
})();
