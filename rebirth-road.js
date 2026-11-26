// Wilderland Arcade · REBIRTH ROAD — a board-game trail of rebirth milestones and their rewards,
// the catch-up gift for players who already rebirthed, milestone celebrations, the rebirth summary,
// floor themes, the Rebirth Aura and the Music Player screen.
// Everything here is worked out from the player's total rebirth count (P.rebirths), so nothing can be lost.
// Things that go into an inventory (pets, home decorations, the free home upgrade) are handed out once and
// remembered in P.road.got.
(function(){
'use strict';
const R = {};
const fmt = n => window.WLP ? window.WLP.fmt(n) : String(Math.round(n));
const rbOf = P => (P && P.rebirths) || 0;
const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('wl-lowfx') || localStorage.getItem('wl-arcade-lowfx') == '1'; } catch(e) { return false; } };
const el = (tag, a, ...kids) => { const n = document.createElement(tag); a = a || {};
  Object.keys(a).forEach(k => { const v = a[k]; if (v == null || v === false) return; if (k == 'style' && typeof v == 'object') Object.assign(n.style, v); else if (k == 'cls') n.className = v; else if (k.slice(0,2) == 'on') n[k] = v; else if (k == 'html') n.innerHTML = v; else n.setAttribute(k, v); });
  kids.flat().forEach(c => { if (c == null || c === false) return; n.appendChild(typeof c == 'object' ? c : document.createTextNode(String(c))); }); return n; };
const timeTxt = s => { s = Math.max(0, Math.round(s||0)); if (!s) return '—'; const d = Math.floor(s/86400), h = Math.floor(s%86400/3600), m = Math.floor(s%3600/60), x = s%60;
  return d ? d+'d '+h+'h' : h ? h+'h '+m+'m' : m ? m+'m '+(x<10?'0':'')+x+'s' : x+'s'; };
R.timeTxt = timeTxt;

// ---------------- floor themes ----------------
const CHECK = (a, b, size) => 'background-color:'+a+'; background-image:repeating-conic-gradient('+b+' 0 25%, '+a+' 0 50%); background-size:'+(size||80)+'px '+(size||80)+'px;';
const THEMES = [
  {id:'classic', n:'Classic Arcade', rb:0, sw:['#DAD3B1','#d2caa4'], css:CHECK('#DAD3B1','#d2caa4')},
  {id:'neon',    n:'Neon Night', rb:7, sw:['#2a1f4a','#EA55AB'], css:'background-color:#3a2d5e; background-image:linear-gradient(rgba(234,85,171,.35) 2px, transparent 2px), linear-gradient(90deg, rgba(100,205,245,.35) 2px, transparent 2px), radial-gradient(circle at 50% 30%, #51407f, #2e2350); background-size:80px 80px, 80px 80px, 100% 100%;'},
  {id:'aurora',  n:'Aurora Sky', rb:25, sw:['#9fe8d8','#b48cff'], css:'background-color:#bfeee0; background-image:repeating-conic-gradient(rgba(255,255,255,.18) 0 25%, transparent 0 50%), linear-gradient(160deg, #a8f0dc 0%, #c9b8ff 45%, #9fd8ff 100%); background-size:80px 80px, 100% 100%;'},
  {id:'golden',  n:'Golden Arcade', rb:50, sw:['#f3d36b','#e8b923'], gold:1, css:CHECK('#f3d36b','#e8c24a')+' box-shadow:0 0 0 6px #F9BF01, 0 18px 50px rgba(0,0,0,.35);'},
  {id:'cosmic',  n:'Cosmic Carnival', rb:150, sw:['#3b3f8f','#ff5fd2'], css:'background-color:#4a4f9e; background-image:radial-gradient(circle, rgba(255,255,255,.55) 1.5px, transparent 2px), repeating-conic-gradient(rgba(255,95,210,.18) 0 25%, transparent 0 50%); background-size:46px 46px, 80px 80px;'},
  {id:'candy',   n:'Candy Clouds', rb:225, sw:['#ffd6ec','#c7f1ee'], css:CHECK('#ffe1f0','#c7f1ee')},
];
const prismTheme = n => { const h = (n*47) % 360; return {id:'prism'+n, n:'Prism Floor '+(n/100 - 2), rb:n, sw:['hsl('+h+',70%,78%)','hsl('+((h+40)%360)+',70%,70%)'], css:CHECK('hsl('+h+',65%,80%)','hsl('+((h+40)%360)+',65%,74%)')}; };
const themeById = id => THEMES.find(t => t.id == id) || (/^prism\d+$/.test(id||'') ? prismTheme(+id.slice(5)) : null);
R.themes = P => { const rb = rbOf(P), out = THEMES.slice(); for (let n = 300; n <= Math.max(300, rb + 100); n += 100) out.push(prismTheme(n)); return out.map(t => ({...t, ok: rb >= t.rb, on: (P.floorTheme || 'classic') == t.id})); };
R.theme = P => { const t = themeById(P.floorTheme || 'classic'); return t && rbOf(P) >= t.rb ? t : THEMES[0]; };
R.floorCss = P => R.theme(P).css;
// cabinet glow: your chosen skin, or gold cabinets with the Golden Arcade theme
R.cabSkin = P => { const W = window.WLP; if (P.skin && (!W || !W.skinOk || W.skinOk(P, (W.SKINS||[]).find(s => s.id == P.skin) || {stars:0}))) return P.skin; return R.theme(P).gold ? 'goldcab' : ''; };

// ---------------- milestones ----------------
const BASE = [1,2,3,5,7,9,10,13,15,20,25,30,40,50,75,100,125,150,175,200,225,250];
R.miles = upto => { const out = BASE.slice(); for (let n = 300; n <= Math.max(500, (upto||0) + 200); n += 50) out.push(n); return out; };
R.size = n => n == 100 || (n >= 300 && n % 100 == 0) ? 'huge' : [10,20,50,150,200,250].includes(n) ? 'big' : '';
const T = {
  1:   [{k:'title', v:'Reborn'}, {k:'song', v:'First Light'}],
  2:   [{k:'skin', id:'reborn', v:'Reborn Glow'}, {k:'start', v:1}],
  3:   [{k:'avatar', v:'Reborn Hoodie (outfit)'}, {k:'song', v:'Trailblazer'}],
  5:   [{k:'pet', id:'cinder', v:'Cinder the Reborn Fox'}, {k:'quick', v:1}],
  7:   [{k:'theme', id:'neon', v:'Neon Night'}, {k:'song', v:'Neon Night Drive'}],
  9:   [{k:'critter', v:1.5}, {k:'avatar', v:'Phoenix Feathers (trail)'}],
  10:  [{k:'player'}, {k:'mult', v:2}, {k:'decor', id:'rbfount', v:'Rebirth Fountain'}, {k:'song', v:'Sneaky Snitch', file:1}],
  13:  [{k:'pet', id:'clover', v:'Lucky the Clover Cat (rare)'}, {k:'charm'}],
  15:  [{k:'emote', v:'Spin 🌀'}, {k:'song', v:'Lucky Clover Jig'}],
  20:  [{k:'aura'}, {k:'keep', v:10}, {k:'song', v:'Fluffing a Duck', file:1}],
  25:  [{k:'hometier'}, {k:'theme', id:'aurora', v:'Aurora Sky'}],
  30:  [{k:'avatar', v:'Rebirth Legend Armor (legendary outfit)'}, {k:'song', v:'Scheming Weasel (faster version)', file:1}],
  40:  [{k:'autobuy'}, {k:'start', v:1}, {k:'song', v:'Investigations', file:1}],
  50:  [{k:'theme', id:'golden', v:'Golden Arcade (gold cabinets and floor)'}, {k:'skin', id:'goldcab', v:'Golden Arcade'}, {k:'title', v:'Rebirth Legend'}, {k:'mult', v:5}, {k:'quick', v:1}, {k:'song', v:'Cipher', file:1}],
  75:  [{k:'pet', id:'nova', v:'Nova the Starlight Dragon (mythic)'}, {k:'song', v:'Mythic Skies'}],
  100: [{k:'title', v:'Eternal'}, {k:'rainbow'}, {k:'statue'}, {k:'mult', v:10}, {k:'song', v:'Eternal Anthem'}],
  125: [{k:'song', v:'Comet Waltz'}, {k:'emote', v:'Starburst 🌟'}, {k:'keep', v:5}, {k:'mult', v:2}],
  150: [{k:'theme', id:'cosmic', v:'Cosmic Carnival'}, {k:'pet', id:'orbit', v:'Orbit the Galaxy Owl (cosmic)'}, {k:'title', v:'Star Reborn'}, {k:'mult', v:3}],
  175: [{k:'song', v:'Starforge Funk'}, {k:'avatar', v:'Rebirth Nebula (background)'}, {k:'start', v:1}, {k:'mult', v:2}],
  200: [{k:'title', v:'Double Century'}, {k:'pet', id:'aurum', v:'Aurum the Golden Phoenix (Wilderland)'}, {k:'decor', id:'rbarch', v:'Golden Rebirth Arch'}, {k:'quick', v:1}, {k:'mult', v:5}],
  225: [{k:'song', v:'Wilderland Forever'}, {k:'theme', id:'candy', v:'Candy Clouds'}, {k:'mult', v:2}],
  250: [{k:'title', v:'Wilderland Immortal'}, {k:'pet', id:'prisma', v:'Prisma the Eternal Wisp (Wilderland)'}, {k:'avatar', v:'Immortal Starsuit (outfit)'}, {k:'keep', v:5}, {k:'mult', v:5}],
};
R.rewards = n => { if (T[n]) return T[n];
  if (n >= 300 && n % 100 == 0) { const t = prismTheme(n); return [{k:'title', v:'Reborn ×'+n}, {k:'theme', id:t.id, v:t.n}, {k:'mult', v:5}, {k:'quick', v:1}, {k:'keep', v:5}]; }
  if (n >= 300) return [{k:'mult', v:2}, {k:'start', v:.5}];
  return []; };
const ICON = {title:'🏷️', song:'🎵', skin:'🕹️', start:'🎟️', avatar:'👕', pet:'🐾', quick:'🛠️', theme:'🎨', critter:'🦊', player:'🎧', mult:'✖️', decor:'🏠', charm:'🍀', emote:'💃', aura:'✨', keep:'🏗️', hometier:'🏡', autobuy:'🤖', rainbow:'🌈', statue:'🗽'};
R.icon = n => { const r = R.rewards(n); const pri = ['statue','player','aura','pet','theme','song','title','mult']; for (const k of pri) { const x = r.find(y => y.k == k); if (x) return ICON[k]; } return r.length ? ICON[r[0].k] : '⭐'; };
// cumulative values (Quick Start levels, % kept, % starting tickets) at a rebirth count
const cum = (k, rb) => { let v = 0; R.miles(rb).forEach(n => { if (n <= rb) R.rewards(n).forEach(x => { if (x.k == k) v += x.v; }); }); return v; };
const CAP = {keep:50, start:10};
R.text = (x, n) => { switch (x.k) {
  case 'title': return 'Title “'+x.v+'”';
  case 'song': return 'New music: “'+x.v+'”'+(x.file ? ' by Kevin MacLeod' : ' (original)');
  case 'skin': return 'Cabinet skin: '+x.v;
  case 'start': return 'Start every Rebirth with '+Math.min(CAP.start, cum('start', n))+'% of the next Rebirth’s tickets';
  case 'avatar': return 'Avatar: '+x.v;
  case 'pet': return 'New pet: '+x.v;
  case 'quick': return 'Quick Start: every Rebirth starts with Upgrade Workshop Lv '+cum('quick', n)+' on every machine';
  case 'theme': return 'Arcade floor theme: '+x.v;
  case 'critter': return 'Golden Critters appear ×'+x.v+' as often';
  case 'player': return 'Music Player: pick any unlocked song, shuffle, make playlists';
  case 'mult': return 'Permanent ×'+x.v+' tickets (survives every Rebirth)';
  case 'decor': return 'Home decoration: '+x.v;
  case 'charm': return 'Lucky Charm: 1 in 5 capsules rolls twice and keeps the rarer prize';
  case 'emote': return 'New emote: '+x.v;
  case 'aura': return 'Rebirth Aura: your avatar glows, and the color changes with your rebirth count';
  case 'keep': return 'Keep '+Math.min(CAP.keep, cum('keep', n))+'% of your Arcade Expansion levels after each Rebirth';
  case 'hometier': return 'A free home upgrade to the next tier';
  case 'autobuy': return 'Auto-buy for the Upgrade Workshop (switch it on or off)';
  case 'rainbow': return 'An animated rainbow name on the leaderboards';
  case 'statue': return 'A golden statue of your avatar in the Hall of Fame';
  default: return ''; } };
R.lines = n => R.rewards(n).map(x => ({e:ICON[x.k] || '⭐', t:R.text(x, n), k:x.k}));

// ---------------- what you have now ----------------
let vc = {rb:-1, v:null};
R.vals = P => { const rb = rbOf(P); if (vc.rb === rb) return vc.v; const v = {mult:1, critter:1, start:0, quick:0, keep:0, player:false, charm:false, aura:false, autobuy:false, rainbow:false, statue:false, titles:[]};
  R.miles(rb).forEach(n => { if (n > rb) return; R.rewards(n).forEach(x => { switch (x.k) {
    case 'mult': v.mult *= x.v; break; case 'critter': v.critter *= x.v; break; case 'start': v.start += x.v; break; case 'quick': v.quick += x.v; break; case 'keep': v.keep += x.v; break;
    case 'title': v.titles.push(x.v); break; case 'player': case 'charm': case 'aura': case 'autobuy': case 'rainbow': case 'statue': v[x.k] = true; break; } }); });
  v.start = Math.min(CAP.start, v.start); v.keep = Math.min(CAP.keep, v.keep); vc = {rb, v}; return v; };
R.mult = P => Math.min(1e300, R.vals(P).mult);
R.critter = P => R.vals(P).critter;
R.charm = P => R.vals(P).charm;
R.player = P => R.vals(P).player;
R.reachedCount = P => R.miles(rbOf(P)).filter(n => n <= rbOf(P)).length;
R.next = P => R.miles(rbOf(P)).find(n => n > rbOf(P));
R.prev = P => { const r = R.miles(rbOf(P)).filter(n => n <= rbOf(P)); return r.length ? r[r.length-1] : 0; };
R.aura = P => { if (!R.vals(P).aura || P.auraOff) return ''; const h = (rbOf(P) * 37) % 360; return 'drop-shadow(0 0 5px hsl('+h+',100%,62%)) drop-shadow(0 0 12px hsl('+((h+40)%360)+',100%,60%))'; };
R.rainbowCss = rb => (rb||0) >= 100 ? 'background:linear-gradient(90deg,#ff5fd2,#F9BF01,#00B451,#64CDF5,#b48cff,#ff5fd2); background-size:200% 100%; -webkit-background-clip:text; background-clip:text; color:transparent; animation:wlrRainbow 3s linear infinite;' : '';
R.statue = P => R.vals(P).statue;
R.autobuyOn = P => R.vals(P).autobuy && P.rbAutoBuy !== false;
// Rebirth head start (called by the Prize Counter's Rebirth): tickets to start with, Quick Start levels, kept expansions
let api = null;
R.head = (P, upg, exp) => { const after = {...P, rebirths:rbOf(P) + 1}, v = R.vals(after), W = window.WLP, out = {tickets:0, exp:{...(exp||{})}};
  const st = Math.min(35, v.start + (window.WLW ? window.WLW.start(P) : 0)); if (st && W) out.tickets = Math.floor(W.rebirthNeed(after) * st / 100);
  if (v.quick && api && api.upg) { const U = api.upg(); Object.keys(U).forEach(g => { const cur = {...(upg[g]||{})}; U[g].forEach(u => { if (u.one) return; if ((cur[u.k]|0) < v.quick) cur[u.k] = v.quick; }); upg[g] = cur; }); }
  if (v.keep) Object.keys(P.exp||{}).forEach(k => { const kept = Math.floor(((P.exp||{})[k]|0) * v.keep / 100); if ((out.exp[k]|0) < kept) out.exp[k] = kept; });
  return out; };
// titles join the achievement title list
const wrapTitles = () => { const A = window.WLA; if (!A || !A.titles || A._roadTitles) return; A._roadTitles = 1; const old = A.titles;
  A.titles = P => { const have = old(P), names = new Set(have.map(x => x.n)); return [...have, ...R.vals(P).titles.filter(n => !names.has(n)).map(n => ({n, f:'road', t:0}))]; }; };

// ---------------- giving rewards (inventory items only — everything else is automatic) ----------------
const grantPatch = (P, list) => { const patch = {}; const H = window.WLH;
  list.forEach(n => R.rewards(n).forEach(x => {
    if (x.k == 'pet' && H) { const pets = patch.pets || H.norm(P); if (!pets.own[x.id]) patch.pets = {...pets, own:{...pets.own, [x.id]:{xp:0}}}; }
    if (x.k == 'decor' && H) { const h = patch.home || H.home(P); if (!h['got_'+x.id]) patch.home = {...h, ['got_'+x.id]:1, inv:{...h.inv, [x.id]:(h.inv[x.id]|0) + 1}}; }
    if (x.k == 'hometier' && H) { const h = patch.home || H.home(P); if (h.tier < H.TIERS.length - 1) patch.home = {...h, tier:h.tier + 1}; }
  }));
  const got = {...((P.road||{}).got||{})}; list.forEach(n => got[n] = Date.now()); patch.road = {...(P.road||{}), v:1, got}; return patch; };
R.pending = P => { const got = (P.road||{}).got || {}, rb = rbOf(P); return R.miles(rb).filter(n => n <= rb && !got[n]); };
R.claimAll = (silent) => { if (!api) return; const P = api.P(); const list = R.pending(P); if (!list.length) return; api.setP(grantPatch(P, list)); if (!silent) queue(() => celebrate(list)); refresh(); };

// ---------------- overlays (one at a time, after any rebirth/diamond celebration) ----------------
const Q = [];
const queue = fn => { Q.push(fn); pump(); };
const pump = () => { if (!Q.length || document.querySelector('.wlr-pop') || document.querySelector('.wle-celebrate')) return; const fn = Q.shift(); try { fn(); } catch(e) { console.error(e); } };
setInterval(pump, 700);
const fanfare = big => { const A = window.Arcade; if (!A || !A.tone) return; const notes = big ? [523,659,784,1046,784,1046,1318,1568,2093] : [523,659,784,1046,1318]; notes.forEach((f, i) => A.tone(f, .22, i % 2 ? 'square' : 'triangle', .05, i * .11)); };
const confetti = (o, n, cols) => { if (reduced()) return; for (let i = 0; i < n; i++) { const a = Math.random()*7, d = 160 + Math.random()*480, pp = el('div', {cls:'wlr-pp', style:{left:'50%', top:'38%', width:(6+Math.random()*9)+'px', height:(6+Math.random()*9)+'px', background:cols[i % cols.length], animationDuration:(1.1+Math.random()*.9)+'s', borderRadius: i%3 ? '2px' : '50%'}}); pp.style.setProperty('--dx', Math.cos(a)*d+'px'); pp.style.setProperty('--dy', Math.sin(a)*d+'px'); o.appendChild(pp); } };
const rewardCard = (ln, i) => el('div', {cls:'wlr-rc', style:{animationDelay:(reduced() ? 0 : .35 + i*.12)+'s'}}, el('div', {cls:'wlr-rc-e'}, ln.e), el('div', {cls:'wlr-rc-t'}, ln.t));
const pop = (cls, card, cols) => { ensureCss(); const o = el('div', {cls:'wlr-pop '+(cls||'')}); o.appendChild(card); confetti(o, cols ? 80 : 0, cols || []); document.body.appendChild(o);
  const close = () => { o.remove(); document.removeEventListener('keydown', kd, true); setTimeout(pump, 50); }; const kd = e => { if (e.key == 'Escape' || e.key == 'Enter') { e.stopPropagation(); e.preventDefault(); close(); } }; document.addEventListener('keydown', kd, true); return close; };
// a milestone (or a few at once) was just reached
const celebrate = list => { const n = list[list.length - 1], size = R.size(n), lines = list.flatMap(m => R.lines(m)); let close;
  const card = el('div', {cls:'wlr-card'+(size ? ' wlr-'+size : '')},
    el('div', {cls:'wlr-badge'}, el('div', {cls:'wlr-badge-e'}, R.icon(n)), el('div', {cls:'wlr-badge-n'}, n)),
    el('div', {cls:'wlr-kick'}, size == 'huge' ? 'HUGE MILESTONE!' : size == 'big' ? 'BIG MILESTONE!' : 'MILESTONE REACHED!'),
    el('div', {cls:'wlr-h1'}, list.length > 1 ? 'Rebirths '+list.join(', ') : 'Rebirth '+n),
    el('div', {cls:'wlr-rcs'}, lines.map(rewardCard)),
    el('div', {style:{display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginTop:'14px'}},
      el('button', {cls:'wlr-btn', onclick:()=>close()}, 'Awesome!'), el('button', {cls:'wlr-btn alt', onclick:()=>{ close(); R.open(); }}, '🛣️ See the Rebirth Road')));
  close = pop(size ? 'wlr-'+size+'-bg' : '', card, size == 'huge' ? ['#ff5fd2','#F9BF01','#00B451','#64CDF5','#b48cff','#fff'] : ['#F9BF01','#D5F367','#EA55AB','#64CDF5','#fff']); fanfare(!!size); };
// players who rebirthed before this update: everything at once, one summary, once
const welcome = list => { const total = list.reduce((a, n) => a + R.rewards(n).length, 0); let close;
  const card = el('div', {cls:'wlr-card wlr-welcome'},
    el('div', {style:{fontSize:'46px'}}, '🛣️'), el('div', {cls:'wlr-h1'}, 'Welcome back!'),
    el('div', {style:{fontSize:'14px', color:'#3d3d3d', margin:'2px 0 10px'}}, 'You’ve already rebirthed '+fmt(rbOf(api.P()))+' time'+(rbOf(api.P())==1?'':'s')+', so the new Rebirth Road gave you every reward you’ve passed: '+total+' rewards from '+list.length+' milestone'+(list.length==1?'':'s')+'. You unlocked…'),
    el('div', {cls:'wlr-wl'}, list.map(n => el('div', {cls:'wlr-wrow'}, el('div', {cls:'wlr-wn'+(R.size(n) ? ' big' : '')}, R.icon(n), el('b', null, n)), el('div', {style:{flex:1, minWidth:0}}, R.lines(n).map(ln => el('div', {cls:'wlr-wli'}, ln.e+' '+ln.t)))))),
    el('div', {style:{display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginTop:'12px'}},
      el('button', {cls:'wlr-btn', onclick:()=>close()}, 'Thanks!'), el('button', {cls:'wlr-btn alt', onclick:()=>{ close(); R.open(); }}, '🛣️ Open the Rebirth Road')));
  close = pop('', card, ['#F9BF01','#D5F367','#EA55AB','#64CDF5','#fff']); fanfare(true); };
// the rebirth summary (shown right after every rebirth)
R.summary = info => queue(() => { let close; const P = api ? api.P() : {}, nx = R.next(P), v = R.vals(P), toDia = info.toDia || (10 - (rbOf(P) % 10));
  const stat = (k, val, extra) => el('div', {cls:'wlr-st'}, el('div', {cls:'wlr-st-k'}, k), el('div', {cls:'wlr-st-v'}, val), extra || null);
  const card = el('div', {cls:'wlr-card'},
    el('div', {style:{fontSize:'48px'}}, '🌟'), el('div', {cls:'wlr-kick'}, 'REBIRTH #'+info.n),
    el('div', {cls:'wlr-h1'}, '+'+fmt(info.stars)+' Golden Star'+(info.stars>1?'s':'')+'!'),
    el('div', {style:{fontSize:'13px', color:'#3d3d3d', marginBottom:'10px'}}, 'You have '+fmt(info.total)+' Golden Stars ('+fmt(info.free)+' to spend on Wilderland prizes) · every payout ×'+fmt(info.starMult)+' from stars'),
    el('div', {cls:'wlr-sts'},
      stat('Tickets earned this run', info.runT ? fmt(info.runT) : '—'),
      stat('Time this run', timeTxt(info.runS), info.newRec ? el('div', {cls:'wlr-rec'}, '⚡ NEW RECORD!') : null),
      stat('Fastest rebirth', timeTxt(info.fast)),
      stat('Rebirth streak', ((P.rbStr||{}).n||1)+' day'+(((P.rbStr||{}).n||1)==1?'':'s')),
      stat('Diamond Star', toDia == 10 ? '💎 earned!' : (10 - toDia)+' / 10', el('div', {cls:'wlr-mini'}, el('div', {style:{width:((10 - toDia) % 10)*10+'%'}}))),
      stat('Rebirth multiplier', '×'+fmt(v.mult))),
    nx ? el('div', {cls:'wlr-nextbox'}, el('div', {style:{fontWeight:800, color:'#AB2372', fontSize:'12px', letterSpacing:'.1em'}}, 'NEXT ON THE ROAD · REBIRTH '+nx+' ('+(nx - rbOf(P))+' to go)'), R.lines(nx).slice(0, 4).map(ln => el('div', {style:{fontSize:'13px'}}, ln.e+' '+ln.t))) : null,
    (v.start || v.quick || v.keep) ? el('div', {style:{fontSize:'12px', color:'#015640', marginTop:'8px', fontWeight:700}}, 'Speed-ups this run: '+[v.start ? 'started with '+fmt(P.tickets||0)+' tickets' : '', v.quick ? 'Workshop Lv '+v.quick : '', v.keep ? 'kept '+v.keep+'% of expansions' : ''].filter(Boolean).join(' · ')) : null,
    el('div', {style:{display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginTop:'14px'}},
      el('button', {cls:'wlr-btn', onclick:()=>close()}, 'Let’s go!'), el('button', {cls:'wlr-btn alt', onclick:()=>{ close(); R.open(); }}, '🛣️ Rebirth Road')));
  close = pop('', card, ['#F9BF01','#D5F367','#EA55AB','#64CDF5','#fff']);
  if (window.Arcade && window.Arcade.tone) [523,659,784,1046,1318,1568].forEach((f,i)=>window.Arcade.tone(f,.2,'triangle',.06,i*.1)); });

// ---------------- the Rebirth Road screen ----------------
let ov = null, tab = 'road'; try { tab = localStorage.getItem('wl-road-tab') || 'road'; } catch(e){}
const refresh = () => { if (ov && ov._render) ov._render(); };
R.isOpen = () => !!ov;
R.close = () => { if (!ov) return; ov.remove(); ov = null; document.removeEventListener('keydown', escK, true); };
const escK = e => { if (e.key == 'Escape' && ov && !document.querySelector('.wlr-pop')) { e.stopPropagation(); e.preventDefault(); R.close(); } };
R.open = t => { if (!api) return; ensureCss(); if (t) tab = t; { const P = api.P(); if (((P.road||{}).seen||0) !== rbOf(P)) api.setP({road:{...(P.road||{}), seen:rbOf(P)}}); } if (ov) { refresh(); return; }
  ov = el('div', {cls:'wlr-ov'}); const box = el('div', {cls:'wlr'}); ov.appendChild(box); document.body.appendChild(ov); document.addEventListener('keydown', escK, true);
  ov.addEventListener('click', e => { if (e.target === ov) R.close(); });
  let lastRb = -1, scrolled = false;
  const render = () => { const P = api.P(), rb = rbOf(P), nx = R.next(P), pv = R.prev(P), W = window.WLP, need = W ? W.rebirthNeed(P) : 1, tp = Math.min(1, (P.tickets||0) / need), pend = R.pending(P);
    box.innerHTML = '';
    const head = el('div', {cls:'wlr-head'},
      el('div', {style:{display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}},
        el('div', {style:{fontWeight:800, fontSize:'22px', color:'#fff'}}, '🛣️ Rebirth Road'),
        el('div', {cls:'wlr-chip gold'}, '🔁 '+fmt(rb)+' rebirth'+(rb==1?'':'s')),
        el('div', {cls:'wlr-chip'}, '✖️ ×'+fmt(R.mult(P))+' Rebirth multiplier'),
        pend.length ? el('button', {cls:'wlr-btn sm', onclick:()=>R.claimAll()}, '🎁 Claim all ('+pend.length+')') : null,
        api.openRebirthTab ? el('button', {cls:'wlr-btn sm alt', title:'Rebirth details, Golden Stars and the Golden Hall', onclick:()=>api.openRebirthTab()}, '⭐ Rebirth & Golden Stars') : null,
        el('button', {cls:'wlr-x', title:'Close · Esc', onclick:()=>R.close()}, '✕')),
      nx ? el('div', {style:{marginTop:'8px'}},
        el('div', {style:{display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:700, color:'#EDE9D8', gap:'8px'}}, el('span', null, 'Next milestone: Rebirth '+nx+' '+R.icon(nx)), el('span', null, (nx - rb)+' more rebirth'+(nx-rb==1?'':'s'))),
        el('div', {cls:'wlr-bar'}, el('div', {style:{width:Math.round(100 * Math.max(0, Math.min(1, (rb - pv + tp) / Math.max(1, nx - pv))))+'%'}})),
        el('div', {style:{fontSize:'11px', color:'#9fb8ad', marginTop:'3px'}}, 'This rebirth: '+Math.floor(tp*100)+'% of '+fmt(need)+' tickets')) : null,
      el('div', {cls:'wlr-tabs'}, [['road','🛣️ Road'],['music','🎧 Music Player'],['looks','🎨 Themes & Speed-ups'],['stats','📊 Rebirth Stats']].map(([k, n]) =>
        el('button', {cls:'wlr-tab'+(tab == k ? ' on' : ''), onclick:()=>{ tab = k; try { localStorage.setItem('wl-road-tab', k); } catch(e){} scrolled = false; render(); }}, n))));
    box.appendChild(head);
    const body = el('div', {cls:'wlr-body'}); box.appendChild(body);
    if (tab == 'music') musicTab(body, P); else if (tab == 'looks') looksTab(body, P); else if (tab == 'stats') statsTab(body, P); else roadTab(body, P);
    if (tab == 'road' && (!scrolled || lastRb !== rb)) { scrolled = true; lastRb = rb; requestAnimationFrame(() => { const t = body.querySelector('.wlr-node.next') || body.querySelector('.wlr-node.done:last-of-type'); if (t) body.scrollTop = Math.max(0, t.offsetTop - body.clientHeight/2 + 40); }); } };
  ov._render = render; render(); };
const roadTab = (body, P) => { const rb = rbOf(P), miles = R.miles(rb), narrow = window.innerWidth < 640, ROW = narrow ? 150 : 140, H = miles.length * ROW + 70, got = (P.road||{}).got || {};
  const wrap = el('div', {cls:'wlr-trail', style:{height:H+'px'}});
  const pts = miles.map((n, i) => ({n, x: narrow ? (i % 2 ? 22 : 12) : 50 + (i % 2 ? 1 : -1) * (i % 4 < 2 ? 20 : 26), y: 50 + i*ROW}));
  const path = (a, b) => { let d = 'M'+pts[a].x+' '+pts[a].y; for (let i = a+1; i <= b; i++) { const p = pts[i-1], q = pts[i]; d += ' C'+p.x+' '+(p.y+ROW*.55)+' '+q.x+' '+(q.y-ROW*.55)+' '+q.x+' '+q.y; } return d; };
  const lastDone = miles.filter(n => n <= rb).length - 1;
  const svg = '<svg width="100%" height="'+H+'" viewBox="0 0 100 '+H+'" preserveAspectRatio="none" style="position:absolute;left:0;top:0;pointer-events:none">'+
    '<path d="'+path(0, pts.length-1)+'" fill="none" stroke="#5a3a1c" stroke-width="22" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".55"/>'+
    '<path d="'+path(0, pts.length-1)+'" fill="none" stroke="#e8dcb8" stroke-width="14" stroke-dasharray="2 16" stroke-linecap="round" vector-effect="non-scaling-stroke"/>'+
    (lastDone > 0 ? '<path d="'+path(0, lastDone)+'" fill="none" stroke="#F9BF01" stroke-width="14" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' : '')+'</svg>';
  wrap.innerHTML = svg;
  pts.forEach((p, i) => { const n = p.n, done = n <= rb, isNext = !done && (i == 0 || pts[i-1].n <= rb), size = R.size(n), pending = done && !got[n];
    const node = el('div', {cls:'wlr-node'+(done ? ' done' : isNext ? ' next' : ' lock')+(size ? ' '+size : ''), style:{left:p.x+'%', top:p.y+'px'}, title:'Rebirth '+n},
      el('div', {cls:'wlr-node-e'}, R.icon(n)), el('div', {cls:'wlr-node-n'}, n), done ? el('div', {cls:'wlr-node-ok'}, '✓') : !isNext ? el('div', {cls:'wlr-node-ok lk'}, '🔒') : null);
    wrap.appendChild(node);
    const left = narrow ? false : p.x > 50, card = el('div', {cls:'wlr-mc'+(done ? ' done' : isNext ? ' next' : ''), style: narrow ? {left:(p.x+9)+'%', right:'8px', top:(p.y-46)+'px'} : left ? {right:(100 - p.x + 7)+'%', top:(p.y-46)+'px', width:'38%'} : {left:(p.x + 7)+'%', top:(p.y-46)+'px', width:'38%'}},
      el('div', {style:{display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap'}}, el('b', {style:{fontSize:'14px'}}, 'Rebirth '+n), size ? el('span', {cls:'wlr-tag '+size}, size == 'huge' ? 'HUGE' : 'BIG') : null,
        done ? el('span', {cls:'wlr-tag ok'}, pending ? 'READY' : '✓ REACHED') : isNext ? el('span', {cls:'wlr-tag nx'}, (n - rb)+' to go') : null),
      R.lines(n).map(ln => el('div', {cls:'wlr-ml'}, el('span', null, ln.e), el('span', null, ln.t))),
      pending ? el('button', {cls:'wlr-btn sm', style:{marginTop:'4px'}, onclick:()=>R.claimAll()}, '🎁 Claim') : null);
    wrap.appendChild(card); });
  // "you are here": between your last milestone and the next one
  const ni = pts.findIndex(p => p.n > rb); if (ni >= 0 && api.avImg) { const b = pts[ni], y = b.y - (narrow ? 62 : 70);
    wrap.appendChild(el('div', {cls:'wlr-you', title:'You are here: '+rb+' rebirth'+(rb==1?'':'s')+' · '+(b.n - rb)+' to go', style:{left:b.x+'%', top:y+'px'}}, el('img', {src:api.avImg(), alt:''}), el('div', null, 'YOU · '+rb))); }
  body.appendChild(wrap);
  body.appendChild(el('div', {style:{textAlign:'center', color:'#9fb8ad', fontSize:'12px', padding:'0 0 18px'}}, 'After Rebirth 250 there’s a milestone every 50 rebirths, forever — every 100th one is HUGE.')); };

// ---- Music Player tab ----
let mView = 'all', mAddTo = 0;
const musicTab = (body, P) => { const M = window.WLMusic; if (!M || !M.tracks) { body.appendChild(el('div', {cls:'wlr-pad'}, 'Music isn’t loaded yet.')); return; }
  const unlocked = R.player(P), rb = rbOf(P), tracks = M.tracks(), lists = Array.isArray(P.mlists) ? P.mlists : [], np = M.nowPlaying(), pad = el('div', {cls:'wlr-pad'});
  const setLists = l => { api.setP({mlists:l}); refresh(); };
  if (!unlocked) pad.appendChild(el('div', {cls:'wlr-lockbar'}, '🔒 The Music Player unlocks at Rebirth 10 ('+(10 - rb)+' more). Until then, the 🎵 Music button still plays the arcade music and every song you’ve unlocked.'));
  // now playing
  pad.appendChild(el('div', {cls:'wlr-np'},
    el('div', {style:{fontSize:'34px'}}, M.on() ? '🎶' : '🔇'),
    el('div', {style:{flex:1, minWidth:0}}, el('div', {style:{fontSize:'11px', fontWeight:800, letterSpacing:'.12em', color:'#9fb8ad'}}, 'NOW PLAYING'), el('div', {style:{fontWeight:800, fontSize:'17px', color:'#fff'}}, M.on() ? (np.n || '—') : 'Music is off'), np.by ? el('div', {style:{fontSize:'12px', color:'#D5F367'}}, np.by) : null),
    el('div', {cls:'wlr-ctl'},
      el('button', {title:'Previous', disabled:!unlocked || M.track() != 'player', onclick:()=>{ M.prev(); setTimeout(refresh, 80); }}, '⏮'),
      el('button', {title:M.on() ? 'Stop the music' : 'Play', onclick:()=>{ M.setOn(!M.on()); setTimeout(refresh, 80); }}, M.on() ? '⏸' : '▶'),
      el('button', {title:'Next song', disabled:!unlocked, onclick:()=>{ M.skip(); setTimeout(refresh, 80); }}, '⏭'),
      el('button', {title:'Shuffle', disabled:!unlocked, cls:M.shuffle() ? 'on' : '', onclick:()=>{ M.setShuffle(!M.shuffle()); refresh(); }}, '🔀'),
      el('button', {title:'Repeat this song', disabled:!unlocked, cls:M.repeat() ? 'on' : '', onclick:()=>{ M.setRepeat(!M.repeat()); refresh(); }}, '🔂')),
    el('label', {cls:'wlr-vol', title:'Music volume'}, '🔉', (() => { const r = el('input', {type:'range', min:0, max:100, value:Math.round(M.volume()*100)}); r.oninput = () => M.setVolume(r.value/100); return r; })())));
  if (np.credit) pad.appendChild(el('div', {style:{fontSize:'11px', color:'#9fb8ad', margin:'-4px 0 8px'}}, 'Credit: '+np.credit));
  // playlists
  const chips = el('div', {cls:'wlr-row', style:{marginBottom:'8px'}},
    el('button', {cls:'wlr-chipb'+(mView == 'all' ? ' on' : ''), onclick:()=>{ mView = 'all'; refresh(); }}, '🎼 All songs'),
    lists.map((L, i) => el('button', {cls:'wlr-chipb'+(mView === i ? ' on' : ''), onclick:()=>{ mView = i; mAddTo = i; refresh(); }}, '📃 '+L.n+' ('+L.ids.length+')')),
    unlocked ? el('button', {cls:'wlr-chipb add', onclick:()=>{ const nm = (prompt('Name your playlist', 'My Mix '+(lists.length+1)) || '').trim().slice(0, 24); if (!nm) return; const l2 = [...lists, {n:nm, ids:[]}]; mView = l2.length-1; mAddTo = mView; setLists(l2); }}, '＋ New playlist') : null,
    el('button', {cls:'wlr-chipb', title:'The original arcade music that changes with each game', onclick:()=>{ M.useChip(); setTimeout(refresh, 80); }}, '🕹️ Arcade music'));
  pad.appendChild(chips);
  const okIds = tracks.filter(t => t.ok).map(t => t.id);
  let rows = tracks;
  if (mView !== 'all' && lists[mView]) { const L = lists[mView]; rows = L.ids.map(id => tracks.find(t => t.id == id)).filter(Boolean);
    pad.appendChild(el('div', {cls:'wlr-row', style:{marginBottom:'8px'}},
      el('button', {cls:'wlr-btn sm', disabled:!unlocked || !L.ids.length, onclick:()=>{ M.playIds(L.ids, L.ids[0], false); setTimeout(refresh, 80); }}, '▶ Play “'+L.n+'”'),
      el('button', {cls:'wlr-btn sm alt', disabled:!unlocked || !L.ids.length, onclick:()=>{ M.playIds(L.ids, null, true); setTimeout(refresh, 80); }}, '🔀 Shuffle it'),
      el('button', {cls:'wlr-btn sm alt', onclick:()=>{ const nm = (prompt('Rename playlist', L.n) || '').trim().slice(0, 24); if (!nm) return; setLists(lists.map((x, j) => j == mView ? {...x, n:nm} : x)); }}, '✎ Rename'),
      el('button', {cls:'wlr-btn sm alt', onclick:()=>{ if (!confirmBox('Delete the playlist “'+L.n+'”? (The songs stay unlocked.)')) return; setLists(lists.filter((x, j) => j != mView)); mView = 'all'; }}, '🗑 Delete')));
    if (!rows.length) pad.appendChild(el('div', {style:{color:'#9fb8ad', fontSize:'13px', margin:'6px 0'}}, 'This playlist is empty. Open “All songs” and tap ＋ next to the songs you want.')); }
  else { pad.appendChild(el('div', {cls:'wlr-row', style:{marginBottom:'8px'}},
      el('button', {cls:'wlr-btn sm', disabled:!unlocked, onclick:()=>{ M.playIds(okIds, okIds[0], false); setTimeout(refresh, 80); }}, '▶ Play all'),
      el('button', {cls:'wlr-btn sm alt', disabled:!unlocked, onclick:()=>{ M.playIds(okIds, null, true); setTimeout(refresh, 80); }}, '🔀 Shuffle all'),
      lists.length ? el('label', {style:{fontSize:'12px', color:'#EDE9D8', display:'flex', alignItems:'center', gap:'4px'}}, '＋ adds to', (() => { const s = el('select', {cls:'wlr-sel'}); lists.forEach((L, i) => s.appendChild(el('option', {value:i, selected: i == mAddTo ? 'selected' : null}, L.n))); s.onchange = () => { mAddTo = +s.value; refresh(); }; return s; })()) : null,
      el('span', {style:{fontSize:'12px', color:'#9fb8ad'}}, okIds.length+' / '+tracks.length+' unlocked'))); }
  const list = el('div', {cls:'wlr-tl'});
  rows.forEach(t => { const playing = M.on() && np.id == t.id, inL = lists[mAddTo] && lists[mAddTo].ids.includes(t.id);
    list.appendChild(el('div', {cls:'wlr-tr'+(t.ok ? '' : ' lk')+(playing ? ' on' : '')},
      el('button', {cls:'wlr-play', disabled:!t.ok || !unlocked, title:t.ok ? (unlocked ? 'Play' : 'Music Player unlocks at Rebirth 10') : 'Locked', onclick:()=>{ const q = mView !== 'all' && lists[mView] ? lists[mView].ids : okIds; M.playIds(q, t.id, M.shuffle() && false); setTimeout(refresh, 80); }}, t.ok ? (playing ? '🔊' : '▶') : '🔒'),
      el('div', {style:{flex:1, minWidth:0}}, el('div', {style:{fontWeight:700, color:t.ok ? '#fff' : '#9a9a9b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}, t.n), el('div', {style:{fontSize:'11px', color:'#9fb8ad', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}, t.by+(t.kind == 'file' ? ' · CC BY 4.0' : ' · free to use'))),
      t.need ? el('span', {cls:'wlr-tag '+(t.ok ? 'ok' : 'nx')}, (t.ok ? '✓ ' : '🔒 ')+'Rebirth '+t.need) : el('span', {cls:'wlr-tag ok'}, 'Starter'),
      mView === 'all' && unlocked && lists.length && t.ok ? el('button', {cls:'wlr-add'+(inL ? ' on' : ''), title: inL ? 'Remove from '+lists[mAddTo].n : 'Add to '+lists[mAddTo].n, onclick:()=>{ setLists(lists.map((L, j) => j != mAddTo ? L : {...L, ids: inL ? L.ids.filter(x => x != t.id) : [...L.ids, t.id]})); }}, inL ? '✓' : '＋') : null,
      mView !== 'all' && lists[mView] ? el('button', {cls:'wlr-add', title:'Remove from this playlist', onclick:()=>{ setLists(lists.map((L, j) => j != mView ? L : {...L, ids:L.ids.filter(x => x != t.id)})); }}, '✕') : null)); });
  pad.appendChild(list);
  pad.appendChild(el('div', {style:{fontSize:'11px', color:'#9fb8ad', marginTop:'10px', lineHeight:1.5}}, 'Every song is free to use. Original songs were made for Wilderland Arcade. Song files by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution 4.0 (creativecommons.org/licenses/by/4.0/).'));
  body.appendChild(pad); };
const confirmBox = msg => { try { return window.confirm(msg); } catch(e) { return true; } };

// ---- Themes & speed-ups tab ----
const looksTab = (body, P) => { const pad = el('div', {cls:'wlr-pad'}), v = R.vals(P), W = window.WLP;
  pad.appendChild(el('div', {cls:'wlr-h'}, '🎨 ARCADE FLOOR THEMES'));
  const g = el('div', {cls:'wlr-grid'});
  R.themes(P).forEach(t => g.appendChild(el('button', {cls:'wlr-th'+(t.on ? ' on' : '')+(t.ok ? '' : ' lk'), onclick:()=>{ if (!t.ok) { api.sfx('bad'); return; } api.setP({floorTheme:t.id}); api.sfx('blip'); refresh(); }},
    el('div', {cls:'wlr-sw', style:{background:'repeating-conic-gradient('+t.sw[1]+' 0 25%, '+t.sw[0]+' 0 50%) 0 0/24px 24px'}}), el('b', null, t.n), el('span', null, t.on ? '✓ On' : t.ok ? 'Tap to use' : '🔒 Rebirth '+t.rb))));
  pad.appendChild(g);
  if (W && W.SKINS) { pad.appendChild(el('div', {cls:'wlr-h'}, '🕹️ CABINET SKINS'));
    const s = el('div', {cls:'wlr-row'}); W.SKINS.forEach(k => { const ok = W.skinOk(P, k), on = (P.skin||'') === k.id; s.appendChild(el('button', {cls:'wlr-chipb'+(on ? ' on' : ''), style:{boxShadow:W.skinStyle(k.id), opacity:ok ? 1 : .5}, onclick:()=>{ if (!ok) { api.sfx('bad'); return; } api.setP({skin:k.id}); api.sfx('blip'); refresh(); }}, k.n+(ok ? '' : k.rb ? ' · 🔒 Rebirth '+k.rb : ' · 🔒 '+k.stars+' ⭐'))); }); pad.appendChild(s); }
  pad.appendChild(el('div', {cls:'wlr-h'}, '⚡ REBIRTH SPEED-UPS & EFFECTS'));
  const row = (on, e, n, d, tog) => el('div', {cls:'wlr-sp'+(on ? '' : ' lk')}, el('div', {style:{fontSize:'24px'}}, e), el('div', {style:{flex:1, minWidth:0}}, el('b', null, n), el('div', {style:{fontSize:'12px', color:'#4a4a4a'}}, d)), tog || null);
  const toggle = (val, fn) => el('button', {cls:'wlr-tog'+(val ? ' on' : ''), onclick:fn}, val ? 'ON' : 'OFF');
  pad.appendChild(row(v.start > 0, '🎟️', 'Starting tickets', v.start ? 'Each Rebirth starts with '+v.start+'% of the tickets the next one needs' : 'Unlocks at Rebirth 2'));
  pad.appendChild(row(v.quick > 0, '🛠️', 'Quick Start', v.quick ? 'Each Rebirth starts with Upgrade Workshop Lv '+v.quick+' on every machine' : 'Unlocks at Rebirth 5'));
  pad.appendChild(row(v.keep > 0, '🏗️', 'Keep expansions', v.keep ? 'Keep '+v.keep+'% of your Arcade Expansion levels after each Rebirth' : 'Unlocks at Rebirth 20'));
  pad.appendChild(row(v.autobuy, '🤖', 'Workshop auto-buy', v.autobuy ? 'Buys the cheapest Upgrade Workshop level you can afford every few seconds (spends up to a quarter of your tickets at a time)' : 'Unlocks at Rebirth 40', v.autobuy ? toggle(P.rbAutoBuy !== false, () => { api.setP({rbAutoBuy: P.rbAutoBuy === false}); refresh(); }) : null));
  pad.appendChild(row(v.aura, '✨', 'Rebirth Aura', v.aura ? 'Your avatar glows on the arcade floor; the color changes with every rebirth' : 'Unlocks at Rebirth 20', v.aura ? toggle(!P.auraOff, () => { api.setP({auraOff:!P.auraOff}); refresh(); }) : null));
  pad.appendChild(row(v.critter > 1, '🦊', 'Golden Critters', v.critter > 1 ? 'Appear ×'+v.critter+' as often' : 'Unlocks at Rebirth 9'));
  pad.appendChild(row(v.charm, '🍀', 'Lucky Charm', v.charm ? '1 in 5 capsules rolls twice and keeps the rarer prize' : 'Unlocks at Rebirth 13'));
  pad.appendChild(row(v.rainbow, '🌈', 'Rainbow name', v.rainbow ? 'Your name shimmers on the leaderboards' : 'Unlocks at Rebirth 100'));
  body.appendChild(pad); };

// ---- Rebirth stats tab ----
const statsTab = (body, P) => { const pad = el('div', {cls:'wlr-pad'}), rb = rbOf(P), v = R.vals(P), E = window.WLE, now = Date.now(), runS = P.rbAt ? (now - P.rbAt)/1000 : 0, runT = P.rbEarned != null ? Math.max(0, (P.earned||0) - P.rbEarned) : 0;
  const rows = [['🔁 Total rebirths', fmt(rb)], ['⚡ Fastest rebirth', timeTxt(P.rbFast)], ['⏱️ Last rebirth took', timeTxt(P.rbLast)], ['🏃 This run so far', timeTxt(runS)], ['🎟️ Tickets earned this run', fmt(runT)],
    ['🔥 Rebirth streak', ((P.rbStr||{}).n||0)+' day'+(((P.rbStr||{}).n||0)==1?'':'s')+' (best '+((P.rbStr||{}).best||0)+')'], ['💎 Diamond Stars', E ? E.diamonds(P)+' earned · next in '+E.toNextDia(P)+' rebirth'+(E.toNextDia(P)==1?'':'s') : '—'],
    ['🛣️ Milestones reached', R.reachedCount(P)+' (next: Rebirth '+R.next(P)+')'], ['✖️ Rebirth multiplier', '×'+fmt(v.mult)+' on every ticket'], ['🏷️ Rebirth titles', v.titles.join(', ') || '—']];
  pad.appendChild(el('div', {cls:'wlr-stats'}, rows.map(([k, val]) => el('div', {cls:'wlr-srow'}, el('span', null, k), el('b', null, val)))));
  pad.appendChild(el('div', {style:{fontSize:'12px', color:'#9fb8ad', marginTop:'10px'}}, 'The ⚡ Fastest Rebirth and 🔁 Rebirths leaderboards are in the Hall of Fame.'));
  body.appendChild(pad); };

// ---------------- the loop ----------------
R.attach = a => { api = a; ensureCss(); wrapTitles(); if (R._t) return;
  R._t = setInterval(() => { try { tick(); } catch(e) { console.error(e); } }, 1500); setTimeout(tick, 400); };
const tick = () => { if (!api) return; const P = api.P(); if (!P || (api.ready && !api.ready())) return; wrapTitles();
  if (api.admin && api.admin()) return;
  if (!P.rbAt) { api.setP({rbAt:Date.now(), rbEarned:P.earned||0}); return; }
  // the catch-up welcome shows once per device, even if an old (cloud) copy of the save without the road ever loads again
  if (!P.road) { const list = R.pending(P); api.setP(grantPatch(P, list)); let seen = false; try { seen = localStorage.getItem('wl-road-welcomed') == '1'; localStorage.setItem('wl-road-welcomed', '1'); } catch(e) {} if (list.length && !seen) queue(() => welcome(list)); return; }
  const pend = R.pending(P); if (pend.length && !(api.busy && api.busy())) { api.setP(grantPatch(P, pend)); queue(() => celebrate(pend)); refresh(); } };
R.debug = {celebrate, welcome, grantPatch, cum};

// ---------------- styles ----------------
let cssDone = false;
const ensureCss = () => { if (cssDone) return; cssDone = true; const s = document.createElement('style'); s.textContent = `
@keyframes wlrRainbow{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes wlrPulse{0%,100%{box-shadow:0 0 0 0 rgba(213,243,103,.7)}50%{box-shadow:0 0 0 12px rgba(213,243,103,0)}}
@keyframes wlrIn{from{opacity:0;transform:translateY(14px) scale(.9)}to{opacity:1;transform:none}}
@keyframes wlrZoom{0%{transform:scale(.2) rotate(-30deg);opacity:0}60%{transform:scale(1.15) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes wlrBurst{to{transform:translate(var(--dx),var(--dy)) rotate(540deg);opacity:0}}
@keyframes wlrGlow{0%,100%{filter:drop-shadow(0 0 8px #F9BF01)}50%{filter:drop-shadow(0 0 22px #ff5fd2)}}
.wlr-ov{position:fixed;inset:0;z-index:9000;background:rgba(1,30,22,.82);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;font-family:"Uncut Sans","Inter",system-ui,sans-serif}
.wlr{width:min(1100px,100%);height:min(900px,100%);background:#0b2e24;border-radius:20px;border:2px solid rgba(213,243,103,.35);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.wlr *{box-sizing:border-box}
.wlr-head{padding:14px 16px 0;background:linear-gradient(#0f3d30,#0b2e24);flex-shrink:0}
.wlr-x{margin-left:auto;background:rgba(255,255,255,.12);color:#fff;border:none;border-radius:999px;width:36px;height:36px;font-size:16px;cursor:pointer}
.wlr-chip{background:rgba(255,255,255,.1);color:#EDE9D8;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:700}
.wlr-chip.gold{background:#F9BF01;color:#121313}
.wlr-bar{height:12px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:4px}
.wlr-bar>div{height:100%;border-radius:999px;background:linear-gradient(90deg,#00B451,#D5F367,#F9BF01)}
.wlr-tabs{display:flex;gap:6px;margin-top:10px;overflow-x:auto;padding-bottom:10px}
.wlr-tab{border:none;border-radius:999px;padding:8px 14px;font:700 13px inherit;font-family:inherit;cursor:pointer;background:rgba(255,255,255,.1);color:#EDE9D8;white-space:nowrap}
.wlr-tab.on{background:#D5F367;color:#015640}
.wlr-body{flex:1;overflow-y:auto;position:relative;background:radial-gradient(circle at 30% 0%,#14513f,#0b2e24 60%)}
.wlr-trail{position:relative;margin:0 auto;max-width:1000px}
.wlr-node{position:absolute;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#3b4a44;border:4px solid #6b7c75;color:#fff;z-index:2}
.wlr-node.big{width:78px;height:78px}.wlr-node.huge{width:92px;height:92px}
.wlr-node.done{background:radial-gradient(circle at 35% 30%,#fff3b0,#F9BF01 55%,#c48a00);border-color:#fff3b0;color:#121313;box-shadow:0 0 18px rgba(249,191,1,.7)}
.wlr-node.huge.done{background:conic-gradient(#ff5fd2,#F9BF01,#00B451,#64CDF5,#b48cff,#ff5fd2);animation:wlrGlow 2.4s ease-in-out infinite}
.wlr-node.next{background:#015640;border-color:#D5F367;animation:wlrPulse 1.6s infinite}
.wlr-node.lock{filter:grayscale(.6);opacity:.85}
.wlr-node-e{font-size:24px;line-height:1}.wlr-node.huge .wlr-node-e{font-size:32px}
.wlr-node-n{font-size:12px;font-weight:800;line-height:1.1}
.wlr-node-ok{position:absolute;right:-6px;bottom:-6px;width:22px;height:22px;border-radius:50%;background:#00B451;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff}
.wlr-node-ok.lk{background:#4a4a4a;font-size:10px}
.wlr-mc{position:absolute;background:rgba(255,255,255,.94);border-radius:14px;padding:8px 10px;font-size:12px;color:#121313;z-index:1;box-shadow:0 6px 16px rgba(0,0,0,.25);display:flex;flex-direction:column;gap:3px;max-height:128px;overflow:auto}
.wlr-mc.done{background:#fffbe8;border:2px solid #F9BF01}.wlr-mc.next{border:2px solid #D5F367;box-shadow:0 0 0 3px rgba(213,243,103,.35),0 6px 16px rgba(0,0,0,.25)}
.wlr-ml{display:flex;gap:6px;line-height:1.3}.wlr-ml>span:first-child{flex-shrink:0}
.wlr-tag{font-size:10px;font-weight:800;border-radius:999px;padding:2px 7px;background:#e6e2cf;color:#4a4a4a;letter-spacing:.04em;white-space:nowrap}
.wlr-tag.big{background:#EA55AB;color:#fff}.wlr-tag.huge{background:linear-gradient(90deg,#ff5fd2,#F9BF01,#64CDF5);color:#121313}
.wlr-tag.ok{background:#00B451;color:#fff}.wlr-tag.nx{background:#D5F367;color:#015640}
.wlr-you{position:absolute;transform:translate(-50%,-50%);z-index:3;display:flex;flex-direction:column;align-items:center;pointer-events:none}
.wlr-you img{width:44px;height:44px;filter:drop-shadow(0 0 6px #D5F367)}.wlr-you div{font-size:10px;font-weight:800;background:#D5F367;color:#015640;border-radius:999px;padding:1px 7px;margin-top:-4px}
.wlr-btn{border:none;border-radius:999px;padding:11px 22px;font:800 15px inherit;font-family:inherit;cursor:pointer;background:#015640;color:#fff}
.wlr-btn.alt{background:#D5F367;color:#015640}.wlr-btn.sm{padding:7px 13px;font-size:13px}.wlr-btn:disabled{opacity:.45;cursor:default}
.wlr-pad{padding:14px 16px 24px}
.wlr-h{font-size:12px;font-weight:800;letter-spacing:.12em;color:#D5F367;margin:14px 0 8px}
.wlr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.wlr-th{border:2px solid transparent;border-radius:14px;background:#fff;padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:4px;text-align:left;font-family:inherit;color:#121313}
.wlr-th.on{border-color:#D5F367;box-shadow:0 0 0 3px #00B451}.wlr-th.lk{opacity:.55}
.wlr-th span{font-size:11px;color:#4a4a4a}.wlr-sw{height:44px;border-radius:9px}
.wlr-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.wlr-chipb{border:1.5px solid rgba(255,255,255,.25);border-radius:999px;padding:7px 12px;font:700 12px inherit;font-family:inherit;cursor:pointer;background:rgba(255,255,255,.08);color:#EDE9D8}
.wlr-chipb.on{background:#D5F367;color:#015640;border-color:#D5F367}.wlr-chipb.add{border-style:dashed}
.wlr-sp{display:flex;gap:10px;align-items:center;background:#fff;border-radius:12px;padding:10px 12px;margin-bottom:6px;color:#121313}.wlr-sp.lk{opacity:.55}
.wlr-tog{border:none;border-radius:999px;padding:7px 14px;font:800 12px inherit;font-family:inherit;cursor:pointer;background:#d9d3bd;color:#4a4a4a}.wlr-tog.on{background:#00B451;color:#fff}
.wlr-stats{background:#fff;border-radius:14px;padding:6px 14px}
.wlr-srow{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #eee8d4;font-size:14px;color:#121313}.wlr-srow:last-child{border:none}.wlr-srow b{text-align:right}
.wlr-lockbar{background:rgba(249,191,1,.15);border:1.5px solid #F9BF01;color:#F9BF01;border-radius:12px;padding:10px 12px;font-size:13px;font-weight:700;margin-bottom:10px}
.wlr-np{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.08);border-radius:16px;padding:12px;margin-bottom:10px;flex-wrap:wrap}
.wlr-ctl{display:flex;gap:6px}.wlr-ctl button{width:40px;height:40px;border-radius:50%;border:none;background:#D5F367;color:#015640;font-size:16px;cursor:pointer}.wlr-ctl button.on{background:#00B451;color:#fff;box-shadow:0 0 0 3px #D5F367}.wlr-ctl button:disabled{opacity:.35;cursor:default}
.wlr-vol{display:flex;align-items:center;gap:6px;color:#EDE9D8}.wlr-vol input{width:110px}
.wlr-sel{border-radius:8px;padding:4px 6px;font-family:inherit}
.wlr-tl{display:flex;flex-direction:column;gap:5px}
.wlr-tr{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.07);border-radius:12px;padding:7px 10px}.wlr-tr.on{background:rgba(213,243,103,.18);box-shadow:inset 0 0 0 1.5px #D5F367}.wlr-tr.lk{opacity:.6}
.wlr-play{width:34px;height:34px;border-radius:50%;border:none;background:#00B451;color:#fff;cursor:pointer;flex-shrink:0;font-size:13px}.wlr-play:disabled{background:#4a4a4a;cursor:default}
.wlr-add{width:30px;height:30px;border-radius:50%;border:1.5px dashed #D5F367;background:transparent;color:#D5F367;cursor:pointer;flex-shrink:0}.wlr-add.on{background:#D5F367;color:#015640;border-style:solid}
.wlr-pop{position:fixed;inset:0;z-index:9500;background:rgba(1,30,22,.86);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;overflow:hidden;font-family:"Uncut Sans","Inter",system-ui,sans-serif}
.wlr-pop.wlr-huge-bg{background:radial-gradient(circle,rgba(90,20,90,.9),rgba(1,20,30,.95))}
.wlr-card{position:relative;z-index:2;background:#fff;border-radius:22px;padding:22px 20px;max-width:560px;width:100%;text-align:center;max-height:92vh;overflow-y:auto;box-shadow:0 0 0 5px #F9BF01,0 0 80px rgba(249,191,1,.55);animation:wlrIn .35s ease-out;color:#121313}
.wlr-card.wlr-huge{box-shadow:0 0 0 6px #ff5fd2,0 0 0 12px #F9BF01,0 0 120px rgba(255,95,210,.8)}
.wlr-card.wlr-welcome{max-width:640px}
.wlr-badge{width:110px;height:110px;margin:0 auto 6px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3b0,#F9BF01 55%,#c48a00);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(249,191,1,.9);animation:wlrZoom .8s cubic-bezier(.2,1.4,.4,1)}
.wlr-huge .wlr-badge{background:conic-gradient(#ff5fd2,#F9BF01,#00B451,#64CDF5,#b48cff,#ff5fd2);animation:wlrZoom .8s cubic-bezier(.2,1.4,.4,1),wlrGlow 2s ease-in-out .8s infinite}
.wlr-badge-e{font-size:40px;line-height:1}.wlr-badge-n{font-size:22px;font-weight:800}
.wlr-kick{font-weight:800;letter-spacing:.2em;color:#AB2372;font-size:13px}
.wlr-h1{font-weight:800;font-size:28px;color:#015640;margin:2px 0 8px}
.wlr-rcs{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;text-align:left}
.wlr-rc{background:#f6f3e6;border-radius:12px;padding:10px;display:flex;gap:8px;align-items:flex-start;opacity:0;animation:wlrIn .4s ease-out forwards}
.wlr-rc-e{font-size:24px}.wlr-rc-t{font-size:13px;font-weight:600}
.wlr-pp{position:absolute;z-index:1;animation:wlrBurst 1.4s ease-out forwards;pointer-events:none}
.wlr-wl{text-align:left;display:flex;flex-direction:column;gap:6px;max-height:48vh;overflow-y:auto;background:#f6f3e6;border-radius:14px;padding:8px}
.wlr-wrow{display:flex;gap:10px;align-items:flex-start;background:#fff;border-radius:10px;padding:7px 9px}
.wlr-wn{width:46px;flex-shrink:0;text-align:center;font-size:20px;display:flex;flex-direction:column;align-items:center;background:#fff3b0;border-radius:10px;padding:3px}.wlr-wn b{font-size:12px}.wlr-wn.big{background:linear-gradient(#ffd6ec,#fff3b0)}
.wlr-wli{font-size:12px;line-height:1.4}
.wlr-sts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;text-align:left}
.wlr-st{background:#f6f3e6;border-radius:12px;padding:8px 10px}.wlr-st-k{font-size:11px;font-weight:700;color:#4a4a4a}.wlr-st-v{font-size:17px;font-weight:800;color:#015640}
.wlr-rec{font-size:11px;font-weight:800;color:#AB2372}
.wlr-mini{height:6px;border-radius:999px;background:#e6e2cf;overflow:hidden;margin-top:4px}.wlr-mini>div{height:100%;background:#64CDF5}
.wlr-nextbox{background:#fff1f8;border:1.5px dashed #EA55AB;border-radius:12px;padding:8px 10px;margin-top:10px;text-align:left}
@media (max-width:640px){.wlr-ctl{width:100%;justify-content:center}.wlr-ov{padding:0}.wlr{border-radius:0;height:100%}.wlr-h1{font-size:22px}.wlr-mc{font-size:11px}}
`; document.head.appendChild(s); };
R.ensureCss = ensureCss;
window.WLR = R;
})();
