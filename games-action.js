(function(){
const A = window.Arcade, C = A.C;

A.register('snake', { mount(host, api){
  if(A.edu&&A.edu.on&&A.snakeMath) return A.snakeMath(host,api);
  const {g,w,h} = A.canvas(host), N=20, S=w/N;
  let snake, dir, nd, food, t, score, state='ready', resumed=false;
  const reset=()=>{snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir={x:1,y:0};nd=dir;score=0;t=0;resumed=false;place();api.score(0);};
  const place=()=>{do{food={x:Math.random()*N|0,y:Math.random()*N|0}}while(snake.some(s=>s.x==food.x&&s.y==food.y));};
  reset();
  const R=api.resume; if(R&&R.snake){snake=R.snake;dir=R.dir;nd=dir;food=R.food;score=R.score;api.score(score);resumed=true;}
  api.snap&&api.snap(()=>state=='dead'||(state=='ready'&&!resumed)?null:{snake,dir,food,score});
  const offK=A.keys(e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];
    if(state!='play'&&(e.key==' '||m)){if(state=='dead')reset();state='play';}
    if(m&&(m[0]!=-dir.x||m[1]!=-dir.y))nd={x:m[0],y:m[1]};});
  const offL=A.loop(dt=>{
    if(state=='play'){t+=dt;const sp=Math.max(A.D(.09,.06,.045),A.D(.16,.12,.085)-score*.002);
      while(t>sp){t-=sp;dir=nd;const hd={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
        if(hd.x<0||hd.y<0||hd.x>=N||hd.y>=N||snake.some(s=>s.x==hd.x&&s.y==hd.y)){state='dead';A.sfx('over');api.over(score);break;}
        snake.unshift(hd);if(hd.x==food.x&&hd.y==food.y){score++;api.score(score);A.sfx('point');place();}else snake.pop();}}
    g.fillStyle=C.forest;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<N;i++)for(let j=0;j<N;j++)if((i+j)%2)g.fillRect(i*S,j*S,S,S);
    g.fillStyle=C.pink;g.beginPath();g.arc(food.x*S+S/2,food.y*S+S/2,S/2.6,0,7);g.fill();
    snake.forEach((s,i)=>{g.fillStyle=i?C.green:C.lime;g.fillRect(s.x*S+1,s.y*S+1,S-2,S-2);});
    if(state=='ready')A.overlayText(g,w,h,resumed?'PAUSED':'SNAKE',resumed?'Length '+snake.length+' · Space or an arrow to continue':'Arrows or WASD · Space to start');
    if(state=='dead')A.overlayText(g,w,h,'GAME OVER','Score '+score+' · Space to go again');
  });
  return()=>{offK();offL();};
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
  const reset=()=>{px=w/2;pw=A.D(100,80,64);score=0;lives=A.D(5,3,2);level=1;combo=0;comboT=0;fireT=laserT=catchT=0;bombN=0;wideT=slowT=0;wideN=0;flash=0;build();serve();api.score(0);};
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
      if(lost&&!balls.length){ const die=()=>{ lives--; combo=0; A.sfx('bad'); flash=.3; wideT=0; wideN=0; fireT=laserT=catchT=0; bombN=0; if(lives<=0){state='dead';A.sfx('over');api.over(score);} else serve(); };
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
  const {c,g,w,h}=A.canvas(host), GAP=A.D(175,140,112);
  let y,vy,pipes,score,t,state='ready',resumed=false;
  const reset=()=>{y=h/2;vy=0;pipes=[];score=0;t=0;resumed=false;api.score(0);};reset();
  if(api.resume&&api.resume.pipes){y=api.resume.y;pipes=api.resume.pipes;score=api.resume.score;api.score(score);resumed=true;}
  api.snap&&api.snap(()=>state=='play'||(state=='ready'&&resumed)?{y,pipes:pipes.map(p=>({...p})),score}:null);
  const flap=()=>{if(state=='dead'){reset();state='ready';return;}state='play';vy=-300;A.sfx('flip');};
  const offK=A.keys(e=>{if(e.key==' '||e.key=='ArrowUp')flap();});c.addEventListener('mousedown',flap);
  const offL=A.loop(dt=>{
    if(state=='play'){vy+=900*dt;y+=vy*dt;t+=dt;if(t>1.4){t=0;pipes.push({x:w,gy:80+Math.random()*(h-GAP-160),p:0});}
      pipes.forEach(p=>{p.x-=A.D(120,150,185)*dt;if(!p.p&&p.x+50<100){p.p=1;score++;api.score(score);A.sfx('point');}
        if(p.x<116&&p.x+50>84&&(y-14<p.gy||y+14>p.gy+GAP))die();});
      pipes=pipes.filter(p=>p.x>-60);if(y>h-30||y<0)die();}
    g.fillStyle=C.sky;g.fillRect(0,0,w,h);
    g.fillStyle=C.forest;g.beginPath();g.moveTo(0,h-30);[[80,h-110],[170,h-60],[260,h-150],[360,h-70],[440,h-120],[480,h-80]].forEach(p=>g.lineTo(...p));g.lineTo(w,h);g.lineTo(0,h);g.fill();
    g.fillStyle=C.green;pipes.forEach(p=>{g.fillRect(p.x,0,50,p.gy);g.fillRect(p.x,p.gy+GAP,50,h);});
    g.fillStyle=C.gold;g.beginPath();g.arc(100,y,14,0,7);g.fill();g.fillStyle=C.orange;g.fillRect(110,y-3,10,6);
    g.fillStyle=C.ink;g.beginPath();g.arc(104,y-5,3,0,7);g.fill();
    g.fillStyle=C.forest;g.font='700 40px '+A.font;g.textAlign='center';g.fillText(score,w/2,60);
    if(state=='ready')A.overlayText(g,w,h,resumed?'PAUSED':'FLAPPER',resumed?score+' pipes so far · flap to continue':'Space or click to flap');
    if(state=='dead')A.overlayText(g,w,h,'GROUNDED','Score '+score+' · Space to reset');
  });
  function die(){if(state!='play')return;state='dead';A.sfx('over');api.over(score);}
  return()=>{offK();offL();};
}});

A.register('pong', { mount(host, api){
  const {c,g,w,h}=A.canvas(host), PH=70, WALL=12;
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
      ay+=Math.sign(ball.y-ay)*Math.min(Math.abs(ball.y-ay),A.D(160,250,360)*dt);ay=Math.max(WALL+PH/2,Math.min(h-WALL-PH/2,ay));
      ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.vx=Math.sign(ball.vx)*Math.min(Math.abs(ball.vx),A.D(400,500,600));ball.vy=Math.max(-Math.abs(ball.vx)*.8,Math.min(Math.abs(ball.vx)*.8,ball.vy));
      if(ball.y<WALL+6){ball.y=WALL+6;ball.vy=Math.abs(ball.vy);A.sfx('blip');} if(ball.y>h-WALL-6){ball.y=h-WALL-6;ball.vy=-Math.abs(ball.vy);A.sfx('blip');}
      if(ball.x<30&&ball.x>18&&Math.abs(ball.y-py)<PH/2+6&&ball.vx<0){ball.vx=-ball.vx*1.06;ball.vy+=(ball.y-py)*5;A.sfx('hit');}
      if(ball.x>w-30&&ball.x<w-18&&Math.abs(ball.y-ay)<PH/2+6&&ball.vx>0){ball.vx=-ball.vx*1.04;ball.vy+=(ball.y-ay)*4;A.sfx('hit');}
      if(ball.x<0){ if(A.learnOn()){ quizzing=true; serve(1); A.quiz(host,'ANSWER TO BLOCK THE POINT',ok=>{ quizzing=false; edu(ok); if(!ok){ai++;A.sfx('bad');} }); } else {ai++;A.sfx('bad');serve(1);} }if(ball.x>w){me++;api.score(me*100);A.sfx('point');serve(-1);}
      if(me>=5||ai>=5){state='dead';if(me>=5&&ai==0&&api.stat)api.stat('pongShutout',1,'add');me>=5?A.sfx('win'):A.sfx('over');api.over(me*100+(me>=5?300:0));}}
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
