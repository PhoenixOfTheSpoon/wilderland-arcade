(function(){
const A = window.Arcade, C = A.C, el = A.el, {board, btn, splash} = A.ui;

A.register('reaction', { mount(host, api){
  const b = board(host); let to, st='idle', t0, times=[];
  const msg = el('div',{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'10px',color:'#fff',textAlign:'center',cursor:'pointer',transition:'background .1s'}); b.appendChild(msg);
  const big=el('div',{fontSize:'40px',fontWeight:700}), small=el('div',{fontSize:'16px',fontWeight:500}); msg.append(big,small);
  const set=(bg,a,s)=>{msg.style.background=bg;big.textContent=a;small.textContent=s;};
  const edu=ok=>{try{api.edu&&api.edu(ok);}catch(e){}};
  const armLearn=()=>{ st='wait'; const p=A.problem(), wrong=p.choices.filter(c=>c!==p.a); set(C.red,A.qText(p),'Round '+(times.length+1)+' of 5 · click only when the RIGHT answer appears'); let k=0;
    const step=()=>{ if(k<wrong.length&&Math.random()<.75){ const v=wrong[k++]; st='decoy'; set(C.gold,String(v),'Not this one…'); to=setTimeout(()=>{ st='wait'; set(C.red,A.qText(p),'Wait for the right answer'); to=setTimeout(step,500+Math.random()*700); },900); }
      else { st='go'; t0=performance.now(); set(C.green,String(p.a),'CLICK!'); A.sfx('blip'); } };
    to=setTimeout(step,1400+Math.random()*1200); };
  const arm=()=>{if(A.learnOn())return armLearn();st='wait';set(C.red,'WAIT FOR GREEN','Round '+(times.length+1)+' of 5');const go=()=>{st='go';t0=performance.now();set(C.green,'CLICK','');A.sfx('blip');};const d=1000+Math.random()*2500;if(Math.random()<A.D(0,.25,.5)){to=setTimeout(()=>{set(C.gold,'NOT YET','Decoy. Hold steady.');to=setTimeout(()=>{set(C.red,'WAIT FOR GREEN','');to=setTimeout(go,500+Math.random()*1200);},500);},d*.6);}else to=setTimeout(go,d);};
  set(C.forest,'REACTION TEST','Click when the screen turns green. Five rounds. Click to begin.');
  if(api.resume&&api.resume.times&&api.resume.times.length){ times=api.resume.times.slice(); st='between'; set(C.blue,'WELCOME BACK','Round '+(times.length+1)+' of 5 · click to continue'); }
  api.snap&&api.snap(()=>(st!='idle'&&st!='done'&&times.length)?{times}:null);
  const click=()=>{
    if(st=='idle'||st=='done'){times=[];api.score(0);arm();}
    else if(st=='wait'||st=='decoy'){if(st=='decoy')edu(false);clearTimeout(to);A.sfx('bad');st='early';set(C.orange,'TOO EARLY','Click to retry this round');}
    else if(st=='early')arm();
    else if(st=='go'){if(A.learnOn())edu(true);const t=Math.round(performance.now()-t0);times.push(t);A.sfx('point');
      if(times.length>=5){const avg=Math.round(times.reduce((a,b)=>a+b)/5),sc=Math.max(0,600-avg);st='done';api.score(sc);api.over(sc);A.sfx('win');set(C.forest,avg+' ms average','Score '+sc+' · click to run it back');}
      else{st='between';set(C.blue,t+' ms','Click for next round');}}
    else if(st=='between')arm();
  };
  msg.addEventListener('mousedown',click); const offK=A.keys(e=>{if(e.key==' ')click();});
  return()=>{clearTimeout(to);offK();};
}});

A.register('typing', { mount(host, api){
  const b = board(host, C.cream); let iv;
  const words='trail ridge cedar valley canyon meadow summit river pine aspen boulder creek eagle ember lantern compass timber harvest trout moose ranch fence saddle hollow thicket granite marsh willow falcon glacier'.split(' ');
  let snapFn=null; api.snap&&api.snap(()=>snapFn&&snapFn());
  const EDUW='the and you that was for are with his they have from one had word what all were when your can said there each which she how their will other about out many then them some her would make like him into time has look two more write see number could people than first water been call who now find long down day did get come made may part'.split(' ');
  const start=(R)=>{ b.innerHTML=''; const T=R?R.T:A.D(45,30,25), pool=(A.edu&&A.edu.on)?EDUW.filter(w=>w.length<=A.D(4,5,9)):A.D(words.filter(w=>w.length<=5),words,'wilderness switchback watershed backcountry thunderhead headwaters avalanche campfire trailhead woodpecker sagebrush firelight homestead riverbank wildflower'.split(' ').concat(words.filter(w=>w.length>=6))); let left=R?R.left:T, typed=R?R.typed:0, errs=R?R.errs:0, line=R?R.line:[...Array(60)].map(()=>pool[Math.random()*pool.length|0]), wi=R?R.wi:0;
    snapFn=()=>left>0&&left<T?{T,left,typed,errs,line,wi}:null; if(R)api.score(typed*10);
    const hud=el('div',{display:'flex',justifyContent:'space-between',padding:'16px 20px',fontWeight:700,fontSize:'18px',color:C.forest}); const hT=el('span'),hW=el('span'); hud.append(hW,hT); b.appendChild(hud);
    const txt=el('div',{padding:'8px 24px',fontSize:'26px',lineHeight:'1.6',fontWeight:500,color:'#868687',height:'300px',overflow:'hidden'}); b.appendChild(txt);
    const inp=el('input',{margin:'0 24px',width:'432px',fontFamily:A.font,fontSize:'24px',padding:'12px 16px',borderRadius:'12px',border:'2px solid '+C.forest,outline:'none',background:'#fff',color:C.ink}); inp.autocomplete='off'; inp.spellcheck=false; b.appendChild(inp);
    const draw=()=>{txt.innerHTML='';line.slice(Math.max(0,wi-2),wi+14).forEach((w,k)=>{const i=k+Math.max(0,wi-2);const s=el('span',{marginRight:'12px',color:i<wi?C.green:i==wi?C.forest:'#868687',background:i==wi?C.lime:'transparent',borderRadius:'6px',padding:'0 4px'},w);txt.append(s,' ');});
      const wpm=Math.round(typed/((T-left)||1)*60);hW.textContent=typed+' words · '+wpm+' wpm';hT.textContent=left+'s';};
    draw(); setTimeout(()=>inp.focus(),50);
    inp.oninput=()=>{ const v=inp.value; if(v.endsWith(' ')){ if(v.trim()==line[wi]){typed++;A.sfx('blip');}else{errs++;A.sfx('bad');} wi++; inp.value=''; api.score(typed*10); draw(); }
      else inp.style.borderColor=line[wi].startsWith(v)?C.forest:C.red; };
    iv=setInterval(()=>{left--;draw();if(left<=0){clearInterval(iv);inp.disabled=true;const wpm=Math.round(typed*60/T),sc=Math.max(0,typed*10-errs*5);api.stat&&api.stat('wpm',wpm);api.score(sc);api.over(sc);A.sfx('over');splash(b,wpm+' WPM',typed+' clean words, '+errs+' misses · score '+sc,'Race again',()=>start());}},1000);
  };
  if(api.resume&&api.resume.line) A.ui.choice(b,'WELCOME BACK',api.resume.left+' seconds left · '+api.resume.typed+' words so far',[['Resume',()=>start(api.resume)],['New race',()=>start()]]);
  else splash(b,'TYPING RACE','Type each word, then press space. Easy is longer with short words; Hard is shorter with long ones.','Start',()=>start());
  return()=>clearInterval(iv);
}});

const SS = n => Math.min(99999999, 10*(Math.pow(2,Math.max(0,n))-1)); // 1→10, 2→30, 3→70: each round doubles
A.register('simon', { mount(host, api){
  const b = board(host, C.ink); let tos=[];
  const cols=[C.green,C.red,C.gold,C.sky], freqs=[330,392,494,587];
  const grid=el('div',{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',padding:'30px',height:'100%'}); b.appendChild(grid);
  const center=el('div',{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'130px',height:'130px',borderRadius:'50%',background:C.ink,color:C.lime,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'36px',zIndex:2}); b.appendChild(center);
  let seq=[], pos=0, busy=true, lost=false, retryUsed=false, secondLeft=0;
  const pads=cols.map((c,i)=>{const p=el('div',{background:c,opacity:.35,borderRadius:['240px 12px 12px 12px','12px 240px 12px 12px','12px 12px 12px 240px','12px 12px 240px 12px'][i],cursor:'pointer',transition:'opacity .12s'});
    p.onmousedown=()=>press(i);grid.appendChild(p);return p;});
  const lit=(i,d=300)=>{pads[i].style.opacity=1;A.tone(freqs[i],d/1000,'triangle',.08);tos.push(setTimeout(()=>pads[i].style.opacity=.35,d));};
  const playSeq=()=>{busy=true;pos=0;center.textContent=seq.length;const sp=Math.max(A.D(320,220,150),A.D(650,500,380)-seq.length*20)/A.speed;seq.forEach((v,k)=>tos.push(setTimeout(()=>lit(v,sp*.7),600+k*sp)));tos.push(setTimeout(()=>busy=false,600+seq.length*sp));};
  const hints=A.hinter(api,()=>{ if(busy||!seq.length)return false; playSeq(); });
  const next=()=>{if(!seq.length)secondLeft=A.U('second');retryUsed=false;seq.push(Math.random()*4|0);playSeq();};
  function press(i){ if(busy)return; lit(i,180); if(i!=seq[pos]&&secondLeft>0&&!A.immortal){ secondLeft--; busy=true; center.textContent='↺'; A.sfx('bad'); tos.push(setTimeout(playSeq,700)); return; } if(i!=seq[pos]&&A.immortal){ busy=true; tos.push(setTimeout(playSeq,500)); return; } if(i!=seq[pos]){ if(A.learnOn()&&!retryUsed){ retryUsed=true; busy=true; A.quiz(b,'WRONG PAD · ANSWER TO RETRY THE PATTERN',ok=>{ try{api.edu&&api.edu(ok);}catch(e){} busy=false; if(ok) playSeq(); else press(i); }); return; } busy=true;lost=true;A.sfx('over');const sc=SS(seq.length-1);api.over(sc);tos.push(setTimeout(()=>splash(b,'WRONG PAD','You remembered '+(seq.length-1)+' in a row · score '+sc,'Try again',()=>{seq=[];lost=false;api.score(0);hints.reset();next();}),400));return;}
    pos++; if(pos==seq.length){api.score(SS(seq.length));tos.push(setTimeout(next,500));} }
  api.snap&&api.snap(()=>seq.length>1&&!lost?{seq:seq.slice()}:null);
  if(api.resume&&api.resume.seq) A.ui.choice(b,'WELCOME BACK','Your pattern is '+api.resume.seq.length+' long. Watch it once more.',[['Resume',()=>{seq=api.resume.seq.slice();lost=false;api.score(SS(seq.length-1));hints.reset();playSeq();}],['New game',()=>{seq=[];lost=false;api.score(0);hints.reset();next();}]]);
  else splash(b,'SIMON SAYS','Watch the pattern. Repeat it back. It gets one longer each round.','Start',()=>{seq=[];lost=false;api.score(0);hints.reset();next();});
  return()=>tos.forEach(clearTimeout);
}});

A.register('mines', { mount(host, api){
  const b = board(host, C.forest); let N=10, M=14; let iv;
  let hintFn=()=>false; const hints=A.hinter(api,()=>hintFn());
  let snapM=null; api.snap&&api.snap(()=>snapM&&snapM());
  const start=(R)=>{ N=R?R.N:A.D(8,10,12); M=R?R.M:A.D(8,14,26); b.innerHTML=''; let cells, first=true, dead=false, opened=0, t=0, mShield=A.U('shield'); clearInterval(iv);
    snapM=()=>(!first&&!dead)?{N,M,t,hard:A.diff=='hard',cells:cells.map(q=>q.m|(q.o<<1)|(q.f<<2))}:null;
    const hud=el('div',{display:'flex',justifyContent:'space-between',padding:'10px 16px',color:C.lime,fontWeight:700,fontSize:'16px'},''); const hL=el('span','',M+' mines · right-click to flag'),hT=el('span',{},'0s'); hL.textContent=M+' mines · right-click flags'; hud.append(hL,hT); b.appendChild(hud);
    const grid=el('div',{display:'grid',gridTemplateColumns:'repeat('+N+',1fr)',gap:'3px',padding:'0 16px 16px',height:'438px'}); b.appendChild(grid);
    cells=[...Array(N*N)].map((_,i)=>{const c=el('div',{background:C.green,borderRadius:'5px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'18px',cursor:'pointer'});
      let lp=null, lpDone=false;
      c.addEventListener('touchstart',e=>{ if(dead)return; lpDone=false; lp=setTimeout(()=>{lpDone=true;flag(i);if(navigator.vibrate)navigator.vibrate(20);},420); },{passive:true});
      c.addEventListener('touchend',e=>{ clearTimeout(lp); if(lpDone){e.preventDefault();} },{passive:false});
      c.addEventListener('touchmove',()=>clearTimeout(lp),{passive:true});
      c.onmousedown=e=>{e.preventDefault();if(dead||lpDone)return;e.button==2?flag(i):open(i);};c.oncontextmenu=e=>e.preventDefault();grid.appendChild(c);return {c,m:0,o:0,f:0};});
    const nb=i=>{const x=i%N,y=i/N|0,r=[];for(let dx=-1;dx<2;dx++)for(let dy=-1;dy<2;dy++){const X=x+dx,Y=y+dy;if((dx||dy)&&X>=0&&Y>=0&&X<N&&Y<N)r.push(Y*N+X);}return r;};
    const lay=safe=>{let k=0;while(k<M){const i=Math.random()*N*N|0;if(i!=safe&&!nb(safe).includes(i)&&!cells[i].m){cells[i].m=1;k++;}}};
    const numC=['',C.sky,C.lime,C.gold,C.orange,C.pink,C.red,C.lavender,'#fff'];
    hintFn=()=>{ if(dead)return false; if(first){A.pulse(cells[(N>>1)*N+(N>>1)].c,C.gold);return;} const safe=cells.map((q,i)=>i).filter(i=>!cells[i].o&&!cells[i].m&&!cells[i].f); const front=safe.filter(i=>nb(i).some(z=>cells[z].o)); const pool=front.length?front:safe; if(!pool.length)return false; A.pulse(cells[pool[Math.random()*pool.length|0]].c,C.gold); }; hints.reset();
    function flag(i){const k=cells[i];if(k.o)return;k.f^=1;k.c.textContent=k.f?'⚑':'';k.c.style.color=C.gold;A.sfx('blip');}
    function open(i){ const k=cells[i]; if(k.o||k.f)return; if(first){first=false;lay(i);iv=setInterval(()=>hT.textContent=(++t)+'s',1000); const mm=cells.filter(q=>q.m&&!q.f).sort(()=>Math.random()-.5).slice(0,2*A.U('scan')); mm.forEach(q=>{q.f=1;q.c.textContent='⚑';q.c.style.color=C.sky;}); }
      if(k.m&&A.learnOn()&&!k.qz){ k.qz=1; dead=true; A.quiz(b,'MINE! ANSWER TO DEFUSE IT',ok=>{ try{api.edu&&api.edu(ok);}catch(e){} dead=false; if(ok){ k.f=1; k.c.textContent='⚑'; k.c.style.color=C.gold; } else open(i); }); return; }
      if(k.m&&mShield>0&&!A.immortal){ mShield--; k.f=1; k.c.textContent='⛉'; k.c.style.color=C.sky; A.sfx('hit'); hL.textContent='Blast shield used · '+mShield+' left'; return; }
      if(k.m&&A.immortal){ k.f=1; k.c.textContent='⚑'; k.c.style.color=C.gold; A.sfx('blip'); return; }
      if(k.m){dead=true;clearInterval(iv);cells.forEach(q=>{if(q.m){q.c.style.background=C.red;q.c.textContent='✹';q.c.style.color='#fff';}});A.sfx('over');api.over(opened*5);setTimeout(()=>splash(b,'BOOM','Cleared '+opened+' tiles · score '+opened*5,'New field',start),700);return;}
      const flood=[i]; while(flood.length){const j=flood.pop(),q=cells[j];if(q.o||q.f)continue;const n=reveal(j);if(!n)nb(j).forEach(z=>flood.push(z));}
      A.sfx('flip'); api.score(opened*5);
      if(opened==N*N-M){dead=true;clearInterval(iv);const sc=opened*5+Math.max(0,1000-t*5);api.score(sc);if(A.diff=='hard'&&api.stat)api.stat('minesHard',1,'add');api.perfect&&api.perfect();api.over(sc);A.sfx('win');splash(b,'FIELD CLEARED',t+' seconds · score '+sc,'New field',()=>start());} }
    function reveal(j){const q=cells[j];q.o=1;opened++;const n=nb(j).filter(z=>cells[z].m).length;q.c.style.background='rgba(255,255,255,.12)';q.c.style.cursor='default';q.c.textContent=n||'';q.c.style.color=numC[n];return n;}
    if(R){ R.cells.forEach((v,i)=>{ cells[i].m=v&1; if(v&4){cells[i].f=1;cells[i].c.textContent='⚑';cells[i].c.style.color=C.gold;} });
      R.cells.forEach((v,i)=>{ if(v&2)reveal(i); }); first=false; t=R.t||0; hT.textContent=t+'s'; iv=setInterval(()=>hT.textContent=(++t)+'s',1000); api.score(opened*5); }
  };
  start(api.resume&&api.resume.cells?api.resume:null); return()=>clearInterval(iv);
}});
})();
