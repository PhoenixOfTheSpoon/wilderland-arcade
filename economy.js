// Wilderland Arcade · IDLE-FREE ECONOMY: Golden Ticket clicker, Arcade Expansions, Golden Critters & boosts, Star Tree.
// Rule: there is NO passive income. Tickets only come from playing games and clicking. Expansions only boost active play.
(function(){
'use strict';
const E = {};
const fmt = n => window.WLP ? window.WLP.fmt(n) : String(Math.round(n));
const nice = x => { if (x < 100) return Math.round(x); const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; };

// ---------------- Arcade Expansions (bought with tickets, levels forever, cost ×1.15 per level) ----------------
// kind: click = adds click power · clickPct = % click power · game = % game payouts · all = % to everything · buff = longer boosts
const EXP = [
  {k:'claw',    n:'Claw Machine',       e:'🕹️', base:15,    kind:'click',    v:1,   d:'+1 ticket per Golden Ticket click', ups:['Greased Claws','Double Grabber','Prize Magnet','Golden Claw','Mega Claw','Claw Kingdom','Infinite Claw']},
  {k:'booth',   n:'Prize Booth',        e:'🎪', base:100,   kind:'game',     v:.10, d:'+10% tickets from every game', ups:['Shiny Shelves','Bigger Booth','Prize Parade','Booth Boss','Prize Palace','Booth Empire','Prize Universe']},
  {k:'snack',   n:'Snack Bar',          e:'🍿', base:1100,  kind:'buff',     v:.10, d:'Golden Critter boosts last 10% longer', ups:['Extra Butter','Combo Meal','Snack Attack','Nacho Tower','Popcorn Storm','Snack Galaxy','Infinite Snacks']},
  {k:'row',     n:'Cabinet Row',        e:'👾', base:12e3,  kind:'game',     v:.15, d:'+15% tickets from every game', ups:['Neon Trim','Double Row','Arcade Alley','Cabinet Avenue','Cabinet City','Cabinet Planet','Cabinet Cosmos']},
  {k:'bowl',    n:'Bowling Lane',       e:'🎳', base:13e4,  kind:'clickPct', v:.25, d:'+25% click power', ups:['Strike!','Spare Lanes','Glow Bowling','Perfect Game','Bowling Bonanza','Lane Legend','Cosmic Bowl']},
  {k:'laser',   n:'Laser Tag Arena',    e:'🔫', base:1.4e6, kind:'all',      v:.10, d:'+10% to everything', ups:['Blacklights','Fog Machines','Team Battles','Laser Maze','Laser Legends','Laser Galaxy','Laser Forever']},
  {k:'rink',    n:'Roller Rink',        e:'🛼', base:2e7,   kind:'game',     v:.40, d:'+40% tickets from every game', ups:['Disco Ball','Speed Skates','Couples Skate','Rink Rave','Roller Derby','Rink Royale','Rink Infinity']},
  {k:'theme',   n:'Theme Park',         e:'🎢', base:3.3e8, kind:'all',      v:.25, d:'+25% to everything', ups:['Ferris Wheel','Log Flume','Mega Coaster','Park Parade','Night Fireworks','Park Kingdom','Park Universe']},
  {k:'resort',  n:'Wilderland Resort',  e:'🏝️', base:5.1e9, kind:'all',      v:.40, d:'+40% to everything and +20% Learn-mode bonus', ups:['Lazy River','Mountain Spa','Lake Cabins','Resort Gala','Resort Island','Resort Planet','Resort Dream']},
  {k:'factory', n:'Ticket Factory',     e:'🏭', base:7.5e10,kind:'clickPct', v:1,   d:'+100% click power', ups:['Faster Belts','Ticket Robots','Auto Stamper','Mega Press','Ticket Foundry','Factory World','Ticket Singularity']},
  {k:'moon',    n:'Moon Arcade',        e:'🌙', base:1e12,  kind:'all',      v:.60, d:'+60% to everything', ups:['Low Gravity','Crater Cabinets','Moon Bowling','Lunar Laser','Moon Base','Moon Kingdom','Moon Forever']},
  {k:'galaxy',  n:'Galactic Fun Zone',  e:'🌌', base:1.7e13,kind:'all',      v:1,   d:'+100% to everything', ups:['Star Slides','Comet Coaster','Nebula Nights','Galaxy Games','Galactic Gala','Galaxy Empire','The Big Fun']},
];
const MILES = [1,10,25,50,100,150,200];
E.EXP = EXP; E.MILES = MILES;
const lvOf = (P,k) => ((P.exp||{})[k])|0;
const upOf = (P,k) => ((P.expUp||{})[k])|0;           // how many milestone upgrades bought for this expansion
const expMul = (P,k) => Math.pow(1.5, upOf(P,k));      // each milestone upgrade: that expansion works ×1.5
E.expCost = (x, L) => nice(x.base * Math.pow(1.15, L));
E.upCost = (x, i) => nice(x.base * Math.pow(1.15, MILES[i]) * 6);
const sumKind = (P, kind) => EXP.filter(x=>x.kind===kind).reduce((a,x)=>a + lvOf(P,x.k)*x.v*expMul(P,x.k), 0);

// ---------------- Star Tree (spend Golden Stars; the star BONUS uses all stars ever earned) ----------------
const TREE = {
  click: {n:'Clicking', e:'👆', nodes:[['Quick Fingers','Click power ×2'],['Golden Touch','Click power ×2'],['Ticket Tapper','Click power ×3'],['Click Legend','Click power ×3'],['Hand of Stars','Click power ×5']], m:[2,2,3,3,5]},
  games: {n:'Games', e:'🕹️', nodes:[['Warm Up','Game tickets +25%'],['Pro Player','Game tickets +50%'],['High Score Hero','Game tickets ×2'],['Arcade Master','Game tickets ×2'],['Wilderland Legend','Game tickets ×3']], m:[1.25,1.5,2,2,3]},
  learn: {n:'Learning', e:'📚', nodes:[['Bookworm','Learn bonus ×2'],['Quick Thinker','Learn bonus ×2'],['Brainy','Learn bonus ×3'],['Scholar','Learn-mode games pay ×1.5'],['Genius','Learn-mode games pay ×2']], m:[2,2,3,1.5,2]},
  luck:  {n:'Luck', e:'🍀', nodes:[['Critter Spotter','Golden Critters 25% more often'],['Long Boosts','Boosts last 25% longer'],['Lucky Streak','+5% Lucky Payout chance'],['Golden Hoard','Critter rewards ×2'],['Rainbow Luck','Critters 50% more often']], m:[1,1,1,1,1]},
  combo: {n:'Combos', e:'🔗', nodes:[['Combo Starter','Combo can go 5 higher'],['Combo Power','Combo bonus ×1.5'],['Warm Hands','Combos stay warm twice as long'],['Combo King','Combo bonus ×2'],['Never Cold','Combos never cool down']], m:[1,1.5,1,2,1]},
};
const TCOST = [1,3,8,20,50];
E.TREE = TREE; E.TCOST = TCOST;
const tl = (P,b) => ((P.tree||{})[b])|0;
const treeProd = (P,b,from=0,to=5) => { let m = 1; for (let i=from;i<Math.min(to,tl(P,b));i++) m *= TREE[b].m[i]; return m; };
E.starsFree = P => Math.max(0, (P.stars||0) - (P.starsSpent||0));
const SP = (P,k) => window.WLP && window.WLP.perks ? window.WLP.perks(P)[k] : 1; // Golden Star prize powers
E.critterRate = P => (tl(P,'luck')>=1?1.25:1) * (tl(P,'luck')>=5?1.5:1) * SP(P,'critter');
E.buffLen = P => (1 + .10*lvOf(P,'snack')*expMul(P,'snack')) * (tl(P,'luck')>=2?1.25:1) * SP(P,'buff');
E.luckBonus = P => tl(P,'luck')>=3 ? .05 : 0;
E.critterReward = P => Math.round((tl(P,'luck')>=4 ? 2 : 1) * SP(P,'buff') * 10) / 10;
E.comboCap = P => 10 + (tl(P,'combo')>=1?5:0);
E.comboStrength = P => treeProd(P,'combo',1,2) * treeProd(P,'combo',3,4) * SP(P,'combo');
E.comboWarmMs = P => tl(P,'combo')>=5 ? Infinity : (tl(P,'combo')>=3 ? 10 : 5) * 60000;
E.learnMult = P => treeProd(P,'learn',0,3) * (1 + .2*lvOf(P,'resort')*expMul(P,'resort'));
E.learnGameMult = P => treeProd(P,'learn',3,5) * SP(P,'learn');

// ---------------- boosts from Golden Critters (kept in memory, not saved) ----------------
let BUFFS = [];
const now = () => Date.now();
const live = () => { BUFFS = BUFFS.filter(b => b.until > now()); return BUFFS; };
E.buffs = () => live();
E.buffMult = kind => live().reduce((m,b) => m * ((b.kind===kind || b.kind==='all') ? b.m : 1), 1);
const addBuff = (P, b) => { const len = b.s * 1000 * E.buffLen(P); BUFFS.push({...b, until: now() + len, len}); window.dispatchEvent(new Event('wl-buffs')); };

// ---------------- multipliers used by the arcade ----------------
E.allMult = P => 1 + sumKind(P,'all');
E.gameMult = P => (1 + sumKind(P,'game')) * E.allMult(P) * treeProd(P,'games') * E.buffMult('game');
E.clickPower = P => { const base = 1 + lvOf(P,'claw')*expMul(P,'claw');
  const pct = 1 + sumKind(P,'clickPct');
  const glob = window.WLP ? window.WLP.globalMult(P) : 1;
  return base * pct * E.allMult(P) * treeProd(P,'click') * glob * SP(P,'click') * E.buffMult('click'); };
E.expLevels = P => EXP.reduce((a,x)=>a+lvOf(P,x.k),0);

// ---------------- a little global CSS for animations ----------------
const css = `
.wle{font-family:"Uncut Sans","Inter",system-ui,sans-serif;color:#121313}
.wle *{box-sizing:border-box}
.wle-wrap{display:grid;grid-template-columns:minmax(260px,1fr) minmax(300px,1.35fr);gap:14px}
@media (max-width:720px){.wle-wrap{grid-template-columns:1fr}}
.wle-card{background:#fff;border-radius:16px;padding:14px}
.wle-ticket{position:relative;width:min(300px,78vw);height:min(190px,50vw);margin:8px auto;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;transition:transform .07s;filter:drop-shadow(0 12px 18px rgba(0,0,0,.28))}
.wle-ticket:active{transform:scale(.93) rotate(-2deg)}
.wle-ticket.pop{animation:wleSquish .16s ease-out}
.wle-ticket svg{width:100%;height:100%}
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
.wle-critter{position:fixed;z-index:450;font-size:44px;cursor:pointer;filter:drop-shadow(0 0 10px #F9BF01) drop-shadow(0 0 3px #fff);user-select:none;transition:left 9s linear;animation:wleHop .45s ease-in-out infinite alternate}
.wle-fly{position:fixed;z-index:460;font-size:22px;pointer-events:none;transition:transform .8s cubic-bezier(.5,0,.2,1),opacity .8s}
.wle-rain{position:fixed;z-index:455;font-size:30px;cursor:pointer;user-select:none;animation:wleFall linear forwards}
.wle-node{border-radius:12px;padding:8px;text-align:center;font-size:12px;font-weight:700;border:2px solid #d9d5c3;background:#f6f3e6;cursor:pointer;min-height:78px;display:flex;flex-direction:column;justify-content:center;gap:2px}
.wle-node.own{background:#F9BF01;border-color:#c48a00;color:#121313}
.wle-node.next{background:#fff;border-color:#015640;color:#015640}
.wle-node.lock{opacity:.5;cursor:default}
.wle-celebrate{position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;padding:16px;background:radial-gradient(circle at 50% 40%,rgba(249,191,1,.45),rgba(10,20,15,.96) 70%);animation:wleFade .3s ease-out;font-family:"Uncut Sans","Inter",system-ui,sans-serif;overflow-y:auto}
.wle-celebrate .card{background:#fff;border-radius:24px;padding:22px;max-width:520px;width:100%;text-align:center;box-shadow:0 0 0 5px #F9BF01,0 0 80px rgba(249,191,1,.7);animation:wlePopIn .55s cubic-bezier(.2,1.5,.4,1) both}
@keyframes wleSquish{0%{transform:scale(1)}40%{transform:scale(.92,.88)}100%{transform:scale(1)}}
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

// ---------------- Golden Critters (only while you're actively playing or clicking) ----------------
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
  else if (r < .66) { addBuff(P, {kind:'click', m:77*R, s:13, n:'CLICK STORM ×'+(Math.round(77*R*10)/10)}); msg = 'CLICK STORM! Golden Ticket clicks ×'+(Math.round(77*R*10)/10); }
  else if (r < .86) { const need = window.WLP ? window.WLP.rebirthNeed(P) : 1e7; const gain = Math.min(Math.max(50, (P.tickets||0)*.15), need*.04) * R; host.addTix(Math.round(gain), {x:ev.clientX, y:ev.clientY}); msg = 'LUCKY JACKPOT! +'+fmt(gain)+' tickets'; }
  else { ticketRain(P); msg = 'TICKET RAIN! Click the falling tickets!'; }
  host.toast(msg); host.sfx('win'); host.setP({critters:(P.critters||0)+1}); };
const ticketRain = P => { const val = Math.max(5, E.clickPower(P)*10*E.critterReward(P)); const end = now() + 9000*E.buffLen(P);
  const drop = () => { if (now() > end) return; const t = el('div', {cls:'wle-rain', style:{left:(20 + Math.random()*(innerWidth-60))+'px', top:'-50px', animationDuration:(3 + Math.random()*2)+'s'}}, '🎟️');
    t.onclick = e => { e.stopPropagation(); t.remove(); host.addTix(Math.round(val), {x:e.clientX, y:e.clientY}); window.Arcade && window.Arcade.tone && window.Arcade.tone(900+Math.random()*400,.05,'triangle',.04); };
    document.body.appendChild(t); setTimeout(()=>t.remove(), 5200); setTimeout(drop, 260); }; drop(); };

// ---------------- the Golden Ticket screen ----------------
E.mount = (root, api) => {
  ensureCss(); E.attach(api);
  let tab = api.tab || 'click', buyN = 1, clicks = [], pend = 0, pendC = 0, pendT = null, alive = true;
  const P = () => api.P(), set = p => api.setP(p);
  const wrap = el('div', {cls:'wle'}); root.appendChild(wrap);
  const head = el('div'), body = el('div'); wrap.append(head, body);
  const flush = () => { if (!pend) return; const n = pend, c = pendC; pend = 0; pendC = 0; api.addTix(n, null, c); };
  const renderHead = () => { head.innerHTML = ''; const p = P(), need = window.WLP ? window.WLP.rebirthNeed(p) : 1e7, pct = Math.min(100, (p.tickets||0)/need*100);
    head.append(
      el('div', {style:{display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'8px'}},
        el('div', {style:{background:'#D5F367', color:'#015640', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, '🎟 '+fmt(p.tickets||0)),
        el('div', {style:{background:'#015640', color:'#D5F367', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, '×'+fmt(window.WLP ? window.WLP.globalMult(p)*E.gameMult(p) : 1)+' game payouts'),
        el('div', {style:{background:'#F9BF01', color:'#121313', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, '⭐ '+E.starsFree(p)+' to spend · '+(p.stars||0)+' earned'),
        buffBar()),
      el('div', {cls:'wle-small', style:{marginBottom:'4px'}}, 'Next Rebirth at '+fmt(need)+' tickets (it happens automatically) · '+pct.toFixed(1)+'%'),
      el('div', {style:{height:'10px', background:'#ece8d6', borderRadius:'5px', overflow:'hidden', marginBottom:'10px'}}, el('div', {style:{height:'100%', width:pct+'%', background:'linear-gradient(90deg,#00B451,#F9BF01)'}})));
    const tb = el('div', {style:{display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px'}});
    [['click','🎟 Golden Ticket'],['tree','⭐ Star Tree'],['goals','🏁 Goals']].forEach(([id,t]) => tb.appendChild(el('button', {cls:'wle-tab'+(tab==id?' on':''), onclick:()=>{ tab = id; render(); }}, t)));
    head.appendChild(tb); };
  const buffBar = () => { const b = el('div', {cls:'wle-buffs'}); E.buffs().forEach(x => b.appendChild(el('div', {cls:'wle-buff'}, x.n+' · '+Math.ceil((x.until-now())/1000)+'s'))); return b; };

  const ticketSVG = '<svg viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".45" stop-color="#F9BF01"/><stop offset="1" stop-color="#c88a00"/></linearGradient><linearGradient id="gs" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="gc"><path d="M20 10h260a10 10 0 0 0 10 10v50a25 25 0 0 0 0 50v50a10 10 0 0 0-10 10H20a10 10 0 0 0-10-10v-50a25 25 0 0 0 0-50V20a10 10 0 0 0 10-10z"/></clipPath></defs>'+
    '<path d="M20 10h260a10 10 0 0 0 10 10v50a25 25 0 0 0 0 50v50a10 10 0 0 0-10 10H20a10 10 0 0 0-10-10v-50a25 25 0 0 0 0-50V20a10 10 0 0 0 10-10z" fill="url(#gt)" stroke="#a06c00" stroke-width="4"/>'+
    '<g clip-path="url(#gc)"><rect x="-120" y="0" width="90" height="190" fill="url(#gs)" transform="skewX(-20)"><animate attributeName="x" values="-160;420" dur="2.6s" repeatCount="indefinite"/></rect></g>'+
    '<path d="M60 30v130" stroke="#a06c00" stroke-width="3" stroke-dasharray="8 7"/><text x="175" y="88" text-anchor="middle" font-family="Uncut Sans,system-ui,sans-serif" font-weight="800" font-size="30" fill="#5a3d00">GOLDEN</text><text x="175" y="124" text-anchor="middle" font-family="Uncut Sans,system-ui,sans-serif" font-weight="800" font-size="30" fill="#5a3d00">TICKET</text><text x="175" y="150" text-anchor="middle" font-family="Uncut Sans,system-ui,sans-serif" font-weight="700" font-size="12" fill="#7a5500" letter-spacing="3">WILDERLAND ARCADE</text><circle cx="35" cy="95" r="9" fill="#fff6c9" stroke="#a06c00" stroke-width="2"/></svg>';

  const doClick = (e, tk) => { if (e.isTrusted === false) return; const t = now(); clicks = clicks.filter(x => t - x < 1000);
    if (clicks.length >= 12) return; // anti-autoclicker: max 12 clicks a second
    clicks.push(t); const p = P(), n = E.clickPower(p); pend += n; pendC++;
    const r = tk.getBoundingClientRect(), x = (e.clientX||r.left+r.width/2) - r.left, y = (e.clientY||r.top+r.height/2) - r.top;
    const pop = el('div', {cls:'wle-pop', style:{left:x+'px', top:(y-10)+'px', fontSize:(16+Math.min(14,Math.log10(n+1)*3))+'px'}}, '+'+fmt(n)); tk.appendChild(pop); setTimeout(()=>pop.remove(), 900);
    if (!reduced()) for (let i=0;i<5;i++) { const a = Math.random()*7, d = 30+Math.random()*50; const pp = el('div', {cls:'wle-pp', style:{left:x+'px', top:y+'px', background:i%2?'#F9BF01':'#D5F367'}}); pp.style.setProperty('--dx', Math.cos(a)*d+'px'); pp.style.setProperty('--dy', Math.sin(a)*d+'px'); tk.appendChild(pp); setTimeout(()=>pp.remove(), 700); }
    tk.classList.remove('pop'); void tk.offsetWidth; tk.classList.add('pop');
    window.Arcade && window.Arcade.tone && window.Arcade.tone(520+Math.random()*120,.04,'triangle',.035);
    api.clicked && api.clicked();
    clearTimeout(pendT); pendT = setTimeout(flush, 250); live_num(); };
  let numEl = null; const live_num = () => { if (numEl) numEl.textContent = '🎟 '+fmt((P().tickets||0)+pend); };

  const buyExp = (x, n) => { if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); let p = P(), L = lvOf(p,x.k), spent = 0, bought = 0, t = p.tickets||0;
    const need = window.WLP ? window.WLP.rebirthNeed(p) : Infinity;
    for (let i=0;i<n;i++) { const c = E.expCost(x, L+bought); if (t - spent < c || c >= need) break; spent += c; bought++; }
    if (!bought) return api.sfx('bad'); set({tickets:t-spent, exp:{...(p.exp||{}), [x.k]:L+bought}}); api.sfx('coin'); render(x.k); };
  const buyUp = (x, i) => { if (api.admin()) return; const p = P(), c = E.upCost(x,i); if (upOf(p,x.k) !== i || lvOf(p,x.k) < MILES[i] || (p.tickets||0) < c) return api.sfx('bad');
    set({tickets:p.tickets-c, expUp:{...(p.expUp||{}), [x.k]:i+1}}); api.sfx('win'); api.toast(x.ups[i].toUpperCase()+' · '+x.n.toUpperCase()+' ×1.5'); render(x.k); };

  const clickTab = bumpKey => { const p = P(), need = window.WLP ? window.WLP.rebirthNeed(p) : Infinity, box = el('div', {cls:'wle-wrap'});
    const left = el('div', {cls:'wle-card', style:{textAlign:'center'}});
    numEl = el('div', {style:{fontSize:'30px', fontWeight:800, color:'#015640'}}, '🎟 '+fmt(p.tickets||0));
    const tk = el('div', {cls:'wle-ticket', html:ticketSVG, role:'button', 'aria-label':'Golden Ticket — click for tickets'});
    tk.addEventListener('pointerdown', e => { e.preventDefault(); doClick(e, tk); });
    left.append(numEl, el('div', {cls:'wle-small'}, '+'+fmt(E.clickPower(p))+' per click · '+fmt(p.clicks||0)+' clicks so far'), tk,
      el('div', {cls:'wle-small'}, 'Click the Golden Ticket! Golden Critters sometimes run across the screen while you play — catch them for boosts.'),
      el('div', {cls:'wle-small', style:{marginTop:'6px', fontWeight:700, color:'#AB2372'}}, 'No passive income: everything here boosts what you earn while you play.'));
    const right = el('div', {cls:'wle-card'});
    const bn = el('div', {style:{display:'flex', gap:'6px', alignItems:'center', marginBottom:'8px', flexWrap:'wrap'}}, el('b', {style:{color:'#015640'}}, 'Arcade Expansions'), el('span', {style:{flex:1}}));
    [1,10,100].forEach(n => bn.appendChild(el('button', {cls:'wle-btn'+(buyN==n?'':' alt'), onclick:()=>{ buyN = n; render(); }}, '×'+n)));
    right.appendChild(bn);
    EXP.forEach((x, idx) => { const L = lvOf(p,x.k), c = E.expCost(x,L), can = (p.tickets||0) >= c && c < need, hidden = idx > 0 && lvOf(p, EXP[idx-1].k) === 0 && L === 0 && (p.tickets||0) < x.base*.3;
      if (hidden) { right.appendChild(el('div', {cls:'wle-row', style:{opacity:.5}}, el('div', {cls:'wle-ic', style:{filter:'grayscale(1) brightness(.6)'}}, '?'), el('div', {style:{flex:1}}, el('b', null, '???'), el('div', {cls:'wle-small'}, 'Unlocks when you’re close to '+fmt(x.base)+' tickets')))); return; }
      const ic = el('div', {cls:'wle-ic'+(bumpKey===x.k?' bump':'')}, x.e);
      const info = el('div', {style:{flex:1, minWidth:0}}, el('div', {style:{fontWeight:700, color:'#015640'}}, x.n+'  ', el('span', {style:{fontSize:'12px', color:'#8a8a8a'}}, 'lv '+L)), el('div', {cls:'wle-small'}, x.d+(upOf(p,x.k)?' · ×'+fmt(expMul(p,x.k))+' from upgrades':'')));
      const i = upOf(p,x.k); if (i < MILES.length && L >= MILES[i]) { const uc = E.upCost(x,i); const ub = el('button', {cls:'wle-btn', style:{background:'#AB2372', marginTop:'4px'}, onclick:()=>buyUp(x,i)}, '★ '+x.ups[i]+' (×1.5) · '+fmt(uc)); if ((p.tickets||0) < uc || uc >= need) ub.disabled = true; info.appendChild(ub); }
      else if (i < MILES.length) info.appendChild(el('div', {style:{fontSize:'11px', color:'#AB2372', fontWeight:700}}, 'Next upgrade “'+x.ups[i]+'” at level '+MILES[i]));
      const b = el('button', {cls:'wle-btn', onclick:()=>buyExp(x, buyN)}, c >= need ? 'Next run' : fmt(c)+' 🎟'); if (!can) b.disabled = true;
      right.appendChild(el('div', {cls:'wle-row'+(can?' can':'')}, ic, info, b)); });
    box.append(left, right); return box; };

  const treeTab = () => { const p = P(), box = el('div');
    box.appendChild(el('div', {cls:'wle-card', style:{marginBottom:'10px'}}, el('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, '⭐ Star Tree · '+E.starsFree(p)+' stars to spend'),
      el('div', {cls:'wle-small'}, 'Golden Stars come from Rebirths (based on all the tickets you’ve ever earned). Every star you’ve EARNED boosts all payouts — spending them here doesn’t lower that bonus. Buy each branch in order.')));
    const grid = el('div', {style:{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:'10px'}});
    Object.entries(TREE).forEach(([b, T]) => { const L = tl(p,b), col = el('div', {cls:'wle-card'}, el('div', {style:{fontWeight:800, color:'#015640', marginBottom:'6px'}}, T.e+' '+T.n));
      T.nodes.forEach(([n,d], i) => { const own = i < L, next = i === L, can = next && E.starsFree(p) >= TCOST[i];
        const node = el('div', {cls:'wle-node '+(own?'own':next?'next':'lock'), onclick:()=>{ if (!can) return api.sfx('bad'); const pp = P(); set({tree:{...(pp.tree||{}), [b]:L+1}, starsSpent:(pp.starsSpent||0)+TCOST[i]}); api.sfx('win'); api.toast('STAR TREE · '+n.toUpperCase()); render(); }},
          el('div', null, n), el('div', {style:{fontWeight:500}}, d), el('div', {style:{fontSize:'11px'}}, own ? '✓ owned' : TCOST[i]+' ⭐'));
        col.appendChild(node); if (i < 4) col.appendChild(el('div', {style:{height:'6px', width:'3px', background:own?'#F9BF01':'#d9d5c3', margin:'0 auto'}})); });
      grid.appendChild(col); });
    box.appendChild(grid); return box; };

  const goalsTab = () => { const p = P(), box = el('div', {cls:'wle-card'}), list = E.goals(p);
    box.appendChild(el('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640', marginBottom:'8px'}}, '🏁 Milestone track'));
    list.forEach(g => box.appendChild(el('div', {cls:'wle-row'}, el('div', {style:{fontSize:'22px', width:'30px', textAlign:'center'}}, g.e), el('div', {style:{flex:1, minWidth:0}}, el('div', {style:{fontWeight:700, color:'#015640'}}, g.n),
      el('div', {style:{height:'8px', background:'#ece8d6', borderRadius:'4px', overflow:'hidden', marginTop:'4px'}}, el('div', {style:{height:'100%', width:Math.min(100,g.pct)+'%', background:'#F9BF01'}})), el('div', {cls:'wle-small'}, g.txt)))));
    return box; };

  let lastBump = null;
  const render = bumpKey => { if (!alive) return; renderHead(); body.innerHTML = ''; body.appendChild(tab=='tree' ? treeTab() : tab=='goals' ? goalsTab() : clickTab(bumpKey)); };
  render();
  const tick = setInterval(() => { if (!alive) return; const bb = head.querySelector('.wle-buffs'); if (bb) bb.replaceWith(buffBar()); }, 1000);
  const onBuffs = () => renderHead(); window.addEventListener('wl-buffs', onBuffs);
  E._rerender = () => { if (alive && tab!=='click') render(); else if (alive) { renderHead(); live_num(); } };
  return () => { alive = false; flush(); clearInterval(tick); clearTimeout(pendT); window.removeEventListener('wl-buffs', onBuffs); wrap.remove(); };
};

// ---------------- goals / milestone track ----------------
E.goals = P => { const W = window.WLP, out = [], need = W ? W.rebirthNeed(P) : 1e7;
  out.push({e:'⭐', n:'Next Rebirth', pct:(P.tickets||0)/need*100, txt:fmt(P.tickets||0)+' / '+fmt(need)+' tickets'});
  const cl = P.clicks||0, cg = [100,1000,10000,100000,1e6].find(x=>x>cl)||1e7; out.push({e:'👆', n:'Click '+fmt(cg)+' times', pct:cl/cg*100, txt:fmt(cl)+' / '+fmt(cg)});
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
    el('div', {style:{fontSize:'14px', color:'#3d3d3d', marginBottom:'10px'}}, 'You now have '+info.total+' Golden Stars ('+info.free+' to spend in the Star Tree). Every payout is now ×'+fmt(info.starMult)+' from stars.'),
    el('div', {style:{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', textAlign:'left', fontSize:'13px'}},
      el('div', {style:{background:'#fff1ef', borderRadius:'12px', padding:'10px'}}, el('b', {style:{color:'#B3001B'}}, 'Reset to zero'), el('div', null, '• Tickets'), el('div', null, '• Arcade Expansions'), el('div', null, '• Upgrade Workshop'), el('div', null, '• Multiplier shop'), el('div', null, '• Saved game runs'), el('div', null, '• The Mines (depth kept)')),
      el('div', {style:{background:'#eefbe8', borderRadius:'12px', padding:'10px'}}, el('b', {style:{color:'#007a37'}}, 'You keep forever'), el('div', null, '• Golden Stars & Star Tree'), el('div', null, '• Prizes & collections'), el('div', null, '• Achievements'), el('div', null, '• High scores'), el('div', null, '• Avatar & cosmetics'))),
    el('div', {style:{marginTop:'12px', fontWeight:700, color:'#015640'}}, 'Next Rebirth at '+fmt(info.next)+' tickets'),
    el('button', {cls:'wle-btn', style:{marginTop:'14px', padding:'12px 26px', fontSize:'15px'}, onclick:()=>o.remove()}, 'Let’s go!'));
  o.appendChild(card);
  if (!reduced()) for (let i=0;i<60;i++) { const a = Math.random()*7, d = 150+Math.random()*450; const pp = el('div', {cls:'wle-pp', style:{left:'50%', top:'40%', width:'10px', height:'10px', background:['#F9BF01','#D5F367','#EA55AB','#64CDF5','#fff'][i%5], animationDuration:'1.4s'}}); pp.style.setProperty('--dx', Math.cos(a)*d+'px'); pp.style.setProperty('--dy', Math.sin(a)*d+'px'); o.appendChild(pp); }
  document.body.appendChild(o);
  if (window.Arcade && window.Arcade.tone) [523,659,784,1046,1318,1568].forEach((f,i)=>window.Arcade.tone(f,.2,'triangle',.06,i*.1)); };

// ---------------- one-time welcome to the new economy ----------------
E.welcome = (info) => { ensureCss(); const o = el('div', {cls:'wle-celebrate', style:{background:'rgba(1,40,30,.92)'}});
  const card = el('div', {cls:'card', style:{boxShadow:'0 0 0 5px #D5F367,0 0 60px rgba(213,243,103,.5)'}},
    el('div', {style:{fontSize:'48px'}}, '🎟️'), el('div', {style:{fontWeight:800, fontSize:'26px', color:'#015640'}}, 'Welcome to the new arcade!'),
    el('div', {style:{fontSize:'14px', color:'#3d3d3d', margin:'6px 0 10px'}}, 'Your save moved over. Here’s what you have:'),
    el('div', {style:{textAlign:'left', fontSize:'14px', background:'#f6f3e6', borderRadius:'12px', padding:'10px 14px', lineHeight:1.7}}, ...info.lines.map(l => el('div', null, '✓ '+l))),
    el('div', {style:{textAlign:'left', fontSize:'13px', marginTop:'10px', lineHeight:1.6}}, el('b', null, 'New: '), 'the Golden Ticket you can click, 12 Arcade Expansions, Golden Critters with boosts, the Star Tree, and Rebirth that happens automatically at each milestone. There is no passive income anymore — tickets come from playing and clicking.'),
    el('button', {cls:'wle-btn', style:{marginTop:'14px', padding:'12px 26px', fontSize:'15px'}, onclick:()=>o.remove()}, 'Start playing'));
  o.appendChild(card); document.body.appendChild(o); };

window.WLE = E;
})();
