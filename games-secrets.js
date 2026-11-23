// Wilderland Arcade · SECRETS — a story-and-puzzle adventure.
// Juniper, the old keeper of the Wilderland Arcade, has vanished. Follow her trail through six places, solve a puzzle in each
// one, and look closely: every scene hides little secrets (15 in all). Progress saves forever (P.secrets) and every puzzle and
// secret pays tickets once. Tap things to look at them; the 💡 button gives gentle hints.
(function(){
const A = window.Arcade, C = A.C;
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const H = (tag, attrs, ...kids) => { const e = document.createElement(tag); for (const k in (attrs||{})) { if (k == 'style') Object.assign(e.style, attrs.style); else if (k.startsWith('on')) e[k] = attrs[k]; else e.setAttribute(k, attrs[k]); }
  kids.flat().forEach(k => k != null && e.append(k.nodeType ? k : document.createTextNode(k))); return e; };
const shuffle = a => { for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------------- the story ----------------
const ITEMS = {key:'🗝️ Brass Key', map:'🗺️ Juniper’s Map', feather:'🪶 Silver Feather', crystal:'💎 Glowing Crystal', page:'📜 Old Page', gear:'⚙️ Clock Gear', heart:'💚 Heart of the Arcade'};
const SCENES = [
  { id:'attic', n:'The Arcade Attic', sky:['#3a2a1c','#1c140c'],
    intro:['Juniper, the keeper of the Wilderland Arcade, has vanished. All she left was a note:', '“Follow the secrets. Start in the attic. — J”', 'The attic is dusty and quiet. A big old trunk sits in the corner, with a 3-number lock.'],
    hint:['Count things in the room.', 'The note on the trunk tells you the order: foxes, then birds, then stars.', 'There are 3 foxes in the painting, 7 birds on the wire and 5 stars in the window: 3 – 7 – 5.'],
    puzzle:'lock', reward:'key', next:'The trunk creaks open! Inside: a brass key and Juniper’s map. The map shows a path into the Whispering Woods.' },
  { id:'woods', n:'The Whispering Woods', sky:['#0f3a2a','#07160f'],
    intro:['The woods hum softly. An old owl sits above a gate made of twisted branches.', 'Four lanterns hang by the gate, each a different colour.'],
    hint:['Tap the owl to hear its song.', 'The lanterns light up in the owl’s order. Tap them in the same order.', 'Watch closely — the owl can sing it again as many times as you like.'],
    puzzle:'song', reward:'feather', next:'The gate untwists itself. Behind it, the owl drops a silver feather and points its wing toward a cave.' },
  { id:'cave', n:'The Crystal Cave', sky:['#1a1f40','#0a0c1e'],
    intro:['Inside the cave, a thin beam of light shines from a crack in the wall.', 'Mirrors stand on the floor. The big crystal at the far end is dark.'],
    hint:['Tap a mirror to turn it.', 'The light bounces off each mirror like a ball off a wall.', 'Get the beam to the big crystal on the right. Not every mirror needs to be used.'],
    puzzle:'beam', reward:'crystal', next:'The crystal blazes with light and pops free. In its glow you see a staircase going down… to a library under water?' },
  { id:'library', n:'The Sunken Library', sky:['#0a3a4a','#04161e'],
    intro:['Bookshelves rise into the water above you. Fish swim between the pages.', 'One huge book lies open. Its words are scrambled into a secret code.'],
    hint:['Look for a bookmark — Juniper always leaves notes.', 'The bookmark says: “Every letter takes three steps back.”', 'Turn the code wheel until the words make sense. Try moving it 3 steps.'],
    puzzle:'cipher', reward:'page', next:'The page reads: “THE KEEPER WAITS IN THE CLOCK TOWER.” It slides free of the book and floats into your hands.' },
  { id:'tower', n:'The Clock Tower', sky:['#4a2a5a','#1a0a24'],
    intro:['Gears tick all around. The giant clock face has pictures instead of numbers.', 'Carved under the clock: “Wake me when the little hand sleeps with the moon and the big hand finds the fox.”'],
    hint:['The little hand is the hour hand. The big hand is the minute hand.', 'Find the moon picture and the fox picture on the clock face.', 'The moon is where 9 would be and the fox is where 6 would be — set the clock to 9:30.'],
    puzzle:'clock', reward:'gear', next:'BONG! A hidden door opens behind the clock. A last gear drops out — and a voice calls from far below: “Is someone there?”' },
  { id:'vault', n:'The Keeper’s Vault', sky:['#2a3a1a','#0e1808'],
    intro:['Deep under the arcade is a round stone door with a sliding picture puzzle on it.', 'From behind the door: “It’s me, Juniper! The door jammed while I was guarding the Heart of the Arcade. Put the picture back together!”'],
    hint:['Tap a tile next to the empty space to slide it.', 'Build the top row first, then the left side, then the rest.', 'Take your time — there’s no timer. The finished picture is the Wilderland tree.'],
    puzzle:'slide', reward:'heart', next:'The door rumbles open. Juniper hugs you! “You followed every clue. The Heart of the Arcade is safe — and so am I.”' },
];
// hidden secrets: tiny things you can tap in each scene (x, y in a 480×300 picture)
const SECRETS = {
  attic:[{id:'mouse', x:56, y:262, r:16, t:'A tiny mouse peeks out of a hole in the wall. It’s wearing a tiny keeper’s hat!'}, {id:'initial', x:420, y:46, r:16, t:'Carved into the beam: “J was here.” Juniper has been up here a lot.'}, {id:'yoyo', x:250, y:280, r:14, t:'A yo-yo under the floorboard! There’s a note on it: “Secret #1 of the Wilderland. Keep looking.”'}],
  woods:[{id:'gnome', x:66, y:250, r:16, t:'A garden gnome is hiding behind the mushroom. He winks at you.'}, {id:'clover', x:400, y:276, r:12, t:'A four-leaf clover! Lucky you.'}, {id:'eyes', x:140, y:110, r:14, t:'Two glowing eyes in the dark… it’s just a friendly raccoon.'}],
  cave:[{id:'bat', x:90, y:44, r:16, t:'A little bat sleeps upside down, snoring softly.'}, {id:'drawing', x:200, y:240, r:16, t:'An old cave drawing of… an arcade cabinet? People have played games for a very long time.'}],
  library:[{id:'fish', x:430, y:70, r:16, t:'A fish swims by wearing reading glasses.'}, {id:'book', x:44, y:150, r:14, t:'A book titled “SECRETS OF THE WILDERLAND, Volume 2.” Volume 1 is missing…'}, {id:'pearl', x:330, y:270, r:12, t:'A shiny pearl, half buried in the sand.'}],
  tower:[{id:'pigeon', x:430, y:40, r:16, t:'A pigeon guards a tiny nest of three golden eggs.'}, {id:'bell', x:60, y:60, r:16, t:'Scratched on the bell: “J + the arcade, forever.”'}],
  vault:[{id:'lantern', x:440, y:250, r:14, t:'A lantern that never goes out. Juniper says it was lit on the day the arcade opened.'}, {id:'photo', x:46, y:90, r:16, t:'An old photo of the first players of the Wilderland Arcade. One of them looks a lot like you…'}],
};
const N_SECRETS = Object.values(SECRETS).reduce((a, l) => a + l.length, 0);

// ---------------- scene pictures (SVG, 480×300) ----------------
const svg = (inner, sky) => '<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+sky[0]+'"/><stop offset="1" stop-color="'+sky[1]+'"/></linearGradient></defs><rect width="480" height="300" fill="url(#sk)"/>'+inner+'</svg>';
const DRAW = {
  attic: S => '<path d="M0 60L240 0L480 60" fill="none" stroke="#5a3a1c" stroke-width="18"/><rect x="0" y="40" width="480" height="10" fill="#4a2e14"/><rect x="412" y="30" width="16" height="230" fill="#5a3a1c"/>'
    +'<rect x="0" y="250" width="480" height="50" fill="#4a3018"/>'+[0,1,2,3,4,5,6].map(i => '<rect x="'+(i*70)+'" y="252" width="66" height="46" fill="#5a3a1c" opacity=".6"/>').join('')
    // painting with 3 foxes
    +'<rect x="40" y="80" width="120" height="86" rx="4" fill="#8D5B1D"/><rect x="48" y="88" width="104" height="70" fill="#9fd08a"/>'+[0,1,2].map(i => '<g transform="translate('+(66+i*34)+' 128)"><path d="M-9 6l-3 -14l7 6zM9 6l3 -14l-7 6z" fill="#FF8A3C"/><circle r="10" fill="#FF8A3C"/><path d="M-4 4q4 4 8 0" fill="#fff"/><circle cx="-3" cy="-1" r="1.4" fill="#121313"/><circle cx="3" cy="-1" r="1.4" fill="#121313"/></g>').join('')
    // window with 5 stars and a wire with 7 birds
    +'<rect x="190" y="70" width="110" height="90" rx="6" fill="#14204a" stroke="#5a3a1c" stroke-width="6"/>'+[[210,92],[248,84],[282,100],[226,128],[268,138]].map(([x,y]) => '<path d="M'+x+' '+(y-6)+'l2 4l4 1l-3 3l1 4l-4 -2l-4 2l1 -4l-3 -3l4 -1z" fill="#ffe14f"/>').join('')
    +'<path d="M190 115h110M245 70v90" stroke="#5a3a1c" stroke-width="4"/>'
    +'<path d="M310 74q60 14 120 0" stroke="#2a2a2a" stroke-width="2" fill="none"/>'+[0,1,2,3,4,5,6].map(i => '<g transform="translate('+(322+i*15)+' '+(78+Math.sin(i/6*Math.PI)*6)+')"><ellipse rx="5" ry="4" fill="#64CDF5"/><circle cx="3" cy="-3" r="2.6" fill="#64CDF5"/><path d="M5 -3l3 1l-3 1z" fill="#F9BF01"/></g>').join('')
    // trunk
    +'<rect x="300" y="186" width="120" height="66" rx="8" fill="'+(S.solved.attic ? '#a8784a' : '#8D5B1D')+'"/><rect x="300" y="186" width="120" height="16" rx="6" fill="#6b4a2b"/><rect x="352" y="206" width="16" height="18" rx="3" fill="#F9BF01"/>'
    +(S.solved.attic ? '<path d="M300 186l20 -30h80l20 30" fill="#6b4a2b"/>' : '<rect x="326" y="226" width="68" height="16" rx="3" fill="#fff3b0"/><text x="360" y="238" font-size="9" text-anchor="middle" fill="#5a3a1c" font-family="sans-serif">foxes·birds·stars</text>')
    // mouse hole, yo-yo board
    +'<path d="M40 250a16 16 0 0 1 32 0z" fill="#120a04"/><rect x="236" y="272" width="30" height="10" fill="#3a2410"/>',
  woods: S => [0,1,2,3,4,5].map(i => '<path d="M'+(i*90-20)+' 300l40 -220l40 220z" fill="#0a2a1a" opacity=".9"/>').join('')
    +'<rect y="250" width="480" height="50" fill="#1f4a2a"/><path d="M60 250q6 -30 14 0z" fill="#e8e0ff"/><ellipse cx="66" cy="232" rx="20" ry="12" fill="#ff5a5a"/><circle cx="58" cy="228" r="3" fill="#fff"/><circle cx="72" cy="232" r="2.6" fill="#fff"/>'
    +'<path d="M120 70h260" stroke="#3a2a14" stroke-width="10"/><g transform="translate(250 50)"><ellipse rx="20" ry="24" fill="#8a6a44"/><circle cx="-7" cy="-6" r="7" fill="#fff"/><circle cx="7" cy="-6" r="7" fill="#fff"/><circle cx="-7" cy="-6" r="3" fill="#121313"/><circle cx="7" cy="-6" r="3" fill="#121313"/><path d="M-3 2l3 5l3 -5z" fill="#F9BF01"/></g>'
    +'<g stroke="#5a3a1c" stroke-width="8" fill="none">'+(S.solved.woods ? '<path d="M180 250q-30 -80 10 -130M300 250q30 -80 -10 -130"/>' : '<path d="M180 250q20 -80 60 -130q40 50 60 130M200 250l80 -100M280 250l-80 -100"/>')+'</g>'
    +[0,1,2,3].map(i => '<g transform="translate('+(130+i*74)+' 170)"><path d="M0 -26v10" stroke="#3a2a14" stroke-width="2"/><rect x="-10" y="-16" width="20" height="26" rx="5" fill="'+['#FF4539','#F9BF01','#00B451','#64CDF5'][i]+'" opacity=".55"/></g>').join('')
    +'<circle cx="134" cy="108" r="3" fill="#ffe14f"/><circle cx="146" cy="108" r="3" fill="#ffe14f"/><path d="M396 276l4 -6l4 6l-4 6z M400 270l6 4l-6 4l-6 -4z" fill="#3fae5a"/>',
  cave: S => '<path d="M0 0h480v40q-60 30 -120 10q-60 30 -120 0q-60 30 -120 10q-60 20 -120 0z" fill="#06081a"/><rect y="250" width="480" height="50" fill="#12142e"/>'
    +[30,110,370,450].map((x,i) => '<path d="M'+x+' 250l12 -'+(40+i*12)+'l12 '+(40+i*12)+'z" fill="#64CDF5" opacity=".35"/>').join('')
    +'<g transform="translate(90 40)"><path d="M-14 0q-6 10 0 14q6 -6 14 -6q8 0 14 6q6 -4 0 -14q-8 4 -14 4q-6 0 -14 -4z" fill="#3a2a4a"/><circle cx="-4" cy="8" r="1.4" fill="#fff"/><circle cx="4" cy="8" r="1.4" fill="#fff"/></g>'
    +'<rect x="176" y="224" width="48" height="30" rx="4" fill="#5a5a7a" opacity=".6"/><path d="M188 248v-16h24v16M192 236h16" stroke="#c9b48a" stroke-width="2" fill="none"/>'
    +'<g transform="translate(420 160)"><path d="M0 -40l22 30l-22 50l-22 -50z" fill="'+(S.solved.cave ? '#bff0ff' : '#3a4a6a')+'"/>'+(S.solved.cave ? '<circle r="50" fill="#bff0ff" opacity=".25"/>' : '')+'</g>',
  library: S => [0,1,2,3,4,5].map(i => '<rect x="'+(i*82)+'" y="20" width="70" height="230" fill="#3a2410"/>'+[0,1,2,3,4].map(r => '<rect x="'+(i*82+4)+'" y="'+(30+r*44)+'" width="62" height="36" fill="'+['#8a3a2a','#2a5a8a','#5a8a2a','#8a7a2a'][(i+r)%4]+'" opacity=".8"/>').join('')).join('')
    +'<rect y="250" width="480" height="50" fill="#c8b078"/><g transform="translate(240 230)"><path d="M-90 0l90 -20l90 20v30l-90 -14l-90 14z" fill="#f3efe0" stroke="#8D5B1D" stroke-width="3"/></g>'
    +'<rect x="300" y="214" width="8" height="30" fill="#FF4539"/>'
    +'<g transform="translate(430 70)"><ellipse rx="18" ry="10" fill="#F9BF01"/><path d="M16 0l12 -8v16z" fill="#F9BF01"/><circle cx="-8" cy="-2" r="4" fill="none" stroke="#121313" stroke-width="1.5"/><circle cx="2" cy="-2" r="4" fill="none" stroke="#121313" stroke-width="1.5"/></g>'
    +'<rect x="36" y="134" width="16" height="32" fill="#a64be0"/><circle cx="330" cy="272" r="6" fill="#fff" stroke="#e0d0ff"/>'
    +[0,1,2,3,4,5,6,7].map(i => '<circle cx="'+(30+i*60)+'" cy="'+(80+(i*37)%120)+'" r="'+(3+i%3)+'" fill="none" stroke="#bff0ff" opacity=".5"/>').join(''),
  tower: S => '<rect y="250" width="480" height="50" fill="#2a1a30"/>'+[[60,240,40],[420,230,50],[110,90,26],[380,120,30]].map(([x,y,r]) => '<g transform="translate('+x+' '+y+')"><circle r="'+r+'" fill="none" stroke="#c48a00" stroke-width="8" stroke-dasharray="8 6"/><circle r="'+(r*.4)+'" fill="#6b4a2b"/></g>').join('')
    +'<g transform="translate(240 140)"><circle r="90" fill="#f3efe0" stroke="#8D5B1D" stroke-width="10"/>'+CLOCK_PICS.map((p,i) => { const a = (i+1)/12*Math.PI*2 - Math.PI/2; return '<text x="'+(Math.cos(a)*70)+'" y="'+(Math.sin(a)*70+7)+'" font-size="20" text-anchor="middle">'+p+'</text>'; }).join('')
    +'<line x1="0" y1="0" x2="'+(Math.cos(((S.clk||{h:12}).h%12)/12*Math.PI*2-Math.PI/2)*40)+'" y2="'+(Math.sin(((S.clk||{h:12}).h%12)/12*Math.PI*2-Math.PI/2)*40)+'" stroke="#121313" stroke-width="7" stroke-linecap="round"/>'
    +'<line x1="0" y1="0" x2="'+(Math.cos(((S.clk||{m:0}).m)/60*Math.PI*2-Math.PI/2)*62)+'" y2="'+(Math.sin(((S.clk||{m:0}).m)/60*Math.PI*2-Math.PI/2)*62)+'" stroke="#8a3a2a" stroke-width="4" stroke-linecap="round"/><circle r="6" fill="#121313"/></g>'
    +'<g transform="translate(60 60)"><path d="M-18 20q0 -36 18 -36q18 0 18 36z" fill="#c48a00"/><circle cy="22" r="4" fill="#8a5a00"/></g><g transform="translate(430 40)"><ellipse rx="14" ry="10" fill="#9a9aa8"/><circle cx="10" cy="-6" r="6" fill="#9a9aa8"/><path d="M15 -6l5 1l-5 2z" fill="#F9BF01"/></g>',
  vault: S => '<rect y="250" width="480" height="50" fill="#3a3a2a"/><circle cx="240" cy="140" r="110" fill="#6a6a5a" stroke="#4a4a3a" stroke-width="14"/>'
    +(S.solved.vault ? '<circle cx="240" cy="140" r="96" fill="#0e1808"/><g transform="translate(240 150)"><circle r="40" fill="#00B451" opacity=".35"/><path d="M0 -26q18 0 18 18q0 20 -18 30q-18 -10 -18 -30q0 -18 18 -18z" fill="#00B451"/></g>' : '<rect x="180" y="80" width="120" height="120" rx="6" fill="#3a3a2a"/>')
    +'<rect x="30" y="70" width="34" height="42" fill="#d8c8a8" stroke="#8D5B1D" stroke-width="3"/><g transform="translate(440 240)"><rect x="-8" y="-14" width="16" height="22" rx="4" fill="#F9BF01"/><circle cy="-4" r="14" fill="#F9BF01" opacity=".3"/></g>',
};
const CLOCK_PICS = ['🌲','🍄','⭐','🦉','🌸','🦊','🐸','🪨','🌙','🍁','🐻','☀️'];   // 1 … 12

// ---------------- the game ----------------
A.register('secrets', { mount(host, api){
  const fresh = () => ({v:1, ch:0, items:[], secrets:{}, solved:{}, paid:{}, intro:{}, hints:{}, clk:{h:12, m:0}, done:false});
  let S = api.stored && api.stored.v == 1 ? JSON.parse(JSON.stringify(api.stored)) : fresh();
  const save = () => { try { api.store && api.store(S); } catch(e){} };
  // repair older saves: a solved place always unlocks the one after it
  { let k = 0; while (k < SCENES.length-1 && S.solved[SCENES[k].id]) k++; S.ch = Math.max(S.ch|0, k); }
  const found = () => Object.keys(S.secrets).length, solvedN = () => Object.keys(S.solved).length;
  const score = () => solvedN()*500 + found()*150 + (S.done ? 2000 : 0);
  const pay = (key, n, label) => { if (S.paid[key]) return 0; S.paid[key] = 1; let got = 0; try { got = api.tix ? api.tix(n, score(), label) : 0; } catch(e){} save(); return got; };
  const wrap = H('div', {style:{fontFamily:A.font, maxWidth:'640px', margin:'0 auto', background:'#120c08', borderRadius:'14px', overflow:'hidden', color:'#EDE9D8', position:'relative', userSelect:'none'}}); host.appendChild(wrap);
  const top = H('div', {style:{display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', background:'#1f150d', flexWrap:'wrap'}});
  const stage = H('div', {style:{position:'relative'}});
  const talk = H('div', {style:{minHeight:'78px', padding:'10px 14px', background:'#f3efe0', color:'#2a1d12', fontSize:'15px', lineHeight:'1.4', cursor:'pointer'}});
  const inv = H('div', {style:{display:'flex', gap:'6px', flexWrap:'wrap', padding:'8px 12px', background:'#1f150d', fontSize:'13px', alignItems:'center'}});
  wrap.append(top, stage, talk, inv);
  const btn = (txt, fn, bg, fg) => H('button', {style:{fontFamily:A.font, fontWeight:700, fontSize:'13px', border:'none', borderRadius:'999px', padding:'7px 12px', cursor:'pointer', background:bg||'rgba(255,255,255,.14)', color:fg||'#fff'}, onclick:e => { e.stopPropagation(); fn(); }}, txt);
  // dialogue: a queue of lines, tap to continue
  let lines = [], onDone = null;
  const say = (ls, done) => { lines = [].concat(ls); onDone = done || null; nextLine(); };
  const nextLine = () => { talk.innerHTML = ''; if (!lines.length) { { const sc2 = SCENES[Math.min(view, SCENES.length-1)]; talk.append(H('span', {style:{opacity:.75}}, S.solved[sc2.id] ? (view < S.ch && view < SCENES.length-1 ? 'Solved! Tap “Go to '+SCENES[view+1].n+'” below to keep going — or hunt for secrets here.' : 'Solved! Look around for hidden secrets.') : 'Tap things in the picture to look around. The dashed circle is the puzzle — 💡 Hint helps if you’re stuck.')); } const d = onDone; onDone = null; if (d) d(); return; }
    const l = lines.shift(); talk.append(H('div', null, l), H('div', {style:{fontSize:'11px', fontWeight:700, color:'#AB2372', marginTop:'4px'}}, lines.length ? 'tap to continue ▸' : 'tap ✓')); };
  talk.onclick = () => { A.sfx('blip'); nextLine(); };
  const scene = () => SCENES[Math.min(S.ch, SCENES.length-1)];
  // modal puzzle box
  let modal = null; const closeModal = () => { if (modal) modal.remove(); modal = null; };
  const openModal = (title, body) => { closeModal(); modal = H('div', {style:{position:'absolute', inset:0, background:'rgba(10,6,3,.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', padding:'14px', zIndex:5, textAlign:'center'}},
      H('div', {style:{fontWeight:800, fontSize:'18px', color:C.gold}}, title), body, btn('Close', closeModal)); stage.append(modal); };
  const solve = id => { if (S.solved[id]) return; const sc = SCENES.find(x => x.id == id); S.solved[id] = 1; if (sc.reward && !S.items.includes(sc.reward)) S.items.push(sc.reward); closeModal(); A.sfx('win');
    if (id != 'vault') S.ch = Math.max(S.ch, SCENES.indexOf(sc)+1);   // unlock the next place right away, even if the talk is skipped
    const got = pay('p_'+id, 120*(SCENES.indexOf(sc)+1), 'SECRETS'); stat(api, 'secretsChapters', solvedN()); api.score(score());
    say([sc.next, 'You got: '+ITEMS[sc.reward]+(got ? ' · +'+A.fmt(got)+' tickets' : '')], () => { if (id == 'vault') finale(); else { S.ch = Math.max(S.ch, SCENES.indexOf(sc)+1); view = SCENES.indexOf(sc)+1; save(); render(); story(); } }); save(); render(); };
  const finale = () => { S.done = true; const all = found() >= N_SECRETS; const got = pay('finale', 1500, 'SECRETS'); stat(api, 'secretsDone', 1); api.score(score()); save(); render();
    say(['Juniper smiles. “Every arcade needs a keeper. I think it’s time I had a helper.”', 'You are now a Keeper of the Wilderland Arcade! 🌲'+(got ? ' · +'+A.fmt(got)+' tickets' : ''),
      all ? 'Juniper leans in and whispers: “You found ALL '+N_SECRETS+' secrets. Nobody has ever done that. The arcade itself thanks you.” ✨' : 'Juniper winks: “There are still '+(N_SECRETS - found())+' secrets hiding in these places. A true keeper finds them all.”'],
      () => { if (all) { const g2 = pay('allsecrets', 3000, 'SECRETS'); if (g2) say(['SECRET ENDING · +'+A.fmt(g2)+' tickets. You are the Secret Keeper!']); } }); };
  // ---------------- puzzles ----------------
  const PUZ = {
    lock: () => { const d = [0,0,0], disp = H('div', {style:{display:'flex', gap:'10px'}}); const draw = () => { disp.innerHTML = ''; d.forEach((v, i) => disp.append(H('div', {style:{display:'flex', flexDirection:'column', alignItems:'center', gap:'4px'}},
        btn('▲', () => { d[i] = (d[i]+1)%10; A.sfx('blip'); draw(); check(); }), H('div', {style:{width:'46px', height:'56px', borderRadius:'8px', background:'#F9BF01', color:'#2a1d12', fontSize:'34px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center'}}, String(v)),
        btn('▼', () => { d[i] = (d[i]+9)%10; A.sfx('blip'); draw(); check(); })))); };
      const check = () => { if (d.join('') == '375') setTimeout(() => solve('attic'), 250); }; draw();
      openModal('🔒 The trunk lock', H('div', {style:{display:'flex', flexDirection:'column', alignItems:'center', gap:'8px'}}, H('div', {style:{fontSize:'13px'}}, 'The note says: foxes · birds · stars'), disp)); },
    song: () => { const cols = ['#FF4539','#F9BF01','#00B451','#64CDF5'], seq = S.song || (S.song = Array.from({length:5}, () => Math.floor(Math.random()*4))); let pos = 0, busy = false;
      const lan = cols.map((c, i) => H('button', {style:{width:'54px', height:'70px', borderRadius:'12px', border:'3px solid #3a2a14', background:c, opacity:.4, cursor:'pointer'}, onclick:() => { if (busy) return; flash(i);
        if (i === seq[pos]) { pos++; A.tone(400+i*120,.15,'sine',.05); if (pos == seq.length) setTimeout(() => solve('woods'), 400); } else { pos = 0; A.sfx('bad'); msg.textContent = 'Oops! Start again — or ask the owl to sing.'; } }}));
      const flash = i => { lan[i].style.opacity = 1; setTimeout(() => lan[i].style.opacity = .4, 280); };
      const sing = () => { busy = true; pos = 0; msg.textContent = 'Hoo… hoo… listen!'; seq.forEach((k, j) => setTimeout(() => { flash(k); A.tone(400+k*120,.2,'sine',.05); if (j == seq.length-1) setTimeout(() => { busy = false; msg.textContent = 'Now tap the lanterns in the same order.'; }, 400); }, 600*j+300)); };
      const msg = H('div', {style:{fontSize:'13px'}}, 'Tap the owl to hear its song.');
      openModal('🦉 The owl’s song', H('div', {style:{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}, btn('🦉 Ask the owl to sing', sing, C.gold, '#2a1d12'), H('div', {style:{display:'flex', gap:'10px'}}, lan), msg)); setTimeout(sing, 500); },
    beam: () => { // 5×3 grid, beam enters at row 1 going right; mirrors '/' or '\' that you rotate; goal: exit at row 1 → right side… via a path
      // solution: (1,0) \  (2,0) \  (2,2) /  (1,2) /  → out on the right of the middle row; (0,1) (0,3) (2,4) are decoys
      const G = [['', '/', '', '\\', ''], ['\\', '', '/', '', ''], ['\\', '', '/', '', '/']];
      const mir = [[0,1],[0,3],[1,0],[1,2],[2,0],[2,2],[2,4]], grid = G.map(r => r.slice()); mir.forEach(([r,c]) => { if (Math.random() < .6) grid[r][c] = grid[r][c] == '/' ? '\\' : '/'; });
      const CS = 58, box = H('div', {style:{position:'relative', width:(5*CS+60)+'px', height:(3*CS)+'px'}});
      const trace = () => { let r = 1, c = -1, dr = 0, dc = 1, path = [[r, c]], steps = 0; while (steps++ < 40) { r += dr; c += dc; if (c == 5 && r == 1) return {path:[...path, [r,c]], win:true}; if (r < 0 || r > 2 || c < 0 || c > 4) break; path.push([r,c]);
          const m = grid[r][c]; if (m == '/') [dr, dc] = [-dc, -dr]; else if (m == '\\') [dr, dc] = [dc, dr]; } return {path, win:false}; };
      const draw = () => { box.innerHTML = ''; const t = trace(); let s = '<svg width="'+(5*CS+60)+'" height="'+(3*CS)+'" style="position:absolute;left:0;top:0;pointer-events:none">';
        s += '<rect x="'+(5*CS+10)+'" y="'+(CS*1+8)+'" width="40" height="'+(CS-16)+'" rx="8" fill="'+(t.win ? '#bff0ff' : '#3a4a6a')+'"/>';
        s += '<polyline points="'+t.path.map(([r,c]) => (c*CS+CS/2)+','+(r*CS+CS/2)).join(' ')+'" fill="none" stroke="#ffe14f" stroke-width="5" stroke-linecap="round"/></svg>';
        for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const m = grid[r][c]; const cell = H('div', {style:{position:'absolute', left:c*CS+'px', top:r*CS+'px', width:CS-4+'px', height:CS-4+'px', borderRadius:'8px', background:'rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', color:'#bff0ff', cursor: m ? 'pointer' : 'default'},
            onclick:() => { if (!m) return; grid[r][c] = m == '/' ? '\\' : '/'; A.tone(700,.05,'triangle',.04); draw(); if (trace().win) setTimeout(() => solve('cave'), 500); }}, m ? (m == '/' ? '╱' : '╲') : ''); box.append(cell); }
        box.insertAdjacentHTML('beforeend', s); };
      if (trace().win) grid[1][0] = grid[1][0] == '/' ? '\\' : '/';
      draw(); openModal('🔦 Guide the light to the crystal', H('div', {style:{display:'flex', flexDirection:'column', alignItems:'center', gap:'8px'}}, H('div', {style:{fontSize:'13px'}}, 'The beam comes in from the left. Tap a mirror to turn it.'), box)); },
    cipher: () => { const plain = 'THE KEEPER WAITS IN THE CLOCK TOWER', code = plain.replace(/[A-Z]/g, ch => String.fromCharCode((ch.charCodeAt(0)-65+3)%26+65)); let k = 0;
      const out = H('div', {style:{fontSize:'18px', fontWeight:800, letterSpacing:'.08em', background:'#f3efe0', color:'#2a1d12', padding:'10px 14px', borderRadius:'10px', maxWidth:'420px'}}), lbl = H('div', {style:{fontSize:'13px'}});
      const draw = () => { out.textContent = code.replace(/[A-Z]/g, ch => String.fromCharCode((ch.charCodeAt(0)-65-k+26)%26+65)); lbl.textContent = 'Code wheel: '+k+' step'+(k==1?'':'s')+' back'; if (k == 3) setTimeout(() => solve('library'), 700); };
      draw(); openModal('📖 The coded page', H('div', {style:{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}, out, H('div', {style:{display:'flex', gap:'8px', alignItems:'center'}}, btn('◀', () => { k = (k+25)%26; A.sfx('blip'); draw(); }), lbl, btn('▶', () => { k = (k+1)%26; A.sfx('blip'); draw(); })))); },
    clock: () => { S.clk = S.clk || {h:12, m:0}; const lbl = H('div', {style:{fontSize:'16px', fontWeight:800}});
      const draw = () => { lbl.textContent = 'Little hand: '+CLOCK_PICS[(S.clk.h+11)%12]+'   Big hand: '+CLOCK_PICS[((S.clk.m/5)+11)%12 | 0]; render(); if (S.clk.h == 9 && S.clk.m == 30) setTimeout(() => solve('tower'), 600); };
      draw(); openModal('🕰️ Set the clock', H('div', {style:{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}, H('div', {style:{fontSize:'13px', maxWidth:'360px'}}, '“Wake me when the little hand sleeps with the moon and the big hand finds the fox.”'), lbl,
        H('div', {style:{display:'flex', gap:'8px'}}, btn('Little hand ⟳', () => { S.clk.h = S.clk.h % 12 + 1; A.tone(300,.05,'square',.04); draw(); }), btn('Big hand ⟳', () => { S.clk.m = (S.clk.m + 5) % 60; A.tone(500,.05,'square',.04); draw(); })))); },
    slide: () => { let t = [1,2,3,4,5,6,7,8,0]; for (let i = 0; i < 120; i++) { const z = t.indexOf(0), nb = [z-3, z+3, z%3 ? z-1 : -1, z%3 < 2 ? z+1 : -1].filter(x => x >= 0 && x < 9); const j = nb[Math.floor(Math.random()*nb.length)]; [t[z], t[j]] = [t[j], t[z]]; }
      const CS = 76, box = H('div', {style:{position:'relative', width:CS*3+'px', height:CS*3+'px', background:'#0e1808', borderRadius:'10px'}});
      const piece = n => { const r = Math.floor((n-1)/3), c = (n-1)%3; return '<svg viewBox="'+(c*60)+' '+(r*60)+' 60 60" width="'+(CS-4)+'" height="'+(CS-4)+'"><rect width="180" height="180" fill="#bfe6ff"/><circle cx="140" cy="40" r="18" fill="#F9BF01"/><rect y="140" width="180" height="40" fill="#3fae5a"/><path d="M90 20l40 60h-20l30 40h-100l30 -40h-20z" fill="#015640"/><rect x="82" y="118" width="16" height="30" fill="#8D5B1D"/><text x="'+(c*60+8)+'" y="'+(r*60+16)+'" font-size="12" font-weight="700" fill="#fff" stroke="#121313" stroke-width=".6" font-family="sans-serif">'+n+'</text></svg>'; };
      const draw = () => { box.innerHTML = ''; t.forEach((n, i) => { if (!n) return; const el = H('div', {style:{position:'absolute', left:(i%3)*CS+2+'px', top:Math.floor(i/3)*CS+2+'px', width:CS-4+'px', height:CS-4+'px', borderRadius:'6px', overflow:'hidden', cursor:'pointer', transition:'left .12s, top .12s'},
          onclick:() => { const z = t.indexOf(0); const adj = (Math.abs(z-i) == 3) || (Math.abs(z-i) == 1 && Math.floor(z/3) == Math.floor(i/3)); if (!adj) return; [t[z], t[i]] = [t[i], t[z]]; A.tone(600,.04,'triangle',.04); draw(); if (t.join('') == '123456780') setTimeout(() => solve('vault'), 500); }}); el.innerHTML = piece(n); box.append(el); }); };
      draw(); openModal('🧩 The stone door', H('div', {style:{display:'flex', flexDirection:'column', alignItems:'center', gap:'8px'}}, H('div', {style:{fontSize:'13px'}}, 'Slide the tiles into order 1–8 to rebuild the Wilderland tree.'), box)); },
  };
  // ---------------- drawing the scene + its hotspots ----------------
  const spots = sc => { const id = sc.id, L = [];
    const P = (x, y, r, fn, ring) => L.push({x, y, r, fn, ring});
    if (id == 'attic') { P(360, 220, 50, () => S.solved.attic ? say('The trunk is empty now.') : PUZ.lock(), true); P(100, 122, 50, () => say('A painting of three foxes playing in a meadow.')); P(245, 115, 50, () => say('Through the window you can see five bright stars.')); P(370, 80, 50, () => say('Seven little birds sit in a row on the wire outside.')); }
    if (id == 'woods') { P(250, 50, 30, () => S.solved.woods ? say('The owl nods at you wisely.') : PUZ.song(), true); P(240, 200, 60, () => S.solved.woods ? say('The gate is open.') : say('The gate is twisted shut. The lanterns flicker like they’re waiting for something.')); }
    if (id == 'cave') { P(240, 150, 120, () => S.solved.cave ? say('The cave glitters with light.') : PUZ.beam(), true); }
    if (id == 'library') { P(304, 228, 18, () => { S.hints.library = Math.max(S.hints.library||0, 2); save(); say('A bookmark in Juniper’s handwriting: “Every letter takes three steps back.”'); }); P(240, 225, 70, () => S.solved.library ? say('The book is closed now.') : PUZ.cipher(), true); }
    if (id == 'tower') { P(240, 140, 90, () => S.solved.tower ? say('The clock ticks happily.') : PUZ.clock(), true); }
    if (id == 'vault') { P(240, 140, 100, () => S.solved.vault ? say('The Heart of the Arcade glows warmly.') : PUZ.slide(), true); }
    (SECRETS[id] || []).forEach(sec => P(sec.x, sec.y, sec.r, () => { if (S.secrets[id+':'+sec.id]) return say(sec.t); S.secrets[id+':'+sec.id] = 1; A.sfx('coin');
      const got = pay('s_'+id+':'+sec.id, 60, 'SECRETS'); stat(api, 'secretsFound', found()); api.score(score()); say(['✨ SECRET FOUND! ('+found()+'/'+N_SECRETS+')', sec.t+(got ? ' · +'+A.fmt(got)+' tickets' : '')]); save(); render(); }));
    return L; };
  let view = 0;   // which scene you're looking at (you can go back to earlier ones to hunt secrets)
  const render = () => { const sc = SCENES[Math.min(view, SCENES.length-1)];
    top.innerHTML = ''; top.append(H('div', {style:{fontWeight:800, color:C.gold, flex:'1 1 160px'}}, '🔍 '+sc.n),
      H('div', {style:{fontSize:'12px', opacity:.85}}, '✨ '+found()+'/'+N_SECRETS+' secrets · 🧩 '+solvedN()+'/6 puzzles'),
      btn('💡 Hint', () => { const k = Math.min(sc.hint.length-1, S.hints[sc.id]||0); S.hints[sc.id] = k+1; save(); say('💡 '+sc.hint[k]); }, C.gold, '#2a1d12'),
      btn('🗺 Places', () => { const box = H('div', {style:{display:'flex', flexDirection:'column', gap:'6px'}}); SCENES.forEach((s2, i) => { const ok = i <= S.ch; box.append(btn((ok ? '' : '🔒 ')+(i+1)+'. '+s2.n+(S.solved[s2.id] ? ' ✓' : '')+' · '+(SECRETS[s2.id]||[]).filter(x => S.secrets[s2.id+':'+x.id]).length+'/'+(SECRETS[s2.id]||[]).length+' ✨', () => { if (!ok) return A.sfx('bad'); view = i; closeModal(); render(); story(); }, ok ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.05)')); }); openModal('🗺 Juniper’s map', box); }));
    stage.innerHTML = ''; const pic = H('div'); pic.innerHTML = svg(DRAW[sc.id](S), sc.sky); stage.append(pic);
    const layer = H('div', {style:{position:'absolute', inset:0}}); stage.append(layer);
    spots(sc).forEach(s => layer.append(H('button', {'aria-label':'look', style:{position:'absolute', left:(s.x - s.r)/480*100+'%', top:(s.y - s.r)/300*100+'%', width:(s.r*2)/480*100+'%', height:(s.r*2)/300*100+'%', borderRadius:'50%', border: s.ring ? '2px dashed rgba(249,191,1,.55)' : 'none', background:'transparent', cursor:'pointer', padding:0}, onclick:() => { A.sfx('blip'); s.fn(); }})));
    if (modal) stage.append(modal);
    inv.innerHTML = ''; if (S.solved[sc.id] && view < S.ch && view < SCENES.length-1) inv.append(btn('➡ Go to '+SCENES[view+1].n, () => { view++; closeModal(); render(); story(); }, C.lime, '#015640'));
    inv.append(H('b', {style:{color:C.gold}}, 'Bag:')); if (!S.items.length) inv.append(H('span', {style:{opacity:.6}}, 'empty'));
    S.items.forEach(k => inv.append(H('span', {style:{background:'rgba(255,255,255,.12)', borderRadius:'999px', padding:'4px 10px'}}, ITEMS[k])));
    if (S.done) inv.append(btn('↺ Play the story again', () => { const keep = {paid:S.paid, secrets:S.secrets}; S = {...fresh(), ...keep}; view = 0; save(); render(); story(); }));
  };
  const story = () => { const sc = SCENES[Math.min(view, SCENES.length-1)]; if (!S.intro[sc.id]) { S.intro[sc.id] = 1; save(); say(sc.intro); } else if (!lines.length) nextLine(); };
  view = Math.min(S.ch, SCENES.length-1); render(); story(); api.score(score());
  const offK = A.keys(e => { if (e.key == ' ' || e.key == 'Enter') { nextLine(); return; } if (e.key == 'Escape' && modal) { closeModal(); return; } return false; });
  A._secrets = {get: () => JSON.parse(JSON.stringify(S)), solve, SCENES, SECRETS, N_SECRETS, view: i => { view = i; render(); }};
  return () => { save(); offK(); A._secrets = null; };
}});
})();
