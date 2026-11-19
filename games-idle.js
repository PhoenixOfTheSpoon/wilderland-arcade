// Wilderland Arcade · THE MINES — a passive-income merge clicker.
// Hire miners, drag two of the same level together to merge them into a better miner, dig deeper,
// cash ore out for tickets (capped per day). Keeps digging (at half speed) while you're away.
// Learn mode: math geodes are the big payout — crack them by answering the problem.
(function(){
const A = window.Arcade, C = A.C, el = A.el;
const rrect = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const edu = (api,ok) => { try { api.edu && api.edu(ok); } catch(e){} };
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };

const MAXL = 30;
const LV = [null,
  {n:'Pebble Picker',c:'#b8b8b0'}, {n:'Shovel Scout',c:'#c48a4a'}, {n:'Drill Digger',c:'#00B451'}, {n:'Dynamite Dan',c:'#FF4539'},
  {n:'Steam Borer',c:'#64CDF5'}, {n:'Gold Panner',c:'#F9BF01'}, {n:'Laser Miner',c:'#EA55AB'}, {n:'Crystal Crusher',c:'#E9B9F7'},
  {n:'Magma Wrangler',c:'#ff8a3c'}, {n:'Quantum Quarrier',c:'#C7F1EE'}, {n:'Core Tapper',c:'#D5F367'}, {n:'Planet Cracker',c:'#ffffff'}];
['Moon Miner','Comet Catcher','Star Breaker','Nebula Drill','Solar Smelter','Void Digger','Galaxy Grinder','Black-Hole Borer','Time Tunneler','Dimension Delver','Reality Ripper','Cosmic Quarry','Infinity Pick','Big Bang Boss','Multiverse Miner','The Last Miner','Legend of the Deep','Wilderland Titan']
  .forEach((n,i)=>LV.push({n, c:'hsl('+((i*37)%360)+',85%,'+(62+(i%3)*8)+'%)'}));
const lvRate = L => L ? Math.pow(2.5, L-1) : 0;
const DEPTHS = [
  {n:'Topsoil',at:0,a:'#6b4a2b',b:'#4e3520',ore:'#c48a4a'},
  {n:'Clay Bed',at:1e3,a:'#8a5a3c',b:'#62402b',ore:'#e0a36a'},
  {n:'Granite',at:2e4,a:'#6d6f73',b:'#4b4d50',ore:'#d9d9d9'},
  {n:'Iron Vein',at:3e5,a:'#5a4a48',b:'#3d3232',ore:'#d27a5a'},
  {n:'Gold Seam',at:5e6,a:'#4f4636',b:'#352f24',ore:'#F9BF01'},
  {n:'Crystal Cave',at:8e7,a:'#2f3a5a',b:'#1f2740',ore:'#9fd8ff'},
  {n:'Magma Shelf',at:1.5e9,a:'#4a2420',b:'#2e1513',ore:'#ff7a3c'},
  {n:'The Core',at:3e10,a:'#3b1d3f',b:'#241226',ore:'#D5F367'},
  {n:'Mantle Gate',at:1e12,a:'#2a1030',b:'#160818',ore:'#ff4fa0'},
  {n:'Starfall Vein',at:5e13,a:'#101a3a',b:'#070c20',ore:'#ffffff'},
  {n:'Void Cavern',at:3e15,a:'#0b0b14',b:'#000000',ore:'#b48cff'},
  {n:'Planet Heart',at:2e17,a:'#3a2a00',b:'#1c1400',ore:'#ffe14f'}];
// Upgrades go (nearly) forever: costs keep climbing, so there's always something to save for.
const UPS = [
  {id:'pick',  n:'Sharper Pick',  d:'Taps dig more',                    max:999, cost:l=>25*Math.pow(1.55,l)},
  {id:'cart',  n:'Mine Carts',    d:'+25% ore from every miner',        max:999, cost:l=>150*Math.pow(1.7,l)},
  {id:'drill', n:'Deep Charges',  d:'+10% of ALL ore, stacks forever',  max:999, cost:l=>5000*Math.pow(1.45,l)},
  {id:'luck',  n:'Lucky Strike',  d:'+2% chance a tap digs ×25',        max:25,  cost:l=>1000*Math.pow(2,l)},
  {id:'hire',  n:'Better Hires',  d:'New miners start 1 level up',      max:20,  cost:l=>4000*Math.pow(11,l)},
  {id:'night', n:'Night Shift',   d:'+2 h of digging while away',       max:46,  cost:l=>600*Math.pow(2.1,l)},
  {id:'gem',   n:'Gem Sense',     d:'Gems & geodes show up faster',     max:4,   cost:l=>2500*Math.pow(6,l)},
  {id:'auto',  n:'Foreman',       d:'Auto-merges pairs · faster each level', max:10, cost:l=>15000*Math.pow(4,l)},
];
const fmt = n => { n = Math.max(0, n); if (!isFinite(n)) return '∞'; if (n < 10 && n % 1) return n.toFixed(1); if (n < 1000) return String(Math.floor(n));
  const u = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','UDc','DDc','TDc']; if (n >= 1e45) return n.toExponential(2).replace('e+','e');
  let i = -1; while (n >= 1000 && i < u.length-1) { n /= 1000; i++; } return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + u[i]; };
const today = () => { const d = new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };


A.register('idle', { mount(host, api){
  const learn = A.learnOn();
  const fresh = () => ({v:1, ore:0, life:0, grid:[1,0,0,0,0,0,0,0,0,0,0,0], hires:1, up:{}, last:Date.now(), tix:{d:'',n:0}, gems:0, geodes:0, best:1});
  let S = (api.stored && api.stored.v==1) ? JSON.parse(JSON.stringify(api.stored)) : fresh();
  S.up = S.up || {}; S.tix = S.tix || {d:'',n:0}; if (!Array.isArray(S.grid) || S.grid.length!=12) S.grid = fresh().grid;
  const U = k => S.up[k] || 0;

  const wrap = el('div',{width:'480px',fontFamily:A.font,userSelect:'none',background:'#1b130c',borderRadius:'12px',overflow:'hidden',position:'relative'}); host.appendChild(wrap);
  const {c,g,w,h} = A.canvas(wrap,480,500); c.style.borderRadius = '0'; c.style.touchAction = 'none';
  const bar = el('div',{display:'grid',gridTemplateColumns:'1.25fr 1fr 1.25fr',gap:'8px',padding:'8px 10px',background:'#2a1d12'}); wrap.appendChild(bar);
  const mkb = (fn,bg,fg) => { const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',lineHeight:'1.15',border:'none',borderRadius:'14px',padding:'9px 6px',cursor:'pointer',background:bg,color:fg}); x.onclick = e => { e.stopPropagation(); fn(); x.blur(); }; bar.appendChild(x); return x; };
  const bHire = mkb(()=>{ if (sel >= 0 && S.grid[sel]) sellMiner(sel); else hire(); }, C.lime, C.forest), bShop = mkb(()=>openShop(), 'rgba(255,255,255,.14)', '#fff'), bCash = mkb(()=>cashOut(), C.gold, '#2a1d12');

  // ---------- economy ----------
  const depthIdx = () => { let d = 0; DEPTHS.forEach((x,i)=>{ if (S.life >= x.at) d = i; }); return d; };
  const mult = () => (1 + .25*U('cart')) * (1 + .2*depthIdx()) * (1 + .1*U('drill'));
  const rate = () => S.grid.reduce((a,L)=>a+lvRate(L),0) * mult();
  const tapAmt = () => (learn ? 1/3 : 1) * ((2 + 3*U('pick')) + rate()*.03*(1+U('pick')));
  const hireCost = () => Math.ceil(8*Math.pow(1.09, S.hires) * Math.pow(2.5, U('hire')));
  const hireLv = () => Math.min(MAXL-1, 1 + U('hire'));
  const give = n => { S.ore += n; S.life += n; };
  const tixFor = ore => Math.floor(Math.sqrt(ore)/3);
  const score = () => Math.min(99999999, Math.floor(Math.sqrt(S.life)));

  // ---------- effects ----------
  let parts = [], floats = [], shake = 0, sel = -1, drag = null, msg = null, gem = null, gemT = 6 + Math.random()*8, autoT = 6, saveT = 0, t = 0, carts = [0, .5], busy = false, lastDepth = depthIdx();
  const say = (txt, sub, col) => { msg = {txt, sub:sub||'', t:2.2, col:col||C.lime}; };
  const float = (x,y,txt,col) => floats.push({x,y,txt,col:col||'#fff',t:1});
  const burst = (x,y,col,n) => { if (lowFx()) n = Math.min(n, 3); if (parts.length > 140) return; for (let i=0;i<n;i++) { const a = Math.random()*Math.PI*2, s = 60+Math.random()*180; parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,t:.6+Math.random()*.5,col,r:2+Math.random()*3}); } };

  // ---------- layout ----------
  const HUD = 62, ROCK = {x:0,y:HUD,w:480,h:190}, GX = 14, GY = HUD+ROCK.h+12, CW = 108, CH = 70, GAP = 8, COLS = 4;
  const cell = i => ({x:GX + (i%COLS)*(CW+GAP), y:GY + Math.floor(i/COLS)*(CH+GAP)});
  const cellAt = (x,y) => { for (let i=0;i<12;i++) { const p = cell(i); if (x>=p.x && x<=p.x+CW && y>=p.y && y<=p.y+CH) return i; } return -1; };
  const BOULDER = {x:240, y:HUD+92, r:62};
  // Speed: the rock face is drawn once per depth into an offscreen canvas instead of every frame.
  const lowFx = () => !!(A.lowFx || S.calm);
  const bgCache = {};
  const bgFor = di => { if (bgCache[di]) return bgCache[di]; const D = DEPTHS[di], o = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio||1); o.width = w*dpr; o.height = ROCK.h*dpr; const x = o.getContext('2d'); x.scale(dpr,dpr);
    const grd = x.createLinearGradient(0, 0, 0, ROCK.h); grd.addColorStop(0, D.a); grd.addColorStop(1, D.b); x.fillStyle = grd; x.fillRect(0, 0, w, ROCK.h);
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 3; for (let k=0;k<4;k++) { const yy = 30 + k*42; x.beginPath(); for (let xx=0; xx<=w; xx+=20) x.lineTo(xx, yy + Math.sin(xx*.03 + k*1.7)*6); x.stroke(); }
    for (let k=0;k<46;k++) { const sx = (k*97.3)%w, sy = 8 + (k*53.7)%(ROCK.h-40); x.fillStyle = k%5==0 ? D.ore : 'rgba(255,255,255,.07)'; x.beginPath(); x.arc(sx, sy, k%5==0?2.4:1.6, 0, 7); x.fill(); }
    x.fillStyle = '#7a5530'; x.fillRect(18, 0, 12, ROCK.h-30); x.fillRect(w-30, 0, 12, ROCK.h-30); x.fillRect(10, 4, w-20, 10); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(10, 12, w-20, 3);
    [60, w-60].forEach(lx => { x.fillStyle = C.gold; rrect(x, lx-5, 22, 10, 14, 3); x.fill(); });
    return (bgCache[di] = o); };

  // ---------- actions ----------
  const persist = () => { S.last = Date.now(); try { api.store && api.store(S); } catch(e){} };
  const hire = () => { if (busy) return; const cost = hireCost(), i = S.grid.indexOf(0);
    if (i<0) { say('NO ROOM','Merge two matching miners to free a spot', '#ffb3ab'); A.sfx('bad'); return; }
    if (S.ore < cost) { say('NEED '+fmt(cost)+' ORE','Tap the rock to dig faster', '#ffb3ab'); A.sfx('bad'); return; }
    S.ore -= cost; S.hires++; S.grid[i] = hireLv(); const p = cell(i); burst(p.x+CW/2, p.y+CH/2, LV[S.grid[i]].c, 14); A.sfx('coin'); paintBar(); };
  const sellMiner = i => { const L = S.grid[i]; if (!L || busy) return; const v = sellVal(L); S.grid[i] = 0; give(v); S.life -= v; const p = cell(i);
    float(p.x+CW/2, p.y+20, '+'+fmt(v)+' ORE', C.gold); burst(p.x+CW/2, p.y+CH/2, '#FF8A3C', 12); sel = -1; A.sfx('coin'); paintBar(); };
  const merge = (a, b) => { const L = S.grid[a]; if (!L || S.grid[b]!==L || L>=MAXL || a===b) return false;
    S.grid[b] = L+1; S.grid[a] = 0; const p = cell(b); burst(p.x+CW/2, p.y+CH/2, LV[L+1].c, 26); shake = .15; A.sfx('point');
    if (L+1 > (S.best||1)) { S.best = L+1; say('NEW MINER: '+LV[L+1].n.toUpperCase(), fmt(lvRate(L+1)*mult())+' ore/s each', LV[L+1].c); stat(api,'minerLevel',L+1); }
    paintBar(); return true; };
  const moveOrSwap = (a, b) => { if (a===b || a<0 || b<0) return; if (merge(a,b)) return; const t0 = S.grid[b]; S.grid[b] = S.grid[a]; S.grid[a] = t0; A.sfx('flip'); };
  const autoMerge = () => { for (let L=1; L<MAXL; L++) { const idx = S.grid.map((v,i)=>v===L?i:-1).filter(i=>i>=0); if (idx.length>=2) { merge(idx[0], idx[1]); return; } } };
  let combo = 0, comboT = 0, crack = {a:Math.random()*7, r:.6}, gcart = null, gcartT = 35 + Math.random()*30;
  const tapRock = (x,y) => { comboT = .7; combo = Math.min(60, combo+1); const cm = 1 + Math.min(combo,40)*.05;
    const cx = BOULDER.x + Math.cos(crack.a)*BOULDER.r*crack.r, cy = BOULDER.y + Math.sin(crack.a)*BOULDER.r*crack.r*.82, onCrack = Math.hypot(x-cx, y-cy) < 20;
    if (onCrack) { crack = {a:Math.random()*7, r:.3+Math.random()*.5}; float(x, y-46, 'CRACK ×5', '#fff'); A.tone(1100,.06,'square',.04); }
    const lucky = Math.random() < .02*U('luck'), n = tapAmt()*(lucky?25:1)*cm*(onCrack?5:1); give(n); if (lucky) { float(x, y-30, 'LUCKY ×25!', C.gold); A.tone(1400,.08,'triangle',.05); } shake = .12; float(x, y-10, '+'+fmt(n), DEPTHS[depthIdx()].ore); burst(x, y, DEPTHS[depthIdx()].ore, 6); A.tone(180+Math.random()*60,.05,'square',.04); };
  const cashOut = () => { if (busy) return; const can = tixFor(S.ore);
    if (can < 1) { say('NOT ENOUGH ORE','9 ore = 1 ticket · it grows from there', '#ffb3ab'); A.sfx('bad'); return; }
    const n = can, used = S.ore;
    let got = n; try { got = api.tix ? api.tix(n, score(), 'THE MINES') : 0; } catch(e) { got = 0; }
    S.ore -= used; if (S.tix.d != today()) S.tix = {d:today(), n:0}; S.tix.n += n;
    say(got ? '+'+got+' TICKETS' : 'NO TICKETS IN ADMIN MODE', 'Sold '+fmt(used)+' ore', C.gold); A.sfx(got?'win':'blip'); persist(); paintBar(); };
  const crackGeode = () => { if (busy || !gem) return; const gm = gem;
    if (!learn) { const n = Math.max(20, rate()*30); give(n); float(gm.x, gm.y-20, '+'+fmt(n)+' ORE', '#9fd8ff'); burst(gm.x, gm.y, '#9fd8ff', 24); S.gems = (S.gems||0)+1; gem = null; gemT = gemGap(); A.sfx('coin'); return; }
    busy = true; gem = null;
    A.quiz(wrap, 'MATH GEODE · ANSWER TO CRACK IT OPEN', (ok, p) => { busy = false; edu(api, ok);
      if (ok) { const n = Math.max(60, rate()*90); give(n); S.geodes = (S.geodes||0)+1; stat(api,'geodes',1,'add'); float(gm.x, gm.y-20, '+'+fmt(n)+' ORE', C.lime); burst(gm.x, gm.y, '#9fd8ff', 34); say('GEODE CRACKED', '+'+fmt(n)+' ore · '+S.geodes+' solved', C.lime); }
      else say('THE GEODE CRUMBLED', A.solved(p), '#ffb3ab');
      gemT = gemGap(); persist(); }); };
  const gemGap = () => (learn ? 9 : 22 + Math.random()*16) * (1 - .2*U('gem'));

  // ---------- shop overlay ----------
  let shop = null;
  const openShop = () => { if (busy) return; busy = true; A.sfx('blip');
    shop = el('div',{position:'absolute',inset:0,background:'rgba(27,19,12,.97)',zIndex:30,display:'flex',flexDirection:'column',padding:'14px',boxSizing:'border-box',gap:'8px',color:'#fff',overflow:'auto'});
    const head = el('div',{display:'flex',justifyContent:'space-between',alignItems:'center'});
    head.append(el('div',{fontWeight:700,fontSize:'20px',color:C.gold},'Mine Upgrades'));
    const close = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'8px 16px',background:C.lime,color:C.forest,cursor:'pointer'},'Back to digging'); close.onclick = () => { shop.remove(); shop = null; busy = false; };
    head.append(close); shop.append(head);
    const oreLine = el('div',{fontSize:'14px',color:'#EDE9D8'}); shop.append(oreLine);
    const list = el('div',{display:'flex',flexDirection:'column',gap:'8px'}); shop.append(list);
    const render = () => { oreLine.textContent = '⛏ '+fmt(S.ore)+' ore · Upgrades cost ore, not tickets'; list.innerHTML = '';
      UPS.forEach(u => { const l = U(u.id), maxed = l >= u.max, cost = Math.ceil(u.cost(l)), can = !maxed && S.ore >= cost;
        const row = el('div',{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,.07)',borderRadius:'12px',padding:'10px 12px'});
        const txt = el('div',{flex:'1',minWidth:0}); txt.append(el('div',{fontWeight:700,fontSize:'15px'},u.n+'  '), el('div',{fontSize:'12px',color:'#cfc6a8'},u.d+' · level '+l+(u.max<999?'/'+u.max:'')));
        const pips = el('div',{display:'flex',gap:'3px',marginTop:'4px'}); if (u.max<=25) for (let k=0;k<u.max;k++) pips.append(el('div',{width:'10px',height:'5px',borderRadius:'3px',background:k<l?C.gold:'rgba(255,255,255,.18)'})); txt.append(pips);
        const b = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'9px 12px',minWidth:'96px',cursor:can?'pointer':'default',background:maxed?'rgba(255,255,255,.12)':can?C.gold:'rgba(255,255,255,.18)',color:maxed?'#cfc6a8':can?'#2a1d12':'#cfc6a8'}, maxed?'MAXED':fmt(cost)+' ore');
        b.onclick = () => { if (!can) { A.sfx('bad'); return; } S.ore -= cost; S.up[u.id] = l+1; A.sfx('coin'); persist(); render(); paintBar(); };
        row.append(txt, b); list.append(row); });
      const info = el('div',{fontSize:'12px',color:'#cfc6a8',lineHeight:'1.5',marginTop:'4px'});
      info.innerHTML = 'Depth: <b style="color:#fff">'+DEPTHS[depthIdx()].n+'</b> (+'+(depthIdx()*20)+'% ore). Dig more lifetime ore to reach deeper layers.<br>Away from the arcade, your miners keep digging at half speed for up to '+(2+2*U('night'))+' hours.<br>Selling ore: 9 ore = 1 ticket, 900 = 10, 1M = 333 · no daily limit.';
      const calmB = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'13px',border:'none',borderRadius:'999px',padding:'8px 14px',cursor:'pointer',background:'rgba(255,255,255,.14)',color:'#fff',alignSelf:'flex-start'}, 'Pickaxe animation · '+(S.calm?'OFF (smoother)':'ON'));
      calmB.onclick = () => { S.calm = !S.calm; A.sfx('blip'); persist(); render(); }; list.append(calmB, info); };
    render(); wrap.append(shop); };

  // ---------- bottom bar ----------
  const setH = (e,h) => { if (e._h !== h) { e._h = h; e.innerHTML = h; } };
  const sellVal = L => Math.ceil(lvRate(L)*mult()*45);
  const paintBar = () => { const cost = hireCost(), full = S.grid.indexOf(0) < 0;
    if (sel >= 0 && S.grid[sel]) { setH(bHire, '<div>Sell Lv '+S.grid[sel]+' miner</div><div style="font-size:12px;font-weight:600;opacity:.85">+'+fmt(sellVal(S.grid[sel]))+' ore</div>'); bHire.style.background = '#FF8A3C'; bHire.style.opacity = '1'; }
    else { setH(bHire, '<div>Hire miner</div><div style="font-size:12px;font-weight:600;opacity:.85">'+(full?'grid full · merge!':fmt(cost)+' ore · Lv '+hireLv())+'</div>'); bHire.style.background = C.lime; bHire.style.opacity = !full && S.ore >= cost ? '1' : '.6'; }
    setH(bShop, '<div>Upgrades</div><div style="font-size:12px;font-weight:600;opacity:.75">pick · carts · more</div>');
    const n = tixFor(S.ore);
    setH(bCash, '<div>Cash out → '+fmt(n)+' 🎟</div><div style="font-size:12px;font-weight:600;opacity:.8">sells all your ore</div>');
    bCash.style.opacity = n>0 ? '1' : '.6'; };

  // ---------- input ----------
  const pt = e => { const r = c.getBoundingClientRect(); return {x:(e.clientX-r.left)*w/r.width, y:(e.clientY-r.top)*h/r.height}; };
  c.addEventListener('pointerdown', e => { if (busy) return; e.preventDefault(); const p = pt(e);
    if (gcart && Math.hypot(p.x-gcart.x, p.y-(ROCK.y+ROCK.h-30)) < 34) { const n = Math.max(50, rate()*45); give(n); float(gcart.x, ROCK.y+ROCK.h-60, '+'+fmt(n)+' GOLD CART!', C.gold); burst(gcart.x, ROCK.y+ROCK.h-30, C.gold, 30); gcart = null; A.sfx('win'); return; }
    if (gem && Math.hypot(p.x-gem.x, p.y-gem.y) < 30) { crackGeode(); return; }
    if (p.y >= ROCK.y && p.y < ROCK.y+ROCK.h) { tapRock(p.x, p.y); return; }
    const i = cellAt(p.x, p.y); if (i < 0) { sel = -1; return; }
    if (S.grid[i]) { drag = {i, x:p.x, y:p.y, sx:p.x, sy:p.y, moved:false}; try { c.setPointerCapture(e.pointerId); } catch(_){} }
    else if (sel >= 0) { moveOrSwap(sel, i); sel = -1; } });
  c.addEventListener('pointermove', e => { if (!drag) return; const p = pt(e); drag.x = p.x; drag.y = p.y; if (Math.hypot(p.x-drag.sx, p.y-drag.sy) > 8) drag.moved = true; });
  const up = e => { if (!drag) return; const d = drag; drag = null;
    if (d.moved) { const j = cellAt(d.x, d.y); if (j >= 0 && j !== d.i) moveOrSwap(d.i, j); sel = -1; return; }
    if (sel >= 0 && sel !== d.i) { if (S.grid[sel]===S.grid[d.i]) merge(sel, d.i); else moveOrSwap(sel, d.i); sel = -1; } else sel = sel === d.i ? -1 : d.i; A.sfx('blip'); paintBar(); };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', () => { drag = null; });
  const offK = A.keys(e => { if (busy) return false; if (e.key==' ') tapRock(BOULDER.x+(Math.random()-.5)*60, BOULDER.y+(Math.random()-.5)*40); else if (e.key=='h') hire(); else if (e.key=='m') autoMerge(); else return false; });

  // ---------- drawing ----------
  const drawMiner = (x, y, L, s, swing) => { const col = LV[L].c; g.save(); g.translate(x, y); g.scale(s, s);
    // pick
    g.save(); g.translate(10, -6); g.rotate(-.9 + Math.sin(swing)*.8); g.strokeStyle = '#8D5B1D'; g.lineWidth = 3; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-20); g.stroke();
    g.strokeStyle = L>=7 ? col : '#c9ccd1'; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-9,-18); g.quadraticCurveTo(0,-24,9,-18); g.stroke(); g.restore();
    // body
    g.fillStyle = col; rrect(g,-9,-4,18,18,5); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-9,6,18,3);
    g.fillStyle = '#3a2a1c'; g.fillRect(-8,14,6,6); g.fillRect(2,14,6,6);
    // head
    g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(0,-11,7,0,7); g.fill();
    g.fillStyle = '#121313'; g.beginPath(); g.arc(-2.5,-11,1.2,0,7); g.arc(2.5,-11,1.2,0,7); g.fill();
    // helmet + lamp
    g.fillStyle = L>=10 ? '#fff' : C.gold; g.beginPath(); g.arc(0,-13,7.5,Math.PI,0); g.fill(); g.fillRect(-9,-14,18,2.5);
    g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(0,-17,2.3,0,7); g.fill();
    if (L >= 5 && !lowFx()) { g.globalAlpha = .18 + .1*Math.sin(t*4); g.fillStyle = '#fff6b0'; g.beginPath(); g.moveTo(0,-17); g.lineTo(-14,-34); g.lineTo(14,-34); g.fill(); g.globalAlpha = 1; }
    g.restore(); };
  const draw = () => { const D = DEPTHS[depthIdx()], r = rate();
    g.fillStyle = '#1b130c'; g.fillRect(0,0,w,h);
    // ----- rock face -----
    g.save(); if (shake > 0) g.translate((Math.random()-.5)*8*shake/.15, (Math.random()-.5)*6*shake/.15);
    g.drawImage(bgFor(depthIdx()), 0, ROCK.y, w, ROCK.h);
    if (!lowFx()) [60, w-60].forEach(lx => { g.fillStyle = 'rgba(249,191,1,.12)'; g.beginPath(); g.arc(lx, ROCK.y+30, 26+Math.sin(t*3+lx)*2, 0, 7); g.fill(); });
    // boulder
    const B = BOULDER, pulse = lowFx() ? 1 : 1 + Math.sin(t*2)*.015;
    g.save(); g.translate(B.x, B.y); g.scale(pulse, pulse);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, B.r*.78, B.r*.95, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#5b5b60'; g.beginPath(); const pts = 11; for (let k=0;k<pts;k++) { const a = k/pts*Math.PI*2, rr = B.r*(.82 + .18*Math.sin(k*2.3)); g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr*.82); } g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(-16, -20, 26, 14, -.4, 0, 7); g.fill();
    for (let k=0;k<7;k++) { const a = k*0.9, rr = 14 + (k*11)%34; g.fillStyle = D.ore; g.beginPath(); g.moveTo(Math.cos(a)*rr, Math.sin(a)*rr*.8-5); g.lineTo(Math.cos(a)*rr+6, Math.sin(a)*rr*.8); g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr*.8+5); g.lineTo(Math.cos(a)*rr-6, Math.sin(a)*rr*.8); g.fill(); }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(learn ? 'TAP TO DIG · CRACK GEODES FOR BIG ORE' : 'TAP THE ROCK TO DIG', B.x, ROCK.y+ROCK.h-38);
    // track + carts
    const ty = ROCK.y + ROCK.h - 18; g.strokeStyle = '#8D5B1D'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, ty+8); g.lineTo(w, ty+8); g.stroke();
    for (let xx=6; xx<w; xx+=22) { g.fillStyle = '#5a3d1e'; g.fillRect(xx, ty+6, 10, 6); }
    carts.forEach(cp => { const cx = cp*(w+80) - 40; g.fillStyle = '#4b4d50'; rrect(g, cx-18, ty-12, 36, 16, 4); g.fill(); g.fillStyle = D.ore; g.beginPath(); g.ellipse(cx, ty-12, 15, 6, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#121313'; g.beginPath(); g.arc(cx-10, ty+5, 4, 0, 7); g.arc(cx+10, ty+5, 4, 0, 7); g.fill(); });
    { const cx = BOULDER.x + Math.cos(crack.a)*BOULDER.r*crack.r, cy = BOULDER.y + Math.sin(crack.a)*BOULDER.r*crack.r*.82, gl = lowFx() ? .8 : .55+.45*Math.sin(t*8);
      g.strokeStyle = 'rgba(255,255,255,'+gl+')'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx-9,cy-7); g.lineTo(cx-2,cy-1); g.lineTo(cx-5,cy+4); g.lineTo(cx+8,cy+8); g.stroke(); }
    if (combo > 2) { g.fillStyle = C.lime; g.font = '700 14px '+A.font; g.textAlign = 'left'; g.fillText('COMBO '+combo+' · ×'+(1+Math.min(combo,40)*.05).toFixed(2), 40, ROCK.y+ROCK.h-40); }
    if (gcart) { const ty2 = ROCK.y + ROCK.h - 18, gx = gcart.x; g.fillStyle = C.gold; rrect(g, gx-22, ty2-16, 44, 20, 5); g.fill(); g.fillStyle = '#fff6b0'; g.beginPath(); g.ellipse(gx, ty2-16, 18, 7, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#121313'; g.beginPath(); g.arc(gx-12, ty2+5, 4, 0, 7); g.arc(gx+12, ty2+5, 4, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 10px '+A.font; g.textAlign = 'center'; g.fillText('TAP!', gx, ty2-26); }
    // gem / geode
    if (gem) { const gy = gem.y + Math.sin(t*3)*3, gl = .5 + .5*Math.sin(t*6);
      g.fillStyle = 'rgba(159,216,255,'+(.25+.2*gl)+')'; g.beginPath(); g.arc(gem.x, gy, 26, 0, 7); g.fill();
      if (learn) { g.fillStyle = '#6b6f80'; g.beginPath(); g.arc(gem.x, gy, 18, 0, 7); g.fill(); g.fillStyle = '#9fd8ff'; g.beginPath(); g.arc(gem.x+3, gy-2, 11, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.fillText('+−×÷', gem.x+2, gy+4); }
      else { g.fillStyle = '#9fd8ff'; g.beginPath(); g.moveTo(gem.x, gy-16); g.lineTo(gem.x+12, gy-4); g.lineTo(gem.x, gy+14); g.lineTo(gem.x-12, gy-4); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(gem.x, gy-16); g.lineTo(gem.x+4, gy-4); g.lineTo(gem.x-12, gy-4); g.fill(); }
      if (gem.life !== undefined && !learn) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(gem.x, gy, 22, -Math.PI/2, -Math.PI/2 + Math.PI*2*Math.max(0, gem.life/6)); g.stroke(); } }
    g.restore();
    // ----- HUD -----
    g.fillStyle = '#2a1d12'; g.fillRect(0, 0, w, HUD);
    g.textAlign = 'left'; g.fillStyle = C.gold; g.font = '700 28px '+A.font; g.fillText('⛏ '+fmt(S.ore), 14, 34);
    g.fillStyle = '#cfc6a8'; g.font = '600 13px '+A.font; g.fillText('+'+fmt(r)+' ore/s  ·  '+D.n+(depthIdx()?' (+'+depthIdx()*20+'%)':''), 16, 54);
    g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = '700 13px '+A.font; g.fillText(learn ? '◆ '+(S.geodes||0)+' geodes' : '◆ '+(S.gems||0)+' gems', w-14, 26);
    const nd = DEPTHS[depthIdx()+1]; if (nd) { const prev = DEPTHS[depthIdx()].at, f = Math.min(1, (S.life-prev)/(nd.at-prev)); g.fillStyle = 'rgba(255,255,255,.12)'; rrect(g, w-150, 36, 136, 8, 4); g.fill(); g.fillStyle = nd.ore; rrect(g, w-150, 36, 136*f, 8, 4); g.fill();
      g.fillStyle = '#cfc6a8'; g.font = '600 10px '+A.font; g.fillText('NEXT: '+nd.n.toUpperCase(), w-14, 57); }
    else { g.fillStyle = C.lime; g.font = '700 11px '+A.font; g.fillText('DEEPEST LAYER', w-14, 50); }
    // ----- miner grid -----
    g.fillStyle = '#140e08'; g.fillRect(0, GY-8, w, h-GY+8);
    for (let i=0;i<12;i++) { const p = cell(i), L = S.grid[i], dragging = drag && drag.moved && drag.i===i;
      g.fillStyle = L ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.03)'; rrect(g, p.x, p.y, CW, CH, 12); g.fill();
      const canDrop = (drag && drag.moved && drag.i!==i && S.grid[drag.i]===L && L && L<MAXL) || (sel>=0 && sel!==i && S.grid[sel]===L && L && L<MAXL);
      g.lineWidth = canDrop ? 3 : sel===i ? 3 : 1.5; g.strokeStyle = canDrop ? C.lime : sel===i ? '#fff' : L ? LV[L].c+'66' : 'rgba(255,255,255,.08)'; rrect(g, p.x, p.y, CW, CH, 12); g.stroke();
      if (!L) { g.fillStyle = 'rgba(255,255,255,.12)'; g.font = '700 22px '+A.font; g.textAlign = 'center'; g.fillText('+', p.x+CW/2, p.y+CH/2+8); continue; }
      if (dragging) continue;
      drawMiner(p.x+34, p.y+CH/2+6, L, 1.05, lowFx() ? 1.2 : t*6 + i);
      g.textAlign = 'left'; g.fillStyle = LV[L].c; g.font = '700 18px '+A.font; g.fillText(L, p.x+62, p.y+28);
      g.fillStyle = '#cfc6a8'; g.font = '600 10px '+A.font; g.fillText(fmt(lvRate(L)*mult())+'/s', p.x+62, p.y+46);
      if (canDrop) { g.fillStyle = C.lime; g.font = '700 10px '+A.font; g.fillText('MERGE', p.x+62, p.y+60); } }
    if (drag && drag.moved) { const L = S.grid[drag.i]; if (L) { g.globalAlpha = .9; drawMiner(drag.x, drag.y, L, 1.3, t*10); g.globalAlpha = 1; } }
    g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.4)'; g.font = '600 11px '+A.font; g.fillText('Drag matching miners together to merge · tap one to sell it', w/2, h-8);
    // ----- particles / floats / message -----
    parts.forEach(p => { g.globalAlpha = Math.max(0, Math.min(1, p.t*2)); g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }); g.globalAlpha = 1;
    floats.forEach(f => { g.globalAlpha = Math.max(0, f.t); g.fillStyle = f.col; g.font = '700 16px '+A.font; g.textAlign = 'center'; g.fillText(f.txt, f.x, f.y); }); g.globalAlpha = 1;
    if (msg) { g.globalAlpha = Math.min(1, msg.t*2); g.fillStyle = 'rgba(20,14,8,.9)'; rrect(g, 30, ROCK.y+8, w-60, msg.sub?54:36, 14); g.fill(); g.textAlign = 'center';
      g.fillStyle = msg.col; g.font = '700 16px '+A.font; g.fillText(msg.txt, w/2, ROCK.y+31); if (msg.sub) { g.fillStyle = '#EDE9D8'; g.font = '500 13px '+A.font; g.fillText(msg.sub, w/2, ROCK.y+52); } g.globalAlpha = 1; } };

  // ---------- loop ----------
  let barT = 0, scT = 0;
  const offL = A.loop(dt => { t += dt; const r = rate(); if (!busy || shop) give(r*dt);
    shake = Math.max(0, shake-dt); comboT -= dt; if (comboT <= 0) combo = 0;
    gcartT -= dt; if (!gcart && gcartT <= 0) { gcart = {x:-40}; gcartT = 40 + Math.random()*40; A.tone(880,.1,'triangle',.05); } if (gcart) { gcart.x += 110*dt; if (gcart.x > w+40) gcart = null; } carts = carts.map(cp => (cp + dt*(.04 + Math.min(.12, Math.log10(1+r)*.02))) % 1);
    parts.forEach(p => { p.t -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 420*dt; }); parts = parts.filter(p => p.t > 0);
    floats.forEach(f => { f.t -= dt*.9; f.y -= 40*dt; }); floats = floats.filter(f => f.t > 0);
    if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
    if (!gem && !busy) { gemT -= dt; if (gemT <= 0) { gem = {x: 70 + Math.random()*(w-140), y: ROCK.y + 40 + Math.random()*(ROCK.h-90)}; if (Math.abs(gem.x-BOULDER.x)<80) gem.x += gem.x<BOULDER.x ? -80 : 80; if (!learn) gem.life = 6; A.tone(1320,.08,'sine',.05); } }
    if (gem && gem.life !== undefined) { gem.life -= dt; if (gem.life <= 0) { gem = null; gemT = gemGap(); } }
    if (U('auto') && !busy) { autoT -= dt; if (autoT <= 0) { autoT = 6/(1+.6*(U('auto')-1)); autoMerge(); } }
    const d = depthIdx(); if (d > lastDepth) { lastDepth = d; say('YOU REACHED '+DEPTHS[d].n.toUpperCase(), 'All ore +'+d*20+'%', DEPTHS[d].ore); A.sfx('win'); stat(api,'mineDepth',d); }
    barT -= dt; if (barT <= 0) { barT = .4; paintBar(); } scT -= dt; if (scT <= 0) { scT = 1; api.score(Math.floor(S.ore)); }
    saveT -= dt; if (saveT <= 0) { saveT = 10; persist(); }
    draw(); });

  // ---------- offline earnings ----------
  const away = Math.max(0, (Date.now() - (S.last||Date.now()))/1000), cap = (2 + 2*U('night'))*3600, secs = Math.min(away, cap), earned = rate()*secs*.5;
  if (api.stored && secs > 60 && earned >= 1) { give(earned); const hh = Math.floor(secs/3600), mm = Math.floor(secs%3600/60);
    say('WHILE YOU WERE AWAY: +'+fmt(earned)+' ORE', 'Your miners dug for '+(hh?hh+'h ':'')+mm+'m'+(away>cap?' (Night Shift raises the limit)':''), C.gold); A.sfx('win'); }
  else if (!api.stored) say('WELCOME TO THE MINES', learn ? 'Crack math geodes for big ore · merge matching miners' : 'Hire miners · drag matching ones together · sell ore for tickets', C.lime);
  stat(api,'minerLevel',S.best||1); stat(api,'mineDepth',depthIdx());
  paintBar(); persist();
  return () => { persist(); offK(); offL(); if (shop) shop.remove(); };
}});
})();
