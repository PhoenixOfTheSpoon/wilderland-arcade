DEEP MINES OVERHAUL: "BEYOND THE ARMAGEDDON CORE" (publish to PhoenixOfTheSpoon/wilderland-arcade, bump BUILD)

Deep Mines (games-idle.js) ends at Layer 300 with The Armageddon Core, and its numbers stop at 1e300. Calming the Core is now the END OF ACT I. Underneath it is a whole new world.

═══ 1. BIGGER NUMBERS (do this first) ═══
- Replace the 1e300 clamp with a big-number system (mantissa + exponent) so ore, miner output and costs can go far past 1e300 (to at least 1e10000) without ever showing Infinity or NaN.
- Formatting: K, M, B… then e-notation (e.g. 4.2e1520), with a setting for full letters vs e-notation.
- Migrate every old save exactly: same ore, miners, layer, Core status.
- Leaderboard and tickets:
  - Never post a number above 1e300 to Firestore. Post DEPTH (deepest layer reached) for the Deep Mines board instead, and tell me the new max so I can update the score cap.
  - Arcade ticket payouts from Deep Mines keep their current balance; bigger ore must NOT flood the arcade with tickets.

═══ 2. THE STORY CONTINUES ═══
- When the Core calms, it cracks open. The Core was never the bottom: it was a SEAL.
- Dot the Mole and the miners go through into THE UNDERNEATH: a hollow world inside the world, with its own upside-down sky, ancient machines and things that have been waiting a very long time.
- New story with Dot and new characters (custom art, no emojis), for example:
  - a lost expedition from 1,000 years ago;
  - the Keepers who built the seal;
  - a mysterious voice that knows Dot's name.
- Dark and mysterious is fine, no gore.
- At least 3 new ACTS, Layers 301–700:
  - ACT II · The Underneath (301–400): inverted caverns, glowing fungus skies, the lost expedition's camps.
  - ACT III · The Engine Halls (401–550): ancient clockwork machines, steam rivers, the Keepers' story.
  - ACT IV · The Primordial Deep (551–699): where the world was born. Raw elements, crystal storms, time going wrong.
  - Layer 700 · THE ORIGIN ENGINE: the final machine that keeps the world spinning; a multi-phase finale.
- After Layer 700: THE ENDLESS ABYSS, infinite procedurally generated layers with rising rewards and a depth leaderboard.

═══ 3. NEW BIOMES + MECHANICS ═══
- At least 15 new biomes after the Core, each with its own look, ore colors, tap-thing, hazard and trait, like the existing 21. For example:
  - Mirror Caverns: tap reflections, not the real rock.
  - Gravity Wells: ore falls upward.
  - Clockwork Vaults: tap gears in rhythm.
  - Steam Rivers: open valves.
  - Time Fractures: layers rewind unless you seal the cracks.
  - Living Crystal: it grows back, dig fast.
  - Echo Tunnels: follow the sound.
  - Starseed Caves, Elemental Storms, and more.
- Every layer still has its own twist (trait) and scenery.
- MINE BOSSES every 25 layers (Guardians, Keeper machines, the expedition's lost leader), following the boss rules:
  - telegraphed attacks (at least 0.6 s wind-up), real mechanics, no spam;
  - fair on a phone or Chromebook tap screen.
- Learn mode: math geodes keep going, harder after Layer 300, still respecting parent controls.

═══ 4. NEW PROGRESSION ═══
- New miner tiers after "Wilderland Titan": named Underneath miners up to the max level, with new art and colors (no more endless "Titan Mk" numbers).
- CORE SHARDS: a new Deep Mines currency from bosses, the Core and deep layers. Spent on:
  - the RESEARCH TREE (automation, offline time, merge bonuses, boss damage, biome mastery);
  - DEPTH RELICS: equippable mine relics, 3 slots, each with its own bonus.
- Multiple mine SHAFTS (unlock up to 3): dig different depths at once.
- Quality of life:
  - Auto-merge toggle (unlocked by research), merge-all button, buy max;
  - offline earnings (capped by research, never more than 24 h);
  - a "next goal" tracker;
  - a depth map covering all acts.
- Rebirths still raise max miner level as now; keep the auto rebirth on/off toggle.

═══ 5. GRAPHICS + MUSIC ═══
- New layered parallax backgrounds for every new biome, glowing ore, better dig effects, boss intros. Low-effects mode for slow devices.
- Original music for each act, the boss fights and the Origin Engine finale (not "Hex Pup Hustle").

═══ 6. ACHIEVEMENTS + REWARDS ═══
- New achievements for each act, bosses, the Origin Engine and Abyss depth milestones.
- Prizes:
  - Golden Stars buy Wilderland items only.
  - Capsules never contain Cosmic or Wilderland items.
  - Any new Deep Mines prize collection follows the 8 rarities.

═══ TEST ═══
- An old save at Layer 300 with the Core calmed continues into Layer 301 with all ore and miners kept.
- Numbers past 1e300 display and grow correctly.
- Tickets from Deep Mines stay balanced.
- The leaderboard posts depth.
- Bosses are beatable on a phone and a Chromebook.
- Everything saves after a reload.
- Admin (Deep Mines only): jump to any layer, give Core Shards, beat the current boss.

ALWAYS:
- Never reset or delete progress; migrate old saves.
- No real money, no ads.
- Arcade games cap lives at 20.
- Each game shows only its own admin controls.
- No emojis for characters or bosses.
- Must work on phones and school Chromebooks and save after a reload.