// Wilderland Arcade · ADMIN ABUSE — live, arcade-wide events the admin (jonah@wilderland.academy) triggers for every
// player online at once. Everything is broadcast through Firestore (events/live). Only the admin's Google account can
// write it — that is enforced by the Firestore security rules (firestore.rules), not by this page.
// Nothing here ever takes anything away: generous events only add, chaos effects are cosmetic and end on their own.
(function(){
'use strict';
const L = {}; window.WLLive = L;
const LS = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch(e) { return d; } };
const LSset = (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} };
const LSj = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch(e) { return d; } };
const el = (tag, at, ...kids) => { const n = document.createElement(tag); at = at || {}; Object.keys(at).forEach(k => { const v = at[k]; if (v == null || v === false) return; if (k == 'style' && typeof v == 'object') Object.assign(n.style, v); else if (k == 'cls') n.className = v; else if (k.slice(0,2) == 'on') n[k] = v; else n.setAttribute(k, v); });
  kids.flat().forEach(c => { if (c == null || c === false) return; n.appendChild(typeof c == 'object' ? c : document.createTextNode(String(c))); }); return n; };
const ADMIN = 'jonah@wilderland.academy';
const A = () => window.Arcade || {};
const fmt = n => { const W = window.WLP; return W && W.fmt ? W.fmt(n) : (n >= 1e6 ? (n/1e6).toFixed(1)+'M' : Math.round(n).toLocaleString()); };
const mmss = ms => { const s = Math.max(0, Math.ceil(ms/1000)), m = Math.floor(s/60); return m >= 60 ? Math.floor(m/60)+'h '+(m%60)+'m' : m+':'+String(s%60).padStart(2, '0'); };
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const pick = (arr, seed) => arr[seed % arr.length];

let api = null;                                    // the arcade page
let S = {list:[], ann:null, admin:{}, open:[]};    // events/live, as last received
let skew = 0;                                      // how far this device's clock is from Google's
const now = () => Date.now() + skew;
const ev = () => window.WLCloud && window.WLCloud.ev;
const inGame = () => !!(api && api.game && api.game());
const fx = () => LS('wl-evfx', 'full') != 'calm' && !(api && api.lowFx && api.lowFx());
L.fxMode = () => LS('wl-evfx', 'full'); L.setFx = m => { LSset('wl-evfx', m); lastBanner = ''; if (api && api.refresh) api.refresh(); };
const muted = () => !!A().muted;

// ---------------- the catalogue ----------------
const ANIMALS = {frog:'🐸', cat:'🐱', duck:'🦆', penguin:'🐧', dino:'🦖', bunny:'🐰'};
const BOSSES = {loki:{n:'Loki the Evil Sorcerer', s:'Loki', e:'🐕'}, yeti:{n:'The Yeti King', s:'Yeti King', e:'🏔'}, gopher:{n:'The Mega Gopher', s:'Gopher', e:'🐹'}, custom:{n:'', e:'👹'}};
const bossShort = e => { const o = e.o || {}; return o.boss == 'custom' ? (o.name || 'Mystery Boss') : (BOSSES[o.boss] || BOSSES.loki).s; };
const T = {
  storm:   {cat:'gen', e:'🎟', n:'Ticket Storm', d:'Tickets rain from the sky on every screen. Tap them to catch them.'},
  mult:    {cat:'gen', e:'✖️', n:'Multiplier Madness', d:'Every ticket payout is multiplied for everyone while it lasts.'},
  golden:  {cat:'gen', e:'⭐', n:'Golden Hour', d:'Golden Critters keep popping up for everyone. Click them for boosts.'},
  gems:    {cat:'gen', e:'💎', n:'Gem Shower', d:'Deep Mines rains gems and pays ×3 ore for everyone.'},
  gift:    {cat:'gen', e:'🎁', n:'Gift Drop', d:'Every online player gets a mystery gift box: a prize, pet or avatar item (Common to Mythic only).'},
  petparty:{cat:'gen', e:'🐾', n:'Pet Party', d:'Double pet XP, and everyone online gets Confetti the Party Pup (event-exclusive pet).'},
  rebirth: {cat:'gen', e:'🏆', n:'Free Rebirth Boost', d:'Everyone’s next rebirth needs 50% fewer tickets during the event.'},
  code:    {cat:'gen', e:'🎫', n:'Admin Code Drop', d:'A one-time code appears in a big banner. The first players to type it win tickets.'},
  gravity: {cat:'chaos', e:'🌀', n:'Gravity Flip', d:'The arcade floor turns upside down.'},
  disco:   {cat:'chaos', e:'🪩', n:'Disco Mode', d:'Party lights, colours and a disco beat on every page.'},
  frog:    {cat:'chaos', e:'🐸', n:'Everyone’s a Frog', d:'Every avatar turns into an animal.'},
  bighead: {cat:'chaos', e:'🎈', n:'Big Head Mode', d:'Giant avatars with giant heads.'},
  blizzard:{cat:'chaos', e:'🌨', n:'Blizzard', d:'Heavy snow falls over the whole arcade.'},
  lava:    {cat:'chaos', e:'🌋', n:'Lava Floor', d:'The floor glows like lava (it’s pretend, nobody gets hurt).'},
  rainbow: {cat:'chaos', e:'🌈', n:'Rainbow World', d:'Everything cycles through the rainbow.'},
  speed:   {cat:'chaos', e:'🏃', n:'Speed Run', d:'Walk 3× faster on the floor; games run a little faster (scores count normally).'},
  stampede:{cat:'chaos', e:'🦖', n:'Giant Pet Stampede', d:'Huge pets run across everyone’s screen.'},
  airhorn: {cat:'chaos', e:'🔊', n:'Air Horn', d:'An air horn and a screen shake for everyone (respects sound settings).', inst:1},
  silly:   {cat:'chaos', e:'🙃', n:'Silly Names', d:'Everyone gets a funny name tag above their real one.'},
  boss:    {cat:'boss', e:'👹', n:'World Boss', d:'A giant boss with a shared health bar. Points from ANY game hurt it. Helpers get rewards; the top 3 get a title.'},
  avs:     {cat:'boss', e:'⚔️', n:'Admin vs Everyone', d:'The admin becomes a boss on the arcade floor. Click it to throw snowballs and win prizes.'},
  tourney: {cat:'boss', e:'🏁', n:'Flash Tournament', d:'10 minutes, one game, a live leaderboard and prizes for the top players.'},
};
L.T = T;
const evName = e => { const t = T[e.k] || {n:e.k}; const o = e.o || {};
  return e.k == 'mult' ? 'Multiplier Madness ×'+(o.x||2) : e.k == 'frog' ? 'Everyone’s a '+((o.animal || 'frog')[0].toUpperCase()+(o.animal || 'frog').slice(1)) : e.k == 'boss' ? 'World Boss: '+bossName(e) : e.k == 'tourney' ? 'Flash Tournament: '+gameTitle(o.game) : t.n; };
const evIcon = e => e.k == 'frog' ? (ANIMALS[(e.o||{}).animal] || '🐸') : (T[e.k] || {e:'✨'}).e;
const bossName = e => { const o = e.o || {}; return o.boss == 'custom' ? (o.name || 'The Mystery Boss') : (BOSSES[o.boss] || BOSSES.loki).n; };
const gameTitle = id => { const g = api && api.games ? api.games().find(x => x.id == id) : null; return g ? g.title : (id || 'a game'); };

// ---------------- reading the live document ----------------
const norm = d => ({list:Array.isArray(d.list) ? d.list.filter(e => e && e.id && e.k && T[e.k]) : [], ann:d.ann || null, admin:d.admin || {}, open:d.open || [], chaosUntil:d.chaosUntil || 0, codeOpen:d.codeOpen || null});
const active = () => S.list.filter(e => e.t0 <= now() && now() < e.t1);
const upcoming = () => S.list.filter(e => e.t0 > now()).sort((a, b) => a.t0 - b.t0);
const has = k => active().find(e => e.k == k);
L.active = active; L.upcoming = upcoming; L.state = () => S;

// ---------------- hooks the rest of the arcade calls ----------------
L.mult = () => active().filter(e => e.k == 'mult').reduce((m, e) => Math.max(m, +(e.o||{}).x || 2), 1);
L.mineOre = () => has('gems') ? 3 : 1;
L.gems = () => !!has('gems');
L.petxp = () => has('petparty') ? 2 : 1;
L.walk = () => has('speed') ? 3 : 1;
const svgUrl = s => 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
L.walkImg = () => { const e = has('frog'); if (!e || !fx()) return null; const em = ANIMALS[(e.o||{}).animal] || '🐸';
  return svgUrl("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 46 69'><ellipse cx='23' cy='64' rx='14' ry='4' fill='rgba(0,0,0,.18)'/><text x='23' y='58' font-size='40' text-anchor='middle'>"+em+"</text></svg>"); };
L.lbAv = img => { const e = has('frog'); if (!e || !fx()) return img; const em = ANIMALS[(e.o||{}).animal] || '🐸'; return svgUrl("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text x='16' y='26' font-size='26' text-anchor='middle'>"+em+"</text></svg>"); };
const SILLY_A = ['Captain','Sir','Lady','Professor','Admiral','Duke','Baron','Chef','Doctor','Princess','Agent','Wizard','Lord','Major','Count'];
const SILLY_B = ['Wobble','Noodle','Pickle','Waffle','Bubble','Sprinkle','Fluffer','Giggle','Snorkel','Muffin','Tater','Bean','Pudding','Doodle','Jelly','Biscuit','Nugget','Squeak'];
const SILLY_C = ['bottom','pants','toes','face','beard','socks','nose','paws','whiskers','pop','boots','sneeze','flop','bonk'];
const silly = seed => pick(SILLY_A, seed)+' '+pick(SILLY_B, seed >>> 5)+pick(SILLY_C, seed >>> 11);
L.sillyName = (name, eid) => silly(hash(String(eid)+'|'+String(name||'').toLowerCase()));
// the tag above your avatar on the arcade floor
L.tag = () => { const parts = []; const e = has('silly'); const nm = api ? api.uname() : '';
  if (e) parts.push('🙃 '+L.sillyName(nm || 'player', e.id));
  const t = (api && api.P().evTitle) || ''; if (t) parts.push(t);
  if (isMeAdmin() && S.admin.crown !== false && S.admin.name) parts.unshift('👑 ADMIN');
  return parts.join(' · '); };
// admin nameplate on leaderboards
L.plate = name => { const a = S.admin || {}; if (a.plate === false || !a.name || !name) return name; return String(name).toLowerCase() == String(a.name).toLowerCase() ? '👑 '+name+' · ADMIN' : name; };
L.calEvents = () => S.list.filter(e => e.t0 > now() - 864e5).map(e => { const d = new Date(e.t0); const pad = n => String(n).padStart(2, '0');
  return {id:'live-'+e.id, title:evIcon(e)+' Admin event: '+evName(e), start:d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()), allDay:false, time:pad(d.getHours())+':'+pad(d.getMinutes()), endTime:(() => { const d2 = new Date(e.t1); return pad(d2.getHours())+':'+pad(d2.getMinutes()); })(), category:'arcade', description:(T[e.k]||{}).d || '', location:'Wilderland Arcade'}; });
const isMeAdmin = () => { const m = ev() && ev().me(); return !!(m && m.email == ADMIN); };
const adminReady = () => { const m = ev() && ev().me(); return !!(m && m.email == ADMIN && m.google && m.verified); };
L.isAdmin = isMeAdmin;

// tickets for rewards scale with the player's progress (a share of their next rebirth)
let rawNeed = null;
const need0 = P => { try { return rawNeed ? rawNeed(P) : (window.WLP ? window.WLP.rebirthNeed(P) : 1e7); } catch(e) { return 1e7; } };
const nice = n => { n = Math.max(1, n); const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1)); return Math.round(n/p)*p; };
const grant = (n, label) => { if (!api) return 0; n = nice(n); api.grant(n, label); return n; };
const giveCapsule = (ci, label) => { const W = window.WLP; if (!W || !W.rollCap || !W.CAPS || !api) return null; const P = api.P(), it = W.rollCap(W.CAPS[ci] || W.CAPS[0], P); if (!it || it.r > 5) return null;
  api.setP({prizes:{...(P.prizes||{}), [it.id]:((P.prizes||{})[it.id]||0) + 1}}); const R = (W.R || [])[it.r] || {n:''}; api.toast('🎁 '+(label ? label+': ' : '')+R.n.toUpperCase()+' · '+String(it.n).toUpperCase(), true); return it; };

// ---------------- remembering what this player already got (so reloading never double-pays) ----------------
const got = LSj('wl-ev-got', {}); const gotSave = () => { const ks = Object.keys(got); if (ks.length > 300) ks.slice(0, ks.length - 300).forEach(k => delete got[k]); LSset('wl-ev-got', JSON.stringify(got)); };
const once = (key, fn) => { if (got[key]) return false; got[key] = Date.now(); gotSave(); fn(); return true; };

// ---------------- layers ----------------
let layer = null, banner = null, widget = null, cvs = null, cg = null;
const css = () => { if (document.getElementById('wlx-css')) return; const s = el('style', {id:'wlx-css'}); s.textContent = `
#wlx-layer{position:fixed;inset:0;pointer-events:none;z-index:9000;overflow:hidden}
#wlx-layer canvas{position:absolute;inset:0;width:100%;height:100%}
.wlx-tix{position:absolute;top:-60px;font-size:34px;pointer-events:auto;cursor:pointer;user-select:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));transition:top linear;will-change:top}
.wlx-tix:hover{transform:scale(1.15)}
.wlx-pop{position:absolute;font:800 16px "Uncut Sans",system-ui,sans-serif;color:#F9BF01;text-shadow:0 2px 0 #014d36;pointer-events:none;animation:wlxUp .9s ease-out forwards}
@keyframes wlxUp{to{transform:translateY(-50px);opacity:0}}
#wlx-banner{position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:9550;display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none;max-width:96vw;font-family:"Uncut Sans","Inter",system-ui,sans-serif}
#wlx-banner .row{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;pointer-events:auto}
#wlx-banner .chip{background:#121313;color:#fff;border:2px solid #F9BF01;border-radius:999px;padding:5px 12px;font:800 13px inherit;font-family:inherit;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35);white-space:nowrap}
#wlx-banner .chip.up{border-color:#64CDF5}
#wlx-banner .ann{border-radius:16px;padding:8px 16px;font:800 16px inherit;font-family:inherit;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:auto;max-width:92vw;text-align:center}
#wlx-banner .code{background:#fff;border:3px solid #F9BF01;border-radius:16px;padding:8px 14px;color:#121313;font:800 14px inherit;font-family:inherit;pointer-events:auto;box-shadow:0 10px 30px rgba(0,0,0,.4);display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center}
#wlx-banner .code b{font-size:24px;letter-spacing:.12em;color:#015640;background:#D5F367;border-radius:10px;padding:2px 10px}
#wlx-banner .code input{font:800 15px inherit;font-family:inherit;width:110px;padding:6px 8px;border:2px solid #015640;border-radius:10px;text-transform:uppercase}
#wlx-banner .code button,.wlx-btn{border:none;border-radius:999px;padding:8px 14px;font:800 13px inherit;font-family:inherit;cursor:pointer;background:#015640;color:#fff}
#wlx-banner.game{top:auto;bottom:8px;left:8px;transform:none;align-items:flex-start;opacity:.88}
#wlx-banner.game .chip{font-size:11px;padding:3px 9px}
#wlx-banner.game .ann{font-size:12px;padding:5px 10px}
.wlx-big{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:9560;pointer-events:none;text-align:center;font:900 44px "Uncut Sans",system-ui,sans-serif;color:#fff;text-shadow:0 4px 0 #014d36,0 0 30px rgba(249,191,1,.8);animation:wlxBig 2.6s ease-out forwards;white-space:nowrap;max-width:96vw}
.wlx-big small{display:block;font-size:18px;font-weight:700;text-shadow:0 2px 0 #014d36}
@keyframes wlxBig{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}20%{transform:translate(-50%,-50%) scale(1)}85%{opacity:1}100%{opacity:0}}
#wlx-widget{position:fixed;right:12px;bottom:12px;z-index:9540;width:260px;background:rgba(18,19,19,.92);color:#fff;border-radius:16px;padding:10px 12px;font:600 12px "Uncut Sans",system-ui,sans-serif;box-shadow:0 0 0 3px #F9BF01,0 12px 30px rgba(0,0,0,.4)}
#wlx-widget.game{width:200px;padding:6px 9px;right:8px;bottom:8px;opacity:.9}
#wlx-widget .bar{height:12px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden;margin:5px 0}
#wlx-widget .bar i{display:block;height:100%;background:linear-gradient(90deg,#FF4539,#F9BF01);transition:width .4s}
#wlx-widget .row{display:flex;justify-content:space-between;gap:6px}
.wlx-runner{position:absolute;font-size:150px;line-height:1;pointer-events:none;filter:drop-shadow(0 10px 10px rgba(0,0,0,.35))}
.wlx-avs{position:fixed;z-index:9020;pointer-events:auto;cursor:crosshair;text-align:center;user-select:none;transition:left 1.6s ease-in-out,top 1.6s ease-in-out}
.wlx-avs img{width:110px;height:150px;filter:drop-shadow(0 0 14px rgba(249,191,1,.9))}
.wlx-avs .hp{width:120px;height:9px;border-radius:9px;background:rgba(0,0,0,.4);overflow:hidden;margin:0 auto}.wlx-avs .hp i{display:block;height:100%;background:#FF4539}
.wlx-avs .nm{font:900 12px "Uncut Sans",system-ui,sans-serif;color:#fff;background:#121313;border:2px solid #F9BF01;border-radius:999px;padding:2px 9px;display:inline-block;margin-bottom:3px}
.wlx-ball{position:fixed;z-index:9030;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #bfe3ff;pointer-events:none;transition:left .28s ease-out,top .28s ease-out}
html.wlx-flip .wl-floorwrap{transform:rotate(180deg);transition:transform 1s}
html.wlx-rainbow .wl-floorbox,html.wlx-rainbow .wl-floorwrap{animation:wlxHue 4s linear infinite}
html.wlx-disco .wl-floorbox{animation:wlxHue 1.2s steps(6) infinite}
@keyframes wlxHue{to{filter:hue-rotate(360deg)}}
html.wlx-lava .wl-floorbox{box-shadow:0 0 0 4px #ff6a00,0 0 60px rgba(255,90,0,.8)!important;filter:sepia(.5) saturate(2.4) hue-rotate(-25deg)}
html.wlx-bighead .wl-me{transform:scale(1.7)!important}
html.wlx-shake body{animation:wlxShake .6s}
@keyframes wlxShake{10%,50%,90%{transform:translate(-6px,3px)}30%,70%{transform:translate(6px,-3px)}}
.wlx-disco i{position:absolute;width:60vmax;height:60vmax;border-radius:50%;mix-blend-mode:screen;opacity:.22;animation:wlxSpot 3s ease-in-out infinite alternate}
@keyframes wlxSpot{to{transform:translate(30vw,20vh)}}
.wlx-lavaglow{position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(0deg,rgba(255,80,0,.45),rgba(255,140,0,0));animation:wlxLava 1.6s ease-in-out infinite alternate}
@keyframes wlxLava{to{opacity:.55}}
.wlx-ov{position:fixed;inset:0;z-index:9700;background:rgba(1,30,22,.86);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;font-family:"Uncut Sans","Inter",system-ui,sans-serif}
.wlx-ov *{box-sizing:border-box}
.wlx-card{background:#fff;border-radius:20px;padding:18px;max-width:980px;width:100%;max-height:94vh;overflow-y:auto;color:#121313;box-shadow:0 0 0 4px #F9BF01,0 20px 60px rgba(0,0,0,.4)}
.wlx-h1{font-weight:900;font-size:24px;color:#015640;margin:0}
.wlx-sec{font-weight:900;font-size:13px;letter-spacing:.08em;color:#4a4a4a;margin:14px 0 6px}
.wlx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}
.wlx-ev{border:2px solid #eee8d4;border-radius:14px;padding:9px;background:#fbf9f1;display:flex;flex-direction:column;gap:5px}
.wlx-ev .t{display:flex;gap:8px;align-items:center;font-weight:900;font-size:14px}
.wlx-ev .t span{font-size:24px}
.wlx-ev .d{font-size:11.5px;color:#4a4a4a;line-height:1.35;flex:1}
.wlx-ev select,.wlx-ev input,.wlx-card select,.wlx-card input[type=text],.wlx-card input[type=number],.wlx-card input[type=datetime-local]{font:700 12px inherit;font-family:inherit;padding:5px 7px;border:2px solid #d9d3bd;border-radius:9px;background:#fff;max-width:100%}
.wlx-ev .go{background:#015640;color:#fff;border:none;border-radius:999px;padding:7px;font:800 13px inherit;font-family:inherit;cursor:pointer}
.wlx-ev.gen{border-color:#bfe9a0}.wlx-ev.chaos{border-color:#d7b8f3}.wlx-ev.boss{border-color:#ffc2b8}
.wlx-x{margin-left:auto;border:none;background:#eee8d4;border-radius:999px;width:34px;height:34px;cursor:pointer;font-size:15px}
.wlx-pill{display:inline-flex;gap:5px;align-items:center;background:#eef5e8;border-radius:999px;padding:3px 9px;font-size:12px;font-weight:700;margin:2px}
.wlx-log{font:600 11.5px ui-monospace,Menlo,monospace;background:#121313;color:#D5F367;border-radius:12px;padding:8px 10px;max-height:150px;overflow-y:auto;white-space:pre-wrap}
.wlx-warn{background:#fff3cd;border:2px solid #F9BF01;border-radius:12px;padding:8px 12px;font-size:13px;margin-top:8px}
.wlx-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.wlx-btn.red{background:#c8102e}.wlx-btn.alt{background:#D5F367;color:#015640}.wlx-btn[disabled]{opacity:.45;cursor:not-allowed}
.wlx-list .it{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #eee8d4;font-size:13px}
`; document.head.appendChild(s); };
const ensureLayer = () => { css(); if (!layer) { layer = el('div', {id:'wlx-layer'}); cvs = el('canvas'); layer.appendChild(cvs); cg = cvs.getContext('2d'); document.body.appendChild(layer); }
  if (!banner) { banner = el('div', {id:'wlx-banner'}); document.body.appendChild(banner); } };
// big splashes play one after another so they never pile on top of each other (countdown digits jump the queue)
const bigQ = []; let bigOn = false;
const bigNext = () => { if (bigOn || !bigQ.length) return; const [txt, sub, ms] = bigQ.shift(); if (!fx() || inGame()) { bigQ.length = 0; return; } ensureLayer(); bigOn = true;
  const b = el('div', {cls:'wlx-big', style:{animationDuration:((ms || 2700)/1000)+'s'}}, txt, sub ? el('small', null, sub) : null); document.body.appendChild(b); setTimeout(() => { b.remove(); bigOn = false; bigNext(); }, ms || 2700); };
const big = (txt, sub, ms) => { if (!fx() || inGame()) return; if (ms && ms < 1200) { bigQ.unshift([txt, sub, ms]); } else if (bigQ.length < 6) bigQ.push([txt, sub, ms]); bigNext(); };
const pop = (x, y, txt) => { ensureLayer(); const p = el('div', {cls:'wlx-pop', style:{left:x+'px', top:y+'px'}}, txt); layer.appendChild(p); setTimeout(() => p.remove(), 950); };

// ---------------- activation / ending ----------------
const seen = new Set(LSj('wl-ev-seen', [])), started = new Set(), ended = new Set();
const onStart = e => { started.add(e.id); setTimeout(() => api && api.refresh && api.refresh(), 0);
  if (!seen.has(e.id)) { seen.add(e.id); LSset('wl-ev-seen', JSON.stringify([...seen].slice(-300))); if (api) api.stat('evSeen', 1, 'add'); }
  const fresh = now() - e.t0 < 15000;
  if (fresh) { big(evIcon(e)+' '+evName(e).toUpperCase(), (T[e.k]||{}).d); if (api && !inGame()) api.sfx('win'); }
  if (e.k == 'gift') giftQueue.push(e);
  if (e.k == 'petparty') once('pet:'+e.id, () => { const H = window.WLH; if (!H || !api) return; const p = H.givePet(api.P(), 'partypup'); if (p) { api.setP(p); api.toast('🐾 PET PARTY GIFT · CONFETTI THE PARTY PUP JOINED YOUR PETS!', true); } else api.toast('🐾 PET PARTY · DOUBLE PET XP!'); });
  if (e.k == 'airhorn' && fresh) airhorn();
  if (e.k == 'boss' || e.k == 'avs' || e.k == 'tourney') follow(e);
};
const onEnd = e => { ended.add(e.id); setTimeout(() => api && api.refresh && api.refresh(), 0); if (e.k == 'boss' || e.k == 'avs' || e.k == 'tourney') finishPlay(e); };

// ---------------- generous events ----------------
let stormT = 0, stormAuto = 0, stormAutoN = 0, critT = 0;
const stormVal = () => api ? Math.max(25, need0(api.P()) * .0003) : 25;
const spawnTicket = () => { ensureLayer(); const x = 20 + Math.random()*(innerWidth - 60), dur = 4.5 + Math.random()*2.5, t = el('div', {cls:'wlx-tix', style:{left:x+'px', transitionDuration:dur+'s'}}, Math.random() < .08 ? '🎫' : '🎟');
  const gold = t.textContent == '🎫';
  t.onpointerdown = ev2 => { ev2.preventDefault(); ev2.stopPropagation(); const r = t.getBoundingClientRect(); t.remove(); const n = grant(stormVal()*(gold ? 5 : 1), 'storm'); pop(r.left, r.top, '+'+fmt(n)+' 🎟'); if (api) { api.stat('evStorm', 1, 'add'); api.sfx('coin'); } };
  layer.appendChild(t); requestAnimationFrame(() => requestAnimationFrame(() => { t.style.top = (innerHeight + 40)+'px'; })); setTimeout(() => t.remove(), dur*1000 + 200); };
const giftQueue = [];
const openGift = e => { css(); const o = el('div', {cls:'wlx-ov'}), card = el('div', {cls:'wlx-card', style:{maxWidth:'420px', textAlign:'center'}}); o.appendChild(card);
  const close = () => o.remove();
  card.append(el('div', {style:{fontSize:'70px', cursor:'pointer', animation:'wlxShake 1s infinite'}, onclick:() => reveal()}, '🎁'), el('div', {cls:'wlx-h1'}, 'Mystery Gift!'), el('div', {style:{fontSize:'13px', color:'#4a4a4a', margin:'6px 0 12px'}}, 'An admin dropped a gift for everyone online. Tap the box to open it.'), el('button', {cls:'wlx-btn', onclick:() => reveal()}, 'Open it!'));
  let done = false;
  const reveal = () => { if (done) return; done = true; let what = '';
    once('gift:'+e.id, () => { const P = api.P(), r = Math.random(), AV = window.WLAV, H = window.WLH;
      if (r < .2 && AV && AV.giftItem) { const it = AV.giftItem(P); if (it) { api.setP({avOwn:{...(P.avOwn||{}), [it.key]:1}}); what = '👕 Avatar item: '+it.n; } }
      if (!what && r < .35 && H && H.giftPetId) { const id = H.giftPetId(P); const p = id && H.givePet(P, id); if (p) { api.setP(p); what = '🐾 New pet: '+H.name(id); } }
      if (!what && r < .9) { const it = giveCapsule(r < .7 ? 1 : 2, 'GIFT'); if (it) what = '🏆 Prize: '+it.n; }
      if (!what) { const n = grant(need0(P)*.03, 'gift'); what = '🎟 '+fmt(n)+' tickets'; } });
    card.innerHTML = ''; card.append(el('div', {style:{fontSize:'60px'}}, '🎉'), el('div', {cls:'wlx-h1'}, what || 'Already opened!'), el('div', {style:{fontSize:'12px', color:'#4a4a4a', margin:'6px 0 12px'}}, 'Gift Drops only contain Common to Mythic things.'), el('button', {cls:'wlx-btn', onclick:close}, 'Yay!'));
    api && api.sfx('win'); };
  o.onclick = ev2 => { if (ev2.target === o) close(); }; document.body.appendChild(o); };
// codes: typed in the banner box or in Menu → Enter a code
L.tryCode = async v => { v = String(v||'').trim().toUpperCase(); const e = active().find(x => x.k == 'code' && String((x.o||{}).code).toUpperCase() == v); if (!e) return false;
  const say = t => { api && api.toast(t, true); if (api && api.codeMsg) api.codeMsg(t); };
  if (got['code:'+e.id]) { say('YOU ALREADY CLAIMED THIS CODE'); return true; }
  if (!ev() || !ev().me()) { say('LOG IN TO CLAIM ADMIN CODES (MENU → SIGN UP / LOG IN)'); return true; }
  try { await ev().codeClaim(v); once('code:'+e.id, () => { const n = grant(need0(api.P()) * ((e.o||{}).pct || 10) / 100, 'code'); say('🎫 CODE CLAIMED · +'+fmt(n)+' TICKETS!'); api.sfx('win'); }); }
  catch (err) { const c = err && err.code; say(c == 'gone' ? 'TOO LATE · ALL '+((e.o||{}).max||'')+' SPOTS WERE TAKEN' : c == 'again' ? 'YOU ALREADY CLAIMED THIS CODE' : c == 'expired' ? 'THAT CODE HAS EXPIRED' : 'COULDN’T CLAIM THE CODE · TRY AGAIN'); }
  return true; };

// ---------------- chaos ----------------
const airhorn = () => { if (!muted() && A().tone) { const t = A().tone; [233, 294, 349].forEach((f, i) => { t(f, .55, 'sawtooth', .07); setTimeout(() => t(f, .4, 'sawtooth', .06), 650); }); }
  if (fx() && !inGame()) { document.documentElement.classList.add('wlx-shake'); setTimeout(() => document.documentElement.classList.remove('wlx-shake'), 700); } };
const RUNNERS = ['🦖', '🐘', '🦒', '🐕', '🐈', '🐉', '🦄', '🐢', '🦛', '🐻', '🐼', '🦘'];
const runner = () => { ensureLayer(); const ltr = Math.random() < .5, y = 80 + Math.random()*(innerHeight - 260), r = el('div', {cls:'wlx-runner', style:{top:y+'px', left:(ltr ? -200 : innerWidth + 50)+'px', transform:ltr ? 'scaleX(-1)' : ''}}, RUNNERS[Math.floor(Math.random()*RUNNERS.length)]);
  layer.appendChild(r); const t0 = performance.now(), dur = 3200; const step = t2 => { const k = (t2 - t0)/dur; if (k >= 1 || !r.isConnected) { r.remove(); return; } r.style.left = (ltr ? -200 + (innerWidth + 260)*k : innerWidth + 50 - (innerWidth + 260)*k)+'px'; r.style.marginTop = (-Math.abs(Math.sin(k*18))*26)+'px'; requestAnimationFrame(step); }; requestAnimationFrame(step); };
let flakes = []; let disco = null, lavaG = null, discoT = 0;
const drawSnow = dt => { const W = innerWidth, H = innerHeight; if (cvs.width != W || cvs.height != H) { cvs.width = W; cvs.height = H; } cg.clearRect(0, 0, W, H);
  if (!has('blizzard') || !fx() || inGame()) { flakes = []; return; }
  while (flakes.length < 220) flakes.push({x:Math.random()*W, y:Math.random()*-H, v:60 + Math.random()*120, r:1.5 + Math.random()*3, w:Math.random()*6});
  cg.fillStyle = 'rgba(255,255,255,.9)'; for (const f of flakes) { f.y += f.v*dt; f.x += Math.sin(f.y/40 + f.w)*30*dt - 40*dt; if (f.y > H) { f.y = -10; f.x = Math.random()*W*1.2; } cg.beginPath(); cg.arc(f.x, f.y, f.r, 0, Math.PI*2); cg.fill(); }
  cg.fillStyle = 'rgba(220,235,255,.12)'; cg.fillRect(0, 0, W, H); };

// ---------------- boss / admin-vs-everyone / tournament (shared rows) ----------------
const plays = {};   // eid → {rows, off, my, pushed, pushT, done}
const myKey = e => 'wl-ev-my-'+e.id;
const follow = e => { if (plays[e.id]) return; const P = {rows:[], off:null, my:+LS(myKey(e), 0) || 0, pushed:0, pushT:0, done:false};
  plays[e.id] = P; if (ev()) P.off = ev().playListen(e.id, rows => { if (rows) { P.rows = rows; checkBoss(e); renderWidget(); } }); };
const myUid = () => { const m = ev() && ev().me(); return m ? m.uid : ''; };
const total = e => { const P = plays[e.id]; if (!P) return 0; const me = myUid(); let s = 0; for (const r of P.rows) if (r.uid != me) s += +r.v || 0; return e.k == 'tourney' ? 0 : s + P.my; };
const ranks = e => { const P = plays[e.id]; if (!P) return []; const me = myUid(), out = P.rows.filter(r => r.uid != me).map(r => ({u:r.u, v:+r.v || 0, me:false}));
  if (P.my > 0) out.push({u:(api && api.uname()) || 'you', v:P.my, me:true}); return out.sort((a, b) => b.v - a.v); };
const push = e => { const P = plays[e.id]; if (!P || !ev() || !ev().me() || P.my <= P.pushed) return; const t = Date.now(); if (t - P.pushT < 3200) { clearTimeout(P.tm); P.tm = setTimeout(() => push(e), 3300 - (t - P.pushT)); return; }
  P.pushT = t; const v = P.my; ev().play(e.id, api.uname() || 'player', v).then(() => { P.pushed = Math.max(P.pushed, v); }).catch(() => {}); };
const addMine = (e, v, best) => { const P = plays[e.id] || (follow(e), plays[e.id]); if (P.done) return; P.my = best ? Math.max(P.my, v) : P.my + v; LSset(myKey(e), P.my); push(e); checkBoss(e); renderWidget(); };
const bossHp = e => Math.max(10, +(e.o||{}).hp || 1000);
const checkBoss = e => { if (e.k == 'tourney') return; const P = plays[e.id]; if (!P || P.done) return; if (total(e) >= bossHp(e)) finishPlay(e, true); };
let lastIdleHit = 0;
L.onScore = (id, score) => { if (!api || api.admin()) return; score = Math.max(0, +score || 0);
  for (const e of active()) {
    if (e.k == 'boss') { if (id == 'idle') { if (Date.now() - lastIdleHit < 30000) continue; lastIdleHit = Date.now(); } const d = Math.max(1, Math.round(10*Math.log10(score + 1)));
      addMine(e, d); if (!inGame()) api.toast('⚔ −'+d+' TO '+bossName(e).toUpperCase()); }
    if (e.k == 'tourney' && (e.o||{}).game == id && score > 0) addMine(e, score, true); } };
const finishPlay = (e, won) => { const P = plays[e.id] || (follow(e), plays[e.id]); if (P.done) return; P.done = true; push(e); renderWidget();
  if (e.k == 'tourney') { const R = ranks(e), i = R.findIndex(r => r.me); if (i < 0) return;
    once('play:'+e.id, () => { if (i == 0) { giveCapsule(2, '🥇 1ST PLACE'); giveCapsule(2, '🥇 1ST PLACE'); } else if (i == 1) { giveCapsule(2, '🥈 2ND PLACE'); } else if (i == 2) { giveCapsule(1, '🥉 3RD PLACE'); } else giveCapsule(0, 'TOURNAMENT');
      const n = grant(need0(api.P())*(i < 3 ? .05 : .01), 'tourney'); if (i < 3) { api.stat('evTourney', 1, 'add'); api.setP({evTitle:['🥇', '🥈', '🥉'][i]+' Flash Champion'}); }
      big('🏁 TOURNAMENT OVER', 'You finished #'+(i + 1)+' · +'+fmt(n)+' tickets'); }); return; }
  const R = ranks(e), i = R.findIndex(r => r.me); const tot = Math.max(1, total(e));
  const splash = !got['sp:'+e.id]; if (splash) { got['sp:'+e.id] = 1; gotSave(); }
  if (!won) { if (splash) big(e.k == 'avs' ? '👑 THE ADMIN ESCAPED!' : '💨 '+bossName(e).toUpperCase()+' ESCAPED!', 'Thanks for helping'); if (P.my > 0) once('play:'+e.id, () => grant(need0(api.P())*.01, 'boss')); return; }
  if (splash) big(e.k == 'avs' ? '👑 THE ADMIN IS DOWN!' : '🎉 '+bossName(e).toUpperCase()+' DEFEATED!', 'Everyone who helped gets rewards');
  if (P.my > 0) once('play:'+e.id, () => { const share = Math.min(1, P.my/tot), n = grant(need0(api.P())*(.03 + .3*share), 'boss'); api.stat('evBoss', 1, 'add');
    if (i >= 0 && i < 3) { const ttl = ['🥇', '🥈', '🥉'][i]+' '+(e.k == 'avs' ? 'Admin Toppler' : bossShort(e)+' Slayer'); api.setP({evTitle:ttl}); giveCapsule(2, 'TOP '+(i + 1)); api.toast('🏆 NEW TITLE · '+ttl.toUpperCase(), true); }
    api.toast('⚔ BOSS REWARD · +'+fmt(n)+' TICKETS ('+Math.round(share*100)+'% of the damage)', true); }); };

// boss drawing for the widget
const drawBossIcon = (c, e, t) => { const g = c.getContext('2d'), W = c.width, H = c.height, o = e.o || {}; g.clearRect(0, 0, W, H); const SC = A().snowCast, bob = Math.sin(t*3)*3;
  if ((o.boss || 'loki') == 'loki' && SC && SC.loki) { try { SC.loki(g, W/2, H/2 + 18 + bob, {s:1.05, ph:1}, t); return; } catch(e2) {} }
  g.save(); g.translate(W/2, H/2 + bob);
  if (o.boss == 'yeti') { g.fillStyle = '#f4f8ff'; g.beginPath(); g.ellipse(0, 6, 30, 32, 0, 0, 7); g.fill(); g.fillStyle = '#8ab0d0'; g.beginPath(); g.ellipse(0, -8, 15, 12, 0, 0, 7); g.fill(); g.fillStyle = '#14204a'; g.beginPath(); g.arc(-6, -11, 2.6, 0, 7); g.arc(6, -11, 2.6, 0, 7); g.fill(); g.fillStyle = '#F9BF01'; g.beginPath(); g.moveTo(-12, -24); g.lineTo(-12, -32); g.lineTo(-6, -27); g.lineTo(0, -35); g.lineTo(6, -27); g.lineTo(12, -32); g.lineTo(12, -24); g.fill(); }
  else if (o.boss == 'gopher') { g.fillStyle = '#c48a4a'; g.beginPath(); g.ellipse(0, 6, 28, 30, 0, 0, 7); g.fill(); g.fillStyle = '#f2d9b0'; g.beginPath(); g.ellipse(0, 12, 16, 18, 0, 0, 7); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(-9, -8, 3, 0, 7); g.arc(9, -8, 3, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(-5, 0, 4, 7); g.fillRect(1, 0, 4, 7); g.fillStyle = '#8D5B1D'; g.beginPath(); g.arc(-20, -22, 7, 0, 7); g.arc(20, -22, 7, 0, 7); g.fill(); }
  else { g.fillStyle = '#7a4ab0'; g.beginPath(); g.ellipse(0, 4, 30, 30, 0, 0, 7); g.fill(); g.fillStyle = '#ffe066'; g.beginPath(); g.arc(-10, -4, 5, 0, 7); g.arc(10, -4, 5, 0, 7); g.fill(); g.fillStyle = '#14204a'; g.beginPath(); g.arc(-10, -4, 2, 0, 7); g.arc(10, -4, 2, 0, 7); g.fill(); g.strokeStyle = '#14204a'; g.lineWidth = 3; g.beginPath(); g.arc(0, 10, 9, .2, 2.9); g.stroke(); g.fillStyle = '#c8b0ff'; g.beginPath(); g.moveTo(-22, -20); g.lineTo(-30, -38); g.lineTo(-12, -26); g.moveTo(22, -20); g.lineTo(30, -38); g.lineTo(12, -26); g.fill(); }
  g.restore(); };
let wcv = null;
const renderWidget = () => { const live = x => !(plays[x.id] && plays[x.id].done), cand = active().filter(x => x.k == 'boss' || x.k == 'tourney' || x.k == 'avs'); const e = cand.find(x => live(x) && x.k != 'avs') || cand.find(live) || cand[0];
  if (!e) { if (widget) { widget.remove(); widget = null; } return; } css(); if (!widget) { widget = el('div', {id:'wlx-widget'}); document.body.appendChild(widget); }
  widget.className = inGame() ? 'game' : ''; const P = plays[e.id] || {my:0, done:false}; widget.innerHTML = '';
  if (e.k == 'tourney') { const R = ranks(e).slice(0, inGame() ? 3 : 6), me = ranks(e).findIndex(r => r.me);
    widget.append(el('div', {style:{fontWeight:900, fontSize:'14px'}}, '🏁 ', gameTitle((e.o||{}).game)), el('div', {style:{opacity:.8}}, P.done ? 'Finished!' : mmss(e.t1 - now())+' left · your best: '+(P.my ? fmt(P.my) : '—')+(me >= 0 ? ' · #'+(me + 1) : '')),
      el('div', null, R.map((r, i) => el('div', {cls:'row', style:{fontWeight:r.me ? 900 : 600, color:r.me ? '#D5F367' : '#fff'}}, el('span', null, (['🥇', '🥈', '🥉'][i] || (i + 1)+'.')+' '+L.plate(r.u)), el('span', null, fmt(r.v))))),
      !inGame() && !P.done ? el('button', {cls:'wlx-btn alt', style:{marginTop:'6px', width:'100%'}, onclick:() => api.openGame((e.o||{}).game)}, '▶ Play now') : null); return; }
  const hp = bossHp(e), tot = total(e), pct = Math.max(0, 1 - tot/hp);
  if (!wcv) wcv = el('canvas', {width:90, height:90, style:{width:'64px', height:'64px', flexShrink:0}});
  widget.append(el('div', {style:{display:'flex', gap:'8px', alignItems:'center'}}, inGame() || e.k == 'avs' ? null : wcv, el('div', {style:{flex:1, minWidth:0}},
    el('div', {style:{fontWeight:900, fontSize:'13px'}}, e.k == 'avs' ? '⚔️ Admin vs Everyone' : '👹 '+bossName(e)),
    el('div', {cls:'bar'}, el('i', {style:{width:(pct*100)+'%'}})),
    el('div', {cls:'row', style:{opacity:.85}}, el('span', null, P.done ? (tot >= hp ? 'DEFEATED!' : 'Escaped') : fmt(Math.max(0, hp - tot))+' / '+fmt(hp)+' HP'), el('span', null, mmss(e.t1 - now()))))),
    el('div', {style:{marginTop:'4px'}}, e.k == 'avs' ? 'Your hits: '+fmt(P.my)+' · click the admin on the floor!' : 'Your damage: '+fmt(P.my)+' · score points in ANY game!'),
    inGame() ? null : el('div', {style:{marginTop:'4px', opacity:.8}}, ranks(e).slice(0, 3).map((r, i) => el('div', {cls:'row'}, el('span', null, ['🥇', '🥈', '🥉'][i]+' '+L.plate(r.u)), el('span', null, fmt(r.v)))))); };

// Admin vs Everyone: the admin's avatar wanders over the arcade floor; click it to throw a snowball
let avsEl = null, avsMove = 0, avsHitT = 0;
const avsUpdate = t => { const e = has('avs'); const show = e && !inGame() && api && !plays[e.id]?.done; const fr = show && api.floorRect ? api.floorRect() : null;
  if (!show || !fr || fr.width < 50) { if (avsEl) { avsEl.remove(); avsEl = null; } return; } css();
  if (!avsEl) { avsEl = el('div', {cls:'wlx-avs'}); avsEl.onpointerdown = ev2 => { ev2.preventDefault(); const tn = performance.now(); if (tn - avsHitT < 300) return; avsHitT = tn; throwAt(ev2.clientX, ev2.clientY, e); }; document.body.appendChild(avsEl); avsMove = 0; }
  const hp = bossHp(e), tot = total(e); avsEl.innerHTML = ''; avsEl.append(el('div', {cls:'nm'}, '👑 '+(S.admin.name || 'ADMIN')), el('img', {src:api.avImg(S.admin.av || ''), alt:''}), el('div', {cls:'hp'}, el('i', {style:{width:Math.max(0, 100 - tot/hp*100)+'%'}})));
  if (t > avsMove) { avsMove = t + 1.7; const x = fr.left + 40 + Math.random()*Math.max(10, fr.width - 200), y = fr.top + 30 + Math.random()*Math.max(10, Math.min(innerHeight, fr.bottom) - fr.top - 220); avsEl.style.left = x+'px'; avsEl.style.top = y+'px'; } };
const throwAt = (x, y, e) => { const b = el('div', {cls:'wlx-ball', style:{left:(innerWidth/2)+'px', top:(innerHeight - 30)+'px'}}); document.body.appendChild(b); requestAnimationFrame(() => requestAnimationFrame(() => { b.style.left = (x - 8)+'px'; b.style.top = (y - 8)+'px'; }));
  setTimeout(() => { b.remove(); pop(x, y - 20, '❄ HIT!'); api && api.sfx('blip'); addMine(e, 1); const P = plays[e.id]; if (P && P.my % 10 == 0) once('avs10:'+e.id+':'+P.my, () => { if (P.my <= 200) giveCapsule(0, 'SNOWBALL PRIZE'); else grant(need0(api.P())*.002, 'avs'); }); }, 300); };

// ---------------- banner ----------------
let codeInput = null, lastBanner = '';
const renderBanner = () => { ensureLayer(); const act = active(), up = upcoming().filter(e => e.t0 - now() < 10*60000), ann = S.ann && S.ann.t1 > now() ? S.ann : null, code = act.find(e => e.k == 'code');
  banner.className = inGame() ? 'game' : '';
  const key = [inGame(), act.map(e => e.id + Math.ceil((e.t1 - now())/1000)).join(','), up.map(e => e.id + Math.ceil((e.t0 - now())/1000)).join(','), ann ? ann.id : '', code ? code.id : '', fx()].join('|');
  if (key == lastBanner) return; lastBanner = key;
  const keep = codeInput && document.activeElement === codeInput ? codeInput.value : null;
  banner.innerHTML = ''; if (!act.length && !up.length && !ann) return;
  if (ann) banner.append(el('div', {cls:'ann', style:{background:ann.col || '#015640', border:'3px solid #fff'}}, (ann.e || '📣')+' '+ann.text));
  if (code && !inGame()) { codeInput = el('input', {placeholder:'TYPE CODE', maxlength:12}); if (keep != null) codeInput.value = keep;
    const claim = () => L.tryCode(codeInput.value);
    codeInput.onkeydown = ev2 => { ev2.stopPropagation(); if (ev2.key == 'Enter') claim(); };
    banner.append(el('div', {cls:'code'}, '🎫 ADMIN CODE DROP:', el('b', null, (code.o||{}).code), 'first '+((code.o||{}).max||10)+' players win!', got['code:'+code.id] ? el('span', {style:{color:'#00B451'}}, '✓ claimed') : [codeInput, el('button', {onclick:claim}, 'Claim')]));
    if (keep != null) setTimeout(() => codeInput && codeInput.focus(), 0); }
  const shown = act.filter(e => !T[e.k].inst), few = shown.length <= 3 && !inGame();
  banner.append(el('div', {cls:'row'}, shown.map(e => el('button', {cls:'chip', title:evName(e)+' · '+(T[e.k]||{}).d, onclick:() => L.history()}, evIcon(e)+' '+(few ? evName(e)+' · ' : '')+mmss(e.t1 - now()))),
    up.map(e => el('button', {cls:'chip up', onclick:() => L.history()}, '⏳ '+evName(e)+' in '+mmss(e.t0 - now()))))); };

// ---------------- the main loop ----------------
let lastT = performance.now(), lastSec = 0, presT = 0, entranceSeen = +LS('wl-ev-in', 0) || 0, annSeen = LS('wl-ev-ann', '');
const tick = () => { if (!api) return; const tn = performance.now(), dt = Math.min(.1, (tn - lastT)/1000); lastT = tn; const t = tn/1000;
  const act = active(), ids = new Set(act.map(e => e.id));
  for (const e of act) if (!started.has(e.id)) onStart(e);
  for (const e of S.list) if (started.has(e.id) && !ids.has(e.id) && !ended.has(e.id) && e.t0 <= now()) onEnd(e);
  // html classes for chaos (the arcade floor only: games are never touched)
  const H = document.documentElement.classList, vis = fx() && !inGame();
  H.toggle('wlx-flip', vis && !!has('gravity')); H.toggle('wlx-disco', vis && !!has('disco')); H.toggle('wlx-rainbow', vis && !!has('rainbow')); H.toggle('wlx-lava', vis && !!has('lava')); H.toggle('wlx-bighead', vis && !!has('bighead'));
  A().liveSpeed = has('speed') ? 1.15 : 1;
  ensureLayer(); drawSnow(dt);
  if (vis && has('disco')) { if (!disco) { disco = el('div', {cls:'wlx-disco', style:{position:'absolute', inset:0}}, ['#ff5fd2', '#64CDF5', '#F9BF01', '#00B451'].map((c, i) => el('i', {style:{background:'radial-gradient(circle,'+c+' 0,transparent 60%)', left:(i*25 - 20)+'vw', top:((i%2)*40 - 20)+'vh', animationDelay:(i*.7)+'s'}}))); layer.appendChild(disco); }
    if (!muted() && A().tone && tn > discoT) { discoT = tn + 500; A().tone(70, .09, 'sine', .05); if (Math.floor(tn/250) % 2) A().tone(5200, .03, 'square', .008); } }
  else if (disco) { disco.remove(); disco = null; }
  if (vis && has('lava')) { if (!lavaG) { lavaG = el('div', {cls:'wlx-lavaglow'}); layer.appendChild(lavaG); } } else if (lavaG) { lavaG.remove(); lavaG = null; }
  if (vis && has('stampede') && Math.random() < dt/2.4) runner();
  if (!vis) layer.querySelectorAll('.wlx-runner,.wlx-tix').forEach(x => x.remove());
  // Ticket Storm: catch them on screen; while you're in a game (or with calm effects) they're caught for you, a bit slower
  if (has('storm')) { if (vis) { stormT -= dt; if (stormT <= 0) { stormT = .55 + Math.random()*.5; if (layer.querySelectorAll('.wlx-tix').length < 16) spawnTicket(); } }
    else { stormAuto -= dt; if (stormAuto <= 0) { stormAuto = 6; grant(stormVal(), 'storm'); stormAutoN++; api.stat('evStorm', 1, 'add'); } } }
  if (stormAutoN && (!has('storm') || !inGame()) ) { api.toast('🎟 TICKET STORM · CAUGHT '+stormAutoN+' TICKETS WHILE YOU PLAYED'); stormAutoN = 0; }
  if (!has('storm')) layer.querySelectorAll('.wlx-tix').forEach(x => x.remove());
  if (has('golden') && !document.hidden) { critT -= dt; if (critT <= 0) { critT = 6; window.WLE && window.WLE.spawnCritter && window.WLE.spawnCritter(); } }
  if (giftQueue.length && !inGame() && !document.querySelector('.wlx-ov')) { const e = giftQueue.shift(); if (!got['gift:'+e.id]) openGift(e); }
  avsUpdate(t);
  if (widget && wcv && widget.contains(wcv)) { const e = has('boss'); if (e) drawBossIcon(wcv, e, t); }
  // admin entrance banner
  const ai = S.admin && S.admin.in || 0; if (ai > entranceSeen && now() - ai < 120000 && S.admin.crown !== false) { entranceSeen = ai; LSset('wl-ev-in', ai); if (!isMeAdmin()) { big('👑 '+(S.admin.name || 'jonah')+' has entered the arcade', '✨ Admin events may happen at any moment ✨', 4200); if (!inGame()) api.sfx('win'); } }
  if (S.ann && S.ann.id != annSeen && S.ann.t1 > now()) { annSeen = S.ann.id; LSset('wl-ev-ann', annSeen); if (!inGame()) api.sfx('blip'); }
  // countdown: the last 5 seconds before an event starts
  const soon = upcoming()[0]; if (soon && fx() && !inGame()) { const s = Math.ceil((soon.t0 - now())/1000); if (s <= 5 && s >= 1 && s != lastSec) { lastSec = s; big(String(s), evName(soon)+' is coming!', 950); api.sfx('blip'); } }
  if (tn/1000 - lastSecW > 1) { lastSecW = tn/1000; renderWidget(); }
  renderBanner();
  if (tn > presT) { presT = tn + 60000; presence(); }
  if (!helloDone && loaded && adminReady()) { helloDone = true; L.adminHello(); } };
let helloDone = false, loaded = false;
let lastSecW = 0;
const presence = async () => { try { if (!ev() || !ev().me() || !api) return; const s = await ev().presence({u:api.uname() || '', g:api.game() || ''}); if (s != null && isFinite(s) && Math.abs(s) < 864e5) skew = Math.round(s); } catch(e) {} };

// ---------------- connect ----------------
let off = null;
const connect = () => { if (off || !ev()) return; off = ev().listen((d, err) => { if (!d) return; S = norm(d); loaded = true; lastBanner = ''; S.list.filter(e => (e.k == 'boss' || e.k == 'avs' || e.k == 'tourney') && e.t0 <= now()).forEach(follow); });
  if (window.WLCloud && window.WLCloud.onAuth) window.WLCloud.onAuth(() => { presT = 0; }); };
L.attach = a => { api = a; css(); const W = window.WLP;
  if (W && !W._live) { W._live = true; const gm = W.globalMult, rn = W.rebirthNeed; rawNeed = rn;
    W.globalMult = P => gm(P) * L.mult();
    W.rebirthNeed = P => { const n = rn(P), e = has('rebirth'); if (!e) return n; const k = 'wl-ev-rb-'+e.id; let b = LS(k, null); if (b == null) { b = String(P.rebirths|0); LSset(k, b); } return (P.rebirths|0) <= +b ? n*.5 : n; }; }
  if (window.WLCloud) connect(); else window.addEventListener('wlcloud-ready', connect, {once:true});
  setInterval(tick, 200); window.addEventListener('keydown', ev2 => { if (ev2.key == 'F9') { ev2.preventDefault(); L.panel(); } }, true); };
L.debug = () => ({S, plays, skew, set:d => { S = norm(d); lastBanner = ''; S.list.filter(e => (e.k == 'boss' || e.k == 'avs' || e.k == 'tourney') && e.t0 <= now()).forEach(follow); }, tick});

// ---------------- player page: running, upcoming and past admin events ----------------
L.history = async () => { css(); const o = el('div', {cls:'wlx-ov'}), card = el('div', {cls:'wlx-card', style:{maxWidth:'620px'}}); o.appendChild(card); const close = () => o.remove();
  const render = past => { card.innerHTML = ''; const act = active(), up = upcoming();
    card.append(el('div', {cls:'wlx-row'}, el('div', {cls:'wlx-h1'}, '👑 Admin events'), el('button', {cls:'wlx-x', onclick:close}, '✕')),
      el('div', {style:{fontSize:'12px', color:'#4a4a4a', marginTop:'4px'}}, 'Live events the admin starts for everyone online. They never take anything away, and they end on their own. Turn down the visuals in Menu → Settings → Event effects.'),
      el('div', {cls:'wlx-sec'}, 'HAPPENING NOW'), act.length ? el('div', {cls:'wlx-list'}, act.map(e => el('div', {cls:'it'}, el('span', {style:{fontSize:'22px'}}, evIcon(e)), el('div', {style:{flex:1}}, el('b', null, evName(e)), el('div', {style:{fontSize:'12px', color:'#4a4a4a'}}, (T[e.k]||{}).d)), el('b', null, mmss(e.t1 - now()))))) : el('div', {style:{fontSize:'13px', color:'#4a4a4a'}}, 'Nothing right now.'),
      el('div', {cls:'wlx-sec'}, 'COMING UP'), up.length ? el('div', {cls:'wlx-list'}, up.map(e => el('div', {cls:'it'}, el('span', {style:{fontSize:'22px'}}, evIcon(e)), el('div', {style:{flex:1}}, el('b', null, evName(e)), el('div', {style:{fontSize:'12px', color:'#4a4a4a'}}, new Date(e.t0 - skew).toLocaleString([], {weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit'})+' · also on the Calendar')), el('b', null, 'in '+mmss(e.t0 - now()))))) : el('div', {style:{fontSize:'13px', color:'#4a4a4a'}}, 'Nothing scheduled yet.'),
      el('div', {cls:'wlx-sec'}, 'PAST EVENTS'), past == null ? el('div', null, 'Loading…') : past.length ? el('div', {cls:'wlx-list'}, past.slice().reverse().slice(0, 40).map(h => el('div', {cls:'it'}, el('span', {style:{fontSize:'18px'}}, (T[h.k]||{e:'✨'}).e), el('div', {style:{flex:1}}, h.n || (T[h.k]||{}).n), el('span', {style:{fontSize:'12px', color:'#4a4a4a'}}, new Date(h.t0).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}))))) : el('div', {style:{fontSize:'13px', color:'#4a4a4a'}}, 'No events yet.')); };
  render(null); o.onclick = e2 => { if (e2.target === o) close(); }; document.body.appendChild(o);
  let past = []; try { past = ev() ? await ev().hist() : []; } catch(e) {} past = past.filter(h => h.t0 <= now()); if (o.isConnected) render(past); };

// =====================================================================================================
// ADMIN ABUSE PANEL — only the admin can open it. (Even if someone opened it by editing the page, every
// write would be refused by the Firestore rules.)
// =====================================================================================================
const log = []; let pnl = null, chaosTimer = null, chaosUntil = 0, onlineRows = null, onlineAt = 0;
const addLog = s => { const t = new Date().toLocaleTimeString(); if (log.length && log[0].slice(log[0].indexOf('  ') + 2).replace(/ \(×\d+\)$/, '') == s) { const m = log[0].match(/ \(×(\d+)\)$/); log[0] = t+'  '+s+' (×'+((m ? +m[1] : 1) + 1)+')'; } else log.unshift(t+'  '+s); log.length = Math.min(log.length, 80); if (pnl) pnl.renderLog(); };
const mutate = async fn => { const cur = norm(await ev().get()); fn(cur); const t = now();
  cur.list = cur.list.filter(e => e.t1 > t - 15*60000);   // finished events stay 15 min so late tabs still hand out rewards, then drop off
  cur.open = cur.list.filter(e => (e.k == 'boss' || e.k == 'avs' || e.k == 'tourney') && e.t1 > t - 60000).map(e => e.id);
  await ev().put(cur); S = cur; lastBanner = ''; return cur; };
const startEv = async (k, o, opt) => { const t = now(), dur = k == 'tourney' ? 10*60000 : T[k].inst ? 8000 : (opt.min || 5)*60000, t0 = opt.at || (opt.countdown ? t + 60000 : t), id = k+'-'+t.toString(36)+Math.random().toString(36).slice(2, 5);
  const e = {id, k, t0, t1:t0 + dur, o:o || {}, by:'admin'};
  if (k == 'code') { e.o.code = (o.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || ('WILD'+Math.floor(1000 + Math.random()*9000)); await ev().codeMake(e.o.code, {max:e.o.max || 10, pct:e.o.pct || 10, t1:e.t1}); }
  await mutate(d => d.list.push(e)); const nm = evName(e); try { await ev().histAdd([{id, k, n:nm, t0, t1:e.t1}]); } catch(x) {}
  addLog((t0 > t + 2000 ? '⏳ scheduled ' : '▶ started ')+nm+(t0 > t + 2000 ? ' for '+new Date(t0 - skew).toLocaleString() : '')+' · '+Math.round(dur/60000*10)/10+' min'); return e; };
const endEv = id => mutate(d => { d.list.forEach(e => { if (e.id == id && e.t1 > now()) e.t1 = now() - 1; if (e.id == id && e.t0 > now()) e.t0 = e.t1 = now() - 1; }); }).then(() => addLog('■ ended '+id));
const endAll = () => { chaosStop(); return mutate(d => { d.list.forEach(e => { if (e.t0 > now()) e.t0 = now() - 1; if (e.t1 > now()) e.t1 = now() - 1; }); d.ann = null; d.chaosUntil = 0; }).then(() => addLog('⛔ ended ALL events')); };
const CHAOS = ['gravity', 'disco', 'frog', 'bighead', 'blizzard', 'lava', 'rainbow', 'speed', 'stampede', 'airhorn', 'silly'];
const chaosStop = () => { if (chaosTimer) clearInterval(chaosTimer); chaosTimer = null; chaosUntil = 0; };
const chaosStart = async () => { chaosStop(); chaosUntil = now() + 5*60000; let last = ''; addLog('🌪 CHAOS MODE for 5 minutes');
  const fire = async () => { if (now() > chaosUntil) { chaosStop(); addLog('🌪 chaos mode finished'); if (pnl) pnl.render(); return; } let k; do { k = CHAOS[Math.floor(Math.random()*CHAOS.length)]; } while (k == last); last = k;
    const o = k == 'frog' ? {animal:Object.keys(ANIMALS)[Math.floor(Math.random()*6)]} : {}; try { await startEv(k, o, {min:.5}); } catch(err) { addLog('✖ '+(err.code || err.message)); chaosStop(); } };
  await fire(); chaosTimer = setInterval(fire, 32000); };
const announce = (text, e, col, min) => mutate(d => { d.ann = {id:'a'+now().toString(36), text:String(text).slice(0, 140), e:e || '📣', col:col || '#015640', t1:now() + (min || 1)*60000}; }).then(() => addLog('📣 announced: '+text));
const setAdmin = patch => mutate(d => { d.admin = {...(d.admin || {}), ...patch}; });

L.panel = () => { if (!api) return; if (!isMeAdmin()) { api.toast('ADMIN ABUSE IS ONLY FOR THE ADMIN ACCOUNT'); return; } if (pnl) return; css();
  const o = el('div', {cls:'wlx-ov'}), card = el('div', {cls:'wlx-card'}); o.appendChild(card);
  const close = () => { o.remove(); pnl = null; clearInterval(iv); document.removeEventListener('keydown', kd, true); };
  const kd = e2 => { if (e2.key == 'Escape' || e2.key == 'F9') { e2.stopPropagation(); e2.preventDefault(); close(); } else e2.stopPropagation(); };
  let dur = 5, countdown = false, schedAt = '';
  const err = x => { const c = x && (x.code || x.message) || 'error'; addLog('✖ '+(String(c).includes('permission') ? 'NOT ALLOWED by the database rules. Are the new rules published, and are you logged in with Google as '+ADMIN+'?' : c)); };
  const go = (k, o2) => startEv(k, o2, {min:dur, countdown, at:schedAt ? new Date(schedAt).getTime() + skew : 0}).then(() => render()).catch(err);
  const opt = (k) => { const box = el('div', {cls:'wlx-row'}), val = {};
    const sel = (key, opts, def) => { const s = el('select', null, opts.map(([v, n]) => el('option', {value:v}, n))); s.value = def; val[key] = def; s.onchange = () => { val[key] = s.value; }; box.appendChild(s); };
    const num = (key, def, ph, w) => { const i = el('input', {type:'number', value:def, placeholder:ph, style:{width:(w || 70)+'px'}}); val[key] = def; i.oninput = () => { val[key] = +i.value; }; box.append(el('span', {style:{fontSize:'11px'}}, ph), i); };
    const txt = (key, ph, w) => { const i = el('input', {type:'text', placeholder:ph, maxlength:24, style:{width:(w || 120)+'px'}}); val[key] = ''; i.oninput = () => { val[key] = i.value; }; box.appendChild(i); };
    if (k == 'mult') sel('x', [['2', '×2'], ['5', '×5'], ['10', '×10'], ['100', '×100']], '2');
    if (k == 'frog') sel('animal', Object.keys(ANIMALS).map(a => [a, ANIMALS[a]+' '+a]), 'frog');
    if (k == 'boss') { sel('boss', [['loki', '🐕 Loki'], ['yeti', '🏔 Yeti King'], ['gopher', '🐹 Mega Gopher'], ['custom', '👹 Custom…']], 'loki'); txt('name', 'custom name', 110); num('hp', 2000, 'HP', 80); }
    if (k == 'avs') num('hp', 300, 'hits', 70);
    if (k == 'tourney') sel('game', api.games().filter(g => g.id != 'idle' && g.id != 'secrets').map(g => [g.id, g.title]), api.games()[0] ? api.games()[0].id : '');
    if (k == 'code') { txt('code', 'code (blank = random)', 130); num('max', 10, 'winners', 55); num('pct', 10, '% of rebirth', 55); }
    return {box, val:() => { const v = {...val}; if (v.x) v.x = +v.x; return v; }}; };
  const tile = k => { const t2 = T[k], op = opt(k); return el('div', {cls:'wlx-ev '+t2.cat}, el('div', {cls:'t'}, el('span', null, t2.e), t2.n), el('div', {cls:'d'}, t2.d + (k == 'tourney' ? ' (always 10 min)' : t2.inst ? ' (a few seconds)' : '')), op.box.childNodes.length ? op.box : null, el('button', {cls:'go', disabled:!adminReady() || null, onclick:() => go(k, op.val())}, 'Start')); };
  let logBox = null, onlineBox = null, runBox = null;
  const render = () => { card.innerHTML = ''; const m = ev() && ev().me();
    card.append(el('div', {cls:'wlx-row'}, el('div', {cls:'wlx-h1'}, '👑 Admin Abuse'), el('span', {cls:'wlx-pill'}, adminReady() ? '✅ '+ADMIN+' via Google' : '⚠️ not ready'), el('button', {cls:'wlx-x', onclick:close}, '✕')));
    if (adminReady() && rulesOff) card.append(el('div', {cls:'wlx-warn', style:{background:'#ffe3e0', borderColor:'#c8102e'}}, el('b', null, '⚠️ The new database rules aren’t published yet, so the database refuses every event. '), 'Firebase console → project arcade-14b1a → Firestore Database → Rules → paste everything from firestore.rules (GitHub repo) → Publish. Then reopen this panel (F9).'));
    if (!adminReady()) card.append(el('div', {cls:'wlx-warn'}, m && m.email == ADMIN && !m.google ? 'You’re logged in as '+ADMIN+' with a password. Events need the Google account: log out, then use “Continue with Google” as '+ADMIN+'.' : 'Log in with Google as '+ADMIN+' (Menu → Account) to run events. The database only accepts events from that account.'));
    onlineBox = el('div'); runBox = el('div'); card.append(el('div', {cls:'wlx-sec'}, 'ONLINE NOW'), onlineBox);
    const durIn = el('input', {type:'range', min:1, max:30, value:dur}), durL = el('b', null, dur+' min'); durIn.oninput = () => { dur = +durIn.value; durL.textContent = dur+' min'; };
    const cd = el('input', {type:'checkbox'}); cd.checked = countdown; cd.onchange = () => { countdown = cd.checked; };
    const sch = el('input', {type:'datetime-local', value:schedAt}); sch.onchange = () => { schedAt = sch.value; render(); };
    card.append(el('div', {cls:'wlx-sec'}, 'HOW LONG · WHEN'), el('div', {cls:'wlx-row'}, '⏱ Duration', durIn, durL, el('label', {cls:'wlx-pill'}, cd, '📢 60-second countdown first'), el('span', {cls:'wlx-pill'}, '📅 Schedule for later:', sch, schedAt ? el('button', {cls:'wlx-btn alt', onclick:() => { schedAt = ''; render(); }}, 'Clear') : null)),
      el('div', null, schedAt ? el('div', {style:{fontSize:'12px', color:'#c8102e', fontWeight:700, marginTop:'4px'}}, 'Buttons now SCHEDULE events for '+new Date(schedAt).toLocaleString()+' (they also show on the Calendar).') : null));
    card.append(el('div', {cls:'wlx-sec'}, '🎁 GENEROUS EVENTS · rain rewards on everyone'), el('div', {cls:'wlx-grid'}, ['storm', 'mult', 'golden', 'gems', 'gift', 'petparty', 'rebirth', 'code'].map(tile)),
      el('div', {cls:'wlx-sec'}, '🌀 CHAOS EVENTS · harmless, temporary, cosmetic'), el('div', {cls:'wlx-row', style:{marginBottom:'8px'}}, el('button', {cls:'wlx-btn red', disabled:!adminReady() || null, onclick:() => { (chaosTimer ? (chaosStop(), Promise.resolve(addLog('🌪 chaos mode stopped'))) : chaosStart()).then(render); }}, chaosTimer ? '🌪 Stop Chaos Mode ('+mmss(chaosUntil - now())+')' : '🌪 CHAOS MODE · random events for 5 minutes'), el('span', {style:{fontSize:'12px', color:'#4a4a4a'}}, 'Keeps going while this page stays open.')),
      el('div', {cls:'wlx-grid'}, CHAOS.map(tile)),
      el('div', {cls:'wlx-sec'}, '👹 BOSS EVENTS · everyone teams up'), el('div', {cls:'wlx-grid'}, ['boss', 'avs', 'tourney'].map(tile)));
    const at = el('input', {type:'text', placeholder:'Announcement (shown on every screen)', maxlength:140, style:{flex:1, minWidth:'200px'}}), ae = el('input', {type:'text', value:'📣', maxlength:4, style:{width:'50px'}}),
      ac = el('select', null, [['#015640', 'Green'], ['#c8102e', 'Red'], ['#2f5fd0', 'Blue'], ['#a64be0', 'Purple'], ['#e07a00', 'Orange'], ['#121313', 'Black']].map(([v, n]) => el('option', {value:v}, n)));
    at.onkeydown = e2 => { e2.stopPropagation(); if (e2.key == 'Enter') send(); };
    const send = () => { if (!at.value.trim()) return; announce(at.value.trim(), ae.value, ac.value, dur).then(() => { at.value = ''; render(); }).catch(err); };
    card.append(el('div', {cls:'wlx-sec'}, '📣 ANNOUNCEMENT'), el('div', {cls:'wlx-row'}, ae, at, ac, el('button', {cls:'wlx-btn', disabled:!adminReady() || null, onclick:send}, 'Announce for '+dur+' min'), S.ann && S.ann.t1 > now() ? el('button', {cls:'wlx-btn alt', onclick:() => mutate(d => { d.ann = null; }).then(render).catch(err)}, 'Clear announcement') : null));
    const a = S.admin || {}, tg = (key, label) => { const c = el('input', {type:'checkbox'}); c.checked = a[key] !== false; c.onchange = () => setAdmin({[key]:c.checked}).then(() => addLog(label+(c.checked ? ' ON' : ' OFF'))).catch(err); return el('label', {cls:'wlx-pill'}, c, label); };
    card.append(el('div', {cls:'wlx-sec'}, '✨ SHOWMANSHIP'), el('div', {cls:'wlx-row'}, tg('crown', '👑 Entrance banner + crown'), tg('plate', '🏷 ADMIN nameplate on leaderboards'), el('button', {cls:'wlx-btn alt', disabled:!adminReady() || null, onclick:() => setAdmin({in:now(), name:api.uname() || 'jonah', av:api.myAv()}).then(() => addLog('👑 entrance banner sent')).catch(err)}, '👑 Announce my entrance')));
    card.append(el('div', {cls:'wlx-sec'}, 'RUNNING & UPCOMING'), runBox, el('div', {cls:'wlx-row', style:{marginTop:'8px'}}, el('button', {cls:'wlx-btn red', disabled:!adminReady() || null, onclick:() => endAll().then(render).catch(err)}, '⛔ End all events'), el('button', {cls:'wlx-btn alt', onclick:() => L.history()}, '📜 Event history')));
    logBox = el('div', {cls:'wlx-log'}); card.append(el('div', {cls:'wlx-sec'}, 'LOG'), logBox); renderLog(); renderRun(); renderOnline(); };
  const renderLog = () => { if (logBox) logBox.textContent = log.length ? log.join('\n') : 'Nothing yet. Every event you trigger shows up here and in Event history.'; };
  const renderRun = () => { if (!runBox) return; const rows = S.list.filter(e => e.t1 > now()).sort((a, b) => a.t0 - b.t0); runBox.innerHTML = '';
    runBox.append(rows.length ? el('div', {cls:'wlx-list'}, rows.map(e => { const P = plays[e.id]; return el('div', {cls:'it'}, el('span', {style:{fontSize:'20px'}}, evIcon(e)), el('div', {style:{flex:1}}, el('b', null, evName(e)), ' ', e.k == 'code' ? el('span', {cls:'wlx-pill'}, 'code '+(e.o||{}).code) : null, (e.k == 'boss' || e.k == 'avs') && P ? el('span', {cls:'wlx-pill'}, fmt(total(e))+' / '+fmt(bossHp(e))+' HP done') : null, e.k == 'tourney' && P ? el('span', {cls:'wlx-pill'}, ranks(e).length+' players') : null),
      el('span', {style:{fontSize:'12px', fontWeight:700}}, e.t0 > now() ? 'starts in '+mmss(e.t0 - now()) : mmss(e.t1 - now())+' left'), el('button', {cls:'wlx-btn red', style:{padding:'5px 10px'}, onclick:() => endEv(e.id).then(render).catch(err)}, 'End')); })) : el('div', {style:{fontSize:'13px', color:'#4a4a4a'}}, 'No events running.')); };
  const renderOnline = () => { if (!onlineBox) return; onlineBox.innerHTML = ''; if (!onlineRows) { onlineBox.textContent = !adminReady() ? 'Log in with Google to see who’s online.' : rulesOff ? 'Can’t check yet: publish the new database rules first.' : 'Checking…'; return; }
    const G = id => id ? gameTitle(id) : 'arcade floor'; onlineBox.append(el('div', {style:{fontWeight:900, fontSize:'15px'}}, '🟢 '+onlineRows.length+' signed-in player'+(onlineRows.length == 1 ? '' : 's')+' online'), el('div', null, onlineRows.map(r => el('span', {cls:'wlx-pill'}, (r.u || 'player')+' · '+G(r.g)))), el('div', {style:{fontSize:'11px', color:'#4a4a4a'}}, 'Players who aren’t logged in still see every event, they just don’t show up in this list.')); };
  let rulesOff = false;
  const pollOnline = async () => { if (!adminReady()) return; onlineAt = Date.now(); try { onlineRows = await ev().online(); rulesOff = false; } catch(x) { onlineRows = null; if (String(x && (x.code || x.message)).includes('permission')) { if (!rulesOff) { rulesOff = true; render(); } } else err(x); } renderOnline(); };
  const iv = setInterval(() => { renderRun(); if (Date.now() - onlineAt > 20000) pollOnline(); }, 1000);
  pnl = {render, renderLog}; render(); pollOnline(); setTimeout(() => { if (pnl) document.addEventListener('keydown', kd, true); }, 0); o.onclick = e2 => { if (e2.target === o) close(); }; document.body.appendChild(o);
  if (adminReady() && !(S.admin && S.admin.name)) setAdmin({name:api.uname() || 'jonah', av:api.myAv()}).catch(() => {}); };
// when the admin opens the arcade, say hello (once every 10 minutes at most)
L.adminHello = () => { if (!adminReady() || !api) return; const a = S.admin || {}; if (now() - (a.in || 0) < 10*60000) return; setAdmin({in:now(), name:api.uname() || 'jonah', av:api.myAv()}).catch(() => {}); };
})();
