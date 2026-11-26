// Wilderland Arcade · Snow Kingdom · RAID SEASON (snow-raids.js)
// 10 raids (5–8 floors each), the War Table hub, Normal / Heroic / Mythic / Nightmare, weekly modifiers, raid keys,
// raid bosses that are puzzles you learn (clear tells, counters, weak points, stagger, phases that change the rules),
// raid sets, relics, Raid Tokens + the Quartermaster, weekly lockouts, trophies, achievements, titles and leaderboards.
// It plugs into the Snow Kingdom by wrapping the saga's hook object (A.snowRaids(S, SG) returns the new hooks).
// Saves live in W.rs (inside the Snowball save). NOTHING resets: old raid clears carry over.
(function(){
'use strict';
const A = window.Arcade = window.Arcade || {}, TAU = Math.PI*2;
const FW = 34, FH = 24;   // one raid floor = 34 × 24 tiles
const DIFF = [{n:'Normal', c:'#7fe08a', hp:1, dmg:1, tel:1, loot:1, enr:300}, {n:'Heroic', c:'#64CDF5', hp:1.55, dmg:1.25, tel:.95, loot:1.6, enr:280, add:'adds'},
  {n:'Mythic', c:'#ff6ad5', hp:2.3, dmg:1.5, tel:.85, loot:2.4, enr:260, add:'spread'}, {n:'Nightmare', c:'#ff4539', hp:3.2, dmg:1.8, tel:.75, loot:3.5, enr:240, add:'echo'}];
const MODS = [{id:'treasure', n:'Treasure Week', d:'double raid loot', loot:1}, {id:'speedy', n:'Speedy Snowballs', d:'enemy snowballs fly faster', shot:1.35},
  {id:'blizzard', n:'Blizzard', d:'low visibility', blizz:1}, {id:'explosive', n:'Explosive', d:'enemies burst when defeated (step away!)', boom:1},
  {id:'bolster', n:'Bolstering', d:'enemies get stronger when allies fall', bolster:1}, {id:'frozen', n:'Frozen Floor', d:'slippery floors', ice:1},
  {id:'glass', n:'Glass Snowballs', d:'double damage dealt AND taken', glass:1, dmg:2}, {id:'hungry', n:'Mau Mau’s Hungry', d:'feeding Mau Mau (G) gives a huge buff', hungry:1},
  {id:'swarm', n:'Swarming Minions', d:'bosses call twice as many helpers', swarm:1}];
const weekNo = () => Math.floor((Date.now() + 4*864e5) / (7*864e5)), weekMods = () => { const w = weekNo(); return [MODS[w % MODS.length], MODS[(w*5 + 2) % MODS.length]].filter((m, i, a) => a.indexOf(m) == i); };
// floor codes: c clear · r runes · b braziers · l bells · k keys · g gauntlet · m maze · G guardian · B boss
const RAIDS = [
  {id:'library', n:'Loki’s Sunken Library', e:'📚', th:'library', fl:'crgGbB', gs:100, pool:['r_book', 'r_ink', 'r_book'], trap:'ink', set:'Librarian’s Set', setD:'interrupts also heal you 1 ♥', relic:{n:'Librarian’s Quill', d:'interrupts refill your ability'},
    names:['The Flooded Stacks', 'The Rune Archive', 'The Ink Falls', 'The Reading Hall', 'The Candle Gallery', 'Loki’s Study'], need:W => !!W.bau, ul:'Rescue Lord Emperor Bau Bau'},
  {id:'catacombs', n:'The Frozen Catacombs', e:'⚰️', th:'catacombs', fl:'ckgGB', gs:120, pool:['r_skel', 'r_arch', 'r_skel'], trap:'icicle', set:'Warden’s Set', setD:'+2 stagger with every hit', relic:{n:'Crypt Lantern', d:'+50% stagger from charged snowballs'},
    names:['The Bone Stair', 'The Sealed Vaults', 'The Icicle Hall', 'The Knight’s Rest', 'The Warden’s Crypt']},
  {id:'labyrinth', n:'The Spirit Labyrinth', e:'🌀', th:'labyrinth', fl:'mcmGlB', gs:150, pool:['r_spirit', 'wisp', 'r_spirit'], trap:'spirit', set:'Pathfinder’s Set', setD:'warnings last 20% longer for you', relic:{n:'Mind Prism', d:'+30% damage while the boss is staggered'},
    names:['The Shifting Halls', 'The Lantern Court', 'The Deep Maze', 'The Lost Lantern', 'The Bell Garden', 'The Mind’s Eye'], need:W => (W.sp|0) >= 2, ul:'Reach Spirits of the Snow chapter 2'},
  {id:'citadel', n:'Storm Peak Citadel', e:'🌩️', th:'citadel', fl:'cgbGgB', gs:180, pool:['r_simp', 'r_cloud', 'stormling'], trap:'lightning', set:'Stormcaller Set', setD:'every 6th hit calls down lightning', relic:{n:'Stormcaller’s Mitten', d:'every 5th hit chains lightning'},
    names:['The Wind Gate', 'The Thunder Bridge', 'The Rod Gallery', 'The Sentinel’s Post', 'The Storm Stairs', 'The Eyrie'], need:W => (W.sp|0) >= 5, ul:'Reach Spirits of the Snow chapter 5'},
  {id:'vault', n:'The Yeti King’s Vault', e:'🏔', th:'vault', fl:'ckrGgB', gs:210, pool:['r_gimp', 'r_mimic', 'r_gimp'], trap:'boulder', set:'Golden King Set', setD:'+50% Raid Tokens', relic:{n:'Midas Snowball', d:'+25% Raid Tokens from every clear'},
    names:['The Counting Room', 'The Trapped Treasury', 'The Rune Lock', 'The Golem’s Hoard', 'The Rolling Gold', 'The Throne of Gold'], need:W => !!(W.down && W.down.yeti), ul:'Beat the Yeti King'},
  {id:'kitchen', n:'Mau Mau’s Nightmare Kitchen', e:'🍖', th:'kitchen', fl:'cgbGkB', gs:240, pool:['r_meat', 'r_jelly', 'r_cup'], trap:'jelly', set:'Royal Guard Set', setD:'Mau Mau tanks with +6 health', relic:{n:'Meatloaf Launcher', d:'every 8th hit heals you 1 ♥'},
    names:['The Pantry', 'The Jelly Floor', 'The Oven Row', 'The Cake That Fights Back', 'The Ingredient Hunt', 'The Dinner Table'], need:W => !!W.mau, ul:'Free Royal Guard Mau Mau'},
  {id:'temple', n:'The Sunken Ice Temple', e:'🌊', th:'temple', fl:'ckrgGbB', gs:280, pool:['r_fish', 'r_crab', 'r_fish'], trap:'current', set:'Tidecaller Set', setD:'water never slows you', relic:{n:'Leviathan Fang', d:'+30% damage in weak-point windows'},
    names:['The Flooded Steps', 'The Bubble Vaults', 'The Tide Runes', 'The Current Hall', 'The Coral Guardian', 'The Tide Lamps', 'The Leviathan’s Deep'], need:(W, RS) => clears(RS) >= 3 || ((W.saga || {}).ch|0) >= 3, ul:'Clear 3 raids (or reach Saga chapter 3)'},
  {id:'hollow', n:'Gecko’s Hollow', e:'🦎', th:'hollow', fl:'cgkGrcB', gs:320, pool:['geck', 'geckspit', 'geck'], trap:'bog', set:'Shadowstep Set', setD:'your roll recharges faster', relic:{n:'Shadow Tail', d:'+20% damage to bosses below half health'},
    names:['The Frozen Bog', 'The Spore Path', 'The Egg Chamber', 'The Matron’s Shade', 'The Gecko Runes', 'The Little King’s Guard', 'The Shadow Throne'], need:(W, RS) => clears(RS) >= 5 || ((W.saga || {}).ch|0) >= 7, ul:'Clear 5 raids (or reach Saga chapter 7)'},
  {id:'clockwork', n:'The Clockwork Glacier', e:'⚙️', th:'clockwork', fl:'cglcGrB', gs:360, pool:['r_bot', 'r_cogc', 'r_bot'], trap:'gear', set:'Clockwork Set', setD:'weak-point windows last 1 second longer', relic:{n:'Clockwork Cannon', d:'every 4th hit fires an extra bolt'},
    names:['The Gear Gate', 'The Crusher Line', 'The Valve Bells', 'The Conveyor Works', 'The Cog Knight', 'The Pressure Runes', 'The Engine Heart'], need:(W, RS) => clears(RS) >= 7, ul:'Clear 7 raids'},
  {id:'void', n:'The Void Rift', e:'🌌', th:'void', fl:'cgrGmkcB', gs:420, pool:['r_vimp', 'r_swisp', 'r_vimp'], trap:'gravity', set:'Voidwalker Set', setD:'+1 ♥ every 20 seconds in raids', relic:{n:'Starfall Orb', d:'charged snowballs deal +50%'},
    names:['The Edge of Nothing', 'The Falling Stars', 'The Star Runes', 'The Rift Stalker', 'The Folding Maze', 'The Star Fragments', 'The Last Platform', 'The Herald’s Rift'], need:(W, RS) => distinct(RS) >= 8, ul:'Clear 8 different raids'}];
const clears = RS => Object.values(RS.clr || {}).reduce((a, b) => a + b, 0), distinct = RS => RAIDS.filter(R => Object.keys(RS.clr || {}).some(k => k.split(':')[0] == R.id)).length;
// ---------- raid bosses: every attack has a tell and a counter; phases change the rules ----------
const MN = {slam:['GROUND SLAM', 'Step out of the red circles'], charge:['CHARGE', 'Dodge sideways and let it crash into a wall'], breath:['BREATH', 'Hide behind a pillar'], ring:['SHOCKWAVE', 'Roll (Shift) through the wave, or stay far away'],
  orbs:['SPELL ORBS', 'Hit the gold orbs with a snowball to send them back'], volley:['ULTIMATE', 'Find the gap in the ring'], adds:['SUMMON', 'Deal with the helpers'], stack:['STACK TOGETHER', 'Stand with your team to share the hit'],
  spread:['SPREAD OUT', 'Move away from your teammates'], dive:['DIVE BOMB', 'Watch the shadow and move away. Charged hits on the wings ground it'], wind:['GALE', 'Push against the wind'], mirror:['MIRROR TRICK', 'Only the real one wags its tail'],
  crawl:['WALL CRAWL', 'Hit it with a CHARGED snowball to knock it off the wall'], tail:['TAIL DECOY', 'Hit the tail 3 times'], camo:['CAMOUFLAGE', 'Follow the footprints and the slurping'], bh:['BLACK HOLE', 'Kick a light orb into it'],
  bloat:['GRAVY GLAZE', 'Grab a meat chunk and feed Mau Mau (G)'], int:['SPELL', 'CHARGED snowball (hold click) to interrupt!'], pz:['PUZZLE', 'Solve it to break the shield']};
const KIT = {
  library:{fin:{look:'loki', n:'EMPOWERED LOKI', r:32, hp:900, intro:'Loki: “Welcome to MY library! No sticks allowed. …Is that a ball? NO. Focus, Loki.”', pas:['toys'], arena:[null, 'ink', null, null],
      ph:[['orbs', 'int:heal:Shadow Tome', 'slam'], ['orbs', 'charge', 'stack', 'int:nova:Page Storm'], ['mirror', 'orbs', 'slam', 'spread'], ['mirror', 'stack', 'volley', 'int:heal:Shadow Tome', 'spread']], nm:{slam:'FALLING SHELVES', charge:'ZOOMIES'}},
    mini:{look:'encyclopedia', n:'THE LIVING ENCYCLOPEDIA', r:40, hp:380, intro:'The Living Encyclopedia: “SHHHHH! This is a LIBRARY!”', ph:[['orbs', 'slam', 'int:summon:Page Storm'], ['orbs', 'ring', 'slam']], nm:{slam:'BOOK DROP'}}},
  catacombs:{fin:{look:'warden', n:'THE CRYPT WARDEN', r:36, hp:820, intro:'The Crypt Warden: “None may wake the catacombs.”', arena:[null, 'dark', null],
      ph:[['charge', 'adds:shield', 'slam'], ['pz:braziers:Light the 4 candles to break the dark!', 'charge', 'spread', 'slam'], ['ring', 'adds:shield', 'stack', 'charge', 'volley']], nm:{ring:'GRAVE CHILL'}},
    mini:{look:'knight', n:'THE FROSTBONE KNIGHT', r:28, hp:360, intro:'The Frostbone Knight raises a frozen shield. (Hit him from the side or behind!)', pas:['front'], ph:[['charge', 'slam'], ['charge', 'ring', 'slam']]}},
  labyrinth:{fin:{look:'mazemind', n:'THE MAZE MIND', r:34, hp:860, intro:'The Maze Mind: “Left? Right? You will never think your way out of ME.”', arena:[null, 'maze', null],
      ph:[['slam', 'int:slow:Mind Lock', 'adds:heal'], ['pz:bells', 'slam', 'spread', 'orbs'], ['ring', 'int:nova:Thought Storm', 'stack', 'slam', 'spread']], nm:{slam:'SPIRIT TRAPS'}},
    mini:{look:'lantern', n:'THE LOST LANTERN', r:30, hp:370, intro:'The Lost Lantern flickers angrily. Its light hurts!', ph:[['slam', 'orbs'], ['slam', 'adds:heal', 'orbs', 'ring']]}},
  citadel:{fin:{look:'thunderhawk', n:'THE THUNDERHAWK', r:38, hp:950, intro:'The Thunderhawk: “SKREEEEE!” *lightning crackles in its feathers*', pas:['wings'], arena:[null, null, 'crumble'],
      ph:[['dive', 'wind', 'spread'], ['pz:rods:Light the 3 lightning rods before the STORM CALL!', 'dive', 'int:nova:Thunderclap'], ['dive', 'ring', 'stack', 'wind', 'volley']], nm:{spread:'CHAIN LIGHTNING', ring:'THUNDERWAVE'}},
    mini:{look:'sentinel', n:'THE STORM SENTINEL', r:34, hp:400, intro:'A sentinel made of thunderclouds rumbles awake.', ph:[['spread', 'wind', 'int:nova:Thunderclap'], ['spread', 'slam', 'wind']], nm:{spread:'CHAIN LIGHTNING'}}},
  vault:{fin:{look:'yeti', n:'THE YETI KING & HIS TWIN GUARDS', r:42, hp:1000, intro:'The Golden Yeti King: “MY GOLD! MY VAULT! GUARDS! SQUASH THEM!”', pas:['icicles'],
      ph:[['adds:shield', 'charge', 'ring'], ['charge', 'slam', 'ring', 'stack'], ['adds:shield', 'charge', 'ring', 'spread', 'volley']], nm:{ring:'GROUND POUND', slam:'GOLD AVALANCHE'}},
    mini:{look:'vgolem', n:'THE VAULT GOLEM', r:36, hp:420, intro:'A golem made of gold coins and ice. Its belly glows after it slams…', pas:['icicles'], ph:[['slam', 'adds:bomb'], ['slam', 'ring', 'adds:bomb']]}},
  kitchen:{fin:{look:'meatloaf', n:'THE MEGA MEATLOAF', r:46, hp:1000, intro:'The Mega Meatloaf: “GLORP.” Mau Mau: “…I have never been so scared. Or so hungry.”', pas:['chunks'], arena:[null, 'jelly', null],
      ph:[['bloat', 'slam', 'adds'], ['bloat', 'charge', 'spread'], ['bloat', 'adds:bomb', 'stack', 'slam']], nm:{slam:'PLATE DROP', charge:'MEAT ROLL'}},
    mini:{look:'cake', n:'THE CAKE THAT FIGHTS BACK', r:36, hp:430, intro:'The cake opens its eyes. “You were going to EAT me?!”', ph:[['slam', 'adds', 'charge'], ['slam', 'charge', 'ring']], nm:{slam:'FROSTING SPLAT'}}},
  temple:{fin:{look:'leviathan', n:'THE GLACIER LEVIATHAN', r:42, hp:1100, intro:'The Glacier Leviathan rises from the deep water. The whole temple shakes.', arena:[null, 'tide', null],
      ph:[['charge', 'breath', 'slam'], ['int:nova:Tidal Roar', 'breath', 'charge'], ['breath', 'stack', 'spread', 'charge', 'volley']], nm:{charge:'LUNGE', breath:'ICE BREATH'}},
    mini:{look:'coral', n:'THE CORAL GOLEM', r:32, hp:440, intro:'Coral grinds against coral. The golem stands up.', ph:[['breath', 'slam'], ['breath', 'charge', 'slam']], nm:{breath:'SPORE SPRAY'}}},
  hollow:{fin:{look:'dshadow', n:'DUMPLING’S SHADOW', r:28, hp:1150, intro:'Dumpling’s Shadow: “He left me behind. I learned all his tricks anyway.”',
      ph:[['crawl', 'tail', 'slam'], ['camo', 'crawl', 'adds'], ['tail', 'camo', 'spread', 'stack', 'volley']], nm:{slam:'SHADOW POUNCE'}},
    mini:{look:'mshade', n:'THE MATRON’S SHADE', r:30, hp:460, intro:'A shadow of the Gecko Matron hisses from the reeds.', ph:[['tail', 'slam', 'adds'], ['camo', 'tail', 'slam']]}},
  clockwork:{fin:{look:'engine', n:'THE FROST ENGINE', r:48, hp:1250, intro:'The Frost Engine: “SYSTEMS ONLINE. INTRUDERS: 1. PLUS CAT.” (Its core overheats if you hit it 3 times fast!)', pas:['heat'], arena:[null, 'conv', null],
      ph:[['adds:bomb', 'slam', 'breath'], ['pz:runes:Turn the valves in order to vent the steam!', 'ring', 'adds:bomb', 'slam'], ['breath', 'stack', 'spread', 'volley', 'adds:bomb']], nm:{slam:'PISTON SLAM', breath:'STEAM BLAST'}},
    mini:{look:'cogknight', n:'THE COG KNIGHT', r:30, hp:470, intro:'The Cog Knight whirs. (Hit it 3 times fast to overheat it!)', pas:['heat'], ph:[['charge', 'ring'], ['charge', 'ring', 'slam']]}},
  void:{fin:{look:'herald', n:'THE VOID HERALD', r:38, hp:1500, intro:'The Void Herald: “The stars go out one by one. You are next.”', bar:2, arena:[null, 'grav', 'crumble', null],
      ph:[['bh', 'orbs', 'slam'], ['bh', 'int:nova:Void Collapse', 'spread'], ['stack', 'ring', 'bh', 'orbs'], ['volley', 'bh', 'int:nova:Void Collapse', 'spread', 'stack']], nm:{slam:'STARFALL'}},
    mini:{look:'stalker', n:'THE RIFT STALKER', r:30, hp:480, intro:'Something with too many stars for eyes stalks out of the rift.', ph:[['bh', 'charge'], ['bh', 'charge', 'orbs']]}}};

A.snowRaids = (S, SG0) => {
  const {X, W, g, TS, FOE, BOSS, LAIR, p, mau, mates, T} = S, ART = A.RART, RX = S.RX, NAR = ['', 'snow'];
  const STUB = {cur:() => null, tile:() => T.ROCK, inside:() => false, bounds:() => ({x0:0, x1:0, y1:0}), modal:() => false, move:() => false, update:() => {}, things:() => {}, goal:() => null, drawTiles:() => {}, drawWorld:() => {}, ents:() => {}, drawScreen:() => {}, drawTop:() => {},
    drawMini:() => null, drawMap:() => {}, mapDown:() => false, key:() => false, down:() => false, warmHeal:() => false, blockMap:() => false, save:() => {}, respawn:() => false, bossReady:() => false, bossAI:() => {}, bossDown:() => {}, hurtBoss:() => false,
    drawBoss:() => {}, drawFoe:() => {}, drawBar:() => {}, portrait:() => false};
  const B0 = SG0 || STUB;
  // ---------- save ----------
  const RS = W.rs = Object.assign({v:1, tok:0, keys:{}, best:{}, clr:{}, maxD:{}, lock:{w:0, got:{}, chest:0}, sets:0, relics:{}, relic:null, troph:{}, nd:0, role:'Damage', run:null, wfDone:{}, hints:1}, W.rs || {});
  if (!RS.mig) { RS.mig = 1; for (const id in (W.raids || {})) if (W.raids[id] > 0) { RS.clr[id + ':0'] = (RS.clr[id + ':0']|0) + W.raids[id]; RS.maxD[id] = Math.max(RS.maxD[id]|0, 1); } }   // old raid clears count, and unlock Heroic
  if (RS.lock.w != weekNo()) RS.lock = {w:weekNo(), got:{}, chest:0};
  W.titles = W.titles || {};
  const ul = R => !R.need || R.need(W, RS);
  // ---------- enemies for raids ----------
  Object.assign(FOE, {r_book:{n:'Flying Book', hp:2, sp:150, melee:1, fly:1, r:13, pts:40, rd:1}, r_ink:{n:'Ink Blob', hp:4, sp:60, shoot:2.8, r:15, pts:60, rd:1, slow:1},
    r_skel:{n:'Bone-Ice Skeleton', hp:4, sp:100, melee:1, r:14, pts:50, rd:1}, r_arch:{n:'Skeleton Archer', hp:3, sp:60, shoot:2.6, r:14, pts:55, rd:1},
    r_spirit:{n:'Maze Spirit', hp:3, sp:90, shoot:3, fly:1, r:13, pts:50, rd:1}, r_simp:{n:'Storm Imp', hp:3, sp:150, melee:1, r:13, pts:50, rd:1}, r_cloud:{n:'Thundercloud', hp:5, sp:50, shoot:2.8, fly:1, r:16, pts:60, rd:1},
    r_gimp:{n:'Gold Imp', hp:4, sp:130, melee:1, r:13, pts:60, rd:1}, r_mimic:{n:'Mimic', hp:9, sp:70, melee:2, r:18, pts:100, rd:1},
    r_meat:{n:'Angry Meatball', hp:4, sp:140, melee:1, r:13, pts:50, rd:1}, r_jelly:{n:'Wobble Jelly', hp:5, sp:55, shoot:2.8, r:15, pts:60, rd:1}, r_cup:{n:'Cupcake Brute', hp:6, sp:90, melee:2, r:15, pts:70, rd:1},
    r_fish:{n:'Ice Piranha', hp:2, sp:160, melee:1, fly:1, r:13, pts:45, rd:1}, r_crab:{n:'Frost Crab', hp:8, sp:60, melee:2, r:18, pts:90, rd:1},
    r_bot:{n:'Ice Robot', hp:5, sp:60, shoot:2.6, r:15, pts:60, rd:1}, r_cogc:{n:'Cog Crawler', hp:3, sp:160, melee:1, r:14, pts:50, rd:1}, r_bombbot:{n:'Bomb Bot', hp:4, sp:70, r:15, pts:60, rd:1, bomb:1},
    r_vimp:{n:'Void Imp', hp:5, sp:80, shoot:2.4, hex:1, r:15, pts:70, rd:1}, r_swisp:{n:'Star Wisp', hp:2, sp:120, melee:1, fly:1, r:12, pts:45, rd:1},
    r_shield:{n:'Shield-Bearer', hp:7, sp:35, r:15, pts:80, rd:1}, r_healer:{n:'Healer', hp:6, sp:40, r:14, pts:80, rd:1}, r_guard:{n:'Twin Guard', hp:12, sp:70, melee:2, r:20, pts:120, rd:1}});
  for (const R of RAIDS) { S.REG['rd_' + R.id] = {n:R.n, tier:6, pool:[], safe:1, mood:'r_' + R.id, rd:1}; const K = KIT[R.id];
    for (const [k, D] of [['rb_' + R.id, K.fin], ['rm_' + R.id, K.mini]]) { BOSS[k] = {n:D.n, hp:D.hp, r:D.r, phases:D.ph.length, saga:1, brain:1, draw:1, bar:1, rd:1, wake:1e9, intro:D.intro}; LAIR[k] = {x:-1e6, y:-1e6}; } }
  const prevReg = A.sagaReg; A.sagaReg = (x, y) => run ? 'rd_' + run.R.id : prevReg ? prevReg(x, y) : 'raid';
  // ---------- gear score, sets, relics ----------
  const PERM = S.PERM, eqd = slot => (PERM.gear || []).find(x => x.id == (PERM.eq || {})[slot]);
  const SLOTS = ['gloves', 'boots', 'hat', 'scarf', 'pack'], SLOTN = {gloves:'Mittens', boots:'Boots', hat:'Helm', scarf:'Scarf', pack:'Pack'};
  const GS = () => Math.round(SLOTS.reduce((a, s) => { const it = eqd(s); return a + (it ? (it.rar + 1)*20*(1 + .15*it.lv) : 0); }, 0));
  const setN = id => SLOTS.filter(s => { const it = eqd(s); return it && it.set == id; }).length, set4 = id => setN(id) >= 4, set2 = () => RAIDS.some(R => setN(R.id) >= 2);
  const recGS = (R, d) => Math.round(R.gs*[1, 1.4, 1.8, 2.3][d]);
  const makeSet = (R, minR, slot) => { const s2 = slot || SLOTS[Math.floor(Math.random()*5)], it = X.makeGear(Math.min(6, minR), s2); if (!it) return null; it.set = R.id; it.name = R.set.replace(' Set', '').replace('’s', '’s') + ' ' + SLOTN[s2]; RS.sets = (RS.sets|0) + 1; S.save(); return it; };
  // ---------- the run ----------
  let run = null, F = null, hz = [], kicks = [], fx = [], parts = [], puffs = [], banner = null, callout = null, vic = null, intro = null, wt = 0, lastTreat = W.treats|0, seen = new Set();
  const on = () => !!run, R0 = () => run && run.R, th = () => run ? run.R.th : 'library', D = () => DIFF[run ? run.d : 0];
  const mods = () => run ? run.mods : [], mod = k => mods().find(m => m[k]);
  const wp = (lx, ly) => ({x:(RX + lx + .5)*TS, y:(ly + .5)*TS}), toL = (x, y) => ({x:Math.floor(x/TS) - RX, y:Math.floor(y/TS)});
  const rnd = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), say = S.say;
  const solidL = (lx, ly) => lx < 0 || ly < 0 || lx >= FW || ly >= FH || !!S_SOLID(F.M[ly*FW + lx]);
  const S_SOLID = v => v == T.WALL || v == T.ROCK;
  // floor tiles: V = look (0 floor 1 wall 2 pillar 3 gap 4 water 5 ink 6 jelly 7 bog 8 conveyor → 9 conveyor ← 10 safe platform)
  const setV = (lx, ly, v) => { if (lx < 0 || ly < 0 || lx >= FW || ly >= FH) return; F.V[ly*FW + lx] = v; F.M[ly*FW + lx] = v == 1 || v == 2 || v == 3 ? T.WALL : v >= 4 && v <= 7 ? T.DEEP : T.FLOOR; };
  const V = (lx, ly) => lx < 0 || ly < 0 || lx >= FW || ly >= FH ? 1 : F.V[ly*FW + lx];
  const doorOpen = o => { F.door = o; for (const x of [16, 17]) for (const y of [0, 1]) F.M[y*FW + x] = o ? T.FLOOR : T.WALL; };
  const genFloor = (fi) => { const R = run.R, code = R.fl[fi], r = rnd(run.seed + fi*977), M = new Uint8Array(FW*FH), Vv = new Uint8Array(FW*FH);
    F = {fi, code, M, V:Vv, deco:[], door:false, obj:{}, done:false, t:0, chest:null, pz:null};
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) setV(x, y, x < 1 || x >= FW - 1 || y < 2 || y >= FH - 1 ? 1 : 0);
    doorOpen(false);
    const free = (x, y, m = 1) => { for (let yy = y - m; yy <= y + m; yy++) for (let xx = x - m; xx <= x + m; xx++) if (V(xx, yy) != 0) return false; return !(Math.abs(x - 16.5) < 3 && y > FH - 5) && !(Math.abs(x - 16.5) < 3 && y < 5); };
    if (code == 'B' || code == 'G') for (const [x, y] of [[8, 8], [25, 8], [8, 16], [25, 16]]) setV(x, y, 2);
    else if (code == 'm') genMaze(r);
    else if (code != 'g') { const n = 3 + Math.floor(r()*3); for (let i = 0; i < n; i++) { const x = 4 + Math.floor(r()*12), y = 5 + Math.floor(r()*13); if (free(x, y)) { setV(x, y, 2); setV(FW - 1 - x, y, 2); } } }
    if (R.th == 'void' && code != 'm' && code != 'B' && code != 'G') for (let i = 0; i < 5; i++) { const x = 3 + Math.floor(r()*(FW - 6)), y = 5 + Math.floor(r()*(FH - 10)); if (free(x, y, 2)) { setV(x, y, 3); setV(x + 1, y, 3); } }
    // decorations along the walls and on the floor
    const TH = ART.TH[R.th]; for (let x = 2; x < FW - 2; x += 3) if (Math.abs(x - 16.5) > 3) F.deco.push({k:TH.edge, x:x + .5, y:2.2, i:x});
    for (let i = 0; i < 14; i++) { const x = 2 + Math.floor(r()*(FW - 4)), y = 4 + Math.floor(r()*(FH - 7)); if (V(x, y) == 0 && free(x, y, 0) && !F.deco.some(d => Math.abs(d.x - x) < 2 && Math.abs(d.y - y) < 2)) F.deco.push({k:TH.deco[i % TH.deco.length], x:x + .5, y:y + .8, i}); }
    for (const sx of [1.6, FW - 1.6]) for (let y = 5; y < FH - 2; y += 5) F.deco.push({k:TH.deco[(y + (sx > 2 ? 1 : 0)) % TH.deco.length], x:sx, y:y + .6, i:y});
    // the question chest (Learn mode: answer right for extra tokens), not on boss floors
    if (code != 'B') { const cx = r() < .5 ? 3 : FW - 4; F.chest = {...wp(cx, FH - 4), open:false}; }
    F.spawn = wp(16.5 - .5, FH - 3); };
  const genMaze = r => { const CW = 3, cols = 10, rows = 7, ox = 2, oy = 2, mk = () => { const vis = new Uint8Array(cols*rows), walls = new Set(), key = (a, b) => a < b ? a + ',' + b : b + ',' + a;
      for (let i = 0; i < cols*rows; i++) for (const j of [i + 1, i + cols]) if ((j == i + 1 && (i % cols) < cols - 1) || (j == i + cols && j < cols*rows)) walls.add(key(i, j));
      const st = [Math.floor(cols/2) + (rows - 1)*cols]; vis[st[0]] = 1; while (st.length) { const c = st[st.length - 1], nb = [c - 1, c + 1, c - cols, c + cols].filter(n => n >= 0 && n < cols*rows && !vis[n] && (Math.abs(n - c) != 1 || Math.floor(n/cols) == Math.floor(c/cols)));
        if (!nb.length) { st.pop(); continue; } const n = nb[Math.floor(r()*nb.length)]; walls.delete(key(c, n)); vis[n] = 1; st.push(n); }
      for (let k = 0; k < 6; k++) { const w = [...walls][Math.floor(r()*walls.size)]; walls.delete(w); } return walls; };
    F.mazes = [mk(), mk()]; F.mz = 0; F.mzT = 14; F.mzW = 0; F.mzCell = {CW, cols, rows, ox, oy}; applyMaze(0); };
  const mazeWallTiles = walls => { const {CW, cols, ox, oy} = F.mzCell, out = []; for (const w of walls) { const [a, b] = w.split(',').map(Number), ax = a % cols, ay = Math.floor(a/cols);
      if (b == a + 1) { const x = ox + (ax + 1)*CW; for (let y = oy + ay*CW; y <= oy + ay*CW + CW; y++) out.push([x, y]); } else { const y = oy + (ay + 1)*CW; for (let x = ox + ax*CW; x <= ox + ax*CW + CW; x++) out.push([x, y]); } } return out.filter(([x, y]) => x > 0 && x < FW - 1 && y > 1 && y < FH - 1); };
  const applyMaze = i => { for (let y = 2; y < FH - 1; y++) for (let x = 1; x < FW - 1; x++) if (V(x, y) == 1) setV(x, y, 0); F.mz = i; for (const [x, y] of mazeWallTiles(F.mazes[i])) if (!(x >= 15 && x <= 18 && (y <= 3 || y >= FH - 3))) setV(x, y, 1);
    for (let y = 2; y <= 3; y++) for (let x = 15; x <= 18; x++) setV(x, y, 0); for (let y = FH - 3; y < FH - 1; y++) for (let x = 15; x <= 18; x++) setV(x, y, 0); };
  // ---------- starting, floors, leaving ----------
  const startRun = (R, d, key, fi = 0, resume) => { if (S.boss) S.boss = null; S.foes = []; S.balls = []; S.riding = false; S.panel = null; S.mapOpen = false;
    run = {R, d, key:key|0, fi, seed:(Math.random()*1e9)|0, t:(resume && resume.t) || 0, deaths:(resume && resume.deaths) || 0, mods:weekMods(), tank:{hp:0, max:0, down:0}, buffT:0, hits:0, spiritT:0, voidT:0};
    run.tank.max = run.tank.hp = 10 + 2*d + (set4('kitchen') ? 6 : 0); enterFloor(fi); A.sfx('win'); };
  const enterFloor = fi => { run.fi = fi; genFloor(fi); hz = []; kicks = []; puffs = []; fx = []; S.foes = []; S.balls = []; S.boss = null; S.holdMates = false; F.t = 0;
    p.x = F.spawn.x; p.y = F.spawn.y; p.vx = p.vy = 0; p.inv = 1.5; S.mateHome(); mau.x = p.x - 46; mau.y = p.y + 6; mates.forEach((m, i) => { m.x = p.x + (i - 1)*60; m.y = p.y + 50; });
    const R = run.R, nm = R.names[fi] || 'Floor ' + (fi + 1), code = F.code, tip = {c:'Defeat the enemies', r:'Read the rune tablet, then step on the plates in that order', b:'Light all 4 braziers (E) at the same time', l:'Ring the bells from the deepest to the highest (E or a snowball)',
      k:'Collect the 3 keys', g:'Cross the hall: dodge the red zones', m:'Find the way through the shifting maze (follow the arrow)', G:'The guardian awaits', B:'The raid boss awaits'}[code];
    banner = {t:3.2, a:'Floor ' + (fi + 1) + ' / ' + R.fl.length + ' · ' + nm, b:tip}; S.say('📍 ' + nm, 2);
    RS.run = {id:R.id, d:run.d, key:run.key, fi, t:Math.round(run.t), deaths:run.deaths}; S.save();
    setupObj(); };
  const setupObj = () => { const o = F.obj, code = F.code, R = run.R, r = rnd(run.seed + F.fi*31);
    if (code == 'c') { o.wave = 0; o.waves = 2 + (run.d >= 2 ? 1 : 0); o.next = 1.6; }
    if (code == 'r') { o.order = [0, 1, 2, 3].sort(() => r() - .5); o.step = 0; o.plates = [[7, 8], [26, 8], [7, 16], [26, 16]].map(([x, y], i) => ({i, ...wp(x, y)})); o.tab = wp(16.5, 3.2); o.seen = 0; }
    if (code == 'b') { o.br = [[5, 5], [28, 5], [5, 19], [28, 19]].map(([x, y]) => ({...wp(x, y), lit:0})); o.puffT = 5; }
    if (code == 'l') { const sz = [0, 1, 2, 3].sort(() => r() - .5); o.bells = [[8, 7], [25, 7], [8, 16], [25, 16]].map(([x, y], i) => ({...wp(x, y), s:sz[i], rung:0, sw:0})); o.step = 0; o.tab = wp(16.5, 3.2); o.miss = 0; }
    if (code == 'k') { o.keys = []; const spots = [[4, 5], [29, 5], [4, 18], [29, 18], [16, 10]].sort(() => r() - .5).slice(0, 3); for (const [x, y] of spots) { let q = {x, y}; for (let k = 0; k < 9 && V(q.x, q.y) != 0; k++) q = {x:x + (k % 3) - 1, y:y + Math.floor(k/3) - 1}; const w = wp(q.x, q.y); o.keys.push({...w, got:0}); for (let i = 0; i < 2; i++) addFoe(pick(R.pool), w.x + (i ? 60 : -60), w.y + 40); } }
    if (code == 'g') { o.tr = 1.2; doorOpen(true); }
    if (code == 'm') { doorOpen(true); }
    if (code == 'G' || code == 'B') { o.spawnT = code == 'B' ? 1.2 : .8; } };
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const addFoe = (k, x, y, job) => { const L0 = toL(x, y), q = !solidL(L0.x, L0.y) ? {x, y} : F.spawn; S.spawnFoe(k, q.x, q.y); const f = S.foes[S.foes.length - 1]; if (!f) return null; f.rf = 1; f.job = job; f.hp = Math.ceil(f.hp*(1 + .35*run.d + .06*run.key)); f.max = f.hp; return f; };
  const floorDone = () => { if (F.done) return; F.done = true; doorOpen(true); A.sfx('win'); S.cheerT = 1.2; say('🚪 The way forward opens! (go to the top door)', 2.6); give1('tok', 2); };
  const give1 = (k, n) => { if (k == 'tok') { RS.tok += n; fxNum(p.x, p.y - 50, '+' + n + ' 🎟 Raid Tokens', '#F9BF01'); } };
  const fxNum = (x, y, s2, c) => S.addNum(x, y, s2, c);
  const leaveRun = (msg2, keep) => { if (!run) return; if (keep) RS.run = {id:run.R.id, d:run.d, key:run.key, fi:run.fi, t:Math.round(run.t), deaths:run.deaths}; else RS.run = null;
    run = null; F = null; hz = []; kicks = []; puffs = []; S.boss = null; S.foes = []; S.balls = []; S.holdMates = false; p.x = (44.5)*TS; p.y = (92.2)*TS; p.vx = p.vy = 0; S.mateHome(); mau.x = p.x - 40; mau.y = p.y + 10; S.save(); if (msg2) say(msg2, 3); };
  // ---------- boss fights ----------
  const kitOf = k => { const id = k.slice(3); return k[1] == 'b' ? KIT[id].fin : KIT[id].mini; };
  const spawnRB = mini => { const R = run.R, k = (mini ? 'rm_' : 'rb_') + R.id, K = kitOf(k), at = wp(16.5, 9.5); LAIR[k] = {x:at.x, y:at.y + 40}; if (W.bhp) delete W.bhp[k]; S.spawnBoss(k); const B = S.boss; if (!B) return;
    const hp = Math.round(K.hp*(.75 + .25*run.R.gs/100)*D().hp*(1 + .08*run.key)*(1 + .04*Math.max(0, X.lv() - 1))); B.hp = B.max = hp; B.ph = 1; B.phases = K.ph.length; B.saga = 1; B.r = K.r; B.talk = K.intro; B.talkT = 4;
    B.rd = {K, q:0, next:2, act:null, stag:0, down:0, weakT:0, cast:null, enr:D().enr + 20*K.ph.length, enraged:0, swipe:3, heat:0, heatT:0, wings:0, air:0, shield:0, mini}; B.hx = at.x; B.hy = at.y;
    run.cp = {k, ph:1}; intro = {t:2.8, n:K.n, mini, look:K.look}; if (mini) F.obj.boss = 1; else F.obj.boss = 1;
    if ((K.pas || []).includes('icicles')) run.ic = [[6, 6], [27, 6], [6, 18], [27, 18], [12, 12], [21, 12]].map(([x, y]) => ({...wp(x, y), t:0})); else run.ic = null;
    if ((K.pas || []).includes('toys')) for (const [x, y] of [[6, 12], [27, 12], [16.5, 19]]) kicks.push({k:'toy', ...wp(x, y), vx:0, vy:0});
    S.REG['rd_' + R.id].mood = 'boss'; };
  const telMul = B => D().tel*(set4('labyrinth') ? 1.2 : 1)*(B && B.rd.enraged ? .85 : 1);
  const call = (B, id, nm2) => { const base = MN[id] || [id.toUpperCase(), '']; const n2 = (B.rd.K.nm && B.rd.K.nm[id]) || nm2 || base[0]; callout = {t:2.4, n:n2, tip:base[1]}; B.talk = '⚠ ' + n2; B.talkT = 1.4; A.tone(id == 'volley' ? 180 : 330, .18, 'square', .04); };
  const zone = o => { const h = Object.assign({k:'circle', r:60, t:1, dmg:1}, o); h.T = h.t; hz.push(h); return h; };
  const inZone = (h, q) => h.k == 'circle' ? dist(h, q) < h.r : h.k == 'rect' ? (() => { const dx = q.x - h.x, dy = q.y - h.y, ca = Math.cos(-h.a), sa = Math.sin(-h.a), lx = dx*ca - dy*sa, ly = dx*sa + dy*ca; return lx >= 0 && lx <= h.len && Math.abs(ly) <= h.w/2; })()
    : h.k == 'cone' ? (() => { const d2 = dist(h, q), a = Math.atan2(q.y - h.y, q.x - h.x), da = Math.atan2(Math.sin(a - h.a), Math.cos(a - h.a)); return d2 < h.len && Math.abs(da) < h.sp && !losBlocked(h, q); })() : false;
  const losBlocked = (a, b) => { const n = Math.ceil(dist(a, b)/16); for (let i = 1; i < n; i++) { const x = a.x + (b.x - a.x)*i/n, y = a.y + (b.y - a.y)*i/n, L = toL(x, y); if (V(L.x, L.y) == 2) return true; } return false; };
  const ray = (from, a, max = 1200) => { let x = from.x, y = from.y; for (let s = 0; s < max; s += 12) { const nx = from.x + Math.cos(a)*s, ny = from.y + Math.sin(a)*s, L = toL(nx, ny); if (solidL(L.x, L.y)) return {x, y, len:s, hit:true}; x = nx; y = ny; } return {x, y, len:max, hit:false}; };
  const hitMe = n => { const m2 = Math.max(1, Math.round(n*D().dmg + (S.boss && S.boss.rd && S.boss.rd.enraged ? 1 : 0))); S.hurtMe(RS.role == 'Tank' ? Math.max(1, m2 - 1) : m2); };
  const allies = () => [...(W.mau && run.tank.down <= 0 ? [mau] : []), ...mates.filter(m => !m.ko)];
  const MECH = {
    slam:{go(B, a) { const tg = [p, ...allies().sort(() => Math.random() - .5).slice(0, run.d)]; for (const q of tg) zone({x:q.x, y:q.y, r:66, t:1.15*telMul(B), dmg:2, col:'255,69,57'}); if (run.d >= 3) zone({x:p.x + (Math.random() - .5)*160, y:p.y + (Math.random() - .5)*160, r:56, t:1.5*telMul(B), dmg:2, col:'255,69,57'}); a.end = 1.5*telMul(B); },
      done(B) { B.rd.weakT = 1.8 + (set4('clockwork') ? 1 : 0); }},
    charge:{go(B, a) { a.ang = Math.atan2(p.y - B.y, p.x - B.x); const rc = ray(B, a.ang); a.len = rc.len; zone({k:'rect', x:B.x, y:B.y, a:a.ang, len:rc.len, w:B.r*2 + 10, t:.95*telMul(B), dmg:0, col:'255,120,40', vis:1}); a.wind = .95*telMul(B); a.end = 9; },
      tick(B, a, dt) { if (a.t < a.wind) { B.shake = .5; return; } const sp = 780*dt, nx = B.x + Math.cos(a.ang)*sp, ny = B.y + Math.sin(a.ang)*sp, L = toL(nx + Math.cos(a.ang)*B.r*.7, ny + Math.sin(a.ang)*B.r*.7);
        if (!a.hitP && dist(B, p) < B.r + 16) { a.hitP = 1; hitMe(2); p.vx += Math.cos(a.ang)*400; p.vy += Math.sin(a.ang)*400; }
        if (solidL(L.x, L.y) || a.t > a.wind + 2.2) { S.shakeV = 10; A.sfx('hit'); boom(B.x + Math.cos(a.ang)*B.r, B.y + Math.sin(a.ang)*B.r, '#ffffff'); stun(B, 2.2, 30, 'CRASH! It’s dazed!'); a.end = 0; } else { B.x = nx; B.y = ny; } }},
    breath:{go(B, a) { a.ang = Math.atan2(p.y - B.y, p.x - B.x); B.throatT = 1.25*telMul(B); zone({k:'cone', x:B.x, y:B.y - 20, a:a.ang, len:480, sp:.45, t:1.25*telMul(B), dmg:2, col:'159,232,255'}); a.end = 1.6*telMul(B); }, done(B) { B.rd.weakT = 1.4; }},
    ring:{go(B, a) { zone({x:B.x, y:B.y, r:B.r + 30, t:.9*telMul(B), dmg:0, col:'255,200,60', vis:1}); a.end = .95*telMul(B); }, done(B) { hz.push({k:'wave', x:B.x, y:B.y, r:B.r, sp:270, w:18, dmg:1, hit:0, t:0, T:0}); if (run.d >= 2) setTimeout0(() => hz.push({k:'wave', x:B.x, y:B.y, r:B.r, sp:270, w:18, dmg:1, hit:0, t:0, T:0}), .8); B.rd.weakT = 1.2; }},
    orbs:{go(B, a) { a.n = 3 + (run.d >= 2 ? 1 : 0); a.end = .7*telMul(B) + a.n*.3 + .2; a.fired = 0; }, tick(B, a) { const k = Math.floor((a.t - .7*telMul(B))/.3); if (a.t > .7*telMul(B) && a.fired <= k && a.fired < a.n) { a.fired++; const an = Math.atan2(p.y - B.y, p.x - B.x) + (Math.random() - .5)*.25; S.balls.push({x:B.x, y:B.y - 30, vx:Math.cos(an)*190, vy:Math.sin(an)*190, mine:0, dmg:1, r:11, life:5, col:'#F9BF01', refl:1}); A.tone(700, .05, 'sine', .03); } }},
    volley:{go(B, a) { a.gap = Math.random()*TAU; a.end = 2.4*telMul(B) + 1; a.w = 2.2*telMul(B); a.n = 0; zone({x:B.x, y:B.y, r:120, t:a.w, dmg:0, col:'255,69,57', vis:1, gap:a.gap}); },
      tick(B, a) { if (a.t > a.w && a.n == 0) { a.n = 1; ringShots(B, a.gap); } if (a.t > a.w + .8 && a.n == 1 && run.d >= 1) { a.n = 2; ringShots(B, a.gap + .5); } }},
    adds:{go(B, a, arg) { const n = (arg == 'shield' ? 2 : arg == 'heal' ? 2 : arg == 'bomb' ? 2 : 3) + (run.d >= 1 ? 1 : 0) + (mod('swarm') ? 2 : 0), R = run.R;
        for (let i = 0; i < n; i++) { const an = i/n*TAU + Math.random()*.4, x = B.x + Math.cos(an)*140, y = B.y + Math.sin(an)*110, k = arg == 'shield' ? (R.id == 'vault' ? 'r_guard' : 'r_shield') : arg == 'heal' ? 'r_healer' : arg == 'bomb' ? (R.id == 'kitchen' ? 'r_cup' : 'r_bombbot') : pick(R.pool); addFoe(k, x, y, arg || 'add'); }
        a.end = .9; if (arg == 'shield') { callout = {t:3, n:R.id == 'vault' ? 'THE TWIN GUARDS!' : 'SHIELDED!', tip:'Defeat the shield-bearers to hurt the boss'}; } if (arg == 'heal') callout = {t:3, n:'HEALERS!', tip:'Stop the healers before they undo your work'}; if (arg == 'bomb') callout = {t:3, n:'BOMB CARRIERS!', tip:'Defeat them, then kick their bombs at the boss'}; }},
    int:{go(B, a, arg) { const [eff, ...nm] = (arg || 'heal:Spell').split(':'); a.eff = eff; B.rd.cast = {n:nm.join(':') || 'Spell', t:0, T:3.2*telMul(B)*(run.d >= 3 ? .85 : 1), eff}; a.end = B.rd.cast.T + .2; callout = {t:2.6, n:'⚡ ' + B.rd.cast.n.toUpperCase(), tip:MN.int[1]};
        if (eff == 'nova') { a.safe = []; for (let i = 0; i < 3; i++) { const an = Math.random()*TAU, q = {x:B.hx + Math.cos(an)*(180 + Math.random()*120), y:B.hy + 60 + Math.sin(an)*120}; const L = toL(q.x, q.y); if (!solidL(L.x, L.y)) a.safe.push(q); } if (!a.safe.length) a.safe.push({x:p.x, y:p.y}); run.safe = a.safe; } },
      tick(B, a) { if (!B.rd.cast) { a.end = 0; run.safe = null; return; } B.rd.cast.t = a.t; if (a.t >= B.rd.cast.T) { const eff = B.rd.cast.eff; B.rd.cast = null; run.safe = null; S.shakeV = 8;
          if (eff == 'heal') { const h = Math.round(B.max*.1); B.hp = Math.min(phTop(B), B.hp + h); fxNum(B.x, B.y - 80, '+' + h + ' healed!', '#7fe08a'); }
          else if (eff == 'nova') { if (!(a.safe || []).some(q => dist(q, p) < 72)) { hitMe(2); fxNum(p.x, p.y - 40, 'Not in a safe circle!', '#FF4539'); } boom(B.x, B.y, '#d6a0ff'); }
          else if (eff == 'summon') { for (let i = 0; i < 4; i++) addFoe(pick(run.R.pool), B.x + (i - 1.5)*70, B.y + 60); }
          else if (eff == 'slow') { run.slowT = 5; fxNum(p.x, p.y - 40, '🧠 Mind Locked: slowed!', '#d6a0ff'); } a.end = 0; } }},
    stack:{go(B, a) { a.end = 3.4*telMul(B); S.holdMates = true; }, tick(B, a) { mates.forEach((m, i) => { m.hx = p.x + (i - 1)*26; m.hy = p.y + 24; }); },
      done(B) { S.holdMates = false; const al = allies().filter(q => dist(q, p) < 105).length, solo = !W.mau && !mates.length, n = solo ? 0 : al >= 2 ? 0 : al == 1 ? 1 : 3; boom(p.x, p.y, '#F9BF01');
        if (n) { hitMe(n); fxNum(p.x, p.y - 50, 'Not enough friends in the circle!', '#FF4539'); } else fxNum(p.x, p.y - 50, 'Shared! 💛', '#00B451'); }},
    spread:{go(B, a) { a.end = 3*telMul(B); S.holdMates = true; const corners = [[5, 5], [28, 5], [5, 19], [28, 19], [16.5, 4]].map(([x, y]) => wp(x, y)).sort((u, v) => dist(v, p) - dist(u, p)); mates.forEach((m, i) => { const c = corners[i % corners.length]; m.hx = c.x; m.hy = c.y; }); a.mau = corners[3]; },
      done(B) { S.holdMates = false; const near = allies().some(q => dist(q, p) < 125); boom(p.x, p.y, '#9fe8ff'); if (near) { hitMe(2); run.slowT = 1.2; fxNum(p.x, p.y - 50, '❄ CHAIN FREEZE! Too close!', '#64CDF5'); } else fxNum(p.x, p.y - 50, 'Nice spacing!', '#00B451'); }},
    pz:{go(B, a, arg) { const [kind, ...tx] = (arg || 'braziers').split(':'); const pos = [[6, 6], [27, 6], [6, 18], [27, 18]]; B.rd.shield = 1; a.end = 99;
        run.pz = {kind, t:kind == 'rods' ? 13 : 18, items:(kind == 'rods' ? [[6, 6], [27, 6], [16.5, 19]] : pos).map(([x, y], i) => ({...wp(x, y), on:0, i})), step:0, order:[0, 1, 2, 3].sort(() => Math.random() - .5), show:kind == 'bells' ? 3 : 0, B};
        if (kind == 'rods') B.rd.cast = {n:'STORM CALL', t:0, T:13, eff:'none', noInt:1}; callout = {t:3.5, n:'🧩 ' + (tx.join(':') || {bells:'Ring the bells in the order the Mind flashes them!', runes:'Turn the runes in order!', braziers:'Light the 4 braziers!'}[kind]), tip:'The boss is shielded until you solve it'}; },
      tick(B, a, dt) { const P = run.pz; if (!P) { a.end = 0; return; } if (P.show > 0) { P.show -= dt; return; } P.t -= dt; if (B.rd.cast && B.rd.cast.noInt) B.rd.cast.t = 13 - P.t;
        if (P.items.every(q => q.on) || P.ok) { run.pz = null; B.rd.shield = 0; B.rd.cast = null; S.cheerT = 1.5; if (P.kind == 'rods') { for (let i = 0; i < 3; i++) fx.push({k:'bolt', x:B.x + (i - 1)*20, y:B.y, t:.5}); B.hp -= B.max*.04; } stun(B, 4.5, 100, 'SOLVED! The shield shatters!'); a.end = 0; return; }
        if (P.t <= 0) { run.pz = null; B.rd.shield = 0; B.rd.cast = null; boom(p.x, p.y, '#FF4539'); hitMe(2); say('⏱ Too slow! The boss lashes out… (the shield fades anyway)', 2.4); a.end = 0; } }},
    dive:{go(B, a) { a.end = 4; B.air = 0; B.sx = B.x; B.sy = B.y; }, tick(B, a, dt) { const rise = .5, hover = 1.4*telMul(B), lock = .4;
        if (a.t < rise) B.air = a.t/rise; else if (a.t < rise + hover) { B.air = 1; B.sx += (p.x - B.sx)*Math.min(1, dt*3); B.sy += (p.y - B.sy)*Math.min(1, dt*3); if (B.rd.wings >= 2) { B.rd.wings = 0; B.air = 0; B.x = B.sx; B.y = B.sy; stun(B, 3, 50, 'GROUNDED! Wing hit!'); a.end = 0; return; } }
        else if (!a.z) { a.z = zone({x:B.sx, y:B.sy, r:92, t:lock, dmg:2, col:'255,69,57'}); } else if (a.t > rise + hover + lock) { B.air = 0; B.x = B.sx; B.y = B.sy; S.shakeV = 9; B.rd.weakT = 1.6; a.end = 0; return; }
        if (B.air) { B.x = B.sx; B.y = B.sy - 110*B.air; } }, done(B) { if (B.air) { B.air = 0; B.x = B.sx; B.y = B.sy; } }},
    wind:{go(B, a) { a.ang = Math.random() < .5 ? 0 : Math.PI; if (Math.random() < .4) a.ang = Math.PI/2*(Math.random() < .5 ? 1 : -1); run.wind = {a:a.ang, tell:1*telMul(B), t:0, T:1.7}; a.end = 2.9; }},
    mirror:{go(B, a) { const pts = [[8, 6], [25, 6], [8, 17], [25, 17]].map(([x, y]) => wp(x, y)).sort(() => Math.random() - .5); run.copies = pts.slice(1).map(q => ({...q, cd:2 + Math.random(), hit:0})); B.x = pts[0].x; B.y = pts[0].y; a.end = 12; boom(B.x, B.y, '#F9BF01'); },
      tick(B, a, dt) { if (!run.copies || !run.copies.length) { a.end = 0; return; } for (const c of run.copies) { c.cd -= dt; if (c.cd <= 0) { c.cd = 3; const an = Math.atan2(p.y - c.y, p.x - c.x); S.shot({x:c.x, y:c.y - 30}, an, 170, {r:7, col:'#c08aff'}); } } },
      done() { run.copies = null; }},
    crawl:{go(B, a) { const xs = [wp(1.6, 0).x, wp(FW - 2.6, 0).x]; a.tx = xs[B.x < (RX + FW/2)*TS ? 0 : 1]; a.ty = Math.max(wp(0, 5).y, Math.min(wp(0, FH - 5).y, p.y)); a.end = 9; B.wall = 0; },
      tick(B, a, dt) { if (!B.wall) { B.x += (a.tx - B.x)*Math.min(1, dt*4); B.y += (a.ty - B.y)*Math.min(1, dt*4); if (Math.abs(B.x - a.tx) < 8) B.wall = 1; return; }
        a.sp = (a.sp || 1.2) - dt; B.y += Math.sin(a.t*2)*60*dt; if (a.sp <= 0) { a.sp = 1.5; const an = Math.atan2(p.y - B.y, p.x - B.x); zone({k:'rect', x:B.x, y:B.y, a:an, len:600, w:20, t:.5*telMul(B), dmg:0, col:'255,120,40', vis:1}); setTimeout0(() => S.shot(B, an, 330, {r:8, col:'#7a5aa0'}), .5*telMul(B)); } },
      done(B) { B.wall = 0; }},
    tail:{go(B, a) { run.tail = {x:B.x, y:B.y + 6, hp:3, t:6.5}; B.camoA = .35; a.end = 6.5; B.runT = 6.5; }, tick(B, a) { if (!run.tail) a.end = 0; }, done(B) { B.camoA = 0; if (run.tail) { zone({x:run.tail.x, y:run.tail.y, r:70, t:.8, dmg:1, col:'255,69,57'}); run.tail = null; } }},
    camo:{go(B, a) { B.camoA = .06; a.end = 6.5; a.fp = 0; a.sl = 1; }, tick(B, a, dt) { a.fp -= dt; if (a.fp <= 0) { a.fp = .3; fx.push({k:'print', x:B.x + (Math.random() - .5)*10, y:B.y + 4, t:2.2}); } a.sl -= dt; if (a.sl <= 0) { a.sl = 1.3; fx.push({k:'txt', s:'*slurp*', x:B.x, y:B.y - 40, t:.9}); A.tone(900, .06, 'sine', .02); }
        if (dist(B, p) < 90 && !a.sw) { a.sw = 1; zone({k:'cone', x:B.x, y:B.y, a:Math.atan2(p.y - B.y, p.x - B.x), len:140, sp:.7, t:.6*telMul(B), dmg:1, col:'255,69,57'}); } if (B.camoA > .5) a.end = 0; }, done(B) { B.camoA = 0; }},
    bh:{go(B, a) { let q = null; for (let k = 0; k < 20; k++) { const c = wp(4 + Math.random()*(FW - 8), 5 + Math.random()*(FH - 10)); if (dist(c, p) > 220 && !solidL(toL(c.x, c.y).x, toL(c.x, c.y).y)) { q = c; break; } } q = q || wp(8, 6);
        zone({x:q.x, y:q.y, r:50, t:1*telMul(B), dmg:0, col:'214,160,255', vis:1}); run.bh = run.bh || []; setTimeout0(() => run && run.bh && run.bh.push({...q, t:11, hit:0}), 1*telMul(B));
        for (let i = 0; i < 2; i++) { const o2 = wp(5 + Math.random()*(FW - 10), 5 + Math.random()*(FH - 10)); if (!solidL(toL(o2.x, o2.y).x, toL(o2.x, o2.y).y)) kicks.push({k:'orb', ...o2, vx:0, vy:0}); } a.end = 1.3; }},
    bloat:{go(B, a) { B.bloat = 7; a.end = 1; for (let i = 0; i < 3; i++) { const an = Math.random()*TAU, q = {x:B.x + Math.cos(an)*(130 + Math.random()*120), y:B.y + Math.sin(an)*100 + 40}; const L = toL(q.x, q.y); if (!solidL(L.x, L.y)) kicks.push({k:'chunk', ...q, vx:0, vy:0, still:1}); } callout = {t:3, n:'🍖 GRAVY GLAZE! IT’S BLOATED!', tip:'Grab a meat chunk and feed Mau Mau (G) to shrink it'}; }}};
  let timers = []; const setTimeout0 = (fn, s) => timers.push({fn, t:s});
  const ringShots = (B, gap) => { const n = 18; for (let i = 0; i < n; i++) { const an = i/n*TAU; if (Math.abs(Math.atan2(Math.sin(an - gap), Math.cos(an - gap))) < .55) continue; S.balls.push({x:B.x, y:B.y - 20, vx:Math.cos(an)*150, vy:Math.sin(an)*150, mine:0, dmg:1, r:8, life:6, col:'#ff6ad5'}); } };
  const boom = (x, y, c) => { S.splat(x, y, S.low() ? 8 : 18, c || '#fff'); fx.push({k:'ring', x, y, t:.4, c}); };
  const stun = (B, s, st, msg2) => { B.rd.down = Math.max(B.rd.down, s); B.rd.stag = Math.min(100, B.rd.stag + st); if (B.rd.stag >= 100) { B.rd.stag = 0; B.rd.down = Math.max(B.rd.down, run.d >= 1 ? 3.6 : 4.2); msg2 = msg2 || 'STAGGERED!'; } if (msg2) { callout = {t:2, n:'💫 ' + msg2, tip:'Big damage window: throw everything!', good:1}; } B.rd.act && endAct(B); };
  const phTop = B => B.max*(1 - (B.ph - 1)/B.phases);
  const startMech = (B, spec) => { const [id, ...rest] = spec.split(':'), arg = rest.join(':'), M = MECH[id]; if (!M) return; const a = {id, arg, t:0, end:2}; B.rd.act = a; if (!['int', 'pz', 'adds', 'bloat'].includes(id)) call(B, id); M.go(B, a, arg);
    if (run.d >= 3 && ['slam', 'charge', 'breath'].includes(id)) a.echo = 1; };
  const endAct = B => { const a = B.rd.act; if (!a) return; B.rd.act = null; const M = MECH[a.id]; if (M && M.done) M.done(B, a); B.rd.next = (B.rd.enraged ? .7 : 1.4) + (run.d ? 0 : .5); if (a.id == 'int') { B.rd.cast = null; run.safe = null; } if (a.id == 'stack' || a.id == 'spread') S.holdMates = false; if (a.id == 'mirror') run.copies = null; if (a.id == 'pz') { if (run.pz) { run.pz = null; B.rd.shield = 0; } } };
  const phaseList = B => { const L = B.rd.K.ph[B.ph - 1].slice(); const add = D().add; if (add == 'adds' && !L.some(s => s.startsWith('adds'))) L.push('adds'); if ((add == 'spread' || add == 'echo') && !L.includes('spread')) L.push('spread'); return L; };
  const arenaEvent = (B, ev) => { if (!ev) return; const r = Math.random;
    if (ev == 'ink') { for (let y = 2; y < FH - 1; y++) for (let x = 1; x < FW - 1; x++) if ((x <= 3 || x >= FW - 4 || y <= 3 || y >= FH - 4) && V(x, y) == 0) setV(x, y, 5); say('🖋 The ink floods the edges of the room! Stay in the middle', 3); }
    if (ev == 'jelly') { for (let i = 0; i < 9; i++) { const x = 3 + Math.floor(r()*(FW - 6)), y = 4 + Math.floor(r()*(FH - 8)); for (let yy = y; yy < y + 2; yy++) for (let xx = x; xx < x + 3; xx++) if (V(xx, yy) == 0) setV(xx, yy, 6); } say('🍮 Jelly everywhere! It’s slow and wobbly', 3); }
    if (ev == 'dark') { run.dark = 1; say('🕯 The lights go out…', 2.6); }
    if (ev == 'maze') { for (const [x, y] of [[12, 6], [12, 7], [21, 6], [21, 7], [12, 17], [12, 18], [21, 17], [21, 18], [5, 12], [6, 12], [27, 12], [28, 12]]) if (V(x, y) == 0) setV(x, y, 1); say('🌀 The walls shift! The arena becomes a maze', 3); }
    if (ev == 'crumble') { run.crum = []; for (let i = 0; i < 14; i++) { const x = 2 + Math.floor(r()*(FW - 4)), y = 4 + Math.floor(r()*(FH - 7)); if (V(x, y) == 0 && Math.hypot(x - 16.5, y - 12) > 5) run.crum.push({x, y, t:2.2}); } say('🌩 The floor is cracking! Get off the cracks', 3); }
    if (ev == 'tide') { run.tide = {t:0, plat:[]}; tideShift(); say('🌊 The water rises! Stand on the raised platforms', 3); }
    if (ev == 'conv') { for (const y of [7, 8, 15, 16]) for (let x = 2; x < FW - 2; x++) if (V(x, y) == 0) setV(x, y, y < 12 ? 8 : 9); say('⚙ The conveyor belts start up!', 3); }
    if (ev == 'grav') { run.grav = {dir:1, t:7, warn:0}; say('🌌 Gravity is pulling! It flips every few seconds', 3); } };
  const tideShift = () => { const T2 = run.tide; for (const q of T2.plat) for (let y = q.y - 1; y <= q.y + 1; y++) for (let x = q.x - 1; x <= q.x + 1; x++) if (V(x, y) == 10) setV(x, y, 4);
    for (let y = 3; y < FH - 2; y++) for (let x = 2; x < FW - 2; x++) if (V(x, y) == 0) setV(x, y, 4);
    const spots = [[6, 6], [27, 6], [6, 17], [27, 17], [16, 12], [11, 9], [22, 15], [16, 5]].sort(() => Math.random() - .5).slice(0, 4); T2.plat = spots.map(([x, y]) => ({x, y})); for (const q of T2.plat) for (let y = q.y - 1; y <= q.y + 1; y++) for (let x = q.x - 1; x <= q.x + 1; x++) if (V(x, y) == 4) setV(x, y, 10); T2.t = 13; };
  const bossAI = (B, dt) => { const rd = B.rd; if (!rd) return; if (intro) { intro.t -= dt; if (intro.t <= 0) intro = null; return; }
    run.fight = (run.fight || 0) + dt; rd.enr -= dt; if (rd.enr <= 0 && !rd.enraged) { rd.enraged = 1; callout = {t:3, n:'😡 ENRAGED!', tip:'It hits harder and faster now. Finish it!'}; S.shakeV = 10; }
    rd.weakT = Math.max(0, rd.weakT - dt); B.bloat = Math.max(0, (B.bloat || 0) - dt); B.throatT = Math.max(0, (B.throatT || 0) - dt); rd.heatT -= dt; if (rd.heatT <= 0) rd.heat = 0; B.heat = rd.heat;
    if (rd.down > 0) { rd.down -= dt; if (rd.down <= 0) rd.down = 0; return; }
    const shielded = S.foes.some(f => f.rf && (f.job == 'shield') && !f.dead); rd.shieldA = shielded;
    // heal helpers
    for (const f of S.foes) if (f.rf && f.job == 'heal' && !f.dead) { f.hT = (f.hT || 2) - dt; if (f.hT <= 0) { f.hT = 2; B.hp = Math.min(phTop(B), B.hp + B.max*.012); fx.push({k:'beam', x:f.x, y:f.y - 18, x2:B.x, y2:B.y - 30, t:.4, c:'#7fe08a'}); } }
    // the current attack
    if (rd.act) { const a = rd.act; a.t += dt; const M = MECH[a.id]; if (M.tick) M.tick(B, a, dt); if (rd.act === a && a.t >= a.end) endAct(B); }
    else { rd.next -= dt; if (rd.next <= 0) { const L = phaseList(B); startMech(B, L[rd.q % L.length]); rd.q++; } }
    // moving: melee bosses go for the tank (Mau Mau), others keep their distance
    const busy = rd.act && ['charge', 'dive', 'crawl', 'mirror', 'int', 'pz'].includes(rd.act.id);
    if (!busy) { const tank = W.mau && run.tank.down <= 0 ? mau : p, far = B.runT > 0 ? 260 : rd.K.look == 'engine' ? 9999 : 120 + B.r, tx = B.runT > 0 ? p.x + Math.cos(B.t)*260 : tank.x, ty = B.runT > 0 ? p.y + Math.sin(B.t)*200 : tank.y, d2 = Math.hypot(tx - B.x, ty - B.y);
      B.runT = Math.max(0, (B.runT || 0) - dt); if (d2 > far) { const a2 = Math.atan2(ty - B.y, tx - B.x), sp = (B.runT > 0 ? 170 : 70)*(rd.enraged ? 1.4 : 1), nx = B.x + Math.cos(a2)*sp*dt, ny = B.y + Math.sin(a2)*sp*dt; if (!S.blocked(nx, ny, Math.min(26, B.r*.7))) { B.x = nx; B.y = ny; } } B.face = Math.atan2(tank.y - B.y, tank.x - B.x); B.flip = tank.x < B.x; }
    // basic attack: a swipe at the tank. If the tank is down, it comes for you (with a warning)
    rd.swipe -= dt; if (rd.swipe <= 0 && !busy) { rd.swipe = (rd.enraged ? 1.8 : 2.6); if (W.mau && run.tank.down <= 0 && dist(B, mau) < B.r + 120) { run.tank.hp -= Math.max(1, Math.round(D().dmg)); fx.push({k:'swipe', x:mau.x, y:mau.y - 20, t:.3}); A.tone(160, .06, 'square', .03); if (run.tank.hp <= 0) { run.tank.hp = 0; run.tank.down = 10; S.mauSay('Ooof… I need… a little nap…', 2.2); callout = {t:3, n:'🐱 MAU MAU IS DOWN!', tip:'The boss is coming for YOU. Feed him (G) or hold on 10 s'}; } }
      else if (dist(B, p) < B.r + 170) zone({k:'cone', x:B.x, y:B.y, a:Math.atan2(p.y - B.y, p.x - B.x), len:B.r + 130, sp:.6, t:.7*telMul(B), dmg:1, col:'255,69,57'}); } };
  // ---------- hurting raid bosses ----------
  const hurtRB = (B, dmg) => { const rd = B.rd; if (!rd || intro) return true; const b = B.lastBall || {}; B.lastBall = null; const mine = !b.team && b.mine, chg = (b.chg || 0) >= .5 || b.rk;
    if (B.air && !(chg && mine)) { fxNum(B.x, B.y - 120, 'Too high! (charged hits on the wings)', '#9fe8ff'); return true; }
    if (B.air && chg) { rd.wings++; fxNum(B.x, B.y - 120, '🪶 Wing hit ' + rd.wings + '/2', '#ff6ad5'); return true; }
    if (B.wall && !chg) { fxNum(B.x, B.y - 50, 'Needs a CHARGED snowball!', '#9fe8ff'); return true; }
    if (B.wall && chg) { B.wall = 0; stun(B, 3, 45, 'KNOCKED OFF THE WALL!'); }
    if (rd.act && rd.act.id == 'mirror' && mine && run.copies) { run.copies = null; stun(B, 1.5, 35, 'FOUND THE REAL ONE! (wagging tail)'); }
    if (rd.cast && !rd.cast.noInt && chg) { rd.cast = null; run.ints = (run.ints|0) + 1; stun(B, 2, 40, 'INTERRUPTED!'); if (set4('library')) p.hp = Math.min(p.max, p.hp + 1); if (RS.relic == 'library') p.ab = 0; }
    if (B.camoA && B.camoA < .5 && rd.act && rd.act.id == 'camo') { B.camoA = 1; rd.stag = Math.min(100, rd.stag + 20); fxNum(B.x, B.y - 50, 'FOUND YOU!', '#F9BF01'); }
    if (rd.K.pas && rd.K.pas.includes('front') && rd.weakT <= 0 && rd.down <= 0 && b.vx != null) { const fa = B.face || 0, dot = (b.vx*Math.cos(fa) + b.vy*Math.sin(fa))/Math.max(1, Math.hypot(b.vx, b.vy)); if (dot < -.35) { fxNum(B.x, B.y - 60, '🛡 BLOCKED! Hit his back', '#9fe8ff'); dmg *= .15; } else { dmg *= 1.6; rd.stag += 2; } }
    if (rd.K.pas && rd.K.pas.includes('heat') && mine) { rd.heat = (rd.heatT > 0 ? rd.heat : 0) + 1; rd.heatT = 1.3; if (rd.heat >= 3) { rd.heat = 0; stun(B, 3, 60, 'OVERHEAT!'); boom(B.x, B.y - 30, '#ff4539'); } }
    let m = .6; if (rd.weakT > 0) m *= 2.2*(RS.relic == 'temple' ? 1.3 : 1); if (rd.down > 0) m *= 2.6*(RS.relic == 'labyrinth' ? 1.3 : 1); if (rd.shield || rd.shieldA) { m *= .08; if (Math.random() < .2) fxNum(B.x, B.y - 70, '🛡 Shielded!', '#9fe8ff'); }
    if (mod('glass')) m *= 2; if (set2()) m *= 1.1; if (run.buffT > 0) m *= run.buffHungry ? 1.5 : 1.3; if (RS.role == 'Damage') m *= 1.12; if (RS.relic == 'void' && chg) m *= 1.5; if (RS.relic == 'hollow' && B.hp < B.max/2) m *= 1.2; if (b.rk) m *= 1.5;
    let d2 = dmg*m; if (mine) { run.hits++; if (RS.relic == 'citadel' && run.hits % 5 == 0) { d2 += 6*X.armM(); fx.push({k:'bolt', x:B.x, y:B.y, t:.35}); } if (set4('citadel') && run.hits % 6 == 0) { d2 += 4*X.armM(); fx.push({k:'bolt', x:B.x + 10, y:B.y, t:.35}); }
      if (RS.relic == 'clockwork' && run.hits % 4 == 0) d2 += 2*X.armM(); if (RS.relic == 'kitchen' && run.hits % 8 == 0) p.hp = Math.min(p.max, p.hp + 1); }
    const sg = (chg ? 3 : .6)*(RS.role == 'Support' ? 1.3 : 1)*(RS.relic == 'catacombs' && chg ? 1.5 : 1) + (set4('catacombs') ? 2 : 0) + (rd.weakT > 0 ? 4 : 0); if (rd.down <= 0 && !(rd.shield || rd.shieldA)) { rd.stag += sg; if (rd.stag >= 100) stun(B, 0, 0); }
    B.hp -= d2; B.flash = .1; fxNum(B.x + (Math.random() - .5)*30, B.y - B.r - 10, '-' + Math.round(d2*10)/10, rd.weakT > 0 || rd.down > 0 ? '#F9BF01' : '#FF4539');
    const np = B.phases, ph = Math.min(np, 1 + Math.floor((1 - Math.max(0, B.hp)/B.max)*np));
    if (ph > B.ph && B.hp > 0) { B.ph = ph; endAct(B); rd.q = 0; rd.next = 2.2; hz = hz.filter(h => h.k == 'wave' ? false : true); run.cp = {k:B.k, ph}; S.shakeV = 12; A.sfx('bad'); banner = {t:3, a:'PHASE ' + ph + ' / ' + np, b:(rd.K.arena && rd.K.arena[ph - 1]) ? 'The arena changes!' : 'New attacks incoming!'}; arenaEvent(B, rd.K.arena && rd.K.arena[ph - 1]); B.talk = phaseLine(B, ph); B.talkT = 3; }
    if (B.hp <= 0) S.bossDown(B); return true; };
  const phaseLine = (B, ph) => ({loki:['', '', 'Loki: “The ink! My books! You’ll pay for the dry-cleaning!”', 'Loki: “Which Loki is the REAL Loki? (It’s me. I’m all of them. Mostly.)”', 'Loki: “FINE! Full power! AWOOOOO!”'], warden:['', '', 'The Crypt Warden: “Darkness. Let the candles sleep.”', 'The Crypt Warden: “Rise, my guards. RISE!”'],
    mazemind:['', '', 'The Maze Mind: “Shift! Turn! Lose yourself!”', 'The Maze Mind: “Think FASTER!”'], thunderhawk:['', '', 'The Thunderhawk: “SKRAAAA!” *it calls the storm*', '*The floor of the Eyrie begins to crack*'], yeti:['', '', 'Yeti King: “ROOOAR! I’ll do it MYSELF!”', 'Yeti King: “GUARDS! AGAIN! PROTECT THE GOLD!”'],
    meatloaf:['', '', 'The Mega Meatloaf: “GLORP GLORP.” (The floor turns to jelly)', 'The Mega Meatloaf: “…GLORP!!!”'], leviathan:['', '', '*The water rises. Find the platforms!*', '*The Leviathan’s eyes glow white*'], dshadow:['', '', 'Shadow: “Can you see me? No? Good.”', 'Shadow: “All his tricks. All of them. At once.”'],
    engine:['', '', 'Frost Engine: “CONVEYORS: ON. PRESSURE: RISING.”', 'Frost Engine: “WARNING. WARNING. ANGRY.”'], herald:['', '', 'The Void Herald: “Up is down now.”', 'The Void Herald: “The floor was never real.”', 'The Void Herald: “Let the last star fall.”']}[B.rd.K.look] || [])[ph] || (B.n + ' grows angrier!');
  // ---------- boss defeated: next floor, or victory ----------
  const rbDown = B => { const rd = B.rd || {}; hz = []; run.copies = null; run.tail = null; run.bh = null; run.pz = null; run.safe = null; run.wind = null; run.grav = null; run.slowT = 0; S.holdMates = false; boom(B.x, B.y, '#ffe9a0'); S.cheerT = 3; S.shakeV = 10; S.REG['rd_' + run.R.id].mood = 'r_' + run.R.id;
    S.foes = S.foes.filter(f => !f.rf); if (rd.mini) { floorDone(); say('🏆 The guardian falls! The door opens', 3); give1('tok', 4); return; } victory(); };
  const victory = () => { const R = run.R, d = run.d, k2 = R.id + ':' + d, secs = Math.round(run.t), first = !RS.lock.got[k2], loot = [], mul = (mod('treasure') ? 2 : 1)*D().loot*(1 + .1*run.key);
    RS.clr[k2] = (RS.clr[k2]|0) + 1; RS.maxD[R.id] = Math.max(RS.maxD[R.id]|0, d + 1); W.raids = W.raids || {}; W.raids[R.id] = (W.raids[R.id]|0) + 1; if (!RS.best[k2] || secs < RS.best[k2]) RS.best[k2] = secs; RS.keys[R.id] = Math.max(RS.keys[R.id]|0, run.key + 1);
    if (run.deaths == 0) RS.nd = (RS.nd|0) + 1; RS.troph[R.id] = Math.max(RS.troph[R.id]|0, d + 1); X.stat && X.stat('snowRaids', 1, 'add');
    const tok = Math.round((10 + 5*d + run.key)*(mod('treasure') ? 2 : 1)*(set4('vault') ? 1.5 : 1)*(RS.relic == 'vault' ? 1.25 : 1)); RS.tok += tok; loot.push({e:'🎟', n:tok + ' Raid Tokens', c:'#F9BF01'});
    const fr = Math.round((first ? 60 : 20)*mul), fl = Math.round((first ? 2500 : 700)*mul); S.give({frost:fr, flakes:fl, xp:300 + 100*d, score:8000*(d + 1)}); loot.push({e:'🔷', n:fr + ' Frost Crystals', c:'#64CDF5'}, {e:'❄', n:A.fmt ? A.fmt(fl) + ' snowflakes' : fl + ' snowflakes', c:'#fff'});
    W.treats = (W.treats || 0) + 3 + d; loot.push({e:'🐟', n:(3 + d) + ' Mau Mau treats', c:'#c4601a'});
    if (first) { RS.lock.got[k2] = 1; const it = makeSet(R, [2, 3, 4, 5][d] + (run.key >= 10 ? 1 : 0)); if (it) loot.push({e:'🛡', n:it.name + ' (' + ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Snow'][it.rar] + ')', c:'#E9B9F7', big:1});
      const relicCh = [.2, .35, .6, 1][d]; if (!RS.relics[R.id] && Math.random() < relicCh) { RS.relics[R.id] = 1; loot.push({e:'✨', n:'RELIC: ' + R.relic.n + ' · ' + R.relic.d, c:'#ff6ad5', big:1}); }
      if (d >= 2 && !W.titles[R.n.replace(/^The |’s.*$/g, '') + ' Champion']) { const tt = champ(R); W.titles[tt] = 1; loot.push({e:'🎖', n:'Title: ' + tt, c:'#F9BF01'}); } }
    else if (Math.random() < .35) { const it = makeSet(R, Math.max(1, d + 1)); if (it) loot.push({e:'🛡', n:it.name, c:'#E9B9F7'}); }
    if (d == 3 && !W.titles['Nightmare Conqueror']) { W.titles['Nightmare Conqueror'] = 1; loot.push({e:'🎖', n:'Title: Nightmare Conqueror', c:'#ff4539'}); }
    if (RAIDS.every(R2 => RS.clr[R2.id + ':0'] || RS.clr[R2.id + ':1'] || RS.clr[R2.id + ':2'] || RS.clr[R2.id + ':3']) && !W.titles['Raid Leader']) { W.titles['Raid Leader'] = 1; loot.push({e:'🎖', n:'Title: Raid Leader', c:'#F9BF01'}); }
    if ((RS.keys[R.id]|0) >= 10 && !W.titles.Keymaster) { W.titles.Keymaster = 1; loot.push({e:'🎖', n:'Title: Keymaster', c:'#F9BF01'}); }
    loot.push({e:'🔑', n:'Key +' + RS.keys[R.id] + ' unlocked for ' + R.n, c:'#9fe8ff'}); if (d < 3 && (RS.maxD[R.id]|0) == d + 1) loot.push({e:'⭐', n:DIFF[d + 1].n + ' difficulty unlocked!', c:DIFF[d + 1].c});
    loot.push({e:'🏆', n:'Trophy: ' + R.n + ' (' + DIFF[d].n + ') for your Trophy Hall', c:'#F9BF01'});
    try { const C2 = window.WLCloud; if (C2 && C2.postScore && C2.me && C2.me()) { const u = A.username || 'player'; C2.postScore('raid_' + R.id + '_' + d, {u, s:Math.max(1, 36000 - secs)}, 36000); C2.postScore('raidkey', {u, s:RS.keys[R.id]}, 100000);
      if (d >= 2 && !RS.wfDone[R.id]) { RS.wfDone[R.id] = 1; C2.postScore('raidwf_' + R.id, {u, s:Math.max(1, 1e8 - Math.floor((Date.now() - Date.UTC(2026, 10, 1))/6e4))}, 1e8); } } } catch (e) {}
    vic = {t0:performance.now(), t:0, R, d, secs, deaths:run.deaths, loot, key:run.key, medals:[run.deaths == 0 ? '🥇 No-death clear' : null, secs < 420 ? '⚡ Speed clear' : null, run.ints ? '🎯 Interrupts: ' + run.ints : null].filter(Boolean)};
    RS.run = null; S.save(); A.sfx('win'); if (window.WLMusic && window.WLMusic.mood) try { window.WLMusic.mood('calm'); } catch (e) {} };
  const champ = R => ({library:'Library Champion', catacombs:'Catacomb Champion', labyrinth:'Labyrinth Champion', citadel:'Storm Champion', vault:'Vault Champion', kitchen:'Kitchen Champion', temple:'Temple Champion', hollow:'Hollow Champion', clockwork:'Clockwork Champion', void:'Void Champion'})[R.id];
  // ---------- updating a floor ----------
  const update = dt => { if (!run) return; if (vic) return; run.t += dt; F.t += dt; wt += dt; const o = F.obj, R = run.R;
    for (const q of timers) q.t -= dt; const due = timers.filter(q => q.t <= 0); timers = timers.filter(q => q.t > 0); due.forEach(q => q.fn());
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; } if (callout) { callout.t -= dt; if (callout.t <= 0) callout = null; }
    run.buffT = Math.max(0, run.buffT - dt); run.slowT = Math.max(0, (run.slowT || 0) - dt); if (run.slowT > 0) { p.vx *= Math.pow(.05, dt); p.vy *= Math.pow(.05, dt); }
    // tank (Mau Mau): healers keep him up; a treat (G) refills him; Mau Mau’s Hungry week = big buff
    const tk = run.tank; if (tk.down > 0) { tk.down -= dt; if (tk.down <= 0) { tk.hp = Math.ceil(tk.max/2); S.mauSay('I’m BACK! Who wants some?!', 2); } } else if (tk.hp < tk.max) { run.healT = (run.healT || 0) - dt; if (run.healT <= 0) { const med = mates.filter(m => m.role == 'medic' && !m.ko).length; run.healT = med ? 4/med : 6; tk.hp++; } }
    if ((W.treats|0) < lastTreat) { tk.hp = tk.max; tk.down = 0; if (mod('hungry')) { run.buffT = 15; run.buffHungry = 1; callout = {t:2.4, n:'🍗 MAU MAU’S HUNGRY! ×1.5 damage!', tip:'', good:1}; } } lastTreat = W.treats|0;
    // no healer on the team? a Raid Spirit fills the Healer role; Voidwalker set heals too; Healer role regenerates
    if (!mates.some(m => m.role == 'medic')) { run.spiritT += dt; if (run.spiritT >= 14) { run.spiritT = 0; if (p.hp < p.max) { p.hp++; fxNum(p.x, p.y - 44, '👻 Raid Spirit +♥', '#9fffe0'); } } }
    if (set4('void') || RS.role == 'Healer') { run.voidT += dt; if (run.voidT >= (set4('void') ? 20 : 12)) { run.voidT = 0; if (p.hp < p.max) { p.hp++; fxNum(p.x, p.y - 44, '+♥', '#ff6ad5'); } } }
    if (set4('hollow') && p.rollCd > 0) p.rollCd = Math.max(0, p.rollCd - dt*.4);
    // enemy deaths: explosive / bolstering weeks, bomb drops
    const alive = new Set(S.foes.filter(f => !f.dead)); for (const f of seen) if (!alive.has(f)) { seen.delete(f); if (!f.rf || !f.dead) continue;
      if (FOE[f.k].bomb || (f.job == 'bomb')) kicks.push({k:'bomb', x:f.x, y:f.y, vx:0, vy:0, fuse:6});
      if (mod('boom')) zone({x:f.x, y:f.y, r:58, t:.9, dmg:1, col:'255,120,40'}); if (mod('bolster')) for (const f2 of alive) if (f2.rf) { f2.hp += 1; f2.bol = (f2.bol || 0) + 1; } }
    for (const f of alive) seen.add(f);
    // hazards
    for (const h of hz) { if (h.k == 'wave') { h.r += h.sp*dt; if (!h.hit && Math.abs(dist(h, p) - h.r) < h.w && p.inv <= 0) { h.hit = 1; hitMe(h.dmg); } if (h.r > 1400) h.dead = 1; continue; }
      h.t -= dt; if (h.t <= 0 && !h.dead) { h.dead = 1; if (h.dmg > 0 && inZone(h, p)) hitMe(h.dmg); if (h.dmg > 0) { boom(h.x, h.y, 'rgb(' + h.col + ')'); if (S.boss && h.k == 'circle' && h.ic && dist(h, S.boss) < h.r + S.boss.r*.5) { stun(S.boss, 2.6, 45, 'THE ICICLE HIT!'); S.boss.hp -= S.boss.max*.02; } }
        if (h.echo == null && run.d >= 3 && h.dmg > 0 && h.k == 'circle' && S.boss) setTimeout0(() => hz.push({...h, x:h.x + (p.x - h.x)*.5, y:h.y + (p.y - h.y)*.5, t:.7, T:.7, dead:0, echo:1}), .3); } }
    hz = hz.filter(h => !h.dead);
    // reflect: your snowball hits a gold orb → it flies back at the boss
    for (const b of S.balls) { if (!b.refl || b.mine) continue; for (const m of S.balls) if (m.mine && !m.team && m.life > 0 && Math.hypot(m.x - b.x, m.y - b.y) < b.r + m.r + 6) { m.life = 0; b.mine = 1; b.rk = 1; b.hits = []; b.dmg = X.armM()*3; const B = S.boss; const an = B ? Math.atan2(B.y - b.y, B.x - b.x) : Math.atan2(-b.vy, -b.vx); b.vx = Math.cos(an)*480; b.vy = Math.sin(an)*480; b.life = 2; b.col = '#fff27a'; fxNum(b.x, b.y - 20, 'REFLECT!', '#F9BF01'); A.tone(880, .06, 'triangle', .04); break; } }
    // mirror copies, tail decoy, icicles, black holes, kickables
    const myBalls = S.balls.filter(b => b.mine && b.life > 0);
    if (run.copies) for (const c of run.copies) for (const b of myBalls) if (Math.hypot(b.x - c.x, b.y - 30 - c.y) < 26) { b.life = 0; c.dead = 1; boom(c.x, c.y - 20, '#F9BF01'); zone({x:c.x, y:c.y, r:60, t:.7, dmg:1, col:'255,69,57'}); fxNum(c.x, c.y - 70, 'A fake! (no wag)', '#c08aff'); }
    if (run.copies) { run.copies = run.copies.filter(c => !c.dead); const B = S.boss; if (B && B.rd && B.rd.act && B.rd.act.id == 'mirror' && B.lastHitT > 0) {} }
    if (run.tail) { run.tail.t -= dt; for (const b of myBalls) if (Math.hypot(b.x - run.tail.x, b.y - run.tail.y) < 22) { b.life = 0; run.tail.hp--; S.splat(run.tail.x, run.tail.y, 6, '#efe2a2'); if (run.tail.hp <= 0) { run.tail = null; const B = S.boss; if (B && B.rd) { B.camoA = 0; B.rd.weakT = 4; callout = {t:2.4, n:'🦎 HE DROPPED HIS GUARD!', tip:'Weak point open: hit him now!', good:1}; B.runT = 0; if (B.rd.act && B.rd.act.id == 'tail') { B.rd.act.end = 0; } } break; } } }
    if (run.ic) for (const ic of run.ic) { ic.t = Math.max(0, ic.t - dt); if (ic.t > 0) continue; for (const b of myBalls) if (Math.hypot(b.x - ic.x, b.y - (ic.y - 10)) < 20) { b.life = 0; ic.t = 14; const h = zone({x:ic.x, y:ic.y, r:58, t:.55, dmg:1, col:'159,232,255'}); h.ic = 1; A.tone(1200, .05, 'triangle', .03); break; } }
    if (run.bh) { for (const h of run.bh) { h.t -= dt; const d2 = dist(h, p); if (d2 < 420 && d2 > 4) { const a2 = Math.atan2(h.y - p.y, h.x - p.x), f2 = 240*(1 - d2/460); p.vx += Math.cos(a2)*f2*dt*3; p.vy += Math.sin(a2)*f2*dt*3; } h.hit -= dt; if (d2 < 38 && h.hit <= 0) { h.hit = .8; hitMe(1); } } run.bh = run.bh.filter(h => h.t > 0 && !h.closed); }
    for (const k of kicks) { const sp = Math.hypot(p.vx, p.vy); if (k.k != 'chunk' && dist(k, p) < 28 && sp > 60) { const a2 = Math.atan2(k.y - p.y, k.x - p.x); k.vx = Math.cos(a2)*560; k.vy = Math.sin(a2)*560; A.tone(400, .04, 'triangle', .03); }
      if (k.k == 'chunk' && dist(k, p) < 30 && !run.carry) { run.carry = 'chunk'; k.dead = 1; say('🍖 Got a meat chunk! Press G to feed Mau Mau', 2.4); continue; }
      k.x += k.vx*dt; k.y += k.vy*dt; k.vx *= Math.pow(.2, dt); k.vy *= Math.pow(.2, dt); const L = toL(k.x, k.y); if (solidL(L.x, L.y)) { k.x -= k.vx*dt*2; k.y -= k.vy*dt*2; k.vx *= -.6; k.vy *= -.6; }
      const B = S.boss; if (k.k == 'toy' && B && B.rd && Math.hypot(k.vx, k.vy) > 80 && dist(k, B) < 520 && !B.rd.act && !B.fetchT) { B.fetchT = 3.2; B.ftx = k; B.talk = ['Loki: “BALL!!! …No! Focus! …BALL!!!”', 'Loki: “I can stop any time I want. …SQUEAKY!”', 'Loki: “Must… not… chase… MUST CHASE!”'][Math.floor(Math.random()*3)]; B.talkT = 2.4; callout = {t:2.4, n:'🎾 FETCH! His back is open!', tip:'Hit him while he chases the toy', good:1}; }
      if (k.k == 'bomb') { k.fuse -= dt; if (B && dist(k, B) < B.r + 22 && Math.hypot(k.vx, k.vy) > 60) k.fuse = 0; if (k.fuse <= 0) { k.dead = 1; boom(k.x, k.y, '#ff4539'); S.shakeV = 8; if (B && B.rd && dist(k, B) < B.r + 90) { B.hp -= B.max*.04; stun(B, 2.5, 45, 'BOOM! Bomb hit!'); } if (dist(k, p) < 90) hitMe(1); } }
      if (k.k == 'orb' && run.bh) for (const h of run.bh) if (dist(k, h) < 44) { h.closed = 1; k.dead = 1; boom(h.x, h.y, '#ffffff'); if (B && B.rd) stun(B, 1.5, 35, 'BLACK HOLE CLOSED!'); } }
    kicks = kicks.filter(k => !k.dead);
    // Loki chases the toy (or Loki’s Ball, B)
    { const B = S.boss; const lb = S.lball && S.lball(); if (B && B.rd && B.rd.K.look == 'loki' && lb && !B.fetchT && !B.rd.act) { B.fetchT = 2.6; B.ftx = lb; B.talk = 'Loki: “IS THAT MY BALL?!”'; B.talkT = 2; }
      if (B && B.fetchT > 0) { B.fetchT -= dt; const tg = B.ftx; if (tg) { const a2 = Math.atan2(tg.y - B.y, tg.x - B.x); if (dist(tg, B) > 20) { const nx = B.x + Math.cos(a2)*230*dt, ny = B.y + Math.sin(a2)*230*dt; if (!S.blocked(nx, ny, 20)) { B.x = nx; B.y = ny; } } B.flip = tg.x < B.x; } B.rd.weakT = Math.max(B.rd.weakT, .2); if (B.fetchT <= 0) { B.fetchT = 0; B.ftx = null; } } }
    // arena states: wind, gravity, crumbling floor, tide, conveyors, jelly/ink/water slowing
    if (run.wind) { const w = run.wind; w.t += dt; if (w.t > w.tell) { p.vx += Math.cos(w.a)*380*dt*3; p.vy += Math.sin(w.a)*380*dt*3; } if (w.t > w.tell + w.T) run.wind = null; }
    if (run.grav) { const G = run.grav; G.t -= dt; if (G.t < 2) G.warn = 1; if (G.t <= 0) { G.dir *= -1; G.t = 7; G.warn = 0; A.tone(200, .2, 'sine', .04); } p.vy += G.dir*260*dt*(G.warn ? .4 : 1); }
    if (run.crum) { for (const c of run.crum) { c.t -= dt; if (c.t <= 0 && !c.done) { c.done = 1; setV(c.x, c.y, 3); const L = toL(p.x, p.y); if (L.x == c.x && L.y == c.y) { hitMe(1); p.x = F.spawn.x; p.y = F.spawn.y - 200; } } } }
    if (run.tide) { run.tide.t -= dt; if (run.tide.t <= 0) tideShift(); const L = toL(p.x, p.y); if (V(L.x, L.y) == 4 && !set4('temple')) { run.wetT = (run.wetT || 0) + dt; if (run.wetT > 2.5) { run.wetT = 0; hitMe(1); fxNum(p.x, p.y - 40, '🥶 Freezing water!', '#64CDF5'); } } else run.wetT = 0; }
    { const L = toL(p.x, p.y), v = V(L.x, L.y); if (v == 8) p.vx += 260*dt*3; if (v == 9) p.vx -= 260*dt*3; if (set4('temple') && v == 4) { p.vx *= 1.02; p.vy *= 1.02; } }
    // floor objectives
    const code = F.code;
    if (code == 'c' && !F.done) { const n = S.foes.filter(f => f.rf && !f.dead).length; if (n == 0) { o.next -= dt; if (o.next <= 0) { if (o.wave >= o.waves) floorDone(); else { o.wave++; o.next = 1.4; const cnt = 4 + Math.floor(F.fi/2) + run.d + (mod('swarm') ? 2 : 0); for (let i = 0; i < cnt; i++) { const q = wp(4 + Math.random()*(FW - 8), 4 + Math.random()*8); addFoe(R.pool[i % R.pool.length], q.x, q.y); } if (o.wave == o.waves) { const q = wp(16.5, 6); addFoe(R.id == 'vault' ? 'r_mimic' : R.id == 'temple' ? 'r_crab' : R.id == 'kitchen' ? 'r_cup' : 'golem', q.x, q.y); } say('⚔ Wave ' + o.wave + ' / ' + o.waves, 1.6); } } } }
    if (code == 'r' && !F.done) { if (!o.seen && dist(o.tab, p) < 170) { o.seen = 1; say('📜 Rune order: ' + o.order.map(i => ['❄', '🔥', '🌙', '⭐'][i]).join(' → '), 3); }
      for (const pl of o.plates) { if (dist(pl, p) < 30 && o.last !== pl.i) { o.last = pl.i; if (o.order[o.step] == pl.i) { o.step++; A.sfx('coin'); boom(pl.x, pl.y, '#9fe8ff'); if (o.step >= 4) floorDone(); } else { o.step = 0; A.sfx('bad'); say('✖ Wrong rune! The plates reset… and something woke up', 2.2); for (let i = 0; i < 2; i++) addFoe(pick(R.pool), pl.x + (i ? 80 : -80), pl.y - 60); } } }
      if (o.last != null && o.plates.every(pl => dist(pl, p) > 44)) o.last = null; }
    if (code == 'b' && !F.done) { const dur = [24, 21, 18, 15][run.d]; for (const b2 of o.br) if (b2.lit > 0) { b2.lit -= dt; if (b2.lit <= 0) { b2.lit = 0; say('🕯 A brazier went out!', 1.4); } } if (o.br.every(b2 => b2.lit > 0)) floorDone();
      o.puffT -= dt; if (o.puffT <= 0 && o.br.some(b2 => b2.lit > 0)) { o.puffT = [7, 6, 5, 4][run.d]; const s2 = pick([wp(2, 12), wp(FW - 3, 12), wp(16.5, 3)]); puffs.push({...s2, hp:1}); } o.dur = dur;
      for (const q of puffs) { const tg = o.br.filter(b2 => b2.lit > 0).sort((u, v) => dist(u, q) - dist(v, q))[0]; if (!tg) { q.dead = 1; continue; } const a2 = Math.atan2(tg.y - 30 - q.y, tg.x - q.x); q.x += Math.cos(a2)*75*dt; q.y += Math.sin(a2)*75*dt; if (dist(q, {x:tg.x, y:tg.y - 30}) < 24) { tg.lit = 0; q.dead = 1; say('💨 A spirit blew out a brazier! Hit the spirits before they reach them', 2.4); }
        for (const b of myBalls) if (Math.hypot(b.x - q.x, b.y - q.y) < 20) { b.life = 0; q.dead = 1; boom(q.x, q.y, '#9fffe0'); } } puffs = puffs.filter(q => !q.dead); }
    if (code == 'l' && !F.done) { for (const b2 of o.bells) { b2.sw = Math.max(0, b2.sw - dt); for (const b of myBalls) if (Math.hypot(b.x - b2.x, b.y - (b2.y - 30)) < 24) { b.life = 0; ringBell(b2); } } }
    if (code == 'k' && !F.done) { for (const k of o.keys) if (!k.got && dist(k, p) < 34) { k.got = 1; A.sfx('coin'); boom(k.x, k.y, '#F9BF01'); say('🗝 Key ' + o.keys.filter(q => q.got).length + ' / 3', 1.6); } if (o.keys.every(k => k.got)) floorDone(); }
    if (code == 'g') { o.tr -= dt; if (o.tr <= 0) { o.tr = [1.25, 1.1, .95, .85][run.d]; const pl = toL(p.x, p.y), y = Math.max(3, Math.min(FH - 3, pl.y + Math.floor(Math.random()*5) - 3)), gap = 2 + Math.floor(Math.random()*(FW - 6));
        for (let x = 1; x < FW - 1; x += 2) if (Math.abs(x - gap) > 1) zone({k:'circle', ...wp(x + .5, y), r:40, t:1.05*D().tel*(set4('labyrinth') ? 1.2 : 1), dmg:1, col:R.trap == 'lightning' ? '255,240,120' : R.trap == 'icicle' ? '159,232,255' : '255,69,57', trap:R.trap}); }
      if (!F.done) F.done = true; }
    if (code == 'm') { F.mzT -= dt; if (F.mzT < 1.6 && !F.mzW) { F.mzW = 1; F.nextW = new Set(mazeWallTiles(F.mazes[1 - F.mz]).map(([a, b]) => b*FW + a)); } if (F.mzT <= 0) { F.mzT = 14; F.mzW = 0; applyMaze(1 - F.mz); const L = toL(p.x, p.y); if (solidL(L.x, L.y)) { const q = nearFree(L.x, L.y); const w = wp(q.x, q.y); p.x = w.x; p.y = w.y; } say('🌀 The walls shift!', 1.6); A.tone(220, .3, 'sine', .04); }
      o.trapT = (o.trapT || 3) - dt; if (o.trapT <= 0) { o.trapT = [5, 4, 3.4, 2.8][run.d]; zone({x:p.x + (Math.random() - .5)*120, y:p.y + (Math.random() - .5)*120, r:52, t:1.2*D().tel, dmg:1, col:'159,255,224'}); } if (!F.done) F.done = true; }
    if ((code == 'G' || code == 'B') && !o.spawned) { o.spawnT -= dt; if (o.spawnT <= 0) { o.spawned = 1; spawnRB(code == 'G'); } }
    // the door at the top
    if (F.door && p.y < 1.9*TS && Math.abs(p.x - wp(16.5, 0).x) < 70) { if (F.fi + 1 < R.fl.length) { enterFloor(F.fi + 1); A.sfx('blip'); } }
    // particles
    const TH = ART.TH[R.th], mk = ART.PART[TH.part], cap = S.low() ? 12 : 46; if (mk && parts.length < cap && Math.random() < dt*20) { const q = {x:S.cam.x + Math.random()*S.VW, y:S.cam.y + Math.random()*S.VH, s:Math.random()*10, life:4 + Math.random()*3, age:0}; mk(q, wt); parts.push(q); }
    for (const q of parts) { q.x += q.vx*dt; q.y += q.vy*dt; q.life -= dt; q.age += dt; } parts = parts.filter(q => q.life > 0);
    for (const q of fx) q.t -= dt; fx = fx.filter(q => q.t > 0); };
  const nearFree = (x, y) => { for (let r2 = 1; r2 < 6; r2++) for (let dy = -r2; dy <= r2; dy++) for (let dx = -r2; dx <= r2; dx++) if (!solidL(x + dx, y + dy)) return {x:x + dx, y:y + dy}; return toL(F.spawn.x, F.spawn.y); };
  const ringBell = b2 => { const o = F.obj; if (b2.sw > 0) return; b2.sw = .6; A.tone([196, 262, 330, 440][b2.s], .5, 'sine', .07); if (b2.s == 3 - o.step) { o.step++; b2.rung = 1; if (o.step >= 4) floorDone(); } else { o.step = 0; o.miss++; o.bells.forEach(q => q.rung = 0); say('✖ Wrong bell! Start again from the DEEPEST (biggest) bell', 2.4); S.shakeV = 4; for (let i = 0; i < 2; i++) addFoe(pick(run.R.pool), b2.x + (i ? 70 : -70), b2.y - 50); } };
  // the puzzle pieces in boss fights
  const pzUse = it => { const P = run.pz; if (!P || it.on) return; if (P.kind == 'bells') { const want = P.order[P.step]; A.tone([196, 262, 330, 440][it.i], .4, 'sine', .06); if (it.i == want) { it.on = 1; P.step++; } else { P.step = 0; P.items.forEach(q => q.on = 0); P.show = 2.4; say('✖ Wrong order! Watch the Mind flash them again', 2); } return; }
    if (P.kind == 'runes') { if (it.i == P.order[P.step]) { it.on = 1; P.step++; A.sfx('coin'); } else { P.step = 0; P.items.forEach(q => q.on = 0); A.sfx('bad'); say('✖ Wrong valve! Follow the numbers', 2); } return; } it.on = 1; A.sfx('coin'); };
  // ---------- things you can use (E) ----------
  const things = L => { const o = F.obj;
    if (F.fi >= 0 && dist(p, F.spawn) < 140 && !S.boss) L.push({x:F.spawn.x, y:F.spawn.y + 40, n:'Leave raid (saves floor)', f:() => leaveRun('🏕 You left the raid. Resume from the War Table any time', true)});
    if (F.chest && !F.chest.open) L.push({x:F.chest.x, y:F.chest.y, n:'Question chest', f:() => openQChest()});
    if (F.code == 'b' && !F.done) o.br.forEach(b2 => { if (b2.lit <= 0) L.push({x:b2.x, y:b2.y, n:'Light brazier', f:() => { b2.lit = o.dur || 20; A.sfx('coin'); boom(b2.x, b2.y - 30, '#ffb347'); }}); });
    if (F.code == 'l' && !F.done) o.bells.forEach(b2 => L.push({x:b2.x, y:b2.y, n:'Ring bell', f:() => ringBell(b2)}));
    if (run.pz && run.pz.show <= 0) run.pz.items.forEach(it => { if (!it.on) L.push({x:it.x, y:it.y, n:{braziers:'Light', bells:'Ring', runes:'Turn valve', rods:'Raise rod'}[run.pz.kind] || 'Use', f:() => pzUse(it)}); }); };
  const openQChest = () => { const c = F.chest; c.open = true; const go = n => { RS.tok += n; fxNum(c.x, c.y - 30, '+' + n + ' 🎟', '#F9BF01'); S.give({frost:3*n}); S.save(); };
    S.quiz = true; let ok = false; try { ok = X.learn2('RAID QUESTION CHEST · ANSWER RIGHT FOR BONUS TOKENS', () => { S.quiz = false; go(4); }, () => { S.quiz = false; go(1); }); } catch (e) {} if (!ok) { S.quiz = false; go(2); } };
  // ---------- goal arrow (always points at the objective) ----------
  const goal = () => { if (!run || !F) return null; const o = F.obj, R = run.R, pre = R.e + ' ' + (F.fi + 1) + '/' + R.fl.length + ' · ', B = S.boss;
    if (vic) return null; if (F.done && F.code != 'g' && F.code != 'm') return {...wp(16.5, 1), n:pre + 'Go through the door at the top'};
    if (B && B.rd) { if (run.pz) { const nx = run.pz.items.find(q => !q.on); if (nx) return {x:nx.x, y:nx.y, n:pre + '🧩 Puzzle: ' + run.pz.kind + ' (' + Math.ceil(run.pz.t) + ' s)'}; } if (run.bh && run.bh.length) { const k = kicks.find(q => q.k == 'orb'); if (k) return {x:k.x, y:k.y, n:pre + 'Kick a light orb into the black hole'}; }
      if (B.bloat > 0 && !run.carry) { const k = kicks.find(q => q.k == 'chunk'); if (k) return {x:k.x, y:k.y, n:pre + 'Grab a meat chunk, then press G'}; } return {x:B.x, y:B.y, n:pre + 'Defeat ' + B.n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase())}; }
    switch (F.code) {
      case 'c': { const f = S.foes.filter(q => q.rf && !q.dead).sort((u, v) => dist(u, p) - dist(v, p))[0]; return f ? {x:f.x, y:f.y, n:pre + 'Defeat the enemies (wave ' + o.wave + '/' + o.waves + ')'} : {...wp(16.5, 8), n:pre + 'Get ready…'}; }
      case 'r': return o.seen ? {...o.plates[o.order[o.step]], n:pre + 'Step on the runes in order (' + o.step + '/4): ' + o.order.map(i => ['❄', '🔥', '🌙', '⭐'][i]).join(' ')} : {...o.tab, n:pre + 'Read the rune tablet'};
      case 'b': { const b2 = o.br.filter(q => q.lit <= 0).sort((u, v) => dist(u, p) - dist(v, p))[0]; return {x:(b2 || o.br[0]).x, y:(b2 || o.br[0]).y, n:pre + 'Light all 4 braziers (' + o.br.filter(q => q.lit > 0).length + '/4 lit)'}; }
      case 'l': { const want = o.bells.find(q => q.s == 3 - o.step); return o.miss ? {x:want.x, y:want.y, n:pre + 'Ring the bells: deepest → highest (' + o.step + '/4)'} : {...o.tab, n:pre + 'Ring the bells from the deepest (biggest) to the highest (' + o.step + '/4)'}; }
      case 'k': { const k = o.keys.filter(q => !q.got).sort((u, v) => dist(u, p) - dist(v, p))[0]; return k ? {x:k.x, y:k.y, n:pre + 'Find the keys (' + o.keys.filter(q => q.got).length + '/3)'} : null; }
      case 'm': { const nx = mazeNext(); return {x:nx.x, y:nx.y, n:pre + 'Find the way out of the shifting maze'}; }
      default: return {...wp(16.5, 1), n:pre + (F.code == 'g' ? 'Cross the hall to the door (dodge the red zones!)' : 'Go through the door at the top')}; } };
  const mazeNext = () => { const s = toL(p.x, p.y), goalT = {x:16, y:2}, key = (x, y) => y*FW + x, prev = new Map([[key(s.x, s.y), -1]]), q = [s]; while (q.length) { const c = q.shift(); if (c.y <= goalT.y + 1 && Math.abs(c.x - 16.5) < 2) { let k = key(c.x, c.y), path = []; while (k != -1) { path.push(k); k = prev.get(k); } path.reverse(); const t2 = path[Math.min(path.length - 1, 4)]; return wp(t2 % FW, Math.floor(t2/FW)); }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = c.x + dx, ny = c.y + dy; if (solidL(nx, ny) || prev.has(key(nx, ny))) continue; prev.set(key(nx, ny), key(c.x, c.y)); q.push({x:nx, y:ny}); } } return wp(16.5, 1); };
  // ---------- drawing ----------
  const drawTiles = () => { const cam = S.cam, x0 = Math.floor(cam.x/TS) - 1, y0 = Math.floor(cam.y/TS) - 1, x1 = x0 + Math.ceil(S.VW/TS) + 2, y1 = y0 + Math.ceil(S.VH/TS) + 2, t = S.t, th2 = th();
    g.fillStyle = '#080a14'; g.fillRect(cam.x, cam.y, S.VW, S.VH);
    for (let ty = Math.max(0, y0); ty <= Math.min(FH - 1, y1); ty++) for (let tx = Math.max(RX, x0); tx <= Math.min(RX + FW - 1, x1); tx++) { const lx = tx - RX, v = V(lx, ty), x = tx*TS, y = ty*TS, i = (lx*7 + ty*13) % 97;
      if (v == 1) { const isDoor = (lx == 16 || lx == 17) && ty <= 1; if (isDoor) { ART.floorTile(g, th2, x, y, TS, i, lx, ty); continue; } ART.wallTile(g, th2, x, y, TS, V(lx, ty + 1) != 1, i); }
      else if (v == 0 || v == 2) ART.floorTile(g, th2, x, y, TS, i, lx, ty); else ART.specTile(g, th2, ['', '', '', 'gap', 'water', 'ink', 'jelly', 'bog', 'conv', 'conl', 'safe'][v], x, y, TS, t, lx, ty);
      if (F.mzW && v == 0 && F.nextW && F.nextW.has(ty*FW + lx)) { g.fillStyle = 'rgba(159,255,224,' + (.2 + .2*Math.sin(t*12)) + ')'; g.fillRect(x + 4, y + 4, TS - 8, TS - 8); } }
    if (run.crum) for (const c of run.crum) if (!c.done) { const w = wp(c.x, c.y); g.strokeStyle = 'rgba(255,69,57,' + (.5 + .4*Math.sin(t*14)) + ')'; g.lineWidth = 2; g.beginPath(); g.moveTo(w.x - 18, w.y - 10); g.lineTo(w.x - 2, w.y + 2); g.lineTo(w.x + 6, w.y - 6); g.lineTo(w.x + 18, w.y + 12); g.stroke(); }
    const dw = wp(16, 0); ART.door(g, th2, dw.x - TS/2, 0, TS*2, TS*2, F.door, t); const en = wp(16, FH - 1); g.fillStyle = 'rgba(0,0,0,.35)'; ART.rr(g, en.x - TS/2, en.y - TS/2, TS*2, TS, 8); g.fill(); };
  const drawWorld = () => { if (!run) { B0.drawWorld(); drawWarTable(); return; } const t = S.t, th2 = th(), lo = S.low();
    for (const d2 of F.deco) { const q = wp(d2.x - .5, d2.y - .5); if (S.onScreen(q.x, q.y, 120)) (ART.DECO[d2.k] || (() => {}))(g, q.x, q.y + TS*.3, t, d2.i); }
    const o = F.obj;
    if (F.chest && S.onScreen(F.chest.x, F.chest.y)) { ART.DECO.chestd(g, F.chest.x, F.chest.y + 10); if (!F.chest.open) { g.fillStyle = '#fff'; g.font = '800 10px ' + A.font; g.textAlign = 'center'; g.fillText('❓ bonus', F.chest.x, F.chest.y - 24); } }
    if (F.code == 'r') { g.fillStyle = 'rgba(20,32,74,.9)'; ART.rr(g, o.tab.x - 70, o.tab.y - 28, 140, 34, 8); g.fill(); g.font = '18px ' + A.font; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(o.order.map(i => ['❄', '🔥', '🌙', '⭐'][i]).join(' '), o.tab.x, o.tab.y - 4);
      o.plates.forEach(pl => { const lit = F.done || o.order.indexOf(pl.i) < o.step; g.fillStyle = lit ? 'rgba(159,232,255,.9)' : 'rgba(60,70,110,.9)'; ART.rr(g, pl.x - 22, pl.y - 14, 44, 28, 8); g.fill(); g.font = '18px ' + A.font; g.fillStyle = '#fff'; g.fillText(['❄', '🔥', '🌙', '⭐'][pl.i], pl.x, pl.y + 7); }); }
    if (F.code == 'b') o.br.forEach(b2 => brazier(b2.x, b2.y, b2.lit > 0, b2.lit/(o.dur || 20)));
    if (F.code == 'l') { g.fillStyle = 'rgba(20,32,74,.9)'; ART.rr(g, o.tab.x - 120, o.tab.y - 28, 240, 34, 8); g.fill(); g.fillStyle = '#fff'; g.font = '800 12px ' + A.font; g.textAlign = 'center'; g.fillText('🔔 deepest  →  highest', o.tab.x, o.tab.y - 6); o.bells.forEach(b2 => bell(b2.x, b2.y, 14 + (3 - b2.s)*6, b2.rung, b2.sw)); }
    if (F.code == 'k') o.keys.forEach(k => { if (!k.got) { g.font = '26px ' + A.font; g.textAlign = 'center'; g.fillText('🗝', k.x, k.y + 6 + Math.sin(t*3)*3); } });
    if (run.pz) { const P = run.pz; P.items.forEach((it, j) => { if (P.kind == 'braziers' || P.kind == 'rods') { if (P.kind == 'rods') { ART.DECO.rod(g, it.x, it.y + 10, t, j); if (it.on) { g.fillStyle = 'rgba(255,242,122,.4)'; g.beginPath(); g.arc(it.x, it.y - 50, 26, 0, TAU); g.fill(); } } else brazier(it.x, it.y, it.on, 1); }
        else if (P.kind == 'bells') { const fl = P.show > 0 && P.order[Math.floor((2.4 - P.show)/.6)] == it.i; bell(it.x, it.y, 22, it.on || fl, fl ? .3 : 0); if (fl) { g.fillStyle = '#F9BF01'; g.font = '900 20px ' + A.font; g.textAlign = 'center'; g.fillText(String(P.order.indexOf(it.i) + 1), it.x, it.y - 70); } }
        else { g.fillStyle = it.on ? '#9fe8ff' : '#5a6a80'; ART.circ(g, it.x, it.y - 10, 18, it.on ? '#9fe8ff' : '#5a6a80'); g.fillStyle = '#14204a'; g.font = '900 16px ' + A.font; g.textAlign = 'center'; g.fillText(String(P.order.indexOf(it.i) + 1), it.x, it.y - 4); } }); }
    if (run.ic) for (const ic of run.ic) { const rdy = ic.t <= 0; g.fillStyle = rdy ? 'rgba(159,232,255,.35)' : 'rgba(159,232,255,.08)'; g.beginPath(); g.arc(ic.x, ic.y, 26, 0, TAU); g.fill(); if (rdy) { g.fillStyle = '#e8f8ff'; g.beginPath(); g.moveTo(ic.x - 8, ic.y - 40); g.lineTo(ic.x + 8, ic.y - 40); g.lineTo(ic.x, ic.y - 8); g.fill(); g.font = '700 9px ' + A.font; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('hit me', ic.x, ic.y + 14); } }
    if (run.safe) for (const q of run.safe) { g.fillStyle = 'rgba(127,224,138,' + (.25 + .15*Math.sin(t*6)) + ')'; g.beginPath(); g.arc(q.x, q.y, 70, 0, TAU); g.fill(); g.strokeStyle = '#7fe08a'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#fff'; g.font = '800 11px ' + A.font; g.textAlign = 'center'; g.fillText('SAFE', q.x, q.y + 4); }
    if (run.bh) for (const h of run.bh) { for (let k = 0; k < 4; k++) { g.strokeStyle = 'rgba(214,160,255,' + (.5 - k*.1) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(h.x, h.y, 14 + k*12 + Math.sin(t*6 + k)*3, t*(2 + k), t*(2 + k) + 4); g.stroke(); } ART.circ(g, h.x, h.y, 16, '#05030f'); }
    // hazards (red zones)
    for (const h of hz) { const k = h.T ? 1 - Math.max(0, h.t)/h.T : 1, c = h.col || '255,69,57';
      if (h.k == 'wave') { g.strokeStyle = 'rgba(255,200,60,.85)'; g.lineWidth = h.w; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.stroke(); continue; }
      g.fillStyle = 'rgba(' + c + ',' + (.15 + .25*k) + ')'; g.strokeStyle = 'rgba(' + c + ',.9)'; g.lineWidth = 2;
      if (h.k == 'circle') { g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); g.stroke(); g.fillStyle = 'rgba(' + c + ',.35)'; g.beginPath(); g.arc(h.x, h.y, h.r*k, 0, TAU); g.fill(); if (h.gap != null) { g.fillStyle = 'rgba(127,224,138,.6)'; g.beginPath(); g.moveTo(h.x, h.y); g.arc(h.x, h.y, 300, h.gap - .5, h.gap + .5); g.fill(); g.fillStyle = '#fff'; g.font = '800 12px ' + A.font; g.textAlign = 'center'; g.fillText('GAP', h.x + Math.cos(h.gap)*200, h.y + Math.sin(h.gap)*200); }
        if (h.trap == 'lightning' && h.t < .15) fx.push({k:'bolt', x:h.x, y:h.y, t:.2}); }
      else if (h.k == 'rect') { g.save(); g.translate(h.x, h.y); g.rotate(h.a); g.fillRect(0, -h.w/2, h.len, h.w); g.strokeRect(0, -h.w/2, h.len, h.w); g.fillStyle = 'rgba(' + c + ',.35)'; g.fillRect(0, -h.w/2, h.len*k, h.w); g.restore(); }
      else if (h.k == 'cone') { g.beginPath(); g.moveTo(h.x, h.y); g.arc(h.x, h.y, h.len, h.a - h.sp, h.a + h.sp); g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(' + c + ',.3)'; g.beginPath(); g.moveTo(h.x, h.y); g.arc(h.x, h.y, h.len*k, h.a - h.sp, h.a + h.sp); g.closePath(); g.fill(); } }
    // kickables
    for (const k of kicks) { if (k.k == 'toy') { ART.circ(g, k.x, k.y - 6, 9, '#c8102e'); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(k.x, k.y - 6, 6, .3, 2.6); g.stroke(); g.fillStyle = '#fff'; g.font = '700 9px ' + A.font; g.textAlign = 'center'; g.fillText('kick!', k.x, k.y - 20); }
      else if (k.k == 'bomb') { ART.circ(g, k.x, k.y - 8, 11, '#2a2a3a'); if (Math.sin(t*(20 - k.fuse*2)) > 0) ART.circ(g, k.x + 6, k.y - 20, 3, '#ff4539'); g.fillStyle = '#fff'; g.font = '700 9px ' + A.font; g.textAlign = 'center'; g.fillText('kick at boss!', k.x, k.y - 26); }
      else if (k.k == 'orb') { ART.circ(g, k.x, k.y - 8, 12, 'rgba(255,255,255,.4)'); ART.circ(g, k.x, k.y - 8, 7, '#fff'); g.fillStyle = '#fff'; g.font = '700 9px ' + A.font; g.textAlign = 'center'; g.fillText('kick!', k.x, k.y - 24); }
      else if (k.k == 'chunk') { g.font = '22px ' + A.font; g.textAlign = 'center'; g.fillText('🍖', k.x, k.y + Math.sin(t*4)*3); } }
    for (const q of puffs) { ART.FOES.r_spirit(g, {x:q.x, y:q.y + 26, flap:0}, t); }
    if (run.tail) { const tl = run.tail; g.strokeStyle = '#efe2a2'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(tl.x - 16, tl.y); g.quadraticCurveTo(tl.x, tl.y - 14 + Math.sin(t*14)*10, tl.x + 18, tl.y - 4); g.stroke(); g.lineCap = 'butt'; for (let k = 0; k < 3; k++) ART.circ(g, tl.x - 8 + k*9, tl.y - 5, 2.5, '#1e1e24'); g.fillStyle = '#fff'; g.font = '700 9px ' + A.font; g.textAlign = 'center'; g.fillText('hit ' + tl.hp, tl.x, tl.y - 22); }
    for (const q of fx) { if (q.k == 'print') { g.fillStyle = 'rgba(40,40,60,' + Math.min(.6, q.t/2) + ')'; g.beginPath(); g.ellipse(q.x, q.y, 5, 3, 0, 0, TAU); g.fill(); }
      else if (q.k == 'ring') { g.strokeStyle = q.c || '#fff'; g.globalAlpha = Math.min(1, q.t*2.5); g.lineWidth = 4; g.beginPath(); g.arc(q.x, q.y, 20 + (.4 - q.t)*220, 0, TAU); g.stroke(); g.globalAlpha = 1; }
      else if (q.k == 'bolt') { g.strokeStyle = '#fff27a'; g.lineWidth = 3; g.beginPath(); let yy = q.y - 260, xx = q.x; g.moveTo(xx, yy); while (yy < q.y - 10) { yy += 30; xx = q.x + (Math.random() - .5)*30; g.lineTo(xx, yy); } g.stroke(); }
      else if (q.k == 'beam') { g.strokeStyle = q.c; g.lineWidth = 3; g.globalAlpha = q.t*2; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x2, q.y2); g.stroke(); g.globalAlpha = 1; }
      else if (q.k == 'swipe') { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; g.beginPath(); g.arc(q.x, q.y, 34, -1.2 + (.3 - q.t)*6, -.2 + (.3 - q.t)*6); g.stroke(); }
      else if (q.k == 'txt') { g.fillStyle = '#c8ff7a'; g.font = '800 11px ' + A.font; g.textAlign = 'center'; g.fillText(q.s, q.x, q.y); } }
    if (run.wind) { const w = run.wind; g.strokeStyle = 'rgba(255,255,255,' + (w.t < w.tell ? .5 + .4*Math.sin(t*16) : .8) + ')'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { const sx = S.cam.x + ((i*173 + t*(w.t > w.tell ? 600 : 80)) % S.VW), sy = S.cam.y + 60 + (i*97) % (S.VH - 120); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(w.a)*40, sy + Math.sin(w.a)*40); g.lineTo(sx + Math.cos(w.a)*30 + Math.cos(w.a + 2.4)*8, sy + Math.sin(w.a)*30 + Math.sin(w.a + 2.4)*8); g.stroke(); } }
    if (!lo) for (const q of parts) ART.drawPart(g, q, t);
    // gear score over your head
    g.fillStyle = 'rgba(20,32,74,.7)'; ART.rr(g, p.x - 26, p.y + 22, 52, 14, 7); g.fill(); g.fillStyle = '#F9BF01'; g.font = '800 9px ' + A.font; g.textAlign = 'center'; g.fillText('GS ' + GS(), p.x, p.y + 32);
    if (run.carry) { g.font = '20px ' + A.font; g.fillText('🍖', p.x, p.y - 58); } };
  const brazier = (x, y, lit, k) => { ART.shadow(g, x, y + 4, 16); g.fillStyle = '#5a4a3a'; g.fillRect(x - 4, y - 26, 8, 28); g.fillStyle = '#7a6a5a'; ART.rr(g, x - 16, y - 34, 32, 10, 4); g.fill();
    if (lit) { const f = Math.sin(S.t*14)*2; g.fillStyle = '#ffb347'; g.beginPath(); g.ellipse(x, y - 44, 10 + f, 16 - f, 0, 0, TAU); g.fill(); g.fillStyle = '#fff27a'; g.beginPath(); g.ellipse(x, y - 40, 5, 8, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,180,70,.15)'; g.beginPath(); g.arc(x, y - 40, 50, 0, TAU); g.fill();
      if (k < 1) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 16, y + 8, 32, 5); g.fillStyle = '#ffb347'; g.fillRect(x - 16, y + 8, 32*Math.max(0, k), 5); } } else { g.fillStyle = '#fff'; g.font = '700 9px ' + A.font; g.textAlign = 'center'; g.fillText('E: light', x, y - 40); } };
  const bell = (x, y, s, rung, sw) => { g.save(); g.translate(x, y - 50); g.rotate(Math.sin(S.t*30)*sw*.5); g.fillStyle = rung ? '#F9BF01' : '#c8a040'; g.beginPath(); g.moveTo(-s, s*1.3); g.quadraticCurveTo(-s, -s*.2, 0, -s*.4); g.quadraticCurveTo(s, -s*.2, s, s*1.3); g.closePath(); g.fill(); ART.circ(g, 0, s*1.35, s*.25, '#8a6a20'); g.restore(); g.fillStyle = '#5a3a1a'; g.fillRect(x - 2, y - 56 - s*.4, 4, 8); };
  const ents = L => { if (!run) { B0.ents(L); return; } for (let ly = 2; ly < FH; ly++) for (let lx = 1; lx < FW - 1; lx++) if (V(lx, ly) == 2) { const q = wp(lx - .5, ly - .5); if (S.onScreen(q.x, q.y, 80)) L.push({y:q.y + TS, d:() => ART.pillar(g, th(), q.x, q.y, TS, S.t)}); }
    if (run.copies) for (const c of run.copies) L.push({y:c.y, d:() => ART.BOSS.loki(g, c, S.t, {copy:1, flip:p.x < c.x})}); };
  // ---------- bosses & raid enemies look ----------
  const drawBoss = B => { if (!B.rd) { B0.drawBoss(B); return; } const look = B.rd.K.look, t = S.t, dn = B.rd.down > 0; g.save(); if (B.flash > 0) g.globalAlpha = .65; if (B.camoA) g.globalAlpha = B.camoA;
    if (dn) { g.translate(B.x, B.y); g.rotate(Math.sin(t*3)*.08); g.translate(-B.x, -B.y); }
    if (B.rd.shield || B.rd.shieldA) { g.strokeStyle = 'rgba(159,232,255,' + (.5 + .3*Math.sin(t*5)) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(B.x, B.y - B.r, B.r + 30, 0, TAU); g.stroke(); for (const f of S.foes) if (f.rf && f.job == 'shield' && !f.dead) { g.strokeStyle = 'rgba(159,232,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(f.x, f.y - 18); g.lineTo(B.x, B.y - B.r); g.stroke(); } }
    if (B.rd.weakT > 0 && !dn) { g.fillStyle = 'rgba(255,106,213,' + (.25 + .2*Math.sin(t*12)) + ')'; g.beginPath(); g.arc(B.x, B.y - B.r*.8, B.r + 14, 0, TAU); g.fill(); }
    if (B.rd.cast) { g.fillStyle = 'rgba(214,160,255,' + (.2 + .15*Math.sin(t*10)) + ')'; g.beginPath(); g.arc(B.x, B.y - B.r, B.r + 24, 0, TAU); g.fill(); }
    if (B.rd.enraged) { g.fillStyle = 'rgba(255,69,57,.18)'; g.beginPath(); g.arc(B.x, B.y - B.r, B.r + 36, 0, TAU); g.fill(); }
    const o = {flip:B.flip, mood:'angry', crown:1, gold:1, s:look == 'meatloaf' ? Math.max(.7, 1 - .06*(B.shrunk || 0)) : 1};
    if (look == 'dshadow' || look == 'mshade') { const DG = A.SAGA && A.SAGA.drawGecko; if (DG) { g.save(); if (!B.camoA) g.globalAlpha = .92; DG(B.x, B.y + (B.wall ? 0 : 0), {flip:p.x < B.x, s:look == 'dshadow' ? 1.35 : 1.1, col:look == 'dshadow' ? '#3a3050' : '#4a5a3a', noSeal:1, noCloak:look != 'dshadow', mood:'angry', walk:1}); g.restore(); } else ART.BOSS.stalker(g, B, t, o); }
    else (ART.BOSS[look] || ART.BOSS.sentinel)(g, B, t, o);
    if (dn) for (let k = 0; k < 3; k++) { g.fillStyle = '#F9BF01'; g.font = '14px ' + A.font; g.textAlign = 'center'; g.fillText('★', B.x + Math.cos(t*4 + k*2.1)*26, B.y - B.r*2 - 10 + Math.sin(t*4 + k*2.1)*6); }
    g.restore(); if (B.talk && B.talkT > 0) S.bubble(B.x, B.y - B.r*2 - 34, B.talk); };
  const drawFoe = f => { const F2 = FOE[f.k]; if (F2.gecko || !ART.FOES[f.k]) { B0.drawFoe(f); return; } g.save(); if (f.flash > 0) g.globalAlpha = .6; ART.shadow(g, f.x, f.y + 2, F2.r); ART.FOES[f.k](g, f, S.t, th()); g.restore();
    if (f.hp < f.max) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(f.x - 14, f.y + 8, 28, 4); g.fillStyle = '#FF4539'; g.fillRect(f.x - 14, f.y + 8, 28*Math.max(0, f.hp/f.max), 4); }
    if (f.job == 'shield' || f.job == 'heal' || f.job == 'bomb') { g.fillStyle = '#fff'; g.font = '800 9px ' + A.font; g.textAlign = 'center'; g.fillText({shield:'🛡 SHIELD', heal:'➕ HEALER', bomb:'💣 BOMB'}[f.job], f.x, f.y - F2.r*2 - 14); } };
  const drawBar = (B, TY) => { if (!B.rd) { B0.drawBar(B, TY); return; } const VW = S.VW, W2 = Math.min(560, VW - 300), x0 = VW/2 - W2/2, y0 = TY + 4, rd = B.rd, lay = rd.K.bar == 2;
    g.fillStyle = 'rgba(10,16,36,.75)'; ART.rr(g, x0 - 10, y0 - 6, W2 + 20, 60, 12); g.fill();
    const fr = Math.max(0, B.hp/B.max); if (lay) { const layers = 3, per = 1/layers, L2 = Math.min(layers - 1, Math.floor((1 - fr)/per)), inL = (fr - (layers - 1 - L2)*per)/per; g.fillStyle = ['#ff4539', '#a05ad0', '#3a2a8a'][Math.min(2, L2 + 1)] || '#333'; ART.rr(g, x0, y0, W2, 16, 8); g.fill(); g.fillStyle = ['#a05ad0', '#ff4539', '#ff6ad5'][L2]; ART.rr(g, x0, y0, W2*Math.max(0, Math.min(1, inL)), 16, 8); g.fill(); g.fillStyle = '#fff'; g.font = '900 11px ' + A.font; g.textAlign = 'right'; g.fillText('×' + (layers - L2), x0 + W2 - 6, y0 + 12); }
    else { g.fillStyle = 'rgba(255,255,255,.15)'; ART.rr(g, x0, y0, W2, 16, 8); g.fill(); g.fillStyle = rd.enraged ? '#ff2a2a' : '#ff4539'; ART.rr(g, x0, y0, W2*fr, 16, 8); g.fill(); }
    g.fillStyle = 'rgba(10,16,36,.9)'; for (let i = 1; i < B.phases; i++) g.fillRect(x0 + W2*(1 - i/B.phases) - 1.5, y0, 3, 16);
    g.fillStyle = '#fff'; g.font = '800 12px ' + A.font; g.textAlign = 'center'; g.fillText(B.n + ' · phase ' + B.ph + '/' + B.phases + (rd.enraged ? ' · ENRAGED' : ' · enrage ' + Math.max(0, Math.ceil(rd.enr)) + 's'), VW/2, y0 + 32);
    // stagger meter + cast bar
    g.fillStyle = 'rgba(255,255,255,.12)'; ART.rr(g, x0, y0 + 40, W2*.45, 8, 4); g.fill(); g.fillStyle = rd.down > 0 ? '#F9BF01' : '#ffd27a'; ART.rr(g, x0, y0 + 40, W2*.45*(rd.down > 0 ? 1 : rd.stag/100), 8, 4); g.fill(); g.fillStyle = '#cfe3f5'; g.font = '700 9px ' + A.font; g.textAlign = 'left'; g.fillText(rd.down > 0 ? '💫 STAGGERED' : 'stagger', x0 + 4, y0 + 58);
    if (rd.cast) { const cx = x0 + W2*.52, cw = W2*.48, k = Math.min(1, rd.cast.t/rd.cast.T); g.fillStyle = 'rgba(255,255,255,.12)'; ART.rr(g, cx, y0 + 40, cw, 8, 4); g.fill(); g.fillStyle = '#d6a0ff'; ART.rr(g, cx, y0 + 40, cw*k, 8, 4); g.fill(); g.fillStyle = '#e8d0ff'; g.textAlign = 'right'; g.fillText((rd.cast.noInt ? '' : '⚡ interrupt: ') + rd.cast.n, cx + cw, y0 + 58); } };
  // ---------- screen overlays: party frames, timer, banner, callouts ----------
  const drawScreen = () => { if (!run) { B0.drawScreen(); return; } const VW = S.VW, VH = S.VH, t = S.t, lo = S.low(), TH = ART.TH[th()];
    const dk = Math.max(TH.dark, run.dark ? .75 : 0); if (dk > 0) { const px2 = p.x - S.cam.x, py2 = p.y - S.cam.y; if (lo) { g.fillStyle = 'rgba(0,0,10,' + dk*.6 + ')'; g.fillRect(0, 0, VW, VH); } else { const gr = g.createRadialGradient(px2, py2, 120, px2, py2, Math.max(VW, VH)*.75); gr.addColorStop(0, 'rgba(0,0,10,0)'); gr.addColorStop(1, 'rgba(0,0,10,' + dk + ')'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); } }
    if (mod('blizz')) { g.fillStyle = 'rgba(235,245,255,.32)'; g.fillRect(0, 0, VW, VH); if (!lo) { g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 60; i++) g.fillRect((i*137 + t*300) % VW, (i*89 + t*220) % VH, 2, 2); } }
    if (run.grav) { const G = run.grav; g.fillStyle = G.warn ? 'rgba(214,160,255,' + (.5 + .4*Math.sin(t*12)) + ')' : 'rgba(214,160,255,.5)'; g.font = '900 26px ' + A.font; g.textAlign = 'center'; g.fillText(G.dir > 0 ? '⬇' : '⬆', VW - 40, VH/2); if (G.warn) { g.font = '800 12px ' + A.font; g.fillText('FLIP!', VW - 40, VH/2 + 22); } }
    // party frames (left)
    const fx0 = 12, fy0 = 196, rows2 = [{n:'You · ' + RS.role, hp:p.hp, mx:p.max, c:'#2fa8e0'}, ...(W.mau ? [{n:'Mau Mau · Tank', hp:run.tank.hp, mx:run.tank.max, c:'#F9BF01', down:run.tank.down}] : []), ...mates.map(m => ({n:m.name + ' · ' + {thrower:'Damage', builder:'Support', medic:'Healer'}[m.role], hp:m.ko ? 0 : m.hp, mx:m.max, c:'#7fe08a', down:m.ko}))];
    if (!mates.some(m => m.role == 'medic')) rows2.push({n:'Raid Spirit · Healer', hp:1, mx:1, c:'#9fffe0'});
    rows2.forEach((r2, i) => { const y = fy0 + i*30; g.fillStyle = 'rgba(10,16,36,.65)'; ART.rr(g, fx0, y, 172, 26, 8); g.fill(); g.fillStyle = '#fff'; g.font = '700 10px ' + A.font; g.textAlign = 'left'; S.wrapClip(r2.n, fx0 + 8, y + 11, 160); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(fx0 + 8, y + 15, 156, 6); g.fillStyle = r2.down > 0 ? '#888' : r2.c; g.fillRect(fx0 + 8, y + 15, 156*Math.max(0, Math.min(1, r2.hp/Math.max(1, r2.mx))), 6); if (r2.down > 0) { g.fillStyle = '#ff9a9a'; g.textAlign = 'right'; g.fillText('down ' + Math.ceil(r2.down) + 's', fx0 + 164, y + 11); } });
    // raid timer, floor progress, modifiers (right, under the mini map)
    const rx = VW - 196, ry = lastTY + 96; g.fillStyle = 'rgba(10,16,36,.65)'; ART.rr(g, rx, ry, 184, 62 + run.mods.length*14, 10); g.fill(); g.fillStyle = '#fff'; g.font = '800 11px ' + A.font; g.textAlign = 'left'; S.wrapClip(run.R.e + ' ' + run.R.n, rx + 8, ry + 16, 168);
    g.fillStyle = DIFF[run.d].c; g.font = '700 10px ' + A.font; g.fillText(DIFF[run.d].n + (run.key ? ' · key +' + run.key : '') + ' · ⏱ ' + Math.floor(run.t/60) + ':' + String(Math.floor(run.t % 60)).padStart(2, '0'), rx + 8, ry + 31);
    for (let i = 0; i < run.R.fl.length; i++) { g.fillStyle = i < F.fi ? '#7fe08a' : i == F.fi ? '#F9BF01' : 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(rx + 14 + i*20, ry + 44, 6, 0, TAU); g.fill(); }
    g.fillStyle = '#cfe3f5'; g.font = '600 9px ' + A.font; run.mods.forEach((m, i) => S.wrapClip('⚙ ' + m.n, rx + 8, ry + 66 + i*14, 168));
    if (run.buffT > 0) { g.fillStyle = '#F9BF01'; g.font = '800 11px ' + A.font; g.textAlign = 'center'; g.fillText('🍗 Mau Mau buff ' + Math.ceil(run.buffT) + 's', VW/2, VH - 52); }
    if (run.slowT > 0) { g.fillStyle = '#d6a0ff'; g.font = '800 12px ' + A.font; g.textAlign = 'center'; g.fillText('🧠 Slowed ' + Math.ceil(run.slowT) + 's', VW/2, VH - 68); }
    // banner + callout
    if (banner) { const a = Math.min(1, banner.t*2, (3.2 - banner.t)*4); g.globalAlpha = Math.max(0, a); g.fillStyle = 'rgba(10,16,36,.85)'; const by = lastTY + (S.boss ? 74 : 14); ART.rr(g, VW/2 - 260, by, 520, 56, 14); g.fill(); g.strokeStyle = TH.acc; g.lineWidth = 2; g.stroke(); g.fillStyle = '#fff'; g.font = '900 17px ' + A.font; g.textAlign = 'center'; g.fillText(banner.a, VW/2, by + 24); g.fillStyle = '#cfe3f5'; g.font = '700 12px ' + A.font; g.fillText(banner.b, VW/2, by + 44); g.globalAlpha = 1; }
    if (callout && S.boss) { const y = VH - 104; g.fillStyle = callout.good ? 'rgba(0,120,60,.85)' : 'rgba(120,10,30,.85)'; const w = Math.min(VW - 40, Math.max(300, callout.n.length*11 + 60)); ART.rr(g, VW/2 - w/2, y, w, callout.tip && S.boss.rd && RS.hints ? 46 : 30, 12); g.fill(); g.fillStyle = '#fff'; g.font = '900 16px ' + A.font; g.textAlign = 'center'; g.fillText(callout.n, VW/2, y + 21); if (callout.tip && RS.hints) { g.font = '700 11px ' + A.font; g.fillStyle = '#ffe9a0'; g.fillText('💡 ' + callout.tip, VW/2, y + 38); } }
    // boss intro card
    if (intro) { const k = Math.min(1, (2.8 - intro.t)*3, intro.t*3); g.fillStyle = 'rgba(0,0,0,' + .7*k + ')'; g.fillRect(0, 0, VW, 70*k); g.fillRect(0, VH - 70*k, VW, 70*k); g.globalAlpha = k; g.fillStyle = 'rgba(10,16,36,.9)'; ART.rr(g, VW/2 - 250 + (1 - k)*80, VH/2 - 50, 500, 100, 16); g.fill(); g.strokeStyle = DIFF[run.d].c; g.lineWidth = 3; g.stroke();
      g.fillStyle = intro.mini ? '#9fe8ff' : '#F9BF01'; g.font = '800 12px ' + A.font; g.textAlign = 'center'; g.fillText(intro.mini ? 'GUARDIAN' : 'RAID BOSS · ' + DIFF[run.d].n.toUpperCase(), VW/2, VH/2 - 18); g.fillStyle = '#fff'; g.font = '900 24px ' + A.font; g.fillText(intro.n, VW/2, VH/2 + 14); g.globalAlpha = 1; } };
  let lastTY = 110; const drawMini = (TY, G0x) => { lastTY = TY; if (!run) return B0.drawMini(TY, G0x); const VW = S.VW, MX = VW - 116, s = 100/FW, h = FH*s; g.fillStyle = 'rgba(20,32,74,.7)'; ART.rr(g, MX, TY, 108, h + 10, 10); g.fill();
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const v = V(x, y); if (v == 0 || v >= 4) continue; g.fillStyle = v == 3 ? '#05030f' : v == 2 ? '#8a96b0' : '#4a5a80'; g.fillRect(MX + 4 + x*s, TY + 5 + y*s, s + .4, s + .4); }
    const G0 = goal(); if (G0) { const gx = MX + 4 + (G0.x/TS - RX)*s, gy = TY + 5 + (G0.y/TS)*s; g.fillStyle = '#F9BF01'; g.font = '12px ' + A.font; g.textAlign = 'center'; g.fillText('⭐', gx, gy + 4); }
    if (S.boss) { ART.circ(g, MX + 4 + (S.boss.x/TS - RX)*s, TY + 5 + (S.boss.y/TS)*s, 3.5, '#ff4539'); } ART.circ(g, MX + 4 + (p.x/TS - RX)*s, TY + 5 + (p.y/TS)*s, 3, '#2fa8e0');
    g.fillStyle = F.door ? '#7fe08a' : '#ff9a9a'; g.fillRect(MX + 4 + 16*s, TY + 5, 2*s, 2*s); return {x:MX, y:TY, w:108, h:h + 10}; };
  // ---------- victory screen ----------
  const drawTop = () => { B0.drawTop(); if (!vic) return; vic.t = (performance.now() - vic.t0)/1000; const VW = S.VW, VH = S.VH, t = vic.t; g.fillStyle = 'rgba(6,10,26,.88)'; g.fillRect(0, 0, VW, VH);
    g.fillStyle = '#F9BF01'; g.font = '900 34px ' + A.font; g.textAlign = 'center'; g.fillText('🏆 RAID CLEARED!', VW/2, 90); g.fillStyle = '#fff'; g.font = '800 16px ' + A.font; g.fillText(vic.R.e + ' ' + vic.R.n + ' · ' + DIFF[vic.d].n + (vic.key ? ' · key +' + vic.key : ''), VW/2, 118);
    g.fillStyle = '#cfe3f5'; g.font = '700 13px ' + A.font; g.fillText('⏱ ' + Math.floor(vic.secs/60) + ':' + String(vic.secs % 60).padStart(2, '0') + ' · ' + (vic.deaths ? vic.deaths + ' knock-out' + (vic.deaths > 1 ? 's' : '') : 'no knock-outs!') + (vic.medals.length ? ' · ' + vic.medals.join(' · ') : ''), VW/2, 142);
    const cw = Math.min(520, VW - 40), cx = VW/2 - cw/2; vic.loot.forEach((L2, i) => { const k = Math.max(0, Math.min(1, (t - .6 - i*.35)*3)); if (k <= 0) return; const y = 166 + i*42; g.globalAlpha = k; g.save(); g.translate(VW/2, y + 18); g.scale(1, k); g.translate(-VW/2, -(y + 18));
      g.fillStyle = L2.big ? 'rgba(233,185,247,.25)' : 'rgba(255,255,255,.1)'; ART.rr(g, cx, y, cw, 36, 10); g.fill(); g.strokeStyle = L2.c; g.lineWidth = L2.big ? 3 : 1.5; g.stroke(); g.font = '20px ' + A.font; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText(L2.e, cx + 12, y + 25); g.font = '800 13px ' + A.font; g.fillStyle = L2.c; S.wrapClip(L2.n, cx + 44, y + 23, cw - 56); g.restore(); g.globalAlpha = 1; });
    if (t > 1 + vic.loot.length*.35) { const by = Math.min(VH - 60, 176 + vic.loot.length*42); g.fillStyle = '#D5F367'; ART.rr(g, VW/2 - 150, by, 300, 44, 22); g.fill(); g.fillStyle = '#14204a'; g.font = '900 15px ' + A.font; g.textAlign = 'center'; g.fillText('Back to the War Table ▶', VW/2, by + 28); vic.btn = {x:VW/2 - 150, y:by, w:300, h:44}; } };
  const closeVic = () => { if (!vic || vic.t < 1) return; vic = null; leaveRun('🏕 Back at the War Table with your raid loot!'); };
  // ---------- War Table (the raid hub, next to Camp Cocoa in the Frostpine Castle grounds) ----------
  const WTP = {x:44.5*TS, y:90.5*TS};
  const drawWarTable = () => { if (!S.onScreen(WTP.x, WTP.y, 260)) return; const x = WTP.x, y = WTP.y, t = S.t;
    g.fillStyle = '#8a96b0'; ART.rr(g, x - 90, y - 110, 180, 70, 8); g.fill(); for (let i = 0; i < 6; i++) { g.fillStyle = '#a8b4cc'; g.fillRect(x - 90 + i*32, y - 122, 20, 14); } g.fillStyle = '#5a6278'; ART.rr(g, x - 18, y - 70, 36, 30, 14); g.fill();
    for (const s of [-1, 1]) { g.fillStyle = '#5a3a1a'; g.fillRect(x + s*80, y - 150, 3, 60); g.fillStyle = s < 0 ? '#2f5fd0' : '#c8102e'; g.beginPath(); g.moveTo(x + s*80 + 3, y - 148); g.lineTo(x + s*80 + 3 + 26 + Math.sin(t*3)*3, y - 140); g.lineTo(x + s*80 + 3, y - 130); g.fill(); }
    ART.shadow(g, x, y + 4, 56); g.fillStyle = '#6a4024'; ART.rr(g, x - 54, y - 34, 108, 34, 10); g.fill(); g.fillStyle = '#e8d8b0'; ART.rr(g, x - 46, y - 32, 92, 24, 6); g.fill();
    g.strokeStyle = '#a0805a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 36, y - 18); g.quadraticCurveTo(x - 10, y - 30, x + 6, y - 16); g.quadraticCurveTo(x + 20, y - 8, x + 36, y - 24); g.stroke(); g.font = '10px ' + A.font; g.textAlign = 'center'; g.fillText('⚔', x - 20, y - 14); g.fillText('🚩', x + 18, y - 18);
    g.fillStyle = '#14204a'; g.font = '900 11px ' + A.font; g.fillText('⚔ THE WAR TABLE', x, y + 18);
    // trophy hall: one trophy per raid you have cleared (color = best difficulty)
    let i = 0; for (const R of RAIDS) { const d = RS.troph[R.id]|0; if (!d) continue; const tx = x - 120 + (i % 5)*60, ty = y + 56 + Math.floor(i/5)*44; i++; g.fillStyle = '#5a6278'; g.fillRect(tx - 10, ty - 4, 20, 8); g.fillStyle = DIFF[d - 1].c; g.beginPath(); g.moveTo(tx - 9, ty - 26); g.lineTo(tx + 9, ty - 26); g.lineTo(tx + 5, ty - 10); g.lineTo(tx - 5, ty - 10); g.fill(); g.fillRect(tx - 2, ty - 10, 4, 6); g.font = '10px ' + A.font; g.fillText(R.e, tx, ty - 14); }
    if (i) { g.fillStyle = '#14204a'; g.font = '800 9px ' + A.font; g.fillText('🏆 TROPHY HALL', x, y + 36); } };
  // every row with an action gets a working button (the panel only enables rows marked ok)
  const openP = build => S.openPanelUI(() => { const P = build(); P.rows.forEach(r2 => { if (r2.fn && r2.ok === undefined) r2.ok = true; }); return P; });
  let selD = 0, selK = 0, lbCache = {}, lbSel = {r:0, d:0};
  const fmtT = s => Math.floor(s/60) + ':' + String(s % 60).padStart(2, '0');
  const warTable = () => openP(() => ({title:'⚔️ The War Table · Frostpine Castle', sub:'Gear Score ' + GS() + ' · 🎟 ' + RS.tok + ' Raid Tokens · this week: ' + weekMods().map(m => m.n).join(' + ') + ' · weekly loot taken: ' + Object.keys(RS.lock.got).length,
    rows:[...(RS.run ? [{e:'▶', n:'Resume: ' + (RAIDS.find(R => R.id == RS.run.id) || RAIDS[0]).n + ' · floor ' + (RS.run.fi + 1), d:DIFF[RS.run.d].n + (RS.run.key ? ' · key +' + RS.run.key : '') + ' · your floor was saved', btn:'Resume', fn:() => { const R = RAIDS.find(R2 => R2.id == RS.run.id); if (R) startRun(R, RS.run.d, RS.run.key, RS.run.fi, RS.run); }},
        {e:'✖', n:'Abandon the saved run', d:'(nothing else is lost)', btn:'Abandon', fn:() => { RS.run = null; S.save(); }}] : []),
      ...RAIDS.map(R => { const ok = ul(R), md = RS.maxD[R.id]|0, wk = [0, 1, 2, 3].filter(d => RS.lock.got[R.id + ':' + d]).map(d => DIFF[d].n[0]).join(''); return {e:R.e, n:R.n + (wk ? ' · ✓' + wk + ' this week' : ''), d:ok ? R.fl.length + ' floors · boss: ' + KIT[R.id].fin.n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()) + ' · rec. GS ' + recGS(R, Math.min(md, 3)) + ' · best ' + (DIFF[Math.max(0, md - 1)] || DIFF[0]).n + (RS.keys[R.id] ? ' · key +' + RS.keys[R.id] : '') : '🔒 ' + R.ul, btn:ok ? 'Choose' : 'Locked', ok, fn:() => { selD = Math.min(md, 3); selK = 0; raidPanel(R); }}; }),
      ...(Object.keys(RS.lock.got).length >= 3 && !RS.lock.chest ? [{e:'📦', n:'Weekly chest is ready!', d:'You took the best loot from 3+ raid bosses this week', btn:'Open', fn:() => { RS.lock.chest = 1; RS.tok += 40; S.give({frost:200, flakes:5000}); const R = RAIDS.filter(ul).sort(() => Math.random() - .5)[0]; const it = R && makeSet(R, 4); S.say('📦 Weekly chest: +40 🎟 · +200 🔷 · +5K ❄' + (it ? ' · ' + it.name : ''), 4); A.sfx('win'); S.save(); }}] : []),
      {e:'🧭', n:'Party & roles', d:'Your role: ' + RS.role + ' · AI teammates fill the missing roles', btn:'Open', fn:partyPanel},
      {e:'🛒', n:'Raid Quartermaster', d:'Spend Raid Tokens on guaranteed set pieces and relics', btn:'Shop', fn:qmPanel},
      {e:'✨', n:'Relics (legendary snowball weapons)', d:RS.relic ? 'Equipped: ' + RAIDS.find(R => R.id == RS.relic).relic.n : Object.keys(RS.relics).length + ' found', btn:'Open', fn:relicPanel},
      {e:'🏅', n:'Leaderboards', d:'Fastest clears, highest keys, World First', btn:'Open', fn:() => lbPanel()},
      {e:'🎖', n:'Raid achievements & titles', d:'Bronze → Diamond', btn:'Open', fn:achPanel},
      {e:'🗓', n:'Weekly modifiers', d:weekMods().map(m => m.n + ': ' + m.d).join(' · '), btn:'Info', fn:() => S.say('🗓 This week: ' + weekMods().map(m => m.n + ' (' + m.d + ')').join(' + ') + '. They change every Monday.', 4)},
      {e:'💡', n:'Boss hints from your teammates', d:RS.hints ? 'ON: tips show under each attack name' : 'OFF', btn:RS.hints ? 'Turn off' : 'Turn on', fn:() => { RS.hints = RS.hints ? 0 : 1; S.save(); }}]}));
  const raidPanel = R => openP(() => { const md = RS.maxD[R.id]|0, mk = RS.keys[R.id]|0; return {title:R.e + ' ' + R.n, sub:R.fl.length + ' floors · guardian: ' + KIT[R.id].mini.n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()) + ' · set: ' + R.set + ' (4 pieces: ' + R.setD + ') · your GS ' + GS(),
    rows:[...DIFF.map((D2, d) => { const ok = d <= md, got = RS.lock.got[R.id + ':' + d]; return {e:['🟢', '🔵', '🟣', '🔴'][d], n:D2.n + (selD == d ? '  ✓ selected' : ''), d:ok ? 'rec. GS ' + recGS(R, d) + ' · ' + (got ? 'best loot taken this week (still gives tokens)' : 'best loot ready this week') + (RS.best[R.id + ':' + d] ? ' · best ' + fmtT(RS.best[R.id + ':' + d]) : '') + (d ? ' · adds new mechanics' : '') : '🔒 Beat ' + DIFF[d - 1].n + ' first', btn:selD == d ? '✓' : 'Select', ok, fn:() => { selD = d; }}; }),
      {e:'🔑', n:'Raid key: +' + selK + (mk ? ' (up to +' + mk + ')' : ''), d:mk ? 'Each key level: tougher bosses, better rewards. No limit!' : 'Clear this raid to earn keys', btn:mk ? 'Change' : '—', ok:mk > 0, fn:() => { selK = (selK + 1) % (mk + 1); }},
      {e:'⚔️', n:'START: ' + DIFF[selD].n + (selK ? ' · key +' + selK : ''), d:'Party: you' + (W.mau ? ', Mau Mau (tank)' : '') + (mates.length ? ', ' + mates.map(m => m.name).join(', ') : ''), btn:'START RAID', fn:() => startRun(R, selD, selK)},
      {e:'⬅', n:'Back to the War Table', btn:'Back', fn:warTable}]}; });
  const partyPanel = () => openP(() => ({title:'🧭 Party & roles', sub:'Up to 4 heroes. AI teammates fill missing roles automatically. Your role changes how you play.',
    rows:[{e:'🧒', n:'You · ' + RS.role, d:{Damage:'+12% damage to bosses', Healer:'+1 ♥ every 12 s in raids', Support:'+30% stagger', Tank:'take 1 less damage from boss hits'}[RS.role], btn:'Change role', fn:() => { const L = ['Damage', 'Healer', 'Support', 'Tank']; RS.role = L[(L.indexOf(RS.role) + 1) % 4]; S.save(); }},
      ...(W.mau ? [{e:'🐱', n:'Royal Guard Mau Mau · Tank', d:'Holds the boss’s attention. If he goes down, the boss turns on you. Feed him (G)!', btn:'✓', ok:false}] : [{e:'🐱', n:'No tank yet', d:'Free Royal Guard Mau Mau to get a tank. Until then, bosses swipe at you (with a warning)', btn:'—', ok:false}]),
      ...mates.map(m => ({e:'🧑', n:m.name + ' · ' + {thrower:'Damage', builder:'Support', medic:'Healer'}[m.role], d:'AI teammate (level ' + m.lv + ')', btn:'✓', ok:false})),
      ...(!mates.some(m => m.role == 'medic') ? [{e:'👻', n:'Raid Spirit · Healer', d:'Fills the empty Healer spot: +1 ♥ every 14 s', btn:'✓', ok:false}] : []),
      {e:'🌐', n:'Play with real players online', d:'Coming with the Couch Co-op update (it’s on the update list)', btn:'Soon', ok:false}, {e:'🎮', n:'Couch co-op partner', d:'Coming with the Couch Co-op update', btn:'Soon', ok:false},
      {e:'⬅', n:'Back', btn:'Back', fn:warTable}]}));
  const QM = () => [...RAIDS.filter(ul).map(R => ({e:'🛡', n:R.set + ' piece (Epic)', d:'A random slot · 4 pieces: ' + R.setD, c:60, fn:() => makeSet(R, 3)})),
    ...RAIDS.filter(R => RS.maxD[R.id] >= 2).map(R => ({e:'🌟', n:R.set + ' piece (Legendary)', d:'Unlocked by clearing it on Heroic', c:160, fn:() => makeSet(R, 4)})),
    ...RAIDS.filter(R => RS.maxD[R.id] >= 2 && !RS.relics[R.id]).map(R => ({e:'✨', n:'Relic: ' + R.relic.n, d:R.relic.d, c:250, fn:() => { RS.relics[R.id] = 1; return {name:R.relic.n}; }})),
    {e:'🐟', n:'Bag of 10 Mau Mau treats', d:'Feed the tank!', c:20, fn:() => { W.treats = (W.treats || 0) + 10; return {name:'10 treats'}; }}, {e:'🔷', n:'50 Frost Crystals', d:'', c:30, fn:() => { S.give({frost:50}); return {name:'50 Frost Crystals'}; }},
    {e:'🧥', n:'Raid Champion outfit', d:'A cosmetic look for your hero (Journal → outfits)', c:120, own:W.outfits && W.outfits.raid, fn:() => { W.outfits = W.outfits || {}; W.outfits.raid = 1; return {name:'Raid Champion outfit'}; }}];
  const qmPanel = () => openP(() => ({title:'🛒 Raid Quartermaster', sub:'🎟 ' + RS.tok + ' Raid Tokens. Guaranteed items, so bad luck never blocks you. Tokens come from every clear and every floor.',
    rows:[...QM().map(it => ({e:it.e, n:it.n + ' · ' + it.c + ' 🎟', d:it.d, btn:it.own ? '✓ Owned' : 'Buy', ok:!it.own && RS.tok >= it.c, fn:() => { if (it.own || RS.tok < it.c) return; RS.tok -= it.c; const r2 = it.fn(); S.save(); A.sfx('coin'); S.say('🛒 ' + ((r2 && r2.name) || it.n), 2.6); }})), {e:'⬅', n:'Back', btn:'Back', fn:warTable}]}));
  const relicPanel = () => openP(() => ({title:'✨ Relics', sub:'Legendary snowball weapons from raid bosses (and the Quartermaster). Equip one: it works in raids.',
    rows:[...RAIDS.map(R => ({e:RS.relics[R.id] ? '✨' : '❔', n:RS.relics[R.id] ? R.relic.n + (RS.relic == R.id ? '  ✓ equipped' : '') : '??? (from ' + R.n + ')', d:RS.relics[R.id] ? R.relic.d : 'Drops from the raid boss (better chance on harder difficulties)', btn:RS.relics[R.id] ? (RS.relic == R.id ? 'Unequip' : 'Equip') : '🔒', ok:!!RS.relics[R.id], fn:() => { if (!RS.relics[R.id]) return; RS.relic = RS.relic == R.id ? null : R.id; S.save(); }})), {e:'⬅', n:'Back', btn:'Back', fn:warTable}]}));
  const lbPanel = () => { const R = RAIDS[lbSel.r], key = 'raid_' + R.id + '_' + lbSel.d; if (!lbCache[key] && window.WLCloud && window.WLCloud.top) { lbCache[key] = 'loading'; window.WLCloud.top(key, 10).then(r => { lbCache[key] = r || []; }).catch(() => { lbCache[key] = []; }); if (lbSel.d >= 2) window.WLCloud.top('raidwf_' + R.id, 1).then(r => { lbCache['wf_' + R.id] = r || []; }).catch(() => {}); }
    openP(() => { const L = lbCache[key], wf = lbCache['wf_' + R.id]; return {title:'🏅 ' + R.e + ' ' + R.n + ' · ' + DIFF[lbSel.d].n, sub:'Fastest clears. Your best: ' + (RS.best[R.id + ':' + lbSel.d] ? fmtT(RS.best[R.id + ':' + lbSel.d]) : '—') + ' · your highest key here: +' + (RS.keys[R.id]|0),
      rows:[{e:'◀', n:'Change raid', d:'', btn:'Next raid', fn:() => { lbSel.r = (lbSel.r + 1) % RAIDS.length; lbPanel(); }}, {e:'🎚', n:'Change difficulty', d:'', btn:'Next', fn:() => { lbSel.d = (lbSel.d + 1) % 4; lbPanel(); }},
        ...(wf && wf[0] ? [{e:'🌍', n:'WORLD FIRST (Mythic+): ' + (wf[0].u || wf[0].name || 'a hero'), d:'The first team to clear it on Mythic', btn:'👑', ok:false}] : []),
        ...(L == 'loading' ? [{e:'⏳', n:'Loading…', btn:'', ok:false}] : !L || !L.length ? [{e:'🕊', n:window.WLCloud ? 'No clears yet. Be the first!' : 'Sign in to see the leaderboards', btn:'', ok:false}] : L.map((r2, i) => ({e:['🥇', '🥈', '🥉'][i] || String(i + 1), n:(r2.u || r2.name || 'player'), d:'⏱ ' + fmtT(Math.max(0, 36000 - (r2.s || r2.score || 0))), btn:'', ok:false}))),
        {e:'⬅', n:'Back', btn:'Back', fn:warTable}]}; }); };
  const TIERS = ['🥉 Bronze', '🥈 Silver', '🥇 Gold', '💎 Platinum', '💠 Diamond'];
  const achPanel = () => openP(() => { const combos = Object.keys(RS.clr).filter(k => RS.clr[k] > 0).length, mxK = Math.max(0, ...Object.values(RS.keys)), A2 = [['Raider', 'raid clears', clears(RS), [1, 10, 25, 50, 100]], ['Untouchable', 'clears with no knock-outs', RS.nd|0, [1, 5, 10, 25, 50]], ['Completionist', 'raid + difficulty combos', combos, [3, 10, 20, 30, 40]], ['Collector', 'raid set pieces found', RS.sets|0, [3, 10, 20, 35, 50]], ['Keystone', 'highest raid key', mxK, [2, 5, 10, 15, 25]]];
    return {title:'🎖 Raid achievements & titles', sub:'Titles: ' + (Object.keys(W.titles).filter(k => /Champion|Raid Leader|Nightmare|Keymaster/.test(k)).join(', ') || 'none yet') + '. Champion titles come from Mythic clears.',
      rows:[...A2.map(([n, d, v, th2]) => { const tier = th2.filter(x => v >= x).length, nx = th2[tier]; return {e:tier ? TIERS[tier - 1].split(' ')[0] : '⬜', n:n + (tier ? ' · ' + TIERS[tier - 1].split(' ')[1] : ''), d:v + ' ' + d + (nx ? ' · next tier at ' + nx : ' · MAXED!'), btn:'', ok:false}; }), {e:'⬅', n:'Back', btn:'Back', fn:warTable}]}; });
  // ---------- teammates' spots in raid fights (spread out, never stacked) ----------
  const mauSpot = () => { if (!run || !S.boss || !S.boss.rd) return null; const B = S.boss; if (B.rd.act && B.rd.act.id == 'stack') return {x:p.x + 30, y:p.y + 10}; if (B.rd.act && B.rd.act.id == 'spread' && B.rd.act.mau) return B.rd.act.mau; if (run.tank.down > 0) return {x:p.x - 60, y:p.y + 20}; const a = Math.atan2(p.y - B.y, p.x - B.x); return {x:B.x + Math.cos(a)*(B.r + 56), y:B.y + Math.sin(a)*(B.r + 56)}; };
  const mateSpot = (m, i) => { if (!run || !S.boss || !S.boss.rd || S.holdMates) return null; const B = S.boss, a = Math.atan2(p.y - B.y, p.x - B.x) + (i - (mates.length - 1)/2)*.75 + Math.PI*.15; return {x:B.x + Math.cos(a)*300, y:B.y + Math.sin(a)*240}; };
  // ---------- respawn (checkpoint at the current floor / boss phase) ----------
  const respawn = () => { if (!run) return B0.respawn(); run.deaths++; const B = S.boss; hz = []; run.copies = null; run.tail = null; run.bh = null; run.safe = null; run.wind = null; run.slowT = 0; run.carry = null; kicks = kicks.filter(k => k.k == 'toy'); S.balls = []; S.holdMates = false;
    p.x = F.spawn.x; p.y = F.spawn.y; p.vx = p.vy = 0; p.hp = p.max; p.inv = 2.5; p.ammo = X.maxAmmo(); S.mateHome(); mates.forEach(m => { m.ko = 0; m.hp = m.max; }); run.tank.hp = run.tank.max; run.tank.down = 0;
    if (B && B.rd) { endAct(B); B.rd.cast = null; if (run.pz) { run.pz = null; B.rd.shield = 0; } B.hp = Math.max(B.hp, phTop(B)); B.x = B.hx; B.y = B.hy; B.rd.next = 2.5; B.rd.down = 0; B.air = 0; B.wall = 0; B.camoA = 0; S.foes = S.foes.filter(f => !f.rf); say('❄ Back at the floor entrance. The boss is back to the start of phase ' + B.ph + ' (checkpoint)', 3.2); }
    else say('❄ Back at the floor entrance', 2.4); S.save(); return true; };
  // ---------- keys & clicks ----------
  const key = e => { if (vic) { if (vic.t > 1.2 && ['Enter', ' ', 'Escape', 'e', 'E'].includes(e.key)) closeVic(); return true; } if (run && (e.key == 'g' || e.key == 'G') && run.carry) { feedChunk(); return true; } return B0.key(e); };
  const feedChunk = () => { run.carry = null; const B = S.boss; S.mauSay('*CHOMP CHOMP CHOMP* …more!', 2); run.tank.hp = run.tank.max; run.tank.down = 0;
    if (B && B.rd && B.bloat > 0) { B.shrunk = (B.shrunk || 0) + 1; B.hp -= B.max*.06; B.bloat = 0; stun(B, 2.5, 50, 'MAU MAU TOOK A BITE! It shrinks!'); if (B.hp <= 0) S.bossDown(B); } else { run.buffT = 10; run.buffHungry = 0; callout = {t:2.2, n:'🍖 Mau Mau is pumped! ×1.3 damage', tip:'', good:1}; } };
  const down = q => { if (vic) { if (vic.btn && q.x >= vic.btn.x && q.x <= vic.btn.x + vic.btn.w && q.y >= vic.btn.y && q.y <= vic.btn.y + vic.btn.h) closeVic(); return true; } return B0.down(q); };
  // ---------- admin tools (only the Snowball admin list shows these) ----------
  const adm = {enter:(n, d) => { const R = RAIDS[Math.max(0, Math.min(9, (n|0) - 1))]; startRun(R, Math.max(0, Math.min(3, d|0)), 0); }, floor:n => { if (!run) return say('Start a raid first', 2); enterFloor(Math.max(0, Math.min(run.R.fl.length - 1, (n|0) - 1))); },
    boss:() => { if (!run) adm.enter(1, 0); enterFloor(run.R.fl.length - 1); F.obj.spawnT = 0; }, skip:() => { const B = S.boss; if (B && B.rd) { if (B.ph >= B.phases) { B.hp = 1; } else { B.hp = B.max*(1 - B.ph/B.phases) - 1; hurtRB(B, .01); } } else if (run) floorDone(); },
    gear:() => { const R = run ? run.R : RAIDS[0]; const it = makeSet(R, 4); say('Admin: ' + (it ? it.name : 'gear'), 2); }, key:n => { for (const R of RAIDS) RS.keys[R.id] = Math.max(0, n|0); S.save(); say('Admin: every raid key set to +' + (n|0), 2); },
    resetLock:() => { RS.lock = {w:weekNo(), got:{}, chest:0}; W.raidClr = {}; S.save(); say('Admin: weekly raid lockouts reset', 2); }, unlockAll:() => { for (const R of RAIDS) RS.maxD[R.id] = 4; S.save(); say('Admin: every difficulty unlocked', 2); }, tokens:n => { RS.tok += n|0; S.save(); }, hints:() => { RS.hints = RS.hints ? 0 : 1; S.save(); say('Admin: boss hints ' + (RS.hints ? 'ON' : 'OFF'), 2); }};
  // ---------- the wrapped hook object ----------
  const RD = Object.create(B0);
  Object.assign(RD, {cur:() => run ? 'raid' : B0.cur(), tile:(tx, ty) => run ? (tx >= RX && tx < RX + FW && ty >= 0 && ty < FH ? F.M[ty*FW + tx - RX] : T.ROCK) : B0.tile(tx, ty),
    inside:(x, y) => { if (!run) return B0.inside(x, y); const L = toL(x, y); return !solidL(L.x, L.y); }, bounds:() => run ? {x0:RX*TS, x1:(RX + FW)*TS, y1:FH*TS} : B0.bounds(), modal:() => !!vic || B0.modal(),
    move:(dt, mx, my) => run ? false : B0.move(dt, mx, my), update:dt => { if (run) update(dt); else B0.update(dt); }, things:L => { if (run) things(L); else { B0.things(L); L.push({x:WTP.x, y:WTP.y, n:'War Table', f:warTable}); } }, goal:() => run ? goal() : B0.goal(),
    drawTiles:() => run ? drawTiles() : B0.drawTiles(), drawWorld, ents, drawScreen, drawTop, drawMini, drawMap:(TY, G0) => run ? null : B0.drawMap(TY, G0), mapDown:q => run ? (S.mapOpen = false, true) : B0.mapDown(q),
    key, down, warmHeal:() => run ? false : B0.warmHeal(), blockMap:() => { if (run) { say('🗺 This floor is on the mini map (top right). The ⭐ is your goal', 2.2); return true; } return B0.blockMap(); }, save:() => B0.save(),
    respawn, bossReady:k => BOSS[k] && BOSS[k].rd ? false : B0.bossReady(k), bossAI:(B, dt, ph, ang, d) => B.rd ? bossAI(B, dt) : B0.bossAI(B, dt, ph, ang, d), bossDown:B => B.rd ? rbDown(B) : B0.bossDown(B),
    hurtBoss:(B, dmg) => B.rd ? hurtRB(B, dmg) : B0.hurtBoss(B, dmg), drawBoss, drawFoe, drawBar, portrait:(who, x, y, mood) => B0.portrait(who, x, y, mood),
    raidOn:on, raidMods:() => run ? run.mods : null, warTable, raidAdm:adm, mauSpot, mateSpot, RAIDS, RS, startRun, leaveRun, GS, run:() => run, F:() => F, hz:() => hz, kicks:() => kicks, vic:() => vic, KIT, DIFF});
  // resume a raid the page was reloaded in the middle of: you start at the War Table with "Resume"
  return RD; };
A.RAIDS = {RAIDS, KIT, DIFF, MODS};
})();
