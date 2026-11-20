// Wilderland Arcade · ACTIVE-PLAY ECONOMY: Arcade Expansions, Golden Critters & boosts, Prestige + Diamond Stars, celebrations.
// Rule: there is NO passive income. Tickets only come from playing games. Expansions and boosts only multiply what you earn by playing.
(function(){
'use strict';
const E = {};
const fmt = n => window.WLP ? window.WLP.fmt(n) : String(Math.round(n));
const nice = x => { if (x < 100) return Math.round(x); const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; };

// ---------------- Arcade Expansions (bought with tickets in the Prize Counter; reset on every Rebirth) ----------------
// kind: game = % game payouts · all = % to everything · buff = longer critter boosts
const EXP = [
  {k:'booth',   n:'Prize Booth',        e:'🎪', base:100,   kind:'game', v:.10, d:'+10% tickets from every game', ups:['Shiny Shelves','Bigger Booth','Prize Parade','Booth Boss','Prize Palace','Booth Empire','Prize Universe']},
  {k:'snack',   n:'Snack Bar',          e:'🍿', base:1100,  kind:'buff', v:.10, d:'Golden Critter boosts last 10% longer', ups:['Extra Butter','Combo Meal','Snack Attack','Nacho Tower','Popcorn Storm','Snack Galaxy','Infinite Snacks']},
  {k:'row',     n:'Cabinet Row',        e:'👾', base:12e3,  kind:'game', v:.15, d:'+15% tickets from every game', ups:['Neon Trim','Double Row','Arcade Alley','Cabinet Avenue','Cabinet City','Cabinet Planet','Cabinet Cosmos']},
  {k:'laser',   n:'Laser Tag Arena',    e:'🔫', base:1.4e6, kind:'all',  v:.10, d:'+10% to everything', ups:['Blacklights','Fog Machines','Team Battles','Laser Maze','Laser Legends','Laser Galaxy','Laser Forever']},
  {k:'rink',    n:'Roller Rink',        e:'🛼', base:2e7,   kind:'game', v:.40, d:'+40% tickets from every game', ups:['Disco Ball','Speed Skates','Couples Skate','Rink Rave','Roller Derby','Rink Royale','Rink Infinity']},
  {k:'theme',   n:'Theme Park',         e:'🎢', base:3.3e8, kind:'all',  v:.25, d:'+25% to everything', ups:['Ferris Wheel','Log Flume','Mega Coaster','Park Parade','Night Fireworks','Park Kingdom','Park Universe']},
  {k:'resort',  n:'Wilderland Resort',  e:'🏝️', base:5.1e9, kind:'all',  v:.40, d:'+40% to everything and +20% Learn-mode bonus', ups:['Lazy River','Mountain Spa','Lake Cabins','Resort Gala','Resort Island','Resort Planet','Resort Dream']},
  {k:'moon',    n:'Moon Arcade',        e:'🌙', base:1e12,  kind:'all',  v:.60, d:'+60% to everything', ups:['Low Gravity','Crater Cabinets','Moon Bowling','Lunar Laser','Moon Base','Moon Kingdom','Moon Forever']},
  {k:'galaxy',  n:'Galactic Fun Zone',  e:'🌌', base:1.7e13,kind:'all',  v:1,   d:'+100% to everything', ups:['Star Slides','Comet Coaster','Nebula Nights','Galaxy Games','Galactic Gala','Galaxy Empire','The Big Fun']},
];
// The old click-only expansions (removed). Kept only so old saves can be refunded fairly.
const OLD_CLICK = [{k:'claw', base:15}, {k:'bowl', base:13e4}, {k:'factory', base:7.5e10}];
const MILES = [1,10,25,50,100,150,200];
E.EXP = EXP; E.MILES = MILES;
const lvOf = (P,k) => ((P.exp||{})[k])|0;
const upOf = (P,k) => ((P.expUp||{})[k])|0;           // how many milestone upgrades bought for this expansion
const expMul = (P,k) => Math.pow(1.5, upOf(P,k));      // each milestone upgrade: that expansion works ×1.5
E.expCost = (x, L) => nice(x.base * Math.pow(1.15, L));
E.upCost = (x, i) => nice(x.base * Math.pow(1.15, MILES[i]) * 6);
const sumKind = (P, kind) => EXP.filter(x=>x.kind===kind).reduce((a,x)=>a + lvOf(P,x.k)*x.v*expMul(P,x.k), 0);
// Fair refund for old click-only expansions: every ticket spent on them comes back.
E.clickRefund = P => { let t = 0; OLD_CLICK.forEach(x => { const L = lvOf(P,x.k); for (let i=0;i<L;i++) t += E.expCost(x, i); const u = upOf(P,x.k); for (let i=0;i<u;i++) t += E.upCost(x, i); }); return Math.round(t); };
E.clickKeys = OLD_CLICK.map(x=>x.k);

// ---------------- PRESTIGE: every 10 Rebirths = 1 Diamond Star, spent only in the Prestige Tree ----------------
E.prestige = P => Math.floor((P.rebirths||0) / 10);
E.diamonds = P => E.prestige(P);                                    // Diamond Stars earned (1 per prestige)
E.diaFree = P => Math.max(0, E.diamonds(P) - (P.diaSpent||0));
E.toNextDia = P => 10 - ((P.rebirths||0) % 10);
// Tiers get pricier the deeper they are. Each node needs the one above it in the same branch.
const DCOST = [1, 2, 3, 5];
const PT = [
  // b = branch, t = tier (0-3), fx = what it does
  {id:'all1',  b:'tix',   t:0, n:'Diamond Pockets',   d:'×2 ALL ticket payouts',                               fx:{all:2}},
  {id:'all2',  b:'tix',   t:1, n:'Treasure Vault',    d:'×2 ALL ticket payouts (×4 with the first)',           fx:{all:2}},
  {id:'all3',  b:'tix',   t:2, n:'Ticket Avalanche',  d:'×3 ALL ticket payouts',                               fx:{all:3}},
  {id:'all4',  b:'tix',   t:3, n:'Diamond Fortune',   d:'×5 ALL ticket payouts',                               fx:{all:5}},
  {id:'fav1',  b:'mach',  t:0, n:'Favorite Machine',  d:'×5 payouts on one machine you choose',                fx:{fav:5}},
  {id:'game1', b:'mach',  t:1, n:'Arcade Pro',        d:'×2 payouts on every machine',                         fx:{games:2}},
  {id:'fav2',  b:'mach',  t:2, n:'Machine Master',    d:'Your favorite machine pays ×3 more (×15 total)',      fx:{fav:3}},
  {id:'game2', b:'mach',  t:3, n:'Arcade Legend',     d:'×3 payouts on every machine',                         fx:{games:3}},
  {id:'learn1',b:'learn', t:0, n:'Diamond Scholar',   d:'×3 Learn-mode bonus for correct answers',             fx:{learn:3}},
  {id:'learn2',b:'learn', t:1, n:'Study Buddy',       d:'Learn-mode games pay ×2',                             fx:{learnGame:2}},
  {id:'learn3',b:'learn', t:2, n:'Brain Power',       d:'×3 Learn-mode bonus again (×9 total)',                fx:{learn:3}},
  {id:'learn4',b:'learn', t:3, n:'Genius Diamond',    d:'Learn-mode games pay ×3 more (×6 total)',             fx:{learnGame:3}},
  {id:'combo1',b:'luck',  t:0, n:'Quick Combo',       d:'Combo meter fills twice as fast (+2 per new machine)',fx:{comboStep:2}},
  {id:'luck1', b:'luck',  t:1, n:'Critter Magnet',    d:'Golden critters appear ×2 as often, boosts last ×2 longer', fx:{critter:2, buffLen:2}},
  {id:'combo2',b:'luck',  t:2, n:'Combo Crown',       d:'Combo can go 10 higher and each step counts ×2',     fx:{comboCap:10, combo:2}},
  {id:'luck2', b:'luck',  t:3, n:'Diamond Luck',      d:'Critter boosts ×2 stronger and jackpots ×3 more likely', fx:{buffPow:2, jack:3}},
  {id:'head1', b:'head',  t:0, n:'Head Start',        d:'Start every Rebirth with Ticket Booster Lv 5 on every machine', fx:{boost:5}},
  {id:'head2', b:'head',  t:1, n:'Builder’s Kit',     d:'Start every Rebirth with every Arcade Expansion at Lv 5',       fx:{expLv:5}},
  {id:'head3', b:'head',  t:2, n:'Fast Lane',         d:'Start every Rebirth with Ticket Booster Lv 20 on every machine',fx:{boost:20}},
  {id:'head4', b:'head',  t:3, n:'Mega Arcade',       d:'Start every Rebirth with every Arcade Expansion at Lv 25',      fx:{expLv:25}},
];
const PBR = {tix:['💎','Tickets'], mach:['🕹️','Machines'], learn:['📚','Learning'], luck:['🍀','Combos & Luck'], head:['🚀','Head Starts']};
E.PT = PT; E.DCOST = DCOST;
const owns = (P,id) => !!(P.ptree||{})[id];
E.ptCost = nd => DCOST[nd.t];
E.ptReq = nd => PT.find(x => x.b === nd.b && x.t === nd.t - 1) || null;
// Every Prestige Tree bonus you own, combined (never reset by Rebirth or Prestige).
E.pt = P => { const o = {all:1, games:1, fav:1, learn:1, learnGame:1, comboStep:1, critter:1, buffLen:1, comboCap:0, combo:1, buffPow:1, jack:1, boost:0, expLv:0};
  PT.forEach(nd => { if (!owns(P, nd.id)) return; Object.entries(nd.fx).forEach(([k,v]) => { if (k=='comboCap' || k=='boost' || k=='expLv') o[k] = k=='comboCap' ? o[k]+v : Math.max(o[k], v); else o[k] *= v; }); });
  return o; };
E.favGame = P => P.ptFav || null;
E.ptAll = P => E.pt(P).all;
E.ptGame = (P, g) => (g && g === P.ptFav) ? E.pt(P).fav : 1;
E.ptHead = P => { const o = E.pt(P); return {boost:o.boost, expLv:o.expLv}; };

const SP = (P,k) => window.WLP && window.WLP.perks ? window.WLP.perks(P)[k] : 1; // Wilderland prize powers
E.critterRate = P => E.pt(P).critter * SP(P,'critter');
E.buffLen = P => (1 + .10*lvOf(P,'snack')*expMul(P,'snack')) * E.pt(P).buffLen * SP(P,'buff');
E.luckBonus = P => 0;
E.jackMult = P => E.pt(P).jack;
E.critterReward = P => Math.round(E.pt(P).buffPow * SP(P,'buff') * 10) / 10;
E.comboCap = P => 10 + E.pt(P).comboCap;
E.comboStep = P => E.pt(P).comboStep;
E.comboStrength = P => E.pt(P).combo * SP(P,'combo');
E.comboWarmMs = P => 5 * 60000;
E.learnMult = P => E.pt(P).learn * (1 + .2*lvOf(P,'resort')*expMul(P,'resort'));
E.learnGameMult = P => E.pt(P).learnGame * SP(P,'learn');

// ---------------- boosts from Golden Critters (kept in memory, not saved) ----------------
let BUFFS = [];
const now = () => Date.now();
const live = () => { BUFFS = BUFFS.filter(b => b.until > now()); return BUFFS; };
E.buffs = () => live();
E.buffMult = kind => live().reduce((m,b) => m * ((b.kind===kind || b.kind==='all') ? b.m : 1), 1);
const addBuff = (P, b) => { const len = b.s * 1000 * E.buffLen(P); BUFFS.push({...b, until: now() + len, len}); window.dispatchEvent(new Event('wl-buffs')); };

// ---------------- multipliers used by the arcade ----------------
E.allMult = P => 1 + sumKind(P,'all');
E.gameMult = P => (1 + sumKind(P,'game')) * E.allMult(P) * E.pt(P).games * E.buffMult('game');
E.expLevels = P => EXP.reduce((a,x)=>a+lvOf(P,x.k),0);

// ---------------- a little global CSS for animations ----------------
const css = `
.wle{font-family:"Uncut Sans","Inter",system-ui,sans-serif;color:#121313}
.wle *{box-sizing:border-box}
.wle-wrap{display:grid;grid-template-columns:minmax(260px,1fr) minmax(300px,1.35fr);gap:14px}
@media (max-width:720px){.wle-wrap{grid-template-columns:1fr}}
.wle-card{background:#fff;border-radius:16px;padding:14px}
.wle-pop{position:absolute;pointer-events:none;font-weight:800;color:#015640;text-shadow:0 2px 0 #fff,0 0 8px #fff;animation:wleRise .9s ease-out forwards;white-space:nowrap}
.wle-pp{position:absolute;width:7px;height:7px;border-radius:50%;pointer-events:none;animation:wleBurst .7s ease-out forwards}
.wle-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:#f6f3e6;margin-bottom:6px}
.wle-row.can{background:#fff;box-shadow:0 0 0 2px #D5F367 inset}
.wle-ic{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px;background:radial-gradient(circle at 35% 30%,#fff,#D5F367 55%,#00B451);box-shadow:inset 0 -4px 0 rgba(0,0,0,.15),0 3px 6px rgba(0,0,0,.18);flex-shrink:0}
.wle-ic.bump{animation:wleBump .4s cubic-bezier(.3,1.6,.5,1)}
.wle-btn{border:none;border-radius:999px;padding:8px 12px;font:700 13px inherit;font-family:inherit;cursor:pointer;background:#015640;color:#fff;white-space:nowrap}
.wle-btn:disabled{background:#d9d5c3;color:#6a6a6a;cursor:default}
.wle-btn.alt{background:#fff;color:#015640;border:1.5px solid #015640}
.wle-tab{border:none;border-radius:999px;padding:8px 14px;font:700 13px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#015640}
.wle-tab.on{background:#015640;color:#fff}
.wle-small{font-size:12px;color:#4a4a4a}
.wle-h{font-size:12px;font-weight:700;letter-spacing:.12em;color:#AB2372;margin:12px 0 6px}
.wle-buffs{display:flex;gap:6px;flex-wrap:wrap}
.wle-buff{background:#F9BF01;color:#121313;border-radius:999px;padding:4px 10px;font-weight:800;font-size:12px}
.wle-critter{position:fixed;z-index:985;font-size:44px;cursor:pointer;filter:drop-shadow(0 0 10px #F9BF01) drop-shadow(0 0 3px #fff);user-select:none;transition:left 9s linear;animation:wleHop .45s ease-in-out infinite alternate}
.wle-fly{position:fixed;z-index:995;font-size:22px;pointer-events:none;transition:transform .8s cubic-bezier(.5,0,.2,1),opacity .8s}
.wle-raincv{position:fixed;inset:0;width:100vw;height:100vh;z-index:990;pointer-events:none}
.wle-rainpill{position:fixed;left:50%;top:58px;transform:translateX(-50%);z-index:991;background:#F9BF01;color:#121313;font:800 14px "Uncut Sans",system-ui,sans-serif;border-radius:999px;padding:8px 16px;box-shadow:0 4px 18px rgba(0,0,0,.35);pointer-events:none;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis}
.wle-rainpill.done{background:#D5F367;color:#015640}
.wle-node{border-radius:12px;padding:8px;text-align:center;font-size:12px;font-weight:700;border:2px solid #d9d5c3;background:#f6f3e6;cursor:pointer;min-height:78px;display:flex;flex-direction:column;justify-content:center;gap:2px}
.wle-node.own{background:#F9BF01;border-color:#c48a00;color:#121313}
.wle-node.next{background:#fff;border-color:#015640;color:#015640}
.wle-node.lock{opacity:.55;cursor:default}
.wle-node.dia{background:linear-gradient(160deg,#C7F1EE,#64CDF5);border-color:#0b6e9a;color:#06324a}
.wle-dia{background:radial-gradient(circle at 50% 40%,rgba(100,205,245,.55),rgba(5,15,30,.97) 70%)}
.wle-gem{font-size:84px;line-height:1;animation:wleGem 1.6s ease-in-out infinite;filter:drop-shadow(0 0 22px #64CDF5)}
@keyframes wleGem{0%,100%{transform:scale(1) rotate(-8deg)}50%{transform:scale(1.18) rotate(8deg)}}
.wle-celebrate{position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;padding:16px;background:radial-gradient(circle at 50% 40%,rgba(249,191,1,.45),rgba(10,20,15,.96) 70%);animation:wleFade .3s ease-out;font-family:"Uncut Sans","Inter",system-ui,sans-serif;overflow-y:auto}
.wle-celebrate .card{background:#fff;border-radius:24px;padding:22px;max-width:520px;width:100%;text-align:center;box-shadow:0 0 0 5px #F9BF01,0 0 80px rgba(249,191,1,.7);animation:wlePopIn .55s cubic-bezier(.2,1.5,.4,1) both}
@keyframes wleRise{from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,-70px);opacity:0}}
@keyframes wleBurst{to{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0}}
@keyframes wleBump{0%{transform:scale(1)}50%{transform:scale(1.25) rotate(-6deg)}100%{transform:scale(1)}}
@keyframes wleHop{from{transform:translateY(0) rotate(-6deg)}to{transform:translateY(-10px) rotate(6deg)}}
@keyframes wleFall{from{transform:translateY(-60px) rotate(0)}to{transform:translateY(110vh) rotate(360deg)}}
@keyframes wleFade{from{opacity:0}}
@keyframes wlePopIn{0%{transform:scale(.3) rotate(-8deg);opacity:0}100%{transform:none;opacity:1}}
@media (prefers-reduced-motion: reduce){.wle *, .wle-critter, .wle-celebrate .card{animation:none!important;transition:none!important}}
`;
const ensureCss = () => { if (document.getElementById('wle-css')) return; const s = document.createElement('style'); s.id = 'wle-css'; s.textContent = css; document.head.appendChild(s); };
const el = (tag, props, ...kids) => { const e = document.createElement(tag); if (props) for (const k in props) { if (k=='style') Object.assign(e.style, props.style); else if (k.startsWith('on')) e[k] = props[k]; else if (k=='cls') e.className = props[k]; else if (k=='html') e.innerHTML = props[k]; else e.setAttribute(k, props[k]); }
  kids.flat().forEach(k => { if (k==null || k===false) return; e.appendChild(typeof k=='object' ? k : document.createTextNode(String(k))); }); return e; };
const reduced = () => (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || (window.Arcade && window.Arcade.lowFx);

// ---------------- flying tickets into the header counter ----------------
E.fly = (n, from) => { if (reduced() || typeof document=='undefined') return; ensureCss(); const tgt = document.getElementById('wl-tix'); if (!tgt) return; const r = tgt.getBoundingClientRect();
  const sx = from ? from.x : innerWidth/2, sy = from ? from.y : innerHeight/2, count = Math.max(1, Math.min(10, Math.ceil(Math.log10(n+1)*2)));
  for (let i=0;i<count;i++) { const f = el('div', {cls:'wle-fly', style:{left:(sx + (Math.random()-.5)*60)+'px', top:(sy + (Math.random()-.5)*40)+'px'}}, '🎟️'); document.body.appendChild(f);
    setTimeout(()=>{ f.style.transform = 'translate('+(r.left + r.width/2 - parseFloat(f.style.left))+'px,'+(r.top + r.height/2 - parseFloat(f.style.top))+'px) scale(.6)'; f.style.opacity = '.2'; }, 30 + i*55);
    setTimeout(()=>f.remove(), 950 + i*55); } };

// ---------------- Golden Critters (only while you're actively playing) ----------------
let host = null, critTimer = null, nextCrit = now() + 45000 + Math.random()*60000;
E.attach = api => { host = api; ensureCss(); if (critTimer) return;
  critTimer = setInterval(() => { if (!host) return; const P = host.P(); if (host.admin && host.admin()) return; if (document.hidden) return;
    if (now() - (window.Arcade && window.Arcade.lastAct || 0) > 15000) { nextCrit = Math.max(nextCrit, now() + 20000); return; }
    if (now() < nextCrit || document.querySelector('.wle-critter')) return;
    nextCrit = now() + (70000 + Math.random()*110000) / E.critterRate(P); spawnCritter(); }, 1000); };
const CRITTERS = ['🐿️','🦊','🐦','🐇','🦔','🦉'];
const spawnCritter = () => { const fromLeft = Math.random() < .5, y = 90 + Math.random()*(innerHeight - 220);
  const c = el('div', {cls:'wle-critter', title:'Golden Critter! Click it!', style:{top:y+'px', left:(fromLeft? -70 : innerWidth+20)+'px', transform: fromLeft ? 'scaleX(-1)' : ''}}, CRITTERS[Math.floor(Math.random()*CRITTERS.length)]);
  c.onclick = e => { e.stopPropagation(); catchCritter(c, e); };
  document.body.appendChild(c); window.Arcade && window.Arcade.tone && window.Arcade.tone(1320,.1,'sine',.05);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ c.style.left = (fromLeft ? innerWidth + 40 : -90)+'px'; }));
  setTimeout(()=>c.remove(), 9500); };
const catchCritter = (c, ev) => { if (!host) return; c.remove(); const P = host.P(), R = E.critterReward(P);
  const r = Math.random(); let msg;
  if (r < .42) { addBuff(P, {kind:'all', m:7*R, s:30, n:'FRENZY ×'+(Math.round(7*R*10)/10)}); msg = 'FRENZY! Everything pays ×'+(Math.round(7*R*10)/10)+' for a bit'; }
  else if (r < .66) { addBuff(P, {kind:'game', m:3*R, s:90, n:'DOUBLE TIME ×'+(Math.round(3*R*10)/10)}); msg = 'DOUBLE TIME! Games pay ×'+(Math.round(3*R*10)/10)+' for 90 seconds'; }
  else if (r < .86) { const need = window.WLP ? window.WLP.rebirthNeed(P) : 1e7; const gain = Math.min(Math.max(50, (P.tickets||0)*.15), need*.04) * R; host.addTix(Math.round(gain), {x:ev.clientX, y:ev.clientY}); msg = 'LUCKY JACKPOT! +'+fmt(gain)+' tickets'; }
  else { ticketRain(P); msg = 'TICKET RAIN! Click the falling tickets!'; }
  host.toast(msg); host.sfx('win'); host.setP({critters:(P.critters||0)+1}); };
// Ticket Rain: one light canvas on top of everything (also full screen and games). Tickets fall for the whole boost;
// tap one to catch it for double value, or let it land — every ticket that lands still goes into your counter.
let rainOn = null;
const ticketRain = P => { const need = window.WLP ? window.WLP.rebirthNeed(P) : 1e7; const val = Math.max(5, Math.round(Math.min(need*.0015, Math.max(20, (P.tickets||0)*.004)) * E.critterReward(P)));
  const dur = 9000*E.buffLen(P); if (rainOn) { rainOn.end += dur; return; }
  const dpr = Math.min(2, window.devicePixelRatio||1), cv = el('canvas', {cls:'wle-raincv', 'aria-hidden':'true'}), pill = el('div', {cls:'wle-rainpill'}); document.body.append(cv, pill);
  const g = cv.getContext('2d'); let W = 0, H = 0; const size = () => { W = innerWidth; H = innerHeight; cv.width = W*dpr; cv.height = H*dpr; g.setTransform(dpr,0,0,dpr,0,0); }; size(); addEventListener('resize', size);
  const R = rainOn = {end: now() + dur, total:0, caught:0, landed:0, pend:0}, tix = [], low = () => reduced(), every = () => low() ? 520 : 260;
  let nextDrop = 0, last = now(), flushT = 0, raf = 0;
  const add = (n, from) => { R.total += n; R.pend += n; if (from) E.fly(n, from); };
  const flush = () => { if (R.pend && host) { host.addTix(R.pend); R.pend = 0; } };
  const hit = e => { const x = e.clientX, y = e.clientY; let best = null, bd = 44*44;
    for (const t of tix) { if (t.dead) continue; const tx = t.dx==null ? t.x : t.dx; const d = (tx-x)*(tx-x) + (t.y-y)*(t.y-y); if (d < bd) { bd = d; best = t; } }
    if (!best) return; e.preventDefault(); e.stopPropagation(); best.dead = 1; R.caught++; add(best.v*2, {x, y}); burst(x, y);
    window.Arcade && window.Arcade.tone && window.Arcade.tone(900+Math.random()*400,.05,'triangle',.04); };
  addEventListener('pointerdown', hit, true);
  const sparks = []; const burst = (x, y) => { if (low()) return; for (let i=0;i<8;i++) { const a = Math.random()*6.28; sparks.push({x, y, vx:Math.cos(a)*160, vy:Math.sin(a)*160-60, t:.5}); } };
  const tkt = (x, y, r) => { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-15, -8, 34, 22); g.fillStyle = '#F9BF01'; g.beginPath(); if (g.roundRect) g.roundRect(-18, -12, 36, 24, 5); else g.rect(-18,-12,36,24); g.fill();
    g.fillStyle = '#fff3b0'; g.fillRect(-18, -12, 36, 5); g.fillStyle = '#c48a00'; g.beginPath(); g.arc(-18, 0, 4, 0, 6.28); g.arc(18, 0, 4, 0, 6.28); g.fill();
    g.strokeStyle = '#8a5a00'; g.setLineDash([2,2]); g.beginPath(); g.moveTo(-8, -10); g.lineTo(-8, 10); g.stroke(); g.setLineDash([]); g.fillStyle = '#5a3a00'; g.font = '800 11px "Uncut Sans",system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('🎟', 5, 4); g.restore(); };
  const frame = () => { const t = now(), dt = Math.min(.05, (t-last)/1000); last = t; const live = t < R.end;
    if (live && t >= nextDrop) { nextDrop = t + every(); const n = low() ? 2 : 1; for (let i=0;i<n;i++) tix.push({x: 30 + Math.random()*(W-60), y: -30, vy: H/(2.6 + Math.random()*1.4), r: Math.random()*6, vr: (Math.random()-.5)*3, sw: Math.random()*6, v: val}); }
    g.clearRect(0, 0, W, H);
    for (const k of tix) { if (k.dead) continue; k.y += k.vy*dt; k.r += k.vr*dt; k.sw += dt*2; const x = k.x + Math.sin(k.sw)*12;
      if (k.y > H - 20) { k.dead = 1; R.landed++; add(k.v, low() ? null : {x, y:H-30}); continue; } tkt(x, k.y, Math.sin(k.r)*.5); k.dx = x; }
    for (let i = tix.length-1; i >= 0; i--) if (tix[i].dead) tix.splice(i,1);;
    for (const p of sparks) { p.t -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 400*dt; if (p.t > 0) { g.globalAlpha = p.t*2; g.fillStyle = '#F9BF01'; g.fillRect(p.x-2, p.y-2, 4, 4); } } g.globalAlpha = 1; for (let i = sparks.length-1; i >= 0; i--) if (sparks[i].t <= 0) sparks.splice(i,1);
    flushT -= dt; if (flushT <= 0) { flushT = .5; flush(); }
    pill.textContent = live ? '🎟 TICKET RAIN · '+Math.ceil((R.end-t)/1000)+'s · +'+fmt(R.total)+' · tap tickets for ×2!' : '🎟 TICKET RAIN · +'+fmt(R.total);
    if (!live && !tix.length) { flush(); cancelAnimationFrame(raf); removeEventListener('pointerdown', hit, true); removeEventListener('resize', size); cv.remove(); rainOn = null;
      pill.textContent = '🎟 Ticket Rain gave you +'+fmt(R.total)+' tickets ('+R.caught+' caught, '+R.landed+' landed)'; pill.classList.add('done'); setTimeout(()=>pill.remove(), 4500);
      if (host) { host.toast('TICKET RAIN OVER · +'+fmt(R.total)+' TICKETS'); host.sfx('win'); } return; }
    raf = requestAnimationFrame(frame); };
  // touch: hit test uses the real ticket position (with sway)
  raf = requestAnimationFrame(frame);
  E._rain = () => rainOn; };
E.ticketRain = P => ticketRain(P || (host && host.P()));

// ---------------- Arcade Expansions panel (Prize Counter tab) ----------------
E.expPanel = api => { ensureCss(); const p = api.P(), need = window.WLP ? window.WLP.rebirthNeed(p) : Infinity, box = el('div', {cls:'wle'});
  let buyN = api.buyN || 1;
  const buyExp = (x, n) => { if (api.admin && api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); const pp = api.P(); let L = lvOf(pp,x.k), spent = 0, bought = 0, t = pp.tickets||0;
    for (let i=0;i<n;i++) { const c = E.expCost(x, L+bought); if (t - spent < c || c >= need) break; spent += c; bought++; }
    if (!bought) return api.sfx('bad'); api.setP({tickets:t-spent, exp:{...(pp.exp||{}), [x.k]:L+bought}}); api.sfx('coin'); api.rerender(x.k); };
  const buyUp = (x, i) => { if (api.admin && api.admin()) return; const pp = api.P(), c = E.upCost(x,i); if (upOf(pp,x.k) !== i || lvOf(pp,x.k) < MILES[i] || (pp.tickets||0) < c || c >= need) return api.sfx('bad');
    api.setP({tickets:pp.tickets-c, expUp:{...(pp.expUp||{}), [x.k]:i+1}}); api.sfx('win'); api.toast(x.ups[i].toUpperCase()+' · '+x.n.toUpperCase()+' ×1.5'); api.rerender(x.k); };
  box.appendChild(el('div', {cls:'wle-card', style:{marginBottom:'10px'}}, el('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, '🎢 Arcade Expansions · '+E.expLevels(p)+' levels'),
    el('div', {cls:'wle-small'}, 'Expansions only boost what you earn by PLAYING — they never make tickets on their own. Costs rise every level. Special upgrades unlock at levels 1, 10, 25, 50, 100, 150 and 200. All expansions reset on every Rebirth.'),
    el('div', {style:{marginTop:'6px', fontWeight:700, color:'#015640', fontSize:'13px'}}, 'From expansions now: games ×'+fmt((1+sumKind(p,'game'))*E.allMult(p))+' · everything ×'+fmt(E.allMult(p)))));
  const bn = el('div', {style:{display:'flex', gap:'6px', alignItems:'center', marginBottom:'8px', flexWrap:'wrap'}}, el('b', {style:{color:'#015640', fontSize:'13px'}}, 'Buy:'));
  [1,10,100].forEach(n => bn.appendChild(el('button', {cls:'wle-btn'+(buyN==n?'':' alt'), onclick:()=>{ api.setBuyN(n); api.rerender(); }}, '×'+n))); box.appendChild(bn);
  EXP.forEach((x, idx) => { const L = lvOf(p,x.k), c = E.expCost(x,L), can = (p.tickets||0) >= c && c < need, hidden = idx > 0 && lvOf(p, EXP[idx-1].k) === 0 && L === 0 && (p.tickets||0) < x.base*.3;
    if (hidden) { box.appendChild(el('div', {cls:'wle-row', style:{opacity:.5}}, el('div', {cls:'wle-ic', style:{filter:'grayscale(1) brightness(.6)'}}, '?'), el('div', {style:{flex:1}}, el('b', null, '???'), el('div', {cls:'wle-small'}, 'Unlocks when you’re close to '+fmt(x.base)+' tickets')))); return; }
    const ic = el('div', {cls:'wle-ic'+(api.bump===x.k?' bump':'')}, x.e);
    const info = el('div', {style:{flex:1, minWidth:0}}, el('div', {style:{fontWeight:700, color:'#015640'}}, x.n+'  ', el('span', {style:{fontSize:'12px', color:'#8a8a8a'}}, 'lv '+L)), el('div', {cls:'wle-small'}, x.d+(upOf(p,x.k)?' · ×'+fmt(expMul(p,x.k))+' from upgrades':'')));
    const i = upOf(p,x.k); if (i < MILES.length && L >= MILES[i]) { const uc = E.upCost(x,i); const ub = el('button', {cls:'wle-btn', style:{background:'#AB2372', marginTop:'4px'}, onclick:()=>buyUp(x,i)}, '★ '+x.ups[i]+' (×1.5) · '+fmt(uc)); if ((p.tickets||0) < uc || uc >= need) ub.disabled = true; info.appendChild(ub); }
    else if (i < MILES.length) info.appendChild(el('div', {style:{fontSize:'11px', color:'#AB2372', fontWeight:700}}, 'Next upgrade “'+x.ups[i]+'” at level '+MILES[i]));
    let tot = 0, nb = 0; for (let k=0;k<buyN;k++) { const cc = E.expCost(x, L+k); if (cc >= need || (nb && tot + cc > (p.tickets||0))) break; tot += cc; nb++; }
    const b = el('button', {cls:'wle-btn', onclick:()=>buyExp(x, buyN)}, c >= need ? 'Next run' : (nb > 1 ? '×'+nb+' · ' : '')+fmt(tot || c)+' 🎟'); if (!can) b.disabled = true;
    box.appendChild(el('div', {cls:'wle-row'+(can?' can':'')}, ic, info, b)); });
  return box; };

// ---------------- Prestige Tree panel (Prize Counter tab) ----------------
E.ptPanel = api => { ensureCss(); const p = api.P(), box = el('div', {cls:'wle'}), free = E.diaFree(p), rb = p.rebirths||0, toNext = E.toNextDia(p);
  const games = (api.games ? api.games() : []).filter(g => g.id !== '2048');
  box.appendChild(el('div', {cls:'wle-card', style:{marginBottom:'10px', background:'linear-gradient(160deg,#f2fbff,#dff3ff)', boxShadow:'0 0 0 3px #64CDF5 inset'}},
    el('div', {style:{display:'flex', justifyContent:'space-between', gap:'8px', flexWrap:'wrap', alignItems:'center'}},
      el('div', {style:{fontWeight:800, fontSize:'20px', color:'#0b4a6e'}}, '💎 Prestige '+E.prestige(p)+' · '+free+' Diamond Star'+(free==1?'':'s')+' to spend'),
      el('div', {style:{fontWeight:700, color:'#0b4a6e', fontSize:'13px'}}, 'Rebirth '+(rb%10)+' / 10 to next Diamond Star')),
    el('div', {style:{height:'12px', background:'#ffffff', borderRadius:'999px', overflow:'hidden', margin:'8px 0'}}, el('div', {style:{height:'100%', width:((rb%10)*10)+'%', background:'linear-gradient(90deg,#64CDF5,#ffffff,#a64be0)'}})),
    el('div', {cls:'wle-small'}, 'Every 10 Rebirths you Prestige and earn 1 Diamond Star ('+toNext+' more Rebirth'+(toNext==1?'':'s')+' to go). Diamond Stars are spent only here. Prestige Tree bonuses are permanent: they survive every Rebirth and every Prestige. Prestiging doesn’t reset anything extra.')));
  const grid = el('div', {style:{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'10px'}});
  Object.entries(PBR).forEach(([b, [ic, nm]]) => { const col = el('div', {cls:'wle-card'}, el('div', {style:{fontWeight:800, color:'#0b4a6e', marginBottom:'6px'}}, ic+' '+nm));
    PT.filter(nd => nd.b === b).forEach((nd, i, arr) => { const own = owns(p, nd.id), req = E.ptReq(nd), reqOk = !req || owns(p, req.id), cost = E.ptCost(nd), can = !own && reqOk && free >= cost;
      const needTxt = own ? '✓ owned · permanent' : !reqOk ? '🔒 Needs “'+req.n+'” first · '+cost+' 💎' : free < cost ? 'Needs '+cost+' 💎 (you have '+free+')' : 'Unlock for '+cost+' 💎';
      const node = el('div', {cls:'wle-node '+(own?'own dia':can?'next':'lock'), title:nd.d, onclick:()=>{ if (api.admin && api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); if (!can) return api.sfx('bad');
          const pp = api.P(); const patch = {ptree:{...(pp.ptree||{}), [nd.id]:true}, diaSpent:(pp.diaSpent||0)+cost};
          if (nd.fx.fav && !pp.ptFav) { const pl = pp.played||{}; patch.ptFav = (games.slice().sort((a,c)=>(pl[c.id]||0)-(pl[a.id]||0))[0]||{}).id || 'snake'; }
          api.setP(patch); if (window.WLP && window.WLP.applyHead) { const hd = window.WLP.applyHead(api.P()); if (hd) api.setP(hd); }
          api.sfx('win'); api.toast('PRESTIGE TREE · '+nd.n.toUpperCase()+' · '+nd.d.toUpperCase()); api.rerender(); }},
        el('div', null, nd.n), el('div', {style:{fontWeight:500}}, nd.d), el('div', {style:{fontSize:'11px'}}, needTxt));
      col.appendChild(node);
      if (own && nd.fx.fav) { const sel = el('select', {style:{width:'100%', marginTop:'4px', fontFamily:'inherit', fontSize:'12px', borderRadius:'8px', padding:'3px'}, 'aria-label':'Favorite machine', onchange:e => { api.setP({ptFav:e.target.value}); api.toast('FAVORITE MACHINE · '+e.target.selectedOptions[0].textContent.toUpperCase()); api.rerender(); }});
        games.forEach(g => { const o = el('option', {value:g.id}, g.title); if (g.id === p.ptFav) o.selected = true; sel.appendChild(o); }); col.appendChild(el('div', {cls:'wle-small', style:{marginTop:'4px'}}, 'Favorite machine (change any time):'), sel); }
      if (i < arr.length-1) col.appendChild(el('div', {style:{height:'6px', width:'3px', background:own?'#64CDF5':'#d9d5c3', margin:'0 auto'}})); });
    grid.appendChild(col); });
  box.appendChild(grid);
  const o = E.pt(p), L = [];
  if (o.all > 1) L.push('×'+fmt(o.all)+' all tickets'); if (o.games > 1) L.push('×'+fmt(o.games)+' every machine'); if (o.fav > 1 && p.ptFav) L.push('×'+fmt(o.fav)+' on '+((games.find(g=>g.id==p.ptFav)||{}).title||p.ptFav));
  if (o.learn > 1) L.push('×'+fmt(o.learn)+' Learn bonus'); if (o.learnGame > 1) L.push('×'+fmt(o.learnGame)+' Learn-mode games'); if (o.comboStep > 1) L.push('combo fills ×'+o.comboStep+' faster');
  if (o.critter > 1) L.push('critters ×'+o.critter+' as often'); if (o.buffLen > 1) L.push('boosts ×'+o.buffLen+' longer'); if (o.buffPow > 1) L.push('boosts ×'+o.buffPow+' stronger'); if (o.jack > 1) L.push('jackpots ×'+o.jack+' more likely');
  if (o.comboCap) L.push('combo +'+o.comboCap+' higher'); if (o.boost) L.push('Ticket Booster Lv '+o.boost+' head start'); if (o.expLv) L.push('expansions Lv '+o.expLv+' head start');
  box.appendChild(el('div', {cls:'wle-card', style:{marginTop:'10px'}}, el('b', {style:{color:'#0b4a6e'}}, '💎 Your Prestige bonuses: '), L.length ? L.join(' · ') : 'none yet — earn your first Diamond Star at Rebirth 10.'));
  return box; };


// ---------------- goals / milestone track ----------------
E.goals = P => { const W = window.WLP, out = [], need = W ? W.rebirthNeed(P) : 1e7;
  out.push({e:'⭐', n:'Next Rebirth', pct:(P.tickets||0)/need*100, txt:fmt(P.tickets||0)+' / '+fmt(need)+' tickets'});
  out.push({e:'💎', n:'Next Diamond Star', pct:((P.rebirths||0)%10)*10, txt:'Rebirth '+((P.rebirths||0)%10)+' / 10'});
  const el2 = E.expLevels(P), eg = [10,50,100,250,500,1000,2500].find(x=>x>el2)||5000; out.push({e:'🎢', n:'Own '+eg+' expansion levels', pct:el2/eg*100, txt:el2+' / '+eg});
  const cr = P.critters||0, cgg = [1,10,25,100,250].find(x=>x>cr)||500; out.push({e:'🦊', n:'Catch '+cgg+' Golden Critters', pct:cr/cgg*100, txt:cr+' / '+cgg});
  if (W) { const st = W.colStatus(P).filter(c=>!c.done).sort((a,b)=>b.own/b.size - a.own/a.size)[0]; if (st) out.push({e:st.e, n:'Complete '+st.n, pct:st.own/st.size*100, txt:st.own+' / '+st.size+' prizes'}); }
  return out; };


// ---------------- Rebirth celebration ----------------
E.celebrate = (info) => { ensureCss(); const o = el('div', {cls:'wle-celebrate'});
  const card = el('div', {cls:'card'},
    el('div', {style:{fontSize:'52px'}}, '🌟'),
    el('div', {style:{fontWeight:800, letterSpacing:'.2em', color:'#AB2372', fontSize:'13px'}}, 'REBIRTH #'+info.n),
    el('div', {style:{fontWeight:800, fontSize:'32px', color:'#015640', margin:'4px 0'}}, '+'+info.stars+' Golden Star'+(info.stars>1?'s':'')+'!'),
    el('div', {style:{fontSize:'14px', color:'#3d3d3d', marginBottom:'10px'}}, 'You now have '+info.total+' Golden Stars ('+info.free+' to spend on Wilderland prizes). Every payout is now ×'+fmt(info.starMult)+' from stars.'+(info.toDia ? ' '+info.toDia+' more Rebirth'+(info.toDia==1?'':'s')+' to your next 💎 Diamond Star.' : '')),
    el('div', {style:{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', textAlign:'left', fontSize:'13px'}},
      el('div', {style:{background:'#fff1ef', borderRadius:'12px', padding:'10px'}}, el('b', {style:{color:'#B3001B'}}, 'Reset to zero'), el('div', null, '• Tickets'), el('div', null, '• Arcade Expansions'), el('div', null, '• Upgrade Workshop'), el('div', null, '• Multiplier shop'), el('div', null, '• Saved game runs'), el('div', null, '• The Mines (depth kept)')),
      el('div', {style:{background:'#eefbe8', borderRadius:'12px', padding:'10px'}}, el('b', {style:{color:'#007a37'}}, 'You keep forever'), el('div', null, '• Golden Stars & Wilderland prizes'), el('div', null, '• Diamond Stars & Prestige Tree'), el('div', null, '• Prizes & collections'), el('div', null, '• Achievements'), el('div', null, '• High scores'), el('div', null, '• Avatar & cosmetics'))),
    el('div', {style:{marginTop:'12px', fontWeight:700, color:'#015640'}}, 'Next Rebirth at '+fmt(info.next)+' tickets'),
    el('button', {cls:'wle-btn', style:{marginTop:'14px', padding:'12px 26px', fontSize:'15px'}, onclick:()=>o.remove()}, 'Let’s go!'));
  o.appendChild(card);
  if (!reduced()) for (let i=0;i<60;i++) { const a = Math.random()*7, d = 150+Math.random()*450; const pp = el('div', {cls:'wle-pp', style:{left:'50%', top:'40%', width:'10px', height:'10px', background:['#F9BF01','#D5F367','#EA55AB','#64CDF5','#fff'][i%5], animationDuration:'1.4s'}}); pp.style.setProperty('--dx', Math.cos(a)*d+'px'); pp.style.setProperty('--dy', Math.sin(a)*d+'px'); o.appendChild(pp); }
  document.body.appendChild(o);
  if (window.Arcade && window.Arcade.tone) [523,659,784,1046,1318,1568].forEach((f,i)=>window.Arcade.tone(f,.2,'triangle',.06,i*.1)); };

// ---------------- Prestige (Diamond Star) celebration ----------------
E.diamond = info => { ensureCss(); const o = el('div', {cls:'wle-celebrate wle-dia'});
  const card = el('div', {cls:'card', style:{boxShadow:'0 0 0 5px #64CDF5,0 0 120px rgba(100,205,245,.9)'}},
    el('div', {cls:'wle-gem'}, '💎'),
    el('div', {style:{fontWeight:800, letterSpacing:'.2em', color:'#0b4a6e', fontSize:'13px'}}, 'PRESTIGE '+info.level+' · REBIRTH #'+info.rebirths),
    el('div', {style:{fontWeight:800, fontSize:'32px', color:'#0b4a6e', margin:'4px 0'}}, '+1 Diamond Star!'),
    el('div', {style:{fontSize:'14px', color:'#3d3d3d'}}, 'You have '+info.free+' Diamond Star'+(info.free==1?'':'s')+' to spend in the Prestige Tree (Prize Counter → Prestige 💎). Its bonuses last forever — through every Rebirth and every Prestige.'),
    el('div', {style:{marginTop:'8px', fontWeight:700, color:'#0b4a6e'}}, 'Next Diamond Star at Rebirth '+((info.level+1)*10)),
    el('button', {cls:'wle-btn', style:{marginTop:'14px', padding:'12px 26px', fontSize:'15px', background:'#0b4a6e'}, onclick:()=>{ document.querySelectorAll('.wle-celebrate').forEach(x=>x.remove()); info.open && info.open(); }}, 'Open the Prestige Tree'),
    el('button', {cls:'wle-btn alt', style:{marginTop:'8px', marginLeft:'6px'}, onclick:()=>o.remove()}, 'Later'));
  o.appendChild(card);
  if (!reduced()) for (let i=0;i<90;i++) { const a = Math.random()*7, d = 180+Math.random()*520; const pp = el('div', {cls:'wle-pp', style:{left:'50%', top:'40%', width:(6+Math.random()*10)+'px', height:(6+Math.random()*10)+'px', borderRadius:'2px', transform:'rotate(45deg)', background:['#64CDF5','#ffffff','#a64be0','#C7F1EE','#4a5cff'][i%5], animationDuration:(1.2+Math.random()*.8)+'s'}}); pp.style.setProperty('--dx', Math.cos(a)*d+'px'); pp.style.setProperty('--dy', Math.sin(a)*d+'px'); o.appendChild(pp); }
  document.body.appendChild(o);
  if (window.Arcade && window.Arcade.tone) [784,988,1175,1568,1976,2349,3136].forEach((f,i)=>window.Arcade.tone(f,.25,'sine',.06,i*.11)); };

// ---------------- one-time welcome to the new economy ----------------
E.welcome = (info) => { ensureCss(); const o = el('div', {cls:'wle-celebrate', style:{background:'rgba(1,40,30,.92)'}});
  const card = el('div', {cls:'card', style:{boxShadow:'0 0 0 5px #D5F367,0 0 60px rgba(213,243,103,.5)'}},
    el('div', {style:{fontSize:'48px'}}, '🎟️'), el('div', {style:{fontWeight:800, fontSize:'26px', color:'#015640'}}, 'Welcome to the new arcade!'),
    el('div', {style:{fontSize:'14px', color:'#3d3d3d', margin:'6px 0 10px'}}, 'Your save moved over. Here’s what you have:'),
    el('div', {style:{textAlign:'left', fontSize:'14px', background:'#f6f3e6', borderRadius:'12px', padding:'10px 14px', lineHeight:1.7}}, ...info.lines.map(l => el('div', null, '✓ '+l))),
    el('div', {style:{textAlign:'left', fontSize:'13px', marginTop:'10px', lineHeight:1.6}}, el('b', null, 'New: '), 'Arcade Expansions in the Prize Counter, Golden Critters with boosts, Wilderland prizes with permanent powers (bought with Golden Stars), Prestige every 10 Rebirths with Diamond Stars and a Prestige Tree, and Rebirth that happens automatically. There is no passive income — tickets come from playing.'),
    el('button', {cls:'wle-btn', style:{marginTop:'14px', padding:'12px 26px', fontSize:'15px'}, onclick:()=>o.remove()}, 'Start playing'));
  o.appendChild(card); document.body.appendChild(o); };

window.WLE = E;
})();
