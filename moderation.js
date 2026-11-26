// Wilderland Arcade · MODERATION (admin only): reported chat messages, flagged scores, muted players, chat on/off,
// and resetting a player's leaderboard entry. Every button here is enforced by the Firestore rules: they only work for
// jonah@wilderland.academy signed in with Google, even if someone opened this page by editing the arcade.
(function(){
'use strict';
const M = {}; window.WLMod = M;
const el = (tag, at, ...kids) => { const n = document.createElement(tag); at = at || {}; Object.keys(at).forEach(k => { const v = at[k]; if (v == null || v === false) return; if (k == 'style' && typeof v == 'object') Object.assign(n.style, v); else if (k == 'cls') n.className = v; else if (k.slice(0,2) == 'on') n[k] = v; else n.setAttribute(k, v); });
  kids.flat().forEach(c => { if (c == null || c === false) return; n.appendChild(typeof c == 'object' ? c : document.createTextNode(String(c))); }); return n; };
const fmt = n => window.WLP && window.WLP.fmt ? window.WLP.fmt(n) : String(n);
const when = ms => ms ? new Date(ms).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}) : '';
let getApi = null, open = null;
M.attach = g => { getApi = g; window.addEventListener('keydown', e => { if (e.key == 'F8' && window.WLLive && window.WLLive.isAdmin()) { e.preventDefault(); M.open(getApi()); } }, true); };
const css = () => { if (document.getElementById('wlm-css')) return; const s = el('style', {id:'wlm-css'}); s.textContent = `
.wlm-ov{position:fixed;inset:0;z-index:9700;background:rgba(1,30,22,.86);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;font-family:"Uncut Sans","Inter",system-ui,sans-serif}
.wlm-ov *{box-sizing:border-box}
.wlm-card{background:#fff;border-radius:20px;padding:18px;max-width:860px;width:100%;max-height:94vh;overflow-y:auto;color:#121313;box-shadow:0 0 0 4px #F9BF01,0 20px 60px rgba(0,0,0,.4)}
.wlm-h1{font-weight:900;font-size:24px;color:#015640;margin:0}
.wlm-sec{font-weight:900;font-size:13px;letter-spacing:.08em;color:#4a4a4a;margin:16px 0 6px}
.wlm-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #eee8d4;font-size:13px}
.wlm-btn{border:none;border-radius:999px;padding:6px 12px;font:800 12px inherit;font-family:inherit;cursor:pointer;background:#015640;color:#fff}
.wlm-btn.red{background:#c8102e}.wlm-btn.alt{background:#D5F367;color:#015640}.wlm-btn.dark{background:#121313}
.wlm-x{margin-left:auto;border:none;background:#eee8d4;border-radius:999px;width:34px;height:34px;cursor:pointer;font-size:15px}
.wlm-msg{flex:1;min-width:180px;background:#f6f3e6;border-radius:10px;padding:6px 9px;overflow-wrap:anywhere}
.wlm-note{font-size:12px;color:#4a4a4a}
.wlm-card input{font:700 13px inherit;font-family:inherit;padding:7px 10px;border:2px solid #d9d3bd;border-radius:10px}
.wlm-log{font:600 12px ui-monospace,Menlo,monospace;color:#015640;min-height:16px;margin-top:6px}
`; document.head.appendChild(s); };
M.open = api => { const C = window.WLCloud; if (!C || !C.mod) { api && api.toast('MODERATION NEEDS THE ONLINE ARCADE'); return; } if (open) return; css();
  const o = el('div', {cls:'wlm-ov'}), card = el('div', {cls:'wlm-card'}); o.appendChild(card);
  let reports = null, flags = null, offR = null, offF = null, msg = '';
  const close = () => { o.remove(); open = null; offR && offR(); offF && offF(); document.removeEventListener('keydown', kd, true); };
  const kd = e => { if (e.key == 'Escape' || e.key == 'F8') { e.preventDefault(); e.stopPropagation(); close(); } else e.stopPropagation(); };
  const act = async (label, fn) => { msg = '…'; render(); try { const r = await fn(); msg = '✓ ' + label + (typeof r == 'number' ? ' (' + r + ')' : ''); } catch (e) { msg = '✖ ' + (String(e && (e.code || e.message)).includes('permission') ? 'Refused by the database rules: log in with Google as jonah@wilderland.academy.' : (e && (e.code || e.message))); } render(); };
  const mutes = () => C.mutes ? C.mutes() : [];
  const setMute = (uid, on) => { const s = new Set(mutes()); if (on) s.add(uid); else s.delete(uid); return C.setMutes([...s]); };
  const render = () => { card.innerHTML = ''; const off = C.chatOff && C.chatOff();
    card.append(el('div', {style:{display:'flex', alignItems:'center', gap:'8px'}}, el('div', {cls:'wlm-h1'}, '🛡️ Moderation'), el('button', {cls:'wlm-x', onclick:close}, '✕')),
      el('div', {cls:'wlm-note'}, 'Reported messages, flagged scores and muted players. These actions only work for the admin’s Google account (the database checks it).'),
      el('div', {cls:'wlm-log'}, msg));
    // chat switch
    card.append(el('div', {cls:'wlm-sec'}, '💬 CHAT'), el('div', {cls:'wlm-row'}, el('b', null, off ? '🔴 Chat is OFF for everyone' : '🟢 Chat is ON'),
      el('button', {cls:'wlm-btn ' + (off ? '' : 'red'), onclick:() => act(off ? 'Chat turned on' : 'Chat turned off', () => C.setChatOff(!off))}, off ? 'Turn chat on' : 'Turn chat off for everyone'),
      el('button', {cls:'wlm-btn dark', onclick:() => { if (confirmArm('clear')) act('Messages cleared', () => C.mod.clearChat()); else render(); }}, armed == 'clear' ? 'Tap again to clear ALL chat' : 'Clear all chat messages')));
    // reports
    card.append(el('div', {cls:'wlm-sec'}, '⚑ REPORTED MESSAGES' + (reports ? ' (' + reports.length + ')' : '')));
    if (!reports) card.append(el('div', {cls:'wlm-note'}, 'Loading…'));
    else if (!reports.length) card.append(el('div', {cls:'wlm-note'}, 'Nothing reported. 🎉'));
    else reports.forEach(r => card.append(el('div', {cls:'wlm-row'}, el('div', {cls:'wlm-msg'}, el('b', null, r.u || '?'), ': ', r.t, el('div', {cls:'wlm-note'}, 'reported by ' + (r.byU || 'a player') + ' · ' + when(r.at))),
      el('button', {cls:'wlm-btn red', onclick:() => act('Message deleted', async () => { if (r.mid) await C.chatDelete(r.mid); await C.mod.clearReport(r.id); })}, 'Delete message'),
      r.uid ? el('button', {cls:'wlm-btn dark', onclick:() => act(mutes().includes(r.uid) ? 'Unmuted ' + r.u : 'Muted ' + r.u, () => setMute(r.uid, !mutes().includes(r.uid)))}, mutes().includes(r.uid) ? 'Unmute ' + (r.u || '') : 'Mute ' + (r.u || '')) : null,
      el('button', {cls:'wlm-btn alt', onclick:() => act('Report dismissed', () => C.mod.clearReport(r.id))}, 'Dismiss'))));
    // flagged scores
    card.append(el('div', {cls:'wlm-sec'}, '🚩 FLAGGED SCORES (too high to be real, kept off the leaderboard)' + (flags ? ' (' + flags.length + ')' : '')));
    if (!flags) card.append(el('div', {cls:'wlm-note'}, 'Loading…'));
    else if (!flags.length) card.append(el('div', {cls:'wlm-note'}, 'No impossible scores. 🎉'));
    else flags.forEach(f => card.append(el('div', {cls:'wlm-row'}, el('div', {cls:'wlm-msg'}, el('b', null, f.u || '?'), ' · ', f.g, ' · ', el('b', null, fmt(f.s)), el('div', {cls:'wlm-note'}, when(f.at))),
      el('button', {cls:'wlm-btn red', onclick:() => act('Leaderboard entry reset for ' + (f.u || 'player'), async () => { const n = await C.mod.resetPlayer(f.uid, api.games()); await C.mod.clearFlag(f.id); api.refresh(); return n; })}, 'Reset their leaderboard entry'),
      el('button', {cls:'wlm-btn alt', onclick:() => act('Flag dismissed', () => C.mod.clearFlag(f.id))}, 'Dismiss'))));
    // muted players
    const mu = mutes(); card.append(el('div', {cls:'wlm-sec'}, '🔇 MUTED PLAYERS (' + mu.length + ')'));
    if (!mu.length) card.append(el('div', {cls:'wlm-note'}, 'Nobody is muted. Mute someone from a report or from the chat window.'));
    mu.forEach(uid => card.append(el('div', {cls:'wlm-row'}, el('div', {cls:'wlm-msg'}, names[uid] || uid), el('button', {cls:'wlm-btn', onclick:() => act('Unmuted', () => setMute(uid, false))}, 'Unmute'))));
    // reset by name
    const inp = el('input', {placeholder:'username', maxlength:16}); inp.onkeydown = e => e.stopPropagation();
    card.append(el('div', {cls:'wlm-sec'}, '🧹 RESET A PLAYER’S LEADERBOARD ENTRY'), el('div', {cls:'wlm-row'}, inp, el('button', {cls:'wlm-btn red', onclick:() => act('Leaderboard entry reset', async () => { const pl = await C.mod.findPlayer(inp.value.trim()); if (!pl) throw new Error('No player called “' + inp.value.trim() + '”'); const n = await C.mod.resetPlayer(pl.uid, api.games()); api.refresh(); return n; })}, 'Remove their scores')),
      el('div', {cls:'wlm-note'}, 'Removes their scores from every game’s leaderboard this season and zeroes their overall ticket row. Their own save (tickets, prizes, pets) is NOT touched.')); };
  let armed = '', armT = 0; const confirmArm = k => { if (armed == k && Date.now() - armT < 4000) { armed = ''; return true; } armed = k; armT = Date.now(); return false; };
  const names = {}; const remember = list => (list || []).forEach(x => { if (x.uid && x.u) names[x.uid] = x.u; });
  offR = C.mod.reports((list, e) => { reports = list || []; remember(list); if (e) msg = '✖ Can’t read reports: ' + (e.code || e.message); render(); });
  offF = C.mod.flags((list, e) => { flags = list || []; remember(list); if (e) msg = '✖ Can’t read flags: ' + (e.code || e.message); render(); });
  open = {close}; render(); setTimeout(() => document.addEventListener('keydown', kd, true), 0); o.onclick = e => { if (e.target === o) close(); }; document.body.appendChild(o); };
})();
