(function(){
const A = window.Arcade, C = A.C;

A.register('snake', { mount(host, api){
  if(A.edu&&A.edu.on&&A.snakeMath) return A.snakeMath(host,api);
  const {g,w,h} = A.canvas(host), COLS=20, ROWS=19, S=24, OY=24;
  const LEVELS = [
    {name:'Meadow', wrap:true, cells:()=>[]},
    {name:'Fence Posts', wrap:false, cells:()=>{ const c=[]; for(const [x,y] of [[4,4],[15,4],[4,14],[15,14]]) for(let k=0;k<3;k++){ c.push([x+k*(x<10?1:-1),y],[x,y+k*(y<10?1:-1)]); } return c; }},
    {name:'Crossroads', wrap:true, cells:()=>{ const c=[]; for(let k=3;k<17;k++) if(k<8||k>11) c.push([k,4],[k,14]); for(let k=6;k<13;k++) if(k!=9) c.push([10,k]); return c; }},
    {name:'Boulder Field', wrap:false, cells:()=>{ const c=[]; for(let x=3;x<COLS-2;x+=4) for(let y=3;y<ROWS-2;y+=4) if(!(y>=7&&y<=11&&x<=8)) c.push([x,y],[x+1,y],[x,y+1],[x+1,y+1]); return c; }},
    {name:'Canyon Walls', wrap:true, cells:()=>{ const c=[]; for(let y=0;y<ROWS;y++){ if(y<6||y>12){ c.push([6,y],[13,y]); } } for(let x=0;x<COLS;x++) if(x<3||x>16) c.push([x,3],[x,15]); return c; }},
    {name:'Portal Grove', wrap:false, portals:[[3,3],[16,15]], cells:()=>{ const c=[]; for(let k=0;k<7;k++) c.push([6+k,6],[6+k,12]); for(let k=7;k<12;k++) c.push([6,k],[12,k]); return c.filter(([x,y])=>!(x==6&&y==9)); }},
    {name:'The Maze', wrap:false, cells:()=>{ const c=[]; for(let x=2;x<18;x++){ if(x!=9&&x!=10) c.push([x,5]); if(x!=4&&x!=15) c.push([x,13]); } for(let y=6;y<13;y++) if(y!=9) c.push([2,y],[17,y]); return c; }},
    {name:'Twin Portals', wrap:true, portals:[[2,2],[17,16]], portals2:[[17,2],[2,16]], cells:()=>{ const c=[]; for(let y=2;y<17;y++) if(y<7||y>11) c.push([10,y],[9,y]); return c; }},
  ];
  const ITEMS = {apple:{c:C.red,pts:1}, gold:{c:C.gold,pts:3,ttl:7}, shroom:{c:'#c98bd8',pts:1,ttl:8}, berry:{c:C.sky,pts:1,ttl:8}};
  let st='ready', level=1, score=0, lives=3, eaten=0, snake=[], prev=[], dir={x:1,y:0}, q=[], acc=0, walls=new Set(), portals=[], L=LEVELS[0], items=[], slowT=0, parts=[], banner=null, flash=0, readyT=0, resumed=false, tick=0;
  const need = () => 5 + level*2;
  const K = (x,y) => x+','+y;
  const stepTime = () => Math.max(.07, A.D(.21,.17,.135) - (level-1)*.009 - eaten*.0015) * (slowT>0 ? 1.7 : 1) * (1 + .1*A.U('calm'));
  const occupied = (x,y) => walls.has(K(x,y)) || snake.some(s=>s.x==x&&s.y==y) || items.some(i=>i.x==x&&i.y==y) || portals.some(p=>p.x==x&&p.y==y);
  const freeCell = () => { for (let k=0;k<500;k++){ const x=Math.random()*COLS|0, y=Math.random()*ROWS|0; if(!occupied(x,y) && Math.abs(x-snake[0].x)+Math.abs(y-snake[0].y)>3) return {x,y}; } return {x:1,y:1}; };
  const spawn = (type) => { const c = freeCell(); items.push({...c, type, ttl: ITEMS[type].ttl||0, born: performance.now()}); };
  const loadLevel = () => { L = LEVELS[(level-1)%LEVELS.length]; walls = new Set(L.cells().map(([x,y])=>K(x,y))); for(let x=0;x<=10;x++) walls.delete(K(x,9));
    portals = []; [L.portals, L.portals2].forEach((pp,ix)=>{ if(pp) { portals.push({x:pp[0][0],y:pp[0][1],to:portals.length+1,c:ix?C.sky:C.lavender},{x:pp[1][0],y:pp[1][1],to:portals.length,c:ix?C.sky:C.lavender}); } });
    portals.forEach(p=>walls.delete(K(p.x,p.y))); };
  const placeSnake = () => { snake=[{x:6,y:9},{x:5,y:9},{x:4,y:9},{x:3,y:9}]; prev=snake.map(s=>({...s})); dir={x:1,y:0}; q=[]; acc=0; items=[]; spawn('apple'); readyT=1; };
  const reset = () => { level=1; score=0; lives=A.D(5,3,2)+A.U('life'); eaten=0; slowT=0; resumed=false; loadLevel(); placeSnake(); api.score(0); };
  reset();
  const R = api.resume; if (R && R.v==2) { level=R.level; score=R.score; lives=R.lives; eaten=R.eaten||0; loadLevel(); placeSnake(); api.score(score); resumed=true; }
  const burst = (x,y,c,n=12) => { for(let i=0;i<n;i++){ const a=Math.random()*6.3, v=40+Math.random()*120; parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:.6,c}); } };
  const crash = () => { if (!A.immortal) lives--; flash=.4; A.sfx('bad'); burst(snake[0].x*S+S/2, OY+snake[0].y*S+S/2, C.red, 18);
    if (lives<=0) { st='dead'; A.sfx('over'); api.over(score); return; } banner={t:1.6,txt:'OUCH!',sub:lives+' '+(lives==1?'life':'lives')+' left'}; placeSnake(); };
  const levelUp = () => { level++; eaten=0; score+=5; api.score(score); A.sfx('win'); api.stat&&api.stat('snakeLevel',level); loadLevel(); placeSnake();
    const L2=LEVELS[(level-1)%LEVELS.length]; banner={t:2.4,txt:'LEVEL '+level+' · '+L2.name.toUpperCase(),sub:(L2.wrap?'Dashed edges wrap around':'Solid walls — don’t touch the edges')+(L2.portals?' · portals!':'')}; };
  const step = () => {
    if (q.length) { const n=q.shift(); if (n.x!=-dir.x || n.y!=-dir.y) dir=n; }
    prev = snake.map(s=>({...s}));
    let hx = snake[0].x+dir.x, hy = snake[0].y+dir.y;
    if (L.wrap) { hx=(hx+COLS)%COLS; hy=(hy+ROWS)%ROWS; } else if (hx<0||hy<0||hx>=COLS||hy>=ROWS) return crash();
    const p = portals.find(p=>p.x==hx&&p.y==hy); if (p) { const o=portals[p.to]; hx=o.x+dir.x; hy=o.y+dir.y; if (L.wrap){hx=(hx+COLS)%COLS;hy=(hy+ROWS)%ROWS;} A.tone(880,.08,'sine',.05); }
    if (walls.has(K(hx,hy)) || snake.slice(0,-1).some(s=>s.x==hx&&s.y==hy)) return crash();
    snake.unshift({x:hx,y:hy});
    const ii = items.findIndex(i=>i.x==hx&&i.y==hy);
    if (ii>=0) { const it=items.splice(ii,1)[0], D=ITEMS[it.type]; score+=D.pts; api.score(score); burst(hx*S+S/2, OY+hy*S+S/2, D.c);
      if (it.type=='apple') { eaten++; A.sfx('point'); if (eaten>=need()) return levelUp(); spawn('apple'); const r=Math.random();
        if (r<.16 && !items.some(i=>i.type=='gold')) spawn('gold'); else if (r<.24 && level>=2 && !items.some(i=>i.type=='shroom')) spawn('shroom'); else if (r<.32 && snake.length>8 && !items.some(i=>i.type=='berry')) spawn('berry'); }
      else if (it.type=='gold') { A.sfx('coin'); banner={t:1,txt:'+3 GOLDEN APPLE'}; }
      else if (it.type=='shroom') { slowT=6; A.sfx('coin'); banner={t:1.2,txt:'SLOW-MO',sub:'6 seconds'}; snake.pop(); }
      else if (it.type=='berry') { const cut=Math.min(4,snake.length-4); snake.splice(-cut); prev.splice(-cut); A.sfx('flip'); banner={t:1,txt:'SHRINK -'+cut}; } }
    else { snake.pop(); }
  };
  const offK = A.keys(e=>{ const k=e.key.length==1?e.key.toLowerCase():e.key; const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[k];
    if (k=='p' && (st=='play'||st=='paused')) { st = st=='play'?'paused':'play'; return; }
    if (st!='play') { if (k==' '||k=='Enter'||m) { if (st=='dead') reset(); if (st!='paused') st='play'; else st='play'; } if(!m) return; }
    if (m) { const last = q.length ? q[q.length-1] : dir; if ((m[0]!=-last.x||m[1]!=-last.y) && (m[0]!=last.x||m[1]!=last.y) && q.length<3) q.push({x:m[0],y:m[1]}); } });
  const rr = (x,y,ww,hh,r) => { g.beginPath(); g.roundRect ? g.roundRect(x,y,ww,hh,r) : g.rect(x,y,ww,hh); };
  const draw = (f) => {
    g.fillStyle='#0d4a35'; g.fillRect(0,0,w,h);
    for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++) { g.fillStyle=(x+y)%2?'#10573f':'#0f5139'; g.fillRect(x*S,OY+y*S,S,S); }
    if (L.wrap) { g.strokeStyle='rgba(213,243,103,.35)'; g.setLineDash([6,6]); g.lineWidth=2; g.strokeRect(1,OY+1,w-2,ROWS*S-2); g.setLineDash([]); }
    else { g.strokeStyle='#8D5B1D'; g.lineWidth=4; g.strokeRect(2,OY+2,w-4,ROWS*S-4); }
    walls.forEach(key=>{ const [x,y]=key.split(',').map(Number); g.fillStyle='#6e6a5e'; rr(x*S+1,OY+y*S+1,S-2,S-2,6); g.fill(); g.fillStyle='rgba(255,255,255,.12)'; rr(x*S+4,OY+y*S+3,S-12,6,3); g.fill(); });
    portals.forEach(p=>{ const cx=p.x*S+S/2, cy=OY+p.y*S+S/2; for(let r=3;r>0;r--){ g.strokeStyle=p.c; g.globalAlpha=.25*r; g.lineWidth=2; g.beginPath(); g.arc(cx,cy,(S/2-2)*(r/3)+Math.sin(tick*4+r)*1.5,0,7); g.stroke(); } g.globalAlpha=1; g.fillStyle=p.c; g.globalAlpha=.55+.25*Math.sin(tick*5); g.beginPath(); g.arc(cx,cy,5,0,7); g.fill(); g.globalAlpha=1; g.strokeStyle=p.c; g.lineWidth=2.5; g.beginPath(); g.arc(cx,cy,S/2-2,tick*3,tick*3+4.2); g.stroke(); });
    const now = performance.now();
    items.forEach(it=>{ const cx=it.x*S+S/2, cy=OY+it.y*S+S/2, bob=Math.sin(tick*5+it.x)*1.5, D=ITEMS[it.type]; let fade=1;
      if (it.ttl) { const left=it.ttl-(now-it.born)/1000; if (left<2) fade=.4+.6*Math.abs(Math.sin(left*8)); } g.globalAlpha=fade;
      if (it.type=='shroom') { g.fillStyle='#f1e6d0'; g.fillRect(cx-3,cy+bob,6,8); g.fillStyle=D.c; g.beginPath(); g.arc(cx,cy+bob,9,Math.PI,0); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(cx-3,cy-4+bob,1.6,0,7); g.arc(cx+3,cy-3+bob,1.3,0,7); g.fill(); }
      else if (it.type=='berry') { g.fillStyle=D.c; [[-3,0],[3,0],[0,-4],[0,3]].forEach(([dx,dy])=>{ g.beginPath(); g.arc(cx+dx,cy+dy+bob,4,0,7); g.fill(); }); }
      else { g.fillStyle=D.c; g.beginPath(); g.arc(cx-3,cy+1+bob,7,0,7); g.arc(cx+3,cy+1+bob,7,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.45)'; g.beginPath(); g.arc(cx-4,cy-2+bob,2.2,0,7); g.fill();
        g.strokeStyle='#5a3a12'; g.lineWidth=2; g.beginPath(); g.moveTo(cx,cy-5+bob); g.lineTo(cx+1,cy-9+bob); g.stroke(); g.fillStyle=C.green; g.beginPath(); g.ellipse(cx+4,cy-8+bob,4,2,-.5,0,7); g.fill();
        if (it.type=='gold') { g.strokeStyle='rgba(249,191,1,.6)'; g.lineWidth=1.5; g.beginPath(); g.arc(cx,cy+bob,12+Math.sin(tick*6)*2,0,7); g.stroke(); } }
      g.globalAlpha=1; });
    const pts = snake.map((s,i)=>{ const p0=prev[i]||s; const jump=Math.abs(p0.x-s.x)+Math.abs(p0.y-s.y)>1; const fx=jump?s.x:p0.x+(s.x-p0.x)*f, fy=jump?s.y:p0.y+(s.y-p0.y)*f; return {x:fx*S+S/2, y:OY+fy*S+S/2, jump}; });
    const runs=[]; let cur=[]; pts.forEach((pt,i)=>{ if (i && Math.hypot(pt.x-pts[i-1].x,pt.y-pts[i-1].y)>S*1.5) { runs.push(cur); cur=[]; } cur.push(pt); }); runs.push(cur);
    const path = r => { g.beginPath(); r.forEach((pt,i)=>i?g.lineTo(pt.x,pt.y):g.moveTo(pt.x,pt.y)); if (r.length==1) g.lineTo(r[0].x+.1,r[0].y); };
    g.lineCap='round'; g.lineJoin='round';
    runs.forEach(r=>{ g.strokeStyle='#014a37'; g.lineWidth=S-1; path(r); g.stroke(); });
    runs.forEach(r=>{ g.strokeStyle= slowT>0 ? '#c98bd8' : '#00B451'; g.lineWidth=S-6; path(r); g.stroke(); });
    runs.forEach(r=>{ g.strokeStyle='rgba(213,243,103,.35)'; g.lineWidth=4; g.setLineDash([4,10]); path(r); g.stroke(); g.setLineDash([]); });
    const hd=pts[0]; if (hd) { g.fillStyle=C.lime; g.beginPath(); g.arc(hd.x,hd.y,S/2-1,0,7); g.fill(); g.strokeStyle='#015640'; g.lineWidth=2; g.stroke();
      const ex=dir.x, ey=dir.y, px=-ey, py=ex; [1,-1].forEach(sd=>{ const cx=hd.x+ex*3+px*5*sd, cy=hd.y+ey*3+py*5*sd; g.fillStyle='#fff'; g.beginPath(); g.arc(cx,cy,3.6,0,7); g.fill(); g.fillStyle=C.ink; g.beginPath(); g.arc(cx+ex*1.3,cy+ey*1.3,1.8,0,7); g.fill(); });
      if (Math.sin(tick*7)>.3) { g.strokeStyle=C.red; g.lineWidth=2; g.beginPath(); g.moveTo(hd.x+ex*10,hd.y+ey*10); g.lineTo(hd.x+ex*16,hd.y+ey*16); g.lineTo(hd.x+ex*18+px*3,hd.y+ey*18+py*3); g.moveTo(hd.x+ex*16,hd.y+ey*16); g.lineTo(hd.x+ex*18-px*3,hd.y+ey*18-py*3); g.stroke(); } }
    parts.forEach(p=>{ g.globalAlpha=Math.max(0,p.t/.6); g.fillStyle=p.c; g.fillRect(p.x-2,p.y-2,4,4); }); g.globalAlpha=1;
    if (flash>0) { g.fillStyle='rgba(255,69,57,'+flash*.7+')'; g.fillRect(0,0,w,h); }
    g.fillStyle='#0b2e24'; g.fillRect(0,0,w,OY); g.font='700 13px '+A.font; g.textBaseline='middle';
    g.textAlign='left'; g.fillStyle=C.lime; g.fillText('LV '+level+' · '+L.name.toUpperCase(),8,OY/2+1);
    const bx=190, n=need(); g.fillStyle='rgba(255,255,255,.15)'; rr(bx,7,110,10,5); g.fill(); g.fillStyle=C.red; rr(bx,7,110*Math.min(1,eaten/n),10,5); g.fill();
    g.fillStyle='#fff'; g.font='700 11px '+A.font; g.fillText(eaten+'/'+n,bx+116,OY/2+1);
    g.textAlign='right'; g.font='700 13px '+A.font; g.fillStyle='#ffd0e8'; g.fillText('♥'.repeat(Math.max(0,lives)),w-70,OY/2+1); g.fillStyle='#fff'; g.fillText(score,w-8,OY/2+1); g.textBaseline='alphabetic';
    if (slowT>0) { g.fillStyle='#c98bd8'; g.font='700 11px '+A.font; g.textAlign='right'; g.fillText('SLOW '+Math.ceil(slowT),w-8,OY+16); }
    if (banner && banner.t>0) { g.globalAlpha=Math.min(1,banner.t); g.fillStyle='rgba(1,86,64,.9)'; rr(50,190,380,banner.sub?66:44,14); g.fill(); g.textAlign='center'; g.fillStyle=C.lime; g.font='700 20px '+A.font; g.fillText(banner.txt,w/2,220,360); if (banner.sub) { g.fillStyle='#fff'; g.font='500 13px '+A.font; g.fillText(banner.sub,w/2,243,360); } g.globalAlpha=1; }
    if (st=='play' && readyT>0) { g.textAlign='center'; g.fillStyle='rgba(255,255,255,'+Math.min(1,readyT*2)+')'; g.font='700 26px '+A.font; g.fillText('READY',w/2,OY+5*S); }
    if (st=='ready') A.overlayText(g,w,h,resumed?'PAUSED':'SNAKE',resumed?'Level '+level+' · Space or an arrow to continue':'Arrows/WASD · eat apples to clear each level · Space');
    if (st=='paused') A.overlayText(g,w,h,'PAUSED','Press P to keep going');
    if (st=='dead') A.overlayText(g,w,h,'GAME OVER','Level '+level+' · score '+score+' · Space to play again');
  };
  const offL = A.loop(dt=>{ tick+=dt;
    parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92;p.t-=dt;}); parts=parts.filter(p=>p.t>0); flash=Math.max(0,flash-dt); if (banner) banner.t-=dt;
    if (st=='play') { if (readyT>0) readyT-=dt; else { slowT=Math.max(0,slowT-dt); const now=performance.now(); items=items.filter(i=>!i.ttl || (now-i.born)/1000<i.ttl);
        acc+=dt; const stp=stepTime(); while (acc>=stp && st=='play') { acc-=stp; step(); } } }
    draw(st=='play'&&readyT<=0 ? Math.min(1,acc/stepTime()) : 1); });
  api.snap && api.snap(()=> st=='dead' || (st=='ready' && !resumed) ? null : {v:2, level, score, lives, eaten});
  return ()=>{offK();offL();};
}});

A.register('breakout', { mount(host, api){
  const {c,g,w,h}=A.canvas(host), R=6, cols=10, bw=w/cols, BH=18;
  const colors=[C.pink,C.orange,C.gold,C.lime,C.sky,C.lavender,C.mint,C.peach];
  const PW={wide:{c:C.lime,t:'W'},multi:{c:C.sky,t:'M'},life:{c:C.pink,t:'+'},slow:{c:C.lavender,t:'S'},fire:{c:C.red,t:'F'},laser:{c:C.gold,t:'L'},bomb:{c:C.orange,t:'B'},catch:{c:C.mint,t:'C'}};
  let quizzing=false; const edu=ok=>{try{api.edu&&api.edu(ok);}catch(e){}};
  let boss=null,shots=[],shrinkT=0,phaseT=0,fireT=0,laserT=0,catchT=0,bombN=0,boltT=0,bolts=[],parts=[],rings=[],comboT=0,px,pw,balls,bricks,drops,score,lives,level,combo,state='ready',left=0,right=0,wideT,wideN=0,slowT,flash,banner;
  const spd=()=>Math.min(A.D(460,560,640),A.D(240,300,370)+level*A.D(16,22,28))*(slowT>0?.7:1);
  const serve=()=>{balls=[{x:px,y:h-40,vx:0,vy:0,stuck:true}];};
  const launch=b=>{const a=(-Math.PI/2)+(Math.random()-.5)*.8,v=spd();b.vx=Math.cos(a)*v;b.vy=Math.sin(a)*v;b.stuck=false;};
  const bm=rows=>[(r,k)=>rows[r]&&rows[r][k]=='1',8];
  const SHAPES=[[()=>true],[(r,k)=>(r+k)%2==0],[(r,k)=>Math.abs(k-4.5)<=r+.5],[(r,k,n)=>Math.abs(k-4.5)<=n-r-.5],
    [(r,k,n)=>Math.abs(k-4.5)/5+Math.abs(r-(n-1)/2)/(n/2)<=1.05],
    bm(['0011111100','0111111110','1101111011','1111111111','0110000110','0011001100','0110000110','1000000001']),
    [(r,k,n)=>r==0||r==n-1||k==0||k==9||(r==(n>>1)&&k>2&&k<7)],[(r,k)=>(k!=2&&k!=7)||r==0],[(r,k)=>(k+r)%4<2],
    bm(['0110000110','1111001111','1111111111','1111111111','0111111110','0011111100','0001111000','0000110000']),
    [(r,k,n)=>Math.abs((k-4.5)-(r-(n-1)/2)*1.25)<1.3||Math.abs((k-4.5)+(r-(n-1)/2)*1.25)<1.3],
    [(r,k,n)=>{const d=Math.hypot((k-4.5)/1.25,r-(n-1)/2); return (d>1.6&&d<3.4)||d<.8;}],
    bm(['1000000001','1100000011','1110000111','1111111111','1111111111','0111111110','0011111100','0001111000'])];
  const BOSSES=[{n:'BIG BRICK',w:200,h:52,s:60,q:'Built to block.'},{n:'KING CINDERBLOCK',w:170,h:48,s:80,q:'Kneel before the wall!'},{n:'TIMMY',w:110,h:56,s:150,q:"Bet you can't hit me!"},{n:'LORD EMPEROR BAU BAU',w:160,h:50,s:90,q:'You dare approach the throne?'},{n:'THE TIMMY',w:190,h:60,s:110,q:'There is only one.'},{n:'LITTLE TIMMY',w:80,h:40,s:200,q:'Catch me if you can!'},{n:'JIMMY',w:150,h:46,s:90,q:'My shield, my rules.'},{n:'THE VOID',w:110,h:110,s:40,q:'Everything falls in.'},{n:'MIRROR MAX',w:130,h:32,s:0,q:'Whatever you do, I do.'},{n:'THE BRICK QUEEN',w:150,h:50,s:70,q:'Rise, my bricks!'}];
  const build=()=>{ bricks=[]; shots=[]; bolts=[]; boss=null; shrinkT=0;
    if(level%5==0){ const kind=(level/5-1)%BOSSES.length, d=BOSSES[kind], cyc=Math.floor((level/5-1)/BOSSES.length), mhp=Math.round((16+level*4)*A.D(.8,1,1.3)*(1+cyc*.5));
      boss={kind,cyc,sh:1,dashT:0,rage:cyc>0?1:0,x:w/2-d.w/2,y:kind==7?60:80,w:d.w,h:d.h,hp:mhp,max:mhp,vx:(d.s+level*4)*(Math.random()<.5?-1:1),ft:2,ft2:4,dg:0,t:0,tp:0,hitT:0,name:d.n+(cyc?' MK '+(cyc+1):'')};
      for(const k of[0,1,3,4,5,6,8,9]){const hp=1+Math.ceil(level/5); bricks.push({x:k*bw,y:190,r:2,hp,max:hp,alive:1});}
      drops=[]; banner={t:2.6,txt:'BOSS: '+d.n,sub:'“'+d.q+'”'}; return; }
    const sh=SHAPES[(level-Math.floor(level/5)-1)%SHAPES.length], rows=sh[1]||Math.min(8,4+Math.floor(level/2));
    for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){ if(!sh[0](r,k,rows)) continue;
      const hp=1+(r<Math.floor(level/2)?Math.ceil(level/3):0);
      bricks.push({x:k*bw,y:46+r*(BH+4),r,hp,max:hp,alive:1,tnt:level>=3&&Math.random()<.07,gold:Math.random()<.04,mv:(level>=8&&level%2==0&&r%2)?(40+Math.min(200,level*2))*(r%4==1?1:-1):0}); }
    drops=[]; banner={t:1.6,txt:'LEVEL '+level}; };
  const reset=()=>{px=w/2;pw=A.D(100,80,64)+10*A.U('wide');score=0;lives=A.D(5,3,2)+A.U('life');level=1;combo=0;comboT=0;fireT=laserT=catchT=0;bombN=0;wideT=slowT=0;wideN=0;flash=0;build();serve();api.score(0);};
  reset();
  let resumed=false; const RS=api.resume;
  if(RS&&RS.level){ level=RS.level; score=RS.score; lives=RS.lives; build(); if(level%5&&RS.bricks)bricks=RS.bricks.map(k=>Object.assign({},k,{alive:1})); serve(); api.score(score); resumed=true; banner={t:2,txt:'WELCOME BACK',sub:'Level '+level+' · '+lives+' lives'}; }
  api.snap&&api.snap(()=>state=='dead'||(state=='ready'&&!resumed)?null:{level,score,lives,bricks:bricks.filter(k=>k.alive&&!k.sum).map(({x,y,r,hp,max,tnt,gold,mv})=>({x,y,r,hp,max,tnt,gold,mv}))});
  const start=()=>{ if(state=='dead'){reset();resumed=false;} state='play'; balls.forEach(b=>b.stuck&&launch(b)); };
  const offK=A.keys(e=>{ if((e.key=='u'||e.key=='U')&&A.infiniteHints&&state=='play'){ phaseT=2; A.sfx('coin'); banner={t:1,txt:'PHASE',sub:'2 seconds'}; } if(e.key==' '){ if(state!='play')start(); else balls.forEach(b=>b.stuck&&launch(b)); } });
  const kd=e=>{if(e.key=='ArrowLeft'||e.key=='a')left=e.type=='keydown';if(e.key=='ArrowRight'||e.key=='d')right=e.type=='keydown';};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',kd);
  const mm=e=>{const b=c.getBoundingClientRect();px=(e.clientX-b.left)*w/b.width;};c.addEventListener('mousemove',mm);
  const md=()=>{ if(state!='play')start(); else balls.forEach(b=>b.stuck&&launch(b)); }; c.addEventListener('mousedown',md);
  const add=n=>{score+=n;api.score(score);};
  const pmul=()=>(A.infiniteHints&&A.ballPower)||1;
  const burst=(x,y,c,n=6)=>{for(let i=0;i<n;i++){const a=Math.random()*7,v=60+Math.random()*180;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,t:.6,c});}};
  const MS=[10,25,50,100,250,500,1000,2500,5000,10000],MN=['NICE','GREAT','AMAZING','UNSTOPPABLE','LEGENDARY','MYTHIC','WILDERLAND','COSMIC','GODLIKE','BEYOND'];
  const milestone=()=>{ let nm=MN[MS.indexOf(combo)]; if(!nm&&combo>10000&&combo%10000==0)nm='BEYOND'; if(!nm)return; const bb=50*combo*level; add(bb); A.sfx('win'); banner={t:1.6,txt:'COMBO ×'+combo,sub:nm+'! +'+bb}; };
  const boom=(x,y,rad)=>{ flash=Math.max(flash,.08); A.tone(80,.2,'sawtooth',.06); burst(x,y,C.orange,14); rings.push({x,y,R:rad,t:.3});
    for(const q of bricks) if(q.alive&&Math.hypot(q.x+bw/2-x,q.y+BH/2-y)<rad){ q.hp=0; kill(q); }
    if(boss&&boss.hp>0&&Math.hypot(boss.x+boss.w/2-x,boss.y+boss.h/2-y)<rad+boss.w/2)damageBoss(10*pmul()); };
  const kill=k=>{ if(!k.alive)return; k.alive=0; add(10*(k.r<4?5-k.r:1)*level*Math.max(1,combo)); A.sfx('point'); burst(k.x+bw/2,k.y+BH/2,k.tnt?C.red:colors[k.r%colors.length]);
    if(k.gold||Math.random()<.13){const keys=Object.keys(PW);drops.push({x:k.x+bw/2,y:k.y+BH/2,k:keys[Math.random()*keys.length|0]});}
    if(k.tnt)boom(k.x+bw/2,k.y+BH/2,bw*1.6); };
  const hitBrick=(k,d)=>{ k.hp-=d; combo++; comboT=4; milestone();
    if(k.hp<=0)kill(k); else { add(5*level); A.sfx('hit'); }
    if(bombN>0){ bombN--; boom(k.x+bw/2,k.y+BH/2,bw*1.6); } };
  const damageBoss=d=>{ const B=boss; if(!B||B.hp<=0)return; B.hp=Math.max(0,B.hp-d); B.hitT=.12; combo++; comboT=4; milestone(); add(20*level*Math.max(1,combo>>2)); A.sfx('hit');
    if(B.hp<=0){ const bb=500*level*(1+B.cyc); add(bb); A.sfx('win'); flash=.2; shots=[]; bricks.forEach(k=>{if(k.sum)k.alive=0;}); burst(B.x+B.w/2,B.y+B.h/2,C.gold,30); api.stat&&api.stat('bossKills',1,'add'); banner={t:2,txt:B.name+' DEFEATED',sub:'+'+bb}; } };
  A.breakoutAdmin={ goLevel:n=>{ level=n; build(); serve(); if(state!='play')state='play'; }, addBalls:n=>{ const src=balls.find(b=>!b.stuck); for(let i=0;i<n;i++){ const a=-Math.PI/2+(Math.random()-.5)*1.6, v=spd(); balls.push({x:src?src.x:px,y:src?src.y:h-40,vx:Math.cos(a)*v,vy:Math.sin(a)*v}); } if(state!='play')state='play'; A.sfx('coin'); } };
  const offL=A.loop(dt=>{
    if(state=='play'&&!quizzing){
      wideT=Math.max(0,wideT-dt); if(wideT<=0)wideN=0; slowT=Math.max(0,slowT-dt); flash=Math.max(0,flash-dt); fireT=Math.max(0,fireT-dt); catchT=Math.max(0,catchT-dt); if(combo>0){comboT-=dt; if(comboT<=0)combo=0;} if(banner)banner.t-=dt;
      const pb=A.D(100,80,64),tw=Math.min(w-20,pb+50*wideN)*(shrinkT>0?.6:1); pw+=(tw-pw)*Math.min(1,dt*10);
      px+=((right?1:0)-(left?1:0))*480*dt; px=Math.max(pw/2,Math.min(w-pw/2,px));
      for(const b of balls){
        if(b.stuck){b.x=px+(b.ox||0);b.y=h-40;continue;}
        const v=Math.hypot(b.vx,b.vy),tv=spd(); b.vx*=tv/v; b.vy*=tv/v;
        const steps=Math.ceil(v*dt/4);
        for(let i=0;i<steps&&!b.out;i++){ const sdt=dt/steps; b.x+=b.vx*sdt; b.y+=b.vy*sdt;
          if(b.x<R){b.x=R;b.vx=Math.abs(b.vx);A.sfx('blip');} if(b.x>w-R){b.x=w-R;b.vx=-Math.abs(b.vx);A.sfx('blip');}
          if(b.y<R){b.y=R;b.vy=Math.abs(b.vy);A.sfx('blip');}
          if(b.vy>0&&b.y>h-34&&b.y<h-20&&Math.abs(b.x-px)<pw/2+R){ const off=(b.x-px)/(pw/2), a=-Math.PI/2+off*1.05; b.vx=Math.cos(a)*v; b.vy=Math.sin(a)*v; b.y=h-34; if(catchT>0){b.stuck=true;b.ox=b.x-px;} A.sfx('hit'); }
          if(A.immortal&&b.y>h-R){b.y=h-R;b.vy=-Math.abs(b.vy);A.sfx('blip');}
          if(b.y>h+10){b.out=true;}
          for(const k of bricks){ if(!k.alive)continue;
            if(b.x+R>k.x+1&&b.x-R<k.x+bw-1&&b.y+R>k.y&&b.y-R<k.y+BH){
              const ox=Math.min(b.x+R-k.x,k.x+bw-(b.x-R)), oy=Math.min(b.y+R-k.y,k.y+BH-(b.y-R));
              if(phaseT<=0&&fireT<=0){ if(ox<oy)b.vx*=-1; else b.vy*=-1; }
              hitBrick(k,pmul()*(fireT>0?2:1));
              break; } } } }
      if(boss&&boss.hp>0){ const B=boss,D=A.D(1.4,1,.75),rg=B.rage?1.6:1,sv=(190+level*5)/D,cx=B.x+B.w/2,by=B.y+B.h;
        const fire=(x,y,vx,vy,o)=>shots.push(Object.assign({x,y,vx,vy,c:C.orange,r:5},o));
        const aim=(x,y,v,o)=>{const a=Math.atan2(h-23-y,px-x);fire(x,y,Math.cos(a)*v,Math.sin(a)*v,o);};
        B.t+=dt; B.hitT=Math.max(0,B.hitT-dt); B.ft-=dt*rg; B.ft2-=dt*rg; B.tp=Math.max(0,B.tp-dt); B.dg-=dt;
        if(B.kind==2){ if(Math.random()<dt*1.5)B.vx*=-1; B.y=80+Math.sin(B.t*3)*22;
          if(B.dg<=0)for(const b of balls){ if(!b.stuck&&b.vy<0&&b.y>by&&b.y-by<110&&Math.abs(b.x-cx)<B.w*.7){B.vx=(cx>b.x?1:-1)*Math.abs(B.vx);B.dg=.8*D;break;} } }
        if(B.kind==4)B.y=80+Math.sin(B.t*1.3)*14;
        B.dashT=Math.max(0,B.dashT-dt); B.x+=B.vx*dt*rg*(B.dashT>0?3:1); if(B.x<0){B.x=0;B.vx=Math.abs(B.vx);} if(B.x+B.w>w){B.x=w-B.w;B.vx=-Math.abs(B.vx);}
        if(B.kind==8)B.x=Math.max(0,Math.min(w-B.w,B.x+((w-px-B.w/2)-B.x)*Math.min(1,dt*5)));
        if(B.kind==7)for(const b of balls){ if(b.stuck)continue; const dx=cx-b.x,dy=B.y+B.h/2-b.y,d=Math.hypot(dx,dy)||1; if(d<260){b.vx+=dx/d*560*dt;b.vy+=dy/d*560*dt;} }
        if(B.kind==6){ const sx=B.sh<0?B.x:B.x+B.w/2, sy=by+4; for(const b of balls){ if(!b.stuck&&b.vy<0&&b.x>sx&&b.x<sx+B.w/2&&b.y-R<sy+10&&b.y>sy-4){ b.vy=Math.abs(b.vy); b.y=sy+10+R; A.sfx('blip'); } } }
        if(B.kind==9){ const n=bricks.filter(k=>k.alive&&k.sum).length; if(n)B.hp=Math.min(B.max,B.hp+B.max*.004*n*dt); }
        if(B.ft<=0){
          if(B.kind==0){ B.ft=1.8*D; for(const a of[-.35,0,.35])fire(cx,by,Math.sin(a)*sv,Math.cos(a)*sv,{r:7,c:'#c0603f'}); }
          else if(B.kind==1){ B.ft=1.3*D; aim(cx,by,sv*1.1,{c:'#bbb'}); }
          else if(B.kind==2){ B.ft=1.6*D; for(let i=0;i<3;i++)aim(cx,by-i*16,sv*1.25,{c:C.peach,r:4}); }
          else if(B.kind==3){ B.ft=2*D; for(let i=-2;i<=2;i++)fire(cx,by,Math.sin(i*.28)*sv,Math.cos(i*.28)*sv,{c:C.lavender,wob:Math.random()*6}); }
          else if(B.kind==4){ B.ft=1.4*D; fire(cx,by,0,sv*.8,{c:C.gold,r:7,home:1}); }
          else if(B.kind==5){ B.ft=1.1*D; for(const a of[-.6,.6])fire(cx,by,Math.sin(a)*sv,Math.cos(a)*sv,{c:C.peach,r:5,bnc:1}); }
          else if(B.kind==6){ B.ft=1.2*D; aim(cx-20,by,sv,{c:C.sky}); aim(cx+20,by,sv,{c:C.sky}); }
          else if(B.kind==7){ B.ft=2.2*D; for(let i=0;i<7;i++){const a=-1.2+i*.4;fire(cx,B.y+B.h/2,Math.sin(a)*sv*.8,Math.cos(a)*sv*.8,{c:C.lavender,r:6});} }
          else if(B.kind==8){ B.ft=.55*D; fire(cx,by,0,sv*1.2,{c:'#d9d9d9',r:4}); }
          else { B.ft=1.7*D; for(const a of[-.3,0,.3])fire(cx,by,Math.sin(a)*sv,Math.cos(a)*sv,{c:C.pink,wob:Math.random()*6}); }
          A.tone(160,.08,'square',.05); }
        if(B.ft2<=0){
          if(B.kind==0){ B.ft2=6*D; for(let i=0;i<4;i++)fire(20+Math.random()*(w-40),20,0,sv*.7,{r:9,c:'#c0603f',sq:1}); }
          else if(B.kind==1){ B.ft2=5*D; const hp=1+Math.ceil(level/10); for(let k=Math.floor(B.x/bw);k<=Math.floor((B.x+B.w)/bw)&&k<cols;k++){ if(!bricks.some(q=>q.alive&&q.x==k*bw&&q.y==by+12))bricks.push({x:k*bw,y:by+12,r:5,hp,max:hp,alive:1,sum:1}); } A.sfx('blip'); }
          else if(B.kind==2) B.ft2=99;
          else if(B.kind==3){ B.ft2=4*D; B.tp=.35; B.x=Math.random()*(w-B.w); A.tone(620,.1,'sine',.05); }
          else if(B.kind==4){ B.ft2=(B.rage?3:5)*D; shots.push({laser:1,x:px,y:0,t:0}); A.tone(90,.3,'sawtooth',.05); }
          else if(B.kind==5){ B.ft2=3.5*D; B.dashT=1; A.tone(700,.08,'square',.04); }
          else if(B.kind==6){ B.ft2=2.5*D; B.sh=-B.sh; }
          else if(B.kind==7){ B.ft2=5*D; for(let i=0;i<3;i++)fire(cx+(i-1)*30,by,0,sv*.6,{c:'#5b2a86',r:7,home:1}); }
          else if(B.kind==8){ B.ft2=4*D; for(let i=0;i<5;i++)fire(20+Math.random()*(w-40),20,0,sv*.8,{c:'#d9d9d9',r:6,sq:1}); }
          else { B.ft2=5*D; const hp=1+Math.ceil(level/10); for(let i=0;i<4;i++){ const kx=(Math.random()*cols|0)*bw, ky=140+(Math.random()*2|0)*22; if(!bricks.some(q=>q.alive&&q.x==kx&&q.y==ky))bricks.push({x:kx,y:ky,r:3,hp,max:hp,alive:1,sum:1}); } A.sfx('blip'); } }
        if(B.kind==4&&!B.rage&&B.hp<B.max/2){ B.rage=1; banner={t:2,txt:'THE TIMMY IS FURIOUS',sub:'Rage mode'}; A.sfx('bad'); }
        for(const b of balls){ if(b.stuck||boss.hp<=0||phaseT>0)continue; if(b.x+R>boss.x&&b.x-R<boss.x+boss.w&&b.y+R>boss.y&&b.y-R<boss.y+boss.h){
          const ox=Math.min(b.x+R-boss.x,boss.x+boss.w-(b.x-R)), oy=Math.min(b.y+R-boss.y,boss.y+boss.h-(b.y-R));
          if(ox<oy){ const lft=b.x<boss.x+boss.w/2; b.vx=lft?-Math.abs(b.vx):Math.abs(b.vx); b.x=lft?boss.x-R:boss.x+boss.w+R; }
          else { const up=b.y<boss.y+boss.h/2; b.vy=up?-Math.abs(b.vy):Math.abs(b.vy); b.y=up?boss.y-R:boss.y+boss.h+R; }
          damageBoss(pmul()*(fireT>0?2:1));
          } } }
      shots.forEach(s=>{ if(s.laser){ s.t+=dt; if(s.t>.9&&s.t<1.4&&!s.hit&&Math.abs(s.x-px)<pw/2+12){s.hit=1;shrinkT=6;A.sfx('bad');} if(s.t>1.4)s.dead=1; return; }
        if(s.bnc&&(s.x<6&&s.vx<0||s.x>w-6&&s.vx>0))s.vx*=-1; if(s.home)s.vx+=Math.sign(px-s.x)*160*dt; if(s.wob!=null)s.x+=Math.sin(s.y/30+s.wob)*90*dt;
        s.x+=s.vx*dt; s.y+=s.vy*dt; if(s.y>h-34&&s.y<h-14&&Math.abs(s.x-px)<pw/2+s.r){ s.dead=1; shrinkT=4; A.sfx('bad'); } });
      shots=shots.filter(s=>!s.dead&&s.y<h+10&&s.x>-20&&s.x<w+20);
      if(shrinkT>0)shrinkT-=dt; if(phaseT>0)phaseT-=dt;
      if(laserT>0){ laserT-=dt; boltT-=dt; if(boltT<=0){ boltT=.28; bolts.push({x:px-pw/2+6,y:h-30},{x:px+pw/2-6,y:h-30}); A.tone(900,.03,'square',.02);} }
      bolts.forEach(o=>{ o.y-=640*dt; for(const k of bricks){ if(k.alive&&o.x>k.x&&o.x<k.x+bw&&o.y>k.y&&o.y<k.y+BH){ o.dead=1; hitBrick(k,pmul()); break; } }
        if(!o.dead&&boss&&boss.hp>0&&o.x>boss.x&&o.x<boss.x+boss.w&&o.y>boss.y&&o.y<boss.y+boss.h){ o.dead=1; damageBoss(pmul()); } });
      bolts=bolts.filter(o=>!o.dead&&o.y>0);
      bricks.forEach(k=>{ if(k.alive&&k.mv){ k.x+=k.mv*dt; if(k.x>w)k.x-=w+bw; if(k.x<-bw)k.x+=w+bw; } });
      parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.t-=dt;}); parts=parts.filter(p=>p.t>0); if(parts.length>400)parts.splice(0,parts.length-400);
      rings.forEach(q=>q.t-=dt); rings=rings.filter(q=>q.t>0);
      const lost=balls.filter(b=>b.out).length; balls=balls.filter(b=>!b.out);
      if(lost&&!balls.length){ const die=()=>{ if(!A.immortal) lives--; combo=0; A.sfx('bad'); flash=.3; wideT=0; wideN=0; fireT=laserT=catchT=0; bombN=0; if(lives<=0){state='dead';A.sfx('over');api.over(score);} else serve(); };
        if(A.learnOn()){ quizzing=true; A.quiz(host,'BALL LOST · ANSWER TO KEEP YOUR LIFE',ok=>{ quizzing=false; edu(ok); if(ok){ combo=0; serve(); } else die(); }); } else die(); }
      drops.forEach(d=>{ d.y+=150*dt; if(d.y>h-34&&d.y<h-14&&Math.abs(d.x-px)<pw/2+10){ d.got=1; A.sfx('coin');
        if(d.k=='wide'){wideT=12;wideN++;banner={t:1,txt:'WIDE ×'+wideN};} if(d.k=='slow')slowT=10; if(d.k=='life')lives=Math.min(6,lives+1); if(d.k=='fire'){fireT=8;banner={t:1,txt:'FIREBALL'};} if(d.k=='laser'){laserT=10;banner={t:1,txt:'LASERS'};} if(d.k=='bomb'){bombN++;banner={t:1,txt:'BOMB ×'+bombN};} if(d.k=='catch'){catchT=12;banner={t:1,txt:'MAGNET'};}
        if(d.k=='multi'){const src=balls.find(b=>!b.stuck)||balls[0]; if(src){ for(const s of[-.5,.5]){const a=Math.atan2(src.vy,src.vx)+s;balls.push({x:src.x,y:src.y,vx:Math.cos(a)*spd(),vy:Math.sin(a)*spd()});} }}
        add(50); } });
      drops=drops.filter(d=>!d.got&&d.y<h+20);
      if(bricks.every(k=>!k.alive)&&!(boss&&boss.hp>0)){ const bonus=250*level+lives*100; add(bonus); A.sfx('win'); level++; api.stat&&api.stat('brkLevel',level); build(); serve(); banner={t:2,txt:'LEVEL '+level,sub:'+'+bonus+' clear bonus'}; }
    }
    g.fillStyle=C.ink;g.fillRect(0,0,w,h);
    if(flash>0){g.fillStyle='rgba(255,69,57,'+(flash)+')';g.fillRect(0,0,w,h);}
    bricks.forEach(k=>{ if(!k.alive)return; g.fillStyle=k.tnt?C.red:colors[k.r%colors.length]; g.globalAlpha=k.max>1?.45+.55*(k.hp/k.max):1; g.fillRect(k.x+2,k.y,bw-4,BH); g.globalAlpha=1;
      if(k.max>1){g.fillStyle=C.ink;g.font='700 11px '+A.font;g.textAlign='center';g.fillText(k.hp,k.x+bw/2,k.y+13);} });
    bricks.forEach(k=>{ if(!k.alive)return; if(k.gold){g.strokeStyle=C.gold;g.lineWidth=2;g.strokeRect(k.x+3,k.y+1,bw-6,BH-2);} if(k.tnt&&k.max<=1){g.fillStyle='#fff';g.font='700 10px '+A.font;g.textAlign='center';g.fillText('TNT',k.x+bw/2,k.y+13);} });
    drops.forEach(d=>{g.fillStyle=PW[d.k].c;g.beginPath();g.roundRect?g.roundRect(d.x-14,d.y-8,28,16,8):g.rect(d.x-14,d.y-8,28,16);g.fill();g.fillStyle=C.ink;g.font='700 11px '+A.font;g.textAlign='center';g.fillText(PW[d.k].t,d.x,d.y+4);});
    if(boss&&boss.hp>0){ const B=boss,x=B.x,y=B.y,bw2=B.w,bh=B.h,cx=x+bw2/2,hit=B.hitT>0,t=B.t||0;
      const rr=(a,b,c,d,r,f)=>{g.fillStyle=f;g.beginPath();g.roundRect?g.roundRect(a,b,c,d,r):g.rect(a,b,c,d);g.fill();};
      const tri=(pts,f)=>{g.fillStyle=f;g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fill();};
      g.save(); if(B.tp>0)g.globalAlpha=.35;
      if(B.kind==0){ rr(x,y,bw2,bh,4,hit?'#fff':'#b8492f'); g.fillStyle='#7a2a18';
        for(let r=1;r<3;r++)g.fillRect(x,y+r*bh/3-1,bw2,2); for(let r=0;r<3;r++)for(let k=1;k<5;k++)g.fillRect(x+k*bw2/5+(r%2?bw2/10:0)-1,y+r*bh/3,2,bh/3);
        tri([cx-56,y+14,cx-20,y+22,cx-56,y+22],C.ink); tri([cx+56,y+14,cx+20,y+22,cx+56,y+22],C.ink); g.fillStyle=C.ink; g.fillRect(cx-26,y+36,52,6); }
      else if(B.kind==1){ rr(x,y,bw2,bh,6,hit?'#fff':'#8d8f94'); g.fillStyle='#6b6d72'; g.fillRect(x+bw2*.25,y+8,10,bh-16); g.fillRect(x+bw2*.7,y+8,10,bh-16);
        tri([x+20,y,x+20,y-22,x+44,y-8,cx,y-28,x+bw2-44,y-8,x+bw2-20,y-22,x+bw2-20,y],C.gold);
        g.fillStyle=C.red; g.fillRect(cx-34,y+14,16,8); g.fillRect(cx+18,y+14,16,8); g.fillStyle=C.ink; g.fillRect(cx-20,y+34,40,5); }
      else if(B.kind==2){ g.fillStyle=hit?'#fff':C.peach; g.beginPath(); g.arc(cx,y+bh/2+4,bh/2,0,7); g.fill();
        rr(cx-bh/2-2,y-4,bh+4,18,8,C.orange); rr(cx+(B.vx>0?14:-44),y+8,30,8,4,C.orange);
        g.fillStyle=C.ink; const ey=y+bh/2; g.beginPath(); g.arc(cx-10,ey,4,0,7); g.arc(cx+10,ey,4,0,7); g.fill();
        g.lineWidth=3; g.strokeStyle=C.ink; g.beginPath(); g.arc(cx,ey+8,10,.2,Math.PI-.2); g.stroke(); }
      else if(B.kind==3){ tri([x-10,y+10,x+bw2+10,y+10,x+bw2+24,y+bh+26,x-24,y+bh+26],'#5b2a86');
        rr(x,y,bw2,bh,12,hit?'#fff':C.lavender); tri([cx-30,y,cx-30,y-30,cx-15,y-14,cx,y-38,cx+15,y-14,cx+30,y-30,cx+30,y],C.gold);
        g.fillStyle=C.red; g.beginPath(); g.arc(cx,y-14,4,0,7); g.fill();
        g.fillStyle=C.ink; g.beginPath(); g.arc(cx-22,y+20,4,0,7); g.fill(); g.lineWidth=2; g.strokeStyle=C.gold; g.beginPath(); g.arc(cx+22,y+20,8,0,7); g.stroke();
        g.fillStyle=C.ink; g.beginPath(); g.arc(cx+22,y+20,3,0,7); g.fill(); tri([cx,y+32,cx-32,y+40,cx-16,y+34],C.ink); tri([cx,y+32,cx+32,y+40,cx+16,y+34],C.ink); }
      else if(B.kind==4){ const glow=B.rage?(Math.sin(t*20)>0?C.red:'#ff7a5c'):C.gold;
        rr(x-3,y-3,bw2+6,bh+6,14,glow); rr(x,y,bw2,bh,12,hit?'#fff':'#141414');
        g.fillStyle=glow; g.fillRect(x+10,y+8,bw2-20,3);
        g.shadowColor=glow; g.shadowBlur=14; g.fillStyle=B.rage?C.red:C.gold; tri([cx-50,y+18,cx-14,y+26,cx-50,y+32],g.fillStyle); tri([cx+50,y+18,cx+14,y+26,cx+50,y+32],B.rage?C.red:C.gold);
        g.shadowBlur=0; g.fillStyle=glow; for(let i=0;i<6;i++)tri([cx-36+i*12,y+42,cx-30+i*12,y+50,cx-24+i*12,y+42],glow); }
      else if(B.kind==5){ g.fillStyle=hit?'#fff':C.peach; g.beginPath(); g.arc(cx,y+bh/2+2,bh/2,0,7); g.fill(); rr(cx-bh/2,y-6,bh,12,6,C.sky); rr(cx+(B.vx>0?8:-26),y,18,6,3,C.sky);
        g.fillStyle=C.ink; g.beginPath(); g.arc(cx-7,y+bh/2,3,0,7); g.arc(cx+7,y+bh/2,3,0,7); g.fill(); g.fillStyle=C.orange; for(const f of[-12,-9,9,12])g.fillRect(cx+f-1,y+bh/2+7,2,2);
        if(B.dashT>0){g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x-B.vx*.15,y,bw2,bh);} }
      else if(B.kind==6){ rr(x,y,bw2,bh,10,hit?'#fff':C.sky); g.lineWidth=3; g.strokeStyle=C.ink; g.beginPath(); g.arc(cx-22,y+20,10,0,7); g.moveTo(cx+32,y+20); g.arc(cx+22,y+20,10,0,7); g.moveTo(cx-12,y+20); g.lineTo(cx+12,y+20); g.stroke();
        g.fillStyle=C.ink; g.fillRect(cx-14,y+36,28,4); const sx=B.sh<0?x:x+bw2/2; rr(sx,y+bh+4,bw2/2,10,5,C.gold); g.fillStyle='#fff'; g.fillRect(sx+6,y+bh+6,bw2/2-12,2); }
      else if(B.kind==7){ const r0=bw2/2; g.strokeStyle='rgba(180,160,255,.15)'; g.lineWidth=2; g.beginPath(); g.arc(cx,y+bh/2,260,0,7); g.stroke();
        g.fillStyle='#000'; g.beginPath(); g.arc(cx,y+bh/2,r0,0,7); g.fill(); g.lineWidth=3;
        for(let i=0;i<3;i++){ const sp=t*2*(i%2?-1:1)+i; g.strokeStyle=i%2?C.lavender:'#7b4ab0'; g.beginPath(); g.arc(cx,y+bh/2,r0-8-i*12,sp,sp+4); g.stroke(); }
        g.fillStyle=hit?'#fff':C.lavender; g.beginPath(); g.arc(cx,y+bh/2,8,0,7); g.fill(); }
      else if(B.kind==8){ const gr=g.createLinearGradient(x,y,x+bw2,y); gr.addColorStop(0,'#99aaaa'); gr.addColorStop(.5,'#ffffff'); gr.addColorStop(1,'#99aaaa'); rr(x,y,bw2,bh,6,hit?'#fff':gr);
        g.fillStyle=C.ink; g.fillRect(cx-24,y+10,10,8); g.fillRect(cx+14,y+10,10,8); g.fillStyle='rgba(255,255,255,.6)'; g.fillRect(x+8,y+4,bw2*.3,3); }
      else if(B.kind==9){ g.strokeStyle='rgba(255,140,190,.4)'; g.lineWidth=1; for(const k of bricks)if(k.alive&&k.sum){g.beginPath();g.moveTo(cx,y+bh);g.lineTo(k.x+bw/2,k.y);g.stroke();}
        rr(x,y,bw2,bh,8,hit?'#fff':C.pink); g.fillStyle='rgba(0,0,0,.15)'; for(let q=1;q<3;q++)g.fillRect(x,y+q*bh/3,bw2,2);
        tri([cx-28,y,cx-20,y-18,cx-10,y-6,cx,y-24,cx+10,y-6,cx+20,y-18,cx+28,y],C.gold); g.fillStyle=C.sky; g.beginPath(); g.arc(cx,y-10,3,0,7); g.fill();
        g.fillStyle=C.ink; g.beginPath(); g.arc(cx-20,y+20,4,0,7); g.arc(cx+20,y+20,4,0,7); g.fill(); g.fillRect(cx-12,y+34,24,4); }
      g.restore();
      const hc=['#b8492f','#8d8f94',C.orange,C.lavender,C.gold,C.peach,C.sky,'#7b4ab0','#cccccc',C.pink][B.kind]||C.red;
      g.fillStyle='#333'; g.fillRect(12,32,w-24,6); g.fillStyle=hc; g.fillRect(12,32,(w-24)*B.hp/B.max,6);
      g.fillStyle='#fff'; g.font='700 11px '+A.font; g.textAlign='center'; g.fillText(B.name+' · '+Math.ceil(B.hp)+' HP'+(B.rage?' · RAGE':''),w/2,48); }
    shots.forEach(s=>{ if(s.laser){ if(s.t<.9){ g.fillStyle='rgba(255,80,60,'+(.15+.25*Math.abs(Math.sin(s.t*18)))+')'; g.fillRect(s.x-12,0,24,h); }
        else { g.fillStyle=C.gold; g.fillRect(s.x-14,0,28,h); g.fillStyle='#fff'; g.fillRect(s.x-5,0,10,h); } return; }
      g.fillStyle=s.c||C.orange; if(s.sq)g.fillRect(s.x-s.r,s.y-s.r,s.r*2,s.r*2); else { g.beginPath(); g.arc(s.x,s.y,s.r||5,0,7); g.fill(); }
      if(s.home){ g.strokeStyle='#fff'; g.lineWidth=2; g.beginPath(); g.arc(s.x,s.y,s.r+3,0,7); g.stroke(); } });
    rings.forEach(q=>{g.strokeStyle=C.orange;g.globalAlpha=q.t/.3;g.lineWidth=4;g.beginPath();g.arc(q.x,q.y,q.R*(1-q.t/.3)+6,0,7);g.stroke();}); g.globalAlpha=1;
    parts.forEach(p=>{g.fillStyle=p.c;g.globalAlpha=Math.min(1,p.t*2);g.fillRect(p.x-2,p.y-2,4,4);}); g.globalAlpha=1;
    g.fillStyle=C.gold; bolts.forEach(o=>g.fillRect(o.x-2,o.y-10,4,12));
    if(A.immortal){g.fillStyle=C.gold;g.fillRect(0,h-4,w,4);}
    g.fillStyle=wideT>0?C.lime:C.green;g.fillRect(px-pw/2,h-28,pw,10); if(laserT>0){g.fillStyle=C.gold;g.fillRect(px-pw/2+3,h-34,6,6);g.fillRect(px+pw/2-9,h-34,6,6);} if(catchT>0){g.fillStyle=C.mint;g.fillRect(px-pw/2,h-30,pw,2);}
    g.fillStyle=phaseT>0?C.sky:fireT>0?(Math.sin(performance.now()/50)>0?C.orange:C.red):slowT>0?C.lavender:'#fff';if(phaseT>0)g.globalAlpha=.55+.35*Math.sin(performance.now()/40);balls.forEach(b=>{g.beginPath();g.arc(b.x,b.y,R,0,7);g.fill();});g.globalAlpha=1;
    g.font='600 13px '+A.font;g.textAlign='left';g.fillStyle=C.lime;g.fillText('LV '+level+'   Lives '+lives,12,24);
    g.textAlign='right'; if(combo>1){ g.fillStyle=combo>=250?C.pink:combo>=50?C.orange:combo>=10?C.gold:C.lime; g.font='700 '+Math.round(Math.min(22,13+Math.log2(combo)*1.2))+'px '+A.font; g.fillText('COMBO ×'+combo,w-12,22); g.fillRect(w-112,26,100*Math.max(0,comboT)/4,3); }
    { const act=[fireT>0&&'FIRE '+Math.ceil(fireT),laserT>0&&'LASER '+Math.ceil(laserT),catchT>0&&'MAGNET '+Math.ceil(catchT),bombN>0&&'BOMB ×'+bombN,wideN>0&&'WIDE ×'+wideN].filter(Boolean).join('  ·  '); if(act){g.font='600 11px '+A.font;g.textAlign='left';g.fillStyle='#fff';g.fillText(act,12,h-8);} }
    if(state=='play'&&balls.some(b=>b.stuck)){g.textAlign='center';g.fillStyle='#fff';g.font='500 13px '+A.font;g.fillText('Space or click to launch',w/2,h-50);}
    if(state=='play'&&banner&&banner.t>0){g.globalAlpha=Math.min(1,banner.t);g.textAlign='center';g.fillStyle=C.lime;let fs=34;g.font='700 '+fs+'px '+A.font;while(g.measureText(banner.txt).width>w-24&&fs>14){fs-=2;g.font='700 '+fs+'px '+A.font;}g.fillText(banner.txt,w/2,h/2+40);
      if(banner.sub){g.fillStyle='#fff';g.font='500 15px '+A.font;g.fillText(banner.sub,w/2,h/2+66,w-24);} g.globalAlpha=1;}
    if(state=='ready')A.overlayText(g,w,h,resumed?'PAUSED':'BREAKOUT',resumed?'Level '+level+' · '+lives+' lives · Space to continue':'Endless levels · combos · power-ups · Space');
    if(state=='dead')A.overlayText(g,w,h,'GAME OVER','Level '+level+' · score '+score+' · Space to replay');
  });
  return()=>{A.breakoutAdmin=null;offK();offL();c.removeEventListener('mousedown',md);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',kd);};
}});

A.register('flappy', { mount(host, api){
  if(A.edu&&A.edu.on&&A.flapMath) return A.flapMath(host,api);
  const U = k => (A.upg && A.upg[k]) || 0;
  const {c,g,w,h}=A.canvas(host), GAP=A.D(175,140,112)+14*U('gap'), PW=56, BX=110, GROUND=h-34;
  let y,vy,pipes,score,t,state='ready',resumed=false,shields=0,inv=0,parts=[],scroll=0,flapT=0,best=0;
  const clouds=[...Array(6)].map((_,i)=>({x:i*95+Math.random()*40,y:30+Math.random()*120,s:.6+Math.random()*.6}));
  const reset=()=>{y=h/2;vy=0;pipes=[];score=0;t=0;resumed=false;shields=U('shield');inv=0;parts=[];api.score(0);};reset();
  if(api.resume&&api.resume.pipes){y=api.resume.y;pipes=api.resume.pipes;score=api.resume.score;shields=api.resume.shields??U('shield');api.score(score);resumed=true;}
  api.snap&&api.snap(()=>state=='play'||(state=='ready'&&resumed)?{y,pipes:pipes.map(p=>({...p})),score,shields}:null);
  const flap=()=>{if(state=='dead'){reset();state='ready';return;}state='play';vy=-300;flapT=.18;A.sfx('flip');for(let i=0;i<4;i++)parts.push({x:BX-10,y:y+6,vx:-60-Math.random()*60,vy:30+Math.random()*60,t:.4,c:'rgba(255,255,255,.8)',r:3});};
  const offK=A.keys(e=>{if(e.key==' '||e.key=='ArrowUp')flap();});c.addEventListener('mousedown',flap);
  const burst=(col,n)=>{for(let i=0;i<n;i++){const a=Math.random()*7,sp=80+Math.random()*160;parts.push({x:BX,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:.6,c:col,r:2+Math.random()*3});}};
  function hit(){ if(inv>0)return; if(shields>0){shields--;inv=1.3;vy=-220;burst('#9fd8ff',22);A.sfx('hit');return;} die(); }
  function die(){if(state!='play')return;if(A.immortal){if(y>GROUND-16){y=GROUND-16;vy=-300;}if(y<0){y=1;vy=0;}return;}state='dead';burst(C.gold,26);A.sfx('over');api.over(score);}
  const tree=(x,y0,y1,top)=>{ // log pipe with bark + cap
    const gr=g.createLinearGradient(x,0,x+PW,0);gr.addColorStop(0,'#5a3a1c');gr.addColorStop(.45,'#9a6a3a');gr.addColorStop(1,'#4a2e16');
    g.fillStyle=gr;g.fillRect(x+4,y0,PW-8,y1-y0);
    g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=2;for(let k=y0+14;k<y1;k+=26){g.beginPath();g.moveTo(x+10,k);g.lineTo(x+22,k+8);g.stroke();g.beginPath();g.moveTo(x+PW-12,k+12);g.lineTo(x+PW-22,k+18);g.stroke();}
    const cy=top?y1-18:y0; g.fillStyle='#00B451';g.beginPath();if(g.roundRect)g.roundRect(x-4,cy,PW+8,18,7);else g.rect(x-4,cy,PW+8,18);g.fill();
    g.fillStyle='rgba(255,255,255,.22)';g.fillRect(x,cy+3,PW,4);
    g.fillStyle='#007a37';[10,26,42].forEach(o=>{g.beginPath();g.arc(x+o,top?cy+18:cy,6,0,Math.PI*(top?1:2));g.fill();}); };
  const offL=A.loop(dt=>{
    const sp=A.D(120,150,185);
    if(state=='play'){vy+=900*dt;y+=vy*dt;t+=dt;inv=Math.max(0,inv-dt);if(t>1.4){t=0;pipes.push({x:w,gy:70+Math.random()*(GROUND-GAP-120),p:0});}
      pipes.forEach(p=>{p.x-=sp*dt;if(!p.p&&p.x+PW<BX-14){p.p=1;score++;api.score(score);A.sfx('point');}
        if(p.x<BX+14&&p.x+PW>BX-14&&(y-13<p.gy||y+13>p.gy+GAP))hit();});
      pipes=pipes.filter(p=>p.x>-70);if(y>GROUND-14){if(shields>0||inv>0||A.immortal){y=GROUND-14;vy=-320;if(!inv&&!A.immortal)hit();}else die();}if(y<0){y=0;vy=Math.max(vy,0);}}
    if(state!='dead')scroll+=sp*dt*(state=='play'?1:.3); flapT=Math.max(0,flapT-dt);
    parts.forEach(p=>{p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;});parts=parts.filter(p=>p.t>0);
    // sky
    const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#64CDF5');sky.addColorStop(1,'#c9f0ff');g.fillStyle=sky;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,246,176,.9)';g.beginPath();g.arc(w-70,70,30,0,7);g.fill();
    clouds.forEach(cl=>{const x=((cl.x-scroll*.15*cl.s)%(w+120)+w+120)%(w+120)-60;g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.arc(x,cl.y,18*cl.s,0,7);g.arc(x+20*cl.s,cl.y-8*cl.s,22*cl.s,0,7);g.arc(x+42*cl.s,cl.y,16*cl.s,0,7);g.fill();});
    // mountains (parallax)
    [[.25,'#2f8a6a',140,.012],[.5,'#015640',90,.02]].forEach(([par,col,amp,f])=>{g.fillStyle=col;g.beginPath();g.moveTo(0,GROUND);for(let x=0;x<=w;x+=12){const X=x+scroll*par;g.lineTo(x,GROUND-40-amp*(.5+.5*Math.sin(X*f))*(.6+.4*Math.sin(X*f*.37)));}g.lineTo(w,GROUND);g.fill();});
    pipes.forEach(p=>{tree(p.x,0,p.gy,true);tree(p.x,p.gy+GAP,GROUND,false);});
    // ground
    g.fillStyle='#8D5B1D';g.fillRect(0,GROUND,w,h-GROUND);g.fillStyle='#00B451';g.fillRect(0,GROUND,w,8);
    g.fillStyle='#6b4520';for(let x=-(scroll%28);x<w;x+=28)g.fillRect(x,GROUND+16,14,4);
    // bird
    g.save();g.translate(BX,y);g.rotate(Math.max(-.5,Math.min(1.1,vy/520)));
    if(inv>0&&Math.floor(inv*12)%2)g.globalAlpha=.45;
    g.fillStyle=C.gold;g.beginPath();g.ellipse(0,0,16,14,0,0,7);g.fill();g.fillStyle='#ffe58a';g.beginPath();g.ellipse(3,5,9,6,0,0,7);g.fill();
    const wing=flapT>0?-10:Math.sin(performance.now()/90)*4;g.fillStyle=C.orange;g.beginPath();g.ellipse(-5,wing*.3,9,5,wing/20,0,7);g.fill();
    g.fillStyle='#fff';g.beginPath();g.arc(7,-5,5,0,7);g.fill();g.fillStyle=C.ink;g.beginPath();g.arc(8.5,-5,2.4,0,7);g.fill();
    g.fillStyle=C.orange;g.beginPath();g.moveTo(13,-1);g.lineTo(23,2);g.lineTo(13,6);g.fill();g.globalAlpha=1;
    if(shields>0||inv>0){g.strokeStyle='rgba(159,216,255,'+(inv>0?.9:.55)+')';g.lineWidth=3;g.beginPath();g.arc(0,0,23,0,7);g.stroke();}
    g.restore();
    parts.forEach(p=>{g.globalAlpha=Math.max(0,p.t*2);g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill();});g.globalAlpha=1;
    // HUD
    g.textAlign='center';g.font='700 46px '+A.font;g.fillStyle='rgba(0,0,0,.18)';g.fillText(score,w/2+2,64);g.fillStyle='#fff';g.fillText(score,w/2,62);
    if(U('shield')){g.textAlign='left';g.font='700 14px '+A.font;g.fillStyle=C.forest;g.fillText('◯'.repeat(shields)+'  shield'+(shields==1?'':'s'),14,24);}
    if(state=='ready')A.overlayText(g,w,h,resumed?'PAUSED':'FLAPPER',resumed?score+' logs so far · flap to continue':'Space or click to flap');
    if(state=='dead')A.overlayText(g,w,h,'GROUNDED','Score '+score+' · Space to reset');
  });
  return()=>{offK();offL();};
}});

A.register('pong', { mount(host, api){
  const {c,g,w,h}=A.canvas(host), PH=70+10*A.U('paddle'), WALL=12;
  let py,ay,ball,me,ai,state='ready',up=0,dn=0,quizzing=false; const edu=ok=>{try{api.edu&&api.edu(ok);}catch(e){}};
  const serve=d=>{ball={x:w/2,y:h/2,vx:A.D(220,260,320)*d,vy:(Math.random()-.5)*260};};
  let resumed=false;
  const reset=()=>{py=ay=h/2;me=ai=0;resumed=false;serve(1);api.score(0);};reset();
  if(api.resume&&api.resume.me!=null){me=api.resume.me;ai=api.resume.ai;api.score(me*100);resumed=true;}
  api.snap&&api.snap(()=>state=='dead'||(!resumed&&me+ai==0)?null:{me,ai});
  const offK=A.keys(e=>{if(e.key==' '&&state!='play'){if(state=='dead')reset();state='play';}});
  const kd=e=>{if(e.key=='ArrowUp'||e.key=='w')up=e.type=='keydown';if(e.key=='ArrowDown'||e.key=='s')dn=e.type=='keydown';};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',kd);
  const mm=e=>{const b=c.getBoundingClientRect();py=Math.max(WALL+PH/2,Math.min(h-WALL-PH/2,(e.clientY-b.top)*h/b.height));};c.addEventListener('mousemove',mm);
  const offL=A.loop(dt=>{
    if(state=='play'&&!quizzing){py+=((dn?1:0)-(up?1:0))*380*dt;py=Math.max(WALL+PH/2,Math.min(h-WALL-PH/2,py));
      ay+=Math.sign(ball.y-ay)*Math.min(Math.abs(ball.y-ay),A.D(160,250,360)*(1-.08*A.U('slowai'))*dt);ay=Math.max(WALL+PH/2,Math.min(h-WALL-PH/2,ay));
      ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.vx=Math.sign(ball.vx)*Math.min(Math.abs(ball.vx),A.D(400,500,600));ball.vy=Math.max(-Math.abs(ball.vx)*.8,Math.min(Math.abs(ball.vx)*.8,ball.vy));
      if(ball.y<WALL+6){ball.y=WALL+6;ball.vy=Math.abs(ball.vy);A.sfx('blip');} if(ball.y>h-WALL-6){ball.y=h-WALL-6;ball.vy=-Math.abs(ball.vy);A.sfx('blip');}
      if(ball.x<30&&ball.x>18&&Math.abs(ball.y-py)<PH/2+6&&ball.vx<0){ball.vx=-ball.vx*1.06;ball.vy+=(ball.y-py)*5;A.sfx('hit');}
      if(ball.x>w-30&&ball.x<w-18&&Math.abs(ball.y-ay)<PH/2+6&&ball.vx>0){ball.vx=-ball.vx*1.04;ball.vy+=(ball.y-ay)*4;A.sfx('hit');}
      if(ball.x<0){ if(A.learnOn()){ quizzing=true; serve(1); A.quiz(host,'ANSWER TO BLOCK THE POINT',ok=>{ quizzing=false; edu(ok); if(!ok){ai++;A.sfx('bad');} }); } else {if(!A.immortal)ai++;A.sfx('bad');serve(1);} }if(ball.x>w){me++;api.score(me*100);A.sfx('point');serve(-1);}
      if(me>=5||ai>=5){state='dead';if(me>=5&&ai==0){if(api.stat)api.stat('pongShutout',1,'add');api.perfect&&api.perfect();}me>=5?A.sfx('win'):A.sfx('over');api.over(me*100+(me>=5?300:0));}}
    g.fillStyle=C.blue;g.fillRect(0,0,w,h);g.fillStyle=C.lime;g.fillRect(0,0,w,WALL);g.fillRect(0,h-WALL,w,WALL);g.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<h;i+=24)g.fillRect(w/2-2,i,4,12);
    g.fillStyle=C.lime;g.fillRect(18,py-PH/2,10,PH);g.fillStyle=C.lavender;g.fillRect(w-28,ay-PH/2,10,PH);
    g.fillStyle='#fff';g.fillRect(ball.x-6,ball.y-6,12,12);
    g.font='700 44px '+A.font;g.textAlign='center';g.fillText(me,w/2-60,60);g.fillText(ai,w/2+60,60);
    if(state=='ready')A.overlayText(g,w,h,resumed?'PAUSED':'PONG',resumed?me+' – '+ai+' · Space to continue':'First to 5 · W/S or mouse · Space');
    if(state=='dead')A.overlayText(g,w,h,me>=5?'YOU WIN':'CPU WINS',me+' – '+ai+' · Space to rematch');
  });
  return()=>{offK();offL();window.removeEventListener('keydown',kd);window.removeEventListener('keyup',kd);};
}});
})();
