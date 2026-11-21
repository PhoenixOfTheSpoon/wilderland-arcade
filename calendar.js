// Wilderland Calendar (window.WLC) — a separate view next to the arcade.
// Events come from calendar-events.json (same for every visitor, GitHub Pages friendly).
// Views: Month · Week · Day · Agenda (next 30 days). Repeating + multi-day events, filters, search, .ics download,
// a Today / Next-up card with countdown, print-friendly month, and an admin editor that downloads a new JSON file.
(function(){
'use strict';
const C = {};
const CATS = {
  classes:  {n:'Classes', e:'📚', c:'#2fa8e0'},
  trips:    {n:'Field Trips', e:'🚌', c:'#00B451'},
  holiday:  {n:'Holidays / No School', e:'🎉', c:'#FF4539'},
  deadline: {n:'Deadlines', e:'⏰', c:'#e0a100'},
  clubs:    {n:'Clubs', e:'🧩', c:'#a64be0'},
  arcade:   {n:'Arcade Events', e:'🕹️', c:'#EA55AB'},
  special:  {n:'Special Events', e:'⭐', c:'#FF8A3C'},
};
C.CATS = CATS;
const cat = k => CATS[k] || CATS.special;
// ---------------- dates (all local, "YYYY-MM-DD") ----------------
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m||1)-1, d||1); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate()+n); return ymd(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const todayS = () => ymd(new Date());
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const fmtTime = t => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return ((h+11)%12+1)+(m ? ':'+pad(m) : '')+(h < 12 ? ' am' : ' pm'); };
const nice = s => { const d = parse(s); return DOW[d.getDay()]+', '+MONTHS[d.getMonth()]+' '+d.getDate(); };
const mins = t => { const [h, m] = (t||'0:0').split(':').map(Number); return h*60 + (m||0); };

// ---------------- data ----------------
let LIVE = [], DRAFT = null, loaded = false, loadErr = '', listeners = [];
const norm = e => ({id: String(e.id || ('ev-'+Math.random().toString(36).slice(2,8))), title: String(e.title || 'Untitled event'), start: e.start || todayS(), end: e.end && e.end > e.start ? e.end : '',
  allDay: e.allDay !== false && !e.time ? true : !!e.allDay, time: e.time || '', endTime: e.endTime || '', location: e.location || '', description: e.description || '', category: CATS[e.category] ? e.category : 'special',
  link: e.link || '', repeat: e.repeat && e.repeat.freq ? {freq: e.repeat.freq, interval: Math.max(1, e.repeat.interval|0 || 1), until: e.repeat.until || '', days: Array.isArray(e.repeat.days) && e.repeat.days.length ? e.repeat.days.map(Number) : null} : null});
C.load = (force) => { if (loaded && !force) return Promise.resolve(LIVE);
  return fetch('calendar-events.json?v=' + Date.now(), {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(j => { const list = Array.isArray(j) ? j : (j.events || []); LIVE = list.map(norm); loaded = true; loadErr = ''; try { const d = JSON.parse(localStorage.getItem('wl-cal-draft')); if (Array.isArray(d)) DRAFT = d.map(norm); } catch(e){} listeners.forEach(f => f()); return LIVE; })
    .catch(e => { loaded = true; loadErr = 'Couldn’t load calendar-events.json ('+(e.message||e)+').'; listeners.forEach(f => f()); return LIVE; }); };
C.onChange = f => { listeners.push(f); return () => { listeners = listeners.filter(x => x !== f); }; };
let preview = false;
const events = () => (preview && DRAFT) ? DRAFT : LIVE;
C.events = () => LIVE.slice();

// Expand events into day-by-day occurrences between a and b (inclusive).
// Each occurrence: {ev, day, first, last, startDay, endDay} — multi-day events give one occurrence per covered day.
const occurrences = (list, a, b) => { const out = [];
  list.forEach(ev => { const span = ev.end ? diffDays(ev.start, ev.end) : 0; const starts = [];
    if (!ev.repeat) starts.push(ev.start);
    else { const R = ev.repeat, until = R.until && R.until < b ? R.until : b, lim = 4000; let n = 0;
      if (R.freq == 'daily') { let s = ev.start; if (s < a) { const k = Math.floor(diffDays(s, addDays(a, -span)) / R.interval); if (k > 0) s = addDays(s, k*R.interval); } for (; s <= until && n < lim; s = addDays(s, R.interval), n++) starts.push(s); }
      else if (R.freq == 'weekly') { const days = R.days || [parse(ev.start).getDay()]; let wk = parse(ev.start); wk.setDate(wk.getDate() - wk.getDay()); let w = ymd(wk);
        if (w < a) { const k = Math.floor(diffDays(w, addDays(a, -span-7)) / (7*R.interval)); if (k > 0) w = addDays(w, k*7*R.interval); }
        for (; w <= until && n < lim; w = addDays(w, 7*R.interval), n++) days.forEach(dw => { const s = addDays(w, dw); if (s >= ev.start && s <= until) starts.push(s); }); }
      else if (R.freq == 'monthly') { const d0 = parse(ev.start), dom = d0.getDate(); for (let i = 0; n < lim; i += R.interval, n++) { const d = new Date(d0.getFullYear(), d0.getMonth()+i, 1); const last = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); d.setDate(Math.min(dom, last)); const s = ymd(d); if (s > until) break; starts.push(s); } } }
    starts.forEach(s => { const e = addDays(s, span); if (e < a || s > b) return; for (let d = s > a ? s : a; d <= e && d <= b; d = addDays(d, 1)) out.push({ev, day:d, first: d == s, last: d == e, startDay:s, endDay:e, multi: span > 0}); }); });
  return out.sort((x, y) => x.day < y.day ? -1 : x.day > y.day ? 1 : (x.ev.allDay || x.multi ? 0 : 1) - (y.ev.allDay || y.multi ? 0 : 1) || mins(x.ev.time) - mins(y.ev.time)); };
C.occurrences = (a, b, list) => occurrences(list || LIVE, a, b);
// arcade tie-in: today's Arcade Events (display only)
C.arcadeToday = () => occurrences(LIVE, todayS(), todayS()).filter(o => o.ev.category == 'arcade').map(o => o.ev);

// ---------------- .ics ----------------
const icsEsc = s => String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const fold = line => { const out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); } out.push(line); return out.join('\r\n'); };
C.ics = (ev, occ) => { const day = (occ && !ev.repeat ? ev.start : ev.start).replace(/-/g,''), lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wilderland Academy//Calendar//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
    'UID:'+ev.id+'@wilderland.academy', 'DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'')];
  if (ev.allDay) { lines.push('DTSTART;VALUE=DATE:'+day, 'DTEND;VALUE=DATE:'+addDays(ev.end || ev.start, 1).replace(/-/g,'')); }
  else { const t = (ev.time||'09:00').replace(':','')+'00', et = (ev.endTime || ev.time || '10:00').replace(':','')+'00'; lines.push('DTSTART:'+day+'T'+t, 'DTEND:'+(ev.end || ev.start).replace(/-/g,'')+'T'+et); }
  if (ev.repeat) { const R = ev.repeat; let rr = 'RRULE:FREQ='+R.freq.toUpperCase()+(R.interval > 1 ? ';INTERVAL='+R.interval : ''); if (R.freq == 'weekly' && R.days) rr += ';BYDAY='+R.days.map(d => ['SU','MO','TU','WE','TH','FR','SA'][d]).join(','); if (R.until) rr += ';UNTIL='+R.until.replace(/-/g,'')+'T235959'; lines.push(rr); }
  lines.push('SUMMARY:'+icsEsc(ev.title)); if (ev.location) lines.push('LOCATION:'+icsEsc(ev.location)); if (ev.description || ev.link) lines.push('DESCRIPTION:'+icsEsc(ev.description + (ev.link ? '\n'+ev.link : ''))); if (ev.link) lines.push('URL:'+ev.link);
  lines.push('CATEGORIES:'+icsEsc(cat(ev.category).n), 'END:VEVENT', 'END:VCALENDAR'); return lines.map(fold).join('\r\n') + '\r\n'; };
const download = (name, text, type) => { const b = new Blob([text], {type}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); };

// ---------------- UI ----------------
const css = `
.wlc{font-family:"Uncut Sans","Inter",system-ui,sans-serif;color:#121313;max-width:1180px;margin:0 auto;padding:16px}
.wlc *{box-sizing:border-box}
.wlc button{font-family:inherit}
.wlc-top{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
@media (max-width:720px){.wlc-top{grid-template-columns:1fr}}
.wlc-card{background:#fff;border-radius:18px;padding:14px 16px;box-shadow:0 2px 0 rgba(1,86,64,.12)}
.wlc-k{font-size:11px;font-weight:800;letter-spacing:.14em;color:#AB2372;margin-bottom:6px}
.wlc-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
.wlc-btn{border:none;border-radius:999px;padding:8px 14px;font-weight:700;font-size:13px;cursor:pointer;background:#015640;color:#fff;transition:transform .12s,filter .15s}
.wlc-btn.alt{background:#fff;color:#015640;border:1.5px solid #015640}
.wlc-btn.on{background:#D5F367;color:#015640}
.wlc-btn.gold{background:#F9BF01;color:#121313}
.wlc-btn:hover{filter:brightness(1.07);transform:translateY(-1px)}.wlc-btn:active{transform:translateY(1px) scale(.97)}
.wlc-seg{display:inline-flex;background:#015640;border-radius:999px;padding:3px;gap:2px}
.wlc-seg button{border:none;background:transparent;color:#D5F367;border-radius:999px;padding:6px 12px;font-weight:700;font-size:13px;cursor:pointer}
.wlc-seg button.on{background:#D5F367;color:#015640}
.wlc-title{font-size:26px;font-weight:800;color:#015640;margin:0 6px 0 2px;min-width:0}
.wlc-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.wlc-chip{border:1.5px solid var(--c);border-radius:999px;padding:5px 10px;font-size:12px;font-weight:700;cursor:pointer;background:#fff;color:#121313}
.wlc-chip.off{opacity:.4;text-decoration:line-through}
.wlc-month{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.wlc-dow{font-size:11px;font-weight:800;letter-spacing:.1em;color:#015640;text-align:center;padding:4px 0}
.wlc-day{background:#fff;border-radius:12px;min-height:108px;padding:6px 5px;display:flex;flex-direction:column;gap:3px;cursor:pointer;transition:box-shadow .15s;min-width:0}
.wlc-day:hover{box-shadow:0 0 0 2px #00B451}
.wlc-day.out{opacity:.45}
.wlc-day.today{box-shadow:0 0 0 3px #D5F367,0 0 0 5px #015640}
.wlc-dn{font-size:13px;font-weight:800;color:#015640;display:flex;justify-content:space-between}
.wlc-day.today .wlc-dn span:first-child{background:#015640;color:#D5F367;border-radius:999px;padding:0 7px}
.wlc-ev{font-size:11px;font-weight:700;border-radius:6px;padding:2px 6px;color:#fff;background:var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;border:none;text-align:left;width:100%}
.wlc-ev.soft{background:color-mix(in srgb,var(--c) 16%,#fff);color:#121313;border-left:4px solid var(--c)}
.wlc-ev.mid{border-radius:0;margin:0 -5px;width:calc(100% + 10px)}.wlc-ev.mstart{border-radius:6px 0 0 6px;margin-right:-5px;width:calc(100% + 5px)}.wlc-ev.mend{border-radius:0 6px 6px 0;margin-left:-5px;width:calc(100% + 5px)}
.wlc-more{font-size:11px;font-weight:700;color:#AB2372;background:none;border:none;text-align:left;cursor:pointer;padding:0 4px}
.wlc-week{display:grid;grid-template-columns:52px repeat(7,minmax(0,1fr));background:#fff;border-radius:16px;overflow:hidden}
.wlc-wh{padding:8px 4px;text-align:center;font-weight:800;font-size:12px;color:#015640;border-bottom:1px solid #ece8d6;cursor:pointer}
.wlc-wh.today{background:#D5F367}
.wlc-col{position:relative;border-left:1px solid #ece8d6}
.wlc-hr{height:44px;border-bottom:1px solid #f2efe2;font-size:10px;color:#8a8a8a;text-align:right;padding-right:4px}
.wlc-tev{position:absolute;left:2px;right:2px;border-radius:8px;padding:3px 5px;font-size:11px;font-weight:700;color:#fff;background:var(--c);overflow:hidden;cursor:pointer;border:none;text-align:left;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.wlc-allday{grid-column:1/-1;display:grid;grid-template-columns:52px repeat(7,minmax(0,1fr));border-bottom:2px solid #ece8d6;background:#faf8f0}
.wlc-list{display:flex;flex-direction:column;gap:10px}
.wlc-group{background:#fff;border-radius:16px;padding:10px 12px}
.wlc-gh{font-weight:800;color:#015640;font-size:14px;margin-bottom:6px;display:flex;justify-content:space-between;gap:8px}
.wlc-row{display:flex;gap:10px;align-items:flex-start;padding:8px;border-radius:12px;cursor:pointer;transition:background .15s;border:none;background:none;width:100%;text-align:left}
.wlc-row:hover{background:#f6f3e6}
.wlc-ic{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;background:color-mix(in srgb,var(--c) 20%,#fff)}
.wlc-rt{font-weight:700;font-size:15px;color:#121313}
.wlc-rs{font-size:12px;color:#4a4a4a}
.wlc-modal{position:fixed;inset:0;background:rgba(11,46,36,.75);z-index:900;display:flex;align-items:center;justify-content:center;padding:16px;animation:wlcFade .2s}
.wlc-det{background:#fff;border-radius:20px;max-width:480px;width:100%;padding:18px;border-top:8px solid var(--c);animation:wlcRise .25s cubic-bezier(.2,.9,.3,1.2);max-height:90vh;overflow:auto}
.wlc-anim{animation:wlcRise .25s ease-out}
@keyframes wlcFade{from{opacity:0}}@keyframes wlcRise{from{opacity:0;transform:translateY(10px)}}
.wlc-in{width:100%;border:1.5px solid #c9c4b0;border-radius:10px;padding:7px 9px;font:500 14px inherit;font-family:inherit;background:#fff}
.wlc-form{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wlc-form label{font-size:12px;font-weight:700;color:#015640;display:flex;flex-direction:column;gap:3px}
.wlc-form .full{grid-column:1/-1}
@media (max-width:640px){.wlc{padding:10px}.wlc-title{font-size:20px}.wlc-day{min-height:64px;padding:3px}.wlc-ev{font-size:9px;padding:1px 3px}.wlc-form{grid-template-columns:1fr}.wlc-hide-sm{display:none}}
.wlc-low *,.wlc-low{animation:none!important;transition:none!important}
@media (prefers-reduced-motion: reduce){.wlc *{animation:none!important;transition:none!important}}
@media print{body *{visibility:hidden!important}.wlc-print,.wlc-print *{visibility:visible!important}.wlc-print{position:absolute;left:0;top:0;width:100%}.wlc-noprint{display:none!important}.wlc-day{min-height:90px;border:1px solid #ccc;break-inside:avoid}.wlc-ev{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;
const ensureCss = () => { if (document.getElementById('wlc-css')) return; const s = document.createElement('style'); s.id = 'wlc-css'; s.textContent = css; document.head.appendChild(s); };
const E = (tag, props, ...kids) => { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue;
    if (k == 'style') { for (const s in v) { if (s.startsWith('--')) e.style.setProperty(s, v[s]); else e.style[s] = v[s]; } } else if (k.startsWith('on')) e[k] = v; else if (k == 'cls') e.className = v; else e.setAttribute(k, v === true ? '' : v); }
  kids.flat().forEach(c => { if (c == null || c === false) return; e.appendChild(typeof c == 'object' ? c : document.createTextNode(String(c))); }); return e; };

C.mount = (root, api) => { ensureCss(); api = api || {};
  const small = () => window.innerWidth < 640;
  let view = (() => { try { return localStorage.getItem('wl-cal-view') || (small() ? 'agenda' : 'month'); } catch(e) { return small() ? 'agenda' : 'month'; } })(); if (small() && view == 'week') view = 'agenda';
  let cur = todayS(), q = '', off = {}, live = true, detail = null, admin = false, editing = null, tick = null;
  const low = () => !!(api.lowFx && api.lowFx());
  const wrap = E('div', {cls:'wlc wlc-print'+(low()?' wlc-low':'')}); root.appendChild(wrap);
  const setView = v => { view = v; try { localStorage.setItem('wl-cal-view', v); } catch(e){} render(); };
  const vis = list => list.filter(o => !off[o.ev.category] && (!q.trim() || (o.ev.title+' '+o.ev.location+' '+o.ev.description).toLowerCase().includes(q.trim().toLowerCase())));
  const occ = (a, b) => vis(occurrences(events(), a, b));
  const move = dir => { const d = parse(cur); if (view == 'month') { d.setDate(1); d.setMonth(d.getMonth()+dir); } else if (view == 'week') d.setDate(d.getDate()+7*dir); else if (view == 'day') d.setDate(d.getDate()+dir); else d.setDate(d.getDate()+30*dir); cur = ymd(d); render(); };
  const timeLabel = ev => ev.allDay ? 'All day' : fmtTime(ev.time)+(ev.endTime ? ' – '+fmtTime(ev.endTime) : '');
  const chip = (o, extra) => { const k = cat(o.ev.category); return E('button', {cls:'wlc-ev'+(extra||''), style:{'--c':k.c}, title:o.ev.title+' · '+timeLabel(o.ev), onclick:e=>{ e.stopPropagation(); detail = o; render(); }}, (o.ev.allDay || o.multi ? '' : fmtTime(o.ev.time)+' ')+k.e+' '+o.ev.title); };
  // ---- header cards: Today + Next up ----
  const topCards = () => { const t = todayS(), today = occ(t, t), now = new Date(), nowM = now.getHours()*60 + now.getMinutes();
    const ahead = occ(t, addDays(t, 120)).filter(o => o.first && (o.day > t || (!o.ev.allDay && mins(o.ev.time) > nowM)));
    const next = ahead[0]; let cd = '';
    if (next) { const when = parse(next.day); if (!next.ev.allDay) { const [h, m] = next.ev.time.split(':').map(Number); when.setHours(h, m); } const ms = when - now;
      const dd = Math.floor(ms/864e5), hh = Math.floor(ms%864e5/36e5), mm = Math.floor(ms%36e5/6e4), ss = Math.floor(ms%6e4/1e3); cd = ms <= 0 ? 'Starting now' : (dd ? dd+'d ' : '')+hh+'h '+pad(mm)+'m '+pad(ss)+'s'; }
    const tc = E('div', {cls:'wlc-card'}, E('div', {cls:'wlc-k'}, 'TODAY · '+nice(t).toUpperCase()));
    if (!today.length) tc.appendChild(E('div', {cls:'wlc-rs'}, 'Nothing on the calendar today. Enjoy!'));
    today.slice(0, 4).forEach(o => tc.appendChild(row(o))); if (today.length > 4) tc.appendChild(E('button', {cls:'wlc-more', onclick:()=>{ cur = t; setView('day'); }}, '+'+(today.length-4)+' more today'));
    const nc = E('div', {cls:'wlc-card', style:{background:'#015640', color:'#fff'}}, E('div', {cls:'wlc-k', style:{color:'#D5F367'}}, 'NEXT UP'));
    if (next) { const k = cat(next.ev.category); nc.append(E('div', {style:{fontSize:'20px', fontWeight:800, cursor:'pointer'}, onclick:()=>{ detail = next; render(); }}, k.e+' '+next.ev.title), E('div', {style:{fontSize:'13px', color:'#cfe7d9', margin:'2px 0 8px'}}, nice(next.day)+' · '+timeLabel(next.ev)+(next.ev.location ? ' · '+next.ev.location : '')),
      E('div', {cls:'wlc-cd', style:{fontSize:'28px', fontWeight:800, color:'#D5F367', fontVariantNumeric:'tabular-nums'}}, cd), E('div', {style:{fontSize:'11px', color:'#cfe7d9'}}, 'until it starts')); }
    else nc.appendChild(E('div', null, 'No upcoming events.'));
    return E('div', {cls:'wlc-top wlc-noprint'}, tc, nc); };
  const row = o => { const k = cat(o.ev.category); return E('button', {cls:'wlc-row', onclick:()=>{ detail = o; render(); }}, E('div', {cls:'wlc-ic', style:{'--c':k.c}}, k.e),
    E('div', {style:{minWidth:0}}, E('div', {cls:'wlc-rt'}, o.ev.title), E('div', {cls:'wlc-rs'}, timeLabel(o.ev)+(o.multi ? ' · '+nice(o.startDay)+' → '+nice(o.endDay) : '')+(o.ev.location ? ' · 📍 '+o.ev.location : '')+(o.ev.repeat ? ' · 🔁 '+({daily:'Daily', weekly:'Weekly', monthly:'Monthly'})[o.ev.repeat.freq] : '')))); };
  // ---- views ----
  const month = () => { const d = parse(cur), first = new Date(d.getFullYear(), d.getMonth(), 1), start = addDays(ymd(first), -first.getDay()), last = new Date(d.getFullYear(), d.getMonth()+1, 0), end = addDays(ymd(last), 6 - last.getDay()), t = todayS();
    const all = occ(start, end), byDay = {}; all.forEach(o => (byDay[o.day] = byDay[o.day] || []).push(o));
    const g = E('div', {cls:'wlc-month wlc-anim'}); DOW.forEach(n => g.appendChild(E('div', {cls:'wlc-dow'}, n)));
    const cap = small() ? 2 : 3;
    for (let s = start; s <= end; s = addDays(s, 1)) { const list = byDay[s] || [], dd = parse(s), out = dd.getMonth() != d.getMonth();
      const cell = E('div', {cls:'wlc-day'+(out?' out':'')+(s==t?' today':''), onclick:()=>{ cur = s; setView('day'); }}, E('div', {cls:'wlc-dn'}, E('span', null, dd.getDate()), list.length ? E('span', {style:{fontSize:'10px', color:'#8a8a8a'}}, '') : null));
      list.slice(0, cap).forEach(o => { const wd = parse(o.day).getDay(); const cls = o.multi ? ' '+(o.first || wd == 0 ? (o.last || wd == 6 ? '' : 'mstart') : (o.last || wd == 6 ? 'mend' : 'mid')) : (o.ev.allDay ? '' : ' soft');
        const c = chip(o, cls); if (o.multi && !o.first && wd != 0) c.textContent = '\u00a0'; cell.appendChild(c); });
      if (list.length > cap) cell.appendChild(E('button', {cls:'wlc-more', onclick:e=>{ e.stopPropagation(); cur = s; setView('day'); }}, '+'+(list.length-cap)+' more'));
      g.appendChild(cell); }
    return g; };
  const week = () => { const d = parse(cur); const start = addDays(cur, -d.getDay()), end = addDays(start, 6), t = todayS(), H0 = 7, H1 = 21, PH = 44;
    const all = occ(start, end), g = E('div', {cls:'wlc-week wlc-anim'});
    g.appendChild(E('div')); for (let i=0;i<7;i++) { const s = addDays(start, i), dd = parse(s); g.appendChild(E('div', {cls:'wlc-wh'+(s==t?' today':''), onclick:()=>{ cur = s; setView('day'); }}, DOW[i]+' '+dd.getDate())); }
    const ad = E('div', {cls:'wlc-allday'}); ad.appendChild(E('div', {style:{fontSize:'10px', color:'#8a8a8a', padding:'6px 4px', textAlign:'right'}}, 'all day'));
    for (let i=0;i<7;i++) { const s = addDays(start, i), c = E('div', {style:{padding:'3px', display:'flex', flexDirection:'column', gap:'2px', minWidth:0, borderLeft:'1px solid #ece8d6'}}); all.filter(o => o.day == s && (o.ev.allDay || o.multi)).forEach(o => c.appendChild(chip(o))); ad.appendChild(c); }
    g.appendChild(ad);
    const hours = E('div'); for (let h=H0; h<H1; h++) hours.appendChild(E('div', {cls:'wlc-hr'}, fmtTime(pad(h)+':00'))); g.appendChild(hours);
    for (let i=0;i<7;i++) { const s = addDays(start, i), col = E('div', {cls:'wlc-col', style:{height:(H1-H0)*PH+'px', background: s==t ? '#fbfde9' : ''}});
      for (let h=H0; h<H1; h++) col.appendChild(E('div', {style:{position:'absolute', left:0, right:0, top:(h-H0)*PH+'px', borderBottom:'1px solid #f2efe2', height:PH+'px'}}));
      const timed = all.filter(o => o.day == s && !o.ev.allDay && !o.multi);
      // side-by-side columns for overlapping events
      const lanes = []; timed.forEach(o => { const a = mins(o.ev.time), b = Math.max(a+30, mins(o.ev.endTime || o.ev.time) || a+60); let li = lanes.findIndex(L => L <= a); if (li < 0) { li = lanes.length; lanes.push(b); } else lanes[li] = b; o._lane = li; o._a = a; o._b = b; });
      timed.forEach(o => { const k = cat(o.ev.category), n = Math.max(1, lanes.length), top = Math.max(0, (o._a - H0*60)/60*PH), hgt = Math.max(18, (o._b - o._a)/60*PH - 2);
        col.appendChild(E('button', {cls:'wlc-tev', style:{'--c':k.c, top:top+'px', height:hgt+'px', left:(o._lane/n*100)+'%', width:'calc('+(100/n)+'% - 3px)'}, title:o.ev.title, onclick:()=>{ detail = o; render(); }}, fmtTime(o.ev.time)+' '+o.ev.title)); });
      if (s == t) { const nw = new Date(), m = nw.getHours()*60 + nw.getMinutes(); if (m >= H0*60 && m <= H1*60) col.appendChild(E('div', {style:{position:'absolute', left:0, right:0, top:((m-H0*60)/60*PH)+'px', height:'2px', background:'#FF4539', zIndex:3}})); }
      g.appendChild(col); }
    return g; };
  const day = () => { const list = occ(cur, cur), box = E('div', {cls:'wlc-group wlc-anim'}, E('div', {cls:'wlc-gh'}, E('span', null, nice(cur)), E('span', {style:{color:'#8a8a8a', fontWeight:600}}, list.length+' event'+(list.length==1?'':'s'))));
    if (!list.length) box.appendChild(E('div', {cls:'wlc-rs', style:{padding:'10px'}}, 'Nothing planned. A free day!'));
    list.forEach(o => { const k = cat(o.ev.category); box.appendChild(E('div', {style:{display:'flex', gap:'10px', padding:'10px', borderRadius:'14px', background:'#faf8f0', marginBottom:'8px', borderLeft:'6px solid '+k.c}},
      E('div', {cls:'wlc-ic', style:{'--c':k.c}}, k.e), E('div', {style:{flex:1, minWidth:0}}, E('div', {cls:'wlc-rt'}, o.ev.title), E('div', {cls:'wlc-rs'}, timeLabel(o.ev)+' · '+k.n+(o.multi ? ' · day '+(diffDays(o.startDay, o.day)+1)+' of '+(diffDays(o.startDay, o.endDay)+1) : '')),
        o.ev.location ? E('div', {cls:'wlc-rs'}, '📍 '+o.ev.location) : null, o.ev.description ? E('div', {style:{fontSize:'13px', marginTop:'4px'}}, o.ev.description) : null,
        E('div', {style:{display:'flex', gap:'6px', marginTop:'6px', flexWrap:'wrap'}}, E('button', {cls:'wlc-btn alt', onclick:()=>{ detail = o; render(); }}, 'Details'), E('button', {cls:'wlc-btn', onclick:()=>download(slug(o.ev)+'.ics', C.ics(o.ev, o), 'text/calendar')}, '📅 Add to my calendar'))))); });
    return box; };
  const agenda = () => { const a = cur < todayS() ? cur : (view == 'agenda' && cur == todayS() ? todayS() : cur), b = addDays(a, 29), list = occ(a, b), by = {}; list.forEach(o => (by[o.day] = by[o.day] || []).push(o));
    const box = E('div', {cls:'wlc-list wlc-anim'}); const days = Object.keys(by).sort();
    if (!days.length) box.appendChild(E('div', {cls:'wlc-group wlc-rs'}, 'No events in the next 30 days'+(q || Object.values(off).some(Boolean) ? ' match your filters.' : '.')));
    days.forEach(dk => { const g = E('div', {cls:'wlc-group'}, E('div', {cls:'wlc-gh'}, E('span', null, (dk == todayS() ? 'Today · ' : dk == addDays(todayS(), 1) ? 'Tomorrow · ' : '')+nice(dk)), E('span', {style:{color:'#8a8a8a', fontWeight:600, fontSize:'12px'}}, by[dk].length+' event'+(by[dk].length==1?'':'s'))));
      by[dk].forEach(o => g.appendChild(row(o))); box.appendChild(g); });
    return box; };
  const slug = ev => ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
  // ---- detail card ----
  const detailCard = () => { const o = detail, ev = o.ev, k = cat(ev.category);
    const m = E('div', {cls:'wlc-modal wlc-noprint', onclick:e=>{ if (e.target === m) { detail = null; render(); } }});
    m.appendChild(E('div', {cls:'wlc-det', style:{'--c':k.c}, role:'dialog', 'aria-label':ev.title},
      E('div', {style:{display:'flex', justifyContent:'space-between', gap:'8px', alignItems:'flex-start'}}, E('div', {style:{fontSize:'12px', fontWeight:800, letterSpacing:'.1em', color:k.c}}, k.e+' '+k.n.toUpperCase()), E('button', {cls:'wlc-btn alt', onclick:()=>{ detail = null; render(); }}, 'Close')),
      E('div', {style:{fontSize:'24px', fontWeight:800, color:'#015640', margin:'4px 0 8px'}}, ev.title),
      E('div', {style:{display:'grid', gridTemplateColumns:'26px 1fr', gap:'6px 6px', fontSize:'14px'}},
        E('span', null, '🗓'), E('span', null, o.multi ? nice(o.startDay)+' → '+nice(o.endDay) : nice(o.day)),
        E('span', null, '⏰'), E('span', null, timeLabel(ev)),
        ev.location ? E('span', null, '📍') : null, ev.location ? E('span', null, ev.location) : null,
        ev.repeat ? E('span', null, '🔁') : null, ev.repeat ? E('span', null, 'Repeats '+(ev.repeat.interval > 1 ? 'every '+ev.repeat.interval+' ' : '')+({daily:ev.repeat.interval>1?'days':'daily', weekly:ev.repeat.interval>1?'weeks':'weekly', monthly:ev.repeat.interval>1?'months':'monthly'})[ev.repeat.freq]+(ev.repeat.days ? ' on '+ev.repeat.days.map(d=>DOW[d]).join(', ') : '')+(ev.repeat.until ? ' until '+nice(ev.repeat.until) : '')) : null,
        ev.link ? E('span', null, '🔗') : null, ev.link ? E('a', {href:ev.link, target:'_blank', rel:'noopener', style:{color:'#015640', fontWeight:700, wordBreak:'break-all'}}, ev.link) : null),
      ev.description ? E('div', {style:{marginTop:'10px', fontSize:'14px', lineHeight:1.5, background:'#faf8f0', borderRadius:'12px', padding:'10px'}}, ev.description) : null,
      E('div', {style:{display:'flex', gap:'8px', marginTop:'14px', flexWrap:'wrap'}}, E('button', {cls:'wlc-btn gold', onclick:()=>{ download(slug(ev)+'.ics', C.ics(ev, o), 'text/calendar'); api.toast && api.toast('CALENDAR FILE DOWNLOADED · OPEN IT TO ADD THE EVENT'); }}, '📅 Add to my calendar'),
        admin ? E('button', {cls:'wlc-btn alt', onclick:()=>{ editing = {...ev, repeat: ev.repeat ? {...ev.repeat} : null}; detail = null; render(); }}, '✏️ Edit') : null),
      E('div', {cls:'wlc-rs', style:{marginTop:'8px'}}, 'The .ics file works with Google Calendar, Apple Calendar and Outlook.')));
    return m; };
  // ---- admin editor ----
  const isAdmin = () => !!(api.isAdmin && api.isAdmin());
  const draft = () => DRAFT || LIVE.map(e => ({...e}));
  const saveDraft = list => { DRAFT = list; try { localStorage.setItem('wl-cal-draft', JSON.stringify(list)); } catch(e){} };
  const adminPanel = () => { const list = draft(), box = E('div', {cls:'wlc-card wlc-noprint', style:{border:'3px solid #F9BF01', marginBottom:'12px'}});
    box.append(E('div', {cls:'wlc-k'}, 'ADMIN · EDIT EVENTS'), E('div', {cls:'wlc-rs', style:{marginBottom:'8px', lineHeight:1.5}}, 'Changes here are a draft saved only in this browser. When you’re happy, click “Download calendar-events.json” and upload that file to the site folder on GitHub — the calendar changes for everyone as soon as the upload is live. Until then, visitors keep seeing the current file.'));
    const bar = E('div', {cls:'wlc-bar'});
    bar.append(E('button', {cls:'wlc-btn', onclick:()=>{ editing = norm({id:'ev-'+Date.now().toString(36), title:'', start:cur, allDay:true, category:'special'}); editing._new = true; render(); }}, '+ Add event'),
      E('button', {cls:'wlc-btn'+(preview?' on':' alt'), onclick:()=>{ if (!DRAFT) saveDraft(draft()); preview = !preview; render(); }}, preview ? '👁 Previewing draft' : '👁 Preview draft on calendar'),
      E('button', {cls:'wlc-btn gold', onclick:()=>{ const out = {_howToEdit:['Upload this file to the site folder as calendar-events.json. Every visitor sees these events once it is live.','See the README for the field list: id, title, start, end, allDay, time, endTime, location, description, category, link, repeat.'], events: list.map(({_new, ...e}) => { const o = {id:e.id, title:e.title, start:e.start}; if (e.end) o.end = e.end; o.allDay = !!e.allDay; if (!e.allDay) { o.time = e.time; if (e.endTime) o.endTime = e.endTime; } o.location = e.location; o.description = e.description; o.category = e.category; if (e.link) o.link = e.link; if (e.repeat) { o.repeat = {freq:e.repeat.freq, interval:e.repeat.interval||1}; if (e.repeat.until) o.repeat.until = e.repeat.until; if (e.repeat.days) o.repeat.days = e.repeat.days; } return o; })};
        download('calendar-events.json', JSON.stringify(out, null, 2)+'\n', 'application/json'); api.toast && api.toast('DOWNLOADED · UPLOAD IT TO THE SITE TO PUBLISH'); }}, '⬇ Download calendar-events.json'),
      E('button', {cls:'wlc-btn alt', onclick:()=>{ if (!confirmArm('reset')) return; DRAFT = null; preview = false; try { localStorage.removeItem('wl-cal-draft'); } catch(e){} render(); }}, armed == 'reset' ? 'Tap again to discard draft' : 'Discard draft'));
    box.appendChild(bar);
    const tl = E('div', {style:{maxHeight:'260px', overflow:'auto', border:'1px solid #ece8d6', borderRadius:'12px'}});
    list.slice().sort((a,b) => a.start < b.start ? -1 : 1).forEach(ev => { const k = cat(ev.category);
      tl.appendChild(E('div', {style:{display:'flex', gap:'8px', alignItems:'center', padding:'6px 10px', borderBottom:'1px solid #f2efe2'}}, E('span', null, k.e), E('div', {style:{flex:1, minWidth:0}}, E('b', null, ev.title), E('div', {cls:'wlc-rs'}, ev.start+(ev.end ? ' → '+ev.end : '')+' · '+(ev.allDay ? 'all day' : ev.time+(ev.endTime ? '–'+ev.endTime : ''))+(ev.repeat ? ' · repeats '+ev.repeat.freq : ''))),
        E('button', {cls:'wlc-btn alt', onclick:()=>{ editing = {...ev, repeat: ev.repeat ? {...ev.repeat} : null}; render(); }}, 'Edit'),
        E('button', {cls:'wlc-btn', style:{background:'#FF4539'}, onclick:()=>{ if (!confirmArm('del:'+ev.id)) return; saveDraft(draft().filter(x => x.id !== ev.id)); render(); }}, armed == 'del:'+ev.id ? 'Sure?' : 'Delete'))); });
    box.appendChild(tl);
    if (editing) box.appendChild(editor());
    return box; };
  let armed = ''; const confirmArm = k => { if (armed === k) { armed = ''; return true; } armed = k; render(); setTimeout(() => { if (armed === k) { armed = ''; render(); } }, 3000); return false; };
  const editor = () => { const ev = editing, f = E('div', {cls:'wlc-form', style:{marginTop:'12px', background:'#faf8f0', borderRadius:'14px', padding:'12px'}});
    const inp = (lbl, key, type, opts) => { const i = type == 'select' ? E('select', {cls:'wlc-in'}, ...opts.map(([v, t]) => E('option', {value:v, selected: String(ev[key]) == String(v) ? true : null}, t))) : type == 'area' ? E('textarea', {cls:'wlc-in', rows:3}) : E('input', {cls:'wlc-in', type: type || 'text'});
      if (type != 'select') i.value = ev[key] || ''; i.oninput = i.onchange = () => { ev[key] = i.value; }; i.addEventListener('keydown', e => e.stopPropagation()); return E('label', {cls: (opts && opts.full) || type == 'area' ? 'full' : ''}, lbl, i); };
    f.append(E('div', {cls:'full', style:{fontWeight:800, color:'#015640'}}, ev._new ? 'New event' : 'Edit event'), inp('Title', 'title'), inp('Category', 'category', 'select', Object.entries(CATS).map(([k, c]) => [k, c.e+' '+c.n])),
      inp('Start date', 'start', 'date'), inp('End date (multi-day, optional)', 'end', 'date'));
    const ad = E('input', {type:'checkbox'}); ad.checked = !!ev.allDay; ad.onchange = () => { ev.allDay = ad.checked; render(); };
    f.append(E('label', {cls:'full', style:{flexDirection:'row', alignItems:'center', gap:'6px'}}, ad, 'All day'));
    if (!ev.allDay) f.append(inp('Start time', 'time', 'time'), inp('End time', 'endTime', 'time'));
    f.append(inp('Location', 'location'), inp('Link (optional)', 'link', 'url'), inp('Description', 'description', 'area'));
    const rp = E('select', {cls:'wlc-in'}, ...[['','Does not repeat'],['daily','Daily'],['weekly','Weekly'],['monthly','Monthly']].map(([v,t]) => E('option', {value:v, selected:(ev.repeat ? ev.repeat.freq : '') == v ? true : null}, t)));
    rp.onchange = () => { ev.repeat = rp.value ? {freq:rp.value, interval:1, until:(ev.repeat||{}).until || '', days:null} : null; render(); };
    f.append(E('label', null, 'Repeats', rp));
    if (ev.repeat) { const un = E('input', {cls:'wlc-in', type:'date'}); un.value = ev.repeat.until || ''; un.onchange = () => { ev.repeat.until = un.value; }; f.append(E('label', null, 'Repeat until (optional)', un));
      if (ev.repeat.freq == 'weekly') { const dr = E('div', {cls:'full', style:{display:'flex', gap:'4px', flexWrap:'wrap', alignItems:'center'}}, E('span', {style:{fontSize:'12px', fontWeight:700, color:'#015640'}}, 'On:'));
        DOW.forEach((n, i) => { const on = (ev.repeat.days || [parse(ev.start).getDay()]).includes(i); dr.appendChild(E('button', {cls:'wlc-btn'+(on?'':' alt'), style:{padding:'4px 9px'}, onclick:()=>{ const ds = new Set(ev.repeat.days || [parse(ev.start).getDay()]); if (on) ds.delete(i); else ds.add(i); ev.repeat.days = [...ds].sort(); render(); }}, n)); });
        f.append(dr); } }
    const msg = E('div', {cls:'full', style:{color:'#B3001B', fontWeight:700, fontSize:'13px'}});
    f.append(msg, E('div', {cls:'full', style:{display:'flex', gap:'8px', flexWrap:'wrap'}}, E('button', {cls:'wlc-btn', onclick:()=>{ if (!String(ev.title).trim()) { msg.textContent = 'Give the event a title.'; return; } if (!ev.start) { msg.textContent = 'Pick a start date.'; return; } if (ev.end && ev.end < ev.start) { msg.textContent = 'The end date is before the start date.'; return; }
        const clean = norm({...ev, end: ev.end || '', allDay: !!ev.allDay, time: ev.allDay ? '' : ev.time || '09:00'}); const list = draft(); const i = list.findIndex(x => x.id === clean.id); if (i >= 0) list[i] = clean; else list.push(clean); saveDraft(list); preview = true; editing = null; cur = clean.start; api.toast && api.toast('SAVED TO DRAFT · PREVIEWING'); render(); }}, ev._new ? 'Add to draft' : 'Save changes'),
      E('button', {cls:'wlc-btn alt', onclick:()=>{ editing = null; render(); }}, 'Cancel')));
    return f; };
  // ---- main render ----
  const render = () => { if (!live) return; admin = isAdmin(); const keep = wrap.querySelector('.wlc-search'), hadFocus = keep && document.activeElement === keep; wrap.innerHTML = ''; wrap.className = 'wlc wlc-print'+(low()?' wlc-low':'');
    if (loadErr) wrap.appendChild(E('div', {cls:'wlc-card', style:{border:'2px solid #FF4539', marginBottom:'10px'}}, loadErr+' Showing no events for now.'));
    if (preview && DRAFT) wrap.appendChild(E('div', {cls:'wlc-card wlc-noprint', style:{background:'#F9BF01', marginBottom:'10px', fontWeight:700}}, '👁 Previewing your draft — only you can see this until the new file is uploaded.'));
    wrap.appendChild(topCards());
    if (admin) wrap.appendChild(adminPanel());
    // toolbar
    const d = parse(cur), title = view == 'month' ? MONTHS[d.getMonth()]+' '+d.getFullYear() : view == 'week' ? (() => { const s = addDays(cur, -d.getDay()), e = addDays(s, 6); return MONTHS[parse(s).getMonth()].slice(0,3)+' '+parse(s).getDate()+' – '+MONTHS[parse(e).getMonth()].slice(0,3)+' '+parse(e).getDate()+', '+parse(e).getFullYear(); })() : view == 'day' ? nice(cur)+', '+d.getFullYear() : 'Next 30 days from '+nice(cur < todayS() ? cur : cur);
    const mSel = E('select', {cls:'wlc-in', style:{width:'auto'}, 'aria-label':'Month'}, ...MONTHS.map((n, i) => E('option', {value:i, selected: i == d.getMonth() ? true : null}, n)));
    const ySel = E('select', {cls:'wlc-in', style:{width:'auto'}, 'aria-label':'Year'}); for (let y = d.getFullYear()-3; y <= d.getFullYear()+3; y++) ySel.appendChild(E('option', {value:y, selected: y == d.getFullYear() ? true : null}, y));
    const jump = () => { cur = ymd(new Date(+ySel.value, +mSel.value, 1)); render(); }; mSel.onchange = jump; ySel.onchange = jump;
    const seg = E('div', {cls:'wlc-seg'}); [['month','Month'],['week','Week'],['day','Day'],['agenda','Agenda']].forEach(([k, n]) => { if (k == 'week' && small()) return; seg.appendChild(E('button', {cls: view == k ? 'on' : '', onclick:()=>setView(k)}, n)); });
    wrap.appendChild(E('div', {cls:'wlc-bar wlc-noprint'}, E('button', {cls:'wlc-btn', onclick:()=>{ cur = todayS(); render(); }}, 'Today'), E('button', {cls:'wlc-btn alt', 'aria-label':'Previous', onclick:()=>move(-1)}, '‹'), E('button', {cls:'wlc-btn alt', 'aria-label':'Next', onclick:()=>move(1)}, '›'),
      E('div', {cls:'wlc-title'}, title), E('span', {style:{flex:1}}), mSel, ySel, seg));
    // filters + search
    const fl = E('div', {cls:'wlc-chips wlc-noprint'});
    Object.entries(CATS).forEach(([k, c]) => fl.appendChild(E('button', {cls:'wlc-chip'+(off[k]?' off':''), style:{'--c':c.c}, 'aria-pressed': off[k] ? 'false' : 'true', onclick:()=>{ off[k] = !off[k]; render(); }}, c.e+' '+c.n)));
    const sr = E('input', {cls:'wlc-in wlc-search', type:'search', placeholder:'🔍 Search events', 'aria-label':'Search events', style:{width:'200px', flex:'1 1 160px'}}); sr.value = q;
    sr.oninput = () => { q = sr.value; render(); }; sr.addEventListener('keydown', e => e.stopPropagation()); fl.appendChild(sr);
    fl.appendChild(E('button', {cls:'wlc-btn alt wlc-hide-sm', onclick:()=>{ if (view != 'month') { view = 'month'; render(); } setTimeout(() => window.print(), 50); }}, '🖨 Print month'));
    wrap.appendChild(fl);
    if (q.trim()) { const hits = vis(occurrences(events(), addDays(todayS(), -365), addDays(todayS(), 365))).filter(o => o.first); wrap.appendChild(E('div', {cls:'wlc-rs wlc-noprint', style:{marginBottom:'8px'}}, hits.length ? hits.length+' match'+(hits.length==1?'':'es')+' this year · next: '+hits.filter(o => o.day >= todayS()).slice(0,3).map(o => o.ev.title+' ('+nice(o.day)+')').join(', ') : 'No events match “'+q+'”.')); }
    const vw = E('div', {cls:'wlc-view'}); vw.appendChild(({month, week, day, agenda}[view] || month)()); wrap.appendChild(vw);
    // swipe left/right on phones to move through months/weeks/days
    let sx = null, sy = null; vw.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive:true});
    vw.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)*1.5) move(dx < 0 ? 1 : -1); }, {passive:true});
    if (detail) wrap.appendChild(detailCard());
    if (hadFocus) { const n = wrap.querySelector('.wlc-search'); if (n) { n.focus(); n.setSelectionRange(q.length, q.length); } } };
  const off1 = C.onChange(render);
  C.load().then(render);
  render();
  tick = setInterval(() => { const el = wrap.querySelector('.wlc-cd'); if (!el || !live) return; const t = topCards().querySelector('.wlc-cd'); if (t) el.textContent = t.textContent; }, 1000);
  const onKey = e => { if (e.key == 'Escape' && detail) { detail = null; render(); } }; window.addEventListener('keydown', onKey);
  C._t = {setView, get:() => ({view, cur, q, off:{...off}, preview, events:events().length}), go: s => { cur = s; render(); }, search: s => { q = s; render(); }, toggle: k => { off[k] = !off[k]; render(); }};
  return () => { live = false; off1(); clearInterval(tick); window.removeEventListener('keydown', onKey); wrap.remove(); };
};
window.WLC = C;
})();
