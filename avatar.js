// Wilderland Arcade · AVATAR BUILDER + AVATAR SHOP
// The parts and the drawing live in the arcade page (AVP / avSVG). This module decides what you own
// (free starters, Avatar Shop buys with tickets, achievement unlocks, Rebirth/Prestige rewards, Wilderland prizes)
// and draws the builder: live try-on preview, silhouettes for locked items, Randomize, 3 outfit presets.
(function(){
'use strict';
const V = {};
let AVP = null, AVK = [], TABS = [], svg = null, CURSORS = [];
const FULL = ['pants','shoes'];   // these tabs show the full-body picture
const fmt = n => window.WLP ? window.WLP.fmt(n) : String(Math.round(n));
const nice = x => { x = Number(x); if (x !== x) return 0; if (!(x < 1e300)) return 1e300; if (x < 100) return Math.round(x); const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.min(1e300, Math.round(x / p) * p); };
const RC = ['#9aa5a1','#00B451','#2fa8e0','#a64be0','#f2a900','#ff4539','#4a5cff','#ff5fd2']; // same rarity colors as the Prize Counter
const RN = ['Common','Uncommon','Rare','Epic','Legendary','Mythic','Cosmic','Wilderland'];
V.init = ctx => { AVP = ctx.AVP; AVK = ctx.AVK; TABS = ctx.TABS; svg = ctx.svg; CURSORS = ctx.CURSORS || []; };
V.key = (cat, i) => cat+':'+i;

// How an item is unlocked, and whether this player has it.
V.price = o => nice(Math.min(250 * Math.pow(1.45, o.r||0), 5e6));
V.status = (P, cat, i, adm) => { const o = AVP[cat].o[i]; if (!o) return {own:false};
  const bought = !!(P.avOwn||{})[V.key(cat,i)]; let how = 'free', own = true, label = 'Starter item', rar = 0, price = 0;
  if (o.wp) { const it = window.WLP && window.WLP.catalog ? window.WLP.catalog().find(x => x.id === o.wp) : null; how = 'wp'; own = !!(P.prizes||{})[o.wp]; label = 'Comes with the Wilderland prize “'+(it ? it.n : o.n)+'” (Golden Stars)'; rar = 7; }
  else if (o.one) { how = 'one'; own = !!(window.WLH && window.WLH.norm(P).own.theone); label = 'Only for owners of the pet THE ONE'; rar = 7; }
  else if (o.pr) { how = 'pr'; own = Math.floor((P.rebirths||0)/10) >= o.pr; label = 'Unlocked at Prestige '+o.pr+' ('+(o.pr*10)+' Rebirths)'; rar = 6; }
  else if (o.rb) { how = 'rb'; own = (P.rebirths||0) >= o.rb; label = 'Unlocked at '+o.rb+' Rebirth'+(o.rb>1?'s':''); rar = 5; }
  else if (o.ac) { how = 'ac'; own = (P.ach||[]).length >= o.ac; label = 'Unlocked by: earn '+o.ac+' achievements'; rar = 2; }
  else if (o.a) { const [fid, t] = o.a.split(':'), f = window.WLA && window.WLA.fam(fid); how = 'ach'; own = ((P.at||{})[fid]|0) > +t; label = 'Unlocked by: '+(f ? f.name : fid)+' · '+((window.WLA && window.WLA.TIERS[+t]) || {n:''}).n; rar = Math.min(5, 1 + +t); }
  else if (o.r) { how = 'shop'; price = V.price(o); own = false; label = 'Avatar Shop · '+fmt(price)+' tickets'; rar = price < 2e3 ? 1 : price < 5e4 ? 2 : price < 1e6 ? 3 : 4; }
  return {own: adm || own || bought, how, label, rar, price, rc: RC[rar], rn: RN[rar]}; };
V.ownedCount = P => { if (!AVP) return 0; let n = 0; AVK.forEach(k => AVP[k].o.forEach((o,i) => { const st = V.status(P, k, i); if (st.own && st.how !== 'free') n++; })); return n; }; // starter items don't count
V.allOwned = (P, adm) => { let n = 0; AVK.forEach(k => AVP[k].o.forEach((o,i) => { if (V.status(P, k, i, adm).own) n++; })); return n; };
V.totalCount = () => AVK.reduce((a,k)=>a+AVP[k].o.length,0);
V.itemsFor = (fid, t) => { if (!AVP) return []; const out = []; AVK.forEach(k => AVP[k].o.forEach(o => { if (o.a === fid+':'+t) out.push(o.n+' '+AVP[k].t.toLowerCase()); })); return out; };
V.forPrize = id => { if (!AVP) return null; for (const k of AVK) { const o = AVP[k].o.find(x => x.wp === id); if (o) return o.n+' '+AVP[k].t.toLowerCase(); } return null; };
// One-time: everything an old save had unlocked (by achievement count) stays theirs.
V.migrate = (P, oldCount) => { const own = {...(P.avOwn||{})}; AVK.forEach(k => AVP[k].o.forEach((o,i) => { if (o.r && oldCount >= o.r) own[V.key(k,i)] = true; })); return own; };

// ---------- CSS ----------
const css = `
.wlv{font-family:"Uncut Sans","Inter",system-ui,sans-serif;color:#121313}
.wlv *{box-sizing:border-box}
.wlv-top{display:grid;grid-template-columns:minmax(150px,220px) 1fr;gap:14px;align-items:start}
@media (max-width:640px){.wlv-top{grid-template-columns:1fr}}
.wlv-prev{background:#fff;border-radius:18px;padding:12px;text-align:center;position:relative}
.wlv-prev img{width:100%;max-width:180px;aspect-ratio:1;display:block;margin:0 auto}
.wlv-try{position:absolute;top:8px;left:8px;background:#AB2372;color:#fff;font-size:10px;font-weight:800;border-radius:999px;padding:3px 8px;letter-spacing:.06em}
.wlv-chip{border:1.5px solid #015640;border-radius:999px;padding:6px 11px;font:700 12px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#015640;white-space:nowrap}
.wlv-chip.on{background:#015640;color:#fff}
.wlv-btn{border:none;border-radius:999px;padding:8px 14px;font:700 13px inherit;font-family:inherit;cursor:pointer;background:#015640;color:#fff;white-space:nowrap}
.wlv-btn.alt{background:#fff;color:#015640;border:1.5px solid #015640}
.wlv-btn.gold{background:#F9BF01;color:#121313}
.wlv-btn:disabled{background:#d9d5c3;color:#6a6a6a;cursor:default;border-color:#d9d5c3}
.wlv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}
.wlv-opt{border:3px solid transparent;background:#fff;border-radius:14px;padding:6px;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;position:relative;box-shadow:inset 0 -3px 0 var(--rc)}
.wlv-opt.on{border-color:#015640}
.wlv-opt.lock{background:#ece8d6}
.wlv-opt.lock img{filter:brightness(0) opacity(.28)}
.wlv-opt.try{border-color:#AB2372}
.wlv-opt img{width:62px;height:62px}
.wlv-rar{position:absolute;top:4px;right:6px;width:9px;height:9px;border-radius:50%;background:var(--rc)}
.wlv-nm{font-size:12px;font-weight:700;color:#015640;text-align:center;line-height:1.15}
.wlv-lk{font-size:10px;font-weight:700;color:#AB2372;text-align:center;line-height:1.2}
.wlv-small{font-size:12px;color:#4a4a4a}
.wlv-preset{display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border-radius:12px;padding:6px 8px;min-width:84px}
.wlv-preset img{width:44px;height:44px}
`;
const ensureCss = () => { if (document.getElementById('wlv-css')) return; const s = document.createElement('style'); s.id = 'wlv-css'; s.textContent = css; document.head.appendChild(s); };
const E = (tag, props, ...kids) => { const e = document.createElement(tag); if (props) for (const k in props) { if (k=='style') { for (const sk in props.style) { if (sk.startsWith('--')) e.style.setProperty(sk, props.style[sk]); else e.style[sk] = props.style[sk]; } } else if (k.startsWith('on')) e[k] = props[k]; else if (k=='cls') e.className = props[k]; else e.setAttribute(k, props[k]); }
  kids.flat().forEach(k => { if (k==null || k===false) return; e.appendChild(typeof k=='object' ? k : document.createTextNode(String(k))); }); return e; };

// ---------- the builder ----------
V.mount = (root, api) => { ensureCss(); let tab = api.tab || TABS[0], tryOn = null, msg = '';
  const wrap = E('div', {cls:'wlv'}); root.appendChild(wrap);
  const P = () => api.P(), adm = () => !!(api.admin && api.admin());
  const cur = () => api.norm(P().avatar);
  const equip = (k, i) => { const c = cur(); api.setP({avatar:{...c, [k]: AVP[k].multi ? (c[k] ^ (1<<i)) : i}}); tryOn = null; api.sfx('blip'); render(); };
  const buy = (k, i) => { const p = P(), st = V.status(p, k, i, adm()); if (st.own) return equip(k, i); if (st.how !== 'shop') return api.sfx('bad');
    if (adm()) { api.toast('ADMIN MODE · SHOPPING DISABLED'); return; }
    if ((p.tickets||0) < st.price) { api.sfx('bad'); msg = 'You need '+fmt(st.price - (p.tickets||0))+' more tickets for that.'; render(); return; }
    api.setP({tickets:(p.tickets||0) - st.price, avOwn:{...(p.avOwn||{}), [V.key(k,i)]:true}, avatar:{...cur(), [k]:i}}); tryOn = null; msg = ''; api.sfx('win'); api.toast('AVATAR SHOP · '+AVP[k].o[i].n.toUpperCase()); render(); };
  const randomize = () => { const p = P(), a = {}; AVK.forEach(k => { const ok = AVP[k].o.map((o,i)=>i).filter(i => V.status(p, k, i, adm()).own); a[k] = AVP[k].multi ? 0 : (ok[Math.floor(Math.random()*ok.length)] || 0); }); api.setP({avatar:a}); tryOn = null; api.sfx('blip'); render(); };
  const render = () => { wrap.innerHTML = ''; const p = P(), a = cur(), lvl = api.level(p), look = tryOn ? {...a, [tryOn[0]]: AVP[tryOn[0]].multi ? (a[tryOn[0]] | (1<<tryOn[1])) : tryOn[1]} : a;
    // top: preview + info + presets
    const tst = tryOn ? V.status(p, tryOn[0], tryOn[1], adm()) : null;
    const prev = E('div', {cls:'wlv-prev'}, tryOn ? E('div', {cls:'wlv-try'}, 'TRYING ON') : null, E('div', {style:{display:'flex', gap:'6px', alignItems:'flex-end', justifyContent:'center'}}, E('img', {src: svg(look, lvl), alt:'Your avatar'}), E('img', {src: svg(look, lvl, {full:true}), alt:'Full body', title:'Full body (how you look on the arcade floor)', style:{width:'64px', height:'96px'}})),
      E('div', {style:{fontWeight:800, color:'#015640', marginTop:'4px'}}, api.name()), api.title() ? E('div', {style:{fontSize:'12px', fontWeight:700, color:'#AB2372'}}, '“'+api.title()+'”') : null);
    if (tryOn) { const o = AVP[tryOn[0]].o[tryOn[1]]; prev.append(...[E('div', {cls:'wlv-lk', style:{marginTop:'6px'}}, o.n+' · '+tst.label),
      tst.how === 'shop' ? E('button', {cls:'wlv-btn gold', style:{marginTop:'6px'}, onclick:()=>buy(tryOn[0], tryOn[1])}, 'Buy for '+fmt(tst.price)+' 🎟') : null,
      E('button', {cls:'wlv-btn alt', style:{marginTop:'6px', marginLeft:'4px'}, onclick:()=>{ tryOn = null; render(); }}, 'Stop trying on')].filter(Boolean)); }
    const presets = E('div', {style:{display:'flex', gap:'8px', flexWrap:'wrap'}});
    [0,1,2].forEach(n => { const ps = (p.avPresets||[])[n]; presets.appendChild(E('div', {cls:'wlv-preset'}, ps ? E('img', {src: svg(api.norm(ps), lvl), alt:''}) : E('div', {style:{width:'44px', height:'44px', borderRadius:'50%', background:'#ece8d6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:'#9a9a9b'}}, n+1),
      E('div', {style:{display:'flex', gap:'4px'}}, E('button', {cls:'wlv-chip', title:'Save this outfit to slot '+(n+1), onclick:()=>{ const arr = [...(p.avPresets||[null,null,null])]; while (arr.length < 3) arr.push(null); const pp0 = P(); arr[n] = {...cur(), _pet:(pp0.pets||{}).active||null, _title:pp0.title||''}; api.setP({avPresets:arr}); api.toast('OUTFIT + PET + TITLE SAVED TO SLOT '+(n+1)); api.sfx('blip'); render(); }}, 'Save'),
        ps ? E('button', {cls:'wlv-chip on', title:'Wear outfit '+(n+1), onclick:()=>{ const pa = api.norm(ps), fixed = {}; AVK.forEach(k => { fixed[k] = AVP[k].multi ? AVP[k].o.reduce((m, o, i) => (pa[k] & (1<<i)) && V.status(P(), k, i, adm()).own ? m | (1<<i) : m, 0) : V.status(P(), k, pa[k], adm()).own ? pa[k] : cur()[k]; }); const pp1 = P(), pt = {}; if (ps._pet && window.WLH && window.WLH.owns(pp1, ps._pet)) pt.pets = {...window.WLH.norm(pp1), active:ps._pet}; if (ps._title != null) pt.title = ps._title; api.setP({avatar:fixed, ...pt}); tryOn = null; api.sfx('blip'); render(); }}, 'Wear') : null))); });
    const pins = api.pins();
    const info = E('div', {style:{display:'flex', flexDirection:'column', gap:'10px', minWidth:0}},
      E('div', {cls:'wlv-small'}, 'Level '+lvl+' · '+V.allOwned(p, adm())+' / '+V.totalCount()+' items owned · 🎟 '+fmt(p.tickets||0)+' to spend in the Avatar Shop'),
      E('div', {style:{display:'flex', gap:'6px', flexWrap:'wrap'}}, E('button', {cls:'wlv-btn alt', onclick:randomize}, '🎲 Randomize'), E('button', {cls:'wlv-btn alt', onclick:()=>api.openAch()}, '🏅 Titles & showcase')),
      E('div', null, E('div', {style:{fontSize:'11px', fontWeight:800, letterSpacing:'.12em', color:'#AB2372', marginBottom:'4px'}}, 'OUTFIT PRESETS'), presets),
      pins.length ? E('div', {style:{display:'flex', gap:'6px', alignItems:'center'}}, E('span', {cls:'wlv-small'}, 'Showcase:'), ...pins.map(x => { const b = E('span', {title:x.name, style:{width:'30px', height:'30px', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'16px', background:x.g}}, x.e); return b; })) : null,
      msg ? E('div', {style:{fontWeight:700, color:'#B3001B', fontSize:'13px'}}, msg) : null);
    wrap.appendChild(E('div', {cls:'wlv-top'}, prev, info));
    // tabs
    const tb = E('div', {style:{display:'flex', gap:'6px', flexWrap:'wrap', margin:'12px 0 8px'}});
    [...TABS, 'cursor'].forEach(k => { if (k == 'skin' && a.body) return; if (k !== 'skin' && k !== 'cursor' && AVP[k].kidOnly && a.body) return;
      tb.appendChild(E('button', {cls:'wlv-chip'+(tab==k?' on':''), onclick:()=>{ tab = k; tryOn = null; render(); }}, k=='cursor' ? 'Cursor' : AVP[k].t)); });
    wrap.appendChild(tb);
    if (tab === 'cursor') { const g = E('div', {cls:'wlv-grid'}); CURSORS.forEach(c => { const ok = adm() || lvl >= c.r, on = (p.cursor||'') == c.id;
        g.appendChild(E('button', {cls:'wlv-opt'+(on?' on':'')+(ok?'':' lock'), style:{'--rc':'#9aa5a1'}, onclick:()=>{ if (!ok) return api.sfx('bad'); api.setP({cursor:c.id}); api.applyCursor(c.id); api.sfx('blip'); render(); }},
          E('img', {src: api.cursorImg(c), alt:''}), E('span', {cls:'wlv-nm'}, c.n), E('span', {cls:'wlv-lk'}, ok ? (on ? 'Selected' : '') : '🔒 Achievement level '+c.r))); });
      wrap.appendChild(g); return; }
    if (AVP[tab].note) wrap.appendChild(E('div', {cls:'wlv-small', style:{marginBottom:'6px'}}, AVP[tab].note));
    const g = E('div', {cls:'wlv-grid'});
    AVP[tab].o.forEach((o, i) => { const st = V.status(p, tab, i, adm()), multi = AVP[tab].multi, on = multi ? !!(a[tab] & (1<<i)) : a[tab] === i, t = tryOn && tryOn[0]==tab && tryOn[1]==i;
      const lookI = {...a, [tab]: multi ? (1<<i) : i}; if (tab=='hair' || tab=='hairc') { lookI.hat = 0; if (tab=='hairc' && !lookI.hair) lookI.hair = 1; }
      const b = E('button', {cls:'wlv-opt'+(on?' on':'')+(st.own?'':' lock')+(t?' try':''), style:{'--rc':st.rc}, title: o.n+' · '+st.rn+' · '+st.label,
          onclick:()=>{ if (st.own) return equip(tab, i); tryOn = [tab, i]; api.sfx('blip'); render(); }},
        E('span', {cls:'wlv-rar'}), E('img', {src: svg(lookI, lvl, FULL.includes(tab) ? {full:true} : null), alt:'', style: FULL.includes(tab) ? {height:'84px', width:'56px'} : null}), E('span', {cls:'wlv-nm'}, o.n),
        E('span', {cls:'wlv-lk'}, st.own ? (on ? (AVP[tab].multi ? 'On · tap to remove' : 'Wearing') : (AVP[tab].multi ? 'Tap to add' : '')) : st.how === 'shop' ? '🎟 '+fmt(st.price) : '🔒 '+st.label));
      g.appendChild(b); });
    wrap.appendChild(g);
    wrap.appendChild(E('div', {cls:'wlv-small', style:{marginTop:'10px'}}, 'Tap a locked item to try it on. Starter items are free; others come from the Avatar Shop (tickets), achievements, Rebirths, Prestige, or Wilderland prizes. The colored dot shows its rarity. Other players see your avatar on the leaderboard, in chat and on the floor.')); };
  render();
  return () => wrap.remove(); };

window.WLAV = V;
})();
