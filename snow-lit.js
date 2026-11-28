// THE BURNING WINTER · part 4: the Lit story, chapters 1–5 (A.snowLit).
// Wraps the saga hooks object like snow-raids does: A.snowLit(S, SG0) -> SG with Lit's story layered on top.
// Unlocks only after the whole Dumpling saga (Gecko God down + Oswald home). Before that: one distant smoke column, nothing else.
(function () {
const A = window.Arcade = window.Arcade || {};
A.snowLit = (S, SG0) => {
  const {W, BOSS, LAIR, TS, p, T} = S, TAU = Math.PI*2, NAR = ['', 'snow'], LITQ = ['Lit', 'lit'], UNK = ['???', 'lit'];
  const STUB = {cur:() => null, modal:() => false, update:() => {}, things:() => {}, goal:() => null, drawWorld:() => {}, drawScreen:() => {}, bossReady:() => false, bossAI:() => {}, bossDown:() => {}, drawBoss:() => {}, portrait:() => false};
  const B0 = SG0 || STUB, MAUF = S.MAUF, BAUF = S.BAUF, PIPF = S.PIPF;
  // ---------- save ----------
  const L = W.lit = Object.assign({v:1, on:0, ch:1, st:0, heat:0, sc:{}, rs:{}, rd:{}, cl:{}, sight:0, sT:0, seen:0}, W.lit || {});
  const SV = () => (W.saga && W.saga.flags) || {};
  const canUnlock = () => !!(SV().godDown && SV().oswaldHome);
  // ---------- places (tiles; snapped to the nearest open tile) ----------
  const open = (tx, ty) => { for (let r = 0; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) != r) continue; const x = tx + dx, y = ty + dy, v = S.tileAt(x, y);
      if (v != T.WATER && v != T.DEEP && v != T.HOLE && !S.solidAt((x + .5)*TS, (y + .5)*TS)) return {x:(x + .5)*TS, y:(y + .5)*TS}; } return {x:(tx + .5)*TS, y:(ty + .5)*TS}; };
  const SP0 = {bath:[190, 155], square:[175, 174], lit1:[186, 184], tower:[166, 18], shaft:[101, 252], light:[84, 160], pine:[42, 178], lit2:[28, 190], raven:[214, 112], lit3:[200, 122]};
  const SP = {camp:{x:S.FIRE.x, y:S.FIRE.y + 30}}; for (const k in SP0) SP[k] = open(SP0[k][0], SP0[k][1]);
  const TEASE = open(196, 198);
  const RN = {ember:'Ember Springs', pinecrest:'Pinecrest', ravenwatch:'Ravenwatch'}, POOL = {ember:['k_imp', 'k_hound', 'k_bat'], pinecrest:['k_moth', 'k_wisp', 'k_imp'], ravenwatch:['k_wraith', 'k_bat', 'k_cult']};
  const rk = (x, y) => { const r = S.regAt(x, y); return r == 'emberford' ? 'ember' : r == 'pinev' ? 'pinecrest' : r; };
  const HAZ = ['Innkeeper Hazel', 'kid:Ava'], JUN = ['Woodcutter Juniper', 'kid:Sam'], BRAM = ['Watchman Bram', 'kid:Leo'];
  // ---------- the story ----------
  const CH = [null,
    {n:'Smoke Over Ember Springs', s:[
      {k:'talk', at:'camp', n:'Join the Gecko God Slayer party at Camp Cocoa', tool:'pump', L:[
        [...PIPF, 'There they are! The Gecko God Slayer! Everybody, cocoa up!', 'happy'],
        [...BAUF, 'Purr. A whole kingdom saved from a god made of stars. I may have a statue made. Of me. Next to yours.', 'happy'],
        [...MAUF, '*mouth full of cake* Mmf. SHIELD BELLY is off duty tonight. Bring more cake.', 'happy'],
        [...PIPF, 'Oswald is home, Nell won’t stop smiling and the sky is back where it belongs. Best winter ever.', 'happy'],
        [...NAR, 'Far to the south-east, past the old lands, a thick black column of smoke rises over Ember Springs.', ''],
        [...BAUF, '…Smoke? In the Snow Kingdom? Nothing burns here. Nothing is ALLOWED to burn here.', 'worried'],
        [...MAUF, 'That’s the old bathhouse at Ember Springs. Royal Guard, move out! …After this bite.', 'angry'],
        [...BAUF, 'Take the Royal Snow Pump. It was for watering the ice garden, but it will do. Hold R to spray.', ''],
        [...NAR, '🧯 New tool: the SNOW PUMP. Hold R to spray water at the nearest fire (on touch: the 🧯 button).', '']]},
      {k:'go', at:'bath', n:'Smoke over Ember Springs! Run to the Old Bathhouse', L:[
        [...NAR, 'The Old Bathhouse is on fire. The flames are wrong: they burn on ice, and the snow around them hisses into steam.', ''],
        [...MAUF, 'Fire on ICE?! That’s not how fire works! Spray it! Spray it!', 'angry']]},
      {k:'fires', at:'bath', c:9, n:'Put out the bathhouse fire (hold R)'},
      {k:'talk', at:'bath', n:'Talk to Mau Mau at the bathhouse', L:[
        [...MAUF, '*cough* All out. I sat on two of them. Don’t tell anyone.', 'happy'],
        [...NAR, 'In the ash, someone has drawn a little sun with a sooty finger. Next to it are footprints, and they are still warm.', ''],
        [...MAUF, 'They go toward Emberford. Fires don’t walk. Somebody did this.', 'worried'],
        [...BAUF, 'Then we find them. Tonight was supposed to be a party, hero. Someone will answer for ruining it.', 'angry']]}]},
    {n:'Emberford Burns', s:[
      {k:'go', at:'square', n:'Follow the warm footprints to Emberford', tool:'lantern', L:[
        [...HAZ, 'Help! The square is burning and there are little burning creatures everywhere! They came out of the smoke!', 'worried'],
        [...MAUF, 'Little burning creatures. Great. I already hate this winter.', 'angry'],
        [...HAZ, 'Take my grandmother’s Cold Lantern! It keeps the cold close. Please, just save the square!', ''],
        [...NAR, '🏮 New tool: the COLD LANTERN. Press L to light it: your snowballs won’t melt near fire. It recharges on snow.', '']]},
      {k:'kill', at:'square', n:'Drive the Kindled out of Emberford', foes:['k_imp', 'k_imp', 'k_imp', 'k_imp', 'k_hound', 'k_imp', 'k_bat', 'k_bat']},
      {k:'fires', at:'square', c:10, n:'Put out the fires in Emberford square'},
      {k:'go', at:'lit1', n:'Someone made of fire is watching from the hill east of Emberford', L:[
        [...NAR, 'A tall hooded figure stands in the smoke. Where its face should be there is only darkness, and fire curls out of the hood like hair.', ''],
        [...UNK, 'Oh! You put them out. All my lovely little lights.', 'sad'],
        [...UNK, 'Doesn’t the dark bother you? Doesn’t the cold? I’m only making things bright. You can call me Lit.', ''],
        [...MAUF, 'You set a whole village on fire!', 'angry'],
        [...LITQ, 'A burning village is easy to see from very far away. That’s the point.', '']]},
      {k:'boss', key:'lit1', at:'lit1', sc:'ember', n:'Stop Lit!', after:[
        [...LITQ, 'You’re so cold! I like you anyway. We’ll play again.', 'happy'],
        [...NAR, 'Lit bursts into a swirl of sparks and is gone. The ash where it stood is still warm.', ''],
        [...BAUF, 'Lit. A name for my list. Ember Springs is SCORCHED now: put out its fires and beat the Kindled there and the land will heal.', '']]}]},
    {n:'Who Is Lit?', s:[
      {k:'talk', at:'camp', n:'Report to Bau Bau at Camp Cocoa', tool:'frost', L:[
        [...BAUF, 'A creature of fire called Lit. In all my nine lives I have never heard that name.', 'worried'],
        [...PIPF, 'Odd things have been noticed for weeks. A warm spot that moves. The bathhouse water getting warmer every night.', ''],
        [...PIPF, 'Ask at Northwatch Tower, look in Shaft Nine in the quarry, and visit the Mirrormere Lighthouse. Something is going on.', ''],
        [...BAUF, 'And take the royal recipe for Frostforged snowballs. Forged in the deepest cold: they barely melt.', ''],
        [...NAR, '❄ FROSTFORGED snowballs unlocked (Loadout → Forge). They melt 4× slower near fire.', '']]},
      {k:'clues', at:['tower', 'shaft', 'light'], n:'Find out who Lit is: Northwatch Tower, Shaft Nine and the Mirrormere Lighthouse', L:{
        tower:[[...BRAM, 'Forty years I’ve watched this kingdom. Every night the lighthouse on Mirrormere shone. A few nights ago it went dark.', ''],
          [...BRAM, 'Then a light started walking. Away from the lake, over the hills, east. Lights don’t walk, hero.', 'worried']],
        shaft:[[...NAR, 'Deep in Shaft Nine the walls are black glass, warm as a cup of cocoa. Tiny embers sleep in the cracks like seeds.', ''],
          [...MAUF, 'Is THIS where the burning creatures come from? Somebody is planting them.', 'angry']],
        light:[[...NAR, 'The lamp room at the top of the lighthouse is empty. The great lamp is cold. Scorch marks run from it, across the floor and out of the window.', ''],
          [...NAR, 'On the wall, the keeper’s last log: “The boat is late again. I will keep the light on.”', ''],
          [...MAUF, 'The note downstairs said the lamp was lit. So where did the light go?', 'worried']]}},
      {k:'talk', at:'camp', n:'Tell Bau Bau what you found', sight:1, L:[
        [...BAUF, 'A light that walked away from the lake. Warm black glass under the quarry. A lighthouse with no flame in it.', 'worried'],
        [...PIPF, 'Smoke columns keep popping up all over the new lands. If you see one, run to it! You might catch Lit there.', ''],
        [...NAR, '🔥 LIT SIGHTINGS: while you play, smoke columns will appear. Reach one before it fades for a clue and Frost Crystals.', '']]}]},
    {n:'The Forest Burns', s:[
      {k:'go', at:'pine', n:'Pinecrest Forest is burning! Hurry', tool:'bomb', L:[
        [...NAR, 'Pinecrest is on fire from end to end. The snow-heavy pines go up like torches.', ''],
        [...JUN, 'The whole forest! Here, the village made these for emergencies. Blizzard Bombs! Throw one and the air itself freezes.', 'worried'],
        [...NAR, '💣 New tool: the BLIZZARD BOMB. Press Z for a freezing cloud: it puts out fires and frosts your snowballs (+50% damage).', '']]},
      {k:'fires', at:'pine', c:12, n:'Save Pinecrest: put out the forest fires'},
      {k:'kill', at:'pine', n:'Clear the Kindled out of the forest', foes:['k_moth', 'k_moth', 'k_wisp', 'k_wisp', 'k_imp', 'k_imp', 'k_hound']},
      {k:'go', at:'lit2', n:'Lit is waiting deeper in the forest', L:[
        [...LITQ, 'You came! Doesn’t the forest look nicer bright? All that dark under the trees, gone.', 'happy'],
        [...MAUF, 'Those were the oldest trees in the kingdom!', 'angry'],
        [...LITQ, 'Old things sit in the dark the longest. Somebody has to keep the light on.', 'sad'],
        [...LITQ, 'Let me show you a wall that never gets cold.', '']]},
      {k:'boss', key:'lit2', at:'lit2', sc:'pinecrest', n:'Fight Lit in Pinecrest', after:[
        [...LITQ, 'Ow. Ow! You’re colder than you look. Fine. I have more forests.', 'sad'],
        [...NAR, 'Lit folds into its own smoke and is gone. Pinecrest is SCORCHED: heal it the same way as Ember Springs.', '']]}]},
    {n:'Embers in the Dark', s:[
      {k:'talk', at:'camp', n:'Bau Bau has news', L:[
        [...BAUF, 'Ravenwatch has gone dark. Not night-dark: smoke-dark. Every raven in the woods flew here and they won’t stop shouting.', 'worried'],
        [...PIPF, 'Ash Wraiths, the ravens say. Things made out of smoke.', 'worried'],
        [...BAUF, 'Go. And be careful, hero. Lit gets stronger every time a fire spreads.', '']]},
      {k:'go', at:'raven', n:'Go to smoke-dark Ravenwatch', L:[
        [...NAR, 'Ravenwatch is buried in smoke. Shapes made of ash drift between the trees.', ''],
        [...MAUF, 'I can’t see my own belly. That’s how you know it’s bad.', 'worried']]},
      {k:'kill', at:'raven', n:'Banish the Ash Wraiths of Ravenwatch', foes:['k_wraith', 'k_wraith', 'k_wraith', 'k_bat', 'k_bat', 'k_wraith', 'k_cult']},
      {k:'talk', at:'raven', n:'Something in your pack is freezing cold', tool:'heart', L:[
        [...NAR, 'Your pack is freezing cold. Inside, the little shard of winter sky you brought home with Oswald is glowing.', ''],
        [...NAR, 'It cracks open. Inside is a heart made of ice, and it is beating.', ''],
        [...MAUF, 'Huh. Even the sky wants to help.', 'happy'],
        [...NAR, '💙 The FROZEN HEART awakens. Press N for a wave of deep cold that puts out every fire around you and slows the Kindled.', '']]},
      {k:'go', at:'lit3', n:'The ravens are circling the Raven Ring', L:[
        [...LITQ, 'Twelve stones, twelve ravens, and not one light between them. So I fixed it.', ''],
        [...LITQ, 'You have a cold heart now. I can feel it from here. Let’s see whose is stronger.', '']]},
      {k:'boss', key:'lit3', at:'lit3', sc:'ravenwatch', n:'Fight Lit at the Raven Ring', after:[
        [...LITQ, 'ENOUGH! You’re very good at putting things out. But I have keepers now, and keeps to keep.', 'angry'],
        [...LITQ, 'Every keep I warm is a light nobody can blow out. They’ll see it from SO far away.', ''],
        [...NAR, 'Lit vanishes. Far across the kingdom, towers you have never seen begin to glow red: the Scorched Keeps.', ''],
        [...BAUF, 'Ravenwatch is Scorched too. Rest, hero. Then we take the fight to Lit.', '']]}]}];
  const LASTCH = CH.length - 1;
  const step = () => L.on && L.ch <= LASTCH ? CH[L.ch].s[L.st] : null;
  const TOOLN = {pump:1, lantern:1, frost:1, bomb:1, heart:1};
  const giveTool = k => { if (!TOOLN[k]) return; W.fx = W.fx || {}; W.fx[k] = 1; };
  let fs = null, ks = null, sgt = null, hz = [], hsrc = null, banner = 0;
  const adv = () => { const s = step(); if (!s) return; if (s.tool) giveTool(s.tool); if (s.sc) { L.sc[s.sc] = 1; L.rs[s.sc] = L.rs[s.sc] || 0; } if (s.sight) L.sight = 1;
    fs = null; ks = null; L.st++; if (L.st >= CH[L.ch].s.length) { L.ch++; L.st = 0; L.cl = {}; L.heat = Math.min(5, L.ch - 1);
      if (L.ch <= LASTCH) { S.say('🔥 THE BURNING WINTER · Chapter ' + L.ch + ': ' + CH[L.ch].n + ' · 🌡 World Heat ' + L.heat, 4.5); banner = 4; } else S.say('🔥 To be continued: the Scorched Keeps are glowing… (World Heat ' + L.heat + ')', 5); }
    S.save(); };
  const unlock = () => { L.on = 1; L.ch = Math.max(1, L.ch); S.say('🔥 THE BURNING WINTER · Chapter ' + L.ch + ': ' + CH[Math.min(L.ch, LASTCH)].n, 4.5); banner = 4; S.save(); };
  // ---------- fires / Kindled tracking (polled, so no extra hooks are needed) ----------
  const FX = () => S.fire && S.fire();
  let prevF = new Set(), prevK = new Set();
  const scorched = r => L.sc[r] && !L.rd[r];
  const heal = (r, n) => { if (!scorched(r)) return; L.rs[r] = (L.rs[r] || 0) + n; if (L.rs[r] >= 30) { L.rd[r] = 1; S.give({frost:200}); S.cheerT = 2; S.say('🌨 ' + RN[r] + ' is HEALED! Clean snow falls again · +200 🔷', 4); } S.save(); };
  const track = () => { const F = FX(), cur = new Set(F ? F.fires() : []); for (const f of prevF) if (!cur.has(f) && f.out) heal(rk(f.x, f.y), 1); prevF = cur;
    const kn = new Set(S.foes.filter(f => f.k.slice(0, 2) == 'k_')); for (const f of prevK) if (!kn.has(f) && (f.hp <= 0 || f.dead)) heal(rk(f.x, f.y), 2); prevK = kn; return cur; };
  const near = (P, r) => Math.hypot(p.x - P.x, p.y - P.y) < r;
  const ringOpen = (P, r0, r1) => { for (let i = 0; i < 20; i++) { const a = Math.random()*TAU, r = r0 + Math.random()*(r1 - r0), x = P.x + Math.cos(a)*r, y = P.y + Math.sin(a)*r, tx = Math.floor(x/TS), ty = Math.floor(y/TS), v = S.tileAt(tx, ty);
      if (v != T.WATER && v != T.DEEP && v != T.HOLE && !S.solidAt(x, y)) return {x, y, tx, ty}; } return null; };
  const stepTick = (dt, curF) => { const s = step(); if (!s || S.dlg) return;
    if (s.k == 'go' && near(SP[s.at], 150)) { S.talk(s.L, adv); return; }
    if (s.k == 'fires') { const F = FX(); if (!F) return; const P = SP[s.at];
      if (!fs && near(P, 22*TS)) { fs = {list:[]}; for (let i = 0; i < 60 && fs.list.length < s.c; i++) { const q = ringOpen(P, 0, 5*TS); if (!q) continue; const f = F.ignite(q.tx, q.ty, {hp:5, life:999}); if (f) fs.list.push(f); }
        if (!fs.list.length) fs = null; else S.say('🔥 ' + fs.list.length + ' fires! Hold R to spray them', 2.4); return; }
      if (fs && fs.list.every(f => f.out || !curF.has(f))) adv(); return; }
    if (s.k == 'kill') { const P = SP[s.at];
      if (!ks && near(P, 15*TS)) { ks = 1; for (const k of s.foes) { if (!S.FOE[k]) continue; const q = ringOpen(P, 2*TS, 6*TS) || P; S.spawnFoe(k, q.x, q.y); const f = S.foes[S.foes.length - 1]; if (f && f.k == k) f.litq = 1; } S.say('🔥 The Kindled! Drive them out', 2.2); return; }
      if (ks && !S.foes.some(f => f.litq && !f.dead && f.hp > 0)) { if (near(P, 30*TS)) adv(); else ks = null; } } };
  // ---------- scorched lands: Kindled, embers, ash ----------
  let spT = 6, igT = 15;
  const scorchTick = dt => { const r = rk(p.x, p.y); if (!scorched(r) || S.boss || (S.REG[S.regAt(p.x, p.y)] || {}).safe) return;
    spT -= dt; if (spT <= 0) { spT = 9 + Math.random()*5; const n = S.foes.filter(f => f.k.slice(0, 2) == 'k_' && Math.hypot(f.x - p.x, f.y - p.y) < 900).length;
      if (n < 4) { const q = ringOpen(p, 9*TS, 13*TS); if (q && rk(q.x, q.y) == r) { const pool = POOL[r]; S.spawnFoe(pool[Math.floor(Math.random()*pool.length)], q.x, q.y); } } }
    igT -= dt; if (igT <= 0) { igT = Math.max(10, 26 - 3*L.heat); const F = FX(); if (F) for (let i = 0; i < 14; i++) { const q = ringOpen(p, 7*TS, 13*TS); if (!q) continue; const v = S.tileAt(q.tx, q.ty);
        if ((v == T.TREE || v == T.DEAD || v == T.HOUSE) && rk(q.x, q.y) == r) { F.ignite(q.tx, q.ty, {life:40}); break; } } } };
  // ---------- Lit sightings ----------
  const sightTick = dt => { if (!L.sight || S.boss) return;
    if (sgt) { sgt.t -= dt; if (near(sgt, 90)) { const lines = ['It’s so dark out here. Doesn’t it bother you?', 'Every light I make is one more they can see.', 'Keep your snow. I’m making the world bright.', 'Someone has to keep the light on.', 'They’ll see it from far away now. They’ll come home.', 'Cold hands, cold nights. I’m fixing all of it.'];
        sgt = null; L.seen++; const n = 20 + 5*L.ch; S.give({frost:n}); S.splat(p.x, p.y - 40, 16, '#ffb04a');
        S.talk([[...NAR, 'For a moment a hooded figure of flame turns and looks at you. Then it is gone in a swirl of sparks.', ''], [...LITQ, lines[L.seen % lines.length], ''], [...NAR, '🔍 Lit sighting ' + L.seen + ' · +' + n + ' 🔷', '']]); S.save(); }
      else if (sgt.t <= 0) { sgt = null; S.say('💨 The smoke column faded', 2); } return; }
    L.sT += dt; if (L.sT < 300) return; const q = ringOpen(p, 14*TS, 24*TS); if (!q || q.tx < 140 && q.ty < 140) { L.sT = 270; return; } L.sT = Math.random()*90; sgt = {x:q.x, y:q.y, t:60}; S.say('🔥 A column of smoke! Lit was here. Get there before it fades (60 s)', 3); };
  // ---------- Lit, the boss ----------
  const LITB = {1:{hp:80000, n:'LIT · THE WANDERING FLAME'}, 2:{hp:95000, n:'LIT · THE BURNING WALL'}, 3:{hp:110000, n:'LIT · THE EMBER HEART'}};   // HP floor above the Gecko God's (75000), Threat scales it like every boss
  [1, 2, 3].forEach(n => { BOSS['lit' + n] = {n:LITB[n].n, hp:LITB[n].hp, r:30, phases:4, saga:1, brain:1, draw:1, wake:470, lit:n, intro:['Lit: “Let me make you warm!”', 'Lit: “Walls of fire! Isn’t it beautiful?”', 'Lit: “Whose heart is warmer? Mine!”'][n - 1]}; LAIR['lit' + n] = {x:-1e6, y:-1e6}; });
  const isLit = B => !!(B && BOSS[B.k] && BOSS[B.k].lit);
  const dropHeat = () => { const F = FX(); if (hsrc && F) { const i = F.heatSrc.indexOf(hsrc); if (i >= 0) F.heatSrc.splice(i, 1); } hsrc = null; };
  const circ = (x, y, r, w) => hz.push({c:1, x, y, r, w, wm:w, b:0});
  const litAI = (B, dt, ph) => { const n = BOSS[B.k].lit, F = FX();
    if (!B.li) { B.li = 1; B.a1 = 1.5; B.a2 = 3.5; B.a3 = 6; B.a4 = 9; B.a5 = 7; B.orb = Math.atan2(B.y - p.y, B.x - p.x); hz = []; dropHeat(); hsrc = {x:B.x, y:B.y, r:230, h:.3 + .08*n}; if (F) F.heatSrc.push(hsrc); }
    if (hsrc) { hsrc.x = B.x; hsrc.y = B.y; }
    if (B.hp <= B.max*.35) { S.bossDown(B); return; }   // Lit always escapes
    if (!dt) return; const sp = 1 + .18*(ph - 1);
    B.orb += dt*(.45 + .1*ph); const tx = p.x + Math.cos(B.orb)*270, ty = p.y + Math.sin(B.orb)*270, dx = tx - B.x, dy = ty - B.y, dd = Math.hypot(dx, dy) || 1, mv = Math.min(dd, 130*sp*dt);
    const nx = B.x + dx/dd*mv, ny = B.y + dy/dd*mv; if (Math.hypot(nx - B.hx, ny - B.hy) < 640 && !S.solidAt(nx, ny)) { B.x = nx; B.y = ny; }
    const ang = Math.atan2(p.y - B.y, p.x - B.x);
    B.a1 -= dt; if (B.a1 <= 0) { B.a1 = (2.3 - .2*ph)/sp; const k = 3 + ph; for (let i = 0; i < k; i++) S.shot(B, ang + (i - (k - 1)/2)*.2, 290 + 20*n, {col:'#ff8a2a', r:8, dmg:1}); }
    B.a2 -= dt; if (B.a2 <= 0) { B.a2 = 5.6 - .4*ph; circ(p.x, p.y, 72, 1.1); for (let i = 0; i < 1 + ph; i++) { const a = Math.random()*TAU, r = 90 + Math.random()*160; circ(p.x + Math.cos(a)*r, p.y + Math.sin(a)*r, 64, 1.2); } }
    if (n >= 2) { B.a3 -= dt; if (B.a3 <= 0) { B.a3 = 9 - ph; hz.push({x:p.x, y:p.y, ang:Math.random()*Math.PI, len:820, wd:54, gap:(Math.random() - .5)*400, w:1.5, wm:1.5, b:0}); } }
    B.a4 -= dt; if (B.a4 <= 0) { B.a4 = 15; const kx = S.foes.filter(f => f.k.slice(0, 2) == 'k_').length; if (kx < 6) { const ks2 = n == 1 ? ['k_imp', 'k_imp'] : n == 2 ? ['k_hound', 'k_moth'] : ['k_wraith', 'k_wraith']; ks2.forEach(k => { const q = ringOpen(B, 40, 120); if (q) S.spawnFoe(k, q.x, q.y); }); S.say('🔥 Lit calls the Kindled', 1.6); } }
    if (ph >= 2) { B.a5 -= dt; if (B.a5 <= 0) { B.a5 = 8 - .5*ph; const q = ringOpen(p, 240, 330); if (q && Math.hypot(q.x - B.hx, q.y - B.hy) < 640) { S.splat(B.x, B.y, 14, '#5a4a48'); B.x = q.x; B.y = q.y; B.orb = Math.atan2(B.y - p.y, B.x - p.x); S.splat(B.x, B.y, 14, '#ffb04a'); } } }
    if (n >= 3 && ph >= 3) { B.a6 = (B.a6 == null ? 4 : B.a6) - dt; if (B.a6 <= 0) { B.a6 = 7; for (let i = 0; i < 9; i++) { const q = ringOpen(p, 0, 360); if (q) circ(q.x, q.y, 46, .9 + i*.12); } S.say('☄ Ember rain!', 1.4); } } };
  const hzTick = dt => { if (!isLit(S.boss)) { if (hz.length || hsrc) { hz = []; dropHeat(); } return; } const F = FX();
    for (const h of hz) { if (h.w > 0) { h.w -= dt; if (h.w <= 0) { h.b = .3; let hit;
          if (h.c) { hit = Math.hypot(p.x - h.x, p.y - h.y) < h.r; if (F) F.ignite(Math.floor(h.x/TS), Math.floor(h.y/TS), {hp:2, life:6}); }
          else { const dx = p.x - h.x, dy = p.y - h.y, al = dx*Math.cos(h.ang) + dy*Math.sin(h.ang), pe = -dx*Math.sin(h.ang) + dy*Math.cos(h.ang); hit = Math.abs(al) < h.len/2 && Math.abs(pe) < h.wd/2 && Math.abs(al - h.gap) > 70; }
          if (hit) S.hurtMe(1); S.shakeV = Math.max(S.shakeV, 3); } } else h.b -= dt; }
    hz = hz.filter(h => h.w > 0 || h.b > 0); };
  const litDown = B => { const n = BOSS[B.k].lit, s = step(); hz = []; dropHeat(); S.foes = S.foes.filter(f => !(f.k.slice(0, 2) == 'k_'));
    S.splat(B.x, B.y, 40, '#ffb04a'); S.splat(B.x, B.y, 30, '#4a3a38'); S.shakeV = 8; S.cheerT = 2.5; A.sfx && A.sfx('win');
    S.give({frost:150 + 75*n, flakes:15000*n, xp:500*n, score:8000*n, gear:4}); W.litWins = W.litWins || {}; W.litWins[B.k] = (W.litWins[B.k] | 0) + 1;
    if (s && s.k == 'boss' && s.key == B.k) S.talk(s.after, adv); else S.say('🔥 Lit escaped again!', 2.5); };
  // ---------- art: a hooded figure of fire whose face is never seen ----------
  const drawLit = (g, x, y, o = {}) => { const s = o.s || 1, t = o.t || 0, lo = S.low(); g.save(); if (o.a != null) g.globalAlpha = o.a;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x, y + 30*s, 22*s, 6*s, 0, 0, TAU); g.fill();
    if (!lo) { const gr = g.createRadialGradient(x, y - 20*s, 4, x, y - 20*s, 70*s); gr.addColorStop(0, 'rgba(255,150,60,.35)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y - 20*s, 70*s, 0, TAU); g.fill(); }
    for (let i = 0; i < 5; i++) { const bx = x + (i - 2)*5.5*s, h = (16 + 7*Math.sin(t*7 + i*1.7) + (i == 2 ? 8 : 0))*s, by = y - 42*s, tip = Math.sin(t*5 + i)*3*s;
      g.fillStyle = '#ff6a1a'; g.beginPath(); g.moveTo(bx - 5*s, by); g.quadraticCurveTo(bx - 6*s, by - h*.6, bx + tip, by - h); g.quadraticCurveTo(bx + 6*s, by - h*.6, bx + 5*s, by); g.fill();
      g.fillStyle = '#ffd24a'; g.beginPath(); g.moveTo(bx - 2.5*s, by); g.quadraticCurveTo(bx - 3*s, by - h*.4, bx + tip*.6, by - h*.62); g.quadraticCurveTo(bx + 3*s, by - h*.4, bx + 2.5*s, by); g.fill(); }
    const sw = Math.sin(t*2.2)*2*s; g.fillStyle = '#2b1612'; g.beginPath(); g.moveTo(x - 12*s, y - 34*s); g.quadraticCurveTo(x - 20*s, y - 5*s, x - 21*s + sw, y + 27*s);
    for (let i = 0; i <= 6; i++) g.lineTo(x - 21*s + i*7*s + sw*(1 - i/6), y + (27 + (i % 2 ? -4 : 2))*s); g.quadraticCurveTo(x + 20*s, y - 5*s, x + 12*s, y - 34*s); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,122,42,.75)'; g.lineWidth = 1.6*s; g.stroke();
    g.strokeStyle = 'rgba(255,170,60,.7)'; g.lineWidth = 1.2*s; g.beginPath(); g.moveTo(x - 7*s, y + 4*s); g.lineTo(x - 3*s, y + 12*s); g.lineTo(x - 6*s, y + 20*s); g.moveTo(x + 6*s, y - 6*s); g.lineTo(x + 9*s, y + 6*s); g.stroke();
    g.fillStyle = '#24110d'; g.beginPath(); g.arc(x, y - 33*s, 14*s, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,122,42,.7)'; g.lineWidth = 1.4*s; g.stroke();
    g.fillStyle = '#040203'; g.beginPath(); g.ellipse(x, y - 30*s, 8.5*s, 10.5*s, 0, 0, TAU); g.fill();   // the hood is dark all the way in: no face
    const fl = .7 + .3*Math.sin(t*9); g.fillStyle = 'rgba(255,170,60,' + fl + ')'; [-1, 1].forEach(d => { g.beginPath(); g.arc(x + d*17*s, y - 4*s + Math.sin(t*3 + d)*2*s, 4.2*s, 0, TAU); g.fill(); });
    if (!lo) { g.fillStyle = '#ffcf6a'; for (let i = 0; i < 5; i++) { const k = (t*.6 + i/5) % 1; g.globalAlpha = (o.a != null ? o.a : 1)*(1 - k); g.fillRect(x + Math.sin(i*2.3 + t)*14*s, y - 50*s - k*40*s, 2*s, 2*s); } }
    g.restore(); };
  const smoke = (g, x, y, a, h, t) => { if (a <= 0) return; g.save(); for (let i = 0; i < 9; i++) { const k = (t*.22 + i/9) % 1, r = 10 + k*28; g.globalAlpha = a*(1 - k)*.55; g.fillStyle = i % 3 ? '#4a4545' : '#6a6262'; g.beginPath(); g.arc(x + Math.sin(k*5 + i)*10*(1 + k), y - k*h, r, 0, TAU); g.fill(); }
    g.globalAlpha = a*.8; g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(x, y, 7 + Math.sin(t*8)*2, 0, TAU); g.fill(); g.restore(); };
  // ---------- hooks ----------
  const LT = Object.create(B0);
  const here = () => !B0.cur();
  Object.assign(LT, {
    update:dt => { B0.update(dt); if (!here()) return; const curF = track(); hzTick(dt); if (banner > 0) banner -= dt;
      if (!L.on) { if (canUnlock() && !S.dlg && !S.boss && !B0.modal()) { L.wt = (L.wt || 0) + dt; if (L.wt > 2.5) unlock(); } return; }
      stepTick(dt, curF); scorchTick(dt); sightTick(dt); },
    things:Ls => { B0.things(Ls); if (!here() || !L.on) return; const s = step(); if (!s) return;
      if (s.k == 'talk') Ls.push({x:SP[s.at].x, y:SP[s.at].y, n:'⭐ ' + s.n, f:() => S.talk(s.L, adv)});
      if (s.k == 'clues') s.at.forEach(k => { if (!L.cl[k]) Ls.push({x:SP[k].x, y:SP[k].y, n:'🔍 Look for clues', f:() => S.talk(s.L[k], () => { L.cl[k] = 1; S.save(); if (s.at.every(q => L.cl[q])) adv(); else S.say('🔍 Clue found (' + s.at.filter(q => L.cl[q]).length + '/' + s.at.length + ')', 2.2); })}); }); },
    goal:() => { if (!here() || !L.on) return B0.goal(); const s = step(); if (!s) return B0.goal(); const pre = '🔥 Ch.' + L.ch + ' · ';
      if (s.k == 'clues') { const left = s.at.filter(k => !L.cl[k]).map(k => SP[k]).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); return {x:left[0].x, y:left[0].y, n:pre + s.n + ' (' + (s.at.length - left.length) + '/' + s.at.length + ')'}; }
      if (s.k == 'fires' && fs) { const left = fs.list.filter(f => !f.out && prevF.has(f)).length; return {x:SP[s.at].x, y:SP[s.at].y, n:pre + s.n + ' · ' + left + ' left'}; }
      if (s.k == 'kill' && ks) return {x:SP[s.at].x, y:SP[s.at].y, n:pre + s.n + ' · ' + S.foes.filter(f => f.litq && f.hp > 0).length + ' left'};
      return {x:SP[s.at].x, y:SP[s.at].y, n:pre + s.n}; },
    bossReady:k => { if (!BOSS[k] || !BOSS[k].lit) return B0.bossReady(k); const s = step(); if (!here() || !s || s.k != 'boss' || s.key != k) return false; LAIR[k] = {x:SP[s.at].x, y:SP[s.at].y + 40}; return true; },
    bossAI:(B, dt, ph, ang, d) => isLit(B) ? litAI(B, dt, ph) : B0.bossAI(B, dt, ph, ang, d),
    bossDown:B => isLit(B) ? litDown(B) : B0.bossDown(B),
    drawBoss:B => { if (!isLit(B)) return B0.drawBoss(B); const g = S.g; if (B.flash > 0) g.globalAlpha = .6; drawLit(g, B.x, B.y, {s:1.5, t:S.t}); g.globalAlpha = 1; },
    portrait:(who, x, y, mood) => { if (who == 'lit') { drawLit(S.g, x, y + 10, {s:.95, t:S.t}); return true; } return B0.portrait(who, x, y, mood); },
    drawWorld:() => { B0.drawWorld(); if (!here()) return; const g = S.g, t = S.t;
      if (!L.on) { const d = Math.hypot(TEASE.x - p.x, TEASE.y - p.y); if (d < 34*TS) smoke(g, TEASE.x, TEASE.y, Math.min(1, (d - 12*TS)/(6*TS)), 420, t); return; }   // the teaser: always out of reach
      if (sgt) { smoke(g, sgt.x, sgt.y, Math.min(1, sgt.t/8), 380, t); if (S.onScreen(sgt.x, sgt.y)) drawLit(g, sgt.x, sgt.y, {s:1.1, t, a:.35 + .2*Math.sin(t*3)}); }
      const s = step(); if (s && !S.boss && (s.k == 'boss' || (s.k == 'go' && /^lit/.test(s.at)))) { const P = SP[s.at]; if (S.onScreen(P.x, P.y)) drawLit(g, P.x, P.y + 40, {s:1.5, t}); }
      for (const h of hz) { g.save(); if (h.c) { if (h.w > 0) { const k = 1 - h.w/h.wm; g.fillStyle = 'rgba(255,90,30,' + (.12 + .25*k) + ')'; g.strokeStyle = 'rgba(255,120,40,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(h.x, h.y, h.r*k, 0, TAU); g.stroke(); }
          else { g.globalAlpha = h.b/.3; g.fillStyle = '#ffb04a'; g.beginPath(); g.arc(h.x, h.y, h.r, 0, TAU); g.fill(); } }
        else { g.translate(h.x, h.y); g.rotate(h.ang); const seg = (a, b) => g.fillRect(a, -h.wd/2, b - a, h.wd);
          g.fillStyle = h.w > 0 ? 'rgba(255,90,30,' + (.15 + .3*(1 - h.w/h.wm)) + ')' : 'rgba(255,170,60,' + h.b/.3 + ')'; seg(-h.len/2, h.gap - 70); seg(h.gap + 70, h.len/2); }
        g.restore(); } },
    drawScreen:() => { B0.drawScreen(); if (!here() || !L.on) return; const g = S.g, VW = S.VW, VH = S.VH, r = rk(p.x, p.y);
      if (scorched(r)) { g.fillStyle = 'rgba(120,40,10,.10)'; g.fillRect(0, 0, VW, VH); if (!S.low()) { g.fillStyle = 'rgba(80,70,70,.6)'; for (let i = 0; i < 22; i++) { const x = (i*97 + S.t*18*(1 + i % 3)) % VW, y = (i*53 + S.t*30*(1 + i % 2)) % VH; g.fillRect(x, y, 2, 2); } }
        g.font = 'bold 13px system-ui'; g.textAlign = 'center'; g.fillStyle = '#ffd3a8'; g.fillText('🔥 ' + RN[r] + ' is Scorched · healed ' + Math.min(30, L.rs[r] | 0) + '/30 (put out fires, beat the Kindled)', VW/2, 64); }
      if (sgt) { const c = S.cam, sx = sgt.x - c.x, sy = sgt.y - c.y; if (sx < 0 || sy < 0 || sx > VW || sy > VH) { const a = Math.atan2(sy - VH/2, sx - VW/2), ex = VW/2 + Math.cos(a)*(VW/2 - 40), ey = VH/2 + Math.sin(a)*(VH/2 - 50);
          g.save(); g.translate(ex, ey); g.rotate(a); g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(16, 0); g.lineTo(-8, -10); g.lineTo(-8, 10); g.closePath(); g.fill(); g.restore(); g.font = 'bold 12px system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('🔥 ' + Math.ceil(sgt.t) + 's', ex, ey + 24); } }
      if (banner > 0 && L.ch <= LASTCH) { g.save(); g.globalAlpha = Math.min(1, banner); g.font = 'bold 22px system-ui'; g.textAlign = 'center'; g.fillStyle = '#ff9a4a'; g.fillText('THE BURNING WINTER', VW/2, VH*.3); g.font = 'bold 16px system-ui'; g.fillStyle = '#fff'; g.fillText('Chapter ' + L.ch + ': ' + CH[L.ch].n, VW/2, VH*.3 + 26); g.restore(); } },
    litAdm:(c, v) => { if (c == 'state') return {L, step:step(), hz, sgt, fs, ks, SP, CH};
      if (c == 'unlock') { unlock(); return; }
      if (c == 'next') { const s = step(); if (!s) return S.say('Admin: no Lit step right now', 2); if (s.k == 'boss' && isLit(S.boss)) { S.boss.hp = 1; litAI(S.boss, 0, S.boss.ph); return; } if (s.k == 'clues') s.at.forEach(k => { L.cl[k] = 1; }); adv(); S.say('Admin: Lit story → Ch.' + L.ch + ' step ' + (L.st + 1), 2); return; }
      if (c == 'ch') { const n = Math.max(1, Math.min(LASTCH + 1, v | 0)); L.on = 1; L.ch = n; L.st = 0; L.cl = {}; fs = ks = null; L.heat = Math.min(5, n - 1);
        for (let i = 1; i < n && i <= LASTCH; i++) CH[i].s.forEach(s => { if (s.tool) giveTool(s.tool); if (s.sc) L.sc[s.sc] = 1; if (s.sight) L.sight = 1; }); S.save(); S.say('Admin: Lit story → Chapter ' + n, 2); return; }
      if (c == 'heat') { L.heat = (L.heat + 1) % 6; S.save(); S.say('Admin: 🌡 World Heat ' + L.heat, 2); return; }
      if (c == 'sight') { L.sight = 1; L.sT = 999; S.say('Admin: a Lit sighting is coming', 2); return; } }});
  return LT;
};
})();
