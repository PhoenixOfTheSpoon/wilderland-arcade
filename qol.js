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
const WN = {v:'2026-12-11', items:[
  ['⚪', 'Way faster snowballs', 'Snowballs come back much faster: new Snow Factory skill, Snow Well room, Bottomless Mitten and Snow Globe Charm in the village shop, a Snow Machine upgrade that refills you anywhere, Fast Scoop up to level 10, knockouts hand snowballs back, and a ×3 refill when you pause throwing.'],
  ['⚒️', 'Forge gear', 'Forge any gear piece you want in Snowball → Loadout, or at your Ice Fort (the Forge is now the first row and builds itself with one tap). Fuse 3 spare pieces into 1 rarer one.'],
  ['📗', 'Snow Kingdom side stories', 'Ten new side quests after Loki and Spirits of the Snow: The Great Snack Heist, Trials of the Royal Guard, Loki’s Lost Ball, Bau Bau’s Memories, The Cat Nobody Knew, Teammate Tales and The Frozen Bard. Look for the purple ! and open your journal with J.'],
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
      api.saves ? row('💾', 'Your save', 'Export a backup, import one, or go back to an earlier save', el('button', {cls:'wlq-btn sm', onclick:() => { close(); Q.savePanel(api.saves); }}, 'Open')) : null,
      row('🆕', 'What’s new', 'The latest update', el('button', {cls:'wlq-btn sm alt', onclick:() => { close(); Q.whatsNew(true); }}, 'Show'))); };
  render(); o.onclick = e => { if (e.target === o) close(); }; document.addEventListener('keydown', kd, true); document.body.appendChild(o); };

// ---------------- Save safety net: Export / Import / Restore previous save ----------------
Q.savePanel = S => { css(); const o = el('div', {cls:'wlq-ov'}), card = el('div', {cls:'wlq-card', style:{textAlign:'left'}}); o.appendChild(card);
  const close = () => { o.remove(); document.removeEventListener('keydown', kd, true); }, kd = e => { if (e.key == 'Escape') { e.stopPropagation(); close(); } else e.stopPropagation(); };
  let msg = '', snaps = null, armed = -1, code = '';
  const when = t => new Date(t).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
  const fmt = n => window.WLP && window.WLP.fmt ? window.WLP.fmt(n) : String(n);
  const download = async (name, text) => { try { const cl = window.claude && window.claude.use ? await Promise.race([window.claude.use('downloads'), new Promise(r => setTimeout(() => r(null), 1500))]) : null;
      if (cl && cl.save) { await cl.save({filename:name, data:text}); return true; } } catch(e){}
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:'application/json'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); return true; } catch(e){ return false; } };
  const render = () => { card.innerHTML = '';
    const sec = t => el('div', {style:{fontWeight:900, fontSize:'13px', letterSpacing:'.06em', color:'#4a4a4a', margin:'14px 0 6px'}}, t);
    card.append(el('div', {style:{display:'flex', alignItems:'center', gap:'8px'}}, el('div', {cls:'wlq-h1', style:{margin:0}}, '💾 Your save'), el('button', {cls:'wlq-x', onclick:close}, '✕')),
      el('div', {cls:'wlq-sub'}, 'Everything you’ve earned: tickets, prizes, pets, homes, stars, rebirths, game progress and settings.'),
      msg ? el('div', {style:{fontWeight:800, color:'#015640', background:'#eaf7d0', borderRadius:'10px', padding:'8px 10px', margin:'6px 0'}}, msg) : null);
    // export
    card.append(sec('⬇️ EXPORT A BACKUP'), el('div', {style:{display:'flex', gap:'8px', flexWrap:'wrap'}},
      el('button', {cls:'wlq-btn sm', onclick:async () => { const ok = await download('wilderland-save-' + S.user().replace(/[^a-z0-9_-]/gi, '') + '-' + new Date().toISOString().slice(0, 10) + '.json', S.exp()); msg = ok ? '✓ Save file downloaded. Keep it somewhere safe.' : 'Download was blocked here. Use “Copy save code” instead.'; render(); }}, 'Download save file'),
      el('button', {cls:'wlq-btn sm alt', onclick:async () => { const t = 'WL1:' + btoa(unescape(encodeURIComponent(S.exp()))); let ok = false; try { await navigator.clipboard.writeText(t); ok = true; } catch(e){} code = t; msg = ok ? '✓ Save code copied. Paste it into a note or email to yourself.' : 'Copy the code in the box below.'; render(); }}, 'Copy save code')));
    if (code) { const ta = el('textarea', {readonly:true, style:{width:'100%', height:'64px', fontSize:'11px', fontFamily:'ui-monospace,monospace', marginTop:'6px', borderRadius:'8px', border:'2px solid #d9d3bd', padding:'6px'}}); ta.value = code; card.append(ta); setTimeout(() => ta.select(), 0); }
    // import
    const fi = el('input', {type:'file', accept:'.json,.txt,application/json,text/plain', style:{display:'none'}}), paste = el('textarea', {placeholder:'…or paste a save code here', style:{width:'100%', height:'54px', fontSize:'12px', borderRadius:'8px', border:'2px solid #d9d3bd', padding:'6px', marginTop:'6px'}});
    const doImp = async t => { msg = '…'; render(); const e = await S.imp(t); msg = e ? '✖ ' + e : '✓ Save imported. Your old save is kept below under “Restore”, just in case.'; snaps = null; load(); };
    fi.onchange = () => { const f = fi.files && fi.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => doImp(r.result); r.readAsText(f); };
    card.append(sec('⬆️ IMPORT A BACKUP'), el('div', {style:{fontSize:'12px', color:'#4a4a4a'}}, 'Replaces this save with the backup. Your current save is backed up first, so you can always come back to it.'),
      el('div', {style:{display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'6px'}}, el('button', {cls:'wlq-btn sm', onclick:() => fi.click()}, 'Choose save file'), fi), paste,
      el('button', {cls:'wlq-btn sm alt', style:{marginTop:'6px'}, onclick:() => { if (paste.value.trim()) doImp(paste.value); }}, 'Import pasted code'));
    // restore
    card.append(sec('⏪ RESTORE A PREVIOUS SAVE'), el('div', {style:{fontSize:'12px', color:'#4a4a4a'}}, 'Copies kept on this device: when you open the arcade (every few hours), before every save update, and before an import or restore.'));
    if (!snaps) card.append(el('div', {cls:'wlq-sub'}, 'Loading…'));
    else if (!snaps.length) card.append(el('div', {cls:'wlq-sub'}, 'No earlier saves on this device yet.'));
    else snaps.forEach(x => card.append(el('div', {cls:'wlq-row'}, el('div', {style:{flex:1, minWidth:0}}, el('b', null, when(x.at)), el('div', {style:{fontSize:'12px', color:'#4a4a4a'}}, 'Saved ' + x.reason + ' · 🎟 ' + fmt(x.tix) + (x.rb ? ' · ' + x.rb + ' rebirths' : ''))),
      x.ok ? el('button', {cls:'wlq-btn sm' + (armed == x.i ? '' : ' alt'), onclick:async () => { if (armed != x.i) { armed = x.i; render(); return; } armed = -1; msg = '…'; render(); const e = await S.restore(x.i); msg = e ? '✖ ' + e : '✓ Restored. The save you had a moment ago is now at the top of this list.'; snaps = null; load(); }}, armed == x.i ? 'Tap again to restore' : 'Restore')
        : el('div', {style:{fontSize:'11px', color:'#8a8a8a'}}, 'before a reset'))));
  };
  const load = () => S.list().then(l => { snaps = l; render(); }).catch(() => { snaps = []; render(); });
  render(); load(); o.onclick = e => { if (e.target === o) close(); }; document.addEventListener('keydown', kd, true); document.body.appendChild(o); };

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
