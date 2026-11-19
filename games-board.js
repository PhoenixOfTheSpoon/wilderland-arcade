(function(){
const A = window.Arcade, C = A.C, el = A.el;
const board = (host, bg=C.forest) => { const b = el('div',{width:'480px',height:'480px',background:bg,borderRadius:'12px',position:'relative',fontFamily:A.font,overflow:'hidden',userSelect:'none'}); host.appendChild(b); return b; };
const btn = (txt, fn) => { const b = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'16px',padding:'12px 22px',borderRadius:'999px',border:'none',background:C.lime,color:C.forest,cursor:'pointer'},txt); b.onclick=fn; return b; };
const splash = (b, big, small, label, fn) => { const o = el('div',{position:'absolute',inset:0,background:'rgba(1,86,64,.9)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',color:'#fff',textAlign:'center',zIndex:5});
  o.append(el('div',{fontSize:'34px',fontWeight:700,color:C.lime},big), el('div',{fontSize:'16px',fontWeight:500,maxWidth:'340px'},small), btn(label,()=>{o.remove();fn();})); b.appendChild(o); return o; };
const choice = (b, big, small, opts) => { const o = el('div',{position:'absolute',inset:0,background:'rgba(1,86,64,.92)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',color:'#fff',textAlign:'center',zIndex:5});
  const row = el('div',{display:'flex',gap:'10px',flexWrap:'wrap',justifyContent:'center'});
  opts.forEach(([label,fn],i)=>{ const x = btn(label,()=>{o.remove();fn();}); if(i){x.style.background='transparent';x.style.color=C.lime;x.style.boxShadow='inset 0 0 0 2px '+C.lime;} row.appendChild(x); });
  o.append(el('div',{fontSize:'34px',fontWeight:700,color:C.lime},big), el('div',{fontSize:'16px',fontWeight:500,maxWidth:'340px'},small), row); b.appendChild(o); return o; };
A.ui = { board, btn, splash, choice };

A.register('memory', { mount(host, api){
  const b = board(host); let timer;
  const icons = ['▲','●','■','◆','★','✚','☾','♣','✿','♥'], cols=[C.lime,C.pink,C.sky,C.gold,C.lavender,C.peach,C.mint,C.orange,C.red,C.sand];
  let snap=null;
  const start = (R) => {
    b.innerHTML=''; const NP=R?R.NP:A.D(6,8,10), deck = R?R.deck:[...Array(NP*2)].map((_,i)=>i%NP).sort(()=>Math.random()-.5);
    let open=[], found=0, moves=R?R.moves:0, lock=false, t0=Date.now()-(R?R.el*1000:0), matched=new Set(R?R.matched:[]); cards=[];
    let probs=R&&R.probs?R.probs:null; const seenV={};
    if(A.edu&&A.edu.on&&!probs){ probs=[]; const used=new Set(); let gg=0; while(probs.length<NP&&gg++<500){ const pr=A.problem(), k=String(pr.a); if(used.has(k))continue; used.add(k); probs.push({q:pr.kind=='math'?pr.q:pr.q.replace('Spell: ',''),a:pr.a}); } while(probs.length<NP)probs.push({q:probs.length+' + 0',a:probs.length}); }
    const grid = el('div',{display:'grid',gridTemplateColumns:'repeat('+(NP>8?5:4)+',1fr)',gap:'10px',padding:'20px',height:'100%',boxSizing:'border-box'}); b.appendChild(grid);
    deck.forEach((v,idx)=>{ const lab=probs?(()=>{ const t=seenV[v]?'a':'q'; seenV[v]=1; const txt=t=='q'?String(probs[v].q):String(probs[v].a); return {t:txt,fs:txt.length>6?'16px':txt.length>3?'21px':'30px'}; })():null;
      const c = el('div',{background:C.green,borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:lab?lab.fs:'44px',fontWeight:lab?700:400,textAlign:'center',lineHeight:1.1,padding:'2px',color:'transparent',cursor:'pointer',transition:'background .18s'},lab?lab.t:icons[v]);
      c.dataset.i=idx; if(matched.has(idx)){ c.dataset.o=1; c.style.background=cols[v]; c.style.color=C.forest; }
      c.onclick=()=>{ if(lock||c.dataset.o)return; c.dataset.o=1; c.style.background=C.cream; c.style.color=probs?C.forest:(cols[v]==C.lime?C.forest:cols[v]); A.sfx('flip'); open.push([c,v]);
        if(open.length==2){ moves++; const [[a,x],[d,y]]=open; open=[];
          if(x==y){found++;if(probs&&api.edu)api.edu(true);matched.add(+a.dataset.i);matched.add(+d.dataset.i);A.sfx('point');a.style.background=d.style.background=cols[x];a.style.color=d.style.color=C.forest;
            const sc=Math.max(0,1000-moves*25-Math.floor((Date.now()-t0)/1000)*5); api.score(sc);
            if(found==NP){A.sfx('win');snap=null;if(moves-NP<=6){if(api.stat)api.stat('memPerfect',1,'add');api.perfect&&api.perfect();}setTimeout(()=>{api.over(sc);splash(b,'ALL MATCHED',moves+' moves · score '+sc,'Deal again',()=>start());},500);} }
          else{lock=true;A.sfx('bad');setTimeout(()=>{[a,d].forEach(k=>{delete k.dataset.o;k.style.background=C.green;k.style.color='transparent';});lock=false;},650/A.speed);} } };
      grid.appendChild(c); cards.push([c,v]); });
    found=matched.size/2;
    snap=()=>found<NP&&moves>0?{NP,deck,probs,matched:[...matched],moves,el:Math.floor((Date.now()-t0)/1000)}:null;
    api.score(0); hints.reset();
  };
  api.snap&&api.snap(()=>snap&&snap());
  let cards=[]; const hints=A.hinter(api,()=>{ const un=cards.filter(([c])=>!c.dataset.o); if(!un.length)return false; const v=un[Math.random()*un.length|0][1]; un.filter(x=>x[1]==v).forEach(([c])=>A.pulse(c,C.gold,1300)); });
  if(api.resume&&api.resume.deck) A.ui.choice(b,'WELCOME BACK',(api.resume.matched.length/2)+' of '+api.resume.NP+' pairs found · '+api.resume.moves+' moves',[['Resume',()=>start(api.resume)],['New deal',()=>start()]]);
  else splash(b,'MEMORY MATCH','Flip two cards. Find every pair in as few moves as you can.','Deal cards',()=>start());
  return ()=>clearTimeout(timer);
}});

A.register('whack-classic', { mount(host, api){
  const b = board(host, C.bark); let iv, to, running=false;
  const start = () => {
    b.innerHTML=''; let score=0, left=30; api.score(0); running=true;
    const hud = el('div',{position:'absolute',top:'12px',left:'16px',right:'16px',display:'flex',justifyContent:'space-between',color:C.cream,fontWeight:700,fontSize:'18px'}); b.appendChild(hud);
    const draw=()=>hud.textContent=''; const sT=el('span'), sS=el('span'); hud.append(sS,sT);
    const grid = el('div',{position:'absolute',top:'56px',left:'30px',right:'30px',bottom:'30px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'18px'}); b.appendChild(grid);
    const holes=[...Array(9)].map(()=>{ const h=el('div',{background:'#5a3a12',borderRadius:'50%',position:'relative',overflow:'hidden',cursor:'crosshair'});
      const m=el('div',{position:'absolute',left:'15%',width:'70%',height:'80%',top:'100%',background:C.sand,borderRadius:'50% 50% 30% 30%',transition:'top .12s ease-out',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',fontWeight:700,color:C.ink},'• •');
      h.appendChild(m); h.m=m; m.onmousedown=e=>{ if(!m.up)return; m.up=0; m.style.top='100%'; score+=m.gold?30:10; api.score(score); A.sfx(m.gold?'coin':'hit'); }; grid.appendChild(h); return h; });
    const upd=()=>{sS.textContent='Score '+score;sT.textContent=left+'s';}; upd();
    const pop=()=>{ if(!running)return; const h=holes[Math.random()*9|0]; if(!h.m.up){ const gold=Math.random()<.15; h.m.gold=gold; h.m.style.background=gold?C.gold:C.sand; h.m.up=1; h.m.style.top='20%';
        setTimeout(()=>{h.m.up=0;h.m.style.top='100%';},Math.max(450,900-(30-left)*15)*A.D(1.35,1,.7)/A.speed); }
      to=setTimeout(pop,Math.max(300,700-(30-left)*14)*A.D(1.3,1,.72)/A.speed); upd(); };
    pop(); iv=setInterval(()=>{ left--; upd(); if(left<=0){ running=false; clearInterval(iv); clearTimeout(to); A.sfx('over'); api.over(score); splash(b,'TIME',score+' points. Gold critters are worth triple.','Play again',start);} },1000);
  };
  splash(b,'WHACK-A-GOPHER','30 seconds. Click them as they pop up. Gold ones pay triple.','Start',start);
  return ()=>{running=false;clearInterval(iv);clearTimeout(to);};
}});

A.register('2048', { mount(host, api){
  const b = board(host, C.sand); const shades={2:'#EDE9D8',4:'#e4f7a8',8:C.lime,16:'#9fe07a',32:C.green,64:'#028a4e',128:C.forest,256:C.sky,512:C.blue,1024:C.pink,2048:C.gold};
  let G, score, over=false;
  const grid = el('div',{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',padding:'16px',height:'100%'}); b.appendChild(grid);
  const cells=[...Array(16)].map(()=>{const c=el('div',{borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'36px'});grid.appendChild(c);return c;});
  const add=()=>{const e=[];G.forEach((v,i)=>!v&&e.push(i));if(e.length)G[e[Math.random()*e.length|0]]=Math.random()<.9?2:4;};
  const paint=()=>G.forEach((v,i)=>{const c=cells[i];c.textContent=v||'';c.style.background=v?(shades[v]||C.magenta||'#AB2372'):'rgba(255,255,255,.35)';c.style.color=v>=32?'#fff':C.forest;c.style.fontSize=v>=1024?'28px':'36px';});
  const reset=()=>{G=Array(16).fill(0);score=0;over=false;add();add();paint();api.score(0);};
  const slide=row=>{let a=row.filter(v=>v);for(let i=0;i<a.length-1;i++)if(a[i]==a[i+1]){a[i]*=2;score+=a[i];a.splice(i+1,1);}while(a.length<4)a.push(0);return a;};
  const move=d=>{ if(over)return; const old=G.join();
    for(let k=0;k<4;k++){ let idx=[0,1,2,3].map(j=>d=='L'||d=='R'?k*4+j:j*4+k); if(d=='R'||d=='D')idx.reverse(); const r=slide(idx.map(i=>G[i])); idx.forEach((i,j)=>G[i]=r[j]); }
    if(G.join()!=old){add();A.sfx('blip');api.score(score);paint();
      const can=G.some((v,i)=>!v||(i%4<3&&v==G[i+1])||(i<12&&v==G[i+4])); if(!can){over=true;A.sfx('over');api.over(score);splash(b,'NO MOVES LEFT','Score '+score+' · best tile '+Math.max(...G),'New board',reset);}} };
  const offK=A.keys(e=>{const d={ArrowLeft:'L',ArrowRight:'R',ArrowUp:'U',ArrowDown:'D',a:'L',d:'R',w:'U',s:'D'}[e.key];if(d)move(d);});
  reset(); return offK;
}});

A.register('tictactoe', { mount(host, api){
  const b = board(host, C.cream); let wins=0, to;
  let hintFn=()=>false; const hints=A.hinter(api,()=>hintFn());
  // Variants: Classic is free; 4×4, 5×5 and Misère are unlocked in the Upgrade Workshop.
  const VARS={classic:{n:3,k:3,t:'Classic',m:1}, misere:{n:3,k:3,t:'Misère',mis:1,m:1.5,u:'misere'}, big4:{n:4,k:4,t:'4×4',m:2,u:'big4'}, big5:{n:5,k:4,t:'5×5',m:3,u:'big5'}};
  let vid='classic'; try{ vid=localStorage.getItem('wl-ttt-var')||'classic'; }catch(e){} if(!VARS[vid]||(VARS[vid].u&&!A.U(VARS[vid].u)))vid='classic';
  let V, LINES, NN;
  const setVar=id=>{ V=VARS[id]; vid=id; NN=V.n*V.n; LINES=[]; const n=V.n,k=V.k;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)for(const[dr,dc]of[[0,1],[1,0],[1,1],[1,-1]]){ const er=r+dr*(k-1), ec=c+dc*(k-1); if(er<0||er>=n||ec<0||ec>=n)continue; LINES.push([...Array(k)].map((_,i)=>(r+dr*i)*n+(c+dc*i))); } };
  setVar(vid);
  const line3=s=>{ for(const l of LINES){ const p=s[l[0]]; if(p&&l.every(i=>s[i]==p))return p; } return null; };
  const winner=s=>{ const p=line3(s); if(p)return V.mis?(p=='X'?'O':'X'):p; return s.every(x=>x)?'D':null; };
  const heur=s=>{ let v=0; for(const l of LINES){ let o=0,x=0; for(const i of l){ if(s[i]=='O')o++; else if(s[i]=='X')x++; } if(o&&!x)v+=Math.pow(8,o); else if(x&&!o)v-=Math.pow(8,x)*1.1; } return V.mis?-v:v; };
  let deadline=0; const ABORT={};
  const nega=(s,p,depth,a,be)=>{ if(performance.now()>deadline)throw ABORT; const w=winner(s);
    if(w){ if(w=='D')return 0; return (w==p?1:-1)*(100000+depth); }
    if(!depth)return (p=='O'?1:-1)*heur(s);
    let best=-1e9; const q=p=='X'?'O':'X';
    for(let i=0;i<NN;i++){ if(s[i])continue; s[i]=p; const v=-nega(s,q,depth-1,-be,-a); s[i]=null; if(v>best)best=v; if(v>a)a=v; if(a>=be)break; } return best; };
  const ai=(s,who='O')=>{ const empty=s.map((v,i)=>v?-1:i).filter(i=>i>=0); if(!empty.length)return -1;
    if(Math.random()<A.D(.45,.12,0))return empty[Math.random()*empty.length|0];
    const maxD=V.n==3?9:V.n==4?4:3; deadline=performance.now()+600; let pick=empty[0];
    try{ for(let d=1;d<=maxD;d++){ let best=-1e9, bp=pick; const ord=[pick,...empty.filter(i=>i!=pick)];
        for(const i of ord){ s[i]=who; const v=-nega(s,who=='O'?'X':'O',d-1,-1e9,1e9)+Math.random()*.01; s[i]=null; if(v>best){best=v;bp=i;} }
        pick=bp; if(best>=99000)break; } }catch(e){ if(e!==ABORT)throw e; }
    return pick; };
  let cur=null; if(api.resume&&api.resume.wins)wins=api.resume.wins;
  api.snap&&api.snap(()=>{ const live=cur&&!winner(cur)&&cur.some(Boolean); return (wins||live)?{wins,vid,s:live?cur.slice():null}:null; });
  const start=(R)=>{ if(R&&R.vid&&VARS[R.vid]&&R.s&&R.s.length==VARS[R.vid].n**2)setVar(R.vid); b.innerHTML=''; const s=R&&R.s&&R.s.length==NN?R.s.slice():Array(NN).fill(null); cur=s; let busy=false;
    const bar=el('div',{display:'flex',justifyContent:'center',gap:'4px',padding:'10px 10px 0',flexWrap:'wrap'}); b.appendChild(bar);
    Object.entries(VARS).forEach(([id,v])=>{ const locked=v.u&&!A.U(v.u); const x=el('button',{border:'none',borderRadius:'999px',padding:'5px 12px',fontFamily:A.font,fontWeight:700,fontSize:'13px',cursor:locked?'default':'pointer',background:id==vid?C.forest:'rgba(1,86,64,.12)',color:id==vid?'#fff':locked?'#8a8a8a':C.forest},(locked?'🔒 ':'')+v.t+(v.m>1?' ×'+v.m:''));
      x.onclick=()=>{ if(locked){ info.textContent='Unlock '+v.t+' in the Upgrade Workshop'; A.sfx('bad'); return; } if(id==vid)return; try{localStorage.setItem('wl-ttt-var',id);}catch(e){} setVar(id); wins=0; clearTimeout(to); A.sfx('blip'); start(); }; bar.appendChild(x); });
    const info=el('div',{textAlign:'center',fontWeight:700,fontSize:'18px',color:C.forest,padding:'8px 10px 10px'},(V.mis?'Misère: DON’T make '+V.k+' in a row · ':V.n>3?'Get '+V.k+' in a row · ':'')+'You are X · streak '+wins); b.appendChild(info);
    const SZ=V.n==3?360:380, fs=V.n==3?72:V.n==4?52:40;
    const grid=el('div',{display:'grid',gridTemplateColumns:'repeat('+V.n+',1fr)',gap:'7px',width:SZ+'px',height:SZ+'px',margin:'0 auto',background:V.mis?C.pink:C.forest,padding:'8px',borderRadius:'14px'}); b.appendChild(grid);
    const cs=s.map((_,i)=>{const c=el('div',{background:C.cream,borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:fs+'px',fontWeight:700,cursor:'pointer',transition:'transform .12s'});c.onclick=()=>play(i);grid.appendChild(c);return c;});
    hintFn=()=>{ if(busy||winner(s))return false; const old=A.diff; A.diff='hard'; const m=ai(s,'X'); A.diff=old; if(m<0)return false; A.pulse(cs[m],C.gold); }; hints.reset();
    const put=(i,p)=>{s[i]=p;cs[i].textContent=p=='X'?'✕':'◯';cs[i].style.color=p=='X'?C.green:C.pink;cs[i].style.transform='scale(1.12)';setTimeout(()=>cs[i].style.transform='',120);};
    const glow=()=>{ for(const l of LINES){ const p=s[l[0]]; if(p&&l.every(i=>s[i]==p)){ l.forEach(i=>{cs[i].style.background=V.mis?'#ffd0e0':'#e4f7a8';}); return; } } };
    if(R&&R.s){ s.forEach((p,i)=>p&&put(i,p)); const nx=s.filter(v=>v=='X').length, no=s.filter(v=>v=='O').length; if(nx>no){ const m=ai(s); if(m>=0)put(m,'O'); } }
    const end=w=>{ glow(); if(w=='X'){wins++;A.sfx('win');api.stat&&api.stat('tttStreak',wins);}else if(w=='O'){A.sfx('over');}else A.sfx('blip');
      const sc=Math.round((w=='X'?wins*100:w=='D'?50:0)*V.m); if(w=='X')api.perfect&&api.perfect(); api.score(sc); api.over(sc); if(w=='O')wins=0;
      to=setTimeout(()=>splash(b,w=='X'?'YOU WIN':w=='O'?'CPU WINS':'DRAW',w=='X'?'Streak: '+wins+'. Keep it going.':w=='O'?'Streak reset.':'Nobody blinks.','Next round',start),700); };
    const cpu=()=>{ busy=true; info.textContent='CPU thinking…'; to=setTimeout(()=>{ const m=ai(s); if(m>=0&&!s[m])put(m,'O'); A.sfx('flip'); busy=false; info.textContent='Your move · streak '+wins; const w2=winner(s); if(w2)end(w2); },350); };
    const learn=!!(A.edu&&A.edu.on);
    function play(i){ if(busy||s[i]||winner(s))return; if(learn) return quiz(i); doPlay(i); }
    function quiz(i){ busy=true; const p=A.problem(); const o=el('div',{position:'absolute',inset:0,background:'rgba(1,86,64,.94)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'14px',zIndex:5,color:'#fff',textAlign:'center',padding:'20px',boxSizing:'border-box'});
      o.append(el('div',{fontSize:'13px',fontWeight:700,letterSpacing:'.1em',color:C.lime},'ANSWER TO CLAIM THE SQUARE'), el('div',{fontSize:'34px',fontWeight:700},A.qText(p)));
      const row=el('div',{display:'flex',gap:'10px',flexWrap:'wrap',justifyContent:'center'});
      p.choices.forEach(v=>{ const x=btn(String(v),()=>{ o.remove(); busy=false; const ok=v===p.a; try{api.edu&&api.edu(ok);}catch(e){}
        if(ok){ doPlay(i); return; } A.sfx('bad'); info.textContent='Not quite — '+A.solved(p)+'. CPU’s turn.'; cpu(); });
        x.style.minWidth='84px'; x.style.fontSize='22px'; row.appendChild(x); });
      o.appendChild(row); b.appendChild(o); }
    function doPlay(i){ if(s[i])return; put(i,'X'); A.sfx('blip'); const w=winner(s); if(w)return end(w); cpu(); }
  };
  start(api.resume); return ()=>clearTimeout(to);
}});
})();
