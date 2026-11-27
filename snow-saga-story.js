// Wilderland Arcade · THE DUMPLING SAGA, part 2: the STORY.
// Nine chapters across the new lands, region bosses, and DUMPLING: a small, pudgy, cold and terrifyingly powerful gecko
// in a tiny dark crown and a frost-stained cloak, held back by an ancient seal. Fights 1–5 are "fake" (his bar runs out and
// he simply leaves). Fight 6 has a full-screen bar that zigzags across 3 rows, 10 phases and checkpoints.
// Saved in PERM.ow.saga (chapter, step, fights, checkpoints). NOTHING resets.
(function(){
'use strict';
const A = window.Arcade; if (!A) return;
const SAGA = A.SAGA = A.SAGA || {}, TAU = Math.PI*2;
SAGA.storyInit = (S, SG) => {
  const {g, W, X, p, TS, BOSS, LAIR, FOE} = S, SV = SG.SV, A2 = S.A, SC = S.SC;
  SV.fights = SV.fights || {}; SV.flags = SV.flags || {};
  const DUMQ = ['Dumpling', 'dump'], PELLQ = ['Archivist Pell', 'owl'], LOKQ = ['Loki', 'loki'], PIPQ = ['Old Pip', 'pip'], MAUQ = S.MAUF, BAUQ = S.BAUF, NAR = ['', 'none'], TAMQ = ['Tamsin the Herder', 'kid:Tamsin'];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const BOARD = {x:57.5*TS, y:84.6*TS}, LOKI_AT = {x:BOARD.x + 70, y:BOARD.y + 20};
  // ---------- region bosses ----------
  const RB = {frostfang:{k:'sg_ram', n:'THE AVALANCHE RAM', e:'🐏', hp:320, ph:3, col:'#eef4ff', ai:{walk:60, spread:2.2, dash:1, rock:3.2}, intro:'The Avalanche Ram: “BAAAH! The little gecko said NOBODY climbs my mountain!”'},
    glaciers:{k:'sg_walrus', n:'QUEEN WALRUMPA OF THE MIRROR ICE', e:'🦭', hp:380, ph:3, col:'#bfeeff', ai:{walk:40, spread:1.8, ring:3.4, summon:'golem', summonT:11}, intro:'Queen Walrumpa: “How DARE you slide into my glacier uninvited!”'},
    sunken:{k:'sg_tide', n:'THE TIDEWARDEN', e:'🐙', hp:440, ph:4, col:'#7ab8ff', ai:{walk:35, ring:2.6, spiral:1, burst:1}, intro:'The Tidewarden: “The temple sleeps beneath the water. Leave it sleeping.”'},
    whisper:{k:'sg_thorn', n:'OLD THORNMOTHER', e:'🌳', hp:500, ph:4, col:'#9fd8a0', ai:{walk:30, spread:2, rock:2.6, summon:'geck', summonT:9}, intro:'Old Thornmother: “Shhh… the forest is listening. And it does not like you.”'},
    sky:{k:'sg_whale', n:'SKYFIN, THE AURORA WHALE', e:'🐋', hp:560, ph:4, col:'#c9b0ff', ai:{walk:50, ring:2.4, spiral:1, dash:1}, intro:'Skyfin: “…the gecko… put a cold voice in my head… I can’t… stop…”'},
    desert:{k:'sg_scorp', n:'THE SANDGLASS SCORPION', e:'🦂', hp:620, ph:4, col:'#ffd08a', ai:{walk:70, spread:1.6, dash:1, burst:1}, intro:'The Sandglass Scorpion: “Click-click. The Prism Keys are buried. With YOU, next.”'},
    hollow:{k:'sg_matron', n:'THE GECKO MATRON', e:'🦎', hp:700, ph:4, col:'#9fe08a', ai:{walk:55, spread:1.5, summon:'geck', summonT:7, ring:3}, intro:'The Gecko Matron: “Our little king said you would come. He said you would lose.”'},
    citadel:{k:'sg_warden', n:'THE CITADEL WARDEN', e:'🛡️', hp:780, ph:4, col:'#b0a0ff', ai:{walk:45, spread:1.4, ring:2.6, spiral:1, summon:'imp', summonT:9}, intro:'The Citadel Warden: “No one passes the gates of the Little King.”'}};
  Object.keys(RB).forEach(r => { const b = RB[r]; BOSS[b.k] = {n:b.n, hp:b.hp, r:34, phases:b.ph, ai:b.ai, saga:1, draw:1, wake:430, intro:b.intro, region:r}; });
  // Dumpling's fights: 1–5 are fake (his bar is a lie), 6 is the real one (still sealed)
  const DUMP_AT = {1:'frostfang', 2:'sunken', 3:'sky', 4:'hollow', 5:'citadel', 6:'citadel'};
  [1, 2, 3, 4, 5].forEach(n => { BOSS['dump' + n] = {n:'DUMPLING · THE LITTLE KING', hp:260 + n*90, r:24, phases:3, saga:1, brain:1, bar:1, draw:1, wake:520, region:DUMP_AT[n], fight:n, intro:['', 'Dumpling: “You again? …Oh. We haven’t met. How tiresome.”', 'Dumpling: “The snowball child. Still throwing things, I see.”', 'Dumpling: “You followed me into the SKY? Persistent. Like a stain.”', 'Dumpling: “You walked into my home. Wipe your feet.”', 'Dumpling: “Enough. I’ve wasted enough time on you.”'][n]}; });
  BOSS.dump6 = {n:'DUMPLING · NO MORE GAMES', hp:4200, r:26, phases:10, saga:1, brain:1, bar:2, draw:1, wake:560, region:'citadel', fight:6, intro:'Dumpling: “Fine. No more games.”'};
  Object.keys(BOSS).forEach(k => { if (BOSS[k].saga && !LAIR[k]) LAIR[k] = {x:-1e6, y:-1e6}; });   // lairs move into a land when you get there
  const PH6 = ['', 'Frost Strikes', 'Wall Crawler', 'Tail Decoys', 'Camouflage', 'Blizzard Throne', 'Shatter Floor', 'Echoes', 'Giant Dumpling', 'Desperation', 'Final Stand'];
  // ---------- THE CHAPTERS ----------
  // step kinds: talk (someone, somewhere) · travel (reach a land) · tower · shrines (clear n here) · items (find them) · boss · dump (a Dumpling fight)
  const CH = [
    {n:'Tracks in the Snow', r:'frostfang', steps:[
      {k:'talk', at:{camp:'loki'}, who:LOKQ, g:'Loki is waiting at the Expedition Board at camp', lines:[[...LOKQ, 'Psst. Hero. Over here. It’s me, Loki. Reformed Loki. Nice Loki.', 'happy'], [...LOKQ, 'I need to tell you something. My dark frost magic, the stuff I used on the kingdom… I didn’t make it myself.', 'sad'], [...LOKQ, 'A little gecko gave it to me. Round. Squishy. Like a dumpling. With a tiny crown. He said, “Make some noise. I’m bored.”', 'sad'], [...MAUQ, 'A GECKO? Gave you the frost magic? And Chao Chao’s storms… could they have come from him too?', 'surprised'], [...LOKQ, 'His name is Dumpling. He went north, to the Frostfang Mountains. You’ll need Old Pip’s help to get up there.', 'smug']]},
      {k:'talk', at:{camp:'pip'}, who:PIPQ, g:'Ask Old Pip about the mountains', lines:[[...PIPQ, 'Dumpling? Oh dear. Oh dear oh dear. My grandmother told stories about a gecko who could freeze the sun.', 'sad'], [...PIPQ, 'Take this. The Snow Cloak. Jump off a ledge and you’ll glide over gaps, as long as you have stamina left.', 'happy'], [...NAR, '🧥 You got the SNOW CLOAK! Walk into a gap or chasm to glide. Walk into a cliff to climb it. Both use stamina (the green wheel).', ''], [...PIPQ, 'The new lands are on the Expedition Board, next to the campfire. Be careful out there, young one.', 'happy']], done:() => { SV.cloak = 1; }},
      {k:'travel', r:'frostfang', g:'Travel to the Frostfang Mountains (Expedition Board at camp)'},
      {k:'talk', at:{npc:0}, who:TAMQ, g:'Find the herder in the mountains', lines:[[...TAMQ, 'A stranger! Up here! Did the avalanche bring you? It brings everything else.', 'surprised'], [...TAMQ, 'Small round tracks, sticky ones, going straight UP the cliffs. Something climbs walls up here.', 'frightened'], [...TAMQ, 'Climb the old watchtower first. From the top you can see the whole mountain.', 'happy']]},
      {k:'tower', r:'frostfang', g:'Climb the Frostfang watchtower (🗼) to reveal the map'},
      {k:'shrines', r:'frostfang', n:1, g:'Clear an Ice Shrine (🧊) in the mountains'},
      {k:'boss', r:'frostfang', boss:'sg_ram', g:'Defeat the Avalanche Ram at the summit'},
      {k:'dump', r:'frostfang', n:1, g:'Something small is waiting at the summit…', pre:[[...NAR, '*A small, round shape sits on a rock, licking its own eyeball. It doesn’t look up.*', ''], [...DUMQ, 'You broke my goat.', 'smug'], [...DUMQ, 'I suppose I should be annoyed. I’m mostly bored.', 'smug']]}]},
    {n:'The Seal Archivist', r:'glaciers', steps:[
      {k:'travel', r:'glaciers', g:'Travel to the Glimmering Glaciers'},
      {k:'talk', at:{npc:0}, who:PELLQ, g:'Find the snowy owl who keeps the old records', lines:[[...PELLQ, 'Hoo. A visitor. And one who has met HIM, by the look of your cloak. Frost-singed.', 'mysterious'], [...PELLQ, 'Dumpling is very, very old. Long ago he tried to freeze the whole world. The first spirits wrapped him in a SEAL: nine chains of light.', 'sad'], [...PELLQ, 'The seal is still on him. That is why he is small. That is why he is… lazy. He is fighting with a sliver of his strength.', 'mysterious'], [...MAUQ, 'A SLIVER?! He knocked me into a snowbank with his TAIL!', 'surprised'], [...PELLQ, 'Then I suggest you find the seal fragments that fell here, before he does.', 'mysterious']]},
      {k:'items', r:'glaciers', g:'Find 3 glowing seal fragments in the glaciers', list:[{at:'npc1', e:'✨', line:[[...NAR, '*A sliver of golden light, warm even in the ice.*', '']]}, {at:'tower', e:'✨', line:[[...NAR, '*Another fragment. It hums when you hold it.*', '']]}, {at:'npc2', e:'✨', line:[[...PELLQ, 'That’s all three. Hoo. Keep them close. He will want them back.', 'mysterious']]}]},
      {k:'shrines', r:'glaciers', n:2, g:'Clear 2 Ice Shrines in the glaciers'},
      {k:'boss', r:'glaciers', boss:'sg_walrus', g:'Defeat Queen Walrumpa of the Mirror Ice'}]},
    {n:'The Drowned Temple', r:'sunken', steps:[
      {k:'travel', r:'sunken', g:'Travel to the Sunken Ice Temple'},
      {k:'talk', at:{npc:0}, who:PELLQ, g:'Meet Archivist Pell at the temple', lines:[[...PELLQ, 'The Seal Key sleeps at the bottom of this temple. If Dumpling gets it, he can loosen his own chains.', 'frightened'], [...PELLQ, 'Tip: throw a snowball at water and it freezes into a bridge for a little while. Swimming tires you out.', 'happy']]},
      {k:'items', r:'sunken', g:'Light the 3 drowned altars', list:[{at:'npc1', e:'🕯️', line:[[...NAR, '*The first altar flickers to life.*', '']]}, {at:'tower', e:'🕯️', line:[[...NAR, '*The second altar burns blue.*', '']]}, {at:'npc2', e:'🕯️', line:[[...NAR, '*The third altar. The water trembles. Something deep down wakes up.*', '']]}]},
      {k:'boss', r:'sunken', boss:'sg_tide', g:'Defeat the Tidewarden'},
      {k:'dump', r:'sunken', n:2, g:'The Seal Key! Someone else is reaching for it…', pre:[[...NAR, '*A small hand with sticky toe pads closes around the Seal Key.*', ''], [...DUMQ, 'Thank you for opening the door. That was the only useful thing you have ever done.', 'smug']]}]},
    {n:'Whispers in the Fog', r:'whisper', steps:[
      {k:'travel', r:'whisper', g:'Travel to Whisperwood Forest'},
      {k:'talk', at:{npc:0}, who:BAUQ, g:'Bau Bau is waiting in the forest', lines:[[...BAUQ, 'I came as fast as I could. The trees here are whispering his name. Dumpling, Dumpling, Dumpling.', 'sad'], [...BAUQ, 'He dropped his scrolls when he passed through. Plans. If we read them, we know what he wants.', 'peaceful']]},
      {k:'items', r:'whisper', g:'Find Dumpling’s 4 lost scrolls in the fog', list:[{at:'npc1', e:'📜', line:[[...NAR, '“Step one: get bored. Step two: get the Seal Key. Done.”', '']]}, {at:'tower', e:'📜', line:[[...NAR, '“Three Prism Keys open the Hollow’s heart. Desert. Buried. Obviously.”', '']]}, {at:'npc2', e:'📜', line:[[...NAR, '“When the chains are loose enough, the Citadel will sing.”', '']]}, {at:'lair', e:'📜', line:[[...BAUQ, 'The Citadel… He means to break the seal there. We have to stop him.', 'sad']]}]},
      {k:'shrines', r:'whisper', n:2, g:'Clear 2 Ice Shrines in Whisperwood'},
      {k:'boss', r:'whisper', boss:'sg_thorn', g:'Defeat Old Thornmother'}]},
    {n:'Islands in the Sky', r:'sky', steps:[
      {k:'travel', r:'sky', g:'Travel to the Aurora Sky Islands'},
      {k:'tower', r:'sky', g:'Climb the sky tower to see the islands'},
      {k:'shrines', r:'sky', n:2, g:'Clear 2 Ice Shrines among the islands'},
      {k:'boss', r:'sky', boss:'sg_whale', g:'Free Skyfin, the Aurora Whale'},
      {k:'dump', r:'sky', n:3, g:'On the highest island, a crown glints…', pre:[[...NAR, '*Skyfin sighs and drifts away, free. On the highest island, Dumpling is sitting very still. Too still.*', ''], [...DUMQ, 'I can blend into anything, you know. Sky. Snow. Your nightmares.', 'smug']]}]},
    {n:'The Crystal Storm', r:'desert', steps:[
      {k:'travel', r:'desert', g:'Travel to the Crystal Desert'},
      {k:'items', r:'desert', g:'Dig up the 3 Prism Keys before the geckos do', list:[{at:'npc0', e:'🔺', line:[[...NAR, '*The first Prism Key, buried in glittering sand.*', '']]}, {at:'npc1', e:'🔷', line:[[...NAR, '*The second Prism Key hums with lightning.*', '']]}, {at:'npc2', e:'🔶', line:[[...MAUQ, 'All three! Now the Hollow can’t lock us out. Snack break first? No? Fine.', 'happy']]}]},
      {k:'shrines', r:'desert', n:2, g:'Clear 2 Ice Shrines in the desert'},
      {k:'boss', r:'desert', boss:'sg_scorp', g:'Defeat the Sandglass Scorpion'}]},
    {n:'Gecko’s Hollow', r:'hollow', steps:[
      {k:'travel', r:'hollow', g:'Travel to Gecko’s Hollow'},
      {k:'talk', at:{npc:0}, who:['Sam', 'kid:Sam'], g:'Someone is hiding in the hollow', lines:[[...['Sam', 'kid:Sam'], 'You came! I followed the geckos in and got lost. There are THOUSANDS of them. On the ceiling!', 'frightened'], [...['Sam', 'kid:Sam'], 'The big one, the Matron, guards the way to his throne. And he… he drops his TAIL and it keeps fighting.', 'frightened']]},
      {k:'boss', r:'hollow', boss:'sg_matron', g:'Defeat the Gecko Matron'},
      {k:'dump', r:'hollow', n:4, g:'Dumpling’s throne room', pre:[[...DUMQ, 'You walked into my home. Wipe your feet.', 'smug'], [...DUMQ, 'Do you know how long I have waited in this little body? Do you know how BORING that is?', 'angry']]}]},
    {n:'The Citadel Gates', r:'citadel', steps:[
      {k:'travel', r:'citadel', g:'Travel to Dumpling’s Citadel'},
      {k:'talk', at:{npc:0}, who:LOKQ, g:'Gather the team: Loki', lines:[[...LOKQ, 'I owe you. I owe the whole kingdom. My magic is yours today.', 'happy']]},
      {k:'talk', at:{npc:1}, who:PELLQ, g:'Gather the team: Archivist Pell', lines:[[...PELLQ, 'The seal is still holding. Barely. Whatever happens in there, do NOT let him finish a ritual.', 'frightened']]},
      {k:'talk', at:{npc:2}, who:BAUQ, g:'Gather the team: Bau Bau', lines:[[...BAUQ, 'Everyone is here. Mau Mau, Maya, Leo, Ava, Sam, Loki, Pell. We go in together.', 'peaceful'], [...MAUQ, 'Royal Guard Mau Mau, ready. I packed snacks for the final battle. Eleven snacks.', 'happy']]},
      {k:'boss', r:'citadel', boss:'sg_warden', g:'Defeat the Citadel Warden at the gates'},
      {k:'dump', r:'citadel', n:5, g:'Dumpling blocks the gates', pre:[[...DUMQ, 'Enough. I’ve wasted enough time on you.', 'angry']]}]},
    {n:'Fine. No More Games.', r:'citadel', steps:[
      {k:'talk', at:{npc:2}, who:MAUQ, g:'Talk to Mau Mau before the final battle', lines:[[...MAUQ, 'Hero. Every time we fought him, his bar ran out and he just… left. He wasn’t even trying.', 'sad'], [...MAUQ, 'This time he will. I can feel it in my whiskers. Let’s make it count.', 'happy']]},
      {k:'final', r:'citadel', g:'Face Dumpling in the heart of the Citadel'}]}];
  const NCH = CH.length;
  // ---------- story state ----------
  const started = () => (W.sp|0) >= 6;
  const chNow = () => CH[SV.ch]; const stepNow = () => { const c = chNow(); return c ? c.steps[SV.step] : null; };
  const unlocked = id => { const R = SG.REGIONS[SG.RIDX[id]]; if (!started()) return false; if (R.post) return !!(SV.post && (SV.postUnlock || {})[id]); return SV.ch + 1 >= R.ch || (SV.ch >= NCH); };
  const lockText = id => { const R = SG.REGIONS[SG.RIDX[id]]; if (!started()) return 'Finish “Spirits of the Snow” first'; if (R.post) return 'After the credits…'; return 'Opens in Chapter ' + R.ch; };
  const advance = () => { const c = chNow(); if (!c) return; SV.step++; if (SV.step >= c.steps.length) { SV.ch++; SV.step = 0; const n2 = chNow(); A2.sfx('win'); S.give({frost:30, flakes:2000, xp:200}); X.stat && X.stat('sagaChapter', SV.ch, 'max');
      S.say(n2 ? '📖 Chapter ' + (SV.ch + 1) + ': ' + n2.n + (SG.REGIONS[SG.RIDX[n2.r]] ? ' · ' + SG.REGIONS[SG.RIDX[n2.r]].n + ' is open on the Expedition Board' : '') : '🏆 The Dumpling Saga: main story complete!', 4.5); }
    else { const s2 = stepNow(); if (s2 && s2.g) S.say('🎯 ' + s2.g, 3); } S.save(); };
  // where a step happens
  const where = (s2, cur, C, W2T) => { if (!s2) return null; if (s2.at && s2.at.camp) return {camp:1, pos:s2.at.camp == 'loki' ? LOKI_AT : s2.at.camp == 'pip' ? S.PIP : S.THRONE};
    const r = s2.r || chNow().r; if (cur != r || !C) return {r}; if (s2.k == 'boss' || s2.k == 'dump') return {r, pos:W2T(C.lair)}; if (s2.k == 'final') return {r, pos:W2T({x:48, y:17})}; if (s2.k == 'tower') return {r, pos:W2T(C.tower)};
    if (s2.k == 'shrines') { const j = C.shrines.findIndex((q, j2) => !SV.shr[r + ':' + j2]); return {r, pos:j >= 0 ? W2T(C.shrines[j]) : W2T(C.spawn)}; }
    if (s2.k == 'items') { const i = s2.list.findIndex((it, j) => !SV.flags['it:' + SV.ch + ':' + j]); const it = s2.list[Math.max(0, i)]; return {r, pos:atPos(it.at, C, W2T)}; }
    if (s2.at && s2.at.npc != null) return {r, pos:W2T(C.npcs[s2.at.npc])}; return {r, pos:W2T(C.spawn)}; };
  const atPos = (a, C, W2T) => a == 'tower' ? {x:W2T(C.tower).x + 70, y:W2T(C.tower).y + 30} : a == 'lair' ? W2T(C.lair) : a.slice(0, 3) == 'npc' ? W2T(C.npcs[+a[3]]) : W2T(C.spawn);
  const shrinesHere = r => [0, 1, 2, 3, 4, 5].filter(j => SV.shr[r + ':' + j]).length;
  // automatic step checks
  const autoCheck = (cur) => { const s2 = stepNow(); if (!s2 || S.dlg) return;
    if (s2.k == 'travel' && cur == s2.r) advance();
    else if (s2.k == 'tower' && SV.tow[s2.r]) advance();
    else if (s2.k == 'shrines' && shrinesHere(s2.r) >= s2.n) advance(); };
  // ---------- quest goal (arrow + HUD) ----------
  const goal = (cur, C, W2T) => { if (!started() || S.raid || S.siege) return null; if (SV.ch >= NCH) return postGoal(cur, C, W2T); const s2 = stepNow(); if (!s2) return null; const w = where(s2, cur, C, W2T), pre = '🦎 Ch ' + (SV.ch + 1) + ' · ';
    if (w.camp) { if (cur) return {...W2T(C.spawn), x:W2T(C.spawn).x - 40, n:pre + 'Return to camp · ' + s2.g}; return {...w.pos, n:pre + s2.g}; }
    if (!cur) return {...BOARD, n:pre + 'Travel to ' + SG.REGIONS[SG.RIDX[w.r]].n + ' (Expedition Board)'};
    if (cur != w.r) return {x:W2T(C.spawn).x - 40, y:W2T(C.spawn).y + 30, n:pre + 'Return to camp, then travel to ' + SG.REGIONS[SG.RIDX[w.r]].n};
    const extra = s2.k == 'shrines' ? ' (' + shrinesHere(s2.r) + '/' + s2.n + ')' : s2.k == 'items' ? ' (' + s2.list.filter((it, j) => SV.flags['it:' + SV.ch + ':' + j]).length + '/' + s2.list.length + ')' : '';
    return {...w.pos, n:pre + s2.g + extra}; };
  let postGoal = () => null;   // filled in by the post-game (Cat Gone Missing)
  // ---------- things to use ----------
  const things = (L, cur, C, W2T) => { if (!started()) return; const s2 = stepNow(); if (!s2) { if (SAGA.postThings) SAGA.postThings(L, cur, C, W2T, api); return; } const w = where(s2, cur, C, W2T);
    if (s2.k == 'talk' && w && w.pos && ((w.camp && !cur) || (!w.camp && cur == w.r))) L.push({x:w.pos.x, y:w.pos.y + (w.camp && s2.at.camp == 'pip' ? 0 : 6), n:'⭐ Talk', f:() => S.talk(s2.lines, () => { if (s2.done) s2.done(); advance(); })});
    if (s2.k == 'items' && cur == s2.r) s2.list.forEach((it, j) => { const k = 'it:' + SV.ch + ':' + j; if (SV.flags[k]) return; const q = atPos(it.at, C, W2T); L.push({x:q.x, y:q.y, n:'Pick up ' + it.e, f:() => { SV.flags[k] = 1; A2.sfx('coin'); S.save(); const left = s2.list.filter((x2, j2) => !SV.flags['it:' + SV.ch + ':' + j2]).length; S.talk(it.line, () => { if (!left) advance(); else S.say(it.e + ' ' + (s2.list.length - left) + ' / ' + s2.list.length, 2); }); }}); }); };
  // ---------- bosses wake when the step is ready ----------
  const PST = k => SAGA.post && BOSS[k] && BOSS[k].post;
  const bossReady = (k, cur) => { if (PST(k)) return SAGA.post.bossReady(k, cur); const s2 = stepNow(); if (!s2 || !cur) return false; const C = SG.C(); if (!C) return false;
    if (s2.k == 'boss' && s2.boss == k && cur == s2.r && !W.down[k]) { LAIR[k] = SG.W2T(C.lair); return true; }
    if (s2.k == 'dump' && k == 'dump' + s2.n && cur == s2.r && !SV.fights[s2.n] && !leaving) { LAIR[k] = SG.W2T(C.lair); if (!s2.saidPre && s2.pre && dist(p, LAIR[k]) < 520) { s2.saidPre = 1; S.talk(s2.pre); return false; } return !!s2.saidPre || !s2.pre; }
    if (s2.k == 'final' && k == 'dump6' && cur == 'citadel' && !SV.fights[6]) { LAIR[k] = SG.W2T({x:48, y:17}); return true; }
    return false; };
  // ---------- DUMPLING ----------
  const DQ = {bored:['Dumpling: “Are you done? I’m bored.”', 'Dumpling: “Yawn.”', 'Dumpling: “You throw like a snowflake. A tired one.”', 'Dumpling: “I’ve had naps more dangerous than you.”', 'Dumpling: “*licks eyeball*”'], hit:['Dumpling: “Ow. That was almost a feeling.”', 'Dumpling: “Rude.”', 'Dumpling: “Do that again and I’ll pretend to notice.”']};
  let hz = [], prints = [], leaving = null, crack = 0, team = 0, teamReady = false, teamFx = 0, wsp = [], f6 = {fill:0, plat:false};
  const hazard = (x, y, r, t, dmg, col) => { if (hz.length < 30) hz.push({x, y, r, t, t0:t, dmg:dmg || 1, col:col || '#9fe8ff'}); };
  const say2 = (B, txt, d) => { B.talk = txt; B.talkT = d || 2.6; };
  const dumpAI = (B, dt, ph, ang, d) => { if (PST(B.k)) return SAGA.post.ai(B, dt, ph, ang, d); B.fight = B.fight || BOSS[B.k].fight; if (!B.mus) { B.mus = 1; if (window.WLMusic && window.WLMusic.mood) try { window.WLMusic.mood(B.fight >= 5 ? 'dump3' : B.fight >= 3 ? 'dump2' : 'dump1'); } catch (e) {} } const F = B.fight, sp1 = 1 + .22*(ph - 1) + .12*(F - 1), D3 = A2.D(.8, 1, 1.2);
    if (F == 6) return sixAI(B, dt, ph, ang, d);
    B.qT = (B.qT == null ? 5 : B.qT) - dt; if (B.qT <= 0) { B.qT = 6 + Math.random()*5; say2(B, DQ.bored[Math.floor(Math.random()*DQ.bored.length)]); B.lick = 1.2; } B.lick = Math.max(0, (B.lick || 0) - dt);
    // darting like a gecko
    B.mv = (B.mv || 0) - dt; if (B.mv <= 0) { B.mv = (1.4 + Math.random())/sp1; const a = Math.random()*TAU, r = 80 + Math.random()*180; B.tx = B.hx + Math.cos(a)*r; B.ty = B.hy + Math.sin(a)*r; }
    const da = Math.atan2(B.ty - B.y, B.tx - B.x), dd = Math.hypot(B.tx - B.x, B.ty - B.y); if (dd > 6) { const nx = B.x + Math.cos(da)*Math.min(dd, 260*dt*sp1), ny = B.y + Math.sin(da)*Math.min(dd, 260*dt*sp1); if (!S.blocked(nx, ny, 14) || F >= 2) { B.x = nx; B.y = ny; } }
    // 1+: frost strikes
    B.cd2 = (B.cd2 == null ? 1.6 : B.cd2) - dt; if (B.cd2 <= 0) { B.cd2 = (1.7 - .12*F)/sp1; const n = 3 + Math.min(4, F - 1 + ph - 1); for (let i = 0; i < n; i++) S.shot(B, ang + (i - (n - 1)/2)*.16, 250*D3, {r:7, col:'#bfeeff'}); }
    // 2+: wall crawl (vanish into the arena edge and spray from it) and tail decoys
    if (F >= 2) { B.wc = (B.wc == null ? 6 : B.wc) - dt; if (B.wc <= 0) { B.wc = 7/sp1; const a = Math.random()*TAU; B.x = B.hx + Math.cos(a)*300; B.y = B.hy + Math.sin(a)*300; B.tx = B.x; B.ty = B.y; B.mv = 1.2; for (let i = 0; i < 10; i++) S.shot(B, Math.atan2(B.hy - B.y, B.hx - B.x) + (i - 4.5)*.12, 220*D3, {r:6, col:'#9fe8ff'}); say2(B, 'Dumpling: “Up here. Obviously.”', 1.6); }
      B.tl = (B.tl == null ? 9 : B.tl) - dt; if (B.tl <= 0 && S.foes.length < 10) { B.tl = 10/sp1; S.spawnFoe(F >= 4 ? 'geck' : 'decoy', B.x, B.y + 10); B.tail = 3; say2(B, 'Dumpling: “Keep my tail. I have plenty.”', 2); } B.tail = Math.max(0, (B.tail || 0) - dt); }
    // 3+: camouflage and falling ice
    if (F >= 3) { B.cm = (B.cm == null ? 8 : B.cm) - dt; if (B.cm <= 0) { B.cm = 12/sp1; B.camo = 4; } B.camo = Math.max(0, (B.camo || 0) - dt); if (B.camo > 0) { B.pt = (B.pt || 0) - dt; if (B.pt <= 0) { B.pt = .25; prints.push({x:B.x, y:B.y + 14, t:3}); } }
      B.ir = (B.ir == null ? 4 : B.ir) - dt; if (B.ir <= 0) { B.ir = (5 - .4*F)/sp1; for (let i = 0; i < 2 + F; i++) hazard(p.x + (Math.random() - .5)*260, p.y + (Math.random() - .5)*260, 34, 1.3); } }
    // 4+: rings; 5: spirals and minions
    if (F >= 4) { B.rg = (B.rg == null ? 3 : B.rg) - dt; if (B.rg <= 0) { B.rg = 3.2/sp1; for (let i = 0; i < 16; i++) S.shot(B, i/16*TAU + B.t, 170*D3, {r:6, col:'#c9e8ff'}); } }
    if (F >= 5) { B.spT = (B.spT || 0) - dt; if (B.spT <= 0) { B.spT = .14; B.a = (B.a || 0) + .37; S.shot(B, B.a, 150, {r:5, col:'#9fe8ff'}); } B.sm = (B.sm == null ? 6 : B.sm) - dt; if (B.sm <= 0 && S.foes.length < 8) { B.sm = 8; S.spawnFoe('geckspit', B.hx - 120, B.hy + 60); S.spawnFoe('geck', B.hx + 120, B.hy + 60); } }
    if (d < B.r + 14 && B.camo <= 0) S.hurtMe(1); };
  // ---------- THE 6TH FIGHT: 10 phases ----------
  const ARENA = {x0:33, x1:63, y0:2, y1:31};   // the citadel keep (region tiles)
  const arenaW = () => ({x0:(S.RX + ARENA.x0 + .5)*TS, x1:(S.RX + ARENA.x1 - .5)*TS, y0:(ARENA.y0 + .5)*TS, y1:(ARENA.y1 - .5)*TS});
  const shatter = on => { const C = SG.C(); if (!C) return; f6.plat = on; for (let y = ARENA.y0 + 1; y < ARENA.y1; y++) for (let x = ARENA.x0 + 1; x < ARENA.x1; x++) { const k = y*SG.RW + x; if (on) { const plat = (x % 6) < 3 && (y % 6) < 3; if (!plat && C.M[k] == S.T.FLOOR) C.temp.set(k, {v:SG.T.CHASM, t:9999}); } else if (C.temp.has(k) && C.temp.get(k).v == SG.T.CHASM) C.temp.delete(k); } };
  const sixAI = (B, dt, ph, ang, d) => { W.bhp = W.bhp || {}; W.bhp.dump6 = Math.max(1, Math.ceil(B.hp));   // knocked out or left: he comes back at the top of this phase
  const D3 = A2.D(.8, 1, 1.25), sp1 = 1 + .06*ph, aw = arenaW(); B.phn = PH6[ph]; B.lick = Math.max(0, (B.lick || 0) - dt);
    if (B.lastPh != ph) { B.lastPh = ph; SV.fights.cp6 = Math.max(SV.fights.cp6 || 1, ph); S.save(); say2(B, ['', '', 'Dumpling: “Walls are just floors that stand up.”', 'Dumpling: “Which tail is me? Guess.”', 'Dumpling: “Can you see me now? No? Good.”', 'Dumpling: “Sit down. I have a throne for this.”', 'Dumpling: “Let’s see you stand on NOTHING.”', 'Dumpling: “Remember your old friends? I made them.”', 'Dumpling: “I am done being small.”', 'Dumpling: “STOP. HITTING. ME.”', 'Dumpling: “…all of you? Together? How… annoying.”'][ph], 3);
      if (ph >= 2) S.say('⚔ Checkpoint! Phase ' + ph + ': ' + PH6[ph], 3); shatter(ph == 6); B.camo = 0; if (ph == 8) { B.giant = 0; wsp = [0, 1, 2].map(i => ({a:i*TAU/3, hp:1})); } if (ph != 8) { B.giant = 0; } if (ph == 10) { team = 0; teamReady = false; } if (ph == 7) { for (let i = 0; i < 3 && S.foes.length < 10; i++) S.spawnFoe('echo', B.x + (i - 1)*120, B.y + 80); S.tornado = {x:B.x, y:B.y + 80, r:46, t:0, life:12}; }
      if (window.WLMusic && window.WLMusic.mood) try { window.WLMusic.mood(ph >= 9 ? 'dump3' : ph >= 5 ? 'dump2' : 'dump1'); } catch (e) {} }
    const goTo = (tx, ty, spd) => { const a = Math.atan2(ty - B.y, tx - B.x), dd = Math.hypot(tx - B.x, ty - B.y); if (dd > 4) { B.x += Math.cos(a)*Math.min(dd, spd*dt); B.y += Math.sin(a)*Math.min(dd, spd*dt); } };
    const dart = () => { B.mv = (B.mv || 0) - dt; if (B.mv <= 0) { B.mv = 1.1/sp1; B.tx = aw.x0 + 60 + Math.random()*(aw.x1 - aw.x0 - 120); B.ty = aw.y0 + 60 + Math.random()*(aw.y1 - aw.y0 - 120); } goTo(B.tx, B.ty, 300*sp1); };
    const volley = (iv, n, spd) => { B.cd2 = (B.cd2 == null ? 1 : B.cd2) - dt; if (B.cd2 <= 0) { B.cd2 = iv; for (let i = 0; i < n; i++) S.shot(B, ang + (i - (n - 1)/2)*.15, spd*D3, {r:7, col:'#bfeeff'}); } };
    const ring = (iv, n, spd) => { B.rg = (B.rg == null ? 1 : B.rg) - dt; if (B.rg <= 0) { B.rg = iv; for (let i = 0; i < n; i++) S.shot(B, i/n*TAU + B.t*.7, spd*D3, {r:6, col:'#c9e8ff'}); } };
    const rain = (iv, n) => { B.ir = (B.ir == null ? 1 : B.ir) - dt; if (B.ir <= 0) { B.ir = iv; for (let i = 0; i < n; i++) hazard(p.x + (Math.random() - .5)*300, p.y + (Math.random() - .5)*300, 38, 1.2); } };
    if (ph == 1) { dart(); volley(.85, 5, 290); }
    else if (ph == 2) { B.wa = (B.wa || 0) + dt*.55*sp1; const per = 2*((aw.x1 - aw.x0) + (aw.y1 - aw.y0)), u = ((B.wa*700) % per + per) % per, W1 = aw.x1 - aw.x0, H1 = aw.y1 - aw.y0; const pt = u < W1 ? [aw.x0 + u, aw.y0] : u < W1 + H1 ? [aw.x1, aw.y0 + u - W1] : u < 2*W1 + H1 ? [aw.x1 - (u - W1 - H1), aw.y1] : [aw.x0, aw.y1 - (u - 2*W1 - H1)]; B.x = pt[0]; B.y = pt[1]; volley(.55, 3, 300); ring(2.6, 12, 160); }
    else if (ph == 3) { dart(); volley(1.1, 3, 260); B.tl = (B.tl == null ? .5 : B.tl) - dt; if (B.tl <= 0 && S.foes.length < 9) { B.tl = 3.2; S.spawnFoe('decoy', B.x + 40, B.y); S.spawnFoe('echo', B.x - 60, B.y + 30); B.tail = 2; } B.tail = Math.max(0, (B.tail || 0) - dt); }
    else if (ph == 4) { dart(); B.camo = 1; B.pt = (B.pt || 0) - dt; if (B.pt <= 0) { B.pt = .22; prints.push({x:B.x, y:B.y + 14, t:2.6}); if (Math.random() < .25) A2.tone(900 + Math.random()*300, .03, 'sine', .02); } volley(1.3, 4, 250); }
    else if (ph == 5) { goTo((aw.x0 + aw.x1)/2, aw.y0 + 120, 260); S.blizzard = Math.max(S.blizzard, 6); ring(1.8, 18, 150); B.sm = (B.sm == null ? 1 : B.sm) - dt; if (B.sm <= 0 && S.foes.length < 8) { B.sm = 5; S.spawnFoe('geck', aw.x0 + 80, aw.y1 - 80); S.spawnFoe('geckspit', aw.x1 - 80, aw.y1 - 80); } }
    else if (ph == 6) { dart(); volley(1, 5, 260); rain(2.4, 3); }
    else if (ph == 7) { dart(); volley(1.2, 3, 260); ring(2.8, 14, 150); B.cm2 = (B.cm2 == null ? 8 : B.cm2) - dt; if (B.cm2 <= 0 && S.foes.length < 9) { B.cm2 = 9; S.spawnFoe('echo', B.x, B.y + 60); S.spawnFoe('clone', B.x + 100, B.y); } }
    else if (ph == 8) { B.giant = Math.min(1, (B.giant || 0) + dt*.6); goTo((aw.x0 + aw.x1)/2, (aw.y0 + aw.y1)/2 - 40, 120); wsp.forEach((w, i) => { w.a += dt*.7; }); ring(2.2, 20, 140); B.st2 = (B.st2 == null ? 3 : B.st2) - dt; if (B.st2 <= 0) { B.st2 = 3.4; S.shakeV = 10; for (let r = 0; r < 3; r++) hazard(B.x + (Math.random() - .5)*400, B.y + 100 + Math.random()*200, 60, 1.1, 2, '#ffd0a0'); } }
    else if (ph == 9) { dart(); volley(.6, 5, 320); ring(1.9, 16, 170); rain(2, 4); B.tl = (B.tl == null ? 2 : B.tl) - dt; if (B.tl <= 0 && S.foes.length < 8) { B.tl = 4; S.spawnFoe('decoy', B.x, B.y); } }
    else { dart(); volley(.9, 4, 280); ring(2.6, 14, 150); team = Math.min(1, team + dt*.012); if (team >= 1 && !teamReady) { teamReady = true; S.say('💥 TEAM ATTACK READY! Press E (or tap ✋) next to Dumpling… or anywhere!', 4); A2.sfx('win'); } }
    if (d < B.r*(1 + 1.6*(B.giant || 0)) + 14 && ph != 4) S.hurtMe(ph >= 8 ? 2 : 1); };
  const teamAttack = () => { const B = S.boss; if (!B || B.k != 'dump6' || !teamReady) return false; teamReady = false; team = 0; teamFx = 3.2; S.shakeV = 14; S.cheerT = 3; A2.sfx('win'); B.allowHit = 1; S.hurtBoss(B.max*.035*A2.D(1.2, 1, .9)); B.allowHit = 0; S.say('💥 TEAM ATTACK! Mau Mau, Bau Bau, Maya, Leo, Ava, Sam and Loki all at once!', 3.4); return true; };
  // damage rules: phase 8 only on weak spots, phase 10 builds the team meter
  const hurtBoss = (B, dmg) => { if (PST(B.k)) return SAGA.post.hurt(B, dmg); if (B.allowHit) return false; if (B.k == 'dump6') { if (B.ph == 8 && (B.giant || 0) > .5) { if (Math.random() < .2) S.addNum(B.x, B.y - 60, 'Hit the glowing weak spots!', '#F9BF01'); return true; } if (B.ph == 10) team = Math.min(1, team + .02); }
    if (B.fight && B.fight < 6 && Math.random() < .08) say2(B, DQ.hit[Math.floor(Math.random()*DQ.hit.length)], 1.8); return false; };
  // ---------- when a boss's bar runs out ----------
  const bossDown = B => { if (PST(B.k)) { SAGA.post.down(B); return; } const s2 = stepNow(); S.splat(B.x, B.y, 30, '#ffe9a0');
    if (B.k.slice(0, 3) == 'sg_') { A2.sfx('win'); S.cheerT = 2.5; S.shakeV = 8; const it = S.give({frost:40 + 6*SG.RIDX[BOSS[B.k].region], flakes:2500, xp:250, score:6000, gear:4}); W.down[B.k] = 1; S.say('🏆 ' + BOSS[B.k].n.toLowerCase().replace(/\b\w/g, m => m.toUpperCase()) + ' defeated! +' + (40 + 6*SG.RIDX[BOSS[B.k].region]) + ' Frost' + (it ? ' · ' + it.name : ''), 4.5); if (s2 && s2.k == 'boss' && s2.boss == B.k) advance(); return; }
    if (B.k == 'dump6') { finale(B); return; }
    // a FAKE fight: the bar was a lie. He just leaves.
    const n = B.fight || BOSS[B.k].fight; SV.fights[n] = 1; crack = 4.5; leaving = {x:B.x, y:B.y, t:3.2, n}; S.foes = S.foes.filter(f => !S.FOE[f.k].clone && !S.FOE[f.k].gecko); hz = []; prints = [];
    S.give({frost:35 + 10*n, flakes:3000, xp:300, score:8000, gear:Math.min(5, 3 + Math.floor(n/2))}); X.stat && X.stat('sagaDump', n, 'max');
    const lines = {1:[[...DUMQ, '*yawns* …There. Your little bar is empty. Feel proud.', 'smug'], [...DUMQ, 'You’re not worth my time.', 'smug'], [...NAR, '*Dumpling scurries straight up the cliff and is gone.*', ''], [...MAUQ, 'We… won? Then why does it feel like he let us?', 'frightened'], [...MAUQ, 'Look at his health bar. It CRACKED. There was more underneath. A lot more. He wasn’t even trying.', 'surprised']],
      2:[[...DUMQ, '*brushes snow off his cloak* Mm. That tickled.', 'smug'], [...DUMQ, 'I have the Seal Key. You have… a nice throwing arm. Goodbye.', 'smug'], [...NAR, '*He sinks into the ice like it’s water and is gone.*', ''], [...PELLQ, 'Did you see the chains on him? Glowing. Straining. Something is holding him back… and he is loosening it.', 'frightened']],
      3:[[...DUMQ, 'You hit me. Several times. I’ll write it down somewhere I’ll never look.', 'smug'], [...NAR, '*He blends into the sky and simply isn’t there anymore.*', ''], [...BAUQ, 'His bar went to zero… and he walked away. That’s not how fights work.', 'sad']],
      4:[[...DUMQ, '*drops his tail. A new one grows back.* I could do this all day. I won’t. I’m bored.', 'smug'], [...NAR, '*He climbs the wall, across the ceiling, and out through a crack.*', ''], [...['Sam', 'kid:Sam'], 'There was a crack in that health bar. Bars aren’t supposed to have cracks.', 'frightened']],
      5:[[...DUMQ, 'You. Are. EXHAUSTING.', 'angry'], [...DUMQ, 'Come inside, then. Let’s end this properly.', 'angry'], [...NAR, '*The citadel gates grind open. Dumpling walks in without looking back.*', ''], [...MAUQ, 'Five times. Five times his bar ran out, and five times he just left. The next one is real.', 'sad']]}[n];
    setTimeout(() => S.talk(lines, () => { const s3 = stepNow(); if (s3 && s3.k == 'dump' && s3.n == n) advance(); }), 900); };
  // ---------- the ending ----------
  let modal = null;
  const finale = B => { SV.fights[6] = 1; shatter(false); hz = []; prints = []; S.foes = []; A2.sfx('win'); S.cheerT = 5; S.shakeV = 16; S.give({frost:200, flakes:20000, xp:1500, score:50000, gear:5}); X.stat && X.stat('sagaDump', 6, 'max');
    if (window.WLMusic && window.WLMusic.mood) try { window.WLMusic.mood('calm'); } catch (e) {}
    S.talk([[...DUMQ, '…No.', 'frightened'], [...DUMQ, 'No, no, no. Not like this. Not with these… CHAINS.', 'angry'], [...NAR, '*The seal’s nine chains flare gold. Dumpling shrinks back down, smaller than ever, and topples over.*', ''], [...BAUQ, 'It’s over. The seal held. The Snow Kingdom is safe.', 'peaceful'], [...MAUQ, 'WE DID IT! Royal Guard Mau Mau declares a FEAST! Eleven snacks for everyone!', 'happy'], [...LOKQ, 'I’m crying. I’m not crying. It’s the snow.', 'happy'], [...PELLQ, 'Hoo. The records will remember you, hero. All of you.', 'peaceful']], () => {
      modal = {kind:'credits', t:0}; if (SV.ch < NCH) { SV.ch = NCH; SV.step = 0; } SV.post = 1; S.save(); }); };
  const CREDITS = ['THE DUMPLING SAGA', '', 'Starring', 'You, the Hero', 'Royal Guard Mau Mau', 'Lord Emperor Bau Bau', 'Maya · Leo · Ava · Sam', 'Loki (reformed)', 'Archivist Pell', 'Old Pip', 'Tamsin the Herder', '', 'and', 'DUMPLING', 'the Little King', '', 'Made for the Wilderland Arcade', 'Thanks for playing!', '', '', '…', ''];
  const drawCredits = () => { const M2 = modal, VW = S.VW, VH = S.VH; M2.t += 1/60; g.fillStyle = '#060a1a'; g.fillRect(0, 0, VW, 720); const sp = 42, y0 = VH - M2.t*46;
    g.textAlign = 'center'; CREDITS.forEach((ln, i) => { const y = y0 + i*sp; if (y < -40 || y > VH + 40) return; g.fillStyle = i == 0 || ln == 'DUMPLING' ? '#D5F367' : '#fff'; g.font = (i == 0 ? '900 30px ' : ln == 'DUMPLING' ? '900 26px ' : '600 18px ') + A2.font; g.fillText(ln, VW/2, y); });
    const end = y0 + CREDITS.length*sp; if (end < VH*.45) { // the final shot: the seal on his back cracks… and his eyes open
      const k = Math.min(1, (VH*.45 - end)/220); g.fillStyle = 'rgba(6,10,26,' + (1 - k*.3) + ')'; g.fillRect(0, 0, VW, VH); drawGecko(VW/2, VH/2 + 20, {s:3.2, sleep:k < .85, smile:k >= .85, back:1, crackK:k, t:M2.t});
      g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '600 14px ' + A2.font; g.fillText(k < 1 ? '' : 'Tap or press any key', VW/2, VH - 30); if (k >= .85) { g.fillStyle = '#ff6ad5'; g.font = '900 20px ' + A2.font; g.fillText('…crack.', VW/2, VH/2 - 110); } } };
  // ---------- drawing ----------
  const rr = S.rr;
  // Dumpling, side view, lying flat like a real leopard gecko (faces right; flip:true faces left)
  SAGA.drawGecko = (x, y, o) => drawGecko(x, y, o);   // the raids borrow him for Dumpling's Shadow
  const drawGecko = (x, y, o = {}) => { const s = o.s || 1, t = S.t; g.save(); g.translate(x, y); g.scale(o.flip ? -s : s, s); if (o.alpha != null) g.globalAlpha = o.alpha;
    const body = o.col || '#efe2a2', dark = o.dark || '#1e1e24', belly = o.belly || '#fbf6e4', br = Math.sin(t*3)*.8, walk = o.walk ? Math.sin(t*12) : 0;
    const spot = (sx, sy, rx, ry, a) => { g.beginPath(); g.ellipse(sx, sy, rx, ry, a || 0, 0, TAU); g.fill(); };
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(-6, 12, 40, 6, 0, 0, TAU); g.fill();
    // thick banded tail, wiggling behind him
    if (!o.noTail) { for (let i = 0; i < 9; i++) { const u = i/8, tx = -20 - i*4.4, ty = 2 + Math.sin(t*3 + i*.7)*2.4*u - u*u*4; g.fillStyle = i % 2 ? dark : body; g.beginPath(); g.arc(tx, ty, 7.2 - i*.62, 0, TAU); g.fill(); } }
    // far legs (behind), then body
    const leg = (lx, front, near) => { const k = (front ? 1 : -1)*walk*2.5; g.fillStyle = near ? body : '#d8cc90'; g.beginPath(); g.ellipse(lx + k, 7, 3.4, 5, front ? .5 : -.5, 0, TAU); g.fill(); g.fillStyle = near ? '#f6eed0' : '#cfc490'; for (let q = -1; q <= 1; q++) { g.beginPath(); g.arc(lx + k + (front ? 3 : -3) + q*2.2, 11.5, 1.4, 0, TAU); g.fill(); } if (near) { g.fillStyle = dark; spot(lx + k, 5, 1.1, 1.1); } };
    leg(-11, false, false); leg(13, true, false);
    g.fillStyle = body; g.beginPath(); g.ellipse(0, br*.3, 21, 10.5, 0, 0, TAU); g.fill();
    g.fillStyle = belly; g.beginPath(); g.ellipse(1, 5 + br*.3, 17, 4.6, 0, 0, Math.PI); g.fill();
    g.fillStyle = dark; [[-14, -4, 2.2, 1.4], [-8, -7, 1.8, 1.2], [-2, -6, 2.4, 1.5], [5, -7, 2, 1.3], [11, -4, 2.2, 1.4], [-11, 1, 1.6, 1.1], [-4, 0, 2, 1.2], [3, 1, 1.8, 1.1], [9, 0, 1.7, 1.1], [15, 1, 1.4, 1], [-17, -1, 1.3, 1]].forEach(([a, b2, rx, ry], i) => spot(a, b2 + br*.3, rx, ry, i*.6));
    // the frost-stained cloak over his back, with the seal mark
    if (!o.noCloak) { g.fillStyle = '#26304e'; g.beginPath(); g.moveTo(-15, -6 + br*.3); g.quadraticCurveTo(0, -15 + br*.3, 15, -6 + br*.3); g.lineTo(13, 4); g.quadraticCurveTo(0, 7, -14, 4); g.closePath(); g.fill(); g.fillStyle = 'rgba(230,245,255,.85)'; for (let i = -12; i <= 12; i += 5) { g.beginPath(); g.arc(i, 4.5 + (i % 2 ? .6 : -.4), 1.5, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(249,191,1,.9)'; g.lineWidth = 1.4; g.beginPath(); g.arc(0, -4, 4.6, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(-1.5, -8); g.lineTo(.8, -4); g.lineTo(-.6, -.6); g.stroke();
      if (o.back) { const k = o.crackK || 0; g.strokeStyle = 'rgba(255,106,213,' + k + ')'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-4, -10); g.lineTo(-1, -5); g.lineTo(-5, -1); g.moveTo(2, -10); g.lineTo(4, -5); g.lineTo(8, -3); g.stroke(); } }
    // the seal: chains of light wrapped around his body
    if (!o.noSeal) { g.strokeStyle = 'rgba(255,236,160,' + (.65 + .25*Math.sin(t*3)) + ')'; g.lineWidth = 1.8; g.setLineDash([3, 2]); g.beginPath(); g.ellipse(-7, br*.3, 4.5, 11.5, .25, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(8, br*.3, 4.5, 11.5, -.25, 0, TAU); g.stroke(); g.setLineDash([]); }
    // near legs
    leg(-9, false, true); leg(15, true, true);
    // head and snout
    const hy = -3 + br*.5; g.fillStyle = body; g.beginPath(); g.ellipse(26, hy, 12.5, 8.6, -.08, 0, TAU); g.fill(); g.beginPath(); g.ellipse(18, hy + 1, 7, 7.5, 0, 0, TAU); g.fill();
    g.fillStyle = dark; [[20, hy - 5, 1.3], [29, hy - 6, 1.2], [33, hy - 3, 1], [24, hy + 4, 1.1], [17, hy - 2, 1]].forEach(([a, b2, r]) => spot(a, b2, r, r*.8));
    g.strokeStyle = '#4a3a2a'; g.lineWidth = 1.2; g.beginPath(); if (o.smile) { g.moveTo(25, hy + 3); g.quadraticCurveTo(31, hy + 6.5, 37, hy + 2); } else { g.moveTo(24, hy + 3.5); g.quadraticCurveTo(31, hy + 5, 38, hy + 2.6); } g.stroke();
    g.fillStyle = dark; spot(36.5, hy - 1.6, .8, .6);
    // big glossy eye
    g.fillStyle = '#121212'; g.beginPath(); g.arc(29, hy - 3.2, 4.6, 0, TAU); g.fill();
    if (o.galaxy) { g.fillStyle = '#5a2aa0'; g.beginPath(); g.arc(29, hy - 3.2, 3.6, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(28, hy - 5, 1, 1); g.fillRect(30, hy - 2, 1, 1); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(27.6, hy - 4.8, 1.6, 0, TAU); g.fill(); g.beginPath(); g.arc(30.4, hy - 1.8, .7, 0, TAU); g.fill();
    if (o.sleep) { g.fillStyle = body; g.beginPath(); g.arc(29, hy - 3.2, 4.9, 0, TAU); g.fill(); g.strokeStyle = dark; g.lineWidth = 1.2; g.beginPath(); g.arc(29, hy - 3.2, 3, .3, Math.PI - .3); g.stroke(); }
    else if (o.mood == 'smug' || (!o.mood && !o.smile)) { g.fillStyle = body; g.beginPath(); g.ellipse(29, hy - 6, 5.3, 3, 0, Math.PI, 0); g.fill(); }
    if (o.lick) { g.strokeStyle = '#ff7aa8'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(37, hy + 2.5); g.quadraticCurveTo(41, hy - 4, 31.5, hy - 5.5); g.stroke(); }
    // tiny dark crown
    if (!o.noCrown) { const cx = 24, cy = hy - 8; g.fillStyle = '#2a1a3a'; g.beginPath(); g.moveTo(cx - 5, cy); g.lineTo(cx - 5, cy - 5); g.lineTo(cx - 2.5, cy - 2.6); g.lineTo(cx, cy - 6.5); g.lineTo(cx + 2.5, cy - 2.6); g.lineTo(cx + 5, cy - 5); g.lineTo(cx + 5, cy); g.closePath(); g.fill(); g.fillStyle = '#9fe8ff'; g.beginPath(); g.arc(cx, cy - 2, 1.2, 0, TAU); g.fill(); }
    g.restore(); };
  const drawOwl = (x, y, s) => { s = s || 1; g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(0, 20, 16, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#f4f6fa'; g.beginPath(); g.ellipse(0, 0, 16, 21, 0, 0, TAU); g.fill(); g.fillStyle = '#c8d0dc'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-8 + (i % 3)*8, 6 + Math.floor(i/3)*7, 1.6, 0, TAU); g.fill(); }
    for (const sx of [-6, 6]) { g.fillStyle = '#F9BF01'; g.beginPath(); g.arc(sx, -6, 5, 0, TAU); g.fill(); g.fillStyle = '#121212'; g.beginPath(); g.arc(sx, -6, 2.4, 0, TAU); g.fill(); g.strokeStyle = '#6b4a2b'; g.lineWidth = 1.3; g.beginPath(); g.arc(sx, -6, 6.5, 0, TAU); g.stroke(); }
    g.fillStyle = '#ff9a3c'; g.beginPath(); g.moveTo(-2, -1); g.lineTo(2, -1); g.lineTo(0, 3); g.fill(); g.fillStyle = '#e8ecf4'; g.beginPath(); g.moveTo(-12, -16); g.lineTo(-8, -24); g.lineTo(-4, -17); g.fill(); g.beginPath(); g.moveTo(12, -16); g.lineTo(8, -24); g.lineTo(4, -17); g.fill(); g.restore(); };
  const drawWho = (who, x, y, mood) => { const pic = who[1], t = S.t; if (pic == 'owl') drawOwl(x, y - 6); else if (pic == 'loki') SC.loki(g, x, y, {s:.85, mood:mood || 'happy'}, t); else if (pic == 'mau') SC.mau(g, x, y, {st:'stand'}, t); else if (pic == 'bau') SC.spirit(g, 'bau', x, y, {mood:mood || 'peaceful'}, t); else if (pic == 'pip') S.penguin(x, y); else if (pic == 'dump') drawGecko(x, y, {mood:'smug'}); else if (pic.slice(0, 4) == 'kid:') S.kid(x, y, {Maya:'#2fa8e0', Leo:'#64CDF5', Ava:'#ff9ad5', Sam:'#2fa8e0', Tamsin:'#8D5B1D'}[pic.slice(4)] || '#8D5B1D', {face:Math.PI/2}); };
  const portrait = (who, x, y, mood) => { if (who == 'none') return true; if (SAGA.postPortrait && SAGA.postPortrait(who, x, y, mood)) return true; if (who == 'dump') { drawGecko(x - 8, y + 4, {s:.72, mood, lick:mood == 'smug' && Math.sin(S.t*2) > .7, smile:mood == 'happy'}); return true; } if (who == 'owl') { drawOwl(x, y + 4, 1); return true; } if (who == 'kid:Tamsin') { S.kid(x, y + 12, '#8D5B1D', {face:0}); return true; } return false; };
  const drawWorld = (cur, C, W2T) => { const s2 = stepNow(), t = S.t, lo = S.low();
    // people standing where their scene happens
    if (s2 && s2.k == 'talk') { const w = where(s2, cur, C, W2T); if (w && w.pos && !w.camp && cur == w.r) { drawWho(s2.who, w.pos.x, w.pos.y, 'happy'); g.fillStyle = '#F9BF01'; g.font = '900 22px ' + A2.font; g.textAlign = 'center'; g.fillText('!', w.pos.x, w.pos.y - 44 + Math.sin(t*5)*3); } }
    if (s2 && s2.k == 'items' && cur == s2.r) s2.list.forEach((it, j) => { if (SV.flags['it:' + SV.ch + ':' + j]) return; const q = atPos(it.at, C, W2T); if (!S.onScreen(q.x, q.y)) return; if (!lo) { g.fillStyle = 'rgba(249,191,1,' + (.25 + .2*Math.sin(t*4 + j)) + ')'; g.beginPath(); g.arc(q.x, q.y - 6, 22, 0, TAU); g.fill(); } g.font = '24px ' + A2.font; g.textAlign = 'center'; g.fillText(it.e, q.x, q.y + 2 + Math.sin(t*3 + j)*3); });
    if (s2 && (s2.k == 'boss' || s2.k == 'dump') && cur == s2.r && !S.boss) { const q = W2T(C.lair); g.strokeStyle = 'rgba(255,69,57,' + (.3 + .2*Math.sin(t*3)) + ')'; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.arc(q.x, q.y, 190, 0, TAU); g.stroke(); g.setLineDash([]); if (s2.k == 'dump') drawGecko(q.x, q.y - 30, {mood:'smug', lick:Math.sin(t*1.5) > .8, alpha:.95}); }
    if (cur == 'citadel' && C) { const a = arenaW(); if (S.onScreen((a.x0 + a.x1)/2, (a.y0 + a.y1)/2, 900)) { g.fillStyle = 'rgba(42,26,58,.85)'; rr(g, (a.x0 + a.x1)/2 - 34, a.y0 + 40, 68, 56, 10); g.fill(); g.fillStyle = '#9fe8ff'; g.beginPath(); g.arc((a.x0 + a.x1)/2, a.y0 + 52, 6, 0, TAU); g.fill(); } }
    // footprints (camouflage), falling ice, the leaving trick
    for (const f of prints) { g.fillStyle = 'rgba(80,110,70,' + Math.min(.6, f.t*.3) + ')'; g.beginPath(); g.ellipse(f.x - 4, f.y, 3, 2, 0, 0, TAU); g.ellipse(f.x + 4, f.y + 3, 3, 2, 0, 0, TAU); g.fill(); }
    for (const h of hz) { const k = 1 - Math.max(0, h.t)/h.t0; if (h.t > 0) { g.strokeStyle = h.col; g.lineWidth = 2.5; g.setLineDash([6, 5]); g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(159,232,255,' + (.12 + .25*k) + ')'; g.beginPath(); g.arc(h.x, h.y, h.r*k, 0, TAU); g.fill(); } else { g.fillStyle = '#e8f8ff'; g.beginPath(); g.moveTo(h.x - 8, h.y); g.lineTo(h.x, h.y - 40); g.lineTo(h.x + 8, h.y); g.fill(); } }
    if (SAGA.post && SAGA.post.drawWorld) SAGA.post.drawWorld(cur, C, W2T);
    if (leaving) { const k = leaving.t/3.2; drawGecko(leaving.x, leaving.y - (1 - k)*120, {alpha:k, mood:'smug', lick:leaving.t > 2}); } };
  const drawCamp = () => { const s2 = stepNow(); if (started() && s2 && s2.k == 'talk' && s2.at && s2.at.camp == 'loki' && S.onScreen(LOKI_AT.x, LOKI_AT.y)) { SC.loki(g, LOKI_AT.x, LOKI_AT.y, {s:.85, mood:'happy'}, S.t); g.fillStyle = '#F9BF01'; g.font = '900 22px ' + A2.font; g.textAlign = 'center'; g.fillText('!', LOKI_AT.x, LOKI_AT.y - 50 + Math.sin(S.t*5)*3); }
    if (started() && s2 && s2.k == 'talk' && s2.at && s2.at.camp == 'pip' && S.onScreen(S.PIP.x, S.PIP.y)) { g.fillStyle = '#F9BF01'; g.font = '900 22px ' + A2.font; g.textAlign = 'center'; g.fillText('!', S.PIP.x, S.PIP.y - 34 + Math.sin(S.t*5)*3); } if (SAGA.postDrawCamp) SAGA.postDrawCamp(api); };
  const drawBoss = B => { if (PST(B.k)) { SAGA.post.drawBoss(B); return; } const x = B.x, y = B.y, t = S.t; if (B.k.slice(0, 4) == 'dump') { const sc = (B.k == 'dump6' ? 1.5 : 1.25)*(1 + 1.6*(B.giant || 0)), camo = B.camo > 0 ? (B.k == 'dump6' ? .06 : .12) : 1;
      if (B.giant) { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y + 40*sc/1.5, 50*sc/1.5, 12*sc/1.5, 0, 0, TAU); g.fill(); }
      drawGecko(x, y, {s:sc, flip:p.x < x, walk:Math.hypot((B.tx || x) - x, (B.ty || y) - y) > 8, alpha:(B.flash > 0 ? .6 : 1)*camo, mood:B.ph >= 3 || B.fight == 6 ? 'angry' : 'smug', lick:B.lick > 0, noTail:B.tail > 0});
      if (B.giant > .5) wsp.forEach(w => { const wx = x + Math.cos(w.a)*30*sc, wy = y + Math.sin(w.a)*22*sc; g.fillStyle = 'rgba(249,191,1,' + (.6 + .35*Math.sin(t*8)) + ')'; g.beginPath(); g.arc(wx, wy, 13, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); });
      if (teamFx > 0) { g.strokeStyle = 'rgba(213,243,103,' + Math.min(1, teamFx) + ')'; g.lineWidth = 6; for (let i = 0; i < 7; i++) { const a = i/7*TAU + t*2; g.beginPath(); g.moveTo(x + Math.cos(a)*240, y + Math.sin(a)*240); g.lineTo(x, y); g.stroke(); } }
      if (B.talk && B.talkT > 0) S.bubble(x, y - 50*sc, B.talk.replace(/^Dumpling: /, ''));
      return; }
    const R0 = RB[BOSS[B.k].region] || {e:'❄', col:'#fff'}; g.save(); if (B.flash > 0) g.globalAlpha = .6; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y + 36, 40, 10, 0, 0, TAU); g.fill();
    g.fillStyle = R0.col; g.globalAlpha *= .35; g.beginPath(); g.arc(x, y, 46 + Math.sin(t*3)*3, 0, TAU); g.fill(); g.globalAlpha = B.flash > 0 ? .6 : 1; g.font = '72px ' + A2.font; g.textAlign = 'center'; g.fillText(R0.e, x, y + 26 + Math.sin(t*2.4)*3);
    if (B.ph >= 3) { g.fillStyle = '#FF4539'; g.font = '900 16px ' + A2.font; g.fillText('!!', x + 34, y - 30); } g.restore(); if (B.talk && B.talkT > 0) S.bubble(x, y - 62, B.talk); };
  const drawFoe = f => { const F = S.FOE[f.k]; drawGecko(f.x, f.y, {flip:p.x < f.x, walk:1, s:f.k == 'geckspit' ? .62 : .52, col:f.k == 'geckspit' ? '#f4c27a' : '#e8dcb0', noCrown:1, noCloak:1, noSeal:1, alpha:f.flash > 0 ? .6 : 1, mood:'angry'}); };
  // ---------- boss bars ----------
  const drawBar = (B, TY) => { if (PST(B.k)) { SAGA.post.drawBar(B, TY); return; } const VW = S.VW;
    if (B.k != 'dump6') { // the FAKE bar: it looks like his whole life. It isn't.
      const bw = Math.min(520, VW - 260), bx = VW/2 - bw/2, by = TY + 70, k = Math.max(0, B.hp)/B.max; g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, bx, by, bw, 16, 8); g.fill(); g.fillStyle = '#7fd860'; rr(g, bx, by, bw*k, 16, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(bx + 4, by + 3, bw*k - 8, 3);
      const n = B.fight || 1; if (n >= 2) { g.strokeStyle = 'rgba(30,20,40,.8)'; g.lineWidth = 2; for (let i = 0; i < n - 1; i++) { const cx = bx + bw*(.2 + .15*i); g.beginPath(); g.moveTo(cx, by); g.lineTo(cx + 5, by + 7); g.lineTo(cx - 3, by + 16); g.stroke(); } }
      g.font = '800 12px ' + A2.font; g.textAlign = 'center'; const bl = 'DUMPLING · THE LITTLE KING · fight ' + n + ' of ?', tw = g.measureText(bl).width + 16; g.fillStyle = 'rgba(255,255,255,.88)'; rr(g, VW/2 - tw/2, by + 19, tw, 18, 9); g.fill(); g.fillStyle = '#14204a'; g.fillText(bl, VW/2, by + 32); return; }
    // THE 6TH FIGHT: the bar spans the whole screen and zigzags across 3 rows (→, ←, →), draining along that path
    const m = 14, rowH = 14, gap = 8, top = TY + 128, L = VW - m*2, k = Math.max(0, B.hp)/B.max; f6.fill = Math.min(1, f6.fill + 1/60/2.6); const shown = Math.min(k, f6.fill), total = 3*L, left = shown*total;
    g.fillStyle = 'rgba(0,0,0,.45)'; for (let r = 0; r < 3; r++) { rr(g, m, top + r*(rowH + gap), L, rowH, 7); g.fill(); }
    // connecting bends
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = rowH; g.lineCap = 'butt'; g.beginPath(); g.arc(VW - m, top + rowH + gap/2, (rowH + gap)/2, -Math.PI/2, Math.PI/2); g.stroke(); g.beginPath(); g.arc(m, top + 2*rowH + gap*1.5, (rowH + gap)/2, Math.PI/2, Math.PI*1.5); g.stroke();
    const col = r => ['#7fd860', '#F9BF01', '#FF4539'][r];
    for (let r = 0; r < 3; r++) { const seg = Math.max(0, Math.min(L, left - r*L)); if (seg <= 0) continue; const y = top + r*(rowH + gap); g.fillStyle = col(r); if (r % 2 == 0) rr(g, m, y, seg, rowH, 7); else rr(g, m + L - seg, y, seg, rowH, 7); g.fill(); }
    g.fillStyle = '#fff'; for (let i = 1; i < 10; i++) { const u = i/10*total, r = Math.floor(u/L), off = u - r*L, x = r % 2 == 0 ? m + off : m + L - off, y = top + r*(rowH + gap); g.fillRect(x - 1, y - 2, 3, rowH + 4); }
    const cp = SV.fights.cp6 || 1; g.font = '800 12px ' + A2.font; g.textAlign = 'center'; const bl = 'DUMPLING · NO MORE GAMES · phase ' + B.ph + '/10: ' + PH6[B.ph] + ' · checkpoint ' + cp, tw = g.measureText(bl).width + 16; const by2 = top + 3*(rowH + gap) + 2; g.fillStyle = 'rgba(255,255,255,.9)'; rr(g, VW/2 - tw/2, by2, tw, 18, 9); g.fill(); g.fillStyle = '#14204a'; g.fillText(bl, VW/2, by2 + 13);
    if (B.ph == 10) { const tw2 = 260, tx = VW/2 - tw2/2, ty = by2 + 24; g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, tx, ty, tw2, 14, 7); g.fill(); g.fillStyle = teamReady ? (Math.sin(S.t*10) > 0 ? '#D5F367' : '#fff') : '#64CDF5'; rr(g, tx, ty, tw2*team, 14, 7); g.fill(); g.fillStyle = '#fff'; g.font = '800 11px ' + A2.font; g.fillText(teamReady ? '💥 TEAM ATTACK READY: press E' : 'Team attack: keep hitting him!', VW/2, ty + 28); } };
  const drawScreen = (cur) => { if (SAGA.post && SAGA.post.drawScreen) SAGA.post.drawScreen(cur); if (crack > 0) { const VW = S.VW, a = Math.min(1, crack); g.globalAlpha = a; const bw = Math.min(520, VW - 260), bx = VW/2 - bw/2, by = (document.fullscreenElement ? 46 : 8) + 70; g.fillStyle = 'rgba(0,0,0,.6)'; rr(g, bx, by, bw, 16, 8); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx + bw*.3, by - 4); g.lineTo(bx + bw*.34, by + 8); g.lineTo(bx + bw*.29, by + 20); g.stroke(); for (let i = 0; i < 6; i++) { g.fillStyle = ['#2a1a5a', '#5a2aa0', '#a04ae0', '#ff6ad5', '#F9BF01', '#ffffff'][i]; g.fillRect(bx + bw*.3 + i*3 - 9, by + 2, 3, 12); }
      g.fillStyle = '#fff'; g.font = '800 13px ' + A2.font; g.textAlign = 'center'; g.fillText('…the bar cracks. There is MORE underneath. He wasn’t even trying.', VW/2, by + 38); g.globalAlpha = 1; } };
  const drawTop = () => { if (modal && modal.kind == 'credits') drawCredits(); if (SAGA.postDrawTop) SAGA.postDrawTop(api); };
  // ---------- per-frame ----------
  const update = (dt, cur, C, W2T) => { if (!started()) return; autoCheck(cur); crack = Math.max(0, crack - dt); teamFx = Math.max(0, teamFx - dt);
    if (leaving) { leaving.t -= dt; if (leaving.t <= 0) leaving = null; }
    for (const h of hz) { h.t -= dt; if (h.t <= 0 && !h.hit) { h.hit = 1; if (Math.hypot(h.x - p.x, h.y - p.y) < h.r) S.hurtMe(h.dmg); S.splat(h.x, h.y, 8, '#e8f8ff'); } } hz = hz.filter(h => h.t > -.4);
    for (const f of prints) f.t -= dt; prints = prints.filter(f => f.t > 0);
    const B = S.boss; if (B && BOSS[B.k] && BOSS[B.k].fight) B.fight = BOSS[B.k].fight; if (B && B.k == 'dump6') { B.saga = 1; if (B.ph == 8 && (B.giant || 0) > .5) { const sc = 1.5*(1 + 1.6*B.giant); for (const b of S.balls) { if (!b.mine || b.life <= 0) continue; for (const w of wsp) { const wx = B.x + Math.cos(w.a)*30*sc, wy = B.y + Math.sin(w.a)*22*sc; if (Math.hypot(b.x - wx, b.y - wy) < 18 + b.r) { b.life = 0; B.allowHit = 1; S.hurtBoss(b.dmg*3.2); B.allowHit = 0; S.splat(wx, wy, 10, '#F9BF01'); break; } } } } }
    else if (B && B.k && B.k.slice(0, 4) == 'dump') B.saga = 1; else if (B && BOSS[B.k] && BOSS[B.k].saga) B.saga = 1;
    if (!B || B.k.slice(0, 4) != 'dump') { if (f6.plat && !(B && B.k == 'dump6')) shatter(false); } if (SAGA.postUpdate) SAGA.postUpdate(dt, cur, C, W2T, api); };
  // dying in the 6th fight: back to the last checkpoint
  const respawn = () => { if (SAGA.post && SAGA.post.respawn && SAGA.post.respawn()) return true; const B = S.boss; if (B && B.k == 'dump6') { const cp = B.ph || 1; W.bhp = W.bhp || {}; W.bhp.dump6 = Math.max(1, B.max*(1 - (cp - 1)/(B.phases || 10))*(cp > 1 ? .999 : 1));   /* knocked out: he refills to the top of his current phase; beaten phases stay beaten */ f6.fill = 0; shatter(false); S.boss = null; hz = []; prints = []; S.foes = []; S.balls = [];
      const q = SG.W2T({x:48, y:29}); p.x = q.x; p.y = q.y; p.vx = p.vy = 0; p.hp = p.max; p.inv = 3; p.ammo = X.maxAmmo(); S.mateHome(); S.say('💀 Knocked out! Dumpling is back at the top of phase ' + cp + '. Beaten phases stay beaten', 4); return true; }
    if (B && B.k.slice(0, 4) == 'dump') { hz = []; prints = []; } return false; };
  // ---------- input ----------
  const key = e => { const k = e.key; if (modal && modal.kind == 'credits') { const ended = modal.t > (CREDITS.length*42 + S.VH)/46 + 4; if (ended || k == 'Escape') { modal = null; S.say('🦎 …somewhere, a seal cracks. (The Dumpling Saga continues after the credits.)', 5); if (SAGA.afterCredits) SAGA.afterCredits(api); } else modal.t += 2; return true; }
    if ((k == 'e' || k == 'E') && teamReady && S.boss && S.boss.k == 'dump6') return teamAttack();
    if ((k == 'j' || k == 'J') && started() && !e.repeat) { journal(); return true; } return SAGA.postKey ? SAGA.postKey(e, api) : false; };
  const down = q => { if (modal && modal.kind == 'credits') { const ended = modal.t > (CREDITS.length*42 + S.VH)/46 + 4; if (ended) { modal = null; if (SAGA.afterCredits) SAGA.afterCredits(api); } else modal.t += 4; return true; } if (teamReady && S.boss && S.boss.k == 'dump6') { if (q.y > S.BAR - 90) return teamAttack(); } return SAGA.postDown ? SAGA.postDown(q, api) : false; };
  // ---------- the saga journal (J) ----------
  const fmtT = s => { const h = Math.floor(s/3600), m = Math.floor(s/60) % 60; return (h ? h + ' h ' : '') + m + ' min'; };
  const journal = () => S.openPanelUI(() => ({title:'🦎 The Dumpling Saga · journal', sub:'Played ' + fmtT(SV.time || 0) + ' (about 10 hours for the main story) · ' + Object.keys(SV.shr).length + '/66 Ice Shrines · ' + Object.keys(SV.fe).length + '/230 Frost Feathers · ' + SV.emb + ' Frost Emblems · stamina ' + SV.stam + ' · Snow Cloak: ' + (SV.cloak ? 'yes' : 'not yet'),
    rows:[{e:'📖', n:'Kingdom journal', d:'Earlier chapters, side quests, outfits and songs', btn:'Open', ok:true, fn:() => S.journal()}, ...CH.map((c, i) => ({e:i < SV.ch ? '✅' : i == SV.ch ? '▶️' : '⬜', n:'Chapter ' + (i + 1) + ': ' + c.n, d:i < SV.ch ? 'Done' : i == SV.ch ? (stepNow() ? 'Now: ' + stepNow().g + ' (step ' + (SV.step + 1) + '/' + c.steps.length + ')' : '') : SG.REGIONS[SG.RIDX[c.r]].n})),
      {e:'⚔️', n:'Dumpling fights: ' + [1, 2, 3, 4, 5, 6].filter(n => SV.fights[n]).length + ' / 6', d:'Fights 1–5: his bar runs out and he leaves. Fight 6 is real.'}, ...(SAGA.postRows ? SAGA.postRows(api) : [])]}));
  // ---------- admin tools ----------
  const adm = {chapter:n => { n = Math.max(1, Math.min(NCH, Math.floor(n))); W.sp = Math.max(W.sp|0, 6); W.bau = 1; SV.ch = n - 1; SV.step = 0; SV.cloak = 1; S.save(); S.say('Admin: Dumpling Saga chapter ' + n + ': ' + CH[n - 1].n, 3); },
    fight:n => { n = Math.max(1, Math.min(6, Math.floor(n))); W.sp = Math.max(W.sp|0, 6); W.bau = 1; SV.cloak = 1; const ci = n == 6 ? 8 : CH.findIndex(c => c.steps.some(s2 => s2.k == 'dump' && s2.n == n)); SV.ch = ci; SV.step = CH[ci].steps.findIndex(s2 => n == 6 ? s2.k == 'final' : s2.k == 'dump' && s2.n == n); const s2 = stepNow(); if (s2) s2.saidPre = 1; SG.enter(CH[ci].r, 0, true); const C = SG.C(), q = n == 6 ? SG.W2T({x:48, y:24}) : SG.W2T(C.lair); p.x = q.x; p.y = q.y + 200; S.save(); S.say('Admin: Dumpling fight ' + n, 2.4); },
    phase:() => { const B = S.boss; if (!B) { S.say('Admin: no boss right now', 2); return; } const np = B.phases || 3, next = Math.min(np, B.ph + 1); B.allowHit = 1; const target = B.max*(1 - (next - 1)/np) - 1; if (B.ph >= np) S.hurtBoss(B.hp + 1); else S.hurtBoss(Math.max(1, B.hp - target)); B.allowHit = 0; },
    stamina:n => { SV.stam += Math.round(n); SG.setStam(SV.stam); S.save(); S.say('Admin: stamina ' + SV.stam, 2); },
    region:id => { if (!SG.REGIONS[SG.RIDX[id]]) { S.say('Admin: unknown region', 2); return; } W.sp = Math.max(W.sp|0, 6); SV.cloak = 1; SG.enter(id, 0); },
    regions:() => SG.REGIONS.map(R => R.id)};
  const api = {S, SG, SV, CH, stepNow, advance, drawGecko, drawOwl, drawWho, hazard, say2, setModal:m => { modal = m; }, modal:() => modal, journal, adm, BOARD, set postGoal(f) { postGoal = f; }};
  if (SAGA.postInit) try { SAGA.postInit(api); } catch (e) { console.error('[saga post]', e); }
  return {unlocked, lockText, goal, things, bossReady, bossAI:dumpAI, bossDown, hurtBoss, drawBoss, drawBar, drawFoe, portrait, drawWorld, drawCamp, drawScreen, drawTop, update, respawn, key, down, modal:() => !!modal || !!(SAGA.postModal && SAGA.postModal()), entered:id => {}, mapIcons:(icon, cur, C) => { if (SAGA.post && SAGA.post.mapIcons) SAGA.post.mapIcons(icon, cur, C); const s2 = stepNow(); if (s2 && (s2.k == 'boss' || s2.k == 'dump') && cur == s2.r) icon(C.lair, s2.k == 'dump' ? '🦎' : '💀'); },
    journal, adm, api}; };
})();
