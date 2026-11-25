// Wilderland Arcade · QUALITY OF LIFE — the Settings panel (number format, animations, sound and music volume),
// the "What's new" screen after each update, and the 5-second Undo for the last purchase.
(function(){
'use strict';
const Q = {};
const LS = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch(e) { return d; } };
const LSset = (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} };
const el = (tag, at, ...kids) => { const n = document.createElement(tag); at = at || {}; Object.keys(at).forEach(k => { const v = at[k]; if (v == null || v === false) return; if (k == 'style' && typeof v == 'object') Object.assign(n.style, v); else if (k == 'cls') n.className = v; else if (k.slice(0,2) == 'on') n[k] = v; else n.setAttribute(k, v); });
  kids.flat().forEach(c => { if (c == null || c === false) return; n.appendChild(typeof c == 'object' ? c : document.createTextNode(String(c))); }); return n; };

// ---------------- What's new ----------------
const WN = {v:'2026-12-09', items:[
  ['👑', 'Admin events', 'Live events for everyone online at once: Ticket Storms, Multiplier Madness, Gift Drops, World Bosses you hit by playing any game, Flash Tournaments, disco, frogs and more. See them in Menu → Admin events. Calm visuals: Menu → Settings.'],
  ['❄️', 'Snow Kingdom: raids & sieges', 'Five raid dungeons with rune puzzles, guardians and big bosses (Empowered Loki is in the Sunken Library) that reset every week with new modifiers. Defend Frostpine Village from catapults, rams and giant snowmen alongside Royal Guard Mau Mau.'],
  ['🏰', 'Your Ice Fort', 'Grow your base from Snow Camp to Crystal Castle and build rooms that boost you everywhere. Plus kingdom levels with a skill tree (K), mounts (V), a dodge-roll (Shift), team combos and % explored per land on the map.'],
  ['🛣️', 'Rebirth Road', 'Tap the ⭐ NEXT REBIRTH bar (or press R) to see every rebirth milestone and its rewards. Players who already rebirthed got every reward they passed.'],
  ['🎧', 'Music Player', '9 new original songs unlock along the Rebirth Road. From Rebirth 10: pick any song, shuffle, repeat and make playlists. Every song shows its credit.'],
  ['🌈', 'Wilderland Wonders', '44 new Golden-Star prizes with permanent bonuses, 5 upgrade levels each, themed sets and a ×10 bonus for the whole Wilderland Collection.'],
  ['💠', 'Founder rarity', 'Every founding player gets the Founder’s Pin. Five more Founder prizes unlock when you own every Wonder.'],
  ['⚡', 'Faster rebirths', 'Starting tickets, Quick Start Workshop levels, kept expansions and Workshop auto-buy, plus a rebirth summary and a Fastest Rebirth leaderboard.'],
  ['⛏️', 'Deep Mines', 'No level cap, hires come in at your full upgrade level, merging always makes a stronger miner, and Best keeps counting past 100M.'],
  ['🛒', 'Easier shopping', 'Buy all affordable, ✓ on things you can afford, next-level costs, Claim all for challenges, search in achievements and the Trophy Room, and Undo for 5 seconds after a purchase.'],
  ['⚙️', 'Settings & hotkeys', 'Menu → Settings: number format, animation level, sound and music volume. Press ? on the arcade floor for every hotkey.'],
]};
Q.WN = WN;
Q.whatsNew = force => { if (!force && LS('wl-wn', '') == WN.v) return false; LSset('wl-wn', WN.v); css();
  const o = el('div', {cls:'wlq-ov'}), close = () => { o.remove(); document.removeEventListener('keydown', kd, true); }, kd = e => { if (e.key == 'Escape') { e.stopPropagation(); close(); } };
  o.appendChild(el('div', {cls:'wlq-card'}, el('div', {style:{fontSize:'40px'}}, '🆕'), el('div', {cls:'wlq-h1'}, 'What’s new'), el('div', {cls:'wlq-sub'}, 'Update '+WN.v),
    el('div', {cls:'wlq-list'}, WN.items.map(([e, n, d]) => el('div', {cls:'wlq-item'}, el('div', {style:{fontSize:'26px'}}, e), el('div', null, el('b', null, n), el('div', {style:{fontSize:'13px', color:'#3d3d3d'}}, d))))),
    el('button', {cls:'wlq-btn', onclick:close}, 'Let’s play!')));
  o.onclick = e => { if (e.target === o) close(); }; document.addEventListener('keydown', kd, true); document.body.appendChild(o); return true; };

// ---------------- Undo (5 seconds) ----------------
let pill = null, undoT = null;
Q.mark = (api, prev, label, refund) => { css(); if (undoT) clearInterval(undoT); if (pill) pill.remove();
  const until = Date.now() + 5000; pill = el('button', {cls:'wlq-undo', title:'Undo your last purchase', onclick:() => { if (Date.now() > until) return; const P = api.P(); api.setP({...prev, tickets:(P.tickets||0) + (refund||0)}); api.toast('UNDONE · '+String(label).toUpperCase()+(refund ? ' · TICKETS BACK' : '')); api.sfx && api.sfx('blip'); kill(); }});
  const kill = () => { if (undoT) clearInterval(undoT); undoT = null; if (pill) pill.remove(); pill = null; };
  const tick = () => { const s = Math.ceil((until - Date.now())/1000); if (s <= 0) { kill(); return; } if (pill) pill.textContent = '↩ Undo “'+String(label).slice(0, 40)+'” · '+s; };
  tick(); undoT = setInterval(tick, 250); document.body.appendChild(pill); };

// ---------------- Number format ----------------
Q.sci = () => LS('wl-numfmt', 'short') == 'sci';

// ---------------- Settings panel ----------------
Q.settings = api => { css(); const o = el('div', {cls:'wlq-ov'}), close = () => { o.remove(); document.removeEventListener('keydown', kd, true); }, kd = e => { if (e.key == 'Escape') { e.stopPropagation(); close(); } };
  const card = el('div', {cls:'wlq-card', style:{textAlign:'left'}}); o.appendChild(card);
  const render = () => { card.innerHTML = ''; const A = window.Arcade || {}, M = window.WLMusic, anim = api.anim ? api.anim() : 'full';
    const seg = (cur, opts, fn) => el('div', {cls:'wlq-seg'}, opts.map(([k, n]) => el('button', {cls:cur == k ? 'on' : '', onclick:() => { fn(k); render(); }}, n)));
    const slider = (val, fn) => { const r = el('input', {type:'range', min:0, max:100, value:Math.round(val*100)}); r.oninput = () => fn(r.value/100); return r; };
    const row = (e, n, d, ctl) => el('div', {cls:'wlq-row'}, el('div', {style:{fontSize:'24px', width:'32px', textAlign:'center'}}, e), el('div', {style:{flex:1, minWidth:0}}, el('b', null, n), d ? el('div', {style:{fontSize:'12px', color:'#4a4a4a'}}, d) : null), ctl);
    card.append(el('div', {style:{display:'flex', alignItems:'center', gap:'8px'}}, el('div', {cls:'wlq-h1', style:{margin:0}}, '⚙️ Settings'), el('button', {cls:'wlq-x', onclick:close}, '✕')),
      row('🔢', 'Number format', 'How big numbers are written everywhere', seg(Q.sci() ? 'sci' : 'short', [['short', '1.5M · 2.3Qa'], ['sci', '1.5e6 · 2.3e15']], k => { LSset('wl-numfmt', k); api.refresh && api.refresh(); })),
      row('🎬', 'Animations', 'Reduced or Off helps slower computers (same as Performance mode)', seg(anim, [['full', 'Full'], ['reduced', 'Reduced'], ['off', 'Off']], k => api.setAnim && api.setAnim(k))),
      row('🔊', 'Sound effects', A.muted ? 'Sound is muted' : Math.round((A.sfxVol == null ? 1 : A.sfxVol)*100)+'%', slider(A.sfxVol == null ? 1 : A.sfxVol, v => { A.sfxVol = v; LSset('wl-sfx-vol', v); if (A.tone && v > 0) A.tone(880, .05, 'square', .05); })),
      row('🎵', 'Music volume', M && M.on && !M.on() ? 'Music is off (turn it on in the Music Player or with M)' : '', slider(M && M.volume ? M.volume() : 1, v => M && M.setVolume && M.setVolume(v))),
      row('🎧', 'Music Player & playlists', 'Every song, its credit, shuffle and playlists', el('button', {cls:'wlq-btn sm', onclick:() => { close(); window.WLR && window.WLR.open('music'); }}, 'Open')),
      row('👑', 'Admin event effects', 'Calm keeps every event reward but skips the big visuals (flips, disco, snow, stampedes)', seg(window.WLLive ? window.WLLive.fxMode() : 'full', [['full', 'Full'], ['calm', 'Calm']], k => window.WLLive && window.WLLive.setFx(k))),
      row('🔔', 'Notifications', 'Pop-up messages while you play', el('button', {cls:'wlq-btn sm alt', onclick:() => { api.toggleNotif && api.toggleNotif(); render(); }}, (api.notif ? api.notif() : 'all').toUpperCase())),
      row('⌨️', 'Hotkeys', 'Y full screen · M music · R Rebirth Road · U Workshop · P Prize Counter · ? help', el('button', {cls:'wlq-btn sm alt', onclick:() => { close(); api.keys && api.keys(); }}, 'Show')),
      row('🆕', 'What’s new', 'The latest update', el('button', {cls:'wlq-btn sm alt', onclick:() => { close(); Q.whatsNew(true); }}, 'Show'))); };
  render(); o.onclick = e => { if (e.target === o) close(); }; document.addEventListener('keydown', kd, true); document.body.appendChild(o); };

// ---------------- styles ----------------
let done = false;
const css = () => { if (done) return; done = true; const s = document.createElement('style'); s.textContent = `
.wlq-ov{position:fixed;inset:0;z-index:9650;background:rgba(1,30,22,.84);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;font-family:"Uncut Sans","Inter",system-ui,sans-serif}
.wlq-ov *{box-sizing:border-box}
.wlq-card{background:#fff;border-radius:20px;padding:20px;max-width:560px;width:100%;max-height:92vh;overflow-y:auto;text-align:center;box-shadow:0 0 0 4px #D5F367,0 20px 60px rgba(0,0,0,.4);color:#121313}
.wlq-h1{font-weight:800;font-size:26px;color:#015640;margin:4px 0}
.wlq-sub{font-size:12px;color:#4a4a4a;margin-bottom:10px}
.wlq-list{display:flex;flex-direction:column;gap:8px;text-align:left;margin-bottom:14px}
.wlq-item{display:flex;gap:10px;align-items:flex-start;background:#f6f3e6;border-radius:12px;padding:9px 11px}
.wlq-btn{border:none;border-radius:999px;padding:11px 24px;font:800 15px inherit;font-family:inherit;cursor:pointer;background:#015640;color:#fff}
.wlq-btn.sm{padding:7px 14px;font-size:13px}.wlq-btn.alt{background:#D5F367;color:#015640}
.wlq-x{margin-left:auto;border:none;background:#eee8d4;border-radius:999px;width:34px;height:34px;cursor:pointer;font-size:15px}
.wlq-row{display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #eee8d4;flex-wrap:wrap}
.wlq-row input[type=range]{width:160px}
.wlq-seg{display:flex;background:#eee8d4;border-radius:999px;padding:3px;gap:2px}
.wlq-seg button{border:none;background:transparent;border-radius:999px;padding:6px 10px;font:700 12px inherit;font-family:inherit;cursor:pointer;color:#015640}
.wlq-seg button.on{background:#015640;color:#fff}
.wlq-undo{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9800;border:2px solid #015640;background:#F9BF01;color:#121313;border-radius:999px;padding:10px 18px;font:800 14px "Uncut Sans",system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);max-width:92vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
html.wl-noanim *,html.wl-noanim *::before,html.wl-noanim *::after{animation:none!important;transition:none!important}
`; document.head.appendChild(s); };
// sound-effects volume (saved per device)
{ const v = parseFloat(LS('wl-sfx-vol', '')); if (window.Arcade && !isNaN(v)) window.Arcade.sfxVol = v; }
window.WLQ = Q;
})();
