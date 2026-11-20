// Wilderland Arcade · TRAILHEAD DEFENSE 2.0
// One canvas, a pre-drawn map layer, pooled objects and a fixed-step simulation so it stays smooth on cheap Chromebooks —
// even on the biggest maps at 5× speed. Performance mode lowers effects further.
(function(){
const A = window.Arcade, C = A.C, el = A.el;
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const rrect = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const TAU = Math.PI*2;

A.register('td', { w:720, mount(host, api){
  const W = 720, H = 460;
  const wrap = el('div',{width:W+'px',fontFamily:A.font,userSelect:'none',position:'relative'}); host.appendChild(wrap);
  const {c,g} = A.canvas(wrap,W,H); c.style.borderRadius = '12px 12px 0 0'; c.style.cursor = 'pointer'; c.style.touchAction = 'none';
  const bar = el('div',{background:C.forest,borderRadius:'0 0 12px 12px',padding:'8px',display:'flex',flexDirection:'column',gap:'6px'}); wrap.appendChild(bar);

  // ---------------- maps (grid waypoints; several routes = several entrances or branches) ----------------
  const MAPS = [
    {name:'Switchback', cols:12, rows:10, routes:[[[-1,1],[10,1],[10,4],[1,4],[1,7],[10,7],[10,9]]]},
    {name:'Canyon Loop', cols:12, rows:10, routes:[[[-1,8],[2,8],[2,2],[5,2],[5,6],[8,6],[8,1],[11,1]]]},
    {name:'Long Trail', cols:12, rows:10, routes:[[[5,-1],[5,2],[1,2],[1,8],[10,8],[10,3],[7,3],[7,6],[4,6],[4,4]]]},
    {name:'Dead Man’s Dash', cols:12, rows:10, routes:[[[-1,5],[11,5]]]},
    {name:'Twin Rivers', big:1, cols:24, rows:15, water:[[2,7,3,3],[20,12,3,2]], routes:[
      [[-1,2],[6,2],[6,6],[12,6],[12,3],[18,3],[18,10],[24,10]],
      [[-1,12],[8,12],[8,6],[12,6],[12,3],[18,3],[18,10],[24,10]]]},
    {name:'Forked Forest', big:1, cols:28, rows:17, water:[[8,5,4,3]], routes:[
      [[-1,8],[5,8],[5,2],[14,2],[14,5],[22,5],[22,8],[28,8]],
      [[-1,8],[5,8],[5,14],[11,14],[11,11],[18,11],[18,14],[22,14],[22,8],[28,8]]]},
    {name:'Grand Canyon', big:1, cols:32, rows:19, water:[[29,8,2,2]], routes:[
      [[-1,3],[27,3],[27,7],[3,7],[3,11],[27,11],[27,15],[32,15]],
      [[15,-1],[15,3],[27,3],[27,7],[3,7],[3,11],[27,11],[27,15],[32,15]]]},
    {name:'Wilderland Maze', big:1, cols:36, rows:22, water:[[11,12,2,3],[31,8,3,2]], routes:[
      [[-1,2],[10,2],[10,8],[4,8],[4,16],[14,16],[14,11],[22,11],[22,4],[30,4],[30,13],[26,13],[26,19],[36,19]],
      [[18,-1],[18,7],[22,7],[22,4],[30,4],[30,13],[26,13],[26,19],[36,19]],
      [[-1,20],[8,20],[8,16],[14,16],[14,11],[22,11],[22,4],[30,4],[30,13],[26,13],[26,19],[36,19]]]},
  ];
  const MODES = {
    casual:{n:'Casual',hp:.7,grow:1.03,sp:.9,gold:1.2,lives:1.5,mult:.6,d:'Gentle waves'},
    ranger:{n:'Ranger',hp:1,grow:1.055,sp:1,gold:1,lives:1,mult:1,d:'The real thing'},
    veteran:{n:'Veteran',hp:1.35,grow:1.075,sp:1.1,gold:.85,lives:.75,mult:1.7,d:'Ghosts early · tougher bosses'},
    nightmare:{n:'Nightmare',hp:1.8,grow:1.1,sp:1.2,gold:.7,lives:.5,mult:3,d:'Good luck'},
  };
  let mode = 'ranger'; try { const m = localStorage.getItem('wl-td-mode'); if (MODES[m]) mode = m; } catch(e){}
  let perf = !!A.lowFx; try { const p = localStorage.getItem('wl-td-perf'); if (p) perf = p === '1'; } catch(e){}
  const M = () => MODES[mode];
  let lastPush = 0, pushT = null; const pushScore = () => { const now = performance.now(); if (now - lastPush > 900) { lastPush = now; api.score(Math.round(score)); } else if (!pushT) pushT = setTimeout(()=>{ pushT = null; lastPush = performance.now(); api.score(Math.round(score)); }, 1000); };
  // ---------------- towers (lvl 1–5; Gold Pans level forever) ----------------
  const TW = {
    archer:{n:'Archer',k:'1',cost:50,col:'#00B451',top:'#0b7a3a',range:2.5,dmg:9,rate:.5,d:'Fast single shots'},
    frost:{n:'Frost',k:'2',cost:70,col:'#64CDF5',top:'#2f8fc0',range:2.1,dmg:3,rate:.85,slow:.45,d:'Slows critters · spots nearby ghosts'},
    cannon:{n:'Boulder',k:'3',cost:100,col:'#c48a4a',top:'#7a5230',range:2.9,dmg:24,rate:1.6,splash:1.15,d:'Splash damage · can’t hit flyers'},
    bolt:{n:'Lightning',k:'4',cost:150,col:'#F9BF01',top:'#b07d00',range:2.75,dmg:16,rate:1.1,chain:3,d:'Chains between critters'},
    pan:{n:'Gold Pan',k:'5',cost:90,col:'#DD8B03',top:'#8a5600',range:0,inc:20,d:'+gold after every wave · no limit, levels forever'},
    lantern:{n:'Lantern',k:'6',cost:80,col:'#fff2a8',top:'#c9b44a',range:2.4,dmg:4,rate:.7,reveal:1,d:'Reveals and hits ghosts'},
    hawk:{n:'Hawk Nest',k:'7',cost:175,col:'#9a7a5a',top:'#5a3a1c',range:4.7,dmg:55,rate:2.2,air:2,d:'Long range · ×2 on flyers'},
    shroom:{n:'Toxic Shroom',k:'8',cost:110,col:'#a64be0',top:'#6a2a99',range:2.2,dmg:5,rate:.9,poison:7,d:'Poison that ignores armor'},
    totem:{n:'Spirit Totem',k:'9',cost:160,col:'#EA55AB',top:'#9a2a6a',range:2.1,buff:.25,d:'Boosts nearby towers · Lv3 reveals ghosts'},
    skynet:{n:'Sky Net',k:'0',cost:130,col:'#c9ccd1',top:'#6a6f74',range:3.6,dmg:30,rate:.8,airOnly:1,d:'Anti-air flak · slows flyers'},
    hive:{n:'Beehive',cost:140,col:'#ffd23a',top:'#a07a00',range:2.8,dmg:7,rate:1.4,bees:2,d:'Bees chase critters'},
    sun:{n:'Sunbeam',cost:190,col:'#FF8A3C',top:'#b04a00',range:2.6,dmg:14,rate:.1,beam:1,d:'Beam that heats up on one target'},
    bell:{n:'Spirit Bell',cost:170,col:'#9fe8ff',top:'#3a8aa8',range:2.0,dmg:14,rate:1.6,pulse:1,d:'Rings hit everything nearby, even invisible ghosts'},
    geyser:{n:'Geyser',cost:150,col:'#2f7de0',top:'#14457a',range:1.8,dmg:10,rate:2.4,knock:1.4,d:'Blasts critters back along the trail'},
  };
  const TIDS = Object.keys(TW);
  const MAXLV = t => t.type=='pan' ? Infinity : 5;   // Gold Pans have no level cap
  // ---------------- enemies ----------------
  const EN = {
    beetle:{hp:26,sp:1.1,b:4,col:'#3d6b4f',r:.22}, hare:{hp:16,sp:2.2,b:5,col:'#e3d2b4',r:.2},
    armadillo:{hp:58,sp:.8,b:9,col:'#8a8f94',r:.27,armor:4}, gnat:{hp:7,sp:1.8,b:1,col:'#2a2a2a',r:.13},
    toad:{hp:42,sp:.95,b:8,col:'#b8d94a',r:.25,heal:7}, slime:{hp:36,sp:1,b:6,col:'#EA55AB',r:.25,split:1},
    mini:{hp:12,sp:1.4,b:2,col:'#f59acb',r:.15}, ghost:{hp:38,sp:1.25,b:7,col:'#e8f4ff',r:.25,ghost:1},
    knight:{hp:50,sp:.85,b:9,col:'#4b6b8a',r:.27,shield:4}, crow:{hp:22,sp:1.75,b:5,col:'#1d1d2b',r:.2,fly:1},
    bear:{hp:420,sp:.6,b:60,col:'#6e4515',r:.4,dmg:5,armor:2,boss:'Grizzly'},
    moose:{hp:900,sp:.55,b:120,col:'#5a3a1c',r:.45,dmg:8,armor:4,charge:1,boss:'Bull Moose'},
    wraith:{hp:700,sp:.75,b:150,col:'#b8c8ff',r:.42,dmg:8,ghost:1,boss:'The Wraith'},
    phantom:{hp:2600,sp:.62,b:300,col:'#d9c8ff',r:.48,dmg:12,phantom:1,boss:'Phantom King'},
    golem:{hp:3200,sp:.45,b:320,col:'#7d8a86',r:.5,dmg:15,armor:10,boss:'Stone Golem'},
  };
  const AB = {meteor:{n:'Meteor',k:'Q',cd:25}, freeze:{n:'Freeze',k:'W',cd:40}, rally:{n:'Rally',k:'E',cd:35}, reveal:{n:'Reveal',k:'R',cd:30}};
  const SPEEDS = [.5, 1, 2, 3, 5];

  // ---------------- map geometry ----------------
  let map = 0, T = 40, OX = 0, OY = 0, cols = 12, rows = 10, routes = [], pathSet = new Set(), waterSet = new Set(), bg = null;
  const buildRoute = pts => { const P = pts.map(([x,y]) => [OX + x*T + T/2, OY + y*T + T/2]), segs = []; let total = 0;
    for (let k=0;k<P.length-1;k++) { const [x1,y1]=P[k],[x2,y2]=P[k+1], L=Math.hypot(x2-x1,y2-y1); segs.push({x1,y1,x2,y2,L,s:total}); total += L; }
    return {P, segs, total, fly: Math.hypot(P[P.length-1][0]-P[0][0], P[P.length-1][1]-P[0][1])}; };
  const setMap = i => { map = i; const Mp = MAPS[i]; cols = Mp.cols; rows = Mp.rows; T = Math.floor(Math.min(W/cols, H/rows)); OX = Math.floor((W - cols*T)/2); OY = Math.floor((H - rows*T)/2);
    routes = Mp.routes.map(buildRoute); pathSet = new Set(); waterSet = new Set();
    Mp.routes.forEach(pts => { for (let k=0;k<pts.length-1;k++) { let [x,y] = pts[k]; const [x2,y2] = pts[k+1], dx = Math.sign(x2-x), dy = Math.sign(y2-y);
      for (;;) { if (x>=0&&y>=0&&x<cols&&y<rows) pathSet.add(x+','+y); if (x==x2&&y==y2) break; x+=dx; y+=dy; } } });
    (Mp.water||[]).forEach(([x,y,w,h]) => { for (let a=x;a<x+w;a++) for (let b=y;b<y+h;b++) if (!pathSet.has(a+','+b)) waterSet.add(a+','+b); });
    bg = null; };
  const posAt = (R, d, out) => { const S = R.segs; for (let i=0;i<S.length;i++) { const s = S[i]; if (d <= s.s+s.L) { const f = (d-s.s)/s.L; out.x = s.x1+(s.x2-s.x1)*f; out.y = s.y1+(s.y2-s.y1)*f; return; } } const l = S[S.length-1]; out.x = l.x2; out.y = l.y2; };
  const flyAt = (R, d, out) => { const a = R.P[0], b = R.P[R.P.length-1], f = Math.min(1, d/R.fly); out.x = a[0]+(b[0]-a[0])*f; out.y = a[1]+(b[1]-a[1])*f; };
  const free = (cc, rr) => cc>=0 && rr>=0 && cc<cols && rr<rows && !pathSet.has(cc+','+rr) && !waterSet.has(cc+','+rr);

  // pre-drawn map layer: drawn once per map, then copied every frame
  const drawBg = () => { const dpr = window.devicePixelRatio||1, cv = document.createElement('canvas'); cv.width = W*dpr; cv.height = H*dpr; const b = cv.getContext('2d'); b.scale(dpr,dpr);
    b.fillStyle = '#1d4a33'; b.fillRect(0,0,W,H);
    b.fillStyle = '#2f7a4f'; b.fillRect(OX,OY,cols*T,rows*T);
    let seed = 7 + map*131; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
    for (let i=0;i<cols*rows*3;i++) { b.fillStyle = rnd()<.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; b.fillRect(OX+rnd()*cols*T, OY+rnd()*rows*T, 2+rnd()*T*.25, 2+rnd()*T*.12); }
    for (let x=0;x<cols;x++) for (let y=0;y<rows;y++) { const k = x+','+y, px = OX+x*T, py = OY+y*T;
      if (waterSet.has(k)) { b.fillStyle = '#2a7fb5'; b.fillRect(px,py,T,T); b.fillStyle = 'rgba(255,255,255,.18)'; b.fillRect(px+T*.2,py+T*.3,T*.35,T*.06); b.fillRect(px+T*.5,py+T*.65,T*.3,T*.06); continue; }
      if (pathSet.has(k)) { b.fillStyle = '#d8c08a'; b.fillRect(px,py,T,T); b.fillStyle = 'rgba(141,91,29,.22)'; b.fillRect(px+rnd()*T*.7,py+rnd()*T*.7,T*.12,T*.08); b.fillRect(px+rnd()*T*.7,py+rnd()*T*.7,T*.08,T*.08);
        // trail edges
        b.fillStyle = 'rgba(90,58,28,.35)'; if (!pathSet.has(x+','+(y-1))) b.fillRect(px,py,T,Math.max(1,T*.06)); if (!pathSet.has(x+','+(y+1))) b.fillRect(px,py+T-Math.max(1,T*.06),T,Math.max(1,T*.06)); if (!pathSet.has((x-1)+','+y)) b.fillRect(px,py,Math.max(1,T*.06),T); if (!pathSet.has((x+1)+','+y)) b.fillRect(px+T-Math.max(1,T*.06),py,Math.max(1,T*.06),T); continue; }
      const r = rnd(); if (r < .07) { b.fillStyle = '#1f5a38'; b.beginPath(); b.moveTo(px+T*.5,py+T*.12); b.lineTo(px+T*.85,py+T*.78); b.lineTo(px+T*.15,py+T*.78); b.fill(); b.fillStyle = '#16452b'; b.beginPath(); b.moveTo(px+T*.5,py+T*.12); b.lineTo(px+T*.85,py+T*.78); b.lineTo(px+T*.5,py+T*.78); b.fill(); b.fillStyle = '#5a3a1c'; b.fillRect(px+T*.45,py+T*.78,T*.1,T*.14); }
      else if (r < .11) { b.fillStyle = '#7d8a86'; b.beginPath(); b.ellipse(px+T*.5,py+T*.62,T*.24,T*.16,0,0,TAU); b.fill(); b.fillStyle = 'rgba(255,255,255,.2)'; b.beginPath(); b.ellipse(px+T*.44,py+T*.56,T*.1,T*.05,0,0,TAU); b.fill(); }
      else if (r < .17) { b.fillStyle = 'rgba(213,243,103,.4)'; b.fillRect(px+T*.3,py+T*.5,T*.05,T*.2); b.fillRect(px+T*.42,py+T*.45,T*.05,T*.25); b.fillRect(px+T*.55,py+T*.52,T*.05,T*.18); }
      else if (r < .19) { b.fillStyle = ['#EA55AB','#F9BF01','#fff'][Math.floor(rnd()*3)]; b.beginPath(); b.arc(px+T*.5,py+T*.5,T*.07,0,TAU); b.fill(); } }
    // dashed trail guides + entrances + camp
    routes.forEach(R => { b.strokeStyle = 'rgba(141,91,29,.35)'; b.lineWidth = Math.max(1.5,T*.07); b.setLineDash([T*.15,T*.2]); b.beginPath(); R.P.forEach(([x,y],i)=>i?b.lineTo(x,y):b.moveTo(x,y)); b.stroke(); b.setLineDash([]);
      const [sx,sy] = R.P[0]; b.fillStyle = 'rgba(255,69,57,.75)'; b.beginPath(); b.arc(Math.min(W-6,Math.max(6,sx)), Math.min(H-6,Math.max(6,sy)), T*.22, 0, TAU); b.fill(); });
    const [cx,cy] = routes[0].P[routes[0].P.length-1], s = T*.42; b.fillStyle = '#DD8B03'; b.beginPath(); b.moveTo(cx,cy-s); b.lineTo(cx+s,cy+s*.8); b.lineTo(cx-s,cy+s*.8); b.fill(); b.fillStyle = '#121313'; b.beginPath(); b.moveTo(cx,cy-s*.1); b.lineTo(cx+s*.3,cy+s*.8); b.lineTo(cx-s*.3,cy+s*.8); b.fill();
    b.fillStyle = 'rgba(0,0,0,.25)'; b.fillRect(0,0,W,OY); b.fillRect(0,OY+rows*T,W,H); b.fillRect(0,0,OX,H); b.fillRect(OX+cols*T,0,W,H);
    return cv; };

  // ---------------- state (pooled arrays, swap-removal instead of filter) ----------------
  let state='menu', wave=0, gold=0, lives=0, score=0, towers=[], enemies=[], shots=[], fx=[], queue=[], qi=0, spawnT=0, between=0, sel=null, build='archer', aim=null;
  let spd = 1, leaked=false, perfect=0, cds={meteor:0,freeze:0,rally:0,reveal:0}, freezeT=0, rallyT=0, revealT=0, hover=null, banner=null, flash=0, eid=0, bosses=0, simT = 0;
  const FXMAX = () => perf ? 50 : 170;
  const tmp = {x:0,y:0};
  const hpMul = () => (1 + (wave-1)*.17 + Math.pow(Math.max(1,wave),1.7)*.012) * Math.pow(M().grow, Math.max(0,wave-1)) * M().hp * A.D(.8,1,1.25) * (MAPS[map].big ? 1.15 : 1);
  const lvl5 = t => Math.min(t.lvl, 5);
  const tstat = t => { const D = TW[t.type], L = lvl5(t)-1, buff = t.buff||0;
    return {range:(D.range*T)*(1+.1*L), dmg:D.dmg*(1+.5*L)*(1+.05*A.U('power'))*(1+buff), rate:D.rate*(1-.08*L)/(1+buff*.6), slow:D.slow?Math.min(.8,D.slow+.07*L):0, chain:D.chain?D.chain+L:0,
      splash:D.splash?D.splash*T*(1+.1*L):0, inc:D.inc?Math.round(D.inc*(1+.6*(t.lvl-1))*Math.pow(1.08, Math.max(0,t.lvl-5))):0, poison:D.poison?D.poison*(1+.6*L)*(1+buff):0, bees:D.bees?D.bees+Math.floor(L/2):0, knock:D.knock?D.knock*T*(1+.15*L):0, tbuff:D.buff?D.buff+.08*L:0}; };
  const upCost = t => Math.round(TW[t.type].cost*.8*t.lvl*Math.pow(t.type=='pan' ? 1.18 : 1.1, Math.max(0, t.lvl-1)));
  const sellVal = t => Math.round(t.spent*.7);
  const waveList = n => { const L = [], add = (t,k,gap)=>{ for (let i=0;i<k;i++) L.push([t,gap]); }, big = MAPS[map].big ? 1.4 : 1;
    add('beetle',Math.round((5+Math.ceil(n*1.2))*big),.75); if (n>=2) add('hare',Math.floor(n*.8*big),.45); if (n>=3 && n%2) add('gnat',Math.round((6+n)*big),.16);
    if (n>=4) add('armadillo',Math.floor(n/2*big),1); if (n>=6) add('toad',Math.floor(n/4),1.2); if (n>=7) add('slime',Math.floor(n/3),.9);
    const gW = mode=='veteran'||mode=='nightmare' ? 4 : 6; if (n>=gW) add('ghost',Math.floor((n-gW)/1.5)+2,.8);
    if (n>=8) add('knight',Math.floor((n-6)/2),1.1); if (n>=9) add('crow',Math.floor(n/2*big),.5);
    for (let i=L.length-1;i>0;i--) { const j = Math.random()*(i+1)|0; [L[i],L[j]] = [L[j],L[i]]; }
    if (n%5==0) { const k = (n/5-1) % 5, boss = ['bear','moose','wraith','phantom','golem'][k]; add(boss, Math.floor(n/25)+1, 2.4); if (mode=='nightmare' && n>=10) add('bear',1,2); }
    return L; };
  const spawn = (type, d, ri) => { const D = EN[type], hp = D.hp*hpMul(), R = ri==null ? Math.random()*routes.length|0 : ri;
    const e = {id:++eid, type, D, ri:R, d:d||0, hp, max:hp, slowT:0, slow:0, x:0, y:0, sh:D.shield?D.shield+Math.floor(wave/6):0, rev:0, chT:0, pT:0, pD:0, inv:0, invT:D.phantom?4:0, sumT:6, dead:0, an:Math.random()*6};
    (D.fly ? flyAt : posAt)(routes[R], e.d, e); e.x = e.x; enemies.push(e); return e; };
  const isGhost = e => e.D.ghost || (e.D.phantom && e.inv);
  const visible = e => !isGhost(e) || e.rev || revealT > 0;
  const canHit = (e, D) => visible(e) && (!e.D.fly || !D.splash || D.air) && (!D.airOnly || e.D.fly);
  const addFx = (k,x,y,a,b2,col,t) => { if (fx.length >= FXMAX()) return; fx.push({k,x,y,a,b:b2,c:col,t,t0:t}); };
  const float = (x,y,s,col) => { if (fx.length >= FXMAX()) return; fx.push({k:'txt',x,y,s,c:col||C.gold,t:.8,t0:.8}); };
  const say = (txt,sub) => banner = {txt,sub,t:2.4};
  const hurt = (e, d, pierceArmor) => { if (e.dead) return; const D = e.D; if (e.sh>0) { e.sh--; addFx('ring',e.x,e.y,D.r*T+6,0,'#9fd8ff',.2); return; }
    e.hp -= pierceArmor ? d : Math.max(d*.25, d-(D.armor||0));
    if (e.hp<=0) { e.dead = 1; const bb = Math.max(1, Math.round((D.b + Math.floor(wave/5))*M().gold)); gold += bb; score += bb*10; pushScore(); float(e.x,e.y-10,'+'+bb);
      if (D.boss) { bosses++; stat(api,'tdBoss',1,'add'); A.sfx('win'); say(D.boss.toUpperCase()+' DEFEATED','+'+bb+' gold'); if (!perf) for (let i=0;i<24;i++) addFx('spark',e.x,e.y,Math.random()*TAU,40+Math.random()*120,i%2?C.gold:'#fff',.6); }
      else A.tone(760,.03,'square',.02);
      if (D.split) { spawn('mini',Math.max(0,e.d-8),e.ri); spawn('mini',e.d+8,e.ri); } } };
  const newGame = (mi,r) => { setMap(mi); wave = r?r.wave:0; if (r && r.mode && MODES[r.mode]) mode = r.mode; gold = r?r.gold:Math.round(A.D(180,140,110)*(mode=='nightmare'?.85:1)*(MAPS[mi].big?1.6:1))+40*A.U('gold');
    lives = r?r.lives:Math.round(A.D(30,20,12)*M().lives*(MAPS[mi].big?1.5:1))+5*A.U('hp'); score = r?r.score:0; perfect = r?(r.perfect||0):0;
    towers = r ? r.towers.filter(t=>TW[t.type] && free(t.c,t.r)).map(t=>({...t,cd:0,heat:0,tg:0})) : []; enemies = []; shots = []; fx = []; queue = []; qi = 0; sel = null; aim = null;
    cds = {meteor:0,freeze:0,rally:0,reveal:0}; freezeT = rallyT = revealT = 0; state = 'build'; between = 12; pushScore();
    say(r ? 'WELCOME BACK' : MAPS[mi].name.toUpperCase(), r ? 'Wave '+(wave+1)+' is up next' : (routes.length>1 ? routes.length+' trails into camp — watch every entrance!' : 'Build towers, then press Space or Next wave')); ui(); };
  const startWave = () => { if (state!='build') return;
    if (wave>0 && between>1) { const bonus = Math.floor(between)*2; gold += bonus; float(W/2,40,'+'+bonus+' early-call bonus'); }
    wave++; leaked = false; quiz = null; queue = waveList(wave); qi = 0; spawnT = .3; state = 'wave'; A.sfx('blip');
    if (wave%5==0) { const k = (wave/5-1)%5, nm = ['A GRIZZLY','A BULL MOOSE (charges!)','THE WRAITH (a ghost!)','THE PHANTOM KING (turns invisible, summons ghosts)','A STONE GOLEM (heavy armor)'][k]; say('WAVE '+wave+' · BOSS', nm+' is coming'); }
    else if (wave==(mode=='veteran'||mode=='nightmare'?4:6)) say('WAVE '+wave+' · GHOSTS','Invisible unless a Lantern, Frost, Spirit Bell or Reveal lights them up');
    else if (wave==8) say('WAVE 8 · SHIELD BEETLES','Each shield pip blocks one hit'); else if (wave==9) say('WAVE 9 · CROWS','They fly straight at camp · Sky Net and Hawks love them'); ui(); };
  const waveClear = () => { state = 'build'; between = 10; if (A.edu && A.edu.on) { between = 16; setTimeout(askQuiz,0); }
    let inc = 0; for (const t of towers) if (t.type=='pan') inc += tstat(t).inc; const bonus = Math.round((15 + wave*3)*M().gold) + inc;
    gold += bonus; score += wave*100; pushScore(); perfect = leaked ? 0 : perfect+1;
    stat(api,'tdWave',wave); stat(api,'tdPerfect',perfect); A.sfx('coin');
    say('WAVE '+wave+' CLEARED','+'+bonus+' gold'+(inc?' (pans +'+inc+')':'')+(leaked?'':' · no leaks')); ui(); };
  const gameOver = () => { state = 'over'; A.sfx('over'); api.over(Math.round(score*M().mult)); ui(); };
  const cast = (id,x,y) => { if (cds[id]>0 || (state!='wave' && state!='build')) return false; cds[id] = AB[id].cd; A.sfx('coin');
    if (id=='meteor') { const dmg = 60 + wave*14, R2 = T*1.6; for (const e of enemies) if (Math.hypot(e.x-x,e.y-y)<R2) hurt(e,dmg); addFx('ring',x,y,R2,0,C.orange,.45); flash = .12; A.tone(70,.35,'sawtooth',.08); }
    if (id=='freeze') { freezeT = 3; say('FREEZE','Every critter stops for 3 seconds'); }
    if (id=='rally') { rallyT = 6; say('RALLY','Towers fire twice as fast for 6 seconds'); }
    if (id=='reveal') { revealT = 6; say('REVEAL','Every ghost — even the Phantom King — can be hit for 6 seconds'); }
    ui(); return true; };
  const findTarget = (t, cx, cy, S, D) => { let best = null, bv = -1e9; const R2 = S.range*S.range;
    for (const e of enemies) { if (e.dead || !canHit(e,D)) continue; const dx = e.x-cx, dy = e.y-cy, dd = dx*dx+dy*dy; if (dd > R2) continue;
      const v = t.mode=='strong' ? e.hp : t.mode=='close' ? -dd : e.d + (e.D.fly ? 0 : 0); if (v > bv) { bv = v; best = e; } } return best; };
  // ---------------- one simulation step (fixed 1/60 s) ----------------
  const STEP = 1/60;
  const step = dt => {
    for (const k in cds) cds[k] = Math.max(0, cds[k]-dt); rallyT = Math.max(0, rallyT-dt); revealT = Math.max(0, revealT-dt); flash = Math.max(0, flash-dt); if (banner) banner.t -= dt;
    if (state=='build' && wave>0) { between -= dt; if (between<=0) startWave(); }
    if (state=='wave') { spawnT -= dt; if (qi < queue.length && spawnT<=0) { const [t,gap] = queue[qi++]; spawn(t); spawnT = gap; } }
    const frozen = freezeT>0; freezeT = Math.max(0, freezeT-dt);
    // totems buff towers around them
    for (const t of towers) t.buff = 0;
    for (const t of towers) if (t.type=='totem') { const S = tstat(t), cx = OX+t.c*T+T/2, cy = OY+t.r*T+T/2; for (const o of towers) if (o!==t && o.type!='totem' && Math.hypot(OX+o.c*T+T/2-cx, OY+o.r*T+T/2-cy) <= S.range) o.buff = Math.max(o.buff, S.tbuff); }
    const camp = routes[0].P[routes[0].P.length-1];
    for (const e of enemies) { if (e.dead) continue; const D = e.D; e.slowT = Math.max(0, e.slowT-dt); e.an += dt*6;
      if (e.pT > 0) { e.pT -= dt; hurt(e, e.pD*dt, true); if (e.dead) continue; }
      if (D.charge) { e.chT -= dt; if (e.chT<=-2.5) e.chT = 1; }
      if (D.phantom) { e.invT -= dt; if (e.invT <= 0) { e.inv = !e.inv; e.invT = e.inv ? 3 : 4.5; if (e.inv) addFx('ring',e.x,e.y,T,0,'#d9c8ff',.4); }
        e.sumT -= dt; if (e.sumT <= 0) { e.sumT = 7; for (let k=0;k<3;k++) spawn('ghost', Math.max(0, e.d - 20 - k*14), e.ri); addFx('ring',e.x,e.y,T*1.4,0,'#b8a8ff',.5); } }
      const chg = D.charge && e.chT>0 ? 3 : 1, R = routes[e.ri];
      e.d += frozen ? 0 : D.sp*T*M().sp*chg*(e.slowT>0 ? 1-e.slow : 1)*dt;
      if (D.heal) for (const o of enemies) if (o!==e && !o.dead && Math.abs(o.d-e.d)<T*1.5) o.hp = Math.min(o.max, o.hp + D.heal*dt*hpMul()*.3);
      if (e.d >= (D.fly ? R.fly : R.total)) { e.dead = 1; if (!A.immortal) lives -= D.dmg||1; leaked = true; A.sfx('bad'); flash = .25; continue; }
      (D.fly ? flyAt : posAt)(R, e.d, e); }
    // ghost spotting
    for (const e of enemies) { if (e.dead || !isGhost(e)) continue; e.rev = 0;
      for (const t of towers) { const S = TW[t.type]; const sees = S.reveal || S.pulse || t.type=='frost' || (t.type=='totem' && t.lvl>=3); if (!sees) continue;
        const R = tstat(t).range*(S.reveal||S.pulse||t.type=='totem'?1:.55); const dx = e.x-(OX+t.c*T+T/2), dy = e.y-(OY+t.r*T+T/2); if (dx*dx+dy*dy <= R*R) { e.rev = 1; break; } } }
    const rate = rallyT>0 ? .5 : 1;
    for (const t of towers) { const D = TW[t.type]; if (!D.range || D.buff) continue; t.cd -= dt; const S = tstat(t), cx = OX+t.c*T+T/2, cy = OY+t.r*T+T/2;
      if (D.beam) { const p = t.tg && !t.tg.dead && canHit(t.tg,D) && Math.hypot(t.tg.x-cx,t.tg.y-cy) <= S.range ? t.tg : findTarget(t,cx,cy,S,D);
        if (!p) { t.tg = null; t.heat = 0; continue; } if (p !== t.tg) { t.tg = p; t.heat = 0; } t.heat = Math.min(4, t.heat + dt*1.2); t.ang = Math.atan2(p.y-cy,p.x-cx); hurt(p, S.dmg*(1+t.heat)*dt*(rallyT>0?2:1)*Math.max(.3, 1-(p.D.armor||0)/15), true); continue; }
      if (t.cd>0) continue;
      if (D.pulse) { let any = false; for (const e of enemies) if (!e.dead && Math.hypot(e.x-cx,e.y-cy) <= S.range) { hurt(e, S.dmg); any = true; }
        if (any) { t.cd = S.rate*rate; addFx('ring',cx,cy,S.range,0,'#9fe8ff',.35); A.tone(1500,.05,'sine',.02); } continue; }
      const p = findTarget(t,cx,cy,S,D); if (!p) continue;
      t.cd = S.rate*rate; t.ang = Math.atan2(p.y-cy,p.x-cx); const lv = lvl5(t);
      if (t.type=='archer') shots.push({k:'arrow',x:cx,y:cy,tg:p,dmg:S.dmg,sp:T*13,a:t.ang,lv,px:cx,py:cy});
      else if (t.type=='hive') { for (let b=0;b<S.bees;b++) shots.push({k:'bee',x:cx+(b-.5)*6,y:cy,tg:p,dmg:S.dmg,sp:T*6,a:0,lv,life:4,px:cx,py:cy}); }
      else if (t.type=='hawk') { hurt(p, S.dmg*(p.D.fly?D.air:1)); addFx('line',cx,cy,p.x,p.y,'#fff',.12); }
      else if (t.type=='lantern') { hurt(p,S.dmg); addFx('line',cx,cy,p.x,p.y,'#fff2a8',.1); }
      else if (t.type=='skynet') { hurt(p, S.dmg); p.slowT = 1.2; p.slow = .4; addFx('ring',p.x,p.y,T*.5,0,'#c9ccd1',.25); }
      else if (t.type=='cannon') shots.push({k:'rock',x:cx,y:cy,tx:p.x,ty:p.y,dmg:S.dmg,sp:T*6.5,splash:S.splash,lv,px:cx,py:cy});
      else if (t.type=='shroom') { hurt(p, S.dmg, true); p.pT = 3; p.pD = Math.max(p.pD, S.poison); addFx('line',cx,cy,p.x,p.y,'#c78bf0',.12); }
      else if (t.type=='frost') { hurt(p,S.dmg); p.slowT = 1.6; p.slow = S.slow; addFx('line',cx,cy,p.x,p.y,C.sky,.15); }
      else if (t.type=='geyser') { for (const e of enemies) if (!e.dead && !e.D.fly && !e.D.boss && Math.hypot(e.x-cx,e.y-cy) <= S.range) { hurt(e,S.dmg); e.d = Math.max(0, e.d - S.knock); } addFx('ring',cx,cy,S.range,0,'#64CDF5',.35); A.tone(200,.08,'triangle',.03); }
      else if (t.type=='bolt') { let cur = p, px = cx, py = cy; const hitL = [p];
        for (let n=0;n<S.chain && cur;n++) { hurt(cur,S.dmg*(n?.7:1)); addFx('line',px,py,cur.x,cur.y,C.gold,.16); px = cur.x; py = cur.y;
          let nx = null, nd = (T*1.8)*(T*1.8); for (const e of enemies) { if (e.dead || hitL.includes(e) || !canHit(e,D)) continue; const dd = (e.x-px)**2+(e.y-py)**2; if (dd < nd) { nd = dd; nx = e; } } cur = nx; if (cur) hitL.push(cur); }
        A.tone(1200,.04,'square',.02); } }
    // shots
    for (const s of shots) { if (s.dead) continue; s.px = s.x; s.py = s.y;
      if (s.k=='arrow' || s.k=='bee') { if (s.k=='bee') { s.life -= dt; if (s.life<=0) { s.dead = 1; continue; } }
        if (!s.tg || s.tg.dead) { if (s.k=='bee') { s.tg = findTarget({mode:'close'}, s.x, s.y, {range:T*3}, TW.hive); if (!s.tg) { s.dead = 1; continue; } } else { s.dead = 1; continue; } }
        // ghosts phase through arrows and rocks while invisible
        if (isGhost(s.tg) && !visible(s.tg)) { s.dead = 1; continue; }
        const dx = s.tg.x-s.x, dy = s.tg.y-s.y, d = Math.hypot(dx,dy), stp = s.sp*dt;
        if (d<=stp+3) { if (s.tg.D.phantom && Math.random()<.35) { float(s.tg.x, s.tg.y-14, 'phased!', '#d9c8ff'); } else hurt(s.tg,s.dmg); s.dead = 1; } else { s.x += dx/d*stp; s.y += dy/d*stp; s.a = Math.atan2(dy,dx); } }
      else { const dx = s.tx-s.x, dy = s.ty-s.y, d = Math.hypot(dx,dy), stp = s.sp*dt;
        if (d<=stp) { s.dead = 1; for (const e of enemies) if (!e.dead && canHit(e,TW.cannon) && Math.hypot(e.x-s.tx,e.y-s.ty)<s.splash) hurt(e,s.dmg); addFx('ring',s.tx,s.ty,s.splash,0,C.orange,.3); if (!perf) for (let i=0;i<5;i++) addFx('spark',s.tx,s.ty,Math.random()*TAU,30+Math.random()*60,'#c48a4a',.35); }
        else { s.x += dx/d*stp; s.y += dy/d*stp; } } }
    // compact arrays (no new arrays every frame)
    let n = 0; for (const s of shots) if (!s.dead) shots[n++] = s; shots.length = n;
    n = 0; for (const e of enemies) if (!e.dead) enemies[n++] = e; enemies.length = n;
    n = 0; for (const f of fx) { f.t -= dt; if (f.t > 0) fx[n++] = f; } fx.length = n;
    if (lives<=0) { lives = 0; gameOver(); return; }
    if (state=='wave' && qi >= queue.length && !enemies.length) waveClear(); };

  // ---------------- drawing ----------------
  const drawTower = (t) => { const D = TW[t.type], lv = lvl5(t), x = OX+t.c*T, y = OY+t.r*T, cx = x+T/2, cy = y+T/2, s = T*(.62+.06*(lv-1)), half = s/2;
    if (!perf && lv>=4) { g.fillStyle = lv>=5 ? 'rgba(249,191,1,.28)' : 'rgba(213,243,103,.2)'; g.beginPath(); g.arc(cx,cy,s*.78+Math.sin(performance.now()/300)*1.5,0,TAU); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.28)'; rrect(g,cx-half+2,cy-half+3,s,s,s*.25); g.fill();
    g.fillStyle = lv>=3 ? '#3b3f42' : '#5a5f63'; rrect(g,cx-half,cy-half,s,s,s*.25); g.fill();   // stone base gets darker/fancier
    g.fillStyle = D.col; rrect(g,cx-half*.82,cy-half*.82,s*.82,s*.82,s*.22); g.fill();
    if (!perf) { g.fillStyle = 'rgba(255,255,255,.22)'; rrect(g,cx-half*.72,cy-half*.75,s*.62,s*.18,s*.08); g.fill(); }
    // level details: brick lines, side banners, crystals, crown
    if (lv>=2) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx-half*.8,cy+half*.25); g.lineTo(cx+half*.8,cy+half*.25); g.stroke(); }
    if (lv>=3) { g.fillStyle = D.top; g.fillRect(cx-half-1,cy-half*.4,3,half*.9); g.fillRect(cx+half-2,cy-half*.4,3,half*.9); }
    if (lv>=4) { g.fillStyle = '#ffffff'; for (const sx of [-1,1]) { g.beginPath(); g.moveTo(cx+sx*half*.65,cy-half*.95); g.lineTo(cx+sx*half*.5,cy-half*.6); g.lineTo(cx+sx*half*.8,cy-half*.6); g.fill(); } }
    // turret / top piece by type
    const a = t.ang || -Math.PI/2; g.save(); g.translate(cx,cy);
    if (t.type=='archer' || t.type=='skynet' || t.type=='hawk') { g.rotate(a); g.fillStyle = D.top; g.fillRect(0,-s*.07,s*.5,s*.14); if (lv>=3) g.fillRect(0,-s*.18,s*.38,s*.07); if (lv>=5) g.fillRect(0,s*.11,s*.38,s*.07); }
    else if (t.type=='cannon') { g.rotate(a); g.fillStyle = D.top; g.fillRect(0,-s*.12,s*.48,s*.24); g.fillStyle = '#121313'; g.beginPath(); g.arc(s*.48,0,s*.1,0,TAU); g.fill(); }
    else if (t.type=='bolt' || t.type=='bell') { g.fillStyle = D.top; g.beginPath(); g.moveTo(0,-s*.42); g.lineTo(s*.16,0); g.lineTo(-s*.16,0); g.fill(); if (t.type=='bolt' && !perf) { g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.moveTo(-s*.08,-s*.1); g.lineTo(0,-s*.25); g.lineTo(-s*.03,-s*.18); g.stroke(); } }
    else if (t.type=='frost') { g.strokeStyle = '#fff'; g.lineWidth = Math.max(1.5,s*.06); for (let k=0;k<3;k++) { g.rotate(Math.PI/3); g.beginPath(); g.moveTo(-s*.28,0); g.lineTo(s*.28,0); g.stroke(); } }
    else if (t.type=='pan') { g.fillStyle = '#5a3a1c'; g.beginPath(); g.ellipse(0,s*.05,s*.32,s*.16,0,0,TAU); g.fill(); g.fillStyle = C.gold; for (let k=0;k<Math.min(6,1+Math.floor(t.lvl/2));k++) { g.beginPath(); g.arc(-s*.15+k%3*s*.15, s*.02-Math.floor(k/3)*s*.08, s*.06, 0, TAU); g.fill(); } }
    else if (t.type=='lantern') { g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(0,0,s*.2,0,TAU); g.fill(); }
    else if (t.type=='shroom') { g.fillStyle = '#fff'; g.fillRect(-s*.06,-s*.05,s*.12,s*.25); g.fillStyle = D.top; g.beginPath(); g.arc(0,-s*.05,s*.26,Math.PI,0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-s*.1,-s*.14,s*.04,0,TAU); g.arc(s*.08,-s*.17,s*.035,0,TAU); g.fill(); }
    else if (t.type=='totem') { g.fillStyle = D.top; g.fillRect(-s*.12,-s*.38,s*.24,s*.6); g.fillStyle = '#fff'; g.fillRect(-s*.08,-s*.28,s*.05,s*.05); g.fillRect(s*.03,-s*.28,s*.05,s*.05); g.fillStyle = '#F9BF01'; g.fillRect(-s*.24,-s*.42,s*.48,s*.07); }
    else if (t.type=='hive') { g.fillStyle = D.top; for (let k=0;k<3;k++) { g.beginPath(); g.ellipse(0,-s*.18+k*s*.13,s*(.2+k*.03),s*.07,0,0,TAU); g.fill(); } g.fillStyle = '#121313'; g.beginPath(); g.arc(0,s*.12,s*.05,0,TAU); g.fill(); }
    else if (t.type=='sun') { g.fillStyle = '#ffe14f'; g.beginPath(); g.arc(0,0,s*.18+(t.heat||0)*s*.02,0,TAU); g.fill(); g.strokeStyle = '#ffe14f'; g.lineWidth = 1.5; for (let k=0;k<8;k++) { const aa = k*Math.PI/4 + performance.now()/900; g.beginPath(); g.moveTo(Math.cos(aa)*s*.24,Math.sin(aa)*s*.24); g.lineTo(Math.cos(aa)*s*.34,Math.sin(aa)*s*.34); g.stroke(); } }
    else if (t.type=='geyser') { g.fillStyle = '#14457a'; g.beginPath(); g.arc(0,0,s*.22,0,TAU); g.fill(); g.fillStyle = '#9fe8ff'; g.beginPath(); g.arc(0,0,s*.1+(t.cd>0?0:s*.04),0,TAU); g.fill(); }
    g.restore();
    if (lv>=5) { g.fillStyle = C.gold; const y0 = cy-half-s*.18; g.beginPath(); g.moveTo(cx-s*.18,y0+s*.14); g.lineTo(cx-s*.18,y0); g.lineTo(cx-s*.09,y0+s*.07); g.lineTo(cx,y0-s*.02); g.lineTo(cx+s*.09,y0+s*.07); g.lineTo(cx+s*.18,y0); g.lineTo(cx+s*.18,y0+s*.14); g.fill(); }
    // level pips (Gold Pans show the number)
    if (t.type=='pan' && t.lvl>5) { g.fillStyle = '#121313'; g.font = '700 '+Math.max(9,T*.26|0)+'px '+A.font; g.textAlign = 'center'; g.fillText('Lv'+t.lvl, cx, y+T-2); }
    else for (let i=0;i<t.lvl && i<5;i++) { g.fillStyle = i>=3 ? C.gold : C.lime; g.fillRect(cx-s*.4+i*s*.17, cy+half-s*.12, s*.13, Math.max(2,s*.06)); } };
  const drawEnemy = e => { const D = e.D, r = D.r*T, gh = isGhost(e), vis = visible(e);
    g.globalAlpha = gh ? (vis ? .85 : .12+.06*Math.sin(e.an)) : 1;
    if (!perf && !D.fly && !gh) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(e.x,e.y+r*.7,r,r*.38,0,0,TAU); g.fill(); }
    const bob = perf ? 0 : Math.sin(e.an)*r*.08;
    if (D.fly) { const fl = Math.sin(e.an*2)*r*.6; g.fillStyle = D.col; g.beginPath(); g.moveTo(e.x-r*1.6,e.y-fl); g.lineTo(e.x,e.y); g.lineTo(e.x+r*1.6,e.y-fl); g.lineTo(e.x,e.y-r*.4); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(e.x+r*.2,e.y-r*.1); g.lineTo(e.x+r*.7,e.y); g.lineTo(e.x+r*.2,e.y+r*.15); g.fill(); }
    else if (D.ghost || D.phantom) { g.fillStyle = D.col; g.beginPath(); g.arc(e.x,e.y-r*.2+bob,r,Math.PI,0); for (let k=0;k<=4;k++) g.lineTo(e.x+r-k*r/2, e.y+r+bob+(k%2?-r*.3:r*.15)); g.fill();
      g.fillStyle = D.phantom ? '#5a2a99' : '#121313'; g.beginPath(); g.arc(e.x-r*.3,e.y-r*.3+bob,r*.18,0,TAU); g.arc(e.x+r*.3,e.y-r*.3+bob,r*.18,0,TAU); g.fill();
      if (D.phantom) { g.fillStyle = C.gold; g.beginPath(); g.moveTo(e.x-r*.6,e.y-r*1.05); g.lineTo(e.x-r*.6,e.y-r*1.45); g.lineTo(e.x-r*.3,e.y-r*1.2); g.lineTo(e.x,e.y-r*1.55); g.lineTo(e.x+r*.3,e.y-r*1.2); g.lineTo(e.x+r*.6,e.y-r*1.45); g.lineTo(e.x+r*.6,e.y-r*1.05); g.fill(); } }
    else { g.fillStyle = freezeT>0 ? '#bfe9ff' : D.col; g.beginPath(); g.arc(e.x,e.y+bob,r,0,TAU); g.fill();
      if (!perf) { g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(e.x-r*.3,e.y-r*.35+bob,r*.35,0,TAU); g.fill(); }
      if (e.type=='armadillo'||e.type=='bear'||e.type=='golem') { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = Math.max(1,r*.12); for (const o of [-.35,0,.35]) { g.beginPath(); g.moveTo(e.x+o*r,e.y-r*.8+bob); g.lineTo(e.x+o*r,e.y+r*.8+bob); g.stroke(); } }
      if (e.type=='golem') { g.fillStyle = '#FF8A3C'; g.fillRect(e.x-r*.45,e.y-r*.3+bob,r*.25,r*.12); g.fillRect(e.x+r*.2,e.y-r*.3+bob,r*.25,r*.12); }
      if (e.type=='moose') { g.strokeStyle = '#c48a4a'; g.lineWidth = Math.max(2,r*.18); g.beginPath(); g.moveTo(e.x-r*.4,e.y-r*.75); g.lineTo(e.x-r*1.1,e.y-r*1.3); g.moveTo(e.x+r*.4,e.y-r*.75); g.lineTo(e.x+r*1.1,e.y-r*1.3); g.stroke(); if (e.chT>0) { g.strokeStyle = 'rgba(255,69,57,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(e.x,e.y,r+4,0,TAU); g.stroke(); } }
      if (e.type=='bear') { g.fillStyle = D.col; g.beginPath(); g.arc(e.x-r*.65,e.y-r*.7+bob,r*.35,0,TAU); g.arc(e.x+r*.65,e.y-r*.7+bob,r*.35,0,TAU); g.fill(); }
      if (e.type=='hare') { g.fillStyle = D.col; g.fillRect(e.x-r*.5,e.y-r*1.8+bob,r*.3,r*1.1); g.fillRect(e.x+r*.2,e.y-r*1.8+bob,r*.3,r*1.1); }
      if (e.type=='beetle' && !perf) { g.strokeStyle = '#121313'; g.lineWidth = 1; g.beginPath(); g.moveTo(e.x,e.y-r+bob); g.lineTo(e.x,e.y+r+bob); g.stroke(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(e.x-r*.3,e.y-r*.2+bob,r*.18,0,TAU); g.arc(e.x+r*.3,e.y-r*.2+bob,r*.18,0,TAU); g.fill();
      g.fillStyle = '#121313'; g.beginPath(); g.arc(e.x-r*.28,e.y-r*.18+bob,r*.08,0,TAU); g.arc(e.x+r*.32,e.y-r*.18+bob,r*.08,0,TAU); g.fill(); }
    if (e.sh>0) { g.strokeStyle = '#9fd8ff'; g.lineWidth = 2; for (let k=0;k<e.sh;k++) { const a = -Math.PI/2 + (k-(e.sh-1)/2)*.45; g.beginPath(); g.arc(e.x,e.y,r+3,a-.17,a+.17); g.stroke(); } }
    if (e.pT>0) { g.fillStyle = '#a64be0'; g.beginPath(); g.arc(e.x+r*.7,e.y-r*.8,Math.max(2,r*.18),0,TAU); g.fill(); }
    if (e.slowT>0) { g.strokeStyle = C.sky; g.lineWidth = 1.5; g.beginPath(); g.arc(e.x,e.y,r+1.5,0,TAU); g.stroke(); }
    if (e.hp<e.max && !D.boss) { const bw = Math.max(12, r*2); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(e.x-bw/2,e.y-r-6,bw,3); g.fillStyle = e.hp/e.max>.5?C.lime:e.hp/e.max>.25?C.gold:C.red; g.fillRect(e.x-bw/2,e.y-r-6,bw*Math.max(0,e.hp/e.max),3); }
    g.globalAlpha = 1; };
  const draw = () => {
    if (!bg) bg = drawBg(); g.drawImage(bg, 0, 0, W, H);
    if (!perf) for (const t of towers) { if (t.type!='lantern') continue; const R = tstat(t).range, cx = OX+t.c*T+T/2, cy = OY+t.r*T+T/2; g.fillStyle = 'rgba(255,242,168,.12)'; g.beginPath(); g.arc(cx,cy,R,0,TAU); g.fill(); }
    if (hover && (state=='build'||state=='wave')) { const {cc,rr,x,y} = hover;
      if (aim=='meteor') { g.strokeStyle = C.red; g.lineWidth = 2; g.beginPath(); g.arc(x,y,T*1.6,0,TAU); g.stroke(); g.fillStyle = 'rgba(255,69,57,.15)'; g.fill(); }
      else if (build && free(cc,rr) && !towers.some(t=>t.c==cc&&t.r==rr)) { const D = TW[build]; g.fillStyle = gold>=D.cost ? 'rgba(213,243,103,.35)' : 'rgba(255,69,57,.3)'; g.fillRect(OX+cc*T,OY+rr*T,T,T);
        if (D.range) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(OX+cc*T+T/2,OY+rr*T+T/2,D.range*T,0,TAU); g.stroke(); } } }
    if (sel && TW[sel.type].range) { const S = tstat(sel); g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.arc(OX+sel.c*T+T/2,OY+sel.r*T+T/2,S.range,0,TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
    for (const t of towers) drawTower(t);
    if (sel) { g.strokeStyle = '#fff'; g.lineWidth = 2.5; rrect(g,OX+sel.c*T+1,OY+sel.r*T+1,T-2,T-2,T*.25); g.stroke(); }
    // beams
    for (const t of towers) if (t.type=='sun' && t.tg && !t.tg.dead) { const cx = OX+t.c*T+T/2, cy = OY+t.r*T+T/2; g.strokeStyle = 'rgba(255,138,60,.85)'; g.lineWidth = 2+(t.heat||0)*1.2; g.beginPath(); g.moveTo(cx,cy); g.lineTo(t.tg.x,t.tg.y); g.stroke(); if (!perf) { g.strokeStyle = 'rgba(255,241,79,.8)'; g.lineWidth = 1; g.stroke(); } }
    for (const e of enemies) drawEnemy(e);
    for (const s of shots) { const big = 1+(s.lv-1)*.15;
      if (s.k=='arrow') { if (!perf) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(s.x,s.y); g.lineTo(s.x-Math.cos(s.a)*T*.5,s.y-Math.sin(s.a)*T*.5); g.stroke(); }
        g.strokeStyle = s.lv>=4 ? C.gold : '#fff'; g.lineWidth = 2*big; g.beginPath(); g.moveTo(s.x,s.y); g.lineTo(s.x-Math.cos(s.a)*T*.24,s.y-Math.sin(s.a)*T*.24); g.stroke(); }
      else if (s.k=='bee') { g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(s.x,s.y,T*.08*big,0,TAU); g.fill(); g.fillStyle = '#121313'; g.fillRect(s.x-1,s.y-1,2,2); }
      else { if (!perf) { g.fillStyle = 'rgba(122,90,58,.35)'; g.beginPath(); g.arc(s.px,s.py,T*.1*big,0,TAU); g.fill(); } g.fillStyle = s.lv>=4 ? '#a35a2a' : '#7a5a3a'; g.beginPath(); g.arc(s.x,s.y,T*.12*big,0,TAU); g.fill(); } }
    for (const f of fx) { g.globalAlpha = Math.min(1,f.t/f.t0*1.4);
      if (f.k=='line') { g.strokeStyle = f.c; g.lineWidth = 2.5; g.beginPath(); g.moveTo(f.x,f.y); g.lineTo(f.a,f.b); g.stroke(); }
      else if (f.k=='ring') { g.strokeStyle = f.c; g.lineWidth = 2.5; g.beginPath(); g.arc(f.x,f.y,Math.max(1,f.a*(1-f.t/f.t0*.7)),0,TAU); g.stroke(); }
      else if (f.k=='spark') { const k = 1 - f.t/f.t0; g.fillStyle = f.c; g.fillRect(f.x+Math.cos(f.a)*f.b*k, f.y+Math.sin(f.a)*f.b*k, 3, 3); }
      else if (f.k=='txt') { g.fillStyle = f.c; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(f.s,f.x,f.y-(1-f.t/f.t0)*18); } }
    g.globalAlpha = 1;
    if (freezeT>0) { g.fillStyle = 'rgba(100,205,245,.12)'; g.fillRect(0,0,W,H); }
    if (revealT>0) { g.fillStyle = 'rgba(217,200,255,.08)'; g.fillRect(0,0,W,H); }
    if (rallyT>0) { g.strokeStyle = C.gold; g.lineWidth = 4; g.strokeRect(2,2,W-4,H-4); }
    if (flash>0) { g.fillStyle = 'rgba(255,69,57,'+flash+')'; g.fillRect(0,0,W,H); }
    // HUD
    if (state!='menu') { g.fillStyle = 'rgba(18,19,19,.72)'; rrect(g,6,H-32,360,26,13); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'left';
      g.fillText('WAVE '+wave+'   ♥ '+lives+'   ● '+gold+' gold   '+spd+'×'+(perf?'   ⚡perf':''),16,H-14);
      if (state=='build' && wave>0) { g.textAlign = 'right'; g.fillStyle = C.lime; g.fillText('Next wave in '+Math.ceil(between)+'s',W-12,H-14); } }
    // BOSS BAR (big, with name) — strongest living boss
    let boss = null; for (const e of enemies) if (e.D.boss && (!boss || e.hp > boss.hp)) boss = e;
    if (boss) { const bw = Math.min(460, W-40), bx = (W-bw)/2; g.fillStyle = 'rgba(18,19,19,.8)'; rrect(g,bx-8,6,bw+16,38,10); g.fill();
      g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText(boss.D.boss.toUpperCase()+(boss.D.phantom && boss.inv ? ' · INVISIBLE' : '')+(boss.D.armor ? ' · ARMOR '+boss.D.armor : ''), W/2, 21);
      g.fillStyle = '#3a1010'; g.fillRect(bx,26,bw,10); g.fillStyle = boss.D.phantom ? '#b48cff' : boss.hp/boss.max > .3 ? C.red : '#ff8a3c'; g.fillRect(bx,26,bw*Math.max(0,boss.hp/boss.max),10); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(bx,26,bw,10); }
    if (banner && banner.t>0 && state!='menu') { g.globalAlpha = Math.min(1,banner.t); g.fillStyle = 'rgba(1,86,64,.88)'; rrect(g,W/2-220,H/2-40,440,banner.sub?72:46,14); g.fill();
      g.fillStyle = C.lime; g.textAlign = 'center'; g.font = '700 22px '+A.font; g.fillText(banner.txt,W/2,H/2-9); if (banner.sub) { g.fillStyle = '#fff'; g.font = '500 13px '+A.font; g.fillText(banner.sub,W/2,H/2+15,420); } g.globalAlpha = 1; }
    if (state=='menu') A.overlayText(g,W,H,'TRAILHEAD DEFENSE','Pick a trail below — the big ones have several entrances.');
    if (state=='over') A.overlayText(g,W,H,'CAMP OVERRUN','Reached wave '+wave+' on '+MAPS[map].name+' ('+M().n+') · score '+Math.round(score*M().mult).toLocaleString()+' · click to play again');
  };

  // ---------------- toolbar ----------------
  const mk = (txt,fn,extra) => { const x = el('button',Object.assign({fontFamily:A.font,fontWeight:700,fontSize:'12px',border:'none',borderRadius:'10px',padding:'6px 6px',cursor:'pointer',lineHeight:1.15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'},extra||{}),txt); x.onclick = e=>{ e.stopPropagation(); fn(); x.blur(); }; return x; };
  const menuRow = el('div',{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'});
  const towerRow = el('div',{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'5px'});
  const ctlRow = el('div',{display:'grid',gridTemplateColumns:'repeat(4,1fr) 1.4fr .8fr .9fr',gap:'5px'});
  const selRow = el('div',{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'});
  bar.append(menuRow,towerRow,ctlRow,selRow);
  const quizRow = el('div',{display:'none',alignItems:'center',gap:'6px',flexWrap:'wrap',background:'#dff3fc',borderRadius:'10px',padding:'6px 8px'}); bar.appendChild(quizRow); let quiz = null;
  const askQuiz = () => { quiz = A.problem(); quizRow.innerHTML = ''; quizRow.append(el('div',{flex:'1',minWidth:'140px',fontWeight:700,fontSize:'13px',color:'#014987'},'BONUS GOLD · '+A.qText(quiz)));
    quiz.choices.forEach(v=>quizRow.appendChild(mk(String(v),()=>answerQuiz(v),{background:'#ffffff',color:C.forest,padding:'7px 14px',fontSize:'14px'}))); ui(); };
  const answerQuiz = v => { if (!quiz) return; const ok = v===quiz.a; try { api.edu && api.edu(ok); } catch(e){}
    if (ok) { const bonus = 25+wave*4; gold += bonus; say('CORRECT!','+'+bonus+' gold'); A.sfx('coin'); } else { say('NOT QUITE', A.solved(quiz)); A.sfx('bad'); } quiz = null; ui(); };
  const tBtn = {}; TIDS.forEach(id=>{ const D = TW[id]; const x = mk('',()=>{ build = id; sel = null; aim = null; A.sfx('blip'); ui(); }); x.title = D.n+' — '+D.d; tBtn[id] = x; towerRow.appendChild(x); });
  const aBtn = {}; Object.keys(AB).forEach(id=>{ const x = mk('',()=>{ if (cds[id]>0) return A.sfx('bad'); if (id=='meteor') { aim = aim=='meteor'?null:'meteor'; ui(); } else cast(id); }); aBtn[id] = x; ctlRow.appendChild(x); });
  const nextBtn = mk('',()=>startWave()), spdBtn = mk('',()=>{ spd = SPEEDS[(SPEEDS.indexOf(spd)+1)%SPEEDS.length]; ui(); }), perfBtn = mk('',()=>{ perf = !perf; try { localStorage.setItem('wl-td-perf', perf?'1':'0'); } catch(e){} bg = null; ui(); });
  perfBtn.title = 'Performance mode: fewer effects for slower computers'; ctlRow.append(nextBtn,spdBtn,perfBtn);
  const selLbl = el('div',{flex:1,minWidth:'160px',color:'#fff',fontWeight:700,fontSize:'12px'});
  const upBtn = mk('',()=>upgrade()), sellBtn = mk('',()=>sell()), modeBtn = mk('',()=>{ if (!sel) return; sel.mode = {first:'strong',strong:'close',close:'first'}[sel.mode||'first']; ui(); }), doneBtn = mk('Done',()=>{ sel = null; ui(); });
  selRow.append(selLbl,upBtn,sellBtn,modeBtn,doneBtn);
  const upgrade = () => { if (!sel || sel.lvl>=MAXLV(sel)) return; const cst = upCost(sel); if (gold<cst) return A.sfx('bad'); gold -= cst; sel.spent += cst; sel.lvl++; A.sfx('coin');
    if (!perf) for (let i=0;i<12;i++) addFx('spark',OX+sel.c*T+T/2,OY+sel.r*T+T/2,Math.random()*TAU,20+Math.random()*40,i%2?C.gold:C.lime,.5); ui(); };
  const sell = () => { if (!sel) return; gold += sellVal(sel); towers = towers.filter(t=>t!==sel); sel = null; A.sfx('flip'); ui(); };
  const paintBtn = (x,on,ok) => { x.style.background = on ? C.lime : ok ? '#ffffff' : 'rgba(255,255,255,.25)'; x.style.color = on ? C.forest : ok ? C.forest : '#d8e6df'; x.style.cursor = ok ? 'pointer' : 'not-allowed'; };
  let resumedUsed = false;
  let uiSig = '';
  const ui = (force) => {
    const playing = state=='build' || state=='wave';
    const sig = [state, quiz?1:0, sel?towers.indexOf(sel)+':'+sel.lvl+':'+(sel.mode||'')+':'+(sel.buff||0):'', build, aim, spd, perf, mode, wave, Math.floor(between), queue.length-qi+enemies.length, TIDS.map(id=>gold>=TW[id].cost?1:0).join(''), Object.keys(cds).map(k=>Math.ceil(cds[k])).join(','), sel ? (gold>=upCost(sel)?1:0) : ''].join('|');
    if (!force && sig === uiSig) return; uiSig = sig;
    quizRow.style.display = quiz && state=='build' ? 'flex' : 'none';
    menuRow.style.display = playing ? 'none' : 'flex'; towerRow.style.display = playing ? 'grid' : 'none';
    ctlRow.style.display = playing && !sel ? 'grid' : 'none'; selRow.style.display = playing && sel ? 'flex' : 'none';
    if (!playing) { menuRow.innerHTML = ''; menuRow.appendChild(el('div',{color:C.lime,fontWeight:700,fontSize:'12px',letterSpacing:'.08em',marginRight:'4px',width:'100%'},'PICK A TRAIL'));
      const R = api.resume; if (R && R.towers && !resumedUsed && MAPS[R.map]) menuRow.appendChild(mk('Resume · wave '+(R.wave+1)+' on '+MAPS[R.map].name,()=>{ resumedUsed = true; newGame(R.map,R); },{background:C.gold,color:C.forest,padding:'8px 10px',fontSize:'13px'}));
      MAPS.forEach((m,i)=>{ const b = mk((m.big?'🗺️ ':'')+m.name+(m.big?' · '+m.cols+'×'+m.rows+(m.routes.length>1?' · '+m.routes.length+' entrances':''):''),()=>{ resumedUsed = true; newGame(i); A.sfx('blip'); },{background:m.big?C.gold:C.lime,color:C.forest,padding:'8px 10px',fontSize:'13px'}); menuRow.appendChild(b); });
      const mr = el('div',{display:'flex',gap:'4px',flexWrap:'wrap',alignItems:'center',width:'100%'}); mr.appendChild(el('div',{color:C.lime,fontWeight:700,fontSize:'12px',letterSpacing:'.08em',marginRight:'4px'},'MODE'));
      Object.entries(MODES).forEach(([id,Mo])=>{ const x = mk(Mo.n+' ×'+Mo.mult,()=>{ mode = id; try { localStorage.setItem('wl-td-mode',id); } catch(e){} A.sfx('blip'); ui(); },{padding:'6px 9px'}); x.title = Mo.d; paintBtn(x,mode==id,true); mr.appendChild(x); });
      const pb = mk('Performance mode · '+(perf?'ON':'OFF'),()=>{ perf = !perf; try { localStorage.setItem('wl-td-perf', perf?'1':'0'); } catch(e){} bg = null; ui(); },{padding:'6px 9px',marginLeft:'auto'}); paintBtn(pb,perf,true); mr.appendChild(pb);
      mr.appendChild(el('div',{color:'#d8e6df',fontSize:'11px',width:'100%'},M().d+' · score ×'+M().mult+' · Bosses every 5 waves: Grizzly, Bull Moose, The Wraith, Phantom King, Stone Golem')); menuRow.appendChild(mr); return; }
    TIDS.forEach(id=>{ const D = TW[id], x = tBtn[id]; x.textContent = ''; x.append(el('div',{overflow:'hidden',textOverflow:'ellipsis'},(D.k?D.k+' · ':'')+D.n), el('div',{fontSize:'11px',fontWeight:500},D.cost+' gold')); paintBtn(x,build==id,gold>=D.cost); });
    Object.entries(AB).forEach(([id,D])=>{ const x = aBtn[id], cd = cds[id]; x.textContent = D.k+' · '+D.n+(cd>0?' '+Math.ceil(cd)+'s':''); paintBtn(x,aim==id,cd<=0); });
    nextBtn.textContent = state=='wave' ? 'Wave '+wave+' · '+(queue.length-qi+enemies.length)+' left' : (wave==0 ? 'Space · Start wave 1' : 'Space · Next wave'); paintBtn(nextBtn,state=='build',state=='build');
    spdBtn.textContent = 'X · Speed '+spd+'×'; paintBtn(spdBtn,spd!=1,true); perfBtn.textContent = 'Perf '+(perf?'ON':'OFF'); paintBtn(perfBtn,perf,true);
    if (sel) { const D = TW[sel.type], S = tstat(sel), mx = MAXLV(sel);
      selLbl.textContent = D.n+' · Lv '+sel.lvl+(sel.buff?' · boosted +'+Math.round(sel.buff*100)+'%':'')+(D.range ? (D.dmg ? ' · '+Math.round(S.dmg)+' dmg' : '')+(D.buff ? ' · +'+Math.round(S.tbuff*100)+'% to nearby towers' : '')+(D.poison ? ' · poison '+Math.round(S.poison)+'/s' : '') : ' · now +'+S.inc+' gold/wave → next level +'+tstat({...sel, lvl:sel.lvl+1}).inc+' gold/wave (no level cap)');
      upBtn.textContent = sel.lvl>=mx ? 'Max level' : 'U · Upgrade '+upCost(sel); paintBtn(upBtn,false,sel.lvl<mx && gold>=upCost(sel));
      sellBtn.textContent = 'Sell +'+sellVal(sel); paintBtn(sellBtn,false,true);
      modeBtn.style.display = D.range && !D.buff && !D.pulse ? '' : 'none'; modeBtn.textContent = 'Target · '+({first:'First',strong:'Strong',close:'Close'}[sel.mode||'first']); paintBtn(modeBtn,false,true); paintBtn(doneBtn,false,true); } };
  const at = e => { const r = c.getBoundingClientRect(), x = (e.clientX-r.left)*W/r.width, y = (e.clientY-r.top)*H/r.height; return {x,y,cc:Math.floor((x-OX)/T),rr:Math.floor((y-OY)/T)}; };
  c.addEventListener('contextmenu',e=>e.preventDefault());
  c.addEventListener('pointermove',e=>{ hover = at(e); });
  c.addEventListener('pointerleave',()=>{ hover = null; });
  c.addEventListener('pointerdown',e=>{ const p = at(e); hover = p;
    if (state=='over') { state = 'menu'; ui(); return; } if (state=='menu') return;
    if (e.button==2) { sel = null; aim = null; ui(); return; }
    if (aim=='meteor') { if (cast('meteor',p.x,p.y)) aim = null; ui(); return; }
    const t = towers.find(t=>t.c==p.cc && t.r==p.rr); if (t) { sel = sel===t ? null : t; A.sfx('blip'); ui(); return; }
    if (sel) { sel = null; ui(); }
    if (!build || !free(p.cc,p.rr)) return;
    const D = TW[build]; if (gold<D.cost) { A.sfx('bad'); float(p.x,p.y,'Need '+D.cost+' gold',C.red); return; }
    gold -= D.cost; towers.push({c:p.cc,r:p.rr,type:build,lvl:1,spent:D.cost,mode:'first',cd:0,heat:0,tg:null,buff:0}); A.sfx('hit');
    if (!perf) for (let i=0;i<6;i++) addFx('spark',OX+p.cc*T+T/2,OY+p.rr*T+T/2,Math.random()*TAU,15+Math.random()*25,'#d8c08a',.35); ui(); });
  const offK = A.keys(e=>{ if (state!='build' && state!='wave') return; const k = e.key.length==1 ? e.key.toLowerCase() : e.key;
    const tid = TIDS.find(id=>TW[id].k==k); if (tid) { build = tid; sel = null; aim = null; ui(); return; }
    if (k=='q') { aim = aim=='meteor'?null:'meteor'; ui(); } if (k=='w') cast('freeze'); if (k=='e') cast('rally'); if (k=='r') cast('reveal');
    if (k=='x') { spd = SPEEDS[(SPEEDS.indexOf(spd)+1)%SPEEDS.length]; ui(); }
    if (k=='u') upgrade(); if (k==' ') startWave(); });
  let ut = 0;
  const prof = {step:0, draw:0, n:0};
  const offL = A.loop(dt=>{ const t0 = performance.now(); if (state=='build' || state=='wave') { simT += dt*spd; let n = 0; while (simT >= STEP && n < 30) { step(STEP); simT -= STEP; n++; if (state!='build' && state!='wave') break; } if (n >= 30) simT = 0; }
    const t1 = performance.now(); draw(); const t2 = performance.now(); prof.step = prof.step*.95 + (t1-t0)*.05; prof.draw = prof.draw*.95 + (t2-t1)*.05; ut += dt; if (ut>.25) { ut = 0; if (state=='build'||state=='wave') ui(); } });
  api.snap && api.snap(()=> (state=='build'||state=='wave') && (wave>0 || towers.length) ? {map, mode, wave: state=='wave' ? wave-1 : wave, gold, lives, score, perfect, towers: towers.map(({c,r,type,lvl,spent,mode})=>({c,r,type,lvl,spent,mode}))} : null);
  setMap(0); ui();
  // test hook (used by the arcade's automated checks)
  A._td = {prof, get: () => ({state, wave, enemies: enemies.length, towers: towers.length, fx: fx.length, map, spd, perf, gold}), newGame, startWave, setSpd: v => { spd = v; ui(); }, setPerf: v => { perf = v; bg = null; ui(); }, place: (type, cc, rr) => { if (!free(cc,rr) || towers.some(t=>t.c==cc&&t.r==rr)) return false; towers.push({c:cc,r:rr,type,lvl:5,spent:0,mode:'first',cd:0,heat:0,tg:null,buff:0}); return true; }, spawn: (t, ri) => spawn(t, 0, ri), cast, setGold: v => { gold = v; }, enemiesList: () => enemies, freeCells: () => { const out = []; for (let x=0;x<cols;x++) for (let y=0;y<rows;y++) if (free(x,y)) out.push([x,y]); return out; }};
  return ()=>{ offK(); offL(); A._td = null; };
}});
})();
