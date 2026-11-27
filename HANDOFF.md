# WILDERLAND ARCADE — HANDOFF PROMPT FOR A NEW CHAT

Paste this whole file into a new chat (or attach it) and say "continue the queue".

## 0. Who I am and how to work with me
- I'm building **Wilderland Arcade**, a big kid-friendly multi-game web hub for Wilderland Academy. I'm the admin: **jonah@wilderland.academy**.
- **NOTHING RESETS.** Every save, item, ticket, prize, pet, star, home, quest, boss reward and setting must survive every update. If a system changes, migrate old saves; never wipe them. Hearts have no cap. No real money, no ads.
- Always keep working: Learn mode, parent controls, the auto-rebirth on/off toggle, prestige, stars, pets, homes, the calendar, business mode, Seasons, maintenance mode and the admin tools. Each game shows only its own admin controls.
- My token-efficiency rules (verbatim):
  1. **No Full-File Rewrites:** Never output entire files unless explicitly asked. Output ONLY the specific functions, CSS rules, or HTML blocks that need to be added or changed.
  2. **Use Anchor Comments:** When showing code edits, include 2–3 lines of surrounding context with `// ... existing code ...` markers so I know exactly where to paste the changes.
  3. **Be Concise:** Skip conversational filler, introductions, and summaries of what you are about to do. Give direct answers and code immediately.
  4. **Stay Scoped:** Do not refactor, reformat, or suggest changes to unrelated games, styles, or systems outside the exact bug or feature I asked about.
  5. **Modular Mindset:** When I ask to build a new mini-game or major feature, structure it as a standalone, self-contained module (separate `.js` or `.css` snippet) rather than coupling it tightly to the main file.
  6. **Ask Before Large Generations:** If a request requires generating more than ~150 lines of code, outline a brief 3-bullet plan first and wait for my confirmation before writing the code.
- Bug reports from me jump the queue ("prioritize X ASAP"). Fix, test, publish, then continue the queue.
- Keep chat replies short. You edit the files yourself, then commit, push and publish (section 2).
- Characters to remember: **Lord Emperor Bau Bau is a TABBY CAT.** Royal Guard **Mau Mau** is a cat (the tank, eats treats, "SHIELD BELLY!"). **Loki** is a golden retriever sorcerer who can't resist sticks and balls. **Dumpling** is a leopard gecko, the "Little King": always drawn SIDE VIEW, lying flat like a real gecko, never standing. Teammates: Maya, Leo, Ava and Sam. **Old Pip** is the penguin at Camp Cocoa. **Oswald** is Nell's missing cat.

## 1. Repo, publishing, builds
- GitHub: **PhoenixOfTheSpoon/wilderland-arcade**. Clone it and work there. Commit, then push after every change.
- Live page = a claude.ai Artifact: **https://claude.ai/code/artifact/510dea48-1eb1-4d98-b9c8-3a2bb1d72796**
  - Publish with the Artifact tool, using that `url`, `root` = the repo folder, and `files` keyed `"project/<file name>"`. The HTML must also be listed as `"project/Wilderland Arcade.dc.html"`.
  - Only send the files you changed; the others are kept.
  - If a publish is refused because a file wasn't read as published, read it with action "read", diff it against git, then publish.
- **BUILD string:** it appears twice in `Wilderland Arcade.dc.html` (the head boot script and `const BUILD`). Bump it on every publish, e.g. `sed -i "s/2026-12-14c/2026-12-14d/g" "Wilderland Arcade.dc.html"`. The current value is **2026-12-14c**.
- **What's New:** `WN = {v:'2026-12-14c', items:[[emoji, title, text], ...]}` in `qol.js`. Add an entry for each big update and bump `v`.
- Local test server: `python3 -m http.server 8770` in the repo, run in the background. Playwright and Chromium are preinstalled (`require('playwright')`).
- `firestore.rules` exists but **is still not published to Firebase**. Publishing it needs a browser, signed in to the Firebase console as the admin. Admin-only events must be enforced by Firestore rules tied to the admin's Google account; players can only read events.

## 2. Architecture (the important parts)
- `Wilderland Arcade.dc.html` holds the shell (React component), the loader, saves, the floor and the cabinets.
  - The head boot script preloads files, runs the CORE files right away, then runs the GAMES files in order.
  - A game mounts when `window.Arcade.games[id]` exists.
  - **CORE:** arcade-core, prizes-more, prizes2, economy, achievements, avatar, pets, rebirth-road, wonders, qol.
  - **GAMES:** music, live-events, moderation, calendar, games-board, games-edu, games-action, games-skill, games-extra, games-new, games-td (Trailhead Defense), games-space, games-idle (Deep Mines), games-secrets, games-more, games-more2, games-more3 (Snowball Showdown), snow-cast, snow-world, snow-saga, snow-saga-story, snow-saga-post, snow-raids-art, snow-raids, snow-castle.
  - **To add a file:** append it to the GAMES list in the head script.
- Save safety net is in the HTML: `snapSave` keeps 6 snapshots in IndexedDB, and Settings has a "Your save" panel to export, import and restore.
  - `window.WLOnCrash` closes a crashed game safely, and `A.loop` is crash-safe.
- **Snowball Showdown** (`games-more3.js`):
  - Arcade modes, plus a Loadout with gear in 5 slots (gloves, boots, hat, scarf, pack).
  - Rarities live in `GRAR`: Common, Uncommon, Rare, Epic, Legendary, Mythic, Snow. `makeGear(minR, slot)` creates gear.
  - The Forge and Fuse ("Fuse ALL the way up") are here. Special balls are in `BALLS`.
  - Admin entries are in the admin list near "Kingdom:" and "Raids:".
  - `openWorld()` starts the Snow Kingdom with an X API (`PERM`, `makeGear`, `gStat`, `maxHp`, `armM`, `spd`, `mates`, `learn2`, `stat`, …). `PERM.frost` = Frost Crystals 🔷 and `PERM.bank` = snowflakes ❄.
- **Snow Kingdom engine** (`snow-world.js`):
  - The world is 140×140 tiles of 48 px. Camp Cocoa is around tile (50, 86).
  - Its save is `W = PERM.ow`, holding `W.base` (castle tier and rooms), `W.saga`, `W.rs` (raids), `W.titles`, `W.outfits`, `W.treats` and more.
  - It builds a context **S** (getters and setters for its internals) and passes it to the modules.
  - The hook object **SG** is built in a chain: `SG = A.snowSaga(S)`, then `SG = A.snowRaids(S, SG)`. The raid module wraps the saga hooks.
  - When a hook returns true, the module handled it. The hooks are: things, goal, update, move, tile, drawTiles, drawWorld, ents, drawScreen, drawTop, drawMini, key, down, respawn, bossAI, hurtBoss, bossDown, drawBoss, drawFoe, drawBar, mauSpot, mateSpot, raidMods, warTable.
  - Bosses flagged `saga:1, brain:1, draw:1, bar:1` are run by the modules.
  - Realm space (saga regions and raid floors) is tile x ≥ 180. The saga keeps one region in memory at a time.
- `snow-saga.js`: 11 regions, climbing, gliding (needs the Snow Cloak), swimming, stamina, Ice Shrines with puzzles, waystones, cooking.
  - The Aurora Statue gives blessings for 4 emblems each, capped at 8 hearts and 8 stamina.
  - Anti-stuck: you can always walk out of an edge, and pushing a direction for 1.5 s without moving sends you to `lastSafe`.
- `snow-saga-story.js`: the 9-chapter Dumpling Saga with 8 region bosses and Dumpling fights 1–6.
  - Fight 6 has 10 phases. **Being knocked out resets him to full health and phase 1; leaving keeps his health** (`W.bhp.dump6`).
  - `SAGA.drawGecko` is exported for other modules.
- `snow-saga-post.js`: post-game "Cat Gone Missing", 3 god fights and the Gecko God (50 layered bars), with the rematch leaderboard `snowgod`.
- `snow-raids.js` + `snow-raids-art.js`: **Raid Season**.
  - 10 raids with floors coded c/r/b/l/k/g/m/G/B. Difficulty and modifier lists are `DIFF` and `MODS`.
  - A mechanics library `MECH`: slam, charge, breath, ring, orbs (reflectable), volley, adds:shield/heal/bomb, int (interrupt), stack, spread, pz (puzzle), dive, wind, mirror, crawl, tail, camo, bh (black hole), bloat. Each boss's kit is in `KIT`.
  - Also: stagger, weak windows, enrage timer, the tank (Mau Mau), checkpoints, War Table panels, the Quartermaster, relics, leaderboards (`WLCloud.postScore`/`top`) and admin (`SG.raidAdm`). Saves are in `W.rs`.
- `snow-castle.js`: the base is a castle walled around all of Camp Cocoa (tiles 38–62 × 76–96). 12 base levels (`W.base.tier` 0–11, shown as Level tier+1 / 12); wall looks per level in `WL`; `keep()` draws the main castle; `SPOTS` places 18 room buildings; levels 5–12 add `dress()` decorations.
  - Base logic is in snow-world.js (`TIER_N`, `TIER_COST` ×2.5 per level, `ROOMS` with `at:` unlock level, `roomCost`, `buyRoom`, `tierUp`, `upgradeAll`, `MILE` one-time rewards, Frost Crystal Mine `mineHas/mineTake` with `W.mineAt`, Map Room flags `W.mflags`, Infirmary gold hearts `p.over`).
  - Snow Friends Lodge (`rooms.lodge`) gives teammates in every Snowball game (games-more3 `lodgeN/lodgeUp`).
  - Gates are made in snow-world `genMap`. Walls look different at each of the 4 tiers.
  - There's one building per room, growing at levels 1–4. Pressing E at a building opens `roomPanel`.
- `music.js` (`window.WLMusic`):
  - Chiptune moods via `WLMusic.mood(name)`: one per region, saga moods (dump1–3, godchoir) and raid moods (r_library … r_void).
  - Also a "playlist" of 8 written songs in `SONGS` (one is **"Hex Pup Hustle"**), a "player" track mode, and Kevin MacLeod mp3 files in `assets/music`.
  - **Known issue:** the player hears "Hex Pup Hustle" everywhere. This is likely because when the music setting is on playlist/player, `mood()` changes are ignored. See queue item A6.
- **Debug from Playwright:**
  - `window.Arcade._dbg.snow().openWorld()`, then `const d = window.Arcade._dbg.snow().wm().dbg()`. It gives `d.p`, `d.W`, `d.SG()`, `d.bossNow()`, `d.foes()`, `d.hurtBoss`, `d.dlg()`/`d.nextLine()`, `d.tileAt`, `d.M()`, `d.chests`, `d.p3.panel()`.
  - Saga admin: `window.Arcade.SAGA.story.adm.*`. Raids admin: `d.SG().raidAdm.*`.
  - App logic is on the React fiber of `header` (`stateNode.logic`), e.g. `.open("snowball")`.
- `dev-tests/`: Playwright scripts I used (smoke = all games open, saga1–3, raid1/3/4, wtclick, castle, sky3 stuck-scan, edge, reach = chests reachable, loadtime). They expect the server on port 8770.
  - Set `localStorage 'wl-wn' = '2099'` in tests so the What's New popup doesn't block clicks.

## 3. Recently finished (don't redo)
- **Sugar Siege** (Dec 14c): `sugar-siege.js`, an EXTRA game (not a cabinet), lazy-loaded by `openSugar()` from ☰ Menu → Extras. No tickets/prizes/Workshop. Own save `localStorage 'wl-sugar-v1:'+profKey`, own achievements, leaderboard game id `sugarsiege` (score cap `SCORE_MAX` = 490,500). 24 generated levels (`genLevel(n)`, seeded), flow fields (`field`, Dijkstra, Float64!), hero wand, 8 enemy types, 8 bosses, 8 building types to lv3 + 2 branches, troops, keep lv1–5 with 12 specializations, Easy/Normal/Hard, mid-wave reload restarts the wave. Music moods `ss_build/ss_battle/ss_boss` in music.js. Debug: `window.WLSugar._dbg()`.
- Base to Level 12 (Dec 14): 12 tiers, rooms to 12, 9 new rooms (Lodge, Armory, Map Room, Infirmary, Beacon, Mine, War Room, Royal Hall, Spirit Vault), milestone rewards, Upgrade all + red dot, Level 12 celebration + Castle Builder diamond + Winter Kingdom Crown (Wilderland hat), admin set base/room levels.
- Snowball Workshop is ticket-only (+2%/level, `tix:1` in UPG_RAW). Old power kept in `P.snowLeg` until the next rebirth.
- Boss knockout rule (first part of the Boss + Difficulty overhaul): knocked out or leaving = boss refills to the top of its current phase (`spawnBoss`; Dumpling 6 too). Old mid-fight saves kept exact health once (`W.bhpExact`).
- Touch controls in the Snow Kingdom: floating joystick (left), THROW button with auto-aim (right), new bottom bar.
- Raid Season: War Table, 10 raids, bosses with tells and counters, Normal–Nightmare, weekly modifiers, keys, sets, relics, tokens, Quartermaster, lockouts, trophies, achievements, titles, leaderboards.
  - Also: objective arrows, hotbar spacing (icons only when it doesn't fit), spread-out teammates, no night sky indoors.
  - The bug where War Table buttons were disabled is fixed.
- Castle base around camp with gates; buildings that grow; E opens a room's upgrade.
- Aurora Statue blessing caps (8 hearts / 8 stamina).
- Stuck-at-edge fix; every chest reachable; Dumpling drawn side-on.
- Snowballs fly over gaps (Dumpling phase 6 throwing while gliding works). Snowball range doubled, charged throws go further, teammates' range is longer.
- Fight 6: being knocked out resets him to full health; leaving keeps it.

## 4. THE QUEUE (in this order)
**NOW (approved "go", Nov 27):** raid update in 4 parts. 1) DONE Dec 14m: raids change every run (`buildPlan`, `run.plan`, room `shapeRoom`, extra floors E/M by difficulty, twists dark/ice/shrink, Heroic traps, Nightmare final boss +1 phase). 2) Underwater raid (temple from The Flooded Steps: enemies ×2, rewards ×2, air meter from stamina, Breathing Mask for Frost Crystals). 3) Endless Dungeons (timed floors, 10 🔷 + 250 ❄ doubling per floor). 4) Dumpling raid-style mechanics.
**NEXT BIG SPEC: "THE BURNING WINTER"** — full text in `specs/burning-winter.md` (4× world, Lit story after the Gecko God, fire vs frost, Kindled, 60+ side quests, keeps/outposts, graphics, music). Needs a phased plan + user "go" before building.
**NEXT: Snow Kingdom Boss + Difficulty Overhaul** — stage 2 DONE (Dec 14b): THREAT section in snow-world.js (`THR`, `TM` multipliers, `gearScore()` best piece per slot + Power Arm, `W.gsMax`, `thr()`, `W.forceThreat`), boss shots go through `bossShot` (≥0.6 s wind-up `TELL()`, patterns cut at 2.4 s + 2 s breather, ring gap `inGap`, cap 22/14 boss balls), stagger `addStg`/`stunB` (stun = ×2 player damage, uncharged ×0.5, hearts drop), Threat extras `exUpdate` (Fierce Frost Guards `tguard`, Brutal second form + slam `haz`, Mythic icicles), elites (`f.elite`), knockout = revive in arena at `W.koPct`% (respawn), boss health saved as a share (`W.bhm`). Raid bosses (`BOSS[k].rd`) skip all of it; Gecko God (`post`) gets anti-spam but no extras.
  Remaining: 3) Dumpling fight 6 rework (black-ice dome, 10 new phases, Give up, reload = inside + knockout); 4) per-boss mechanics (3+ each) in batches + raid Threat extras.
- **Snow Kingdom damage overhaul** (user spec in chat, Nov 27): gear raises damage (all multiplicative), Frostbite stacks, combo ×3, Shatter, remove the spam ×0.5, Frost Guards 70%, stun ×3, bosses pressure the player, fight-length targets per Threat tier, damage breakdown, admin DPS meter, big-number popups. DO THIS NEXT.
- **Class skill trees need more upgrades** (user: "not enough upgrades", Slinger Lv 21 has 11 unspent points; 3 branches × 3 ranks). User said do it LAST.

**A. Snow Kingdom Update** (full spec below). Still to do:
1. Infinite fusing through 10 grades to PHOENIX, then Phoenix +1, +2… forever.
   - Fusion Forge in Frostpine Village and at the castle, with preview, "Fuse all duplicates", Auto-fuse, a lock on favorite items, and Frost Crystal cost.
   - Map the old rarities (Common…Mythic, Snow) onto the new grades without losing any item. The current rule is "fuse 3"; the spec says 2.
2. ALL Snow Kingdom upgrades cost Frost Crystals only. Remove Snow Kingdom upgrades from the arcade Upgrade Workshop (keep only ticket boosters).
   - Convert Workshop levels people already bought into the matching Frost Crystal upgrades, and refund any tickets that can't be converted.
   - Add more Frost Crystal sources.
3. Range: Frost Crystal range upgrades with no cap, range on gear and fused items, a faint aiming line/arc showing max range, and lobbed throws that arc over walls. Base range is already doubled.
4. Rebalance phase 6 of fight 6 so it's hard but not endless. Throwing while gliding is already fixed.
5. NO EMOJIS for any boss, enemy or important character.
   - Custom drawn art with unique silhouettes, shading, and animations (idle, wind-up, hit, phase change). Raid bosses already have canvas art in `snow-raids-art.js`; push them further.
   - Check every game for emoji characters, e.g. the rabbit and other critters, and emoji enemies in other modes.
   - Emojis are OK only in small UI labels.
6. ORIGINAL MUSIC: real melodies, harmony, bass and drums per region, village, dungeon, raid, combat, each boss and the Dumpling fights, with smooth looping and crossfades.
   - Fix "Hex Pup Hustle" playing for everything.
7. Admin: add Frost Crystals, give an item of any grade, reset the Dumpling fight.

**B. Boss Overhaul** (full spec below). Applies to every game with bosses: Snow Kingdom, raids, sieges, Dumpling, Trailhead Defense, Deep Mines, the space shooter and Snowball waves.
- Raids already follow most of the rules. Still needed: the Boss Journal, mid-fight teammate hints (raids have them; add elsewhere), Practice on beaten bosses, medals (No hit / Perfect interrupts / Speed kill), mastery tiers bronze→diamond, Loki's ball-chase on the Snow Kingdom Loki fight, and an admin "Skip to boss phase / Toggle boss hints" in every game.

**C. Defenders of the Trail** (Trailhead Defense mega update, full spec below).

**D. Deep Mines mega update** (full spec below). Part of it may already be done: check `games-idle.js` first, then do the rest.

**E. Couch Co-op — LAST** (full spec below). Online and couch co-op raids also come with this.

**Also pending:**
- A bug pass on every game. The save check showed no saved run for memory, tictactoe, trace, reaction, typing, simon, mines, td, idle, secrets, lumber and fishing; check which of these are real bugs.
- A **"Developed Games"** section at the bottom of the arcade floor (Fishing Hole, Snowball Showdown, Trailhead Defense, Deep Mines, …).
- Publish `firestore.rules`.

---
## SPEC A — Snow Kingdom Update
SNOW KINGDOM UPDATE for SNOWBALL SHOWDOWN. Keep every save, item, quest, boss reward and setting — NOTHING resets.

═══ 1. INFINITE FUSING — UP TO PHOENIX GRADE ═══
- Gear, special snowballs and weapons can be fused: combine two items of the same grade to make one item of the next grade.
- 10 grades, each with its own color, glow and name: 1 Common → 2 Sturdy → 3 Fine → 4 Rare → 5 Epic → 6 Heroic → 7 Legendary → 8 Mythic → 9 Celestial → 10 PHOENIX GRADE.
- Phoenix Grade items look incredible: fiery orange-gold glow, ember particles, a flickering flame trail on snowballs, and a rising-phoenix animation when fused.
- Infinite fusing: after Phoenix Grade, fusing keeps going forever as Phoenix +1, +2, +3… with no limit, each level increasing the item's power.
- A Fusion Forge in Frostpine Village (and at your base) with a big satisfying fusing animation, a preview of the result, "Fuse all duplicates" and "Auto-fuse" buttons, and a lock button so favorite items aren't fused by accident.
- Fusing costs Frost Crystals.

═══ 2. ALL SNOW KINGDOM UPGRADES USE FROST CRYSTALS ═══
- Every upgrade that affects the Snow Kingdom (hearts, damage, snowball range, throw speed, stamina, teammates, gear, base, fusing) is bought with Frost Crystals only.
- Remove all Snow Kingdom upgrades from the arcade Upgrade Workshop. The only Workshop upgrades that affect Snowball Showdown are ticket boosters (more tickets when you cash out).
- Players who bought Snow Kingdom upgrades in the Workshop keep the same power: convert those levels into the matching Frost Crystal upgrades, and refund any tickets that can't be converted.
- More ways to earn Frost Crystals: bosses, raids, shrines, quests, chests, and dailies.

═══ 3. SNOWBALL RANGE ═══
- Snowball range is far too short. Increase base throwing range a lot (at least double), so you can hit enemies from a comfortable distance.
- Add Frost Crystal range upgrades with no cap, plus gear and fused items that add range.
- Charged throws go even further, and lobbed throws arc over walls to a target spot.
- Show a faint aiming line/arc with the max range so players know what they can hit.

═══ 4. DUMPLING FIGHT FIXES ═══
- PHASE 6 BUG: You can't throw snowballs while gliding in Phase 6 (Shatter Floor), which makes the phase drag on forever. Allow throwing while gliding (aerial throws) everywhere, including Phase 6, and rebalance Phase 6 so it's hard but not endlessly long.
- THE 6TH FIGHT (end of the main story, not the Gecko God saga): if the player DIES, Dumpling's health completely resets to full and the fight restarts from Phase 1, with no checkpoints. If the player LEAVES the fight (Save & leave or quits), his health and phase are kept exactly where they were and the fight resumes there next time.

═══ 5. MORE CREATIVE BOSSES (NO EMOJIS) ═══
- Bosses and enemies are using emojis instead of real art. Replace every emoji boss, enemy and important character with a custom-drawn character: unique silhouettes, detailed shading, animations (idle, attack wind-ups, hit reactions, phase transformations) and personality.
- Make boss designs creative and memorable, e.g.: the Living Encyclopedia (a giant book golem with flapping pages and ink tendrils), the Crypt Warden (a towering ice knight with a lantern heart), the Thunderhawk (a storm bird made of clouds and lightning), the Glacier Leviathan (a whale-serpent of cracked ice), the Frost Engine (a clockwork machine with steam and gears), the Mega Meatloaf (a wobbling meatloaf monster with a gravy cape).
- Emojis are only allowed in small UI labels, never for characters, bosses or enemies.

═══ 6. ORIGINAL MUSIC ═══
- Stop playing the same track ("Hex Pup Hustle") everywhere. Give the Snow Kingdom original, good-sounding music: different tracks for each region, villages, dungeons, raids, combat, each boss, and the Dumpling fights, with real melodies, harmony, bass and drums, smooth looping, and smooth crossfades between areas.

═══ RULES ═══
- No real money, no ads. NOTHING resets. Hearts have no cap.
- Keep Learn mode, parent controls, the auto rebirth on/off toggle, prestige, stars, pets, homes, the calendar, business mode, Seasons, maintenance mode and the jonah@wilderland.academy admin working.
- Each game shows only its own admin controls (add: Add Frost Crystals, Give item of any grade, Reset Dumpling fight).
- Everything saves and loads after a reload, including Dumpling's health when you leave the 6th fight.

Test: fusing works through all 10 grades and keeps going past Phoenix; Snow Kingdom upgrades cost Frost Crystals and old Workshop upgrades were converted; base snowball range is much longer and range upgrades work; you can throw while gliding in Phase 6; dying in the 6th Dumpling fight resets his health to full, leaving keeps it; no bosses or enemies use emojis; each area has its own original music; everything saves after a reload.

---
## SPEC B — Boss Overhaul
BOSS OVERHAUL for Wilderland Arcade: every boss should be a puzzle you learn, not a bullet-spam endurance test. Applies to every game with bosses, especially Snowball Showdown (Snow Kingdom, raids, sieges, the Dumpling saga), Trailhead Defense, Deep Mines, the space shooter and Snowball waves. Keep every save, boss reward and achievement — NOTHING resets.

═══ 1. THE NEW RULES FOR ALL BOSSES ═══
- LESS SPAM: Cut random bullet spam way down. Bosses fire fewer projectiles, and each attack has a purpose and a pattern. Big screen-filling barrages are rare "ultimate" moves with long warnings, not the default.
- TELLS: Every attack has a clear, consistent wind-up (pose, sound, glow, floor marker) so players can learn and react. The same tell always means the same attack.
- COUNTERPLAY: Every attack can be avoided or countered by doing the right thing: dodge-roll through it, duck behind a wall, jump, stand in a safe zone, interrupt it, reflect it, or use the environment.
- WEAK POINTS & STAGGER: Bosses take low damage most of the time and big damage when you exploit their mechanic. Each boss has a stagger/break meter; filling it (by hitting weak points, interrupting, or using the arena) knocks the boss down for a damage window.
- PHASES CHANGE THE RULES: Each new phase adds a new mechanic or changes the arena, not just "same attacks but faster".
- LEARNABLE: A boss should be beatable with skill at any gear level on Normal. Dying should teach you something.
- FAIR: No unavoidable damage, no attacks from off-screen without warning, and checkpoints between phases on long fights.

═══ 2. MECHANICS TO USE (mix several per boss) ═══
- Weak points that open briefly (glowing spots on the back, under the belly, on the tail).
- Interrupts: hit the boss with a charged snowball while it channels a spell to cancel it.
- Reflect/parry: knock certain projectiles back at the boss with a well-timed throw.
- Environment: lure the boss into hazards (icicles you shoot down, ice it slips on, campfires that melt its armor, walls it crashes into).
- Stack and spread: share a big hit together, or spread out to avoid chain attacks.
- Adds with a job: minions that shield the boss, heal it, or carry bombs you can throw back.
- Puzzles mid-fight: light braziers, rotate mirrors, ring bells in order to open a vulnerability.
- Positioning: safe zones that move, rising floors, conveyor belts, arena pieces that fall away.
- Tug-of-war / button mash moments for dramatic clashes.
- Team mechanics: one player draws aggro while others hit the weak spot (teammates do this automatically in solo).
- Personality mechanics that fit the character (see Part 3).

═══ 3. REDESIGN THESE BOSSES ═══
- LOKI (golden retriever sorcerer): He can't resist a thrown stick or ball: throw Loki's Ball to make him chase it, exposing his back. His spells are interruptible. In his last phase he summons mirror copies; only the real Loki wags his tail.
- YETI KING: Charges in straight lines; dodge so he crashes into walls and gets stunned. Ground-pound shockwaves you jump over. Lure him under icicles and shoot them down.
- SNOWPLOW BOT: Plows forward; build a wall to stop it and expose its engine. Its engine overheats if hit 3 times in a row.
- BLIZZARD WITCH: Makes whiteouts; follow the sound of her bells to find her. Break her 4 ice crystals to stop her healing.
- FROST DRAGON: Breath attacks telegraphed by a glowing throat; hide behind pillars. Flies up and dive-bombs where its shadow is. Hit its wings to ground it.
- GHOST BOSS (Trailhead Defense): Turns invisible; Lanterns reveal it, and only revealed it can be hit. Possesses towers temporarily; protect key towers.
- CHAO CHAO: Erratic teleports with a flicker tell; his shadow copies don't cast shadows, so you can spot the real one. Calms briefly when Bau Bau is near (use him to open damage windows).
- DUMPLING: Wall-crawler: knock him off walls with charged snowballs to stun him. Tail decoy attacks: hit the tail to make him drop it, giving a weak-point window. Camouflage: footprints and his eyeball-licking sound give him away. Gecko God form: each of his god powers has a counter (stop time with interrupts, reverse gravity by flipping switches, black holes closed by throwing light orbs).
- MEGA MEATLOAF (Mau Mau's raid): Mau Mau can eat pieces of it for buffs; feeding Mau Mau at the right moment shrinks the boss.
- RAID BOSSES: give every raid boss at least 3 unique mechanics from Part 2 that aren't just projectiles.
- Other games' bosses (Deep Mines layer bosses, Trailhead Defense bosses, space shooter bosses, Snowball wave bosses): give each one a clear mechanic and weak point too.

═══ 4. HELP PLAYERS LEARN ═══
- A Boss Journal: after you meet a boss, its page fills in with its attacks, tells and weaknesses as you discover them (some hints unlock after a failed attempt).
- Optional hints from teammates mid-fight ("Its back is open after it slams!"), toggleable.
- A "Practice" button on beaten bosses to replay any phase.

═══ 5. REWARDS ═══
- Bonus rewards for fighting well: "No hit", "Perfect interrupts", "Speed kill" medals on each boss.
- Boss mastery tiers (bronze → diamond) with titles and cosmetics.

═══ RULES ═══
- No real money, no ads. NOTHING resets. Hearts have no cap.
- Keep boss bars, phases, layered bars (Gecko God), checkpoints and all existing boss rewards.
- Keep Learn mode, parent controls, the auto rebirth on/off toggle, prestige, stars, pets, homes, the calendar, business mode, Seasons, maintenance mode and the jonah@wilderland.academy admin working.
- Each game shows only its own admin controls (add: Skip to boss phase, Toggle boss hints).
- Performance: fewer projectiles also means smoother fights on low-end computers; keep effects light in Performance mode.
- Everything saves and loads after a reload.

Test: each boss's attacks have consistent tells and can be avoided or countered; bosses use their listed mechanics; random bullet spam is gone and big barrages are rare and well warned; stagger/weak-point windows work; Loki chases the ball; the Boss Journal fills in; every boss is beatable on Normal with skill; everything saves after a reload.

---
## SPEC C — Defenders of the Trail
HUGE UPDATE for TRAILHEAD DEFENSE: "Defenders of the Trail". Build on everything already there (bigger maps, more towers, Ghost Boss, Performance mode, upgraded tower visuals, uncapped Gold Pans). Keep every save, high score, unlock, upgrade and achievement — NOTHING resets. Keep the rest of the arcade working, and play-test every map and mode.

═══ 1. GAME SPEED UP TO 1000× ═══
- Speed options: 0.5× / 1× / 2× / 3× / 5× / 10× / 25× / 50× / 100× / 250× / 500× / 1000×, plus a custom speed slider and Auto-start next wave.
- High speeds must stay accurate and smooth: run the game logic in fixed small steps (many steps per frame at high speed) so nothing skips through towers or breaks, and at very high speeds simplify the drawing (fewer effects, no particles, only update what's visible) so the screen keeps up. Enemies, gold, lives and wave counts must be exactly the same at 1000× as at 1×, just faster.
- Show the current speed clearly, with hotkeys (number keys or +/−).

═══ 2. FREEZE STACKS ═══
- Freeze and slow effects from different towers and repeated hits now stack: each freeze hit adds a stack, making the enemy slower and the freeze last longer, up to a full freeze (enemy completely stopped).
- Show freeze stacks on enemies (a frost meter or snowflake count above them), and enemies visibly ice over more as stacks build.
- Ice towers' upgrade paths can add more stacks per hit, longer stack duration, and "Shatter" (bonus damage when a fully frozen enemy is hit).
- Bosses can be frozen too, with stacks building more slowly and a short "thaw" immunity after a full freeze so fights stay fair.

═══ 3. GOLD PANS = MORE GOLD PER MONSTER ═══
- Gold Pans now increase the amount of gold every monster gives when defeated (e.g. +X% gold per kill per level), on top of anything else they already do.
- No level cap: every level keeps increasing gold per kill, with costs rising exponentially.
- Show the current gold-per-kill bonus and the bonus at the next level in the upgrade card, and show gold popping out of defeated monsters.

═══ 4. CAMPAIGN: "THE LONG TRAIL" ═══
- A campaign map (like a hiking trail map) with 6 regions and 60 levels: Pinewood Forest, Misty Marsh, Canyon Pass, Frozen Summit, Ember Badlands, and The Shadow Peak.
- Each level has 1–3 stars (win, lose no lives, finish under a wave/time goal) and optional bonus challenges ("Only use 3 tower types", "No selling").
- Each region has its own enemies, terrain, weather and a region boss with phases and a boss bar. Short story scenes between regions.
- Hard and Expert versions of every level unlock after beating it.

═══ 5. HEROES ═══
- Place one Hero on the map who walks, fights and levels up during the match, with 3 abilities on cooldowns. Heroes: Ranger Rook (archer), Mau Mau the Royal Guard (tank, blocks paths), Sprout the Druid (heals towers, roots enemies), Blaze the Fire Fox (area damage), Frostbite the Owl (adds freeze stacks), Captain Gopher (summons diggers).
- Heroes have permanent levels, skins and a talent tree outside matches.

═══ 6. TOWERS 2.0 ═══
- Keep all current towers and add more, at least 20 tower types total (e.g. Pinecone Catapult, Beehive, Lightning Rod, Mushroom Spore, Waterfall Cannon, Mortar Badger, Sniper Owl, Bank/Gold Mine, Lantern (reveals invisible enemies), Ice Spire, Root Trap, Wind Chime (knockback), Support Totem (buffs nearby towers)).
- Branching upgrade paths: each tower has 2–3 paths with 5+ tiers; picking a path changes how it looks and plays. Top tiers look epic (giant, glowing, animated).
- Tower synergies: certain towers placed near each other combo (e.g. Ice + Lightning = shatter damage, Beehive + Mushroom = poison swarm). Show a synergy line between them.
- Targeting options per tower: First, Last, Strongest, Weakest, Closest, Flying first.
- Tower stats panel: damage dealt this game, kills, DPS, with a sell/upgrade button and upgrade previews.

═══ 7. ENEMIES & BOSSES ═══
- Many more enemy types with clear looks and counters: armored, flying, invisible (needs Lantern), shielded, healers, splitters, tunnelers, speedsters, swarms, and enemies that disable towers.
- Enemy info book: tap an enemy to see its weaknesses; unlocked enemies go into a bestiary.
- Bosses with phases and boss bars: keep the Ghost Boss and add the Bear King, the Stone Golem, the Swamp Hydra (grows heads), the Wildfire Phoenix (revives once), the Avalanche Giant, and the final boss, Loki the golden retriever sorcerer.

═══ 8. MODES ═══
- Endless Mode with rising difficulty, mutators every 10 waves, and a leaderboard.
- Daily Challenge (same map, seed and rules for everyone) and Weekly Challenge with special modifiers.
- Sandbox: unlimited gold, spawn any enemy, test builds.
- Maze Mode: open fields where players build the path by placing towers (but can never fully block it).
- Boss Rush: back-to-back bosses.
- Co-op (uses the existing Firebase setup): 2 real players share one map, each with their own gold and towers.

═══ 9. META PROGRESSION ═══
- Research Tree (permanent): upgrades for starting gold, tower damage, tower range, hero power, more lives, cheaper upgrades, freeze strength, new tower unlocks. No caps on levels that keep giving value.
- Tower Mastery: using a tower earns its XP, unlocking skins and small bonuses.
- Map Editor: build custom maps (path, terrain, decorations) and share them with a code.

═══ 10. QUALITY OF LIFE ═══
- Pause and place towers while paused.
- Range circles when placing and selecting, and a placement preview showing valid spots.
- Wave preview: shows which enemies are coming next.
- Upgrade hotkeys, quick sell, undo the last placement within 3 seconds.
- Save mid-match and resume later.
- End-of-game stats screen (top tower, damage chart, gold earned).
- Big maps scroll and zoom smoothly (mouse wheel/drag, pinch on phones), with a mini-map.

═══ 11. GRAPHICS & PERFORMANCE ═══
- Detailed, textured maps with layered terrain, water, trees and animated details; weather (rain, snow, fog, fireflies at night) that sometimes affects gameplay.
- Animated enemies (walk, hit, death puffs), projectile trails, impact effects, and towers that animate when firing.
- Must run smoothly on low-end computers on the biggest maps with hundreds of enemies: draw everything on one canvas, reuse objects, limit particles, and simplify effects in Performance mode and at high speeds.
- Full screen with Y or the Full screen button; works on phones with tap-to-place and big buttons.

═══ 12. REWARDS ═══
- Tickets balanced with other games, plus Trail Badges (a Defense-only currency) for research and skins.
- New prize sets: Trail Towers, Trail Bosses, Hero Collection.
- Achievements for stars, bosses, endless waves, synergies, heroes, research and playing at 1000× (bronze → diamond tiers).
- Avatar items and titles (e.g. "Trail Warden", "Tower Tactician").

═══ RULES ═══
- No real money, no ads. NOTHING resets.
- Keep uncapped Gold Pans and all existing upgrades.
- Keep Learn mode (questions between waves for bonus gold; skip them automatically above 10× speed), parent controls, the auto rebirth on/off toggle, prestige, stars, pets, homes, the calendar, business mode, Seasons, maintenance mode and the jonah@wilderland.academy admin working.
- Each game shows only its own admin controls. Defense admin tools: Go to wave, Add gold, Add lives, Spawn enemy, Spawn boss, Set any speed, Unlock all towers (admin only).
- Everything saves and loads after a reload, including mid-match saves.

Test: 1000× speed gives the same results as 1× and stays smooth; freeze stacks build up to a full freeze and bosses have thaw immunity; Gold Pans increase gold per monster with no cap; every campaign level is beatable on Normal; heroes, towers, branching paths and synergies work; every enemy has a counter; every boss is beatable; all modes work including co-op on two devices; mid-match save works; everything works on phones.

---
## SPEC D — Deep Mines
MEGA UPDATE for DEEP MINES. Keep every save, layer, miner, upgrade, code, gem, pet, star and setting — NOTHING resets. Keep the rest of the arcade working.

═══ 1. FIXES ═══
- BEST SCORE: The header shows "Score 2.40e110 · Best 100.0M". Best must update to the highest score reached and use the same number format. Remove any cap on Best for Deep Mines.
- NUMBERS CUT OFF: Miner tiles in the right column clip their rate ("2.23e108/" is cut off) and floating text like "+16.2K ORE" covers the tiles. Every number must fit inside its tile (shrink or wrap), and floating text must appear above the grid, fade quickly and never block taps.
- HIRING BREAKS MERGING: "Hire miner ×Max" now hires miners at level 608, so the whole grid is identical level-608 miners and merging does nothing. Fix it: hired miners start at a level based on your Better Hires/Starting Crew upgrades but always below your best miner, so merging always matters. Merging two of the highest-level miners must always create a new, higher level (no level cap).
- WASTED SPACE: The game is a narrow column in the middle of the screen with empty space on both sides. Use the whole screen (see Part 2).

═══ 2. NEW LAYOUT (FULL SCREEN) ═══
On desktop, use three areas side by side:
- LEFT: the mine scene, much bigger, with your pet beside your miners.
- CENTER: the merge grid.
- RIGHT: a tabbed panel — Upgrades · Gear · Codes · Museum · Stats — always visible so you don't have to open a popup.
Top bar: ore, ore/s, gems, layer name and number, progress to next layer, active event, Options and Save & leave. Bottom bar: Hire, Buy Max, Auto-merge toggle, Cash Out.
On phones: mine scene on top, grid below, the panel as a bottom sheet. Full screen with Y or the Full screen button.

═══ 3. MINERS THAT EVOLVE ═══
- Miners change appearance as they level up, with a new look and name at milestones, e.g. Lv 1 Rookie Digger → 10 Tunnel Rat → 25 Rock Breaker → 50 Gem Seeker → 100 Deep Delver → 250 Crystal Knight → 500 Magma Walker → 1,000 Void Miner → 2,500 Star Forger → 5,000+ Legendary Earthshaker (keep adding tiers). Each tier gets new gear, colors and glow.
- MINER TYPES: unlock special miners that can be placed on the grid and merged with their own type:
  • Driller (fast, steady ore), Dynamiter (big bursts every few seconds), Gem Hunter (finds gems), Cart Pusher (boosts nearby miners), Lantern Bearer (boosts miners in its row), Golem (huge, takes 2 tiles).
  Show each miner's type icon on its tile.
- Merge animations: miners jump together, flash, and the new tier pops out with sparkles. Show a "New tier unlocked!" banner the first time.
- Auto-merge toggle (uses the Foreman) and a "Merge all" button.
- Bigger grid upgrades: more slots unlocked with ore (6×6 → 8×8 → 10×10). Miners that don't fit (like "+22") go to a Barracks list where you can swap them in.

═══ 4. THE MINE SCENE, ALIVE ═══
- Show miners actually digging in the scene: swinging picks, pushing carts on tracks, lighting dynamite, carrying gems.
- Each layer's biome gets detailed, layered backgrounds (parallax), lighting, and lots of themed props (for Lollipop Palace: gumdrop rocks, caramel rivers, sugar crystals, licorice beams). No flat backgrounds.
- Tap the rock to dig: cracks appear, chunks fly off, and it shatters into ore when broken. Rare rocks (golden, crystal, rainbow) give big rewards.
- Treasure chests, gem veins, fossils and lost relics appear and can be tapped to collect.
- Smooth "drop down" transition with a depth counter when you reach a new layer.

═══ 5. LAYERS, BIOMES & BOSSES ═══
- Keep all current layers. Group them into named biomes with a biome title card when you enter one (e.g. Candy Caverns, Crystal Depths, Frozen Core, Magma Rift, Ancient Ruins, Cosmic Void).
- A boss every 25 layers with a boss bar (e.g. Gummy Golem, Crystal Wyrm, Magma King, Void Leviathan). Miners damage the boss; beating it gives big rewards and a trophy. Keep the existing final layer and boss as the grand finale.
- A Layer Map (the 🗺 button) showing every layer and biome, your current depth, bosses beaten, and treasures found per layer.

═══ 6. EVENTS & GOALS ═══
- Keep "Gold Fever" and add more mine events: Gem Storm (gems everywhere), Cave-In Rush (tap falling rocks for bonus ore), Lucky Lantern (rare rocks more common), Midnight Shift (miners work double speed).
- Mine quests: "Merge to Lv 700", "Reach layer 150", "Beat the Crystal Wyrm", "Find 10 fossils".
- Mine Museum: a collection of every gem, fossil and relic found, with sets that give permanent bonuses.
- Stats tab: highest miner level, total merges, layers cleared, bosses beaten, gems found, time played.

═══ 7. UPGRADES PANEL ═══
- Group upgrades into clear sections: Crew (Starting Crew, Better Hires, Foreman, Night Shift), Treasure (Gem Sense, Gold Pans, luck), Digging (pick power, tap power), Grid (slots, Barracks), each showing current level, effect now, effect at next level, cost, and buy ×1 / ×10 / Max.
- Move Codes into its own tab, with redeemed codes listed.
- No upgrade levels that do nothing: every level keeps increasing its effect.

═══ 8. CASH OUT ═══
- Cash Out still sells all ore for tickets. Show a preview of exactly how many tickets you'll get before confirming, and keep the rule that you can't cash out with zero miners.
- Add "Cash out half" for players who want to keep some ore for upgrades.

═══ RULES ═══
- No real money, no ads. NOTHING resets.
- Keep Learn mode (a question before opening treasure chests gives bonus loot), parent controls, the auto rebirth on/off toggle, prestige, stars, pets, homes, the calendar, business mode, Seasons, maintenance mode and the jonah@wilderland.academy admin working.
- Each game shows only its own admin controls. Deep Mines admin tools: Go to layer, Add ore, Add gems, Spawn boss, Give miner of level X.
- Performance: the scene and grid stay smooth with a full 10×10 grid and auto-merge on, even on low-end computers (respect Performance mode).
- Everything saves and loads after a reload.

Test: Best updates past 100.0M; no numbers are cut off; hired miners are always below your best so merging always works and creates new levels; miners look different at each tier; the three-area layout fills the screen on desktop and works on phones; bosses appear every 25 layers with boss bars; Cash Out shows a preview and is blocked with zero miners; everything saves after a reload.

---
## SPEC E — Couch Co-op (do LAST)
COUCH CO-OP UPDATE for Wilderland Arcade: two players on the SAME device, playing together or against each other. Keep everything that works and every save — NOTHING resets.

═══ 1. HOW 2-PLAYER WORKS ═══
- A "2 Players" button on the arcade floor and on every cabinet that supports it (with a 👥 badge on those cabinets).
- CONTROLS — support all of these:
  • Shared keyboard: Player 1 uses WASD + Space/F, Player 2 uses Arrow keys + Enter/L. Show a control card before each game.
  • Game controllers: support up to 2 gamepads (Xbox/PlayStation/Switch-style controllers through the browser), with auto-detect, "Press any button to join", and a controller icon for each player.
  • Tablets/touch screens: split the screen into two halves with on-screen controls for each player (one at each end of the screen for face-to-face games).
- PLAYER 2 PROFILE: Player 2 can sign in to their own account, pick an existing local profile, or play as a Guest with a chosen name, color and avatar. Each player earns their own tickets, achievements and stats (guests get a summary at the end and can claim rewards by signing in).
- Player colors and name tags so it's always clear who is who.
- Pause works for both players, and either player can quit back to the arcade.

═══ 2. TWO-PLAYER VERSIONS OF EXISTING GAMES ═══
VERSUS:
- Pong & Air Hockey: classic head-to-head, first to 7 or 11.
- Snake Battle: two snakes on one board; crash into the other and you lose.
- Connect 4, Tic-Tac-Toe, Memory Match, Critter Cards: pass-and-play turns on one screen.
- Snowball Duel: 1v1 snowball fight with walls and power-ups, best of 3 rounds.
- Pinecone Rally: split-screen race (top/bottom or left/right).
- Typing Race & Reaction Test: side-by-side races.
- Carnival Toss & Pine Pinball: take turns, highest score wins.
- Bubble Pop & Gem Match: split screen; clearing combos sends junk to the other player.

CO-OP:
- Breakout Co-op: two paddles, one shared wall of bricks.
- Maze Muncher Co-op: two players clear the maze together.
- Trailhead Defense Co-op: one shared map, each player with their own gold, cursor and towers (the second player uses a gamepad, arrows, or their half of the touch screen).
- Deep Mines Co-op: both players tap and merge on a shared grid.
- Snow Kingdom Co-op: Player 2 joins as a teammate (any unlocked character) in the open world, with a shared camera that zooms out to fit both players, or split-screen when they move far apart. Story progress saves to Player 1; Player 2 earns loot and XP.
- Comet Dash & Star Ranger: two ships on screen together.

═══ 3. NEW PARTY GAMES ═══
Add a "Party Pavilion" cabinet with at least 12 quick 2-player mini-games (30 seconds to 2 minutes each), with original names and art:
- Light Trails (leave a trail; don't crash into either trail)
- Sumo Snowmen (push the other off a frozen platform)
- Tug of War (mash buttons)
- Hot Potato Pinecone (pass it before it pops)
- Fishing Frenzy (who catches more in 60 seconds)
- Gopher Bonk Battle (whack your own color only)
- Paint the Floor (cover the most ground in your color)
- Balloon Pop Duel
- Quick Draw (press first when the signal appears, but not too early)
- Bomb Tag
- Stack Race (stack blocks higher without toppling)
- Ice Hockey Mini
- Math Duel (Learn mode: first to answer correctly scores)
- Spelling Bee Battle (Learn mode)
Plus a "Party Night" mode: play 5 random mini-games in a row with a running scoreboard and a winner's podium at the end.

═══ 4. CONTROLLER SUPPORT FOR SINGLE PLAYER TOO ═══
While adding gamepads, let one player use a controller in every game and on the arcade floor (walk with the stick, A to play, B to go back), with controller prompts on screen.

═══ 5. REWARDS & STATS ═══
- Tickets for both players, balanced with single-player.
- Head-to-head records between profiles ("Jonah vs Ashton: 12–9").
- 2-player achievements: "Best Buds" (win 10 co-op games), "Rivalry" (play 25 versus matches against the same player), "Party Animal" (finish a Party Night), and more (bronze → diamond).
- A Couch Co-op prize set and titles like "Co-op Champion".

═══ RULES ═══
- No real money, no ads. NOTHING resets.
- Each game shows only its own admin controls.
- Keep Learn mode (Learn questions can appear for both players), parent controls, the auto rebirth on/off toggle, prestige, stars, pets, homes, the calendar, business mode, Seasons, maintenance mode and the jonah@wilderland.academy admin working.
- Performance: 2-player and split-screen games stay smooth on low-end computers and tablets (respect Performance mode).
- Everything saves and loads after a reload, for both players.

Test: shared keyboard, two gamepads and split touch controls all work; Player 2 can sign in, pick a profile or play as guest; every 👥 game works in 2-player mode; co-op Trailhead Defense, Deep Mines and Snow Kingdom work with two players; all Party Pavilion mini-games and Party Night work; both players get their own tickets and achievements; head-to-head records save; controllers work in single-player and on the arcade floor.

---
## Raid Season spec (done except online/couch raids — for reference)
HUGE RAID UPDATE for SNOWBALL SHOWDOWN: "Raid Season". Turn raids into a big, replayable endgame. Keep everything in the Snow Kingdom (Loki, Mau Mau the Royal Guard, Dumpling, Spirits of the Snow, side stories, sieges, base, existing raids like Loki's Sunken Library) and every save — NOTHING resets.

═══ 1. FIXES ═══
- OBJECTIVE NOT VISIBLE: In Loki's Sunken Library Floor 2, the quest says "defeat the guardian" but there's no guardian on screen and nothing points to it. Every raid objective must have a waypoint arrow, a marker on the minimap, and a short banner when you enter a floor ("The Guardian awaits in the Reading Hall").
- HOTBAR OVERLAP: The bottom buttons overlap (Journal and Skills run into each other). Space the hotbar evenly so no buttons overlap at any screen size; let it shrink to icons-only on small screens.
- TEAM BUNCHING: Teammates still stack on top of each other (Maya, Mau Mau and Ava). Keep them in a spread-out formation, and push them apart if they overlap.
- EMPTY ROOMS: Raid rooms look empty and don't match their theme. Every raid room must be fully decorated to match its raid (see Part 3).

═══ 2. RAID HUB: "THE WAR TABLE" ═══
- A new hub in Frostpine Castle where you choose raids, difficulty and party, see weekly modifiers and lockouts, check the raid leaderboard, and spend raid currency at the Raid Quartermaster.
- Party setup: up to 4 players. Play with AI teammates (Mau Mau, Bau Bau, Sam, Ava, Leo, Maya and others), with real players online (using the existing Firebase setup, with matchmaking and invite codes), or with a couch co-op partner.
- Party roles shown clearly: Tank (Mau Mau's specialty), Healer, Damage, Support. AI teammates fill missing roles automatically.

═══ 3. RAIDS (at least 10, each 5–8 floors with a raid boss at the end) ═══
Every raid has its own theme, full room decoration, enemies, puzzles, mini-bosses and a final boss with phases and a boss bar:
1. Loki's Sunken Library (keep and expand to 6 floors): flooded bookshelves, floating books, glowing runes, ink puddles, a frozen reading hall. Guardian: the Living Encyclopedia. Final boss: an empowered Loki the golden retriever sorcerer.
2. The Frozen Catacombs: icy tombs, candles, rattling bone-ice skeletons. Boss: the Crypt Warden.
3. The Spirit Labyrinth: shifting walls, glowing paths, spirit traps. Boss: the Maze Mind.
4. Storm Peak Citadel: lightning towers, wind bridges. Boss: the Thunderhawk.
5. The Yeti King's Vault: gold piles, trapped treasure. Boss: the Yeti King and his Twin Guards.
6. Mau Mau's Nightmare Kitchen (funny raid): giant food enemies, jelly floors, a cake that fights back. Boss: the Mega Meatloaf.
7. The Sunken Ice Temple: underwater halls, air bubbles, tide puzzles. Boss: the Glacier Leviathan.
8. Gecko's Hollow: swampy frozen lair full of Dumpling's minions. Boss: Dumpling's Shadow.
9. The Clockwork Glacier: gears, timed traps, ice robots. Boss: the Frost Engine.
10. The Void Rift (hardest): floating platforms in space, gravity flips. Boss: the Void Herald.
Add more raids later in the same style.

═══ 4. REAL RAID BOSS MECHANICS ═══
Bosses should feel like real raid fights, not just big enemies:
- Telegraphed attacks: red zones on the floor before big hits, giving time to dodge.
- Phases at health thresholds, with arena changes.
- Adds (minion waves) that must be handled.
- Tank mechanics: the boss targets the tank; if the tank goes down, it hits everyone.
- Stack and spread mechanics: "stack together to share the hit" and "spread out or chain freeze".
- Interrupts: certain spells must be stopped by hitting the boss with a charged snowball in time.
- Puzzles mid-fight: light the four braziers, flip runes in the right order.
- Enrage timer: if the fight takes too long, the boss gets much stronger.
- Boss bars with phase markers, and layered bars for the hardest raids.

═══ 5. DIFFICULTIES & WEEKLY MODIFIERS ═══
- Difficulties: Normal, Heroic, Mythic, and Nightmare (Nightmare unlocks after beating Mythic). Higher difficulties add new mechanics, not just more health, and give better loot.
- Weekly modifiers (keep "Treasure Week" and "Speedy Snowballs" and add more): Blizzard (low visibility), Explosive (enemies burst when defeated), Bolstering (enemies get stronger when allies fall), Frozen Floor (slippery), Glass Snowballs (double damage dealt and taken), Mau Mau's Hungry (feeding Mau Mau gives huge buffs).
- Raid Keys: after a run you get a key for a higher level; each key level adds difficulty and better rewards (no limit on levels).

═══ 6. LOOT & PROGRESSION ═══
- Raid loot: gear sets with set bonuses (e.g. Royal Guard Set, Librarian's Set, Stormcaller Set), legendary snowball weapons with special effects, rare pets, mounts, cosmetics and titles.
- Gear Score shown on your character; raids recommend a Gear Score.
- Raid Tokens (currency) from every run, spent at the Raid Quartermaster for guaranteed items so bad luck doesn't block progress.
- Weekly lockout: bosses give their best loot once per week per difficulty, with a weekly chest of rewards.
- Boss trophies for your base's trophy hall.

═══ 7. COMPETITION ═══
- Raid leaderboards: fastest clear for each raid and difficulty, highest key level, and a "World First" banner for the first player or team to clear a new raid on Mythic.
- Raid achievements (bronze → diamond): no-death clears, every boss on every difficulty, all set pieces, highest key levels.
- Titles like "Raid Leader", "Library Champion", "Nightmare Conqueror".

═══ 8. LOOK & FEEL ═══
- Every raid has its own music, lighting and particle effects (dripping water, floating pages, lightning, falling ash).
- Boss intros with a short cutscene and name card.
- Big hit effects, screen shake, and a dramatic victory screen with loot reveal.
- Clear UI: party health frames on the left, boss bar at the top, cooldowns on the hotbar, a raid timer, and floor progress.

═══ RULES ═══
- No real money, no ads. NOTHING resets.
- Hearts have no cap.
- Keep Learn mode (optional question chests on each floor), parent controls, the auto rebirth on/off toggle, prestige, stars, pets, homes, the calendar, business mode, Seasons, maintenance mode and the jonah@wilderland.academy admin working.
- Each game shows only its own admin controls. Raid admin tools: Teleport to raid floor, Spawn raid boss, Skip phase, Give gear, Set key level, Reset weekly lockout.
- Performance: raids with 4 players, adds and effects stay smooth on low-end computers (respect Performance mode).
- Everything saves and loads after a reload, including raid progress, keys and lockouts.

Test: raid objectives always have a waypoint; no hotbar buttons overlap; teammates don't stack; every raid room is decorated to its theme; all 10 raids are beatable on Normal; boss mechanics work (telegraphs, adds, interrupts, stack/spread, enrage); difficulties, weekly modifiers and raid keys work; loot, tokens and lockouts save; 4-player raids work with AI, online players and couch co-op; leaderboards update.