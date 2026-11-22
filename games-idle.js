// Wilderland Arcade · THE MINES — a merge-and-dig mine, 300 layers deep.
// Hire miners, drag two of the same level together to merge them, and dig. When the bar at the top fills you break
// through to the next layer. 21 biomes, each with its own thing to tap (worms, boulders, chiming crystals, a sleeping
// dragon, glyph puzzles, notes …), every layer with its own twist, and Dot the Mole's story down to Layer 300:
// The Armageddon Core.
// Learn mode: math geodes are the big payout — crack them by answering the problem.
(function(){
const A = window.Arcade, C = A.C, el = A.el;
const rrect = (g,x,y,w,h,r) => { g.beginPath(); if (g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
const edu = (api,ok) => { try { api.edu && api.edu(ok); } catch(e){} };
const stat = (api,k,v,m) => { try { api.stat && api.stat(k,v,m); } catch(e){} };
const TAU = Math.PI*2;

// Max miner level: 30, and +15% (rounded down) for every Rebirth: 30, 34, 39, 45, 51 …
const maxLevel = rb => { let m = 30; for (let i=0;i<(rb||0) && m < 1000;i++) m = Math.floor(m*1.15); return Math.min(1000, m); };
const ensureLV = n => { while (LV.length <= n) { const i = LV.length; LV.push({n:'Titan Mk '+(i-29), c:'hsl('+((i*53)%360)+',90%,'+(60+(i%3)*8)+'%)'}); } };
const LV = [null,
  {n:'Pebble Picker',c:'#b8b8b0'}, {n:'Shovel Scout',c:'#c48a4a'}, {n:'Drill Digger',c:'#00B451'}, {n:'Dynamite Dan',c:'#FF4539'},
  {n:'Steam Borer',c:'#64CDF5'}, {n:'Gold Panner',c:'#F9BF01'}, {n:'Laser Miner',c:'#EA55AB'}, {n:'Crystal Crusher',c:'#E9B9F7'},
  {n:'Magma Wrangler',c:'#ff8a3c'}, {n:'Quantum Quarrier',c:'#C7F1EE'}, {n:'Core Tapper',c:'#D5F367'}, {n:'Planet Cracker',c:'#ffffff'}];
['Moon Miner','Comet Catcher','Star Breaker','Nebula Drill','Solar Smelter','Void Digger','Galaxy Grinder','Black-Hole Borer','Time Tunneler','Dimension Delver','Reality Ripper','Cosmic Quarry','Infinity Pick','Big Bang Boss','Multiverse Miner','The Last Miner','Legend of the Deep','Wilderland Titan']
  .forEach((n,i)=>LV.push({n, c:'hsl('+((i*37)%360)+',85%,'+(62+(i%3)*8)+'%)'}));
// Ore per miner: ×2.7 per level up to Lv 241, then +50% per level — so numbers stay real (never Infinity) even at Lv 1000.
const BIG = 1e300, fin = v => (v = Number(v), v !== v) ? 0 : v > BIG ? BIG : v < -BIG ? -BIG : v;
const lvRate = L => L ? 3 * Math.pow(2.7, Math.min(L, 241)-1) * (L > 241 ? 1 + (L-241)*.5 : 1) : 0;

// ---------------- 300 LAYERS in 21 biomes ----------------
// Every biome plays differently (mech) and every layer gets its own twist (trait) and its own scenery layout.
// fx: drip · dust · lava · snow · spores · sparks · bubbles · gears · embers · stars · void · core
const BIOMES = [
  {id:'soil', n:'Topsoil Tunnels', e:'🪱', a:'#6b4a2b', b:'#4e3520', ore:'#c48a4a', fx:'drip', hz:'Root Snarl', tr:'Old Coin Pouch', mech:'worms'},
  {id:'stone',n:'Stone Halls', e:'🪨', a:'#6d6f73', b:'#4b4d50', ore:'#d9d9d9', fx:'dust', hz:'Loose Rocks', tr:'Iron Lockbox', mech:'boulders'},
  {id:'crystal',n:'Crystal Caves', e:'💎', a:'#2f3a5a', b:'#1f2740', ore:'#9fd8ff', fx:'sparks', hz:'Crystal Shard Storm', tr:'Prism Geode', mech:'chime'},
  {id:'magma',n:'Magma Shelf', e:'🌋', a:'#4a2420', b:'#2e1513', ore:'#ff7a3c', fx:'lava', hz:'Lava Burst', tr:'Fire Opal', mech:'pulse'},
  {id:'core', n:'Steam Vents', e:'♨️', a:'#3b1d3f', b:'#241226', ore:'#D5F367', fx:'embers', hz:'Heat Vent', tr:'Core Ember', mech:'vents'},
  {id:'cosmic',n:'Starfall Seams', e:'🌠', a:'#101a3a', b:'#070c20', ore:'#ffffff', fx:'stars', hz:'Gravity Rift', tr:'Star Shard', mech:'meteors'},
  {id:'ice',  n:'Frozen Depths', e:'🧊', a:'#5a7a94', b:'#2c4458', ore:'#dff6ff', fx:'snow', hz:'Icicle Drop', tr:'Frozen Relic', mech:'slide'},
  {id:'fungal',n:'Fungal Forest', e:'🍄', a:'#3a2a4a', b:'#1f1628', ore:'#9fffb0', fx:'spores', hz:'Spore Cloud', tr:'Glowcap Cache', mech:'bounce'},
  {id:'ruins',n:'Ancient Ruins', e:'🏛️', a:'#5a5040', b:'#38301f', ore:'#F9BF01', fx:'dust', hz:'Ancient Trap', tr:'Golden Idol', mech:'glyphs'},
  {id:'sunken',n:'Sunken City', e:'🫧', a:'#14465a', b:'#0a2a38', ore:'#9fe8ff', fx:'bubbles', hz:'Flood Surge', tr:'Pearl Chest', mech:'bubbles'},
  {id:'clock',n:'Clockwork Deep', e:'⚙️', a:'#4a3a28', b:'#2a2014', ore:'#ffd23a', fx:'gears', hz:'Runaway Gear', tr:'Clockwork Heart', mech:'gears'},
  {id:'candy',n:'Candy Caverns', e:'🍬', a:'#7a3a6a', b:'#4a1f42', ore:'#ff9fe8', fx:'sparks', hz:'Sticky Syrup', tr:'Gumdrop Jar', mech:'gumdrops'},
  {id:'jungle',n:'Underground Jungle', e:'🌿', a:'#2a5a2a', b:'#143014', ore:'#b6ff6a', fx:'spores', hz:'Snapping Vines', tr:'Jungle Idol', mech:'vines'},
  {id:'dragon',n:'Dragon Lairs', e:'🐉', a:'#5a1a10', b:'#2a0a06', ore:'#ffb03a', fx:'embers', hz:'Dragon Breath', tr:'Dragon Hoard', mech:'dragon'},
  {id:'desert',n:'Buried Desert', e:'🏜️', a:'#8a6a3a', b:'#5a4020', ore:'#ffe08a', fx:'dust', hz:'Quicksand', tr:'Pharaoh’s Chest', mech:'sandworm'},
  {id:'cathedral',n:'Crystal Cathedral', e:'🎶', a:'#3a2a6a', b:'#1a1238', ore:'#ff9fe8', fx:'sparks', hz:'Resonance Wave', tr:'Choir Crystal', mech:'notes'},
  {id:'cloud',n:'Sky Hollows', e:'☁️', a:'#6a9ac8', b:'#3a6a98', ore:'#ffffff', fx:'snow', hz:'Wind Gust', tr:'Cloud Pearl', mech:'islands'},
  {id:'rift', n:'Cosmic Rift', e:'🌀', a:'#1a0a3a', b:'#06021a', ore:'#b48cff', fx:'stars', hz:'Meteor Shower', tr:'Nebula Pearl', mech:'portals'},
  {id:'neon', n:'Neon Circuit', e:'⚡', a:'#0a2a3a', b:'#02101a', ore:'#3affd5', fx:'sparks', hz:'Power Surge', tr:'Data Crystal', mech:'circuit'},
  {id:'void', n:'The Void', e:'🕳️', a:'#0b0b14', b:'#000000', ore:'#b48cff', fx:'void', hz:'Void Tendril', tr:'Void Pearl', mech:'dark'},
  {id:'armageddon',n:'The Armageddon Core', e:'☄️', a:'#3a0606', b:'#120000', ore:'#ff3a1a', fx:'core', hz:'Armageddon Flare', tr:'Heart of the World', mech:'final'},
];
const BI = id => BIOMES.find(b => b.id === id);
// The first 12 layers keep their old names and depths, so older saves stay on the same layer.
const OLD = [['Topsoil',0,'soil'],['Clay Bed',1e3,'soil'],['Granite',2e4,'stone'],['Iron Vein',3e5,'stone'],['Gold Seam',5e6,'stone'],['Crystal Cave',8e7,'crystal'],
  ['Magma Shelf',1.5e9,'magma'],['The Core',3e10,'core'],['Mantle Gate',1e12,'core'],['Starfall Vein',5e13,'cosmic'],['Void Cavern',3e15,'cosmic'],['Planet Heart',2e17,'core']];
// name pools: every layer gets a unique name made from its biome's words
const NAMES = {
  ice:[['Frostbite','Glacier','Rime','Snowglobe','Permafrost'],['Gallery','Throat','Hollow','Vault']],
  fungal:[['Mushroom','Glowcap','Mycelium','Puffball','Toadstool'],['Hollow','Grotto','Maze','Terraces']],
  ruins:[['Forgotten','Statue','Echo','Scribe’s','Lantern'],['Stairs','Garden','Hall','Archive']],
  sunken:[['Drowned','Coral','Kelp','Pearl','Barnacle'],['Docks','Caverns','Chandelier','Bay']],
  clock:[['Gearworks','Pendulum','Cog','Spring','Piston'],['Gallery','Pit','Cathedral','Valley']],
  candy:[['Gumdrop','Lollipop','Taffy','Sugar','Peppermint'],['Grotto','Falls','Tunnels','Palace']],
  jungle:[['Vine','Fern','Orchid','Monkey','Canopy'],['Tangle','Hollow','Bridge','Temple']],
  dragon:[['Ember','Scale','Wyrm','Smoke','Talon'],['Lair','Vaults','Wallow','Gorge']],
  desert:[['Dune','Mirage','Scarab','Sandstone','Oasis'],['Crypt','Tunnels','Tomb','Spring']],
  cathedral:[['Prism','Singing','Rainbow','Shardlight','Halo'],['Nave','Spires','Chapel','Hall']],
  cloud:[['Drifting','Feather','Thunder','Sunbeam','Misty'],['Isles','Hollows','Steps','Gardens']],
  rift:[['Comet','Orbit','Nebula','Pulsar','Galaxy'],['Quarry','Mines','Seam','Gutters']],
  neon:[['Circuit','Pixel','Laser','Data','Voltage'],['Maze','Grid','Core','Highway']],
  void:[['Quiet','Echo','Null','Shadow','Starless'],['Dark','Narrows','Lattice','Edge']],
};
const ORDER = ['ice','fungal','ruins','sunken','clock','candy','jungle','dragon','desert','cathedral','cloud','rift','neon','void'];
const DEPTHS = [];
OLD.forEach(([n,at,b]) => DEPTHS.push({n, at, b:BI(b)}));
const NLAYERS = 300, RATIO = Math.pow(1e300/2e17, 1/(NLAYERS-12));
ORDER.forEach((bid, bi) => { const P = NAMES[bid], count = bid == 'void' ? 27 : 20; for (let k = 0; k < count; k++) { const nm = P[0][k%5]+' '+P[1][Math.floor(k/5)%4]+(k >= 20 ? ' '+['II','III','IV','V','VI','VII','VIII'][k-20] : '');
  const i = DEPTHS.length; DEPTHS.push({n:nm, at: Math.min(9e299, 2e17*Math.pow(RATIO, i-11)), b:BI(bid)}); } });
DEPTHS.push({n:'The Armageddon Core', at:9.5e299, b:BI('armageddon')});
const LAST = DEPTHS.length - 1; // 299 → The Armageddon Core
// layer twists: every layer rolls one, so two layers of the same biome still play differently
const TRAITS = [
  {k:'vein', n:'Rich Vein', d:'Taps dig ×1.5'}, {k:'gemmy', n:'Glittering', d:'Gems show up twice as often'}, {k:'echo', n:'Echo Cave', d:'Hitting the crack gives ×5'},
  {k:'busy', n:'Busy Layer', d:'Special events happen twice as often'}, {k:'trove', n:'Treasure Trove', d:'The hidden chest is worth ×3'}, {k:'calm', n:'Calm Layer', d:'No hazards here'},
  {k:'fever', n:'Gold Fever', d:'Golden carts roll by more often'}, {k:'crew', n:'Hard-working Crew', d:'Miners dig +25% here'}];
const hashL = (a, b) => { let h = (a*374761393 + b*668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const traitOf = i => i == LAST ? null : TRAITS[Math.floor(hashL(i, 99)*TRAITS.length)];
// how each biome's special event works (shown in the guide's tips)
const MECH_TIP = {worms:'Friendly worms pop out of the dirt — tap them for bonus ore!', boulders:'Boulders fall from the ceiling. Smash them before they land!',
  chime:'The crystals light up one at a time. Tap the glowing one — keep the chime going for bigger bonuses.', pulse:'The lava pulses. Tap the rock while it glows bright for ×3 digs!',
  vents:'Steam vents fill up. Tap one when it’s full and glowing for an ore blast.', meteors:'Shooting stars streak by — tap them for ore and gems!',
  slide:'Ore chunks slide across the ice. Grab them before they’re gone!', bounce:'Tap a bouncy mushroom: your next 10 digs count double!',
  glyphs:'Tap the three glyph stones in the order shown at the top to open a secret vault.', bubbles:'Bubbles carry ore up from the deep — pop them!',
  gears:'Tap the big gear when its marker reaches the top for a perfect hit.', gumdrops:'Gumdrops bounce around — tap them for sweet bonuses.',
  vines:'Vines swing down with jungle fruit. Grab the fruit!', dragon:'A dragon sleeps on its gold. Tap the gold — but slowly, or it wakes up!',
  sandworm:'A sandworm burrows past. Tap its head for buried treasure.', notes:'Music notes float by. Tap four in a row for a choir bonus!',
  islands:'Little ore islands drift in the sky. Tap them to bring them in.', portals:'Time portals open for a moment — tap one to warp a minute of digging!',
  circuit:'Circuit nodes light up fast. Tap lit nodes to build a power chain.', dark:'It’s pitch dark. Move your finger or mouse to shine your lamp and find glimmers.',
  final:'This is it — the Armageddon Core. Tap it to calm it, and tap the meteors before they land!'};
// ---------------- the story: Dot the Mole, foreman of the Wilderland Mines ----------------
const STORY = {
  intro:['Hi there! I’m Dot, the foreman mole of the Wilderland Mines. ⛑️', 'Deep, deep down — 300 layers down — something is rumbling. We call it the Armageddon Core.', 'Tap the rock to dig. When the bar at the top fills, we break through to the next layer. Let’s go!'],
  stone:['Stone Halls! The old miners carved these with tiny spoons. Probably.', MECH_TIP.boulders], crystal:['Ooh, crystals! They hum when the Core rumbles. Listen…', MECH_TIP.chime],
  magma:['Toasty! Keep your boots on the safe rocks.', MECH_TIP.pulse], core:['Steam pipes! Someone built these a long time ago… I wonder who?', MECH_TIP.vents],
  cosmic:['Stars… underground? The deeper we go, the stranger it gets.', MECH_TIP.meteors], ice:['Brr! The Frozen Depths. My whiskers are icicles!', MECH_TIP.slide],
  fungal:['The Fungal Forest glows in the dark. Don’t eat anything!', MECH_TIP.bounce], ruins:['Ancient Ruins! These carvings show a mole… wearing my hat?!', MECH_TIP.glyphs],
  sunken:['A whole city under the sea — under the ground. Hold your breath!', MECH_TIP.bubbles], clock:['Tick, tock. Somebody built a giant clock down here to keep the Core asleep.', MECH_TIP.gears],
  candy:['Candy Caverns! Okay, maybe ONE gumdrop.', MECH_TIP.gumdrops], jungle:['A jungle with no sun? The crystals overhead are its sunshine.', MECH_TIP.vines],
  dragon:['Shhh… dragon country. They guard the old miners’ gold.', MECH_TIP.dragon], desert:['A buried desert! Sand everywhere. In my ears. In my hat.', MECH_TIP.sandworm],
  cathedral:['The Crystal Cathedral sings to calm the Core. It’s singing louder now…', MECH_TIP.notes], cloud:['Clouds?! There’s a whole sky inside the planet!', MECH_TIP.islands],
  rift:['The Cosmic Rift — time gets wiggly here.', MECH_TIP.portals], neon:['Neon Circuit. The old machine that kept the Core cool. Let’s power it up!', MECH_TIP.circuit],
  void:['The Void. Stay close to the lamp. We’re almost there.', MECH_TIP.dark], armageddon:['THE ARMAGEDDON CORE. This is it, team!', MECH_TIP.final],
  m50:['Layer 50! Halfway to… well, a sixth of the way. Great digging!'], m100:['Layer 100! The old map ended here. From now on, we’re the explorers.'],
  m150:['Layer 150. I can hear the Core now — it sounds like a giant snore.'], m200:['Layer 200! Only 100 to go. Grab a snack.'], m250:['Layer 250. The rock is warm. Very warm. Be brave!'],
  calm:['You did it! The Armageddon Core is calm. The whole Wilderland can sleep easy.', 'Thank you, miner. Keep digging as long as you like — there’s always more treasure!'],
};

// Upgrades go (nearly) forever: costs keep climbing, so there's always something to save for.
const FORE_MAX = 100, GEM_MAX = 20;   // speed bottoms out at Lv100 and Gem Sense perks at Lv20 — later levels add +2% / +5% ore each
const foreInt = L => L <= 0 ? Infinity : 6 * Math.pow(0.1/6, (Math.min(L,FORE_MAX)-1)/(FORE_MAX-1));  // 6 s at Lv1 → 0.1 s at Lv100
const GEM = [ // what each Gem Sense level adds (shown in the upgrade card)
  '', 'Gems show up 3.5% sooner and glow wider', 'Gems last 0.4 s longer', 'Rare gems can appear (Ruby ×3)', 'Gems show up sooner · wider glow', 'Hidden treasure rooms sparkle on the map and mini-map',
  'Arrow hints point to rare gems', 'Emerald gems can appear (×6)', 'Hazards warn you 3 s earlier and show on the mini-map', 'Gems last longer', 'Diamond gems can appear (×12)',
  'Rare gems more often', 'Sometimes two gems at once', 'Treasure rooms worth +25%', 'Gems last longer · wider glow', 'Treasure rooms worth +50%',
  'Rare gems even more often', 'Hazards are disarmed for double ore', 'Starlight gems can appear (×25)', 'Treasure rooms worth +100%', 'GEM STORM: a burst of 6 gems every 3 minutes'];
const UPS = [
  {id:'pick',  n:'Sharper Pick',  d:'Taps dig more',                    max:Infinity, cost:l=>25*Math.pow(1.55,l)},
  {id:'cart',  n:'Mine Carts',    d:'+25% ore from every miner',        max:Infinity, cost:l=>150*Math.pow(1.7,l)},
  {id:'drill', n:'Deep Charges',  d:'+10% of ALL ore, stacks forever',  max:Infinity, cost:l=>5000*Math.pow(1.45,l)},
  {id:'luck',  n:'Lucky Strike',  d:'+2% chance a tap digs big (up to 50%); past level 25 lucky digs get +1× bigger per level', max:Infinity, cost:l=>1000*Math.pow(2,l)},
  {id:'hire',  n:'Better Hires',  d:'New miners start 1 level up (past the top miner level: +15% ore per level)', max:Infinity, cost:l=>4000*Math.pow(11,Math.min(l,20))*Math.pow(3,Math.max(0,l-20))},
  {id:'night', n:'Night Shift',   d:'+2 h of digging while away',       max:999999,  cost:l=>600*Math.pow(2.1,l)},
  {id:'gem',   n:'Gem Sense',     d:'', max:Infinity, cost:l=>2500*Math.pow(3.2,l)},
  {id:'auto',  n:'Foreman',       d:'', max:Infinity, cost:l=>15000*Math.pow(1.72,l)},
  // Foreman perks — need at least Foreman Lv 1. One-time perks can be switched on/off after you buy them.
  {id:'fsell', n:'🧹 Foreman: Clean Sweep', d:'Auto-sells any miner BELOW the level you hire at (keeps your grid free for good miners)', max:1, cost:()=>200000, fo:1, tog:1},
  {id:'fhire', n:'📋 Foreman: Recruiter',   d:'Auto-hires miners into empty slots whenever you can afford them', max:1, cost:()=>500000, fo:1, tog:1},
  {id:'ftidy', n:'🗂 Foreman: Tidy Up',     d:'Keeps your miners sorted — best ones first, empty slots at the end', max:1, cost:()=>300000, fo:1, tog:1},
  {id:'fgem',  n:'💎 Foreman: Gem Scout',   d:'Grabs gems for you if you don’t tap them within 2 seconds', max:1, cost:()=>2e6, fo:1, tog:1},
  {id:'fcrew', n:'👷 Foreman: Merge Crew',  d:'+1 extra merge every time the Foreman merges', max:Infinity, cost:l=>1e6*Math.pow(1.8,l), fo:1},
  {id:'fdig',  n:'⛏ Foreman: Rock Breaker', d:'Digs the rock for you: +1 auto-tap per second per level (half a normal tap)', max:Infinity, cost:l=>50000*Math.pow(1.6,l), fo:1},
  // Breakthrough upgrades — they all kick in when you break through to a new layer
  {id:'bbonus',n:'💥 Breakthrough Bonus', d:'Each breakthrough pays 20 seconds of ore per level, right away', max:Infinity, cost:l=>8000*Math.pow(1.7,l)},
  {id:'bexp',  n:'🚀 Express Shaft',     d:'Breakthroughs need less digging: lifetime ore counts +10% more per level toward the next layer', max:Infinity, cost:l=>25000*Math.pow(1.9,l)},
  {id:'brush', n:'⚡ Breakthrough Rush',  d:'Each breakthrough starts a GOLD RUSH (×3 ore) for 3 s per level (up to 60 s)', max:20, cost:l=>40000*Math.pow(2,l)},
  {id:'bgem',  n:'💎 Lucky Seam',        d:'+1 gem per level every time you break through', max:Infinity, cost:l=>60000*Math.pow(2.1,l)},
  {id:'bdepth',n:'🏔 Depth Mastery',     d:'Every layer you\'ve reached gives +1% ore per level', max:Infinity, cost:l=>100000*Math.pow(2.3,l)},
  {id:'fsell2',n:'💰 Foreman: Better Deals', d:'Clean Sweep and selling pay +50% more per level', max:Infinity, cost:l=>400000*Math.pow(2.2,l), fo:1},
];
// ---------------- GEM TREE: permanent Mines upgrades bought with gems — never reset by Rebirth ----------------
// Gems: 1 per gem you grab (rare ones give more), 3 per treasure room, 1 per math geode, 5 for a Cave Golem, 100 for the Armageddon Core.
const GT = [
  {k:'slots',  e:'🧱', n:'Bigger Mine',        d:'+4 miner slots',                          max:6,  cost:l=>20*Math.pow(2,l),     fx:l=>(12+4*l)+' slots'},
  {k:'ore',    e:'⚙️', n:'Gem-Powered Drills', d:'+25% ore from everything',                max:Infinity, cost:l=>10*Math.pow(1.45,l),  fx:l=>'×'+(1+.25*l).toFixed(2)+' ore'},
  {k:'vet',    e:'🎖️', n:'Veteran Crew',       d:'New miners are hired 1 level higher',     max:Infinity, cost:l=>30*Math.pow(1.7,l),   fx:l=>'+'+l+' hire levels'},
  {k:'market', e:'🎟', n:'Gem Market',          d:'+10% tickets when you cash out',          max:Infinity, cost:l=>15*Math.pow(1.55,l),  fx:l=>'×'+(1+.1*l).toFixed(1)+' Mines tickets'},
  {k:'magnet', e:'🧲', n:'Gem Magnet',          d:'+10% chance to get double gems',          max:10, cost:l=>12*Math.pow(1.6,l),   fx:l=>(10*l)+'% double gems'},
  {k:'owl',    e:'🦉', n:'Night Owls',          d:'Away digging at 75% speed instead of 50%', max:1,  cost:()=>60,                 fx:l=>l?'75% while away':'50% while away'},
  {k:'boss',   e:'🪨', n:'Golem Tamer',         d:'Bosses drop +50% ore',                    max:Infinity,  cost:l=>25*Math.pow(1.8,l),   fx:l=>'×'+(1+.5*l).toFixed(1)+' boss ore'},
];
// Bulk buy: shares the ×1 / ×10 / ×100 / Max setting with the rest of the arcade
const getQ = () => { try { const v = JSON.parse(localStorage.getItem('wl-prize-qty')); return v === 'max' ? 'max' : (+v || 1); } catch(e) { return 1; } };
const setQ = v => { try { localStorage.setItem('wl-prize-qty', JSON.stringify(v)); } catch(e){} };
const qN = cap => { const q = getQ(); return q === 'max' ? cap : Math.min(cap, q); };
// how many levels of an upgrade you can afford right now (and their total cost)
const plan = (costFn, L, max, bank) => { let n = 0, tot = 0; const want = qN(5000); while (n < want && L+n < max) { const c = Math.min(1e300, Math.ceil(costFn(L+n))); if (tot + c > bank) break; tot += c; n++; } return {n, tot}; };
const fmt = n => { n = Math.max(0, n); if (!isFinite(n)) return '∞'; if (n < 10 && n % 1) return n.toFixed(1); if (n < 1000) return String(Math.floor(n));
  const u = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','UDc','DDc','TDc']; if (n >= 1e45) return n.toExponential(2).replace('e+','e');
  let i = -1; while (n >= 1000 && i < u.length-1) { n /= 1000; i++; } return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + u[i]; };
const sec = s => s >= 1 ? s.toFixed(s >= 10 ? 0 : 1)+' s' : s.toFixed(2)+' s';
const hash = (a, b) => { let h = (a*374761393 + b*668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

A.register('idle', { mount(host, api){
  const MAXL = maxLevel(A.rebirths); ensureLV(MAXL);
  const learn = A.learnOn();
  const fresh = () => ({v:1, ore:0, life:0, grid:[1,0,0,0,0,0,0,0,0,0,0,0], hires:1, up:{}, last:Date.now(), tix:{d:'',n:0}, gems:0, geodes:0, best:1});
  let S = (api.stored && api.stored.v==1) ? JSON.parse(JSON.stringify(api.stored)) : fresh();
  // miners above today's level cap (from older versions) keep their level and still get drawn
  if (Array.isArray(S.grid)) ensureLV(Math.max(MAXL, ...S.grid.map(v => v|0)));
  S.up = S.up || {}; S.tix = S.tix || {d:'',n:0}; S.chests = S.chests || {}; S.gtree = S.gtree || {}; if (!Array.isArray(S.grid) || !S.grid.length) S.grid = fresh().grid;
  if (S.gemBank == null) S.gemBank = (S.gems||0) + (S.geodes||0);   // gems you already found count toward the Gem Tree
  const GL2 = k => S.gtree[k] || 0, SLOTS = () => 12 + 4*GL2('slots');
  while (S.grid.length < SLOTS()) S.grid.push(0);
  const addGems = (n, x, y) => { if (Math.random() < .1*GL2('magnet') + (A.petGems||0)) n *= 2; S.gemBank = (S.gemBank||0) + n; if (x != null) float(x, y-40, '+'+n+' 💎', '#bff0ff'); };
  // repair saves that overflowed to Infinity / NaN before this fix
  { const F = v => (v = Number(v), v !== v) ? 0 : v > 1e300 ? 1e300 : v < 0 ? 0 : v; S.ore = F(S.ore); S.life = F(S.life); S.gemBank = S.gemBank == null ? S.gemBank : F(S.gemBank); }
  // one-time fix: the Infinity repair set lifetime ore to the maximum, which jumped players to the last layer
  if (!S.fixLife) { if (S.life >= 1e299) S.life = 0; S.fixLife = 1; }
  const U = k => S.up[k] || 0; let codeMsg = '';
  const foOn = k => U(k) > 0 && U('auto') > 0 && !(S.fo && S.fo[k] === false);

  const W = 480; let H = 610;
  const wrap = el('div',{width:W+'px',fontFamily:A.font,userSelect:'none',background:'#1b130c',borderRadius:'12px',overflow:'hidden',position:'relative'}); host.appendChild(wrap);
  let {c,g,w,h} = A.canvas(wrap,W,H); c.style.borderRadius = '0'; c.style.touchAction = 'none';
  const bar = el('div',{display:'grid',gridTemplateColumns:'1.2fr .95fr 1.2fr 54px',gap:'8px',padding:'8px 10px',background:'#2a1d12'}); wrap.appendChild(bar);
  const mkb = (fn,bg,fg) => { const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',lineHeight:'1.15',border:'none',borderRadius:'14px',padding:'9px 6px',cursor:'pointer',background:bg,color:fg}); x.onclick = e => { e.stopPropagation(); fn(); x.blur(); }; bar.appendChild(x); return x; };
  const bHire = mkb(()=>{ if (sel >= 0 && S.grid[sel]) sellMiner(sel); else hire(); }, C.lime, C.forest), bShop = mkb(()=>openShop(), 'rgba(255,255,255,.14)', '#fff'), bCash = mkb(()=>cashOut(), C.gold, '#2a1d12');
  // bulk buy right on the bar: tap to switch ×1 → ×10 → ×100 → Max (same setting as every shop in the arcade)
  const bQty = mkb(()=>{ const o = [1,10,100,'max'], q = getQ(); setQ(o[(o.indexOf(q)+1) % o.length]); A.sfx('blip'); rerenderAll(); }, 'rgba(255,255,255,.14)', '#D5F367'); bQty.title = 'Buy amount for hiring and upgrades';

  // ---------- economy ----------
  const depthIdx = () => { const life = S.life * (1 + .1*((S.up||{}).bexp||0)); let d = 0; for (let i=0;i<DEPTHS.length;i++) if (life >= DEPTHS[i].at) d = i; return d; };   // Express Shaft makes lifetime ore count for more
  const extraStart = () => Math.max(0, 1 + U('hire') + A.U('start') + GL2('vet') - (MAXL-1));
  const mult = () => (1 + .01*U('bdepth')*depthIdx()) * (1 + .05*Math.max(0, U('gem')-GEM_MAX)) * (1 + .02*Math.max(0, U('auto')-FORE_MAX)) * (1 + .25*GL2('ore')) * (1 + .25*U('cart')) * (1 + .2*depthIdx()) * (1 + .1*U('drill')) * (1 + .15*extraStart()) * (traitOf(depthIdx()) && traitOf(depthIdx()).k == 'crew' ? 1.25 : 1);
  const minerCount = () => S.grid.reduce((a,L)=>a+(L?1:0),0);
  let trouble = 0;   // a hazard went off: miners dig at half speed for a few seconds
  const rate = () => S.grid.reduce((a,L)=>a+lvRate(L),0) * mult() * (trouble > 0 ? .5 : 1);
  // A tap always digs at least 10% of what the next miner costs, so nobody gets stuck with no miners and a huge hire price.
  const tapAmt = () => Math.max(.1*hireCost(), (learn ? 1/3 : 1) * ((1 + 2*U('pick')) + rate()*.01*(1+.1*U('pick'))));
  const hireCost = () => Math.min(BIG, Math.ceil(8*Math.pow(1.09, S.hires) * Math.pow(2.5, Math.min(U('hire'), 60)) * Math.pow(.85, A.U('cheap'))));
  const hireLv = () => Math.min(MAXL-1, 1 + U('hire') + A.U('start') + GL2('vet'));
  let rushT = 0, golem = null, golemT = 110 + Math.random()*60, core = null;
  // rewards from the breakthrough upgrades (n = how many layers you went down at once)
  const breakBonus = n => { const parts2 = [];
    if (U('bbonus')) { const ore = Math.max(10, rate()*20*U('bbonus')*n); give(ore); parts2.push('+'+fmt(ore)+' ore'); }
    if (U('brush')) { rushT = Math.max(rushT, Math.min(60, 3*U('brush'))); parts2.push('GOLD RUSH '+Math.min(60, 3*U('brush'))+' s'); }
    if (U('bgem')) { addGems(U('bgem')*n); parts2.push('+'+(U('bgem')*n)+' 💎'); }
    if (parts2.length) setTimeout(() => say('BREAKTHROUGH BONUS!', parts2.join(' · '), C.gold), 1200); };
  const give = n => { n = fin(n); if (rushT > 0) n *= 3; S.ore = fin(S.ore + n); S.life = fin(S.life + n); };
  const tixFor = ore => Math.floor(Math.sqrt(fin(ore))/3);
  const score = () => Math.min(99999999, Math.floor(Math.sqrt(S.life)));

  // ---------- effects ----------
  let parts = [], floats = [], shake = 0, sel = -1, drag = null, msg = null, gems = [], gemT = 6 + Math.random()*8, autoAcc = 0, foT = 0, digAcc = 0, saveT = 0, t = 0, busy = false, lastDepth = depthIdx(), sellArm = 0;
  let hazard = null, hazardT = 70 + Math.random()*50, stormT = 180;
  const say = (txt, sub, col) => { msg = {txt, sub:sub||'', t:2.4, col:col||C.lime}; };
  const float = (x,y,txt,col) => { if (floats.length < 30) floats.push({x,y,txt,col:col||'#fff',t:1}); };
  const burst = (x,y,col,n) => { if (lowFx()) n = Math.min(n, 3); if (parts.length > 140) return; for (let i=0;i<n;i++) { const a = Math.random()*TAU, s = 60+Math.random()*180; parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,t:.6+Math.random()*.5,col,r:2+Math.random()*3}); } };

  // ---------- layout ----------
  const HUD = 62, VIEW = {x:0, y:HUD, w:W, h:270}, GX = 14, GY = HUD+VIEW.h+12, GAP = 8; let CW = 108, CH = 70, COLS = 4;
  // More slots → more columns and a taller cabinet (the canvas grows; nothing gets squashed).
  const relayout = () => { const n = S.grid.length; COLS = n <= 16 ? 4 : 6; CW = (W - 2*GX - GAP*(COLS-1)) / COLS; CH = COLS == 4 ? 70 : 62;
    const nh = GY + Math.ceil(n/COLS)*(CH+GAP) + 18; if (nh !== H) { H = nh; h = nh; const dpr = window.devicePixelRatio||1; c.height = nh*dpr; c.style.height = nh+'px'; g.setTransform(dpr,0,0,dpr,0,0); } };
  relayout();
  const cell = i => ({x:GX + (i%COLS)*(CW+GAP), y:GY + Math.floor(i/COLS)*(CH+GAP)});
  const cellAt = (x,y) => { for (let i=0;i<S.grid.length;i++) { const p = cell(i); if (x>=p.x && x<=p.x+CW && y>=p.y && y<=p.y+CH) return i; } return -1; };
  const lowFx = () => !!(A.lowFx || S.calm);

  // ---------- the dig scene: one layer at a time. The bar fills, you break through, a new layer appears. ----------
  const ROCK = {x: 322, y: VIEW.y + 122, r: 56};       // the dig face
  const LEDGE = VIEW.y + VIEW.h - 34;                  // where the miners stand
  const trait = () => traitOf(depthIdx());
  const hasT = k => { const tr = trait(); return !!tr && tr.k === k; };
  // scenery for one layer, cached (a few layers at most): same biome → different layout and tint per layer
  const sceneCache = new Map();
  const sceneBg = i => { if (sceneCache.has(i)) return sceneCache.get(i);
    const D = DEPTHS[i], B = D.b, o = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio||1); o.width = W*dpr; o.height = VIEW.h*dpr; const x = o.getContext('2d'); x.scale(dpr, dpr);
    const H2 = VIEW.h, R = k => hashL(i, k), gr = x.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, B.a); gr.addColorStop(1, B.b); x.fillStyle = gr; x.fillRect(0, 0, W, H2);
    // far wall texture + strata
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 3; for (let k=0;k<4;k++) { const yy = 30 + k*55 + R(k)*14; x.beginPath(); for (let xx=0; xx<=W; xx+=20) x.lineTo(xx, yy + Math.sin(xx*.03 + k + i)*6); x.stroke(); }
    for (let k=0;k<90;k++) { x.fillStyle = k%11==0 ? B.ore : (k%2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'); x.beginPath(); x.arc(R(100+k)*W, R(300+k)*H2, k%11==0 ? 2.5 : 1+R(500+k)*2, 0, TAU); x.fill(); }
    const deco = (n, f) => { for (let k=0;k<n;k++) f(R(700+k)*W, R(800+k)*H2, R(900+k), k); };
    x.save();
    switch (B.id) {
      case 'soil': x.strokeStyle = '#3a2614'; x.lineWidth = 3; deco(8, (px,py,r) => { x.beginPath(); x.moveTo(px, 0); x.quadraticCurveTo(px+20*(r-.5), 30, px+10*(r-.5), 40+r*50); x.stroke(); }); x.fillStyle = '#8a6a44'; deco(10, (px,py,r) => { x.beginPath(); x.ellipse(px, H2-40+r*10, 5+r*6, 3+r*3, 0, 0, TAU); x.fill(); }); break;
      case 'stone': x.fillStyle = 'rgba(30,30,34,.55)'; deco(5, (px,py,r) => { x.beginPath(); x.moveTo(px-14-r*10, H2); x.lineTo(px-6, 30+r*60); x.lineTo(px+8, 20+r*50); x.lineTo(px+16+r*10, H2); x.fill(); }); break;
      case 'crystal': case 'cathedral': deco(7, (px,py,r,k) => { x.fillStyle = k%2 ? B.ore : (B.id=='cathedral' ? '#b48cff' : '#64CDF5'); x.globalAlpha = .55; const hh = 30 + r*70; x.beginPath(); x.moveTo(px, H2-34-hh); x.lineTo(px+12, H2-34); x.lineTo(px-12, H2-34); x.fill(); x.globalAlpha = 1; });
        if (B.id=='cathedral') { x.strokeStyle = 'rgba(255,220,255,.35)'; x.lineWidth = 4; x.beginPath(); x.arc(W*.25, 110, 50, Math.PI, 0); x.lineTo(W*.25+50, 200); x.moveTo(W*.25-50, 110); x.lineTo(W*.25-50, 200); x.stroke(); ['#ff9fe8','#9fd8ff','#ffe14f'].forEach((cc, q) => { x.fillStyle = cc; x.globalAlpha = .35; x.fillRect(W*.25-44+q*30, 112, 26, 80); x.globalAlpha = 1; }); } break;
      case 'magma': case 'armageddon': x.strokeStyle = B.id=='magma' ? 'rgba(255,122,60,.6)' : 'rgba(255,58,26,.7)'; x.lineWidth = 2; deco(9, (px,py,r) => { x.beginPath(); x.moveTo(px, py); x.lineTo(px+20*(r-.5), py+18); x.lineTo(px+30*(r-.3), py+30); x.stroke(); }); break;
      case 'core': x.strokeStyle = '#6a6d72'; x.lineWidth = 9; deco(3, (px,py,r) => { x.beginPath(); x.moveTo(px, 0); x.lineTo(px, 50+r*40); x.lineTo(px+60*(r-.5), 50+r*40); x.stroke(); }); break;
      case 'cosmic': case 'rift': deco(40, (px,py,r) => { x.fillStyle = 'rgba(255,255,255,'+(.3+r*.6)+')'; x.fillRect(px, py*.8, 1.5, 1.5); }); x.fillStyle = B.id=='rift' ? 'rgba(180,140,255,.35)' : 'rgba(100,140,255,.4)'; x.beginPath(); x.arc(W*(.15+R(1)*.2), 60, 26+R(2)*14, 0, TAU); x.fill();
        if (B.id=='rift') { x.strokeStyle = 'rgba(255,95,210,.3)'; x.lineWidth = 6; x.beginPath(); for (let a=0;a<9;a+=.2) x.lineTo(W*.2+Math.cos(a)*a*8, 120+Math.sin(a)*a*6); x.stroke(); } break;
      case 'ice': x.fillStyle = 'rgba(230,248,255,.75)'; deco(14, (px,py,r) => { x.beginPath(); x.moveTo(px-6, 0); x.lineTo(px+6, 0); x.lineTo(px, 14+r*36); x.fill(); }); x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(W*.3, H2-30, 120, 22, 0, 0, TAU); x.fill(); break;
      case 'fungal': deco(5, (px,py,r,k) => { const hh = 40+r*60, cw = 20+r*22; x.fillStyle = '#e8e0ff'; x.fillRect(px-5, H2-34-hh, 10, hh); x.fillStyle = ['#b48cff','#9fffb0','#ff9fe8'][k%3]; x.globalAlpha = .7; x.beginPath(); x.ellipse(px, H2-34-hh, cw, cw*.55, 0, Math.PI, 0); x.fill(); x.globalAlpha = 1; }); break;
      case 'ruins': x.fillStyle = 'rgba(255,240,200,.22)'; deco(4, (px,py,r) => { const hh = 70+r*60; x.fillRect(px-12, H2-34-hh, 24, hh); x.fillRect(px-18, H2-38-hh, 36, 8); }); x.strokeStyle = 'rgba(255,240,200,.25)'; x.lineWidth = 8; x.beginPath(); x.arc(W*.62, H2-34, 70, Math.PI, 0); x.stroke(); break;
      case 'sunken': x.strokeStyle = 'rgba(60,160,90,.6)'; x.lineWidth = 4; deco(9, (px,py,r) => { x.beginPath(); x.moveTo(px, H2-30); for (let k=0;k<5;k++) x.lineTo(px + Math.sin(k+r*6)*8, H2-30-k*14-r*10); x.stroke(); }); x.fillStyle = 'rgba(80,50,30,.5)'; x.fillRect(W*.15, 40, 6, 140); x.beginPath(); x.moveTo(W*.15+6, 50); x.lineTo(W*.15+60, 90); x.lineTo(W*.15+6, 110); x.fill(); break;
      case 'clock': x.strokeStyle = 'rgba(255,210,58,.3)'; x.lineWidth = 6; deco(4, (px,py,r) => { const rr = 20+r*30; x.beginPath(); x.arc(px, py*.8, rr, 0, TAU); x.stroke(); for (let q=0;q<10;q++) { const a = q*TAU/10; x.beginPath(); x.moveTo(px+Math.cos(a)*rr, py*.8+Math.sin(a)*rr); x.lineTo(px+Math.cos(a)*(rr+8), py*.8+Math.sin(a)*(rr+8)); x.stroke(); } }); break;
      case 'candy': deco(6, (px,py,r,k) => { x.strokeStyle = '#fff'; x.lineWidth = 7; x.beginPath(); x.moveTo(px, H2-34); x.lineTo(px, H2-80-r*50); x.arc(px+10, H2-80-r*50, 10, Math.PI, 0); x.stroke(); x.strokeStyle = '#FF4539'; x.setLineDash([6,6]); x.stroke(); x.setLineDash([]); }); x.fillStyle = '#ffd1f0'; deco(5, (px,py,r) => { x.beginPath(); x.arc(px, py*.5, 6+r*6, 0, TAU); x.fill(); }); break;
      case 'jungle': x.strokeStyle = '#2f8a3a'; x.lineWidth = 4; deco(8, (px,py,r) => { x.beginPath(); x.moveTo(px, 0); x.quadraticCurveTo(px+30*(r-.5), 60, px, 90+r*70); x.stroke(); }); x.fillStyle = '#3fae5a'; deco(14, (px,py,r) => { x.beginPath(); x.ellipse(px, 20+py*.5, 12, 5, r*3, 0, TAU); x.fill(); }); break;
      case 'dragon': x.fillStyle = 'rgba(249,191,1,.55)'; x.beginPath(); x.ellipse(W*.2, H2-34, 80, 26, 0, Math.PI, 0); x.fill(); x.fillStyle = 'rgba(240,230,210,.4)'; deco(5, (px,py,r) => { x.fillRect(px, H2-50-r*20, 22, 4); x.beginPath(); x.arc(px, H2-48-r*20, 4, 0, TAU); x.arc(px+22, H2-48-r*20, 4, 0, TAU); x.fill(); }); break;
      case 'desert': x.fillStyle = 'rgba(255,220,150,.45)'; for (let k=0;k<3;k++) { x.beginPath(); x.moveTo(0, H2-34); for (let xx=0; xx<=W; xx+=20) x.lineTo(xx, H2-60-k*18-Math.sin(xx*.012+k*2+i)*16); x.lineTo(W, H2-34); x.fill(); } x.fillStyle = '#3f8a3c'; deco(3, (px,py,r) => { x.fillRect(px, H2-90, 10, 56); x.fillRect(px-12, H2-74, 12, 6); x.fillRect(px-12, H2-86, 6, 14); }); break;
      case 'cloud': x.fillStyle = 'rgba(255,255,255,.55)'; deco(6, (px,py,r) => { [0,1,2].forEach(q => { x.beginPath(); x.arc(px+q*18, py*.7+(q==1?-8:0), 16+r*6, 0, TAU); x.fill(); }); }); break;
      case 'neon': x.strokeStyle = 'rgba(58,255,213,.18)'; x.lineWidth = 1; for (let xx=0; xx<W; xx+=24) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, H2); x.stroke(); } for (let yy=0; yy<H2; yy+=24) { x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); } x.strokeStyle = 'rgba(255,95,210,.4)'; x.lineWidth = 3; deco(6, (px,py,r) => { x.beginPath(); x.moveTo(px, py); x.lineTo(px+40, py); x.lineTo(px+40, py+30*(r-.5)); x.stroke(); }); break;
      case 'void': deco(20, (px,py,r) => { x.fillStyle = 'rgba(180,140,255,'+(.1+r*.3)+')'; x.fillRect(px, py, 2, 2); }); break;
    }
    // the ledge the miners stand on + timber supports
    x.restore(); x.fillStyle = 'rgba(10,6,3,.55)'; x.fillRect(0, H2-34, W, 34); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(0, H2-34, W, 3);
    x.fillStyle = B.id=='neon' ? '#3a3a50' : B.id=='cloud' ? '#cfe6ff' : '#6b4a2b'; [18, W-28].forEach(px => { x.fillRect(px, 0, 10, H2-34); x.fillRect(px-6, 0, 22, 8); });
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, W, 6);
    sceneCache.set(i, o); if (sceneCache.size > 6) sceneCache.delete(sceneCache.keys().next().value); return o; };

  // ---------- biome events: every biome has its own thing to tap ----------
  let objs = [], evT = 4, chimeN = 0, sporeN = 0, noise = 0, wakeT = 0, glyph = null, glyphT = 8, noteRun = 0, noteT = 0, chain = 0, lamp = {x: W/2, y: VIEW.y + VIEW.h/2};
  const reward = (mul, x, y, label, col) => { const n = Math.max(tapAmt()*mul*.5, rate()*mul) * (hasT('vein') ? 1.2 : 1); give(n); float(x, y-14, (label ? label+' ' : '')+'+'+fmt(n), col || DEPTHS[depthIdx()].b.ore); burst(x, y, col || DEPTHS[depthIdx()].b.ore, 12); A.tone(900+Math.random()*300, .06, 'triangle', .04); return n; };
  const rx = () => 40 + Math.random()*(W-120), ry = () => VIEW.y + 30 + Math.random()*(VIEW.h - 100);
  const M = {
    worms:   {every:5, max:3, spawn:()=>({x:rx(), y:LEDGE+4, t:0, life:3}), tap:o=>reward(8, o.x, o.y-20, 'WIGGLE!'), hit:o=>({x:o.x, y:o.y-14-Math.min(1,o.t*3)*16, r:18})},
    boulders:{every:4, max:4, spawn:()=>({x:rx(), y:VIEW.y-10, vy:20, r:14+Math.random()*8}), up:(o,dt)=>{ o.vy += 90*dt; o.y += o.vy*dt; if (o.y > LEDGE) { trouble = Math.max(trouble, 3); shake = .2; burst(o.x, LEDGE, '#9a9a9b', 10); A.tone(90,.1,'square',.05); return false; } return true; }, tap:o=>reward(6, o.x, o.y, 'SMASH!')},
    chime:   {every:1.6, max:1, spawn:()=>{ const k = Math.floor(Math.random()*4); return {k, x:70+k*60, y:VIEW.y+60+(k%2)*40, life:1.4}; }, tap:o=>{ chimeN = Math.min(8, chimeN+1); reward(3*chimeN, o.x, o.y, 'CHIME ×'+chimeN, '#9fd8ff'); A.tone(600+chimeN*120,.15,'sine',.05); }, miss:()=>{ chimeN = 0; }},
    pulse:   {every:999, max:0},
    vents:   {every:6, max:3, spawn:()=>({x:rx(), y:LEDGE-4, fill:0, life:14}), up:(o,dt)=>{ o.fill = Math.min(1.25, o.fill + dt/5); if (o.fill >= 1.25) { o.fill = 0; burst(o.x, o.y-20, '#fff', 6); } return true; }, tap:o=>{ if (o.fill >= .95) reward(12, o.x, o.y-30, 'STEAM BLAST!', '#D5F367'); else { float(o.x, o.y-30, 'NOT FULL YET', '#cfc6a8'); return 'keep'; } }, hit:o=>({x:o.x, y:o.y-18, r:22})},
    meteors: {every:4, max:3, spawn:()=>({x:W+20, y:VIEW.y+20+Math.random()*80, vx:-160-Math.random()*80, vy:40}), up:(o,dt)=>{ o.x += o.vx*dt; o.y += o.vy*dt; return o.x > -30; }, tap:o=>{ reward(6, o.x, o.y, 'STARDUST', '#fff'); addGems(1, o.x, o.y); }},
    slide:   {every:3.5, max:2, spawn:()=>({x:-20, y:LEDGE-6, vx:90+Math.random()*80}), up:(o,dt)=>{ o.x += o.vx*dt; return o.x < W+20; }, tap:o=>reward(8, o.x, o.y, 'GOT IT!', '#dff6ff')},
    bounce:  {every:7, max:2, spawn:()=>({x:rx(), y:LEDGE-6, life:10, ph:Math.random()*6}), tap:o=>{ sporeN = 10; float(o.x, o.y-40, 'SPORE BOOST · next 10 digs ×2', '#9fffb0'); burst(o.x, o.y-20, '#9fffb0', 20); A.tone(500,.2,'sine',.05); }, hit:o=>({x:o.x, y:o.y-22, r:22})},
    glyphs:  {every:999, max:0},
    bubbles: {every:1.8, max:6, spawn:()=>({x:rx(), y:LEDGE, vy:-30-Math.random()*30, r:10+Math.random()*8, ph:Math.random()*6}), up:(o,dt)=>{ o.y += o.vy*dt; o.ph += dt*3; return o.y > VIEW.y; }, tap:o=>reward(4, o.x, o.y, 'POP!', '#9fe8ff')},
    gears:   {every:999, max:0},
    gumdrops:{every:3, max:4, spawn:()=>({x:rx(), y:VIEW.y+40, vx:(Math.random()-.5)*160, vy:0, c:['#FF4539','#00B451','#F9BF01','#EA55AB','#64CDF5'][Math.floor(Math.random()*5)], life:9}), up:(o,dt)=>{ o.vy += 300*dt; o.x += o.vx*dt; o.y += o.vy*dt; if (o.y > LEDGE-8) { o.y = LEDGE-8; o.vy = -220; } if (o.x < 20 || o.x > W-20) o.vx = -o.vx; return true; }, tap:o=>{ reward(5, o.x, o.y, 'YUM!', o.c); if (Math.random() < .08) addGems(1, o.x, o.y); }},
    vines:   {every:5, max:2, spawn:()=>({x:rx(), y:VIEW.y, life:6, ph:Math.random()*6}), tap:o=>reward(10, o.x, o.y+70, 'JUNGLE FRUIT!', '#b6ff6a'), hit:o=>({x:o.x + Math.sin(t*2+o.ph)*20, y:VIEW.y+76, r:20})},
    dragon:  {every:999, max:0},
    sandworm:{every:7, max:1, spawn:()=>({x:-40, y:LEDGE+2, vx:70}), up:(o,dt)=>{ o.x += o.vx*dt; return o.x < W+60; }, tap:o=>reward(15, o.x, o.y-20, 'BURIED TREASURE!', '#ffe08a'), hit:o=>({x:o.x, y:o.y-14, r:22})},
    notes:   {every:1.4, max:5, spawn:()=>({x:W+10, y:VIEW.y+30+Math.random()*120, vx:-70-Math.random()*40, ph:Math.random()*6, n:['♪','♫','♩','♬'][Math.floor(Math.random()*4)]}), up:(o,dt)=>{ o.x += o.vx*dt; o.ph += dt*3; return o.x > -20; }, tap:o=>{ noteRun++; noteT = 3; A.tone([523,659,784,1046][(noteRun-1)%4], .2, 'sine', .05); if (noteRun >= 4) { noteRun = 0; reward(20, o.x, o.y, 'CHOIR CHORD!', '#ff9fe8'); } else float(o.x, o.y-10, noteRun+'/4', '#ff9fe8'); }},
    islands: {every:3.5, max:3, spawn:()=>({x:W+30, y:VIEW.y+40+Math.random()*100, vx:-30-Math.random()*25}), up:(o,dt)=>{ o.x += o.vx*dt; return o.x > -40; }, tap:o=>reward(7, o.x, o.y, 'ISLAND!', '#ffffff'), hit:o=>({x:o.x, y:o.y, r:26})},
    portals: {every:9, max:1, spawn:()=>({x:rx(), y:ry(), life:3.5}), tap:o=>{ const n = rate()*60; give(n); float(o.x, o.y-20, 'TIME WARP! +'+fmt(n), '#b48cff'); burst(o.x, o.y, '#b48cff', 30); A.sfx('win'); }, hit:o=>({x:o.x, y:o.y, r:26})},
    circuit: {every:.9, max:2, spawn:()=>({x:60+Math.floor(Math.random()*6)*60, y:VIEW.y+50+Math.floor(Math.random()*3)*50, life:1}), tap:o=>{ chain = Math.min(12, chain+1); reward(2+chain, o.x, o.y, 'CHAIN ×'+chain, '#3affd5'); }, miss:()=>{ chain = 0; }},
    dark:    {every:3, max:4, spawn:()=>({x:rx(), y:ry(), life:12}), tap:o=>{ reward(12, o.x, o.y, 'GLIMMER!', '#b48cff'); if (Math.random() < .4) addGems(1, o.x, o.y); }},
    final:   {every:999, max:0},
  };
  const mechOf = () => M[DEPTHS[depthIdx()].b.mech] || M.worms;
  const pulseOn = () => DEPTHS[depthIdx()].b.mech == 'pulse' && Math.sin(t*1.7) > .55;
  const gearHit = () => { const a = (t*1.6) % TAU; return a < .35 || a > TAU-.35; };
  const GEAR = {x: 90, y: VIEW.y + 110, r: 40};
  const GOLD = {x: 96, y: LEDGE - 14};
  const GSTONES = [0,1,2].map(k => ({x: 70 + k*70, y: LEDGE - 26}));
  const newGlyph = () => { const s = ['☀','☾','★']; for (let k=2;k>0;k--) { const j = Math.floor(Math.random()*(k+1)); [s[k], s[j]] = [s[j], s[k]]; } glyph = {order:s, step:0, stones:['☀','☾','★'].sort(()=>Math.random()-.5)}; };
  // the treasure chest hidden somewhere on every layer
  const chestPos = i => ({x: 40 + hashL(i, 41)*(W-150), y: VIEW.y + 30 + hashL(i, 43)*(VIEW.h-110)});
  // dialogue with Dot the Mole
  let dlg = null; const dlgQ = [];
  const story = (key, lines) => { S.story = S.story || {}; if (S.story[key] || !lines) return; S.story[key] = 1; lines.forEach(l => dlgQ.push(l)); if (!dlg) nextDlg(); };
  const nextDlg = () => { dlg = dlgQ.length ? {txt:dlgQ.shift(), shown:0} : null; };
  const replayStory = () => { const B = DEPTHS[depthIdx()].b; (STORY[B.id] || STORY.intro).concat(trait() ? ['This layer’s twist: '+trait().n+' — '+trait().d+'.'] : []).forEach(l => dlgQ.push(l)); if (!dlg) nextDlg(); };
  // layer-change animation
  let trans = null;

  // ---------- actions ----------
  const persist = () => { S.last = Date.now(); try { api.store && api.store(S); } catch(e){} };
  const hire = () => { if (busy) return; const want = qN(S.grid.length); let k = 0; while (k < want && S.grid.indexOf(0) >= 0 && S.ore >= hireCost()) { hireOne(true); k++; } if (k > 1) { say('HIRED '+k+' MINERS', 'Buy amount: '+(getQ()==='max'?'Max':'×'+getQ())+' · change it in Upgrades', C.lime); paintBar(); return; } if (k == 1) return; hireOne(); };
  const hireOne = quiet => { const cost = hireCost(), i = S.grid.indexOf(0);
    if (i<0) { say('NO ROOM','Merge two matching miners to free a spot', '#ffb3ab'); A.sfx('bad'); return; }
    if (S.ore < cost) { say('NEED '+fmt(cost)+' ORE','Tap the dig face to dig faster', '#ffb3ab'); A.sfx('bad'); return; }
    S.ore -= cost; S.hires++; S.grid[i] = hireLv(); const p = cell(i); burst(p.x+CW/2, p.y+CH/2, LV[S.grid[i]].c, 14); A.sfx('coin'); paintBar(); };
  const sellMiner = i => { const L = S.grid[i]; if (!L || busy) return;
    if (minerCount() == 1 && !(sellArm > 0)) { sellArm = 3; say('THAT’S YOUR LAST MINER!', 'Without miners you can’t cash out · tap Sell again to sell anyway', '#ffb3ab'); A.sfx('bad'); paintBar(); return; }
    sellArm = 0; const v = fin(sellVal(L)); S.grid[i] = 0; S.ore = fin(S.ore + v); const p = cell(i);
    float(p.x+CW/2, p.y+20, '+'+fmt(v)+' ORE', C.gold); burst(p.x+CW/2, p.y+CH/2, '#FF8A3C', 12); sel = -1; A.sfx('coin'); paintBar(); };
  let quietMerges = 0;
  const merge = (a, b, quiet) => { const L = S.grid[a]; if (L+1 >= LV.length) ensureLV(L+1); if (!L || S.grid[b]!==L || L>=MAXL || a===b) return false;
    S.grid[b] = L+1; S.grid[a] = 0; const p = cell(b);
    if (!quiet || (quietMerges++ % 6 == 0)) { burst(p.x+CW/2, p.y+CH/2, LV[L+1].c, quiet ? 6 : 26); if (!quiet) { shake = .15; A.sfx('point'); } else A.tone(700,.02,'square',.015); }
    if (L+1 > (S.best||1)) { S.best = L+1; say('NEW MINER: '+LV[L+1].n.toUpperCase(), fmt(lvRate(L+1)*mult())+' ore/s each', LV[L+1].c); stat(api,'minerLevel',L+1); }
    return true; };
  const moveOrSwap = (a, b) => { if (a===b || a<0 || b<0) return; if (merge(a,b)) { paintBar(); return; } const t0 = S.grid[b]; S.grid[b] = S.grid[a]; S.grid[a] = t0; A.sfx('flip'); };
  // Foreman: finds the lowest matching pair with one quick scan (no array building) — cheap enough for 10 merges a second.
  const autoMerge = quiet => { const first = new Array(MAXL+1).fill(-1); for (let i=0;i<S.grid.length;i++) { const L = S.grid[i]; if (!L || L>=MAXL) continue; if (first[L] >= 0) return merge(first[L], i, quiet); first[L] = i; } return false; };
  const comboMult = () => Math.min(3, 1 + combo*.05);   // tap combo tops out at ×3
  let combo = 0, comboT = 0, crack = {a:Math.random()*7, r:.6}, gcart = null, gcartT = 35 + Math.random()*30;
  const tapRock = (sx, sy) => { comboT = .7; combo = Math.min(40, combo+1); const cm = comboMult();
    const boss = core || golem;
    if (boss) { const d = tapAmt()*cm*(1 + .1*U('pick')); boss.hp -= d; boss.hit = .12; boss.idle = 0; shake = .1; burst(sx, sy, core ? '#ff3a1a' : '#c9ccd1', 5); A.tone(core ? 70+Math.random()*30 : 140+Math.random()*40,.05,'square',.04); float(sx, sy-16, '-'+fmt(d), '#ffb3ab');
      if (boss.hp <= 0) bossDown(); return; }
    const cx = ROCK.x + Math.cos(crack.a)*40*crack.r, cy = ROCK.y + Math.sin(crack.a)*34*crack.r, onCrack = Math.hypot(sx-cx, sy-cy) < 20, cr = hasT('echo') ? 5 : 3;
    if (onCrack) { crack = {a:Math.random()*7, r:.3+Math.random()*.6}; float(sx, sy-46, 'CRACK ×'+cr, '#fff'); A.tone(1100,.06,'square',.04); }
    const lucky = Math.random() < Math.min(.5, .02*U('luck')); let mul = (lucky ? 10 + Math.max(0, U('luck')-25) : 1)*cm*(onCrack?cr:1)*(hasT('vein')?1.5:1)*(pulseOn()?3:1); if (sporeN > 0) { mul *= 2; sporeN--; }
    const n = tapAmt()*mul; give(n); if (lucky) { float(sx, sy-30, 'LUCKY ×'+(10 + Math.max(0, U('luck')-25))+'!', C.gold); A.tone(1400,.08,'triangle',.05); }
    shake = .12; float(sx, sy-10, '+'+fmt(n), DEPTHS[depthIdx()].b.ore); burst(sx, sy, DEPTHS[depthIdx()].b.ore, 6); A.tone(180+Math.random()*60,.05,'square',.04); };
  const bossDown = () => {
    if (core) { const n = Math.max(1e6, rate()*3000 + tapAmt()*5000) * (1+.5*GL2('boss')); give(n); addGems(100); S.coreCleared = Date.now(); S.core300 = Date.now(); stat(api,'mineCore',1,'add'); A.sfx('win'); [0,300,600].forEach(d => setTimeout(()=>A.sfx('win'), d));
      rushT = 120; say('THE ARMAGEDDON CORE IS CALM!', '+'+fmt(n)+' ore · all 300 layers cleared · GOLD RUSH ×3 for 2 minutes', C.gold); core = null; shake = .6; for (let k=0;k<4;k++) burst(W/2 + (k-1.5)*80, VIEW.y+VIEW.h/2, ['#ff3a1a','#F9BF01','#fff','#ff9f3a'][k], 30); story('calm', STORY.calm); persist(); return; }
    const n = Math.max(500, rate()*150 + tapAmt()*250) * (1+.5*GL2('boss')); give(n); addGems(5); S.golems = (S.golems||0)+1; stat(api,'mineGolem',1,'add'); A.sfx('win');
    rushT = 30; say('CAVE GOLEM DEFEATED!', '+'+fmt(n)+' ore · +5 💎 · GOLD RUSH: all ore ×3 for 30 s', C.gold); golem = null; golemT = 140 + Math.random()*80; };
  // What a cash-out pays right now. The Mines ticket counter holds at most 5% of a Rebirth and refills over time
  // (so ore can't jump you straight to a Rebirth). Cashing out always sells ALL your ore and pays what the counter allows.
  const cashQuote = () => { const can = tixFor(S.ore), mk = 1+.1*GL2('market'), mul = (api.tixMul ? api.tixMul() : 1) * mk;
    const cap = api.tixCap ? Math.floor(api.tixCap() / mk) : Infinity, n = Math.max(0, Math.min(can, cap)), full = api.tixCap ? api.tixCap() : 0, max = api.tixMax ? api.tixMax() : 0;
    return {can, cap, n, capped: can > cap, got: Math.floor(n*mul), pct: max ? Math.round(100*Math.min(1, full*(api.tixMul ? api.tixMul() : 1)/max)) : 100}; };
  const cashOut = () => { if (busy) return; if (!minerCount()) { say('YOU NEED AT LEAST ONE MINER TO CASH OUT', 'Hire a miner first (or try the code MINERRESCUE in Upgrades)', '#ffb3ab'); A.sfx('bad'); return; }
    const q = cashQuote();
    if (q.can < 1) { say('NOT ENOUGH ORE','9 ore = 1 ticket · it grows from there', '#ffb3ab'); A.sfx('bad'); return; }
    if (q.n < 1) { const w = api.tixWait ? api.tixWait() : 60; say('TICKET COUNTER IS EMPTY', 'It refills in about '+w+' s · your ore is safe and keeps piling up', '#ffb3ab'); A.sfx('bad'); return; }
    let got = q.n; try { got = api.tix ? api.tix(Math.floor(q.n*(1+.1*GL2('market'))), score(), 'THE MINES') : 0; } catch(e) { got = 0; }
    const used = S.ore; S.ore = 0; const td = new Date().toISOString().slice(0,10); if (S.tix.d != td) S.tix = {d:td, n:0}; S.tix.n += q.n;
    say(got ? '+'+fmt(got)+' TICKETS' : 'NO TICKETS IN ADMIN MODE', 'Sold '+fmt(used)+' ore'+(q.capped ? ' · the Mines ticket counter pays up to 5% of a Rebirth at a time' : ''), C.gold); A.sfx(got?'win':'blip'); persist(); paintBar(); };
  // gems: Gem Sense makes them come sooner, last longer, glow wider and sometimes be rare
  const GL = () => Math.min(U('gem'), GEM_MAX);   // perks stop at Lv20; extra levels add ore in mult()
  const gemGap = () => (learn ? 9 : 22 + Math.random()*16) * Math.max(.3, 1 - .035*GL());
  const gemLife = () => 6 + .4*GL() + (GL()>=9 ? 2 : 0) + (GL()>=14 ? 2 : 0);
  const rollRare = () => { const L = GL(), boost = (L>=11 ? 1.5 : 1) * (L>=16 ? 1.5 : 1); const r = Math.random();
    if (L>=18 && r < .02*boost) return {k:'Starlight', m:25, c:'#ffffff'}; if (L>=10 && r < .05*boost) return {k:'Diamond', m:12, c:'#bff0ff'};
    if (L>=7 && r < .1*boost) return {k:'Emerald', m:6, c:'#2fe08a'}; if (L>=3 && r < .18*boost) return {k:'Ruby', m:3, c:'#ff4a6a'}; return null; };
  const spawnGem = () => { let x = 30 + Math.random()*(W-80), y = VIEW.y + 50 + Math.random()*(VIEW.h-120);
    if (Math.hypot(x-ROCK.x, y-ROCK.y) < ROCK.r+30) x = 40 + Math.random()*180; gems.push({x, y, life: learn ? undefined : gemLife(), rare: learn ? null : rollRare()}); A.tone(1320,.08,'sine',.05); };
  const takeGem = gm => { gems = gems.filter(x => x !== gm); const sp = {x:gm.x, y:gm.y};
    if (!learn) { const n = Math.max(20, rate()*30) * (gm.rare ? gm.rare.m : 1); give(n); float(sp.x, sp.y-20, '+'+fmt(n)+' ORE'+(gm.rare?' · '+gm.rare.k.toUpperCase():''), gm.rare ? gm.rare.c : '#9fd8ff'); burst(sp.x, sp.y, gm.rare ? gm.rare.c : '#9fd8ff', gm.rare ? 34 : 24); S.gems = (S.gems||0)+1; addGems(gm.rare ? ({Ruby:2, Emerald:3, Diamond:5, Starlight:10})[gm.rare.k] : 1, sp.x, sp.y); if (!gems.length) gemT = gemGap(); A.sfx('coin'); return; }
    busy = true;
    A.quiz(wrap, 'MATH GEODE · ANSWER TO CRACK IT OPEN', (ok, p) => { busy = false; edu(api, ok);
      if (ok) { const n = Math.max(60, rate()*90); give(n); S.geodes = (S.geodes||0)+1; addGems(1, sp.x, sp.y); stat(api,'geodes',1,'add'); float(sp.x, sp.y-20, '+'+fmt(n)+' ORE', C.lime); burst(sp.x, sp.y, '#9fd8ff', 34); say('GEODE CRACKED', '+'+fmt(n)+' ore · '+S.geodes+' solved', C.lime); }
      else say('THE GEODE CRUMBLED', A.solved(p), '#ffb3ab');
      gemT = gemGap(); persist(); }); };
  // a hidden treasure chest on every layer (once each)
  const openChest = i => { if (S.chests[i] || i > depthIdx()) return; S.chests[i] = 1; const L = GL(), bonus = (L>=13?1.25:1)*(L>=15?1.2:1)*(L>=19?1.33:1)*(hasT('trove')?3:1);
    const n = Math.max(200, rate()*90*(1 + i*.04)) * bonus, sp = chestPos(i); give(n);
    float(sp.x, sp.y-24, '+'+fmt(n)+' · '+DEPTHS[i].b.tr.toUpperCase(), C.gold); addGems(hasT('trove') ? 9 : 3, sp.x, sp.y-20); burst(sp.x, sp.y, C.gold, 30); A.sfx('win'); stat(api,'mineChests',1,'add'); persist(); };
  // hazards — tap to disarm before the fuse runs out
  const spawnHazard = () => { const d = depthIdx(), B = DEPTHS[d].b; hazard = {x: 40 + Math.random()*(W-140), y: VIEW.y + 70 + Math.random()*(VIEW.h-140), fuse: 7 + (GL()>=8 ? 3 : 0), max: 7 + (GL()>=8 ? 3 : 0), n: B.hz};
    say('⚠ '+B.hz.toUpperCase()+'!', 'Tap it before it goes off — or your miners slow down for a bit', '#ffb3ab'); A.sfx('bad'); };
  const disarm = () => { const sp = {x:hazard.x, y:hazard.y}, n = Math.max(30, rate()*12) * (GL()>=17 ? 2 : 1); give(n); float(sp.x, sp.y-20, 'DISARMED +'+fmt(n), C.lime); burst(sp.x, sp.y, C.lime, 16); A.sfx('coin'); hazard = null; hazardT = 70 + Math.random()*60; };

  // ---------- shop overlay ----------
  let shop = null, shopQ = null, shopRender = null, gemRender = null, gemQ = null;
  const rerenderAll = () => { if (shopQ) shopQ(); if (shopRender) shopRender(); if (gemQ) gemQ(); if (gemRender) gemRender(); paintBar(); };
  const upDesc = (u, l) => { if (u.id=='auto' && l >= FORE_MAX) return 'Merges every 0.1 s (fastest) · past level 100 each level adds +2% ore · now +'+(2*(l-FORE_MAX))+'%';
    if (u.id=='gem' && l >= GEM_MAX) return 'All 20 Gem Sense perks unlocked · each extra level adds +5% ore · now +'+(5*(l-GEM_MAX))+'%';
    if (u.id=='auto') return l ? 'Auto-merges a matching pair every '+sec(foreInt(l))+(l<FORE_MAX ? ' · next level: every '+sec(foreInt(l+1)) : ' · max speed!') : 'Auto-merges matching miners · Lv1 merges every 6 s · Lv100 every 0.1 s';
    if (u.id=='gem') return (l ? 'Now: '+GEM.slice(1, l+1).filter((x,i)=>i>=Math.max(0,l-2)).join(' · ') : 'Better gems, treasure and hazard warnings')+(l<GEM_MAX ? ' · Next (Lv '+(l+1)+'): '+GEM[l+1] : ' · All 20 levels unlocked!');
    return u.d; };
  const openShop = () => { if (busy) return; busy = true; A.sfx('blip');
    shop = el('div',{position:'absolute',inset:0,background:'rgba(27,19,12,.97)',zIndex:30,display:'flex',flexDirection:'column',padding:'14px',boxSizing:'border-box',gap:'8px',color:'#fff',overflow:'auto'});
    const head = el('div',{display:'flex',justifyContent:'space-between',alignItems:'center'});
    head.append(el('div',{fontWeight:700,fontSize:'20px',color:C.gold},'Mine Upgrades'));
    const close = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'8px 16px',background:C.lime,color:C.forest,cursor:'pointer'},'Back to digging'); close.onclick = () => { shop.remove(); shop = null; shopQ = shopRender = null; busy = false; };
    const gemB = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'8px 14px',background:'#64CDF5',color:'#06324a',cursor:'pointer'},'💎 Gem Tree'); gemB.onclick = () => openGemTree();
    const hb = el('div',{display:'flex',gap:'6px'}); hb.append(gemB, close); head.append(hb); shop.append(head);
    const oreLine = el('div',{fontSize:'14px',color:'#EDE9D8'}); shop.append(oreLine);
    const qRow = () => { const r = el('div',{display:'flex',gap:'5px',alignItems:'center',flexWrap:'wrap'}); r.append(el('span',{fontSize:'12px',fontWeight:700,color:C.gold},'BUY'));
      [1,10,100,'max'].forEach(v => { const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'12px',border:'1.5px solid '+C.gold,borderRadius:'999px',padding:'4px 10px',cursor:'pointer',background:getQ()===v?C.gold:'transparent',color:getQ()===v?'#2a1d12':C.gold}, v==='max'?'Max':'×'+v); x.onclick = () => { setQ(v); A.sfx('blip'); rerenderAll(); }; r.append(x); });
      r.append(el('span',{fontSize:'11px',color:'#cfc6a8'},'upgrades · Gem Tree · hiring')); return r; };
    const qHolder = el('div'); qHolder.append(qRow()); shop.append(qHolder); shopQ = () => { qHolder.innerHTML = ''; qHolder.append(qRow()); };
    const list = el('div',{display:'flex',flexDirection:'column',gap:'8px'}); shop.append(list);
    const render = () => { oreLine.textContent = '⛏ '+fmt(S.ore)+' ore · Upgrades cost ore, not tickets'; list.innerHTML = '';
      UPS.forEach(u => { const l = U(u.id), maxed = l >= u.max, pl = plan(u.cost, l, u.max, S.ore), cost = pl.n ? pl.tot : Math.min(BIG, Math.ceil(u.cost(l))), can = !maxed && pl.n > 0;
        const row = el('div',{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,.07)',borderRadius:'12px',padding:'10px 12px'});
        const txt = el('div',{flex:'1',minWidth:0}); txt.append(el('div',{fontWeight:700,fontSize:'15px'},u.n+'  '), el('div',{fontSize:'12px',color:'#cfc6a8',lineHeight:1.35},upDesc(u,l)+(u.max==1 ? (l ? ' · owned' : '') : ' · level '+l+(u.max<999 && isFinite(u.max)?'/'+u.max:''))));
        const pips = el('div',{display:'flex',gap:'2px',marginTop:'4px',flexWrap:'wrap'}); if (u.max<=25 && u.max>1) for (let k=0;k<u.max;k++) pips.append(el('div',{width:'9px',height:'5px',borderRadius:'3px',background:k<l?C.gold:'rgba(255,255,255,.18)'}));
        else if (u.max==FORE_MAX) pips.append(el('div',{width:'100%',height:'6px',borderRadius:'3px',background:'linear-gradient(90deg,'+C.gold+' '+l+'%,rgba(255,255,255,.18) '+l+'%)'})); txt.append(pips);
        const b = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'9px 12px',minWidth:'96px',cursor:can?'pointer':'default',background:maxed?'rgba(255,255,255,.12)':can?C.gold:'rgba(255,255,255,.18)',color:maxed?'#cfc6a8':can?'#2a1d12':'#cfc6a8'}, maxed?'MAXED':(pl.n > 1 ? '×'+pl.n+' · ' : '')+fmt(cost)+' ore');
        b.onclick = () => { if (u.fo && !U('auto')) { A.sfx('bad'); say('HIRE THE FOREMAN FIRST', 'Foreman perks need Foreman level 1', '#ffb3ab'); return; } const q = plan(u.cost, U(u.id), u.max, S.ore); if (!q.n) { A.sfx('bad'); return; } S.ore -= q.tot; S.up[u.id] = U(u.id)+q.n; A.sfx('coin'); persist(); render(); paintBar(); };
        if (u.fo && !U('auto') && !maxed) { b.textContent = '🔒 Foreman first'; b.style.background = 'rgba(255,255,255,.12)'; b.style.color = '#cfc6a8'; }
        if (u.tog && maxed) { const on = foOn(u.id); b.textContent = on ? 'ON' : 'OFF'; b.style.cursor = 'pointer'; b.style.background = on ? C.lime : 'rgba(255,255,255,.18)'; b.style.color = on ? C.forest : '#fff';
          b.onclick = () => { S.fo = S.fo || {}; S.fo[u.id] = !foOn(u.id); A.sfx('blip'); persist(); render(); }; }
        row.append(txt, b); list.append(row); });
      const info = el('div',{fontSize:'12px',color:'#cfc6a8',lineHeight:'1.5',marginTop:'4px'});
      info.innerHTML = 'Layer <b style="color:#fff">'+(depthIdx()+1)+'/100 · '+DEPTHS[depthIdx()].n+'</b> (+'+(depthIdx()*20)+'% ore). Dig more lifetime ore to reach deeper layers.<br>Miners dig while you’re playing, and keep digging at '+(GL2('owl')?'75%':'half')+' speed while you’re away for up to '+(2+2*U('night'))+' hours (Night Shift adds more).'+(extraStart()?'<br>Extra hire levels past the top miner: <b style="color:#fff">+'+(extraStart()*15)+'% ore</b>.':'')+'<br>Selling ore: 9 ore = 1 ticket, 900 = 10, 1M = 333 · no daily limit.';
      const calmB = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'13px',border:'none',borderRadius:'999px',padding:'8px 14px',cursor:'pointer',background:'rgba(255,255,255,.14)',color:'#fff',alignSelf:'flex-start'}, 'Performance mode · '+(S.calm?'ON (fewer effects)':'OFF'));
      calmB.onclick = () => { S.calm = !S.calm; A.sfx('blip'); persist(); render(); };
      // code bar (one-time codes, remembered in your save even through Rebirths)
      const codeRow = el('div',{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap',background:'rgba(255,255,255,.07)',borderRadius:'12px',padding:'8px 10px'});
      const inp = el('input',{flex:'1 1 140px',minWidth:0,fontFamily:A.font,fontSize:'14px',fontWeight:700,borderRadius:'999px',border:'none',padding:'8px 12px',textTransform:'uppercase'}); inp.placeholder = 'Enter a code'; inp.setAttribute('aria-label','Mines code');
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key=='Enter') redeem(); });
      const go = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'13px',border:'none',borderRadius:'999px',padding:'8px 14px',cursor:'pointer',background:C.lime,color:C.forest},'Redeem');
      const cmsg = el('div',{width:'100%',fontSize:'12px',fontWeight:700,color:C.lime,minHeight:'14px'}, codeMsg);
      const redeem = () => { const v = inp.value.trim().toUpperCase(); S.codes = S.codes || {};
        if (v == 'NIGHTSHIFT20') { if (S.codes[v]) { codeMsg = 'You already redeemed that code.'; A.sfx('bad'); } else { S.codes[v] = Date.now(); S.up.night = Math.max(U('night'), 20); codeMsg = '✓ Code redeemed! Night Shift is now level '+U('night')+'.'; A.sfx('win'); persist(); } }
        else if (v == 'MINERRESCUE') { if (S.codes[v]) { codeMsg = 'You already redeemed that code.'; A.sfx('bad'); } else if (minerCount() > 0) { codeMsg = 'This code only works when you have no miners.'; A.sfx('bad'); }
          else { S.codes[v] = Date.now(); const L = Math.min(15, MAXL); S.grid[0] = L; if (L > (S.best||1)) S.best = L; codeMsg = '✓ Code redeemed! A level '+L+' '+LV[L].n+' joined your crew.'; A.sfx('win'); burst(cell(0).x+CW/2, cell(0).y+CH/2, LV[L].c, 30); persist(); paintBar(); } }
        else { codeMsg = v ? 'That code doesn’t work.' : ''; if (v) A.sfx('bad'); }
        render(); };
      go.onclick = redeem; codeRow.append(el('div',{fontWeight:700,fontSize:'12px',color:C.gold,letterSpacing:'.08em'},'CODE'), inp, go, cmsg);
      list.append(codeRow, calmB, info); };
    shopRender = render; render(); wrap.append(shop); };

  // ---------- Gem Tree overlay (permanent, paid in gems) ----------
  let gemO = null;
  const openGemTree = () => { if (gemO) return; if (shop) { shop.remove(); shop = null; shopQ = shopRender = null; } busy = true; A.sfx('blip');
    gemO = el('div',{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 0%,#1d3a5a,#0b1220 70%)',zIndex:32,display:'flex',flexDirection:'column',padding:'14px',boxSizing:'border-box',gap:'8px',color:'#fff',overflow:'auto'});
    const head = el('div',{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px'}); head.append(el('div',{fontWeight:700,fontSize:'20px',color:'#bff0ff'},'💎 Gem Tree'));
    const close = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'8px 16px',background:C.lime,color:C.forest,cursor:'pointer'},'Back to digging'); close.onclick = () => { gemO.remove(); gemO = null; gemQ = gemRender = null; busy = false; };
    head.append(close); gemO.append(head);
    const bank = el('div',{fontSize:'14px',color:'#dff6ff',lineHeight:1.45}); const list = el('div',{display:'flex',flexDirection:'column',gap:'8px'}); const gq = el('div'); gemQ = () => { gq.innerHTML = ''; const r = el('div',{display:'flex',gap:'5px',alignItems:'center',flexWrap:'wrap'}); r.append(el('span',{fontSize:'12px',fontWeight:700,color:'#bff0ff'},'BUY'));
      [1,10,100,'max'].forEach(v => { const x = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'12px',border:'1.5px solid #64CDF5',borderRadius:'999px',padding:'4px 10px',cursor:'pointer',background:getQ()===v?'#64CDF5':'transparent',color:getQ()===v?'#06324a':'#bff0ff'}, v==='max'?'Max':'×'+v); x.onclick = () => { setQ(v); A.sfx('blip'); rerenderAll(); }; r.append(x); }); gq.append(r); }; gemQ(); gemO.append(bank, gq, list);
    const render = () => { bank.innerHTML = '<b style="font-size:18px">💎 '+fmt(S.gemBank||0)+' gems</b><br>Permanent upgrades for The Mines — they <b>never reset</b>, not even when you Rebirth. Earn gems by grabbing gems in the rock (rare ones give more), opening treasure rooms (+3), beating Cave Golems (+5) and the Armageddon Core (+100).'; list.innerHTML = '';
      GT.forEach(n => { const l = GL2(n.k), maxed = l >= n.max, pl = plan(n.cost, l, n.max, S.gemBank||0), cost = pl.n ? pl.tot : Math.ceil(n.cost(l)), can = !maxed && pl.n > 0;
        const row = el('div',{display:'flex',alignItems:'center',gap:'10px',background:'rgba(191,240,255,.08)',border:'1px solid rgba(191,240,255,.18)',borderRadius:'12px',padding:'10px 12px'});
        const txt = el('div',{flex:'1',minWidth:0}); txt.append(el('div',{fontWeight:700,fontSize:'15px'},n.e+' '+n.n), el('div',{fontSize:'12px',color:'#b9d6e6',lineHeight:1.35},n.d+' · level '+l+'/'+n.max), el('div',{fontSize:'12px',fontWeight:700,color:'#bff0ff'},'Now: '+n.fx(l)+(maxed?' · MAXED':' → next: '+n.fx(l+1))));
        const pips = el('div',{display:'flex',gap:'2px',marginTop:'4px'}); for (let k=0;k<n.max;k++) pips.append(el('div',{width:Math.max(6, Math.min(14, 120/n.max))+'px',height:'5px',borderRadius:'3px',background:k<l?'#64CDF5':'rgba(255,255,255,.18)'})); txt.append(pips);
        const b = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'9px 12px',minWidth:'92px',cursor:can?'pointer':'default',background:maxed?'rgba(255,255,255,.12)':can?'#64CDF5':'rgba(255,255,255,.18)',color:maxed?'#b9d6e6':can?'#06324a':'#b9d6e6'}, maxed?'MAXED':(pl.n > 1 ? '×'+pl.n+' · ' : '')+fmt(cost)+' 💎');
        b.onclick = () => { const q = plan(n.cost, GL2(n.k), n.max, S.gemBank||0); if (!q.n) { A.sfx('bad'); return; } S.gemBank -= q.tot; S.gtree[n.k] = GL2(n.k)+q.n; A.sfx('win');
          if (n.k == 'slots') { while (S.grid.length < SLOTS()) S.grid.push(0); relayout(); }
          stat(api,'mineGemTree',Object.values(S.gtree).reduce((a,x)=>a+x,0)); persist(); render(); paintBar(); };
        row.append(txt, b); list.append(row); }); };
    gemRender = render; render(); wrap.append(gemO); };

  // ---------- map of all 300 layers (scroll with one finger, pinch or +/− to zoom) ----------
  let mapO = null;
  const openMap = () => { if (busy || mapO) return; busy = true; A.sfx('blip'); let z = 1, sy = Math.max(0, depthIdx()*26 - 160), dragY = null;
    mapO = el('div',{position:'absolute',inset:0,background:'rgba(12,8,4,.97)',zIndex:31,display:'flex',flexDirection:'column',color:'#fff'});
    const head = el('div',{display:'flex',alignItems:'center',gap:'6px',padding:'10px 12px'}); head.append(el('div',{fontWeight:700,fontSize:'18px',color:C.gold,flex:1},'🗺 The '+(LAST+1)+' Layers'));
    const mb = (t,f) => { const b = el('button',{fontFamily:A.font,fontWeight:700,fontSize:'14px',border:'none',borderRadius:'999px',padding:'7px 12px',background:'rgba(255,255,255,.14)',color:'#fff',cursor:'pointer'},t); b.onclick = f; head.append(b); return b; };
    const shut = () => { if (mapO) mapO.remove(); mapO = null; busy = false; };
    mb('−', ()=>{ z = Math.max(.35, z/1.3); }); mb('+', ()=>{ z = Math.min(2.5, z*1.3); }); const cl = mb('Close', shut); cl.style.background = C.lime; cl.style.color = C.forest;
    const cv = el('canvas',{display:'block',touchAction:'none',cursor:'grab'}); const dpr = window.devicePixelRatio||1; cv.width = W*dpr; cv.height = (H-60)*dpr; cv.style.width = W+'px'; cv.style.height = (H-60)+'px'; const mg = cv.getContext('2d'); mg.scale(dpr,dpr);
    mapO.append(head, cv); wrap.append(mapO);
    const RH = () => 26*z, d0 = depthIdx();
    const drawMap = () => { if (!mapO) return; const rh = RH(), MH = H-60; sy = Math.max(0, Math.min((LAST+1)*rh - MH + 20, sy)); mg.fillStyle = '#0c0804'; mg.fillRect(0,0,W,MH);
      const i0 = Math.max(0, Math.floor(sy/rh)), i1 = Math.min(LAST, Math.ceil((sy+MH)/rh));
      for (let i=i0;i<=i1;i++) { const D = DEPTHS[i], y = i*rh - sy, reached = i <= d0, cleared = i < d0 || (i==LAST && S.core300), here = i == d0;
        const gr = mg.createLinearGradient(0,y,0,y+rh); gr.addColorStop(0, reached ? D.b.a : '#1a1a1a'); gr.addColorStop(1, reached ? D.b.b : '#0e0e0e'); mg.fillStyle = gr; mg.fillRect(20, y+1, W-40, rh-2);
        if (i > 0 && DEPTHS[i-1].b !== D.b) { mg.fillStyle = reached ? D.b.ore : '#444'; mg.fillRect(20, y, W-40, 2); }
        if (here) { mg.strokeStyle = C.lime; mg.lineWidth = 3; mg.strokeRect(21, y+2, W-42, rh-4); }
        if (rh >= 14) { mg.fillStyle = reached ? '#fff' : '#666'; mg.font = '700 '+Math.min(14, rh*.5)+'px '+A.font; mg.textAlign = 'left'; mg.fillText((i+1)+'  '+(reached ? D.b.e+' '+D.n : '???'), 30, y+rh*.65, 250);
          mg.textAlign = 'right'; mg.fillText(here ? '⛏ YOU ARE HERE' : cleared ? '✓' : reached ? '' : '🔒 '+fmt(D.at)+' ore', W-30, y+rh*.65);
          if (reached && !S.chests[i] && GL()>=5 && rh >= 18 && !here) { mg.fillStyle = C.gold; mg.fillText('◆ treasure', W-70, y+rh*.65); } }
        if (i==LAST) { mg.fillStyle = 'rgba(255,58,26,'+(.25+.15*Math.sin(t*4))+')'; mg.fillRect(20, y+1, W-40, rh-2); } }
      mg.fillStyle = 'rgba(255,255,255,.5)'; mg.fillRect(8, 0, 4, MH); mg.fillStyle = C.lime; mg.fillRect(6, (d0/LAST)*MH - 4, 8, 8);
      requestAnimationFrame(drawMap); };
    drawMap();
    cv.addEventListener('wheel', e => { e.preventDefault(); if (e.ctrlKey || Math.abs(e.deltaY) < 4) z = Math.max(.35, Math.min(2.5, z*(e.deltaY>0?.9:1.1))); else sy += e.deltaY; }, {passive:false});
    const pts = new Map(); let pinch = null;
    cv.addEventListener('pointerdown', e => { pts.set(e.pointerId, e.clientY); dragY = {y:e.clientY, s:sy, moved:false}; try { cv.setPointerCapture(e.pointerId); } catch(_){}
      if (pts.size == 2) { const v = [...pts.values()]; pinch = {d:Math.abs(v[0]-v[1]) || 1, z}; } });
    cv.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e.clientY); if (pinch && pts.size == 2) { const v = [...pts.values()]; z = Math.max(.35, Math.min(2.5, pinch.z * (Math.abs(v[0]-v[1])||1)/pinch.d)); return; }
      if (dragY) { const dy = e.clientY - dragY.y; if (Math.abs(dy) > 6) dragY.moved = true; sy = dragY.s - dy * (W / cv.getBoundingClientRect().width); } });
    cv.addEventListener('pointerup', e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (dragY && !dragY.moved) { const r = cv.getBoundingClientRect(), y = (e.clientY - r.top) * (W / r.width) + sy, i = Math.floor(y / RH());
        if (i >= 0 && i <= LAST) { const D = DEPTHS[i], tr = traitOf(i); shut(); if (i <= d0) say('LAYER '+(i+1)+': '+D.n.toUpperCase(), D.b.e+' '+D.b.n+(tr ? ' · Twist: '+tr.n : ''), D.b.ore); else say('LAYER '+(i+1)+' IS STILL LOCKED', 'Dig '+fmt(D.at)+' ore in total to reach it', '#cfc6a8'); A.sfx('blip'); } } dragY = null; }); };
  // ---------- bottom bar ----------
  const setH = (e,h) => { if (e._h !== h) { e._h = h; e.innerHTML = h; } };
  const sellVal = L => Math.ceil(lvRate(L)*mult()*45*(1 + .5*U('fsell2')));
  const paintBar = () => { const cost = hireCost(), full = S.grid.indexOf(0) < 0, none = !minerCount();
    if (sel >= 0 && S.grid[sel]) { const last = minerCount()==1; setH(bHire, '<div>'+(last && sellArm>0 ? 'Sell LAST miner?' : 'Sell Lv '+S.grid[sel]+' miner')+'</div><div style="font-size:12px;font-weight:600;opacity:.85">+'+fmt(sellVal(S.grid[sel]))+' ore'+(last?' · last one!':'')+'</div>'); bHire.style.background = last ? '#FF4539' : '#FF8A3C'; bHire.style.opacity = '1'; }
    else { setH(bHire, '<div>Hire miner'+(getQ()!==1 && !full ? ' ×'+(getQ()==='max'?'Max':getQ()) : '')+'</div><div style="font-size:12px;font-weight:600;opacity:.85">'+(full?'grid full · merge!':fmt(cost)+' ore · Lv '+hireLv())+'</div>'); bHire.style.background = C.lime; bHire.style.opacity = !full && S.ore >= cost ? '1' : '.6'; }
    setH(bQty, '<div style="font-size:11px;opacity:.8">BUY</div><div>'+(getQ()==='max'?'Max':'×'+getQ())+'</div>');
    setH(bShop, '<div>Upgrades</div><div style="font-size:12px;font-weight:600;opacity:.75">pick · foreman · codes</div>');
    const q = cashQuote();
    if (none) { setH(bCash, '<div>Cash out locked</div><div style="font-size:12px;font-weight:600;opacity:.8">You need at least one miner</div>'); bCash.style.opacity = '.45'; bCash.disabled = false; bCash.style.cursor = 'not-allowed'; }
    else { setH(bCash, '<div>Cash out → '+fmt(q.got)+' 🎟</div><div style="font-size:12px;font-weight:600;opacity:.8">'+(q.capped ? 'counter '+q.pct+'% full · sells all ore' : 'sells all your ore')+'</div>'); bCash.style.opacity = q.got>=1 ? '1' : '.6'; bCash.style.cursor = 'pointer'; } };

  // ---------- input: tap the scene to dig and to grab things; drag miners in the grid to merge ----------
  const pt = e => { const r = c.getBoundingClientRect(); return {x:(e.clientX-r.left)*w/r.width, y:(e.clientY-r.top)*h/r.height}; };
  const inView = p => p.y >= VIEW.y && p.y < VIEW.y+VIEW.h;
  const BTN = [{k:'story', x:W-142, y:VIEW.y+8, w:40, h:28, t:'📜'}, {k:'gem', x:W-98, y:VIEW.y+8, w:40, h:28, t:'💎'}, {k:'map', x:W-54, y:VIEW.y+8, w:44, h:28, t:'🗺'}];
  const near = (p, x, y, r) => Math.hypot(p.x-x, p.y-y) < r;
  const viewTap = p => {
    if (trans) return;
    if (dlg) { if (dlg.shown < dlg.txt.length) dlg.shown = dlg.txt.length; else nextDlg(); A.sfx('blip'); return; }
    const b = BTN.find(b => p.x>=b.x && p.x<=b.x+b.w && p.y>=b.y && p.y<=b.y+b.h);
    if (b) { if (b.k=='story') replayStory(); if (b.k=='gem') openGemTree(); if (b.k=='map') openMap(); A.sfx('blip'); return; }
    const d = depthIdx(), mech = DEPTHS[d].b.mech, MM = mechOf();
    if (core && core.meteors) { const m = core.meteors.find(m => near(p, m.x, m.y, 30)); if (m) { core.meteors = core.meteors.filter(x => x!==m); burst(p.x, p.y, '#ff9f3a', 14); give(Math.max(50, rate()*3)); A.tone(500,.05,'square',.04); return; } }
    if (hazard && near(p, hazard.x, hazard.y, 34)) { disarm(); return; }
    if (gcart && near(p, gcart.x, LEDGE+6, 36)) { const n = Math.max(50, rate()*45); give(n); float(p.x, p.y-30, '+'+fmt(n)+' GOLD CART!', C.gold); burst(p.x, p.y, C.gold, 30); gcart = null; A.sfx('win'); return; }
    const gm = gems.find(g2 => near(p, g2.x, g2.y, 30)); if (gm) { takeGem(gm); return; }
    if (!S.chests[d]) { const cp = chestPos(d); if (near(p, cp.x, cp.y, 28)) { openChest(d); return; } }
    if (!core && !golem) {
      for (const o of objs) { const hb = MM.hit ? MM.hit(o) : {x:o.x, y:o.y, r:(o.r||14)+10}; if (near(p, hb.x, hb.y, hb.r)) { const res = MM.tap(o); if (res !== 'keep') objs = objs.filter(x => x !== o); return; } }
      if (mech == 'gears' && near(p, GEAR.x, GEAR.y, GEAR.r+12)) { if (gearHit()) reward(12, GEAR.x, GEAR.y-GEAR.r, 'PERFECT!', '#ffd23a'); else { float(GEAR.x, GEAR.y-GEAR.r-10, 'WAIT FOR THE TOP!', '#cfc6a8'); A.tone(200,.06,'square',.03); } return; }
      if (mech == 'dragon' && near(p, GOLD.x, GOLD.y, 52)) { if (wakeT > 0) { float(GOLD.x, GOLD.y-60, 'SHHH! IT’S AWAKE', '#ffb3ab'); A.sfx('bad'); return; }
        noise += .34; reward(3, GOLD.x + (Math.random()-.5)*40, GOLD.y-20, 'GOLD', '#ffb03a'); if (noise > 1.4) { wakeT = 4; noise = 0; say('THE DRAGON WOKE UP!', 'Wait until it falls back asleep — then tap more slowly', '#ffb3ab'); A.tone(80,.5,'sawtooth',.06); shake = .3; } return; }
      if (mech == 'glyphs' && glyph) { const k = GSTONES.findIndex(s => near(p, s.x, s.y, 24)); if (k >= 0) { if (glyph.stones[k] === glyph.order[glyph.step]) { glyph.step++; A.tone(500+glyph.step*150,.12,'sine',.05); burst(GSTONES[k].x, GSTONES[k].y, '#F9BF01', 8);
            if (glyph.step == 3) { reward(30, W/2, VIEW.y+80, 'VAULT OPENED!', '#F9BF01'); addGems(2, W/2, VIEW.y+80); glyph = null; glyphT = 18; } }
          else { glyph.step = 0; float(GSTONES[k].x, GSTONES[k].y-30, 'WRONG ORDER', '#ffb3ab'); A.sfx('bad'); } return; } } }
    tapRock(p.x, p.y); };
  const ptrs = new Map();
  c.addEventListener('pointermove', e => { const p = pt(e); if (inView(p)) { lamp.x = p.x; lamp.y = p.y; } if (!drag) return; drag.x = p.x; drag.y = p.y; if (Math.hypot(p.x-drag.sx, p.y-drag.sy) > 8) drag.moved = true; });
  c.addEventListener('pointerdown', e => { if (busy) return; const p = pt(e);
    if (inView(p)) { e.preventDefault(); lamp.x = p.x; lamp.y = p.y; viewTap(p); return; }
    const i = cellAt(p.x, p.y); if (i < 0) { sel = -1; sellArm = 0; paintBar(); return; }
    e.preventDefault();
    if (S.grid[i]) { drag = {i, x:p.x, y:p.y, sx:p.x, sy:p.y, moved:false}; try { c.setPointerCapture(e.pointerId); } catch(_){} }
    else if (sel >= 0) { moveOrSwap(sel, i); sel = -1; } });
  const up = e => { if (!drag) return; const p = pt(e), d = drag; drag = null; d.x = p.x; d.y = p.y;
    if (d.moved) { const j = cellAt(d.x, d.y); if (j >= 0 && j !== d.i) moveOrSwap(d.i, j); sel = -1; return; }
    if (sel >= 0 && sel !== d.i) { if (S.grid[sel]===S.grid[d.i]) { merge(sel, d.i); paintBar(); } else moveOrSwap(sel, d.i); sel = -1; } else { sel = sel === d.i ? -1 : d.i; sellArm = 0; } A.sfx('blip'); paintBar(); };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', () => { drag = null; });
  const offK = A.keys(e => { if (busy) return false; const k = e.key.length==1 ? e.key.toLowerCase() : e.key;
    if (k==' ' || k=='Enter') { if (dlg) { if (dlg.shown < dlg.txt.length) dlg.shown = dlg.txt.length; else nextDlg(); return; } tapRock(ROCK.x+(Math.random()-.5)*50, ROCK.y+(Math.random()-.5)*30); }
    else if (k=='h') hire(); else if (k=='m') { autoMerge(); paintBar(); } else if (k=='g') openMap(); else if (k=='u') openShop(); else return false; });
  const ku = () => {}; window.addEventListener('keyup', ku);

  // ---------- drawing ----------
  const drawMiner = (gx, x, y, L, s, swing) => { const col = LV[L].c; gx.save(); gx.translate(x, y); gx.scale(s, s);
    gx.save(); gx.translate(10, -6); gx.rotate(-.9 + Math.sin(swing)*.8); gx.strokeStyle = '#8D5B1D'; gx.lineWidth = 3; gx.beginPath(); gx.moveTo(0,0); gx.lineTo(0,-20); gx.stroke();
    gx.strokeStyle = L>=7 ? col : '#c9ccd1'; gx.lineWidth = 3.5; gx.lineCap = 'round'; gx.beginPath(); gx.moveTo(-9,-18); gx.quadraticCurveTo(0,-24,9,-18); gx.stroke(); gx.restore();
    gx.fillStyle = col; rrect(gx,-9,-4,18,18,5); gx.fill(); gx.fillStyle = 'rgba(0,0,0,.25)'; gx.fillRect(-9,6,18,3);
    gx.fillStyle = '#3a2a1c'; gx.fillRect(-8,14,6,6); gx.fillRect(2,14,6,6);
    gx.fillStyle = '#f2c9a0'; gx.beginPath(); gx.arc(0,-11,7,0,TAU); gx.fill();
    gx.fillStyle = '#121313'; gx.beginPath(); gx.arc(-2.5,-11,1.2,0,TAU); gx.arc(2.5,-11,1.2,0,TAU); gx.fill();
    gx.fillStyle = L>=10 ? '#fff' : C.gold; gx.beginPath(); gx.arc(0,-13,7.5,Math.PI,0); gx.fill(); gx.fillRect(-9,-14,18,2.5);
    gx.fillStyle = '#fffbe0'; gx.beginPath(); gx.arc(0,-17,2.3,0,TAU); gx.fill();
    if (L >= 5 && !lowFx()) { gx.globalAlpha = .18 + .1*Math.sin(t*4); gx.fillStyle = '#fff6b0'; gx.beginPath(); gx.moveTo(0,-17); gx.lineTo(-14,-34); gx.lineTo(14,-34); gx.fill(); gx.globalAlpha = 1; }
    gx.restore(); };
  // animated biome details over the cached scenery (computed from time — no particle arrays)
  const drawLayerFx = (i, oy) => { const B = DEPTHS[i].b, y0 = VIEW.y + oy, LH = VIEW.h, low = lowFx(), n = low ? 4 : 12;
    if (B.fx=='drip' || B.fx=='bubbles') for (let k=0;k<n;k++) { const x = hashL(i, 100+k)*W, ph = ((t*.5 + hashL(i,200+k)) % 1); g.fillStyle = B.fx=='bubbles' ? 'rgba(159,232,255,.6)' : 'rgba(159,216,255,.7)'; const yy = B.fx=='bubbles' ? y0 + LH - ph*LH : y0 + ph*LH; g.beginPath(); g.arc(x, yy, B.fx=='bubbles' ? 3 : 2, 0, TAU); g.fill(); }
    if (B.fx=='dust' || B.fx=='spores' || B.fx=='snow') for (let k=0;k<n;k++) { const x = (hashL(i,300+k)*W + t*(B.fx=='snow'?6:12)*(k%2?1:-1) + W*10) % W, yy = y0 + ((hashL(i,400+k)*LH + t*(B.fx=='snow'?18:4)) % LH);
      g.fillStyle = B.fx=='spores' ? 'rgba(159,255,176,.6)' : B.fx=='snow' ? 'rgba(255,255,255,.8)' : 'rgba(255,240,210,.35)'; g.beginPath(); g.arc(x, yy, B.fx=='snow' ? 2.2 : 1.8, 0, TAU); g.fill(); }
    if (B.fx=='lava' || B.fx=='embers' || B.fx=='core') { g.fillStyle = B.fx=='core' ? 'rgba(255,58,26,.5)' : 'rgba(255,122,60,.4)'; g.beginPath(); g.moveTo(0, y0+LH); for (let x = 0; x <= W+30; x += 30) g.lineTo(x, y0+LH-8-Math.sin(x*.05+t*2)*4); g.lineTo(W, y0+LH); g.fill();
      for (let k=0;k<n;k++) { const x = hashL(i,500+k)*W, ph = (t*.4 + hashL(i,600+k)) % 1; g.fillStyle = 'rgba(255,'+(140+k*8)+',60,'+(1-ph)+')'; g.fillRect(x, y0+LH-14-ph*LH*.6, 3, 3); } }
    if (B.fx=='sparks' || B.fx=='stars' || B.fx=='void') for (let k=0;k<n;k++) { const x = hashL(i,700+k)*W, yy = y0 + hashL(i,800+k)*LH, a = .3 + .7*Math.abs(Math.sin(t*2 + k)); g.fillStyle = B.fx=='void' ? 'rgba(180,140,255,'+a*.6+')' : 'rgba(255,255,255,'+a*.8+')'; g.fillRect(x, yy, 2, 2); }
    if (B.fx=='gears') for (let k=0;k<3;k++) { const x = hashL(i,900+k)*W, yy = y0 + 30 + hashL(i,950+k)*60; g.save(); g.translate(x, yy); g.rotate(t*(k%2?1:-1)); g.strokeStyle = 'rgba(255,210,58,.45)'; g.lineWidth = 3; g.beginPath(); g.arc(0,0,12,0,TAU); g.stroke(); for (let q=0;q<6;q++) { g.rotate(Math.PI/3); g.fillStyle = 'rgba(255,210,58,.45)'; g.fillRect(12,-2,5,4); } g.restore(); }
    // swinging lanterns
    [110, 250, 400].forEach(x => { const a = low ? 0 : Math.sin(t*1.6 + x*.01)*.25; g.save(); g.translate(x, y0+8); g.rotate(a); g.strokeStyle = '#3a2a1c'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0,0); g.lineTo(0,14); g.stroke();
      if (!low) { g.fillStyle = 'rgba(249,191,1,.16)'; g.beginPath(); g.arc(0,20,24,0,TAU); g.fill(); } g.fillStyle = C.gold; rrect(g,-4,14,8,10,2); g.fill(); g.restore(); }); };
  // the biome's special things
  const drawMech = () => { const d = depthIdx(), mech = DEPTHS[d].b.mech, B = DEPTHS[d].b;
    for (const o of objs) { g.save();
      switch (mech) {
        case 'worms': { const up2 = Math.min(1, o.t*3) * Math.min(1, (o.life||0)*2), yy = o.y - up2*18; g.fillStyle = '#2a1a0e'; g.beginPath(); g.ellipse(o.x, o.y, 16, 5, 0, 0, TAU); g.fill();
          g.fillStyle = '#ff8fb3'; rrect(g, o.x-7, yy-14, 14, 16+up2*4, 7); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(o.x-3, yy-8, 1.6, 0, TAU); g.arc(o.x+3, yy-8, 1.6, 0, TAU); g.fill(); break; }
        case 'boulders': { g.translate(o.x, o.y); g.rotate(o.y*.03); g.fillStyle = '#7d7f84'; g.beginPath(); for (let k=0;k<8;k++) { const a = k/8*TAU, rr = o.r*(.8+.2*Math.sin(k*2.1)); g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr); } g.fill(); g.strokeStyle = '#4b4d50'; g.lineWidth = 2; g.beginPath(); g.moveTo(-o.r*.4, -o.r*.2); g.lineTo(o.r*.2, o.r*.3); g.stroke(); break; }
        case 'chime': break;
        case 'vents': { const full = o.fill >= .95; g.fillStyle = '#5a5d62'; rrect(g, o.x-10, o.y-26, 20, 26, 4); g.fill(); g.fillStyle = full ? '#D5F367' : '#3affd5'; g.fillRect(o.x-6, o.y-4-Math.min(1,o.fill)*18, 12, Math.min(1,o.fill)*18);
          if (full && !lowFx()) { g.fillStyle = 'rgba(255,255,255,'+(.4+.3*Math.sin(t*12))+')'; g.beginPath(); g.arc(o.x, o.y-36, 10+Math.sin(t*8)*3, 0, TAU); g.fill(); } break; }
        case 'meteors': { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(o.x, o.y); g.lineTo(o.x+40, o.y-10); g.stroke(); g.fillStyle = '#fff6b0'; g.beginPath(); for (let k=0;k<10;k++) { const a = k*Math.PI/5, rr = k%2 ? 4 : 10; g.lineTo(o.x+Math.cos(a)*rr, o.y+Math.sin(a)*rr); } g.fill(); break; }
        case 'slide': { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(o.x-30, o.y-4); g.lineTo(o.x-14, o.y-4); g.moveTo(o.x-26, o.y+3); g.lineTo(o.x-14, o.y+3); g.stroke(); g.fillStyle = '#dff6ff'; g.beginPath(); g.moveTo(o.x-12, o.y+6); g.lineTo(o.x-6, o.y-10); g.lineTo(o.x+10, o.y-8); g.lineTo(o.x+13, o.y+6); g.fill(); g.fillStyle = '#64CDF5'; g.fillRect(o.x-4, o.y-4, 6, 6); break; }
        case 'bounce': { const b2 = Math.abs(Math.sin(t*4+o.ph))*8; g.fillStyle = '#e8e0ff'; g.fillRect(o.x-5, o.y-16, 10, 16); g.fillStyle = '#ff6ad5'; g.beginPath(); g.ellipse(o.x, o.y-18-b2, 20, 13, 0, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(o.x-7, o.y-24-b2, 3, 0, TAU); g.arc(o.x+6, o.y-26-b2, 2.5, 0, TAU); g.fill(); break; }
        case 'bubbles': { g.strokeStyle = 'rgba(200,240,255,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(o.x + Math.sin(o.ph)*4, o.y, o.r, 0, TAU); g.stroke(); g.fillStyle = B.ore; g.beginPath(); g.arc(o.x + Math.sin(o.ph)*4, o.y, o.r*.35, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(o.x-o.r*.4, o.y-o.r*.4, 2.5, 0, TAU); g.fill(); break; }
        case 'gumdrops': { g.fillStyle = o.c; g.beginPath(); g.ellipse(o.x, o.y, 13, 11, 0, Math.PI, 0); g.lineTo(o.x+13, o.y+4); g.lineTo(o.x-13, o.y+4); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; for (let k=0;k<4;k++) g.fillRect(o.x-8+k*5, o.y-6+(k%2)*3, 2, 2); break; }
        case 'vines': { const sx = o.x + Math.sin(t*2+o.ph)*20; g.strokeStyle = '#2f8a3a'; g.lineWidth = 4; g.beginPath(); g.moveTo(o.x, VIEW.y); g.quadraticCurveTo(o.x, VIEW.y+40, sx, VIEW.y+70); g.stroke(); g.fillStyle = '#3fae5a'; g.beginPath(); g.ellipse(sx-8, VIEW.y+56, 8, 4, .6, 0, TAU); g.fill(); g.fillStyle = ['#FF8A3C','#ffd23a','#ff6ad5'][Math.floor(o.ph)%3]; g.beginPath(); g.arc(sx, VIEW.y+78, 9, 0, TAU); g.fill(); break; }
        case 'sandworm': { for (let k=4;k>=0;k--) { g.fillStyle = k ? '#c8a060' : '#e0b878'; g.beginPath(); g.arc(o.x - k*16, o.y - 6 - Math.abs(Math.sin(t*5 - k))*8, 12 - k, 0, TAU); g.fill(); } g.fillStyle = '#121313'; g.beginPath(); g.arc(o.x+4, o.y-12, 2, 0, TAU); g.fill(); break; }
        case 'notes': { g.fillStyle = '#ff9fe8'; g.font = '700 26px '+A.font; g.textAlign = 'center'; g.fillText(o.n, o.x, o.y + Math.sin(o.ph)*6); break; }
        case 'islands': { g.fillStyle = '#8D5B1D'; g.beginPath(); g.moveTo(o.x-22, o.y); g.lineTo(o.x+22, o.y); g.lineTo(o.x+6, o.y+18); g.lineTo(o.x-6, o.y+18); g.fill(); g.fillStyle = '#7cc46a'; g.fillRect(o.x-22, o.y-4, 44, 6); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(o.x-4, o.y-4); g.lineTo(o.x, o.y-14); g.lineTo(o.x+4, o.y-4); g.fill(); break; }
        case 'portals': { g.translate(o.x, o.y); for (let k=0;k<3;k++) { g.rotate(t*(1+k*.5)); g.strokeStyle = ['#b48cff','#ff5fd2','#64CDF5'][k]; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 20 - k*5, 0, TAU*.75); g.stroke(); } break; }
        case 'circuit': break;
        case 'dark': { const a = .5+.5*Math.sin(t*5+o.x); g.fillStyle = 'rgba(200,170,255,'+a+')'; g.beginPath(); for (let k=0;k<8;k++) { const aa = k*Math.PI/4, rr = k%2 ? 3 : 9; g.lineTo(o.x+Math.cos(aa)*rr, o.y+Math.sin(aa)*rr); } g.fill(); break; }
      } g.restore(); }
    // biome fixtures that are always on screen
    if (mech == 'chime') for (let k=0;k<4;k++) { const lit = objs.find(o => o.k == k), x = 70+k*60, y = VIEW.y+60+(k%2)*40; if (lit && !lowFx()) { g.fillStyle = 'rgba(159,216,255,'+(.35+.25*Math.sin(t*10))+')'; g.beginPath(); g.arc(x, y, 30, 0, TAU); g.fill(); }
      g.fillStyle = lit ? '#e8f8ff' : 'rgba(100,160,220,.7)'; g.beginPath(); g.moveTo(x, y-24); g.lineTo(x+11, y); g.lineTo(x, y+16); g.lineTo(x-11, y); g.fill(); }
    if (mech == 'chime' && chimeN > 1) { g.fillStyle = '#9fd8ff'; g.font = '700 12px '+A.font; g.textAlign = 'left'; g.fillText('CHIME ×'+chimeN, 12, VIEW.y+VIEW.h-44); }
    if (mech == 'circuit') { for (let cx=0; cx<6; cx++) for (let cy=0; cy<3; cy++) { const x = 60+cx*60, y = VIEW.y+50+cy*50, lit = objs.find(o => o.x == x && o.y == y); g.fillStyle = lit ? '#3affd5' : 'rgba(58,255,213,.18)'; g.beginPath(); g.arc(x, y, lit ? 11 : 6, 0, TAU); g.fill(); if (lit && !lowFx()) { g.strokeStyle = 'rgba(58,255,213,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 16 + Math.sin(t*14)*3, 0, TAU); g.stroke(); } }
      if (chain > 1) { g.fillStyle = '#3affd5'; g.font = '700 12px '+A.font; g.textAlign = 'left'; g.fillText('POWER CHAIN ×'+chain, 12, VIEW.y+VIEW.h-44); } }
    if (mech == 'gears') { g.save(); g.translate(GEAR.x, GEAR.y); g.rotate(t*1.6); g.fillStyle = '#b8862a'; g.beginPath(); g.arc(0,0,GEAR.r,0,TAU); g.fill(); for (let k=0;k<12;k++) { g.save(); g.rotate(k*TAU/12); g.fillRect(GEAR.r-2, -6, 10, 12); g.restore(); } g.fillStyle = '#4a3a28'; g.beginPath(); g.arc(0,0,12,0,TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, -GEAR.r+10, 6, 0, TAU); g.fill(); g.restore(); g.fillStyle = gearHit() ? 'rgba(213,243,103,.9)' : 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(GEAR.x-8, GEAR.y-GEAR.r-18); g.lineTo(GEAR.x+8, GEAR.y-GEAR.r-18); g.lineTo(GEAR.x, GEAR.y-GEAR.r-8); g.fill(); }
    if (mech == 'dragon') { const awake = wakeT > 0; g.fillStyle = '#ffb03a'; g.beginPath(); g.ellipse(GOLD.x, GOLD.y+6, 60, 22, 0, Math.PI, 0); g.fill(); for (let k=0;k<9;k++) { g.fillStyle = k%2 ? '#ffe14f' : '#c48a00'; g.beginPath(); g.arc(GOLD.x-44+k*11, GOLD.y-4-Math.sin(k)*6, 4, 0, TAU); g.fill(); }
      const dx = GOLD.x + 70, dy = GOLD.y - 14; g.fillStyle = '#7a2a1a'; g.beginPath(); g.ellipse(dx, dy, 36, 20, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(dx+30, dy-12, 16, 12, 0, 0, TAU); g.fill(); g.fillStyle = '#ffb03a'; g.beginPath(); g.moveTo(dx+24, dy-22); g.lineTo(dx+28, dy-34); g.lineTo(dx+32, dy-22); g.fill();
      if (awake) { g.fillStyle = '#FF4539'; g.beginPath(); g.arc(dx+34, dy-14, 3.5, 0, TAU); g.fill(); if (!lowFx()) { g.fillStyle = 'rgba(255,122,60,'+(.4+.3*Math.sin(t*20))+')'; g.beginPath(); g.moveTo(dx+46, dy-10); g.lineTo(dx+90, dy-26); g.lineTo(dx+90, dy+6); g.fill(); } }
      else { g.strokeStyle = '#121313'; g.lineWidth = 2; g.beginPath(); g.moveTo(dx+30, dy-14); g.lineTo(dx+38, dy-14); g.stroke(); g.fillStyle = '#9fd8ff'; g.font = '700 '+(10+Math.sin(t*2)*2)+'px '+A.font; g.textAlign = 'center'; g.fillText('z z z', dx+40, dy-34 - (t*8)%10); }
      g.fillStyle = 'rgba(0,0,0,.5)'; rrect(g, GOLD.x-50, VIEW.y+VIEW.h-50, 100, 8, 4); g.fill(); g.fillStyle = noise > 1 ? '#FF4539' : '#F9BF01'; rrect(g, GOLD.x-50, VIEW.y+VIEW.h-50, 100*Math.min(1, noise/1.4), 8, 4); g.fill(); }
    if (mech == 'glyphs') { GSTONES.forEach((s, k) => { g.fillStyle = '#8a8270'; rrect(g, s.x-18, s.y-20, 36, 36, 6); g.fill(); g.fillStyle = glyph ? '#F9BF01' : '#5a5040'; g.font = '700 20px '+A.font; g.textAlign = 'center'; g.fillText(glyph ? glyph.stones[k] : '·', s.x, s.y+6); });
      if (glyph) { g.fillStyle = 'rgba(0,0,0,.55)'; rrect(g, W/2-90, VIEW.y+44, 180, 30, 10); g.fill(); g.font = '700 16px '+A.font; g.textAlign = 'center'; glyph.order.forEach((s, k) => { g.fillStyle = k < glyph.step ? C.lime : '#fff'; g.fillText(s, W/2-40+k*40, VIEW.y+65); }); } }
    if (mech == 'pulse' && pulseOn()) { g.fillStyle = '#ffb03a'; g.font = '700 13px '+A.font; g.textAlign = 'center'; g.fillText('HOT! DIG NOW ×3', ROCK.x, ROCK.y + ROCK.r + 18); }
    if (sporeN > 0) { g.fillStyle = '#9fffb0'; g.font = '700 12px '+A.font; g.textAlign = 'left'; g.fillText('SPORE BOOST ×2 · '+sporeN+' digs', 12, VIEW.y+VIEW.h-44); }
    if (noteRun > 0) { g.fillStyle = '#ff9fe8'; g.font = '700 12px '+A.font; g.textAlign = 'left'; g.fillText('NOTES '+noteRun+'/4', 12, VIEW.y+VIEW.h-44); } };
  const drawRock = () => { const B = DEPTHS[depthIdx()].b, hot = pulseOn(), pulse = lowFx() ? 1 : 1 + Math.sin(t*2)*.02; g.save(); g.translate(ROCK.x, ROCK.y); g.scale(pulse, pulse);
    if (hot && !lowFx()) { g.fillStyle = 'rgba(255,140,40,.35)'; g.beginPath(); g.arc(0, 0, ROCK.r+18, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(4, ROCK.r*.7, ROCK.r*.9, 10, 0, 0, TAU); g.fill();
    g.fillStyle = hot ? '#8a4a2a' : '#5b5b60'; g.beginPath(); for (let k=0;k<11;k++) { const a = k/11*TAU, rr = ROCK.r*(.82 + .18*Math.sin(k*2.3 + depthIdx())); g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr*.82); } g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(-14, -16, 20, 11, -.4, 0, TAU); g.fill();
    for (let k=0;k<7;k++) { const a = k*1.1 + depthIdx(), rr = 10 + (k*11)%28; g.fillStyle = B.ore; g.beginPath(); g.moveTo(Math.cos(a)*rr, Math.sin(a)*rr*.8-5); g.lineTo(Math.cos(a)*rr+5, Math.sin(a)*rr*.8); g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr*.8+5); g.lineTo(Math.cos(a)*rr-5, Math.sin(a)*rr*.8); g.fill(); }
    const gl = lowFx() ? .8 : .55+.45*Math.sin(t*8), ccx = Math.cos(crack.a)*40*crack.r, ccy = Math.sin(crack.a)*34*crack.r; g.strokeStyle = 'rgba(255,255,255,'+gl+')'; g.lineWidth = 3; g.beginPath(); g.moveTo(ccx-8,ccy-6); g.lineTo(ccx-2,ccy-1); g.lineTo(ccx-4,ccy+4); g.lineTo(ccx+7,ccy+7); g.stroke();
    // cracks spread as the layer nears breakthrough
    const nd = DEPTHS[depthIdx()+1]; if (nd) { const f = Math.max(0, Math.min(1, (S.life - DEPTHS[depthIdx()].at)/(nd.at - DEPTHS[depthIdx()].at))); g.strokeStyle = 'rgba(20,10,4,.55)'; g.lineWidth = 2; for (let k=0;k<Math.floor(f*7);k++) { const a = k*.9; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*ROCK.r*.5, Math.sin(a)*ROCK.r*.4); g.lineTo(Math.cos(a+.3)*ROCK.r*.85, Math.sin(a+.3)*ROCK.r*.7); g.stroke(); } }
    g.restore(); };
  // one layer's scene (oy shifts it for the breakthrough animation)
  const drawScene = (i, oy, full) => { g.drawImage(sceneBg(i), 0, VIEW.y + oy, W, VIEW.h); drawLayerFx(i, oy); if (!full) return;
    const d = i, mech = DEPTHS[d].b.mech;
    // hidden chest
    if (!S.chests[d]) { const cp = chestPos(d), gl = GL()>=5 && !lowFx() ? .35+.3*Math.sin(t*4) : .12; g.fillStyle = 'rgba(249,191,1,'+gl+')'; g.beginPath(); g.arc(cp.x, cp.y, 26, 0, TAU); g.fill();
      g.fillStyle = '#8D5B1D'; rrect(g, cp.x-15, cp.y-10, 30, 21, 4); g.fill(); g.fillStyle = C.gold; g.fillRect(cp.x-15, cp.y-3, 30, 4); g.fillRect(cp.x-3, cp.y-4, 6, 8); }
    if (!core && !golem) drawRock();
    drawMech();
    // miners working on the ledge
    let k = 0; const shown = 9; for (let q=0;q<S.grid.length;q++) { const L = S.grid[q]; if (!L) continue; if (k < shown) drawMiner(g, 46 + k*24 + (mech=='dragon' ? 150 : 0)*0, LEDGE+20, L, .8, lowFx() ? 1.2 : t*6 + q); k++; }
    if (k > shown) { g.fillStyle = '#fff'; g.font = '700 11px '+A.font; g.textAlign = 'left'; g.fillText('+'+(k-shown), 46 + shown*24, LEDGE+18); }
    if (!minerCount()) { g.fillStyle = '#ffb3ab'; g.font = '700 14px '+A.font; g.textAlign = 'center'; g.fillText('No miners! Hire one below', 140, LEDGE+14); }
    // gems
    for (const gm of gems) { const gy = gm.y + Math.sin(t*3)*3, gl = .5 + .5*Math.sin(t*6), R = 22 + 1.6*GL(), col = gm.rare ? gm.rare.c : '#9fd8ff';
      g.fillStyle = gm.rare ? 'rgba(255,255,255,'+(.15+.15*gl)+')' : 'rgba(159,216,255,'+(.2+.2*gl)+')'; g.beginPath(); g.arc(gm.x, gy, R, 0, TAU); g.fill();
      if (learn) { g.fillStyle = '#6b6f80'; g.beginPath(); g.arc(gm.x, gy, 16, 0, TAU); g.fill(); g.fillStyle = '#9fd8ff'; g.beginPath(); g.arc(gm.x+3, gy-2, 10, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('+−×÷', gm.x+2, gy+4); }
      else { g.fillStyle = col; g.beginPath(); g.moveTo(gm.x, gy-15); g.lineTo(gm.x+11, gy-4); g.lineTo(gm.x, gy+13); g.lineTo(gm.x-11, gy-4); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(gm.x, gy-15); g.lineTo(gm.x+4, gy-4); g.lineTo(gm.x-11, gy-4); g.fill(); }
      if (gm.life !== undefined) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(gm.x, gy, R-3, -Math.PI/2, -Math.PI/2 + TAU*Math.max(0, gm.life/gemLife())); g.stroke(); } }
    // golden cart rolling along the ledge
    if (gcart) { const ty = LEDGE+10, gx = gcart.x; g.fillStyle = C.gold; rrect(g, gx-22, ty-16, 44, 20, 5); g.fill(); g.fillStyle = '#fff6b0'; g.beginPath(); g.ellipse(gx, ty-16, 18, 7, 0, Math.PI, 0); g.fill(); g.fillStyle = '#121313'; g.beginPath(); g.arc(gx-12, ty+5, 4, 0, TAU); g.arc(gx+12, ty+5, 4, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '700 11px '+A.font; g.textAlign = 'center'; g.fillText('TAP!', gx, ty-26); }
    // hazard
    if (hazard) { const f = hazard.fuse/hazard.max, pul = .5+.5*Math.sin(t*10); g.fillStyle = 'rgba(255,69,57,'+(.25+.25*pul)+')'; g.beginPath(); g.arc(hazard.x, hazard.y, 26, 0, TAU); g.fill(); g.fillStyle = '#FF4539'; g.beginPath(); g.moveTo(hazard.x, hazard.y-16); g.lineTo(hazard.x+15, hazard.y+11); g.lineTo(hazard.x-15, hazard.y+11); g.fill(); g.fillStyle = '#fff'; g.font = '700 16px '+A.font; g.textAlign = 'center'; g.fillText('!', hazard.x, hazard.y+8);
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(hazard.x, hazard.y, 30, -Math.PI/2, -Math.PI/2 + TAU*f); g.stroke(); g.font = '700 11px '+A.font; g.fillText(hazard.n.toUpperCase(), hazard.x, hazard.y-36); }
    // bosses at the dig face
    if (golem) { const sh = golem.hit ? (Math.random()-.5)*6 : 0, bob = Math.sin(t*3)*3; g.save(); g.translate(ROCK.x + sh, ROCK.y + bob); g.scale(.85, .85);
      g.fillStyle = '#5f6b68'; g.beginPath(); g.ellipse(0, 6, 58, 50, 0, 0, TAU); g.fill(); g.fillStyle = '#7d8a86'; g.beginPath(); g.ellipse(-8, -6, 40, 32, 0, 0, TAU); g.fill();
      g.fillStyle = '#4a5452'; g.beginPath(); g.ellipse(-62, 16, 18, 26, -.4, 0, TAU); g.ellipse(62, 16, 18, 26, .4, 0, TAU); g.fill();
      g.fillStyle = golem.hit ? '#ffffff' : '#FF8A3C'; g.beginPath(); g.arc(-16, -6, 7, 0, TAU); g.arc(16, -6, 7, 0, TAU); g.fill(); g.strokeStyle = '#2a302f'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, 18); g.lineTo(14, 18); g.stroke(); g.restore(); }
    if (core) { const pul = Math.sin(t*5), R = 62 + pul*4; g.save(); g.translate(ROCK.x - 20 + (core.hit ? (Math.random()-.5)*8 : 0), ROCK.y);
      if (!lowFx()) { for (let q=3;q>0;q--) { g.fillStyle = 'rgba(255,'+(40+q*30)+',20,'+(.08*q)+')'; g.beginPath(); g.arc(0,0,R+q*18,0,TAU); g.fill(); } }
      g.fillStyle = '#120000'; g.beginPath(); g.arc(0,0,R,0,TAU); g.fill(); const gr = g.createRadialGradient(0,0,4,0,0,R*.85); gr.addColorStop(0, core.hit ? '#ffffff' : '#ffe14f'); gr.addColorStop(.4,'#ff3a1a'); gr.addColorStop(1,'#3a0000'); g.fillStyle = gr; g.beginPath(); g.arc(0,0,R*.85,0,TAU); g.fill();
      g.strokeStyle = 'rgba(255,200,80,.7)'; g.lineWidth = 3; for (let q=0;q<3;q++) { g.save(); g.rotate(t*(.6+q*.3)*(q%2?-1:1)); g.beginPath(); g.ellipse(0,0,R+14+q*10,(R+14+q*10)*.35,0,0,TAU); g.stroke(); g.fillStyle = '#ffe14f'; g.beginPath(); g.arc(R+14+q*10,0,5,0,TAU); g.fill(); g.restore(); }
      g.fillStyle = '#120000'; g.beginPath(); g.ellipse(-20,-10,10,6,0,0,TAU); g.ellipse(20,-10,10,6,0,0,TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-20,-10,3,0,TAU); g.arc(20,-10,3,0,TAU); g.fill(); g.restore();
      for (const m of (core.meteors||[])) { g.fillStyle = '#ff9f3a'; g.beginPath(); g.arc(m.x, m.y, 14, 0, TAU); g.fill(); g.fillStyle = '#3a0000'; g.beginPath(); g.arc(m.x-3, m.y-3, 6, 0, TAU); g.fill(); if (!lowFx()) { g.fillStyle = 'rgba(255,159,58,.35)'; g.beginPath(); g.moveTo(m.x-10, m.y-8); g.lineTo(m.x-30, m.y-40); g.lineTo(m.x+6, m.y-14); g.fill(); } } }
    // the Void: it's dark — only your lamp lights the way
    if (mech == 'dark' && !lowFx()) { const gr = g.createRadialGradient(lamp.x, lamp.y, 20, lamp.x, lamp.y, 110); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.93)'); g.fillStyle = gr; g.fillRect(0, VIEW.y + oy, W, VIEW.h); }
    if (core && !lowFx()) { g.fillStyle = 'rgba(255,40,10,'+(.05+.05*Math.sin(t*3))+')'; g.fillRect(0, VIEW.y, W, VIEW.h); } };
  // Dot the Mole
  const drawMole = (x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#6b4a3a'; g.beginPath(); g.arc(0, 4, 20, 0, TAU); g.fill(); g.fillStyle = '#ffb3c8'; g.beginPath(); g.arc(0, 10, 6, 0, TAU); g.fill();
    g.fillStyle = '#121313'; g.beginPath(); g.arc(-7, 0, 2.4, 0, TAU); g.arc(7, 0, 2.4, 0, TAU); g.fill(); g.fillStyle = '#e8d0c0'; g.beginPath(); g.ellipse(-12, 18, 6, 4, 0, 0, TAU); g.ellipse(12, 18, 6, 4, 0, 0, TAU); g.fill();
    g.fillStyle = C.gold; g.beginPath(); g.arc(0, -8, 17, Math.PI, 0); g.fill(); g.fillRect(-20, -9, 40, 4); g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(0, -16, 4, 0, TAU); g.fill(); g.restore(); };
  const wrapText = (txt, x, y, mw, lh) => { const words = txt.split(' '); let line = '', yy = y; for (const wd of words) { const test = line ? line+' '+wd : wd; if (g.measureText(test).width > mw && line) { g.fillText(line, x, yy); line = wd; yy += lh; } else line = test; } if (line) g.fillText(line, x, yy); };
  const drawDialogue = () => { if (!dlg) return; const bx = 8, by = VIEW.y + VIEW.h - 92, bw = W - 16, bh = 84;
    g.fillStyle = 'rgba(20,14,8,.94)'; rrect(g, bx, by, bw, bh, 14); g.fill(); g.strokeStyle = C.gold; g.lineWidth = 2; rrect(g, bx, by, bw, bh, 14); g.stroke();
    drawMole(bx + 36, by + 42 + (lowFx() ? 0 : Math.sin(t*6)*1.5), 1); g.fillStyle = C.gold; g.font = '700 11px '+A.font; g.textAlign = 'left'; g.fillText('DOT THE MOLE', bx + 66, by + 18);
    g.fillStyle = '#fff'; g.font = '600 13px '+A.font; wrapText(dlg.txt.slice(0, Math.floor(dlg.shown)), bx + 66, by + 36, bw - 80, 17);
    if (dlg.shown >= dlg.txt.length) { g.fillStyle = 'rgba(213,243,103,'+(.5+.5*Math.sin(t*6))+')'; g.font = '700 11px '+A.font; g.textAlign = 'right'; g.fillText((dlgQ.length ? 'tap ▸' : 'tap ✓'), bx + bw - 10, by + bh - 8); } };
  // the breakthrough: cracks → the floor gives way → the new layer slides up → title card
  const drawTransition = () => { const k = trans.t / trans.dur, from = trans.from, to = trans.to, B = DEPTHS[to].b;
    g.save(); g.beginPath(); g.rect(0, VIEW.y, W, VIEW.h); g.clip();
    if (trans.t < .7) { drawScene(from, 0, false); const f = trans.t/.7; g.strokeStyle = 'rgba(255,255,255,'+(.4+f*.5)+')'; g.lineWidth = 2 + f*2; for (let q=0;q<10;q++) { const a = q*.63; g.beginPath(); g.moveTo(ROCK.x, ROCK.y); g.lineTo(ROCK.x + Math.cos(a)*f*260, ROCK.y + Math.sin(a)*f*180); g.stroke(); } if (!lowFx()) { g.fillStyle = 'rgba(255,255,255,'+f*.3+')'; g.fillRect(0, VIEW.y, W, VIEW.h); } }
    else if (trans.t < 1.6) { const f = (trans.t - .7)/.9, e = f*f*(3-2*f), oy = -e*(VIEW.h+60); drawScene(from, oy, false);
      g.fillStyle = '#2a1a0e'; g.fillRect(0, VIEW.y + oy + VIEW.h, W, 60); g.fillStyle = 'rgba(0,0,0,.3)'; for (let q=0;q<5;q++) g.fillRect(0, VIEW.y + oy + VIEW.h + q*12, W, 4);
      drawScene(to, oy + VIEW.h + 60, false); if (!lowFx()) for (let q=0;q<14;q++) { g.fillStyle = q%2 ? '#8a6a44' : B.ore; g.fillRect((q*37 + t*90) % W, VIEW.y + ((q*53 + trans.t*400) % VIEW.h), 4, 4); } }
    else { drawScene(to, 0, false); const f = Math.min(1, (trans.t - 1.6)/.35), s = .6 + .4*f*(2 - f); g.globalAlpha = Math.min(1, (trans.dur - trans.t)/.4, 1);
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, VIEW.y, W, VIEW.h); g.save(); g.translate(W/2, VIEW.y + VIEW.h/2); g.scale(s, s); g.textAlign = 'center';
      g.font = '700 40px '+A.font; g.fillText(B.e, 0, -40); g.fillStyle = B.ore; g.font = '700 14px '+A.font; g.fillText('LAYER '+(to+1)+' OF '+(LAST+1)+(trans.n > 1 ? ' · +'+trans.n+' LAYERS' : ''), 0, -8);
      g.fillStyle = '#fff'; g.font = '700 26px '+A.font; g.fillText(DEPTHS[to].n.toUpperCase(), 0, 22); const tr = traitOf(to); g.fillStyle = C.lime; g.font = '600 13px '+A.font; g.fillText(tr ? 'Twist: '+tr.n+' · '+tr.d : B.n, 0, 44); g.restore(); g.globalAlpha = 1; }
    g.restore(); };
  const draw = () => { const D = DEPTHS[depthIdx()], r = rate(), d = depthIdx();
    g.fillStyle = '#1b130c'; g.fillRect(0,0,w,h);
    g.save(); if (shake > 0 && !lowFx()) g.translate((Math.random()-.5)*8*shake/.15, (Math.random()-.5)*6*shake/.15);
    g.save(); g.beginPath(); g.rect(0, VIEW.y, W, VIEW.h); g.clip();
    if (trans) drawTransition(); else drawScene(d, 0, true);
    if (trouble > 0) { g.fillStyle = 'rgba(255,69,57,.12)'; g.fillRect(0, VIEW.y, W, VIEW.h); g.fillStyle = '#ffb3ab'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText('HAZARD! Miners digging at half speed · '+Math.ceil(trouble)+'s', W/2, VIEW.y+VIEW.h-46); }
    if (!trans) { for (const b of BTN) { g.fillStyle = 'rgba(0,0,0,.6)'; rrect(g, b.x, b.y, b.w, b.h, 8); g.fill(); g.fillStyle = '#fff'; g.font = '700 15px '+A.font; g.textAlign = 'center'; g.fillText(b.t, b.x+b.w/2, b.y+20); }
      if (combo > 2) { g.fillStyle = C.lime; g.font = '700 14px '+A.font; g.textAlign = 'left'; g.fillText('COMBO '+combo+' · ×'+comboMult().toFixed(2)+(comboMult()>=3?' MAX':''), 12, VIEW.y+VIEW.h-62); }
      if (rushT > 0) { g.fillStyle = 'rgba(249,191,1,.9)'; rrect(g, 10, VIEW.y+8, 150, 24, 12); g.fill(); g.fillStyle = '#121313'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText('GOLD RUSH ×3 · '+Math.ceil(rushT)+'s', 85, VIEW.y+24); }
      const boss = core || golem; if (boss) { const bw = 280, bx = (W-bw)/2 - 40, by = VIEW.y + 40; g.fillStyle = 'rgba(0,0,0,.75)'; rrect(g, bx-8, by, bw+16, 34, 10); g.fill();
        g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'center'; g.fillText(core ? 'THE ARMAGEDDON CORE · PHASE '+core.phase : 'CAVE GOLEM · '+Math.ceil(golem.t)+'s', bx+bw/2, by+14);
        g.fillStyle = '#3a1010'; g.fillRect(bx, by+19, bw, 9); g.fillStyle = core ? '#ff3a1a' : C.red; g.fillRect(bx, by+19, bw*Math.max(0, boss.hp/boss.max), 9); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(bx, by+19, bw, 9); }
      drawDialogue(); }
    g.restore(); g.restore();
    // ----- HUD: ore, rate, and the big bar to the next layer -----
    g.fillStyle = '#2a1d12'; g.fillRect(0, 0, w, HUD);
    g.textAlign = 'left'; g.fillStyle = C.gold; g.font = '700 24px '+A.font; g.fillText('⛏ '+fmt(S.ore), 12, 28);
    g.fillStyle = '#cfc6a8'; g.font = '600 11px '+A.font; g.fillText((Date.now()-(A.lastAct||0)<15000 ? '+'+fmt(r)+' ore/s' : 'Miners resting · tap to dig')+(d?' · +'+d*20+'% depth':''), 13, 46);
    g.fillText('💎 '+fmt(S.gemBank||0)+(U('auto') ? ' · Foreman '+sec(foreInt(U('auto'))) : ''), 13, 58);
    const nd = DEPTHS[d+1], mx = 200, mw = 266; g.fillStyle = '#fff'; g.font = '700 12px '+A.font; g.textAlign = 'right'; g.fillText(D.b.e+' LAYER '+(d+1)+'/'+(LAST+1)+' · '+D.n.toUpperCase(), w-12, 16, mw);
    g.fillStyle = 'rgba(255,255,255,.12)'; rrect(g, mx, 24, mw, 14, 7); g.fill();
    if (nd) { const f = Math.max(0, Math.min(1, (S.life-D.at)/(nd.at-D.at))); const gr = g.createLinearGradient(mx, 0, mx+mw, 0); gr.addColorStop(0, D.b.ore); gr.addColorStop(1, nd.b.ore); g.fillStyle = gr; rrect(g, mx, 24, Math.max(10, mw*f), 14, 7); g.fill();
      g.fillStyle = '#121313'; g.font = '700 10px '+A.font; g.textAlign = 'center'; g.fillText(Math.floor(f*100)+'% to '+nd.n, mx+mw/2, 35, mw-10); }
    else { g.fillStyle = S.core300 ? C.lime : '#ff3a1a'; rrect(g, mx, 24, mw, 14, 7); g.fill(); g.fillStyle = '#121313'; g.font = '700 10px '+A.font; g.textAlign = 'center'; g.fillText(S.core300 ? 'ALL 300 LAYERS CLEARED!' : 'FINAL LAYER · CALM THE CORE', mx+mw/2, 35); }
    const tr = trait(); g.fillStyle = '#cfc6a8'; g.font = '600 10px '+A.font; g.textAlign = 'right'; g.fillText((tr ? '✦ '+tr.n+' · ' : '')+D.b.n, w-12, 52, mw);
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(mx, 56, mw, 3); g.fillStyle = C.lime; g.fillRect(mx, 56, mw*(d+1)/(LAST+1), 3);
    // ----- miner grid -----
    g.fillStyle = '#140e08'; g.fillRect(0, GY-8, w, h-GY+8);
    const sc = CH/70, small = CW < 90;
    for (let i=0;i<S.grid.length;i++) { const p = cell(i), L = S.grid[i], dragging = drag && drag.moved && drag.i===i;
      g.fillStyle = L ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.03)'; rrect(g, p.x, p.y, CW, CH, 10); g.fill();
      const canDrop = (drag && drag.moved && drag.i!==i && S.grid[drag.i]===L && L && L<MAXL) || (sel>=0 && sel!==i && S.grid[sel]===L && L && L<MAXL);
      g.lineWidth = canDrop ? 3 : sel===i ? 3 : 1.5; g.strokeStyle = canDrop ? C.lime : sel===i ? '#fff' : L ? LV[L].c : 'rgba(255,255,255,.08)'; g.globalAlpha = L && !canDrop && sel!==i ? .45 : 1; rrect(g, p.x, p.y, CW, CH, 12); g.stroke(); g.globalAlpha = 1;
      if (!L) { g.fillStyle = 'rgba(255,255,255,.12)'; g.font = '700 22px '+A.font; g.textAlign = 'center'; g.fillText('+', p.x+CW/2, p.y+CH/2+8); continue; }
      if (dragging) continue;
      const tx = small ? p.x+CW*.56 : p.x+62; drawMiner(g, small ? p.x+CW*.3 : p.x+34, p.y+CH/2+6*sc, L, 1.05*sc, lowFx() ? 1.2 : t*6 + i);
      g.textAlign = 'left'; g.fillStyle = LV[L].c; g.font = '700 '+(small?16:18)+'px '+A.font; g.fillText(L, tx, p.y+26*sc);
      g.fillStyle = '#cfc6a8'; g.font = '600 '+(small?9:10)+'px '+A.font; g.fillText(fmt(lvRate(L)*mult())+'/s', tx, p.y+43*sc);
      if (canDrop) { g.fillStyle = C.lime; g.font = '700 10px '+A.font; g.fillText('MERGE', tx, p.y+56*sc); } }
    if (drag && drag.moved) { const L = S.grid[drag.i]; if (L) { g.globalAlpha = .9; drawMiner(g, drag.x, drag.y, L, 1.3, t*10); g.globalAlpha = 1; } }
    g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.4)'; g.font = '600 11px '+A.font; g.fillText('Tap the mine to dig and grab things · drag matching miners together to merge', w/2, h-8);
    // ----- particles / floats / message -----
    for (const p of parts) { g.globalAlpha = Math.max(0, Math.min(1, p.t*2)); g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill(); } g.globalAlpha = 1;
    for (const f of floats) { g.globalAlpha = Math.max(0, f.t); g.fillStyle = f.col; g.font = '700 15px '+A.font; g.textAlign = 'center'; g.fillText(f.txt, f.x, f.y); } g.globalAlpha = 1;
    if (msg && !dlg && !trans) { g.globalAlpha = Math.min(1, msg.t*2); g.fillStyle = 'rgba(20,14,8,.92)'; rrect(g, 24, VIEW.y+76, w-48, msg.sub?54:36, 14); g.fill(); g.textAlign = 'center';
      g.fillStyle = msg.col; g.font = '700 15px '+A.font; g.fillText(msg.txt, w/2, VIEW.y+99, w-70); if (msg.sub) { g.fillStyle = '#EDE9D8'; g.font = '500 12px '+A.font; g.fillText(msg.sub, w/2, VIEW.y+119, w-70); } g.globalAlpha = 1; } };

  // ---------- loop ----------
  let barT = 0, scT = 0, drawErr = 0;
  const resetMech = () => { objs = []; glyph = null; glyphT = 6; chimeN = 0; chain = 0; noteRun = 0; wakeT = 0; noise = 0; sporeN = 0; evT = 2; hazard = null; gems = []; gemT = 4; };
  const arrive = (from, to) => { const B = DEPTHS[to].b; if (DEPTHS[from].b !== B) story(B.id, STORY[B.id]); [50,100,150,200,250].forEach(m => { if (from+1 < m && to+1 >= m) story('m'+m, STORY['m'+m]); }); };
  const offL = A.loop(dt => { t += dt; const r = rate(); const active = Date.now() - (A.lastAct||0) < 15000; if (active && (!busy || shop || mapO)) give(r*dt);
    shake = Math.max(0, shake-dt); comboT -= dt; if (comboT <= 0) combo = 0; trouble = Math.max(0, trouble - dt); if (sellArm > 0) { sellArm -= dt; if (sellArm <= 0) paintBar(); }
    rushT = Math.max(0, rushT - dt);
    const d = depthIdx();
    // breaking through to a new layer: the floor gives way and the next layer slides in
    if (d > lastDepth && !trans) { trans = {from:lastDepth, to:d, t:0, dur:lowFx() ? 1.9 : 2.7, n:d-lastDepth}; breakBonus(d - lastDepth); lastDepth = d; resetMech(); golem = null; A.sfx('win'); A.tone(70,.6,'sawtooth',.05); stat(api,'mineDepth',d+1); shake = .3; }
    else if (d < lastDepth) lastDepth = d;
    if (trans) { trans.t += dt; if (trans.t >= trans.dur) { const tr = trans; trans = null; arrive(tr.from, tr.to); } }
    if (dlg) dlg.shown = Math.min(dlg.txt.length, dlg.shown + dt*45);
    // Armageddon Core: the final boss waits on the last layer until it's calmed
    if (d == LAST && !S.core300 && !core && !learn && !trans && !dlg) { const hp = Math.max(1e6, tapAmt()*(1+.1*U('pick'))*900 + r*120); core = {hp, max:hp, hit:0, phase:1, idle:0, meteorT:4, meteors:[]}; golem = null; say('THE ARMAGEDDON CORE AWAKENS!', 'Tap the core to calm it · tap falling meteors before they land', '#ff9f3a'); A.tone(55,1.2,'sawtooth',.08); }
    if (core) { core.hit = Math.max(0, core.hit - dt); core.idle += dt; core.phase = core.hp < core.max*.33 ? 3 : core.hp < core.max*.66 ? 2 : 1;
      if (core.idle > 3) core.hp = Math.min(core.max, core.hp + core.max*.004*dt);   // slowly recovers if you stop tapping
      core.meteorT -= dt; if (core.meteorT <= 0) { core.meteorT = [0, 4, 2.8, 1.8][core.phase]; for (let q=0;q<core.phase;q++) core.meteors.push({x: 40 + Math.random()*(W-120), y: VIEW.y + 10, vy: 30 + Math.random()*20}); if (!lowFx()) A.tone(90,.3,'sawtooth',.04); }
      for (const m of core.meteors) { m.y += m.vy*dt; if (m.y > LEDGE) { m.dead = 1; trouble = Math.max(trouble, 4); shake = .25; } } core.meteors = core.meteors.filter(m => !m.dead);
      if (Math.random() < dt*.4 && !lowFx()) A.tone(45 + Math.random()*20, .4, 'sawtooth', .03); }
    if (golem) { golem.t -= dt; golem.hit = Math.max(0, (golem.hit||0) - dt); if (golem.t <= 0) { say('THE GOLEM WANDERED OFF', 'Tap faster next time — it comes back later', '#cfc6a8'); golem = null; golemT = 120 + Math.random()*60; } }
    else if (!core && active && !busy && !learn && !trans && !dlg) { golemT -= dt; if (golemT <= 0) { const hp = Math.max(60, tapAmt()*(1+.1*U('pick'))*55); golem = {hp, max:hp, t:25, hit:0}; say('A CAVE GOLEM APPEARS!', 'Tap it fast — beat it in 25 seconds for a big ore haul', '#ffb3ab'); A.sfx('bad'); } }
    if (hazard) { hazard.fuse -= dt; if (hazard.fuse <= 0) { trouble = 10; say(hazard.n.toUpperCase()+' WENT OFF!', 'Miners dig at half speed for 10 seconds', '#ffb3ab'); A.sfx('bad'); shake = .3; hazard = null; hazardT = 70 + Math.random()*60; } }
    else if (active && !busy && !learn && d >= 2 && !trans && !hasT('calm')) { hazardT -= dt; if (hazardT <= 0) spawnHazard(); }
    gcartT -= dt*(hasT('fever') ? 2.5 : 1); if (!gcart && gcartT <= 0 && !trans) { gcart = {x:-40}; gcartT = 40 + Math.random()*40; A.tone(880,.1,'triangle',.05); } if (gcart) { gcart.x += 140*dt; if (gcart.x > W+40) gcart = null; }
    // this biome's special event
    if (!trans && !core && !golem && !busy) { const MM = mechOf(), mech = DEPTHS[d].b.mech;
      evT -= dt*(hasT('busy') ? 2 : 1); if (evT <= 0) { evT = MM.every*(.7 + Math.random()*.6); if (active && objs.length < MM.max) objs.push(MM.spawn()); }
      let k = 0; for (const o of objs) { o.t = (o.t||0) + dt; let keep = true; if (o.life !== undefined) { o.life -= dt; if (o.life <= 0) { keep = false; if (MM.miss) MM.miss(o); } } if (keep && MM.up) keep = MM.up(o, dt); if (keep) objs[k++] = o; } objs.length = k;
      if (mech == 'glyphs' && !glyph) { glyphT -= dt; if (glyphT <= 0) { newGlyph(); A.tone(660,.2,'sine',.05); } }
      if (mech == 'dragon') { wakeT = Math.max(0, wakeT - dt); noise = Math.max(0, noise - dt*.25); } }
    if (noteRun > 0) { noteT -= dt; if (noteT <= 0) noteRun = 0; }
    let n = 0; for (const p of parts) { p.t -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 420*dt; if (p.t > 0) parts[n++] = p; } parts.length = n;
    n = 0; for (const f of floats) { f.t -= dt*.9; f.y -= 40*dt; if (f.t > 0) floats[n++] = f; } floats.length = n;
    if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
    if (!busy && !trans) { if (!gems.length) { gemT -= dt*(hasT('gemmy') ? 2 : 1); if (gemT <= 0) { spawnGem(); if (GL()>=12 && Math.random()<.3) spawnGem(); } } }
    for (const gm of gems) if (gm.life !== undefined) gm.life -= dt; if (gems.some(gm => gm.life !== undefined && gm.life <= 0)) { gems = gems.filter(gm => !(gm.life !== undefined && gm.life <= 0)); if (!gems.length) gemT = gemGap(); }
    if (GL() >= 20 && !learn) { stormT -= dt; if (stormT <= 0) { stormT = 180; for (let q=0;q<6;q++) spawnGem(); say('GEM STORM!', 'Six gems just appeared — grab them!', '#9fd8ff'); } }
    // Foreman: merges in batches so even one merge every 0.1 s stays smooth
    const FL = U('auto'); if (FL && !busy) { const iv = foreInt(FL); autoAcc += dt; let m = 0; const quiet = iv < .5; while (autoAcc >= iv && m < 20) { autoAcc -= iv; if (!autoMerge(quiet)) { autoAcc = Math.min(autoAcc, iv); break; } for (let x=0;x<U('fcrew');x++) if (!autoMerge(true)) break; m++; } if (m) paintBar(); if (autoAcc > iv*20) autoAcc = 0; }
    // Foreman perks
    if (U('auto') && !busy && !trans) { foT -= dt; const FL2 = U('auto');
      if (U('fcrew') && FL2) { /* extra merges ride along with the foreman timer */ }
      if (U('fdig')) { digAcc += dt*U('fdig'); if (digAcc >= 1) { const k = Math.floor(digAcc); digAcc -= k; if (!core && !golem) give(tapAmt()*.5*k); } }
      if (foOn('fgem')) for (const gm of gems.slice()) { gm.fg = (gm.fg||0) + dt; if (gm.fg > 2) takeGem(gm); }
      if (foT <= 0) { foT = .5; let ch = false;
        if (foOn('fsell')) { const hl = hireLv(); for (let i=0;i<S.grid.length;i++) { const L = S.grid[i]; if (L && L < hl && minerCount() > 1 && !(drag && drag.i === i)) { const v = fin(sellVal(L)); S.grid[i] = 0; S.ore = fin(S.ore + v); ch = true; } } if (ch && sel >= 0 && !S.grid[sel]) sel = -1; }
        if (foOn('fhire')) { let k = 0; while (k < 50 && S.grid.indexOf(0) >= 0 && S.ore >= hireCost()) { const i = S.grid.indexOf(0); S.ore -= hireCost(); S.hires++; S.grid[i] = hireLv(); k++; ch = true; } }
        if (foOn('ftidy') && !drag && sel < 0) { const sorted = S.grid.slice().sort((a,b) => b-a); if (sorted.some((v,i) => v !== S.grid[i])) { sorted.forEach((v,i) => { S.grid[i] = v; }); ch = true; } }
        if (ch) paintBar(); } }
    barT -= dt; if (barT <= 0) { barT = .4; paintBar(); } scT -= dt; if (scT <= 0) { scT = 1; api.score(Math.floor(S.ore)); }
    saveT -= dt; if (saveT <= 0) { saveT = 10; persist(); }
    try { draw(); } catch(e) { if (!drawErr) { drawErr = 1; console.error('Mines draw error', e); } } });

  // ---------- Night Shift: away from the arcade, miners keep digging at half speed (2 h + 2 h per Night Shift level) ----------
  const away = Math.max(0, (Date.now() - (S.last||Date.now()))/1000), cap = (2 + 2*U('night'))*3600, secs = Math.min(away, cap), earned = rate()*secs*(GL2('owl') ? .75 : .5);
  if (api.stored && secs > 60 && earned >= 1) { give(earned); lastDepth = depthIdx(); const hh = Math.floor(secs/3600), mm = Math.floor(secs%3600/60);
    say('WHILE YOU WERE AWAY: +'+fmt(earned)+' ORE', 'Your miners dug for '+(hh?hh+'h ':'')+mm+'m'+(away>cap?' (Night Shift raises the limit)':''), C.gold); A.sfx('win'); }
  else if (!api.stored) say('WELCOME TO THE MINES', learn ? 'Crack math geodes for big ore · merge matching miners' : 'Tap the rock to dig · merge matching miners', C.lime);
  if (!minerCount()) setTimeout(() => say('NO MINERS LEFT', 'Hire one with ore — or open Upgrades and use the code MINERRESCUE', '#ffb3ab'), 2600);
  story('intro', STORY.intro); { const B = DEPTHS[depthIdx()].b; if (B.id != 'soil') story(B.id, STORY[B.id]); }
  stat(api,'minerLevel',S.best||1); stat(api,'mineDepth',depthIdx()+1);
  paintBar(); persist();
  A._mines = {openGemTree: () => openGemTree(), get: () => ({gemBank:S.gemBank, gtree:{...S.gtree}, slots:S.grid.length, H, ore:S.ore, life:S.life, grid:S.grid.slice(), up:{...S.up}, codes:{...(S.codes||{})}, depth:depthIdx(), layers:DEPTHS.length, last:DEPTHS[LAST].n, core:core?{hp:core.hp,max:core.max}:null, coreCleared:!!S.core300, foreInt:foreInt(U('auto')), merges:quietMerges,
      trans:trans?{...trans}:null, dlg:dlg?dlg.txt:null, dlgQ:dlgQ.length, mech:DEPTHS[depthIdx()].b.mech, biome:DEPTHS[depthIdx()].b.id, trait:trait()?trait().k:null, objs:objs.length, story:{...(S.story||{})}}),
    set: p => { Object.assign(S, p); if (p.up) S.up = {...S.up, ...p.up}; paintBar(); }, cashOut, sellMiner, tapRock: () => tapRock(ROCK.x, ROCK.y), hurtCore: n => { if (core) { core.hp = n; core.idle = 0; } },
    skipDlg: () => { dlgQ.length = 0; dlg = null; }, spawnMech: () => { const o = mechOf().spawn && mechOf().max ? mechOf().spawn() : null; if (o) objs.push(o); return o; }, tapAt: (x, y) => viewTap({x, y}), ROCK, VIEW, foreInt, GEM, DEPTHS, BIOMES, TRAITS};
  return () => { persist(); offK(); offL(); window.removeEventListener('keyup', ku); if (shop) shop.remove(); if (mapO) mapO.remove(); if (gemO) gemO.remove(); A._mines = null; };
}});
})();
