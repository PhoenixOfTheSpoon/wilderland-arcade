// Wilderland Arcade · WILDERLAND WONDERS — 44 Golden-Star prizes with permanent bonuses that never reset,
// upgradeable through 5 levels (Bronze → Silver → Gold → Diamond → Wilderland), themed sets, the Wilderland Collection,
// and the ultra-rare FOUNDER rarity. Stored in P.wonders = {id: level}. Never in capsules.
(function(){
'use strict';
const WW = {};
const fmt = n => window.WLP ? window.WLP.fmt(n) : String(Math.round(n));
const nice = x => { x = Number(x); if (!(x < 1e300)) return 1e300; if (x < 100) return Math.round(x); const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; };
const LV = [{n:'Bronze', c:'#cd7f32'}, {n:'Silver', c:'#b9c4cc'}, {n:'Gold', c:'#F9BF01'}, {n:'Diamond', c:'#64CDF5'}, {n:'Wilderland', c:'#ff5fd2', rain:1}];
WW.LV = LV; const MAXL = 5;
const SETS = {land:{n:'Monuments & Landmarks', e:'🗼'}, pets:{n:'Legendary Pets', e:'🐉'}, relic:{n:'Avatar Relics', e:'👑'}, home:{n:'Home Wonders', e:'🏰'}, mine:{n:'Mine Wonders', e:'⛏️'}, marvel:{n:'Marvels of Wilderland', e:'🎆'}};
WW.SETS = SETS;
const GN = {snake:'Snake', flappy:'Flapper', simon:'Simon Says', snowball:'Snowball Showdown', td:'Trailhead Defense', fishing:'Fishing Hole', space:'Star Ranger', breakout:'Breakout'};
// [id, name, emoji, set, kind, base, description]  kind: all · games · game:<id> · mine · learn · critter · petxp · start · dia
const RAW = [
  ['lighthouse','Wilderland Lighthouse','🗼','land','all',.5,'Its beam guides every ticket home.'],
  ['obelisk','Crystal Obelisk','🔷','land','dia',1,'Hums with the light of a hundred rebirths.'],
  ['campfire','Eternal Campfire','🔥','land','petxp',.5,'Pets love its warm, never-ending glow.'],
  ['skybridge','Sky Bridge','🌉','land','start',1,'A shortcut across the clouds to your next Rebirth.'],
  ['firstminer','Statue of the First Miner','🗿','mine','mine',1,'Honors the very first digger of Deep Mines.'],
  ['gate','Golden Arcade Gate','⛩️','land','all',.75,'Every player walks through it a little luckier.'],
  ['auroratower','Aurora Tower','🌌','land','critter',.25,'Northern lights call Golden Critters near.'],
  ['treehouse','Ancient Treehouse','🌳','land','learn',.5,'A cozy reading nook as old as the forest.'],
  ['phoenix','Wilderland Phoenix','🐦‍🔥','pets','all',.5,'Reborn in fire every time you Rebirth. Comes with the pet.'],
  ['stag','Aurora Stag','🦌','pets','critter',.3,'Its antlers glow like the northern lights. Comes with the pet.'],
  ['cfox','Celestial Fox','🦊','pets','learn',.5,'Made of starlight and very clever. Comes with the pet.'],
  ['ddragon','Diamond Dragon','🐉','pets','mine',2,'Guards the deepest gems of Deep Mines. Comes with the pet.'],
  ['crown','Crown of the Wilds','👑','relic','all',.6,'Worn by the rulers of Wilderland.'],
  ['cape','Starlight Cape','🧣','relic','games',.3,'Swish! Every game pays a bit more.'],
  ['wings','Wings of Dawn','🪽','relic','start',1,'Lift off into each new Rebirth.'],
  ['scepter','Wilderland Scepter','🪄','relic','all',.6,'One wave and tickets appear.'],
  ['island','Floating Island Garden','🏝️','home','petxp',.5,'A garden in the sky where pets grow fast.'],
  ['waterfall','Waterfall Hall','🏞️','home','all',.5,'A great hall with a waterfall for a wall.'],
  ['throne','Throne Room','🪑','home','all',.7,'Fit for an arcade legend.'],
  ['observatory','Star Observatory','🔭','home','dia',1,'Spot Diamond Stars before anyone else.'],
  ['heart','Heart of the Mountain','❤️‍🔥','mine','mine',2,'The warm, beating core of Deep Mines.'],
  ['drill','Golden Drill','🪛','mine','mine',1.5,'Spins so fast it hums a tune.'],
  ['lantern','Eternal Lantern','🏮','mine','mine',1.5,'Never goes out, even in the deepest layer.'],
  ['falls','Rainbow Falls','🌈','marvel','critter',.25,'Golden Critters splash in its spray.'],
  ['compass','Compass of Ages','🧭','marvel','start',1,'Always points to your next Rebirth.'],
  ['library','Grand Library of Wilderland','📚','marvel','learn',.6,'Every book ever read in Learn mode.'],
  ['orchestra','Moonlight Orchestra','🎻','marvel','game:simon',2,'Plays every Simon Says song perfectly.'],
  ['carousel','Cosmic Carousel','🎠','marvel','all',.5,'Its horses gallop through the stars.'],
  ['geyser','Geyser of Fortune','⛲','marvel','all',.5,'Shoots tickets sky-high.'],
  ['hourglass','Hourglass of Rebirth','⏳','marvel','start',1.5,'Its sand flows backwards.'],
  ['anvil','Starforge Anvil','⚒️','mine','mine',2,'Forges ore into stars.'],
  ['kite','Thunderbird Kite','🪁','marvel','game:flappy',2,'Rides the wind through every gap.'],
  ['clocktower','Crystal Clocktower','🕰️','marvel','dia',1,'Chimes once for every Diamond Star.'],
  ['gardenlights','Garden of Lights','🌸','home','petxp',.6,'Flowers that glow at night.'],
  ['legvault','Vault of Legends','🏦','marvel','all',.8,'Holds the treasures of every champion.'],
  ['festival','Festival of Stars','🎆','marvel','all',.6,'Fireworks every night, forever.'],
  ['galleon','Sky Galleon','⛵','marvel','critter',.3,'Sails the clouds collecting critters.'],
  ['snowdome','Snow Globe Dome','🔮','marvel','game:snowball',2,'A whole winter kingdom inside.'],
  ['arena','Champion Arena','🏟️','marvel','games',.3,'Where every cabinet champion is crowned.'],
  ['trophies','Trophy of Trophies','🏆','marvel','games',.3,'A trophy made of smaller trophies.'],
  ['moonbase','Moonbase Arcade','🌙','marvel','games',.3,'Low gravity, high scores.'],
  ['worldtree','Heart Tree of Wilderland','🌲','land','all',1,'Its roots reach every corner of the arcade.'],
  ['meteor','Meteor Crown','☄️','relic','start',2,'Blazing fast Rebirths.'],
  ['infinity','Infinity Arcade','♾️','marvel','all',1.5,'An arcade inside an arcade inside an arcade…'],
];
const LIST = RAW.map(([id, n, e, set, kind, b, d], i) => ({id, n, e, set, kind, b, d, i, price: nice(50 * Math.pow(2.2, i)), r:7}));
// FOUNDER rarity: above Wilderland. The Founder’s Pin is only for founding players (anyone who played before 2027);
// the rest unlock once you own the whole Wilderland Collection.
const FOUNDER_CUTOFF = Date.UTC(2027, 0, 1);
const FOUNDER = [
  {id:'fpin', n:'Founder’s Pin', e:'📌', kind:'all', b:2, d:'Given to every founding player of Wilderland Arcade (played before 2027). Can never be bought.', pin:1},
  {id:'fkey', n:'Founder’s Key', e:'🗝️', kind:'all', b:3, d:'Opens every door in Wilderland.', price:1e18},
  {id:'fstar', n:'Founder’s Star', e:'🌟', kind:'games', b:1, d:'The first star ever placed in the Wilderland sky.', price:5e18},
  {id:'fgem', n:'Founder’s Gem', e:'💠', kind:'mine', b:5, d:'Found at the bottom of the very first mine.', price:2e19},
  {id:'fbanner', n:'Founder’s Banner', e:'🚩', kind:'start', b:3, d:'Planted at the start of every Rebirth Road.', price:1e20},
  {id:'fthrone', n:'Founder’s Throne', e:'🏰', kind:'all', b:5, d:'The seat of the founders. There is only one kind of player who sits here.', price:5e20},
].map(x => ({...x, set:'founder', r:8, founder:1, price:x.price || 0}));
WW.LIST = LIST; WW.FOUNDER = FOUNDER;
const ALL = [...LIST, ...FOUNDER], byId = id => ALL.find(x => x.id == id);
WW.byId = byId;
// pets that come with the Legendary Pets wonders
WW.PET_OF = {phoenix:'wphoenix', stag:'wstag', cfox:'wfox', ddragon:'wdragon'};

const own = P => (P && P.wonders) || {};
WW.level = (P, id) => own(P)[id] | 0;
WW.owned = P => LIST.filter(x => own(P)[x.id]).length;
WW.collectionDone = P => LIST.every(x => own(P)[x.id]);
WW.setsDone = P => Object.keys(SETS).filter(k => LIST.filter(x => x.set == k).every(x => own(P)[x.id]));
WW.cost = (it, L) => it.founder ? it.price : nice(Math.min(1e300, it.price * Math.pow(3, L)));   // cost to go from level L to L+1
WW.maxL = it => it.founder ? 1 : MAXL;
// effect of one wonder at a level
const eff = (it, L) => it.kind == 'start' ? it.b * L : it.kind == 'dia' ? L : 1 + it.b * L;
WW.effText = (it, L) => { if (!L) L = 1; const v = eff(it, L), x = '×'+fmt(Math.round(v*100)/100);
  switch (it.kind.split(':')[0]) {
    case 'all': return x+' ALL tickets'; case 'games': return x+' every game’s payouts'; case 'game': return x+' '+(GN[it.kind.split(':')[1]] || 'game')+' payouts';
    case 'mine': return x+' Deep Mines ore'; case 'learn': return x+' Learn-mode bonus'; case 'critter': return x+' Golden Critters'; case 'petxp': return x+' pet XP';
    case 'start': return '+'+fmt(v)+'% starting tickets every Rebirth'; case 'dia': return '+'+v+' Diamond Star'+(v>1?'s':'')+' (one per level)'; default: return ''; } };
// combined bonuses
let bc = {k:'', v:null};
WW.bonus = P => { const o = own(P), key = JSON.stringify(o); if (bc.k === key) return bc.v; const v = {all:1, games:1, game:{}, mine:1, learn:1, critter:1, petxp:1, start:0, dia:0, sets:0, col:false};
  ALL.forEach(it => { const L = o[it.id]|0; if (!L) return; const e = eff(it, L), [k, g] = it.kind.split(':');
    if (k == 'game') v.game[g] = (v.game[g]||1) * e; else if (k == 'start') v.start += e; else if (k == 'dia') v.dia += e; else v[k] *= e; });
  const sd = Object.keys(SETS).filter(k => LIST.filter(x => x.set == k).every(x => o[x.id])); v.sets = sd.length; v.all *= Math.pow(2, sd.length);   // each finished themed set: ×2
  v.col = LIST.every(x => o[x.id]); if (v.col) v.all *= 10;   // the whole Wilderland Collection: ×10 more
  // every level beyond Bronze across the collection: a little extra
  v.start = Math.min(25, v.start); bc = {k:key, v}; return v; };
let api = null;
const P0 = () => api ? api.P() : {};
WW.all = P => WW.bonus(P).all;
WW.games = (P, g) => WW.bonus(P).games * (WW.bonus(P).game[g] || 1);
WW.mine = P => WW.bonus(P).mine;
WW.mineOre = () => WW.bonus(P0()).mine;
WW.learn = P => WW.bonus(P).learn;
WW.critter = P => WW.bonus(P).critter;
WW.petxp = P => WW.bonus(P).petxp;
WW.start = P => WW.bonus(P).start;
WW.founderOk = P => WW.collectionDone(P);

// ---------------- buying ----------------
const freeStars = P => Math.max(0, (P.stars||0) - (P.starsSpent||0));
let undo = null;
WW.plan = (P, it, want) => { const L = own(P)[it.id]|0, max = WW.maxL(it); let n = 0, cost = 0; want = want === 'max' ? 99 : (want||1);
  while (n < want && L + n < max) { const c = WW.cost(it, L + n); if (cost + c > freeStars(P)) break; cost += c; n++; } return {L, n, cost, next: L < max ? WW.cost(it, L) : 0}; };
WW.buy = (it, want, a) => { a = a || api; const P = a.P(); if (a.admin && a.admin()) { a.toast('ADMIN MODE · SHOPPING DISABLED'); return false; }
  if (it.pin) { a.sfx('bad'); a.toast('THE FOUNDER’S PIN IS ONLY FOR FOUNDING PLAYERS'); return false; }
  if (it.founder && !WW.founderOk(P)) { a.sfx('bad'); a.toast('OWN EVERY WILDERLAND WONDER TO UNLOCK FOUNDER PRIZES'); return false; }
  const pl = WW.plan(P, it, want); if (!pl.n) { a.sfx('bad'); a.toast(pl.L >= WW.maxL(it) ? 'ALREADY AT THE TOP LEVEL' : 'NEED '+fmt(pl.next - freeStars(P))+' MORE GOLDEN STARS'); return false; }
  const before = {wonders:{...own(P)}, starsSpent:P.starsSpent||0, diaBonus:P.diaBonus||0, pets:P.pets};
  const patch = {wonders:{...own(P), [it.id]:pl.L + pl.n}, starsSpent:(P.starsSpent||0) + pl.cost};
  if (it.kind == 'dia') patch.diaBonus = (P.diaBonus||0) + pl.n;
  const pid = WW.PET_OF[it.id], H = window.WLH; if (pid && H && !pl.L) { const pets = H.norm(P); if (!pets.own[pid]) patch.pets = {...pets, own:{...pets.own, [pid]:{xp:0}}}; }
  a.setP(patch); a.sfx('win');
  const was = WW.setsDone(P), now = WW.setsDone({...P, ...patch}), colNow = WW.collectionDone({...P, ...patch}) && !WW.collectionDone(P);
  undo = {at:Date.now(), id:it.id, before, label:it.n};
  show(it, pl.L + pl.n, pl.L ? 'UPGRADED TO '+LV[pl.L + pl.n - 1].n.toUpperCase() : 'NEW WILDERLAND WONDER');
  now.filter(k => !was.includes(k)).forEach(k => a.toast('SET COMPLETE · '+SETS[k].e+' '+SETS[k].n.toUpperCase()+' · ×2 ALL TICKETS FOREVER'));
  if (colNow) a.toast('🌈 THE WILDERLAND COLLECTION IS COMPLETE · ×10 ALL TICKETS FOREVER · FOUNDER PRIZES UNLOCKED');
  if (a.log) a.log('star', (pl.L ? 'upgraded ' : 'bought ')+it.n+' for '+fmt(pl.cost)+' ⭐');
  return true; };
// undo the last Wonder purchase within 5 seconds (misclicks happen)
WW.canUndo = () => !!undo && Date.now() - undo.at < 5000;
WW.undo = a => { a = a || api; if (!WW.canUndo()) return false; const u = undo; undo = null; const P = a.P(), patch = {...u.before}; if (patch.pets === undefined) delete patch.pets; a.setP(patch); a.toast('UNDONE · '+u.label.toUpperCase()+' · GOLDEN STARS REFUNDED'); a.sfx('blip'); return true; };

// ---------------- the reveal pop-up ----------------
const el = (tag, at, ...kids) => { const n = document.createElement(tag); at = at || {}; Object.keys(at).forEach(k => { const v = at[k]; if (v == null || v === false) return; if (k == 'style' && typeof v == 'object') Object.assign(n.style, v); else if (k == 'cls') n.className = v; else if (k.slice(0,2) == 'on') n[k] = v; else n.setAttribute(k, v); });
  kids.flat().forEach(c => { if (c == null || c === false) return; n.appendChild(typeof c == 'object' ? c : document.createTextNode(String(c))); }); return n; };
const show = (it, L, kick) => { ensureCss(); const o = el('div', {cls:'wlw-pop'}), lv = LV[Math.max(0, L-1)];
  const close = () => { o.remove(); document.removeEventListener('keydown', kd, true); }; const kd = e => { if (e.key == 'Escape' || e.key == 'Enter') { e.preventDefault(); e.stopPropagation(); close(); } };
  o.appendChild(el('div', {cls:'wlw-card wlw-big'+(it.founder ? ' wlw-f' : '')},
    el('div', {cls:'wlw-kick'}, it.founder ? 'FOUNDER RARITY' : kick), el('div', {cls:'wlw-orb'}, el('span', null, it.e)), el('div', {cls:'wlw-nm'}, it.n),
    it.founder ? null : el('div', {cls:'wlw-lv', style:{background:lv.c}}, lv.n+' · level '+L+' / '+MAXL),
    el('div', {cls:'wlw-eff'}, '✨ '+WW.effText(it, L)+' · forever'),
    el('div', {style:{display:'flex', gap:'8px', justifyContent:'center', marginTop:'12px'}}, el('button', {cls:'wlw-btn', onclick:close}, 'Wonderful!'), WW.canUndo() ? el('button', {cls:'wlw-btn alt', onclick:()=>{ WW.undo(); close(); if (api && api.rerender) api.rerender(); }}, '↩ Undo') : null)));
  o.onclick = e => { if (e.target === o) close(); }; document.addEventListener('keydown', kd, true); document.body.appendChild(o);
  if (window.Arcade && window.Arcade.tone) [659,784,988,1318,1568,1976].forEach((f,i)=>window.Arcade.tone(f,.22,'triangle',.05,i*.09)); };

// ---------------- the panel (inside Prize Counter → ⭐ Wilderland) ----------------
let fSet = 'all'; try { fSet = localStorage.getItem('wl-ww-set') || 'all'; } catch(e){}
WW.panel = (a) => { ensureCss(); const P = a.P(), o = own(P), bz = WW.bonus(P), q = (a.q || '').trim().toLowerCase(), want = a.qty || 1, free = freeStars(P);
  const box = el('div', {cls:'wlw'});
  box.appendChild(el('div', {cls:'wlw-hero'},
    el('div', {style:{fontWeight:800, fontSize:'20px'}}, '🌈 Wilderland Wonders'),
    el('div', {style:{fontSize:'13px', opacity:.9}}, 'Legendary Golden-Star prizes. Every one gives a permanent bonus that survives every Rebirth, and each can be upgraded Bronze → Silver → Gold → Diamond → Wilderland. Wonders never appear in capsules.'),
    el('div', {cls:'wlw-chips'},
      el('span', null, '⭐ '+fmt(free)+' to spend'), el('span', null, '🏛️ '+WW.owned(P)+' / '+LIST.length+' owned'), el('span', null, '✖️ ×'+fmt(Math.round(bz.all*100)/100)+' all tickets'),
      el('span', null, '🧩 '+bz.sets+' / '+Object.keys(SETS).length+' sets'), bz.col ? el('span', {cls:'gold'}, '🌈 COLLECTION COMPLETE ×10') : el('span', null, '🌈 Whole collection: ×10 all tickets')),
    WW.canUndo() ? el('button', {cls:'wlw-btn alt sm', style:{marginTop:'8px'}, onclick:()=>{ WW.undo(a); a.rerender && a.rerender(); }}, '↩ Undo last Wonder purchase') : null));
  const chips = el('div', {cls:'wlw-row'}); [['all','✨ All'], ...Object.keys(SETS).map(k => [k, SETS[k].e+' '+SETS[k].n]), ['founder','💠 Founder'], ['can','✅ Can afford']].forEach(([k, n]) => {
    const done = SETS[k] && WW.setsDone(P).includes(k); chips.appendChild(el('button', {cls:'wlw-chip'+(fSet == k ? ' on' : '')+(done ? ' done' : ''), onclick:()=>{ fSet = k; try { localStorage.setItem('wl-ww-set', k); } catch(e){} a.rerender && a.rerender(); }}, n+(done ? ' ✓' : ''))); });
  box.appendChild(chips);
  const grid = el('div', {cls:'wlw-grid'});
  const items = (fSet == 'founder' ? FOUNDER : fSet == 'all' ? ALL : fSet == 'can' ? ALL.filter(it => { const L = o[it.id]|0; return L < WW.maxL(it) && !it.pin && (!it.founder || WW.founderOk(P)) && free >= WW.cost(it, L); }) : LIST.filter(it => it.set == fSet))
    .filter(it => !q || (it.n+' '+it.d+' '+WW.effText(it, 1)).toLowerCase().includes(q));
  items.forEach(it => { const L = o[it.id]|0, max = WW.maxL(it), lv = L ? LV[L-1] : null, locked = it.founder && !it.pin && !WW.founderOk(P), pl = WW.plan(P, it, want);
    const card = el('div', {cls:'wlw-card'+(L ? ' own' : '')+(it.founder ? ' wlw-f' : '')+(locked ? ' lk' : ''), style:{'--lc': lv ? lv.c : '#ff5fd2'}},
      el('div', {cls:'wlw-tier'}, it.founder ? 'FOUNDER' : 'WILDERLAND'),
      el('div', {cls:'wlw-orb'}, el('span', null, it.e)),
      el('div', {cls:'wlw-nm'}, it.n), el('div', {cls:'wlw-d'}, it.d),
      L && !it.founder ? el('div', {cls:'wlw-lv', style:{background:lv.c}}, lv.n+' · '+L+'/'+max) : null,
      el('div', {cls:'wlw-eff'+(L ? ' on' : '')}, (L ? '✅ ' : '✨ ')+WW.effText(it, Math.max(1, L))),
      L && L < max ? el('div', {cls:'wlw-next'}, 'Next level ('+LV[L].n+'): '+WW.effText(it, L + 1)) : null,
      it.pin ? el('div', {cls:'wlw-buy done'}, L ? '✓ Yours forever' : '🔒 Founding players only') :
      locked ? el('div', {cls:'wlw-buy done'}, '🔒 Own all '+LIST.length+' Wonders first ('+WW.owned(P)+'/'+LIST.length+')') :
      L >= max ? el('div', {cls:'wlw-buy done'}, it.founder ? '✓ Owned' : '🌈 MAX LEVEL') :
      el('button', {cls:'wlw-buy'+(pl.n ? ' ok' : ''), disabled: pl.n ? null : 'disabled', onclick:()=>{ if (WW.buy(it, want, a)) a.rerender && a.rerender(); }},
        (pl.n ? '✓ ' : '')+(L ? 'Upgrade' : 'Buy')+(pl.n > 1 ? ' ×'+pl.n : '')+' · '+fmt(pl.n ? pl.cost : pl.next)+' ⭐'));
    grid.appendChild(card); });
  if (!items.length) grid.appendChild(el('div', {style:{color:'#4a4a4a', fontSize:'13px'}}, fSet == 'can' ? 'Nothing you can afford right now — Rebirth for more Golden Stars.' : 'No Wonders match your search.'));
  box.appendChild(grid); return box; };

// ---------------- founding players ----------------
WW.attach = a => { api = a; ensureCss(); if (WW._t) return; WW._t = setInterval(tick, 2500); setTimeout(tick, 900); };
const tick = () => { if (!api) return; const P = api.P(); if (!P || (api.ready && !api.ready()) || (api.admin && api.admin())) return;
  if (P.founderChk) return; const founding = Date.now() < FOUNDER_CUTOFF && ((P.earned||0) > 0 || (P.rebirths||0) > 0 || Object.keys(P.played||{}).length > 0);
  api.setP({founderChk:1, ...(founding ? {wonders:{...own(P), fpin:1}} : {})});
  if (founding) setTimeout(() => show(FOUNDER[0], 1, 'YOU’RE A FOUNDER!'), 1500); };

// ---------------- styles ----------------
let cssDone = false;
const ensureCss = () => { if (cssDone) return; cssDone = true; const s = document.createElement('style'); s.textContent = `
@keyframes wlwSpin{to{transform:rotate(360deg)}}
@keyframes wlwFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes wlwGlow{0%,100%{box-shadow:0 0 10px var(--lc),0 0 0 3px #fff}50%{box-shadow:0 0 26px var(--lc),0 0 0 3px #fff}}
@keyframes wlwRain{to{background-position:200% 50%}}
@keyframes wlwShine{0%{background-position:-150% 0}100%{background-position:250% 0}}
.wlw{font-family:"Uncut Sans","Inter",system-ui,sans-serif;margin-bottom:14px}
.wlw *{box-sizing:border-box}
.wlw-hero{background:linear-gradient(120deg,#3a1660,#015640 55%,#0b4a6e);color:#fff;border-radius:18px;padding:14px 16px;position:relative;overflow:hidden;border:3px solid transparent;background-clip:padding-box;box-shadow:0 0 0 3px #ff5fd2,0 0 24px rgba(255,95,210,.45)}
.wlw-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.wlw-chips span{background:rgba(255,255,255,.14);border-radius:999px;padding:5px 10px;font-size:12px;font-weight:700}.wlw-chips span.gold{background:#F9BF01;color:#121313}
.wlw-row{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
.wlw-chip{border:1.5px solid #015640;border-radius:999px;padding:6px 11px;font:700 12px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#015640}.wlw-chip.on{background:#015640;color:#fff}.wlw-chip.done{border-color:#00B451;box-shadow:0 0 0 2px #D5F367}
.wlw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.wlw-card{--lc:#ff5fd2;position:relative;border-radius:16px;padding:12px 10px;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;background:#fff;overflow:hidden;border:3px solid transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#ff4539,#f9bf01,#00b451,#64cdf5,#a64be0,#ff4539) border-box;background-size:100% 100%,200% 100%;animation:wlwRain 4s linear infinite}
.wlw-card::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.6) 50%,transparent 65%);background-size:250% 100%;animation:wlwShine 3.2s linear infinite}
.wlw-card.own{background:linear-gradient(#fffbea,#fff3f9) padding-box,linear-gradient(90deg,#ff4539,#f9bf01,#00b451,#64cdf5,#a64be0,#ff4539) border-box;background-size:100% 100%,200% 100%}
.wlw-card.lk{filter:grayscale(.5);opacity:.75}
.wlw-card.wlw-f{background:linear-gradient(145deg,#1b1630,#0b0b14) padding-box,linear-gradient(90deg,#F9BF01,#fff3b0,#c48a00,#fff3b0,#F9BF01) border-box;background-size:100% 100%,200% 100%;color:#fff3b0}
.wlw-f .wlw-nm{color:#F9BF01}.wlw-f .wlw-d{color:#d8cfa8}.wlw-f .wlw-tier{color:#F9BF01;background:linear-gradient(90deg,#F9BF01,#fff,#F9BF01);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:wlwRain 2.5s linear infinite}
.wlw-tier{font-size:10px;font-weight:800;letter-spacing:.16em;background:linear-gradient(90deg,#ff4539,#f9bf01,#00b451,#64cdf5,#a64be0,#ff4539);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:wlwRain 3s linear infinite}
.wlw-orb{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:38px;background:conic-gradient(from 0deg,#ff4539,#f9bf01,#00b451,#64cdf5,#a64be0,#ff4539);animation:wlwGlow 2.4s ease-in-out infinite;position:relative}
.wlw-orb::before{content:"";position:absolute;inset:5px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#fff3f9 60%,#ffe3f4)}
.wlw-f .wlw-orb{background:conic-gradient(#F9BF01,#fff3b0,#c48a00,#fff3b0,#F9BF01)}.wlw-f .wlw-orb::before{background:radial-gradient(circle at 35% 30%,#3a2d5e,#121313)}
.wlw-orb span{position:relative;animation:wlwFloat 2.6s ease-in-out infinite}
.wlw-nm{font-weight:800;font-size:15px;color:#015640;line-height:1.15}
.wlw-d{font-size:11px;color:#4a4a4a;line-height:1.3;min-height:28px}
.wlw-lv{font-size:11px;font-weight:800;color:#121313;border-radius:999px;padding:2px 9px}
.wlw-eff{font-size:12px;font-weight:700;color:#AB2372;background:#fff1f8;border-radius:10px;padding:4px 8px;position:relative;z-index:1}.wlw-eff.on{color:#007a37;background:#eefbe8}
.wlw-f .wlw-eff{background:rgba(249,191,1,.12);color:#F9BF01}
.wlw-next{font-size:11px;color:#015640;position:relative;z-index:1}.wlw-f .wlw-next{color:#d8cfa8}
.wlw-buy{margin-top:auto;border:none;border-radius:999px;padding:9px 12px;font:800 13px inherit;font-family:inherit;cursor:pointer;background:#e6e2cf;color:#6a6a6a;width:100%;position:relative;z-index:1}
.wlw-buy.ok{background:#F9BF01;color:#121313}.wlw-buy:disabled{cursor:default}.wlw-buy.done{background:transparent;color:#015640;font-size:12px}.wlw-f .wlw-buy.done{color:#F9BF01}
.wlw-btn{border:none;border-radius:999px;padding:10px 20px;font:800 14px inherit;font-family:inherit;cursor:pointer;background:#015640;color:#fff}.wlw-btn.alt{background:#D5F367;color:#015640}.wlw-btn.sm{padding:6px 12px;font-size:12px}
.wlw-pop{position:fixed;inset:0;z-index:9700;background:rgba(20,6,30,.86);display:flex;align-items:center;justify-content:center;padding:14px;font-family:"Uncut Sans","Inter",system-ui,sans-serif}
.wlw-big{max-width:360px;width:100%;padding:22px 18px;animation:wlwRain 3s linear infinite}
.wlw-big .wlw-orb{width:120px;height:120px;font-size:64px}
.wlw-kick{font-size:12px;font-weight:800;letter-spacing:.18em;color:#AB2372}.wlw-f .wlw-kick{color:#F9BF01}
@media (prefers-reduced-motion:reduce){.wlw-card,.wlw-orb,.wlw-orb span,.wlw-card::after,.wlw-tier{animation:none!important}}
html.wl-lowfx .wlw-card,html.wl-lowfx .wlw-orb,html.wl-lowfx .wlw-orb span,html.wl-lowfx .wlw-card::after{animation:none!important}
`; document.head.appendChild(s); };
window.WLW = WW;
})();
