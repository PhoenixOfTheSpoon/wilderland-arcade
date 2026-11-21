// Wilderland Arcade · PETS & HOMES (window.WLH)
// 45 pets (levels up to 500, perks, care, collars, hats, colour variants, 10 forms from Lv 10 to Lv 500), a Pet Dex, ticket-only pet eggs,
// a Home that grows from Forest Cabin to Sky Citadel with a grid room editor, furniture sets, trophy shelves, a pet corner and a yard,
// plus emotes and rare mounts. Everything here is permanent: Rebirth never touches P.pets, P.home, P.emotes or P.mounts.
(function(){
const H = {};
const TAU = Math.PI*2;
const fmt = n => window.WLP ? window.WLP.fmt(n) : String(Math.round(n));
const nice = x => { x = Number(x); if (x !== x) return 0; if (!(x < 1e300)) return 1e300; if (x < 100) return Math.round(x); const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.min(1e300, Math.round(x / p) * p); };
const ONE_R = {n:'THE ONE', c:'#111111'};   // the final pet rarity (pets only)
const RAR = () => [...((window.WLP && window.WLP.R) || RAR0).slice(0, 8), ONE_R];
const RAR0 = [{n:'Common',c:'#9aa5a1'},{n:'Uncommon',c:'#00B451'},{n:'Rare',c:'#2fa8e0'},{n:'Epic',c:'#a64be0'},{n:'Legendary',c:'#f2a900'},{n:'Mythic',c:'#ff4539'},{n:'Cosmic',c:'#4a5cff'},{n:'Wilderland',c:'#ff5fd2'}];
const need = P => window.WLP ? window.WLP.rebirthNeed(P) : 1e7;
const freeStars = P => Math.max(0, (P.stars||0) - (P.starsSpent||0));
const prestige = P => window.WLE ? window.WLE.prestige(P) : 0;
const st = (P, k) => Math.max(((P.stats||{}).max||{})[k]||0, ((P.stats||{}).sum||{})[k]||0);
const lowFx = () => !!(window.Arcade && window.Arcade.lowFx);
const an = (attr, vals, dur) => lowFx() ? '' : '<animate attributeName="'+attr+'" values="'+vals+'" dur="'+dur+'s" repeatCount="indefinite"/>';
const at = (type, vals, dur, origin) => lowFx() ? '' : '<animateTransform attributeName="transform" type="'+type+'" values="'+vals+'" dur="'+dur+'s" repeatCount="indefinite" additive="sum"/>';

// =====================================================================================================================
// PET ART — every species is drawn around (0,0), about 40 units across; palette c = [main, accent, belly]
// =====================================================================================================================
const eyes = (y, sep, r, col) => { r = r||2.6; col = col||'#121313';
  const e = x => '<g transform="translate('+x+' '+y+')"><g>'+(lowFx()?'':'<animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 .1;1 1" keyTimes="0;.92;.96;1" dur="4.2s" repeatCount="indefinite"/>')+'<circle r="'+r+'" fill="'+col+'"/><circle cx="'+(-r*.35)+'" cy="'+(-r*.4)+'" r="'+(r*.38)+'" fill="#fff"/></g></g>';
  return e(-sep)+e(sep); };
const cheeks = (y, sep) => '<circle cx="'+(-sep)+'" cy="'+y+'" r="2.3" fill="#ff8fb3" opacity=".55"/><circle cx="'+sep+'" cy="'+y+'" r="2.3" fill="#ff8fb3" opacity=".55"/>';
const smile = y => '<path d="M-2.5 '+y+'q2.5 2.2 5 0" stroke="#121313" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
const shade = (id, a, b) => '<radialGradient id="'+id+'" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></radialGradient>';
const dk = (hex, f) => { const m = /^#([0-9a-f]{6})$/i.exec(hex||''); if (!m) return hex; const n = parseInt(m[1],16), c = k => Math.max(0, Math.min(255, Math.round(((n>>k)&255)*f))); return '#'+[c(16),c(8),c(0)].map(v=>v.toString(16).padStart(2,'0')).join(''); };
const wag = (o, d) => '<g>'+at('rotate', '-12 '+o+';14 '+o+';-12 '+o, d||1.1)+'';
const SP = {
  // THE ONE: a pitch-black crowned dragon with bat wings, ice-blue horns, golden eyes and a pink scarf
  theone: c => '<g>'+at('rotate','0 -9 -2;-16 -9 -2;0 -9 -2',.8)+'<path d="M-9 -2q-8 -16 -24 -12q4 4 2 7q-6 0 -8 4q6 0 6 5q-5 1 -5 5q10 -4 16 0q4 -6 13 -4z" fill="#1d1d26" stroke="#4a4a5c" stroke-width="1"/><path d="M-20 -6l3 4l-3 4l-3 -4z" fill="#64CDF5"/></g>'
    +'<g>'+at('rotate','0 9 -2;16 9 -2;0 9 -2',.8)+'<path d="M9 -2q8 -16 24 -12q-4 4 -2 7q6 0 8 4q-6 0 -6 5q5 1 5 5q-10 -4 -16 0q-4 -6 -13 -4z" fill="#1d1d26" stroke="#4a4a5c" stroke-width="1"/><path d="M20 -6l3 4l-3 4l-3 -4z" fill="#64CDF5"/></g>'
    +wag('12 12',1.3)+'<path d="M11 12q13 3 13 -8l4 -2l-2 5l-3 -1q0 11 -12 10z" fill="#0b0b10"/></g>'
    +'<path d="M-9 -9q-6 -6 -4 -14q3 6 8 9zM9 -9q6 -6 4 -14q-3 6 -8 9z" fill="#64CDF5"/>'
    +'<ellipse cx="0" cy="4" rx="14" ry="13" fill="#0b0b10"/><ellipse cx="-4" cy="-2" rx="6" ry="4" fill="#ffffff" opacity=".08"/><ellipse cx="0" cy="9" rx="8" ry="6" fill="#1c1c26"/>'
    +'<circle cx="-5" cy="0" r="3.4" fill="#F9BF01"/><circle cx="5" cy="0" r="3.4" fill="#F9BF01"/><ellipse cx="-5" cy="0" rx="1" ry="2.6" fill="#000"/><ellipse cx="5" cy="0" rx="1" ry="2.6" fill="#000"/><circle cx="-4" cy="-1.2" r=".7" fill="#fff"/><circle cx="6" cy="-1.2" r=".7" fill="#fff"/>'
    +'<path d="M-3 6.5q3 2 6 0" stroke="#4a4a5c" stroke-width="1" fill="none"/><path d="M1 7l1 2l1 -2z" fill="#fff"/>'
    +'<path d="M-10 12q10 6 20 0l1 3q-11 6 -22 0z" fill="#EA55AB"/><path d="M5 14l4 7l3 -1l-3 -6z" fill="#EA55AB"/>'
    +'<path d="M-9 -11l-1 -9l5 4l5 -7l5 7l5 -4l-1 9z" fill="#F9BF01" stroke="#c48a00" stroke-width="1"/><circle cx="0" cy="-15" r="1.8" fill="#EA55AB"/>',
  gopher: c => '<ellipse cx="0" cy="4" rx="15" ry="14" fill="url(#pg)"/><circle cx="-11" cy="-8" r="4" fill="'+c[1]+'"/><circle cx="11" cy="-8" r="4" fill="'+c[1]+'"/><ellipse cx="0" cy="8" rx="9" ry="8" fill="'+c[2]+'"/>'+eyes(-2,5.5)+'<ellipse cx="0" cy="3" rx="2.4" ry="1.7" fill="#5a3a2a"/><rect x="-2" y="5" width="4" height="4" rx="1" fill="#fff"/>'+cheeks(3,9),
  owl: c => '<path d="M-14 -10l4 6M14 -10l-4 6" stroke="'+c[1]+'" stroke-width="4" stroke-linecap="round"/><ellipse cx="0" cy="3" rx="14" ry="17" fill="url(#pg)"/><ellipse cx="0" cy="8" rx="9" ry="10" fill="'+c[2]+'"/><path d="M-14 0q-6 10 0 16M14 0q6 10 0 16" fill="'+c[1]+'"/><circle cx="-5.5" cy="-3" r="5.5" fill="#fff"/><circle cx="5.5" cy="-3" r="5.5" fill="#fff"/>'+eyes(-3,5.5,2.8)+'<path d="M-2 1l2 4l2-4z" fill="#F9BF01"/>',
  frog: c => '<ellipse cx="0" cy="6" rx="17" ry="12" fill="url(#pg)"/><circle cx="-8" cy="-5" r="6" fill="'+c[0]+'"/><circle cx="8" cy="-5" r="6" fill="'+c[0]+'"/>'+eyes(-5,8,3)+'<ellipse cx="0" cy="10" rx="10" ry="6" fill="'+c[2]+'"/><path d="M-6 4q6 4 12 0" stroke="#121313" stroke-width="1.3" fill="none"/>'+cheeks(5,11)+'<ellipse cx="-14" cy="16" rx="5" ry="2.5" fill="'+c[1]+'"/><ellipse cx="14" cy="16" rx="5" ry="2.5" fill="'+c[1]+'"/>',
  fox: c => wag('14 10')+'<path d="M12 10q16 -2 12 -16q-4 8 -14 8z" fill="'+c[0]+'"/><path d="M20 -4q2 -3 4 -2q0 4 -3 5z" fill="#fff"/></g><path d="M-13 -4l-3 -13l10 7zM13 -4l3 -13l-10 7z" fill="'+c[0]+'"/><path d="M-12 -6l-2 -7l5 4zM12 -6l2 -7l-5 4z" fill="'+c[1]+'"/><ellipse cx="0" cy="4" rx="14" ry="13" fill="url(#pg)"/><path d="M-9 4q9 14 18 0q-4 10 -9 10q-5 0 -9 -10z" fill="'+c[2]+'"/>'+eyes(0,5.5)+'<circle cx="0" cy="6" r="1.8" fill="#121313"/>'+cheeks(5,9),
  moth: c => '<g>'+at('scale','1 1;.85 1;1 1',.6)+'<path d="M-2 0q-20 -20 -18 4q2 12 18 0zM2 0q20 -20 18 4q-2 12 -18 0z" fill="'+c[1]+'"/><circle cx="-11" cy="-2" r="3" fill="'+c[2]+'"/><circle cx="11" cy="-2" r="3" fill="'+c[2]+'"/></g><ellipse cx="0" cy="4" rx="6" ry="11" fill="url(#pg)"/><path d="M-2 -6q-4 -8 -8 -8M2 -6q4 -8 8 -8" stroke="'+c[1]+'" stroke-width="1.4" fill="none"/>'+eyes(-2,2.6,1.8),
  rat: c => wag('12 10',1.4)+'<path d="M12 10q14 4 12 -8" stroke="#ff9fbf" stroke-width="2.2" fill="none" stroke-linecap="round"/></g><circle cx="-10" cy="-8" r="6.5" fill="'+c[0]+'"/><circle cx="10" cy="-8" r="6.5" fill="'+c[0]+'"/><circle cx="-10" cy="-8" r="3.6" fill="#ff9fbf"/><circle cx="10" cy="-8" r="3.6" fill="#ff9fbf"/><ellipse cx="0" cy="5" rx="13" ry="12" fill="url(#pg)"/><ellipse cx="0" cy="9" rx="7" ry="6" fill="'+c[2]+'"/>'+eyes(1,4.5)+'<circle cx="0" cy="6" r="1.6" fill="#ff7aa8"/><path d="M-3 7l-8 -1M-3 8l-8 2M3 7l8 -1M3 8l8 2" stroke="#121313" stroke-width=".6"/>',
  golem: c => '<rect x="-15" y="-10" width="30" height="26" rx="6" fill="url(#pg)"/><rect x="-19" y="0" width="7" height="12" rx="3" fill="'+c[1]+'"/><rect x="12" y="0" width="7" height="12" rx="3" fill="'+c[1]+'"/><path d="M-10 -6l5 3M6 10l5 -2M-6 12l3 -3" stroke="'+dk(c[0],.6)+'" stroke-width="1.4"/><path d="M-4 -14l4 -6l4 6z" fill="'+c[2]+'">'+an('opacity','1;.5;1',1.6)+'</path><circle cx="-5" cy="0" r="2.6" fill="'+c[2]+'">'+an('opacity','1;.4;1',2)+'</circle><circle cx="5" cy="0" r="2.6" fill="'+c[2]+'">'+an('opacity','1;.4;1',2)+'</circle><path d="M-4 6h8" stroke="#121313" stroke-width="1.4"/>',
  bird: c => '<path d="M-4 -12q4 -8 8 -4q-2 0 -4 4" fill="'+c[1]+'"/><g>'+at('rotate','0 -12 2;-18 -12 2;0 -12 2',.5)+'<path d="M-12 2q-12 -4 -10 8q6 2 10 -2z" fill="'+c[1]+'"/></g><g>'+at('rotate','0 12 2;18 12 2;0 12 2',.5)+'<path d="M12 2q12 -4 10 8q-6 2 -10 -2z" fill="'+c[1]+'"/></g><ellipse cx="0" cy="3" rx="13" ry="13" fill="url(#pg)"/><ellipse cx="0" cy="8" rx="8" ry="7" fill="'+c[2]+'"/>'+eyes(-1,5)+'<path d="M-2.5 3l2.5 4l2.5 -4z" fill="#F9BF01"/>',
  cat: c => wag('12 12',1.6)+'<path d="M12 12q12 2 10 -12q-1 -3 -3 0q1 8 -8 7z" fill="'+c[0]+'"/></g><path d="M-13 -2l-1 -14l10 8zM13 -2l1 -14l-10 8z" fill="'+c[0]+'"/><path d="M-12 -4l0 -8l5 5zM12 -4l0 -8l-5 5z" fill="#ff9fbf"/><ellipse cx="0" cy="5" rx="14" ry="12.5" fill="url(#pg)"/><ellipse cx="0" cy="9" rx="7" ry="6" fill="'+c[2]+'"/>'+eyes(1,5.5,2.6,'#3a7a2a')+'<path d="M-1.5 5l1.5 1.5l1.5 -1.5z" fill="#ff7aa8"/><path d="M-4 7l-9 -1M-4 8l-9 2M4 7l9 -1M4 8l9 2" stroke="#121313" stroke-width=".5"/>',
  dragon: c => '<g>'+at('rotate','0 -10 -2;-14 -10 -2;0 -10 -2',.9)+'<path d="M-10 -2q-16 -16 -20 2q8 -4 10 4z" fill="'+c[1]+'"/></g><g>'+at('rotate','0 10 -2;14 10 -2;0 10 -2',.9)+'<path d="M10 -2q16 -16 20 2q-8 -4 -10 4z" fill="'+c[1]+'"/></g>'+wag('12 12',1.3)+'<path d="M12 12q12 2 12 -8l4 -2l-2 5l-3 -1q0 10 -11 10z" fill="'+c[0]+'"/></g><path d="M-8 -10l-3 -8l6 5zM8 -10l3 -8l-6 5z" fill="'+c[2]+'"/><ellipse cx="0" cy="4" rx="14" ry="13" fill="url(#pg)"/><ellipse cx="0" cy="9" rx="8" ry="7" fill="'+c[2]+'"/><path d="M-3 -9l3 -4l3 4z" fill="'+c[1]+'"/>'+eyes(0,5.5,2.7,'#121313')+'<circle cx="-2" cy="5" r=".9" fill="#121313"/><circle cx="2" cy="5" r=".9" fill="#121313"/>'+cheeks(4,9),
  bunny: c => '<g>'+at('rotate','0 -5 -10;-6 -5 -10;0 -5 -10',2.2)+'<ellipse cx="-5" cy="-18" rx="4" ry="11" fill="'+c[0]+'"/><ellipse cx="-5" cy="-17" rx="2" ry="7" fill="#ff9fbf"/></g><ellipse cx="5" cy="-18" rx="4" ry="11" fill="'+c[0]+'"/><ellipse cx="5" cy="-17" rx="2" ry="7" fill="#ff9fbf"/><ellipse cx="0" cy="5" rx="13" ry="12" fill="url(#pg)"/><circle cx="12" cy="10" r="4" fill="#fff"/>'+eyes(2,5)+'<path d="M-1.5 6l1.5 1.5l1.5 -1.5z" fill="#ff7aa8"/>'+cheeks(7,8),
  turtle: c => '<ellipse cx="-14" cy="12" rx="4" ry="3" fill="'+c[2]+'"/><ellipse cx="14" cy="12" rx="4" ry="3" fill="'+c[2]+'"/><circle cx="16" cy="0" r="6" fill="'+c[2]+'"/>'+'<g transform="translate(16 -1)">'+eyes(0,2.2,1.4)+'</g><path d="M-16 8q0 -20 16 -20q16 0 16 20z" fill="url(#pg)"/><path d="M-8 -4l8 -4l8 4l-2 8h-12z" fill="'+c[1]+'" opacity=".8"/><path d="M-16 8h32" stroke="'+dk(c[0],.6)+'" stroke-width="2"/>',
  slime: c => '<g>'+at('scale','1 1;1.06 .94;1 1',1.4)+'<path d="M-16 14q-2 -26 16 -26q18 0 16 26z" fill="url(#pg)" opacity=".92"/><ellipse cx="-6" cy="-6" rx="4" ry="2.4" fill="#fff" opacity=".6"/>'+eyes(2,5.5,3)+smile(7)+'</g>',
  axolotl: c => '<path d="M-14 -4l-8 -4M-14 0l-9 0M-14 4l-8 4M14 -4l8 -4M14 0l9 0M14 4l8 4" stroke="'+c[1]+'" stroke-width="2.4" stroke-linecap="round">'+an('stroke-width','2.4;3.2;2.4',1.2)+'</path><ellipse cx="0" cy="2" rx="15" ry="11" fill="url(#pg)"/>'+eyes(0,6,2.2)+smile(4)+cheeks(4,10),
  bat: c => '<g>'+at('rotate','0 -10 0;-20 -10 0;0 -10 0',.4)+'<path d="M-9 0q-10 -10 -20 -4q4 2 3 6q4 -2 6 2q4 -3 11 -1z" fill="'+c[1]+'"/></g><g>'+at('rotate','0 10 0;20 10 0;0 10 0',.4)+'<path d="M9 0q10 -10 20 -4q-4 2 -3 6q-4 -2 -6 2q-4 -3 -11 -1z" fill="'+c[1]+'"/></g><path d="M-8 -6l-2 -10l7 6zM8 -6l2 -10l-7 6z" fill="'+c[0]+'"/><ellipse cx="0" cy="3" rx="10" ry="10" fill="url(#pg)"/>'+eyes(1,4,2.2,'#ff4a6a')+'<path d="M-2 6l1 2l1 -2M1 6l1 2l1 -2" fill="#fff"/>',
  snail: c => '<path d="M-18 14q0 -6 8 -6h22q4 0 4 6z" fill="'+c[2]+'"/><path d="M10 8q0 -10 6 -14" stroke="'+c[2]+'" stroke-width="3" fill="none"/><circle cx="16" cy="-7" r="2" fill="'+c[2]+'"/><circle cx="-2" cy="0" r="12" fill="url(#pg)"/><path d="M-2 0m-8 0a8 8 0 1 1 8 8a5 5 0 1 1 -5 -5a2 2 0 1 1 2 2" stroke="'+c[1]+'" stroke-width="2" fill="none"/><g transform="translate(14 8)">'+eyes(0,2.2,1.4)+'</g>',
  puppy: c => wag('12 10',.5)+'<path d="M12 10q10 -2 8 -10" stroke="'+c[0]+'" stroke-width="4" fill="none" stroke-linecap="round"/></g><ellipse cx="0" cy="4" rx="14" ry="13" fill="url(#pg)"/><ellipse cx="-13" cy="0" rx="4" ry="9" fill="'+c[1]+'"/><ellipse cx="13" cy="0" rx="4" ry="9" fill="'+c[1]+'"/><ellipse cx="0" cy="9" rx="7" ry="5.5" fill="'+c[2]+'"/>'+eyes(0,5)+'<ellipse cx="0" cy="5" rx="2.4" ry="1.7" fill="#121313"/><path d="M0 7q0 3 2 3" stroke="#ff7aa8" stroke-width="1.6" fill="none"/>',
  bear: c => '<circle cx="-11" cy="-9" r="5" fill="'+c[0]+'"/><circle cx="11" cy="-9" r="5" fill="'+c[0]+'"/><circle cx="-11" cy="-9" r="2.4" fill="'+c[1]+'"/><circle cx="11" cy="-9" r="2.4" fill="'+c[1]+'"/><ellipse cx="0" cy="4" rx="15" ry="13.5" fill="url(#pg)"/><ellipse cx="0" cy="7" rx="6" ry="4.5" fill="'+c[2]+'"/>'+eyes(-1,6)+'<ellipse cx="0" cy="5" rx="2.2" ry="1.6" fill="#121313"/>'+cheeks(5,10),
  penguin: c => '<ellipse cx="0" cy="3" rx="13" ry="16" fill="url(#pg)"/><ellipse cx="0" cy="7" rx="8.5" ry="11" fill="'+c[2]+'"/><g>'+at('rotate','0 -12 0;-16 -12 0;0 -12 0',.8)+'<path d="M-12 -2q-8 8 -4 14z" fill="'+c[0]+'"/></g><g>'+at('rotate','0 12 0;16 12 0;0 12 0',.8)+'<path d="M12 -2q8 8 4 14z" fill="'+c[0]+'"/></g>'+eyes(-5,4.5,2.2)+'<path d="M-2.5 -1l2.5 3l2.5 -3z" fill="'+c[1]+'"/><ellipse cx="-5" cy="19" rx="3.5" ry="1.6" fill="'+c[1]+'"/><ellipse cx="5" cy="19" rx="3.5" ry="1.6" fill="'+c[1]+'"/>'+cheeks(0,8),
  jelly: c => '<g>'+at('translate','0 1;0 -2;0 1',2)+'<path d="M-9 4q-2 10 -1 16M-3 4q1 10 -1 18M3 4q-1 10 1 18M9 4q2 10 1 16" stroke="'+c[1]+'" stroke-width="2" fill="none" opacity=".8"/><path d="M-15 6q0 -20 15 -20q15 0 15 20q-8 -3 -15 0q-7 -3 -15 0z" fill="url(#pg)" opacity=".85"/>'+eyes(-2,5,2.2)+smile(2)+'</g>',
  deer: c => '<path d="M-7 -10q-4 -8 -8 -10M-10 -16l-4 1M7 -10q4 -8 8 -10M10 -16l4 1" stroke="'+c[1]+'" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="-13" cy="-4" rx="5" ry="2.6" fill="'+c[0]+'" transform="rotate(-20 -13 -4)"/><ellipse cx="13" cy="-4" rx="5" ry="2.6" fill="'+c[0]+'" transform="rotate(20 13 -4)"/><ellipse cx="0" cy="4" rx="12.5" ry="13" fill="url(#pg)"/><circle cx="-6" cy="12" r="1.3" fill="#fff"/><circle cx="7" cy="10" r="1.2" fill="#fff"/><ellipse cx="0" cy="8" rx="5.5" ry="4.5" fill="'+c[2]+'"/>'+eyes(0,5)+'<ellipse cx="0" cy="6" rx="1.8" ry="1.3" fill="#121313"/>',
  hedgehog: c => '<path d="M-16 8q-4 -10 2 -16l2 4l3 -8l3 6l4 -7l3 7l4 -6l2 7l4 -4q4 8 1 17z" fill="'+c[1]+'"/><ellipse cx="2" cy="6" rx="12" ry="10" fill="'+c[2]+'"/>'+eyes(3,4.5)+'<circle cx="12" cy="7" r="2" fill="#121313"/>'+cheeks(8,7),
  raccoon: c => wag('12 10',1.3)+'<path d="M12 10q14 0 12 -12" stroke="'+c[0]+'" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M18 2l4 -1M20 -4l4 -1" stroke="'+c[1]+'" stroke-width="2.4"/></g><path d="M-12 -2l-2 -11l8 6zM12 -2l2 -11l-8 6z" fill="'+c[0]+'"/><ellipse cx="0" cy="4" rx="14" ry="12.5" fill="url(#pg)"/><path d="M-12 0q6 -4 12 0q6 -4 12 0q-2 6 -6 5q-6 -2 -6 -2q0 0 -6 2q-4 1 -6 -5z" fill="'+c[1]+'"/>'+eyes(0,5.5,2.3,'#fff')+'<ellipse cx="0" cy="8" rx="5" ry="4" fill="'+c[2]+'"/><circle cx="0" cy="6" r="1.6" fill="#121313"/>',
  panda: c => '<circle cx="-11" cy="-9" r="5" fill="'+c[1]+'"/><circle cx="11" cy="-9" r="5" fill="'+c[1]+'"/><ellipse cx="0" cy="4" rx="15" ry="13.5" fill="url(#pg)"/><ellipse cx="-6" cy="0" rx="4" ry="5" fill="'+c[1]+'" transform="rotate(-20 -6 0)"/><ellipse cx="6" cy="0" rx="4" ry="5" fill="'+c[1]+'" transform="rotate(20 6 0)"/>'+eyes(0,6,1.8,'#fff')+'<ellipse cx="0" cy="6" rx="2.2" ry="1.6" fill="#121313"/>'+cheeks(7,10),
  wisp: c => '<g>'+at('translate','0 2;0 -3;0 2',1.8)+'<path d="M-12 8q-4 -22 12 -22q16 0 12 22q-4 -4 -6 2q-3 -6 -6 0q-3 -6 -6 0q-2 -6 -6 -2z" fill="url(#pg)" opacity=".9"/>'+eyes(-3,4.5,2.4)+smile(2)+'</g>',
};
const SPECIES = Object.keys(SP);
// variants: colour variants unlock at pet Lv 5 and Lv 20
const tint = (c, v) => v == 1 ? [c[1], c[0], c[2]] : v == 2 ? ['#F9BF01', '#ffffff', '#fff3b0'] : c;
const HATS = [{n:'No hat'},{n:'Bow',lv:1},{n:'Party Hat',lv:3},{n:'Cap',lv:6},{n:'Flower',lv:10},{n:'Wizard Hat',lv:18},{n:'Crown',lv:30},{n:'Halo',lv:100},{n:'Star Crown',lv:300}];
const COLLARS = ['','#FF4539','#00B451','#64CDF5','#F9BF01','#EA55AB','#8a4be0','#121313'];
const hatSVG = (h, y) => { y = y||-14; switch(h) {
  case 1: return '<path d="M-6 '+(y+2)+'l-6 -4v8zM6 '+(y+2)+'l6 -4v8z" fill="#EA55AB"/><circle cx="0" cy="'+(y+2)+'" r="2.4" fill="#ff8fc8"/>';
  case 2: return '<path d="M-6 '+(y+3)+'l6 -14l6 14z" fill="#64CDF5"/><path d="M-4 '+(y-1)+'l8 0M-2 '+(y-6)+'l4 0" stroke="#F9BF01" stroke-width="1.6"/><circle cx="0" cy="'+(y-11)+'" r="2" fill="#F9BF01"/>';
  case 3: return '<path d="M-9 '+(y+3)+'q0 -9 9 -9q9 0 9 9z" fill="#FF4539"/><path d="M5 '+(y+2)+'h9v2h-9z" fill="#c42b22"/>';
  case 4: return '<circle cx="7" cy="'+(y+1)+'" r="2.4" fill="#F9BF01"/>'+[0,1,2,3,4].map(i=>'<circle cx="'+(7+Math.cos(i*1.26)*3.6)+'" cy="'+(y+1+Math.sin(i*1.26)*3.6)+'" r="2.2" fill="#ff8fc8"/>').join('');
  case 5: return '<path d="M-10 '+(y+3)+'h20l-10 -18z" fill="#5B2A86"/><circle cx="-1" cy="'+(y-5)+'" r="1.2" fill="#F9BF01"/><circle cx="3" cy="'+(y-1)+'" r="1" fill="#F9BF01"/>';
  case 6: return '<path d="M-8 '+(y+3)+'l-1 -9l5 4l4 -7l4 7l5 -4l-1 9z" fill="#F9BF01" stroke="#c48a00" stroke-width="1"/><circle cx="0" cy="'+(y-1)+'" r="1.5" fill="#FF4539"/>';
  case 7: return '<ellipse cx="0" cy="'+(y-5)+'" rx="9" ry="2.8" fill="none" stroke="#fff6b0" stroke-width="2.2"/><ellipse cx="0" cy="'+(y-5)+'" rx="9" ry="2.8" fill="none" stroke="#F9BF01" stroke-width=".8"/>';
  case 8: return '<path d="M-9 '+(y+3)+'l-2 -10l5 4l2 -8l4 6l4 -6l2 8l5 -4l-2 10z" fill="#bff0ff" stroke="#64CDF5" stroke-width="1"/><path d="M0 '+(y-12)+'l1.4 2.8l3 .4l-2.2 2l.6 3l-2.8 -1.5l-2.8 1.5l.6 -3l-2.2 -2l3 -.4z" fill="#F9BF01"/>';
  default: return ''; } };
// Evolutions: Lv 10 sparkle markings · Lv 25 grown up + glowing crest · Lv 50 legendary aura and halo
// Pets go to Lv 500 with 10 forms. Lv 100+ forms add their own looks: Elder aura, orbiting stars, light wings, star ring, rainbow aura, leaf crown.
const MAXLV = 500, EVO_AT = [0, 10, 25, 50, 100, 150, 200, 300, 400, 500];
const evoOf = lv => { let e = 0; for (let i = 1; i < EVO_AT.length; i++) if (lv >= EVO_AT[i]) e = i; return e; };
const EVO_N = ['Baby', 'Young', 'Grown', 'Legendary', 'Elder', 'Mythic', 'Ascended', 'Celestial', 'Eternal', 'Wilderland Spirit'];
H.MAXLV = MAXLV; H.EVO_AT = EVO_AT; H.EVO_N = EVO_N; H.evoOf = evoOf;
H.nextEvo = lv => { const e = evoOf(lv); return e < EVO_AT.length-1 ? {lv:EVO_AT[e+1], n:EVO_N[e+1]} : null; };
let gid = 0;
H.petInner = (pet, o) => { o = o || {}; const lv = o.lv || 1, ev = evoOf(lv), c = tint(pet.c, o.variant|0), id = 'pg'+(++gid);
  let s = '<defs>'+shade(id, c[0] == '#ffffff' ? '#ffffff' : dk(c[0], 1.25), dk(c[0], .78))+(ev >= 8 ? '<radialGradient id="'+id+'rb"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".6" stop-color="#ff5fd2"/><stop offset=".8" stop-color="#64CDF5"/><stop offset="1" stop-color="#D5F367" stop-opacity="0"/></radialGradient>' : '')+'</defs>';
  if (pet.r >= 8) s += '<circle r="27" fill="#2a0a4a" opacity=".35">'+an('r','25;29;25',2.4)+'</circle><circle r="23" fill="none" stroke="#64CDF5" stroke-width="1" stroke-dasharray="1 5" opacity=".9">'+an('stroke-dashoffset','0;12',1.5)+'</circle>';
  if (ev >= 8) s += '<circle r="29" fill="url(#'+id+'rb)" opacity=".55">'+an('opacity','.35;.65;.35',2.5)+'</circle>';
  if (ev >= 6) { const wc = ev >= 9 ? '#D5F367' : '#ffffff'; s += '<g fill="'+wc+'" stroke="'+(ev >= 9 ? '#00B451' : '#b48cff')+'" stroke-width="1" opacity=".9"><path d="M-6 0q-17 -16 -24 -4q8 -2 11 6q-7 0 -9 7q10 -3 22 -6z"/><path d="M6 0q17 -16 24 -4q-8 -2 -11 6q7 0 9 7q-10 -3 -22 -6z"/></g>'; }
  if (ev >= 4) s += '<circle r="26" fill="none" stroke="'+(ev >= 9 ? '#00B451' : ev >= 5 ? '#b48cff' : '#64CDF5')+'" stroke-width="1.6" stroke-dasharray="3 4" opacity=".8">'+an('stroke-dashoffset','0;14',2)+'</circle>';
  if (ev >= 3) s += '<circle r="24" fill="'+(pet.r >= 6 ? '#ff5fd2' : ev >= 9 ? '#D5F367' : '#F9BF01')+'" opacity=".22">'+an('r','22;26;22',2)+'</circle>';
  if (ev >= 2) s += '<circle r="20" fill="#fff" opacity=".12"/>';
  const body = SP[pet.sp](c).replace(/url\(#pg\)/g, 'url(#'+id+')');
  s += '<g transform="scale('+(1 + Math.min(ev, 5)*.05)+')">'+body;
  if (ev >= 1) s += '<path d="M-9 10l1 -2l1 2l2 1l-2 1l-1 2l-1 -2l-2 -1zM8 -2l.8 -1.6l.8 1.6l1.6 .8l-1.6 .8l-.8 1.6l-.8 -1.6l-1.6 -.8z" fill="#fff" opacity=".85">'+an('opacity','.85;.2;.85',1.4)+'</path>';
  if (ev >= 2) s += '<path d="M-4 -15l4 -6l4 6z" fill="'+(pet.r >= 6 ? '#ff5fd2' : c[1])+'" opacity=".9"/>';
  if (ev >= 3 && ev < 9) s += '<ellipse cx="0" cy="-21" rx="8" ry="2.4" fill="none" stroke="'+(ev >= 7 ? '#ffffff' : '#F9BF01')+'" stroke-width="1.6"/>';
  if (ev >= 9) s += '<path d="M-9 -19q-3 -6 2 -8q0 4 3 5q0 -6 4 -8q4 2 4 8q3 -1 3 -5q5 2 2 8z" fill="#00B451" stroke="#D5F367" stroke-width=".8"/><circle cx="0" cy="-24" r="1.6" fill="#F9BF01"/>';
  if (ev >= 5) { const n = ev >= 7 ? 5 : 2; s += '<g>'+an('transform','0;360',ev >= 7 ? 6 : 9).replace('attributeName','type="rotate" attributeName').replace('<animate','<animateTransform')+Array.from({length:n}, (_, i) => { const a = i/n*Math.PI*2, x = Math.cos(a)*22, y = Math.sin(a)*22; return '<path d="M'+x+' '+(y-3)+'l1 2l2 1l-2 1l-1 2l-1 -2l-2 -1l2 -1z" fill="'+(ev >= 7 ? '#fff6b0' : '#F9BF01')+'"/>'; }).join('')+'</g>'; }
  if (o.collar) s += '<path d="M-9 11q9 5 18 0" stroke="'+COLLARS[o.collar]+'" stroke-width="2.6" fill="none"/><circle cx="0" cy="14" r="1.8" fill="#F9BF01"/>';
  if (o.hat) s += hatSVG(o.hat, -14 - (pet.sp == 'owl' || pet.sp == 'penguin' ? 2 : 0));
  s += '</g>';
  if (o.mood == 'nap') s += '<text x="12" y="-14" font-size="8" font-weight="700" fill="#64CDF5">z'+(lowFx()?'':'<animate attributeName="y" values="-12;-20;-12" dur="2s" repeatCount="indefinite"/>')+'</text>';
  if (o.mood == 'cheer') s += '<text x="-22" y="-12" font-size="10">🎉</text>';
  if (o.mood == 'party') s += '<text x="12" y="-12" font-size="10">⭐</text>';
  return s; };
const svgURI = b => 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'+b+'</svg>');
H.petImg = (pet, o) => svgURI('<g transform="translate(32 36)">'+H.petInner(pet, o)+'</g>');
H.petSil = pet => svgURI('<g transform="translate(32 36)" opacity=".85" filter="url(#s)"><defs><filter id="s"><feColorMatrix type="matrix" values="0 0 0 0 .2  0 0 0 0 .2  0 0 0 0 .22  0 0 0 1 0"/></filter></defs>'+SP[pet.sp](pet.c).replace(/url\(#pg\)/g,'#333')+'</g><text x="32" y="40" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" font-family="sans-serif">?</text>');

// =====================================================================================================================
// THE 46 PETS · rarity 0 Common … 5 Mythic · 6 Cosmic · 7 Wilderland · 8 THE ONE
// src: free · shop · ach 'family:tier' · mine {depth|chests} · boss {stat:n} · pr (Prestige level) · star (Golden Stars, Wilderland only)
// perk: one small bonus that grows with the pet's level (only your ACTIVE pet's perk counts)
// =====================================================================================================================
const P_ = (id, n, sp, c, r, src, perk) => ({id, n, sp, c, r, src, perk});
const PETS = [
  P_('pebble','Pebble the Pocket Gopher','gopher',['#c48a4a','#8D5B1D','#f2d9b0'],0,{free:1},{k:'mineTix'}),
  P_('mossy','Mossy','frog',['#6fbf2a','#3f8a3c','#e9ff9a'],0,{shop:1},{k:'game', g:'crossing'}),
  P_('nutmeg','Nutmeg the Squirrel Pup','puppy',['#d9a066','#8D5B1D','#fbe0c8'],0,{shop:1},{k:'allTix'}),
  P_('dewdrop','Dewdrop Slime','slime',['#7be0d0','#3fb0a0','#fff'],0,{shop:1},{k:'learn'}),
  P_('pip','Pip the Bunny','bunny',['#f2f2f2','#d9d3bd','#ffffff'],0,{shop:1},{k:'critter'}),
  P_('shelly','Shelly','turtle',['#3fae5a','#1f6e3a','#bfe09a'],0,{ach:'rootout_plays:0'},{k:'game', g:'rootout'}),
  P_('rusty','Rusty the Mine Rat','rat',['#a0928a','#6a5a52','#e1d6cf'],1,{mine:{chests:3}},{k:'mineTix'}),
  P_('hootsworth','Sir Hootsworth','owl',['#8D5B1D','#5a3a1c','#f2d9b0'],1,{ach:'eduRight:1'},{k:'learn'}),
  P_('glimmer','Glimmer Moth','moth',['#e9e0ff','#a68cff','#F9BF01'],1,{shop:1},{k:'buff'}),
  P_('biscuit','Biscuit','puppy',['#f2c9a0','#c48a4a','#fff'],1,{shop:1},{k:'game', g:'snake'}),
  P_('whiskers','Captain Whiskers','cat',['#9a9a9b','#5a5a5a','#f2f2f2'],1,{shop:1},{k:'game', g:'breakout'}),
  P_('bramble','Bramble the Hedgehog','hedgehog',['#8D5B1D','#5a3a1c','#f2d9b0'],1,{ach:'variety:1'},{k:'combo'}),
  P_('bandit','Bandit','raccoon',['#8a8a90','#2a2a30','#e8e8ea'],1,{ach:'critters:1'},{k:'critter'}),
  P_('fawn','Clover the Fawn','deer',['#c48a4a','#8D5B1D','#f2e0c8'],1,{shop:1},{k:'allTix'}),
  P_('ember','Ember Pup','fox',['#FF4539','#ffb03a','#fff3b0'],2,{shop:1},{k:'game', g:'td'}),
  P_('quartz','Quartz Golem','golem',['#b8b8c8','#8a8a9a','#bff0ff'],2,{mine:{depth:10}},{k:'gems'}),
  P_('flutter','Flutter the Bluebird','bird',['#64CDF5','#2f7de0','#ffffff'],2,{shop:1},{k:'game', g:'flappy'}),
  P_('noodle','Noodle the Axolotl','axolotl',['#ffb3d1','#EA55AB','#fff'],2,{ach:'collections:1'},{k:'learn'}),
  P_('pudding','Pudding Bear','bear',['#c48a4a','#8D5B1D','#f2d9b0'],2,{shop:1},{k:'buff'}),
  P_('waddles','Waddles','penguin',['#2a3a4a','#F9BF01','#ffffff'],2,{ach:'login:1'},{k:'allTix'}),
  P_('nibbles','Nibbles the Night Bat','bat',['#5B2A86','#3a1a5a','#e9b9f7'],2,{boss:{spaceBoss:3}},{k:'game', g:'space'}),
  P_('gloopy','Gloopy','slime',['#b48cff','#8a4be0','#fff'],2,{shop:1},{k:'combo'}),
  P_('thunder','Baby Thunderbird','bird',['#F9BF01','#2f7de0','#fff3b0'],3,{boss:{tdBoss:5}},{k:'game', g:'td'}),
  P_('cobble','Cobble the Cave Golem','golem',['#7d8a86','#4a5452','#FF8A3C'],3,{boss:{mineGolem:5}},{k:'mineTix'}),
  P_('sprout','Sprout the Forest Wisp','wisp',['#9fffb0','#00B451','#fff'],3,{shop:1},{k:'learn'}),
  P_('marble','Marble the Snail','snail',['#e9b9f7','#a64be0','#c9ccd1'],3,{shop:1},{k:'buff'}),
  P_('mochi','Mochi Panda','panda',['#ffffff','#121313','#fff'],3,{ach:'plays:2'},{k:'allTix'}),
  P_('jiggles','Jiggles the Jelly','jelly',['#7fd8ff','#2fa8e0','#fff'],3,{mine:{depth:30}},{k:'gems'}),
  P_('ziggy','Ziggy Zapcat','cat',['#2a2a30','#F9BF01','#4a4a52'],3,{shop:1},{k:'game', g:'reaction'}),
  P_('frosty','Frosty the Snow Fox','fox',['#e8f6ff','#64CDF5','#ffffff'],4,{mine:{depth:15}},{k:'critter'}),
  P_('magma','Magma Pup','puppy',['#ff6a3a','#5a1a10','#ffd23a'],4,{boss:{mineGolem:20}},{k:'mineTix'}),
  P_('stardust','Stardust Bunny','bunny',['#c8b8ff','#8a4be0','#fff'],4,{ach:'eduStreak:2'},{k:'learn'}),
  P_('crystal','Crystal Turtle','turtle',['#9fd8ff','#64CDF5','#e8f6ff'],4,{shop:1},{k:'gems'}),
  P_('lantern','Lantern Owl','owl',['#F9BF01','#c48a00','#fff3b0'],4,{shop:1},{k:'buff'}),
  P_('coral','Coral the Sea Dragon','dragon',['#ff8fb3','#64CDF5','#fff'],5,{boss:{rootBoss:5}},{k:'game', g:'rootout'}),
  P_('phoenix','Pyra the Phoenix Chick','bird',['#FF4539','#F9BF01','#ffd23a'],5,{pr:1},{k:'allTix'}),
  P_('kingslime','King Gloop','slime',['#F9BF01','#c48a00','#fff'],5,{shop:1},{k:'combo'}),
  P_('aurora','Aurora Deer','deer',['#9fffe0','#b48cff','#ffffff'],5,{mine:{depth:50}},{k:'critter'}),
  P_('voidkit','Void Kitten','cat',['#1a0a3a','#b48cff','#3a2a6a'],6,{mine:{depth:75}},{k:'gems'}),
  P_('nebula','Nebula Jelly','jelly',['#4a5cff','#ff5fd2','#bff0ff'],6,{pr:3},{k:'learn'}),
  P_('comet','Comet the Star Bat','bat',['#14204a','#F9BF01','#64CDF5'],6,{boss:{mineCore:1}},{k:'mineTix'}),
  P_('gilded','Gilded Golem','golem',['#F9BF01','#c48a00','#ffffff'],6,{pr:5},{k:'allTix'}),
  P_('dragonling','Wilderland Dragonling','dragon',['#00B451','#F9BF01','#D5F367'],7,{star:8},{k:'allTix'}),
  P_('rainbowfox','Prism the Rainbow Fox','fox',['#ff5fd2','#64CDF5','#fff3b0'],7,{star:12},{k:'critter'}),
  P_('celestia','Celestia the Sky Wisp','wisp',['#ffffff','#ff5fd2','#bff0ff'],7,{star:16},{k:'learn'}),
  // THE ONE — the final rarity: collect every other pet, or hatch it from a Wilderland Egg (0.00001%)
  P_('theone','THE ONE','theone',['#0b0b10','#1d1d26','#64CDF5'],8,{one:1},{k:'allTix'}),
];
H.PETS = PETS;
const byId = id => PETS.find(p => p.id === id);
H.byId = byId;
const PERK = {
  mineTix: {n:'Mine Tickets', e:'⛏️', per:1, d:'more tickets from The Mines'},
  allTix:  {n:'All Tickets', e:'🎟', per:.25, d:'more tickets from every game'},
  learn:   {n:'Learn Mode', e:'📚', per:1, d:'bigger Learn-mode answer bonus'},
  critter: {n:'Golden Critters', e:'🦊', per:1, d:'golden critters appear more often'},
  buff:    {n:'Longer Boosts', e:'⚡', per:1, d:'critter boosts last longer'},
  gems:    {n:'Gem Sense', e:'💎', per:.5, d:'chance for double gems in The Mines'},
  combo:   {n:'Combo', e:'🔥', per:.5, d:'more tickets while your combo is going'},
  game:    {n:'Favourite Game', e:'🕹️', per:1.5, d:'more tickets from one cabinet'},
};
const RMUL = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 50];
const GNAME = g => { const W = window.WLP; return (W && W.gname && W.gname(g)) || ({crossing:'Critter Crossing', rootout:'Root Out', snake:'Snake', breakout:'Breakout', td:'Trailhead Defense', flappy:'Flapper', space:'Star Ranger', reaction:'Reaction Test'})[g] || g; };
H.perkPct = (pet, lv) => Math.round(PERK[pet.perk.k].per * RMUL[pet.r] * (Math.min(60, lv) + Math.max(0, Math.min(lv, MAXLV) - 60)*.25) * 100) / 100;
// THE ONE has EVERY perk at once (×50 strength): all tickets, every game, Mines tickets, Learn, combo, gems, plus critters/boosts (capped at +300%)
const ONE_CAP = {critter:3, buff:3};
H.onePct = (k, lv) => { const v = PERK[k].per * RMUL[8] * (Math.min(60, lv) + Math.max(0, Math.min(lv, MAXLV) - 60)*.25); return Math.round(Math.min(v, ONE_CAP[k] ? ONE_CAP[k]*100 : Infinity)*100)/100; };
H.perkText = (pet, lv) => { if (pet.r >= 8) return 'EVERY perk: +'+fmt(H.onePct('allTix', lv))+'% all tickets · +'+fmt(H.onePct('game', lv))+'% every game · +'+fmt(H.onePct('mineTix', lv))+'% Mines · +'+fmt(H.onePct('learn', lv))+'% Learn · +'+fmt(H.onePct('combo', lv))+'% combo · +'+fmt(H.onePct('critter', lv))+'% critters & boosts · +'+fmt(H.onePct('gems', lv))+'% double gems';
  const k = pet.perk.k, p = H.perkPct(pet, lv); return '+'+p+'% '+(k == 'game' ? GNAME(pet.perk.g)+' tickets' : k == 'gems' ? 'double-gem chance' : PERK[k].d.replace(/^more /,'')); };

// ---------------- profile data ----------------
H.norm = P => { const p = P.pets && typeof P.pets == 'object' ? P.pets : {};
  return {own:p.own || {pebble:{xp:0}}, active:p.active === undefined ? 'pebble' : p.active, treats:p.treats|0, eggs:p.eggs || {}, lastPlay:p.lastPlay || 0}; };
H.lv = xp => Math.min(MAXLV, Math.floor(Math.sqrt((xp||0)/10)) + 1);
H.xpFor = lv => 10*Math.pow(lv-1, 2);
H.treatXp = lv => 60 * Math.max(1, Math.floor(lv/10));   // treats give more XP as your pet grows
H.owns = (P, id) => !!H.norm(P).own[id];
H.active = P => { const n = H.norm(P); const id = n.active && n.own[n.active] ? n.active : null; return id ? {pet:byId(id), d:n.own[id], lv:H.lv(n.own[id].xp)} : null; };
H.perkVal = (P, k, g) => { const a = H.active(P); if (a && a.pet && a.pet.r >= 8) return H.onePct(k, a.lv) / 100; if (!a || !a.pet || a.pet.perk.k !== k) return 0; if (k == 'game' && a.pet.perk.g !== g) return 0; return H.perkPct(a.pet, a.lv) / 100; };
// multipliers used by the economy
H.petAll = P => 1 + H.perkVal(P, 'allTix');
H.petGame = (P, g) => (1 + H.perkVal(P, 'game', g)) * (g == 'idle' ? 1 + H.perkVal(P, 'mineTix') : 1) * (1 + H.perkVal(P, 'combo') * Math.min(1, (((P.combo||{}).n)||1) > 1 ? 1 : 0));
H.petLearn = P => 1 + H.perkVal(P, 'learn');
H.petCritter = P => 1 + H.perkVal(P, 'critter');
H.petBuff = P => 1 + H.perkVal(P, 'buff');
H.petGems = P => H.perkVal(P, 'gems');

// unlock status for a pet
H.status = (P, pet) => { const s = pet.src, n = H.norm(P);
  if (n.own[pet.id]) return {own:true, how:'Owned'};
  if (s.free) return {can:true, how:'Free starter pet'};
  if (s.shop) { const price = H.shopPrice(P, pet); return {buy:'tix', price, how:'Pet Shop · '+fmt(price)+' 🎟'}; }
  if (s.star) return {buy:'star', price:s.star, how:'Golden Stars · '+s.star+' ⭐ (Wilderland pet)'};
  if (s.ach) { const [f, t] = s.ach.split(':'); const ok = ((P.at||{})[f]|0) > +t; const fam = window.WLA && window.WLA.fam ? window.WLA.fam(f) : null;
    return {can:ok, how:'Achievement: '+(fam ? fam.name : f)+' · '+['Bronze','Silver','Gold','Platinum','Diamond'][+t]}; }
  if (s.mine) { if (s.mine.depth) { const d = st(P,'mineDepth'); return {can:d >= s.mine.depth, how:'Mine treasure: reach layer '+s.mine.depth+' of The Mines ('+d+'/'+s.mine.depth+')'}; }
    const c = st(P,'mineChests'); return {can:c >= s.mine.chests, how:'Mine treasure: open '+s.mine.chests+' treasure rooms ('+c+'/'+s.mine.chests+')'}; }
  if (s.boss) { const [k, v] = Object.entries(s.boss)[0], c = st(P,k), nm = {spaceBoss:'Star Ranger bosses', tdBoss:'Trailhead Defense bosses', mineGolem:'Cave Golems', rootBoss:'Kudzu Kings', mineCore:'the Armageddon Core'}[k] || k;
    return {can:c >= v, how:'Boss drop: defeat '+nm+' ('+Math.min(c,v)+'/'+v+')'}; }
  if (s.one) { const c = PETS.filter(x => x.id != pet.id && n.own[x.id]).length, all = PETS.length - 1; return {can:c >= all, how:'THE ONE appears when you own every other pet ('+c+'/'+all+') — or hatch it from a Wilderland Egg (0.00001%)'}; }
  if (s.pr) return {can:prestige(P) >= s.pr, how:'Prestige reward: reach Prestige '+s.pr+' ('+prestige(P)+'/'+s.pr+')'};
  return {how:'?'}; };
H.shopPrice = (P, pet) => nice(Math.min(1500*Math.pow(7, pet.r) * (1 + PETS.indexOf(pet)%3*.15), need(P)*.3));
H.titles = P => { const n = H.norm(P), c = Object.keys(n.own).length, h = H.home(P).tier, out = [];
  if (c >= 5) out.push('Pet Pal'); if (c >= 15) out.push('Critter Collector'); if (c >= 30) out.push('Beast Master'); if (n.own.dragonling) out.push('Dragon Tamer'); if (n.own.theone) out.push('Bearer of THE ONE'); if (PETS.some(p => n.own[p.id] && H.lv(n.own[p.id].xp) >= 50)) out.push('Legendary Keeper'); if (PETS.some(p => n.own[p.id] && H.lv(n.own[p.id].xp) >= 200)) out.push('Ascended Keeper'); if (PETS.some(p => n.own[p.id] && H.lv(n.own[p.id].xp) >= 500)) out.push('Wilderland Spirit');
  if (h >= 2) out.push('Cozy Homebody'); if (h >= 4) out.push('Lord of the Keep'); if (h >= 5) out.push('Castle Lord'); if (h >= 6) out.push('Sky Sovereign'); return out; };

// ---------------- XP ----------------
H.addXp = (P, xp, id) => { const n = H.norm(P); id = id || n.active; if (!id || !n.own[id]) return null; const before = H.lv(n.own[id].xp), d = {...n.own[id], xp:(n.own[id].xp||0) + xp};
  const own = {...n.own, [id]:d}, after = H.lv(d.xp); return {patch:{pets:{...n, own}}, up: after > before ? after : 0, evo: evoOf(after) > evoOf(before) ? EVO_N[evoOf(after)] : ''}; };
// called by the arcade when a game finishes (mins played) or tickets are paid out
H.onPlay = (P, mins) => H.addXp(P, Math.round(8 + Math.min(20, mins||0)*12));

// =====================================================================================================================
// EGGS — tickets only, exact odds shown. The Cosmic and Wilderland eggs can hatch the top two rarities.
// =====================================================================================================================
const EGGS = [
  {id:'forest', n:'Forest Egg', e:'🥚', mul:.002, min:400,  odds:[60,30,10,0,0,0], c:'#00B451'},
  {id:'crystal',n:'Crystal Egg', e:'💠', mul:.02,  min:5e3,  odds:[0,45,35,15,5,0], c:'#2fa8e0'},
  {id:'royal',  n:'Royal Egg', e:'👑', mul:.12,  min:5e4,  odds:[0,0,40,35,20,5], c:'#a64be0'},
  {id:'cosmic', n:'Cosmic Egg', e:'🌌', mul:.25,  min:5e5,  odds:[0,0,0,0,35,40,25,0], c:'#4a5cff'},
  {id:'wild',   n:'Wilderland Egg', e:'🌲', mul:.4, min:5e6, odds:[0,0,0,0,0,45,35,19.99999,0.00001], c:'#015640'},
];
H.EGGS = EGGS;
H.eggPrice = (P, e) => nice(Math.max(e.min, need(P)*e.mul));
H.hatch = (P, eggId, rnd) => { const e = EGGS.find(x => x.id == eggId); rnd = rnd || Math.random; let x = rnd()*100, r = 0; for (; r < e.odds.length; r++) { x -= e.odds[r]; if (x < 0) break; } r = Math.min(r, 8);
  const pool = PETS.filter(p => p.r === r); return pool[Math.floor(rnd()*pool.length)]; };

// =====================================================================================================================
// HOME — tiers, rooms, furniture, sets
// =====================================================================================================================
const TIERS = [
  {n:'Forest Cabin',      e:'🛖', grid:[8,6],  rooms:['living'], mul:0},
  {n:'Treehouse Hideout', e:'🌳', grid:[9,6],  rooms:['living','pets'], mul:.03},
  {n:'Stone Cottage',     e:'🏡', grid:[10,7], rooms:['living','pets','bed'], mul:.06},
  {n:'Lakeside Lodge',    e:'🏞️', grid:[10,7], rooms:['living','pets','bed','trophy'], mul:.12},
  {n:'Mountain Keep',     e:'🏔️', grid:[11,8], rooms:['living','pets','bed','trophy','library'], mul:.2},
  {n:'Wilderland Castle', e:'🏰', grid:[12,8], rooms:['living','pets','bed','trophy','library','hall'], mul:.3},
  {n:'Sky Citadel',       e:'☁️', grid:[12,9], rooms:['living','pets','bed','trophy','library','hall','sky'], mul:.45},
];
H.TIERS = TIERS;
const ROOMS = {living:'Living Room', pets:'Pet Corner', bed:'Bedroom', trophy:'Trophy Room', library:'Library', hall:'Great Hall', sky:'Sky Deck', yard:'Yard & Garden'};
const ROOM_LOOK = {living:['#c9a77a','#8a6a44','#e8d6b0'], pets:['#a8d08a','#5a8a4a','#e8f5d8'], bed:['#b8a8d8','#6a5a9a','#ece4ff'], trophy:['#d8c08a','#8a6a2a','#fff3d0'], library:['#a8784a','#5a3a1c','#e8d0b0'], hall:['#c8c8d8','#6a6a8a','#f0f0ff'], sky:['#bfe6ff','#64CDF5','#ffffff'], yard:['#7cc46a','#3f8a3c','#d8f0c8']};
H.homeCost = (P, t) => t <= 0 ? 0 : nice(Math.min(need(P)*.5, Math.max(2000*Math.pow(4, t), need(P) * [0,.003,.01,.03,.08,.18,.35][t])));   // always below your next Rebirth
H.home = P => { const h = P.home && typeof P.home == 'object' ? P.home : {}; return {tier:h.tier|0, rooms:h.rooms || {}, inv:h.inv || {}, flag:h.flag || '#00B451', name:h.name || ''}; };
// furniture: w×h in grid cells; set = themed set (bonus when all its pieces are placed); yard items only go outside
const F_ = (id, n, w, h, set, src, extra) => ({id, n, w, h, set, src, ...(extra||{})});
const FURN = [
  F_('bed','Comfy Bed',2,3,'cozy',{t:1}), F_('rug','Braided Rug',3,2,'cozy',{t:1}), F_('lamp','Lantern Lamp',1,1,'cozy',{t:1},{light:1}), F_('fire','Stone Fireplace',2,1,'cozy',{t:2},{light:1}),
  F_('shelf','Bookshelf',2,1,'cozy',{t:1}), F_('chair','Armchair',1,1,'cozy',{t:1}),
  F_('cbed','Crystal Bed',2,3,'crystal',{t:3}), F_('clamp','Crystal Lamp',1,1,'crystal',{mine:{depth:8}},{light:1}), F_('geode','Geode Table',2,2,'crystal',{mine:{chests:5}}), F_('crug','Gem Rug',3,2,'crystal',{t:3}), F_('cplant','Crystal Plant',1,1,'crystal',{mine:{depth:20}}),
  F_('rbed','Rocket Bed',2,3,'space',{t:4}), F_('srug','Star Rug',3,2,'space',{t:4}), F_('plamp','Planet Lamp',1,1,'space',{boss:{spaceBoss:1}},{light:1}), F_('panel','Control Panel',2,1,'space',{t:4}), F_('robot','Helper Robot',1,1,'space',{ach:'typing_plays:1'}),
  F_('pillar','Ancient Pillar',1,1,'ruins',{t:3}), F_('statue','Explorer Statue',1,2,'ruins',{boss:{rootBoss:1}}), F_('vase','Old Vase',1,1,'ruins',{t:3}), F_('bench','Stone Bench',2,1,'ruins',{t:3}), F_('torch','Wall Torch',1,1,'ruins',{mine:{depth:22}},{light:1}),
  F_('throne','Royal Throne',2,2,'royal',{t:5}), F_('banner','Royal Banner',1,1,'royal',{t:5}), F_('kbed','Royal Bed',3,3,'royal',{t:5}), F_('chand','Chandelier',2,1,'royal',{pr:1},{light:1}), F_('armor','Knight Armor',1,2,'royal',{boss:{tdBoss:3}}),
  F_('plant','Potted Fern',1,1,'',{t:0}), F_('poster','Arcade Poster',1,1,'',{t:0}), F_('fish','Fish Tank',2,1,'',{t:2}), F_('trophy','Trophy Stand',1,1,'',{t:1},{trophy:1}), F_('badges','Badge Wall',2,1,'',{ach:'plays:1'},{badges:1}),
  F_('table','Wooden Table',2,2,'',{t:0}), F_('clock','Cuckoo Clock',1,1,'',{t:1}), F_('window','Big Window',2,1,'',{t:0}), F_('petbed','Pet Bed',1,1,'',{t:0},{pet:1}), F_('toy','Ball of Yarn',1,1,'',{t:0},{pet:1}),
  F_('arcade','Mini Arcade Cabinet',1,2,'',{ach:'variety:2'}), F_('piano','Little Piano',2,1,'',{ach:'simon_plays:1'}),
  F_('fence','Picket Fence',2,1,'',{t:0},{yard:1}), F_('path','Stone Path',1,1,'',{t:0},{yard:1}), F_('tree','Oak Tree',2,2,'',{t:0},{yard:1}), F_('flowers','Flower Bed',2,1,'',{t:0},{yard:1}),
  F_('mailbox','Mailbox',1,1,'',{t:0},{yard:1}), F_('flag','Flag Pole',1,2,'',{t:0},{yard:1, flag:1}), F_('pond','Duck Pond',3,2,'',{t:2},{yard:1}), F_('gnome','Garden Gnome',1,1,'',{t:1},{yard:1}), F_('swing','Tire Swing',1,2,'',{t:1},{yard:1}),
];
H.FURN = FURN;
const SETS = {cozy:{n:'Cozy Cabin', e:'🛋️'}, crystal:{n:'Crystal Cave', e:'💎'}, space:{n:'Space Station', e:'🚀'}, ruins:{n:'Ancient Ruins', e:'🏛️'}, royal:{n:'Royal Castle', e:'👑'}};
H.SETS = SETS;
const fById = id => FURN.find(f => f.id == id);
H.furnPrice = (P, f) => nice(Math.max(150, need(P) * .0015) * Math.pow(1.9, f.src.t || 0) * (f.w*f.h > 3 ? 1.6 : 1));
H.furnStatus = (P, f) => { const s = f.src, ti = s.t != null ? s.t : null;
  if (ti != null) { const t = H.home(P).tier; return t >= ti ? {buy:true, price:H.furnPrice(P, f), how:'Shop · '+fmt(H.furnPrice(P, f))+' 🎟'} : {how:'Shop · unlocks with the '+TIERS[ti].n}; }
  if (s.ach) { const [fa, t] = s.ach.split(':'); return {free:((P.at||{})[fa]|0) > +t, how:'Achievement reward'}; }
  if (s.mine) return s.mine.depth ? {free:st(P,'mineDepth') >= s.mine.depth, how:'Mine treasure · reach layer '+s.mine.depth} : {free:st(P,'mineChests') >= s.mine.chests, how:'Mine treasure · open '+s.mine.chests+' treasure rooms'};
  if (s.boss) { const [k, v] = Object.entries(s.boss)[0]; return {free:st(P,k) >= v, how:'Boss drop · '+v+'× '+({spaceBoss:'Star Ranger boss', rootBoss:'Kudzu King', tdBoss:'Trailhead Defense boss'}[k]||k)}; }
  if (s.pr) return {free:prestige(P) >= s.pr, how:'Prestige '+s.pr+' reward'};
  return {how:''}; };
// how many of an item you have in total (placed + in inventory); reward items give one free copy
const placedCount = (h, id) => Object.values(h.rooms).reduce((a, r) => a + (r||[]).filter(x => x.i == id).length, 0);
H.setsDone = P => { const h = H.home(P); return Object.keys(SETS).filter(k => FURN.filter(f => f.set == k).every(f => placedCount(h, f.id) > 0)); };
H.homeMult = P => (1 + TIERS[Math.min(6, H.home(P).tier)].mul) * Math.pow(1.03, H.setsDone(P).length);

// ---------------- furniture art (drawn in a w*40 × h*40 box) ----------------
const night = () => { const hr = new Date().getHours(); return hr < 7 || hr >= 19; };
H.furnSVG = (f, P) => { const W = f.w*40, Hh = f.h*40, low = lowFx(); let s = '';
  const box = (x,y,w,h,c,r) => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(r||3)+'" fill="'+c+'"/>';
  const glow = (x, y, r, c) => night() ? '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'" opacity=".35">'+(low?'':'<animate attributeName="opacity" values=".3;.45;.3" dur="2s" repeatCount="indefinite"/>')+'</circle>' : '';
  switch (f.id) {
    case 'bed': case 'cbed': case 'rbed': case 'kbed': { const c = {bed:['#8D5B1D','#ff8fb3','#fff'], cbed:['#64CDF5','#bff0ff','#fff'], rbed:['#c9ccd1','#FF4539','#fff'], kbed:['#c48a00','#a64be0','#fff3b0']}[f.id];
      s = box(4,2,W-8,Hh-4,c[0],6)+box(8,6,W-16,24,c[2],6)+box(8,30,W-16,Hh-36,c[1],4)+'<path d="M8 '+(Hh-20)+'h'+(W-16)+'" stroke="rgba(0,0,0,.15)" stroke-width="3"/>';
      if (f.id=='rbed') s += '<path d="M'+(W/2)+' -2l10 10h-20z" fill="#FF4539"/>'; if (f.id=='kbed') s += '<path d="M8 2v-6M'+(W-8)+' 2v-6" stroke="#c48a00" stroke-width="3"/>'; break; }
    case 'rug': case 'crug': case 'srug': { const c = {rug:['#c2427f','#F9BF01'], crug:['#64CDF5','#e9b9f7'], srug:['#14204a','#F9BF01']}[f.id];
      s = '<ellipse cx="'+W/2+'" cy="'+Hh/2+'" rx="'+(W/2-4)+'" ry="'+(Hh/2-4)+'" fill="'+c[0]+'"/><ellipse cx="'+W/2+'" cy="'+Hh/2+'" rx="'+(W/2-14)+'" ry="'+(Hh/2-12)+'" fill="none" stroke="'+c[1]+'" stroke-width="3"/>';
      if (f.id=='srug') s += [0,1,2,3,4].map(i=>'<circle cx="'+(20+i*20)+'" cy="'+(20+(i%2)*36)+'" r="2" fill="#fff"/>').join(''); break; }
    case 'lamp': case 'clamp': case 'plamp': { const c = {lamp:'#F9BF01', clamp:'#9fd8ff', plamp:'#ff9f3a'}[f.id]; s = glow(20,14,20,c)+box(17,22,6,14,'#5a3a1c',2)+(f.id=='plamp' ? '<circle cx="20" cy="14" r="10" fill="'+c+'"/><ellipse cx="20" cy="14" rx="15" ry="4" fill="none" stroke="#fff" stroke-width="2"/>' : f.id=='clamp' ? '<path d="M20 2l8 12l-8 10l-8 -10z" fill="'+c+'"/>' : '<path d="M10 22l4 -16h12l4 16z" fill="'+c+'"/>'); break; }
    case 'fire': s = glow(40,24,30,'#ff8a3c')+box(2,2,W-4,Hh-4,'#8a8a90',4)+box(20,14,40,24,'#2a1a10',8)+'<path d="M30 36q-2 -12 6 -18q0 8 4 6q2 -8 0 -12q12 8 6 24z" fill="#ff8a3c">'+(low?'':'<animate attributeName="d" values="M30 36q-2 -12 6 -18q0 8 4 6q2 -8 0 -12q12 8 6 24z;M30 36q0 -14 6 -16q-2 8 4 4q4 -8 2 -14q10 10 4 26z;M30 36q-2 -12 6 -18q0 8 4 6q2 -8 0 -12q12 8 6 24z" dur=".6s" repeatCount="indefinite"/>')+'</path><path d="M36 36q0 -6 4 -8q0 4 4 8z" fill="#F9BF01"/>'; break;
    case 'shelf': s = box(2,2,W-4,Hh-4,'#8D5B1D',3)+[0,1,2,3,4,5,6].map(i=>box(6+i*10,8,7,26-(i%3)*4,['#FF4539','#00B451','#64CDF5','#F9BF01','#a64be0','#ff8fb3','#fff'][i],1)).join(''); break;
    case 'chair': s = box(6,4,28,32,'#c2427f',8)+box(10,14,20,16,'#e8689f',5); break;
    case 'geode': s = '<circle cx="40" cy="40" r="34" fill="#4a4a5a"/><circle cx="40" cy="40" r="26" fill="#a64be0"/>'+[0,1,2,3,4,5].map(i=>'<path d="M40 40l'+(Math.cos(i)*20)+' '+(Math.sin(i)*20)+'" stroke="#e9b9f7" stroke-width="3"/>').join(''); break;
    case 'cplant': s = box(12,26,16,12,'#6a6a8a',3)+'<path d="M20 26l-6 -16l6 6l4 -14l2 14l6 -6z" fill="#64CDF5"/>'; break;
    case 'panel': s = box(2,4,W-4,Hh-8,'#4b4d50',4)+[0,1,2,3,4,5].map(i=>'<circle cx="'+(12+i*11)+'" cy="20" r="3" fill="'+['#FF4539','#00B451','#F9BF01'][i%3]+'">'+(low?'':'<animate attributeName="opacity" values="1;.3;1" dur="'+(1+i*.3)+'s" repeatCount="indefinite"/>')+'</circle>').join(''); break;
    case 'robot': s = box(8,8,24,22,'#c9ccd1',5)+'<circle cx="15" cy="18" r="3" fill="#64CDF5"/><circle cx="25" cy="18" r="3" fill="#64CDF5"/><path d="M20 8v-6" stroke="#c9ccd1" stroke-width="2"/><circle cx="20" cy="2" r="2" fill="#FF4539"/>'+box(12,30,16,8,'#8a8a90',2); break;
    case 'pillar': s = box(8,2,24,6,'#e8e0c8',1)+box(11,8,18,26,'#d8d0b8',0)+box(8,34,24,5,'#e8e0c8',1)+'<path d="M15 10v22M20 10v22M25 10v22" stroke="#b8b098" stroke-width="1.4"/>'; break;
    case 'statue': s = box(8,62,24,16,'#b8b098',2)+'<circle cx="20" cy="18" r="8" fill="#c8c0a8"/><path d="M10 62q0 -30 10 -36q10 6 10 36z" fill="#c8c0a8"/>'; break;
    case 'vase': s = '<path d="M14 4h12l-2 6q10 8 6 20q-4 8 -10 8t-10 -8q-4 -12 6 -20z" fill="#c48a4a"/><path d="M12 22h16" stroke="#8D5B1D" stroke-width="2"/>'; break;
    case 'bench': s = box(4,10,W-8,10,'#a8a090',3)+box(10,20,8,16,'#8a8270',2)+box(W-18,20,8,16,'#8a8270',2); break;
    case 'torch': s = glow(20,10,18,'#ff8a3c')+box(17,16,6,20,'#5a3a1c',2)+'<path d="M14 16q0 -10 6 -14q6 4 6 14z" fill="#ff8a3c">'+(low?'':'<animate attributeName="opacity" values="1;.7;1" dur=".4s" repeatCount="indefinite"/>')+'</path>'; break;
    case 'throne': s = box(10,4,60,56,'#c48a00',8)+box(18,14,44,40,'#a64be0',6)+box(6,44,68,30,'#c48a00',6)+'<path d="M24 4l6 -8l10 8l10 -8l6 8" fill="#F9BF01"/>'; break;
    case 'banner': s = '<path d="M8 2h24v30l-12 -6l-12 6z" fill="#a64be0"/><circle cx="20" cy="14" r="5" fill="#F9BF01"/>'; break;
    case 'chand': s = glow(40,20,34,'#F9BF01')+'<path d="M40 0v8M14 16q26 14 52 0" stroke="#c48a00" stroke-width="3" fill="none"/>'+[0,1,2,3,4].map(i=>'<circle cx="'+(16+i*12)+'" cy="'+(18+Math.abs(2-i)*-2)+'" r="3" fill="#fff3b0"/>').join(''); break;
    case 'armor': s = '<circle cx="20" cy="12" r="9" fill="#c9ccd1"/><rect x="15" y="10" width="10" height="3" fill="#121313"/><path d="M8 26q12 -6 24 0v34h-24z" fill="#a8acb2"/>'+box(10,60,8,16,'#8a8e94',2)+box(22,60,8,16,'#8a8e94',2); break;
    case 'plant': s = box(12,26,16,12,'#c48a4a',3)+'<g>'+(low?'':'<animateTransform attributeName="transform" type="rotate" values="-3 20 26;3 20 26;-3 20 26" dur="3s" repeatCount="indefinite"/>')+'<path d="M20 26q-14 -6 -10 -20q6 8 10 20q4 -14 12 -18q2 12 -12 18" fill="#3fae5a"/></g>'; break;
    case 'poster': s = box(4,2,32,36,'#fff',2)+box(7,5,26,22,'#015640',1)+'<path d="M10 22l6 -8l5 6l3 -4l6 6z" fill="#D5F367"/><text x="20" y="35" text-anchor="middle" font-size="6" font-weight="700" fill="#015640">ARCADE</text>'; break;
    case 'fish': s = box(2,4,W-4,Hh-8,'#64CDF5',4)+'<rect x="2" y="4" width="'+(W-4)+'" height="6" fill="#bff0ff"/><g>'+(low?'':'<animateTransform attributeName="transform" type="translate" values="0 0;40 2;0 0" dur="5s" repeatCount="indefinite"/>')+'<path d="M14 22q6 -6 12 0q-6 6 -12 0zM26 22l5 -4v8z" fill="#FF8A3C"/></g><path d="M60 34q2 -10 -2 -16M66 34q-2 -8 2 -12" stroke="#00B451" stroke-width="2" fill="none"/><circle cx="50" cy="16" r="1.6" fill="#fff">'+(low?'':'<animate attributeName="cy" values="30;10;30" dur="2.5s" repeatCount="indefinite"/>')+'</circle>'; break;
    case 'trophy': { const own = P && window.WLP ? window.WLP.catalog().filter(it => (P.prizes||{})[it.id]).sort((a,b)=>b.r-a.r).slice(0,1) : []; s = box(6,26,28,12,'#8D5B1D',2)+(own.length ? '<text x="20" y="24" text-anchor="middle" font-size="18">'+own[0].e+'</text>' : '<path d="M12 6h16v8q0 8 -8 8t-8 -8z" fill="#F9BF01"/><rect x="18" y="20" width="4" height="6" fill="#F9BF01"/>'); break; }
    case 'badges': { const pins = P && window.WLA ? window.WLA.pins(P).slice(0,3) : []; s = box(2,2,W-4,Hh-4,'#5a3a1c',4)+[0,1,2].map(i=>'<circle cx="'+(16+i*24)+'" cy="20" r="9" fill="'+(pins[i] ? '#F9BF01' : '#8a6a44')+'"/>'+(pins[i] ? '<text x="'+(16+i*24)+'" y="24" text-anchor="middle" font-size="10">'+pins[i].e+'</text>' : '')).join(''); break; }
    case 'table': s = box(6,10,W-12,Hh-24,'#a8784a',6)+box(10,Hh-16,6,12,'#8D5B1D',2)+box(W-16,Hh-16,6,12,'#8D5B1D',2)+'<circle cx="'+W/2+'" cy="'+(Hh/2-4)+'" r="6" fill="#fff"/>'; break;
    case 'clock': s = '<path d="M6 14l14 -12l14 12v22h-28z" fill="#8D5B1D"/><circle cx="20" cy="20" r="8" fill="#fff"/><path d="M20 20v-5M20 20l4 2" stroke="#121313" stroke-width="1.6"><animateTransform attributeName="transform" type="rotate" values="0 20 20;360 20 20" dur="60s" repeatCount="indefinite"/></path>'; break;
    case 'window': s = box(4,2,W-8,Hh-4,'#8D5B1D',3)+box(8,6,W-16,Hh-12,night() ? '#14204a' : '#bfe6ff',2)+(night() ? '<circle cx="56" cy="14" r="4" fill="#fff3b0"/>' : '<circle cx="56" cy="14" r="5" fill="#F9BF01"/>')+'<path d="M'+W/2+' 6v'+(Hh-12)+'" stroke="#8D5B1D" stroke-width="3"/>'; break;
    case 'petbed': s = '<ellipse cx="20" cy="24" rx="17" ry="12" fill="#c2427f"/><ellipse cx="20" cy="22" rx="12" ry="7" fill="#ff8fb3"/>'; break;
    case 'toy': s = '<circle cx="20" cy="22" r="11" fill="#EA55AB"/><path d="M11 18q9 6 18 0M10 24q10 4 20 -2" stroke="#ff8fc8" stroke-width="2" fill="none"/><path d="M28 28q6 4 8 10" stroke="#EA55AB" stroke-width="1.5" fill="none"/>'; break;
    case 'arcade': s = box(6,2,28,76,'#015640',4)+box(10,8,20,16,'#121313',2)+'<rect x="12" y="10" width="16" height="12" fill="#D5F367">'+(low?'':'<animate attributeName="fill" values="#D5F367;#64CDF5;#EA55AB;#D5F367" dur="2s" repeatCount="indefinite"/>')+'</rect><circle cx="16" cy="34" r="3" fill="#FF4539"/><circle cx="24" cy="34" r="3" fill="#F9BF01"/>'; break;
    case 'piano': s = box(2,4,W-4,Hh-8,'#121313',4)+[0,1,2,3,4,5,6,7,8].map(i=>box(6+i*8,18,7,16,'#fff',1)).join('')+[0,1,3,4,5,7].map(i=>box(11+i*8,18,4,9,'#121313',1)).join(''); break;
    case 'fence': s = [0,1,2,3,4].map(i=>'<path d="M'+(4+i*17)+' 36v-26l4 -6l4 6v26z" fill="#fff"/>').join('')+box(0,16,W,4,'#e8e2cc',1)+box(0,28,W,4,'#e8e2cc',1); break;
    case 'path': s = '<ellipse cx="14" cy="14" rx="10" ry="7" fill="#c9c4b0"/><ellipse cx="28" cy="28" rx="9" ry="6" fill="#b8b098"/>'; break;
    case 'tree': s = '<ellipse cx="40" cy="74" rx="22" ry="5" fill="rgba(0,0,0,.2)"/>'+box(34,40,12,34,'#8D5B1D',3)+'<g>'+(low?'':'<animateTransform attributeName="transform" type="rotate" values="-1.5 40 70;1.5 40 70;-1.5 40 70" dur="4s" repeatCount="indefinite"/>')+'<circle cx="40" cy="28" r="24" fill="#3fae5a"/><circle cx="26" cy="36" r="14" fill="#2f8a4a"/><circle cx="54" cy="36" r="14" fill="#2f8a4a"/><circle cx="36" cy="22" r="6" fill="#7cc46a"/></g>'; break;
    case 'flowers': s = box(2,20,W-4,16,'#8D5B1D',4)+[0,1,2,3,4,5].map(i=>'<circle cx="'+(10+i*12)+'" cy="18" r="5" fill="'+['#FF4539','#F9BF01','#EA55AB','#fff','#a64be0','#64CDF5'][i]+'"/><circle cx="'+(10+i*12)+'" cy="18" r="1.8" fill="#F9BF01"/>').join(''); break;
    case 'mailbox': s = box(17,18,6,20,'#8D5B1D',1)+'<path d="M6 20v-8q0 -8 14 -8q14 0 14 8v8z" fill="#2f7de0"/><path d="M30 8v-6h6v4h-6" fill="#FF4539"/>'; break;
    case 'flag': { const fc = (H.home(P||{}).flag); s = box(18,4,4,72,'#c9ccd1',2)+'<path d="M22 6h22l-6 8l6 8h-22z" fill="'+fc+'">'+(low?'':'<animate attributeName="d" values="M22 6h22l-6 8l6 8h-22z;M22 6h20q4 4 0 8q4 4 0 8h-20z;M22 6h22l-6 8l6 8h-22z" dur="1.4s" repeatCount="indefinite"/>')+'</path>'; break; }
    case 'pond': s = '<ellipse cx="60" cy="40" rx="56" ry="34" fill="#2f7de0"/><ellipse cx="60" cy="40" rx="48" ry="27" fill="#64CDF5"/><g>'+(low?'':'<animateTransform attributeName="transform" type="translate" values="0 0;20 4;0 0" dur="6s" repeatCount="indefinite"/>')+'<ellipse cx="44" cy="38" rx="7" ry="5" fill="#F9BF01"/><circle cx="50" cy="33" r="3.5" fill="#F9BF01"/><path d="M53 33l3 1l-3 1z" fill="#FF8A3C"/></g>'; break;
    case 'gnome': s = '<path d="M10 22l10 -20l10 20z" fill="#FF4539"/><circle cx="20" cy="24" r="6" fill="#f2c9a0"/><path d="M14 26q6 10 12 0" fill="#fff"/>'+box(12,30,16,8,'#2f7de0',3); break;
    case 'swing': s = '<path d="M20 0v40" stroke="#8D5B1D" stroke-width="2"/><g>'+(low?'':'<animateTransform attributeName="transform" type="rotate" values="-8 20 0;8 20 0;-8 20 0" dur="2.4s" repeatCount="indefinite"/>')+'<path d="M20 0v44" stroke="#5a3a1c" stroke-width="1.5"/><ellipse cx="20" cy="56" rx="12" ry="8" fill="#2a2a30"/><ellipse cx="20" cy="56" rx="6" ry="3.5" fill="#7cc46a"/></g>'; break;
    default: s = box(4,4,W-8,Hh-8,'#c9a77a',4);
  }
  return s; };
H.furnImg = (f, P) => 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(f.w*40)+' '+(f.h*40)+'">'+H.furnSVG(f, P)+'</svg>');
// house exterior for each tier (the avatar-card snapshot)
H.houseSVG = (t, P) => { const n = night(), sky = n ? '#14204a' : '#bfe6ff', fc = H.home(P||{}).flag; let s = '<rect width="64" height="64" rx="12" fill="'+sky+'"/>'+(n ? '<circle cx="52" cy="10" r="4" fill="#fff3b0"/>' : '<circle cx="52" cy="10" r="5" fill="#F9BF01"/>')+'<rect y="50" width="64" height="14" fill="#3f8a3c"/>';
  const win = (x,y) => '<rect x="'+x+'" y="'+y+'" width="6" height="6" rx="1" fill="'+(n ? '#ffd23a' : '#bff0ff')+'"/>';
  if (t == 0) s += '<path d="M14 50v-14h30v14z" fill="#8D5B1D"/><path d="M10 36l19 -14l19 14z" fill="#5a3a1c"/>'+win(18,40)+'<rect x="32" y="40" width="7" height="10" fill="#3a2414"/>';
  if (t == 1) s += '<rect x="30" y="34" width="5" height="18" fill="#8D5B1D"/><circle cx="32" cy="28" r="18" fill="#3fae5a"/><path d="M20 30h24v10h-24z" fill="#a8784a"/><path d="M18 30l14 -8l14 8z" fill="#8D5B1D"/>'+win(28,32);
  if (t == 2) s += '<path d="M12 50v-16h40v16z" fill="#b8b098"/><path d="M8 34l24 -16l24 16z" fill="#7a4a2a"/>'+win(17,38)+win(41,38)+'<rect x="28" y="40" width="8" height="10" fill="#5a3a1c"/><path d="M44 22v-8h5v10" fill="#8a8270"/>';
  if (t == 3) s += '<rect y="52" width="64" height="12" fill="#2f7de0"/><path d="M8 50v-18h48v18z" fill="#a8784a"/><path d="M4 32l28 -16l28 16z" fill="#5a3a1c"/>'+win(13,36)+win(29,36)+win(45,36)+'<rect x="28" y="42" width="8" height="8" fill="#3a2414"/>';
  if (t == 4) s += '<path d="M0 50l16 -30l14 22l12 -18l22 26z" fill="#8a8e94"/><path d="M14 50v-20h36v20z" fill="#9a9a9b"/><path d="M14 30h36M14 30v-4h6v4m6 0v-4h6v4m6 0v-4h6v4" stroke="#7a7a7d" stroke-width="2" fill="none"/>'+win(20,36)+win(38,36)+'<path d="M28 50v-8q4 -4 8 0v8z" fill="#3a2414"/>';
  if (t == 5) s += '<rect x="10" y="26" width="10" height="24" fill="#c8c8d8"/><rect x="44" y="26" width="10" height="24" fill="#c8c8d8"/><rect x="18" y="32" width="28" height="18" fill="#d8d8e8"/><path d="M8 26l7 -10l7 10zM42 26l7 -10l7 10z" fill="#a64be0"/>'+win(12,32)+win(46,32)+'<path d="M28 50v-10q4 -5 8 0v10z" fill="#5a3a1c"/><path d="M32 32v-14" stroke="#9a9a9b" stroke-width="1.4"/><path d="M32 18h8l-2 3l2 3h-8z" fill="'+fc+'"/>';
  if (t >= 6) s += '<ellipse cx="32" cy="52" rx="26" ry="7" fill="#fff"/><ellipse cx="20" cy="50" rx="10" ry="6" fill="#fff"/><ellipse cx="46" cy="50" rx="10" ry="6" fill="#fff"/><rect x="18" y="24" width="28" height="24" fill="#f0f0ff"/><rect x="14" y="18" width="8" height="30" fill="#e0e8ff"/><rect x="42" y="18" width="8" height="30" fill="#e0e8ff"/><path d="M12 18l6 -10l6 10zM40 18l6 -10l6 10zM24 24l8 -14l8 14z" fill="#64CDF5"/>'+win(28,30)+'<circle cx="32" cy="10" r="2" fill="#F9BF01">'+an('opacity','1;.3;1',1.5)+'</circle>';
  return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'+s+'</svg>'); };

// =====================================================================================================================
// EMOTES & MOUNTS
// =====================================================================================================================
const EMOTES = [
  {k:'wave', e:'👋', n:'Wave', how:'Free', ok:P=>true, anim:'wlhWave .5s ease-in-out 3'},
  {k:'dance', e:'💃', n:'Dance', how:'5 achievements', ok:P=>(P.ach||[]).length >= 5, anim:'wlhDance .4s ease-in-out 4'},
  {k:'cheer', e:'🎉', n:'Cheer', how:'Win 25 games', ok:P=>Object.values(P.played||{}).reduce((a,b)=>a+b,0) >= 25, anim:'wlhJump .35s ease-out 4'},
  {k:'flex', e:'💪', n:'Flex', how:'Rebirth once', ok:P=>(P.rebirths||0) >= 1, anim:'wlhFlex .6s ease-in-out 2'},
  {k:'sleepy', e:'😴', n:'Sleepy', how:'3-day login streak', ok:P=>((P.login||{}).best||0) >= 3, anim:'wlhSleep 1.6s ease-in-out 1'},
  {k:'frown', e:'☹️', n:'Frown', how:'10 achievements', ok:P=>(P.ach||[]).length >= 10, anim:'wlhShake .3s ease-in-out 4'},
];
H.EMOTES = EMOTES;
const MOUNTS = [
  {k:'snail', n:'Giant Snail', sp:1.12, how:'Pet Shop', price:P=>nice(Math.max(3000, need(P)*.01)), c:['#e9b9f7','#a64be0','#c9ccd1']},
  {k:'cart', n:'Minecart', sp:1.3, how:'Reach layer 25 of The Mines', ok:P=>st(P,'mineDepth') >= 25},
  {k:'cloud', n:'Cloud', sp:1.45, how:'Prestige 1', ok:P=>prestige(P) >= 1},
  {k:'drake', n:'Baby Dragon', sp:1.6, how:'6 Golden Stars (Wilderland mount)', star:6},
];
H.MOUNTS = MOUNTS;
H.ride = P => { const m = (P.mounts||{}).on; return m && (P.mounts.own||{})[m] ? MOUNTS.find(x => x.k == m) : null; };
H.speed = P => { const m = H.ride(P); return m ? m.sp : 1; };
H.mountSVG = k => { let s = '';
  if (k == 'snail') s = '<path d="M4 54q0 -8 10 -8h34q8 0 8 8z" fill="#c9ccd1"/><circle cx="26" cy="38" r="14" fill="#e9b9f7"/><path d="M26 38m-9 0a9 9 0 1 1 9 9a6 6 0 1 1 -6 -6a2 2 0 1 1 2 2" stroke="#a64be0" stroke-width="2.4" fill="none"/><path d="M50 46q0 -10 6 -14" stroke="#c9ccd1" stroke-width="3" fill="none"/>';
  if (k == 'cart') s = '<path d="M8 36h48l-6 16h-36z" fill="#6a6d72"/><path d="M8 36h48" stroke="#4b4d50" stroke-width="4"/><circle cx="20" cy="54" r="5" fill="#121313"/><circle cx="44" cy="54" r="5" fill="#121313"/><circle cx="20" cy="54" r="2" fill="#9a9a9b"/><circle cx="44" cy="54" r="2" fill="#9a9a9b"/>';
  if (k == 'cloud') s = '<g>'+at('translate','0 1;0 -2;0 1',1.6)+'<ellipse cx="32" cy="50" rx="26" ry="9" fill="#fff"/><circle cx="18" cy="46" r="9" fill="#fff"/><circle cx="34" cy="42" r="11" fill="#fff"/><circle cx="48" cy="46" r="8" fill="#fff"/><ellipse cx="32" cy="54" rx="22" ry="4" fill="#e0e8ff"/></g>';
  if (k == 'drake') s = '<g>'+at('rotate','0 14 40;-20 14 40;0 14 40',.7)+'<path d="M14 40q-14 -16 -14 4q8 -2 12 4z" fill="#F9BF01"/></g><g>'+at('rotate','0 50 40;20 50 40;0 50 40',.7)+'<path d="M50 40q14 -16 14 4q-8 -2 -12 4z" fill="#F9BF01"/></g><ellipse cx="32" cy="48" rx="22" ry="11" fill="#00B451"/><path d="M52 44q10 -6 8 -16l-6 4z" fill="#00B451"/><circle cx="57" cy="30" r="2" fill="#121313"/><path d="M10 50q-8 2 -8 -6" stroke="#00B451" stroke-width="5" fill="none"/>';
  return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'+s+'</svg>'); };

// =====================================================================================================================
// UI — the Pets & Home window (tabs: My Pets · Pet Dex · Eggs · Home · Emotes & Mounts)
// =====================================================================================================================
const css = `
.wlh{font-family:"Uncut Sans","Inter",system-ui,sans-serif;color:#121313}
.wlh *{box-sizing:border-box}
.wlh-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.wlh-tab{border:none;border-radius:999px;padding:8px 14px;font:700 13px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#015640}
.wlh-tab.on{background:#015640;color:#fff}
.wlh-box{background:#fff;border-radius:16px;padding:14px;margin-bottom:10px}
.wlh-h{font-size:12px;font-weight:700;letter-spacing:.12em;color:#AB2372;margin:12px 0 6px}
.wlh-small{font-size:12px;color:#4a4a4a;line-height:1.45}
.wlh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}
.wlh-card{background:#fff;border-radius:14px;padding:8px;text-align:center;border:2px solid var(--rc,#ddd);position:relative;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px}
.wlh-card.on{box-shadow:0 0 0 3px #D5F367,0 0 18px var(--rc)}
.wlh-card img{width:72px;height:72px}
.wlh-nm{font-weight:700;font-size:12px;color:#015640;line-height:1.2}
.wlh-tier{font-size:9px;font-weight:800;letter-spacing:.1em}
.wlh-btn{border:none;border-radius:999px;padding:8px 14px;font:700 13px inherit;font-family:inherit;cursor:pointer;background:#015640;color:#fff}
.wlh-btn:disabled{background:#d9d5c3;color:#6a6a6a;cursor:default}
.wlh-btn.alt{background:#fff;color:#015640;border:1.5px solid #015640}
.wlh-btn.gold{background:#F9BF01;color:#121313}
.wlh-chip{border:1.5px solid #015640;border-radius:999px;padding:5px 10px;font:700 12px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#015640}
.wlh-chip.on{background:#015640;color:#fff}
.wlh-bar{height:8px;border-radius:4px;background:#e6e1cc;overflow:hidden}.wlh-bar>div{height:100%;background:#00B451}
.wlh-room{position:relative;border-radius:14px;overflow:hidden;touch-action:none;user-select:none;transform-origin:0 0;box-shadow:inset 0 0 0 4px rgba(0,0,0,.12)}
.wlh-it{position:absolute;cursor:grab;transition:outline .1s}
.wlh-it img{width:100%;height:100%;pointer-events:none;display:block}
.wlh-it.sel{outline:3px solid #D5F367;outline-offset:1px;z-index:5}
.wlh-wander{position:absolute;width:44px;height:44px;pointer-events:none;transition:left 2.4s ease-in-out,top 2.4s ease-in-out;z-index:4}
.wlh-viewport{overflow:auto;border-radius:14px;background:#2a1d12;max-height:62vh;-webkit-overflow-scrolling:touch}
@keyframes wlhPop{0%{transform:scale(.4) rotate(-10deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes wlhBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes wlhWave{0%,100%{transform:rotate(0)}50%{transform:rotate(-14deg)}}
@keyframes wlhDance{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-5px) rotate(-10deg)}75%{transform:translateX(5px) rotate(10deg)}}
@keyframes wlhJump{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px) scale(1.06)}}
@keyframes wlhFlex{0%,100%{transform:scale(1)}50%{transform:scale(1.22,1.08)}}
@keyframes wlhSleep{0%,100%{transform:rotate(0)}50%{transform:rotate(18deg) translateY(4px)}}
@keyframes wlhShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
@media (prefers-reduced-motion: reduce){.wlh *{animation:none!important;transition:none!important}}
`;
H.ensureCss = () => { if (document.getElementById('wlh-css')) return; const s = document.createElement('style'); s.id = 'wlh-css'; s.textContent = css; document.head.appendChild(s); };
const E = (tag, props, ...kids) => { const e = document.createElement(tag); if (props) for (const k in props) { const v = props[k]; if (v == null) continue;
    if (k == 'style') { for (const s in v) { if (s.startsWith('--')) e.style.setProperty(s, v[s]); else e.style[s] = v[s]; } } else if (k.startsWith('on')) e[k] = v; else if (k == 'cls') e.className = v; else e.setAttribute(k, v); }
  kids.flat().forEach(c => { if (c == null || c === false) return; e.appendChild(typeof c == 'object' ? c : document.createTextNode(String(c))); }); return e; };

const getQ = () => { try { const v = JSON.parse(localStorage.getItem('wl-prize-qty')); return v === 'max' ? 'max' : (+v || 1); } catch(e) { return 1; } };
const setQ = v => { try { localStorage.setItem('wl-prize-qty', JSON.stringify(v)); } catch(e){} };
const qN = cap => { const q = getQ(); return q === 'max' ? cap : Math.min(cap, q); };
H.mount = (root, api) => { H.ensureCss(); const wrap = E('div', {cls:'wlh'}); root.appendChild(wrap); let tab = api.tab || 'pets', live = true, sel = null, placing = null, room = 'living', zoom = 1, dexF = -1, wanderIv = null, petSel = null;
  const P = () => api.P(), set = p => api.setP(p), R = RAR();
  const head = E('div'), body = E('div'); wrap.append(head, body);
  const renderHead = () => { head.innerHTML = ''; const p = P(), n = H.norm(p), a = H.active(p), h = H.home(p);
    head.append(E('div', {style:{display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px'}},
      E('div', {style:{background:'#D5F367', color:'#015640', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, '🎟 '+fmt(p.tickets||0)),
      E('div', {style:{background:'#F9BF01', color:'#121313', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, '⭐ '+fmt(freeStars(p))+' Golden Stars'),
      E('div', {style:{background:'#015640', color:'#D5F367', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, '🐾 '+Object.keys(n.own).length+' / '+PETS.length+' pets'),
      E('div', {style:{background:'#fff', color:'#015640', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, TIERS[h.tier].e+' '+TIERS[h.tier].n),
      a ? E('div', {cls:'wlh-small'}, 'Active: '+a.pet.n+' · Lv '+a.lv+' · '+H.perkText(a.pet, a.lv)) : null));
    const bq = E('div', {style:{display:'flex', gap:'5px', alignItems:'center', flexWrap:'wrap', marginBottom:'8px'}}, E('b', {style:{fontSize:'12px', color:'#015640'}}, 'BUY'));
    [1, 10, 100, 'max'].forEach(v => bq.appendChild(E('button', {cls:'wlh-chip'+(getQ()===v?' on':''), onclick:()=>{ setQ(v); render(); }}, v === 'max' ? 'Max' : '×'+v)));
    bq.appendChild(E('span', {cls:'wlh-small'}, 'for eggs, treats, furniture and home upgrades')); head.append(bq);
    const tb = E('div', {cls:'wlh-tabs'}); [['pets','🐾 My Pets'],['dex','📖 Pet Dex'],['eggs','🥚 Eggs & Treats'],['home','🏠 Home'],['emotes','💃 Emotes & Mounts']].forEach(([id,t]) => tb.appendChild(E('button', {cls:'wlh-tab'+(tab==id?' on':''), onclick:()=>{ tab = id; sel = null; placing = null; render(); }}, t)));
    head.append(tb); };
  const petCard = (pet, p, onclick) => { const n = H.norm(p), d = n.own[pet.id], r = R[pet.r], lv = d ? H.lv(d.xp) : 1;
    return E('div', {cls:'wlh-card'+(n.active == pet.id ? ' on' : ''), style:{'--rc':r.c}, onclick},
      E('div', {cls:'wlh-tier', style:{color:r.c}}, r.n.toUpperCase()), E('img', {src: d ? H.petImg(pet, {lv, variant:d.v, hat:d.hat, collar:d.col}) : H.petSil(pet), alt:''}),
      E('div', {cls:'wlh-nm', style: d ? null : {color:'#6a6a6a'}}, pet.n), d ? E('div', {cls:'wlh-small'}, 'Lv '+lv+' · '+EVO_N[evoOf(lv)]) : E('div', {cls:'wlh-small', style:{fontSize:'10px'}}, H.status(p, pet).how),
      n.active == pet.id ? E('div', {style:{position:'absolute', top:'6px', right:'6px', background:'#D5F367', color:'#015640', fontSize:'10px', fontWeight:800, borderRadius:'999px', padding:'2px 7px'}}, 'ACTIVE') : null); };
  // ---------------- My Pets ----------------
  const pets = () => { const p = P(), n = H.norm(p), box = E('div'), owned = PETS.filter(x => n.own[x.id]);
    if (!petSel || !n.own[petSel]) petSel = n.active && n.own[n.active] ? n.active : (owned[0]||{}).id;
    const pet = byId(petSel);
    if (pet) { const d = n.own[pet.id], lv = H.lv(d.xp), nx = H.xpFor(lv+1), cur = H.xpFor(lv), pct = lv >= MAXLV ? 100 : Math.floor((d.xp-cur)/(nx-cur)*100), r = R[pet.r];
      const big = E('img', {src:H.petImg(pet, {lv, variant:d.v, hat:d.hat, collar:d.col}), alt:pet.n, style:{width:'150px', height:'150px', cursor:'pointer', animation:'wlhPop .4s ease-out'}});
      const play = () => { const pp = P(), nn = H.norm(pp); if (Date.now() - nn.lastPlay < 20000) { api.toast(pet.n.toUpperCase()+' IS RESTING · PLAY AGAIN IN '+Math.ceil((20000-(Date.now()-nn.lastPlay))/1000)+'s'); return; }
        const px = Math.round(H.treatXp(lv)/4), r2 = H.addXp(pp, px, pet.id); if (!r2) return; set({pets:{...r2.patch.pets, lastPlay:Date.now()}}); big.style.animation = 'none'; void big.offsetWidth; big.style.animation = 'wlhBounce .4s ease-in-out 3';
        api.sfx('blip'); api.toast(['BOING!','WHEEE!','HIGH FIVE!','ZOOMIES!'][Math.floor(Math.random()*4)]+' · +'+fmt(px)+' XP'+(r2.up?' · LEVEL '+r2.up+'!':'')); if (r2.evo) api.toast(pet.n.toUpperCase()+' EVOLVED · '+r2.evo.toUpperCase()); render(); };
      big.onclick = play;
      const feed = () => { const pp = P(), nn = H.norm(pp); if (nn.treats <= 0) { api.toast('NO TREATS · BUY SOME IN EGGS & TREATS'); api.sfx('bad'); return; }
        const k = Math.max(1, Math.min(qN(nn.treats), nn.treats)), per = H.treatXp(H.lv(nn.own[pet.id].xp)), r2 = H.addXp(pp, per*k, pet.id); set({pets:{...r2.patch.pets, treats:nn.treats-k}}); api.sfx('coin'); api.toast('YUM! +'+fmt(per*k)+' XP'+(k > 1 ? ' ('+k+' treats)' : '')+(r2.up?' · LEVEL '+r2.up+'!':'')); if (r2.evo) api.toast(pet.n.toUpperCase()+' EVOLVED · '+r2.evo.toUpperCase()); render(); };
      const custom = (k, v) => { const pp = P(), nn = H.norm(pp); set({pets:{...nn, own:{...nn.own, [pet.id]:{...nn.own[pet.id], [k]:v}}}}); api.sfx('blip'); render(); };
      const cust = E('div', {style:{display:'flex', flexDirection:'column', gap:'6px'}});
      const hatRow = E('div', {style:{display:'flex', gap:'4px', flexWrap:'wrap', alignItems:'center'}}, E('b', {style:{fontSize:'12px', color:'#015640', width:'54px'}}, 'Hat'));
      HATS.forEach((ht, i) => { const ok = !ht.lv || lv >= ht.lv; hatRow.appendChild(E('button', {cls:'wlh-chip'+((d.hat|0)==i?' on':''), style:{opacity:ok?1:.45}, title: ok ? '' : 'Unlocks at pet level '+ht.lv, onclick:()=>{ if (!ok) return api.toast('UNLOCKS AT PET LEVEL '+ht.lv); custom('hat', i); }}, ht.n+(ok?'':' 🔒'+ht.lv))); });
      const colRow = E('div', {style:{display:'flex', gap:'4px', flexWrap:'wrap', alignItems:'center'}}, E('b', {style:{fontSize:'12px', color:'#015640', width:'54px'}}, 'Collar'));
      COLLARS.forEach((c, i) => colRow.appendChild(E('button', {cls:'wlh-chip'+((d.col|0)==i?' on':''), style:{width:'30px', height:'26px', padding:0, background: i ? c : '#fff'}, title: i ? 'Collar' : 'No collar', onclick:()=>custom('col', i)}, i ? '' : '✕')));
      const varRow = E('div', {style:{display:'flex', gap:'4px', flexWrap:'wrap', alignItems:'center'}}, E('b', {style:{fontSize:'12px', color:'#015640', width:'54px'}}, 'Colour'));
      [['Classic',0],['Swapped',5],['Golden',20]].forEach(([nm, req], i) => { const ok = lv >= req; varRow.appendChild(E('button', {cls:'wlh-chip'+((d.v|0)==i?' on':''), style:{opacity:ok?1:.45}, onclick:()=>{ if (!ok) return api.toast('UNLOCKS AT PET LEVEL '+req); custom('v', i); }}, nm+(ok?'':' 🔒'+req))); });
      cust.append(hatRow, colRow, varRow);
      box.appendChild(E('div', {cls:'wlh-box', style:{display:'flex', gap:'14px', flexWrap:'wrap', alignItems:'center', border:'3px solid '+r.c}},
        E('div', {style:{display:'flex', flexDirection:'column', alignItems:'center', gap:'4px'}}, big, E('div', {cls:'wlh-small'}, 'Tap to play (+'+fmt(Math.round(H.treatXp(lv)/4))+' XP)')),
        E('div', {style:{flex:'1 1 260px', minWidth:0, display:'flex', flexDirection:'column', gap:'6px'}},
          E('div', {cls:'wlh-tier', style:{color:r.c}}, r.n.toUpperCase()+' · '+EVO_N[evoOf(lv)].toUpperCase()), E('div', {style:{fontWeight:800, fontSize:'20px', color:'#015640'}}, pet.n),
          E('div', {style:{fontWeight:700, color:'#AB2372', fontSize:'13px'}}, PERK[pet.perk.k].e+' Perk: '+H.perkText(pet, lv)+(lv < 60 ? '  →  next level: '+H.perkText(pet, lv+1) : ' · MAX')),
          E('div', {cls:'wlh-small'}, 'Level '+lv+' / '+MAXLV+(lv<MAXLV?' · '+fmt(d.xp)+' / '+fmt(nx)+' XP':' · MAX')+(H.nextEvo(lv) ? ' · next form: '+H.nextEvo(lv).n+' at Lv '+H.nextEvo(lv).lv : ' · final form!')), E('div', {cls:'wlh-bar'}, E('div', {style:{width:pct+'%'}})),
          E('div', {style:{display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'4px'}},
            E('button', {cls:'wlh-btn'+(n.active==pet.id?' alt':''), onclick:()=>{ const nn = H.norm(P()); set({pets:{...nn, active: nn.active == pet.id ? null : pet.id}}); api.sfx('blip'); api.toast(nn.active == pet.id ? 'PET PUT AWAY' : pet.n.toUpperCase()+' IS NOW YOUR ACTIVE PET'); render(); }}, n.active==pet.id ? 'Put away' : 'Make active'),
            E('button', {cls:'wlh-btn gold', onclick:feed}, '🍓 Feed a treat ('+n.treats+')')),
          E('div', {cls:'wlh-small'}, 'Only your active pet’s perk counts. Pets earn XP whenever you play, never get sick and never run away.'), cust))); }
    box.appendChild(E('div', {cls:'wlh-h'}, 'YOUR PETS · TAP ONE TO SEE IT'));
    const g = E('div', {cls:'wlh-grid'}); owned.forEach(x => g.appendChild(petCard(x, p, ()=>{ petSel = x.id; render(); }))); box.appendChild(g); return box; };
  // ---------------- Pet Dex ----------------
  const dex = () => { const p = P(), n = H.norm(p), box = E('div'), own = PETS.filter(x => n.own[x.id]).length, pct = Math.floor(own/PETS.length*100);
    box.appendChild(E('div', {cls:'wlh-box'}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, '📖 Pet Dex · '+pct+'% complete'), E('div', {cls:'wlh-small'}, own+' of '+PETS.length+' pets found. Silhouettes show pets you haven’t met yet, with exactly where to find them.'), E('div', {cls:'wlh-bar', style:{marginTop:'8px'}}, E('div', {style:{width:pct+'%', background:'linear-gradient(90deg,#00B451,#F9BF01,#ff5fd2)'}}))));
    const ch = E('div', {style:{display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'8px'}}); ch.appendChild(E('button', {cls:'wlh-chip'+(dexF<0?' on':''), onclick:()=>{ dexF = -1; render(); }}, 'All'));
    R.forEach((r, i) => ch.appendChild(E('button', {cls:'wlh-chip'+(dexF==i?' on':''), style:{borderColor:r.c}, onclick:()=>{ dexF = i; render(); }}, r.n+' '+PETS.filter(x=>x.r==i && n.own[x.id]).length+'/'+PETS.filter(x=>x.r==i).length)));
    box.appendChild(ch);
    const g = E('div', {cls:'wlh-grid'});
    PETS.filter(x => dexF < 0 || x.r == dexF).forEach(pet => { const s = H.status(p, pet), c = petCard(pet, p, ()=>{ if (n.own[pet.id]) { petSel = pet.id; tab = 'pets'; render(); } });
      if (!s.own) { const b = s.buy == 'tix' ? E('button', {cls:'wlh-btn', onclick:e=>{ e.stopPropagation(); buyPet(pet, s); }}, fmt(s.price)+' 🎟') : s.buy == 'star' ? E('button', {cls:'wlh-btn gold', onclick:e=>{ e.stopPropagation(); buyPet(pet, s); }}, s.price+' ⭐') : s.can ? E('button', {cls:'wlh-btn gold', onclick:e=>{ e.stopPropagation(); buyPet(pet, s); }}, 'Claim!') : null;
        if (b) { if ((s.buy=='tix' && (p.tickets||0) < s.price) || (s.buy=='star' && freeStars(p) < s.price)) b.disabled = true; c.appendChild(b); } }
      c.appendChild(E('div', {style:{fontSize:'10px', color:'#6a6a6a'}}, PERK[pet.perk.k].e+' '+(pet.perk.k=='game' ? GNAME(pet.perk.g) : PERK[pet.perk.k].n)));
      g.appendChild(c); });
    box.appendChild(g); return box; };
  const grant = (pet, extra) => { const nn = H.norm(P()); set({...(extra||{}), pets:{...nn, own:{...nn.own, [pet.id]:{xp:0}}, active: nn.active && nn.own[nn.active] ? nn.active : pet.id}}); if (api.log && pet.r >= 4) api.log('pet', 'got '+pet.n); };
  const buyPet = (pet, s) => { if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); const p = P();
    if (s.buy == 'tix') { if ((p.tickets||0) < s.price) return api.sfx('bad'); grant(pet, {tickets:p.tickets - s.price}); }
    else if (s.buy == 'star') { if (freeStars(p) < s.price) return api.sfx('bad'); grant(pet, {starsSpent:(p.starsSpent||0) + s.price}); }
    else if (s.can) grant(pet); else return;
    api.sfx('win'); api.toast('NEW PET · '+pet.n.toUpperCase()+'!'); hatchShow(pet, 'NEW PET!'); render(); };
  // ---------------- Eggs & treats ----------------
  let reveal = null;
  const hatchShow = (pet, label) => { reveal = {pet, label}; };
  const eggs = () => { const p = P(), n = H.norm(p), box = E('div');
    if (reveal) { const r = R[reveal.pet.r]; box.appendChild(E('div', {cls:'wlh-box', style:{textAlign:'center', border:'3px solid '+r.c, boxShadow:'0 0 30px '+r.c}}, E('div', {cls:'wlh-tier', style:{color:r.c, fontSize:'12px'}}, reveal.label+' · '+r.n.toUpperCase()), E('img', {src:H.petImg(reveal.pet, {lv:1}), alt:'', style:{width:'140px', height:'140px', animation:'wlhPop .5s cubic-bezier(.2,1.5,.4,1)'}}), E('div', {style:{fontWeight:800, fontSize:'20px', color:'#015640'}}, reveal.pet.n), E('button', {cls:'wlh-btn', style:{marginTop:'8px'}, onclick:()=>{ reveal = null; render(); }}, 'Nice!'))); }
    box.appendChild(E('div', {cls:'wlh-box'}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, '🥚 Mystery Pet Eggs'), E('div', {cls:'wlh-small'}, 'Paid with tickets only — never real money. The exact odds are printed on every egg. Only the Cosmic Egg and the Wilderland Egg can hatch Cosmic and Wilderland pets. A pet you already have gives it bonus XP instead.')));
    const g = E('div', {cls:'wlh-grid', style:{gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))'}});
    EGGS.forEach(e => { const price = H.eggPrice(p, e), can = (p.tickets||0) >= price;
      const odds = E('div', {style:{display:'grid', gridTemplateColumns:'1fr auto', gap:'1px 8px', fontSize:'11px', width:'100%', textAlign:'left'}}); e.odds.forEach((o, i) => { if (o) odds.append(E('span', {style:{color:R[i].c, fontWeight:700}}, R[i].n), E('b', null, o+'%')); });
      const en = Math.max(1, Math.min(qN(500), Math.floor((p.tickets||0)/price))), b = E('button', {cls:'wlh-btn', onclick:()=>hatch(e)}, (en > 1 ? 'Hatch ×'+en+' · '+fmt(price*en) : 'Hatch · '+fmt(price))+' 🎟'); if (!can) b.disabled = true;
      g.appendChild(E('div', {cls:'wlh-card', style:{'--rc':e.c, cursor:'default'}}, E('div', {style:{fontSize:'48px', lineHeight:1.1}}, e.e), E('div', {cls:'wlh-nm', style:{fontSize:'15px'}}, e.n), odds, b)); });
    box.appendChild(g);
    const tp = nice(Math.max(150, need(p)*.0008)), packs = Math.max(1, Math.min(qN(1000), Math.floor((p.tickets||0)/(tp*5)))), tb = E('button', {cls:'wlh-btn gold', onclick:()=>{ if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); const pp = P(), k = Math.max(1, Math.min(qN(1000), Math.floor((pp.tickets||0)/(tp*5)))); if ((pp.tickets||0) < tp*5*k) return api.sfx('bad'); const nn = H.norm(pp); set({tickets:pp.tickets - tp*5*k, pets:{...nn, treats:nn.treats + 5*k}}); api.sfx('coin'); api.toast('+'+(5*k)+' TREATS'); render(); }}, 'Buy '+(5*packs)+' treats · '+fmt(tp*5*packs)+' 🎟');
    if ((p.tickets||0) < tp*5) tb.disabled = true;
    box.appendChild(E('div', {cls:'wlh-box', style:{marginTop:'10px', display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}, E('div', {style:{fontSize:'34px'}}, '🍓'), E('div', {style:{flex:'1 1 200px'}}, E('b', {style:{color:'#015640'}}, 'Pet Treats · you have '+n.treats), E('div', {cls:'wlh-small'}, 'Feed one to any pet for +60 XP (more as pets grow: +60 per 10 levels). Treats never run out on their own.')), tb));
    return box; };
  const hatch = e => { if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); const p = P(), price = H.eggPrice(p, e); if ((p.tickets||0) < price) return api.sfx('bad');
    const n = Math.max(1, Math.min(qN(500), Math.floor((p.tickets||0)/price))), nn = H.norm(p), own = {...nn.own}; let fresh = [], best = null, dupXp = 0;
    for (let i = 0; i < n; i++) { const pet = H.hatch(p, e.id); if (!best || pet.r > best.r) best = pet;
      if (own[pet.id]) { own[pet.id] = {...own[pet.id], xp:(own[pet.id].xp||0) + 100*(pet.r+1)}; dupXp += 100*(pet.r+1); } else { own[pet.id] = {xp:0}; fresh.push(pet); } }
    set({tickets:p.tickets - price*n, pets:{...nn, own, eggs:{...nn.eggs, [e.id]:(nn.eggs[e.id]|0)+n}, active: nn.active && nn.own[nn.active] ? nn.active : (fresh[0]||best).id}});
    const show = fresh.length ? fresh.reduce((a, b) => b.r > a.r ? b : a) : best;
    hatchShow(show, n > 1 ? 'HATCHED '+n+' EGGS · '+fresh.length+' NEW PET'+(fresh.length==1?'':'S')+(dupXp ? ' · +'+fmt(dupXp)+' BONUS XP' : '') : fresh.length ? 'HATCHED!' : 'DUPLICATE · +'+dupXp+' XP');
    if (fresh.length) api.toast('NEW: '+fresh.slice(0,4).map(x => x.n.toUpperCase()).join(', ')+(fresh.length > 4 ? ' +'+(fresh.length-4)+' MORE' : ''));
    api.sfx(best.r >= 3 ? 'win' : 'coin'); render(); };

  // ---------------- HOME ----------------
  const home = () => { const p = P(), h = H.home(p), T = TIERS[h.tier], box = E('div'), nt = night(), hr = new Date().getHours();
    const rooms = [...T.rooms, 'yard']; if (!rooms.includes(room)) room = rooms[0];
    // header: tier, upgrade, bonus
    const next = TIERS[h.tier+1], cost = next ? H.homeCost(p, h.tier+1) : 0;
    const tierPlan = pp => { const hh = H.home(pp); let t = hh.tier, spent = 0, k = 0; while (k < qN(6) && t < TIERS.length-1) { const c = H.homeCost(pp, t+1); if (spent + c > (pp.tickets||0)) break; spent += c; t++; k++; } return {t, spent, k}; };
    const tp0 = tierPlan(p);
    const up = next ? E('button', {cls:'wlh-btn gold', onclick:()=>{ if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); const pp = P(), hh = H.home(pp), pl = tierPlan(pp); if (!pl.k) return api.sfx('bad'); set({tickets:pp.tickets - pl.spent, home:{...hh, tier:pl.t}}); api.sfx('win'); api.toast('HOME UPGRADED · '+TIERS[pl.t].n.toUpperCase()+'!'); if (api.log) api.log('home', 'upgraded to '+TIERS[pl.t].n); render(); }}, tp0.k > 1 ? 'Upgrade ×'+tp0.k+' to '+TIERS[tp0.t].n+' · '+fmt(tp0.spent)+' 🎟' : 'Upgrade to '+next.n+' · '+fmt(cost)+' 🎟') : E('div', {style:{fontWeight:800, color:'#00B451'}}, '★ Top tier reached!');
    if (next && (p.tickets||0) < cost) up.disabled = true;
    const done = H.setsDone(p);
    box.appendChild(E('div', {cls:'wlh-box', style:{display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap'}}, E('img', {src:H.houseSVG(h.tier, p), alt:'', style:{width:'84px', height:'84px'}}),
      E('div', {style:{flex:'1 1 240px', minWidth:0}}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, T.e+' '+T.n+' · tier '+(h.tier+1)+'/'+TIERS.length),
        E('div', {cls:'wlh-small'}, T.rooms.length+' room'+(T.rooms.length>1?'s':'')+' + yard · Home bonus: +'+Math.round(T.mul*100)+'% all tickets'+(done.length ? ' · Sets complete: '+done.map(k=>SETS[k].e+' '+SETS[k].n).join(', ')+' (+3% each)' : '')+(next ? ' · Next: '+next.n+' adds '+(next.rooms.length > T.rooms.length ? 'the '+ROOMS[next.rooms[next.rooms.length-1]]+', ' : '')+'a bigger grid and +'+Math.round(next.mul*100)+'%' : '')),
        E('div', {cls:'wlh-small'}, (nt ? '🌙 Night time — lamps and fires glow' : hr >= 17 ? '🌇 Evening light' : '☀️ Daytime')+' · Homes are permanent: Rebirth never touches them.')), up));
    // room tabs
    const rt = E('div', {style:{display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'8px', alignItems:'center'}});
    rooms.forEach(rm => rt.appendChild(E('button', {cls:'wlh-chip'+(room==rm?' on':''), onclick:()=>{ room = rm; sel = null; placing = null; render(); }}, ROOMS[rm])));
    rt.appendChild(E('span', {style:{flex:1}})); rt.append(E('button', {cls:'wlh-chip', onclick:()=>{ zoom = Math.max(.5, zoom/1.2); render(); }}, '−'), E('button', {cls:'wlh-chip', onclick:()=>{ zoom = Math.min(2, zoom*1.2); render(); }}, '+'));
    if (room == 'yard') { const fl = E('div', {style:{display:'flex', gap:'3px', alignItems:'center'}}, E('span', {cls:'wlh-small'}, 'Flag:')); COLLARS.slice(1).forEach(c => fl.appendChild(E('button', {cls:'wlh-chip'+(h.flag==c?' on':''), style:{width:'24px', height:'22px', padding:0, background:c}, onclick:()=>{ set({home:{...H.home(P()), flag:c}}); render(); }}))); rt.appendChild(fl); }
    box.appendChild(rt);
    // the room
    const [gw, gh] = room == 'yard' ? [12, 6] : T.grid, CS = 40, look = ROOM_LOOK[room], items = (h.rooms[room] || []).map((x, i) => ({...x, k:i}));
    const vp = E('div', {cls:'wlh-viewport'}), rm = E('div', {cls:'wlh-room', style:{width:gw*CS+'px', height:gh*CS+'px', transform:'scale('+zoom+')',
      background: room == 'yard' ? 'repeating-linear-gradient(45deg,'+look[0]+' 0 20px,'+look[1]+'22 20px 40px)' : 'linear-gradient(180deg,'+look[2]+' 0 '+(CS*1.2)+'px,'+look[1]+' '+(CS*1.2)+'px '+(CS*1.3)+'px,'+look[0]+' '+(CS*1.3)+'px)'}});
    const sizer = E('div', {style:{width:gw*CS*zoom+'px', height:gh*CS*zoom+'px', position:'relative', margin:'0 auto'}}); sizer.appendChild(rm); vp.appendChild(sizer);
    // floor pattern + grid lines
    rm.appendChild(E('div', {style:{position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,0,0,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.08) 1px,transparent 1px)', backgroundSize:CS+'px '+CS+'px', pointerEvents:'none'}}));
    if (room != 'yard') rm.appendChild(E('div', {style:{position:'absolute', left:0, right:0, top:0, height:CS*1.2+'px', background:'repeating-linear-gradient(90deg,rgba(255,255,255,.12) 0 6px,transparent 6px 22px)', pointerEvents:'none'}}));
    const occ = (x, y, w, hh, skip) => items.some(it => { if (it.k === skip) return false; const f = fById(it.i), iw = it.rot ? f.h : f.w, ih = it.rot ? f.w : f.h; return x < it.x+iw && x+w > it.x && y < it.y+ih && y+hh > it.y; });
    const fits = (f, x, y, rot, skip) => { const w = rot ? f.h : f.w, hh = rot ? f.w : f.h; return x >= 0 && y >= 0 && x+w <= gw && y+hh <= gh && !occ(x, y, w, hh, skip); };
    const save = list => { const hh = H.home(P()); set({home:{...hh, rooms:{...hh.rooms, [room]:list.map(({i,x,y,rot}) => ({i,x,y,rot:rot?1:0}))}}}); };
    items.forEach(it => { const f = fById(it.i); if (!f) return; const w = it.rot ? f.h : f.w, hh = it.rot ? f.w : f.h;
      const el = E('div', {cls:'wlh-it'+(sel===it.k?' sel':''), style:{left:it.x*CS+'px', top:it.y*CS+'px', width:w*CS+'px', height:hh*CS+'px', zIndex: f.id.match(/rug/) ? 1 : 2+it.y}, title:f.n});
      const img = E('img', {src:H.furnImg(f, p), alt:f.n, style: it.rot ? {width:f.w*CS+'px', height:f.h*CS+'px', transform:'rotate(90deg) translate(0,-100%)', transformOrigin:'0 0'} : null}); el.appendChild(img);
      // drag to move (snaps to the grid)
      el.onpointerdown = e => { e.stopPropagation(); if (placing) return; sel = it.k; try { el.setPointerCapture(e.pointerId); } catch(_){} const sx = e.clientX, sy = e.clientY; let moved = false, nx = it.x, ny = it.y;
        el.classList.add('sel'); [...rm.querySelectorAll('.wlh-it.sel')].forEach(o => { if (o !== el) o.classList.remove('sel'); });
        el.onpointermove = ev => { const dx = Math.round((ev.clientX-sx)/(CS*zoom)), dy = Math.round((ev.clientY-sy)/(CS*zoom)); if (dx || dy) moved = true; const tx = it.x+dx, ty = it.y+dy;
          if (fits(f, tx, ty, it.rot, it.k)) { nx = tx; ny = ty; el.style.left = nx*CS+'px'; el.style.top = ny*CS+'px'; } };
        el.onpointerup = () => { el.onpointermove = null; el.onpointerup = null; if (moved && (nx !== it.x || ny !== it.y)) { const list = items.map(o => o.k === it.k ? {...o, x:nx, y:ny} : o); save(list); api.sfx('blip'); } render(); }; };
      rm.appendChild(el); });
    // owned pets wander around the Pet Corner and the yard
    if (room == 'pets' || room == 'yard') { const n = H.norm(p), list = PETS.filter(x => n.own[x.id]).slice(0, room == 'pets' ? 10 : 5);
      list.forEach((pet, i) => { const d = n.own[pet.id], w = E('img', {cls:'wlh-wander', src:H.petImg(pet, {lv:H.lv(d.xp), variant:d.v, hat:d.hat, collar:d.col, mood: nt && i%2 ? 'nap' : ''}), alt:pet.n, title:pet.n, style:{left:(20 + (i*67)%(gw*CS-60))+'px', top:(CS*1.6 + (i*41)%(gh*CS-CS*2.4))+'px'}}); rm.appendChild(w); }); }
    // night lighting: dim the room, lamps glow (drawn inside the lamp art)
    if (nt) rm.appendChild(E('div', {style:{position:'absolute', inset:0, background:'rgba(20,30,80,.28)', pointerEvents:'none', zIndex:40}}));
    else if (hr >= 17) rm.appendChild(E('div', {style:{position:'absolute', inset:0, background:'rgba(255,160,60,.12)', pointerEvents:'none', zIndex:40}}));
    // tap an empty spot to place the chosen item
    rm.onpointerdown = e => { if (e.target !== rm && !e.target.style.backgroundImage) return; const r = rm.getBoundingClientRect(), x = Math.floor((e.clientX-r.left)/(CS*zoom)), y = Math.floor((e.clientY-r.top)/(CS*zoom));
      if (!placing) { sel = null; render(); return; } const f = fById(placing); const hh = H.home(P()), have = hh.inv[f.id]|0;
      if (have <= 0) { placing = null; render(); return; } const px = Math.min(x, gw - f.w), py = Math.min(y, gh - f.h);
      if (!fits(f, px, py, 0)) { api.toast('NO ROOM THERE · TRY ANOTHER SPOT'); api.sfx('bad'); return; }
      const list = [...items, {i:f.id, x:px, y:py, rot:0}]; set({home:{...hh, inv:{...hh.inv, [f.id]:have-1}, rooms:{...hh.rooms, [room]:list.map(({i,x,y,rot})=>({i,x,y,rot:rot?1:0}))}}}); api.sfx('coin'); if (have-1 <= 0) placing = null; render(); };
    // pinch / wheel zoom
    const pts = new Map(); let pin = null;
    vp.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); zoom = Math.max(.5, Math.min(2, zoom*(e.deltaY > 0 ? .9 : 1.1))); render(); }, {passive:false});
    vp.addEventListener('pointerdown', e => { pts.set(e.pointerId, e); if (pts.size == 2) { const v = [...pts.values()]; pin = {d:Math.hypot(v[0].clientX-v[1].clientX, v[0].clientY-v[1].clientY)||1, z:zoom}; } }, true);
    vp.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e); if (pin && pts.size == 2) { const v = [...pts.values()]; const nz = Math.max(.5, Math.min(2, pin.z*Math.hypot(v[0].clientX-v[1].clientX, v[0].clientY-v[1].clientY)/pin.d)); rm.style.transform = 'scale('+nz+')'; sizer.style.width = gw*CS*nz+'px'; sizer.style.height = gh*CS*nz+'px'; zoom = nz; } }, true);
    const pend = e => { pts.delete(e.pointerId); if (pts.size < 2) pin = null; }; vp.addEventListener('pointerup', pend, true); vp.addEventListener('pointercancel', pend, true);
    box.appendChild(vp);
    // selected item tools
    const tools = E('div', {style:{display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap', margin:'8px 0', minHeight:'34px'}});
    if (sel != null && items[sel]) { const it = items[sel], f = fById(it.i);
      tools.append(E('b', {style:{color:'#015640'}}, f.n), E('span', {cls:'wlh-small'}, 'Drag it to move'),
        E('button', {cls:'wlh-btn alt', onclick:()=>{ if (!fits(f, it.x, it.y, !it.rot, it.k)) { api.toast('NO ROOM TO ROTATE HERE'); return api.sfx('bad'); } save(items.map(o => o.k === it.k ? {...o, rot:o.rot?0:1} : o)); api.sfx('blip'); render(); }}, '⟳ Rotate'),
        E('button', {cls:'wlh-btn', style:{background:'#FF4539'}, onclick:()=>{ const hh = H.home(P()); const list = items.filter(o => o.k !== it.k); set({home:{...hh, inv:{...hh.inv, [f.id]:(hh.inv[f.id]|0)+1}, rooms:{...hh.rooms, [room]:list.map(({i,x,y,rot})=>({i,x,y,rot:rot?1:0}))}}}); sel = null; api.sfx('blip'); render(); }}, '✕ Remove'),
        E('button', {cls:'wlh-chip', onclick:()=>{ sel = null; render(); }}, 'Done')); }
    else if (placing) tools.append(E('b', {style:{color:'#AB2372'}}, 'Tap an empty spot to place your '+fById(placing).n), E('button', {cls:'wlh-chip', onclick:()=>{ placing = null; render(); }}, 'Cancel'));
    else tools.append(E('span', {cls:'wlh-small'}, 'Pick something from your storage, then tap the room to place it. Tap furniture to move, rotate or put it away.'));
    box.appendChild(tools);
    // storage + shop
    box.appendChild(E('div', {cls:'wlh-h'}, 'YOUR STORAGE & FURNITURE SHOP'+(room=='yard' ? ' · YARD ITEMS' : ' · INDOOR ITEMS')));
    const g = E('div', {cls:'wlh-grid', style:{gridTemplateColumns:'repeat(auto-fill,minmax(118px,1fr))'}});
    FURN.filter(f => !!f.yard == (room == 'yard')).forEach(f => { const hh = H.home(p), have = hh.inv[f.id]|0, placed = placedCount(hh, f.id), s = H.furnStatus(p, f), got = have + placed > 0 || hh['got_'+f.id];
      const card = E('div', {cls:'wlh-card'+(placing==f.id?' on':''), style:{'--rc': f.set ? '#a64be0' : '#c9c4b0'}}, f.set ? E('div', {cls:'wlh-tier', style:{color:'#a64be0'}}, SETS[f.set].e+' '+SETS[f.set].n.toUpperCase()) : null,
        E('img', {src:H.furnImg(f, p), alt:'', style:{width:Math.min(80, f.w*30)+'px', height:Math.min(80, f.h*30)+'px', objectFit:'contain'}}), E('div', {cls:'wlh-nm'}, f.n), E('div', {cls:'wlh-small', style:{fontSize:'10px'}}, have+' in storage · '+placed+' placed'));
      if (have > 0) card.appendChild(E('button', {cls:'wlh-btn', onclick:()=>{ placing = f.id; sel = null; render(); }}, 'Place'));
      if (s.buy) { const fn = Math.max(1, Math.min(qN(100), Math.floor((p.tickets||0)/s.price))), b = E('button', {cls:'wlh-btn alt', onclick:()=>{ if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); const pp = P(), hh2 = H.home(pp), k = Math.max(1, Math.min(qN(100), Math.floor((pp.tickets||0)/s.price))); if ((pp.tickets||0) < s.price*k) return api.sfx('bad'); set({tickets:pp.tickets - s.price*k, home:{...hh2, inv:{...hh2.inv, [f.id]:(hh2.inv[f.id]|0)+k}}}); api.sfx('coin'); if (k > 1) api.toast('+'+k+' '+f.n.toUpperCase()); render(); }}, (fn > 1 ? 'Buy ×'+fn+' · '+fmt(s.price*fn) : 'Buy · '+fmt(s.price))+' 🎟'); if ((p.tickets||0) < s.price) b.disabled = true; card.appendChild(b); }
      else if (s.free && !got) card.appendChild(E('button', {cls:'wlh-btn gold', onclick:()=>{ const hh2 = H.home(P()); set({home:{...hh2, ['got_'+f.id]:1, inv:{...hh2.inv, [f.id]:(hh2.inv[f.id]|0)+1}}}); api.sfx('win'); api.toast('CLAIMED · '+f.n.toUpperCase()); render(); }}, 'Claim reward'));
      else if (!s.free && !got) card.appendChild(E('div', {style:{fontSize:'10px', color:'#AB2372', fontWeight:700}}, '🔒 '+s.how));
      if (s.how && (s.buy || got)) card.appendChild(E('div', {style:{fontSize:'9.5px', color:'#8a8a8a'}}, s.buy ? '' : s.how));
      g.appendChild(card); });
    box.appendChild(g);
    box.appendChild(E('div', {cls:'wlh-small', style:{marginTop:'8px'}}, 'Themed sets: place every piece of a set anywhere in your home for a permanent +3% on all tickets. '+Object.entries(SETS).map(([k,s]) => s.e+' '+s.n+(done.includes(k)?' ✓':' ('+FURN.filter(f=>f.set==k && placedCount(H.home(p), f.id)).length+'/'+FURN.filter(f=>f.set==k).length+')')).join(' · ')));
    return box; };
  // ---------------- emotes & mounts ----------------
  const emotes = () => { const p = P(), box = E('div');
    box.appendChild(E('div', {cls:'wlh-box'}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, '💃 Emotes'), E('div', {cls:'wlh-small'}, 'Do an emote on the arcade floor with the emote buttons (bottom-left of the floor) or keys 1–6.')));
    const g = E('div', {cls:'wlh-grid'}); EMOTES.forEach((em, i) => { const ok = em.ok(p); g.appendChild(E('div', {cls:'wlh-card', style:{'--rc': ok ? '#00B451' : '#ccc', opacity: ok ? 1 : .6}, onclick:()=>{ if (ok && api.emote) { api.emote(em.k); api.close && api.close(); } }}, E('div', {style:{fontSize:'40px', animation: ok ? em.anim.replace(/\d+$/, 'infinite') : 'none'}}, em.e), E('div', {cls:'wlh-nm'}, em.n+' · key '+(i+1)), E('div', {cls:'wlh-small'}, ok ? 'Unlocked' : '🔒 '+em.how))); });
    box.appendChild(g);
    box.appendChild(E('div', {cls:'wlh-box', style:{marginTop:'12px'}}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, '🐌 Mounts'), E('div', {cls:'wlh-small'}, 'Rare rides for the arcade floor. A mount makes you walk faster. Only one can be ridden at a time.')));
    const mg = E('div', {cls:'wlh-grid'}), M = p.mounts || {}, own = M.own || {};
    MOUNTS.forEach(m => { const has = own[m.k], on = M.on == m.k, card = E('div', {cls:'wlh-card'+(on?' on':''), style:{'--rc': m.star ? '#ff5fd2' : '#2fa8e0', cursor:'default'}}, E('img', {src:H.mountSVG(m.k), alt:'', style:{width:'72px', height:'72px'}}), E('div', {cls:'wlh-nm'}, m.n), E('div', {cls:'wlh-small'}, 'Walk ×'+m.sp.toFixed(2)));
      if (has) card.appendChild(E('button', {cls:'wlh-btn'+(on?' alt':''), onclick:()=>{ set({mounts:{...M, own, on: on ? '' : m.k}}); api.sfx('blip'); render(); }}, on ? 'Get off' : 'Ride'));
      else if (m.price) { const pr = m.price(p), b = E('button', {cls:'wlh-btn', onclick:()=>{ if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); const pp = P(); if ((pp.tickets||0) < pr) return api.sfx('bad'); set({tickets:pp.tickets - pr, mounts:{...(pp.mounts||{}), own:{...((pp.mounts||{}).own||{}), [m.k]:1}, on:m.k}}); api.sfx('win'); render(); }}, fmt(pr)+' 🎟'); if ((p.tickets||0) < pr) b.disabled = true; card.appendChild(b); }
      else if (m.star) { const b = E('button', {cls:'wlh-btn gold', onclick:()=>{ if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); const pp = P(); if (freeStars(pp) < m.star) return api.sfx('bad'); set({starsSpent:(pp.starsSpent||0) + m.star, mounts:{...(pp.mounts||{}), own:{...((pp.mounts||{}).own||{}), [m.k]:1}, on:m.k}}); api.sfx('win'); render(); }}, m.star+' ⭐'); if (freeStars(p) < m.star) b.disabled = true; card.appendChild(b); }
      else if (m.ok(p)) card.appendChild(E('button', {cls:'wlh-btn gold', onclick:()=>{ const pp = P(); set({mounts:{...(pp.mounts||{}), own:{...((pp.mounts||{}).own||{}), [m.k]:1}, on:m.k}}); api.sfx('win'); render(); }}, 'Claim'));
      else card.appendChild(E('div', {style:{fontSize:'10px', color:'#AB2372', fontWeight:700}}, '🔒 '+m.how));
      mg.appendChild(card); });
    box.appendChild(mg); return box; };
  const render = () => { if (!live) return; const y = body.scrollTop; renderHead(); body.innerHTML = ''; body.appendChild(({pets, dex, eggs, home, emotes}[tab] || pets)()); };
  render();
  // wandering pets move every few seconds (stopped in Performance mode)
  wanderIv = setInterval(() => { if (!live || lowFx() || tab != 'home') return; wrap.querySelectorAll('.wlh-wander').forEach(w => { const rm = w.parentElement; if (!rm) return; const W2 = rm.offsetWidth, H2 = rm.offsetHeight; w.style.left = (10 + Math.random()*(W2-60))+'px'; w.style.top = (50 + Math.random()*(H2-100))+'px'; }); }, 2600);
  return () => { live = false; clearInterval(wanderIv); wrap.remove(); };
};

// pet & home titles join the achievement titles list
if (window.WLA && window.WLA.titles && !window.WLA._petTitles) { const old = window.WLA.titles; window.WLA._petTitles = 1; window.WLA.titles = P => [...old(P), ...H.titles(P).map(n => ({n, f:'pets', t:0}))]; }
if (typeof document != 'undefined') H.ensureCss();
window.WLH = H;
})();
