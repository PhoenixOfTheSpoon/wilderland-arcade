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
  };
  const NEWS = {2:'NEW · RED BOMBS — DO NOT BONK', 3:'NEW · HELMETS TAKE TWO BONKS', 4:'NEW · SPEEDY BLUE GOPHERS', 6:'NEW · THIEVES STEAL POINTS IF THEY ESCAPE'};
  const ABIL = [['quake','Quake','Q / 1'],['freeze','Freeze','W / 2'],['shield','Shield','E / 3']];
  let st = null, running = false, offL = null, sayTo;
  const need = lv => 8 + lv*2;

  const run = (init) => {
    if (offL) { offL(); offL = null; }
    b.innerHTML = '';
    st = Object.assign({level:1,score:0,lives:A.D(7,5,3),whacks:0,charges:{quake:1,freeze:1,shield:1},shield:0,bestCombo:0}, init||{});
    st.charges = Object.assign({quake:0,freeze:0,shield:0}, st.charges); st.combo = 0;
    let spawnT = .7, frozen = 0, king = null, kingT = 0;
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
      h.hp = hp || (type=='king' ? Math.round(4 + st.level/2.5) : T.hp || 1);
      h.ttl = type=='king' ? 1.2 : upTime()*(T.fast ? .55 : 1);
      h.m.style.background = T.c; h.face.textContent = T.glyph; h.tag.textContent = type=='king' ? 'KING · '+h.hp : (T.tag||'');
      h.cap.style.display = type=='helmet' ? 'block' : 'none'; h.m.style.top = '16%';
      if (learn && !['bomb','heart','ice','king'].includes(type)) setLabel(h,labelOf()); else { h.label = null; h.face.style.fontSize = '22px'; } };
    const hide = h => { h.up = false; h.type = null; h.m.style.top = '108%'; };
    const pick = () => { const lv = st.level, W = [['normal',learn?72:60],['gold',learn?10:9]];
      if (learn) { if (lv>=3) W.push(['speedy',12]); if (lv>=2 && st.lives<9) W.push(['heart',4]); }
      else if (lv>=2) W.push(['bomb',9+lv]); if (!learn) { if (lv>=3) W.push(['helmet',14],['ice',4]); if (lv>=4) W.push(['speedy',12]); if (lv>=6) W.push(['thief',8]);
      if (lv>=2 && st.lives<9) W.push(['heart',3]); }
      let r = Math.random()*W.reduce((a,x)=>a+x[1],0); for (const [t,wt] of W) { if ((r-=wt) < 0) return t; } return 'normal'; };
    const flashRed = () => { b.style.boxShadow = 'inset 0 0 0 6px '+C.red; setTimeout(()=>b.style.boxShadow='',220); };
    const loseLife = (n=1) => { for (let k=0;k<n;k++) { if (st.shield>0) { st.shield--; say('SHIELD BLOCKED IT'); } else st.lives--; }
      st.combo = 0; A.sfx('bad'); flashRed(); if (st.lives<=0) end(); };
    const spawnKing = () => { const free = holes.filter(h=>!h.up); const h = free[Math.random()*free.length|0] || holes[4]; if (h.up) hide(h); show(h,'king'); king = h; kingT = 14; };
    const levelUp = () => { st.level++; st.whacks = 0; const gift = ['quake','freeze','shield'][Math.random()*3|0]; st.charges[gift]++;
      A.sfx('win'); stat(api,'whackLevel',st.level);
      if (st.level%5==0 && !learn) { spawnKing(); say(st.level==5 ? 'BOSS · THE GOPHER KING — 14 SECONDS' : 'THE GOPHER KING RETURNS'); }
      else say(NEWS[st.level] || ('LEVEL '+st.level+' · +1 '+gift.toUpperCase())); };
    const whacked = (h,i) => { const T = TYPES[h.type], wasAns = learn && h.label!=null && h.label===prob.a; if (wasAns) { edu(true); setTimeout(newProb, 0); }
      st.combo++; st.bestCombo = Math.max(st.bestCombo, st.combo);
      const pts = Math.round(T.pts * mult() * (1 + (st.level-1)*.1));
      if (h.type=='heart') { st.lives = Math.min(9, st.lives+1); pop('+1 ♥',i,'#ffd0e8'); A.sfx('coin'); }
      else if (h.type=='ice') { frozen = 3.5; pop('FREEZE',i,C.mint); A.sfx('coin'); }
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
        if (h.type=='king') { const hp = h.hp, free = holes.filter(x=>!x.up); if (free.length) { hide(h); const n = free[Math.random()*free.length|0]; show(n,'king',hp); king = n; } else h.tag.textContent = 'KING · '+hp; }
        paint(); return; }
      whacked(h,i); paint(); }
    function use(id){ if (!running || !st || !(st.charges[id]>0)) return; st.charges[id]--; A.sfx('coin');
      if (id=='quake') { if (b.animate) b.animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:260});
        holes.forEach((h,i)=>{ if (!h.up || TYPES[h.type].bomb || (learn && h.label!=null && h.label!==prob.a)) return; if (h.type=='king') { h.hp = Math.max(1,h.hp-2); h.tag.textContent = 'KING · '+h.hp; } else { h.hp = 1; hit(i); } }); say('QUAKE!'); }
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
        spawnT -= dt; const upN = holes.filter(h=>h.up && h.type!='king').length, maxUp = Math.min(5, 1 + Math.floor(st.level/2));
        if (spawnT<=0) { spawnT = gapTime()*(king?1.5:1); if (upN<maxUp) { const free = holes.filter(h=>!h.up); if (free.length) show(free[Math.random()*free.length|0], pick()); } }
        for (let i=0;i<9;i++) { const h = holes[i]; if (!running) return; if (!h.up) continue; h.ttl -= dt; if (h.ttl>0) continue;
          if (h.type=='king') { const free = holes.filter(x=>!x.up), hp = h.hp; if (free.length) { hide(h); const n = free[Math.random()*free.length|0]; show(n,'king',hp); king = n; } else h.ttl = 1.2; continue; }
          const T = TYPES[h.type]; hide(h);
          if (T.thief) { const lost = Math.min(st.score, 50*st.level); st.score -= lost; api.score(st.score); pop('−'+lost,i,'#d9b8ff'); A.sfx('bad'); st.combo = 0; }
          else if (T.esc && !learn) { pop('MISSED',i,'#ffb3ab'); loseLife(); }
          else if (learn && h.label===prob.a) st.combo = 0;
          paint(); }
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
A.register('td', { mount(host, api){
  const wrap = el('div',{width:'480px',fontFamily:A.font,userSelect:'none',position:'relative'}); host.appendChild(wrap);
  const {c,g,w,h} = A.canvas(wrap,480,400); c.style.borderRadius = '12px 12px 0 0'; c.style.cursor = 'pointer';
  const bar = el('div',{background:C.forest,borderRadius:'0 0 12px 12px',padding:'8px',display:'flex',flexDirection:'column',gap:'6px'}); wrap.appendChild(bar);
  const T = 40, COLS = 12, ROWS = 10;
  const MAPS = [
    {name:'Switchback', pts:[[-1,1],[10,1],[10,4],[1,4],[1,7],[10,7],[10,9]]},
    {name:'Canyon Loop', pts:[[-1,8],[2,8],[2,2],[5,2],[5,6],[8,6],[8,1],[11,1]]},
    {name:'Long Trail', pts:[[5,-1],[5,2],[1,2],[1,8],[10,8],[10,3],[7,3],[7,6],[4,6],[4,4]]},
  ];
  const TW = {
    archer:{n:'Archer',k:'1',cost:50,col:C.green,range:100,dmg:9,rate:.5,L:'A',d:'Fast single shots'},
    frost:{n:'Frost',k:'2',cost:70,col:C.sky,range:85,dmg:3,rate:.85,slow:.45,L:'F',d:'Slows critters'},
    cannon:{n:'Boulder',k:'3',cost:100,col:'#c48a4a',range:115,dmg:24,rate:1.6,splash:46,L:'B',d:'Splash damage'},
    bolt:{n:'Lightning',k:'4',cost:150,col:C.gold,range:110,dmg:16,rate:1.1,chain:3,L:'L',d:'Chains between critters'},
    pan:{n:'Gold Pan',k:'5',cost:90,col:C.orange,range:0,inc:20,L:'$',d:'+gold after every wave'},
  };
  const EN = {
    beetle:{hp:26,sp:44,b:4,col:'#3d6b4f',r:9}, hare:{hp:16,sp:88,b:5,col:'#e3d2b4',r:8},
    armadillo:{hp:58,sp:32,b:9,col:'#8a8f94',r:11,armor:4}, gnat:{hp:7,sp:72,b:1,col:'#2a2a2a',r:5},
    toad:{hp:42,sp:38,b:8,col:'#b8d94a',r:10,heal:7}, slime:{hp:36,sp:40,b:6,col:C.pink,r:10,split:1},
    mini:{hp:12,sp:56,b:2,col:'#f59acb',r:6}, bear:{hp:420,sp:24,b:60,col:'#6e4515',r:16,dmg:5,armor:2},
  };
  const AB = {meteor:{n:'Meteor',k:'Q',cd:25}, freeze:{n:'Freeze',k:'W',cd:40}, rally:{n:'Rally',k:'E',cd:35}};
  let map=0, path=[], segs=[], total=0, pathSet=new Set();
  const setMap = i => { map = i; const P = MAPS[i].pts.map(([x,y])=>[x*T+T/2,y*T+T/2]); path = P; segs = []; total = 0;
    for (let k=0;k<P.length-1;k++) { const [x1,y1]=P[k],[x2,y2]=P[k+1], L=Math.hypot(x2-x1,y2-y1); segs.push({x1,y1,x2,y2,L,s:total}); total += L; }
    pathSet = new Set(); const pts = MAPS[i].pts;
    for (let k=0;k<pts.length-1;k++) { let [x,y] = pts[k]; const [x2,y2] = pts[k+1], dx = Math.sign(x2-x), dy = Math.sign(y2-y);
      for (;;) { if (x>=0&&y>=0&&x<COLS&&y<ROWS) pathSet.add(x+','+y); if (x==x2&&y==y2) break; x+=dx; y+=dy; } } };
  const posAt = d => { for (const s of segs) if (d <= s.s+s.L) { const f = (d-s.s)/s.L; return [s.x1+(s.x2-s.x1)*f, s.y1+(s.y2-s.y1)*f]; } const l = segs[segs.length-1]; return [l.x2,l.y2]; };
  let state='menu', wave=0, gold=0, lives=0, score=0, towers=[], enemies=[], shots=[], fx=[], queue=[], spawnT=0, between=0, sel=null, build='archer', aim=null, fast=false, leaked=false, perfect=0, cds={meteor:0,freeze:0,rally:0}, freezeT=0, rallyT=0, hover=null, banner=null, flash=0;
  const tstat = t => { const D = TW[t.type], L = t.lvl-1; return {range:D.range*(1+.12*L), dmg:D.dmg*(1+.6*L), rate:D.rate*(1-.08*L), slow:D.slow?Math.min(.75,D.slow+.08*L):0, chain:D.chain?D.chain+L:0, splash:D.splash?D.splash*(1+.1*L):0, inc:D.inc?D.inc+12*L:0}; };
  const upCost = t => Math.round(TW[t.type].cost*.8*t.lvl);
  const sellVal = t => Math.round(t.spent*.7);
  const hpMul = () => (1 + (wave-1)*.17 + Math.pow(Math.max(1,wave),1.7)*.01) * A.D(.75,1,1.3);
  const waveList = n => { const L = [], add = (t,k,gap)=>{ for (let i=0;i<k;i++) L.push([t,gap]); };
    add('beetle',5+Math.ceil(n*1.2),.75); if (n>=2) add('hare',Math.floor(n*.8),.45); if (n>=3 && n%2) add('gnat',6+n,.16);
    if (n>=4) add('armadillo',Math.floor(n/2),1); if (n>=6) add('toad',Math.floor(n/4),1.2); if (n>=7) add('slime',Math.floor(n/3),.9);
    for (let i=L.length-1;i>0;i--) { const j = Math.random()*(i+1)|0; [L[i],L[j]] = [L[j],L[i]]; }
    if (n%5==0) add('bear',Math.floor(n/10)+1,2.2); return L; };
  const spawn = (type,d=0) => { const hp = EN[type].hp*hpMul(); const [x,y] = posAt(d); enemies.push({type,d,hp,max:hp,slowT:0,slow:0,x,y}); };
  const float = (x,y,s,col) => fx.push({k:'txt',x,y,s,c:col||C.gold,t:.8});
  const say = (txt,sub) => banner = {txt,sub,t:2.2};
  const hurt = (e,d) => { if (e.dead) return; const D = EN[e.type]; e.hp -= Math.max(d*.25, d-(D.armor||0));
    if (e.hp<=0) { e.dead = 1; const bb = D.b + Math.floor(wave/5); gold += bb; score += bb*10; api.score(score); float(e.x,e.y-10,'+'+bb);
      A.tone(e.type=='bear'?220:760,.04,'square',.03); if (e.type=='bear') A.sfx('win');
      if (D.split) { spawn('mini',Math.max(0,e.d-8)); spawn('mini',e.d+8); } } };
  const newGame = (mi,r) => { setMap(mi); wave = r?r.wave:0; gold = r?r.gold:A.D(180,140,110); lives = r?r.lives:A.D(30,20,12); score = r?r.score:0; perfect = r?(r.perfect||0):0;
    towers = r ? r.towers.map(t=>({...t,cd:0})) : []; enemies = []; shots = []; fx = []; queue = []; sel = null; aim = null;
    cds = {meteor:0,freeze:0,rally:0}; freezeT = rallyT = 0; state = 'build'; between = 12; api.score(score);
    say(r ? 'WELCOME BACK' : MAPS[mi].name.toUpperCase(), r ? 'Wave '+(wave+1)+' is up next' : 'Build towers, then press Space or Next wave'); ui(); };
  const startWave = () => { if (state!='build') return;
    if (wave>0 && between>1) { const bonus = Math.floor(between)*2; gold += bonus; float(240,40,'+'+bonus+' early-call bonus'); }
    wave++; leaked = false; quiz = null; queue = waveList(wave); spawnT = .3; state = 'wave'; A.sfx('blip');
    if (wave%5==0) say('WAVE '+wave+' · BEAR INCOMING','Armored boss · costs 5 lives if it reaches camp'); ui(); };
  const waveClear = () => { state = 'build'; between = 10; if (A.edu && A.edu.on) { between = 16; setTimeout(askQuiz,0); }
    const inc = towers.filter(t=>t.type=='pan').reduce((a,t)=>a+tstat(t).inc,0), bonus = 15 + wave*3 + inc;
    gold += bonus; score += wave*100; api.score(score); perfect = leaked ? 0 : perfect+1;
    stat(api,'tdWave',wave); stat(api,'tdPerfect',perfect); A.sfx('coin');
    say('WAVE '+wave+' CLEARED','+'+bonus+' gold'+(inc?' (pans +'+inc+')':'')+(leaked?'':' · no leaks')); ui(); };
  const gameOver = () => { state = 'over'; A.sfx('over'); api.over(score); ui(); };
  const cast = (id,x,y) => { if (cds[id]>0 || (state!='wave' && state!='build')) return false; cds[id] = AB[id].cd; A.sfx('coin');
    if (id=='meteor') { const dmg = 60 + wave*14; enemies.forEach(e=>{ if (Math.hypot(e.x-x,e.y-y)<62) hurt(e,dmg); }); fx.push({k:'ring',x,y,r:62,c:C.orange,t:.45}); flash = .12; A.tone(70,.35,'sawtooth',.08); }
    if (id=='freeze') { freezeT = 3; say('FREEZE','Every critter stops for 3 seconds'); }
    if (id=='rally') { rallyT = 6; say('RALLY','Towers fire twice as fast for 6 seconds'); }
    ui(); return true; };
  const tick = dt => { dt *= fast ? 2 : 1;
    for (const k in cds) cds[k] = Math.max(0, cds[k]-dt); rallyT = Math.max(0, rallyT-dt); flash = Math.max(0, flash-dt); if (banner) banner.t -= dt;
    if (state=='build' && wave>0) { between -= dt; if (between<=0) startWave(); }
    if (state=='wave') { spawnT -= dt; if (queue.length && spawnT<=0) { const [t,gap] = queue.shift(); spawn(t); spawnT = gap; } }
    const frozen = freezeT>0; freezeT = Math.max(0, freezeT-dt);
    enemies.forEach(e=>{ const D = EN[e.type]; e.slowT = Math.max(0, e.slowT-dt);
      e.d += frozen ? 0 : D.sp*(e.slowT>0 ? 1-e.slow : 1)*dt;
      if (D.heal) enemies.forEach(o=>{ if (o!==e && !o.dead && Math.abs(o.d-e.d)<60) o.hp = Math.min(o.max, o.hp + D.heal*dt*hpMul()*.3); });
      if (e.d>=total && !e.dead) { e.dead = 1; lives -= D.dmg||1; leaked = true; A.sfx('bad'); flash = .25; }
      [e.x,e.y] = posAt(e.d); });
    const rate = rallyT>0 ? .5 : 1;
    towers.forEach(t=>{ const D = TW[t.type]; if (!D.range) return; t.cd -= dt; if (t.cd>0) return; const S = tstat(t), cx = t.c*T+T/2, cy = t.r*T+T/2;
      const inR = enemies.filter(e=>!e.dead && Math.hypot(e.x-cx,e.y-cy)<=S.range); if (!inR.length) return;
      const p = t.mode=='strong' ? inR.reduce((a,b)=>b.hp>a.hp?b:a) : t.mode=='close' ? inR.reduce((a,b)=>Math.hypot(b.x-cx,b.y-cy)<Math.hypot(a.x-cx,a.y-cy)?b:a) : inR.reduce((a,b)=>b.d>a.d?b:a);
      t.cd = S.rate*rate; t.ang = Math.atan2(p.y-cy,p.x-cx);
      if (t.type=='archer') shots.push({k:'arrow',x:cx,y:cy,tg:p,dmg:S.dmg,sp:520,a:t.ang});
      else if (t.type=='cannon') shots.push({k:'rock',x:cx,y:cy,tx:p.x,ty:p.y,dmg:S.dmg,sp:260,splash:S.splash});
      else if (t.type=='frost') { hurt(p,S.dmg); p.slowT = 1.6; p.slow = S.slow; fx.push({k:'line',x1:cx,y1:cy,x2:p.x,y2:p.y,c:C.sky,t:.15}); }
      else if (t.type=='bolt') { let cur = p, px = cx, py = cy; const hitL = [p];
        for (let n=0;n<S.chain && cur;n++) { hurt(cur,S.dmg*(n?.7:1)); fx.push({k:'line',x1:px,y1:py,x2:cur.x,y2:cur.y,c:C.gold,t:.16}); px = cur.x; py = cur.y;
          cur = enemies.find(e=>!e.dead && !hitL.includes(e) && Math.hypot(e.x-px,e.y-py)<72); if (cur) hitL.push(cur); }
        A.tone(1200,.04,'square',.02); } });
    shots.forEach(s=>{ if (s.k=='arrow') { if (s.tg.dead) { s.dead = 1; return; } const dx = s.tg.x-s.x, dy = s.tg.y-s.y, d = Math.hypot(dx,dy), stp = s.sp*dt;
        if (d<=stp+4) { hurt(s.tg,s.dmg); s.dead = 1; } else { s.x += dx/d*stp; s.y += dy/d*stp; s.a = Math.atan2(dy,dx); } }
      else { const dx = s.tx-s.x, dy = s.ty-s.y, d = Math.hypot(dx,dy), stp = s.sp*dt;
        if (d<=stp) { s.dead = 1; enemies.forEach(e=>{ if (!e.dead && Math.hypot(e.x-s.tx,e.y-s.ty)<s.splash) hurt(e,s.dmg); }); fx.push({k:'ring',x:s.tx,y:s.ty,r:s.splash,c:C.orange,t:.3}); A.tone(110,.08,'triangle',.05); }
        else { s.x += dx/d*stp; s.y += dy/d*stp; } } });
    shots = shots.filter(s=>!s.dead); enemies = enemies.filter(e=>!e.dead);
    fx.forEach(f=>f.t-=dt); fx = fx.filter(f=>f.t>0);
    if (lives<=0) { lives = 0; gameOver(); return; }
    if (state=='wave' && !queue.length && !enemies.length) waveClear(); };
  const draw = () => {
    g.fillStyle = '#2f7a4f'; g.fillRect(0,0,w,h);
    for (let x=0;x<COLS;x++) for (let y=0;y<ROWS;y++) { if (pathSet.has(x+','+y)) { g.fillStyle = '#d8c08a'; g.fillRect(x*T,y*T,T,T); } else if ((x+y)%2) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x*T,y*T,T,T); } }
    if (path.length) { g.strokeStyle = 'rgba(141,91,29,.4)'; g.lineWidth = 3; g.setLineDash([6,8]); g.beginPath(); path.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.stroke(); g.setLineDash([]);
      const [cx,cy] = path[path.length-1]; g.fillStyle = C.orange; g.beginPath(); g.moveTo(cx,cy-16); g.lineTo(cx+16,cy+13); g.lineTo(cx-16,cy+13); g.fill(); g.fillStyle = C.ink; g.beginPath(); g.moveTo(cx,cy-2); g.lineTo(cx+5,cy+13); g.lineTo(cx-5,cy+13); g.fill(); }
    if (hover && (state=='build'||state=='wave')) { const {cc,rr,x,y} = hover;
      if (aim=='meteor') { g.strokeStyle = C.red; g.lineWidth = 2; g.beginPath(); g.arc(x,y,62,0,7); g.stroke(); g.fillStyle = 'rgba(255,69,57,.15)'; g.fill(); }
      else if (build && cc<COLS && rr<ROWS && !pathSet.has(cc+','+rr) && !towers.some(t=>t.c==cc&&t.r==rr)) { const D = TW[build];
        g.fillStyle = gold>=D.cost ? 'rgba(213,243,103,.35)' : 'rgba(255,69,57,.3)'; g.fillRect(cc*T,rr*T,T,T);
        if (D.range) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cc*T+T/2,rr*T+T/2,D.range,0,7); g.stroke(); } } }
    towers.forEach(t=>{ const D = TW[t.type], x = t.c*T, y = t.r*T;
      if (sel===t && D.range) { const S = tstat(t); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(x+T/2,y+T/2,S.range,0,7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,.25)'; rrect(g,x+5,y+7,31,31,8); g.fill();
      g.fillStyle = D.col; rrect(g,x+4,y+4,32,32,8); g.fill();
      if (sel===t) { g.strokeStyle = '#fff'; g.lineWidth = 3; rrect(g,x+3,y+3,34,34,9); g.stroke(); }
      if (t.ang!=null && D.range) { g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(x+T/2,y+T/2); g.lineTo(x+T/2+Math.cos(t.ang)*15,y+T/2+Math.sin(t.ang)*15); g.stroke(); }
      g.fillStyle = C.ink; g.font = '700 15px '+A.font; g.textAlign = 'center'; g.fillText(D.L,x+T/2,y+T/2+5);
      for (let i=0;i<t.lvl;i++) { g.fillStyle = C.lime; g.fillRect(x+9+i*8,y+31,6,3); } });
    enemies.forEach(e=>{ const D = EN[e.type];
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(e.x,e.y+D.r*.7,D.r,D.r*.4,0,0,7); g.fill();
      g.fillStyle = freezeT>0 ? '#bfe9ff' : D.col; g.beginPath(); g.arc(e.x,e.y,D.r,0,7); g.fill();
      if (e.type=='armadillo'||e.type=='bear') { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; for (const o of [-4,0,4]) { g.beginPath(); g.moveTo(e.x+o,e.y-D.r+2); g.lineTo(e.x+o,e.y+D.r-2); g.stroke(); } }
      if (e.type=='bear') { g.fillStyle = D.col; g.beginPath(); g.arc(e.x-11,e.y-12,6,0,7); g.arc(e.x+11,e.y-12,6,0,7); g.fill(); }
      if (e.type=='hare') { g.fillStyle = D.col; g.fillRect(e.x-5,e.y-D.r-8,3,9); g.fillRect(e.x+2,e.y-D.r-8,3,9); }
      if (e.type=='toad') { g.strokeStyle = 'rgba(213,243,103,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(e.x,e.y,D.r+5+Math.sin(performance.now()/200)*2,0,7); g.stroke(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(e.x-3,e.y-2,2,0,7); g.arc(e.x+3,e.y-2,2,0,7); g.fill();
      if (e.slowT>0) { g.strokeStyle = C.sky; g.lineWidth = 2; g.beginPath(); g.arc(e.x,e.y,D.r+2,0,7); g.stroke(); }
      if (e.hp<e.max) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(e.x-D.r,e.y-D.r-7,D.r*2,3); g.fillStyle = e.hp/e.max>.5?C.lime:e.hp/e.max>.25?C.gold:C.red; g.fillRect(e.x-D.r,e.y-D.r-7,D.r*2*Math.max(0,e.hp/e.max),3); } });
    shots.forEach(s=>{ if (s.k=='arrow') { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(s.x,s.y); g.lineTo(s.x-Math.cos(s.a)*9,s.y-Math.sin(s.a)*9); g.stroke(); }
      else { g.fillStyle = '#7a5a3a'; g.beginPath(); g.arc(s.x,s.y,5,0,7); g.fill(); } });
    fx.forEach(f=>{ g.globalAlpha = Math.min(1,f.t*4);
      if (f.k=='line') { g.strokeStyle = f.c; g.lineWidth = 3; g.beginPath(); g.moveTo(f.x1,f.y1); g.lineTo(f.x2,f.y2); g.stroke(); }
      if (f.k=='ring') { g.strokeStyle = f.c; g.lineWidth = 3; g.beginPath(); g.arc(f.x,f.y,f.r*(1-f.t*.8),0,7); g.stroke(); }
      if (f.k=='txt') { g.fillStyle = f.c; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(f.s,f.x,f.y-(.8-f.t)*20); } });
    g.globalAlpha = 1;
    if (freezeT>0) { g.fillStyle = 'rgba(100,205,245,.12)'; g.fillRect(0,0,w,h); }
    if (rallyT>0) { g.strokeStyle = C.gold; g.lineWidth = 4; g.strokeRect(2,2,w-4,h-4); }
    if (flash>0) { g.fillStyle = 'rgba(255,69,57,'+flash+')'; g.fillRect(0,0,w,h); }
    if (state!='menu') { g.fillStyle = 'rgba(18,19,19,.7)'; rrect(g,6,6,300,26,13); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'left';
      g.fillText('WAVE '+wave+'    ♥ '+lives+'    ● '+gold+' gold',16,24);
      if (state=='build' && wave>0) { g.textAlign = 'right'; g.fillStyle = C.lime; g.fillText('Next wave in '+Math.ceil(between)+'s',w-10,24); } }
    if (banner && banner.t>0 && state!='menu') { g.globalAlpha = Math.min(1,banner.t); g.fillStyle = 'rgba(1,86,64,.85)'; rrect(g,60,160,360,banner.sub?70:46,14); g.fill();
      g.fillStyle = C.lime; g.textAlign = 'center'; g.font = '700 22px '+A.font; g.fillText(banner.txt,w/2,191); if (banner.sub) { g.fillStyle = '#fff'; g.font = '500 13px '+A.font; g.fillText(banner.sub,w/2,214,340); } g.globalAlpha = 1; }
    if (state=='menu') A.overlayText(g,w,h,'TRAILHEAD DEFENSE','Pick a trail below. Hold the camp as long as you can.');
    if (state=='over') A.overlayText(g,w,h,'CAMP OVERRUN','Reached wave '+wave+' · score '+score.toLocaleString()+' · click to play again');
  };
  // ---- toolbar ----
  const mk = (txt,fn,extra) => { const x = el('button',Object.assign({fontFamily:A.font,fontWeight:700,fontSize:'12px',border:'none',borderRadius:'10px',padding:'6px 6px',cursor:'pointer',lineHeight:1.15,whiteSpace:'nowrap'},extra||{}),txt); x.onclick = e=>{ e.stopPropagation(); fn(); x.blur(); }; return x; };
  const menuRow = el('div',{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'});
  const towerRow = el('div',{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'});
  const ctlRow = el('div',{display:'grid',gridTemplateColumns:'repeat(3,1fr) 1.3fr .6fr',gap:'6px'});
  const selRow = el('div',{display:'flex',gap:'6px',alignItems:'center'});
  bar.append(menuRow,towerRow,ctlRow,selRow);
  const quizRow = el('div',{display:'none',alignItems:'center',gap:'6px',flexWrap:'wrap',background:'#dff3fc',borderRadius:'10px',padding:'6px 8px'}); bar.appendChild(quizRow); let quiz = null;
  const askQuiz = () => { quiz = A.problem(); quizRow.innerHTML = ''; quizRow.append(el('div',{flex:'1',minWidth:'140px',fontWeight:700,fontSize:'13px',color:'#014987'},'BONUS GOLD · '+A.qText(quiz)));
    quiz.choices.forEach(v=>quizRow.appendChild(mk(String(v),()=>answerQuiz(v),{background:'#ffffff',color:C.forest,padding:'7px 14px',fontSize:'14px'}))); ui(); };
  const answerQuiz = v => { if (!quiz) return; const ok = v===quiz.a; try { api.edu && api.edu(ok); } catch(e){}
    if (ok) { const bonus = 25+wave*4; gold += bonus; say('CORRECT!','+'+bonus+' gold'); A.sfx('coin'); } else { say('NOT QUITE', A.solved(quiz)); A.sfx('bad'); } quiz = null; ui(); };
  const tBtn = {}; Object.entries(TW).forEach(([id,D])=>{ const x = mk('',()=>{ build = id; sel = null; aim = null; A.sfx('blip'); ui(); }); x.title = D.d; tBtn[id] = x; towerRow.appendChild(x); });
  const aBtn = {}; Object.keys(AB).forEach(id=>{ const x = mk('',()=>{ if (cds[id]>0) return A.sfx('bad'); if (id=='meteor') { aim = aim=='meteor'?null:'meteor'; ui(); } else cast(id); }); aBtn[id] = x; ctlRow.appendChild(x); });
  const nextBtn = mk('',()=>startWave()); const fastBtn = mk('',()=>{ fast = !fast; ui(); }); ctlRow.append(nextBtn,fastBtn);
  const selLbl = el('div',{flex:1,minWidth:0,color:'#fff',fontWeight:700,fontSize:'12px'});
  const upBtn = mk('',()=>upgrade()), sellBtn = mk('',()=>sell()), modeBtn = mk('',()=>{ if (!sel) return; sel.mode = {first:'strong',strong:'close',close:'first'}[sel.mode||'first']; ui(); }), doneBtn = mk('Done',()=>{ sel = null; ui(); });
  selRow.append(selLbl,upBtn,sellBtn,modeBtn,doneBtn);
  const upgrade = () => { if (!sel || sel.lvl>=3) return; const cst = upCost(sel); if (gold<cst) return A.sfx('bad'); gold -= cst; sel.spent += cst; sel.lvl++; A.sfx('coin'); ui(); };
  const sell = () => { if (!sel) return; gold += sellVal(sel); towers = towers.filter(t=>t!==sel); sel = null; A.sfx('flip'); ui(); };
  const paintBtn = (x,on,ok) => { x.style.background = on ? C.lime : ok ? '#ffffff' : 'rgba(255,255,255,.25)'; x.style.color = on ? C.forest : ok ? C.forest : '#d8e6df'; x.style.cursor = ok ? 'pointer' : 'not-allowed'; };
  const ui = () => {
    const playing = state=='build' || state=='wave';
    quizRow.style.display = quiz && state=='build' ? 'flex' : 'none';
    menuRow.style.display = playing ? 'none' : 'flex'; towerRow.style.display = playing ? 'grid' : 'none';
    ctlRow.style.display = playing && !sel ? 'grid' : 'none'; selRow.style.display = playing && sel ? 'flex' : 'none';
    if (!playing) { menuRow.innerHTML = ''; menuRow.appendChild(el('div',{color:C.lime,fontWeight:700,fontSize:'12px',letterSpacing:'.08em',marginRight:'4px'},'TRAILS'));
      const R = api.resume; if (R && R.towers && !resumedUsed) menuRow.appendChild(mk('Resume · wave '+(R.wave+1)+' on '+MAPS[R.map].name,()=>{ resumedUsed = true; newGame(R.map,R); },{background:C.gold,color:C.forest,padding:'8px 10px',fontSize:'13px'}));
      MAPS.forEach((m,i)=>menuRow.appendChild(mk(m.name,()=>{ resumedUsed = true; newGame(i); A.sfx('blip'); },{background:C.lime,color:C.forest,padding:'8px 10px',fontSize:'13px'}))); return; }
    Object.entries(TW).forEach(([id,D])=>{ const x = tBtn[id]; x.textContent = ''; x.append(el('div',{},D.k+' · '+D.n), el('div',{fontSize:'11px',fontWeight:500},D.cost+' gold')); paintBtn(x,build==id,gold>=D.cost); });
    Object.entries(AB).forEach(([id,D])=>{ const x = aBtn[id], cd = cds[id]; x.textContent = D.k+' · '+D.n+(cd>0?' '+Math.ceil(cd)+'s':''); paintBtn(x,aim==id,cd<=0); });
    nextBtn.textContent = state=='wave' ? 'Wave '+wave+' · '+(queue.length+enemies.length)+' left' : (wave==0 ? 'Space · Start wave 1' : 'Space · Next wave'); paintBtn(nextBtn,state=='build',state=='build');
    fastBtn.textContent = fast ? '2× speed' : '1× speed'; paintBtn(fastBtn,fast,true);
    if (sel) { const D = TW[sel.type], S = tstat(sel);
      selLbl.textContent = D.n+' · Lv '+sel.lvl+(D.range ? ' · '+Math.round(S.dmg)+' dmg' : ' · +'+S.inc+' gold/wave');
      upBtn.textContent = sel.lvl>=3 ? 'Max level' : 'U · Upgrade '+upCost(sel); paintBtn(upBtn,false,sel.lvl<3 && gold>=upCost(sel));
      sellBtn.textContent = 'Sell +'+sellVal(sel); paintBtn(sellBtn,false,true);
      modeBtn.style.display = D.range ? '' : 'none'; modeBtn.textContent = 'Target · '+({first:'First',strong:'Strong',close:'Close'}[sel.mode||'first']); paintBtn(modeBtn,false,true); paintBtn(doneBtn,false,true); } };
  let resumedUsed = false;
  const at = e => { const r = c.getBoundingClientRect(), x = (e.clientX-r.left)*w/r.width, y = (e.clientY-r.top)*h/r.height; return {x,y,cc:Math.floor(x/T),rr:Math.floor(y/T)}; };
  c.addEventListener('contextmenu',e=>e.preventDefault());
  c.addEventListener('mousemove',e=>{ hover = at(e); });
  c.addEventListener('mouseleave',()=>{ hover = null; });
  c.addEventListener('mousedown',e=>{ const p = at(e);
    if (state=='over') { state = 'menu'; ui(); return; } if (state=='menu') return;
    if (e.button==2) { sel = null; aim = null; ui(); return; }
    if (aim=='meteor') { if (cast('meteor',p.x,p.y)) aim = null; ui(); return; }
    const t = towers.find(t=>t.c==p.cc && t.r==p.rr); if (t) { sel = sel===t ? null : t; A.sfx('blip'); ui(); return; }
    if (sel) { sel = null; ui(); }
    if (!build || p.cc>=COLS || p.rr>=ROWS || pathSet.has(p.cc+','+p.rr)) return;
    const D = TW[build]; if (gold<D.cost) { A.sfx('bad'); float(p.x,p.y,'Need '+D.cost+' gold',C.red); return; }
    gold -= D.cost; towers.push({c:p.cc,r:p.rr,type:build,lvl:1,spent:D.cost,mode:'first',cd:0}); A.sfx('hit'); ui(); });
  const offK = A.keys(e=>{ if (state!='build' && state!='wave') return; const k = e.key.length==1 ? e.key.toLowerCase() : e.key;
    const tid = Object.keys(TW).find(id=>TW[id].k==k); if (tid) { build = tid; sel = null; aim = null; ui(); return; }
    if (k=='q') { aim = aim=='meteor'?null:'meteor'; ui(); } if (k=='w') cast('freeze'); if (k=='e') cast('rally');
    if (k=='u') upgrade(); if (k==' ') startWave(); });
  let ut = 0;
  const offL = A.loop(dt=>{ if (state=='build' || state=='wave') tick(dt); draw(); ut += dt; if (ut>.25) { ut = 0; if (state=='build'||state=='wave') ui(); } });
  api.snap && api.snap(()=> (state=='build'||state=='wave') && (wave>0 || towers.length) ? {map, wave: state=='wave' ? wave-1 : wave, gold, lives, score, perfect, towers: towers.map(({c,r,type,lvl,spent,mode})=>({c,r,type,lvl,spent,mode}))} : null);
  setMap(0); ui();
  return ()=>{ offK(); offL(); };
}});

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
  const reset = () => { level = 1; score = 0; lives = A.D(5,4,3); dens = [0,0,0,0,0]; shieldN = 0; slowT = 0; pickup = null; fly = null; resumed = false; lanes = mkLanes(); respawn(); api.score(0); newProb(); };
  const respawn = () => { px = 240; pr = 11; furthest = 11; };
  const submerged = o => level>=2 && o.dive && Math.sin(time*1.1+o.ph) < -.55;
  const sinking = o => level>=2 && o.dive && Math.sin(time*1.1+o.ph) < -.2;
  const laneOf = r => lanes.find(l=>l.r==r);
  const die = m => { if (deadT>0 || st!='play') return;
    if (shieldN>0) { shieldN--; banner = {t:1.4,txt:'SHIELD POPPED',sub:'Back to the start, no life lost'}; A.sfx('blip'); respawn(); return; }
    lives--; deadT = .9; deadMsg = m; A.sfx('bad');
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
  const tick = dt => { time += dt; if (slowT>0) slowT -= dt; const m = slowT>0 ? .5 : 1; if (banner) banner.t -= dt; hopA = Math.max(0,hopA-dt*8);
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
  const draw = () => {
    g.fillStyle = '#0f4a2e'; g.fillRect(0,0,w,T);
    DENX.forEach((x,i)=>{ g.fillStyle = C.blue; rrect(g,x-22,6,44,34,10); g.fill(); if (learn && !dens[i] && denLab[i]!=null) { g.fillStyle = '#fff'; g.font = '700 '+(String(denLab[i]).length>2?13:17)+'px '+A.font; g.textAlign = 'center'; g.fillText(denLab[i], x, 29); } if (dens[i]) { g.fillStyle = C.lime; g.beginPath(); g.arc(x,24,11,0,7); g.fill(); g.fillStyle = C.ink; g.beginPath(); g.arc(x-4,21,2,0,7); g.arc(x+4,21,2,0,7); g.fill(); }
      if (fly && fly.i==i) { g.fillStyle = C.gold; g.beginPath(); g.arc(x,24,5+Math.sin(time*12),0,7); g.fill(); } });
    g.fillStyle = C.blue; g.fillRect(0,T,w,5*T);
    g.fillStyle = '#7a6aa8'; g.fillRect(0,6*T,w,T); g.fillStyle = 'rgba(255,255,255,.12)'; for (let x=0;x<w;x+=20) g.fillRect(x,6*T+18,10,4);
    g.fillStyle = '#3a3a3a'; g.fillRect(0,7*T,w,4*T); g.fillStyle = 'rgba(255,255,255,.35)'; for (let r=8;r<=10;r++) for (let x=0;x<w;x+=40) g.fillRect(x,r*T-1,20,2);
    g.fillStyle = '#2f7a4f'; g.fillRect(0,11*T,w,T);
    lanes.forEach(l=>{ const y = l.r*T; l.objs.forEach(o=>{ const L = o.len*T;
      if (l.kind=='log') { g.fillStyle = '#8D5B1D'; rrect(g,o.x,y+6,L,28,12); g.fill(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(o.x+10,y+15,L-20,3); }
      else if (l.kind=='turtle') { g.globalAlpha = submerged(o) ? .18 : sinking(o) ? .55 : 1; for (let k=0;k<o.len;k++) { g.fillStyle = C.green; g.beginPath(); g.arc(o.x+k*T+T/2,y+T/2,15,0,7); g.fill(); g.fillStyle = '#028a4e'; g.beginPath(); g.arc(o.x+k*T+T/2,y+T/2,8,0,7); g.fill(); } g.globalAlpha = 1; }
      else if (l.kind=='gator') { g.fillStyle = '#3d6b4f'; rrect(g,o.x,y+8,L,24,10); g.fill(); const mx = l.dir>0 ? o.x+L-T : o.x; g.fillStyle = '#2b4f39'; g.fillRect(mx,y+8,T,24); g.fillStyle = '#fff'; for (let k=0;k<4;k++) g.fillRect(mx+5+k*8,y+18,4,4); g.fillStyle = C.gold; g.beginPath(); g.arc(l.dir>0?mx+8:mx+T-8,y+12,3,0,7); g.fill(); }
      else { const col = {truck:C.sand,car:C.sky,tractor:C.orange,racer:C.pink}[l.kind]; g.fillStyle = col; rrect(g,o.x+2,y+7,L-4,26,7); g.fill(); g.fillStyle = 'rgba(18,19,19,.55)'; const wx = l.dir>0 ? o.x+L-16 : o.x+6; g.fillRect(wx,y+11,10,18);
        if (l.kind=='tractor') { g.fillStyle = C.ink; g.beginPath(); g.arc(o.x+L/2,y+30,8,0,7); g.fill(); } } }); });
    if (pickup) { g.fillStyle = pickup.kind=='shield' ? C.mint : C.lavender; g.beginPath(); g.arc(pickup.x,6*T+20,10+Math.sin(time*6)*1.5,0,7); g.fill(); g.fillStyle = C.ink; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText(pickup.kind=='shield'?'S':'◷',pickup.x,6*T+24); }
    if (st!='dead') { const y = pr*T+T/2 - hopA*6;
      if (deadT>0) { g.fillStyle = C.red; g.font = '700 16px '+A.font; g.textAlign = 'center'; g.fillText(deadMsg,px,y+5); }
      else { g.fillStyle = C.lime; g.beginPath(); g.arc(px,y,13,0,7); g.fill(); g.fillStyle = '#9fe07a'; g.beginPath(); g.arc(px-8,y-9,5,0,7); g.arc(px+8,y-9,5,0,7); g.fill();
        g.fillStyle = C.ink; g.beginPath(); g.arc(px-8,y-9,2.2,0,7); g.arc(px+8,y-9,2.2,0,7); g.fill();
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
    if (!fits(cur.m,cur.x,cur.y)) { const die = () => { st = 'dead'; A.sfx('over'); stat(api,'stackLines',lines); api.over(score); };
      if (A.learnOn() && chances>0) { chances--; quizzing = true; A.quiz(host,'STACKED OUT · ANSWER FOR A SECOND CHANCE',ok=>{ quizzing = false; edu(ok); if (ok) { for (let i=0;i<5;i++) { grid.pop(); grid.unshift(Array(CW).fill(0)); } banner = {t:1.6,txt:'SECOND CHANCE',sub:'Five rows cleared'}; if (!fits(cur.m,cur.x,cur.y)) die(); } else die(); }); }
      else die(); } };
  const reset = () => { grid = [...Array(CH)].map(()=>Array(CW).fill(0)); score = 0; lines = 0; level = 1; saws = 1; hold = null; canHold = true; bag = []; next = [draw7(),draw7(),draw7()]; resumed = false; spawnP(); api.score(0); };
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
