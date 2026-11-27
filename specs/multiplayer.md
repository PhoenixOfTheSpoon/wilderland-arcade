SNOW KINGDOM MULTIPLAYER: ARENA (equal stats + classes) + RAID GROUPS (3–5 players) (publish to PhoenixOfTheSpoon/wilderland-arcade, bump BUILD)

═══ PART 1: MULTIPLAYER ARENA ═══
EVERYONE IS EQUAL
- In the Arena, everyone has the SAME base stats and equipment. Gear, upgrades, skills, Threat, base rooms, hearts and Frost Crystal upgrades are all ignored.
- This is TEMPORARY and Arena-only. When you leave, you go back to your normal character exactly as you were. Nothing from your real save changes, and no Arena stats leak out.

CLASSES
- Before each match, pick a class. Every class gets exactly 10 spending points to put into its own class talents and stats (damage, health, speed, snowball capacity, reload, ability power, ability cooldown).
- Show the point spend clearly with a reset button. Save each player's last build per class.
- At least 6 classes, each with a unique custom-art look, a signature ability and an ultimate:
  - Brawler: close range, knockback.
  - Frost Sniper: long range, charged shots.
  - Blizzard Mage: area control, slow zones.
  - Guardian: tank, ice shield for allies.
  - Trickster: dash, decoys, invisibility.
  - Medic: heals allies with cocoa bursts.
- Balance so no class or build wins every time. Every ability is telegraphed and counterable.

MODES AND MAPS
- Modes: Free-for-All (up to 8), Team Battle (2v2, 3v3, 4v4), King of the Hill, Capture the Flag.
- At least 4 arena maps with different layouts (frozen lake, castle courtyard, mountain pass, the burning ruins of Ember Springs).
- Short matches (3–6 min).
- Respawns after 5 s.
- End-of-match scoreboard and MVP.

ARENA REWARDS
- Arena Rank (separate leaderboard), cosmetics, titles and a SMALL amount of Frost Crystals per match (daily cap).
- Never gear or stats.

═══ PART 2: RAID GROUPS ═══
- Players band together to raid a dungeon: the War Table raids and any raid dungeons in the game.
- Party size: up to 5 (max). Recommended 3–5. Show "Recommended: 3–5 players" before starting.
- In raid groups, players use THEIR OWN real gear and stats (unlike the Arena).
- Group raid bosses (and elite raid enemies) scale with party size:
  - 3 players: ×3 HP and ×3 damage. 4 players: ×4. 5 players: ×5.
  - 1–2 players can still try, at the ×3 minimum (that's why 3–5 is recommended).
  - Threat scaling still applies on top, based on the party's average highest Gear Score.
- Rewards: group raids give 10× the normal raid rewards (loot, keys, Frost Crystals, XP). Every player gets their OWN loot rolls (no stealing). Show the 10× clearly.
- Boss rules still apply: telegraphed attacks, safe gaps, breathers, projectile cap. Add group mechanics:
  - spread-out attacks, stack-up attacks, targets only a teammate can break;
  - a "revive a downed teammate by standing next to them" mechanic.
- Knockouts in raids:
  - a downed player can be revived by teammates, or respawns after 10 s;
  - if EVERYONE is down at once, it's a wipe and the boss refills to the top of its current phase.
- If a player disconnects, the others continue. Boss HP rescales down to the new party size (never below ×3); they can rejoin with the same code.

═══ PART 3: LOBBIES, PARTIES AND SAFETY ═══
- Join by party code (6 letters) or quick-match into an open lobby. Show usernames and class/gear power.
- Party leader can start, kick and set the raid or arena mode.
- Kid-safe: in matches and parties, only PRESET quick messages ("Nice shot!", "Help!", "Revive me!", "Good game") plus the existing filtered arcade chat. No new free-text chat.
- Admin (Snow Kingdom only): see live lobbies, close any lobby, kick a player, mute.
- Mutes and maintenance mode apply here too.

═══ PART 4: HOW IT WORKS ON FIREBASE (IMPORTANT) ═══
- Do NOT stream live positions through Firestore: it would burn through the free daily write limit in one match.
- Use Firebase Realtime Database for live match/raid state:
  - positions ~10 updates/s, with interpolation and prediction so it feels smooth;
  - the party leader's game runs the bosses and enemies and shares them;
  - if the leader leaves, another player takes over.
- Use Firestore only for lobbies, results, rewards claims and leaderboards.
- Write security rules for BOTH:
  - only signed-in players;
  - you can only write your own player state;
  - only the party leader writes boss/enemy state;
  - only party members can read or write a party;
  - lobbies auto-expire;
  - admin (jonah@wilderland.academy, Google sign-in) can close anything.
- Put the Realtime Database rules in a new file (database.rules.json). Update firestore.rules for the new Firestore collections.
- Give me step-by-step instructions to turn on Realtime Database in the Firebase console, and DON'T assume it's on. Tell me exactly which rules I need to publish.
- Keep data small; stay inside the Firebase free plan for a school-sized player count.
- Must work on school Wi-Fi (no peer-to-peer connections that school networks block).

═══ TEST ═══
- Two browsers in the same Arena match: same stats, different classes, 10 points each.
- Leaving the Arena restores my real character exactly.
- A 3-player raid: boss ×3 HP/damage and 10× rewards each.
- A 5-player raid: ×5.
- Disconnect/rejoin works; leader handoff works.
- Smooth on a school Chromebook and a phone.
- Nothing in anyone's real save changes from the Arena.

ALWAYS:
- Never reset or delete progress; migrate old saves.
- The Snow Kingdom has NO heart cap outside the Arena (the Arena uses its own equal stats).
- Snow Kingdom upgrades cost Frost Crystals; the Workshop only has ticket boosters for it.
- No emojis for characters, classes or bosses.
- Original music for the Arena and group raids (not "Hex Pup Hustle").
- No real money, no ads.
- Each game shows only its own admin controls.
- Must work on phones and school Chromebooks and save after a reload.