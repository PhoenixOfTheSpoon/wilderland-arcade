SNOW KINGDOM: BOSS REVAMP — BOSSES PUSH BACK AGAINST FAST HEALING (publish to PhoenixOfTheSpoon/wilderland-arcade, bump BUILD)

Problem: with a high-level healer teammate plus Minccino's spirit and the Spirit Shrine at Level 12 (and the Spirit Vault), healing is so fast that no boss can keep up. I just stand there and win. Healing in snow-world.js (comp.healT, shrineM(RL('shrine')), the 'vault' room, teammate heal) has no answer in boss fights.

Do NOT nerf the Spirit Shrine, the Spirit Vault, Minccino or healer teammates outside boss fights. Upgrades must still feel worth it. Instead, BOSSES ADAPT to fast healing.

═══ 1. HEALING PRESSURE → BOSS FURY ═══
- During every boss fight, track how much healing the player receives over the last 10 seconds, from every source:
  - Minccino/spirit companions, blessings, healer teammates, Mau Mau, heart drops, treats/food, the Infirmary, outposts, abilities, anything else.
  - Measure it as a share of max hearts, so it works at any heart count (the Snow Kingdom has NO heart cap).
- If healing goes over a "fair" rate (tune it so normal play with a mid-level setup doesn't trigger it), the boss builds FURY (0–100%):
  - Fury raises the boss's damage: up to ×2.5 at 100%, scaling smoothly, and Threat still applies on top.
  - Fury speeds up the boss's attacks a little (wind-ups NEVER shorter than 0.6 s).
  - Fury decays when healing slows down, so playing well with less healing calms the boss.
- Show a Fury meter by the boss bar, with a clear message the first time: "The boss is furious at your healing!"
- No one-shots: a single hit can never take more than 40% of max hearts, however high Fury goes.

═══ 2. ANTI-HEAL MECHANICS (each boss family gets at least one) ═══
- Frostburn: telegraphed attacks that cut healing received by 50% for a few seconds (shown with an icon). Dodge them to keep healing.
- Spirit Dimming: attacks or adds that briefly dim Minccino's spirit (no heals for a few seconds) unless you break the dimming crystal.
- Healer Hunt: bosses and adds target healer teammates and spirit companions. Protect them (Mau Mau's SHIELD BELLY, the Guardian role, pulling aggro with charged throws).
- Overheal Punish: healing past full hearts charges the boss's next special attack instead of being wasted.
- Cleanse Pulse: a telegraphed wave that wipes buffs and healing-over-time; it can be dodged.
- Bosses with Fury above 50% gain one extra mechanic from their Threat extras.

═══ 3. WHERE IT APPLIES ═══
- ALL boss fights: region bosses, side-quest bosses, siege bosses, raid bosses (solo and group raids), keep lords, Dumpling 1–6, the godlike fights, the Gecko God, Lit and the fireball finale, Endless Dungeon bosses.
- Group raids: Fury uses the healing of the whole party per player, so a dedicated healer is fine but a party healing everything instantly isn't.
- Not in the multiplayer Arena (equal stats, PvP). Not on regular enemies.

═══ 4. BALANCE TARGETS ═══
- A player with Spirit Shrine 12 + Vault + top healer teammates still has an advantage, but must dodge and play mechanics.
- Standing still and out-healing the boss must no longer work: in testing, a boss at 100% Fury beats a player who never dodges.
- Fights keep the length targets from the damage overhaul (fake fights 2–4 min, region bosses 2–4 min, raids 4–8 min…).

═══ 5. ADMIN + TEST ═══
- Admin (Snow Kingdom only): show the live healing-per-10s and Fury, force Fury to any %, toggle Fury off for testing.
- Test:
  - Spirit Shrine 12 + Vault + max healer + Minccino, standing still vs a region boss: Fury builds, damage rises, and the player loses if they never dodge.
  - The same setup while dodging and handling mechanics: a fair win.
  - A low-heal setup never triggers Fury.
  - Fury decays when healing drops.
  - Works on a phone and a Chromebook.

ALWAYS:
- Never reset or delete progress.
- The Snow Kingdom has NO heart cap.
- Snow Kingdom upgrades cost Frost Crystals; the Workshop only has ticket boosters for it.
- Keep the boss rules (telegraphs, safe gaps, breathers, projectile cap, knockout rule).
- No emojis for characters or bosses.
- No real money, no ads.
- Each game shows only its own admin controls.
- Must work on phones and school Chromebooks and save after a reload.