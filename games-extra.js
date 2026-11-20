(function(){
const A = window.Arcade, C = A.C, el = A.el, {board, splash} = A.ui;

// ---------- 2048 family: sizes 3–6, pairs (×2) or triples (×3), three move styles ----------
A.register('2048', { mount(host, api){
  // Scores build 10× slower than before (each merge is worth a tenth of the old points) and are capped so they can't run away.
  { const a0 = api; api = {...a0, score: n => a0.score(Math.floor(n)), over: n => a0.over(Math.floor(n))}; }
  const b = board(host, C.sand);
  const PAL=['#EDE9D8','#e4f7a8',C.lime,'#9fe07a',C.green,'#028a4e',C.forest,C.sky,C.blue,C.pink,C.gold,'#AB2372',C.orange,C.ink];
  let cfg={size:4,base:2,mode:'smooth'}; try{Object.assign(cfg,JSON.parse(localStorage.getItem('wl-2048-cfg'))||{});}catch(e){}
  const saveCfg=()=>{try{localStorage.setItem('wl-2048-cfg',JSON.stringify(cfg));}catch(e){}};
  const segs=[];
  const seg=(label,key,opts,host,onChange)=>{ const wrap=el('div',{display:'flex',alignItems:'center',gap:'6px',flexShrink:0});
    const s=el('div',{display:'flex',background:'rgba(1,86,64,.15)',borderRadius:'999px',padding:'3px',gap:'2px'});
    const bs=opts.map(([v,t])=>{const x=el('button',{border:'none',borderRadius:'999px',padding:'4px 8px',fontFamily:A.font,fontWeight:700,fontSize:'12px',cursor:'pointer',whiteSpace:'nowrap'},t);
      x.onclick=()=>{ if(cfg[key]===v)return; cfg[key]=v; saveCfg(); paint(); x.blur(); A.sfx('blip'); onChange&&onChange(); }; s.appendChild(x); return [v,x];});
    const paint=()=>bs.forEach(([v,x])=>{const on=cfg[key]===v;x.style.background=on?C.forest:'transparent';x.style.color=on?'#fff':C.forest;});
    segs.push(paint); wrap.append(el('div',{fontSize:'11px',fontWeight:700,color:C.forest,letterSpacing:'.1em',whiteSpace:'nowrap'},label),s); host.appendChild(wrap); paint(); };
  const row1=el('div',{position:'absolute',top:'8px',left:'16px',right:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'});
  const row2=el('div',{position:'absolute',top:'38px',left:'16px',right:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'});
  b.append(row1,row2);
  const goal=el('div',{fontSize:'12px',fontWeight:700,color:C.forest,whiteSpace:'nowrap'});
  seg('SIZE','size',[[3,'3'],[4,'4'],[5,'5'],[6,'6']],row1,()=>reset());
  seg('MOVE','mode',[['crawl','Crawl'],['glide','Glide'],['smooth','Smooth'],['fast','Fast']],row1);
  seg('BASE','base',[[2,'2s'],[3,'3s'],[4,'4s'],[5,'5s']],row2,()=>reset());
  row2.appendChild(goal);
  const S=400, top=70, left=40;
  const area=el('div',{position:'absolute',left:left+'px',top:top+'px',width:S+'px',height:S+'px',background:'rgba(1,86,64,.12)',borderRadius:'14px',overflow:'hidden'}); b.appendChild(area);
  let N, P, G, CELL, at, tiles=[], score=0, over=false, pending=null, movedAny=false, chances=3, hist=[], undos=0;
  const U2=k=>(A.upg&&A.upg[k])||0;
  const undoB=el('button',{border:'none',borderRadius:'999px',padding:'4px 10px',fontFamily:A.font,fontWeight:700,fontSize:'12px',cursor:'pointer',background:C.forest,color:'#fff',marginLeft:'8px',display:U2('undo')?'':'none'});
  const paintUndo=()=>{undoB.textContent='↶ Undo · '+undos; undoB.style.opacity=undos&&hist.length?1:.5;};
  const undo=()=>{ if(!undos||!hist.length)return; settle(); const h=hist.pop(); undos--; tiles.forEach(t=>t.el.remove()); tiles=[]; h.cells.forEach(x=>make(x.r,x.c,x.v)); score=h.score; over=false; api.score(score); [...b.children].forEach(x=>{ if(x.dataset&&x.dataset.splash)x.remove(); }); A.sfx('flip'); paintUndo(); };
  undoB.onclick=e=>{e.stopPropagation();undo();undoB.blur();}; row2.appendChild(undoB);
  const lvl=v=>Math.round(Math.log(v)/Math.log(cfg.base));
  const look=t=>{const L=lvl(t.v),digits=String(t.v).length;t.inner.textContent=t.v;t.inner.style.background=PAL[Math.min(L-1,PAL.length-1)];t.inner.style.color=L>=5?'#fff':C.forest;
    t.inner.style.fontSize=Math.round(Math.min(CELL*.42,CELL*1.55/Math.max(digits,2)))+'px';};
  const dur=()=>cfg.mode=='crawl'?1100:cfg.mode=='glide'?320:cfg.mode=='smooth'?150:55;
  const place=(t,d)=>{t.el.style.transition=d?`transform ${d}ms ${cfg.mode=='glide'||cfg.mode=='crawl'?'cubic-bezier(.45,0,.25,1)':'cubic-bezier(.25,.8,.35,1)'}`:'none';t.el.style.transform=`translate(${at(t.c)}px,${at(t.r)}px)`;};
  const bump=(t,from)=>{t.inner.style.transition='none';t.inner.style.transform=`scale(${from})`;void t.inner.offsetWidth;t.inner.style.transition=`transform ${cfg.mode=='fast'?90:cfg.mode=='crawl'?420:cfg.mode=='glide'?240:160}ms cubic-bezier(.3,1.6,.5,1)`;t.inner.style.transform='scale(1)';};
  const make=(r,c,v)=>{const e=el('div',{position:'absolute',left:0,top:0,width:CELL+'px',height:CELL+'px',zIndex:2});
    const inner=el('div',{width:'100%',height:'100%',borderRadius:N>=5?'8px':'10px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,boxShadow:'0 3px 0 rgba(1,86,64,.18)'});
    e.appendChild(inner);area.appendChild(e);const t={r,c,v,el:e,inner};look(t);place(t,0);bump(t,.2);tiles.push(t);return t;};
  const cellAt=(r,c)=>tiles.find(t=>!t.dead&&t.r==r&&t.c==c);
  const spawn=()=>{const e=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!cellAt(r,c))e.push([r,c]);if(e.length){const[r,c]=e[Math.random()*e.length|0];make(r,c,Math.random()<A.D(.97,.9,.72)?cfg.base:cfg.base*cfg.base);}};
  const canMove=()=>{ const n=2; const v=(r,c)=>{const t=cellAt(r,c);return t?t.v:0;};
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){ if(!v(r,c))return true;
      for(const[dr,dc]of[[0,1],[1,0]]){let ok=true;for(let k=1;k<n;k++){const rr=r+dr*k,cc=c+dc*k;if(rr>=N||cc>=N||v(rr,cc)!=v(r,c)){ok=false;break;}}if(ok)return true;} } return false; };
  const settle=()=>{ if(!pending)return; clearTimeout(pending.to); const {merged}=pending; pending=null;
    tiles.filter(t=>t.dead).forEach(t=>t.el.remove()); tiles=tiles.filter(t=>!t.dead);
    merged.forEach(t=>{t.v*=cfg.base;look(t);bump(t,1.22);t.el.style.zIndex=2;});
    if(merged.length){A.sfx('point');api.stat&&api.stat('tileLvl',Math.max(...merged.map(t=>lvl(t.v))));}
    spawn(); api.score(score);
    if(!canMove()&&A.learnOn()&&chances>0){ chances--; over=true; A.quiz(b,'STUCK! ANSWER TO CLEAR YOUR TWO SMALLEST TILES',ok=>{ try{api.edu&&api.edu(ok);}catch(e){} if(ok){ tiles.filter(t=>!t.dead).sort((a,c)=>a.v-c.v).slice(0,2).forEach(t=>{t.dead=true;t.el.remove();}); tiles=tiles.filter(t=>!t.dead); over=false; } else { A.sfx('over'); api.over(score); setTimeout(()=>splash(b,'NO MOVES LEFT','Score '+score,'New board',reset),300); } }); return; }
    if(!canMove()&&undos>0&&hist.length&&!A.learnOn()){ over=true; A.ui.choice(b,'STUCK!','Spend an undo? You have '+undos+' left.',[['↶ Undo',()=>undo()],['End game',()=>{ over=false; endNow(); }]]); return; }
    endNow(); };
  const endNow=()=>{
    if(!canMove()){over=true;A.sfx('over');if(tiles.some(t=>!t.dead&&t.v>=2048))api.perfect&&api.perfect();api.over(score);setTimeout(()=>splash(b,'NO MOVES LEFT','Score '+Math.floor(score)+' · best tile '+Math.max(...tiles.map(t=>t.v)),'New board',reset),400);} };
  const move=d=>{ if(over)return; if(pending&&(cfg.mode=='glide'||cfg.mode=='crawl'))return; settle(); const snapB=tiles.filter(t=>!t.dead).map(t=>({r:t.r,c:t.c,v:t.v})), scB=score;
    const n=2, D=dur(); let moved=false; const merged=[];
    for(let k=0;k<N;k++){ let line=[...Array(N)].map((_,j)=>d=='L'||d=='R'?[k,j]:[j,k]); if(d=='R'||d=='D')line.reverse();
      const list=line.map(([r,c])=>cellAt(r,c)).filter(Boolean); let t=0,i=0;
      while(i<list.length){ const run=list.slice(i,i+n);
        const [nr,nc]=line[t];
        if(run.length==n&&run.every(x=>x.v==run[0].v)){ run.forEach((x,j)=>{ if(x.r!=nr||x.c!=nc)moved=true; x.r=nr;x.c=nc; if(j){x.dead=true;x.el.style.zIndex=1;} });
          run[0].el.style.zIndex=3; merged.push(run[0]); score=Math.min(2e6, score+run[0].v*cfg.base/10); moved=true; i+=n; }
        else { const x=list[i]; if(x.r!=nr||x.c!=nc)moved=true; x.r=nr;x.c=nc; i++; }
        t++; } }
    if(!moved)return; movedAny=true; hist.push({cells:snapB,score:scB}); if(hist.length>30)hist.shift(); paintUndo();
    tiles.forEach(t=>place(t,D)); A.sfx('blip');
    pending={merged,to:setTimeout(settle,D)}; };
  const simMove=(V,d)=>{ const n=2; let gain=0, moved=false; const out=V.map(r=>r.slice());
    for(let k=0;k<N;k++){ let line=[...Array(N)].map((_,j)=>d=='L'||d=='R'?[k,j]:[j,k]); if(d=='R'||d=='D')line.reverse();
      const vals=line.map(([r,c])=>V[r][c]).filter(Boolean), res=[]; let i=0;
      while(i<vals.length){ const run=vals.slice(i,i+n); if(run.length==n&&run.every(x=>x==run[0])){res.push(run[0]*cfg.base);gain+=run[0]*cfg.base;i+=n;} else {res.push(vals[i]);i++;} }
      line.forEach(([r,c],j)=>{const v=res[j]||0; if(out[r][c]!=v)moved=true; out[r][c]=v;}); }
    return {out,gain,moved}; };
  const showArrow=d=>{ const a=el('div',{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'160px',fontWeight:700,color:C.forest,opacity:0,zIndex:6,pointerEvents:'none',transition:'opacity .25s'},{U:'↑',D:'↓',L:'←',R:'→'}[d]); area.appendChild(a); requestAnimationFrame(()=>a.style.opacity=.6); setTimeout(()=>a.style.opacity=0,900); setTimeout(()=>a.remove(),1300); };
  const hints=A.hinter(api,()=>{ if(over||pending)return false; const V=[...Array(N)].map((_,r)=>[...Array(N)].map((_,c)=>{const t=cellAt(r,c);return t?t.v:0;}));
    let best=null; for(const d of ['U','L','R','D']){ const m=simMove(V,d); if(!m.moved)continue; const flat=m.out.flat(), mx=Math.max(...flat);
      const corner=[m.out[0][0],m.out[0][N-1],m.out[N-1][0],m.out[N-1][N-1]].includes(mx)?mx:0; let look=0;
      for(const d2 of ['U','L','R','D']){const m2=simMove(m.out,d2); if(m2.moved) look=Math.max(look,m2.gain*.5+m2.out.flat().filter(v=>!v).length*4);}
      const sc=m.gain+flat.filter(v=>!v).length*8+corner*.5+look; if(!best||sc>best.sc)best={d,sc}; }
    if(!best)return false; showArrow(best.d); }, A.D(8,5,2));
  const reset=()=>{ if(pending){clearTimeout(pending.to);pending=null;} tiles.forEach(t=>t.el.remove()); tiles=[]; score=0; over=false; movedAny=false; chances=3; hist=[]; undos=U2('undo'); paintUndo();
    [...area.children].forEach(x=>x.remove());
    N=cfg.size; P=N>=5?7:10; G=N>=5?7:10; CELL=(S-2*P-(N-1)*G)/N; at=i=>P+i*(CELL+G);
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)area.appendChild(el('div',{position:'absolute',left:at(c)+'px',top:at(r)+'px',width:CELL+'px',height:CELL+'px',borderRadius:N>=5?'8px':'10px',background:'rgba(255,255,255,.35)'}));
    { let gv=cfg.base; while(gv<2000)gv*=cfg.base; goal.textContent=cfg.base+'+'+cfg.base+'='+(cfg.base*cfg.base)+' · goal '+gv; }
    spawn(); spawn(); if(N>=5)spawn(); api.score(0); hints.reset(); };
  const kmap={ArrowLeft:'L',ArrowRight:'R',ArrowUp:'U',ArrowDown:'D',j:'L',l:'R',i:'U',k:'D'};
  const kd=e=>{ if(e.metaKey||e.ctrlKey||e.altKey)return; const d=kmap[e.key.length==1?e.key.toLowerCase():e.key]; if(!d)return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); if(!e.repeat||(cfg.mode!='glide'&&cfg.mode!='crawl'))move(d); };
  window.addEventListener('keydown',kd,true);
  const hint=el('div',{position:'absolute',bottom:'4px',left:0,right:0,textAlign:'center',fontSize:'11px',fontWeight:700,color:C.forest,letterSpacing:'.08em'},'ARROW KEYS OR I J K L');
  b.appendChild(hint);
  api.snap&&api.snap(()=>{ if(over||!movedAny)return null; if(pending)settle(); return over?null:{size:N,base:cfg.base,score,vals:tiles.filter(t=>!t.dead).map(t=>[t.r,t.c,t.v])}; });
  const RS=api.resume;
  if(RS&&RS.vals){ cfg.size=RS.size; cfg.base=RS.base; segs.forEach(p=>p()); reset(); tiles.forEach(t=>t.el.remove()); tiles=[]; RS.vals.forEach(([r,c,v])=>make(r,c,v)); score=RS.score; api.score(score); movedAny=true; }
  else reset();
  return ()=>{window.removeEventListener('keydown',kd,true); if(pending)clearTimeout(pending.to);};
}});

// ---------- Connect 4 ----------
(()=>{ if(document.getElementById('wl-c4-fx'))return; const l=document.createElement('link'); l.rel='stylesheet'; l.href='https://fonts.googleapis.com/css2?family=Creepster&family=Cinzel+Decorative:wght@900&display=swap'; document.head.appendChild(l);
  const s=document.createElement('style'); s.id='wl-c4-fx'; s.textContent='@keyframes wlDrip{0%{height:0}100%{height:var(--h)}}@keyframes wlSlam{0%{transform:scale(2.2) rotate(-4deg);opacity:0}60%{transform:scale(.95);opacity:1}100%{transform:none;opacity:1}}@keyframes wlBub{0%{transform:translateY(6px);opacity:0}100%{transform:none;opacity:1}}'; document.head.appendChild(s); })();
const C4AI={easy:{name:'Easy',d:0,n:40},normal:{name:'Normal',d:3,n:2},hard:{name:'Hard',d:6,n:0,t:700},
  littletimmy:{name:'Little Timmy',d:4,n:6,col:'#64CDF5',ini:'LT'},jimmy:{name:'Jimmy',d:7,n:0,t:800,col:'#F9BF01',ini:'J'},
  timmy:{name:'Timmy',d:8,n:0,t:1000,col:'#B3001B',ini:'T'},baubau:{name:'Lord Emperor Bau Bau',d:24,n:0,t:2000,col:'#5B2A86',ini:'♛'},thetimmy:{name:'THE TIMMY',d:30,n:0,t:3200,col:'#121313',ini:'TT'}};
const C4LINES={
  thetimmy:{start:["I am not Timmy. I am THE TIMMY.","This lawn? This lawn is the whole world.","Every column. Every row. Mine."],
    move:["Inevitable.","THE TIMMY does not miss.","Already calculated.","You're playing checkers. I'm playing Connect.","Off. My. Lawn."],
    threat:["It's over. You just don't know it yet.","Feel that? That's the lawn closing in."],win:["THE TIMMY HAS SPOKEN."],lose:["...Rematch. Now."]},
  littletimmy:{start:["Hi! I'm Little Timmy! I'm five and a half!","My big brother Timmy taught me this!","I'm gonna win and get a juice box!"],
    move:["Is it my turn? It's my turn!","I like the pink ones.","Wheee!","Mommy says I'm a genius.","Plop!"],threat:["Ooh ooh ooh, I see something!"],
    win:["I WON! I'm telling Timmy!","Yay! Juice box time!"],lose:["Waaah! Rematch!","That's not fair, you're bigger!"]},
  jimmy:{start:["Name's Jimmy. Timmy's my cousin. I'm the nice one.","Let's keep it friendly, pal."],
    move:["Hmm, interesting.","Nice try, pal.","I've got a plan. Probably.","Jimmy's on it.","Ooh, spicy column."],threat:["Better watch that spot, buddy."],
    win:["Good game! ...For me.","Don't tell Timmy I went easy. I didn't."],lose:["Well played, champ.","Okay, okay. You got me."]},
  timmy:{start:["Yeah, it's dangerous to get out of my lawn.","You're on Timmy's turf now.","Step onto my lawn. I dare you."],
    move:["I've been playing this since before you were born.","Cute move.","Keep off the grass.","That column? Bold.","Timmy sees everything.","You hear that? That's my lawn growing."],
    threat:["Look at that. Look. At. That.","You're running out of lawn."],bow:["Y-yes, Your Majesty. Of course, Your Majesty.","Your Majesty can walk on my lawn any time."],win:["Get off my lawn."],lose:["...The sprinklers were on. Doesn't count.","Lucky. Real lucky."]},
  baubau:{start:["Kneel before Lord Emperor Bau Bau.","The Empire accepts your challenge, peasant.","Timmy? Timmy is my squire."],
    move:["Bau Bau has foreseen this.","Your columns belong to the Empire.","A futile gesture.","How quaint.","The throne is patient."],
    threat:["The prophecy unfolds.","Surrender is still an option."],win:["Bow."],lose:["...Impossible. Guards! GUARDS!","The Empire will remember this."]}};
const c4Mount=(host,api,remount)=>{
  let V={size:'7x6',n:4}; try{Object.assign(V,JSON.parse(localStorage.getItem('wl-c4-var'))||{});}catch(e){}
  const [K,R]=V.size.split('x').map(Number), N=Math.min(V.n,R,K);
  const CS=Math.min(58,Math.floor(420/K),Math.floor(420/R)), DS=CS-10, W=K*CS, H=R*CS, L=(480-W)/2, TOP=104;
  const b = board(host, C.cream); b.style.height=(TOP+H+150)+'px';
  let raf, tos=[], live=true;
  const P1=C.lime, P2=C.pink, order=[...Array(K).keys()].sort((a,c)=>Math.abs(a-(K-1)/2)-Math.abs(c-(K-1)/2)), pinkId=C4AI[A.diff]?A.diff:'normal';
  let first=true, mode='play', limeId='hard'; try{ first=localStorage.getItem('wl-c4-first')!=='0'; mode=localStorage.getItem('wl-c4-mode')||'play'; limeId=localStorage.getItem('wl-c4-lime')||'hard'; if(!C4AI[limeId])limeId='hard'; }catch(e){}
  const store=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
  const status=el('div',{position:'absolute',top:'10px',left:L+'px',right:L+'px',display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:'16px',color:C.forest}); b.appendChild(status);
  const sL=el('span'); status.append(sL);
  const help=el('div',{position:'absolute',top:'32px',left:L+'px',color:'#666',fontWeight:500,fontSize:'12px'},'Connect '+N+' on '+K+'×'+R+' · ← → aim · Space drop'); b.appendChild(help);
  const layer=el('div',{position:'absolute',left:L+'px',top:TOP+'px',width:W+'px',height:H+'px',zIndex:1}); b.appendChild(layer);
  const plate=el('div',{position:'absolute',left:L+'px',top:TOP+'px',width:W+'px',height:H+'px',zIndex:2,borderRadius:'12px',
    backgroundImage:'radial-gradient(circle at center, transparent '+(DS/2-1)+'px, '+C.blue+' '+(DS/2)+'px)',backgroundSize:CS+'px '+CS+'px',boxShadow:'0 8px 0 #01335e'}); b.appendChild(plate);
  b.appendChild(el('div',{position:'absolute',left:(L-14)+'px',top:(TOP+H)+'px',width:(W+28)+'px',height:'14px',background:'#01335e',borderRadius:'0 0 10px 10px',zIndex:3}));
  const ghost=el('div',{position:'absolute',top:(TOP-DS-12)+'px',width:DS+'px',height:DS+'px',borderRadius:'50%',background:P1,zIndex:3,transition:'left .16s cubic-bezier(.3,.8,.4,1), opacity .2s',boxShadow:'inset 0 -4px 0 rgba(0,0,0,.15)'}); b.appendChild(ghost);
  const hit=el('div',{position:'absolute',left:L+'px',top:(TOP-70)+'px',width:W+'px',height:(H+70)+'px',zIndex:4,cursor:'pointer'}); b.appendChild(hit);
  // speech + controls
  const bub=el('div',{position:'absolute',left:(L-14)+'px',right:(L-14)+'px',top:(TOP+H+24)+'px',height:'36px',display:'flex',alignItems:'center',gap:'8px',opacity:0,transition:'opacity .4s'}); b.appendChild(bub);
  const ctl=el('div',{position:'absolute',left:(L-14)+'px',right:(L-14)+'px',top:(TOP+H+68)+'px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',fontSize:'13px',fontWeight:700,color:C.forest}); b.appendChild(ctl);
  const segBox=(opts,get,set,after)=>{ const s=el('div',{display:'flex',background:'#fff',borderRadius:'999px',padding:'2px',gap:'2px'});
    const bs=opts.map(([t,v])=>{ const x=el('button',{border:'none',borderRadius:'999px',padding:'4px 11px',fontFamily:A.font,fontWeight:700,fontSize:'12px',cursor:'pointer'},t); x.onclick=e=>{e.stopPropagation(); if(get()==v)return; set(v); paint(); A.sfx('blip'); (after||restart)();}; s.appendChild(x); return [x,v]; });
    const paint=()=>bs.forEach(([x,v])=>{x.style.background=get()==v?C.forest:'transparent'; x.style.color=get()==v?'#fff':C.forest;}); paint(); return s; };
  const grp=(label,node)=>{ const w=el('div',{display:'flex',alignItems:'center',gap:'6px'}); w.append(el('span',{color:'#666',fontWeight:500},label),node); return w; };
  const right=el('div',{display:'flex',alignItems:'center',gap:'6px'});
  ctl.append(grp('Mode',segBox([['Play','play'],['Watch AIs','watch']],()=>mode,v=>{mode=v;store('wl-c4-mode',v);})),right);
  const vrow=el('div',{position:'absolute',left:(L-14)+'px',right:(L-14)+'px',top:(TOP+H+106)+'px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',fontSize:'13px',fontWeight:700,color:C.forest}); b.appendChild(vrow);
  const saveV=()=>store('wl-c4-var',JSON.stringify(V));
  vrow.append(grp('Board',segBox([['7×6','7x6'],['8×8','8x8'],['9×9','9x9'],['10×10','10x10']],()=>V.size,v=>{V.size=v;saveV();},()=>remount())),
    grp('Connect',segBox([['1',1],['2',2],['3',3],['4',4],['5',5],['6',6]],()=>V.n,v=>{V.n=v;saveV();},()=>remount())));
  const firstSeg=grp('You go',segBox([['1st',true],['2nd',false]],()=>first,v=>{first=v;store('wl-c4-first',v?'1':'0');}));
  const sel=el('select',{border:'none',borderRadius:'999px',padding:'5px 8px',fontFamily:A.font,fontWeight:700,fontSize:'12px',color:C.forest,background:'#fff',cursor:'pointer',maxWidth:'170px'});
  Object.entries({easy:'Easy CPU',normal:'Normal CPU',hard:'Hard CPU',littletimmy:'Little Timmy',jimmy:'Jimmy',timmy:'Timmy',baubau:'Lord Emperor Bau Bau',thetimmy:'THE TIMMY'}).forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;sel.appendChild(o);});
  sel.value=limeId; sel.onchange=()=>{limeId=sel.value;store('wl-c4-lime',limeId);A.sfx('blip');restart();}; sel.onkeydown=e=>e.stopPropagation();
  const limeGrp=grp('Lime',sel);
  const paintCtl=()=>{ right.innerHTML=''; right.appendChild(mode=='play'?firstSeg:limeGrp); help.style.display=mode=='play'?'':'none'; };
  let bubT;
  const talk=(id,kind,chance=1)=>{ const Ls=C4LINES[id]; if(!Ls||!Ls[kind]||Math.random()>chance)return; const ai=C4AI[id], line=Ls[kind][Math.random()*Ls[kind].length|0];
    bub.innerHTML=''; bub.append(el('div',{width:'34px',height:'34px',flexShrink:0,borderRadius:'50%',background:ai.col,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'14px'},ai.ini),
      el('div',{background:'#fff',borderRadius:'14px',padding:'7px 12px',fontSize:'13px',fontWeight:500,color:C.ink,animation:'wlBub .25s ease-out',minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'},'')); 
    const tx=bub.lastChild; tx.append(el('span',{fontWeight:700,color:ai.col,marginRight:'6px'},ai.name+':'),document.createTextNode(line));
    bub.style.opacity=1; clearTimeout(bubT); bubT=setTimeout(()=>bub.style.opacity=0,3600); };
  let g, aim=3, turn, busy, moves, done, streak=0, sides;
  const aimAt=c=>{aim=Math.max(0,Math.min(K-1,c));ghost.style.left=(L+aim*CS+5)+'px';};
  const winAt=(bd,p,r,c)=>{ for(const[dr,dc]of[[0,1],[1,0],[1,1],[1,-1]]){ const cells=[[r,c]];
      for(const s of[1,-1]){let rr=r+dr*s,cc=c+dc*s;while(rr>=0&&rr<R&&cc>=0&&cc<K&&bd[rr][cc]==p){cells.push([rr,cc]);rr+=dr*s;cc+=dc*s;}}
      if(cells.length>=N)return cells;} return null; };
  const lowest=(bd,c)=>{for(let r=R-1;r>=0;r--)if(!bd[r][c])return r;return -1;};
  const MID=K>>1;
  const evalB=bd=>{ let s=0; for(let r=0;r<R;r++){if(bd[r][MID]==2)s+=3;else if(bd[r][MID]==1)s-=3;}
    const sc=(c2,c1)=>{ if(c1&&c2)return 0; const e=N-c1-c2; if(c2==N-1&&e==1)return 6; if(c2==N-2&&e==2)return 2; if(c1==N-1&&e==1)return -8; if(c1==N-2&&e==2)return -2; return 0; };
    for(const[dr,dc]of[[0,1],[1,0],[1,1],[1,-1]]) for(let r=0;r<R;r++)for(let c=0;c<K;c++){ const er=r+dr*(N-1), ec=c+dc*(N-1); if(er>=R||ec<0||ec>=K)continue;
      let c2=0,c1=0; for(let i=0;i<N;i++){const v=bd[r+dr*i][c+dc*i]; if(v==2)c2++;else if(v==1)c1++;} s+=sc(c2,c1); } return s; };
  let nodes=0, deadline=Infinity; const ABORT={};
  const TT=new Map(); // transposition table: remembers positions already searched
  const keyOf=bd=>{ let k=''; for(let r=0;r<R;r++) k+=bd[r].join(''); return k; };
  const nega=(bd,depth,a,be,p)=>{ if(((++nodes)&1023)==0&&performance.now()>deadline)throw ABORT; const vs=order.filter(c=>!bd[0][c]); if(!vs.length)return 0; if(!depth)return (p==2?1:-1)*evalB(bd);
    const key=keyOf(bd)+p, e=TT.get(key), a0=a; let first=-1;
    if(e){ if(e.d>=depth){ if(e.f==0)return e.v; if(e.f==1&&e.v>a)a=e.v; else if(e.f==2&&e.v<be)be=e.v; if(a>=be)return e.v; } first=e.m; }
    // immediate win check first, then best-known move, then centre-out
    for(const c of vs){ const r=lowest(bd,c); bd[r][c]=p; const w=winAt(bd,p,r,c); bd[r][c]=0; if(w)return 100000+depth; }
    const ord=first>=0&&!bd[0][first]?[first,...vs.filter(c=>c!=first)]:vs;
    let best=-1e9, bm=ord[0]; for(const c of ord){ const r=lowest(bd,c); bd[r][c]=p; const v=-nega(bd,depth-1,-be,-a,3-p); bd[r][c]=0;
      if(v>best){best=v;bm=c;} if(v>a)a=v; if(a>=be)break; }
    if(TT.size>400000)TT.clear(); TT.set(key,{d:depth,v:best,f:best<=a0?2:best>=be?1:0,m:bm}); return best; };
  const pickFor=(p,id)=>{ const lv=C4AI[id]||C4AI.normal, bd=g.map(r=>r.map(v=>p==2?v:(v?3-v:0)));
    const run=(d,pref)=>{ let best=-1e9, pick=-1; for(const c of [pref,...order.filter(x=>x!=pref)]){ if(c==null||c<0||bd[0][c])continue; const r=lowest(bd,c); bd[r][c]=2;
        const v=winAt(bd,2,r,c)?1e6:(lv.n? -nega(bd,d,-1e9,1e9,1)+Math.random()*lv.n : -nega(bd,d,-1e9,-best+1,1)); bd[r][c]=0; if(v>best){best=v;pick=c;} } return [pick,best]; };
    TT.clear(); let pick=order.find(c=>!bd[0][c]); deadline=performance.now()+(lv.t||600);
    try{ for(let d=0; d<=lv.d; d++){ const [pk,bv]=run(d,pick); if(pk>=0)pick=pk; if(bv>=99000)break; } }catch(e){ if(e!==ABORT)throw e; }
    deadline=Infinity; return pick; };
  const threatFor=p=>{ const bd=g.map(r=>r.slice()); for(let c=0;c<K;c++){ const r=lowest(bd,c); if(r<0)continue; bd[r][c]=p; const w=winAt(bd,p,r,c); bd[r][c]=0; if(w)return true; } return false; };
  const human=p=>mode=='play'&&p==1;
  const nameOf=p=>human(p)?'You':(C4AI[sides[p]]||C4AI.normal).name;
  const dropDisc=(c,p,cb)=>{ const r=lowest(g,c); if(r<0)return false; g[r][c]=p; busy=true;
    const d=el('div',{position:'absolute',left:(c*CS+5)+'px',top:'0px',width:DS+'px',height:DS+'px',borderRadius:'50%',background:p==1?P1:P2,boxShadow:'inset 0 -4px 0 rgba(0,0,0,.15)'}); layer.appendChild(d); d.dataset.rc=r+','+c;
    let y=-CS-10, v=0; const ty=r*CS+5; let last=performance.now(), bounces=0;
    const step=now=>{ if(!live)return; const dt=Math.min(.033,(now-last)/1000)*A.speed; last=now; v+=2600*dt; y+=v*dt;
      if(y>=ty){ y=ty; if(bounces<2&&v>260){ v=-v*0.28; bounces++; if(bounces==1)A.tone(220+r*30,.06,'triangle',.07);} else { d.style.transform='translateY('+ty+'px)'; busy=false; cb(r); return; } }
      d.style.transform='translateY('+y+'px)'; raf=requestAnimationFrame(step); };
    d.style.transform='translateY('+y+'px)'; raf=requestAnimationFrame(step); return true; };
  const btn=(t,fn)=>{ const x=el('button',{fontFamily:A.font,fontWeight:700,fontSize:'16px',padding:'12px 22px',borderRadius:'999px',border:'none',background:C.lime,color:C.forest,cursor:'pointer',marginTop:'22px'},t); x.onclick=e=>{e.stopPropagation();fn();}; return x; };
  const bigSplash=(kind,small,label,the)=>{ const blood=kind=='blood';
    const o=el('div',{position:'absolute',inset:0,zIndex:20,background:blood?'rgba(18,0,2,.93)':'rgba(34,10,52,.95)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'24px',boxSizing:'border-box'}); o.dataset.ov=1;
    const wrap=el('div',{position:'relative',animation:'wlSlam .55s cubic-bezier(.2,.9,.3,1.2) both'});
    if(blood){ wrap.append(el('div',{fontFamily:"'Creepster',"+A.font,fontSize:'78px',lineHeight:.95,color:'#C0001D',textShadow:'0 4px 0 #4a0008, 0 0 24px rgba(192,0,29,.55)',letterSpacing:'.02em'},'DOMINATED'),
        el('div',{fontFamily:"'Creepster',"+A.font,fontSize:the?'54px':'64px',lineHeight:1,color:'#C0001D',textShadow:'0 4px 0 #4a0008, 0 0 24px rgba(192,0,29,.55)'},the?'BY THE TIMMY!!':'BY TIMMY!!'));
      for(let i=0;i<16;i++){ const dw=4+Math.random()*7; const dr=el('div',{position:'absolute',top:'calc(100% - 14px)',left:(4+Math.random()*92)+'%',width:dw+'px',height:0,background:'#C0001D',borderRadius:'0 0 '+dw+'px '+dw+'px',animation:'wlDrip '+(1.4+Math.random()*1.6)+'s ease-in '+(.4+Math.random()*.8)+'s forwards'}); dr.style.setProperty('--h',(18+Math.random()*80)+'px'); wrap.appendChild(dr); }
      A.tone(90,.6,'sawtooth',.12); }
    else { wrap.append(el('div',{fontFamily:"'Cinzel Decorative',serif",fontSize:'40px',color:C.gold,lineHeight:1},'♛'),
        el('div',{fontFamily:"'Cinzel Decorative',serif",fontSize:'15px',letterSpacing:'.3em',color:'#E9D9FF',margin:'8px 0 6px'},'BY IMPERIAL DECREE'),
        el('div',{fontFamily:"'Cinzel Decorative',serif",fontWeight:900,fontSize:'38px',lineHeight:1.1,color:C.gold,textShadow:'0 3px 0 #7a5200, 0 0 30px rgba(249,191,1,.4)'},'CONQUERED BY'),
        el('div',{fontFamily:"'Cinzel Decorative',serif",fontWeight:900,fontSize:'30px',lineHeight:1.15,color:C.gold,textShadow:'0 3px 0 #7a5200'},'LORD EMPEROR BAU BAU')); }
    o.appendChild(wrap); const sm=el('div',{color:blood?'#f3c9cf':'#E9D9FF',fontSize:'15px',fontWeight:500,marginTop:blood?'70px':'18px',opacity:0,transition:'opacity .5s'},small); o.appendChild(sm);
    b.appendChild(o); tos.push(setTimeout(()=>{ sm.style.opacity=1; o.appendChild(btn(label,restart)); },1700)); };
  const finish=(who,cells)=>{ done=true; ghost.style.opacity=0;
    if(cells)cells.forEach(([r,c])=>{const d=[...layer.children].find(x=>x.dataset.rc==r+','+c); if(d){d.style.transition='box-shadow .3s';d.style.boxShadow='0 0 0 4px #fff, 0 0 18px 4px rgba(255,255,255,.8)';}});
    const wid=who?sides[who]:null, loser=who?sides[3-who]:null;
    if(who&&!human(who))talk(wid,'win'); if(who&&loser&&loser!='human')talk(loser,'lose',human(who)?1:.5);
    let sc=0, label='Rematch', small;
    if(mode=='play'){ if(who==1&&['timmy','baubau','thetimmy'].includes(pinkId)&&api.stat)api.stat('c4Boss',1,'add'); if(who==1){streak++;sc=Math.round((Math.max(100,420-moves*12*42/(R*K))+(streak-1)*50)*(1+(N-4)*.25));A.sfx('win');} else if(who==2){streak=0;A.sfx('over');} else {sc=50;A.sfx('blip');}
      if(who==1)api.perfect&&api.perfect(); api.score(sc); api.over(sc); label='Next round';
      small=who==1?'Won in '+moves+' moves · score '+sc+(streak>1?' · streak '+streak:''):who==2?'Streak reset. Shake it off.':'Dead even.'; }
    else { A.sfx(who?'win':'blip'); small=who?nameOf(who)+' ('+(who==1?'lime':'pink')+') beat '+nameOf(3-who)+'.':'Dead even. Nobody blinks.'; }
    tos.push(setTimeout(()=>{ if(wid=='timmy'||wid=='thetimmy')return bigSplash('blood',small,label,wid=='thetimmy'); if(wid=='baubau')return bigSplash('royal',small,label);
      const nm=who?nameOf(who):''; const big=!who?'BOARD FULL':human(who)?'FOUR IN A ROW':nm.toUpperCase()+' WINS';
      splash(b,big,small,label,restart); b.lastChild.dataset.ov=1; },1100)); };
  const after=(p,r,c)=>{ const w=winAt(g,p,r,c); if(w)return finish(p,w); if(g[0].every(x=>x))return finish(0); next(3-p); };
  const next=p=>{ turn=p; ghost.style.background=p==1?P1:P2;
    if(human(p)){ sL.textContent='Your move · you are lime'; return; }
    sL.textContent=nameOf(p)+' is thinking…';
    tos.push(setTimeout(()=>{ if(!live||done)return; const cc=pickFor(p,sides[p]); aimAt(cc);
      tos.push(setTimeout(()=>dropDisc(cc,p,rr=>{ const w=winAt(g,p,rr,cc); if(!w){ if(threatFor(p))talk(sides[p],'threat',.7); else talk(sides[p],'move',mode=='watch'?.3:.4); } after(p,rr,cc); }),180/A.speed)); },(mode=='watch'?420:260)/A.speed)); };
  const hintPick=()=>{ const bd=g.map(r=>r.map(v=>v?3-v:0)); let best=-1e9,pick=-1; for(const c of order){ if(bd[0][c])continue; const r=lowest(bd,c); bd[r][c]=2; const v=winAt(bd,2,r,c)?1e6:-nega(bd,4,-1e9,1e9,1); bd[r][c]=0; if(v>best){best=v;pick=c;} } return pick; };
  const hints=A.hinter(api,(quiet)=>{ if(busy||done||!human(turn))return false; const c=hintPick(); if(c<0)return false; if(!quiet)aimAt(c);
    const col=el('div',{position:'absolute',left:(L+c*CS)+'px',top:TOP+'px',width:CS+'px',height:H+'px',background:'rgba(249,191,1,.45)',zIndex:3,borderRadius:'10px',pointerEvents:'none',transition:'opacity .6s'}); b.appendChild(col); setTimeout(()=>col.style.opacity=0,1000); setTimeout(()=>col.remove(),1700); });
  const play=()=>{ if(busy||done||!human(turn))return; const c=aim; if(g[0][c]){A.sfx('bad');return;}
    if(A.learnOn()){ busy=true; A.quiz(b,'ANSWER TO DROP YOUR DISC',ok=>{ busy=false; try{api.edu&&api.edu(ok);}catch(e){} moves++; if(ok) dropDisc(c,1,r=>after(1,r,c)); else { sL.textContent='Missed it — the CPU takes your turn'; next(2); } }); return; }
    moves++; dropDisc(c,1,r=>after(1,r,c)); };
  const start=()=>{ hints.reset(); [...b.children].forEach(x=>x.dataset.ov&&x.remove()); layer.innerHTML=''; g=[...Array(R)].map(()=>Array(K).fill(0));
    sides={1:mode=='play'?'human':limeId,2:pinkId}; busy=false; moves=0; done=false; ghost.style.opacity=1; aimAt(K>>1); api.score(0); paintCtl();
    bub.style.opacity=0; if(mode=='watch'){ talk(sides[1],'start'); tos.push(setTimeout(()=>talk(sides[2],'start'),1500)); } else talk(pinkId,'start');
    if(mode=='watch'){ status.title=''; } next(mode=='watch'?(Math.random()<.5?1:2):(first?1:2)); };
  const restart=()=>{ tos.forEach(clearTimeout); tos=[]; cancelAnimationFrame(raf); start(); };
  hit.addEventListener('mousemove',e=>{ if(!human(turn)||done)return; const bx=hit.getBoundingClientRect(); const c=Math.floor((e.clientX-bx.left)/bx.width*K); if(c!=aim)aimAt(c); });
  hit.addEventListener('mousedown',play);
  const offK=A.keys(e=>{ if(!human(turn)||done)return; if(e.key=='ArrowLeft'||e.key=='a')aimAt(aim-1); else if(e.key=='ArrowRight'||e.key=='d')aimAt(aim+1); else if(e.key==' '||e.key=='ArrowDown'||e.key=='Enter'||e.key=='s')play(); });
  api.snap&&api.snap(()=>mode=='play'&&!done&&moves>0&&g?{g:g.map(r=>r.slice()),moves,streak,turn:busy?3-turn:turn}:null);
  const RS=api.resume;
  if(RS&&RS.g&&!api._c4used&&RS.g.length==R&&RS.g[0].length==K&&mode=='play'){ api._c4used=true; start(); tos.forEach(clearTimeout); tos=[];
    g=RS.g.map(r=>r.slice()); moves=RS.moves||0; streak=RS.streak||0; layer.innerHTML='';
    g.forEach((row,r)=>row.forEach((p,c)=>{ if(!p)return; const d=el('div',{position:'absolute',left:(c*CS+5)+'px',top:'0px',width:DS+'px',height:DS+'px',borderRadius:'50%',background:p==1?P1:P2,boxShadow:'inset 0 -4px 0 rgba(0,0,0,.15)',transform:'translateY('+(r*CS+5)+'px)'}); d.dataset.rc=r+','+c; layer.appendChild(d); }));
    next(RS.turn||1); }
  else { api._c4used=true; start(); }
  return ()=>{ live=false; cancelAnimationFrame(raf); tos.forEach(clearTimeout); clearTimeout(bubT); offK(); };
};
A.register('connect4',{mount(host,api){ let cur; const remount=()=>{ if(cur)cur(); host.innerHTML=''; cur=c4Mount(host,api,remount); }; remount(); return ()=>{ if(cur)cur(); }; }});
})();
