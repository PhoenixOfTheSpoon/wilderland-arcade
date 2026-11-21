// Wilderland Arcade · THE MINES — a merge-and-dig mine, 100 layers deep.
// Hire miners, drag two of the same level together to merge them, dig deeper through 12 biomes down to
// Layer 100: The Armageddon Core. The mine is a big world you can pan (drag / arrows / WASD) and zoom (wheel / pinch / + −),
// with tunnels, side caves, hidden treasure rooms, minecarts, hazards and miners working. Only what's on screen is drawn.
// Learn mode: math geodes are the big payout — crack them by answering the problem.
(function(){
const A = window.Arcade, C = A.C, el = A.el;
const rrect = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const edu = (api,ok) => { try { api.edu && api.edu(ok); } catch(e){} };
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const TAU = Math.PI*2;

// Max miner level: 30, and +15% (rounded down) for every Rebirth: 30, 34, 39, 45, 51 …
const maxLevel = rb => { let m = 30; for (let i=0;i<(rb||0) && m < 1000;i++) m = Math.floor(m*1.15); return Math.min(1000, m); };
const ensureLV = n => { while (LV.length <= n) { const i = LV.length; LV.push({n:'Titan Mk '+(i-29), c:'hsl('+((i*53)%360)+',90%,'+(60+(i%3)*8)+'%)'}); } };
const LV = [null,
  {n:'Pebble Picker',c:'#b8b8b0'}, {n:'Shovel Scout',c:'#c48a4a'}, {n:'Drill Digger',c:'#00B451'}, {n:'Dynamite Dan',c:'#FF4539'},
  {n:'Steam Borer',c:'#64CDF5'}, {n:'Gold Panner',c:'#F9BF01'}, {n:'Laser Miner',c:'#EA55AB'}, {n:'Crystal Crusher',c:'#E9B9F7'},
  {n:'Magma Wrangler',c:'#ff8a3c'}, {n:'Quantum Quarrier',c:'#C7F1EE'}, {n:'Core Tapper',c:'#D5F367'}, {n:'Planet Cracker',c:'#ffffff'}];
['Moon Miner','Comet Catcher','Star Breaker','Nebula Drill','Solar Smelter','Void Digger','Galaxy Grinder','Black-Hole Borer','Time Tunneler','Dimension Delver','Reality Ripper','Cosmic Quarry','Infinity Pick','Big Bang Boss','Multiverse Miner','The Last Miner','Legend of the Deep','Wilderland Titan']
  .forEach((n,i)=>LV.push({n, c:'hsl('+((i*37)%360)+',85%,'+(62+(i%3)*8)+'%)'}));
// Ore per miner: ×2.7 per level up to Lv 241, then +50% per level — so numbers stay real (never Infinity) even at Lv 1000.
const BIG = 1e300, fin = v => (v = Number(v), v !== v) ? 0 : v > BIG ? BIG : v < -BIG ? -BIG : v;
const lvRate = L => L ? 3 * Math.pow(2.7, Math.min(L, 241)-1) * (L > 241 ? 1 + (L-241)*.5 : 1) : 0;

// ---------------- 100 LAYERS in 12 biomes ----------------
// fx: drip · dust · lava · snow · spores · sparks · bubbles · gears · embers · stars · void · core
const BIOMES = [
  {id:'soil', a:'#6b4a2b', b:'#4e3520', ore:'#c48a4a', fx:'drip', hz:'Root Snarl', tr:'Old Coin Pouch'},
  {id:'stone',a:'#6d6f73', b:'#4b4d50', ore:'#d9d9d9', fx:'dust', hz:'Loose Rocks', tr:'Iron Lockbox'},
  {id:'crystal',a:'#2f3a5a', b:'#1f2740', ore:'#9fd8ff', fx:'sparks', hz:'Crystal Shard Storm', tr:'Prism Geode'},
  {id:'magma',a:'#4a2420', b:'#2e1513', ore:'#ff7a3c', fx:'lava', hz:'Lava Burst', tr:'Fire Opal'},
  {id:'core', a:'#3b1d3f', b:'#241226', ore:'#D5F367', fx:'embers', hz:'Heat Vent', tr:'Core Ember'},
  {id:'cosmic',a:'#101a3a', b:'#070c20', ore:'#ffffff', fx:'stars', hz:'Gravity Rift', tr:'Star Shard'},
  {id:'ice',  a:'#5a7a94', b:'#2c4458', ore:'#dff6ff', fx:'snow', hz:'Icicle Drop', tr:'Frozen Relic'},
  {id:'fungal',a:'#3a2a4a', b:'#1f1628', ore:'#9fffb0', fx:'spores', hz:'Spore Cloud', tr:'Glowcap Cache'},
  {id:'ruins',a:'#5a5040', b:'#38301f', ore:'#F9BF01', fx:'dust', hz:'Ancient Trap', tr:'Golden Idol'},
  {id:'sunken',a:'#14465a', b:'#0a2a38', ore:'#9fe8ff', fx:'bubbles', hz:'Flood Surge', tr:'Pearl Chest'},
  {id:'clock',a:'#4a3a28', b:'#2a2014', ore:'#ffd23a', fx:'gears', hz:'Runaway Gear', tr:'Clockwork Heart'},
  {id:'dragon',a:'#5a1a10', b:'#2a0a06', ore:'#ffb03a', fx:'embers', hz:'Dragon Breath', tr:'Dragon Hoard'},
  {id:'cathedral',a:'#3a2a6a', b:'#1a1238', ore:'#ff9fe8', fx:'sparks', hz:'Resonance Wave', tr:'Choir Crystal'},
  {id:'rift', a:'#1a0a3a', b:'#06021a', ore:'#b48cff', fx:'stars', hz:'Meteor Shower', tr:'Nebula Pearl'},
  {id:'void', a:'#0b0b14', b:'#000000', ore:'#b48cff', fx:'void', hz:'Void Tendril', tr:'Void Pearl'},
  {id:'armageddon',a:'#3a0606', b:'#120000', ore:'#ff3a1a', fx:'core', hz:'Armageddon Flare', tr:'Heart of the World'},
];
const BI = id => BIOMES.find(b => b.id === id);
// The first 12 layers keep their old names and depths, so every save stays on the same layer.
const OLD = [['Topsoil',0,'soil'],['Clay Bed',1e3,'soil'],['Granite',2e4,'stone'],['Iron Vein',3e5,'stone'],['Gold Seam',5e6,'stone'],['Crystal Cave',8e7,'crystal'],
  ['Magma Shelf',1.5e9,'magma'],['The Core',3e10,'core'],['Mantle Gate',1e12,'core'],['Starfall Vein',5e13,'cosmic'],['Void Cavern',3e15,'cosmic'],['Planet Heart',2e17,'core']];
const NEW = [
  ['ice', ['Frostbite Gallery','Glacier Throat','Rime Hollow','Snowglobe Vault','Permafrost Passage','Aurora Pocket','Blue Ice Bastion','Frozen Waterfall','Yeti Tunnels','The Deep Freeze']],
  ['fungal', ['Mushroom Hollow','Glowcap Grotto','Mycelium Maze','Puffball Plains','Toadstool Terraces','Spore Chapel','Lantern-Shroom Lane','Truffle Trench','Moss Kingdom','The Fungal Heart']],
  ['ruins', ['Forgotten Stairs','Statue Garden','Hall of Echoes','Scribe’s Archive','Sunken Throne Room','Lost Library','Pillar Forest','Mosaic Mines','Tomb of Lanterns','City of Gold']],
  ['sunken', ['Drowned Docks','Coral Caverns','Kelp Chandelier','Pearl Grotto','Barnacle Bay','Shipwreck Shaft','Lighthouse Below','Tidepool Tunnels','Abyssal Aquarium','The Leviathan’s Den']],
  ['clock', ['Gearworks','Steam Galleries','Pendulum Pit','Cog Cathedral','Spring Valley','Brass Labyrinth','Piston Plaza','Clocktower Roots','Tick-Tock Tunnels','The Mainspring']],
  ['dragon', ['Ember Lair','Scale Vaults','Wyrm Wallow','Gold-Heap Hall','Smoke Chimneys','Egg Nursery','Talon Gorge','Molten Mirror','Fire Choir','The Dragon Hoard']],
  ['cathedral', ['Prism Nave','Singing Spires','Rainbow Transept','Shardlight Chapel','Gem Organ','Halo Hall','Crystal Choir','Mirror Crypt','Lumen Belltower','The Grand Cathedral']],
  ['rift', ['Comet Quarry','Orbit Mines','Nebula Seam','Asteroid Burrow','Starlight Chasm','Pulsar Pit','Meteor Gardens','Galaxy Gutters','Supernova Scar','The Event Horizon']],
  ['void', ['The Quiet Dark','Echo Void','Nowhere Narrows','Shadow Lattice','Null Gallery','The Last Light','Edge of Everything']],
  ['armageddon', ['The Armageddon Core']],
];
const DEPTHS = [];
OLD.forEach(([n,at,b]) => DEPTHS.push({n, at, b:BI(b)}));
NEW.forEach(([b, names]) => names.forEach(n => DEPTHS.push({n, at: 2e17*Math.pow(2, DEPTHS.length-11), b:BI(b)})));
const LAST = DEPTHS.length - 1; // 99 → The Armageddon Core

// Upgrades go (nearly) forever: costs keep climbing, so there's always something to save for.
const FORE_MAX = 100, GEM_MAX = 20;
const foreInt = L => L <= 0 ? Infinity : 6 * Math.pow(0.1/6, (Math.min(L,FORE_MAX)-1)/(FORE_MAX-1));  // 6 s at Lv1 → 0.1 s at Lv100
const GEM = [ // what each Gem Sense level adds (shown in the upgrade card)
  '', 'Gems show up 3.5% sooner and glow wider', 'Gems last 0.4 s longer', 'Rare gems can appear (Ruby ×3)', 'Gems show up sooner · wider glow', 'Hidden treasure rooms sparkle on the map and mini-map',
  'Arrow hints point to rare gems', 'Emerald gems can appear (×6)', 'Hazards warn you 3 s earlier and show on the mini-map', 'Gems last longer', 'Diamond gems can appear (×12)',
  'Rare gems more often', 'Sometimes two gems at once', 'Treasure rooms worth +25%', 'Gems last longer · wider glow', 'Treasure rooms worth +50%',
  'Rare gems even more often', 'Hazards are disarmed for double ore', 'Starlight gems can appear (×25)', 'Treasure rooms worth +100%', 'GEM STORM: a burst of 6 gems every 3 minutes'];
const UPS = [
  {id:'pick',  n:'Sharper Pick',  d:'Taps dig more',                    max:999, cost:l=>25*Math.pow(1.55,l)},
  {id:'cart',  n:'Mine Carts',    d:'+25% ore from every miner',        max:999, cost:l=>150*Math.pow(1.7,l)},
  {id:'drill', n:'Deep Charges',  d:'+10% of ALL ore, stacks forever',  max:999, cost:l=>5000*Math.pow(1.45,l)},
  {id:'luck',  n:'Lucky Strike',  d:'+2% chance a tap digs ×10',        max:25,  cost:l=>1000*Math.pow(2,l)},
  {id:'hire',  n:'Better Hires',  d:'New miners start 1 level up (past the top miner level: +15% ore per level)', max:999, cost:l=>4000*Math.pow(11,Math.min(l,20))*Math.pow(3,Math.max(0,l-20))},
  {id:'night', n:'Night Shift',   d:'+2 h of digging while away',       max:46,  cost:l=>600*Math.pow(2.1,l)},
  {id:'gem',   n:'Gem Sense',     d:'', max:GEM_MAX, cost:l=>2500*Math.pow(3.2,l)},
  {id:'auto',  n:'Foreman',       d:'', max:FORE_MAX, cost:l=>15000*Math.pow(1.72,l)},
];
// ---------------- GEM TREE: permanent Mines upgrades bought with gems — never reset by Rebirth ----------------
// Gems: 1 per gem you grab (rare ones give more), 3 per treasure room, 1 per math geode, 5 for a Cave Golem, 100 for the Armageddon Core.
const GT = [
  {k:'slots',  e:'🧱', n:'Bigger Mine',        d:'+4 miner slots',                          max:6,  cost:l=>20*Math.pow(2,l),     fx:l=>(12+4*l)+' slots'},
  {k:'ore',    e:'⚙️', n:'Gem-Powered Drills', d:'+25% ore from everything',                max:20, cost:l=>10*Math.pow(1.45,l),  fx:l=>'×'+(1+.25*l).toFixed(2)+' ore'},
  {k:'vet',    e:'🎖️', n:'Veteran Crew',       d:'New miners are hired 1 level higher',     max:10, cost:l=>30*Math.pow(1.7,l),   fx:l=>'+'+l+' hire levels'},
  {k:'market', e:'🎟', n:'Gem Market',          d:'+10% tickets when you cash out',          max:20, cost:l=>15*Math.pow(1.55,l),  fx:l=>'×'+(1+.1*l).toFixed(1)+' Mines tickets'},
  {k:'magnet', e:'🧲', n:'Gem Magnet',          d:'+10% chance to get double gems',          max:10, cost:l=>12*Math.pow(1.6,l),   fx:l=>(10*l)+'% double gems'},
  {k:'owl',    e:'🦉', n:'Night Owls',          d:'Away digging at 75% speed instead of 50%', max:1,  cost:()=>60,                 fx:l=>l?'75% while away':'50% while away'},
  {k:'boss',   e:'🪨', n:'Golem Tamer',         d:'Bosses drop +50% ore',                    max:5,  cost:l=>25*Math.pow(1.8,l),   fx:l=>'×'+(1+.5*l).toFixed(1)+' boss ore'},
];
// Bulk buy: shares the ×1 / ×10 / ×100 / Max setting with the rest of the arcade
const getQ = () => { try { const v = JSON.parse(localStorage.getItem('wl-prize-qty')); return v === 'max' ? 'max' : (+v || 1); } catch(e) { return 1; } };
const setQ = v => { try { localStorage.setItem('wl-prize-qty', JSON.stringify(v)); } catch(e){} };
const qN = cap => { const q = getQ(); return q === 'max' ? cap : Math.min(cap, q); };
// how many levels of an upgrade you can afford right now (and their total cost)
const plan = (costFn, L, max, bank) => { let n = 0, tot = 0; const want = qN(5000); while (n < want && L+n < max) { const c = Math.min(1e300, Math.ceil(costFn(L+n))); if (tot + c > bank) break; tot += c; n++; } return {n, tot}; };
const fmt = n => { n = Math.max(0, n); if (!isFinite(n)) return '∞'; if (n < 10 && n % 1) return n.toFixed(1); if (n < 1000) return String(Math.floor(n));
  const u = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','UDc','DDc','TDc']; if (n >= 1e45) return n.toExponential(2).replace('e+','e');
  let i = -1; while (n >= 1000 && i < u.length-1) { n /= 1000; i++; } return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + u[i]; };
const sec = s => s >= 1 ? s.toFixed(s >= 10 ? 0 : 1)+' s' : s.toFixed(2)+' s';
const hash = (a, b) => { let h = (a*374761393 + b*668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

A.register('idle', { mount(host, api){
  const MAXL = maxLevel(A.rebirths); ensureLV(MAXL);
  const learn = A.learnOn();
  const fresh = () => ({v:1, ore:0, life:0, grid:[1,0,0,0,0,0,0,0,0,0,0,0], hires:1, up:{}, last:Date.now(), tix:{d:'',n:0}, gems:0, geodes:0, best:1});
  let S = (api.stored && api.stored.v==1) ? JSON.parse(JSON.stringify(api.stored)) : fresh();
  // miners above today's level cap (from older versions) keep their level and still get drawn
  if (Array.isArray(S.grid)) ensureLV(Math.max(MAXL, ...S.grid.map(v => v|0)));
  S.up = S.up || {}; S.tix = S.tix || {d:'',n:0}; S.chests = S.chests || {}; S.gtree = S.gtree || {}; if (!Array.isArray(S.grid) || !S.grid.length) S.grid = fresh().grid;
  if (S.gemBank == null) S.gemBank = (S.gems||0) + (S.geodes||0);   // gems you already found count toward the Gem Tree
  const GL2 = k => S.gtree[k] || 0, SLOTS = () => 12 + 4*GL2('slots');
  while (S.grid.length < SLOTS()) S.grid.push(0);
  const addGems = (n, x, y) => { if (Math.random() < .1*GL2('magnet') + (A.petGems||0)) n *= 2; S.gemBank = (S.gemBank||0) + n; if (x != null) float(x, y-40, '+'+n+' 💎', '#bff0ff'); };
  // repair saves that overflowed to Infinity / NaN before this fix
  { const F = v => (v = Number(v), v !== v) ? 0 : v > 1e300 ? 1e300 : v < 0 ? 0 : v; S.ore = F(S.ore); S.life = F(S.life); S.gemBank = S.gemBank == null ? S.gemBank : F(S.gemBank); }
  const U = k => S.up[k] || 0; let codeMsg = '';

  const W = 480; let H = 610;
  const wrap = el('div',{width:W+'px',fontFamily:A.font,userSelect:'none',background:'#1b130c',borderRadius:'12px',overflow:'hidden',position:'relative'}); host.appendChild(wrap);
  let {c,g,w,h} = A.canvas(wrap,W,H); c.style.borderRadius = '0'; c.style.touchAction = 'none';
  const bar = el('div',{display:'grid',gridTemplateColumns:'1.25fr 1fr 1.25fr',gap:'8px',padding:'8px 10px',background:'#2a1d12'}); wrap.appendChild(bar);
  const mkb = (fn,bg,fg) => { const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',lineHeight:'1.15',border:'none',borderRadius:'14px',padding:'9px 6px',cursor:'pointer',background:bg,color:fg}); x.onclick = e => { e.stopPropagation(); fn(); x.blur(); }; bar.appendChild(x); return x; };
  const bHire = mkb(()=>{ if (sel >= 0 && S.grid[sel]) sellMiner(sel); else hire(); }, C.lime, C.forest), bShop = mkb(()=>openShop(), 'rgba(255,255,255,.14)', '#fff'), bCash = mkb(()=>cashOut(), C.gold, '#2a1d12');

  // ---------- economy ----------
  const depthIdx = () => { let d = 0; for (let i=0;i<DEPTHS.length;i++) if (S.life >= DEPTHS[i].at) d = i; return d; };
  const extraStart = () => Math.max(0, 1 + U('hire') + A.U('start') + GL2('vet') - (MAXL-1));
  const mult = () => (1 + .25*GL2('ore')) * (1 + .25*U('cart')) * (1 + .2*depthIdx()) * (1 + .1*U('drill')) * (1 + .15*extraStart());
  const minerCount = () => S.grid.reduce((a,L)=>a+(L?1:0),0);
  let trouble = 0;   // a hazard went off: miners dig at half speed for a few seconds
  const rate = () => S.grid.reduce((a,L)=>a+lvRate(L),0) * mult() * (trouble > 0 ? .5 : 1);
  // A tap always digs at least 10% of what the next miner costs, so nobody gets stuck with no miners and a huge hire price.
  const tapAmt = () => Math.max(.1*hireCost(), (learn ? 1/3 : 1) * ((1 + 2*U('pick')) + rate()*.01*(1+.1*U('pick'))));
  const hireCost = () => Math.min(BIG, Math.ceil(8*Math.pow(1.09, S.hires) * Math.pow(2.5, Math.min(U('hire'), 60)) * Math.pow(.85, A.U('cheap'))));
  const hireLv = () => Math.min(MAXL-1, 1 + U('hire') + A.U('start') + GL2('vet'));
  let rushT = 0, golem = null, golemT = 110 + Math.random()*60, core = null;
  const give = n => { n = fin(n); if (rushT > 0) n *= 3; S.ore = fin(S.ore + n); S.life = fin(S.life + n); };
  const tixFor = ore => Math.floor(Math.sqrt(fin(ore))/3);
  const score = () => Math.min(99999999, Math.floor(Math.sqrt(S.life)));

  // ---------- effects ----------
  let parts = [], floats = [], shake = 0, sel = -1, drag = null, msg = null, gems = [], gemT = 6 + Math.random()*8, autoAcc = 0, saveT = 0, t = 0, busy = false, lastDepth = depthIdx(), sellArm = 0;
  let hazard = null, hazardT = 70 + Math.random()*50, stormT = 180;
  const say = (txt, sub, col) => { msg = {txt, sub:sub||'', t:2.4, col:col||C.lime}; };
  const float = (x,y,txt,col) => { if (floats.length < 30) floats.push({x,y,txt,col:col||'#fff',t:1}); };
  const burst = (x,y,col,n) => { if (lowFx()) n = Math.min(n, 3); if (parts.length > 140) return; for (let i=0;i<n;i++) { const a = Math.random()*TAU, s = 60+Math.random()*180; parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,t:.6+Math.random()*.5,col,r:2+Math.random()*3}); } };

  // ---------- layout ----------
  const HUD = 62, VIEW = {x:0, y:HUD, w:W, h:270}, GX = 14, GY = HUD+VIEW.h+12, GAP = 8; let CW = 108, CH = 70, COLS = 4;
  // More slots → more columns and a taller cabinet (the canvas grows; nothing gets squashed).
  const relayout = () => { const n = S.grid.length; COLS = n <= 16 ? 4 : 6; CW = (W - 2*GX - GAP*(COLS-1)) / COLS; CH = COLS == 4 ? 70 : 62;
    const nh = GY + Math.ceil(n/COLS)*(CH+GAP) + 18; if (nh !== H) { H = nh; h = nh; const dpr = window.devicePixelRatio||1; c.height = nh*dpr; c.style.height = nh+'px'; g.setTransform(dpr,0,0,dpr,0,0); } };
  relayout();
  const cell = i => ({x:GX + (i%COLS)*(CW+GAP), y:GY + Math.floor(i/COLS)*(CH+GAP)});
  const cellAt = (x,y) => { for (let i=0;i<S.grid.length;i++) { const p = cell(i); if (x>=p.x && x<=p.x+CW && y>=p.y && y<=p.y+CH) return i; } return -1; };
  const lowFx = () => !!(A.lowFx || S.calm);

  // ---------- the world: 100 layers stacked, each a wide band with tunnels, caves and a hidden room ----------
  const WW = 1200, LH = 210, TUN = .52;   // world width, layer height, tunnel height (fraction of the layer)
  const tunY = i => i*LH + LH*TUN;
  const DIGX = WW - 150;                   // the dig face sits at the right end of the deepest tunnel
  const shaftX = i => 120 + Math.floor(hash(i, 7) * (WW - 420));
  const caves = i => [0,1].map(k => ({x: 120 + hash(i, 11+k)*(WW-360), y: i*LH + (k ? LH*.82 : LH*.2), rx: 46 + hash(i,21+k)*40, ry: 20 + hash(i,31+k)*10}));
  const room = i => ({x: 140 + hash(i, 41)*(WW-420), y: i*LH + (hash(i,43) < .5 ? LH*.12 : LH*.74), w: 74, h: 40});
  const layerCache = new Map();
  const layerTex = i => { if (layerCache.has(i)) { const v = layerCache.get(i); layerCache.delete(i); layerCache.set(i, v); return v; }
    const D = DEPTHS[i], B = D.b, o = document.createElement('canvas'), sc = .5; o.width = WW*sc; o.height = LH*sc; const x = o.getContext('2d'); x.scale(sc, sc);
    const gr = x.createLinearGradient(0,0,0,LH); gr.addColorStop(0,B.a); gr.addColorStop(1,B.b); x.fillStyle = gr; x.fillRect(0,0,WW,LH);
    // strata + texture
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 3; for (let k=0;k<4;k++) { const yy = 18 + k*50; x.beginPath(); for (let xx=0; xx<=WW; xx+=24) x.lineTo(xx, yy + Math.sin(xx*.02 + k*1.7 + i)*7); x.stroke(); }
    for (let k=0;k<160;k++) { const sx = hash(i*7+k, 3)*WW, sy = hash(i*13+k, 5)*LH; x.fillStyle = k%9==0 ? B.ore : (k%2 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.12)'); x.beginPath(); x.arc(sx, sy, k%9==0 ? 3 : 1.5+hash(k,i)*2, 0, TAU); x.fill(); }
    // biome decorations
    for (let k=0;k<10;k++) { const sx = hash(i, 50+k)*WW, sy = hash(i, 60+k)*LH; x.fillStyle = B.ore; x.globalAlpha = .55;
      if (B.id=='crystal' || B.id=='cathedral' || B.id=='ice') { x.beginPath(); x.moveTo(sx, sy-14); x.lineTo(sx+6, sy); x.lineTo(sx, sy+8); x.lineTo(sx-6, sy); x.fill(); }
      else if (B.id=='fungal') { x.fillStyle = '#e8e0ff'; x.fillRect(sx-1.5, sy, 3, 9); x.fillStyle = B.ore; x.beginPath(); x.arc(sx, sy, 7, Math.PI, 0); x.fill(); }
      else if (B.id=='clock') { x.strokeStyle = B.ore; x.lineWidth = 3; x.beginPath(); x.arc(sx, sy, 10, 0, TAU); x.stroke(); for (let q=0;q<8;q++) { const a = q*Math.PI/4; x.fillRect(sx+Math.cos(a)*11-2, sy+Math.sin(a)*11-2, 4, 4); } }
      else if (B.id=='ruins') { x.fillStyle = 'rgba(255,240,200,.25)'; x.fillRect(sx-8, sy-20, 16, 30); x.fillRect(sx-11, sy-22, 22, 4); }
      else if (B.id=='sunken') { x.fillStyle = 'rgba(159,232,255,.35)'; x.beginPath(); x.arc(sx, sy, 4, 0, TAU); x.fill(); }
      else { x.beginPath(); x.arc(sx, sy, 3, 0, TAU); x.fill(); } x.globalAlpha = 1; }
    // side caves (hollows with glowing ore)
    caves(i).forEach(cv => { const yy = cv.y - i*LH; x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(cv.x, yy, cv.rx, cv.ry, 0, 0, TAU); x.fill(); x.fillStyle = B.ore; for (let q=0;q<4;q++) { x.beginPath(); x.arc(cv.x - cv.rx*.6 + q*cv.rx*.4, yy + cv.ry*.5, 2.5, 0, TAU); x.fill(); } });
    // main tunnel with timber supports
    const ty = LH*TUN; x.fillStyle = 'rgba(10,6,3,.62)'; x.fillRect(0, ty-30, WW, 56); x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(0, ty-30, WW, 3);
    x.fillStyle = '#6b4a2b'; for (let xx=40; xx<WW; xx+=160) { x.fillRect(xx, ty-30, 7, 56); x.fillRect(xx-8, ty-32, 23, 6); }
    // track
    x.strokeStyle = '#8D5B1D'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, ty+22); x.lineTo(WW, ty+22); x.stroke(); x.fillStyle = '#4a2f18'; for (let xx=4; xx<WW; xx+=18) x.fillRect(xx, ty+20, 9, 5);
    // shaft down to the next layer + a ladder
    const sx = shaftX(i); x.fillStyle = 'rgba(10,6,3,.62)'; x.fillRect(sx-20, ty+26, 40, LH-ty-26); x.strokeStyle = '#8D5B1D'; x.lineWidth = 2; x.beginPath(); x.moveTo(sx-10, ty+26); x.lineTo(sx-10, LH); x.moveTo(sx+10, ty+26); x.lineTo(sx+10, LH); x.stroke(); for (let yy = ty+34; yy < LH; yy += 12) { x.beginPath(); x.moveTo(sx-10, yy); x.lineTo(sx+10, yy); x.stroke(); }
    if (i > 0) { const px = shaftX(i-1); x.fillStyle = 'rgba(10,6,3,.62)'; x.fillRect(px-20, 0, 40, ty-28); }
    // hidden room frame
    const rm = room(i), ry = rm.y - i*LH; x.fillStyle = 'rgba(20,12,6,.7)'; rrect(x, rm.x, ry, rm.w, rm.h, 6); x.fill(); x.strokeStyle = 'rgba(255,220,150,.25)'; x.lineWidth = 2; rrect(x, rm.x, ry, rm.w, rm.h, 6); x.stroke();
    // layer label plate
    x.fillStyle = 'rgba(0,0,0,.35)'; rrect(x, 14, 10, 260, 30, 8); x.fill(); x.fillStyle = '#fff'; x.font = '700 15px '+A.font; x.fillText('LAYER '+(i+1)+' · '+D.n.toUpperCase(), 24, 31);
    layerCache.set(i, o); if (layerCache.size > 10) layerCache.delete(layerCache.keys().next().value); return o; };

  // ---------- camera (pan / zoom) ----------
  const cam = {x: DIGX - 260, y: tunY(depthIdx()) - VIEW.h*.55, z: 1}, camT = {x:cam.x, y:cam.y, z:1};
  let follow = true;
  const clampCam = q => { const vw = VIEW.w/q.z, vh = VIEW.h/q.z; q.x = Math.max(-40, Math.min(WW - vw + 40, q.x)); q.y = Math.max(-40, Math.min((LAST+1)*LH - vh + 40, q.y)); };
  const focusDig = () => { const d = depthIdx(); camT.x = DIGX - VIEW.w/camT.z*.62; camT.y = tunY(d) - VIEW.h/camT.z*.55; clampCam(camT); follow = true; };
  const zoomAt = (f, sx, sy) => { const nz = Math.max(.25, Math.min(2.2, camT.z*f)); const wx = camT.x + (sx-VIEW.x)/camT.z, wy = camT.y + (sy-VIEW.y)/camT.z; camT.z = nz; camT.x = wx - (sx-VIEW.x)/nz; camT.y = wy - (sy-VIEW.y)/nz; clampCam(camT); follow = false; };
  const toWorld = (sx, sy) => ({x: cam.x + (sx-VIEW.x)/cam.z, y: cam.y + (sy-VIEW.y)/cam.z});
  const toScreen = (wx, wy) => ({x: VIEW.x + (wx-cam.x)*cam.z, y: VIEW.y + (wy-cam.y)*cam.z});
  focusDig(); Object.assign(cam, camT);

  // ---------- actions ----------
  const persist = () => { S.last = Date.now(); try { api.store && api.store(S); } catch(e){} };
  const hire = () => { if (busy) return; const want = qN(S.grid.length); let k = 0; while (k < want && S.grid.indexOf(0) >= 0 && S.ore >= hireCost()) { hireOne(true); k++; } if (k > 1) { say('HIRED '+k+' MINERS', 'Buy amount: '+(getQ()==='max'?'Max':'×'+getQ())+' · change it in Upgrades', C.lime); paintBar(); return; } if (k == 1) return; hireOne(); };
  const hireOne = quiet => { const cost = hireCost(), i = S.grid.indexOf(0);
    if (i<0) { say('NO ROOM','Merge two matching miners to free a spot', '#ffb3ab'); A.sfx('bad'); return; }
    if (S.ore < cost) { say('NEED '+fmt(cost)+' ORE','Tap the dig face to dig faster', '#ffb3ab'); A.sfx('bad'); return; }
    S.ore -= cost; S.hires++; S.grid[i] = hireLv(); const p = cell(i); burst(p.x+CW/2, p.y+CH/2, LV[S.grid[i]].c, 14); A.sfx('coin'); paintBar(); };
  const sellMiner = i => { const L = S.grid[i]; if (!L || busy) return;
    if (minerCount() == 1 && !(sellArm > 0)) { sellArm = 3; say('THAT’S YOUR LAST MINER!', 'Without miners you can’t cash out · tap Sell again to sell anyway', '#ffb3ab'); A.sfx('bad'); paintBar(); return; }
    sellArm = 0; const v = fin(sellVal(L)); S.grid[i] = 0; S.ore = fin(S.ore + v); const p = cell(i);
    float(p.x+CW/2, p.y+20, '+'+fmt(v)+' ORE', C.gold); burst(p.x+CW/2, p.y+CH/2, '#FF8A3C', 12); sel = -1; A.sfx('coin'); paintBar(); };
  let quietMerges = 0;
  const merge = (a, b, quiet) => { const L = S.grid[a]; if (L+1 >= LV.length) ensureLV(L+1); if (!L || S.grid[b]!==L || L>=MAXL || a===b) return false;
    S.grid[b] = L+1; S.grid[a] = 0; const p = cell(b);
    if (!quiet || (quietMerges++ % 6 == 0)) { burst(p.x+CW/2, p.y+CH/2, LV[L+1].c, quiet ? 6 : 26); if (!quiet) { shake = .15; A.sfx('point'); } else A.tone(700,.02,'square',.015); }
    if (L+1 > (S.best||1)) { S.best = L+1; say('NEW MINER: '+LV[L+1].n.toUpperCase(), fmt(lvRate(L+1)*mult())+' ore/s each', LV[L+1].c); stat(api,'minerLevel',L+1); }
    return true; };
  const moveOrSwap = (a, b) => { if (a===b || a<0 || b<0) return; if (merge(a,b)) { paintBar(); return; } const t0 = S.grid[b]; S.grid[b] = S.grid[a]; S.grid[a] = t0; A.sfx('flip'); };
  // Foreman: finds the lowest matching pair with one quick scan (no array building) — cheap enough for 10 merges a second.
  const autoMerge = quiet => { const first = new Array(MAXL+1).fill(-1); for (let i=0;i<S.grid.length;i++) { const L = S.grid[i]; if (!L || L>=MAXL) continue; if (first[L] >= 0) return merge(first[L], i, quiet); first[L] = i; } return false; };
  const comboMult = () => Math.min(3, 1 + combo*.05);   // tap combo tops out at ×3
  let combo = 0, comboT = 0, crack = {a:Math.random()*7, r:.6}, gcart = null, gcartT = 35 + Math.random()*30;
  const digPoint = () => { const d = depthIdx(); return {x: DIGX + 40, y: tunY(d) - 4}; };
  const tapRock = (sx, sy) => { comboT = .7; combo = Math.min(40, combo+1); const cm = comboMult();
    const boss = core || golem;
    if (boss) { const d = tapAmt()*cm*(1 + .1*U('pick')); boss.hp -= d; boss.hit = .12; boss.idle = 0; shake = .1; burst(sx, sy, core ? '#ff3a1a' : '#c9ccd1', 5); A.tone(core ? 70+Math.random()*30 : 140+Math.random()*40,.05,'square',.04); float(sx, sy-16, '-'+fmt(d), '#ffb3ab');
      if (boss.hp <= 0) bossDown(); return; }
    const dp = toScreen(digPoint().x, digPoint().y), cx = dp.x + Math.cos(crack.a)*40*crack.r*cam.z, cy = dp.y + Math.sin(crack.a)*34*crack.r*cam.z, onCrack = Math.hypot(sx-cx, sy-cy) < 18;
    if (onCrack) { crack = {a:Math.random()*7, r:.3+Math.random()*.6}; float(sx, sy-46, 'CRACK ×3', '#fff'); A.tone(1100,.06,'square',.04); }
    const lucky = Math.random() < .02*U('luck'), n = tapAmt()*(lucky?10:1)*cm*(onCrack?3:1); give(n); if (lucky) { float(sx, sy-30, 'LUCKY ×10!', C.gold); A.tone(1400,.08,'triangle',.05); }
    shake = .12; float(sx, sy-10, '+'+fmt(n), DEPTHS[depthIdx()].b.ore); burst(sx, sy, DEPTHS[depthIdx()].b.ore, 6); A.tone(180+Math.random()*60,.05,'square',.04); };
  const bossDown = () => {
    if (core) { const n = Math.max(1e6, rate()*3000 + tapAmt()*5000) * (1+.5*GL2('boss')); give(n); addGems(100); S.coreCleared = Date.now(); stat(api,'mineCore',1,'add'); A.sfx('win'); [0,300,600].forEach(d => setTimeout(()=>A.sfx('win'), d));
      rushT = 120; say('THE ARMAGEDDON CORE IS CALM!', '+'+fmt(n)+' ore · Layer 100 cleared · GOLD RUSH ×3 for 2 minutes', C.gold); core = null; shake = .6; for (let k=0;k<4;k++) burst(W/2 + (k-1.5)*80, VIEW.y+VIEW.h/2, ['#ff3a1a','#F9BF01','#fff','#ff9f3a'][k], 30); persist(); return; }
    const n = Math.max(500, rate()*150 + tapAmt()*250) * (1+.5*GL2('boss')); give(n); addGems(5); S.golems = (S.golems||0)+1; stat(api,'mineGolem',1,'add'); A.sfx('win');
    rushT = 30; say('CAVE GOLEM DEFEATED!', '+'+fmt(n)+' ore · +5 💎 · GOLD RUSH: all ore ×3 for 30 s', C.gold); golem = null; golemT = 140 + Math.random()*80; };
  const cashOut = () => { if (busy) return; if (!minerCount()) { say('YOU NEED AT LEAST ONE MINER TO CASH OUT', 'Hire a miner first (or try the code MINERRESCUE in Upgrades)', '#ffb3ab'); A.sfx('bad'); return; }
    const can = tixFor(S.ore);
    if (can < 1) { say('NOT ENOUGH ORE','9 ore = 1 ticket · it grows from there', '#ffb3ab'); A.sfx('bad'); return; }
    // The Mines ticket counter refills over time, so ore can't jump you straight to a Rebirth; leftover ore stays in the mine.
    const cap = api.tixCap ? Math.floor(api.tixCap() / (1+.1*GL2('market'))) : can;
    if (cap < 1) { const w = api.tixWait ? api.tixWait() : 60; say('TICKET COUNTER IS FULL', 'It refills in about '+w+' s · your ore is safe and keeps piling up', '#ffb3ab'); A.sfx('bad'); return; }
    const n = Math.min(can, cap), used = n >= can ? S.ore : Math.min(S.ore, Math.pow(3*(n+1), 2));
    let got = n; try { got = api.tix ? api.tix(Math.floor(n*(1+.1*GL2('market'))), score(), 'THE MINES') : 0; } catch(e) { got = 0; }
    S.ore -= used; const td = new Date().toISOString().slice(0,10); if (S.tix.d != td) S.tix = {d:td, n:0}; S.tix.n += n;
    say(got ? '+'+got+' TICKETS' : 'NO TICKETS IN ADMIN MODE', 'Sold '+fmt(used)+' ore', C.gold); A.sfx(got?'win':'blip'); persist(); paintBar(); };
  // gems: Gem Sense makes them come sooner, last longer, glow wider and sometimes be rare
  const GL = () => U('gem');
  const gemGap = () => (learn ? 9 : 22 + Math.random()*16) * Math.max(.3, 1 - .035*GL());
  const gemLife = () => 6 + .4*GL() + (GL()>=9 ? 2 : 0) + (GL()>=14 ? 2 : 0);
  const rollRare = () => { const L = GL(), boost = (L>=11 ? 1.5 : 1) * (L>=16 ? 1.5 : 1); const r = Math.random();
    if (L>=18 && r < .02*boost) return {k:'Starlight', m:25, c:'#ffffff'}; if (L>=10 && r < .05*boost) return {k:'Diamond', m:12, c:'#bff0ff'};
    if (L>=7 && r < .1*boost) return {k:'Emerald', m:6, c:'#2fe08a'}; if (L>=3 && r < .18*boost) return {k:'Ruby', m:3, c:'#ff4a6a'}; return null; };
  const spawnGem = () => { const d = depthIdx(), y0 = d*LH; let x = 120 + Math.random()*(WW-300), y = y0 + 20 + Math.random()*(LH-60);
    if (Math.abs(y - tunY(d)) < 34) y += 50; gems.push({x, y, life: learn ? undefined : gemLife(), rare: learn ? null : rollRare()}); A.tone(1320,.08,'sine',.05); };
  const takeGem = gm => { gems = gems.filter(x => x !== gm); const sp = toScreen(gm.x, gm.y);
    if (!learn) { const n = Math.max(20, rate()*30) * (gm.rare ? gm.rare.m : 1); give(n); float(sp.x, sp.y-20, '+'+fmt(n)+' ORE'+(gm.rare?' · '+gm.rare.k.toUpperCase():''), gm.rare ? gm.rare.c : '#9fd8ff'); burst(sp.x, sp.y, gm.rare ? gm.rare.c : '#9fd8ff', gm.rare ? 34 : 24); S.gems = (S.gems||0)+1; addGems(gm.rare ? ({Ruby:2, Emerald:3, Diamond:5, Starlight:10})[gm.rare.k] : 1, sp.x, sp.y); if (!gems.length) gemT = gemGap(); A.sfx('coin'); return; }
    busy = true;
    A.quiz(wrap, 'MATH GEODE · ANSWER TO CRACK IT OPEN', (ok, p) => { busy = false; edu(api, ok);
      if (ok) { const n = Math.max(60, rate()*90); give(n); S.geodes = (S.geodes||0)+1; addGems(1, sp.x, sp.y); stat(api,'geodes',1,'add'); float(sp.x, sp.y-20, '+'+fmt(n)+' ORE', C.lime); burst(sp.x, sp.y, '#9fd8ff', 34); say('GEODE CRACKED', '+'+fmt(n)+' ore · '+S.geodes+' solved', C.lime); }
      else say('THE GEODE CRUMBLED', A.solved(p), '#ffb3ab');
      gemT = gemGap(); persist(); }); };
  // hidden treasure rooms (one per layer, once each)
  const openChest = i => { if (S.chests[i] || i > depthIdx()) return; S.chests[i] = 1; const L = GL(), bonus = (L>=13?1.25:1)*(L>=15?1.2:1)*(L>=19?1.33:1);
    const n = Math.max(200, rate()*90*(1 + i*.04)) * bonus; give(n); const rm = room(i), sp = toScreen(rm.x+rm.w/2, rm.y+rm.h/2);
    float(sp.x, sp.y-24, '+'+fmt(n)+' · '+DEPTHS[i].b.tr.toUpperCase(), C.gold); addGems(3, sp.x, sp.y-20); burst(sp.x, sp.y, C.gold, 30); A.sfx('win'); stat(api,'mineChests',1,'add'); persist(); };
  // hazards appear on the deepest layer — tap to disarm before the fuse runs out
  const spawnHazard = () => { const d = depthIdx(), B = DEPTHS[d].b; hazard = {x: 200 + Math.random()*(WW-500), y: tunY(d) - 50 + Math.random()*40, fuse: 7 + (GL()>=8 ? 3 : 0), max: 7 + (GL()>=8 ? 3 : 0), n: B.hz};
    say('⚠ '+B.hz.toUpperCase()+'!', 'Tap it before it goes off — or your miners slow down for a bit', '#ffb3ab'); A.sfx('bad'); };
  const disarm = () => { const sp = toScreen(hazard.x, hazard.y), n = Math.max(30, rate()*12) * (GL()>=17 ? 2 : 1); give(n); float(sp.x, sp.y-20, 'DISARMED +'+fmt(n), C.lime); burst(sp.x, sp.y, C.lime, 16); A.sfx('coin'); hazard = null; hazardT = 70 + Math.random()*60; };

  // ---------- shop overlay ----------
  let shop = null, shopQ = null, shopRender = null, gemRender = null, gemQ = null;
  const rerenderAll = () => { if (shopQ) shopQ(); if (shopRender) shopRender(); if (gemQ) gemQ(); if (gemRender) gemRender(); paintBar(); };
  const upDesc = (u, l) => { if (u.id=='auto') return l ? 'Auto-merges a matching pair every '+sec(foreInt(l))+(l<FORE_MAX ? ' · next level: every '+sec(foreInt(l+1)) : ' · max speed!') : 'Auto-merges matching miners · Lv1 merges every 6 s · Lv100 every 0.1 s';
    if (u.id=='gem') return (l ? 'Now: '+GEM.slice(1, l+1).filter((x,i)=>i>=Math.max(0,l-2)).join(' · ') : 'Better gems, treasure and hazard warnings')+(l<GEM_MAX ? ' · Next (Lv '+(l+1)+'): '+GEM[l+1] : ' · All 20 levels unlocked!');
    return u.d; };
  const openShop = () => { if (busy) return; busy = true; A.sfx('blip');
    shop = el('div',{position:'absolute',inset:0,background:'rgba(27,19,12,.97)',zIndex:30,display:'flex',flexDirection:'column',padding:'14px',boxSizing:'border-box',gap:'8px',color:'#fff',overflow:'auto'});
    const head = el('div',{display:'flex',justifyContent:'space-between',alignItems:'center'});
    head.append(el('div',{fontWeight:700,fontSize:'20px',color:C.gold},'Mine Upgrades'));
    const close = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'8px 16px',background:C.lime,color:C.forest,cursor:'pointer'},'Back to digging'); close.onclick = () => { shop.remove(); shop = null; shopQ = shopRender = null; busy = false; };
    const gemB = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'8px 14px',background:'#64CDF5',color:'#06324a',cursor:'pointer'},'💎 Gem Tree'); gemB.onclick = () => openGemTree();
    const hb = el('div',{display:'flex',gap:'6px'}); hb.append(gemB, close); head.append(hb); shop.append(head);
    const oreLine = el('div',{fontSize:'14px',color:'#EDE9D8'}); shop.append(oreLine);
    const qRow = () => { const r = el('div',{display:'flex',gap:'5px',alignItems:'center',flexWrap:'wrap'}); r.append(el('span',{fontSize:'12px',fontWeight:700,color:C.gold},'BUY'));
      [1,10,100,'max'].forEach(v => { const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'12px',border:'1.5px solid '+C.gold,borderRadius:'999px',padding:'4px 10px',cursor:'pointer',background:getQ()===v?C.gold:'transparent',color:getQ()===v?'#2a1d12':C.gold}, v==='max'?'Max':'×'+v); x.onclick = () => { setQ(v); A.sfx('blip'); rerenderAll(); }; r.append(x); });
      r.append(el('span',{fontSize:'11px',color:'#cfc6a8'},'upgrades · Gem Tree · hiring')); return r; };
    const qHolder = el('div'); qHolder.append(qRow()); shop.append(qHolder); shopQ = () => { qHolder.innerHTML = ''; qHolder.append(qRow()); };
    const list = el('div',{display:'flex',flexDirection:'column',gap:'8px'}); shop.append(list);
    const render = () => { oreLine.textContent = '⛏ '+fmt(S.ore)+' ore · Upgrades cost ore, not tickets'; list.innerHTML = '';
      UPS.forEach(u => { const l = U(u.id), maxed = l >= u.max, pl = plan(u.cost, l, u.max, S.ore), cost = pl.n ? pl.tot : Math.min(BIG, Math.ceil(u.cost(l))), can = !maxed && pl.n > 0;
        const row = el('div',{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,.07)',borderRadius:'12px',padding:'10px 12px'});
        const txt = el('div',{flex:'1',minWidth:0}); txt.append(el('div',{fontWeight:700,fontSize:'15px'},u.n+'  '), el('div',{fontSize:'12px',color:'#cfc6a8',lineHeight:1.35},upDesc(u,l)+' · level '+l+(u.max<999?'/'+u.max:'')));
        const pips = el('div',{display:'flex',gap:'2px',marginTop:'4px',flexWrap:'wrap'}); if (u.max<=25) for (let k=0;k<u.max;k++) pips.append(el('div',{width:'9px',height:'5px',borderRadius:'3px',background:k<l?C.gold:'rgba(255,255,255,.18)'}));
        else if (u.max==FORE_MAX) pips.append(el('div',{width:'100%',height:'6px',borderRadius:'3px',background:'linear-gradient(90deg,'+C.gold+' '+l+'%,rgba(255,255,255,.18) '+l+'%)'})); txt.append(pips);
        const b = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'9px 12px',minWidth:'96px',cursor:can?'pointer':'default',background:maxed?'rgba(255,255,255,.12)':can?C.gold:'rgba(255,255,255,.18)',color:maxed?'#cfc6a8':can?'#2a1d12':'#cfc6a8'}, maxed?'MAXED':(pl.n > 1 ? '×'+pl.n+' · ' : '')+fmt(cost)+' ore');
        b.onclick = () => { const q = plan(u.cost, U(u.id), u.max, S.ore); if (!q.n) { A.sfx('bad'); return; } S.ore -= q.tot; S.up[u.id] = U(u.id)+q.n; A.sfx('coin'); persist(); render(); paintBar(); };
        row.append(txt, b); list.append(row); });
      const info = el('div',{fontSize:'12px',color:'#cfc6a8',lineHeight:'1.5',marginTop:'4px'});
      info.innerHTML = 'Layer <b style="color:#fff">'+(depthIdx()+1)+'/100 · '+DEPTHS[depthIdx()].n+'</b> (+'+(depthIdx()*20)+'% ore). Dig more lifetime ore to reach deeper layers.<br>Miners dig while you’re playing, and keep digging at '+(GL2('owl')?'75%':'half')+' speed while you’re away for up to '+(2+2*U('night'))+' hours (Night Shift adds more).'+(extraStart()?'<br>Extra hire levels past the top miner: <b style="color:#fff">+'+(extraStart()*15)+'% ore</b>.':'')+'<br>Selling ore: 9 ore = 1 ticket, 900 = 10, 1M = 333 · no daily limit.';
      const calmB = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'13px',border:'none',borderRadius:'999px',padding:'8px 14px',cursor:'pointer',background:'rgba(255,255,255,.14)',color:'#fff',alignSelf:'flex-start'}, 'Performance mode · '+(S.calm?'ON (fewer effects)':'OFF'));
      calmB.onclick = () => { S.calm = !S.calm; A.sfx('blip'); persist(); render(); };
      // code bar (one-time codes, remembered in your save even through Rebirths)
      const codeRow = el('div',{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap',background:'rgba(255,255,255,.07)',borderRadius:'12px',padding:'8px 10px'});
      const inp = el('input',{flex:'1 1 140px',minWidth:0,fontFamily:A.font,fontSize:'14px',fontWeight:700,borderRadius:'999px',border:'none',padding:'8px 12px',textTransform:'uppercase'}); inp.placeholder = 'Enter a code'; inp.setAttribute('aria-label','Mines code');
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key=='Enter') redeem(); });
      const go = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'13px',border:'none',borderRadius:'999px',padding:'8px 14px',cursor:'pointer',background:C.lime,color:C.forest},'Redeem');
      const cmsg = el('div',{width:'100%',fontSize:'12px',fontWeight:700,color:C.lime,minHeight:'14px'}, codeMsg);
      const redeem = () => { const v = inp.value.trim().toUpperCase(); S.codes = S.codes || {};
        if (v == 'NIGHTSHIFT20') { if (S.codes[v]) { codeMsg = 'You already redeemed that code.'; A.sfx('bad'); } else { S.codes[v] = Date.now(); S.up.night = Math.max(U('night'), 20); codeMsg = '✓ Code redeemed! Night Shift is now level '+U('night')+'.'; A.sfx('win'); persist(); } }
        else if (v == 'MINERRESCUE') { if (S.codes[v]) { codeMsg = 'You already redeemed that code.'; A.sfx('bad'); } else if (minerCount() > 0) { codeMsg = 'This code only works when you have no miners.'; A.sfx('bad'); }
          else { S.codes[v] = Date.now(); const L = Math.min(15, MAXL); S.grid[0] = L; if (L > (S.best||1)) S.best = L; codeMsg = '✓ Code redeemed! A level '+L+' '+LV[L].n+' joined your crew.'; A.sfx('win'); burst(cell(0).x+CW/2, cell(0).y+CH/2, LV[L].c, 30); persist(); paintBar(); } }
        else { codeMsg = v ? 'That code doesn’t work.' : ''; if (v) A.sfx('bad'); }
        render(); };
      go.onclick = redeem; codeRow.append(el('div',{fontWeight:700,fontSize:'12px',color:C.gold,letterSpacing:'.08em'},'CODE'), inp, go, cmsg);
      list.append(codeRow, calmB, info); };
    shopRender = render; render(); wrap.append(shop); };

  // ---------- Gem Tree overlay (permanent, paid in gems) ----------
  let gemO = null;
  const openGemTree = () => { if (gemO) return; if (shop) { shop.remove(); shop = null; shopQ = shopRender = null; } busy = true; A.sfx('blip');
    gemO = el('div',{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 0%,#1d3a5a,#0b1220 70%)',zIndex:32,display:'flex',flexDirection:'column',padding:'14px',boxSizing:'border-box',gap:'8px',color:'#fff',overflow:'auto'});
    const head = el('div',{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px'}); head.append(el('div',{fontWeight:700,fontSize:'20px',color:'#bff0ff'},'💎 Gem Tree'));
    const close = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'8px 16px',background:C.lime,color:C.forest,cursor:'pointer'},'Back to digging'); close.onclick = () => { gemO.remove(); gemO = null; gemQ = gemRender = null; busy = false; };
    head.append(close); gemO.append(head);
    const bank = el('div',{fontSize:'14px',color:'#dff6ff',lineHeight:1.45}); const list = el('div',{display:'flex',flexDirection:'column',gap:'8px'}); const gq = el('div'); gemQ = () => { gq.innerHTML = ''; const r = el('div',{display:'flex',gap:'5px',alignItems:'center',flexWrap:'wrap'}); r.append(el('span',{fontSize:'12px',fontWeight:700,color:'#bff0ff'},'BUY'));
      [1,10,100,'max'].forEach(v => { const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'12px',border:'1.5px solid #64CDF5',borderRadius:'999px',padding:'4px 10px',cursor:'pointer',background:getQ()===v?'#64CDF5':'transparent',color:getQ()===v?'#06324a':'#bff0ff'}, v==='max'?'Max':'×'+v); x.onclick = () => { setQ(v); A.sfx('blip'); rerenderAll(); }; r.append(x); }); gq.append(r); }; gemQ(); gemO.append(bank, gq, list);
    const render = () => { bank.innerHTML = '<b style="font-size:18px">💎 '+fmt(S.gemBank||0)+' gems</b><br>Permanent upgrades for The Mines — they <b>never reset</b>, not even when you Rebirth. Earn gems by grabbing gems in the rock (rare ones give more), opening treasure rooms (+3), beating Cave Golems (+5) and the Armageddon Core (+100).'; list.innerHTML = '';
      GT.forEach(n => { const l = GL2(n.k), maxed = l >= n.max, pl = plan(n.cost, l, n.max, S.gemBank||0), cost = pl.n ? pl.tot : Math.ceil(n.cost(l)), can = !maxed && pl.n > 0;
        const row = el('div',{display:'flex',alignItems:'center',gap:'10px',background:'rgba(191,240,255,.08)',border:'1px solid rgba(191,240,255,.18)',borderRadius:'12px',padding:'10px 12px'});
        const txt = el('div',{flex:'1',minWidth:0}); txt.append(el('div',{fontWeight:700,fontSize:'15px'},n.e+' '+n.n), el('div',{fontSize:'12px',color:'#b9d6e6',lineHeight:1.35},n.d+' · level '+l+'/'+n.max), el('div',{fontSize:'12px',fontWeight:700,color:'#bff0ff'},'Now: '+n.fx(l)+(maxed?' · MAXED':' → next: '+n.fx(l+1))));
        const pips = el('div',{display:'flex',gap:'2px',marginTop:'4px'}); for (let k=0;k<n.max;k++) pips.append(el('div',{width:Math.max(6, Math.min(14, 120/n.max))+'px',height:'5px',borderRadius:'3px',background:k<l?'#64CDF5':'rgba(255,255,255,.18)'})); txt.append(pips);
        const b = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'9px 12px',minWidth:'92px',cursor:can?'pointer':'default',background:maxed?'rgba(255,255,255,.12)':can?'#64CDF5':'rgba(255,255,255,.18)',color:maxed?'#b9d6e6':can?'#06324a':'#b9d6e6'}, maxed?'MAXED':(pl.n > 1 ? '×'+pl.n+' · ' : '')+fmt(cost)+' 💎');
        b.onclick = () => { const q = plan(n.cost, GL2(n.k), n.max, S.gemBank||0); if (!q.n) { A.sfx('bad'); return; } S.gemBank -= q.tot; S.gtree[n.k] = GL2(n.k)+q.n; A.sfx('win');
          if (n.k == 'slots') { while (S.grid.length < SLOTS()) S.grid.push(0); relayout(); }
          stat(api,'mineGemTree',Object.values(S.gtree).reduce((a,x)=>a+x,0)); persist(); render(); paintBar(); };
        row.append(txt, b); list.append(row); }); };
    gemRender = render; render(); wrap.append(gemO); };

  // ---------- overview map of all 100 layers (zoom + scroll) ----------
  let mapO = null;
  const openMap = () => { if (busy || mapO) return; busy = true; A.sfx('blip'); let z = 1, sy = Math.max(0, depthIdx()*26 - 160), dragY = null;
    mapO = el('div',{position:'absolute',inset:0,background:'rgba(12,8,4,.97)',zIndex:31,display:'flex',flexDirection:'column',color:'#fff'});
    const head = el('div',{display:'flex',alignItems:'center',gap:'6px',padding:'10px 12px'}); head.append(el('div',{fontWeight:700,fontSize:'18px',color:C.gold,flex:1},'🗺 The 100 Layers'));
    const mb = (t,f) => { const b = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'7px 12px',background:'rgba(255,255,255,.14)',color:'#fff',cursor:'pointer'},t); b.onclick = f; head.append(b); return b; };
    mb('−', ()=>{ z = Math.max(.35, z/1.3); }); mb('+', ()=>{ z = Math.min(2.5, z*1.3); }); const cl = mb('Close', ()=>{ mapO.remove(); mapO = null; busy = false; }); cl.style.background = C.lime; cl.style.color = C.forest;
    const cv = el('canvas',{display:'block',touchAction:'none',cursor:'grab'}); const dpr = window.devicePixelRatio||1; cv.width = W*dpr; cv.height = (H-60)*dpr; cv.style.width = W+'px'; cv.style.height = (H-60)+'px'; const mg = cv.getContext('2d'); mg.scale(dpr,dpr);
    mapO.append(head, cv); wrap.append(mapO);
    const RH = () => 26*z, d0 = depthIdx();
    const drawMap = () => { if (!mapO) return; const rh = RH(), MH = H-60; sy = Math.max(0, Math.min(100*rh - MH + 20, sy)); mg.fillStyle = '#0c0804'; mg.fillRect(0,0,W,MH);
      const i0 = Math.max(0, Math.floor(sy/rh)), i1 = Math.min(LAST, Math.ceil((sy+MH)/rh));
      for (let i=i0;i<=i1;i++) { const D = DEPTHS[i], y = i*rh - sy, reached = i <= d0, cleared = i < d0 || (i==LAST && S.coreCleared), here = i == d0;
        const gr = mg.createLinearGradient(0,y,0,y+rh); gr.addColorStop(0, reached ? D.b.a : '#1a1a1a'); gr.addColorStop(1, reached ? D.b.b : '#0e0e0e'); mg.fillStyle = gr; mg.fillRect(20, y+1, W-40, rh-2);
        if (here) { mg.strokeStyle = C.lime; mg.lineWidth = 3; mg.strokeRect(21, y+2, W-42, rh-4); }
        if (rh >= 14) { mg.fillStyle = reached ? '#fff' : '#666'; mg.font = '700 '+Math.min(14, rh*.5)+'px '+A.font; mg.textAlign = 'left'; mg.fillText((i+1)+'  '+(reached ? D.n : '???'), 30, y+rh*.65);
          mg.textAlign = 'right'; mg.fillText(here ? '⛏ YOU ARE HERE' : cleared ? '✓' : reached ? '' : '🔒 '+fmt(D.at)+' ore', W-30, y+rh*.65);
          if (reached && !S.chests[i] && GL()>=5 && rh >= 18) { mg.fillStyle = C.gold; mg.fillText('◆ treasure', W-140, y+rh*.65); } }
        if (i==LAST) { mg.fillStyle = 'rgba(255,58,26,'+(.25+.15*Math.sin(t*4))+')'; mg.fillRect(20, y+1, W-40, rh-2); } }
      mg.fillStyle = 'rgba(255,255,255,.5)'; mg.fillRect(8, 0, 4, MH); mg.fillStyle = C.lime; mg.fillRect(6, (d0/LAST)*MH - 4, 8, 8);
      requestAnimationFrame(drawMap); };
    drawMap();
    cv.addEventListener('wheel', e => { e.preventDefault(); if (e.ctrlKey || Math.abs(e.deltaY) < 4) z = Math.max(.35, Math.min(2.5, z*(e.deltaY>0?.9:1.1))); else sy += e.deltaY; }, {passive:false});
    const pts = new Map(); let pinch = null;
    cv.addEventListener('pointerdown', e => { pts.set(e.pointerId, e.clientY); dragY = {y:e.clientY, s:sy, moved:false}; try { cv.setPointerCapture(e.pointerId); } catch(_){}
      if (pts.size == 2) { const v = [...pts.values()]; pinch = {d:Math.abs(v[0]-v[1]) || 1, z}; } });
    cv.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e.clientY); if (pinch && pts.size == 2) { const v = [...pts.values()]; z = Math.max(.35, Math.min(2.5, pinch.z * (Math.abs(v[0]-v[1])||1)/pinch.d)); return; }
      if (dragY) { const dy = e.clientY - dragY.y; if (Math.abs(dy) > 6) dragY.moved = true; sy = dragY.s - dy * (W / cv.getBoundingClientRect().width); } });
    cv.addEventListener('pointerup', e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (dragY && !dragY.moved) { const r = cv.getBoundingClientRect(), y = (e.clientY - r.top) * (W / r.width) + sy, i = Math.floor(y / RH());
        if (i >= 0 && i <= d0) { mapO.remove(); mapO = null; busy = false; camT.y = tunY(i) - VIEW.h/camT.z*.55; clampCam(camT); follow = i == d0; A.sfx('blip'); } } dragY = null; }); };

  // ---------- bottom bar ----------
  const setH = (e,h) => { if (e._h !== h) { e._h = h; e.innerHTML = h; } };
  const sellVal = L => Math.ceil(lvRate(L)*mult()*45);
  const paintBar = () => { const cost = hireCost(), full = S.grid.indexOf(0) < 0, none = !minerCount();
    if (sel >= 0 && S.grid[sel]) { const last = minerCount()==1; setH(bHire, '<div>'+(last && sellArm>0 ? 'Sell LAST miner?' : 'Sell Lv '+S.grid[sel]+' miner')+'</div><div style="font-size:12px;font-weight:600;opacity:.85">+'+fmt(sellVal(S.grid[sel]))+' ore'+(last?' · last one!':'')+'</div>'); bHire.style.background = last ? '#FF4539' : '#FF8A3C'; bHire.style.opacity = '1'; }
    else { setH(bHire, '<div>Hire miner</div><div style="font-size:12px;font-weight:600;opacity:.85">'+(full?'grid full · merge!':fmt(cost)+' ore · Lv '+hireLv())+'</div>'); bHire.style.background = C.lime; bHire.style.opacity = !full && S.ore >= cost ? '1' : '.6'; }
    setH(bShop, '<div>Upgrades</div><div style="font-size:12px;font-weight:600;opacity:.75">pick · foreman · codes</div>');
    const n = tixFor(S.ore);
    if (none) { setH(bCash, '<div>Cash out locked</div><div style="font-size:12px;font-weight:600;opacity:.8">You need at least one miner</div>'); bCash.style.opacity = '.45'; bCash.disabled = false; bCash.style.cursor = 'not-allowed'; }
    else { setH(bCash, '<div>Cash out → '+fmt(n)+' 🎟</div><div style="font-size:12px;font-weight:600;opacity:.8">sells all your ore</div>'); bCash.style.opacity = n>0 ? '1' : '.6'; bCash.style.cursor = 'pointer'; } };

  // ---------- input: tap = dig / collect, drag = pan, wheel / pinch = zoom ----------
  const pt = e => { const r = c.getBoundingClientRect(); return {x:(e.clientX-r.left)*w/r.width, y:(e.clientY-r.top)*h/r.height}; };
  const inView = p => p.y >= VIEW.y && p.y < VIEW.y+VIEW.h;
  const BTN = [{k:'gem', x:W-198, y:VIEW.y+VIEW.h-34, w:44, h:26, t:'💎'}, {k:'map', x:W-150, y:VIEW.y+VIEW.h-34, w:44, h:26, t:'🗺'}, {k:'zo', x:W-102, y:VIEW.y+VIEW.h-34, w:28, h:26, t:'−'}, {k:'zi', x:W-70, y:VIEW.y+VIEW.h-34, w:28, h:26, t:'+'}, {k:'dig', x:W-38, y:VIEW.y+VIEW.h-34, w:30, h:26, t:'⛏'}];
  const ptrs = new Map(); let pan = null, pinch = null;
  const viewTap = p => {
    const b = BTN.find(b => p.x>=b.x && p.x<=b.x+b.w && p.y>=b.y && p.y<=b.y+b.h);
    if (b) { if (b.k=='gem') openGemTree(); if (b.k=='map') openMap(); if (b.k=='zi') zoomAt(1.25, VIEW.x+VIEW.w/2, VIEW.y+VIEW.h/2); if (b.k=='zo') zoomAt(.8, VIEW.x+VIEW.w/2, VIEW.y+VIEW.h/2); if (b.k=='dig') focusDig(); A.sfx('blip'); return; }
    const wp = toWorld(p.x, p.y), d = depthIdx(), near = (x, y, r) => Math.hypot(wp.x-x, wp.y-y) < r/cam.z + 6;
    if (core && core.meteors) { const m = core.meteors.find(m => near(m.x, m.y, 26)); if (m) { core.meteors = core.meteors.filter(x => x!==m); burst(p.x, p.y, '#ff9f3a', 14); give(Math.max(50, rate()*3)); A.tone(500,.05,'square',.04); return; } }
    if (hazard && near(hazard.x, hazard.y, 30)) { disarm(); return; }
    if (gcart && near(gcart.x, tunY(d)+4, 34)) { const n = Math.max(50, rate()*45); give(n); float(p.x, p.y-30, '+'+fmt(n)+' GOLD CART!', C.gold); burst(p.x, p.y, C.gold, 30); gcart = null; A.sfx('win'); return; }
    const gm = gems.find(g2 => near(g2.x, g2.y, 30)); if (gm) { takeGem(gm); return; }
    const li = Math.floor(wp.y / LH); if (li >= 0 && li <= d && !S.chests[li]) { const rm = room(li); if (wp.x >= rm.x-10 && wp.x <= rm.x+rm.w+10 && wp.y >= rm.y-10 && wp.y <= rm.y+rm.h+10) { openChest(li); return; } }
    if (li === d || core || golem) tapRock(p.x, p.y); else { camT.y = tunY(d) - VIEW.h/camT.z*.55; clampCam(camT); follow = true; say('THAT LAYER IS ALREADY DUG OUT', 'Tap the deepest layer to dig · ⛏ jumps back to the dig face', '#cfc6a8'); } };
  c.addEventListener('wheel', e => { const p = pt(e); if (!inView(p)) return; e.preventDefault(); zoomAt(e.deltaY > 0 ? .88 : 1.14, p.x, p.y); }, {passive:false});
  c.addEventListener('pointerdown', e => { if (busy) return; e.preventDefault(); const p = pt(e); ptrs.set(e.pointerId, p);
    if (inView(p)) { try { c.setPointerCapture(e.pointerId); } catch(_){}
      if (ptrs.size == 2) { const v = [...ptrs.values()]; pinch = {d: Math.hypot(v[0].x-v[1].x, v[0].y-v[1].y) || 1, z: camT.z, cx:(v[0].x+v[1].x)/2, cy:(v[0].y+v[1].y)/2}; pan = null; return; }
      pan = {sx:p.x, sy:p.y, cx:camT.x, cy:camT.y, moved:false}; return; }
    const i = cellAt(p.x, p.y); if (i < 0) { sel = -1; sellArm = 0; paintBar(); return; }
    if (S.grid[i]) { drag = {i, x:p.x, y:p.y, sx:p.x, sy:p.y, moved:false}; try { c.setPointerCapture(e.pointerId); } catch(_){} }
    else if (sel >= 0) { moveOrSwap(sel, i); sel = -1; } });
  c.addEventListener('pointermove', e => { const p = pt(e); if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, p);
    if (pinch && ptrs.size == 2) { const v = [...ptrs.values()], dd = Math.hypot(v[0].x-v[1].x, v[0].y-v[1].y) || 1; const nz = Math.max(.25, Math.min(2.2, pinch.z*dd/pinch.d)); zoomAt(nz/camT.z, pinch.cx, pinch.cy); return; }
    if (pan) { const dx = p.x-pan.sx, dy = p.y-pan.sy; if (Math.hypot(dx,dy) > 7) pan.moved = true; if (pan.moved) { camT.x = pan.cx - dx/camT.z; camT.y = pan.cy - dy/camT.z; clampCam(camT); cam.x = camT.x; cam.y = camT.y; follow = false; } return; }
    if (!drag) return; drag.x = p.x; drag.y = p.y; if (Math.hypot(p.x-drag.sx, p.y-drag.sy) > 8) drag.moved = true; });
  const up = e => { const p = pt(e); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (pan) { const was = pan; pan = null; if (!was.moved && !busy) viewTap(p); return; }
    if (!drag) return; const d = drag; drag = null;
    if (d.moved) { const j = cellAt(d.x, d.y); if (j >= 0 && j !== d.i) moveOrSwap(d.i, j); sel = -1; return; }
    if (sel >= 0 && sel !== d.i) { if (S.grid[sel]===S.grid[d.i]) { merge(sel, d.i); paintBar(); } else moveOrSwap(sel, d.i); sel = -1; } else { sel = sel === d.i ? -1 : d.i; sellArm = 0; } A.sfx('blip'); paintBar(); };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag = null; pan = null; pinch = null; });
  const held = {};
  const offK = A.keys(e => { if (busy) return false; const k = e.key.length==1 ? e.key.toLowerCase() : e.key;
    if (k==' ') { const dp = toScreen(digPoint().x, digPoint().y); tapRock(dp.x+(Math.random()-.5)*50, dp.y+(Math.random()-.5)*30); }
    else if (k=='h') hire(); else if (k=='m') { autoMerge(); paintBar(); } else if (k=='+' || k=='=') zoomAt(1.2, W/2, VIEW.y+VIEW.h/2); else if (k=='-') zoomAt(.83, W/2, VIEW.y+VIEW.h/2); else if (k=='f') focusDig(); else if (k=='g') openMap();
    else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(k)) { held[k] = true; follow = false; } else return false; });
  const ku = e => { const k = e.key.length==1 ? e.key.toLowerCase() : e.key; held[k] = false; }; window.addEventListener('keyup', ku);

  // ---------- drawing ----------
  const drawMiner = (gx, x, y, L, s, swing) => { const col = LV[L].c; gx.save(); gx.translate(x, y); gx.scale(s, s);
    gx.save(); gx.translate(10, -6); gx.rotate(-.9 + Math.sin(swing)*.8); gx.strokeStyle = '#8D5B1D'; gx.lineWidth = 3; gx.beginPath(); gx.moveTo(0,0); gx.lineTo(0,-20); gx.stroke();
    gx.strokeStyle = L>=7 ? col : '#c9ccd1'; gx.lineWidth = 3.5; gx.lineCap = 'round'; gx.beginPath(); gx.moveTo(-9,-18); gx.quadraticCurveTo(0,-24,9,-18); gx.stroke(); gx.restore();
    gx.fillStyle = col; rrect(gx,-9,-4,18,18,5); gx.fill(); gx.fillStyle = 'rgba(0,0,0,.25)'; gx.fillRect(-9,6,18,3);
    gx.fillStyle = '#3a2a1c'; gx.fillRect(-8,14,6,6); gx.fillRect(2,14,6,6);
    gx.fillStyle = '#f2c9a0'; gx.beginPath(); gx.arc(0,-11,7,0,TAU); gx.fill();
    gx.fillStyle = '#121313'; gx.beginPath(); gx.arc(-2.5,-11,1.2,0,TAU); gx.arc(2.5,-11,1.2,0,TAU); gx.fill();
    gx.fillStyle = L>=10 ? '#fff' : C.gold; gx.beginPath(); gx.arc(0,-13,7.5,Math.PI,0); gx.fill(); gx.fillRect(-9,-14,18,2.5);
    gx.fillStyle = '#fffbe0'; gx.beginPath(); gx.arc(0,-17,2.3,0,TAU); gx.fill();
    if (L >= 5 && !lowFx()) { gx.globalAlpha = .18 + .1*Math.sin(t*4); gx.fillStyle = '#fff6b0'; gx.beginPath(); gx.moveTo(0,-17); gx.lineTo(-14,-34); gx.lineTo(14,-34); gx.fill(); gx.globalAlpha = 1; }
    gx.restore(); };
  // animated biome details, drawn in world space only for visible layers (computed from time — no particle arrays)
  const drawLayerFx = (i, x0, x1) => { const B = DEPTHS[i].b, y0 = i*LH, low = lowFx(), n = low ? 4 : 12;
    if (B.fx=='drip' || B.fx=='bubbles') for (let k=0;k<n;k++) { const x = hash(i, 100+k)*WW; if (x < x0-20 || x > x1+20) continue; const ph = ((t*.5 + hash(i,200+k)) % 1); g.fillStyle = B.fx=='bubbles' ? 'rgba(159,232,255,.6)' : 'rgba(159,216,255,.7)'; const yy = B.fx=='bubbles' ? y0 + LH - ph*LH : y0 + ph*LH; g.beginPath(); g.arc(x, yy, B.fx=='bubbles' ? 3 : 2, 0, TAU); g.fill(); }
    if (B.fx=='dust' || B.fx=='spores' || B.fx=='snow') for (let k=0;k<n;k++) { const x = (hash(i,300+k)*WW + t*(B.fx=='snow'?6:12)*(k%2?1:-1) + WW) % WW; if (x < x0-20 || x > x1+20) continue; const yy = y0 + ((hash(i,400+k)*LH + t*(B.fx=='snow'?18:4)) % LH);
      g.fillStyle = B.fx=='spores' ? 'rgba(159,255,176,.6)' : B.fx=='snow' ? 'rgba(255,255,255,.8)' : 'rgba(255,240,210,.35)'; g.beginPath(); g.arc(x, yy, B.fx=='snow' ? 2.2 : 1.8, 0, TAU); g.fill(); }
    if (B.fx=='lava' || B.fx=='embers' || B.fx=='core') { g.fillStyle = B.fx=='core' ? 'rgba(255,58,26,.5)' : 'rgba(255,122,60,.45)'; g.beginPath(); g.moveTo(x0, y0+LH); for (let x = Math.floor(x0/30)*30; x <= x1+30; x += 30) g.lineTo(x, y0+LH-10-Math.sin(x*.05+t*2)*5); g.lineTo(x1+30, y0+LH); g.fill();
      for (let k=0;k<n;k++) { const x = hash(i,500+k)*WW; if (x < x0 || x > x1) continue; const ph = (t*.4 + hash(i,600+k)) % 1; g.fillStyle = 'rgba(255,'+(140+k*8)+',60,'+(1-ph)+')'; g.fillRect(x, y0+LH-14-ph*LH*.6, 3, 3); } }
    if (B.fx=='sparks' || B.fx=='stars' || B.fx=='void') for (let k=0;k<n;k++) { const x = hash(i,700+k)*WW; if (x < x0 || x > x1) continue; const yy = y0 + hash(i,800+k)*LH, a = .3 + .7*Math.abs(Math.sin(t*2 + k)); g.fillStyle = B.fx=='void' ? 'rgba(180,140,255,'+a*.6+')' : B.fx=='sparks' ? 'rgba(255,255,255,'+a+')' : 'rgba(255,255,255,'+a*.8+')'; g.fillRect(x, yy, 2, 2); }
    if (B.fx=='gears') for (let k=0;k<3;k++) { const x = hash(i,900+k)*WW; if (x < x0-30 || x > x1+30) continue; const yy = y0 + 30 + hash(i,950+k)*40; g.save(); g.translate(x, yy); g.rotate(t*(k%2?1:-1)); g.strokeStyle = 'rgba(255,210,58,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(0,0,12,0,TAU); g.stroke(); for (let q=0;q<6;q++) { g.rotate(Math.PI/3); g.fillStyle = 'rgba(255,210,58,.5)'; g.fillRect(12,-2,5,4); } g.restore(); }
    // swinging lanterns along the tunnel
    for (let x = 120; x < WW; x += 320) { if (x < x0-20 || x > x1+20) continue; const a = low ? 0 : Math.sin(t*1.6 + x*.01)*.25, ty = tunY(i) - 30; g.save(); g.translate(x, ty); g.rotate(a); g.strokeStyle = '#3a2a1c'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0,0); g.lineTo(0,12); g.stroke();
      if (!low) { g.fillStyle = 'rgba(249,191,1,.18)'; g.beginPath(); g.arc(0,18,22,0,TAU); g.fill(); } g.fillStyle = C.gold; rrect(g,-4,12,8,10,2); g.fill(); g.restore(); } };
  const drawWorld = () => { const d = depthIdx(), vw = VIEW.w/cam.z, vh = VIEW.h/cam.z, i0 = Math.max(0, Math.floor(cam.y/LH)), i1 = Math.min(LAST, Math.floor((cam.y+vh)/LH));
    g.save(); g.beginPath(); g.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h); g.clip();
    // parallax backdrop
    const BD = DEPTHS[Math.min(d, Math.max(0,i0))].b; g.fillStyle = BD.b; g.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
    if (!lowFx()) { g.fillStyle = 'rgba(255,255,255,.035)'; for (let k=0;k<6;k++) { const px = ((k*190 - cam.x*.3) % 600 + 600) % 600 - 60, py = VIEW.y + ((k*83 - cam.y*.3) % 300 + 300) % 300 - 30; g.beginPath(); g.arc(px, py, 70, 0, TAU); g.fill(); } }
    g.save(); g.translate(VIEW.x - cam.x*cam.z, VIEW.y - cam.y*cam.z); g.scale(cam.z, cam.z);
    for (let i=i0;i<=i1;i++) { const y0 = i*LH;
      if (i > d) { g.fillStyle = i == d+1 ? '#151110' : '#0b0908'; g.fillRect(0, y0, WW, LH); g.fillStyle = 'rgba(255,255,255,.25)'; g.font = '700 22px '+A.font; g.textAlign = 'center';
        g.fillText(i == d+1 ? '⛏ LAYER '+(i+1)+' · '+DEPTHS[i].n.toUpperCase()+' · '+fmt(DEPTHS[i].at)+' lifetime ore' : '🔒 LAYER '+(i+1), Math.max(260, Math.min(WW-260, cam.x + vw/2)), y0 + Math.min(LH/2, Math.max(30, cam.y + vh/2 - y0))); continue; }
      g.drawImage(layerTex(i), 0, y0, WW, LH);
      const x0 = cam.x, x1 = cam.x + vw; drawLayerFx(i, x0, x1);
      // hidden treasure room
      if (!S.chests[i]) { const rm = room(i); if (rm.x < x1 && rm.x+rm.w > x0) { const gl = GL()>=5 && !lowFx() ? .35+.3*Math.sin(t*4+i) : 0; if (gl) { g.fillStyle = 'rgba(249,191,1,'+gl+')'; g.beginPath(); g.arc(rm.x+rm.w/2, rm.y+rm.h/2, 34, 0, TAU); g.fill(); }
        g.fillStyle = '#8D5B1D'; rrect(g, rm.x+rm.w/2-16, rm.y+rm.h/2-10, 32, 22, 4); g.fill(); g.fillStyle = C.gold; g.fillRect(rm.x+rm.w/2-16, rm.y+rm.h/2-3, 32, 4); g.fillRect(rm.x+rm.w/2-3, rm.y+rm.h/2-4, 6, 8); } }
      else { const rm = room(i); g.fillStyle = 'rgba(255,255,255,.15)'; g.font = '600 10px '+A.font; g.textAlign = 'center'; g.fillText('looted', rm.x+rm.w/2, rm.y+rm.h/2+4); }
      // minecart rolling along the tunnel
      const cx = ((t*60 + i*137) % (WW+200)) - 100; if (cx > x0-40 && cx < x1+40) { const ty = tunY(i)+12; g.fillStyle = '#4b4d50'; rrect(g, cx-18, ty-12, 36, 16, 4); g.fill(); g.fillStyle = DEPTHS[i].b.ore; g.beginPath(); g.ellipse(cx, ty-12, 15, 6, 0, Math.PI, 0); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(cx-10, ty+5, 4, 0, TAU); g.arc(cx+10, ty+5, 4, 0, TAU); g.fill(); } }
    // dig face on the deepest layer
    const dp = digPoint(), B = DEPTHS[d].b;
    if (dp.x > cam.x - 120 && dp.x < cam.x + vw + 120 && dp.y > cam.y - 140 && dp.y < cam.y + vh + 140) {
      g.fillStyle = B.a; g.beginPath(); g.moveTo(DIGX, dp.y-60); g.quadraticCurveTo(DIGX+30, dp.y, DIGX, dp.y+60); g.lineTo(WW, dp.y+60); g.lineTo(WW, dp.y-60); g.fill();
      if (!core && !golem) { const pulse = lowFx() ? 1 : 1 + Math.sin(t*2)*.02; g.save(); g.translate(dp.x, dp.y); g.scale(pulse, pulse);
        g.fillStyle = '#5b5b60'; g.beginPath(); for (let k=0;k<11;k++) { const a = k/11*TAU, rr = 46*(.82 + .18*Math.sin(k*2.3)); g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr*.82); } g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(-12, -14, 18, 10, -.4, 0, TAU); g.fill();
        for (let k=0;k<6;k++) { const a = k*1.1, rr = 10 + (k*11)%26; g.fillStyle = B.ore; g.beginPath(); g.moveTo(Math.cos(a)*rr, Math.sin(a)*rr*.8-4); g.lineTo(Math.cos(a)*rr+5, Math.sin(a)*rr*.8); g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr*.8+4); g.lineTo(Math.cos(a)*rr-5, Math.sin(a)*rr*.8); g.fill(); }
        const gl = lowFx() ? .8 : .55+.45*Math.sin(t*8), ccx = Math.cos(crack.a)*40*crack.r, ccy = Math.sin(crack.a)*34*crack.r; g.strokeStyle = 'rgba(255,255,255,'+gl+')'; g.lineWidth = 3; g.beginPath(); g.moveTo(ccx-8,ccy-6); g.lineTo(ccx-2,ccy-1); g.lineTo(ccx-4,ccy+4); g.lineTo(ccx+7,ccy+7); g.stroke(); g.restore(); }
      // miners working (one sprite per miner, spread along the deepest tunnel)
      let k = 0; for (let i=0;i<S.grid.length;i++) { const L = S.grid[i]; if (!L) continue; const mx = DIGX - 70 - (k%16)*38 - Math.floor(k/16)*19 - (k%2)*6, my = tunY(d) + 6; if (mx > cam.x-30 && mx < cam.x+vw+30) drawMiner(g, mx, my, L, .9, lowFx() ? 1.2 : t*6 + i); k++; }
      if (!minerCount()) { g.fillStyle = '#ffb3ab'; g.font = '700 14px '+A.font; g.textAlign = 'center'; g.fillText('No miners! Hire one below', DIGX - 160, tunY(d) - 20); } }
    // miners on upper layers wave as you pass by
    if (i0 < d) for (let i=Math.max(i0,0); i<Math.min(d, i1+1); i++) if (hash(i, 77) < .6) { const mx = 200 + hash(i, 78)*(WW-500); if (mx > cam.x-30 && mx < cam.x+vw+30) drawMiner(g, mx, tunY(i)+6, Math.max(1, Math.min(S.best||1, 1+Math.floor(i/3))), .8, lowFx() ? 1.2 : t*4 + i); }
    // gems
    for (const gm of gems) { const gy = gm.y + Math.sin(t*3)*3, gl = .5 + .5*Math.sin(t*6), R = 22 + 1.6*GL(), col = gm.rare ? gm.rare.c : '#9fd8ff';
      g.fillStyle = gm.rare ? 'rgba(255,255,255,'+(.15+.15*gl)+')' : 'rgba(159,216,255,'+(.2+.2*gl)+')'; g.beginPath(); g.arc(gm.x, gy, R, 0, TAU); g.fill();
      if (learn) { g.fillStyle = '#6b6f80'; g.beginPath(); g.arc(gm.x, gy, 16, 0, TAU); g.fill(); g.fillStyle = '#9fd8ff'; g.beginPath(); g.arc(gm.x+3, gy-2, 10, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('+−×÷', gm.x+2, gy+4); }
      else { g.fillStyle = col; g.beginPath(); g.moveTo(gm.x, gy-15); g.lineTo(gm.x+11, gy-4); g.lineTo(gm.x, gy+13); g.lineTo(gm.x-11, gy-4); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(gm.x, gy-15); g.lineTo(gm.x+4, gy-4); g.lineTo(gm.x-11, gy-4); g.fill(); }
      if (gm.life !== undefined) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(gm.x, gy, R-3, -Math.PI/2, -Math.PI/2 + TAU*Math.max(0, gm.life/gemLife())); g.stroke(); } }
    // gold cart
    if (gcart) { const ty = tunY(d) + 12, gx = gcart.x; g.fillStyle = C.gold; rrect(g, gx-22, ty-16, 44, 20, 5); g.fill(); g.fillStyle = '#fff6b0'; g.beginPath(); g.ellipse(gx, ty-16, 18, 7, 0, Math.PI, 0); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(gx-12, ty+5, 4, 0, TAU); g.arc(gx+12, ty+5, 4, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('TAP!', gx, ty-26); }
    // hazard
    if (hazard) { const f = hazard.fuse/hazard.max, pul = .5+.5*Math.sin(t*10); g.fillStyle = 'rgba(255,69,57,'+(.25+.25*pul)+')'; g.beginPath(); g.arc(hazard.x, hazard.y, 26, 0, TAU); g.fill(); g.fillStyle = '#FF4539'; g.beginPath(); g.moveTo(hazard.x, hazard.y-16); g.lineTo(hazard.x+15, hazard.y+11); g.lineTo(hazard.x-15, hazard.y+11); g.fill(); g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'center'; g.fillText('!', hazard.x, hazard.y+8);
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(hazard.x, hazard.y, 30, -Math.PI/2, -Math.PI/2 + TAU*f); g.stroke(); g.font = '700 11px '+A.font; g.fillText(hazard.n.toUpperCase(), hazard.x, hazard.y-36); }
    // bosses at the dig face
    if (golem) { const sh = golem.hit ? (Math.random()-.5)*6 : 0, bob = Math.sin(t*3)*3; g.save(); g.translate(dp.x - 10 + sh, dp.y - 6 + bob); g.scale(.85, .85);
      g.fillStyle = '#5f6b68'; g.beginPath(); g.ellipse(0, 6, 58, 50, 0, 0, TAU); g.fill(); g.fillStyle = '#7d8a86'; g.beginPath(); g.ellipse(-8, -6, 40, 32, 0, 0, TAU); g.fill();
      g.fillStyle = '#4a5452'; g.beginPath(); g.ellipse(-62, 16, 18, 26, -.4, 0, TAU); g.ellipse(62, 16, 18, 26, .4, 0, TAU); g.fill();
      g.fillStyle = golem.hit ? '#ffffff' : '#FF8A3C'; g.beginPath(); g.arc(-16, -6, 7, 0, TAU); g.arc(16, -6, 7, 0, TAU); g.fill(); g.strokeStyle = '#2a302f'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, 18); g.lineTo(14, 18); g.stroke(); g.restore(); }
    if (core) { const pul = Math.sin(t*5), R = 62 + pul*4; g.save(); g.translate(dp.x - 30 + (core.hit ? (Math.random()-.5)*8 : 0), dp.y - 4);
      if (!lowFx()) { for (let k=3;k>0;k--) { g.fillStyle = 'rgba(255,'+(40+k*30)+',20,'+(.08*k)+')'; g.beginPath(); g.arc(0,0,R+k*18,0,TAU); g.fill(); } }
      g.fillStyle = '#120000'; g.beginPath(); g.arc(0,0,R,0,TAU); g.fill(); const gr = g.createRadialGradient(0,0,4,0,0,R*.85); gr.addColorStop(0, core.hit ? '#ffffff' : '#ffe14f'); gr.addColorStop(.4,'#ff3a1a'); gr.addColorStop(1,'#3a0000'); g.fillStyle = gr; g.beginPath(); g.arc(0,0,R*.85,0,TAU); g.fill();
      g.strokeStyle = 'rgba(255,200,80,.7)'; g.lineWidth = 3; for (let k=0;k<3;k++) { g.save(); g.rotate(t*(.6+k*.3)*(k%2?-1:1)); g.beginPath(); g.ellipse(0,0,R+14+k*10,(R+14+k*10)*.35,0,0,TAU); g.stroke(); g.fillStyle = '#ffe14f'; g.beginPath(); g.arc(R+14+k*10,0,5,0,TAU); g.fill(); g.restore(); }
      g.fillStyle = '#120000'; g.beginPath(); g.ellipse(-20,-10,10,6,0,0,TAU); g.ellipse(20,-10,10,6,0,0,TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-20,-10,3,0,TAU); g.arc(20,-10,3,0,TAU); g.fill(); g.restore();
      for (const m of (core.meteors||[])) { g.fillStyle = '#ff9f3a'; g.beginPath(); g.arc(m.x, m.y, 14, 0, TAU); g.fill(); g.fillStyle = '#3a0000'; g.beginPath(); g.arc(m.x-3, m.y-3, 6, 0, TAU); g.fill(); if (!lowFx()) { g.fillStyle = 'rgba(255,159,58,.35)'; g.beginPath(); g.moveTo(m.x-10, m.y-8); g.lineTo(m.x-30, m.y-40); g.lineTo(m.x+6, m.y-14); g.fill(); } } }
    g.restore();
    if (core && !lowFx()) { g.fillStyle = 'rgba(255,40,10,'+(.05+.05*Math.sin(t*3))+')'; g.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h); }
    if (trouble > 0) { g.fillStyle = 'rgba(255,69,57,.12)'; g.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h); g.fillStyle = '#ffb3ab'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText('HAZARD! Miners digging at half speed · '+Math.ceil(trouble)+'s', W/2, VIEW.y+VIEW.h-44); }
    // mini-map (corner): all 100 layers, the camera box, your depth, treasure and hazards
    const mmx = W-38, mmy = VIEW.y+8, mmh = VIEW.h-52, mmw = 30; g.fillStyle = 'rgba(0,0,0,.55)'; rrect(g, mmx-3, mmy-3, mmw+6, mmh+6, 6); g.fill();
    for (let i=0;i<=LAST;i+=1) { const yy = mmy + i/100*mmh; g.fillStyle = i <= d ? DEPTHS[i].b.a : '#222'; g.fillRect(mmx, yy, mmw, mmh/100+.6); }
    if (GL()>=5) for (let i=0;i<=d;i++) if (!S.chests[i]) { g.fillStyle = C.gold; g.fillRect(mmx+mmw-6, mmy + i/100*mmh, 4, Math.max(1.5, mmh/100)); }
    if (hazard && GL()>=8) { g.fillStyle = C.red; g.fillRect(mmx, mmy + d/100*mmh - 2, 6, 5); }
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.strokeRect(mmx + cam.x/WW*mmw, mmy + cam.y/(100*LH)*mmh, Math.max(4, vw/WW*mmw), Math.max(3, vh/(100*LH)*mmh));
    g.fillStyle = C.lime; g.beginPath(); g.moveTo(mmx-6, mmy + (d+.5)/100*mmh); g.lineTo(mmx-1, mmy + (d+.5)/100*mmh - 4); g.lineTo(mmx-1, mmy + (d+.5)/100*mmh + 4); g.fill();
    // view buttons
    for (const b of BTN) { g.fillStyle = 'rgba(0,0,0,.6)'; rrect(g, b.x, b.y, b.w, b.h, 8); g.fill(); g.fillStyle = '#fff'; g.font = '700 14px '+A.font; g.textAlign = 'center'; g.fillText(b.t, b.x+b.w/2, b.y+18); }
    if (combo > 2) { g.fillStyle = C.lime; g.font = '700 14px '+A.font; g.textAlign = 'left'; g.fillText('COMBO '+combo+' · ×'+comboMult().toFixed(2)+(comboMult()>=3?' MAX':''), 12, VIEW.y+VIEW.h-14); }
    if (rushT > 0) { g.fillStyle = 'rgba(249,191,1,.9)'; rrect(g, 10, VIEW.y+8, 150, 24, 12); g.fill(); g.fillStyle = '#121313'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText('GOLD RUSH ×3 · '+Math.ceil(rushT)+'s', 85, VIEW.y+24); }
    // boss bars
    const boss = core || golem; if (boss) { const bw = 300, bx = (W-bw)/2 - 20, by = VIEW.y + 36; g.fillStyle = 'rgba(0,0,0,.75)'; rrect(g, bx-8, by, bw+16, 34, 10); g.fill();
      g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(core ? 'THE ARMAGEDDON CORE · PHASE '+core.phase : 'CAVE GOLEM · '+Math.ceil(golem.t)+'s', bx+bw/2, by+14);
      g.fillStyle = '#3a1010'; g.fillRect(bx, by+19, bw, 9); g.fillStyle = core ? '#ff3a1a' : C.red; g.fillRect(bx, by+19, bw*Math.max(0, boss.hp/boss.max), 9); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(bx, by+19, bw, 9); }
    g.restore(); };
  const draw = () => { const D = DEPTHS[depthIdx()], r = rate(), d = depthIdx();
    g.fillStyle = '#1b130c'; g.fillRect(0,0,w,h);
    g.save(); if (shake > 0 && !lowFx()) g.translate((Math.random()-.5)*8*shake/.15, (Math.random()-.5)*6*shake/.15); drawWorld(); g.restore();
    // ----- HUD -----
    g.fillStyle = '#2a1d12'; g.fillRect(0, 0, w, HUD);
    g.textAlign = 'left'; g.fillStyle = C.gold; g.font = '700 26px '+A.font; g.fillText('⛏ '+fmt(S.ore), 14, 32);
    g.fillStyle = '#cfc6a8'; g.font = '600 12px '+A.font; g.fillText((Date.now()-(A.lastAct||0)<15000 ? '+'+fmt(r)+' ore/s' : 'Miners resting · tap to dig')+(d?'  ·  +'+d*20+'% depth bonus':''), 16, 52);
    // depth meter toward layer 100
    const mx = 250, mw = 216; g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'right'; g.fillText('LAYER '+(d+1)+'/100 · '+D.n.toUpperCase(), w-14, 18);
    g.fillStyle = 'rgba(255,255,255,.12)'; rrect(g, mx, 26, mw, 8, 4); g.fill(); g.fillStyle = D.b.ore; rrect(g, mx, 26, Math.max(4, mw*(d+1)/100), 8, 4); g.fill();
    const nd = DEPTHS[d+1]; g.fillStyle = '#cfc6a8'; g.font = '600 10px '+A.font;
    if (nd) { const prev = D.at, f = Math.min(1, (S.life-prev)/(nd.at-prev)); g.fillText('NEXT: '+nd.n.toUpperCase()+' · '+Math.floor(f*100)+'%', w-14, 50); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(mx, 38, mw, 3); g.fillStyle = nd.b.ore; g.fillRect(mx, 38, mw*f, 3); }
    else { g.fillStyle = S.coreCleared ? C.lime : '#ff9f3a'; g.fillText(S.coreCleared ? 'LAYER 100 CLEARED · YOU BEAT THE MINES!' : 'FINAL LAYER · DEFEAT THE CORE', w-14, 50); }
    g.fillText('💎 '+fmt(S.gemBank||0)+' gems'+(U('auto') ? '  ·  Foreman '+sec(foreInt(U('auto'))) : ''), w-14, 60);
    // ----- miner grid -----
    g.fillStyle = '#140e08'; g.fillRect(0, GY-8, w, h-GY+8);
    const sc = CH/70, small = CW < 90;
    for (let i=0;i<S.grid.length;i++) { const p = cell(i), L = S.grid[i], dragging = drag && drag.moved && drag.i===i;
      g.fillStyle = L ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.03)'; rrect(g, p.x, p.y, CW, CH, 10); g.fill();
      const canDrop = (drag && drag.moved && drag.i!==i && S.grid[drag.i]===L && L && L<MAXL) || (sel>=0 && sel!==i && S.grid[sel]===L && L && L<MAXL);
      g.lineWidth = canDrop ? 3 : sel===i ? 3 : 1.5; g.strokeStyle = canDrop ? C.lime : sel===i ? '#fff' : L ? LV[L].c : 'rgba(255,255,255,.08)'; g.globalAlpha = L && !canDrop && sel!==i ? .45 : 1; rrect(g, p.x, p.y, CW, CH, 12); g.stroke(); g.globalAlpha = 1;
      if (!L) { g.fillStyle = 'rgba(255,255,255,.12)'; g.font = '700 22px '+A.font; g.textAlign = 'center'; g.fillText('+', p.x+CW/2, p.y+CH/2+8); continue; }
      if (dragging) continue;
      const tx = small ? p.x+CW*.56 : p.x+62; drawMiner(g, small ? p.x+CW*.3 : p.x+34, p.y+CH/2+6*sc, L, 1.05*sc, lowFx() ? 1.2 : t*6 + i);
      g.textAlign = 'left'; g.fillStyle = LV[L].c; g.font = '700 '+(small?16:18)+'px '+A.font; g.fillText(L, tx, p.y+26*sc);
      g.fillStyle = '#cfc6a8'; g.font = '600 '+(small?9:10)+'px '+A.font; g.fillText(fmt(lvRate(L)*mult())+'/s', tx, p.y+43*sc);
      if (canDrop) { g.fillStyle = C.lime; g.font = '700 10px '+A.font; g.fillText('MERGE', tx, p.y+56*sc); } }
    if (drag && drag.moved) { const L = S.grid[drag.i]; if (L) { g.globalAlpha = .9; drawMiner(g, drag.x, drag.y, L, 1.3, t*10); g.globalAlpha = 1; } }
    g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.4)'; g.font = '600 11px '+A.font; g.fillText('Drag the mine to explore · drag matching miners together to merge · tap one to sell it', w/2, h-8);
    // ----- particles / floats / message -----
    for (const p of parts) { g.globalAlpha = Math.max(0, Math.min(1, p.t*2)); g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill(); } g.globalAlpha = 1;
    for (const f of floats) { g.globalAlpha = Math.max(0, f.t); g.fillStyle = f.col; g.font = '700 15px '+A.font; g.textAlign = 'center'; g.fillText(f.txt, f.x, f.y); } g.globalAlpha = 1;
    if (msg) { g.globalAlpha = Math.min(1, msg.t*2); g.fillStyle = 'rgba(20,14,8,.92)'; rrect(g, 24, VIEW.y+76, w-80, msg.sub?54:36, 14); g.fill(); g.textAlign = 'center';
      g.fillStyle = msg.col; g.font = '700 15px '+A.font; g.fillText(msg.txt, (w-56)/2, VIEW.y+99, w-100); if (msg.sub) { g.fillStyle = '#EDE9D8'; g.font = '500 12px '+A.font; g.fillText(msg.sub, (w-56)/2, VIEW.y+119, w-100); } g.globalAlpha = 1; } };

  // ---------- loop ----------
  let barT = 0, scT = 0, drawErr = 0;
  const offL = A.loop(dt => { t += dt; const r = rate(); const active = Date.now() - (A.lastAct||0) < 15000; if (active && (!busy || shop || mapO)) give(r*dt);
    shake = Math.max(0, shake-dt); comboT -= dt; if (comboT <= 0) combo = 0; trouble = Math.max(0, trouble - dt); if (sellArm > 0) { sellArm -= dt; if (sellArm <= 0) paintBar(); }
    // camera: keys pan, follow the dig face, smooth easing between layers
    const ps = 520*dt/camT.z; if (held.ArrowLeft||held.a) { camT.x -= ps; } if (held.ArrowRight||held.d) { camT.x += ps; } if (held.ArrowUp||held.w) { camT.y -= ps; } if (held.ArrowDown||held.s) { camT.y += ps; } clampCam(camT);
    const k = Math.min(1, dt*6); cam.x += (camT.x-cam.x)*k; cam.y += (camT.y-cam.y)*k; cam.z += (camT.z-cam.z)*k;
    rushT = Math.max(0, rushT - dt);
    const d = depthIdx();
    // Armageddon Core: the final boss waits on layer 100 until it's beaten
    if (d == LAST && !S.coreCleared && !core && !learn) { const hp = Math.max(1e6, tapAmt()*(1+.1*U('pick'))*900 + r*120); core = {hp, max:hp, hit:0, phase:1, idle:0, meteorT:4, meteors:[]}; golem = null; say('THE ARMAGEDDON CORE AWAKENS!', 'Tap the core to calm it · tap falling meteors before they land', '#ff9f3a'); A.tone(55,1.2,'sawtooth',.08); focusDig(); }
    if (core) { core.hit = Math.max(0, core.hit - dt); core.idle += dt; core.phase = core.hp < core.max*.33 ? 3 : core.hp < core.max*.66 ? 2 : 1;
      if (core.idle > 3) core.hp = Math.min(core.max, core.hp + core.max*.004*dt*60/60);   // slowly recovers if you stop tapping
      core.meteorT -= dt; if (core.meteorT <= 0) { core.meteorT = [0, 4, 2.8, 1.8][core.phase]; const n = core.phase; for (let q=0;q<n;q++) core.meteors.push({x: cam.x + 40 + Math.random()*(VIEW.w/cam.z - 120), y: tunY(d) - LH*.6, vy: 30 + Math.random()*20}); if (!lowFx()) A.tone(90,.3,'sawtooth',.04); }
      for (const m of core.meteors) { m.y += m.vy*dt; if (m.y > tunY(d) + 30) { m.dead = 1; trouble = Math.max(trouble, 4); shake = .25; } } core.meteors = core.meteors.filter(m => !m.dead);
      if (Math.random() < dt*.4 && !lowFx()) A.tone(45 + Math.random()*20, .4, 'sawtooth', .03); }
    if (golem) { golem.t -= dt; golem.hit = Math.max(0, (golem.hit||0) - dt); if (golem.t <= 0) { say('THE GOLEM WANDERED OFF', 'Tap faster next time — it comes back later', '#cfc6a8'); golem = null; golemT = 120 + Math.random()*60; } }
    else if (!core && active && !busy && !learn) { golemT -= dt; if (golemT <= 0) { const hp = Math.max(60, tapAmt()*(1+.1*U('pick'))*55); golem = {hp, max:hp, t:25, hit:0}; say('A CAVE GOLEM APPEARS!', 'Tap it fast — beat it in 25 seconds for a big ore haul', '#ffb3ab'); A.sfx('bad'); focusDig(); } }
    if (hazard) { hazard.fuse -= dt; if (hazard.fuse <= 0) { trouble = 10; say(hazard.n.toUpperCase()+' WENT OFF!', 'Miners dig at half speed for 10 seconds', '#ffb3ab'); A.sfx('bad'); shake = .3; hazard = null; hazardT = 70 + Math.random()*60; } }
    else if (active && !busy && !learn && d >= 2) { hazardT -= dt; if (hazardT <= 0) spawnHazard(); }
    gcartT -= dt; if (!gcart && gcartT <= 0) { gcart = {x:-40}; gcartT = 40 + Math.random()*40; A.tone(880,.1,'triangle',.05); } if (gcart) { gcart.x += 140*dt; if (gcart.x > WW+40) gcart = null; }
    let n = 0; for (const p of parts) { p.t -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 420*dt; if (p.t > 0) parts[n++] = p; } parts.length = n;
    n = 0; for (const f of floats) { f.t -= dt*.9; f.y -= 40*dt; if (f.t > 0) floats[n++] = f; } floats.length = n;
    if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
    if (!busy) { if (!gems.length) { gemT -= dt; if (gemT <= 0) { spawnGem(); if (GL()>=12 && Math.random()<.3) spawnGem(); } } }
    for (const gm of gems) if (gm.life !== undefined) gm.life -= dt; if (gems.some(gm => gm.life !== undefined && gm.life <= 0)) { gems = gems.filter(gm => !(gm.life !== undefined && gm.life <= 0)); if (!gems.length) gemT = gemGap(); }
    if (GL() >= 20 && !learn) { stormT -= dt; if (stormT <= 0) { stormT = 180; for (let q=0;q<6;q++) spawnGem(); say('GEM STORM!', 'Six gems just appeared — grab them!', '#9fd8ff'); } }
    // Foreman: merges in batches so even one merge every 0.1 s stays smooth
    const FL = U('auto'); if (FL && !busy) { const iv = foreInt(FL); autoAcc += dt; let m = 0; const quiet = iv < .5; while (autoAcc >= iv && m < 20) { autoAcc -= iv; if (!autoMerge(quiet)) { autoAcc = Math.min(autoAcc, iv); break; } m++; } if (m) paintBar(); if (autoAcc > iv*20) autoAcc = 0; }
    if (d > lastDepth) { lastDepth = d; say('LAYER '+(d+1)+': '+DEPTHS[d].n.toUpperCase(), 'All ore +'+d*20+'% · '+DEPTHS[d].b.tr+' hidden somewhere', DEPTHS[d].b.ore); A.sfx('win'); stat(api,'mineDepth',d+1); if (follow) focusDig(); }
    else if (follow) { camT.y = tunY(d) - VIEW.h/camT.z*.55; clampCam(camT); }
    barT -= dt; if (barT <= 0) { barT = .4; paintBar(); } scT -= dt; if (scT <= 0) { scT = 1; api.score(Math.floor(S.ore)); }
    saveT -= dt; if (saveT <= 0) { saveT = 10; persist(); }
    try { draw(); } catch(e) { if (!drawErr) { drawErr = 1; console.error('Mines draw error', e); } } });

  // ---------- Night Shift: away from the arcade, miners keep digging at half speed (2 h + 2 h per Night Shift level) ----------
  const away = Math.max(0, (Date.now() - (S.last||Date.now()))/1000), cap = (2 + 2*U('night'))*3600, secs = Math.min(away, cap), earned = rate()*secs*(GL2('owl') ? .75 : .5);
  if (api.stored && secs > 60 && earned >= 1) { give(earned); const hh = Math.floor(secs/3600), mm = Math.floor(secs%3600/60);
    say('WHILE YOU WERE AWAY: +'+fmt(earned)+' ORE', 'Your miners dug for '+(hh?hh+'h ':'')+mm+'m'+(away>cap?' (Night Shift raises the limit)':''), C.gold); A.sfx('win'); }
  else if (!api.stored) say('WELCOME TO THE MINES', learn ? 'Crack math geodes for big ore · merge matching miners' : 'Tap the dig face · drag the mine to explore · merge matching miners', C.lime);
  if (!minerCount()) setTimeout(() => say('NO MINERS LEFT', 'Hire one with ore — or open Upgrades and use the code MINERRESCUE', '#ffb3ab'), 2600);
  stat(api,'minerLevel',S.best||1); stat(api,'mineDepth',depthIdx()+1);
  paintBar(); persist();
  A._mines = {openGemTree: () => openGemTree(), get: () => ({gemBank:S.gemBank, gtree:{...S.gtree}, slots:S.grid.length, H, ore:S.ore, life:S.life, grid:S.grid.slice(), up:{...S.up}, codes:{...(S.codes||{})}, depth:depthIdx(), layers:DEPTHS.length, last:DEPTHS[LAST].n, core:core?{hp:core.hp,max:core.max}:null, coreCleared:!!S.coreCleared, cam:{...cam}, foreInt:foreInt(U('auto')), merges:quietMerges}), set: p => { Object.assign(S, p); if (p.up) S.up = {...S.up, ...p.up}; paintBar(); }, cashOut, sellMiner, tapRock: () => { const dp = toScreen(digPoint().x, digPoint().y); tapRock(dp.x, dp.y); }, hurtCore: n => { if (core) { core.hp = n; core.idle = 0; } }, focusDig, zoomAt, foreInt, GEM, DEPTHS};
  return () => { persist(); offK(); offL(); window.removeEventListener('keyup', ku); if (shop) shop.remove(); if (mapO) mapO.remove(); if (gemO) gemO.remove(); A._mines = null; };
}});
})();
